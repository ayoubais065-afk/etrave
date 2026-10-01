// ÉTRAVE – Preliminary scantlings in accordance with ISO 12215-5:2008
// (Small craft – Hull construction and scantlings – Part 5).
//
// Units follow the standard: lengths of the craft in m, panel and stiffener
// dimensions in mm, masses in kg, pressures in kN/m², stresses in N/mm².
// Clause and equation numbers refer to ISO 12215-5:2008.
// This module implements calculations only; it does not reproduce the text
// of the standard, which must be consulted for the full requirements.

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const lerp = (x, x0, x1, y0, y1) => y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);

function interpTable(x, xs, ys) {
  if (x <= xs[0]) return ys[0];
  for (let i = 1; i < xs.length; i++) {
    if (x <= xs[i]) return lerp(x, xs[i - 1], xs[i], ys[i - 1], ys[i]);
  }
  return ys[ys.length - 1];
}

// ---------------------------------------------------------------------------
// 7.2 Design category factor (Table 2)
// ---------------------------------------------------------------------------
export const K_DC = { A: 1.0, B: 0.8, C: 0.6, D: 0.4 };

// ---------------------------------------------------------------------------
// 6.1 Craft data
// ---------------------------------------------------------------------------
/**
 * Normalises and checks the principal data of the craft.
 * @param {object} c
 * @param {'motor'|'sail'} c.type
 * @param {'A'|'B'|'C'|'D'} c.category
 * @param {number} c.LH   length of hull, m
 * @param {number} c.LWL  waterline length at mLDC, m
 * @param {number} c.BWL  waterline beam at mLDC, m
 * @param {number} c.BC   chine beam at 0,4 LWL, m
 * @param {number} c.beta deadrise at 0,4 LWL, degrees
 * @param {number} c.V    maximum speed at mLDC, knots (motor craft)
 * @param {number} c.mLDC loaded displacement mass, kg
 * @param {number} [c.kSLS=1] light and stable sailing craft factor (7.8)
 */
export function craft(c) {
  const warnings = [];
  if (c.LH < 2.5 || c.LH > 24) warnings.push('LH is outside the 2,5 m to 24 m scope of ISO 12215-5.');
  const beta = clamp(c.beta ?? 15, 10, 30);
  if ((c.beta ?? 15) !== beta) warnings.push(`Deadrise taken as ${beta}° (limited to 10°–30°, 6.1).`);
  const Vmin = 2.36 * Math.sqrt(c.LWL);
  let V = c.type === 'sail' ? Vmin : Math.max(c.V ?? 0, Vmin);
  if (c.type !== 'sail' && (c.V ?? 0) < Vmin) warnings.push(`Speed taken as ${Vmin.toFixed(2)} kn (not less than 2,36·√LWL, 6.1).`);
  if (V > 50) warnings.push('Speed above 50 kn is outside the scope of ISO 12215-5.');
  const speedLengthRatio = V / Math.sqrt(c.LWL);
  const planing = c.type === 'motor' && speedLengthRatio >= 5; // 3.6 / 3.8
  return {
    ...c,
    beta,
    V,
    kDC: K_DC[c.category],
    speedLengthRatio,
    planing,
    kSLS: c.type === 'sail' ? Math.max(c.kSLS ?? 1, 1) : 1,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// 7.3 Dynamic load factor nCG
// ---------------------------------------------------------------------------
export function nCG(cr) {
  if (cr.type === 'sail') return { value: 3, eq1: null, eq2: null, note: 'Sailing craft: nCG = 3, used for kL only (7.3.3).' };
  const { LWL, BC, beta, V, mLDC } = cr;
  const eq1 = 0.32 * (LWL / (10 * BC) + 0.084) * (50 - beta) * (V * V * BC * BC) / mLDC; // Eq. (1)
  const eq2 = (0.5 * V) / Math.pow(mLDC, 0.17); // Eq. (2)
  let value = eq1;
  let note = 'Eq. (1)';
  if (eq1 > 3) {
    value = Math.min(eq1, eq2);
    note = value === eq2 ? 'Eq. (1) > 3, Eq. (2) used' : 'Eq. (1) > 3, Eq. (1) kept (lower)';
  }
  if (value > 7) { value = 7; note += '; limited to 7'; }
  return { value, eq1, eq2, note };
}

// ---------------------------------------------------------------------------
// 7.4 Longitudinal pressure distribution factor kL – Eq. (3)
// ---------------------------------------------------------------------------
export function kL(xRatio, ncg) {
  const n = clamp(ncg, 3, 6);
  const x = clamp(xRatio, 0, 1);
  if (x > 0.6) return 1;
  return Math.min(1, ((1 - 0.167 * n) / 0.6) * x + 0.167 * n);
}

// ---------------------------------------------------------------------------
// 7.5 Area pressure reduction factor kAR – Eq. (4) and Table 3
// ---------------------------------------------------------------------------
/** Structural component and boat type factor kR (7.5.1). */
export function kR({ element, planingMode, b, lu }) {
  if (planingMode) return 1.0;
  if (element === 'plate') return 1.5 - 3e-4 * b;
  return Math.max(1 - 2e-4 * lu, 0); // stiffener
}

/** Design area AD, m² (7.5.1). */
export function designArea({ element, b, l, s, lu }) {
  if (element === 'plate') return Math.min(l * b * 1e-6, 2.5 * b * b * 1e-6);
  return Math.max(lu * s * 1e-6, 0.33 * lu * lu * 1e-6);
}

/**
 * Minimum kAR (Table 3).
 * zone: 'bottom' | 'side' | 'deck' | 'superstructure'
 * construction: 'single' | 'sandwich'
 * Reading of Table 3 used here: single-skin hull panels, all stiffeners and all
 * deck/superstructure elements 0,25; sandwich bottom/side 0,4 aft of 0,4 LWL;
 * forward of 0,6 LWL in categories A and B 0,5 (motor bottom, sail bottom and
 * topside) or 0,4 (motor topside), with linear interpolation in between.
 */
export function kARmin({ zone, construction, element, category, type, xRatio }) {
  const hull = zone === 'bottom' || zone === 'side';
  if (!hull || construction !== 'sandwich' || element !== 'plate') return 0.25;
  if (category === 'C' || category === 'D') return 0.4;
  const fwd = type === 'motor' && zone === 'side' ? 0.4 : 0.5;
  if (xRatio <= 0.4) return 0.4;
  if (xRatio >= 0.6) return fwd;
  return lerp(xRatio, 0.4, 0.6, 0.4, fwd);
}

export function kAR({ kR: kr, mLDC, AD, min }) {
  const raw = (kr * 0.1 * Math.pow(mLDC, 0.15)) / Math.pow(AD, 0.3);
  return { raw, value: clamp(raw, min, 1) };
}

// ---------------------------------------------------------------------------
// 7.6 Hull side pressure reduction factor kZ – Eq. (5)
// ---------------------------------------------------------------------------
export function kZ(Z, h) {
  if (Z <= 0) return 0;
  return clamp((Z - h) / Z, 0, 1);
}

// ---------------------------------------------------------------------------
// 7.7 Superstructure factor kSUP (Table 4)
// ---------------------------------------------------------------------------
export const K_SUP = {
  front: { value: 1, label: 'Front, any area' },
  sideWalking: { value: 0.67, label: 'Side, walking area' },
  sideNonWalking: { value: 0.5, label: 'Side, non-walking area' },
  aft: { value: 0.5, label: 'Aft end, any area' },
  topLow: { value: 0.5, label: 'Top ≤ 800 mm above deck, walking area' },
  topHigh: { value: 0.35, label: 'Top > 800 mm above deck and upper tiers, walking area' },
};

// ---------------------------------------------------------------------------
// 8 Design pressures
// ---------------------------------------------------------------------------
export function basePressures(cr, ncg) {
  const m33 = Math.pow(cr.mLDC, 0.33);
  if (cr.type === 'sail') {
    return {
      PBS_BASE: (2 * m33 + 18) * cr.kSLS, // Eq. (21)
      PBS_MIN: 0.35 * m33 + 1.4 * cr.LWL * cr.kDC, // Eq. (20)
      PDS_BASE: 0.5 * m33 + 12, // Eq. (26)
      PSS_MIN: Math.max(1.4 * cr.LWL * cr.kDC, 5), // Eq. (23)
      PD_MIN: 5,
    };
  }
  return {
    PBMD_BASE: 2.4 * m33 + 20, // Eq. (9)
    PBMP_BASE: ((0.1 * cr.mLDC) / (cr.LWL * cr.BC)) * (1 + Math.sqrt(cr.kDC) * ncg), // Eq. (11)
    PBM_MIN: 0.45 * m33 + 0.9 * cr.LWL * cr.kDC, // Eq. (8)
    PDM_BASE: 0.35 * cr.LWL + 14.6, // Eq. (17)
    PSM_MIN: 0.9 * cr.LWL * cr.kDC, // Eq. (13)
    PD_MIN: 5, // Eq. (16)
  };
}

/**
 * Design pressure of one panel or stiffener.
 * @param {object} cr  result of craft()
 * @param {object} el  element:
 *   element 'plate' | 'stiffener'
 *   zone 'bottom' | 'side' | 'deck' | 'superstructure' | 'wtBulkhead' | 'tank'
 *   construction 'single' | 'sandwich'
 *   x (m from aft end of LWL), b, l (mm) for plates; s, lu (mm) for stiffeners
 *   h (m above WL, side), Z (m, top of hull above WL at that station)
 *   bottomFraction (0–1) for a panel across bottom and side (6.2.5)
 *   kSUP key for superstructures, hB (m) for bulkheads/tanks
 */
export function designPressure(cr, el) {
  const n = nCG(cr);
  const nForKL = Math.max(n.value, 3);
  const xRatio = clamp(el.x / cr.LWL, 0, 1);
  const kl = kL(xRatio, nForKL);
  const base = basePressures(cr, n.value);
  const trace = { nCG: n, xRatio, kL: kl, kDC: cr.kDC, base };

  if (el.zone === 'wtBulkhead') return { P: 7 * el.hB, governing: 'Watertight bulkhead, Eq. (28)', trace };
  if (el.zone === 'tank') return { P: 10 * Math.max(el.hB, 0), governing: 'Integral tank, Eq. (29)', trace };

  const minKAR = kARmin({ ...el, category: cr.category, type: cr.type, xRatio });
  const AD = designArea(el);
  const karFor = (planingMode) => kAR({ kR: kR({ ...el, planingMode }), mLDC: cr.mLDC, AD, min: minKAR });
  trace.AD = AD;
  trace.kARmin = minKAR;

  const kz = el.zone === 'side' ? kZ(el.Z, el.h) : null;
  if (kz !== null) trace.kZ = kz;

  let result;
  if (cr.type === 'sail') result = sailPressure(cr, el, base, kl, karFor(false), kz);
  else result = motorPressure(cr, el, base, kl, karFor, kz);

  // 6.2.5 – panel lying across bottom and side: weighted average.
  if (el.zone === 'side' && el.bottomFraction > 0) {
    const bottom = designPressure(cr, { ...el, zone: 'bottom', bottomFraction: 0 });
    const f = clamp(el.bottomFraction, 0, 1);
    result.P = f * bottom.P + (1 - f) * result.P;
    result.governing += ` + bottom part ${(f * 100).toFixed(0)} % (6.2.5)`;
  }

  // 8.4 – very large components.
  if (el.veryLarge) {
    const m33 = Math.pow(cr.mLDC, 0.33);
    const cap = el.zone === 'bottom' ? Math.max(0.45 * m33, 5) : el.zone === 'side' ? Math.max(0.3 * m33, 5) : 5;
    if (result.P > cap) { result.P = cap; result.governing += '; limited by 8.4 (very large component)'; }
  }
  return { ...result, trace: { ...trace, ...result.trace } };
}

function motorPressure(cr, el, base, kl, karFor, kz) {
  const disp = karFor(false);
  const plan = karFor(true);
  const kdc = cr.kDC;
  const PBMD = Math.max(base.PBMD_BASE * disp.value * kdc * kl, base.PBM_MIN); // Eq. (7)/(8)
  const PBMP = Math.max(base.PBMP_BASE * plan.value * kl, base.PBM_MIN); // Eq. (10)/(8)
  const planingGoverns = PBMP > PBMD;

  switch (el.zone) {
    case 'bottom': {
      const P = Math.max(PBMD, PBMP);
      return { P, governing: planingGoverns ? 'Bottom, planing mode, Eq. (10)' : 'Bottom, displacement mode, Eq. (7)', trace: { kAR_disp: disp, kAR_plan: plan, PBMD, PBMP } };
    }
    case 'side': {
      const PSMD = Math.max((base.PDM_BASE + kz * (base.PBMD_BASE - base.PDM_BASE)) * disp.value * kdc * kl, base.PSM_MIN); // Eq. (12)
      const PSMP = Math.max((base.PDM_BASE + kz * (0.25 * base.PBMP_BASE - base.PDM_BASE)) * plan.value * kdc * kl, base.PSM_MIN); // Eq. (14)
      let P, governing;
      if (cr.category === 'A' || cr.category === 'B') {
        P = Math.max(PSMD, PSMP);
        governing = PSMP > PSMD ? 'Side, planing mode, Eq. (14)' : 'Side, displacement mode, Eq. (12)';
      } else if (planingGoverns) { P = PSMP; governing = 'Side, planing mode (bottom governed by planing), Eq. (14)'; }
      else { P = PSMD; governing = 'Side, displacement mode, Eq. (12)'; }
      return { P, governing, trace: { kAR_disp: disp, kAR_plan: plan, PSMD, PSMP } };
    }
    case 'deck': {
      const P = Math.max(base.PDM_BASE * disp.value * kdc * kl, base.PD_MIN); // Eq. (15)/(16)
      return { P, governing: 'Weather deck, Eq. (15)', trace: { kAR: disp } };
    }
    case 'superstructure': {
      const ksup = (K_SUP[el.kSUP] ?? K_SUP.front).value;
      let P = base.PDM_BASE * kdc * disp.value * ksup; // Eq. (18)
      if (el.walking !== false && P < base.PD_MIN) P = base.PD_MIN;
      return { P, governing: 'Superstructure, Eq. (18)', trace: { kAR: disp, kSUP: ksup } };
    }
    default:
      throw new Error(`Unknown zone ${el.zone}`);
  }
}

function sailPressure(cr, el, base, kl, kar, kz) {
  const kdc = cr.kDC;
  switch (el.zone) {
    case 'bottom': {
      const P = Math.max(base.PBS_BASE * kar.value * kdc * kl, base.PBS_MIN); // Eq. (19)/(20)
      return { P, governing: 'Bottom, sailing craft, Eq. (19)', trace: { kAR: kar } };
    }
    case 'side': {
      const P = Math.max((base.PDS_BASE + kz * (base.PBS_BASE - base.PDS_BASE)) * kar.value * kdc * kl, base.PSS_MIN); // Eq. (22)/(23)
      return { P, governing: 'Side, sailing craft, Eq. (22)', trace: { kAR: kar } };
    }
    case 'deck': {
      const P = Math.max(base.PDS_BASE * kdc * kar.value * kl, base.PD_MIN); // Eq. (24)/(25)
      return { P, governing: 'Weather deck, sailing craft, Eq. (24)', trace: { kAR: kar } };
    }
    case 'superstructure': {
      const ksup = (K_SUP[el.kSUP] ?? K_SUP.front).value;
      let P = base.PDS_BASE * kar.value * kdc * ksup; // Eq. (27)
      if (el.walking !== false && P < base.PD_MIN) P = base.PD_MIN;
      return { P, governing: 'Superstructure, sailing craft, Eq. (27)', trace: { kAR: kar, kSUP: ksup } };
    }
    default:
      throw new Error(`Unknown zone ${el.zone}`);
  }
}

// ---------------------------------------------------------------------------
// 10.1 Thickness adjustment factors
// ---------------------------------------------------------------------------
/** Panel aspect ratio factor for strength k2 (Table 5). */
export function k2(aspect) {
  const r = Math.max(aspect, 1);
  if (r > 2) return 0.5;
  const v = (0.271 * r * r + 0.91 * r - 0.554) / (r * r - 0.313 * r + 1.351);
  return clamp(v, 0.308, 0.5);
}

/** Panel aspect ratio factor for stiffness k3 (Table 5). */
export function k3(aspect) {
  const r = Math.max(aspect, 1);
  if (r > 2) return 0.028;
  const v = (0.027 * r * r - 0.029 * r + 0.011) / (r * r - 1.463 * r + 1.108);
  return clamp(v, 0.014, 0.028);
}

/** Curvature correction factor for plates kC (Table 6) and stiffeners kCS (Table 16). */
export function kCurvature(crown, span) {
  if (!crown || !span) return 1;
  const r = crown / span;
  if (r <= 0.03) return 1;
  if (r <= 0.18) return clamp(1.1 - 3.33 * r, 0.5, 1);
  return 0.5;
}

/** Shear strength aspect ratio factor kSHC (Table 12). */
export function kSHC(aspect) {
  const r = Math.max(aspect, 1);
  if (r < 2) return 0.035 + 0.394 * r - 0.09 * r * r;
  return interpTable(r, [2, 3, 4], [0.463, 0.493, 0.5]);
}

// ---------------------------------------------------------------------------
// Annex C – FRP laminate default properties (E glass / polyester)
// ---------------------------------------------------------------------------
/** Nominal glass content by mass ψ (Table C.2). */
export const PSI_NOMINAL = {
  csm: { label: 'Chopped strand mat (hand lay-up or spray)', simple: 0.3, complex: 0.25, vacuum: 0.36 },
  wr: { label: 'Woven roving', simple: 0.48, complex: 0.36, vacuum: 0.58 },
  multi: { label: 'Multidirectional fabric', simple: 0.5, complex: 0.38, vacuum: 0.6 },
  ud: { label: 'Unidirectional fabric', simple: 0.55, complex: 0.41, vacuum: 0.66 },
};

/** Roving-mat combination ψ (Table C.2), R = mat mass / total glass mass. */
export function psiRovingMat(R, process = 'simple') {
  if (process === 'complex') return 0.35 - 0.11 * R;
  if (process === 'vacuum') return 0.56 - 0.22 * R;
  return 0.46 - 0.18 * R;
}

/** Thickness per unit dry fibre mass, mm per kg/m² (Eq. C.1, C.3, C.5). */
export function thicknessPerFibreMass(psi, fibre = 'glass') {
  if (fibre === 'carbon') return (1.8 / psi - 0.6) / 2.16;
  if (fibre === 'aramid') return (1.45 / psi - 0.25) / 1.74;
  return (2.56 / psi - 1.36) / 3.072;
}

/** Overall ψ of a stack of plies {w (kg/m²), psi} – Example C.3.2. */
export function overallPsi(plies) {
  const w = plies.reduce((s, p) => s + p.w, 0);
  const total = plies.reduce((s, p) => s + p.w / p.psi, 0);
  return w / total;
}

/**
 * Default mechanical properties of E glass/polyester laminates (Table C.4 a)).
 * kind: 'mixed' (hand-laid CSM, mat/roving, WR, 0/90), 'sprayed', 'ud'.
 * evalLevel 'c' multiplies the values by 0,8 (C.1.4).
 */
export function glassLaminate(psi, { kind = 'mixed', evalLevel = 'c' } = {}) {
  const f = evalLevel === 'c' ? 0.8 : 1;
  let p;
  if (kind === 'ud') {
    p = {
      sigma_ut: 880 * psi * psi + 140 * psi + 140,
      sigma_uc: 250 * psi + 190,
      sigma_uf: null,
      tau_u: 50,
      E: 46600 * psi * psi + 7200 * psi + 7250,
      G: 14380 * psi * psi - 10560 * psi + 3840,
    };
    p.sigma_uf = (2.5 * p.sigma_ut) / (1 + p.sigma_ut / p.sigma_uc);
  } else {
    p = {
      sigma_ut: 800 * psi * psi - 80 * psi + 37,
      sigma_uc: 150 * psi + 72,
      sigma_uf: 502 * psi * psi + 107,
      tau_u: 80 * psi + 38,
      E: 38000 * psi - 5000,
      G: 1700 * psi + 2240,
    };
    if (kind === 'sprayed') {
      p.sigma_ut = 150 * psi + 25;
      p.sigma_uf = 300 * psi * psi + 107;
    }
  }
  const out = {};
  for (const [k, v] of Object.entries(p)) out[k] = v * f; // C.1.4: all values × 0,8 at level EL-c
  out.tau_inter = (22.5 - 17.5 * psi) * f;
  out.psi = psi;
  out.factor = f;
  return out;
}

// ---------------------------------------------------------------------------
// Annex D – Sandwich core default properties (Table D.1)
// ---------------------------------------------------------------------------
export const CORES = {
  balsa: { label: 'End-grain balsa', range: [90, 220], designShare: 0.5, props: (r) => ({ tau_u: 0.0178 * r - 0.34, G: 0.868 * r - 1.43, sigma_uc: 0.102 * r - 5, Eco: 30.7 * r - 1350 }) },
  pvc1: { label: 'Cross-linked PVC (type I)', range: [36, 250], designShare: 0.55, props: (r) => ({ tau_u: 0.0024 * Math.pow(r, 1.334), G: 0.1633 * Math.pow(r, 1.136), sigma_uc: 0.0014 * Math.pow(r, 1.487), Eco: 0.1138 * Math.pow(r, 1.449) }) },
  pvc2: { label: 'Cross-linked PVC (type II)', range: [33, 250], designShare: 0.55, props: (r) => ({ tau_u: 0.017 * r - 0.29, G: 0.33 * r - 1, sigma_uc: 0.025 * r - 0.69, Eco: 1.2 * r - 18 }) },
  linearPvc: { label: 'Linear PVC', range: [50, 140], designShare: 0.65, props: (r) => ({ tau_u: 0.014 * r - 0.33, G: 0.29 * r - 5.3, sigma_uc: 0.012 * r - 0.24, Eco: 0.84 * r - 19 }) },
  san: { label: 'SAN', range: [60, 210], designShare: 0.65, props: (r) => ({ tau_u: 0.017 * r - 2e-5 * r * r - 0.613, G: 0.46 * r - 20, sigma_uc: 6.7e-4 * Math.pow(r, 1.59), Eco: 0.024 * Math.pow(r, 1.75) }) },
};

export function coreProperties(type, density) {
  const c = CORES[type];
  if (!c) throw new Error(`Unknown core ${type}`);
  const p = c.props(density);
  return { ...p, tau_d: c.designShare * p.tau_u, label: c.label, inRange: density >= c.range[0] && density <= c.range[1] };
}

/** Minimum design core shear strength for bottom panels (Table 13). */
export function minCoreShear(LH) {
  if (LH < 10) return 0.25;
  if (LH <= 15) return 0.25 + 0.03 * (LH - 10);
  return 0.4;
}

// ---------------------------------------------------------------------------
// Annex F – Metals (Tables F.1 and F.2)
// ---------------------------------------------------------------------------
export const METALS = {
  'steel-E24': { label: 'Mild steel E24 / A', kind: 'steel', su: 400, suw: 400, sy: 235, syw: 235 },
  'steel-AH32': { label: 'Steel AH32', kind: 'steel', su: 470, suw: 470, sy: 315, syw: 315 },
  'steel-AH36': { label: 'Steel AH36', kind: 'steel', su: 490, suw: 490, sy: 355, syw: 355 },
  'al-5083-H111': { label: 'Aluminium 5083-O/H111', kind: 'aluminium', su: 275, suw: 270, sy: 125, syw: 125 },
  'al-5083-H32': { label: 'Aluminium 5083-H32', kind: 'aluminium', su: 305, suw: 270, sy: 215, syw: 125 },
  'al-5086-H34': { label: 'Aluminium 5086-H34', kind: 'aluminium', su: 275, suw: 240, sy: 185, syw: 100 },
  'al-5754-H24': { label: 'Aluminium 5754-H24', kind: 'aluminium', su: 240, suw: 190, sy: 190, syw: 80 },
  'al-5383-H34': { label: 'Aluminium 5383-H34', kind: 'aluminium', su: 305, suw: 290, sy: 220, syw: 145 },
  'al-6061-T6': { label: 'Aluminium 6061-T5/T6 (profiles)', kind: 'aluminium', su: 260, suw: 165, sy: 240, syw: 115 },
  'al-6082-T6': { label: 'Aluminium 6082-T5/T6 (profiles)', kind: 'aluminium', su: 310, suw: 170, sy: 260, syw: 115 },
};

/** Plating design stress (Table 8). welded applies to aluminium. */
export function metalPlateDesignStress(m, welded = true) {
  const su = welded ? m.suw : m.su;
  const sy = welded ? m.syw : m.sy;
  return Math.min(0.6 * su, 0.9 * sy);
}

/** Stiffener design stresses (Table 18). */
export function metalStiffenerDesignStress(m, welded = true) {
  if (m.kind === 'steel') return { sigma_d: 0.8 * m.sy, tau_d: 0.45 * m.sy };
  const sy = welded ? m.syw : m.sy;
  return { sigma_d: 0.7 * sy, tau_d: 0.4 * sy };
}

// ---------------------------------------------------------------------------
// 10 Plating
// ---------------------------------------------------------------------------
function panelFactors({ b, l, crown }) {
  const aspect = Math.max(l, b) / Math.min(l, b);
  const bs = Math.min(l, b);
  return { aspect, b: bs, k2: k2(aspect), k3: k3(aspect), kC: kCurvature(crown, bs), kSHC: kSHC(aspect) };
}

/** Required thickness of a single-skin isotropic plate, Eq. (35)/(36)/(37). */
export function plateThickness({ P, b, k2: k2v, kC, sigma_d }) {
  return b * kC * Math.sqrt((P * k2v) / (1000 * sigma_d));
}

/**
 * FRP single-skin plating (10.2) with minimum fibre mass (10.6).
 * lam: { psi, kind, evalLevel, sigma_uf? }
 */
export function frpSingleSkin(cr, panel, P, lam, { zone }) {
  const f = panelFactors(panel);
  const props = glassLaminate(lam.psi, lam);
  const sigma_uf = lam.sigma_uf ?? props.sigma_uf;
  const sigma_d = 0.5 * sigma_uf; // Table 7
  const t = plateThickness({ P, b: f.b, k2: f.k2, kC: f.kC, sigma_d });
  const tPerW = thicknessPerFibreMass(lam.psi, lam.fibre);
  const w = t / tPerW;
  const min = minimumFrp(cr, zone, lam.k5 ?? 1);
  const wReq = Math.max(w, min.w);
  return {
    ...f,
    sigma_uf,
    sigma_d,
    t_strength: t,
    w_strength: w,
    w_min: min.w,
    minNote: min.note,
    w_required: wReq,
    t_required: wReq * tPerW,
    governs: wReq === w ? 'strength, Eq. (35)' : `minimum, ${min.note}`,
    tPerW,
  };
}

/** Minimum dry fibre mass for FRP hulls (Eq. 47) and decks (Table 15). */
export function minimumFrp(cr, zone, k5 = 1) {
  const m33 = Math.pow(cr.mLDC, 0.33);
  if (zone === 'bottom') return { w: 0.43 * k5 * (1.5 + 0.03 * cr.V + 0.15 * m33), note: 'Eq. (47), bottom' };
  if (zone === 'side') return { w: 0.43 * k5 * (1.5 + 0.15 * m33), note: 'Eq. (47), side/transom' };
  if (zone === 'deck') {
    const t = k5 * (1.45 + 0.14 * cr.LWL);
    // Table 15 thickness, translated to fibre mass with ψ = 0,30 reference (Eq. C.1).
    return { w: t / thicknessPerFibreMass(0.3), t, note: 'Table 15, deck (ψ 0,30)' };
  }
  return { w: 0, note: 'no minimum' };
}

/** Metal plating (10.3) with minimum thickness (Eq. 46, Table 15). */
export function metalPlate(cr, panel, P, metalKey, { zone, welded = true }) {
  const m = METALS[metalKey];
  const f = panelFactors(panel);
  const sigma_d = metalPlateDesignStress(m, welded);
  const t = plateThickness({ P, b: f.b, k2: f.k2, kC: f.kC, sigma_d });
  const min = minimumMetal(cr, zone, m);
  const tReq = Math.max(t, min.t);
  return { ...f, sigma_d, t_strength: t, t_min: min.t, minNote: min.note, t_required: tReq, governs: tReq === t ? 'strength, Eq. (36)' : `minimum, ${min.note}`, material: m.label };
}

export function minimumMetal(cr, zone, m) {
  const m33 = Math.pow(cr.mLDC, 0.33);
  const steel = m.kind === 'steel';
  if (zone === 'deck') return { t: steel ? 1.5 + 0.07 * cr.LWL : 1.35 + 0.06 * cr.LWL, note: 'Table 15, deck' };
  if (zone !== 'bottom' && zone !== 'side') return { t: 0, note: 'no minimum' };
  const k5 = Math.sqrt((steel ? 240 : 125) / m.sy);
  const A = 1.0;
  const k7 = zone === 'bottom' ? (steel ? 0.015 : 0.02) : 0;
  const k8 = steel ? 0.08 : 0.1;
  return { t: k5 * (A + k7 * cr.V + k8 * m33), note: `Eq. (46), ${zone}` };
}

/** Plywood / laminated wood plating (10.4). sigma_uf parallel to b. */
export function woodPlate(cr, panel, P, { sigma_uf, zone }) {
  const f = panelFactors(panel);
  const sigma_d = 0.5 * sigma_uf; // Table 9
  const t = f.b * Math.sqrt((P * 0.5) / (1000 * sigma_d)); // Eq. (37), k2 = 0,5
  let min = { t: 0, note: 'no minimum' };
  const m33 = Math.pow(cr.mLDC, 0.33);
  const k5 = Math.sqrt(30 / sigma_uf);
  if (zone === 'bottom') min = { t: k5 * (3 + 0.05 * cr.V + 0.3 * m33), note: 'Eq. (46), bottom' };
  else if (zone === 'side') min = { t: k5 * (3 + 0.3 * m33), note: 'Eq. (46), side' };
  else if (zone === 'deck') min = { t: 3.8 + 0.17 * cr.LWL, note: 'Table 15, deck' };
  const tReq = Math.max(t, min.t);
  return { ...f, k2: 0.5, sigma_d, t_strength: t, t_min: min.t, minNote: min.note, t_required: tReq, governs: tReq === t ? 'strength, Eq. (37)' : `minimum, ${min.note}` };
}

/** Section properties of a sandwich strip 1 cm wide (D.2.2). */
export function sandwichSection(to, ti, tc) {
  const ts = tc + 0.5 * (to + ti);
  const I = 1e-3 * ((to * ti * ts * ts) / (to + ti) + (to ** 3 + ti ** 3) / 12); // cm4/cm
  const yo = (ts * ti) / (to + ti) + to / 2;
  const yi = (ts * to) / (to + ti) + ti / 2;
  return { ts, I, yo, yi, SMo: (10 * I) / yo, SMi: (10 * I) / yi };
}

/**
 * FRP sandwich plating (10.5).
 * s: { to, ti, tc (mm), skinPsi, skinKind, evalLevel, core, coreDensity, k4?, k5?, k6? }
 */
export function frpSandwich(cr, panel, P, s, { zone }) {
  const f = panelFactors(panel);
  const b = Math.min(f.b, 330 * cr.LH);
  const skin = glassLaminate(s.skinPsi, { kind: s.skinKind ?? 'mixed', evalLevel: s.evalLevel ?? 'c' });
  const core = coreProperties(s.core, s.coreDensity);
  const Eio = skin.E;
  const sigma_dto = 0.5 * skin.sigma_ut;
  const wrinkling = 0.3 * Math.cbrt(skin.E * core.Eco * core.G); // Eq. (41)
  const sigma_dci = Math.min(0.5 * skin.sigma_uc, wrinkling);
  const req = {
    SMo: (b * b * f.kC * f.kC * P * f.k2) / (6e5 * sigma_dto), // Eq. (38)
    SMi: (b * b * f.kC * f.kC * P * f.k2) / (6e5 * sigma_dci), // Eq. (39)
    I: (b ** 3 * f.kC ** 3 * P * f.k3) / (12e6 * 0.017 * Eio), // Eq. (40)
  };
  let tauD = core.tau_d;
  const tauMin = zone === 'bottom' ? minCoreShear(cr.LH) : 0;
  const ts_req = (f.kC * f.kSHC * P * b) / (1000 * tauD); // Eq. (43)
  const act = sandwichSection(s.to, s.ti, s.tc);
  const k4 = s.k4 ?? (zone === 'bottom' ? 1 : zone === 'side' ? 0.9 : 0.7);
  const k5 = s.k5 ?? 1;
  const k6 = s.k6 ?? 1;
  const wos = k4 * k5 * k6 * (0.1 * cr.LWL + 0.15); // Eq. (44)
  const wis = 0.7 * wos; // Eq. (45)
  const tPerW = thicknessPerFibreMass(s.skinPsi);
  const checks = [
    { label: 'Outer skin section modulus', required: req.SMo, actual: act.SMo, unit: 'cm³/cm' },
    { label: 'Inner skin section modulus', required: req.SMi, actual: act.SMi, unit: 'cm³/cm' },
    { label: 'Second moment', required: req.I, actual: act.I, unit: 'cm⁴/cm' },
    { label: 'Shear: distance between skins', required: ts_req, actual: act.ts, unit: 'mm' },
    { label: 'Core design shear strength', required: tauMin, actual: tauD, unit: 'N/mm²' },
    { label: 'Outer skin fibre mass', required: wos, actual: s.to / tPerW, unit: 'kg/m²' },
    { label: 'Inner skin fibre mass', required: wis, actual: s.ti / tPerW, unit: 'kg/m²' },
  ].map((c) => ({ ...c, ratio: c.actual / c.required, ok: c.required === 0 || c.actual >= c.required * 0.9999 }));
  return { ...f, b, skin, core, sigma_dto, sigma_dci, wrinkling, req, act, ts_req, wos, wis, checks, ok: checks.every((c) => c.ok) };
}

// ---------------------------------------------------------------------------
// 11 Stiffeners
// ---------------------------------------------------------------------------
/** Effective plating extent be (Table 19). */
export function effectivePlating(material, t, s, { to = 0, ti = 0 } = {}) {
  const factor = { steel: 80, aluminium: 60, frp: 20, sandwich: 20, wood: 15 }[material];
  const t0 = material === 'sandwich' ? to + ti : t;
  return Math.min(factor * t0, s);
}

/**
 * Stiffener requirements (11.4).
 * st: { s, lu (mm), crown (mm), floating (bool) }
 * mat: { sigma_d, tau_d, Etc? (FRP) }
 */
export function stiffenerRequirements(P, st, mat) {
  const kCS = kCurvature(st.crown, st.lu);
  const kSA = st.floating ? 7.5 : 5; // Table 17
  const AW = (kSA * P * st.s * st.lu * 1e-6) / mat.tau_d; // Eq. (48) cm²
  const SM = (83.33 * kCS * P * st.s * st.lu * st.lu * 1e-9) / mat.sigma_d; // Eq. (49) cm³
  const I = mat.Etc ? (26 * Math.pow(kCS, 1.5) * P * st.s * st.lu ** 3 * 1e-11) / (0.05 * mat.Etc) : null; // Eq. (50) cm4
  const Fd = 5e-4 * P * st.s * st.lu; // Eq. (51) N
  const Md = 83.33e-9 * kCS * P * st.s * st.lu * st.lu; // Eq. (52) N·m
  return { kCS, kSA, AW, SM, I, Fd, Md };
}

/** FRP stiffener design stresses (Table 18). */
export function frpStiffenerStresses(lam) {
  return { sigma_dt: 0.5 * lam.sigma_ut, sigma_dc: 0.5 * lam.sigma_uc, tau_d: 0.5 * lam.tau_u, Etc: lam.E };
}

/**
 * Section properties of a stiffener with attached plating, built from
 * rectangles {b (width, mm), h (height, mm), y (bottom of rectangle above the
 * outer face of plating, mm)} of the same material.
 */
export function sectionProperties(rects) {
  const A = rects.reduce((s, r) => s + r.b * r.h, 0);
  const yNA = rects.reduce((s, r) => s + r.b * r.h * (r.y + r.h / 2), 0) / A;
  const I = rects.reduce((s, r) => s + (r.b * r.h ** 3) / 12 + r.b * r.h * (r.y + r.h / 2 - yNA) ** 2, 0);
  const yTop = Math.max(...rects.map((r) => r.y + r.h));
  const yBot = Math.min(...rects.map((r) => r.y));
  return {
    A: A / 100, // cm²
    yNA,
    I: I / 1e4, // cm4
    SMtop: I / (yTop - yNA) / 1000, // cm³ (crown / flange)
    SMplate: I / (yNA - yBot) / 1000, // cm³ (plating)
  };
}

/**
 * Top-hat stiffener on single-skin plating.
 * g: { h (web height incl. crown, mm), crownWidth, baseWidth (mm), tCrown, tWeb (each web), tPlate, be (mm) }
 */
export function topHat(g) {
  const rects = [
    { b: g.be, h: g.tPlate, y: 0 }, // effective plating
    { b: g.crownWidth, h: g.tCrown, y: g.tPlate + g.h - g.tCrown }, // crown
  ];
  const webH = g.h - g.tCrown;
  // Two webs, projected as vertical rectangles (slope neglected, conservative for I).
  rects.push({ b: 2 * g.tWeb, h: webH, y: g.tPlate });
  const p = sectionProperties(rects);
  return { ...p, AW: (2 * webH * g.tWeb) / 100, rects };
}

/** Flat bar or T/L bar on metal plating. g: { hw, tw, bf (flange width, 0 for flat bar), tf, tPlate, be } */
export function metalBar(g) {
  const rects = [
    { b: g.be, h: g.tPlate, y: 0 },
    { b: g.tw, h: g.hw, y: g.tPlate },
  ];
  if (g.bf > 0 && g.tf > 0) rects.push({ b: g.bf, h: g.tf, y: g.tPlate + g.hw });
  const p = sectionProperties(rects);
  return { ...p, AW: (g.hw * g.tw) / 100, rects };
}

/** Maximum proportions h/tw and d/tf (Table 20), with Table 21 relaxation. */
export const PROPORTIONS = {
  frp: { flat: 8, tee: 30, teeFlange: 8, topHatWeb: 30, topHatCrown: 21 },
  aluminium: { flat: 12, tee: 40, teeFlange: 12, topHatWeb: 40, topHatCrown: 25 },
  steel: { flat: 15, tee: 50, teeFlange: 15, topHatWeb: 50, topHatCrown: 40 },
  carbon: { flat: 13, tee: 40, teeFlange: 13, topHatWeb: 40, topHatCrown: 35 },
  plywood: { flat: 10, tee: 40, teeFlange: 10, topHatWeb: 40, topHatCrown: 25 },
};

/** Structural plywood bulkhead thickness, Eq. (54). Db in m. */
export const plywoodBulkhead = (Db) => 7 * Db;
