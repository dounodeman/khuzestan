/** Outline geometry shared by the sprite generator and the sheet validator (no DOM). */
import type { PathCmd } from '../data/sprites/types';
import type { Outline } from './schema';

export interface OP { x: number; y: number; smooth: boolean }
type P = [number, number];

/** Closed point loop for an outline (half outlines mirrored to the left side). */
export function loop(o: Outline): OP[] {
  const pts = o.points.map(([x, y, t]) => ({ x, y, smooth: !!t?.smooth }));
  if (o.mirror !== 'half') return pts;
  const back = pts.slice(1, -1).reverse().map((p) => ({ ...p, y: -p.y }));
  return [...pts, ...back];
}

/** Closed path through the loop: corners stay sharp, `smooth` points get Catmull-Rom tangents. */
export function loopCmds(l: OP[]): PathCmd[] {
  const n = l.length;
  const at = (i: number) => l[((i % n) + n) % n];
  const cmds: PathCmd[] = [['M', l[0].x, l[0].y]];
  for (let i = 0; i < n; i++) {
    const a = at(i), b = at(i + 1);
    if (!a.smooth && !b.smooth) { cmds.push(['L', b.x, b.y]); continue; }
    const pa = at(i - 1), pb = at(i + 2);
    const c1: P = a.smooth ? [a.x + (b.x - pa.x) / 6, a.y + (b.y - pa.y) / 6] : [a.x, a.y];
    const c2: P = b.smooth ? [b.x - (pb.x - a.x) / 6, b.y - (pb.y - a.y) / 6] : [b.x, b.y];
    cmds.push(['C', c1[0], c1[1], c2[0], c2[1], b.x, b.y]);
  }
  cmds.push(['Z']);
  return cmds;
}

/** Sampled polygon (curves subdivided), closed implicitly. */
export function samplePolygon(l: OP[], steps = 8): P[] {
  const cmds = loopCmds(l);
  const out: P[] = [];
  let cur: P = [l[0].x, l[0].y];
  out.push(cur);
  for (const c of cmds) {
    if (c[0] === 'L') { cur = [c[1], c[2]]; out.push(cur); }
    else if (c[0] === 'C') {
      const p0 = cur;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps, u = 1 - t;
        out.push([
          u * u * u * p0[0] + 3 * u * u * t * c[1] + 3 * u * t * t * c[3] + t * t * t * c[5],
          u * u * u * p0[1] + 3 * u * u * t * c[2] + 3 * u * t * t * c[4] + t * t * t * c[6],
        ]);
      }
      cur = [c[5], c[6]];
    }
  }
  if (out.length > 1 && Math.hypot(out[0][0] - cur[0], out[0][1] - cur[1]) < 1e-9) out.pop();
  return out;
}

export function polygonsOf(o: Outline, steps = 8): P[][] {
  const poly = samplePolygon(loop(o), steps);
  return o.mirror === 'side' ? [poly, poly.map(([x, y]) => [x, -y] as P).reverse()] : [poly];
}

export function pointInPolygon(p: P, poly: P[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function distToPolygon(p: P, poly: P[]): number {
  let best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, ay] = poly[j], [bx, by] = poly[i];
    const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((p[0] - ax) * dx + (p[1] - ay) * dy) / L));
    best = Math.min(best, Math.hypot(p[0] - ax - t * dx, p[1] - ay - t * dy));
  }
  return best;
}

function segsCross(a: P, b: P, c: P, d: P): boolean {
  const o = (p: P, q: P, r: P) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  const o1 = o(a, b, c), o2 = o(a, b, d), o3 = o(c, d, a), o4 = o(c, d, b);
  return o1 * o2 < 0 && o3 * o4 < 0;
}

/** Index pairs of crossing edges (non-adjacent). */
export function selfIntersections(poly: P[]): Array<[number, number]> {
  const n = poly.length, hits: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) {
    if (i === 0 && j === n - 1) continue;
    if (segsCross(poly[i], poly[(i + 1) % n], poly[j], poly[(j + 1) % n])) hits.push([i, j]);
  }
  return hits;
}
