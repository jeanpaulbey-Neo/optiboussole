// robots.js — qui est venu lire le site. `npm run robots`
//
// Répond à « comment tester qu'on est référencé par Bing ? ». Interroger Bing
// de l'extérieur ne dit qu'une chose, et tard : tant qu'il n'a pas indexé, la
// réponse est « aucun résultat », qu'il soit passé ou non. **Le premier signal
// est le passage du robot sur ce serveur**, et il arrive des jours avant
// l'apparition dans les résultats. L'ordre est toujours : le robot passe →
// l'adresse est indexée → elle sort sur une recherche.
//
// La source est `/var/log/caddy/robots.log`, écrit par Caddy pour les seules
// requêtes qui s'annoncent comme des robots, sans adresse IP — voir le
// Caddyfile, et l'interdit n° 3 du mandat. Il n'existe aucun journal des
// visiteurs, et il ne doit pas en exister.
//
// ⚠️ **Ce que ce journal ne prouve pas.** Un User-Agent se déclare, il ne se
// vérifie pas. La façon normale d'authentifier un robot est la résolution
// inverse de son adresse IP (`*.search.msn.com` pour Bing) — et l'adresse est
// justement ce qu'on refuse de garder. Ce compteur dit donc « quelqu'un s'est
// annoncé comme bingbot », ce qui est un signal précoce et non une preuve. La
// preuve, elle, arrive plus tard et ailleurs : l'adresse sort sur une
// recherche. C'est un échange délibéré, pas un oubli.
import { readFileSync, existsSync, readdirSync } from 'node:fs';

const DOSSIER = '/var/log/caddy';
const fichiers = existsSync(DOSSIER)
  ? readdirSync(DOSSIER).filter((f) => f.startsWith('robots')).map((f) => `${DOSSIER}/${f}`)
  : [];

if (!fichiers.length) {
  console.error(`Aucun journal dans ${DOSSIER}. Caddy a-t-il été rechargé ?`);
  process.exit(1);
}

// Les familles qui comptent pour l'indexation, dans l'ordre où on les regarde.
// Un robot inconnu n'est pas écarté : il tombe dans « autres », et c'est là
// qu'on voit passer ce qu'on n'attendait pas.
const FAMILLES = [
  ['Bing', /bingbot|adidxbot|bingpreview|msnbot/i],
  ['Google', /googlebot|google-inspectiontool|storebot-google/i],
  ['Yandex', /yandex/i],
  ['DuckDuckGo', /duckduckbot|duckassistbot/i],
  ['Seznam', /seznambot/i],
  ['Apple', /applebot/i],
  ['Qwant', /qwantify|qwantbot/i],
  ['Brave', /bravebot/i],
  ['Mojeek', /mojeekbot/i],
  ['IA (entraînement ou réponse)', /gptbot|oai-searchbot|chatgpt-user|claudebot|claude-web|anthropic|ccbot|perplexitybot|google-extended|bytespider|amazonbot|meta-externalagent/i],
  ['Aperçus de lien', /facebookexternalhit|twitterbot|linkedinbot|slackbot|discordbot|whatsapp|telegrambot|redditbot|mastodon|embedly|pinterest/i],
];

const familleDe = (ua) => (FAMILLES.find(([, re]) => re.test(ua)) || ['Autres'])[0];

const vus = new Map();
let lignes = 0;
for (const f of fichiers) {
  let brut;
  try { brut = readFileSync(f, 'utf8'); }
  catch { console.error(`  (${f} illisible — lancez avec sudo, ou ajoutez-vous au groupe caddy)`); continue; }
  for (const ligne of brut.split('\n')) {
    if (!ligne.trim()) continue;
    let e;
    try { e = JSON.parse(ligne); } catch { continue; }
    const ua = e.request?.headers?.['User-Agent']?.[0] || '';
    const chemin = e.request?.uri || '';
    if (!ua) continue;
    lignes++;
    const nom = familleDe(ua);
    const v = vus.get(nom) || { hits: 0, pages: new Set(), premier: e.ts, dernier: e.ts, agents: new Set() };
    v.hits++;
    v.pages.add(chemin);
    v.agents.add(ua.slice(0, 70));
    v.premier = Math.min(v.premier, e.ts);
    v.dernier = Math.max(v.dernier, e.ts);
    vus.set(nom, v);
  }
}

const date = (ts) => new Date(ts * 1000).toISOString().replace('T', ' ').slice(0, 16);
const PAGES = 17;
const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`;

console.log(`\n  ${pluriel(lignes, 'requête')} de robots enregistrée${lignes > 1 ? 's' : ''}, `
  + `${pluriel(vus.size, 'famille')}.\n`);
if (!vus.size) {
  console.log('  Personne n\'est encore passé. C\'est normal les premiers jours :');
  console.log('  Bing met de quelques heures à quelques jours après une annonce IndexNow.\n');
}

const classe = [...vus.entries()].sort((a, b) => b[1].dernier - a[1].dernier);
for (const [nom, v] of classe) {
  console.log(`  ${nom.padEnd(30)} ${String(v.hits).padStart(5)} req.`
    + `   ${String(v.pages.size).padStart(3)}/${PAGES} pages`
    + `   dernier passage ${date(v.dernier)}`);
}

// La question posée, et sa réponse en une ligne.
const bing = vus.get('Bing');
console.log('');
if (bing) {
  console.log(`  → Bing est passé : ${pluriel(bing.hits, 'requête')}, `
    + `${bing.pages.size} page${bing.pages.size > 1 ? 's' : ''} sur ${PAGES},`);
  console.log(`    du ${date(bing.premier)} au ${date(bing.dernier)}.`);
  console.log('    L\'indexation suit le passage de quelques heures à quelques jours.');
  console.log('    Vérification finale : chercher « site:optiboussole.fr » sur bing.com.');
} else {
  console.log('  → Bing n\'est pas encore passé sur ce serveur.');
  console.log('    Inutile de chercher « site:optiboussole.fr » : la réponse sera vide.');
}
console.log('');
