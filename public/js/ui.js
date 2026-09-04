// ui.js — l'interface.
//
// Le travail ici n'est pas d'afficher des nombres : c'est de les transformer en
// phrases sur lesquelles quelqu'un peut agir. Un pourcentage de variance
// expliquée ne dit rien à personne ; « la décision bascule si la revalorisation
// descend sous 1 %/an, ce qui arrive 4 fois sur 10 » dit quelque chose.

import { analyserModele, analyserRobustesse, histogramme } from './moteur.js';
import { analyserContreArgument } from './contre.js';
import { ErreurModele } from './lang.js';
import { MODELES, MODELE_PAR_DEFAUT } from './modeles.js';
import { hypothese } from './lexique.js';
import { reglages, intertitres, afficher, lireChamp, reecrire } from './reglages.js';

const $ = (s) => document.querySelector(s);
const zoneModele = $('#modele');
const zoneErreur = $('#erreur');
const zoneResultats = $('#resultats');
const listeExemples = $('#exemples');

const CLE_STOCKAGE = 'boussole.modele';

// L'exemple travaillé en tête d'accueil décrit le modèle servi juste en dessous,
// avec ses chiffres. Il n'est vrai que tant que c'est bien ce texte-là qui est à
// l'écran. Il l'était par une suite d'appels bien placés — un oubli suffisait à
// laisser un encadré qui parle de voiture au-dessus d'un modèle d'immobilier.
// C'est maintenant une question posée à chaque calcul, à laquelle il n'y a
// qu'une réponse possible : le texte affiché est-il celui que la page sert ?
function ajusterOuverture() {
  const n = document.querySelector('.exemple-ouverture');
  if (!n) return;
  const servi = MODELES.find((m) => m.cle === (document.body.dataset.modele || MODELE_PAR_DEFAUT));
  n.hidden = !servi || zoneModele.value.trim() !== servi.source.trim();
}
let cleCourante = document.body.dataset.modele || MODELE_PAR_DEFAUT;

// --- Mise en forme des nombres ----------------------------------------------

const nf = (options) => new Intl.NumberFormat('fr-FR', options);

// Mise en forme maison plutôt qu'Intl notation:'compact' : il faut contrôler
// la soudure entre le suffixe d'échelle et l'unité — « 72 k€ », pas « 72 k € » —
// et pouvoir imposer une même échelle aux deux bornes d'une plage.
function echelle(x) {
  const a = Math.abs(x);
  if (a >= 1e9) return [1e9, '\u202fMd'];
  if (a >= 1e6) return [1e6, '\u202fM'];
  if (a >= 1e4) return [1e3, '\u202fk'];
  return [1, ''];
}

function valeur(x, unite, ech = null) {
  if (!Number.isFinite(x)) return '—';
  if (unite === '%') {
    // Deux décimales sous 10 % : un taux de crédit à 3,21 % n'est pas à 3,2 %.
    return nf({ maximumFractionDigits: Math.abs(x) < 0.1 ? 2 : 1 }).format(x * 100) + '\u202f%';
  }
  const [diviseur, suffixe] = ech || echelle(x);
  const v = x / diviseur;
  const a = Math.abs(x), av = Math.abs(v);
  const decimales = suffixe
    ? (av >= 100 ? 0 : av >= 10 ? 1 : 2)
    : (a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : a === 0 ? 0 : 3);
  const texte = nf({ maximumFractionDigits: decimales }).format(v) + suffixe;

  if (!unite) return texte;
  // Un symbole se colle au suffixe d'échelle mais garde son espace insécable
  // sans lui : « 72 k€ », « 3 011 € », « 0,49 €/km », « 13 mois ».
  const symbole = /^[^\p{L}\s]/u.test(unite);
  return suffixe && symbole ? texte + unite : texte + '\u202f' + unite;
}

// Les deux bornes d'un intervalle partagent une échelle : « 8 k → 16,1 k »
// se lit, « 7 977 → 16,1 k » demande un effort inutile.
function plage(a, b, unite) {
  const ech = echelle(Math.abs(a) > Math.abs(b) ? a : b);
  // L'unité une seule fois, à la fin : « 1 497 → 2 508 kg CO₂e ». Le
  // pourcentage fait exception, il se colle à chaque nombre pour rester lisible.
  const debut = valeur(a, unite === '%' ? '%' : '', ech);
  return debut + ' → ' + valeur(b, unite, ech);
}

// La même chose au fil d'une phrase, où une flèche ne se lit pas :
// « de 6,1 à 50 mois », l'unité une seule fois, à la fin.
function plageProse(a, b, unite) {
  const ech = echelle(Math.abs(a) > Math.abs(b) ? a : b);
  return 'de ' + valeur(a, unite === '%' ? '%' : '', ech) + ' à ' + valeur(b, unite, ech);
}

const pourcent = (p) => nf({ maximumFractionDigits: p > 0 && p < 0.01 ? 1 : 0 }).format(p * 100) + ' %';

// « 4 fois sur 10 » parle mieux que « 38 % » pour une fréquence de regret.
function foisSur10(p) {
  const n = Math.round(p * 10);
  if (n <= 0) return 'quasiment jamais';
  if (n >= 10) return 'quasiment à tous les coups';
  return `${n === 1 ? 'une' : n} fois sur 10`;
}

// --- Fabriques DOM ----------------------------------------------------------

function el(balise, attrs = {}, enfants = []) {
  const n = document.createElement(balise);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    // Le style passe par le CSSOM et jamais par un attribut « style » :
    // la CSP du site interdit les styles inline, et c'est très bien ainsi.
    else if (k === 'style') for (const [prop, val] of Object.entries(v)) n.style[prop] = val;
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const e of [].concat(enfants)) {
    if (e === null || e === undefined) continue;
    n.appendChild(typeof e === 'string' ? document.createTextNode(e) : e);
  }
  return n;
}

// Construit une phrase où les noms d'hypothèses ressortent en monospace.
// Les segments sont soit du texte, soit ['code', 'nom_variable'].
function phrase(...segments) {
  const p = el('p', { class: 'verdict-phrase' });
  for (const s of segments) {
    if (s === null || s === undefined) continue;
    if (s instanceof Node) p.appendChild(s);
    else if (Array.isArray(s)) p.appendChild(el('code', { text: s[1] }));
    else p.appendChild(document.createTextNode(String(s)));
  }
  return p;
}

function jauge(fraction, pale = false) {
  const largeur = Math.max(0, Math.min(1, fraction || 0)) * 100;
  // Décorative : la valeur qu'elle illustre est toujours écrite à côté.
  return el('div', { class: pale ? 'barre pale' : 'barre', 'aria-hidden': 'true' },
    el('i', { style: { width: largeur.toFixed(1) + '%' } }));
}

// --- Distribution -----------------------------------------------------------

const SVGNS = 'http://www.w3.org/2000/svg';

function svgEl(nom, attrs = {}) {
  const n = document.createElementNS(SVGNS, nom);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
}

function courbe(stats, unite, seuil = null) {
  const h = histogramme(stats.tri, 60);
  const L = 300, H = 80;
  let pic = 0;
  for (const b of h.barres) if (b > pic) pic = b;
  pic = pic || 1;
  const x = (v) => ((v - h.a) / (h.b - h.a || 1)) * L;
  const y = (c) => H - (c / pic) * H;

  // Lissage : moyenne mobile pondérée sur trois barres.
  const pts = [];
  for (let i = 0; i < h.barres.length; i++) {
    const g = i > 0 ? h.barres[i - 1] : h.barres[i];
    const d = i < h.barres.length - 1 ? h.barres[i + 1] : h.barres[i];
    pts.push([(i + 0.5) * (L / h.barres.length), y((g + 2 * h.barres[i] + d) / 4)]);
  }
  const trace = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ');

  const svg = svgEl('svg', { viewBox: `0 0 ${L} ${H}`, preserveAspectRatio: 'none', 'aria-hidden': 'true' });

  // Bande centrale : les 90 % du milieu.
  const bg = Math.max(0, x(stats.p05)), bd = Math.min(L, x(stats.p95));
  svg.appendChild(svgEl('rect', { class: 'central', x: bg, y: 0, width: Math.max(0, bd - bg), height: H }));
  svg.appendChild(svgEl('path', { class: 'aire', d: `${trace} L${L},${H} L0,${H} Z` }));
  svg.appendChild(svgEl('path', { class: 'contour', d: trace }));

  if (h.a < 0 && h.b > 0) svg.appendChild(svgEl('line', { class: 'zero', x1: x(0), x2: x(0), y1: 0, y2: H }));
  svg.appendChild(svgEl('line', { class: 'mediane', x1: x(stats.p50), x2: x(stats.p50), y1: 0, y2: H }));
  if (seuil !== null && seuil > h.a && seuil < h.b) {
    svg.appendChild(svgEl('line', { class: 'seuil', x1: x(seuil), x2: x(seuil), y1: 0, y2: H }));
  }

  return el('figure', { class: 'distribution' }, [
    svg,
    el('div', { class: 'axe' }, [
      el('span', { text: valeur(stats.p05, unite) }),
      el('span', { text: 'médiane ' + valeur(stats.p50, unite) }),
      el('span', { text: valeur(stats.p95, unite) }),
    ]),
  ]);
}

// La distribution de l'écart entre les deux branches.
//
// Quinze sessions durant, j'ai écrit « toujours pas de graphiques » comme une
// discipline : le site répond en français, pas en tableau de bord. Un lecteur
// extérieur a fini par nommer ce qui manquait — « aucune représentation
// visuelle d'une distribution ou d'un poids » — et il a raison sur le mode
// décision, où la seule courbe du site ne s'affiche jamais.
//
// Ce n'est pas une décoration ajoutée pour faire joli : c'est la phrase « ce
// que vous jouez » rendue telle quelle. On tire vingt mille fois l'écart entre
// la branche retenue et sa meilleure rivale ; zéro sépare les simulations où
// le choix était bon de celles où l'autre branche l'emportait. Les deux aires
// **sont** les deux fréquences, et leur étalement est l'enjeu — précisément ce
// qu'un pourcentage seul ne peut pas dire. Une branche qui gagne souvent et
// petit, et perd rarement et gros, se voit d'un coup d'œil et ne se lit dans
// aucun des chiffres écrits au-dessus.
function courbePari(r) {
  const P = r.options.pari;
  if (!P || P.pGain === 0 || P.pPerte === 0) return null;
  const st = r.options.ecart;
  if (!st || !st.tri || !st.tri.length) return null;
  const unite = r.unite;

  const h = histogramme(st.tri, 72);
  // Zéro hors du cadre : les 99 % du milieu sont tous du même côté. Il n'y a
  // pas de partage à montrer, et le dessin mentirait par cadrage.
  if (!(h.a < 0 && h.b > 0)) return null;

  const L = 300, H = 80;
  let pic = 0;
  for (const b of h.barres) if (b > pic) pic = b;
  pic = pic || 1;
  const x = (v) => ((v - h.a) / (h.b - h.a)) * L;
  const y = (c) => H - (c / pic) * H;

  // Même lissage que la courbe d'estimation : moyenne mobile sur trois barres.
  const pts = [];
  for (let i = 0; i < h.barres.length; i++) {
    const g = i > 0 ? h.barres[i - 1] : h.barres[i];
    const d = i < h.barres.length - 1 ? h.barres[i + 1] : h.barres[i];
    pts.push([(i + 0.5) * (L / h.barres.length), y((g + 2 * h.barres[i] + d) / 4)]);
  }

  // On coupe la ligne à l'aplomb de zéro pour que les deux aires se remplissent
  // séparément. Sans interpolation, le partage tomberait sur le bord d'une
  // barre et la surface colorée ne vaudrait plus la fréquence annoncée.
  const x0 = x(0);
  let y0 = pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (pts[i - 1][0] <= x0 && pts[i][0] >= x0) {
      const t = (x0 - pts[i - 1][0]) / ((pts[i][0] - pts[i - 1][0]) || 1);
      y0 = pts[i - 1][1] + t * (pts[i][1] - pts[i - 1][1]);
      break;
    }
  }
  const gauche = pts.filter((q) => q[0] <= x0).concat([[x0, y0]]);
  const droite = [[x0, y0]].concat(pts.filter((q) => q[0] > x0));
  const ligne = (liste) => liste.map(([px, py], i) =>
    `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ');
  const aire = (liste) => liste.length < 2 ? null
    : `M${liste[0][0].toFixed(1)},${H} ${ligne(liste).slice(1)} L${liste[liste.length - 1][0].toFixed(1)},${H} Z`;

  const svg = svgEl('svg', { viewBox: `0 0 ${L} ${H}`, preserveAspectRatio: 'none', 'aria-hidden': 'true' });
  const dPerte = aire(gauche), dGain = aire(droite);
  if (dPerte) svg.appendChild(svgEl('path', { class: 'aire-perte', d: dPerte }));
  if (dGain) svg.appendChild(svgEl('path', { class: 'aire-gain', d: dGain }));
  svg.appendChild(svgEl('path', { class: 'contour', d: ligne(pts) }));

  // La queue des pertes : « jusqu'à tant dans le pire vingtième de ces cas-là »
  // est la seule phrase du bloc qui parle d'un endroit précis de la courbe.
  const pire = -P.pertePire;
  if (P.pertePire > 0 && pire > h.a && pire < 0) {
    svg.appendChild(svgEl('line', { class: 'pire', x1: x(pire), x2: x(pire), y1: 0, y2: H }));
  }
  svg.appendChild(svgEl('line', { class: 'zero', x1: x0, x2: x0, y1: 0, y2: H }));

  const rec = r.options.liste[r.options.recommande];
  const part = Math.max(6, Math.min(94, (x0 / L) * 100));
  const legende = el('div', { class: 'pari-legende' }, [
    el('span', { class: 'pari-cote perte', style: { width: part.toFixed(1) + '%' } },
      [el('b', { text: pourcent(P.pPerte) }), ' l’autre branche était meilleure']),
    el('span', { class: 'pari-cote gain', style: { width: (100 - part).toFixed(1) + '%' } },
      [el('b', { text: pourcent(P.pGain) }), ' \u00ab\u202f' + rec.nom + '\u202f\u00bb était le bon choix']),
  ]);

  // Sans échelle, une courbe est une décoration. Les deux bornes sont celles du
  // cadre — les 99 % du milieu de l'écart —, et le trait vertical est l'égalité
  // entre les branches, que la légende marque aussi par son changement de bord.
  // Les deux bornes partagent une échelle, comme partout ailleurs : « −10,5 k€ »
  // à gauche et « +8 743 € » à droite sur le même axe est une erreur de lecture
  // offerte au visiteur.
  const ech = echelle(Math.abs(h.a) > Math.abs(h.b) ? h.a : h.b);
  // Pas d'étiquette « égalité » au milieu de l'axe : elle se placerait au centre
  // de la ligne alors que le partage tombe où il tombe, et une légende décalée
  // de dix pour cent est pire qu'une légende absente. Le trait vertical et le
  // changement de bord de la légende marquent le zéro à sa vraie place.
  const axe = el('div', { class: 'axe' }, [
    el('span', { text: valeur(h.a, unite, ech) }),
    el('span', { text: '+' + valeur(h.b, unite, ech) }),
  ]);

  return el('figure', { class: 'distribution pari' }, [
    svg,
    legende,
    axe,
    el('figcaption', { class: 'pari-note' },
      `L’écart entre « ${rec.nom} » et l’autre branche, sur ${st.tri.length.toLocaleString('fr-FR')} `
      + `simulations : à droite du trait, votre choix était le bon${
        P.pertePire > 0 && pire > h.a ? ' ; le pointillé de gauche est le pire vingtième des cas défavorables' : ''}.`),
  ]);
}

// La fourchette d'une hypothèse, et le seuil qui la coupe.
//
// « Le résultat bascule vers "Changer" si reparations dépasse 1 109 €/an — 3
// fois sur 10 d'après votre fourchette. » Cette phrase décrit une étendue, un
// point dessus, et la part qui est au-delà du point. Elle était écrite ; on ne
// la voyait pas. Un lecteur extérieur, quatrième passage : « aucune
// représentation visuelle d'une fourchette ou d'un seuil ».
//
// **Une densité, et non un segment colorié.** J'ai d'abord dessiné la
// fourchette comme une barre pleine sur une échelle linéaire, la portion au-delà
// du seuil en ocre. C'était joli et faux d'un genre précis : sur « 398 à
// 1 794 », le seuil de 1 109 tombe à 51 % de la longueur alors qu'il n'est
// dépassé que 3 fois sur 10. La couleur promettait une fréquence que la longueur
// ne tenait pas — exactement le défaut que la courbe de l'écart avait pris soin
// d'éviter en coupant sa ligne à l'aplomb de zéro. Sur une densité, l'aire
// au-delà du trait **est** la proportion annoncée à côté.
//
// La bande porte aussi, sans le dire, le fait le plus contre-intuitif du site :
// le repère de médiane tombe visiblement à gauche du milieu, parce qu'une
// fourchette à bornes positives est lognormale. Le même lecteur a mis une page
// entière à comprendre que « 100 à 400 » vaut 200 et non 250. Ici, ça se voit
// avant de se lire.
function bandeFourchette(s, r) {
  if (s.binaire) return null;
  const st = s.stats;
  if (!st.tri || !st.tri.length) return null;
  if (!Number.isFinite(st.p05) || !Number.isFinite(st.p95) || st.p95 <= st.p05) return null;
  const u = uniteDe(s);
  const bascule = s.bascules.length === 1 ? s.bascules[0] : null;

  const h = histogramme(st.tri, 48);
  if (!(h.b > h.a)) return null;
  const L = 300, H = 22;
  let pic = 0;
  for (const b of h.barres) if (b > pic) pic = b;
  pic = pic || 1;
  const x = (v) => ((v - h.a) / (h.b - h.a)) * L;
  const y = (c) => H - (c / pic) * H;

  const pts = [];
  for (let i = 0; i < h.barres.length; i++) {
    const g = i > 0 ? h.barres[i - 1] : h.barres[i];
    const d = i < h.barres.length - 1 ? h.barres[i + 1] : h.barres[i];
    pts.push([(i + 0.5) * (L / h.barres.length), y((g + 2 * h.barres[i] + d) / 4)]);
  }
  const ligne = (liste) => liste.map(([px, py], i) =>
    `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ');
  const aire = (liste) => liste.length < 2 ? null
    : `M${liste[0][0].toFixed(1)},${H} ${ligne(liste).slice(1)} L${liste[liste.length - 1][0].toFixed(1)},${H} Z`;

  const svg = svgEl('svg', { viewBox: `0 0 ${L} ${H}`, preserveAspectRatio: 'none', 'aria-hidden': 'true' });

  // La fourchette à 90 % que le visiteur a écrite, en fond : c'est *son*
  // chiffre, et le reste de la densité est ce que le site en a déduit.
  const bg = Math.max(0, x(st.p05)), bd = Math.min(L, x(st.p95));
  if (bd > bg) svg.appendChild(svgEl('rect', { class: 'central', x: bg, y: 0, width: bd - bg, height: H }));

  // Le seuil coupe la ligne à son aplomb, par interpolation : au bord d'une
  // barre d'histogramme, l'aire colorée cesserait de valoir la proportion.
  const xs = bascule ? x(bascule.valeur) : null;
  const coupe = bascule && xs > 0 && xs < L;
  if (coupe) {
    let ys = pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      if (pts[i - 1][0] <= xs && pts[i][0] >= xs) {
        const t = (xs - pts[i - 1][0]) / ((pts[i][0] - pts[i - 1][0]) || 1);
        ys = pts[i - 1][1] + t * (pts[i][1] - pts[i - 1][1]);
        break;
      }
    }
    const gauche = pts.filter((q) => q[0] <= xs).concat([[xs, ys]]);
    const droite = [[xs, ys]].concat(pts.filter((q) => q[0] > xs));
    const versLeHaut = bascule.sens === 'hausse' || bascule.sens === 'au-dessus';
    const dG = aire(gauche), dD = aire(droite);
    if (dG) svg.appendChild(svgEl('path', { class: versLeHaut ? 'aire' : 'aire-bascule', d: dG }));
    if (dD) svg.appendChild(svgEl('path', { class: versLeHaut ? 'aire-bascule' : 'aire', d: dD }));
  } else {
    const d = aire(pts);
    if (d) svg.appendChild(svgEl('path', { class: 'aire', d }));
  }
  svg.appendChild(svgEl('path', { class: 'contour', d: ligne(pts) }));
  svg.appendChild(svgEl('line', { class: 'mediane', x1: x(st.p50), x2: x(st.p50), y1: 0, y2: H }));
  if (coupe) svg.appendChild(svgEl('line', { class: 'seuil', x1: xs, x2: xs, y1: 0, y2: H }));

  // Les étiquettes sont posées à l'aplomb de ce qu'elles nomment, jamais aux
  // extrémités du cadre : le cadre va du demi-centile au 99,5ᵉ pour que les
  // aires soient justes, et l'annoncer comme « la fourchette » contredirait la
  // ligne de texte juste au-dessus. Ce qui est nommé, c'est donc les deux bornes
  // que le visiteur a écrites — le rectangle pâle — et le seuil.
  const etiquette = (v, classe, contenu) => {
    const px = (x(v) / L) * 100;
    if (px < -2 || px > 102) return null;
    const c = Math.max(3, Math.min(97, px));
    return el('span', {
      class: 'fourchette-etiquette' + (classe ? ' ' + classe : '')
        + (c > 70 ? ' a-droite' : c < 30 ? ' a-gauche' : ''),
      style: { left: c.toFixed(2) + '%' },
    }, contenu);
  };

  // Une étiquette de borne qui viendrait se poser sur celle du seuil est
  // retirée : sa valeur est de toute façon écrite en toutes lettres une ligne
  // plus haut, celle du seuil ne l'est qu'ici et dans la phrase d'action.
  const loin = (v) => !coupe || Math.abs(x(v) - xs) / L > 0.14;
  const sous = el('div', { class: 'fourchette-sous' }, [
    loin(st.p05) ? etiquette(st.p05, null, valeur(st.p05, u)) : null,
    coupe ? etiquette(bascule.valeur, 'seuil', [el('b', { text: valeur(bascule.valeur, u) })]) : null,
    loin(st.p95) ? etiquette(st.p95, null, valeur(st.p95, u)) : null,
  ]);

  const lignes = [
    el('div', { class: 'fourchette-rang' }, el('div', { class: 'fourchette-piste' }, svg)),
    sous,
  ];

  return el('div', {
    class: 'fourchette',
    // Le dessin ne dit rien que les phrases voisines ne disent : il montre ce
    // qu'elles décrivent. Le relire à voix haute serait du bruit.
    'aria-hidden': 'true',
  }, lignes);
}

// --- Rendu d'une hypothèse --------------------------------------------------

// Une hypothèse est « notable » si la connaître changerait quelque chose.
// Un gain de 4 € sur un choix qui en vaut 12 800 n'en change aucun : l'afficher
// au même rang que le reste noierait ce qui compte.
function notable(s, r) {
  if (!r.modeDecision) return s.part >= 0.02;
  if (r.options.acquise) return false;
  return s.valeurInfo >= Math.max(r.options.evpi * 0.01, 1e-9);
}

function ligneHypothese(s, r, indice) {
  const unite = r.unite;
  const nomBouton = el('button', {
    class: 'hypothese-nom', type: 'button',
    title: 'Voir cette ligne dans le modèle',
  }, s.nom);
  nomBouton.addEventListener('click', () => surligneLigne(s.ligne));

  const chiffre = r.modeDecision
    ? el('span', { class: 'hypothese-chiffre' },
        notable(s, r)
          ? [el('b', { text: valeur(s.valeurInfo, unite) }), ' à gagner en le sachant']
          : ['ne change pas le choix'])
    : el('span', { class: 'hypothese-chiffre' },
        [el('b', { text: pourcent(s.part) }), ' de l’incertitude']);

  const bloc = el('li', { class: 'hypothese' }, [
    el('div', { class: 'hypothese-tete' }, [nomBouton, chiffre]),
    // Un identifiant de code n'est pas un mot. `reparations`, `tjm`,
    // `par_km_thermique` ne disent rien à qui n'a pas lu le modèle — et le
    // premier visiteur extérieur du site n'avait pas lu le modèle.
    quoiDe(s) ? el('p', { class: 'quoi', text: quoiDe(s) }) : null,
    jauge(r.modeDecision ? s.valeurInfo / (r.options.evpi || 1) : s.part,
          indice > 0 && (r.modeDecision ? s.valeurInfo === 0 : s.part < 0.08)),
  ]);

  // La phrase qui sert à agir.
  if (s.bascules.length === 1) {
    const b = s.bascules[0];
    const sens = (b.sens === 'hausse' || b.sens === 'au-dessus') ? 'dépasse' : 'descend sous';
    const cible = r.modeDecision
      ? `bascule vers \u00ab\u202f${b.vers}\u202f\u00bb`
      : `passe ${b.sens === 'au-dessus' ? 'au-dessus' : 'en dessous'} du seuil`;
    bloc.appendChild(el('p', { class: 'bascule' },
      [`Le résultat ${cible} si `, el('span', { class: 'plage', text: s.nom }),
       ` ${sens} `, el('b', { text: valeur(b.valeur, uniteDe(s)) }),
       ` — ${foisSur10(b.proba)} d’après votre fourchette.`]));
  } else if (s.bascules.length > 1) {
    bloc.appendChild(el('p', { class: 'bascule' },
      `Plusieurs seuils : ${s.bascules.map((b) => valeur(b.valeur, uniteDe(s))).join(', ')}.`));
  } else if (s.binaire) {
    bloc.appendChild(el('p', {},
      `Événement tout ou rien : il se produit ${foisSur10(s.stats.moyenne)}.`));
  } else if (!r.modeDecision && s.gainLargeur > 0.02) {
    bloc.appendChild(el('p', {},
      `Le connaître exactement resserrerait la fourchette de ${pourcent(s.gainLargeur)}, à environ ${valeur(s.largeurResiduelle, unite)} de large.`));
  }

  // La médiane écrite à côté des bornes, et c'est délibéré : sur « 400 à 1 800 »
  // elle vaut 849, pas 1 100. C'est le principe de départ du site — une
  // fourchette à bornes positives est lognormale — et il était expliqué sur deux
  // pages de fond que personne n'atteint avant d'avoir lu les résultats. Écrit
  // ici, il est au seul endroit où il sert : sous les chiffres qu'il explique.
  const detail = 'aujourd’hui : ' + plage(s.stats.p05, s.stats.p95, uniteDe(s))
    + ', médiane ' + valeur(s.stats.p50, uniteDe(s));
  bloc.appendChild(el('p', { class: 'plage' },
    r.modeDecision ? `${detail} · porte ${pourcent(s.part)} de l’écart entre les branches` : detail));

  const bande = bandeFourchette(s, r);
  if (bande) bloc.appendChild(bande);

  return bloc;
}

// L'unité du modèle décrit le résultat, pas forcément chaque hypothèse : dans
// un modèle en €/km, `km_an` est un nombre de kilomètres et `reparations` des
// euros par an. Afficher « 7 977 €/km » serait faux. Le site n'en déduisait
// donc aucune, et affichait « au-dessus de 1 109 » — un nombre nu, que le
// premier visiteur extérieur a lu sans savoir de quoi il parlait.
//
// Pour les modèles de la bibliothèque, l'unité de chaque hypothèse est écrite à
// la main dans `lexique.js` : c'est la seule source fiable, personne ne peut la
// déduire du texte. Ailleurs, on ne connaît toujours avec certitude que le
// pourcentage, parce que l'auteur l'a écrit tel quel.
function uniteDe(s) {
  const h = hypothese(cleCourante, s.nom);
  if (h && h.unite) return h.unite;
  if (s.pourcent) return '%';
  // À défaut du lexique : le mot d'unité que l'auteur a écrit après son nombre,
  // « reparations = 400 à 1800 €/an ». C'est la seule unité qu'on connaisse
  // pour un modèle qu'on n'a pas écrit, et elle vaut mieux qu'un nombre nu —
  // un lecteur extérieur, quatrième passage : « quand j'écris mon propre
  // modèle, je n'ai plus que des identifiants sans unité ».
  return s.unite || '';
}

// Le mot que le visiteur emploierait, à la place de l'identifiant de code.
//
// Le lexique d'abord — écrit à la main, relu, testé. Puis, à défaut, la glose
// que l'auteur du modèle a lui-même mise en commentaire de fin de ligne. Le
// site n'invente toujours rien : il rend au visiteur ce qu'il a écrit, à
// l'endroit où ça sert. Sur un modèle de la bibliothèque les deux existent et
// le lexique gagne ; sur le modèle de quelqu'un d'autre, il n'y avait rien.
const quoiDe = (s) => {
  const h = hypothese(cleCourante, s.nom);
  if (h && h.quoi) return h.quoi;
  return s.quoi || null;
};

// Où aller chercher le chiffre, dans le monde. C'est la réponse à « et
// maintenant, qu'est-ce que j'en fais ? », et le site avait tout pour la donner
// sans jamais l'écrire.
function phraseOu(s) {
  const h = hypothese(cleCourante, s.nom);
  if (!h) return null;
  // Un tirage tout ou rien : le verdict a déjà dit qu'aucune enquête ne le
  // lèverait, inutile de le redire ici.
  if (s.binaire) return null;
  // Pas de source honnête, et le dire vaut mieux que se taire : c'est la
  // différence entre une incertitude qu'on lève et une qu'on subit.
  if (!h.ou) {
    return phrase(el('b', { text: 'Où le trouver. ' }),
      'Nulle part, et c’est une réponse : ce chiffre-là ne s’enquête pas, il se juge. ',
      'Aucun relevé, aucun devis ne vous le donnera avant que vous ayez à décider — ',
      'ce qui veut dire qu’il ne sert à rien d’attendre pour en savoir plus.');
  }
  return phrase(el('b', { text: 'Où le trouver. ' }), h.ou[0].toUpperCase() + h.ou.slice(1) + '.');
}

// --- Verdict ----------------------------------------------------------------

// « 4 fois sur 10 » est l'idiome du site pour une fréquence, mais il dit
// « quasiment jamais » sous 5 % : aux extrêmes, le pourcentage est plus juste.
const frequence = (p) => (p >= 0.05 && p <= 0.95) ? foisSur10(p) : pourcent(p) + ' du temps';

// Ce qu'on gagne quand on a raison, ce qu'on perd quand on a tort.
//
// « L'emporte 6 fois sur 10 » ne dit rien de l'enjeu des 4 autres. Sur « louer
// ou acheter », acheter rapporte 36 000 € quand il gagne, coûte 26 000 € quand
// il perd, et 78 000 € dans le pire vingtième de ces cas-là. Deux branches
// peuvent se valoir en fréquence sans être le même pari.
function phrasePari(r) {
  const P = r.options.pari;
  if (!P || P.pPerte === 0 || P.pGain === 0) return null;
  const unite = r.unite;
  const rec = r.options.liste[r.options.recommande];
  const autre = r.options.liste.length > 2 ? 'une autre branche' : 'l’autre branche';
  // La queue ne s'annonce que si elle apprend quelque chose de plus que la
  // médiane des pertes : sinon on répète le même chiffre avec plus de mots.
  const pire = P.pertePire > P.perteMediane * 1.2
    ? [', et jusqu’à ', el('b', { text: valeur(P.pertePire, unite) }),
       ' dans le pire vingtième de ces cas-là']
    : [];
  return phrase(
    el('b', { text: 'Ce que vous jouez. ' }),
    'Quand \u00ab\u202f', rec.nom, '\u202f\u00bb l’emporte — ', frequence(P.pGain),
    ' —, c’est ', el('b', { text: valeur(P.gainMedian, unite) }), ' de mieux en médiane. Quand ',
    autre, ' aurait été meilleure — ', frequence(P.pPerte), ' —, c’est ',
    el('b', { text: valeur(P.perteMediane, unite) }), ' de moins',
    ...pire, '.');
}

// --- Aller savoir avant de décider ------------------------------------------
//
// Le site chiffrait déjà ce que vaudrait de lever une hypothèse. Il laissait au
// visiteur le soin de comparer ce chiffre au prix d'un diagnostic, d'un devis
// ou de six semaines d'attente — c'est-à-dire de faire lui-même la seule partie
// qui décide. Une ligne « savoir X = 300 € » referme l'écart, et la réponse
// n'est pas un nombre : c'est « allez-y » ou « n'y allez pas », et la règle à
// appliquer une fois qu'on saura.
//
// La borne haute est ce qui rend l'exercice concluant : le prix calculé est
// celui d'une information **parfaite**. Aucune enquête réelle ne fait mieux.
// Quand elle est déjà sous le coût, il n'y a plus à discuter de la qualité du
// diagnostic — il ne se paiera pas, quel qu'il soit.
function blocAttentes(r) {
  if (!r.attentes.length) return null;
  const utiles = r.attentes.filter((a) => !a.probleme);
  const fautes = r.attentes.filter((a) => a.probleme);
  const unite = r.unite;
  const bloc = el('section', { class: 'panneau bloc' },
    el('h2', { text: 'Aller savoir, ou décider maintenant ?' }));

  for (const a of utiles) {
    const entree = el('div', { class: 'attente' });
    const nomBouton = el('button', {
      class: 'hypothese-nom', type: 'button', title: 'Voir cette ligne dans le modèle',
    }, a.nom);
    nomBouton.addEventListener('click', () => surligneLigne(a.ligne));
    const verbe = a.mot === 'attendre' ? 'Attendre' : 'Savoir';
    entree.appendChild(el('div', { class: 'hypothese-tete' }, [
      nomBouton,
      el('span', { class: 'hypothese-chiffre' },
        [el('b', { text: valeur(a.gain, unite) }), ' à gagner, ',
         a.cout > 0 ? valeur(a.cout, unite) + ' à dépenser' : 'et rien à dépenser']),
    ]));

    // Une seule tranche : la meilleure branche est la même quelle que soit la
    // valeur. L'information est parfaite et ne sert à rien — ce n'est pas une
    // nuance, c'est la réponse.
    if (a.segments.length < 2) {
      entree.appendChild(phrase(
        'Quel que soit le résultat, vous feriez la même chose : \u00ab\u202f',
        r.options.liste[a.segments.length ? a.segments[0].option : r.options.recommande].nom,
        '\u202f\u00bb. Cette information ne vaut rien ici — non parce qu’elle serait ',
        'mauvaise, mais parce qu’elle ne déplace pas votre geste. ',
        a.cout > 0
          ? [el('b', { text: 'Ne le faites pas' }), ' : ce serait ' + valeur(a.cout, unite) + ' pour rien.']
          : 'Rien ne vous en empêche, mais n’en attendez pas de réponse.'));
    } else {
      const gagne = a.net > 0;
      entree.appendChild(phrase(
        verbe, ' ', ['code', a.nom], ' avant de choisir vaut ',
        el('b', { text: valeur(a.gain, unite) }),
        a.cout > 0 ? ', pour ' + valeur(a.cout, unite) + ' : ' : ' et ne coûte rien : ',
        el('b', { text: gagne ? 'allez-y' : 'ça ne se paie pas' }),
        gagne
          ? '. Vous y gagnez ' + valeur(a.net, unite) + ' en moyenne.'
          : '. Il manque ' + valeur(-a.net, unite) + ' pour que ça vaille la peine.'));
      entree.appendChild(el('p', { class: 'bascule' }, regleApres(a, r)));
    }
    bloc.appendChild(entree);
  }

  for (const a of fautes) {
    bloc.appendChild(phrase(
      ['code', a.nom],
      a.probleme === 'introuvable'
        ? ' n’est pas une hypothèse de ce modèle : il n’y a rien à aller savoir dessus.'
        : ' est déjà une valeur certaine ici. Vous la connaissez : ni l’attente ni '
          + 'l’enquête ne vous apprendront quoi que ce soit.'));
  }

  if (utiles.length) {
    bloc.appendChild(el('p', { class: 'option-detail note-basse' },
      'Ces prix sont ceux d’une information parfaite — celle qui vous donnerait la '
      + 'valeur exacte, d’avance. Un diagnostic, un devis, six semaines d’attente en '
      + 'apprennent moins, et rapportent donc moins. C’est une borne haute, et c’est ce '
      + 'qui la rend utile : quand elle est déjà sous le coût, la question est tranchée '
      + 'sans avoir à discuter de la qualité de l’enquête.'));
  }
  return bloc;
}

// La règle qu'on appliquerait une fois l'hypothèse connue. C'est la partie que
// personne ne calcule : « ça vaut 640 € » n'est pas actionnable, « au-dessus de
// 1 040, installez » l'est.
function regleApres(a, r) {
  const u = uniteDe(a);
  const nom = (i) => '\u00ab\u202f' + r.options.liste[i].nom + '\u202f\u00bb';
  if (a.binaire) {
    const seg = a.segments;
    const oui = seg[seg.length - 1], non = seg[0];
    return `Ce qu’il faudra en faire : si l’événement se produit — ${foisSur10(a.stats.moyenne)} —, `
      + `${nom(oui.option)} ; sinon, ${nom(non.option)}.`;
  }
  const bouts = [];
  let cumul = 0;
  for (let i = 0; i < a.segments.length; i++) {
    const seg = a.segments[i];
    cumul += seg.part;
    // La frontière tombe entre deux tranches voisines : on la lit au milieu.
    const fin = i < a.segments.length - 1
      ? (seg.haut + a.segments[i + 1].bas) / 2 : null;
    if (i === 0) bouts.push(`en dessous de ${valeur(fin, u)}, ${nom(seg.option)}`);
    else if (fin === null) bouts.push(`au-dessus, ${nom(seg.option)} — ce qui arrive ${foisSur10(seg.part)}`);
    else bouts.push(`jusqu’à ${valeur(fin, u)}, ${nom(seg.option)}`);
  }
  return 'Ce qu’il faudra en faire : ' + bouts.join(' ; ') + '.';
}

function blocDecision(r) {
  const unite = r.unite;
  const o = r.options.liste;
  const rec = o[r.options.recommande];
  const p = rec.pGagne;
  const decisif = r.sources.filter((s) => notable(s, r));
  const tete = decisif[0];
  // Une hypothèse « tout ou rien » peut dominer la valeur de l'information
  // sans qu'on puisse rien y faire : gagner ou non cet appel d'offres, tomber
  // ou non sur l'incident. C'est le hasard du modèle, pas une enquête à mener,
  // et « c'est là qu'il faut passer votre temps » serait un mauvais conseil.
  // On nomme le hasard, puis on désigne ce qui reste vérifiable.
  //
  // Sauf si le visiteur a écrit « savoir » dessus. Il connaît son sujet mieux
  // que cette règle : le résultat d'un test médical, l'accord d'un financeur,
  // l'issue d'un recours sont des tirages tout ou rien qu'une attente lève.
  // Sans cette exception, le site affichait « aucune enquête ne le lèvera »
  // trois lignes au-dessus de « savoir gagne vaut 28 €, allez-y ».
  const declaree = (s) => r.attentes.some((a) => a.id === s.id && !a.probleme);
  const hasard = tete && tete.binaire && !declaree(tete) ? tete : null;
  const verifiable = hasard ? decisif.find((x) => !x.binaire || declaree(x)) : tete;

  // Deux règles de décision cohabitent ici : la branche retenue est celle de
  // meilleure espérance, la phrase raconte celle qui gagne le plus souvent.
  // Quand elles désignent la même branche — tous les modèles de la
  // bibliothèque — la question ne se pose pas. Quand elles diffèrent, il ne
  // faut ni trancher ni parler d'égalité : « à égalité, l'emporte 10 % du
  // temps » était la phrase que le site affichait, et elle ne veut rien dire.
  const desaccord = r.options.desaccord;
  const freq = o[r.options.frequent];

  const serre = !desaccord && p < 0.62;
  const verdict = el('section', { class: 'panneau bloc verdict' + (serre || desaccord ? ' serre' : '') });
  verdict.appendChild(el('p', { class: 'verdict-chapeau',
    text: desaccord ? 'Le modèle ne tranche pas' : serre ? 'Trop serré pour trancher' : 'Ce que dit le modèle' }));
  verdict.appendChild(el('h2', { class: 'verdict-titre',
    text: desaccord ? 'Deux réponses' : serre ? 'À égalité' : rec.nom }));

  if (desaccord) {
    verdict.appendChild(phrase(
      '\u00ab\u202f', rec.nom, '\u202f\u00bb rapporte le plus en moyenne — ',
      valeur(rec.stats.moyenne, unite), ' contre ', valeur(freq.stats.moyenne, unite),
      ' —, mais c’est \u00ab\u202f', freq.nom, '\u202f\u00bb qui l’emporte le plus souvent, ',
      frequence(freq.pGagne), '. Les deux sont vrais en même temps : \u00ab\u202f', rec.nom,
      '\u202f\u00bb gagne rarement et gros.'));
  } else if (serre) {
    verdict.appendChild(phrase(
      'Les deux branches se valent : \u00ab\u202f', rec.nom, '\u202f\u00bb l’emporte ',
      pourcent(p), ' du temps, ce qui n’est pas un écart sur lequel on engage quoi que ce soit. ',
      'Aucun chiffre ne désigne la branche — mais les deux ne vous engagent pas de la même façon.'));
  } else if (p >= 0.9) {
    verdict.appendChild(phrase(
      '\u00ab\u202f', rec.nom, '\u202f\u00bb l’emporte dans ', pourcent(p),
      ' des simulations. L’écart est net : votre incertitude actuelle ne suffit pas à le renverser.'));
  } else {
    verdict.appendChild(phrase(
      '\u00ab\u202f', rec.nom, '\u202f\u00bb l’emporte, mais ce n’est pas acquis : ',
      foisSur10(r.options.pRegret), ', l’autre branche aurait été meilleure.'));
  }

  const pari = phrasePari(r);
  if (pari) verdict.appendChild(pari);
  // L'image vient sous la phrase qu'elle montre, pas à la place : le texte
  // reste la réponse, et il se lit sans elle.
  if (pari) {
    const dessin = courbePari(r);
    if (dessin) verdict.appendChild(dessin);
  }

  if (desaccord) {
    verdict.appendChild(phrase(
      'Aucun calcul ne départage ces deux lectures : elles répondent à deux questions ',
      'différentes. Ce qui les départage, c’est le nombre de fois où vous jouerez ce ',
      'coup-là, et ce que devient le reste si le mauvais cas tombe.'));
  }

  if (hasard) {
    // Le hasard d'abord, nommé pour ce qu'il est, puis ce qui reste à vérifier
    // — dans la même phrase, sinon la seconde moitié part en paragraphe seul.
    const segments = [
      'Ce qui décide le plus ici est ', ['code', hasard.nom],
      ', et c’est un tirage tout ou rien : il se produit ', foisSur10(hasard.stats.moyenne),
      '. Aucune enquête ne le lèvera avant que vous ayez à choisir — c’est le hasard du ',
      'modèle, pas une information à aller chercher.',
    ];
    if (verifiable) {
      const b = verifiable.bascules[0];
      segments.push(' Parmi ce que vous pouvez encore vérifier, c’est ', ['code', verifiable.nom],
        quoiDe(verifiable) ? ' — ' + quoiDe(verifiable) + ' — ' : ' ',
        'qui compte le plus. ');
      if (b) {
        segments.push(`Le verdict passe à \u00ab\u202f${b.vers}\u202f\u00bb `
          + `${b.sens === 'hausse' ? 'au-dessus de' : 'en dessous de'} `
          + `${valeur(b.valeur, uniteDe(verifiable))}, ce qui arrive ${foisSur10(b.proba)}. `);
      }
      segments.push(`Lever le doute dessus vaut environ ${valeur(verifiable.valeurInfo, unite)}.`);
    } else {
      segments.push(' Et rien de ce que vous pouvez vérifier ne déplace ce choix.');
    }
    verdict.appendChild(phrase(...segments));
  } else if (verifiable) {
    const b = verifiable.bascules[0];
    verdict.appendChild(phrase(
      decisif.length === 1
        ? 'Une seule hypothèse peut renverser ce choix : '
        : 'L’hypothèse qui pèse le plus sur ce choix est ',
      ['code', verifiable.nom],
      quoiDe(verifiable) ? ', ' + quoiDe(verifiable) + '. ' : '. ',
      b
        ? `Le verdict passe à \u00ab\u202f${b.vers}\u202f\u00bb ${b.sens === 'hausse' ? 'au-dessus de' : 'en dessous de'} ${valeur(b.valeur, uniteDe(verifiable))}, ce qui arrive ${foisSur10(b.proba)}. `
        : '',
      `Lever le doute dessus vaut environ ${valeur(verifiable.valeurInfo, unite)}`,
      // « C'est là qu'il faut passer votre temps » ne sert plus à rien quand la
      // phrase suivante dit précisément où aller : on ne le dit qu'à défaut.
      phraseOu(verifiable) ? '.' : ' — c’est là qu’il faut passer votre temps, pas ailleurs.'));
  } else {
    verdict.appendChild(phrase(
      'Aucune de vos hypothèses ne renverse ce choix sur sa plage plausible',
      r.options.acquise
        ? ' : l’écart entre les branches est trop grand pour qu’un chiffre le comble. '
        : '. ',
      'Chercher des valeurs plus précises ne changerait pas votre décision — ',
      'c’est le moment d’arrêter d’enquêter et de décider.'));
  }

  // « Et maintenant, qu'est-ce que j'en fais ? » — la question que le premier
  // visiteur extérieur s'est posée sans trouver de réponse. Le site désignait
  // l'hypothèse à lever et s'arrêtait là. L'endroit où aller la chercher est
  // écrit, hypothèse par hypothèse, dans lexique.js.
  const ou = verifiable ? phraseOu(verifiable) : null;
  if (ou) verdict.appendChild(ou);

  // Et la réponse pour qui ne fera rien de tout cela.
  //
  // Cinquième passage du lecteur extérieur : « la réponse que j'obtiens est un
  // devoir d'une heure, pas une réponse ». C'est en partie le parti pris du
  // site — il dit où passer une heure parce que c'est ce qu'aucun simulateur
  // ne dit. Mais le devoir n'était nulle part présenté comme facultatif, alors
  // que le calcul sait déjà ce qu'il advient si on ne le fait pas : la branche
  // de meilleure espérance reste la meilleure avec ce qu'on sait aujourd'hui,
  // et la fréquence dit à quel point c'est un pari. Une phrase, déjà calculée,
  // et le visiteur repart avec une réponse même s'il ferme la page.
  if (verifiable && !serre && !desaccord) {
    verdict.appendChild(phrase(
      el('b', { text: 'Et si vous n’allez rien chercher\u202f: ' }),
      '\u00ab\u202f', rec.nom, '\u202f\u00bb quand même — c’est la meilleure branche avec ce que ',
      'vous savez déjà, et vous auriez eu raison ', foisSur10(1 - r.options.pRegret), '.'));
  }

  // Les branches comparées.
  const options = el('section', { class: 'panneau bloc' }, el('h2', { text: 'Les branches' }));
  const liste = el('ul', { class: 'options' });
  for (const opt of o) {
    // La jauge montre la fréquence de victoire, le chiffre montre la moyenne.
    // Quand les deux ne désignent pas la même branche, un seul fanion
    // « retenue » sur une jauge à 10 % rejouerait à l'écran la contradiction
    // que le texte vient d'expliquer : on nomme alors les deux titres.
    const gagnante = desaccord ? (opt === rec || opt === freq) : opt === rec;
    const fanion = !gagnante ? null
      : desaccord ? (opt === rec ? 'meilleure moyenne' : 'gagne le plus souvent')
      : serre ? 'en tête' : 'retenue';
    liste.appendChild(el('li', { class: 'option-ligne' + (gagnante ? ' gagnante' : '') }, [
      el('span', { class: 'option-nom' },
        [opt.nom, fanion ? el('span', { class: 'fanion', text: fanion }) : null]),
      el('span', { class: 'option-valeur', text: valeur(opt.stats.moyenne, unite) }),
      el('div', { class: 'option-jauge' },
        el('i', { style: { width: (opt.pGagne * 100).toFixed(1) + '%' } })),
      el('div', { class: 'option-detail' },
        `l’emporte ${pourcent(opt.pGagne)} du temps · 9 fois sur 10 : ${plage(opt.stats.p05, opt.stats.p95, unite)}`),
    ]));
  }
  options.appendChild(liste);
  options.appendChild(el('p', { class: 'option-detail note-basse' },
    `Tout savoir avec certitude avant de choisir vaudrait ${valeur(r.options.evpi, unite)}. C’est le maximum que puisse rapporter n’importe quelle enquête : au-delà, elle coûte plus qu’elle ne rapporte.`));

  const attentes = blocAttentes(r);
  return attentes ? [verdict, attentes, options] : [verdict, options];
}

function blocEstimation(r) {
  const unite = r.unite;
  const st = r.sortie;
  const tete = r.sources[0];

  const verdict = el('section', { class: 'panneau bloc verdict' });
  verdict.appendChild(el('p', { class: 'verdict-chapeau', text: r.nomSortie || 'Résultat' }));
  verdict.appendChild(el('h2', { class: 'verdict-titre' }, valeur(st.p50, unite)));
  verdict.appendChild(phrase(
    'Neuf fois sur dix, entre ', valeur(st.p05, unite), ' et ', valeur(st.p95, unite),
    '. La valeur médiane seule ne vous apprend presque rien : c’est la largeur qui compte.'));

  if (r.seuil !== null && r.pAtteint !== undefined) {
    const max = r.seuilSens === 'max';
    verdict.appendChild(phrase(
      max ? 'Vous voulez rester sous ' : 'Vous visez au moins ', valeur(r.seuil, unite),
      max ? ' : c’est tenu dans ' : ' : c’est atteint dans ', pourcent(r.pAtteint),
      ' des cas.'));
  }

  if (tete && tete.part > 0.05) {
    verdict.appendChild(phrase(
      ['code', tete.nom],
      quoiDe(tete) ? ' — ' + quoiDe(tete) + ' — ' : ' ',
      'porte ', pourcent(tete.part),
      ' de cette incertitude à elle seule. Si vous la connaissiez exactement, la fourchette se resserrerait à ',
      valeur(tete.largeurResiduelle, unite), ' de large, contre ', valeur(r.largeurTotale, unite),
      ' aujourd’hui. Commencez par là.'));
  } else {
    verdict.appendChild(phrase(
      'Aucune hypothèse ne domine : l’incertitude est répartie. ',
      'Précisez-en une seule et la fourchette bougera à peine — il faudrait toutes les resserrer.'));
  }

  if (tete && tete.part > 0.05) {
    const ou = phraseOu(tete);
    if (ou) verdict.appendChild(ou);
  }

  verdict.appendChild(courbe(st, unite, r.seuil));
  return [verdict];
}


// --- Le contre-argument ------------------------------------------------------
//
// Tout le reste de la page va des hypothèses vers la conclusion. Cette
// section-ci va dans l'autre sens : elle nomme le jeu d'hypothèses le plus
// proche du vôtre qui donnerait la réponse contraire. Elle sert à deux choses
// qu'aucune autre ne sait faire.
//
// Quand aucune hypothèse ne renverse le verdict à elle seule — c'est le cas de
// trois modèles de la bibliothèque — la section précédente n'a rien à dire.
// Ici, on montre la combinaison qui, elle, le renverse.
//
// Et quand même ça ne suffit pas, on dit la seule chose vraiment utile : votre
// désaccord avec ce modèle n'est pas dans ses chiffres, il est dans ce qui n'y
// est pas.

// β est une distance dans l'espace des écarts. Le seul repère qui parle est la
// fourchette que le visiteur a lui-même écrite : son bord, c'est 1,645 écart.
function ampleur(beta) {
  if (beta < 0.35) return 'un déplacement minuscule, très en deçà de vos fourchettes';
  if (beta < 0.9) return 'nettement moins que le bord de vos fourchettes';
  if (beta < 1.5) return 'un peu moins que le bord de vos fourchettes';
  if (beta < 2.1) return 'à peu près le bord de vos fourchettes';
  if (beta < 3.2) return 'au-delà de ce que vos fourchettes admettent';
  return 'très au-delà de ce que vos fourchettes admettent';
}

const ecarts = (b) => nf({ maximumFractionDigits: 2 }).format(b) + ' écart' + (b >= 2 ? 's' : '');

function rendreContre(c, r) {
  if (!c || !c.applicable) return null;

  // La section précédente balaie chaque hypothèse seule, les autres à leur
  // médiane. Quand elle trouve un seuil de bascule, elle a déjà répondu, et
  // plus simplement : redire la même chose avec cinq décimales de plus
  // n'aiderait personne. On ne prend la parole que là où elle se tait — quand
  // aucune hypothèse ne renverse le verdict à elle seule — ou pour dire l'une
  // des deux choses qu'elle ne sait pas dire : que les valeurs centrales
  // donnent déjà l'autre réponse, ou qu'elles tombent pile sur la frontière.
  const aucunSeuilSimple = r.sources.every((s) => s.bascules.length === 0);
  if (!aucunSeuilSimple && !c.medianeContredit && !c.surLaFrontiere) return null;

  const bloc = el('section', { class: 'panneau bloc contre' },
    el('h2', { text: 'Ce qui vous ferait changer d\u2019avis' }));

  // Ce qu'on cherche à faire arriver, dit une fois pour toutes.
  const but = c.modeDecision
    ? `que \u00ab\u202f${c.cible}\u202f\u00bb l\u2019emporte`
    : (c.tenu
        ? `manquer ${valeur(r.seuil, r.unite)}`
        : `tenir ${valeur(r.seuil, r.unite)}`);

  if (c.medianeContredit) {
    bloc.appendChild(phrase(
      el('b', { text: 'Vos valeurs médianes disent déjà l\u2019inverse. ' }),
      'Si chaque hypothèse tombait exactement sur sa valeur centrale, le résultat serait ',
      c.modeDecision ? `\u00ab\u202f${c.cible}\u202f\u00bb` : 'de l\u2019autre côté du seuil',
      '. Ce verdict ne tient donc pas au centre de vos fourchettes mais à leur forme : ',
      'c\u2019est une hésitation, pas une réponse.'));
    return bloc;
  }

  // β presque nul : il n'y a rien à déplacer, et c'est ça, l'information.
  if (c.surLaFrontiere) {
    bloc.appendChild(phrase(
      el('b', { text: 'Vous êtes exactement sur la ligne. ' }),
      'Avec chaque hypothèse à sa valeur centrale, le résultat tombe pile sur ',
      c.modeDecision ? 'l\u2019égalité entre les deux branches' : valeur(r.seuil, r.unite),
      '. Il n\u2019y a aucun chiffre à corriger pour ', but,
      ' : le moindre écart, dans n\u2019importe quel sens, suffit. ',
      'Ne lisez pas ce verdict comme une réponse — lisez-le comme l\u2019absence de marge.'));
    if (c.figees.length) {
      bloc.appendChild(el('p', { class: 'rien note-basse' },
        `Sans compter ${c.figees.map((f) => f.nom).join(', ')}, tenu${c.figees.length > 1 ? 's' : ''} `
        + 'à sa valeur la plus probable.'.replace('sa', c.figees.length > 1 ? 'leur' : 'sa')));
    }
    return bloc;
  }

  if (!c.atteint || c.beta === null) {
    bloc.appendChild(phrase(
      el('b', { text: 'Rien de plausible ne renverse ce verdict. ' }),
      'Pour ', but, ', il faudrait s\u2019être trompé de plus de ', ecarts(c.portee),
      ' sur l\u2019ensemble de vos hypothèses prises ensemble. Ce n\u2019est plus une erreur ',
      'd\u2019estimation, c\u2019est un autre problème. ',
      'Si vous hésitez encore, ce n\u2019est aucun des chiffres de ce modèle qui vous fait ',
      'hésiter : c\u2019est quelque chose qui n\u2019y est pas. Cherchez quoi, et ajoutez-le — ',
      'c\u2019est le seul travail qui reste.'));
    return bloc;
  }

  const d = c.deplacements;
  if (d.length === 0) return null;
  const solo = d[0].part >= 0.7;

  // Un seul chiffre porte tout le contre-argument : la phrase le dit mieux
  // qu'une liste d'une ligne, et la fourchette d'origine donne l'échelle.
  if (solo) {
    const t = d[0];
    const src = r.sources.find((x) => x.nom === t.nom);
    bloc.appendChild(phrase(
      'Pour ', but, ', il suffirait que ', ['code', t.nom], ' ',
      t.z > 0 ? 'monte à ' : 'tombe à ', el('b', { text: valeur(t.valeur, uniteDe(t)) }),
      ' au lieu de ', valeur(t.mediane, uniteDe(t)), ', le reste inchangé. ',
      src ? `Votre fourchette va ${plageProse(src.stats.p05, src.stats.p95, uniteDe(t))}\u202f: ` : '',
      t.horsFourchette
        ? 'c\u2019est en dehors. Il ne suffit donc pas que cette hypothèse soit mal '
          + 'centrée — il faut que la fourchette elle-même soit fausse.'
        : 'c\u2019est dedans, et rien n\u2019exclut que ce soit la bonne valeur.'));
    return bloc;
  }
  {
    bloc.appendChild(phrase(
      'Pour ', but, ', il faudrait que ces ', String(d.length),
      ' chiffres soient faux ', el('b', { text: 'ensemble, et dans le même sens' }), ' :'));
  }

  const liste = el('ul', { class: 'contre-liste' });
  for (const t of d) {
    liste.appendChild(el('li', {}, [
      el('span', { class: 'contre-nom', text: t.nom }),
      // Pas de flèche ici : juste au-dessus, « 15 % → 30 % » désigne une
      // fourchette. La même flèche pour un déplacement se lirait de travers.
      el('span', { class: 'contre-valeurs' }, [
        el('b', { text: valeur(t.valeur, uniteDe(t)) }),
        el('span', { class: 'contre-avant', text: ' au lieu de ' + valeur(t.mediane, uniteDe(t)) }),
      ]),
      el('span', { class: 'contre-part', text: pourcent(t.part) }),
      t.horsFourchette ? el('span', { class: 'contre-hors', text: 'hors fourchette' }) : null,
    ]));
  }
  bloc.appendChild(liste);

  {
    bloc.appendChild(phrase(
      'Pris ensemble, c\u2019est ', el('b', { text: ecarts(c.beta) }), ' \u2014 ',
      ampleur(c.beta), '. ',
      'Aucune de ces valeurs n\u2019est aberrante prise seule : c\u2019est leur conjonction ',
      'qui l\u2019est, ou non. Regardez-les comme un scénario, et demandez-vous si c\u2019est ',
      'le vôtre.'));
  }

  if (c.figees.length) {
    const noms = c.figees.map((f) => f.nom).join(', ');
    bloc.appendChild(el('p', { class: 'rien note-basse' },
      `Ce scénario suppose que ${noms} ${c.figees.length > 1 ? 'restent' : 'reste'} à `
      + `${c.figees.length > 1 ? 'leurs valeurs les plus probables' : 'sa valeur la plus probable'} : `
      + 'un événement tout ou rien ne se déplace pas d\u2019une fraction d\u2019écart.'));
  }

  return bloc;
}

// --- Le détail des calculs ---------------------------------------------------
//
// Un tableur montre chaque cellule. Ici, « mensualite » ou « cout_achat »
// restaient des noms sans valeur : impossible de vérifier son modèle autrement
// qu'en le croyant. Chaque variable calculée est donnée avec sa médiane et sa
// fourchette, et chaque somme est décomposée — c'est le poids de chaque poste,
// à sa valeur médiane, ce que « D'où vient l'incertitude » ne dit pas et ne
// prétend pas dire.

// L'état déplié survit au recalcul : la page se redessine à chaque frappe.
let detailOuvert = false;

function ligneDetail(nom, v, unite, { ligne = null, classe = '' } = {}) {
  const li = el('li', { class: classe });
  if (ligne) {
    const b = el('button', { class: 'detail-nom', type: 'button', title: 'Voir cette ligne dans le modèle' }, nom);
    b.addEventListener('click', () => surligneLigne(ligne));
    li.appendChild(b);
  } else {
    li.appendChild(el('span', { class: 'detail-nom', text: nom }));
  }
  li.appendChild(el('span', { class: 'detail-val', text: valeur(v.p50, unite) }));
  li.appendChild(el('span', { class: 'detail-plage', text: v.fixe ? 'valeur fixe' : plage(v.p05, v.p95, unite) }));
  return li;
}

function lignesTermes(termes, unite) {
  const max = Math.max(...termes.map((t) => Math.abs(t.p50))) || 1;
  return termes.map((t) => {
    const li = el('li', { class: 'terme' }, [
      el('span', { class: 'detail-nom' }, [
        el('span', { class: 'terme-signe', text: t.signe < 0 ? '−' : '+' }), t.etiquette]),
      el('span', { class: 'detail-val', text: valeur(t.p50, unite) }),
      jauge(Math.abs(t.p50) / max, true),
    ]);
    return li;
  });
}

function rendreDetail(r) {
  const d = r.detail;
  if (!d) return null;
  const unite = r.unite;
  const liste = el('ul', { class: 'detail-liste' });
  let n = 0;

  // Les branches et le résultat d'abord, quand ils se décomposent : c'est le
  // poids de chaque poste dans ce qui est comparé.
  for (const o of d.options) {
    if (!o.termes) continue;
    const stats = r.options.liste.find((x) => x.nom === o.nom);
    if (!stats) continue;
    liste.appendChild(ligneDetail(o.nom, { p05: stats.stats.p05, p50: stats.stats.p50, p95: stats.stats.p95, fixe: false }, unite, { classe: 'tete' }));
    for (const li of lignesTermes(o.termes, unite)) liste.appendChild(li);
    n++;
  }
  if (d.sortie && d.sortie.termes && r.sortie) {
    liste.appendChild(ligneDetail(r.nomSortie || 'résultat', r.sortie, unite, { classe: 'tete' }));
    for (const li of lignesTermes(d.sortie.termes, unite)) liste.appendChild(li);
    n++;
  }
  for (const c of d.calculs) {
    liste.appendChild(ligneDetail(c.nom, c, '', { ligne: c.ligne, classe: c.termes ? 'tete' : '' }));
    if (c.origines) {
      // D'où vient l'incertitude de cette valeur-là : les hypothèses qui la
      // portent, ou le constat qu'aucune ne domine.
      liste.appendChild(el('li', { class: 'origines' },
        c.origines.length
          ? ['incertitude portée par ', ...c.origines.flatMap((o, k) => [
              k ? ', ' : '', el('code', { text: o.nom }), ' ' + pourcent(o.part)])]
          : 'incertitude répartie entre plusieurs hypothèses, aucune ne domine'));
    }
    if (c.termes) for (const li of lignesTermes(c.termes, '')) liste.appendChild(li);
    n++;
  }
  if (n === 0) return null;

  const bloc = el('details', { class: 'panneau bloc detail', open: detailOuvert }, [
    el('summary', {}, [
      el('h2', { text: 'Le détail des calculs' }),
      el('span', { class: 'detail-compte', text: `${n} valeur${n > 1 ? 's' : ''}` }),
    ]),
    el('p', { class: 'rien' },
      'Chaque valeur calculée, médiane et fourchette à 90 %, dans l’ordre du modèle, avec les '
      + 'hypothèses qui portent son incertitude. Les sommes sont décomposées : c’est le poids de '
      + 'chaque poste à sa valeur médiane — ce qui pèse le plus, pas ce qui est le plus incertain.'),
    liste,
  ]);
  bloc.addEventListener('toggle', () => { detailOuvert = bloc.open; });
  return bloc;
}

// --- Robustesse à l'excès de confiance --------------------------------------
//
// Le seul chiffre que le visiteur fournit est une fourchette, et c'est
// précisément ce que les humains font le plus mal : nos intervalles « à 90 % »
// contiennent la vraie valeur bien moins souvent que 9 fois sur 10. Plutôt que
// de faire la leçon, on mesure ce que ça coûterait à sa conclusion.

const facteur = (k) => nf({ maximumFractionDigits: 2 }).format(k) + '×';

function rendreRobustesse(rob, r) {
  const bloc = $('#robustesse');
  if (!bloc) return;
  bloc.replaceChildren();
  if (!rob || !rob.applicable) { bloc.hidden = true; return; }
  bloc.hidden = false;
  bloc.appendChild(el('h2', { text: 'Et si vos fourchettes étaient trop étroites ?' }));

  if (rob.modeDecision) {
    const gagnante = r.options.liste[r.options.recommande].nom;
    if (rob.kBascule !== null) {
      const rival = rob.paliers.find((p) => p.k === rob.kBascule).recommande;
      bloc.appendChild(phrase(
        el('b', { text: rob.kBascule <= 1.5 ? 'Très fragile. ' : 'Fragile. ' }),
        'Il suffirait que vos fourchettes soient ', facteur(rob.kBascule),
        ' trop étroites pour que « ', rival, ' » passe devant « ', gagnante,
        ' ». C’est dans l’ordre du plausible : les intervalles à 90 % qu’on donne ',
        'spontanément contiennent la vraie valeur environ une fois sur deux, ',
        'pas neuf fois sur dix. Élargissez vos fourchettes avant de vous fier à ce verdict.'));
    } else if (rob.kBrouillage !== null) {
      bloc.appendChild(phrase(
        el('b', { text: 'Le classement tient, l’écart non. ' }),
        '« ', gagnante, ' » reste devant même avec des fourchettes ', facteur(rob.max),
        ' plus larges. Mais à partir de ', facteur(rob.kBrouillage),
        ', l’avantage n’est plus assez net pour qu’on puisse trancher dessus.'));
    } else {
      bloc.appendChild(phrase(
        el('b', { text: 'Solide. ' }),
        'Même avec des fourchettes ', facteur(rob.max),
        ' plus larges, « ', gagnante, ' » reste devant et l’écart reste net. ',
        'Cette conclusion ne dépend donc pas de la justesse de vos fourchettes, ',
        'mais de leurs valeurs centrales : c’est là qu’il faut porter l’attention.'));
    }

    // L'échelle s'arrête au premier basculement : répéter « → Louer » quatre
    // fois n'apprend rien de plus.
    const echelons = [];
    for (const p of rob.paliers) {
      if (p.recommande === gagnante) echelons.push(`${facteur(p.k)} ${pourcent(p.pGagne)}`);
      else { echelons.push(`${facteur(p.k)} → ${p.recommande}`); break; }
    }
    bloc.appendChild(el('p', { class: 'echelle', text: echelons.join('  ·  ') }));
    return;
  }

  const d = rob.double;
  if (!d) { bloc.hidden = true; return; }
  const segments = [
    el('b', { text: 'Si vos fourchettes sont deux fois trop étroites, ' }),
    'le résultat ne s’étale plus ', plageProse(r.sortie.p05, r.sortie.p95, r.unite),
    ', mais ', plageProse(d.p05, d.p95, r.unite), '.',
  ];
  if (d.pAtteint !== undefined && r.pAtteint !== undefined) {
    segments.push(r.seuilSens === 'max' ? ' Votre chance de rester sous ' : ' Votre chance d’atteindre ',
      valeur(r.seuil, r.unite),
      ' passe de ', pourcent(r.pAtteint), ' à ', pourcent(d.pAtteint), '.');
  }
  segments.push(' Les intervalles à 90 % qu’on donne spontanément contiennent la vraie ',
    'valeur environ une fois sur deux : cet élargissement n’a rien d’excessif.');
  bloc.appendChild(phrase(...segments));
}

// --- Rendu principal --------------------------------------------------------

// Les problèmes qui empêchent d'afficher un résultat, dits en français plutôt
// qu'en message d'exception.
const PROBLEMES = {
  'sans-resultat': [
    'Il manque un résultat.',
    'Votre modèle ne calcule rien pour l’instant : il faut soit une dernière ligne '
    + 'qui donne le résultat, soit au moins deux lignes « option » à comparer.',
  ],
  'valeurs-impossibles': [
    'Le calcul produit des valeurs impossibles.',
    'Quelque part, une division par zéro, la racine d’un nombre négatif ou une '
    + 'puissance qui explose. Vérifiez les lignes où une hypothèse peut valoir zéro : '
    + 'écrire « 0 à 100 » autorise des valeurs très proches de zéro, et diviser par '
    + 'elles ne donne rien de bon.',
  ],
};

// Ce qu'un lecteur d'écran entend après un recalcul : le verdict et sa
// première phrase, seulement s'ils ont changé. Pas la page entière.
const zoneAnnonce = $('#annonce');
let derniereAnnonce = '';
function annoncer() {
  if (!zoneAnnonce) return;
  const titre = zoneResultats.querySelector('.verdict-titre');
  if (!titre) return;
  const chapeau = titre.previousElementSibling;
  const suite = titre.nextElementSibling;
  const tete = (chapeau ? chapeau.textContent + '\u202f: ' : '') + titre.textContent + '.';
  const texte = [tete, suite && suite.tagName === 'P' && suite.textContent]
    .filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  if (texte === derniereAnnonce) return;
  derniereAnnonce = texte;
  zoneAnnonce.textContent = texte;
}

function rendre(r) {
  rendreContenu(r);
  annoncer();
}

function rendreContenu(r) {
  zoneResultats.replaceChildren();
  rendreAvertissements(r.avertissements);
  if (r.probleme) {
    const [titre, explication] = PROBLEMES[r.probleme];
    const bloc = el('section', { class: 'panneau bloc verdict serre' }, [
      el('p', { class: 'verdict-chapeau', text: 'Rien à afficher' }),
      el('h2', { class: 'verdict-titre', text: titre }),
    ]);
    bloc.appendChild(phrase(explication));
    zoneResultats.appendChild(bloc);
    return;
  }
  if (r.vide) {
    zoneResultats.appendChild(el('section', { class: 'panneau bloc' },
      el('p', { class: 'rien', text: 'Écrivez une première ligne, par exemple \u00ab\u202fclients = 20 à 200\u202f\u00bb. Le résultat apparaît ici au fur et à mesure.' })));
    return;
  }

  for (const n of (r.modeDecision ? blocDecision(r) : blocEstimation(r))) {
    zoneResultats.appendChild(n);
  }

  const section = el('section', { class: 'panneau bloc' },
    el('h2', { text: r.modeDecision ? 'Ce qu’il faut aller vérifier' : 'D’où vient l’incertitude' }));

  if (r.sources.length === 0) {
    section.appendChild(el('p', { class: 'rien' },
      'Votre modèle ne contient aucune incertitude : tous les chiffres sont fermes. Remplacez-en un par une fourchette, par exemple \u00ab\u202f900 à 1150\u202f\u00bb, pour que le site ait quelque chose à dire.'));
  } else {
    // On garde les hypothèses qui pèsent, et au moins les trois premières pour
    // qu'un modèle où rien ne pèse ne renvoie pas une liste vide.
    let montrees = r.sources.filter((s) => notable(s, r));
    if (montrees.length < 3) montrees = r.sources.slice(0, 3);
    montrees = montrees.slice(0, 10);
    const reste = r.sources.filter((s) => !montrees.includes(s));

    const liste = el('ul', { class: 'hypotheses' });
    montrees.forEach((s, i) => liste.appendChild(ligneHypothese(s, r, i)));
    section.appendChild(liste);

    if (reste.length) {
      const n = reste.length, pl = n > 1;
      const noms = reste.slice(0, 6).map((s) => s.nom).join(', ') + (n > 6 ? '…' : '');
      section.appendChild(el('p', { class: 'rien note-basse' },
        r.modeDecision
          ? `${n} autre${pl ? 's' : ''} hypothèse${pl ? 's' : ''} ne change${pl ? 'nt' : ''} pas le choix, même ${pl ? 'à leurs valeurs extrêmes' : 'à ses valeurs extrêmes'} : ${noms}.`
          : `${n} autre${pl ? 's' : ''} hypothèse${pl ? 's' : ''} pèse${pl ? 'nt' : ''} moins de 2 %${pl ? ' chacune' : ''} : ${noms}.`));
    }
  }
  zoneResultats.appendChild(section);

  // Le contre-argument coûte quelques millisecondes : il part avec le verdict,
  // sans attendre l'arrêt de la frappe comme la robustesse.
  try {
    const contre = rendreContre(analyserContreArgument(r), r);
    if (contre) zoneResultats.appendChild(contre);
  } catch { /* une frontière introuvable ne doit pas emporter la page */ }

  zoneResultats.appendChild(el('section', { class: 'panneau bloc', id: 'robustesse', hidden: true }));

  const detail = rendreDetail(r);
  if (detail) zoneResultats.appendChild(detail);
}

// --- Erreurs ----------------------------------------------------------------

// Un avertissement ne bloque pas le calcul : il signale les fautes qui donnent
// un résultat plausible mais faux, celles qu'aucun message d'erreur ne rattrape.
function rendreAvertissements(liste) {
  const zone = $('#avertissements');
  if (!zone) return;
  zone.replaceChildren();
  if (!liste || liste.length === 0) { zone.hidden = true; return; }
  zone.hidden = false;
  for (const a of liste) {
    const ligne = el('li', {});
    const lien = el('button', { class: 'renvoi', type: 'button', text: `ligne ${a.ligne}` });
    lien.addEventListener('click', () => surligneLigne(a.ligne));
    ligne.appendChild(lien);
    ligne.appendChild(document.createTextNode(' · ' + a.texte));
    zone.appendChild(ligne);
  }
}

function montrerErreur(e) {
  zoneErreur.replaceChildren();
  if (e instanceof ErreurModele) {
    zoneErreur.appendChild(document.createTextNode(
      e.ligne ? `Ligne ${e.ligne} : ${e.message}` : e.message));
  } else {
    zoneErreur.appendChild(document.createTextNode('Le modèle n’a pas pu être calculé : ' + e.message));
  }
  zoneErreur.hidden = false;
}

function surligneLigne(n) {
  if (!n) return;
  const lignes = zoneModele.value.split('\n');
  let debut = 0;
  for (let i = 0; i < n - 1 && i < lignes.length; i++) debut += lignes[i].length + 1;
  const fin = debut + (lignes[n - 1] || '').length;
  zoneModele.focus();
  zoneModele.setSelectionRange(debut, fin);
  // Faire défiler la ligne dans la vue de manière approximative mais suffisante.
  const hauteurLigne = parseFloat(getComputedStyle(zoneModele).lineHeight) || 21;
  zoneModele.scrollTop = Math.max(0, (n - 6) * hauteurLigne);
}

// --- Le modèle comme formulaire ---------------------------------------------
//
// Cinquième passage du lecteur extérieur : « pour me servir d'un des douze
// modèles, je dois éditer du texte, alors que le lexique contient déjà le mot
// français, l'unité et la source de chaque hypothèse — je m'attendais à six
// champs "basse / haute" avec des libellés, pas à du code. »
//
// Le site avait tout : le mot est dans `lexique.js` ou dans le commentaire que
// l'auteur a écrit en fin de ligne, l'unité dans le lexique ou dans le symbole
// collé au nombre, les intertitres dans les commentaires de section. Ce qui
// manquait, c'était les positions — et `reglages.js` les donne.
//
// Le formulaire n'a **pas d'état**. Il se relit du texte, et chaque champ
// réécrit le texte. C'est ce qui fait que le lien de partage, la
// réinitialisation, les pastilles et les avertissements continuent de marcher
// sans rien savoir de lui.

const zoneReglages = $('#reglages');
const detailsTexte = $('#texte-modele');

// La signature dit si la *forme* du formulaire a changé — les noms, le nombre
// de bornes, les intertitres. Tant qu'elle tient, on met à jour les valeurs
// sans reconstruire le DOM : sinon le champ perdrait le curseur à chaque
// frappe, et on ne pourrait pas taper « 1400 » sans repartir de « 1 ».
function signature(entrees, titres) {
  return entrees.map((e) => `${e.ligne}:${e.nom}:${e.bornes.length}:${titres.get(e.ligne) || ''}`).join('|');
}
let signatureCourante = null;

// Ce que le site sait dire de cette hypothèse-là, dans l'ordre : le lexique,
// écrit à la main pour les douze modèles ; sinon le commentaire de fin de
// ligne, écrit par l'auteur du modèle. Rien ne s'invente.
function libelle(e, commentaires) {
  const h = hypothese(cleCourante, e.nom);
  if (h && h.quoi) return h.quoi;
  return (commentaires && commentaires.get(e.ligne)) || null;
}

function uniteReglage(e) {
  const h = hypothese(cleCourante, e.nom);
  const u = (h && h.unite) || e.unite || '';
  // « prix = 250k » se règle en milliers : le champ dit 250, l'étiquette dit
  // « k€ ». Réécrire 250 000 dans le texte effacerait l'échelle de l'auteur.
  return e.echelle && u !== '%' ? e.echelle + u : u;
}

const ROLES = [['bas', 'basse'], ['haut', 'haute']];

function champ(e, i, unite, nomAccessible) {
  const role = e.bornes.length === 2 ? ROLES[i][1] : 'valeur';
  const entree = el('input', {
    class: 'reglage-champ', type: 'text', inputmode: 'decimal',
    autocomplete: 'off', spellcheck: 'false',
    value: afficher(e.bornes[i].affiche),
    'aria-label': `${nomAccessible}, ${role}${unite ? ' en ' + unite : ''}`,
  });
  entree.dataset.nom = e.nom;
  entree.dataset.borne = String(i);
  entree.addEventListener('input', () => modifier(entree));
  return el('label', { class: 'reglage-case' }, [
    el('span', { class: 'reglage-role', text: role }),
    entree,
  ]);
}

// Un champ modifié réécrit le texte du modèle, et rien d'autre.
//
// Les positions sont **relues à chaque frappe** plutôt que gardées : dès qu'une
// borne change de longueur, celles qui suivent se décalent. Relire coûte une
// analyse lexicale sur quarante lignes, c'est-à-dire rien, et supprime la seule
// façon qu'aurait ce formulaire d'écrire au mauvais endroit.
function modifier(entree) {
  const v = lireChamp(entree.value);
  if (v === null) {
    entree.setAttribute('aria-invalid', 'true');
    return;
  }
  entree.removeAttribute('aria-invalid');
  const e = reglages(zoneModele.value).find((x) => x.nom === entree.dataset.nom);
  if (!e) return;
  const b = e.bornes[+entree.dataset.borne];
  if (!b) return;
  zoneModele.value = reecrire(zoneModele.value, b, v);
  programmer();
}

// Le rappel de ce qu'est une fourchette, à l'endroit où on la saisit. Il était
// sur trois pages de fond ; c'est ici qu'il sert.
const INTRO_PLAGE = 'Vos chiffres. Pour ce que vous ne savez pas, donnez deux bornes '
  + 'plutôt qu’une valeur inventée : celles entre lesquelles vous mettriez 9 chances sur 10.';

function construireReglages(entrees, titres, commentaires) {
  const corps = el('div', { class: 'reglages-corps' });
  let dernierTitre = null;
  for (const e of entrees) {
    const t = titres.get(e.ligne - 1) || titres.get(e.ligne - 2) || null;
    if (t && t !== dernierTitre) {
      corps.appendChild(el('h3', { class: 'reglages-titre', text: t }));
      dernierTitre = t;
    }
    const unite = uniteReglage(e);
    const quoi = libelle(e, commentaires);
    const nomAccessible = quoi || e.nom;

    const nom = el('button', {
      class: 'reglage-nom', type: 'button',
      title: 'Voir cette ligne dans le modèle',
    }, e.nom);
    nom.addEventListener('click', () => {
      if (detailsTexte) detailsTexte.open = true;
      surligneLigne(e.ligne);
    });

    const bloc = el('div', { class: 'reglage' }, [
      el('div', { class: 'reglage-tete' }, [
        el('span', { class: 'reglage-quoi', text: quoi || e.nom }),
        quoi ? nom : null,
      ]),
      el('div', { class: 'reglage-champs' }, [
        ...e.bornes.map((_, i) => champ(e, i, unite, nomAccessible)),
        unite ? el('span', { class: 'reglage-unite', text: unite }) : null,
      ]),
      el('p', { class: 'reglage-note', text: 'C’est ce chiffre-là qui décide.', hidden: true }),
    ]);
    bloc.dataset.nom = e.nom;
    corps.appendChild(bloc);
  }
  return corps;
}

// Le texte du modèle est replié quand le formulaire peut le remplacer, et
// déplié quand il ne le peut pas — page blanche, modèle en cours d'écriture,
// erreur. Ce n'est pas un choix esthétique : le lecteur extérieur qui a
// demandé ce formulaire écrivait, quatrième passage, « la page d'accueil me
// demande d'apprendre un langage alors qu'elle dit ne rien demander ». Le
// langage est toujours là, à un clic, et c'est toujours lui la vérité.
//
// Appelé au chargement et au changement de modèle seulement : au fil de la
// frappe, c'est au visiteur de décider ce qui est ouvert.
function positionnerTexte() {
  if (!detailsTexte || !zoneReglages) return;
  const m = MODELES.find((x) => x.cle === cleCourante);
  detailsTexte.open = zoneReglages.hidden || !!(m && m.pageBlanche);
}

function rendreReglages(r) {
  if (!zoneReglages) return 0;
  const source = zoneModele.value;
  const entrees = reglages(source);
  const titres = intertitres(source);
  const commentaires = r && r.ast && r.ast.commentaires;
  // L'hypothèse que le verdict désigne, marquée là où on la règle : c'est le
  // seul lien direct entre la réponse et le geste qu'elle demande.
  const tete = r && r.sources && r.sources[0];
  const decisive = tete && !r.probleme && notable(tete, r) ? tete.nom : null;

  if (entrees.length === 0) {
    zoneReglages.hidden = true;
    zoneReglages.replaceChildren();
    signatureCourante = null;
    return 0;
  }
  zoneReglages.hidden = false;

  // L'hypothèse décisive ne fait **pas** partie de la signature : elle change
  // au fil de la frappe, et reconstruire le DOM à ce moment-là arracherait le
  // curseur du champ qu'on est en train de remplir. C'est une classe qu'on
  // pose et qu'on retire, rien de plus.
  const sig = signature(entrees, titres);
  if (sig !== signatureCourante) {
    signatureCourante = sig;
    zoneReglages.replaceChildren(
      el('p', { class: 'reglages-intro', text: INTRO_PLAGE }),
      construireReglages(entrees, titres, commentaires));
  }
  for (const bloc of zoneReglages.querySelectorAll('.reglage')) {
    const cible = bloc.dataset.nom === decisive;
    bloc.classList.toggle('decisive', cible);
    const note = bloc.querySelector('.reglage-note');
    if (note) note.hidden = !cible;
  }

  // Même forme : on remet seulement les valeurs, et jamais dans le champ qu'on
  // est en train de remplir — « 1,5 » y passerait par « 1 » puis « 1,5 ».
  for (const e of entrees) {
    for (let i = 0; i < e.bornes.length; i++) {
      const entree = zoneReglages.querySelector(
        `.reglage[data-nom="${CSS.escape(e.nom)}"] input[data-borne="${i}"]`);
      if (!entree || entree === document.activeElement) continue;
      const attendu = afficher(e.bornes[i].affiche);
      if (entree.value !== attendu) entree.value = attendu;
      entree.removeAttribute('aria-invalid');
    }
  }
  return entrees.length;
}

// --- Boucle ------------------------------------------------------------------

let minuteur = null;
let minuteurRobustesse = null;

function calculer() {
  const source = zoneModele.value;
  ajusterOuverture();
  clearTimeout(minuteurRobustesse);
  try {
    const r = analyserModele(source, { N: 20000 });
    zoneErreur.hidden = true;
    rendre(r);
    rendreReglages(r);
    // Le balayage coûte ~200 ms : on le lance quand la frappe s'est arrêtée,
    // pour que le verdict, lui, reste immédiat.
    minuteurRobustesse = setTimeout(() => {
      try { rendreRobustesse(analyserRobustesse(r), r); } catch { /* sans conséquence */ }
    }, 450);
  } catch (e) {
    montrerErreur(e);
    rendreAvertissements(null);
    // Un modèle qui ne s'analyse pas n'a pas de formulaire fiable : on rend la
    // main au texte, qui est le seul endroit où la faute se corrige.
    rendreReglages(null);
    if (detailsTexte) detailsTexte.open = true;
  }
  // Le travail en cours reste dans le navigateur du visiteur, nulle part ailleurs.
  // Et seulement le travail : un modèle de bibliothèque tel quel n'est pas un
  // brouillon. Sans cette garde, cliquer une pastille pour regarder un autre
  // modèle écrasait ce que le visiteur avait écrit sur l'accueil.
  const original = MODELES.find((m) => m.cle === cleCourante);
  if (original && original.source === source) return;
  try {
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify({ cle: cleCourante, source }));
  } catch { /* navigation privée, quota plein : sans importance */ }
}

function programmer() {
  clearTimeout(minuteur);
  minuteur = setTimeout(calculer, 220);
}

// --- Partage par lien --------------------------------------------------------

function encoder(texte) {
  const octets = new TextEncoder().encode(texte);
  let bin = '';
  for (const o of octets) bin += String.fromCharCode(o);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decoder(b64) {
  const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
  const octets = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(octets);
}

// --- Bibliothèque -------------------------------------------------------------
//
// Chaque modèle a sa propre adresse (/prix-du-kilometre…) : les pastilles sont
// de vrais liens, présents dans le HTML servi. On les intercepte pour changer
// de modèle sans recharger, mais elles fonctionnent sans JavaScript.

const adresse = (m) => (m.cle === MODELE_PAR_DEFAUT ? '/' : '/' + m.slug);

function marquerPastille(cle) {
  let actif = null;
  for (const a of listeExemples.querySelectorAll('a')) {
    if (a.dataset.cle === cle) { a.setAttribute('aria-current', 'page'); actif = a; }
    else a.removeAttribute('aria-current');
  }
  // Quand la liste défile (écran étroit), la pastille active doit être visible :
  // sinon on ne sait pas quel modèle est affiché.
  if (actif && listeExemples.scrollWidth > listeExemples.clientWidth + 4) {
    const cadre = listeExemples.getBoundingClientRect();
    const puce = actif.getBoundingClientRect();
    if (puce.left < cadre.left + 8 || puce.right > cadre.right - 8) {
      listeExemples.scrollLeft += (puce.left - cadre.left) - 12;
    }
  }
}

function chargerModele(cle, { remplacerTexte = true } = {}) {
  const m = MODELES.find((x) => x.cle === cle);
  cleCourante = m ? cle : '';
  brouillonEnAttente = null;
  const barre = $('#reprise');
  if (barre) barre.hidden = true;
  if (m && remplacerTexte) zoneModele.value = m.source;
  marquerPastille(cleCourante);
  calculer();
  positionnerTexte();
}

listeExemples.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-cle]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  history.pushState({ cle: a.dataset.cle }, '', a.getAttribute('href'));
  chargerModele(a.dataset.cle);
  proposerBrouillon();
  zoneResultats.scrollIntoView({ block: 'nearest' });
});

window.addEventListener('popstate', () => {
  const chemin = location.pathname.replace(/\/$/, '');
  const m = MODELES.find((x) => adresse(x).replace(/\/$/, '') === chemin);
  if (m) { chargerModele(m.cle); proposerBrouillon(); }
});

// --- Le brouillon d'un visiteur qui revient ------------------------------------
//
// Session 10 : le travail en cours d'un visiteur lui revient au passage suivant.
// Session 14 : la page d'accueil est devenue la vitrine du site, et son modèle
// est ce que le site montre de lui-même à un inconnu.
//
// Les deux règles s'appliquaient au même endroit, et la seconde perdait en
// silence : un lecteur venu deux fois voyait le modèle qu'il avait laissé, pas
// celui que le site sert. Le journal disait une chose, la page en affichait une
// autre, et rien dans le code ne rendait cet écart visible.
//
// La règle est maintenant explicite, et elle vaut sur toutes les pages : **le
// modèle servi gagne, le brouillon est proposé.** Il n'est pas perdu — il
// attend derrière un bouton, sur la page où il a été écrit. Une page dont le
// contenu dépend de l'historique du visiteur ne peut pas être une vitrine.

let brouillonEnAttente = null;

function proposerBrouillon() {
  const barre = $('#reprise');
  if (!barre) return;
  let garde = null;
  try { garde = JSON.parse(localStorage.getItem(CLE_STOCKAGE) || 'null'); } catch { garde = null; }
  if (!garde || typeof garde.source !== 'string' || !garde.source.trim()) return;
  // Le brouillon revient là où il a été écrit, pas ailleurs : un modèle
  // commencé sur « louer ou acheter » n'a rien à faire sur la page d'accueil.
  if (garde.cle !== cleCourante) return;
  if (garde.source.trim() === zoneModele.value.trim()) return;
  brouillonEnAttente = garde.source;
  $('#reprise-texte').textContent =
    'Vous aviez commencé à modifier ce modèle lors d\u2019une visite précédente.';
  barre.hidden = false;
}

function reprendreBrouillon() {
  if (brouillonEnAttente === null) return;
  zoneModele.value = brouillonEnAttente;
  brouillonEnAttente = null;
  $('#reprise').hidden = true;
  calculer();
  positionnerTexte();
}

function oublierBrouillon() {
  brouillonEnAttente = null;
  const barre = $('#reprise');
  if (barre) barre.hidden = true;
  try { localStorage.removeItem(CLE_STOCKAGE); } catch { /* sans importance */ }
}

// --- Démarrage ----------------------------------------------------------------
//
// Priorité : un lien partagé (le modèle est dans le fragment) l'emporte sur
// tout ; sinon, une page de modèle affiche son modèle ; sinon, la page d'accueil
// rend au visiteur ce qu'il était en train d'écrire.

(function demarrer() {
  if (location.hash.length > 2) {
    try {
      const partage = decoder(location.hash.slice(1));
      if (partage && partage.trim()) {
        zoneModele.value = partage;
        const connu = MODELES.find((m) => m.source === partage);
        cleCourante = connu ? connu.cle : '';
        marquerPastille(cleCourante);
        calculer();
        positionnerTexte();
        return;
      }
    } catch { /* fragment illisible : on retombe sur le comportement normal */ }
  }

  // Le HTML servi contient déjà la source du modèle : on ne la réécrit pas.
  chargerModele(document.body.dataset.modele || MODELE_PAR_DEFAUT, { remplacerTexte: false });
  proposerBrouillon();
})();

zoneModele.addEventListener('input', programmer);

// Tabulation = indentation, pas un saut de champ : on écrit du code ici.
zoneModele.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab' || e.ctrlKey || e.metaKey || e.altKey) return;
  e.preventDefault();
  const d = zoneModele.selectionStart, f = zoneModele.selectionEnd;
  zoneModele.setRangeText('  ', d, f, 'end');
  programmer();
});

$('#reinit').addEventListener('click', () => {
  // Réinitialiser, c'est renoncer au brouillon : il ne doit pas revenir au
  // prochain passage sur l'accueil.
  oublierBrouillon();
  chargerModele(cleCourante || document.body.dataset.modele || MODELE_PAR_DEFAUT);
  history.replaceState(null, '', location.pathname);
});

$('#reprise-oui').addEventListener('click', reprendreBrouillon);
$('#reprise-non').addEventListener('click', oublierBrouillon);

// --- Le verdict en texte ------------------------------------------------------
//
// Une décision se prend rarement seul. Le verdict en texte brut — ce que la
// page affiche, dans le même ordre, avec le lien qui contient le modèle — se
// colle dans un message ou une discussion. Rien d'autre que ce qui est à
// l'écran : pas de résumé réécrit, pas de chiffre qui n'y serait pas.

function texteVerdict() {
  const lignes = [];
  const m = MODELES.find((x) => x.cle === cleCourante);
  lignes.push((m ? m.titre : 'Boussole').toUpperCase());
  lignes.push(location.origin + location.pathname + '#' + encoder(zoneModele.value));
  lignes.push('');

  const texte = (n) => n.textContent.replace(/\s+/g, ' ').trim();
  for (const section of zoneResultats.querySelectorAll('section.panneau')) {
    if (section.hidden) continue;
    const bloc = [];
    for (const n of section.children) {
      if (n.matches('.verdict-titre')) bloc.push('▶ ' + texte(n));
      else if (n.matches('h2, .verdict-chapeau')) bloc.push(texte(n).toUpperCase());
      else if (n.matches('p')) bloc.push(texte(n));
      else if (n.matches('ul.options')) {
        for (const li of n.children) {
          const nom = li.querySelector('.option-nom').firstChild.textContent.trim();
          const fanion = li.querySelector('.fanion');
          bloc.push('• ' + nom + (fanion ? ' (' + texte(fanion) + ')' : '') + ' : ' + texte(li.querySelector('.option-valeur'))
            + ' — ' + texte(li.querySelector('.option-detail')));
        }
      } else if (n.matches('ul.hypotheses')) {
        for (const li of n.children) {
          bloc.push('• ' + texte(li.querySelector('.hypothese-nom')) + ' — ' + texte(li.querySelector('.hypothese-chiffre')));
          for (const p of li.querySelectorAll('p')) bloc.push('  ' + texte(p));
        }
      } else if (n.matches('ul.contre-liste')) {
        for (const li of n.children) bloc.push('• ' + texte(li));
      } else if (n.matches('figure')) {
        const axe = n.querySelector('.axe');
        if (axe) bloc.push(texte(axe));
      }
    }
    if (bloc.length) { lignes.push(...bloc, ''); }
  }
  lignes.push('Calculé sur optiboussole.fr, dans le navigateur, avec les seuls chiffres du modèle — aucune donnée de marché. Le lien ci-dessus contient le modèle : ouvrez-le pour changer une hypothèse.');
  return lignes.join('\n');
}

$('#copier-verdict').addEventListener('click', async (e) => {
  const b = e.currentTarget;
  const avant = b.textContent;
  try {
    await navigator.clipboard.writeText(texteVerdict());
    b.textContent = 'Verdict copié';
  } catch {
    b.textContent = 'Copie impossible ici';
  }
  b.classList.add('copie-ok');
  setTimeout(() => { b.textContent = avant; b.classList.remove('copie-ok'); }, 2200);
});

$('#partager').addEventListener('click', async (e) => {
  const lien = location.origin + location.pathname + '#' + encoder(zoneModele.value);
  history.replaceState(null, '', lien);
  const b = e.currentTarget;
  const avant = b.textContent;
  try {
    await navigator.clipboard.writeText(lien);
    b.textContent = 'Lien copié';
  } catch {
    b.textContent = 'Lien dans la barre d’adresse';
  }
  b.classList.add('copie-ok');
  setTimeout(() => { b.textContent = avant; b.classList.remove('copie-ok'); }, 2200);
});
