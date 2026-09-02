// Tests du moteur. `node test/run.js`
import { lexer, analyser, ErreurModele } from '../public/js/lang.js';
import { evaluerModele, quantile, trier, moyenne, variance } from '../public/js/evaluer.js';
import { analyserModele, analyserRobustesse } from '../public/js/moteur.js';

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

console.log(`\n${ko === 0 ? '\x1b[32m' : '\x1b[31m'}${ok} réussis, ${ko} échoués\x1b[0m\n`);
process.exit(ko === 0 ? 0 : 1);
