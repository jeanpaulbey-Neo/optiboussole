// methode.js — le contenu de /la-methode.
//
// Les idées sur lesquelles le site est construit vivaient dans un panneau
// dépliant. Elles méritent une page : ce sont des outils classiques de théorie
// de la décision, et il n’existe presque rien en français qui les mette à
// portée de quelqu’un qui n’en a pas fait.
//
// Chaque exemple est calculé par le moteur du site, et les chiffres cités ici
// sont ceux qu’il rend. Un test les revérifie.

export const METHODE = {
  titre: 'La méthode',
  question:
    "Comment Boussole passe de fourchettes à une direction d’enquête : ce que veut dire un intervalle à 90 %, comment se mesure la part d’incertitude d’une hypothèse, pourquoi le poste le plus lourd n’est pas le plus incertain, d’où sort un seuil de bascule, ce que vaut une information, s’il faut aller la chercher ou décider tout de suite, ce qu’on perd quand on se trompe, et ce que la méthode ne sait pas faire.",
  intro: [
    "Boussole vous dit **lequel de vos chiffres décide de votre choix**, à partir de quelle valeur ce choix bascule, et ce que ça vaut d’aller chercher ce chiffre — comme ce qu’il est inutile d’aller chercher.",
    "Rien de ce qui suit ne lui est propre : ce sont des outils classiques de l’analyse de décision. Ils sont simplement restés dans les manuels, et ce site est une tentative de les rendre utilisables sans les avoir étudiés. Cette page explique chaque chiffre affiché, et ce qu’il ne dit pas.",
  ],
  sections: [
    {
      titre: 'Vous ne savez pas le chiffre : donnez-en deux',
      blocs: [
        "C’est le seul chiffre que le site vous demande, et c’est délibéré. Plutôt qu’une valeur unique que vous n’avez pas, vous donnez deux bornes entre lesquelles vous pensez qu’il y a **neuf chances sur dix** que la vraie valeur se trouve.",
        "```\nloyer = 900 à 1150\n```",
        "De cette fourchette, le site tire une loi de probabilité. Si les deux bornes sont positives, c’est une **lognormale** : la médiane est la moyenne *géométrique* des bornes, pas leur milieu.",
        "```\nx = 100 à 400\n```",
        "> médiane 200, et non 250. Neuf tirages sur dix tombent entre 100 et 400, aucun n’est négatif.",
        "Ce choix n’est pas cosmétique. Presque toutes les grandeurs qu’on estime — un prix, une durée, un nombre de clients — sont multiplicatives : se tromper d’un facteur deux vers le haut est aussi plausible que de se tromper d’un facteur deux vers le bas. Une loi normale, elle, autoriserait des valeurs négatives et donnerait un poids déraisonnable au milieu.",
        "Quand les bornes changent de signe — `-2 % à 5 %` — le site utilise une normale. Quand la borne basse vaut exactement zéro — `0 à 100` — il replie la normale sur les positifs : écrire zéro, c’est dire qu’on exclut le négatif.",
        "**Si donner deux bornes ne vous vient pas**, le formulaire pose la question dans l’autre sens : la valeur que vous donneriez si on vous en demandait une seule, puis celle que vous n’atteindriez qu’une fois sur dix. Le site en fait la même fourchette — la première est la médiane, la seconde une borne, et l’autre borne se déduit en miroir. On répond mieux à « d’habitude, 1 200 » et « une mauvaise année, 1 800 » qu’à « 800 à 1 800 », et c’est pourtant la même chose.",
        "**Et voici le point faible de toute la méthode.** Quand on demande à quelqu’un un intervalle dans lequel il est sûr à 90 %, la vraie valeur y tombe en pratique autour d’une fois sur deux. C’est l’un des résultats les plus solides de la psychologie du jugement, il s’observe chez les experts sur leur propre domaine, et il ne s’améliore pas en y faisant attention. Le site en tient compte — voir *et si vos fourchettes étaient trop étroites*, plus bas.",
      ],
    },
    {
      titre: "D’où vient l’incertitude",
      blocs: [
        "Une fois toutes les fourchettes tirées vingt mille fois, le site regarde, pour chaque hypothèse, **quelle part de l’incertitude du résultat elle porte à elle seule**.",
        "```\ngros  = 0 à 100\npetit = 49 à 51\ny = gros + petit\n```",
        "> `gros` porte 100 % de l’incertitude, `petit` 0 %. Connaître `gros` exactement ferait passer la fourchette du résultat de 93 à 5 de large.",
        "C’est trivial sur cet exemple, et c’est justement l’intérêt : sur un modèle de trente lignes, l’hypothèse qui domine n’est presque jamais celle qu’on croit, et elle est souvent une de celles qu’on avait écrites sans réfléchir.",
        "**La part est calculée sur les rangs du résultat, pas sur ses valeurs.** C’est un détail technique qui change tout. L’indice classique compare la variance conditionnelle à la variance totale ; sur une grandeur à queue longue — c’est-à-dire sur presque tout — la variance est confisquée par une poignée de tirages extrêmes, et l’indice s’effondre :",
        "```\na = 1 à 1000\ny = a\n```",
        "> Ici `y` **est** `a` : la part devrait valoir 1. Calculée sur les valeurs, elle donne 0,27. Calculée sur les rangs, 0,998.",
        "On perd l’interprétation « décomposition de la variance en unités d’origine » ; on gagne un chiffre juste. L’échange est bon.",
        "Attention à ce que cette part ne dit pas : elle mesure l’incertitude, **pas la masse**. Dans un budget, le poste le plus gros et le poste le plus incertain sont rarement le même, et c’est le second que le site désigne. Le chapitre suivant montre les deux côte à côte.",
      ],
    },
    {
      titre: 'Le poste le plus lourd n’est pas celui à vérifier',
      blocs: [
        "La part d’incertitude répond à « de quoi dépend le résultat ? ». Devant une addition, on se pose une autre question, plus simple : **quel poste pèse le plus ?** Ce sont deux questions distinctes, et le site répond aux deux, côte à côte, dans le panneau *Le détail des calculs* sous les résultats.",
        "Chaque valeur calculée y est donnée avec sa médiane et sa fourchette à 90 % — ce qu’un tableur montre dans chaque cellule, et qu’un modèle écrit en quelques lignes cache. Les sommes y sont décomposées en postes, avec le poids de chacun **à sa valeur médiane**. Sur « le vrai prix du kilomètre » :",
        "```\nfixe = decote_an + assurance + entretien + reparations\n     + pneus + controle + stationnement\n```",
        "> `fixe` vaut 4 240 € par an. La décote en fait 1 930 €, près de la moitié ; l’assurance 670 € ; les réparations 350 €. Mais l’incertitude de `fixe` est portée par `reparations` à 39 % et par `stationnement` à 28 % — et la décote n’y est pour presque rien.",
        "**Ce qui pèse et ce qu’on ignore ne coïncident pas.** La décote est le poste le plus lourd de loin, et c’est le mieux connu : un prix d’achat, une durée, une valeur de revente qu’on lit dans les annonces. Les réparations pèsent près de six fois moins, et elles sont ce qu’on ne sait pas. Un tableur donnerait la première colonne. C’est la seconde qui dit où passer son temps, et on ne la voit qu’en tirant les fourchettes au sort.",
        "Le poids est pris à la médiane de chaque poste, parce que c’est la seule définition qu’on puisse défendre : un poste à `0 à 900` ne pèse pas une fraction fixe du total, il pèse 11 % dans le scénario central et bien plus dans un mauvais. Le site le dit tel quel, sans prétendre à une décomposition qui vaudrait dans tous les tirages.",
        "**Un produit ne se décompose pas, et ce n’est pas un manque.** Dans `ca = tjm * jours`, chaque facteur pèse exactement autant que l’autre : doublez l’un ou l’autre, le résultat double. La question « quel facteur pèse le plus » n’a pas de réponse, et un poids affiché serait une invention. Ce qui distingue les facteurs d’un produit, c’est uniquement leur incertitude :",
        "```\na = 1 à 3\nb = 10 à 12\nc = 100 à 110\ny = a * b * c\n```",
        "> `c` est le plus grand facteur, et `a` porte 96 % de l’incertitude de `y`. C’est la seule chose utile à dire sur ce produit, et c’est celle que le site dit.",
      ],
    },
    {
      titre: 'À partir de quel montant la réponse change',
      blocs: [
        "Quand vous comparez deux branches, savoir laquelle gagne « en moyenne » ne suffit pas. Ce qui sert, c’est de savoir **à partir de quelle valeur la réponse change de camp**.",
        "```\ncout_actuel  = 1200\ncout_nouveau = 700 à 1900\noption \"Garder\"  = -cout_actuel\noption \"Changer\" = -cout_nouveau\n```",
        "> Le verdict bascule vers « Garder » dès que `cout_nouveau` dépasse 1 200 — ce qui arrive 45 % du temps d’après votre fourchette.",
        "Un seuil est une phrase qu’on peut emporter : on peut le surveiller, le vérifier, le négocier. Une moyenne, non.",
        "Le calcul fige toutes les autres hypothèses à leur médiane et balaie celle-là sur sa plage plausible. C’est donc un seuil **toutes choses égales par ailleurs** : si deux hypothèses bougent ensemble, la frontière réelle n’est pas exactement là. Le site le dit plutôt que de faire semblant d’une précision qu’il n’a pas.",
        "**Sauf pour les tirages discrets**, et c’est une exception qu’il a fallu corriger. Un événement qui arrive ou n’arrive pas n’a pas de médiane qui veuille dire quelque chose : la sienne vaut « il n’arrive pas ». Un comptage rare non plus : la médiane d’un nombre d’années creuses de moyenne 0,36 vaut zéro. Balayer avec elles, c’est chercher le seuil **en supposant le sinistre écarté**.",
        "Le site le faisait, et cela se voyait sur trois de ses propres modèles. Les seuils de « ce projet sera-t-il prêt à temps ? » étaient calculés sans l’incident hors planning ; ceux de « réparer ou remplacer ? » en supposant la réparation acquise ; et « freelance ou salarié » n’avait **aucun seuil sur le taux journalier**, faute d’année creuse pour en créer un. Dans les trois cas, c’est exactement ce que le modèle prétend traiter.",
        "Ces tirages-là sont donc rejoués, sur une suite régulière, et le résultat est moyenné. Le seuil porte alors sur l’espérance de chaque branche — la grandeur que le verdict compare. Sur « réparer ou remplacer ? », le seuil de la durée de vie après réparation est passé de 2,9 à 4,2 années. Sur « freelance ou salarié », un seuil est apparu là où il n’y en avait pas : en dessous de 471 € par jour, mieux vaut rester salarié.",
      ],
    },
    {
      titre: 'Ce qui vous ferait changer d’avis',
      blocs: [
        "Le seuil de bascule déplace **une** hypothèse et laisse les autres à leur médiane. Or il arrive très souvent qu’aucune hypothèse seule ne renverse le verdict, alors que plusieurs déplacées ensemble, chacune d’un cheveu, le renversent sans peine. Le site pose alors la question à l’envers : **quel est le jeu d’hypothèses le plus proche du vôtre qui donnerait la conclusion contraire ?**",
        "```\na = 90 à 110\nb = 90 à 110\nc = 90 à 110\noption \"Rester\" = a + b + c\noption \"Partir\" = 320\n```",
        "> « Partir » l’emporte 97 % du temps. Aucune des trois hypothèses ne renverse ce choix à elle seule : il faudrait que `a` dépasse 121, très au-delà de sa fourchette. Mais si les trois valaient 107 au lieu de 99,5 — chacune bien à l’intérieur de sa fourchette —, « Rester » l’emporterait.",
        "C’est le genre de scénario qu’on ne trouve pas en tâtonnant une variable à la fois, et c’est pourtant celui qui décrit le mieux un désaccord réel : on se trompe rarement sur un seul chiffre, on se trompe dans un sens, sur plusieurs à la fois.",
        "**Comment se mesure la distance.** Chaque hypothèse est ramenée à son unité propre : zéro à sa médiane, ±1,645 aux bornes de sa fourchette à 90 %. Le site cherche alors le point de la frontière de décision le plus proche de l’origine. Sur l’exemple, ce point est à **2,01 écarts** — un peu au-delà du bord des fourchettes, donc improbable sans l’être absurdement. C’est l’indice de fiabilité de Hasofer-Lind, emprunté au calcul des structures, où l’on cherche de la même façon la combinaison de charges la plus vraisemblable qui fasse céder un pont.",
        "**Ce que cette distance n’ajoute pas.** Elle dit à peu près la même chose que la probabilité déjà affichée dans le verdict : un choix gagné 97 % du temps est, sans surprise, à environ deux écarts de la frontière. Ce que le contre-argument apporte n’est pas un degré de confiance de plus, c’est une **adresse** — les valeurs précises, dans les unités de votre modèle, d’un scénario que vous pouvez lire et reconnaître, ou rejeter.",
        "Le site ne l’affiche donc que là où il apprend quelque chose : quand aucune hypothèse ne bascule seule, ou pour signaler l’un des deux cas que rien d’autre ne dit.",
        "**Vos valeurs médianes disent déjà l’inverse.** Le verdict ne tient alors pas au centre de vos fourchettes mais à leur forme. C’est une hésitation, pas une réponse.",
        "**Vous êtes exactement sur la ligne.** Sur « ce projet sera-t-il prêt à temps ? », chaque tâche à sa durée médiane donne 89,9 jours contre 90 promis. Il n’y a rien à corriger pour manquer la date : le moindre écart suffit.",
        "Et quand aucun scénario plausible ne renverse le verdict — quand il faudrait s’être trompé de plus de cinq écarts sur l’ensemble —, le site dit la seule chose utile qui reste : si vous hésitez encore, ce n’est aucun des chiffres du modèle qui vous fait hésiter. C’est quelque chose qui n’y est pas. Le travail n’est plus de mieux estimer, il est d’ajouter ce qui manque.",
      ],
    },
    {
      titre: "Ce que ça vaut d’aller chercher le chiffre",
      blocs: [
        "C’est l’idée centrale du site, et la moins connue. La question n’est pas « de quoi suis-je le plus incertain ? » mais **« qu’est-ce que ça vaut, de lever ce doute ? »**",
        "Formellement : ce que vous gagneriez, en moyenne, à connaître une hypothèse exactement *avant* de choisir, plutôt qu’à choisir maintenant avec ce que vous savez. Sur l’exemple ci-dessus, 141 € — et comme il n’y a qu’une seule hypothèse, c’est aussi le maximum que puisse rapporter n’importe quelle enquête.",
        "Le renversement que produit ce calcul est le suivant : **une hypothèse peut être massivement incertaine et totalement sans intérêt.** Elle fait beaucoup bouger le résultat, mais jamais assez pour renverser le choix. Y consacrer une semaine ne changerait rien à ce que vous ferez.",
        "L’inverse existe aussi. Sur « garder ou changer de voiture », les réparations à venir portent 54 % de l’incertitude *et* décident : le verdict bascule au-delà de 1 110 € par an, ce qui arrive 3 fois sur 10, et lever ce doute vaut environ 630 €. Aller chercher ses factures des trois dernières années est, littéralement, l’heure la mieux payée de la décision.",
        "**Mais toute incertitude ne s’enquête pas.** Sur « répondre à un appel d’offres ? », ce qui pèse le plus est de loin l’issue de la consultation elle-même — et aucun coup de téléphone ne la lèvera avant le dépôt. La valeur d’information s’y calcule quand même, et elle est énorme, mais elle mesure ce que vaudrait une boule de cristal, pas ce que vaut une heure de travail. Le site nomme donc ces tirages tout ou rien pour ce qu’ils sont, et désigne à côté la meilleure hypothèse sur laquelle vous ayez encore la main.",
        "Et quand la valeur de l’information est faible devant l’enjeu — moins de 2 % de l’écart entre la meilleure et la pire branche — le site vous dit d’arrêter d’enquêter. Sur « isoler ses combles », aucune hypothèse ne renverse le choix : la question est tranchée, quelle que soit votre ignorance.",
      ],
    },
    {
      titre: 'Aller savoir, ou décider maintenant',
      blocs: [
        "Le chapitre précédent donne un prix à une information. Il laisse pourtant le travail à moitié fait : « lever ce doute vaut 639 € » n’est pas une décision. La décision est **639 € contre ce que coûte d’aller le lever** — un diagnostic, trois devis, six semaines d’attente. Cette comparaison-là, le site la faisait faire au visiteur. Il la fait maintenant lui-même, à condition qu’on lui dise le prix :",
        "```\nproduction = 900 à 1350\noption \"Installer\"     = production * 13,2 - 14500\noption \"Ne rien faire\" = 0\nsavoir production = 250 €\n```",
        "> Savoir `production` avant de choisir vaut **639 €**, pour 250 € : allez-y, vous y gagnez 389 € en moyenne. Et voici ce qu’il faudra en faire : en dessous de 1 103 kWh par kWc et par an, « Ne rien faire » ; au-dessus, « Installer » — ce qui arrive 5 fois sur 10.",
        "`attendre` s’écrit à la place de `savoir` et veut dire la même chose ; le premier se lit mieux quand ce qu’on dépense est du temps, le second quand c’est une facture. Le coût peut être une formule ou une fourchette : `attendre devis = 3 * loyer`.",
        "**La seconde phrase compte plus que la première.** Un prix ne se met pas en œuvre ; une règle, si. « En dessous de 1 103, ne rien faire » est une consigne qu’on peut emporter chez l’installateur, et c’est la partie qu’aucun simulateur ne calcule.",
        "Elle se lit sur le même découpage que le prix : les tirages sont triés selon l’hypothèse en question, et dans chaque tranche le site regarde quelle branche a la meilleure espérance. Le prix et la règle sont donc deux lectures du même calcul, et ne peuvent pas se contredire. **C’est aussi ce qui la distingue d’un seuil de bascule** : le seuil fige les autres hypothèses à leur médiane, la règle les laisse varier et moyenne sur elles — ce qui est exactement la situation du jour où vous connaîtrez celle-ci et rien d’autre. Sur « installer des panneaux solaires », le seuil dit 1 179 et la règle dit 1 158 : l’écart est le prix du « toutes choses égales par ailleurs ».",
        "**Et voici le cas qui justifie tout le reste.** Rendez la même installation nettement rentable — 9 000 € au lieu de 14 500 — et le calcul change de nature :",
        "```\nproduction = 900 à 1350\noption \"Installer\"     = production * 13,2 - 9000\noption \"Ne rien faire\" = 0\nsavoir production = 250 €\n```",
        "> Quel que soit le résultat, vous feriez la même chose : « Installer ». Cette information ne vaut rien ici — non parce qu’elle serait mauvaise, mais parce qu’elle ne déplace pas votre geste. Ne le faites pas : ce serait 250 € pour rien.",
        "Une étude parfaitement exacte, sur l’hypothèse la plus incertaine du modèle, peut valoir exactement zéro. C’est le renversement le plus utile de toute cette page : **l’information ne vaut que ce qu’elle change**, et on peut le savoir avant de la payer.",
        "**Le prix affiché est celui d’une information parfaite.** Une étude d’ombrage ne vous donnera pas la production exacte des vingt prochaines années ; un devis n’est pas la facture finale. Le chiffre est donc une **borne haute**, et c’est précisément ce qui le rend concluant du mauvais côté : quand il est déjà sous le coût, il n’y a plus à discuter de la qualité de l’enquête — aucune ne se paiera. Quand il est au-dessus, il faut encore se demander de combien l’enquête réelle s’approche de la perfection.",
        "Reste une chose que le site ne calcule pas : le coût de l’attente elle-même, quand la décision se ferme pendant qu’on enquête. Un bien qui part, une offre qui expire, une aide qui baisse au trimestre suivant. Si c’est votre cas, mettez-le dans le coût — c’est ce que la ligne est faite pour recevoir.",
      ],
    },
    {
      titre: 'Ce que vous jouez',
      blocs: [
        "Le verdict commence toujours par une fréquence — \u00ab\u202fAcheter\u202f\u00bb l’emporte 59 % du temps. C’est une réponse à « laquelle des deux branches ? », et c’est une réponse incomplète : **elle ne dit rien des 41 % restants**. Gagner six fois sur dix en risquant peu et gagner six fois sur dix en risquant gros sont deux décisions différentes, et une probabilité de victoire les affiche à l’identique.",
        "Le site donne donc les deux versants de l’écart entre la branche retenue et sa meilleure rivale, tirage par tirage : ce qu’on gagne quand on a raison, ce qu’on perd quand on a tort.",
        "> Sur « louer ou acheter » : quand « Acheter » l’emporte — 6 fois sur 10 —, c’est **36 k€** de mieux en médiane. Quand « Louer » aurait été meilleur — 4 fois sur 10 —, c’est **26,3 k€** de moins, et jusqu’à **78,3 k€** dans le pire vingtième de ces cas-là.",
        "Le verdict de ce modèle est « à égalité ». Il l’est en fréquence ; il ne l’est pas du tout en enjeu. L’inverse se voit aussi bien : sur « freelance ou salarié », où le verdict est net — 8 fois sur 10 —, le pire vingtième des 2 fois restantes coûte 46,9 k€, soit plus que les 33,6 k€ que la branche rapporte quand elle gagne. Ce chiffre-là ne change pas la recommandation. Il change ce qu’il faut avoir en face avant de la suivre.",
        "La queue est lue **parmi les seules simulations perdantes**, et non sur l’ensemble des tirages. Prise sur l’ensemble, elle tombait sous la médiane des pertes dès qu’on se trompe à peine plus d’une fois sur vingt : un « pire cas » moins grave que le cas courant, ce qui n’a aucun sens.",
        "**Deux règles de décision, et elles peuvent se contredire.** La branche que le site retient est celle de meilleure espérance ; celle que la phrase annonce comme gagnante est celle qui l’emporte le plus souvent. Rien ne garantit que ce soit la même.",
        "```\ngros = bernoulli(10 %)\noption \"Sûr\"     = 100\noption \"Loterie\" = si gros alors 300 sinon 90\n```",
        "> « Loterie » rapporte le plus en moyenne — 111 € contre 100 € — mais c’est « Sûr » qui l’emporte, 9 fois sur 10. Quand « Loterie » gagne, c’est 200 € de mieux ; quand elle perd, 10 € de moins.",
        "Ce n’est pas un cas d’école : « répondre à un appel d’offres ? », dans la bibliothèque, a exactement cette forme. Une mise certaine — les jours passés à monter le dossier — contre un gain rare et gros. Répondre rapporte le plus en moyenne ; passer son tour l’emporte huit fois sur dix.",
        "Le site affichait ici le titre « À égalité », en marquant « retenue » une branche qui perd neuf fois sur dix et en donnant sa fréquence de victoire, 10 %, comme si c’était celle du vainqueur. Il montre maintenant les deux titres, et il cesse de trancher.",
        "**Pourquoi ne pas retenir simplement celle qui gagne le plus souvent ?** Parce que ce n’est pas une règle de décision. Elle ignore les montants, donc elle préfère perdre un euro neuf fois plutôt que d’en gagner mille une fois. Et comparée deux à deux sur trois branches ou plus, elle peut tourner en rond — A l’emporte sur B, B sur C, C sur A — sans désigner personne. L’espérance n’a pas ce défaut : c’est pourquoi c’est elle qui décide ici.",
        "**Mais l’espérance suppose que vous puissiez rejouer.** Elle est la bonne règle quand le coup se répète assez pour que les moyennes se réalisent, et quand le mauvais cas vous laisse en état de continuer. Aucune de ces deux conditions n’est écrite dans votre modèle, et aucun calcul ne les devinera. C’est pour cela que le site montre l’enjeu des deux côtés au lieu de le résumer : le chiffre qui décide vraiment est celui que vous seul pouvez mettre en face de « 78,3 k€ ».",
      ],
    },
    {
      titre: 'Et si vos fourchettes étaient trop étroites',
      blocs: [
        "Tout ce qui précède suppose que vos fourchettes sont honnêtes. Comme elles ne le sont probablement pas — voir plus haut —, le site pose une dernière question : **et si elles étaient trop étroites ?**",
        "Il élargit alors toutes vos fourchettes d’un facteur croissant, médiane inchangée, et regarde à partir de quand votre conclusion tombe. L’étirement est multiplicatif sur les grandeurs positives, donc une fourchette élargie ne devient jamais négative ; les lois discrètes ne sont pas touchées, parce qu’une probabilité ne s’étire pas comme une fourchette.",
        "> Sur « louer ou acheter », il suffit de fourchettes 2,5× trop étroites pour que le verdict s’inverse. Sur « isoler ses combles », la conclusion tient jusqu’à 6× plus large.",
        "Le second cas est le plus instructif. Il signifie que cette conclusion-là ne dépend pas de la justesse de vos fourchettes, mais de leurs **valeurs centrales** : ce n’est pas votre incertitude qu’il faut réduire, ce sont vos ordres de grandeur qu’il faut vérifier.",
      ],
    },
    {
      titre: 'Ce que la méthode ne sait pas faire',
      blocs: [
        "**Elle suppose vos hypothèses indépendantes.** Sauf là où vous les liez par une formule. Dans la réalité, un taux de crédit, une inflation des loyers et un rendement de placement suivent la même conjoncture. Cela s’écrit, et c’est même la bonne façon de le dire :",
        "```\nconjoncture = -1 à 1\nrevalorisation = 1,5% + 2% * conjoncture + (-1% à 1%)\nhausse_loyer   = 2% + 1% * conjoncture\n```",
        "Le site désigne alors `conjoncture` comme l’hypothèse décisive, ce qui est plus juste — et plus utile — que de désigner l’une des deux qu’elle pilote.",
        "**Elle ne connaît aucune donnée.** Aucun barème, aucun taux, aucun prix de marché. Tous les chiffres sont ceux que vous écrivez ; les modèles de départ ne sont que des ordres de grandeur à remplacer. C’est une limite, et c’est aussi ce qui garantit que rien de ce que vous tapez ne quitte votre navigateur.",
        "**Elle vérifie la cohérence, jamais la pertinence.** Un modèle qui oublie un poste entier sera calculé impeccablement et répondra à côté. C’est pourquoi chaque page de modèle dit ce que le sien ignore : lisez-le avant de croire le verdict.",
        "**Elle est numérique.** Vingt mille tirages donnent une probabilité à un demi-point près environ. Le générateur est initialisé de la même manière à chaque fois : deux calculs du même modèle rendent exactement le même résultat, ce qui évite que l’affichage frémisse pendant que vous tapez.",
        "**Et elle ne verra jamais ce qui ne s’écrit pas en chiffres.** Quand deux branches sont à égalité, le calcul a fini son travail, et il reste tout ce qui compte vraiment.",
      ],
    },
  ],
};
