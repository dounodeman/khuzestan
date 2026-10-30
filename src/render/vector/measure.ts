/** Dimension measurement straight from sprite geometry (turret forward, no recoil, track phase 0). */
import type { MeasureKey, SpriteDef } from '../../data/sprites/types';
import { type CompiledSprite, compile, groupXf, partPoints } from './compile';
import { type Box, type Pt, emptyBox, growBox } from './geometry';

export const MEASURE_LABELS: Record<MeasureKey, string> = {
  hullLength: 'Hull length',
  width: 'Width',
  overallLength: 'Length, gun forward',
  gunOverhang: 'Gun overhang',
  turretPivotFromFront: 'Turret pivot from hull front',
  roadWheelGaps: 'Road wheel gaps',
  rotorDiameter: 'Rotor diameter',
};

export interface Measured {
  hullBox: Box;
  overallBox: Box;
  muzzle: Pt | null;
  pivot: Pt | null;
  roadWheelX: number[];
  values: Partial<Record<MeasureKey, number | number[]>>;
}

const POSE = { turret: 0, rotor: 0, recoil: 0 };

function boxOf(cs: CompiledSprite, pick: (layer: string) => boolean): Box {
  const b = emptyBox();
  for (const cp of cs.parts) {
    if (!pick(cp.def.layer) || cp.def.text) continue;
    const g = groupXf(cs.def, cp.group, POSE);
    growBox(b, partPoints(cp).map(g.map));
  }
  return b;
}

export function measure(def: SpriteDef): Measured {
  const cs = compile(def);
  const hullBox = boxOf(cs, (l) => l === 'running' || l === 'hull');
  const overallBox = boxOf(cs, (l) => l !== 'rotor' && l !== 'markings' && l !== 'damage');
  const rotorBox = boxOf(cs, (l) => l === 'rotor');
  const m = def.hooks.muzzle;
  const muzzle = m ? groupXf(def, m.group, POSE).map(m.at[0]) : null;
  const tg = Object.entries(def.groups).find(([, g]) => g.rotate === 'turret');
  const pivot = tg ? groupXf(def, tg[1].parent ?? 'hull', POSE).map(tg[1].pivot) : null;
  const rw = cs.parts.find((p) => p.def.measure === 'roadWheels');
  let roadWheelX: number[] = [];
  if (rw) {
    const xs = rw.instances(0, 0).filter((x) => !x.mirror).map((x) => x.tx);
    const sh = rw.def.shape;
    const cx = 'circle' in sh ? sh.circle[0] : 'ellipse' in sh ? sh.ellipse[0] : 'rect' in sh ? sh.rect[0] + sh.rect[2] / 2 : 0;
    roadWheelX = xs.map((x) => x + cx).sort((a, b) => b - a);
  }
  const values: Measured['values'] = {
    hullLength: hullBox.x1 - hullBox.x0,
    width: hullBox.y1 - hullBox.y0,
    overallLength: overallBox.x1 - overallBox.x0,
  };
  if (muzzle) values.gunOverhang = muzzle[0] - hullBox.x1;
  if (pivot) values.turretPivotFromFront = hullBox.x1 - pivot[0];
  if (roadWheelX.length > 1) values.roadWheelGaps = roadWheelX.slice(1).map((x, i) => roadWheelX[i] - x);
  if (isFinite(rotorBox.x0)) values.rotorDiameter = rotorBox.x1 - rotorBox.x0;
  return { hullBox, overallBox, muzzle, pivot, roadWheelX, values };
}

export interface SpecRow {
  key: MeasureKey;
  label: string;
  target: number | number[];
  measured: number | number[] | undefined;
  deltaPct: number; // worst case
  pass: boolean;
  verify: boolean;
  source?: string;
}

export function compareSpec(def: SpriteDef, m = measure(def)): SpecRow[] {
  return def.spec.map((s) => {
    const meas = m.values[s.measure];
    const tol = s.tol ?? 0.03;
    let delta = Infinity;
    if (typeof s.target === 'number' && typeof meas === 'number') delta = Math.abs(meas - s.target) / s.target;
    else if (Array.isArray(s.target) && Array.isArray(meas) && meas.length === s.target.length) {
      delta = Math.max(...s.target.map((t, i) => Math.abs(meas[i] - t) / t));
    }
    return { key: s.measure, label: MEASURE_LABELS[s.measure], target: s.target, measured: meas, deltaPct: delta * 100, pass: delta <= tol, verify: !!s.verify, source: s.source };
  });
}
