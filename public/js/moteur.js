// moteur.js — la partie qui compte.
//
// Un simulateur ordinaire répond « voici le résultat ». Ici on répond à trois
// questions différentes, et plus utiles :
//   1. Quelle hypothèse porte l'essentiel de l'incertitude ? (indice de Sobol)
//   2. Si je la connaissais exactement, que resterait-il ? (largeur résiduelle)
//   3. À partir de quelle valeur ma décision change-t-elle ? (seuil de bascule)
// En mode décision s'ajoute la valeur de l'information : combien vaut, en euros
// du modèle, le fait de lever l'incertitude sur une hypothèse et une seule.

import { analyser } from './lang.js';
import { evaluerModele, quantile, trier, moyenne, variance } from './evaluer.js';

const K_BINS = 32;

// Indices triés par valeur croissante de x.
function ordre(x) {
  const idx = new Int32Array(x.length);
  for (let i = 0; i < x.length; i++) idx[i] = i;
  const arr = Array.from(idx);
  arr.sort((a, b) => x[a] - x[b]);
  return Int32Array.from(arr);
}

function bornesBins(N, K) {
  const b = [];
  for (let k = 0; k < K; k++) {
    b.push([Math.floor((k * N) / K), Math.floor(((k + 1) * N) / K)]);
  }
  return b;
}

// Rang normalisé de chaque valeur, dans [0,1].
function rangs(y) {
  const o = ordre(y);
  const r = new Float64Array(y.length);
  for (let i = 0; i < o.length; i++) r[o[i]] = (i + 0.5) / o.length;
  return r;
}

// Part de l'incertitude portée par une hypothèse : Var(E[R|X]) / Var(R),
// estimée par tranches, où R est le rang normalisé de la sortie.
// Le passage par les rangs est délibéré : sur des grandeurs à queue lourde
// (tout ce qui est lognormal, donc presque tout), un indice calculé sur les
// valeurs brutes est dominé par quelques tirages extrêmes et sous-estime
// massivement — `y = a` tombait à 0,22 au lieu de 1.
function effetPrincipal(idx, y, varY, moyY, bins) {
  if (varY <= 0) return 0;
  const N = y.length;
  let acc = 0;
  for (const [d, f] of bins) {
    if (f <= d) continue;
    let s = 0;
    for (let i = d; i < f; i++) s += y[idx[i]];
    const m = s / (f - d);
    acc += ((f - d) / N) * (m - moyY) * (m - moyY);
  }
  // Correction du biais positif attendu sous indépendance.
  const biais = (bins.length - 1) / (N - 1);
  return Math.max(0, acc / varY - biais);
}

// Largeur moyenne de l'intervalle à 90 % une fois X connu.
function largeurResiduelle(idx, y, bins) {
  const N = y.length;
  let acc = 0;
  for (const [d, f] of bins) {
    if (f - d < 8) continue;
    const tranche = new Float64Array(f - d);
    for (let i = d; i < f; i++) tranche[i - d] = y[idx[i]];
    tranche.sort();
    acc += ((f - d) / N) * (quantile(tranche, 0.95) - quantile(tranche, 0.05));
  }
  return acc;
}

// Valeur espérée d'une information parfaite sur X seul (EVPPI).
// En connaissant X, on choisirait la meilleure option pour chaque valeur de X ;
// le gain par rapport au choix unique fait aujourd'hui est le prix de cette info.
function evppi(idx, options, bins, valeurSansInfo) {
  const N = options[0].valeurs.length;
  let acc = 0;
  for (const [d, f] of bins) {
    if (f <= d) continue;
    let meilleur = -Infinity;
    for (const o of options) {
      let s = 0;
      for (let i = d; i < f; i++) s += o.valeurs[idx[i]];
      const m = s / (f - d);
      if (m > meilleur) meilleur = m;
    }
    acc += ((f - d) / N) * meilleur;
  }
  return Math.max(0, acc - valeurSansInfo);
}

// Un tirage qui ne prend que deux valeurs (bernoulli, indicatrice) n'a pas de
// « seuil » : on ne balaie pas une plage entre pile et face.
function estBinaire(tri) {
  const a = tri[0], b = tri[tri.length - 1];
  if (a === b) return false;
  for (let i = 0; i < tri.length; i++) {
    if (tri[i] !== a && tri[i] !== b) return false;
  }
  return true;
}

// Part des tirages situés au-delà (ou en deçà) d'une valeur, par recherche
// dichotomique dans l'échantillon déjà trié.
function partAuDela(tri, x, au_dessus) {
  let lo = 0, hi = tri.length;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (tri[m] < x) lo = m + 1; else hi = m;
  }
  return au_dessus ? 1 - lo / tri.length : lo / tri.length;
}

function statistiques(v) {
  const tri = trier(v);
  const m = moyenne(v);
  return {
    moyenne: m,
    ecartType: Math.sqrt(variance(v, m)),
    min: tri[0],
    max: tri[tri.length - 1],
    p05: quantile(tri, 0.05),
    p25: quantile(tri, 0.25),
    p50: quantile(tri, 0.5),
    p75: quantile(tri, 0.75),
    p95: quantile(tri, 0.95),
    tri,
  };
}

// Histogramme lissé pour l'affichage.
export function histogramme(tri, nBarres = 56, bas = null, haut = null) {
  const a = bas === null ? quantile(tri, 0.005) : bas;
  const b = haut === null ? quantile(tri, 0.995) : haut;
  const larg = (b - a) / nBarres || 1;
  const barres = new Float64Array(nBarres);
  for (let i = 0; i < tri.length; i++) {
    let k = Math.floor((tri[i] - a) / larg);
    if (k < 0) k = 0;
    if (k >= nBarres) k = nBarres - 1;
    barres[k]++;
  }
  return { a, b, larg, barres, total: tri.length };
}

// --- Seuils de bascule ------------------------------------------------------
//
// On fige toutes les hypothèses à leur médiane sauf une, qu'on balaie sur sa
// plage plausible, et on regarde où la meilleure option change de nom.

const PAS_BALAYAGE = 161;

function balayer(ast, sources, cible) {
  const remplacements = {};
  for (const s of sources) {
    if (s.id === cible.id) continue;
    remplacements[s.id] = s.stats ? s.stats.p50 : moyenne(s.valeurs);
  }
  const bas = cible.stats.p05, haut = cible.stats.p95;
  const grille = new Float64Array(PAS_BALAYAGE);
  for (let i = 0; i < PAS_BALAYAGE; i++) {
    grille[i] = bas + ((haut - bas) * i) / (PAS_BALAYAGE - 1);
  }
  remplacements[cible.id] = grille;
  const r = evaluerModele(ast, { N: PAS_BALAYAGE, remplacements });
  return { grille, res: r };
}

function seuilsDecision(ast, sources, cible, nomsOptions) {
  const { grille, res } = balayer(ast, sources, cible);
  if (res.options.length < 2) return [];
  const gagnant = new Array(PAS_BALAYAGE);
  for (let i = 0; i < PAS_BALAYAGE; i++) {
    let meilleur = 0;
    for (let k = 1; k < res.options.length; k++) {
      if (res.options[k].valeurs[i] > res.options[meilleur].valeurs[i]) meilleur = k;
    }
    gagnant[i] = meilleur;
  }
  const bascules = [];
  for (let i = 1; i < PAS_BALAYAGE; i++) {
    if (gagnant[i] !== gagnant[i - 1]) {
      // Interpolation linéaire de l'écart entre les deux options concernées.
      const ka = gagnant[i - 1], kb = gagnant[i];
      const da = res.options[ka].valeurs, db = res.options[kb].valeurs;
      const e0 = da[i - 1] - db[i - 1], e1 = da[i] - db[i];
      const t = e0 === e1 ? 0.5 : e0 / (e0 - e1);
      const x = grille[i - 1] + (grille[i] - grille[i - 1]) * Math.min(1, Math.max(0, t));
      bascules.push({ valeur: x, de: nomsOptions[ka], vers: nomsOptions[kb], sens: grille[i] > grille[i - 1] ? 'hausse' : 'baisse' });
    }
  }
  return bascules;
}

function seuilCible(ast, sources, cible, seuil) {
  const { grille, res } = balayer(ast, sources, cible);
  if (!res.sortie) return [];
  const y = res.sortie;
  const bascules = [];
  for (let i = 1; i < PAS_BALAYAGE; i++) {
    const a = y[i - 1] - seuil, b = y[i] - seuil;
    if ((a < 0 && b >= 0) || (a >= 0 && b < 0)) {
      const t = a === b ? 0.5 : a / (a - b);
      bascules.push({
        valeur: grille[i - 1] + (grille[i] - grille[i - 1]) * t,
        sens: b > a ? 'au-dessus' : 'en-dessous',
      });
    }
  }
  return bascules;
}

// --- Robustesse à l'excès de confiance -------------------------------------
//
// Le point faible de toute cette méthode n'est pas le calcul : c'est que les
// intervalles à 90 % que les gens donnent contiennent la vraie valeur bien
// moins souvent que 9 fois sur 10. C'est le résultat de laboratoire le plus
// solide du domaine, et aucun outil d'estimation n'en fait quoi que ce soit.
//
// On y répond en élargissant toutes les fourchettes du modèle d'un facteur
// croissant, médiane inchangée, et en regardant à partir de quand la conclusion
// ne tient plus. Un verdict qui survit à des fourchettes trois fois plus larges
// ne dépend pas de la justesse de vos fourchettes ; un verdict qui tombe à 1,3
// ne devrait pas être traité comme un verdict.

const ECHELLE_ELARGISSEMENT = [1.25, 1.5, 2, 2.5, 3, 4, 6];
const N_ROBUSTESSE = 8000;
const SEUIL_SERRE = 0.62;

export function analyserRobustesse(r) {
  if (!r || r.vide) return null;
  if (!r.sources.some((s) => s.elargissable)) {
    return { applicable: false, raison: 'aucune fourchette à élargir' };
  }
  const ast = r.ast;
  const modeDecision = r.modeDecision;
  const iRecommande = modeDecision ? r.options.recommande : -1;
  const nomsOptions = modeDecision ? r.options.liste.map((o) => o.nom) : [];
  const seuil = r.seuil;
  const seuilSens = r.seuilSens || 'min';

  const paliers = [];
  let kBascule = null, kBrouillage = null;

  for (const k of ECHELLE_ELARGISSEMENT) {
    const r = evaluerModele(ast, { N: N_ROBUSTESSE, elargissement: k });
    const palier = { k };

    if (modeDecision) {
      const opts = r.options;
      const moyennes = opts.map((o) => moyenne(o.valeurs));
      let meilleur = 0;
      for (let i = 1; i < moyennes.length; i++) if (moyennes[i] > moyennes[meilleur]) meilleur = i;

      let gagne = 0;
      for (let i = 0; i < N_ROBUSTESSE; i++) {
        let arg = 0, v = opts[0].valeurs[i];
        for (let j = 1; j < opts.length; j++) if (opts[j].valeurs[i] > v) { v = opts[j].valeurs[i]; arg = j; }
        if (arg === iRecommande) gagne++;
      }
      palier.recommande = nomsOptions[meilleur];
      palier.pGagne = gagne / N_ROBUSTESSE;
      if (kBascule === null && meilleur !== iRecommande) kBascule = k;
      if (kBrouillage === null && palier.pGagne < SEUIL_SERRE) kBrouillage = k;
    } else if (r.sortie) {
      const tri = trier(r.sortie);
      palier.p05 = quantile(tri, 0.05);
      palier.p95 = quantile(tri, 0.95);
      if (seuil !== null && seuil !== undefined) {
        let n = 0;
        for (let i = 0; i < tri.length; i++) {
          if (seuilSens === 'max' ? tri[i] <= seuil : tri[i] >= seuil) n++;
        }
        palier.pAtteint = n / tri.length;
      }
    }
    paliers.push(palier);
  }

  return {
    applicable: true, modeDecision, paliers, kBascule, kBrouillage,
    max: ECHELLE_ELARGISSEMENT[ECHELLE_ELARGISSEMENT.length - 1],
    // Le palier « fourchettes deux fois trop étroites » est celui qu'on montre
    // en mode estimation : c'est l'ordre de grandeur de l'erreur habituelle.
    double: paliers.find((p) => p.k === 2) || null,
  };
}

// --- Analyse complète -------------------------------------------------------

export function analyserModele(source, { N = 20000, seuil = null } = {}) {
  const ast = analyser(source);
  if (ast.declarations.length === 0 && ast.options.length === 0) {
    return { vide: true, ast };
  }
  const r = evaluerModele(ast, { N });
  // Un « seuil: » écrit dans le modèle prime sur celui passé par l'appelant.
  if (r.seuil !== null && r.seuil !== undefined) seuil = r.seuil;
  const seuilSens = r.seuilSens || 'min';

  // On ne garde que les sources qui varient réellement.
  const sources = r.sources
    .filter((s) => s.valeurs instanceof Float64Array)
    .map((s) => {
      const stats = statistiques(s.valeurs);
      return { ...s, stats, binaire: estBinaire(stats.tri) };
    })
    .filter((s) => s.stats.p95 - s.stats.p05 > 0 || s.stats.ecartType > 0);

  const modeDecision = r.options.length >= 2;
  const resultat = {
    ast, N, modeDecision, sources: [],
    options: null, sortie: null, seuil, seuilSens, unite: ast.unite || '',
    nomSortie: ast.sortie && ast.sortie.expr.k === 'var' ? ast.sortie.expr.nom : null,
  };

  const bins = bornesBins(N, K_BINS);
  const ordres = new Map();
  for (const s of sources) ordres.set(s.id, ordre(s.valeurs));

  if (modeDecision) {
    const opts = r.options.map((o) => ({ nom: o.nom, valeurs: o.valeurs, stats: statistiques(o.valeurs) }));
    const nomsOptions = opts.map((o) => o.nom);

    // Fréquence à laquelle chaque option l'emporte, échantillon par échantillon.
    const compte = new Array(opts.length).fill(0);
    let sommeMax = 0;
    for (let i = 0; i < N; i++) {
      let meilleur = 0, vMax = opts[0].valeurs[i];
      for (let k = 1; k < opts.length; k++) {
        if (opts[k].valeurs[i] > vMax) { vMax = opts[k].valeurs[i]; meilleur = k; }
      }
      compte[meilleur]++;
      sommeMax += vMax;
    }
    opts.forEach((o, k) => { o.pGagne = compte[k] / N; });

    let iRecommande = 0;
    for (let k = 1; k < opts.length; k++) {
      if (opts[k].stats.moyenne > opts[iRecommande].stats.moyenne) iRecommande = k;
    }
    const valeurSansInfo = opts[iRecommande].stats.moyenne;
    const evpiTotal = Math.max(0, sommeMax / N - valeurSansInfo);

    // Écart entre l'option recommandée et sa meilleure rivale.
    const ecarts = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      let rival = -Infinity;
      for (let k = 0; k < opts.length; k++) {
        if (k !== iRecommande && opts[k].valeurs[i] > rival) rival = opts[k].valeurs[i];
      }
      ecarts[i] = opts[iRecommande].valeurs[i] - rival;
    }

    const rangEcarts = rangs(ecarts);

    // L'écart entre la meilleure et la pire branche : c'est l'enjeu du choix.
    // Une valeur d'information ne veut rien dire seule — 13 kg comptent si le
    // choix en pèse 40, pas s'il en pèse 1 900.
    const moyennes = opts.map((o) => o.stats.moyenne);
    const enjeu = Math.max(...moyennes) - Math.min(...moyennes);

    resultat.options = {
      liste: opts,
      recommande: iRecommande,
      evpi: evpiTotal,
      enjeu,
      // En dessous de 2 % de l'enjeu, aucune enquête ne vaut d'être menée :
      // le choix est fait, quelles que soient les hypothèses.
      acquise: enjeu > 0 && evpiTotal < 0.02 * enjeu,
      ecart: statistiques(ecarts),
      pRegret: 1 - opts[iRecommande].pGagne,
    };

    for (const s of sources) {
      const idx = ordres.get(s.id);
      const bascules = s.binaire ? [] : seuilsDecision(ast, sources, s, nomsOptions);
      for (const b of bascules) {
        b.proba = partAuDela(s.stats.tri, b.valeur, b.sens === 'hausse');
      }
      resultat.sources.push({
        id: s.id, nom: s.nom, ligne: s.ligne, stats: s.stats,
        binaire: s.binaire, pourcent: !!s.pourcent, elargissable: !!s.elargissable,
        part: effetPrincipal(idx, rangEcarts, variance(rangEcarts), moyenne(rangEcarts), bins),
        valeurInfo: evppi(idx, opts, bins, valeurSansInfo),
        bascules,
      });
    }
    resultat.sources.sort((a, b) => (b.valeurInfo - a.valeurInfo) || (b.part - a.part));
  } else if (r.sortie) {
    const st = statistiques(r.sortie);
    resultat.sortie = st;
    const rangSortie = rangs(r.sortie);
    const varR = variance(rangSortie, moyenne(rangSortie));
    const largeurTotale = st.p95 - st.p05;
    if (seuil !== null) {
      // « au moins » compte les tirages au-dessus, « au plus » ceux en dessous.
      resultat.pAtteint = partAuDela(st.tri, seuil, seuilSens === 'min');
    }
    for (const s of sources) {
      const idx = ordres.get(s.id);
      const resid = largeurResiduelle(idx, r.sortie, bins);
      const bascules = (seuil === null || s.binaire) ? [] : seuilCible(ast, sources, s, seuil);
      for (const b of bascules) {
        b.proba = partAuDela(s.stats.tri, b.valeur, b.sens === 'au-dessus');
      }
      resultat.sources.push({
        id: s.id, nom: s.nom, ligne: s.ligne, stats: s.stats,
        binaire: s.binaire, pourcent: !!s.pourcent, elargissable: !!s.elargissable,
        part: effetPrincipal(idx, rangSortie, varR, moyenne(rangSortie), bins),
        largeurResiduelle: resid,
        gainLargeur: largeurTotale > 0 ? 1 - resid / largeurTotale : 0,
        bascules,
      });
    }
    resultat.largeurTotale = largeurTotale;
    resultat.sources.sort((a, b) => b.part - a.part);
  }

  return resultat;
}
