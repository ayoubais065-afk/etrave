// ÉTRAVE – Local scantlings in accordance with Bureau Veritas Rule Note NR600
// (Hull structure and arrangement for the classification of cargo ships less
// than 65 m and non-cargo ships less than 90 m), edition March 2026.
//
// Scope implemented: monohulls; local external pressures (sea pressure on
// bottom, side and exposed deck, side shell impact, bottom slamming of planing
// hulls); steel and aluminium plating and secondary stiffeners; composite
// panels through nr546.js. References are given as "Ch x, Sec y, [n]".
// The rule text is not reproduced; consult NR600 for the full requirements.
//
// Units: lengths m (plate thickness mm), displacement t, pressures kN/m²,
// stresses N/mm², section modulus cm³, shear area cm².

const RHO_G = 1.025 * 9.81; // sea water ρ·g, kN/m³
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

// ---------------------------------------------------------------------------
// Ch 1, Sec 1 – general data
// ---------------------------------------------------------------------------
/** Navigation coefficient n (Ch 1, Sec 1, Tab 2 and Tab 3). */
export const NAVIGATION = {
  unrestricted: { n: 1.0, n1: 1.0 },
  summer: { n: 0.9, n1: 0.9 },
  tropical: { n: 0.8, n1: 0.8 },
  coastal: { n: 0.8, n1: 0.7 },
  sheltered: { n: 0.65, n1: 0 }, // side shell impact may be disregarded (Ch 3, Sec 3, [3.1.1])
};

/** foc by type of service (Ch 3, Sec 3, Tab 5). */
export const SERVICE_FOC = { passenger: 0.666, tourism: 0.666, cargo: 0.666, ferry: 0.666, fishing: 1.0, supply: 1.0, pilot: 1.333, patrol: 1.333, rescue: 1.666 };

/**
 * Normalises the ship data.
 * s: { group 'nonCargo'|'cargo', service, navigation, LWL, LHULL, B (BWL at mid
 *      LWL), D, T, TB?, displacement (t), V (kn), planing (bool),
 *      deadriseLCG (deg), aCG? (g, designer value) }
 */
export function ship(s) {
  const LW = 0.5 * (s.LWL + s.LHULL); // Ch 1, Sec 1, [4.2.6]
  const CB = s.displacement / (1.025 * s.LWL * s.B * s.T); // [4.6.1], monohull
  const CW = 0.625 * (118 - 0.36 * LW) * LW * 1e-3; // Ch 3, Sec 3, symbols
  const nav = NAVIGATION[s.navigation] ?? NAVIGATION.unrestricted;
  const TB = s.TB > 0 ? s.TB : 0.03 * s.LWL;
  const FnL = s.V / Math.sqrt(s.LWL);
  const planingGuidance = s.V >= 7.16 * Math.pow(s.displacement, 1 / 6); // Ch 1, Sec 1, [2.1.5] Note 1
  const warnings = [];
  if (s.group === 'cargo' && s.LWL >= 65) warnings.push('L65');
  if (s.LWL >= 90) warnings.push('L90');
  if (s.planing && FnL >= 10) warnings.push('V10'); // planing hulls with V ≥ 10 √LWL: case by case
  return { ...s, LW, CB, CW, n: nav.n, n1: nav.n1, TB, FnL, planingGuidance, warnings };
}

/** Longitudinal area 1–4 (Ch 1, Sec 3, [2.2.1]); x from the aft end of LWL. */
export function area(sh, x) {
  const r = x / sh.LWL;
  if (r < 0.25) return 1;
  if (r < 0.7) return 2;
  if (r < 0.85) return 3;
  return 4;
}

// ---------------------------------------------------------------------------
// Ch 3, Sec 3 – local external pressures
// ---------------------------------------------------------------------------
/** Ship relative motion h1 by area (Ch 3, Sec 3, Tab 1), monohull (CH = 1). */
export function relativeMotion(sh) {
  const CH = 1.0;
  let m, A, E, FE;
  if (sh.group === 'cargo') {
    m = Math.min(0.36 * sh.n * sh.CW * (sh.CB + 0.7), sh.T, sh.D - 0.9 * sh.TB);
    const f = 4.35 / Math.sqrt(sh.CB) - 3.25;
    A = Math.max(0.63 * f * m, m);
    FE = 1.2 * m * f * CH;
    E = Math.min(m + 0.125 * FE, FE);
  } else {
    m = Math.min((0.38 * sh.CW + 0.3) * sh.n, sh.T);
    A = 1.1 * m;
    FE = 1.7 * m * (7.6 / Math.pow(sh.CB, 0.1) - 6.4) * CH;
    E = (1.4 * m + 0.7 * FE) / 2;
  }
  return { 1: A, 2: m, 3: E, 4: FE, m };
}

/** Roll angle AR (deg), monohull. */
const rollAngle = (sh) => (sh.group === 'cargo' ? 20 : 25);

/** Sea pressure on the bottom, kN/m² (Ch 3, Sec 3, [2.2.1]). */
export function bottomSeaPressure(sh, x, z0 = 0) {
  const h1 = relativeMotion(sh)[area(sh, x)];
  return { p: RHO_G * (sh.T + h1 - z0), h1 };
}

/** Exposed deck green-sea pressure, kN/m² (Ch 3, Sec 3, [2.2.2]). */
export const PHI1 = { freeboard: 1.0, tier1: 0.75, tier2: 0.56, tier3: 0.42, tier4: 0.32 };
export function deckPressure(sh, x, zd, { tier = 'freeboard', protectedDeck = false } = {}) {
  const phi1 = PHI1[tier] ?? 1;
  const phi2 = Math.max(sh.LWL / 120, 0.42);
  const phi3 = protectedDeck ? 0.7 : 1.0;
  const p0 = bottomSeaPressure(sh, x, 0).p;
  const fwd = x / sh.LWL >= 0.7;
  const pdmin = fwd ? Math.max(19.6 * sh.n * phi1 * phi2 * phi3, 7) : Math.max(17.5 * sh.n * phi1 * phi2 * phi3, 5);
  const p = Math.max((p0 - 10 * zd) * phi1 * phi2 * phi3, pdmin);
  return { p, p0, pdmin, phi1, phi2, phi3, governing: p === pdmin ? 'pdmin' : 'green sea' };
}

/** Sea pressure on the side shell at height z above the base line (Ch 3, Sec 3, [2.2.1]). */
export function sideSeaPressure(sh, x, z, z0 = 0) {
  const { p: pb, h1 } = bottomSeaPressure(sh, x, z0);
  const AR = (rollAngle(sh) * Math.PI) / 180;
  const p1 = RHO_G * (sh.T + h1 - z);
  const p2 = RHO_G * (sh.T + ((0.8 * sh.B) / 2) * Math.sin(AR) - z);
  const pdmin = deckPressure(sh, x, z).pdmin; // φ1 = φ3 = 1
  const p = Math.min(Math.max(p1, p2, pdmin), pb);
  return { p, p1, p2, pdmin, pBottom: pb, h1 };
}

/** Side shell impact pressure pssmin, kN/m² (Ch 3, Sec 3, [3.1.2], Tab 2). */
export function sideImpact(sh, x, z) {
  if (z <= sh.T || sh.n1 === 0) return { p: 0, Ci: 0, applies: false };
  const fwd = x / sh.LWL >= 0.7;
  const dz = z - sh.T;
  let Ci;
  if (dz <= 1) Ci = fwd ? 70 : 55;
  else if (dz <= 3) Ci = fwd ? 55 : 40;
  else Ci = 30;
  return { p: Ci * sh.n1, Ci, applies: true };
}

/** soc (Ch 3, Sec 3, Tab 6). */
export function soc(sh) {
  switch (sh.navigation) {
    case 'summer': return 0.3;
    case 'tropical':
    case 'coastal': return 0.23;
    case 'sheltered': return 0.14;
    default: return Math.max(0.2 + 0.6 / sh.FnL, 0.32);
  }
}

/** Design vertical acceleration aCG, g (Ch 3, Sec 3, [3.3.4]–[3.3.5]). */
export function designAcceleration(sh) {
  if (sh.aCG > 0) return { aCG: sh.aCG, source: 'designer' };
  const foc = SERVICE_FOC[sh.service] ?? 1;
  return { aCG: foc * soc(sh) * sh.FnL, source: 'guidance', foc, soc: soc(sh) };
}

const K1 = { 1: 0.6, 2: 0.9, 3: 1.0, 4: 0.75 }; // Tab 4
export const K2_MIN = {
  metal: { plate: 0.5, secondary: 0.45, primary: 0.35 },
  composite: { plate: 0.15, secondary: 0.15, primary: 0.35 },
};

/**
 * Bottom slamming pressure of planing hulls, kN/m² (Ch 3, Sec 3, [3.3]).
 * el: { x, sa (m², supported area), element 'plate'|'secondary'|'primary',
 *       material 'metal'|'composite', deadrise (deg, at the section) }
 */
export function slamming(sh, el) {
  if (!sh.planing) return { p: 0, applies: false };
  const { aCG } = designAcceleration(sh);
  const k1 = K1[area(sh, el.x)];
  const ad = clamp(el.deadrise ?? sh.deadriseLCG, 10, 50);
  const adCG = clamp(sh.deadriseLCG, 10, 50);
  const K3 = Math.min((70 - ad) / (70 - adCG), 1);
  const Sr = (0.7 * sh.displacement) / sh.T;
  const u = (100 * el.sa) / Sr;
  const u75 = Math.pow(u, 0.75);
  const K2raw = 0.455 - (0.35 * (u75 - 1.7)) / (u75 + 1.7);
  const K2 = Math.max(K2raw, K2_MIN[el.material][el.element]);
  const psl1 = 100 * sh.T * k1 * K3 * aCG;
  return { p: psl1 * K2, psl1, K1: k1, K2, K3, aCG, u, Sr, applies: true };
}

// ---------------------------------------------------------------------------
// Ch 1, Sec 2 – materials
// ---------------------------------------------------------------------------
/** Hull steel grades (Ch 1, Sec 2, Tab 1 and Tab 2). */
export const STEELS = {
  A: { label: 'A / B / D / E (ReH 235)', ReH: 235, k: 1.0 },
  AH32: { label: 'AH32 – FH32 (ReH 315)', ReH: 315, k: 0.78 },
  AH36: { label: 'AH36 – FH36 (ReH 355)', ReH: 355, k: 0.72 },
  AH40: { label: 'AH40 – FH40 (ReH 390)', ReH: 390, k: 0.68 },
};

/**
 * Aluminium alloys: R'lim = min(R'p0.2, 0.7 R'm) in welded condition
 * (Ch 1, Sec 2, [3.1.2]). The welded values are defined in NR561; the values
 * below are typical and must be checked against NR561 and the supplier.
 */
export const ALUMINIUMS = {
  '5083-O/H111': { label: '5083-O/H111', Rp02w: 125, Rmw: 275 },
  '5083-H321': { label: '5083-H321', Rp02w: 125, Rmw: 275 },
  '5086-H32': { label: '5086-H32', Rp02w: 95, Rmw: 240 },
  '5754-H22': { label: '5754-H22', Rp02w: 80, Rmw: 190 },
  '5383-H321': { label: '5383-H321', Rp02w: 145, Rmw: 290 },
  '6061-T6': { label: '6061-T6 (profiles)', Rp02w: 115, Rmw: 165 },
  '6082-T6': { label: '6082-T6 (profiles)', Rp02w: 115, Rmw: 170 },
};

/** Material data for scantling: R (N/mm²) and k. */
export function metal(kind, grade) {
  if (kind === 'steel') {
    const st = STEELS[grade] ?? STEELS.A;
    return { kind, label: st.label, k: st.k, R: 235 / st.k };
  }
  const al = ALUMINIUMS[grade] ?? ALUMINIUMS['5083-O/H111'];
  const Rlim = Math.min(al.Rp02w, 0.7 * al.Rmw);
  return { kind, label: al.label, k: 100 / Rlim, R: Rlim };
}

// ---------------------------------------------------------------------------
// Ch 2, Sec 3 – permissible stresses (steel and aluminium)
// ---------------------------------------------------------------------------
/**
 * Plating, σlocam (Tab 2).
 * load: 'sea' | 'dynamic' | 'flatBottom' | 'flooding' | 'test'
 */
export function plateStress(m, { load, globalStrength, framing }) {
  const steel = m.kind === 'steel';
  let f;
  switch (load) {
    case 'dynamic': f = 0.75; break;
    case 'flatBottom': f = 0.9; break;
    case 'test': f = steel ? 0.85 : 0.9; break;
    case 'flooding':
      if (!globalStrength) f = steel ? 0.75 : framing === 'transverse' ? 0.8 : 0.85;
      else f = framing === 'transverse' ? (steel ? 0.6 : 0.45) : 0.7;
      break;
    default:
      if (!globalStrength) f = 0.7;
      else f = framing === 'transverse' ? (steel ? 0.5 : 0.45) : (steel ? 0.6 : 0.65);
  }
  return { sigma: f * m.R, factor: f };
}

/** Secondary stiffeners, σlocam and τlocam (Tab 3). */
export function stiffenerStress(m, { load, globalStrength }) {
  let fs, ft;
  switch (load) {
    case 'dynamic': fs = 0.9; ft = 0.5; break;
    case 'flatBottom': fs = 0.9; ft = 0.55; break;
    case 'test': fs = 0.85; ft = 0.5; break;
    case 'flooding': fs = globalStrength ? 0.6 : 0.85; ft = 0.45; break;
    default: fs = globalStrength ? 0.55 : 0.8; ft = 0.45;
  }
  return { sigma: fs * m.R, tau: ft * m.R, fs, ft };
}

// ---------------------------------------------------------------------------
// Ch 4, Sec 3 – plating (steel and aluminium)
// ---------------------------------------------------------------------------
/** Aspect ratio coefficient μ (Ch 4, Sec 3, symbols); s, l in m. */
export function mu(s, l) {
  const r = s / l;
  return Math.min(1.21 * Math.sqrt(1 + 0.33 * r * r) - 0.69 * r, 1);
}

/** Minimum plate thickness, mm (Ch 4, Sec 3, [2.2.1]). */
export function minPlateThickness(sh, m) {
  if (m.kind === 'aluminium') return 4.0;
  const base = sh.group === 'cargo' ? 3.5 : 3.0;
  return Math.max(0.05 * sh.LW * Math.sqrt(m.k) + base, 5);
}

const roundHalf = (t) => Math.round(t * 2) / 2; // Ch 1, Sec 3, [2.4]: nearest half-millimetre

/**
 * Plating thickness for one panel.
 * el: { zone 'bottom'|'side'|'deck', x, s, l (m), z (lower edge, m above BL),
 *       zd (deck height, m), z0, framing 'transverse'|'longitudinal',
 *       bulkhead (bool), deadrise, tier, protectedDeck, globalStrength? }
 */
export function plate(sh, m, el) {
  const steel = m.kind === 'steel';
  const lambda = steel ? 1.1 : 1.05;
  const s = Math.min(el.s, el.l);
  const l = Math.max(el.s, el.l);
  const muv = mu(s, l);
  const glob = el.globalStrength ?? (el.x / sh.LWL >= 0.3 && el.x / sh.LWL <= 0.7);
  const cases = [];

  // a) Sea pressure (still water + wave)
  let pSea;
  if (el.zone === 'bottom') pSea = bottomSeaPressure(sh, el.x, el.z0 ?? 0).p;
  else if (el.zone === 'side') pSea = sideSeaPressure(sh, el.x, el.z, el.z0 ?? 0).p;
  else pSea = deckPressure(sh, el.x, el.zd ?? el.z, el).p;
  if (el.zone === 'deck' && sh.service === 'fishing' && el.workingDeck) pSea = Math.max(pSea, el.PLD ?? 8.5); // Ch 6, Sec 1, [15.3.3]
  const npSea = steel ? (el.bulkhead ? 0.67 : el.framing === 'longitudinal' ? 0.67 : 0.77) : 1.0;
  const sSea = plateStress(m, { load: 'sea', globalStrength: glob, framing: el.framing });
  cases.push({ load: 'sea', p: pSea, np: npSea, sigma: sSea.sigma, t: 22.4 * lambda * npSea * muv * s * Math.sqrt(pSea / sSea.sigma) });

  const npDyn = steel ? 0.77 : 0.85;
  const sDyn = plateStress(m, { load: 'dynamic' });

  // b) Bottom slamming (planing hulls)
  if (el.zone === 'bottom') {
    const sl = slamming(sh, { x: el.x, sa: s * Math.min(l, 3 * s), element: 'plate', material: 'metal', deadrise: el.deadrise });
    if (sl.applies) cases.push({ load: 'slamming', p: sl.p, np: npDyn, sigma: sDyn.sigma, t: 22.4 * lambda * npDyn * muv * s * Math.sqrt(sl.p / sDyn.sigma), detail: sl });
  }

  // c) Side shell impact (Ch 4, Sec 3, [2.2.3])
  if (el.zone === 'side') {
    const imp = sideImpact(sh, el.x, el.z);
    if (imp.applies) {
      const Cp = Math.max(-0.98 * s * s + 0.3 * s + 0.95, 0.8);
      const p = Cp * imp.p;
      const lssi = Math.min(0.6 * (1 + s), l);
      const t = s <= 0.6
        ? 17.3 * Math.sqrt(1 / lssi) * lambda * npDyn * muv * s * Math.sqrt(p / sDyn.sigma)
        : 13.4 * Math.sqrt((1.5 * s * s - 0.18) / (lssi * s)) * lambda * npDyn * muv * Math.sqrt(p / sDyn.sigma);
      cases.push({ load: 'sideImpact', p, np: npDyn, sigma: sDyn.sigma, t, detail: { ...imp, Cp, lssi } });
    }
  }

  const governing = cases.reduce((a, b) => (b.t > a.t ? b : a));
  const tMin = minPlateThickness(sh, m);
  const fishingAdd = sh.service === 'fishing' ? 0.5 : 0; // Ch 6, Sec 1, [15.4.1]
  const tCalc = Math.max(governing.t, tMin) + fishingAdd;
  return {
    s, l, mu: muv, lambda, globalStrength: glob, cases, governing,
    tMin, fishingAdd, tCalc, tRule: roundHalf(tCalc),
    governedBy: governing.t >= tMin ? governing.load : 'minimum',
  };
}

// ---------------------------------------------------------------------------
// Ch 4, Sec 4 – secondary stiffeners (steel and aluminium)
// ---------------------------------------------------------------------------
/** End condition coefficients (Ch 4, Sec 4, [1.4] and Tab 2). */
export const END_CONDITIONS = {
  fixed: { m: 12, P1: [2, 3], mb: 60, P2: [3, 7], ms: 20 },
  fixedSupported: { m: 10, P1: [7, 8], mb: 120, P2: [9, 16], ms: 40 },
  supported: { m: 8, P1: [1, 1], mb: 16, P2: [1, 2], ms: 6 },
};

/** Minimum section modulus, cm³ (Ch 4, Sec 4, [2.2.1]). */
export function minStiffenerModulus(sh, m) {
  return m.kind === 'steel' ? 0.2 * sh.LW * m.k + 4 : 2 * Math.cbrt(sh.LW) * m.k;
}

/**
 * Secondary stiffener requirements.
 * el: { zone, x, s, l (m), direction 'longitudinal'|'transverse',
 *       vertical (bool, side frames), z (mid-span, or lower end if vertical),
 *       zTop (upper end if vertical), end 'fixed'|'fixedSupported'|'supported',
 *       liquid (bool), deadrise, globalStrength? }
 */
export function stiffener(sh, m, el) {
  const steel = m.kind === 'steel';
  const lambda = steel ? (el.liquid ? 1.2 : 1.1) : 1.05;
  const { s, l } = el;
  const ec = END_CONDITIONS[el.end] ?? END_CONDITIONS.fixed;
  const glob = el.globalStrength ?? (el.direction === 'longitudinal' && el.x / sh.LWL >= 0.3 && el.x / sh.LWL <= 0.7);
  const cases = [];
  const sea = stiffenerStress(m, { load: 'sea', globalStrength: glob });
  const dyn = stiffenerStress(m, { load: 'dynamic' });

  const pressureAt = (z) => (el.zone === 'bottom'
    ? bottomSeaPressure(sh, el.x, el.z0 ?? 0).p
    : el.zone === 'side'
      ? sideSeaPressure(sh, el.x, z, el.z0 ?? 0).p
      : (() => {
        let p = deckPressure(sh, el.x, el.zd ?? z, el).p;
        if (sh.service === 'fishing' && el.workingDeck) p = Math.max(p, el.PLD ?? 8.5);
        return p;
      })());

  // a) Sea pressure
  const Ct = Math.max(1 - s / (2 * l), 0.5);
  if (el.vertical && el.zone === 'side') {
    const pl = pressureAt(el.z);
    const pu = pressureAt(el.zTop ?? el.z + l);
    const p1 = ec.P1[0] * pu + ec.P1[1] * pl;
    const p2 = ec.P2[0] * pu + ec.P2[1] * pl;
    cases.push({
      load: 'sea', p: (pl + pu) / 2, pLower: pl, pUpper: pu,
      Z: (1000 * lambda * Ct * p1 * s * l * l) / (ec.mb * sea.sigma),
      Ash: (10 * lambda * Ct * p2 * s * l) / (ec.ms * sea.tau),
      sigma: sea.sigma, tau: sea.tau,
    });
  } else {
    const p = pressureAt(el.z);
    cases.push({
      load: 'sea', p,
      Z: (1000 * lambda * Ct * p * s * l * l) / (ec.m * sea.sigma),
      Ash: (5 * lambda * Ct * p * s * l) / sea.tau,
      sigma: sea.sigma, tau: sea.tau,
    });
  }

  // b) Bottom slamming (Ct = 1)
  if (el.zone === 'bottom') {
    const sl = slamming(sh, { x: el.x, sa: s * l, element: 'secondary', material: 'metal', deadrise: el.deadrise });
    if (sl.applies) {
      cases.push({
        load: 'slamming', p: sl.p, detail: sl,
        Z: (1000 * lambda * sl.p * s * l * l) / (ec.m * dyn.sigma),
        Ash: (5 * lambda * sl.p * s * l) / dyn.tau,
        sigma: dyn.sigma, tau: dyn.tau,
      });
    }
  }

  // c) Side shell impact (Ch 4, Sec 4, [2.2.3])
  if (el.zone === 'side') {
    const zImp = el.vertical ? Math.max((el.z + (el.zTop ?? el.z + l)) / 2, sh.T + 0.01) : el.z;
    const imp = sideImpact(sh, el.x, zImp);
    if (imp.applies) {
      const sI = Math.min(s, 0.6);
      const Cp = Math.max(-0.98 * sI * sI + 0.3 * sI + 0.95, 0.8);
      const P = Cp * imp.p;
      const Cf = l >= 0.6 ? (0.3 * (3 * l * l - 0.36)) / l ** 3 : 1;
      const CtI = Math.min(0.6 / l, 1);
      cases.push({
        load: 'sideImpact', p: P, detail: { ...imp, Cp, Cf, Ct: CtI },
        Z: (1000 * lambda * Cf * P * sI * l * l) / (ec.m * dyn.sigma),
        Ash: (5 * lambda * CtI * P * sI * l) / dyn.tau,
        sigma: dyn.sigma, tau: dyn.tau,
      });
    }
  }

  const Zmin = minStiffenerModulus(sh, m);
  const govZ = cases.reduce((a, b) => (b.Z > a.Z ? b : a));
  const govA = cases.reduce((a, b) => (b.Ash > a.Ash ? b : a));
  const bp = Math.min(0.2 * l, s); // attached plating, Ch 4, Sec 4, [1.3.1]
  return {
    lambda, end: el.end ?? 'fixed', m: ec.m, globalStrength: glob, cases,
    Zmin, Z: Math.max(govZ.Z, Zmin), Ash: govA.Ash, bp,
    governedZ: govZ.Z >= Zmin ? govZ.load : 'minimum', governedA: govA.load,
  };
}

/** Recommended proportions (Ch 4, Sec 4, [1.6.2], steel): tw ≥ hw/Cw·√(ReH/235). */
export const SLENDERNESS = { angle: { Cw: 75, Cf: 12 }, tee: { Cw: 75, Cf: 12 }, bulb: { Cw: 45 }, flat: { Cw: 22 } };
