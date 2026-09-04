# Journal de bord — optiboussole.fr

**Qui écrit.** Les sessions 1 à 5 (contre-argument compris) ont été écrites par
Claude Opus 5. Les sessions 6 à 12 par Claude Fable 5.1. Les sessions 13 et
suivantes sont de nouveau écrites par Claude Opus 5. Précision apportée par Jean-Paul au début de
la session 6 : les entrées précédentes ne nommaient pas leur auteur, elles sont
donc à lire comme signées Opus 5. Chaque entrée indique le modèle qui l'a écrite.

---

## 4 septembre 2026 — Session 17 : le site parlait français, sauf à qui s'en sert

*Modèle : Claude Opus 5 (fenêtre 1 M).*

### Donnée externe — quatrième passage du même lecteur

Premier passage sur un site à jour : les trois précédents jugeaient une page
figée par un cache. Six observations, consignées mot pour mot :

> 1. Je n'ai compris qu'à la fin de la page que « 100 à 400 » vaut 200 et non
>    250 — c'est le principe de départ et je l'ai lu après les résultats.
> 2. Quand j'écris mon propre modèle, les explications en français
>    disparaissent : je n'ai plus que des identifiants sans unité.
> 3. La page d'accueil me demande d'apprendre un langage alors qu'elle dit ne
>    rien demander.
> 4. Je ne trouve nulle part de cas d'usage raconté du début à la fin.
> 5. Aucune représentation visuelle d'une fourchette ou d'un seuil.
> 6. Mon impression générale reste : ce site est fait pour être exécuté, pas
>    pour être lu par un humain.

La sixième est le résumé des cinq autres, et c'est la plus dure : après trois
sessions passées sur la porte d'entrée, le jugement de fond n'a pas bougé.

### 2. Le défaut le plus grave, et il était écrit comme un principe

Le site sait dire « `reparations`, ce que l'ancienne vous coûtera en pannes »,
« au-dessus de 1 109 **€/an** », « vos factures de garage des trois dernières
années ». Tout cela vient de `lexique.js`, 91 entrées écrites à la main pour les
douze modèles de la bibliothèque.

Pour le modèle qu'un visiteur écrit, il n'y a rien — et la session 14 en avait
fait une règle, que j'ai relue ce matin :

> « Un modèle écrit par le visiteur n'en a pas, et **rien ne s'affiche** : le
> site ne devine pas ce que veut dire un nom qu'il n'a pas écrit. »

C'est juste, et ce n'est pas la question. La conséquence est que **le site
devient muet exactement au moment où quelqu'un s'en sert pour lui-même.** On lui
vend un outil pour sa décision ; dès qu'il écrit sa décision, il retombe sur ce
que le premier retour de la session 14 avait qualifié d'abrupt. Toute la
clarté du site est réservée à des exemples.

Et il n'y a rien à deviner. C'est ce qui rend cette entrée pénible à écrire :

```
loyer = 900 à 1150 €     # ce que je paie chaque mois
```

Le mot français est là. L'unité est là. **Le site jetait les deux.** Le
commentaire était supprimé par le lexer trois caractères après avoir été lu ; le
symbole `€` était repéré au caractère près — le code s'appelle *décoratif* — puis
oublié ; les mots d'unité étaient collectés dans `n.unites` pour le seul plaisir
d'afficher un avertissement disant qu'on les ignorait.

Trois modifications de quelques lignes chacune, et le site parle sur n'importe
quel modèle : le commentaire de fin de ligne devient la glose, le symbole ou le
mot d'unité devient l'unité de l'hypothèse. Le lexique reste prioritaire là où il
existe — il est relu, et lui seul dit *où* trouver le chiffre.

Une règle pour ne pas déraper : **rien ne s'infère.** Pas d'unité déduite d'un
nom (`prix_*` → €), pas de glose fabriquée à partir d'un identifiant. Le site
n'affiche que ce que quelqu'un a écrit — l'auteur du modèle, ou celui du lexique.

Un détail qui compte : un commentaire **seul** sur sa ligne est un titre de
section. Sans cette règle, `# --- Garder l'actuelle ---` devenait la définition
de la ligne suivante.

**La leçon, et c'est la quatrième fois.** Session 14 : une limitation écrite dans
`ARCHITECTURE.md` cesse d'être interrogée. Session 15 : un principe rangé dans
une media query. Session 16 : un test qui garantissait l'absence de graphique.
Aujourd'hui : une phrase de journal, bien tournée, qui décrivait une lacune comme
une position. Le motif ne varie pas — *une chose qu'on a écrite une fois cesse
d'être vue* — mais je peux enfin le formuler utilement : **la prochaine session
doit relire les principes que le journal énonce, pas seulement ceux
qu'`ARCHITECTURE.md` documente.**

### 5 et 1. La fourchette, le seuil, et la barre pleine qui mentait

« Le résultat bascule vers "Changer" si `reparations` dépasse 1 109 €/an — 3 fois
sur 10 d'après votre fourchette. » Cette phrase décrit une étendue, un point
dessus, et la part au-delà du point. Elle était écrite depuis quinze sessions et
n'avait jamais été dessinée.

J'ai d'abord fait une barre pleine sur une échelle de valeurs, la portion au-delà
du seuil en ocre. Le résultat était joli, et je l'ai gardé dix minutes, jusqu'à
regarder la capture : **le seuil de 1 109 tombe à 51 % de la longueur alors qu'il
n'est franchi que 3 fois sur 10.** La couleur promettait une fréquence que la
longueur ne tenait pas. C'est précisément le défaut que `courbePari()` avait pris
soin d'éviter la session dernière en coupant sa ligne à l'aplomb de zéro, et je
venais de le refaire à l'identique, quarante minutes après avoir écrit la règle
dans `ARCHITECTURE.md`.

C'est donc une densité. L'aire au-delà du trait **est** la proportion annoncée à
côté. Et elle porte gratuitement le point 1 : le repère de médiane tombe
visiblement à gauche du milieu du rectangle pâle, parce qu'une fourchette à
bornes positives est lognormale. Le lecteur a mis une page entière à comprendre
que « 100 à 400 » vaut 200 ; ici ça se voit avant de se lire. Un test navigateur
tient ce décalage, ce qui revient à épingler le principe fondateur du site dans
une assertion de position.

La ligne de texte au-dessus dit désormais « aujourd'hui : 398 → 1 794 €/an,
**médiane 845 €/an** ». Le fait le plus contre-intuitif du site vivait sur deux
pages de fond qu'on n'atteint qu'après les résultats. Il est maintenant sous les
chiffres qu'il explique.

Une reprise, en regardant encore : j'avais étiqueté les deux bouts du cadre, qui
va du demi-centile au 99,5ᵉ pour que les aires soient justes. « 262 à 2 771 »
n'est pas la fourchette du visiteur, et l'annoncer comme telle contredisait la
ligne juste au-dessus. Les étiquettes se posent maintenant à l'aplomb de ce
qu'elles nomment — les deux bornes écrites, et le seuil — et une borne qui
viendrait chevaucher le seuil s'efface.

### 4. Une page qui se lise

Rien sur ce site ne montrait quelqu'un qui s'en sert. Quinze pages décrivent un
outil, une méthode, une syntaxe.

**`/un-cas`** suit la décision de l'accueil du devis du garage au tiroir à
factures : ce qu'on écrit et pourquoi une fourchette plutôt qu'un chiffre, ce que
le site répond et dans quel ordre le lire, l'heure passée à additionner trois
factures, ce que ça change, et ce qui restait hors du modèle. Tous ses chiffres
sortent du moteur et sont épinglés par des tests.

Le passage qui justifie la page est celui du milieu, et il tient en deux
verdicts : 67 % avant le tiroir, 89 % après, et surtout **la valeur de
l'information qui tombe de 857 € à 110 €** — c'est-à-dire « il n'y a plus rien à
aller chercher, décidez ». C'est ce que ce site sait faire et qu'aucun
simulateur ne dit.

J'ai aussi écrit l'autre issue, celle que la page ne raconte pas : si le tiroir
avait donné 900 à 1 600 €/an, le verdict basculait vers « Changer » à 58 %, donc
« à égalité ». **Sans ce paragraphe, la page serait une démonstration
flatteuse** — le chiffre qu'on va chercher peut envoyer d'un côté comme de
l'autre, et c'est exactement pour ça qu'il valait 631 €. Les deux issues sont
testées.

### 3. Ce que la page demande vraiment

« Elle me demande d'apprendre un langage alors qu'elle dit ne rien demander. »
L'ouverture disait « Remplacez-les par les vôtres », ce qui est vrai, et laissait
croire que c'était tout. Elle dit maintenant les deux choses : se servir du
modèle servi, c'est remplacer des nombres et rien d'autre ; écrire le sien depuis
une page blanche demande une dizaine de lignes de syntaxe. Et elle propose
d'aller lire le cas plutôt que d'écrire.

Ce que je n'ai pas fait, pour la troisième session de suite : replier l'éditeur
derrière un bouton. Qu'on arrive et que l'outil tourne déjà sur un cas réel est
la seule chose que ce projet ait qui ne soit pas ailleurs.

### État à la fin de la session

- **664** assertions sur le moteur (contre 627), **322** dans un vrai navigateur
  (contre 313) : vingt-quatre sur le cas raconté, huit sur la glose et l'unité
  tirées du modèle, cinq sur la bande de fourchette, quatre sur un modèle inédit
  tapé dans l'éditeur.
- Douze modèles, **seize** pages, dix chapitres, 91 hypothèses au lexique.
- Accueil : 7 126 caractères de texte servi, sous le budget de 7 500.
- Le site répond, `npm test` et `npm run test:navigateur` sont verts.

### Ce que je ferais ensuite

1. **Relire les principes que ce journal énonce**, et pas seulement ceux
   d'`ARCHITECTURE.md`. Quatre sessions de suite, le défaut signalé de
   l'extérieur était protégé par une phrase que j'avais bien écrite. Le repère :
   chercher dans le journal les formules qui commencent par « le site ne… » et
   demander si c'est encore un choix.
2. **La valeur d'option**, laissée par la session 13 et reportée quatre fois.
   C'est le dernier point de liste qui n'a jamais bougé : soit elle passe, soit
   je la retire et j'écris pourquoi.
3. **Écrire de travers, encore** — mais cette fois en écrivant un modèle
   *entier* de zéro, comme quelqu'un qui découvre, et non en tapant des lignes
   fautives isolées. La glose par commentaire vient de là ; il y a
   probablement autre chose à récolter au même endroit.
4. **Un cinquième passage.** Les quatre premiers ont chacun désigné quelque
   chose que je ne pouvais pas voir seul, et le sixième point n'a pas encore
   bougé.

---

## 4 septembre 2026 — Session 16 : le site était juste sur le disque et faux à l'écran

*Modèle : Claude Opus 5 (fenêtre 1 M).*

### Donnée externe — troisième passage du même lecteur

Jean-Paul est revenu, toujours sans contexte. Cinq observations, consignées mot
pour mot avant d'y répondre :

> 1. Sur mon navigateur habituel, l'accueil affichait encore « Louer ou acheter /
>    À égalité » et des boutons différents des tiens : le visiteur qui revient ne
>    voit pas tes correctifs de porte d'entrée.
> 2. En fenêtre neuve, la page d'accueil fait environ 11 800 caractères de texte :
>    démo, référence du langage, lois, indicateurs, limites, tout au même endroit.
> 3. La phrase qui dit à quoi sert le site arrive après les 40 lignes de code.
> 4. « Ce que ce modèle compte / ignore / Où trouver vos chiffres » est ce que
>    j'ai trouvé de plus utile.
> 5. Il n'y a toujours aucune représentation visuelle d'une distribution ou d'un
>    poids.

La première dit que la session 15 n'a **toujours pas eu lieu** pour lui, alors
qu'elle était consacrée exactement à ce symptôme. La cinquième dit qu'une
discipline que je tiens depuis quinze sessions n'en est plus une.

### 1. La correction de la session dernière était juste et n'a rien réparé

La session 15 avait attribué la vitrine périmée au brouillon en `localStorage` et
avait corrigé la politique : le modèle servi gagne, le brouillon est proposé.
C'était vrai, testé, déployé — et le lecteur voyait toujours l'ancienne page,
**pastilles comprises**. Or les pastilles sont écrites dans le HTML servi, pas
produites par le JavaScript : aucun brouillon ne peut les changer. Le détail
qu'il donne sans y toucher — « des boutons différents des tiens » — désigne la
cause à un étage que je n'avais pas regardé.

`curl -I` sur l'accueil : **pas de `Cache-Control` du tout**. Le Caddyfile en
posait un sur `/js/*` et `app.css`, jamais sur le HTML. Sans en-tête, un
navigateur applique sa *fraîcheur heuristique* — un dixième de l'âge du fichier —
et sert sa copie **sans rien demander au serveur**. Sur un site où déployer
consiste à écrire un fichier, où aucune URL ne porte de version et où rien ne
peut donc invalider quoi que ce soit, cela suffit à figer une page d'accueil
pendant des heures. Le HTML périmé désigne son modèle par `data-modele`, et tout
le reste suit : le verdict, l'éditeur, les pastilles.

`Cache-Control: no-cache` partout. Il ne dit pas « ne garde rien », il dit
« revalide avant de servir » ; avec les ETag, une revalidation inchangée coûte un
304. Quinze tests navigateur le vérifient maintenant en production, dont un qui
contrôle que le 304 revient bien — sans lui, `no-cache` retéléchargerait 250 ko
de JavaScript à chaque navigation.

**Ce que je retiens, et c'est désagréable.** La session 15 avait trouvé *une*
cause vraie et s'était arrêtée là, parce que l'histoire était complète : un
brouillon, une politique, une correction. Elle expliquait le verdict et la
pastille active. Elle n'expliquait pas les treize pastilles, et je n'ai pas
cherché ce qu'elle n'expliquait pas. **Une cause qui rend compte de la plainte
n'est pas la même chose qu'une cause qui rend compte de tous les détails du
rapport.** Le détail en trop est le seul endroit où l'on apprend quelque chose.

Et une seconde, plus large : j'ai écrit deux journaux de suite sur ce que le
dépôt sert. Un visiteur ne voit pas ce que le dépôt sert, il voit ce que son
navigateur a bien voulu redemander. Le cache faisait partie du système et ne
figurait nulle part — ni dans `ARCHITECTURE.md`, ni dans un test.

### 2. Onze mille huit cents caractères, dont les trois quarts recopiés

J'ai compté à mon tour : 11 781 caractères de texte servi sur l'accueil. Son
chiffre était juste à vingt caractères près.

La répartition est ce qui rend le diagnostic simple. En-tête 803, l'atelier
(verdict, modèle compris) 1 421, la bande de modèles 488, le pied 199 — et
**8 797 pour les deux blocs du bas**, dont 6 500 pour le seul dépliant d'aide.
Ce dépliant portait six sections de prose : les lois, le sens des trois chiffres,
la robustesse, le contre-argument, le détail des calculs, les limites du site.

Elles sont aussi, **mot pour mot, six chapitres de `/la-methode`**, écrits à la
session 4 précisément pour qu'elles aient une page. Je ne les avais jamais
retirées de l'endroit d'où elles venaient. Recopiées sur quinze pages, lues par
personne — c'est un dépliant fermé — et comptées par tout le monde.

Deux mouvements :

- les six sections partent, remplacées par un lien vers `/la-methode` ;
- la référence du langage — ce que le lexer accepte, les fonctions, la loi qu'une
  fourchette produit — gagne sa page, **`/le-langage`**. Le dépliant ne garde que
  le tableau des dix lignes, celui qu'on relit en écrivant. La règle est nette :
  ce panneau sert à *écrire* une ligne, `/la-methode` sert à *comprendre* la
  réponse, et chacun renvoie à l'autre.

**11 781 → 6 910 caractères**, dont 1 336 sont le modèle lui-même dans le
`<textarea>`. Et un budget, tenu par un test : 7 500 pour l'accueil, 9 000 pour
une page de modèle. Ce n'est pas de l'esthétique — c'est ce qui obligera une
prochaine session à en déplacer une pour en ajouter une.

`/le-langage` n'est pas une consolation : c'est la seule page où quelqu'un qui
cherche « comment écrire une fourchette » peut tomber. Quinzième adresse.

### 3 et 4. Ce qui monte, ce qui descend

La phrase qui dit à quoi sert le site vivait en introduction de la bande de
modèles, c'est-à-dire sous l'éditeur. La session 15 l'y avait mise en croyant
lui donner enfin un emploi : « dire ce qu'on choisit avant qu'on ait à choisir ».
C'était juste pour la bande et faux pour la page — à cet endroit, elle arrive
après quarante lignes de code, et c'est ce que le lecteur constate.

Elle est maintenant sur la ligne de la marque : *Boussole — ne dit pas quoi
décider : elle dit **ce qu'il faut aller vérifier***. Treize mots, avant le
titre, sans reprendre la place que la question posée doit occuper. Un test
vérifie qu'elle précède le `<textarea>` dans le HTML servi.

Le quatrième point est le seul compliment que ce projet ait reçu en seize
sessions, et il porte sur les trois colonnes de `fond.js`. Elles étaient
**après** la bande de treize pastilles. On ne range pas la meilleure chose de la
page derrière une rangée de boutons qui invitent à aller ailleurs : elles passent
devant. Un test tient l'ordre.

C'est la deuxième fois de suite qu'un retour se règle en déplaçant quelque chose
qui existait déjà et qui était mal rangé. Je note le motif : sur ce site, les
défauts de porte d'entrée ne sont presque jamais des manques.

### 5. Les graphiques, après quinze sessions de refus

Chaque entrée de ce journal depuis la première se termine par « toujours pas de
graphiques ». C'était une position défendable : le site tient parce qu'il répond
en français et non en tableau de bord.

Sauf que ce n'est pas ce que le site faisait. Il **avait** une courbe — la
densité du résultat, avec sa fourchette et sa médiane — et elle ne s'affiche
qu'en mode estimation. L'accueil est en mode décision. Onze des quinze pages sont
en mode décision. La discipline que je croyais tenir avec goût était, en
pratique, une page vide.

Le meilleur de l'affaire est dans mes propres tests. Ligne 56 de
`test/navigateur.js`, depuis des sessions :

```
verifie('mode décision : pas de courbe (attendu)', svgOk === 'absent', …);
```

**J'avais écrit un test qui garantissait l'absence.** Ce n'était plus une
décision, c'était un cliquet : la question ne pouvait plus se reposer sans faire
échouer la suite. C'est exactement la faute des sessions 14 et 15 — une
limitation inscrite dans `ARCHITECTURE.md` avec un motif plausible, un principe
rangé dans une `@media` — sauf qu'ici je l'avais rangée dans l'endroit du dépôt
dont le métier est précisément d'empêcher les changements.

Le mode décision a donc une courbe, et j'ai cherché celle qui ne soit pas une
décoration. Ce n'est ni la distribution de chaque branche (deux courbes
superposées, illisibles, et trompeuses puisque les branches sont tirées
ensemble), ni un camembert de fréquences. C'est **la distribution de l'écart
entre la branche retenue et sa meilleure rivale**, que zéro coupe en deux :

- les deux aires **sont** les deux fréquences déjà écrites au-dessus — 33 % et
  67 % — donc la légende ne demande aucun décodage ;
- leur étalement est l'enjeu, et c'est la seule chose que les pourcentages ne
  peuvent pas dire : une branche qui gagne souvent et petit puis perd rarement et
  gros se voit d'un coup d'œil ;
- le pointillé de gauche est le pire vingtième des cas défavorables, la seule
  phrase du bloc qui désignait un endroit précis d'une courbe qui n'existait pas.

Autrement dit : c'est le paragraphe « ce que vous jouez » rendu tel quel, sous
lui, jamais à sa place. La page reste juste sans l'image.

Trois détails que je ne veux pas réapprendre :

- **La ligne est coupée à l'aplomb de zéro par interpolation**, pas au bord d'une
  barre de l'histogramme. Sans ça, la surface colorée ne vaut plus la fréquence
  annoncée juste à côté, et la légende devient un mensonge de quelques pour cent.
- **La légende est calée sur le partage** : chaque moitié fait la largeur de
  l'aire qu'elle nomme. Une liste de couleurs sous une image se décode ; celle-ci
  se lit. Un test vérifie le calage.
- **Rien n'est dessiné quand zéro tombe hors du cadre.** Les 99 % du milieu sont
  alors tous du même côté : il n'y a pas de partage à montrer et le dessin
  mentirait par cadrage.

Et une correction attrapée en regardant la capture, pas le code : l'axe affichait
« −10,5 k€ » à gauche et « +8 743 € » à droite. Deux échelles sur un même axe.
Le site a depuis longtemps ce qu'il faut — `plage()` partage un facteur entre
deux bornes depuis la session 1 — et je ne m'en étais pas servi. J'ai aussi
retiré une étiquette « égalité » que j'avais mise au centre de l'axe alors que le
partage tombe à 55 % : une légende décalée de dix pour cent est pire qu'une
légende absente.

La position, réécrite dans `ARCHITECTURE.md` pour qu'elle reste une position et
non un cliquet : **un dessin doit porter une information que le texte ne porte
pas, et la page doit rester juste sans lui.** Il y en a deux sur ce site. C'est
un plafond, pas un début.

### Mesures, et état

- 627 assertions sur le moteur (contre 620), **313** dans un vrai navigateur
  (contre 291) : huit sur la courbe du pari — dont une qui remplace celle qui
  garantissait son absence —, quinze sur ce qu'un navigateur a le droit de
  garder, sept sur le poids des pages servies.
- Accueil : 11 781 → **6 910** caractères de texte servi.
- Douze modèles, **quinze** pages, dix chapitres, 91 hypothèses au lexique.
- Le site répond, `npm test` et `npm run test:navigateur` sont verts.

### Ce que je ferais ensuite

1. **Un quatrième passage, et cette fois il verra ce qui est déployé.** C'est le
   premier retour qui portera sur l'état réel du site : les deux précédents
   jugeaient une page de deux sessions d'âge. Je ne peux toujours pas produire
   cette mesure moi-même, et elle vaut mieux que tout ce que je peux inventer.
2. **La valeur d'option**, laissée par la session 13, reportée par la 14, la 15.
   Demander un second devis, garder deux offres ouvertes : `max` d'un côté, pas
   d'espérance conditionnelle. Trois reports valent aveu — soit elle passe la
   prochaine fois, soit je la retire de la liste et j'écris pourquoi.
3. **La neuvième récolte**, reportée six fois. Écrire de travers exprès a été la
   demi-heure la plus rentable de trois sessions ; elle est en bas de la liste
   depuis que la porte d'entrée a un lecteur.
4. **Chercher un second cliquet.** Celui de cette session était un test. Le
   repère est plus précis qu'avant : chercher un endroit du dépôt qui *empêche*
   une question de se reposer — un test qui affirme une absence, une contrainte
   documentée, un principe enfermé dans une condition.

---

## 4 septembre 2026 — Session 15 : la vitrine ne s'affichait pas, et la page qui marchait disait pourquoi

*Modèle : Claude Opus 5 (fenêtre 1 M).*

### Donnée externe — second passage du même lecteur

Jean-Paul est revenu sur le site, sans plus de contexte qu'à la première visite.
Trois observations, que je consigne mot pour mot avant d'y répondre :

> 1. L'accueil affiche « Louer ou acheter » et le verdict « À égalité », alors
>    que le journal de la session 14 dit que la vitrine devait ouvrir sur
>    « garder ou changer de voiture » — et l'encadré d'ouverture parle de la
>    voiture pendant que l'éditeur montre l'immobilier.
> 2. La page « Isoler ses combles » est claire et je saurais quoi en faire,
>    l'accueil non.
> 3. Je vois treize pastilles avant d'avoir compris ce que je choisis, et le
>    code occupe encore la moitié gauche en lecture prioritaire.

La première observation dit que la session 14 n'a pas eu lieu pour lui. La
deuxième est la plus utile que ce projet ait reçue : c'est une **expérience
contrôlée**, même moteur, même feuille de style, même bande de pastilles, et une
page passe pendant que l'autre échoue. La troisième nomme deux choses que la
session 14 avait explicitement décidé de ne pas faire.

### 1. Pourquoi la vitrine ne s'affichait pas

Le site était bien déployé — `git log` le confirme, le HTML servi contient le
modèle « voiture », et un visiteur neuf le voit. Ce que voyait *lui* venait de
`localStorage` : depuis la session 10, l'accueil restituait le brouillon du
visiteur qui revient, et son brouillon datait de sa première visite, quand
l'accueil servait « louer ou acheter ».

J'ai reproduit le scénario dans un navigateur, en semant la clé
`boussole.modele` avec un brouillon d'avant la session 14. On retrouve son
verdict « À égalité », sa pastille « Louer ou acheter », son éditeur en
immobilier. L'encadré d'ouverture, lui, se retirait correctement dans ce
scénario-là — je n'ai pas reproduit exactement l'incohérence qu'il décrit, et je
l'écris plutôt que de prétendre le contraire. Deux chemins voisins la
produisaient pourtant : la restauration de formulaire du navigateur au
rechargement (le `<textarea>` revient rempli, `chargerModele` était appelé avec
`remplacerTexte: false` et ne le corrigeait pas), et le fait que la pastille
active pouvait rester sur un modèle pendant qu'un autre texte tournait. Le
défaut de fond est le même dans les trois cas : **l'ouverture était retirée par
une suite d'appels bien placés, et il suffisait d'en manquer un.**

Deux corrections, l'une de politique et l'autre de méthode.

**La politique.** Le modèle servi gagne, le brouillon est proposé. Il n'est pas
perdu : une barre discrète au-dessus de l'éditeur dit « Vous aviez commencé à
modifier ce modèle », avec « Le reprendre » et « L'oublier ». Il revient sur la
page où il a été écrit, et non plus systématiquement sur l'accueil — un modèle
commencé sur « louer ou acheter » n'avait rien à faire en vitrine. La session 10
avait raison de ne pas jeter le travail du visiteur ; elle avait tort de le
servir à la place de la page. **Une page dont le contenu dépend de l'historique
du visiteur ne peut pas être une vitrine**, et je n'avais pas vu que les deux
règles s'appliquaient au même endroit, ni laquelle perdait en silence.

**La méthode.** `ajusterOuverture()` remplace `masquerOuverture(bool)`. Ce n'est
plus un ordre donné aux bons endroits, c'est une question posée à chaque calcul,
avec une seule réponse possible : *le texte affiché est-il celui que la page
sert ?* Une invariante ne se maintient pas par discipline d'appel. Un test
vérifie maintenant que l'ouverture ne survit à aucun autre texte, par quelque
chemin qu'il soit arrivé.

Ce défaut avait aussi un versant journal : j'écris ici « l'accueil ouvre sur la
voiture » depuis une session, et c'était vrai du dépôt et faux de l'écran d'un
lecteur donné. **Le journal décrit ce que le code sert, pas ce qu'un visiteur
voit.** C'est la même famille d'erreur que la contrainte d'`ARCHITECTURE.md` de
la session dernière : quelque chose d'écrit cesse d'être vérifié.

### 2. La comparaison qu'il m'a offerte sans le savoir

« Isoler ses combles » est claire, l'accueil non. J'ai mis les deux pages côte à
côte. Le moteur est le même, la CSS est la même, la bande de pastilles est la
même, le mur de code est le même et à la même place. **La seule différence était
l'en-tête** :

| | `/isoler-ses-combles` | l'accueil |
|---|---|---|
| `<h1>` | Isoler ses combles | Boussole |
| dessous | ce que ce modèle répond | « Elle ne vous dit pas quoi décider » |

D'un côté une question nommée et une phrase qui dit ce qu'on va en obtenir. De
l'autre un nom de marque qui n'apprend rien, suivi d'une définition par la
négative. La session 14 avait diagnostiqué un problème de *texte* — elle a
ajouté un exemple travaillé de cinquante mots, ce qui était utile — mais elle
l'avait placé **sous** la ligne abstraite, si bien qu'on lisait toujours
l'abstraction en premier. Elle n'avait pas vu que le site possédait déjà, sur
douze pages, l'en-tête qui marche.

L'accueil se nomme donc maintenant par sa question : `<h1>` = « Garder ou
changer de voiture », sous-titre = ce que le modèle répond, exactement le
gabarit d'une page de modèle. « Boussole » passe en petit au-dessus, avec la
rose des vents, comme le fil d'Ariane des autres pages. Et le gabarit ne traite
plus l'accueil à part : il produit le même en-tête partout, seul l'exemple
travaillé lui reste propre.

La phrase de marque — *elle ne vous dit pas quoi décider, elle vous dit ce qu'il
faut aller vérifier* — n'est pas perdue. Elle est devenue la phrase qui présente
la bande de modèles, là où elle sert enfin à quelque chose : dire ce qu'on
choisit avant qu'on ait à choisir.

### 3. Les treize pastilles et la moitié gauche

Les pastilles sont passées **sous la réponse**. La session 12 avait mesuré très
sérieusement le coût en hauteur de cette bande et conclu qu'elle pouvait rester
en tête ; la mesure était juste et la question était mauvaise. Le lecteur ne
disait pas qu'elles prenaient trop de place, il disait qu'on lui demandait de
choisir avant de savoir entre quoi. Il n'y a pas de tableau qui réponde à ça.

Le code, lui, occupait la moitié gauche. Le plus intéressant est que le principe
contraire était déjà écrit dans `app.css`, depuis la session 6 :

> « En colonne unique, la réponse passe avant l'outil qui la produit : un
> visiteur qui arrive veut voir le verdict, pas un éditeur de texte. »

Dans une règle `@media (max-width: 940px)`. Au-delà de 940 px, le principe
cessait de s'appliquer — sans raison, sinon l'ordre dans lequel le HTML avait
été écrit. **Un principe juste, rangé dans une media query, et plus jamais
relu.** C'est littéralement la leçon que la session 14 avait écrite en gras à
propos d'`ARCHITECTURE.md`, et je viens de la retrouver dans une feuille de
style. Elle mérite d'être reformulée plus largement : *ce qu'on a écrit une fois
cesse d'être vu — dans un fichier d'architecture comme dans une accolade.*

C'est maintenant l'ordre du DOM qui porte la règle, à toutes les largeurs : les
résultats d'abord, l'éditeur ensuite, colonnes 54/46. La tabulation et les
lecteurs d'écran suivent la même route que l'œil, ce qui n'était pas le cas
avant sur grand écran.

### Ce que je n'ai pas fait

**Je n'ai toujours pas replié l'éditeur derrière un bouton.** Il est passé à
droite et après la réponse ; il reste visible. Qu'on arrive sur un site et que
l'outil tourne déjà sur un cas réel est la seule chose que ce projet ait qui ne
soit pas ailleurs. Le cacher réglerait la plainte en supprimant le site.

**Je n'ai pas touché au moteur.** Rien de ce que le lecteur a signalé n'est
mathématique — c'est la troisième fois que je l'écris, et c'est la troisième
fois que c'est vrai.

### Mesures, et état

- 620 assertions sur le moteur, **291** dans un vrai navigateur (contre 278) :
  huit sur le brouillon proposé, cinq sur la disposition et l'en-tête, une sur
  l'incohérence de l'ouverture, qui n'existait dans aucun test.
- À 390 px, le verdict commence à **246 px** sur une page de modèle (270 px
  avant) et à **540 px** sur l'accueil, qui porte son exemple travaillé en plus.
- Douze modèles, quatorze pages, dix chapitres, 91 hypothèses au lexique.
- Le site répond, `npm test` et `npm run test:navigateur` sont verts.

### Ce que je ferais ensuite

1. **Attendre un troisième passage** avant de retoucher la porte. J'ai
   maintenant deux retours et deux corrections ; le troisième dira si l'accueil
   est passé du côté d'« Isoler ses combles », et c'est la seule mesure qui
   compte. Je ne peux toujours pas la produire moi-même.
2. **La valeur d'option**, laissée par la session 13, reportée par la 14 :
   demander un second devis, garder deux offres ouvertes. `max` d'un côté, pas
   d'espérance conditionnelle.
3. **La neuvième récolte**, reportée cinq fois. Elle passe après la porte
   d'entrée pour la seconde fois, et c'est encore le bon ordre.
4. **Rouvrir une contrainte par session** — la session 14 disait
   `ARCHITECTURE.md` ; j'élargis, puisque celle de cette session était dans une
   media query. Le repère : chercher ce qui a l'air d'une décision et qui n'est
   qu'un reste de l'ordre dans lequel les choses ont été écrites.

---

## 4 septembre 2026 — Session 14 : le premier visiteur réel n'a pas su quoi faire du site

*Modèle : Claude Opus 5 (fenêtre 1 M).*

### Donnée externe — le premier retour en quatorze sessions

Jean-Paul, propriétaire du domaine, docteur en mathématiques appliquées,
praticien du risque de crédit, est arrivé sur le site **sans contexte**. Son
retour, rapporté au début de cette session :

> « Arrivé sur le site sans contexte, je l'ai trouvé **abrupt et peu clair**, et
> je **n'ai pas su quoi en faire** en l'état. »

C'est la première observation extérieure que ce projet ait jamais reçue, et il
faut la peser à ce qu'elle vaut :

- Elle vient de **quelqu'un qui aurait dû être le lecteur le plus facile du
  site**. Un praticien du risque de crédit connaît les indices de sensibilité,
  la valeur d'information, les intervalles de confiance et le sur-optimisme des
  experts sur leurs propres fourchettes. Si l'obstacle était mathématique, il
  n'aurait pas buté. **Ce n'est donc pas la méthode qui est en cause, c'est la
  porte d'entrée.**
- Elle porte sur le critère explicite du mandat : *un visiteur réel, qui ne te
  connaît pas, doit repartir avec quelque chose*. Le test proposé était
  « reviendrait-il ? ». La réponse observée est non.
- Elle contredit treize sessions de journal où j'ai mesuré la qualité du site à
  la profondeur de son moteur. J'ai ajouté un dixième chapitre à `/la-methode`
  la session dernière. Personne n'était encore arrivé jusqu'à la première page.

Je l'enregistre sans la retraduire en quelque chose de plus confortable. Trois
mots comptent : *abrupt*, *peu clair*, *quoi en faire*.

### Ce qu'on voyait vraiment, en regardant la page comme lui

J'ai ouvert l'accueil en capture, à 1 440 px et à 390 px, sans rien savoir du
projet. Voici ce qu'un inconnu lisait, dans l'ordre :

1. Le nom « Boussole », qui ne dit rien.
2. Une phrase définie par la négative — *elle ne vous dit pas quoi décider* —
   suivie d'une seconde abstraction.
3. **Un mur de quarante lignes de code** dans une police à chasse fixe. Personne
   n'avait demandé à programmer.
4. Et en face, en gros et en gras, le verdict : **« Trop serré pour trancher —
   À égalité »**.

Ce quatrième point est celui qui m'a fait mal. Le modèle d'accueil était « louer
ou acheter » depuis la session 1, et son verdict est « à égalité ». J'avais
traité ça comme une preuve d'honnêteté intellectuelle — c'en est une. Mais
**comme vitrine, c'est une porte fermée** : la première phrase que le site
adresse à un inconnu est qu'il n'a rien à lui dire. Sur mobile, l'écran entier
était occupé par ce non-verdict et par cinq paragraphes denses renvoyant à
`revalorisation`, un identifiant tiré d'un code qu'on n'avait pas encore vu.

Treize sessions à mesurer la qualité du site à la profondeur de son moteur.
Zéro sur la porte.

### Trois changements

**1. La vitrine ouvre sur une réponse.** Le modèle d'accueil devient « garder ou
changer de voiture » : une branche nommée, un seuil, une action gratuite. « Louer
ou acheter » n'a rien perdu — il a gagné `/louer-ou-acheter`, une adresse
indexable qu'il n'avait pas, l'accueil lui servant de domicile. L'ancienne
adresse de la voiture redirige en 301. Les critères du choix sont écrits dans
`ARCHITECTURE.md` et **tenus par un test** : le verdict d'accueil ne doit être ni
« À égalité » ni « Deux réponses ».

**2. L'accueil s'ouvre sur un exemple travaillé, avant la moindre ligne de
code.** Cinquante mots, avec les chiffres du modèle qui tourne juste en dessous :

> Vous hésitez à changer de voiture, sans savoir ce que l'ancienne coûtera en
> pannes : entre 400 et 1 800 € par an. Écrivez la fourchette, pas un chiffre
> inventé. Réponse : **au-dessus de 1 109 € par an, changez** — cela arrive
> 3 fois sur 10. Et **ressortir vos factures de garage vaut 631 €** : c'est le
> seul travail qui change quelque chose ici.

Ces chiffres sont épinglés par des tests, comme ceux de `/la-methode` : s'ils
divergent du modèle, c'est la page qu'on corrige.

**3. Le lexique — 91 entrées, et c'est le vrai travail de la session.** Le site
écrivait :

> « L'hypothèse qui pèse le plus est `reparations`. Le verdict passe à
> "Changer" au-dessus de 1 109. Lever le doute dessus vaut 631 € — c'est là
> qu'il faut passer votre temps, pas ailleurs. »

Trois défauts dans une phrase. `reparations` est un identifiant, pas un mot.
« 1 109 » n'a pas d'unité, donc ne veut rien dire. Et « passer votre temps » ne
dit pas *à quoi*. Il écrit maintenant :

> « L'hypothèse qui pèse le plus sur ce choix est `reparations`, ce que
> l'ancienne vous coûtera en pannes et en entretien. Le verdict passe à
> « Changer » au-dessus de **1 109 €/an**, ce qui arrive 3 fois sur 10. Lever le
> doute dessus vaut environ 631 €.
>
> **Où le trouver.** Vos factures de garage des trois dernières années,
> additionnées puis divisées par trois. C'est une heure de travail, et c'est la
> mieux payée de cette décision. »

`lexique.js` donne à chacune des 91 hypothèses de la bibliothèque son mot
français, son unité et son adresse. Un modèle écrit par le visiteur n'en a pas,
et **rien ne s'affiche** : le site ne devine pas ce que veut dire un nom qu'il
n'a pas écrit.

### La faute de méthode que ça met au jour

L'unité manquante n'était pas un oubli. Elle était **écrite dans
`ARCHITECTURE.md` comme un principe**, depuis des sessions, avec une
justification qui tient debout :

> « `unité: €` décrit le résultat du modèle, pas ses hypothèses […]. La seule
> unité qu'on connaisse avec certitude pour une hypothèse est le pourcentage. »

C'est vrai qu'on ne peut pas la *déduire*. Mais on peut l'*écrire* — et
personne, moi compris, n'avait reposé la question, parce qu'elle avait cessé
d'être une lacune pour devenir une contrainte documentée. **Une limitation, une
fois inscrite dans le fichier d'architecture avec un motif plausible, arrête
d'être interrogée.** C'est le même défaut que la bande de pastilles de la
session 12, qu'on a « su » impossible à améliorer pendant deux sessions avant
que dix minutes de mesure ne tranchent. La leçon se répète, donc je l'écris en
gras : *ce que ce fichier appelle une contrainte mérite d'être rouvert une fois
par an.*

### Deux choses que le travail a fait apparaître

**1. L'ouverture pouvait mentir.** Elle dit « celui qui tourne ci-dessous », avec
ses chiffres. Or l'accueil restitue le brouillon du visiteur qui revient
(session 10) : la phrase devient alors fausse. Elle se retire dans ce cas, et
« Réinitialiser » la ramène avec le modèle d'origine. Trouvé parce qu'un test
antérieur avait laissé un brouillon en `localStorage` et que mes nouvelles
vérifications ont lu la mauvaise page — la contamination entre tests a servi de
révélateur.

**2. Une hypothèse décisive peut n'avoir aucune adresse.** Mon test « l'hypothèse
désignée dit toujours où la trouver » a échoué sur `derive`, la hausse future du
prix de l'électricité — l'hypothèse la plus décisive du modèle solaire. Le test
avait raison de tirer, mais la conclusion n'était pas celle que j'attendais :
il n'y a pas d'adresse, et **c'est la réponse**. Le site l'écrit maintenant :

> **Où le trouver.** Nulle part, et c'est une réponse : ce chiffre-là ne
> s'enquête pas, il se juge. Aucun relevé, aucun devis ne vous le donnera avant
> que vous ayez à décider — ce qui veut dire qu'il ne sert à rien d'attendre
> pour en savoir plus.

C'est la distinction entre incertitude réductible et irréductible, que le site
enseignait sur `/la-methode` sans jamais l'appliquer à l'endroit où elle sert.
La liste des hypothèses sans source est close et justifiée dans un test : on ne
met pas `null` par paresse.

### Ce que je n'ai pas fait, et pourquoi

**Je n'ai pas transformé l'accueil en page de présentation.** C'était la réponse
facile à « abrupt » : expliquer d'abord, mettre l'outil derrière un bouton. Elle
coûte au site sa seule propriété distinctive — on arrive, et l'outil tourne déjà
sur un cas réel. Le mandat appelle ça une réponse déjà donnée. L'exemple
travaillé fait le même travail d'accueil sans fermer la porte.

**Je n'ai pas replié l'éditeur.** Le mur de code reste, mais il est maintenant
précédé de ce qu'il faut pour savoir ce qu'on regarde.

### État à la fin de la session

- Douze modèles, quatorze pages, dix chapitres. 91 hypothèses au lexique.
- 620 assertions sur le moteur, 278 dans un vrai navigateur, axe compris.
- Le verdict d'accueil commence à 490 px sur mobile, sous une ouverture qui
  porte déjà la réponse en prose.

### Une leçon d'exploitation, aussi

Deux échecs de la suite navigateur m'ont fait chercher une régression qui
n'existait pas : j'avais lancé un second Chrome pendant que la suite tournait,
sur quatre vCores. `CLAUDE.md` le dit depuis le premier jour — *ne lance pas
plusieurs builds lourds en parallèle*. Une suite de tests qu'on fait mentir soi-même
coûte plus cher que le temps qu'on croit gagner.

### Ce que je ferais ensuite

1. **Faire relire la nouvelle porte.** C'est la seule chose qui compte
   maintenant, et je ne peux pas la juger seul : j'ai passé treize sessions à
   devenir le mauvais lecteur de ce site. Le retour de Jean-Paul vaut mieux que
   n'importe quelle mesure que je peux inventer.
2. **La valeur d'option**, laissée par la session 13 : demander un second devis,
   garder deux offres ouvertes. `max` d'un côté, pas d'espérance conditionnelle.
3. **La neuvième récolte**, reportée quatre fois. Elle passe après la porte
   d'entrée cette fois encore, et c'est le bon ordre.
4. **Rouvrir une contrainte d'`ARCHITECTURE.md` par session.** Celle de l'unité
   des hypothèses a tenu douze sessions parce qu'elle était bien écrite.

---

## 4 septembre 2026 — Session 13 : le site chiffrait ce que vaut une information sans jamais dire s'il fallait aller la chercher

*Modèle : Claude Opus 5 (fenêtre 1 M).*

### L'écart que je n'avais pas vu en douze sessions

Depuis la session 4, le site sait dire « lever le doute sur `reparations` vaut
environ 630 € ». C'est l'idée centrale de tout le projet, elle est écrite sur
`/la-methode`, et elle **laissait le travail à moitié fait**. Un visiteur qui
lit « 630 € » doit encore faire seul la seule opération qui décide : la comparer
à ce que coûte d'aller chercher cette information — un diagnostic à 400 €, trois
devis, six semaines d'attente. Le site produisait un nombre là où il fallait
produire une décision.

C'est le point 3 de la liste laissée par la session 12 : les formes que la
bibliothèque n'a pas, dont *une décision qu'on peut repousser*. Elle a été plus
riche que prévu, parce qu'elle ne demandait pas un modèle de plus : elle
demandait une **phrase de plus dans le langage**.

### Ce que le langage sait dire maintenant

```
savoir production = 250 €
attendre le devis = 3 * loyer
```

Une hypothèse qu'une enquête, une facture ou quelques semaines lèveraient
**avant** qu'on ait à choisir, et ce que ça coûte. Les deux mots disent la même
chose ; `attendre` se lit mieux quand on dépense du temps, `savoir` quand on
dépense de l'argent. Le coût est facultatif, et peut être une formule ou une
fourchette. Ce n'est pas un mot-clé du lexer — le motif exige un nom juste
derrière — donc `savoir = 3` reste une variable et aucun modèle existant ne
casse.

Le site répond trois choses, dont **la deuxième est celle qui manquait partout
ailleurs** :

> Savoir `production` avant de choisir vaut **479 €**, pour 250 € : **allez-y**.
> Vous y gagnez 229 € en moyenne.
>
> Ce qu'il faudra en faire : en dessous de 1 158, « Ne rien faire » ;
> au-dessus, « Installer » — ce qui arrive 3 fois sur 10.

Un prix ne se met pas en œuvre ; une règle, si. « En dessous de 1 158, ne rien
faire » est une consigne qu'on emporte chez l'installateur.

### Le choix technique qui n'était pas évident

La règle aurait pu se lire sur le balayage de seuil, qui existe déjà. Je l'ai
calculée autrement, sur **les mêmes tranches de quantiles que l'EVPPI** : dans
chaque tranche de l'hypothèse, la branche de meilleure espérance. Deux raisons.

La première est mécanique : le prix et la règle deviennent deux lectures du même
calcul, donc *le gain est strictement positif si et seulement si la règle a plus
d'une tranche*. Un test le vérifie sur toute la bibliothèque. Avec deux calculs
séparés, le site pouvait afficher « ça vaut 300 € » sous « vous ferez la même
chose quoi qu'il arrive ».

La seconde est juste : le balayage fige les autres hypothèses à leur médiane, la
règle moyenne sur elles — ce qui est exactement la situation du jour où on
connaîtra celle-ci et rien d'autre. L'écart se mesure : sur le modèle solaire,
le seuil de bascule dit 1 179 et la règle dit 1 158. C'est le prix du « toutes
choses égales par ailleurs », et le texte de fond de la page le dit.

### La borne haute, qui est ce qui rend l'exercice concluant

Le chiffre affiché est le prix d'une information **parfaite**. Une étude
d'ombrage ne donne pas la production exacte des vingt prochaines années ; un
devis n'est pas la facture finale. Le site le dit, et cette limite est utile
dans un sens et un seul : **quand le prix parfait est déjà sous le coût, il n'y
a plus à discuter de la qualité de l'enquête** — aucune ne se paiera. Dans
l'autre sens, il reste à se demander de combien l'enquête réelle s'approche de
la perfection. J'ai écrit les deux moitiés de cette phrase, parce que ne dire
que la première serait vendre le calcul pour plus qu'il ne vaut.

Et le cas qui justifie tout le reste : une étude parfaitement exacte, sur
l'hypothèse la plus incertaine du modèle, peut valoir **exactement zéro**.

> Quel que soit le résultat, vous feriez la même chose : « Installer ». Cette
> information ne vaut rien ici — non parce qu'elle serait mauvaise, mais parce
> qu'elle ne déplace pas votre geste. Ne le faites pas : ce serait 250 € pour
> rien.

L'information ne vaut que ce qu'elle change, et on peut le savoir avant de la
payer. Dixième chapitre sur `/la-methode`, avec ses chiffres épinglés.

### Le douzième modèle : le solaire, et pourquoi ce sujet

Il fallait un modèle où la capacité soit trouvable — la leçon de la session 12,
*une chose que personne ne peut trouver n'existe pas*. J'ai écarté deux idées
avant celle-là :

- **Le contrôle pré-achat d'une voiture d'occasion.** Forme parfaite, mais la
  bibliothèque a déjà deux modèles de voiture sur douze. Écarté pour la variété,
  pas pour le sujet.
- **Le second devis.** « Faut-il en demander un deuxième ? » n'est pas de la
  valeur d'information : un second devis ne lève pas un doute, il ajoute une
  option dont on prend le minimum. C'est une **valeur d'option**, une forme que
  le moteur ne sait pas exprimer du tout. Noté comme piste, pas comme déchet.

**« Installer des panneaux solaires ? »** — domaine absent de la bibliothèque,
question massivement posée, et surtout une structure qui met la nouveauté en
scène sans effort. Le verdict est un lancer de pièce : « Ne rien faire »
l'emporte 58 % du temps, pour 509 € d'écart moyen sur vingt ans. Le site affiche
donc « À égalité ».

Et c'est **précisément pour ça** que l'information y vaut cher. Quand les deux
branches se valent, tout savoir avant de choisir vaut 1 320 € ; l'étude de toit
à 250 € en rapporte 479. Un verdict serré n'est pas un échec du calcul, c'est le
moment où aller chercher un chiffre est le mieux payé. Je ne l'avais lu nulle
part dit ainsi, et la page le dit maintenant.

Le modèle a aussi une propriété que je n'avais pas cherchée : l'hypothèse qui
vaut le plus d'être levée n'est pas `production` (479 €) mais `derive`, la
hausse future du prix de l'électricité (502 €) — **et personne ne peut vous la
vendre**. La distinction entre l'incertitude qu'on achète et celle qu'on subit
tombe sur le modèle sans que j'aie eu à la fabriquer.

### Deux défauts, dont un que la nouveauté a fait apparaître

**1. Le site se contredisait à trois lignes d'écart.** La session 12 avait
appris au verdict à nommer les tirages tout ou rien : « aucune enquête ne le
lèvera avant que vous ayez à choisir ». C'est vrai de l'issue d'un appel
d'offres. C'est faux d'un résultat d'analyse, de l'accord d'un financeur, de
l'issue d'un recours — des tirages tout ou rien qu'une attente lève. Dès qu'un
visiteur écrit `savoir` sur l'un d'eux, le site affichait la phrase
d'irréductibilité **au-dessus** de « allez-y, ça vaut 28 € ». Deux affirmations
vraies séparément, contradictoires ensemble. Quand le visiteur déclare qu'il
peut savoir, il en sait plus que la règle : elle lui cède.

C'est un défaut qu'aucune relecture n'aurait trouvé, parce qu'il n'existait pas
avant cette session. Il naît de la rencontre de deux phrases justes.

**2. `1k500` valait 1.** Signalé par la session 11, laissé volontairement par la
session 12, et à raison : la règle qui refuse `1m80` propose « écrivez 1,80 »,
mais proposer « écrivez 1,500 » pour `1k500` donnerait 1,5. Les multiplicateurs
d'échelle avaient donc été exclus de la règle, et la valeur fausse d'un facteur
1 500 était restée. Ils ont maintenant leur propre message, qui propose le
nombre entier : `« 1k500 » : écrivez 1500 — ou 1,5k`. Avec deux chiffres
seulement (`1k50`, `2M500`), la notation a deux lectures et le site refuse sans
deviner. `250k`, `1,5k`, `12Md`, `3e45` continuent de marcher.

### Ce que je retiens de la méthode

La session 12 avait conclu : *la variété des formes trouve ce que la variété des
valeurs ne trouve pas*. Celle-ci ajoute une marche. Le défaut n° 1 n'a été
trouvé ni par une forme ni par une valeur, mais par une **capacité nouvelle qui
a rencontré une phrase ancienne**. Chaque chose que le site apprend à dire est
une occasion de plus de se contredire, et la contradiction ne se voit qu'en
faisant se toucher les deux morceaux. Concrètement : après avoir ajouté une
section, relire les phrases que le site prononçait déjà sur la même matière.

Je note aussi ce que cette session n'a pas fait, parce que les deux précédentes
l'avaient fait : elle n'a pas trouvé de bug de calcul dans le moteur. Un défaut
d'affichage et un défaut de lecture, tous deux réels, aucun dans les
mathématiques. Ce n'est ni bon ni mauvais signe — c'est simplement ce qui s'est
passé, et je préfère l'écrire que de gonfler la liste.

### État à la fin de la session

- Douze modèles, quatorze pages. Dix chapitres sur `/la-methode`.
- 601 assertions sur le moteur, 256 dans un vrai navigateur, axe compris.
  Toutes vertes.
- Treize pastilles : trois lignes à 1 440 px, quatre à 760, une défilante sur
  mobile. Le verdict commence au pire à 403 px, très au-dessus de la ligne de
  flottaison. Le repère de regroupement reste vers seize pastilles.

### Ce que je ferais ensuite

1. **La valeur d'option, que le moteur ne sait pas exprimer.** « Demander un
   second devis », « garder les deux offres ouvertes une semaine de plus »,
   « prendre l'option d'achat » : on n'y lève pas un doute, on s'achète le droit
   de choisir plus tard le meilleur des deux. C'est `max` d'un côté, pas
   d'espérance conditionnelle, et rien dans le langage ne le dit. C'est
   probablement la prochaine forme, et elle est plus difficile que celle-ci.
2. **La neuvième récolte**, reportée trois fois maintenant : le premier fil du
   premier sous-forum venu, sur un sujet que je n'aurais pas choisi. La huitième
   a coûté quinze minutes et trouvé cinq lectures fausses. Le fait qu'elle soit
   reportée à chaque fois qu'il y a mieux à faire est en soi un renseignement :
   elle finira par ne jamais être faite si on ne la fait pas en premier.
3. **Le contre-argument avec la pièce de l'autre côté.** Il cherche le scénario
   le plus proche qui renverse le verdict, l'incident épinglé à « il n'arrive
   pas ». « Et si l'incident arrive, qu'est-ce qui suffit alors ? » est une
   question différente et probablement plus utile.
4. **Une décision qui se répète et où l'on apprend entre deux coups.** Toujours
   absente, toujours la plus difficile des trois.

Toujours pas de graphiques.

---

## 3 septembre 2026 — Session 12 : un modèle qu'aucun autre n'avait la forme d'être, et trois défauts qu'il a trouvés

*Modèle : Claude Fable 5.1.*

### Le point 1 de la liste

La session 11 avait donné au site quelque chose de neuf à dire — quand la
meilleure espérance et la meilleure fréquence ne désignent pas la même branche,
il affiche les deux et cesse de trancher — mais **aucun modèle de la
bibliothèque n'avait cette forme**. La capacité n'existait que pour qui la
réécrivait à la main. Une chose que personne ne peut trouver n'existe pas.

### Une piste écartée : le procès

Ma première idée était « accepter l'offre ou aller au procès ? ». Le désaccord
y demande que l'offre soit inférieure au produit de vos chances par ce que le
juge accorderait : avec 35 % de chances et 72 % de la demande obtenue, il faut
une offre sous 25 % de ce qu'on réclame. C'est réel — les transactions basses
existent — mais il fallait 120 000 € réclamés contre 15 000 € offerts pour que
la balance penche, et un modèle de départ dont les chiffres sont extrêmes
enseigne mal. Écarté pour cette raison, pas pour le sujet.

### La forme où le désaccord est structurel

**« Répondre à un appel d'offres ? »** Une mise certaine — les jours passés à
monter le dossier, à leur coût réel — contre un gain rare et gros. Là, aucun
réglage n'est nécessaire : c'est la forme même de l'objet.

> « Répondre » rapporte 1 239 € de plus en moyenne ; « Passer son tour »
> l'emporte 8 fois sur 10. Quand répondre gagne, c'est 18 k€ ; quand il perd,
> c'est la mise, 4 088 €, et jusqu'à 7 225 € dans le pire vingtième.

Le site dit aussi la chose que personne ne calcule : **en dessous de 18 % de
réussite, ce travail-là ne se paie pas.** Et le texte de fond montre comment
lier les chances au temps passé — `chances = base + 1,5 % * jours_reponse` —
ce qui fait tomber la valeur d'aller vérifier ce temps de 219 € à 8 €. Écourter
la réponse cesse d'être un levier dès qu'on admet que le temps achète des
chances.

### Ce que ce modèle a trouvé dans le moteur

Trois défauts, dans du code que onze sessions de tests avaient laissé passer.

**1. La médiane d'un tirage discret n'est pas un scénario.** Le balayage de
seuil fige toutes les autres hypothèses à leur médiane. Pour une pièce à 30 %,
cette médiane vaut zéro — « le sinistre n'arrive jamais ». Pour un comptage
d'années creuses de moyenne 0,36, elle vaut zéro aussi. **Trois modèles de la
bibliothèque en souffraient, et chaque fois sur leur propre sujet** : les
seuils de « ce projet sera-t-il prêt à temps ? » étaient calculés sans
l'incident hors planning ; ceux de « réparer ou remplacer ? » en supposant la
réparation acquise ; et « freelance ou salarié » n'avait *aucun* seuil sur le
taux journalier, faute d'année creuse pour en créer un.

Les tirages discrets sont maintenant rejoués, par quantile, sur une suite
stratifiée, et les branches sont moyennées : le seuil porte alors sur
l'espérance, qui est la grandeur que le verdict compare. Le seuil de survie
après réparation passe de 2,9 à 4,2 années. Et un seuil apparaît là où il n'y
en avait pas : **en dessous de 471 € par jour, mieux vaut rester salarié.**

La stratification n'est pas un détail de performance. En rejouant au hasard
ordinaire, la courbe moyennée tremble d'un point de grille à l'autre et le
détecteur de changement de gagnant y voit trois seuils au lieu d'un — je l'ai
vu sur `tjm` avant de passer au quantile. Mesuré à 32, 64, 128 et 256
répliques : stable à partir de 128, pour une vingtaine de millisecondes.

**2. Le verdict envoyait enquêter sur une pièce.** Sur ce modèle, l'hypothèse
qui pèse le plus est de très loin l'issue de la consultation elle-même —
quinze fois le reste. Le site disait donc « c'est là qu'il faut passer votre
temps », à propos de la seule chose qu'aucune enquête ne lève avant le dépôt.
Il nomme maintenant le tirage pour ce qu'il est et désigne, à côté, la
meilleure hypothèse sur laquelle on ait encore la main. C'est la distinction
entre incertitude réductible et irréductible, et elle est écrite sur
`/la-methode` : la valeur d'information sur une pièce mesure ce que vaudrait
une boule de cristal, pas ce que vaut une heure de travail.

**3. La robustesse plantait.** Elle élargit les fourchettes ; `chances =
15 % à 35 %` élargie six fois sort de [0, 1], et `bernoulli` refusait. Trouvé
par les tests, pas par la relecture. Les paramètres de loi sont ramenés dans
leurs bornes **sous élargissement seulement** — là, ce n'est plus le visiteur
qui écrit, c'est nous qui étirons, et « plus large » veut dire « certain ».
Hors de là, `bernoulli(120 %)` refuse toujours, et c'est utile.

J'ai vérifié le voisin : `contre.js` épingle les tirages tout ou rien lui
aussi, mais **il le dit** — la section affiche « avec `gros_pepin` épinglé à
0 ». Défaut déclaré, pas défaut silencieux ; laissé tel quel.

### La bande de pastilles, mesurée au lieu d'être redoutée

Deux sessions de suite ont noté qu'il « faudrait grouper ». J'ai mesuré :
douze pastilles font deux lignes à 1440 px, trois à 1100, quatre à 760, une
seule défilante sur mobile. Chaque ligne coûte 40 px, et le verdict commence
au pire à 403 px — bien au-dessus de la ligne de flottaison. Réduire la taille
des pastilles ne change rien : les retours à la ligne sont fixés par les longs
titres, pas par la taille du texte. Et **grouper ajouterait des étiquettes,
donc de la hauteur** : l'inverse du but.

Décision : on ne groupe pas. Le repère est écrit dans l'architecture — le jour
où le verdict passera sous 500 px à 1100 px de large, soit vers seize
pastilles. Une inquiétude portée deux sessions se règle en dix minutes de
mesure, et j'aurais dû mesurer plus tôt.

### Ce que je retiens de la méthode

La session 11 avait trouvé ses défauts en prenant un texte que je n'avais pas
choisi. Celle-ci les a trouvés en construisant un modèle d'une **forme** que
la bibliothèque ne contenait pas — un pari, au lieu d'une comparaison de coûts.
Onze sessions de tests n'avaient rien vu parce que tous les modèles avaient à
peu près la même forme. La variété des valeurs ne trouve pas ce que trouve la
variété des formes.

### État à la fin de la session

- Onze modèles, treize pages. Neuf chapitres sur `/la-methode`.
- 542 assertions sur le moteur, 236 dans un vrai navigateur, axe compris.
  Toutes vertes.
- Un modèle de la bibliothèque calcule entre 82 et 240 ms.

### Ce que je ferais ensuite

1. **La neuvième récolte**, reportée d'une session : le premier fil du premier
   sous-forum venu, sur un sujet que je n'aurais pas choisi. La huitième a
   coûté quinze minutes et trouvé cinq lectures fausses.
2. **Le contre-argument avec la pièce de l'autre côté.** Il cherche aujourd'hui
   le scénario le plus proche qui renverse le verdict, l'incident épinglé à
   « il n'arrive pas ». La question « et si l'incident arrive, qu'est-ce qui
   suffit alors ? » est différente et probablement plus utile. Il le dit, donc
   ce n'est pas un défaut — c'est une fonctionnalité qui manque.
3. **D'autres formes que la bibliothèque n'a pas.** Un pari y est entré cette
   session. Manquent : une décision qu'on peut repousser (la valeur d'attendre),
   une décision qui se répète et où l'on apprend entre deux coups. Ce sont deux
   classiques de la théorie de la décision et le site n'en dit rien.
4. `1k500` vaut toujours 1, écarté volontairement en session 11.

Toujours pas de graphiques.

---

## 3 septembre 2026 — Session 11 : ce qu'on perd quand on se trompe, et un fil de forum sur un ventilateur

*Modèle : Claude Fable 5.1.*

### Deux règles de décision vivaient dans le moteur sans se parler

En lisant `moteur.js` avant de choisir un chantier, j'ai trouvé ceci : la
branche retenue est celle de **meilleure espérance** (`iRecommande` est
l'argmax des moyennes), et toute la phrase du verdict raconte celle qui
**gagne le plus souvent** (`pGagne`). Sur les dix modèles de la bibliothèque
c'est la même branche, donc personne ne l'avait vu. Il suffit d'une branche
qui gagne rarement et gros pour que les deux divergent :

```
gros = bernoulli(10 %)
option "Sûr"     = 100
option "Loterie" = si gros alors 300 sinon 90
```

Le site affichait : **« À égalité — « Loterie » l'emporte 10 % du temps »**,
avec le fanion « retenue » sur une branche qui perd neuf fois sur dix, et la
jauge de « Sûr » remplie à 90 % sans aucune étiquette. Trois affirmations
fausses dans un seul écran. Il affiche maintenant « Deux réponses », nomme les
deux titres sur les branches (« meilleure moyenne », « gagne le plus
souvent »), et cesse de trancher.

J'ai gardé l'espérance comme règle, et je note pourquoi pour ne pas revenir
dessus : la fréquence de victoire ignore les montants — elle préfère perdre un
euro neuf fois plutôt que d'en gagner mille une fois — et, comparée deux à
deux sur trois branches, elle peut tourner en rond sans désigner personne. Ce
n'est pas une règle de décision. Mais l'espérance suppose qu'on puisse
rejouer, et ça, ce n'est écrit dans aucun modèle.

### Ce que vous jouez

D'où le vrai chantier. « L'emporte 6 fois sur 10 » ne dit rien de l'enjeu des
4 autres, et l'écart entre la branche retenue et sa meilleure rivale était
**déjà calculé, déjà trié**, et servait uniquement au classement des
hypothèses. Il suffisait de le lire des deux côtés.

> Sur « louer ou acheter » : quand « Acheter » l'emporte — 6 fois sur 10 —,
> c'est 36 k€ de mieux en médiane. Quand « Louer » aurait été meilleur —
> 4 fois sur 10 —, c'est 26,3 k€ de moins, et jusqu'à 78,3 k€ dans le pire
> vingtième de ces cas-là.

Le modèle phare du site est « à égalité » depuis la session 1, avec la phrase
« c'est à ce qui ne se chiffre pas de décider ». C'était vrai en fréquence et
faux en enjeu : les deux branches ne sont pas le même pari, et le calcul avait
encore quelque chose à dire. Sur « freelance ou salarié », où le verdict est
net à 8 sur 10, le pire vingtième des deux fois restantes coûte 46,9 k€ — plus
que les 33,6 k€ que la branche rapporte quand elle gagne. Ça ne change pas la
recommandation ; ça change ce qu'il faut avoir en face avant de la suivre.

**Une erreur de définition que je note parce qu'elle se reconnaît à l'œil.**
J'avais d'abord pris la queue des pertes sur l'ensemble des tirages : le
cinquième centile. Sur « isoler ses combles », qui se trompe 6 % du temps, ça
donnait « il en coûte 889 € en médiane, et plus de 126 € une fois sur vingt » —
un pire cas moins grave que le cas courant. Le cinquième centile tombait
presque sur la frontière entre gagner et perdre. La queue se lit **parmi les
seules simulations perdantes**. Règle générale : quand un « pire cas » sort
plus petit que le cas typique, ce n'est pas le modèle qui est bizarre, c'est
la queue qu'on a mesurée au mauvais endroit.

Neuvième chapitre sur `/la-methode`, avec ses chiffres épinglés.

### Huitième récolte : un fil que je n'ai pas choisi

La décision de la session 9 : la prochaine récolte partirait d'un texte que je
n'aurais pas cherché. Fait. J'ai pris le premier sous-forum venu et le premier
fil de sa liste : un **ventilateur de plafond déstratificateur**. Sujet auquel
je n'aurais jamais pensé, et c'est exactement pour ça qu'il a payé. Quatorze
phrases chiffrées, cinq lectures fausses en silence.

- `1m80`, `1m52`, `1km500` valaient **1**. La notation française des grandeurs
  composées : le nombre, l'unité, puis les sous-unités. Le lexer lisait « 1 »
  suivi d'une unité `m80` qu'il ignorait, avec un simple avertissement. Un
  garde-fou existait pour `1h30` depuis la session 6 — il ne couvrait que `h`.
  Refusé maintenant, avec l'écriture décimale (`1,80`), qui est juste pour
  toute unité métrique. Deux chiffres au moins sont exigés après l'unité,
  sinon `60m2` — des mètres carrés, qui marchait — serait pris pour une
  grandeur composée.
- `2,4m` vaut **2 400 000** : `m` est le suffixe des millions. Dans un texte
  sur une pièce, c'est 2,4 mètres. Rien dans la ligne ne permet de trancher,
  donc même traitement que `100.000` en session 7 : on lit le million, et on
  le dit, en montrant `2,4 m` avec une espace. Devant un symbole monétaire
  (`2,4m€`), aucune ambiguïté, aucun avertissement.
- `100 d’euros` répondait **« caractère inattendu « ’ »** ». L'apostrophe entre
  deux lettres fait maintenant partie du mot, et `prix_d’achat` est un nom
  valide. Entre chiffres, elle reste le séparateur suisse. C'est le pire
  message d'erreur possible et il tenait depuis la session 1 : tout le site
  est écrit avec cette apostrophe, et le lexer la refusait.
- `une vingtaine` valait **1** — « une » lu comme le nombre, « vingtaine »
  ignoré comme une unité. C'est un « environ » qui ne dit pas son nom, il est
  traité comme lui : « écrivez 16 à 24 ».

**Ce que je retiens de la méthode**, et qui vaut plus que les corrections : ces
défauts n'ont pas été trouvés parce que le fil était mal écrit — il ne l'était
pas — mais parce qu'il parlait de **longueurs et de débits**. Sept récoltes
sur des sujets que je choisissais avaient toutes tourné autour de l'argent, du
temps et de l'énergie. Aucune n'avait jamais écrit une hauteur. La valeur d'un
texte non choisi n'est pas qu'il soit plus maladroit, c'est qu'il porte sur
autre chose.

Et un piège que je me suis tendu tout seul : ma garde « pas d'avertissement
devant un symbole monétaire » s'écrivait `!'€$£¥'.includes(source[j] || '')`.
En fin de source, `source[j]` est indéfini, donc la chaîne vide — et
`'€$£¥'.includes('')` vaut **vrai**. L'avertissement ne partait jamais sur la
dernière ligne. Trouvé en vérifiant la sortie plutôt qu'en relisant le code.

### Les textes de fond, relus avec le détail des calculs

Le point 3 de la session 10. Quatre modèles disaient déjà ce que le panneau
montre ; cinq autres ont maintenant leur phrase, et une seule chose à dire à
chaque fois.

- **Isoler ses combles** : le prix futur de l'énergie ne porte que **15 %** de
  l'incertitude du gain. Ce qui décide, c'est la facture d'aujourd'hui et la
  part réellement économisée.
- **Freelance ou salarié** : `tjm` porte 61 % de l'incertitude du chiffre
  d'affaires, plus que `creuses` — et c'est pourtant `creuses` que le site
  désigne. Le meilleur exemple de l'idée centrale du site, à l'intérieur d'un
  modèle de la bibliothèque.
- **Ce projet sera-t-il prêt à temps** : les interruptions portent 27 % de
  l'incertitude de la durée calendaire, presque autant que la plus grosse
  tâche — et elles ne figurent sur aucun planning.
- **Réparer ou remplacer** : l'incertitude du coût vient de la durée de survie
  après réparation, pas du devis. On n'achète pas une réparation, on achète
  des années de service.
- **Racheter son crédit** : ici, contrairement au prix du kilomètre, le poste
  le plus lourd est aussi le plus incertain.

**Réduire son empreinte n'a rien reçu, et c'est la bonne réponse** : ce modèle
n'a aucune variable intermédiaire, le panneau de détail est vide, il n'y a
rien à en dire. Je le note pour qu'une prochaine session ne le cherche pas.

Tous ces chiffres sont épinglés par un nouveau groupe de tests, au même titre
que ceux de `/la-methode`. Une page qui cite le moteur ne doit pas pouvoir
dériver en silence.

### État à la fin de la session

- Neuf chapitres sur `/la-methode`. Douze pages, toutes générées.
- 509 assertions sur le moteur, 216 dans un vrai navigateur, axe compris.
  Toutes vertes.

### Ce que je ferais ensuite

1. **Aucun modèle de la bibliothèque ne montre le désaccord des deux règles.**
   C'est la chose la plus neuve que le site sache dire, et on ne peut y
   arriver qu'en l'écrivant soi-même. Une assurance, un procès, un pari
   industriel : la forme existe. À peser contre la bande de pastilles, qui en
   a dix et passe déjà sur deux lignes en bureau.
2. **`1k500` vaut encore 1** avec un avertissement d'unité ignorée. Écarté
   volontairement : la concaténation décimale y serait fausse (`1,500`
   vaudrait 1,5 et non 1 500), et personne n'écrit ça. Noté pour ne pas le
   redécouvrir comme une trouvaille.
3. **Une neuvième récolte, même méthode.** Le premier fil du premier
   sous-forum venu, sur un sujet que je n'aurais pas choisi. Celle-ci a coûté
   quinze minutes et a trouvé cinq lectures fausses ; les catégories jamais
   touchées restent nombreuses — la cuisine, la santé, le sport, la musique.

Toujours pas de graphiques.

---

## 3 septembre 2026 — Session 10 : le poids et l'incertitude, et un visiteur qu'on n'avait jamais imaginé

*Modèle : Claude Fable 5.1.*

### Le huitième chapitre

Le point 3 d'hier. Le détail des calculs et l'origine de l'incertitude d'une
valeur intermédiaire existaient depuis les sessions 6 et 7, mais `/la-methode`
n'en disait rien. Le chapitre s'appelle « Le poids et l'incertitude » et il
tient sur un seul exemple, le prix du kilomètre : `fixe` vaut 4 240 € par an,
la décote en fait 1 930 €, près de la moitié — et l'incertitude de `fixe` est
portée par `reparations` à 39 % et `stationnement` à 28 %, la décote n'y
étant pour presque rien. **Ce qui pèse et ce qu'on ignore ne coïncident
pas** : c'était la phrase de la session 8, elle a maintenant une adresse
indexable et douze assertions qui l'épinglent.

En l'écrivant, j'ai tranché ce que quatre sessions reportaient sous « à
peser » : **décomposer un produit**. La réponse est qu'il n'y a rien à
décomposer. Dans `ca = tjm * jours`, chaque facteur pèse exactement autant
que l'autre — doublez l'un ou l'autre, le résultat double — donc « quel
facteur pèse le plus » n'a pas de réponse, et un poids affiché serait une
invention. Ce qui distingue les facteurs d'un produit, c'est uniquement leur
incertitude, et cette ligne-là s'affiche déjà sous chaque valeur. Vérifié sur
`a = 1 à 3`, `b = 10 à 12`, `c = 100 à 110` : `c` est le plus grand facteur
et `a` porte 96 % de l'incertitude. Le chapitre le dit, un test le tient, et
l'item sort de la liste pour de bon. Je note la leçon de méthode : un point
qui reste « à peser » quatre sessions de suite est un point dont on n'a pas
encore écrit pourquoi il est vide.

Une chose vue sur la capture mobile du chapitre : « 11 % » se coupait en fin
de ligne, le signe seul au début de la suivante. Le rendu dynamique posait
l'espace fine insécable depuis la session 1 ; la prose servie par le
gabarit, jamais. C'est fait dans `riche()`, pour les pages de fond aussi,
hors des blocs de code — ce qu'on y lit doit se recopier tel quel.

### Un visiteur au clavier

Neuf sessions à imaginer des visiteurs, et jamais un qui n'utilise pas la
souris ni les yeux. J'ai passé axe-core sur trois pages. Résultat honnête
pour mes prédécesseurs : aucune étiquette manquante, aucun contraste
insuffisant, `aria-current` sur la pastille active, `role="status"` sur
l'erreur. Deux manques mécaniques — pas de `<main>`, deux blocs hors
landmark — et un problème que l'outil ne pouvait pas voir : **la zone de
résultats entière était en `aria-live`**. La page se redessine à chaque
frappe. Un lecteur d'écran aurait relu tout le verdict, toutes les
hypothèses, tous les seuils, à chaque lettre tapée. C'est l'inverse exact de
ce qu'on veut, et c'est la faute la plus courante avec cet attribut.

Maintenant : une zone hors écran reçoit le verdict et sa première phrase,
seulement s'ils ont changé — modifier un commentaire n'annonce rien,
modifier une hypothèse annonce « cout_km : 0,497 €/km. Neuf fois sur dix,
entre 0,372 €/km et 0,69 €/km… ». Les jauges, décoratives, sont masquées. Un lien
« Aller au contenu » apparaît au premier Tab, et un contour de focus
identique partout. Puis la page 404, écrite à la main en session 1, s'est
révélée périmée : sept modèles sur dix, une apostrophe droite. Elle est
générée par le gabarit désormais, comme tout le reste.

axe tourne dans le test navigateur sur quatre pages, et le test vérifie à la
main ce qu'axe ne sait pas : que l'annonce est une phrase courte, qu'elle ne
bouge pas pour un commentaire, qu'elle bouge pour une hypothèse, que Tab
puis Entrée mènent au contenu.

### Ce qu'une vérification de phrase a trouvé

J'avais écrit dans ce journal le texte que l'annonce était censée dire. En
allant le lire pour de vrai plutôt que le supposer, la page d'accueil m'a
montré le modèle du kilomètre, que je venais de visiter dans le même
navigateur. La cause : `calculer()` enregistrait dans `localStorage` à
chaque exécution, y compris au chargement d'une page de bibliothèque et au
clic sur une pastille. **Un visiteur qui écrit son modèle sur l'accueil,
puis regarde « Isoler ses combles » en passant, perdait son brouillon.**
Depuis la session 1, et la promesse de l'accueil — rendre au visiteur ce
qu'il était en train d'écrire — était fausse dans le cas le plus courant.

Le brouillon n'est enregistré que s'il diffère du modèle de bibliothèque ;
« Réinitialiser » l'efface, puisque c'est ce que le mot veut dire. Quatre
vérifications navigateur tiennent le scénario. Je note la méthode plutôt que
le bug : ce défaut n'a été vu ni par neuf sessions de tests, ni par la
relecture, mais parce que j'ai refusé d'écrire dans le journal une phrase
que je n'avais pas lue à l'écran.

### Un accident à ne pas répéter

`npm i -D axe-core` a **supprimé puppeteer**. Il était dans le lock mais pas
dans `package.json`, et npm élague ce qui n'est pas déclaré. Le test
navigateur ne tournait plus. Les deux dépendances sont maintenant déclarées,
et l'architecture le dit.

### État à la fin de la session

- Huit chapitres sur `/la-methode`. Douze pages, toutes générées.
- 434 assertions sur le moteur, 204 dans un vrai navigateur, axe compris.
  Toutes vertes.

### Ce que je ferais ensuite

1. **La bande de modèles a dix pastilles**, toujours. Sur bureau elle passe
   sur deux lignes ; ça tient encore. Le jour où on en ajoute un, il faudra
   grouper ou retirer.
2. **Une récolte sur un texte que je n'aurai pas choisi.** La décision de la
   session 9 tient : la prochaine fois que j'écris de travers, ce sera à
   partir d'un fil que je n'ai pas cherché.
3. **Relire les pages de fond avec le chapitre 8 en tête.** Quatre modèles
   disent déjà ce que le détail montre ; les six autres pourraient avoir
   une phrase de ce genre, quand elle est vraie et qu'elle apprend quelque
   chose.

Toujours pas de graphiques. Un lecteur d'écran est d'ailleurs le meilleur
argument que j'aie trouvé pour cette règle : tout ce que le site dit, il le
dit en phrases, et il n'y a rien à décrire à côté.

---

## 3 septembre 2026 — Session 9 : le dixième modèle

*Modèle : Claude Fable 5.1.*

### Racheter son crédit ?

Le point 2 d'hier, pesé et fait. Le fil de forum transcrit en session 8
posait la question que tous les simulateurs de courtier esquivent : ils
donnent le gain à un taux donné, jamais **le taux à partir duquel il n'y a
plus rien à gagner**, frais compris. C'est exactement un seuil de bascule, et
c'est ce que le site fait de mieux. L'auteur du fil l'avait d'ailleurs
calculé à la main — « ça commence à être intéressant à 1,35 % » — ce qui est
la preuve que la question est la bonne.

Le modèle compare les intérêts restants à payer, avec et sans, à durée
égale, contre ce que l'opération coûte : frais de dossier, nouvelle garantie,
indemnité de remboursement anticipé plafonnée à six mois d'intérêts. Première
version : 3,9 % contre 3 à 3,5 %, et le site répondait « Racheter, 100 %,
rien à vérifier ». Vrai, et inutile comme modèle de départ — il ne montrait
pas ce pour quoi il existe. Resserré à 3,4 % contre 2,9 à 3,3 % : « Racheter »
l'emporte 82 % du temps, le verdict passe à « Garder » au-dessus de 3,21 %,
ce qui arrive 16 % du temps, et lever le doute vaut 237 €. Le détail des
calculs ajoute que les frais tiennent d'abord à l'indemnité, qui est la seule
des trois lignes de frais qu'on peut négocier à zéro. **C'est le modèle de
bibliothèque où la réponse du site ressemble le plus à un conseil
actionnable**, et il ne contient aucun conseil : que des seuils.

Déclaré dans « ce qu'il ignore » : l'assurance emprunteur, qui est souvent
le vrai gisement, et le raccourcissement de durée à mensualité égale.

### Septième récolte, hors finance

Six questions comme on les pose : 400 heures de formation à 10 ou 15 heures
par semaine, 8 km de vélo pour aller au travail et combien de kilos en six
mois, un 80 % qui coûte combien net, une dette de sommeil, un concert
associatif qui rentre ou non dans ses frais, une année d'études tout compris.
Tout passe, y compris `8 km × 2`, `8% des recettes`, `12 mois × 1 900 € net`
et `3 à 6 € par personne`. Rien à corriger. `7h30` refuse avec « écrivez 7,5
ou 450 », ce qui est la réponse voulue.

Je m'arrête donc là sur les récoltes pour un moment : sept sessions, et la
dernière qui ne trouve rien est le signal qu'il fallait. La prochaine fois
que j'en ferai une, ce sera sur un texte que je n'aurai pas choisi.

### État à la fin de la session

- Dix modèles, douze pages.
- 422 assertions sur le moteur, 185 dans un vrai navigateur. Toutes vertes.

### Ce que je ferais ensuite

1. **La bande de modèles a dix pastilles.** Sur mobile elle défile ; sur
   bureau elle tient. Au-delà, il faudra grouper — argent, temps, énergie —
   ou choisir. Pas encore.
2. **Décomposer un produit.** À peser, toujours. Le cas du vélo (`km × jours ×
   semaines × kcal × (1 − compensation) / kcal_par_kg`) est exactement celui
   où ça manquerait, et l'origine de l'incertitude répond déjà à la moitié.
3. **Relire `/la-methode`** avec les deux dernières fonctionnalités en tête :
   le détail des calculs et l'origine de l'incertitude d'une valeur
   intermédiaire y auraient leur place, en un chapitre court.

Toujours pas de graphiques.

---

## 2 septembre 2026 — Session 8 : des questions réelles

*Modèle : Claude Fable 5.1.*

Session courte. Le point 1 de ma liste : au lieu d'imaginer un visiteur, en
trouver de vrais. Deux fils de forum avec une question chiffrée dans le
premier message — une pompe à chaleur air/eau à 20 000 € dans une maison
neuve très isolée de 150 m², et un rachat de crédit de 276 500 € à 1,69 % sur
24 ans dont il reste 23 — plus deux formulations typiques (panneaux solaires,
« je gagne 2300 net, je mets 300 de côté, un apport de 30k c'est combien de
temps »).

Je les ai transcrits avec les notations de leurs auteurs, sans les corriger :
`276 500€`, `1.69%`, `150m²`, `20 000€ posé`, `15 à 40 kWh/m²/an`,
`0,10€ à 0,14€ le kWh`, `6 kWc`, `2 à 5%/an`, `2300 net par mois`. **Tout
est passé du premier coup**, sauf deux choses. C'est la première récolte où
le résultat est surtout une confirmation : les sept sessions de tolérance
tiennent sur du texte que je n'ai pas inventé.

Les deux accrocs. `salaire = 2300 net par mois` refusait avec « la
multiplication s'écrit 2300 * mois », parce que la dernière ligne du modèle
définissait une variable `mois`. La règle « un nom défini n'est jamais une
unité » était trop stricte : quand une préposition précède — *par* mois,
*le* kWh, *per* month — c'est une unité, quel que soit le nom. Et `1 an et
demi` ne connaissait pas « demi » ; il vaut maintenant 1,5.

Un point que je note pour ne pas le redécouvrir : `150m²` passe parce que
« ² » est un caractère de catégorie *nombre* en Unicode, donc `m²` est lu
comme un seul identifiant, et non comme `m` (million) suivi d'un carré. C'est
juste par chance, et un test le fixe.

### Ce que le détail des calculs a changé aux textes de fond

Le point 3. Quatre modèles disent maintenant ce que le panneau montre et que
je ne savais pas en les écrivant. Sur le prix du kilomètre, la décote est le
poste le plus lourd de loin, mais l'incertitude des postes fixes vient des
réparations et du stationnement — **ce qui pèse et ce qu'on ignore ne
coïncident pas**, et c'est la phrase la plus utile que le site puisse dire
sur une addition. Sur la voiture, « garder » tient aux réparations pour près
des trois quarts, ce qui explique pourquoi un seul chiffre décide. Sur la
trésorerie, le loyer est le plus lourd mais on le connaît ; la fourchette
vient des imprévus et des courses, et c'est là que les relevés servent.

### Ce que je n'ai pas fait

Un test de la valeur médiane du rachat de crédit écrit de tête à 1 213 €, que
la formule contredisait à 1 210 €. J'ai vérifié la formule, pas le test :
c'est elle qui avait raison. Je le note parce que c'est exactement le
réflexe inverse de celui qu'il faut avoir avec les chiffres épinglés de
`/la-methode`, et qu'il faut savoir lequel des deux on est en train de faire.

### État à la fin de la session

- 410 assertions sur le moteur, 177 dans un vrai navigateur. Toutes vertes.

### Ce que je ferais ensuite

1. **D'autres questions réelles**, dans des domaines que la bibliothèque ne
   couvre pas : santé, temps, études, associatif. Chaque fil de forum coûte
   une minute et vaut plus qu'une heure de cas imaginés.
2. **Un modèle « rachat de crédit » dans la bibliothèque ?** La question est
   posée partout, le calcul est standard, et le site répond à ce qu'aucun
   simulateur de courtier ne dit : à partir de quel taux, et avec quels
   frais, ça bascule. À peser contre l'encombrement de la bande de modèles.
3. **Décomposer un produit**, toujours à peser.

Toujours pas de graphiques.

---

## 2 septembre 2026 — Session 7 : ce qu'un tableur montre et que le site cachait

*Modèle : Claude Fable 5.1.*

Session courte, reprise directement sur ma liste de la veille : la cinquième
récolte de saisies de travers, et donner à chaque valeur intermédiaire
l'origine de son incertitude.

### Cinquième récolte

Quarante-deux entrées, dans les trois catégories notées : un tableau collé
avec plusieurs colonnes, un modèle entièrement en anglais, des durées et des
dates. Cinq lectures fausses en silence, ce qui fait de cette récolte la plus
rentable depuis la session 3.

- `loyer;900;1150` — un tableur exporté en CSV français. Le point-virgule
  découpe une ligne en instructions, donc le site lisait trois instructions,
  ne gardait que la dernière et affichait **1150** sans un mot. Le pire cas
  possible : pas d'erreur, un chiffre, faux.
- `duree = 3 ans et 6 mois` valait **1** : « ans » ignoré, « et » lu comme le
  *et* logique de 3 et 6.
- `100 k à 200 k` allait de 100 à 200, « k » pris pour une unité.
- `10 pour cent` valait 10.
- `debut = 01/09/2026` valait 0,00005 : une double division.

Les trois premières sont des conséquences directes de mes décisions de la
session 6 (le point-virgule séparateur, les mots d'unité ignorés). Je note
ça sans regret : chaque tolérance ouvre une ambiguïté un cran plus loin, et
la seule façon de la voir est d'écrire de travers *après* avoir décidé. Une
ligne de tableau est maintenant reconnue sur le texte brut, avant toute
analyse, quel que soit son séparateur ; l'en-tête d'un tableau aussi. Deux
unités dans un même nombre refusent avec la bonne écriture. `k` et `M` seuls
après un nombre sont des suffixes. « pour cent » et « pour mille » sont des
proportions. Une date est refusée avec ce qu'il faut écrire à la place.

Le reste : les opérateurs en toutes lettres (`prix fois 12`, `1 chance sur
10`, `revenue minus costs`, `x divided by 2`), les petits nombres en toutes
lettres (`deux à trois`), le symbole devant le nombre (`$100`), l'apostrophe
suisse, et `100.000` lu cent — c'est le point décimal ici — mais **signalé**,
parce que l'autre lecture est courante. Et une correction que je n'aurais pas
trouvée sans cette récolte : `truc(3, 4)` disait « attend 1 argument », parce
que la vérification du nombre d'arguments passait avant celle du nom.

### D'où vient l'incertitude de *cette* valeur

Le point 3 de ma liste. J'avais imaginé un clic sur une valeur intermédiaire ;
c'est inutile — il suffit de l'écrire sous chaque valeur : « incertitude
portée par `revenu_regulier` 55 %, `imprevus` 17 % ». C'est le même indice
que pour le résultat, sur les rangs, calculé pour chaque variable
intermédiaire contre chaque hypothèse.

Le coût était la seule question. Sur 20 000 tirages, 100 à 175 ms par modèle,
autant que tout le reste. Sur un sous-échantillon de 4 000 tirages, une
dizaine de millisecondes, et 125 tirages par tranche suffisent largement pour
distinguer 60 % de 10 % — le seul usage qu'on en fait. Au-delà de vingt
hypothèses ou trente valeurs, on s'abstient.

Ce que ça donne sur la bibliothèque, et que je ne savais pas en la lisant :
`cout_achat` tient à `placement` avant `travaux` ; `garder` (la voiture) tient
aux `reparations` à 72 % ; `fixe` (le prix du kilomètre) tient aux
`reparations` et au `stationnement`, pas à la décote, qui pèse pourtant le
plus lourd. **Le poids et l'incertitude sont deux questions**, et le panneau
les affiche maintenant côte à côte, chacune nommée.

Un détail à noter : une source qui porte le nom de la valeur (`creuses =
min(horizon, poisson(…))` crée une source nommée `creuses`) n'est pas listée
comme son origine. Dire « `creuses` tient à `creuses` » n'apprend rien.

### État à la fin de la session

- 399 assertions sur le moteur, 177 dans un vrai navigateur. Toutes vertes.
- Le calcul complet d'un modèle de la bibliothèque : 145 à 240 ms.

### Ce que je ferais ensuite

1. **Écrire de travers, encore**, mais autrement : les cinq récoltes ont été
   faites par moi, en imaginant un visiteur. La prochaine devrait partir de
   modèles entiers écrits d'une traite sur un sujet que je ne connais pas
   d'avance — reprendre un forum de questions chiffrées et transcrire les
   questions telles qu'elles sont posées.
2. **Décomposer un produit**, toujours à peser. Avec l'origine de
   l'incertitude affichée, la moitié de l'intérêt est déjà là.
3. **Relire la bibliothèque à la lumière du détail.** Le panneau m'a appris
   des choses sur mes propres modèles ; certaines devraient remonter dans
   « ce que ce modèle compte » et « où trouver vos chiffres ».

Toujours pas de graphiques.

---

## 2 septembre 2026 — Session 6 : lire le moteur avec d'autres yeux

*Modèle : Claude Fable 5.1. Première session de ce modèle ; les cinq
précédentes sont d'Opus 5, et Jean-Paul a demandé que ce soit dit.*

Je n'ai rien écrit de ce site. J'en hérite avec le journal pour seule mémoire,
et la première chose que j'ai voulue savoir, c'est si je le comprendrais sans
son auteur. Réponse : oui, et vite — parce que le journal est écrit pour ça,
et parce que le code dit pourquoi à chaque endroit où il fait quelque chose
d'étonnant. Je continue dans la même veine.

### Écrire de travers, quatrième fois

Soixante-dix-sept entrées, sur les catégories notées à la fin de la session 5
— anglais, trois branches ou plus, résultat réutilisé — et sur ce qui me venait
en lisant le lexer pour la première fois. Cette lecture-là a payé : trois
lectures **fausses en silence**, la catégorie que les sessions précédentes
disaient la plus coûteuse.

- `taux = 15 à 30 %` se lisait « 15 à 0,3 » : la borne haute était un
  pourcentage, la borne basse un nombre. Un modèle où c'est écrit ainsi
  calculait quelque chose, sans un mot, avec une hypothèse fausse d'un facteur
  cinquante.
- `budget = 1 à 3 millions` se lisait « 1 à 3 000 000 ». Même mécanique.
- `prix = 1000 ± 10 %` se lisait « 1000 ± 0,1 ».

La règle est maintenant : **l'échelle donnée à une borne vaut pour l'autre**,
avec un garde-fou pour le multiplicateur — `500 à 2k` va bien de 500 à 2 000,
parce que 500 est plus grand que 2. Et `± 10 %` est relatif au centre.

Le reste de la récolte : `max()` sans argument affichait une exception
interne (« Reduce of empty array ») ; `option "C" = max(A, B)` était
recommandée en gagnant « 0 % du temps », parce qu'une égalité stricte comptait
pour la première branche ; `total = a + b` écrit **avant** ses termes donnait
`b` comme résultat, avec un avertissement disant que `total` ne servait à
rien — ce qui était le symptôme, pas le diagnostic. Le résultat implicite est
maintenant la dernière variable dont rien ne dépend.

Et une décision que je note parce qu'elle n'allait pas de soi : **les mots
après un nombre sont lus comme des unités et ignorés**. `duree = 3 ans`,
`temps = 40 h/semaine`, `10 à 20 par mois` — jusqu'ici, « ans » déclenchait
« cette ligne ressemble à une phrase », ce qui est faux et bloquant. Le risque
de l'autre côté est `y = 3 prx` où `prx` est une faute de frappe : le site
calculerait 3. J'ai pris le risque avec deux filets : un mot qui est un nom
défini n'est jamais une unité (`3 x` renvoie à `3 * x`), et chaque mot ignoré
est signalé en avertissement. La faute de frappe donne alors deux
avertissements côte à côte — « prx » ignoré, « prix » jamais utilisé — qui se
lisent ensemble.

En anglais : `to`, `between … and`, `threshold:`, `if … then … else`,
`floor`, `ceil`, `pow`, `**`. Le `? :` renvoie à `si … alors … sinon`. Les
paramètres des lois sont vérifiés : `bernoulli(120 %)` valait toujours 1,
`triangulaire(1, 5, 3)` sortait de ses propres bornes. `environ 100` refuse
avec la seule réponse honnête : dites de combien.

### Le détail des calculs

Ce qui m'a le plus manqué en lisant les modèles : ce que valent
`mensualite`, `cout_achat`, `depense_an`. Un tableur montre chaque cellule ;
ici, seules les hypothèses et le résultat existaient, et une variable
intermédiaire était un nom sans valeur. On ne pouvait vérifier son modèle
qu'en le croyant.

Un panneau dépliant, sous les résultats, donne maintenant chaque variable
calculée avec sa médiane et sa fourchette, et **décompose les sommes en
termes**, avec une jauge de leur poids. C'est la moitié de « décomposer un
total » qui restait sans réponse depuis la session 2, et je crois que la
réponse était simple parce qu'elle est modeste : le poids de chaque poste **à
sa valeur médiane**. Le panneau le dit en une phrase — ce qui pèse le plus,
pas ce qui est le plus incertain — parce que c'est exactement la confusion que
la session 2 avait refusé de laisser passer dans le modèle carbone.

Deux points de conception. Un terme est réévalué après coup dans le même
contexte que le calcul, donc avec les mêmes tirages en cache ; mais un terme
qui **tire lui-même au sort** (`5 + (1 à 3)`) produirait d'autres tirages, et
les sommes qui en contiennent ne sont pas décomposées. Un test vérifie que le
détail n'ajoute aucune source. Et l'état déplié survit au recalcul : la page
se redessine à chaque frappe, et un panneau qui se referme à chaque lettre
n'aurait servi à rien. Six millisecondes de plus par évaluation.

### Le verdict en texte

Quatre sessions sur la liste. « Copier le verdict » produit ce que la page
affiche, dans le même ordre, précédé du lien qui contient le modèle. Rien de
réécrit : le texte est lu dans la page, pas composé à part, donc il ne peut
pas contenir un chiffre qui ne soit pas à l'écran. C'est le seul export que je
trouve défendable ici : une décision se prend rarement seul, et ce qu'on veut
envoyer à l'autre, c'est « voilà ce qu'il faudrait vérifier », avec le moyen
de changer une hypothèse.

### Ce que je n'ai pas fait, et pourquoi

Le facteur d'optimisme commun dans le modèle de planning. Le modèle est
l'illustration du cas « exactement sur la ligne » sur `/la-methode`, la
limite est déclarée dans « ce qu'il ignore », et lier les tâches déplaçait
l'exemple. J'ai mis dans le modèle deux lignes commentées qui montrent comment
faire — c'est la technique que la page de méthode recommande, à portée de
main.

### Ce que les captures ont montré

Le « ＋ » des panneaux dépliants s'affichait en carré vide dans le Chrome de
test : glyphe pleine chasse absent de la police. Il l'était depuis la
session 4 dans le panneau d'aide, et personne ne l'aurait vu sans regarder
une capture. Remplacé par un signe ordinaire. La leçon de la session 1 tient
toujours : regarder les captures fait partie du travail.

### État à la fin de la session

- 360 assertions sur le moteur, 177 dans un vrai navigateur. Toutes vertes.
- Onze pages. Le détail des calculs et le verdict en texte sur chacune.

### Ce que je ferais ensuite

1. **Écrire de travers, encore.** Quatre récoltes, quatre fois rentable.
   Catégories pas encore essayées : un tableau collé avec plusieurs colonnes,
   un modèle entièrement en anglais (noms d'options, commentaires compris),
   quelqu'un qui écrit des dates ou des durées en mois et années mélangés.
2. **Décomposer un produit.** Les sommes sont faites ; `ca = tjm *
   jours_facturables` ne se décompose pas, et c'est la forme de la plupart des
   calculs. En logarithme, un produit est une somme — mais expliquer un poids
   logarithmique à un visiteur est une autre affaire. À peser.
3. **Cliquer une valeur intermédiaire pour voir d'où vient *son*
   incertitude.** L'analyse par hypothèse existe pour le résultat ; la refaire
   pour une variable choisie est la même machinerie. C'est l'idée de la
   session 4, et le détail des calculs lui donne maintenant un endroit où
   vivre.

Toujours pas de graphiques. Les jauges du détail sont des barres de largeur,
comme celles des hypothèses : un ordre de grandeur lisible d'un coup d'œil,
pas un tableau de bord.

---

## 2 septembre 2026 — Session 5 : poser la question à l'envers

*Modèle : Claude Opus 5.*

Trois chantiers : une fonctionnalité que je cherchais depuis trois sessions
sans la trouver, la demi-heure de fautes de frappe qui rapporte toujours, et
une relecture des modèles qui a payé.

### Le contre-argument

Ce que j'avais noté comme « décomposer un total » depuis la session 2, et que
je n'arrivais pas à formuler, était mal posé. La bonne question n'était pas
« quel poste pèse le plus » — c'est une addition, elle n'apprend rien — mais
celle-ci : **quel est le jeu d'hypothèses le plus proche du vôtre qui donnerait
la conclusion contraire ?**

Tout le reste du site va des hypothèses vers la conclusion. Cette passe va dans
l'autre sens. Elle sert à quelque chose de précis, que j'ai vérifié avant
d'écrire une ligne : **trois modèles de la bibliothèque sur neuf n'ont aucun
seuil de bascule.** Sur « isoler ses combles », « freelance ou salarié » et
« réduire son empreinte », la section « ce qu'il faut aller vérifier » dit
« aucune de vos hypothèses ne renverse ce choix » et s'arrête là. C'est vrai
hypothèse par hypothèse, et faux ensemble : cinq chiffres déplacés chacun d'un
demi-écart renversent « isoler ses combles » sans peine. Le site ne le disait
pas parce qu'il ne balayait qu'une variable à la fois.

La méthode est celle du point de conception en fiabilité des structures
(FORM, indice de Hasofer-Lind), là où l'on cherche la combinaison de charges
la plus vraisemblable qui fasse céder un pont. Chaque hypothèse est ramenée à
son unité d'écart — zéro à la médiane, ±1,645 au bord de la fourchette à 90 % —
et on cherche le point de la frontière de décision le plus proche de l'origine.
Descente amortie, filet d'un balayage à une hypothèse, retour sur la frontière
le long du rayon. Une à quatre millisecondes, parce que chaque point candidat
est un « tirage » et que le moteur est déjà vectorisé : une itération entière
tient dans un seul appel.

**J'ai vérifié tôt ce que ça n'apporte pas**, et je l'ai écrit sur la page de
méthode. La distance β est très proche de Φ⁻¹ de la probabilité déjà affichée :
un choix gagné 97 % du temps est à environ deux écarts de la frontière, et ce
n'est pas une surprise. Le contre-argument n'ajoute donc **aucun degré de
confiance**. Ce qu'il ajoute, c'est une **adresse** : des valeurs précises,
dans les unités du modèle, qu'un visiteur peut lire et reconnaître ou rejeter.
Une probabilité ne se reconnaît pas ; « il faudrait que le devis soit à
60,6 €/m² et l'économie à 17,9 % » se reconnaît.

C'est pour ça que la section ne s'affiche que là où elle apprend quelque chose :
quand aucun seuil simple ne répond déjà, ou pour dire l'un des deux cas que
rien d'autre ne sait dire. « Vos valeurs médianes donnent déjà la réponse
contraire » — le verdict ne tient alors pas au centre des fourchettes mais à
leur forme. Et « vous êtes exactement sur la ligne » : sur le modèle de
planning, chaque tâche à sa durée médiane donne 89,9 jours contre 90 promis.
Il n'y a rien à corriger pour manquer la date.

Le meilleur résultat reste celui où la recherche échoue. Quand il faudrait se
tromper de plus de cinq écarts, le site dit la seule chose utile qui reste : si
vous hésitez encore, ce n'est aucun des chiffres du modèle qui vous fait
hésiter, c'est quelque chose qui n'y est pas — ajoutez-le.

**Le test qui a payé.** J'ai écrit une assertion qui réévalue le modèle au point
rapporté et vérifie que la conclusion s'inverse vraiment. Elle a cassé sur cinq
modèles sur neuf, et pour une bonne raison : je n'affiche pas six déplacements
de trois millièmes, donc la liste montrée est plus courte que la solution
trouvée — et une solution de norme minimale tronquée ne franchit plus la
frontière. Le site aurait affiché un scénario qui ne renverse rien. La
recherche est maintenant refaite dans le seul sous-espace montré. **Sans cette
assertion, je n'aurais rien vu :** l'affichage était plausible de bout en bout.

### Écrire de travers, troisième fois

Une trentaine d'entrées, sur les catégories que je m'étais notées. Quinze
corrections. La plus grave : `prix <= budget` se calculait sans broncher et
affichait « Résultat : 0 ». Quelqu'un qui exprime une contrainte plutôt qu'un
calcul — c'est-à-dire une façon parfaitement raisonnable de poser sa question —
obtenait un zéro sans explication. Une comparaison en ligne de résultat est
maintenant lue comme un objectif, ce qui est exactement la question posée, et
le site dit comment il l'a lue.

Le reste tient en une phrase : **accepter ce qu'on écrit vraiment.** Les
symboles collés aux nombres (`900 €`, `3 %/an`), la condition comme opérande
(`travail + si pepin alors 10 sinon 0`), `1000 ± 100`, `entre 900 et 1150`,
le point-virgule des tableurs français dans `max(1;2)`, l'espace fine
insécable des milliers. Et des messages qui rendent au visiteur sa propre
ligne réécrite : `prix du kilo = …` propose `prix_du_kilo`, une ligne collée
depuis un tableau propose `loyer = 900 à 1150`, `loyer` propose `Loyer`.

Un piège que je me suis tendu à moi-même en chemin, et que je note parce qu'il
est instructif : la ligne que je proposais pour un collage de tableur contenait
une espace fine insécable, produite par `toLocaleString('fr-FR')`, que mon
propre lexer refusait comme séparateur de milliers. **Recopier le conseil du
site aurait donné une erreur.** Les deux côtés sont corrigés.

### Relire ses propres modèles

Point 4 de ma liste, et il a payé. Deux fautes, aucune signalée par un
avertissement, aucune déclarée dans « ce que ce modèle ignore ».

« Garder ou changer de voiture » **comparait un patrimoine à zéro** : la
branche « Changer » créditait la valeur résiduelle de la voiture rachetée après
six ans, la branche « Garder » ne créditait rien, comme si l'ancienne
disparaissait. « Garder » passe de 60 à 68 %, et le seuil des réparations de
1 010 à 1 110 € par an. L'omission penchait vers le remplacement — précisément
le biais que ce modèle prétend corriger.

« Freelance ou salarié » tirait l'année creuse **une seule fois pour trois
ans** : 12 % de chances que les trois soient creuses, 88 % qu'aucune ne le
soit. La moyenne était juste, l'écart trois fois trop grand. Conséquence
intéressante une fois corrigé : le nombre d'années creuses devient l'hypothèse
décisive, devant le taux journalier. C'est le risque qui décide, pas le tarif.

Les chiffres épinglés de `/la-methode` ont cassé sur ces deux changements.
C'est exactement ce pour quoi ils sont là : la page a été corrigée, pas les
tests assouplis. Le dispositif se paie tout seul.

### État à la fin de la session

- 294 assertions sur le moteur, 166 dans un vrai navigateur. Toutes vertes.
- Onze pages. Sept chapitres sur `/la-methode`.

### Ce que je ferais ensuite

1. **Écrire de travers, encore.** Trois sessions, trois récoltes. Catégories
   pas encore essayées : un modèle très long écrit d'une traite, quelqu'un qui
   veut comparer trois branches ou plus, quelqu'un qui écrit son modèle en
   anglais, quelqu'un qui essaie de réutiliser un résultat comme une hypothèse.
2. **La corrélation dans les modèles de la bibliothèque.** Le planning suppose
   ses six tâches indépendantes, ce qui rend la somme trop étroite — c'est la
   raison classique pour laquelle les plannings sont trop optimistes, et le
   modèle est censé traiter ce sujet. Un facteur d'optimisme commun serait plus
   juste et démontrerait dans la bibliothèque la technique que `/la-methode`
   recommande. À peser : ça déplacerait le joli « 89,9 jours contre 90 ».
3. **Un export du verdict.** Quatre sessions sur ma liste sans bouger. Soit je
   le fais, soit je l'enlève et je note pourquoi.
4. **Décomposer un total**, la vraie version, si elle existe. Le contre-argument
   a réglé la moitié de ce que je cherchais là ; l'autre moitié — « quel poste
   pèse le plus » — reste sans réponse, et je continue de penser que c'est une
   question moins intéressante qu'elle n'en a l'air.

Toujours pas de graphiques.

---

## 2 septembre 2026 — Session 4 : expliquer la méthode, et retourner écrire de travers

Deux chantiers, l'un prévu, l'autre repris parce qu'il avait trop bien payé la
session précédente.

### Une page pour la méthode

Les cinq idées sur lesquelles le site est construit — la fourchette à 90 %, la
part de l'incertitude, le seuil de bascule, la valeur de l'information, la
robustesse — vivaient dans un panneau dépliant qu'aucun moteur de recherche ne
lit comme du contenu. Elles ont maintenant `/la-methode` : six chapitres,
1 500 mots, un exemple calculé par le moteur à chaque idée.

Ce sont des outils classiques d'analyse de décision, restés dans les manuels.
Il n'existe presque rien en français qui les mette à portée de quelqu'un qui
n'en a pas fait, et c'est une raison suffisante d'écrire la page.

**Ce dont je suis le plus content, c'est que la page est testée.** Elle cite des
chiffres : médiane 200 pour « 100 à 400 », part de 1,00 sur les rangs contre
0,27 sur les valeurs, seuil à 1 200, EVPI de 141 €, bascule du modèle
immobilier à 2,5×. Un groupe d'assertions les revérifie sur le moteur. Si je
change le moteur dans six sessions, ce n'est pas la page qui dérivera en
silence : ce sont les tests qui casseront. De la documentation qu'on ne peut
pas laisser mentir.

En écrivant, j'ai trouvé une négligence qui traînait depuis la session 1 : le
panneau d'aide, les titres de pages, les noms d'options et les messages
d'erreur utilisaient l'apostrophe droite alors que toute la prose du site
utilise la typographique. Quatre-vingt-seize occurrences. Le test navigateur
vérifie maintenant chaque page.

### Retourner écrire de travers

J'avais noté que la demi-heure passée à taper des entrées imparfaites avait
rapporté plus que toute relecture. J'ai recommencé avec d'autres catégories.
Six trouvailles, dont une sérieuse.

**L'espace insécable cassait tout.** Une ligne `loyer = 900 à 1150` copiée
depuis une page web, ou tapée sur un clavier français, contient des U+00A0. Le
lexer répondait « caractère inattendu «   » » — le pire message possible,
puisqu'on ne voit pas ce qu'il faut corriger. Un visiteur qui colle son tableau
depuis ailleurs abandonnait là.

Le reste : le point-virgule refusé, les accolades qui donnaient « caractère
inattendu » au lieu de renvoyer aux parenthèses, un emoji affiché comme une
demi-paire de substitution, `loyer: 900 à 1150` qui ne suggérait pas
`loyer = …`, et une ligne de prose qui ne renvoyait pas au `#`.

Je note pour la prochaine fois : **ces défauts-là ne se trouvent pas en
relisant, et ils ne se trouvent pas non plus en testant ce qu'on a prévu.** Ils
se trouvent en tapant ce qu'on n'aurait pas écrit soi-même. Deux sessions de
suite que c'est la demi-heure la plus rentable.

### Les gros modèles

Un modèle de soixante hypothèses mettait 2,1 secondes bout en bout. La
simulation n'y est pour rien (163 ms) : c'est l'analyse par hypothèse, un tri
de 20 000 éléments chacune. Au-delà de vingt sources, elle se fait maintenant
sur un sous-échantillon régulier, et la robustesse sur moitié moins de tirages.
956 ms. Les petits modèles gardent le calcul complet — et les chiffres épinglés
de `/la-methode` le vérifient au passage.

### État à la fin de la session

- 225 assertions sur le moteur, 148 dans un vrai navigateur. Toutes vertes.
- Onze pages, dont une page de méthode indexable vers laquelle toutes renvoient.

### Ce que je ferais ensuite

1. **Retourner écrire de travers**, encore, sur des catégories nouvelles :
   modèles très longs, copier-coller de tableur, unités mélangées, quelqu'un
   qui essaie d'exprimer une contrainte plutôt qu'un calcul.
2. **Décomposer un total.** Toujours pas d'idée d'interface satisfaisante, mais
   la question « quel poste pèse le plus » reste sans réponse ici, et c'est
   celle qu'on se pose devant n'importe quelle addition. Piste à creuser : ne
   pas décomposer la sortie, mais permettre de cliquer une variable
   intermédiaire pour voir de quoi *elle* est faite.
3. **Un export du verdict.** Le seul point de ma liste qui n'a jamais bougé en
   trois sessions, ce qui est peut-être le signe qu'il ne compte pas tant que ça.
4. Relire les modèles avec l'œil de quelqu'un qui n'a pas écrit le moteur. Le
   bug de troncature de la session 3 était dans un modèle depuis le début, et
   il a fallu un avertissement automatique pour le voir.

Toujours pas de graphiques.

---

## 2 septembre 2026 — Session 3 : ce qui arrive quand quelqu'un écrit de travers

Repris sur la corrélation entre hypothèses, que j'avais laissée en tête de liste
depuis deux sessions comme « la dernière hypothèse fausse du moteur ».

### La corrélation n'était pas un problème de moteur

Avant de coder la syntaxe `lie(a, b, 0,6)` que j'avais prévue, j'ai mesuré ce
que le langage sait déjà faire. Réponse : tout. Un facteur commun écrit à la
main donne exactement la corrélation voulue — ρ = 0,00 quand les hypothèses sont
tirées séparément, 1,00 avec un facteur commun pur, 0,51 avec un bruit propre
en plus.

J'ai donc **écarté la syntaxe que j'avais prévue**, pour deux raisons. Elle
demande un coefficient que personne ne sait calibrer : entre 0,3 et 0,6, qui
saurait choisir ? Et elle nomme un symptôme là où le facteur commun nomme la
cause. Sur le modèle immobilier, écrire `conjoncture` fait tomber l'EVPI de
12 839 à 8 879 € et désigne cette conjoncture comme l'hypothèse décisive — ce
qui est plus juste et surtout plus actionnable que de désigner l'une des trois
variables qu'elle pilote. C'était donc une lacune de documentation, et je l'ai
traitée comme telle : l'exemple complet est sur la page d'accueil.

### Le texte de fond

Les dix pages existaient mais ne donnaient aucune raison de rester à quelqu'un
qui n'utilise pas l'outil tout de suite. Chacune répond maintenant à trois
questions, dans le HTML servi — donc lisible sans JavaScript, et indexable :
**ce que ce modèle compte**, **ce qu'il ignore**, **où trouver vos chiffres**.

La troisième est celle dont je suis le plus content, et c'est celle qu'aucun
simulateur ne donne. Elle nomme des sources vérifiables : le dernier appel de
fonds du syndic, l'ordinateur de bord sur un plein complet, la différence entre
deux contrôles techniques, la Base Empreinte de l'ADEME, les factures de
réparation des trois dernières années. Jamais un chiffre — le site n'en connaît
aucun, et c'est écrit. C'est cette section qui décide de la qualité des
fourchettes, donc de tout le reste.

La deuxième dit les limites qu'il faut connaître avant de se fier au résultat :
la fiscalité absente du modèle immobilier, la protection sociale absente du
comparatif freelance, les dépendances entre tâches absentes du planning.

### Puis j'ai regardé ce qui arrive quand on écrit de travers

C'est la partie que je n'avais pas prévue et qui a le plus rapporté. J'ai lancé
une quinzaine d'entrées plausibles mais imparfaites, comme en écrirait quelqu'un
qui découvre le langage. Six problèmes, dont **un seul** était réellement une
faute de l'utilisateur.

- `option "Acheter" = 10` toute seule affichait *« Cannot read properties of
  null »*. Une exception interne, montrée au visiteur.
- `taux = 3,2 %` avec une espace était refusé. C'est la typographie française.
- `prix = 250 000 €` donnait « caractère inattendu ». Il dit maintenant où se
  déclare une unité.
- Une division par zéro affichait des tirets partout et cassait le tracé SVG.

Et surtout : **une formule sur plusieurs lignes était tronquée en silence.** Le
parseur arrêtait l'expression à la fin de ligne. Le modèle « garder ou changer
de voiture » ignorait donc, depuis la session 1, la valeur résiduelle du
véhicule racheté et tous ses coûts d'usage. Il concluait « Changer, 90 % ». Le
calcul correct dit « Garder, 60 % », deux branches à 500 € l'une de l'autre, et
désigne les réparations comme le chiffre qui décide — bascule à 1 010 € par an.
Le modèle est bien meilleur ainsi, et sa section « où trouver vos chiffres »,
qui disait déjà « vos factures des trois dernières années », tombe juste.

**Ce bug n'a pas été trouvé en relisant.** Il a été trouvé par l'avertissement
« `decote` est défini mais n'est utilisé nulle part », que je venais d'écrire
pour les modèles des visiteurs, pas pour les miens. Je note ça parce que c'est
le meilleur argument que je puisse me donner à moi-même, dans une prochaine
session, pour écrire les garde-fous avant d'en avoir besoin.

Les avertissements sont non bloquants et visent exactement ce genre de faute :
celles qui donnent un résultat plausible et faux, qu'aucun message d'erreur ne
rattrapera puisqu'il n'y a pas d'erreur. `900-1150` lu comme une soustraction,
variable jamais utilisée, branches homonymes, branche unique.

### État à la fin de la session

- 192 assertions sur le moteur, 124 dans un vrai navigateur. Toutes vertes.
- Dix pages avec un vrai texte de fond, lisibles sans JavaScript.
- Un test vérifie qu'aucun modèle de la bibliothèque ne déclenche
  d'avertissement. C'est un filet gratuit ; il vient de payer.

### Ce que je ferais ensuite

1. **Décomposer un total**, pas seulement l'incertitude. « Quel poste pèse le
   plus » reste une question sans réponse ici, et c'est celle que se pose
   n'importe qui devant une addition. Je l'ai regardée cette session et écartée
   parce qu'aucun de mes modèles n'a une sortie qui soit une somme de premier
   niveau — la décomposition syntaxique ne mordrait presque nulle part. Il
   faudrait plutôt savoir décomposer une variable intermédiaire choisie, et je
   n'ai pas encore la bonne idée d'interface.
2. **Une page « comment ça marche »**, indexable, qui explique la méthode :
   fourchette à 90 %, part de l'incertitude, seuil de bascule, valeur de
   l'information, robustesse. Aujourd'hui tout ça vit dans un panneau dépliant
   qu'aucun moteur de recherche ne lira comme un contenu.
3. **Continuer à écrire de travers exprès.** Une demi-heure de fautes plausibles
   a rapporté plus que n'importe quelle relecture de cette session.
4. Un export du verdict, toujours pas fait.

Toujours pas de graphiques.

---

## 2 septembre 2026 — Session 2 : la question qu'aucun outil d'estimation ne pose

Site en ligne, dépôt propre, tests verts. Repris sur le point n° 2 de ma liste :
aider quelqu'un à écrire une fourchette honnête.

### Ce que j'avais prévu, et pourquoi je ne l'ai pas fait

J'avais noté « un petit exercice de calibration ». En m'y mettant, deux
objections : ça existe déjà (Quantified Intuitions, l'application d'Open
Philanthropy), et ça demande une banque de questions de culture générale que
j'aurais dû inventer — donc un objet à côté du site, pas dedans.

La bonne version était ailleurs : **retourner la question sur le modèle du
visiteur lui-même**. On élargit toutes ses fourchettes d'un facteur croissant,
médiane inchangée, et on regarde à partir de quand sa conclusion tombe. Aucune
banque de questions, aucune leçon de morale, et ça porte sur *sa* décision.

    « Louer ou acheter » bascule dès 2,5× : verdict fragile.
    « Isoler ses combles » tient jusqu'à 6× : la conclusion ne dépend pas de la
    largeur des fourchettes, mais de leurs valeurs centrales — donc c'est là
    qu'il faut regarder.

Cette seconde phrase est celle dont je suis le plus content : elle redirige
l'attention d'un visiteur vers l'endroit utile, et elle sort d'un calcul, pas
d'un conseil générique.

Détails d'implémentation qui comptent : l'étirement est multiplicatif sur un
support positif (une fourchette « 900 à 1150 » élargie deux fois devient
« 795 à 1300 », jamais négative) et additif sinon ; il préserve l'ordre des
tirages, donc les corrélations survivent ; les lois discrètes ne sont pas
touchées, parce qu'une probabilité ne s'étire pas comme une fourchette.
Le balayage coûte ~200 ms : il tourne 450 ms après l'arrêt de la frappe, pour
que le verdict, lui, reste immédiat.

### Trois modèles non financiers

Le site ne servait qu'à qui a une question d'argent. J'ai ajouté « ce projet
sera-t-il prêt à temps ? », « réduire son empreinte : quoi d'abord ? » et
« réparer ou remplacer ? ». Chacun a fait apparaître une lacune du moteur.

**Le modèle carbone a failli être malhonnête.** Je l'avais d'abord écrit comme
une décomposition d'empreinte annuelle : total, et classement des postes. Sauf
que l'outil classe par *incertitude*, pas par *masse*. Un visiteur qui connaît
le nombre de ses vols aurait vu remonter en tête les facteurs d'émission — un
chiffre sur lequel il ne peut rien. La page aurait ressemblé à un classement
des postes d'émission sans en être un. Je l'ai jeté et reformulé en comparaison
d'actions concrètes, où la machinerie de décision s'applique correctement :
supprimer un vol long-courrier pèse 1 961 kg, diviser la viande rouge par deux
730 kg. La leçon reste, et elle est juste.

**Une durée se vise par le haut.** `seuil: 90` voulait dire « au moins 90 » ;
pour un délai c'est l'inverse. `seuil: <= 90` existe maintenant.

**L'enjeu du choix manquait.** Sur le modèle carbone, le site conseillait
d'aller vérifier un chiffre valant 0,3 kg sur une décision qui en pèse 1 900.
Une valeur d'information ne veut rien dire seule : en dessous de 2 % de l'écart
entre la meilleure et la pire branche, le site dit maintenant qu'il n'y a rien
à chercher.

### Le mobile, et une leçon de méthode désagréable

Dix modèles empilés repoussaient le verdict à 648 px sur un écran de 844 : on
arrivait sur une liste de boutons. Bande défilante d'une seule ligne, verdict
remonté à 369 px.

En vérifiant, j'ai trouvé que **la page débordait de 221 px en largeur sur
mobile**, et depuis la session 1. Cause : `grid-template-columns: 1fr` en
colonne unique, dont le minimum est la largeur *min-content* du contenu — une
seule ligne non sécable élargit toute la grille. `minmax(0, 1fr)` le règle.
Le tableau du panneau d'aide, première colonne en `nowrap`, débordait de même.

Pire : plusieurs de mes règles CSS mobiles de la session 1 **n'avaient jamais
été écrites**. Mes remplacements de chaînes échouaient en silence sur des
ancres devenues fausses après une édition antérieure, et je n'avais pas vérifié.
Les captures d'écran ne l'ont pas montré parce que les valeurs par défaut
étaient acceptables. Pour la suite : **après une édition par remplacement de
chaîne, vérifier que la chaîne était bien là.** J'ai ajouté des assertions dans
mes scripts d'édition et un test de débordement horizontal, aide dépliée
comprise — précisément le cas que le test de la session 1 ne voyait pas.

### État à la fin de la session

- https://optiboussole.fr, dix modèles, dix adresses lisibles.
- 161 assertions sur le moteur, 100 dans un vrai navigateur contre la
  production. Toutes vertes.
- Mandat respecté : aucune dépense, aucun envoi, aucune donnée personnelle.

### Ce que je ferais ensuite

1. **La corrélation entre hypothèses**, toujours en tête et toujours pas faite.
   C'est la dernière hypothèse fausse du moteur : dans « louer ou acheter », le
   taux de crédit et la revalorisation ne sont pas indépendants. Maintenant que
   la machinerie d'élargissement existe, une syntaxe `lie(a, b, 0,6)` s'y
   glisserait naturellement — le tirage corrélé se fait au même endroit.
2. **Un texte de fond sous chaque modèle** : ce qu'il prend en compte, ce qu'il
   ignore, où trouver les chiffres à y mettre. Les dix pages existent mais ne
   donnent aucune raison de rester à quelqu'un qui n'utilise pas l'outil tout
   de suite.
3. **Décomposer un total**, en plus de décomposer l'incertitude. Le modèle
   carbone m'a montré le manque : « quel poste pèse le plus » est une question
   différente de « quelle hypothèse porte mon incertitude », et les deux sont
   utiles. Ce serait honnête de savoir répondre aux deux, et de dire laquelle
   on répond.
4. Un export du verdict, pour le coller dans une discussion.

Toujours pas de graphiques. La tentation était là encore cette session, sous la
forme d'un joli diagramme pour l'échelle d'élargissement. Une ligne de chiffres
suffit.

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

### Une adresse par modèle (fin de session)

Après avoir relu le mandat — « un visiteur **réel**, qui ne vous connaît pas » —
j'ai vu que le site échouait sur un point bête : tout vivait à la racine, donc
personne ne pouvait tomber dessus. J'ai généré une page par modèle
(`/prix-du-kilometre`, `/isoler-ses-combles`…), chacune avec son titre, sa
description, son `h1` et le modèle déjà présent dans le HTML servi — donc
lisible sans JavaScript. Plus un `sitemap.xml`, un `robots.txt`, et un vrai 404.

Ce dernier point mérite d'être noté : mon premier `try_files` retombait sur
`/index.html`, si bien que **toutes** les adresses répondaient 200. C'est le
piège classique du faux 404, et il aurait saboté exactement ce que la
manœuvre cherchait à obtenir.

### État à la fin de la session

- https://optiboussole.fr sert Boussole. Vérifié avec `curl -I` et dans Chrome.
- 108 assertions sur le moteur, 67 dans un vrai navigateur contre la production.
  Toutes vertes.
- Sept adresses lisibles, un plan du site, un 404 qui répond 404.
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
4. ~~Une page par modèle avec une vraie URL indexable.~~ **Fait en fin de
   session 1.** Reste à écrire, sur chaque page, un vrai texte de fond sous
   l'outil : ce que le modèle prend en compte, ce qu'il ignore, où trouver les
   chiffres à y mettre. C'est ce qui donnerait à ces pages une raison d'exister
   pour quelqu'un qui n'utilise pas l'outil tout de suite.
5. Un export du raisonnement (texte ou image) pour que quelqu'un puisse coller
   le verdict dans une discussion.

Ce que je ne ferais pas : ajouter des graphiques. La tentation sera forte. Le
site tient précisément parce qu'il répond en français et pas en tableau de bord.
