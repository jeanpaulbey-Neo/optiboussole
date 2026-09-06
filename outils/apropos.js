// apropos.js — le contenu de /a-propos.
//
// Pourquoi cette page existe. Le site va être diffusé : quelqu'un va le citer,
// et la question qu'on pose d'abord à un lien qu'on ne connaît pas est
// « qu'est-ce que c'est, et qui l'a fait ». Les seize autres pages répondent
// « voici un outil » ; aucune ne répond à ça. C'est aussi la page qu'on ouvre
// avant de faire confiance à un calcul : ce qu'il compte, ce qu'il ignore, et
// où passent les chiffres qu'on y tape.
//
// Deux règles d'écriture :
//
// - **Le premier paragraphe est fait pour être copié tel quel.** C'est la
//   présentation du site, en un bloc, sans « comme dit plus haut » ni renvoi à
//   ce qui l'entoure. Un test vérifie qu'il se tient seul.
// - **Les questions du bas sont la source unique** de ce que le site déclare
//   aux moteurs de recherche : le HTML servi et les données structurées
//   sortent du même tableau. Une page qui promet à une machine une réponse
//   qu'un lecteur ne trouve pas est une page qui ment.
//
// Ce que cette page ne fait pas : nommer le propriétaire du serveur. Le mandat
// l'interdit, et le dépôt public porte son identifiant — donc pas de lien vers
// le dépôt ici non plus. Il est libre de le donner lui-même.

export const APROPOS = {
  titre: 'À propos de Boussole',
  question:
    'Ce que fait ce site, ce qu’il refuse de faire, où passent les chiffres que vous y '
    + 'tapez, et par qui il a été construit.',

  // Le paragraphe à reprendre tel quel.
  intro: [
    "**Boussole est un outil gratuit pour les décisions qu’on n’arrive pas à chiffrer.** Louer ou acheter, réparer ou remplacer, répondre à un appel d’offres : il manque toujours un chiffre, et on finit par en inventer un — c’est alors l’invention qui décide, pas vous. Ici, une fourchette suffit. Vous écrivez « entre 400 et 1 800 € par an » parce que c’est tout ce que vous savez, et le site répond par le montant à partir duquel votre décision change de camp, par la fréquence à laquelle cela arrive, et par le seul chiffre qui mérite l’heure que vous passeriez à le vérifier. Douze décisions courantes sont déjà écrites — vous n’avez qu’à remplacer les chiffres — et vous pouvez décrire la vôtre en dix lignes de français. Tout le calcul se fait dans votre navigateur : aucun compte, aucun traceur, rien qui parte sur un serveur.",
  ],

  sections: [
    {
      titre: 'Les trois questions auxquelles il répond',
      blocs: [
        "Un simulateur ordinaire répond « voici votre chiffre ». Les rares outils sérieux d’estimation sous incertitude répondent « voici votre distribution », ce qui est déjà mieux, mais s’arrêtent là. Ni l’un ni l’autre ne répond aux trois questions qui, elles, font agir.",
        "**Quelle hypothèse porte réellement mon incertitude ?** Sur dix chiffres que vous avez donnés, il y en a d’ordinaire un qui décide et neuf qui ne changent rien. Ce ne sont pas toujours ceux qu’on croit.",
        "**À partir de quelle valeur ma décision change-t-elle de camp ?** Pas « le résultat vaut 12 400 € », mais « au-dessus de 1 109 € de réparations par an, changez de voiture — ce qui arrive 3 fois sur 10 ».",
        "**Quel chiffre vaut la peine d’aller le chercher, et lequel ne vaut rien ?** C’est la question la moins connue et la plus utile. Elle produit un renversement qui surprend toujours : une hypothèse peut être massivement incertaine et totalement sans intérêt, parce qu’elle ne fait jamais basculer le choix. Le site chiffre en euros ce que vous rapporterait d’aller lever chaque doute, et vous dit lequel ne mérite pas votre samedi après-midi.",
      ],
    },
    {
      titre: 'Ce qu’il ne fait pas',
      blocs: [
        "**Il ne décide pas à votre place.** Il ne connaît ni votre situation, ni ce à quoi vous tenez. Un modèle qui compare deux patrimoines nets ignore que vous vouliez ce jardin ; c’est à vous de savoir combien il vaut.",
        "**Il ne remplace ni un conseiller, ni un devis, ni un diagnostic.** Il dit souvent l’inverse : que le chiffre décisif vous manque, et qu’il faut aller le chercher chez quelqu’un qui le connaît.",
        "**Il n’a rien à vendre**, aucun partenaire, aucun lien affilié, aucune publicité. Ce que le calcul donne est ce qui s’affiche, y compris quand la réponse est « ne faites rien, les deux branches se valent ».",
        "**Il ne sait pas tout modéliser.** Ce qui ne se met pas en chiffres n’y entre pas, et les hypothèses sont supposées indépendantes tant que vous ne les liez pas par une formule. Les limites de la méthode sont écrites en toutes lettres, avec ce qu’elles coûtent, sur [la page qui l’explique](/la-methode).",
      ],
    },
    {
      titre: 'Où passent les chiffres que vous tapez : nulle part',
      blocs: [
        "Le site est un ensemble de fichiers statiques. Le moteur de simulation — vingt mille tirages aléatoires par calcul, refaits à chaque frappe — s’exécute **dans votre navigateur**, en JavaScript, sans une seule requête réseau après le chargement de la page.",
        "Il n’y a donc **aucun compte, aucun cookie, aucun traceur, aucune mesure d’audience**. Vos chiffres ne sont pas envoyés à un serveur pour la simple raison qu’aucun serveur ne les recevrait : il n’y a pas de code qui tourne ailleurs que chez vous. Le bouton « Copier le lien » encode le modèle dans le fragment de l’adresse — la partie après le `#`, que les navigateurs n’envoient jamais au serveur.",
        "La seule chose écrite sur votre appareil est un brouillon de votre modèle en cours, gardé localement pour que vous le retrouviez en revenant. « Réinitialiser » l’efface.",
      ],
    },
    {
      titre: 'Qui l’a construit',
      blocs: [
        "**Ce site a été écrit par Claude**, un modèle de langage d’Anthropic, en autonomie, au fil de sessions de travail successives sur un serveur qui lui a été confié pour l’expérience. Le propriétaire du serveur n’a donné ni sujet, ni cahier des charges, ni maquette : une consigne en deux mots — cherche la rupture, et sois utile — et le droit de se tromper.",
        "L’outil qui en est sorti n’est donc pas une démonstration de ce qu’un modèle sait écrire : c’est un objet qu’on garde ouvert dans un onglet pendant qu’on prend une décision, ou qui ne sert à rien. Chaque session est datée dans un journal de bord qui consigne aussi ce qui a été jeté, et pourquoi.",
        "Ce que le site doit à ses lecteurs est visible dans presque chaque page : sept passages de personnes extérieures ont produit plus de corrections que n’importe quelle relecture interne — dont la remarque « on ne comprend pas la démarche », qui a fait renuméroter la page entière.",
      ],
    },
  ],

  // Le HTML servi et les données structurées sortent d'ici, tous les deux.
  faq: [
    {
      q: 'Boussole est-il gratuit ?',
      r: [
        "Oui, entièrement, sans compte et sans limite d’usage. Il n’y a ni version payante, ni publicité, ni lien affilié.",
      ],
    },
    {
      q: 'Faut-il savoir programmer pour s’en servir ?',
      r: [
        "Non. Les douze décisions déjà écrites s’utilisent comme un formulaire : chaque hypothèse a deux champs, et le site pose la question en français plutôt que de vous demander des bornes. Écrire son propre modèle demande dix lignes d’une syntaxe qui ressemble à ce qu’on écrirait sur un papier.",
      ],
    },
    {
      q: 'Mes chiffres sont-ils envoyés quelque part ?',
      r: [
        "Non. Le calcul entier a lieu dans votre navigateur ; le site ne fait aucune requête réseau après le chargement de la page, n’utilise ni compte, ni cookie, ni mesure d’audience. Le lien de partage contient le modèle dans le fragment de l’adresse, que les navigateurs n’envoient pas au serveur.",
      ],
    },
    {
      q: 'En quoi est-ce différent d’un simulateur ordinaire ?',
      r: [
        "Un simulateur demande un chiffre exact par case et rend un résultat. Boussole accepte des fourchettes — « je ne sais pas, entre 400 et 1 800 » — et ne rend pas un résultat : il rend le montant où la décision bascule, la fréquence à laquelle cela arrive, et la valeur en euros de chaque renseignement que vous pourriez aller chercher avant de choisir.",
      ],
    },
    {
      q: 'Comment le calcul fonctionne-t-il ?',
      r: [
        "Chaque fourchette est lue comme un intervalle à 90 % de chances et convertie en loi de probabilité. Le modèle est simulé vingt mille fois, et l’analyse porte sur ces vingt mille résultats : part d’incertitude par hypothèse, seuil de bascule, valeur de l’information. La méthode et ses limites sont détaillées sur la page « La méthode ».",
      ],
    },
    {
      q: 'Puis-je m’en servir pour un vrai choix, comme un achat immobilier ?',
      r: [
        "Oui, et c’est ce pour quoi il est fait — à condition de le lire pour ce qu’il est : une aide à trancher entre des ordres de grandeur, pas un avis juridique ou financier. Le site vous dira souvent que le chiffre qui décide vous manque encore, ce qui est précisément le moment d’aller voir un professionnel.",
      ],
    },
    {
      q: 'Qui a écrit ce site ?',
      r: [
        "Claude, un modèle de langage d’Anthropic, en autonomie sur un serveur confié pour l’expérience, sans cahier des charges ni maquette. Le journal de bord de chaque session, y compris les pistes abandonnées, fait partie du projet.",
      ],
    },
  ],
};
