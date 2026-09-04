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
      "Le détail des calculs, sous les résultats, donne chaque étape — mensualité, capital restant dû, coût total de l’achat — et d’où vient son incertitude. On y voit que le coût d’achat tient au `placement` avant les `travaux`, et que la branche « Acheter » se résume à deux nombres du même ordre qui se retranchent : c’est ce qui rend ce choix si sensible à la revalorisation.",
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
      "Le détail des calculs, sous les résultats, sépare les deux côtés. Le coût tient à `prix_m2` pour les deux tiers de son incertitude et à `aide` pour un peu moins d’un tiers. Le gain cumulé tient à `economie` pour la moitié et à `chauffage_actuel` pour près d’un tiers — et **le prix futur de l’énergie, qui est ce qui inquiète, n’en porte que 15 %**. Ce qui décide, c’est ce que vous dépensez aujourd’hui et la part que vous économiserez vraiment.",
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
      "Le net perçu de chaque côté sur trois ans. Côté freelance : chiffre d’affaires facturé, moins les cotisations et l’impôt exprimés en part du CA, moins les frais fixes. Le modèle ajoute une chose que les comparaisons oublient : le nombre d’années creuses, où les missions ne s’enchaînent pas. Chaque année a sa propre chance d’être creuse — et c’est ce compte-là, pas le taux journalier, qui décide.",
      "Le détail des calculs le montre autrement. Le chiffre d’affaires tient à `tjm` pour 61 % de son incertitude et à `jours_facturables` pour 37 % : dans un produit, les deux facteurs pèsent exactement autant, et seule leur incertitude les distingue.",
      "Les deux hypothèses décisives renversent chacune le choix, et pourtant elles ne se valent pas. `tjm` porte le plus d’incertitude — 36 % de l’écart entre les branches, contre 28 % pour `creuses` — et son seuil est net : en dessous de 471 € par jour, mieux vaut rester salarié. `creuses` en porte moins, et vaut pourtant **près de deux fois plus** à aller lever. **La part d’incertitude et la valeur de l’information ne se classent pas dans le même ordre**, et c’est la seconde qui dit où passer son temps : le tarif, vous le connaissez déjà à peu près ; le nombre d’années creuses, non.",
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
      "Le coût total de possession de chaque côté sur l’horizon : carburant, réparations, assurance. Côté remplacement, la décote du véhicule racheté est comptée — c’est le poste que les comparaisons oublient le plus souvent — ainsi que la revente de l’ancien. Côté conservation, ce que l’ancienne vaudra encore au bout de l’horizon : ce n’est pas grand-chose, mais l’oublier revenait à comparer un patrimoine à zéro et penchait vers le remplacement.",
      "Le détail des calculs le montre : le coût de « garder » tient aux réparations pour près des trois quarts de son incertitude, celui de « changer » se répartit entre la décote, le prix d’achat et l’entretien. C’est pour cela qu’un seul chiffre décide, et que c’est celui-là qu’il faut aller chercher dans vos factures.",
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
      "Deux questions différentes se posent sur les postes fixes, et le détail des calculs, sous les résultats, y répond séparément : la décote est le poste **le plus lourd**, de loin ; mais l’incertitude de `fixe` vient des **réparations** et du **stationnement**, pas d’elle. Ce qui pèse et ce qu’on ignore ne coïncident pas.",
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
      "Dans le détail des calculs, les sorties se décomposent poste par poste : le loyer est le plus lourd, mais l’incertitude des sorties vient des `imprevus` et des `courses`. Le loyer, on le connaît ; c’est sur les deux autres que porte la fourchette, et c’est là que vos relevés servent.",
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
      "Le détail des calculs chiffre l’écart entre les deux. Le temps de travail tient à `developpement` pour 59 % de son incertitude ; la durée calendaire, elle, se partage entre `developpement` (37 %) et `interruptions` (27 %). **Le temps que le projet ne vous appartient pas porte presque autant d’incertitude que la plus grosse tâche du planning**, et il ne figure sur aucun planning.",
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
      "Le détail des calculs dit ce que le devis ne dit pas : l’incertitude du coût de la réparation vient de `survie_reparee` à 46 % et de `rechute` à 33 %. **Le montant du devis n’en porte presque rien.** Vous n’achetez pas une réparation, vous achetez des années de service : c’est leur nombre qu’il faut estimer, pas leur prix.",
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

  rachat: {
    compte: [
      "Les intérêts qu’il reste à payer sur la durée restante, au taux actuel et au taux proposé, à durée égale. En face du gain d’intérêts, tout ce que l’opération coûte : les frais de dossier, la nouvelle garantie — hypothèque ou caution — et l’indemnité de remboursement anticipé, plafonnée par la loi à six mois d’intérêts ou 3 % du capital, le plus bas des deux.",
      "La question utile n’est pas « combien je gagne à 3,2 % » : c’est **à partir de quel taux il n’y a plus rien à gagner**, frais compris. C’est le seuil de bascule sur `nouveau_taux`, et le site le calcule avec vos frais à vous, pas ceux d’une publicité.",
      "Le détail des calculs décompose les frais : les frais de dossier valent environ 860 € au centre, la garantie et l’indemnité réunies trois fois plus. Ici, contrairement au prix du kilomètre, le poste le plus lourd est aussi le plus incertain — `ira` porte 42 % de l’incertitude des frais, `garantie` 33 %. Les deux se lisent dans des documents que vous pouvez demander aujourd’hui.",
    ],
    ignore: [
      "L’assurance emprunteur, qui est souvent le vrai gisement : un rachat est l’occasion d’une délégation d’assurance, et l’économie peut dépasser celle du taux. Ajoutez-la en ligne à part si c’est votre cas.",
      "Le changement de durée. Beaucoup de rachats raccourcissent le prêt à mensualité égale ; le gain se compte alors en mois gagnés plutôt qu’en euros, et ce modèle ne le fait pas. Le coût du temps passé, les jours de congé pour les rendez-vous, et la renégociation avec votre propre banque, qui coûte moins et rapporte parfois autant.",
    ],
    chiffres: [
      "**Le capital restant dû et la durée restante** : le tableau d’amortissement de votre prêt, que votre banque fournit sur demande — ou votre espace client. Ne les estimez pas de tête : la mensualité dépend de chaque euro.",
      "**Le nouveau taux** : une offre écrite, pas le taux d’appel d’un site. Gardez une fourchette entre le taux affiché et celui que vous obtiendrez vraiment avec votre dossier.",
      "**L’indemnité de remboursement anticipé** : la clause est dans votre contrat de prêt, et elle est parfois négociée à zéro. **La garantie** : le devis du notaire pour une hypothèque, le barème de l’organisme de caution sinon.",
    ],
  },

  offres: {
    compte: [
      "La mise et le gain, séparément. La mise, ce sont les jours passés à répondre — à leur **coût réel**, pas à votre prix de vente — plus les frais de dossier. Vous la payez que vous gagniez ou non. Le gain, c’est le montant du marché multiplié par votre marge, et il n’arrive que si vous l’emportez. « Passer son tour » vaut zéro parce que ces journées-là, vous les gardez : leur coût est déjà dans la mise.",
      "**Ce modèle est le seul de la bibliothèque où les deux règles de décision ne disent pas la même chose.** « Répondre » rapporte le plus en moyenne ; « Passer son tour » l’emporte trois fois sur quatre. Les deux sont vrais, et c’est la forme même d’une mise certaine contre un gain rare : vous perdez la mise trois fois pour la récupérer largement la quatrième. Le site affiche les deux et ne tranche pas, parce que ce qui tranche n’est pas dans le modèle — c’est le nombre de dossiers que vous déposerez, et votre capacité à encaisser la mise perdue plusieurs fois de suite.",
      "Le détail des calculs décompose la mise : les journées en font l’essentiel, les frais de dossier une petite part, et l’incertitude de la mise vient de `jours_reponse` aux trois quarts. C’est la seule ligne du modèle sur laquelle vous ayez la main avant de décider.",
    ],
    ignore: [
      "**La relation commerciale**, et c’est la limite la plus sérieuse. Répondre vous fait connaître : perdre trois consultations puis gagner la quatrième chez le même acheteur est une trajectoire ordinaire, et ce modèle traite chaque dossier isolément. Si c’est votre cas, la valeur d’une réponse perdue n’est pas nulle et le modèle vous dessert.",
      "**Le risque d’exécution.** Un marché gagné trop bas coûte de l’argent. Ici `marge` est une fourchette a priori, pas le résultat d’un chantier ; elle ne descend jamais sous zéro alors que dans la réalité, si.",
      "**Et une hypothèse qu’il faut connaître** : le modèle tire `jours_reponse` et `chances` indépendamment, comme si un dossier bâclé en deux jours gagnait aussi souvent qu’un dossier travaillé en douze. C’est faux, et ça s’écrit :",
      "```\nbase = 8% à 18%\nchances = base + 1,5% * jours_reponse\n```",
      "Le résultat est instructif : la valeur d’aller vérifier `jours_reponse` tombe de 219 € à 8 €, et son seuil recule de 9,2 à plus de 11 jours. Autrement dit, **écourter la réponse cesse d’être le levier qu’il semblait être** dès qu’on admet que le temps passé achète des chances. Le raccourci ne fait pas d’économie, il déplace le pari.",
    ],
    chiffres: [
      "**Votre taux de réussite** : comptez vos dossiers déposés et vos dossiers gagnés sur deux ans. C’est le chiffre que presque personne ne tient, et c’est celui qui décide. À défaut, restez large — le site vous dira si cette ignorance change quelque chose.",
      "**Les jours de réponse** : votre dernier dossier, minuté honnêtement, relectures et pièces administratives comprises. La plupart des gens divisent par deux de mémoire.",
      "**Le coût de votre journée** : votre coût complet — salaire chargé, ou pour un indépendant ce que vous auriez facturé ailleurs. Pas votre prix de vente, qui contient la marge.",
      "**Le montant et la marge** : le montant est au cahier des charges. La marge, elle, se lit sur vos chantiers comparables **terminés**, pas sur ceux que vous étiez en train de chiffrer.",
    ],
  },

  solaire: {
    compte: [
      "La production annuelle de votre toit, séparée en deux : l’électricité que vous consommez sur place, qui vous évite d’acheter au tarif du réseau, et le surplus revendu. Les deux ne se comportent pas de la même façon dans le temps, et le modèle le respecte — l’autoconsommation suit la dérive du prix de l’électricité, le surplus est payé au tarif figé le jour de la signature, pendant vingt ans. C’est la raison pour laquelle une installation surdimensionnée rapporte beaucoup moins que sa puissance ne le laisse croire.",
      "En face, le devis aides déduites, le remplacement de l’onduleur vers la douzième année, et le fait que cet argent aurait rapporté ailleurs : tout est ramené à la même date, la fin de l’horizon. « Ne rien faire » vaut donc exactement zéro.",
      "**Ce modèle est le premier du site à chiffrer ce que vaut d’aller savoir.** La ligne `savoir production = 250 €` dit qu’une étude d’ombrage et de production sur votre toit se paie 250 €, et le site répond en euros : ce qu’elle rapporte, si elle se paie, et — surtout — la règle que vous appliquerez ensuite. Cette dernière partie est celle que personne ne calcule : savoir qu’une information « vaut 479 € » ne vous fait pas avancer, savoir qu’**en dessous de 1 158 kWh par kWc et par an il ne faut pas installer** vous fait avancer.",
    ],
    ignore: [
      "La perte de rendement des panneaux, environ 0,5 % par an, soit près de 10 % sur l’horizon. Pour l’écrire, remplacez `production` par `production * (1 - 0,5% * horizon / 2)` — la moitié de la perte, parce qu’elle est progressive.",
      "L’autoconsommation collective, le pilotage des usages — ballon d’eau chaude, voiture — qui peut faire monter `autoconsomme` de dix à quinze points, et une batterie, qui la fait monter davantage encore mais coûte cher. Le modèle prend `autoconsomme` comme une donnée alors que c’est en partie un comportement.",
      "L’assurance, la maintenance, le nettoyage, et le risque de panne autre que l’onduleur. La revente du logement, où une installation récente se valorise, et une installation en fin de vie, non.",
      "**Et une chose que le modèle dit tout haut** : l’hypothèse qui pèse le plus n’est pas `production`, c’est `derive`, la hausse future du prix de l’électricité — et personne ne peut vous la vendre. C’est exactement la distinction entre une incertitude qu’on peut lever et une qu’on subit. `production` arrive juste derrière, et elle, elle s’achète pour 250 €.",
    ],
    chiffres: [
      "**La production de votre toit** : l’outil PVGIS de la Commission européenne, gratuit, donne le productible en kWh par kWc et par an pour vos coordonnées exactes, votre pente et votre orientation. Il ne voit pas vos ombres portées — un arbre, une cheminée, le pignon du voisin — et c’est précisément ce qu’une étude sur place ajoute.",
      "**Le devis** : trois devis, et prenez l’écart entre eux comme fourchette. Méfiez-vous des offres où la prime et le crédit d’impôt sont déjà « déduits » du prix affiché : recalculez le prix brut.",
      "**La prime à l’autoconsommation et le tarif de rachat** : ils sont fixés par arrêté et révisés chaque trimestre, à la baisse depuis plusieurs années. Prenez la valeur du trimestre en cours sur le site officiel, pas celle d’un article de l’an dernier — c’est l’hypothèse qui vieillit le plus vite de tout le modèle.",
      "**Votre part autoconsommée** : votre courbe de charge horaire, que votre distributeur met à disposition si vous l’activez. À défaut, 30 % sans pilotage, 50 % avec un ballon d’eau chaude déclenché en journée.",
      "**Votre prix du kWh** : la dernière facture, en divisant le total TTC par les kWh consommés. Pas le prix du kWh affiché au contrat, qui oublie l’abonnement et les taxes.",
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
