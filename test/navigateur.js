// Test du site réel dans un vrai navigateur.
//   node test/navigateur.js [url]
// Vérifie qu'aucune erreur ne remonte, que chaque modèle de la bibliothèque
// s'affiche, que l'édition recalcule, et produit des captures d'écran.

import puppeteer from 'puppeteer';
import { mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
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

// --- Le détail des calculs -----------------------------------------------------
console.log('\n\x1b[1mLe détail des calculs\x1b[0m');
{
  const ferme = await page.$eval('.detail', (n) => n.open);
  verifie('le panneau existe et commence fermé', ferme === false, `→ ${ferme}`);
  await page.click('.detail summary');
  await new Promise((r) => setTimeout(r, 200));
  const lignes = await page.$$eval('.detail-liste > li', (n) => n.length);
  const termes = await page.$$eval('.detail-liste > li.terme', (n) => n.length);
  verifie('déplié, il liste les calculs et leurs termes', lignes >= 4 && termes >= 5, `→ ${lignes} lignes, ${termes} termes`);
  const barre = await page.$eval('.detail-liste li.terme .barre i', (n) => n.getBoundingClientRect().width);
  verifie('la jauge du poids d’un terme est visible', barre > 4, `→ ${barre}px`);
  await page.evaluate(() => {
    const t = document.querySelector('#modele');
    t.value = t.value.replace('controle = 45', 'controle = 90');
    t.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 900));
  const encoreOuvert = await page.$eval('.detail', (n) => n.open);
  verifie('l’état déplié survit au recalcul', encoreOuvert === true);
  const controle = await page.$$eval('.detail-liste li.terme', (ns) => {
    const li = ns.find((n) => n.textContent.includes('controle'));
    return li ? li.querySelector('.detail-val').textContent : '';
  });
  verifie('la valeur suit l’édition', controle === '90', `→ « ${controle} »`);
  await page.click('.detail summary');
}

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

// --- Ce que vous jouez ----------------------------------------------------------
// « L'emporte 6 fois sur 10 » ne dit rien de l'enjeu des 4 autres. Deux
// vérifications : la phrase est là sur un modèle de la bibliothèque, et le
// désaccord entre les deux règles de décision est dit au lieu d'être caché
// derrière un titre « À égalité » qui ne voulait rien dire.
console.log('\n\x1b[1mCe que vous jouez\x1b[0m');
{
  const pj = await navigateur.newPage();
  const incj = [];
  pj.on('pageerror', (e) => incj.push(e.message));
  await pj.setViewport({ width: 1280, height: 1000 });
  // Les tests de fautes de frappe laissent un brouillon dans le navigateur, et
  // l'accueil le restitue : on repart du modèle de la page.
  await pj.goto(URL + '/', { waitUntil: 'networkidle0' });
  await pj.evaluate(() => localStorage.clear());
  await pj.reload({ waitUntil: 'networkidle0' });
  await pj.waitForSelector('.verdict-titre');

  const tape = async (src) => {
    await pj.evaluate((m) => {
      const t = document.querySelector('#modele');
      t.value = m;
      t.dispatchEvent(new Event('input', { bubbles: true }));
    }, src);
    await new Promise((r) => setTimeout(r, 900));
  };

  const lire = () => pj.$eval('.verdict', (n) => n.innerText.replace(/\s+/g, ' '));

  const accueil = await lire();
  verifie('la phrase « ce que vous jouez » est au verdict', /Ce que vous jouez\./.test(accueil),
    '→ ' + accueil.slice(0, 90));
  verifie('… elle donne le gain et la perte',
    /de mieux en médiane/.test(accueil) && /de moins/.test(accueil), '→ ' + accueil.slice(0, 200));
  verifie('… et la queue des pertes', /pire vingtième/.test(accueil));

  // Une branche qui gagne rarement et gros : les deux règles divergent.
  await tape('unite: €\ngros = bernoulli(10%)\noption "Sûr" = 100\n'
    + 'option "Loterie" = si gros alors 300 sinon 90');
  const desac = await lire();
  const titre = await pj.$eval('.verdict-titre', (n) => n.textContent.trim());
  verifie('un désaccord ne s’affiche plus « À égalité »', titre === 'Deux réponses', `→ ${titre}`);
  verifie('… la meilleure moyenne est nommée', /Loterie[\s\S]*rapporte le plus en moyenne/.test(desac));
  verifie('… la plus fréquente aussi', /Sûr[\s\S]*l’emporte le plus souvent/.test(desac));
  verifie('… et le site dit qu’aucun calcul ne départage',
    /Aucun calcul ne départage/.test(desac), '→ ' + desac.slice(0, 200));
  const fanions = await pj.$$eval('.option-ligne .fanion', (ns) => ns.map((n) => n.textContent));
  verifie('… les deux branches portent chacune son titre',
    fanions.length === 2 && fanions.includes('meilleure moyenne')
      && fanions.includes('gagne le plus souvent'), `→ ${fanions.join(' / ')}`);

  // Deux branches identiques : rien n'est joué, la phrase disparaît.
  await tape('a = 1 à 10\noption "A" = a\noption "B" = a');
  const nul = await lire();
  verifie('rien à jouer, rien à dire', !/Ce que vous jouez/.test(nul), '→ ' + nul.slice(0, 120));

  // « Copier le verdict » recopie les <p> enfants directs de la section : la
  // phrase doit en être un, sinon elle sortirait du texte copié sans qu'on
  // le voie. C'est la condition exacte que texteVerdict() applique.
  await tape('unite: €\nx = 0 à 200\noption "A" = x\noption "B" = 100');
  const copiable = await pj.evaluate(() => [...document.querySelectorAll('section.verdict > p')]
    .some((n) => /^Ce que vous jouez\./.test(n.textContent)));
  verifie('la phrase est reprise par « Copier le verdict »', copiable);

  verifie('aucune erreur pendant ces recalculs', incj.length === 0, '→ ' + incj.join(' | '));
  await pj.close();
}

// --- Écran étroit ---------------------------------------------------------------
console.log('\n\x1b[1mÉcran étroit\x1b[0m');
{
  const p6 = await navigateur.newPage();
  await p6.setViewport({ width: 390, height: 844 });
  await p6.goto(URL + '/reparer-ou-remplacer', { waitUntil: 'domcontentloaded' });
  await p6.evaluate(() => localStorage.clear());
  await p6.goto(URL + '/reparer-ou-remplacer', { waitUntil: 'networkidle0' });
  await p6.waitForSelector('.verdict-titre');

  const mesure = () => p6.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);

  verifie('aucun débordement horizontal, aide fermée', (await mesure()) <= 1, `→ ${await mesure()}px`);

  // Le débordement le plus facile à rater : le panneau d'aide déplié.
  await p6.evaluate(() => { document.querySelector('.aide').open = true; });
  await new Promise((r) => setTimeout(r, 250));
  verifie('aucun débordement horizontal, aide ouverte', (await mesure()) <= 1, `→ ${await mesure()}px`);
  await p6.evaluate(() => { document.querySelector('.aide').open = false; });

  const haut = await p6.$eval('.verdict-titre', (n) => n.getBoundingClientRect().top);
  verifie('le verdict est visible sans faire défiler', haut < 700, `→ y = ${Math.round(haut)}px`);

  const bande = await p6.evaluate(() => {
    const l = document.querySelector('#exemples');
    const a = l.querySelector('[aria-current]');
    const cl = l.getBoundingClientRect(), ca = a.getBoundingClientRect();
    return { uneLigne: l.getBoundingClientRect().height < 60,
             actifVisible: ca.left >= cl.left - 1 && ca.right <= cl.right + 1 };
  });
  verifie('les modèles tiennent sur une bande d\'une ligne', bande.uneLigne);
  verifie('la pastille active y est amenée dans le champ', bande.actifVisible);
  await p6.close();
}

// --- Robustesse ----------------------------------------------------------------
console.log('\n\x1b[1mRobustesse à l\'excès de confiance\x1b[0m');
{
  const p5 = await navigateur.newPage();
  const inc5 = [];
  p5.on('pageerror', (e) => inc5.push(e.message));
  p5.on('console', (m) => { if (m.type() === 'error') inc5.push(m.text()); });
  await p5.setViewport({ width: 1280, height: 900 });

  const cas = [
    ['/', /fragile/i, 'un verdict fragile est annoncé comme tel'],
    ['/isoler-ses-combles', /solide/i, 'un verdict solide est annoncé comme tel'],
    ['/tresorerie-combien-de-mois', /deux fois trop étroites/i, 'le mode estimation compare les deux intervalles'],
  ];
  for (const [chemin, motif, titre] of cas) {
    await p5.goto(URL + chemin, { waitUntil: 'domcontentloaded' });
    await p5.evaluate(() => localStorage.clear());
    await p5.goto(URL + chemin, { waitUntil: 'networkidle0' });
    await p5.waitForSelector('#robustesse:not([hidden])', { timeout: 12000 });
    const texte = await p5.$eval('#robustesse', (n) => n.innerText);
    verifie(`${chemin} : ${titre}`, motif.test(texte), `→ « ${texte.slice(0, 90)}… »`);
    verifie(`${chemin} : aucun [object Object] dans le texte`,
      !/\[object /.test(texte), `→ « ${texte.slice(0, 90)}… »`);
  }

  // Le verdict doit s'afficher tout de suite ; la robustesse peut attendre.
  await p5.goto(URL + '/', { waitUntil: 'domcontentloaded' });
  await p5.evaluate(() => localStorage.clear());
  await p5.goto(URL + '/', { waitUntil: 'networkidle0' });
  await p5.waitForSelector('.verdict-titre');
  await p5.evaluate(() => {
    const t = document.querySelector('#modele');
    t.value = t.value.replace('apport = 50k', 'apport = 90k');
    t.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 350));
  const tot = await p5.$eval('#robustesse', (n) => n.hidden);
  verifie('la robustesse ne bloque pas la frappe (masquée à 350 ms)', tot === true, `→ hidden=${tot}`);
  await p5.waitForSelector('#robustesse:not([hidden])', { timeout: 12000 });
  verifie('… puis elle apparaît une fois la frappe arrêtée', true);

  // Un modèle sans fourchette : le bloc ne doit rien raconter.
  await p5.evaluate(() => {
    const t = document.querySelector('#modele');
    t.value = 'risque = bernoulli(30%)\noption "Oser" = si risque alors -10 sinon 5\noption "Non" = 0';
    t.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 1600));
  verifie('sans fourchette à élargir, le bloc reste masqué',
    await p5.$eval('#robustesse', (n) => n.hidden));

  verifie('aucune erreur pendant l\'analyse de robustesse', inc5.length === 0, '→ ' + inc5.join(' | '));
  await p5.close();
}

// --- Le contre-argument -----------------------------------------------------
//
// Il n'apparaît que là où la section « ce qu'il faut aller vérifier » se tait.
// Le vérifier dans un vrai navigateur : les trois cas de figure ont des textes
// très différents, et c'est exactement le genre d'endroit où une branche non
// exercée passe des mois à planter en silence.
console.log('\n\x1b[1mLe contre-argument\x1b[0m');
{
  const p10 = await navigateur.newPage();
  const inc10 = [];
  p10.on('pageerror', (e) => inc10.push(e.message));
  p10.on('console', (m) => { if (m.type() === 'error') inc10.push(m.text()); });
  await p10.setViewport({ width: 1280, height: 1000 });

  const lire = async (chemin) => {
    await p10.goto(URL + chemin, { waitUntil: 'domcontentloaded' });
    await p10.evaluate(() => localStorage.clear());
    await p10.goto(URL + chemin, { waitUntil: 'networkidle0' });
    await p10.waitForSelector('.verdict-titre');
    return p10.evaluate(() => {
      const s = document.querySelector('.contre');
      return s ? s.innerText : null;
    });
  };

  const combles = await lire('/isoler-ses-combles');
  verifie('combles : le contre-argument s\u2019affiche', combles !== null);
  verifie('… il nomme la branche à faire gagner',
    /Ne rien faire/.test(combles || ''), `→ ${(combles || '').slice(0, 80)}`);
  verifie('… il liste plusieurs chiffres à déplacer',
    await p10.$$eval('.contre-liste li', (n) => n.length) >= 3);
  verifie('… chaque ligne oppose la valeur voulue à la valeur actuelle',
    /au lieu de/.test(await p10.$eval('.contre-valeurs', (n) => n.textContent)));
  verifie('… et il chiffre l\u2019écart total', /écart/.test(combles || ''));
  verifie('… sans [object Object]', !/\[object /.test(combles || ''));

  const projet = await lire('/projet-livre-a-temps');
  verifie('projet : le cas « exactement sur la ligne » est rendu',
    /sur la ligne/i.test(projet || ''), `→ ${(projet || '').slice(0, 80)}`);
  verifie('… en nommant l\u2019événement tout ou rien épinglé',
    /gros_pepin/.test(projet || ''));

  const voiture = await lire('/garder-ou-changer-de-voiture');
  verifie('voiture : rien, puisqu\u2019un seuil de bascule répond déjà',
    voiture === null, `→ ${(voiture || '').slice(0, 60)}`);

  // Un modèle qu'aucune erreur plausible ne renverse.
  await p10.evaluate(() => {
    const t = document.querySelector('#modele');
    t.value = 'a = 90 à 110\noption "Garder" = a * 3\noption "Changer" = 90';
    t.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 700));
  const hors = await p10.evaluate(() => {
    const s = document.querySelector('.contre');
    return s ? s.innerText : null;
  });
  verifie('un verdict imprenable : le site dit que le désaccord est ailleurs',
    /rien de plausible/i.test(hors || '') && /qui n\u2019y est pas/.test(hors || ''),
    `→ ${(hors || '(absent)').slice(0, 90)}`);

  // Écran étroit : la grille des valeurs ne doit pas élargir la page.
  await p10.setViewport({ width: 360, height: 780 });
  await p10.goto(URL + '/isoler-ses-combles', { waitUntil: 'networkidle0' });
  await p10.waitForSelector('.contre');
  const debC = await p10.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  verifie('aucun débordement horizontal sur écran étroit', debC <= 1, `→ ${debC}px`);

  verifie('aucune erreur pendant le contre-argument', inc10.length === 0, '→ ' + inc10.join(' | '));
  await p10.close();
}

// --- Fautes de frappe courantes ---------------------------------------------------
console.log('\n\x1b[1mQuand le visiteur écrit de travers\x1b[0m');
{
  const p8 = await navigateur.newPage();
  const inc8 = [];
  p8.on('pageerror', (e) => inc8.push(e.message));
  await p8.goto(URL + '/nouveau-modele', { waitUntil: 'networkidle0' });
  await p8.waitForSelector('.verdict-titre');

  const essayer = async (src) => {
    await p8.evaluate((s) => {
      const t = document.querySelector('#modele');
      t.value = s;
      t.dispatchEvent(new Event('input', { bubbles: true }));
    }, src);
    await new Promise((r) => setTimeout(r, 700));
    return p8.evaluate(() => ({
      res: document.querySelector('#resultats').innerText,
      err: document.querySelector('#erreur').hidden ? '' : document.querySelector('#erreur').textContent,
      av: document.querySelector('#avertissements').hidden ? '' : document.querySelector('#avertissements').innerText,
    }));
  };

  let e = await essayer('option "Acheter" = 10');
  verifie('une seule branche : message clair, pas une exception',
    /manque un résultat/i.test(e.res) && !/Cannot read|undefined/i.test(e.err + e.res), `→ ${e.err || e.res.slice(0, 60)}`);
  verifie('… avec l’avertissement qui dit quoi faire', /seule branche/.test(e.av));

  e = await essayer('a = 0\ny = 10 / a');
  verifie('division par zéro : expliquée en français',
    /valeurs impossibles/i.test(e.res), `→ ${e.res.slice(0, 60)}`);

  e = await essayer('loyer = 900-1150\ntotal = loyer * 12');
  verifie('« 900-1150 » : le calcul se fait mais le piège est signalé',
    /fourchette/.test(e.av) && !e.err, `→ ${e.av.slice(0, 70)}`);

  e = await essayer('taux = 3,2 %\ncapital = 1000\ny = capital * taux');
  verifie('« 3,2 % » avec une espace est accepté', !e.err && /32/.test(e.res), `→ ${e.err || e.res.slice(0, 40)}`);

  // Le symbole collé au nombre est décoratif : « 250 000 € » se calcule.
  e = await essayer('prix = 250 000 €\nseuil: <= 300 000 €\nprix');
  verifie('un prix écrit à la française se calcule',
    !e.err && /250/.test(e.res), `→ ${e.err || e.res.slice(0, 60)}`);
  e = await essayer('x = € * 2');
  verifie('… mais un symbole seul renvoie toujours à « unité: »',
    /unité:/.test(e.err), `→ ${e.err}`);

  e = await essayer('budget = 300k\nprix = 250k à 400k\nprix <= budget');
  verifie('une contrainte est lue comme un objectif',
    !e.err && /objectif/.test(e.av), `→ ${e.err || e.av.slice(0, 70)}`);

  e = await essayer('Loyer = 900 à 1150\ntotal = loyer * 12');
  verifie('une majuscule perdue est rattrapée',
    /vouliez-vous dire/.test(e.err), `→ ${e.err}`);

  e = await essayer('prix du kilo = 2 à 4');
  verifie('un nom avec des espaces propose le nom collé',
    /prix_du_kilo/.test(e.err), `→ ${e.err}`);

  e = await essayer('a = 1000 ± 100\nb = a * 2');
  verifie('« ± » écrit une fourchette', !e.err && /2/.test(e.res), `→ ${e.err || e.res.slice(0, 40)}`);

  e = await essayer('a = 100\nb = 20\nc = 3\ntotal = a - b\n  + c * 2');
  verifie('une formule sur plusieurs lignes est calculée en entier',
    /86/.test(e.res) && !e.av, `→ ${e.res.slice(0, 50)} / ${e.av}`);

  e = await essayer('x = 1 à 3\ny = x * 2');
  verifie('un modèle sain n’affiche aucun avertissement', e.av === '');

  verifie('aucune exception pendant toute la série', inc8.length === 0, '→ ' + inc8.join(' | '));
  await p8.close();
}

// --- Partage par lien ----------------------------------------------------------
console.log('\n\x1b[1mPartage\x1b[0m');
// Chrome bride le rendu des onglets en arrière-plan : après avoir travaillé
// dans un autre onglet, il faut remettre celui-ci devant avant de cliquer.
await page.bringToFront();
await page.evaluate(() => {
  const t = document.querySelector('#modele');
  t.value = 'unité: €\nmarge = 10 à 90\nventes = 100\nresultat = marge * ventes';
  t.dispatchEvent(new Event('input', { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 700));
await page.click('#partager');
await page.waitForFunction(() => location.hash.length > 2, { timeout: 8000 });
const lien = await page.url();
verifie('le lien contient le modèle', lien.includes('#') && lien.length > URL.length + 20);

// Le verdict en texte : ce qui est à l'écran, dans le même ordre, plus le lien.
await page.evaluate(() => {
  window.__copie = null;
  navigator.clipboard.writeText = async (t) => { window.__copie = t; };
});
await page.click('#copier-verdict');
await new Promise((r) => setTimeout(r, 300));
const copie = await page.evaluate(() => window.__copie);
verifie('« Copier le verdict » produit un texte', typeof copie === 'string' && copie.length > 200, `→ ${(copie || '').length} caractères`);
verifie('… qui contient le lien vers le modèle', !!copie && copie.split('\n')[1].startsWith(URL + '/') && copie.includes('#'),
  `→ ${(copie || '').split('\n')[1]}`);
verifie('… le résultat affiché', !!copie && /RESULTAT|RÉSULTAT|CE QUE DIT LE MODÈLE|TROP SERRÉ/.test(copie) && copie.includes('▶'),
  `→ ${(copie || '').slice(0, 200).replace(/\n/g, ' ⏎ ')}`);
verifie('… et les hypothèses à vérifier', !!copie && /D’OÙ VIENT L’INCERTITUDE|CE QU’IL FAUT ALLER VÉRIFIER/.test(copie) && copie.includes('• marge'),
  `→ ${(copie || '').slice(0, 300).replace(/\n/g, ' ⏎ ')}`);
verifie('… sans le détail des calculs', !!copie && !copie.includes('DÉTAIL DES CALCULS'));
const etiquette = await page.$eval('#copier-verdict', (n) => n.textContent);
verifie('le bouton confirme la copie', etiquette === 'Verdict copié', `→ « ${etiquette} »`);

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
    // 304 « non modifié » est une réponse réussie : le navigateur a revalidé
    // sa copie en cache. Exiger 200 ferait échouer le test au second passage.
    verifie(`${chemin} répond`, r.status() === 200 || r.status() === 304, `→ ${r.status()}`);
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
    // Toute la prose du site utilise l'apostrophe typographique ; une droite
    // trahit un texte oublié quelque part.
    const droites = await page3.evaluate(() =>
      (document.body.innerText.match(/\w'\w/g) || []).slice(0, 3));
    verifie(`${chemin} : aucune apostrophe droite`, droites.length === 0, `→ ${droites}`);
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

// --- Texte de fond ---------------------------------------------------------------
console.log('\n\x1b[1mTexte de fond\x1b[0m');
{
  const { FOND } = await import('../outils/fond.js');
  const p7 = await navigateur.newPage();
  await p7.setViewport({ width: 1280, height: 900 });

  verifie('chaque modèle a un texte de fond',
    MODELES.every((m) => FOND[m.cle]), '→ ' + MODELES.filter((m) => !FOND[m.cle]).map((m) => m.cle));

  for (const m of MODELES) {
    const chemin = m.cle === 'logement' ? '/' : '/' + m.slug;
    // Sans JavaScript : c'est la seule partie de la page qu'un moteur de
    // recherche peut lire, et un visiteur sans JS aussi.
    await p7.setJavaScriptEnabled(false);
    await p7.goto(URL + chemin, { waitUntil: 'domcontentloaded' });
    const bloc = await p7.evaluate(() => {
      const f = document.querySelector('.fond');
      return f ? { parts: f.querySelectorAll('.fond-part').length, texte: f.innerText.length } : null;
    });
    verifie(`${chemin} : trois volets de fond, lisibles sans JS`,
      bloc && bloc.parts === 3 && bloc.texte > 600, `→ ${JSON.stringify(bloc)}`);
    await p7.setJavaScriptEnabled(true);
  }

  // Le balisage minimal doit être rendu, pas affiché tel quel.
  await p7.goto(URL + '/', { waitUntil: 'networkidle0' });
  const rendu = await p7.evaluate(() => {
    const f = document.querySelector('.fond');
    return { texte: f.innerText, gras: f.querySelectorAll('b').length,
             code: f.querySelectorAll('code').length, exemples: f.querySelectorAll('pre.exemple').length };
  });
  verifie('le gras et le code sont rendus', rendu.gras >= 3 && rendu.code >= 3,
    `→ ${rendu.gras} gras, ${rendu.code} code`);
  verifie('l’exemple de facteur commun est un bloc de code', rendu.exemples === 1, `→ ${rendu.exemples}`);
  verifie('aucun balisage brut ne fuit', !/\*\*|```/.test(rendu.texte));
  verifie('aucune apostrophe droite dans le texte de fond', !/\w'\w/.test(rendu.texte),
    `→ ${(rendu.texte.match(/\w'\w/g) || []).slice(0, 3)}`);
  await p7.close();
}

// --- La page de méthode ---------------------------------------------------------
console.log('\n\x1b[1mLa méthode\x1b[0m');
{
  const p9 = await navigateur.newPage();
  const inc9 = [];
  p9.on('pageerror', (e) => inc9.push(e.message));
  await p9.setViewport({ width: 1000, height: 900 });

  const r = await p9.goto(URL + '/la-methode', { waitUntil: 'networkidle0' });
  verifie('/la-methode répond', r.status() === 200 || r.status() === 304, `→ ${r.status()}`);

  const info = await p9.evaluate(() => ({
    titre: document.title,
    canonique: document.querySelector('link[rel=canonical]')?.href,
    h1: document.querySelector('h1')?.textContent.trim(),
    h2: [...document.querySelectorAll('.chapitre h2')].map((n) => n.textContent),
    reponses: document.querySelectorAll('.reponse').length,
    exemples: document.querySelectorAll('pre.exemple').length,
    mots: document.body.innerText.trim().split(/\s+/).length,
    brut: /\*\*|```/.test(document.body.innerText),
    droites: /\w'\w/.test(document.body.innerText),
    retour: !!document.querySelector('.retour-outil a'),
  }));
  verifie('titre et canonique corrects',
    info.titre === 'La méthode — Boussole' && info.canonique === URL + '/la-methode',
    `→ ${info.titre} / ${info.canonique}`);
  verifie('les neuf chapitres sont là', info.h2.length === 9, `→ ${info.h2.length}`);
  verifie('ce qu’on perd quand on se trompe a son chapitre',
    info.h2.some((t) => /ce que vous jouez/i.test(t)), `→ ${info.h2.join(' | ')}`);
  verifie('le contre-argument a son chapitre',
    info.h2.some((t) => /contre-argument/i.test(t)), `→ ${info.h2.join(' | ')}`);
  verifie('la valeur de l’information a son chapitre',
    info.h2.some((t) => /valeur de l/i.test(t)), `→ ${info.h2.join(' | ')}`);
  verifie('les exemples sont rendus en blocs de code', info.exemples >= 5, `→ ${info.exemples}`);
  verifie('les réponses du site sont mises en valeur', info.reponses >= 4, `→ ${info.reponses}`);
  verifie('la page a de la substance', info.mots > 900, `→ ${info.mots} mots`);
  verifie('aucun balisage brut ne fuit', !info.brut);
  verifie('aucune apostrophe droite', !info.droites);
  verifie('un chemin de retour vers l’outil', info.retour);

  const deb = await p9.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  verifie('aucun débordement horizontal', deb <= 1, `→ ${deb}px`);
  await p9.setViewport({ width: 390, height: 844 });
  await p9.reload({ waitUntil: 'networkidle0' });
  const debM = await p9.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  verifie('… ni sur écran étroit', debM <= 1, `→ ${debM}px`);

  // Chaque page du site doit y mener.
  await p9.setViewport({ width: 1000, height: 900 });
  let liees = 0;
  for (const m of MODELES) {
    await p9.goto(URL + (m.cle === 'logement' ? '/' : '/' + m.slug), { waitUntil: 'domcontentloaded' });
    if (await p9.$('footer a[href="/la-methode"]')) liees++;
  }
  verifie('toutes les pages de modèle y mènent', liees === MODELES.length, `→ ${liees}/${MODELES.length}`);

  verifie('aucune erreur sur la page de méthode', inc9.length === 0, '→ ' + inc9.join(' | '));
  await p9.close();
}

// --- Accessibilité ---------------------------------------------------------------
// Un visiteur au clavier ou au lecteur d'écran est un visiteur réel. axe-core
// vérifie ce qui se vérifie mécaniquement ; le reste — une seule phrase
// annoncée à chaque recalcul, pas toute la page — est vérifié à la main ici.
console.log('\n\x1b[1mAccessibilité\x1b[0m');
{
  const axeSource = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
  const pa = await navigateur.newPage();
  await pa.setViewport({ width: 1200, height: 900 });
  await pa.setBypassCSP(true);   // pour injecter axe ; le site, lui, garde sa CSP
  for (const chemin of ['/', '/la-methode', '/prix-du-kilometre', '/une-adresse-qui-n-existe-pas']) {
    await pa.goto(URL + chemin, { waitUntil: 'networkidle0' });
    if (chemin === '/' || chemin.startsWith('/prix')) await pa.waitForSelector('.verdict-titre');
    await pa.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
    await pa.evaluate(axeSource);
    const res = await pa.evaluate(async () => {
      const r = await axe.run(document, { resultTypes: ['violations'] });
      return r.violations.map((v) => `${v.id} ×${v.nodes.length} (${v.nodes[0].target.join(' ')})`);
    });
    verifie(`${chemin} : aucune violation axe`, res.length === 0, `→ ${res.join(' | ')}`);
    const reperes = await pa.evaluate(() => ({
      main: document.querySelectorAll('main').length,
      saut: document.querySelector('a.saut')?.getAttribute('href'),
      h1: document.querySelectorAll('h1').length,
    }));
    verifie(`${chemin} : un seul <main>, un <h1>, un lien d'évitement`,
      reperes.main === 1 && reperes.h1 === 1 && reperes.saut === '#contenu', `→ ${JSON.stringify(reperes)}`);
  }

  // Le lecteur d'écran n'entend que le verdict, et seulement s'il a changé.
  await pa.goto(URL + '/prix-du-kilometre', { waitUntil: 'networkidle0' });
  await pa.waitForSelector('.verdict-titre');
  const a1 = await pa.$eval('#annonce', (n) => n.textContent);
  verifie('l’annonce initiale est une phrase courte', a1.length > 10 && a1.length < 300, `→ ${a1.length} car. « ${a1.slice(0, 80)}… »`);
  verifie('la zone de résultats n’est plus en aria-live',
    await pa.$eval('#resultats', (n) => !n.hasAttribute('aria-live') && n.getAttribute('role') === 'region'));
  await pa.evaluate(() => {
    const t = document.querySelector('#modele');
    t.value = t.value.replace('# la queue est longue', '# note');
    t.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 700));
  const a2 = await pa.$eval('#annonce', (n) => n.textContent);
  verifie('un commentaire modifié ne change pas l’annonce', a2 === a1);
  await pa.evaluate(() => {
    const t = document.querySelector('#modele');
    t.value = t.value.replace('km_an = 8000 à 16000', 'km_an = 30000 à 40000');
    t.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 700));
  const a3 = await pa.$eval('#annonce', (n) => n.textContent);
  verifie('une hypothèse modifiée change l’annonce', a3 !== a1, `→ « ${a3.slice(0, 80)} »`);

  // Au clavier : le premier Tab tombe sur le lien d'évitement, qui mène au contenu.
  await pa.goto(URL + '/', { waitUntil: 'networkidle0' });
  await pa.keyboard.press('Tab');
  const premier = await pa.evaluate(() => document.activeElement.className);
  verifie('le premier Tab atteint le lien d’évitement', premier === 'saut', `→ ${premier}`);
  const visible = await pa.$eval('a.saut', (n) => n.getBoundingClientRect().top >= 0);
  verifie('… qui devient visible au focus', visible);
  await pa.keyboard.press('Enter');
  const cible = await pa.evaluate(() => document.activeElement.id);
  verifie('… et Entrée mène au contenu', cible === 'contenu', `→ ${cible}`);
  await pa.close();
}

// --- Le brouillon du visiteur ---------------------------------------------------
// L'accueil rend au visiteur ce qu'il était en train d'écrire. Regarder un
// autre modèle en passant ne doit pas l'effacer ; « Réinitialiser », si.
console.log('\n\x1b[1mBrouillon\x1b[0m');
{
  const pb = await navigateur.newPage();
  await pb.setViewport({ width: 1200, height: 900 });
  const lireModele = () => pb.$eval('#modele', (n) => n.value);
  const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

  await pb.goto(URL + '/', { waitUntil: 'networkidle0' });
  await pb.evaluate(() => localStorage.clear());
  await pb.goto(URL + '/prix-du-kilometre', { waitUntil: 'networkidle0' });
  await attendre(400);
  await pb.goto(URL + '/', { waitUntil: 'networkidle0' });
  const defaut = await lireModele();
  verifie('visiter un modèle sans y toucher ne change pas l’accueil',
    defaut.includes('Louer ou acheter'), `→ « ${defaut.slice(0, 40)} »`);

  await pb.evaluate(() => {
    const t = document.querySelector('#modele');
    t.value = t.value.replace('unité: €', 'unité: €\n# mon brouillon');
    t.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await attendre(500);
  await pb.click('#exemples a[data-cle="combles"]');
  await attendre(500);
  verifie('la pastille a bien chargé l’autre modèle', (await lireModele()).includes('combles'));
  await pb.goto(URL + '/', { waitUntil: 'networkidle0' });
  verifie('le brouillon survit à la visite d’un autre modèle',
    (await lireModele()).includes('# mon brouillon'));

  await pb.click('#reinit');
  await attendre(400);
  await pb.goto(URL + '/', { waitUntil: 'networkidle0' });
  verifie('« Réinitialiser » efface le brouillon pour de bon',
    !(await lireModele()).includes('# mon brouillon'));
  await pb.evaluate(() => localStorage.clear());
  await pb.close();
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
    MODELES.every((m) => xml.includes(m.cle === 'logement' ? '<loc>' + URL + '/</loc>' : '/' + m.slug))
    && xml.includes('/la-methode'),
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
