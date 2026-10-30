/**
 * Sprite generator: VehicleSheet JSON -> SpriteDef. Every coordinate and dimension comes from the sheet;
 * this file only decides how each measured thing is drawn (via style.ts).
 */
import type { Part, PathCmd, Repeat, Shape, SpecItem, SpriteDef } from '../data/sprites/types';
import type { SheetPart, VehicleSheet } from './schema';
import { loop, loopCmds } from './outline';
import { OUTLINE_STYLE, PART_STYLE, RUNNING, layerFor } from './style';

function partShape(p: SheetPart): Shape {
  const [x, y] = p.pos ?? [0, 0];
  if (p.shape === 'circle') return { circle: [x, y, p.r ?? 0] };
  if (p.shape === 'ellipse') return { ellipse: [x, y, (p.size?.[0] ?? 0) / 2, (p.size?.[1] ?? 0) / 2, p.rot ?? 0] };
  if (p.shape === 'rect') {
    const [w, h] = p.size ?? [0, 0];
    if (!p.rot) return { rect: [x - w / 2, y - h / 2, w, h], r: p.corner };
    const a = (p.rot * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
    const pts = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([u, v]) => [x + u * c - v * s, y + u * s + v * c]);
    return { path: pts.map(([px, py], i) => (i ? ['L', px, py] : ['M', px, py]) as PathCmd) };
  }
  const pts = p.points ?? [];
  return { path: pts.map(([px, py], i) => (i ? ['L', px, py] : ['M', px, py]) as PathCmd), closed: p.shape === 'poly' };
}

function partRepeat(p: SheetPart): Repeat | undefined {
  if (!p.repeat) return undefined;
  if ('at' in p.repeat) return { kind: 'at', offsets: p.repeat.at };
  return { kind: 'linear', count: p.repeat.count, step: p.repeat.step };
}

const GROUP = { hull: 'hull', turret: 'turret', barrel: 'barrel' } as const;

export function generateSprite(sh: VehicleSheet): SpriteDef {
  const parts: Part[] = [];
  const weakPoints: NonNullable<SpriteDef['weakPoints']> = [];
  const rg = sh.running_gear;

  // Running gear
  if (rg.tracks) {
    const t = rg.tracks;
    const y0 = t.y_centre - t.width / 2;
    parts.push({ id: 'track', layer: 'running', mirror: 'copy', fill: RUNNING.track.fill, shade: RUNNING.track.shade, stroke: null, conf: t.conf, note: t.src,
      shape: { rect: [t.x_from, y0, t.x_to - t.x_from, t.width], r: t.width * RUNNING.track.cornerOfWidth } });
    parts.push({ id: 'track_links', layer: 'running', mirror: 'copy', lod: RUNNING.links.lod, clip: 'track', fill: null, stroke: RUNNING.links.stroke, strokeW: RUNNING.links.strokeW,
      shape: { path: [['M', t.x_from, y0], ['L', t.x_from, y0 + t.width]], closed: false },
      repeat: { kind: 'linear', count: Math.round((t.x_to - t.x_from) / t.link_pitch), step: [t.link_pitch, 0], scroll: 'track' } });
  }
  if (rg.road_wheels) {
    const w = rg.road_wheels;
    parts.push({ id: 'road_wheels', layer: 'running', mirror: 'copy', measure: 'roadWheels', fill: RUNNING.wheel.fill, shade: RUNNING.wheel.shade, conf: w.conf, note: w.src,
      shape: { rect: [-w.dia / 2, w.y_centre - w.width / 2, w.dia, w.width], r: w.width * RUNNING.wheel.cornerOfWidth },
      repeat: { kind: 'at', offsets: w.x.map((x) => [x, 0] as [number, number]) } });
  }
  if (rg.axles) {
    const a = rg.axles;
    parts.push({ id: 'tyres', layer: 'running', mirror: 'copy', measure: 'roadWheels', fill: RUNNING.tyre.fill, shade: RUNNING.tyre.shade, conf: a.conf, note: a.src,
      shape: { rect: [-a.tyre_dia / 2, a.y_centre - a.tyre_width / 2, a.tyre_dia, a.tyre_width], r: a.tyre_width * RUNNING.tyre.cornerOfWidth },
      repeat: { kind: 'at', offsets: a.x.map((x) => [x, 0] as [number, number]) } });
  }

  // Outlines
  for (const [id, o] of Object.entries(sh.outlines)) {
    const st = OUTLINE_STYLE[o.role];
    const group = o.frame === 'turret' ? 'turret' : 'hull';
    const layer = o.frame === 'turret' && st.layer === 'hullDetail' ? 'turretDetail' : st.layer;
    const weak = o.points.filter((p) => p[2].conf === 'C' || p[2].conf === 'X');
    const worst = o.points.some((p) => p[2].conf === 'X') ? 'X' : weak.length ? 'C' : o.points.some((p) => p[2].conf === 'B') ? 'B' : 'A';
    parts.push({ id, layer, group, fill: st.fill, shade: st.shade, ao: st.ao, lod: st.lod, conf: worst, note: o.src,
      mirror: o.mirror === 'side' ? 'copy' : undefined, shape: { path: loopCmds(loop(o)) } });
    for (const [x, y, t] of weak) {
      weakPoints.push({ group, at: [x, y], conf: t.conf as 'C' | 'X', outline: id });
      if (o.mirror !== 'full' && y !== 0) weakPoints.push({ group, at: [x, -y], conf: t.conf as 'C' | 'X', outline: id });
    }
  }

  // Gun
  if (sh.gun) {
    const g = sh.gun;
    parts.push({ id: 'barrel', layer: 'barrel', group: 'barrel', fill: RUNNING.barrel.fill, shade: RUNNING.barrel.shade, conf: g.conf, note: g.src,
      shape: { rect: [g.from_x, -g.dia / 2, g.muzzle_x - g.from_x, g.dia] } });
    for (const f of g.fittings) {
      parts.push({ id: f.kind, layer: 'barrel', group: 'barrel', fill: RUNNING.fitting.fill, shade: RUNNING.fitting.shade, conf: f.conf, note: f.src,
        shape: { rect: [f.x - f.len, -f.dia / 2, f.len, f.dia], r: f.dia * RUNNING.fitting.cornerOfDia } });
    }
  }

  // Parts
  for (const p of sh.parts) {
    const st = PART_STYLE[p.kind];
    const group = GROUP[p.frame];
    const part: Part = {
      id: p.id, layer: layerFor(st, p.frame), group, fill: st.fill, shade: st.shade, ao: st.ao, lod: st.lod,
      stroke: st.stroke, strokeW: st.strokeW, shape: partShape(p), repeat: partRepeat(p), mirror: p.mirror ? 'copy' : undefined,
      lostAt: p.lost_at, conf: p.conf, note: `${p.conf} · ${p.src}`,
    };
    if (p.kind === 'marking') { part.text = { str: p.text ?? '{num}', size: p.size?.[1] ?? 0, rot: p.rot }; part.shape = partShape({ ...p, rot: 0 }); }
    parts.push(part);
  }

  // Rotors (helicopters)
  const groups: SpriteDef['groups'] = {};
  [sh.rotor, sh.rotor2].forEach((r, i) => {
    if (!r) return;
    const g = i ? 'rotor2' : 'rotor';
    groups[g] = { pivot: r.mast, rotate: 'rotor' };
    parts.push({ id: `${g}_disc`, layer: 'rotor', group: g, fill: RUNNING.disc.fill, stroke: null, shade: 'flat', conf: r.conf, note: r.src, shape: { circle: [0, 0, r.radius] } });
    const chord = r.chord;
    for (let k = 0; k < r.blades; k++) {
      const a = (k / r.blades) * 2 * Math.PI + (i ? Math.PI / r.blades : 0), c = Math.cos(a), sn = Math.sin(a);
      const pts = [[0, -chord / 2], [r.radius, -chord / 2], [r.radius, chord / 2], [0, chord / 2]].map(([u, v]) => [u * c - v * sn, u * sn + v * c]);
      parts.push({ id: `${g}_blade${k + 1}`, layer: 'rotor', group: g, fill: RUNNING.blade.fill, shade: RUNNING.blade.shade, conf: r.conf,
        shape: { path: pts.map(([x, y], j) => (j ? ['L', x, y] : ['M', x, y]) as PathCmd) } });
    }
  });
  if (sh.tail_rotor) {
    const t = sh.tail_rotor, th = t.dia * RUNNING.tailRotor.blurOfDia;
    parts.push({ id: 'tail_rotor', layer: 'rotor', fill: RUNNING.tailRotor.fill, stroke: null, shade: 'flat', conf: t.conf, note: `${t.side} side · ${t.src}`,
      shape: { rect: [t.pos[0] - t.dia / 2, t.pos[1] - th / 2, t.dia, th] } });
  }

  if (sh.turret) groups.turret = { pivot: sh.turret.pivot, rotate: 'turret' };
  if (sh.gun) groups.barrel = { parent: sh.turret ? 'turret' : 'hull', pivot: [0, 0], recoil: sh.gun.recoil };

  const spec: SpecItem[] = [];
  const dimSpec: Array<[string, SpecItem['measure']]> = [['hull_len', 'hullLength'], ['width', 'width'], ['overall_len', 'overallLength'], ['rotor_dia', 'rotorDiameter']];
  for (const [k, m] of dimSpec) {
    const d = sh.dimensions[k];
    if (d) spec.push({ measure: m, target: d.value, source: `${d.conf} · ${d.src}`, verify: d.conf === 'C' || d.conf === 'X' });
  }

  return {
    id: sh.id, name: sh.name, status: sh.status, kind: sh.kind, source: `data/vehicle_sheets/${sh.id}.json`,
    groups, parts, paint: { schemes: sh.paint.schemes }, spec, weakPoints,
    hooks: {
      muzzle: sh.gun ? { group: 'barrel', at: [[sh.gun.muzzle_x, 0]] } : undefined,
      exhaust: sh.hooks.exhaust.value, dust: sh.hooks.dust?.value, smoke: sh.hooks.smoke?.value,
    },
  };
}
