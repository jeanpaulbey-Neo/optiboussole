// gabarit.js — la page HTML, en un seul endroit.
//
// Le site sert une page par modèle (/louer-ou-acheter, /prix-du-kilometre…)
// pour qu'un moteur de recherche puisse en indexer le sujet et qu'un lien
// partagé dise ce qu'il contient. Ces pages sont générées ici et écrites sur
// le disque : le site reste entièrement statique.

const SITE = 'https://optiboussole.fr';

const echappe = (t) => String(t)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const attr = (t) => echappe(t).replace(/"/g, '&quot;');

const AIDE = `<details class="panneau aide">
  <summary>La syntaxe tient en dix lignes</summary>
  <div class="aide-corps">
    <table>
      <tr><td>prix = 250k</td><td>Une valeur que vous connaissez. <code>k</code>, <code>M</code>, <code>Md</code>, <code>12 %</code>, <code>1 234,5</code> et <code>3 millions</code> s'écrivent comme on les dit.</td></tr>
      <tr><td>loyer = 900 à 1150</td><td>Une fourchette : vous pensez qu'il y a <b>9 chances sur 10</b> que la vraie valeur soit dedans. C'est tout ce que le site vous demande de savoir.</td></tr>
      <tr><td>total = prix + loyer * 12</td><td>De l'arithmétique ordinaire. Une variable réutilisée garde la même valeur tirée : <code>a - a</code> fait toujours zéro.</td></tr>
      <tr><td>option "Acheter" = …<br>option "Louer" = …</td><td>Deux lignes <code>option</code> ou plus, et le site passe en mode décision : il compare, recommande, et cherche les seuils de bascule.</td></tr>
      <tr><td>unité: €</td><td>Le libellé du <b>résultat</b>, pas des hypothèses — dans un modèle en <code>€/km</code>, un nombre de kilomètres reste un nombre de kilomètres. Libre : <code>€/km</code>, <code>mois</code>, <code>kg CO₂e</code>. Une hypothèse écrite <code>3 % à 5 %</code> s'affiche en pourcentage parce que vous l'avez écrite ainsi.</td></tr>
      <tr><td>seuil: 12</td><td>En mode estimation : la valeur qui vous intéresse. Le site calcule la probabilité de la dépasser et les seuils de bascule.</td></tr>
      <tr><td># commentaire</td><td>Ignoré. La dernière ligne sans <code>=</code>, ou la dernière variable définie, est le résultat.</td></tr>
    </table>

    <h3>Fonctions disponibles</h3>
    <table>
      <tr><td>min max abs racine exp log arrondi plancher plafond mod signe</td><td>Les habituelles.</td></tr>
      <tr><td>si … alors … sinon …</td><td>Condition. Avec <code>et</code>, <code>ou</code>, <code>non</code> et les comparaisons.</td></tr>
      <tr><td>cumul(taux, années)</td><td><code>1 + (1+t) + … + (1+t)^(a-1)</code>. Pour capitaliser un versement annuel constant.</td></tr>
      <tr><td>serie(placement, croissance, années)</td><td>Un versement qui croît de <code>g</code> chaque année et se place à <code>r</code>. Pour comparer un loyer qui monte à un capital qui rapporte.</td></tr>
      <tr><td>unif(a, b)<br>normale(moyenne, écart-type)<br>lognormale(médiane, facteur)<br>triangulaire(min, mode, max)<br>bernoulli(p) · poisson(λ) · beta(a, b)</td><td>Si la fourchette <code>a à b</code> ne suffit pas. <code>bernoulli</code> sert aux événements : <code>panne = bernoulli(8 %)</code>.</td></tr>
      <tr><td>proba(condition)<br>esperance(x) · mediane(x) · ecart_type(x)</td><td>Résument toute la simulation en un seul nombre.</td></tr>
    </table>

    <h3>Comment une fourchette devient une loi</h3>
    <p>
      <code>100 à 400</code> avec deux bornes positives donne une <b>lognormale</b> : la médiane est
      la moyenne géométrique (200, pas 250), et le résultat ne peut pas devenir négatif.
      C'est le bon réflexe pour des prix, des durées, des quantités.
      <code>−2 % à 5 %</code>, dont les bornes changent de signe, donne une <b>normale</b>.
      <code>0 à 100</code> donne une normale repliée sur les positifs : écrire zéro comme borne basse
      veut dire qu'on exclut le négatif.
    </p>

    <h3>Ce que veulent dire les trois chiffres affichés</h3>
    <p>
      <b>La part</b> est la fraction de l'incertitude du résultat qu'une hypothèse porte à elle seule.
      Elle est calculée sur les rangs et non sur les valeurs : sur des grandeurs à queue longue, un
      indice de variance classique est confisqué par quelques tirages extrêmes.
      <b>Le seuil de bascule</b> est obtenu en figeant toutes les autres hypothèses à leur médiane et
      en balayant celle-là — c'est donc un seuil « toutes choses égales par ailleurs », pas une frontière exacte.
      <b>La valeur de l'information</b> est ce que vous gagneriez, en moyenne et dans l'unité du modèle,
      à connaître exactement cette hypothèse-là avant de choisir. Quand elle vaut zéro, l'hypothèse
      peut être très incertaine et rester sans intérêt : elle ne change pas la décision.
    </p>

    <h3>Ce que ce site ne fait pas</h3>
    <p>
      Il ne connaît aucune donnée de marché, aucun barème, aucun taux réel : tous les chiffres sont
      ceux que vous écrivez, et les modèles de départ sont des ordres de grandeur à remplacer par les vôtres.
      Il suppose vos hypothèses indépendantes, sauf là où vous les liez explicitement par une formule.
      Il ne remplace pas un conseil professionnel. Et il ne saura jamais ce qui, dans votre décision,
      ne s'écrit pas en chiffres.
    </p>
  </div>
</details>`;

// Le modèle par défaut vit à la racine : on ne lui fabrique pas de seconde
// adresse, ce serait la même page à deux endroits.
export const lien = (m, defaut) => (m.cle === defaut ? '/' : '/' + m.slug);

function chips(modeles, courant, defaut) {
  return modeles.map((m) => {
    const actif = m.cle === courant;
    return `  <li><a class="puce" href="${attr(lien(m, defaut))}" data-cle="${attr(m.cle)}"`
      + ` title="${attr(m.resume)}"${actif ? ' aria-current="page"' : ''}>${echappe(m.titre)}</a></li>`;
  }).join('\n');
}

export function page({ modele, modeles, defaut, accueil }) {
  const titre = accueil
    ? 'Boussole — ce qu\'il faut aller vérifier avant de décider'
    : `${modele.titre} — Boussole`;
  const description = accueil
    ? 'Décrivez une décision chiffrée avec ses incertitudes. Boussole ne donne pas un résultat : elle dit quelle hypothèse décide, à partir de quelle valeur votre choix bascule, et quel chiffre vaut la peine d\'être vérifié. Tout se calcule dans votre navigateur.'
    : modele.question;
  const canonique = SITE + (accueil ? '/' : '/' + modele.slug);

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${echappe(titre)}</title>
<meta name="description" content="${attr(description)}">
<link rel="canonical" href="${attr(canonique)}">
<meta name="theme-color" content="#f6f4ef" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0f1216" media="(prefers-color-scheme: dark)">
<meta property="og:title" content="${attr(accueil ? 'Boussole' : modele.titre + ' — Boussole')}">
<meta property="og:description" content="${attr(accueil ? 'Elle ne dit pas quoi décider. Elle dit ce qu\'il faut aller vérifier.' : modele.question)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${attr(canonique)}">
<link rel="icon" href="/boussole.svg" type="image/svg+xml">
<link rel="stylesheet" href="/app.css">
</head>
<body data-modele="${attr(modele.cle)}"${accueil ? ' data-accueil="1"' : ''}>
<div class="enveloppe">

<header>
  <div class="marque">
    <svg class="rose" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14.5" fill="none" stroke="currentColor" stroke-opacity=".28"/>
      <path d="M16 3 L19.2 14.4 L16 16 Z" fill="currentColor"/>
      <path d="M16 29 L12.8 17.6 L16 16 Z" fill="currentColor" fill-opacity=".35"/>
    </svg>
    ${accueil ? '<h1>Boussole</h1>' : '<a class="retour" href="/">Boussole</a>'}
  </div>
  ${accueil
    ? `<p class="baseline">Elle ne vous dit pas quoi décider. Elle vous dit <em>ce qu'il faut aller vérifier</em>.</p>
  <p class="sous-baseline">
    Décrivez une décision avec les chiffres que vous avez et les fourchettes que vous n'avez pas.
    Vous obtenez l'hypothèse qui décide vraiment, le seuil où votre choix bascule, et ce que vaut
    le fait d'aller chercher ce chiffre-là plutôt qu'un autre.
  </p>`
    : `<h1 class="baseline titre-modele">${echappe(modele.titre)}</h1>
  <p class="sous-baseline">${echappe(modele.question)}</p>`}
</header>

<nav aria-label="Modèles">
<ul class="exemples" id="exemples">
${chips(modeles, modele.cle, defaut)}
</ul>
</nav>

<div class="atelier">

  <section class="panneau editeur" aria-label="Le modèle">
    <div class="editeur-entete">
      <span>Le modèle</span>
      <span class="editeur-actions">
        <button type="button" id="partager">Copier le lien</button>
        <button type="button" id="reinit">Réinitialiser</button>
      </span>
    </div>
    <textarea id="modele" spellcheck="false" autocapitalize="off" autocorrect="off"
      aria-label="Description du modèle">${echappe(modele.source)}</textarea>
    <p class="erreur" id="erreur" hidden role="status"></p>
  </section>

  <section class="resultats" id="resultats" aria-live="polite" aria-label="Résultats"></section>

</div>

${AIDE}

<footer>
  <p>
    Construit par Claude. Aucun compte, aucun traceur, aucun cookie&nbsp;: le modèle et la simulation
    ne quittent pas votre navigateur, et le lien de partage contient le modèle lui-même.
  </p>
</footer>

</div>
<script type="module" src="/js/ui.js"></script>
</body>
</html>
`;
}
