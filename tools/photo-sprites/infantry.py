"""Cut soldier figures out of photographs for the infantry sprites.

usage: infantry.py configs/infantry.json OUT_DIR

config: {"px_per_m": output pixels per metre,
         "figures": [{"name", "src", "rect": [x0, y0, x1, y1] around one man,
                      "kind": "stand" | "prone", "rotate": degrees clockwise so his head points right
                      (the game's forward), "len_m": his length in metres along that axis,
                      "factions": {"iran": "as_is" | "tone", "iraq": "as_is" | "tone"}}],
         "tones": {"iraq": [r, g, b], "iran": [r, g, b]}  uniform colour used when a figure is re-toned}

Each figure is separated from its background with GrabCut seeded by the rectangle, rotated so he
faces +x, scaled so his length matches `len_m`, and written as an RGBA PNG per faction. A JSON
sidecar per figure holds its size in metres and the anchor (body centre) for gen_infantry_ts.
"""
import sys, json, os, cv2, numpy as np

cfg = json.load(open(sys.argv[1])); out = sys.argv[2]
os.makedirs(out, exist_ok=True)
ppm = cfg['px_per_m']
tones = cfg.get('tones', {})


def cut(img, rect):
    x0, y0, x1, y1 = rect
    pad = 12
    X0, Y0 = max(0, x0 - pad), max(0, y0 - pad)
    X1, Y1 = min(img.shape[1], x1 + pad), min(img.shape[0], y1 + pad)
    crop = img[Y0:Y1, X0:X1].copy()
    mask = np.zeros(crop.shape[:2], np.uint8)
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(crop, mask, (x0 - X0, y0 - Y0, x1 - x0, y1 - y0), bgd, fgd, 8, cv2.GC_INIT_WITH_RECT)
    fg = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    # keep the largest blob (the man), close small holes, soften the edge
    n, lab, stats, _ = cv2.connectedComponentsWithStats(fg)
    if n > 1:
        big = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        fg = np.where(lab == big, 255, 0).astype(np.uint8)
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    fg = cv2.GaussianBlur(fg, (3, 3), 0.8)
    return np.dstack([crop, fg])


def rotate(rgba, deg):
    h, w = rgba.shape[:2]
    M = cv2.getRotationMatrix2D((w / 2, h / 2), -deg, 1.0)
    c, s = abs(M[0, 0]), abs(M[0, 1])
    nw, nh = int(h * s + w * c), int(h * c + w * s)
    M[0, 2] += nw / 2 - w / 2; M[1, 2] += nh / 2 - h / 2
    return cv2.warpAffine(rgba, M, (nw, nh), flags=cv2.INTER_CUBIC, borderValue=(0, 0, 0, 0))


def trim(rgba):
    ys, xs = np.where(rgba[..., 3] > 20)
    return rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def tone(rgba, rgb):
    """Re-colour the uniform: keep the photo's light and shade, move its hue towards `rgb`."""
    bgr = rgba[..., :3].astype(np.float32)
    lum = bgr.mean(axis=2, keepdims=True) / 255.0
    target = np.float32(rgb[::-1]) * (0.35 + 1.3 * lum)
    mixed = np.clip(bgr * 0.35 + target * 0.65, 0, 255).astype(np.uint8)
    return np.dstack([mixed, rgba[..., 3]])


for fig in cfg['figures']:
    img = cv2.imread(fig['src'])
    rgba = trim(rotate(cut(img, fig['rect']), fig.get('rotate', 90)))
    k = fig['len_m'] * ppm / rgba.shape[1]
    rgba = cv2.resize(rgba, None, fx=k, fy=k, interpolation=cv2.INTER_AREA)
    a = rgba[..., 3].astype(np.float32)
    ys, xs = np.nonzero(a > 20)
    anchor = [float(xs.mean()) / ppm, float(ys.mean()) / ppm]
    for faction, how in fig['factions'].items():
        im = tone(rgba, tones[faction]) if how == 'tone' else rgba
        f = f"{faction}_{fig['kind']}_{fig['name']}.png"
        cv2.imwrite(os.path.join(out, f), im)
        json.dump(dict(file=f, faction=faction, kind=fig['kind'], w=rgba.shape[1] / ppm, h=rgba.shape[0] / ppm,
                       anchor=anchor), open(os.path.join(out, f[:-4] + '.json'), 'w'))
        print(f, rgba.shape[1], rgba.shape[0])
