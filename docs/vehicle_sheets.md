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

- Variant: T-55 / T-55A (Soviet-pattern, Iraqi service 1980); base T-55 vs T-55A not yet settled
- Status: draft
- Confidence tags: A 0, B 0, C 44, X 8

### References

None measured yet.

### Dimensions

| Dimension | Value | Conf | Source | Other sources | Reason |
|---|---|---|---|---|---|
| hull_len | 6.2 | C | weaponsystems.net/system/630-T-55 (T-55A data table): '6.20 m (hull)'; armyrecognition.com T-55 page: 6.2 m | 6.04 (en.wikipedia.org/wiki/T-54/T-55: T-55A hull 'lengthened from 6.04 m to 6.2 m', so 6.04 m before the T-55A); 6.45 (docs/vehicle_sheets_draft.md §3.1 (old approximate sheet)) | Two spec sources give 6.20 m (T-55A). 6.04 m applies if Iraq's 1980 tanks were base T-55s (open question). The drawn outline is still the old sheet's 6.45 m, so check-sheets fails until a plan view is calibrated. |
| width | 3.27 | C | weaponsystems.net/system/630-T-55 (T-55A data table): '3.27 m'; theworldwars.net T-54/T-55 entry (T-55A column): 3.270 m; old sheet agrees | 3.37 (en.wikipedia.org/wiki/T-54/T-55 infobox); 3.6 (man.fas.org/dod-101/sys/land/row/t54tank.htm, overall width, page lists T-55AMV); 3.64 (armyrecognition.com T-55 page) | Three sources agree on 3.27 m. Wikipedia's 3.37 m is 3.1% higher; 3.60 and 3.64 m likely include later skirts or the AMV. A calibrated plan view decides. |
| overall_len | 9 | C | en.wikipedia.org/wiki/T-54/T-55 '9.00 m with gun forward'; armyrecognition.com T-55 page 9.0 m; weaponsystems.net/system/630-T-55 (T-55A data table) '9 m (gun forward)' | – | Three sources agree; C until checked on a calibrated plan view. |
| height | 2.35 | C | weaponsystems.net/system/630-T-55 (T-55A data table): '2.35 m (cupola)'; armyrecognition.com T-55 page: 2.35 m | 2.4 (en.wikipedia.org/wiki/T-54/T-55; theworldwars.net T-54/T-55 entry (T-55A column)); 2.32 (man.fas.org/dod-101/sys/land/row/t54tank.htm (T-55AMV)) | Not drawn in a top view; used for the side-view cross-check. Sources differ by up to 3.4% (definition of the measuring point varies). |
| track_centres | 2.64 | C | weaponsystems.net/system/630-T-55 (T-55A data table): 'Tread 2.64 m'; theworldwars.net T-54/T-55 entry (T-55A column): 'Track 2.640 m' | – | – |
| track_width | 0.58 | C | weaponsystems.net/system/630-T-55 (T-55A data table): '0.58 m'; theworldwars.net T-54/T-55 entry (T-55A column): 580 mm; old sheet agrees | – | – |
| track_on_ground | 3.84 | C | weaponsystems.net/system/630-T-55 (T-55A data table): 'Track on ground 3.84 m'; theworldwars.net T-54/T-55 entry (T-55A column): 3.840 m | – | – |
| ground_clearance | 0.425 | C | theworldwars.net T-54/T-55 entry (T-55A column): 0.425 m | 0.43 (weaponsystems.net/system/630-T-55 (T-55A data table)) | Side view only. |
| barrel_len | 5.35 | C | en.wikipedia.org/wiki/D-10_tank_gun: 'Barrel length: 5.35 m L/53.5' (D-10 family; T-55 uses the D-10T2S) | – | Whole tube; the part outside the mantlet must be shorter. |

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

- Pivot [0.3, 0] (C): old sheet turret.pivot; ring diameter not found in the sources checked

### Gun

- 100 mm, barrel x 1.45 to muzzle 5.5 (turret frame), diameter 0.14, recoil 0.3 (C): calibre: en.wikipedia.org/wiki/T-54/T-55 (D-10T2S 100 mm, 'equipped with an ejector'); visible length and diameter: old sheet, muzzle chosen so overall length = 9.00 m
- bore_evacuator: front end x 4.05, length 0.5, diameter 0.24 (C): existence: en.wikipedia.org/wiki/D-10_tank_gun (D-10T2S 'equipped with an ejector'); position and size: old sheet (bore_evac x 3.8 + len 0.5)

### Running gear

- Tracks: x -3.1 to 3.25, centre y ±1.32, width 0.58, link pitch 0.137 (C): y centre = half the 2.64 m track centres and width 0.58 m (weaponsystems.net/system/630-T-55 (T-55A data table); theworldwars.net T-54/T-55 entry (T-55A column)); x extent from the old sheet; link pitch 137 mm is an unverified estimate

### Parts

| Part | Kind | Frame | Geometry | Conf | Source |
|---|---|---|---|---|---|
| driver_hatch | hatch | hull | pos [2.4, -0.6], r 0.28 | X | side: front left (en.wikipedia.org/wiki/T-54/T-55; armyrecognition.com). Exact position and size need a top view |
| cupola | cupola | turret | pos [-0.15, -0.55], r 0.3 | C | side: commander on the turret left (en.wikipedia.org/wiki/T-54/T-55, T-54 layout carried over); position and radius: old sheet |
| cupola_ir_light | searchlight | turret | pos [0.25, -0.55], size 0.2 × 0.18 | X | IR light on the forward part of the commander's cupola (armyrecognition.com); position estimated in front of the old-sheet cupola |
| loader_hatch | hatch | turret | pos [-0.5, 0.5], size 0.5 × 0.45 | C | old sheet loader_hatch |
| ir_searchlight | searchlight | turret | pos [1.2, 0.45], size 0.35 × 0.3 | C | side: right of the main gun (armyrecognition.com, L-2 'Luna'); position from the old sheet |
| fuel_tanks | fuel_tank | hull | pos [0.6, 1.35], size 1.2 × 0.3, copies at [0, 0] [-1.4, 0] | X | old sheet: two cylinders on the right fender. en.wikipedia.org/wiki/T-54/T-55 describes four flat external tanks (one oil, three diesel) on the early T-54; count, shape and positions on the T-55 need a top view |
| toolbox | toolbox | hull | pos [-0.1, -1.375], size 1 × 0.35 | C | old sheet left fender toolbox |
| spare_links | spare_links | hull | pos [0.769, -1.34], size 0.137 × 0.42, 4 × step [0.15, 0] | C | old sheet: spare track links on the left fender |
| unditching_log | log | hull | pos [-3.04, 0], size 0.22 × 2 | C | old sheet rear-deck unditching log |
| engine_louvres | louvre | hull | points [-2.95, -0.85] [-2.95, 0.85], 14 × step [0.11, 0] | X | louvre count and pitch unknown; needs a rear-deck photo |
| glacis_weld | weld | hull | points [3.1, 0.75] [2.48, 1.22], mirrored | C | follows the old-sheet glacis corner |
| mark_r | marking | turret | pos [-0.65, 0.77], size 0.6 × 0.32 | C | stencilled tactical number, placement is a game convention |
| mark_l | marking | turret | pos [-0.65, -0.77], size 0.6 × 0.32 | C | stencilled tactical number, placement is a game convention |

### Hooks

- exhaust: [-2.6, -1.45] (X): side: 'The engine exhaust is on the left fender' (en.wikipedia.org/wiki/T-54/T-55); position along the fender is unknown (old sheet had it rear right)
- dust: [-3.1, 1.34] [-3.1, -1.34] (C): rear ends of the tracks
- smoke: [-2.2, 0] [0.3, 0] (C): engine deck and turret centre (game effect)

### Detail inventory

| Detail | What | Status | Conf | Source |
|---|---|---|---|---|
| hull | Hull roof outline with glacis corners | drawn | C | docs/vehicle_sheets_draft.md §3.1 (old approximate sheet) |
| fender | Track guards (fenders) both sides | drawn | C | docs/vehicle_sheets_draft.md §3.1 (old approximate sheet) |
| turret | Cast dome turret | drawn | C | docs/vehicle_sheets_draft.md §3.1 (old approximate sheet) |
| track | Tracks, 580 mm, all-steel | drawn | C | en.wikipedia.org/wiki/T-54/T-55 ('all-steel track'); weaponsystems.net/system/630-T-55 (T-55A data table) |
| road_wheels | Five road wheels per side, wider gap after wheel 1, no return rollers | pending | C | en.wikipedia.org/wiki/T-54/T-55; armyrecognition.com T-55 page. Hidden under the fenders from above; x positions need a calibrated side view |
| barrel | 100 mm D-10T2S barrel | drawn | C | en.wikipedia.org/wiki/D-10_tank_gun |
| bore_evacuator | Bore evacuator (ejector) on the barrel | drawn | C | en.wikipedia.org/wiki/D-10_tank_gun |
| mantlet | Gun mantlet and canvas cover | pending | X | not in the sources checked; needs a top or front view |
| coax_port | Coaxial MG port beside the gun | pending | X | en.wikipedia.org/wiki/T-54/T-55 (PKT coax on the T-55A); position needs a front view |
| driver_hatch | Driver's single-piece hatch, front left, swings left | drawn | X | en.wikipedia.org/wiki/T-54/T-55; armyrecognition.com T-55 page |
| driver_periscopes | Two driver's periscopes forward of the hatch | pending | C | armyrecognition.com T-55 page |
| headlights | Driving light and IR headlight on the hull front | pending | C | en.wikipedia.org/wiki/T-54/T-55 (IR headlight); armyrecognition.com T-55 page (IR light on the right of the glacis) |
| cupola | Commander's cupola with periscopes, turret left | drawn | C | en.wikipedia.org/wiki/T-54/T-55 |
| cupola_ir_light | OU-3 IR light on the front of the cupola | drawn | X | armyrecognition.com T-55 page |
| loader_hatch | Loader's hatch, turret right | drawn | C | docs/vehicle_sheets_draft.md §3.1 (old approximate sheet) |
| dshk | 12.7 mm DShK AA MG on the loader's hatch | unconfirmed | C | en.wikipedia.org/wiki/T-54/T-55: fitted to new and old T-55s from 1970; weaponsystems.net/system/630-T-55 (T-55A data table): retrofitted 1972. Not confirmed on Iraqi export tanks in 1980 |
| ir_searchlight | L-2 'Luna' IR searchlight right of the gun | drawn | C | armyrecognition.com T-55 page |
| gunner_sight | Gunner's sight aperture / periscope on the turret roof | pending | X | not in the sources checked |
| turret_fittings | Turret grab rails, lifting eyes, stowage brackets | pending | X | not in the sources checked |
| ventilator_dome | Dome ventilator on the front right of the turret | removed | C | en.wikipedia.org/wiki/T-54/T-55: the dome on the front right identifies the older T-54; the T-55 lacks it (old sheet had it at turret [-1.0, 0.35]) |
| fuel_tanks | External fuel and oil tanks on the right fender | drawn | X | en.wikipedia.org/wiki/T-54/T-55 |
| rear_drums | Two jettisonable fuel drums on the hull rear | unconfirmed | C | armyrecognition.com T-55 page; en.wikipedia.org/wiki/T-54/T-55 (400 l rear drums). Fit on Iraqi tanks in 1980 not confirmed |
| toolbox | Stowage boxes on the left fender | drawn | C | docs/vehicle_sheets_draft.md §3.1 (old approximate sheet) |
| spare_links | Spare track links on the fenders | drawn | C | docs/vehicle_sheets_draft.md §3.1 (old approximate sheet) |
| tow_cables | Tow cables along the fenders or hull | pending | X | not in the sources checked |
| tow_hooks | Front and rear tow hooks | pending | X | not in the sources checked |
| engine_deck | Engine deck plate | drawn | C | docs/vehicle_sheets_draft.md §3.1 (old approximate sheet) |
| engine_louvres | Radiator grilles / louvres on the engine deck | drawn | X | count and pitch unknown |
| exhaust | Exhaust outlet on the left fender | pending | C | en.wikipedia.org/wiki/T-54/T-55 |
| unditching_log | Unditching beam across the rear | drawn | C | docs/vehicle_sheets_draft.md §3.1 (old approximate sheet) |
| snorkel | Deep-wading snorkel and its stowage | unconfirmed | C | en.wikipedia.org/wiki/T-54/T-55 (OPVT snorkel on the T-54A); theworldwars.net T-54/T-55 entry (T-55A column) lists the T-55A as not amphibious; stowage place on the T-55 not found |
| glacis_weld | Weld seams at the glacis corners | drawn | C | docs/vehicle_sheets_draft.md §3.1 (old approximate sheet) |
| tactical_number | Stencilled tactical number on the turret sides | drawn (mark_r) | C | game convention (no national symbols) |
| ktd_rangefinder | KTD-1/2 laser rangefinder box over the mantlet | excluded | C | en.wikipedia.org/wiki/T-54/T-55: fitted from 1974; not confirmed on Iraqi tanks in 1980, so not drawn |
| rubber_skirts | Rubber side skirts | excluded | C | en.wikipedia.org/wiki/T-54/T-55: late-production T-55A only |
| t55am_armour | Appliqué turret and glacis armour, 902B smoke dischargers (T-55AM) | excluded | C | weaponsystems.net lists the T-55AM and T-55AMV as deep modernisations; globalsecurity.org titles the T-55AM 'Model 1983' |
| t55amv_era | Kontakt-1 ERA blocks (T-55AMV) | excluded | C | weaponsystems.net/system/630-T-55 (T-55A data table) |

### Changes from the old sheet

| What | Before | After | Source |
|---|---|---|---|
| hull_len (stated) | 6.45 m | 6.20 m | weaponsystems.net/system/630-T-55 (T-55A data table); armyrecognition.com T-55 page |
| width (stated) | 3.27 m | 3.27 m (now sourced; Wikipedia 3.37 m recorded as alternative) | weaponsystems.net/system/630-T-55 (T-55A data table); theworldwars.net T-54/T-55 entry (T-55A column) |
| track centre line | y ±1.34 | y ±1.32 | track centres 2.64 m (weaponsystems.net, theworldwars.net) |
| driver hatch | [2.4, 0] centre | [2.4, -0.6] front left (position X) | en.wikipedia.org/wiki/T-54/T-55; armyrecognition.com T-55 page |
| turret ventilator dome | turret [-1.0, 0.35] | removed | en.wikipedia.org/wiki/T-54/T-55: T-54 feature, absent on the T-55 |
| exhaust hook | [-3.2, 0.5] rear right | [-2.6, -1.45] left fender (position X) | en.wikipedia.org/wiki/T-54/T-55 |
| road wheels | 5 per side at x 2.35, 1.13, 0.13, -0.87, -1.87 (placeholder) | not drawn (hidden under the fenders from above); positions pending a side view | placeholder span 4.22 m between first and last wheel centres exceeds the 3.84 m track on ground (weaponsystems.net) |
| fuel tanks | two cylinders, conf C | same geometry, conf X | en.wikipedia.org/wiki/T-54/T-55 describes flat tanks (T-54); count and shape unknown for the T-55 |
| cupola IR light | absent | added in front of the cupola (position X) | armyrecognition.com T-55 page |

### Excluded details (post-1980 or unconfirmed for 1980)

- KTD-1/KTD-2 laser rangefinder over the mantlet: fitted from 1974 (Wikipedia), not confirmed on Iraqi tanks in 1980. Not drawn.
- Rubber side skirts: late-production T-55A only (Wikipedia). Not drawn.
- T-55AM appliqué armour ('Brezhnev eyebrows') and 902B smoke dischargers: 1983 modernisation (globalsecurity.org 'T-55AM Model 1983'). Not drawn.
- T-55AMV Kontakt-1 ERA (weaponsystems.net). Not drawn.

### Open questions

- Variant: did Iraq field base T-55s (hull 6.04 m) or T-55As (6.20 m) in 1980? Sets hull_len. Iraq also bought Chinese Type 69s (Wikipedia), which this sprite does not cover.
- Width: 3.27 m (three sources) vs 3.37 m (Wikipedia). A calibrated plan view decides.
- DShK on the loader's hatch: Soviet tanks got it from 1970-72. Were Iraqi T-55s fitted by 1980?
- Rear fuel drums: commonly fitted on Iraqi T-55s in 1980?
- Right-fender tanks: how many, flat or round, and where?
- Exhaust outlet: confirmed on the left fender; where along it?
- Road wheel positions and the wider first gap: need a calibrated side view.

### Notes

- Draft built from published specs and the old approximate sheet. No reference images measured yet; every geometry value is C or X.
- Road wheels are recorded in the detail inventory but not drawn: from above they sit under the fenders.

### Critique of the latest render

- Turret reads as an egg (pointed nose, wide rear) because the old-sheet points put the widest point behind the pivot. The T-55's cast turret is a near-round dome; this is the most visible error and needs the plan view.
- Hull is 6.45 m long against 6.20 m stated (check-sheets fails). The bevelled rear corners and steep glacis chamfers also come from the old sheet and look boat-like.
- No mantlet: the barrel starts at the turret edge. The mantlet and its canvas cover are pending a top or front view.
- Fuel tanks are drawn as rounded pills; the sources describe flat tanks. Count, shape and position are X.
- Engine deck is one even louvre grid. Real decks have grilles and access panels in a pattern that needs a rear-deck photo.
- Track ends show as solid black blocks with no idler or sprocket shape. Acceptable from above, but fender ends need checking on the plan view.
- Tactical numbers are large relative to the turret and should shrink once the turret outline is corrected.
- At 64 px the silhouette is a rectangle plus gun: from straight above the turret sits inside the hull outline, so the silhouette alone cannot separate a T-55 from a T-62 (IoU 0.899, just under the 0.90 flag). The cues that survive are the shaded round turret, the gun length beyond the hull and the bore evacuator position. Those need the measured turret and gun before they can be trusted.

