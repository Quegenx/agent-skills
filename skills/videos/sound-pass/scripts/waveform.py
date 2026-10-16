"""A picture of the sound with the picture's events drawn on it, for an agent that can't listen.

  python3 scripts/waveform.py                      audio/mix.wav -> out/qa/wave.png
  python3 scripts/waveform.py out/16x9.mp4         the delivered file instead

Draws the waveform 1800 px wide with a 1 s grid, every cue from out/cues.json as a coral line and every beat
from audio/beats.json as a faint blue line. Each transient should sit on a coral line or a hair after it; a hit
between lines means a hand-typed time or a stale mix. Needs only ffmpeg.
"""
import json
import os
import subprocess
import sys

W, H = 1800, 280
src = sys.argv[1] if len(sys.argv) > 1 else "audio/mix.wav"
if not os.path.isfile(src):
    sys.exit(f"waveform: {src} not found (mix first: uv run scripts/mix_audio.py)")
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src],
                           capture_output=True, text=True, check=True).stdout)
cues = []
if os.path.isfile("out/cues.json"):
    cues = sorted({round(c["t"], 3) for c in json.load(open("out/cues.json")).get("cues", []) if "t" in c})
beats = json.load(open("audio/beats.json")).get("beats", []) if os.path.isfile("audio/beats.json") else []
x = lambda t: max(0, min(W - 2, round(t / dur * W)))
marks = [f"drawbox=x={x(t)}:y=0:w=1:h=ih:color=0x5B8CFF@0.35:t=fill" for t in beats]
marks += [f"drawbox=x={x(t)}:y=0:w=2:h=ih:color=0xD97757@0.9:t=fill" for t in cues]
os.makedirs("out/qa", exist_ok=True)
out = "out/qa/wave.png"
chain = f"color=c=0x141413:s={W}x{H}:d=1[bg];[0:a]aformat=channel_layouts=mono,showwavespic=s={W}x{H}:scale=sqrt:colors=0x8A877F[w];" \
        f"[bg][w]overlay=format=auto,drawgrid=w={W / dur:.3f}:h={H}:color=white@0.12" + ("," + ",".join(marks) if marks else "")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-filter_complex", chain, "-frames:v", "1", out], check=True)
print(f"wrote {out}: {dur:.2f} s, {len(cues)} cues (coral), {len(beats)} beats (blue), grid = 1 s")
