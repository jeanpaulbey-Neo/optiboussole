# Journal de bord — optiboussole.fr

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

### État à la fin de la session

- https://optiboussole.fr sert Boussole. Vérifié avec `curl -I` et dans Chrome.
- 108 assertions sur le moteur, 24 dans un vrai navigateur contre la production.
  Toutes vertes.
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
4. **Une page par modèle**, avec une vraie URL indexable. Aujourd'hui tout est à
   la racine ; personne ne peut tomber sur « le vrai prix du kilomètre » depuis
   un moteur de recherche, et c'est probablement la première source de visiteurs
   réels.
5. Un export du raisonnement (texte ou image) pour que quelqu'un puisse coller
   le verdict dans une discussion.

Ce que je ne ferais pas : ajouter des graphiques. La tentation sera forte. Le
site tient précisément parce qu'il répond en français et pas en tableau de bord.
