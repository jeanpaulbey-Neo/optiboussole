// methode.js — le contenu de /la-methode.
//
// Les cinq idées sur lesquelles le site est construit vivaient dans un panneau
// dépliant. Elles méritent une page : ce sont des outils classiques de théorie
// de la décision, et il n’existe presque rien en français qui les mette à
// portée de quelqu’un qui n’en a pas fait.
//
// Chaque exemple est calculé par le moteur du site, et les chiffres cités ici
// sont ceux qu’il rend. Un test les revérifie.

export const METHODE = {
  titre: 'La méthode',
  question:
    "Comment Boussole passe de fourchettes à une direction d’enquête : ce que veut dire un intervalle à 90 %, comment se mesure la part d’incertitude d’une hypothèse, d’où sort un seuil de bascule, ce que vaut une information, et ce que la méthode ne sait pas faire.",
  intro: [
    "Boussole ne cherche pas à vous donner un résultat. Elle cherche à vous dire **ce qu’il faut aller vérifier** — et, tout aussi utile, ce qu’il est inutile d’aller vérifier.",
    "Rien de ce qui suit ne lui est propre : ce sont des outils classiques de l’analyse de décision. Ils sont simplement restés dans les manuels, et ce site est une tentative de les rendre utilisables sans les avoir étudiés. Cette page explique chaque chiffre affiché, et ce qu’il ne dit pas.",
  ],
  sections: [
    {
      titre: 'Une fourchette à 90 %',
      blocs: [
        "C’est le seul chiffre que le site vous demande, et c’est délibéré. Plutôt qu’une valeur unique que vous n’avez pas, vous donnez deux bornes entre lesquelles vous pensez qu’il y a **neuf chances sur dix** que la vraie valeur se trouve.",
        "```\nloyer = 900 à 1150\n```",
        "De cette fourchette, le site tire une loi de probabilité. Si les deux bornes sont positives, c’est une **lognormale** : la médiane est la moyenne *géométrique* des bornes, pas leur milieu.",
        "```\nx = 100 à 400\n```",
        "> médiane 200, et non 250. Neuf tirages sur dix tombent entre 100 et 400, aucun n’est négatif.",
        "Ce choix n’est pas cosmétique. Presque toutes les grandeurs qu’on estime — un prix, une durée, un nombre de clients — sont multiplicatives : se tromper d’un facteur deux vers le haut est aussi plausible que de se tromper d’un facteur deux vers le bas. Une loi normale, elle, autoriserait des valeurs négatives et donnerait un poids déraisonnable au milieu.",
        "Quand les bornes changent de signe — `-2 % à 5 %` — le site utilise une normale. Quand la borne basse vaut exactement zéro — `0 à 100` — il replie la normale sur les positifs : écrire zéro, c’est dire qu’on exclut le négatif.",
        "**Et voici le point faible de toute la méthode.** Quand on demande à quelqu’un un intervalle dans lequel il est sûr à 90 %, la vraie valeur y tombe en pratique autour d’une fois sur deux. C’est l’un des résultats les plus solides de la psychologie du jugement, il s’observe chez les experts sur leur propre domaine, et il ne s’améliore pas en y faisant attention. Le site en tient compte — voir *la robustesse*, plus bas.",
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
        "Attention à ce que cette part ne dit pas : elle mesure l’incertitude, **pas la masse**. Dans un budget, le poste le plus gros et le poste le plus incertain sont rarement le même, et c’est le second que le site désigne.",
      ],
    },
    {
      titre: 'Le seuil de bascule',
      blocs: [
        "Quand vous comparez deux branches, savoir laquelle gagne « en moyenne » ne suffit pas. Ce qui sert, c’est de savoir **à partir de quelle valeur la réponse change de camp**.",
        "```\ncout_actuel  = 1200\ncout_nouveau = 700 à 1900\noption \"Garder\"  = -cout_actuel\noption \"Changer\" = -cout_nouveau\n```",
        "> Le verdict bascule vers « Garder » dès que `cout_nouveau` dépasse 1 200 — ce qui arrive 45 % du temps d’après votre fourchette.",
        "Un seuil est une phrase qu’on peut emporter : on peut le surveiller, le vérifier, le négocier. Une moyenne, non.",
        "Le calcul fige toutes les autres hypothèses à leur médiane et balaie celle-là sur sa plage plausible. C’est donc un seuil **toutes choses égales par ailleurs** : si deux hypothèses bougent ensemble, la frontière réelle n’est pas exactement là. Le site le dit plutôt que de faire semblant d’une précision qu’il n’a pas.",
      ],
    },
    {
      titre: 'Le contre-argument',
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
      titre: "La valeur de l’information",
      blocs: [
        "C’est l’idée centrale du site, et la moins connue. La question n’est pas « de quoi suis-je le plus incertain ? » mais **« qu’est-ce que ça vaut, de lever ce doute ? »**",
        "Formellement : ce que vous gagneriez, en moyenne, à connaître une hypothèse exactement *avant* de choisir, plutôt qu’à choisir maintenant avec ce que vous savez. Sur l’exemple ci-dessus, 141 € — et comme il n’y a qu’une seule hypothèse, c’est aussi le maximum que puisse rapporter n’importe quelle enquête.",
        "Le renversement que produit ce calcul est le suivant : **une hypothèse peut être massivement incertaine et totalement sans intérêt.** Elle fait beaucoup bouger le résultat, mais jamais assez pour renverser le choix. Y consacrer une semaine ne changerait rien à ce que vous ferez.",
        "L’inverse existe aussi. Sur « garder ou changer de voiture », les réparations à venir portent 54 % de l’incertitude *et* décident : le verdict bascule au-delà de 1 110 € par an, ce qui arrive 3 fois sur 10, et lever ce doute vaut environ 630 €. Aller chercher ses factures des trois dernières années est, littéralement, l’heure la mieux payée de la décision.",
        "Et quand la valeur de l’information est faible devant l’enjeu — moins de 2 % de l’écart entre la meilleure et la pire branche — le site vous dit d’arrêter d’enquêter. Sur « isoler ses combles », aucune hypothèse ne renverse le choix : la question est tranchée, quelle que soit votre ignorance.",
      ],
    },
    {
      titre: 'La robustesse',
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
