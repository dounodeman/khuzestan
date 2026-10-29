/** Colour tokens and camo schemes for vector sprites (docs/vehicle_sheets.md §2). */

export const SPRITE_COLORS: Record<string, string> = {
  IQ_SAND: '#C8B07E',
  IQ_SAND_SHADE: '#A98F5E',
  IQ_OLIVE: '#5E6238',
  IQ_BROWN: '#6B4F32',
  IR_OLIVE: '#4F5A3A',
  IR_SAND: '#BFA877',
  IR_DARK: '#3B3F2E',
  STEEL: '#3A3B36',
  RUBBER: '#1F1F1D',
  GUN: '#2F302C',
  GLASS: '#5E8C93',
  STENCIL: '#E8E2CF',
  // Renderer-only tokens
  EDGE: 'rgba(20,16,10,0.55)', // default outline
  LINE: 'rgba(20,16,10,0.45)', // panel lines, welds
  INTERIOR: '#222220', // open hatches, troop bays
  WOOD: '#7A5A36', // unditching beam
  TRACK_PIN: '#4A4A44',
};

/**
 * Camo scheme: a base colour plus seeded noise blotches. `coverage` is the fraction of the surface
 * each blotch colour takes; `scale` is the blotch size in metres.
 */
export interface CamoScheme {
  label: string;
  base: string;
  blotches: Array<{ color: string; coverage: number; scale: number }>;
}

export const CAMO_SCHEMES: Record<string, CamoScheme> = {
  iq_sand: { label: 'Iraq 1980: overall sand', base: 'IQ_SAND', blotches: [] },
  iq_sand_olive: { label: 'Iraq 1980: sand, olive blotches', base: 'IQ_SAND', blotches: [{ color: 'IQ_OLIVE', coverage: 0.28, scale: 1.6 }] },
  iq_sand_brown: { label: 'Iraq 1980: sand, brown blotches', base: 'IQ_SAND', blotches: [{ color: 'IQ_BROWN', coverage: 0.25, scale: 1.4 }] },
  ir_olive: { label: 'Iran 1980: olive drab', base: 'IR_OLIVE', blotches: [] },
  ir_olive_dark: { label: 'Iran 1980: olive, dark patches', base: 'IR_OLIVE', blotches: [{ color: 'IR_DARK', coverage: 0.3, scale: 1.8 }] },
  ir_sand_dark: { label: 'Iran 1980: sand, dark patches', base: 'IR_SAND', blotches: [{ color: 'IR_DARK', coverage: 0.3, scale: 1.6 }] },
};

export function color(ref: string, base: string): string {
  if (ref === 'BASE') return SPRITE_COLORS[base] ?? base;
  return SPRITE_COLORS[ref] ?? ref;
}
