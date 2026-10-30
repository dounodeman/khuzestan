# Vehicle sheets (generated)

<!-- GENERATED from data/vehicle_sheets/*.json by `npm run sheets-doc`. Do not edit by hand; edit the JSON. -->

Measured top-view geometry for every vehicle sprite. Units are metres; +x is the front, +y the vehicle's right,
origin the hull centre. Turret parts are relative to the turret pivot.

Confidence: **A** calibrated plan view agreeing with a published spec within 3%; **B** calibrated plan view or clean
side view, no second source; **C** estimated from perspective photos, the old approximate sheet, or a spec number
not yet checked on an image; **X** unknown (the source note says what would settle it).

Vehicles with a measured sheet: iq_t55. All other vehicles are still in the legacy draft,
`docs/vehicle_sheets_draft.md`. Reference sources and their license notes: `docs/reference_sources.md`.

## T-55 (`iq_t55`)

- Variant: T-55 (Soviet-pattern, Iraqi service 1980); T-55 vs T-55A not yet settled
- Status: draft
- Confidence tags: A 0, B 0, C 41, X 8

### References

None measured yet.

### Dimensions

| Dimension | Value | Conf | Source | Other sources | Reason |
|---|---|---|---|---|---|
| hull_len | 6.2 | C | armyrecognition.com T-55 page (6.2 m hull); man.fas.org T-54/55 page (chassis length 6.20 m, likely T-55AMV) | 6.04 (en.wikipedia.org/wiki/T-54/T-55: T-55A hull 'lengthened from 6.04 m to 6.2 m', so 6.04 m for the base T-55); 6.45 (docs/vehicle_sheets.md §3.1 (old approximate sheet)) | Two spec sources give 6.20 m; Wikipedia implies 6.04 m for the pre-T-55A hull. Depends on which variant Iraq had in 1980 (open question). No plan view yet. |
| width | 3.37 | C | en.wikipedia.org/wiki/T-54/T-55 infobox (3.37 m) | 3.27 (docs/vehicle_sheets.md §3.1 (old approximate sheet)); 3.6 (man.fas.org T-54/55 page, overall width (listed variant T-55AMV)); 3.64 (armyrecognition.com T-55 page) | Encyclopedic source preferred for the base vehicle; 3.60 and 3.64 m likely include later side skirts. Sources differ by up to 11%, needs a calibrated plan view. |
| overall_len | 9 | C | en.wikipedia.org/wiki/T-54/T-55 (9.00 m gun forward); armyrecognition.com (9.0 m); old sheet agrees | – | Three sources agree; stays C until checked on a calibrated plan view. |
| height | 2.4 | C | en.wikipedia.org/wiki/T-54/T-55 (2.40 m) | 2.35 (armyrecognition.com T-55 page); 2.32 (man.fas.org (T-55AMV)) | Not used in the top view; kept for the side-view cross-check. |

### Outlines

- **hull** (hull, hull frame, half): [3.15, 0]C [3.15, 0.75]C [2.5, 1.25]C [1.9, 1.35]C [-2.9, 1.35]C [-3.2, 1.1]C [-3.2, 0]C
  - source: docs/vehicle_sheets.md §3.1 hull_half (old approximate sheet)
- **fender** (fender, hull frame, side): [2.95, 1.05]X [3, 1.2]X [2.9, 1.635]C [-2.95, 1.635]C [-2.95, 1.05]X
  - source: old sheet: fenders y 1.05..1.635; x extent estimated so track ends show (no source)
- **turret** (turret, turret frame, half): [1.55, 0]C~ [1.45, 0.5]C~ [0.9, 0.95]C~ [0, 1.05]C~ [-0.9, 0.95]C~ [-1.5, 0.55]C~ [-1.7, 0]C~
  - source: docs/vehicle_sheets.md §3.1 turret.half (old approximate sheet), smoothed
- **engine_deck** (deck, hull frame, full): [-1.4, -0.9]C [-1.4, 0.9]C [-3, 0.9]C [-3, -0.9]C
  - source: old sheet engine_deck x[-3.0,-1.4] y[-0.9,0.9]

`~` marks a smooth (curved) point.

### Turret

- Pivot [0.3, 0] (C): old sheet turret.pivot; ring diameter unknown

### Gun

- 100 mm, barrel x 1.45 to muzzle 5.5 (turret frame), diameter 0.14, recoil 0.3 (C): calibre: en.wikipedia.org/wiki/T-54/T-55 (D-10T 100 mm); length and diameter: old sheet (muzzle chosen so overall length = 9.00 m)
- bore_evacuator: front end x 4.05, length 0.5, diameter 0.24 (C): old sheet bore_evac x 3.8 + len 0.5 (front end 4.05)

### Running gear

- Tracks: x -3.1 to 3.25, centre y ±1.34, width 0.58, link pitch 0.137 (C): old sheet tracks; link pitch 137 mm is an unverified estimate (needs a side profile or track detail photo)
- Road wheels: x 2.35, 1.13, 0.13, -0.87, -1.87 (gaps 1.22, 1, 1, 1), centre y ±1.34, diameter 0.81, width 0.34 (X): five per side with a wider gap after wheel 1 (armyrecognition.com); x positions and diameter are placeholders until a side profile is calibrated

### Parts

| Part | Kind | Frame | Geometry | Conf | Source |
|---|---|---|---|---|---|
| driver_hatch | hatch | hull | pos [2.4, -0.6], r 0.28 | X | side: front left (en.wikipedia.org/wiki/T-54/T-55; armyrecognition.com). Exact position and size need a top view |
| cupola | cupola | turret | pos [-0.15, -0.55], r 0.3 | C | old sheet cupola |
| cupola_ir_light | searchlight | turret | pos [0.25, -0.55], size 0.2 × 0.18 | X | IR light on the forward part of the commander's cupola (armyrecognition.com); position estimated in front of the old-sheet cupola |
| loader_hatch | hatch | turret | pos [-0.5, 0.5], size 0.5 × 0.45 | C | old sheet loader_hatch |
| ventilator | ventilator | turret | pos [-1, 0.35], r 0.15 | C | old sheet ventilator_dome |
| ir_searchlight | searchlight | turret | pos [1.2, 0.45], size 0.35 × 0.3 | C | side: right of the main gun (armyrecognition.com, L-2 'Luna'); position from the old sheet |
| fuel_tanks | fuel_tank | hull | pos [0.6, 1.35], size 1.2 × 0.3, copies at [0, 0] [-1.4, 0] | C | old sheet: two cylinders on the right fender; count and positions need a top view or right-side photo |
| toolbox | toolbox | hull | pos [-0.1, -1.375], size 1 × 0.35 | C | old sheet left fender toolbox |
| spare_links | spare_links | hull | pos [0.769, -1.34], size 0.137 × 0.42, 4 × step [0.15, 0] | C | old sheet: spare track links on the left fender |
| unditching_log | log | hull | pos [-3.04, 0], size 0.22 × 2 | C | old sheet rear-deck unditching log |
| engine_louvres | louvre | hull | points [-2.95, -0.85] [-2.95, 0.85], 14 × step [0.11, 0] | X | louvre count and pitch unknown; needs a rear-deck photo |
| glacis_weld | weld | hull | points [3.1, 0.75] [2.48, 1.22], mirrored | C | follows the old-sheet glacis corner |
| mark_r | marking | turret | pos [-0.65, 0.77], size 0.6 × 0.32 | C | stencilled tactical number, placement is a game convention |
| mark_l | marking | turret | pos [-0.65, -0.77], size 0.6 × 0.32 | C | stencilled tactical number, placement is a game convention |

### Hooks

- exhaust: [-3.2, 0.5] (X): old sheet puts it rear right; outlet side and position need a rear-deck photo
- dust: [-3.1, 1.34] [-3.1, -1.34] (C): rear ends of the tracks
- smoke: [-2.2, 0] [0.3, 0] (C): engine deck and turret centre (game effect)

### Excluded details (post-1980 or unconfirmed for 1980)

- none recorded

### Open questions

- Which variant did Iraq field in 1980: base T-55 (hull 6.04 m) or T-55A (6.20 m)? Sets hull_len.
- Width: sources give 3.27, 3.37, 3.60 and 3.64 m. A calibrated plan view decides.
- Exhaust outlet side (old sheet: rear right).
- Were the rear 200 l fuel drums (armyrecognition.com) commonly fitted on Iraqi T-55s in 1980? Not drawn until confirmed.
- KTD-1 rangefinder over the mantlet (T-55A from 1974, Wikipedia) and late T-55A rubber skirts: present on Iraqi tanks in 1980? Not drawn.

### Notes

- Draft built from the old approximate sheet and published specs. No reference images measured yet.

