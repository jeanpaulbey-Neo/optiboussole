// cas.js — le contenu de /un-cas.
//
// Pourquoi cette page existe. Quatrième passage du lecteur extérieur :
// « je ne trouve nulle part de cas d'usage raconté du début à la fin », et,
// en résumé de tout le reste : « ce site est fait pour être exécuté, pas pour
// être lu par un humain ». Les quinze autres pages décrivent un outil, une
// méthode, une syntaxe. Aucune ne montre quelqu'un qui s'en sert, du moment où
// la question se pose au moment où elle est tranchée.
//
// Règle de cette page : **tout chiffre cité est calculé par le moteur**, et un
// test le revérifie sur le modèle servi. Si le modèle bouge, c'est la page
// qu'on corrige. C'est le même dispositif que /la-methode, et il a déjà attrapé
// deux erreurs de fond en douze sessions.
//
// Règle de ton : pas de personnage inventé avec un prénom et une vie. Le cas
// est décrit à la deuxième personne, parce que c'est le lecteur qui est censé
// s'y reconnaître, et parce que le site ne connaît la voiture de personne.

export const CAS = {
  titre: 'Un cas, du début à la fin',
  question:
    'Une décision ordinaire — garder une vieille voiture ou en acheter une plus récente — '
    + 'suivie du moment où la question se pose jusqu’à celui où elle est tranchée : ce qu’on '
    + 'écrit, ce que le site répond, ce qu’on va vérifier, et ce que ça change.',
  intro: [
    "Les autres pages de ce site décrivent un outil. Celle-ci montre quelqu’un qui s’en sert. C’est la même décision que celle qui tourne sur la page d’accueil, prise du début à la fin, avec les chiffres réels du moteur à chaque étape.",
    "Elle vaut surtout pour son milieu : le moment où le site dit d’aller chercher un chiffre, où on va vraiment le chercher, et où la réponse change. Sans ce moment-là, un simulateur n’est qu’un avis de plus.",
  ],
  sections: [
    {
      titre: 'Samedi matin, le devis du garage',
      blocs: [
        "Votre voiture a neuf ans. Le garagiste vient d’annoncer 1 200 € de réparations, et ajoute la phrase que tout le monde entend un jour : « à ce prix-là, vous feriez peut-être mieux d’en changer ».",
        "Vous n’en savez rien. Une occasion récente coûte dans les 18 000 €, elle consomme moins, elle tombera moins souvent en panne — mais elle décote, et l’argent part tout de suite. La vôtre roule encore.",
        "**Ce que vous ne pouvez pas faire, c’est chiffrer ça de tête.** Il y a huit ou dix quantités en jeu, dont plusieurs que vous ne connaissez pas, et elles ne se combinent pas dans le sens de l’intuition : la consommation se compare par litre, la décote en pourcentage annuel, la revente en une fois à la fin.",
        "**Ce que vous ne voulez pas faire non plus, c’est un tableur.** Un tableur exige un chiffre par case. Vous n’en avez pas : vous avez des idées vagues, et vous seriez obligé d’en inventer.",
      ],
    },
    {
      titre: 'Ce que vous écrivez : des fourchettes, pas des chiffres',
      blocs: [
        "C’est la seule chose que le site demande, et c’est tout le renversement. Là où un tableur veut une valeur, vous donnez **deux bornes entre lesquelles il y a neuf chances sur dix** que la vraie valeur tombe.",
        "```\nreparations = 400 à 1800        # par an, et ça monte avec l’âge\nrevente_actuelle = 2500 à 4500  # ce qu’elle vaut aujourd’hui\nconso_actuelle = 7 à 9          # L/100 km\n```",
        "Vous ne savez pas ce que la voiture coûtera en pannes l’an prochain. Vous savez qu’il serait très étonnant que ce soit moins de 400 € ou plus de 1 800 €. **Cette phrase-là, vous pouvez la signer** ; « 900 € » ne serait qu’une invention à laquelle tout le calcul se serait accroché.",
        "Le commentaire après le `#` n’est pas décoratif : le site s’en sert pour vous reparler de `reparations` en français plutôt qu’en identifiant.",
        "**Une chose surprend tout le monde ici, et il vaut mieux la savoir tout de suite.** Une fourchette dont les deux bornes sont positives n’est pas centrée sur son milieu :",
        "```\nx = 100 à 400\n```",
        "> médiane 200, et non 250.",
        "La valeur centrale est la moyenne *géométrique* des bornes. C’est voulu : sur un prix, une durée, un nombre de pannes, se tromper d’un facteur deux vers le haut est aussi plausible que vers le bas — pas de 150 € dans les deux sens. Sur `400 à 1800`, la médiane vaut donc 845 €, pas 1 100. Le repère pointillé au milieu de chaque fourchette affichée le montre : il tombe visiblement à gauche du centre.",
      ],
    },
    {
      titre: 'Ce que le site répond',
      blocs: [
        "Quatre phrases, dans cet ordre. La première est la moins intéressante.",
        "> **Garder l’actuelle.** L’emporte 67 % du temps : 3 fois sur 10, l’autre branche aurait été meilleure.",
        "Un verdict à 67 % n’est pas un verdict, c’est une préférence. Retenez-en surtout la seconde moitié : **une fois sur trois, ce conseil est mauvais.** Aucun simulateur ne vous dit ça, et c’est pourtant ce qu’il faut savoir avant de s’y fier.",
        "> **Ce que vous jouez.** Quand « Garder l’actuelle » l’emporte — 7 fois sur 10 —, c’est 2 776 € de mieux en médiane. Quand l’autre branche aurait été meilleure — 3 fois sur 10 —, c’est 1 920 € de moins, et jusqu’à 7 650 € dans le pire vingtième de ces cas-là.",
        "Deux branches peuvent se valoir en fréquence sans être le même pari. Ici vous gagnez souvent et modérément, vous perdez rarement et parfois beaucoup : la courbe sous cette phrase montre les deux versants, et l’aire de chaque côté du trait **est** la fréquence annoncée.",
        "> L’hypothèse qui pèse le plus sur ce choix est `reparations`, ce que l’ancienne vous coûtera en pannes et en entretien. Le verdict passe à « Changer » au-dessus de **1 109 €/an**, ce qui arrive 3 fois sur 10.",
        "Voilà la phrase utile. Sur huit hypothèses, **une seule décide** : elle porte 55 % de l’écart entre les branches. Et le site ne dit pas seulement laquelle, il dit **où est la frontière** — 1 109 € par an. Au-dessus, changez ; en dessous, gardez.",
        "> Lever le doute dessus vaut environ **631 €**. Où le trouver : vos factures de garage des trois dernières années, additionnées puis divisées par trois.",
        "C’est le chiffre que ce site existe pour produire. Il ne dit pas quoi décider : il dit **ce que vaut une heure de recherche dans un tiroir**, et il la compare à ce qu’elle coûte. Les 631 € sont ce que vous gagneriez en moyenne à connaître ce chiffre-là exactement avant de choisir.",
        "Toutes les autres hypothèses réunies pèsent bien moins : la décote 86 €, le prix de l’occasion 43 €, la consommation 29 €. **Chercher trois annonces de plus pour affiner le prix de l’occasion ne vaut pas le temps que ça prend.** C’est une information au moins aussi utile que la première.",
      ],
    },
    {
      titre: 'L’heure de travail',
      blocs: [
        "Vous ouvrez le tiroir. Trois ans de factures : 640 €, 810 €, 520 € — plus le devis de 1 200 € qui vient d’arriver, qui est le présent et non le passé.",
        "La moyenne des trois années tourne autour de 660 €. Vous savez que ça monte avec l’âge, donc vous n’écrivez pas 660 : vous écrivez une fourchette qui tient compte de la pente, et qui reste une fourchette parce que l’an prochain n’est pas écrit.",
        "```\nreparations = 500 à 900   # relevé sur trois ans de factures\n```",
        "Notez ce que cette ligne n’est pas : ce n’est pas un chiffre exact, et le site n’en demandait pas. Vous êtes passé d’une fourchette large et devinée à une fourchette étroite et **datée**. C’est tout ce qu’une heure de recherche pouvait produire, et c’est assez.",
      ],
    },
    {
      titre: 'Ce que ça change',
      blocs: [
        "> **Garder l’actuelle.** L’emporte 89 % des simulations. L’écart est net : votre incertitude actuelle ne suffit pas à le renverser.",
        "> Aucune de vos hypothèses ne renverse ce choix sur sa plage plausible. Chercher des valeurs plus précises ne changerait pas votre décision — c’est le moment d’arrêter d’enquêter et de décider.",
        "De 67 % à 89 %, et surtout : de « une fois sur trois, ce conseil est mauvais » à « une fois sur neuf ». Le pari a changé de nature — 3 002 € de mieux quand vous avez raison, 783 € de moins quand vous avez tort, contre 1 920 € avant.",
        "Et la valeur de l’information est tombée de 857 € à 110 €. **C’est la phrase la plus utile de la page** : il n’y a plus rien à aller chercher. Le devis d’un second garage, l’avis d’un ami, deux heures d’annonces : plus rien de tout cela ne déplacera votre geste. Vous pouvez décider.",
        "**Il faut dire ce qui serait arrivé dans l’autre cas**, sans quoi cette page ne serait qu’une démonstration flatteuse. Si le tiroir avait donné 900 à 1 600 € par an — un moteur qui commence à coûter —, le verdict serait passé à « Changer », mais à 58 % seulement : le site aurait affiché *à égalité*, et vous auriez su que les deux branches se valent à 466 € près sur six ans. Ce n’est pas un échec du calcul. C’est la vraie réponse : quand deux options se valent vraiment, aucun chiffre ne les départage, et ce qui décide est ailleurs.",
      ],
    },
    {
      titre: 'Ce qui n’était pas dans le modèle',
      blocs: [
        "Vous gardez la voiture, et vous faites les 1 200 € de réparations.",
        "Le modèle n’a compté ni le plaisir de conduire quelque chose de récent, ni l’angoisse de tomber en panne sur l’autoroute avec des enfants derrière, ni le fait que votre beau-frère vende la sienne en mars. Il n’a compté ni la fiscalité, ni le malus, ni ce que vaut de ne pas emprunter.",
        "**Ce n’est pas une lacune, c’est la répartition du travail.** Le calcul traite ce qui se chiffre — et il le traite mieux que vous, parce qu’il ne se fatigue pas sur huit variables corrélées. Ce qui ne se chiffre pas vous revient, et vous vous en occupez mieux avec 89 % au lieu de 67 % et un tiroir déjà vidé.",
        "Le site a servi à trois choses, et à trois seulement : vous empêcher d’inventer des chiffres, vous dire lequel des huit méritait votre heure, et vous dire quand arrêter de chercher. Il ne vous a pas dit quoi décider. C’est vous qui l’avez fait, et vous savez maintenant sur quoi.",
      ],
    },
  ],
};
