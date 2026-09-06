// indexnow.js — prévenir les moteurs de recherche que ces pages existent.
//   npm run indexnow
//
// **Ce script n'est pas lancé par la génération du site, et je ne l'ai jamais
// lancé moi-même.** C'est le seul endroit de tout ce projet qui envoie quelque
// chose vers l'extérieur, et le mandat (`CLAUDE.md`, interdit n° 2) l'interdit
// sans décision humaine. Il est écrit, testé à vide, et attend qu'on l'appelle.
//
// Ce que fait IndexNow : un protocole ouvert (Bing, Yandex, Seznam, Naver) où
// l'on prouve qu'on possède le domaine en y posant un fichier au nom de la clé,
// puis où l'on annonce des adresses en une requête. Aucun compte, aucune
// inscription, aucun paiement. Google n'y participe pas : pour lui, il faut la
// Search Console, qui demande un compte — voir PROMOTION.md.
//
// La clé vit dans `public/<clé>.txt`, servi par Caddy comme tout le reste. La
// changer veut dire changer les deux au même moment.
import { readFileSync, readdirSync } from 'node:fs';

const CLE = readdirSync('public')
  .filter((f) => /^[0-9a-f]{32}\.txt$/.test(f))
  .map((f) => f.replace('.txt', ''))[0];

if (!CLE) {
  console.error('Aucune clé IndexNow dans public/. Voir PROMOTION.md.');
  process.exit(1);
}

const adresses = [...readFileSync('public/sitemap.xml', 'utf8')
  .matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

const charge = {
  host: 'optiboussole.fr',
  key: CLE,
  keyLocation: `https://optiboussole.fr/${CLE}.txt`,
  urlList: adresses,
};

if (process.argv.includes('--pour-de-vrai')) {
  const rep = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(charge),
  });
  console.log(`  ${rep.status} ${rep.statusText} — ${adresses.length} adresses annoncées`);
  console.log('  200 ou 202 : reçu. 403 : la clé n\'est pas servie. 422 : une adresse n\'est pas du domaine.');
} else {
  console.log(`  ${adresses.length} adresses prêtes à être annoncées, clé ${CLE.slice(0, 8)}…`);
  console.log('  Rien n\'a été envoyé. Pour envoyer vraiment :');
  console.log('      npm run indexnow -- --pour-de-vrai');
}
