---
name: beat-grid
description: "Measures or chooses a video's music and writes audio/beats.json, the clock that picture and sound follow. Use when a video has music, cuts to a beat, or its sound and picture drift."
---

# Beat grid

Sound is a timeline input, not a file dropped under the video at the end. One clock, `audio/beats.json`, drives the picture (states change on beats) and the sound (hits land on the same timestamps). When both read the same file they cannot drift.

Copy `scripts/analyze_audio.py` from this skill's folder into the film's `scripts/`. It needs only ffmpeg and numpy; run it with `uv run`, which installs numpy for that run.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

## Pick the source

| Situation | Do |
|---|---|
| The user supplied a track | Use it unchanged. Measure it. |
| They want music but have none | Search free-for-commercial-use libraries (Mixkit's music is free for commercial use; check the licence page of anything else). Download 5-10 candidates into `audio/candidates/`, `scan` them, and pick by tempo, energy and a clear downbeat. Record the source and licence in `brief.md`. |
| Synthesized sound only | Choose a tempo: 120 BPM gives exactly 30 frames per beat at 60 fps (100 → 36, 150 → 24). Set `FILM.bpm` and skip measurement; the sound-pass bed follows it. |
| Narration drives the film | Call the Skill tool with "voiceover": word timestamps are the clock, and music sits under them. |

Never fetch or use music the brief can't license.

## Measure

```bash
uv run scripts/analyze_audio.py scan audio/candidates/*.mp3          # tempo + confidence per file
uv run scripts/analyze_audio.py grid audio/song.mp3 --bars 8          # loudest, steadiest 8 bars
uv run scripts/analyze_audio.py grid audio/song.mp3 --bars 8 --start 41.2   # pin the section (e.g. start before the drop)
uv run scripts/analyze_audio.py grid audio/song.mp3 --bars 8 --bpm 128      # when scan locks onto half or double time
uv run scripts/analyze_audio.py grid audio/song.mp3 --bars 8 --drop-at 0.4  # window placed so the drop lands ~40% in, on a bar line
```

`grid` fits tempo and phase across the whole song, chooses a section that starts on a downbeat (skipping quiet intros unless `--start` pins one), refines on that section, and writes:

```json
{ "source": "audio/song.mp3", "bpm": 123.46, "beat": 0.48598, "bars": 8,
  "start": 26.336, "duration": 15.551, "beats": [0, 0.486, ...], "downbeats": [0, 1.944, ...] }
```

`start` is where the film's frame 0 sits in the song. `beats` are relative to frame 0. Tested on a synthetic track: start within 1 ms, drift under 2 ms over 8 bars.

## Use it

- The page never hardcodes the tempo: `render.mjs` and `smoke.mjs` read `beats.json` and call `configure({ beat })`, and the film derives everything from `B`. Write states and cues in beats (`beat(4)`), so a re-measure retimes the whole film.
- Size the film to whole bars: `FILM.beats = bars * 4`.
- **Conform a track to a tempo** when the grid should be exact (120 BPM is 30 frames a beat at 60 fps): `ffmpeg -i song.mp3 -af "atempo=120/123.46" song-120.wav` (pitch is preserved), then measure the conformed file again.
- **Calibrate to the real kicks.** If a beat sheet shows states landing early or late against the music, check the grid with `grid --start` on a known downbeat before moving any picture.
- Big changes on downbeats, state changes on beats, small hits on eighths. A drop is the hero moment's slot. For a launch, cut the song so a short silence or riser precedes the hero hit.
- `drop` prints energy per bar and the three likeliest drops, each on a downbeat. Anchor the hero moment there, then pin the section with `grid --start` so the film reaches the drop on the beat you planned (for example, start the song 12 beats before its drop). Tested: it found the synthetic track's drop within 3 ms.
- **Cut the song on its bars** when one contiguous window doesn't fit the film (a slow intro, the drop too far in): `uv run scripts/analyze_audio.py edit audio/song.mp3 --keep 0:4,16:24,40:42` keeps bars 0-3, 16-23 and 40-41 (numbers as `drop` prints them; the end bar is excluded) and splices them back to back into `audio/edit.wav`, with a 5 ms fade at each join and `--fade-out 1.2` s at the end. It writes `audio/beats.json` with `start` 0 and the edit as its source, so the film's grid runs straight through every join and the mixer picks the edit up. Read `drop` and `map` first: open on a sparse bar, put the busy scenes on the full groove, the hero on the drop, the close where the bass falls away. Listen to every join once. Tested on a synthetic 120 BPM track cut 0:2,8:10: 8.000 s, and every kick within 1 ms of its beat on both sides of the join.
- **Supplied photos and clips on the beat**: the music's pacing decides the treatment. On a driving section, a new clip on each strong beat with the hero clip on a downbeat or the drop; on a calm section, where the beat grid is unreliable, one clip held with a slow push (scale about 1 to 1.08 plus a small drift) and crossfades at the section edges, never per-beat hard cuts; a clip behind words is dimmed 30-50% so the type reads. Supplied clips play muted; the track owns the sound unless a clip's own audio is the point, and then the music ducks under it.
- `peak` reports where a sound file's peak sits, for placing a sampled SFX by its peak instead of its start.

## Visuals that follow the music

For a music video or visualizer, beats are not enough: the picture should breathe with the bass and flicker with the hats. `bands` writes a per-frame table, so the film stays a pure function of time:

```bash
uv run scripts/analyze_audio.py bands audio/song.mp3          # -> audio/bands.js, aligned to beats.json's start
```

```html
<script src="audio/bands.js"></script>   <!-- window.BANDS = { fps, start, frames, low, mid, high, onset } -->
<script>
const band = (name, t) => { const a = BANDS[name], x = clamp(t * BANDS.fps, 0, a.length - 1), i = Math.floor(x)
  return lerp(a[i], a[Math.min(i + 1, a.length - 1)], x - i) }   // 0..1, fast attack, ~120 ms release
</script>
```

The music gives timing and intensity; the picture still comes from the story. Unless the brief asks for one (an audiogram, a visualizer), never the medium's clichés: equalizer bars, spectrum analysers, waveforms, note clip art, generic particles, rainbow cycling, strobing white on beats, pulsing orbs; instead let the bass make the piece's own warmth swell and the highs sharpen its own contrast. Drive a few things from it, not everything: scale or glow from `low`, fine detail and particles from `high`, a cut or flash only where `onset` peaks on a beat. Keep the big structure (sections, cuts) on the beat grid; bands add texture inside it. Tested: a synthetic kick reads 1.0 on its frame and decays to ~0.1 within 0.4 s; a high-passed noise bed reads 0 before it enters and ~1 after.

**The music map: how the music moves, not just when.** `uv run scripts/analyze_audio.py map audio/song.mp3` writes `audio/map.json` over the film's window: an energy tier 1-5 per bar, the band that leads each bar (bass, mid or high, from where its energy sits), and sections with their attack (sharp, medium, soft, in ms) and sustain (staccato, held, sustained), each printed with the motion it asks for. Sharp and staccato want snaps and tight settles; a swell wants long ramps with no overshoot; bass-led bars want mass, bright ones small accents; the loudest tier is where the hero devices go (seek-engine's `MOTION-NUMBERS.md`, "The sound's shape is the move's shape"). Check the sections by ear or against the waveform: is the loudest section really the drop? Tested on a synthesized track (a soft pad, then kicks and hats): the pad read as a mid-led swell with no hits, the kick section as bass-led, sharp (~9 ms) and staccato, with the hero devices in its loudest bars.

## Lyrics, word by word

A lyric video needs each word's time in the song, not just the beats. Separate the vocal, transcribe it with word timestamps, then correct the words against the real lyrics (never against the transcript) and keep the times:

```bash
uvx demucs --two-stems vocals audio/song.mp3                     # -> separated/htdemucs/song/vocals.wav
uvx --from openai-whisper whisper separated/htdemucs/song/vocals.wav --model small \
    --word_timestamps True --output_format json --output_dir audio/
```

Both download models on first use (hundreds of MB): say so first. Subtract `beats.json`'s `start` from every time so frame 0 is 0, write the corrected lines to `audio/lyrics.json` (`[{ "t": 12.48, "end": 12.9, "word": "never" }]`), and check a strip at every line start: a word must not appear before it is sung. Lines go huge on the hook and sit like subtitles elsewhere (call the Skill tool with "shotlist").

## Check

After any change to the grid or the track, render the beat sheet (`node scripts/render.mjs beats`) and confirm each tile shows a settled state, and that the sound pass lands transients on beat lines (call the Skill tool with "sound-pass").
