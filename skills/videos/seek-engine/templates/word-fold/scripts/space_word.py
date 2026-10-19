"""Equalise the letter spacing of a word-fold page optically.

usage: python3 space_word.py <project>/word-fold/<word>.html WORD [target=18.45]

[word-fold, scripts/space_word.py; references/quality-check.md]
The source raster mask requires light ink or saturated ribbon against a dark
background, separate connected letters, and >500 screenshot pixels per glyph.
Custom palettes, split-part glyphs and arbitrary word lengths are not supported
by this measurement. Capped mean gaps use local units, not output pixels.
Four passes are a ceiling; the final saved page is remeasured and failures report.
Needs: Node 22+, Chrome/Chromium, Python 3 with numpy, scipy, pillow.
https://github.com/scipy/scipy/blob/main/scipy/optimize/_zeros_py.py
https://docs.python.org/3/library/tempfile.html#tempfile.TemporaryDirectory
"""
import sys, re, json, os, subprocess, tempfile, math
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from scipy.optimize import brentq

HERE = os.path.dirname(os.path.abspath(__file__))
page = os.path.abspath(sys.argv[1]); word = sys.argv[2].upper()
target = float(sys.argv[3]) if len(sys.argv) > 3 else 18.45
C = 20
if not re.fullmatch(r"[A-Z0-9]+", word) or not math.isfinite(target) or not 0 < target < C:
    sys.exit("word-fold: use one word and a finite target strictly between 0 and 20 local units.")
if len(word) == 1:
    print("word-fold: one letter has no spacing pairs; page unchanged.")
    sys.exit(0)


def measure_pairs():
    html = open(page, encoding="utf-8").read()
    match = re.search(r"gaps:\s*(\[[^\]]*\])", html)
    if not match:
        sys.exit("word-fold: page needs a literal FOLD.gaps array.")
    gaps = json.loads(match.group(1))
    if len(gaps) != len(word) - 1:
        sys.exit("word-fold: gap count must match the word's letter pairs.")
    with tempfile.TemporaryDirectory() as out:
        r = subprocess.run(["node", os.path.join(HERE, "capture.mjs"), page, out, "99"],
                           env={**os.environ, "W": "1920", "H": "1080", "EVAL": "JSON.stringify(window.FOLD_INFO)"},
                           check=True, capture_output=True, text=True)
        info = json.loads(json.loads(r.stdout.strip().splitlines()[0]))
        if not all(k in info for k in ("word", "DUR", "VIEW_W", "FINAL_SCALE")):
            sys.exit("word-fold: update project FOLD_INFO measurement metadata while retaining custom glyphs/endings.")
        if info["word"] != word or info["DUR"] > 99:
            sys.exit("word-fold: word must match the page and duration must fit the source's 99-second final-frame capture.")
        view = info["VIEW_W"]
        with Image.open(f"{out}/99.png") as image:
            a = np.asarray(image.convert("RGB")).astype(int)
    ink = (a.min(2) > 150) | ((a.max(2) - a.min(2)) > 90)
    lab, n = ndi.label(ink); objs = ndi.find_objects(lab)
    comps = sorted([(o[1].start, i + 1) for i, o in enumerate(objs) if (lab[o] == i + 1).sum() > 500])
    if len(comps) != len(word):
        sys.exit(f"word-fold: found {len(comps)} components for {word}; check touching/missing letters and the palette/scale limits.")
    ys, _ = ink.nonzero(); y0, y1 = ys.min(), ys.max(); scale = 1920 / view * info["FINAL_SCALE"]
    pairs, separations = [], []
    for k in range(len(comps) - 1):
        L = lab == comps[k][1]; R = lab == comps[k + 1][1]; rows, shared = [], []
        for y in range(y0, y1 + 1):
            lx = np.nonzero(L[y])[0]; rx = np.nonzero(R[y])[0]
            if len(lx) and len(rx):
                gap = (rx.min() - lx.max() - 1) / scale
                rows.append(gap); shared.append(gap)
            else:
                rows.append(C)
        if not shared:
            sys.exit("word-fold: pair has no shared ink rows; cannot measure minimum separation.")
        pairs.append(np.array(rows)); separations.append(min(shared))
    return html, gaps, pairs, separations


for it in range(4):
    html, gaps, pairs, separations = measure_pairs()
    if all(abs(np.clip(rr, 0, C).mean() - target) <= 0.3 and sep >= 5
           for rr, sep in zip(pairs, separations)):
        break
    shifts = []
    for rr, separation in zip(pairs, separations):
        M = lambda d: np.clip(rr + d, 0, C).mean()
        try:
            shift = brentq(lambda d: M(d) - target, -60, 60)
        except ValueError:
            sys.exit("word-fold: target is not bracketed by the source's -60 to 60 shift range.")
        shifts.append(max(shift, -(separation - 5)))
    new = [round(g + d, 2) for g, d in zip(gaps, shifts)]
    print(word, "pass", it, "gaps", gaps, "->", new)
    with open(page, "w", encoding="utf-8") as f:
        f.write(re.sub(r"gaps:\s*\[[^\]]*\]", "gaps:" + json.dumps(new), html, count=1))

html, gaps, pairs, separations = measure_pairs()
failed = False
for k, (rr, separation) in enumerate(zip(pairs, separations)):
    mean = np.clip(rr, 0, C).mean(); residual = mean - target
    print(f"{word[k:k+2]} capped mean {mean:.4f}, target residual {residual:+.4f}, minimum separation {separation:.4f} local units")
    failed |= abs(residual) > 0.3 or separation < 5
if failed:
    sys.exit("word-fold: final saved page is outside target tolerance or minimum separation; inspect before further edits.")
