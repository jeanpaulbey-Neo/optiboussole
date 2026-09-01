// Génère public/index.html et une page par modèle. `npm run pages`
import { writeFileSync } from 'node:fs';
import { MODELES, MODELE_PAR_DEFAUT } from '../public/js/modeles.js';
import { page, lien } from './gabarit.js';

const options = { modeles: MODELES, defaut: MODELE_PAR_DEFAUT };
const ecrites = [];

const defaut = MODELES.find((m) => m.cle === MODELE_PAR_DEFAUT);
writeFileSync('public/index.html', page({ modele: defaut, accueil: true, ...options }));
ecrites.push(['/', 'index.html']);

for (const m of MODELES) {
  if (m.cle === MODELE_PAR_DEFAUT) continue;   // il vit déjà à la racine
  const fichier = `public/${m.slug}.html`;
  writeFileSync(fichier, page({ modele: m, accueil: false, ...options }));
  ecrites.push([lien(m, MODELE_PAR_DEFAUT), `${m.slug}.html`]);
}

// Un plan du site : c'est le seul moyen qu'a un moteur de recherche de savoir
// que ces adresses existent, personne ne pointant encore vers elles.
const aujourdhui = new Date().toISOString().slice(0, 10);
writeFileSync('public/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
  + ecrites.map(([url]) =>
      `  <url><loc>https://optiboussole.fr${url}</loc><lastmod>${aujourdhui}</lastmod></url>`).join('\n')
  + `\n</urlset>\n`);

writeFileSync('public/robots.txt',
  'User-agent: *\nAllow: /\n\nSitemap: https://optiboussole.fr/sitemap.xml\n');

for (const [url, f] of ecrites) console.log(`  ${url.padEnd(32)} ← ${f}`);
console.log(`  ${ecrites.length} pages, plus sitemap.xml et robots.txt`);
