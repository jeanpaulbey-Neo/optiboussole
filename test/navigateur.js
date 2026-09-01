// Test du site réel dans un vrai navigateur.
//   node test/navigateur.js [url]
// Vérifie qu'aucune erreur ne remonte, que chaque modèle de la bibliothèque
// s'affiche, que l'édition recalcule, et produit des captures d'écran.

import puppeteer from 'puppeteer';
import { mkdirSync } from 'node:fs';
import { MODELES } from '../public/js/modeles.js';

const URL = process.argv[2] || 'https://optiboussole.fr';
const SORTIE = process.argv[3] || '/tmp/boussole-captures';

let ok = 0, ko = 0;
const verifie = (titre, cond, detail = '') => {
  if (cond) { ok++; console.log(`  \x1b[32m✓\x1b[0m \x1b[2m${titre}\x1b[0m`); }
  else { ko++; console.log(`  \x1b[31m✗ ${titre}\x1b[0m ${detail}`); }
};

mkdirSync(SORTIE, { recursive: true });

const navigateur = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const incidents = [];
const page = await navigateur.newPage();
page.on('console', (m) => { if (m.type() === 'error') incidents.push('console: ' + m.text()); });
page.on('pageerror', (e) => incidents.push('exception: ' + e.message));
page.on('requestfailed', (r) => incidents.push('requête échouée: ' + r.url()));

await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 2 });
console.log(`\n\x1b[1mChargement de ${URL}\x1b[0m`);
await page.goto(URL, { waitUntil: 'networkidle0', timeout: 45000 });
await page.waitForSelector('.verdict-titre', { timeout: 15000 });

verifie('la page se charge sans incident', incidents.length === 0, '→ ' + incidents.join(' | '));

const titre = await page.$eval('.verdict-titre', (n) => n.textContent.trim());
verifie('un verdict est affiché', titre.length > 0, `→ « ${titre} »`);

const tailleTitre = await page.$eval('.verdict-titre', (n) => parseFloat(getComputedStyle(n).fontSize));
verifie('le verdict est en gros corps (spécificité CSS)', tailleTitre >= 22, `→ ${tailleTitre}px`);

const nbHypotheses = await page.$$eval('.hypothese', (n) => n.length);
verifie('les hypothèses sont listées', nbHypotheses >= 3, `→ ${nbHypotheses}`);

const svgOk = await page.evaluate(() => {
  const s = document.querySelector('.distribution svg');
  return s ? s.namespaceURI === 'http://www.w3.org/2000/svg' : 'absent';
});
verifie('mode décision : pas de courbe (attendu)', svgOk === 'absent', `→ ${svgOk}`);

// Pas de débordement horizontal.
const debordement = await page.evaluate(() =>
  document.documentElement.scrollWidth - document.documentElement.clientWidth);
verifie('aucun débordement horizontal', debordement <= 1, `→ ${debordement}px`);

// --- Chaque modèle de la bibliothèque ---------------------------------------
console.log('\n\x1b[1mBibliothèque\x1b[0m');
const boutons = await page.$$('#exemples a[data-cle]');
verifie('un bouton par modèle', boutons.length === MODELES.length, `→ ${boutons.length}/${MODELES.length}`);

for (let i = 0; i < boutons.length; i++) {
  const avant = incidents.length;
  const nom = await boutons[i].evaluate((n) => n.textContent);
  await boutons[i].click();
  await page.waitForFunction(() => document.querySelector('.verdict-titre') !== null, { timeout: 8000 });
  const t = await page.$eval('.verdict-titre', (n) => n.textContent.trim());
  const h = await page.$$eval('.hypothese', (n) => n.length);
  const err = await page.$eval('#erreur', (n) => (n.hidden ? '' : n.textContent));
  verifie(`« ${nom} » s'affiche`, t.length > 0 && h > 0 && !err && incidents.length === avant,
    `→ verdict « ${t} », ${h} hypothèses${err ? ', erreur: ' + err : ''}${incidents.length > avant ? ', ' + incidents.slice(avant).join(' | ') : ''}`);
}

// --- Mode estimation : la courbe ---------------------------------------------
console.log('\n\x1b[1mMode estimation\x1b[0m');
const iKm = MODELES.findIndex((m) => m.cle === 'kilometre');
await boutons[iKm].click();
await page.waitForFunction(() => document.querySelector('.distribution svg') !== null, { timeout: 8000 });
const infoSvg = await page.evaluate(() => {
  const s = document.querySelector('.distribution svg');
  return { ns: s.namespaceURI, h: s.getBoundingClientRect().height, chemins: s.querySelectorAll('path').length };
});
verifie('la courbe est un vrai SVG', infoSvg.ns === 'http://www.w3.org/2000/svg', `→ ${infoSvg.ns}`);
verifie('la courbe a une hauteur visible', infoSvg.h > 40, `→ ${infoSvg.h}px`);
verifie('la courbe est tracée', infoSvg.chemins >= 2, `→ ${infoSvg.chemins} chemins`);

// --- Édition en direct --------------------------------------------------------
console.log('\n\x1b[1mÉdition\x1b[0m');
const avantEdition = await page.$eval('.verdict-titre', (n) => n.textContent);
await page.click('#modele');
await page.evaluate(() => {
  const t = document.querySelector('#modele');
  t.value = t.value.replace('km_an = 8000 à 16000', 'km_an = 30000 à 40000');
  t.dispatchEvent(new Event('input', { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 900));
const apresEdition = await page.$eval('.verdict-titre', (n) => n.textContent);
verifie('modifier une hypothèse recalcule', apresEdition !== avantEdition,
  `→ « ${avantEdition} » puis « ${apresEdition} »`);

// Erreur de syntaxe : message affiché, pas de plantage.
await page.evaluate(() => {
  const t = document.querySelector('#modele');
  t.value = 'a = 1\nb = a +';
  t.dispatchEvent(new Event('input', { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 700));
const msg = await page.$eval('#erreur', (n) => (n.hidden ? '' : n.textContent));
verifie('une erreur de syntaxe est signalée avec sa ligne', /ligne 2/i.test(msg), `→ « ${msg} »`);

// Variable inconnue.
await page.evaluate(() => {
  const t = document.querySelector('#modele');
  t.value = 'total = inconnue * 2';
  t.dispatchEvent(new Event('input', { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 700));
const msg2 = await page.$eval('#erreur', (n) => (n.hidden ? '' : n.textContent));
verifie('une variable inconnue est signalée', /inconnue/.test(msg2), `→ « ${msg2} »`);

// --- Partage par lien ----------------------------------------------------------
console.log('\n\x1b[1mPartage\x1b[0m');
await page.evaluate(() => {
  const t = document.querySelector('#modele');
  t.value = 'unité: €\nmarge = 10 à 90\nventes = 100\nresultat = marge * ventes';
  t.dispatchEvent(new Event('input', { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 700));
await page.click('#partager');
await new Promise((r) => setTimeout(r, 400));
const lien = await page.url();
verifie('le lien contient le modèle', lien.includes('#') && lien.length > URL.length + 20);

const page2 = await navigateur.newPage();
const incidents2 = [];
page2.on('pageerror', (e) => incidents2.push(e.message));
await page2.goto(lien, { waitUntil: 'networkidle0' });
await page2.waitForSelector('.verdict-titre', { timeout: 10000 });
const rechargé = await page2.$eval('#modele', (n) => n.value);
verifie('rouvrir le lien restaure le modèle', rechargé.includes('marge = 10 à 90'),
  `→ « ${rechargé.slice(0, 40)}… »`);
verifie('le lien partagé ne provoque aucune erreur', incidents2.length === 0, '→ ' + incidents2.join(' | '));
await page2.close();

// --- Une adresse par modèle ----------------------------------------------------
console.log('\n\x1b[1mAdresses\x1b[0m');
{
  const page3 = await navigateur.newPage();
  const incidents3 = [];
  page3.on('pageerror', (e) => incidents3.push(e.message));
  page3.on('console', (m) => { if (m.type() === 'error') incidents3.push(m.text()); });

  // L'accueil restitue volontairement le dernier modèle édité : pour tester
  // ce que voit un visiteur qui arrive, on repart d'un stockage vide.
  await page3.goto(URL + '/', { waitUntil: 'domcontentloaded' });
  await page3.evaluate(() => localStorage.clear());

  for (const m of MODELES) {
    const chemin = m.cle === 'logement' ? '/' : '/' + m.slug;
    const r = await page3.goto(URL + chemin, { waitUntil: 'networkidle0' });
    await page3.evaluate(() => localStorage.clear());
    verifie(`${chemin} répond 200`, r.status() === 200, `→ ${r.status()}`);
    await page3.waitForSelector('.verdict-titre', { timeout: 10000 });

    const infos = await page3.evaluate(() => ({
      titre: document.title,
      canonique: document.querySelector('link[rel=canonical]')?.href,
      modele: document.body.dataset.modele,
      source: document.querySelector('#modele').value,
      courant: document.querySelector('#exemples a[aria-current]')?.dataset.cle,
      h1: document.querySelector('h1')?.textContent.trim(),
    }));
    verifie(`${chemin} : le bon modèle est chargé`, infos.modele === m.cle && infos.source.trim() === m.source.trim(),
      `→ data-modele « ${infos.modele} »`);
    verifie(`${chemin} : la pastille active est la bonne`, infos.courant === m.cle, `→ « ${infos.courant} »`);
    verifie(`${chemin} : titre et canonique propres`,
      infos.titre.includes('Boussole') && infos.canonique === URL + (chemin === '/' ? '/' : chemin),
      `→ « ${infos.titre} » / ${infos.canonique}`);
    verifie(`${chemin} : un h1 unique et parlant`, !!infos.h1 && infos.h1.length > 2, `→ « ${infos.h1} »`);
  }

  // Le HTML servi contient le modèle : il reste lisible sans JavaScript.
  await page3.setJavaScriptEnabled(false);
  await page3.goto(URL + '/prix-du-kilometre', { waitUntil: 'domcontentloaded' });
  const sansJs = await page3.$eval('#modele', (n) => n.textContent);
  verifie('le modèle est dans le HTML servi (lisible sans JS)', sansJs.includes('cout_km'),
    `→ « ${sansJs.slice(0, 30)}… »`);
  await page3.setJavaScriptEnabled(true);

  // Navigation client sans rechargement, puis retour arrière.
  await page3.goto(URL + '/', { waitUntil: 'networkidle0' });
  await page3.evaluate(() => localStorage.clear());
  await page3.goto(URL + '/', { waitUntil: 'networkidle0' });
  await page3.waitForSelector('.verdict-titre');
  await page3.click('#exemples a[data-cle="kilometre"]');
  await new Promise((r) => setTimeout(r, 900));
  verifie('cliquer une pastille change l’adresse sans recharger',
    (await page3.url()) === URL + '/prix-du-kilometre',
    `→ ${await page3.url()}`);
  verifie('… et charge le bon modèle',
    (await page3.$eval('#modele', (n) => n.value)).includes('cout_km'));
  await page3.goBack();
  await new Promise((r) => setTimeout(r, 900));
  verifie('le retour arrière revient au modèle précédent',
    (await page3.$eval('#modele', (n) => n.value)).includes('prix = 250k'),
    `→ ${await page3.url()}`);

  verifie('aucune erreur sur les pages de modèle', incidents3.length === 0, '→ ' + incidents3.join(' | '));
  await page3.close();
}

// --- Plan du site et 404 --------------------------------------------------------
console.log('\n\x1b[1mIndexation\x1b[0m');
{
  const p4 = await navigateur.newPage();
  const r404 = await p4.goto(URL + '/adresse-qui-n-existe-pas', { waitUntil: 'domcontentloaded' });
  verifie('une adresse inconnue répond bien 404', r404.status() === 404, `→ ${r404.status()}`);
  verifie('… avec une page utile', (await p4.title()).includes('introuvable'), `→ « ${await p4.title()} »`);

  const plan = await p4.goto(URL + '/sitemap.xml', { waitUntil: 'domcontentloaded' });
  const xml = await plan.text();
  verifie('le plan du site liste toutes les pages',
    MODELES.every((m) => xml.includes(m.cle === 'logement' ? '<loc>' + URL + '/</loc>' : '/' + m.slug)),
    `→ ${(xml.match(/<loc>/g) || []).length} adresses`);
  await p4.close();
}

// --- Captures ------------------------------------------------------------------
console.log('\n\x1b[1mCaptures\x1b[0m');
async function capture(nom, { largeur, hauteur, sombre, modele }) {
  const p = await navigateur.newPage();
  await p.setViewport({ width: largeur, height: hauteur, deviceScaleFactor: 2 });
  await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: sombre ? 'dark' : 'light' }]);
  // Les tests précédents ont écrit dans localStorage : on capture le site
  // tel qu'un visiteur qui arrive pour la première fois le voit.
  await p.goto(URL, { waitUntil: 'domcontentloaded' });
  await p.evaluate(() => localStorage.clear());
  await p.goto(URL, { waitUntil: 'networkidle0' });
  await p.waitForSelector('.verdict-titre', { timeout: 10000 });
  if (modele !== undefined) {
    const b = await p.$$('#exemples a[data-cle]');
    await b[modele].click();
    await new Promise((r) => setTimeout(r, 700));
  }
  const chemin = `${SORTIE}/${nom}.png`;
  await p.screenshot({ path: chemin, fullPage: false });
  await p.close();
  console.log(`  \x1b[2m→ ${chemin}\x1b[0m`);
}

await capture('bureau-clair', { largeur: 1440, hauteur: 1050, sombre: false });
await capture('bureau-sombre', { largeur: 1440, hauteur: 1050, sombre: true });
await capture('estimation', { largeur: 1440, hauteur: 1050, sombre: false, modele: iKm });
await capture('mobile', { largeur: 390, hauteur: 844, sombre: false });

await navigateur.close();

verifie('aucun incident sur toute la session', incidents.length === 0, '→ ' + incidents.join(' | '));
console.log(`\n${ko === 0 ? '\x1b[32m' : '\x1b[31m'}${ok} réussis, ${ko} échoués\x1b[0m\n`);
process.exit(ko === 0 ? 0 : 1);
