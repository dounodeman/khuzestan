import type { GroundMaterial } from './types';

/**
 * Ground materials. Research: docs/environment_research.md section 2 (pale, silty, calcareous and saline
 * plain) and section 3 (sparse low salt scrub). Exact colours are (verify) until reference photos arrive.
 */
export const DESERT_PLAIN: GroundMaterial = {
  id: 'desert_plain',
  name: 'Desert plain (silt, sand, gravel)',
  surfaces: [
    // Base: pale buff silt.
    { id: 'silt', color: ['#c4b089', '#b5a07a'], grain: 0.35, height: 0 },
    // Packed, slightly greyer ground on flats and old tracks.
    { id: 'packed', color: ['#ab9d80', '#9f9175'], grain: 0.25, height: -0.05, scale: 70, threshold: 0.55, softness: 0.2, strength: 0.6 },
    // Loose wind-blown sand: lighter, mounded, rippled.
    { id: 'sand', color: ['#d3bf8f', '#c8b07c'], grain: 0.45, height: 0.35, scale: 55, threshold: 0.6, softness: 0.18, strength: 0.7 },
    // Gravel lag: darker, stony.
    { id: 'gravel', color: ['#9a8b72', '#8b7d66'], grain: 0.8, height: 0.05, scale: 38, threshold: 0.68, softness: 0.14, strength: 0.55 },
  ],
  warp: { scale: 160, amount: 18 },
  drift: [
    { color: '#a88762', scale: 420, strength: 0.22 }, // browner
    { color: '#a8a597', scale: 360, strength: 0.18 }, // greyer (saline, calcareous)
    { color: '#b98c62', scale: 520, strength: 0.12 }, // redder
  ],
  relief: { scale: 90, amplitude: 1.2 },
  micro: [
    { kind: 'dots', density: 26, on: 'gravel', size: [0.08, 0.22], colors: ['#6f6352', '#857a68', '#5d5446', '#a29680'], height: 0.08, lod: { minZoom: 1.6, fade: 1 } },
    { kind: 'dots', density: 14, size: [0.06, 0.16], colors: ['#7d705c', '#988b74'], height: 0.05, lod: { minZoom: 2.2, fade: 1 } },
    // Salt-tolerant scrub (Seidlitzia, Halocnemum): small grey-olive clumps on low hummocks.
    { kind: 'tufts', density: 1.4, size: [0.5, 1.3], colors: ['#7d7f5a', '#8a8862', '#6d6f4c', '#99916a'], height: 0.5, lod: { minZoom: 0.9, fade: 0.8 }, sway: 0.3 },
    // Dry grass (Aeluropus-like), mostly on packed ground.
    { kind: 'blades', density: 6, on: 'packed', size: [0.25, 0.6], colors: ['#b4a27a', '#a3936b', '#c2b38b'], height: 0.2, lod: { minZoom: 2.4, fade: 1.2 }, sway: 0.6 },
    // Wind ripples on loose sand, perpendicular to the prevailing westerly wind.
    { kind: 'ripples', density: 6, on: 'sand', size: [1.6, 3.2], colors: ['#a68f62'], lod: { minZoom: 2, fade: 1.2 } },
  ],
  farColor: '#c1ad86',
  gameplay: { cover: 'none', concealment: 0, los: 'none', move: { tracked: 1, wheeled: 0.8, foot: 1, amphibious: 1 } },
  notes: 'Movement values mirror the existing Sand tile in src/data/terrain.ts.',
};

export const GROUNDS: Record<string, GroundMaterial> = {
  [DESERT_PLAIN.id]: DESERT_PLAIN,
};
