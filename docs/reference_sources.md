# Top-view reference sources for the vehicle sprites

Compiled 2026-10-29. Put this at `docs/reference_sources.md`. Reference images go in `refs/<vehicle_id>/` (git-ignored, never shipped in the game).

## What I could and could not confirm
- Free, accurate, true top-down (plan view) images are scarce. Most free drawings online are side profiles.
- The Blueprints pages I opened show a side-profile preview only (T-72 Ural preview is 1135 x 275 px, T-55 preview is 334 x 204 px). I could not confirm any of them contain a plan view without buying or logging in.
- Wikimedia Commons pages would not open in my fetch tool, so for Commons files I only have titles from search results. I did not see their licenses, resolutions or camera angles. Check each file page yourself.
- I did not download anything, and my sandbox cannot reach these sites directly.
- Image-search results (titles only, I could not open them) included promising leads: "T-55 Model 1958 Tank 4-View Drawings", "M60A1 Patton blueprints free - Outlines", "M113 Armored Personnel Carrier Blueprint", "T-62 tank blueprint". Four-view drawings normally include a top view. Licenses unknown.

## Rules of use (not legal advice)
- Keep reference images in `refs/` only. Never embed them in the game or the repo.
- Use them to measure proportions and positions (hull length vs width, turret pivot, wheel spacing, hatch positions). Do not trace outlines line for line into the shipped sprites.
- The-Blueprints terms: purchased products may not be resold or republished, and third-party rights still apply. The site describes its purpose as reference material for modelers.

## Source types

### 1. The-Blueprints.com (side profiles, vector versions are paid)
Per-vehicle pages found by search (view contents not confirmed):

| Vehicle | Page |
|---|---|
| T-55 | https://the-blueprints.com/blueprints/tanks/tanks-t/48621/view/t-55 |
| T-62 | https://www.the-blueprints.com/blueprints/tanks/tanks-t/67199/view/t-62/ |
| T-72 Ural | https://www.the-blueprints.com/blueprints/tanks/tanks-t/67204/view/t-72_ural/ |
| PT-76 | https://www.the-blueprints.com/blueprints/tanks/tanks-n-p/39731/view/pt-76/ |
| BTR-50 | https://www.the-blueprints.com/blueprints/tanks/tanks-b/38641/view/btr-50/ |
| BMP-1 | https://www.the-blueprints.com/blueprints/tanks/tanks-b/3945/view/bmp-1/ |
| BTR-60 | https://www.the-blueprints.com/blueprints/tanks/tanks-b/4397/view/btr-60/ |
| ZSU-23-4 | https://www.the-blueprints.com/blueprints/tanks/tanks-u-z/15951/view/zsu-23x4_shilka_gundish/ |
| Chieftain | https://www.the-blueprints.com/blueprints/tanks/tanks-c/2970/view/chieftain/ |
| M60A1 | https://www.the-blueprints.com/blueprints/tanks/tanks-m/38706/view/m60a1_patton |
| M48 | https://www.the-blueprints.com/blueprints/tanks/tanks-m/4419/view/m48_patton/ |
| FV101 Scorpion | https://www.the-blueprints.com/blueprints/tanks/tanks-f/23734/view/fv101_scorpion_combat_vehicle_reconnaissance/ |
| M113 | https://www.the-blueprints.com/blueprints/tanks/tanks-m/64253/view/m113_apc/ |
| Mi-24D | https://www.the-blueprints.com/blueprints/helicopters/mil/26536/view/mil_mi-24_hind_d/ |
| Mi-8 | https://www.the-blueprints.com/blueprints/helicopters/mil/5547/view/mil_mi-8_hip/ |
| AH-1J | https://www.the-blueprints.com/blueprints/helicopters/bell/74281/view/bell_ah-1j_seacobra/ |
| CH-47 | https://www.the-blueprints.com/blueprints/helicopters/boeing/1771/view/boeing_ch-47_chinook/ |

Not found in my searches: SA-342 Gazelle, AB-205/Bell 214, M151 jeep, ZU-23, the towed 35mm AA gun, BTR-50PK roof variants. Search those by hand.
Terms: https://www.the-blueprints.com/information/termsofuse/

### 2. Wikimedia Commons (titles only, licenses unchecked)
Commonly CC or public domain, but each file page states its own license. Candidates from search:
- File:Iraqi T-55 tank at Camp Taji.jpg
- File:T-55 barrel external fuel tanks.jpg (useful for the fender tanks)
- File:T-55 MBT Bagram Air Base.jpg
- File:Egpytian T-55 tank during Bright Star '85.JPEG
- File:Chieftain tank during Iran-Iraq War.jpg (period and theater match)
- File:Chieftain tank, turret and mantlet.jpg
- Category:Chieftain in the Kubinka Tank Museum
Base URL pattern: https://commons.wikimedia.org/wiki/File:<name with underscores>

### 3. Walkaround and model-review pages (copyright, private reference only)
Best for roof details, hatch shapes, stowage. Found by search:
- IPMS/USA: T-55 Mod. 1963 interior kit review, part 2 - https://reviews.ipmsusa.org/review/t-55-mod-1963-interior-kit-part-2
- IPMS/USA: Wings and Wheels T-55 book review - https://ipmsusa.org/reviews/Books/Armor/wings-wheels/wings-wheels_t55.htm
- Italeri T-55A review - https://www.keymodelworld.com/article/italeri-new-tool-172-t-55a-tank-review
- On the Way Models: Ace T-55 review - https://onthewaymodels.com/reviews/ACE/T-55 review.htm
- Armorama forum threads: https://archive.armorama.com/forums/118346/index.htm
- Tank & AFV News walkarounds: https://tankandafvnews.com/tag/t-55am/
Model-kit reviews often show the built model from directly above, which is the closest thing to a true plan view you can get for free.

### 4. Books with scale plan drawings (buy)
- Wings and Wheels Publications: T-55 (reviewed by IPMS/USA, link above)
- "Soviet Main Battle Tanks T-54/T-55: Variants and Conversion in Mirror 1/35 Scale" (Salekhard). Listing: https://www.railwaymates.com/books/soviet-main-battle-tanks-t-54-t-55-variantsandconversion-in-mirror-1-35-scale-fromsalekhard--114230

### 5. 3D models (measurement only)
- T-55A on Sketchfab, license CC BY-NC-ND 4.0 (no commercial use, no derivatives). 18.8k triangles. Fine for rendering a private orthographic top view to measure from. Do not ship it or redistribute adaptations. https://sketchfab.com/3d-models/tank-t-55a-b3b39c71e9fa40348b9e7ea3e624ddb1

### 6. US government manuals
US federal publications are generally public domain. I did not find a verified manual with plan views. The one I opened (DTIC ADA174006) is an M60A3 procedure guide, not a plan-view source. Worth searching DTIC, archive.org and FDLP for the M60A1, M113, M48, AH-1 and CH-47 operator manuals; their stowage diagrams and photos are free to use.

## What to look for per vehicle
Check these against any reference you find (they come from `docs/vehicle_sheets.md`):
- T-55: wider gap between road wheels 1 and 2, searchlight side, driver hatch left of centre, turret length.
- T-62: turret length and width, fume extractor position, ejection port.
- T-72 Ural: rangefinder "ears", rubber front skirts, six road wheels.
- BTR-60: axle spacing, turret position.
- Chieftain: turret length, rear bin, skirt plates.
- M48/M60: cupola side, turret shape, engine deck.
- Helicopters: tail rotor side, hardpoint layout, rotor blade count.

## Prompt addition for Claude Code (paste into the redesign prompt)
```
Reference images: I will drop reference images into refs/<vehicle_id>/ (git-ignored). Before drawing a vehicle, check that folder. If it has images, use the Sprite Lab overlay and the 2-point scale tool to measure proportions and positions from them, then draw the sprite yourself from those measurements. Do not trace outlines line for line. If the folder is empty, tell me which view you need (top plan view, side profile, rear deck photo) and stop for that vehicle instead of guessing. Write what you measured to docs/vehicle_research/<vehicle_id>.md.
```
