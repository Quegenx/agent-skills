---
name: seek-engine
description: "The render contract and renderer for code-made video: one HTML file whose seek(t) paints any frame, rendered to stills and MP4. Use when building, retiming or rendering a video's frames, or when a render flickers or differs between runs."
---

# Seek engine

The whole trick is one rule: **a frame is a pure function of its time.** `window.seek(t)` paints exactly the frame for `t`, every time, in any order. Frame 431 always looks the same, a fix is a one-line edit plus a re-render, and any single frame can be checked without playing the film. Everything else is that function, grown up.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

## Start a film

From the film folder (`make-video` scaffolds it):

```bash
cp <this skill>/templates/index.html .
cp <this skill>/scripts/render.mjs <this skill>/scripts/LICENSE-anatomy-reveal.txt <this skill>/scripts/add-font.mjs <this skill>/scripts/gradient.py scripts/
npm install                       # playwright, from the scaffolded package.json
open index.html                   # live preview: click for sound in sync, space pauses, arrows seek 2 s, r restarts; ?t=2.5 ?format=9:16 ?style=night
```

The template's demo (a pill that morphs to a card and a circle, driven by a cursor, looping) exists to show the kit working. It is one idea, not a template: keep the FILM, MOTION LIBRARY, LOOK, LAYOUT and API blocks, and replace the SCENE block with your film.

## The contract

- **No clock.** No CSS `transition`, `animation` or `@keyframes`, no `setTimeout`, no `requestAnimationFrame` in render mode, no `Date.now()` or `performance.now()`. The preview loop in the template is the only clock, and it is off when `window.__RENDER__` is set.
- **No carried state.** Nothing accumulates between frames: no counters, no physics stepped frame by frame, no "previous value". Compute everything from `t` in closed form. A simulation that must integrate is precomputed once, deterministically, into an array indexed by time.
- **No unseeded randomness.** `rng(seed)` and `hash(i)` only, never `Math.random()`.
- **Values with many targets are sums of springs.** `track([[t, value, spring], ...])` adds one closed-form spring per change, so frame 812 renders without simulating frames 0-811. Colours use `colorTrack`.
- **The page exposes the API**: `seek(t)` (it may be `async`, for real footage; the renderer awaits it), `configure({ beat, format, style })` (rebuild every timed thing when the beat changes), and `timeline()` returning `{ duration, fps, loop, beat, bpm, format, formats, styles, size, cues, cuts }`. `cuts` lists designed hard cuts in seconds, so the pop scan doesn't flag them. Optional: `speed(t, dt)` returns the largest on-screen travel, in the frame's own pixels (the units of `size`), of anything visible between `t` and `t + dt`; it only reads the timeline and paints nothing. When it exists, `render.mjs full` sizes each frame's motion blur from it.
- **Comment every tween with its duration, curve and overshoot**, in that order, so the code can be checked against the beat table.
- **Readable text lives in the DOM**, so the smoke test can find overlaps and edges. Canvas, SVG and WebGL are for everything else, all drawn from `t`.
- **Fonts are local.** `node scripts/add-font.mjs "Inter" --weights 400,600` vendors any Google Fonts family (every subset, Hebrew included) into `assets/fonts/` with its `@font-face` CSS; link that CSS. The renderer waits for `document.fonts.ready`. A network font that fails silently renders a fallback in every frame.
- **GSAP is welcome when paused.** Build the scene's GSAP timeline paused and call `tl.seek(t)` inside `window.seek`; GSAP then moves every layer exactly like the springs do. A timeline left playing on its own clock breaks the contract.
- **One timing source.** States, copy and cues are written in beats (`beat(n)`) in data arrays at the top of the scene. The shot list's times and these arrays are the same numbers.

## Motion

Choose every duration, curve and spring from the number sheet, never by feel: [MOTION-NUMBERS.md](MOTION-NUMBERS.md). Adjectives produce the model's defaults; numbers produce the film. The template implements it: `SPR` springs and `EASE` curves; `track` and `colorTrack` (sums of springs); `kf`, `tween`, `swap`, `lmix`; `hitPulse` and `squash` for hits and contact; `arrive` (vertical rises that don't tick), `durFor` (duration from distance), `whole` (discrete state per whole frame), `exposure` (drawings on twos or held while the camera stays smooth), `timeWarp` (hit-stop: game time freezes on contacts while effects keep running); and the sync helpers `peakOf`, `settleOf` and `springReach`, which compute where each sound belongs from the motion itself. Before writing motion code, list each beat with its start, duration, curve and overshoot in a table; the review checks the render against it.

Techniques live in one reference per kind of film. Read only the one the shot list calls for:

- [TECHNIQUES.md](TECHNIQUES.md): every film. Collections (galleries, carousels, rings, coverflow) as poses blended per value, the anchor camera and parallax, CSS and WAAPI pages, cursors, seams, floods, irises, smears, liquid glass, type and right-to-left text, product UI that tells the truth, loops, finish and texture, OKLab colour and banding-free gradients, and the Chromium traps table.
- [TECHNIQUES-COLOUR-AND-FINISH.md](TECHNIQUES-COLOUR-AND-FINISH.md): split from TECHNIQUES.md: collections as poses, loops, OKLab colour and banding-free gradients, finish and texture, and the Chromium traps table.
- [KINETIC-TYPE.md](KINETIC-TYPE.md): words in motion. Reading time as arithmetic, reveals with their numbers, letters with mass, motion that means what the words mean, writing that builds itself, letters that morph into shapes, exits in each device's own voice, the five composition models (fixed anchor, accretion, growing line, world-space, annotation) and the speed-read device.
- [WORD-FOLD.md](WORD-FOLD.md): a walking compass strip reveals one word and becomes its final letter; supplied glyph/ending guides, kit, sounds and corrected helpers in `templates/word-fold/`. This source uses CoAnimator's player/timeline contract, not the default renderer API. [word-fold, SKILL.md and bundled kit]
- [ILLUSTRATION.md](ILLUSTRATION.md#hand-drawn-line-art-ink-and-watercolour): hand-drawn, ink, watercolour, characters (rigs, walk cycles, IK, acting), game feel and hit-stop, pixel art. Copy `templates/pen.js` (brush, pencil, watercolour, self-writing text, stable seeds, opt-in boil); the drawing kit is `templates/drawkit.js` plus `templates/drawkit-nature.js` and `templates/drawkit-cast.js`, with load order and namespace in that reference.
- [DEPTH-AND-FOOTAGE.md](DEPTH-AND-FOOTAGE.md): real footage and clips, green-screen keying, stills in 2.5D, infinite zoom, 3D, faceted low-poly and extruded type, physics and data-slot numbers.
- [SHADERS.md](SHADERS.md): per-pixel looks in WebGL with twgl.js (`npm i twgl.js`): moving noise gradients, glows, tunnels, kaleidoscopes, melting distance-field shapes, post passes, and feedback trails or GPU particles made deterministic by a fixed-step replay.
- [ISOMETRIC.md](ISOMETRIC.md): how something works, explained by an invented machine whose moving parts do the idea (a queue as a marble run, a cache as a bookcase): the object-is-the-explanation rule, parts lists, four-tone solids, one lit part, painter's order, exploded views, and an isometric figure driven by `seek(t)`. Its full toolset is owned by [isometric-figures](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/isometric-figures/SKILL.md), under `skills/web-ui/isometric-figures/templates/isokit/`: the solids kit, round parts and pipes, the geometry audit, WebGL inside the drawing, the 3D mode, eight examples and their manuals; `examples/turning-dial/film.js` is a 3D figure driven by `seek(t)`.
- [REAL-OBJECTS.md](REAL-OBJECTS.md): a real product as the subject (an exploded view, a teardown, an anatomy figure, a product reveal), from a photo or a name: dimensions, features and a parts list and how to research them, part counts, how each kind of object comes apart and its build order, and the reveal shot sequence (tumble in, macro details, one feature working, explode and snap back, hero). Read with ISOMETRIC.md.
- [SIMULATIONS.md](SIMULATIONS.md): swarms, agents, creatures with legs, machines to fly through, evidence walls, maps, terrain, crowds and light.
- [DIRECTOR.md](DIRECTOR.md): a film cut automatically to a track, with captions on the beat, flashes and glitches.
- [EFFECTS.md](EFFECTS.md): sixteen product and type effects, each one object becoming another (button to player, search to results, chart morph, dashboard zoom, masked and elastic type, glass focus, flowing paths, a particle logo or number), on an 8 s loop clock or held under narration.

**The measured corpus.** [measured/](measured/README.md) holds thirteen references measured frame by frame from 53 professional motion moments (about 4,300 moves): durations by property, the 12 measured eases, twenty transition types with their numbers, type cadence, UI demos, endings, layout, world-building and a slop review. The template carries the 12 eases as `MEASURED.<name>` (`softLand` for landings, `accelExit` and `crashOut` for leaving, `snapSettle` for hero and CTA entries, `popOver` for the rare late overshoot, `cruise` for fades and drift) with their typical lengths in `MEASURED_FRAMES`. Use those numbers for short moments and effects; `MOTION-NUMBERS.md` for whole films.

**A 3D hero and phone UI.** `templates/hero3d/hero3d.js` is one seekable Three.js hero object (extruded text, an SVG logo with bevels, a coin, a glass slab, a phone, a glTF) with studio light, a moving softbox sweep, bloom and depth of field, every property a pure function of `t` through `renderAt(t)`: import it from `src/*.js`, `npm i three esbuild`, pass the font as a data URL (`opts.font`; Inter Bold is in `hero3d/fonts/`, `fontconv.py` turns a woff2 into a static ttf), bundle with `bundle.mjs`. Tested: chrome type with a sweep and a coin, bundled and rendered, every smoke counter 0. `templates/native-ui/` builds iOS UI at true proportions as HTML (`NativeUI.phone`, `lockScreen`, `notification`, `banner`, `appScreen`, `list`, `tabBar`, `appIcon`, `statusBar`); use its HTML builders independently. Its historical `arrive(M, ...)` and `macro(M, ...)` moves require the source Motion runtime (`motion.js`), which is absent here: they call `M.enter`/`M.kf` and `M.camera`/`M.mark`. The old line incorrectly named GSAP. [native-ui.js, arrive and macro] Every notification requires an icon (or app), a title and a real sentence; time defaults to `now`.

A finished example film that passes every smoke counter in every format is in [examples/](examples/README.md); copy it instead of starting from the demo.

## Formats

16:9, 9:16, 1:1 and 4:5 (1080 × 1350) are different compositions of one story, never crops of one render. All layout derives from `W`, `H` and `U` (1% of the short side) inside `setFormat()`; give the vertical cut larger type, fewer simultaneous elements and its own camera path. Check each format with its own sheet. For YouTube, "avoid adding padding or black bars directly to your video" ([YouTube Help](https://support.google.com/youtube/answer/6375112)): render the 16:9 cut at 16:9, not a letterboxed copy of another format.

## Looks

The *Cinematic UI* look (oblique macro shots of real UI, optical depth of field and stipple reveals) has source-specific dark and light stages in [CINEMATIC-UI.md](CINEMATIC-UI.md); choose from the product's real theme. [1weiho/cinematic-shot, references/look.md]

All colour lives in `TOKENS`, chosen from the named sets in `STYLES`. A second look of the same film is a new entry in `STYLES`, never a fork: `render.mjs full --style night` renders it with identical timing. Gradient stages are baked PNGs from `scripts/gradient.py`, never CSS gradients (they band).

## Render

```bash
node scripts/render.mjs still 0 2.5 7.9          # full-resolution stills -> out/stills/
node scripts/render.mjs sheet --every 0.5        # labelled contact sheet -> out/sheets/sheet.png
node scripts/render.mjs sheet --at 1,1.2,4.05    # exact moments
node scripts/render.mjs beats                    # one settled frame per beat
node scripts/render.mjs strip 3.9 4.3            # every frame of a stretch: pops, overlaps, ghosting
node scripts/render.mjs full                     # out/16x9.mp4: 60 fps, sub-frames blended (by speed when the page has speed()), audio/mix.wav muxed
node scripts/render.mjs full --format all        # every format in FILM.formats
node scripts/render.mjs full --scale 0.5 --sub 1 # fast draft, and the animatic before polish
node scripts/render.mjs full --range 4:7         # re-render only the affected seconds
node scripts/render.mjs full --chunk 10          # long film: 10 s segments, a stopped render resumes where it left off
node scripts/render.mjs full --gpu               # 3D, shader-heavy or WebGPU film: the real GPU (Metal on macOS), ~9x faster; WebGPU needs it
node scripts/bundle.mjs src.html index.html      # a film with module imports (three.js): bundle into one page first
node scripts/render.mjs full --shutter 180 --sub 8 --grain 0.03   # a lens finish for a smooth film: shutter blur and seeded grain (grain encodes large: plan the file size)
node scripts/render.mjs full --alpha             # transparent intro, outro or overlay: ProRes 4444 .mov (--alpha webm for the web)
node scripts/render.mjs full --data data/acme.json --out out/acme.mp4   # one film per record: the page reads window.__DATA__
```

**A film made of several scene pages** (one HTML file per scene, each with its own `seek`): render each with `--page`, then join them with no re-encode, scenes listed in order in `out/scenes.txt` as `file '01.mp4'` lines:

```bash
node scripts/render.mjs full --page scenes/01.html --out out/01.mp4 --audio none
node scripts/render.mjs full --page scenes/02.html --out out/02.mp4 --audio none
ffmpeg -f concat -safe 0 -i out/scenes.txt -c copy out/picture.mp4
ffmpeg -i out/picture.mp4 -i audio/mix.wav -map 0:v -map 1:a -c:v copy -af apad -c:a aac -b:a 256k -ar 48000 \
  -t "$(ffprobe -v error -show_entries format=duration -of csv=p=0 out/picture.mp4)" -movflags +faststart out/film.mp4
```

Cut each scene on a beat: give each page's duration in whole beats so the joins land on the grid. The sound is mixed once for the whole film, never per scene.

Every mode takes `--format`, reads `audio/beats.json` when present, writes `out/cues.json` for the sound pass, and fails on any page error. Every mode also takes `--style`. `full` blurs adaptively when the page exposes `speed(t, dt)`: each frame gets `ceil(travel / --step)` sub-frames (`--step 4` output px, at most `--most 40`), the travel measured over the open shutter, so a hold renders 1 and a whip up to 40 (after anatomy-reveal's `render.mjs blur`, MIT, `scripts/LICENSE-anatomy-reveal.txt`). Each frame's sub-frames are averaged with ffmpeg `tmix`, one call per frame. `--sub N` overrides it with a fixed count for every frame; a page without `speed` gets `--sub 4`, and `--sub 8` for fast moves (4 sub-frames leave ghost copies on a whip). `--shutter 240` (degrees, centred on the frame; blur never crosses a declared cut), `--scale 2` for a supersampled master, `--workers` and `--crf`. Chromium launches with `--force-color-profile=srgb`, so pixels are sRGB on any display. Output is H.264, yuv420p, BT.709-tagged, square pixels, AAC 48 kHz, `+faststart`. When `audio/vo.srt` exists (the voiceover skill writes it), a render from 0 carries it as a selectable subtitle track and writes the `.srt` beside the MP4. `--chunk` keys its segments by the top-level HTML, selected render options, beats and supplied data. Imported CSS, JavaScript, images and fonts are outside that key; use `--fresh` after changing those dependencies. The old line claimed every edit invalidated stale segments. The source records an identical single-pass comparison. [scripts/render.mjs, chunk key and --fresh] `--gpu` pixels can differ between machines: keep one machine per film. With `--alpha` the page sees `window.__ALPHA__` and paints no background of its own (the template's `drawFx` already skips it); the file is video only and renders in one pass. Without a mix, an MP4 still gets a silent audio track (feeds mishandle files with none). A data-driven film reads every name, number and line from `window.__DATA__` with its own default for the preview; smoke the longest record first (`smoke.mjs --data`), check its stills, then render every record. Tested: alpha renders carry real transparency in ProRes 4444 and VP9; two records render their own text; a malformed record fails with its file name.

## Gotchas that cost real time

- `will-change` on anything the camera scales makes its text rasterize blurry. On a layer whose `filter: blur()` animates, it causes nondeterministic ghost frames.
- Put all of an element's translation in one `transform`; a fractional `left/top` plus a transform snaps to whole pixels and jitters.
- Clamp every value that feeds geometry: springs overshoot, and a negative width, radius or blur throws or flashes.
- A colour change between black and white through a spring or crossfade passes through grey. Flood the new colour from a point (the template's `#flood`) or move an accent element between states.
- Frame 0 is the thumbnail and the first thing a muted feed shows: compose it. In a loop, keep frame 0 mid-hold, not mid-morph.
- Periodic decoration in a loop (drift, rotation) must divide the loop length, or the seam jumps. The smoke test catches it.
- Declare every variable before the first `seek()` call; a temporal-dead-zone error only appears in render mode.
- WebGL (Three.js) is fine when the scene is rebuilt from `t` each frame and any shader time uniform is `t`. Shaders on their own clock paint a different picture each run.
- WebGL on a live web page is the opposite case (refuse software rendering with `failIfMajorPerformanceCaveat`, a DPR cap chosen by shader cost, context loss, a rAF loop): [webgl SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/webgl/SKILL.md). A film keeps SwiftShader, the fixed `maxRatio` and `seek(t)`.
