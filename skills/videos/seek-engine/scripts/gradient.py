# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy"]
# ///
"""Bake a gradient backdrop as a dithered PNG, so it never bands. Run from the film folder.

Chromium renders CSS gradients in 8 bits: a ramp that changes by fewer than ~30 code values across the frame shows
contour rings, and nothing downstream (motion blur, a better encoder, grain) can remove them. This computes the ramp
in float, adds +-1 LSB triangular dither, and quantises once.

  uv run scripts/gradient.py --stops "#0B0C0E@0,#16181C@1" --linear 180 --out assets/bg.png
  uv run scripts/gradient.py --stops "#1A1C20@0,#0B0C0E@1" --radial 0.5,0.45,0.7,0.6 --size 1080x1920 --out assets/bg-9x16.png
  uv run scripts/gradient.py ... --preview out/qa/bg-bands.png      also writes a x12 contrast stretch: bands show there

--linear takes a CSS angle (180 = top to bottom); --radial takes cx,cy,rx,ry as fractions of the frame.
--space oklab (default; the smoothest ramp between two neutrals) or srgb (explicit gamma-encoded sRGB interpolation).
Use the PNG as the stage: <img src="assets/bg.png" style="position:absolute;left:0;top:0;width:100%;height:100%">.
"""
import math
import struct
import sys
import zlib

import numpy as np


def arg(name, default=None):
    a = sys.argv[1:]
    return a[a.index(name) + 1] if name in a else default


# The old header called sRGB universal CSS behavior; interpolation can be selected explicitly.
# https://drafts.csswg.org/css-images-4/#coloring-gradient-line
def srgb_to_lin(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def lin_to_srgb(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, 12.92 * c, 1.055 * c ** (1 / 2.4) - 0.055)


def to_oklab(rgb):
    l = srgb_to_lin(rgb) @ np.array([[0.4122214708, 0.2119034982, 0.0883024619], [0.5363325363, 0.6806995451, 0.2817188376], [0.0514459929, 0.1073969566, 0.6299787005]])
    l = np.cbrt(l)
    return l @ np.array([[0.2104542553, 1.9779984951, 0.0259040371], [0.7936177850, -2.4285922050, 0.7827717662], [-0.0040720468, 0.4505937099, -0.8086757660]])


def from_oklab(lab):
    l = lab @ np.array([[1, 1, 1], [0.3963377774, -0.1055613458, -0.0894841775], [0.2158037573, -0.0638541728, -1.2914855480]])
    l = l ** 3
    rgb = l @ np.array([[4.0767416621, -1.2684380046, -0.0041960863], [-3.3077115913, 2.6097574011, -0.7034186147], [0.2309699292, -0.3413193965, 1.7076147010]])
    return lin_to_srgb(rgb)


def hex_rgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)])


def write_png(path, img):
    h, w, _ = img.shape
    raw = b"".join(b"\x00" + img[y].tobytes() for y in range(h))
    chunk = lambda t, d: struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)
    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw, 6)) + chunk(b"IEND", b""))


def main():
    if not arg("--stops") or not arg("--out"):
        sys.exit(__doc__)
    w, h = map(int, arg("--size", "1920x1080").split("x"))
    stops = []
    for s in arg("--stops").split(","):
        c, p = s.split("@")
        stops.append((float(p), hex_rgb(c)))
    stops.sort(key=lambda x: x[0])
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float64)
    if arg("--radial"):
        cx, cy, rx, ry = map(float, arg("--radial").split(","))
        t = np.sqrt(((xs / w - cx) / rx) ** 2 + ((ys / h - cy) / ry) ** 2)
    else:
        ang = math.radians(float(arg("--linear", 180)))
        dx, dy = math.sin(ang), -math.cos(ang)  # CSS: 0deg points up, 90deg right, 180deg down
        proj = (xs - w / 2) * dx + (ys - h / 2) * dy
        half = abs(w / 2 * dx) + abs(h / 2 * dy)
        t = (proj + half) / (2 * half)
    t = np.clip(t, 0, 1)
    oklab = arg("--space", "oklab") == "oklab"
    cols = [to_oklab(c[None])[0] if oklab else c for _, c in stops]
    pos = [p for p, _ in stops]
    out = np.zeros((h, w, 3))
    for ch in range(3):
        out[..., ch] = np.interp(t, pos, [c[ch] for c in cols])
    if oklab:
        out = from_oklab(out.reshape(-1, 3)).reshape(h, w, 3)
    rng = np.random.default_rng(int(arg("--seed", 11)))
    dither = (rng.random((h, w, 1)) - rng.random((h, w, 1)))  # triangular, +-1 LSB, same on all channels
    img = np.clip(np.round(out * 255 + dither), 0, 255).astype(np.uint8)
    write_png(arg("--out"), img)
    span = int(img.reshape(-1, 3).max(axis=0).max() - img.reshape(-1, 3).min(axis=0).min())
    print(f"wrote {arg('--out')} ({w}x{h}, {span} code values across the ramp)")
    if arg("--preview"):
        lo = img.min()
        write_png(arg("--preview"), np.clip((img.astype(int) - lo) * 12, 0, 255).astype(np.uint8))
        print(f"wrote {arg('--preview')} (x12 contrast stretch)")


if __name__ == "__main__":
    main()
