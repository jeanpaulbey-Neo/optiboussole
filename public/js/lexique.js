// lexique.js — ce que chaque hypothèse des modèles de la bibliothèque veut
// dire, dans quelle unité, et où aller chercher le chiffre.
//
// Pourquoi ce fichier existe. Le premier visiteur extérieur du site — session
// 14 — l'a trouvé « abrupt et peu clair » et n'a « pas su quoi en faire ». Le
// site lui montrait des phrases comme :
//
//     « L'hypothèse qui pèse le plus est reparations. Le verdict passe à
//       "Changer" au-dessus de 1 109. Lever le doute dessus vaut 631 € —
//       c'est là qu'il faut passer votre temps. »
//
// Trois défauts dans une seule phrase : `reparations` est un identifiant de
// code, pas un mot ; « 1 109 » n'a pas d'unité, donc ne veut rien dire ; et
// « passer votre temps » ne dit pas à quoi. Le site savait déjà tout ce qu'il
// fallait pour être clair — il ne l'avait juste jamais écrit au même endroit.
//
// Chaque entrée est [ quoi, unité, où le trouver ].
//   quoi   — le mot que le visiteur emploierait, en minuscules, sans point.
//   unité  — celle de l'hypothèse, PAS celle du résultat. Un modèle en €
//            contient des litres, des jours et des pourcentages, et afficher
//            « au-dessus de 1 109 € » sur un nombre de kilomètres serait pire
//            que de ne rien afficher. Chaîne vide si l'hypothèse n'en a pas.
//   où     — une source vérifiable et gratuite : un relevé, une facture, un
//            devis, une base publique. `null` quand il n'y en a pas d'honnête —
//            et le site le **dit** alors, au lieu de se taire : « nulle part,
//            ce chiffre-là se juge ». C'est la distinction entre l'incertitude
//            qu'on peut lever et celle qu'on subit, et c'est une réponse, pas
//            une lacune. Le prix futur de l'électricité est le cas type : c'est
//            l'hypothèse la plus décisive du modèle solaire, et personne ne
//            peut vous la vendre. Un test tient la liste des `null` : on ne les
//            met pas par paresse.
//
// Règle : jamais un chiffre ici. Le site ne connaît aucune donnée, et ce
// fichier ne doit pas devenir la porte par laquelle il prétendrait en avoir.
//
// ⚠️ Un test vérifie que **toute** hypothèse de **tout** modèle de la
// bibliothèque a son entrée. Si vous ajoutez une ligne à un modèle, ajoutez-la
// ici : sinon le site réaffiche un identifiant nu et on revient au point de
// départ.

export const LEXIQUE = {
  logement: {
    revalorisation: ['la hausse annuelle du prix du bien d’ici la revente', '%',
      'les indices notariaux de votre commune donnent le passé. Gardez une fourchette large : c’est le chiffre le plus incertain du modèle'],
    placement: ['ce que votre argent rapporterait s’il restait placé', '%',
      'le rendement net de votre assurance-vie ou de votre livret, sur dix ans'],
    travaux: ['l’entretien du bien chaque année, en part de son prix', '%',
      'les procès-verbaux d’assemblée générale des trois dernières années : ils listent les travaux votés'],
    loyer: ['ce que vous paieriez en louant l’équivalent', '€/mois',
      'les annonces du quartier, à surface et état égaux, aujourd’hui'],
    charges_copro: ['les charges de copropriété', '€/mois',
      'le dernier appel de fonds, que le vendeur doit vous communiquer. Prenez l’année complète'],
    hausse_loyer: ['la hausse annuelle des loyers', '%',
      'l’indice de référence des loyers (IRL), publié chaque trimestre'],
    taxe_fonciere: ['la taxe foncière', '€/an',
      'l’avis d’imposition du bien. Le vendeur l’a'],
  },

  combles: {
    prix_energie: ['la dérive annuelle du prix de l’énergie', '%', null],
    aide: ['les aides déduites du devis', '€',
      'le simulateur public, en renseignant vos revenus. Elles changent souvent'],
    placement: ['ce que l’argent du devis rapporterait ailleurs', '%',
      'le rendement net de votre épargne disponible'],
    economie: ['la part de chauffage réellement économisée', '%',
      'un audit énergétique la chiffre pour votre logement. À défaut, restez large'],
    chauffage_actuel: ['votre facture de chauffage', '€/an',
      'les relevés des trois dernières années, pas la dernière seule : un hiver doux fausse tout'],
    prix_m2: ['le prix posé de l’isolation', '€/m²',
      'trois devis. L’écart entre eux est votre fourchette — ne prenez pas le moins cher comme valeur unique'],
  },

  freelance: {
    creuses: ['le nombre d’années sans mission sur la période', 'années',
      'vos trois dernières années, ou celles de deux confrères installés depuis plus longtemps que vous'],
    tjm: ['votre taux journalier facturé', '€/jour',
      'vos dernières factures, ou les grilles publiques des plateformes de votre spécialité'],
    jours_facturables: ['les jours réellement facturés, intercontrats déduits', 'jours/an',
      'comptez vos jours facturés l’an dernier. Presque personne ne dépasse 200'],
    frais_fixes: ['compta, assurance, matériel, local', '€/an',
      'un devis d’expert-comptable et un devis de RC professionnelle suffisent pour l’essentiel'],
    prime: ['la prime annuelle du poste salarié', '€/an',
      'vos bulletins de paie de décembre des trois dernières années'],
    charges: ['cotisations et impôt, en part du chiffre d’affaires', '%',
      'le simulateur officiel de votre statut, à votre niveau de revenu'],
  },

  voiture: {
    reparations: ['ce que l’ancienne vous coûtera en pannes et en entretien', '€/an',
      'vos factures de garage des trois dernières années, additionnées puis divisées par trois. C’est une heure de travail, et c’est la mieux payée de cette décision'],
    decote: ['la perte de valeur annuelle de la voiture achetée', '%',
      'les cotes en ligne du même modèle à un an, trois ans, cinq ans : l’écart donne la pente'],
    prix_nouvelle: ['le prix de l’occasion récente visée', '€',
      'les annonces du même modèle, même année, même kilométrage'],
    conso_actuelle: ['la consommation réelle de l’actuelle', 'L/100 km',
      'vos derniers pleins : kilomètres parcourus divisés par litres mis. Pas la valeur du constructeur'],
    revente_actuelle: ['ce que l’actuelle vaut aujourd’hui', '€',
      'les annonces de particuliers pour le même modèle et le même kilométrage'],
    entretien_nouvelle: ['l’entretien courant de la plus récente', '€/an',
      'le carnet d’entretien du modèle : révisions, distribution, pneus'],
    conso_nouvelle: ['la consommation de la plus récente', 'L/100 km',
      'les relevés d’usagers réels, pas la fiche technique'],
    prix_carburant: ['le prix du carburant sur la période', '€/L',
      'le relevé officiel des prix à la pompe. Élargissez vers le haut : six ans, c’est long'],
    revente_plus_tard: ['ce qu’il restera de l’actuelle au bout de l’horizon', '€',
      'les annonces du même modèle, avec l’âge et le kilométrage qu’elle aura à la fin de votre horizon'],
  },

  kilometre: {
    km_an: ['les kilomètres que vous parcourez', 'km/an',
      'deux contrôles techniques successifs : le kilométrage y est noté, et la différence ne ment pas'],
    reparations: ['les pannes et l’imprévu', '€/an',
      'vos factures de garage des trois dernières années'],
    stationnement: ['parking, résident, horodateurs', '€/an',
      'votre abonnement, plus une estimation honnête des horodateurs'],
    conso: ['la consommation réelle', 'L/100 km',
      'vos derniers pleins : kilomètres divisés par litres'],
    entretien: ['révisions et entretien courant', '€/an',
      'le carnet d’entretien du modèle, ou vos factures'],
    valeur_residuelle: ['ce qui restera du prix d’achat à la revente', '%',
      'les cotes en ligne du même modèle avec l’âge visé'],
    assurance: ['la prime d’assurance', '€/an', 'votre dernier avis d’échéance'],
    prix_carburant: ['le prix du carburant', '€/L', 'le relevé officiel des prix à la pompe'],
    pneus: ['les pneus, ramenés à l’année', '€/an',
      'le prix d’un train de pneus divisé par le nombre d’années qu’il tient chez vous'],
  },

  tresorerie: {
    revenu_regulier: ['ce qui rentre à peu près sûrement', '€/mois',
      'vos douze derniers relevés bancaires. Prenez le mois le plus bas comme borne basse'],
    imprevus: ['les dépenses non prévues, lissées', '€/mois',
      'vos douze derniers relevés : tout ce qui n’est ni loyer, ni courses, ni abonnement'],
    aides: ['allocations et aides perçues', '€/mois',
      'votre dernier décompte d’organisme, et le simulateur officiel si votre situation change'],
    courses: ['alimentation et courses du quotidien', '€/mois',
      'trois mois de relevés, pas un seul'],
    transport: ['carburant, abonnement, entretien', '€/mois', 'trois mois de relevés'],
    abonnements: ['téléphone, internet, assurances, services', '€/mois',
      'la liste de vos prélèvements récurrents. Ils sont presque toujours sous-estimés de mémoire'],
  },

  projet: {
    developpement: ['le développement lui-même', 'jours',
      'une tâche comparable déjà livrée, minutée sur son temps réel — pas sur son estimation d’origine'],
    interruptions: ['la part des journées mangée par le reste', '%',
      'votre agenda des quatre dernières semaines : comptez les heures réellement passées sur le projet'],
    gros_pepin: ['l’incident qui n’était pas au planning', '', null],
    integration: ['l’intégration', 'jours', 'une intégration comparable déjà livrée'],
    corrections: ['les corrections après recette', 'jours',
      'le nombre d’anomalies remontées sur le projet précédent, et le temps qu’elles ont pris'],
    recette: ['la recette', 'jours', 'la durée réelle de la dernière recette comparable'],
    maquettes: ['les maquettes', 'jours', 'un cycle de maquettes comparable, validations comprises'],
    cadrage: ['le cadrage', 'jours', 'le temps réel du dernier cadrage, réunions comprises'],
    retard_pepin: ['le retard causé par l’incident, s’il survient', 'jours', null],
  },

  carbone: {
    par_km_thermique: ['les émissions d’un kilomètre en voiture thermique', 'kg CO₂e/km',
      'la Base Empreinte de l’ADEME, gratuite et publique'],
    par_repas_vege: ['les émissions d’un repas végétarien', 'kg CO₂e/repas',
      'la Base Empreinte de l’ADEME'],
    par_vol_long: ['les émissions d’un aller-retour long-courrier, par passager', 'kg CO₂e',
      'le calculateur de l’ADEME, en renseignant la distance réelle'],
    gain_isolation: ['la part de chauffage économisée par l’isolation', '%',
      'un audit énergétique de votre logement'],
    par_km_electrique: ['les émissions d’un kilomètre en électrique, batterie comprise', 'kg CO₂e/km',
      'la Base Empreinte de l’ADEME, avec le mix électrique français'],
    par_repas_rouge: ['les émissions d’un repas de viande rouge', 'kg CO₂e/repas',
      'la Base Empreinte de l’ADEME'],
    chauffage_par_m2: ['les émissions du chauffage par mètre carré', 'kg CO₂e/m²/an',
      'votre facture d’énergie, convertie par le facteur d’émission de votre chauffage'],
  },

  reparer: {
    survie_reparee: ['ce qu’il reste à vivre à l’appareil, une fois réparé', 'années',
      'le réparateur le sait, et le dira si vous le lui demandez explicitement. C’est le seul chiffre à aller chercher ici'],
    conso_ancien: ['la consommation électrique de l’ancien', 'kWh/an',
      'l’étiquette énergie de l’appareil, ou sa notice'],
    rechute: ['la réparation ne suffit pas et il retombe en panne', '', null],
    devis: ['le devis de réparation', '€', 'le devis lui-même, déplacement compris'],
    prix_neuf: ['le prix du remplaçant', '€', 'le prix vu en magasin, livraison et pose comprises'],
    survie_neuve: ['la durée de vie attendue du neuf', 'années',
      'la durée de garantie, plus ce que l’indice de réparabilité laisse espérer'],
    conso_neuf: ['la consommation électrique du neuf', 'kWh/an',
      'l’étiquette énergie du modèle visé'],
    prix_kwh: ['votre prix du kilowattheure', '€/kWh',
      'votre facture : le total TTC divisé par les kWh consommés, abonnement compris'],
    revente_epave: ['ce que l’ancien vaut en pièces ou en reprise', '€',
      'les offres de reprise en magasin, ou les annonces « pour pièces »'],
  },

  rachat: {
    nouveau_taux: ['le taux qu’on vous propose', '%',
      'l’offre écrite de la banque, taux nominal — pas le TAEG, qui contient déjà les frais comptés à part ici'],
    ira: ['l’indemnité de remboursement anticipé', '%',
      'votre offre de prêt initiale : elle plafonne l’indemnité, et elle se négocie souvent à zéro'],
    garantie: ['hypothèque ou caution sur le nouveau prêt', '%',
      'le barème de l’organisme de caution, ou celui du notaire pour une hypothèque'],
    frais_dossier: ['les frais de dossier de la nouvelle banque', '€',
      'l’offre écrite. C’est la ligne la plus négociable des trois'],
  },

  offres: {
    remporte: ['vous remportez la consultation', '', null],
    jours_reponse: ['les jours passés à monter le dossier', 'jours',
      'votre dernier dossier, minuté honnêtement, pièces administratives comprises. La plupart des gens divisent par deux de mémoire'],
    montant_marche: ['le montant du marché', '€', 'le cahier des charges'],
    chances: ['votre taux de réussite sur ce type de consultation', '%',
      'comptez vos dossiers déposés et vos dossiers gagnés sur deux ans. Presque personne ne tient ce chiffre, et c’est celui qui décide'],
    marge: ['ce qu’il vous reste une fois le marché exécuté', '%',
      'vos chantiers comparables terminés, pas ceux que vous étiez en train de chiffrer'],
    cout_jour: ['votre journée à son coût réel', '€/jour',
      'votre coût complet — salaire chargé, ou ce que vous auriez facturé ailleurs. Pas votre prix de vente'],
    frais_dossier: ['déplacements, plans, certificats', '€',
      'les frais du dernier dossier déposé'],
  },

  solaire: {
    derive: ['la hausse annuelle du prix de l’électricité', '%', null],
    production: ['ce que votre toit produira, par kilowatt-crête installé', 'kWh/kWc/an',
      'PVGIS, l’outil gratuit de la Commission européenne, avec vos coordonnées, votre pente et votre orientation. Il ne voit pas vos ombres portées : c’est ce qu’une étude sur place ajoute'],
    prix_installe: ['le devis d’installation, pose et raccordement compris', '€',
      'trois devis. Recalculez le prix brut : beaucoup d’offres affichent la prime déjà déduite'],
    autoconsomme: ['la part que vous consommez sur place plutôt que de revendre', '%',
      'votre courbe de charge horaire, que votre distributeur met à disposition si vous l’activez'],
    tarif_surplus: ['le tarif auquel le surplus vous est racheté', '€/kWh',
      'l’arrêté du trimestre en cours. Il est révisé tous les trois mois, à la baisse depuis plusieurs années'],
    prix_achat: ['ce que vous payez le kilowattheure au réseau', '€/kWh',
      'votre facture : le total TTC divisé par les kWh, abonnement et taxes compris'],
    placement: ['ce que l’argent rapporterait ailleurs', '%',
      'le rendement net de votre épargne disponible'],
    prime: ['la prime à l’autoconsommation', '€',
      'l’arrêté du trimestre en cours. C’est l’hypothèse qui vieillit le plus vite du modèle'],
    onduleur: ['le remplacement de l’onduleur, vers la douzième année', '€',
      'le prix catalogue d’un onduleur de même puissance, pose comprise'],
  },

  vierge: {
    clients: ['le nombre de clients', '',
      'vos douze derniers mois, ou les comptes publiés d’un concurrent comparable'],
    panier: ['ce que dépense un client', '€',
      'vos encaissements divisés par votre nombre de commandes — pas le prix affiché'],
    marge: ['ce qu’il vous reste sur ce que vous encaissez', '%',
      'vos comptes : ce qui subsiste après coût d’achat et frais variables'],
  },
};

// Ce qu'on sait d'une hypothèse d'un modèle de la bibliothèque. Rien pour un
// modèle écrit par le visiteur, et c'est voulu : le site ne devinera pas ce
// que veut dire un nom qu'il n'a pas écrit.
export function hypothese(cle, nom) {
  const e = LEXIQUE[cle] && LEXIQUE[cle][nom];
  if (!e) return null;
  return { quoi: e[0], unite: e[1], ou: e[2] };
}
