// Tests du moteur. `node test/run.js`
import { lexer, analyser, ErreurModele } from '../public/js/lang.js';
import { evaluerModele, quantile, trier, moyenne, variance } from '../public/js/evaluer.js';
import { analyserModele, analyserRobustesse } from '../public/js/moteur.js';
import { analyserContreArgument } from '../public/js/contre.js';
import { MODELES } from '../public/js/modeles.js';

let ok = 0, ko = 0;
const nom = (s) => `\x1b[2m${s}\x1b[0m`;

function verifie(titre, condition, detail = '') {
  if (condition) { ok++; console.log(`  \x1b[32m✓\x1b[0m ${nom(titre)}`); }
  else { ko++; console.log(`  \x1b[31m✗ ${titre}\x1b[0m ${detail}`); }
}
function proche(titre, a, b, tol) {
  verifie(titre, Math.abs(a - b) <= tol, `→ ${a} attendu ≈ ${b} (±${tol})`);
}
function groupe(t) { console.log(`\n\x1b[1m${t}\x1b[0m`); }

// --- Lexer ------------------------------------------------------------------
groupe('Lecture des nombres');
const num = (src) => lexer(src).find((t) => t.type === 'nombre').valeur;
proche('250k', num('250k'), 250000, 0);
proche('3.2M', num('3.2M'), 3200000, 0);
proche('12Md', num('12Md'), 12e9, 0);
proche('7%', num('7%'), 0.07, 1e-12);
proche('1 234,5 (espace + virgule)', num('1 234,5'), 1234.5, 1e-9);
proche('1_000_000', num('1_000_000'), 1e6, 0);
proche('3 millions', evaluerModele(analyser('x = 3 millions')).variables.get('x'), 3e6, 0);
verifie('« km » n\'est pas 1000×k', lexer('km').filter((t) => t.type === 'ident').length === 1);
verifie('« Mars » reste un identifiant', lexer('Mars = 1').some((t) => t.type === 'ident' && t.valeur === 'Mars'));

// --- Intervalles ------------------------------------------------------------
groupe('Intervalles à 90 %');
{
  const r = evaluerModele(analyser('x = 100 à 400'), { N: 60000 });
  const t = trier(r.variables.get('x'));
  proche('borne basse ≈ p05', quantile(t, 0.05), 100, 4);
  proche('borne haute ≈ p95', quantile(t, 0.95), 400, 16);
  proche('médiane = moyenne géométrique', quantile(t, 0.5), 200, 4);
  verifie('lognormale : jamais négatif', t[0] > 0);
}
{
  const r = evaluerModele(analyser('x = -50 à 50'), { N: 60000 });
  const t = trier(r.variables.get('x'));
  proche('bornes signées → normale (p05)', quantile(t, 0.05), -50, 2);
  proche('bornes signées → normale (p95)', quantile(t, 0.95), 50, 2);
  verifie('normale : des valeurs négatives', t[0] < 0);
}
{
  const r = evaluerModele(analyser('x = 3% à 5%'), { N: 40000 });
  proche('pourcentages', quantile(trier(r.variables.get('x')), 0.5), Math.sqrt(0.0015), 2e-4);
}

// --- Corrélations -----------------------------------------------------------
groupe('Corrélations préservées');
{
  const r = evaluerModele(analyser('a = 1 à 10\nb = a - a'), { N: 5000 });
  const b = r.variables.get('b');
  verifie('a − a vaut exactement 0 partout', b.every((v) => v === 0));
}
{
  const r = evaluerModele(analyser('a = 1 à 10\nb = a / a'), { N: 5000 });
  verifie('a / a vaut exactement 1 partout', r.variables.get('b').every((v) => Math.abs(v - 1) < 1e-12));
}
{
  // Deux intervalles identiques mais écrits séparément doivent être indépendants.
  const r = evaluerModele(analyser('a = 1 à 10\nb = 1 à 10\nc = a - b'), { N: 20000 });
  verifie('deux tirages distincts sont indépendants', Math.abs(moyenne(r.variables.get('c'))) < 0.4
    && r.variables.get('c').some((v) => Math.abs(v) > 1));
}

// --- Déterminisme -----------------------------------------------------------
groupe('Déterminisme');
{
  const m = 'x = 10 à 100\ny = x * 2';
  const a = evaluerModele(analyser(m), { N: 3000 }).variables.get('y');
  const b = evaluerModele(analyser(m), { N: 3000 }).variables.get('y');
  verifie('même modèle → mêmes échantillons', a.every((v, i) => v === b[i]));
}

// --- Fonctions --------------------------------------------------------------
groupe('Fonctions et opérateurs');
const val = (src) => {
  const r = evaluerModele(analyser(src), { N: 5000 });
  const s = r.sortie;
  return s instanceof Float64Array ? s[0] : s;
};
proche('priorité des opérateurs', val('2 + 3 * 4'), 14, 0);
proche('puissance à droite', val('2 ^ 3 ^ 2'), 512, 0);
proche('unaire moins < puissance', val('-2 ^ 2'), -4, 0);
proche('min/max', val('max(3, min(9, 7))'), 7, 0);
proche('si/alors/sinon', val('si 3 > 2 alors 10 sinon 20'), 10, 0);
proche('et/ou', val('si (1 > 2) ou (2 > 1) alors 1 sinon 0'), 1, 0);
proche('cumul (annuité)', val('cumul(10%, 3)'), 3.31, 1e-9);
proche('cumul à taux nul', val('cumul(0, 5)'), 5, 1e-9);
// Médiane de « 1 à 100 » = moyenne géométrique = 10.
proche('proba()', val('proba(1 à 100 > 10)'), 0.5, 0.03);
{
  const r = evaluerModele(analyser('p = bernoulli(0.3)'), { N: 50000 });
  proche('bernoulli(0.3)', moyenne(r.variables.get('p')), 0.3, 0.01);
}
{
  const r = evaluerModele(analyser('x = triangulaire(0, 1, 3)'), { N: 50000 });
  proche('triangulaire : moyenne (0+1+3)/3', moyenne(r.variables.get('x')), 4 / 3, 0.02);
}
{
  const r = evaluerModele(analyser('x = lognormale(100, 3)'), { N: 60000 });
  const t = trier(r.variables.get('x'));
  proche('lognormale(médiane, facteur) p05', quantile(t, 0.05), 100 / 3, 1.5);
  proche('lognormale(médiane, facteur) p95', quantile(t, 0.95), 300, 12);
}

// --- Erreurs ----------------------------------------------------------------
groupe('Messages d\'erreur');
function erreur(titre, src, motif) {
  try { analyserModele(src); verifie(titre, false, '→ aucune erreur levée'); }
  catch (e) {
    verifie(titre, e instanceof ErreurModele && new RegExp(motif, 'i').test(e.message), `→ « ${e.message} »`);
  }
}
erreur('variable inconnue', 'y = x + 1', 'défini nulle part');
erreur('cycle', 'a = b + 1\nb = a + 1', 'lui-même');
erreur('double définition', 'a = 1\na = 2', 'deux fois');
erreur('parenthèse', 'a = (1 + 2', 'parenthèse');
erreur('fonction inconnue', 'a = truc(3)', 'inconnue');
erreur('si sans sinon', 'a = si 1 > 0 alors 5', 'sinon');
{
  try { analyserModele('a = 1\nb = @'); }
  catch (e) { verifie('la ligne est signalée', e.ligne === 2, `→ ligne ${e.ligne}`); }
}

// --- Sensibilité ------------------------------------------------------------
groupe('Analyse de sensibilité');
{
  // y = gros + petit : la part de variance doit refléter les écarts-types.
  const r = analyserModele('gros = 0 à 100\npetit = 49 à 51\ny = gros + petit', { N: 40000 });
  const p = Object.fromEntries(r.sources.map((s) => [s.nom, s.part]));
  verifie('la source dominante est identifiée', r.sources[0].nom === 'gros');
  proche('part de « gros » ≈ 1', p.gros, 1, 0.05);
  proche('part de « petit » ≈ 0', p.petit, 0, 0.05);
  verifie('les parts somment à ~1 (modèle additif)', Math.abs(p.gros + p.petit - 1) < 0.06);
}
{
  // Une variable sans effet doit ressortir à zéro.
  const r = analyserModele('a = 1 à 10\ninutile = 1 à 1000\ny = a * 2', { N: 40000 });
  const p = Object.fromEntries(r.sources.map((s) => [s.nom, s.part]));
  proche('variable sans influence → 0', p.inutile, 0, 0.02);
  proche('variable unique → 1', p.a, 1, 0.02);
}
{
  // Interaction pure : y = a*b, les effets principaux ne somment pas à 1.
  const r = analyserModele('a = 1 à 10\nb = 1 à 10\ny = a * b', { N: 40000 });
  const somme = r.sources.reduce((s, x) => s + x.part, 0);
  verifie('interaction détectée (somme < 1)', somme > 0.5 && somme < 0.98, `→ ${somme.toFixed(3)}`);
}
{
  const r = analyserModele('a = 100 à 1000\nb = 90 à 110\ny = a + b', { N: 40000 });
  const a = r.sources.find((s) => s.nom === 'a');
  verifie('connaître « a » réduit fortement l\'intervalle', a.gainLargeur > 0.85, `→ ${a.gainLargeur.toFixed(3)}`);
  const b = r.sources.find((s) => s.nom === 'b');
  verifie('connaître « b » ne change presque rien', b.gainLargeur < 0.15, `→ ${b.gainLargeur.toFixed(3)}`);
}

// --- Seuil sur une sortie ---------------------------------------------------
groupe('Seuils de bascule (mode estimation)');
{
  const r = analyserModele('x = 0 à 100\ny = x - 30', { N: 20000, seuil: 0 });
  const s = r.sources[0];
  verifie('un seuil est trouvé', s.bascules.length === 1, `→ ${s.bascules.length}`);
  if (s.bascules.length) proche('seuil correct (x = 30)', s.bascules[0].valeur, 30, 1.5);
}

// --- Mode décision ----------------------------------------------------------
groupe('Mode décision');
{
  const modele = `
loyer = 900
achat_mensuel = 700 à 1300
horizon = 10
option "Louer"   = -loyer * 12 * horizon
option "Acheter" = -achat_mensuel * 12 * horizon
`;
  const r = analyserModele(modele, { N: 40000 });
  verifie('mode décision activé', r.modeDecision === true);
  verifie('deux options', r.options.liste.length === 2);
  const louer = r.options.liste.find((o) => o.nom === 'Louer');
  const acheter = r.options.liste.find((o) => o.nom === 'Acheter');
  // La médiane de « 700 à 1300 » est la moyenne géométrique, 954 € — pas 1000 €.
  proche('P(Acheter gagne) = P(mensualité < 900)', acheter.pGagne, 0.3785, 0.02);
  verifie('les probabilités somment à 1', Math.abs(louer.pGagne + acheter.pGagne - 1) < 1e-9);
  const s = r.sources.find((x) => x.nom === 'achat_mensuel');
  verifie('un seuil de bascule est trouvé', s.bascules.length === 1, `→ ${s.bascules.length}`);
  if (s.bascules.length) proche('bascule à 900 €/mois', s.bascules[0].valeur, 900, 15);
  verifie('la valeur de l\'information est positive', s.valeurInfo > 0, `→ ${s.valeurInfo}`);
  verifie('EVPI ≥ EVPPI d\'une seule variable', r.options.evpi >= s.valeurInfo - 1e-6);
}
{
  // Décision sans hésitation : l'information ne vaut rien.
  const r = analyserModele(`
x = 1 à 2
option "A" = 1000 + x
option "B" = 0
`, { N: 20000 });
  proche('EVPI = 0 quand la décision est acquise', r.options.evpi, 0, 1e-6);
  proche('valeur d\'info d\'une variable = 0', r.sources[0].valeurInfo, 0, 1e-6);
  proche('P(regret) = 0', r.options.pRegret, 0, 1e-9);
  verifie('aucun seuil de bascule', r.sources[0].bascules.length === 0);
}
{
  // Trois options : la recommandation suit l'espérance, pas la fréquence.
  const r = analyserModele(`
option "A" = 10
option "B" = 0 à 40
option "C" = 5
`, { N: 40000 });
  verifie('trois options comparées', r.options.liste.length === 3);
  verifie('C n\'est jamais recommandée', r.options.liste[r.options.recommande].nom !== 'C');
  const somme = r.options.liste.reduce((s, o) => s + o.pGagne, 0);
  proche('les fréquences de victoire somment à 1', somme, 1, 1e-9);
}

// --- Robustesse -------------------------------------------------------------
groupe('Robustesse');
{
  const r = analyserModele('a = 5\nb = a * 2', { N: 1000 });
  verifie('modèle sans aucune incertitude', r.sources.length === 0 && r.sortie.p50 === 10);
}
{
  const r = analyserModele('# rien que des commentaires\n\n', { N: 100 });
  verifie('modèle vide → pas de plantage', r.vide === true);
}
{
  const t0 = Date.now();
  analyserModele(`
a = 1 à 10
b = 2 à 20
c = 3 à 30
d = 4 à 40
e = 5 à 50
option "X" = a * b + c
option "Y" = d * e - c
`, { N: 20000 });
  const ms = Date.now() - t0;
  verifie(`5 hypothèses × 20 000 tirages en ${ms} ms`, ms < 3000, `→ ${ms} ms`);
}

// --- Directives -------------------------------------------------------------
groupe('Directives unité / seuil');
{
  const r = analyserModele('unité: €\nx = 100 à 200', { N: 5000 });
  verifie('unité lue', r.unite === '€', `→ « ${r.unite} »`);
}
{
  const r = analyserModele('seuil: 30\nx = 0 à 100\ny = x', { N: 20000 });
  verifie('seuil lu depuis le modèle', r.seuil === 30, `→ ${r.seuil}`);
  verifie('le seuil déclenche le calcul de bascule', r.sources[0].bascules.length === 1);
}
{
  const r = analyserModele('seuil: prix\nprix = 250k\nx = 100k à 400k\ny = x', { N: 20000 });
  verifie('seuil peut référencer une variable', r.seuil === 250000, `→ ${r.seuil}`);
}
erreur('réglage inconnu', 'bidule: 3\nx = 1', 'inconnu');
{
  const a = analyserModele('seuil: 12\nx = 5 à 40\ny = x', { N: 40000 });
  verifie('« seuil: 12 » se lit « au moins »', a.seuilSens === 'min');
  proche('… et compte les tirages au-dessus', a.pAtteint,
    a.sortie.tri.filter((v) => v >= 12).length / a.N, 1e-9);
  const b = analyserModele('seuil: <= 60\nx = 20 à 90\ny = x', { N: 40000 });
  verifie('« seuil: <= 60 » se lit « au plus »', b.seuilSens === 'max');
  proche('… et compte les tirages en dessous', b.pAtteint,
    b.sortie.tri.filter((v) => v <= 60).length / b.N, 1e-9);
  const c = analyserModele('seuil: >= 100\nx = 50 à 200\ny = x', { N: 20000 });
  verifie('« seuil: >= 100 » reste « au moins »', c.seuilSens === 'min');
  verifie('les deux sens donnent des probabilités complémentaires',
    Math.abs(analyserModele('seuil: 60\nx = 20 à 90\ny = x', { N: 40000 }).pAtteint
             + b.pAtteint - 1) < 0.02);
}
{
  const r = analyserModele('unité: %\noption A: 1\noption B: 2', { N: 1000 });
  verifie('« option X: » accepté comme « option X = »', r.modeDecision && r.options.liste.length === 2);
}

// --- Sources binaires -------------------------------------------------------
groupe('Tirages binaires');
{
  const r = analyserModele(`
risque = bernoulli(20%)
option "Risquer" = si risque alors -5000 sinon 3000
option "Éviter"  = 0
`, { N: 40000 });
  const s = r.sources.find((x) => x.nom === 'risque');
  verifie('un bernoulli est reconnu comme binaire', s.binaire === true);
  verifie('pas de seuil balayé sur un binaire', s.bascules.length === 0);
  verifie('sa valeur d\'information reste calculée', s.valeurInfo > 0, `→ ${s.valeurInfo}`);
}
{
  const r = analyserModele('x = 1 à 10\ny = x', { N: 20000 });
  verifie('un intervalle n\'est pas binaire', r.sources[0].binaire === false);
}

// --- Bibliothèque de modèles ------------------------------------------------
groupe('Bibliothèque');
{
  const { MODELES } = await import('../public/js/modeles.js');
  for (const m of MODELES) {
    let r = null, err = null;
    try { r = analyserModele(m.source); } catch (e) { err = e; }
    verifie(`« ${m.titre} » s'analyse sans erreur`, err === null,
      err ? `→ ligne ${err.ligne} : ${err.message}` : '');
    if (!r) continue;
    const st = r.modeDecision ? r.options.liste[0].stats : r.sortie;
    verifie(`« ${m.titre} » produit des nombres finis`,
      Number.isFinite(st.p05) && Number.isFinite(st.p50) && Number.isFinite(st.p95));
    verifie(`« ${m.titre} » a au moins une hypothèse incertaine`, r.sources.length > 0);
    const large = st.p95 !== 0 && Math.abs(st.p95 / (st.p50 || 1)) > 500;
    verifie(`« ${m.titre} » n'explose pas (p95 raisonnable)`, !large,
      `→ p50 ${st.p50.toPrecision(3)} p95 ${st.p95.toPrecision(3)}`);
  }
}

// --- Ce que les gens tapent vraiment -----------------------------------------
groupe('Saisies approximatives');
{
  const NB = '\u00a0', FIN = '\u202f';
  proche(`l'espace insécable est une espace`,
    analyserModele(`x${NB}=${NB}900${NB}à${NB}1150`, { N: 5000 }).sortie.p50, 1018, 20);
  proche('l’espace fine insécable aussi',
    analyserModele(`x${FIN}=${FIN}1${FIN}à${FIN}3`, { N: 5000 }).sortie.p50, 1.73, 0.1);
  proche('« 1 000 » avec insécable reste un nombre',
    analyserModele(`x = 1${NB}000`, { N: 200 }).sortie.p50, 1000, 0);
  proche('le point-virgule sépare deux instructions',
    val('a = 1; b = a + 1'), 2, 0);
  proche('… et en fin de ligne il est ignoré',
    val('a = 1;\nb = a + 1;'), 2, 0);
  proche('« 3,2 % » avec une espace', val('x = 3,2 %'), 0.032, 1e-12);

  erreur('les accolades renvoient aux parenthèses', 'x = {1 à 3}', 'parenthèses');
  erreur('les crochets aussi', 'x = [1, 3]', 'parenthèses');
  // Un symbole collé à un nombre est décoratif : c'est ainsi qu'on écrit un
  // prix en français, et le refuser cassait le modèle sur une virgule de style.
  proche('« 100 € » se lit comme 100', val('x = 100 €'), 100, 0);
  proche('« 250 000 € » aussi', val('x = 250 000 €'), 250000, 0);
  proche('« 900 à 1150 €/mois » : l\'unité composée est décorative',
    analyserModele('x = 900 à 1150 €/mois', { N: 20000 }).sortie.p50, 1017, 12);
  proche('« 3 %/an » également', val('x = 3 %/an'), 0.03, 1e-12);
  proche('… mais « 100 / 4 » reste une division', val('x = 100 / 4'), 25, 0);
  erreur('un symbole monétaire seul renvoie à « unité: »', 'x = € * 2', 'unité');
  erreur('une phrase est reconnue comme telle', 'je veux savoir si je dois acheter', 'ressemble à une phrase');
  erreur('« nom: valeur » renvoie à « nom = valeur »', 'loyer: 900 à 1150', 'loyer = ');
  {
    // Un caractère hors du plan de base ne doit pas s'afficher en moitié.
    try { analyserModele('prix 🏠 = 100'); verifie('un emoji est affiché entier', false); }
    catch (e) { verifie('un emoji est affiché entier', e.message.includes('🏠'), `→ ${e.message}`); }
  }
}

groupe('Modèles volumineux');
{
  const gros = (k) => Array.from({ length: k }, (_, i) => `v${i} = 1 à 3`).join('\n')
    + '\ntotal = ' + Array.from({ length: k }, (_, i) => `v${i}`).join(' + ');
  const t0 = Date.now();
  const r = analyserModele(gros(60));
  const ms = Date.now() - t0;
  verifie(`60 hypothèses analysées en ${ms} ms`, ms < 1500, `→ ${ms} ms`);
  verifie('… avec les 60 hypothèses classées', r.sources.length === 60, `→ ${r.sources.length}`);
  // La médiane d'une somme de 60 lognormales tend vers sa moyenne, pas vers la
  // somme des médianes : 60 × 1,83 (moyenne) et non 60 × 1,73 (médiane).
  proche('… et un résultat juste (60 × moyenne 1,83)', r.sortie.p50, 109.8, 1.5);
  const t1 = Date.now();
  analyserRobustesse(r);
  const ms2 = Date.now() - t1;
  verifie(`robustesse d'un gros modèle en ${ms2} ms`, ms2 < 1500, `→ ${ms2} ms`);
  // L'allègement ne doit pas fausser le classement.
  const inegal = Array.from({ length: 40 }, (_, i) => `v${i} = 1 à 1,05`).join('\n')
    + '\ngros = 1 à 100\ntotal = gros + ' + Array.from({ length: 40 }, (_, i) => `v${i}`).join(' + ');
  const ri = analyserModele(inegal);
  verifie('le sous-échantillonnage garde le bon classement',
    ri.sources[0].nom === 'gros' && ri.sources[0].part > 0.9,
    `→ ${ri.sources[0].nom} ${ri.sources[0].part.toFixed(2)}`);
}

// --- Ce que le visiteur écrit vraiment --------------------------------------
//
// Trois sessions de suite, une demi-heure passée à taper des entrées plausibles
// mais imparfaites a rapporté plus que n'importe quelle relecture. Ces cas-là
// viennent tous de cette demi-heure : chacun était refusé, ou pire, calculé de
// travers. Ils sont ici pour ne plus jamais l'être.
groupe('Ce que le visiteur écrit vraiment');
{
  // Une contrainte n'est pas un calcul. Elle se calculait pourtant sans
  // broncher, et affichait « Résultat : 0 » — la pire sortie possible.
  const c = analyserModele('budget = 300k\nprix = 250k à 400k\nprix <= budget', { N: 20000 });
  proche('« prix <= budget » : le résultat est le prix', c.sortie.p50, 316000, 4000);
  verifie('… et le budget devient l’objectif', c.seuil === 300000 && c.seuilSens === 'max',
    `→ ${c.seuil} / ${c.seuilSens}`);
  verifie('… avec une probabilité de le tenir', c.pAtteint > 0.3 && c.pAtteint < 0.4,
    `→ ${c.pAtteint}`);
  verifie('… et le site dit comment il l’a lu',
    c.avertissements.some((a) => /lu comme un objectif/.test(a.texte)));

  const d = analyserModele('a = 1 à 2\nb = 3\nok = a > b', { N: 8000 });
  verifie('un résultat qui ne vaut que 0 ou 1 est signalé',
    d.avertissements.some((a) => /deux valeurs/.test(a.texte)),
    `→ ${d.avertissements.map((a) => a.texte).join(' | ')}`);

  // Une condition ajoutée à une somme : l'écriture la plus naturelle du cas le
  // plus courant, et elle était refusée.
  proche('« a + si … alors … sinon … » se parse',
    val('a = 10\nx = a + si a > 5 alors 3 sinon 0'), 13, 0);
  proche('… et se lie bien au terme de gauche',
    val('x = 1 + si 0 alors 100 sinon 2'), 3, 0);

  // Les notations d'incertitude venues d'ailleurs.
  {
    const r = analyserModele('x = 1000 ± 100', { N: 40000 });
    proche('« 1000 ± 100 » : borne basse', r.sortie.p05, 900, 8);
    proche('… borne haute', r.sortie.p95, 1100, 8);
  }
  proche('« +/- » s\'écrit aussi en ASCII',
    analyserModele('x = 1000 +/- 100', { N: 40000 }).sortie.p05, 900, 8);
  proche('« entre 900 et 1150 » est une fourchette',
    analyserModele('x = entre 900 et 1150', { N: 40000 }).sortie.p50, 1017, 8);
  proche('« 3 pourcent » vaut 0,03', val('x = 3 pourcent'), 0.03, 1e-12);
  proche('« 2² » vaut 4', val('x = 2²'), 4, 0);

  // L'habitude des tableurs français : le point-virgule sépare les arguments.
  proche('« max(1;2) » comme dans un tableur', val('x = max(1;2)'), 2, 0);
  proche('« max(1,5 ; 2,5) » : virgule décimale et point-virgule ensemble',
    val('x = max(1,5 ; 2,5)'), 2.5, 1e-12);
  proche('… et le point-virgule reste un séparateur d\'instructions dehors',
    val('a = 2; b = a * 3'), 6, 0);

  // Les messages qui remplacent un « caractère inattendu ».
  erreur('un nom avec des espaces propose le nom collé',
    'prix du kilo = 2 à 4', 'prix_du_kilo');
  erreur('un nom avec un tiret aussi', 'prix-kilo = 2 à 4', 'prix_kilo');
  erreur('une ligne de tableau est reconnue', 'loyer\t900\t1150', 'loyer = 900 à 1150');
  proche('… et la ligne proposée se recalcule telle quelle',
    analyserModele('loyer = 900 à 1150', { N: 20000 }).sortie.p50, 1017, 8);
  proche('un nombre copié d\'une page web (espace fine insécable) se lit',
    val('x = 250\u202f000'), 250000, 0);
  erreur('une fourchette sans borne haute le dit', 'x = 900 à', 'borne');
  erreur('une fourchette à trois valeurs renvoie à triangulaire',
    'x = 900 à 1000 à 1150', 'triangulaire');
  erreur('des guillemets dans un calcul renvoient à « option »',
    'loyer = "1 150"', 'guillemets');

  // La faute la plus fréquente et la plus invisible : une majuscule perdue.
  erreur('une majuscule perdue est rattrapée',
    'Loyer = 900 à 1150\ntotal = loyer * 12', 'vouliez-vous dire « Loyer »');
  erreur('une lettre en trop aussi',
    'reparations = 100\ny = reparation * 2', 'vouliez-vous dire « reparations »');
  {
    // … mais pas n'importe quoi : suggérer un nom sans rapport serait pire.
    let msg = '';
    try { analyserModele('abc = 1\ny = xyzzy'); } catch (e) { msg = e.message; }
    verifie('un nom sans rapport ne déclenche aucune suggestion',
      !/vouliez-vous/.test(msg), `→ ${msg}`);
  }

  // « Écrivez une première ligne » ne doit s'afficher qu'à qui n'a rien écrit.
  verifie('un modèle vide est dit vide', analyserModele('# rien\n').vide === true);
  {
    let msg = '';
    try { analyserModele('a == 5'); } catch (e) { msg = e.message; }
    verifie('une ligne isolée remonte son erreur, pas « écrivez une ligne »',
      /n'est défini nulle part/.test(msg), `→ ${msg}`);
  }
}

// --- Quatrième récolte : anglais, unités en toutes lettres, échelle d'une
// fourchette. Trois lectures fausses en silence y ont été trouvées.
groupe('Ce que le visiteur écrit vraiment (suite)');
{
  // L'échelle d'une borne vaut pour l'autre. « 15 à 30 % » se lisait
  // « 15 à 0,3 », « 1 à 3 millions » « 1 à 3 000 000 » : plausible et faux.
  proche('« 15 à 30 % » va de 15 % à 30 %',
    analyserModele('x = 15 à 30 %', { N: 40000 }).sortie.p05, 0.15, 0.006);
  proche('« 15 % à 30 » aussi',
    analyserModele('x = 15 % à 30', { N: 40000 }).sortie.p95, 0.30, 0.012);
  proche('« 1 à 3 millions » va d’un à trois millions',
    analyserModele('x = 1 à 3 millions', { N: 40000 }).sortie.p05, 1e6, 4e4);
  proche('« 100 à 150k » va de cent à cent cinquante mille',
    analyserModele('x = 100 à 150k', { N: 40000 }).sortie.p05, 1e5, 4e3);
  proche('… mais « 500 à 2k » va bien de 500 à 2 000',
    analyserModele('x = 500 à 2k', { N: 40000 }).sortie.p05, 500, 20);
  proche('« 0,5 à 2 M€ » : suffixe séparé par une espace, collé au symbole',
    analyserModele('x = 0,5 à 2 M€', { N: 40000 }).sortie.p95, 2e6, 8e4);
  proche('« 30 k€ » vaut 30 000', val('x = 30 k€'), 30000, 0);
  {
    const r = analyserModele('x = 1000 ± 10 %', { N: 40000 });
    proche('« 1000 ± 10 % » : le pourcentage est relatif au centre', r.sortie.p05, 900, 8);
    proche('… borne haute', r.sortie.p95, 1100, 8);
    verifie('… et le résultat n’est pas affiché en pourcentage', r.sources[0].pourcent === false);
  }
  proche('« 10 % ± 2 % » reste absolu',
    analyserModele('x = 10 % ± 2 %', { N: 40000 }).sortie.p05, 0.08, 0.002);

  // Les mots après un nombre sont une unité : lus, ignorés, et dits.
  {
    const r = analyserModele('duree = 3 ans\nx = 10 * duree');
    proche('« 3 ans » vaut 3', r.sortie.p50, 30, 0);
    verifie('… et le site dit qu’il a ignoré « ans »',
      r.avertissements.some((a) => /« ans » est lu comme une unité/.test(a.texte)),
      `→ ${r.avertissements.map((a) => a.texte).join(' | ')}`);
  }
  proche('« 40 h/semaine » vaut 40', val('x = 40 h/semaine'), 40, 0);
  proche('« 3 ans à 5 ans » est une fourchette',
    analyserModele('x = 3 ans à 5 ans', { N: 40000 }).sortie.p50, Math.sqrt(15), 0.1);
  proche('« 3 ans a 5 ans » aussi, avec un « a » sans accent',
    analyserModele('x = 3 ans a 5 ans', { N: 40000 }).sortie.p50, Math.sqrt(15), 0.1);
  verifie('« 10 à 20 par mois » garde une seule unité, « par mois »',
    analyserModele('x = 10 à 20 par mois').avertissements.some((a) => /« par mois »/.test(a.texte)));
  erreur('« 3 x » avec x défini est une multiplication oubliée',
    'x = 2\ny = 3 x', 'la multiplication s’écrit « 3 \\* x »');
  proche('« loyer x 12 » : la croix de l’école', val('loyer = 900\ny = loyer x 12'), 10800, 0);
  proche('« 12 x 3 » aussi', val('y = 12 x 3'), 36, 0);
  proche('un nom défini « entre » reste une variable', val('entre = 3\ny = entre * 2'), 6, 0);

  // « environ » dit l'incertitude sans lui donner de largeur.
  erreur('« environ 100 » renvoie à la fourchette', 'x = environ 100', '80 à 120');
  erreur('« ~100 » aussi', 'x = ~100', '80 à 120');
  erreur('« 100 environ » aussi', 'x = 100 environ', '80 à 120');

  // En anglais.
  proche('« 100 to 200 » est une fourchette',
    analyserModele('x = 100 to 200', { N: 40000 }).sortie.p50, Math.sqrt(2e4), 4);
  proche('« between 1 and 5 »',
    analyserModele('x = between 1 and 5', { N: 40000 }).sortie.p50, Math.sqrt(5), 0.06);
  verifie('« threshold: 12 » est un seuil', analyserModele('threshold: 12\nx = 10 à 20').seuil === 12);
  verifie('« goal: >= 12 » aussi', analyserModele('goal: >= 12\nx = 10 à 20').seuilSens === 'min');
  proche('« x ** 2 » est une puissance', val('x = 3 ** 2'), 9, 0);
  proche('floor, ceil, pow', val('x = floor(2,7) + ceil(2,2) + pow(2, 3)'), 13, 0);
  erreur('« a > b ? 1 : 0 » renvoie à si … alors … sinon', 'x = 3 > 2 ? 1 : 0', 'si a > b alors');

  // Les fonctions vérifient ce qu'on leur donne.
  erreur('« max() » sans argument le dit, sans exception interne', 'x = max()', 'au moins 1 argument');
  erreur('« abs(1, 2) » aussi', 'x = abs(1, 2)', '1 argument, pas 2');
  erreur('« bernoulli(120 %) » est refusé', 'x = bernoulli(120 %)', 'de 0 à 1');
  erreur('« poisson(-2) » est refusé', 'x = poisson(-2)', 'négative');
  erreur('« triangulaire(1, 5, 3) » rappelle l’ordre', 'x = triangulaire(1, 5, 3)', 'dans cet ordre');
  erreur('« beta(0, 0) » est refusé', 'x = beta(0, 0)', 'strictement positifs');
  erreur('« % » après un nom renvoie à mod()', 'x = 7\ny = x % 3', 'mod\\(a, b\\)');
  erreur('« = » sans nom le dit', 'x = 1\n= x * 2', 'il manque un nom');
  erreur('une branche dans un calcul le dit',
    'option "A" = 1\noption "B" = 2\ngain = option "A" - option "B"', 'ne se réutilise pas');
  erreur('« défini deux fois » propose un autre nom',
    'r = 1\nr = r * 12', 'r_2');
  erreur('la parenthèse fermante s’accorde', 'x = (1 + 2', 'parenthèse fermante attendue');

  // Le résultat implicite est la dernière variable dont rien ne dépend.
  proche('« total » écrit avant ses termes reste le résultat',
    analyserModele('total = a + b\na = 10\nb = 5').sortie.p50, 15, 0);
  verifie('… et il s’appelle bien « total »',
    analyserModele('total = a + b\na = 10\nb = 5').nomSortie === 'total');
  verifie('sans dépendance, la dernière ligne reste le résultat',
    analyserModele('a = 10\nb = a * 2').nomSortie === 'b');
  {
    const r = analyserModele('a = 10 à 20\na * 2\na * 12');
    verifie('deux lignes de résultat : la première est signalée',
      r.avertissements.some((x) => x.ligne === 2 && /dernière ligne sans « = »/.test(x.texte)),
      `→ ${r.avertissements.map((x) => x.texte).join(' | ')}`);
  }

  // Une branche à égalité avec la meilleure l'emporte aussi.
  {
    const r = analyserModele('x = 10 à 20\ny = 12 à 18\noption "A" = x\noption "B" = y\noption "C" = max(x, y)', { N: 8000 });
    const c = r.options.liste.find((o) => o.nom === 'C');
    verifie('« C = max(A, B) » est recommandée', r.options.liste[r.options.recommande].nom === 'C');
    proche('… et l’emporte à tous les coups, pas 0 % du temps', c.pGagne, 1, 1e-9);
  }
}

// --- Cinquième récolte : tableaux collés, mots-opérateurs, durées, dates.
groupe('Ce que le visiteur écrit vraiment (cinquième récolte)');
{
  // « loyer;900;1150 » se découpait en trois instructions et calculait 1150.
  erreur('« loyer;900;1150 » est une ligne de tableau', 'loyer;900;1150', 'loyer = 900 à 1150');
  erreur('« loyer,900,1150 » aussi', 'loyer,900,1150', 'loyer = 900 à 1150');
  erreur('« loyer\t900\t1150\t1300 » propose la basse et la haute', 'loyer\t900\t1150\t1300', 'loyer = 900 à 1300');
  erreur('« loyer = 900\t1150 » : deux nombres à la suite', 'loyer = 900\t1150', 'loyer = 900 à 1150');
  erreur('« x = 5 % 10 % » garde les pourcentages', 'x = 5 % 10 %', 'x = 5 % à 10 %');
  erreur('l’en-tête d’un tableau est reconnu', 'poste\tbas\thaut', 'en-tête');
  proche('un tableau collé avec ses « = » et ses tabulations se calcule',
    analyserModele('loyer\t=\t900 à 1150\ncourses\t=\t400 à 650\ntotal\t=\tloyer + courses', { N: 20000 }).sortie.p50, 1532, 20);

  // Les opérateurs en toutes lettres.
  proche('« revenue minus costs »', val('revenue = 50\ncosts = 20\nprofit = revenue minus costs'), 30, 0);
  proche('« x times 2 »', val('x = 7\ny = x times 2'), 14, 0);
  proche('« x divided by 2 »', val('x = 7\ny = x divided by 2'), 3.5, 0);
  proche('« 1 sur 10 » est une division', val('x = 1 sur 10'), 0.1, 1e-12);
  proche('« 1 chance sur 10 » aussi', val('x = 1 chance sur 10'), 0.1, 1e-12);
  proche('« prix fois 12 »', val('prix = 900\nx = prix fois 12'), 10800, 0);
  verifie('… mais « 2 fois par semaine » est une unité',
    analyserModele('x = 2 fois par semaine').avertissements.some((a) => /« fois par semaine »/.test(a.texte)));
  proche('un nom défini « sur » reste une variable', val('sur = 4\ny = sur * 2'), 8, 0);
  proche('« deux à trois » : les nombres en toutes lettres',
    analyserModele('x = deux à trois', { N: 40000 }).sortie.p50, Math.sqrt(6), 0.05);
  proche('« 10 pour cent » vaut 0,1', val('x = 10 pour cent'), 0.1, 1e-12);
  verifie('… et s’affiche en pourcentage', analyserModele('x = 10 pour cent à 20 pour cent').sources[0].pourcent === true);
  proche('« 3 pour mille »', val('x = 3 pour mille'), 0.003, 1e-12);

  // Fonctions en anglais, et une fonction inconnue reste « inconnue ».
  proche('average, mean, median, stdev', val('x = 4\ny = average(x) + mean(x) + median(x) + stdev(x)'), 12, 0);
  proche('« uniform(1, 5) »', analyserModele('x = uniform(1, 5)', { N: 40000 }).sortie.p50, 3, 0.05);
  erreur('une fonction inconnue est dite inconnue, pas mal appelée', 'x = truc(3, 4)', 'inconnue');

  // Symboles devant le nombre, séparateurs venus d'ailleurs.
  proche('« $100 to $200 »', analyserModele('x = $100 to $200', { N: 40000 }).sortie.p50, Math.sqrt(2e4), 4);
  proche('« €100 à €200 »', analyserModele('x = €100 à €200', { N: 40000 }).sortie.p50, Math.sqrt(2e4), 4);
  proche('« 100\'000 » (apostrophe suisse)', val("x = 100'000"), 100000, 0);
  proche('« 100 k à 200 k » : le suffixe séparé par une espace',
    analyserModele('x = 100 k à 200 k', { N: 40000 }).sortie.p05, 1e5, 4e3);
  {
    const r = analyserModele('x = 100.000');
    proche('« 100.000 » est lu 100', r.sortie.p50, 100, 0);
    verifie('… et le site le dit', r.avertissements.some((a) => /100 000/.test(a.texte) && /100k/.test(a.texte)),
      `→ ${r.avertissements.map((a) => a.texte).join(' | ')}`);
  }
  verifie('« 10 % - 20 % » est signalé avec ses pourcentages',
    analyserModele('x = 10 % - 20 %').avertissements.some((a) => /« 10[\s\u202f]% à 20[\s\u202f]% »/.test(a.texte)));

  // Durées et dates : ce que le site ne convertit pas, il le dit.
  erreur('« 3 ans et 6 mois » renvoie à une seule unité', 'duree = 3 ans et 6 mois', 'une seule unité');
  erreur('« 3 ans 6 mois » aussi', 'duree = 3 ans 6 mois', 'une seule unité');
  erreur('une date n’est pas un nombre', 'debut = 01/09/2026', 'ne lit pas les dates');
  erreur('« 1h30 » propose 1,5 ou 90', 'duree = 1h30', '1,5');
  proche('« 2030 - 2026 » reste un calcul', val('x = 2030 - 2026'), 4, 0);
}

// --- Sixième récolte : des questions réelles, transcrites telles quelles ------
// Deux fils de forum (forumconstruire, moneyvox) réécrits avec les notations
// de leurs auteurs : « 276 500€ à 1.69% », « 150m² », « 20 000€ posé ».
groupe('Des questions réelles, écrites comme on les pose');
{
  const rachat = `unité: €
capital = 276 500€
taux_actuel = 1.69%
duree_restante = 23 ans
nouveau_taux = 1.35% à 1.48%
frais = 1000 à 3000  # IRA + dossier + garantie
i1 = taux_actuel/12
i2 = nouveau_taux/12
n = duree_restante*12
mensualite_actuelle = capital * i1 / (1 - (1+i1)^-n)
mensualite_nouvelle = capital * i2 / (1 - (1+i2)^-n)
gain = (mensualite_actuelle - mensualite_nouvelle) * n - frais`;
  const r = analyserModele(rachat, { N: 20000 });
  proche('rachat de crédit (moneyvox) : la mensualité actuelle', r.detail.calculs.find((c) => c.nom === 'mensualite_actuelle').p50, 1210, 2);
  proche('… et le gain médian', r.sortie.p50, 8050, 150);
  verifie('… avec « ans » signalé comme unité, et rien d’autre',
    r.avertissements.length === 1 && /« ans »/.test(r.avertissements[0].texte));

  const pac = `unité: €
surface = 150m²
cout_pac = 20 000€ posé
cout_gaz = 8000€ à 12000€ posé
besoin_chauffage = 15 à 40 kWh/m²/an
cop = 2,5 à 4
prix_elec = 0,25€/kWh à 0,32€/kWh
prix_gaz = 0,10€ à 0,14€ le kWh
duree = 15 ans
facture_pac = surface * besoin_chauffage / cop * prix_elec
facture_gaz = surface * besoin_chauffage / 0,9 * prix_gaz
option "PAC" = -cout_pac - facture_pac * duree
option "Gaz" = -cout_gaz - facture_gaz * duree`;
  const q = analyserModele(pac, { N: 20000 });
  verifie('pompe à chaleur (forumconstruire) : « 150m² » vaut 150', q.detail.calculs.length >= 2 && q.modeDecision);
  verifie('… « Gaz » l’emporte sur cette maison très isolée', q.options.liste[q.options.recommande].nom === 'Gaz');
  proche('… avec un coût PAC médian cohérent', q.options.liste.find((o) => o.nom === 'PAC').stats.p50, -25200, 800);

  proche('« 2300 net par mois » quand « mois » est aussi un nom défini',
    analyserModele('salaire = 2300 net par mois\nepargne = 300\nmois = 30k / epargne').sortie.p50, 100, 0);
  proche('« 1 an et demi » vaut 1,5', val('x = 1 an et demi'), 1.5, 0);
  proche('« 2 mois et demi » vaut 2,5', val('x = 2 mois et demi'), 2.5, 0);
  proche('« 6 kWc * 1100 kWh/kWc »', val('x = 6 kWc * 1100 kWh/kWc'), 6600, 0);
  proche('« 2 à 5%/an » est une fourchette de pourcentages',
    analyserModele('x = 2 à 5%/an', { N: 40000 }).sortie.p05, 0.02, 0.001);
}

// --- « Racheter son crédit ? » : le modèle existe pour son seuil de bascule ---
groupe('Racheter son crédit');
{
  const r = analyserModele(MODELES.find((m) => m.cle === 'rachat').source, { N: 20000 });
  verifie('« Racheter » l’emporte, mais pas à tous les coups',
    r.options.liste[r.options.recommande].nom === 'Racheter' && r.options.liste[r.options.recommande].pGagne > 0.7
    && r.options.liste[r.options.recommande].pGagne < 0.95, `→ ${r.options.liste[r.options.recommande].pGagne}`);
  const t = r.sources.find((s) => s.nom === 'nouveau_taux');
  verifie('le nouveau taux est l’hypothèse décisive', r.sources[0] === t && t.part > 0.8, `→ ${r.sources[0].nom} ${t.part}`);
  verifie('… avec un seuil de bascule dans la fourchette proposée',
    t.bascules.length === 1 && t.bascules[0].valeur > 0.03 && t.bascules[0].valeur < 0.033 && t.bascules[0].vers === 'Garder le crédit',
    `→ ${JSON.stringify(t.bascules)}`);
  proche('la mensualité actuelle (180 k€ à 3,4 % sur 18 ans)', r.detail.calculs.find((c) => c.nom === 'mensualite_actuelle').p50, 1115, 2);
  verifie('les frais tiennent d’abord à l’indemnité de remboursement anticipé',
    r.detail.calculs.find((c) => c.nom === 'frais').origines[0].nom === 'ira');
}

// --- Le détail des calculs --------------------------------------------------
// Chaque variable calculée avec sa médiane, et chaque somme décomposée en
// termes : ce qu'un tableur montre et que le site ne montrait pas.
groupe('Le détail des calculs');
{
  const r = analyserModele(MODELES.find((m) => m.cle === 'logement').source, { N: 20000 });
  const d = r.detail;
  verifie('le détail existe', !!d && Array.isArray(d.calculs));
  const noms = d.calculs.map((c) => c.nom);
  verifie('les constantes littérales n’y figurent pas', !noms.includes('prix') && !noms.includes('horizon'), `→ ${noms}`);
  verifie('les fourchettes n’y figurent pas non plus (elles sont au-dessus)', !noms.includes('loyer'));
  verifie('les valeurs calculées y sont, dans l’ordre du modèle',
    noms.indexOf('mensualite') < noms.indexOf('depense_an') && noms.includes('cout_achat'), `→ ${noms}`);
  const mens = d.calculs.find((c) => c.nom === 'mensualite');
  proche('« mensualite » vaut 969 €', mens.p50, 969.4, 1);
  verifie('… et elle est fixe', mens.fixe === true && mens.termes === null);
  const dep = d.calculs.find((c) => c.nom === 'depense_an');
  verifie('« depense_an » est une somme de quatre termes', dep.termes && dep.termes.length === 4,
    `→ ${dep.termes && dep.termes.length}`);
  verifie('… étiquetés par leur expression',
    dep.termes.map((t) => t.etiquette).join(' | ') === 'mensualite * 12 | charges_copro * 12 | taxe_fonciere | travaux * prix',
    `→ ${dep.termes.map((t) => t.etiquette).join(' | ')}`);
  proche('… et la mensualité annuelle vaut bien 12 fois la mensualité', dep.termes[0].p50, 12 * mens.p50, 0.5);
  const bien = d.calculs.find((c) => c.nom === 'bien_net');
  verifie('« bien_net » garde le signe de chaque terme',
    bien.termes.map((t) => t.signe).join('') === '1-1-1', `→ ${bien.termes.map((t) => t.signe)}`);
  const ach = d.options.find((o) => o.nom === 'Acheter');
  verifie('la branche « Acheter » se décompose en bien_net − cout_achat',
    ach.termes && ach.termes.length === 2 && ach.termes[1].signe === -1 && ach.termes[1].etiquette === 'cout_achat');
  verifie('ligne cliquable : chaque calcul connaît sa ligne', d.calculs.every((c) => c.ligne > 0));

  // D'où vient l'incertitude de chaque valeur intermédiaire.
  const ca = d.calculs.find((c) => c.nom === 'cout_achat');
  verifie('« cout_achat » tient d’abord à « placement »',
    ca.origines && ca.origines[0].nom === 'placement' && ca.origines[0].part > 0.35,
    `→ ${JSON.stringify(ca.origines)}`);
  verifie('… puis à « travaux »', ca.origines[1] && ca.origines[1].nom === 'travaux');
  verifie('une valeur fixe n’a pas d’origine', mens.origines === undefined);
  const pr = d.calculs.find((c) => c.nom === 'prix_revente');
  verifie('« prix_revente » ne tient qu’à « revalorisation »',
    pr.origines.length === 1 && pr.origines[0].nom === 'revalorisation' && pr.origines[0].part > 0.9,
    `→ ${JSON.stringify(pr.origines)}`);
  {
    const f = analyserModele(MODELES.find((m) => m.cle === 'freelance').source, { N: 20000 });
    const cr = f.detail.calculs.find((c) => c.nom === 'creuses');
    verifie('une source qui porte le nom de la valeur n’est pas listée comme son origine',
      cr.origines && !cr.origines.some((o) => o.nom === 'creuses'), `→ ${JSON.stringify(cr.origines)}`);
  }

  // Un terme qui tire au sort ne se décompose pas : ses tirages ne seraient
  // pas ceux du calcul. Et un terme évalué après coup n'ajoute aucune source.
  const t = analyserModele('a = 1 à 3\nx = 5 + (1 à 3)\ny = x + a', { N: 4000 });
  verifie('une somme contenant une fourchette n’est pas décomposée',
    t.detail.calculs.find((c) => c.nom === 'x').termes === null);
  verifie('… mais une somme de variables l’est', t.detail.calculs.find((c) => c.nom === 'y').termes.length === 2);
  verifie('le détail n’ajoute aucune source', t.sources.length === 2, `→ ${t.sources.length}`);

  // L'affichage d'une expression.
  {
    const r = analyserModele('a = 2\nb = 3\nc = 4\ny = (a + b) * c + a - (b - c)');
    const ts = r.detail.calculs.find((x) => x.nom === 'y').termes;
    verifie('l’étiquette d’un terme respecte les priorités, et « a - (b - c) » s’aplatit en +a −b +c',
      ts.map((t) => (t.signe < 0 ? '-' : '+') + t.etiquette).join(' | ') === '+(a + b) * c | +a | -b | +c',
      `→ ${ts.map((t) => (t.signe < 0 ? '-' : '+') + t.etiquette).join(' | ')}`);
  }
  verifie('« 3 millions » s’affiche comme un nombre',
    analyserModele('a = 1\ny = a + 3 millions').detail.calculs[0].termes[1].etiquette === '3 000 000');
  verifie('« 15 % » garde son pourcentage',
    analyserModele('a = 1\ny = a + 15 %').detail.calculs[0].termes[1].etiquette === '15 %');
}

// --- Les chiffres cités par /la-methode -------------------------------------
// La page explique la méthode avec des exemples chiffrés. Si le moteur change,
// la page doit changer avec lui : ces assertions sont là pour l'imposer.
groupe('Chiffres cités par /la-methode');
{
  const a = analyserModele('x = 100 à 400', { N: 80000 });
  proche('« 100 à 400 » : médiane 200', a.sortie.p50, 200, 3);

  const b = analyserModele('gros = 0 à 100\npetit = 49 à 51\ny = gros + petit', { N: 60000 });
  const parts = Object.fromEntries(b.sources.map((x) => [x.nom, x.part]));
  proche('« gros » porte 100 % de l\'incertitude', parts.gros, 1, 0.03);
  proche('« petit » en porte 0 %', parts.petit, 0, 0.03);
  proche('la fourchette du résultat fait 93 de large', b.largeurTotale, 93, 4);
  proche('… et 5 une fois « gros » connu',
    b.sources.find((x) => x.nom === 'gros').largeurResiduelle, 5, 2);

  const c = analyserModele('a = 1 à 1000\ny = a', { N: 40000 });
  proche('« y = a » : la part sur les rangs vaut 1', c.sources[0].part, 1, 0.01);

  const d = analyserModele(
    'cout_actuel = 1200\ncout_nouveau = 700 à 1900\n'
    + 'option "Garder" = -cout_actuel\noption "Changer" = -cout_nouveau', { N: 80000 });
  const bascule = d.sources[0].bascules[0];
  proche('le seuil de bascule tombe à 1 200', bascule.valeur, 1200, 15);
  verifie('… et bascule bien vers « Garder »', bascule.vers === 'Garder', `→ ${bascule.vers}`);
  proche('… ce qui arrive 45 % du temps', bascule.proba, 0.45, 0.02);
  proche('la valeur de l\'information vaut 141', d.options.evpi, 141, 8);

  const { MODELES: M4 } = await import('../public/js/modeles.js');
  const src = (cle) => M4.find((m) => m.cle === cle).source;

  const v = analyserModele(src('voiture'), { N: 40000 });
  const rep = v.sources.find((x) => x.nom === 'reparations');
  proche('voiture : les réparations portent 54 % de l\'incertitude', rep.part, 0.54, 0.06);
  proche('… le verdict bascule au-delà de 1 110 €/an', rep.bascules[0].valeur, 1110, 60);
  proche('… ce qui arrive 3 fois sur 10', rep.bascules[0].proba, 0.28, 0.04);
  proche('… et lever ce doute vaut environ 630 €', rep.valeurInfo, 630, 100);

  // Le chapitre « Le contre-argument » cite un exemple à trois hypothèses et
  // deux faits sur la bibliothèque. Si le moteur bouge, c'est la page qu'il
  // faudra corriger — pas ces assertions qu'il faudra assouplir.
  const ca = analyserModele(
    'a = 90 à 110\nb = 90 à 110\nc = 90 à 110\n'
    + 'option "Rester" = a + b + c\noption "Partir" = 320', { N: 20000 });
  const cc = analyserContreArgument(ca);
  proche('« Partir » l\'emporte 97 % du temps',
    ca.options.liste[ca.options.recommande].pGagne, 0.97, 0.02);
  verifie('… et aucune des trois n\'y suffit seule',
    ca.sources.every((x) => x.bascules.length === 0));
  proche('le contre-argument est à 2,01 écarts', cc.beta, 2.01, 0.08);
  verifie('… porté à parts égales par les trois',
    cc.deplacements.length === 3 && cc.deplacements.every((x) => Math.abs(x.part - 1 / 3) < 0.04),
    `→ ${cc.deplacements.map((x) => x.part.toFixed(2)).join(' / ')}`);
  verifie('… qui valent 107 au lieu de 99,5',
    cc.deplacements.every((x) => Math.abs(x.valeur - 107) < 1.2 && Math.abs(x.mediane - 99.5) < 0.6),
    `→ ${cc.deplacements.map((x) => x.valeur.toFixed(1)).join(' / ')}`);

  const cp = analyserContreArgument(analyserModele(src('projet'), { N: 20000 }));
  verifie('projet : les durées médianes tombent sur la ligne des 90 jours',
    cp.surLaFrontiere === true, `→ β = ${cp.beta}`);

  const ck = analyserModele(src('combles'), { N: 20000 });
  verifie('combles : aucune hypothèse ne bascule seule, donc le contre-argument parle',
    ck.sources.every((x) => x.bascules.length === 0)
    && analyserContreArgument(ck).deplacements.length >= 3);

  const rl = analyserRobustesse(analyserModele(src('logement'), { N: 20000 }));
  verifie('logement : le verdict bascule à 2,5× plus large', rl.kBascule === 2.5, `→ ${rl.kBascule}`);
  const rc = analyserRobustesse(analyserModele(src('combles'), { N: 20000 }));
  verifie('combles : la conclusion tient jusqu\'à 6×', rc.kBascule === null, `→ ${rc.kBascule}`);
  verifie('combles : et rien ne vaut d\'être vérifié',
    analyserModele(src('combles'), { N: 20000 }).options.acquise === true);

  // Le chapitre « Le poids et l'incertitude » : sur le prix du kilomètre, la
  // décote est le poste le plus lourd de « fixe », mais l'incertitude vient
  // des réparations et du stationnement. Et sur un produit, rien à peser.
  const km = analyserModele(src('kilometre'), { N: 20000 });
  const fixe = km.detail.calculs.find((c) => c.nom === 'fixe');
  const poids = Object.fromEntries(fixe.termes.map((t) => [t.etiquette, t.p50]));
  proche('kilomètre : « fixe » vaut 4 240 €', fixe.p50, 4240, 80);
  proche('… la décote 1 930 €, près de la moitié', poids.decote_an, 1930, 40);
  verifie('… soit entre 45 et 50 % de « fixe »',
    poids.decote_an / fixe.p50 > 0.45 && poids.decote_an / fixe.p50 < 0.50, `→ ${(poids.decote_an / fixe.p50).toFixed(3)}`);
  proche('… l\'assurance 670 €', poids.assurance, 670, 20);
  proche('… les réparations 350 €', poids.reparations, 350, 20);
  const orig = Object.fromEntries(fixe.origines.map((o) => [o.nom, o.part]));
  verifie('… mais l\'incertitude de « fixe » vient d\'abord des réparations',
    fixe.origines[0].nom === 'reparations', `→ ${fixe.origines.map((o) => o.nom).join(', ')}`);
  proche('… à 39 %', orig.reparations, 0.39, 0.06);
  proche('… puis du stationnement à 28 %', orig.stationnement, 0.28, 0.06);
  verifie('… et la décote n\'y est pour presque rien',
    !('valeur_residuelle' in orig), `→ ${Object.keys(orig).join(', ')}`);
  proche('… le stationnement pèse 11 % au centre', poids.stationnement / fixe.p50, 0.11, 0.015);

  const pr = analyserModele('a = 1 à 3\nb = 10 à 12\nc = 100 à 110\ny = a * b * c', { N: 20000 });
  proche('produit : « a » porte 96 % de l\'incertitude', pr.sources.find((s) => s.nom === 'a').part, 0.96, 0.03);
  verifie('… et un produit n\'est pas décomposé en postes',
    pr.detail.calculs.every((c) => !c.termes));

  // Chapitre « ce que vous jouez ».
  const jeu = analyserModele(src('logement'));
  proche('« Acheter » l\'emporte 59 % du temps',
    jeu.options.liste[jeu.options.recommande].pGagne, 0.59, 0.02);
  proche('… gagne 36 k€ quand il gagne', jeu.options.pari.gainMedian, 36000, 700);
  proche('… coûte 26,3 k€ quand il perd', jeu.options.pari.perteMediane, 26300, 700);
  proche('… et 78,3 k€ dans le pire vingtième', jeu.options.pari.pertePire, 78300, 1200);

  const fr = analyserModele(src('freelance'));
  proche('« Passer freelance » l\'emporte 8 fois sur 10',
    fr.options.liste[fr.options.recommande].pGagne, 0.78, 0.03);
  proche('… rapporte 33,6 k€ quand il gagne', fr.options.pari.gainMedian, 33600, 900);
  proche('… le pire vingtième des pertes coûte 46,9 k€', fr.options.pari.pertePire, 46900, 1500);
  verifie('… soit plus que ce que la branche rapporte quand elle gagne',
    fr.options.pari.pertePire > fr.options.pari.gainMedian);

  const lot = analyserModele('gros = bernoulli(10 %)\noption "Sûr" = 100\n'
    + 'option "Loterie" = si gros alors 300 sinon 90', { N: 40000 });
  proche('« Loterie » rapporte 111 € en moyenne',
    lot.options.liste[lot.options.recommande].stats.moyenne, 111, 1.5);
  proche('« Sûr » en rapporte 100', lot.options.liste[lot.options.frequent].stats.moyenne, 100, 0.001);
  proche('… et l\'emporte 9 fois sur 10', lot.options.liste[lot.options.frequent].pGagne, 0.90, 0.02);
}

// --- Formules sur plusieurs lignes ------------------------------------------
groupe('Continuation de ligne');
{
  // Ce cas a tronqué en silence un modèle de la bibliothèque pendant deux
  // sessions : « changer = a - b » suivi de lignes commençant par « + ».
  const src = 'a = 100\nb = 20\nc = 3\ntotal = a - b\n  + c * 2\n  - 5';
  proche('une ligne commençant par « + » continue la précédente', val(src), 81, 0);
  proche('… et une ligne commençant par « * » aussi',
    val('a = 4\nx = a\n  * 3'), 12, 0);
  proche('parenthèse ouverte : la fin de ligne est suspendue',
    val('x = (1\n + 2\n + 3)'), 6, 0);
  proche('appel de fonction sur plusieurs lignes',
    val('x = max(\n  1,\n  5,\n  3\n)'), 5, 0);
  proche('une ligne isolée reste une expression',
    val('a = 1\n7 * 6'), 42, 0);
  {
    const r = analyserModele('a = 100\nb = 20\nd = 3\ntotal = a - b\n  + d', { N: 500 });
    verifie('la continuation ne laisse aucune variable orpheline',
      (r.avertissements || []).length === 0,
      `→ ${(r.avertissements || []).map((x) => x.texte).join(' | ')}`);
  }
}

// --- Avertissements et cas dégénérés ----------------------------------------
groupe('Avertissements');
const av = (src) => (analyserModele(src, { N: 2000 }).avertissements || []).map((a) => a.texte).join(' | ');
{
  verifie('« 900-1150 » est signalé comme une fourchette manquée',
    /fourchette/.test(av('loyer = 900-1150\ntotal = loyer')), `→ ${av('loyer = 900-1150\ntotal = loyer')}`);
  verifie('… même écrit avec des espaces',
    /fourchette/.test(av('loyer = 900 - 1150\ntotal = loyer')));
  verifie('une soustraction légitime n\'est pas signalée',
    !/fourchette/.test(av('marge = 1150 - 900\ntotal = marge')), `→ ${av('marge = 1150 - 900\ntotal = marge')}`);
  verifie('une variable oubliée est signalée',
    /loyerr/.test(av('loyer = 900 à 1150\nloyerr = 5\ntotal = loyer')));
  verifie('la dernière variable ne compte pas comme inutilisée',
    !/utilisé/.test(av('a = 1\nb = a + 1')), `→ ${av('a = 1\nb = a + 1')}`);
  verifie('une variable utilisée par une option ne l\'est pas non plus',
    !/utilisé/.test(av('x = 1 à 3\noption "A" = x\noption "B" = 2')));
  verifie('une variable utilisée par le seuil ne l\'est pas non plus',
    !/utilisé/.test(av('cible = 10\nseuil: cible\nx = 1 à 30\ny = x')));
  verifie('deux branches homonymes sont signalées',
    /Deux branches/.test(av('option "A" = 1\noption "A" = 2')));
  verifie('une seule branche est signalée',
    /seule branche/.test(av('option "A" = 1')));
  verifie('un modèle sain ne produit aucun avertissement',
    av('x = 1 à 3\ny = x * 2') === '', `→ ${av('x = 1 à 3\ny = x * 2')}`);
  for (const m of (await import('../public/js/modeles.js')).MODELES) {
    verifie(`« ${m.titre} » ne produit aucun avertissement`, av(m.source) === '', `→ ${av(m.source)}`);
  }
}

groupe('Cas dégénérés');
{
  verifie('une seule option : rien à afficher, sans exception',
    analyserModele('option "A" = 10').probleme === 'sans-resultat');
  verifie('division par zéro : valeurs impossibles',
    analyserModele('a = 0\ny = 10 / a').probleme === 'valeurs-impossibles');
  verifie('racine d\'un négatif : valeurs impossibles',
    analyserModele('y = racine(0 - 4)').probleme === 'valeurs-impossibles');
  verifie('un modèle valide n\'a aucun problème',
    analyserModele('x = 1 à 3\ny = x').probleme === undefined);
  // Une poignée de tirages non finis ne doit pas condamner tout le modèle.
  const r = analyserModele('d = 0 à 100\ny = si d > 0,0001 alors 1 / d sinon 0', { N: 20000 });
  verifie('un cas limite rare ne bloque pas le modèle', r.probleme === undefined, `→ ${r.probleme}`);
}

// --- Enjeu et décision acquise ----------------------------------------------
groupe('Enjeu du choix');
{
  // Un écart énorme entre les branches : aucune enquête ne peut le combler.
  const r = analyserModele(`
x = 1 à 3
option "Grand" = 10000 + x
option "Petit" = 10
`, { N: 20000 });
  proche('l\'enjeu est l\'écart entre branches', r.options.enjeu, 9992, 5);
  verifie('une décision écrasante est déclarée acquise', r.options.acquise === true);
}
{
  // Deux branches serrées : l'information vaut quelque chose.
  const r = analyserModele(`
x = 0 à 200
option "A" = x
option "B" = 100
`, { N: 20000 });
  verifie('une décision serrée n\'est pas acquise', r.options.acquise === false,
    `→ EVPI ${r.options.evpi.toFixed(1)} / enjeu ${r.options.enjeu.toFixed(1)}`);
  verifie('l\'information y vaut plus de 2 % de l\'enjeu',
    r.options.evpi > 0.02 * r.options.enjeu);
}
{
  const parModele = {};
  const { MODELES: M3 } = await import('../public/js/modeles.js');
  for (const m of M3) {
    const r = analyserModele(m.source);
    if (r.modeDecision) parModele[m.cle] = r.options.acquise;
  }
  verifie('« Réduire son empreinte » : le choix est acquis', parModele.carbone === true);
  verifie('« Louer ou acheter » : le choix ne l\'est pas', parModele.logement === false);
}

// --- Une pièce ne se fige pas à sa médiane -----------------------------------
groupe('Les tirages tout ou rien pendant un balayage');
{
  // La médiane d'une pièce à 30 %, c'est « pile ne tombe jamais ». Balayer la
  // prime avec elle, c'est chercher le seuil en supposant le sinistre écarté :
  // « Ne rien faire » valait 0 partout, et aucune prime ne basculait.
  const src = `sinistre = bernoulli(30%)
option "Assurer" = -prime
option "Ne rien faire" = si sinistre alors -200 sinon 0
prime = 40 à 90`;
  const r = analyserModele(src, { N: 20000 });
  const b = r.sources.find((x) => x.nom === 'prime').bascules;
  verifie('la prime a un seuil de bascule', b.length === 1,
    `→ ${JSON.stringify(b.map((x) => x.valeur))}`);
  proche('… à l\'espérance du sinistre, 60 €', b[0] ? b[0].valeur : NaN, 60, 2);
  verifie('… au-delà duquel il vaut mieux ne rien faire',
    b[0] && b[0].vers === 'Ne rien faire' && b[0].sens === 'hausse',
    `→ ${b[0] && b[0].vers} / ${b[0] && b[0].sens}`);

  // Et le balayage reste exact là où il n'y a pas de pièce : le seuil épinglé
  // de « garder ou changer de voiture » ne doit pas avoir bougé d'un cheveu.
  const v = analyserModele(MODELES.find((m) => m.cle === 'voiture').source);
  const rep = v.sources.find((x) => x.nom === 'reparations');
  proche('un modèle sans pièce garde son seuil au même endroit',
    rep.bascules[0].valeur, 1110, 40);
}
{
  // « bernoulli(120 %) » doit continuer de refuser : c'est le visiteur qui
  // écrit, et le tirage valait 1 à tous les coups sans un mot. Le ramené aux
  // bornes ne vaut que sous élargissement, où c'est nous qui étirons.
  let refus = null;
  try { analyserModele('x = bernoulli(120%)'); } catch (e) { refus = e.message; }
  verifie('une probabilité au-delà de 100 % refuse toujours',
    /probabilité va de 0 à 1/.test(refus || ''), `→ ${refus}`);
  // Mais la passe de robustesse, qui élargit « 15 % à 35 % » jusqu'à sortir
  // de [0, 1], ne doit pas planter : elle plantait.
  const r = analyserModele(MODELES.find((m) => m.cle === 'offres').source);
  let rob = null, erreur = null;
  try { rob = analyserRobustesse(r); } catch (e) { erreur = e.message; }
  verifie('la robustesse tourne sur un modèle à probabilité tirée',
    erreur === null && rob && rob.applicable, `→ ${erreur}`);
}

// --- Répondre à un appel d'offres -------------------------------------------
groupe('Répondre à un appel d\'offres');
{
  const r = analyserModele(MODELES.find((m) => m.cle === 'offres').source);
  const o = r.options.liste;
  verifie('« Répondre » a la meilleure espérance',
    o[r.options.recommande].nom === 'Répondre');
  verifie('« Passer son tour » l\'emporte le plus souvent',
    o[r.options.frequent].nom === 'Passer son tour');
  verifie('c\'est le modèle qui montre le désaccord', r.options.desaccord === true);
  proche('« Répondre » gagne 2 fois sur 10', o[r.options.recommande].pGagne, 0.24, 0.04);
  const P = r.options.pari;
  proche('… 18 k€ de mieux quand il l\'emporte', P.gainMedian, 18000, 900);
  proche('… la mise perdue sinon, 4 088 €', P.perteMediane, 4088, 200);
  proche('… et 7 225 € dans le pire vingtième', P.pertePire, 7225, 400);

  // L'issue de la consultation domine et n'est pas une enquête à mener :
  // c'est ce que le verdict doit dire au lieu d'y envoyer le visiteur.
  verifie('l\'issue de la consultation domine la valeur de l\'information',
    r.sources[0].nom === 'remporte' && r.sources[0].binaire === true,
    `→ ${r.sources[0].nom}`);
  const verifiable = r.sources.find((x) => !x.binaire && x.valeurInfo > 0);
  verifie('… et la meilleure hypothèse vérifiable est le temps passé',
    verifiable.nom === 'jours_reponse', `→ ${verifiable.nom}`);
  proche('… dont le seuil tombe vers 8,8 jours', verifiable.bascules[0].valeur, 8.8, 0.6);
  const ch = r.sources.find((x) => x.nom === 'chances');
  proche('le taux de réussite bascule vers 18 %', ch.bascules[0].valeur, 0.18, 0.02);
  verifie('… vers « Répondre » en montant', ch.bascules[0].vers === 'Répondre');
}
{
  // Ce que « ce qu'il ignore » affirme : lier les chances au temps passé fait
  // presque disparaître la valeur d'aller vérifier ce temps.
  const src = MODELES.find((m) => m.cle === 'offres').source;
  const lie = src.replace('chances = 15% à 35%',
    'base = 8% à 18%\nchances = base + 1,5% * jours_reponse');
  const a = analyserModele(src);
  const b = analyserModele(lie);
  const info = (r) => r.sources.find((x) => x.nom === 'jours_reponse').valeurInfo;
  proche('sans lien, vérifier le temps passé vaut 219 €', info(a), 219, 40);
  verifie('avec le lien, il ne vaut presque plus rien', info(b) < 30, `→ ${info(b).toFixed(0)} €`);
  verifie('… et son seuil recule au-delà de 11 jours',
    b.sources.find((x) => x.nom === 'jours_reponse').bascules[0].valeur > 11);
}

// --- Chiffres cités par les textes de fond -----------------------------------
//
// Même règle que pour /la-methode : une page qui cite un chiffre du moteur ne
// doit pas pouvoir dériver en silence. Quand ce groupe casse, c'est le texte
// qu'on corrige, pas le test qu'on assouplit.
groupe('Chiffres cités par les textes de fond');
{
  const orig = (cle, calcul) => {
    const r = analyserModele(MODELES.find((m) => m.cle === cle).source);
    const c = r.detail.calculs.find((x) => x.nom === calcul);
    return Object.fromEntries((c.origines || []).map((o) => [o.nom, o.part]));
  };

  const cout = orig('combles', 'cout');
  proche('combles : le coût tient à « prix_m2 » aux deux tiers', cout.prix_m2, 0.66, 0.07);
  proche('… et à « aide » pour près d\'un tiers', cout.aide, 0.29, 0.07);
  const gain = orig('combles', 'gain_total');
  proche('… le gain tient à « economie » pour la moitié', gain.economie, 0.50, 0.07);
  proche('… à « chauffage_actuel » pour près d\'un tiers', gain.chauffage_actuel, 0.29, 0.07);
  proche('… et le prix futur de l\'énergie n\'en porte que 15 %', gain.prix_energie, 0.15, 0.05);

  {
    // Le seuil sur le taux journalier n'existe que depuis que les années
    // creuses ont cessé d'être supposées absentes pendant le balayage.
    const r = analyserModele(MODELES.find((m) => m.cle === 'freelance').source);
    const parts = Object.fromEntries(r.sources.map((x) => [x.nom, x]));
    proche('freelance : le taux journalier bascule à 471 €',
      parts.tjm.bascules[0].valeur, 471, 12);
    verifie('… vers « Passer freelance » en montant',
      parts.tjm.bascules[0].vers === 'Passer freelance');
    proche('… « tjm » porte 36 % de l\'écart entre les branches', parts.tjm.part, 0.36, 0.05);
    proche('… « creuses » 28 %', parts.creuses.part, 0.28, 0.05);
    verifie('… mais « creuses » vaut près de deux fois plus à lever',
      parts.creuses.valeurInfo > 1.7 * parts.tjm.valeurInfo,
      `→ ${parts.creuses.valeurInfo.toFixed(0)} contre ${parts.tjm.valeurInfo.toFixed(0)}`);
  }
  const ca = orig('freelance', 'ca');
  proche('freelance : le CA tient à « tjm » à 61 %', ca.tjm, 0.61, 0.06);
  proche('… et à « jours_facturables » à 37 %', ca.jours_facturables, 0.37, 0.06);
  {
    // Et pourtant c'est « creuses » que le site désigne : la plus grande part
    // d'incertitude et la plus grande valeur d'information ne sont pas la même
    // hypothèse. C'est toute la phrase du texte de fond.
    const r = analyserModele(MODELES.find((m) => m.cle === 'freelance').source);
    const parts = Object.fromEntries(r.sources.map((x) => [x.nom, x]));
    verifie('… mais c\'est « creuses » qui vaut le plus d\'être levé',
      r.sources[0].nom === 'creuses', `→ ${r.sources[0].nom}`);
    verifie('… alors que « tjm » porte plus d\'incertitude que lui',
      parts.tjm.part > parts.creuses.part,
      `→ tjm ${parts.tjm.part.toFixed(2)} / creuses ${parts.creuses.part.toFixed(2)}`);
  }

  const travail = orig('projet', 'travail');
  proche('projet : le temps de travail tient à « developpement » à 59 %', travail.developpement, 0.59, 0.07);
  const duree = orig('projet', 'duree');
  proche('… mais la durée calendaire à 37 % seulement', duree.developpement, 0.37, 0.06);
  proche('… les interruptions en portant 27 %', duree.interruptions, 0.27, 0.06);

  const rep = orig('reparer', 'cout_reparer');
  proche('réparer : le coût tient à « survie_reparee » à 46 %', rep.survie_reparee, 0.46, 0.07);
  proche('… et à « rechute » à 33 %', rep.rechute, 0.33, 0.07);
  verifie('… le devis n\'y est pour presque rien', !('devis' in rep), `→ ${Object.keys(rep).join(', ')}`);

  const frais = orig('rachat', 'frais');
  proche('rachat : l\'incertitude des frais tient à « ira » à 42 %', frais.ira, 0.42, 0.07);
  proche('… puis à « garantie » à 33 %', frais.garantie, 0.33, 0.07);
  {
    // « Le poste le plus lourd est aussi le plus incertain » : ici les deux
    // coïncident, contrairement au prix du kilomètre. Le texte le dit ainsi.
    const r = analyserModele(MODELES.find((m) => m.cle === 'rachat').source);
    const t = r.detail.calculs.find((x) => x.nom === 'frais').termes;
    const dossier = t.find((x) => /frais_dossier/.test(x.etiquette));
    const reste = t.find((x) => /garantie/.test(x.etiquette));
    proche('… les frais de dossier valent environ 860 €', dossier.p50, 860, 60);
    verifie('… et la garantie plus l\'indemnité, trois fois plus',
      reste.p50 > 2.5 * dossier.p50 && reste.p50 < 3.6 * dossier.p50,
      `→ ${reste.p50.toFixed(0)} contre ${dossier.p50.toFixed(0)}`);
  }
}

// --- Huitième récolte : un fil que je n'ai pas choisi -------------------------
//
// Les sept premières récoltes partaient de saisies que j'imaginais. Celle-ci
// vient d'un fil de forum pris dans l'ordre d'arrivée, sur un sujet que je
// n'aurais pas choisi (un ventilateur de plafond) : hauteurs, débits, surfaces.
// Cinq lectures fausses en silence.
groupe('Un fil que je n\'ai pas choisi');
{
  const err = (src) => { try { analyser(src); return null; } catch (e) { return e.message; } };
  const val = (src) => {
    const r = evaluerModele(analyser(src));
    const v = r.variables.get([...r.variables.keys()].pop());
    return ArrayBuffer.isView(v) ? v[0] : v;
  };
  const avert = (src) => (analyserModele(src).avertissements || []).map((a) => a.texte).join(' ');

  // « 1m80 », « 1m52 » : la notation française des grandeurs composées. Elles
  // valaient 1, avec un simple avertissement d'unité ignorée.
  verifie('« 1m80 » ne vaut plus 1', /écrivez 1,80/.test(err('h = 1m80') || ''), `→ ${err('h = 1m80')}`);
  verifie('« 1m52 » non plus', /écrivez 1,52/.test(err('e = 1m52') || ''));
  verifie('« 1km500 » non plus', /écrivez 1,500/.test(err('d = 1km500') || ''));
  verifie('… mais « 1h30 » garde son message d\'heures',
    /en heures/.test(err('t = 1h30') || ''), `→ ${err('t = 1h30')}`);
  verifie('… et « 1min30 » parle en minutes',
    /en minutes/.test(err('t = 1min30') || ''), `→ ${err('t = 1min30')}`);
  // Les multiplicateurs d'échelle : « 1k500 » vaut 1 500, mais la correction
  // « 1,500 » vaudrait 1,5. C'est pourquoi ils avaient été laissés de côté — et
  // pourquoi « 1k500 » a valu 1, en silence, pendant douze sessions.
  verifie('« 1k500 » ne vaut plus 1',
    /écrivez 1500/.test(err('x = 1k500') || ''), `→ ${err('x = 1k500')}`);
  verifie('… et propose aussi l\'écriture décimale',
    /1,5k/.test(err('x = 1k500') || ''), `→ ${err('x = 1k500')}`);
  verifie('« 2k750 » de même', /écrivez 2750/.test(err('x = 2k750') || ''));
  verifie('« 1k50 » a deux lectures, et on ne devine pas',
    /deux lectures/.test(err('x = 1k50') || ''), `→ ${err('x = 1k50')}`);
  verifie('« 2M500 » aussi', /deux lectures/.test(err('x = 2M500') || ''));
  proche('« 250k » reste 250 000', val('x = 250k'), 250000, 0);
  proche('« 1,5k » reste 1 500', val('x = 1,5k'), 1500, 0);
  proche('« 12Md » reste 12 milliards', val('x = 12Md'), 12e9, 0);

  // Un seul chiffre après l'unité, c'est un exposant, pas une grandeur composée.
  proche('« 60m2 » vaut toujours 60', val('s = 60m2'), 60, 0);
  proche('« 45m2 + 12 » vaut toujours 57', val('s = 45m2 + 12'), 57, 0);
  proche('« 150m² » vaut toujours 150', val('s = 150m²'), 150, 0);
  proche('la notation scientifique survit', val('x = 1e60'), 1e60, 0);

  // « m » collé à un nombre est le suffixe des millions ; dans un texte
  // français, c'est aussi la façon d'écrire des mètres. On lit le million,
  // et on le dit — comme pour « 100.000 ».
  proche('« 2,4m » vaut 2 400 000', val('x = 2,4m'), 2.4e6, 0);
  verifie('… et le site le signale',
    /suffixe des millions/.test(avert('x = 2,4m')), `→ ${avert('x = 2,4m')}`);
  verifie('… en montrant l\'écriture des mètres',
    /« 2,4 m »/.test(avert('x = 2,4m')), `→ ${avert('x = 2,4m')}`);
  verifie('… mais se tait devant un symbole monétaire', avert('ca = 2,4m€') === '');
  proche('« 2,4 m » avec une espace vaut 2,4', val('x = 2,4 m'), 2.4, 0);

  // L'apostrophe typographique dans un mot : « caractère inattendu « ’ » »
  // était le pire message possible, on ne voit pas ce qu'il faut corriger.
  proche('« 100 d’euros » passe', val('x = 100 d’euros'), 100, 0);
  proche("« 100 d'euros » aussi", val("x = 100 d'euros"), 100, 0);
  proche('un nom de variable peut porter une apostrophe', val('prix_d’achat = 100'), 100, 0);
  proche('… et l\'apostrophe suisse reste un séparateur de milliers',
    val("x = 1'000'000"), 1e6, 0);

  // « une vingtaine » valait 1 : « une » lu comme le nombre, « vingtaine »
  // ignoré comme une unité. C'est un « environ » qui ne dit pas son nom.
  verifie('« une vingtaine » renvoie à la fourchette',
    /« 16 à 24 »/.test(err('n = une vingtaine') || ''), `→ ${err('n = une vingtaine')}`);
  verifie('« une dizaine » aussi', /« 8 à 12 »/.test(err('n = une dizaine') || ''));
  verifie('« deux douzaines » aussi', /« 10 à 14 »/.test(err('n = deux douzaines') || ''));
  verifie('« une vingtaine de ventilateurs » aussi',
    /9 chances sur 10/.test(err('n = une vingtaine de ventilateurs') || ''));
  proche('… mais « dizaine » reste utilisable comme nom',
    val('dizaine = 10\ntotal = dizaine * 3'), 30, 0);

  // Ce qui passait déjà et doit continuer de passer.
  proche('« 152cm »', val('p = 152cm'), 152, 0);
  proche('« 5 à 30W »', analyserModele('c = 5 à 30W').sortie.p50, Math.sqrt(150), 0.6);
  proche('« 28 à 45 dB »', analyserModele('b = 28 à 45 dB').sortie.p50, Math.sqrt(28 * 45), 0.8);
  proche('« 1,3m3/seconde »', val('f = 1,3m3/seconde'), 1.3, 0);
  proche('« 3 x 2,4 » : la croix de multiplication', val('v = 3 x 2,4'), 7.2, 1e-9);
}

// --- Ce qu'on gagne, ce qu'on perd -------------------------------------------
groupe('Ce que vous jouez');
{
  // Une branche qui gagne rarement et gros : la meilleure espérance et la
  // meilleure fréquence ne désignent pas la même branche. Le site affichait
  // « À égalité — « Loterie » l'emporte 10 % du temps », ce qui ne veut rien
  // dire : la branche marquée « retenue » perdait neuf fois sur dix.
  const r = analyserModele(`unite: €
gros = bernoulli(10%)
option "Sûr" = 100
option "Loterie" = si gros alors 300 sinon 90`, { N: 20000 });
  verifie('la branche retenue reste celle de meilleure espérance',
    r.options.liste[r.options.recommande].nom === 'Loterie');
  verifie('la branche qui gagne le plus souvent est nommée à part',
    r.options.liste[r.options.frequent].nom === 'Sûr');
  verifie('le désaccord entre les deux règles est signalé', r.options.desaccord === true);
  const P = r.options.pari;
  proche('elle l\'emporte une fois sur dix', P.pGain, 0.10, 0.02);
  proche('quand elle l\'emporte, c\'est 200 € de mieux', P.gainMedian, 200, 1);
  proche('quand elle perd, c\'est 10 € de moins', P.perteMediane, 10, 1);
}
{
  // Rien à jouer : une branche domine partout, l'autre est à égalité partout.
  const dom = analyserModele('a = 1 à 10\noption "A" = a + 100\noption "B" = a', { N: 5000 });
  verifie('une branche dominante ne perd jamais', dom.options.pari.pPerte === 0);
  verifie('elle ne fait pas parler de désaccord', dom.options.desaccord === false);
  const ega = analyserModele('a = 1 à 10\noption "A" = a\noption "B" = a', { N: 5000 });
  verifie('deux branches identiques ne gagnent ni ne perdent rien',
    ega.options.pari.pGain === 0 && ega.options.pari.pPerte === 0);
}
{
  // Trois invariants qui tiennent la phrase « ce que vous jouez » : la
  // fréquence de perte y est présentée comme le regret déjà annoncé deux
  // lignes plus haut, et la queue comme pire que la médiane des pertes.
  let regret = 0, ordre = 0, somme = 0, desaccords = [];
  for (const m of MODELES) {
    const r = analyserModele(m.source);
    if (!r.modeDecision) continue;
    const P = r.options.pari;
    if (Math.abs(P.pPerte - r.options.pRegret) > 1e-9) regret++;
    if (P.pertePire < P.perteMediane) ordre++;
    if (Math.abs(P.pGain + P.pPerte - 1) > 1e-9) somme++;
    if (r.options.desaccord) desaccords.push(m.cle);
  }
  verifie('la fréquence de perte est exactement le regret annoncé', regret === 0);
  verifie('la pire perte n\'est jamais moindre que la perte médiane', ordre === 0);
  verifie('gains et pertes couvrent tous les tirages', somme === 0);
  verifie('un seul modèle de la bibliothèque fait diverger les deux règles',
    desaccords.length === 1 && desaccords[0] === 'offres', '→ ' + desaccords.join(', '));
}
{
  // Les chiffres que le verdict de l'accueil affiche désormais. Ils viennent
  // de la même passe que le reste : si le modèle bouge, ils bougent.
  const r = analyserModele(MODELES.find((m) => m.cle === 'logement').source);
  const P = r.options.pari;
  proche('« Acheter » gagne 36 k€ quand il gagne', P.gainMedian, 35974, 400);
  proche('et coûte 26,3 k€ quand il perd', P.perteMediane, 26333, 400);
  proche('78,3 k€ dans le pire vingtième de ces cas-là', P.pertePire, 78318, 900);
  verifie('le pire cas pèse trois fois la perte médiane',
    P.pertePire > 2.5 * P.perteMediane);
}

// --- Élargissement des fourchettes ------------------------------------------
groupe('Élargissement (robustesse)');
{
  const src = 'x = 900 à 1150';
  const base = evaluerModele(analyser(src), { N: 40000 });
  const large = evaluerModele(analyser(src), { N: 40000, elargissement: 2 });
  const tb = trier(base.variables.get('x')), tl = trier(large.variables.get('x'));
  proche('la médiane ne bouge pas', quantile(tl, 0.5), quantile(tb, 0.5), 3);
  verifie('la fourchette s\'élargit vers le bas', quantile(tl, 0.05) < quantile(tb, 0.05) - 50);
  verifie('… et vers le haut', quantile(tl, 0.95) > quantile(tb, 0.95) + 50);
  verifie('support positif : jamais de valeur négative', tl[0] > 0, `→ ${tl[0]}`);
  // Élargir d'un facteur k double l'écart en log : c'est la définition retenue.
  const rapport = Math.log(quantile(tl, 0.95) / quantile(tl, 0.5))
                / Math.log(quantile(tb, 0.95) / quantile(tb, 0.5));
  proche('l\'écart logarithmique est bien multiplié par k', rapport, 2, 0.05);
}
{
  const base = evaluerModele(analyser('x = -2% à 5%'), { N: 40000 });
  const large = evaluerModele(analyser('x = -2% à 5%'), { N: 40000, elargissement: 3 });
  const tb = trier(base.variables.get('x')), tl = trier(large.variables.get('x'));
  proche('bornes signées : médiane inchangée', quantile(tl, 0.5), quantile(tb, 0.5), 1e-3);
  proche('bornes signées : écart multiplié par k',
    (quantile(tl, 0.95) - quantile(tl, 0.5)) / (quantile(tb, 0.95) - quantile(tb, 0.5)), 3, 0.05);
}
{
  const a = evaluerModele(analyser('p = bernoulli(0.2)'), { N: 40000 });
  const b = evaluerModele(analyser('p = bernoulli(0.2)'), { N: 40000, elargissement: 4 });
  verifie('un bernoulli n\'est pas élargi',
    Math.abs(moyenne(a.variables.get('p')) - moyenne(b.variables.get('p'))) < 1e-12);
}
{
  const a = evaluerModele(analyser('x = poisson(5)'), { N: 20000 });
  const b = evaluerModele(analyser('x = poisson(5)'), { N: 20000, elargissement: 3 });
  verifie('un poisson n\'est pas élargi non plus',
    a.variables.get('x').every((v, i) => v === b.variables.get('x')[i]));
}
{
  const a = evaluerModele(analyser('x = normale(10, 2)'), { N: 40000 });
  const b = evaluerModele(analyser('x = normale(10, 2)'), { N: 40000, elargissement: 2 });
  proche('une loi continue nommée est élargie',
    Math.sqrt(variance(b.variables.get('x'))) / Math.sqrt(variance(a.variables.get('x'))), 2, 0.05);
}
{
  // Élargir ne doit pas casser la corrélation : a - a reste nul.
  const r = evaluerModele(analyser('a = 1 à 10\nb = a - a'), { N: 5000, elargissement: 3 });
  verifie('les corrélations survivent à l\'élargissement',
    r.variables.get('b').every((v) => v === 0));
}

groupe('Analyse de robustesse');
{
  const r = analyserModele(`
sur = 100
option "A" = sur
option "B" = 0 à 1
`, { N: 20000 });
  const rob = analyserRobustesse(r);
  verifie('un verdict acquis résiste à tout', rob.applicable && rob.kBascule === null,
    `→ k=${rob && rob.kBascule}`);
}
{
  // Une option convexe finit par l'emporter si l'on élargit assez.
  const r = analyserModele(`
x = 1 à 3
option "Sûr"    = 25
option "Risqué" = x ^ 3
`, { N: 20000 });
  const rob = analyserRobustesse(r);
  verifie('un verdict fragile est détecté', rob.kBascule !== null, `→ k=${rob.kBascule}`);
  verifie('l\'échelle couvre tous les paliers', rob.paliers.length === 7);
  verifie('chaque palier nomme un gagnant',
    rob.paliers.every((p) => typeof p.recommande === 'string' && p.pGagne >= 0 && p.pGagne <= 1));
}
{
  const r = analyserModele('p = bernoulli(30%)\ny = si p alors 10 sinon 0', { N: 20000 });
  const rob = analyserRobustesse(r);
  verifie('sans fourchette à élargir, l\'analyse le dit',
    rob.applicable === false && /aucune fourchette/.test(rob.raison), `→ ${JSON.stringify(rob)}`);
}
{
  const r = analyserModele('seuil: 20\nx = 10 à 30\ny = x', { N: 20000 });
  const rob = analyserRobustesse(r);
  const d = rob.double;
  verifie('mode estimation : le palier 2× est fourni', !!d && d.k === 2);
  verifie('… et il élargit bien l\'intervalle',
    d.p05 < r.sortie.p05 && d.p95 > r.sortie.p95,
    `→ ${d.p05.toFixed(1)}–${d.p95.toFixed(1)} contre ${r.sortie.p05.toFixed(1)}–${r.sortie.p95.toFixed(1)}`);
  verifie('… en donnant la probabilité de seuil', typeof d.pAtteint === 'number');
}
{
  // Toute la bibliothèque doit produire une analyse de robustesse exploitable.
  const { MODELES: M2 } = await import('../public/js/modeles.js');
  for (const m of M2) {
    const r = analyserModele(m.source);
    const rob = analyserRobustesse(r);
    verifie(`« ${m.titre} » : robustesse calculable`,
      rob && rob.applicable && rob.paliers.length === 7);
  }
}


// --- Le contre-argument -----------------------------------------------------
//
// La question inverse : quel est le jeu d'hypothèses le plus proche du vôtre
// qui donnerait la conclusion contraire ? On vérifie la distance rapportée sur
// des cas dont la réponse se calcule à la main, puis — c'est le test qui
// compte — que le point rapporté renverse réellement la conclusion.
groupe('Le contre-argument');

// Réévalue un modèle en imposant à chaque hypothèse déplacée sa valeur du
// contre-argument, et rend la conclusion obtenue. C'est le seul contrôle qui
// vaille : annoncer un scénario qui ne renverse rien serait pire que rien.
async function conclusionAu(source, c) {
  const { analyser } = await import('../public/js/lang.js');
  const { evaluerModele } = await import('../public/js/evaluer.js');
  const r = analyserModele(source);
  const remplacements = {};
  for (const s of r.sources) {
    const d = c.deplacements.find((x) => x.nom === s.nom);
    remplacements[s.id] = new Float64Array(1).fill(d ? d.valeur : s.stats.p50);
  }
  const res = evaluerModele(analyser(source), { N: 1, remplacements });
  if (r.modeDecision) {
    let k = 0;
    for (let i = 1; i < res.options.length; i++) {
      if (res.options[i].valeurs[0] > res.options[k].valeurs[0]) k = i;
    }
    return res.options[k].nom;
  }
  return res.sortie[0];
}

{
  // Une seule hypothèse lognormale : β = ln(cible / médiane) / σ, à la main.
  const src = 'a = 90 à 110\noption "A" = a\noption "B" = 105\n';
  const r = analyserModele(src);
  const c = analyserContreArgument(r);
  const st = r.sources[0].stats;
  const sigma = Math.log(st.p95 / st.p05) / (2 * 1.6448536269514722);
  const attendu = Math.log(105 / st.p50) / sigma;
  proche('une hypothèse : β vaut la distance calculée à la main', c.beta, attendu, 0.04);
  // « B » vaut 105 fermes contre une moyenne de ~100 pour « A » : c'est donc
  // « B » qui est recommandée, et le contre-argument vise « A ».
  verifie('… et le contre-argument vise la branche perdante', c.cible === 'A');
  verifie('… en déplaçant la seule hypothèse du modèle',
    c.deplacements.length === 1 && c.deplacements[0].nom === 'a');
  verifie('… vers le haut, puisque c’est ce qui fait gagner « A »',
    c.deplacements[0].valeur > c.deplacements[0].mediane);
  verifie('… et le point rapporté renverse vraiment le verdict',
    await conclusionAu(src, c) === 'A');
}
{
  // Deux hypothèses normales de même échelle, frontière a + b = −σ.
  // Le point le plus proche est à mi-chemin : β = 1/√2 = 0,707.
  const sigma = 20 / (2 * 1.6448536269514722);
  const src = `a = -10 à 10\nb = -10 à 10\noption "A" = a + b\noption "B" = ${-sigma}\n`;
  const c = analyserContreArgument(analyserModele(src));
  proche('deux hypothèses de même poids : β = 1/√2', c.beta, Math.SQRT1_2, 0.05);
  verifie('… et l’écart se répartit à parts égales',
    Math.abs(c.deplacements[0].part - c.deplacements[1].part) < 0.05,
    `→ ${c.deplacements.map((d) => d.part.toFixed(2)).join(' / ')}`);
}
{
  // Trois hypothèses au lieu de deux : le même déplacement total se répartit
  // sur trois axes, donc chacun bouge moins et β tombe à 1/√3.
  const sigma = 20 / (2 * 1.6448536269514722);
  const src = `a = -10 à 10\nb = -10 à 10\nc = -10 à 10\noption "A" = a + b + c\noption "B" = ${-sigma}\n`;
  const c = analyserContreArgument(analyserModele(src));
  proche('trois hypothèses : β = 1/√3', c.beta, 1 / Math.sqrt(3), 0.05);
}
{
  // Une hypothèse qui ne touche pas la décision ne doit pas apparaître dans le
  // contre-argument : la déplacer ne rapproche d'aucune frontière.
  const src = 'a = 90 à 110\nbruit = 1 à 1000\noption "A" = a + 0 * bruit\noption "B" = 105\n';
  const c = analyserContreArgument(analyserModele(src));
  verifie('une hypothèse sans influence ne figure pas dans le contre-argument',
    !c.deplacements.some((d) => d.nom === 'bruit'),
    `→ ${c.deplacements.map((d) => d.nom).join(', ')}`);
}
{
  // Verdict hors d'atteinte : deux branches que rien de plausible ne rapproche.
  const c = analyserContreArgument(analyserModele(
    'a = 90 à 110\noption "A" = a\noption "B" = 5\n'));
  verifie('un écart énorme : aucun contre-argument plausible',
    c.applicable && c.atteint === false && c.beta === null,
    `→ ${JSON.stringify({ atteint: c.atteint, beta: c.beta })}`);
}
{
  // Mode estimation : la conclusion est « l'objectif est tenu / manqué », et le
  // contre-argument dit ce qu'il faudrait pour basculer de l'autre côté.
  const src = 'seuil: <= 90\na = 40 à 60\nb = 20 à 30\nduree = a + b\n';
  const r = analyserModele(src);
  const c = analyserContreArgument(r);
  verifie('mode estimation : la médiane tient l’objectif', c.tenu === true);
  verifie('… donc le contre-argument cherche à le manquer', c.cible === 'manquer');
  verifie('… et il fait bien dépasser le seuil',
    await conclusionAu(src, c) > 90,
    `→ ${(await conclusionAu(src, c)).toFixed(1)}`);
}
{
  // Objectif déjà manqué à la médiane : la question utile s'inverse toute seule.
  const src = 'seuil: <= 50\na = 40 à 60\nb = 20 à 30\nduree = a + b\n';
  const c = analyserContreArgument(analyserModele(src));
  verifie('objectif manqué à la médiane : on cherche à l’atteindre',
    c.tenu === false && c.cible === 'atteindre');
  verifie('… en descendant les durées',
    c.deplacements.every((d) => d.valeur < d.mediane),
    `→ ${c.deplacements.map((d) => `${d.mediane.toFixed(1)}→${d.valeur.toFixed(1)}`).join(' ')}`);
}
{
  // Sans frontière — ni deux branches, ni objectif — il n'y a rien à renverser.
  const c = analyserContreArgument(analyserModele('a = 1 à 10\ny = a * 2'));
  verifie('sans branche ni seuil, pas de contre-argument',
    c.applicable === false && c.raison === 'sans-frontiere');
}
{
  // Un événement tout ou rien n'a pas d'unité d'écart : il est épinglé, et le
  // scénario doit le dire au lieu de supposer en douce qu'il n'arrive pas.
  const c = analyserContreArgument(analyserModele(
    'seuil: <= 90\na = 40 à 60\npepin = bernoulli(20%)\nduree = a + (si pepin alors 30 sinon 0)'));
  verifie('les événements tout ou rien sont signalés comme épinglés',
    c.figees.length === 1 && c.figees[0].nom === 'pepin',
    `→ ${JSON.stringify(c.figees)}`);
}
{
  // Toute la bibliothèque : le contre-argument doit être calculable, et le
  // scénario qu'il décrit doit réellement renverser la conclusion. C'est le
  // filet qui rattrapera une future régression du moteur.
  const { MODELES: M3 } = await import('../public/js/modeles.js');
  for (const m of M3) {
    const r = analyserModele(m.source);
    const c = analyserContreArgument(r);
    if (!c.applicable) {
      verifie(`« ${m.titre} » : sans frontière, dit sans planter`,
        c.raison === 'sans-frontiere' || c.raison === 'sans-fourchette');
      continue;
    }
    if (!c.atteint || c.medianeContredit) {
      verifie(`« ${m.titre} » : contre-argument hors d'atteinte, dit proprement`, true);
      continue;
    }
    if (c.surLaFrontiere) {
      // β ≈ 0 : les valeurs médianes tombent sur la frontière. Rien à déplacer,
      // et c'est justement ce qu'il faut vérifier.
      const y = await conclusionAu(m.source, c);
      verifie(`« ${m.titre} » : les médianes tombent bien sur la frontière`,
        Math.abs(y - r.seuil) < Math.abs(r.seuil) * 0.01, `→ ${y} contre ${r.seuil}`);
      continue;
    }
    const avant = r.modeDecision
      ? r.options.liste[r.options.recommande].nom : null;
    const apres = await conclusionAu(m.source, c);
    // « seuil: 12 » se vise par le haut, « seuil: <= 90 » par le bas : le sens
    // décide de quel côté « renverser » veut dire.
    const tientLObjectif = r.seuilSens === 'max' ? apres <= r.seuil : apres >= r.seuil;
    verifie(`« ${m.titre} » : le contre-argument renverse vraiment la conclusion`,
      r.modeDecision
        ? (apres === c.cible && apres !== avant)
        : (c.tenu ? !tientLObjectif : tientLObjectif),
      `→ ${apres}`);
  }
}

// --- Aller savoir avant de décider -----------------------------------------
//
// La valeur de l'information était affichée, jamais comparée à ce que coûte
// d'aller la chercher. « savoir X = 300 € » referme l'écart, et la réponse
// n'est pas un nombre mais une règle : ce qu'on fera une fois qu'on saura.
groupe('Aller savoir, ou décider maintenant');
{
  const SOLAIRE = `unité: €
production = 900 à 1350
option "Installer"     = production * 13,2 - 14500
option "Ne rien faire" = 0
savoir production = 250 €`;

  // 1. La lecture de la ligne.
  {
    const a = analyser('x = 1 à 2\nsavoir x = 300');
    verifie('« savoir x = 300 » est lu', a.attentes.length === 1 && a.attentes[0].nom === 'x');
    const b = analyser('devis = 1 à 2\nattendre le devis = 300');
    verifie('« attendre le devis » : l’article se laisse écrire',
      b.attentes.length === 1 && b.attentes[0].nom === 'devis', JSON.stringify(b.attentes));
    const c = analyser('x = 1 à 2\nsavoir x');
    verifie('« savoir x » sans coût est accepté', c.attentes.length === 1 && c.attentes[0].expr === null);
    // Le mot n'est pas un mot-clé du lexer : une variable peut encore s'appeler
    // « savoir », ce que le motif « savoir <nom> = » ne peut pas confondre.
    const d = evaluerModele(analyser('savoir = 3\ny = savoir * 2'));
    proche('« savoir = 3 » reste une variable', d.variables.get('y'), 6, 0);
    verifie('… et ne crée aucune attente', analyser('savoir = 3\ny = savoir * 2').attentes.length === 0);
    let leve = false;
    try { analyser('x = 1 à 2\nsavoir x = 1\nsavoir x = 2'); } catch (e) { leve = e instanceof ErreurModele; }
    verifie('deux lignes sur la même hypothèse : refusé', leve);
  }

  // 2. Le prix, le coût, le net.
  const r = analyserModele(SOLAIRE, { N: 60000 });
  const a = r.attentes[0];
  proche('savoir « production » vaut 639 €', a.gain, 639, 25);
  proche('… pour 250 € déclarés', a.cout, 250, 0);
  proche('… soit 389 € nets', a.net, 389, 25);
  verifie('… et ça se paie', a.net > 0);
  proche('le prix affiché est bien l’EVPPI de cette hypothèse',
    a.gain, r.sources.find((x) => x.nom === 'production').valeurInfo, 1e-9);

  // 3. La règle : deux tranches, et la frontière annoncée.
  verifie('la règle a deux tranches', a.segments.length === 2, `→ ${a.segments.length}`);
  const frontiere = (a.segments[0].haut + a.segments[1].bas) / 2;
  proche('la frontière tombe vers 1 103 kWh/kWc', frontiere, 1103, 25);
  verifie('… « Ne rien faire » en dessous',
    r.options.liste[a.segments[0].option].nom === 'Ne rien faire');
  verifie('… « Installer » au-dessus',
    r.options.liste[a.segments[1].option].nom === 'Installer');
  proche('… ce qui arrive une fois sur deux', a.segments[1].part, 0.5, 0.06);

  // 4. Le test qui compte : on rejoue le modèle de part et d'autre de la
  //    frontière annoncée, les autres hypothèses laissées libres, et on vérifie
  //    que la branche de meilleure espérance est bien celle qu'on a promise.
  //    Une règle plausible et fausse serait invisible à l'œil.
  {
    const ast = analyser(SOLAIRE);
    const gagnantEn = (x) => {
      const e = evaluerModele(ast, { N: 20000, remplacements: { [a.id]: x } });
      let k = 0;
      for (let i = 1; i < e.options.length; i++) {
        if (moyenne(e.options[i].valeurs) > moyenne(e.options[k].valeurs)) k = i;
      }
      return e.options[k].nom;
    };
    verifie('sous la frontière, la règle dit vrai',
      gagnantEn(frontiere * 0.92) === r.options.liste[a.segments[0].option].nom);
    verifie('au-dessus, la règle dit vrai aussi',
      gagnantEn(frontiere * 1.08) === r.options.liste[a.segments[1].option].nom);
  }

  // 5. Une information parfaite qui ne vaut rien : le cas qui justifie tout.
  {
    const z = analyserModele(SOLAIRE.replace('14500', '9000'), { N: 60000 });
    const b = z.attentes[0];
    proche('quand le choix est acquis, l’information vaut 0', b.gain, 0, 1);
    proche('… et son net vaut le coût, en négatif', b.net, -250, 1);
    verifie('… une seule tranche : on ferait la même chose', b.segments.length === 1);
    verifie('… et c’est « Installer »',
      z.options.liste[b.segments[0].option].nom === 'Installer');
  }

  // 6. Un prix nul et une règle à deux tranches ne peuvent pas coexister :
  //    les deux se lisent sur le même découpage.
  {
    for (const m of MODELES) {
      const x = analyserModele(m.source);
      if (!x.modeDecision) continue;
      for (const at of x.attentes) {
        if (at.probleme) continue;
        verifie(`« ${m.titre} » : prix et règle sont cohérents`,
          (at.gain > 1e-9) === (at.segments.length > 1),
          `→ ${at.gain} / ${at.segments.length}`);
      }
    }
  }

  // 7. Ce qu'on ne peut pas aller savoir.
  {
    const x = analyserModele('a = 1 à 2\nb = 3\noption "A" = a\noption "B" = 1,4\nsavoir b = 10\nsavoir zzz = 10');
    const par = Object.fromEntries(x.attentes.map((t) => [t.nom, t.probleme]));
    verifie('une valeur certaine : rien à apprendre', par.b === 'certaine', JSON.stringify(par));
    verifie('un nom inconnu : dit comme tel', par.zzz === 'introuvable', JSON.stringify(par));
  }

  // 8. Sans deux branches, l'information n'a pas de prix — et on le dit.
  {
    const x = analyserModele('a = 1 à 2\ny = a * 3\nsavoir a = 10');
    verifie('en mode estimation, « savoir » est signalé',
      x.attentes.length === 0 && x.avertissements.some((n) => /deux\s+branches/.test(n.texte)),
      JSON.stringify(x.avertissements));
  }

  // 9. Une ligne de coût peut tirer au sort pour son propre compte. Ses tirages
  //    ne sont pas des hypothèses du modèle : ni sensibilité, ni valeur
  //    d'information, et surtout aucun décalage des identifiants de source —
  //    les seuils de bascule en dépendent.
  {
    const sans = analyserModele('a = 1 à 2\noption "A" = a\noption "B" = 1,4');
    const avec = analyserModele('a = 1 à 2\noption "A" = a\noption "B" = 1,4\nsavoir a = 0,1 à 0,3');
    verifie('une fourchette dans le coût ne devient pas une hypothèse',
      avec.sources.length === sans.sources.length, `→ ${avec.sources.map((x) => x.nom)}`);
    proche('… et ne déplace pas la valeur de l’information',
      avec.sources[0].valeurInfo, sans.sources[0].valeurInfo, 1e-9);
    proche('… le coût est la moyenne de la fourchette', avec.attentes[0].cout, 0.173, 0.02);
  }

  // 10. Une hypothèse tout ou rien se raconte autrement : il n'y a pas de
  //     seuil entre pile et face, mais il y a une règle.
  {
    const x = analyserModele(
      'gagne = bernoulli(30%)\noption "Parier" = si gagne alors 100 sinon -40\n'
      + 'option "S’abstenir" = 0\nsavoir gagne = 5', { N: 60000 });
    const b = x.attentes[0];
    verifie('un tirage tout ou rien reste une chose qu’on peut aller savoir', b.binaire);
    verifie('… et sa règle a deux tranches', b.segments.length === 2, `→ ${b.segments.length}`);
    verifie('… « S’abstenir » quand il ne se produit pas',
      x.options.liste[b.segments[0].option].nom === 'S’abstenir');
    verifie('… « Parier » quand il se produit',
      x.options.liste[b.segments[1].option].nom === 'Parier');
    proche('… et savoir vaut 28 € pour 5 € dépensés', b.gain, 28, 3);
  }
}

// --- Le modèle solaire, et les chiffres que sa page cite --------------------
groupe('Installer des panneaux solaires');
{
  const r = analyserModele(MODELES.find((m) => m.cle === 'solaire').source);
  verifie('le modèle porte une ligne « savoir »', r.attentes.length === 1);
  const a = r.attentes[0];
  verifie('… sur « production »', a.nom === 'production');
  proche('la page cite 479 € à gagner', a.gain, 479, 30);
  proche('… pour 250 € d’étude', a.cout, 250, 0);
  const frontiere = (a.segments[0].haut + a.segments[1].bas) / 2;
  proche('… et une frontière à 1 158 kWh/kWc/an', frontiere, 1158, 30);
  verifie('… en dessous de laquelle il ne faut pas installer',
    r.options.liste[a.segments[0].option].nom === 'Ne rien faire');
  // Le texte de fond oppose les deux : le seuil de bascule fige les autres
  // hypothèses à leur médiane, la règle moyenne sur elles. L'écart est réel.
  const seuil = r.sources.find((x) => x.nom === 'production').bascules[0];
  proche('… quand le seuil de bascule, lui, dit 1 179', seuil.valeur, 1179, 30);
  verifie('… les deux ne coïncident pas, et le texte le dit',
    Math.abs(seuil.valeur - frontiere) > 5, `→ ${seuil.valeur} contre ${frontiere}`);
  // C'est l'hypothèse qu'on ne peut pas acheter qui pèse le plus, et le texte
  // de fond est construit là-dessus.
  verifie('c’est « derive » qui vaut le plus d’être levée, et elle ne s’achète pas',
    r.sources[0].nom === 'derive', `→ ${r.sources[0].nom}`);
  verifie('… « production » venant juste derrière', r.sources[1].nom === 'production',
    `→ ${r.sources[1].nom}`);
}

// --- Le lexique des hypothèses ----------------------------------------------
//
// Le premier visiteur extérieur du site (session 14) l'a trouvé « peu clair ».
// Il lisait « L'hypothèse qui pèse le plus est reparations. Le verdict passe à
// "Changer" au-dessus de 1 109 » : un identifiant de code et un nombre sans
// unité. `lexique.js` donne à chaque hypothèse de la bibliothèque son mot
// français, son unité et l'endroit où aller la chercher.
groupe('Le lexique des hypothèses');
{
  const { LEXIQUE, hypothese } = await import('../public/js/lexique.js');

  // La garantie qui compte : aucune hypothèse affichée ne peut rester un
  // identifiant nu. Si une ligne est ajoutée à un modèle sans son entrée ici,
  // le site réaffiche du code et on revient au point de départ.
  let sansEntree = [], orphelines = [];
  for (const m of MODELES) {
    const r = analyserModele(m.source);
    const noms = new Set(r.sources.map((x) => x.nom));
    const cles = new Set(Object.keys(LEXIQUE[m.cle] || {}));
    for (const n of noms) if (!cles.has(n)) sansEntree.push(`${m.cle}.${n}`);
    for (const c of cles) if (!noms.has(c)) orphelines.push(`${m.cle}.${c}`);
  }
  verifie('toute hypothèse de la bibliothèque a son entrée',
    sansEntree.length === 0, `→ ${sansEntree.join(', ')}`);
  verifie('… et aucune entrée ne désigne une hypothèse disparue',
    orphelines.length === 0, `→ ${orphelines.join(', ')}`);

  // Une entrée mal formée passerait inaperçue à l'écran : « undefined » dans
  // une phrase, ou une unité collée à un nombre qui n'en a pas.
  let malformees = [];
  for (const [cle, entrees] of Object.entries(LEXIQUE)) {
    for (const [nom, e] of Object.entries(entrees)) {
      const [quoi, unite, ou] = e;
      if (e.length !== 3) malformees.push(`${cle}.${nom} : ${e.length} champs`);
      else if (typeof quoi !== 'string' || quoi.length < 3) malformees.push(`${cle}.${nom} : quoi`);
      else if (typeof unite !== 'string') malformees.push(`${cle}.${nom} : unité`);
      else if (ou !== null && (typeof ou !== 'string' || ou.length < 10)) malformees.push(`${cle}.${nom} : où`);
      else if (/^[A-Z]/.test(quoi)) malformees.push(`${cle}.${nom} : « quoi » commence par une majuscule`);
      else if (/\.$/.test(quoi)) malformees.push(`${cle}.${nom} : « quoi » finit par un point`);
    }
  }
  verifie('les entrées sont bien formées', malformees.length === 0, `→ ${malformees.join(' | ')}`);

  // Le site ne connaît aucune donnée, et ce fichier ne doit pas devenir la
  // porte par laquelle il prétendrait en avoir : pas de chiffre dans un « où ».
  const chiffres = [];
  for (const [cle, entrees] of Object.entries(LEXIQUE)) {
    for (const [nom, e] of Object.entries(entrees)) {
      if (e[2] && /\d+\s*(€|%|kWh|km|kg)/.test(e[2])) chiffres.push(`${cle}.${nom}`);
    }
  }
  verifie('aucun barème chiffré ne s’est glissé dans le lexique',
    chiffres.length === 0, `→ ${chiffres.join(', ')}`);

  // « où » vaut null quand il n'existe pas de source honnête — le site le dit
  // alors, au lieu de se taire. C'est une réponse, pas une lacune, mais elle ne
  // doit pas servir de facilité : la liste est close et justifiée ici.
  //
  //   prix_energie, derive  le prix futur de l'énergie. Personne ne le vend.
  //   gros_pepin, rechute,  des tirages tout ou rien : ils arrivent ou non,
  //   remporte              et rien ne les lève avant qu'on ait à décider.
  //   retard_pepin          l'ampleur d'un incident qui n'a pas encore eu lieu.
  const SANS_SOURCE = new Set([
    'combles.prix_energie', 'solaire.derive',
    'projet.gros_pepin', 'projet.retard_pepin',
    'reparer.rechute', 'offres.remporte',
  ]);
  const nuls = [];
  for (const [cle, entrees] of Object.entries(LEXIQUE)) {
    for (const [nom, e] of Object.entries(entrees)) if (e[2] === null) nuls.push(`${cle}.${nom}`);
  }
  verifie('les hypothèses sans source sont exactement celles qu’on a justifiées',
    nuls.length === SANS_SOURCE.size && nuls.every((n) => SANS_SOURCE.has(n)),
    `→ ${nuls.filter((n) => !SANS_SOURCE.has(n)).join(', ') || 'il en manque'}`);

  // L'hypothèse que le verdict désigne doit toujours produire une phrase — soit
  // une adresse, soit « nulle part, et c'est une réponse ». Ce qui n'est jamais
  // acceptable, c'est le silence : c'est lui que le premier visiteur a lu.
  const muettes = [];
  for (const m of MODELES) {
    const r = analyserModele(m.source);
    if (!r.modeDecision || r.options.acquise) continue;
    const decisif = r.sources.filter((x) => x.valeurInfo >= Math.max(r.options.evpi * 0.01, 1e-9));
    const designee = decisif[0] && decisif[0].binaire ? decisif.find((x) => !x.binaire) : decisif[0];
    if (!designee) continue;
    if (!hypothese(m.cle, designee.nom)) muettes.push(`${m.cle}.${designee.nom}`);
  }
  verifie('l’hypothèse désignée par le verdict a toujours quelque chose à dire',
    muettes.length === 0, `→ ${muettes.join(', ')}`);

  // Le modèle vierge est un gabarit : ses trois lignes méritent des sources
  // honnêtes elles aussi, plutôt qu'un haussement d'épaules.
  verifie('« Partir de zéro » dit aussi où chercher',
    Object.values(LEXIQUE.vierge).every((e) => typeof e[2] === 'string'));
  verifie('un modèle inconnu ne renvoie rien', hypothese('pas-un-modele', 'x') === null);
  verifie('une hypothèse inconnue non plus', hypothese('voiture', 'pas_une_hypothese') === null);
}

// --- Les chiffres cités par la page d'accueil -------------------------------
//
// L'ouverture de l'accueil est un exemple travaillé, avec ses chiffres. Ce sont
// ceux du modèle servi juste en dessous : s'ils divergent, c'est la page qu'on
// corrige, pas le test qu'on assouplit.
groupe('Les chiffres cités par l’ouverture de l’accueil');
{
  const { MODELE_PAR_DEFAUT } = await import('../public/js/modeles.js');
  verifie('le modèle d’accueil est « garder ou changer de voiture »',
    MODELE_PAR_DEFAUT === 'voiture', `→ ${MODELE_PAR_DEFAUT}`);

  const r = analyserModele(MODELES.find((m) => m.cle === MODELE_PAR_DEFAUT).source);
  verifie('… et son verdict nomme une branche, il ne dit pas « à égalité »',
    r.options.liste[r.options.recommande].pGagne >= 0.62 && !r.options.desaccord,
    `→ ${(r.options.liste[r.options.recommande].pGagne * 100).toFixed(0)} %`);
  verifie('… « Garder l’actuelle » l’emporte',
    r.options.liste[r.options.recommande].nom === 'Garder l’actuelle');

  const rep = r.sources.find((x) => x.nom === 'reparations');
  verifie('… et c’est « reparations » qui décide', r.sources[0].nom === 'reparations',
    `→ ${r.sources[0].nom}`);
  proche('l’accueil cite un seuil à 1 109 €/an', rep.bascules[0].valeur, 1109, 25);
  verifie('… qui bascule vers « Changer »', rep.bascules[0].vers === 'Changer');
  proche('… ce qui arrive 3 fois sur 10', rep.bascules[0].proba, 0.3, 0.05);
  proche('l’accueil cite 631 € à gagner en le sachant', rep.valeurInfo, 631, 30);
  proche('… sur une fourchette écrite « 400 à 1 800 »', rep.stats.p05, 400, 25);
  proche('… et fermée à 1 800', rep.stats.p95, 1800, 60);
}

// --- Le cas raconté ----------------------------------------------------------
//
// « Je ne trouve nulle part de cas d'usage raconté du début à la fin. » La page
// /un-cas suit une décision du devis du garage au tiroir à factures. Chacun de
// ses chiffres sort du moteur, et chacun est épinglé ici : si le modèle bouge,
// c'est la page qu'on corrige, pas le test qu'on assouplit. Le dispositif a
// déjà attrapé deux fautes de fond sur /la-methode.
groupe('Les chiffres du cas raconté');
{
  const source = MODELES.find((m) => m.cle === 'voiture').source;
  const r = analyserModele(source);
  const rec = r.options.liste[r.options.recommande];

  verifie('le cas part de « Garder l’actuelle »', rec.nom === 'Garder l’actuelle');
  proche('… qui l’emporte 67 % du temps', rec.pGagne, 0.67, 0.02);
  proche('… soit 3 fois sur 10 où le conseil est mauvais', r.options.pari.pPerte, 0.325, 0.02);
  proche('le pari : 2 776 € de mieux quand on a raison', r.options.pari.gainMedian, 2776, 60);
  proche('… 1 920 € de moins quand on a tort', r.options.pari.perteMediane, 1920, 60);
  proche('… et jusqu’à 7 650 € dans le pire vingtième', r.options.pari.pertePire, 7650, 200);

  const rep = r.sources[0];
  verifie('c’est « reparations » qui décide', rep.nom === 'reparations', `→ ${rep.nom}`);
  proche('… et porte 55 % de l’écart entre les branches', rep.part, 0.55, 0.04);
  proche('… avec un seuil à 1 109 €/an', rep.bascules[0].valeur, 1109, 25);
  proche('… franchi 3 fois sur 10', rep.bascules[0].proba, 0.28, 0.04);
  proche('… et 631 € à gagner en le sachant', rep.valeurInfo, 631, 30);
  proche('tout savoir vaudrait 857 €', r.options.evpi, 857, 40);

  // La page dit que les autres hypothèses ne valent pas le déplacement. C'est
  // une affirmation chiffrée, donc elle se vérifie.
  const vi = (nom) => r.sources.find((x) => x.nom === nom).valeurInfo;
  proche('… la décote ne vaut que 86 €', vi('decote'), 86, 25);
  proche('… le prix de l’occasion 43 €', vi('prix_nouvelle'), 43, 20);
  proche('… la consommation 29 €', vi('conso_actuelle'), 29, 15);
  verifie('… toutes très loin derrière « reparations »',
    vi('decote') < rep.valeurInfo / 4, `→ ${vi('decote').toFixed(0)} contre ${rep.valeurInfo.toFixed(0)}`);

  // Le tiroir à factures : la fourchette devinée devient une fourchette datée.
  const apres = (plage) => analyserModele(
    source.replace(/reparations = 400 à 1800.*/, `reparations = ${plage}   # relevé sur trois ans`));

  const bon = apres('500 à 900');
  const recBon = bon.options.liste[bon.options.recommande];
  verifie('après les factures, « Garder » tient', recBon.nom === 'Garder l’actuelle');
  proche('… à 89 % au lieu de 67 %', recBon.pGagne, 0.89, 0.03);
  proche('… 3 002 € de mieux quand on a raison', bon.options.pari.gainMedian, 3002, 90);
  proche('… 783 € de moins quand on a tort', bon.options.pari.perteMediane, 783, 60);
  proche('… et la valeur de l’information tombe à 110 €', bon.options.evpi, 110, 45);
  verifie('… donc plus rien à aller chercher', bon.options.evpi < r.options.evpi / 4,
    `→ ${bon.options.evpi.toFixed(0)} contre ${r.options.evpi.toFixed(0)}`);

  // L'autre issue possible, que la page raconte aussi : sans elle, ce serait
  // une démonstration flatteuse.
  const mauvais = apres('900 à 1600');
  const recMauvais = mauvais.options.liste[mauvais.options.recommande];
  verifie('l’autre issue bascule vers « Changer »', recMauvais.nom === 'Changer', `→ ${recMauvais.nom}`);
  proche('… mais à 58 %, donc « à égalité »', recMauvais.pGagne, 0.58, 0.03);
  verifie('… ce que le site refuse de trancher', recMauvais.pGagne < 0.62,
    `→ ${(recMauvais.pGagne * 100).toFixed(0)} %`);
  proche('… à 466 € près sur six ans', mauvais.options.ecart.p50, 466, 130);
}

// --- Ce que le site sait d'un modèle qu'il n'a pas écrit ----------------------
//
// La session 14 avait posé en principe que « le site ne devine pas ce que veut
// dire un nom qu'il n'a pas écrit », et c'était juste. Mais il n'y a rien à
// deviner : « reparations = 400 à 1800 € # par an » porte déjà le mot et
// l'unité. Le site les jetait tous les deux, et devenait donc muet au moment
// précis où quelqu'un se sert de l'outil pour lui-même — quatrième retour du
// lecteur extérieur : « quand j'écris mon propre modèle, je n'ai plus que des
// identifiants sans unité ».
groupe('La glose et l’unité écrites dans le modèle');
{
  const r = analyserModele(`unité: €
loyer = 900 à 1150 €          # ce que je paie chaque mois
carburant = 1,60 à 2,20 €/L   # le prix à la pompe
duree = 3 à 8 ans             # combien de temps je reste
taux = 2 % à 4 %              # le crédit
# --- une ligne de titre, qui ne décrit aucune hypothèse ------------------
x = loyer * duree + carburant * 1000 + taux`);
  const par = Object.fromEntries(r.sources.map((s) => [s.nom, s]));

  verifie('le commentaire de fin de ligne devient la glose',
    par.loyer.quoi === 'ce que je paie chaque mois', `→ ${par.loyer.quoi}`);
  verifie('le symbole collé au nombre devient l’unité', par.loyer.unite === '€', `→ ${par.loyer.unite}`);
  verifie('… une unité composée aussi', par.carburant.unite === '€/L', `→ ${par.carburant.unite}`);
  verifie('… et le mot posé après le nombre', par.duree.unite === 'ans', `→ ${par.duree.unite}`);
  verifie('un pourcentage reste un pourcentage', par.taux.pourcent === true);
  verifie('… et garde sa glose', par.taux.quoi === 'le crédit', `→ ${par.taux.quoi}`);

  // Un commentaire seul sur sa ligne est un titre de section : il ne doit
  // décrire aucune hypothèse, sinon « --- Garder l'actuelle --- » deviendrait
  // la définition de la ligne suivante.
  verifie('une ligne de commentaire seule ne glose rien',
    !Object.values(par).some((s) => (s.quoi || '').includes('une ligne de titre')));

  // Le lexique reste prioritaire là où il existe : il est écrit à la main,
  // relu, et dit en plus où trouver le chiffre.
  const v = analyserModele(MODELES.find((m) => m.cle === 'voiture').source);
  const rep = v.sources.find((s) => s.nom === 'reparations');
  verifie('sur un modèle de la bibliothèque, la glose du modèle existe aussi',
    rep.quoi === 'par an, et ça monte avec l’âge', `→ ${rep.quoi}`);
  const { hypothese } = await import('../public/js/lexique.js');
  verifie('… mais le lexique dit mieux, et c’est lui qui s’affiche',
    hypothese('voiture', 'reparations').quoi.length > 0);
}


// --- Le modèle comme formulaire ---------------------------------------------
//
// Cinquième passage du lecteur extérieur : « pour me servir d'un des douze
// modèles, je dois éditer du texte ». Le formulaire lit le texte et le
// réécrit ; ces tests tiennent les deux sens, et surtout **ce que la réécriture
// n'a pas le droit de toucher** : le commentaire en français, le symbole
// d'unité, l'échelle et l'alignement. C'est tout ce que le site a mis quinze
// sessions à savoir lire.
groupe('Le modèle comme formulaire');
{
  const { reglages, intertitres, afficher, lireChamp, reecrire } =
    await import('../public/js/reglages.js');

  // Chaque modèle de la bibliothèque doit se régler sans ouvrir le texte,
  // sinon le formulaire est un demi-service et le lecteur avait raison.
  for (const m of MODELES) {
    const r = reglages(m.source);
    if (m.cle === 'vierge') {
      verifie('la page blanche a ses trois champs', r.length === 3, `→ ${r.length}`);
      continue;
    }
    verifie(`${m.cle} : au moins six hypothèses réglables`, r.length >= 6, `→ ${r.length}`);
  }

  // Aucune formule ne doit apparaître comme une hypothèse : « emprunt = prix -
  // apport » n'est pas un chiffre qu'on règle, c'est un calcul.
  const logement = MODELES.find((m) => m.cle === 'logement');
  const noms = reglages(logement.source).map((e) => e.nom);
  verifie('aucune formule dans le formulaire',
    !noms.includes('emprunt') && !noms.includes('mensualite') && !noms.includes('i'),
    `→ ${noms.join(', ')}`);
  verifie('… et les hypothèses, elles, y sont toutes',
    ['prix', 'loyer', 'revalorisation', 'taxe_fonciere', 'placement'].every((n) => noms.includes(n)),
    `→ ${noms.join(', ')}`);

  // Une ligne « option », « savoir » ou « unité: » n'est pas une hypothèse.
  const solaire = MODELES.find((m) => m.cle === 'solaire');
  const nomsSolaire = reglages(solaire.source).map((e) => e.nom);
  verifie('ni option, ni savoir, ni unité dans le formulaire',
    !nomsSolaire.some((n) => ['option', 'savoir', 'attendre', 'unité'].includes(n)),
    `→ ${nomsSolaire.join(', ')}`);

  // Ce que le champ montre : la valeur dans l'échelle où elle est écrite.
  const par = Object.fromEntries(reglages(logement.source).map((e) => [e.nom, e]));
  proche('« 250k » se règle en milliers', par.prix.bornes[0].affiche, 250, 0);
  verifie('… et son étiquette porte l’échelle', par.prix.echelle === 'k', `→ ${par.prix.echelle}`);
  proche('« 3,2% » se règle en points', par.taux_credit.bornes[0].affiche, 3.2, 1e-9);
  verifie('… et son unité est le pourcentage', par.taux_credit.unite === '%');
  proche('une borne négative reste négative', par.revalorisation.bornes[0].affiche, -1, 1e-9);
  verifie('une fourchette a deux bornes, une valeur ferme une seule',
    par.loyer.bornes.length === 2 && par.horizon.bornes.length === 1);

  // Le symbole d'unité écrit dans le modèle sert d'étiquette là où le lexique
  // se tait — c'est ce que la session 17 a rendu lisible.
  const uSrc = 'reparations = 400 à 1800 €   # par an\nx = reparations';
  verifie('l’unité écrite au modèle étiquette le champ',
    reglages(uSrc)[0].unite === '€', `→ ${JSON.stringify(reglages(uSrc)[0].unite)}`);

  // --- La réécriture --------------------------------------------------------
  const relire = (src, nom) => reglages(src).find((e) => e.nom === nom);

  let src = logement.source;
  src = reecrire(src, relire(src, 'loyer').bornes[1], 1400);
  const ligneLoyer = src.split('\n').find((l) => l.startsWith('loyer'));
  verifie('la borne change…', /900 à 1400/.test(ligneLoyer), `→ ${ligneLoyer}`);
  verifie('… le commentaire en français reste',
    /# ce que vous paieriez à la place$/.test(ligneLoyer), `→ ${ligneLoyer}`);
  verifie('… et l’alignement des colonnes aussi',
    /1400 {13}#/.test(ligneLoyer), `→ ${JSON.stringify(ligneLoyer)}`);

  src = reecrire(src, relire(src, 'prix').bornes[0], 310);
  verifie('l’échelle « k » survit à la réécriture',
    src.includes('prix = 310k'), `→ ${src.split('\n').find((l) => l.startsWith('prix ='))}`);

  src = reecrire(src, relire(src, 'travaux').bornes[1], 2.5);
  verifie('le « % » survit à la réécriture',
    /travaux = 0,3% à 2,5%/.test(src), `→ ${src.split('\n').find((l) => l.startsWith('travaux'))}`);

  src = reecrire(src, relire(src, 'revalorisation').bornes[0], 2);
  verifie('un signe « - » s’efface quand la borne devient positive',
    /revalorisation = 2% à 4%/.test(src), `→ ${src.split('\n').find((l) => l.startsWith('revalorisation'))}`);
  src = reecrire(src, relire(src, 'revalorisation').bornes[0], -3);
  verifie('… et se réécrit quand elle redevient négative',
    /revalorisation = -3% à 4%/.test(src), `→ ${src.split('\n').find((l) => l.startsWith('revalorisation'))}`);

  // Le tout doit rester un modèle que le site sait calculer : c'est la seule
  // garantie qui compte, et elle est bon marché.
  const apres = analyserModele(src);
  verifie('le modèle réécrit se calcule encore', !apres.probleme && apres.modeDecision);
  verifie('… sans avertissement nouveau', apres.avertissements.length === 0,
    `→ ${apres.avertissements.map((a) => a.texte || a.message || '').join(' | ')}`);

  // Les douze modèles, borne par borne. Deux exigences, et c'est le test qui
  // attrape un décalage d'un caractère, une échelle perdue, un pourcentage
  // effacé : la valeur relue est bien celle qu'on a écrite, et **rien d'autre
  // que les chiffres n'a bougé sur la ligne** — pas le commentaire, pas le
  // symbole, pas l'espace qui aligne les colonnes.
  let bornes = 0;
  const abimes = [];
  const squelette = (l) => l.replace(/[0-9]+/g, '#');
  for (const m of MODELES) {
    for (const e of reglages(m.source)) {
      for (let i = 0; i < e.bornes.length; i++) {
        bornes++;
        const v = e.bornes[i].affiche;
        // Une valeur voisine, de même signe : « -1 » devient « -2 », pas « 0 ».
        const cible = v + Math.sign(v || 1);
        const refait = reecrire(m.source,
          reglages(m.source).find((x) => x.nom === e.nom).bornes[i], cible);
        const relu = reglages(refait).find((x) => x.nom === e.nom);
        const avant = m.source.split('\n')[e.ligne - 1];
        const apresLigne = refait.split('\n')[e.ligne - 1];
        if (!relu || Math.abs(relu.bornes[i].affiche - cible) > 1e-9) {
          abimes.push(`${m.cle}/${e.nom}[${i}] relu ${relu && relu.bornes[i].affiche} ≠ ${cible}`);
        } else if (squelette(avant) !== squelette(apresLigne)
                   || refait.split('\n').length !== m.source.split('\n').length) {
          abimes.push(`${m.cle}/${e.nom}[${i}] ${JSON.stringify(apresLigne)}`);
        }
      }
    }
  }
  verifie(`chaque borne se réécrit sans toucher au reste de sa ligne (${bornes} bornes)`,
    abimes.length === 0, `→ ${abimes.slice(0, 3).join(' | ')}`);

  // Et réécrire une borne à sa propre valeur ne touche à rien du tout : poser
  // le curseur dans un champ ne doit pas transformer « 1,60 » en « 1,6 ».
  verifie('un champ inchangé laisse le texte intact',
    MODELES.every((m) => reglages(m.source).every((e) => e.bornes.every((b, i) =>
      reecrire(m.source, reglages(m.source).find((x) => x.nom === e.nom).bornes[i],
        b.affiche) === m.source))));

  // Les positions viennent d'une source où la ligne « unité: € » est
  // neutralisée. Si elle l'était en la vidant, tout ce qui suit se décalerait.
  verifie('la ligne « unité » ne décale pas les positions',
    reglages('unité: €\nloyer = 900 à 1150').length === 1
    && reecrire('unité: €\nloyer = 900 à 1150',
      reglages('unité: €\nloyer = 900 à 1150')[0].bornes[0], 800)
       === 'unité: €\nloyer = 800 à 1150');

  // Ce que le champ accepte, et ce qu'il refuse plutôt que d'écrire n'importe
  // quoi dans le modèle.
  proche('un champ lit la virgule française', lireChamp('1 234,5'), 1234.5, 1e-9);
  proche('… et le point', lireChamp('12.5'), 12.5, 1e-9);
  proche('… et le signe', lireChamp('-3'), -3, 0);
  verifie('un champ vide n’écrit rien', lireChamp('') === null);
  verifie('un mot n’écrit rien', lireChamp('beaucoup') === null);
  verifie('une formule n’écrit rien', lireChamp('2*3') === null);
  verifie('l’affichage n’invente pas de séparateur de milliers', afficher(1234.5) === '1234,5');

  // Les intertitres sont ceux que l'auteur a écrits, et seulement les traits de
  // section : le paragraphe d'introduction de chaque modèle n'en est pas un.
  const t = intertitres(logement.source);
  verifie('les traits de section deviennent des intertitres',
    [...t.values()].join(' | ') === 'Le crédit | Ce qu’on ne sait pas | Achat | Location',
    `→ ${[...t.values()].join(' | ')}`);
  verifie('… et le paragraphe d’ouverture n’en est pas un',
    ![...t.values()].some((x) => /valeur soit dedans/.test(x)));

  // Un texte que le lexer refuse ne doit pas emporter le formulaire : il rend
  // la main au texte, où la faute se corrige.
  verifie('un modèle illisible ne rend aucun champ', reglages('x = (((').length === 0);

  // **Aucun champ ne doit s'afficher sous un identifiant nu.** C'est le
  // reproche même auquel le formulaire répond : « le lexique contient déjà le
  // mot français ». Une valeur ferme (`horizon = 6`) n'est pas une hypothèse
  // tirée au sort, donc pas dans le lexique — elle porte alors le commentaire
  // de fin de ligne de son auteur. Si vous ajoutez une ligne réglable à un
  // modèle, donnez-lui l'un ou l'autre, sinon ce test tombe.
  const { hypothese: motDe } = await import('../public/js/lexique.js');
  const anonymes = [];
  for (const m of MODELES) {
    const ast = analyser(m.source);
    for (const e of reglages(m.source)) {
      const h = motDe(m.cle, e.nom);
      if (h && h.quoi) continue;
      if (ast.commentaires && ast.commentaires.get(e.ligne)) continue;
      anonymes.push(`${m.cle}/${e.nom}`);
    }
  }
  verifie('aucun champ ne s’affiche sous un identifiant nu',
    anonymes.length === 0, `→ ${anonymes.join(', ')}`);
}

// --- Le poids de la page servie ---------------------------------------------
//
// Un lecteur extérieur a compté ce que l'accueil lui mettait sous les yeux :
// « environ 11 800 caractères de texte : démo, référence du langage, lois,
// indicateurs, limites, tout au même endroit ». Le chiffre était juste. Le
// budget ci-dessous n'est pas une esthétique, c'est la seule chose qui empêche
// une page d'accueil de redevenir un manuel : toute section qu'on voudra y
// ajouter devra en déplacer une autre, ou faire tomber ce test.
groupe('Le texte servi par les pages');
{
  const { page, pageLangage } = await import('../outils/gabarit.js');
  const { MODELE_PAR_DEFAUT } = await import('../public/js/modeles.js');
  const brut = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
  const options = { modeles: MODELES, defaut: MODELE_PAR_DEFAUT };
  const defaut = MODELES.find((m) => m.cle === MODELE_PAR_DEFAUT);
  const accueil = page({ modele: defaut, accueil: true, ...options });
  const n = brut(accueil).length;
  verifie('l’accueil tient sous 7 500 caractères de texte', n < 7500, `→ ${n}`);

  // Le nom du site ne dit rien ; la phrase qui dit à quoi il sert doit être
  // lisible avant le modèle, pas après quarante lignes de code.
  const iQuoi = accueil.indexOf('marque-quoi');
  const iCode = accueil.indexOf('<textarea');
  verifie('… et dit à quoi sert le site avant la première ligne de code',
    iQuoi > 0 && iQuoi < iCode, `→ ${iQuoi} / ${iCode}`);

  // Ce que le lecteur a désigné comme le plus utile du site : on ne le range
  // pas derrière la bande de pastilles, qui invite à partir ailleurs.
  const iFond = accueil.indexOf('class="panneau fond"');
  const iPastilles = accueil.indexOf('class="exemples"');
  verifie('… et place le texte de fond avant la bande de modèles',
    iFond > 0 && iFond < iPastilles, `→ ${iFond} / ${iPastilles}`);

  // La référence du langage a sa page. Elle était recopiée en entier sur les
  // quinze pages du site, où elle pesait le tiers du texte de l'accueil.
  const { pageCas } = await import('../outils/gabarit.js');
  const cas = pageCas();
  verifie('le cas raconté est une page à lui seul',
    cas.includes('Un cas, du début à la fin') && cas.includes('canonical" href="https://optiboussole.fr/un-cas'));
  verifie('… vers laquelle l’accueil renvoie dès son ouverture',
    accueil.indexOf('href="/un-cas"') > 0 && accueil.indexOf('href="/un-cas"') < accueil.indexOf('<textarea'));

  const langage = pageLangage();
  verifie('la référence du langage vit sur /le-langage',
    langage.includes('Les fonctions') && langage.includes('lognormale'));
  verifie('… et n’est plus recopiée dans le dépliant des pages',
    !accueil.includes('Fonctions disponibles') && !accueil.includes('Ce que ce site ne fait pas'));
  verifie('… vers laquelle le dépliant renvoie', accueil.includes('href="/le-langage"'));

  // Une page de modèle a droit à plus que l'accueil, et c'est délibéré : ce
  // qu'elle porte en plus, ce sont les trois colonnes « ce que ce modèle
  // compte / ignore / où trouver vos chiffres », que le même lecteur a
  // désignées comme ce qu'il avait trouvé de plus utile sur le site. Le budget
  // sert à contenir le reste, pas à rogner ça.
  let pire = 0, pireNom = '';
  for (const m of MODELES) {
    if (m.cle === MODELE_PAR_DEFAUT) continue;
    const t = brut(page({ modele: m, accueil: false, ...options })).length;
    if (t > pire) { pire = t; pireNom = m.titre; }
  }
  verifie('une page de modèle tient sous 9 000 caractères', pire < 9000, `→ ${pire} (${pireNom})`);
}

console.log(`\n${ko === 0 ? '\x1b[32m' : '\x1b[31m'}${ok} réussis, ${ko} échoués\x1b[0m\n`);
process.exit(ko === 0 ? 0 : 1);
