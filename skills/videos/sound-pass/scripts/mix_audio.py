# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy"]
# ///
"""Synthesize the film's sound effects, place each by its measured peak on its cue, mix over the music
(and voiceover), then master to -14 LUFS. Run with uv from the film folder, after render.mjs has written
out/cues.json (every render mode writes it).

  uv run scripts/mix_audio.py                     song from audio/beats.json (trimmed at its `start`)
  uv run scripts/mix_audio.py --song audio/x.mp3 --start 12.3
  uv run scripts/mix_audio.py --bed C             no track: synthesize a soft chord bed in a key (C, D, Eb, ...)
  uv run scripts/mix_audio.py --song audio/bed.wav --music-at 2.0   effects alone first, the music lands on the first cut
  uv run scripts/mix_audio.py --list              the sound kinds a cue can name

Supplied sounds: a licensed file at audio/samples/<kind>.wav (or .mp3) becomes a cue kind, or replaces the
synthesized one of the same name. Its peak is measured like every other sound, so it lands on its cue, and it is
levelled on load: peak-normalised to the synthesized sound it replaces (0.5 for a new kind), because a quiet field
recording 20 dB under the mix stays inaudible at any weight (a weight only scales what the file has).

Cues come from window.timeline().cues: [{"t": seconds, "kind": "click", "weight": 1, "pan": 0, "step": 3}, ...].
- weight (or gain) scales a sound to its cause: a caret tick ~0.3, a normal event 1, the hero landing 1.5-2.
- pan follows screen x, but effects stay dry and near the centre (scaled into +-0.15); only whoosh and rise go wide.
- step (pop, tick): a progress motif. Step k plays scale degree k of --key (default C major), so a run of steps
  climbs and the ear hears "closer" before the eye counts. Resolve on the payoff with a success.
- key cues are thinned like a real typist: never two within 60 ms, at most ~12 per second.
- pitch (a multiplier) varies repeats; 0.9-1.3 on typing and pops so they never sound pasted.
- dist (metres from the camera) makes a sound part of a scene, not the interface: it arrives late (sound travels
  343 m/s, so a gun 1 km away is heard 2.9 s after its flash), loses its highs with distance (air absorption),
  falls off in level, and takes its full pan (+-0.9) from where it sits relative to the camera.
audio/vo.wav (from the voiceover skill) is mixed in when it exists, and the music ducks under it only in the
speech band. Writes audio/sfx/*.wav, audio/mix.wav (mastered) and prints the measured loudness.
"""
import json
import os
import subprocess
import sys
import wave

import numpy as np

SR = 48000
ROOT = os.getcwd()
rng = np.random.default_rng(7)  # seeded: the same film always gets the same sound


def t_axis(dur):
    return np.arange(int(SR * dur)) / SR


def env(t, attack, decay):
    a = np.clip(t / attack, 0, 1) if attack > 0 else np.ones_like(t)
    return a * np.exp(-np.maximum(0, t - attack) / decay)


def band(x, lo=None, hi=None):
    """Brick-wall band filter in the frequency domain (fine for short sounds and offline mixing)."""
    X = np.fft.rfft(x, axis=0)
    f = np.fft.rfftfreq(x.shape[0], 1 / SR)
    keep = np.ones_like(f, dtype=bool)
    if lo:
        keep &= f >= lo
    if hi:
        keep &= f <= hi
    X[~keep] = 0
    return np.fft.irfft(X, n=x.shape[0], axis=0)


def norm(x, peak):
    return x / (np.abs(x).max() + 1e-9) * peak


def click(freq=2100, dur=0.05, body=0.012, peak=0.5):
    t = t_axis(dur)
    noise = band(rng.standard_normal(len(t)), lo=3000) * env(t, 0.0004, 0.0025)
    return norm(noise * 0.6 + np.sin(2 * np.pi * freq * t) * env(t, 0.0008, body), peak)


def sounds():
    """Every kind a cue can name. One line each: what it is for."""
    s = {}
    s["click"] = (click(2100, peak=0.42), "a cursor click or button press")
    s["key"] = (click(3200, dur=0.035, body=0.006, peak=0.2), "one keystroke while typing")
    t = t_axis(0.08)
    s["tick"] = (norm(np.sin(2 * np.pi * 2900 * t) * env(t, 0.0006, 0.012) + click(4200, dur=0.08, body=0.004, peak=0.3), 0.2), "a small item landing, a counter step, a star filling")
    s["press"] = (click(1500, body=0.008, peak=0.22), "the start of a drag")
    s["release"] = (click(2500, body=0.006, peak=0.18), "the end of a drag")
    t = t_axis(0.09)
    thunk = np.sin(2 * np.pi * (700 + 500 * np.exp(-t / 0.01)) * t) * env(t, 0.001, 0.02)
    s["toggle"] = (norm(thunk + click(2600, dur=0.09, peak=0.5), 0.45), "a switch flipping")
    t = t_axis(0.12)
    f = 380 + 700 * (1 - np.exp(-t / 0.02))
    s["pop"] = (norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(t, 0.004, 0.03), 0.3), "a badge, chip or bubble popping in")
    t = t_axis(0.6)
    t2 = np.maximum(0, t - 0.075)
    n1 = np.sin(2 * np.pi * 1318.5 * t) * env(t, 0.002, 0.12)
    n2 = np.sin(2 * np.pi * 1975.5 * t2) * env(t2, 0.002, 0.18) * (t >= 0.075)
    s["success"] = (norm(n1 + n2 * 0.9, 0.26), "a task completing: a check, a sent message")
    t = t_axis(0.26)
    sw = band(rng.standard_normal(len(t)), lo=900, hi=4500) * np.sin(np.pi * np.clip(t / 0.26, 0, 1)) ** 2
    s["swish"] = (norm(sw, 0.07), "a container morphing between states (quiet)")
    t = t_axis(0.55)
    wh = band(rng.standard_normal(len(t)), lo=300, hi=3000) * np.sin(np.pi * np.clip(t / 0.55, 0, 1)) ** 3
    s["whoosh"] = (norm(wh, 0.22), "a camera-scale move or a logo zoom (about two per film)")
    rise = band(rng.standard_normal(int(SR * 0.9)), lo=500, hi=6000) * np.linspace(0, 1, int(SR * 0.9)) ** 3
    s["rise"] = (norm(rise, 0.18), "a reversed whoosh that peaks on the hit it leads into (fills a gap before a drop)")
    t = t_axis(0.7)
    s["impact"] = (norm(np.sin(2 * np.pi * (95 - 55 * t) * t) * env(t, 0.002, 0.16) + 0.3 * band(rng.standard_normal(len(t)), hi=900) * env(t, 0.001, 0.03), 0.8), "the hero hit (one per film)")
    # character and story sounds: for films with characters,
    # nature and action rather than an interface
    t = t_axis(0.04)
    s["step"] = (norm((np.sin(2 * np.pi * 900 * t) * 0.6 + rng.standard_normal(len(t)) * 0.3) * np.exp(-t * 140), 0.22), "a footfall: one every ~0.1 s of walking sells a small character")
    t = t_axis(0.28)
    s["thump"] = (norm(np.sin(np.cumsum(2 * np.pi * (50 + 90 * np.exp(-t * 30)) / SR)) * np.exp(-t * 12), 0.6), "a body landing, a heavy object set down")
    t = t_axis(0.18)
    s["crack"] = (norm(rng.standard_normal(len(t)) * np.exp(-t * 40) + np.sin(2 * np.pi * 180 * t) * np.exp(-t * 25) * 0.5, 0.55), "a hit's top end: pair with thump on every action contact")
    t = t_axis(0.9)
    s["sparkle"] = (norm(sum(np.sin(2 * np.pi * f * t) * np.exp(-np.maximum(t - k * 0.08, 0) * 6) * (t >= k * 0.08) for k, f in enumerate([2093, 2637, 3136, 4186])), 0.2), "magic, a reveal, something growing")
    t = t_axis(0.2)
    s["drip"] = (norm(np.sin(2 * np.pi * np.cumsum(600 + 900 * t / 0.2) / SR) * env(t, 0.005, 0.04), 0.3), "a water drop")
    t = t_axis(0.5)
    s["boing"] = (norm(np.sin(2 * np.pi * np.cumsum(220 + 60 * np.sin(t * 40) * (1 - t / 0.5)) / SR) * env(t, 0.01, 0.12), 0.35), "a bounce, a spring, a comic jump")
    t = t_axis(0.45)
    s["splash"] = (norm(band(rng.standard_normal(len(t)), lo=900, hi=4200) * np.exp(-t * 7) + np.sin(2 * np.pi * (500 + 700 * np.exp(-t * 20)) * t) * np.exp(-t * 18) * 0.3, 0.4), "something hitting water")
    t = t_axis(0.45)
    s["fall"] = (norm(np.sin(2 * np.pi * np.cumsum(1800 - 1300 * t / 0.45) / SR) * np.minimum(1, t / 0.45 * 8) * (1 - t / 0.45), 0.25), "a descending whistle: something falling")
    t = t_axis(1.2)
    s["chime"] = (norm(sum(np.sin(2 * np.pi * f * t) * np.exp(-np.maximum(t - k * 0.07, 0) * 3.5) * (t >= k * 0.07) for k, f in enumerate([1047, 1319, 1568, 2093])), 0.22), "an end card or a gentle resolve")
    t = t_axis(0.18)
    u = t / 0.18
    s["chirp"] = (norm(np.sin(2 * np.pi * np.cumsum(2600 + 1800 * np.sin(u * np.pi)) / SR) * np.sin(u * np.pi) * np.where((u < 0.45) | (u > 0.55), 1, 0.2), 0.2), "a small bird")
    return s


def write_wav(path, data):
    pcm = (np.clip(data, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1 if data.ndim == 1 else data.shape[1])
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def read_audio(path, start=0.0, dur=None):
    cmd = ["ffmpeg", "-v", "error", "-ss", f"{start:.5f}"] + (["-t", f"{dur:.5f}"] if dur else []) + ["-i", path, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"]
    raw = subprocess.run(cmd, check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)


def measured_peak(x):
    """Peak of the smoothed amplitude envelope: where the ear hears the hit."""
    k = int(SR * 0.002)
    return int(np.argmax(np.convolve(np.abs(x), np.ones(k) / k, mode="same")))


MAJOR = [0, 2, 4, 5, 7, 9, 11]


def pitched(kind_x, step, key):
    """Resample a pop or tick so its pitch climbs the major scale by `step` degrees from the key's tonic (around C6)."""
    semis = 12 * (step // 7) + MAJOR[step % 7] + NOTES[key]
    ratio = 2 ** (semis / 12)
    idx = np.arange(0, len(kind_x) - 1, ratio)
    return np.interp(idx, np.arange(len(kind_x)), kind_x)


def thin_keys(cues):
    """A real typist: never two key sounds within 60 ms, and runs faster than 12/s thinned to about 12/s."""
    out, last = [], -1.0
    for c in sorted(cues, key=lambda c: c["t"]):
        if c.get("kind") == "key":
            if c["t"] - last < max(0.06, 1 / 12):
                continue
            last = c["t"]
        out.append(c)
    return out


NOTES = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}


def chord_bed(key, n, beat):
    """A soft I-V-vi-IV pad, one chord per bar, so a film with no track still has a floor to master against."""
    root = 48 + NOTES[key]  # MIDI, C3 for C
    prog = [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]]
    bar = int(round(4 * beat * SR))
    out = np.zeros((n, 2))
    for i, start in enumerate(range(0, n, bar)):
        L = min(bar, n - start)
        t = np.arange(L) / SR
        shape = np.minimum(1, t / 0.4) * np.minimum(1, (L / SR - t) / 0.4)
        voice = sum(np.sin(2 * np.pi * 440 * 2 ** ((root + iv - 69) / 12) * t + k) for k, iv in enumerate(prog[i % 4]))
        out[start : start + L] += (voice * shape * 0.05)[:, None]
    return band(out, hi=2500)


def loudness(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    summary = r[r.rfind("Summary:"):]
    pick = lambda label: next((ln.split(":", 1)[1].strip() for ln in summary.splitlines() if ln.strip().startswith(label + ":")), "?")
    return pick("I"), pick("Peak"), pick("LRA")


def measure(path, target):
    probe = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", f"loudnorm=I={target}:TP=-2:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
    return json.loads(probe[probe.rfind("{"): probe.rfind("}") + 1])


def master(raw_path, out_path, target=-14.0, zero_tail=True):
    """Gain to the loudness target through a peak limiter, measured for at most six passes toward 0.3 LU, then lower the
    ceiling until the WAV's true peak sits at or under -2 dBTP. The AAC encode adds 0.5-1 dB of peak, so the delivered
    file must be re-measured against -1 dBTP; convergence is not guaranteed. A hit-heavy mix reaches loudness because the limiter shaves transients."""
    ceiling, gain = -3.0, 0.0
    for _ in range(6):
        src = out_path if gain else raw_path
        m = measure(src, target)
        miss = target - float(m["input_i"])
        tp = float(m["input_tp"]) if gain else None
        if gain and abs(miss) <= 0.3 and tp <= -2.0:
            break
        if tp is not None and tp > -2.0:
            ceiling -= tp + 2.0 + 0.2  # inter-sample peaks overshoot the sample limiter: pull the ceiling down
        gain += miss
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw_path, "-af",
                        f"volume={gain:.2f}dB,alimiter=limit={10 ** (ceiling / 20):.4f}:attack=2:release=80:level=false:latency=1",
                        "-ar", str(SR), out_path], check=True)
    # the limiter's tail can leave a few samples above zero: the delivered ending is digital silence
    data = read_audio(out_path)
    data[:int(SR * 0.003)] *= np.linspace(0, 1, int(SR * 0.003))[:, None]
    if zero_tail:
        data[-480:] = 0
    write_wav(out_path, data)


def band_rms(x):
    return np.sqrt(np.mean(x ** 2) + 1e-12)


def carve_under_voice(music, vo, vo_json, target_db):
    """Lower the music only in the speech band (300 Hz - 4 kHz), phrase by phrase, until the voice sits target_db
    above it there. Each phrase gets only the dip it needs, with a 0.3 s lead-in and a 0.5 s release."""
    n = len(music)
    mb, vb = band(music, lo=300, hi=4000), band(vo, lo=300, hi=4000)
    if os.path.exists(vo_json):
        phrases = [(ln["start"], ln["end"]) for ln in json.load(open(vo_json))["lines"]]
    else:  # no timings: treat every stretch of voice as one phrase
        k = int(SR * 0.08)
        loud = np.convolve(np.abs(vo).mean(axis=1), np.ones(k) / k, mode="same") > np.abs(vo).max() * 0.02
        edges = np.flatnonzero(np.diff(loud.astype(int)))
        phrases = [(a / SR, b / SR) for a, b in zip(edges[::2], edges[1::2])]
    gain = np.ones(n)
    print(f"voice over music in the speech band (target {target_db:.0f} dB):", flush=True)
    for a, b in phrases:
        i, j = int(a * SR), min(n, int(b * SR))
        if j - i < SR * 0.1:
            continue
        ratio = 20 * np.log10(band_rms(vb[i:j]) / band_rms(mb[i:j]))
        need = max(-12.0, min(0.0, ratio - target_db))  # never bury the music: past 12 dB the voice itself is the problem
        g = 10 ** (need / 20)
        lead, rel = int(SR * 0.3), int(SR * 0.5)
        ramp_in = np.linspace(1, g, lead)
        ramp_out = np.linspace(g, 1, rel)
        seg = np.concatenate([ramp_in, np.full(j - i, g), ramp_out])
        s0 = i - lead
        lo, hi = max(0, s0), min(n, s0 + len(seg))
        gain[lo:hi] = np.minimum(gain[lo:hi], seg[lo - s0: hi - s0])
        print(f"  {a:6.2f}-{b:6.2f}s  {ratio:5.1f} dB -> {ratio - need:5.1f} dB" + ("" if need == 0 else f"  (music -{-need:.1f} dB in band)")
              + ("  warning: still under target: the take is too quiet or too dull in the speech band" if ratio - need < target_db - 0.1 else ""), flush=True)
    return music - mb + mb * gain[:, None]


def dips(path, window=3.0, below=4.0):
    """Warn about stretches much quieter than the rest (a tail that sags, a section that drops out by accident)."""
    x = read_audio(path).mean(axis=1)
    w, hop = int(SR * window), SR
    db = np.array([20 * np.log10(band_rms(x[i: i + w])) for i in range(0, max(1, len(x) - w), hop)])
    if len(db) < 3:
        return
    med = np.median(db)
    for k, v in enumerate(db):
        if v < med - below:
            print(f"warning: {k:.0f}-{k + window:.0f}s is {med - v:.1f} dB under the median: make sure it is designed (a breakdown), not a sag", flush=True)


def arg(name, default=None):
    a = sys.argv[1:]
    return a[a.index(name) + 1] if name in a else default


def samples(kinds):
    """Load audio/samples/<kind>.(wav|mp3) as cue kinds, overriding synthesized ones with the same name."""
    d = os.path.join(ROOT, "audio/samples")
    if os.path.isdir(d):
        for f in sorted(os.listdir(d)):
            name, ext = os.path.splitext(f)
            if ext.lower() in (".wav", ".mp3", ".aif", ".aiff", ".flac", ".m4a"):
                x = read_audio(os.path.join(d, f)).mean(axis=1)
                if np.abs(x).max() < 1e-4:
                    print(f"warning: audio/samples/{f} is silent (peak under -80 dBFS): skipped", flush=True)
                    continue
                target = float(np.abs(kinds[name][0]).max()) if name in kinds else 0.5
                gain_db = 20 * np.log10(target / (np.abs(x).max() + 1e-9))
                if abs(gain_db) > 12:
                    print(f"note: audio/samples/{f} levelled {gain_db:+.1f} dB to match the kit", flush=True)
                kinds[name] = (norm(x, target), f"supplied: audio/samples/{f} (levelled {gain_db:+.1f} dB)")
    return kinds


def main():
    kinds = samples(sounds())
    if "--list" in sys.argv:
        for k, (_, what) in kinds.items():
            print(f"{k:8s} {what}")
        return
    cues_path = os.path.join(ROOT, "out/cues.json")
    if not os.path.isfile(cues_path):
        sys.exit("mix: no out/cues.json yet. Any render writes it: run `node scripts/render.mjs still 0` first.")
    tl = json.load(open(cues_path))
    dur, loop = tl["duration"], tl.get("loop", False)
    n = int(round(dur * SR))
    mix = np.zeros((n, 2))

    beats_path = os.path.join(ROOT, "audio/beats.json")
    beats = json.load(open(beats_path)) if os.path.exists(beats_path) else None
    song = arg("--song", beats["source"] if beats else None)
    if song:
        start = float(arg("--start", beats["start"] if beats else 0))
        music = read_audio(os.path.join(ROOT, song) if not os.path.isabs(song) else song, start, dur + 0.1)[:n]
        music = np.pad(music, ((0, n - len(music)), (0, 0)))
        fade = int(SR * 0.004)  # no click at either end
        music[:fade] *= np.linspace(0, 1, fade)[:, None]
        music[-fade:] *= np.linspace(1, 0, fade)[:, None]
        print(f"music {song} from {start:.3f}s, {dur:.3f}s", flush=True)
    elif arg("--bed"):
        music = chord_bed(arg("--bed"), n, tl["beat"])
        print(f"music: synthesized bed in {arg('--bed')}", flush=True)
    else:
        music = np.zeros((n, 2))
        print("music: none (pass --bed <key> or put a track in audio/beats.json)", flush=True)

    vo_path = os.path.join(ROOT, "audio/vo.wav")
    if os.path.exists(vo_path):
        vo = read_audio(vo_path)[:n]
        vo = np.pad(vo, ((0, n - len(vo)), (0, 0)))
        music = carve_under_voice(music, vo, os.path.join(ROOT, "audio/vo.json"), float(arg("--voice-over", 9)))
        mix += vo
    music_at = float(arg("--music-at", 0))
    if music_at > 0:  # a cold open on effects alone, then the music lands on the first cut and hits harder
        k = min(n, int(round(music_at * SR)))
        music = np.concatenate([np.zeros((k, 2)), music[: n - k]])
        fade = min(int(SR * 0.004), n - k)
        music[k:k + fade] *= np.linspace(0, 1, fade)[:, None]
    mix += music * 0.8

    os.makedirs(os.path.join(ROOT, "audio/sfx"), exist_ok=True)
    for name, (x, what) in kinds.items():
        if not what.startswith("supplied"):
            write_wav(os.path.join(ROOT, f"audio/sfx/{name}.wav"), x)
    key = arg("--key", arg("--bed") or "C")
    cue_list = thin_keys(tl.get("cues", []))
    for cue in cue_list:
        kind = cue.get("kind")
        if kind not in kinds:
            sys.exit(f"mix: unknown sound kind '{kind}' at {cue.get('t')}s. Kinds: {', '.join(kinds)}")
        x = kinds[kind][0]
        if "step" in cue and kind in ("pop", "tick"):
            x = pitched(x, int(cue["step"]), key)
        if cue.get("pitch", 1) != 1:  # a multiplier: vary repeats 0.9-1.3 so typing and pops never sound pasted
            x = np.interp(np.arange(0, len(x) - 1, float(cue["pitch"])), np.arange(len(x)), x)
        x = x * cue.get("weight", cue.get("gain", 1))
        delay, world = 0.0, "dist" in cue
        if world:
            d = max(1.0, float(cue["dist"]))
            x = band(x, hi=max(250.0, 16000.0 / (1 + d / 120))) / (1 + d / 60)
            delay = d / 343.0
        start = int(round((cue["t"] + delay) * SR)) - measured_peak(x)  # measure after pitch/world transforms; the peak sits on the cue
        idx = start + np.arange(len(x))
        if loop:
            idx %= n  # tails past the end wrap to the start, so the loop is seamless
        else:
            keep = (idx >= 0) & (idx < n)
            idx, x = idx[keep], x[keep]
        pan = max(-0.9, min(0.9, cue.get("pan", 0.0))) if world else max(-1.0, min(1.0, cue.get("pan", 0.0))) * (1 if kind in ("whoosh", "rise") else 0.15)
        mix[idx, 0] += x * (1 - pan)
        mix[idx, 1] += x * (1 + pan)
    print(f"placed {len(cue_list)} cues by measured peak ({len(tl.get('cues', [])) - len(cue_list)} key sounds thinned)", flush=True)
    edge = int(SR * 0.003)  # 3 ms from exact zero: sample 0 never clicks
    mix[:edge] *= np.linspace(0, 1, edge)[:, None]
    if not loop:  # the ending decays to digital silence
        tail = int(SR * 0.06)
        mix[-tail:] *= np.linspace(1, 0, tail)[:, None]
        mix[-480:] = 0

    raw = os.path.join(ROOT, "audio/.mix-raw.wav")
    peak = np.abs(mix).max()
    write_wav(raw, mix * (0.98 / peak) if peak > 0.98 else mix)
    out = os.path.join(ROOT, "audio/mix.wav")
    master(raw, out, float(arg("--lufs", -14)), zero_tail=not loop)
    os.remove(raw)
    i, tp, lra = loudness(out)
    print(f"wrote audio/mix.wav  integrated {i}  true peak {tp}  loudness range {lra}", flush=True)
    if dur >= 20 and lra != "?" and float(lra.split()[0]) < 5:
        print("warning: loudness range under 5 LU on a film of 20 s or more: thin a section before the turn, true silence before the drop", flush=True)
    dips(out)


if __name__ == "__main__":
    main()
