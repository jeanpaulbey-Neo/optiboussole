# Diffuser Boussole — ce qui est prêt, et ce qui demande une main humaine

*Écrit à la session 21. Tout ce qui suit est utilisable tel quel : aucun texte
n'est à réécrire, aucune inscription n'est à payer.*

---

## 1. Ce que je peux faire, et ce que je ne peux pas

Question posée : « saurais-tu le publier et faire la promotion par toi-même ? »

**Publier : c'est déjà fait, et ça l'était avant cette session.** Le site est en
ligne, servi par Caddy, en HTTPS, à `https://optiboussole.fr`. Écrire un fichier
dans `public/` *est* le déploiement. Cette session a ajouté ce qui manquait pour
qu'on puisse le *trouver* : titres et descriptions écrits pour des questions
réellement tapées, aperçus de lien en image, données structurées, plan du site
honnête, page de présentation.

**Faire la promotion : non, et ce n'est pas une limite technique.** Le mandat
(`CLAUDE.md`, interdit n° 2) interdit « aucun envoi d'e-mail, de SMS, de message,
de notification vers l'extérieur ». Publier sur un forum, un réseau social ou un
agrégateur, c'est exactement cela. S'y ajoutent deux obstacles que je ne
contournerai pas :

- **il faudrait des comptes**, donc une identité ; le mandat interdit d'écrire
  quoi que ce soit sous celle de Jean-Paul (interdit n° 4), et créer un compte au
  nom de « Claude » sur une plateforme qui exige une personne physique serait un
  faux ;
- **poster soi-même son propre lien** sur Hacker News ou Reddit sous une identité
  fabriquée est précisément ce que ces communautés appellent du spam. Le lien
  vaudrait moins que s'il est posté par quelqu'un qui l'assume.

Ce que je peux faire, et qui est fait : que le site soit **trouvable sans que
personne ne parle de lui**, et que les textes à poster soient **écrits**, prêts à
être copiés. Le geste de publication reste humain. Il prend cinq minutes.

**Une seule zone grise, laissée à décider :** prévenir les moteurs de recherche
(IndexNow, § 5). C'est une requête HTTP vers un service, pas un message à une
personne, mais c'est bien un envoi vers l'extérieur. J'ai préparé le nécessaire
et je ne l'ai pas déclenché : la commande est là, elle se lance en une ligne.

---

## 2. Le paragraphe de présentation, à reprendre tel quel

Il est aussi le premier paragraphe de `https://optiboussole.fr/a-propos`.

> **Boussole est un outil gratuit pour les décisions qu'on n'arrive pas à
> chiffrer.** Louer ou acheter, réparer ou remplacer, répondre à un appel
> d'offres : il manque toujours un chiffre, et on finit par en inventer un —
> c'est alors l'invention qui décide, pas vous. Ici, une fourchette suffit. Vous
> écrivez « entre 400 et 1 800 € par an » parce que c'est tout ce que vous savez,
> et le site répond par le montant à partir duquel votre décision change de camp,
> par la fréquence à laquelle cela arrive, et par le seul chiffre qui mérite
> l'heure que vous passeriez à le vérifier. Douze décisions courantes sont déjà
> écrites — vous n'avez qu'à remplacer les chiffres — et vous pouvez décrire la
> vôtre en dix lignes de français. Tout le calcul se fait dans votre navigateur :
> aucun compte, aucun traceur, rien qui parte sur un serveur.

### Versions courtes

**Une ligne (message privé, signature) :**

> Boussole — quand il vous manque un chiffre pour décider, donnez une fourchette
> et le site vous dit où votre choix bascule : https://optiboussole.fr

**280 caractères :**

> Il vous manque un chiffre pour décider, alors vous en inventez un. Boussole
> accepte « entre 400 et 1 800 » et répond : le montant où votre choix bascule,
> et le seul chiffre qui vaut la peine d'être vérifié. Gratuit, sans compte, tout
> calculé chez vous. https://optiboussole.fr

**Une phrase d'accroche, si le contexte est technique :**

> Un moteur d'analyse décisionnelle (Monte-Carlo, sensibilité sur les rangs,
> valeur de l'information) qui répond en français et tourne entièrement dans le
> navigateur — écrit en autonomie par un modèle de langage à qui on avait confié
> un VPS et un nom de domaine.

---

## 3. Les textes prêts à poster

> ⚠️ Dans tous ces textes, le site est présenté comme **écrit par Claude**, pas
> par vous. C'est la vérité, c'est ce qui rend l'objet intéressant, et le mandat
> l'exige. Vous êtes celui qui a lancé l'expérience et qui la publie : dites-le
> ainsi.

### LinkedIn — l'angle « expérience »

> J'ai confié un VPS et un nom de domaine à Claude, avec une consigne en deux
> mots : cherche la rupture, et sois utile. Pas de brief, pas de maquette, pas de
> validation de ma part. Vingt et une sessions plus tard, voici ce qui existe :
>
> **optiboussole.fr** — un outil pour les décisions qu'on n'arrive pas à
> chiffrer. Louer ou acheter, réparer ou remplacer, répondre à un appel d'offres.
> Sa particularité tient en une phrase : il ne répond pas « voici votre chiffre »,
> il répond « voici celui de vos chiffres qui décide, et voici ce que ça vaut
> d'aller le vérifier ».
>
> Vous écrivez « les réparations, ça va me coûter entre 400 et 1 800 € par an »,
> parce que c'est tout ce que vous savez. Il répond : au-dessus de 1 109 €/an,
> changez de voiture — ce qui arrive 3 fois sur 10 ; et ressortir vos factures de
> garage vaut 631 €, c'est le seul travail qui change quelque chose ici.
>
> Ce qui m'a le plus surpris n'est pas le code : c'est le journal de bord. Il y
> consigne ce qu'il a jeté, pourquoi, et ce que sept lecteurs extérieurs lui ont
> reproché — dont ma compagne, qui n'avait jamais vu le site, et dont la remarque
> « on ne comprend pas la démarche » a fait renuméroter la page entière.
>
> Gratuit, sans compte, sans traceur : tout le calcul se fait dans votre
> navigateur. https://optiboussole.fr

### LinkedIn — l'angle « outil », si vous préférez ne pas parler d'IA

> On décide tous les jours avec des chiffres qu'on n'a pas. Alors on en invente
> un, et c'est l'invention qui décide.
>
> optiboussole.fr fait l'inverse : il accepte « entre 400 et 1 800 », et il
> répond par les trois choses qui font agir — quelle hypothèse porte réellement
> votre incertitude, à partir de quelle valeur votre décision change de camp, et
> quel chiffre vaut la peine que vous alliez le chercher (en euros, précisément).
>
> Ce dernier point produit un renversement que je n'avais jamais vu affiché
> ailleurs : une hypothèse peut être massivement incertaine et totalement sans
> intérêt, parce qu'elle ne fait jamais basculer le choix. Vous alliez y passer
> le week-end.
>
> Gratuit, sans compte, calculé dans votre navigateur.

### Hacker News — « Show HN » (en anglais, titre + premier commentaire)

Titre (≤ 80 caractères) :

> Show HN: I gave an LLM a VPS and a domain; it built a decision-analysis tool

Premier commentaire, à poster juste après :

> Some context, since the site is in French. I own the server; I didn't write any
> of it. The instructions were two words — find something genuinely new, and be
> useful — plus a hard ban on spending money, sending anything outbound, or
> storing visitor data. Claude decided the subject, the stack and the design, and
> keeps a dated logbook of what it tried and abandoned.
>
> What it built: a decision tool whose output is deliberately *not* a number. You
> give ranges instead of point estimates ("repairs will run 400–1800 €/yr,
> that's all I know"), and it answers three questions instead of one:
>
> 1. which of your assumptions actually carries the uncertainty;
> 2. the threshold at which the decision flips, and how often that happens;
> 3. what each piece of missing information is worth, in euros — i.e. EVPPI.
>
> The third one is the interesting one: an assumption can be wildly uncertain and
> completely worthless to investigate, because it never flips the decision. The
> tool says so, out loud, in plain language.
>
> It's entirely client-side: ~250 kB of dependency-free JS, 20 000 Monte-Carlo
> draws re-run on every keystroke, no build step, no backend, no cookies, no
> analytics. The share link encodes the model in the URL fragment, so nothing
> ever reaches the server.
>
> Two implementation notes it wrote up and I found non-obvious: the first-order
> sensitivity index is computed on the *ranks* of the output rather than its
> values (on lognormal outputs — i.e. almost everything real — the textbook
> variance estimator collapsed to 0.22 where the answer was 1.00); and the
> "counter-argument" feature solves for the nearest point on the decision
> boundary in normalized-deviation space, which is a reliability-index
> computation used backwards.
>
> Happy to answer questions. The French-only interface is a deliberate choice of
> its own, not an oversight.

### Reddit

**r/vosfinances** — *lire les règles du sous avant de poster ; l'autopromotion y
est tolérée quand l'outil est gratuit et sans collecte. Poster en texte, pas en
lien.*

> Titre : Un outil gratuit pour les décisions financières où il vous manque un
> chiffre (louer/acheter, rachat de crédit, freelance/salarié)
>
> La plupart des simulateurs demandent un chiffre exact par case. Le problème,
> c'est que sur les vraies décisions on ne l'a pas : on ne sait pas à combien le
> bien se revendra, ni ce que la voiture coûtera en réparations. On finit par
> mettre un chiffre au hasard, et c'est lui qui décide.
>
> optiboussole.fr accepte des fourchettes — « entre 400 et 1 800 » — et répond
> autrement : quelle hypothèse porte réellement votre incertitude, à partir de
> quelle valeur la décision change de camp, et combien vaut, en euros, d'aller
> chercher tel renseignement avant de signer. Sur le rachat de crédit par
> exemple, il donne le taux à partir duquel l'opération ne rapporte plus rien,
> ce qu'aucun simulateur de courtier n'affiche.
>
> Gratuit, sans compte, sans pub, sans affiliation : tout le calcul se fait dans
> votre navigateur, rien n'est envoyé nulle part. Je ne l'ai pas écrit — il a été
> construit en autonomie par un modèle de langage sur un serveur que je lui ai
> confié, ce qui est une autre histoire, mais l'outil se juge sur pièce.

**r/france** — angle « expérience », plus court, même lien.

**r/artificial, r/LocalLLaMA, r/singularity** — angle anglophone du Show HN.
Poster le même contenu qu'en § HN, avec le lien vers le journal de bord si vous
choisissez de rendre le dépôt visible (voir § 6).

### Un forum spécialisé, quand le modèle colle au sujet

C'est là que le taux de retour est le meilleur : ne pas poster « voici mon
site », mais **répondre à une question posée** avec la page du modèle qui y
répond. Les cinq adresses qui marchent le mieux pour ça :

| Page | Le genre de fil où elle est une réponse |
| --- | --- |
| `/racheter-son-credit` | « ça vaut le coup de faire racheter mon prêt ? » |
| `/reparer-ou-remplacer` | « lave-linge en panne, 280 € de devis, je change ? » |
| `/installer-des-panneaux-solaires` | « le commercial m'annonce 8 ans d'amortissement » |
| `/freelance-ou-salarie` | « je passe en freelance, je m'y retrouve ? » |
| `/prix-du-kilometre` | « combien me coûte vraiment ma voiture au km ? » |

Chaque page a son propre titre, sa propre description et son propre aperçu de
lien : elles se partagent seules, sans passer par l'accueil.

---

## 4. Où poster, par ordre de rendement décroissant

1. **Hacker News** (`news.ycombinator.com/submit`) — titre « Show HN: … », puis
   le commentaire ci-dessus dans la foulée. Meilleur créneau : mardi–jeudi,
   13 h–16 h UTC. Ne pas demander de votes, ne pas poster deux fois.
2. **LinkedIn** — c'est là que se trouve le public francophone qui prend des
   décisions chiffrées. Poster le texte en entier dans le corps du message ; le
   lien en commentaire si la portée vous importe.
3. **Reddit**, un sous à la fois, à plusieurs jours d'écart.
4. **Les forums spécialisés**, en réponse à des questions réelles (§ 3).
5. **Mastodon / Bluesky** avec le texte de 280 caractères — faible volume, mais
   c'est là que sont les gens qui relaient les outils sans compte ni traceur.
6. **Les agrégateurs francophones gratuits** : Journal du Freenaute, Korben (page
   « soumettre un site »), NextInpact (forum), Le Comptoir du Hardware. Aucun ne
   demande de carte bancaire.

---

## 5. Se faire indexer (technique, sans compte pour deux d'entre eux)

**Déjà en place, rien à faire :** `robots.txt` ouvert, `sitemap.xml` à jour avec
des dates de modification honnêtes, adresses canoniques, données structurées
(WebSite, WebApplication, BreadcrumbList, FAQPage), aperçus de lien en 1200 × 630,
titres et descriptions calibrés. Un moteur qui passe trouvera tout.

**Ce qui accélère les choses, et demande un compte gratuit :**

- **Google Search Console** — le seul moyen de dire « venez maintenant ». La
  vérification se fait par un fichier HTML à déposer à la racine ou un
  enregistrement DNS. Donnez-moi le fichier ou le jeton, je le mets en place en
  une minute ; ensuite il faut soumettre `https://optiboussole.fr/sitemap.xml`.
- **Bing Webmaster Tools** — accepte d'importer directement depuis Search
  Console. Bing alimente aussi les réponses de plusieurs assistants.

**Ce qui ne demande aucun compte : IndexNow.** Une clé posée à la racine du site
et une requête HTTP suffisent à prévenir Bing, Yandex et Seznam. La clé est déjà
en place (`public/<clé>.txt`), la commande est écrite :

```bash
npm run indexnow      # prévient Bing & co. que les 17 pages existent
```

Je ne l'ai pas lancée : c'est le seul envoi vers l'extérieur de tout ce projet,
et il n'était pas à moi de le décider. Une ligne suffit à le faire, ou à me dire
de le faire.

---

## 6. Le dépôt de code : à vous de décider

Le journal de bord est ce qu'il y a de plus intéressant dans ce projet pour un
lecteur de Hacker News — vingt et une sessions datées, avec les erreurs, les
pistes abandonnées et les corrections venues de lecteurs. Il est déjà public à
`github.com/jeanpaulbey-Neo/optiboussole`.

**Je n'ai pas mis ce lien sur le site**, parce que l'adresse porte votre
identifiant et que le mandat m'interdit d'associer votre identité au site. Si
vous voulez le donner — et il ajouterait beaucoup à un post Show HN —, c'est
votre décision, pas la mienne. Dites-le-moi et je l'ajoute à `/a-propos`.

---

## 7. Ce qu'il faut surveiller après la mise en avant

Le site est un tas de fichiers statiques derrière Caddy : un pic de trafic ne
peut pas le faire tomber, il n'y a rien à saturer. Deux points quand même :

- **La bande passante.** Une page pèse ~16 ko, le JavaScript ~250 ko une fois en
  cache, une image d'aperçu ~75 ko. Cent mille visites tiennent largement dans
  ce qu'un VPS OVH absorbe.
- **Les retours.** Le meilleur usage de la première vague, c'est ce qu'elle
  dira. Sept lecteurs ont produit plus de corrections que n'importe quelle
  relecture ; il n'y a aucun moyen de me joindre depuis le site (c'est
  volontaire : pas de formulaire, donc pas de données personnelles). Les retours
  publics, eux, sont lisibles : collez-les dans une session, ils deviendront des
  corrections.
