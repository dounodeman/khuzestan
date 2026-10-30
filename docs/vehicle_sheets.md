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

- Variant: T-55 (base model, regular 6.04 m hull), Iraqi service 1980
- Status: draft
- Confidence tags: A 0, B 0, C 53, X 7

### References

| File | View | Perspective | Calibrated to | Source |
|---|---|---|---|---|
| 01_Destroyed_Iraqi_T_54_T_55_or_Type_59_tank.jpg | top | yes | – | https://commons.wikimedia.org/wiki/File:Destroyed_Iraqi_T-54,_T-55_or_Type_59_tank.JPEG (author SSGT Robert Reeve; supplied by Beckett in vehicle_references.zip) |
| 02_Destroyed_iraqi_T_55_tank.jpg | detail (turret roof) | yes | – | https://commons.wikimedia.org/wiki/File:Destroyed_iraqi_T-55_tank.JPEG (author TECH. SGT. JOE COLEMAN; supplied by Beckett in vehicle_references.zip) |
| 03_Disabled_Iraqi_T_55_tank_at_the_Jalibah_Airfield.jpg | front | yes | – | https://commons.wikimedia.org/wiki/File:Disabled_Iraqi_T-55_tank_at_the_Jalibah_Airfield.JPEG (author SSgt. J. Otero, US Army; supplied by Beckett in vehicle_references.zip) |
| 04_Iraqi_T_55_tank_in_Sadr_Al_Yusafiyah.jpg | side | yes | – | https://commons.wikimedia.org/wiki/File:Iraqi_T-55_tank_in_Sadr_Al_Yusafiyah.JPG (author SPC TIMOTHY W. STORY; supplied by Beckett in vehicle_references.zip) |
| 05_Iraqi_T_55_and_two_Type_69_tanks.jpg | front | yes | – | https://commons.wikimedia.org/wiki/File:Iraqi_T-55_and_two_Type_69_tanks.jpg (author Unknown, US Army; supplied by Beckett in vehicle_references.zip) |
| 06_T_55.jpg | front | yes | – | https://commons.wikimedia.org/wiki/File:T-55.jpg (author Unknown author Unknown author; supplied by Beckett in vehicle_references.zip) |
| 07_Tapolca_hadipark_T_55_panoramio.jpg | side | yes | – | https://commons.wikimedia.org/wiki/File:Tapolca_hadipark_T-55_-_panoramio.jpg (author Zajza; supplied by Beckett in vehicle_references.zip) |
| 08_Closeup_of_iraqi_T_55_Enigma_tank_knocked_out_after_the_Batt.jpg | side | yes | – | https://commons.wikimedia.org/wiki/File:Closeup_of_iraqi_T-55_Enigma_tank_knocked_out_after_the_Battle_of_Khafji,_different_view,_1991.jpg (author Unknown author Unknown author; supplied by Beckett in vehicle_references.zip) |
| 09_T_55_4.jpg | side | yes | – | https://commons.wikimedia.org/wiki/File:T-55_4.jpg (author John Harwood; supplied by Beckett in vehicle_references.zip) |

### Dimensions

| Dimension | Value | Conf | Source | Other sources | Reason |
|---|---|---|---|---|---|
| hull_len | 6.04 | C | en.wikipedia.org/wiki/T-54/T-55: T-55A hull 'lengthened from 6.04 m to 6.2 m', so 6.04 m for the regular T-55 hull. Variant chosen by Beckett (2026-10-30: 'Use T-55 regular hull') | 6.2 (weaponsystems.net/system/630-T-55 (T-55A data table); armyrecognition.com T-55 page); 6.45 (docs/vehicle_sheets_draft.md §3.1 (old approximate sheet)) | Regular hull chosen by Beckett, so the T-55A figure (6.20 m) does not apply. Still C: no plan view in the reference set to measure it. |
| width | 3.27 | C | weaponsystems.net/system/630-T-55 (T-55A data table): '3.27 m'; theworldwars.net T-54/T-55 entry (T-55A column): 3.270 m; old sheet agrees | 3.37 (en.wikipedia.org/wiki/T-54/T-55 infobox); 3.6 (man.fas.org/dod-101/sys/land/row/t54tank.htm, overall width, page lists T-55AMV); 3.64 (armyrecognition.com T-55 page) | Three sources agree on 3.27 m. Wikipedia's 3.37 m is 3.1% higher; 3.60 and 3.64 m likely include later skirts or the AMV. A calibrated plan view decides. The regular hull and the T-55A share the same width in the sources checked. |
| overall_len | 9 | C | en.wikipedia.org/wiki/T-54/T-55 '9.00 m with gun forward'; armyrecognition.com T-55 page 9.0 m; weaponsystems.net/system/630-T-55 (T-55A data table) '9 m (gun forward)' | – | Three sources agree; C until checked on a calibrated plan view. |
| height | 2.35 | C | weaponsystems.net/system/630-T-55 (T-55A data table): '2.35 m (cupola)'; armyrecognition.com T-55 page: 2.35 m | 2.4 (en.wikipedia.org/wiki/T-54/T-55; theworldwars.net T-54/T-55 entry (T-55A column)); 2.32 (man.fas.org/dod-101/sys/land/row/t54tank.htm (T-55AMV)) | Not drawn in a top view; used for the side-view cross-check. Sources differ by up to 3.4% (definition of the measuring point varies). |
| track_centres | 2.64 | C | weaponsystems.net/system/630-T-55 (T-55A data table): 'Tread 2.64 m'; theworldwars.net T-54/T-55 entry (T-55A column): 'Track 2.640 m' | – | – |
| track_width | 0.58 | C | weaponsystems.net/system/630-T-55 (T-55A data table): '0.58 m'; theworldwars.net T-54/T-55 entry (T-55A column): 580 mm; old sheet agrees | – | – |
| track_on_ground | 3.84 | C | weaponsystems.net/system/630-T-55 (T-55A data table): 'Track on ground 3.84 m'; theworldwars.net T-54/T-55 entry (T-55A column): 3.840 m | – | – |
| ground_clearance | 0.425 | C | theworldwars.net T-54/T-55 entry (T-55A column): 0.425 m | 0.43 (weaponsystems.net/system/630-T-55 (T-55A data table)) | Side view only. |
| barrel_len | 5.35 | C | en.wikipedia.org/wiki/D-10_tank_gun: 'Barrel length: 5.35 m L/53.5' (D-10 family; T-55 uses the D-10T2S) | – | Whole tube; the part outside the mantlet must be shorter. |

### Outlines

- **hull** (hull, hull frame, half): [2.95, 0]C [2.95, 0.75]C [2.341, 1.25]C [1.779, 1.35]C [-2.716, 1.35]C [-2.997, 1.1]C [-2.997, 0]C
  - source: docs/vehicle_sheets.md §3.1 hull_half (old approximate sheet); x scaled by 6.04/6.45 (2026-10-30, regular hull)
- **fender** (fender, hull frame, side): [2.762, 1.05]X [2.809, 1.2]X [2.716, 1.635]C [-2.762, 1.635]C [-2.762, 1.05]X
  - source: old sheet: fenders y 1.05..1.635; x extent estimated so track ends show (no source); x scaled by 6.04/6.45 (2026-10-30, regular hull)
- **turret** (turret, turret frame, half): [1.55, 0]C~ [1.45, 0.5]C~ [0.9, 0.95]C~ [0, 1.05]C~ [-0.9, 0.95]C~ [-1.5, 0.55]C~ [-1.7, 0]C~
  - source: docs/vehicle_sheets.md §3.1 turret.half (old approximate sheet), smoothed
- **engine_deck** (deck, hull frame, full): [-1.311, -0.9]C [-1.311, 0.9]C [-2.809, 0.9]C [-2.809, -0.9]C
  - source: old sheet engine_deck x[-3.0,-1.4] y[-0.9,0.9]; x scaled by 6.04/6.45 (2026-10-30, regular hull)

`~` marks a smooth (curved) point.

### Turret

- Pivot [0.281, 0] (C): old sheet turret.pivot; ring diameter not found in the sources checked; x scaled to the 6.04 m hull

### Gun

- 100 mm, barrel x 1.45 to muzzle 5.722 (turret frame), diameter 0.14, recoil 0.3 (C): calibre: en.wikipedia.org/wiki/T-54/T-55 (D-10T2S 100 mm, 'equipped with an ejector'); visible length and diameter: old sheet, muzzle chosen so overall length = 9.00 m with the 6.04 m hull
- bore_evacuator: front end x 4.05, length 0.5, diameter 0.24 (C): existence: en.wikipedia.org/wiki/D-10_tank_gun (D-10T2S 'equipped with an ejector'); position and size: old sheet (bore_evac x 3.8 + len 0.5)

### Running gear

- Tracks: x -2.903 to 3.043, centre y ±1.32, width 0.58, link pitch 0.137 (C): y centre = half the 2.64 m track centres and width 0.58 m (weaponsystems.net/system/630-T-55 (T-55A data table); theworldwars.net T-54/T-55 entry (T-55A column)); x extent from the old sheet scaled to the 6.04 m hull; link pitch 137 mm is an unverified estimate
- Road wheels: x 2.04, 0.837, -0.045, -0.934, -1.8 (gaps 1.203, 0.882, 0.889, 0.866), centre y ±1.32, diameter 0.838, width 0.45 (C): gap ratios 1.44 : 1.05 : 1.06 : 1.03 wheel diameters from refs/iq_t55/07_Tapolca_hadipark_T_55_panoramio.jpg (perspective-corrected along the wheel line: vanishing point fitted from the five equal road-wheel diameters, positions in wheel diameters, scaled so the wheel 1-5 hub span equals track_on_ground 3.84 m). Cross-check refs/iq_t55/04_Iraqi_T_55_tank_in_Sadr_Al_Yusafiyah.jpg: 1.35 : 1.09 : 1.05 : 1.15 (low-resolution photo, kept as the alternative; never averaged). Diameter derived from the same fit (0.838 m). Width 0.45 m (twin wheel pair) is not measured (X). Right-side wheels sit about 72 mm ahead of the left (onthewaymodels.com ACE T-55 review); not drawn, the wheels are under the fenders from above

### Parts

| Part | Kind | Frame | Geometry | Conf | Source |
|---|---|---|---|---|---|
| driver_hatch | hatch | hull | pos [2.247, -0.6], r 0.28 | X | side: front left (en.wikipedia.org/wiki/T-54/T-55; armyrecognition.com). Exact position and size need a top view |
| cupola | cupola | turret | pos [-0.15, -0.55], r 0.3 | C | side: commander on the turret left (en.wikipedia.org/wiki/T-54/T-55, T-54 layout carried over); position and radius: old sheet; commander on the turret left confirmed in refs/iq_t55/09_T_55_4.jpg |
| cupola_ir_light | searchlight | turret | pos [0.25, -0.55], size 0.2 × 0.18 | X | IR light on the forward part of the commander's cupola (armyrecognition.com); position estimated in front of the old-sheet cupola |
| loader_hatch | hatch | turret | pos [-0.5, 0.5], size 0.5 × 0.45 | C | old sheet loader_hatch |
| ir_searchlight | searchlight | turret | pos [1.2, 0.45], size 0.35 × 0.3 | C | side: right of the main gun (armyrecognition.com, L-2 'Luna'); position from the old sheet; right of the gun confirmed in refs/iq_t55/03_Disabled_Iraqi_T_55_tank_at_the_Jalibah_Airfield.jpg, refs/iq_t55/07_Tapolca_hadipark_T_55_panoramio.jpg and refs/iq_t55/09_T_55_4.jpg |
| toolbox | toolbox | hull | pos [-0.094, -1.375], size 1 × 0.35 | C | old sheet left fender toolbox; stowage boxes with handles on the left fender behind the turret seen in refs/iq_t55/09_T_55_4.jpg |
| spare_links | spare_links | hull | pos [0.72, -1.34], size 0.137 × 0.42, 4 × step [0.15, 0] | C | old sheet: spare track links on the left fender |
| unditching_log | log | hull | pos [-2.847, 0], size 0.22 × 2 | C | old sheet rear-deck unditching log |
| engine_louvres | louvre | hull | points [-2.762, -0.85] [-2.762, 0.85], 14 × step [0.11, 0] | X | louvre count and pitch unknown; needs a rear-deck photo |
| glacis_weld | weld | hull | points [2.903, 0.75] [2.322, 1.22], mirrored | C | follows the old-sheet glacis corner |
| mark_r | marking | turret | pos [-0.65, 0.77], size 0.6 × 0.32 | C | stencilled tactical number, placement is a game convention |
| mark_l | marking | turret | pos [-0.65, -0.77], size 0.6 × 0.32 | C | stencilled tactical number, placement is a game convention |
| fuel_tank_1 | fuel_tank | hull | pos [-2.249, 1.33], size 0.942 × 0.45 | C | four flat box tanks on the right fender, rear to front x -2.74..2.164 m, from refs/iq_t55/07_Tapolca_hadipark_T_55_panoramio.jpg (perspective-corrected along the wheel line: vanishing point fitted from the five equal road-wheel diameters, positions in wheel diameters, scaled so the wheel 1-5 hub span equals track_on_ground 3.84 m); the rear tank's photo edge maps to -2.83 m, 6 cm past the fender end, so it is cut at the fender; count and shape agree with en.wikipedia.org/wiki/T-54/T-55 ('four flat external tanks, one for engine oil, three for diesel fuel'). Width across the fender not measurable (X) |
| fuel_tank_2 | fuel_tank | hull | pos [-0.946, 1.33], size 1.584 × 0.45 | C | four flat box tanks on the right fender, rear to front x -2.74..2.164 m, from refs/iq_t55/07_Tapolca_hadipark_T_55_panoramio.jpg (perspective-corrected along the wheel line: vanishing point fitted from the five equal road-wheel diameters, positions in wheel diameters, scaled so the wheel 1-5 hub span equals track_on_ground 3.84 m); the rear tank's photo edge maps to -2.83 m, 6 cm past the fender end, so it is cut at the fender; count and shape agree with en.wikipedia.org/wiki/T-54/T-55 ('four flat external tanks, one for engine oil, three for diesel fuel'). Width across the fender not measurable (X) |
| fuel_tank_3 | fuel_tank | hull | pos [0.528, 1.33], size 1.032 × 0.45 | C | four flat box tanks on the right fender, rear to front x -2.74..2.164 m, from refs/iq_t55/07_Tapolca_hadipark_T_55_panoramio.jpg (perspective-corrected along the wheel line: vanishing point fitted from the five equal road-wheel diameters, positions in wheel diameters, scaled so the wheel 1-5 hub span equals track_on_ground 3.84 m); the rear tank's photo edge maps to -2.83 m, 6 cm past the fender end, so it is cut at the fender; count and shape agree with en.wikipedia.org/wiki/T-54/T-55 ('four flat external tanks, one for engine oil, three for diesel fuel'). Width across the fender not measurable (X) |
| fuel_tank_4 | fuel_tank | hull | pos [1.614, 1.33], size 1.06 × 0.45 | C | four flat box tanks on the right fender, rear to front x -2.74..2.164 m, from refs/iq_t55/07_Tapolca_hadipark_T_55_panoramio.jpg (perspective-corrected along the wheel line: vanishing point fitted from the five equal road-wheel diameters, positions in wheel diameters, scaled so the wheel 1-5 hub span equals track_on_ground 3.84 m); the rear tank's photo edge maps to -2.83 m, 6 cm past the fender end, so it is cut at the fender; count and shape agree with en.wikipedia.org/wiki/T-54/T-55 ('four flat external tanks, one for engine oil, three for diesel fuel'). Width across the fender not measurable (X) |
| headlights | headlight | hull | pos [2.35, 0.95], size 0.18 × 0.36 | C | side: front right of the glacis with a tubular guard, seen in refs/iq_t55/07_Tapolca_hadipark_T_55_panoramio.jpg, refs/iq_t55/09_T_55_4.jpg and refs/iq_t55/03_Disabled_Iraqi_T_55_tank_at_the_Jalibah_Airfield.jpg; position estimated from those perspective photos |
| splash_board | other | hull | points [2.55, -0.95] [2.55, 0.95] | C | raised splash board across the upper glacis, seen in refs/iq_t55/07_Tapolca_hadipark_T_55_panoramio.jpg and refs/iq_t55/03_Disabled_Iraqi_T_55_tank_at_the_Jalibah_Airfield.jpg; x estimated from the photos |
| tow_hooks | tow_hook | hull | pos [2.75, 0.75], size 0.16 × 0.12, mirrored | C | two tow hooks on the glacis, one each side, seen in refs/iq_t55/07_Tapolca_hadipark_T_55_panoramio.jpg, refs/iq_t55/09_T_55_4.jpg and refs/iq_t55/03_Disabled_Iraqi_T_55_tank_at_the_Jalibah_Airfield.jpg; positions estimated from the photos |
| turret_rails | other | turret | points [0.2, 0.98] [-0.6, 0.95], mirrored | C | grab rails on both turret sides, seen in refs/iq_t55/07_Tapolca_hadipark_T_55_panoramio.jpg (right) and refs/iq_t55/09_T_55_4.jpg (left); positions estimated from the photos |

### Hooks

- exhaust: [-2.435, -1.45] (X): side: 'The engine exhaust is on the left fender' (en.wikipedia.org/wiki/T-54/T-55); position along the fender is unknown (old sheet had it rear right)
- dust: [-2.903, 1.34] [-2.903, -1.34] (C): rear ends of the tracks
- smoke: [-2.06, 0] [0.281, 0] (C): engine deck and turret centre (game effect)

### Detail inventory

| Detail | What | Status | Conf | Source |
|---|---|---|---|---|
| hull | Hull roof outline with glacis corners | drawn | C | docs/vehicle_sheets_draft.md §3.1 (old approximate sheet) |
| fender | Track guards (fenders) both sides | drawn | C | docs/vehicle_sheets_draft.md §3.1 (old approximate sheet) |
| turret | Cast dome turret | drawn | C | docs/vehicle_sheets_draft.md §3.1 (old approximate sheet) |
| track | Tracks, 580 mm, all-steel | drawn | C | en.wikipedia.org/wiki/T-54/T-55 ('all-steel track'); weaponsystems.net/system/630-T-55 (T-55A data table) |
| road_wheels | Five road wheels per side, wider gap after wheel 1, no return rollers | drawn | C | gap ratios 1.44 : 1.05 : 1.06 : 1.03 wheel diameters from refs/iq_t55/07_Tapolca_hadipark_T_55_panoramio.jpg (perspective-corrected along the wheel line: vanishing point fitted from the five equal roa... |
| barrel | 100 mm D-10T2S barrel | drawn | C | en.wikipedia.org/wiki/D-10_tank_gun |
| bore_evacuator | Bore evacuator (ejector) on the barrel | drawn | C | en.wikipedia.org/wiki/D-10_tank_gun |
| mantlet | Gun mantlet and canvas cover | pending | X | canvas mantlet cover seen in refs/iq_t55/07_Tapolca_hadipark_T_55_panoramio.jpg; plastic-wrapped in refs/iq_t55/09_T_55_4.jpg; shape from above still needs a top view |
| coax_port | Coaxial MG port beside the gun | pending | X | en.wikipedia.org/wiki/T-54/T-55 (PKT coax on the T-55A); position needs a front view |
| driver_hatch | Driver's single-piece hatch, front left, swings left | drawn | X | en.wikipedia.org/wiki/T-54/T-55; armyrecognition.com T-55 page |
| driver_periscopes | Two driver's periscopes forward of the hatch | pending | C | armyrecognition.com T-55 page |
| headlights | Driving light and IR headlight on the hull front | drawn | C | front right of the glacis, with guard: refs/iq_t55/07_Tapolca_hadipark_T_55_panoramio.jpg, refs/iq_t55/09_T_55_4.jpg, refs/iq_t55/03_Disabled_Iraqi_T_55_tank_at_the_Jalibah_Airfield.jpg |
| cupola | Commander's cupola with periscopes, turret left | drawn | C | en.wikipedia.org/wiki/T-54/T-55 |
| cupola_ir_light | OU-3 IR light on the front of the cupola | drawn | X | armyrecognition.com T-55 page |
| loader_hatch | Loader's hatch, turret right | drawn | C | docs/vehicle_sheets_draft.md §3.1 (old approximate sheet) |
| dshk | 12.7 mm DShK AA MG on the loader's hatch | unconfirmed | C | en.wikipedia.org/wiki/T-54/T-55: fitted to new and old T-55s from 1970; weaponsystems.net/system/630-T-55 (T-55A data table): retrofitted 1972. Not confirmed on Iraqi export tanks in 1980. Seen on Iraqi T-55s in refs/iq_t55/03_Disabled_Iraqi_T_55_tank_at_the_Jalibah_Airfield.jpg (1991) and refs/iq_t55/04_Iraqi_T_55_tank_in_Sadr_Al_Yusafiyah.jpg (2000s); no 1980 photo in the set |
| ir_searchlight | L-2 'Luna' IR searchlight right of the gun | drawn | C | armyrecognition.com T-55 page |
| gunner_sight | Gunner's sight aperture / periscope on the turret roof | pending | X | not in the sources checked |
| turret_fittings | Turret grab rails (both sides); lifting eyes and brackets still pending | drawn (turret_rails) | C | refs/iq_t55/07_Tapolca_hadipark_T_55_panoramio.jpg, refs/iq_t55/09_T_55_4.jpg |
| ventilator_dome | Dome ventilator on the front right of the turret | removed | C | en.wikipedia.org/wiki/T-54/T-55: the dome on the front right identifies the older T-54; the T-55 lacks it (old sheet had it at turret [-1.0, 0.35]) |
| fuel_tanks | Four flat external tanks (three fuel, one oil) on the right fender | drawn (fuel_tank_1) | C | refs/iq_t55/07_Tapolca_hadipark_T_55_panoramio.jpg (four boxes on the right fender); en.wikipedia.org/wiki/T-54/T-55 |
| rear_drums | Two jettisonable fuel drums on the hull rear | unconfirmed | C | armyrecognition.com T-55 page; en.wikipedia.org/wiki/T-54/T-55 (400 l rear drums). Fit on Iraqi tanks in 1980 not confirmed. Two drums on the rear plate in refs/iq_t55/04_Iraqi_T_55_tank_in_Sadr_Al_Yusafiyah.jpg (2000s Iraqi); onthewaymodels.com ACE T-55 review: two drums on brackets on the rear hull. No 1980 photo in the set |
| toolbox | Stowage boxes on the left fender | drawn | C | docs/vehicle_sheets_draft.md §3.1 (old approximate sheet) |
| spare_links | Spare track links on the fenders | drawn | C | docs/vehicle_sheets_draft.md §3.1 (old approximate sheet) |
| tow_cables | Tow cables along the fenders or hull | pending | X | not in the sources checked |
| tow_hooks | Two tow hooks on the glacis | drawn | C | refs/iq_t55/07_Tapolca_hadipark_T_55_panoramio.jpg, refs/iq_t55/09_T_55_4.jpg, refs/iq_t55/03_Disabled_Iraqi_T_55_tank_at_the_Jalibah_Airfield.jpg |
| engine_deck | Engine deck plate | drawn | C | docs/vehicle_sheets_draft.md §3.1 (old approximate sheet) |
| engine_louvres | Radiator grilles / louvres on the engine deck | drawn | X | count and pitch unknown |
| exhaust | Exhaust outlet on the left fender | pending | C | en.wikipedia.org/wiki/T-54/T-55. Not visible in any of the nine photos (left rear) |
| unditching_log | Unditching beam across the rear | drawn | C | docs/vehicle_sheets_draft.md §3.1 (old approximate sheet) |
| snorkel | Deep-wading snorkel and its stowage | unconfirmed | C | en.wikipedia.org/wiki/T-54/T-55 (OPVT snorkel on the T-54A); theworldwars.net T-54/T-55 entry (T-55A column) lists the T-55A as not amphibious; stowage place on the T-55 not found |
| glacis_weld | Weld seams at the glacis corners | drawn | C | docs/vehicle_sheets_draft.md §3.1 (old approximate sheet) |
| tactical_number | Stencilled tactical number on the turret sides | drawn (mark_r) | C | game convention (no national symbols) |
| ktd_rangefinder | KTD-1/2 laser rangefinder box over the mantlet | excluded | C | en.wikipedia.org/wiki/T-54/T-55: fitted from 1974; not confirmed on Iraqi tanks in 1980, so not drawn |
| rubber_skirts | Rubber side skirts | excluded | C | en.wikipedia.org/wiki/T-54/T-55: late-production T-55A only |
| t55am_armour | Appliqué turret and glacis armour, 902B smoke dischargers (T-55AM) | excluded | C | weaponsystems.net lists the T-55AM and T-55AMV as deep modernisations; globalsecurity.org titles the T-55AM 'Model 1983' |
| t55amv_era | Kontakt-1 ERA blocks (T-55AMV) | excluded | C | weaponsystems.net/system/630-T-55 (T-55A data table) |
| fuel_tank_2 | Right fender tank 2 of 4 (rear to front) | drawn | C | refs/iq_t55/07_Tapolca_hadipark_T_55_panoramio.jpg |
| fuel_tank_3 | Right fender tank 3 of 4 (rear to front) | drawn | C | refs/iq_t55/07_Tapolca_hadipark_T_55_panoramio.jpg |
| fuel_tank_4 | Right fender tank 4 of 4 (rear to front) | drawn | C | refs/iq_t55/07_Tapolca_hadipark_T_55_panoramio.jpg |
| splash_board | Splash board across the upper glacis | drawn | C | refs/iq_t55/07_Tapolca_hadipark_T_55_panoramio.jpg, refs/iq_t55/03_Disabled_Iraqi_T_55_tank_at_the_Jalibah_Airfield.jpg |
| aerial_base | Radio aerial base on the turret | pending | X | aerial visible in refs/iq_t55/03_Disabled_Iraqi_T_55_tank_at_the_Jalibah_Airfield.jpg; base position not readable with the turret traversed |

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
| hull_len (stated) | 6.20 m (T-55A) | 6.04 m (regular hull) | Beckett 2026-10-30; en.wikipedia.org/wiki/T-54/T-55 |
| hull geometry x (outlines, tracks, part positions, turret pivot) | 6.45 m long | 6.04 m long (scaled by 0.936) | chosen hull_len; proportions still from the old sheet until a plan view exists |
| gun muzzle_x | 5.5 m | 5.722 m | keeps overall length 9.00 m with the shorter hull |
| right fender tanks | two round cylinders | four flat box tanks along the fender | refs/iq_t55/07_Tapolca_hadipark_T_55_panoramio.jpg; en.wikipedia.org/wiki/T-54/T-55 |
| road wheels | not drawn (pending) | five per side, gaps 1.20 / 0.88 / 0.89 / 0.87 m | refs/iq_t55/07_Tapolca_hadipark_T_55_panoramio.jpg |
| headlights, splash board, tow hooks, turret rails | missing | drawn (conf C) | refs/iq_t55/07_Tapolca_hadipark_T_55_panoramio.jpg, refs/iq_t55/09_T_55_4.jpg, refs/iq_t55/03_Disabled_Iraqi_T_55_tank_at_the_Jalibah_Airfield.jpg |

### Excluded details (post-1980 or unconfirmed for 1980)

- KTD-1/KTD-2 laser rangefinder over the mantlet: fitted from 1974 (Wikipedia), not confirmed on Iraqi tanks in 1980. Not drawn.
- Rubber side skirts: late-production T-55A only (Wikipedia). Not drawn.
- T-55AM appliqué armour ('Brezhnev eyebrows') and 902B smoke dischargers: 1983 modernisation (globalsecurity.org 'T-55AM Model 1983'). Not drawn.
- T-55AMV Kontakt-1 ERA (weaponsystems.net). Not drawn.

### Open questions

- Plan view: none of the nine photos is a top view (01 is an oblique of a wreck). Hull and turret outlines, hatch and cupola positions, and the turret pivot stay C until a drawing or near-vertical photo is supplied.
- Square-on side view: the wheel gaps come from a three-quarter photo (07) and disagree with photo 04 by up to 11% on single gaps (span agrees within 1.3%). A side drawing would settle them.
- DShK on the loader's hatch: present on Iraqi T-55s in 1991 (03) and later (04). Soviet tanks got it from 1970. Were Iraqi T-55s fitted by September 1980? Not drawn until you confirm.
- Rear fuel drums: two drums on the rear plate in 04 (2000s). Carried in 1980 combat order? Not drawn until you confirm.
- Width: 3.27 m (three sources) vs 3.37 m (Wikipedia). A plan view decides.
- Exhaust outlet: on the left fender (Wikipedia) but not visible in any photo; position along the fender unknown.

### Notes

- Regular T-55 hull (6.04 m) chosen by Beckett on 2026-10-30. Nine Wikimedia Commons photos measured (refs/iq_t55/, not in the repo). All are perspective photos, so every photo-derived value is conf C and taken as ratios only.
- Road wheel gaps, wheel diameter and the right-fender tank positions are measured along the wheel line of photo 07 (method in the road_wheels src). Fender ends and idler/sprocket positions from the same fit were extrapolated beyond the wheels and disagree with the hull length by 0.5 m, so they are not used.
- Road wheels are drawn but sit under the fenders from above; they matter for the side-view checks and the spec, not the top-down look.

### Critique of the latest render

- Turret reads as an egg (pointed nose, wide rear) because the old-sheet points put the widest point behind the pivot. The T-55's cast turret is a near-round dome; this is the most visible error and needs the plan view.
- Hull is now 6.04 m (regular hull), so check-sheets passes. The shape is the old sheet scaled down, so the bevelled rear corners and steep glacis chamfers still look boat-like until a plan view exists.
- With the hull shortened and the turret unchanged, the turret now covers 54% of the hull length and overlaps the front of the engine deck. The turret outline is the next thing a plan view must fix.
- No mantlet: the barrel starts at the turret edge. The mantlet and its canvas cover are pending a top or front view.
- Right fender now carries four flat box tanks spaced from photo 07; their width across the fender is a guess (0.45 m, X), and the rear tank was cut 6 cm to stay on the fender.
- Engine deck is one even louvre grid. Real decks have grilles and access panels in a pattern that needs a rear-deck photo.
- Track ends show as solid black blocks with no idler or sprocket shape. Acceptable from above, but fender ends need checking on the plan view.
- Tactical numbers are large relative to the turret and should shrink once the turret outline is corrected.
- At 64 px the T-55 now scores IoU 0.843 against the T-62 (was 0.899), because the shorter hull makes the gun reach further past the nose. All pairs are under the 0.90 flag, but the turret outline is still unmeasured.
- Front details are now readable: tow hooks, splash board and the right-hand headlight block give the nose a clear front. Their positions are estimates from three-quarter photos.

