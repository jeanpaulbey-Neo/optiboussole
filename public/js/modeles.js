// modeles.js — bibliothèque de départ.
//
// Un visiteur qui arrive n'a pas de modèle à écrire : il a une question.
// Ces six modèles sont là pour qu'il remplace des chiffres plutôt que d'en
// inventer. Chacun est écrit pour que la question du site ait une réponse
// intéressante : il y a une hypothèse qui décide, et elle n'est pas toujours
// celle qu'on croit.

export const MODELES = [
  {
    cle: 'logement',
    slug: 'louer-ou-acheter',
    question:
      "Faut-il acheter sa résidence principale ou continuer à louer ? La réponse dépend surtout d'un chiffre que personne ne connaît : le prix auquel le bien se revendra. Ce modèle compare le patrimoine net dans les deux cas et vous dit à partir de quelle revalorisation annuelle la décision change de camp.",
    titre: 'Louer ou acheter',
    resume: 'Sur 10 ans, patrimoine net dans chaque cas.',
    source: `unité: €
# Louer ou acheter — patrimoine net au bout de l'horizon.
# Remplacez les chiffres par les vôtres. Ce qui est écrit « a à b »
# est une fourchette : vous pensez qu'il y a 9 chances sur 10
# que la vraie valeur soit dedans.

prix = 250k
apport = 50k
horizon = 10          # années avant de revendre

# --- Le crédit -------------------------------------------------------
taux_credit = 3,2%
duree_credit = 25
i = taux_credit / 12
n_total = duree_credit * 12
n_ecoule = horizon * 12
emprunt = prix - apport
mensualite = emprunt * i / (1 - (1 + i)^(-n_total))
capital_du = emprunt * ((1+i)^n_total - (1+i)^n_ecoule) / ((1+i)^n_total - 1)

# --- Ce qu'on ne sait pas ---------------------------------------------
revalorisation = -1% à 4%      # du prix du bien, par an
charges_copro = 100 à 220      # par mois
taxe_fonciere = 900 à 1600     # par an
travaux = 0,3% à 1,5%          # du prix, par an
loyer = 900 à 1150             # ce que vous paieriez à la place
hausse_loyer = 1% à 3%
placement = 1,5% à 5%          # rendement si l'apport reste placé

# --- Achat ------------------------------------------------------------
frais_notaire = 7,5% * prix
prix_revente = prix * (1 + revalorisation)^horizon
frais_agence = 4% * prix_revente
depense_an = mensualite*12 + charges_copro*12 + taxe_fonciere + travaux*prix

bien_net = prix_revente - frais_agence - capital_du
cout_achat = frais_notaire * (1+placement)^horizon + depense_an * cumul(placement, horizon)

# --- Location ---------------------------------------------------------
cout_loyer = loyer * 12 * serie(placement, hausse_loyer, horizon)
apport_place = apport * (1 + placement)^horizon

option "Acheter" = bien_net - cout_achat
option "Louer"   = apport_place - cout_loyer

# Le modèle ignore : mobilité, fiscalité, travaux imprévus, et le fait
# qu'acheter n'est pas qu'un calcul. Il ne remplace pas votre jugement,
# il vous dit quel chiffre va le déterminer.`,
  },

  {
    cle: 'combles',
    slug: 'isoler-ses-combles',
    question:
      "Une isolation de combles se rembourse-t-elle vraiment ? Ce modèle compare le devis, les aides et l'économie de chauffage sur quinze ans, et vous dit si la question mérite encore d'être creusée ou si elle est déjà tranchée.",
    titre: 'Isoler ses combles',
    resume: 'Un investissement qui se rembourse, ou pas.',
    source: `unité: €
# Faut-il isoler les combles ? Comparaison sur 15 ans.

horizon = 15
surface = 80                    # m² de combles

# --- Le devis ---------------------------------------------------------
prix_m2 = 35 à 70
aide = 0 à 2000                 # MaPrimeRénov', CEE, aides locales
cout = prix_m2 * surface - aide

# --- Ce qu'on ne sait pas ---------------------------------------------
chauffage_actuel = 1400 à 2400  # facture annuelle de chauffage
economie = 15% à 30%            # part réellement économisée
prix_energie = 0% à 6%          # dérive annuelle du prix de l'énergie
placement = 2% à 4%             # ce que l'argent rapporterait ailleurs

gain_an1 = chauffage_actuel * economie
gain_total = gain_an1 * serie(placement, prix_energie, horizon)

option "Isoler"     = gain_total - cout * (1 + placement)^horizon
option "Ne rien faire" = 0`,
  },

  {
    cle: 'freelance',
    slug: 'freelance-ou-salarie',
    question:
      "Passer freelance rapporte-t-il plus que rester salarié ? Le calcul évident (taux journalier × jours) ignore ce qui décide vraiment : les intercontrats et le risque d'une année creuse. Ce modèle les met dedans.",
    titre: 'Freelance ou salarié',
    resume: 'Revenu net sur trois ans, intercontrats compris.',
    source: `unité: €
# Passer freelance ? Comparaison du net perçu sur 3 ans.

horizon = 3

# --- Salarié ----------------------------------------------------------
salaire_net_mensuel = 3200
prime = 0 à 3000                # par an
salarie_an = salaire_net_mensuel * 12 + prime

# --- Freelance --------------------------------------------------------
tjm = 450 à 700                 # taux journalier moyen facturé
jours_facturables = 150 à 210   # par an, intercontrats déduits
charges = 40% à 50%             # cotisations + impôt, part du CA
frais_fixes = 2000 à 5000       # compta, assurance, matériel, local

ca = tjm * jours_facturables
freelance_an = ca * (1 - charges) - frais_fixes

# Le risque n'est pas que la moyenne : une année sans mission arrive.
annee_creuse = bernoulli(12%)
freelance_reel = si annee_creuse alors freelance_an * 0,4 sinon freelance_an

option "Rester salarié" = salarie_an * horizon
option "Passer freelance" = freelance_reel * horizon`,
  },

  {
    cle: 'voiture',
    slug: 'garder-ou-changer-de-voiture',
    question:
      "Garder une voiture qui coûte cher en réparations, ou en acheter une plus récente qui décote ? Ce modèle montre un cas typique où une hypothèse fait beaucoup bouger le résultat sans jamais renverser la décision — donc où il est inutile de chercher plus loin.",
    titre: 'Garder ou changer de voiture',
    resume: 'La vieille voiture coûte cher. La neuve aussi.',
    source: `unité: €
# Garder la voiture actuelle ou en acheter une plus récente ? Sur 6 ans.

horizon = 6
km_an = 12000

# --- Garder l'actuelle ------------------------------------------------
conso_actuelle = 7 à 9          # L/100 km
reparations = 400 à 1800        # par an, et ça monte avec l'âge
revente_actuelle = 2500 à 4500  # ce qu'elle vaut aujourd'hui
assurance_actuelle = 550

# --- Acheter d'occasion récente ---------------------------------------
prix_nouvelle = 16000 à 22000
conso_nouvelle = 4,5 à 6
entretien_nouvelle = 300 à 700
assurance_nouvelle = 750
decote = 8% à 14%               # par an

# --- Commun -----------------------------------------------------------
prix_carburant = 1,60 à 2,20    # €/L, sur la période

carburant_actuel = km_an/100 * conso_actuelle * prix_carburant
carburant_nouveau = km_an/100 * conso_nouvelle * prix_carburant

garder = -(carburant_actuel + reparations + assurance_actuelle) * horizon
changer = revente_actuelle - prix_nouvelle
  + prix_nouvelle * (1 - decote)^horizon
  - (carburant_nouveau + entretien_nouvelle + assurance_nouvelle) * horizon

option "Garder l'actuelle" = garder
option "Changer" = changer`,
  },

  {
    cle: 'kilometre',
    slug: 'prix-du-kilometre',
    question:
      "Combien coûte réellement un kilomètre en voiture, décote comprise ? Presque tous les calculs oublient la perte de valeur du véhicule, qui est souvent le premier poste. Ce modèle la compte et montre d'où vient l'essentiel de l'incertitude.",
    titre: 'Le vrai prix du kilomètre',
    resume: 'Ce que votre voiture coûte réellement, tout compris.',
    source: `unité: €/km
# Combien coûte réellement un kilomètre en voiture ?
# Presque personne ne compte la décote. C'est souvent le premier poste.

km_an = 8000 à 16000

prix_achat = 20000
revente_dans = 8               # années
valeur_residuelle = 15% à 35%  # du prix d'achat
decote_an = prix_achat * (1 - valeur_residuelle) / revente_dans

assurance = 500 à 900
entretien = 300 à 900
reparations = 100 à 1200       # la queue est longue : une panne arrive
pneus = 120 à 300
controle = 45
stationnement = 0 à 900
conso = 5 à 8                  # L/100 km
prix_carburant = 1,70 à 2,10

carburant = km_an/100 * conso * prix_carburant
fixe = decote_an + assurance + entretien + reparations + pneus + controle + stationnement

cout_km = (fixe + carburant) / km_an`,
  },

  {
    cle: 'tresorerie',
    slug: 'tresorerie-combien-de-mois',
    question:
      "Avec une réserve et des revenus irréguliers, combien de mois pouvez-vous tenir ? Ce modèle calcule la probabilité de franchir un seuil que vous fixez, et le niveau de revenu à partir duquel vous passez du mauvais côté.",
    titre: 'La trésorerie tiendra-t-elle ?',
    resume: 'Combien de mois avant de toucher le fond.',
    source: `unité: mois
# Vous avez une réserve et des revenus incertains.
# Question : combien de mois avant qu'elle soit épuisée ?

seuil: 12          # on veut tenir au moins 12 mois

reserve = 6000

# --- Sorties ----------------------------------------------------------
loyer = 850
courses = 400 à 650
transport = 80 à 250
abonnements = 60 à 140
imprevus = 0 à 400             # par mois, en moyenne
sorties = loyer + courses + transport + abonnements + imprevus

# --- Entrées ----------------------------------------------------------
revenu_regulier = 800 à 1450   # allocation, missions, temps partiel
aides = 0 à 300

entrees = revenu_regulier + aides

deficit = sorties - entrees

# Plafonné à 60 mois : au-delà, la question ne se pose plus.
mois_tenables = si deficit <= 0 alors 60 sinon min(60, reserve / deficit)`,
  },

  {
    cle: 'vierge',
    slug: 'nouveau-modele',
    question:
      "Une page blanche et trois lignes de syntaxe pour décrire votre propre décision : les chiffres que vous connaissez, les fourchettes que vous ne connaissez pas, et ce que vous comparez.",
    titre: 'Partir de zéro',
    resume: 'Une page blanche et trois lignes de syntaxe.',
    source: `unité: €
# Écrivez une hypothèse par ligne.
#   nom = 12          une valeur que vous connaissez
#   nom = 8 à 20      une fourchette : 9 chances sur 10 d'être dedans
# La dernière ligne est le résultat.

# Pour comparer deux décisions, écrivez à la place :
#   option "Faire ceci" = ...
#   option "Faire cela" = ...

clients = 20 à 200
panier = 15 à 45
marge = 30% à 60%

benefice = clients * panier * marge`,
  },
];

export const MODELE_PAR_DEFAUT = 'logement';
