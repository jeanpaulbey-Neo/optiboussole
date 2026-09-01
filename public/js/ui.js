// ui.js — l'interface.
//
// Le travail ici n'est pas d'afficher des nombres : c'est de les transformer en
// phrases sur lesquelles quelqu'un peut agir. Un pourcentage de variance
// expliquée ne dit rien à personne ; « la décision bascule si la revalorisation
// descend sous 1 %/an, ce qui arrive 4 fois sur 10 » dit quelque chose.

import { analyserModele, histogramme } from './moteur.js';
import { ErreurModele } from './lang.js';
import { MODELES, MODELE_PAR_DEFAUT } from './modeles.js';

const $ = (s) => document.querySelector(s);
const zoneModele = $('#modele');
const zoneErreur = $('#erreur');
const zoneResultats = $('#resultats');
const listeExemples = $('#exemples');

const CLE_STOCKAGE = 'boussole.modele';
let cleCourante = MODELE_PAR_DEFAUT;

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
    return nf({ maximumFractionDigits: Math.abs(x) < 0.01 ? 2 : 1 }).format(x * 100) + '\u202f%';
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
  return valeur(a, unite, ech) + ' → ' + valeur(b, unite, ech);
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
    if (Array.isArray(s)) p.appendChild(el('code', { text: s[1] }));
    else p.appendChild(document.createTextNode(s));
  }
  return p;
}

function jauge(fraction, pale = false) {
  const largeur = Math.max(0, Math.min(1, fraction || 0)) * 100;
  return el('div', { class: pale ? 'barre pale' : 'barre' },
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

// --- Rendu d'une hypothèse --------------------------------------------------

// Une hypothèse est « notable » si la connaître changerait quelque chose.
// Un gain de 4 € sur un choix qui en vaut 12 800 n'en change aucun : l'afficher
// au même rang que le reste noierait ce qui compte.
function notable(s, r) {
  return r.modeDecision
    ? s.valeurInfo >= Math.max(r.options.evpi * 0.01, 1e-9)
    : s.part >= 0.02;
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
          ? [el('b', { text: valeur(s.valeurInfo, unite) }), ' à gagner à le savoir']
          : ['ne change pas le choix'])
    : el('span', { class: 'hypothese-chiffre' },
        [el('b', { text: pourcent(s.part) }), ' de l’incertitude']);

  const bloc = el('li', { class: 'hypothese' }, [
    el('div', { class: 'hypothese-tete' }, [nomBouton, chiffre]),
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

  const detail = 'aujourd’hui : ' + plage(s.stats.p05, s.stats.p95, uniteDe(s));
  bloc.appendChild(el('p', { class: 'plage' },
    r.modeDecision ? `${detail} · porte ${pourcent(s.part)} de l’écart entre les branches` : detail));

  return bloc;
}

// L'unité du modèle décrit le résultat, pas forcément chaque hypothèse : un
// taux reste un pourcentage même dans un modèle en euros.
// « unité: € » décrit le résultat du modèle, pas ses hypothèses : dans un
// modèle en €/km, `km_an` est un nombre de kilomètres et `reparations` des
// euros par an. Afficher « 7 977 €/km » serait faux. La seule unité qu'on
// connaisse avec certitude pour une hypothèse est le pourcentage, parce que
// l'auteur l'a écrit tel quel.
function uniteDe(s) {
  return s.pourcent ? '%' : '';
}

// --- Verdict ----------------------------------------------------------------

function blocDecision(r) {
  const unite = r.unite;
  const o = r.options.liste;
  const rec = o[r.options.recommande];
  const p = rec.pGagne;
  const decisif = r.sources.filter((s) => notable(s, r));
  const tete = decisif[0];

  const serre = p < 0.62;
  const verdict = el('section', { class: 'panneau bloc verdict' + (serre ? ' serre' : '') });
  verdict.appendChild(el('p', { class: 'verdict-chapeau', text: serre ? 'Trop serré pour trancher' : 'Ce que dit le modèle' }));
  verdict.appendChild(el('h2', { class: 'verdict-titre', text: serre ? 'À égalité' : rec.nom }));

  if (serre) {
    verdict.appendChild(phrase(
      'Les deux branches se valent : \u00ab\u202f', rec.nom, '\u202f\u00bb l’emporte ',
      pourcent(p), ' du temps, ce qui n’est pas un écart sur lequel on engage quoi que ce soit. ',
      'Dans un cas pareil, le calcul a fini son travail — c’est à ce qui ne se chiffre pas de décider.'));
  } else if (p >= 0.9) {
    verdict.appendChild(phrase(
      '\u00ab\u202f', rec.nom, '\u202f\u00bb l’emporte dans ', pourcent(p),
      ' des simulations. L’écart est net : votre incertitude actuelle ne suffit pas à le renverser.'));
  } else {
    verdict.appendChild(phrase(
      '\u00ab\u202f', rec.nom, '\u202f\u00bb l’emporte, mais ce n’est pas acquis : ',
      foisSur10(r.options.pRegret), ', l’autre branche aurait été meilleure.'));
  }

  if (tete) {
    const b = tete.bascules[0];
    verdict.appendChild(phrase(
      decisif.length === 1
        ? 'Une seule hypothèse peut renverser ce choix : '
        : 'L’hypothèse qui pèse le plus sur ce choix est ',
      ['code', tete.nom], '. ',
      b
        ? `Le verdict passe à \u00ab\u202f${b.vers}\u202f\u00bb ${b.sens === 'hausse' ? 'au-dessus de' : 'en dessous de'} ${valeur(b.valeur, uniteDe(tete))}, ce qui arrive ${foisSur10(b.proba)}. `
        : '',
      `Lever le doute dessus vaut environ ${valeur(tete.valeurInfo, unite)} — c’est là qu’il faut passer votre temps, pas ailleurs.`));
  } else {
    verdict.appendChild(phrase(
      'Aucune de vos hypothèses ne renverse ce choix sur sa plage plausible. ',
      'Chercher des chiffres plus précis ne changerait pas votre décision : ',
      'c’est le moment d’arrêter d’enquêter et de décider.'));
  }

  // Les branches comparées.
  const options = el('section', { class: 'panneau bloc' }, el('h2', { text: 'Les branches' }));
  const liste = el('ul', { class: 'options' });
  for (const opt of o) {
    const gagnante = opt === rec;
    liste.appendChild(el('li', { class: 'option-ligne' + (gagnante ? ' gagnante' : '') }, [
      el('span', { class: 'option-nom' },
        [opt.nom, gagnante ? el('span', { class: 'fanion', text: serre ? 'en tête' : 'retenue' }) : null]),
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

  return [verdict, options];
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

  if (r.seuil !== null && r.pAuDessus !== undefined) {
    verdict.appendChild(phrase(
      'Vous visez ', valeur(r.seuil, unite), ' : c’est atteint dans ', pourcent(r.pAuDessus),
      ' des cas.'));
  }

  if (tete && tete.part > 0.05) {
    verdict.appendChild(phrase(
      ['code', tete.nom], ' porte ', pourcent(tete.part),
      ' de cette incertitude à elle seule. Si vous la connaissiez exactement, la fourchette se resserrerait à ',
      valeur(tete.largeurResiduelle, unite), ' de large, contre ', valeur(r.largeurTotale, unite),
      ' aujourd’hui. Commencez par là.'));
  } else {
    verdict.appendChild(phrase(
      'Aucune hypothèse ne domine : l’incertitude est répartie. ',
      'Précisez-en une seule et la fourchette bougera à peine — il faudrait toutes les resserrer.'));
  }

  verdict.appendChild(courbe(st, unite, r.seuil));
  return [verdict];
}

// --- Rendu principal --------------------------------------------------------

function rendre(r) {
  zoneResultats.replaceChildren();
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
}

// --- Erreurs ----------------------------------------------------------------

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

// --- Boucle ------------------------------------------------------------------

let minuteur = null;

function calculer() {
  const source = zoneModele.value;
  try {
    const r = analyserModele(source, { N: 20000 });
    zoneErreur.hidden = true;
    rendre(r);
  } catch (e) {
    montrerErreur(e);
  }
  try { localStorage.setItem(CLE_STOCKAGE, source); } catch { /* navigation privée */ }
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

function chargerModele(cle, forcer = true) {
  const m = MODELES.find((x) => x.cle === cle);
  if (!m) return;
  cleCourante = cle;
  if (forcer) {
    zoneModele.value = m.source;
    calculer();
  }
  for (const b of listeExemples.querySelectorAll('button')) {
    b.setAttribute('aria-pressed', String(b.dataset.cle === cle));
  }
}

for (const m of MODELES) {
  const b = el('button', { type: 'button', 'aria-pressed': 'false', title: m.resume }, m.titre);
  b.dataset.cle = m.cle;
  b.addEventListener('click', () => {
    chargerModele(m.cle);
    history.replaceState(null, '', location.pathname);
  });
  listeExemples.appendChild(el('li', {}, b));
}

// --- Démarrage ----------------------------------------------------------------

(function demarrer() {
  let depart = null;
  if (location.hash.length > 2) {
    try { depart = decoder(location.hash.slice(1)); } catch { depart = null; }
  }
  if (depart === null) {
    try { depart = localStorage.getItem(CLE_STOCKAGE); } catch { depart = null; }
  }
  if (depart && depart.trim()) {
    zoneModele.value = depart;
    const connu = MODELES.find((m) => m.source === depart);
    chargerModele(connu ? connu.cle : '', false);
    calculer();
  } else {
    chargerModele(MODELE_PAR_DEFAUT);
  }
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
  chargerModele(cleCourante || MODELE_PAR_DEFAUT);
  history.replaceState(null, '', location.pathname);
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
