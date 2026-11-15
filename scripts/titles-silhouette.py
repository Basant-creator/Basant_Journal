"""
The title cards' silhouettes: black where a picture is dark, clear where it
is light, so each prints over its card's field with no filter and no blend
at run time (both repaint the picture whenever its card is shown, and cost
the cut a frame or two on a slower machine).

The curve is the one the cards first used in CSS: greyscale, contrast 7
about a middle grey, brightness 0.85; what was multiplied over the field
becomes the alpha of a black layer. A painting is softer than a
photograph, so it is softened a touch first and lone specks are cleared
after, or its brushwork prints as grit.

Each is baked wide enough to stay sharp full-screen on a high-density
display (a 1440px screen at 2x is 2880 device pixels). The full-size
painting is fetched from Wikimedia Commons into assets/titles-source/
(git-ignored) when it is not there.

    python scripts/titles-silhouette.py

Rerun if a picture is replaced.
"""

import urllib.request
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "app/lab/titlecards/art"
SOURCES = ROOT / "assets/titles-source"

# name, source file, where to fetch it if missing, width, middle grey,
# soften (px at the baked width), despeckle (median size, 0 = none)
JOBS = [
    # The opening: a photograph of a rider (Unsplash licence), at its full width.
    ("rider", ROOT / "app/lab/wanted/art/dust-rider.jpg", None, 2560, 0.5, 0, 0),
    # The last card: Frederic Remington, "The Fall of the Cowboy" (1895),
    # public domain; the Amon Carter Museum's scan, 4500 x 3124.
    (
        "gate",
        SOURCES / "fall-of-the-cowboy-4500.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/4/47/The_Fall_of_the_Cowboy%2C_1895%2C_by_Frederic_S._Remington.jpg",
        3200,
        0.45,
        1.0,
        5,
    ),
]


def fetch(path: Path, url: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(url, headers={"User-Agent": "titles-silhouette/1.0"})
    with urllib.request.urlopen(request) as response:
        path.write_bytes(response.read())
    print("fetched", path.relative_to(ROOT))


def bake(name: str, source: Path, url: str | None, width: int, middle: float, soften: float, despeckle: int) -> None:
    if not source.exists():
        if not url:
            raise FileNotFoundError(source)
        fetch(source, url)
    picture = Image.open(source).convert("L")
    if picture.width != width:
        picture = picture.resize((width, round(picture.height * width / picture.width)), Image.LANCZOS)
    if soften:
        picture = picture.filter(ImageFilter.GaussianBlur(soften))

    def curve(v: int) -> int:
        x = min(1.0, max(0.0, (v / 255 - middle) * 7 + 0.5)) * 0.85
        return round((1 - x) * 255)

    alpha = picture.point([curve(v) for v in range(256)])
    if despeckle:
        alpha = alpha.filter(ImageFilter.MedianFilter(despeckle))
    out = Image.new("RGBA", picture.size, (0, 0, 0, 0))
    out.putalpha(alpha)
    target = OUT / f"{name}.png"
    target.parent.mkdir(parents=True, exist_ok=True)
    out.save(target, optimize=True)
    print(target.relative_to(ROOT), out.size, f"{target.stat().st_size // 1024} KB")


if __name__ == "__main__":
    for job in JOBS:
        bake(*job)
