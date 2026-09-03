# Architecture — optiboussole.fr

État au 3 septembre 2026 (fin de session 12).

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
│   ├── <slug>.html         ⚙ générés — une page par modèle (11 fichiers)
│   ├── la-methode.html     ⚙ généré — la méthode expliquée
│   ├── sitemap.xml         ⚙ généré
│   ├── robots.txt          ⚙ généré
│   ├── 404.html            ⚙ généré — la bande de modèles complète, et rien d'autre
│   ├── app.css             thème clair/sombre par variables CSS
│   ├── boussole.svg        favicon
│   └── js/
│       ├── rng.js          xoshiro128** déterministe, lois de probabilité
│       ├── lang.js         lexer + parseur du langage de modèle
│       ├── evaluer.js      évaluation vectorisée (Float64Array, N tirages)
│       ├── moteur.js       sensibilité, seuils, valeur de l'info, détail, asymétrie du pari
│       ├── contre.js       le contre-argument : point de la frontière le plus proche
│       ├── modeles.js      bibliothèque des onze modèles de départ (plus la page blanche)
│       └── ui.js           rendu, phrases en français, partage par URL
├── outils/
│   ├── gabarit.js          le HTML de la page, en un seul endroit
│   ├── fond.js             le texte de fond de chaque page (compte / ignore / chiffres)
│   ├── methode.js          le contenu de /la-methode
│   └── pages.js            `npm run pages` → écrit les fichiers ci-dessus
├── test/
│   ├── run.js              542 assertions sur le moteur (Node, sans dépendance)
│   └── navigateur.js       236 vérifications dans un vrai Chrome (axe compris) + captures
├── package.json            scripts npm ; `type: module`
├── JOURNAL.md              journal de bord daté
├── ARCHITECTURE.md         ce fichier
└── CLAUDE.md               le mandat
```

`node_modules/` est ignoré par Git. Les deux seules dépendances, `puppeteer` et
`axe-core`, ne servent qu'aux tests et sont déclarées dans `package.json` : un
`npm install` élague ce qui n'y est pas, c'est arrivé.

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
{ modeDecision, options{ …, pari, desaccord }, sortie{}, sources[{ part, valeurInfo, … }],
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
- **Une seule phrase est annoncée aux lecteurs d'écran par recalcul.** La zone
  de résultats n'est **pas** en `aria-live` : la page se redessine à chaque
  frappe, et une zone vivante aurait tout relu à chaque lettre. `annoncer()`
  dans ui.js copie le verdict et sa première phrase dans `#annonce` (hors
  écran), seulement s'ils ont changé. Les jauges sont `aria-hidden` : la
  valeur qu'elles illustrent est toujours écrite à côté. Chaque page a un
  `<main id="contenu">`, un `<h1>`, un lien d'évitement `.saut` ; axe-core
  passe sur quatre pages dans le test navigateur, et il doit rester à zéro.
- **La prose servie reçoit la typographie française** (`typographie()` dans
  gabarit.js) : espace fine insécable devant `%`, `:`, `;`, `?`, `!` et dans
  les guillemets, hors des `<code>` — ce qu'on y lit doit se recopier tel
  quel. ui.js fait la même chose de son côté pour les phrases dynamiques.
- **Le brouillon n'est enregistré que s'il diffère du modèle de bibliothèque.**
  `calculer()` écrit dans `localStorage` à chaque exécution, y compris au
  chargement d'une page et au clic d'une pastille : sans la garde, regarder un
  autre modèle écrasait ce que le visiteur avait écrit sur l'accueil. Et
  « Réinitialiser » efface le brouillon. Quatre vérifications navigateur
  tiennent le scénario.
- **Deux règles de décision cohabitent, et il faut les nommer.** La branche
  retenue (`options.recommande`) est celle de **meilleure espérance** ; la
  phrase du verdict raconte celle qui **gagne le plus souvent**
  (`options.frequent`). Sur tous les modèles de la bibliothèque c'est la même,
  et un test le vérifie. Quand elles diffèrent — une branche qui gagne rarement
  et gros — `options.desaccord` est vrai : le site affiche « Deux réponses »,
  nomme les deux titres sur les branches, et cesse de trancher. Avant, il
  affichait « À égalité », marquait « retenue » une branche perdant neuf fois
  sur dix, et donnait sa fréquence de victoire comme si c'était celle du
  vainqueur. **Ne remplacez pas l'espérance par la fréquence** pour faire
  disparaître le cas : la fréquence ignore les montants et, comparée deux à
  deux, elle peut tourner en rond sans désigner personne.
- **`options.pari` lit les deux versants de l'écart** entre la branche retenue
  et sa meilleure rivale : ce qu'on gagne quand on a raison, ce qu'on perd
  quand on a tort, et la queue des pertes. Tout se calcule par quantiles sur
  `options.ecart.tri`, déjà trié — coût nul. **La queue (`pertePire`) se lit
  parmi les seules simulations perdantes**, pas sur l'ensemble des tirages :
  prise sur l'ensemble, le cinquième centile tombait sur une perte minuscule
  dès qu'on se trompe à peine plus d'une fois sur vingt, et le « pire cas »
  s'affichait plus petit que le cas courant. Un test tient l'ordre.
- **Les grandeurs composées à la française sont refusées, pas ignorées.**
  `1m80`, `1km500`, `1m52` se lisaient « 1 » suivi d'une unité `m80` ignorée :
  faux d'un facteur deux, en silence. Il faut **au moins deux chiffres** après
  l'unité — sinon `60m2` (des mètres carrés, qui marche) serait pris pour une
  grandeur composée — et les lettres qui ne sont que des multiplicateurs
  d'échelle (`k`, `M`, `G`, `Md`) ou l'exposant scientifique en sont exclues.
- **`m` collé à un nombre reste le suffixe des millions, et le site le dit.**
  `2,4m` vaut 2 400 000 ; dans un texte français, c'est aussi la façon d'écrire
  2,4 mètres, et rien dans la ligne ne permet de trancher. Même traitement que
  `100.000` : on lit, et on avertit, en montrant `2,4 m` avec une espace.
  Devant un symbole monétaire (`2,4m€`), aucune ambiguïté : pas d'avertissement.
- **L'apostrophe entre deux lettres fait partie du mot.** `d’euros`, `l’an`,
  `prix_d’achat` butaient sur « caractère inattendu « ’ » », le pire message
  possible puisqu'on ne voit pas ce qu'il faut corriger. Entre chiffres, elle
  reste le séparateur de milliers suisse (`1'000'000`), traité dans la branche
  des nombres.
- **« une vingtaine » est un « environ » qui ne dit pas son nom.**
  `APPROXIMATIFS_NOMBRES` renvoie à la fourchette (« 16 à 24 ») au lieu de
  valoir 1 — « une » lu comme le nombre, « vingtaine » ignoré comme une unité.
  Un nom défini garde la priorité : `dizaine = 10` reste utilisable.
- **Un tirage discret ne se fige pas à sa médiane.** Pendant un balayage de
  seuil, les autres hypothèses sont figées à leur médiane. Pour une loi
  discrète, cette médiane vaut « l'événement n'arrive pas » : celle d'une pièce
  à 30 % vaut 0, celle d'un comptage d'années creuses de moyenne 0,36 aussi.
  Trois modèles en souffraient — les seuils de « ce projet sera-t-il prêt à
  temps ? » calculés sans l'incident hors planning, ceux de « réparer ou
  remplacer ? » en supposant la réparation acquise, et « freelance ou
  salarié » sans aucun seuil sur le taux journalier faute d'année creuse pour
  en créer un. Dans les trois cas, c'est le sujet même du modèle.
  `balayer()` ne les fige donc plus (`rejouee(s)` : `discret` vient de la loi,
  `binaire` couvre le reste). Chaque point de la grille est répliqué
  `REPLIQUES_DISCRET` fois, le tirage est rejoué **par quantile** sur une suite
  stratifiée déterministe (`uniformeDiscret` dans evaluer.js, décalée en nombre
  d'or d'un tirage à l'autre pour ne pas les corréler ; `poissonInverse` pour
  les comptages), et les branches sont moyennées par bloc. Le seuil porte alors
  sur l'espérance, qui est la grandeur que le verdict compare. **128
  répliques** : les seuils sont stables à partir de là (mesuré à 32, 64, 128,
  256), pour une vingtaine de millisecondes sur les modèles concernés. Les
  autres ne paient rien — `R = 1` et le code d'avant. ⚠️ Le rejeu **doit** être
  stratifié : en tirage ordinaire, la courbe moyennée tremble d'un point de
  grille à l'autre et le détecteur de changement de gagnant y voit trois seuils
  au lieu d'un (constaté sur `tjm`).
- **Les paramètres de loi sont ramenés dans leurs bornes sous élargissement,
  et seulement là.** `chances = 15 % à 35 %` élargi six fois sort de [0, 1] et
  `bernoulli` refusait : la passe de robustesse plantait sur le modèle d'appel
  d'offres. Sous élargissement, ce n'est plus le visiteur qui écrit le
  paramètre, c'est nous qui étirons ses fourchettes — on ramène, et « plus
  large » veut dire « certain ». Hors élargissement le refus reste, et il est
  utile : `bernoulli(120 %)` valait 1 à tous les coups, sans un mot. Le
  ramené **copie** le vecteur au lieu de l'écraser : c'est celui du cache de la
  variable, donc aussi celui que la source a enregistré.
- **Une hypothèse tout ou rien n'est pas une enquête à mener.** Elle peut
  dominer la valeur de l'information — sur « répondre à un appel d'offres ? »,
  `remporte` vaut quinze fois le reste — sans qu'on puisse rien y faire avant
  de décider. Envoyer le visiteur « passer son temps » dessus serait un mauvais
  conseil. `blocDecision` la nomme pour ce qu'elle est, puis désigne la
  meilleure hypothèse **non binaire** qui reste (`verifiable`). C'est la
  distinction entre incertitude réductible et irréductible, et elle est écrite
  sur `/la-methode`.
- **La robustesse est une passe séparée.** `analyserRobustesse(r)` coûte ~200 ms
  et n'est lancée que 450 ms après l'arrêt de la frappe. La remettre dans
  `analyserModele` doublerait le délai de chaque frappe.

## La bande de modèles

Douze pastilles (onze modèles plus la page blanche), mesurées sur la page
`/repondre-a-un-appel-d-offres` :

| largeur | lignes | le verdict commence à |
|---|---|---|
| 1440 px | 2 | 323 px |
| 1280 px | 2 | 323 px |
| 1100 px | 3 | 363 px |
| 760 px | 4 | 403 px |
| 390 px | 1 (défilante) | 291 px |

Chaque ligne supplémentaire coûte 40 px. Deux sessions de suite ont noté qu'il
« faudrait grouper » ; la mesure dit que non, pas encore : le verdict reste
au-dessus de la ligne de flottaison à toutes les largeurs, et **grouper
ajouterait des étiquettes, donc de la hauteur** — l'inverse du but. Réduire la
taille des pastilles ne change pas le nombre de lignes non plus : les points de
retour sont fixés par les titres longs, pas par la taille du texte (vérifié).
Le repère pour une prochaine session : regrouper le jour où le verdict passe
sous 500 px à 1100 px de large, soit vers seize pastilles.

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
y renvoie. Neuf chapitres. **Ses chiffres sont épinglés par des tests** : quand
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
