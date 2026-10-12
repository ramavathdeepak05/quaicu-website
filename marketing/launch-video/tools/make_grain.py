"""Generate src/grain.png: a 256px tile of faint monochrome noise.

Laid over every frame, it dithers the dark green glows so the H.264 encode
doesn't band. Run once; the PNG is committed.
"""
import os
import numpy as np
from PIL import Image

rng = np.random.default_rng(2041)
n = rng.normal(0, 1, (256, 256))
a = np.clip(np.abs(n) * 5.5, 0, 255).astype(np.uint8)
rgb = np.where(n[..., None] > 0, 255, 0).astype(np.uint8).repeat(3, axis=2)
img = np.dstack([rgb, a])
out = os.path.join(os.path.dirname(__file__), "..", "src", "grain.png")
Image.fromarray(img, "RGBA").save(out, optimize=True)
print("wrote", os.path.normpath(out))
