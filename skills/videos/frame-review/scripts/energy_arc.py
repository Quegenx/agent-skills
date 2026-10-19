# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy"]
# ///
"""The film's energy arc, measured from the rendered file: how much the picture moves, frame by frame.

  uv run scripts/energy_arc.py                       out/16x9.mp4
  uv run scripts/energy_arc.py out/9x16.mp4 --map audio/map.json

A still can't show pacing and a watch-through can't be measured, so this turns the render into numbers: the
picture change per frame (mean absolute difference of a small greyscale copy, log-compressed so one
full-frame flood doesn't drown every smaller move), smoothed over ~0.5 s, then
  - the shape: a sparkline, where the first peak and the biggest peak fall, checked against the measured norms of
    launch films (first peak at 10-25% of the runtime, the biggest around 75-90%, a calmer stretch between);
  - contrast: (p90 - p10) / median; under 0.15 the film is flat, one energy from start to end;
  - rest: the share of the runtime in holds, measured above the floor (p10), not above zero, because grain or a
    boiling ground keeps every frame changing a little. 40-60% rest reads as a film that breathes; much less is
    churn, much more stalls;
  - with --map (from beat-grid's analyze_audio.py map): energy per bar against the music's tier per bar. The
    picture should climb with the music: mean energy rising tier by tier, and a positive correlation.
Needs ffmpeg.
"""
import json
import os
import subprocess
import sys

import numpy as np

W, H = 160, 90
BLOCKS = " ▁▂▃▄▅▆▇█"


def arg(name, default=None):
    a = sys.argv[1:]
    return a[a.index(name) + 1] if name in a else default


def frames(path):
    out = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", f"scale={W}:{H},format=gray", "-f", "rawvideo", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(out, dtype=np.uint8).reshape(-1, H, W).astype(np.float32)


def main():
    src = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else "out/16x9.mp4"
    if not os.path.isfile(src):
        sys.exit(f"energy_arc: {src} not found (render first: node scripts/render.mjs full)")
    rate = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate",
                           "-of", "csv=p=0", src], capture_output=True, text=True, check=True).stdout.strip()
    num, _, den = rate.partition("/")
    fps = float(num) / float(den or 1)
    f = frames(src)
    if len(f) < 3:
        sys.exit("energy_arc: too few frames to measure")
    diff = np.abs(np.diff(f, axis=0)).mean(axis=(1, 2))
    diff = np.concatenate([[diff[0]], diff])
    # perceived, not raw: a full-frame flood changes every pixel, a cursor a few; log-compress so the flood reads
    # as big without flattening every smaller move into "rest" (0.05 grey levels ~ a small UI move)
    diff = np.log1p(diff / 0.05)
    k = min(len(diff), max(1, int(fps * 0.5)))  # 'same' returns max(input, kernel) samples: keep the clip length.
    sm = np.convolve(diff, np.ones(k) / k, mode="same")
    n, dur = len(sm), len(sm) / fps
    p10, p50, p90 = np.percentile(sm, [10, 50, 90])
    contrast = (p90 - p10) / (p50 + 1e-9)
    rest = float((sm < p10 + 0.35 * (p90 - p10)).mean())
    cols = 64
    pts = [sm[int(i * n / cols): max(int((i + 1) * n / cols), int(i * n / cols) + 1)].mean() for i in range(cols)]
    hi = max(pts) or 1
    print(f"{src}: {dur:.1f} s at {fps:g} fps")
    print(f"  energy  |{''.join(BLOCKS[min(8, int(p / hi * 8.999))] for p in pts)}|")
    print(f"  floor p10 {p10:.2f}  median {p50:.2f}  p90 {p90:.2f}  contrast {contrast:.2f}")
    result = {"source": src, "fps": fps, "duration": round(dur, 2), "contrast": round(float(contrast), 3),
              "rest": round(rest, 3)}
    if contrast < 0.15:
        print("  FLAT: one energy from start to end, no peaks against valleys (fine for a loop or a glossary, not a film)")
    else:
        # peaks: the biggest, and the first one that reaches 75% of it
        big = int(np.argmax(sm))
        first = int(np.argmax(sm >= 0.75 * sm[big]))
        fp, bp = first / n, big / n
        print(f"  first peak at {fp:.0%} of the runtime ({first / fps:.1f} s), norm 10-25%"
              + ("" if 0.10 <= fp <= 0.25 else "  <- off the norm"))
        print(f"  biggest peak at {bp:.0%} ({big / fps:.1f} s), norm 75-90%" + ("" if 0.75 <= bp <= 0.90 else "  <- off the norm"))
        print(f"  rest {rest:.0%} of the runtime in holds" + ("" if 0.40 <= rest <= 0.60 else
              "  <- churn: almost no holds" if rest < 0.40 else "  <- stalls: too much of it at rest"))
        result.update({"first_peak": round(fp, 3), "biggest_peak": round(bp, 3)})
    mp = arg("--map")
    if mp:
        m = json.load(open(mp))
        bar = 4 * float(m["beat"])
        tiers = [int(c) for c in m["tiers"]]
        means, ts = [], []
        for i, tier in enumerate(tiers):
            a, z = int(i * bar * fps), int((i + 1) * bar * fps)
            if a >= n:
                break
            means.append(float(sm[a:min(z, n)].mean()))
            ts.append(tier)
        r = float(np.corrcoef(means, ts)[0, 1]) if len(set(ts)) > 1 and len(means) > 2 else 0.0
        print(f"  against the music ({len(means)} bars): correlation r = {r:.2f}")
        prev, rising = -1.0, True
        for tier in sorted(set(ts)):
            v = float(np.mean([e for e, t in zip(means, ts) if t == tier]))
            rising = rising and v >= prev
            print(f"    tier {tier}: mean energy {v:.2f}" + ("" if v >= prev else "  <- lower than the tier below"))
            prev = v
        print("  the picture climbs with the music" if rising and r > 0.3 else "  the picture does not follow the music's arc")
        result.update({"music_r": round(r, 3), "rises_with_tiers": rising})
    os.makedirs("out/qa", exist_ok=True)
    json.dump(result, open("out/qa/energy_arc.json", "w"), indent=2)
    print("  wrote out/qa/energy_arc.json")


if __name__ == "__main__":
    main()
