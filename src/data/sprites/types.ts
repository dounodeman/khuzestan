/**
 * Vector sprite data format (v2). Pure data: one generic renderer (src/render/vector) draws every vehicle.
 *
 * Coordinates are metres. Authored at heading 0 facing +X; +Y is the vehicle's RIGHT side.
 * Hull-local origin is the centre of the hull bounding box. Parts in a group are in that group's local frame
 * (turret parts are relative to the turret pivot, rotor parts to the mast).
 */

/** Path commands. Angles are degrees, measured from +X toward +Y (clockwise on screen). */
export type PathCmd =
  | ['M', number, number]
  | ['L', number, number]
  | ['Q', number, number, number, number] // control, end
  | ['C', number, number, number, number, number, number] // control 1, control 2, end
  | ['A', number, number, number, number, number, boolean?] // centre x, y, radius, start°, end°, counter-clockwise
  | ['Z'];

export type Shape =
  | { path: PathCmd[]; closed?: boolean } // closed defaults to true
  | { rect: [number, number, number, number]; r?: number } // min x, min y, width, height, corner radius
  | { circle: [number, number, number] } // centre x, y, radius
  | { ellipse: [number, number, number, number, number?] }; // centre x, y, rx, ry, rotation°

/** Draw order, bottom to top. Each layer can be toggled in the Sprite Lab. */
export type Layer = 'running' | 'hull' | 'hullDetail' | 'turret' | 'turretDetail' | 'barrel' | 'markings' | 'damage' | 'rotor';
export const LAYERS: Layer[] = ['running', 'hull', 'hullDetail', 'turret', 'turretDetail', 'barrel', 'markings', 'damage', 'rotor'];

/**
 * Shading hint for the fake top-down light (from the upper left of the screen, whatever the heading).
 * plate: highlight on lit edges, dark inner edge on the far edges. dome: plate + radial highlight.
 * cylinder: gradient across the long axis. recess: inverted plate (hatch wells, grilles). flat: none.
 */
export type Shade = 'plate' | 'dome' | 'cylinder' | 'recess' | 'flat';

/**
 * Level of detail, chosen from screen pixels per metre:
 * 0 silhouette (always), 1 details (>= 4 px/m), 2 hatch outlines, stowage, tread (>= 8 px/m),
 * 3 panel lines, welds, rivets, bolt heads (>= 16 px/m).
 */
export type Lod = 0 | 1 | 2 | 3;
export const LOD_PX_PER_M: Record<Lod, number> = { 0: 0, 1: 4, 2: 8, 3: 16 };

/**
 * Instancing. Offsets are added to the part's own coordinates.
 * at: explicit offsets (uneven road-wheel spacing etc.). linear: count copies stepping by `step`.
 * path: copies along a path every `spacing` metres, each rotated to the path tangent.
 * `scroll` shifts instances along their run by the track phase and wraps them (track links, cleats).
 */
export type Repeat =
  | { kind: 'at'; offsets: Array<[number, number]> }
  | { kind: 'linear'; count: number; step: [number, number]; scroll?: 'track' }
  | { kind: 'path'; path: PathCmd[]; spacing: number; scroll?: 'track' };

/** Fill / stroke colour: a palette token (see palette.ts), 'BASE' (camo base) or a CSS colour. */
export type ColorRef = string;

export interface Part {
  id: string;
  layer: Layer;
  /** Transform group; defaults to 'hull'. */
  group?: string;
  shape: Shape;
  fill?: ColorRef | null; // null = stroke only
  stroke?: ColorRef | null; // null = no outline; default EDGE
  /** Outline width in metres (default 0.03); never drawn thinner than 0.6 px. */
  strokeW?: number;
  shade?: Shade;
  /** Soft ambient-occlusion band (metres) drawn around the part, onto whatever is beneath it. */
  ao?: number;
  /** 'join': the path is the RIGHT half from front-centre to rear-centre; close it with its mirror image.
   *  'copy': draw the part and a mirror copy on the other side (y -> -y). */
  mirror?: 'join' | 'copy';
  repeat?: Repeat;
  lod?: Lod;
  /** Clip to another part's outline (same group), e.g. track cleats clipped to the track strip. */
  clip?: string;
  /** Receives the camo pattern. Defaults to true when fill is 'BASE'. */
  camo?: boolean;
  /** Hidden at or above this damage state (1 damaged, 2 destroyed): stowage, fuel drums, aerials. */
  lostAt?: 1 | 2;
  /** Measurement tags read by the Sprite Lab. */
  measure?: 'roadWheels';
  /** Stencilled text (markings layer); `{num}` is replaced by the unit's tactical number. */
  text?: { str: string; size: number; rot?: number };
  /** Data note shown in the lab, e.g. '(verify) side of searchlight'. */
  note?: string;
}

export interface Group {
  parent?: string; // defaults to 'hull'
  pivot: [number, number]; // in the parent's frame
  /** Which live angle rotates this group. */
  rotate?: 'turret' | 'rotor';
  /** Recoil travel in metres along the group's -X axis. */
  recoil?: number;
}

/** A dimension check shown in the Sprite Lab, measured from the geometry. */
export type MeasureKey =
  | 'hullLength' // running gear + hull, x extent
  | 'width' // running gear + hull, y extent
  | 'overallLength' // everything with turret forward, no recoil (rotor discs excluded)
  | 'gunOverhang' // muzzle x minus hull front x
  | 'turretPivotFromFront' // hull front x minus turret pivot x
  | 'roadWheelGaps' // centre-to-centre gaps of the part tagged roadWheels, front to rear
  | 'rotorDiameter';

export interface SpecItem {
  measure: MeasureKey;
  target: number | number[];
  /** Fractional tolerance, default 0.03. */
  tol?: number;
  source?: string;
  verify?: boolean;
}

export interface SpritePaint {
  /** Camo scheme ids from palette.ts; the first is the default. */
  schemes: string[];
}

export interface SpriteDef {
  id: string; // matches the unit id in src/data/units
  name: string;
  status: 'placeholder' | 'pass1' | 'pass2' | 'pass3' | 'approved';
  kind: 'tracked' | 'wheeled' | 'heli' | 'drone' | 'towed';
  groups: Record<string, Group>;
  parts: Part[];
  paint: SpritePaint;
  spec: SpecItem[];
  /** Animation hooks (hull-local unless noted). */
  hooks: {
    muzzle?: { group: string; at: Array<[number, number]> };
    exhaust?: Array<[number, number]>;
    smoke?: Array<[number, number]>;
    dust?: Array<[number, number]>;
  };
  /** Free-text provenance, e.g. 'docs/vehicle_sheets.md §3.1'. */
  source: string;
}
