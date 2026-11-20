# Photo sprites

Turns a top-down photograph of a real vehicle into the two layers the game draws for it:
a hull (turret area filled in) and a turret with its gun, which rotates about its ring centre.

Requires Python 3 with `opencv-python-headless`, `numpy` and `Pillow`.

1. Download the source photo listed in `src/assets/tanks/CREDITS.md` into `tools/photo-sprites/photos/`
   (git-ignored; only the processed sprites are committed).
2. Find the four hull corners in the photo (`grid.py` draws a labelled pixel grid over a crop):
   rear-left, front-left, front-right, rear-right. Put them in the config as `quad`.
3. `warp.py` rectifies the photo to the hull's real length × width (`L`, `W` in metres, the same
   numbers as the unit's `sprite.length` / `sprite.width`) so the plan view is undistorted.
4. Outline the hull, the turret pieces and the gun on the rectified image (`hull`, `turret`
   polygons; `zoom` says which crop/scale the polygon coordinates were read from) and mark the
   turret ring centre as `pivot`.
5. Build and regenerate the data module:

```bash
python3 tools/photo-sprites/build.py tools/photo-sprites/configs/iq_t72.json iq_t72 /tmp/ps
cp /tmp/ps/iq_t72_hull.png /tmp/ps/iq_t72_turret.png src/assets/tanks/
python3 tools/photo-sprites/gen_ts.py /tmp/ps src/data/photoSprites.ts   # /tmp/ps must hold every vehicle's .json
python3 tools/photo-sprites/preview.py /tmp/ps iq_t72                     # hull + turret at 0° and 35°
```

The game picks up any unit id present in `src/data/photoSprites.ts`; units without an entry keep
the procedural vector sprite. Record the photo's source, author and licence in
`src/assets/tanks/CREDITS.md` for every sprite you add.
