# Vector sprite format (v2) and Sprite Lab

Vehicle sprites are pure data in `src/data/sprites/<unit_id>.ts`, drawn by one generic renderer in
`src/render/vector/`. There are no per-vehicle draw functions. Types live in `src/data/sprites/types.ts`.

## Coordinates
Metres. Authored at heading 0 facing +X, +Y is the vehicle's right. Hull-local origin is the centre of the
hull bounding box. Parts in a group use that group's frame (turret parts are relative to the turret pivot).

## Parts
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
