import { PHOTO_ROOFS } from '../data/photoBuildings';

/**
 * Photo roofs: flat roofs of real houses cut out of freely licensed overhead photographs of
 * towns in the region (see assets/buildings/CREDITS.md for sources and licences, and
 * tools/photo-sprites/buildings.py for the processing). Each building tile picks one roof and a
 * quarter-turn by a stable hash of its position.
 *
 * Images load asynchronously. Until a roof is ready (or if it fails to load) the caller falls back
 * to the procedural roof.
 */
const urls = import.meta.glob('../assets/buildings/*.{png,jpg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

const images = new Map<string, HTMLImageElement | null>();

function image(file: string): HTMLImageElement | null {
  if (images.has(file)) return images.get(file)!;
  const url = urls[`../assets/buildings/${file}`];
  if (!url || typeof Image === 'undefined') { images.set(file, null); return null; }
  const el = new Image();
  el.decoding = 'async';
  el.onerror = () => images.set(file, null);
  el.src = url;
  images.set(file, el);
  return el;
}

const ready = (el: HTMLImageElement | null): el is HTMLImageElement => !!el && el.complete && el.naturalWidth > 0;

export function preloadPhotoRoofs() { for (const r of PHOTO_ROOFS) image(r.file); }
preloadPhotoRoofs();

/**
 * Draws a roof photo filling the tile square at (sx, sy) with side s pixels. `pick` and `turn`
 * are stable 0..1 hashes. Returns false if no roof image is loaded yet.
 */
export function drawPhotoRoof(ctx: CanvasRenderingContext2D, sx: number, sy: number, s: number, pick: number, turn: number): boolean {
  if (!PHOTO_ROOFS.length) return false;
  const img = image(PHOTO_ROOFS[Math.floor(pick * PHOTO_ROOFS.length) % PHOTO_ROOFS.length].file);
  if (!ready(img)) return false;
  ctx.save();
  ctx.translate(sx + s / 2, sy + s / 2);
  ctx.rotate(Math.floor(turn * 4) * (Math.PI / 2));
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, -s / 2 - 0.25, -s / 2 - 0.25, s + 0.5, s + 0.5);
  ctx.restore();
  return true;
}
