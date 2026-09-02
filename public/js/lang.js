// lang.js — analyse lexicale et syntaxique du langage de modèle.
//
// Le langage tient en une page :
//   nom = expression            une hypothèse ou un calcul
//   a à b                       incertitude : intervalle de confiance à 90 %
//   option "Nom" = expression   une branche de décision à comparer
//   # ...                       commentaire
//
// Tout le reste est de l'arithmétique ordinaire.

export class ErreurModele extends Error {
  constructor(message, ligne) {
    super(message);
    this.ligne = ligne;
  }
}

const MOTS_CLES = new Set([
  'si', 'alors', 'sinon', 'et', 'ou', 'non', 'option', 'choix', 'vrai', 'faux',
  'if', 'then', 'else', 'and', 'or', 'not', 'true', 'false',
]);

// Réglages d'analyse, écrits « nom: valeur ».
const SEUIL = new Set(['seuil', 'objectif', 'cible', 'threshold', 'target', 'goal']);

// L'unité est un libellé libre (« € », « kg CO₂e », « h/semaine ») : elle est
// extraite avant l'analyse lexicale, qui n'a pas à connaître ces symboles.
const LIGNE_UNITE = /^[ \t]*(?:unité|unite|unit)[ \t]*:[ \t]*(.*?)[ \t]*$/i;

function extraireUnite(source) {
  let unite = '';
  const lignes = source.split('\n').map((l) => {
    const m = l.match(LIGNE_UNITE);
    if (!m) return l;
    unite = m[1].replace(/^["«“](.*)["»”]$/, '$1').trim();
    return ''; // ligne neutralisée : les numéros de ligne restent justes
  });
  return { source: lignes.join('\n'), unite };
}

// `à` sert d'opérateur d'intervalle ; les variantes ASCII sont acceptées.
const INTERVALLE = new Set(['à', 'a', '~', '..', 'to']);

const SUFFIXES = { k: 1e3, K: 1e3, M: 1e6, m: 1e6, G: 1e9, Md: 1e9, md: 1e9, Mds: 1e9 };

const MULTIPLICATEURS_MOTS = {
  'pourcent': 0.01, 'pourcents': 0.01,
  'mille': 1e3, 'milliers': 1e3,
  'million': 1e6, 'millions': 1e6,
  'milliard': 1e9, 'milliards': 1e9,
};

// « environ 100 », « ~100 », « about 100 » : l'auteur dit qu'il ne sait pas,
// sans dire à quel point. C'est précisément ce que le site lui demande.
const APPROXIMATIFS = new Set(['environ', 'env', 'approx', 'approximativement',
  'about', 'around', 'roughly', 'circa']);

const MESSAGE_ENVIRON = '« environ » ne dit pas de combien vous pourriez vous tromper. '
  + 'Écrivez la fourchette elle-même, celle qui a 9 chances sur 10 de contenir la vraie '
  + 'valeur : « 80 à 120 » plutôt que « environ 100 ».';

// Les opérateurs dits avec des mots : « prix fois 12 », « 1 sur 10 »,
// « revenue minus costs ». Jamais si le mot est un nom défini.
const MOTS_SOMME = { plus: '+', minus: '-', moins: '-' };
const MOTS_PRODUIT = { fois: '*', times: '*', sur: '/', divided: '/' };

// « deux à trois » : les petits nombres en toutes lettres.
const NOMBRES_MOTS = {
  'zéro': 0, zero: 0, un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6,
  sept: 7, huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12, quinze: 15, vingt: 20,
  trente: 30, quarante: 40, cinquante: 50, soixante: 60, cent: 100,
  one: 1, two: 2, three: 3, four: 4, five: 5, seven: 7, eight: 8, nine: 9, ten: 10,
  twenty: 20, fifty: 50, hundred: 100,
};

// Dans « 2300 net par mois », « mois » est une unité même si une variable
// porte ce nom : la préposition qui précède le dit.
const PREPOSITIONS = new Set(['par', 'per', 'le', 'la', 'les', 'de', 'du', 'des', 'd', 'of', 'en']);

const MESSAGE_DUREE = 'une durée s’écrit dans une seule unité : « 3,5 » (en années) ou « 42 » '
  + '(en mois), pas « 3 ans et 6 mois ». Le site ne convertit pas les unités, il calcule sur les nombres.';

const EST_LETTRE = /\p{L}/u;
const EST_IDENT = /[\p{L}\p{N}_]/u;

export function lexer(source) {
  const jetons = [];
  let i = 0, ligne = 1, profondeur = 0;
  const n = source.length;

  const pousser = (type, valeur) => jetons.push({ type, valeur, ligne });

  while (i < n) {
    const c = source[i];

    // Une parenthèse ouverte suspend la fin de ligne : une formule peut
    // s'écrire sur plusieurs lignes sans être tronquée en silence.
    if (c === '\n') { if (profondeur === 0) pousser('nl'); ligne++; i++; continue; }
    // Les espaces insécables et fines viennent des copier-coller et des claviers
    // français. Les refuser cassait le modèle sur une faute invisible à l'œil.
    if (c === ' ' || c === '\t' || c === '\r'
        || c === '\u00a0' || c === '\u202f' || c === '\u2009' || c === '\u2007') {
      i++; continue;
    }
    // Un point-virgule sépare deux instructions, comme une fin de ligne — mais
    // à l'intérieur d'une parenthèse c'est un séparateur d'arguments. Les
    // tableurs français écrivent « max(1;2) », et c'est de là que viennent la
    // moitié des gens qui savent déjà écrire une formule.
    if (c === ';') { pousser(profondeur > 0 ? ',' : 'nl'); i++; continue; }
    if (c === '#' || (c === '/' && source[i + 1] === '/')) {
      while (i < n && source[i] !== '\n') i++;
      continue;
    }

    // Chaîne de caractères (nom d'option).
    if (c === '"' || c === '«' || c === '“') {
      const fin = c === '"' ? '"' : (c === '«' ? '»' : '”');
      let j = i + 1, texte = '';
      while (j < n && source[j] !== fin && source[j] !== '\n') { texte += source[j]; j++; }
      if (j >= n || source[j] !== fin) throw new ErreurModele('guillemet fermant manquant', ligne);
      pousser('texte', texte.trim());
      i = j + 1;
      continue;
    }

    // « $100 », « €200 » : le symbole devant le nombre est décoratif aussi.
    if ('€$£¥'.includes(c)) {
      let s = i + 1;
      while (s < n && (source[s] === ' ' || source[s] === '\u00a0')) s++;
      if (/[0-9]/.test(source[s] || '')) { i = s; continue; }
    }

    // Nombre. Accepte 1 234,5 / 1_234.5 / 12% / 250k / 3.2e4
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(source[i + 1] || ''))) {
      // Une date n'est pas un nombre : « 01/09/2026 » se calculait comme une
      // double division et valait 0,00005.
      if (/^\d{1,2}\/\d{1,2}\/\d{2,4}(?![0-9])/.test(source.slice(i, i + 10))) {
        throw new ErreurModele(
          'le site ne lit pas les dates. Écrivez une durée — « 18 » (mois) ou « 1,5 » (années) — '
          + 'ou un écart entre deux années, comme « 2030 - 2026 »', ligne);
      }
      // « 1h30 » se lisait « 1 » suivi d'une unité « h30 ».
      {
        const h = source.slice(i).match(/^(\d+)h(\d{2})(?![\p{L}\p{N}_])/u);
        if (h) {
          throw new ErreurModele(
            `« ${h[0]} » : écrivez ${(+h[1] + h[2] / 60).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} `
            + `(en heures) ou ${+h[1] * 60 + +h[2]} (en minutes)`, ligne);
        }
      }
      let j = i, brut = '';
      let ambigu = false;
      // Les quatre espaces qui séparent les milliers en français : l'ordinaire,
      // l'insécable, la fine insécable — celle que produit `toLocaleString('fr-FR')`,
      // donc tout copier-coller d'une page web — et la fine.
      while (j < n && /[0-9_    ']/.test(source[j])) {
        // Un espace n'est un séparateur de milliers que s'il est suivi de 3 chiffres.
        // L'apostrophe suisse (« 100'000 ») suit la même règle.
        if (/[    ']/.test(source[j])) {
          if (!/^[0-9]{3}(?![0-9])/.test(source.slice(j + 1, j + 5))) break;
        }
        if (/[0-9]/.test(source[j])) brut += source[j];
        j++;
      }
      // « 100.000 » : cent, ou cent mille ? Ici le point est décimal. On le
      // lit ainsi, et on le dit, parce que l'autre lecture est courante.
      if (/^\.[0-9]{3}(?![0-9.,])/.test(source.slice(j, j + 5))) ambigu = true;
      // Séparateur décimal : `.` toujours, `,` seulement s'il ne sert pas de virgule d'argument.
      if (source[j] === '.' && /[0-9]/.test(source[j + 1] || '')) {
        brut += '.'; j++;
        while (j < n && /[0-9_]/.test(source[j])) { if (/[0-9]/.test(source[j])) brut += source[j]; j++; }
      } else if (source[j] === ',' && /[0-9]/.test(source[j + 1] || '')) {
        brut += '.'; j++;
        while (j < n && /[0-9_]/.test(source[j])) { if (/[0-9]/.test(source[j])) brut += source[j]; j++; }
      }
      if (/[eE]/.test(source[j] || '') && /[0-9+\-]/.test(source[j + 1] || '')) {
        brut += 'e'; j++;
        if (/[+\-]/.test(source[j])) { brut += source[j]; j++; }
        while (j < n && /[0-9]/.test(source[j])) { brut += source[j]; j++; }
      }
      let valeur = parseFloat(brut);
      let pourcent = false;
      let suffixe = 1;

      // « 3,2 % » avec une espace : c'est la typographie française, et c'est
      // ce que les gens écrivent. Il n'y a pas d'opérateur modulo dans le
      // langage, donc un « % » après un nombre est toujours un pourcentage.
      let k = j;
      while (k < n && (source[k] === ' ' || source[k] === '\u00a0' || source[k] === '\u202f')) k++;
      if (source[k] === '%') { valeur /= 100; pourcent = true; j = k + 1; }
      else {
        // Suffixe collé : 250k, 3.2M, 12Md
        const deux = source.slice(j, j + 3);
        const cle = ['Mds', 'Md', 'md', 'k', 'K', 'M', 'm', 'G'].find(
          (s) => deux.startsWith(s) && !EST_IDENT.test(source[j + s.length] || '')
        );
        if (cle) { valeur *= SUFFIXES[cle]; suffixe = SUFFIXES[cle]; j += cle.length; }
        else {
          // « 30 k€ », « 2 M€ » : le suffixe séparé du nombre par une espace.
          // Accepté seulement s'il est collé à un symbole monétaire — « 5 M »
          // tout seul pourrait être n'importe quoi, « 5 M€ » ne l'est pas.
          let s = j;
          while (s < n && (source[s] === ' ' || source[s] === '\u00a0' || source[s] === '\u202f')) s++;
          const loin = ['Mds', 'Md', 'k', 'K', 'M', 'G'].find(
            (x) => source.startsWith(x, s) && '€$£¥'.includes(source[s + x.length] || ''));
          if (loin) { valeur *= SUFFIXES[loin]; suffixe = SUFFIXES[loin]; j = s + loin.length; }
        }
      }
      // « 900 € », « 250 000 €», « 3 %/an » : le symbole qui suit un nombre est
      // décoratif — il n'y a pas d'arithmétique des symboles monétaires. Le
      // refuser cassait le modèle sur une habitude typographique française, et
      // sur tout copier-coller venu d'ailleurs. L'unité du résultat, elle, se
      // déclare toujours en tête.
      let deco = false;
      let u = j;
      while (u < n && (source[u] === ' ' || source[u] === '\u00a0' || source[u] === '\u202f')) u++;
      if ('€$£¥₽¢°'.includes(source[u] || '')) { j = u + 1; deco = true; }
      // Le dénominateur d'une unité composée : « €/mois », « %/an ». Collé,
      // sans espace, et suivi de lettres — jamais confondu avec une division.
      if ((deco || pourcent) && source[j] === '/' && EST_LETTRE.test(source[j + 1] || '')) {
        j++;
        while (j < n && EST_IDENT.test(source[j])) j++;
      }
      pousser('nombre', valeur);
      jetons[jetons.length - 1].pourcent = pourcent;
      jetons[jetons.length - 1].suffixe = suffixe;
      if (ambigu) jetons[jetons.length - 1].ambigu = source.slice(i, j).trim();
      i = j;
      continue;
    }

    // Identifiant / mot-clé.
    if (EST_LETTRE.test(c) || c === '_') {
      let j = i, mot = '';
      while (j < n && EST_IDENT.test(source[j])) { mot += source[j]; j++; }
      const bas = mot.toLowerCase();
      // « 10 pour cent », « 3 pour mille » : le nombre qui précède est une proportion.
      if (bas === 'pour') {
        const suite = source.slice(j).match(/^[ \u00a0]*(cent|mille)(?![\p{L}\p{N}_])/u);
        const prec = jetons[jetons.length - 1];
        if (suite && prec && prec.type === 'nombre') {
          prec.valeur /= suite[1] === 'cent' ? 100 : 1000;
          prec.pourcent = suite[1] === 'cent';
          i = j + suite[0].length;
          continue;
        }
      }
      if (MULTIPLICATEURS_MOTS[bas] !== undefined) {
        pousser('mult', MULTIPLICATEURS_MOTS[bas]);
      } else if (INTERVALLE.has(bas) && mot.length <= 2) {
        // `a` n'est un opérateur d'intervalle qu'entre deux nombres.
        const prec = jetons[jetons.length - 1];
        if (bas !== 'a' || (prec && (prec.type === 'nombre' || prec.type === 'mult'))) {
          pousser('interv', bas);
        } else {
          pousser('ident', mot);
        }
      } else if (MOTS_CLES.has(bas)) {
        pousser('mc', bas);
      } else {
        pousser('ident', mot);
      }
      i = j;
      continue;
    }

    // Opérateurs.
    const trois = source.slice(i, i + 3);
    if (trois === '...') { pousser('interv', '..'); i += 3; continue; }
    const deux = source.slice(i, i + 2);
    if (deux === '..') { pousser('interv', '..'); i += 2; continue; }
    // « x ** 2 » : la puissance de Python et des tableurs.
    if (deux === '**') { pousser('op', '^'); i += 2; continue; }
    if (['>=', '<=', '==', '!=', '<>', '≥', '≤', '≠'].includes(deux)) {
      pousser('op', deux === '<>' ? '!=' : deux); i += 2; continue;
    }
    if (['≥', '≤', '≠'].includes(c)) {
      pousser('op', c === '≥' ? '>=' : c === '≤' ? '<=' : '!='); i++; continue;
    }
    // « 1000 ± 100 » est la façon la plus répandue d'écrire une incertitude
    // hors de ce site : elle vaut la fourchette « 900 à 1100 ».
    if (c === '\u00b1') { pousser('pm'); i++; continue; }
    if (deux === '+-' || source.slice(i, i + 3) === '+/-') {
      pousser('pm'); i += (deux === '+-' ? 2 : 3); continue;
    }
    if (c === '\u00b2' || c === '\u00b3') {
      // « 2² » : l'exposant typographique se lit comme « ^2 ».
      pousser('op', '^');
      pousser('nombre', c === '\u00b2' ? 2 : 3);
      i++; continue;
    }
    if ('+-*/^×÷'.includes(c)) {
      pousser('op', c === '×' ? '*' : c === '÷' ? '/' : c); i++; continue;
    }
    if (c === '~') { pousser('interv', '~'); i++; continue; }
    if (c === '=') { pousser('assign'); i++; continue; }
    if (c === '>' || c === '<') { pousser('op', c); i++; continue; }
    if ('(),'.includes(c)) {
      if (c === '(') profondeur++;
      else if (c === ')') profondeur = Math.max(0, profondeur - 1);
      pousser(c); i++; continue;
    }
    if (c === ':') { pousser(':'); i++; continue; }

    if (c === '?') {
      throw new ErreurModele(
        'il n’y a pas de « ? : » ici — une condition s’écrit « si a > b alors 1 sinon 0 »', ligne);
    }
    if (c === '%') {
      throw new ErreurModele(
        '« % » ne s’écrit qu’après un nombre, comme dans « 3 % ». Il n’y a pas d’opérateur '
        + 'modulo — pour un reste de division, écrivez « mod(a, b) »', ligne);
    }
    if ('{}[]'.includes(c)) {
      throw new ErreurModele(
        `« ${c} » n’est pas reconnu — le langage n’utilise que des parenthèses`, ligne);
    }
    if ('€$£¥₽¢°'.includes(c)) {
      throw new ErreurModele(
        `« ${c} » n'a pas sa place dans un calcul — l'unité se déclare en tête `
        + `du modèle, avec une ligne « unité: ${c} »`, ligne);
    }
    // Afficher le caractère entier, pas la moitié d'une paire de substitution.
    const entier = String.fromCodePoint(source.codePointAt(i));
    throw new ErreurModele(`caractère inattendu « ${entier} »`, ligne);
  }
  pousser('fin');
  return jetons;
}

// --- Analyse syntaxique -----------------------------------------------------

// Une fourchette dont une seule borne porte l'échelle : « 15 à 30 % » veut
// dire 15 % à 30 %, « 1 à 3 millions » veut dire un à trois millions, et
// « 100 à 150k » va de cent à cent cinquante mille. Lire « 15 à 0,3 » ou
// « 1 à 3 000 000 » était plausible de bout en bout et faux d'un facteur cent.
// Le multiplicateur ne se propage que si l'ordre des chiffres écrits le permet :
// « 500 à 2k » va bien de 500 à 2 000.
function fourchette(g, d, ligne) {
  const nu = (n) => n.k === 'nombre' && !n.pourcent && n.suffixe === 1;
  const propage = (de, vers) => {
    if (de.k === 'nombre' && de.pourcent && nu(vers)) {
      vers.v /= 100; vers.pourcent = true;
    } else if (de.k === 'nombre' && de.suffixe > 1 && nu(vers) && vers.v <= de.v / de.suffixe) {
      vers.v *= de.suffixe; vers.suffixe = de.suffixe;
    } else if (de.mult && nu(vers) && vers.v <= de.g.v) {
      vers.v *= de.d.v; vers.suffixe = de.d.v;
    }
  };
  propage(d, g);
  propage(g, d);
  // Si l'auteur a écrit « 1% à 4% », la grandeur est une proportion :
  // on s'en souvient pour l'afficher en pourcentage plus tard.
  const pourcent = (g.k === 'nombre' && g.pourcent) || (d.k === 'nombre' && d.pourcent);
  return { k: 'intervalle', bas: g, haut: d, pourcent, ligne };
}

class Parseur {
  constructor(jetons, declares = new Set()) {
    this.j = jetons;
    this.i = 0;
    // Les noms définis quelque part dans le modèle. Sert à distinguer « 3 ans »
    // (une unité, ignorée) de « 3 x » (une multiplication oubliée).
    this.declares = declares;
  }
  cur() { return this.j[this.i]; }
  ligne() { return this.cur().ligne; }
  avance() { return this.j[this.i++]; }
  estType(t) { return this.cur().type === t; }
  estMC(m) { return this.cur().type === 'mc' && this.cur().valeur === m; }
  estOp(...ops) { return this.cur().type === 'op' && ops.includes(this.cur().valeur); }
  attendre(t, message) {
    if (!this.estType(t)) throw new ErreurModele(message, this.ligne());
    return this.avance();
  }
  estDeclare(t) { return t && t.type === 'ident' && this.declares.has(t.valeur); }

  // « duree = 3 ans », « x = 40 h/semaine », « 10 à 20 par mois » : les mots
  // qui suivent un nombre sont une unité, pas un calcul. On les ignore et on
  // les garde sur le nœud pour le dire au visiteur. Un mot qui est un nom
  // défini n'est pas une unité : « 3 x » est une multiplication mal écrite.
  unites(noeud) {
    for (;;) {
      const t = this.cur(), suiv = this.j[this.i + 1];
      let mot = null;
      if (t.type === 'ident') mot = t;
      else if (t.type === 'op' && t.valeur === '/' && suiv && suiv.type === 'ident'
               && noeud.unites && !this.estDeclare(suiv)
               && !(this.j[this.i + 2] && this.j[this.i + 2].type === '(')) {
        this.avance(); mot = this.cur();
        noeud.unites[noeud.unites.length - 1] += '/' + mot.valeur;
        this.avance();
        continue;
      }
      if (!mot) return;
      const bas = mot.valeur.toLowerCase();
      const dernier = noeud.unites ? noeud.unites[noeud.unites.length - 1].split(/[ /]/).pop().toLowerCase() : '';
      if (this.estDeclare(mot) && !PREPOSITIONS.has(dernier)) {
        const lu = noeud.k === 'nombre' ? String(noeud.v) : '…';
        throw new ErreurModele(
          `« ${lu} ${mot.valeur} » : la multiplication s’écrit « ${lu} * ${mot.valeur} »`, mot.ligne);
      }
      if (APPROXIMATIFS.has(bas)) throw new ErreurModele(MESSAGE_ENVIRON, mot.ligne);
      const apres = this.j[this.i + 1];
      if (apres && (apres.type === '(' || apres.type === 'assign')) return;
      // « 100 k à 200 k », « 2 M » : le suffixe d'échelle, séparé par une espace.
      if (SUFFIXES[mot.valeur] !== undefined && mot.valeur !== 'm' && mot.valeur !== 'md'
          && noeud.k === 'nombre' && noeud.suffixe === 1 && !noeud.unites) {
        noeud.v *= SUFFIXES[mot.valeur]; noeud.suffixe = SUFFIXES[mot.valeur];
        this.avance(); continue;
      }
      // « 12 x 3 » : la croix de multiplication, pas une unité.
      if ((bas === 'x') && apres && ['nombre', 'ident', '('].includes(apres.type)) return;
      // « 1 sur 10 », « 2 fois 3 » : un opérateur, pas une unité — mais
      // « 2 fois par semaine » en est une.
      if ((MOTS_SOMME[bas] || MOTS_PRODUIT[bas]) && this.motOperateur(MOTS_SOMME[bas] ? MOTS_SOMME : MOTS_PRODUIT)) return;
      // « 3 ans a 5 ans » : ce « a » est la fourchette, pas un mot de plus.
      if ((bas === 'a' || bas === 'to') && apres && apres.type === 'nombre') {
        t.type = 'interv'; t.valeur = bas; return;
      }
      this.avance();
      // « par mois » : les mots consécutifs forment une seule unité.
      if (noeud.unites) noeud.unites[noeud.unites.length - 1] += ' ' + mot.valeur;
      else noeud.unites = [mot.valeur];
      // « 1 an et demi » : la moitié de l'unité en cours.
      if ((this.estMC('et') || this.estMC('and')) && this.j[this.i + 1] && this.j[this.i + 1].type === 'ident'
          && ['demi', 'demie', 'half'].includes(this.j[this.i + 1].valeur.toLowerCase())
          && noeud.k === 'nombre' && !this.declares.has(this.j[this.i + 1].valeur)) {
        this.avance(); this.avance();
        noeud.v += 0.5;
        continue;
      }
      // « 3 ans 6 mois » : deux unités, donc une conversion que le site ne fait pas.
      if (this.estType('nombre')) throw new ErreurModele(MESSAGE_DUREE, mot.ligne);
    }
  }
  sauterNL() { while (this.estType('nl')) this.avance(); }

  // Une ligne qui commence par un opérateur binaire continue la précédente.
  // C'est ainsi qu'on écrit une formule longue, et ne pas le gérer tronquait
  // le calcul sans rien signaler.
  continueLigne(ops) {
    if (!this.estType('nl')) return false;
    let k = this.i;
    while (this.j[k] && this.j[k].type === 'nl') k++;
    const t = this.j[k];
    if (t && t.type === 'op' && ops.includes(t.valeur)) { this.i = k; return true; }
    return false;
  }

  expr() { return this.ternaire(); }

  ternaire() {
    if (this.estMC('si') || this.estMC('if')) {
      const ligne = this.ligne();
      this.avance();
      const cond = this.ou();
      if (this.estMC('alors') || this.estMC('then')) this.avance();
      const oui = this.expr();
      if (!(this.estMC('sinon') || this.estMC('else'))) {
        throw new ErreurModele('« sinon » manquant après « si … alors … »', ligne);
      }
      this.avance();
      const non = this.expr();
      return { k: 'si', cond, oui, non, ligne };
    }
    return this.ou();
  }

  ou() {
    let g = this.et();
    while (this.estMC('ou') || this.estMC('or')) {
      const ligne = this.ligne(); this.avance();
      g = { k: 'bin', op: 'ou', g, d: this.et(), ligne };
    }
    return g;
  }

  et() {
    let g = this.comparaison();
    while (this.estMC('et') || this.estMC('and')) {
      const ligne = this.ligne(); this.avance();
      const d = this.comparaison();
      if (g.k === 'nombre' && g.unites && d.k === 'nombre' && d.unites) {
        throw new ErreurModele(MESSAGE_DUREE, ligne);
      }
      g = { k: 'bin', op: 'et', g, d, ligne };
    }
    return g;
  }

  comparaison() {
    let g = this.intervalle();
    while (this.estOp('>', '<', '>=', '<=', '==', '!=')) {
      const ligne = this.ligne();
      const op = this.avance().valeur;
      g = { k: 'bin', op, g, d: this.intervalle(), ligne };
    }
    return g;
  }

  intervalle() {
    const g = this.somme();
    if (this.estType('interv')) {
      const ligne = this.ligne();
      this.avance();
      if (this.estType('nl') || this.estType('fin')) {
        throw new ErreurModele(
          'une fourchette a deux bornes : il manque la valeur haute, '
          + 'comme dans « 900 à 1150 »', ligne);
      }
      const d = this.somme();
      if (this.estType('interv')) {
        throw new ErreurModele(
          'une fourchette a deux bornes, pas trois. Pour une estimation basse, '
          + 'probable et haute, écrivez « triangulaire(900, 1000, 1150) »', ligne);
      }
      return fourchette(g, d, ligne);
    }
    // « 1000 ± 100 » : la même fourchette, écrite comme tout le monde l'écrit.
    if (this.estType('pm')) {
      const ligne = this.ligne();
      this.avance();
      const d = this.somme();
      // « 1000 ± 10 % » : le pourcentage est relatif au centre, pas un dixième.
      if (d.k === 'nombre' && d.pourcent && !(g.k === 'nombre' && g.pourcent)) {
        const un = { k: 'nombre', v: 1, ligne };
        return {
          k: 'intervalle',
          bas: { k: 'bin', op: '*', g, d: { k: 'bin', op: '-', g: un, d, ligne }, ligne },
          haut: { k: 'bin', op: '*', g, d: { k: 'bin', op: '+', g: un, d, ligne }, ligne },
          pourcent: false,
          ligne,
        };
      }
      return {
        k: 'intervalle',
        bas: { k: 'bin', op: '-', g, d, ligne },
        haut: { k: 'bin', op: '+', g, d, ligne },
        pourcent: (g.k === 'nombre' && g.pourcent) || (d.k === 'nombre' && d.pourcent),
        ligne,
      };
    }
    return g;
  }

  // « prix plus frais », « revenue minus costs » : l'opérateur en toutes lettres,
  // quand le mot n'est pas un nom défini et qu'un opérande le suit.
  motOperateur(table) {
    const t = this.cur();
    if (t.type !== 'ident' || this.estDeclare(t)) return null;
    const op = table[t.valeur.toLowerCase()];
    if (!op) return null;
    let k = this.i + 1;
    // « divided by »
    if (t.valeur.toLowerCase() === 'divided') {
      if (this.j[k] && this.j[k].type === 'ident' && this.j[k].valeur.toLowerCase() === 'by') k++;
      else return null;
    }
    const apres = this.j[k];
    if (!apres) return null;
    if (apres.type === 'nombre' || apres.type === '(' || this.estDeclare(apres)
        || (apres.type === 'ident' && NOMBRES_MOTS[apres.valeur.toLowerCase()] !== undefined)) return { op, k };
    return null;
  }

  somme() {
    let g = this.produit();
    for (;;) {
      let op, mot;
      if (this.estOp('+', '-') || this.continueLigne(['+', '-'])) op = this.avance().valeur;
      else if ((mot = this.motOperateur(MOTS_SOMME))) { op = mot.op; this.i = mot.k; }
      else break;
      const ligne = this.ligne();
      g = { k: 'bin', op, g, d: this.produit(), ligne };
    }
    return g;
  }

  produit() {
    let g = this.unaire();
    for (;;) {
      if (this.estOp('*', '/') || this.continueLigne(['*', '/'])) {
        const ligne = this.ligne();
        const op = this.avance().valeur;
        g = { k: 'bin', op, g, d: this.unaire(), ligne };
      } else if (this.estType('mult')) {
        // « 3 millions » : multiplicateur postfixe.
        const ligne = this.ligne();
        const m = this.avance().valeur;
        g = { k: 'bin', op: '*', g, d: { k: 'nombre', v: m, ligne }, ligne, mult: g.k === 'nombre' };
        this.unites(g);
      } else if (this.estType('ident') && ['x', 'X'].includes(this.cur().valeur)
                 && !this.estDeclare(this.cur()) && this.j[this.i + 1]
                 && ['nombre', 'ident', '('].includes(this.j[this.i + 1].type)) {
        // « loyer x 12 » : la croix de l'école, quand aucun « x » n'est défini.
        const ligne = this.ligne();
        this.avance();
        g = { k: 'bin', op: '*', g, d: this.unaire(), ligne };
      } else if (this.motOperateur(MOTS_PRODUIT)) {
        // « prix fois 12 », « 1 sur 10 », « x divided by 2 ».
        const mot = this.motOperateur(MOTS_PRODUIT);
        const ligne = this.ligne();
        this.i = mot.k;
        g = { k: 'bin', op: mot.op, g, d: this.unaire(), ligne };
      } else break;
    }
    return g;
  }

  unaire() {
    if (this.estOp('-')) {
      const ligne = this.ligne(); this.avance();
      return { k: 'neg', e: this.unaire(), ligne };
    }
    if (this.estOp('+')) { this.avance(); return this.unaire(); }
    if (this.estMC('non') || this.estMC('not')) {
      const ligne = this.ligne(); this.avance();
      return { k: 'non', e: this.unaire(), ligne };
    }
    return this.puissance();
  }

  puissance() {
    const base = this.primaire();
    if (this.estOp('^')) {
      const ligne = this.ligne(); this.avance();
      return { k: 'bin', op: '^', g: base, d: this.unaire(), ligne };
    }
    return base;
  }

  primaire() {
    const t = this.cur();
    // Une condition peut servir d'opérande : « travail + si pepin alors 10
    // sinon 0 ». Sans ça, la seule écriture naturelle du cas le plus courant
    // — ajouter un aléa à une somme — était refusée.
    if (t.type === 'mc' && (t.valeur === 'si' || t.valeur === 'if')) return this.ternaire();
    // « entre 900 et 1150 » : la fourchette dite en français.
    if (t.type === 'ident' && ['entre', 'between'].includes(t.valeur.toLowerCase())
        && this.j[this.i + 1] && this.j[this.i + 1].type !== '('
        && !this.declares.has(t.valeur)) {
      this.avance();
      const bas = this.somme();
      if (!this.estMC('et') && !this.estMC('and')) {
        throw new ErreurModele('« et » attendu après « entre … »', t.ligne);
      }
      this.avance();
      const haut = this.somme();
      return fourchette(bas, haut, t.ligne);
    }
    // « environ 100 », « about 100 » : pas de largeur, donc pas de fourchette.
    if ((t.type === 'ident' && APPROXIMATIFS.has(t.valeur.toLowerCase()) && !this.declares.has(t.valeur))
        || (t.type === 'interv' && t.valeur === '~')) {
      throw new ErreurModele(MESSAGE_ENVIRON, t.ligne);
    }
    // Une branche ne se réutilise pas dans un calcul.
    if (t.type === 'mc' && (t.valeur === 'option' || t.valeur === 'choix')) {
      throw new ErreurModele(
        'une branche ne se réutilise pas dans un calcul. Donnez un nom à son contenu '
        + '(« ouvrir = … »), servez-vous de ce nom, et écrivez « option "Ouvrir" = ouvrir »',
        t.ligne);
    }
    if (t.type === 'texte') {
      throw new ErreurModele(
        'les guillemets ne servent qu\u2019à nommer une option : '
        + `écrivez « ${t.valeur} » sans guillemets, ou « option "${t.valeur}" = … »`, t.ligne);
    }
    if (t.type === 'nombre') {
      this.avance();
      const noeud = { k: 'nombre', v: t.valeur, pourcent: t.pourcent, suffixe: t.suffixe || 1, ligne: t.ligne };
      if (t.ambigu) noeud.ambigu = t.ambigu;
      this.unites(noeud);
      return noeud;
    }
    if (t.type === 'ident' && NOMBRES_MOTS[t.valeur.toLowerCase()] !== undefined && !this.declares.has(t.valeur)) {
      this.avance();
      const noeud = { k: 'nombre', v: NOMBRES_MOTS[t.valeur.toLowerCase()], suffixe: 1, ligne: t.ligne };
      this.unites(noeud);
      return noeud;
    }
    if (t.type === 'mc' && (t.valeur === 'vrai' || t.valeur === 'true')) {
      this.avance(); return { k: 'nombre', v: 1, ligne: t.ligne };
    }
    if (t.type === 'mc' && (t.valeur === 'faux' || t.valeur === 'false')) {
      this.avance(); return { k: 'nombre', v: 0, ligne: t.ligne };
    }
    if (t.type === 'ident') {
      this.avance();
      if (this.estType('(')) {
        this.avance();
        const args = [];
        if (!this.estType(')')) {
          args.push(this.expr());
          while (this.estType(',')) { this.avance(); args.push(this.expr()); }
        }
        this.attendre(')', 'parenthèse fermante attendue');
        return { k: 'appel', nom: t.valeur, args, ligne: t.ligne };
      }
      return { k: 'var', nom: t.valeur, ligne: t.ligne };
    }
    if (t.type === '(') {
      this.avance();
      const e = this.expr();
      this.attendre(')', 'parenthèse fermante attendue');
      return e;
    }
    if (t.type === 'nl' || t.type === 'fin') {
      throw new ErreurModele('expression incomplète en fin de ligne', t.ligne);
    }
    throw new ErreurModele(`« ${t.valeur ?? t.type} » inattendu`, t.ligne);
  }
}

export function analyser(sourceBrute) {
  const { source, unite: uniteDeclaree } = extraireUnite(sourceBrute);
  const jetons = lexer(source);
  // Les noms définis quelque part, connus avant de lire la moindre ligne : une
  // définition peut venir après son usage.
  const declares = new Set();
  for (let k = 0; k + 1 < jetons.length; k++) {
    if (jetons[k].type === 'ident' && jetons[k + 1].type === 'assign'
        && (k === 0 || jetons[k - 1].type === 'nl')) declares.add(jetons[k].valeur);
  }
  const p = new Parseur(jetons, declares);
  const lignesBrutes = source.split('\n').map((l) => l.replace(/#.*$|\/\/.*$/, '').trim());
  const declarations = [];
  const options = [];
  let sortie = null;
  const sortiesIgnorees = [];
  const unite = uniteDeclaree;
  let seuil = null;

  for (;;) {
    p.sauterNL();
    if (p.estType('fin')) break;
    const ligne = p.ligne();
    const iDebut = p.i;

    if (p.estType('assign')) {
      throw new ErreurModele('il manque un nom avant « = » : écrivez « nom = … »', ligne);
    }

    // Un tableau collé tel quel : « loyer;900;1150 », « loyer,900,1150 », ou
    // son en-tête « poste bas haut ». Le point-virgule aurait découpé la ligne
    // en trois instructions et calculé « 1150 » sans un mot.
    {
      const brute = lignesBrutes[ligne - 1] || '';
      const champs = brute.split(/[;\t]/).map((c) => c.trim());
      const nombre = /^[-+]?\d[\d\s\u00a0\u202f.,]*%?$/;
      const nomSeul = /^[\p{L}_][\p{L}\p{N}_]*$/u;
      if (champs.length >= 3 && nomSeul.test(champs[0]) && champs.slice(1).every((c) => nombre.test(c))) {
        throw new ErreurModele(
          `cette ligne ressemble à une ligne de tableau. Écrivez-la « ${champs[0]} = ${champs[1]} à ${champs[champs.length - 1]} »`, ligne);
      }
      const virgules = brute.split(',').map((c) => c.trim());
      if (virgules.length >= 3 && nomSeul.test(virgules[0]) && virgules.slice(1).every((c) => /^[-+]?\d+$/.test(c))) {
        throw new ErreurModele(
          `cette ligne ressemble à une ligne de tableau. Écrivez-la « ${virgules[0]} = ${virgules[1]} à ${virgules[virgules.length - 1]} »`, ligne);
      }
      if (champs.length >= 2 && !/[=\d]/.test(brute) && champs.every((c) => /^[\p{L}_][\p{L}\p{N}_ ]*$/u.test(c))) {
        throw new ErreurModele(
          'cette ligne ressemble à l’en-tête d’un tableau. Supprimez-la : le site ne lit que des lignes « nom = valeur »', ligne);
      }
    }

    // Directives « unité: € » et « seuil: 0 ».
    if (p.estType('ident') && p.j[p.i + 1] && p.j[p.i + 1].type === ':') {
      const mot = p.cur().valeur.toLowerCase();
      if (SEUIL.has(mot)) {
        p.avance(); p.avance();
        // « seuil: 12 » veut dire « au moins 12 » ; « seuil: <= 60 », « au plus 60 ».
        // Une durée, un budget, une dose se visent par le haut, pas par le bas.
        let sens = 'min';
        if (p.estOp('<=', '<')) { p.avance(); sens = 'max'; }
        else if (p.estOp('>=', '>')) { p.avance(); sens = 'min'; }
        seuil = { expr: p.expr(), sens, ligne };
        if (!p.estType('nl') && !p.estType('fin')) {
          throw new ErreurModele('fin de ligne attendue après le seuil', p.ligne());
        }
        continue;
      }
      throw new ErreurModele(
        `réglage « ${p.cur().valeur} » inconnu — les seuls sont « unité: » et « seuil: ». `
        + `Pour définir une valeur, écrivez « ${p.cur().valeur} = … »`, ligne);
    }

    if (p.estMC('option') || p.estMC('choix')) {
      p.avance();
      let nom;
      if (p.estType('texte')) nom = p.avance().valeur;
      else if (p.estType('ident')) nom = p.avance().valeur;
      else throw new ErreurModele('nom d’option attendu après « option »', ligne);
      if (p.estType(':')) p.avance();
      else p.attendre('assign', '« = » attendu après le nom de l’option');
      const e = p.expr();
      options.push({ nom, expr: e, ligne });
    } else if (p.estType('ident') && p.j[p.i + 1] && p.j[p.i + 1].type === 'assign') {
      const nom = p.avance().valeur;
      p.avance(); // =
      const e = p.expr();
      if (declarations.some((d) => d.nom === nom)) {
        throw new ErreurModele(
          `« ${nom} » est défini deux fois. Une valeur ne change pas en cours de route : `
          + `donnez un autre nom à la seconde, par exemple « ${nom}_2 »`, ligne);
      }
      declarations.push({ nom, expr: e, ligne });
    } else {
      const e = p.expr();
      if (sortie) sortiesIgnorees.push(sortie.ligne);
      sortie = { expr: e, ligne };
    }

    if (!p.estType('nl') && !p.estType('fin')) {
      // Un « = » plus loin sur la même ligne : ce n'est pas l'expression qui
      // cloche, c'est le nom, écrit avec des espaces ou des tirets. On propose
      // le même nom d'un seul tenant, construit sur ses propres mots.
      let k = iDebut, nomBrut = [];
      while (p.j[k] && p.j[k].type !== 'nl' && p.j[k].type !== 'fin' && p.j[k].type !== 'assign') {
        if (p.j[k].type === 'ident' || p.j[k].type === 'nombre') nomBrut.push(p.j[k].valeur);
        k++;
      }
      if (p.j[k] && p.j[k].type === 'assign' && nomBrut.length > 1) {
        throw new ErreurModele(
          `un nom d’hypothèse s’écrit d’un seul tenant, sans espace ni tiret : `
          + `essayez « ${nomBrut.join('_')} = … »`, ligne);
      }
      // « loyer  900  1150 » — une ligne de tableur collée telle quelle, avec
      // ses tabulations. On rend au visiteur sa propre ligne, réécrite.
      const ligneJetons = [];
      for (let q = iDebut; p.j[q] && p.j[q].type !== 'nl' && p.j[q].type !== 'fin'; q++) {
        ligneJetons.push(p.j[q]);
      }
      // Sans séparateur de milliers : le message doit pouvoir être recopié tel
      // quel dans l'éditeur, et le visiteur n'avait pas écrit d'espace.
      const texteNombre = (t) => (t.pourcent
        ? (t.valeur * 100).toLocaleString('fr-FR', { useGrouping: false, maximumFractionDigits: 6 }) + ' %'
        : t.valeur.toLocaleString('fr-FR', { useGrouping: false, maximumFractionDigits: 6 }));
      const nombres = ligneJetons.filter((t) => t.type === 'nombre');
      if (ligneJetons.length >= 3 && ligneJetons[0].type === 'ident'
          && ligneJetons.slice(1).every((t) => t.type === 'nombre')) {
        throw new ErreurModele(
          `cette ligne ressemble à une ligne de tableau. Écrivez-la « `
          + `${ligneJetons[0].valeur} = ${texteNombre(nombres[0])} à ${texteNombre(nombres[nombres.length - 1])} »`, ligne);
      }
      // « loyer = 900   1150 » : deux nombres après le « = », la fourchette sans son « à ».
      if (ligneJetons.length >= 4 && ligneJetons[0].type === 'ident' && ligneJetons[1].type === 'assign'
          && ligneJetons.slice(2).every((t) => t.type === 'nombre')) {
        throw new ErreurModele(
          `deux nombres à la suite : pour une fourchette, écrivez « `
          + `${ligneJetons[0].valeur} = ${texteNombre(nombres[0])} à ${texteNombre(nombres[nombres.length - 1])} »`, ligne);
      }
      // Une suite de mots sans « = », c'est presque toujours une phrase écrite
      // dans l'éditeur. Autant le dire.
      if (p.estType('ident') || p.estType('mc')) {
        throw new ErreurModele(
          `« ${p.cur().valeur} » inattendu : cette ligne ressemble à une phrase. `
          + 'Un commentaire commence par « # », et une hypothèse s’écrit « nom = valeur ».',
          p.ligne());
      }
      throw new ErreurModele(`« ${p.cur().valeur ?? p.cur().type} » inattendu en fin de ligne`, p.ligne());
    }
  }

  // « prix <= budget » n'est pas un calcul, c'est une contrainte — et le site
  // sait exactement y répondre : il calcule `prix` et mesure la probabilité de
  // rester sous `budget`. Sans cette lecture, la ligne se calculait sans
  // broncher et affichait « Résultat : 0 », ce qui ne veut rien dire.
  let objectifDeduit = null;
  const COMPARAISONS = { '<': 'max', '<=': 'max', '>': 'min', '>=': 'min' };
  if (sortie && !seuil && sortie.expr.k === 'bin' && COMPARAISONS[sortie.expr.op]) {
    const c = sortie.expr;
    objectifDeduit = { ligne: sortie.ligne, op: c.op, sens: COMPARAISONS[c.op] };
    seuil = { expr: c.d, sens: COMPARAISONS[c.op], ligne: sortie.ligne };
    sortie = { expr: c.g, ligne: sortie.ligne };
  }

  if (!sortie && options.length === 0 && declarations.length > 0) {
    // Par défaut, la dernière variable définie est le résultat — sauf si elle
    // sert à en calculer une autre : alors c'est une étape, et le résultat est
    // la dernière variable dont rien ne dépend. Quelqu'un qui écrit « total »
    // en premier et ses termes ensuite obtient bien « total ».
    const utilises = new Set();
    const noter = (n) => {
      if (!n || typeof n !== 'object') return;
      if (n.k === 'var') utilises.add(n.nom);
      for (const c of ['e', 'g', 'd', 'cond', 'oui', 'non', 'bas', 'haut']) noter(n[c]);
      if (n.args) n.args.forEach(noter);
    };
    for (const d of declarations) noter(d.expr);
    if (seuil) noter(seuil.expr);
    const libres = declarations.filter((d) => !utilises.has(d.nom));
    const derniere = libres.length ? libres[libres.length - 1] : declarations[declarations.length - 1];
    sortie = { expr: { k: 'var', nom: derniere.nom, ligne: derniere.ligne }, ligne: derniere.ligne, implicite: true };
  }

  return { declarations, options, sortie, unite, seuil, objectifDeduit, sortiesIgnorees };
}
