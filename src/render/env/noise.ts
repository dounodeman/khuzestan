/** Seeded value noise and helpers for the environment renderers. Pure functions, world-space input. */

export function hash2(x: number, y: number, seed: number): number {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Hash of an integer cell plus an item index, for stable scatter. */
export const hash3 = (x: number, y: number, k: number, seed: number) => hash2(x * 31 + k, y * 17 - k * 7, seed + k * 101);

/** Smooth value noise in [0,1] with quintic interpolation (no visible grid creases). */
export function noise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10), v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
  const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed), c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/**
 * Fractal noise in [0,1]. `scale` is the feature size in metres of the first octave. Octaves whose features are
 * smaller than two screen pixels (`pixel` metres) fade out, which is what keeps far zoom clean.
 */
export function fbm(x: number, y: number, seed: number, scale: number, octaves = 4, pixel = 0): number {
  let sum = 0, amp = 1, norm = 0, s = scale;
  // Rotate each octave a little so grid alignment never lines up.
  let px = x, py = y;
  for (let i = 0; i < octaves; i++) {
    const lod = pixel > 0 ? clamp01((s / pixel - 2) / 2) : 1;
    if (lod <= 0) break;
    sum += (noise(px / s, py / s, seed + i * 17) - 0.5) * amp * lod;
    norm += amp;
    amp *= 0.5;
    s *= 0.5;
    const rx = px * 0.8 - py * 0.6, ry = px * 0.6 + py * 0.8;
    px = rx + 13.7; py = ry - 7.3;
  }
  return 0.5 + (norm > 0 ? sum / norm : 0) * 1.6;
}

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const smoothstep = (a: number, b: number, x: number) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type RGB = [number, number, number];
const cache = new Map<string, RGB>();
export function rgb(hex: string): RGB {
  let c = cache.get(hex);
  if (!c) { c = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]; cache.set(hex, c); }
  return c;
}
export const mixRgb = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const css = (c: RGB, a = 1) => (a >= 1 ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a.toFixed(3)})`);

/** Zoom-window opacity for a LOD rule. */
export function lodAlpha(lod: { minZoom?: number; maxZoom?: number; fade?: number } | undefined, zoom: number): number {
  if (!lod) return 1;
  const f = lod.fade ?? 0;
  let a = 1;
  if (lod.minZoom !== undefined) a = Math.min(a, f > 0 ? clamp01((zoom - lod.minZoom) / f) : zoom >= lod.minZoom ? 1 : 0);
  if (lod.maxZoom !== undefined) a = Math.min(a, f > 0 ? clamp01((lod.maxZoom - zoom) / f + 1) : zoom < lod.maxZoom ? 1 : 0);
  return a;
}
