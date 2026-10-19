"""Put the soft footsteps + landing on a word-fold timeline, synced to the rig.

usage: python3 sfx_steps.py <project-dir> <timeline-id> word-fold/<word>.html

Reads FOLD_INFO from the page (engine-derived reference-frame cue schedule) and writes an
'SFX · steps' audio track into <project>/timelines/<timeline-id>.json: one step per
authored cue (step-1 / step-2 alternating, vol .42) and one early land accent
(vol .5), not final-stroke completion. I keeps the source profile without a
separate last-step sound. Also sets the timeline length to the page's duration.
Sounds are expected in <project>/assets/sfx/fold/ (init_word.py copies them).
Read the installed CoAnimator docs/timeline.md before editing timeline JSON.
[word-fold, scripts/sfx_steps.py; assets/kit/fold.js]
https://docs.python.org/3/library/tempfile.html#tempfile.TemporaryDirectory
"""
import sys, os, json, subprocess, tempfile, math

HERE = os.path.dirname(os.path.abspath(__file__))
proj, tid, rel = os.path.abspath(sys.argv[1]), sys.argv[2], sys.argv[3]
if not tid or tid != os.path.basename(tid) or tid in (".", ".."):
    sys.exit("word-fold: use a timeline id, not a path.")
with tempfile.TemporaryDirectory() as capture_dir:
    out = subprocess.run(["node", os.path.join(HERE, "capture.mjs"), os.path.join(proj, rel), capture_dir, "0.1"],
                         capture_output=True, text=True, check=True,
                         env={**os.environ, "W": "1920", "H": "1080",
                              "EVAL": "JSON.stringify(window.FOLD_INFO)"}).stdout
info = json.loads(json.loads(out.strip().splitlines()[0]))
keys = ("F0", "FPS", "SFX_STEPS", "SFX_LAND", "DUR")
if not all(k in info for k in keys):
    sys.exit("word-fold: project fold.js lacks cue metadata; update FOLD_INFO while retaining custom glyphs/endings.")
F0, fps, steps, land, dur = (info[k] for k in keys)
if (not isinstance(steps, list) or not all(isinstance(v, (int, float)) and math.isfinite(v)
                                        for v in [F0, fps, land, dur, *steps]) or fps <= 0 or dur <= 0):
    sys.exit("word-fold: engine cue metadata must contain finite frames and positive FPS/duration.")
ASSET = {"step-1": 0.16, "step-2": 0.18, "land": 0.30}
p = os.path.join(proj, "timelines", f"{tid}.json")
with open(p, encoding="utf-8") as f:
    d = json.load(f)
clips = []
for i, f in enumerate(steps):
    a = "step-1" if i % 2 == 0 else "step-2"
    clips.append({"id": f"{tid[:12]}-step-{i+1:02d}", "name": f"step {i+1}", "src": f"assets/sfx/fold/{a}.wav",
                  "startTime": round((f - F0) / fps, 4), "duration": ASSET[a], "sourceDuration": ASSET[a],
                  "volume": 0.42, "trimIn": 0})
clips.append({"id": f"{tid[:12]}-land", "name": "land", "src": "assets/sfx/fold/land.wav",
              "startTime": round((land - F0) / fps, 4), "duration": ASSET["land"], "sourceDuration": ASSET["land"],
              "volume": 0.5, "trimIn": 0})
clips.sort(key=lambda c: c["startTime"])
for a, b in zip(clips, clips[1:]):
    if a["startTime"] + a["duration"] > b["startTime"] - 0.02:
        a["duration"] = round(b["startTime"] - 0.02 - a["startTime"], 4)
if any(c["duration"] <= 0 or c["startTime"] < 0 or c["startTime"] + c["duration"] > dur for c in clips):
    sys.exit("word-fold: cue schedule produces invalid clip intervals; inspect rig timing before writing.")
retained = [t for t in d["tracks"] if t["id"] != "track-sfx-steps"]
existing_ids = {c["id"] for t in retained for c in t.get("clips", [])}
if any(c["id"] in existing_ids for c in clips):
    sys.exit("word-fold: generated clip ids collide with another track; timeline unchanged.")
d["duration"] = d["animationDuration"] = dur; d["animationStart"] = 0
track = {"id": "track-sfx-steps", "name": "SFX · steps", "type": "audio", "color": "#7C3AED",
         "clips": clips, "muted": False, "volume": 1}
d["tracks"] = retained + [track]
# [word-fold, references/coanimator.md] Close the sibling temporary file before rename.
tmp = p + f".{os.getpid()}.tmp"
owned_tmp = False
try:
    with open(tmp, "x", encoding="utf-8") as f:
        owned_tmp = True
        json.dump(d, f, indent=2)
    os.replace(tmp, p)
finally:
    if owned_tmp and os.path.exists(tmp):
        os.unlink(tmp)
print(tid, "length", dur, "s · steps", len(steps), "· land", round((land - F0) / fps, 2), "s")
