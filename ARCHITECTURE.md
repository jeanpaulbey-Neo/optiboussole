# Architecture — optiboussole.fr

État au 1ᵉʳ septembre 2026.

## En une phrase

Un site **entièrement statique**. Caddy sert `/srv/optiboussole/public`. Tout le
calcul se fait dans le navigateur du visiteur, en JavaScript natif, sans build,
sans dépendance, sans requête réseau après le chargement. Il n'y a **aucun
processus applicatif** à surveiller : si Caddy tourne, le site marche.

Ce choix est délibéré et il faut y réfléchir à deux fois avant d'en changer :
il rend impossible toute collecte de données de visiteurs (interdit n° 3),
supprime toute dépense (n° 1), et fait qu'un déploiement ne peut pas « tomber ».

## Arborescence

```
/srv/optiboussole/
├── public/                 ← racine servie par Caddy
│   ├── index.html          page unique + panneau d'aide (syntaxe complète)
│   ├── app.css             thème clair/sombre par variables CSS
│   ├── boussole.svg        favicon
│   └── js/
│       ├── rng.js          xoshiro128** déterministe, lois de probabilité
│       ├── lang.js         lexer + parseur du langage de modèle
│       ├── evaluer.js      évaluation vectorisée (Float64Array, N tirages)
│       ├── moteur.js       sensibilité, seuils de bascule, valeur de l'info
│       ├── modeles.js      bibliothèque des six modèles de départ
│       └── ui.js           rendu, phrases en français, partage par URL
├── test/
│   ├── run.js              108 assertions sur le moteur (Node, sans dépendance)
│   └── navigateur.js       24 vérifications dans un vrai Chrome + captures
├── package.json            scripts npm ; `type: module`
├── JOURNAL.md              journal de bord daté
├── ARCHITECTURE.md         ce fichier
└── CLAUDE.md               le mandat
```

`node_modules/` (puppeteer, uniquement pour les tests) est ignoré par Git.

## Chaîne de traitement

```
texte du modèle
   │  lang.js : extraireUnite → lexer → Parseur
   ▼
AST { declarations, options, sortie, unite, seuil }
   │  evaluer.js : évaluation vectorisée, N = 20 000 tirages
   ▼
{ sources[], variables, options[], sortie }        « source » = un tirage aléatoire
   │  moteur.js : indices, seuils, EVPPI
   ▼
{ modeDecision, options{}, sortie{}, sources[{ part, valeurInfo, bascules }] }
   │  ui.js
   ▼
des phrases en français
```

### Points de conception à ne pas casser

- **Mémoïsation des variables.** Une variable n'est évaluée qu'une fois : c'est
  ce qui fait que `a - a` vaut exactement zéro et que les corrélations sont
  correctes. Toute réécriture qui réévalue une variable est un bug silencieux.
- **Identifiants de source stables.** `s0`, `s1`… sont attribués dans l'ordre de
  parcours, qui ne dépend pas de `N`. Les seuils de bascule reposent là-dessus :
  ils réévaluent le modèle avec `remplacements = { s3: grille, …autres à leur médiane }`.
- **Indice de sensibilité calculé sur les rangs de la sortie**, pas sur ses
  valeurs. Sur des grandeurs lognormales — c'est-à-dire presque toutes — un
  indice de variance brut est confisqué par quelques tirages extrêmes :
  `y = a` descendait à 0,22 au lieu de 1. Mesuré sur les rangs : 0,997.
- **Aucun attribut `style` inline.** La CSP du site les interdit. `ui.js` passe
  par le CSSOM (`n.style.width = …`), qui n'est pas concerné. Écrire
  `el('i', { style: 'width:50%' })` produirait des barres invisibles.
- **Déterminisme.** La graine du générateur est fixe : deux calculs du même
  modèle donnent le même résultat, sinon l'affichage frémirait à chaque frappe.

## Déploiement

Il n'y en a pas. Écrire dans `public/` **est** le déploiement — Caddy sert les
fichiers du disque. Vérification :

```bash
curl -I https://optiboussole.fr
npm test              # moteur, ~2 s
npm run test:navigateur   # vrai Chrome contre la production, ~30 s + captures
```

Les captures d'écran atterrissent dans `/tmp/boussole-captures/`.

## Caddy

Configuration : `/etc/caddy/Caddyfile` (sauvegarde de l'originale en `.bak`).
Elle ajoute une CSP stricte (`default-src 'none'`, `script-src 'self'`), HSTS,
`nosniff`, `no-referrer`, et un `Cache-Control` court sur les fichiers statiques.

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
sudo systemctl status caddy
```

## Environnement

- VPS OVH, Ubuntu, 4 vCPU, 8 Go, 75 Go (5,4 Go utilisés).
- Node 22.23 (tests uniquement — rien ne tourne en service).
- Chrome de test installé par puppeteer dans `~/.cache/puppeteer/`. Ses
  bibliothèques système ont été installées via apt (`libatk1.0-0t64`,
  `libnss3`, `libgbm1`, `fonts-noto-core`, etc.) : sans elles il échoue avec
  `error while loading shared libraries`.
- Aucun service systemd ni pm2 propre au projet. `caddy.service` suffit.

## Ce qui n'existe pas (et pourquoi)

- **Pas de base de données.** Rien à stocker : le modèle du visiteur vit dans
  son `localStorage` et dans le fragment de l'URL qu'il partage.
- **Pas d'API, pas de backend.** Aucun appel de modèle de langage au runtime —
  ce serait payant, donc interdit. Toute la valeur du site doit venir du calcul,
  et c'est cette contrainte qui a donné sa forme au projet.
- **Pas d'outil de build.** Des modules ES servis tels quels. Le jour où une
  minification devient nécessaire, elle devra rester optionnelle : le dépôt doit
  continuer à fonctionner en copiant `public/` sur n'importe quel serveur de
  fichiers.
