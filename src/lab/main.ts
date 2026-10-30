/**
 * Sprite Lab (dev only, /lab). Measures vector sprites against their spec, overlays reference drawings
 * from refs/<vehicle_id>/ (git-ignored), and exports views and an equal-scale contact sheet.
 * Every value can be set from the URL (?v=iq_t55&ppm=80&heading=0...) and from window.lab for headless runs.
 */
import './lab.css';
import { loadFonts } from '../ui/theme/fonts';
import { SPRITES, SPRITE_BY_ID } from '../data/sprites';
import { CAMO_SCHEMES } from '../data/sprites/palette';
import { LAYERS, type Layer, type Lod, type SpriteDef } from '../data/sprites/types';
import { compile } from '../render/vector/compile';
import { drawSprite, lodFor } from '../render/vector/render';
import { compareSpec, measure, type Measured } from '../render/vector/measure';
import type { Box, Pt } from '../render/vector/geometry';
import { anchors, compare, thumbSimilarity, THRESHOLDS, type CompareResult } from './compare';
import { groupXf } from '../render/vector/compile';

const D2R = Math.PI / 180;
/** Game camera maps zoom to px/m via SPRITE_SCALE 1.7: default zoom 2, max zoom 6. */
const GAME_PPM = { default: 3.4, max: 10.2 };

interface RefState {
  img: HTMLImageElement | null; name: string; fromRefs: boolean; show: boolean; above: boolean; opacity: number;
  mPerPx: number; rot: number; ox: number; oy: number;
  /** Real dimension the image was calibrated to, e.g. "hull_len 6.20". */
  calibratedTo: string;
  mask: HTMLCanvasElement | null; maskApproved: boolean; showMask: boolean;
  /** Marked part positions in image pixels, keyed by sprite anchor id. */
  marks: Record<string, Pt>;
}

const S = {
  id: SPRITES[0].id,
  ppm: 70, panX: 0, panY: 0,
  heading: 0, turret: 0, rotor: 0, recoil: 0,
  trackR: 0, trackL: 0, drive: false, spin: false,
  damage: 0 as 0 | 1 | 2,
  scheme: '', seed: 1, num: '214',
  night: false, sil: false, lighting: true, grid: true, bbox: true, thumbs: true,
  lod: 'auto' as 'auto' | Lod,
  layers: Object.fromEntries(LAYERS.map((l) => [l, true])) as Record<Layer, boolean>,
  tool: 'pan' as 'pan' | 'ruler' | 'calibrate' | 'mask' | 'mark',
  compareMode: 'overlay' as 'overlay' | 'difference' | 'side',
  weak: false,
  maskPoly: [] as Pt[], // image pixel coordinates
  markId: '',
  result: null as CompareResult | null,
  ruler: null as [Pt, Pt] | null,
  calib: [] as Pt[], // image pixel coordinates
  ref: { img: null, name: '', fromRefs: false, show: true, above: true, opacity: 0.5, mPerPx: 0.01, rot: 0, ox: 0, oy: 0, calibratedTo: '', mask: null, maskApproved: false, showMask: true, marks: {} } as RefState,
};

// ---------------------------------------------------------------- URL state
function readUrl() {
  const q = new URLSearchParams(location.search);
  const num = (k: string) => (q.has(k) ? Number(q.get(k)) : undefined);
  const bool = (k: string) => (q.has(k) ? q.get(k) !== '0' : undefined);
  if (q.get('v') && SPRITE_BY_ID[q.get('v')!]) S.id = q.get('v')!;
  S.ppm = num('ppm') ?? S.ppm;
  S.heading = num('heading') ?? S.heading;
  S.turret = num('turret') ?? S.turret;
  S.rotor = num('rotor') ?? S.rotor;
  S.recoil = num('recoil') ?? S.recoil;
  S.damage = (num('damage') ?? S.damage) as 0 | 1 | 2;
  S.seed = num('seed') ?? S.seed;
  S.scheme = q.get('scheme') ?? S.scheme;
  S.night = bool('night') ?? S.night;
  S.sil = bool('sil') ?? S.sil;
  S.grid = bool('grid') ?? S.grid;
  S.bbox = bool('bbox') ?? S.bbox;
  S.thumbs = bool('thumbs') ?? S.thumbs;
  S.lighting = bool('light') ?? S.lighting;
  S.weak = bool('weak') ?? S.weak;
  if (q.get('mode') === 'difference' || q.get('mode') === 'side') S.compareMode = q.get('mode') as 'difference' | 'side';
  if (q.has('lod')) S.lod = q.get('lod') === 'auto' ? 'auto' : (Number(q.get('lod')) as Lod);
  for (const l of (q.get('off') ?? '').split(',')) if (l in S.layers) S.layers[l as Layer] = false;
  S.panX = num('panx') ?? S.panX;
  S.panY = num('pany') ?? S.panY;
}

// ---------------------------------------------------------------- DOM
const root = document.getElementById('lab')!;
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> & Record<string, unknown> = {}, ...kids: Array<Node | string>) => {
  const e = document.createElement(tag);
  Object.assign(e, props);
  for (const k of kids) e.append(k);
  return e;
};

const left = el('div', { className: 'side' });
const center = el('div', { className: 'center' });
const right = el('div', { className: 'side right' });
root.append(left, center, right);

const view = el('canvas', { id: 'view' });
const status = el('div', { className: 'status' });
const thumbs = el('div', { className: 'thumbs' });
center.append(view, status, thumbs);

const controls: Array<() => void> = []; // sync functions, run after state changes from code
function sync() { for (const f of controls) f(); }

function range(label: string, min: number, max: number, step: number, get: () => number, set: (v: number) => void, fmt = (v: number) => v.toFixed(step < 1 ? 2 : 0)) {
  const inp = el('input', { type: 'range', min: String(min), max: String(max), step: String(step) });
  const out = el('output');
  const upd = () => { inp.value = String(get()); out.textContent = fmt(get()); };
  inp.addEventListener('input', () => { set(Number(inp.value)); out.textContent = fmt(get()); dirty(); });
  controls.push(upd); upd();
  return el('label', { className: 'row' }, label, inp, out);
}
function check(label: string, get: () => boolean, set: (v: boolean) => void) {
  const inp = el('input', { type: 'checkbox' });
  controls.push(() => { inp.checked = get(); });
  inp.checked = get();
  inp.addEventListener('change', () => { set(inp.checked); dirty(); });
  return el('label', { className: 'chk' }, inp, label);
}
function select(options: Array<[string, string]>, get: () => string, set: (v: string) => void) {
  const s = el('select');
  for (const [v, t] of options) s.append(el('option', { value: v, textContent: t }));
  controls.push(() => { s.value = get(); });
  s.value = get();
  s.addEventListener('change', () => { set(s.value); dirty(); });
  return s;
}
function button(label: string, fn: () => void, isOn?: () => boolean) {
  const b = el('button', { textContent: label });
  b.addEventListener('click', () => { fn(); dirty(); });
  if (isOn) controls.push(() => b.classList.toggle('on', isOn()));
  return b;
}

const sprite = (): SpriteDef => SPRITE_BY_ID[S.id];
const hasGroup = (rot: 'turret' | 'rotor') => Object.values(sprite().groups).some((g) => g.rotate === rot);

function buildLeft() {
  left.replaceChildren();
  const s = sprite();
  left.append(el('h1', { textContent: 'SPRITE LAB' }));
  left.append(el('h2', { textContent: 'Vehicle' }));
  left.append(select(SPRITES.map((d) => [d.id, `${d.name} · ${d.id}`]), () => S.id, (v) => { S.id = v; S.scheme = ''; S.ref.img = null; S.calib = []; S.result = null; S.markId = ''; buildLeft(); buildRight(); buildCompare(); loadRefList(); }));
  left.append(el('div', { className: 'hint' }, `status: ${s.status}`, el('span', { className: 'badge', textContent: s.kind })));

  left.append(el('h2', { textContent: 'View' }));
  left.append(range('Zoom px/m', 2, 300, 1, () => S.ppm, (v) => { S.ppm = v; }));
  left.append(range('Heading°', -180, 180, 1, () => S.heading, (v) => { S.heading = v; }));
  left.append(el('div', { className: 'btns' },
    button('Pan', () => { S.tool = 'pan'; }, () => S.tool === 'pan'),
    button('Ruler', () => { S.tool = 'ruler'; }, () => S.tool === 'ruler'),
    button('Centre', () => { S.panX = 0; S.panY = 0; }),
  ));
  left.append(check('Grid', () => S.grid, (v) => { S.grid = v; }), check('Bounds', () => S.bbox, (v) => { S.bbox = v; }),
    check('Night', () => S.night, (v) => { S.night = v; }), check('Silhouette', () => S.sil, (v) => { S.sil = v; }),
    check('Lighting', () => S.lighting, (v) => { S.lighting = v; }), check('Thumbnails', () => S.thumbs, (v) => { S.thumbs = v; thumbs.style.display = v ? '' : 'none'; }));
  const lodSel = select([['auto', 'LOD auto'], ['0', 'LOD 0 silhouette'], ['1', 'LOD 1 details'], ['2', 'LOD 2 stowage, tread'], ['3', 'LOD 3 rivets, welds']],
    () => String(S.lod), (v) => { S.lod = v === 'auto' ? 'auto' : (Number(v) as Lod); });
  left.append(lodSel);

  left.append(el('h2', { textContent: 'Pose' }));
  if (hasGroup('turret')) left.append(range('Turret°', -180, 180, 1, () => S.turret, (v) => { S.turret = v; }));
  if (hasGroup('rotor')) left.append(range('Rotor°', 0, 360, 1, () => S.rotor, (v) => { S.rotor = v; }));
  left.append(range('Recoil', 0, 1, 0.01, () => S.recoil, (v) => { S.recoil = v; }));
  left.append(range('Track R m', -2, 2, 0.01, () => S.trackR, (v) => { S.trackR = v; }));
  left.append(range('Track L m', -2, 2, 0.01, () => S.trackL, (v) => { S.trackL = v; }));
  left.append(el('div', { className: 'btns' },
    button('Fire (recoil)', () => { recoilT0 = performance.now(); }),
    button('Drive', () => { S.drive = !S.drive; }, () => S.drive),
    ...(hasGroup('rotor') ? [button('Spin rotor', () => { S.spin = !S.spin; }, () => S.spin)] : []),
  ));

  left.append(el('h2', { textContent: 'Paint & damage' }));
  left.append(select(s.paint.schemes.map((k) => [k, CAMO_SCHEMES[k]?.label ?? k]), () => S.scheme || s.paint.schemes[0], (v) => { S.scheme = v; }));
  left.append(range('Camo seed', 1, 50, 1, () => S.seed, (v) => { S.seed = v; }));
  left.append(select([['0', 'Intact'], ['1', 'Damaged'], ['2', 'Destroyed']], () => String(S.damage), (v) => { S.damage = Number(v) as 0 | 1 | 2; }));
  const numIn = el('input', { type: 'text', value: S.num, size: 6 });
  numIn.addEventListener('input', () => { S.num = numIn.value; dirty(); });
  left.append(el('label', { className: 'row' }, 'Tactical no.', numIn, el('span')));

  left.append(el('h2', { textContent: 'Layers' }));
  const used = new Set(s.parts.map((p) => p.layer));
  for (const l of LAYERS) if (used.has(l) || l === 'damage') left.append(check(l, () => S.layers[l], (v) => { S.layers[l] = v; }));

  left.append(el('h2', { textContent: 'Export' }));
  left.append(el('div', { className: 'btns' },
    button('PNG of view', () => download(view.toDataURL('image/png'), `${S.id}_view.png`)),
    button('Contact sheet', () => download(contactSheet().toDataURL('image/png'), 'contact_sheet.png')),
  ));
  sync();
}

// ---------------------------------------------------------------- right panel
const specBox = el('div');
const readBox = el('div');
const refBox = el('div');
const notesBox = el('div');
const cmpBox = el('div');

function fmtV(v: number | number[] | undefined) {
  if (v === undefined) return '–';
  return Array.isArray(v) ? v.map((x) => x.toFixed(2)).join(' / ') : v.toFixed(3);
}

function buildRight() {
  right.replaceChildren(
    el('h2', { textContent: 'Spec vs measured (3%)' }), specBox,
    el('h2', { textContent: 'Live readouts' }), readBox,
    el('h2', { textContent: 'Reference overlay' }), refBox,
    el('h2', { textContent: 'Compare with reference' }), cmpBox,
    el('h2', { textContent: 'Data notes' }), notesBox,
  );
  const s = sprite();
  const m = measure(s);
  const rows = compareSpec(s, m);
  const t = el('table', { className: 'spec' });
  t.append(el('tr', {}, el('th', { textContent: 'Dimension' }), el('th', { textContent: 'Target' }), el('th', { textContent: 'Measured' }), el('th', { textContent: 'Δ%' }), el('th')));
  for (const r of rows) {
    const verdict = el('td', { textContent: r.pass ? 'PASS' : 'FAIL', className: r.pass ? 'pass' : 'fail' });
    const tr = el('tr', {}, el('td', { textContent: r.label + (r.verify ? ' (verify)' : ''), title: r.source ?? '' }), el('td', { textContent: fmtV(r.target) }),
      el('td', { textContent: fmtV(r.measured) }), el('td', { textContent: isFinite(r.deltaPct) ? r.deltaPct.toFixed(1) : '–' }), verdict);
    if (!r.pass) tr.className = 'fail';
    t.append(tr);
  }
  specBox.replaceChildren(t, el('div', { className: 'hint', textContent: `source: ${s.source}` }));
  buildReadouts(m);
  buildRef();
  const notes = el('ul', { className: 'notes' });
  for (const p of s.parts) if (p.note) notes.append(el('li', {}, el('code', { textContent: p.id }), ` ${p.conf && !p.note.startsWith(p.conf) ? `${p.conf} · ` : ''}${p.note}`));
  notesBox.replaceChildren(notes.children.length ? notes : el('div', { className: 'hint', textContent: 'none' }));
}

function buildReadouts(m: Measured) {
  const kv = el('div', { className: 'kv' });
  const add = (k: string, v: string) => kv.append(el('span', { textContent: k }), el('span', { textContent: v }));
  const v = m.values;
  add('Hull length', `${fmtV(v.hullLength)} m`);
  add('Width', `${fmtV(v.width)} m`);
  add('Length, gun forward', `${fmtV(v.overallLength)} m`);
  if (v.gunOverhang !== undefined) add('Gun overhang', `${fmtV(v.gunOverhang)} m`);
  if (m.pivot) {
    add('Turret pivot (hull x)', `${m.pivot[0].toFixed(3)} m`);
    add('Pivot from front', `${fmtV(v.turretPivotFromFront)} m (${((v.turretPivotFromFront as number) / (v.hullLength as number) * 100).toFixed(1)}% of hull)`);
  }
  if (m.muzzle) add('Muzzle (hull x)', `${m.muzzle[0].toFixed(3)} m`);
  if (m.roadWheelX.length) {
    add('Road wheels', `${m.roadWheelX.length} per side`);
    add('Wheel x', m.roadWheelX.map((x) => x.toFixed(2)).join(' '));
    add('Wheel gaps', fmtV(v.roadWheelGaps));
  }
  if (v.rotorDiameter !== undefined) add('Rotor diameter', `${fmtV(v.rotorDiameter)} m`);
  add('LOD at this zoom', String(S.lod === 'auto' ? lodFor(S.ppm) : S.lod));
  readBox.replaceChildren(kv);
}

let refList: string[] = [];
async function loadRefList() {
  try {
    const r = await fetch(`/__lab/refs/${S.id}`);
    refList = r.ok ? (await r.json()).images : [];
  } catch { refList = []; }
  buildRef();
}

const refUrl = (name: string) => `/refs/${S.id}/${encodeURIComponent(name)}`;
async function fetchJson<T>(url: string): Promise<T | null> {
  try { const r = await fetch(url); return r.ok ? ((await r.json()) as T) : null; } catch { return null; }
}
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
}

async function loadRefImage(src: string, name: string, fromRefs: boolean) {
  const img = await loadImage(src);
  if (!img) return;
  const r = S.ref;
  r.img = img; r.name = name; r.fromRefs = fromRefs;
  r.mask = null; r.maskApproved = false; r.marks = {}; r.calibratedTo = '';
  // Start at roughly the vehicle's length so the image is in view; calibrate for the real scale.
  const m = measure(sprite());
  r.mPerPx = (m.overallBox.x1 - m.overallBox.x0) / img.naturalWidth;
  r.ox = 0; r.oy = 0; r.rot = 0;
  if (fromRefs) {
    const cal = await fetchJson<{ mPerPx: number; rot: number; ox: number; oy: number; calibrated_to?: string }>(refUrl(`${name}.calib.json`));
    if (cal) { r.mPerPx = cal.mPerPx; r.rot = cal.rot; r.ox = cal.ox; r.oy = cal.oy; r.calibratedTo = cal.calibrated_to ?? ''; }
    const mk = await fetchJson<Record<string, Pt>>(refUrl(`${name}.points.json`));
    if (mk) r.marks = mk;
    const meta = await fetchJson<{ approved: boolean }>(refUrl(`${name}.mask.json`));
    const mi = meta ? await loadImage(refUrl(`${name}.mask.png`) + `?t=${Date.now()}`) : null;
    if (mi) { r.mask = el('canvas', { width: mi.naturalWidth, height: mi.naturalHeight }); r.mask.getContext('2d')!.drawImage(mi, 0, 0); r.maskApproved = !!meta?.approved; }
  }
  S.result = null;
  buildRef(); buildCompare(); dirty();
}

async function saveSidecar(suffix: string, body: Blob | string) {
  if (!S.ref.img || !S.ref.fromRefs) { alert('Sidecars are saved next to images in refs/<vehicle_id>/; load the image from that list.'); return false; }
  const r = await fetch(`/__lab/refs/${S.id}/${encodeURIComponent(S.ref.name + suffix)}`, { method: 'POST', body });
  return r.ok;
}

function saveCalibration() {
  const r = S.ref;
  return saveSidecar('.calib.json', JSON.stringify({ mPerPx: r.mPerPx, rot: r.rot, ox: r.ox, oy: r.oy, calibrated_to: r.calibratedTo }, null, 1));
}

function buildRef() {
  const list = select([['', refList.length ? '— pick from refs/' + S.id + '/ —' : `refs/${S.id}/ is empty`], ...refList.map((f) => [f, f] as [string, string])],
    () => (refList.includes(S.ref.name) ? S.ref.name : ''), (v) => { if (v) loadRefImage(refUrl(v), v, true); });
  const file = el('input', { type: 'file', accept: 'image/*' });
  file.addEventListener('change', () => { const f = file.files?.[0]; if (f) loadRefImage(URL.createObjectURL(f), f.name, false); });
  const parts: Array<Node | string> = [list, el('div', { className: 'hint' }, 'or load a local file (not saved): ', file)];
  if (S.ref.img) {
    parts.push(
      el('div', { className: 'hint', textContent: `${S.ref.name} · ${S.ref.img.naturalWidth}×${S.ref.img.naturalHeight}px · ${(S.ref.mPerPx * 1000).toFixed(2)} mm/px · calibrated to: ${S.ref.calibratedTo || 'not yet'}` }),
      check('Show', () => S.ref.show, (v) => { S.ref.show = v; }), check('Above sprite', () => S.ref.above, (v) => { S.ref.above = v; }),
      range('Opacity', 0, 1, 0.01, () => S.ref.opacity, (v) => { S.ref.opacity = v; }),
      range('Scale log', -4, 0, 0.001, () => Math.log10(S.ref.mPerPx), (v) => { S.ref.mPerPx = 10 ** v; }, () => `${(S.ref.mPerPx * 1000).toFixed(2)}`),
      range('Rotation°', -180, 180, 0.1, () => S.ref.rot, (v) => { S.ref.rot = v; }, (v) => v.toFixed(1)),
      range('Offset x m', -8, 8, 0.005, () => S.ref.ox, (v) => { S.ref.ox = v; }),
      range('Offset y m', -8, 8, 0.005, () => S.ref.oy, (v) => { S.ref.oy = v; }),
      el('div', { className: 'btns' },
        button('Calibrate 2 points', () => { S.tool = 'calibrate'; S.calib = []; }, () => S.tool === 'calibrate'),
        button('Flip 180°', () => { S.ref.rot = ((S.ref.rot + 360) % 360) - 180; }),
        button('Save calibration', () => { saveCalibration(); })),
      el('div', { className: 'hint', textContent: 'Calibrate: click two points whose real distance you know, enter it in metres and name the dimension (e.g. hull_len). The first point stays put. Align at heading 0: comparison is measured in the hull frame.' }),
    );
  }
  refBox.replaceChildren(...parts);
  sync();
}

// ---------------------------------------------------------------- compare
function rasterMask(poly: Pt[]) {
  const img = S.ref.img!;
  const c = el('canvas', { width: img.naturalWidth, height: img.naturalHeight });
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); poly.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill();
  return c;
}

function marksWorld(): Record<string, Pt> {
  const out: Record<string, Pt> = {};
  if (S.ref.img) for (const [k, ip] of Object.entries(S.ref.marks)) out[k] = refToWorld(ip);
  return out;
}

function runCompare() {
  const r = S.ref;
  S.result = compare(sprite(), r.mask && r.maskApproved ? r.mask : null, r.img ? { mPerPx: r.mPerPx, rot: r.rot, ox: r.ox, oy: r.oy } : null, marksWorld());
  buildCompare();
  return S.result;
}

function buildCompare() {
  const r = S.ref;
  const kids: Array<Node | string> = [
    el('div', { className: 'btns' },
      button('Overlay', () => { S.compareMode = 'overlay'; }, () => S.compareMode === 'overlay'),
      button('Difference', () => { S.compareMode = 'difference'; }, () => S.compareMode === 'difference'),
      button('Side by side', () => { S.compareMode = 'side'; }, () => S.compareMode === 'side')),
    check('Weak-data markers (conf C/X)', () => S.weak, (v) => { S.weak = v; }),
  ];
  if (!r.img) { kids.push(el('div', { className: 'hint', textContent: 'Load a top view from refs/ to compare.' })); cmpBox.replaceChildren(...kids); sync(); return; }
  kids.push(
    el('div', { className: 'hint', textContent: `Mask: ${r.mask ? (r.maskApproved ? 'approved' : 'drawn, not approved') : 'none'} · marks: ${Object.keys(r.marks).length}` }),
    el('div', { className: 'btns' },
      button('Draw mask', () => { S.tool = 'mask'; S.maskPoly = []; }, () => S.tool === 'mask'),
      button('Approve & save mask', async () => {
        if (!r.mask) return;
        r.maskApproved = true;
        const blob = await new Promise<Blob | null>((res) => r.mask!.toBlob(res, 'image/png'));
        if (blob && (await saveSidecar('.mask.png', blob))) await saveSidecar('.mask.json', JSON.stringify({ approved: true, at: new Date().toISOString() }));
        buildCompare();
      }),
      check('Show mask', () => r.showMask, (v) => { r.showMask = v; })),
  );
  const ids = anchors(sprite());
  if (!S.markId && ids.length) S.markId = ids[0].id;
  kids.push(
    select(ids.map((a) => [a.id, `${r.marks[a.id] ? '✓ ' : ''}${a.id} (${a.conf ?? '–'}) ${a.at[0].toFixed(2)}, ${a.at[1].toFixed(2)}`] as [string, string]), () => S.markId, (v) => { S.markId = v; }),
    el('div', { className: 'btns' },
      button('Mark part on image', () => { S.tool = 'mark'; }, () => S.tool === 'mark'),
      button('Remove mark', () => { delete r.marks[S.markId]; buildCompare(); }),
      button('Save marks', () => { saveSidecar('.points.json', JSON.stringify(r.marks, null, 1)); })),
    el('div', { className: 'btns' }, button('Compute', () => { runCompare(); })),
  );
  const res = S.result;
  if (res) {
    const t = el('table', { className: 'spec' });
    const row = (k: string, v: string, ok: boolean | null) => t.append(el('tr', { className: ok === false ? 'fail' : '' }, el('td', { textContent: k }), el('td', { textContent: v }),
      el('td', { textContent: ok === null ? '' : ok ? 'PASS' : 'FAIL', className: ok === null ? '' : ok ? 'pass' : 'fail' })));
    row(`Silhouette IoU (≥ ${THRESHOLDS.iou})`, isFinite(res.iou) ? res.iou.toFixed(4) : '–', isFinite(res.iou) ? res.pass.iou : null);
    row('Outline error mean', isFinite(res.meanCm) ? `${res.meanCm.toFixed(1)} cm` : '–', null);
    row(`Outline error max (≤ ${THRESHOLDS.maxOutlineCm} cm)`, isFinite(res.maxCm) ? `${res.maxCm.toFixed(1)} cm` : '–', isFinite(res.maxCm) ? res.pass.outline : null);
    for (const p of [...res.parts].sort((a, b) => b.errCm - a.errCm)) row(`${p.id} (${p.conf ?? '–'})`, `${p.errCm.toFixed(1)} cm`, p.counted ? p.pass : null);
    kids.push(t, el('div', { className: 'hint', textContent: res.failures.length ? `Failures: ${res.failures.join('; ')}` : 'All thresholds pass.' }),
      el('div', { className: 'hint', textContent: `Part threshold ${THRESHOLDS.partCm} cm applies to conf A/B parts; C/X errors are shown but not counted.` }));
  }
  cmpBox.replaceChildren(...kids);
  sync();
}

// ---------------------------------------------------------------- drawing
const vctx = view.getContext('2d')!;
let W = 0, H = 0;
let needs = true;
function dirty() { needs = true; }

function resize() {
  const r = view.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  W = r.width; H = r.height;
  view.width = Math.round(W * dpr); view.height = Math.round(H * dpr);
  vctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  dirty();
}

const toScreen = (p: Pt): Pt => [W / 2 + S.panX + p[0] * S.ppm, H / 2 + S.panY + p[1] * S.ppm];
const toWorld = (sx: number, sy: number): Pt => [(sx - W / 2 - S.panX) / S.ppm, (sy - H / 2 - S.panY) / S.ppm];
const rotP = (p: Pt, a: number): Pt => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
const hullToWorld = (p: Pt) => rotP(p, S.heading * D2R);
const worldToHull = (p: Pt) => rotP(p, -S.heading * D2R);

function refToWorld(ip: Pt): Pt {
  const img = S.ref.img!;
  const lp: Pt = [(ip[0] - img.naturalWidth / 2) * S.ref.mPerPx, (ip[1] - img.naturalHeight / 2) * S.ref.mPerPx];
  const r = rotP(lp, S.ref.rot * D2R);
  return [r[0] + S.ref.ox, r[1] + S.ref.oy];
}
function worldToRef(wp: Pt): Pt {
  const img = S.ref.img!;
  const r = rotP([wp[0] - S.ref.ox, wp[1] - S.ref.oy], -S.ref.rot * D2R);
  return [r[0] / S.ref.mPerPx + img.naturalWidth / 2, r[1] / S.ref.mPerPx + img.naturalHeight / 2];
}

function drawGrid(ctx: CanvasRenderingContext2D) {
  const [x0, y0] = toWorld(0, 0), [x1, y1] = toWorld(W, H);
  const minorOk = S.ppm >= 6;
  ctx.lineWidth = 1;
  for (let x = Math.floor(x0); x <= x1; x++) {
    const major = x % 5 === 0;
    if (!major && !minorOk) continue;
    ctx.strokeStyle = major ? 'rgba(30,26,18,0.42)' : 'rgba(30,26,18,0.16)';
    const sx = Math.round(toScreen([x, 0])[0]) + 0.5;
    ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, H); ctx.stroke();
  }
  for (let y = Math.floor(y0); y <= y1; y++) {
    const major = y % 5 === 0;
    if (!major && !minorOk) continue;
    ctx.strokeStyle = major ? 'rgba(30,26,18,0.42)' : 'rgba(30,26,18,0.16)';
    const sy = Math.round(toScreen([0, y])[1]) + 0.5;
    ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(W, sy); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(30,26,18,0.7)'; ctx.font = '10px "Share Tech Mono", monospace';
  for (let x = Math.ceil(x0 / 5) * 5; x <= x1; x += 5) ctx.fillText(`${x} m`, toScreen([x, 0])[0] + 3, 12);
  for (let y = Math.ceil(y0 / 5) * 5; y <= y1; y += 5) ctx.fillText(`${y} m`, 3, toScreen([0, y])[1] - 3);
}

function drawRef(ctx: CanvasRenderingContext2D, full = false) {
  const r = S.ref;
  if (!r.img || (!r.show && !full)) return;
  ctx.save();
  ctx.globalAlpha = full ? 1 : r.opacity;
  const [cx, cy] = toScreen([r.ox, r.oy]);
  ctx.translate(cx, cy);
  ctx.rotate(r.rot * D2R);
  const k = r.mPerPx * S.ppm;
  ctx.scale(k, k);
  ctx.drawImage(r.img, -r.img.naturalWidth / 2, -r.img.naturalHeight / 2);
  ctx.restore();
}

function placeImage(ctx: CanvasRenderingContext2D) {
  const r = S.ref;
  const [cx, cy] = toScreen([r.ox, r.oy]);
  ctx.translate(cx, cy);
  ctx.rotate(r.rot * D2R);
  const k = r.mPerPx * S.ppm;
  ctx.scale(k, k);
  ctx.translate(-r.img!.naturalWidth / 2, -r.img!.naturalHeight / 2);
}

function drawMaskOverlay(ctx: CanvasRenderingContext2D) {
  const r = S.ref;
  if (!r.img) return;
  ctx.save();
  placeImage(ctx);
  if (r.mask && r.showMask) {
    ctx.globalAlpha = 0.28;
    const tint = el('canvas', { width: r.mask.width, height: r.mask.height });
    const tc = tint.getContext('2d')!;
    tc.drawImage(r.mask, 0, 0); tc.globalCompositeOperation = 'source-in'; tc.fillStyle = r.maskApproved ? '#2f7cff' : '#d0301c'; tc.fillRect(0, 0, tint.width, tint.height);
    ctx.drawImage(tint, 0, 0);
    ctx.globalAlpha = 1;
  }
  if (S.tool === 'mask' && S.maskPoly.length) {
    const lw = 1.5 / (r.mPerPx * S.ppm);
    ctx.strokeStyle = '#d0301c'; ctx.lineWidth = lw;
    ctx.beginPath(); S.maskPoly.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
    ctx.fillStyle = '#d0301c';
    for (const p of S.maskPoly) ctx.fillRect(p[0] - 2 * lw, p[1] - 2 * lw, 4 * lw, 4 * lw);
  }
  ctx.restore();
}

/** Sprite anchors (green) and marked reference positions (amber), with the error vector between them. */
function drawMarks(ctx: CanvasRenderingContext2D, def: SpriteDef) {
  if (!S.ref.img || !S.ref.show || (!Object.keys(S.ref.marks).length && S.tool !== 'mark')) return;
  const marks = marksWorld();
  ctx.lineWidth = 1.5; ctx.font = '10px "Share Tech Mono", monospace';
  for (const a of anchors(def)) {
    const mk = marks[a.id];
    if (!mk && !(S.tool === 'mark' && a.id === S.markId)) continue;
    const pa = toScreen(hullToWorld(a.at));
    ctx.strokeStyle = '#86ff6e'; ctx.beginPath(); ctx.arc(pa[0], pa[1], 4, 0, 6.3); ctx.stroke();
    if (mk) {
      const pm = toScreen(mk);
      ctx.strokeStyle = '#e9a31a';
      ctx.beginPath(); ctx.moveTo(pm[0] - 5, pm[1] - 5); ctx.lineTo(pm[0] + 5, pm[1] + 5); ctx.moveTo(pm[0] + 5, pm[1] - 5); ctx.lineTo(pm[0] - 5, pm[1] + 5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pm[0], pm[1]); ctx.stroke();
      if (a.id === S.markId || Object.keys(marks).length <= 12) { ctx.fillStyle = '#e9a31a'; ctx.fillText(a.id, pm[0] + 7, pm[1] - 4); }
    }
  }
}

/** Debug markers on low-confidence data: dashed boxes on C (magenta) and X (red) parts, diamonds on weak outline points. */
function drawWeak(ctx: CanvasRenderingContext2D, def: SpriteDef) {
  const pose = { turret: S.turret * D2R, rotor: S.rotor * D2R, recoil: S.recoil };
  const col = (c: string | undefined) => (c === 'X' ? '#ff2a1a' : '#e040fb');
  ctx.save();
  ctx.setLineDash([3, 2]); ctx.lineWidth = 1; ctx.font = '9px "Share Tech Mono", monospace';
  for (const a of anchors(def)) {
    if (a.conf !== 'C' && a.conf !== 'X') continue;
    const part = def.parts.find((p) => a.id === p.id || a.id.startsWith(p.id + '#'));
    if (!part || part.layer === 'hull' || part.layer === 'turret') continue; // big outlines get point markers instead
    const g = groupXf(def, part.group ?? 'hull', pose);
    const local = groupXf(def, part.group ?? 'hull', { turret: 0, rotor: 0, recoil: 0 });
    // anchors are at pose 0; re-map through the live pose
    const inv = (p: Pt): Pt => { const t = local.map([0, 0]); const r = -local.rot; const d: Pt = [p[0] - t[0], p[1] - t[1]]; return [d[0] * Math.cos(r) - d[1] * Math.sin(r), d[0] * Math.sin(r) + d[1] * Math.cos(r)]; };
    const p = toScreen(hullToWorld(g.map(inv(a.at))));
    ctx.strokeStyle = col(a.conf); ctx.strokeRect(p[0] - 6, p[1] - 6, 12, 12);
    ctx.fillStyle = col(a.conf); ctx.fillText(a.conf, p[0] + 7, p[1] - 6);
  }
  ctx.setLineDash([]);
  for (const w of def.weakPoints ?? []) {
    const g = groupXf(def, w.group, pose);
    const p = toScreen(hullToWorld(g.map(w.at)));
    ctx.fillStyle = col(w.conf);
    ctx.beginPath(); ctx.moveTo(p[0], p[1] - 4); ctx.lineTo(p[0] + 4, p[1]); ctx.lineTo(p[0], p[1] + 4); ctx.lineTo(p[0] - 4, p[1]); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function spriteState(ppm: number, heading: number, sil: boolean) {
  return {
    heading, turret: S.turret * D2R, rotor: S.rotor * D2R, recoil: S.recoil,
    trackR: S.trackR, trackL: S.trackL, damage: S.damage, scheme: S.scheme || undefined, seed: S.seed, num: S.num,
    ppm, lod: S.lod === 'auto' ? undefined : S.lod, layers: S.layers, silhouette: sil ? '#000' : null, lighting: S.lighting,
  };
}

function nightGrade(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Same grade the game applies at night (src/render/fog.ts).
  ctx.save();
  ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = 'rgba(128,128,128,0.6)'; ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgb(78,84,82)'; ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function dimLabel(ctx: CanvasRenderingContext2D, a: Pt, b: Pt, text: string, color: string) {
  const sa = toScreen(hullToWorld(a)), sb = toScreen(hullToWorld(b));
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(sa[0], sa[1]); ctx.lineTo(sb[0], sb[1]); ctx.stroke();
  for (const p of [sa, sb]) { ctx.beginPath(); ctx.arc(p[0], p[1], 2.2, 0, 6.3); ctx.fill(); }
  ctx.font = '11px "Share Tech Mono", monospace';
  const mx = (sa[0] + sb[0]) / 2, my = (sa[1] + sb[1]) / 2;
  const w = ctx.measureText(text).width;
  ctx.fillStyle = 'rgba(22,20,15,0.8)'; ctx.fillRect(mx - w / 2 - 3, my - 8, w + 6, 15);
  ctx.fillStyle = color; ctx.fillText(text, mx - w / 2, my + 4);
}

function drawBounds(ctx: CanvasRenderingContext2D, m: Measured) {
  const box = (b: Box, color: string, dash: number[]) => {
    const pts: Pt[] = [[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1]].map((p) => toScreen(hullToWorld(p as Pt)));
    ctx.setLineDash(dash); ctx.strokeStyle = color; ctx.lineWidth = 1;
    ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.stroke();
    ctx.setLineDash([]);
  };
  const hb = m.hullBox, ob = m.overallBox;
  box(ob, 'rgba(233,163,26,0.75)', [6, 4]);
  box(hb, 'rgba(134,255,110,0.9)', [3, 3]);
  const v = m.values;
  const yOff = hb.y1 + 0.6;
  dimLabel(ctx, [hb.x0, yOff], [hb.x1, yOff], `hull ${fmtV(v.hullLength)} m`, '#86ff6e');
  dimLabel(ctx, [ob.x0, yOff + 0.8], [ob.x1, yOff + 0.8], `overall ${fmtV(v.overallLength)} m`, '#e9a31a');
  dimLabel(ctx, [hb.x0 - 0.6, hb.y0], [hb.x0 - 0.6, hb.y1], `w ${fmtV(v.width)}`, '#86ff6e');
  if (m.muzzle && v.gunOverhang !== undefined) dimLabel(ctx, [hb.x1, hb.y0 - 0.5], [m.muzzle[0], hb.y0 - 0.5], `overhang ${fmtV(v.gunOverhang)}`, '#e9a31a');
  // Turret pivot (follows the live pose) and muzzle (turret forward, as measured).
  if (m.pivot) {
    const p = toScreen(hullToWorld(m.pivot));
    ctx.strokeStyle = '#d0301c'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(p[0] - 8, p[1]); ctx.lineTo(p[0] + 8, p[1]); ctx.moveTo(p[0], p[1] - 8); ctx.lineTo(p[0], p[1] + 8); ctx.stroke();
    ctx.beginPath(); ctx.arc(p[0], p[1], 4, 0, 6.3); ctx.stroke();
  }
  if (m.roadWheelX.length) {
    ctx.fillStyle = 'rgba(134,255,110,0.95)';
    for (const x of m.roadWheelX) { const p = toScreen(hullToWorld([x, hb.y1 + 0.25])); ctx.fillRect(p[0] - 1, p[1] - 5, 2, 10); }
  }
}

function render() {
  const s = sprite();
  const cs = compile(s);
  const m = measure(s);
  const ctx = vctx;
  ctx.fillStyle = S.sil ? '#cfc4a4' : '#b5a57a';
  ctx.fillRect(0, 0, W, H);
  if (S.grid) drawGrid(ctx);
  const drawBody = () => {
    ctx.save();
    const [ox, oy] = toScreen([0, 0]);
    ctx.translate(ox, oy);
    ctx.rotate(S.heading * D2R);
    ctx.scale(S.ppm, S.ppm);
    drawSprite(ctx, cs, spriteState(S.ppm, S.heading * D2R, S.sil));
    ctx.restore();
  };
  if (S.compareMode === 'side' && S.ref.img) {
    // Left half: reference only; right half: sprite only; same scale, each centred in its half.
    const pan = S.panX;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W / 2, H); ctx.clip(); S.panX = pan - W / 4; drawRef(ctx, true); drawMaskOverlay(ctx); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(W / 2, 0, W / 2, H); ctx.clip(); S.panX = pan + W / 4; drawBody(); ctx.restore();
    S.panX = pan;
    ctx.fillStyle = '#16140f'; ctx.fillRect(W / 2 - 1, 0, 2, H);
  } else if (S.compareMode === 'difference' && S.ref.img) {
    drawBody();
    ctx.save(); ctx.globalCompositeOperation = 'difference'; drawRef(ctx, true); ctx.restore();
  } else {
    if (!S.ref.above) drawRef(ctx);
    drawBody();
    if (S.ref.above) drawRef(ctx);
    drawMaskOverlay(ctx);
  }
  if (S.weak) drawWeak(ctx, s);
  drawMarks(ctx, s);
  if (S.night) nightGrade(ctx, W, H);
  if (S.bbox) drawBounds(ctx, m);
  // Ruler
  if (S.ruler) {
    const [a, b] = S.ruler;
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) / D2R).toFixed(1);
    const sa = toScreen(a), sb = toScreen(b);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(sa[0], sa[1]); ctx.lineTo(sb[0], sb[1]); ctx.stroke();
    ctx.font = '12px "Share Tech Mono", monospace';
    const t = `${d.toFixed(3)} m  ${ang}°`;
    ctx.fillStyle = 'rgba(22,20,15,0.85)'; ctx.fillRect(sb[0] + 8, sb[1] - 9, ctx.measureText(t).width + 8, 17);
    ctx.fillStyle = '#fff'; ctx.fillText(t, sb[0] + 12, sb[1] + 4);
  }
  if (S.ref.img) for (const ip of S.calib) {
    const p = toScreen(refToWorld(ip));
    ctx.strokeStyle = '#d0301c'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p[0], p[1], 6, 0, 6.3); ctx.moveTo(p[0] - 10, p[1]); ctx.lineTo(p[0] + 10, p[1]); ctx.moveTo(p[0], p[1] - 10); ctx.lineTo(p[0], p[1] + 10); ctx.stroke();
  }
  // Scale bar
  const barM = S.ppm > 60 ? 1 : S.ppm > 15 ? 5 : 10;
  ctx.fillStyle = '#16140f'; ctx.fillRect(14, H - 22, barM * S.ppm, 5);
  ctx.font = '11px "Share Tech Mono", monospace'; ctx.fillText(`${barM} m`, 14, H - 28);
  buildReadouts(m);
  if (S.thumbs) renderThumbs();
}

// ---------------------------------------------------------------- thumbnails & export
function renderAt(c: HTMLCanvasElement, ppm: number, sil: boolean, def = sprite(), heading = S.heading * D2R, bg = '#a99b74') {
  const ctx = c.getContext('2d')!;
  const m = measure(def);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height);
  const ob = m.overallBox;
  const centre = rotP([(ob.x0 + ob.x1) / 2, (ob.y0 + ob.y1) / 2], heading);
  ctx.translate(c.width / 2 - centre[0] * ppm, c.height / 2 - centre[1] * ppm);
  ctx.rotate(heading);
  ctx.scale(ppm, ppm);
  const st = spriteState(ppm, heading, sil);
  drawSprite(ctx, compile(def), def === sprite() ? st : { ...st, turret: 0, recoil: 0, scheme: undefined, damage: 0, layers: undefined });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function renderThumbs() {
  const m = measure(sprite());
  const L = Math.max(m.overallBox.x1 - m.overallBox.x0, m.overallBox.y1 - m.overallBox.y0);
  const figs: Array<[string, number, number, boolean]> = [
    ['64 px', 64, 64 / (L * 1.05), false], ['64 px silhouette', 64, 64 / (L * 1.05), true],
    ['32 px', 32, 32 / (L * 1.05), false], ['32 px silhouette', 32, 32 / (L * 1.05), true],
    [`game max zoom ${GAME_PPM.max} px/m`, Math.ceil(L * GAME_PPM.max) + 6, GAME_PPM.max, false],
    [`game default ${GAME_PPM.default} px/m`, Math.ceil(L * GAME_PPM.default) + 6, GAME_PPM.default, false],
  ];
  if (thumbs.children.length !== figs.length) thumbs.replaceChildren(...figs.map(() => el('figure', {}, el('canvas'), el('figcaption'))));
  figs.forEach(([label, size, ppm, sil], i) => {
    const fig = thumbs.children[i] as HTMLElement;
    const c = fig.querySelector('canvas')!;
    if (c.width !== size) { c.width = size; c.height = size; c.style.width = c.style.height = `${size * 2}px`; }
    renderAt(c, ppm, sil);
    fig.querySelector('figcaption')!.textContent = label;
  });
}

/** All vehicles at the same scale, so relative sizes can be compared. */
function contactSheet(ppm = 14): HTMLCanvasElement {
  const ms = SPRITES.map((d) => ({ d, m: measure(d) }));
  const maxL = Math.max(...ms.map(({ m }) => m.overallBox.x1 - m.overallBox.x0));
  const maxW = Math.max(...ms.map(({ m }) => m.overallBox.y1 - m.overallBox.y0));
  const cw = Math.ceil(maxL * ppm) + 30, ch = Math.ceil(maxW * ppm) + 46;
  const cols = Math.min(4, ms.length), rows = Math.ceil(ms.length / cols);
  const c = el('canvas', { width: cols * cw, height: rows * ch + 40 });
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#b5a57a'; ctx.fillRect(0, 0, c.width, c.height);
  ms.forEach(({ d, m }, i) => {
    const cell = el('canvas', { width: cw, height: ch - 20 });
    renderAt(cell, ppm, false, d, 0, '#b5a57a');
    const x = (i % cols) * cw, y = Math.floor(i / cols) * ch;
    ctx.drawImage(cell, x, y + 20);
    ctx.fillStyle = '#16140f'; ctx.font = '12px "Share Tech Mono", monospace';
    ctx.fillText(`${d.name}  ${(m.values.overallLength as number).toFixed(2)} × ${(m.values.width as number).toFixed(2)} m`, x + 8, y + 15);
  });
  ctx.fillStyle = '#16140f';
  ctx.fillRect(10, c.height - 18, 5 * ppm, 5);
  ctx.font = '11px "Share Tech Mono", monospace'; ctx.fillText(`5 m · ${ppm} px/m`, 10, c.height - 24);
  return c;
}

function download(url: string, name: string) {
  const a = el('a', { href: url, download: name });
  document.body.append(a); a.click(); a.remove();
}

// ---------------------------------------------------------------- input
let drag: { x: number; y: number; px: number; py: number } | null = null;
view.addEventListener('pointerdown', (e) => {
  view.setPointerCapture(e.pointerId);
  const wp = toWorld(e.offsetX, e.offsetY);
  if (S.tool === 'ruler') S.ruler = [wp, wp];
  else if (S.tool === 'calibrate' && S.ref.img) {
    S.calib.push(worldToRef(wp));
    if (S.calib.length === 2) {
      const [a, b] = S.calib;
      const dPx = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const ans = window.prompt(`Real distance between the two points, in metres (${dPx.toFixed(1)} image px):`);
      const meters = Number(ans);
      if (ans && meters > 0 && dPx > 0) {
        const keep = refToWorld(a);
        S.ref.mPerPx = meters / dPx;
        const moved = refToWorld(a);
        S.ref.ox += keep[0] - moved[0]; S.ref.oy += keep[1] - moved[1];
        const dim = window.prompt('Which real dimension is that (e.g. hull_len, width, track centres)?', 'hull_len');
        S.ref.calibratedTo = `${dim || 'unnamed'} ${meters} m`;
      }
      S.calib = []; S.tool = 'pan'; buildRef();
    }
  } else if (S.tool === 'mask' && S.ref.img) {
    const ip = worldToRef(wp);
    const first = S.maskPoly[0];
    const closeEnough = first && Math.hypot(...(([x, y]) => [x - e.offsetX, y - e.offsetY])(toScreen(refToWorld(first))) as [number, number]) < 8;
    if (closeEnough && S.maskPoly.length >= 3) {
      S.ref.mask = rasterMask(S.maskPoly); S.ref.maskApproved = false; S.maskPoly = []; S.tool = 'pan'; buildCompare();
    } else S.maskPoly.push(ip);
  } else if (S.tool === 'mark' && S.ref.img && S.markId) {
    S.ref.marks[S.markId] = worldToRef(wp);
    S.tool = 'pan'; buildCompare();
  } else drag = { x: e.clientX, y: e.clientY, px: S.panX, py: S.panY };
  sync(); dirty();
});
view.addEventListener('pointermove', (e) => {
  const wp = toWorld(e.offsetX, e.offsetY);
  const hp = worldToHull(wp);
  const tg = Object.values(sprite().groups).find((g) => g.rotate === 'turret');
  const tp = tg ? rotP([hp[0] - tg.pivot[0], hp[1] - tg.pivot[1]], -S.turret * D2R) : null;
  status.replaceChildren(
    el('span', {}, 'hull ', el('b', { textContent: `${hp[0].toFixed(3)}, ${hp[1].toFixed(3)}` })),
    ...(tp ? [el('span', {}, 'turret ', el('b', { textContent: `${tp[0].toFixed(3)}, ${tp[1].toFixed(3)}` }))] : []),
    el('span', {}, 'zoom ', el('b', { textContent: `${S.ppm.toFixed(0)} px/m` })),
    el('span', { textContent: S.tool === 'calibrate' ? `calibrate: click point ${S.calib.length + 1} of 2` : S.tool === 'ruler' ? 'ruler: drag to measure' : S.tool === 'mask' ? `mask: click around the vehicle, click the first point to close (${S.maskPoly.length} points)` : S.tool === 'mark' ? `mark: click where ${S.markId} is on the image` : 'drag to pan, wheel to zoom' }),
  );
  if (drag) { S.panX = drag.px + e.clientX - drag.x; S.panY = drag.py + e.clientY - drag.y; dirty(); }
  else if (S.tool === 'ruler' && S.ruler && e.buttons) { S.ruler[1] = wp; dirty(); }
});
view.addEventListener('pointerup', () => { drag = null; });
view.addEventListener('wheel', (e) => {
  e.preventDefault();
  const before = toWorld(e.offsetX, e.offsetY);
  S.ppm = Math.max(2, Math.min(300, S.ppm * Math.exp(-e.deltaY * 0.0015)));
  const after = toWorld(e.offsetX, e.offsetY);
  S.panX += (after[0] - before[0]) * S.ppm; S.panY += (after[1] - before[1]) * S.ppm;
  sync(); dirty();
}, { passive: false });
view.addEventListener('dragover', (e) => e.preventDefault());
view.addEventListener('drop', (e) => {
  e.preventDefault();
  const f = e.dataTransfer?.files[0];
  if (f && f.type.startsWith('image/')) loadRefImage(URL.createObjectURL(f), f.name, false);
});
window.addEventListener('resize', resize);

// ---------------------------------------------------------------- loop
let recoilT0 = -1;
let last = performance.now();
function frame(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  let anim = false;
  if (recoilT0 >= 0) {
    const t = (now - recoilT0) / 1000;
    S.recoil = t < 0.04 ? t / 0.04 : Math.max(0, 1 - (t - 0.04) / 0.7);
    if (t > 0.8) { recoilT0 = -1; S.recoil = 0; }
    anim = true;
  }
  if (S.drive) { S.trackR += dt * 2; S.trackL += dt * 2; anim = true; }
  if (S.spin) { S.rotor = (S.rotor + dt * 1080) % 360; anim = true; }
  if (anim) { sync(); needs = true; }
  if (needs) { needs = false; render(); }
  requestAnimationFrame(frame);
}

// Headless / scripting API.
declare global { interface Window { lab: unknown; __labReady?: boolean } }
window.lab = {
  state: S,
  set(p: Partial<typeof S>) { const prevId = S.id; Object.assign(S, p); if (S.id !== prevId) { buildLeft(); buildRight(); } sync(); render(); },
  report() { const d = sprite(); const m = measure(d); return { id: d.id, values: m.values, roadWheelX: m.roadWheelX, spec: compareSpec(d, m) }; },
  loadRef: (name: string) => loadRefImage(refUrl(name), name, true),
  setRef(p: Partial<RefState>) { Object.assign(S.ref, p); buildRef(); buildCompare(); render(); },
  setMaskFromPoints(poly: Pt[], approve = false) { S.ref.mask = rasterMask(poly); S.ref.maskApproved = approve; buildCompare(); render(); },
  loadRefData: (url: string, name: string) => loadRefImage(url, name, false),
  async setMaskData(url: string, approve = false) {
    const mi = await loadImage(url);
    if (!mi) return;
    S.ref.mask = el('canvas', { width: mi.naturalWidth, height: mi.naturalHeight }); S.ref.mask.getContext('2d')!.drawImage(mi, 0, 0);
    S.ref.maskApproved = approve; buildCompare(); render();
  },
  setMarks(m: Record<string, Pt>) { S.ref.marks = m; buildCompare(); render(); },
  compare: () => runCompare(),
  anchors: () => anchors(sprite()),
  confusable(size = 64, limit = 0.9) {
    const out: Array<{ a: string; b: string; iou: number }> = [];
    for (let i = 0; i < SPRITES.length; i++) for (let j = i + 1; j < SPRITES.length; j++) {
      const iou = thumbSimilarity(SPRITES[i], SPRITES[j], size);
      if (iou >= limit) out.push({ a: SPRITES[i].id, b: SPRITES[j].id, iou });
    }
    return out;
  },
  view: () => { render(); return view.toDataURL('image/png'); },
  contactSheet: (ppm?: number) => contactSheet(ppm).toDataURL('image/png'),
  thumb: (size: number, sil = false) => { const m = measure(sprite()); const L = Math.max(m.overallBox.x1 - m.overallBox.x0, m.overallBox.y1 - m.overallBox.y0); const c = el('canvas', { width: size, height: size }); renderAt(c, size / (L * 1.05), sil); return c.toDataURL('image/png'); },
  sprites: () => SPRITES.map((s) => s.id),
};

(async () => {
  readUrl();
  await loadFonts();
  buildLeft();
  buildRight();
  buildCompare();
  thumbs.style.display = S.thumbs ? '' : 'none';
  resize();
  loadRefList();
  render();
  window.__labReady = true;
  requestAnimationFrame(frame);
})();
