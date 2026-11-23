"""Straighten flat roofs in an oblique aerial photo into square building tiles.

usage: buildings.py configs/roofs.json OUT_DIR

config: {"src": photo path, "size": output px, "margin": fraction of the roof added on every side,
         "roofs": {"name": [[x,y] back-left, back-right, front-right, front-left], ...}}
Corner order follows the roof outline clockwise starting from the corner furthest from the camera
on the left. Each roof is mapped to a square, so the game tile is filled by one house.
"""
import sys, json, os, cv2, numpy as np

cfg = json.load(open(sys.argv[1])); out = sys.argv[2]
os.makedirs(out, exist_ok=True)
im = cv2.imread(cfg['src'])
S, m = cfg['size'], cfg.get('margin', 0.06)
unit = np.float32([[0, 0], [1, 0], [1, 1], [0, 1]])
names = []
for name, quad in cfg['roofs'].items():
    q = np.float32(quad)
    H = cv2.getPerspectiveTransform(unit, q)  # unit square -> photo
    grown = cv2.perspectiveTransform(np.float32([[[-m, -m], [1 + m, -m], [1 + m, 1 + m], [-m, 1 + m]]]), H)[0]
    T = cv2.getPerspectiveTransform(grown, np.float32([[0, 0], [S, 0], [S, S], [0, S]]))
    tile = cv2.warpPerspective(im, T, (S, S), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    f = f'roof_{name}.jpg'
    cv2.imwrite(os.path.join(out, f), tile, [cv2.IMWRITE_JPEG_QUALITY, 90])
    names.append(f)
json.dump(names, open(os.path.join(out, 'roofs.json'), 'w'))
print(names)
