# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy"]
# ///
"""Mouth poses for a talking character, one per frame, from the voiceover itself. Run with uv from the film folder.

  uv run scripts/mouth.py                         audio/vo.wav -> audio/mouth.js
  uv run scripts/mouth.py audio/line.wav --fps 30 --lead 0.05 --out audio/mouth-b.js

Writes `window.MOUTH = {"fps": 60, "lead": 0.04, "poses": "0011223332110..."}`: one digit per frame, 0 closed,
1 soft (lips parted), 2 round ("oh"), 3 open ("eh/ah"). Load it with <script src="audio/mouth.js"></script> and read
`+MOUTH.poses[Math.round(t * MOUTH.fps)]` in seek(t): the mouth stays a pure function of time.

The envelope is the one talking-avatar tuned for live voice chat: fast
attack, slow decay, normalised against a rolling peak, a new pose at most every ~96 ms, never jumping more than one
pose at a time during ordinary updates; 0.17 s of silence closes directly, bypassing both constraints. Offline we can also look ahead: --lead shifts the poses earlier, because
a mouth that opens a frame or two before the sound reads as speaking it (animators lead the mouth); 0 disables it.
The levels are measured from the waveform, not the words: a breath or a loud consonant opens the mouth too.
"""
import os
import subprocess
import sys

import numpy as np

SR = 16000
POSES = ("closed", "soft", "round", "open")


def arg(name, default=None):
    a = sys.argv[1:]
    return a[a.index(name) + 1] if name in a else default


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def mouth_poses(y, fps, lead):
    """One pose index per frame. Coefficients are per 1/60 s in talking-avatar; rescaled here for any fps."""
    per = 60 / fps
    attack, decay, peak_decay = 1 - (1 - 0.38) ** per, 1 - (1 - 0.12) ** per, 0.997 ** per
    win = int(SR * 0.032)                       # ~ the 256-sample analyser window at 48 kHz, plus a margin
    n = int(np.ceil(len(y) / SR * fps)) + 1
    env, peak, level_acc, silent = 0.0, 0.035, 0.0, 0.0
    cur, next_update, out = 0, 0.0, []
    for f in range(n):
        t = f / fps + lead                      # look ahead by `lead`: the mouth leads the sound
        c = int(t * SR)
        seg = y[max(0, c - win // 2): max(0, c + win // 2)]
        rms = float(np.sqrt(np.mean(seg * seg))) if len(seg) else 0.0
        env += (rms - env) * (attack if rms >= env else decay)
        peak = max(env, peak * peak_decay, 0.035)
        level = min(1.0, max(0.0, (env - 0.012) / max(peak - 0.012, 0.025)))
        level_acc = max(level_acc, level)
        silent = silent + 1 / fps if rms < 0.013 else 0.0
        if silent >= 0.17:                      # a decisive stop after silence: straight to closed
            cur, level_acc = 0, 0.0
        elif f / fps >= next_update:            # a new visible pose at most every ~96 ms
            target = 0 if silent >= 0.12 else 0 if level_acc < 0.12 else 1 if level_acc < 0.40 else 2 if level_acc < 0.78 else 3
            cur += (target > cur) - (target < cur)   # one adjacent step: closed -> soft -> round -> open
            level_acc, next_update = 0.0, f / fps + 0.096
        out.append(cur)
    return out


def main():
    src = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else "audio/vo.wav"
    if not os.path.isfile(src):
        sys.exit(f"mouth: {src} not found (generate the voiceover first: uv run scripts/tts.py)")
    fps, lead = float(arg("--fps", 60)), float(arg("--lead", 0.04))
    out = arg("--out", "audio/mouth.js")
    poses = mouth_poses(load(src), fps, lead)
    with open(out, "w") as f:
        f.write('window.MOUTH = {"fps": %g, "lead": %g, "poses": "%s"}\n' % (fps, lead, "".join(map(str, poses))))
    share = ", ".join(f"{POSES[k]} {poses.count(k) / len(poses):.0%}" for k in range(4))
    print(f"wrote {out}: {len(poses)} frames at {fps:g} fps, lead {lead:g} s ({share})")


if __name__ == "__main__":
    main()
