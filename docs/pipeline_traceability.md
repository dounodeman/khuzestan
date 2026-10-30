# Accuracy pipeline: requirement traceability

Each requirement from the accuracy-pipeline brief, where it is implemented, and its status.
Status: **done**, **partial** (what is missing is named) or **waiting** (blocked on input).

## Rules that apply everywhere

| Requirement | Where | Status |
|---|---|---|
| A number with no support gets a confidence tag | `check-sheets` fails on any number without `conf` and `src` (`tools/sheets-lib.ts`, `checkTags`) | done |
| Measure from references, draw it yourself, never trace line for line | Lab marks/calibration produce numbers; the generator draws from numbers only. Masks (used only for scoring) stay in `refs/` | done |
| Never put a reference image in the game or the repo | `refs/` is git-ignored; the dev-server endpoint writes only sidecar files there; `lab.html` is not a build input | done |
| Target the 1980 variants, list later upgrades as excluded | `excluded_details` and `detail_inventory` status `excluded`; validator fails if an excluded detail is drawn | done |
| One vehicle at a time, report each | `npm run vehicle-report -- <id>` writes `docs/vehicle_reports/<id>.md` | done |

## Step 1: intake and inventory

| Requirement | Where | Status |
|---|---|---|
| List what is in `refs/<id>/` and what is missing, for every vehicle | `npm run refs-inventory` (all 29 non-infantry vehicles) | done |
| Minimum views: top, side, rear/engine deck; wheeled also axle positions | `refs-inventory` and the validator's intake warning; towed guns and aircraft need top and side | done |
| File names say the view; ask when unclear | `refs-inventory` lists unclear names; the lab shows the view parsed from the name | done |
| Stop for a vehicle with a missing view | Reported per vehicle; the T-55 is stopped (no images reachable in the cloud session) | waiting |

## Step 2: calibration

| Requirement | Where | Status |
|---|---|---|
| Lab overlay with 2-point scale tool | Sprite Lab, Reference overlay panel | done |
| Record which dimension was used | Calibration prompt asks for the dimension; saved in `<image>.calib.json`; sheet `references[].calibrated_to`; validator fails if a lab-calibrated image has no `calibrated_to` in the sheet | done |
| Top view must match spec length and width within 3% | Validator: hull_len and width from geometry; cross-check: marked hull length on each image vs `hull_len` | done |
| Side view with the same length must agree with the top view (heights, turret position) | Lab side-view marks (hull_front, hull_rear, turret_pivot, muzzle, fittings, wheels, ground, turret_top) saved with metres in `<image>.points.json`; `check-sheets` cross-checks top vs side within 3% and height vs `dimensions.height` | done |
| Flag and ask when views disagree by more than 3% | Cross-check error text says "Ask which image to trust"; reported in the vehicle report | done |
| Perspective photos: ratios only, conf C | `references[].perspective`; validator fails any A/B value whose source names a perspective image, and warns on a perspective "top" | done |

## Step 3: structured sheet

| Requirement | Where | Status |
|---|---|---|
| `data/vehicle_sheets/<id>.json` with id, variant, units, axes, dimensions, outlines, parts, excluded_details, open_questions | `src/sheets/schema.ts`; outlines are objects (`frame`, `mirror`, `role`, `points`, `src`) with the requested `[x, y, {conf}]` points | done |
| Generate `docs/vehicle_sheets.md` from the JSON | `npm run sheets-doc`; `check-sheets` fails if it is stale | done |
| Confidence A/B/C/X as defined | Schema doc comment; validator enforces A needs a calibrated plan view | done |
| Every part has a source note naming the file and calibration dimension | `src` required on every part, outline and value | done (enforced) |
| Measure outlines, track/wheel positions with each gap, pivot, hatches, cupola, gun and fittings, searchlight, engine deck, stowage, exhausts | Schema fields; `detail_inventory` lists every top-surface detail with status so nothing is dropped silently | done (T-55 values waiting on references) |
| Helicopters: fuselage, mast, rotor radius, tail rotor position and side, wings, pylons | `rotor`, `rotor2`, `tail_rotor` (with `side`), outline roles `fuselage`/`boom`/`wing`/`fin`/`canopy`, part kinds `pylon`/`rocket_pod`/`atgm_rail`/`skid`; validator requires rotors on helicopters | done (no helicopter sheet yet) |

## Step 4: reconcile sources

| Requirement | Where | Status |
|---|---|---|
| Never average; prefer plan view > spec sheet > perspective photo | `alt` keeps every other value with its source; `reason` explains the choice | done |
| Detail disagreements go to open_questions and to the user | `open_questions`; repeated in the vehicle report and the thread | done |

## Step 5: validator (`npm run check-sheets`)

| Check | Status |
|---|---|
| Missing conf or src | done |
| Outline not closed, self-intersecting, not symmetric (with `asymmetric_reason` / `offset_reason` exceptions) | done |
| Parts outside their declared outline | done |
| hull_len or width more than 3% off | done (plus track centres, track width, road-wheel span vs track on ground, barrel length, rotor diameter, fuselage length) |
| excluded_details empty while a reference shows later mods (warn) | done |
| Output in the commit / PR message per vehicle | done |
| Self-test | `npm run check-sheets:selftest` breaks each sheet 20 ways and checks each is caught |

## Step 6: sprites read only the sheets

| Requirement | Where | Status |
|---|---|---|
| Generator takes `data/vehicle_sheets/*.json` and nothing else | `src/sheets/generate.ts`, `src/data/sprites/index.ts`; the hand-written T-55 sprite was deleted | done |
| No dimension or coordinate in rendering code | Geometry only in sheets; `src/sheets/style.ts` holds paint, shading, LOD and line weights | done |
| Debug markers for C and X data | Lab "Weak-data markers" toggle (`?weak=1`) | done |

## Step 7: automatic comparison

| Requirement | Where | Status |
|---|---|---|
| Overlay with opacity, difference mode, side-by-side | Lab Compare panel | done |
| IoU against an approved mask built from the reference, kept in `refs/` | Draw mask, Approve & save (`<image>.mask.png` + `.mask.json`) | done |
| Outline distance mean and max in cm | Euclidean distance transform on a 1 cm grid (`src/lab/compare.ts`) | done |
| Position error per hatch, cupola, searchlight, wheel, gun fitting | Mark each anchor on the image; errors per part id | done |
| Thresholds IoU 0.95, outline 8 cm, parts 10 cm for A/B | `THRESHOLDS`; failures list part ids | done |
| Game-scale renders next to the other vehicles on an equal-scale contact sheet | Contact sheet shows every vehicle (legacy game sprite where no sheet exists) at 14 px/m with game-zoom renders below | done |
| Never confusable at 64 px | Pairwise silhouette IoU at 64 px across all vehicles, flagged at 0.90; human review of the contact sheet still needed | done (heuristic) |
| Playwright screenshots, reviewed, written critique | `npm run vehicle-report` saves screenshots; critique lives in the sheet's `critique` | done for the draft T-55 |
| Compare maths verified | `npm run lab-selftest` (synthetic shifted silhouette and side-view marks) | done |

## Step 8: iterate and report

| Requirement | Where | Status |
|---|---|---|
| Loop render, compare, fix until thresholds pass | Tools in place | waiting (T-55 references) |
| Report: variant, changes with before/after, IoU and worst errors, every C/X item, open questions, exclusions, the reference that helps most | `docs/vehicle_reports/<id>.md` | done (T-55 draft report) |

## Order of work

| Step | Status |
|---|---|
| 1. Compare panel, schema, validator, tested on the T-55 | done |
| 2. T-55 benchmark, stop and report | waiting on reference images and the variant answer |
| 3. Other rosters | not started (blocked on T-55 approval) |
| 4. Regenerate docs from JSON; balance-table dimension columns from the sheets | docs regenerate now; balance-table columns once more sheets exist |
