// fond.js — le texte de fond de chaque page de modèle.
//
// Les dix pages existaient mais ne donnaient aucune raison de rester à
// quelqu’un qui n’utilise pas l’outil tout de suite. Trois questions, pour
// chaque modèle : ce qu’il compte, ce qu’il ignore, et où aller chercher les
// chiffres. La troisième est la plus utile — c’est elle qui décide de la
// qualité des fourchettes, donc de tout le reste.
//
// Règle : on nomme des sources vérifiables (un relevé, un devis, une base
// publique), jamais un chiffre qu’on n’a pas. Le site ne connaît aucune donnée.
//
// Le balisage accepté est minimal : `code` entre accents graves, **gras**.

export const FOND = {
  logement: {
    compte: [
      "La mensualité et le capital restant dû sont calculés sur un prêt à annuités constantes, à la durée que vous indiquez. S’y ajoutent les frais de notaire, les charges de copropriété, la taxe foncière et un budget d’entretien annuel proportionnel au prix du bien.",
      "En face, le locataire garde son apport placé et paie un loyer qui monte chaque année. Les deux branches sont ramenées à la même chose : le patrimoine net au bout de l’horizon, en actualisant chaque dépense au taux de placement. C’est la seule comparaison honnête entre quelqu’un qui immobilise 50 000 € et quelqu’un qui les fait travailler.",
    ],
    ignore: [
      "La fiscalité, entièrement : impôts locaux hors taxe foncière, imposition d’une plus-value si le bien n’est pas votre résidence principale, dispositifs d’aide à l’accession. L’assurance emprunteur, les frais de dossier et de garantie, qui ajoutent facilement 1 % du montant emprunté.",
      "La mobilité, qui est souvent le vrai sujet : un bien revendu au bout de trois ans est presque toujours perdant, les frais d’entrée n’ayant pas eu le temps d’être absorbés. Changez `horizon` et vous le verrez immédiatement.",
      "**Et une hypothèse qu’il faut connaître** : le modèle tire `revalorisation`, `hausse_loyer` et `placement` indépendamment les uns des autres. Dans la réalité, les trois suivent la même conjoncture. Pour l’écrire, remplacez-les par un facteur commun :",
      "```\nconjoncture = -1 à 1\nrevalorisation = 1,5% + 2% * conjoncture + (-1% à 1%)\nhausse_loyer  = 2% + 1% * conjoncture\nplacement     = 3% + 1,5% * conjoncture\n```",
      "Le résultat change : l’écart entre les deux branches se resserre, parce qu’un loyer qui s’envole accompagne un bien qui prend de la valeur. Et le site désigne alors `conjoncture` comme l’hypothèse décisive — ce qui est plus juste, et plus utile, que de désigner l’une des trois.",
    ],
    chiffres: [
      "**Le taux** : le simulateur de votre banque ou d’un courtier, sur la durée exacte que vous visez — pas le taux moyen national, qui ne correspond à personne.",
      "**Les charges de copropriété** : le dernier appel de fonds, que le vendeur doit vous communiquer. Prenez l’année complète, pas le trimestre.",
      "**La taxe foncière** : l’avis d’imposition du bien. Le vendeur l’a.",
      "**Le loyer comparable** : les annonces du quartier à surface et état égaux, aujourd’hui. C’est ce que vous paieriez si vous n’achetiez pas.",
      "**La revalorisation** : les indices notariaux de votre commune donnent le passé. Gardez une fourchette large — c’est le chiffre le plus incertain du modèle, et le site vous le dira lui-même.",
    ],
  },

  combles: {
    compte: [
      "Le devis, aides déduites, comparé à l’économie de chauffage cumulée sur l’horizon, avec une dérive annuelle du prix de l’énergie. Les deux branches sont actualisées au taux de placement : l’argent du devis aurait pu rapporter ailleurs, et c’est compté.",
    ],
    ignore: [
      "Le confort d’été, qui est souvent la vraie raison d’isoler des combles, et qui ne se chiffre pas ici. La valeur ajoutée au logement à la revente. Le risque de malfaçon, qui n’est pas nul sur ce type de chantier.",
      "L’effet rebond : une maison mieux isolée est souvent chauffée un peu plus. La part réellement économisée est plus basse que la part théorique, et c’est pour ça qu’elle est écrite en fourchette.",
    ],
    chiffres: [
      "**Le devis** : demandez-en trois. L’écart entre eux *est* votre fourchette — ne prenez pas le moins cher comme valeur unique.",
      "**La facture de chauffage** : les relevés des trois dernières années, pas la dernière seule. Un hiver doux fausse tout.",
      "**Les aides** : le simulateur public, en renseignant vos revenus. Elles changent souvent et dépendent de votre situation ; c’est un poste à revérifier au moment de décider.",
      "**La part économisée** : un audit énergétique la chiffre pour votre logement. À défaut, gardez une fourchette large : le site vous dira si cette imprécision change quelque chose.",
    ],
  },

  freelance: {
    compte: [
      "Le net perçu de chaque côté sur trois ans. Côté freelance : chiffre d’affaires facturé, moins les cotisations et l’impôt exprimés en part du CA, moins les frais fixes. Le modèle ajoute une chose que les comparaisons oublient : la probabilité d’une année creuse, où les missions ne s’enchaînent pas.",
    ],
    ignore: [
      "La protection sociale, et c’est majeur : assurance chômage, retraite, indemnités d’arrêt maladie, congés payés. L’écart réel entre les deux statuts se joue souvent là plutôt que sur le revenu, et rien de tout cela n’est dans le modèle.",
      "Le temps de prospection non facturé, qui est déjà partiellement dans `jours_facturables` si vous le comptez honnêtement. La progression de carrière des deux côtés, sur un horizon plus long que trois ans.",
    ],
    chiffres: [
      "**Le TJM** : les offres réelles publiées dans votre spécialité et votre région, pas une moyenne nationale tous métiers confondus.",
      "**Les jours facturables** : si vous avez déjà fait des missions, comptez vos jours réellement vendus l’an dernier. Sinon, restez large : c’est là que l’optimisme fait le plus de dégâts.",
      "**Les charges** : le simulateur de l’URSSAF selon le statut visé. Le taux global dépend de votre chiffre d’affaires et de votre régime fiscal.",
    ],
  },

  voiture: {
    compte: [
      "Le coût total de possession de chaque côté sur l’horizon : carburant, réparations, assurance. Côté remplacement, la décote du véhicule racheté est comptée — c’est le poste que les comparaisons oublient le plus souvent — ainsi que la revente de l’ancien.",
    ],
    ignore: [
      "Le confort et la sécurité, qui sont des raisons légitimes de changer et que le calcul ne verra jamais. Le coût d’une immobilisation prolongée si la vieille voiture lâche. Les aides à la conversion, qui peuvent déplacer la décision à elles seules.",
      "Les zones à faibles émissions : une voiture ancienne parfaitement fonctionnelle peut devenir inutilisable là où vous circulez, ce qui ne se chiffre pas en euros de carburant.",
    ],
    chiffres: [
      "**Les réparations** : vos factures des trois dernières années. C’est le seul chiffre fiable, et il monte avec l’âge — pensez-y en fixant la borne haute.",
      "**La consommation** : l’ordinateur de bord sur un plein complet, ou mieux, le calcul à la pompe sur plusieurs pleins. Pas la fiche constructeur.",
      "**La revente** : les annonces du même modèle, même année, même kilométrage. Enlevez ce qu’un particulier obtient réellement, pas le prix affiché.",
      "**La décote** : comparez les annonces du modèle visé à trois ans d’écart d’âge. Le rapport vous donne directement le taux annuel.",
    ],
  },

  kilometre: {
    compte: [
      "Tous les postes annuels ramenés au kilomètre : décote annualisée, assurance, entretien, réparations, pneus, contrôle technique, stationnement, carburant. La décote est calculée comme la perte de valeur étalée sur la durée de détention.",
      "L’intérêt du calcul est là : les postes fixes se divisent par le kilométrage. Rouler peu ne rend pas la voiture bon marché au kilomètre — c’est l’inverse, et le site le montre en désignant `km_an` comme la source dominante de l’incertitude.",
    ],
    ignore: [
      "Le temps passé au volant, les péages, les amendes, le coût du crédit si le véhicule est financé. L’espace de stationnement chez vous, s’il a une valeur.",
    ],
    chiffres: [
      "**Le kilométrage annuel** : la différence entre deux contrôles techniques, divisée par le nombre d’années. C’est plus fiable que votre estimation.",
      "**La décote** : le prix payé, moins la cote actuelle du même modèle au même kilométrage.",
      "**Les postes fixes** : vos relevés bancaires sur douze mois. Assurance, entretien, pneus et contrôle y sont tous, et vous serez probablement surpris du total.",
    ],
  },

  tresorerie: {
    compte: [
      "Les sorties mensuelles, les entrées incertaines, et la réserve disponible. Le résultat est le nombre de mois avant épuisement, plafonné à cinq ans — au-delà, la question ne se pose plus dans ces termes.",
      "Le site calcule la probabilité de tenir l’objectif que vous fixez avec `seuil`, et le niveau de revenu à partir duquel vous passez du mauvais côté. C’est ce seuil-là qui sert : il se surveille, contrairement à une moyenne.",
    ],
    ignore: [
      "Les dépenses annuelles qui tombent d’un coup — assurances, impôts, révision de la voiture. Si vous les oubliez, le modèle est optimiste ; ajoutez-en une douzième par mois.",
      "La possibilité de réduire les sorties, qui est réelle mais qu’on ne peut pas supposer à l’avance sans se mentir. Et les aides ponctuelles auxquelles vous auriez droit.",
    ],
    chiffres: [
      "**Les sorties** : vos relevés bancaires sur six à douze mois, catégorisés. Un mois isolé ne vaut rien — c’est précisément la variabilité qui vous intéresse ici, et c’est elle qui fait la fourchette.",
      "**Les entrées** : ce qui est certain d’un côté (allocation, temps partiel), ce qui ne l’est pas de l’autre. Séparez-les en deux lignes plutôt qu’en une seule moyenne.",
    ],
  },

  projet: {
    compte: [
      "La somme des tâches, puis deux choses que les plannings omettent presque toujours : la part du temps mangée par le reste — réunions, support, autres dossiers — et l’incident qui n’était pas au planning, par définition.",
      "C’est le second point qui fait basculer la plupart des projets. Additionner des estimations de tâches donne le temps de travail, pas le temps calendaire.",
    ],
    ignore: [
      "Les dépendances entre tâches : ici elles s’additionnent comme si l’ordre n’avait pas d’importance. Un vrai chemin critique, où une tâche en retard bloque les suivantes, donne une distribution plus étalée encore.",
      "Les allers-retours de validation, le départ de quelqu’un, et le changement de périmètre en cours de route — qui est la première cause de retard et la moins modélisable.",
    ],
    chiffres: [
      "**Les tâches** : vos projets passés comparables, et la durée **réellement constatée**, pas celle qui avait été planifiée. C’est le seul chiffre fiable dont vous disposiez, et la plupart des équipes ne le notent jamais.",
      "**Les interruptions** : si vous suivez votre temps, le rapport est direct. Sinon, comptez une semaine type et regardez ce qui reste au projet ; la réponse est presque toujours plus basse que prévu.",
      "Si vous n’avez aucun historique, élargissez franchement vos fourchettes. Le bloc en bas de page vous dira si votre date tient malgré cette ignorance.",
    ],
  },

  carbone: {
    compte: [
      "Quatre changements concrets, chacun chiffré sur une année, avec des facteurs d’émission écrits en fourchettes parce qu’ils sont eux-mêmes incertains. La première section décrit votre situation ; c’est elle qui décide du classement.",
      "L’intérêt est dans les ordres de grandeur : ils sont si différents d’une action à l’autre que l’intuition se trompe presque toujours. Une action très visible peut valoir dix fois moins qu’une action discrète.",
    ],
    ignore: [
      "Le coût de chaque action, et sa faisabilité. Isoler demande plusieurs milliers d’euros, ne pas prendre l’avion ne coûte rien — le modèle les compare à la tonne évitée, pas à l’euro dépensé. Ajoutez un dénominateur si c’est votre vraie question.",
      "Les effets rebond, l’amortissement de la fabrication d’un véhicule neuf sur sa durée de vie réelle, et tout ce qui relève de l’action collective plutôt qu’individuelle.",
    ],
    chiffres: [
      "**Les facteurs d’émission** : la Base Empreinte de l’ADEME est la référence publique française, et elle est gratuite. Les valeurs pré-remplies ici sont des ordres de grandeur à vérifier.",
      "**Vos quantités** : les billets d’avion de l’année écoulée, le relevé kilométrique de la voiture, la surface chauffée du logement, le nombre de repas. Ce sont elles qui font le classement — les facteurs ne font que le nuancer, et le site vous le confirmera.",
    ],
  },

  reparer: {
    compte: [
      "Le coût par **année de service obtenue**, des deux côtés. C’est la seule comparaison honnête entre un appareil réparé qui tiendra peut-être trois ans et un appareil neuf qui en tiendra neuf : comparer le devis au prix du neuf ne veut rien dire.",
      "L’écart de consommation électrique est compté sur toute la période, ainsi que le risque que la réparation ne suffise pas.",
    ],
    ignore: [
      "L’impact environnemental de la fabrication d’un appareil neuf, qui pèse lourd et qui penche systématiquement du côté de la réparation.",
      "Le temps et les tracas — attendre une pièce, un second passage. La garantie du neuf. Et le fait qu’un appareil réparé peut aussi durer bien plus longtemps que prévu.",
    ],
    chiffres: [
      "**La durée de vie restante** : c’est le chiffre décisif, et le site vous le dira. Demandez-le au réparateur : quelle pièce lâche, quel âge a l’appareil, qu’est-ce qui cédera ensuite. Une réponse vague justifie une fourchette large.",
      "**La consommation** : l’étiquette énergie de l’ancien et du modèle visé, en kWh par an. Sur un appareil de dix ans, l’écart peut dépasser le prix de la réparation.",
      "**Le devis** : gratuit chez la plupart des réparateurs, et il vous donne bien plus que le prix — il vous donne un avis sur ce qu’il reste à vivre à l’appareil.",
    ],
  },

  vierge: {
    compte: [
      "Rien : cette page est vide, à vous d’écrire. Trois lignes suffisent pour commencer — une valeur que vous connaissez, une fourchette pour ce que vous ne connaissez pas, et le calcul qui les relie.",
    ],
    ignore: [
      "Une erreur fréquente : écrire des fourchettes trop étroites. Un intervalle donné comme sûr à 90 % contient la vraie valeur environ une fois sur deux. Si vous ne seriez pas *franchement surpris* de trouver une valeur hors de votre fourchette, elle est trop étroite.",
      "Une autre : croire que le site connaît quelque chose. Il ne connaît aucun barème, aucun taux, aucun prix. Tout vient de ce que vous écrivez.",
    ],
    chiffres: [
      "Commencez par la question, pas par le modèle. Écrivez la phrase que vous voulez pouvoir dire à la fin — « je saurai s’il vaut mieux X ou Y » — puis les deux lignes `option` correspondantes, et remontez vers les hypothèses.",
      "Mettez une fourchette partout où vous hésitez, même large. C’est le travail du site de vous dire lesquelles méritent d’être resserrées : mettre une valeur unique par confort vous prive justement de cette réponse.",
      "Si une hypothèse en entraîne une autre, ne les tirez pas séparément : donnez-leur une cause commune et écrivez chacune en fonction d’elle. Le site désignera alors la cause, ce qui est plus utile que de désigner un symptôme.",
    ],
  },
};
