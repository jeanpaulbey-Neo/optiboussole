// reglages.js — le modèle vu comme un formulaire.
//
// Pourquoi ce fichier existe. Cinquième passage du lecteur extérieur :
//
//   « Pour me servir d'un des douze modèles, je dois éditer du texte, alors que
//     le lexique contient déjà le mot français, l'unité et la source de chaque
//     hypothèse — je m'attendais à six champs "basse / haute" avec des
//     libellés, pas à du code. »
//
// Il a raison, et le site avait déjà tout pour le faire : `lexique.js` donne le
// mot, l'unité et l'adresse des 91 hypothèses de la bibliothèque ; depuis la
// session 17, le commentaire de fin de ligne et le symbole d'unité rendent la
// même chose sur un modèle écrit par le visiteur. Il ne manquait que les
// **positions** — savoir où, dans le texte, se trouvent les chiffres d'une
// ligne, pour en changer un sans réécrire le reste.
//
// Le principe qui tient tout : **le texte reste la vérité.** Le formulaire n'a
// pas d'état. Il se relit du texte à chaque calcul, et chaque champ modifié
// réécrit le texte, qui se relit. Rien ne peut diverger, et tout ce qui marche
// déjà — le lien de partage, la réinitialisation, les avertissements, les
// tests — continue de marcher sans le savoir.
//
// Ce que le formulaire ne prend pas : une formule (`emprunt = prix - apport`
// n'est pas une hypothèse, c'est un calcul), une loi écrite à la main
// (`bernoulli(8 %)`), une fourchette en `± `. Ces lignes-là restent au texte, et
// le texte reste à un clic.

import { lexer, extraireUnite } from './lang.js';

// Les quatre espaces qui séparent les milliers en français, plus l'apostrophe
// suisse : ce que le lexer accepte, le champ doit l'accepter aussi.
const NOMBRE_ECRIT = /^-?[0-9][0-9 \u00a0\u202f\u2009']*(?:[.,][0-9]+)?$/;

// « 250k » se règle en milliers : le champ affiche 250 et son unité dit « k€ ».
// Réécrire 250 000 à la place effacerait l'échelle que l'auteur a choisie.
const LETTRE_ECHELLE = new Map([[1e3, 'k'], [1e6, 'M'], [1e9, 'Md']]);

const estEspace = (c) => c === ' ' || c === '\u00a0' || c === '\u202f' || c === '\u2009';

// Un nombre éventuellement précédé de son signe, à la position `k` des jetons.
// Rend la borne, ou null si ce n'en est pas une.
function borne(jetons, k) {
  let negatif = false;
  let debut = k;
  if (jetons[k] && jetons[k].type === 'op' && (jetons[k].valeur === '-' || jetons[k].valeur === '+')) {
    negatif = jetons[k].valeur === '-';
    k++;
  }
  const t = jetons[k];
  if (!t || t.type !== 'nombre' || t.chiffres === undefined) return null;
  return {
    apres: k + 1,
    // Ce que le champ montre : la valeur dans l'échelle où elle est écrite.
    // « 3,2 % » se règle en points de pourcentage, pas en 0,032.
    affiche: (negatif ? -1 : 1) * (t.pourcent ? t.valeur * 100 : t.valeur / t.suffixe),
    pourcent: t.pourcent,
    suffixe: t.suffixe,
    symbole: t.symbole || null,
    // La tranche de texte que ce champ a le droit de remplacer : le signe et
    // les chiffres, rien d'autre. Le « % », le « k », le « € », l'espace et le
    // commentaire qui suivent sont à l'auteur.
    debut: jetons[debut].debut,
    fin: t.chiffres,
  };
}

// Le mot d'unité posé après un nombre — « 3 ans », « 7 à 9 L ». Le parseur le
// lit et l'ignore ; ici il sert d'étiquette.
function motUnite(jetons, k) {
  const t = jetons[k];
  if (!t || t.type !== 'ident') return null;
  return jetons[k + 1] ? null : t.valeur;
}

// Les hypothèses réglables d'un modèle, dans l'ordre du texte.
//
// Une ligne est réglable si elle s'écrit « nom = nombre » ou
// « nom = nombre à nombre », suivie au plus d'un mot d'unité. C'est la forme
// de presque toutes les lignes que les douze modèles de la bibliothèque
// demandent de remplacer, et c'est exactement celle qu'un formulaire sait
// montrer sans mentir.
export function reglages(source) {
  let jetons;
  // La ligne « unité: € » est neutralisée avant l'analyse lexicale, en
  // conservant sa longueur : les positions rendues ici sont donc celles du
  // texte que le visiteur a sous les yeux, et non d'une copie décalée.
  try { jetons = lexer(extraireUnite(source).source); } catch { return []; }

  const lignes = [];
  let courante = [];
  for (const t of jetons) {
    if (t.type === 'nl' || t.type === 'fin') { if (courante.length) lignes.push(courante); courante = []; }
    else courante.push(t);
  }

  const sorties = [];
  for (const l of lignes) {
    if (l.length < 3 || l[0].type !== 'ident' || l[1].type !== 'assign') continue;
    const bas = borne(l, 2);
    if (!bas) continue;

    let haut = null, apres = bas.apres;
    if (l[apres] && l[apres].type === 'interv') {
      haut = borne(l, apres + 1);
      if (!haut) continue;
      apres = haut.apres;
    }
    // Ce qui reste après les bornes : rien, ou un mot d'unité. Une formule
    // (« 7,5% * prix ») s'arrête ici — ce n'est pas une hypothèse.
    const mot = apres < l.length ? motUnite(l, apres) : null;
    if (apres < l.length && !mot) continue;

    sorties.push({
      nom: l[0].valeur,
      ligne: l[0].ligne,
      bornes: haut ? [bas, haut] : [bas],
      // L'unité que le texte lui-même porte, quand le lexique n'en a pas :
      // le symbole collé au nombre d'abord, le mot posé après ensuite.
      unite: bas.pourcent ? '%' : (bas.symbole || haut?.symbole || mot || ''),
      echelle: LETTRE_ECHELLE.get(bas.suffixe) || '',
    });
  }
  return sorties;
}

// Les titres de section que l'auteur a écrits — « # --- Le crédit --- » —, par
// numéro de ligne. Un commentaire seul sur sa ligne ne glose rien (session 17) ;
// celui-là découpe le modèle, et il découpe donc le formulaire. C'est du
// français écrit par l'auteur : le site ne fabrique aucun intertitre.
//
// La règle de reconnaissance est le trait de séparation, et il fallait une
// règle : les douze modèles s'ouvrent tous sur un paragraphe de commentaires
// qui explique le sujet, et « que la vraie valeur soit dedans » aurait fait un
// intertitre absurde au-dessus du premier champ. Un titre porte donc une suite
// d'au moins trois tirets, signes égal ou étoiles — la décoration que les douze
// modèles emploient déjà, et que le lexer efface depuis la session 17.
const TRAIT = /[-–—=*_]{3,}/;

export function intertitres(source) {
  const titres = new Map();
  source.split('\n').forEach((brute, k) => {
    const coupe = brute.search(/#|\/\//);
    if (coupe < 0) return;
    if (brute.slice(0, coupe).trim()) return;
    const corps = brute.slice(coupe).replace(/^(#|\/\/)+/, '');
    if (!TRAIT.test(corps)) return;
    const texte = corps.replace(/^[\s\-–—=*_]+|[\s\-–—=*_.;]+$/g, '').trim();
    if (texte.length >= 3 && /\p{L}/u.test(texte)) titres.set(k + 1, texte);
  });
  return titres;
}

// Ce que le champ affiche : le nombre tel qu'on le taperait, sans séparateur de
// milliers — on le relit pour le corriger, pas pour l'admirer.
export function afficher(x) {
  if (!Number.isFinite(x)) return '';
  return x.toLocaleString('fr-FR', { maximumFractionDigits: 6, useGrouping: false });
}

// Le texte tapé dans un champ, en nombre. `null` si ce n'en est pas un : le
// champ le dit et le modèle n'est pas touché.
export function lireChamp(texte) {
  const t = String(texte).trim().replace(/^\+/, '');
  if (!NOMBRE_ECRIT.test(t)) return null;
  const v = parseFloat(t.replace(/[ \u00a0\u202f\u2009']/g, '').replace(',', '.'));
  return Number.isFinite(v) ? v : null;
}

// Réécrit une borne dans le texte du modèle, et **rien d'autre**.
//
// C'est le cœur de l'affaire : le commentaire en français, le symbole d'unité,
// l'alignement des colonnes et jusqu'aux espaces sont ce que le site a mis
// quinze sessions à savoir lire. Un formulaire qui régénérerait la ligne les
// perdrait tous. On remplace donc la tranche des chiffres, au caractère près.
export function reecrire(source, b, valeur) {
  if (!Number.isFinite(valeur)) return source;
  // Rien à changer, rien à écrire. Sans cette garde, poser le curseur dans un
  // champ suffisait à réécrire « 1,60 » en « 1,6 » : le modèle du visiteur
  // bougeait sans qu'il ait rien demandé.
  if (valeur === b.affiche) return source;
  const negatif = valeur < 0;
  let texte = afficher(Math.abs(valeur));
  // Le signe entre dans la tranche remplacée : une borne qui passe de -1 à 2
  // doit effacer le « - », et l'inverse doit l'écrire.
  if (negatif) texte = '-' + texte;
  // Un signe collé à un chiffre précédent — « 2-1 » — ne se lit pas comme on
  // l'écrit. Le cas ne se présente qu'après « à », qui est un jeton, donc il y
  // a toujours de quoi séparer ; on s'en assure quand même.
  if (negatif && b.debut > 0 && !estEspace(source[b.debut - 1]) && /[0-9]/.test(source[b.debut - 1])) {
    texte = ' ' + texte;
  }
  return source.slice(0, b.debut) + texte + source.slice(b.fin);
}
