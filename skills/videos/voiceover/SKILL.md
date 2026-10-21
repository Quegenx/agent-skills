---
name: voiceover
description: "Generates ElevenLabs v4 narration with word timings and pronunciation fixes. Use when a video needs a voiceover, captions timed to speech, or a mispronounced word fixed."
---

# Voiceover

When a film is narrated, **the audio is the clock**. Every animation that illustrates a word should know exactly when that word lands, so the voice is generated with per-character timestamps, grouped into words, and the picture reads those times. Never squeeze a read to fit a slot; retime the picture to the voice.

Copy `scripts/tts.py` from this skill's folder into the film's `scripts/`. It needs `ELEVENLABS_API_KEY` in the environment or the film's `.env`. Never paste a key into a prompt, a file you'll screenshot, or a commit. A key the user pastes into chat is not used: tell them to rotate it, since chat logs aren't a safe place for secrets [coreyhaines31/marketingskills, video].

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

The default is `eleven_v4`, using Text to Dialogue with character timestamps. The previous skill/helper default was `eleven_v3` through Text to Speech; the [2026-09-28 release](https://elevenlabs.io/docs/changelog/2026/9/28.md) directs v4 content creation to Text to Dialogue. Explicitly selected older models retain the helper's Text to Speech request. [https://elevenlabs.io/docs/api-reference/text-to-dialogue/convert-with-timestamps]

## You can't hear it

The agent can check levels, timing and word times, never how a line sounds. Say so in every delivery and have a person listen to the full narration before it ships, especially names, product terms, numbers and foreign words. Fix a mispronunciation by respelling it in the line's `say` field, then regenerate only that line.

## Script

`audio/vo-script.json`, one entry per sentence or phrase:

```json
[
  { "id": "hook", "text": "It all started with one prompt.", "gap": 0.4 },
  { "id": "steps", "text": "Step one: take it apart.", "say": "Step one... take it apart." },
  { "id": "he", "text": "שלום עולם", "say": "שָׁלוֹם עוֹלָם" }
]
```

- `text` is what captions show; `say` is what the voice reads. Fix pronunciation in `say` only (spell out numbers and acronyms, add nikud to Hebrew, punctuation for pacing, audio tags) so captions stay clean when the clean and spoken forms have equal word counts. The current helper only substitutes display words in that case; otherwise inspect and correct the aligned captions before delivery. [Quegenx/agent-skills, tts.py at 48e92a7]
- Respelling rules for `say`: an initialism read letter by letter gets spaced or hyphenated letters (`C L I`, `A P I`); an acronym said as a word gets a phonetic respelling (`JSON` as `jay-sawn`, `GSAP` as `jee-sap`); a mixed compound gets hyphenated lowercase in one run (`ffmpeg` as `ff-mpeg`, `OAuth` as `oh-auth`), never spaced capitals, which the voice reads as isolated letters with hard stops; a URL says its dots (`hyperframes dot hey-jen dot com`); versions, hashes and issue numbers are not spoken at all; emphasis and pauses come from commas and dashes, never capitals, and an ellipsis is unreliable. A slash command is said as "slash figma" and captioned `/figma`. When two respellings are close, generate both takes of the real sentence and pick by ear. Keep the respellings in one lexicon file so every film says a term the same way.
- Write for the ear: short sentences, one idea each, in the pace the brief asks for ("a cool tutorial pace" is a direction the voice model can follow in `say`).
- Existing emotion-tag direction tips, sparingly: `[softly]` on quiet lines, `[excited]` on the one line that peaks. An opener tagged `[warmly]` can sound whispered and `[excited]` everywhere sounds fake. Leave the opener untagged and end it on a plain full stop. [voiceover, existing Script guidance]
- Eleven v4 supports inline direction tags such as `[whispers]`, `[excited]`, `[pause]` and `[long pause]`; use these rather than SSML pause tags. [https://elevenlabs.io/v4]
- A launch voiceover that works: "This is [name]. A [category]… built for [value]. [Verb] in any style. Give it a [input], and it just… understands. … [Name]. Out now." Adapt every line to the product.

## Generate

```bash
uv run scripts/tts.py --voice <voice_id>                  # model eleven_v4 by default
uv run scripts/tts.py --voice <voice_id> --max-pause 0.3 --speed 1.15
```

- Keep each spoken line at most 2,000 characters for reliable Text to Dialogue generation; the helper rejects longer v4 lines before requesting audio. The API reference warns longer requests can terminate early or fail validation. [https://elevenlabs.io/docs/api-reference/text-to-dialogue/convert-with-timestamps]
- Each line is cached in `audio/vo/` by a hash of its spoken text, voice and model. Edit one line and rerun: only that line is requested again. That is how a mispronounced word gets fixed without re-recording the whole take.
- Pauses between words longer than `--max-pause` are cut down to it; `--gap` (or a line's `gap`) sets the silence between lines. A slow first take is fixed here, not by asking for a new one. This trimming also applies to pauses requested with audio tags; raise `--max-pause` when a longer pause is intentional. [Quegenx/agent-skills, scripts/tts.py]
- `--speed` applies an ffmpeg tempo change after assembly (pitch preserved); word times are scaled with it.
- Phrases are levelled automatically: each moves 85% of the way toward the median phrase level, and gain only changes in the pauses between them.

## Takes

**Direct the read before generating it**. "Read naturally" or "expressive" directs nothing: give the whole script one performance intent and an energy curve (a measured hook, a warmer middle, a deliberate close), and each line its pace, energy, the one or two words to stress, and pauses; one delivery idea per line, so a line with three emotional turns is split. Text to Dialogue exposes `settings.stability`: lower values broaden emotional range; higher values can sound monotonous. The old guidance described Text to Speech `style`, `speed` and `similarity_boost`, which this v4 request does not send. [https://elevenlabs.io/docs/api-reference/text-to-dialogue/convert-with-timestamps] Generate the most performance-sensitive line first, not the first line, and approve it before the batch; a change of voice, model or settings after that needs a new sample.

Voices vary between generations, so pick, don't settle:

```bash
uv run scripts/tts.py --voice <voice_id> --takes 4                 # 4 takes of every line into audio/vo/takes/
uv run scripts/tts.py --voice <voice_id> --takes 4 --only steps    # a line that sounds wrong: up to 4 cached take indexes of just it
```

Listen (or let the user listen), set `"take": k` on each line in `vo-script.json`, and run without `--takes` to assemble the chosen takes. Everything stays cached, so switching existing takes makes no new request. Repeating the same --takes command reuses matching take indexes; the old example called these four new tries. [Quegenx/agent-skills, tts.py at 48e92a7]

Writes `audio/vo.wav` and `audio/vo.json`:

```json
{ "duration": 41.3, "lines": [ { "id": "hook", "text": "...", "start": 0.0, "end": 2.1,
  "words": [ { "word": "It", "start": 0.03, "end": 0.12 }, ... ] } ] }
```

The v4 helper sends one `inputs` entry containing spoken text and voice ID, plus `model_id`; it does not send optional dialogue settings. Its `--speed` remains post-generation ffmpeg tempo. The stability advice above is provider guidance, not a promise of local CLI flags. [https://elevenlabs.io/docs/api-reference/text-to-dialogue/convert-with-timestamps]

## Subtitles

`tts.py` also writes `audio/vo.srt` from the word times: cues of one or two rows of at most 42 characters, split at punctuation where possible; a single word longer than 42 characters is rejected with a script-revision error, rather than silently exceeding the limit. Each cue is shown from the first word to the last. `render.mjs full` carries it as a selectable track and puts the `.srt` beside the MP4, for players and platforms that take a separate file.

## Sync the picture

Load `audio/vo.json` into the composition (inline it, or fetch it once before the first `seek`) and key states, captions and cues on word times: a word's illustration lands on its `start`, a caption line enters on its first word and leaves after its last. Set the film's duration from `duration` plus the outro. The sound pass mixes `audio/vo.wav` and carves the music under the speech band automatically (call the Skill tool with "sound-pass").

## A talking character

When a character, mascot or portrait speaks the voiceover, its mouth follows the audio, never a loop: `uv run scripts/mouth.py` (from this skill's folder) measures `audio/vo.wav` and writes `audio/mouth.js`, one pose per frame (0 closed, 1 soft, 2 round, 3 open), with the mouth leading the sound by `--lead 0.04` s. Load it with `<script src="audio/mouth.js"></script>` and read `+MOUTH.poses[Math.round(t * MOUTH.fps)]` in `seek(t)`. Ordinary pose updates happen at most every ~96 ms and move one step at a time. After 0.17 s of silence the helper closes directly, bypassing both constraints. The old never-jumps wording omitted that silence exception. [Quegenx/agent-skills, mouth.py at 48e92a7] Re-run it after every new take. Tested on synthesized speech: one step at a time, at least 3 frames per pose, closed between sentences.

Only the mouth moves on a talking portrait: the face, eyes, head and background stay still while it speaks (a drawn character can still act with its body). How to make the mouth images is in the asset-prep skill; drawn rigs map the four poses to their own mouth shapes.

## Check

Listen to every changed line. Then render a strip around two or three key words and confirm the illustration lands with the word, not before it. Audio that leads the picture by more than about 45 ms reads as "sound first": move the picture, not the sound.

A recorded voice (not generated) has no timestamps: split it at pauses of 100 ms or more, transcribe each segment separately (Whisper), and align each segment's first word to its measured onset. One Whisper pass over the whole read can place words half a second late.

The v4 request migration was checked by reading the official request/response schema and the helper; it has not been run against the live API. Historical verification (before this migration, no key during development): the cache, pause trimming, display-text mapping and assembly were verified against fixture responses in the documented `with-timestamps` shape.
