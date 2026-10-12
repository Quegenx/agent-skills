# video-skills

## 0.10.0

### Minor Changes

- `numberFlow` in the seek-engine template: numbers roll digit by digit in masked columns like the NumberFlow library (unchanged digits still, new leading digits and their separators growing in from zero width), as a pure function of `t`; the explainer's total now rolls this way instead of rewriting all its digits every frame, and smoke reads a rolling number as one value. Tested: the example passes every smoke counter in 16:9, 9:16 and 1:1, and the strip shows each digit landing in turn.
- seek-engine techniques split into one reference per kind of film, so an agent reads only what it needs: `TECHNIQUES.md` (every film), `ILLUSTRATION.md`, `DEPTH-AND-FOOTAGE.md`, `SIMULATIONS.md` and `DIRECTOR.md`, routed from `SKILL.md`.
- From threejs-game-generator-skill (MIT, ideas in our own words): 3D built once and set from t, colour space, three lighting recipes, shadows, glTF models driven by `mixer.setTime(t)`, a follow camera without carried state (`DEPTH-AND-FOOTAGE.md`); a particle grammar (`ILLUSTRATION.md`); ranking colliding sounds, layered impacts by material (`SOUND.md`); a visual thesis with five derived decisions (`STYLES.md`); tells D15 stacked effects and L8 3D render defects (`TELLS.md`).

- From motionmaxxing (Apache-2.0, copied with attribution, `LICENSE-motionmaxxing.txt` beside each copy): the measured corpus in `seek-engine/measured/` (thirteen references from 53 frame-measured professional moments) and the 12 measured eases as `MEASURED` in the template; `templates/hero3d/` (switched to npm three for `bundle.mjs`, font passed as a data URL) and `templates/native-ui/`; frame-review's `chrome_lint.mjs` (G5 page chrome, adapted to `window.seek` and Playwright's Chromium), `look.py` (G0, G2, G3, audio audit; works without ffmpeg's drawtext) and `blind_review.py`; shotlist's `precedent.py` with its 716-row library; asset-prep's `fetch_logo.mjs`. All tested: the lint passes the example and fails a planted corner label and counter (C1, C2, C3); the 3D hero bundles, renders and passes the smoke test; the lock screen renders; the precedent query, the Stripe logo and the review page all work.
- From motionmaxxing, second pass: sound-pass `eleven_sound.py` (ElevenLabs effects into `audio/samples/` as mix cue kinds, and music with a late-start and short-end check and whole-bar looping to length; asks before spending credits); asset-prep `brand.mjs` captures the brand (palette, fonts, logo, copy, `board.png`) and `capture.mjs` now only takes screens; the generated-image rule (surfaces only, never text, logos, UI or people presented as real); `render.mjs --grain 0.03`, seeded so a re-render is identical; `render.mjs` writes `<out>.mp4.events.json` from `timeline().cuts` so `look.py` uses the declared cuts; their known limits written where they bite (short SFX clips, a logo that comes back as a header strip, canvas text the lint cannot see, grain moving the gates); every name their references use mapped in `measured/README.md`. Tested: the dry run and no-key exit, a 33 s track fitted to 70 s at 120 BPM, linear.app captured, two grained renders byte-identical, a declared cut read by `look.py` and confirmed by detection.
- From product-film-skill (MIT): beat-grid `analyze_audio.py edit` splices kept bars of a song back to back on its bar lines and writes a grid with start 0 (tested: every kick within 1 ms of its beat across the join); frame-review `verify_delivery.py` decodes delivered files and checks the ground colour against its token, the loop seam and colour probes (tested: passes the example's #F2F0EA, fails a wrong token and a lifted encode); asset-prep's four discovery passes over a product repo (rules and voice, tokens, components and their clocks, features) and the components table; video-brief's ingredients round and three style frames; kept word slots and inline partner logos (`KINETIC-TYPE.md`); twins of components on their own clock, buttons that keep their width while loading, dashed borders as SVG strokes and the ordered-dither reveal (`TECHNIQUES.md`); landing-page deliverables and the Remotion traps (make-video).
- From premium-ui-revamp-skill (no licence, so ideas only, in our own words): tell I10, a rebuilt screen in the generic web style, with the rules for rebuilding one without a design system (frame-review `TELLS.md`).
- From hyperframes-community-skills (Apache-2.0): smoke's `dead seams` counter fails a declared cut where either side is at rest (tested: a real cut passes, a cut placed in the end hold fails); sound-pass `gm_render.swift` renders a score written as note events through macOS's built-in General MIDI instruments (tested: onsets within 4 ms of the beat); `verify_delivery.py --step N` checks a film drawn on twos or threes (tested: a film on threes passes, a smooth one fails); in our own words, the vector across a cut, one current, the Z-sign rule and the push-into-a-photo contract (`TECHNIQUES.md`), overlapped stages, the three-phase group slide and cascades by weight (`MOTION-NUMBERS.md`), the hidden-in-plain-sight collage explainer (video-brief), archival sourcing and screens inside a device photo (asset-prep), words in depth around a speaker and repainted footage (`DEPTH-AND-FOOTAGE.md`), and a routing row for the formats those community skills already template (make-video).
- From claude-remotion-skill (MIT): sound-pass `scripts/music/electronic.mjs`, a dark electronic launch bed with sections on absolute times (tested: 120.03 BPM at `--bpm 120`, beats locked within 10 ms); the `em` gap trap (`TECHNIQUES.md`), a slow push on held photographs (`DEPTH-AND-FOOTAGE.md`) and one locked prompt skeleton per generated image set (asset-prep).
- From product-launch-motion (MIT): `render.mjs --grain` now holds the grain at 12 Hz, luma only, with `-tune film` (tested: the same film at 36 MB instead of 105 MB with per-frame grain, renders byte-identical); `mix_audio.py` levels a supplied sample to the kit on load and skips a silent one, because a quiet field recording stays inaudible at any weight (tested: a -57 dBFS click is levelled +49.5 dB); in our own words, a note is a symptom, not a spec (make-video), sameness hides in structure and the claim's feeling picks the look (`STYLES.md`), sequencing shots, honest comparisons and charts (`DIRECTOR.md`), the push about a control's own centre with the keep-out arithmetic, and the layout-metrics and skewed-sweep traps (`TECHNIQUES.md`), and a pre-launch proof beat (video-brief).
- From hyperframes-motion-reel-skill (MIT): Remotion's licence terms in make-video's engine table, and the HyperFrames traps that make a render differ from its snapshot.
- From session-story (MIT): the privacy gate for a film built from someone's real words (video-brief `SPEC-PATTERNS.md`).
- From the P(doom) music video (no licence, ideas only, in our words): a song turned into a music video, with an escalating chorus stage, a measuring prop, a growing hero and the subagent chapter contract (video-brief `SPEC-PATTERNS.md`); a mood never snaps (`ILLUSTRATION.md`).
- From the Remotion repository, second pass: a word swap's mask is sized to the longest word (`KINETIC-TYPE.md`), a message bubble grows from its tail (`TECHNIQUES.md`), CC0 recorded effects with their sources and a ban on unlicensed meme sounds (sound-pass). Its prompt-to-motion-graphics guidance was read and mostly left out: crossfades as the default transition, a constant sine pulse on the hook, bouncy springs and fade-out loops conflict with the measured rules.
- From the Remotion repository (its user skills; Remotion License, ideas only): silence trimming with a threshold measured from the clip (asset-prep), its licence terms confirmed from `LICENSE.md` and its effects library noted in make-video's engine table.
- From the HyperFrames repository (Apache-2.0, in our words): small recipes and their traps (a tracking box, words lighting as spoken, a camera following typing, icons alive inside, a slot ticker, a glitch accent, a gradient sweep through text, scatter and reassemble in depth) in `TECHNIQUES.md`; diagnosing a supplied voice you can't hear, by comparison (`SOUND.md`); captions on talking-head footage, the drop / rail / embed model, grouping, refusals, traps and craft (`DEPTH-AND-FOOTAGE.md`); code on screen and the mechanism beat, treating supplied footage (`TECHNIQUES.md`); eight looks named after designers (`STYLES.md`); five launch arcs and the line-to-shot shapes (shotlist `CONCEPT.md`); explainer structures, hook strategies and named clarity techniques, talking head with designed cards (video-brief); near-twin font pairs, light type on dark and the overused-font list (TELLS C2, C11, C12); every element has a verb and connectors name their anchors, number continuity (`MOTION-NUMBERS.md`, `DIRECTOR.md`); supplied clips on the beat and the audio-reactive clichés (beat-grid). Earlier in the same pass: every stretch owned by a sustained-motion route and the pause test (`MOTION-NUMBERS.md`); the changelog film (video-brief); TTS respelling rules and a lexicon (voiceover); a panel that grows without resizing, scrubbing a drawn chart, a whole-scene reskin around a fixed anchor and the collision transition (`TECHNIQUES.md`); the flap reveal (`KINETIC-TYPE.md`).
- From ClaudeAnimationBase (MIT, in our words): turning a drawn character through its drawn views, mood tints, the character big enough to act, contacts that touch, and p5.brush quirks (`ILLUSTRATION.md`).
- From video-use (MIT, in our words): the correctness rules for cutting supplied speech (asset-prep), the "show the edit" hook, and from its manim-video references when to animate or show a still, dim-and-reveal equations and teaching pace (video-brief).
- Standard practice written in: eyeline continuity across talking-head cuts (asset-prep), a light voice-cleanup order with starting values and phone translation (`SOUND.md`), checking an alpha render's edges (frame-review); Tesseract by Mirage added to make-video's engine table.
- From OpenMontage (AGPL-3.0, so ideas only, in our own words, no code): prompting a video model and free stock footage (asset-prep), directing a voice performance with a sample gate (voiceover), the three taste dials (`STYLES.md`), auditing a plan for slideshow risk and the delivery promise (shotlist), long-form structure (`FORMATS.md`), screen-recording capture (asset-prep), feed bitrate (make-video), Mayer's learning principles and a timed explainer arc (video-brief), classifying a reference's shots by motion (video-brief), motion capture on a drawn figure (`ILLUSTRATION.md`), choosing and holding a chart and Murch's cut priorities (`DIRECTOR.md`), a colour-blind-safe palette and skin on the vectorscope (`TECHNIQUES.md`).
- Circular reveals drawn at their final position inside a clip from the birth point, floods growing by the square root of progress, and the parent never peeking around a growing child (`TECHNIQUES.md`).
- `smoke.mjs` counts `low contrast`: opaque text under WCAG 3:1 (4.5:1 for small lines) against the frame's own pixels behind it. Tested: the launch film reads 0; the same film with dark grey headlines reads 6 at 1.7:1.
- A loop that isn't converging stops after the same failure twice, and a paid client job is scoped before the brief (make-video).
- From motion (MIT, read): converting a product's Motion springs (physics or duration/bounce) into the template's frequency and damping ratio (`MOTION-NUMBERS.md`).
- From three.js (MIT, read): post passes and helpers that carry their own clock or randomness, DOM labels through CSS2D/CSS3D renderers, and wide lines with `Line2` (`DEPTH-AND-FOOTAGE.md`).
- From rive-runtime (MIT, read, nothing copied): playing a supplied `.riv` in a film through the low-level web runtime, timelines set from `t`, state machines replayed at a fixed step, its sounds placed as cues (asset-prep).
- From canvas-confetti (ISC, read, nothing copied): its confetti physics solved in closed form from `t` with seeded pieces, its tuned defaults, and when confetti is allowed at all (`TECHNIQUES.md`).
- From cobe (MIT, read, nothing copied): the dotted globe in a film, driven by `update()` from `t`, markers grown and arcs revealed on beats, DOM labels anchored to markers (`SIMULATIONS.md`).
- From deck.gl (MIT, read, nothing copied): data layers on a map in a film, driven from `t` with `redraw('seek')`, no `transitions`, waiting for layers and basemap tiles (`SIMULATIONS.md`).
- From drei (MIT, used from npm): React Three Fiber and drei in a film (`DEPTH-AND-FOOTAGE.md`): `frameloop: 'never'` with `advance(t)`, `extend(THREE)` on a bare root, advancing twice for buffer passes, seeding `Math.random` at mount, which components are safe on a set clock and which carry state. Tested: a transmission, Lightformer, contact-shadow and Sparkles scene rendered at 1080p; seeded pages identical, unseeded pages differ; one residual difference of about 0.005/255 between seek orders not yet traced.
- From fabric.js (MIT, read, nothing copied): animating a design saved by a Fabric.js-based editor from `t`, and its four traps (clock-driven `animate()` and `requestRenderAll()`, `Math.random` in `Noise` and spray brushes, soft cached bitmaps under scale, canvas text the smoke test can't read), in asset-prep.
- From ffmpeg.wasm (wrapper MIT, core GPL; read, nothing copied): when a page must encode video in the viewer's browser, and its limits (browser only, 12-25x slower than native, 2 GB inputs, cross-origin isolation for the multithread core), in make-video's "Not a video".
- From twgl.js (MIT, used from npm, not vendored): `seek-engine/SHADERS.md`, per-pixel looks in WebGL through twgl (setup, the contract for shaders: draw inside `seek`, canvas sized in pixels, seeded and dithered noise, `highp`, one machine on the GPU; feedback trails and GPU particles made deterministic by a fixed-step replay with a step cache and checkpoints; layering, linear light, and recipes for gradients, tunnels, kaleidoscopes, melting shapes, trails and post passes). Tested: a domain-warped gradient and a replayed feedback trail under DOM text rendered at 1080p with every smoke counter at 0, including nondeterministic.
- From anatomy (MIT): its whole toolset in `seek-engine/templates/anatomy/` with its layout kept (the isometric solids kit, round parts and pipes, the geometry audit, WebGL inside the drawing, the 3D mode, the line-end and 3D checks, eight examples and its manuals), and `seek-engine/ISOMETRIC.md` in our own words: a mechanism explained by an invented machine whose moving parts do the idea, at least 40 parts, four-tone solids, one lit part, lines that resolve, painter's order, exploded views, effects inside the drawing, and turning a live figure into `seek(t)` (static art built once, closed-form springs and envelopes, the 3D controller posed from `t`, WebGL drawn with `t` as its clock, seeded ballistic sparks, flow and pulse driven from `t` instead of CSS, a 1920×1080 film frame); `examples/turning-dial/film.js` with `build.mjs --film` is the 3D pattern; smoke skips the overlap check for text inside `[data-drawn]`, where parts in front hide engraved numerals; the explainer pattern points to it (video-brief), and seek-engine's description, make-video's engine table and video-help's routing map name it so a request for one finds it. Tested: a 2D carriage figure and the 3D turning dial with WebGL rendered at 1080p with every smoke counter at 0, including nondeterministic; the Raptor audit passes and the line check reads 0 from the vendored folder.
- The explainer example now ends on a resolved 1 s hold (5.5 s, G3 passes), found by `look.py`.
- From klik-anim-skill-creation (no licence, so ideas only, rewritten in our own words and code): `seek-engine/KINETIC-TYPE.md` (reading time as arithmetic, reveals with numbers, letters with mass, motion that means the words, writing that builds itself, glyph morphs, five composition models, the speed-read device; the old kinetic-type section moved here); one boss per frame, the gaze path, the device ledger, boundaries that carry the eye, the sound's shape as the move's shape and rest as half the film (`MOTION-NUMBERS.md`); a camera that yields, hold and glide, follow cameras, finish and texture recipes and the 3D flattening trap (`TECHNIQUES.md`); the music map (`analyze_audio.py map`, new) and the measured energy arc (`frame-review/scripts/energy_arc.py`, new); reading feasibility at the brief, a reference library with ids and asset recipes (video-brief); proof scene, new versions beside old, landed-edit checks and resume checks (make-video); the distraction test and tells F11, F12, G6 (frame-review).
- `smoke.mjs`: one reading rule everywhere, `max(0.5 s, 0.3 s per word, 0.25 s + characters ÷ 17)`, so long words and numbers get their time.
- `analyze_audio.py` stops with a clear message when the audio file is missing.
- `render.mjs --alpha`: transparent renders for intros, outros and overlays (ProRes 4444 .mov, or VP9 WebM with `--alpha webm`); the template paints no background when `window.__ALPHA__` is set. `render.mjs --data` and `smoke.mjs --data`: one film, many outputs, each record read as `window.__DATA__`.
- From motion-design-skills (MIT, in our own words): one motion language with an audit, the 1/3 rule, dense and distance-based stagger, direction that carries meaning, number count-ups, inertial settles, echoes and seeded jitter in closed form (`MOTION-NUMBERS.md`); lead room, the dolly zoom, looping noise, palette, grading and colour checks (`TECHNIQUES.md`); composition and logo rules (`FORMATS.md`); cutting on action, speed ramps and cut rhythm by personality (`DIRECTOR.md`); J and L cuts (`SOUND.md`).
- `voiceover/scripts/mouth.py`: lip sync for a talking character, one mouth pose per frame measured from `audio/vo.wav` (after talking-avatar's live envelope, MIT, run offline with the mouth leading the sound); the talking-portrait asset recipe in asset-prep; lip sync for drawn rigs in `ILLUSTRATION.md`.
- From motion-graphics-skills (MIT, in our own words): `seek-engine/EFFECTS.md`, sixteen one-object-becomes-another effects with the loop clock and the rules that make them read as designed; the looping cover GIF recipe with measured seam and excursion (make-video); reference frames into motion rules with ASK ME and one master look (video-brief); the one-line "why" brief, documentary shot types and the model showdown pattern (SPEC-PATTERNS); tells E9 and I9; two Chromium traps; on a second pass: result, target and sample numbers kept apart in the claims block, a five-line breakdown of a moves reference, launch checks, a promo for a piece of writing and vertical delivery of supplied footage (FORMATS), report-only-what-you-observe in frame-review, HEVC phone footage re-encoded, and the hero-size and chart rules in EFFECTS.
- `render.mjs`: a render with no mix gets a silent 48 kHz AAC track (feeds mishandle files with no audio stream); `--audio none` still writes video only.
- `render.mjs` and `smoke.mjs` load every declared font face before frame 0 and stop with `font failed to load` when one is missing: `document.fonts.ready` alone left unused faces unloaded, so frame 0 could paint in a fallback.
- `seek-engine/examples/explainer`: a finished, tested example film to copy instead of the demo.

### Patch Changes

- shotlist's hold rule now matches the smoke test's reading time (it was shorter for long lines, so a plan could fail the smoke test); the docs pages are re-synced with this release (frame-review's fourteenth counter, asset-prep's repo passes, archives and device photos, video-brief's new patterns and looks, voiceover's respellings, seek-engine's new sections, beat-grid's montage rule, sound-pass's levelled samples, Remotion's licence).
- `smoke.mjs` tracks short reads per element: typing and a rolling number are one growing read, not a run of short ones.

## 0.9.1

### Patch Changes

- Full re-read of claude-motion (every sim, the director, scenes, sound generators and cue sheets) adds: procedural legs, steering, spatial-hash hit tests, zoom-proof line widths, labels with leader lines that avoid each other, chapter focus, power-driven camera vibration and integrated rotation speeds, the evidence wall (found boxes, threads, redaction typing) (`TECHNIQUES.md`); beat-slammed captions, rolling number captions and slice glitches and downbeat flashes after the drop for the director; deriving secondary animations from one value (`MOTION-NUMBERS.md`); rewind clicks, an impact tail and pop sequences (`SOUND.md`).

## 0.9.0

### Minor Changes

- Mine claude-motion (MIT, whaleyxbt): a Remotion toolkit plus web simulations captured to 60 fps.
  - `seek-engine`: `scripts/bundle.mjs` inlines module imports (three.js) into one page, since pages render from `file://` where module imports are blocked (tested: a three.js scene bundles, renders, nondeterminism 0); preview keys (space, arrows, r). `TECHNIQUES.md`: simulations (simulate once, text as terrain, agents that arrive on time, doubling on the beat, explanation over decoration, three.js traps) and the director that cuts a simulation to a track (shots on bar lines, punch-ins on kicks, drop shake and flash, a time warp that lands the hero on the drop).
  - `beat-grid`: `grid --drop-at 0.4` places the window so the drop lands on a bar line near 40% of the clip (tested on a synthetic drop: on a downbeat at 50% of 4 bars, 38% of 8).
  - `sound-pass`: `scripts/waveform.py` draws the mix or the MP4 with cues and beats as lines (tested); `SOUND.md` on a story-telling pad and generated ambience for simulations.
  - `make-video`: covers and a GIF preview from the same timeline (tested), effort by production stage. `frame-review`: the waveform in the final checks.

## 0.8.1

### Patch Changes

- Complete the claude-animation pass: `seek-engine/templates/drawkit.js`, its whole drawing library ported mechanically to the browser (each module's code unchanged, namespaced under `Draw`): textures and film finish, faceted low-poly, action effects, plants, colony props, and the ant, chibi, critter, bug and bean rigs. Tested in one film across every namespace: no page errors, nondeterminism 0; the film finish's exposure flicker trips the pop counter by design (`{ flicker: 0 }` clears it). Documented in `TECHNIQUES.md`.

## 0.8.0

### Minor Changes

- Mine claude-animation (MIT, Hanif): a hand-drawn character-animation skill.
  - `seek-engine`: `templates/pen.js`, its Pen ported to the browser as a classic script (brush, pencil, watercolour bloom, hand-drawn ring and box, self-writing text, stable named seeds, opt-in boil), with a silent counting pass so mid-reveal frames are seek-order independent (tested: nondeterminism 0); `exposure()` and `timeWarp()` in the template. `TECHNIQUES.md`: the pen kit, three layers on every surface, line weight by depth, material recipes, build-up reveals with construction guides, an effects vocabulary, rig rules, game feel and action, faceted low-poly and extruded type. `MOTION-NUMBERS.md`: snap then hold, two clocks.
  - `sound-pass`: ten character and story sounds (step, thump, crack, sparkle, drip, boing, splash, fall, chime, chirp), a cue `pitch`, `--music-at` (tested: silent before, music in after); vendored generators `scripts/music/` (ukulele, chiptune, ambient) with the MIT licence.
  - `shotlist`: rules for every row (key beat mid-shot, a cut adds information, camera stated, feeling as behaviour, exposure per action, style guide pasted verbatim).

## 0.7.0

### Minor Changes

- Learn from the Battle of Austerlitz film, a five-minute documentary rendered entirely in code (the repository has no licence, so ideas only, rewritten; no code copied).
  - `seek-engine`: `render.mjs full --chunk N` renders resumable segments keyed by a hash of the page and options (tested: a rerun reuses every segment; output identical to a single pass, 360/360 frames); `--gpu` draws on the real GPU (Metal: 7 ms against 61 ms in software on a shader-heavy frame); a narration `.srt` is muxed as a selectable subtitle track; the template preview plays `audio/mix.wav` in sync on a click. `TECHNIQUES.md`: documentary worlds (narration-built timeline, shots as descriptions with dissolves, real terrain from free elevation tiles, real sun position and blended light presets, moving maps, world-pinned labels, crowds as formations, crew-like cameras, cached bakes, a painterly finish, credited simplifications).
  - `sound-pass`: a `dist` cue field for sounds inside a scene (speed-of-sound delay, air absorption, distance falloff, full pan; tested: a 1 km impact lands 2.915 s late); `SOUND.md` on scene sound, beds, crowd chants and a score with a turn.
  - `voiceover`: `audio/vo.srt` from the word times. `make-video`: long renders use `--chunk` and `--gpu`.

## 0.6.1

### Patch Changes

- Full re-read of the Awesome Claude 5.5 Videos collection (every doc, the case notes and the source ledgers) adds four items.
  - `seek-engine`: no hand-typed numbers (every figure on screen and in narration comes from a data slot; dated data shows its source and date); two-bone IK for planted hands and feet and for wind-driven parts; keying supplied green-screen footage to an alpha image sequence (tested: background alpha 0, subject alpha 255).
  - `shotlist`: two story devices, the style journey and the compressed clock.
  - `video-brief`: the string audit checks that no number is typed into copy or narration.

## 0.6.0

### Minor Changes

- Adapt the production practices documented by the Awesome Claude 5.5 Videos research collection (CC BY 4.0, original writing; ideas rewritten in our own words, its colour measurements cited).
  - `make-video`: the hardest 2-4 seconds rendered at full quality before the full render; a production log in every delivery (inputs and licences, what made each shot's pixels and sound, usage and cost, human decisions, unverified claims) and honest credit, where "one prompt", "all code", "no external assets" and "no human edits" are separate claims.
  - `video-brief`: a claims block (source, check, or labelled an illustration); pick the route from the inputs first; the reference's sound in the style guide; colour written as numbers, with measured colourfulness norms; the explainer pattern lists claims before the script and names who listens to the narration.
  - `frame-review`: snapshot before each automated round so a worse fix rolls back; the report says audio was measured, not heard.
  - `voiceover`: you can't hear it; a person listens before shipping, and mispronunciations are fixed by respelling.
  - `asset-prep`: cost estimates and approval before expensive generation, a per-shot generation log, and a plan for transforming supplied footage. `seek-engine`: build a 3D set in gray before materials, and label interactive recordings.

## 0.5.0

### Minor Changes

- Second pass over the Awesome AI Motion gallery, reading all 948 case summaries and 124 resource notes.
  - `beat-grid`: `bands` writes a per-frame table of low, mid and high energy and onsets (`audio/bands.js`) for audio-reactive music videos and visualizers; word-by-word lyric timing from a separated vocal.
  - `seek-engine`: characters in code (character sheet, 2D rigs, walks from joint curves, acting, blinks); hand-drawn, line-art, ink and watercolour looks (draw-on strokes, seeded rough lines, line boil on twos, paper, ink spread); hit-stop on heavy impacts; a scale ruler for zooms across scales.
  - `asset-prep`: gray-box blockouts as the motion reference for generated footage. `sound-pass`: scores composed in code with sampled instruments. `video-brief`: music-visualizer and project-history starters. `video-help`: routes music-reactive and lyric videos.

## 0.4.0

### Minor Changes

- Fill the gaps the Awesome AI Motion gallery (948 code-made works across seven categories) showed; no new skills, since every category maps to an existing one except interactive pages, which are not video.
  - `video-brief`: spec pattern 13, the narrated explainer (intuition, then mechanism, then maths; narration as the clock; captions in one or two languages; talking-head-to-explainer, split-screen, Manim and history variants), and pattern 14, the illustrated short from generated stills; `COPY.md` covers several languages from one timeline and series from one template.
  - `seek-engine`: pixel art (integer scale, one palette, stepped drawings) and illustrated stills in 2.5D (green key, depth parallax, mesh warps, on twos).
  - `sound-pass`: the product's own sounds as the palette and the rhythm.
  - `asset-prep`: the gallery as a reference source; real use and replays as footage.
  - `make-video`: an explainer row in the formats table; interactive pages named as a different deliverable.

## 0.3.0

### Minor Changes

- Mine two installed video skills into the set: cinetic (MIT, by Leonxlnx; its technique library is vendored with its licence) and motion-studio (no licence, so ideas only, written in our own words; no files copied).
  - `frame-review`: `TELLS.md`, a numbered catalogue of AI-video tells; `CRITICS.md`, critic lenses with one JSON shape, a verifier pass, P0/P1/P2 severity, an 11-dimension rubric and ship gate, and a design-off for a weak act; smoke counters for short reads, stalls and a slow hook; `check_sync.py` for sync lag, true peak after AAC, loudness, loudness range and the loudest moment.
  - `sound-pass`: `SOUND.md` (placement, density, personality palettes, typing and click norms, the arc, slop); cue `weight` and `step` (a progress motif on `--key`); centred effects; thinned typing; mastering that loops to -2 dBTP so the AAC file stays under -1, with digital silence at both ends.
  - `seek-engine`: fifteen named curves, `hitPulse`, `squash`, `arrive`, `durFor`, `whole`, and the sync helpers `peakOf`, `settleOf`, `springReach`; named looks in `STYLES` (`--style`); a 240° shutter that never blurs across a cut; `gradient.py` for banding-free stages; measured norms, hit amplitudes and speed limits in `MOTION-NUMBERS.md`; the anchor camera, product-UI truth, kinetic type, loops, OKLab colour and Chromium traps in `TECHNIQUES.md`.
  - `shotlist`: `CONCEPT.md` (inventory, three lenses, kill tests, device design, beats, arcs, end cards); `FORMATS.md` (budgets, beat structures for thirteen video types, transitions by intent, the variation rule, per-aspect layouts); `draw_techniques.py` over the vendored 273-technique library; `CREDITS.md`.
  - `video-brief`: `STYLES.md` (look, motion language and video type as separate layers; personality table; look families; ten motion languages; the same film in several styles; restyle without rebuild) and `COPY.md` (budget, line test, callback copy, stock phrases, string audit).
  - `make-video`: a formats table, modes, and critic rounds for launch films.

## 0.2.0

### Minor Changes

- Fold in the full prompt library (230 prompts) and a second pass over every guide.
  - `frame-review`: three new smoke counters, broken text (NaN, undefined on screen), single-frame pops (a frame step over 3x its neighbours; designed cuts declared in `cuts()` are exempt) and text clipped by its container; a quality bar; a goal-with-stop-rule recipe for unattended runs; frame-timestamp and decoded-frame checks.
  - `seek-engine`: films built from several scene pages joined on the beat; paused GSAP timelines; `TECHNIQUES.md` (infinite zoom through upscaled nested images, Matter.js recorded to a table, seeking existing CSS/WAAPI animations, drags and cursors, camera, seams, floods, irises, liquid glass, smears, real footage, 3D, physics, speech and right-to-left type), `add-font.mjs` for local Google Fonts, `kf()` keyframe tables, `cuts()`, async `seek` for footage, camera and fade numbers, square pixels tagged in every render.
  - `sound-pass`: the music is lowered under the voice phrase by phrase until the voice sits 9 dB above it in the speech band; a `rise` sound; a loudness-dip warning; supplied samples in `audio/samples/`; a path for films with no licensable music.
  - `voiceover`: `--takes` and `--only` to choose takes per line; phrase levelling toward the median.
  - `beat-grid`: `drop` finds the likeliest drops on downbeats; tempo conforming.
  - `make-video`: Manim and footage-editing routes in the engine table; every film gets its own house rules (`AGENTS.md`); animatic before polish; a full deliverables list; long runs with `ANIMATION_GUIDE.md`.
  - `video-brief`: seven new spec patterns and a table of one-line starters. `shotlist`: ideas over features, a good/bad transition table, speech and lyric timing. `asset-prep`: working inside a product repo, logo tracing, references and component sources.

## 0.1.0

### Minor Changes

- First release: eleven skills for making video with a coding agent, every frame code. `make-video` runs the gated production (brief, clock, shot list, stills, build and review, sound and formats) and calls `video-brief`, `asset-prep`, `beat-grid`, `voiceover`, `shotlist`, `seek-engine`, `frame-review` and `sound-pass`. `video-help` routes; `video-setup` checks the toolchain once per machine.
