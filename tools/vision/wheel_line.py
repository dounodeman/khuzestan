"""Positions along a vehicle's side from a perspective photo, using the road wheels as the ruler.

All road wheels have the same diameter, so the image widths of the wheels along the wheel line fix the line's
vanishing point and scale (1D projective fit). Positions come out in wheel diameters, then in metres from a
known span. Perspective input, so every result is conf C (ratios only).

Input JSON (kept next to the photo in refs/<id>/, git-ignored):
  {"image": "07_....jpg",
   "rims": [[u_left, u_right], ...],      # image x of each wheel's left and right rim edge, front wheel first
   "points": {"tank_rear": u, ...},        # other features on (or straight above) the wheel line, image x
   "scale": {"span_m": 3.84, "from": 0, "to": 4}}  # metres between two wheel centres (indices)
Run: tools/vision/.venv/bin/python tools/vision/wheel_line.py refs/iq_t55/07_....wheel-line.json
"""
import json
import sys

import numpy as np
from scipy.optimize import least_squares


def fit(rims):
    """Vanishing point v and constant K with (v - uR)(v - uL) = K (uR - uL) for every wheel."""
    span = max(r for _, r in rims) - min(l for l, _ in rims)
    far = min(rims, key=lambda w: w[1] - w[0])  # the smallest wheel is the farthest, so v lies beyond it
    side = -1 if far[0] < np.mean([l for l, _ in rims]) else 1
    best = None
    for start in (2, 5, 10, 30):
        v0 = (far[0] if side < 0 else far[1]) + side * span * start
        s = least_squares(lambda p: [((p[0] - r) * (p[0] - l)) / (p[1] * (r - l)) - 1 for l, r in rims], [v0, span * start * 5])
        if best is None or s.cost < best.cost:
            best = s
    return best.x, best.fun


def main(path):
    cfg = json.load(open(path))
    rims = cfg["rims"]
    (v, k), resid = fit(rims)
    u0 = sum(rims[0]) / 2
    xd = lambda u: k * (u - u0) / ((v - u) * (v - u0))  # position in wheel diameters, front wheel near 0
    centres = [(xd(l) + xd(r)) / 2 for l, r in rims]
    sc = cfg.get("scale")
    d = sc["span_m"] / abs(centres[sc["to"]] - centres[sc["from"]]) if sc else None
    out = {
        "image": cfg.get("image"),
        "vanishing_x": round(v, 1),
        "width_residuals": [round(x, 3) for x in resid],
        "wheel_dia_m": round(d, 3) if d else None,
        "wheel_centres_D": [round(c, 3) for c in centres],
        "gaps_D": [round(abs(b - a), 3) for a, b in zip(centres, centres[1:])],
        "gaps_m": [round(abs(b - a) * d, 3) for a, b in zip(centres, centres[1:])] if d else None,
        "points_D_from_wheel1": {n: round(xd(u) - centres[0], 3) for n, u in cfg.get("points", {}).items()},
    }
    print(json.dumps(out, indent=1))


if __name__ == "__main__":
    main(sys.argv[1])
