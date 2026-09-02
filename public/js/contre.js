// contre.js — le contre-argument : ce qu'il faudrait croire pour conclure l'inverse.
//
// Tout le reste du site va des hypothèses vers la conclusion. Cette passe-ci va
// dans l'autre sens : on part de la conclusion contraire et on cherche le jeu
// d'hypothèses le plus proche du vôtre qui la produirait.
//
// Pourquoi ça vaut d'être calculé : le « seuil de bascule » existant déplace
// **une** hypothèse, les autres restées à leur médiane. Or il arrive très
// souvent qu'aucune hypothèse seule ne renverse le verdict — le site n'a alors
// plus rien à dire, alors que trois hypothèses déplacées ensemble, chacune un
// peu, le renversent sans peine. C'est ce déplacement conjoint minimal qu'on
// cherche ici.
//
// La méthode est celle du « point de conception » de la fiabilité des
// structures (FORM / indice de Hasofer-Lind) : on met chaque hypothèse dans son
// unité naturelle d'écart — z = 0 à la médiane, z = ±1,645 au bord de la
// fourchette à 90 % — et on cherche le point de la frontière de décision le plus
// proche de l'origine. La distance obtenue, β, est la réponse à « combien
// faudrait-il s'être trompé ? », et ses coordonnées répondent à « sur quoi ? ».
//
// Le résultat le plus utile est le cas où β est grand : il dit qu'aucune erreur
// plausible sur les chiffres du modèle ne renverse le verdict, donc que si le
// visiteur hésite encore, ce n'est pas un chiffre qui lui manque — c'est que le
// modèle ne contient pas ce qui le fait hésiter.

import { evaluerModele } from './evaluer.js';
import { Z90 } from './rng.js';

// Au-delà, on ne cherche plus : un déplacement de cinq écarts sur l'ensemble
// des hypothèses n'est plus une erreur d'estimation, c'est un autre problème.
const Z_MAX = 5;
const ITERATIONS = 14;
const PAS_GRADIENT = 0.08;
const AMORTISSEMENT = 0.75;
// La recherche porte sur toutes les hypothèses : en épingler une partie à leur
// médiane ferait conclure « aucun jeu d'hypothèses ne renverse ce verdict »
// alors que c'est la recherche qu'on a bridée. Seul l'affichage est limité.
const AXES_MAX = 200;
const DEPLACEMENTS_MONTRES = 6;
const PAS_RAYON = 48;

// Chaque hypothèse est ramenée à son unité d'écart : z = 0 à la médiane,
// z = ±1,645 aux bornes de la fourchette à 90 %. Sur un support strictement
// positif la transformation est multiplicative — c'est exactement la loi que
// « a à b » engendre — et additive sinon. Dans les deux cas elle est monotone,
// lisse et non bornée : ce qu'il faut pour chercher un minimum.
function transformation(st) {
  if (st.p05 > 0 && st.p50 > 0 && st.p95 > st.p05) {
    const s = Math.log(st.p95 / st.p05) / (2 * Z90);
    return { x: (z) => st.p50 * Math.exp(s * z), mult: true };
  }
  const s = (st.p95 - st.p05) / (2 * Z90);
  return { x: (z) => st.p50 + s * z, mult: false };
}

const norme = (z) => Math.sqrt(z.reduce((a, v) => a + v * v, 0));

// Évalue la marge du modèle en un lot de points de l'espace des écarts.
// Tout passe par un seul appel au moteur : un point = un « tirage ».
function evaluateur(ast, axes, fixes, marge) {
  return (points) => {
    const P = points.length;
    const remplacements = {};
    for (const [id, v] of Object.entries(fixes)) {
      remplacements[id] = new Float64Array(P).fill(v);
    }
    axes.forEach((ax, j) => {
      const a = new Float64Array(P);
      for (let i = 0; i < P; i++) a[i] = ax.x(points[i][j]);
      remplacements[ax.id] = a;
    });
    const res = evaluerModele(ast, { N: P, remplacements });
    return marge(res, P);
  };
}

// Recherche du point de la frontière le plus proche de l'origine (HL-RF).
// L'itération résout à chaque pas le problème linéarisé ; l'amortissement
// évite les allers-retours quand la frontière est courbe.
function descendre(G, m) {
  let z = new Array(m).fill(0);
  for (let it = 0; it < ITERATIONS; it++) {
    const points = [z];
    for (let j = 0; j < m; j++) {
      const p = z.slice();
      p[j] += PAS_GRADIENT;
      points.push(p);
    }
    const vals = G(points);
    const g = vals[0];
    if (!Number.isFinite(g)) return null;
    const grad = new Array(m);
    let n2 = 0;
    for (let j = 0; j < m; j++) {
      const d = (vals[j + 1] - g) / PAS_GRADIENT;
      if (!Number.isFinite(d)) return null;
      grad[j] = d;
      n2 += d * d;
    }
    if (n2 <= 1e-18) return null;
    let dot = 0;
    for (let j = 0; j < m; j++) dot += z[j] * grad[j];
    const c = (dot - g) / n2;
    const suivant = new Array(m);
    for (let j = 0; j < m; j++) {
      suivant[j] = z[j] + AMORTISSEMENT * (c * grad[j] - z[j]);
      if (!Number.isFinite(suivant[j])) return null;
    }
    const n = norme(suivant);
    if (n > Z_MAX) for (let j = 0; j < m; j++) suivant[j] *= Z_MAX / n;
    z = suivant;
  }
  return norme(z) > 1e-9 ? z : null;
}

// Le long d'un rayon partant de l'origine, où la marge s'annule-t-elle ?
// C'est ce qui garantit que le point rapporté est bien *sur* la frontière et
// pas au-delà : on ne demande pas au visiteur de se tromper plus qu'il ne faut.
function traverserRayon(G, direction, portee, g0) {
  const points = [];
  for (let i = 1; i <= PAS_RAYON; i++) {
    const t = (portee * i) / PAS_RAYON;
    points.push(direction.map((v) => v * t));
  }
  const vals = G(points);
  for (let i = 0; i < vals.length; i++) {
    if (!Number.isFinite(vals[i]) || vals[i] > 0) continue;
    const gAvant = i === 0 ? g0 : vals[i - 1];
    const tA = (portee * i) / PAS_RAYON;
    const tB = (portee * (i + 1)) / PAS_RAYON;
    if (!Number.isFinite(gAvant) || gAvant <= 0) return tB;
    // Interpolation linéaire entre le dernier point du bon côté et le premier
    // de l'autre : le point rapporté est sur la frontière, pas au-delà.
    return tA + (tB - tA) * (gAvant / (gAvant - vals[i]));
  }
  return null;
}

// Balayage d'une hypothèse seule : sert de filet quand la descente échoue
// (frontière anguleuse, `si … alors`), et de comparaison honnête —
// si une seule hypothèse suffit, autant le dire ainsi.
function meilleurAxeSeul(G, m) {
  const points = [];
  const pas = [];
  for (let j = 0; j < m; j++) {
    for (let s of [-1, 1]) {
      for (let i = 1; i <= 20; i++) {
        const z = new Array(m).fill(0);
        z[j] = (s * Z_MAX * i) / 20;
        points.push(z);
        pas.push({ j, z: z[j], abs: (Z_MAX * i) / 20 });
      }
    }
  }
  if (points.length === 0) return null;
  const vals = G(points);
  let meilleur = null;
  for (let i = 0; i < vals.length; i++) {
    if (Number.isFinite(vals[i]) && vals[i] <= 0) {
      if (!meilleur || pas[i].abs < meilleur.abs) meilleur = pas[i];
    }
  }
  if (!meilleur) return null;
  const z = new Array(m).fill(0);
  z[meilleur.j] = meilleur.z;
  return z;
}

export function analyserContreArgument(r) {
  if (!r || r.vide || r.probleme) return null;

  // Il faut une frontière : deux branches à comparer, ou un objectif à tenir.
  const modeDecision = !!r.modeDecision;
  if (!modeDecision && (r.seuil === null || r.seuil === undefined)) {
    return { applicable: false, raison: 'sans-frontiere' };
  }

  const utilisables = r.sources.filter(
    (s) => !s.binaire && s.stats && s.stats.p95 > s.stats.p05);
  if (utilisables.length === 0) {
    return { applicable: false, raison: 'sans-fourchette' };
  }

  const axes = utilisables.slice(0, AXES_MAX).map((s) => {
    const t = transformation(s.stats);
    return { id: s.id, nom: s.nom, source: s, x: t.x, mult: t.mult };
  });
  const fixes = {};
  for (const s of r.sources) {
    if (!axes.some((a) => a.id === s.id)) fixes[s.id] = s.stats.p50;
  }
  const figees = () => r.sources
    .filter((s) => s.binaire && !axes.some((a) => a.id === s.id))
    .map((s) => ({ nom: s.nom, ligne: s.ligne, valeur: s.stats.p50, proba: s.stats.moyenne }));

  // La marge : positive tant que la conclusion actuelle tient, négative dès
  // qu'elle est renversée. On cherche le point de marge nulle le plus proche.
  let marge, cible, tenu = true;
  if (modeDecision) {
    const liste = r.options.liste;
    const iA = r.options.recommande;
    let iB = -1;
    for (let k = 0; k < liste.length; k++) {
      if (k === iA) continue;
      if (iB < 0 || liste[k].stats.moyenne > liste[iB].stats.moyenne) iB = k;
    }
    if (iB < 0) return { applicable: false, raison: 'sans-frontiere' };
    cible = liste[iB].nom;
    marge = (res, P) => {
      const out = new Float64Array(P);
      const a = res.options[iA].valeurs, b = res.options[iB].valeurs;
      for (let i = 0; i < P; i++) out[i] = a[i] - b[i];
      return out;
    };
  } else {
    const seuil = r.seuil;
    const max = r.seuilSens === 'max';
    const brut = (y) => (max ? seuil - y : y - seuil);
    // Si l'objectif n'est déjà pas tenu à la médiane, le contre-argument
    // intéressant est l'inverse : ce qu'il faudrait pour qu'il le soit.
    tenu = null; // fixé après la première évaluation
    marge = (res, P) => {
      const out = new Float64Array(P);
      for (let i = 0; i < P; i++) out[i] = brut(res.sortie[i]);
      return out;
    };
  }

  const Gbrut = evaluateur(r.ast, axes, fixes, marge);
  const m = axes.length;
  const origine = new Array(m).fill(0);
  const g0 = Gbrut([origine])[0];
  if (!Number.isFinite(g0)) return { applicable: false, raison: 'sans-frontiere' };

  if (!modeDecision) {
    tenu = g0 > 0;
    cible = tenu ? 'manquer' : 'atteindre';
  }
  const signe = modeDecision ? 1 : (tenu ? 1 : -1);
  const G = (points) => {
    const v = Gbrut(points);
    if (signe === 1) return v;
    for (let i = 0; i < v.length; i++) v[i] = -v[i];
    return v;
  };

  // La médiane de toutes les hypothèses donne déjà l'autre réponse : le verdict
  // ne tient qu'à la forme des fourchettes, pas à leur centre. C'est un signal
  // de fragilité à part entière, et il faut le dire tel quel.
  if (signe * g0 <= 0) {
    return {
      applicable: true, modeDecision, cible, tenu,
      beta: 0, medianeContredit: true, deplacements: [], atteint: true,
      figees: figees(),
    };
  }

  const gDepart = signe * g0;

  // Une fois la marge orientée, la recherche est la même partout : descente
  // amortie depuis l'origine, filet du balayage à une hypothèse, puis on
  // ramène le point exactement sur la frontière le long de son rayon.
  const resoudre = (Gs, m) => {
    let z = descendre(Gs, m);
    if (z) {
      const t = traverserRayon(Gs, z, Math.min(1.8, Z_MAX / (norme(z) || 1)), gDepart);
      z = t === null ? null : z.map((v) => v * t);
    }
    const seul = meilleurAxeSeul(Gs, m);
    if (seul && (!z || norme(seul) < norme(z))) {
      const t = traverserRayon(Gs, seul, 1, gDepart);
      z = t === null ? seul : seul.map((v) => v * t);
    }
    if (!z) return null;
    // Le point interpolé tombe pile sur la frontière : on le pousse d'un pas
    // pour être certain qu'il la franchit, et on vérifie qu'il la franchit.
    const pousse = z.map((v) => v * (1 + 1 / PAS_RAYON));
    if (Gs([pousse])[0] <= 0) return pousse;
    return Gs([z])[0] <= 0 ? z : null;
  };

  const horsAtteinte = () => ({
    applicable: true, modeDecision, cible, tenu,
    beta: null, atteint: false, portee: Z_MAX, deplacements: [], figees: figees(),
  });

  let z = resoudre(G, m);
  if (!z) return horsAtteinte();

  // Le point trouvé déplace toutes les hypothèses, la plupart d'un cheveu. On
  // n'en affichera qu'une poignée — mais alors le scénario affiché ne franchit
  // plus la frontière, puisqu'on vient de lui retirer une partie de son
  // déplacement. Montrer un contre-argument qui ne renverse rien serait un
  // mensonge poli. On refait donc la recherche dans le seul sous-espace qu'on
  // s'apprête à montrer : le résultat est un peu plus loin, et il est vrai.
  let axesMontres = axes;
  {
    const n2 = z.reduce((a, v) => a + v * v, 0) || 1;
    const rangs = axes.map((ax, j) => ({ j, part: (z[j] * z[j]) / n2 }))
      .filter((e) => e.part >= 0.04)
      .sort((a, b) => b.part - a.part)
      .slice(0, DEPLACEMENTS_MONTRES);
    if (rangs.length > 0 && rangs.length < axes.length) {
      const retenus = rangs.map((e) => axes[e.j]);
      const fixesR = { ...fixes };
      for (const ax of axes) if (!retenus.includes(ax)) fixesR[ax.id] = ax.source.stats.p50;
      const Gb = evaluateur(r.ast, retenus, fixesR, marge);
      const Gr = (points) => {
        const v = Gb(points);
        if (signe !== 1) for (let i = 0; i < v.length; i++) v[i] = -v[i];
        return v;
      };
      const zr = resoudre(Gr, retenus.length);
      // Si le sous-espace ne suffit pas à franchir la frontière, on garde la
      // solution complète et on montre tout : mieux vaut une longue liste
      // vraie qu'une courte liste fausse.
      if (zr) { z = zr; axesMontres = retenus; }
    }
  }

  const beta = norme(z);

  // β presque nul : les valeurs médianes tombent sur la frontière elle-même.
  // Lister six déplacements de trois millièmes n'apprendrait rien ; le fait
  // qu'il n'y ait rien à déplacer, si.
  if (beta < 0.08) {
    return {
      applicable: true, modeDecision, cible, tenu,
      beta, atteint: true, medianeContredit: false, surLaFrontiere: true,
      deplacements: [], figees: figees(), portee: Z_MAX,
    };
  }

  const deplacements = axesMontres.map((ax, j) => ({
    nom: ax.nom,
    ligne: ax.source.ligne,
    pourcent: !!ax.source.pourcent,
    mediane: ax.source.stats.p50,
    valeur: ax.x(z[j]),
    z: z[j],
    part: (z[j] * z[j]) / (beta * beta),
    // Au-delà de 1,645 écart, la valeur sort de la fourchette que le visiteur
    // a lui-même donnée : ce n'est plus une correction, c'est un démenti.
    horsFourchette: Math.abs(z[j]) > Z90,
  })).sort((a, b) => b.part - a.part);

  return {
    applicable: true, modeDecision, cible, tenu,
    beta, atteint: true, medianeContredit: false, surLaFrontiere: false,
    deplacements,
    // Les événements tout ou rien n'ont pas d'unité d'écart : on ne « déplace »
    // pas un pile ou face d'un demi-écart-type. Ils sont tenus à leur valeur la
    // plus probable, et le contre-argument doit le dire, sans quoi il décrirait
    // un scénario qui suppose en douce que l'incident n'a pas lieu.
    figees: figees(),
    portee: Z_MAX,
  };
}
