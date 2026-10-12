---
name: sound-pass
description: Sound design for code-made video - synthesized UI and motion sound effects placed by their measured peak on cues exported from the picture, mixed over the music and voiceover with the music carved under speech, mastered to -14 LUFS, then checked for sync. Use when adding, changing or checking sound effects, music beds, voiceover mixing, loudness or audio sync for any video.
---

# Sound pass

Most generated films look finished with the sound off. Turn it on and nothing is connected: the click lands after the button, the cut misses the beat, the logo arrives before the music resolves. Sound is the cheapest thing that makes a film feel produced, and every sound must be **caused** by something the viewer can see.

Copy `scripts/mix_audio.py` and `scripts/waveform.py` from this skill's folder into the film's `scripts/`. Run it once picture timing is locked.

## Cues come from the picture

The composition's `cues()` returns `[{ t, kind, weight?, pan?, step? }]`, computed from the same beat-based data that drives the animation (the template's `peakOf`, `settleOf` and `springReach` say exactly where each sound belongs), and `render.mjs` writes it to `out/cues.json` on every run. Never type a sync time by hand: hand-typed times land frames off, and drift the moment anything is retimed.

| On screen | kind | Note |
|---|---|---|
| cursor click, button press | click | |
| typing | key | one per character, word starts accented; the mixer thins keys closer than 60 ms |
| item lands, counter steps, star fills | tick | `step: k` climbs the scale across a sequence |
| drag starts / ends | press / release | |
| switch flips | toggle | |
| badge, chip, bubble pops in | pop | `step: k` for a progress motif |
| task completes, check draws | success | |
| container morphs between states | swish | quiet |
| camera-scale move, logo zoom | whoosh | about two per film |
| the gap before a drop or hit | rise | a reversed whoosh whose peak lands on the hit |
| the hero hit | impact | one per film |
| a footfall | step | one every ~0.1 s of walking sells a small character |
| a landing, a body hit | thump + crack | the pair on every action contact |
| magic, growth, a reveal | sparkle | |
| water | drip / splash | |
| a bounce, a comic jump | boing | |
| something falling | fall | a descending whistle |
| an end card, a gentle resolve | chime | |
| a small bird | chirp | |

`dist` (metres from the camera) makes a cue part of a 3D scene: delayed by the speed of sound, darker and quieter with distance, fully panned. `weight` scales a sound to its cause (a caret tick ~0.3, a normal event 1, the hero landing 1.5-2). `pan` is clamped to ±0.15 except whoosh and rise: effects stay near the centre. `uv run scripts/mix_audio.py --list` prints the kinds.

Where each sound goes, how many there should be, which palette fits the brand's personality, typing and click norms, the loudness arc and a table of slop to avoid: read [SOUND.md](SOUND.md) before writing cues. Accent, don't narrate: continuous motion (drift, scrolling, progress) gets no sound, and the music carries most cuts. But once a class of action is sounded, every instance of it is, at one level.

## Generated effects and music (ElevenLabs)

When the synthesized kit can't make a sound the film needs (a real material, an engine, a crowd) or there is no music, and the user has an ElevenLabs key: `python3 <this skill>/scripts/eleven_sound.py sfx --batch sfx.json` generates each effect from a prompt into `audio/samples/<id>.mp3`, trimmed and peak-normalised; an id that matches a cue kind replaces the synthesized one, a new id becomes a new kind. `eleven_sound.py music --prompt "<style>, <bpm> BPM" --ms <length>` generates a bed (`--dry-run` first shows the request without spending), reports when the file starts late or ends early, and `music-fit --duration <s> --loop-bars` loops whole bars with equal-power crossfades to the exact length; then measure it with beat-grid like any song. Every call spends the user's credits: ask first. The normaliser trims leading silence and re-encodes, which can leave a click or an empty file on a clip of a few milliseconds: listen to short hits, and prefer a longer clip with a hand-set `weight`. Tested without a key: the dry run, the clear no-key exit, normalisation, and a 33 s track fitted to 70 s that still measures 120 BPM.

## Mix

```bash
uv run scripts/mix_audio.py # music from audio/beats.json, trimmed at its start
uv run scripts/mix_audio.py --song audio/x.mp3 --start 12.3
uv run scripts/mix_audio.py --bed D # no track: a soft chord bed in D on the beat grid
uv run scripts/mix_audio.py --key A --lufs -16 # pitched steps in A major; -16 only for a short sting
uv run scripts/mix_audio.py --song audio/bed.wav --music-at 2 # a cold open on effects, the music lands on the first cut
```

It synthesizes every sound (seeded, so the same film always gets the same sound), places each one so its **measured peak** sits on the cue (where the ear hears the hit, not where the file starts), wraps tails across the seam for loops, mixes in `audio/vo.wav` when it exists and lowers the music only in the speech band (300 Hz to 4 kHz), phrase by phrase, until the voice sits 9 dB above it there (`--voice-over 12` for more), reporting each phrase's ratio, and masters `audio/mix.wav` to -14 LUFS, looping gain and limiter ceiling until the WAV peaks at or under -2 dBTP so the AAC encode stays under -1, then zeroes the first and last samples (non-loops end in digital silence). It reports the loudness range: a launch film of 20 s or more wants 5-8 LU. `render.mjs full` muxes it automatically.

A film that is mostly short hits over silence has no floor and comes out quiet and spiky; give it a bed or a track rather than forcing the level. The mix also warns about any 3 s stretch more than 4 dB under the median: a breakdown you designed is fine, a tail that sags is not. To fix a sag, raise that stretch with a gain ramp before mastering (for example `ffmpeg -i audio/mix.wav -af "volume=enable='gte(t,24)':volume=4dB"...`, or better, more level from the music or voice in that section), then remaster and measure again on the delivered MP4.

## When there is no music you may use

**Generated beds, nothing to license** (`scripts/music/`): `node <this skill>/scripts/music/ukulele.mjs audio/bed.wav --dur 30 --bpm 108 --end 29.4` (playful strums and a bell motif; `--quiet a-b` holds one soft chord under serious beats), `chiptune.mjs` (a game score with sections on absolute times: `--sections "level:0-13.5,boss:15-24,fanfare:24-26.6"`), `ambient.mjs` (pads, sparse bells and wind; bars that divide the loop, so a loop's audio loops too), `electronic.mjs` (a dark launch bed: pad drone, kick, offbeat hats, eighth-note bass, a riser into an impact; `--sections "intro:0-2,drive:2-7.5,riser:7.5-8.5,drop:8.5-14,halftime:14-18,outro:18-20" --root 45` with section times on the film's beat grid; after claude-remotion-skill's `gen-track.mjs`, MIT, `scripts/music/LICENSE-claude-remotion-skill.txt`). Then mix with `--song audio/bed.wav --start 0`. Tested: each renders a stereo WAV of the asked length; the electronic bed measures 120.03 BPM at `--bpm 120` and beat-grid locks onto its beats within 10 ms.


**A score composed on the film's clock** (cartoon scoring: every cue lands on the action it belongs to). Write the notes as events on the beat grid, `[{ "t": 2.0, "p": 0, "n": 62, "v": 90, "d": 0.45 },...]` (seconds, General MIDI program 0-127 or -1 for drums, MIDI note, velocity, duration; optional `pan` and `gain` per instrument), taking the times from `out/cues.json` and `audio/beats.json` so a retime moves the music with the picture. Then `swift <this skill>/scripts/gm_render.swift audio/score.json audio/score-raw.wav` renders it offline through macOS's built-in General MIDI instruments (sampled, nothing to download), and `mix_audio.py --song audio/score-raw.wav --start 0` mixes and masters it. Elsewhere, write the same notes to a MIDI file and render with `fluidsynth` and a General MIDI soundfont. Give the film a theme of 6-10 notes stated early and returned on the payoff, one key, hits on the frame of the drawing that shows the event, one dead stop where the picture cuts to black, and listen for a stretch with no cue: the mix's sag warning finds it. Tested: a four-bar piano, strings and drums score rendered to 48 kHz stereo with every onset within 4 ms of its beat.

**Recorded effects with a clean licence.** When a synthesized cue won't do, CC0 recordings are free to use with no credit: Kenney's UI Audio packs (kenney.nl), and freesound.org searched with the Creative Commons 0 filter. Remotion's sound library points at seven of them with their sources (whoosh freesound 831936, whip 838766, mouse click 678248, DSLR shutter 539136, old shutter 409093, and Kenney's switch and page turn). Drop the file into `audio/samples/<kind>.wav` and the mixer levels it to the kit. Never use meme sounds from myinstants.com and the like ("vine boom", "bruh", record scratch): they carry no licence at all.

Never pull commercial music from the internet. In order of preference: a track the user supplies with its licence; a free-for-commercial-use library track (record the source and licence in `brief.md`); a generated track from a music model the user has access to (write the prompt: genre, BPM, structure with the drop on the hero moment, no vocals); a score composed in code (notes and chords written on the beat grid, rendered offline with sampled instruments such as a free piano sample set rather than raw oscillators, so it sounds played, not synthesized; record the samples' licence); the synthesized `--bed`. If none is acceptable, deliver the master without music plus a cue sheet of where music and hits should land.

## Levels and space

Hero hits loudest, supporting sounds well below and quieter than the music, the bed lowest and ducked under the hero moment. Under the end card the music fades along a dB curve, not a linear one. Pan follows on-screen position. Keep every tonal sound in one key, rising with progress and resolving on the payoff. The lockup is the most resolved moment, not the loudest: the music stops or filters down as the logo forms, then one soft resolved element lands on the frame the wordmark becomes readable.

## Supplied sounds and voices

A licensed SFX file works too: put it at `audio/samples/<kind>.wav` (or.mp3) and name that kind in the cues. It becomes a new kind, or replaces the synthesized sound of the same name, and its peak is measured and placed like every other sound. Record its source and licence in `brief.md`. Narration comes from the voiceover skill (call the Skill tool with "voiceover").

Writing and cutting to a script, measured: seek-engine's `measured/sound-sync.md` (voice-led timing, on-screen words landing 0-2 frames before they are heard, silence before the hit, music pulled down while the viewer reads, one to three hand-placed hero hits).

## Check sync

Close your eyes and listen: if the sound has no shape without the picture, it isn't finished. Then measure: re-render and run `uv run scripts/check_sync.py out/16x9.mp4 audio/mix.wav` (from frame-review): lag within 1 ms, true peak ≤ -1 dBTP after AAC, -14 ±1 LUFS, the loudness range, and where the loudest moment sits (the payoff, not the end card). Then draw the sound: `python3 <this skill>/scripts/waveform.py` (or pass the MP4) writes `out/qa/wave.png`, the waveform with every cue as a coral line and every beat as a blue one; each transient should sit on a coral line or a hair after it. A hit between lines means a hand-typed time or a stale mix. Then check that the hits sit on their frames in a strip around the busiest moment.
