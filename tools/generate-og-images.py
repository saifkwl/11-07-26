# -*- coding: utf-8 -*-
"""
ShikarpuriAchar.pk — Branded Open Graph image generator
---------------------------------------------------------
Generates simple, premium, TYPOGRAPHIC social-share cards (1200x630 PNG)
using the site's own design tokens (css/style.css colors). These are
designed cards, not pretend product photography — no fake AI product
images are ever generated. English text only (Pillow does not reliably
shape Urdu/Arabic script) — no Urdu/Arabic text is rendered.

One shared template, one variable "main focus" line:
  - assets/og/og-default.png  — brand mark, "ShikarpuriAchar.pk" large and
                                 centered, tagline below in mustard.
  - assets/og/<slug>.png      — brand mark, the product's English name
                                 (products.json: nameEn) large and centered,
                                 its category below in mustard.

Requires: Pillow (pip install Pillow). Uses the Windows system Georgia
font for the serif brand/heading look.

Run from the project root:
    python tools/generate-og-images.py

Re-run whenever a product name changes or a new product is added —
this is idempotent and always regenerates every file.
"""
import io
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "assets", "og")
W, H = 1200, 630

# ---- Design tokens (mirrors css/style.css custom properties) ----
CREAM = "#FBF3E4"
DEEP_GREEN = "#1F4D3A"
DEEP_GREEN_DARK = "#123024"
MUSTARD = "#C9972B"
MUSTARD_LIGHT = "#E4B75A"
MUSTARD_DARK = "#A67A1C"

FONT_DIR = "C:/Windows/Fonts"
SERIF_BOLD = os.path.join(FONT_DIR, "georgiab.ttf")
SERIF_ITALIC = os.path.join(FONT_DIR, "georgiai.ttf")

_font_cache = {}


def font(path, size):
    key = (path, size)
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(path, size)
    return _font_cache[key]


def fit_font(draw, text, path, max_width, start_size, min_size=40):
    """Shrink font size until `text` fits within max_width."""
    size = start_size
    while size > min_size:
        f = font(path, size)
        bbox = draw.textbbox((0, 0), text, font=f)
        if (bbox[2] - bbox[0]) <= max_width:
            return f
        size -= 2
    return font(path, min_size)


def leaf(draw, cx, cy, size, color, angle=0):
    """A simple abstract leaf shape (two arcs forming an almond), not clipart."""
    img = Image.new("RGBA", (int(size * 2.4), int(size * 1.4)), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    w, h = img.size
    d.pieslice([0, 0, w, h], 200, 340, fill=color)
    d.pieslice([0, -h * 0.15, w, h * 0.85], 20, 160, fill=color)
    rotated = img.rotate(angle, expand=True)
    draw._image.paste(rotated, (int(cx - rotated.width / 2), int(cy - rotated.height / 2)), rotated)


def base_card():
    """Shared background + border frame + corner motifs + brand mark."""
    img = Image.new("RGB", (W, H), CREAM)
    draw = ImageDraw.Draw(img)
    draw._image = img  # convenience handle for the leaf() paste helper

    # Outer + inner border frame
    draw.rectangle([18, 18, W - 18, H - 18], outline=DEEP_GREEN, width=4)
    draw.rectangle([30, 30, W - 30, H - 30], outline=MUSTARD, width=2)

    # Subtle decorative leaf motifs in the corners (line-art style, low visual weight)
    tint = (201, 151, 43, 60)  # mustard, translucent
    leaf(draw, 95, 95, 60, tint, angle=25)
    leaf(draw, W - 95, H - 95, 60, tint, angle=205)

    # Brand mark: circle badge + small wordmark below it, centered
    cx, cy, r = W // 2, 145, 58
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=MUSTARD_LIGHT, outline=MUSTARD_DARK, width=3)
    draw.text((cx, cy), "SA", font=font(SERIF_BOLD, 50), fill=DEEP_GREEN_DARK, anchor="mm")
    draw.text((cx, 224), "ShikarpuriAchar.pk", font=font(SERIF_BOLD, 28), fill=DEEP_GREEN_DARK, anchor="mm")

    return img, draw


def render_card(main_text, sub_text, filename):
    img, draw = base_card()
    cx = W // 2

    f_main = fit_font(draw, main_text, SERIF_BOLD, W - 160, 92, 46)
    draw.text((cx, 350), main_text, font=f_main, fill=DEEP_GREEN_DARK, anchor="mm")

    if sub_text:
        f_sub = fit_font(draw, sub_text, SERIF_ITALIC, W - 200, 34, 22)
        draw.text((cx, 432), sub_text, font=f_sub, fill=MUSTARD_DARK, anchor="mm")

    os.makedirs(OUT_DIR, exist_ok=True)
    img.save(os.path.join(OUT_DIR, filename), "PNG")


def generate_default():
    render_card("ShikarpuriAchar.pk", "Original Shikarpuri Achar · Since 1985", "og-default.png")
    print("  wrote assets/og/og-default.png")


def generate_product(p):
    render_card(p["nameEn"], p.get("category", ""), f"{p['slug']}.png")


def main():
    with io.open(os.path.join(ROOT, "products.json"), encoding="utf-8") as f:
        products = json.load(f)["products"]

    generate_default()
    for p in products:
        generate_product(p)
        print(f"  wrote assets/og/{p['slug']}.png")

    print(f"Done. {len(products) + 1} OG images generated in assets/og/.")


if __name__ == "__main__":
    sys.exit(main())
