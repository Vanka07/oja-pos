#!/usr/bin/env python3
"""Generate Oja POS app icons and splash screen — burnt orange + bold cart"""

from PIL import Image, ImageDraw, ImageFont
import os

ORANGE = (224, 94, 27)          # #E05E1B burnt orange
DARK_BG = (28, 25, 23)          # #1C1917 stone-900
WHITE = (255, 255, 255)
LIGHT_ORANGE = (245, 158, 100)


def draw_cart(draw, cx, cy, size, color=WHITE, bold=False):
    """Draw a clean shopping cart icon — bigger and bolder"""
    s = size
    lw = max(int(s * 0.09), 4) if bold else max(int(s * 0.07), 3)

    # Handle curve (top-left)
    arc_box = [cx - s*0.52, cy - s*0.58, cx - s*0.12, cy - s*0.22]
    draw.arc(arc_box, 180, 275, fill=color, width=lw)

    # Cart body — trapezoid
    tl = (cx - s*0.38, cy - s*0.28)
    tr = (cx + s*0.48, cy - s*0.28)
    br = (cx + s*0.38, cy + s*0.22)
    bl = (cx - s*0.28, cy + s*0.22)

    draw.line([tl, tr], fill=color, width=lw)
    draw.line([tr, br], fill=color, width=lw)
    draw.line([br, bl], fill=color, width=lw)
    draw.line([bl, tl], fill=color, width=lw)

    # Shelf line
    mid_y = cy - s*0.03
    draw.line([(cx - s*0.33, mid_y), (cx + s*0.43, mid_y)], fill=color, width=max(lw*2//3, 2))

    # Legs
    leg_lw = max(lw*2//3, 2)
    draw.line([(cx - s*0.20, cy + s*0.22), (cx - s*0.20, cy + s*0.34)], fill=color, width=leg_lw)
    draw.line([(cx + s*0.30, cy + s*0.22), (cx + s*0.30, cy + s*0.34)], fill=color, width=leg_lw)

    # Wheels
    wr = s * 0.08 if bold else s * 0.065
    draw.ellipse([cx - s*0.20 - wr, cy + s*0.34 - wr, cx - s*0.20 + wr, cy + s*0.34 + wr], fill=color)
    draw.ellipse([cx + s*0.30 - wr, cy + s*0.34 - wr, cx + s*0.30 + wr, cy + s*0.34 + wr], fill=color)


def draw_rounded_rect(draw, bbox, radius, fill):
    x1, y1, x2, y2 = bbox
    draw.rectangle([x1+radius, y1, x2-radius, y2], fill=fill)
    draw.rectangle([x1, y1+radius, x2, y2-radius], fill=fill)
    draw.pieslice([x1, y1, x1+2*radius, y1+2*radius], 180, 270, fill=fill)
    draw.pieslice([x2-2*radius, y1, x2, y1+2*radius], 270, 360, fill=fill)
    draw.pieslice([x1, y2-2*radius, x1+2*radius, y2], 90, 180, fill=fill)
    draw.pieslice([x2-2*radius, y2-2*radius, x2, y2], 0, 90, fill=fill)


def generate_icon(size, filename):
    """App icon — big orange circle, bold white cart, dark bg"""
    img = Image.new('RGBA', (size, size), DARK_BG)
    draw = ImageDraw.Draw(img)

    cx, cy = size // 2, size // 2

    # Orange circle — fills ~75% of the icon
    r = int(size * 0.375)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=ORANGE)

    # Cart — fills ~80% of the circle
    cart_size = int(size * 0.42)
    draw_cart(draw, cx + int(size*0.01), cy, cart_size, WHITE, bold=True)

    img.save(filename, 'PNG')
    print(f'  ✅ {filename} ({size}x{size})')


def generate_adaptive_icon(size, filename):
    """Adaptive icon foreground — cart on transparent"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx, cy = size // 2, size // 2

    r = int(size * 0.30)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=ORANGE)

    cart_size = int(size * 0.34)
    draw_cart(draw, cx + int(size*0.01), cy, cart_size, WHITE, bold=True)

    img.save(filename, 'PNG')
    print(f'  ✅ {filename} ({size}x{size})')


def generate_favicon(size, filename):
    """Favicon — bold O lettermark in orange circle, clean at 16-48px"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Orange circle fills the space
    pad = max(int(size * 0.04), 1)
    draw.ellipse([pad, pad, size - pad, size - pad], fill=ORANGE)

    # Bold "O" letter
    try:
        font_size = int(size * 0.6)
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), "O", font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (size - tw) // 2
    ty = (size - th) // 2 - bbox[1]
    draw.text((tx, ty), "O", fill=WHITE, font=font)

    img.save(filename, 'PNG')
    print(f'  ✅ {filename} ({size}x{size})')


def generate_splash(width, height, filename):
    """Splash screen — cart icon + text"""
    img = Image.new('RGBA', (width, height), DARK_BG)
    draw = ImageDraw.Draw(img)

    cx, cy = width // 2, height // 2 - int(height * 0.06)

    # Orange circle
    r = int(min(width, height) * 0.18)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=ORANGE)

    # Cart
    cart_size = int(min(width, height) * 0.22)
    draw_cart(draw, cx + int(width*0.005), cy, cart_size, WHITE, bold=True)

    # Text
    text_y = cy + r + int(height * 0.04)
    try:
        font_large = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", int(height * 0.05))
        font_small = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", int(height * 0.022))
    except:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), "Oja POS", font=font_large)
    tw = bbox[2] - bbox[0]
    draw.text((cx - tw//2, text_y), "Oja POS", fill=WHITE, font=font_large)

    tag = "The POS Built for Nigerian Shops"
    tag_y = text_y + int(height * 0.065)
    bbox = draw.textbbox((0, 0), tag, font=font_small)
    tw = bbox[2] - bbox[0]
    draw.text((cx - tw//2, tag_y), tag, fill=LIGHT_ORANGE, font=font_small)

    img.save(filename, 'PNG')
    print(f'  ✅ {filename} ({width}x{height})')


# ─── Generate ───
print('🎨 Generating Oja POS icons v2 (bigger cart, cleaner favicon)...\n')

generate_icon(1024, 'assets/icon.png')
generate_adaptive_icon(1024, 'assets/adaptive-icon.png')
generate_favicon(48, 'assets/favicon.png')
generate_icon(512, 'assets/splash-icon.png')
generate_splash(1284, 2778, 'assets/splash-full.png')

print('\n✅ All icons generated!')
