"""
Chalk line drawings for the WANTED prototype's pictures.

For each picture in app/lab/wanted/art, writes <name>.lines.jpg beside it:
white lines on black, the way the picture would be blocked in with chalk on
a slate before it is painted. The page sketches this in first, then erases
it to the colour (see app/lab/wanted/Reveal.tsx).

Made once, offline, and checked in, so the browser does no image work.

    python scripts/chalk-lines.py

Method: the pencil-sketch "colour dodge" (the grey image divided by a
blurred copy of its own negative), which keeps contours and a little
shading; inverted so the lines are light; levels pulled so the ground goes
to true black; then grain, so a line breaks up the way chalk does on a
rough board. Deterministic: the grain is seeded per file.
"""

from pathlib import Path
import zlib

import numpy as np
from PIL import Image, ImageFilter

ART = Path(__file__).resolve().parent.parent / "app" / "lab" / "wanted" / "art"
WIDTH = 1280
# The opening is shown far larger than a plate's share of its frame, so its
# drawing is made finer, or its lines come up as thick as a finger.
WIDE = {"dust-rider.jpg": 1800}


def lines(path: Path) -> Image.Image:
    im = Image.open(path).convert("L")
    width = WIDE.get(path.name, WIDTH)
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)

    grey = np.asarray(im, dtype=np.float32) / 255.0
    blur = np.asarray(Image.fromarray(255 - np.asarray(im)).filter(ImageFilter.GaussianBlur(5)), dtype=np.float32) / 255.0
    dodge = np.clip(grey / np.maximum(1.0 - blur, 1e-3), 0, 1)

    # Light lines on dark: what was pencil on paper is now chalk on slate.
    ink = 1.0 - dodge
    # Levels: the faint wash goes to black, the lines to near white.
    ink = np.clip((ink - 0.04) / 0.32, 0, 1) ** 0.8

    # A little of the strong edges, so silhouettes keep their outline even
    # where the dodge flattens them (a backlit rider is one dark shape).
    edges = np.asarray(im.filter(ImageFilter.GaussianBlur(1.2)).filter(ImageFilter.FIND_EDGES), dtype=np.float32) / 255.0
    edges = np.clip(edges * 2.4, 0, 1)
    ink = np.maximum(ink, edges * 0.8)

    # Chalk: lines break up, and the board has tooth. The tooth is coarser
    # than a pixel (a third of the resolution, smoothed), which is both
    # closer to chalk on a board and far kinder to the JPEG than pixel noise.
    rng = np.random.default_rng(zlib.crc32(path.name.encode()))
    h, w = ink.shape
    small = (rng.random((h // 3 + 1, w // 3 + 1)) * 255).astype(np.uint8)
    tooth = Image.fromarray(small, "L").resize((w, h), Image.BILINEAR).filter(ImageFilter.GaussianBlur(0.6))
    tooth = np.asarray(tooth, dtype=np.float32) / 255.0
    ink = ink * (0.5 + 0.5 * tooth)
    # Faint texture (a busy ground) is let go; the drawn lines stay.
    ink = np.clip((ink - 0.08) / 0.92, 0, 1) ** 1.1
    ink = np.clip(ink * 1.25, 0, 1)

    return Image.fromarray((ink * 255).astype(np.uint8), "L")


def main() -> None:
    for path in sorted(ART.glob("*.jpg")):
        if path.name.endswith(".lines.jpg"):
            continue
        out = path.with_name(path.stem + ".lines.jpg")
        lines(path).save(out, "JPEG", quality=64, optimize=True, progressive=True)
        print(f"{out.name}  {out.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
