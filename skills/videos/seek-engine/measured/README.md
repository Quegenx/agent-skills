# The measured corpus

The source describes thirteen historical references measured frame by frame from 53 professional motion moments (about 4,300 moves, cited as M913-M974), 52 ranked human films and a blind autopsy of AI films: its reported observations, with source numbers. These private/raw films were not remeasured in this maintenance round. The current corpus has 21 Markdown files, including this index and the split chapters. [motionmaxxing, captured measured corpus] Rules are written WHEN situation, DO decision, *because* what it buys the viewer. Times are in frames at 30 fps (`f@30`: 3 f = 0.1 s, 10 f = 0.33 s); in a seek-engine film write them as seconds (`f / 30`).

Licence notice for these files: `LICENSE-motionmaxxing.txt` beside this file (Apache License 2.0). Modified here: tool names point at this skill set (`lint.mjs` became `chrome_lint.mjs`, `M.ease.<name>` became `MEASURED.<name>`).

| File | Read it when |
|---|---|
| [video-brief MEASURED-JUDGMENT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-JUDGMENT.md) | before the first idea: what good is, the default mind, when a "slop" thing is right |
| [video-brief MEASURED-IDEATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-IDEATION.md) | finding the idea only this brand could own; PAGE; the metaphor bank |
| [video-brief MEASURED-BRAND-SYSTEM.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-BRAND-SYSTEM.md) | turning a captured site into ground, ink, accent, type, carrier and copy decisions |
| [shotlist MEASURED-DIRECTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-DIRECTION.md) | beat roles, what each beat buys, film shapes, the storyboard worksheet |
| [shotlist MEASURED-STORYBOARD.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-STORYBOARD.md) | the storyboard worksheet (section 7) and the slop tells, split from director.md |
| [video-brief MEASURED-WORLD.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-WORLD.md) | ground, light, depth, texture, 3D and generated surfaces, shutter blur, grain |
| [shotlist MEASURED-COMPOSITION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-COMPOSITION.md) | coordinates, type size by role, emptiness, UI framing, lockups, page chrome |
| [motion.md](motion.md) | measured durations, the 12 eases, entry and exit grammar, smear, clocks, camera |
| [motion-camera.md](motion-camera.md) | camera, physical bodies, pulses and springs (sections 6 and 7) and the slop tells, split from motion.md |
| [shotlist MEASURED-TRANSITIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-TRANSITIONS.md) | twenty measured ways beat A becomes beat B, and how to choose |
| [shotlist MEASURED-TRANSITION-CATALOGUE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-TRANSITION-CATALOGUE.md) | the catalogue of transition types (section 2), split from transitions.md |
| [shotlist MEASURED-TYPOGRAPHY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-TYPOGRAPHY.md) | kinetic type measured: meaning on the word, cadence, counters, reading |
| [shotlist MEASURED-TYPE-DECISIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-TYPE-DECISIONS.md) | counters, name morphs, reading time, holds, the decision table (sections 8 to 12) and the slop tells, split from type.md |
| [shotlist MEASURED-PRODUCT-DEMO.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-PRODUCT-DEMO.md) | cursor, click, typing, toggles, agent work, phones |
| [shotlist MEASURED-DEMO-RECIPES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-DEMO-RECIPES.md) | cards, agent work, phones, dense scrolls, counters, the beat recipes (sections 7 to 13) and the slop tells, split from ui-demo.md |
| [shotlist MEASURED-ENDINGS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-ENDINGS.md) | CTA and logo endings by brand personality |
| [sound-pass MEASURED-SOUND-SYNC.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/sound-pass/MEASURED-SOUND-SYNC.md) | script, voice, cutting to the voice, mixing |
| [frame-review MEASURED-REVIEW.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/frame-review/MEASURED-REVIEW.md) | AI default against the designer's decision; the render review and its gates |
| [frame-review MEASURED-TELLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/frame-review/MEASURED-TELLS.md) | Part 1, the master table, split from slop.md |
| [frame-review MEASURED-REVIEW-CHECKLIST.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/frame-review/MEASURED-REVIEW-CHECKLIST.md) | Part 2, the frame-review checklist and its gates, split from slop.md |

## Their tools in this skill set

| Their name | Here |
|---|---|
| `tools.md` | this table and each skill's SKILL.md |
| `M.ease.<name>` (crashIn, popOver, bounceHard, snapSettle, softLand, whip, glide, cruise, softInOut, gentleIn, accelExit, crashOut) | `MEASURED.<name>` in the seek-engine template, typical length in `MEASURED_FRAMES` (frames at 30 fps) |
| `look.py` (G0 render exists, G2 no empty frame, G3 end hold and final-shot share, audio audit, motion band) | frame-review `scripts/look.py`: audible audio is conditional on `--expect-audio`, failing gates exit only with `--strict`; see [delivery checks](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/frame-review/DELIVERY-CHECKS.md#evidence-limits) |
| `chrome_lint.mjs` (G5 no page chrome) | frame-review `scripts/chrome_lint.mjs` |
| `blind_review.py` | frame-review `scripts/blind_review.py` |
| `precedent.py`, `library/moments.jsonl` | shotlist `scripts/precedent.py`, `library/moments.json` manifest and its eight ordered JSONL parts; custom `--lib FILE` remains JSONL |
| `brand.mjs`, `fetch_logo.mjs` | asset-prep `scripts/brand.mjs`, `scripts/fetch_logo.mjs` (`capture.mjs` adds screens at several sizes and in dark mode) |
| `render.mjs --shutter 180 --subframes 8 --grain 0.03` | seek-engine `render.mjs full --shutter 180 --sub 8 --grain 0.03` |
| `voice.py` | its effects and music: sound-pass `scripts/eleven_sound.py`; its voiceover: the voiceover skill's `tts.py` |
| `sync.mjs`, `vo.words.json`, `words.json`, `beats.json`, `voice.py split`, `lines.index.json` | the voiceover skill's `vo.json` (word and line times; frames are `round(t * fps)`) and beat-grid for music |
| `mix.py`, `sfx.json` | sound-pass `mix_audio.py` cues; `eleven_sound.py sfx --batch sfx.json` |
| `window.__events`, `<out>.mp4.events.json` | seek-engine `render.mjs` writes `<out>.mp4.events.json` from `timeline().cuts`; `look.py` reads it |
| `STORYBOARD.md`, "the storyboard" | shotlist `shotlist.md` |
| `imagegen.py` (Codex image tool) | not included; asset-prep "Generated base footage" and its rule: surfaces only, never text, logos, UI or people |
| `runtime/motion.js` (historical source Motion API: `M.enter`, `M.kf`, `M.camera`) | the seek-engine template's own library (`track`, `kf`, `tween`, springs); the mechanics described carry over, the function names don't |
| `runtime/native-ui`, `runtime/hero3d`, `NativeUI.*`, `M.hero3d`, `runtime/README.md`, `examples/phone`, `examples/3d-hero` | seek-engine `templates/native-ui/`, `templates/hero3d/` (each header documents its API). NativeUI HTML builders are present, but `arrive`/`macro` need the absent source Motion runtime; hero3d exposes `createHero3D`, not a bundled `M.hero3d` wrapper |
| `M.type`, `M.words` | no helper here: type per glyph or word inside `seek(t)` (seek-engine `KINETIC-TYPE.md`); the cadence numbers carry over |
| `NOTE.md`, `taste/verdicts.md`, `taste/edits.md` | `review-log.md` and the production log (make-video) |

## Where this and MOTION-NUMBERS.md differ

These numbers come from short professional moments (3-7 s) of SaaS launch films; `MOTION-NUMBERS.md` comes from whole launch films and our own tested rules. Where they disagree, the film decides: for a 3-7 s moment, a feature loop or an effect, use these; for a whole film, the whole-film norms. Two in particular: here an end card holds 0.6-1.4 s (`look.py`'s G3 fails above 1.4 s, `--hold-warn 2.5` for a launch film with a designed end card), and here a held frame must keep one thing alive (G2 fails more than 3 flat frames in a row).

## Prove it

Current routes resolve to their single owners, runnable local commands use the shipped CLI forms, and historical/private observations and absent source runtimes remain explicitly qualified. Use [the actual delivery profile](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/frame-review/DELIVERY-CHECKS.md), rather than treating a source budget or historical pass as a current result. [motionmaxxing, corpus router; Quegenx/agent-skills, current helper contracts]
