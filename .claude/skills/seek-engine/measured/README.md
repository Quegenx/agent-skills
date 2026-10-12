# The measured corpus

Thirteen references measured frame by frame from 53 professional motion moments (about 4,300 moves, cited as M913-M974), 52 ranked human films and a blind autopsy of AI films: what professionals actually do, with the numbers. Rules are written WHEN situation, DO decision, *because* what it buys the viewer. Times are in frames at 30 fps (`f@30`: 3 f = 0.1 s, 10 f = 0.33 s); in a seek-engine film write them as seconds (`f / 30`).

From [motionmaxxing](https://github.com/Tejashmakwana/motionmaxxing) by Tejas Makwana, Apache License 2.0 (`LICENSE-motionmaxxing.txt` beside this file). Changes made here: the copy keeps their text as written except that tool names point at this skill set (`lint.mjs` became `chrome_lint.mjs`, `M.ease.<name>` became `MEASURED.<name>`); the study corpus itself (the films) is not included in either repository.

| File | Read it when |
|---|---|
| [judgment.md](judgment.md) | before the first idea: what good is, the default mind, when a "slop" thing is right |
| [idea.md](idea.md) | finding the idea only this brand could own; PAGE; the metaphor bank |
| [brand.md](brand.md) | turning a captured site into ground, ink, accent, type, carrier and copy decisions |
| [director.md](director.md) | beat roles, what each beat buys, film shapes, the storyboard worksheet |
| [world.md](world.md) | ground, light, depth, texture, 3D and generated surfaces, shutter blur, grain |
| [layout.md](layout.md) | coordinates, type size by role, emptiness, UI framing, lockups, page chrome |
| [motion.md](motion.md) | measured durations, the 12 eases, entry and exit grammar, smear, clocks, camera |
| [transitions.md](transitions.md) | twenty measured ways beat A becomes beat B, and how to choose |
| [type.md](type.md) | kinetic type measured: meaning on the word, cadence, counters, reading |
| [ui-demo.md](ui-demo.md) | cursor, click, typing, toggles, agent work, phones |
| [close.md](close.md) | CTA and logo endings by brand personality |
| [sound-sync.md](sound-sync.md) | script, voice, cutting to the voice, mixing |
| [slop.md](slop.md) | AI default against the designer's decision; the render review and its gates |

## Their tools in this skill set

| Their name | Here |
|---|---|
| `tools.md` | this table and each skill's SKILL.md |
| `M.ease.<name>` (crashIn, popOver, bounceHard, snapSettle, softLand, whip, glide, cruise, softInOut, gentleIn, accelExit, crashOut) | `MEASURED.<name>` in the seek-engine template, typical length in `MEASURED_FRAMES` (frames at 30 fps) |
| `look.py` (G0 render exists, G2 no empty frame, G3 end hold and final-shot share, audio audit, motion band) | frame-review `scripts/look.py` |
| `chrome_lint.mjs` (G5 no page chrome) | frame-review `scripts/chrome_lint.mjs` |
| `blind_review.py` | frame-review `scripts/blind_review.py` |
| `precedent.py`, `library/moments.jsonl` | shotlist `scripts/precedent.py`, `library/moments.jsonl` |
| `brand.mjs`, `fetch_logo.mjs` | asset-prep `scripts/brand.mjs`, `scripts/fetch_logo.mjs` (`capture.mjs` adds screens at several sizes and in dark mode) |
| `render.mjs --shutter 180 --subframes 8 --grain 0.03` | seek-engine `render.mjs full --shutter 180 --sub 8 --grain 0.03` |
| `voice.py` | its effects and music: sound-pass `scripts/eleven_sound.py`; its voiceover: the voiceover skill's `tts.py` |
| `sync.mjs`, `vo.words.json`, `words.json`, `beats.json`, `voice.py split`, `lines.index.json` | the voiceover skill's `vo.json` (word and line times; frames are `round(t * fps)`) and beat-grid for music |
| `mix.py`, `sfx.json` | sound-pass `mix_audio.py` cues; `eleven_sound.py sfx --batch sfx.json` |
| `window.__events`, `<out>.mp4.events.json` | seek-engine `render.mjs` writes `<out>.mp4.events.json` from `timeline().cuts`; `look.py` reads it |
| `STORYBOARD.md`, "the storyboard" | shotlist `shotlist.md` |
| `imagegen.py` (Codex image tool) | not included; asset-prep "Generated base footage" and its rule: surfaces only, never text, logos, UI or people |
| `runtime/motion.js` (GSAP runtime: `M.enter`, `M.kf`, `M.camera`) | the seek-engine template's own library (`track`, `kf`, `tween`, springs); the mechanics described carry over, the function names don't |
| `runtime/native-ui`, `runtime/hero3d`, `NativeUI.*`, `M.hero3d`, `runtime/README.md`, `examples/phone`, `examples/3d-hero` | seek-engine `templates/native-ui/`, `templates/hero3d/` (each file's header documents its API) |
| `M.type`, `M.words` | no helper here: type per glyph or word inside `seek(t)` (seek-engine `KINETIC-TYPE.md`); the cadence numbers carry over |
| `NOTE.md`, `taste/verdicts.md`, `taste/edits.md` | `review-log.md` and the production log (make-video) |

## Where this and MOTION-NUMBERS.md differ

These numbers come from short professional moments (3-7 s) of SaaS launch films; `MOTION-NUMBERS.md` comes from whole launch films and our own tested rules. Where they disagree, the film decides: for a 3-7 s moment, a feature loop or an effect, use these; for a whole film, the whole-film norms. Two in particular: here an end card holds 0.6-1.4 s (`look.py`'s G3 fails above 1.4 s, `--hold-warn 2.5` for a launch film with a designed end card), and here a held frame must keep one thing alive (G2 fails more than 3 flat frames in a row).
