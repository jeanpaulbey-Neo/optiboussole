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
  'pourcent': 0.01, 'pourcents': 0.01,
  'mille': 1e3, 'milliers': 1e3,
  'million': 1e6, 'millions': 1e6,
  'milliard': 1e9, 'milliards': 1e9,
};

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

    // Nombre. Accepte 1 234,5 / 1_234.5 / 12% / 250k / 3.2e4
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(source[i + 1] || ''))) {
      let j = i, brut = '';
      // Les quatre espaces qui séparent les milliers en français : l'ordinaire,
      // l'insécable, la fine insécable — celle que produit `toLocaleString('fr-FR')`,
      // donc tout copier-coller d'une page web — et la fine.
      while (j < n && /[0-9_    ]/.test(source[j])) {
        // Un espace n'est un séparateur de milliers que s'il est suivi de 3 chiffres.
        if (/[    ]/.test(source[j])) {
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
        if (cle) { valeur *= SUFFIXES[cle]; j += cle.length; }
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
      // Si l'auteur a écrit « 1% à 4% », la grandeur est une proportion :
      // on s'en souvient pour l'afficher en pourcentage plus tard.
      const pourcent = (g.k === 'nombre' && g.pourcent) || (d.k === 'nombre' && d.pourcent);
      return { k: 'intervalle', bas: g, haut: d, pourcent, ligne };
    }
    // « 1000 ± 100 » : la même fourchette, écrite comme tout le monde l'écrit.
    if (this.estType('pm')) {
      const ligne = this.ligne();
      this.avance();
      const d = this.somme();
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

  somme() {
    let g = this.produit();
    for (;;) {
      if (!this.estOp('+', '-') && !this.continueLigne(['+', '-'])) break;
      const ligne = this.ligne();
      const op = this.avance().valeur;
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
    // Une condition peut servir d'opérande : « travail + si pepin alors 10
    // sinon 0 ». Sans ça, la seule écriture naturelle du cas le plus courant
    // — ajouter un aléa à une somme — était refusée.
    if (t.type === 'mc' && (t.valeur === 'si' || t.valeur === 'if')) return this.ternaire();
    // « entre 900 et 1150 » : la fourchette dite en français.
    if (t.type === 'ident' && t.valeur.toLowerCase() === 'entre'
        && this.j[this.i + 1] && this.j[this.i + 1].type !== '(') {
      this.avance();
      const bas = this.somme();
      if (!this.estMC('et') && !this.estMC('and')) {
        throw new ErreurModele('« et » attendu après « entre … »', t.ligne);
      }
      this.avance();
      const haut = this.somme();
      return {
        k: 'intervalle', bas, haut, ligne: t.ligne,
        pourcent: (bas.k === 'nombre' && bas.pourcent) || (haut.k === 'nombre' && haut.pourcent),
      };
    }
    if (t.type === 'texte') {
      throw new ErreurModele(
        'les guillemets ne servent qu\u2019à nommer une option : '
        + `écrivez « ${t.valeur} » sans guillemets, ou « option "${t.valeur}" = … »`, t.ligne);
    }
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
    const iDebut = p.i;

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
      else p.attendre('assign', '« = » après le nom de l’option');
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
      if (ligneJetons.length >= 2 && ligneJetons.length <= 3
          && ligneJetons[0].type === 'ident'
          && ligneJetons.slice(1).every((t) => t.type === 'nombre')) {
        // Sans séparateur de milliers : le message doit pouvoir être recopié tel
        // quel dans l'éditeur, et le visiteur n'avait pas écrit d'espace.
        const nb = ligneJetons.slice(1).map(
          (t) => t.valeur.toLocaleString('fr-FR', { useGrouping: false, maximumFractionDigits: 6 }));
        throw new ErreurModele(
          `cette ligne ressemble à une ligne de tableau. Écrivez-la « `
          + `${ligneJetons[0].valeur} = ${nb.join(' à ')} »`, ligne);
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
    // Par défaut, la dernière variable définie est le résultat.
    const derniere = declarations[declarations.length - 1];
    sortie = { expr: { k: 'var', nom: derniere.nom, ligne: derniere.ligne }, ligne: derniere.ligne, implicite: true };
  }

  return { declarations, options, sortie, unite, seuil, objectifDeduit };
}
