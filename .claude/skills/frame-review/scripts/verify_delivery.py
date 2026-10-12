# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy"]
# ///
"""verify_delivery.py - check delivered files by decoding their pixels: duration, background colour, loop seam, probes.


  uv run scripts/verify_delivery.py out/16x9.mp4 out/16x9.webm --bg "#0a0a0a" [--duration 12] [--loop]
                                    [--probe 9.4:944,800=#ff4500] [--tol 2]

For every file:
  duration   matches --duration to within one frame (when given)
  bg         the decoded centre pixel of frame 0 equals the page's ground (--bg) within --tol per channel. A ground
             that comes back lighter (#0a0a0a read as #171717) means a colour-range or matrix mismatch in the
             encode: fix the encode, never the tokens
  seam       with --loop: the last frame against frame 0 shows only encoder noise (< 0.1% of pixels off by more
             than 3, none by 24 or more), so the loop does not jump
  probe      t:x,y prints the decoded colour there (an accent, a surface); t:x,y=#hex also checks it within --tol
  step       with --step N (a film drawn on twos, threes...): at least 98% of picture changes land on one N-frame grid,
             and no hold runs longer than N frames (a boiling line never stops). After day-in-my-life's qc.py
            
Exits 1 when a check fails.
"""
import argparse
import json
import subprocess
import sys

import numpy as np


def probe_stream(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_packets", "-show_entries",
                          "stream=width,height,r_frame_rate,nb_read_packets:format=duration", "-of", "json", path],
                         capture_output=True, text=True, check=True).stdout
    info = json.loads(out)
    s = info["streams"][0]
    num, den = (int(v) for v in s["r_frame_rate"].split("/"))
    return s["width"], s["height"], num / den, int(s["nb_read_packets"]), float(info["format"]["duration"])


def frame(path, index, w, h):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", f"select=eq(n\\,{index})", "-frames:v", "1",
                          "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
    if len(raw) != w * h * 3:
        sys.exit(f"verify_delivery: could not decode frame {index} of {path}")
    return np.frombuffer(raw, np.uint8).reshape(h, w, 3).astype(int)


def hex_rgb(value):
    v = value.lstrip("#")
    return np.array([int(v[i:i + 2], 16) for i in (0, 2, 4)])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="+")
    ap.add_argument("--bg", help="the page's ground, #rrggbb")
    ap.add_argument("--duration", type=float)
    ap.add_argument("--loop", action="store_true")
    ap.add_argument("--probe", action="append", default=[])
    ap.add_argument("--tol", type=int, default=2)
    ap.add_argument("--step", type=int, help="frames per drawing for a stepped film (2 = on twos)")
    a = ap.parse_args()
    failed = False
    for path in a.files:
        w, h, fps, n, dur = probe_stream(path)
        first = frame(path, 0, w, h)
        notes = [f"{w}x{h} {fps:g} fps {n} frames {dur:.3f}s"]
        if a.duration is not None:
            ok = abs(n / fps - a.duration) < 1 / fps + 1e-6
            failed |= not ok
            notes.append(f"duration {'ok' if ok else f'WRONG (expected {a.duration}s)'}")
        if a.bg:
            c = first[h // 2, w // 2]
            ok = bool(np.all(np.abs(c - hex_rgb(a.bg)) <= a.tol))
            failed |= not ok
            notes.append(f"bg {'#%02x%02x%02x' % tuple(c)} {'ok' if ok else 'OFF (colour range or matrix?)'}")
        if a.loop:
            d = np.abs(first - frame(path, n - 1, w, h)).max(axis=2)
            off = int((d > 3).sum())
            ok = off < 0.001 * w * h and d.max() < 24
            failed |= not ok
            notes.append(f"seam {off} px > 3, max {int(d.max())} {'ok' if ok else 'JUMPS'}")
        if a.step:
            raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", "scale=320:180,format=gray", "-f", "rawvideo", "-"],
                                 capture_output=True, check=True).stdout
            g = np.frombuffer(raw, np.uint8).reshape(-1, 180, 320).astype(np.float32)
            changed = np.abs(np.diff(g, axis=0)).mean(axis=(1, 2)) > 0.4
            idx = np.nonzero(changed)[0] + 1
            on_grid = max(((idx - ph) % a.step == 0).mean() for ph in range(a.step)) if len(idx) else 0.0
            hold = run = 0
            for c in changed:
                run = 0 if c else run + 1
                hold = max(hold, run)
            ok = on_grid >= 0.98 and hold + 1 <= a.step
            failed |= not ok
            notes.append(f"step {on_grid * 100:.1f}% on the {a.step}-frame grid, longest hold {hold + 1} frames {'ok' if ok else 'OFF'}")
        print(f"{path}: " + " | ".join(notes))
        for p in a.probe:
            spec, _, want = p.partition("=")
            t, _, xy = spec.partition(":")
            x, y = (int(v) for v in xy.split(","))
            c = frame(path, min(n - 1, round(float(t) * fps)), w, h)[y, x]
            line = f"    probe {spec}: {'#%02x%02x%02x' % tuple(c)}"
            if want:
                ok = bool(np.all(np.abs(c - hex_rgb(want)) <= a.tol))
                failed |= not ok
                line += f" {'ok' if ok else 'OFF, expected ' + want}"
            print(line)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
