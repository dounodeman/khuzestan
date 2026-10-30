"""Smoke test for the dev-only image-analysis tools (tools/vision). Uses synthetic images only, never refs/.

Run: tools/vision/.venv/bin/python tools/vision/check.py
Each check prints PASS/FAIL with what it measured; exit code 1 if any check fails.
"""
import importlib.metadata as md
import sys
from pathlib import Path

import numpy as np

WEIGHTS = Path(__file__).resolve().parent / "weights"
results: list[tuple[str, bool, str]] = []


def check(name, fn):
    try:
        ok, detail = fn()
    except Exception as e:  # report and carry on so one broken tool does not hide the others
        ok, detail = False, f"{type(e).__name__}: {e}"
    results.append((name, ok, detail))


def synthetic_top_view():
    """A 600x400 'vehicle' plan view: light ground, dark 6.0 x 3.2 m hull at 50 px/m, two wheels."""
    img = np.full((400, 600, 3), 200, np.uint8)
    img[40:200, 150:450] = 60  # 300 x 160 px = 6.0 x 3.2 m at 50 px/m
    return img


def opencv():
    import cv2

    img = synthetic_top_view()
    # Perspective: warp the image as a tilted camera would, then rectify from the four hull corners.
    src = np.float32([[150, 40], [450, 40], [450, 200], [150, 200]])
    tilted = np.float32([[170, 60], [430, 45], [460, 210], [140, 190]])
    warped = cv2.warpPerspective(img, cv2.getPerspectiveTransform(src, tilted), (600, 400), borderValue=(200, 200, 200))
    rect = cv2.warpPerspective(warped, cv2.getPerspectiveTransform(tilted, src), (600, 400), borderValue=(200, 200, 200))
    gray = cv2.cvtColor(rect, cv2.COLOR_BGR2GRAY)
    _, bw = cv2.threshold(gray, 128, 255, cv2.THRESH_BINARY_INV)
    cnts, _ = cv2.findContours(bw, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    x, y, w, h = cv2.boundingRect(max(cnts, key=cv2.contourArea))
    lm, wm = w / 50, h / 50
    # Hough circles on a drawn road wheel (radius 0.4 m = 20 px).
    wheel = np.full((200, 200), 200, np.uint8)
    cv2.circle(wheel, (100, 100), 20, 40, 3)
    circles = cv2.HoughCircles(cv2.GaussianBlur(wheel, (5, 5), 1), cv2.HOUGH_GRADIENT, 1, 20, param1=80, param2=15, minRadius=10, maxRadius=40)
    r = float(circles[0][0][2]) if circles is not None else float("nan")
    ok = abs(lm - 6.0) < 0.06 and abs(wm - 3.2) < 0.06 and abs(r - 20) < 3
    return ok, f"cv2 {cv2.__version__}: rectified hull {lm:.2f} x {wm:.2f} m (6.00 x 3.20), wheel radius {r:.1f} px (20)"


def skimage_():
    import skimage
    from skimage import draw, feature, measure, transform

    img = synthetic_top_view()[..., 0] < 128
    contour = max(measure.find_contours(img.astype(float), 0.5), key=len)
    h = (contour[:, 0].max() - contour[:, 0].min()) / 50
    w = (contour[:, 1].max() - contour[:, 1].min()) / 50
    edges = np.zeros((200, 200), bool)
    rr, cc = draw.circle_perimeter(100, 100, 20)
    edges[rr, cc] = True
    radii = np.arange(15, 26)
    acc = transform.hough_circle(edges, radii)
    _, cx, cy, rad = transform.hough_circle_peaks(acc, radii, total_num_peaks=1)
    _ = feature.canny(img.astype(float))
    ok = abs(w - 6.0) < 0.06 and abs(h - 3.2) < 0.06 and cx[0] == 100 and cy[0] == 100 and rad[0] == 20
    return ok, f"scikit-image {skimage.__version__}: contour {w:.2f} x {h:.2f} m, circle ({cx[0]}, {cy[0]}) r {rad[0]} px"


def shapely_():
    import shapely
    from shapely.geometry import Polygon

    a = Polygon([(-3, -1.6), (3, -1.6), (3, 1.6), (-3, 1.6)])
    b = shapely.affinity.translate(a, 0.05, 0)  # 5 cm shift
    iou = a.intersection(b).area / a.union(b).area
    cm = a.exterior.hausdorff_distance(b.exterior) * 100
    ok = abs(iou - (5.95 / 6.05)) < 1e-6 and abs(cm - 5) < 1e-6
    return ok, f"shapely {shapely.__version__}: 5 cm shift gives IoU {iou:.4f}, outline distance {cm:.1f} cm"


def pixel_diff():
    from pixelmatch.contrib.PIL import pixelmatch
    from PIL import Image

    a = Image.fromarray(synthetic_top_view())
    arr = synthetic_top_view()
    arr[100:110, 200:210] = 255
    b = Image.fromarray(arr)
    n = pixelmatch(a, b, Image.new("RGBA", a.size), threshold=0.1)
    return n == 100, f"pixelmatch {md.version('pixelmatch')}: {n} differing pixels (100)"


def torch_():
    import torch

    dev = "cuda" if torch.cuda.is_available() else "cpu"
    x = torch.ones(2, 2, device=dev) @ torch.ones(2, 2, device=dev)
    return float(x.sum()) == 8.0, f"torch {torch.__version__} on {dev}"


def sam2_():
    import torch
    from sam2.build_sam import build_sam2
    from sam2.sam2_image_predictor import SAM2ImagePredictor

    ckpt = WEIGHTS / "sam2.1_hiera_tiny.pt"
    have = ckpt.exists()
    model = build_sam2("configs/sam2.1/sam2.1_hiera_t.yaml", str(ckpt) if have else None, device="cpu")
    pred = SAM2ImagePredictor(model)
    img = synthetic_top_view()
    with torch.inference_mode():
        pred.set_image(img)
        masks, scores, _ = pred.predict(box=np.array([140, 30, 460, 210]), multimask_output=False)
    m = masks[0] > 0
    truth = synthetic_top_view()[..., 0] < 128
    iou = (m & truth).sum() / max((m | truth).sum(), 1)
    ver = md.version("SAM-2") if any(d.metadata["Name"] == "SAM-2" for d in md.distributions()) else "git"
    if not have:
        return True, f"SAM 2.1 {ver}: CPU pipeline runs with random weights (mask meaningless); weights missing in {ckpt.parent}"
    return iou > 0.9, f"SAM 2.1 {ver} tiny on CPU: box-prompted mask IoU {iou:.3f} against the synthetic hull"


def sam3_():
    import torch
    from sam3.model_builder import build_sam3_image_model  # noqa: F401

    have = (WEIGHTS / "sam3.1").exists()
    gpu = "GPU found" if torch.cuda.is_available() else "no GPU: the official SAM 3 code needs CUDA, use SAM 2.1 on CPU"
    return True, f"sam3 {md.version('sam3')} imports (SAM 3 / 3.1 code); {gpu}; weights {'present' if have else 'missing (gated on Hugging Face)'}"


for name, fn in [("OpenCV", opencv), ("scikit-image", skimage_), ("Shapely", shapely_), ("pixel diff", pixel_diff),
                 ("PyTorch", torch_), ("SAM 2.1", sam2_), ("SAM 3.1", sam3_)]:
    check(name, fn)
for name, ok, detail in results:
    print(f"{'PASS' if ok else 'FAIL'}  {name:13s} {detail}")
sys.exit(0 if all(ok for _, ok, _ in results) else 1)
