import type { FactionId } from '../data/units/types';
import { PHOTO_INFANTRY, type InfantryPhotoDef } from '../data/photoInfantry';

/**
 * Photo infantry: soldiers cut out of freely licensed photographs from the Iran-Iraq War (see
 * assets/infantry/CREDITS.md for sources and licences, and tools/photo-sprites/infantry.py for
 * the processing). Each faction has a few upright and prone figures; every man in a squad picks
 * one by a stable hash so the squad looks mixed but does not flicker.
 *
 * Images load asynchronously. Until a figure is ready (or if it fails to load) the caller falls
 * back to the procedural vector soldier.
 */
const urls = import.meta.glob('../assets/infantry/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

const images = new Map<string, HTMLImageElement | null>();

function image(file: string): HTMLImageElement | null {
  if (images.has(file)) return images.get(file)!;
  const url = urls[`../assets/infantry/${file}`];
  if (!url || typeof Image === 'undefined') { images.set(file, null); return null; }
  const el = new Image();
  el.decoding = 'async';
  el.onerror = () => images.set(file, null);
  el.src = url;
  images.set(file, el);
  return el;
}

const ready = (el: HTMLImageElement | null): el is HTMLImageElement => !!el && el.complete && el.naturalWidth > 0;

/** Start loading every figure so the first frames already have them. */
export function preloadPhotoInfantry() {
  for (const f of Object.values(PHOTO_INFANTRY)) for (const d of [...f.stand, ...f.prone]) image(d.file);
}
preloadPhotoInfantry();

/** The figure for one soldier, or null if none is loaded yet. `pick` is a stable 0..1 hash. */
export function photoSoldier(faction: FactionId, prone: boolean, pick: number): { def: InfantryPhotoDef; img: HTMLImageElement } | null {
  const set = PHOTO_INFANTRY[faction];
  const list = set && (prone ? set.prone : set.stand);
  if (!list || !list.length) return null;
  const def = list[Math.floor(pick * list.length) % list.length];
  const img = image(def.file);
  return ready(img) ? { def, img } : null;
}

/**
 * Draws one soldier figure in local metres facing +x, centred on its body. `scale` matches the
 * readability exaggeration the vector soldiers use.
 */
export function drawPhotoSoldier(ctx: CanvasRenderingContext2D, s: { def: InfantryPhotoDef; img: HTMLImageElement }, scale: number) {
  const { def, img } = s;
  const w = def.w * scale, h = def.h * scale;
  const ax = def.anchor[0] * scale, ay = def.anchor[1] * scale;
  // Soft shadow under the figure
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.ellipse(0.14, 0.14, w * 0.42, h * 0.4, 0, 0, 6.3); ctx.fill();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, -ax, -ay, w, h);
}
