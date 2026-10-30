/**
 * Measured vehicle sheet schema (data/vehicle_sheets/<vehicle_id>.json).
 * The sheet is the single source of geometry: sprites are generated from it and nothing else.
 *
 * Confidence:
 *   A  measured on a calibrated plan view and agreeing with a published spec within 3%
 *   B  measured on a calibrated plan view or a clean side view, no second source
 *   C  estimated from perspective photos or from the old approximate sheet (or a spec number with no image check)
 *   X  unknown; `src` says what reference would settle it
 */
export type Conf = 'A' | 'B' | 'C' | 'X';

/** Alternative value from another source, kept when sources disagree (never averaged). */
export interface AltValue<T = number> { value: T; src: string; conf?: Conf }

/** A single tagged value. `reason` explains the choice when `alt` lists disagreeing sources. */
export interface Tagged<T = number> { value: T; conf: Conf; src: string; alt?: AltValue<T>[]; reason?: string }

/** Outline point: x, y and its tag. `smooth` makes the outline pass through it as a curve, not a corner. */
export type OutlinePoint = [number, number, { conf: Conf; smooth?: boolean; src?: string }];

export interface Outline {
  /** Coordinate frame: hull-local or turret-local (relative to the turret pivot). */
  frame: 'hull' | 'turret';
  /** half: RIGHT half from front-centre (y = 0) to rear-centre (y = 0), mirrored to close.
   *  side: one side's part (fender, skirt), drawn on the right and mirrored to the left.
   *  full: complete closed outline. */
  mirror: 'half' | 'side' | 'full';
  /** What the outline is, which decides its draw layer and paint. */
  role: 'hull' | 'turret' | 'fender' | 'skirt' | 'mantlet' | 'deck';
  points: OutlinePoint[];
  src: string;
  /** For `full` outlines on a real vehicle that is not symmetric: why (validator skips the symmetry test). */
  asymmetric_reason?: string;
}

export type PartKind =
  | 'hatch' | 'cupola' | 'periscope' | 'searchlight' | 'ventilator' | 'fuel_tank' | 'fuel_drum' | 'toolbox'
  | 'stowage' | 'spare_links' | 'log' | 'grille' | 'louvre' | 'exhaust' | 'mg' | 'headlight' | 'tow_hook'
  | 'lifting_eye' | 'weld' | 'panel_line' | 'bolt' | 'marking' | 'aerial' | 'other';

export interface SheetPart {
  id: string;
  kind: PartKind;
  frame: 'hull' | 'turret' | 'barrel';
  shape: 'circle' | 'rect' | 'ellipse' | 'poly' | 'line';
  /** Centre (circle, rect, ellipse). */
  pos?: [number, number];
  r?: number;
  /** Width along x, height along y (rect, ellipse). */
  size?: [number, number];
  /** Corner radius for rect. */
  corner?: number;
  /** Rotation in degrees. */
  rot?: number;
  /** Points for poly / line. */
  points?: Array<[number, number]>;
  /** Also draw the mirror image on the other side. */
  mirror?: boolean;
  /** Extra copies: explicit offsets, or count + step. */
  repeat?: { at: Array<[number, number]> } | { count: number; step: [number, number] };
  /** Outline the part must lie inside (validator), by outline id. */
  inside?: string;
  /** Hidden at damage state 1 (damaged) or 2 (destroyed). */
  lost_at?: 1 | 2;
  /** Stencil text for markings. */
  text?: string;
  /** Asymmetric by design (left-offset hatch etc.) - documents an intentional exception. */
  offset_reason?: string;
  conf: Conf;
  src: string;
}

export interface RunningGear {
  tracks?: {
    x_from: number; x_to: number; y_centre: number; width: number;
    /** Track link pitch, metres. */
    link_pitch: number;
    conf: Conf; src: string;
  };
  /** Road wheels, front to rear, with each wheel's own x so uneven spacing is explicit. */
  road_wheels?: { x: number[]; y_centre: number; dia: number; width: number; conf: Conf; src: string };
  /** Wheeled vehicles: axle x positions front to rear. */
  axles?: { x: number[]; y_centre: number; tyre_dia: number; tyre_width: number; conf: Conf; src: string };
}

export interface GunFitting {
  kind: 'bore_evacuator' | 'fume_extractor' | 'muzzle_brake' | 'thermal_sleeve' | 'mantlet_cover';
  /** Front end x along the barrel axis, turret frame. */
  x: number; len: number; dia: number;
  conf: Conf; src: string;
}

export interface Gun {
  calibre_mm: number;
  /** Barrel start (where it leaves the mantlet) and muzzle, turret frame along +x. */
  from_x: number; muzzle_x: number;
  dia: number;
  recoil: number;
  fittings: GunFitting[];
  conf: Conf; src: string;
}

export interface Reference {
  file: string; // name inside refs/<vehicle_id>/
  view: 'top' | 'side' | 'rear' | 'front' | 'detail';
  detail_of?: string;
  /** Perspective photo (not a true orthographic view): only ratios parallel to the image plane, conf C. */
  perspective: boolean;
  /** Dimension used to calibrate the image, e.g. 'hull_len'. */
  calibrated_to?: string;
  /** Shows post-1980 modifications (validator warns if excluded_details is empty). */
  later_mods_visible?: boolean;
  notes?: string;
  src: string; // where the image came from (see docs/reference_sources.md)
}

export interface VehicleSheet {
  id: string;
  name: string;
  variant: string;
  status: 'draft' | 'measured' | 'approved';
  kind: 'tracked' | 'wheeled' | 'heli' | 'drone' | 'towed';
  units: 'metres';
  axes: string;
  references: Reference[];
  /** Real dimensions. Keys used by the validator: hull_len, width, overall_len. */
  dimensions: Record<string, Tagged>;
  outlines: Record<string, Outline>;
  turret?: { pivot: [number, number]; ring_dia?: number; conf: Conf; src: string };
  gun?: Gun;
  running_gear: RunningGear;
  parts: SheetPart[];
  /** Animation hooks, hull frame. */
  hooks: { exhaust: Tagged<Array<[number, number]>>; dust?: Tagged<Array<[number, number]>>; smoke?: Tagged<Array<[number, number]>> };
  /** Camo scheme ids (src/data/sprites/palette.ts), first is the default. */
  paint: { schemes: string[]; src: string };
  excluded_details: string[];
  open_questions: string[];
  /** Notes kept in the human-readable sheet. */
  notes?: string[];
}
