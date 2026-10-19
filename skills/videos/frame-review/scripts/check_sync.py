# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy"]
# ///
"""Check the delivered file's sound: is it in sync with the mix, and is it loud and clean enough? Run from the film folder.

  uv run scripts/check_sync.py out/16x9.mp4 [audio/mix.wav] [--lufs -14]

- sync: cross-correlates the decoded MP4 audio with the mix at 12%, 45% and 85% of the film; every lag must be
  within 48 samples (1 ms). A late soundtrack reads as sloppy even when nobody can say why.
- true peak after the AAC encode (it adds 0.5-1 dB): at most -1 dBTP.
- integrated loudness within 1 LU of the target (-14 by default; -16 only for a short sting).
- loudness range (LRA): reported; a film of 20 s or more wants 5-8 LU, or it sounds flat.
- the loudest moment: reported as a share of the runtime; the payoff should own it (about 30-60% into a launch
  film), never the end card.
Exits 1 when a gate fails.
"""
import json
import subprocess
import sys

import numpy as np

SR = 48000


def decode(path):
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True)
    if r.returncode or not r.stdout:
        sys.exit(f"check_sync: no audio decoded from {path} (missing file, or a render made without audio/mix.wav?)")
    raw = r.stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def lag_at(a, b, centre, win=SR // 2, search=SR // 20):
    """Samples by which b (decoded) trails a (mix) around `centre`, by normalised cross-correlation."""
    i0 = max(search, centre - win // 2)
    seg = a[i0: i0 + win]
    if np.abs(seg).max() < 1e-4:
        return None  # silence: nothing to align
    best, best_c = 0, -1.0
    for lag in range(-search, search + 1, 4):  # coarse, then refine
        c = np.dot(seg, b[i0 + lag: i0 + lag + win])
        if c > best_c:
            best, best_c = lag, c
    for lag in range(best - 4, best + 5):
        c = np.dot(seg, b[i0 + lag: i0 + lag + win])
        if c > best_c:
            best, best_c = lag, c
    return best


def ebur128(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    summary = r[r.rfind("Summary:"):]
    pick = lambda label: float(next(ln.split(":", 1)[1].split()[0] for ln in summary.splitlines() if ln.strip().startswith(label + ":")))
    moments = [float(ln.split("M:")[1].split()[0]) for ln in r.splitlines() if " M:" in ln and "TARGET" in ln or ("M:" in ln and "t:" in ln)]
    return pick("I"), pick("LRA"), pick("Peak"), moments


def main():
    argv = sys.argv[1:]
    args = [a for i, a in enumerate(argv) if not a.startswith("--") and not (i and argv[i - 1] == "--lufs")]
    if not args:
        sys.exit(__doc__)
    video = args[0]
    mix = args[1] if len(args) > 1 else "audio/mix.wav"
    target = float(sys.argv[sys.argv.index("--lufs") + 1]) if "--lufs" in sys.argv else -14.0
    a, b = decode(mix), decode(video)
    n = min(len(a), len(b))
    lags = [lag_at(a[:n], b[:n], int(n * f)) for f in (0.12, 0.45, 0.85)]
    integrated, lra, peak, moments = ebur128(video)
    dur = n / SR
    loudest = None
    if moments:
        k = int(np.argmax(moments))
        loudest = round((k + 1) / len(moments), 2)
    gates = {
        "sync": any(l is not None for l in lags) and all(l is None or abs(l) <= 48 for l in lags),
        "true_peak": peak <= -1.0,
        "loudness": abs(integrated - target) <= 1.0,
    }
    report = {"lags_samples": lags, "sync_measured": any(l is not None for l in lags), "true_peak_dbtp": peak, "integrated_lufs": integrated, "target_lufs": target,
              "lra_lu": lra, "loudest_at": loudest, "duration_s": round(dur, 3), "gates": gates}
    print(json.dumps(report, indent=2))
    if dur >= 20 and lra < 5:
        print("warning: LRA under 5 LU on a film of 20 s or more: it will sound flat (thin a section, silence before the drop)")
    if loudest is not None and loudest > 0.85 and dur > 8:
        print("warning: the loudest moment is in the last 15%: the ending should subtract, the payoff should be loudest")
    sys.exit(0 if all(gates.values()) else 1)


if __name__ == "__main__":
    main()
