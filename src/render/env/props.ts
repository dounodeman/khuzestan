import type { ColorRange, DestructionStateId, LightPreset, PropDef, PropLayer, Range } from '../../data/environment/types';
import { css, hash2, lodAlpha, mixRgb, rgb, type RGB } from './noise';
import { sunOf, type Sun, type View, type Wind } from './light';

const SOOT: RGB = [34, 29, 24];

/** One placed prop. Everything random about it derives from `seed`, so it redraws identically. */
export interface PropInstance {
  def: PropDef;
  x: number; y: number;
  rot: number;
  scale: number;
  /** 1 = healthy/fresh, 0 = dry/worn. */
  health: number;
  /** Lean of the top, in metres per metre of height, as a vector. */
  leanX: number; leanY: number;
  state: DestructionStateId;
  seed: number;
}

export function makeProp(def: PropDef, x: number, y: number, seed: number, state: DestructionStateId = 'intact'): PropInstance {
  const r = (k: number) => hash2(seed, k, 7331);
  const v = def.variation;
  const lean = (v.lean ?? 0) * r(4), la = r(5) * 6.283;
  return {
    def, x, y, seed, state,
    rot: r(1) * 6.283,
    scale: v.scale[0] + (v.scale[1] - v.scale[0]) * r(2),
    health: v.health[0] + (v.health[1] - v.health[0]) * r(3),
    leanX: Math.cos(la) * lean, leanY: Math.sin(la) * lean,
  };
}

interface Ctx2 {
  ctx: CanvasRenderingContext2D;
  view: View;
  sun: Sun;
  time: number;
  wind: Wind;
  shadow: boolean;
}

const pick = (r: number | Range, t: number) => (typeof r === 'number' ? r : r[0] + (r[1] - r[0]) * t);

/**
 * Generic prop renderer. Two passes per frame: shadows (all props into one mask, composited once so overlaps
 * do not double-darken), then the props themselves sorted by y.
 */
export class PropRenderer {
  private shadowCanvas = document.createElement('canvas');

  drawShadows(ctx: CanvasRenderingContext2D, view: View, props: PropInstance[], light: LightPreset, time: number, wind: Wind, shadowMul = 1) {
    const sc = this.shadowCanvas;
    if (sc.width !== view.w || sc.height !== view.h) { sc.width = view.w; sc.height = view.h; }
    const sx = sc.getContext('2d')!;
    sx.setTransform(1, 0, 0, 1, 0, 0);
    sx.clearRect(0, 0, sc.width, sc.height);
    const c: Ctx2 = { ctx: sx, view, sun: sunOf(light), time, wind, shadow: true };
    sx.fillStyle = '#000';
    sx.strokeStyle = '#000';
    for (const p of props) if (this.visible(p, view)) this.drawOne(c, p);
    // Tint the mask with the shadow colour and composite once.
    sx.globalCompositeOperation = 'source-in';
    sx.fillStyle = light.shadow.color;
    sx.fillRect(0, 0, sc.width, sc.height);
    sx.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.globalAlpha = light.shadow.alpha * shadowMul;
    ctx.drawImage(sc, 0, 0);
    ctx.restore();
  }

  /** Draws props; returns how many were drawn (for the dev overlay). */
  draw(ctx: CanvasRenderingContext2D, view: View, props: PropInstance[], light: LightPreset, time: number, wind: Wind): number {
    const c: Ctx2 = { ctx, view, sun: sunOf(light), time, wind, shadow: false };
    const list = props.filter((p) => this.visible(p, view)).sort((a, b) => a.y - b.y);
    for (const p of list) this.drawOne(c, p);
    return list.length;
  }

  private visible(p: PropInstance, view: View) {
    const m = p.def.height * 5 + 10; // shadows can reach far at dawn and dusk
    return p.x > view.x0 - m && p.y > view.y0 - m && p.x < view.x0 + view.w / view.zoom + m && p.y < view.y0 + view.h / view.zoom + m && lodAlpha(p.def.lod, view.zoom) > 0;
  }

  private drawOne(c: Ctx2, p: PropInstance) {
    const st = p.def.states[p.state] ?? p.def.states.intact;
    st.layers.forEach((layer, li) => {
      if (c.shadow ? layer.noShadow : layer.shadowOnly) return;
      const a = lodAlpha(layer.lod, c.view.zoom) * (layer.alpha ?? 1);
      if (a <= 0.01) return;
      c.ctx.globalAlpha = c.shadow ? Math.min(1, a * 1.5) : a;
      this.layer(c, p, layer, li, st.char ?? 0);
    });
    c.ctx.globalAlpha = 1;
  }

  /** Screen position of a local point at height z (metres), including lean, sway and shadow projection. */
  private place(c: Ctx2, p: PropInstance, lx: number, ly: number, z: number, sway: number): [number, number] {
    const cs = Math.cos(p.rot), sn = Math.sin(p.rot);
    let wx = p.x + (lx * cs - ly * sn) * p.scale, wy = p.y + (lx * sn + ly * cs) * p.scale;
    wx += p.leanX * z; wy += p.leanY * z;
    if (sway) {
      const s = Math.sin(c.time * 1.3 + p.seed * 0.37) * 0.5 + Math.sin(c.time * 3.1 + p.seed) * 0.15;
      const amt = sway * z * 0.012 * (0.5 + c.wind.speed * 0.12) * (1 + s);
      wx += c.wind.x * amt; wy += c.wind.y * amt;
    }
    if (c.shadow) { wx += c.sun.sx * z; wy += c.sun.sy * z; }
    return [(wx - c.view.x0) * c.view.zoom, (wy - c.view.y0) * c.view.zoom];
  }

  private color(fill: string | ColorRange, p: PropInstance, char: number, jitter = 0): RGB {
    let col = typeof fill === 'string' ? rgb(fill) : mixRgb(rgb(fill[0]), rgb(fill[1]), Math.min(1, Math.max(0, 1 - p.health + jitter)));
    if (char > 0) col = mixRgb(col, SOOT, char);
    return col;
  }

  private layer(c: Ctx2, p: PropInstance, L: PropLayer, li: number, char: number) {
    const { ctx, view } = c;
    const H = p.def.height * p.scale;
    const z = L.zH !== undefined ? L.zH * H : (L.z ?? 0);
    const ax = (L.at?.[0] ?? 0) + (L.atH?.[0] ?? 0) * p.def.height, ay = (L.at?.[1] ?? 0) + (L.atH?.[1] ?? 0) * p.def.height;
    const sway = L.sway ?? 0;
    const k = view.zoom * p.scale;
    const rnd = (i: number) => hash2(p.seed * 13 + li, i, 4243);
    const lit = (dirX: number, dirY: number) => 1 + 0.14 * (dirX * c.sun.lx + dirY * c.sun.ly) / Math.max(0.2, Math.hypot(c.sun.lx, c.sun.ly));
    const fillCol = (col: RGB, b = 1) => (c.shadow ? '#000' : css([col[0] * b, col[1] * b, col[2] * b]));

    switch (L.shape) {
      case 'disc': {
        const [x, y] = this.place(c, p, ax, ay, z, sway);
        const r = pick(L.r, rnd(1)) * k;
        ctx.fillStyle = fillCol(this.color(L.fill, p, char));
        ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.6, r * (L.rx ?? 1)), Math.max(0.6, r * (L.ry ?? 1)), p.rot, 0, 6.283); ctx.fill();
        if (L.stroke && !c.shadow) { ctx.strokeStyle = L.stroke; ctx.lineWidth = Math.max(0.5, view.zoom * 0.08); ctx.stroke(); }
        break;
      }
      case 'rect': {
        const [x, y] = this.place(c, p, ax, ay, z, sway);
        ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot + (L.rot ?? 0));
        ctx.fillStyle = fillCol(this.color(L.fill, p, char));
        ctx.fillRect((-L.w / 2) * k, (-L.h / 2) * k, L.w * k, L.h * k);
        if (L.stroke && !c.shadow) { ctx.strokeStyle = L.stroke; ctx.lineWidth = Math.max(0.5, view.zoom * 0.08); ctx.strokeRect((-L.w / 2) * k, (-L.h / 2) * k, L.w * k, L.h * k); }
        ctx.restore();
        break;
      }
      case 'poly': {
        ctx.fillStyle = fillCol(this.color(L.fill, p, char));
        ctx.beginPath();
        L.pts.forEach(([px, py], i) => { const [x, y] = this.place(c, p, ax + px, ay + py, z, sway); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
        ctx.closePath(); ctx.fill();
        if (L.stroke && !c.shadow) { ctx.strokeStyle = L.stroke; ctx.stroke(); }
        break;
      }
      case 'stem': {
        // Tapered stroke from base to top; top-down it is mostly hidden, its shadow is what reads.
        const [x0, y0] = this.place(c, p, ax, ay, L.z0 * H, 0);
        const [x1, y1] = this.place(c, p, ax, ay, L.z1 * H * 0.97, sway);
        ctx.strokeStyle = fillCol(this.color(L.fill, p, char));
        ctx.lineCap = 'round';
        ctx.lineWidth = Math.max(0.8, L.width * k);
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        break;
      }
      case 'log': {
        const len = L.length + (L.lengthH ?? 0) * p.def.height;
        const [x0, y0] = this.place(c, p, ax, ay, z, 0);
        const [x1, y1] = this.place(c, p, ax + len, ay, z, 0);
        const col = this.color(L.fill, p, char);
        ctx.lineCap = 'round';
        ctx.strokeStyle = fillCol(col, 0.7);
        ctx.lineWidth = Math.max(1, L.width * k);
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        if (!c.shadow) {
          // Lit upper half of the round trunk.
          const nx = -(y1 - y0), ny = x1 - x0, nl = Math.hypot(nx, ny) || 1;
          const side = (nx * c.sun.lx + ny * c.sun.ly) > 0 ? 1 : -1;
          const off = L.width * k * 0.18 * side;
          ctx.strokeStyle = fillCol(col, 1.1);
          ctx.lineWidth = Math.max(0.6, L.width * k * 0.5);
          ctx.beginPath(); ctx.moveTo(x0 + (nx / nl) * off, y0 + (ny / nl) * off); ctx.lineTo(x1 + (nx / nl) * off, y1 + (ny / nl) * off); ctx.stroke();
          if (L.ring && view.zoom > 2) {
            // Leaf-scar rings across the trunk.
            ctx.strokeStyle = L.ring; ctx.lineWidth = Math.max(0.5, view.zoom * 0.05);
            const n = Math.floor(len / 0.6);
            ctx.beginPath();
            for (let i = 1; i < n; i++) {
              const t = i / n, mx = x0 + (x1 - x0) * t, my = y0 + (y1 - y0) * t, hw = L.width * k * 0.45;
              ctx.moveTo(mx - (nx / nl) * hw, my - (ny / nl) * hw); ctx.lineTo(mx + (nx / nl) * hw, my + (ny / nl) * hw);
            }
            ctx.globalAlpha *= 0.5; ctx.stroke();
          }
        }
        break;
      }
      case 'leaves':
        this.leaves(c, p, L, li, ax, ay, z, char, rnd, lit, fillCol);
        break;
      case 'scatter': {
        const n = Math.round(pick(L.count, rnd(0)));
        for (let i = 0; i < n; i++) {
          const a = rnd(i * 4 + 1) * 6.283, d = Math.sqrt(rnd(i * 4 + 2)) * L.radius;
          const [x, y] = this.place(c, p, ax + Math.cos(a) * d, ay + Math.sin(a) * d, z, sway);
          const s = pick(L.size, rnd(i * 4 + 3)) * k;
          const col = this.color(L.fill[i % L.fill.length], p, char);
          if (L.kind === 'dot') { ctx.fillStyle = fillCol(col); ctx.beginPath(); ctx.arc(x, y, Math.max(0.5, s / 2), 0, 6.283); ctx.fill(); }
          else if (L.kind === 'chip') { ctx.fillStyle = fillCol(col); ctx.save(); ctx.translate(x, y); ctx.rotate(rnd(i * 4 + 4) * 6.283); ctx.fillRect(-s / 2, -s / 3, s, (s * 2) / 3); ctx.restore(); }
          else {
            const b = rnd(i * 4 + 4) * 6.283;
            ctx.strokeStyle = fillCol(col); ctx.lineWidth = Math.max(0.6, 0.25 * k); ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(x - (Math.cos(b) * s) / 2, y - (Math.sin(b) * s) / 2); ctx.lineTo(x + (Math.cos(b) * s) / 2, y + (Math.sin(b) * s) / 2); ctx.stroke();
          }
        }
        break;
      }
      case 'stain': {
        if (c.shadow) break;
        const [x, y] = this.place(c, p, ax, ay, 0, 0);
        const r = L.r * k;
        const col = rgb(L.fill);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, css(col, L.strength));
        g.addColorStop(0.6, css(col, L.strength * 0.5));
        g.addColorStop(1, css(col, 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
        break;
      }
    }
  }

  /** Radial leaf cluster: tapered, curling leaves; pinnate leaves get leaflets at close zoom. */
  private leaves(c: Ctx2, p: PropInstance, L: Extract<PropLayer, { shape: 'leaves' }>, li: number, ax: number, ay: number, z: number, char: number,
    rnd: (i: number) => number, lit: (x: number, y: number) => number, fillCol: (col: RGB, b?: number) => string) {
    const { ctx, view } = c;
    const k = view.zoom * p.scale;
    const n = Math.round(pick(L.count, rnd(0)));
    const keep = L.keep ?? 1;
    const [cx, cy] = this.place(c, p, ax, ay, z, L.sway ?? 0);
    const base = rnd(1) * 6.283 + p.rot;
    const sw = (L.sway ?? 0) * (0.4 + c.wind.speed * 0.1);
    const detail = view.zoom >= 2.6 && !c.shadow;
    for (let i = 0; i < n; i++) {
      if (rnd(100 + i) > keep) continue;
      const jitterA = (rnd(200 + i) - 0.5) * 0.5;
      // Leaves flutter individually: cheap per-leaf angular jitter driven by the wind.
      const flutter = sw * 0.05 * Math.sin(c.time * (2.2 + rnd(300 + i)) + i * 1.7 + p.seed);
      const a = base + (i / n) * 6.283 + jitterA + flutter;
      const broken = rnd(400 + i) < (L.broken ?? 0);
      const len = pick(L.length, rnd(500 + i)) * (1 - L.droop * 0.6) * (broken ? 0.45 : 1) * k;
      const wid = Math.max(0.7, L.width * k);
      const curl = L.curl * (rnd(600 + i) - 0.5) * 2;
      const dx = Math.cos(a), dy = Math.sin(a);
      // Leaves bend downwind a little.
      const bx = c.wind.x * sw * 0.08 * len, by = c.wind.y * sw * 0.08 * len;
      const tipX = cx + dx * len + -dy * curl * len * 0.35 + bx, tipY = cy + dy * len + dx * curl * len * 0.35 + by;
      const midX = cx + dx * len * 0.5 + -dy * curl * len * 0.25 + bx * 0.4, midY = cy + dy * len * 0.5 + dx * curl * len * 0.25 + by * 0.4;
      const col = this.color(L.fill, p, char, (rnd(700 + i) - 0.5) * 0.3 + (broken ? 0.3 : 0));
      const b = c.shadow ? 1 : lit(dx, dy);
      if (!detail || !L.pinnate) {
        // Solid tapered leaf.
        ctx.fillStyle = fillCol(col, b);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.quadraticCurveTo(midX - dy * wid, midY + dx * wid, tipX, tipY);
        ctx.quadraticCurveTo(midX + dy * wid, midY - dx * wid, cx, cy);
        ctx.fill();
      } else {
        // Pinnate frond: rib plus paired leaflets angled towards the tip.
        ctx.strokeStyle = fillCol(col, b);
        ctx.lineWidth = Math.max(0.6, view.zoom * 0.09);
        ctx.lineCap = 'round';
        ctx.beginPath();
        const m = Math.max(4, Math.floor(len / (view.zoom * 0.35)));
        for (let j = 1; j <= m; j++) {
          const t = j / (m + 1);
          // Point on the quadratic spine.
          const qx = (1 - t) * (1 - t) * cx + 2 * (1 - t) * t * midX + t * t * tipX;
          const qy = (1 - t) * (1 - t) * cy + 2 * (1 - t) * t * midY + t * t * tipY;
          const tx = 2 * (1 - t) * (midX - cx) + 2 * t * (tipX - midX), ty = 2 * (1 - t) * (midY - cy) + 2 * t * (tipY - midY);
          const tl = Math.hypot(tx, ty) || 1;
          const ux = tx / tl, uy = ty / tl;
          const ll = L.width * k * 1.0 * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (0.75 + ((j * 7) % 5) / 10);
          for (const s of [-1, 1]) {
            ctx.moveTo(qx, qy);
            ctx.lineTo(qx + (ux * 0.55 + -uy * s) * ll, qy + (uy * 0.55 + ux * s) * ll);
          }
        }
        ctx.stroke();
        if (L.rib) {
          ctx.strokeStyle = css(mixRgb(rgb(L.rib), SOOT, char), 0.85);
          ctx.lineWidth = Math.max(0.5, view.zoom * 0.06);
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.quadraticCurveTo(midX, midY, tipX, tipY); ctx.stroke();
        }
      }
    }
  }
}
