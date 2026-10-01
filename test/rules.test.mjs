// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as nr600 from '../js/rules/nr600.js';
import * as nr546 from '../js/rules/nr546.js';

const near = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= Math.abs(b) * tol + 1e-9, `${a} ≉ ${b}`);

// Reference: 12 m steel trawler, coastal area (hand calculations in comments).
const trawler = nr600.ship({
  group: 'nonCargo', service: 'fishing', navigation: 'coastal',
  LWL: 11.5, LHULL: 12.5, B: 4.2, D: 2.2, T: 1.5, displacement: 30, V: 10,
  planing: false, deadriseLCG: 15,
});
const steelA = nr600.metal('steel', 'A');

test('Ship data: LW, CB, CW, n (Ch 1, Sec 1; Ch 3, Sec 3)', () => {
  near(trawler.LW, 12);
  near(trawler.CB, 30 / (1.025 * 11.5 * 4.2 * 1.5)); // 0,404
  near(trawler.CW, 0.625 * (118 - 0.36 * 12) * 12e-3); // 0,8526
  assert.equal(trawler.n, 0.8);
});

test('Relative motion h1, non-cargo ship (Ch 3, Sec 3, Tab 1)', () => {
  const h = nr600.relativeMotion(trawler);
  near(h.m, (0.38 * 0.8526 + 0.3) * 0.8, 0.002); // 0,4992
  near(h[1], 1.1 * h.m);
  near(h[4], 1.7 * h.m * (7.6 / Math.pow(trawler.CB, 0.1) - 6.4));
  near(h[3], (1.4 * h.m + 0.7 * h[4]) / 2);
});

test('Bottom sea pressure at midship = ρg (T + h1)', () => {
  const p = nr600.bottomSeaPressure(trawler, 5.75).p;
  near(p, 1.025 * 9.81 * (1.5 + 0.4992), 0.002); // 20,10 kN/m²
});

test('Side pressure decreases with height and is capped by the bottom value', () => {
  const low = nr600.sideSeaPressure(trawler, 5.75, 1.0).p;
  const high = nr600.sideSeaPressure(trawler, 5.75, 2.0).p;
  const bottom = nr600.bottomSeaPressure(trawler, 5.75).p;
  assert.ok(low > high && low <= bottom);
  assert.ok(high >= nr600.deckPressure(trawler, 5.75, 2.0).pdmin - 1e-9);
});

test('Side impact pressure, coastal area (Tab 2, n1 = 0,7)', () => {
  near(nr600.sideImpact(trawler, 5.75, 2.0).p, 55 * 0.7); // T to T+1, aft of 0,7 LWL
  near(nr600.sideImpact(trawler, 10.0, 2.0).p, 70 * 0.7); // forward of 0,7 LWL
  assert.equal(nr600.sideImpact(trawler, 5.75, 1.0).applies, false); // below T
});

test('Steel bottom plating, transverse framing, midship (Ch 4, Sec 3, [2.2.2])', () => {
  const r = nr600.plate(trawler, steelA, { zone: 'bottom', x: 5.75, s: 0.4, l: 1.2, z: 0, framing: 'transverse' });
  // σ = 0,50 R = 117,5 (plating contributing to global strength, transverse framing)
  near(r.cases[0].sigma, 117.5);
  // t = 22,4 · 1,1 · 0,77 · μ(=1) · 0,4 · √(20,10 / 117,5) = 3,14 mm
  near(r.cases[0].t, 3.139, 0.005);
  // minimum 0,05·12·1 + 3,0 = 3,6 → 5 mm; fishing vessel + 0,5 mm (Ch 6, Sec 1, [15.4.1])
  assert.equal(r.tMin, 5);
  assert.equal(r.tRule, 5.5);
});

test('Steel bottom floor, fixed ends (Ch 4, Sec 4, [2.2.2])', () => {
  const r = nr600.stiffener(trawler, steelA, { zone: 'bottom', x: 5.75, s: 0.4, l: 1.2, z: 0, direction: 'transverse', end: 'fixed' });
  // Z = 1000·1,1·(1 − 0,4/2,4)·20,10·0,4·1,2² / (12 · 0,80·235) = 4,70 cm³
  near(r.cases[0].Z, 4.704, 0.005);
  // minimum 0,2·12·1 + 4 = 6,4 cm³
  near(r.Z, 6.4);
});

test('Vertical side frame: both-ends-fixed equivalent pressures match the horizontal formula for uniform p', () => {
  const ec = nr600.END_CONDITIONS.fixed;
  // p1 = 2p + 3p = 5p, mb = 60 → p/12 ; p2 = 3p + 7p = 10p, ms = 20 → 10·10p/20 = 5p
  near((ec.P1[0] + ec.P1[1]) / ec.mb, 1 / 12);
  near((10 * (ec.P2[0] + ec.P2[1])) / ec.ms, 5);
});

test('Planing hull slamming: K2 limits and pressure (Ch 3, Sec 3, [3.3])', () => {
  const boat = nr600.ship({ group: 'nonCargo', service: 'patrol', navigation: 'coastal', LWL: 10, LHULL: 11, B: 3, D: 1.6, T: 0.6, displacement: 6, V: 30, planing: true, deadriseLCG: 18 });
  const a = nr600.designAcceleration(boat);
  near(a.aCG, 1.333 * 0.23 * 30 / Math.sqrt(10), 0.002);
  const sl = nr600.slamming(boat, { x: 5, sa: 0.3 * 0.9, element: 'plate', material: 'metal', deadrise: 18 });
  assert.ok(sl.K2 >= 0.5 && sl.K2 <= 0.455 + 0.35);
  near(sl.psl1, 100 * 0.6 * 0.9 * 1 * a.aCG, 0.002);
});

test('Aluminium material factor k = 100 / R\'lim', () => {
  const al = nr600.metal('aluminium', '5083-O/H111');
  near(al.R, 125);
  near(al.k, 0.8);
});

test('NR546 layer thickness and CSM modulus (Sec 5)', () => {
  const g = nr546.layerGeometry(1000, 0.5, nr546.FIBRES.E, nr546.RESINS.polyester);
  near(g.e, 1.222, 0.005);
  const csm = nr546.buildLayer({ fabric: 'CSM', fibre: 'E', mass: 450, Mf: 0.3 }, 'polyester');
  near(csm.el.E1, 8314, 0.01);
});

test('NR600 composite safety factors (Ch 2, Sec 3, [3.2])', () => {
  const wr = nr546.buildLayer({ fabric: 'WR', fibre: 'E', mass: 800, Mf: 0.5 }, 'polyester');
  const r = nr546.requiredFactors(wr, 'handLayUp', 'sea');
  near(r.fibre, 1.2 * 1.25 * 2.4 * 1.0); // 3,6
  near(r.combined, 2.1 * 1.2 * 1.25 * 1.0); // 3,15
  const ud = nr546.buildLayer({ fabric: 'UD', fibre: 'E', mass: 600, Mf: 0.6 }, 'epoxy');
  const rs = nr546.requiredFactors(ud, 'infusion', 'slamming');
  near(rs.transverse, 1.2 * 1.15 * 1.25 * 0.8);
  near(rs.combined, 1.7 * 1.2 * 1.15 * 0.8);
});

test('NR546 square clamped panel: edge moment |F1| = 0,0519 and shear 0,25 p a0', () => {
  const res = nr546.checkPanel({ layers: [{ fabric: 'CSM', fibre: 'E', mass: 3000, Mf: 0.3 }], resin: 'polyester', process: 'handLayUp', a: 0.5, b: 0.5, p: 50 });
  near(res.mom.F1, 0.0519, 0.01);
  near(res.shear.T, 0.25 * 0.5 * 50, 0.001);
});

test('Hoffman reduces to the direct criterion under uniaxial tension', () => {
  near(nr546.hoffman(25, 0, 0, { t1: 100, c1: 80, t2: 50, c2: 60, s12: 40 }), 4, 1e-6);
});

import { estimate } from '../js/estimate.js';

test('Estimate from length and breadth: 12,5 m trawler and designer overrides', () => {
  const e = estimate({ service: 'fishing', planing: false, LHULL: 12.5, B: 4.4 });
  near(e.values.LWL, 11.5);
  near(e.values.T, 0.36 * 0.95 * 4.4);
  near(e.values.displacement, 1.025 * 11.5 * 4.18 * 1.5048 * 0.42, 0.005);
  const o = estimate({ service: 'fishing', planing: false, LHULL: 12.5, B: 4.4, T: 1.2 });
  assert.equal(o.values.T, 1.2);
  assert.ok(o.values.displacement < e.values.displacement); // follows the designer's draught
  const tour = estimate({ service: 'tourism', planing: true, LHULL: 10, B: 3.2 });
  assert.ok(tour.values.V > 20 && tour.values.V < 10 * Math.sqrt(tour.values.LWL));
});
