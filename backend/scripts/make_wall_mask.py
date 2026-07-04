"""One-time generator for the /colours wall-preview assets.

From the user-provided bedroom photo (assets/room/bedroom-original.webp) this
produces, in frontend/public/room/:

  bedroom-base.jpg       — the photo with the WALL neutralized to a light gray
                           (shading preserved) so a solid colour layered with
                           mix-blend-mode:multiply renders that colour true.
  bedroom-wall-mask.png  — alpha mask (opaque = wall) with a feathered edge,
                           used as the CSS mask for the colour layer.

Segmentation: BFS flood fill from wall seed points on a blurred copy —
a neighbour joins when the local colour step is small (stops at object edges)
AND its chromaticity stays near-neutral (the sage curtains/duvet/chair are
measurably greener than the grey wall: g'-r' >= ~0.02 vs <= ~0.01).
Geometric guards drop the window/curtain strip and the floor. Debug composites
are written to /tmp so the mask can be eyeballed between threshold tweaks.

Run: backend/venv/bin/python backend/scripts/make_wall_mask.py
"""

from __future__ import annotations

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

REPO = Path(__file__).resolve().parents[2]
SRC = REPO / "assets" / "room" / "bedroom-original.webp"
OUT_DIR = REPO / "frontend" / "public" / "room"
DEBUG_DIR = Path("/tmp/wallmask-debug")

# ---- Tunables ----
LOCAL_STEP = 9.0        # max per-move colour distance (blurred image)
CHROMA_MAX = 0.0135     # |g' - r'| upper bound for wall (curtains ≈ 0.02+)
WARM_MIN = -0.030       # allow the warm lamp-glow zone (g'-r' negative)
X_MIN = 242             # left of this = window + curtains
Y_FLOOR = 762           # below this = floor
LUMA_MAX = 229.0        # brighter = lampshade / pillows / window light
TARGET_GRAY = 215.0     # median wall luminance in the neutralized base
SHADE_GAMMA = 0.55      # <1 compresses shadows so corners don't go murky

SEEDS = [
    (640, 100), (1150, 80), (300, 300), (640, 350), (950, 400),
    (430, 460), (620, 470), (1260, 300), (900, 200), (450, 150),
    (1050, 450), (280, 120), (760, 430),
    # Shadowed wall column between curtain and lamp pole — colour-allowed but
    # unreachable through the shade's dark edge, so seed it directly.
    (260, 470), (270, 550), (285, 650),
]

# Furniture/props the chroma test can't separate from the wall (neutral tones,
# soft edges): hard-excluded by geometry, hugging each object so the wall around
# them still tints. The black desk lamp and sage chair need no boxes — luma/chroma
# already reject them. (x0, y0, x1, y1) in source pixels.
EXCLUDE_BOXES = [
    # Floor-lamp shade: three stacked boxes tracking its trapezoid silhouette.
    (283, 312, 368, 366),
    (270, 366, 380, 400),
    (257, 398, 392, 430),
    (302, 428, 336, 774),     # floor-lamp pole
    (362, 502, 898, 700),     # headboard + pillows
    # Duvet drape: stepped boxes following its left edge so the shadowed wall
    # between curtain and bed still tints. (Floor guard cuts below y=762.)
    (355, 628, 998, 705),
    (315, 695, 998, 762),
    (280, 740, 998, 960),
    (258, 790, 998, 960),
    (903, 458, 992, 538),     # orchid flowers (warm-toned like the glow wall)
    (910, 532, 975, 595),     # vase on desk
    (953, 526, 1048, 595),    # books on desk
    (1118, 558, 1172, 595),   # mug on desk
    (888, 583, 1280, 775),    # desk slab + trestle legs + under-desk zone
]


def flood_wall(blurred: np.ndarray) -> np.ndarray:
    h, w, _ = blurred.shape
    f = blurred.astype(np.float32)
    total = f.sum(axis=2) + 1e-6
    chroma = (f[:, :, 1] - f[:, :, 0]) / total          # g' - r'
    luma = f @ np.array([0.299, 0.587, 0.114], np.float32)

    allowed = (
        (chroma <= CHROMA_MAX) & (chroma >= WARM_MIN)
        & (luma <= LUMA_MAX)
    )
    allowed[:, :X_MIN] = False
    allowed[Y_FLOOR:, :] = False
    for x0, y0, x1, y1 in EXCLUDE_BOXES:
        allowed[y0:y1, x0:x1] = False

    mask = np.zeros((h, w), bool)
    q: deque[tuple[int, int]] = deque()
    for x, y in SEEDS:
        if allowed[y, x] and not mask[y, x]:
            mask[y, x] = True
            q.append((y, x))

    while q:
        y, x = q.popleft()
        base = f[y, x]
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not mask[ny, nx] and allowed[ny, nx]:
                if np.abs(f[ny, nx] - base).max() <= LOCAL_STEP:
                    mask[ny, nx] = True
                    q.append((ny, nx))
    return mask


def fill_holes(mask: np.ndarray) -> np.ndarray:
    """Fill enclosed holes: anything not reachable from the frame border through
    non-mask pixels is inside the wall — fill it (chroma-noise specks, faint
    texture dots), except pixels inside the furniture EXCLUDE_BOXES."""
    h, w = mask.shape
    outside = np.zeros_like(mask)
    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        for y in (0, h - 1):
            if not mask[y, x] and not outside[y, x]:
                outside[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if not mask[y, x] and not outside[y, x]:
                outside[y, x] = True
                q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not mask[ny, nx] and not outside[ny, nx]:
                outside[ny, nx] = True
                q.append((ny, nx))
    holes = ~mask & ~outside
    for x0, y0, x1, y1 in EXCLUDE_BOXES:  # never fill into furniture
        holes[y0:y1, x0:x1] = False
    return mask | holes


def clean(mask: np.ndarray) -> np.ndarray:
    """Morphological close-then-open via PIL filters, drop specks, keep the wall."""
    m = Image.fromarray((mask * 255).astype(np.uint8))
    m = m.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))   # close holes
    m = m.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))   # open specks
    return fill_holes(np.asarray(m) > 127)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    DEBUG_DIR.mkdir(parents=True, exist_ok=True)

    orig = Image.open(SRC).convert("RGB")
    rgb = np.asarray(orig).astype(np.float32)
    blurred = np.asarray(orig.filter(ImageFilter.GaussianBlur(2))).astype(np.float32)

    mask = clean(flood_wall(blurred))
    coverage = mask.mean()
    print(f"wall coverage: {coverage:.1%} of frame")

    # Feathered alpha mask.
    alpha = Image.fromarray((mask * 255).astype(np.uint8)).filter(
        ImageFilter.GaussianBlur(1.3)
    )
    alpha_np = np.asarray(alpha).astype(np.float32) / 255.0

    # Neutralized base: wall pixels -> light gray, shading preserved + softened.
    luma = rgb @ np.array([0.299, 0.587, 0.114], np.float32)
    wall_luma = luma[mask]
    med = float(np.median(wall_luma))
    norm = np.clip(luma / med, 0.05, 2.0)
    gray = np.clip(TARGET_GRAY * (norm ** SHADE_GAMMA), 0, 255)
    base = rgb * (1 - alpha_np[..., None]) + gray[..., None] * alpha_np[..., None]
    base_img = Image.fromarray(base.astype(np.uint8))
    base_img.save(OUT_DIR / "bedroom-base.jpg", quality=88)

    # Mask PNG: white with alpha channel (CSS mask uses alpha).
    mask_img = Image.merge(
        "RGBA",
        [Image.new("L", orig.size, 255)] * 3 + [alpha],
    )
    mask_img.save(OUT_DIR / "bedroom-wall-mask.png", optimize=True)
    print(f"median wall luma {med:.0f} -> target {TARGET_GRAY:.0f}")
    print(f"wrote {OUT_DIR / 'bedroom-base.jpg'} and bedroom-wall-mask.png")

    # ---- Debug composites ----
    # 1. Mask outline over the original (red tint on wall).
    overlay = rgb.copy()
    overlay[..., 0] = np.clip(overlay[..., 0] + alpha_np * 90, 0, 255)
    overlay[..., 1] = overlay[..., 1] * (1 - alpha_np * 0.35)
    overlay[..., 2] = overlay[..., 2] * (1 - alpha_np * 0.35)
    Image.fromarray(overlay.astype(np.uint8)).save(DEBUG_DIR / "mask-overlay.jpg", quality=85)

    # 2. Simulated previews (what the browser's multiply produces).
    for name, hexv in (("red", "#B8322A"), ("midnight", "#1A1A2E"), ("offwhite", "#F5F0E8")):
        c = np.array([int(hexv[i:i + 2], 16) for i in (1, 3, 5)], np.float32)
        tint = base * (c / 255.0)  # multiply blend
        out = base * (1 - alpha_np[..., None]) + tint * alpha_np[..., None]
        Image.fromarray(out.astype(np.uint8)).save(DEBUG_DIR / f"sim-{name}.jpg", quality=85)
    print(f"debug composites in {DEBUG_DIR}")


if __name__ == "__main__":
    main()
