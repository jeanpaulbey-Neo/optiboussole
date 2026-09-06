// Génère les pages servies, le plan du site et robots.txt. `npm run pages`
//
// Une page par modèle, plus les quatre pages de texte. Le déploiement, ici,
// c'est l'écriture de ces fichiers dans `public/` : il n'y a rien d'autre.
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { MODELES, MODELE_PAR_DEFAUT } from '../public/js/modeles.js';
import { page, pageMethode, pageLangage, pageCas, pageApropos, page404, lien } from './gabarit.js';

const options = { modeles: MODELES, defaut: MODELE_PAR_DEFAUT };
const ecrites = [];

// La date de dernière modification, tenue honnête.
//
// Elle était recalculée à chaque génération : le plan du site annonçait seize
// pages modifiées aujourd'hui alors qu'une seule avait bougé. Un moteur de
// recherche qui recrawle seize pages pour rien apprend surtout à ne plus
// croire ce fichier. La date ne change donc que si le contenu change vraiment.
//
// Le mécanisme : la page est d'abord produite avec un jeton à la place de la
// date, ce qui rend son empreinte indépendante de la date elle-même — sans
// quoi le contenu changerait à chaque fois qu'on écrit la date, qui changerait
// donc à chaque fois. Le jeton est remplacé après comparaison.
const JETON = '@@DERNIERE-MODIFICATION@@';
const CARNET = 'outils/dates.json';
const carnet = existsSync(CARNET) ? JSON.parse(readFileSync(CARNET, 'utf8')) : {};
const aujourdhui = new Date().toISOString().slice(0, 10);

function ecrire(url, fichier, produire) {
  const brouillon = produire(JETON);
  const empreinte = createHash('sha256').update(brouillon).digest('hex').slice(0, 16);
  const connu = carnet[url];
  const date = connu && connu.empreinte === empreinte ? connu.date : aujourdhui;
  carnet[url] = { date, empreinte };
  writeFileSync(`public/${fichier}`, brouillon.replaceAll(JETON, date));
  ecrites.push([url, fichier, date, connu && connu.date === date ? '' : 'modifiée']);
}

const defaut = MODELES.find((m) => m.cle === MODELE_PAR_DEFAUT);
ecrire('/', 'index.html', (d) => page({ modele: defaut, accueil: true, dateModifiee: d, ...options }));

for (const m of MODELES) {
  if (m.cle === MODELE_PAR_DEFAUT) continue;   // il vit déjà à la racine
  ecrire(lien(m, MODELE_PAR_DEFAUT), `${m.slug}.html`,
    (d) => page({ modele: m, accueil: false, dateModifiee: d, ...options }));
}

ecrire('/la-methode', 'la-methode.html', pageMethode);
ecrire('/le-langage', 'le-langage.html', pageLangage);
ecrire('/un-cas', 'un-cas.html', pageCas);
ecrire('/a-propos', 'a-propos.html', pageApropos);

// La 404 n'est pas dans le plan du site : elle est là pour qui se trompe
// d'adresse, et elle porte `noindex`.
writeFileSync('public/404.html', page404(options));

// Un plan du site : c'est le seul moyen qu'a un moteur de recherche de savoir
// que ces adresses existent, personne ne pointant encore vers elles.
writeFileSync('public/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
  + ecrites.map(([url, , date]) =>
      `  <url><loc>https://optiboussole.fr${url}</loc><lastmod>${date}</lastmod></url>`).join('\n')
  + `\n</urlset>\n`);

// Rien à cacher : tout est public, statique, et sans compte. Le seul chemin
// qu'un robot n'a aucune raison de suivre est celui des aperçus d'image, qui
// ne portent aucun texte qu'une page ne dise déjà — mais l'interdire priverait
// les réseaux sociaux de la vignette qu'ils y cherchent. On laisse ouvert.
writeFileSync('public/robots.txt',
  '# Boussole — https://optiboussole.fr\n'
  + '# Un site statique, sans compte et sans traceur : tout est indexable.\n'
  + 'User-agent: *\nAllow: /\n\n'
  + 'Sitemap: https://optiboussole.fr/sitemap.xml\n');

writeFileSync(CARNET, JSON.stringify(
  Object.fromEntries(Object.entries(carnet).sort(([a], [b]) => a.localeCompare(b))), null, 2) + '\n');

for (const [url, f, date, etat] of ecrites) {
  console.log(`  ${url.padEnd(32)} ← ${f.padEnd(36)} ${date} ${etat}`);
}
console.log(`  ${ecrites.length} pages, plus sitemap.xml et robots.txt`);
