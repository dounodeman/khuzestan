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

/** Reference view that would raise a value's confidence (used by the report to rank missing references). */
export type Needs = 'top' | 'side' | 'rear' | 'front' | 'detail';

/** Alternative value from another source, kept when sources disagree (never averaged). */
export interface AltValue<T = number> { value: T; src: string; conf?: Conf }

/** A single tagged value. `reason` explains the choice when `alt` lists disagreeing sources. */
export interface Tagged<T = number> { value: T; conf: Conf; src: string; alt?: AltValue<T>[]; reason?: string; needs?: Needs }

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
  role: 'hull' | 'turret' | 'fender' | 'skirt' | 'mantlet' | 'deck' | 'fuselage' | 'boom' | 'wing' | 'fin' | 'canopy' | 'sponson' | 'engine_cowl';
  points: OutlinePoint[];
  src: string;
  needs?: Needs;
  /** For `full` outlines on a real vehicle that is not symmetric: why (validator skips the symmetry test). */
  asymmetric_reason?: string;
}

export type PartKind =
  | 'hatch' | 'cupola' | 'periscope' | 'searchlight' | 'ventilator' | 'fuel_tank' | 'fuel_drum' | 'toolbox'
  | 'stowage' | 'spare_links' | 'log' | 'grille' | 'louvre' | 'exhaust' | 'mg' | 'headlight' | 'tow_hook'
  | 'lifting_eye' | 'weld' | 'panel_line' | 'bolt' | 'marking' | 'aerial' | 'snorkel' | 'other'
  // aircraft
  | 'pylon' | 'rocket_pod' | 'atgm_rail' | 'skid' | 'engine_intake' | 'chin_turret' | 'glazing';

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
  needs?: Needs;
}

export interface RunningGear {
  tracks?: {
    x_from: number; x_to: number; y_centre: number; width: number;
    /** Track link pitch, metres. */
    link_pitch: number;
    conf: Conf; src: string; needs?: Needs;
  };
  /** Road wheels, front to rear, with each wheel's own x so uneven spacing is explicit. */
  road_wheels?: { x: number[]; y_centre: number; dia: number; width: number; conf: Conf; src: string; needs?: Needs };
  /** Wheeled vehicles: axle x positions front to rear. */
  axles?: { x: number[]; y_centre: number; tyre_dia: number; tyre_width: number; conf: Conf; src: string; needs?: Needs };
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
  conf: Conf; src: string; needs?: Needs;
}

/** Helicopters: main rotor on the mast (hull frame), seen as blades plus a faint disc. */
export interface Rotor {
  mast: [number, number]; radius: number; blades: number;
  /** Blade chord, metres. */
  chord: number;
  /** Rotation seen from above. */
  spin: 'cw' | 'ccw';
  conf: Conf; src: string; needs?: Needs;
}

/** Tail rotor, seen edge-on from above as a thin bar along x. */
export interface TailRotor {
  pos: [number, number]; dia: number; side: 'left' | 'right';
  conf: Conf; src: string; needs?: Needs;
}

/** Everything the real vehicle has on its top surface, drawn or not, so no detail is silently dropped. */
export interface InventoryItem {
  id: string;
  what: string;
  /** drawn: a part or outline with this id exists; pending: confirmed to exist, position needs a reference;
   *  unconfirmed: existence or 1980-correctness not confirmed; excluded: post-1980 or a different variant;
   *  removed: was in the old sheet but does not belong on this vehicle. */
  status: 'drawn' | 'pending' | 'unconfirmed' | 'excluded' | 'removed';
  /** Part or outline id when drawn. */
  part?: string;
  conf: Conf; src: string; needs?: Needs;
}

/** What moved relative to the old approximate sheet (docs/vehicle_sheets_draft.md). */
export interface DraftChange { what: string; before: string; after: string; src: string }

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
  /** License or terms as stated on the source page (docs/reference_sources.md rules apply). */
  license: string;
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
  /** Real dimensions. Keys the validator checks against the geometry: hull_len, width (3% fail), overall_len,
   *  track_centres, track_on_ground, barrel_len (aircraft: fuselage_len, rotor_dia). */
  dimensions: Record<string, Tagged>;
  outlines: Record<string, Outline>;
  turret?: { pivot: [number, number]; ring_dia?: number; conf: Conf; src: string; needs?: Needs };
  gun?: Gun;
  running_gear: RunningGear;
  rotor?: Rotor;
  /** Second rotor for tandem-rotor helicopters (CH-47). */
  rotor2?: Rotor;
  tail_rotor?: TailRotor;
  parts: SheetPart[];
  /** Animation hooks, hull frame. */
  hooks: { exhaust: Tagged<Array<[number, number]>>; dust?: Tagged<Array<[number, number]>>; smoke?: Tagged<Array<[number, number]>> };
  /** Camo scheme ids (src/data/sprites/palette.ts), first is the default. */
  paint: { schemes: string[]; src: string };
  /** Every top-surface detail of the real vehicle and what happened to it. */
  detail_inventory: InventoryItem[];
  changes_from_draft: DraftChange[];
  excluded_details: string[];
  open_questions: string[];
  /** Notes kept in the human-readable sheet. */
  notes?: string[];
  /** Written critique of the latest render (what still looks wrong or generic). */
  critique?: string[];
}
