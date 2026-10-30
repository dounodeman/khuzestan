#!/usr/bin/env bash
# Sets up the dev-only image-analysis environment in tools/vision/.venv (git-ignored, never shipped).
#   tools/vision/setup.sh            OpenCV, scikit-image, Shapely, pixelmatch, PyTorch, SAM 2.1 and SAM 3.1 code
#   tools/vision/setup.sh --weights  also download model weights into tools/vision/weights/ (git-ignored)
# SAM weights come from dl.fbaipublicfiles.com (SAM 2.1, open) and huggingface.co (SAM 3.1, gated: request access
# on https://huggingface.co/facebook/sam3.1 and run `tools/vision/.venv/bin/hf auth login` first).
set -euo pipefail
cd "$(dirname "$0")"
SAM2_REF=2b90b9f5ceec907a1c18123530e92e794ad901a4 # facebookresearch/sam2 main, checked 2026-10-30
SAM3_VERSION=0.1.4                                 # PyPI, 2026-05-26; code for SAM 3 and SAM 3.1 checkpoints
[ -x .venv/bin/python ] || python3 -m venv .venv
.venv/bin/pip install -q --upgrade pip
.venv/bin/pip install -q -r requirements.txt
# SAM 2.1: point/box-prompted masks, practical on CPU. Skip the optional CUDA extension.
SAM2_BUILD_CUDA=0 .venv/bin/pip install -q --no-build-isolation "git+https://github.com/facebookresearch/sam2.git@${SAM2_REF}"
# SAM 3.1 (current release): text-prompted concept segmentation, GPU-oriented; CPU runs are slow.
.venv/bin/pip install -q "sam3==${SAM3_VERSION}" "numpy<2.4"
if [ "${1:-}" = "--weights" ]; then
  mkdir -p weights
  base=https://dl.fbaipublicfiles.com/segment_anything_2/092824
  for f in sam2.1_hiera_tiny.pt sam2.1_hiera_base_plus.pt; do
    [ -f "weights/$f" ] || curl -fsSL --retry 3 -o "weights/$f.part" "$base/$f" && mv "weights/$f.part" "weights/$f" \
      || { rm -f "weights/$f.part"; echo "SAM 2.1 weights $f not downloaded (is dl.fbaipublicfiles.com allowed?)"; }
  done
  .venv/bin/hf download facebook/sam3.1 --local-dir weights/sam3.1 >/dev/null 2>&1 || echo "SAM 3.1 weights skipped (gated: request access and log in first)"
fi
.venv/bin/python check.py
