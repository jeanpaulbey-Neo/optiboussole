# Journal de bord — optiboussole.fr

**Qui écrit.** Les sessions 1 à 5 (contre-argument compris) ont été écrites par
Claude Opus 5. À partir de la session 6, le modèle actif est Claude Fable 5.1.
Précision apportée par Jean-Paul au début de la session 6 : les entrées
précédentes ne nommaient pas leur auteur, elles sont donc à lire comme
signées Opus 5. Chaque entrée indique désormais le modèle qui l'a écrite.

---

## 3 septembre 2026 — Session 10 : le poids et l'incertitude, et un visiteur qu'on n'avait jamais imaginé

*Modèle : Claude Fable 5.1.*

### Le huitième chapitre

Le point 3 d'hier. Le détail des calculs et l'origine de l'incertitude d'une
valeur intermédiaire existaient depuis les sessions 6 et 7, mais `/la-methode`
n'en disait rien. Le chapitre s'appelle « Le poids et l'incertitude » et il
tient sur un seul exemple, le prix du kilomètre : `fixe` vaut 4 240 € par an,
la décote en fait 1 930 €, près de la moitié — et l'incertitude de `fixe` est
portée par `reparations` à 39 % et `stationnement` à 28 %, la décote n'y
étant pour presque rien. **Ce qui pèse et ce qu'on ignore ne coïncident
pas** : c'était la phrase de la session 8, elle a maintenant une adresse
indexable et douze assertions qui l'épinglent.

En l'écrivant, j'ai tranché ce que quatre sessions reportaient sous « à
peser » : **décomposer un produit**. La réponse est qu'il n'y a rien à
décomposer. Dans `ca = tjm * jours`, chaque facteur pèse exactement autant
que l'autre — doublez l'un ou l'autre, le résultat double — donc « quel
facteur pèse le plus » n'a pas de réponse, et un poids affiché serait une
invention. Ce qui distingue les facteurs d'un produit, c'est uniquement leur
incertitude, et cette ligne-là s'affiche déjà sous chaque valeur. Vérifié sur
`a = 1 à 3`, `b = 10 à 12`, `c = 100 à 110` : `c` est le plus grand facteur
et `a` porte 96 % de l'incertitude. Le chapitre le dit, un test le tient, et
l'item sort de la liste pour de bon. Je note la leçon de méthode : un point
qui reste « à peser » quatre sessions de suite est un point dont on n'a pas
encore écrit pourquoi il est vide.

Une chose vue sur la capture mobile du chapitre : « 11 % » se coupait en fin
de ligne, le signe seul au début de la suivante. Le rendu dynamique posait
l'espace fine insécable depuis la session 1 ; la prose servie par le
gabarit, jamais. C'est fait dans `riche()`, pour les pages de fond aussi,
hors des blocs de code — ce qu'on y lit doit se recopier tel quel.

### Un visiteur au clavier

Neuf sessions à imaginer des visiteurs, et jamais un qui n'utilise pas la
souris ni les yeux. J'ai passé axe-core sur trois pages. Résultat honnête
pour mes prédécesseurs : aucune étiquette manquante, aucun contraste
insuffisant, `aria-current` sur la pastille active, `role="status"` sur
l'erreur. Deux manques mécaniques — pas de `<main>`, deux blocs hors
landmark — et un problème que l'outil ne pouvait pas voir : **la zone de
résultats entière était en `aria-live`**. La page se redessine à chaque
frappe. Un lecteur d'écran aurait relu tout le verdict, toutes les
hypothèses, tous les seuils, à chaque lettre tapée. C'est l'inverse exact de
ce qu'on veut, et c'est la faute la plus courante avec cet attribut.

Maintenant : une zone hors écran reçoit le verdict et sa première phrase,
seulement s'ils ont changé — modifier un commentaire n'annonce rien,
modifier une hypothèse annonce « Le vrai prix du kilomètre. 0,50 €/km. Neuf
fois sur dix, entre… ». Les jauges, décoratives, sont masquées. Un lien
« Aller au contenu » apparaît au premier Tab, et un contour de focus
identique partout. Puis la page 404, écrite à la main en session 1, s'est
révélée périmée : sept modèles sur dix, une apostrophe droite. Elle est
générée par le gabarit désormais, comme tout le reste.

axe tourne dans le test navigateur sur quatre pages, et le test vérifie à la
main ce qu'axe ne sait pas : que l'annonce est une phrase courte, qu'elle ne
bouge pas pour un commentaire, qu'elle bouge pour une hypothèse, que Tab
puis Entrée mènent au contenu.

### Un accident à ne pas répéter

`npm i -D axe-core` a **supprimé puppeteer**. Il était dans le lock mais pas
dans `package.json`, et npm élague ce qui n'est pas déclaré. Le test
navigateur ne tournait plus. Les deux dépendances sont maintenant déclarées,
et l'architecture le dit.

### État à la fin de la session

- Huit chapitres sur `/la-methode`. Douze pages, toutes générées.
- 434 assertions sur le moteur, 200 dans un vrai navigateur, axe compris.
  Toutes vertes.

### Ce que je ferais ensuite

1. **La bande de modèles a dix pastilles**, toujours. Sur bureau elle passe
   sur deux lignes ; ça tient encore. Le jour où on en ajoute un, il faudra
   grouper ou retirer.
2. **Une récolte sur un texte que je n'aurai pas choisi.** La décision de la
   session 9 tient : la prochaine fois que j'écris de travers, ce sera à
   partir d'un fil que je n'ai pas cherché.
3. **Relire les pages de fond avec le chapitre 8 en tête.** Quatre modèles
   disent déjà ce que le détail montre ; les six autres pourraient avoir
   une phrase de ce genre, quand elle est vraie et qu'elle apprend quelque
   chose.

Toujours pas de graphiques. Un lecteur d'écran est d'ailleurs le meilleur
argument que j'aie trouvé pour cette règle : tout ce que le site dit, il le
dit en phrases, et il n'y a rien à décrire à côté.

---

## 3 septembre 2026 — Session 9 : le dixième modèle

*Modèle : Claude Fable 5.1.*

### Racheter son crédit ?

Le point 2 d'hier, pesé et fait. Le fil de forum transcrit en session 8
posait la question que tous les simulateurs de courtier esquivent : ils
donnent le gain à un taux donné, jamais **le taux à partir duquel il n'y a
plus rien à gagner**, frais compris. C'est exactement un seuil de bascule, et
c'est ce que le site fait de mieux. L'auteur du fil l'avait d'ailleurs
calculé à la main — « ça commence à être intéressant à 1,35 % » — ce qui est
la preuve que la question est la bonne.

Le modèle compare les intérêts restants à payer, avec et sans, à durée
égale, contre ce que l'opération coûte : frais de dossier, nouvelle garantie,
indemnité de remboursement anticipé plafonnée à six mois d'intérêts. Première
version : 3,9 % contre 3 à 3,5 %, et le site répondait « Racheter, 100 %,
rien à vérifier ». Vrai, et inutile comme modèle de départ — il ne montrait
pas ce pour quoi il existe. Resserré à 3,4 % contre 2,9 à 3,3 % : « Racheter »
l'emporte 82 % du temps, le verdict passe à « Garder » au-dessus de 3,21 %,
ce qui arrive 16 % du temps, et lever le doute vaut 237 €. Le détail des
calculs ajoute que les frais tiennent d'abord à l'indemnité, qui est la seule
des trois lignes de frais qu'on peut négocier à zéro. **C'est le modèle de
bibliothèque où la réponse du site ressemble le plus à un conseil
actionnable**, et il ne contient aucun conseil : que des seuils.

Déclaré dans « ce qu'il ignore » : l'assurance emprunteur, qui est souvent
le vrai gisement, et le raccourcissement de durée à mensualité égale.

### Septième récolte, hors finance

Six questions comme on les pose : 400 heures de formation à 10 ou 15 heures
par semaine, 8 km de vélo pour aller au travail et combien de kilos en six
mois, un 80 % qui coûte combien net, une dette de sommeil, un concert
associatif qui rentre ou non dans ses frais, une année d'études tout compris.
Tout passe, y compris `8 km × 2`, `8% des recettes`, `12 mois × 1 900 € net`
et `3 à 6 € par personne`. Rien à corriger. `7h30` refuse avec « écrivez 7,5
ou 450 », ce qui est la réponse voulue.

Je m'arrête donc là sur les récoltes pour un moment : sept sessions, et la
dernière qui ne trouve rien est le signal qu'il fallait. La prochaine fois
que j'en ferai une, ce sera sur un texte que je n'aurai pas choisi.

### État à la fin de la session

- Dix modèles, douze pages.
- 422 assertions sur le moteur, 185 dans un vrai navigateur. Toutes vertes.

### Ce que je ferais ensuite

1. **La bande de modèles a dix pastilles.** Sur mobile elle défile ; sur
   bureau elle tient. Au-delà, il faudra grouper — argent, temps, énergie —
   ou choisir. Pas encore.
2. **Décomposer un produit.** À peser, toujours. Le cas du vélo (`km × jours ×
   semaines × kcal × (1 − compensation) / kcal_par_kg`) est exactement celui
   où ça manquerait, et l'origine de l'incertitude répond déjà à la moitié.
3. **Relire `/la-methode`** avec les deux dernières fonctionnalités en tête :
   le détail des calculs et l'origine de l'incertitude d'une valeur
   intermédiaire y auraient leur place, en un chapitre court.

Toujours pas de graphiques.

---

## 2 septembre 2026 — Session 8 : des questions réelles

*Modèle : Claude Fable 5.1.*

Session courte. Le point 1 de ma liste : au lieu d'imaginer un visiteur, en
trouver de vrais. Deux fils de forum avec une question chiffrée dans le
premier message — une pompe à chaleur air/eau à 20 000 € dans une maison
neuve très isolée de 150 m², et un rachat de crédit de 276 500 € à 1,69 % sur
24 ans dont il reste 23 — plus deux formulations typiques (panneaux solaires,
« je gagne 2300 net, je mets 300 de côté, un apport de 30k c'est combien de
temps »).

Je les ai transcrits avec les notations de leurs auteurs, sans les corriger :
`276 500€`, `1.69%`, `150m²`, `20 000€ posé`, `15 à 40 kWh/m²/an`,
`0,10€ à 0,14€ le kWh`, `6 kWc`, `2 à 5%/an`, `2300 net par mois`. **Tout
est passé du premier coup**, sauf deux choses. C'est la première récolte où
le résultat est surtout une confirmation : les sept sessions de tolérance
tiennent sur du texte que je n'ai pas inventé.

Les deux accrocs. `salaire = 2300 net par mois` refusait avec « la
multiplication s'écrit 2300 * mois », parce que la dernière ligne du modèle
définissait une variable `mois`. La règle « un nom défini n'est jamais une
unité » était trop stricte : quand une préposition précède — *par* mois,
*le* kWh, *per* month — c'est une unité, quel que soit le nom. Et `1 an et
demi` ne connaissait pas « demi » ; il vaut maintenant 1,5.

Un point que je note pour ne pas le redécouvrir : `150m²` passe parce que
« ² » est un caractère de catégorie *nombre* en Unicode, donc `m²` est lu
comme un seul identifiant, et non comme `m` (million) suivi d'un carré. C'est
juste par chance, et un test le fixe.

### Ce que le détail des calculs a changé aux textes de fond

Le point 3. Quatre modèles disent maintenant ce que le panneau montre et que
je ne savais pas en les écrivant. Sur le prix du kilomètre, la décote est le
poste le plus lourd de loin, mais l'incertitude des postes fixes vient des
réparations et du stationnement — **ce qui pèse et ce qu'on ignore ne
coïncident pas**, et c'est la phrase la plus utile que le site puisse dire
sur une addition. Sur la voiture, « garder » tient aux réparations pour près
des trois quarts, ce qui explique pourquoi un seul chiffre décide. Sur la
trésorerie, le loyer est le plus lourd mais on le connaît ; la fourchette
vient des imprévus et des courses, et c'est là que les relevés servent.

### Ce que je n'ai pas fait

Un test de la valeur médiane du rachat de crédit écrit de tête à 1 213 €, que
la formule contredisait à 1 210 €. J'ai vérifié la formule, pas le test :
c'est elle qui avait raison. Je le note parce que c'est exactement le
réflexe inverse de celui qu'il faut avoir avec les chiffres épinglés de
`/la-methode`, et qu'il faut savoir lequel des deux on est en train de faire.

### État à la fin de la session

- 410 assertions sur le moteur, 177 dans un vrai navigateur. Toutes vertes.

### Ce que je ferais ensuite

1. **D'autres questions réelles**, dans des domaines que la bibliothèque ne
   couvre pas : santé, temps, études, associatif. Chaque fil de forum coûte
   une minute et vaut plus qu'une heure de cas imaginés.
2. **Un modèle « rachat de crédit » dans la bibliothèque ?** La question est
   posée partout, le calcul est standard, et le site répond à ce qu'aucun
   simulateur de courtier ne dit : à partir de quel taux, et avec quels
   frais, ça bascule. À peser contre l'encombrement de la bande de modèles.
3. **Décomposer un produit**, toujours à peser.

Toujours pas de graphiques.

---

## 2 septembre 2026 — Session 7 : ce qu'un tableur montre et que le site cachait

*Modèle : Claude Fable 5.1.*

Session courte, reprise directement sur ma liste de la veille : la cinquième
récolte de saisies de travers, et donner à chaque valeur intermédiaire
l'origine de son incertitude.

### Cinquième récolte

Quarante-deux entrées, dans les trois catégories notées : un tableau collé
avec plusieurs colonnes, un modèle entièrement en anglais, des durées et des
dates. Cinq lectures fausses en silence, ce qui fait de cette récolte la plus
rentable depuis la session 3.

- `loyer;900;1150` — un tableur exporté en CSV français. Le point-virgule
  découpe une ligne en instructions, donc le site lisait trois instructions,
  ne gardait que la dernière et affichait **1150** sans un mot. Le pire cas
  possible : pas d'erreur, un chiffre, faux.
- `duree = 3 ans et 6 mois` valait **1** : « ans » ignoré, « et » lu comme le
  *et* logique de 3 et 6.
- `100 k à 200 k` allait de 100 à 200, « k » pris pour une unité.
- `10 pour cent` valait 10.
- `debut = 01/09/2026` valait 0,00005 : une double division.

Les trois premières sont des conséquences directes de mes décisions de la
session 6 (le point-virgule séparateur, les mots d'unité ignorés). Je note
ça sans regret : chaque tolérance ouvre une ambiguïté un cran plus loin, et
la seule façon de la voir est d'écrire de travers *après* avoir décidé. Une
ligne de tableau est maintenant reconnue sur le texte brut, avant toute
analyse, quel que soit son séparateur ; l'en-tête d'un tableau aussi. Deux
unités dans un même nombre refusent avec la bonne écriture. `k` et `M` seuls
après un nombre sont des suffixes. « pour cent » et « pour mille » sont des
proportions. Une date est refusée avec ce qu'il faut écrire à la place.

Le reste : les opérateurs en toutes lettres (`prix fois 12`, `1 chance sur
10`, `revenue minus costs`, `x divided by 2`), les petits nombres en toutes
lettres (`deux à trois`), le symbole devant le nombre (`$100`), l'apostrophe
suisse, et `100.000` lu cent — c'est le point décimal ici — mais **signalé**,
parce que l'autre lecture est courante. Et une correction que je n'aurais pas
trouvée sans cette récolte : `truc(3, 4)` disait « attend 1 argument », parce
que la vérification du nombre d'arguments passait avant celle du nom.

### D'où vient l'incertitude de *cette* valeur

Le point 3 de ma liste. J'avais imaginé un clic sur une valeur intermédiaire ;
c'est inutile — il suffit de l'écrire sous chaque valeur : « incertitude
portée par `revenu_regulier` 55 %, `imprevus` 17 % ». C'est le même indice
que pour le résultat, sur les rangs, calculé pour chaque variable
intermédiaire contre chaque hypothèse.

Le coût était la seule question. Sur 20 000 tirages, 100 à 175 ms par modèle,
autant que tout le reste. Sur un sous-échantillon de 4 000 tirages, une
dizaine de millisecondes, et 125 tirages par tranche suffisent largement pour
distinguer 60 % de 10 % — le seul usage qu'on en fait. Au-delà de vingt
hypothèses ou trente valeurs, on s'abstient.

Ce que ça donne sur la bibliothèque, et que je ne savais pas en la lisant :
`cout_achat` tient à `placement` avant `travaux` ; `garder` (la voiture) tient
aux `reparations` à 72 % ; `fixe` (le prix du kilomètre) tient aux
`reparations` et au `stationnement`, pas à la décote, qui pèse pourtant le
plus lourd. **Le poids et l'incertitude sont deux questions**, et le panneau
les affiche maintenant côte à côte, chacune nommée.

Un détail à noter : une source qui porte le nom de la valeur (`creuses =
min(horizon, poisson(…))` crée une source nommée `creuses`) n'est pas listée
comme son origine. Dire « `creuses` tient à `creuses` » n'apprend rien.

### État à la fin de la session

- 399 assertions sur le moteur, 177 dans un vrai navigateur. Toutes vertes.
- Le calcul complet d'un modèle de la bibliothèque : 145 à 240 ms.

### Ce que je ferais ensuite

1. **Écrire de travers, encore**, mais autrement : les cinq récoltes ont été
   faites par moi, en imaginant un visiteur. La prochaine devrait partir de
   modèles entiers écrits d'une traite sur un sujet que je ne connais pas
   d'avance — reprendre un forum de questions chiffrées et transcrire les
   questions telles qu'elles sont posées.
2. **Décomposer un produit**, toujours à peser. Avec l'origine de
   l'incertitude affichée, la moitié de l'intérêt est déjà là.
3. **Relire la bibliothèque à la lumière du détail.** Le panneau m'a appris
   des choses sur mes propres modèles ; certaines devraient remonter dans
   « ce que ce modèle compte » et « où trouver vos chiffres ».

Toujours pas de graphiques.

---

## 2 septembre 2026 — Session 6 : lire le moteur avec d'autres yeux

*Modèle : Claude Fable 5.1. Première session de ce modèle ; les cinq
précédentes sont d'Opus 5, et Jean-Paul a demandé que ce soit dit.*

Je n'ai rien écrit de ce site. J'en hérite avec le journal pour seule mémoire,
et la première chose que j'ai voulue savoir, c'est si je le comprendrais sans
son auteur. Réponse : oui, et vite — parce que le journal est écrit pour ça,
et parce que le code dit pourquoi à chaque endroit où il fait quelque chose
d'étonnant. Je continue dans la même veine.

### Écrire de travers, quatrième fois

Soixante-dix-sept entrées, sur les catégories notées à la fin de la session 5
— anglais, trois branches ou plus, résultat réutilisé — et sur ce qui me venait
en lisant le lexer pour la première fois. Cette lecture-là a payé : trois
lectures **fausses en silence**, la catégorie que les sessions précédentes
disaient la plus coûteuse.

- `taux = 15 à 30 %` se lisait « 15 à 0,3 » : la borne haute était un
  pourcentage, la borne basse un nombre. Un modèle où c'est écrit ainsi
  calculait quelque chose, sans un mot, avec une hypothèse fausse d'un facteur
  cinquante.
- `budget = 1 à 3 millions` se lisait « 1 à 3 000 000 ». Même mécanique.
- `prix = 1000 ± 10 %` se lisait « 1000 ± 0,1 ».

La règle est maintenant : **l'échelle donnée à une borne vaut pour l'autre**,
avec un garde-fou pour le multiplicateur — `500 à 2k` va bien de 500 à 2 000,
parce que 500 est plus grand que 2. Et `± 10 %` est relatif au centre.

Le reste de la récolte : `max()` sans argument affichait une exception
interne (« Reduce of empty array ») ; `option "C" = max(A, B)` était
recommandée en gagnant « 0 % du temps », parce qu'une égalité stricte comptait
pour la première branche ; `total = a + b` écrit **avant** ses termes donnait
`b` comme résultat, avec un avertissement disant que `total` ne servait à
rien — ce qui était le symptôme, pas le diagnostic. Le résultat implicite est
maintenant la dernière variable dont rien ne dépend.

Et une décision que je note parce qu'elle n'allait pas de soi : **les mots
après un nombre sont lus comme des unités et ignorés**. `duree = 3 ans`,
`temps = 40 h/semaine`, `10 à 20 par mois` — jusqu'ici, « ans » déclenchait
« cette ligne ressemble à une phrase », ce qui est faux et bloquant. Le risque
de l'autre côté est `y = 3 prx` où `prx` est une faute de frappe : le site
calculerait 3. J'ai pris le risque avec deux filets : un mot qui est un nom
défini n'est jamais une unité (`3 x` renvoie à `3 * x`), et chaque mot ignoré
est signalé en avertissement. La faute de frappe donne alors deux
avertissements côte à côte — « prx » ignoré, « prix » jamais utilisé — qui se
lisent ensemble.

En anglais : `to`, `between … and`, `threshold:`, `if … then … else`,
`floor`, `ceil`, `pow`, `**`. Le `? :` renvoie à `si … alors … sinon`. Les
paramètres des lois sont vérifiés : `bernoulli(120 %)` valait toujours 1,
`triangulaire(1, 5, 3)` sortait de ses propres bornes. `environ 100` refuse
avec la seule réponse honnête : dites de combien.

### Le détail des calculs

Ce qui m'a le plus manqué en lisant les modèles : ce que valent
`mensualite`, `cout_achat`, `depense_an`. Un tableur montre chaque cellule ;
ici, seules les hypothèses et le résultat existaient, et une variable
intermédiaire était un nom sans valeur. On ne pouvait vérifier son modèle
qu'en le croyant.

Un panneau dépliant, sous les résultats, donne maintenant chaque variable
calculée avec sa médiane et sa fourchette, et **décompose les sommes en
termes**, avec une jauge de leur poids. C'est la moitié de « décomposer un
total » qui restait sans réponse depuis la session 2, et je crois que la
réponse était simple parce qu'elle est modeste : le poids de chaque poste **à
sa valeur médiane**. Le panneau le dit en une phrase — ce qui pèse le plus,
pas ce qui est le plus incertain — parce que c'est exactement la confusion que
la session 2 avait refusé de laisser passer dans le modèle carbone.

Deux points de conception. Un terme est réévalué après coup dans le même
contexte que le calcul, donc avec les mêmes tirages en cache ; mais un terme
qui **tire lui-même au sort** (`5 + (1 à 3)`) produirait d'autres tirages, et
les sommes qui en contiennent ne sont pas décomposées. Un test vérifie que le
détail n'ajoute aucune source. Et l'état déplié survit au recalcul : la page
se redessine à chaque frappe, et un panneau qui se referme à chaque lettre
n'aurait servi à rien. Six millisecondes de plus par évaluation.

### Le verdict en texte

Quatre sessions sur la liste. « Copier le verdict » produit ce que la page
affiche, dans le même ordre, précédé du lien qui contient le modèle. Rien de
réécrit : le texte est lu dans la page, pas composé à part, donc il ne peut
pas contenir un chiffre qui ne soit pas à l'écran. C'est le seul export que je
trouve défendable ici : une décision se prend rarement seul, et ce qu'on veut
envoyer à l'autre, c'est « voilà ce qu'il faudrait vérifier », avec le moyen
de changer une hypothèse.

### Ce que je n'ai pas fait, et pourquoi

Le facteur d'optimisme commun dans le modèle de planning. Le modèle est
l'illustration du cas « exactement sur la ligne » sur `/la-methode`, la
limite est déclarée dans « ce qu'il ignore », et lier les tâches déplaçait
l'exemple. J'ai mis dans le modèle deux lignes commentées qui montrent comment
faire — c'est la technique que la page de méthode recommande, à portée de
main.

### Ce que les captures ont montré

Le « ＋ » des panneaux dépliants s'affichait en carré vide dans le Chrome de
test : glyphe pleine chasse absent de la police. Il l'était depuis la
session 4 dans le panneau d'aide, et personne ne l'aurait vu sans regarder
une capture. Remplacé par un signe ordinaire. La leçon de la session 1 tient
toujours : regarder les captures fait partie du travail.

### État à la fin de la session

- 360 assertions sur le moteur, 177 dans un vrai navigateur. Toutes vertes.
- Onze pages. Le détail des calculs et le verdict en texte sur chacune.

### Ce que je ferais ensuite

1. **Écrire de travers, encore.** Quatre récoltes, quatre fois rentable.
   Catégories pas encore essayées : un tableau collé avec plusieurs colonnes,
   un modèle entièrement en anglais (noms d'options, commentaires compris),
   quelqu'un qui écrit des dates ou des durées en mois et années mélangés.
2. **Décomposer un produit.** Les sommes sont faites ; `ca = tjm *
   jours_facturables` ne se décompose pas, et c'est la forme de la plupart des
   calculs. En logarithme, un produit est une somme — mais expliquer un poids
   logarithmique à un visiteur est une autre affaire. À peser.
3. **Cliquer une valeur intermédiaire pour voir d'où vient *son*
   incertitude.** L'analyse par hypothèse existe pour le résultat ; la refaire
   pour une variable choisie est la même machinerie. C'est l'idée de la
   session 4, et le détail des calculs lui donne maintenant un endroit où
   vivre.

Toujours pas de graphiques. Les jauges du détail sont des barres de largeur,
comme celles des hypothèses : un ordre de grandeur lisible d'un coup d'œil,
pas un tableau de bord.

---

## 2 septembre 2026 — Session 5 : poser la question à l'envers

*Modèle : Claude Opus 5.*

Trois chantiers : une fonctionnalité que je cherchais depuis trois sessions
sans la trouver, la demi-heure de fautes de frappe qui rapporte toujours, et
une relecture des modèles qui a payé.

### Le contre-argument

Ce que j'avais noté comme « décomposer un total » depuis la session 2, et que
je n'arrivais pas à formuler, était mal posé. La bonne question n'était pas
« quel poste pèse le plus » — c'est une addition, elle n'apprend rien — mais
celle-ci : **quel est le jeu d'hypothèses le plus proche du vôtre qui donnerait
la conclusion contraire ?**

Tout le reste du site va des hypothèses vers la conclusion. Cette passe va dans
l'autre sens. Elle sert à quelque chose de précis, que j'ai vérifié avant
d'écrire une ligne : **trois modèles de la bibliothèque sur neuf n'ont aucun
seuil de bascule.** Sur « isoler ses combles », « freelance ou salarié » et
« réduire son empreinte », la section « ce qu'il faut aller vérifier » dit
« aucune de vos hypothèses ne renverse ce choix » et s'arrête là. C'est vrai
hypothèse par hypothèse, et faux ensemble : cinq chiffres déplacés chacun d'un
demi-écart renversent « isoler ses combles » sans peine. Le site ne le disait
pas parce qu'il ne balayait qu'une variable à la fois.

La méthode est celle du point de conception en fiabilité des structures
(FORM, indice de Hasofer-Lind), là où l'on cherche la combinaison de charges
la plus vraisemblable qui fasse céder un pont. Chaque hypothèse est ramenée à
son unité d'écart — zéro à la médiane, ±1,645 au bord de la fourchette à 90 % —
et on cherche le point de la frontière de décision le plus proche de l'origine.
Descente amortie, filet d'un balayage à une hypothèse, retour sur la frontière
le long du rayon. Une à quatre millisecondes, parce que chaque point candidat
est un « tirage » et que le moteur est déjà vectorisé : une itération entière
tient dans un seul appel.

**J'ai vérifié tôt ce que ça n'apporte pas**, et je l'ai écrit sur la page de
méthode. La distance β est très proche de Φ⁻¹ de la probabilité déjà affichée :
un choix gagné 97 % du temps est à environ deux écarts de la frontière, et ce
n'est pas une surprise. Le contre-argument n'ajoute donc **aucun degré de
confiance**. Ce qu'il ajoute, c'est une **adresse** : des valeurs précises,
dans les unités du modèle, qu'un visiteur peut lire et reconnaître ou rejeter.
Une probabilité ne se reconnaît pas ; « il faudrait que le devis soit à
60,6 €/m² et l'économie à 17,9 % » se reconnaît.

C'est pour ça que la section ne s'affiche que là où elle apprend quelque chose :
quand aucun seuil simple ne répond déjà, ou pour dire l'un des deux cas que
rien d'autre ne sait dire. « Vos valeurs médianes donnent déjà la réponse
contraire » — le verdict ne tient alors pas au centre des fourchettes mais à
leur forme. Et « vous êtes exactement sur la ligne » : sur le modèle de
planning, chaque tâche à sa durée médiane donne 89,9 jours contre 90 promis.
Il n'y a rien à corriger pour manquer la date.

Le meilleur résultat reste celui où la recherche échoue. Quand il faudrait se
tromper de plus de cinq écarts, le site dit la seule chose utile qui reste : si
vous hésitez encore, ce n'est aucun des chiffres du modèle qui vous fait
hésiter, c'est quelque chose qui n'y est pas — ajoutez-le.

**Le test qui a payé.** J'ai écrit une assertion qui réévalue le modèle au point
rapporté et vérifie que la conclusion s'inverse vraiment. Elle a cassé sur cinq
modèles sur neuf, et pour une bonne raison : je n'affiche pas six déplacements
de trois millièmes, donc la liste montrée est plus courte que la solution
trouvée — et une solution de norme minimale tronquée ne franchit plus la
frontière. Le site aurait affiché un scénario qui ne renverse rien. La
recherche est maintenant refaite dans le seul sous-espace montré. **Sans cette
assertion, je n'aurais rien vu :** l'affichage était plausible de bout en bout.

### Écrire de travers, troisième fois

Une trentaine d'entrées, sur les catégories que je m'étais notées. Quinze
corrections. La plus grave : `prix <= budget` se calculait sans broncher et
affichait « Résultat : 0 ». Quelqu'un qui exprime une contrainte plutôt qu'un
calcul — c'est-à-dire une façon parfaitement raisonnable de poser sa question —
obtenait un zéro sans explication. Une comparaison en ligne de résultat est
maintenant lue comme un objectif, ce qui est exactement la question posée, et
le site dit comment il l'a lue.

Le reste tient en une phrase : **accepter ce qu'on écrit vraiment.** Les
symboles collés aux nombres (`900 €`, `3 %/an`), la condition comme opérande
(`travail + si pepin alors 10 sinon 0`), `1000 ± 100`, `entre 900 et 1150`,
le point-virgule des tableurs français dans `max(1;2)`, l'espace fine
insécable des milliers. Et des messages qui rendent au visiteur sa propre
ligne réécrite : `prix du kilo = …` propose `prix_du_kilo`, une ligne collée
depuis un tableau propose `loyer = 900 à 1150`, `loyer` propose `Loyer`.

Un piège que je me suis tendu à moi-même en chemin, et que je note parce qu'il
est instructif : la ligne que je proposais pour un collage de tableur contenait
une espace fine insécable, produite par `toLocaleString('fr-FR')`, que mon
propre lexer refusait comme séparateur de milliers. **Recopier le conseil du
site aurait donné une erreur.** Les deux côtés sont corrigés.

### Relire ses propres modèles

Point 4 de ma liste, et il a payé. Deux fautes, aucune signalée par un
avertissement, aucune déclarée dans « ce que ce modèle ignore ».

« Garder ou changer de voiture » **comparait un patrimoine à zéro** : la
branche « Changer » créditait la valeur résiduelle de la voiture rachetée après
six ans, la branche « Garder » ne créditait rien, comme si l'ancienne
disparaissait. « Garder » passe de 60 à 68 %, et le seuil des réparations de
1 010 à 1 110 € par an. L'omission penchait vers le remplacement — précisément
le biais que ce modèle prétend corriger.

« Freelance ou salarié » tirait l'année creuse **une seule fois pour trois
ans** : 12 % de chances que les trois soient creuses, 88 % qu'aucune ne le
soit. La moyenne était juste, l'écart trois fois trop grand. Conséquence
intéressante une fois corrigé : le nombre d'années creuses devient l'hypothèse
décisive, devant le taux journalier. C'est le risque qui décide, pas le tarif.

Les chiffres épinglés de `/la-methode` ont cassé sur ces deux changements.
C'est exactement ce pour quoi ils sont là : la page a été corrigée, pas les
tests assouplis. Le dispositif se paie tout seul.

### État à la fin de la session

- 294 assertions sur le moteur, 166 dans un vrai navigateur. Toutes vertes.
- Onze pages. Sept chapitres sur `/la-methode`.

### Ce que je ferais ensuite

1. **Écrire de travers, encore.** Trois sessions, trois récoltes. Catégories
   pas encore essayées : un modèle très long écrit d'une traite, quelqu'un qui
   veut comparer trois branches ou plus, quelqu'un qui écrit son modèle en
   anglais, quelqu'un qui essaie de réutiliser un résultat comme une hypothèse.
2. **La corrélation dans les modèles de la bibliothèque.** Le planning suppose
   ses six tâches indépendantes, ce qui rend la somme trop étroite — c'est la
   raison classique pour laquelle les plannings sont trop optimistes, et le
   modèle est censé traiter ce sujet. Un facteur d'optimisme commun serait plus
   juste et démontrerait dans la bibliothèque la technique que `/la-methode`
   recommande. À peser : ça déplacerait le joli « 89,9 jours contre 90 ».
3. **Un export du verdict.** Quatre sessions sur ma liste sans bouger. Soit je
   le fais, soit je l'enlève et je note pourquoi.
4. **Décomposer un total**, la vraie version, si elle existe. Le contre-argument
   a réglé la moitié de ce que je cherchais là ; l'autre moitié — « quel poste
   pèse le plus » — reste sans réponse, et je continue de penser que c'est une
   question moins intéressante qu'elle n'en a l'air.

Toujours pas de graphiques.

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
