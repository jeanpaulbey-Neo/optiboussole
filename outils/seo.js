// seo.js — ce que le site dit de lui-même à qui ne l'a pas encore ouvert.
//
// Pourquoi ce fichier existe séparément.
//
// 1. `modele.titre` et `modele.question` sont écrits pour quelqu'un qui a la
//    page sous les yeux : le titre est court parce qu'un `h1` a du contexte
//    autour de lui, la question est longue parce qu'elle a la place. Une ligne
//    de résultat de recherche n'a ni l'un ni l'autre : elle a 60 caractères de
//    titre et 160 de description, et elle est lue par quelqu'un qui a tapé une
//    question, pas par quelqu'un qui visite un site. Ce sont deux textes
//    différents ; les confondre donnait « Louer ou acheter — Boussole », qui ne
//    ressemble à aucune question posée, suivi d'une description tronquée au
//    milieu d'un mot.
// 2. `modeles.js` part dans le navigateur de chaque visiteur. Ces chaînes-là ne
//    servent qu'au générateur de pages : elles restent du côté serveur, comme
//    `fond.js`.
//
// Règle d'écriture, tenue par des tests : le titre tient en 65 caractères,
// « — Boussole » compris ; la description en 100 à 165 ; et la description
// commence par la question telle qu'on la pose, pas par le nom du site.

// Le nom du site ne dit rien à personne. Il est mis à la fin, là où il ne
// mange pas les mots que quelqu'un a réellement tapés.
const SUFFIXE = ' — Boussole';

// Clé de modèle → ce qu'en dit un résultat de recherche.
export const SEO_MODELES = {
  logement: {
    titre: 'Louer ou acheter : quand est-ce vraiment rentable ?',
    description:
      'Acheter sa résidence principale ou continuer à louer ? Calculez à partir de quelle '
      + 'hausse annuelle du bien l’achat devient gagnant, avec vos chiffres et sans compte.',
  },
  combles: {
    titre: 'Isoler ses combles : est-ce que ça se rembourse ?',
    description:
      'Devis, aides, économie de chauffage : voyez en combien d’années l’isolation de vos '
      + 'combles est remboursée, et quel chiffre mérite d’être vérifié avant de signer.',
  },
  freelance: {
    titre: 'Freelance ou salarié : combien reste-t-il vraiment ?',
    description:
      'Le calcul TJM × jours oublie les intercontrats et l’année creuse. Comparez le revenu '
      + 'net sur trois ans, risque compris, et voyez à partir de combien de jours vendus.',
  },
  voiture: {
    titre: 'Garder ou changer de voiture : que dit le calcul ?',
    description:
      'Réparations d’un côté, décote de l’autre : à partir de quel coût annuel de pannes '
      + 'changer de voiture devient le bon choix, et ce que vaut de ressortir vos factures.',
  },
  kilometre: {
    titre: 'Combien coûte vraiment un kilomètre en voiture ?',
    description:
      'Le coût réel au kilomètre, décote comprise — souvent le premier poste, et celui que '
      + 'presque tous les calculs oublient. Avec vos chiffres, calculé sur votre appareil.',
  },
  tresorerie: {
    titre: 'Trésorerie : combien de mois puis-je tenir ?',
    description:
      'Réserve, revenus irréguliers, charges : la probabilité de tenir le nombre de mois que '
      + 'vous visez, et le niveau de revenu à partir duquel vous passez du mauvais côté.',
  },
  projet: {
    titre: 'Ce projet sera-t-il livré à la date promise ?',
    description:
      'Additionner ses estimations donne une date trop optimiste. Ajoutez l’imprévu et le '
      + 'temps mangé par le reste, et voyez quelle tâche décide vraiment de la date.',
  },
  carbone: {
    titre: 'Empreinte carbone : quel geste pèse vraiment ?',
    description:
      'Isolation, voiture électrique, un vol en moins, moitié moins de viande rouge : ce que '
      + 'chaque geste retire vraiment, en kg de CO₂e par an. Les écarts surprennent.',
  },
  reparer: {
    titre: 'Réparer ou racheter un appareil en panne ?',
    description:
      'Le devis ne décide pas : ce qui décide, c’est le nombre d’années qu’il reste à '
      + 'l’appareil réparé. Voyez à partir de quelle durée la réparation devient gagnante.',
  },
  rachat: {
    titre: 'Racheter son crédit : à partir de quel taux ?',
    description:
      'Indemnités, frais de dossier, garantie : le taux à partir duquel un rachat de crédit '
      + 'immobilier ne rapporte plus rien — ce qu’un simulateur de courtier ne dit pas.',
  },
  offres: {
    titre: 'Faut-il répondre à cet appel d’offres ?',
    description:
      'Des jours de travail certains contre un gain rare : le taux de réussite à partir '
      + 'duquel répondre se paie, et ce que vaut un renseignement pris avant de se lancer.',
  },
  solaire: {
    titre: 'Panneaux solaires : rentables sur vingt ans ?',
    description:
      'Autoconsommation, prix de l’électricité, production réelle de votre toit : le calcul '
      + 'sur vingt ans, et en euros ce que vaut une étude de production avant de signer.',
  },
  vierge: {
    titre: 'Écrire son propre modèle de décision',
    description:
      'Une page blanche et trois lignes : les chiffres que vous connaissez, les fourchettes '
      + 'que vous ne connaissez pas, et ce que vous comparez. Le site fait le reste.',
  },
};

// L'accueil sert le modèle « voiture », mais ce n'est pas ce qu'on cherche
// quand on arrive à la racine : on y cherche l'outil. Son titre parle donc de
// l'outil, et son `h1` continue de nommer la décision qui tourne dessous.
export const SEO_ACCUEIL = {
  titre: 'Boussole — décider quand il vous manque un chiffre',
  description:
    'Il vous manque un chiffre et vous alliez en inventer un. Donnez une fourchette : le site '
    + 'dit à quel montant votre choix bascule, et quel chiffre aller vérifier.',
};

// Les pages qui ne portent pas de modèle.
export const SEO_PAGES = {
  'la-methode': {
    titre: 'La méthode : quel chiffre décide, et ce qu’il vaut',
    description:
      'Part d’incertitude, seuil de bascule, valeur de l’information : ce que veut dire chaque '
      + 'chiffre de la réponse, avec un exemple calculé, et ce que la méthode ignore.',
  },
  'le-langage': {
    titre: 'Écrire un modèle de décision en dix lignes',
    description:
      'Une fourchette, des options, une unité : la syntaxe entière de Boussole, ce qu’elle '
      + 'accepte de votre écriture, et la loi de probabilité qu’une fourchette produit.',
  },
  'un-cas': {
    titre: 'Un cas du début à la fin : le devis du garage',
    description:
      'Une décision ordinaire suivie de bout en bout : ce qu’on écrit, ce que le site répond, '
      + 'le chiffre qu’on va chercher au garage, et la réponse que ça renverse.',
  },
  'a-propos': {
    titre: 'À propos : ce qu’est Boussole, et qui l’a construit',
    description:
      'Un outil gratuit pour les décisions chiffrées incertaines, calculé dans votre navigateur, '
      + 'sans compte ni traceur. Ce qu’il fait, ce qu’il ignore, et par qui.',
  },
};

// Le titre complet d'une page : la question d'abord, le nom du site après.
export const titreComplet = (t) => t + SUFFIXE;

// L'aperçu de lien. Une image par page, écrite par `npm run apercus`.
export const apercu = (slug) => `/og/${slug || 'accueil'}.png`;

// ---------------------------------------------------------------------------
// Données structurées (JSON-LD).
//
// Ce que ce site est, écrit pour une machine : un outil gratuit, sans compte,
// qui tourne dans le navigateur, et une page par décision. Deux règles :
//
// - **Rien qui ne soit visible sur la page.** Une donnée structurée qui
//   annonce ce que la page ne montre pas est une faute, et elle est
//   sanctionnée. Les questions de `/a-propos` sont donc écrites une seule fois
//   dans `apropos.js` : le HTML et le JSON-LD sortent du même tableau, et un
//   test vérifie qu'ils ne peuvent pas diverger.
// - **Un seul graphe par page**, avec des `@id` stables : le site, l'outil, la
//   page, son fil d'Ariane. Répéter un nœud `WebApplication` complet sur les
//   seize pages en ferait seize outils différents.

export const SITE = 'https://optiboussole.fr';
const ID_SITE = `${SITE}/#site`;
const ID_APP = `${SITE}/#outil`;

// `</script>` dans une chaîne fermerait la balise ; `<` échappé en \u003c est
// du JSON valide et ne peut plus rien fermer.
export const jsonld = (graphe) =>
  '<script type="application/ld+json">'
  + JSON.stringify({ '@context': 'https://schema.org', '@graph': graphe })
      .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
  + '</script>';

export const noeudSite = () => ({
  '@type': 'WebSite',
  '@id': ID_SITE,
  url: `${SITE}/`,
  name: 'Boussole',
  alternateName: 'optiboussole',
  description: SEO_ACCUEIL.description,
  inLanguage: 'fr-FR',
});

// L'outil lui-même. `offers` à 0 € n'est pas une coquetterie : c'est la seule
// façon, dans ce vocabulaire, de dire « gratuit » plutôt que « prix non
// communiqué ».
export const noeudOutil = (fonctions) => ({
  '@type': 'WebApplication',
  '@id': ID_APP,
  name: 'Boussole',
  url: `${SITE}/`,
  description: SEO_ACCUEIL.description,
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'Aide à la décision sous incertitude',
  operatingSystem: 'Tout navigateur web',
  browserRequirements: 'JavaScript',
  inLanguage: 'fr-FR',
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  isPartOf: { '@id': ID_SITE },
  featureList: fonctions,
  privacyPolicy: `${SITE}/a-propos`,
});

export const noeudPage = ({ url, type = 'WebPage', titre, description, image, dateModifiee, fil }) => {
  const n = {
    '@type': type,
    '@id': `${url}#page`,
    url,
    name: titre,
    description,
    inLanguage: 'fr-FR',
    isPartOf: { '@id': ID_SITE },
    mainEntity: { '@id': ID_APP },
  };
  if (image) n.primaryImageOfPage = { '@type': 'ImageObject', url: SITE + image };
  if (dateModifiee) n.dateModified = dateModifiee;
  if (fil) n.breadcrumb = { '@id': `${url}#fil` };
  return n;
};

// Un fil d'Ariane de deux crans : l'accueil, puis la page. C'est la seule
// hiérarchie qui existe ici, et l'annoncer plus profonde serait la décrire faux.
export const noeudFil = (url, titre) => ({
  '@type': 'BreadcrumbList',
  '@id': `${url}#fil`,
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Boussole', item: `${SITE}/` },
    { '@type': 'ListItem', position: 2, name: titre },
  ],
});

export const noeudFAQ = (url, questions) => ({
  '@type': 'FAQPage',
  '@id': `${url}#faq`,
  isPartOf: { '@id': ID_SITE },
  mainEntity: questions.map(({ q, r }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: r.join(' ').replace(/\*\*|`|\*/g, '') },
  })),
});

// ---------------------------------------------------------------------------
// Les aperçus de lien.
//
// Un lien partagé sans image est une ligne de texte grise dans une
// conversation ; avec une image, c'est une carte qu'on regarde. Elles sont
// écrites une fois pour toutes par `npm run apercus` (Chrome sans écran) et
// servies comme des fichiers statiques — pas de génération à la volée, pas de
// service à surveiller.
//
// Le texte de la vignette est **le même** que celui de la page, et la balise
// `og:image:alt` en est tirée : une image d'aperçu qui annonce autre chose que
// la page est un mensonge de plus dans un fil d'actualité qui n'en manque pas.
import { MODELES, MODELE_PAR_DEFAUT } from '../public/js/modeles.js';

export const VIGNETTES = [
  {
    fichier: 'accueil',
    titre: 'Décider quand il vous manque un chiffre',
    sous: 'Une fourchette suffit : le site dit à quel montant votre choix bascule, et quel chiffre vaut la peine d’aller chercher.',
  },
  ...MODELES.filter((m) => m.cle !== MODELE_PAR_DEFAUT).map((m) => ({
    fichier: m.slug, titre: m.titre, sous: m.resume,
  })),
  { fichier: 'la-methode', titre: 'La méthode', sous: 'Ce que veut dire chaque chiffre de la réponse, et ce que la méthode ne sait pas faire.' },
  { fichier: 'le-langage', titre: 'Le langage', sous: 'Dix lignes de syntaxe pour décrire une décision incertaine.' },
  { fichier: 'un-cas', titre: 'Un cas, du début à la fin', sous: 'Du devis du garage à la décision prise, avec les chiffres du moteur.' },
  { fichier: 'a-propos', titre: 'À propos', sous: 'Ce que fait ce site, ce qu’il refuse de faire, et qui l’a construit.' },
];

const PAR_FICHIER = Object.fromEntries(VIGNETTES.map((v) => [v.fichier, v]));

// Le texte alternatif d'un aperçu : ce que l'image dit, mot pour mot.
export const apercuAlt = (slug) => {
  const v = PAR_FICHIER[slug || 'accueil'];
  return v ? `Boussole — ${v.titre}` : 'Boussole';
};
