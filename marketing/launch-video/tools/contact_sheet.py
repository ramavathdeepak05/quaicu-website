"""Tile a folder of stills into one contact sheet for review.

usage: python3 tools/contact_sheet.py <stills-dir> <out.png> [columns]
"""
import os
import sys
from PIL import Image, ImageDraw

src, out = sys.argv[1], sys.argv[2]
files = sorted(f for f in os.listdir(src) if f.endswith(".png"))
ims = [Image.open(os.path.join(src, f)).convert("RGB") for f in files]
w, h = ims[0].size
cols = int(sys.argv[3]) if len(sys.argv) > 3 else (4 if w > h else 6)
scale = 480 / w if w > h else 300 / w
tw, th = int(w * scale), int(h * scale)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (tw + 8) + 8, rows * (th + 30) + 8), (40, 40, 40))
d = ImageDraw.Draw(sheet)
for i, (f, im) in enumerate(zip(files, ims)):
    x, y = 8 + (i % cols) * (tw + 8), 8 + (i // cols) * (th + 30)
    sheet.paste(im.resize((tw, th), Image.LANCZOS), (x, y))
    d.text((x, y + th + 6), f[:-4], fill=(220, 220, 220))
sheet.save(out)
print("wrote", out)
