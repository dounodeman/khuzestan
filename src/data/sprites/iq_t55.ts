/**
 * T-55: PLACEHOLDER block-in, built straight from docs/vehicle_sheets.md §3.1 to exercise the sprite format
 * and the Sprite Lab. Not researched yet; replaced by the full-quality T-55 in the next step.
 */
import type { SpriteDef } from './types';
import { gapsX, poly } from './build';

const TRACK = { x0: -3.1, x1: 3.25, y0: 1.05, y1: 1.63 };
const LINK = 0.137; // track pitch placeholder (verify)

export const IQ_T55: SpriteDef = {
  id: 'iq_t55',
  name: 'T-55 (placeholder)',
  status: 'placeholder',
  kind: 'tracked',
  source: 'docs/vehicle_sheets.md §3.1 (unverified)',
  groups: {
    turret: { pivot: [0.3, 0], rotate: 'turret' },
    barrel: { parent: 'turret', pivot: [0, 0], recoil: 0.3 },
  },
  paint: { schemes: ['iq_sand', 'iq_sand_olive', 'iq_sand_brown'] },
  spec: [
    { measure: 'hullLength', target: 6.45, source: 'vehicle_sheets §3.1' },
    { measure: 'overallLength', target: 9.0, source: 'vehicle_sheets §3.1' },
    { measure: 'width', target: 3.27, source: 'vehicle_sheets §3.1' },
  ],
  hooks: {
    muzzle: { group: 'barrel', at: [[5.5, 0]] },
    exhaust: [[-3.2, 0.5]],
    smoke: [[-2.2, 0], [0.3, 0]],
    dust: [[-3.1, 1.34], [-3.1, -1.34]],
  },
  parts: [
    // ---- running gear
    { id: 'track', layer: 'running', mirror: 'copy', fill: 'RUBBER', shade: 'flat', stroke: null,
      shape: { rect: [TRACK.x0, TRACK.y0, TRACK.x1 - TRACK.x0, TRACK.y1 - TRACK.y0], r: 0.12 } },
    { id: 'road_wheels', layer: 'running', mirror: 'copy', measure: 'roadWheels', fill: 'STEEL', shade: 'plate',
      shape: { rect: [-0.405, 1.17, 0.81, 0.34], r: 0.06 }, repeat: { kind: 'at', offsets: gapsX(2.35, [1.22, 1.0, 1.0, 1.0]) },
      note: 'seen edge-on from above (0.81 m dia); placeholder spacing: wider gap after wheel 1 per the sheet; real spacing to be researched' },
    { id: 'track_links', layer: 'running', mirror: 'copy', lod: 2, clip: 'track', fill: null, stroke: 'rgba(80,78,70,0.9)', strokeW: 0.025,
      shape: { path: poly([[TRACK.x0, TRACK.y0], [TRACK.x0, TRACK.y1]]), closed: false },
      repeat: { kind: 'linear', count: Math.round((TRACK.x1 - TRACK.x0) / LINK), step: [LINK, 0], scroll: 'track' } },
    // ---- hull
    { id: 'hull', layer: 'hull', mirror: 'join', shade: 'plate',
      shape: { path: poly([[3.15, 0], [3.15, 0.75], [2.5, 1.25], [1.9, 1.35], [-2.9, 1.35], [-3.2, 1.1], [-3.2, 0]]) } },
    { id: 'fender', layer: 'hull', mirror: 'copy', shade: 'plate',
      shape: { path: poly([[2.95, 1.05], [3.0, 1.2], [2.9, 1.635], [-2.95, 1.635], [-2.95, 1.05]]) } },
    // ---- hull details
    { id: 'driver_hatch', layer: 'hullDetail', fill: 'BASE', shade: 'recess', lod: 1, shape: { circle: [2.4, 0, 0.28] },
      note: '(verify) sheet places it centre front; T-55 driver sits front left' },
    { id: 'engine_deck', layer: 'hullDetail', fill: 'STEEL', shade: 'recess', lod: 1, shape: { rect: [-3.0, -0.9, 1.6, 1.8], r: 0.05 } },
    { id: 'louvre_slats', layer: 'hullDetail', lod: 2, fill: null, stroke: 'rgba(0,0,0,0.55)', strokeW: 0.03, clip: 'engine_deck',
      shape: { path: poly([[-2.95, -0.85], [-2.95, 0.85]]), closed: false }, repeat: { kind: 'linear', count: 14, step: [0.11, 0] } },
    { id: 'fuel_tanks', layer: 'hullDetail', lod: 1, shade: 'cylinder', lostAt: 2,
      shape: { rect: [0, 1.2, 1.2, 0.3], r: 0.15 }, repeat: { kind: 'at', offsets: [[0.4, 0], [-1.0, 0]] } },
    { id: 'toolbox', layer: 'hullDetail', lod: 1, shade: 'plate', shape: { rect: [-0.6, -1.55, 1.0, 0.35], r: 0.03 }, lostAt: 1 },
    { id: 'spare_links', layer: 'hullDetail', lod: 2, fill: 'RUBBER', shade: 'flat', lostAt: 1,
      shape: { rect: [0.7, -1.55, 0.137, 0.42] }, repeat: { kind: 'linear', count: 4, step: [0.15, 0] } },
    { id: 'unditching_log', layer: 'hullDetail', lod: 1, fill: 'WOOD', shade: 'cylinder', lostAt: 1,
      shape: { rect: [-3.15, -1.0, 0.22, 2.0], r: 0.11 } },
    { id: 'glacis_weld', layer: 'hullDetail', lod: 3, mirror: 'copy', fill: null, strokeW: 0.02,
      shape: { path: poly([[3.1, 0.75], [2.48, 1.22]]), closed: false } },
    // ---- turret
    { id: 'turret', layer: 'turret', group: 'turret', mirror: 'join', shade: 'dome', ao: 0.1,
      shape: { path: [['M', 1.55, 0], ['Q', 1.55, 0.45, 1.2, 0.72], ['Q', 0.7, 1.05, 0, 1.05], ['Q', -0.9, 1.05, -1.4, 0.65], ['Q', -1.7, 0.35, -1.7, 0]] },
      note: 'curves are a placeholder fit through the sheet points' },
    { id: 'cupola', layer: 'turretDetail', group: 'turret', lod: 1, shade: 'dome', ao: 0.05, shape: { circle: [-0.15, -0.55, 0.3] } },
    { id: 'cupola_hatch', layer: 'turretDetail', group: 'turret', lod: 2, shade: 'plate', shape: { circle: [-0.15, -0.55, 0.2] } },
    { id: 'loader_hatch', layer: 'turretDetail', group: 'turret', lod: 1, shade: 'plate', ao: 0.04, shape: { rect: [-0.75, 0.275, 0.5, 0.45], r: 0.08 } },
    { id: 'hatch_bolts', layer: 'turretDetail', group: 'turret', lod: 3, fill: 'STEEL', stroke: null,
      shape: { circle: [0, 0, 0.025] }, repeat: { kind: 'at', offsets: [[-0.7, 0.32], [-0.3, 0.32], [-0.7, 0.68], [-0.3, 0.68]] } },
    { id: 'ventilator', layer: 'turretDetail', group: 'turret', lod: 1, shade: 'dome', shape: { circle: [-1.0, 0.35, 0.15] } },
    { id: 'ir_searchlight', layer: 'turretDetail', group: 'turret', lod: 1, fill: 'STEEL', shade: 'plate',
      shape: { rect: [1.025, 0.3, 0.35, 0.3], r: 0.04 }, lostAt: 1, note: '(verify) side' },
    { id: 'mark_r', layer: 'markings', group: 'turret', lod: 1, text: { str: '{num}', size: 0.32 }, shape: { rect: [-0.95, 0.72, 0.6, 0.1] } },
    { id: 'mark_l', layer: 'markings', group: 'turret', lod: 1, text: { str: '{num}', size: 0.32 }, shape: { rect: [-0.95, -0.82, 0.6, 0.1] } },
    // ---- gun
    { id: 'barrel', layer: 'barrel', group: 'barrel', fill: 'GUN', shade: 'cylinder', shape: { rect: [1.45, -0.07, 4.05, 0.14] } },
    { id: 'bore_evacuator', layer: 'barrel', group: 'barrel', fill: 'GUN', shade: 'cylinder', shape: { rect: [3.55, -0.12, 0.5, 0.24], r: 0.06 } },
  ],
};
