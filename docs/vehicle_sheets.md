# VEHICLE TOP-DOWN SPRITE SHEETS
Reference for drawing every vehicle procedurally (canvas vector shapes, no image assets) from a top-down view.
Setting: Iran-Iraq War, 1980 era, plus a later-era drone tier.

## 0. How to use this file
- Put it at `docs/vehicle_sheets.md`.
- Convert each sheet into a data entry under `src/data/sprites/` (one TS/JSON object per vehicle) plus ONE generic renderer that reads the data. Do not hand-write a separate draw function per vehicle.
- Numbers are approximate, taken from published specs and plan-view drawings. They are good enough for correct proportions and recognizable silhouettes. Items marked (verify) should be checked against reference photos or plan drawings before polishing.
- Gameplay stats live elsewhere (unit data files). This file only describes appearance and geometry.

## 1. Conventions

### Coordinates
- Units are meters. `PX_PER_M` is a single tunable constant (default 8).
- Every sprite is authored at heading 0, facing +X (east). +Y is the vehicle's RIGHT side (screen-down when facing east). -Y is LEFT.
- Hull-local origin: center of the hull's bounding box.
- Turret-local origin: the turret pivot. Turret group rotates independently around it.
- Helicopter-local origin: main rotor mast.
- `*_half` outlines list the RIGHT half (y >= 0) from front-center to rear-center. Close the shape by mirroring (y -> -y) in reverse order.

### Layer order (bottom to top)
1. Ground shadow (ground vehicles: soft dark offset 0.15 m. Helicopters/drones: same silhouette, offset and scaled by altitude)
2. Tracks / wheels (animate tread scroll or wheel spin)
3. Hull body + fenders
4. Hull details (hatches, louvres, stowage, fuel tanks, tools)
5. Turret group: turret body, hatches, cupola, searchlight, AA MG
6. Gun barrel (recoils along its own axis)
7. Markings (stenciled tactical number, no real flags or national symbols)
8. Damage overlay (scorch, dents, missing parts)
9. Selection brackets and UI (drawn by the HUD, not part of the sprite)

### Top-down track note
Fenders cover most of the road wheels on tracked vehicles. Draw a track strip slightly wider than the fender so cleats show at the front and rear and along the outer edge, then draw fender plates over it. Only vehicles with no fenders (M113, BMP-1 skirts excluded) show wheels directly.

### Damage zones (for the unit-panel schematic and the damage model)
- `hull`: hull polygon
- `turret`: turret polygon
- `engine`: rear 30% of hull length
- `trackL` / `trackR`: the two track strips
- `crew`: hatch positions listed per vehicle
Helicopters use: `fuselage`, `engine`, `main_rotor`, `tail`, `crew`.

### Level of detail
- Zoom < 0.5: silhouette only (hull + turret + gun in base color, NATO type icon above).
- Zoom >= 0.5: add details and markings.
- Zoom >= 1.0: add stowage, hatch outlines, texture, tread detail.

### Animation hooks every sprite defines
`muzzle` (turret-local point for flash and tracer origin), `exhaust` (hull-local, smoke/dust origin), `smoke_points` (burning wreck smoke origins), `dust_points` (kick-up behind tracks/wheels), `recoil_m` (barrel travel).

### Left / right
"Left" and "right" always mean the vehicle's own left and right.

## 2. Palette tokens
```
IQ_SAND        #C8B07E   Iraqi overall sand / khaki
IQ_SAND_SHADE  #A98F5E
IQ_OLIVE       #5E6238   Iraqi olive patches / alternative scheme
IQ_BROWN       #6B4F32   Iraqi camo brown patches
IR_OLIVE       #4F5A3A   Iranian olive drab
IR_SAND        #BFA877   Iranian sand
IR_DARK        #3B3F2E   Iranian dark patches
STEEL          #3A3B36   wheels, tools, hatches
RUBBER         #1F1F1D   tracks, tires
GUN            #2F302C   barrels
GLASS          #5E8C93   helicopter canopy
STENCIL        #E8E2CF   tactical numbers (bone white)
```
Default schemes: Iraqi ground vehicles = overall IQ_SAND with optional IQ_OLIVE or IQ_BROWN blotches. Iranian = IR_OLIVE or IR_SAND with IR_DARK patches. Helicopters use the same families, lighter on the underside.

---

## 3. IRAQI VEHICLES

### 3.1 T-55
```yaml
id: iq_t55
class: MBT
real_m: {hull_len: 6.45, overall_len: 9.0, width: 3.27}
recognition: round dome turret, long thin 100mm gun with bore evacuator, no skirts, round hull rear
hull_half: [[3.15,0],[3.15,0.75],[2.5,1.25],[1.9,1.35],[-2.9,1.35],[-3.2,1.1],[-3.2,0]]
tracks: {y_center: 1.34, width: 0.58, x_from: -3.1, x_to: 3.25, road_wheels: 5, note: "gap between wheel 1 and 2 is wider than the rest"}
fenders: flat plates over tracks, y 1.05..1.635
turret:
  pivot: [0.3, 0]
  half: [[1.55,0],[1.45,0.5],[0.9,0.95],[0.0,1.05],[-0.9,0.95],[-1.5,0.55],[-1.7,0]]
  cupola: {pos: [-0.15,-0.55], r: 0.3, side: left}
  loader_hatch: {pos: [-0.5,0.5], size: [0.5,0.45], side: right}
  ventilator_dome: {pos: [-1.0,0.35], r: 0.15}
  searchlight_ir: {pos: [1.2,0.45], size: [0.35,0.3]}   # verify side
gun: {caliber_mm: 100, from_x: 1.55, to_x: 5.5, width: 0.14, bore_evac: {x: 3.8, len: 0.5, width: 0.24}, recoil_m: 0.3}
muzzle: [5.5, 0]
hull_details:
  engine_deck: {x: [-3.0,-1.4], y: [-0.9,0.9], style: louvre_grille}
  fuel_tanks_right_fender: 2 cylinders, 1.2 x 0.3 each
  left_fender: toolbox + spare track links
  rear_deck: unditching log across engine deck
  driver_hatch: [2.4, 0]
crew_hatches: [[-0.15,-0.55 turret], [-0.5,0.5 turret], [2.4,0 hull]]
exhaust: [-3.2, 0.5]
default_paint: IQ_SAND (optional IQ_OLIVE blotches)
```

### 3.2 T-62
```yaml
id: iq_t62
class: MBT
real_m: {hull_len: 6.63, overall_len: 9.77, width: 3.35}
recognition: flat wide turret, long smoothbore with fume extractor 2/3 down barrel, spent-case ejection hatch on turret rear
hull_half: [[3.3,0],[3.3,0.8],[2.7,1.3],[2.0,1.4],[-3.0,1.4],[-3.3,1.15],[-3.3,0]]
tracks: {y_center: 1.39, width: 0.58, x_from: -3.2, x_to: 3.3, road_wheels: 5, note: "uneven wheel spacing (verify exact gaps)"}
turret:
  pivot: [0.5, 0]
  half: [[1.8,0],[1.6,0.7],[1.0,1.1],[-0.3,1.3],[-1.4,1.0],[-1.9,0.5],[-2.0,0]]
  cupola: {pos: [-0.4,-0.6], r: 0.3, side: left}
  loader_hatch: {pos: [-0.5,0.6], size: [0.55,0.5], side: right, optional_mg: DShK_12.7}
  ejection_port: {pos: [-1.95,0], size: [0.12,0.25]}
  searchlight_ir: {pos: [1.3,0.5], size: [0.35,0.3]}   # verify side
gun: {caliber_mm: 115, from_x: 1.8, to_x: 5.95, width: 0.15, fume_extractor: {x: 4.6, len: 0.7, width: 0.27}, recoil_m: 0.35}
muzzle: [5.95, 0]
hull_details: engine deck louvres rear x[-3.1,-1.5]; fuel tanks on right fender; unditching log; toolbox left
exhaust: [-3.3, 0.5]
default_paint: IQ_SAND
```

### 3.3 T-72 (Ural / early export)
```yaml
id: iq_t72
class: MBT
real_m: {hull_len: 6.95, overall_len: 9.53, width: 3.59}
recognition: low rounded cast turret with rangefinder "ears" on the front sides, thick 125mm barrel, six road wheels, rubber skirt segments on front fenders
hull_half: [[3.45,0],[3.45,0.9],[2.9,1.45],[2.2,1.6],[-3.2,1.6],[-3.5,1.4],[-3.5,0]]
tracks: {y_center: 1.5, width: 0.58, x_from: -3.4, x_to: 3.4, road_wheels: 6, return_rollers: 3 (hidden under fender in top view)}
side_skirts: front rubber skirt plates, x 0.8..3.4, y 1.6..1.8
turret:
  pivot: [0.35, 0]
  half: [[1.75,0],[1.6,0.7],[1.15,1.15],[0.0,1.3],[-1.0,1.2],[-1.6,0.8],[-1.85,0]]
  rangefinder_ears: 2 small bumps at [1.45,±0.9], size 0.25 x 0.18
  cupola: {pos: [-0.3,0.55], r: 0.3, side: right, mg: NSVT_12.7}
  gunner_hatch: {pos: [-0.1,-0.5], size: [0.4,0.35], side: left}
  searchlight_ir: {pos: [1.3,0.55]}
gun: {caliber_mm: 125, from_x: 1.75, to_x: 5.7, width: 0.17, fume_extractor: {x: 4.2, len: 0.6, width: 0.27}, recoil_m: 0.4}
muzzle: [5.7, 0]
hull_details: engine deck rear, fuel tank rack on right fender, unditching log, driver hatch front center [2.8,0]
exhaust: [-3.5, 0.6]
default_paint: IQ_SAND
```

### 3.4 PT-76
```yaml
id: iq_pt76
class: LIGHT_TANK_AMPHIBIOUS
real_m: {hull_len: 6.91, overall_len: 7.6, width: 3.14}
recognition: boat-shaped pointed hull, small conical turret centered, short gun with large double-baffle muzzle brake, hinged trim vane on the bow
hull_half: [[3.45,0],[3.2,0.7],[2.2,1.3],[1.2,1.57],[-3.0,1.57],[-3.45,1.2],[-3.45,0]]
tracks: {y_center: 1.4, width: 0.36, x_from: -3.3, x_to: 3.3, road_wheels: 6}
turret:
  pivot: [0.2, 0]
  half: [[1.3,0],[1.2,0.5],[0.7,1.0],[-0.5,1.1],[-1.3,0.75],[-1.5,0]]
  cupola: {pos: [-0.5,0.45], r: 0.28, side: right}
  hatch_left: {pos: [-0.3,-0.55], size: [0.4,0.35]}
gun: {caliber_mm: 76, from_x: 1.3, to_x: 3.6, width: 0.1, muzzle_brake: {x: 3.45, len: 0.3, width: 0.32, type: double_baffle}, recoil_m: 0.2}
muzzle: [3.6, 0]
hull_details: bow trim vane (hinged plate 2.0 x 0.9 at x 2.5..3.4), flat engine deck rear, two waterjet outlets at rear (small slots)
exhaust: [-3.4, 0.5]
dust_points: heavy only on land; no dust when swimming (use wake instead)
default_paint: IQ_SAND
```

### 3.5 BMP-1
```yaml
id: iq_bmp1
class: IFV
real_m: {hull_len: 6.74, width: 2.97}
recognition: low wedge nose, small turret centered, 73mm short gun with a missile rail on top, two big roof hatch pairs on the rear troop compartment, rear door fuel tanks
hull_half: [[3.37,0],[3.35,0.8],[2.6,1.2],[1.8,1.45],[-3.0,1.45],[-3.37,1.3],[-3.37,0]]
tracks: {y_center: 1.3, width: 0.38, x_from: -3.3, x_to: 3.3, road_wheels: 6}
turret:
  pivot: [0.4, 0]
  half: [[1.0,0],[0.9,0.5],[0.4,0.85],[-0.5,0.85],[-1.0,0.55],[-1.05,0]]
  commander_hatch: {pos: [-0.3,-0.4], r: 0.22}
gun: {caliber_mm: 73, from_x: 1.0, to_x: 3.1, width: 0.1, atgm_rail: {x: [0.4,1.6], y_offset: 0.12}, recoil_m: 0.1}
muzzle: [3.1, 0]
hull_details:
  driver_hatch: [2.3,-0.6]
  engine_deck: front right [2.0,0.7]
  troop_roof_hatches: 4 at x -1.6, -2.4 and y ±0.5 (size 0.5 x 0.5)
  rear_doors_fuel: 2 doors at x -3.37
exhaust: [-3.0, 0.9]
default_paint: IQ_SAND
```

### 3.6 BTR-60PB
```yaml
id: iq_btr60
class: APC_WHEELED
real_m: {hull_len: 7.56, width: 2.82}
recognition: 8 wheels in 4 axle pairs, boat-shaped sloping nose, small conical turret with 14.5mm heavy MG and 7.62 coax
hull_half: [[3.78,0],[3.6,0.8],[2.9,1.3],[2.2,1.4],[-3.5,1.4],[-3.78,1.15],[-3.78,0]]
wheels: {y_center: 1.23, size: [1.1,0.35], axles_x: [2.4,1.0,-0.6,-2.0], note: "approx axle spacing (verify)", tire_color: RUBBER}
turret:
  pivot: [0.8, 0]
  shape: circle, r: 0.55
gun: {caliber_mm: 14.5, from_x: 0.55, to_x: 1.9, width: 0.07, coax: 7.62 (offset y 0.1)}
muzzle: [1.9, 0]
hull_details: driver hatch left front [2.0,-0.4], commander hatch right [1.6,0.4], side hatches (small), engine deck rear x[-3.5,-2.4], spare wheel none
wheel_spin: yes; dust from rear axle wheels
default_paint: IQ_SAND
```

### 3.7 BTR-50
```yaml
id: iq_btr50
class: APC_TRACKED
real_m: {hull_len: 7.08, width: 3.14}
recognition: PT-76 chassis nose, open-topped boxy troop bay, no turret
hull_half: [[3.55,0],[3.2,0.7],[2.3,1.35],[1.3,1.57],[-3.1,1.57],[-3.55,1.2],[-3.55,0]]
tracks: {y_center: 1.4, width: 0.36, x_from: -3.4, x_to: 3.4, road_wheels: 6}
troop_bay: open rectangle x[-3.0,0.4], y[-1.2,1.2], dark interior (#222), two benches along each side, draw 0-8 infantry dots when loaded
hull_details: front trim vane, driver hatches front center, commander position front right, MG pintle optional [0.6,0.9]
default_paint: IQ_SAND
```

### 3.8 ZSU-23-4 Shilka
```yaml
id: iq_zsu234
class: SPAAG
real_m: {hull_len: 6.3, width: 3.13}
recognition: huge flat boxy turret, four parallel barrels, radar dish on rear turret roof
hull_half: [[3.15,0],[3.15,1.0],[2.7,1.5],[2.0,1.57],[-3.1,1.57],[-3.15,1.4],[-3.15,0]]
tracks: {y_center: 1.4, width: 0.36, x_from: -3.0, x_to: 3.05, road_wheels: 6}
turret:
  pivot: [0.4, 0]
  half: [[1.5,0],[1.5,0.9],[1.1,1.4],[-0.8,1.5],[-1.6,1.4],[-1.8,0.8],[-1.8,0]]
  radar: {pos: [-1.1,0], deployed: "dish seen edge-on, ellipse 0.9 x 0.4", stowed: "folded flat plate 1.2 x 0.9", tracking_blip: yes}
guns: 4 barrels 23mm at y ±0.25 and ±0.6, x from 1.5 to 3.5, flash hiders at tips, burst recoil 0.1 m
muzzle: [3.5, ±0.25 / ±0.6]  # alternate barrels per shot
hull_details: driver hatch front [2.5,0], engine deck rear, side stowage boxes left/right
default_paint: IQ_SAND
```

### 3.9 ZU-23-2 (towed)
```yaml
id: iq_zu23
class: TOWED_AA
real_m: {travel_len: 4.57, width: 1.83}
states:
  stowed: {barrels: forward along x, wheels at x 0.2 (two tires y ±0.9), tow bar rear to x -2.3}
  deployed: {turntable circle r 0.6, 4 outrigger legs at ±45 degrees 1.1 m, twin 23mm barrels length 2.0 at y ±0.18, gunner seat left side, 2 ammo drums beside}
recognition: twin barrels over a small round mount; two small tires and tow bar when stowed
muzzle: [2.0, ±0.18]
default_paint: IQ_SAND
```

### 3.10 Mi-24D Hind-D
```yaml
id: iq_mi24
class: ATTACK_HELO
real_m: {fuselage_len: 17.5, overall_len: 21.5, rotor_dia: 17.3, tail_rotor_dia: 3.9, wing_span: 6.7}
origin: main rotor mast
recognition: tandem stepped cockpit (gunner front, pilot higher behind), short stub wings with weapon pylons, two engine humps side by side, big 5-blade rotor
fuselage_half: [[6.5,0],[6.2,0.45],[5.0,0.8],[3.0,0.95],[0.0,1.0],[-2.0,0.9],[-4.0,0.55],[-7.0,0.3],[-11.0,0.18],[-11.0,0]]
wing_half: [[0.3,0.9],[0.1,3.3],[-0.9,3.3],[-1.4,0.9]]
cockpit: two glass bubbles, gunner [5.2,0] 0.9 x 0.7, pilot [3.4,0] 1.0 x 0.8, GLASS color
engines: two humps x[-3.5,1.0], y ±0.55, intake front, exhaust to the sides at x -3.5
main_rotor: {radius: 8.65, blades: 5, blur_alpha: 0.12, spin: clockwise_viewed_from_above}
tail_rotor: {pos: [-10.7, 0.6], visual: "thin blur bar 3.9 m long along x", side: right (verify; later variants moved to left)}
chin_gun: {pos: [6.2,0], weapon: 12.7mm rotary, small turret bump}
hardpoints: y ±1.6 and ±2.6 (UB-32 rocket pods, 0.4 x 1.6), wingtip ATGM rails y ±3.3 (2 tubes each)
muzzle_points: chin gun [6.5,0]; pods at hardpoints; rails at wingtip
landing_gear: retractable, do not draw in flight; draw main wheels when parked
shadow: offset by altitude, scale 1.0
default_paint: IQ_SAND/IQ_OLIVE/IQ_BROWN camo top, lighter underside
```

### 3.11 Mi-8 Hip
```yaml
id: iq_mi8
class: TRANSPORT_HELO (armed variant: rocket pods)
real_m: {fuselage_len: 18.2, rotor_dia: 21.3}
origin: main rotor mast
recognition: glazed nose, boxy cabin, engines on top in front of the mast, long tail boom, big rotor
fuselage_half: [[6.0,0],[5.8,0.6],[5.0,1.0],[3.5,1.2],[-1.0,1.25],[-4.0,1.2],[-5.5,0.75],[-8.0,0.45],[-12.1,0.25],[-12.1,0]]
engines: boxed hump x[-0.5,3.5], y[-0.7,0.7], two round intakes at front
main_rotor: {radius: 10.65, blades: 5, blur_alpha: 0.1}
tail_rotor: {pos: [-11.8, 0.55], visual: "thin blur bar 3.9 m", side: right (verify)}
cabin: sliding door left [1.5,-1.25], clamshell rear doors x[-5.5,-4.5]
stores_racks: outriggers at x 0.5, y ±1.5..±2.4, each carries a UB-16 pod (0.35 x 1.4) when armed
muzzle_points: pods [0.9, ±2.0]
passengers: up to 24 infantry, unload at landing zone
default_paint: IQ_SAND / IQ_OLIVE
```

### 3.12 SA-342 Gazelle (HOT)
```yaml
id: iq_gazelle
class: LIGHT_ATTACK_HELO
real_m: {fuselage_len: 9.5, rotor_dia: 10.5}
origin: main rotor mast
recognition: fishbowl bubble cockpit, narrow body, fenestron (ducted tail fan) in a fin, skids
fuselage_half: [[2.4,0],[2.2,0.5],[1.2,0.85],[0,0.9],[-1.2,0.8],[-2.5,0.4],[-5.0,0.22],[-7.0,0.2]]
cockpit: bubble glass x[0.6,2.3], GLASS color
skids: y ±0.95, x[-1.3,2.2], crosstubes at x 1.2 and -0.6
main_rotor: {radius: 5.25, blades: 3}
tail: {fenestron: "vertical shroud seen edge-on, thin dark bar 1.1 m at x=-6.9", h_stabilizer: x -6.2, span ±0.8}
weapons: 2 outrigger pylons x 0.4, y ±1.0..±1.6, each 2 HOT tubes (0.15 x 1.5)
muzzle_points: [1.0, ±1.5]
default_paint: IQ_SAND/IQ_OLIVE
```

---

## 4. IRANIAN VEHICLES

### 4.1 Chieftain Mk 3/5
```yaml
id: ir_chieftain
class: MBT
real_m: {hull_len: 7.52, overall_len: 10.8, width: 3.5}
recognition: very long low sloped turret with big rear bustle, heavy 120mm gun with fume extractor, side skirt plates, six road wheels
hull_half: [[3.75,0],[3.75,0.7],[3.1,1.35],[2.4,1.6],[-3.4,1.6],[-3.75,1.4],[-3.75,0]]
tracks: {y_center: 1.5, width: 0.61, x_from: -3.7, x_to: 3.7, road_wheels: 6, return_rollers: 3}
side_skirts: thin plates 6 segments, y 1.6..1.75
turret:
  pivot: [0.5, 0]
  half: [[2.2,0],[2.2,0.4],[1.6,0.9],[0.5,1.35],[-1.0,1.5],[-2.0,1.4],[-2.5,0.8],[-2.6,0]]
  rear_bin: box x[-3.1,-2.6], y ±0.9
  cupola: {pos: [-1.2,0.6], r: 0.35, side: right, mg: .50 cal ranging gun nearby}
  loader_hatch: {pos: [-0.8,-0.7], size: [0.55,0.5], side: left, pintle: 7.62 GPMG}
  searchlight: {pos: [1.8,0.6], size: [0.4,0.35]}
gun: {caliber_mm: 120, from_x: 2.2, to_x: 6.5, width: 0.18, fume_extractor: {x: 4.9, len: 0.7, width: 0.3}, recoil_m: 0.45}
muzzle: [6.5, 0]
hull_details: driver hatch front center [3.0,0], engine deck rear with large grille x[-3.7,-2.2], fuel/stowage boxes on fenders
note_for_gameplay_art: engine deck looks slightly smaller/older than modern tanks; add rear smoke puffs on movement (unreliable engine flavor)
default_paint: IR_SAND or IR_OLIVE with IR_DARK patches
```

### 4.2 M60A1 Patton
```yaml
id: ir_m60a1
class: MBT
real_m: {hull_len: 6.95, overall_len: 9.44, width: 3.63}
recognition: tall rounded "whale" turret with a commander cupola carrying a .50 cal, thick 105mm gun with bore evacuator, pointed cast hull nose
hull_half: [[3.5,0],[3.45,0.7],[2.8,1.3],[2.0,1.6],[-3.3,1.65],[-3.5,1.4],[-3.5,0]]
tracks: {y_center: 1.43, width: 0.71, x_from: -3.4, x_to: 3.4, road_wheels: 6, return_rollers: 3}
turret:
  pivot: [0.4, 0]
  half: [[1.8,0],[1.65,0.7],[1.2,1.2],[0.2,1.5],[-1.0,1.5],[-2.0,1.1],[-2.4,0.6],[-2.45,0]]
  cupola: {pos: [-0.5,0.55], r: 0.35, side: right, mg: M85_.50}
  loader_hatch: {pos: [-0.9,-0.65], size: [0.55,0.5], side: left}
  searchlight: {pos: [1.5,0.65], size: [0.4,0.35]}
gun: {caliber_mm: 105, from_x: 1.8, to_x: 5.85, width: 0.15, bore_evacuator: {x: 4.3, len: 0.55, width: 0.26}, recoil_m: 0.4}
muzzle: [5.85, 0]
hull_details: driver hatch front center [2.8,0], large rear engine deck with grille x[-3.4,-2.0]
default_paint: IR_OLIVE
```

### 4.3 M47 / M48 Patton (shared template, two variants)
```yaml
id: ir_m48
class: MBT
variants: [M48, M47]
real_m: {M48: {hull_len: 6.9, overall_len: 8.7, width: 3.63}, M47: {hull_len: 6.4, overall_len: 8.5, width: 3.51}}
recognition: egg-shaped dome turret, 90mm gun with bore evacuator, no skirts, six road wheels
hull_half: [[3.45,0],[3.4,0.7],[2.7,1.3],[1.9,1.6],[-3.2,1.65],[-3.45,1.4],[-3.45,0]]
tracks: {y_center: 1.43, width: 0.71, x_from: -3.4, x_to: 3.4, road_wheels: 6, return_rollers: 3}
turret:
  pivot: [0.1, 0]
  half: [[1.6,0],[1.45,0.6],[1.0,1.1],[0,1.35],[-1.0,1.25],[-1.7,0.85],[-2.0,0.3],[-2.05,0]]
  M48_cupola: {pos: [-0.5,0.5], r: 0.33, side: right, mg: .50 cal}
  M47_differences: bulkier rear turret bustle, bow-gunner blister on the front right of the hull (verify), cupola smaller or absent
gun: {caliber_mm: 90, from_x: 1.6, to_x: 5.15, width: 0.13, bore_evacuator: {x: 3.7, len: 0.5, width: 0.22}, recoil_m: 0.35}
muzzle: [5.15, 0]
default_paint: IR_OLIVE
```

### 4.4 FV101 Scorpion
```yaml
id: ir_scorpion
class: LIGHT_TANK
real_m: {hull_len: 4.79, overall_len: 5.3, width: 2.18}
recognition: very low and small, short 76mm gun, small turret offset to the right, driver front left
hull_half: [[2.35,0],[2.35,0.6],[1.8,0.95],[-2.3,1.09],[-2.4,0.9],[-2.4,0]]
tracks: {y_center: 0.85, width: 0.43, x_from: -2.3, x_to: 2.3, road_wheels: 5}
turret:
  pivot: [0.0, 0.3]
  half: [[0.9,0],[0.8,0.4],[0.3,0.75],[-0.6,0.75],[-1.0,0.45],[-1.05,0]]
  cupola: {pos: [-0.3,0.35], r: 0.26}
  hatch: {pos: [-0.2,-0.3], size: [0.35,0.3]}
gun: {caliber_mm: 76, from_x: 0.9, to_x: 2.1, width: 0.1, bore_evacuator: {x: 1.5, len: 0.25, width: 0.15}, recoil_m: 0.15}
muzzle: [2.1, 0]
hull_details: driver hatch front left [1.7,-0.45], rear engine deck x[-2.4,-1.2]
default_paint: IR_OLIVE / IR_SAND
```

### 4.5 M113
```yaml
id: ir_m113
class: APC_TRACKED
real_m: {hull_len: 4.86, width: 2.69}
recognition: aluminum box, sloped nose, open ring MG mount on the roof, rear ramp, no wheels visible (skirts)
hull_half: [[2.43,0],[2.4,0.9],[1.9,1.3],[1.5,1.34],[-2.3,1.34],[-2.43,1.2],[-2.43,0]]
tracks: {y_center: 1.1, width: 0.38, x_from: -2.3, x_to: 2.3, road_wheels: 5}
no_turret: true
mg_mount: {pos: [0.3,0.4], type: M2_.50, ring: yes, rotates_like_turret: true}
hull_details:
  driver_hatch: [1.4,-0.5]
  commander_cupola: [0.3,0.4]
  engine_box: front right [1.4,0.6]
  cargo_hatch: roof rear, rectangle x[-2.0,-0.3], y[-0.5,0.5]
  rear_ramp: x -2.43, y ±0.6
  trim_vane: folded plate at nose
default_paint: IR_OLIVE
```

### 4.6 M151 Jeep with TOW (or 106mm recoilless rifle)
```yaml
id: ir_tow_jeep
class: ATGM_CARRIER
real_m: {len: 3.37, width: 1.58}
recognition: tiny open-top jeep, windshield, rear-mounted launcher
body_half: [[1.7,0],[1.7,0.6],[1.4,0.75],[-1.5,0.75],[-1.7,0.7],[-1.7,0]]
wheels: {y_center: 0.76, size: [0.7,0.25], axles_x: [1.05,-1.05], tire_color: RUBBER}
details: windshield at x 0.7, seats x[-0.5,0.6], spare tire at rear center, launcher on the cargo bed at [-1.0,0]
turret: {pivot: [-1.0,0], launcher: box 0.7 x 0.4, tube 1.2 long, sight on top}
variants: 106mm recoilless rifle (barrel 3.4 long from pivot, with spotting rifle on top)
muzzle: [1.2, 0]
default_paint: IR_OLIVE
```

### 4.7 Towed twin AA gun (35mm class)
```yaml
id: ir_aa_towed
class: TOWED_AA
real_m: {travel_len: 7.0, width: 2.0}
states: stowed (twin wheeled trailer, barrels forward) / deployed (turntable r 0.7, 4 outrigger legs 1.4 m, twin barrels length 3.1 at y ±0.2, gunner seat left, two ammo boxes)
note: reuse the ZU-23 template scaled up
muzzle: [3.1, ±0.2]
default_paint: IR_OLIVE
```

### 4.8 AH-1J Cobra
```yaml
id: ir_ah1j
class: ATTACK_HELO
real_m: {fuselage_len: 13.9, rotor_dia: 14.6, wing_span: 3.2}
origin: main rotor mast
recognition: super thin fuselage (under 1 m wide), tandem cockpit, stub wings, chin turret, two-blade rotor
fuselage_half: [[5.2,0],[5.0,0.25],[3.6,0.45],[1.0,0.55],[-1.0,0.5],[-3.0,0.35],[-5.0,0.22],[-8.4,0.12]]
wing_half: [[0.6,0.5],[0.3,1.7],[-0.4,1.7],[-0.7,0.5]]
cockpit: gunner front [4.0,0] 1.0 x 0.5, pilot rear [2.4,0] 1.0 x 0.5, GLASS
engines: twin exhausts either side of the mast at x -1.0
main_rotor: {radius: 7.3, blades: 2, visual: "two long blades plus blur disc alpha 0.1"}
tail_rotor: {pos: [-8.2, -0.25], visual: "thin blur bar 2.6 m", side: left (verify)}
chin_turret: {pos: [4.6,0], weapon: 20mm 3-barrel, rotates ±100 deg}
hardpoints: y ±1.1, ±1.6 (TOW pods 2 tubes each, 0.25 x 1.2)
muzzle_points: chin gun [5.0,0]; TOW [1.2, ±1.1]
shadow: thin elongated
default_paint: IR_OLIVE / IR_SAND top, lighter underside
```

### 4.9 CH-47 Chinook
```yaml
id: ir_ch47
class: HEAVY_TRANSPORT_HELO
real_m: {fuselage_len: 15.5, rotor_dia: 18.3, rotor_separation: 11.9, overall_len: 30}
origin: center of fuselage (two masts)
recognition: tandem rotors, huge boxy body, rear ramp, aft engine pylon
fuselage_half: [[7.7,0],[7.4,0.7],[6.5,1.2],[5.0,1.5],[3.0,1.7],[-3.0,1.7],[-6.5,1.55],[-7.75,1.1],[-7.75,0]]
sponsons: side fuel pods y 1.7..1.95, x[-1.5,5.5]
masts: front [5.9,0], rear [-6.0,0]
rotors: {radius: 9.14 each, blades: 3, counter_rotating, overlap region x[-3.0,3.0], blades offset 90 deg}
rear_pylon: block 1.6 x 3.2 at x -6.0, engines either side
ramp: x[-7.75,-6.2], down when unloading
cabin: windows both sides, front cockpit glass nose [6.5,0]
passengers: up to 30 infantry
shadow: very large
default_paint: IR_OLIVE
```

### 4.10 AB-205 / Bell 214 (shared utility template)
```yaml
id: ir_utility_helo
class: UTILITY_HELO
variants: [AB-205 (UH-1 type), Bell 214A]
origin: main rotor mast
recognition: long nose, boxy cabin with sliding doors, narrow tail boom, two-blade rotor
AB205_real_m: {fuselage_len: 12.7, rotor_dia: 14.6}
fuselage_half: [[3.0,0],[2.9,0.6],[2.0,1.05],[0.4,1.25],[-1.5,1.2],[-2.4,0.8],[-4.0,0.28],[-7.6,0.2]]
skids: y ±1.1, x[-2.2,2.4]
main_rotor: {radius: 7.3, blades: 2, stabilizer_bar: short bar perpendicular to blades with 2 paddles (AB-205 signature)}
tail_rotor: {pos: [-7.6,-0.2], visual: "thin blur bar 2.5 m", side: left (verify)}
tail: vertical fin plus small horizontal stabilizer
Bell214_differences: wider cabin (y ±1.35), blunter nose, bigger rotor (radius 7.62), no stabilizer bar, higher tail rotor
cabin: sliding doors both sides, 8-12 infantry
default_paint: IR_OLIVE
```

---

## 5. DRONES (post-1985 tier, illustrative shapes)

### 5.1 Fixed-wing recon drone (Mohajer-style)
```yaml
id: drone_recon_fw
class: RECON_DRONE
real_m: {len: 2.9, span: 3.5}
shape: slim fuselage, straight wing, pusher propeller at the tail, twin tail booms with a connecting tail plane
fuselage_half: [[1.45,0],[1.3,0.18],[0.3,0.22],[-1.0,0.15],[-1.45,0.1]]
wing_half: [[0.2,0.2],[0.1,1.75],[-0.2,1.75],[-0.3,0.2]]
tail_booms: y ±0.5 from x -0.3 to -1.6, tailplane at x -1.6
prop: blur disc r 0.35 at [-1.5,0]
roles: spotting only, extends fog-of-war vision
default_paint: IR_SAND (Iraqi counterpart: fictionalized, IQ_SAND)
```

### 5.2 Loitering attack drone (delta wing)
```yaml
id: drone_loiter
class: ATTACK_DRONE
real_m: {len: 2.0, span: 2.0}
shape: small delta wing, pointed nose, rear-mounted prop or motor
half: [[1.0,0],[-0.7,1.0],[-1.0,1.0],[-1.0,0]]
behavior_visual: dives to target, impact flash; no recoil
default_paint: IR_SAND
```

---

## 6. Verification checklist (check against reference plan-view drawings before final polish)
- T-55 vs T-62: road wheel gaps, searchlight side, turret length ratios.
- T-72 Ural: shape and position of the rangefinder "ears", skirt segment lengths.
- BTR-60PB: axle spacing.
- Mi-24D and Mi-8 tail rotor side, Mi-24D hardpoint count.
- M47 vs M48: bow gunner blister, turret bustle, cupola.
- AH-1J and AB-205 tail rotor side.
- Chieftain skirt plate count and turret bustle shape.
- Any camouflage patterns beyond the base tokens: use photos of period vehicles, not memory.
