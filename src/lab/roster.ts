/**
 * Every vehicle in the game for the contact sheet and the 64 px confusability check: the sheet-generated sprite
 * where a vehicle sheet exists, otherwise the game's current (legacy) sprite, labelled as such.
 */
import { UNITS } from '../data/units';
import type { UnitDef } from '../data/units/types';
import { SPRITE_BY_ID } from '../data/sprites';
import type { SpriteDef } from '../data/sprites/types';
import { drawBody } from '../render/sprites';
import type { Unit } from '../sim/entity';
import { compile } from '../render/vector/compile';
import { drawSprite } from '../render/vector/render';
import { measure } from '../render/vector/measure';

export interface Box { x0: number; y0: number; x1: number; y1: number }
export interface Entry {
  id: string; name: string; source: 'sheet' | 'legacy';
  box: Box; // hull frame, heading 0, metres
  draw(ctx: CanvasRenderingContext2D, ppm: number): void; // ctx in metres, hull frame
}

function legacyUnit(def: UnitDef): Unit {
  const air = def.moveClass === 'air';
  return {
    def, id: 1, team: 0, alive: true, wreck: false, heading: 0, turretAngle: 0, recoil: 0, hpFrac: 1, speed: 0,
    isAir: air, altitude: air ? 100 : 0, air: air ? { landed: false } : undefined, mob: { moving: false },
    weapons: def.weapons.map(() => ({ aim: 0 })),
  } as unknown as Unit;
}

const boxCache = new Map<string, Box>();
/** Bounds of a legacy sprite found by rendering it (its gun and rotor reach past length/width). */
function scanBox(id: string, draw: (ctx: CanvasRenderingContext2D, ppm: number) => void): Box {
  const hit = boxCache.get(id);
  if (hit) return hit;
  const ppm = 10, half = 20, n = half * 2 * ppm;
  const c = document.createElement('canvas'); c.width = c.height = n;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.setTransform(ppm, 0, 0, ppm, n / 2, n / 2);
  draw(ctx, ppm);
  const d = ctx.getImageData(0, 0, n, n).data;
  let x0 = n, y0 = n, x1 = 0, y1 = 0;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (d[(y * n + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const b = x1 >= x0 ? { x0: x0 / ppm - half, x1: (x1 + 1) / ppm - half, y0: y0 / ppm - half, y1: (y1 + 1) / ppm - half } : { x0: -1, x1: 1, y0: -1, y1: 1 };
  boxCache.set(id, b);
  return b;
}

export function sheetEntry(s: SpriteDef): Entry {
  const m = measure(s);
  return {
    id: s.id, name: s.name, source: 'sheet', box: m.overallBox,
    draw: (ctx, ppm) => drawSprite(ctx, compile(s), { heading: 0, turret: 0, rotor: 0, recoil: 0, trackR: 0, trackL: 0, damage: 0, seed: 1, num: '', ppm, layers: { markings: false, damage: false } }),
  };
}

export function roster(): Entry[] {
  const out: Entry[] = [];
  for (const def of Object.values(UNITS)) {
    if (def.category === 'infantry') continue;
    const s = SPRITE_BY_ID[def.id];
    if (s) { out.push(sheetEntry(s)); continue; }
    const u = legacyUnit(def);
    const draw = (ctx: CanvasRenderingContext2D, ppm: number) => {
      try { drawBody(ctx, u, { selected: false, hover: false, time: 0, zoom: ppm / 1.7, friendlyView: true }); } catch { /* legacy sprite needs live state */ }
    };
    out.push({ id: def.id, name: def.name, source: 'legacy', box: scanBox(def.id, draw), draw });
  }
  return out;
}

/** Silhouette mask of an entry centred in a size × size square at a shared px/m. */
export function silhouette(e: Entry, size: number, ppm: number): Uint8Array {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.setTransform(ppm, 0, 0, ppm, size / 2 - ((e.box.x0 + e.box.x1) / 2) * ppm, size / 2 - ((e.box.y0 + e.box.y1) / 2) * ppm);
  e.draw(ctx, ppm);
  const d = ctx.getImageData(0, 0, size, size).data;
  const m = new Uint8Array(size * size);
  for (let i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] > 127 ? 1 : 0;
  return m;
}

/** Pairwise silhouette IoU at a thumbnail size; both fitted to the larger of the two so relative size counts. */
export function confusability(entries: Entry[], size = 64): Array<{ a: string; b: string; iou: number }> {
  const out: Array<{ a: string; b: string; iou: number }> = [];
  for (let i = 0; i < entries.length; i++) for (let j = i + 1; j < entries.length; j++) {
    const A = entries[i], B = entries[j];
    const L = Math.max(A.box.x1 - A.box.x0, B.box.x1 - B.box.x0, A.box.y1 - A.box.y0, B.box.y1 - B.box.y0);
    const ppm = size / (L * 1.05);
    const ma = silhouette(A, size, ppm), mb = silhouette(B, size, ppm);
    let inter = 0, uni = 0;
    for (let k = 0; k < ma.length; k++) { inter += ma[k] & mb[k]; uni += ma[k] | mb[k]; }
    out.push({ a: A.id, b: B.id, iou: uni ? inter / uni : 0 });
  }
  return out.sort((p, q) => q.iou - p.iou);
}

export const CONFUSABLE_IOU = 0.9;
