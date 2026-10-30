/** Small authoring helpers that expand to plain sprite data. */
import type { PathCmd } from './types';

/** Polyline through the given points (open; add ['Z'] or use closed shapes as needed). */
export function poly(pts: Array<[number, number]>): PathCmd[] {
  return pts.map(([x, y], i) => (i === 0 ? ['M', x, y] : ['L', x, y]) as PathCmd);
}

/** Offsets along x from a start position and a list of gaps: uneven road-wheel spacing. */
export function gapsX(x0: number, gaps: number[], y = 0): Array<[number, number]> {
  const out: Array<[number, number]> = [[x0, y]];
  let x = x0;
  for (const g of gaps) { x -= g; out.push([x, y]); }
  return out;
}

/** Stadium (rounded-end strip) as a path, ends rounded with radius = half the height. */
export function stadium(x0: number, x1: number, y0: number, y1: number): PathCmd[] {
  const r = (y1 - y0) / 2, cy = (y0 + y1) / 2;
  return [['M', x0 + r, y0], ['L', x1 - r, y0], ['A', x1 - r, cy, r, -90, 90], ['L', x0 + r, y1], ['A', x0 + r, cy, r, 90, 270], ['Z']];
}
