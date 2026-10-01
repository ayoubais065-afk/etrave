// ÉTRAVE – first estimate of the main particulars from length and breadth.
//
// These are typical ratios for small craft and workboats, used only to fill
// the fields the designer has not given yet. They are NOT rule values: every
// estimated value can be replaced by the designer's own figure.

/** Typical ratios by type of service and hull type. */
export const PROFILES = {
  // lwl: LWL/LHULL · bwl: BWL/B · t: T/BWL · cb: block coefficient · v: V/√LWL (kn, m)
  fishing: { lwl: 0.92, bwl: 0.95, t: 0.36, cb: 0.42, v: 2.8 },
  tourism: { lwl: 0.9, bwl: 0.93, t: 0.28, cb: 0.45, v: 2.6 },
  passenger: { lwl: 0.9, bwl: 0.93, t: 0.3, cb: 0.48, v: 3.0 },
  cargo: { lwl: 0.94, bwl: 0.97, t: 0.4, cb: 0.62, v: 2.5 },
  supply: { lwl: 0.92, bwl: 0.96, t: 0.38, cb: 0.55, v: 3.0 },
  pilot: { lwl: 0.88, bwl: 0.92, t: 0.3, cb: 0.42, v: 3.2 },
  rescue: { lwl: 0.88, bwl: 0.92, t: 0.3, cb: 0.42, v: 3.2 },
};
const PLANING = { lwl: 0.85, bwl: 0.88, t: 0.18, cb: 0.38, v: 7.0 };

/** Ship group of NR600 from the type of service. */
export const groupOf = (service) => (service === 'cargo' ? 'cargo' : 'nonCargo');

/**
 * Fills the missing particulars.
 * input: { service, planing (bool), LHULL, B (maximum breadth), and optional
 *          LWL, BWL, D, T, displacement, V, deadriseLCG }
 * Returns { values, auto } where auto[k] is the estimated value of k and
 * values[k] the value used (designer value if given, otherwise auto[k]).
 */
export function estimate(input) {
  const base = PROFILES[input.service] ?? PROFILES.fishing;
  const r = input.planing ? { ...base, ...PLANING } : base;
  const given = (k) => Number.isFinite(input[k]) && input[k] > 0;
  const auto = {};
  const v = {};
  const pick = (k, f) => { auto[k] = f(); v[k] = given(k) ? input[k] : auto[k]; };

  pick('LWL', () => r.lwl * input.LHULL);
  pick('BWL', () => r.bwl * input.B);
  pick('T', () => r.t * v.BWL);
  pick('D', () => Math.max(input.planing ? 0.42 * input.B : 0.45 * input.B, 0.08 * input.LHULL + (input.planing ? 0.6 : 0.8), v.T + 0.5));
  pick('displacement', () => 1.025 * v.LWL * v.BWL * v.T * r.cb);
  pick('V', () => r.v * Math.sqrt(v.LWL));
  pick('deadriseLCG', () => (input.planing ? 18 : 12));
  return { values: v, auto };
}
