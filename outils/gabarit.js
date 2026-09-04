// gabarit.js — la page HTML, en un seul endroit.
//
// Le site sert une page par modèle (/louer-ou-acheter, /prix-du-kilometre…)
// pour qu’un moteur de recherche puisse en indexer le sujet et qu’un lien
// partagé dise ce qu’il contient. Ces pages sont générées ici et écrites sur
// le disque : le site reste entièrement statique.

import { FOND } from './fond.js';
import { METHODE } from './methode.js';

const SITE = 'https://optiboussole.fr';

const echappe = (t) => String(t)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const attr = (t) => echappe(t).replace(/"/g, '&quot;');

// Balisage minimal du texte de fond : `code`, **gras**, et un bloc ```…```.
function riche(bloc) {
  if (bloc.startsWith('```')) {
    return `<pre class="exemple"><code>${echappe(bloc.replace(/^```\n?|\n?```$/g, ''))}</code></pre>`;
  }
  const reponse = bloc.startsWith('> ');
  const t = echappe(reponse ? bloc.slice(2) : bloc)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return reponse ? `<p class="reponse">${typographie(t)}</p>` : `<p>${typographie(t)}</p>`;
}

// La typographie française met une espace fine insécable devant « % », « : »,
// « ; », « ? », « ! » et à l’intérieur des guillemets. Sans elle, « 11 % » se
// coupe en fin de ligne sur mobile, le « % » seul en début de ligne suivante.
// Le rendu dynamique (ui.js) le fait déjà ; ici c’est la prose servie. On ne
// touche pas au contenu des <code> : ce qu’on y lit doit se recopier tel quel.
function typographie(html) {
  return html.split(/(<code>[^<]*<\/code>)/).map((part, i) => i % 2 ? part : part
    .replace(/(\d) %/g, '$1\u202f%')
    .replace(/ ([:;?!])/g, '\u202f$1')
    .replace(/« /g, '«\u202f')
    .replace(/ »/g, '\u202f»')).join('');
}

// Le texte de fond est dans le HTML servi : il se lit sans JavaScript, et
// c’est la seule chose de ces pages qu’un moteur de recherche peut indexer.
function fond(modele) {
  const f = FOND[modele.cle];
  if (!f) return '';
  const colonne = (titre, blocs) =>
    `    <section class="fond-part">
      <h2>${titre}</h2>
${blocs.map((b) => '      ' + riche(b)).join('\n')}
    </section>`;
  return `<div class="panneau fond">
${colonne('Ce que ce modèle compte', f.compte)}
${colonne('Ce qu\u2019il ignore', f.ignore)}
${colonne('Où trouver vos chiffres', f.chiffres)}
</div>`;
}

const AIDE = `<details class="panneau aide">
  <summary>La syntaxe tient en dix lignes</summary>
  <div class="aide-corps">
    <table>
      <tr><td>prix = 250k</td><td>Une valeur que vous connaissez. <code>k</code>, <code>M</code>, <code>Md</code>, <code>12 %</code>, <code>1 234,5</code> et <code>3 millions</code> s’écrivent comme on les dit.</td></tr>
      <tr><td>loyer = 900 à 1150</td><td>Une fourchette : vous pensez qu’il y a <b>9 chances sur 10</b> que la vraie valeur soit dedans. C’est tout ce que le site vous demande de savoir. S’écrit aussi <code>1000 ± 100</code>, <code>entre 900 et 1150</code>, ou <code>900 .. 1150</code>.</td></tr>
      <tr><td>total = prix + loyer * 12</td><td>De l’arithmétique ordinaire. Une variable réutilisée garde la même valeur tirée : <code>a - a</code> fait toujours zéro.</td></tr>
      <tr><td>option "Acheter" = …<br>option "Louer" = …</td><td>Deux lignes <code>option</code> ou plus, et le site passe en mode décision : il compare, recommande, et cherche les seuils de bascule.</td></tr>
      <tr><td>savoir devis = 400 €<br>attendre production</td><td>Une hypothèse qu’un diagnostic, un devis ou quelques semaines d’attente lèveraient <b>avant</b> que vous ayez à choisir, et ce que ça vous coûte. Le site répond en euros : ce que l’information rapporte, si elle se paie, et la règle à appliquer une fois qu’on saura. Sans coût écrit, elle est gratuite. <code>attendre</code> et <code>savoir</code> disent la même chose.</td></tr>
      <tr><td>unité: €</td><td>Le libellé du <b>résultat</b>, pas des hypothèses — dans un modèle en <code>€/km</code>, un nombre de kilomètres reste un nombre de kilomètres. Libre : <code>€/km</code>, <code>mois</code>, <code>kg CO₂e</code>. Une hypothèse écrite <code>3 % à 5 %</code> s’affiche en pourcentage parce que vous l’avez écrite ainsi.</td></tr>
      <tr><td>seuil: 12<br>seuil: &lt;= 90</td><td>En mode estimation : la valeur que vous visez. Sans signe, elle se lit « au moins 12 » ; avec <code>&lt;=</code>, « au plus 90 » — une durée, un budget ou une dose se visent par le haut. Le site calcule la probabilité de tenir l’objectif, et à partir de quelle hypothèse vous passez du mauvais côté.</td></tr>
      <tr><td>prix &lt;= budget</td><td>Une contrainte plutôt qu’un calcul : le site calcule <code>prix</code> et mesure la probabilité de rester sous <code>budget</code>. C’est une écriture raccourcie de <code>seuil: &lt;= budget</code>.</td></tr>
      <tr><td># commentaire</td><td>Ignoré. La dernière ligne sans <code>=</code>, ou la dernière variable définie, est le résultat.</td></tr>
    </table>
    <p class="aide-note">
      Le site accepte ce qu’on écrit vraiment : les symboles collés aux nombres
      (<code>900 €</code>, <code>30 k€</code>, <code>3 %/an</code>), les mots d’unité après un nombre
      (<code>3 ans</code>, <code>40 h/semaine</code> — lus, ignorés, et signalés), l’échelle donnée à une
      seule borne (<code>15 à 30 %</code>, <code>1 à 3 millions</code>), <code>1000 ± 10 %</code>,
      la croix de l’école (<code>loyer x 12</code>), l’espace insécable et l’espace des milliers,
      le point-virgule à la mode tableur (<code>max(1;2)</code>), les accents dans les noms,
      et les mots-clés en anglais (<code>to</code>, <code>if … then … else</code>, <code>unit:</code>,
      <code>threshold:</code>). Un nom d’hypothèse, lui, s’écrit d’un seul tenant :
      <code>prix_du_kilo</code>, pas <code>prix du kilo</code>.
    </p>

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
      C’est le bon réflexe pour des prix, des durées, des quantités.
      <code>−2 % à 5 %</code>, dont les bornes changent de signe, donne une <b>normale</b>.
      <code>0 à 100</code> donne une normale repliée sur les positifs : écrire zéro comme borne basse
      veut dire qu’on exclut le négatif.
    </p>

    <h3>Ce que veulent dire les trois chiffres affichés</h3>
    <p>
      <b>La part</b> est la fraction de l’incertitude du résultat qu’une hypothèse porte à elle seule.
      Elle est calculée sur les rangs et non sur les valeurs : sur des grandeurs à queue longue, un
      indice de variance classique est confisqué par quelques tirages extrêmes.
      <b>Le seuil de bascule</b> est obtenu en figeant toutes les autres hypothèses à leur médiane et
      en balayant celle-là — c’est donc un seuil « toutes choses égales par ailleurs », pas une frontière exacte.
      <b>La valeur de l’information</b> est ce que vous gagneriez, en moyenne et dans l’unité du modèle,
      à connaître exactement cette hypothèse-là avant de choisir. Quand elle vaut zéro, l’hypothèse
      peut être très incertaine et rester sans intérêt : elle ne change pas la décision.
    </p>

    <h3>« Et si vos fourchettes étaient trop étroites ? »</h3>
    <p>
      C’est la question que le site vous retourne en dernier, et c’est la plus importante.
      Tout le reste suppose que vos fourchettes sont honnêtes — or c’est exactement ce que
      les humains font le plus mal : quand on demande à quelqu’un un intervalle dans lequel
      il est <em>sûr à 90 %</em> que la vraie valeur se trouve, elle y tombe en réalité
      autour d’une fois sur deux. Le résultat est robuste, il s’observe chez les experts
      comme chez les novices, et sur leur propre domaine.
      Le site élargit donc toutes vos fourchettes d’un facteur croissant — médiane
      inchangée, jamais de valeur négative là où vous n’en vouliez pas — et regarde à
      partir de quand votre conclusion ne tient plus. Un verdict qui survit à des
      fourchettes trois fois plus larges ne dépend pas de la justesse de vos fourchettes ;
      un verdict qui tombe à 1,3 n’est pas un verdict. Les lois discrètes
      (<code>bernoulli</code>, <code>poisson</code>) ne sont pas élargies : une probabilité
      ne s’étire pas comme une fourchette.
    </p>

    <h3>Le contre-argument</h3>
    <p>
      Le seuil de bascule déplace <em>une</em> hypothèse. Quand aucune ne renverse le verdict
      à elle seule, le site cherche le jeu d’hypothèses le plus proche du vôtre qui donnerait
      la conclusion contraire, et vous le montre chiffré : voilà ce qu’il faudrait croire.
      La distance est mesurée dans l’unité de vos propres fourchettes — zéro à la médiane,
      1,645 au bord. Si aucun scénario plausible ne renverse le verdict, le site le dit :
      votre désaccord, s’il en reste un, n’est pas dans les chiffres du modèle mais dans
      ce qui n’y figure pas.
    </p>

    <h3>Le détail des calculs, et le verdict en texte</h3>
    <p>
      Sous les résultats, un panneau dépliant donne chaque valeur calculée — médiane, fourchette à 90 %,
      et les hypothèses qui portent son incertitude — et décompose les sommes en termes, avec le poids de
      chaque poste à sa valeur médiane. C’est ce qu’un tableur montre cellule par cellule : de quoi vérifier
      son modèle autrement qu’en le croyant. Et « Copier le verdict » produit ce que la page affiche, en
      texte, précédé d’un lien qui contient le modèle : à coller dans une discussion, pour décider à
      plusieurs.
    </p>

    <h3>Ce que ce site ne fait pas</h3>
    <p>
      Il ne connaît aucune donnée de marché, aucun barème, aucun taux réel : tous les chiffres sont
      ceux que vous écrivez, et les modèles de départ sont des ordres de grandeur à remplacer par les vôtres.
      Il suppose vos hypothèses indépendantes, sauf là où vous les liez explicitement par une formule.
      Il ne remplace pas un conseil professionnel. Et il ne saura jamais ce qui, dans votre décision,
      ne s’écrit pas en chiffres.
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

const pied = () => `<footer>
  <p>
    Construit par Claude. Aucun compte, aucun traceur, aucun cookie&nbsp;: le modèle et la simulation
    ne quittent pas votre navigateur, et le lien de partage contient le modèle lui-même.
  </p>
  <p><a href="/la-methode">La méthode, en détail</a></p>
</footer>`;

// La page 404 : la même enveloppe, la bande de modèles complète, rien d’autre.
// Générée pour ne plus dériver — écrite à la main, elle avait perdu trois
// modèles en chemin.
export function page404({ modeles, defaut }) {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page introuvable — Boussole</title>
<meta name="robots" content="noindex">
<meta name="theme-color" content="#f6f4ef" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0f1216" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/boussole.svg" type="image/svg+xml">
<link rel="stylesheet" href="/app.css">
</head>
<body>
<a class="saut" href="#contenu">Aller au contenu</a>
<div class="enveloppe">
<header>
  <div class="marque">
    <svg class="rose" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14.5" fill="none" stroke="currentColor" stroke-opacity=".28"/>
      <path d="M16 3 L19.2 14.4 L16 16 Z" fill="currentColor"/>
      <path d="M16 29 L12.8 17.6 L16 16 Z" fill="currentColor" fill-opacity=".35"/>
    </svg>
    <a class="retour" href="/">Boussole</a>
  </div>
  <h1 class="baseline titre-modele">Cette adresse ne correspond à rien.</h1>
  <p class="sous-baseline">
    Aucune trace de cette page. Les modèles disponibles sont juste en dessous ;
    <a href="/">la page d’accueil</a> vous laissera aussi écrire le vôtre.
  </p>
</header>
<main id="contenu" tabindex="-1">
<nav aria-label="Modèles">
<ul class="exemples">
${chips(modeles, null, defaut)}
</ul>
</nav>
</main>
${pied()}
</div>
</body>
</html>
`;
}

// Une page de contenu : la même enveloppe, sans l’atelier. Sert /la-methode.
export function pageMethode() {
  const m = METHODE;
  const corps = m.sections.map((sec) => `  <section class="chapitre">
    <h2>${typographie(echappe(sec.titre))}</h2>
${sec.blocs.map((b) => '    ' + riche(b)).join('\n')}
  </section>`).join('\n\n');

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${echappe(m.titre)} — Boussole</title>
<meta name="description" content="${attr(m.question)}">
<link rel="canonical" href="${SITE}/la-methode">
<meta name="theme-color" content="#f6f4ef" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0f1216" media="(prefers-color-scheme: dark)">
<meta property="og:title" content="${attr(m.titre + ' — Boussole')}">
<meta property="og:description" content="${attr(m.question)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${SITE}/la-methode">
<link rel="icon" href="/boussole.svg" type="image/svg+xml">
<link rel="stylesheet" href="/app.css">
</head>
<body>
<a class="saut" href="#contenu">Aller au contenu</a>
<div class="enveloppe">

<header>
  <div class="marque">
    <svg class="rose" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14.5" fill="none" stroke="currentColor" stroke-opacity=".28"/>
      <path d="M16 3 L19.2 14.4 L16 16 Z" fill="currentColor"/>
      <path d="M16 29 L12.8 17.6 L16 16 Z" fill="currentColor" fill-opacity=".35"/>
    </svg>
    <a class="retour" href="/">Boussole</a>
  </div>
  <h1 class="baseline titre-modele">${echappe(m.titre)}</h1>
</header>

<main id="contenu" tabindex="-1">
<article class="panneau article">
${m.intro.map((b) => '  ' + riche(b)).join('\n')}

${corps}

  <p class="retour-outil"><a href="/">← Revenir à l’outil</a></p>
</article>
</main>

${pied()}

</div>
</body>
</html>
`;
}

export function page({ modele, modeles, defaut, accueil }) {
  const titre = accueil
    ? 'Boussole — ce qu’il faut aller vérifier avant de décider'
    : `${modele.titre} — Boussole`;
  const description = accueil
    ? 'Décrivez une décision chiffrée avec ses incertitudes. Boussole ne donne pas un résultat : elle dit quelle hypothèse décide, à partir de quelle valeur votre choix bascule, et quel chiffre vaut la peine d’être vérifié. Tout se calcule dans votre navigateur.'
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
<meta property="og:description" content="${attr(accueil ? 'Elle ne dit pas quoi décider. Elle dit ce qu’il faut aller vérifier.' : modele.question)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${attr(canonique)}">
<link rel="icon" href="/boussole.svg" type="image/svg+xml">
<link rel="stylesheet" href="/app.css">
</head>
<body data-modele="${attr(modele.cle)}"${accueil ? ' data-accueil="1"' : ''}>
<a class="saut" href="#contenu">Aller au contenu</a>
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
    ? `<p class="baseline">Elle ne vous dit pas quoi décider. Elle vous dit <em>ce qu’il faut aller vérifier</em>.</p>
  <p class="sous-baseline">
    Décrivez une décision avec les chiffres que vous avez et les fourchettes que vous n’avez pas.
    Vous obtenez l’hypothèse qui décide vraiment, le seuil où votre choix bascule, et ce que vaut
    le fait d’aller chercher ce chiffre-là plutôt qu’un autre.
  </p>`
    : `<h1 class="baseline titre-modele">${echappe(modele.titre)}</h1>
  <p class="sous-baseline">${echappe(modele.question)}</p>`}
</header>

<nav aria-label="Modèles">
<ul class="exemples" id="exemples">
${chips(modeles, modele.cle, defaut)}
</ul>
</nav>

<main id="contenu" tabindex="-1">
<div class="atelier">

  <section class="panneau editeur" aria-label="Le modèle">
    <div class="editeur-entete">
      <span>Le modèle</span>
      <span class="editeur-actions">
        <button type="button" id="partager">Copier le lien</button>
        <button type="button" id="copier-verdict" title="Le verdict en texte, à coller dans une discussion">Copier le verdict</button>
        <button type="button" id="reinit">Réinitialiser</button>
      </span>
    </div>
    <textarea id="modele" spellcheck="false" autocapitalize="off" autocorrect="off"
      aria-label="Description du modèle">${echappe(modele.source)}</textarea>
    <p class="erreur" id="erreur" hidden role="status"></p>
    <ul class="avertissements" id="avertissements" hidden></ul>
  </section>

  <!-- Une seule phrase est annoncée aux lecteurs d’écran à chaque recalcul :
       le verdict. La zone entière en aria-live aurait relu toute la page à
       chaque frappe. -->
  <p class="annonce" id="annonce" aria-live="polite"></p>
  <section class="resultats" id="resultats" role="region" aria-label="Résultats"></section>

</div>

${fond(modele)}

${AIDE}
</main>

${pied()}

</div>
<script type="module" src="/js/ui.js"></script>
</body>
</html>
`;
}
