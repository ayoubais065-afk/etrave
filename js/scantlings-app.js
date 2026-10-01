// ÉTRAVE – scantling calculator page
import * as iso from './scantling/iso12215-5.js';
import * as bv from './scantling/bv-nr546.js';
import { t, tr, fmt, onLangChange } from './i18n.js';

const STORAGE_KEY = 'etrave.scantlings.v1';
const ZONE_KEYS = ['bottom', 'side', 'deck', 'superstructure', 'wtBulkhead', 'tank'];

// Reference project: 12 m GRP trawler, design category B.
// Example rows carry a nameKey so their names follow the interface language
// until the user renames them.
const EXAMPLE = () => ({
  craft: { type: 'motor', category: 'B', LH: 12, LWL: 10.8, BWL: 4.0, BC: 3.6, beta: 15, V: 10, mLDC: 26900 },
  material: {
    family: 'frp', evalLevel: 'c', psi: 0.3, kind: 'mixed',
    skinPsi: 0.5, to: 3.5, ti: 3, tc: 25, core: 'pvc1', coreDensity: 80,
    metal: 'al-5083-H111', welded: 'yes', woodSigma: 30, woodTau: 6, stiffPsi: 0.5,
  },
  plates: [
    { nameKey: 'ex.bottomAft', zone: 'bottom', x: 2.5, b: 400, l: 1000, crown: 0, h: 0, Z: 1.6 },
    { nameKey: 'ex.bottomFwd', zone: 'bottom', x: 8.0, b: 400, l: 1000, crown: 10, h: 0, Z: 1.9 },
    { nameKey: 'ex.side', zone: 'side', x: 5.0, b: 400, l: 1000, crown: 0, h: 0.6, Z: 1.7 },
    { nameKey: 'ex.deck', zone: 'deck', x: 5.0, b: 450, l: 1200, crown: 15, h: 0, Z: 0 },
    { nameKey: 'ex.wheelhouse', zone: 'superstructure', x: 6.5, b: 500, l: 800, crown: 0, h: 0, Z: 0, kSUP: 'front' },
  ],
  stiffeners: [
    { nameKey: 'ex.bottomFrame', zone: 'bottom', x: 4.0, s: 400, lu: 1300, crown: 0, h: 0, Z: 1.6 },
    { nameKey: 'ex.sideFrame', zone: 'side', x: 5.0, s: 400, lu: 1200, crown: 0, h: 0.6, Z: 1.7 },
    { nameKey: 'ex.deckBeam', zone: 'deck', x: 5.0, s: 450, lu: 2000, crown: 40, h: 0, Z: 0 },
  ],
  bv: {
    plate: 0, a: 1.0, b: 0.4, p: null, resin: 'polyester', process: 'handLayUp',
    layers: [
      { fabric: 'CSM', fibre: 'E', mass: 300, Mf: 0.3, angle: 0 },
      ...Array.from({ length: 4 }, () => [
        { fabric: 'CSM', fibre: 'E', mass: 450, Mf: 0.3, angle: 0 },
        { fabric: 'WR', fibre: 'E', mass: 800, Mf: 0.5, angle: 0 },
      ]).flat(),
      { fabric: 'CSM', fibre: 'E', mass: 450, Mf: 0.3, angle: 0 },
    ],
    factors: { CV: 1.2, CF: 1.2, CRf: 2.0, CRt: 2.0, CRs: 2.0, CRi: 2.0, Ci: 1.0, CCS: 1.7 },
  },
});

let state = load() ?? EXAMPLE();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (v) => (v === '' || v === null || v === undefined ? NaN : Number(v));
const badge = (ok, text) => `<span class="badge ${ok ? 'ok' : 'ko'}">${text}</span>`;
const plain = (html) => html.replace(/<[^>]+>/g, '');
const rowName = (r) => r.name ?? t(r.nameKey);
const icon = {
  remove: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 7h14M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
const derivedList = (items) => items.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');

function fillForm(form, values) {
  for (const el of form.elements) {
    if (!el.name || !(el.name in values)) continue;
    el.value = values[el.name];
  }
}

function readForm(form, target) {
  for (const el of form.elements) {
    if (!el.name) continue;
    target[el.name] = el.type === 'number' ? num(el.value) : el.value;
  }
}

// ---------------------------------------------------------------------------
// Method tabs
// ---------------------------------------------------------------------------
function setupTabs() {
  const tabs = [...document.querySelectorAll('.method-tabs [role="tab"]')];
  const select = (tab) => {
    tabs.forEach((tb) => {
      const on = tb === tab;
      tb.setAttribute('aria-selected', String(on));
      tb.tabIndex = on ? 0 : -1;
      document.getElementById(tb.getAttribute('aria-controls')).hidden = !on;
    });
    if (tab.id === 'tab-bv') computeBV();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const next = tabs[(i + 1) % tabs.length];
      next.focus();
      select(next);
    });
  });
}

// ---------------------------------------------------------------------------
// Craft and material
// ---------------------------------------------------------------------------
let craft = null;

function computeCraft() {
  craft = iso.craft(state.craft);
  const n = iso.nCG(craft);
  const mode = craft.type === 'sail' ? t('mode.sail') : craft.planing ? t('mode.planing') : t('mode.disp');
  $('#craft-derived').innerHTML = derivedList([
    ['k<sub>DC</sub>', fmt(craft.kDC, 1)],
    ['V / √L<sub>WL</sub>', fmt(craft.speedLengthRatio, 2)],
    [t('d.mode'), mode],
    ['n<sub>CG</sub>', `${fmt(n.value, 2)} g`],
    [t('d.nCGkL'), fmt(Math.max(n.value, 3), 2)],
    [t('d.Vused'), `${fmt(craft.V, 1)} kn`],
  ]);

  // Warnings are rebuilt here from the inputs so they can be translated.
  const c = state.craft;
  const warn = [];
  if (c.LH < 2.5 || c.LH > 24) warn.push(t('w.LH'));
  if (craft.beta !== c.beta) warn.push(t('w.beta', { v: fmt(craft.beta, 0) }));
  if (c.type !== 'sail' && c.V < 2.36 * Math.sqrt(c.LWL)) warn.push(t('w.V', { v: fmt(craft.V, 2) }));
  if (craft.V > 50) warn.push(t('w.V50'));
  if (c.type === 'motor' && n.eq1 > 3) warn.push(n.value === n.eq2 ? t('w.ncg2') : t('w.ncg1'));
  if (c.type === 'motor' && Math.min(n.eq1 ?? 0, n.eq2 ?? 0) > 7) warn.push(t('w.ncg7'));
  $('#craft-warnings').innerHTML = warn.map((w) => `<li>${w}</li>`).join('');
}

function materialSetup() {
  const form = $('#mat-form');
  translateMaterialOptions();
  fillForm(form, state.material);
  syncMaterialVisibility();
}

function translateMaterialOptions() {
  const form = $('#mat-form');
  form.elements.core.innerHTML = Object.keys(iso.CORES).map((k) => `<option value="${k}">${esc(t(`icore.${k}`))}</option>`).join('');
  form.elements.core.value = state.material.core;
  updateMetalOptions();
}

function updateMetalOptions() {
  const form = $('#mat-form');
  const fam = state.material.family;
  const kind = fam === 'steel' ? 'steel' : 'aluminium';
  form.elements.metal.innerHTML = Object.entries(iso.METALS).filter(([, m]) => m.kind === kind).map(([k, m]) => `<option value="${k}">${esc(tr(m.label))}</option>`).join('');
  if (!iso.METALS[state.material.metal] || iso.METALS[state.material.metal].kind !== kind) {
    state.material.metal = Object.keys(iso.METALS).find((k) => iso.METALS[k].kind === kind);
  }
  form.elements.metal.value = state.material.metal;
}

function syncMaterialVisibility() {
  const fam = state.material.family;
  document.querySelectorAll('#mat-form [data-for]').forEach((l) => { l.hidden = !l.dataset.for.split(' ').includes(fam); });
}

function materialSummary() {
  const m = state.material;
  const N = 'N/mm²';
  let items = [];
  if (m.family === 'frp') {
    const p = iso.glassLaminate(m.psi, m);
    items = [['σ<sub>uf</sub>', `${fmt(p.sigma_uf, 0)} ${N}`], [t('d.sigmaPlate'), `${fmt(0.5 * p.sigma_uf, 1)} ${N}`], ['E', `${fmt(p.E, 0)} ${N}`], ['t / w', `${fmt(iso.thicknessPerFibreMass(m.psi), 2)} ${t('d.perKg')}`]];
  } else if (m.family === 'sandwich') {
    const s = iso.glassLaminate(m.skinPsi, { kind: 'mixed', evalLevel: m.evalLevel });
    const c = iso.coreProperties(m.core, m.coreDensity);
    items = [[t('d.skinUt'), `${fmt(s.sigma_ut, 0)} ${N}`], [t('d.skinUc'), `${fmt(s.sigma_uc, 0)} ${N}`], [t('d.coreTu'), `${fmt(c.tau_u, 2)} ${N}`], [t('d.coreTd'), `${fmt(c.tau_d, 2)} ${N}`], [t('d.coreG'), `${fmt(c.G, 0)} ${N}`]];
  } else if (m.family === 'aluminium' || m.family === 'steel') {
    const mt = iso.METALS[m.metal];
    const welded = m.welded !== 'no';
    const st = iso.metalStiffenerDesignStress(mt, welded);
    items = [[t('d.sigmaPlate'), `${fmt(iso.metalPlateDesignStress(mt, welded), 0)} ${N}`], [t('d.sigmaStiff'), `${fmt(st.sigma_d, 0)} ${N}`], [t('d.tauStiff'), `${fmt(st.tau_d, 0)} ${N}`]];
  } else {
    items = [[t('d.sigmaPlate'), `${fmt(0.5 * m.woodSigma, 1)} ${N}`], [t('d.sigmaFrames'), `${fmt(0.45 * m.woodSigma, 1)} ${N}`]];
  }
  $('#mat-derived').innerHTML = derivedList(items);
}

// ---------------------------------------------------------------------------
// Plating and stiffener tables
// ---------------------------------------------------------------------------
function zoneOptions(selected, list = ZONE_KEYS) {
  return list.map((z) => `<option value="${z}"${z === selected ? ' selected' : ''}>${esc(t(`zone.${z}`))}</option>`).join('');
}

function heightCell(row, label) {
  if (row.zone === 'side') {
    return `<div class="pair"><input aria-label="${label} – h (m)" data-k="h" type="number" step="any" value="${row.h}"><input aria-label="${label} – Z (m)" data-k="Z" type="number" step="any" value="${row.Z}"></div>`;
  }
  if (row.zone === 'wtBulkhead' || row.zone === 'tank') {
    return `<input aria-label="${label} – h_B (m)" data-k="h" type="number" step="any" value="${row.h}" title="h_B (m)">`;
  }
  if (row.zone === 'superstructure') {
    return `<select aria-label="${label} – k_SUP" data-k="kSUP">${Object.keys(iso.K_SUP).map((k) => `<option value="${k}"${k === row.kSUP ? ' selected' : ''}>${esc(t(`sup.${k}`))}</option>`).join('')}</select>`;
  }
  return '<span class="gov">–</span>';
}

function renderPlates() {
  const tbody = $('#plates-table tbody');
  tbody.innerHTML = state.plates.map((r, i) => {
    const L = esc(`${t('th.panel')} ${i + 1}`);
    return `
    <tr data-i="${i}">
      <td class="w-name"><input aria-label="${L} – ${esc(t('a.name'))}" data-k="name" value="${esc(rowName(r))}"></td>
      <td class="w-md"><select aria-label="${L} – ${esc(t('th.zone'))}" data-k="zone">${zoneOptions(r.zone)}</select></td>
      <td class="w-sm"><input aria-label="${L} – x (m)" data-k="x" type="number" step="any" value="${r.x}"></td>
      <td class="w-sm"><input aria-label="${L} – b (mm)" data-k="b" type="number" step="any" min="50" value="${r.b}"></td>
      <td class="w-sm"><input aria-label="${L} – l (mm)" data-k="l" type="number" step="any" min="50" value="${r.l}"></td>
      <td class="w-sm"><input aria-label="${L} – c (mm)" data-k="crown" type="number" step="any" min="0" value="${r.crown}"></td>
      <td>${heightCell(r, L)}</td>
      <td data-out="P"></td>
      <td data-out="req"></td>
      <td><button type="button" class="icon-btn" data-remove aria-label="${esc(t('a.remove'))} – ${L}">${icon.remove}</button></td>
    </tr>`;
  }).join('');
}

function renderStiffeners() {
  const tbody = $('#stiff-table tbody');
  tbody.innerHTML = state.stiffeners.map((r, i) => {
    const L = esc(`${t('th.stiff')} ${i + 1}`);
    return `
    <tr data-i="${i}">
      <td class="w-name"><input aria-label="${L} – ${esc(t('a.name'))}" data-k="name" value="${esc(rowName(r))}"></td>
      <td class="w-md"><select aria-label="${L} – ${esc(t('th.zone'))}" data-k="zone">${zoneOptions(r.zone)}</select></td>
      <td class="w-sm"><input aria-label="${L} – x (m)" data-k="x" type="number" step="any" value="${r.x}"></td>
      <td class="w-sm"><input aria-label="${L} – s (mm)" data-k="s" type="number" step="any" min="50" value="${r.s}"></td>
      <td class="w-sm"><input aria-label="${L} – lu (mm)" data-k="lu" type="number" step="any" min="50" value="${r.lu}"></td>
      <td class="w-sm"><input aria-label="${L} – cu (mm)" data-k="crown" type="number" step="any" min="0" value="${r.crown}"></td>
      <td>${heightCell(r, L)}</td>
      <td data-out="P"></td>
      <td data-out="req"></td>
      <td><button type="button" class="icon-btn" data-remove aria-label="${esc(t('a.remove'))} – ${L}">${icon.remove}</button></td>
    </tr>`;
  }).join('');
}

function pressureFor(r, element) {
  const fam = state.material.family;
  return iso.designPressure(craft, {
    element,
    zone: r.zone,
    construction: fam === 'sandwich' ? 'sandwich' : 'single',
    x: r.x,
    b: Math.min(r.b ?? r.s, r.l ?? Infinity),
    l: Math.max(r.b ?? 0, r.l ?? 0),
    s: r.s,
    lu: r.lu,
    h: r.h,
    Z: r.Z,
    hB: r.h,
    kSUP: r.kSUP ?? 'front',
  });
}

const governed = (x) => `<span class="gov">${t('r.governed', { x: esc(tr(x)) })}</span>`;

function plateRequirement(r, P) {
  const m = state.material;
  const zone = r.zone === 'superstructure' ? 'deck' : r.zone;
  const panel = { b: r.b, l: r.l, crown: r.crown };
  switch (m.family) {
    case 'frp': {
      const res = iso.frpSingleSkin(craft, panel, P, { psi: m.psi, kind: m.kind, evalLevel: m.evalLevel }, { zone });
      return `<div class="req"><strong>${t('r.glass', { w: fmt(res.w_required, 2) })}</strong><span class="ltr">${t('r.tAt', { t: fmt(res.t_required, 1), psi: fmt(m.psi, 2) })} · k₂ ${fmt(res.k2, 3)} · k<sub>C</sub> ${fmt(res.kC, 2)}</span>${governed(res.governs)}</div>`;
    }
    case 'aluminium':
    case 'steel': {
      const res = iso.metalPlate(craft, panel, P, m.metal, { zone, welded: m.welded !== 'no' });
      return `<div class="req"><strong class="ltr">t ≥ ${fmt(res.t_required, 1)} mm</strong><span>${t('r.strengthMin', { a: fmt(res.t_strength, 2), b: fmt(res.t_min, 2) })}</span>${governed(res.governs)}<span class="gov">${t('r.noCorrosion')}</span></div>`;
    }
    case 'wood': {
      const res = iso.woodPlate(craft, panel, P, { sigma_uf: m.woodSigma, zone });
      return `<div class="req"><strong class="ltr">t ≥ ${fmt(res.t_required, 1)} mm</strong><span>${t('r.strengthMin', { a: fmt(res.t_strength, 2), b: fmt(res.t_min, 2) })}</span>${governed(res.governs)}</div>`;
    }
    case 'sandwich': {
      const res = iso.frpSandwich(craft, panel, P, { to: m.to, ti: m.ti, tc: m.tc, skinPsi: m.skinPsi, evalLevel: m.evalLevel, core: m.core, coreDensity: m.coreDensity }, { zone });
      const keys = ['chk.SMo', 'chk.SMi', 'chk.I', 'chk.ts', 'chk.core', 'chk.wo', 'chk.wi'];
      const checks = res.checks.map((c, i) => ({ ...c, label: t(keys[i]) }));
      const worst = checks.reduce((w, c) => (c.required > 0 && c.ratio < w.ratio ? c : w), { ratio: Infinity, label: '' });
      const lines = checks.filter((c) => c.required > 0).map((c) => `<span>${c.ok ? '✓' : '✗'} ${esc(c.label)}: ${fmt(c.actual, 2)} / ${fmt(c.required, 2)} ${c.unit}</span>`).join('');
      return `<div class="req">${badge(res.ok, res.ok ? t('r.sandOk') : t('r.fails', { x: esc(worst.label) }))}${lines}</div>`;
    }
    default:
      return '';
  }
}

function stiffenerRequirement(r, P) {
  const m = state.material;
  const st = { s: r.s, lu: r.lu, crown: r.crown };
  if (m.family === 'frp' || m.family === 'sandwich') {
    const lam = iso.glassLaminate(m.stiffPsi, { kind: 'mixed', evalLevel: m.evalLevel });
    const d = iso.frpStiffenerStresses(lam);
    const crown = iso.stiffenerRequirements(P, st, { sigma_d: d.sigma_dc, tau_d: d.tau_d, Etc: d.Etc });
    const plate = iso.stiffenerRequirements(P, st, { sigma_d: d.sigma_dt, tau_d: d.tau_d });
    const be = m.family === 'sandwich' ? '20 (t<sub>o</sub> + t<sub>i</sub>)' : '20 t';
    return `<div class="req"><strong>${t('r.smFrp', { a: fmt(crown.SM, 1), b: fmt(plate.SM, 1) })}</strong><span class="ltr">A<sub>W</sub> ≥ ${fmt(crown.AW, 2)} cm² · I ≥ ${fmt(crown.I, 0)} cm⁴ · k<sub>CS</sub> ${fmt(crown.kCS, 2)}</span><span class="gov">${tr('Eq.')} (48)–(50) · <bdi dir="ltr">ψ ${fmt(m.stiffPsi, 2)} · b<sub>e</sub> = ${be} ≤ s</bdi></span></div>`;
  }
  if (m.family === 'aluminium' || m.family === 'steel') {
    const mt = iso.METALS[m.metal];
    const d = iso.metalStiffenerDesignStress(mt, m.welded !== 'no');
    const res = iso.stiffenerRequirements(P, st, d);
    const be = m.family === 'steel' ? '80 t' : '60 t';
    return `<div class="req"><strong class="ltr">SM ≥ ${fmt(res.SM, 1)} cm³</strong><span class="ltr">A<sub>W</sub> ≥ ${fmt(res.AW, 2)} cm² · k<sub>CS</sub> ${fmt(res.kCS, 2)}</span><span class="gov">${tr('Eq.')} (48)–(49) · <bdi dir="ltr">b<sub>e</sub> = ${be} ≤ s</bdi></span></div>`;
  }
  const res = iso.stiffenerRequirements(P, st, { sigma_d: 0.45 * m.woodSigma, tau_d: 0.45 * m.woodTau });
  return `<div class="req"><strong class="ltr">SM ≥ ${fmt(res.SM, 1)} cm³</strong><span class="ltr">A<sub>W</sub> ≥ ${fmt(res.AW, 2)} cm²</span><span class="gov">${t('r.woodFrames')} · <bdi dir="ltr">σ<sub>d</sub> = 0.45 σ<sub>uf</sub> · b<sub>e</sub> = 15 t</bdi></span></div>`;
}

function computeTables() {
  const rows = [
    ['#plates-table', state.plates, 'plate', plateRequirement],
    ['#stiff-table', state.stiffeners, 'stiffener', stiffenerRequirement],
  ];
  for (const [sel, list, element, requirement] of rows) {
    document.querySelectorAll(`${sel} tbody tr`).forEach((tr_) => {
      const r = list[Number(tr_.dataset.i)];
      const outP = tr_.querySelector('[data-out="P"]');
      const outR = tr_.querySelector('[data-out="req"]');
      try {
        const pr = pressureFor(r, element);
        const tc = pr.trace;
        const kar = tc.kAR?.value ?? tc.kAR_disp?.value;
        outP.innerHTML = `<div class="req"><strong>${fmt(pr.P, 1)}</strong><span class="gov">${esc(tr(pr.governing))}</span>${kar !== undefined ? `<span class="gov ltr">k<sub>AR</sub> ${fmt(kar, 3)} · k<sub>L</sub> ${fmt(tc.kL, 3)}${tc.kZ !== undefined ? ` · k<sub>Z</sub> ${fmt(tc.kZ, 2)}` : ''}</span>` : ''}</div>`;
        outR.innerHTML = requirement(r, pr.P);
        r._P = pr.P;
      } catch (err) {
        outP.textContent = '–';
        outR.innerHTML = `<span class="gov">${esc(err.message)}</span>`;
      }
    });
  }
}

function computeAll() {
  computeCraft();
  materialSummary();
  computeTables();
  refreshBVPlateOptions();
  if (!$('#panel-bv').hidden) computeBV();
  save();
}

function bindTable(sel, list, render) {
  const tbody = $(`${sel} tbody`);
  tbody.addEventListener('input', (e) => {
    const k = e.target.dataset.k;
    if (!k) return;
    const r = list()[Number(e.target.closest('tr').dataset.i)];
    r[k] = e.target.type === 'number' ? num(e.target.value) : e.target.value;
    if (k === 'name') delete r.nameKey;
    if (k === 'zone') render();
    computeAll();
  });
  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove]');
    if (!btn) return;
    list().splice(Number(btn.closest('tr').dataset.i), 1);
    render();
    computeAll();
  });
}

// ---------------------------------------------------------------------------
// Method 2 – BV NR546
// ---------------------------------------------------------------------------
function refreshBVPlateOptions() {
  const sel = $('#bv-form').elements.plate;
  const current = String(state.bv.plate);
  sel.innerHTML = state.plates.map((r, i) => `<option value="${i}">${esc(rowName(r))} · ${fmt(r._P, 1)} kN/m²</option>`).join('') + `<option value="custom">${esc(t('bv.custom'))}</option>`;
  sel.value = state.plates[current] || current === 'custom' ? current : '0';
  if (state.bv.plate !== 'custom') applyPlateToBV(false);
}

function applyPlateToBV(run = true) {
  const r = state.plates[Number(state.bv.plate)];
  if (!r) return;
  state.bv.a = Math.max(r.l, r.b) / 1000;
  state.bv.b = Math.min(r.l, r.b) / 1000;
  state.bv.p = Number(r._P?.toFixed(2));
  const f = $('#bv-form').elements;
  f.a.value = state.bv.a;
  f.b.value = state.bv.b;
  f.p.value = state.bv.p;
  if (run) computeBV();
}

const FABRICS = ['CSM', 'WR', 'UD', 'BIAX', 'CORE'];

function renderLayers() {
  const tbody = $('#layers-table tbody');
  tbody.innerHTML = state.bv.layers.map((l, i) => {
    const isCore = l.fabric === 'CORE';
    const L = esc(`${t('a.layer')} ${i + 1}`);
    const fibreSel = isCore
      ? `<select aria-label="${L} – ${esc(t('fab.CORE'))}" data-k="coreType">${Object.keys(bv.CORE_TYPES).map((k) => `<option value="${k}"${k === l.coreType ? ' selected' : ''}>${esc(t(`core.${k}`))}</option>`).join('')}</select>`
      : `<select aria-label="${L} – ${esc(plain(t('th.fibre')))}" data-k="fibre">${Object.keys(bv.FIBRES).map((k) => `<option value="${k}"${k === l.fibre ? ' selected' : ''}>${esc(t(`fib.${k}`))}</option>`).join('')}</select>`;
    return `
    <tr data-i="${i}">
      <td class="num">${i + 1}</td>
      <td class="w-md"><select aria-label="${L} – ${esc(t('th.fabric'))}" data-k="fabric">${FABRICS.map((k) => `<option value="${k}"${k === l.fabric ? ' selected' : ''}>${esc(t(`fab.${k}`))}</option>`).join('')}</select></td>
      <td class="w-md">${fibreSel}</td>
      <td class="w-sm">${isCore ? `<input aria-label="${L} – kg/m³" data-k="density" type="number" step="any" value="${l.density}">` : `<input aria-label="${L} – g/m²" data-k="mass" type="number" step="any" min="50" value="${l.mass}">`}</td>
      <td class="w-sm">${isCore ? `<input aria-label="${L} – t (mm)" data-k="thickness" type="number" step="any" min="1" value="${l.thickness}">` : `<input aria-label="${L} – Mf" data-k="Mf" type="number" step="any" min="0.15" max="0.75" value="${l.Mf}">`}</td>
      <td class="w-sm">${isCore || l.fabric === 'CSM' ? '<span class="gov">–</span>' : `<input aria-label="${L} – ${esc(t('th.angle'))} (°)" data-k="angle" type="number" step="any" value="${l.angle ?? 0}">`}</td>
      <td class="num" data-out="t"></td>
      <td class="num" data-out="E"></td>
      <td data-out="util"></td>
      <td><button type="button" class="icon-btn" data-remove aria-label="${esc(t('a.remove'))} – ${L}">${icon.remove}</button></td>
    </tr>`;
  }).join('');
}

function computeBV() {
  const f = state.bv.factors;
  const verdict = $('#bv-verdict');
  try {
    if (!state.bv.layers.length) throw new Error(t('bv.noLayer'));
    const res = bv.checkPanel({
      layers: state.bv.layers,
      resin: state.bv.resin,
      process: state.bv.process,
      a: state.bv.a,
      b: state.bv.b,
      p: state.bv.p,
      factors: { CV: f.CV, CF: { [state.bv.process]: f.CF }, CR: { fibre: f.CRf, transverse: f.CRt, shear: f.CRs, interlaminar: f.CRi }, Ci: { sea: f.Ci }, CCS: f.CCS },
    });
    // Map analysed plies back to input rows (a double-bias row becomes two plies).
    let k = 0;
    document.querySelectorAll('#layers-table tbody tr').forEach((row, i) => {
      const n = state.bv.layers[i].fabric === 'BIAX' ? 2 : 1;
      const plies = res.plies.slice(k, k + n);
      k += n;
      const th = plies.reduce((s, p) => s + p.layer.t, 0);
      const el = plies[0].layer.el;
      const util = Math.max(...plies.map((p) => p.util));
      const worst = plies.reduce((w, p) => (p.util > w.util ? p : w));
      const mode = worst.utilIL >= worst.worst.util ? t('mode.il') : worstMode(worst, res.required);
      row.querySelector('[data-out="t"]').textContent = fmt(th, 2);
      row.querySelector('[data-out="E"]').textContent = `${fmt(el.E1, 0)} / ${fmt(el.E2, 0)}`;
      row.querySelector('[data-out="util"]').innerHTML = `<div class="util" title="${esc(mode)}"><div class="util-bar${util > 1 ? ' over' : ''}"><span style="width:${Math.min(util, 1) * 100}%"></span></div><b>${fmt(util * 100, 0)}%</b></div><span class="gov">${esc(mode)}</span>`;
    });
    verdict.className = `verdict ${res.ok ? 'ok' : 'ko'}`;
    verdict.innerHTML = `${badge(res.ok, res.ok ? t('bv.ok') : t('bv.ko'))}<span>${t('bv.util', { u: fmt(res.maxUtil * 100, 0) })}${res.ok ? '' : `. ${t('bv.advice')}`}</span>`;
    $('#bv-derived').innerHTML = derivedList([
      [t('bv.thick'), `${fmt(res.lam.h, 2)} mm`],
      [t('bv.areal'), `${fmt(res.lam.arealMass, 2)} kg/m²`],
      ['E<sub>x</sub> / E<sub>y</sub>', `${fmt(res.lam.Ex, 0)} / ${fmt(res.lam.Ey, 0)} N/mm²`],
      ['D<sub>11</sub> / D<sub>22</sub>', `${fmt(res.mom.D11 / 1e6, 2)} / ${fmt(res.mom.D22 / 1e6, 2)} kN·m`],
      ['M<sub>x</sub> / M<sub>y</sub>', `${fmt(res.mom.Mx / 1000, 2)} / ${fmt(res.mom.My / 1000, 2)} kN·m/m`],
      [t('bv.shear'), `${fmt(res.shear.T, 1)} N/mm`],
      [t('bv.sfReq'), fmt(res.required.fibre, 2)],
      [t('bv.sfcsReq'), fmt(res.required.combined, 2)],
    ]);
  } catch (err) {
    verdict.className = 'verdict ko';
    verdict.innerHTML = `${badge(false, t('bv.check'))}<span>${esc(err.message)}</span>`;
    $('#bv-derived').innerHTML = '';
  }
}

function worstMode(p, req) {
  const sf = p.worst.sf;
  const u = [
    [t('mode.fibre'), req.fibre / sf.fibre],
    [t('mode.transverse'), req.transverse / sf.transverse],
    [t('mode.shear'), req.shear / sf.shear],
    [t('mode.combined'), req.combined / sf.combined],
  ].sort((a, b) => b[1] - a[1]);
  const edge = p.worst.edge === 'side a' ? t('mode.sideA') : t('mode.sideB');
  const face = p.worst.face === 'bottom' ? t('mode.outer') : t('mode.inner');
  return `${u[0][0]} · ${edge} · ${face}`;
}

function bindBV() {
  const form = $('#bv-form');
  fillForm(form, { ...state.bv, plate: String(state.bv.plate) });
  form.addEventListener('input', (e) => {
    const { name, value } = e.target;
    if (name === 'plate') {
      state.bv.plate = value === 'custom' ? 'custom' : Number(value);
      if (value !== 'custom') applyPlateToBV();
    } else {
      state.bv[name] = e.target.type === 'number' ? num(value) : value;
      if (['a', 'b', 'p'].includes(name)) { state.bv.plate = 'custom'; form.elements.plate.value = 'custom'; }
    }
    save();
    computeBV();
  });

  const sf = $('#sf-form');
  fillForm(sf, state.bv.factors);
  sf.addEventListener('input', (e) => {
    state.bv.factors[e.target.name] = num(e.target.value);
    save();
    computeBV();
  });

  const tbody = $('#layers-table tbody');
  tbody.addEventListener('input', (e) => {
    const k = e.target.dataset.k;
    if (!k) return;
    const l = state.bv.layers[Number(e.target.closest('tr').dataset.i)];
    l[k] = e.target.type === 'number' ? num(e.target.value) : e.target.value;
    if (k === 'fabric') {
      if (l.fabric === 'CORE') Object.assign(l, { coreType: l.coreType ?? 'crossPvc', density: l.density ?? 80, thickness: l.thickness ?? 20 });
      else if (l.fabric === 'CSM') l.fibre = 'E';
      if (l.fabric !== 'CORE') Object.assign(l, { fibre: l.fibre ?? 'E', mass: l.mass ?? 450, Mf: l.Mf ?? 0.5, angle: l.angle ?? 0 });
      renderLayers();
    }
    save();
    computeBV();
  });
  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove]');
    if (!btn) return;
    state.bv.layers.splice(Number(btn.closest('tr').dataset.i), 1);
    renderLayers();
    save();
    computeBV();
  });
  $('#add-layer').addEventListener('click', () => {
    state.bv.layers.push({ fabric: 'WR', fibre: 'E', mass: 600, Mf: 0.5, angle: 0 });
    renderLayers();
    save();
    computeBV();
  });
  $('#add-core').addEventListener('click', () => {
    state.bv.layers.push({ fabric: 'CORE', coreType: 'crossPvc', density: 80, thickness: 20 });
    renderLayers();
    save();
    computeBV();
  });
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
function rerenderForLanguage() {
  translateMaterialOptions();
  renderPlates();
  renderStiffeners();
  renderLayers();
  computeAll();
  computeBV();
}

function init() {
  setupTabs();
  const craftForm = $('#craft-form');
  fillForm(craftForm, state.craft);
  craftForm.addEventListener('input', () => { readForm(craftForm, state.craft); computeAll(); });

  materialSetup();
  const matForm = $('#mat-form');
  matForm.addEventListener('input', (e) => {
    readForm(matForm, state.material);
    if (e.target.name === 'family') { updateMetalOptions(); syncMaterialVisibility(); }
    computeAll();
  });

  renderPlates();
  renderStiffeners();
  bindTable('#plates-table', () => state.plates, renderPlates);
  bindTable('#stiff-table', () => state.stiffeners, renderStiffeners);

  $('#add-plate').addEventListener('click', () => {
    state.plates.push({ name: t('new.panel', { n: state.plates.length + 1 }), zone: 'bottom', x: 5, b: 400, l: 1000, crown: 0, h: 0, Z: 1.5 });
    renderPlates();
    computeAll();
  });
  $('#add-stiff').addEventListener('click', () => {
    state.stiffeners.push({ name: t('new.stiff', { n: state.stiffeners.length + 1 }), zone: 'bottom', x: 5, s: 400, lu: 1200, crown: 0, h: 0, Z: 1.5 });
    renderStiffeners();
    computeAll();
  });

  renderLayers();
  computeAll();
  bindBV();
  computeBV();

  $('#reset').addEventListener('click', () => {
    state = EXAMPLE();
    save();
    window.location.reload();
  });
  $('#print').addEventListener('click', () => window.print());

  onLangChange(rerenderForLanguage);
}

init();
