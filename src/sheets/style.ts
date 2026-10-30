/**
 * Rendering style per outline role and part kind: layer, paint token, shading, detail level.
 * Appearance only. No vehicle dimension or coordinate lives here; all geometry comes from the sheets.
 * `ao` and `strokeW` are line weights for the look of plates and outlines, not vehicle measurements.
 */
import type { Layer, Lod, Shade } from '../data/sprites/types';
import type { Outline, PartKind } from './schema';

export interface Style { layer: Layer; fill: string | null; shade: Shade; lod: Lod; ao?: number; stroke?: string | null; strokeW?: number }

export const OUTLINE_STYLE: Record<Outline['role'], Style> = {
  hull: { layer: 'hull', fill: 'BASE', shade: 'plate', lod: 0 },
  fender: { layer: 'hull', fill: 'BASE', shade: 'plate', lod: 0 },
  skirt: { layer: 'hull', fill: 'BASE', shade: 'plate', lod: 0 },
  deck: { layer: 'hullDetail', fill: 'BASE', shade: 'recess', lod: 1 },
  turret: { layer: 'turret', fill: 'BASE', shade: 'dome', lod: 0, ao: 0.1 },
  mantlet: { layer: 'turret', fill: 'BASE', shade: 'dome', lod: 1, ao: 0.04 },
};

export const PART_STYLE: Record<PartKind, Style> = {
  hatch: { layer: 'hullDetail', fill: 'BASE', shade: 'plate', lod: 1, ao: 0.04 },
  cupola: { layer: 'hullDetail', fill: 'BASE', shade: 'dome', lod: 1, ao: 0.05 },
  periscope: { layer: 'hullDetail', fill: 'STEEL', shade: 'flat', lod: 2 },
  searchlight: { layer: 'hullDetail', fill: 'STEEL', shade: 'plate', lod: 1 },
  ventilator: { layer: 'hullDetail', fill: 'BASE', shade: 'dome', lod: 1 },
  fuel_tank: { layer: 'hullDetail', fill: 'BASE', shade: 'cylinder', lod: 1 },
  fuel_drum: { layer: 'hullDetail', fill: 'BASE', shade: 'cylinder', lod: 1 },
  toolbox: { layer: 'hullDetail', fill: 'BASE', shade: 'plate', lod: 1 },
  stowage: { layer: 'hullDetail', fill: 'BASE', shade: 'plate', lod: 2 },
  spare_links: { layer: 'hullDetail', fill: 'RUBBER', shade: 'flat', lod: 2 },
  log: { layer: 'hullDetail', fill: 'WOOD', shade: 'cylinder', lod: 1 },
  grille: { layer: 'hullDetail', fill: 'STEEL', shade: 'recess', lod: 1 },
  louvre: { layer: 'hullDetail', fill: null, shade: 'flat', lod: 2, stroke: 'rgba(0,0,0,0.55)', strokeW: 0.03 },
  exhaust: { layer: 'hullDetail', fill: 'INTERIOR', shade: 'recess', lod: 1 },
  mg: { layer: 'hullDetail', fill: 'GUN', shade: 'cylinder', lod: 1 },
  headlight: { layer: 'hullDetail', fill: 'STEEL', shade: 'dome', lod: 2 },
  tow_hook: { layer: 'hullDetail', fill: 'STEEL', shade: 'plate', lod: 2 },
  lifting_eye: { layer: 'hullDetail', fill: 'STEEL', shade: 'flat', lod: 3 },
  weld: { layer: 'hullDetail', fill: null, shade: 'flat', lod: 3, strokeW: 0.02 },
  panel_line: { layer: 'hullDetail', fill: null, shade: 'flat', lod: 3, strokeW: 0.015 },
  bolt: { layer: 'hullDetail', fill: 'STEEL', shade: 'flat', lod: 3, stroke: null },
  marking: { layer: 'markings', fill: 'STENCIL', shade: 'flat', lod: 1 },
  aerial: { layer: 'hullDetail', fill: 'STEEL', shade: 'flat', lod: 2 },
  other: { layer: 'hullDetail', fill: 'BASE', shade: 'plate', lod: 1 },
};

/** Turret-frame parts draw on the turret-detail layer, barrel-frame parts on the barrel layer. */
export function layerFor(s: Style, frame: 'hull' | 'turret' | 'barrel'): Layer {
  if (s.layer === 'markings') return 'markings';
  if (frame === 'barrel') return 'barrel';
  if (frame === 'turret') return s.layer === 'hullDetail' ? 'turretDetail' : s.layer;
  return s.layer;
}

export const RUNNING = {
  track: { fill: 'RUBBER', shade: 'flat' as Shade, cornerOfWidth: 0.2 },
  links: { stroke: 'rgba(80,78,70,0.9)', strokeW: 0.025, lod: 2 as Lod },
  wheel: { fill: 'STEEL', shade: 'plate' as Shade, cornerOfWidth: 0.18 },
  tyre: { fill: 'RUBBER', shade: 'plate' as Shade, cornerOfWidth: 0.3 },
  barrel: { fill: 'GUN', shade: 'cylinder' as Shade },
  fitting: { fill: 'GUN', shade: 'cylinder' as Shade, cornerOfDia: 0.25 },
};
