/**
 * The one generic vector sprite renderer. Reads SpriteDef data only; no per-vehicle code.
 * The caller sets the canvas transform to the hull-local frame (origin = hull centre, +x forward, 1 unit = 1 m)
 * and passes the screen rotation in `heading` so the fake light stays fixed at the screen's upper left.
 */
import type { Layer, Lod } from '../../data/sprites/types';
import { LOD_PX_PER_M } from '../../data/sprites/types';
import { CAMO_SCHEMES, color } from '../../data/sprites/palette';
import { FONTS } from '../../ui/theme/tokens';
import { type CompiledSprite, type CPart, type Pose, applyGroup, partBox, partPath } from './compile';
import { type Box, emptyBox } from './geometry';
import { camoTex, scorchTex } from './camo';

export interface RenderState extends Pose {
  /** Screen rotation of the hull (radians); used for lighting only. */
  heading: number;
  trackR: number; // track phase, metres
  trackL: number;
  damage: 0 | 1 | 2;
  scheme?: string;
  seed: number;
  num: string; // tactical number
  /** Screen pixels per metre (drives LOD and minimum line widths). */
  ppm: number;
  lod?: Lod;
  layers?: Partial<Record<Layer, boolean>>;
  /** Flat fill colour for silhouette mode. */
  silhouette?: string | null;
  lighting?: boolean;
}

export function lodFor(ppm: number): Lod {
  return ppm >= LOD_PX_PER_M[3] ? 3 : ppm >= LOD_PX_PER_M[2] ? 2 : ppm >= LOD_PX_PER_M[1] ? 1 : 0;
}

const HI = 'rgba(255,248,228,0.24)';
const LO = 'rgba(12,10,6,0.30)';

function mix(css: string, to: [number, number, number], k: number) {
  const m = css.match(/^#([0-9a-f]{6})$/i);
  if (!m) return css;
  const n = parseInt(m[1], 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v, i) => Math.round(v + (to[i] - v) * k));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

const groupBoxCache = new WeakMap<CompiledSprite, Map<string, Box>>();
/** Bounds of all camo-receiving parts in one group (texture extent). */
function groupBox(cs: CompiledSprite, group: string): Box {
  let m = groupBoxCache.get(cs);
  if (!m) { m = new Map(); groupBoxCache.set(cs, m); }
  let b = m.get(group);
  if (!b) {
    b = emptyBox();
    for (const p of cs.parts) if (p.group === group) { const pb = partBox(p); b.x0 = Math.min(b.x0, pb.x0); b.y0 = Math.min(b.y0, pb.y0); b.x1 = Math.max(b.x1, pb.x1); b.y1 = Math.max(b.y1, pb.y1); }
    b = { x0: b.x0 - 0.5, y0: b.y0 - 0.5, x1: b.x1 + 0.5, y1: b.y1 + 0.5 };
    m.set(group, b);
  }
  return b;
}

/** Inner edge band: inside `path`, outside `path` shifted by (dx, dy). */
function edgeBand(ctx: CanvasRenderingContext2D, path: Path2D, b: Box, dx: number, dy: number, style: string) {
  const band = new Path2D();
  const m = 1;
  band.rect(b.x0 - m, b.y0 - m, b.x1 - b.x0 + 2 * m, b.y1 - b.y0 + 2 * m);
  band.addPath(path, new DOMMatrix([1, 0, 0, 1, dx, dy]));
  ctx.fillStyle = style;
  ctx.fill(band, 'evenodd');
}

function shadePart(ctx: CanvasRenderingContext2D, cp: CPart, path: Path2D, b: Box, rot: number, ppm: number) {
  const shade = cp.def.shade ?? 'flat';
  if (shade === 'flat') return;
  // Light travels toward the screen's lower right; express that in the part's local frame.
  const a = -rot, s = Math.SQRT1_2;
  const vx = (Math.cos(a) - Math.sin(a)) * s, vy = (Math.sin(a) + Math.cos(a)) * s;
  const size = Math.min(b.x1 - b.x0, b.y1 - b.y0);
  const w = Math.min(Math.max(0.05, 1.2 / ppm), size * 0.22);
  ctx.save();
  ctx.clip(path);
  if (shade === 'dome') {
    const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2, r = Math.max(b.x1 - b.x0, b.y1 - b.y0) / 2;
    const g = ctx.createRadialGradient(cx - vx * r * 0.4, cy - vy * r * 0.4, r * 0.05, cx, cy, r * 1.05);
    g.addColorStop(0, 'rgba(255,248,228,0.26)'); g.addColorStop(0.45, 'rgba(255,248,228,0.04)'); g.addColorStop(1, 'rgba(12,10,6,0.28)');
    ctx.fillStyle = g; ctx.fill(path);
  } else if (shade === 'cylinder') {
    const alongX = b.x1 - b.x0 >= b.y1 - b.y0;
    const [nx, ny] = alongX ? [0, 1] : [1, 0];
    const lit = -(vx * nx + vy * ny) >= 0 ? 1 : -1; // +1: the +n side faces the light
    const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2, h = alongX ? (b.y1 - b.y0) / 2 : (b.x1 - b.x0) / 2;
    const g = ctx.createLinearGradient(cx - nx * h * lit, cy - ny * h * lit, cx + nx * h * lit, cy + ny * h * lit);
    g.addColorStop(0, 'rgba(12,10,6,0.38)'); g.addColorStop(0.55, 'rgba(255,248,228,0.0)'); g.addColorStop(0.78, 'rgba(255,248,228,0.22)'); g.addColorStop(1, 'rgba(12,10,6,0.18)');
    ctx.fillStyle = g; ctx.fill(path);
  }
  if (shade === 'plate' || shade === 'dome') {
    edgeBand(ctx, path, b, vx * w, vy * w, HI);
    edgeBand(ctx, path, b, -vx * w, -vy * w, LO);
  } else if (shade === 'recess') {
    edgeBand(ctx, path, b, vx * w, vy * w, LO);
    edgeBand(ctx, path, b, -vx * w, -vy * w, HI);
  }
  ctx.restore();
}

export function drawSprite(ctx: CanvasRenderingContext2D, cs: CompiledSprite, st: RenderState) {
  const def = cs.def;
  const lod = st.lod ?? lodFor(st.ppm);
  const schemeId = st.scheme && CAMO_SCHEMES[st.scheme] ? st.scheme : def.paint.schemes[0];
  const scheme = CAMO_SCHEMES[schemeId];
  const base = scheme?.base ?? 'IQ_SAND';
  const sil = st.silhouette;
  const lighting = st.lighting !== false && !sil;
  const minLine = 0.6 / st.ppm;
  const dead = st.damage === 2;
  const showDamage = st.layers?.damage !== false;
  const clipCache = new Map<string, Path2D>();

  for (const cp of cs.parts) {
    const p = cp.def;
    if (st.layers && st.layers[p.layer] === false) continue;
    if ((p.lod ?? 0) > lod) continue;
    if (p.lostAt && st.damage >= p.lostAt && showDamage) continue;
    if (sil && (p.layer === 'markings' || p.layer === 'damage' || p.fill === null)) continue;

    ctx.save();
    applyGroup(ctx, def, cp.group, st);
    const gdef = def.groups[cp.group];
    let rot = st.heading;
    for (let g = gdef, name = cp.group; g && name !== 'hull'; name = g.parent ?? 'hull', g = def.groups[name]) {
      rot += g.rotate === 'turret' ? st.turret : g.rotate === 'rotor' ? st.rotor : 0;
    }
    const path = partPath(cp, st.trackR, st.trackL);
    if (p.clip) {
      const cpClip = cs.byId.get(p.clip);
      if (cpClip) {
        let cl = clipCache.get(p.clip);
        if (!cl) { cl = partPath(cpClip, st.trackR, st.trackL); clipCache.set(p.clip, cl); }
        ctx.clip(cl);
      }
    }

    if (p.text) {
      if (!sil) drawText(ctx, cp, st);
      ctx.restore();
      continue;
    }

    if (sil) {
      ctx.fillStyle = sil;
      if (p.fill !== null) ctx.fill(path);
      ctx.restore();
      continue;
    }

    if (p.ao && lighting) {
      ctx.strokeStyle = 'rgba(10,8,5,0.16)';
      ctx.lineJoin = 'round';
      ctx.lineWidth = p.ao * 2; ctx.stroke(path);
      ctx.lineWidth = p.ao; ctx.stroke(path);
    }

    const fillRef = p.fill === undefined ? 'BASE' : p.fill;
    if (fillRef !== null) {
      let fc = color(fillRef, base);
      if (dead && showDamage) fc = mix(fc, [40, 35, 30], 0.5);
      ctx.fillStyle = fc;
      ctx.fill(path);
      const b = partBox(cp, st.trackR, st.trackL);
      const camo = p.camo ?? fillRef === 'BASE';
      if (camo && lod >= 1) {
        const tex = camoTex(def.id, schemeId, st.seed, cp.group, groupBox(cs, cp.group));
        if (tex) {
          ctx.save(); ctx.clip(path);
          if (dead && showDamage) ctx.globalAlpha = 0.5;
          ctx.drawImage(tex.canvas, tex.box.x0, tex.box.y0, tex.box.x1 - tex.box.x0, tex.box.y1 - tex.box.y0);
          ctx.restore();
        }
      }
      if (st.damage && showDamage && camo && lod >= 1) {
        const tex = scorchTex(def.id, st.seed, st.damage as 1 | 2, cp.group, groupBox(cs, cp.group));
        ctx.save(); ctx.clip(path);
        ctx.drawImage(tex.canvas, tex.box.x0, tex.box.y0, tex.box.x1 - tex.box.x0, tex.box.y1 - tex.box.y0);
        ctx.restore();
      }
      if (lighting && lod >= 1) shadePart(ctx, cp, path, b, rot, st.ppm);
    }
    const strokeRef = p.stroke === undefined ? (fillRef === null ? 'LINE' : 'EDGE') : p.stroke;
    if (strokeRef !== null) {
      ctx.strokeStyle = color(strokeRef, base);
      ctx.lineWidth = Math.max(p.strokeW ?? 0.03, minLine);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.stroke(path);
    }
    ctx.restore();
  }
}

function drawText(ctx: CanvasRenderingContext2D, cp: CPart, st: RenderState) {
  const t = cp.def.text!;
  const b = partBox(cp);
  const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
  ctx.translate(cx, cy);
  if (t.rot) ctx.rotate((t.rot * Math.PI) / 180);
  const k = t.size / 100;
  ctx.scale(k, k);
  ctx.font = `100px ${FONTS.stencil}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = color(cp.def.fill ?? 'STENCIL', '');
  ctx.globalAlpha = st.damage === 2 ? 0.35 : 0.9;
  ctx.fillText(t.str.replace('{num}', st.num), 0, 0);
}
