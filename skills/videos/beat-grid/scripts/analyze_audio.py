# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy"]
# ///
"""Beat-grid analysis with numpy only. Run with uv, from the film folder.

  uv run scripts/analyze_audio.py scan audio/candidates/*.mp3
      tempo and a confidence score per file: pick a track before you cut to it
  uv run scripts/analyze_audio.py grid audio/song.mp3 --bars 8 [--bpm 120] [--start 12.34 | --drop-at 0.4] [--out audio/beats.json]
      a beat grid for `bars` bars of 4/4: the loudest, steadiest section unless --start pins one, or --drop-at
      places the window so the song's biggest drop lands that far in (0.4: build, payoff, resolve)
  uv run scripts/analyze_audio.py drop audio/song.mp3
      energy per bar and the three likeliest drops, each on a downbeat: anchor the hero moment there
      (then `grid --start <drop - lead-in>` so the film reaches the drop on the beat you planned)
  uv run scripts/analyze_audio.py peak audio/sfx/click.wav
      where a sound's peak sits, so it can be placed by its peak instead of its start
  uv run scripts/analyze_audio.py bands audio/song.mp3 [--start 12.34] [--duration 16] [--fps 60] [--out audio/bands.js]
      per-frame energy (low < 150 Hz, mid to 2 kHz, high above) and onsets, 0..1, for audio-reactive visuals;
      --start/--duration default to audio/beats.json, so frame 0 of the table is frame 0 of the film
  uv run scripts/analyze_audio.py map audio/song.mp3 [--out audio/map.json]
      the music map of the film's window (audio/beats.json; the whole song without it): an energy tier 1-5 per bar,
      the band that leads (bass, mid, high), and sections with their attack (sharp, medium, soft) and sustain
      (staccato, held, sustained), each with the motion it asks for: the sound's shape is the move's shape
  uv run scripts/analyze_audio.py edit audio/song.mp3 --keep 0:4,16:24,40:42 [--bpm 120] [--fade-out 1.2] [--out audio/edit.wav]
      cut the song on its bar lines and splice the kept bars back to back (bar numbers as `drop` prints them,
      end bar excluded): a short intro, then straight to the drop. Each join gets a 5 ms fade; writes the edit
      and audio/beats.json with start 0, so the grid runs straight through every join

beats.json is the clock for picture and sound: render.mjs and smoke.mjs pass its `beat` to configure(),
and the mixer trims the song from its `start`.
"""
import json
import os
import subprocess
import sys

import numpy as np

SR = 22050
HOP = 256
N_FFT = 1024
# Spectral flux peaks while an onset sweeps through the Hann window's steepest rise, 3/4 of the way into the
# window: envelope index i describes time i*HOP/SR + LAG. Without this every beat reads ~35 ms early.
LAG = 0.75 * N_FFT / SR


def load(path: str, sr: int = SR) -> np.ndarray:
    if not os.path.isfile(path):
        sys.exit(f"analyze_audio: {path} not found")
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
        check=True,
        capture_output=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def onset_envelope(y: np.ndarray) -> np.ndarray:
    win = np.hanning(N_FFT).astype(np.float32)
    frames = 1 + (len(y) - N_FFT) // HOP
    idx = np.arange(N_FFT)[None, :] + HOP * np.arange(frames)[:, None]
    spec = np.abs(np.fft.rfft(y[idx] * win, axis=1))
    flux = np.maximum(0, np.diff(np.log1p(100 * spec), axis=0)).sum(axis=1)
    flux = np.concatenate([[0], flux])
    # remove the slow trend so the envelope is centred on transients
    k = int(SR / HOP * 0.5)
    env = np.maximum(0, flux - np.convolve(flux, np.ones(k) / k, mode="same"))
    return env / (env.max() + 1e-9)


def low_band_energy(y: np.ndarray) -> np.ndarray:
    """Per-frame energy below ~150 Hz, used to find kick drums (downbeats)."""
    n_fft = 2048
    win = np.hanning(n_fft).astype(np.float32)
    frames = 1 + (len(y) - n_fft) // HOP
    idx = np.arange(n_fft)[None, :] + HOP * np.arange(frames)[:, None]
    spec = np.abs(np.fft.rfft(y[idx] * win, axis=1))
    return spec[:, 1 : int(150 / (SR / n_fft))].sum(axis=1)


def estimate_bpm(env: np.ndarray, lo: float = 80, hi: float = 165) -> tuple[float, float]:
    fps = SR / HOP
    ac = np.correlate(env, env, mode="full")[len(env) - 1 :]
    ac /= ac[0] + 1e-9
    best, best_score = 0.0, -1.0
    for bpm in np.arange(lo, hi, 0.05):
        lag = 60 / bpm * fps
        score = 0.0
        for m in (1, 2, 4):  # score multiples of the beat period with linear interpolation
            i = int(lag * m)
            if i + 1 >= len(ac):
                break
            f = lag * m - i
            score += (ac[i] * (1 - f) + ac[i + 1] * f) / m
        if score > best_score:
            best, best_score = bpm, score
    return float(best), float(best_score)


def comb_score(env: np.ndarray, bpms: np.ndarray, t_from: float = 0.0, t_to: float | None = None, step: float = 0.001):
    """For each candidate tempo, the best phase of an ideal beat comb over [t_from, t_to]. Vectorised over phase."""
    fps = SR / HOP
    t_to = len(env) / fps - 1 if t_to is None else t_to
    best = (-1.0, 0.0, 0.0)  # score, bpm, phase (absolute seconds of a beat)
    for bpm in bpms:
        period = 60 / bpm
        phases = np.arange(0, period, step)
        ks = np.arange(int((t_to - t_from) / period))
        fr = (t_from + phases[:, None] + ks[None, :] * period - LAG) * fps
        i = fr.astype(int)
        ok = i + 1 < len(env)
        i = np.where(ok, i, 0)
        f = fr - i
        s = np.where(ok, env[i] * (1 - f) + env[np.minimum(i + 1, len(env) - 1)] * f, 0).sum(axis=1) / max(1, ok.sum(axis=1).max())
        j = int(np.argmax(s))
        if s[j] > best[0]:
            best = (float(s[j]), float(bpm), float(t_from + phases[j]))
    return best


def scan(paths: list[str]) -> None:
    for p in paths:
        y = load(p)
        bpm, score = estimate_bpm(onset_envelope(y))
        print(f"{p}\tdur={len(y) / SR:6.1f}s\tbpm={bpm:6.2f}\tconfidence={score:.3f}", flush=True)


def grid(path: str, bars: int, out: str, bpm_hint: float | None, start_hint: float | None, drop_at: float | None = None) -> None:
    y = load(path)
    env = onset_envelope(y)
    coarse = bpm_hint or estimate_bpm(env)[0]
    # global fit: the autocorrelation tempo is ~0.5% off, which drifts ~100 ms over a song
    _, bpm, phase = comb_score(env, np.arange(coarse - 1.5, coarse + 1.5, 0.01))
    period = 60 / bpm
    if drop_at is not None and start_hint is None:
        # place the window so the song's biggest drop lands drop_at of the way in (0.4 reads well: build, payoff, resolve)
        # whole bars before it, so frame 0 stays a downbeat and the drop lands on a bar line
        gain, t_drop = drop_candidates(y)[0]
        lead = max(1, round(drop_at * bars))
        start_hint = max(0.0, t_drop - lead * 4 * period)
        print(f"drop at {t_drop:.2f}s (+{gain:.1f} dB): {lead} bars before it, so it lands at {lead / bars:.0%} of the clip", flush=True)
    fps = SR / HOP
    low = low_band_energy(y)
    low /= low.max() + 1e-9
    beats = np.arange(phase % period, len(y) / SR - period, period)
    beat_frames = np.round(beats * fps).astype(int)
    keep = beat_frames < len(low)
    beats, beat_frames = beats[keep], beat_frames[keep]
    n = bars * 4
    assert len(beats) > n + 1, f"song too short for {bars} bars at {bpm:.1f} BPM"
    kick = low[beat_frames]
    downbeat_offset = int(np.argmax([kick[o::4].mean() for o in range(4)]))  # which beat of 4 carries the kick
    if start_hint is not None:
        best_start = int(np.argmin(np.abs(beats - start_hint)))
    else:
        # the loudest, steadiest stretch of `bars` bars, starting on a downbeat (skips intros)
        rms = np.array([np.sqrt(np.mean(y[int(b * SR) : int((b + period) * SR)] ** 2)) for b in beats])
        best_start, best_score = downbeat_offset, -1.0
        for start in range(downbeat_offset, len(beats) - n - 1, 4):
            section = rms[start : start + n]
            score = section.min() * 0.6 + section.mean() * 0.4 + kick[start] * 0.2
            if score > best_score:
                best_start, best_score = start, score
    # local refine on the chosen section only, for songs whose tempo wanders
    t0 = float(beats[best_start])
    _, bpm, start_t = comb_score(env, np.arange(bpm - 0.3, bpm + 0.3, 0.01), t0 - 0.02, t0 + (n + 0.5) * period, step=0.0005)
    if start_t > t0 + period / 2:  # the comb wrapped to the next beat
        start_t -= 60 / bpm
    period = 60 / bpm
    data = {
        "source": path,
        "bpm": round(float(bpm), 4),
        "beat": round(period, 6),
        "bars": bars,
        "start": round(start_t, 4),          # where the film's frame 0 sits in the song (a downbeat)
        "duration": round(n * period, 4),
        "beats": [round(k * period, 4) for k in range(n + 1)],  # beat times relative to frame 0
        "downbeats": [round(k * period, 4) for k in range(0, n + 1, 4)],
    }
    with open(out, "w") as f:
        json.dump(data, f, indent=2)
    print(f"bpm={bpm:.3f} beat={period:.4f}s start={start_t:.3f}s duration={n * period:.3f}s -> {out}", flush=True)


def song_bars(y: np.ndarray, bpm_hint: float | None = None):
    """(bpm, beat seconds, bar start times) over the whole song; a bar starts on the beat that carries the kick."""
    env = onset_envelope(y)
    coarse = bpm_hint or estimate_bpm(env)[0]
    _, bpm, phase = comb_score(env, np.arange(coarse - 1.5, coarse + 1.5, 0.01))
    period = 60 / bpm
    low = low_band_energy(y)
    beats = np.arange(phase % period, len(y) / SR - period, period)
    frames = np.round((beats + LAG) * SR / HOP).astype(int)
    keep = frames < len(low)
    beats, frames = beats[keep], frames[keep]
    offset = int(np.argmax([low[frames][o::4].mean() for o in range(4)]))  # the downbeat carries the kick
    return bpm, period, beats[offset::4]


def drop_candidates(y: np.ndarray):
    """[(gain dB over the two bars before, time s), ...] best first, each on a downbeat."""
    _, period, bars = song_bars(y)
    rms = np.array([np.sqrt(np.mean(y[int(b * SR): int((b + 4 * period) * SR)] ** 2)) for b in bars])
    db = 20 * np.log10(rms + 1e-9)
    return sorted([(float(db[i] - max(db[i - 2: i])), float(bars[i])) for i in range(2, len(bars))], reverse=True)


def drop(path: str) -> None:
    y = load(path)
    bpm, period, bars = song_bars(y)
    rms = np.array([np.sqrt(np.mean(y[int(b * SR): int((b + 4 * period) * SR)] ** 2)) for b in bars])
    db = 20 * np.log10(rms + 1e-9)
    print(f"bpm={bpm:.2f} bars={len(bars)}  energy per bar (dB): " + " ".join(f"{v:.0f}" for v in db), flush=True)
    # a drop: a bar much louder than the two before it, after a quieter stretch
    jumps = [(db[i] - max(db[i - 2: i]), i) for i in range(2, len(bars))]
    for gain, i in sorted(jumps, reverse=True)[:3]:
        print(f"drop candidate: bar {i} at {bars[i]:.3f}s  (+{gain:.1f} dB over the two bars before)", flush=True)


def edit(path: str, keep: str, out: str, bpm_hint: float | None, fade_out: float) -> None:
    """Splice whole bars of the song. Bars sit on one global tempo fit, so every join lands on a downbeat and the
    film's grid (start 0) runs through the joins unchanged. Stereo 48 kHz, 16-bit WAV."""
    bpm, period, bars = song_bars(load(path), bpm_hint)
    spans = []
    for part in keep.split(","):
        a, z = (int(v) for v in part.split(":"))
        if not 0 <= a < z <= len(bars) - 1:
            sys.exit(f"analyze_audio edit: bars {a}:{z} outside the song's 0:{len(bars) - 1}")
        spans.append((a, z))
    sr = 48000
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "2", "-ar", str(sr), "-f", "f32le", "-"],
                         check=True, capture_output=True).stdout
    song = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()
    bar_len = 4 * period
    ramp = np.linspace(0, 1, int(0.005 * sr), dtype=np.float32)[:, None]
    pieces = []
    for a, z in spans:
        piece = song[int(round(bars[a] * sr)): int(round((bars[a] + (z - a) * bar_len) * sr))].copy()
        if pieces:
            piece[: len(ramp)] *= ramp                  # 5 ms in and out at every join: no click
            pieces[-1][-len(ramp):] *= ramp[::-1]
        pieces.append(piece)
    film = np.concatenate(pieces)
    n_bars = sum(z - a for a, z in spans)
    film = film[: int(round(n_bars * bar_len * sr))]
    if fade_out > 0:
        k = min(len(film), int(fade_out * sr))
        film[-k:] *= (np.linspace(1, 0, k, dtype=np.float32) ** 2)[:, None]
    import wave
    with wave.open(out, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((np.clip(film, -1, 1) * 32767).astype(np.int16).tobytes())
    n = n_bars * 4
    data = {"source": out, "bpm": round(float(bpm), 4), "beat": round(period, 6), "bars": n_bars, "start": 0.0,
            "duration": round(n * period, 4), "beats": [round(k * period, 4) for k in range(n + 1)],
            "downbeats": [round(k * period, 4) for k in range(0, n + 1, 4)],
            "edit": {"from": path, "keep": [[a, z] for a, z in spans], "song_start": [round(float(bars[a]), 4) for a, _ in spans]}}
    beats_out = os.path.join(os.path.dirname(out) or ".", "beats.json")
    with open(beats_out, "w") as f:
        json.dump(data, f, indent=2)
    joins = ", ".join(f"bar {sum(z - a for a, z in spans[:i])}" for i in range(1, len(spans)))
    print(f"{out}: {n_bars} bars at {bpm:.2f} BPM = {n * period:.3f}s from {len(spans)} pieces"
          f"{' (joins at ' + joins + ')' if joins else ''} -> {beats_out}", flush=True)


def peak(path: str) -> None:
    y = load(path, 48000)
    print(json.dumps({"path": path, "peak": float(np.argmax(np.abs(y)) / 48000), "dur": len(y) / 48000}))


def bands(path: str, start: float, duration: float | None, fps: float, out: str) -> None:
    """A table indexed by frame, so a visual that follows the music stays a pure function of time (seek reads
    BANDS.low[frame]). Fast attack, ~120 ms release, then scaled to the 95th percentile so peaks read as 1."""
    y = load(path)
    y = y[int(start * SR):]
    if duration:
        y = y[: int(duration * SR)]
    y = np.concatenate([y, np.zeros(N_FFT, dtype=np.float32)])
    env = onset_envelope(y)
    win = np.hanning(N_FFT).astype(np.float32)
    frames = 1 + (len(y) - N_FFT) // HOP
    idx = np.arange(N_FFT)[None, :] + HOP * np.arange(frames)[:, None]
    spec = np.abs(np.fft.rfft(y[idx] * win, axis=1)) ** 2
    hz = np.fft.rfftfreq(N_FFT, 1 / SR)
    raw = {"low": spec[:, (hz > 20) & (hz < 150)].sum(1), "mid": spec[:, (hz >= 150) & (hz < 2000)].sum(1),
           "high": spec[:, hz >= 2000].sum(1), "onset": env}
    n = int((len(y) - N_FFT) / SR * fps)
    t_out = np.arange(n) / fps
    release = np.exp(-1 / (0.12 * fps))
    table = {"fps": fps, "start": start, "frames": n}
    for name, v in raw.items():
        # band energy describes the window's centre; spectral flux peaks later in the window (see LAG)
        t_env = np.arange(len(v)) * HOP / SR + (LAG if name == "onset" else N_FFT / 2 / SR)
        v = np.interp(t_out, t_env, np.log1p(v / (np.median(v) + 1e-9)) if name != "onset" else v)
        sm = np.empty_like(v)
        acc = 0.0
        for i, x in enumerate(v):  # offline, so carried state is fine here: the page only reads the table
            acc = x if x > acc else acc * release + x * (1 - release)
            sm[i] = acc
        table[name] = [round(float(x), 3) for x in np.clip(sm / (np.percentile(sm, 95) + 1e-9), 0, 1)]
    with open(out, "w") as f:
        f.write("window.BANDS = " + json.dumps(table, separators=(",", ":")) + "\n")
    print(f"{n} frames at {fps:g} fps from {start:.3f}s -> {out}", flush=True)


def music_map(path: str, out: str) -> None:
    """How the music moves, bar by bar, so motion can take the same shape: a sharp attack wants a snap, a swell a
    long ramp; a bass-led bar weight, a bright one small accents; the tier sets density. Times are film seconds
    when audio/beats.json exists (bars from its grid), else song seconds with a detected grid."""
    y = load(path)
    try:
        b = json.load(open("audio/beats.json"))
        start, period, n_bars = float(b["start"]), float(b["beat"]), int(b["bars"])
    except (OSError, ValueError, KeyError):
        env = onset_envelope(y)
        _, bpm, phase = comb_score(env, np.arange(estimate_bpm(env)[0] - 1.5, estimate_bpm(env)[0] + 1.5, 0.01))
        period, start = 60 / bpm, phase % (60 / bpm)
        n_bars = int((len(y) / SR - start) // (4 * period))
    bar_len = 4 * period
    seg = y[int(start * SR): int((start + n_bars * bar_len) * SR)]
    hop = 64                                            # ~3 ms: fine enough to time an attack
    rms = np.sqrt(np.convolve(seg ** 2, np.ones(hop) / hop, mode="same")[::hop] + 1e-12)
    env = onset_envelope(seg)
    t_env = np.arange(len(env)) * HOP / SR + LAG
    win = np.hanning(N_FFT).astype(np.float32)
    nfr = 1 + (len(seg) - N_FFT) // HOP
    spec = np.abs(np.fft.rfft(seg[np.arange(N_FFT)[None, :] + HOP * np.arange(nfr)[:, None]] * win, axis=1)) ** 2
    hz = np.fft.rfftfreq(N_FFT, 1 / SR)
    # where the bar's energy sits: the power-weighted spectral centroid (a kick-led bar sits low even under hats)
    centroid = (spec * hz[None, :]).sum(1) / (spec.sum(1) + 1e-12)
    # onsets: local maxima of the flux that stand clear of their surroundings
    thr = 0.3 * np.percentile(env, 95)
    peaks = [i for i in range(2, len(env) - 2) if env[i] > thr and env[i] == env[i - 2: i + 3].max()
             and env[i] > 2 * env[max(0, i - 8): i + 9].mean()]
    bars = []
    for k in range(n_bars):
        a, z = k * bar_len, (k + 1) * bar_len
        r = rms[int(a * SR / hop): int(z * SR / hop)]
        fr = (t_env >= a) & (t_env < z)
        c = float(np.average(centroid[fr], weights=spec[fr].sum(1) + 1e-12)) if fr.any() else 1000.0
        bars.append({"bar": k, "t": round(a, 3), "db": float(20 * np.log10(np.sqrt(np.mean(r ** 2)) + 1e-9)),
                     "centroid_hz": round(c), "lead": "bass" if c < 200 else "high" if c > 2500 else "mid"})
    dbs = np.array([x["db"] for x in bars])
    qs = np.percentile(dbs, [20, 40, 60, 80])
    for x in bars:
        x["tier"] = int(1 + (x["db"] > qs).sum())
    # sections: the tier (averaged over two bars) moves by 1.5 or more, or the lead changes for two bars running
    cuts = [0]
    for k in range(2, n_bars - 1):
        if k - cuts[-1] < 2:
            continue
        before = np.mean([x["tier"] for x in bars[k - 2: k]])
        after = np.mean([x["tier"] for x in bars[k: k + 2]])
        lead_change = bars[k]["lead"] == bars[k + 1]["lead"] != bars[k - 1]["lead"]
        if abs(after - before) >= 1.5 or lead_change:
            cuts.append(k)
    cuts.append(n_bars)
    sections = []
    for a, z in zip(cuts, cuts[1:]):
        t0, t1 = a * bar_len, z * bar_len
        pk = [i for i in peaks if t0 <= t_env[i] < t1]
        atk, sus = [], []
        for i in pk:                                    # rise time of the amplitude into each onset, and its decay
            j = int(t_env[i] * SR / hop)
            lo, hi = max(0, j - int(0.15 * SR / hop)), min(len(rms), j + int(0.05 * SR / hop))
            if hi <= lo + 2:
                continue
            m = lo + int(np.argmax(rms[lo:hi]))
            base = rms[lo: m + 1]
            rise = m - (lo + int(np.nonzero(base >= 0.2 * rms[m])[0][0]))
            atk.append(rise * hop / SR * 1000)
            tail = rms[m: m + int(1.2 * SR / hop)]
            below = np.nonzero(tail < 0.5 * rms[m])[0]
            sus.append((below[0] if len(below) else len(tail)) * hop / SR * 1000)
        tiers = [x["tier"] for x in bars[a:z]]
        leads = [x["lead"] for x in bars[a:z]]
        lead = max(set(leads), key=leads.count)
        if atk:
            am, sm = float(np.median(atk)), float(np.median(sus))
            attack = "sharp" if am < 35 else "medium" if am < 90 else "soft"
            sustain = "staccato" if sm < 150 else "held" if sm < 400 else "sustained"
        else:
            am = sm = None
            attack, sustain = "none", "swell"
        tier = round(float(np.mean(tiers)), 1)
        move = {"sharp": "snaps and hits (a stiff spring or hitPulse on the onset)", "medium": "brisk eased moves",
                "soft": "long ramps with no overshoot", "none": "slow pushes and blooms, no hits"}[attack]
        move += {"staccato": ", tight settles, short holds", "held": ", normal settles",
                 "sustained": ", slow settles into idle life", "swell": ""}[sustain]
        move += {"bass": "; heavy: big masses, full-frame impacts", "mid": "; the words lead, support recedes",
                 "high": "; light: small accents, glints, ticks"}[lead]
        move += "; hero devices here" if tier >= 4.5 else "; holds and idle life" if tier <= 2 else ""
        sections.append({"bars": [a, z], "t": round(t0, 3), "tier": tier, "lead": lead, "attack": attack,
                         "attack_ms": None if am is None else round(am), "sustain": sustain,
                         "sustain_ms": None if sm is None else round(sm),
                         "onsets_per_s": round(len(pk) / (t1 - t0), 2), "motion": move})
    data = {"source": path, "start": round(start, 4), "beat": round(period, 6), "bars": n_bars,
            "tiers": "".join(str(x["tier"]) for x in bars),
            "per_bar": [{k: (round(v, 1) if k == "db" else v) for k, v in x.items()} for x in bars], "sections": sections}
    with open(out, "w") as f:
        json.dump(data, f, indent=2)
    print(f"{n_bars} bars, tiers per bar {data['tiers']} -> {out}", flush=True)
    for x in sections:
        ms = f" ~{x['attack_ms']} ms" if x["attack_ms"] is not None else ""
        print(f"  bars {x['bars'][0]}-{x['bars'][1]} at {x['t']:.2f}s  tier {x['tier']}  lead {x['lead']}  "
              f"attack {x['attack']}{ms}  sustain {x['sustain']}  -> {x['motion']}", flush=True)


def arg(args: list[str], name: str, default=None):
    return args[args.index(name) + 1] if name in args else default


if __name__ == "__main__":
    if len(sys.argv) < 3 or sys.argv[1] not in ("scan", "grid", "drop", "peak", "bands", "map", "edit"):
        print(__doc__)
        sys.exit(1)
    cmd, rest = sys.argv[1], sys.argv[2:]
    if cmd == "scan":
        scan(rest)
    elif cmd == "grid":
        bpm = arg(rest, "--bpm")
        start = arg(rest, "--start")
        dat = arg(rest, "--drop-at")
        grid(rest[0], int(arg(rest, "--bars", 8)), arg(rest, "--out", "audio/beats.json"),
             float(bpm) if bpm else None, float(start) if start else None, float(dat) if dat else None)
    elif cmd == "drop":
        drop(rest[0])
    elif cmd == "bands":
        try:
            b = json.load(open("audio/beats.json"))
        except (OSError, ValueError):
            b = {}
        dur = arg(rest, "--duration", b.get("duration"))
        bands(rest[0], float(arg(rest, "--start", b.get("start", 0))), float(dur) if dur else None,
              float(arg(rest, "--fps", 60)), arg(rest, "--out", "audio/bands.js"))
    elif cmd == "map":
        music_map(rest[0], arg(rest, "--out", "audio/map.json"))
    elif cmd == "edit":
        if "--keep" not in rest:
            sys.exit("analyze_audio edit: --keep a:b[,c:d...] is required (bar numbers as `drop` prints them)")
        bpm = arg(rest, "--bpm")
        edit(rest[0], arg(rest, "--keep"), arg(rest, "--out", "audio/edit.wav"), float(bpm) if bpm else None,
             float(arg(rest, "--fade-out", 1.2)))
    else:
        for p in rest:
            peak(p)
