/**
 * Sprite-vs-reference comparison for the Sprite Lab: silhouette IoU against an approved mask, outline distance
 * (Euclidean distance transform between the two boundaries) and per-part position error against marked points.
 * Everything is measured in the hull frame at heading 0, turret forward, no recoil, on a 1 cm grid.
 */
import type { SpriteDef } from '../data/sprites/types';
import { compile, groupXf, partSubs } from '../render/vector/compile';
import { drawSprite } from '../render/vector/render';
import { emptyBox, flatten, growBox, type Pt } from '../render/vector/geometry';
import { measure } from '../render/vector/measure';

export const GRID_PX_PER_M = 100; // 1 px = 1 cm
export const THRESHOLDS = { iou: 0.95, maxOutlineCm: 8, partCm: 10 };

export interface RefPlacement { mPerPx: number; rot: number; ox: number; oy: number } // rot in degrees

/** Markable points of a sprite: every instance centre of every part, plus the turret pivot and the muzzle. */
export interface Anchor { id: string; at: Pt; conf: 'A' | 'B' | 'C' | 'X' | undefined }

export function anchors(def: SpriteDef): Anchor[] {
  const cs = compile(def);
  const pose = { turret: 0, rotor: 0, recoil: 0 };
  const out: Anchor[] = [];
  for (const cp of cs.parts) {
    if (cp.def.layer === 'markings' || cp.def.fill === null) continue;
    const g = groupXf(def, cp.group, pose);
    const inst = cp.instances(0, 0);
    inst.forEach((x, k) => {
      const b = emptyBox();
      for (const pts of flatten(partSubs({ ...cp, instances: () => [x] }), 6)) growBox(b, pts);
      const at = g.map([(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2]);
      out.push({ id: inst.length > 1 ? `${cp.def.id}#${k}` : cp.def.id, at, conf: cp.def.conf });
    });
  }
  const m = measure(def);
  if (m.pivot) out.push({ id: 'turret_pivot', at: m.pivot, conf: undefined });
  if (m.muzzle) out.push({ id: 'muzzle', at: m.muzzle, conf: def.parts.find((p) => p.id === 'barrel')?.conf });
  return out;
}

interface Grid { w: number; h: number; x0: number; y0: number }

function gridFor(def: SpriteDef): Grid {
  const ob = measure(def).overallBox;
  const x0 = ob.x0 - 1, y0 = ob.y0 - 1;
  return { x0, y0, w: Math.ceil((ob.x1 - ob.x0 + 2) * GRID_PX_PER_M), h: Math.ceil((ob.y1 - ob.y0 + 2) * GRID_PX_PER_M) };
}

function canvasFor(g: Grid) {
  const c = document.createElement('canvas');
  c.width = g.w; c.height = g.h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.setTransform(GRID_PX_PER_M, 0, 0, GRID_PX_PER_M, -g.x0 * GRID_PX_PER_M, -g.y0 * GRID_PX_PER_M);
  return { c, ctx };
}

function toMask(ctx: CanvasRenderingContext2D, g: Grid): Uint8Array {
  const d = ctx.getImageData(0, 0, g.w, g.h).data;
  const m = new Uint8Array(g.w * g.h);
  for (let i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] > 127 ? 1 : 0;
  return m;
}

/** Hull + turret silhouette of the sprite (no gun, markings, damage). */
export function spriteMask(def: SpriteDef, g = gridFor(def)): Uint8Array {
  const { ctx } = canvasFor(g);
  drawSprite(ctx, compile(def), {
    heading: 0, turret: 0, rotor: 0, recoil: 0, trackR: 0, trackL: 0, damage: 0, seed: 1, num: '', ppm: GRID_PX_PER_M,
    lod: 0, silhouette: '#000', layers: { barrel: false, markings: false, damage: false, rotor: false },
  });
  return toMask(ctx, g);
}

/** Reference mask image (image pixels, opaque = vehicle) placed by its calibration. */
export function refMask(img: CanvasImageSource & { width: number; height: number }, place: RefPlacement, g: Grid): Uint8Array {
  const { ctx } = canvasFor(g);
  ctx.translate(place.ox, place.oy);
  ctx.rotate((place.rot * Math.PI) / 180);
  ctx.scale(place.mPerPx, place.mPerPx);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  return toMask(ctx, g);
}

function boundary(m: Uint8Array, w: number, h: number): Uint8Array {
  const b = new Uint8Array(m.length);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (!m[i]) continue;
    if (x === 0 || y === 0 || x === w - 1 || y === h - 1 || !m[i - 1] || !m[i + 1] || !m[i - w] || !m[i + w]) b[i] = 1;
  }
  return b;
}

/** Felzenszwalb-Huttenlocher squared Euclidean distance transform of a binary mask's set pixels. */
function edt(src: Uint8Array, w: number, h: number): Float32Array {
  const INF = 1e12;
  const f = new Float64Array(Math.max(w, h)), d = new Float64Array(Math.max(w, h)), v = new Int32Array(Math.max(w, h)), z = new Float64Array(Math.max(w, h) + 1);
  const out = new Float32Array(w * h);
  const tmp = new Float64Array(w * h);
  const pass = (n: number, get: (i: number) => number, set: (i: number, val: number) => void) => {
    for (let i = 0; i < n; i++) f[i] = get(i);
    let k = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
    for (let q = 1; q < n; q++) {
      let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
      k++; v[k] = q; z[k] = s; z[k + 1] = INF;
    }
    k = 0;
    for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
    for (let i = 0; i < n; i++) set(i, d[i]);
  };
  for (let x = 0; x < w; x++) pass(h, (y) => (src[y * w + x] ? 0 : INF), (y, val) => { tmp[y * w + x] = val; });
  for (let y = 0; y < h; y++) pass(w, (x) => tmp[y * w + x], (x, val) => { out[y * w + x] = val; });
  return out;
}

export interface PartError { id: string; conf: Anchor['conf']; errCm: number; counted: boolean; pass: boolean }
export interface CompareResult {
  iou: number; meanCm: number; maxCm: number;
  parts: PartError[];
  pass: { iou: boolean; outline: boolean; parts: boolean };
  failures: string[];
}

export function compare(def: SpriteDef, mask: (CanvasImageSource & { width: number; height: number }) | null, place: RefPlacement | null, marks: Record<string, Pt>): CompareResult {
  const g = gridFor(def);
  let iou = NaN, meanCm = NaN, maxCm = NaN;
  if (mask && place) {
    const a = spriteMask(def, g), b = refMask(mask, place, g);
    let inter = 0, uni = 0;
    for (let i = 0; i < a.length; i++) { inter += a[i] & b[i]; uni += a[i] | b[i]; }
    iou = uni ? inter / uni : 0;
    const ba = boundary(a, g.w, g.h), bb = boundary(b, g.w, g.h);
    const da = edt(ba, g.w, g.h), db = edt(bb, g.w, g.h);
    let sum = 0, n = 0, mx = 0;
    for (let i = 0; i < ba.length; i++) {
      if (ba[i]) { const d = Math.sqrt(db[i]); sum += d; n++; mx = Math.max(mx, d); }
      if (bb[i]) { const d = Math.sqrt(da[i]); sum += d; n++; mx = Math.max(mx, d); }
    }
    meanCm = n ? (sum / n) * (100 / GRID_PX_PER_M) : NaN;
    maxCm = mx * (100 / GRID_PX_PER_M);
  }
  const parts: PartError[] = [];
  for (const an of anchors(def)) {
    const mk = marks[an.id];
    if (!mk) continue;
    const errCm = Math.hypot(mk[0] - an.at[0], mk[1] - an.at[1]) * 100;
    const counted = an.conf === 'A' || an.conf === 'B';
    parts.push({ id: an.id, conf: an.conf, errCm, counted, pass: errCm <= THRESHOLDS.partCm });
  }
  const pass = {
    iou: iou >= THRESHOLDS.iou,
    outline: maxCm <= THRESHOLDS.maxOutlineCm,
    parts: parts.filter((p) => p.counted).every((p) => p.pass),
  };
  const failures: string[] = [];
  if (!mask) failures.push('no approved mask');
  else {
    if (!pass.iou) failures.push(`IoU ${iou.toFixed(3)} < ${THRESHOLDS.iou}`);
    if (!pass.outline) failures.push(`max outline error ${maxCm.toFixed(1)} cm > ${THRESHOLDS.maxOutlineCm} cm`);
  }
  for (const p of parts) if (p.counted && !p.pass) failures.push(`${p.id}: ${p.errCm.toFixed(1)} cm > ${THRESHOLDS.partCm} cm`);
  return { iou, meanCm, maxCm, parts, pass, failures };
}

/** Silhouette similarity of two sprites at a thumbnail size (both centred, heading 0, same px/m). */
export function thumbSimilarity(a: SpriteDef, b: SpriteDef, size = 64): number {
  const ma = measure(a), mb = measure(b);
  const L = Math.max(ma.overallBox.x1 - ma.overallBox.x0, mb.overallBox.x1 - mb.overallBox.x0);
  const ppm = size / (L * 1.05);
  const render = (d: SpriteDef, ob: typeof ma.overallBox) => {
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.setTransform(ppm, 0, 0, ppm, size / 2 - ((ob.x0 + ob.x1) / 2) * ppm, size / 2 - ((ob.y0 + ob.y1) / 2) * ppm);
    drawSprite(ctx, compile(d), { heading: 0, turret: 0, rotor: 0, recoil: 0, trackR: 0, trackL: 0, damage: 0, seed: 1, num: '', ppm, silhouette: '#000', layers: { markings: false, damage: false } });
    const px = ctx.getImageData(0, 0, size, size).data;
    const m = new Uint8Array(size * size);
    for (let i = 0; i < m.length; i++) m[i] = px[i * 4 + 3] > 127 ? 1 : 0;
    return m;
  };
  const A = render(a, ma.overallBox), B = render(b, mb.overallBox);
  let inter = 0, uni = 0;
  for (let i = 0; i < A.length; i++) { inter += A[i] & B[i]; uni += A[i] | B[i]; }
  return uni ? inter / uni : 0;
}
