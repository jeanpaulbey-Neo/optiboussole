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
  plafond: (N, x) => unaireF(x, N, Math.ceil),
  signe: (N, x) => unaireF(x, N, Math.sign),
  mod: (N, x, y) => binaire(x, y, N, (a, b) => a % b),
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

const ALEATOIRES = new Set([
  'unif', 'uniforme', 'normale', 'normal', 'lognormale', 'lognormal',
  'beta', 'bernoulli', 'pile', 'poisson', 'triangulaire',
]);

const AGREGATS = new Set(['esperance', 'espérance', 'moyenne', 'proba', 'mediane', 'médiane', 'ecart_type', 'écart_type']);

// --- Contexte d'évaluation --------------------------------------------------

class Contexte {
  constructor(ast, { N, graine, remplacements }) {
    this.ast = ast;
    this.N = N;
    this.rng = new RNG(graine);
    this.remplacements = remplacements || null;
    this.decls = new Map();
    for (const d of ast.declarations) this.decls.set(d.nom, d);
    this.cache = new Map();
    this.enCours = new Set();
    this.sources = [];
    this.compteurSource = 0;
    this.nomCourant = null;
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
    if (!d) throw new ErreurModele(`« ${nom} » n'est défini nulle part`, ligne);
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
          () => this.tirerIntervalle(bas, haut, n), { pourcent: !!n.pourcent });
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

    if (AGREGATS.has(nom)) {
      const v = this.evaluer(n.args[0]);
      if (!estVec(v)) return nom === 'ecart_type' || nom === 'écart_type' ? 0 : v;
      if (nom === 'proba') return moyenne(v);
      if (nom === 'mediane' || nom === 'médiane') return quantile(trier(v), 0.5);
      if (nom === 'ecart_type' || nom === 'écart_type') return Math.sqrt(variance(v));
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
      return this.source(nom, n.ligne, () => {
        const out = new Float64Array(N);
        const r = this.rng;
        switch (nom) {
          case 'unif': case 'uniforme': {
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
            for (let i = 0; i < N; i++) out[i] = r.next() < P(i) ? 1 : 0;
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
      });
    }

    throw new ErreurModele(`fonction « ${n.nom} » inconnue`, n.ligne);
  }
}

export function evaluerModele(ast, { N = 20000, graine = 20260901, remplacements = null } = {}) {
  const ctx = new Contexte(ast, { N, graine, remplacements });

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

  let seuil = null;
  if (ast.seuil) {
    ctx.nomCourant = null;
    const v = ctx.evaluer(ast.seuil.expr);
    seuil = v instanceof Float64Array ? quantile(trier(v), 0.5) : v;
  }

  const variables = new Map();
  for (const d of ast.declarations) variables.set(d.nom, ctx.cache.get(d.nom));

  return { N, sources: ctx.sources, variables, options, sortie, seuil };
}
