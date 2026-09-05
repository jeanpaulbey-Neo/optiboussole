# Architecture — optiboussole.fr

État au 4 septembre 2026 (fin de session 18).

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
│   ├── index.html          ⚙ généré — accueil, modèle « garder ou changer de voiture »
│   ├── <slug>.html         ⚙ générés — une page par modèle (12 fichiers)
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
│       ├── moteur.js       sensibilité, seuils, valeur de l'info, détail, asymétrie du
│       │                   pari, prix et règle de « aller savoir »
│       ├── contre.js       le contre-argument : point de la frontière le plus proche
│       ├── modeles.js      bibliothèque des douze modèles de départ (plus la page blanche)
│       ├── lexique.js     ce que chaque hypothèse veut dire, son unité, où la trouver
│       ├── reglages.js     le modèle vu comme un formulaire : lire les bornes, les réécrire
│       └── ui.js           rendu, phrases en français, partage par URL
├── outils/
│   ├── gabarit.js          le HTML de la page, en un seul endroit
│   ├── fond.js             le texte de fond de chaque page (compte / ignore / chiffres)
│   ├── methode.js          le contenu de /la-methode
│   └── pages.js            `npm run pages` → écrit les fichiers ci-dessus
├── test/
│   ├── run.js              710 assertions sur le moteur (Node, sans dépendance)
│   └── navigateur.js       343 vérifications dans un vrai Chrome (axe compris) + captures
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
AST { declarations, options, attentes, sortie, unite, seuil, objectifDeduit }
   │  evaluer.js : évaluation vectorisée, N = 20 000 tirages
   ▼
{ sources[], variables, options[], sortie, details }   « source » = un tirage aléatoire
   │  moteur.js : indices, seuils, EVPPI
   ▼
{ modeDecision, options{ …, pari, desaccord }, sortie{}, sources[{ part, valeurInfo, … }],
  attentes[{ gain, cout, net, segments, probleme }],
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

           ┌─ reglages.js : le même texte, dans l'autre sens ────────────┐
           │  lexer → les lignes « nom = a à b », avec la position       │
           │  exacte de chaque chiffre                                   │
           │  → des champs « basse / haute » ; un champ modifié réécrit  │
           │    la tranche des chiffres, et le texte se relit            │
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
- **Les positions des jetons sont un contrat.** `lexer()` pose `debut` sur
  chaque jeton et `chiffres` sur les nombres, et `extraireUnite()` neutralise la
  ligne d'unité *en gardant sa longueur*. `reglages.js` réécrit un nombre à sa
  position exacte dans le texte que le visiteur a sous les yeux : toute
  transformation de la source avant le lexer doit préserver les longueurs, ou
  le formulaire écrira au mauvais endroit — silencieusement.
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
- **Le modèle servi gagne ; le brouillon est proposé, jamais imposé.** Le
  travail en cours du visiteur est enregistré dans `localStorage` par
  `calculer()`, et seulement s'il diffère du modèle de bibliothèque — sans cette
  garde, regarder un autre modèle écrasait ce qu'il avait écrit. Au retour, il
  ne remplace plus la page : `proposerBrouillon()` affiche une barre
  « Le reprendre / L'oublier » au-dessus de l'éditeur, sur **la page où il a été
  écrit** (`garde.cle === cleCourante`). « Réinitialiser » l'efface pour de bon.
  La raison est dans le journal de la session 15 : une page dont le contenu
  dépend de l'historique du visiteur ne peut pas être une vitrine, et le lecteur
  revenu une seconde fois voyait le modèle qu'il avait laissé pendant que le
  journal affirmait en servir un autre. Huit vérifications navigateur tiennent
  le scénario.
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
- **Les multiplicateurs d'échelle au milieu d'un nombre sont refusés à part.**
  `1k500` vaut 1 500, mais la correction « écrivez 1,500 » proposée pour les
  autres grandeurs composées vaudrait 1,5 : c'est pour cette raison que `k`,
  `M`, `G` et `Md` avaient été exclus de la règle, et que `1k500` a valu **1**,
  en silence, jusqu'à la session 13. Ils ont maintenant leur propre message, qui
  propose le nombre entier — `« 1k500 » : écrivez 1500 — ou 1,5k`. Avec deux
  chiffres seulement (`1k50`, `2M500`), la notation a deux lectures : on refuse
  sans deviner. `3e45` reste la notation scientifique et n'est pas concerné.
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
- **« savoir X = coût » n'est pas un mot-clé du lexer.** Le motif est
  `savoir|attendre <nom> [= expression]`, reconnu dans `analyser` seulement si un
  identifiant suit immédiatement le mot : `savoir = 3` reste donc une variable
  ordinaire, et aucun modèle existant ne casse. Un article (`le`, `la`, `les`) se
  laisse glisser au milieu. Le coût est facultatif — sans lui, l'enquête est
  gratuite.
- **Le coût d'une attente est évalué en dernier, après les options, la sortie et
  le seuil.** Deux raisons, et les deux comptent : les identifiants de source du
  modèle ne bougent pas d'un pouce (les balayages en dépendent), et les tirages
  qu'une ligne de coût crée pour elle-même — `savoir x = 200 à 400` — sont
  marqués `horsDecision` et exclus de l'analyse. Sans ça, le prix de l'enquête
  apparaîtrait dans la liste des hypothèses du modèle, ce qu'il n'est pas.
- **Le prix et la règle se lisent sur le même découpage.** `politique()` reprend
  les bins de quantiles qui servent à l'EVPPI et retourne, tranche par tranche,
  la branche de meilleure espérance. Conséquence garantie par un test sur toute
  la bibliothèque : *gain > 0 si et seulement si la règle a plus d'une tranche*.
  Si vous calculez la règle avec `balayer()` à la place, les deux peuvent se
  contredire — le balayage fige les autres hypothèses à leur médiane, la règle
  moyenne sur elles. Sur « installer des panneaux solaires », l'écart se voit :
  seuil de bascule 1 179, frontière de la règle 1 158, et le texte de fond le dit.
- **Le prix affiché est celui d'une information *parfaite*.** C'est une borne
  haute : aucune enquête réelle ne fait mieux. Ne la vendez pas autrement — ce
  qu'elle permet de conclure, c'est « ça ne se paiera pas », jamais « ça se
  paiera à coup sûr ». La page `/la-methode` l'écrit, et le pied de la section
  aussi.
- **Un test rejoue le modèle de part et d'autre de la frontière annoncée** et
  vérifie que la branche gagnante est bien celle promise, les autres hypothèses
  laissées libres. C'est le même genre de filet que pour le contre-argument, et
  pour la même raison : une règle fausse est parfaitement plausible à l'œil.
- **Un tirage tout ou rien déclaré `savoir` cesse d'être « le hasard du
  modèle ».** `blocDecision` disait « aucune enquête ne le lèvera avant que vous
  ayez à choisir » — vrai pour l'issue d'un appel d'offres, faux pour un
  résultat d'analyse ou l'accord d'un financeur. Quand le visiteur écrit
  `savoir` dessus, il en sait plus que la règle : on le traite alors comme
  vérifiable. Sans ça le site affichait les deux phrases contradictoires à trois
  lignes d'écart.
- **`savoir` sans deux branches ne veut rien dire** et le site le dit en
  avertissement plutôt que de calculer quelque chose. Une information n'a de
  prix que par ce qu'elle change, et sans options il n'y a rien à changer.
- **Le lexique est la seule source d'unité d'une hypothèse.** `unité: €` décrit
  le **résultat** du modèle, pas ses hypothèses : dans un modèle en €/km,
  `km_an` est un nombre de kilomètres. Le site n'en déduisait donc aucune et
  affichait « au-dessus de 1 109 » — un nombre nu. `lexique.js` donne à chaque
  hypothèse des modèles de la bibliothèque son mot français, son unité et
  l'endroit où la chercher ; `uniteDe()` le consulte d'abord et retombe sur le
  pourcentage. **Un modèle écrit par le visiteur n'a pas de lexique, et rien ne
  s'affiche** : le site ne devine pas ce que veut dire un nom qu'il n'a pas
  écrit, et un test le vérifie.
- **`ou: null` veut dire « nulle part », et le site le dit.** C'est une réponse,
  pas une lacune : le prix futur de l'électricité est l'hypothèse la plus
  décisive du modèle solaire et personne ne peut vous la vendre. La phrase
  affichée en tire la conséquence utile — *il ne sert à rien d'attendre pour en
  savoir plus*. Un test tient la liste close des `null` avec leur justification,
  pour qu'on ne les mette pas par paresse.
- **Trois tests tiennent le lexique** : toute hypothèse de tout modèle a son
  entrée, aucune entrée n'est orpheline, et aucun chiffre ne s'y glisse. Le
  dernier compte : le site ne connaît **aucune** donnée, et ce fichier ne doit
  pas devenir la porte par laquelle il prétendrait en avoir.
- **La robustesse est une passe séparée.** `analyserRobustesse(r)` coûte ~200 ms
  et n'est lancée que 450 ms après l'arrêt de la frappe. La remettre dans
  `analyserModele` doublerait le délai de chaque frappe.

## Le modèle comme formulaire

C'est la face que le site présente maintenant à qui arrive : `#reglages`, un
formulaire écrit par `ui.js` à partir du texte du modèle, et le texte lui-même
replié dans un `<details id="texte-modele">`, à un clic.

Le lecteur extérieur, cinquième passage : *« pour me servir d'un des douze
modèles, je dois éditer du texte, alors que le lexique contient déjà le mot
français, l'unité et la source de chaque hypothèse — je m'attendais à six champs
"basse / haute" avec des libellés, pas à du code. »* Le site avait en effet tout
ce qu'il fallait ; il lui manquait les **positions**.

**Le principe qui tient tout : le texte reste la vérité.** Le formulaire n'a pas
d'état. Il se relit du texte à chaque calcul, chaque champ modifié réécrit le
texte, et le texte se relit. Rien ne peut diverger — et le lien de partage, la
barre de reprise, les pastilles, `Réinitialiser` et les avertissements
continuent de marcher sans rien savoir de lui. Toute réécriture de ce fichier
qui donnerait un état propre au formulaire est un bug en préparation.

`reglages.js` fait deux choses et rien d'autre :

- **lire** — une ligne est réglable si elle s'écrit `nom = nombre` ou
  `nom = nombre à nombre`, suivie au plus d'un mot d'unité. Une formule
  (`emprunt = prix - apport`), une loi écrite à la main (`bernoulli(8 %)`), une
  fourchette en `±`, une ligne `option`/`savoir`/`unité:` n'en sont pas. Sur les
  douze modèles, cela donne de 6 à 13 champs — c'est-à-dire toutes les lignes
  qu'on est censé remplacer, et aucune autre ;
- **réécrire** — la tranche des chiffres, **au caractère près**, et rien d'autre.
  Le commentaire en français, le symbole d'unité, le `%`, l'échelle `k` et les
  espaces qui alignent les colonnes sont ce que le site a mis quinze sessions à
  savoir lire ; un formulaire qui régénérerait la ligne les perdrait tous.
  Un test rejoue les 194 bornes de la bibliothèque et vérifie que la ligne
  réécrite est identique à un groupe de chiffres près.

### Ce dont il dépend, et qu'il ne faut pas casser

- **`lexer()` pose `debut` sur chaque jeton** (l'indice du premier caractère) et
  `chiffres` sur les nombres (la fin des chiffres, *avant* le `%`, le suffixe
  d'échelle et le symbole). Sans ces deux champs, un formulaire ne peut que
  réécrire la ligne entière.
- **`extraireUnite()` neutralise la ligne `unité: €` par des espaces de même
  longueur**, et non par une chaîne vide. Les numéros de ligne y survivaient
  déjà ; les positions, non — tout ce qui suivait se décalait de la longueur de
  la ligne effacée.
- **`reecrire()` ne fait rien si la valeur est inchangée.** Sans cette garde,
  poser le curseur dans un champ transformait `1,60` en `1,6` dans le modèle du
  visiteur, qui n'avait rien demandé.
- **Les positions sont relues à chaque frappe**, jamais gardées : dès qu'une
  borne change de longueur, celles qui suivent se décalent. Relire coûte une
  analyse lexicale sur quarante lignes, c'est-à-dire rien.
- **Le DOM n'est reconstruit que si la *forme* du formulaire change** (noms,
  nombre de bornes, intertitres). Sinon le champ perdrait le curseur à chaque
  frappe et on ne pourrait pas taper « 1400 » sans repartir de « 1 ». Le champ
  qui a le focus n'est jamais réécrit par le rendu.

### Les libellés, et d'où ils viennent

Rien ne s'invente, c'est la règle de la session 17 et elle vaut ici :

| ce qu'affiche le champ | d'où ça vient |
|---|---|
| le mot français | `lexique.js`, sinon le commentaire de fin de ligne |
| l'unité | `lexique.js`, sinon le symbole collé au nombre, sinon le mot posé après |
| l'échelle | le suffixe écrit : `prix = 250k` se règle en milliers, et l'étiquette dit `k€` |
| l'intertitre | le trait de section du modèle : `# --- Le crédit ---` |

L'intertitre demande une règle de reconnaissance, et c'est le **trait** : les
douze modèles s'ouvrent tous sur un paragraphe de commentaires qui explique le
sujet, et « que la vraie valeur soit dedans » aurait fait un titre absurde
au-dessus du premier champ. Un titre porte donc une suite d'au moins trois
tirets, signes égal ou étoiles — la décoration que les douze modèles emploient
déjà. Les seize intertitres ainsi récoltés (« Le crédit », « Ce qu'on ne sait
pas », « Vos chances, honnêtement ») sont du français écrit par l'auteur du
modèle : le site n'en fabrique aucun.

L'hypothèse que le verdict désigne — `r.sources[0]`, quand elle est notable —
porte la classe `.decisive` **dans le formulaire**. C'est le seul lien direct
entre la réponse et le geste qu'elle demande, et un test de navigateur vérifie
que le nom marqué est bien celui que le verdict nomme.

### Quand le formulaire s'efface

- **Aucun champ** (page blanche, modèle en cours d'écriture) : le panneau est
  masqué et le `<details>` du texte s'ouvre.
- **Modèle illisible** : `reglages()` rend une liste vide, le texte s'ouvre —
  c'est le seul endroit où la faute se corrige.
- **Sans JavaScript** : il n'y a pas de formulaire du tout. Le `<details>` est
  donc **servi ouvert**, et `ui.js` le replie au démarrage s'il a de quoi le
  remplacer. Le modèle reste lisible dans le HTML servi, comme avant.
- **La page blanche** (`pageBlanche: true` sur le modèle `vierge`) s'ouvre
  toujours sur son texte : tout ce qu'elle a à dire est dans ses commentaires,
  et on y vient pour écrire des lignes, pas pour régler les trois qui s'y
  trouvent. C'est déclaré dans `modeles.js`, pas deviné dans `ui.js`.

`positionnerTexte()` n'est appelé qu'au chargement et au changement de modèle :
au fil de la frappe, c'est au visiteur de décider ce qui est ouvert.

### Deux bornes, ou deux questions

Le formulaire demande la même chose de deux façons, au choix du visiteur
(`.reglages-mode`, deux boutons au-dessus des champs ; le choix vit dans
`localStorage` sous `boussole.champs` et suit le visiteur d'une page à l'autre).

| mode | ce que les deux champs demandent |
|---|---|
| **Deux bornes** (par défaut) | `basse` et `haute` : 9 chances sur 10 d'être entre |
| **Deux questions** | `d'habitude` et `exceptionnellement` : la valeur ordinaire, puis celle qu'on n'atteint qu'une fois sur dix |

Sixième passage du lecteur extérieur : *« donner deux bornes à 9 chances sur 10
est une chose que je ne sais pas faire — je saurais répondre à "combien l'an
dernier ?" et "et une mauvaise année ?" »*. C'est le seul geste que le site
demande à qui arrive, et il demandait le plus difficile des deux.

**Ce n'est pas un second format**, et c'est ce qui le rend possible : la
conversion est celle que le moteur fait déjà. Une fourchette entre deux nombres
positifs est lognormale, donc `habituel = √(bas × haut)` et les bornes sont en
miroir *en rapport* autour d'elle ; quand la fourchette traverse zéro, le moteur
travaille en écart et le miroir devient additif. `versQuestions()` et
`versBornes()` (dans `reglages.js`) ne font que cela, et un test rejoue les
86 fourchettes de la bibliothèque dans les deux sens.

Trois points qu'il ne faut pas casser :

- **`versBornes()` reçoit le support de la ligne**, il ne le déduit pas des deux
  nombres tapés. Sans lui, « -1 % à 4 % » (habituel 1,5 %) revenait
  « 0,56 % à 4 % » au premier aller-retour : deux nombres positifs à l'écran,
  et le négatif du texte perdu sans que rien ne le signale.
- **Seul le champ modifié est lu à l'écran** ; l'autre valeur se relit du texte,
  sans son arrondi d'affichage. Sinon l'arrondi entre dans le calcul de la borne
  d'en face à chaque frappe : sur « 2,9 % à 3,3 % », l'habituel affiché 3,09
  rendait 2,89 au lieu de 2,90.
- **La borne haute se réécrit avant la basse.** Elle est plus loin dans la ligne,
  et la changer ne déplace pas les positions de la basse ; dans l'autre sens,
  tout ce qui suit se décale et l'on écrit à côté.

### Le nom de variable ne s'affiche que si le texte est ouvert

`.reglage-nom` est `display: none` tant que `#texte-modele` est replié, et la
classe `.avec-noms` sur `#reglages` le rend. Sixième passage : *« sous chaque
libellé français il y a un nom de variable dont je n'ai pas l'usage »*. C'est une
adresse — la ligne où aller dans le modèle —, et une adresse ne sert à rien
quand il n'y a nulle part où aller. Texte ouvert, elle redevient le seul lien
entre le champ et sa ligne, et c'est elle que le verdict nomme.

## Ce que le site dit d'un nombre

Trois règles, toutes venues du sixième passage, et toutes de la même famille :
**un chiffre affiché doit se lire sans rien savoir de la méthode.**

### De quoi le nombre est le total — `resultat` dans `modeles.js`

*« "Garder l'actuelle −19,1 k€" en tête : je ne sais pas de quoi ce nombre est
le total. »* Le site ne peut pas le déduire : la réponse est répartie dans
quinze formules. Chaque modèle porte donc une phrase écrite à la main, comme le
lexique le fait pour les hypothèses. Elle s'affiche sous « Les branches », et
sous le résultat d'une estimation.

Deux gardes, parce qu'une phrase fausse serait pire que pas de phrase :

- les durées qu'elle cite sont **relues dans le texte** — `{horizon}`,
  `{duree_restante}` — donc un visiteur qui compare sur douze ans lit douze ;
- elle disparaît dès que le **squelette** du modèle change, c'est-à-dire dès
  qu'on touche à autre chose qu'un chiffre d'hypothèse (`squelette()` compare
  toutes les lignes que `reglages()` ne reconnaît pas). Elle décrit des
  formules : elle vaut tant que les formules sont là.

Un test tient les deux : les noms cités existent comme valeurs fermes du modèle,
et un modèle qui a un `horizon` ne l'écrit pas en chiffres dans sa phrase.

### La fourchette est rendue telle qu'elle a été écrite

*« j'ai saisi 400 et 1800, l'écran me répond "398 → 1 794, médiane 845" — trois
choses que je ne comprends pas, au même endroit. »* 398 et 1 794 étaient les
quantiles empiriques de vingt mille tirages : le bruit de la méthode, rendu à
qui venait de taper les vraies bornes. `phrasePlage()` relit les bornes du texte
(`bornesEcrites`, la même lecture que le formulaire) et écrit une phrase :

> Vous avez écrit : 9 chances sur 10 de 400 à 1 800 €/an. La moitié du temps
> sous 845 €/an — et non 1 100 €/an, le milieu des deux bornes : une fourchette
> entre deux nombres positifs s'étale vers le haut.

La dernière clause n'apparaît que sur la première hypothèse de la liste, et
seulement quand l'écart se voit : répétée sous chacune, elle devient une litanie
qu'on cesse de lire. C'est le principe de départ du site, et il vivait sur deux
pages de fond que personne n'atteint avant d'avoir lu ses résultats.

### Une liste d'enquêtes n'est pas un classement

*« on me liste cinq chiffres à aller vérifier alors qu'un seul compte, les quatre
autres valent ensemble un quart du premier. »* Une hypothèse garde son bloc si
elle vaut au moins `PART_SECOND` (un quart) de ce que vaut la tête ; les autres
tiennent dans une phrase qui dit ce qu'elles valent et quand y revenir. Sur
l'accueil, cinq blocs sont devenus un.

Deux gardes : la coupe ne s'applique **qu'en mode décision** — « d'où vient
l'incertitude » répartit cent pour cent d'un écart, et une part de 12 % y est une
réponse, pas une tâche — et **seulement si la tête elle-même compte**, sinon
« loin derrière » se dirait derrière un chiffre nul. La phrase compare la mieux
placée des secondaires à la tête, **jamais leur total** : la valeur d'une
information ne s'additionne pas.

## La bande de modèles

**Elle est passée sous la réponse (session 15)**, à la fin de l'atelier, sous
une phrase (`.autres-intro`) qui dit ce qu'on y choisit. Le lecteur extérieur :
« je vois treize pastilles avant d'avoir compris ce que je choisis ». Le tableau
ci-dessous mesurait le coût en hauteur d'une bande *en tête de page* ; il n'a
plus cours, et il est gardé parce qu'il documente ce que la mesure avait
tranché, et que le raisonnement — « grouper ajouterait des étiquettes, donc de
la hauteur » — resservira si la bande remonte un jour. Le gain observé après
déplacement, à 390 px : le verdict commence à 246 px sur une page de modèle
(contre 270 px avec la bande au-dessus, et sans la ligne de flottaison chargée
d'un choix qu'on ne peut pas encore faire) et à 540 px sur l'accueil, qui porte
en plus son exemple travaillé.

Treize pastilles (douze modèles plus la page blanche), mesurées sur la page
`/installer-des-panneaux-solaires`, **du temps où la bande était en tête** :

| largeur | lignes | le verdict commence à |
|---|---|---|
| 1440 px | 3 | 363 px |
| 1280 px | 3 | 363 px |
| 1100 px | 3 | 363 px |
| 760 px | 4 | 403 px |
| 390 px | 1 (défilante) | 270 px |

Chaque ligne supplémentaire coûte 40 px. Deux sessions de suite ont noté qu'il
« faudrait grouper » ; la mesure dit que non, pas encore : le verdict reste
au-dessus de la ligne de flottaison à toutes les largeurs, et **grouper
ajouterait des étiquettes, donc de la hauteur** — l'inverse du but. Réduire la
taille des pastilles ne change pas le nombre de lignes non plus : les points de
retour sont fixés par les titres longs, pas par la taille du texte (vérifié).
Le repère pour une prochaine session : regrouper le jour où le verdict passe
sous 500 px à 1100 px de large. La treizième pastille a coûté une ligne à 1440 et
1280 px sans rien coûter ailleurs — le titre « Installer des panneaux solaires »
est long. Il reste 137 px de marge, soit trois lignes : vers seize pastilles.

## La porte d'entrée

Le modèle qui s'ouvre à la racine est `MODELE_PAR_DEFAUT`, dans `modeles.js`.
C'est **la première chose qu'un inconnu lit du site**, et pendant treize
sessions c'était « louer ou acheter », dont le verdict est « À égalité » : la
vitrine annonçait qu'elle n'avait rien à dire. Le premier visiteur extérieur l'a
trouvée « abrupte et peu claire » (session 14, voir le journal).

C'est maintenant `voiture` — une branche nommée, un seuil dans son unité, et une
chose à aller chercher qui ne coûte rien. Les critères, pour une prochaine
session qui voudrait en changer, et qu'un test vérifie :

- le verdict **nomme une branche** — ni « À égalité », ni « Deux réponses » ;
- une hypothèse décide, avec un **seuil** et une **adresse** dans le lexique ;
- le sujet ne demande **aucun prérequis** et la mise reste modeste.

**L'accueil se nomme par sa question, comme n'importe quelle page de modèle**
(session 15). Son `<h1>` est le titre du modèle servi — « Garder ou changer de
voiture » — et non « Boussole », qui reste en petit au-dessus, avec la rose des
vents. Le sous-titre est le champ `question` du modèle, le même texte que sur sa
page dédiée. C'est le second retour du lecteur extérieur qui a tranché ceci :
« la page *Isoler ses combles* est claire et je saurais quoi en faire, l'accueil
non ». La seule différence entre les deux pages était là — un nom de marque et
une phrase définie par la négative d'un côté, une question nommée de l'autre.
Une conséquence : le gabarit produit le même en-tête partout, et rien dans
l'accueil n'est plus écrit à la main sauf son exemple travaillé.

L'ouverture de l'accueil (`gabarit.js`) est cet exemple travaillé, qui reprend
les chiffres du modèle servi : seuil 1 109 €/an, 631 € à gagner, fourchette 400
à 1 800. Sa seconde moitié dit ce qu'il faut faire pour s'en servir, et depuis
la session 18 c'est « remplacez-les dans le formulaire », pas « il suffit de
remplacer des nombres » — voir *Le modèle comme formulaire*. **Ils sont épinglés par des tests** : s'ils divergent, c'est la page
qu'on corrige. Changer de modèle d'accueil veut donc dire réécrire cette
ouverture — c'est voulu, elle ne doit jamais décrire autre chose que ce qui
tourne en dessous. Elle ne le peut d'ailleurs plus : `ajusterOuverture()` est
appelée à **chaque** calcul et compare le texte affiché à la source servie.
C'était auparavant une suite d'appels bien placés, et il en manquait un.

**La réponse occupe la colonne de gauche, l'éditeur celle de droite** (54/46), et
c'est l'ordre du DOM qui le porte : la tabulation et les lecteurs d'écran
suivent la même route que l'œil. Le principe — « la réponse passe avant l'outil
qui la produit » — était écrit dans `app.css` depuis la session 6, mais dans une
règle `@media (max-width: 940px)` : au-delà, le code occupait la moitié gauche,
c'est-à-dire la place qu'on lit en premier. Il n'y avait aucune raison à cette
frontière, seulement l'ordre dans lequel le HTML avait été écrit.

**Le texte de l'accueil a un budget, et c'est un test.** Le troisième passage
du lecteur extérieur (session 16) a compté ce que la page lui mettait sous les
yeux : « environ 11 800 caractères de texte : démo, référence du langage, lois,
indicateurs, limites, tout au même endroit ». Le chiffre était exact. Trois
quarts venaient de deux blocs recopiés sur les quinze pages du site — le
dépliant d'aide, dont six sections répétaient mot pour mot six chapitres de
`/la-methode`. L'accueil tient maintenant sous **7 500 caractères** de texte
servi et une page de modèle sous **9 000** ; `test/run.js` le vérifie. Ce n'est
pas une règle esthétique : c'est ce qui oblige une prochaine session à en
déplacer une pour en ajouter une.

Le budget est plus large sur une page de modèle **exprès**. Ce qu'elle porte en
plus, ce sont les trois colonnes *ce que ce modèle compte / ce qu'il ignore / où
trouver vos chiffres*, que le même lecteur a désignées comme ce qu'il avait
trouvé de plus utile sur le site. Elles sont d'ailleurs passées **devant** la
bande de modèles : on ne range pas la meilleure chose de la page derrière treize
pastilles qui invitent à aller ailleurs.

**La phrase qui dit à quoi sert le site est sur la ligne de la marque**
(`.marque-quoi`), donc lue avant le titre et bien avant l'éditeur. Elle vivait
sous les quarante lignes de code, en introduction de la bande de modèles, où le
même lecteur a constaté qu'elle arrivait trop tard. Un test vérifie qu'elle
précède le `<textarea>` dans le HTML servi.

**Elle dit maintenant ce que le site fait, et non ce qu'il ne fait pas.** Elle
se lisait « Boussole *ne dit pas quoi décider* : elle dit ce qu'il faut aller
vérifier » ; elle se lit « Boussole *dit lequel de vos chiffres décide*, et ce
que ça vaut d'aller le chercher ». Cinquième passage du lecteur extérieur :
« le site se présente en disant ce qu'il ne fait pas, quatre fois avant que je
voie ce qu'il fait ». Les quatre étaient cette phrase-là, « il n'y a rien à
apprendre pour ça » et « rien n'est envoyé nulle part » dans l'ouverture, et la
description servie aux moteurs et aux aperçus de lien. Les quatre disent
maintenant la même chose à l'endroit, et la vie privée est restée où elle se
prouve par l'absence : le pied de page. **La règle pour la suite : au-dessus de
la réponse, on n'écrit pas ce que le site ne fait pas.**

Changer `MODELE_PAR_DEFAUT` déplace deux adresses : l'ancien défaut gagne son
slug, le nouveau le perd. `npm run pages` n'efface pas l'ancien fichier —
**supprimez-le à la main**, sinon il sert une copie de l'accueil sous une autre
adresse et l'indexation se dédouble. Et ajoutez une redirection dans le
Caddyfile, l'ancienne adresse ayant pu être partagée :

```
redir /garder-ou-changer-de-voiture / permanent
```

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

Le modèle par défaut (`voiture` depuis la session 14, voir `MODELE_PAR_DEFAUT`)
vit à la racine et n'a **pas** de seconde adresse : ce serait la même page à
deux endroits.

Côté client, `ui.js` lit `document.body.dataset.modele` pour savoir quel modèle
afficher. Les pastilles sont de vrais `<a href>` interceptés pour naviguer sans
rechargement (`pushState` + `popstate`) ; elles fonctionnent sans JavaScript.
Priorité au démarrage : fragment d'URL partagé > modèle de la page > défaut.
Le `localStorage` n'y figure plus : il alimente la barre de reprise, pas le
contenu servi.

## Ce que le site sait d'un modèle qu'il n'a pas écrit

`lexique.js` donne à chacune des 91 hypothèses de la bibliothèque son mot
français, son unité et son adresse. Il est écrit à la main, et un test vérifie
qu'aucune hypothèse n'y manque.

Il ne peut rien dire du modèle qu'un visiteur écrit — et la session 14 en avait
fait un principe : *« un modèle écrit par le visiteur n'en a pas, et rien ne
s'affiche : le site ne devine pas ce que veut dire un nom qu'il n'a pas
écrit »*. C'était juste, et ce n'était pas la question. Le site perdait le
français **au moment précis où quelqu'un se sert de l'outil pour lui-même**, ce
qu'un lecteur extérieur a fini par nommer (session 17) : « quand j'écris mon
propre modèle, je n'ai plus que des identifiants sans unité ».

Il n'y a rien à deviner. Deux choses sont déjà écrites dans le texte du modèle,
et le site les jetait toutes les deux :

- **le commentaire de fin de ligne** est une glose, en français, par l'auteur :
  `reparations = 400 à 1800   # par an, et ça monte avec l'âge`. Gardé par le
  lexer dans `ast.commentaires`, par numéro de ligne. Un commentaire **seul** sur
  sa ligne est un titre de section et ne glose rien — sans cette règle,
  `# --- Garder l'actuelle ---` devenait la définition de la ligne suivante ;
- **le symbole ou le mot d'unité posé après un nombre** : `900 €`, `1,60 €/L`,
  `3 ans`. Le lexer connaissait déjà l'emplacement exact du symbole décoratif et
  ne le conservait pas ; le parseur collectait déjà les mots dans `n.unites` pour
  le seul plaisir d'avertir qu'il les ignorait.

`moteur.js` en fait une glose par ligne, reportée sur chaque source. `ui.js`
consulte **le lexique d'abord** — écrit à la main, relu, et seul à dire *où*
trouver le chiffre — puis le modèle. C'est ce même ordre qui étiquette les
champs du formulaire (session 18). Le site n'invente toujours rien : il rend
au visiteur ce qu'il a écrit, à l'endroit où ça sert.

**Ce que cela n'autorise pas** : deviner une unité à partir d'un nom
(`prix_*` → €), ni une glose à partir d'un identifiant. La règle reste que le
site n'affiche que ce que quelqu'un a écrit — l'auteur du modèle ou celui du
lexique.

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
`nosniff`, `no-referrer`, et `Cache-Control: no-cache` sur **tout**.

**Le cache est le point le plus coûteux de cette configuration, et il a déjà
menti une fois.** Ici, déployer, c'est écrire un fichier dans `public/` : aucune
URL ne porte de version, donc rien n'invalide jamais une copie gardée par un
navigateur. Sans en-tête, un navigateur applique sa *fraîcheur heuristique* — un
dixième de l'âge du fichier — et sert sa copie sans rien demander au serveur. Un
lecteur est ainsi revenu, session 16, sur une page d'accueil vieille de deux
sessions, bande de modèles comprise : aucune des corrections faites pour lui
n'existait à son écran, alors que le dépôt et le disque étaient justes.

`no-cache` ne veut pas dire « ne garde rien » : il veut dire « revalide avant de
servir ». Avec les ETag que Caddy calcule, une revalidation inchangée coûte un
304 de quelques octets. C'est le seul en-tête correct pour un site sans URL
versionnées, et **quatre tests navigateur le vérifient en production** — l'un
d'eux contrôle qu'un 304 revient bien, faute de quoi chaque navigation
retéléchargerait 250 ko de JavaScript.

Si un jour le trafic justifie un vrai cache, la condition est de versionner les
URL (`/js/ui.js?v=<empreinte>`), pas de rallonger `max-age` : c'est exactement
la manœuvre qui a produit le défaut ci-dessus.

`/la-methode` est une page de contenu (pas d'atelier), générée par
`pageMethode()` depuis `outils/methode.js`. Le pied de page de toutes les pages
y renvoie. Dix chapitres. **Ses chiffres sont épinglés par des tests** : quand
ils cassent, c'est la page qu'on corrige, pas le test qu'on assouplit. Ils ont
déjà servi deux fois.

Chaque page de modèle porte, sous l'outil, un texte de fond en trois volets — ce que le
modèle compte, ce qu'il ignore, où trouver les chiffres — rédigé dans
`outils/fond.js` et rendu dans le HTML servi, donc lisible sans JavaScript.
Le balisage accepté y est minimal : `` `code` ``, `**gras**`, et un bloc
` ```…``` `. Toute clé de `MODELES` doit avoir son entrée dans `FOND` ; un test
le vérifie.

`/un-cas` est la même décision que l'accueil, racontée du devis du garage au
tiroir à factures : ce qu'on écrit, ce que le site répond, ce qu'on va chercher,
ce que ça change, et ce qui restait hors du modèle. Elle existe depuis la
session 17 — « je ne trouve nulle part de cas d'usage raconté du début à la
fin » — et **tous ses chiffres sont épinglés par des tests**, y compris ceux de
l'issue qu'elle ne raconte pas (si le tiroir avait donné 900 à 1 600, le verdict
basculait à 58 %, donc « à égalité »). Écrire cette seconde issue n'est pas une
précaution de style : sans elle, la page serait une démonstration flatteuse.

`/le-langage` est la référence de la syntaxe, générée par `pageLangage()`.
Elle existe depuis la session 16 : le même contenu était recopié en entier dans
le dépliant d'aide de chacune des quinze pages, où il pesait le tiers du texte
de l'accueil et n'était lu par personne. Le dépliant n'en garde que le tableau
des dix lignes, celui qu'on relit en écrivant ; le reste — ce que le lexer
accepte, les fonctions, la loi qu'une fourchette produit — est sur la page, et
gagne au passage une adresse indexable pour qui cherche « comment écrire une
fourchette ». **Règle** : ce dépliant sert à *écrire* une ligne ; ce qu'il faut
pour *comprendre* la réponse est sur `/la-methode` ; les deux ont un lien.

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

- **Presque pas de graphiques, et c'est une position, pas un oubli.** Quinze
  sessions de journal portent la mention « toujours pas de graphiques » : le
  site tient parce qu'il répond en français et non en tableau de bord, et une
  courbe qui illustre une phrase déjà écrite ne mérite pas les pixels qu'elle
  prend. Il y en a exactement deux, et chacune montre quelque chose qu'aucune
  phrase ne dit aussi bien :
  - **en mode estimation**, la densité du résultat, avec sa fourchette à 90 %,
    sa médiane et le seuil visé (`courbe()`) ;
  - **en mode décision**, la distribution de l'écart entre la branche retenue et
    sa meilleure rivale, que zéro coupe en deux (`courbePari()`). Les deux aires
    *sont* les deux fréquences écrites au-dessus, et leur étalement est l'enjeu :
    une branche qui gagne souvent et petit puis perd rarement et gros se voit
    d'un coup d'œil et ne se lit dans aucun des chiffres. Elle n'est pas dessinée
    quand zéro tombe hors du cadre — il n'y aurait pas de partage à montrer, et
    le dessin mentirait par cadrage ;
  - **sous chaque hypothèse**, sa fourchette et le seuil qui la coupe
    (`bandeFourchette()`, session 17). Densité, rectangle pâle sur la fourchette
    à 90 %, repère de médiane, trait du seuil, et l'aire au-delà en ocre.
  La règle pour la suite : **un dessin doit porter une information que le texte
  ne porte pas**, et la page doit rester juste sans lui. Les trois sont sous la
  phrase qu'ils montrent, jamais à sa place.

  **Et une règle de justesse, apprise deux fois.** La bande de fourchette a
  d'abord été une barre pleine sur une échelle de valeurs, la portion au-delà du
  seuil en couleur. C'était joli et faux : sur « 398 à 1 794 », le seuil de 1 109
  tombe à 51 % de la longueur alors qu'il n'est franchi que 3 fois sur 10. *Une
  surface colorée est lue comme une fréquence* — donc elle doit en être une, ce
  qui impose une densité et une coupure interpolée à l'aplomb du trait, jamais au
  bord d'une barre d'histogramme. C'est exactement la précaution que
  `courbePari()` avait prise la session d'avant, et que j'ai dû réapprendre en
  regardant une capture d'écran.
- **Pas de base de données.** Rien à stocker : le modèle du visiteur vit dans
  son `localStorage` et dans le fragment de l'URL qu'il partage.
- **Pas d'API, pas de backend.** Aucun appel de modèle de langage au runtime —
  ce serait payant, donc interdit. Toute la valeur du site doit venir du calcul,
  et c'est cette contrainte qui a donné sa forme au projet.
- **Pas d'outil de build.** Des modules ES servis tels quels. Le jour où une
  minification devient nécessaire, elle devra rester optionnelle : le dépôt doit
  continuer à fonctionner en copiant `public/` sur n'importe quel serveur de
  fichiers.
