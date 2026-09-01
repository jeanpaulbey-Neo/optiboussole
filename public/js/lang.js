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
const SEUIL = new Set(['seuil', 'objectif', 'cible']);

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
  'mille': 1e3, 'milliers': 1e3,
  'million': 1e6, 'millions': 1e6,
  'milliard': 1e9, 'milliards': 1e9,
};

const EST_LETTRE = /\p{L}/u;
const EST_IDENT = /[\p{L}\p{N}_]/u;

export function lexer(source) {
  const jetons = [];
  let i = 0, ligne = 1;
  const n = source.length;

  const pousser = (type, valeur) => jetons.push({ type, valeur, ligne });

  while (i < n) {
    const c = source[i];

    if (c === '\n') { pousser('nl'); ligne++; i++; continue; }
    if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
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

    // Nombre. Accepte 1 234,5 / 1_234.5 / 12% / 250k / 3.2e4
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(source[i + 1] || ''))) {
      let j = i, brut = '';
      while (j < n && /[0-9_  ]/.test(source[j])) {
        // Un espace n'est un séparateur de milliers que s'il est suivi de 3 chiffres.
        if (/[  ]/.test(source[j])) {
          if (!/^[0-9]{3}(?![0-9])/.test(source.slice(j + 1, j + 5))) break;
        }
        if (/[0-9]/.test(source[j])) brut += source[j];
        j++;
      }
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

      if (source[j] === '%') { valeur /= 100; pourcent = true; j++; }
      else {
        // Suffixe collé : 250k, 3.2M, 12Md
        const deux = source.slice(j, j + 3);
        const cle = ['Mds', 'Md', 'md', 'k', 'K', 'M', 'm', 'G'].find(
          (s) => deux.startsWith(s) && !EST_IDENT.test(source[j + s.length] || '')
        );
        if (cle) { valeur *= SUFFIXES[cle]; j += cle.length; }
      }
      pousser('nombre', valeur);
      jetons[jetons.length - 1].pourcent = pourcent;
      i = j;
      continue;
    }

    // Identifiant / mot-clé.
    if (EST_LETTRE.test(c) || c === '_') {
      let j = i, mot = '';
      while (j < n && EST_IDENT.test(source[j])) { mot += source[j]; j++; }
      const bas = mot.toLowerCase();
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
    if (['>=', '<=', '==', '!=', '<>', '≥', '≤', '≠'].includes(deux)) {
      pousser('op', deux === '<>' ? '!=' : deux); i += 2; continue;
    }
    if (['≥', '≤', '≠'].includes(c)) {
      pousser('op', c === '≥' ? '>=' : c === '≤' ? '<=' : '!='); i++; continue;
    }
    if ('+-*/^×÷'.includes(c)) {
      pousser('op', c === '×' ? '*' : c === '÷' ? '/' : c); i++; continue;
    }
    if (c === '~') { pousser('interv', '~'); i++; continue; }
    if (c === '=') { pousser('assign'); i++; continue; }
    if (c === '>' || c === '<') { pousser('op', c); i++; continue; }
    if ('(),'.includes(c)) { pousser(c); i++; continue; }
    if (c === ':') { pousser(':'); i++; continue; }

    throw new ErreurModele(`caractère inattendu « ${c} »`, ligne);
  }
  pousser('fin');
  return jetons;
}

// --- Analyse syntaxique -----------------------------------------------------

class Parseur {
  constructor(jetons) {
    this.j = jetons;
    this.i = 0;
  }
  cur() { return this.j[this.i]; }
  ligne() { return this.cur().ligne; }
  avance() { return this.j[this.i++]; }
  estType(t) { return this.cur().type === t; }
  estMC(m) { return this.cur().type === 'mc' && this.cur().valeur === m; }
  estOp(...ops) { return this.cur().type === 'op' && ops.includes(this.cur().valeur); }
  attendre(t, quoi) {
    if (!this.estType(t)) {
      throw new ErreurModele(`${quoi} attendu`, this.ligne());
    }
    return this.avance();
  }
  sauterNL() { while (this.estType('nl')) this.avance(); }

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
      g = { k: 'bin', op: 'et', g, d: this.comparaison(), ligne };
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
      const d = this.somme();
      // Si l'auteur a écrit « 1% à 4% », la grandeur est une proportion :
      // on s'en souvient pour l'afficher en pourcentage plus tard.
      const pourcent = (g.k === 'nombre' && g.pourcent) || (d.k === 'nombre' && d.pourcent);
      return { k: 'intervalle', bas: g, haut: d, pourcent, ligne };
    }
    return g;
  }

  somme() {
    let g = this.produit();
    while (this.estOp('+', '-')) {
      const ligne = this.ligne();
      const op = this.avance().valeur;
      g = { k: 'bin', op, g, d: this.produit(), ligne };
    }
    return g;
  }

  produit() {
    let g = this.unaire();
    for (;;) {
      if (this.estOp('*', '/')) {
        const ligne = this.ligne();
        const op = this.avance().valeur;
        g = { k: 'bin', op, g, d: this.unaire(), ligne };
      } else if (this.estType('mult')) {
        // « 3 millions » : multiplicateur postfixe.
        const ligne = this.ligne();
        const m = this.avance().valeur;
        g = { k: 'bin', op: '*', g, d: { k: 'nombre', v: m, ligne }, ligne };
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
    if (t.type === 'nombre') {
      this.avance();
      return { k: 'nombre', v: t.valeur, pourcent: t.pourcent, ligne: t.ligne };
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
        this.attendre(')', 'parenthèse fermante');
        return { k: 'appel', nom: t.valeur, args, ligne: t.ligne };
      }
      return { k: 'var', nom: t.valeur, ligne: t.ligne };
    }
    if (t.type === '(') {
      this.avance();
      const e = this.expr();
      this.attendre(')', 'parenthèse fermante');
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
  const p = new Parseur(lexer(source));
  const declarations = [];
  const options = [];
  let sortie = null;
  const unite = uniteDeclaree;
  let seuil = null;

  for (;;) {
    p.sauterNL();
    if (p.estType('fin')) break;
    const ligne = p.ligne();

    // Directives « unité: € » et « seuil: 0 ».
    if (p.estType('ident') && p.j[p.i + 1] && p.j[p.i + 1].type === ':') {
      const mot = p.cur().valeur.toLowerCase();
      if (SEUIL.has(mot)) {
        p.avance(); p.avance();
        seuil = { expr: p.expr(), ligne };
        if (!p.estType('nl') && !p.estType('fin')) {
          throw new ErreurModele('fin de ligne attendue après le seuil', p.ligne());
        }
        continue;
      }
      throw new ErreurModele(`réglage « ${p.cur().valeur} » inconnu (attendus : unité, seuil)`, ligne);
    }

    if (p.estMC('option') || p.estMC('choix')) {
      p.avance();
      let nom;
      if (p.estType('texte')) nom = p.avance().valeur;
      else if (p.estType('ident')) nom = p.avance().valeur;
      else throw new ErreurModele('nom d\'option attendu après « option »', ligne);
      if (p.estType(':')) p.avance();
      else p.attendre('assign', '« = » après le nom de l\'option');
      const e = p.expr();
      options.push({ nom, expr: e, ligne });
    } else if (p.estType('ident') && p.j[p.i + 1] && p.j[p.i + 1].type === 'assign') {
      const nom = p.avance().valeur;
      p.avance(); // =
      const e = p.expr();
      if (declarations.some((d) => d.nom === nom)) {
        throw new ErreurModele(`« ${nom} » est défini deux fois`, ligne);
      }
      declarations.push({ nom, expr: e, ligne });
    } else {
      const e = p.expr();
      sortie = { expr: e, ligne };
    }

    if (!p.estType('nl') && !p.estType('fin')) {
      throw new ErreurModele(`« ${p.cur().valeur ?? p.cur().type} » inattendu en fin de ligne`, p.ligne());
    }
  }

  if (!sortie && options.length === 0 && declarations.length > 0) {
    // Par défaut, la dernière variable définie est le résultat.
    const derniere = declarations[declarations.length - 1];
    sortie = { expr: { k: 'var', nom: derniere.nom, ligne: derniere.ligne }, ligne: derniere.ligne, implicite: true };
  }

  return { declarations, options, sortie, unite, seuil };
}
