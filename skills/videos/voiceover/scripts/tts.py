# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy"]
# ///
"""Voiceover with word timings, via ElevenLabs timestamp APIs (v4 Text to Dialogue by default). Run with uv from the film folder.

  uv run scripts/tts.py --voice <voice_id> [--model eleven_v4] [--max-pause 0.35] [--gap 0.25] [--speed 1.0]
  uv run scripts/tts.py --voice <voice_id> --takes 4 [--only hook,steps]
      prepare 4 cached take indexes per selected line in audio/vo/takes/, requesting only missing entries, then stop.
      Pick a winner per line with "take": k in the script and run again without --takes to assemble.

Reads audio/vo-script.json, one entry per line of narration:
  [{"id": "hook", "text": "What the captions show", "say": "optional spoken form", "gap": 0.4, "take": 0}, ...]
`say` is sent to the voice (pronunciation fixes, Hebrew nikud, spelled-out numbers). Clean `text` replaces
aligned caption words only when the word counts match; otherwise inspect the spoken forms in the captions.
Each line is cached in audio/vo/ by (say, voice, model, take): edit one line and only that
line is requested again. The key comes from ELEVENLABS_API_KEY in the environment or in .env.

Writes audio/vo.wav (the mixer picks it up and ducks the music under it), audio/vo.srt (subtitles from the word
times, carried by render.mjs as a selectable track) and audio/vo.json:
  {"duration": s, "lines": [{"id", "text", "start", "end", "words": [{"word", "start", "end"}]}]}
Picture reads vo.json for when every word lands: the audio is the clock.
"""
import base64
import hashlib
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

import numpy as np

SR = 48000
ROOT = os.getcwd()


def arg(name, default=None):
    a = sys.argv[1:]
    return a[a.index(name) + 1] if name in a else default


def api_key():
    if os.environ.get("ELEVENLABS_API_KEY"):
        return os.environ["ELEVENLABS_API_KEY"]
    env = os.path.join(ROOT, ".env")
    if os.path.exists(env):
        for line in open(env):
            if line.startswith("ELEVENLABS_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"')
    return None


def request(say, voice, model, key):
    if model == "eleven_v4":
        # Eleven v4 uses Text to Dialogue; retain Text to Speech for explicitly selected older models.
        # https://elevenlabs.io/docs/api-reference/text-to-dialogue/convert-with-timestamps
        if len(say) > 2000:
            sys.exit("tts: split Eleven v4 narration into lines of at most 2000 characters for reliable generation")
        url = "https://api.elevenlabs.io/v1/text-to-dialogue/with-timestamps?output_format=mp3_44100_128"
        body = json.dumps({"inputs": [{"text": say, "voice_id": voice}], "model_id": model}).encode()
    else:
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_128"
        body = json.dumps({"text": say, "model_id": model}).encode()
    req = urllib.request.Request(url, data=body, headers={"xi-api-key": key, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f"tts: ElevenLabs returned {e.code}: {e.read().decode()[:400]}")


def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def words_from(alignment):
    """Group the character alignment into words with start and end times."""
    chars = alignment["characters"]
    starts, ends = alignment["character_start_times_seconds"], alignment["character_end_times_seconds"]
    words, cur = [], None
    for c, s, e in zip(chars, starts, ends):
        if c.isspace():
            if cur:
                words.append(cur)
            cur = None
        elif cur is None:
            cur = {"word": c, "start": s, "end": e}
        else:
            cur["word"] += c
            cur["end"] = e
    if cur:
        words.append(cur)
    return words


def write_srt(timeline, path, max_chars=42):
    """Subtitles from the word times: each cue is one or two rows of at most max_chars, split at punctuation
    where possible, shown from its first word to its last. render.mjs carries it as a selectable track."""
    def ts(x):
        ms = int(round(x * 1000))
        return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"
    def breaks(words):
        return [k for k in range(1, len(words))
                if len(" ".join(words[:k])) <= max_chars and len(" ".join(words[k:])) <= max_chars]

    cues = []
    for ln in timeline:
        cur = []
        for w in ln["words"]:
            if len(w["word"]) > max_chars:
                raise ValueError(f"tts: subtitle word exceeds {max_chars} characters; revise the script")
            candidate = [x["word"] for x in cur + [w]]
            if cur and ((len(" ".join(candidate)) > max_chars and not breaks(candidate))
                        or (len(" ".join(x["word"] for x in cur)) > max_chars and cur[-1]["word"][-1:] in ".,;:!?")):
                cues.append(cur)
                cur = []
            cur.append(w)
        if cur:
            cues.append(cur)
    with open(path, "w", encoding="utf-8") as f:
        for i, c in enumerate(cues, 1):
            words = [x["word"] for x in c]
            text = " ".join(words)
            if len(text) > max_chars:  # break into two rows near the middle
                best = min(breaks(words), key=lambda k: abs(len(" ".join(words[:k])) - len(text) / 2))
                text = " ".join(words[:best]) + "\n" + " ".join(words[best:])
            f.write(f"{i}\n{ts(c[0]['start'])} --> {ts(c[-1]['end'])}\n{text}\n\n")


def main():
    script_path = os.path.join(ROOT, "audio/vo-script.json")
    if not os.path.exists(script_path):
        sys.exit("tts: write audio/vo-script.json first (see the docstring for its shape)")
    lines = json.load(open(script_path))
    voice, model = arg("--voice"), arg("--model", "eleven_v4")
    if not voice:
        sys.exit("tts: pass --voice <voice_id> (the user's cloned voice or a library voice)")
    max_pause, default_gap, speed = float(arg("--max-pause", 0.35)), float(arg("--gap", 0.25)), float(arg("--speed", 1.0))
    cache = os.path.join(ROOT, "audio/vo")
    os.makedirs(cache, exist_ok=True)

    key, requested = None, 0

    def fetch(line, take):
        """The cached take for a line, requesting it first if it is new. Take 0 is the default take."""
        nonlocal key, requested
        say = line.get("say", line["text"])
        h = hashlib.sha1(f"{say}|{voice}|{model}".encode() + (f"|take{take}".encode() if take else b"")).hexdigest()[:10]
        mp3, meta = os.path.join(cache, f"{line['id']}-{h}.mp3"), os.path.join(cache, f"{line['id']}-{h}.json")
        if not os.path.exists(meta):
            key = key or api_key()
            if not key:
                sys.exit("tts: ELEVENLABS_API_KEY is not set (environment or .env)")
            res = request(say, voice, model, key)
            open(mp3, "wb").write(base64.b64decode(res["audio_base64"]))
            json.dump(res.get("normalized_alignment") or res["alignment"], open(meta, "w"))
            requested += 1
        return mp3, meta

    if arg("--takes"):
        only = set(arg("--only").split(",")) if arg("--only") else None
        os.makedirs(os.path.join(cache, "takes"), exist_ok=True)
        for line in lines:
            if only and line["id"] not in only:
                continue
            for k in range(int(arg("--takes"))):
                mp3, _ = fetch(line, k)
                dst = os.path.join(cache, "takes", f"{line['id']}-take{k}.mp3")
                if os.path.lexists(dst):
                    os.remove(dst)
                os.symlink(os.path.relpath(mp3, os.path.dirname(dst)), dst)
        print(f"takes in audio/vo/takes/ ({requested} requested). Listen, set \"take\": k per line, then run without --takes.")
        return

    clips = []
    for line in lines:
        mp3, meta = fetch(line, int(line.get("take", 0)))
        audio, words = decode(mp3), words_from(json.load(open(meta)))
        if not words:
            sys.exit(f"tts: no words came back for line '{line['id']}'")
        # words separated by short pauses form one group; a longer pause between groups is cut to max_pause
        groups = [[words[0]]]
        for w in words[1:]:
            (groups[-1].append(w) if w["start"] - groups[-1][-1]["end"] <= max_pause else groups.append([w]))
        pieces, wt, t, half = [], [], 0.0, max_pause / 2
        for g in groups:
            a = max(0.0, g[0]["start"] - min(half, 0.03 if g is groups[0] else half))
            b = min(len(audio) / SR, g[-1]["end"] + (0.06 if g is groups[-1] else half))
            pieces.append(audio[int(a * SR): int(b * SR)])
            wt += [{"word": w["word"], "start": round(w["start"] - a + t, 3), "end": round(w["end"] - a + t, 3)} for w in g]
            t += len(pieces[-1]) / SR
        clip = np.concatenate(pieces)
        fade = int(SR * 0.005)
        clip[:fade] *= np.linspace(0, 1, fade)
        clip[-fade:] *= np.linspace(1, 0, fade)
        display = line["text"].split()
        if len(display) == len(wt):  # captions show the clean text, timed by the spoken words
            for d, w in zip(display, wt):
                w["word"] = d
        clips.append((line, clip, wt))

    # level each phrase 85% of the way toward the median phrase level; gain changes only happen in the pauses
    levels = [20 * np.log10(np.sqrt(np.mean(c ** 2)) + 1e-9) for _, c, _ in clips]
    median = float(np.median(levels))
    out, timeline = np.zeros(0), []
    for (line, clip, wt), lv in zip(clips, levels):
        clip = clip * 10 ** (0.85 * (median - lv) / 20)
        start = len(out) / SR
        timeline.append({"id": line["id"], "text": line["text"], "start": round(start, 3), "end": round(start + len(clip) / SR, 3),
                         "words": [{**w, "start": round(w["start"] + start, 3), "end": round(w["end"] + start, 3)} for w in wt]})
        out = np.concatenate([out, clip, np.zeros(int(SR * line.get("gap", default_gap)))])
    peak = np.abs(out).max()
    if peak > 0.98:
        out *= 0.98 / peak

    raw = os.path.join(ROOT, "audio/.vo-raw.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "1", "-i", "-", raw], input=out.tobytes(), check=True)
    tempo = [] if speed == 1.0 else ["-af", f"atempo={speed}"]
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, *tempo, "-ac", "2", "-ar", str(SR), os.path.join(ROOT, "audio/vo.wav")], check=True)
    os.remove(raw)
    scale = 1 / speed
    for ln in timeline:
        ln["start"], ln["end"] = round(ln["start"] * scale, 3), round(ln["end"] * scale, 3)
        for w in ln["words"]:
            w["start"], w["end"] = round(w["start"] * scale, 3), round(w["end"] * scale, 3)
    json.dump({"duration": round(len(out) / SR * scale, 3), "lines": timeline}, open(os.path.join(ROOT, "audio/vo.json"), "w"), indent=2, ensure_ascii=False)
    write_srt(timeline, os.path.join(ROOT, "audio/vo.srt"))
    print(f"wrote audio/vo.wav and audio/vo.json: {len(lines)} lines, {requested} requested, {len(lines) - requested} from cache, {len(out) / SR * scale:.2f} s")


if __name__ == "__main__":
    main()
