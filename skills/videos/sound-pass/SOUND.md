# Sound craft

The measured norms of top-tier launch films and the habits that make a soundtrack sound cheap. Read it before writing cues, and again when the sound doesn't land. Numbers are medians across films from 9 s teasers to 90 s features; the brand's own music, sonic logo or voice always wins.

## Where each sound goes (computed, never typed)

| Picture event | The sound sits on | Template helper |
|---|---|---|
| Landing, impact, lock-in | the contact frame: the first frame the spring reaches its target (0.92 when it is nearly at rest) | `springReach(spr, 1)` after its start |
| Pop-in (scale from 0, a badge) | 50% of its travel | `springReach(spr, 0.5)` |
| Tween that settles | the 97% frame, never the tween's last frame | `settleOf(t0, dur, ease)` |
| Text or a wordmark arriving | the frame it becomes readable (its 97% settle), never a later bar line | `settleOf` |
| Whoosh (camera-scale moves, logo zooms; about 2 a film) | apex on the velocity peak, onset 100-450 ms ahead | `peakOf(t0, dur, ease)` |
| Cut, scroll, streaming text, progress bar, rolling counter, hover | nothing: the music carries it; a counter's final lock gets one tick | |

- **Every sound has a visible cause; not every picture event gets a sound.** About 5 designed effects per 10 s on average, clustered where the music is sparse (the cold open, typing, the logo build) and thinning out once the full groove plays.
- **Coverage is all or nothing.** Once a class of action is sounded, every instance gets the same sound at the same level: 5 clicks out of 14 presses reads as a mistake.
- **Scale each sound to its cause.** A caret blink or small tick whispers (weight ~0.3), a landing is a normal hit, the drop on the hero reveal is the loudest moment. A loud tick over a held frame reads as a sound with no cause.
- **Move the picture, not the sound.** Audio that leads the picture by more than ~45 ms reads as "sound first". Two hits a few frames apart flam: put the lock on the downbeat and let the whoosh carry the move.
- **Effects are dry, mono and centred** (the mixer keeps them within ±0.15); width belongs to whooshes, rises and the music, and a whoosh travels with the motion.

## The arc

- **The hook enters with intent.** Frame 0 has a sound with a reason (the device's first tick, a drone, the first chord). The intro may be soft (5-12 LU under the body for 2-3 s, a 150-450 ms entry) but never a pad swelling in over the whole first bar.
- **The drop is the payoff.** The loudest moment is the drop on the hero reveal, about 30-60% into the film, 2-3 LU over the median momentary loudness. True silence (30-250 ms, or a beat to a bar) before it makes it twice as big; a rise ends in a hard stop or a short gap, never a crash.
- **Contrast is the arc.** A launch film of 20 s or more wants a loudness range of 5-8 LU: thin a section before the turn, a breakdown about 5 LU down at 40-80% of the runtime, a re-entry on a picture beat. A score that drives from start to finish measures around 4 LU and feels flat however good each sound is.
- **The ending subtracts.** As the logo forms the music stops on a bar line or filters down, 0.2-0.7 s of near-silence, then one soft resolved element on the frame the wordmark becomes readable, and a 0.5-2.5 s tail to digital silence. The end card sits 8-20 dB under the film's peak. A sting is the exception: it is all lockup, so its hit is its loudest moment.
- **Loudness:** −14 LUFS integrated for anything that goes to a feed (calm brands included: the calm lives in the arrangement, not the level); −16 only for a short sting played at the head of other videos. True peak ≤ −1 dBTP on the delivered file.

## Sound follows the personality

Pick the row from the brand's three adjectives before writing any cue.

| Personality | Palette | Dynamics | Signature hit |
|---|---|---|---|
| Calm, literary, unhurried | soft mallets, felt keys, a warm pad, a single bell | narrow and gentle; no sucks, booms or risers | one soft chord or mallet note with a long tail |
| Fast, exact, confident | tight kick, plucks, clicks, a short saw | wide; drops on true silence, a sub on the payoff | a tuned snap plus kick |
| Bright, friendly, playful | marimba, claps, pops in a major key | bouncy, small rises | a rising two-note motif |
| Precise, quiet, expensive | sparse piano-like tones, a low strings pad | slow swells, lots of air | one low, warm chord |
| Raw, mechanical | ticks, detents, metallic hits, noise | stepped, rhythmic, dry | a hard mechanical latch |
| Warm, kind | plucked tones, soft pads | gentle rise and fall | a gentle two-note chime |

A drop onto silence and a sub boom under a calm brand is trailer noise: the wrong tone, however well made.

**The progress motif.** When the story is progress (steps cleared, days of a streak, items done), give each step one tuned note a scale step higher than the last and resolve on the payoff: cue `{"kind": "pop", "step": k}`. The ear hears "closer" before the eye counts.

**One key.** Keep every pitched sound in the film's key and on the chord under it; pitch moves within 1-2 semitones on pops. Keep every effect's brightness at or under ~6.5 kHz: pings at 9-14 kHz were judged fatiguing.

Vary repeats with the cue's `pitch` (0.9-1.3 on typing and pops). No continuous pencil-scratch bed under a drawing: it was built and rejected, it fights everything; drawing on is silent, contacts make the sound.

## Typing

About 75% of on-screen typing in top films is silent, 15% sounded per key, 10% one sound per word. Per key: a dark, short "tock" (not a bright click), at most ~12 keys a second, never two within 60 ms (the mixer thins them), word starts accented, small level variation (no jump over 6 dB between neighbours), the music ducked ~10 dB under foreground typing. Above ~25 characters a second, one soft blip per word, or silence.

## UI clicks

One voice at one level for the whole film, about 3 dB under the music broadband (it reads in the 2-5 kHz band the music leaves nearly empty), bright but short (−20 dB within 6-10 ms), press and release ~85 ms apart, centred. A confirm tone only on a meaningful action.

## Slop, and what to do instead

| Slop | Instead |
|---|---|
| A whoosh on every cut, a slam on every cut, a riser before every reveal | ~85% of cuts carry no sound of their own; ~2 whooshes a film; 1-2 rises ending in a stop or gap |
| A boom on every logo and landing; the logo slammed as the loudest moment | ~2 structural hits a film; the logo 8-20 dB under the peak, resolved not slammed |
| A drop or big hit on a static frame | the drop on the hero reveal; section changes within 0-150 ms of a picture change |
| Bright pings and typewriter clicks at 4-8 kHz | dark short keys; short bright clicks under the music |
| Sounding every UI motion (scrolls, progress bars, streaming text, toggles, hovers) | only discrete state changes |
| An even effects layer through the whole film | effects cluster where the music is sparse, then thin out |
| Partial coverage (some presses clicked, some mute) | the same action, the same sound, every time |
| The machine gun: one waveform at one level on every hit | a new seed per hit, ±1 dB and ±1-2% pitch (UI clicks excepted) |
| Every effect at one loudness | scaled to its cause |
| Long reverb and wide panning on tiny sounds | effects dry, mono, centred |
| A bed that never stops; flat loudness | an intro under the body, a drop on silence, a breakdown, an ending that subtracts |
| A full-level downbeat on sample 0 | enter with intent but soft; the first sharp transient once the bed is up |
| A truncated ending, the file stopping mid-note | a 0.5-2.5 s tail to below −60 dBFS, then silence on the end card |

Premium, in one line: restraint, one palette, dark keys and short bright clicks, the music carrying the cuts, real dynamics, silence before the drop and an ending that subtracts. Good sound design mostly disappears.

## Measured levels (vs the music under them)

| Sound | Level | Character |
|---|---|---|
| Key (per character) | about −4 dB under the ducked music's short-window level | dark tock, spectral peak 0.75-1 kHz, under 10-12 ms |
| UI click | about −3 dB broadband, +12-20 dB above 3 kHz | bright, −20 dB in 6-10 ms |
| Pop, word blip | about +6-7 dB | pitched 330-1400 Hz, 30-60 ms |
| Tick | about −8 dB | short, 3-4.5 kHz |
| Whoosh | +6 dB over the bed | band-passed noise, ~210 ms, apex on the visual peak |
| Hit | +20 dB over the bed | usually the music's own kick or drop, 0-75 ms after its cut |
| Chime | +14 dB over a quiet end pad | a soft bell, ringing to ~1.5 s |

**The product's own sounds are the best palette.** A keyboard's switches, a camera's shutter, a lock's latch, a car's indicator: record or license the real thing, put it in `audio/samples/<kind>.wav`, arrange it into the rhythm first, and let the picture follow. The viewer recognises the product by ear before the logo.

## Sounds that belong to a scene

In a 3D or documentary scene, derive the cues from the picture with the source's distance and side relative to the camera, and give the cue a `dist` in metres: the mixer delays it by the speed of sound, filters the highs away with distance, lowers it, and pans it fully. Long beds (marching, hooves, fire) from many sources become a wash of noise: keep the two nearest per shot. A distant battle or city is a bed of far events at random (Poisson) intervals under the scene. A crowd chant is many layered takes of the same line (several TTS voices and speeds, pitched down, panned across the field, band-limited).

**When sounds collide, rank them:** the hero's action first, then danger or failure, then reward, then a change of state, then ambience; the lower one ducks or moves. Give each kind of event its own envelope and frequency range: not every success is the same bright chime, not every hit the same noise burst. A warning is a two-note alternating pulse. When the stakes rise, add a layer (percussion or bass) to the music instead of turning it up.

**An impact in three layers:** a 5-20 ms transient for immediacy, a short pitched body for size and material, a filtered noise tail for debris and space; scale the layers with the force of the hit and clamp the total. The material sets the filter and pitch: wood is mid-range and hollow, metal brighter with a ringing tail, stone low and noisy.

**J and L cuts.** Sound doesn't have to cut with the picture: in a J cut the next shot's sound starts 4-12 frames before its picture and pulls the viewer forward; in an L cut the last shot's sound trails 12-24 frames under the next picture and smooths the change. Give the cue the shifted time; the picture cut stays where it is.

**Small recipes:** a rewind is a quick run of clicks falling in pitch (six clicks ~35 ms apart, 2600 Hz stepping down ~260 Hz each, quieter as they go, panning across); the one impact gets a downward whoosh (5 kHz to 300 Hz, ~0.7 s) as its tail; a sequence of pops rises in pitch with a soft blip an octave below each, resolving into a chord ~0.08 s after the last.

**A pad that tells the story.** A sustained pad under the whole film (~0.03 gain) on a volume envelope: rising in over the first ~1.4 s, ducked to ~35% under the hero transition, then lifting past where it was and changing chord on the hit (Dmaj7 to D6/9). Landings get a short blip in key ~0.12 s after their whoosh. A sim with no music gets generated ambience from its own timeline instead: air rush and a muffled roar that brighten when the camera flies through, a whine in the spinning chapter, a servo and a clunk when parts open and close, whooshes for an exploded view, a boom on the relight.

**A score with a turn.** A theme stated early and returned at the end, a key change from minor to major on the turn (the sun breaking through), a timpani roll into the title hit: three devices that make a code-written score feel composed. Keep a little room reverb on the narration so it sits in the same space as the score.

When the brand brings its own sound: set the supplied track as the music and retime the picture to its bars, not the other way round; a supplied sonic logo goes on the lockup; a voiceover sits 9-12 dB over the music in the speech band (the mixer does this phrase by phrase).

## A supplied voice you can't hear
 One voice's spectrum on its own can't be diagnosed: formants swing ±10 dB, the fundamental sits anywhere from 85 to 255 Hz and sentences fall 5-6 dB as they go, so any single spectrum looks full of defects that are just the speaker. Diagnose by comparison, best reference first:

1. **The clean original**, if it exists: measure both and the difference is the defect.
2. **The pauses** show what was added (hum, rumble, hiss, room tone) and nothing else. A filter multiplies, so pauses near digital silence stay silent whatever EQ was applied: never use a clean pause to rule out an EQ problem.
3. **The speech's own tilt** for a suspected filter: read 1/3-octave bands at 1, 3.2, 5 and 7 kHz (band width `f × 0.2316`, never a fixed width, which invents a treble excess). An ordinary voice falls about 8 dB from 1 to 5 kHz; a fall that keeps steepening or steps suggests a shelf. A candidate, not a verdict.
4. **The file against itself** for level: each passage against the track's own median, not a target.

Never compare against a different voice (a published average spectrum, a TTS take): two speakers differ by more than most defects. With no original and no usable pauses, a static tone problem is under-determined: report the two or three readings that fit and ask the person which they hear, rather than inventing a cleverer measurement. Then fix by symptom: hum or thump, a high-pass at 80 Hz; boomy, cut around 200 Hz; muffled, cut around 250 Hz; words hard to make out, lift around 3 kHz or carve the music under the voice; harsh, cut around 3.2 kHz; some words much louder, gentle compression; room tone between sentences, a gate; dry and placeless, a little room reverb. Treat lightly and in this order: pick the cleanest mic or channel (never sum two mics, which comb-filters), light noise reduction (3-6 dB first), corrective EQ (a high-pass around 60-90 Hz for rumble, a broad 1-3 dB cut where the boxiness actually is), level with phrase gain before compression (then about 2:1-3:1, 10-30 ms attack, 100-250 ms release), de-ess only in the real sibilant band (roughly 4-10 kHz); prefer gentle expansion or room tone to a hard gate, which chops breaths and word tails; EQ and gates don't remove reverb under the words. Process a continuous take before cutting it into pieces, keep the original, and judge the result against it at matched loudness, phrase for phrase: the milder version wins when it keeps more of the speech. For phones: keep the voice and every essential cue audible in mono and at low volume, and never carry information in sub-bass a phone can't play. Measure integrated loudness with `ebur128` in LUFS, rather than faders or waveform peaks; the gain to a target is `target - measured` dB. [https://ffmpeg.org/ffmpeg-all.html#ebur128]
