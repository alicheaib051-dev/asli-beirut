"""
Rebuilds src/font-css.ts by inlining every woff2 in public/fonts as a data URI.

Run this after adding or swapping a typeface:

    python3 edit/tools/embed_fonts.py
"""

import base64
import os

HERE = os.path.dirname(__file__)
FONT_DIR = os.path.join(HERE, "..", "public", "fonts")
OUT = os.path.join(HERE, "..", "src", "font-css.ts")

FACES = [
    ("AntonEdit", "anton.woff2", 400),
    ("ArchivoBlackEdit", "archivo-black.woff2", 400),
    ("BarlowCondEdit", "barlow-condensed-700.woff2", 700),
    ("SpaceMonoEdit", "space-mono-700.woff2", 700),
]

header = """/**
 * The four display faces, inlined as data URIs.
 *
 * Fetching them at render time raced the renderer and hung frames, so the bytes
 * live here instead — the fonts are present the moment the page parses, with no
 * network and nothing to wait on. Regenerate with tools/embed_fonts.py after
 * swapping a typeface.
 */
export const FONT_CSS = `"""

rules = []
for family, filename, weight in FACES:
    with open(os.path.join(FONT_DIR, filename), "rb") as fh:
        b64 = base64.b64encode(fh.read()).decode()
    rules.append(
        f"@font-face{{font-family:'{family}';font-style:normal;font-weight:{weight};"
        f"font-display:block;src:url(data:font/woff2;base64,{b64}) format('woff2');}}"
    )

with open(OUT, "w") as fh:
    fh.write(header + "\n" + "\n".join(rules) + "\n`;\n")

print(f"wrote {OUT} ({os.path.getsize(OUT)} bytes)")
