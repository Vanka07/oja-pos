#!/usr/bin/env python3
"""Generate Oja POS app icons and splash screen with cart logo + burnt orange"""

from PIL import Image, ImageDraw, ImageFont
import math
import os

ORANGE = (224, 94, 27)       # #E05E1B burnt orange
DARK_BG = (28, 25, 23)       # #1C1917 stone-900
WHITE = (255, 255, 255)
LIGHT_ORANGE = (245, 158, 100)  # lighter accent

def draw_cart(draw, cx, cy, size, color=WHITE):
    """Draw a shopping cart icon"""
    s = size
    lw = max(int(s * 0.08), 4)
    
    # Cart handle (top-left curve)
    handle_start = (cx - s*0.45, cy - s*0.35)
    handle_mid = (cx - s*0.35, cy - s*0.45)
    handle_end = (cx - s*0.2, cy - s*0.35)
    
    # Draw handle as arc
    draw.arc(
        [cx - s*0.5, cy - s*0.55, cx - s*0.15, cy - s*0.25],
        180, 270, fill=color, width=lw
    )
    
    # Cart body - trapezoid shape
    body_top_left = (cx - s*0.35, cy - s*0.25)
    body_top_right = (cx + s*0.45, cy - s*0.25)
    body_bot_right = (cx + s*0.35, cy + s*0.2)
    body_bot_left = (cx - s*0.25, cy + s*0.2)
    
    # Draw cart body lines
    draw.line([body_top_left, body_top_right], fill=color, width=lw)
    draw.line([body_top_right, body_bot_right], fill=color, width=lw)
    draw.line([body_bot_right, body_bot_left], fill=color, width=lw)
    draw.line([body_bot_left, body_top_left], fill=color, width=lw)
    
    # Horizontal line in middle of cart (shelf)
    mid_y = cy - s*0.025
    draw.line(
        [(cx - s*0.3, mid_y), (cx + s*0.4, mid_y)],
        fill=color, width=max(lw//2, 2)
    )
    
    # Wheels
    wheel_r = s * 0.07
    wheel_y = cy + s*0.32
    # Left wheel
    draw.ellipse(
        [cx - s*0.18 - wheel_r, wheel_y - wheel_r, 
         cx - s*0.18 + wheel_r, wheel_y + wheel_r],
        fill=color
    )
    # Right wheel
    draw.ellipse(
        [cx + s*0.28 - wheel_r, wheel_y - wheel_r,
         cx + s*0.28 + wheel_r, wheel_y + wheel_r],
        fill=color
    )
    # Legs connecting body to wheels
    draw.line(
        [(cx - s*0.18, cy + s*0.2), (cx - s*0.18, wheel_y - wheel_r)],
        fill=color, width=max(lw//2, 2)
    )
    draw.line(
        [(cx + s*0.28, cy + s*0.2), (cx + s*0.28, wheel_y - wheel_r)],
        fill=color, width=max(lw//2, 2)
    )


def draw_rounded_rect(draw, bbox, radius, fill):
    """Draw a rounded rectangle"""
    x1, y1, x2, y2 = bbox
    draw.rectangle([x1+radius, y1, x2-radius, y2], fill=fill)
    draw.rectangle([x1, y1+radius, x2, y2-radius], fill=fill)
    draw.pieslice([x1, y1, x1+2*radius, y1+2*radius], 180, 270, fill=fill)
    draw.pieslice([x2-2*radius, y1, x2, y1+2*radius], 270, 360, fill=fill)
    draw.pieslice([x1, y2-2*radius, x1+2*radius, y2], 90, 180, fill=fill)
    draw.pieslice([x2-2*radius, y2-2*radius, x2, y2], 0, 90, fill=fill)


def generate_icon(size, filename, padding_pct=0.15, include_bg_rect=True):
    """Generate app icon"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    if include_bg_rect:
        # Rounded rectangle background
        pad = int(size * 0.02)
        radius = int(size * 0.18)
        draw_rounded_rect(draw, [pad, pad, size-pad, size-pad], radius, DARK_BG)
    else:
        # Full background
        draw.rectangle([0, 0, size, size], fill=DARK_BG)
    
    cx, cy = size // 2, size // 2
    
    # Orange circle behind the cart
    circle_r = int(size * 0.32)
    draw.ellipse(
        [cx - circle_r, cy - circle_r - int(size*0.02), 
         cx + circle_r, cy + circle_r - int(size*0.02)],
        fill=ORANGE
    )
    
    # Draw cart
    cart_size = int(size * 0.38)
    draw_cart(draw, cx, cy - int(size*0.02), cart_size, WHITE)
    
    img.save(filename, 'PNG')
    print(f'  ✅ {filename} ({size}x{size})')
    return img


def generate_adaptive_icon(size, filename):
    """Generate adaptive icon (just the foreground, no background shape)"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    cx, cy = size // 2, size // 2
    
    # Orange circle
    circle_r = int(size * 0.25)
    draw.ellipse(
        [cx - circle_r, cy - circle_r, cx + circle_r, cy + circle_r],
        fill=ORANGE
    )
    
    # Cart
    cart_size = int(size * 0.30)
    draw_cart(draw, cx, cy, cart_size, WHITE)
    
    img.save(filename, 'PNG')
    print(f'  ✅ {filename} ({size}x{size})')


def generate_favicon(size, filename):
    """Generate favicon"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Orange circle fills most of the space
    pad = int(size * 0.05)
    draw.ellipse([pad, pad, size-pad, size-pad], fill=ORANGE)
    
    # Simplified cart for small sizes
    cx, cy = size // 2, size // 2
    cart_size = int(size * 0.35)
    lw = max(int(cart_size * 0.12), 2)
    
    # Simple cart body
    bx1 = cx - cart_size * 0.3
    by1 = cy - cart_size * 0.3
    bx2 = cx + cart_size * 0.4
    by2 = cy + cart_size * 0.25
    draw.rectangle([bx1, by1, bx2, by2], outline=WHITE, width=lw)
    
    # Wheels
    wr = max(cart_size * 0.08, 1.5)
    draw.ellipse([bx1 + cart_size*0.1 - wr, by2 + cart_size*0.15 - wr,
                  bx1 + cart_size*0.1 + wr, by2 + cart_size*0.15 + wr], fill=WHITE)
    draw.ellipse([bx2 - cart_size*0.15 - wr, by2 + cart_size*0.15 - wr,
                  bx2 - cart_size*0.15 + wr, by2 + cart_size*0.15 + wr], fill=WHITE)
    
    img.save(filename, 'PNG')
    print(f'  ✅ {filename} ({size}x{size})')


def generate_splash(width, height, filename):
    """Generate splash screen"""
    img = Image.new('RGBA', (width, height), DARK_BG)
    draw = ImageDraw.Draw(img)
    
    cx, cy = width // 2, height // 2 - int(height * 0.05)
    
    # Large orange circle
    circle_r = int(min(width, height) * 0.18)
    draw.ellipse(
        [cx - circle_r, cy - circle_r, cx + circle_r, cy + circle_r],
        fill=ORANGE
    )
    
    # Cart icon
    cart_size = int(min(width, height) * 0.22)
    draw_cart(draw, cx, cy, cart_size, WHITE)
    
    # "Oja POS" text below
    text_y = cy + circle_r + int(height * 0.04)
    try:
        font_large = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", int(height * 0.045))
        font_small = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", int(height * 0.02))
    except:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    # "Oja POS"
    bbox = draw.textbbox((0, 0), "Oja POS", font=font_large)
    tw = bbox[2] - bbox[0]
    draw.text((cx - tw//2, text_y), "Oja POS", fill=WHITE, font=font_large)
    
    # Tagline
    tag_y = text_y + int(height * 0.06)
    tag = "The POS Built for Nigerian Shops"
    bbox = draw.textbbox((0, 0), tag, font=font_small)
    tw = bbox[2] - bbox[0]
    draw.text((cx - tw//2, tag_y), tag, fill=LIGHT_ORANGE, font=font_small)
    
    img.save(filename, 'PNG')
    print(f'  ✅ {filename} ({width}x{height})')


# ─── Generate all assets ───
print('🎨 Generating Oja POS icons & splash...\n')

assets_dir = 'assets'

# App icon (1024x1024)
generate_icon(1024, f'{assets_dir}/icon.png', include_bg_rect=False)

# Adaptive icon foreground (1024x1024)
generate_adaptive_icon(1024, f'{assets_dir}/adaptive-icon.png')

# Favicon (48x48)
generate_favicon(48, f'{assets_dir}/favicon.png')

# Splash icon (512x512 — used by expo-splash-screen)
generate_icon(512, f'{assets_dir}/splash-icon.png', include_bg_rect=False)

# Full splash screens
generate_splash(1284, 2778, f'{assets_dir}/splash-full.png')

print('\n✅ All icons generated!')
