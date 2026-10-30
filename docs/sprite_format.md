# Vector sprite format (v2), vehicle sheets and Sprite Lab

## Accuracy pipeline

```
refs/<id>/ images (git-ignored) --Sprite Lab: calibrate, mask, mark--> data/vehicle_sheets/<id>.json
  --src/sheets/generate.ts--> SpriteDef --src/render/vector--> pixels --Lab Compare--> IoU, outline cm, part cm
```

- **Sheets** (`data/vehicle_sheets/<id>.json`, schema in `src/sheets/schema.ts`) are the only source of geometry.
  Every value carries a confidence tag (A/B/C/X) and a source. Disagreeing sources are kept in `alt` with the
  `reason` for the chosen value, never averaged.
- **Generator** (`src/sheets/generate.ts`) turns a sheet into the sprite data below. Rendering style per part kind
  lives in `src/sheets/style.ts` and holds no vehicle dimensions or coordinates.
- **Validator**: `npm run check-sheets` fails on missing tags or sources, open, self-intersecting or asymmetric
  outlines (unless `asymmetric_reason`), parts outside their declared outline, off-centre parts without
  `offset_reason`, hull length or width more than 3% from the stated dimension, conf A without a calibrated plan
  view, and a stale `docs/vehicle_sheets.md`. It warns on missing reference views and on later modifications
  with an empty `excluded_details`.
- **Docs**: `npm run sheets-doc` regenerates `docs/vehicle_sheets.md` from the JSON. The old approximate sheet is
  kept as `docs/vehicle_sheets_draft.md`.
- **Compare** (Sprite Lab, right panel): overlay, difference and side-by-side modes; draw a mask polygon on the
  reference and approve it; mark part positions on the reference; compute silhouette IoU (hull + turret, no gun),
  outline distance mean/max in cm, and position error per part. Pass: IoU >= 0.95, max outline <= 8 cm, parts
  <= 10 cm (conf A/B parts only; C/X are shown, not counted). Calibration, mask and marks are saved as sidecar files
  next to the image in `refs/<id>/` (`<image>.calib.json`, `.mask.png`, `.mask.json`, `.points.json`).
  Measure at heading 0: comparison works in the hull frame.
- **Weak-data markers** (lab toggle, `?weak=1`): dashed boxes on conf C (magenta) and X (red) parts, diamonds on
  weak outline points.
- **Side views**: a reference whose file name starts with `side` gets side-view marks (hull_front, hull_rear,
  turret_pivot, muzzle, fittings, road wheels, ground, turret_top). Positions are compared as distances from the
  hull front; `check-sheets` cross-checks top against side marks (3%) and the marked height against
  `dimensions.height`.
- **Reference intake**: `npm run refs-inventory` lists every vehicle's images by view (from the file name:
  `top`, `side`, `rear`, `front`, `detail-<what>`), the missing required views and any unclear names.
- **Report**: `npm run vehicle-report -- <id>` (dev server running) collects saved compare results and the 64 px
  confusability check, saves screenshots to `refs/<id>/report/` and writes `docs/vehicle_reports/<id>.md`.
- **Contact sheet** shows every vehicle at one scale: sheet-generated sprites, and the legacy game sprite (red
  label) where no sheet exists yet, with game-zoom renders underneath.
- Self-tests: `npm run check-sheets:selftest` (validator catches 20 deliberate breakages per sheet and the
  top/side cross-check) and `npm run lab-selftest` (compare maths on a synthetic shifted silhouette and side marks).
- Requirement-by-requirement status: `docs/pipeline_traceability.md`.

## Sprite data

Generated sprite data (`SpriteDef`) is drawn by one generic renderer in `src/render/vector/`. There are no
per-vehicle draw functions. Types live in `src/data/sprites/types.ts`.

### Coordinates
Metres. Authored at heading 0 facing +X, +Y is the vehicle's right. Hull-local origin is the centre of the
hull bounding box. Parts in a group use that group's frame (turret parts are relative to the turret pivot).

### Parts
Each part has:

| field | meaning |
|---|---|
| `id` | unique name, shown in the lab's data notes |
| `layer` | `running`, `hull`, `hullDetail`, `turret`, `turretDetail`, `barrel`, `markings`, `damage`, `rotor` (draw order) |
| `group` | transform group (`hull` by default; `turret`, `barrel`, `rotor`...) |
| `shape` | `path` (M/L/Q/C/A/Z commands), `rect` (with corner radius), `circle` or `ellipse` |
| `fill`, `stroke` | palette token (`IQ_SAND`, `STEEL`, ...), `BASE` (camo base colour) or CSS colour; `null` for none |
| `shade` | lighting hint: `plate`, `dome`, `cylinder`, `recess`, `flat` |
| `ao` | width of a soft ambient-occlusion band around the part (turret ring, hatches) |
| `mirror` | `join`: the path is the right half from front-centre to rear-centre, closed with its mirror; `copy`: draw a mirrored twin |
| `repeat` | `at` (explicit offsets, for uneven road-wheel spacing), `linear` (count and step), `path` (along a path, rotated to its tangent). `scroll: 'track'` makes instances move with the track phase |
| `lod` | 0 silhouette, 1 details (>= 4 px/m), 2 stowage, hatch outlines, tread (>= 8 px/m), 3 panel lines, welds, rivets (>= 16 px/m) |
| `clip` | clip to another part (track links clipped to the track strip) |
| `camo` | receives the camo pattern (default when fill is `BASE`) |
| `lostAt` | hidden at damage state 1 or 2 (stowage, fuel drums) |
| `measure` | `roadWheels` marks the part whose instances are measured as road wheels |
| `text` | stencilled marking; `{num}` becomes the tactical number |
| `note` | provenance or `(verify)` note, listed in the lab |

Groups: `{ parent, pivot, rotate: 'turret' | 'rotor', recoil }`. The barrel is a child of the turret group
with `recoil` metres of travel.

Lighting is fixed to the screen's upper left whatever the heading: lit edges get an inner highlight, far edges
a darker inner edge. No drop shadows or glow. Camo is seeded value noise, one texture per group, clipped to
each painted part; schemes are in `src/data/sprites/palette.ts`.

`spec` lists dimension checks (`hullLength`, `width`, `overallLength`, `gunOverhang`, `turretPivotFromFront`,
`roadWheelGaps`, `rotorDiameter`) with targets and sources. They are measured from the geometry, never typed in.

## Sprite Lab
`npm run dev`, then open `http://localhost:5173/lab`. Dev only: it is not part of `npm run build`.

- Pick a vehicle, zoom (wheel), pan (drag), set heading, turret, rotor, recoil (or "Fire"), track phase ("Drive").
- Grid (1 m minor, 5 m major), ruler tool, bounds overlay with hull, overall, overhang, turret pivot and wheel marks.
- Spec table: PASS/FAIL against 3%, FAIL rows in red.
- Reference overlay: images in `refs/<vehicle_id>/` (git-ignored, never shipped) or a local file / drag-and-drop.
  Opacity, scale, rotation and offset sliders, plus two-point calibration (click two points, enter metres).
- Silhouette, night, damage state, camo scheme and seed, layer toggles, LOD override.
- Thumbnails at 64 px and 32 px (normal and silhouette) and at the game's default and max zoom.
- Export a PNG of the view, or a contact sheet of every sprite at the same scale.

Headless: `node tools/lab-shot.cjs out/prefix "v=iq_t55&ppm=90&turret=30" --thumbs --contact` with the dev server
running. It uses the Playwright that is already installed in the environment (as `tools/smoke.cjs` does).
URL parameters: `v ppm heading turret rotor recoil damage seed scheme night sil grid bbox thumbs light lod off panx pany`
(`off` is a comma list of layers to hide).
