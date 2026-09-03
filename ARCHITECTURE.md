# Architecture — optiboussole.fr

État au 3 septembre 2026 (fin de session 10).

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
├── public/                 ← racine servie par Caddy. GÉNÉRÉ en partie.
│   ├── index.html          ⚙ généré — accueil, modèle « louer ou acheter »
│   ├── <slug>.html         ⚙ générés — une page par modèle (10 fichiers)
│   ├── la-methode.html     ⚙ généré — la méthode expliquée
│   ├── sitemap.xml         ⚙ généré
│   ├── robots.txt          ⚙ généré
│   ├── 404.html            écrit à la main
│   ├── app.css             thème clair/sombre par variables CSS
│   ├── boussole.svg        favicon
│   └── js/
│       ├── rng.js          xoshiro128** déterministe, lois de probabilité
│       ├── lang.js         lexer + parseur du langage de modèle
│       ├── evaluer.js      évaluation vectorisée (Float64Array, N tirages)
│       ├── moteur.js       sensibilité, seuils de bascule, valeur de l'info, détail des calculs
│       ├── contre.js       le contre-argument : point de la frontière le plus proche
│       ├── modeles.js      bibliothèque des dix modèles de départ (plus la page blanche)
│       └── ui.js           rendu, phrases en français, partage par URL
├── outils/
│   ├── gabarit.js          le HTML de la page, en un seul endroit
│   ├── fond.js             le texte de fond de chaque page (compte / ignore / chiffres)
│   ├── methode.js          le contenu de /la-methode
│   └── pages.js            `npm run pages` → écrit les fichiers ci-dessus
├── test/
│   ├── run.js              434 assertions sur le moteur (Node, sans dépendance)
│   └── navigateur.js       185 vérifications dans un vrai Chrome + captures
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
AST { declarations, options, sortie, unite, seuil, objectifDeduit }
   │  evaluer.js : évaluation vectorisée, N = 20 000 tirages
   ▼
{ sources[], variables, options[], sortie, details }   « source » = un tirage aléatoire
   │  moteur.js : indices, seuils, EVPPI
   ▼
{ modeDecision, options{}, sortie{}, sources[{ part, valeurInfo, bascules }],
  detail{ calculs[{ p50, p05, p95, termes, origines }], options[], sortie } }
   │  ui.js
   ▼
des phrases en français

           ┌─ moteur.js : analyserRobustesse(r), passe séparée ─┐
           │  réévalue 7 fois avec « elargissement » croissant  │
           │  → à partir de quel facteur la conclusion tombe    │
           └───────────────────────────────────────────────────┘

           ┌─ contre.js : analyserContreArgument(r), passe séparée ──────┐
           │  cherche le point de la frontière de décision le plus       │
           │  proche des médianes, dans l'espace des écarts normalisés   │
           │  → quel jeu d'hypothèses donnerait la conclusion contraire  │
           └────────────────────────────────────────────────────────────┘
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
- **`minmax(0, 1fr)`, jamais `1fr`, dans la grille.** Le minimum d'une piste
  `1fr` est la largeur *min-content* de son contenu : une seule ligne non
  sécable (l'échelle d'élargissement) suffisait à élargir la grille, donc la
  page entière, sur mobile.
- **Une expression peut tenir sur plusieurs lignes.** Une ligne qui commence
  par un opérateur binaire continue la précédente, et le lexer n'émet pas de
  fin de ligne tant qu'une parenthèse est ouverte. Sans ça, le parseur tronquait
  les formules longues **en silence** — c'est arrivé à un modèle de la
  bibliothèque pendant deux sessions.
- **Les avertissements valent les tests.** `avertissements()` signale les fautes
  qui produisent un résultat plausible mais faux : `900-1150` lu comme une
  soustraction, variable définie et jamais utilisée, branches homonymes. Le
  second cas a trouvé le bug de troncature ci-dessus. Le test `run.js` vérifie
  qu'aucun modèle de la bibliothèque ne déclenche d'avertissement : c'est un
  filet gratuit, gardez-le.
- **Le texte de `/la-methode` est testé.** La page cite des chiffres — médiane
  200, part de 1,00 sur les rangs contre 0,27 sur les valeurs, seuil à 1 200,
  EVPI de 141 €. `run.js` les revérifie sur le moteur. Si vous changez le
  moteur et que ce groupe de tests casse, c'est la page qu'il faut mettre à
  jour, pas le test qu'il faut assouplir.
- **Les gros modèles passent en analyse allégée.** Au-delà de 20 sources, les
  statistiques et indices par hypothèse sont calculés sur un sous-échantillon
  régulier (~6 000 tirages) et la robustesse sur 4 000. Un tri de 20 000
  éléments par hypothèse coûtait plus cher que toute la simulation. Le seuil
  garantit que les modèles de la bibliothèque gardent le calcul complet.
- **Le contre-argument cherche sur *toutes* les hypothèses.** `contre.js`
  ramène chaque hypothèse à son unité d'écart (0 à la médiane, ±1,645 au bord
  de la fourchette) et cherche le point de la frontière le plus proche de
  l'origine — descente HL-RF amortie, filet d'un balayage à une hypothèse,
  puis retour sur la frontière le long du rayon. **N'épinglez pas une partie
  des hypothèses pour aller plus vite** : le site conclurait « rien ne renverse
  ce verdict » alors que c'est la recherche qu'on aurait bridée. Le coût est de
  1 à 4 ms parce qu'un point candidat est un « tirage » : une itération entière
  tient dans un seul `evaluerModele` de N = nombre d'hypothèses + 1.
- **Le scénario affiché est refait dans son propre sous-espace.** On ne montre
  pas six déplacements de trois millièmes ; or une solution de norme minimale
  tronquée ne franchit plus la frontière. La recherche est donc relancée en
  n'autorisant que les hypothèses qu'on va montrer. Le test qui réévalue le
  modèle au point rapporté et vérifie que la conclusion s'inverse vraiment est
  celui qui a trouvé ce défaut : **gardez-le**, l'affichage était plausible de
  bout en bout.
- **La section ne s'affiche que si aucune hypothèse ne bascule seule** (ou pour
  les deux cas particuliers : médianes déjà contraires, médianes pile sur la
  frontière). Quand un seuil de bascule répond déjà, redire la même chose avec
  cinq décimales de plus n'aiderait personne. β est d'ailleurs très proche de
  Φ⁻¹(probabilité de gagner) : il n'apporte pas de confiance, il apporte une
  adresse. C'est écrit sur `/la-methode`, ne le vendez pas autrement.
- **Le langage accepte ce qu'on écrit vraiment.** Symbole d'unité collé à un
  nombre (`900 €`, `3 %/an`), `±` et `+/-`, `entre … et …`, `si` comme
  opérande, `;` comme séparateur d'arguments *à l'intérieur des parenthèses*,
  espaces fine et insécable des milliers. Et une comparaison en ligne de
  résultat (`prix <= budget`) est lue comme un objectif — sans ça elle
  affichait « Résultat : 0 ». Chacune de ces tolérances a un test dans le
  groupe « Ce que le visiteur écrit vraiment » : elles viennent toutes d'une
  demi-heure passée à taper de travers, pas d'une relecture.
- **Le détail des calculs réévalue les termes d'une somme dans le même
  contexte**, après le calcul principal : les variables sont en cache, donc
  les valeurs sont celles du calcul. Un terme qui tire lui-même au sort
  (`5 + (1 à 3)`) créerait une nouvelle source avec d'autres tirages — les
  sommes qui en contiennent ne sont pas décomposées (`contientTirage`), et un
  test vérifie que `sources.length` ne bouge pas. L'option `detail: true` de
  `evaluerModele` n'est passée que par `analyserModele` : les balayages et le
  contre-argument n'en ont pas besoin.
- **L'origine de l'incertitude d'une valeur intermédiaire** (`originesCalculs`)
  est le même indice sur les rangs que pour le résultat, calculé sur un
  sous-échantillon de 4 000 tirages : sur 20 000, il coûtait autant que tout
  le reste. Au-delà de 20 hypothèses ou 30 valeurs, on s'abstient. Une source
  qui porte le nom de la valeur n'est pas listée comme son origine.
- **Une ligne de tableau est reconnue sur le texte brut**, avant l'analyse
  (`lignesBrutes` dans `analyser`), quel que soit le séparateur — `;`, `,`,
  tabulation. Le point-virgule est un séparateur d'instructions : sans cette
  reconnaissance, `loyer;900;1150` calculait 1150 en silence.
- **Un nom défini précédé d'une préposition est une unité** : `2300 net par
  mois` reste 2300 même si `mois` est une variable. Et `m²` est un seul
  identifiant parce que « ² » est de catégorie *nombre* en Unicode — sans
  ça, `150m²` serait 150 millions au carré. Un test le fixe.
- **Les opérateurs en toutes lettres** (`motOperateur`) — `fois`, `sur`,
  `plus`, `minus`, `times`, `divided by` — ne valent que si le mot n'est pas
  un nom défini et qu'un opérande le suit ; sinon c'est une unité
  (`2 fois par semaine`).
- **L'échelle d'une borne vaut pour l'autre** (`fourchette()` dans lang.js) :
  `15 à 30 %`, `1 à 3 millions`, `100 à 150k`. Le multiplicateur ne se
  propage que si les chiffres écrits restent dans l'ordre — `500 à 2k` va de
  500 à 2 000. `1000 ± 10 %` est relatif au centre.
- **Les mots après un nombre sont des unités** (`Parseur.unites`) : lus,
  ignorés, gardés sur le nœud, signalés en avertissement. Jamais un nom défini
  — `3 x` avec `x` défini renvoie à `3 * x`. Les noms définis sont collectés
  sur les jetons avant l'analyse, parce qu'une définition peut venir après.
- **Le résultat implicite est la dernière variable dont rien ne dépend**, pas
  la dernière définie : `total = a + b` écrit avant ses termes donne `total`.
- **Une branche à égalité avec la meilleure l'emporte aussi** dans `pGagne` :
  `option "C" = max(A, B)` était recommandée en gagnant « 0 % du temps ».
- **Le verdict en texte est lu dans la page** (`texteVerdict` dans ui.js),
  section par section, pas composé à part : il ne peut pas contenir un
  chiffre qui ne soit pas à l'écran. Le détail des calculs en est exclu.
- **La robustesse est une passe séparée.** `analyserRobustesse(r)` coûte ~200 ms
  et n'est lancée que 450 ms après l'arrêt de la frappe. La remettre dans
  `analyserModele` doublerait le délai de chaque frappe.

## Une adresse par modèle

`/`, `/isoler-ses-combles`, `/prix-du-kilometre`… Chaque page sert le même
JavaScript mais avec son propre `<title>`, sa description, son `<h1>`, son
canonique, et **le modèle déjà écrit dans le `<textarea>`** — donc lisible même
sans JavaScript. C'est ce qui rend le site trouvable : sans ça, tout vivait à la
racine et aucun sujet n'était indexable.

⚠️ **Ne modifiez jamais `public/index.html` ou `public/<slug>.html` à la main :
ils sont écrasés.** Le HTML vit dans `outils/gabarit.js`, les textes de
présentation dans le champ `question` de chaque modèle. Après toute
modification de l'un ou de l'autre :

```bash
npm run pages
```

Le modèle par défaut (`logement`) vit à la racine et n'a **pas** de seconde
adresse : ce serait la même page à deux endroits.

Côté client, `ui.js` lit `document.body.dataset.modele` pour savoir quel modèle
afficher. Les pastilles sont de vrais `<a href>` interceptés pour naviguer sans
rechargement (`pushState` + `popstate`) ; elles fonctionnent sans JavaScript.
Priorité au démarrage : fragment d'URL partagé > modèle de la page >
`localStorage` (sur l'accueil seulement) > défaut.

## Déploiement

Il n'y en a pas. Écrire dans `public/` **est** le déploiement — Caddy sert les
fichiers du disque. Vérification :

```bash
npm run pages             # si le gabarit ou les modèles ont changé
curl -I https://optiboussole.fr
npm test                  # moteur, ~2 s
npm run test:navigateur   # vrai Chrome contre la production, ~60 s + captures
```

Les captures d'écran atterrissent dans `/tmp/boussole-captures/`.

## Caddy

Configuration : `/etc/caddy/Caddyfile` (sauvegarde de l'originale en `.bak`).
Elle ajoute une CSP stricte (`default-src 'none'`, `script-src 'self'`), HSTS,
`nosniff`, `no-referrer`, et un `Cache-Control` court sur les fichiers statiques.

`/la-methode` est une page de contenu (pas d'atelier), générée par
`pageMethode()` depuis `outils/methode.js`. Le pied de page de toutes les pages
y renvoie. Huit chapitres. **Ses chiffres sont épinglés par des tests** : quand
ils cassent, c'est la page qu'on corrige, pas le test qu'on assouplit. Ils ont
déjà servi deux fois.

Chaque page de modèle porte, sous l'outil, un texte de fond en trois volets — ce que le
modèle compte, ce qu'il ignore, où trouver les chiffres — rédigé dans
`outils/fond.js` et rendu dans le HTML servi, donc lisible sans JavaScript.
Le balisage accepté y est minimal : `` `code` ``, `**gras**`, et un bloc
` ```…``` `. Toute clé de `MODELES` doit avoir son entrée dans `FOND` ; un test
le vérifie.

`try_files {path} {path}.html` donne les adresses sans extension. Il n'y a
**volontairement pas** de repli sur `/index.html` : une adresse inconnue doit
répondre 404 (via `handle_errors` → `404.html`), sinon tout le site répond 200
et l'indexation part en morceaux.

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
