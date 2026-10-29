import type { GroundMaterial, LightPreset, MicroDetail } from '../../data/environment/types';
import { clamp01, css, fbm, hash3, lodAlpha, mixRgb, noise, rgb, smoothstep, type RGB } from './noise';
import { sunOf, type View, type Wind } from './light';

/** Relief is exaggerated so a 1 m swell still reads from above (top-down "fake" relief). */
const RELIEF_GAIN = 4;

/**
 * Paints one ground material: multi-scale noise blending between surfaces, large colour drift, height-map
 * relief shading, and world-stable micro detail. Works on any world rectangle, so the same code can fill
 * cached terrain chunks later.
 */
export class GroundPainter {
  constructor(readonly mat: GroundMaterial, readonly seed: number) {}

  /** Coverage (0..1) of each surface at a world point; index 0 is the base and always 1. */
  weights(wx: number, wy: number, pixel = 0): number[] {
    const { mat, seed } = this;
    const [ux, uy] = this.warp(wx, wy, pixel);
    return mat.surfaces.map((s, i) => (i === 0 ? 1 : this.cover(s, i, ux, uy, pixel, seed)));
  }

  private warp(wx: number, wy: number, pixel: number): [number, number] {
    const { scale, amount } = this.mat.warp;
    return [wx + (fbm(wx, wy, this.seed + 1, scale, 3, pixel) - 0.5) * 2 * amount, wy + (fbm(wx, wy, this.seed + 2, scale, 3, pixel) - 0.5) * 2 * amount];
  }

  private cover(s: GroundMaterial['surfaces'][number], i: number, ux: number, uy: number, pixel: number, seed: number) {
    const n = fbm(ux, uy, seed + 10 + i * 7, s.scale ?? 50, 4, pixel);
    const t = s.threshold ?? 0.5, k = s.softness ?? 0.1;
    return smoothstep(t - k, t + k, n) * (s.strength ?? 1);
  }

  /** Fills the view with ground colour and relief shading. */
  paint(ctx: CanvasRenderingContext2D, view: View, light: LightPreset) {
    const { w, h, zoom } = view;
    const { mat, seed } = this;
    const pixel = 1 / zoom;
    const img = ctx.createImageData(w, h);
    const d = img.data;
    const hgt = new Float32Array(w * h);
    const cols = new Float32Array(w * h * 3);
    const surf = mat.surfaces.map((s) => ({ s, a: rgb(s.color[0]), b: rgb(s.color[1]) }));
    const drift = mat.drift.map((dr) => ({ ...dr, c: rgb(dr.color) }));
    // Grain sizes (m): coarse sand clumps and fine grain; each fades when smaller than a pixel.
    const grainMid = clamp01(1.2 / pixel - 1), grainFine = clamp01(0.3 / pixel - 0.6);

    for (let py = 0; py < h; py++) {
      const wy = view.y0 + (py + 0.5) * pixel;
      for (let px = 0; px < w; px++) {
        const wx = view.x0 + (px + 0.5) * pixel;
        const [ux, uy] = this.warp(wx, wy, pixel);
        const v0 = fbm(ux, uy, seed + 3, 22, 3, pixel);
        let c: RGB = mixRgb(surf[0].a, surf[0].b, v0);
        // Relief uses unwarped coordinates so slopes stay broad and calm rather than marbled.
        let z = (fbm(wx, wy, seed + 4, mat.relief.scale, 4, pixel) - 0.5) * 2 * mat.relief.amplitude;
        let grain = surf[0].s.grain;
        for (let i = 1; i < surf.length; i++) {
          const { s, a, b } = surf[i];
          const wgt = this.cover(s, i, ux, uy, pixel, seed);
          if (wgt <= 0.001) continue;
          c = mixRgb(c, mixRgb(a, b, noise(ux / 9, uy / 9, seed + 40 + i)), wgt);
          z += wgt * (s.height ?? 0);
          grain += (s.grain - grain) * wgt;
        }
        for (const dr of drift) {
          const t = clamp01((fbm(wx, wy, seed + 30 + dr.scale, dr.scale, 2, pixel) - 0.5) * 2.6) * dr.strength;
          if (t > 0) c = mixRgb(c, dr.c, t);
        }
        // Mid-scale mottling (a few metres) so medium zoom never looks airbrushed.
        const mott = (fbm(wx, wy, seed + 52, 7, 2, pixel) - 0.5) * 16;
        const g = mott + ((noise(wx / 1.2, wy / 1.2, seed + 50) - 0.5) * grainMid * 18 + (noise(wx / 0.3, wy / 0.3, seed + 51) - 0.5) * grainFine * 34) * grain;
        const i = py * w + px;
        hgt[i] = z;
        cols[i * 3] = c[0] + g; cols[i * 3 + 1] = c[1] + g; cols[i * 3 + 2] = c[2] + g;
      }
    }

    // Relief shading from the height map: Lambert against the sun, normalised to flat ground.
    const sun = sunOf(light);
    // Horizontal light direction; low sun raises relief contrast but is clamped so dawn never looks marbled.
    const hl = Math.hypot(sun.lx, sun.ly) || 1;
    const hx = sun.lx / hl, hy = sun.ly / hl;
    const gain = 0.45 + (1 - sun.lz) * 0.35;
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const i = py * w + px;
        const xl = hgt[px > 0 ? i - 1 : i], xr = hgt[px < w - 1 ? i + 1 : i];
        const yu = hgt[py > 0 ? i - w : i], yd = hgt[py < h - 1 ? i + w : i];
        const dx = ((xr - xl) / (2 * pixel)) * RELIEF_GAIN, dy = ((yd - yu) / (2 * pixel)) * RELIEF_GAIN;
        // Slope facing the light brightens, facing away darkens (tanh keeps steep berms from clipping).
        const k = 1 + Math.tanh(-(dx * hx + dy * hy) * 1.5) * gain * 0.4;
        const o = i * 4;
        d[o] = cols[i * 3] * k; d[o + 1] = cols[i * 3 + 1] * k; d[o + 2] = cols[i * 3 + 2] * k; d[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  /**
   * Micro detail (pebbles, scrub, grass, ripples). Items live on a 10 m world grid with hashed positions, so
   * they never swim when the camera moves or zooms. Returns the number of items drawn.
   */
  drawMicro(ctx: CanvasRenderingContext2D, view: View, light: LightPreset, time: number, wind: Wind, shadowMul = 1): number {
    const CELL = 10;
    const { zoom } = view;
    const sun = sunOf(light);
    const x1 = view.x0 + view.w / zoom, y1 = view.y0 + view.h / zoom;
    const cx0 = Math.floor(view.x0 / CELL) - 1, cy0 = Math.floor(view.y0 / CELL) - 1;
    const cx1 = Math.floor(x1 / CELL) + 1, cy1 = Math.floor(y1 / CELL) + 1;
    const surfIdx = new Map(this.mat.surfaces.map((s, i) => [s.id, i]));
    let drawn = 0;
    this.mat.micro.forEach((m, mi) => {
      const alpha = lodAlpha(m.lod, zoom);
      if (alpha <= 0.01) return;
      const host = m.on !== undefined ? surfIdx.get(m.on) : undefined;
      const per = (m.density * CELL * CELL) / 100;
      ctx.save();
      ctx.globalAlpha = alpha;
      for (let cy = cy0; cy <= cy1; cy++) {
        for (let cx = cx0; cx <= cx1; cx++) {
          const n = Math.floor(per) + (hash3(cx, cy, 999 + mi, this.seed) < per % 1 ? 1 : 0);
          for (let k = 0; k < n; k++) {
            const r1 = hash3(cx, cy, k * 5 + mi * 1000, this.seed), r2 = hash3(cx, cy, k * 5 + 1 + mi * 1000, this.seed);
            const wx = (cx + r1) * CELL, wy = (cy + r2) * CELL;
            if (wx < view.x0 - 4 || wy < view.y0 - 4 || wx > x1 + 4 || wy > y1 + 4) continue;
            const r3 = hash3(cx, cy, k * 5 + 2 + mi * 1000, this.seed), r4 = hash3(cx, cy, k * 5 + 3 + mi * 1000, this.seed);
            if (host !== undefined && r3 > this.weights(wx, wy)[host]) continue;
            const sx = (wx - view.x0) * zoom, sy = (wy - view.y0) * zoom;
            this.item(ctx, m, sx, sy, zoom, r3, r4, sun, time, wind, shadowMul);
            drawn++;
          }
        }
      }
      ctx.restore();
    });
    return drawn;
  }

  private item(ctx: CanvasRenderingContext2D, m: MicroDetail, sx: number, sy: number, zoom: number, r3: number, r4: number, sun: ReturnType<typeof sunOf>, time: number, wind: Wind, shadowMul: number) {
    const size = (m.size[0] + (m.size[1] - m.size[0]) * r4) * zoom;
    const col = m.colors[Math.floor(r3 * 977) % m.colors.length];
    const hgt = (m.height ?? 0) * zoom;
    const shA = 0.3 * shadowMul;
    const sway = (m.sway ?? 0) * Math.sin(time * 2.1 + r3 * 40) * (0.4 + wind.speed * 0.08);
    switch (m.kind) {
      case 'dots': {
        const r = Math.max(0.5, size * 0.5);
        if (hgt > 0) { ctx.fillStyle = `rgba(40,30,20,${shA})`; ctx.beginPath(); ctx.ellipse(sx + sun.sx * hgt * 0.6, sy + sun.sy * hgt * 0.6, r, r * 0.8, 0, 0, 6.283); ctx.fill(); }
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.ellipse(sx, sy, r, r * (0.6 + r4 * 0.4), r3 * 6.28, 0, 6.283); ctx.fill();
        break;
      }
      case 'tufts': {
        // A low clump: soft shadow, dark core, then short radiating twigs lit towards the sun.
        const r = Math.max(1, size * 0.5);
        ctx.fillStyle = `rgba(45,38,22,${shA * 1.3})`;
        ctx.beginPath(); ctx.ellipse(sx + sun.sx * hgt * 0.7, sy + sun.sy * hgt * 0.7, r * 1.05, r * 0.9, 0, 0, 6.283); ctx.fill();
        const base = rgb(col);
        ctx.fillStyle = css(mixRgb(base, [40, 40, 25], 0.35));
        ctx.beginPath(); ctx.arc(sx, sy, r * 0.8, 0, 6.283); ctx.fill();
        if (zoom >= 2.2) {
          const n = 7 + Math.floor(r4 * 5);
          ctx.lineCap = 'round';
          ctx.lineWidth = Math.max(0.7, zoom * 0.07);
          for (let i = 0; i < n; i++) {
            const a = (i / n) * 6.283 + r3 * 3;
            const lit = 0.5 + 0.5 * (Math.cos(a) * sun.lx + Math.sin(a) * sun.ly);
            ctx.strokeStyle = css(mixRgb(base, [235, 228, 190], lit * 0.3));
            const len = r * (0.7 + ((i * 37) % 7) / 14);
            ctx.beginPath();
            ctx.moveTo(sx + Math.cos(a) * r * 0.2, sy + Math.sin(a) * r * 0.2);
            ctx.lineTo(sx + Math.cos(a) * len + wind.x * sway * r * 0.3, sy + Math.sin(a) * len + wind.y * sway * r * 0.3);
            ctx.stroke();
          }
        } else {
          ctx.fillStyle = col;
          ctx.beginPath(); ctx.arc(sx - sun.sx * r * 0.08, sy - sun.sy * r * 0.08, r * 0.6, 0, 6.283); ctx.fill();
        }
        break;
      }
      case 'blades': {
        ctx.strokeStyle = col;
        ctx.lineWidth = Math.max(0.6, zoom * 0.04);
        ctx.lineCap = 'round';
        ctx.beginPath();
        const n = 3 + Math.floor(r4 * 4);
        for (let i = 0; i < n; i++) {
          const a = -1.57 + (((i * 53 + r3 * 100) % 100) / 100 - 0.5) * 2.4;
          const len = size * (0.6 + ((i * 29) % 10) / 20);
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + Math.cos(a) * len + wind.x * sway * len * 0.4, sy + Math.sin(a) * len * 0.5 + wind.y * sway * len * 0.4);
        }
        ctx.stroke();
        break;
      }
      case 'ripples': {
        // Parallel crests perpendicular to the wind: lit flank on the sun side, shaded flank opposite.
        const px = -wind.y, py = wind.x; // crest direction
        const lit = wind.x * sun.lx + wind.y * sun.ly; // does the windward flank face the sun?
        const n = 3 + Math.floor(r4 * 3), gap = 0.55 * zoom;
        ctx.lineWidth = Math.max(0.6, zoom * 0.06);
        ctx.lineCap = 'round';
        for (let i = 0; i < n; i++) {
          const ox = sx + wind.x * gap * (i - n / 2), oy = sy + wind.y * gap * (i - n / 2);
          const len = size * (0.7 + ((i * 13) % 5) / 10);
          const bend = Math.sin(r3 * 9 + i) * size * 0.08;
          for (const side of [-1, 1]) {
            const shade = side * lit;
            ctx.strokeStyle = shade > 0 ? 'rgba(250,236,200,0.45)' : 'rgba(110,88,55,0.42)';
            const off = side * zoom * 0.07;
            ctx.beginPath();
            ctx.moveTo(ox - px * len * 0.5 + wind.x * off, oy - py * len * 0.5 + wind.y * off);
            ctx.quadraticCurveTo(ox + wind.x * (bend + off), oy + wind.y * (bend + off), ox + px * len * 0.5 + wind.x * off, oy + py * len * 0.5 + wind.y * off);
            ctx.stroke();
          }
        }
        break;
      }
      case 'cracks':
        break; // salt crust and dry mud use this; implemented with those materials
    }
  }
}
