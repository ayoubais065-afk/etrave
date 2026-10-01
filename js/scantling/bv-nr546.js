// ÉTRAVE – Ply-by-ply laminate analysis following the methodology of
// Bureau Veritas Rule Note NR546 (Hull in composite, plywood and HDPE),
// November 2022: Section 5 (individual layers), Section 6 (laminate and panel
// analysis) and Section 2 (safety factor criteria).
//
// Loads are taken from ISO 12215-5 (see iso12215-5.js) because NR546 refers
// its loads and partial safety factor values to NR600 / NR500, which are not
// part of this module. The partial safety factors are therefore inputs.
//
// Units: thickness mm, masses g/m², moduli and stresses N/mm², pressures
// kN/m², panel sides m, moments N·mm/mm, shear forces N/mm.

// ---------------------------------------------------------------------------
// Raw materials (NR546 Sec 4, Tab 1 and Tab 2 – minimum values for information)
// ---------------------------------------------------------------------------
export const RESINS = {
  polyester: { label: 'Polyester', rho: 1.2, nu: 0.38, E: 3550, G: 1350, coefRes: 0.8 },
  vinylester: { label: 'Vinylester', rho: 1.1, nu: 0.26, E: 3350, G: 1400, coefRes: 0.9 },
  epoxy: { label: 'Epoxy', rho: 1.25, nu: 0.39, E: 3100, G: 1500, coefRes: 1.0 },
};

export const FIBRES = {
  E: { label: 'E-glass', rho: 2.57, nu: 0.238, E0: 73100, E90: 73100, G: 30000, C: { UD1: 1.0, UD2: 0.8, UD12: 0.9, UDnu: 0.9 } },
  R: { label: 'R-glass', rho: 2.52, nu: 0.2, E0: 86000, E90: 86000, G: 34600, C: { UD1: 0.9, UD2: 1.2, UD12: 1.2, UDnu: 0.9 } },
  HS: { label: 'Carbon HS', rho: 1.79, nu: 0.3, E0: 238000, E90: 15000, G: 50000, C: { UD1: 1.0, UD2: 0.7, UD12: 0.9, UDnu: 0.8 } },
  IM: { label: 'Carbon IM', rho: 1.75, nu: 0.32, E0: 350000, E90: 10000, G: 35000, C: { UD1: 0.85, UD2: 0.8, UD12: 0.9, UDnu: 0.75 } },
  HM: { label: 'Carbon HM', rho: 1.88, nu: 0.35, E0: 410000, E90: 13800, G: 27000, C: { UD1: 0.9, UD2: 0.85, UD12: 1.0, UDnu: 0.7 } },
  aramid: { label: 'Para-aramid', rho: 1.45, nu: 0.38, E0: 129000, E90: 5400, G: 12000, C: { UD1: 0.95, UD2: 0.9, UD12: 0.55, UDnu: 0.9 } },
};

// Theoretical breaking strains in % (NR546 Sec 5, Tab 6).
// Order: t1, t2, c1, c2, s12, IL2 (13), IL1 (23)
const STRAINS = {
  UD: { E: [2.7, 0.53, 1.8, 1.55, 1.8, 1.8, 2.5], R: [3.1, 0.44, 1.8, 1.1, 1.5, 1.5, 1.8], HS: [1.2, 1.0, 0.85, 2.3, 1.6, 1.6, 1.9], IM: [1.15, 0.8, 0.65, 2.3, 1.7, 1.7, 1.85], HM: [0.7, 0.5, 0.45, 2.1, 1.8, 1.8, 1.8], aramid: [1.7, 0.8, 0.35, 2.0, 2.0, 2.0, 2.9] },
  WR: { E: [1.8, 1.8, 1.8, 1.8, 1.5, 1.8, 1.8], R: [2.3, 2.3, 2.5, 2.5, 1.5, 1.8, 1.8], HS: [1.0, 1.0, 0.85, 0.85, 1.55, 1.55, 1.55], IM: [0.8, 0.8, 0.8, 0.8, 1.6, 1.6, 1.6], HM: [0.45, 0.45, 0.5, 0.5, 1.85, 1.85, 1.85], aramid: [1.4, 1.4, 0.42, 0.42, 2.3, 2.9, 2.9] },
  CSM: { E: [1.55, 1.55, 1.55, 1.55, 2.0, 2.15, 2.15] },
};

// Typical fibre mass contents (NR546 Sec 5, Tab 1), mid-range values, for defaults.
export const TYPICAL_MF = {
  handLayUp: { CSM: 0.3, WR: 0.5, UD: 0.65 },
  infusion: { CSM: 0.5, WR: 0.6, UD: 0.6 },
  prepreg: { CSM: 0.65, WR: 0.65, UD: 0.65 },
};

// Core materials (NR546 Sec 4, Tab 3 and Tab 4). Columns:
// density, E (in-plane tensile), Ec (compression, through thickness), G, nu, st, sc, tau
const FOAMS = {
  linearPvc: { label: 'Linear PVC', rows: [[50, 21, 18, 8, 0.36, 0.7, 0.3, 0.3], [60, 29, 28, 11, 0.31, 0.9, 0.4, 0.5], [70, 37, 38, 14, 0.27, 1.1, 0.6, 0.7], [80, 44, 49, 18, 0.25, 1.3, 0.7, 0.8], [90, 52, 59, 21, 0.24, 1.4, 0.9, 1.0], [100, 59, 69, 24, 0.23, 1.6, 1.0, 1.2], [110, 67, 79, 27, 0.22, 1.8, 1.2, 1.3], [130, 82, 99, 34, 0.21, 2.2, 1.5, 1.7], [140, 89, 109, 37, 0.21, 2.4, 1.6, 1.9]] },
  crossPvc: { label: 'Cross-linked PVC', rows: [[50, 37, 40, 18, 0.02, 1.0, 0.6, 0.6], [60, 47, 51, 22, 0.05, 1.4, 0.8, 0.8], [70, 57, 63, 27, 0.07, 1.8, 1.1, 1.0], [80, 67, 75, 31, 0.08, 2.2, 1.4, 1.1], [90, 78, 88, 36, 0.09, 2.5, 1.7, 1.3], [100, 88, 102, 40, 0.1, 2.9, 1.9, 1.5], [110, 98, 116, 44, 0.11, 3.3, 2.2, 1.6], [130, 118, 145, 53, 0.12, 3.9, 2.8, 2.0], [140, 129, 161, 57, 0.12, 4.3, 3.0, 2.2], [170, 159, 209, 71, 0.13, 5.2, 3.8, 2.7], [190, 180, 243, 79, 0.13, 5.8, 4.4, 3.0], [200, 190, 260, 84, 0.13, 6.1, 4.7, 3.2], [250, 241, 352, 105, 0.14, 7.4, 6.0, 4.1]] },
  san: { label: 'SAN', rows: [[50, 52, 29, 13, 0.11, 0.9, 0.4, 0.7], [60, 65, 37, 16, 0.18, 1.2, 0.5, 0.8], [70, 78, 44, 18, 0.2, 1.5, 0.6, 0.9], [80, 92, 50, 21, 0.19, 1.7, 0.8, 1.0], [90, 107, 55, 23, 0.17, 1.9, 0.9, 1.1], [100, 122, 60, 26, 0.15, 2.0, 1.1, 1.2], [110, 137, 64, 29, 0.12, 2.2, 1.2, 1.3], [130, 168, 71, 34, 0.06, 2.5, 1.6, 1.5], [140, 184, 74, 36, 0.03, 2.6, 1.8, 1.6], [170, 234, 83, 43, 0.03, 2.9, 2.4, 1.9], [190, 268, 88, 48, 0.03, 3.1, 2.8, 2.1], [200, 285, 90, 51, 0.03, 3.1, 3.0, 2.1]] },
  pet: { label: 'PET', rows: [[60, 69, 35, 13, 0.32, 1.14, 0.67, 0.43], [70, 79, 49, 15, 0.32, 1.45, 0.84, 0.52], [80, 89, 61, 18, 0.38, 1.72, 1.01, 0.61], [90, 100, 74, 21, 0.38, 1.95, 1.2, 0.7], [100, 111, 86, 24, 0.38, 2.16, 1.39, 0.79], [110, 121, 99, 27, 0.32, 2.36, 1.59, 0.89], [130, 144, 122, 33, 0.27, 2.69, 2.02, 1.09], [150, 168, 145, 40, 0.22, 3.98, 2.47, 1.29], [200, 230, 196, 59, 0.22, 3.55, 3.72, 1.83], [250, 298, 241, 80, 0.12, 4.0, 5.11, 2.39]] },
  pmi: { label: 'PMI', rows: [[50, 54, 59, 21, 0.4, 1.9, 0.8, 0.8], [60, 69, 76, 24, 0.6, 2.1, 1.1, 1.0], [70, 84, 94, 28, 0.6, 2.3, 1.5, 1.2], [80, 101, 112, 33, 0.7, 2.6, 1.9, 1.5], [90, 119, 132, 39, 0.7, 2.9, 2.3, 1.8], [100, 137, 152, 45, 0.7, 3.2, 2.7, 2.1], [110, 155, 173, 52, 0.6, 3.6, 3.2, 2.4], [130, 195, 217, 71, 0.5, 4.5, 4.2, 3.1], [140, 215, 239, 83, 0.4, 5.0, 4.8, 3.5], [170, 280, 311, 131, 0.2, 6.8, 6.7, 4.7]] },
};

// Balsa (Tab 4): density, E in-plane, E3, G13, G12, st in-plane, sc in-plane, tau13, tau12
const BALSA = [[80, 23, 1522, 57, 40, 0.28, 0.48, 0.94, 0.7], [96, 33, 2145, 80, 55, 0.34, 0.58, 1.1, 0.9], [112, 42, 2768, 103, 70, 0.42, 0.71, 1.33, 1.2], [128, 51, 3460, 127, 90, 0.51, 0.87, 1.62, 1.5], [144, 61, 4083, 150, 105, 0.56, 0.95, 1.73, 1.8], [160, 71, 4706, 174, 120, 0.64, 1.1, 1.93, 2.0], [176, 80, 5328, 197, 140, 0.69, 1.17, 2.05, 2.3], [192, 89, 5882, 218, 150, 0.78, 1.33, 2.33, 2.5], [240, 116, 7750, 286, 200, 1.0, 1.7, 2.93, 3.4]];

export const CORE_TYPES = { ...Object.fromEntries(Object.entries(FOAMS).map(([k, v]) => [k, v.label])), balsa: 'End-grain balsa' };

function interpRows(rows, x) {
  if (x <= rows[0][0]) return rows[0].slice(1);
  for (let i = 1; i < rows.length; i++) {
    if (x <= rows[i][0]) {
      const [a, b] = [rows[i - 1], rows[i]];
      const t = (x - a[0]) / (b[0] - a[0]);
      return a.slice(1).map((v, j) => v + t * (b[j + 1] - v));
    }
  }
  return rows[rows.length - 1].slice(1);
}

// ---------------------------------------------------------------------------
// Section 5 – individual layer
// ---------------------------------------------------------------------------
/** Fibre volume content and layer thickness (Sec 5, [2.1] and [2.2]). */
export function layerGeometry(massGsm, Mf, fibre, resin) {
  const vf = Mf / fibre.rho;
  const vr = (1 - Mf) / resin.rho;
  const Vf = vf / (vf + vr);
  const e = (massGsm / 1000) * (1 / fibre.rho + (1 - Mf) / (Mf * resin.rho)); // mm
  const rho = fibre.rho * Vf + resin.rho * (1 - Vf);
  return { Vf, e, rho, arealMass: (e * rho) }; // kg/m²
}

/** Elastic coefficients of the equivalent unidirectional (Sec 5, [3.1]). */
export function unidirectional(Vf, fibre, resin) {
  const C = fibre.C;
  const E1 = C.UD1 * (fibre.E0 * Vf + resin.E * (1 - Vf));
  const Er = resin.E / (1 - resin.nu * resin.nu);
  const E2 = (C.UD2 * Er * (1 + 0.85 * Vf * Vf)) / (Math.pow(1 - Vf, 1.25) + (Er / fibre.E90) * Vf);
  const ratio = fibre.G / resin.G;
  const eta = (ratio - 1) / (ratio + 1);
  const G12 = (C.UD12 * resin.G * (1 + eta * Vf)) / (1 - eta * Vf);
  const nu12 = C.UDnu * (fibre.nu * Vf + resin.nu * (1 - Vf));
  return { E1, E2, E3: E2, G12, G13: G12, G23: 0.7 * G12, nu12, nu21: (nu12 * E2) / E1 };
}

/** Woven roving from the equivalent UD (Sec 5, [3.2]). Ceq: warp share. */
export function wovenRoving(ud, Ceq = 0.5) {
  const d = 1 - ud.nu12 * ud.nu21;
  const Q11 = ud.E1 / d;
  const Q22 = ud.E2 / d;
  const Q12 = (ud.nu21 * ud.E1) / d;
  const A11 = Ceq * Q11 + (1 - Ceq) * Q22;
  const A22 = Ceq * Q22 + (1 - Ceq) * Q11;
  const A12 = Q12;
  const E1 = A11 - (A12 * A12) / A22;
  const E2 = A22 - (A12 * A12) / A11;
  const G12 = ud.G12;
  const nu12 = A12 / A22;
  return { E1, E2, E3: ud.E3, G12, G13: 0.9 * G12, G23: 0.9 * G12, nu12, nu21: (nu12 * E2) / E1 };
}

/** Chopped strand mat (Sec 5, [3.3]) – isotropic. */
export function chopppedStrandMat(ud) {
  const E = (3 / 8) * ud.E1 + (5 / 8) * ud.E2;
  const G = E / (2 * 1.3);
  return { E1: E, E2: E, E3: ud.E3, G12: G, G13: 0.7 * ud.G12, G23: 0.7 * ud.G12, nu12: 0.3, nu21: 0.3 };
}

/**
 * Builds one analysed layer.
 * def: { fabric: 'CSM'|'WR'|'UD'|'CORE', fibre, mass (g/m²), Mf, angle (deg), Ceq,
 *        coreType, density (kg/m³), thickness (mm, core) }
 */
export function buildLayer(def, resinKey = 'polyester') {
  const resin = RESINS[resinKey];
  if (def.fabric === 'CORE') return coreLayer(def);
  const fibre = FIBRES[def.fibre ?? 'E'];
  if (!fibre) throw new Error(`Unknown fibre ${def.fibre}`);
  const fibreKey = def.fibre ?? 'E';
  const g = layerGeometry(def.mass, def.Mf, fibre, resin);
  const ud = unidirectional(g.Vf, fibre, resin);
  let el;
  if (def.fabric === 'UD') el = ud;
  else if (def.fabric === 'WR') el = wovenRoving(ud, def.Ceq ?? 0.5);
  else if (def.fabric === 'CSM') {
    if (fibreKey !== 'E') throw new Error('Chopped strand mat is only defined for E-glass in NR546.');
    el = chopppedStrandMat(ud);
  } else throw new Error(`Unknown fabric ${def.fabric}`);
  const eps = STRAINS[def.fabric][fibreKey];
  const k = resin.coefRes / 100; // strains are in %
  const strength = {
    t1: eps[0] * el.E1 * k,
    t2: eps[1] * el.E2 * k,
    c1: eps[2] * el.E1 * k,
    c2: eps[3] * el.E2 * k,
    s12: eps[4] * el.G12 * k,
    IL2: eps[5] * el.G13 * k,
    IL1: eps[6] * el.G23 * k,
  };
  return {
    ...def,
    kind: 'fibre',
    label: `${def.fabric} ${FIBRES[fibreKey].label} ${def.mass} g/m²`,
    t: g.e,
    Vf: g.Vf,
    arealMass: g.arealMass,
    angle: def.angle ?? 0,
    el,
    strength,
  };
}

function coreLayer(def) {
  let el, strength, label;
  if (def.coreType === 'balsa') {
    const [E, E3, G13, G12, st, sc, tau13] = interpRows(BALSA, def.density);
    el = { E1: E, E2: E, E3, G12, G13, G23: G13, nu12: 0.015, nu21: 0.015 };
    strength = { t1: st, t2: st, c1: sc, c2: sc, s12: tau13, IL1: tau13, IL2: tau13 };
    label = `Balsa ${def.density} kg/m³`;
  } else {
    const foam = FOAMS[def.coreType];
    if (!foam) throw new Error(`Unknown core ${def.coreType}`);
    const [E, Ec, G, nu, st, sc, tau] = interpRows(foam.rows, def.density);
    el = { E1: E, E2: E, E3: Ec, G12: G, G13: G, G23: G, nu12: nu, nu21: nu };
    strength = { t1: st, t2: st, c1: sc, c2: sc, s12: tau, IL1: tau, IL2: tau };
    label = `${foam.label} ${def.density} kg/m³`;
  }
  return { ...def, kind: 'core', label, t: def.thickness, angle: 0, el, strength, arealMass: (def.thickness * def.density) / 1000 };
}

/** Expands a double-bias (±45°) fabric into two UD layers of half mass each. */
export function expandFabric(def) {
  if (def.fabric !== 'BIAX') return [def];
  const half = { ...def, fabric: 'UD', mass: def.mass / 2 };
  const a = def.angle ?? 0;
  return [{ ...half, angle: a + 45, parent: 'BIAX' }, { ...half, angle: a - 45, parent: 'BIAX' }];
}

// ---------------------------------------------------------------------------
// Section 6 – laminate (classical lamination theory)
// ---------------------------------------------------------------------------
function qMatrix(el) {
  const d = 1 - el.nu12 * el.nu21;
  return { Q11: el.E1 / d, Q22: el.E2 / d, Q12: (el.nu12 * el.E2) / d, Q66: el.G12 };
}

/** Transformed reduced stiffness for a ply at angle θ (deg) to the panel X axis. */
export function qBar(el, angleDeg) {
  const { Q11, Q22, Q12, Q66 } = qMatrix(el);
  const t = (angleDeg * Math.PI) / 180;
  const c = Math.cos(t);
  const s = Math.sin(t);
  const c2 = c * c, s2 = s * s, c4 = c2 * c2, s4 = s2 * s2;
  return [
    [Q11 * c4 + 2 * (Q12 + 2 * Q66) * s2 * c2 + Q22 * s4, (Q11 + Q22 - 4 * Q66) * s2 * c2 + Q12 * (s4 + c4), (Q11 - Q12 - 2 * Q66) * s * c2 * c + (Q12 - Q22 + 2 * Q66) * s2 * s * c],
    [(Q11 + Q22 - 4 * Q66) * s2 * c2 + Q12 * (s4 + c4), Q11 * s4 + 2 * (Q12 + 2 * Q66) * s2 * c2 + Q22 * c4, (Q11 - Q12 - 2 * Q66) * s2 * s * c + (Q12 - Q22 + 2 * Q66) * s * c2 * c],
    [(Q11 - Q12 - 2 * Q66) * s * c2 * c + (Q12 - Q22 + 2 * Q66) * s2 * s * c, (Q11 - Q12 - 2 * Q66) * s2 * s * c + (Q12 - Q22 + 2 * Q66) * s * c2 * c, (Q11 + Q22 - 2 * Q12 - 2 * Q66) * s2 * c2 + Q66 * (s4 + c4)],
  ];
}

function invert(m) {
  const n = m.length;
  const a = m.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let i = 0; i < n; i++) {
    let p = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(a[r][i]) > Math.abs(a[p][i])) p = r;
    [a[i], a[p]] = [a[p], a[i]];
    const piv = a[i][i];
    if (Math.abs(piv) < 1e-14) throw new Error('Singular laminate stiffness matrix');
    for (let j = 0; j < 2 * n; j++) a[i][j] /= piv;
    for (let r = 0; r < n; r++) {
      if (r === i) continue;
      const f = a[r][i];
      for (let j = 0; j < 2 * n; j++) a[r][j] -= f * a[i][j];
    }
  }
  return a.map((row) => row.slice(n));
}

const mul = (m, v) => m.map((row) => row.reduce((s, x, j) => s + x * v[j], 0));

/**
 * Laminate analysis. layers: array of layer definitions, listed from the outer
 * face (wetted side) inwards.
 */
export function laminate(defs, resinKey = 'polyester') {
  const layers = defs.flatMap(expandFabric).map((d) => buildLayer(d, resinKey));
  const h = layers.reduce((s, l) => s + l.t, 0);
  let z = -h / 2;
  const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const B = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const D = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const l of layers) {
    l.zb = z;
    l.zt = z + l.t;
    l.Qb = qBar(l.el, l.angle);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      A[i][j] += l.Qb[i][j] * (l.zt - l.zb);
      B[i][j] += (l.Qb[i][j] * (l.zt ** 2 - l.zb ** 2)) / 2;
      D[i][j] += (l.Qb[i][j] * (l.zt ** 3 - l.zb ** 3)) / 3;
    }
    z = l.zt;
  }
  const ABD = [
    [...A[0], ...B[0]], [...A[1], ...B[1]], [...A[2], ...B[2]],
    [...B[0], ...D[0]], [...B[1], ...D[1]], [...B[2], ...D[2]],
  ];
  const abd = invert(ABD);
  const a = invert(A);
  // Reduced bending stiffness D* = D − B A⁻¹ B (neutral plane of an unsymmetric stack).
  const BAinv = B.map((row) => [0, 1, 2].map((j) => row.reduce((s, x, k) => s + x * a[k][j], 0)));
  const Dstar = D.map((row, i) => row.map((x, j) => x - BAinv[i].reduce((s, y, k) => s + y * B[k][j], 0)));
  const Ex = 1 / (h * a[0][0]);
  const Ey = 1 / (h * a[1][1]);
  const nuxy = -a[0][1] / a[0][0];
  const nuyx = -a[0][1] / a[1][1];
  const arealMass = layers.reduce((s, l) => s + l.arealMass, 0);
  return { layers, h, A, B, D, Dstar, ABD, abd, Ex, Ey, nuxy, nuyx, arealMass };
}

/** Ply stresses (in ply axes) for a load vector [Nx,Ny,Nxy,Mx,My,Mxy]. */
export function plyStresses(lam, load) {
  const strains = mul(lam.abd, load);
  const e0 = strains.slice(0, 3);
  const k = strains.slice(3);
  return lam.layers.map((l) => {
    const at = (zz) => {
      const e = [e0[0] + zz * k[0], e0[1] + zz * k[1], e0[2] + zz * k[2]];
      const sg = mul(l.Qb, e);
      const t = (l.angle * Math.PI) / 180;
      const c = Math.cos(t), s = Math.sin(t);
      return {
        s1: c * c * sg[0] + s * s * sg[1] + 2 * s * c * sg[2],
        s2: s * s * sg[0] + c * c * sg[1] - 2 * s * c * sg[2],
        t12: -s * c * sg[0] + s * c * sg[1] + (c * c - s * s) * sg[2],
      };
    };
    return { bottom: at(l.zb), top: at(l.zt) };
  });
}

// ---------------------------------------------------------------------------
// Section 6 [5.2] – panel bending moments under sea pressure (clamped edges)
// ---------------------------------------------------------------------------
export function panelMoments(lam, { a, b, p }) {
  const D11 = lam.Dstar[0][0];
  const D22 = lam.Dstar[1][1];
  const Dm = Math.sqrt(D11 * D22);
  const a0 = a * Math.pow(Dm / D11, 0.25);
  const b0 = b * Math.pow(Dm / D22, 0.25);
  const phi = Math.min(a0 >= b0 ? a0 / b0 : b0 / a0, 2);
  const F1 = -0.0343 * phi * phi + 0.1333 * phi - 0.0471;
  const F2 = -0.0113 * phi * phi + 0.0382 * phi + 0.0251;
  let Mx, My;
  if (a0 >= b0) { Mx = F2 * p * b0 * b0; My = F1 * p * b0 * b0; }
  else { Mx = F1 * p * a0 * a0; My = F2 * p * a0 * a0; }
  // kN·m/m → N·mm/mm
  Mx *= 1000; My *= 1000;
  const Mxp = (lam.nuyx * lam.Ex * My) / lam.Ey;
  const Myp = (lam.nuxy * lam.Ey * Mx) / lam.Ex;
  return { a0, b0, phi, F1, F2, Mx, My, Mxp, Myp, D11, D22 };
}

/** Transverse shear force on the panel, N/mm – ISO 12215-5 Eq. (33) with kC = 1. */
export function panelShear({ a, b, p }) {
  const r = Math.max(a, b) / Math.min(a, b);
  const kshc = r < 2 ? 0.035 + 0.394 * r - 0.09 * r * r : r >= 4 ? 0.5 : r < 3 ? 0.463 + (r - 2) * 0.03 : 0.493 + (r - 3) * 0.007;
  return { kSHC: kshc, T: kshc * p * Math.min(a, b) * 1000 * 1e-3 };
}

/** Interlaminar (through-thickness) shear stress at each ply interface for bending across the short span. */
export function interlaminarShear(lam, T, dir) {
  const idx = dir === 'x' ? 0 : 1;
  const Q = lam.layers.map((l) => l.Qb[idx][idx]);
  const EA = lam.layers.reduce((s, l, i) => s + Q[i] * l.t, 0);
  const zn = lam.layers.reduce((s, l, i) => s + Q[i] * l.t * (l.zb + l.zt) / 2, 0) / EA;
  const EI = lam.layers.reduce((s, l, i) => s + Q[i] * ((l.zt - zn) ** 3 - (l.zb - zn) ** 3) / 3, 0);
  let S = 0;
  return lam.layers.map((l, i) => {
    const Sb = S;
    // first moment at ply mid-thickness and top
    const zm = (l.zb + l.zt) / 2;
    const Smid = Sb + (Q[i] * ((zm - zn) ** 2 - (l.zb - zn) ** 2)) / 2;
    S = Sb + (Q[i] * ((l.zt - zn) ** 2 - (l.zb - zn) ** 2)) / 2;
    const tau = Math.max(Math.abs(Sb), Math.abs(Smid), Math.abs(S)) * T / EI;
    return tau;
  });
}

// ---------------------------------------------------------------------------
// Section 2 [1.3] – safety factors
// ---------------------------------------------------------------------------
/**
 * Default partial safety factors. NR546 refers the values to NR600 / NR500;
 * these defaults are provisional and must be checked against those rules.
 */
export const DEFAULT_FACTORS = {
  CV: 1.2,
  CF: { handLayUp: 1.2, infusion: 1.15, prepreg: 1.1 },
  CR: { fibre: 2.0, transverse: 2.0, shear: 2.0, interlaminar: 2.0 },
  Ci: { sea: 1.0, slamming: 1.0, internal: 1.0 },
  CCS: 1.7,
};

/** Hoffman combined criterion – positive root (Sec 2, [1.3.3]). */
export function hoffman(s1, s2, t12, st) {
  const aa = (s1 * s1) / (st.c1 * st.t1) + (s2 * s2) / (st.c2 * st.t2) - (s1 * s2) / (st.c1 * st.t1) + (t12 * t12) / (st.s12 * st.s12);
  const bb = (s1 * (st.c1 - st.t1)) / (st.c1 * st.t1) + (s2 * (st.c2 - st.t2)) / (st.c2 * st.t2);
  if (aa <= 0) return bb > 0 ? 1 / bb : Infinity;
  return (-bb + Math.sqrt(bb * bb + 4 * aa)) / (2 * aa);
}

const sfDirect = (stress, tension, compression) => {
  if (Math.abs(stress) < 1e-9) return Infinity;
  return stress > 0 ? tension / stress : compression / -stress;
};

/**
 * Full panel check.
 * input: { layers (defs, outer first), resin, process, a, b (m), p (kN/m²),
 *          load: 'sea'|'slamming'|'internal', factors? }
 */
export function checkPanel(input) {
  const f = mergeFactors(input.factors);
  const lam = laminate(input.layers, input.resin);
  const mom = panelMoments(lam, input);
  const sh = panelShear(input);
  const CF = f.CF[input.process] ?? f.CF.handLayUp;
  const Ci = f.Ci[input.load ?? 'sea'] ?? 1;
  const base = f.CV * CF * Ci;
  const req = {
    fibre: base * f.CR.fibre,
    transverse: base * f.CR.transverse,
    shear: base * f.CR.shear,
    interlaminar: base * f.CR.interlaminar,
    combined: base * f.CCS,
  };
  // Edge moments: outer (wetted) face in tension at the supports → negative sign.
  const edgeB = plyStresses(lam, [0, 0, 0, -mom.Mx, -mom.Myp, 0]);
  const edgeA = plyStresses(lam, [0, 0, 0, -mom.Mxp, -mom.My, 0]);
  const shortDir = input.a >= input.b ? 'y' : 'x';
  const tauIL = interlaminarShear(lam, sh.T, shortDir);

  const plies = lam.layers.map((l, i) => {
    const st = l.strength;
    let worst = null;
    for (const [edge, res] of [['side b', edgeB[i]], ['side a', edgeA[i]]]) {
      for (const face of ['bottom', 'top']) {
        const s = res[face];
        const sf = {
          fibre: sfDirect(s.s1, st.t1, st.c1),
          transverse: sfDirect(s.s2, st.t2, st.c2),
          shear: Math.abs(s.t12) < 1e-9 ? Infinity : st.s12 / Math.abs(s.t12),
          combined: hoffman(s.s1, s.s2, s.t12, st),
        };
        const util = Math.max(req.fibre / sf.fibre, req.transverse / sf.transverse, req.shear / sf.shear, req.combined / sf.combined);
        if (!worst || util > worst.util) worst = { edge, face, stress: s, sf, util };
      }
    }
    const ilStrength = Math.min(st.IL1, st.IL2);
    const sfIL = tauIL[i] > 0 ? ilStrength / tauIL[i] : Infinity;
    const utilIL = req.interlaminar / sfIL;
    const util = Math.max(worst.util, utilIL);
    return { layer: l, worst, tauIL: tauIL[i], sfIL, utilIL, util, ok: util <= 1.0001 };
  });
  return { lam, mom, shear: sh, factors: f, required: req, plies, ok: plies.every((p) => p.ok), maxUtil: Math.max(...plies.map((p) => p.util)) };
}

function mergeFactors(user = {}) {
  return {
    CV: user.CV ?? DEFAULT_FACTORS.CV,
    CF: { ...DEFAULT_FACTORS.CF, ...(user.CF ?? {}) },
    CR: { ...DEFAULT_FACTORS.CR, ...(user.CR ?? {}) },
    Ci: { ...DEFAULT_FACTORS.Ci, ...(user.Ci ?? {}) },
    CCS: user.CCS ?? DEFAULT_FACTORS.CCS,
  };
}
