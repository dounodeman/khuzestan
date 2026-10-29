/**
 * Geometry for the vector sprite format: path commands -> absolute segments, mirroring,
 * rigid transforms, Path2D construction and flattening (for bounds, measurement and path walking).
 */
import type { PathCmd, Shape } from '../../data/sprites/types';

export type Pt = [number, number];
export type Seg =
  | { t: 'L'; p: Pt }
  | { t: 'Q'; c: Pt; p: Pt }
  | { t: 'C'; c1: Pt; c2: Pt; p: Pt }
  | { t: 'A'; c: Pt; r: number; a0: number; a1: number; ccw: boolean }; // radians
/** One subpath: start point, segments (each ends at its own end point), closed flag. */
export interface Sub { start: Pt; segs: Seg[]; closed: boolean }

const D2R = Math.PI / 180;
const arcPt = (c: Pt, r: number, a: number): Pt => [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];
const segEnd = (s: Seg): Pt => (s.t === 'A' ? arcPt(s.c, s.r, s.a1) : s.p);

export function cmdsToSubs(cmds: PathCmd[], closedDefault = true): Sub[] {
  const subs: Sub[] = [];
  let cur: Sub | null = null;
  let pen: Pt = [0, 0];
  const ensure = () => { if (!cur) { cur = { start: pen, segs: [], closed: false }; subs.push(cur); } return cur; };
  for (const c of cmds) {
    switch (c[0]) {
      case 'M': cur = { start: [c[1], c[2]], segs: [], closed: false }; subs.push(cur); pen = [c[1], c[2]]; break;
      case 'L': ensure().segs.push({ t: 'L', p: [c[1], c[2]] }); pen = [c[1], c[2]]; break;
      case 'Q': ensure().segs.push({ t: 'Q', c: [c[1], c[2]], p: [c[3], c[4]] }); pen = [c[3], c[4]]; break;
      case 'C': ensure().segs.push({ t: 'C', c1: [c[1], c[2]], c2: [c[3], c[4]], p: [c[5], c[6]] }); pen = [c[5], c[6]]; break;
      case 'A': {
        const ctr: Pt = [c[1], c[2]];
        const a0 = c[4] * D2R, a1 = c[5] * D2R;
        const s0 = arcPt(ctr, c[3], a0);
        if (!cur) { cur = { start: s0, segs: [], closed: false }; subs.push(cur); }
        else if (Math.hypot(s0[0] - pen[0], s0[1] - pen[1]) > 1e-9) cur.segs.push({ t: 'L', p: s0 });
        cur.segs.push({ t: 'A', c: ctr, r: c[3], a0, a1, ccw: !!c[6] });
        pen = arcPt(ctr, c[3], a1);
        break;
      }
      case 'Z': if (cur) { cur.closed = true; pen = cur.start; cur = null; } break;
    }
  }
  if (closedDefault) for (const s of subs) s.closed = true;
  return subs;
}

/** Ellipse as four cubic Béziers (rotation in degrees). */
function ellipseCmds(cx: number, cy: number, rx: number, ry: number, rotDeg = 0): PathCmd[] {
  const k = 0.5522847498, a = rotDeg * D2R, ca = Math.cos(a), sa = Math.sin(a);
  const T = (x: number, y: number): Pt => [cx + x * ca - y * sa, cy + x * sa + y * ca];
  const p = [T(rx, 0), T(0, ry), T(-rx, 0), T(0, -ry)];
  const c = [
    [T(rx, k * ry), T(k * rx, ry)], [T(-k * rx, ry), T(-rx, k * ry)],
    [T(-rx, -k * ry), T(-k * rx, -ry)], [T(k * rx, -ry), T(rx, -k * ry)],
  ];
  const out: PathCmd[] = [['M', ...p[0]]];
  for (let i = 0; i < 4; i++) out.push(['C', ...c[i][0], ...c[i][1], ...p[(i + 1) % 4]]);
  out.push(['Z']);
  return out;
}

function rectCmds(x: number, y: number, w: number, h: number, r = 0): PathCmd[] {
  r = Math.min(r, w / 2, h / 2);
  if (r <= 0) return [['M', x, y], ['L', x + w, y], ['L', x + w, y + h], ['L', x, y + h], ['Z']];
  return [
    ['M', x + r, y], ['L', x + w - r, y], ['A', x + w - r, y + r, r, -90, 0], ['L', x + w, y + h - r],
    ['A', x + w - r, y + h - r, r, 0, 90], ['L', x + r, y + h], ['A', x + r, y + h - r, r, 90, 180],
    ['L', x, y + r], ['A', x + r, y + r, r, 180, 270], ['Z'],
  ];
}

export function shapeToSubs(s: Shape): Sub[] {
  if ('path' in s) return cmdsToSubs(s.path, s.closed !== false);
  if ('rect' in s) return cmdsToSubs(rectCmds(...s.rect, s.r));
  if ('circle' in s) return cmdsToSubs([['A', s.circle[0], s.circle[1], s.circle[2], 0, 360], ['Z']]);
  return cmdsToSubs(ellipseCmds(...s.ellipse));
}

// ---------------------------------------------------------------- transforms
/** Rigid transform: optional mirror (y -> -y) first, then rotate by `rot` radians, then translate. */
export interface Xf { rot: number; tx: number; ty: number; mirror: boolean }
export const IDENT: Xf = { rot: 0, tx: 0, ty: 0, mirror: false };

export function xfPt(x: Xf, p: Pt): Pt {
  const py = x.mirror ? -p[1] : p[1];
  const c = Math.cos(x.rot), s = Math.sin(x.rot);
  return [p[0] * c - py * s + x.tx, p[0] * s + py * c + x.ty];
}

function xfSeg(x: Xf, s: Seg): Seg {
  switch (s.t) {
    case 'L': return { t: 'L', p: xfPt(x, s.p) };
    case 'Q': return { t: 'Q', c: xfPt(x, s.c), p: xfPt(x, s.p) };
    case 'C': return { t: 'C', c1: xfPt(x, s.c1), c2: xfPt(x, s.c2), p: xfPt(x, s.p) };
    case 'A': {
      const m = x.mirror ? -1 : 1;
      return { t: 'A', c: xfPt(x, s.c), r: s.r, a0: m * s.a0 + x.rot, a1: m * s.a1 + x.rot, ccw: x.mirror ? !s.ccw : s.ccw };
    }
  }
}

export function xfSubs(x: Xf, subs: Sub[]): Sub[] {
  if (x === IDENT) return subs;
  return subs.map((s) => ({ start: xfPt(x, s.start), segs: s.segs.map((g) => xfSeg(x, g)), closed: s.closed }));
}

/** Reverse a subpath's direction. */
function reverseSub(s: Sub): Sub {
  const pts: Pt[] = [s.start, ...s.segs.map(segEnd)];
  const segs: Seg[] = [];
  for (let i = s.segs.length - 1; i >= 0; i--) {
    const g = s.segs[i], to = pts[i];
    switch (g.t) {
      case 'L': segs.push({ t: 'L', p: to }); break;
      case 'Q': segs.push({ t: 'Q', c: g.c, p: to }); break;
      case 'C': segs.push({ t: 'C', c1: g.c2, c2: g.c1, p: to }); break;
      case 'A': segs.push({ t: 'A', c: g.c, r: g.r, a0: g.a1, a1: g.a0, ccw: !g.ccw }); break;
    }
  }
  return { start: pts[pts.length - 1], segs, closed: s.closed };
}

/** Close a right-half outline (front-centre to rear-centre) with its mirror image. */
export function joinMirror(subs: Sub[]): Sub[] {
  return subs.map((s) => {
    const back = reverseSub(xfSubs({ ...IDENT, mirror: true }, [s])[0]);
    const end = s.segs.length ? segEnd(s.segs[s.segs.length - 1]) : s.start;
    const segs = [...s.segs];
    if (Math.hypot(back.start[0] - end[0], back.start[1] - end[1]) > 1e-9) segs.push({ t: 'L', p: back.start });
    segs.push(...back.segs);
    return { start: s.start, segs, closed: true };
  });
}

// ---------------------------------------------------------------- output
export function addToPath(p: Path2D, subs: Sub[]) {
  for (const s of subs) {
    p.moveTo(s.start[0], s.start[1]);
    for (const g of s.segs) {
      switch (g.t) {
        case 'L': p.lineTo(g.p[0], g.p[1]); break;
        case 'Q': p.quadraticCurveTo(g.c[0], g.c[1], g.p[0], g.p[1]); break;
        case 'C': p.bezierCurveTo(g.c1[0], g.c1[1], g.c2[0], g.c2[1], g.p[0], g.p[1]); break;
        case 'A': p.arc(g.c[0], g.c[1], g.r, g.a0, g.a1, g.ccw); break;
      }
    }
    if (s.closed) p.closePath();
  }
}

export function toPath2D(subs: Sub[]): Path2D { const p = new Path2D(); addToPath(p, subs); return p; }

/** Sweep of an arc in radians, signed, following canvas rules. */
function arcSweep(a0: number, a1: number, ccw: boolean) {
  const TAU = Math.PI * 2;
  let d = a1 - a0;
  if (!ccw) { if (d >= TAU) d = TAU; else { d %= TAU; if (d < 0) d += TAU; } }
  else { if (d <= -TAU) d = -TAU; else { d %= TAU; if (d > 0) d -= TAU; } }
  if (Math.abs(a1 - a0) >= TAU - 1e-9) d = ccw ? -TAU : TAU;
  return d;
}

/** Polyline approximation of each subpath (curves sampled). */
export function flatten(subs: Sub[], steps = 10): Pt[][] {
  return subs.map((s) => {
    const out: Pt[] = [s.start];
    let p0 = s.start;
    for (const g of s.segs) {
      if (g.t === 'L') out.push(g.p);
      else if (g.t === 'Q') for (let i = 1; i <= steps; i++) { const t = i / steps, u = 1 - t; out.push([u * u * p0[0] + 2 * u * t * g.c[0] + t * t * g.p[0], u * u * p0[1] + 2 * u * t * g.c[1] + t * t * g.p[1]]); }
      else if (g.t === 'C') for (let i = 1; i <= steps; i++) {
        const t = i / steps, u = 1 - t;
        out.push([
          u * u * u * p0[0] + 3 * u * u * t * g.c1[0] + 3 * u * t * t * g.c2[0] + t * t * t * g.p[0],
          u * u * u * p0[1] + 3 * u * u * t * g.c1[1] + 3 * u * t * t * g.c2[1] + t * t * t * g.p[1],
        ]);
      } else {
        const sw = arcSweep(g.a0, g.a1, g.ccw), n = Math.max(4, Math.ceil(Math.abs(sw) / (Math.PI / 24)));
        for (let i = 1; i <= n; i++) out.push(arcPt(g.c, g.r, g.a0 + (sw * i) / n));
      }
      p0 = out[out.length - 1];
    }
    if (s.closed) out.push(s.start);
    return out;
  });
}

export interface Box { x0: number; y0: number; x1: number; y1: number }
export const emptyBox = (): Box => ({ x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity });
export function growBox(b: Box, pts: Pt[]) {
  for (const [x, y] of pts) { if (x < b.x0) b.x0 = x; if (y < b.y0) b.y0 = y; if (x > b.x1) b.x1 = x; if (y > b.y1) b.y1 = y; }
  return b;
}

/** Arc-length walker over a polyline: position and tangent angle at distance d. */
export function polyWalker(pts: Pt[]) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = cum[cum.length - 1];
  return {
    total,
    at(d: number): { p: Pt; a: number } {
      d = Math.max(0, Math.min(total, d));
      let i = 1;
      while (i < cum.length - 1 && cum[i] < d) i++;
      const seg = cum[i] - cum[i - 1] || 1, t = (d - cum[i - 1]) / seg;
      const a = pts[i - 1], b = pts[i];
      return { p: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], a: Math.atan2(b[1] - a[1], b[0] - a[0]) };
    },
  };
}
