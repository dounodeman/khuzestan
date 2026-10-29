import type { PropDef } from './types';

/**
 * Prop definitions. One generic renderer (src/render/env/props.ts) draws all of them from these layers.
 */

const FROND_GREEN: [string, string] = ['#56702f', '#8f8a4c']; // healthy → drought-stressed
const FROND_OLD: [string, string] = ['#4a5f2a', '#857652']; // lower drooping ring, older and drier
const TRUNK = '#6d5a3f';
const CHAR = '#2a241d';

export const DATE_PALM: PropDef = {
  id: 'date_palm',
  name: 'Date palm',
  category: 'vegetation',
  footprint: { shape: 'circle', w: 0.6, h: 0.6 },
  height: 12,
  gameplay: { cover: 'light', concealment: 0.35, los: 'reduce', move: { wheeled: 0.85, tracked: 0.95 } },
  hp: 60,
  progression: ['intact', 'damaged', 'burnt', 'felled'],
  states: {
    intact: {
      label: 'Intact',
      layers: [
        { shape: 'stem', width: 0.5, z0: 0, z1: 1, zH: 0, fill: TRUNK, shadowOnly: true, lod: { minZoom: 1.1, fade: 0.4 } },
        // Far LOD: a single readable crown disc.
        { shape: 'disc', r: [3.4, 4.2], zH: 1, fill: ['#4f6830', '#7d7a48'], lod: { maxZoom: 1.3, fade: 0.4 } },
        // Old, drooping outer fronds (look shorter from above, drier colour).
        { shape: 'leaves', count: [11, 15], length: [3.6, 4.4], width: 0.7, droop: 0.32, curl: 0.25, zH: 0.96, fill: FROND_OLD, rib: '#9c9468', pinnate: true, sway: 0.8, lod: { minZoom: 1.0, fade: 0.4 } },
        // Young upright fronds on top.
        { shape: 'leaves', count: [8, 12], length: [2.4, 3.2], width: 0.6, droop: 0.12, curl: 0.18, zH: 1, fill: FROND_GREEN, rib: '#b9b27c', pinnate: true, sway: 1, lod: { minZoom: 1.0, fade: 0.4 } },
        // Ripe date clusters in September, half hidden under the crown (verify harvest timing).
        { shape: 'scatter', count: [3, 6], radius: 1.1, size: [0.35, 0.5], fill: ['#c8862f', '#b0702a', '#d39b3c'], kind: 'dot', zH: 0.9, lod: { minZoom: 3.5, fade: 1 } },
        { shape: 'disc', r: 0.45, zH: 1, fill: '#6b5a36', lod: { minZoom: 2.5 } },
      ],
    },
    damaged: {
      label: 'Damaged (shrapnel)',
      gameplay: { concealment: 0.2 },
      layers: [
        { shape: 'stem', width: 0.5, z0: 0, z1: 1, zH: 0, fill: TRUNK, shadowOnly: true, lod: { minZoom: 1.1, fade: 0.4 } },
        { shape: 'disc', r: [2.6, 3.2], zH: 1, fill: ['#5a6634', '#7a6f46'], lod: { maxZoom: 1.3, fade: 0.4 } },
        { shape: 'leaves', count: [11, 15], length: [3.6, 4.4], width: 0.7, droop: 0.5, curl: 0.4, zH: 0.9, fill: ['#6e6a3c', '#7b6847'], rib: '#9c9468', pinnate: true, keep: 0.55, broken: 0.4, sway: 0.9, lod: { minZoom: 1.0, fade: 0.4 } },
        { shape: 'leaves', count: [8, 12], length: [2.4, 3.2], width: 0.6, droop: 0.15, curl: 0.2, zH: 1, fill: FROND_GREEN, rib: '#b9b27c', pinnate: true, keep: 0.6, broken: 0.3, sway: 1, lod: { minZoom: 1.0, fade: 0.4 } },
        { shape: 'disc', r: 0.45, zH: 1, fill: '#6b5a36', lod: { minZoom: 2.5 } },
        // Fallen fronds on the ground.
        { shape: 'scatter', count: [2, 4], radius: 4, size: [2.2, 3.4], fill: ['#857652', '#8f7d55'], kind: 'stick', z: 0, noShadow: true, lod: { minZoom: 2 } },
      ],
    },
    burnt: {
      label: 'Burnt',
      char: 0.75,
      effect: 'smoke',
      gameplay: { cover: 'light', concealment: 0.05, los: 'none' },
      layers: [
        { shape: 'stain', r: 4.5, fill: CHAR, strength: 0.45, z: 0, noShadow: true },
        { shape: 'stem', width: 0.5, z0: 0, z1: 1, zH: 0, fill: CHAR, shadowOnly: true },
        { shape: 'leaves', count: [6, 9], length: [0.9, 1.6], width: 0.35, droop: 0.2, curl: 0.3, zH: 1, fill: ['#2f2820', '#3d3328'], keep: 1, sway: 0.2 },
        { shape: 'disc', r: 0.4, zH: 1, fill: '#2a2018' },
        { shape: 'scatter', count: [5, 9], radius: 3.5, size: [0.25, 0.7], fill: ['#4a4038', '#5c5046', '#3c342c'], kind: 'chip', z: 0, noShadow: true, lod: { minZoom: 2 } },
      ],
    },
    felled: {
      label: 'Felled',
      gameplay: { cover: 'light', concealment: 0.1, los: 'none', move: { wheeled: 0.6, tracked: 0.85, foot: 0.9 } },
      layers: [
        { shape: 'disc', r: 0.5, z: 0.6, fill: '#5d4a32', stroke: '#3c2f20' }, // stump
        { shape: 'log', length: 0, lengthH: 0.95, width: 0.55, z: 0.5, fill: TRUNK, ring: '#9a8460' },
        { shape: 'leaves', count: [10, 14], length: [2.6, 3.8], width: 0.65, droop: 0.05, curl: 0.5, atH: [0.97, 0], z: 0.8, fill: ['#6f7340', '#8e7b51'], rib: '#9c9468', pinnate: true, keep: 0.8, broken: 0.3 },
        { shape: 'scatter', count: [3, 5], radius: 2.5, size: [0.3, 0.6], fill: ['#7b6a4c', '#8b7550'], kind: 'chip', z: 0, noShadow: true, lod: { minZoom: 2.5 } },
      ],
    },
  },
  lod: { minZoom: 0 },
  variation: { scale: [0.8, 1.15], health: [0.15, 1], lean: 0.12 },
  research: ['docs/environment_research.md §3 Vegetation'],
};

export const PROPS: Record<string, PropDef> = {
  [DATE_PALM.id]: DATE_PALM,
};
