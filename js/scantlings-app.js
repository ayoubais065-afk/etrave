// ÉTRAVE – scantling calculator page
import * as iso from './scantling/iso12215-5.js';
import * as bv from './scantling/bv-nr546.js';

const STORAGE_KEY = 'etrave.scantlings.v1';

const ZONES = {
  bottom: 'Bottom',
  side: 'Side',
  deck: 'Deck',
  superstructure: 'Superstructure',
  wtBulkhead: 'WT bulkhead',
  tank: 'Tank boundary',
};

// Reference project: 12 m GRP trawler, design category B.
const EXAMPLE = () => ({
  craft: { type: 'motor', category: 'B', LH: 12, LWL: 10.8, BWL: 4.0, BC: 3.6, beta: 15, V: 10, mLDC: 26900 },
  material: {
    family: 'frp', evalLevel: 'c', psi: 0.3, kind: 'mixed',
    skinPsi: 0.5, to: 3.5, ti: 3, tc: 25, core: 'pvc1', coreDensity: 80,
    metal: 'al-5083-H111', welded: 'yes', woodSigma: 30, woodTau: 6, stiffPsi: 0.5,
  },
  plates: [
    { name: 'Bottom aft', zone: 'bottom', x: 2.5, b: 400, l: 1000, crown: 0, h: 0, Z: 1.6 },
    { name: 'Bottom forward', zone: 'bottom', x: 8.0, b: 400, l: 1000, crown: 10, h: 0, Z: 1.9 },
    { name: 'Side', zone: 'side', x: 5.0, b: 400, l: 1000, crown: 0, h: 0.6, Z: 1.7 },
    { name: 'Weather deck', zone: 'deck', x: 5.0, b: 450, l: 1200, crown: 15, h: 0, Z: 0 },
    { name: 'Wheelhouse front', zone: 'superstructure', x: 6.5, b: 500, l: 800, crown: 0, h: 0, Z: 0, kSUP: 'front' },
  ],
  stiffeners: [
    { name: 'Bottom frame', zone: 'bottom', x: 4.0, s: 400, lu: 1300, crown: 0, h: 0, Z: 1.6 },
    { name: 'Side frame', zone: 'side', x: 5.0, s: 400, lu: 1200, crown: 0, h: 0.6, Z: 1.7 },
    { name: 'Deck beam', zone: 'deck', x: 5.0, s: 450, lu: 2000, crown: 40, h: 0, Z: 0 },
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
const fmt = (n, d = 1) => (Number.isFinite(n) ? n.toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d }) : '–');
const num = (v) => (v === '' || v === null || v === undefined ? NaN : Number(v));
const badge = (ok, okText = 'OK', koText = 'Not OK') => `<span class="badge ${ok ? 'ok' : 'ko'}">${ok ? okText : koText}</span>`;
const icon = {
  remove: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 7h14M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

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
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
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
  const items = [
    ['k_DC', fmt(craft.kDC, 1)],
    ['V / √L_WL', fmt(craft.speedLengthRatio, 2)],
    ['Mode', craft.type === 'sail' ? 'Sailing craft' : craft.planing ? 'Planing' : 'Displacement'],
    ['n_CG', `${fmt(n.value, 2)} g`],
    ['n_CG for k_L', fmt(Math.max(n.value, 3), 2)],
    ['V used', `${fmt(craft.V, 1)} kn`],
  ];
  $('#craft-derived').innerHTML = items.map(([k, v]) => `<div><dt>${k.replace(/_([A-Z]+)/g, '<sub>$1</sub>')}</dt><dd>${v}</dd></div>`).join('');
  const warn = [...craft.warnings];
  if (craft.type === 'motor' && n.eq1 !== null && n.eq1 > 3) warn.push(`n_CG: ${n.note}.`);
  $('#craft-warnings').innerHTML = warn.map((w) => `<li>${esc(w)}</li>`).join('');
}

function materialSetup() {
  const form = $('#mat-form');
  form.elements.core.innerHTML = Object.entries(iso.CORES).map(([k, c]) => `<option value="${k}">${esc(c.label)}</option>`).join('');
  updateMetalOptions();
  fillForm(form, state.material);
  syncMaterialVisibility();
}

function updateMetalOptions() {
  const form = $('#mat-form');
  const fam = state.material.family;
  const kind = fam === 'steel' ? 'steel' : 'aluminium';
  form.elements.metal.innerHTML = Object.entries(iso.METALS).filter(([, m]) => m.kind === kind).map(([k, m]) => `<option value="${k}">${esc(m.label)}</option>`).join('');
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
  const items = [];
  if (m.family === 'frp') {
    const p = iso.glassLaminate(m.psi, m);
    items.push(['σ_uf', `${fmt(p.sigma_uf, 0)} N/mm²`], ['σ_d plating', `${fmt(0.5 * p.sigma_uf, 1)} N/mm²`], ['E', `${fmt(p.E, 0)} N/mm²`], ['t / w', `${fmt(iso.thicknessPerFibreMass(m.psi), 2)} mm per kg/m²`]);
  } else if (m.family === 'sandwich') {
    const s = iso.glassLaminate(m.skinPsi, { kind: 'mixed', evalLevel: m.evalLevel });
    const c = iso.coreProperties(m.core, m.coreDensity);
    items.push(['Skin σ_ut', `${fmt(s.sigma_ut, 0)} N/mm²`], ['Skin σ_uc', `${fmt(s.sigma_uc, 0)} N/mm²`], ['Core τ_u', `${fmt(c.tau_u, 2)} N/mm²`], ['Core τ_d', `${fmt(c.tau_d, 2)} N/mm²`], ['Core G', `${fmt(c.G, 0)} N/mm²`]);
  } else if (m.family === 'aluminium' || m.family === 'steel') {
    const mt = iso.METALS[m.metal];
    const welded = m.welded !== 'no';
    const st = iso.metalStiffenerDesignStress(mt, welded);
    items.push(['σ_d plating', `${fmt(iso.metalPlateDesignStress(mt, welded), 0)} N/mm²`], ['σ_d stiffeners', `${fmt(st.sigma_d, 0)} N/mm²`], ['τ_d stiffeners', `${fmt(st.tau_d, 0)} N/mm²`]);
  } else {
    items.push(['σ_d plating', `${fmt(0.5 * m.woodSigma, 1)} N/mm²`], ['σ_d frames', `${fmt(0.45 * m.woodSigma, 1)} N/mm²`]);
  }
  $('#mat-derived').innerHTML = items.map(([k, v]) => `<div><dt>${k.replace(/_(\w+)/, '<sub>$1</sub>')}</dt><dd>${v}</dd></div>`).join('');
}

// ---------------------------------------------------------------------------
// Plating and stiffener tables
// ---------------------------------------------------------------------------
function zoneOptions(selected, list = Object.keys(ZONES)) {
  return list.map((z) => `<option value="${z}"${z === selected ? ' selected' : ''}>${ZONES[z]}</option>`).join('');
}

function heightCell(row, i, kind) {
  const label = row.zone === 'side' ? 'h and Z' : row.zone === 'wtBulkhead' || row.zone === 'tank' ? 'Head h_B' : 'Not used';
  if (row.zone === 'side') {
    return `<div class="pair"><input aria-label="${kind} ${i + 1} h above WL" data-k="h" type="number" step="any" value="${row.h}"><input aria-label="${kind} ${i + 1} Z top of hull above WL" data-k="Z" type="number" step="any" value="${row.Z}"></div>`;
  }
  if (row.zone === 'wtBulkhead' || row.zone === 'tank') {
    return `<input aria-label="${kind} ${i + 1} ${label} (m)" data-k="h" type="number" step="any" value="${row.h}" title="Water head h_B, m">`;
  }
  if (row.zone === 'superstructure') {
    return `<select aria-label="${kind} ${i + 1} superstructure position" data-k="kSUP">${Object.entries(iso.K_SUP).map(([k, v]) => `<option value="${k}"${k === row.kSUP ? ' selected' : ''}>${esc(v.label)}</option>`).join('')}</select>`;
  }
  return '<span class="gov">–</span>';
}

function renderPlates() {
  const tbody = $('#plates-table tbody');
  tbody.innerHTML = state.plates.map((r, i) => `
    <tr data-i="${i}">
      <td class="w-name"><input aria-label="Panel ${i + 1} name" data-k="name" value="${esc(r.name)}"></td>
      <td class="w-md"><select aria-label="Panel ${i + 1} zone" data-k="zone">${zoneOptions(r.zone)}</select></td>
      <td class="w-sm"><input aria-label="Panel ${i + 1} x from aft end of LWL (m)" data-k="x" type="number" step="any" value="${r.x}"></td>
      <td class="w-sm"><input aria-label="Panel ${i + 1} b (mm)" data-k="b" type="number" step="any" min="50" value="${r.b}"></td>
      <td class="w-sm"><input aria-label="Panel ${i + 1} l (mm)" data-k="l" type="number" step="any" min="50" value="${r.l}"></td>
      <td class="w-sm"><input aria-label="Panel ${i + 1} crown (mm)" data-k="crown" type="number" step="any" min="0" value="${r.crown}"></td>
      <td>${heightCell(r, i, 'Panel')}</td>
      <td class="num" data-out="P"></td>
      <td data-out="req"></td>
      <td><button type="button" class="icon-btn" data-remove aria-label="Remove panel ${i + 1}">${icon.remove}</button></td>
    </tr>`).join('');
}

function renderStiffeners() {
  const tbody = $('#stiff-table tbody');
  const zones = ['bottom', 'side', 'deck', 'superstructure', 'wtBulkhead', 'tank'];
  tbody.innerHTML = state.stiffeners.map((r, i) => `
    <tr data-i="${i}">
      <td class="w-name"><input aria-label="Stiffener ${i + 1} name" data-k="name" value="${esc(r.name)}"></td>
      <td class="w-md"><select aria-label="Stiffener ${i + 1} zone" data-k="zone">${zoneOptions(r.zone, zones)}</select></td>
      <td class="w-sm"><input aria-label="Stiffener ${i + 1} x (m)" data-k="x" type="number" step="any" value="${r.x}"></td>
      <td class="w-sm"><input aria-label="Stiffener ${i + 1} spacing s (mm)" data-k="s" type="number" step="any" min="50" value="${r.s}"></td>
      <td class="w-sm"><input aria-label="Stiffener ${i + 1} span lu (mm)" data-k="lu" type="number" step="any" min="50" value="${r.lu}"></td>
      <td class="w-sm"><input aria-label="Stiffener ${i + 1} crown (mm)" data-k="crown" type="number" step="any" min="0" value="${r.crown}"></td>
      <td>${heightCell(r, i, 'Stiffener')}</td>
      <td class="num" data-out="P"></td>
      <td data-out="req"></td>
      <td><button type="button" class="icon-btn" data-remove aria-label="Remove stiffener ${i + 1}">${icon.remove}</button></td>
    </tr>`).join('');
}

function pressureFor(r, element) {
  const fam = state.material.family;
  const el = {
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
  };
  return iso.designPressure(craft, el);
}

function plateRequirement(r, P) {
  const m = state.material;
  const zone = r.zone === 'superstructure' ? 'deck' : r.zone;
  const panel = { b: r.b, l: r.l, crown: r.crown };
  switch (m.family) {
    case 'frp': {
      const res = iso.frpSingleSkin(craft, panel, P, { psi: m.psi, kind: m.kind, evalLevel: m.evalLevel }, { zone });
      return `<div class="req"><strong>${fmt(res.w_required, 2)} kg/m² glass</strong><span>t ≈ ${fmt(res.t_required, 1)} mm at ψ ${fmt(m.psi, 2)} · k₂ ${fmt(res.k2, 3)} · k<sub>C</sub> ${fmt(res.kC, 2)}</span><span class="gov">Governed by ${esc(res.governs)}</span></div>`;
    }
    case 'aluminium':
    case 'steel': {
      const res = iso.metalPlate(craft, panel, P, m.metal, { zone, welded: m.welded !== 'no' });
      return `<div class="req"><strong>t ≥ ${fmt(res.t_required, 1)} mm</strong><span>strength ${fmt(res.t_strength, 2)} mm · minimum ${fmt(res.t_min, 2)} mm</span><span class="gov">Governed by ${esc(res.governs)}; no corrosion margin</span></div>`;
    }
    case 'wood': {
      const res = iso.woodPlate(craft, panel, P, { sigma_uf: m.woodSigma, zone });
      return `<div class="req"><strong>t ≥ ${fmt(res.t_required, 1)} mm</strong><span>strength ${fmt(res.t_strength, 2)} mm · minimum ${fmt(res.t_min, 2)} mm</span><span class="gov">Governed by ${esc(res.governs)}</span></div>`;
    }
    case 'sandwich': {
      const res = iso.frpSandwich(craft, panel, P, { to: m.to, ti: m.ti, tc: m.tc, skinPsi: m.skinPsi, evalLevel: m.evalLevel, core: m.core, coreDensity: m.coreDensity }, { zone });
      const worst = res.checks.reduce((w, c) => (c.required > 0 && c.ratio < w.ratio ? c : w), { ratio: Infinity });
      const lines = res.checks.filter((c) => c.required > 0).map((c) => `<span>${c.ok ? '✓' : '✗'} ${esc(c.label)}: ${fmt(c.actual, 2)} / ${fmt(c.required, 2)} ${c.unit}</span>`).join('');
      return `<div class="req">${badge(res.ok, 'Sandwich OK', `Fails: ${esc(worst.label)}`)}${lines}</div>`;
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
    return `<div class="req"><strong>SM ≥ ${fmt(crown.SM, 1)} cm³ (crown) · ${fmt(plate.SM, 1)} cm³ (plating)</strong><span>A<sub>W</sub> ≥ ${fmt(crown.AW, 2)} cm² · I ≥ ${fmt(crown.I, 0)} cm⁴ · k<sub>CS</sub> ${fmt(crown.kCS, 2)}</span><span class="gov">Eq. (48)–(50) · ψ ${fmt(m.stiffPsi, 2)} · b<sub>e</sub> = ${be} ≤ s</span></div>`;
  }
  if (m.family === 'aluminium' || m.family === 'steel') {
    const mt = iso.METALS[m.metal];
    const d = iso.metalStiffenerDesignStress(mt, m.welded !== 'no');
    const res = iso.stiffenerRequirements(P, st, d);
    const be = m.family === 'steel' ? '80 t' : '60 t';
    return `<div class="req"><strong>SM ≥ ${fmt(res.SM, 1)} cm³</strong><span>A<sub>W</sub> ≥ ${fmt(res.AW, 2)} cm² · k<sub>CS</sub> ${fmt(res.kCS, 2)}</span><span class="gov">Eq. (48)–(49) · b<sub>e</sub> = ${be} ≤ s</span></div>`;
  }
  const res = iso.stiffenerRequirements(P, st, { sigma_d: 0.45 * m.woodSigma, tau_d: 0.45 * m.woodTau });
  return `<div class="req"><strong>SM ≥ ${fmt(res.SM, 1)} cm³</strong><span>A<sub>W</sub> ≥ ${fmt(res.AW, 2)} cm²</span><span class="gov">Laminated wood frames, σ<sub>d</sub> = 0.45 σ<sub>uf</sub> · b<sub>e</sub> = 15 t</span></div>`;
}

function computeTables() {
  const rows = [
    ['#plates-table', state.plates, 'plate', plateRequirement],
    ['#stiff-table', state.stiffeners, 'stiffener', stiffenerRequirement],
  ];
  for (const [sel, list, element, requirement] of rows) {
    document.querySelectorAll(`${sel} tbody tr`).forEach((tr) => {
      const r = list[Number(tr.dataset.i)];
      const outP = tr.querySelector('[data-out="P"]');
      const outR = tr.querySelector('[data-out="req"]');
      try {
        const pr = pressureFor(r, element);
        const t = pr.trace;
        const kar = t.kAR?.value ?? t.kAR_disp?.value;
        outP.innerHTML = `<div class="req"><strong>${fmt(pr.P, 1)}</strong><span class="gov">${esc(pr.governing)}</span>${kar !== undefined ? `<span class="gov">k<sub>AR</sub> ${fmt(kar, 3)} · k<sub>L</sub> ${fmt(t.kL, 3)}${t.kZ !== undefined ? ` · k<sub>Z</sub> ${fmt(t.kZ, 2)}` : ''}</span>` : ''}</div>`;
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
    if (k === 'zone') { render(); }
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
  sel.innerHTML = state.plates.map((r, i) => `<option value="${i}">${esc(r.name)} · ${fmt(r._P, 1)} kN/m²</option>`).join('') + '<option value="custom">Custom panel</option>';
  sel.value = state.plates[current] || current === 'custom' ? current : '0';
  if (state.bv.plate !== 'custom') applyPlateToBV(false);
}

function applyPlateToBV(fill = true) {
  const r = state.plates[Number(state.bv.plate)];
  if (!r) return;
  state.bv.a = Math.max(r.l, r.b) / 1000;
  state.bv.b = Math.min(r.l, r.b) / 1000;
  state.bv.p = Number(r._P?.toFixed(2));
  const f = $('#bv-form').elements;
  f.a.value = state.bv.a;
  f.b.value = state.bv.b;
  f.p.value = state.bv.p;
  if (fill) computeBV();
}

const FABRICS = { CSM: 'Chopped strand mat', WR: 'Woven roving', UD: 'Unidirectional', BIAX: 'Double bias ±45°', CORE: 'Core' };

function renderLayers() {
  const tbody = $('#layers-table tbody');
  tbody.innerHTML = state.bv.layers.map((l, i) => {
    const isCore = l.fabric === 'CORE';
    const fibreSel = isCore
      ? `<select aria-label="Layer ${i + 1} core" data-k="coreType">${Object.entries(bv.CORE_TYPES).map(([k, v]) => `<option value="${k}"${k === l.coreType ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select>`
      : `<select aria-label="Layer ${i + 1} fibre" data-k="fibre">${Object.entries(bv.FIBRES).map(([k, v]) => `<option value="${k}"${k === l.fibre ? ' selected' : ''}>${esc(v.label)}</option>`).join('')}</select>`;
    return `
    <tr data-i="${i}">
      <td class="num">${i + 1}</td>
      <td class="w-md"><select aria-label="Layer ${i + 1} fabric" data-k="fabric">${Object.entries(FABRICS).map(([k, v]) => `<option value="${k}"${k === l.fabric ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select></td>
      <td class="w-md">${fibreSel}</td>
      <td class="w-sm">${isCore ? `<input aria-label="Layer ${i + 1} core density (kg/m³)" data-k="density" type="number" step="any" value="${l.density}">` : `<input aria-label="Layer ${i + 1} fibre mass (g/m²)" data-k="mass" type="number" step="any" min="50" value="${l.mass}">`}</td>
      <td class="w-sm">${isCore ? `<input aria-label="Layer ${i + 1} core thickness (mm)" data-k="thickness" type="number" step="any" min="1" value="${l.thickness}">` : `<input aria-label="Layer ${i + 1} fibre mass content" data-k="Mf" type="number" step="any" min="0.15" max="0.75" value="${l.Mf}">`}</td>
      <td class="w-sm">${isCore || l.fabric === 'CSM' ? '<span class="gov">–</span>' : `<input aria-label="Layer ${i + 1} angle to X (°)" data-k="angle" type="number" step="any" value="${l.angle ?? 0}">`}</td>
      <td class="num" data-out="t"></td>
      <td class="num" data-out="E"></td>
      <td data-out="util"></td>
      <td><button type="button" class="icon-btn" data-remove aria-label="Remove layer ${i + 1}">${icon.remove}</button></td>
    </tr>`;
  }).join('');
}

function computeBV() {
  const f = state.bv.factors;
  const verdict = $('#bv-verdict');
  try {
    if (!state.bv.layers.length) throw new Error('Add at least one layer.');
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
    document.querySelectorAll('#layers-table tbody tr').forEach((tr, i) => {
      const n = state.bv.layers[i].fabric === 'BIAX' ? 2 : 1;
      const plies = res.plies.slice(k, k + n);
      k += n;
      const t = plies.reduce((s, p) => s + p.layer.t, 0);
      const el = plies[0].layer.el;
      const util = Math.max(...plies.map((p) => p.util));
      const worst = plies.reduce((w, p) => (p.util > w.util ? p : w));
      const mode = worst.utilIL >= worst.worst.util ? 'interlaminar shear' : worstMode(worst, res.required);
      tr.querySelector('[data-out="t"]').textContent = fmt(t, 2);
      tr.querySelector('[data-out="E"]').textContent = `${fmt(el.E1, 0)} / ${fmt(el.E2, 0)}`;
      tr.querySelector('[data-out="util"]').innerHTML = `<div class="util" title="${esc(mode)}"><div class="util-bar${util > 1 ? ' over' : ''}"><span style="width:${Math.min(util, 1) * 100}%"></span></div><b>${fmt(util * 100, 0)}%</b></div><span class="gov">${esc(mode)}</span>`;
    });
    verdict.className = `verdict ${res.ok ? 'ok' : 'ko'}`;
    verdict.innerHTML = `${badge(res.ok, 'Laminate OK', 'Laminate not OK')}<span>Maximum utilisation ${fmt(res.maxUtil * 100, 0)} % of the required safety factor${res.ok ? '' : '. Increase the laminate or reduce the panel size.'}</span>`;
    const items = [
      ['Thickness', `${fmt(res.lam.h, 2)} mm`],
      ['Areal mass', `${fmt(res.lam.arealMass, 2)} kg/m²`],
      ['E_x / E_y', `${fmt(res.lam.Ex, 0)} / ${fmt(res.lam.Ey, 0)}`],
      ['D_11 / D_22', `${fmt(res.mom.D11 / 1e6, 2)} / ${fmt(res.mom.D22 / 1e6, 2)} kN·m`],
      ['M_x / M_y', `${fmt(res.mom.Mx / 1000, 2)} / ${fmt(res.mom.My / 1000, 2)} kN·m/m`],
      ['Shear T', `${fmt(res.shear.T, 1)} N/mm`],
      ['SF required', fmt(res.required.fibre, 2)],
      ['SF_CS required', fmt(res.required.combined, 2)],
    ];
    $('#bv-derived').innerHTML = items.map(([a, b]) => `<div><dt>${a.replace(/_(\w+)/g, '<sub>$1</sub>')}</dt><dd>${b}</dd></div>`).join('');
  } catch (err) {
    verdict.className = 'verdict ko';
    verdict.innerHTML = `${badge(false, '', 'Check input')}<span>${esc(err.message)}</span>`;
    $('#bv-derived').innerHTML = '';
  }
}

function worstMode(p, req) {
  const sf = p.worst.sf;
  const u = { 'fibre direction': req.fibre / sf.fibre, transverse: req.transverse / sf.transverse, 'in-plane shear': req.shear / sf.shear, 'combined (Hoffman)': req.combined / sf.combined };
  const [mode] = Object.entries(u).sort((a, b) => b[1] - a[1])[0];
  return `${mode}, ${p.worst.edge}, ${p.worst.face === 'bottom' ? 'outer' : 'inner'} face`;
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
    state.plates.push({ name: `Panel ${state.plates.length + 1}`, zone: 'bottom', x: 5, b: 400, l: 1000, crown: 0, h: 0, Z: 1.5 });
    renderPlates();
    computeAll();
  });
  $('#add-stiff').addEventListener('click', () => {
    state.stiffeners.push({ name: `Stiffener ${state.stiffeners.length + 1}`, zone: 'bottom', x: 5, s: 400, lu: 1200, crown: 0, h: 0, Z: 1.5 });
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
}

init();
