// evaluer.js — évaluation vectorisée du modèle.
//
// Chaque nœud renvoie un scalaire ou un Float64Array de N échantillons.
// Une variable n'est évaluée qu'une fois : c'est ce qui préserve les
// corrélations quand une hypothèse est réutilisée à plusieurs endroits.

import { RNG, Z90 } from './rng.js';
import { ErreurModele } from './lang.js';

const estVec = (x) => x instanceof Float64Array;

function vecteur(x, N) {
  if (estVec(x)) return x;
  const v = new Float64Array(N);
  v.fill(x);
  return v;
}

function binaire(a, b, N, f) {
  if (!estVec(a) && !estVec(b)) return f(a, b);
  const out = new Float64Array(N);
  if (estVec(a) && estVec(b)) { for (let i = 0; i < N; i++) out[i] = f(a[i], b[i]); }
  else if (estVec(a)) { for (let i = 0; i < N; i++) out[i] = f(a[i], b); }
  else { for (let i = 0; i < N; i++) out[i] = f(a, b[i]); }
  return out;
}

function unaireF(a, N, f) {
  if (!estVec(a)) return f(a);
  const out = new Float64Array(N);
  for (let i = 0; i < N; i++) out[i] = f(a[i]);
  return out;
}

export function quantile(tri, p) {
  const n = tri.length;
  if (n === 0) return NaN;
  const pos = (n - 1) * p;
  const bas = Math.floor(pos), haut = Math.ceil(pos);
  if (bas === haut) return tri[bas];
  return tri[bas] + (tri[haut] - tri[bas]) * (pos - bas);
}

export function trier(v) {
  const c = Float64Array.from(v);
  c.sort();
  return c;
}

export function moyenne(v) {
  let s = 0;
  for (let i = 0; i < v.length; i++) s += v[i];
  return s / v.length;
}

export function variance(v, m = moyenne(v)) {
  let s = 0;
  for (let i = 0; i < v.length; i++) { const d = v[i] - m; s += d * d; }
  return s / v.length;
}

// --- Fonctions du langage ---------------------------------------------------

const DETERMINISTES = {
  min: (N, ...a) => a.reduce((x, y) => binaire(x, y, N, Math.min)),
  max: (N, ...a) => a.reduce((x, y) => binaire(x, y, N, Math.max)),
  abs: (N, x) => unaireF(x, N, Math.abs),
  exp: (N, x) => unaireF(x, N, Math.exp),
  log: (N, x) => unaireF(x, N, Math.log),
  ln: (N, x) => unaireF(x, N, Math.log),
  log10: (N, x) => unaireF(x, N, Math.log10),
  sqrt: (N, x) => unaireF(x, N, Math.sqrt),
  racine: (N, x) => unaireF(x, N, Math.sqrt),
  arrondi: (N, x) => unaireF(x, N, Math.round),
  round: (N, x) => unaireF(x, N, Math.round),
  plancher: (N, x) => unaireF(x, N, Math.floor),
  floor: (N, x) => unaireF(x, N, Math.floor),
  plafond: (N, x) => unaireF(x, N, Math.ceil),
  ceil: (N, x) => unaireF(x, N, Math.ceil),
  signe: (N, x) => unaireF(x, N, Math.sign),
  mod: (N, x, y) => binaire(x, y, N, (a, b) => a % b),
  pow: (N, x, y) => binaire(x, y, N, Math.pow),
  puissance: (N, x, y) => binaire(x, y, N, Math.pow),
  // Somme d'une série géométrique : capitalisation / actualisation.
  //   cumul(t, a) = 1 + (1+t) + … + (1+t)^(a-1)
  cumul: (N, taux, annees) => binaire(taux, annees, N, (t, a) =>
    Math.abs(t) < 1e-12 ? a : (Math.pow(1 + t, a) - 1) / t),
  // Valeur acquise d'un versement annuel qui croît de `g` et se place à `r` :
  //   serie(r, g, a) = Σ_{k=1..a} (1+g)^(k-1) (1+r)^(a-k)
  // C'est ce qu'il faut pour comparer un loyer qui monte à un capital qui rapporte.
  serie: (N, r, g, a) => {
    const f = (r_, g_, a_) => (Math.abs(r_ - g_) < 1e-9
      ? a_ * Math.pow(1 + r_, a_ - 1)
      : (Math.pow(1 + r_, a_) - Math.pow(1 + g_, a_)) / (r_ - g_));
    if (!estVec(r) && !estVec(g) && !estVec(a)) return f(r, g, a);
    const R = estVec(r) ? (i) => r[i] : () => r;
    const G = estVec(g) ? (i) => g[i] : () => g;
    const A = estVec(a) ? (i) => a[i] : () => a;
    const out = new Float64Array(N);
    for (let i = 0; i < N; i++) out[i] = f(R(i), G(i), A(i));
    return out;
  },
};

// Nombre d'arguments attendus. « max() » sans rien plantait sur une exception
// interne, et « abs() » rendait NaN sans un mot.
const ARITE = {
  min: [1, Infinity], max: [1, Infinity], mod: [2, 2], pow: [2, 2], puissance: [2, 2],
  cumul: [2, 2], serie: [3, 3],
  unif: [2, 2], uniforme: [2, 2], uniform: [2, 2], normale: [2, 2], normal: [2, 2],
  lognormale: [1, 2], lognormal: [1, 2], beta: [2, 2], bernoulli: [1, 1], pile: [1, 1],
  poisson: [1, 1], triangulaire: [3, 3],
};
const arite = (nom) => ARITE[nom] || [1, 1];

const ALEATOIRES = new Set([
  'unif', 'uniforme', 'uniform', 'normale', 'normal', 'lognormale', 'lognormal',
  'beta', 'bernoulli', 'pile', 'poisson', 'triangulaire',
]);

// Les résumés d'une simulation, et leurs noms anglais.
const AGREGATS = {
  esperance: 'moyenne', 'espérance': 'moyenne', moyenne: 'moyenne', average: 'moyenne', mean: 'moyenne',
  proba: 'proba', probability: 'proba',
  mediane: 'mediane', 'médiane': 'mediane', median: 'mediane',
  ecart_type: 'ecart_type', 'écart_type': 'ecart_type', stdev: 'ecart_type', sd: 'ecart_type', std: 'ecart_type',
};

// Distance d'édition, plafonnée : inutile de calculer au-delà du seuil qu'on
// s'autorise, et ça évite de suggérer un nom qui n'a rien à voir.
function distance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prec = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let meilleur = i;
    for (let j = 1; j <= b.length; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prec[j] + 1, cur[j - 1] + 1, prec[j - 1] + c);
      if (cur[j] < meilleur) meilleur = cur[j];
    }
    if (meilleur > max) return max + 1;
    prec = cur;
  }
  return prec[b.length];
}

// Le nom défini le plus proche : la casse d'abord — « Loyer » contre « loyer »
// est la faute la plus fréquente et la plus invisible — puis l'orthographe.
function plusProche(nom, candidats) {
  const bas = nom.toLowerCase();
  const memeCasse = candidats.find((c) => c.toLowerCase() === bas);
  if (memeCasse) return memeCasse;
  const max = nom.length <= 4 ? 1 : nom.length <= 8 ? 2 : 3;
  let meilleur = null, d = max + 1;
  for (const c of candidats) {
    const e = distance(bas, c.toLowerCase(), max);
    if (e < d) { d = e; meilleur = c; }
  }
  return meilleur;
}

// --- Contexte d'évaluation --------------------------------------------------

class Contexte {
  constructor(ast, { N, graine, remplacements, elargissement, uniformeBernoulli }) {
    this.ast = ast;
    this.N = N;
    this.rng = new RNG(graine);
    // Pendant un balayage de seuil, les tirages tout ou rien ne sont pas figés
    // à leur médiane — ce serait balayer en supposant que le sinistre n'arrive
    // jamais. Ils sont retirés sur une suite stratifiée déterministe, et le
    // résultat est moyenné : voir `balayer` dans moteur.js. Décalage en
    // nombre d'or d'une pièce à l'autre, sinon deux pièces tomberaient
    // toujours du même côté ensemble.
    this.uniformeBernoulli = uniformeBernoulli || null;
    this.compteurPiece = 0;
    this.remplacements = remplacements || null;
    this.elargissement = elargissement || 1;
    this.decls = new Map();
    for (const d of ast.declarations) this.decls.set(d.nom, d);
    this.cache = new Map();
    this.enCours = new Set();
    this.sources = [];
    this.compteurSource = 0;
    this.nomCourant = null;
  }

  // Étire une distribution autour de sa médiane, d'un facteur k.
  // Sert à répondre : « et si mes fourchettes étaient trop étroites ? »
  // Sur un support strictement positif l'étirement est multiplicatif — une
  // fourchette « 900 à 1150 » élargie deux fois devient « 795 à 1300 », jamais
  // négative. Ailleurs il est additif. Dans les deux cas la médiane ne bouge
  // pas et l'ordre des tirages est préservé : on élargit le doute, on ne
  // déplace pas l'avis.
  elargir(valeurs) {
    const k = this.elargissement;
    if (k === 1 || !(valeurs instanceof Float64Array)) return valeurs;
    const tri = trier(valeurs);
    const m = quantile(tri, 0.5);
    const N = valeurs.length;
    const out = new Float64Array(N);
    if (tri[0] > 0 && m > 0) {
      for (let i = 0; i < N; i++) out[i] = m * Math.pow(valeurs[i] / m, k);
    } else {
      for (let i = 0; i < N; i++) out[i] = m + k * (valeurs[i] - m);
    }
    return out;
  }

  // Chaque tirage aléatoire est une « source d'incertitude » adressable :
  // c'est l'unité sur laquelle porte toute l'analyse en aval.
  source(nom, ligne, produire, meta = {}) {
    const id = 's' + this.compteurSource++;
    let valeurs;
    if (this.remplacements && Object.prototype.hasOwnProperty.call(this.remplacements, id)) {
      valeurs = this.remplacements[id];
    } else {
      valeurs = produire();
      // Une probabilité ou un comptage ne s'élargit pas comme une fourchette :
      // on ne touche qu'aux lois continues et non bornées par construction.
      if (meta.elargissable) valeurs = this.elargir(valeurs);
    }
    let base = this.nomCourant || nom;
    let etiquette = base;
    let k = 2;
    while (this.sources.some((s) => s.nom === etiquette)) etiquette = `${base} (${k++})`;
    this.sources.push({ id, nom: etiquette, ligne, valeurs, ...meta });
    return valeurs;
  }

  variable(nom, ligne) {
    if (this.cache.has(nom)) return this.cache.get(nom);
    const d = this.decls.get(nom);
    if (!d) {
      // Neuf fois sur dix c'est une faute de frappe ou une majuscule perdue, et
      // le visiteur relit trois fois la bonne ligne sans voir la différence.
      const suggestion = plusProche(nom, [...this.decls.keys()]);
      throw new ErreurModele(
        `« ${nom} » n'est défini nulle part`
        + (suggestion ? ` — vouliez-vous dire « ${suggestion} » ?` : ''), ligne);
    }
    if (this.enCours.has(nom)) {
      throw new ErreurModele(`« ${nom} » se définit à partir de lui-même`, d.ligne);
    }
    this.enCours.add(nom);
    const precedent = this.nomCourant;
    this.nomCourant = nom;
    const v = this.evaluer(d.expr);
    this.nomCourant = precedent;
    this.enCours.delete(nom);
    this.cache.set(nom, v);
    return v;
  }

  evaluer(n) {
    const N = this.N;
    switch (n.k) {
      case 'nombre': return n.v;
      case 'var': return this.variable(n.nom, n.ligne);
      case 'neg': return unaireF(this.evaluer(n.e), N, (x) => -x);
      case 'non': return unaireF(this.evaluer(n.e), N, (x) => (x ? 0 : 1));

      case 'si': {
        const c = this.evaluer(n.cond);
        const a = this.evaluer(n.oui);
        const b = this.evaluer(n.non);
        if (!estVec(c) && !estVec(a) && !estVec(b)) return c ? a : b;
        const out = new Float64Array(N);
        const cv = vecteur(c, N);
        for (let i = 0; i < N; i++) {
          out[i] = cv[i] ? (estVec(a) ? a[i] : a) : (estVec(b) ? b[i] : b);
        }
        return out;
      }

      case 'bin': {
        const g = this.evaluer(n.g);
        const d = this.evaluer(n.d);
        const f = {
          '+': (a, b) => a + b,
          '-': (a, b) => a - b,
          '*': (a, b) => a * b,
          '/': (a, b) => a / b,
          '^': (a, b) => Math.pow(a, b),
          '>': (a, b) => (a > b ? 1 : 0),
          '<': (a, b) => (a < b ? 1 : 0),
          '>=': (a, b) => (a >= b ? 1 : 0),
          '<=': (a, b) => (a <= b ? 1 : 0),
          '==': (a, b) => (a === b ? 1 : 0),
          '!=': (a, b) => (a !== b ? 1 : 0),
          'et': (a, b) => (a && b ? 1 : 0),
          'ou': (a, b) => (a || b ? 1 : 0),
        }[n.op];
        return binaire(g, d, N, f);
      }

      case 'intervalle': {
        const bas = this.evaluer(n.bas);
        const haut = this.evaluer(n.haut);
        return this.source('incertitude', n.ligne,
          () => this.tirerIntervalle(bas, haut, n),
          { pourcent: !!n.pourcent, elargissable: true });
      }

      case 'appel': return this.appel(n);
      default: throw new ErreurModele('expression non reconnue', n.ligne);
    }
  }

  // `a à b` = intervalle de confiance à 90 %.
  // Bornes strictement positives → lognormale (multiplicatif, jamais négatif).
  // Sinon → normale.
  tirerIntervalle(bas, haut, n) {
    const N = this.N;
    const out = new Float64Array(N);
    const bv = estVec(bas) ? bas : null;
    const hv = estVec(haut) ? haut : null;
    for (let i = 0; i < N; i++) {
      let a = bv ? bv[i] : bas;
      let b = hv ? hv[i] : haut;
      if (a > b) { const t = a; a = b; b = t; }
      const z = this.rng.normal();
      if (a > 0 && b > 0) {
        const mu = (Math.log(a) + Math.log(b)) / 2;
        const sigma = (Math.log(b) - Math.log(a)) / (2 * Z90);
        out[i] = Math.exp(mu + sigma * z);
      } else {
        const mu = (a + b) / 2;
        const sigma = (b - a) / (2 * Z90);
        const v = mu + sigma * z;
        // Écrire « 0 à 100 » veut dire « pas de valeur négative » : on replie
        // la normale plutôt que de rendre des nombres que l'auteur exclut.
        out[i] = a === 0 ? Math.abs(v) : (b === 0 ? -Math.abs(v) : v);
      }
    }
    return out;
  }

  appel(n) {
    const N = this.N;
    const nom = n.nom.toLowerCase();

    if (!AGREGATS[nom] && !DETERMINISTES[nom] && !ALEATOIRES.has(nom)) {
      throw new ErreurModele(`fonction « ${n.nom} » inconnue`, n.ligne);
    }
    {
      const [mini, maxi] = arite(nom);
      if (n.args.length < mini || n.args.length > maxi) {
        const attendu = mini === maxi ? `${mini} argument${mini > 1 ? 's' : ''}`
          : maxi === Infinity ? `au moins ${mini} argument${mini > 1 ? 's' : ''}`
          : `${mini} ou ${maxi} arguments`;
        throw new ErreurModele(`« ${n.nom} » attend ${attendu}, pas ${n.args.length}`, n.ligne);
      }
    }

    if (AGREGATS[nom]) {
      const quoi = AGREGATS[nom];
      const v = this.evaluer(n.args[0]);
      if (!estVec(v)) return quoi === 'ecart_type' ? 0 : v;
      if (quoi === 'proba') return moyenne(v);
      if (quoi === 'mediane') return quantile(trier(v), 0.5);
      if (quoi === 'ecart_type') return Math.sqrt(variance(v));
      return moyenne(v);
    }

    if (DETERMINISTES[nom]) {
      const args = n.args.map((a) => this.evaluer(a));
      return DETERMINISTES[nom](N, ...args);
    }

    if (ALEATOIRES.has(nom)) {
      const args = n.args.map((a) => this.evaluer(a));
      const lire = (k, defaut) => {
        const a = args[k];
        if (a === undefined) {
          if (defaut === undefined) throw new ErreurModele(`« ${n.nom} » attend plus d'arguments`, n.ligne);
          return () => defaut;
        }
        return estVec(a) ? (i) => a[i] : () => a;
      };
      const CONTINUES = new Set(['unif', 'uniforme', 'normale', 'normal',
        'lognormale', 'lognormal', 'triangulaire']);
      // Un paramètre impossible donne un tirage plausible et faux : bernoulli(120 %)
      // vaut toujours 1, triangulaire(1, 5, 3) sort de ses propres bornes.
      const borne = (k, test, message) => {
        const a = args[k];
        const mauvais = estVec(a) ? a.some((x) => !test(x)) : !test(a);
        if (mauvais) throw new ErreurModele(`« ${n.nom} » : ${message}`, n.ligne);
      };
      // Sous élargissement, ce n'est plus le visiteur qui écrit le paramètre :
      // c'est nous qui étirons ses fourchettes pour demander « et si elles
      // étaient trop étroites ? ». Une probabilité écrite « 15 % à 35 % » et
      // élargie six fois sort de [0, 1], et « bernoulli » refusait — la passe
      // de robustesse plantait sur le modèle d'appel d'offres. On la ramène
      // dans ses bornes : au-delà, « plus large » veut dire « certain ».
      // Hors élargissement, le refus reste, et il est utile : « bernoulli(120 %) »
      // valait 1 à tous les coups, sans un mot.
      // On copie plutôt qu'on n'écrase : `args[k]` est le vecteur en cache de
      // la variable, donc aussi celui que la source a enregistré.
      const ramener = (k, bas, haut) => {
        if (this.elargissement === 1) return;
        const a = args[k];
        if (estVec(a)) {
          const copie = new Float64Array(a.length);
          for (let i = 0; i < a.length; i++) {
            copie[i] = a[i] < bas ? bas : a[i] > haut ? haut : a[i];
          }
          args[k] = copie;
        } else if (a !== undefined) {
          args[k] = a < bas ? bas : a > haut ? haut : a;
        }
      };
      if (nom === 'bernoulli' || nom === 'pile') {
        ramener(0, 0, 1);
        borne(0, (p) => p >= 0 && p <= 1, 'une probabilité va de 0 à 1 (ou de 0 % à 100 %)');
      } else if (nom === 'poisson') {
        ramener(0, 0, Infinity);
        borne(0, (l) => l >= 0, 'la moyenne ne peut pas être négative');
      } else if (nom === 'triangulaire') {
        const A = estVec(args[0]) ? args[0][0] : args[0];
        const M = estVec(args[1]) ? args[1][0] : args[1];
        const B = estVec(args[2]) ? args[2][0] : args[2];
        if (!(A <= M && M <= B)) {
          throw new ErreurModele(
            `« ${n.nom} » s’écrit (minimum, valeur la plus probable, maximum), dans cet ordre`, n.ligne);
        }
      } else if (nom === 'beta') {
        borne(0, (x) => x > 0, 'les deux paramètres doivent être strictement positifs');
        borne(1, (x) => x > 0, 'les deux paramètres doivent être strictement positifs');
      } else if (nom === 'normale' || nom === 'normal') {
        borne(1, (s) => s >= 0, 'l’écart-type ne peut pas être négatif');
      }
      return this.source(nom, n.ligne, () => {
        const out = new Float64Array(N);
        const r = this.rng;
        switch (nom) {
          case 'unif': case 'uniforme': case 'uniform': {
            const A = lire(0), B = lire(1);
            for (let i = 0; i < N; i++) { const a = A(i), b = B(i); out[i] = a + (b - a) * r.next(); }
            break;
          }
          case 'normale': case 'normal': {
            const M = lire(0), S = lire(1);
            for (let i = 0; i < N; i++) out[i] = M(i) + S(i) * r.normal();
            break;
          }
          case 'lognormale': case 'lognormal': {
            // (médiane, facteur) : IC 90 % = [médiane / facteur, médiane × facteur]
            const M = lire(0), F = lire(1, 2);
            for (let i = 0; i < N; i++) {
              const sigma = Math.log(Math.max(F(i), 1.0000001)) / Z90;
              out[i] = M(i) * Math.exp(sigma * r.normal());
            }
            break;
          }
          case 'beta': {
            const A = lire(0), B = lire(1);
            for (let i = 0; i < N; i++) out[i] = r.beta(A(i), B(i));
            break;
          }
          case 'bernoulli': case 'pile': {
            const P = lire(0);
            if (this.uniformeBernoulli) {
              const decalage = (this.compteurPiece++ * 0.6180339887498949) % 1;
              for (let i = 0; i < N; i++) {
                const u = (this.uniformeBernoulli(i) + decalage) % 1;
                out[i] = u < P(i) ? 1 : 0;
              }
            } else {
              for (let i = 0; i < N; i++) out[i] = r.next() < P(i) ? 1 : 0;
            }
            break;
          }
          case 'poisson': {
            const L = lire(0);
            for (let i = 0; i < N; i++) out[i] = r.poisson(L(i));
            break;
          }
          case 'triangulaire': {
            const A = lire(0), M = lire(1), B = lire(2);
            for (let i = 0; i < N; i++) {
              const a = A(i), m = M(i), b = B(i), u = r.next();
              const c = (m - a) / (b - a);
              out[i] = u < c ? a + Math.sqrt(u * (b - a) * (m - a))
                             : b - Math.sqrt((1 - u) * (b - a) * (b - m));
            }
            break;
          }
        }
        return out;
      }, { elargissable: CONTINUES.has(nom) });
    }

    throw new ErreurModele(`fonction « ${n.nom} » inconnue`, n.ligne);
  }
}

// --- Le détail des calculs --------------------------------------------------
//
// Un tableur montre chaque cellule ; ici, seules les hypothèses et le résultat
// étaient visibles, et « mensualite » ou « cout_achat » restaient des noms sans
// valeur. On rend chaque variable calculée, et pour celles qui sont une somme,
// le poids de chaque terme — c'est la réponse à « quel poste pèse le plus ».

const PRIORITE = {
  ou: 1, et: 2, '>': 3, '<': 3, '>=': 3, '<=': 3, '==': 3, '!=': 3,
  '+': 4, '-': 4, '*': 5, '/': 5, '^': 6,
};

const fr = (x) => x.toLocaleString('fr-FR', { maximumFractionDigits: 4 });

function nombreTexte(n) {
  if (n.pourcent) return fr(n.v * 100) + '\u202f%';
  if (n.suffixe >= 1e9) return fr(n.v / 1e9) + '\u202fMd';
  if (n.suffixe >= 1e6) return fr(n.v / 1e6) + '\u202fM';
  if (n.suffixe >= 1e3) return fr(n.v / 1e3) + '\u202fk';
  return fr(n.v);
}

// L'expression, réécrite lisiblement. Sert d'étiquette à un terme sans nom.
export function imprimer(n, parent = 0) {
  switch (n.k) {
    case 'nombre': return nombreTexte(n);
    case 'var': return n.nom;
    case 'neg': return '-' + imprimer(n.e, 7);
    case 'non': return 'non ' + imprimer(n.e, 7);
    case 'appel': return n.nom + '(' + n.args.map((a) => imprimer(a)).join(', ') + ')';
    case 'intervalle': return imprimer(n.bas, 4) + ' à ' + imprimer(n.haut, 4);
    case 'si': return 'si ' + imprimer(n.cond) + ' alors ' + imprimer(n.oui) + ' sinon ' + imprimer(n.non);
    case 'bin': {
      if (n.mult) return fr(n.g.v * n.d.v);
      const p = PRIORITE[n.op] || 3;
      const droite = imprimer(n.d, p + (n.op === '-' || n.op === '/' ? 1 : 0));
      const t = imprimer(n.g, p) + ' ' + n.op + ' ' + droite;
      return p < parent ? '(' + t + ')' : t;
    }
    default: return '…';
  }
}

// Les termes d'une somme, avec leur signe : « a - b + c » → +a, −b, +c.
function termes(n, signe = 1, acc = []) {
  if (n.k === 'bin' && (n.op === '+' || n.op === '-')) {
    termes(n.g, signe, acc);
    termes(n.d, n.op === '-' ? -signe : signe, acc);
  } else if (n.k === 'neg') {
    termes(n.e, -signe, acc);
  } else {
    acc.push({ signe, expr: n });
  }
  return acc;
}

// Un terme qui tire lui-même au sort ne peut pas être réévalué après coup :
// il produirait d'autres tirages que ceux du calcul. On ne décompose alors pas.
function contientTirage(n) {
  if (!n || typeof n !== 'object') return false;
  if (n.k === 'intervalle') return true;
  if (n.k === 'appel' && ALEATOIRES.has(n.nom.toLowerCase())) return true;
  for (const c of ['e', 'g', 'd', 'cond', 'oui', 'non', 'bas', 'haut']) if (contientTirage(n[c])) return true;
  if (n.args) return n.args.some(contientTirage);
  return false;
}

function estSource(expr) {
  return expr.k === 'intervalle'
    || (expr.k === 'appel' && ALEATOIRES.has(expr.nom.toLowerCase()));
}
const estLitteral = (expr) => expr.k === 'nombre' || (expr.k === 'neg' && expr.e.k === 'nombre');

export function evaluerModele(ast,
  { N = 20000, graine = 20260901, remplacements = null, elargissement = 1, detail = false,
    uniformeBernoulli = null } = {}) {
  const ctx = new Contexte(ast, { N, graine, remplacements, elargissement, uniformeBernoulli });

  // Ordre stable : on force l'évaluation dans l'ordre d'écriture pour que les
  // identifiants de source ne dépendent pas du chemin d'accès.
  for (const d of ast.declarations) ctx.variable(d.nom, d.ligne);

  const options = ast.options.map((o) => {
    ctx.nomCourant = null;
    return { nom: o.nom, valeurs: vecteur(ctx.evaluer(o.expr), N) };
  });

  let sortie = null;
  if (ast.sortie) {
    ctx.nomCourant = null;
    sortie = vecteur(ctx.evaluer(ast.sortie.expr), N);
  }

  let seuil = null, seuilSens = 'min';
  if (ast.seuil) {
    ctx.nomCourant = null;
    const v = ctx.evaluer(ast.seuil.expr);
    seuil = v instanceof Float64Array ? quantile(trier(v), 0.5) : v;
    seuilSens = ast.seuil.sens || 'min';
  }

  const variables = new Map();
  for (const d of ast.declarations) variables.set(d.nom, ctx.cache.get(d.nom));

  let details = null;
  if (detail) {
    ctx.nomCourant = null;
    const decomposer = (expr) => {
      const ts = termes(expr);
      if (ts.length < 2 || ts.some((t) => contientTirage(t.expr))) return null;
      return ts.map((t) => ({
        signe: t.signe, etiquette: imprimer(t.expr), valeurs: ctx.evaluer(t.expr),
      }));
    };
    details = {
      calculs: ast.declarations
        .filter((d) => !estLitteral(d.expr) && !estSource(d.expr))
        .map((d) => ({ nom: d.nom, ligne: d.ligne, valeurs: ctx.cache.get(d.nom), termes: decomposer(d.expr) })),
      options: ast.options.map((o) => ({ nom: o.nom, termes: decomposer(o.expr) })),
      sortie: ast.sortie && !ast.sortie.implicite ? { termes: decomposer(ast.sortie.expr) } : null,
    };
  }

  return { N, sources: ctx.sources, variables, options, sortie, seuil, seuilSens, details };
}
