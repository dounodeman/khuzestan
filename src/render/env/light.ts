import type { LightPreset, WeatherPreset } from '../../data/environment/types';
import { fbm, rgb } from './noise';

/** A rectangle of the world drawn into a pixel buffer. zoom = pixels per metre (as Camera.zoom). */
export interface View { x0: number; y0: number; zoom: number; w: number; h: number }

export interface Sun {
  /** Unit vector towards the light in screen space (x right, y down) and its elevation components. */
  lx: number; ly: number; lz: number;
  /** Ground offset of a shadow per metre of height (capped so dawn shadows do not smear the map). */
  sx: number; sy: number;
}

export function sunOf(light: LightPreset): Sun {
  const az = (light.sunAzimuth * Math.PI) / 180, el = (light.sunElevation * Math.PI) / 180;
  const dx = Math.sin(az), dy = -Math.cos(az);
  const len = Math.min(2.6, 1 / Math.tan(Math.max(el, 0.05)));
  return { lx: dx * Math.cos(el), ly: dy * Math.cos(el), lz: Math.sin(el), sx: -dx * len, sy: -dy * len };
}

/** Wind as a screen-space unit vector the air moves towards, plus strength in m/s. */
export interface Wind { x: number; y: number; speed: number }
export function windOf(fromDeg: number, speed: number): Wind {
  const a = (fromDeg * Math.PI) / 180;
  return { x: -Math.sin(a), y: Math.cos(a), speed };
}

let dustTex: HTMLCanvasElement | null = null;
function dustTexture() {
  if (dustTex) return dustTex;
  const N = 256;
  dustTex = document.createElement('canvas');
  dustTex.width = dustTex.height = N;
  const x = dustTex.getContext('2d')!;
  const img = x.createImageData(N, N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    // Tileable: cross-fade the noise with copies shifted by one tile.
    const u = i / N, v = j / N;
    const f = (a: number, b: number) => fbm(a * 4, b * 4, 811, 1.4, 4);
    const n = f(u, v) * (1 - u) * (1 - v) + f(u - 1, v) * u * (1 - v) + f(u, v - 1) * (1 - u) * v + f(u - 1, v - 1) * u * v;
    const o = (j * N + i) * 4;
    img.data[o] = img.data[o + 1] = img.data[o + 2] = 255;
    img.data[o + 3] = Math.max(0, Math.min(255, (n - 0.35) * 2.2 * 255));
  }
  x.putImageData(img, 0, 0);
  return dustTex;
}

const tinted = new Map<string, HTMLCanvasElement>();
function tintedDust(color: string) {
  let c = tinted.get(color);
  if (c) return c;
  const mask = dustTexture();
  c = document.createElement('canvas');
  c.width = mask.width; c.height = mask.height;
  const x = c.getContext('2d')!;
  x.drawImage(mask, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = color;
  x.fillRect(0, 0, c.width, c.height);
  tinted.set(color, c);
  return c;
}

/**
 * Colour grading for time of day and weather, applied over a finished scene.
 * Light sources (fires, headlights) are drawn after this so they are not darkened.
 */
export function grade(ctx: CanvasRenderingContext2D, view: View, light: LightPreset, weather: WeatherPreset, time: number, wind: Wind) {
  const { w, h } = view;
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = light.ambient;
  ctx.fillRect(0, 0, w, h);
  if (light.saturation < 1) {
    ctx.globalCompositeOperation = 'saturation';
    ctx.globalAlpha = 1 - light.saturation;
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, w, h);
  }
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = light.tintAlpha;
  ctx.fillStyle = light.tint;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
  if (weather.veilAlpha > 0) {
    const [r, g, b] = rgb(weather.veil);
    const lum = light.id === 'night' ? 0.3 : 1; // a dust veil at night is dark, not glowing
    ctx.globalAlpha = weather.veilAlpha;
    ctx.fillStyle = `rgb(${(r * lum) | 0},${(g * lum) | 0},${(b * lum) | 0})`;
    ctx.fillRect(0, 0, w, h);
  }
  if (weather.sheets > 0) {
    // Drifting dust sheets in world space: texture tiles scrolling with the wind.
    const lum = light.id === 'night' ? 0.3 : 1;
    const [r, g, b] = rgb(weather.veil);
    const tex = tintedDust(`rgb(${(r * lum) | 0},${(g * lum) | 0},${(b * lum) | 0})`);
    const pat = ctx.createPattern(tex, 'repeat')!;
    const tile = 140; // metres per texture tile
    const k = (tile * view.zoom) / tex.width;
    const ox = -view.x0 * view.zoom + wind.x * wind.speed * time * view.zoom * 2;
    const oy = -view.y0 * view.zoom + wind.y * wind.speed * time * view.zoom * 2;
    pat.setTransform(new DOMMatrix([k, 0, 0, k, ox, oy]));
    ctx.globalAlpha = weather.sheets;
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}
