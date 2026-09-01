// rng.js — générateur pseudo-aléatoire déterministe + lois de probabilité.
// Déterministe pour que deux exécutions du même modèle donnent le même résultat :
// sans ça, bouger une hypothèse ferait bouger l'affichage pour rien.

// PCG-XSH-RR 32 bits, en arithmétique 32 bits via BigInt uniquement à l'init.
export class RNG {
  constructor(seed = 0x2545f491) {
    this.s0 = (seed ^ 0x9e3779b9) >>> 0;
    this.s1 = (seed + 0x85ebca6b) >>> 0;
    this.s2 = (seed ^ 0xc2b2ae35) >>> 0;
    this.s3 = (seed + 0x27d4eb2f) >>> 0;
    for (let i = 0; i < 12; i++) this.u32();
    this._spare = null;
  }

  // xoshiro128**
  u32() {
    const r = Math.imul(this.s1 * 5, 1) >>> 0;
    const rot = (((r << 7) | (r >>> 25)) >>> 0);
    const result = Math.imul(rot, 9) >>> 0;
    const t = (this.s1 << 9) >>> 0;
    this.s2 ^= this.s0;
    this.s3 ^= this.s1;
    this.s1 ^= this.s2;
    this.s0 ^= this.s3;
    this.s2 ^= t;
    this.s3 = ((this.s3 << 11) | (this.s3 >>> 21)) >>> 0;
    return result;
  }

  // [0,1)
  next() {
    return (this.u32() >>> 8) / 16777216;
  }

  // Normale centrée réduite (Box-Muller, avec réserve).
  normal() {
    if (this._spare !== null) {
      const v = this._spare;
      this._spare = null;
      return v;
    }
    let u, v, s;
    do {
      u = this.next() * 2 - 1;
      v = this.next() * 2 - 1;
      s = u * u + v * v;
    } while (s >= 1 || s === 0);
    const m = Math.sqrt((-2 * Math.log(s)) / s);
    this._spare = v * m;
    return u * m;
  }

  // Gamma(shape>0, 1) — Marsaglia & Tsang.
  gamma(shape) {
    if (shape < 1) {
      const u = this.next();
      return this.gamma(1 + shape) * Math.pow(u, 1 / shape);
    }
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    for (;;) {
      let x, v;
      do {
        x = this.normal();
        v = 1 + c * x;
      } while (v <= 0);
      v = v * v * v;
      const u = this.next();
      if (u < 1 - 0.0331 * x * x * x * x) return d * v;
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  }

  beta(a, b) {
    const x = this.gamma(a);
    const y = this.gamma(b);
    return x / (x + y);
  }

  // Poisson — Knuth pour λ petit, approximation normale sinon.
  poisson(lambda) {
    if (lambda < 30) {
      const L = Math.exp(-lambda);
      let k = 0, p = 1;
      do { k++; p *= this.next(); } while (p > L);
      return k - 1;
    }
    return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * this.normal()));
  }
}

// Quantile de la normale centrée réduite (Acklam, précision ~1e-9 après raffinage).
export function probit(p) {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
             1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
             6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
             -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
             3.754408661907416e+00];
  const pl = 0.02425, ph = 1 - pl;
  let x;
  if (p < pl) {
    const q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
        ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  } else if (p > ph) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
         ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  } else {
    const q = p - 0.5, r = q * q;
    x = (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5]) * q /
        (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  }
  return x;
}

// Le z tel que P(-z < Z < z) = 0.90, soit 1.6448...
export const Z90 = probit(0.95);
