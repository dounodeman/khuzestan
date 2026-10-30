/**
 * Procedural camo and scorch textures: seeded value-noise blotches rendered to small offscreen canvases
 * in a group's local frame, then clipped to each painted part. Cached per sprite, scheme, seed and group.
 */
import { CAMO_SCHEMES, color } from '../../data/sprites/palette';
import type { Box } from './geometry';

const TEX_PX_PER_M = 24;

function hash(x: number, y: number, seed: number) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function valueNoise(x: number, y: number, seed: number) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, seed), b = hash(xi + 1, yi, seed), c = hash(xi, yi + 1, seed), d = hash(xi + 1, yi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x: number, y: number, seed: number) {
  return valueNoise(x, y, seed) * 0.6 + valueNoise(x * 2.1, y * 2.1, seed + 11) * 0.28 + valueNoise(x * 4.3, y * 4.3, seed + 23) * 0.12;
}

export interface Tex { canvas: HTMLCanvasElement; box: Box }

function blotchTex(box: Box, layers: Array<{ rgb: [number, number, number]; alpha: number; coverage: number; scale: number; seed: number }>): Tex {
  const w = Math.max(1, Math.ceil((box.x1 - box.x0) * TEX_PX_PER_M)), h = Math.max(1, Math.ceil((box.y1 - box.y0) * TEX_PX_PER_M));
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  const vals = new Float32Array(w * h);
  for (const L of layers) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const mx = box.x0 + i / TEX_PX_PER_M, my = box.y0 + j / TEX_PX_PER_M;
      vals[j * w + i] = fbm(mx / L.scale, my / L.scale, L.seed);
    }
    const sorted = Float32Array.from(vals).sort();
    const thr = sorted[Math.min(sorted.length - 1, Math.floor((1 - L.coverage) * sorted.length))];
    const soft = 0.015;
    for (let k = 0; k < vals.length; k++) {
      const t = (vals[k] - (thr - soft)) / (2 * soft);
      if (t <= 0) continue;
      const a = Math.min(1, t) * L.alpha;
      const o = k * 4, ia = img.data[o + 3] / 255;
      const na = a + ia * (1 - a);
      for (let c = 0; c < 3; c++) img.data[o + c] = (L.rgb[c] * a + img.data[o + c] * ia * (1 - a)) / (na || 1);
      img.data[o + 3] = na * 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return { canvas: cv, box };
}

function rgbOf(css: string): [number, number, number] {
  const m = css.match(/^#([0-9a-f]{6})$/i);
  if (!m) return [0, 0, 0];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const camoCache = new Map<string, Tex | null>();

export function camoTex(spriteId: string, scheme: string, seed: number, group: string, box: Box): Tex | null {
  const key = `${spriteId}|${scheme}|${seed}|${group}`;
  if (camoCache.has(key)) return camoCache.get(key)!;
  const s = CAMO_SCHEMES[scheme];
  let tex: Tex | null = null;
  if (s && s.blotches.length && isFinite(box.x0)) {
    const gs = group.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % 1000;
    tex = blotchTex(box, s.blotches.map((b, i) => ({ rgb: rgbOf(color(b.color, s.base)), alpha: 1, coverage: b.coverage, scale: b.scale, seed: seed * 101 + gs + i * 7 })));
  }
  camoCache.set(key, tex);
  return tex;
}

const scorchCache = new Map<string, Tex>();

export function scorchTex(spriteId: string, seed: number, level: 1 | 2, group: string, box: Box): Tex {
  const key = `${spriteId}|${seed}|${level}|${group}`;
  let t = scorchCache.get(key);
  if (!t) {
    t = blotchTex(box, [
      { rgb: [34, 30, 25], alpha: level === 2 ? 0.85 : 0.7, coverage: level === 2 ? 0.45 : 0.12, scale: 0.9, seed: seed * 13 + 500 + group.length },
      { rgb: [14, 12, 10], alpha: 0.9, coverage: level === 2 ? 0.15 : 0.03, scale: 0.5, seed: seed * 17 + 900 + group.length },
    ]);
    scorchCache.set(key, t);
  }
  return t;
}
