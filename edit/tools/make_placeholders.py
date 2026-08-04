"""
Writes stand-in frames for every photo slot so the edit always renders end to
end, even before real photography is dropped in.

Replace any file in edit/public/media/ with your own image using the SAME
filename and the timeline picks it up with no code changes. Portrait images at
1080x1920 or larger are ideal; anything else is centre-cropped to fill.

    python3 edit/tools/make_placeholders.py
"""

import os

from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1920
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "media")

SLOTS = [
    ("shot-01", "HERO / WIDE", "front 3-4 view, whole car in frame"),
    ("shot-02", "FRONT", "head on, low angle"),
    ("shot-03", "SIDE", "full profile, parallel to the car"),
    ("shot-04", "WHEEL", "close on one wheel + arch"),
    ("shot-05", "HEADLIGHT", "tight on the lamp"),
    ("shot-06", "REAR 3-4", "rear quarter, taillights lit"),
    ("shot-07", "DETAIL", "badge, grille or mirror"),
    ("shot-08", "ROLLING", "car moving, or panned"),
    ("shot-09", "INTERIOR", "wheel, dash or seats"),
    ("shot-10", "EXHAUST", "rear diffuser / tips"),
]


def font(size):
    for path in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ):
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def centered(draw, y, text, f, fill):
    box = draw.textbbox((0, 0), text, font=f)
    draw.text(((W - (box[2] - box[0])) / 2, y), text, font=f, fill=fill)


os.makedirs(OUT, exist_ok=True)

for i, (name, title, hint) in enumerate(SLOTS):
    img = Image.new("RGB", (W, H))
    px = img.load()
    # vertical grey ramp, varied per slot so cuts are obvious while placeholding
    top = 26 + (i % 5) * 9
    bottom = 78 + (i % 3) * 16
    for y in range(H):
        v = int(top + (bottom - top) * (y / H))
        for x in range(W):
            px[x, y] = (v, v + 2, v + 6)

    d = ImageDraw.Draw(img)
    # diagonal hatch so pans and zooms are readable at a glance
    for k in range(-H, W + H, 90):
        d.line([(k, 0), (k + H, H)], fill=(255, 255, 255, 8), width=1)
    # framing grid
    for f3 in (1, 2):
        d.line([(W * f3 / 3, 0), (W * f3 / 3, H)], fill=(110, 118, 128), width=2)
        d.line([(0, H * f3 / 3), (W, H * f3 / 3)], fill=(110, 118, 128), width=2)
    d.rectangle([40, 40, W - 40, H - 40], outline=(150, 158, 168), width=4)

    centered(d, H / 2 - 380, f"{i + 1:02d}", font(300), (232, 238, 244))
    centered(d, H / 2 - 20, title, font(96), (232, 238, 244))
    centered(d, H / 2 + 110, hint, font(44), (150, 160, 172))
    centered(d, H / 2 + 260, f"replace → {name}.jpg", font(40), (95, 168, 255))

    img.save(os.path.join(OUT, f"{name}.jpg"), quality=88)
    print("wrote", f"{name}.jpg")
