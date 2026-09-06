// apercus.js — les images d'aperçu de lien. `npm run apercus`
//
// Une image par page, 1200 × 630, écrite dans `public/og/`. Elles sont
// **générées une fois et versionnées** : le site reste un tas de fichiers
// statiques, et rien ne tourne au moment où quelqu'un partage un lien.
//
// Le rendu passe par le même Chrome que les tests — la seule dépendance déjà
// là — parce qu'écrire un PNG à la main demanderait un moteur de rendu de
// texte, et que le texte est tout ce que ces images contiennent.
//
// Contrainte de fond : les polices sont celles du serveur (Noto Serif, Noto
// Sans). Ne pas appeler une police en ligne — un aperçu qui dépend d'un
// service tiers est un aperçu qui casse un jour, et le mandat interdit
// d'ailleurs d'en dépendre.
import puppeteer from 'puppeteer';
import { mkdirSync, writeFileSync } from 'node:fs';
import { VIGNETTES } from './seo.js';

const SORTIE = 'public/og';
mkdirSync(SORTIE, { recursive: true });

const echappe = (t) => String(t)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// La même typographie que les pages : espace fine insécable devant « : », « ? »
// et « ! ». Sans elle, une vignette écrit « quoi d'abord ?» collé, ou pire,
// renvoie le point d'interrogation seul à la ligne suivante.
const typographie = (t) => t
  .replace(/ ([:;?!])/g, '\u202f$1').replace(/« /g, '«\u202f').replace(/ »/g, '\u202f»');

// La rose des vents du site, telle quelle.
const ROSE = `<svg viewBox="0 0 32 32" width="52" height="52" aria-hidden="true">
  <circle cx="16" cy="16" r="14.5" fill="none" stroke="#0d5c63" stroke-opacity=".3" stroke-width="1.2"/>
  <path d="M16 3 L19.2 14.4 L16 16 Z" fill="#0d5c63"/>
  <path d="M16 29 L12.8 17.6 L16 16 Z" fill="#0d5c63" fill-opacity=".35"/>
</svg>`;

// Le gabarit d'une vignette. Mêmes couleurs et mêmes familles que le site : un
// aperçu qui ne ressemble pas à la page où il mène est un aperçu qui ment.
const gabarit = ({ titre, sous }) => `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  html, body { width: 1200px; height: 630px; }
  body {
    background: #f6f4ef; color: #1b1f24;
    font-family: "Noto Sans", sans-serif;
    display: flex; flex-direction: column;
    padding: 66px 78px 58px; position: relative;
  }
  /* Le trait d'accent : la seule couleur pleine de l'image, à gauche, comme
     l'aiguille d'une boussole posée sur le bord. */
  .bande { position: absolute; left: 0; top: 0; bottom: 0; width: 14px; background: #0d5c63; }
  /* La rose en grand, à droite, très pâle : elle occupe la moitié vide de
     l'image sans disputer un seul mot au texte. */
  .fond { position: absolute; right: -78px; bottom: -104px; width: 540px; height: 540px;
          opacity: .07; }
  .fond svg { width: 100%; height: 100%; }
  .marque { display: flex; align-items: center; gap: 14px; }
  .nom { font-family: "Noto Serif", serif; font-size: 34px; letter-spacing: -.01em; }
  .adresse { margin-left: auto; font-size: 23px; color: #6a7078; letter-spacing: .02em; }
  h1 {
    font-family: "Noto Serif", serif; font-weight: 600;
    font-size: 74px; line-height: 1.1; letter-spacing: -.02em;
    margin-top: auto; max-width: 17ch; position: relative;
  }
  h1.long { font-size: 60px; max-width: 20ch; }
  p {
    margin-top: 26px; font-size: 30px; line-height: 1.45;
    color: #4b525a; max-width: 34ch; position: relative;
  }
  .pied {
    margin-top: auto; padding-top: 26px; border-top: 1px solid #cec8ba;
    font-size: 22px; color: #6a7078; display: flex; gap: 12px; align-items: baseline;
  }
  .pied b { color: #0d5c63; font-weight: 600; }
</style></head>
<body>
  <div class="bande"></div>
  <div class="fond">${ROSE.replace('width="52" height="52"', '')}</div>
  <div class="marque">${ROSE}<span class="nom">Boussole</span>
    <span class="adresse">optiboussole.fr</span></div>
  <h1${titre.length > 26 ? ' class="long"' : ''}>${typographie(echappe(titre))}</h1>
  <p>${typographie(echappe(sous))}</p>
  <div class="pied"><b>Gratuit, sans compte.</b>
    <span>Le calcul se fait dans votre navigateur.</span></div>
</body></html>`;

// L'icône d'écran d'accueil : la rose sur le papier du site, en 180 × 180.
const ICONE = `<!doctype html><html><head><meta charset="utf-8"><style>
  html, body { margin: 0; width: 180px; height: 180px; }
  body { background: #f6f4ef; display: flex; align-items: center; justify-content: center; }
  svg { width: 126px; height: 126px; }
</style></head><body>${ROSE.replace('width="52" height="52"', '')}</body></html>`;

const navigateur = await puppeteer.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const onglet = await navigateur.newPage();

await onglet.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
for (const v of VIGNETTES) {
  await onglet.setContent(gabarit(v), { waitUntil: 'load' });
  await onglet.screenshot({ path: `${SORTIE}/${v.fichier}.png`, type: 'png' });
  console.log(`  og/${v.fichier}.png`.padEnd(44) + `« ${v.titre} »`);
}

await onglet.setViewport({ width: 180, height: 180, deviceScaleFactor: 1 });
await onglet.setContent(ICONE, { waitUntil: 'load' });
await onglet.screenshot({ path: 'public/icone-180.png', type: 'png' });
console.log('  icone-180.png');

await navigateur.close();
console.log(`  ${VIGNETTES.length} aperçus, plus l'icône.`);
