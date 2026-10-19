---
name: sound-pass
description: "Places synthesized sound effects on picture cues, mixes music and voice, and masters to -14 LUFS. Use when adding or checking a video's sound effects, mix, loudness or sync."
---

# Sound pass

Most generated films look finished with the sound off. Turn it on and nothing is connected: the click lands after the button, the cut misses the beat, the logo arrives before the music resolves. Sound is the cheapest thing that makes a film feel produced, and every sound must be **caused** by something the viewer can see.

Copy `scripts/mix_audio.py` and `scripts/waveform.py` from this skill's folder into the film's `scripts/`. Run it once picture timing is locked.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

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

For generated effects, music selection and the composition helpers, read [MUSIC.md](MUSIC.md).

## Mix

```bash
uv run scripts/mix_audio.py                          # music from audio/beats.json, trimmed at its start
uv run scripts/mix_audio.py --song audio/x.mp3 --start 12.3
uv run scripts/mix_audio.py --bed D                  # no track: a soft chord bed in D on the beat grid
uv run scripts/mix_audio.py --key A --lufs -16       # pitched steps in A major; -16 only for a short sting
uv run scripts/mix_audio.py --song audio/bed.wav --music-at 2   # a cold open on effects, the music lands on the first cut
```

It synthesizes every sound (seeded, so the same film always gets the same sound), places each one so its **measured peak** sits on the cue (where the ear hears the hit, not where the file starts), wraps tails across the seam for loops, mixes in `audio/vo.wav` when it exists and lowers the music only in the speech band (300 Hz to 4 kHz), phrase by phrase, until the voice sits 9 dB above it there (`--voice-over 12` for more), reporting each phrase's ratio, and masters `audio/mix.wav` to -14 LUFS, looping gain and limiter ceiling until the WAV peaks at or under -2 dBTP so the AAC encode stays under -1, then zeroes the first and last samples (non-loops end in digital silence). It reports the loudness range: a launch film of 20 s or more wants 5-8 LU. `render.mjs full` muxes it automatically.

A film that is mostly short hits over silence has no floor and comes out quiet and spiky; give it a bed or a track rather than forcing the level. The mix also warns about any 3 s stretch more than 4 dB under the median: a breakdown you designed is fine, a tail that sags is not. To fix a sag, raise that stretch with a gain ramp before mastering (for example `ffmpeg -i audio/mix.wav -af "volume=enable='gte(t,24)':volume=4dB" ...`, or better, more level from the music or voice in that section), then remaster and measure again on the delivered MP4.

**Foley only** (the Cinematic UI look, or any film that should feel tactile and quiet): no score, bed, riser or sting. Every visible action gets a small cue from the kit: `key` per typed character (the mixer thins dense runs), `click` per selection or press, `swish` or a quiet `whoosh` on send; the kit has no hiss, so a faint granular hiss under streaming text is a CC0 recording dropped in as `audio/samples/hiss.wav`, which becomes a new cue kind. The payoff gets no hit, and the copy and logo play over silence. A film of short hits has no floor, so don't force it to -14 LUFS: master lower (`mix_audio.py --lufs -20`) and expect the sag warning across the silent ending; that silence is designed. Tested on a 12 s cue list of typing, two clicks and a send: -20.1 LUFS, true peak -2.5 dBFS.

## Levels and space

Hero hits loudest, supporting sounds well below and quieter than the music, the bed lowest and ducked under the hero moment. Under the end card the music fades along a dB curve, not a linear one. Pan follows on-screen position. Keep every tonal sound in one key, rising with progress and resolving on the payoff. The lockup is the most resolved moment, not the loudest: the music stops or filters down as the logo forms, then one soft resolved element lands on the frame the wordmark becomes readable.

## Supplied sounds and voices

A licensed SFX file works too: put it at `audio/samples/<kind>.wav` (or .mp3) and name that kind in the cues. It becomes a new kind, or replaces the synthesized sound of the same name, and its peak is measured and placed like every other sound. Record its source and licence in `brief.md`. Narration comes from the voiceover skill (call the Skill tool with "voiceover").

Writing and cutting to a script, measured: [MEASURED-SOUND-SYNC.md](MEASURED-SOUND-SYNC.md) (voice-led timing, on-screen words landing 0-2 frames before they are heard, silence before the hit, music pulled down while the viewer reads, one to three hand-placed hero hits).

## Check sync

Close your eyes and listen: if the sound has no shape without the picture, it isn't finished. Then measure: re-render and run `uv run scripts/check_sync.py out/16x9.mp4 audio/mix.wav` (from frame-review): lag within 1 ms, true peak ≤ -1 dBTP after AAC, -14 ±1 LUFS, the loudness range, and where the loudest moment sits (the payoff, not the end card). Then draw the sound: `python3 <this skill>/scripts/waveform.py` (or pass the MP4) writes `out/qa/wave.png`, the waveform with every cue as a coral line and every beat as a blue one; each transient should sit on a coral line or a hair after it. A hit between lines means a hand-typed time or a stale mix. Then check that the hits sit on their frames in a strip around the busiest moment.

## Prove it

Cue timing follows the picture; generated/supplied sources are recorded; the selected loudness profile is passed to both mixer and checker; final measurements and listening still needed are reported. See [the measured source](MEASURED-SOUND-SYNC.md) and [decoded-file checks](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/frame-review/DELIVERY-CHECKS.md).
