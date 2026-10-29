/**
 * Environment data format: ground materials, props, lighting and weather.
 * Everything visual is described as data and drawn by the generic renderers in src/render/env/.
 *
 * Units: metres for sizes, pixels-per-metre for zoom (the same scale as Camera.zoom).
 * Colours are '#rrggbb'. A ColorRange is [healthy/fresh, dry/worn]; instances mix between the two.
 *
 * Gameplay fields (cover, concealment, LOS, movement) are declared here so every prop and ground carries them,
 * but they are NOT yet read by the simulation: src/data/terrain.ts still drives gameplay until the integration
 * step is agreed.
 */
import type { MoveClass } from '../terrain';

export type Rgb = string;
export type ColorRange = [Rgb, Rgb];
export type Range = [number, number];

export type CoverLevel = 'none' | 'light' | 'heavy';
export type LosEffect = 'none' | 'reduce' | 'block';
export type GroundMoveClass = Exclude<MoveClass, 'air'>;

export interface GameplayProps {
  cover: CoverLevel;
  /** 0..1: how much this hides units inside it from spotting (0 open ground, 1 fully hidden). */
  concealment: number;
  los: LosEffect;
  /** Speed multiplier per class when crossing it (omitted = unchanged). */
  move?: Partial<Record<GroundMoveClass, number>>;
  /** Infantry squads that can garrison it. */
  garrison?: number;
}

/** Zoom window for a layer or detail: drawn when minZoom <= zoom < maxZoom, faded in over `fade` px/m. */
export interface Lod {
  minZoom?: number;
  maxZoom?: number;
  fade?: number;
}

// ---------------------------------------------------------------------------------------------------- ground

/** One surface inside a ground material (e.g. loose sand, packed silt, gravel). */
export interface GroundSurface {
  id: string;
  /** Base colour pair, mixed by mid-scale noise for intra-surface variation. */
  color: ColorRange;
  /** Fine grain contrast (0..1); fades out when a pixel covers more than the grain size. */
  grain: number;
  /** Relief added by this surface in metres (sand slightly mounded, ruts negative). */
  height?: number;
  /**
   * Where this surface appears: noise at `scale` metres passed through a soft threshold.
   * The first surface is the base and ignores these fields.
   */
  scale?: number;
  threshold?: number;
  softness?: number;
  strength?: number;
}

/** Large-scale colour drift so open ground never repeats (browner, greyer, redder patches). */
export interface ColorDrift {
  color: Rgb;
  scale: number;
  strength: number;
}

export type MicroKind = 'dots' | 'tufts' | 'blades' | 'ripples' | 'cracks';

/** Small scattered detail drawn only at medium and close zoom. Placement is stable in world space. */
export interface MicroDetail {
  kind: MicroKind;
  /** Items per 100 m2 where the host surface is fully present. */
  density: number;
  /** Surface whose weight scales the density (omitted = everywhere). */
  on?: string;
  size: Range;
  colors: Rgb[];
  /** Height in metres for the cast shadow (0 = flat mark). */
  height?: number;
  lod: Lod;
  /** Wind sway amount (0 = rigid). */
  sway?: number;
}

export interface GroundMaterial {
  id: string;
  name: string;
  /** Surfaces blended in order; the first is the base. */
  surfaces: GroundSurface[];
  /** Domain warp in metres applied before surface noise (breaks up straight noise contours). */
  warp: { scale: number; amount: number };
  drift: ColorDrift[];
  /** Gentle relief (metres) from layered noise, used for top-down shading. */
  relief: { scale: number; amplitude: number };
  micro: MicroDetail[];
  /** Flat colour used at far zoom and on the radar/minimap. */
  farColor: Rgb;
  gameplay: GameplayProps;
  notes?: string;
}

// ----------------------------------------------------------------------------------------------------- props

/**
 * Drawing primitives. All coordinates are in the prop's local frame, in metres, before instance rotation and
 * scale; +x is the prop's "forward" (used e.g. as the fall direction of a felled tree).
 * `z` is the height above ground in metres and drives the cast shadow and wind sway.
 * `at` offsets a layer; `atH` offsets it in fractions of the prop height (for felled trees).
 */
interface LayerBase {
  at?: [number, number];
  atH?: [number, number];
  z?: number;
  /** Fraction of prop height instead of metres (z = zH * height). */
  zH?: number;
  lod?: Lod;
  /** Draw only into the shadow pass (e.g. a palm trunk hidden under its crown). */
  shadowOnly?: boolean;
  /** Excluded from the shadow pass (flat marks on the ground). */
  noShadow?: boolean;
  /** Wind sway factor. */
  sway?: number;
  alpha?: number;
}

export interface DiscLayer extends LayerBase { shape: 'disc'; r: number | Range; fill: Rgb | ColorRange; stroke?: Rgb; rx?: number; ry?: number }
export interface RectLayer extends LayerBase { shape: 'rect'; w: number; h: number; fill: Rgb | ColorRange; stroke?: Rgb; rot?: number }
export interface PolyLayer extends LayerBase { shape: 'poly'; pts: [number, number][]; fill: Rgb | ColorRange; stroke?: Rgb }
/** A straight tapered stroke from ground (z0) up to z1, e.g. trunks and poles; seen top-down only as shadow. */
export interface StemLayer extends LayerBase { shape: 'stem'; width: number; z0: number; z1: number; fill: Rgb }
/** A log lying on the ground along +x (felled trunks, fallen poles). */
export interface LogLayer extends LayerBase { shape: 'log'; length: number; lengthH?: number; width: number; fill: Rgb; ring?: Rgb }
/**
 * Radial cluster of tapered leaves (palm crowns, reed clumps, scrub, agave). Each leaf curves slightly and
 * its projected length shrinks with `droop` (a drooping leaf seen from above looks shorter).
 */
export interface LeavesLayer extends LayerBase {
  shape: 'leaves';
  count: Range;
  length: Range;
  width: number;
  droop: number;
  /** Curl of each leaf in radians. */
  curl: number;
  fill: ColorRange;
  /** Midrib colour, drawn at close zoom. */
  rib?: Rgb;
  /** Leaflet notches along the edge (palm fronds are pinnate). */
  pinnate?: boolean;
  /** Fraction of leaves drawn (destruction states thin the crown). */
  keep?: number;
  /** Fraction of leaves snapped short. */
  broken?: number;
}
/** Small items scattered in a radius (debris, fallen fronds, date clusters). */
export interface ScatterLayer extends LayerBase { shape: 'scatter'; count: Range; radius: number; size: Range; fill: Rgb[]; kind: 'dot' | 'chip' | 'stick' }
/** Soft radial gradient on the ground (scorch marks, wet patches, glow). */
export interface StainLayer extends LayerBase { shape: 'stain'; r: number; fill: Rgb; strength: number }

export type PropLayer = DiscLayer | RectLayer | PolyLayer | StemLayer | LogLayer | LeavesLayer | ScatterLayer | StainLayer;

export type DestructionStateId = 'intact' | 'damaged' | 'burnt' | 'felled' | 'collapsed' | 'rubble' | 'destroyed';

export interface PropState {
  label: string;
  layers: PropLayer[];
  /** Gameplay overrides for this state (e.g. a felled palm no longer blocks sight). */
  gameplay?: Partial<GameplayProps>;
  /** Darkening towards soot (0..1) applied to every fill. */
  char?: number;
  /** Persistent effect hook drawn by the effects system (not by the prop renderer). */
  effect?: 'smoke' | 'fire' | 'dust';
}

export type PropCategory = 'vegetation' | 'building' | 'industry' | 'infrastructure' | 'military' | 'debris';

export interface PropDef {
  id: string;
  name: string;
  category: PropCategory;
  /** Ground footprint in metres (circle uses w as diameter). */
  footprint: { shape: 'circle' | 'rect'; w: number; h: number };
  /** Typical height in metres (shadow length, LOS). */
  height: number;
  gameplay: GameplayProps;
  /** Hit points; damage walks the `progression` list. */
  hp: number;
  progression: DestructionStateId[];
  states: Partial<Record<DestructionStateId, PropState>> & { intact: PropState };
  /** Hidden below this zoom; groups (groves, towns) are drawn as solid shapes there instead. */
  lod: Lod;
  /** Per-instance variation. */
  variation: { scale: Range; health: Range; lean?: number };
  /** Sources backing the look, from docs/environment_research.md. */
  research?: string[];
}

// ------------------------------------------------------------------------------------------ lighting/weather

export interface LightPreset {
  id: string;
  name: string;
  /** Direction the light comes FROM, degrees clockwise from screen-up (north). */
  sunAzimuth: number;
  /** Degrees above the horizon; drives shadow length and relief contrast. */
  sunElevation: number;
  /** Multiplied over the scene (white = unchanged). */
  ambient: Rgb;
  /** Coloured light added with 'soft-light'. */
  tint: Rgb;
  tintAlpha: number;
  /** 1 = full colour, 0 = greyscale. */
  saturation: number;
  shadow: { color: Rgb; alpha: number };
  /** Sky colour reflected in water. */
  sky: Rgb;
  /** Spotting range multiplier for the gameplay hook. */
  visibility: number;
}

export interface WeatherPreset {
  id: string;
  name: string;
  /** Flat veil over the scene. */
  veil: Rgb;
  veilAlpha: number;
  /** Drifting sheets (dust storm) drawn as large soft noise bands moving with the wind. */
  sheets: number;
  /** Shadows weaken under overcast or dust. */
  shadowMul: number;
  visibility: number;
  windSpeed: number;
}
