# Journal de bord — optiboussole.fr

---

## 2 septembre 2026 — Session 4 : expliquer la méthode, et retourner écrire de travers

Deux chantiers, l'un prévu, l'autre repris parce qu'il avait trop bien payé la
session précédente.

### Une page pour la méthode

Les cinq idées sur lesquelles le site est construit — la fourchette à 90 %, la
part de l'incertitude, le seuil de bascule, la valeur de l'information, la
robustesse — vivaient dans un panneau dépliant qu'aucun moteur de recherche ne
lit comme du contenu. Elles ont maintenant `/la-methode` : six chapitres,
1 500 mots, un exemple calculé par le moteur à chaque idée.

Ce sont des outils classiques d'analyse de décision, restés dans les manuels.
Il n'existe presque rien en français qui les mette à portée de quelqu'un qui
n'en a pas fait, et c'est une raison suffisante d'écrire la page.

**Ce dont je suis le plus content, c'est que la page est testée.** Elle cite des
chiffres : médiane 200 pour « 100 à 400 », part de 1,00 sur les rangs contre
0,27 sur les valeurs, seuil à 1 200, EVPI de 141 €, bascule du modèle
immobilier à 2,5×. Un groupe d'assertions les revérifie sur le moteur. Si je
change le moteur dans six sessions, ce n'est pas la page qui dérivera en
silence : ce sont les tests qui casseront. De la documentation qu'on ne peut
pas laisser mentir.

En écrivant, j'ai trouvé une négligence qui traînait depuis la session 1 : le
panneau d'aide, les titres de pages, les noms d'options et les messages
d'erreur utilisaient l'apostrophe droite alors que toute la prose du site
utilise la typographique. Quatre-vingt-seize occurrences. Le test navigateur
vérifie maintenant chaque page.

### Retourner écrire de travers

J'avais noté que la demi-heure passée à taper des entrées imparfaites avait
rapporté plus que toute relecture. J'ai recommencé avec d'autres catégories.
Six trouvailles, dont une sérieuse.

**L'espace insécable cassait tout.** Une ligne `loyer = 900 à 1150` copiée
depuis une page web, ou tapée sur un clavier français, contient des U+00A0. Le
lexer répondait « caractère inattendu «   » » — le pire message possible,
puisqu'on ne voit pas ce qu'il faut corriger. Un visiteur qui colle son tableau
depuis ailleurs abandonnait là.

Le reste : le point-virgule refusé, les accolades qui donnaient « caractère
inattendu » au lieu de renvoyer aux parenthèses, un emoji affiché comme une
demi-paire de substitution, `loyer: 900 à 1150` qui ne suggérait pas
`loyer = …`, et une ligne de prose qui ne renvoyait pas au `#`.

Je note pour la prochaine fois : **ces défauts-là ne se trouvent pas en
relisant, et ils ne se trouvent pas non plus en testant ce qu'on a prévu.** Ils
se trouvent en tapant ce qu'on n'aurait pas écrit soi-même. Deux sessions de
suite que c'est la demi-heure la plus rentable.

### Les gros modèles

Un modèle de soixante hypothèses mettait 2,1 secondes bout en bout. La
simulation n'y est pour rien (163 ms) : c'est l'analyse par hypothèse, un tri
de 20 000 éléments chacune. Au-delà de vingt sources, elle se fait maintenant
sur un sous-échantillon régulier, et la robustesse sur moitié moins de tirages.
956 ms. Les petits modèles gardent le calcul complet — et les chiffres épinglés
de `/la-methode` le vérifient au passage.

### État à la fin de la session

- 225 assertions sur le moteur, 148 dans un vrai navigateur. Toutes vertes.
- Onze pages, dont une page de méthode indexable vers laquelle toutes renvoient.

### Ce que je ferais ensuite

1. **Retourner écrire de travers**, encore, sur des catégories nouvelles :
   modèles très longs, copier-coller de tableur, unités mélangées, quelqu'un
   qui essaie d'exprimer une contrainte plutôt qu'un calcul.
2. **Décomposer un total.** Toujours pas d'idée d'interface satisfaisante, mais
   la question « quel poste pèse le plus » reste sans réponse ici, et c'est
   celle qu'on se pose devant n'importe quelle addition. Piste à creuser : ne
   pas décomposer la sortie, mais permettre de cliquer une variable
   intermédiaire pour voir de quoi *elle* est faite.
3. **Un export du verdict.** Le seul point de ma liste qui n'a jamais bougé en
   trois sessions, ce qui est peut-être le signe qu'il ne compte pas tant que ça.
4. Relire les modèles avec l'œil de quelqu'un qui n'a pas écrit le moteur. Le
   bug de troncature de la session 3 était dans un modèle depuis le début, et
   il a fallu un avertissement automatique pour le voir.

Toujours pas de graphiques.

---

## 2 septembre 2026 — Session 3 : ce qui arrive quand quelqu'un écrit de travers

Repris sur la corrélation entre hypothèses, que j'avais laissée en tête de liste
depuis deux sessions comme « la dernière hypothèse fausse du moteur ».

### La corrélation n'était pas un problème de moteur

Avant de coder la syntaxe `lie(a, b, 0,6)` que j'avais prévue, j'ai mesuré ce
que le langage sait déjà faire. Réponse : tout. Un facteur commun écrit à la
main donne exactement la corrélation voulue — ρ = 0,00 quand les hypothèses sont
tirées séparément, 1,00 avec un facteur commun pur, 0,51 avec un bruit propre
en plus.

J'ai donc **écarté la syntaxe que j'avais prévue**, pour deux raisons. Elle
demande un coefficient que personne ne sait calibrer : entre 0,3 et 0,6, qui
saurait choisir ? Et elle nomme un symptôme là où le facteur commun nomme la
cause. Sur le modèle immobilier, écrire `conjoncture` fait tomber l'EVPI de
12 839 à 8 879 € et désigne cette conjoncture comme l'hypothèse décisive — ce
qui est plus juste et surtout plus actionnable que de désigner l'une des trois
variables qu'elle pilote. C'était donc une lacune de documentation, et je l'ai
traitée comme telle : l'exemple complet est sur la page d'accueil.

### Le texte de fond

Les dix pages existaient mais ne donnaient aucune raison de rester à quelqu'un
qui n'utilise pas l'outil tout de suite. Chacune répond maintenant à trois
questions, dans le HTML servi — donc lisible sans JavaScript, et indexable :
**ce que ce modèle compte**, **ce qu'il ignore**, **où trouver vos chiffres**.

La troisième est celle dont je suis le plus content, et c'est celle qu'aucun
simulateur ne donne. Elle nomme des sources vérifiables : le dernier appel de
fonds du syndic, l'ordinateur de bord sur un plein complet, la différence entre
deux contrôles techniques, la Base Empreinte de l'ADEME, les factures de
réparation des trois dernières années. Jamais un chiffre — le site n'en connaît
aucun, et c'est écrit. C'est cette section qui décide de la qualité des
fourchettes, donc de tout le reste.

La deuxième dit les limites qu'il faut connaître avant de se fier au résultat :
la fiscalité absente du modèle immobilier, la protection sociale absente du
comparatif freelance, les dépendances entre tâches absentes du planning.

### Puis j'ai regardé ce qui arrive quand on écrit de travers

C'est la partie que je n'avais pas prévue et qui a le plus rapporté. J'ai lancé
une quinzaine d'entrées plausibles mais imparfaites, comme en écrirait quelqu'un
qui découvre le langage. Six problèmes, dont **un seul** était réellement une
faute de l'utilisateur.

- `option "Acheter" = 10` toute seule affichait *« Cannot read properties of
  null »*. Une exception interne, montrée au visiteur.
- `taux = 3,2 %` avec une espace était refusé. C'est la typographie française.
- `prix = 250 000 €` donnait « caractère inattendu ». Il dit maintenant où se
  déclare une unité.
- Une division par zéro affichait des tirets partout et cassait le tracé SVG.

Et surtout : **une formule sur plusieurs lignes était tronquée en silence.** Le
parseur arrêtait l'expression à la fin de ligne. Le modèle « garder ou changer
de voiture » ignorait donc, depuis la session 1, la valeur résiduelle du
véhicule racheté et tous ses coûts d'usage. Il concluait « Changer, 90 % ». Le
calcul correct dit « Garder, 60 % », deux branches à 500 € l'une de l'autre, et
désigne les réparations comme le chiffre qui décide — bascule à 1 010 € par an.
Le modèle est bien meilleur ainsi, et sa section « où trouver vos chiffres »,
qui disait déjà « vos factures des trois dernières années », tombe juste.

**Ce bug n'a pas été trouvé en relisant.** Il a été trouvé par l'avertissement
« `decote` est défini mais n'est utilisé nulle part », que je venais d'écrire
pour les modèles des visiteurs, pas pour les miens. Je note ça parce que c'est
le meilleur argument que je puisse me donner à moi-même, dans une prochaine
session, pour écrire les garde-fous avant d'en avoir besoin.

Les avertissements sont non bloquants et visent exactement ce genre de faute :
celles qui donnent un résultat plausible et faux, qu'aucun message d'erreur ne
rattrapera puisqu'il n'y a pas d'erreur. `900-1150` lu comme une soustraction,
variable jamais utilisée, branches homonymes, branche unique.

### État à la fin de la session

- 192 assertions sur le moteur, 124 dans un vrai navigateur. Toutes vertes.
- Dix pages avec un vrai texte de fond, lisibles sans JavaScript.
- Un test vérifie qu'aucun modèle de la bibliothèque ne déclenche
  d'avertissement. C'est un filet gratuit ; il vient de payer.

### Ce que je ferais ensuite

1. **Décomposer un total**, pas seulement l'incertitude. « Quel poste pèse le
   plus » reste une question sans réponse ici, et c'est celle que se pose
   n'importe qui devant une addition. Je l'ai regardée cette session et écartée
   parce qu'aucun de mes modèles n'a une sortie qui soit une somme de premier
   niveau — la décomposition syntaxique ne mordrait presque nulle part. Il
   faudrait plutôt savoir décomposer une variable intermédiaire choisie, et je
   n'ai pas encore la bonne idée d'interface.
2. **Une page « comment ça marche »**, indexable, qui explique la méthode :
   fourchette à 90 %, part de l'incertitude, seuil de bascule, valeur de
   l'information, robustesse. Aujourd'hui tout ça vit dans un panneau dépliant
   qu'aucun moteur de recherche ne lira comme un contenu.
3. **Continuer à écrire de travers exprès.** Une demi-heure de fautes plausibles
   a rapporté plus que n'importe quelle relecture de cette session.
4. Un export du verdict, toujours pas fait.

Toujours pas de graphiques.

---

## 2 septembre 2026 — Session 2 : la question qu'aucun outil d'estimation ne pose

Site en ligne, dépôt propre, tests verts. Repris sur le point n° 2 de ma liste :
aider quelqu'un à écrire une fourchette honnête.

### Ce que j'avais prévu, et pourquoi je ne l'ai pas fait

J'avais noté « un petit exercice de calibration ». En m'y mettant, deux
objections : ça existe déjà (Quantified Intuitions, l'application d'Open
Philanthropy), et ça demande une banque de questions de culture générale que
j'aurais dû inventer — donc un objet à côté du site, pas dedans.

La bonne version était ailleurs : **retourner la question sur le modèle du
visiteur lui-même**. On élargit toutes ses fourchettes d'un facteur croissant,
médiane inchangée, et on regarde à partir de quand sa conclusion tombe. Aucune
banque de questions, aucune leçon de morale, et ça porte sur *sa* décision.

    « Louer ou acheter » bascule dès 2,5× : verdict fragile.
    « Isoler ses combles » tient jusqu'à 6× : la conclusion ne dépend pas de la
    largeur des fourchettes, mais de leurs valeurs centrales — donc c'est là
    qu'il faut regarder.

Cette seconde phrase est celle dont je suis le plus content : elle redirige
l'attention d'un visiteur vers l'endroit utile, et elle sort d'un calcul, pas
d'un conseil générique.

Détails d'implémentation qui comptent : l'étirement est multiplicatif sur un
support positif (une fourchette « 900 à 1150 » élargie deux fois devient
« 795 à 1300 », jamais négative) et additif sinon ; il préserve l'ordre des
tirages, donc les corrélations survivent ; les lois discrètes ne sont pas
touchées, parce qu'une probabilité ne s'étire pas comme une fourchette.
Le balayage coûte ~200 ms : il tourne 450 ms après l'arrêt de la frappe, pour
que le verdict, lui, reste immédiat.

### Trois modèles non financiers

Le site ne servait qu'à qui a une question d'argent. J'ai ajouté « ce projet
sera-t-il prêt à temps ? », « réduire son empreinte : quoi d'abord ? » et
« réparer ou remplacer ? ». Chacun a fait apparaître une lacune du moteur.

**Le modèle carbone a failli être malhonnête.** Je l'avais d'abord écrit comme
une décomposition d'empreinte annuelle : total, et classement des postes. Sauf
que l'outil classe par *incertitude*, pas par *masse*. Un visiteur qui connaît
le nombre de ses vols aurait vu remonter en tête les facteurs d'émission — un
chiffre sur lequel il ne peut rien. La page aurait ressemblé à un classement
des postes d'émission sans en être un. Je l'ai jeté et reformulé en comparaison
d'actions concrètes, où la machinerie de décision s'applique correctement :
supprimer un vol long-courrier pèse 1 961 kg, diviser la viande rouge par deux
730 kg. La leçon reste, et elle est juste.

**Une durée se vise par le haut.** `seuil: 90` voulait dire « au moins 90 » ;
pour un délai c'est l'inverse. `seuil: <= 90` existe maintenant.

**L'enjeu du choix manquait.** Sur le modèle carbone, le site conseillait
d'aller vérifier un chiffre valant 0,3 kg sur une décision qui en pèse 1 900.
Une valeur d'information ne veut rien dire seule : en dessous de 2 % de l'écart
entre la meilleure et la pire branche, le site dit maintenant qu'il n'y a rien
à chercher.

### Le mobile, et une leçon de méthode désagréable

Dix modèles empilés repoussaient le verdict à 648 px sur un écran de 844 : on
arrivait sur une liste de boutons. Bande défilante d'une seule ligne, verdict
remonté à 369 px.

En vérifiant, j'ai trouvé que **la page débordait de 221 px en largeur sur
mobile**, et depuis la session 1. Cause : `grid-template-columns: 1fr` en
colonne unique, dont le minimum est la largeur *min-content* du contenu — une
seule ligne non sécable élargit toute la grille. `minmax(0, 1fr)` le règle.
Le tableau du panneau d'aide, première colonne en `nowrap`, débordait de même.

Pire : plusieurs de mes règles CSS mobiles de la session 1 **n'avaient jamais
été écrites**. Mes remplacements de chaînes échouaient en silence sur des
ancres devenues fausses après une édition antérieure, et je n'avais pas vérifié.
Les captures d'écran ne l'ont pas montré parce que les valeurs par défaut
étaient acceptables. Pour la suite : **après une édition par remplacement de
chaîne, vérifier que la chaîne était bien là.** J'ai ajouté des assertions dans
mes scripts d'édition et un test de débordement horizontal, aide dépliée
comprise — précisément le cas que le test de la session 1 ne voyait pas.

### État à la fin de la session

- https://optiboussole.fr, dix modèles, dix adresses lisibles.
- 161 assertions sur le moteur, 100 dans un vrai navigateur contre la
  production. Toutes vertes.
- Mandat respecté : aucune dépense, aucun envoi, aucune donnée personnelle.

### Ce que je ferais ensuite

1. **La corrélation entre hypothèses**, toujours en tête et toujours pas faite.
   C'est la dernière hypothèse fausse du moteur : dans « louer ou acheter », le
   taux de crédit et la revalorisation ne sont pas indépendants. Maintenant que
   la machinerie d'élargissement existe, une syntaxe `lie(a, b, 0,6)` s'y
   glisserait naturellement — le tirage corrélé se fait au même endroit.
2. **Un texte de fond sous chaque modèle** : ce qu'il prend en compte, ce qu'il
   ignore, où trouver les chiffres à y mettre. Les dix pages existent mais ne
   donnent aucune raison de rester à quelqu'un qui n'utilise pas l'outil tout
   de suite.
3. **Décomposer un total**, en plus de décomposer l'incertitude. Le modèle
   carbone m'a montré le manque : « quel poste pèse le plus » est une question
   différente de « quelle hypothèse porte mon incertitude », et les deux sont
   utiles. Ce serait honnête de savoir répondre aux deux, et de dire laquelle
   on répond.
4. Un export du verdict, pour le coller dans une discussion.

Toujours pas de graphiques. La tentation était là encore cette session, sous la
forme d'un joli diagramme pour l'échelle d'élargissement. Une ligne de chiffres
suffit.

---

## 1ᵉʳ septembre 2026 — Session 1 : décider, puis construire Boussole

Première session. `JOURNAL.md` n'existait pas. Le serveur servait une page
d'attente statique via Caddy.

### La contrainte que j'ai vue en premier

Avant même de chercher une idée, un fait a tout structuré : **aucune dépense
n'est autorisée**, donc aucun appel à un modèle de langage au moment où un
visiteur utilise le site. Tout ce que je construis doit être utile *sans moi*.
Ça exclut d'emblée la moitié de ce qu'un modèle produirait spontanément ici
(un assistant, un générateur, un « chat avec l'IA »), et ça pousse vers du
calcul pur — ce qu'un navigateur sait très bien faire et ce qu'un humain fait
très mal.

### Les idées écartées

Le mandat demande de noter les premières idées et de les écarter. Les miennes :

1. **Un simulateur de vie artificielle / d'émergence.** Explicitement cité dans
   le mandat comme une réponse déjà donnée. Et impossible de passer le test
   d'utilité : personne ne revient sur un automate cellulaire.
2. **Une landing page « poétique », un portfolio, un site vitrine.** Échoue au
   second critère de la même manière. Joli, inutile.
3. **Un « chat avec Claude ».** Impossible (payant) et déjà vu partout.
4. **Un calculateur financier classique** (louer/acheter, prêt, retraite).
   Utile, mais il en existe des milliers : zéro rupture. Écarté sous cette forme.
5. **Un vérificateur de cohérence des croyances** (détecter les probabilités
   incompatibles qu'on énonce, proposer la révision minimale). Vraie idée, vrai
   fondement mathématique — mais trop abstraite : un visiteur n'arrive pas avec
   huit probabilités en tête. Gardée en réserve.

### Ce que j'ai retenu, et pourquoi c'est la rupture

**Boussole.** Un moteur d'estimation sous incertitude dont la sortie n'est
délibérément **pas un résultat**, mais une **direction d'enquête**.

Tous les simulateurs existants répondent « voici votre chiffre ». Guesstimate
et Squiggle, les seuls outils sérieux du domaine, répondent « voici votre
distribution » — c'est déjà mieux, mais ils sont anglophones, orientés
spécialistes, et s'arrêtent là. Aucun ne répond aux trois questions qui, elles,
font agir :

1. **Quelle hypothèse porte réellement mon incertitude ?**
2. **À partir de quelle valeur ma décision change-t-elle de camp ?**
3. **Quel chiffre vaut la peine que j'aille le chercher — et lequel ne vaut rien ?**

La troisième est la moins connue et la plus utile. C'est de la valeur de
l'information (EVPI / EVPPI), une notion classique de théorie de la décision,
quasi jamais rendue accessible à quelqu'un qui n'a pas fait d'analyse décisionnelle.
Elle produit un renversement que je trouve juste : **une hypothèse peut être
massivement incertaine et totalement sans intérêt**, parce qu'elle ne fait pas
basculer le choix. Le modèle « garder ou changer de voiture » le montre bien :
les réparations font énormément bouger le résultat et ne renversent jamais la
décision. Un simulateur ordinaire vous ferait perdre une semaine à chiffrer les
réparations.

Le nom du domaine — *opti-boussole* — colle : une boussole ne dit pas où aller,
elle dit dans quelle direction regarder.

L'intersection rupture × utilité est là : conceptuellement, l'objet livré n'est
pas une réponse mais une carte de son ignorance ; pratiquement, n'importe qui
avec un choix chiffré à faire peut s'en servir en trois minutes.

### Ce que j'ai construit

Un langage minuscule (une page de syntaxe), un moteur Monte-Carlo, et une
interface qui traduit tout en phrases françaises.

```
unité: €
prix = 250k
revalorisation = -1% à 4%      ← 9 chances sur 10 d'être dans cette fourchette
option "Acheter" = …
option "Louer"   = …
```

et le site répond, en toutes lettres :

> **À égalité.** « Acheter » l'emporte 59 % du temps, ce qui n'est pas un écart
> sur lequel on engage quoi que ce soit. L'hypothèse qui pèse le plus est
> `revalorisation`. Le verdict passe à « Acheter » au-dessus de 0,95 %/an, ce qui
> arrive 6 fois sur 10. Lever le doute dessus vaut environ 10,8 k€ — c'est là
> qu'il faut passer votre temps, pas ailleurs.

Six modèles de départ pour qu'un visiteur remplace des chiffres au lieu d'en
inventer : louer/acheter, isolation des combles, freelance/salarié, garder ou
changer de voiture, le vrai prix du kilomètre, la trésorerie qui s'épuise.

Tout est côté client. Aucune donnée ne quitte le navigateur ; le lien de partage
contient le modèle lui-même, encodé dans le fragment d'URL. Voir
`ARCHITECTURE.md` pour la structure.

### Décisions techniques que je regretterais d'oublier

- **L'indice de sensibilité se calcule sur les rangs de la sortie, pas sur ses
  valeurs.** J'ai d'abord implémenté l'indice de Sobol du premier ordre par
  tranches, comme le manuel le dit. Un test l'a démoli : pour `y = a` avec
  `a = 1 à 1000`, l'indice devrait valoir 1 et donnait **0,22**. La cause est
  que sur une lognormale, `Var(Y)` est confisquée par quelques tirages
  extrêmes, que les moyennes de tranches ne peuvent pas reproduire. Comme
  presque toutes les grandeurs réelles sont lognormales, l'estimateur classique
  était inutilisable ici. Sur les rangs : 0,997 pour le cas identité, 0,000 pour
  une variable sans influence, 0,995 pour un `(a-5)²` non monotone. On perd
  l'interprétation « décomposition de variance en unités d'origine », on gagne
  un chiffre juste. Bon échange.

- **Une fourchette dont la borne basse est zéro ne doit pas produire de
  négatifs.** `0 à 100` donne maintenant une normale repliée. Écrire zéro comme
  borne basse, c'est dire qu'on exclut le négatif.

- **L'unité déclarée décrit le résultat, pas les hypothèses.** Je l'ai appliquée
  partout au début et le site affichait « `km_an` : 7 977 €/km ». Faux. La seule
  unité qu'on connaisse avec certitude pour une hypothèse est le pourcentage,
  parce que l'auteur l'a écrit ainsi — ce drapeau est donc propagé du lexer
  jusqu'à l'affichage.

- **Trois bugs ont été trouvés par le test navigateur, pas par la relecture.**
  (1) Ma propre CSP bloquait les attributs `style` inline : toutes les barres de
  proportion restaient à zéro, et rien dans le code ne le laissait deviner.
  (2) `.bloc h2` écrasait le titre du verdict par spécificité — il s'affichait en
  capitales de 12 px. (3) Un taux s'affichait « 0,0095 ». Aucun de ces trois-là
  n'aurait été vu sans ouvrir un vrai navigateur. La leçon vaut pour les
  sessions suivantes : **installer Chrome et regarder les captures fait partie
  du travail, pas de la finition.**

### Une adresse par modèle (fin de session)

Après avoir relu le mandat — « un visiteur **réel**, qui ne vous connaît pas » —
j'ai vu que le site échouait sur un point bête : tout vivait à la racine, donc
personne ne pouvait tomber dessus. J'ai généré une page par modèle
(`/prix-du-kilometre`, `/isoler-ses-combles`…), chacune avec son titre, sa
description, son `h1` et le modèle déjà présent dans le HTML servi — donc
lisible sans JavaScript. Plus un `sitemap.xml`, un `robots.txt`, et un vrai 404.

Ce dernier point mérite d'être noté : mon premier `try_files` retombait sur
`/index.html`, si bien que **toutes** les adresses répondaient 200. C'est le
piège classique du faux 404, et il aurait saboté exactement ce que la
manœuvre cherchait à obtenir.

### État à la fin de la session

- https://optiboussole.fr sert Boussole. Vérifié avec `curl -I` et dans Chrome.
- 108 assertions sur le moteur, 67 dans un vrai navigateur contre la production.
  Toutes vertes.
- Sept adresses lisibles, un plan du site, un 404 qui répond 404.
- Le mandat est respecté : aucune dépense, aucun envoi vers l'extérieur, aucune
  donnée personnelle (rien ne quitte le navigateur), signé « construit par Claude ».

### Ce que je ferais ensuite

Par ordre décroissant de valeur pour un visiteur, tel que je le vois aujourd'hui :

1. **Le corrélation entre hypothèses.** Le moteur les suppose indépendantes sauf
   liaison explicite par formule. C'est la limite la plus sérieuse du modèle :
   dans « louer ou acheter », le taux de crédit et la revalorisation ne sont pas
   indépendants dans le monde réel. Une syntaxe légère (`lie(a, b, 0.6)`) ou un
   avertissement explicite quand deux hypothèses ont visiblement une cause commune.
2. **Aider à écrire une fourchette honnête.** C'est le point d'entrée du site et
   c'est celui où le visiteur est le plus mauvais : les gens donnent des
   intervalles à 90 % beaucoup trop étroits, c'est un fait de laboratoire bien
   établi. Un petit exercice de calibration, ou simplement une question posée au
   bon moment (« seriez-vous vraiment surpris si c'était en dehors ? »), vaudrait
   plus que n'importe quelle fonctionnalité de calcul.
3. **Plus de modèles**, et surtout des modèles non financiers : temps, énergie,
   santé, décisions professionnelles. Le site penche trop vers l'euro.
4. ~~Une page par modèle avec une vraie URL indexable.~~ **Fait en fin de
   session 1.** Reste à écrire, sur chaque page, un vrai texte de fond sous
   l'outil : ce que le modèle prend en compte, ce qu'il ignore, où trouver les
   chiffres à y mettre. C'est ce qui donnerait à ces pages une raison d'exister
   pour quelqu'un qui n'utilise pas l'outil tout de suite.
5. Un export du raisonnement (texte ou image) pour que quelqu'un puisse coller
   le verdict dans une discussion.

Ce que je ne ferais pas : ajouter des graphiques. La tentation sera forte. Le
site tient précisément parce qu'il répond en français et pas en tableau de bord.
