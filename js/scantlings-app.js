// ÉTRAVE – scantling calculator page (Bureau Veritas NR600 + NR546)
import * as nr600 from './rules/nr600.js';
import * as nr546 from './rules/nr546.js';
import { t, fmt, onLangChange } from './i18n.js';
import { estimate, groupOf } from './estimate.js';

const STORAGE_KEY = 'etrave.scantlings.v3';

// Reference project: 12 m steel trawler, coastal area (same data as the tests).
// Example rows carry a nameKey so that their names follow the interface
// language until the user renames them.
const EXAMPLE = () => ({
  tab: 'metal',
  // Only length and breadth are given; everything else is estimated.
  ship: {
    service: 'fishing', navigation: 'coastal', planing: 'no', LHULL: 12.5, B: 4.4,
    LWL: NaN, BWL: NaN, D: NaN, T: NaN, displacement: NaN, V: NaN, deadriseLCG: NaN, aCG: NaN,
  },
  metal: { kind: 'steel', grade: 'A' },
  plates: [
    { nameKey: 'ex.bottomMid', zone: 'bottom', x: 5.75, s: 0.4, l: 1.2, z: 0, framing: 'transverse' },
    { nameKey: 'ex.bottomFwd', zone: 'bottom', x: 9.8, s: 0.4, l: 1.2, z: 0, framing: 'transverse' },
    { nameKey: 'ex.side', zone: 'side', x: 5.75, s: 0.4, l: 1.2, z: 1.6, framing: 'transverse' },
    { nameKey: 'ex.deck', zone: 'workdeck', x: 5.75, s: 0.4, l: 1.2, z: NaN, framing: 'transverse' },
  ],
  stiffeners: [
    { nameKey: 'ex.floor', zone: 'bottom', type: 'transverse', x: 5.75, s: 0.4, l: 1.2, z: 0, end: 'fixed' },
    { nameKey: 'ex.frame', zone: 'side', type: 'frame', x: 5.75, s: 0.4, l: 1.4, z: 0.8, end: 'fixed' },
    { nameKey: 'ex.beam', zone: 'workdeck', type: 'transverse', x: 5.75, s: 0.4, l: 2.0, z: NaN, end: 'fixed' },
  ],
  comp: {
    plate: 0, resin: 'polyester', process: 'handLayUp',
    layers: [
      { fabric: 'CSM', fibre: 'E', mass: 300, Mf: 0.3, angle: 0 },
      ...Array.from({ length: 4 }, () => [
        { fabric: 'CSM', fibre: 'E', mass: 450, Mf: 0.3, angle: 0 },
        { fabric: 'WR', fibre: 'E', mass: 800, Mf: 0.5, angle: 0 },
      ]).flat(),
      { fabric: 'CSM', fibre: 'E', mass: 450, Mf: 0.3, angle: 0 },
    ],
  },
});

let state = load() ?? EXAMPLE();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s && s.ship && s.plates && s.stiffeners && s.comp ? s : null;
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
const val = (v) => (Number.isFinite(v) ? v : '');
const ok = (v, min = 0) => Number.isFinite(v) && v >= min;
const badge = (good, text) => `<span class="badge ${good ? 'ok' : 'ko'}">${text}</span>`;
const plain = (html) => html.replace(/<[^>]+>/g, '');
const rowName = (r) => r.name ?? t(r.nameKey);
const derivedList = (items) => items.map(([k, v]) => `<div><dt>${k}</dt><dd><span class="ltr">${v}</span></dd></div>`).join('');
const options = (keys, selected, label) => keys.map((k) => `<option value="${k}"${k === selected ? ' selected' : ''}>${esc(label(k))}</option>`).join('');
const icon = {
  remove: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 7h14M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

function fillForm(form, values) {
  for (const el of form.elements) {
    if (!el.name || !(el.name in values)) continue;
    el.value = el.type === 'number' ? val(values[el.name]) : values[el.name];
  }
}

const ZONES = ['bottom', 'side', 'deck', 'workdeck'];
const FRAMINGS = ['transverse', 'longitudinal'];
const TYPES = ['transverse', 'longitudinal', 'frame'];
const ENDS = Object.keys(nr600.END_CONDITIONS);
const FABRICS = ['CSM', 'WR', 'UD', 'BIAX', 'CORE'];

/** Rule zone and extra flags of a calculator zone. */
const ruleZone = (zone) => (zone === 'workdeck' ? { zone: 'deck', workingDeck: true } : { zone, workingDeck: false });

// ---------------------------------------------------------------------------
// Method tabs
// ---------------------------------------------------------------------------
function setupTabs() {
  const tabs = [...document.querySelectorAll('.method-tabs [role="tab"]')];
  const select = (tab, focus = false) => {
    tabs.forEach((tb) => {
      const on = tb === tab;
      tb.setAttribute('aria-selected', String(on));
      tb.tabIndex = on ? 0 : -1;
      document.getElementById(tb.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
    state.tab = tab.id === 'tab-comp' ? 'comp' : 'metal';
    save();
    if (state.tab === 'comp') computeComposite();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      select(tabs[(i + 1) % tabs.length], true);
    });
  });
  select(state.tab === 'comp' ? $('#tab-comp') : $('#tab-metal'));
}

// ---------------------------------------------------------------------------
// Ship data
// ---------------------------------------------------------------------------
let sh = null;

let est = null;

/** Values used by the rules: the designer's own where given, otherwise the estimate. */
function shipInput() {
  const s = state.ship;
  const planing = s.planing === 'yes';
  est = estimate({ ...s, planing });
  const v = est.values;
  return {
    service: s.service, group: groupOf(s.service), navigation: s.navigation, planing,
    LHULL: s.LHULL, LWL: v.LWL, B: v.BWL, D: v.D, T: v.T, displacement: v.displacement, V: v.V,
    deadriseLCG: v.deadriseLCG, aCG: ok(s.aCG) && s.aCG > 0 ? s.aCG : undefined,
  };
}

function shipValid() {
  const s = state.ship;
  return ok(s.LHULL) && s.LHULL >= 2 && ok(s.B) && s.B > 0.3;
}

/** Shows the estimate as placeholder of every field left empty. */
function showEstimates(input) {
  const form = $('#ship-form');
  const used = sh ? nr600.designAcceleration(sh).aCG : NaN;
  for (const label of form.querySelectorAll('[data-auto]')) {
    const k = label.dataset.auto;
    const inp = label.querySelector('input');
    const a = k === 'aCG' ? (input?.planing ? used : NaN) : est?.auto[k];
    const d = k === 'displacement' ? 1 : k === 'deadriseLCG' ? 0 : 2;
    inp.placeholder = Number.isFinite(a) ? `${t('auto.tag')} ${fmt(a, d)}` : (k === 'aCG' ? '–' : '');
    label.classList.toggle('is-auto', !(Number.isFinite(state.ship[k]) && state.ship[k] > 0));
  }
}

function computeShip() {
  const warn = [];
  if (!shipValid()) {
    sh = null;
    est = null;
    showEstimates(null);
    $('#ship-derived').innerHTML = '';
    $('#ship-warnings').innerHTML = `<li>${esc(t('comp.check'))}</li>`;
    return;
  }
  const input = shipInput();
  if (!(input.T < input.D) || !(input.LWL > 0) || !(input.displacement > 0)) {
    sh = null;
    showEstimates(input);
    $('#ship-derived').innerHTML = '';
    $('#ship-warnings').innerHTML = `<li>${esc(t('comp.check'))} (T &lt; D)</li>`;
    return;
  }
  sh = nr600.ship(input);
  showEstimates(input);
  const h = nr600.relativeMotion(sh);
  const items = [
    [t('d.LW'), `${fmt(sh.LW, 2)} m`],
    ['C<sub>B</sub>', fmt(sh.CB, 3)],
    ['C<sub>W</sub>', fmt(sh.CW, 3)],
    ['n / n<sub>1</sub>', `${fmt(sh.n, 2)} / ${fmt(sh.n1, 2)}`],
    [t('d.h1'), `<span class="ltr">${[1, 2, 3, 4].map((a) => fmt(h[a], 2)).join(' / ')} m</span>`],
    ['V / √L<sub>WL</sub>', fmt(sh.FnL, 2)],
    [t('d.planingGuide'), sh.planingGuidance ? t('d.planingYes') : t('d.planingNo')],
  ];
  if (sh.planing) {
    const a = nr600.designAcceleration(sh);
    items.push([t('d.aCG'), `${fmt(a.aCG, 2)} g <span class="gov">${esc(a.source === 'designer' ? t('d.aCGdesigner') : t('d.aCGguide'))}</span>`]);
  } else {
    items.push([t('d.aCG'), `<span class="gov">${esc(t('d.notPlaning'))}</span>`]);
  }
  $('#ship-derived').innerHTML = derivedList(items);

  for (const w of sh.warnings) warn.push(t(`w.${w}`));
  // High speed craft criterion of the HSC Code: V ≥ 3.7 ∇^0.1667 (m/s, m³).
  const vol = sh.displacement / 1.025;
  if (sh.V * 0.5144 >= 3.7 * Math.pow(vol, 0.1667)) warn.push(t('w.HSC'));
  $('#ship-warnings').innerHTML = warn.map((w) => `<li>${w}</li>`).join('');
}

function bindShip() {
  const form = $('#ship-form');
  fillForm(form, state.ship);
  form.addEventListener('input', (e) => {
    const el = e.target;
    if (!el.name) return;
    state.ship[el.name] = el.type === 'number' ? num(el.value) : el.value;
    computeAll();
  });
}

// ---------------------------------------------------------------------------
// Material
// ---------------------------------------------------------------------------
let mat = null;

function renderGrades() {
  const form = $('#mat-form');
  const list = state.metal.kind === 'steel' ? nr600.STEELS : nr600.ALUMINIUMS;
  if (!list[state.metal.grade]) state.metal.grade = Object.keys(list)[0];
  form.elements.grade.innerHTML = options(Object.keys(list), state.metal.grade, (k) => list[k].label);
  $('#alu-note').hidden = state.metal.kind !== 'aluminium';
}

function computeMaterial() {
  mat = nr600.metal(state.metal.kind, state.metal.grade);
  const items = [
    ['k', fmt(mat.k, 2)],
    [state.metal.kind === 'steel' ? 'R = 235 / k' : 'R′<sub>lim</sub>', `${fmt(mat.R, 0)} N/mm²`],
  ];
  if (sh) {
    items.push(['t<sub>min</sub>', `${fmt(nr600.minPlateThickness(sh, mat), 2)} mm`]);
    items.push(['Z<sub>min</sub>', `${fmt(nr600.minStiffenerModulus(sh, mat), 1)} cm³`]);
  }
  $('#mat-derived').innerHTML = derivedList(items);
}

function bindMaterial() {
  const form = $('#mat-form');
  form.elements.kind.value = state.metal.kind;
  renderGrades();
  form.addEventListener('input', (e) => {
    state.metal[e.target.name] = e.target.value;
    if (e.target.name === 'kind') renderGrades();
    computeAll();
  });
}

// ---------------------------------------------------------------------------
// Plating and stiffener tables
// ---------------------------------------------------------------------------
const numCell = (r, k, label, attrs = 'step="any" min="0"') => {
  const ph = k === 'z' && isDeck(r) ? ` placeholder="D" title="${esc(t('auto.deckZ'))}"` : '';
  return `<td class="w-sm"><input aria-label="${esc(label)} – ${k}" data-k="${k}" type="number" ${attrs}${ph} value="${val(r[k])}"></td>`;
};

function renderPlates() {
  $('#plates-table tbody').innerHTML = state.plates.map((r, i) => {
    const L = rowName(r);
    return `
    <tr data-i="${i}">
      <td class="w-name"><input aria-label="${esc(t('th.panel'))} ${i + 1} – ${esc(t('a.name'))}" data-k="name" value="${esc(L)}"></td>
      <td class="w-md"><select aria-label="${esc(L)} – ${esc(t('th.zone'))}" data-k="zone">${options(ZONES, r.zone, (k) => t(`zone.${k}`))}</select></td>
      ${numCell(r, 'x', L)}${numCell(r, 's', L, 'step="any" min="0.05"')}${numCell(r, 'l', L, 'step="any" min="0.05"')}${numCell(r, 'z', L)}
      <td class="w-md"><select aria-label="${esc(L)} – ${esc(t('th.framing'))}" data-k="framing">${options(FRAMINGS, r.framing, (k) => t(`framing.${k}`))}</select></td>
      <td data-out="p"></td>
      <td data-out="req"></td>
      <td><button type="button" class="icon-btn" data-remove aria-label="${esc(t('a.remove'))} – ${esc(L)}">${icon.remove}</button></td>
    </tr>`;
  }).join('');
}

function renderStiffeners() {
  $('#stiff-table tbody').innerHTML = state.stiffeners.map((r, i) => {
    const L = rowName(r);
    return `
    <tr data-i="${i}">
      <td class="w-name"><input aria-label="${esc(t('th.stiff'))} ${i + 1} – ${esc(t('a.name'))}" data-k="name" value="${esc(L)}"></td>
      <td class="w-md"><select aria-label="${esc(L)} – ${esc(t('th.zone'))}" data-k="zone">${options(ZONES, r.zone, (k) => t(`zone.${k}`))}</select></td>
      <td class="w-md"><select aria-label="${esc(L)} – ${esc(t('th.type'))}" data-k="type">${options(TYPES, r.type, (k) => t(`type.${k}`))}</select></td>
      ${numCell(r, 'x', L)}${numCell(r, 's', L, 'step="any" min="0.05"')}${numCell(r, 'l', L, 'step="any" min="0.05"')}${numCell(r, 'z', L)}
      <td class="w-md"><select aria-label="${esc(L)} – ${esc(t('th.ends'))}" data-k="end">${options(ENDS, r.end, (k) => t(`ends.${k}`))}</select></td>
      <td data-out="p"></td>
      <td data-out="req"></td>
      <td><button type="button" class="icon-btn" data-remove aria-label="${esc(t('a.remove'))} – ${esc(L)}">${icon.remove}</button></td>
    </tr>`;
  }).join('');
}

const isDeck = (r) => r.zone === 'deck' || r.zone === 'workdeck';
/** Height of the row; an empty deck height means the deck at depth D. */
const zOf = (r) => (isDeck(r) && !ok(r.z) ? sh.D : r.z);
const rowValid = (r) => ok(r.x) && (ok(r.z) || isDeck(r)) && ok(r.s) && r.s > 0 && ok(r.l) && r.l > 0;

function plateResult(r) {
  const z = ruleZone(r.zone);
  return nr600.plate(sh, mat, { ...z, x: r.x, s: r.s, l: r.l, z: zOf(r), zd: zOf(r), framing: r.framing });
}

function stiffenerResult(r) {
  const z = ruleZone(r.zone);
  const vertical = r.type === 'frame' && r.zone === 'side';
  return nr600.stiffener(sh, mat, {
    ...z, x: r.x, s: r.s, l: r.l, z: zOf(r), zd: zOf(r),
    direction: r.type === 'longitudinal' ? 'longitudinal' : 'transverse',
    vertical, zTop: vertical ? zOf(r) + r.l : undefined, end: r.end,
  });
}

const loadsCell = (cases) => `<div class="req">${cases.map((c) => `<span><bdi>${esc(t(`load.${c.load}`))}</bdi> <b class="ltr">${fmt(c.p, 1)}</b></span>`).join('')}</div>`;

function computeTables() {
  document.querySelectorAll('#plates-table tbody tr').forEach((row) => {
    const r = state.plates[Number(row.dataset.i)];
    const outP = row.querySelector('[data-out="p"]');
    const outR = row.querySelector('[data-out="req"]');
    if (!sh || !rowValid(r)) { outP.textContent = '–'; outR.innerHTML = `<span class="gov">${esc(t('comp.check'))}</span>`; r._p = undefined; return; }
    const res = plateResult(r);
    r._p = res.cases[0].p;
    const g = res.governing;
    outP.innerHTML = loadsCell(res.cases);
    outR.innerHTML = `<div class="req">
      <strong class="ltr">t = ${fmt(res.tRule, 1)} mm</strong>
      <span class="ltr">${res.cases.map((c) => `${fmt(c.t, 2)}`).join(' · ')} mm · σ ${fmt(g.sigma, 0)} · μ ${fmt(res.mu, 2)}</span>
      <span>${esc(t('r.min', { t: fmt(res.tMin, 1) }))}${res.fishingAdd ? ` · ${esc(t('r.fishing'))}` : ''}</span>
      <span class="gov">${esc(t('r.governed', { x: t(`load.${res.governedBy}`) }))}</span>
    </div>`;
  });

  document.querySelectorAll('#stiff-table tbody tr').forEach((row) => {
    const r = state.stiffeners[Number(row.dataset.i)];
    const outP = row.querySelector('[data-out="p"]');
    const outR = row.querySelector('[data-out="req"]');
    if (!sh || !rowValid(r)) { outP.textContent = '–'; outR.innerHTML = `<span class="gov">${esc(t('comp.check'))}</span>`; return; }
    const res = stiffenerResult(r);
    outP.innerHTML = loadsCell(res.cases);
    outR.innerHTML = `<div class="req">
      <strong class="ltr">Z ≥ ${fmt(res.Z, 1)} cm³</strong>
      <span class="ltr">A<sub>sh</sub> ≥ ${fmt(res.Ash, 2)} cm² · b<sub>p</sub> = ${fmt(res.bp * 1000, 0)} mm · m = ${res.m}</span>
      <span>${esc(t('r.zmin', { z: fmt(res.Zmin, 1) }))}</span>
      <span class="gov">${esc(t('r.governed', { x: t(`load.${res.governedZ}`) }))}</span>
    </div>`;
  });
}

function bindTable(sel, list, render, blank) {
  const tbody = $(`${sel} tbody`);
  const onEdit = (e) => {
    const k = e.target.dataset.k;
    if (!k) return;
    const r = list()[Number(e.target.closest('tr').dataset.i)];
    r[k] = e.target.type === 'number' ? num(e.target.value) : e.target.value;
    if (k === 'name') { delete r.nameKey; refreshCompositePlates(); save(); return; }
    if (k === 'zone') render();
    computeAll();
  };
  tbody.addEventListener('input', onEdit);
  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove]');
    if (!btn) return;
    list().splice(Number(btn.closest('tr').dataset.i), 1);
    render();
    computeAll();
  });
  return () => {
    const rows = list();
    const last = rows[rows.length - 1];
    rows.push(blank(rows.length + 1, last));
    render();
    computeAll();
  };
}

// ---------------------------------------------------------------------------
// Composite (NR600 loads + NR546 ply-by-ply check)
// ---------------------------------------------------------------------------
function refreshCompositePlates() {
  const sel = $('#comp-form').elements.plate;
  if (!state.plates[state.comp.plate]) state.comp.plate = 0;
  sel.innerHTML = state.plates.map((r, i) => `<option value="${i}"${i === state.comp.plate ? ' selected' : ''}>${esc(rowName(r))} · ${esc(t(`zone.${r.zone}`))}</option>`).join('');
}

/** NR600 loads on a composite panel. Load point: lower edge (monolithic) or mid-panel (sandwich). */
function compositeLoads(r, sandwich) {
  const { zone, workingDeck } = ruleZone(r.zone);
  const b = Math.min(r.s, r.l);
  const a = Math.max(r.s, r.l);
  const zLoad = zone === 'side' && sandwich ? zOf(r) + b / 2 : zOf(r);
  const loads = [];
  let p;
  if (zone === 'bottom') p = nr600.bottomSeaPressure(sh, r.x).p;
  else if (zone === 'side') p = nr600.sideSeaPressure(sh, r.x, zLoad).p;
  else {
    p = nr600.deckPressure(sh, r.x, zOf(r)).p;
    if (workingDeck && sh.service === 'fishing') p = Math.max(p, 8.5);
  }
  loads.push({ load: 'sea', p });
  if (zone === 'bottom') {
    const sl = nr600.slamming(sh, { x: r.x, sa: b * Math.min(a, 3 * b), element: 'plate', material: 'composite' });
    if (sl.applies) loads.push({ load: 'slamming', p: sl.p });
  }
  if (zone === 'side') {
    const imp = nr600.sideImpact(sh, r.x, zLoad);
    if (imp.applies) {
      const Cp = Math.max(-0.98 * b * b + 0.3 * b + 0.95, 0.8);
      loads.push({ load: 'sideImpact', p: Cp * imp.p });
    }
  }
  return { a, b, zLoad, loads };
}

function renderLayers() {
  $('#layers-table tbody').innerHTML = state.comp.layers.map((l, i) => {
    const isCore = l.fabric === 'CORE';
    const L = esc(`${t('a.layer')} ${i + 1}`);
    const second = isCore
      ? `<select aria-label="${L} – ${esc(t('fab.CORE'))}" data-k="coreType">${options(Object.keys(nr546.CORE_TYPES), l.coreType, (k) => t(`core.${k}`))}</select>`
      : `<select aria-label="${L} – ${esc(plain(t('th.fibre')))}" data-k="fibre">${options(l.fabric === 'CSM' ? ['E'] : Object.keys(nr546.FIBRES), l.fibre, (k) => t(`fib.${k}`))}</select>`;
    return `
    <tr data-i="${i}">
      <td class="num">${i + 1}</td>
      <td class="w-md"><select aria-label="${L} – ${esc(t('th.fabric'))}" data-k="fabric">${options(FABRICS, l.fabric, (k) => t(`fab.${k}`))}</select></td>
      <td class="w-md">${second}</td>
      <td class="w-sm">${isCore ? `<input aria-label="${L} – kg/m³" data-k="density" type="number" step="any" min="40" value="${val(l.density)}">` : `<input aria-label="${L} – g/m²" data-k="mass" type="number" step="any" min="50" value="${val(l.mass)}">`}</td>
      <td class="w-sm">${isCore ? `<input aria-label="${L} – t (mm)" data-k="thickness" type="number" step="any" min="1" value="${val(l.thickness)}">` : `<input aria-label="${L} – Mf" data-k="Mf" type="number" step="any" min="0.15" max="0.8" value="${val(l.Mf)}">`}</td>
      <td class="w-sm">${isCore || l.fabric === 'CSM' ? '<span class="gov">–</span>' : `<input aria-label="${L} – ${esc(t('th.angle'))} (°)" data-k="angle" type="number" step="any" value="${val(l.angle ?? 0)}">`}</td>
      <td class="num" data-out="t"></td>
      <td class="num" data-out="E"></td>
      <td class="num" data-out="sf"></td>
      <td data-out="util"></td>
      <td><button type="button" class="icon-btn" data-remove aria-label="${esc(t('a.remove'))} – ${L}">${icon.remove}</button></td>
    </tr>`;
  }).join('');
}

function layersValid() {
  return state.comp.layers.every((l) => (l.fabric === 'CORE'
    ? ok(l.density) && l.density > 0 && ok(l.thickness) && l.thickness > 0
    : ok(l.mass) && l.mass > 0 && ok(l.Mf) && l.Mf > 0.1 && l.Mf < 0.9));
}

function computeComposite() {
  const verdict = $('#comp-verdict');
  const fail = (msg) => {
    verdict.className = 'verdict ko';
    verdict.innerHTML = `${badge(false, esc(t('comp.check')))}<span>${esc(msg)}</span>`;
    $('#comp-derived').innerHTML = '';
    document.querySelectorAll('#layers-table [data-out]').forEach((c) => { c.textContent = ''; });
  };
  const r = state.plates[state.comp.plate];
  if (!state.comp.layers.length) { $('#comp-loads').innerHTML = ''; return fail(t('comp.noLayer')); }
  if (!sh || !r || !rowValid(r) || !layersValid()) { $('#comp-loads').innerHTML = ''; return fail(''); }

  const sandwich = state.comp.layers.some((l) => l.fabric === 'CORE');
  const L = compositeLoads(r, sandwich);
  $('#comp-loads').innerHTML = derivedList([
    [t('comp.panel'), `<span class="ltr">${fmt(L.a, 2)} × ${fmt(L.b, 2)} m</span>`],
    [t('comp.loadPoint'), `${esc(sandwich ? t('comp.middle') : t('comp.lowerEdge'))} <span class="gov ltr">z = ${fmt(L.zLoad, 2)} m</span>`],
    ...L.loads.map((c) => [esc(t(`load.${c.load}`)), `${fmt(c.p, 1)} kN/m² <span class="gov ltr">C<sub>i</sub> ${fmt(nr546.CI_LOAD[c.load], 1)}</span>`]),
  ]);

  let results;
  try {
    results = L.loads.map((c) => nr546.checkPanel({
      layers: state.comp.layers, resin: state.comp.resin, process: state.comp.process,
      a: L.a, b: L.b, p: c.p, load: c.load,
    }));
  } catch (err) {
    return fail(err.message);
  }
  const lam = results[0].lam;
  const nPly = lam.layers.length;
  // Worst case of every ply across the load cases.
  const worst = Array.from({ length: nPly }, (_, j) => results.map((res) => ({ ...res.plies[j], load: res.load })).reduce((a, b) => (b.util > a.util ? b : a)));
  const govRes = results.reduce((a, b) => (b.maxUtil > a.maxUtil ? b : a));

  // Map analysed plies back to input rows (a double-bias row becomes two plies).
  let k = 0;
  document.querySelectorAll('#layers-table tbody tr').forEach((row, i) => {
    const n = state.comp.layers[i].fabric === 'BIAX' ? 2 : 1;
    const plies = worst.slice(k, k + n);
    k += n;
    const th = plies.reduce((s, p) => s + p.layer.t, 0);
    const el = plies[0].layer.el;
    const w = plies.reduce((a, b) => (b.util > a.util ? b : a));
    const req = w.req;
    const reqMode = w.mode === 'interlaminar' ? req.interlaminar : req[w.mode];
    row.querySelector('[data-out="t"]').textContent = fmt(th, 2);
    row.querySelector('[data-out="E"]').textContent = `${fmt(el.E1, 0)} / ${fmt(el.E2, 0)}`;
    row.querySelector('[data-out="sf"]').innerHTML = `${fmt(reqMode, 2)}<br><span class="gov">${esc(t(`load.${w.load ?? 'sea'}`))}</span>`;
    row.querySelector('[data-out="util"]').innerHTML = `<div class="util"><div class="util-bar${w.util > 1 ? ' over' : ''}"><span style="width:${Math.min(w.util, 1) * 100}%"></span></div><b>${fmt(w.util * 100, 0)}%</b></div><span class="gov">${esc(t(`mode.${w.mode}`))}</span>`;
  });

  const allOk = results.every((res) => res.ok);
  verdict.className = `verdict ${allOk ? 'ok' : 'ko'}`;
  verdict.innerHTML = `${badge(allOk, esc(allOk ? t('comp.ok') : t('comp.ko')))}<span>${esc(t('comp.util', { u: fmt(govRes.maxUtil * 100, 0), l: t(`load.${govRes.load}`) }))}${allOk ? '' : ` ${esc(t('comp.advice'))}`}</span>`;
  $('#comp-derived').innerHTML = derivedList([
    [t('comp.thick'), `${fmt(lam.h, 2)} mm`],
    [t('comp.areal'), `${fmt(lam.arealMass, 2)} kg/m²`],
    ['E<sub>x</sub> / E<sub>y</sub>', `<span class="ltr">${fmt(lam.Ex, 0)} / ${fmt(lam.Ey, 0)} N/mm²</span>`],
    ['D<sub>11</sub> / D<sub>22</sub>', `<span class="ltr">${fmt(govRes.mom.D11 / 1e6, 2)} / ${fmt(govRes.mom.D22 / 1e6, 2)} kN·m</span>`],
    ['M<sub>x</sub> / M<sub>y</sub>', `<span class="ltr">${fmt(govRes.mom.Mx / 1000, 2)} / ${fmt(govRes.mom.My / 1000, 2)} kN·m/m</span>`],
    ['T<sub>max</sub>', `<span class="ltr">${fmt(govRes.shear.T, 1)} N/mm</span>`],
  ]);
}

function bindComposite() {
  const form = $('#comp-form');
  refreshCompositePlates();
  form.elements.resin.value = state.comp.resin;
  form.elements.process.value = state.comp.process;
  form.addEventListener('input', (e) => {
    const { name, value } = e.target;
    state.comp[name] = name === 'plate' ? Number(value) : value;
    save();
    computeComposite();
  });

  const tbody = $('#layers-table tbody');
  tbody.addEventListener('input', (e) => {
    const k = e.target.dataset.k;
    if (!k) return;
    const l = state.comp.layers[Number(e.target.closest('tr').dataset.i)];
    l[k] = e.target.type === 'number' ? num(e.target.value) : e.target.value;
    if (k === 'fabric') {
      if (l.fabric === 'CORE') Object.assign(l, { coreType: l.coreType ?? 'crossPvc', density: l.density ?? 80, thickness: l.thickness ?? 20 });
      else {
        if (l.fabric === 'CSM') l.fibre = 'E';
        Object.assign(l, { fibre: l.fibre ?? 'E', mass: l.mass ?? 450, Mf: l.Mf ?? nr546.TYPICAL_MF[state.comp.process]?.[l.fabric === 'BIAX' ? 'UD' : l.fabric] ?? 0.5, angle: l.angle ?? 0 });
      }
      renderLayers();
    }
    save();
    computeComposite();
  });
  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove]');
    if (!btn) return;
    state.comp.layers.splice(Number(btn.closest('tr').dataset.i), 1);
    renderLayers();
    save();
    computeComposite();
  });
  $('#add-layer').addEventListener('click', () => {
    state.comp.layers.push({ fabric: 'WR', fibre: 'E', mass: 800, Mf: 0.5, angle: 0 });
    renderLayers();
    save();
    computeComposite();
  });
  $('#add-core').addEventListener('click', () => {
    state.comp.layers.push({ fabric: 'CORE', coreType: 'crossPvc', density: 80, thickness: 20 });
    renderLayers();
    save();
    computeComposite();
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
function computeAll() {
  computeShip();
  computeMaterial();
  computeTables();
  refreshCompositePlates();
  if (!$('#panel-comp').hidden) computeComposite();
  save();
}

function renderAll() {
  renderGrades();
  renderPlates();
  renderStiffeners();
  renderLayers();
}

function init() {
  bindShip();
  bindMaterial();
  bindComposite();
  const addPlate = bindTable('#plates-table', () => state.plates, renderPlates, (n, last) => ({
    name: t('new.panel', { n }), zone: last?.zone ?? 'bottom', x: last?.x ?? 0.5 * state.ship.LWL,
    s: last?.s ?? 0.4, l: last?.l ?? 1.2, z: last?.z ?? 0, framing: last?.framing ?? 'transverse',
  }));
  const addStiff = bindTable('#stiff-table', () => state.stiffeners, renderStiffeners, (n, last) => ({
    name: t('new.stiff', { n }), zone: last?.zone ?? 'bottom', type: last?.type ?? 'transverse', x: last?.x ?? 0.5 * state.ship.LWL,
    s: last?.s ?? 0.4, l: last?.l ?? 1.2, z: last?.z ?? 0, end: last?.end ?? 'fixed',
  }));
  $('#add-plate').addEventListener('click', addPlate);
  $('#add-stiff').addEventListener('click', addStiff);
  $('#reset').addEventListener('click', () => {
    state = EXAMPLE();
    fillForm($('#ship-form'), state.ship);
    $('#mat-form').elements.kind.value = state.metal.kind;
    $('#comp-form').elements.resin.value = state.comp.resin;
    $('#comp-form').elements.process.value = state.comp.process;
    renderAll();
    $('#tab-metal').click();
    computeAll();
  });
  $('#print').addEventListener('click', () => {
    computeComposite();
    window.print();
  });

  renderAll();
  setupTabs();
  computeAll();

  onLangChange(() => {
    renderAll();
    computeAll();
    if (!$('#panel-comp').hidden) computeComposite();
  });
}

init();
