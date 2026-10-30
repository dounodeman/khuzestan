/**
 * Turns SpriteDef data into ready-to-draw geometry: half outlines joined with their mirror image,
 * instanced parts expanded, Path2D objects cached. Scrolling instances (track links) are rebuilt per phase.
 */
import type { Part, SpriteDef } from '../../data/sprites/types';
import { LAYERS } from '../../data/sprites/types';
import {
  type Box, type Pt, type Sub, type Xf, IDENT, emptyBox, flatten, growBox, joinMirror, polyWalker, shapeToSubs, addToPath, xfSubs, cmdsToSubs,
} from './geometry';

export interface CPart {
  def: Part;
  group: string;
  layerIndex: number;
  base: Sub[];
  scrolls: boolean;
  /** Instance transforms for the given track phases (right side, left side). */
  instances(phaseR: number, phaseL: number): Xf[];
  staticPath: Path2D | null;
  staticBox: Box | null;
}

export interface CompiledSprite {
  def: SpriteDef;
  parts: CPart[]; // in draw order
  byId: Map<string, CPart>;
  /** Groups ordered so parents come first. */
  groupOrder: string[];
}

function instanceFn(p: Part): { fn: (r: number, l: number) => Xf[]; scrolls: boolean } {
  const rep = p.repeat;
  const copy = p.mirror === 'copy';
  const withCopies = (xs: Xf[], mirrored: Xf[]) => (copy ? [...xs, ...mirrored] : xs);
  const mirrorOf = (x: Xf): Xf => ({ rot: -x.rot, tx: x.tx, ty: -x.ty, mirror: true });
  if (!rep) return { fn: () => withCopies([IDENT], [{ ...IDENT, mirror: true }]), scrolls: false };
  if (rep.kind === 'at') {
    const xs = rep.offsets.map(([tx, ty]): Xf => ({ rot: 0, tx, ty, mirror: false }));
    const all = withCopies(xs, xs.map(mirrorOf));
    return { fn: () => all, scrolls: false };
  }
  if (rep.kind === 'linear') {
    const [sx, sy] = rep.step, n = rep.count, len = Math.hypot(sx, sy) || 1;
    const run = (phase: number): Xf[] => {
      const out: Xf[] = [];
      for (let i = 0; i < n; i++) {
        let d = i * len;
        if (rep.scroll) d = (((d + phase) % (n * len)) + n * len) % (n * len);
        out.push({ rot: 0, tx: (sx / len) * d, ty: (sy / len) * d, mirror: false });
      }
      return out;
    };
    return { fn: (r, l) => withCopies(run(r), run(l).map(mirrorOf)), scrolls: !!rep.scroll };
  }
  const w = polyWalker(flatten(cmdsToSubs(rep.path, false), 16).flat());
  const n = Math.max(1, Math.floor(w.total / rep.spacing));
  const run = (phase: number): Xf[] => {
    const out: Xf[] = [];
    for (let i = 0; i < n; i++) {
      let d = i * rep.spacing;
      if (rep.scroll) d = (((d + phase) % w.total) + w.total) % w.total;
      const { p, a } = w.at(d);
      out.push({ rot: a, tx: p[0], ty: p[1], mirror: false });
    }
    return out;
  };
  return { fn: (r, l) => withCopies(run(r), run(l).map(mirrorOf)), scrolls: !!rep.scroll };
}

/** All instance geometry of a part for the given phases. */
export function partSubs(cp: CPart, phaseR = 0, phaseL = 0): Sub[] {
  return cp.instances(phaseR, phaseL).flatMap((x) => xfSubs(x, cp.base));
}

export function partPath(cp: CPart, phaseR: number, phaseL: number): Path2D {
  if (cp.staticPath) return cp.staticPath;
  const p = new Path2D();
  addToPath(p, partSubs(cp, phaseR, phaseL));
  return p;
}

export function partBox(cp: CPart, phaseR = 0, phaseL = 0): Box {
  if (cp.staticBox) return cp.staticBox;
  const b = emptyBox();
  for (const pts of flatten(partSubs(cp, phaseR, phaseL), 6)) growBox(b, pts);
  return b;
}

export function partPoints(cp: CPart): Pt[] { return flatten(partSubs(cp), 12).flat(); }

const cache = new WeakMap<SpriteDef, CompiledSprite>();

export function compile(def: SpriteDef): CompiledSprite {
  const hit = cache.get(def);
  if (hit) return hit;
  const parts: CPart[] = def.parts.map((p, i) => {
    let base = shapeToSubs(p.shape);
    if (p.mirror === 'join') base = joinMirror(base);
    const { fn, scrolls } = instanceFn(p);
    const cp: CPart = {
      def: p, group: p.group ?? 'hull', layerIndex: LAYERS.indexOf(p.layer) * 10000 + i,
      base, scrolls, instances: fn, staticPath: null, staticBox: null,
    };
    if (!scrolls) {
      const subs = partSubs(cp);
      const path = new Path2D(); addToPath(path, subs);
      cp.staticPath = path;
      const b = emptyBox(); for (const pts of flatten(subs, 6)) growBox(b, pts);
      cp.staticBox = b;
    }
    return cp;
  });
  parts.sort((a, b) => a.layerIndex - b.layerIndex);
  const byId = new Map(parts.map((p) => [p.def.id, p]));
  const groupOrder: string[] = ['hull'];
  const pending = Object.keys(def.groups);
  for (let guard = 0; pending.length && guard < 20; guard++) {
    for (let i = pending.length - 1; i >= 0; i--) {
      const g = pending[i];
      if (groupOrder.includes(def.groups[g].parent ?? 'hull')) { groupOrder.push(g); pending.splice(i, 1); }
    }
  }
  const cs = { def, parts, byId, groupOrder };
  cache.set(def, cs);
  return cs;
}

/** Live angles and offsets that drive group transforms. */
export interface Pose { turret: number; rotor: number; recoil: number }

/** Group transform chain (hull-local): returns a function mapping group-local points to hull-local, plus total rotation. */
export function groupXf(def: SpriteDef, group: string, pose: Pose): { map: (p: Pt) => Pt; rot: number } {
  if (group === 'hull' || !def.groups[group]) return { map: (p) => p, rot: 0 };
  const g = def.groups[group];
  const parent = groupXf(def, g.parent ?? 'hull', pose);
  const a = g.rotate === 'turret' ? pose.turret : g.rotate === 'rotor' ? pose.rotor : 0;
  const rx = -(g.recoil ?? 0) * pose.recoil;
  const c = Math.cos(a), s = Math.sin(a);
  return {
    rot: parent.rot + a,
    map: (p) => {
      const x = p[0] + rx, y = p[1];
      return parent.map([g.pivot[0] + x * c - y * s, g.pivot[1] + x * s + y * c]);
    },
  };
}

/** Apply a group's transform to a canvas context (hull-local frame already set). */
export function applyGroup(ctx: CanvasRenderingContext2D, def: SpriteDef, group: string, pose: Pose) {
  if (group === 'hull' || !def.groups[group]) return;
  const g = def.groups[group];
  applyGroup(ctx, def, g.parent ?? 'hull', pose);
  ctx.translate(g.pivot[0], g.pivot[1]);
  const a = g.rotate === 'turret' ? pose.turret : g.rotate === 'rotor' ? pose.rotor : 0;
  if (a) ctx.rotate(a);
  if (g.recoil) ctx.translate(-g.recoil * pose.recoil, 0);
}
