import type { Unit } from '../sim/entity';
import { PHOTO_SPRITES, type PhotoSpriteDef } from '../data/photoSprites';

/**
 * Photo sprites: top-down photographs of the real vehicles, cut out and rectified to the unit's
 * hull length and width (see assets/tanks/CREDITS.md for sources and licences, and
 * tools/photo-sprites/ for the processing). Each vehicle has two layers: the hull, with the turret
 * area filled in, and the turret with its gun, which rotates about its ring centre.
 *
 * Images load asynchronously. Until a vehicle's images are ready (or if they fail to load) the
 * caller falls back to the procedural vector sprite.
 */
const urls = import.meta.glob('../assets/tanks/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

interface Loaded {
  def: PhotoSpriteDef; hull: HTMLImageElement; turret: HTMLImageElement;
  /** Derived layers, built once the photos have loaded: turret silhouette (shadow) and burnt-out wreck tones. */
  derived?: { turretShadow: HTMLCanvasElement; hullWreck: HTMLCanvasElement; turretWreck: HTMLCanvasElement };
}

/** Copy of an image with its opaque pixels painted over in one colour (keeps the alpha edge). */
function tinted(img: HTMLImageElement, colour: string, mode: GlobalCompositeOperation): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const g = c.getContext('2d')!;
  g.drawImage(img, 0, 0);
  g.globalCompositeOperation = mode;
  g.fillStyle = colour; g.fillRect(0, 0, c.width, c.height);
  return c;
}

function derived(l: Loaded) {
  if (!l.derived) {
    const wreck = (img: HTMLImageElement) => {
      const c = tinted(img, 'rgba(28,24,19,0.72)', 'source-atop');
      return c;
    };
    l.derived = { turretShadow: tinted(l.turret, '#000', 'source-in'), hullWreck: wreck(l.hull), turretWreck: wreck(l.turret) };
  }
  return l.derived;
}
const cache = new Map<string, Loaded | null>();

function load(id: string): Loaded | null {
  if (cache.has(id)) return cache.get(id)!;
  const def = PHOTO_SPRITES[id];
  if (!def || typeof Image === 'undefined') { cache.set(id, null); return null; }
  const img = (file: string) => {
    const el = new Image();
    el.decoding = 'async';
    const url = urls[`../assets/tanks/${file}`];
    if (url) el.src = url;
    el.onerror = () => cache.set(id, null);
    return el;
  };
  const l: Loaded = { def, hull: img(def.hull.file), turret: img(def.turret.file) };
  cache.set(id, l);
  return l;
}

/** Start loading every photo sprite (call once at startup so first frames already have them). */
export function preloadPhotoSprites() { for (const id of Object.keys(PHOTO_SPRITES)) load(id); }

const ready = (l: Loaded | null): l is Loaded =>
  !!l && l.hull.complete && l.hull.naturalWidth > 0 && l.turret.complete && l.turret.naturalWidth > 0;

export function hasPhotoSprite(defId: string) { return ready(load(defId)); }

/**
 * Draws the hull and turret photo layers in local metres (+x forward), matching the vector
 * sprite's coordinate frame. Returns false if the images are not available yet.
 */
export function drawPhotoTank(ctx: CanvasRenderingContext2D, u: Unit, opts: { wreck?: boolean; turretAskew?: { x: number; y: number; a: number } } = {}): boolean {
  const l = load(u.def.id);
  if (!ready(l)) return false;
  const { hull, turret, pivot } = l.def;
  const L = u.def.sprite.length, W = u.def.sprite.width;
  const d = derived(l);
  const hullImg = opts.wreck ? d.hullWreck : l.hull, turretImg = opts.wreck ? d.turretWreck : l.turret;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  // Soft drop shadow under the hull
  ctx.fillStyle = opts.wreck ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.roundRect(-L / 2 + 0.25, -W / 2 + 0.3, L, W, 0.4); ctx.fill();
  ctx.drawImage(hullImg, -hull.w / 2, -hull.h / 2, hull.w, hull.h);
  ctx.save();
  if (opts.turretAskew) {
    ctx.translate(pivot[0] + opts.turretAskew.x, pivot[1] + opts.turretAskew.y);
    ctx.rotate(opts.turretAskew.a);
  } else {
    ctx.translate(pivot[0], pivot[1]);
    ctx.rotate(u.turretAngle - u.heading);
    ctx.translate(-u.recoil * 0.35, 0);
  }
  // Turret shadow on the deck, then the turret itself
  ctx.globalAlpha = 0.3;
  ctx.drawImage(d.turretShadow, -turret.pivot[0] + 0.12, -turret.pivot[1] + 0.16, turret.w, turret.h);
  ctx.globalAlpha = 1;
  ctx.drawImage(turretImg, -turret.pivot[0], -turret.pivot[1], turret.w, turret.h);
  ctx.restore();
  ctx.restore();
  return true;
}
