// Run with: node --test test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as iso from '../js/scantling/iso12215-5.js';
import * as bv from '../js/scantling/bv-nr546.js';

const near = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= Math.abs(b) * tol, `${a} ≉ ${b}`);

// Reference craft: 12 m GRP trawler, design category B (hand calculation in comments).
const trawler = iso.craft({ type: 'motor', category: 'B', LH: 12, LWL: 10.8, BWL: 4.0, BC: 3.6, beta: 15, V: 10, mLDC: 26900 });

test('Table 5 factors match the tabulated values', () => {
  near(iso.k2(1.0), 0.308, 0.005);
  near(iso.k2(1.5), 0.454, 0.005);
  near(iso.k2(2.0), 0.497, 0.005);
  assert.equal(iso.k2(3), 0.5);
  near(iso.k3(1.0), 0.014, 0.02);
  near(iso.k3(1.5), 0.024, 0.03);
  near(iso.kSHC(1.0), 0.339, 0.005);
  near(iso.kSHC(1.5), 0.424, 0.005);
});

test('Table C.3 thickness/fibre-mass ratios', () => {
  near(iso.thicknessPerFibreMass(0.3), 2.34, 0.005);
  near(iso.thicknessPerFibreMass(0.5), 1.22, 0.005);
  near(iso.thicknessPerFibreMass(0.66), 0.82, 0.01);
});

test('Example C.3.2: overall glass content and thickness', () => {
  const psi = iso.overallPsi([{ w: 0.45, psi: 0.3 }, { w: 2.4, psi: 0.39 }, { w: 0.5, psi: 0.48 }]);
  near(psi, 0.385, 0.01);
  near(3.35 * iso.thicknessPerFibreMass(0.39), 5.68, 0.01);
});

test('Table D.2 core values from Table D.1 equations', () => {
  const pvc = iso.coreProperties('pvc1', 100);
  near(pvc.tau_u, 1.12, 0.02);
  near(pvc.G, 31, 0.02);
  const balsa = iso.coreProperties('balsa', 150);
  near(balsa.tau_u, 2.33, 0.01);
});

test('12 m trawler: dynamic factor and bottom pressure (hand calculation)', () => {
  const n = iso.nCG(trawler);
  near(n.value, 0.207, 0.01); // Eq. (1): 0,32·(10,8/36 + 0,084)·35·100·12,96 / 26 900
  const r = iso.designPressure(trawler, { element: 'plate', zone: 'bottom', construction: 'single', x: 4, b: 400, l: 1000 });
  // kL = 0,809, kAR = 0,839, PBMD = 89,5 × 0,839 × 0,8 × 0,809 = 48,6 kN/m²
  near(r.trace.kL, 0.809, 0.005);
  near(r.P, 48.6, 0.01);
  assert.match(r.governing, /displacement/);
});

test('12 m trawler: FRP single-skin bottom plating', () => {
  const P = iso.designPressure(trawler, { element: 'plate', zone: 'bottom', construction: 'single', x: 4, b: 400, l: 1000 }).P;
  const res = iso.frpSingleSkin(trawler, { b: 400, l: 1000 }, P, { psi: 0.3, kind: 'mixed', evalLevel: 'c' }, { zone: 'bottom' });
  // σuf = 0,8 × (502·0,09 + 107) = 121,7; σd = 60,9; t = 400·√(48,6·0,5/60 900) = 7,99 mm
  near(res.sigma_d, 60.9, 0.005);
  near(res.t_strength, 7.99, 0.01);
  near(res.w_strength, 3.42, 0.01);
});

test('Side pressure falls between bottom and deck values', () => {
  const side = iso.designPressure(trawler, { element: 'plate', zone: 'side', construction: 'single', x: 4, b: 400, l: 1000, h: 0.5, Z: 1.5 });
  const bottom = iso.designPressure(trawler, { element: 'plate', zone: 'bottom', construction: 'single', x: 4, b: 400, l: 1000 });
  assert.ok(side.P < bottom.P && side.P > 5);
});

test('Stiffener requirements, Eq. (48) and (49)', () => {
  const r = iso.stiffenerRequirements(40, { s: 400, lu: 1500 }, { sigma_d: 100, tau_d: 50 });
  near(r.SM, (83.33 * 40 * 400 * 1500 * 1500 * 1e-9) / 100, 1e-9);
  near(r.AW, (5 * 40 * 400 * 1500 * 1e-6) / 50, 1e-9);
});

test('NR546 layer thickness and CSM modulus', () => {
  const g = bv.layerGeometry(1000, 0.5, bv.FIBRES.E, bv.RESINS.polyester);
  near(g.e, 1.222, 0.005); // agrees with ISO Table C.3 at ψ = 0,5
  const csm = bv.buildLayer({ fabric: 'CSM', fibre: 'E', mass: 450, Mf: 0.3 }, 'polyester');
  near(csm.el.E1, 8314, 0.01);
  near(csm.strength.t1, 0.0155 * 8314 * 0.8, 0.01);
});

test('CLT: single isotropic layer gives D11 = E h³ / 12(1 − ν²)', () => {
  const lam = bv.laminate([{ fabric: 'CSM', fibre: 'E', mass: 2000, Mf: 0.3 }], 'polyester');
  const l = lam.layers[0];
  const D = (l.el.E1 * lam.h ** 3) / (12 * (1 - 0.09));
  near(lam.D[0][0], D, 1e-6);
  near(lam.B[0][0] + 1, 1, 1e-6);
});

test('Square clamped isotropic panel: edge moment 0,0519 p b² and stress 6M/h²', () => {
  const layers = [{ fabric: 'CSM', fibre: 'E', mass: 3000, Mf: 0.3 }];
  const res = bv.checkPanel({ layers, resin: 'polyester', process: 'handLayUp', a: 0.5, b: 0.5, p: 50 });
  near(res.mom.F1, 0.0519, 0.01);
  near(res.mom.Mx, 0.0519 * 50 * 0.25 * 1000, 0.01);
  const sigma = (6 * (res.mom.Mx + res.mom.Myp * 0)) / res.lam.h ** 2;
  // Outer face (bottom of the single ply) is in tension under the edge moments.
  assert.ok(res.plies[0].worst.stress.s1 > 0);
  assert.ok(Math.abs(res.plies[0].worst.stress.s1) >= sigma * 0.99);
});

test('Hoffman reduces to the direct criterion under uniaxial tension', () => {
  const st = { t1: 100, c1: 80, t2: 50, c2: 60, s12: 40 };
  near(bv.hoffman(25, 0, 0, st), 4, 1e-6);
});
