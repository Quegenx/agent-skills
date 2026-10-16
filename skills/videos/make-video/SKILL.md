---
name: "make-video"
description: "Directs a video, animation or motion graphic made entirely from code, as gated stages from brief to final render. Use when the user asks for a video to be made: a launch film, promo, explainer, logo sting or lyric video."
---

# Make a video

The model writes a program; the program draws frames; a renderer turns frames into a film; a review loop decides whether anyone should see it. The prompt is the smallest part. This skill is the **studio** around it: five layers, each a file another session can read, and **gates** between them.

```
DIRECTOR    what is the film saying?           brief.md
REFERENCE   what should it look and feel like? style-guide.md
TIMELINE    what changes at each beat?         audio/beats.json, shotlist.md
RENDERER    how is every frame produced?       index.html (seek(t)), scripts/render.mjs
CRITIC      what failed, where, and why?       out/qa/, reviews/, review-log.md
```

Never collapse the layers into one uninspected step. The generic look (a centred title on a gradient, everything fading in, a logo at the end) is what the model fills in when a layer's decisions are missing.

## Setup

1. Scaffold the film's studio folder from the project root: `bash <this skill>/scripts/new-film.sh <slug>`, then `npm install` inside `films/<slug>/`. If tools are missing, tell the user to run `/video-setup`. The scaffold writes the film's house rules (`AGENTS.md`, which Claude Code reads through `CLAUDE.md`): the render contract, the banned looks and the review loop, read on every run so they never need repeating. When the film lives inside an existing product repo, build it beside what is there and never regress an existing composition.
2. Size the run from the format:

   | Format | Length, fps | Grid | Beats | Words | Sound | Review |
   |---|---|---|---|---|---|---|
   | Launch film | 20-45 s, 60 | 120 BPM, a 2 s bar | 8-10 per 30 s | 15-25, cap 35 | full score, drop on the turn | ≥ 2 critic rounds, ship gate |
   | Teaser | 10-20 s, 60 | 120 BPM | 4-6 | 6-10 | a rise and a hit | 1-2 rounds |
   | Feature video | 8-30 s, 60 | 120 BPM | 4-7 | ≤ 15 | light, discrete UI events | 1-2 rounds |
   | Feature loop | 4-15 s, 60, whole bars | 100-120 BPM | 3-5 | ≤ 8 | usually muted | 1 round + seam check |
   | Logo sting | 3-8 s, 60 | 1 bar per beat | 3-4 | the name | one tuned hit | 1 round |
   | Walkthrough | 20-90 s, 60 | per chapter | 3-5 a chapter | ≤ 6 a caption | bed + clicks | ≥ 2 rounds |
   | Explainer | 30 s-10 min, 30-60 | the narration (voiceover) | one concept per sentence | the script | voice, a light bed | ≥ 2 rounds + a fact check |
   | Vertical social | 10-30 s, 60 | a change every ~0.7 s | dense | ≤ 5 a screen | a hook on frame 0 | 1-2 rounds |

   Deliverables per format are in `shotlist/FORMATS.md`. A one-line request ("a 15 s showreel") still gets every gate, but each gate is one short file. A long brief with assets, a song and a voice gets the full treatment. Keep one session per brand where you can: the second film for the same product reuses the renderer, the tokens and the sound, and comes out faster.

## The gates

Work through them in order. Each one writes its file and shows it to the user. Stop at a gate when the user is present; when the user said to run unattended, write the file, note your assumption in `review-log.md` and continue.

1. **Brief and references.** Call the Skill tool with "video-brief". When the film shows a real product, also call it with "asset-prep" to collect the real screens, logo, colours and fonts. A missing asset the brief depends on is a blocker: ask for it, never draw a convincing fake.
2. **Clock.** Call the Skill tool with "beat-grid": measure the supplied track, or choose a tempo for synthesized sound. When there is narration, call it with "voiceover" instead of or as well as: the voice becomes the clock.
3. **Shot list on the grid.** Call the Skill tool with "shotlist". It also produces three storyboard variants when the direction is open; the user picks one.
4. **Stills before motion.** Call the Skill tool with "seek-engine", build the composition, and render one still per shot (`render.mjs still`). Fixing a still costs seconds; fixing a render costs minutes. Get the stills approved.
5. **Build, then review until it passes.** Animate between the approved stills, then render the animatic (`render.mjs full --scale 0.5 --sub 1`) and fix pacing before any polish. Before the full render, render the **hardest 2-4 seconds** at full quality (`render.mjs full --range a:b --sub 8`) and check them frame by frame (`strip a b`): contacts, occlusion, speed, seams, captions, sync. If the hardest stretch doesn't hold, the full render won't either. Call the Skill tool with "frame-review" after every meaningful change. It owns the loop: the smoke counters read zero, the contact sheet scores 8+ on every axis, and the three worst defects are fixed per round. For a launch film or anything long, run its critic rounds (director, art/copy/UI and sound lenses, a verifier, the 11-dimension rubric) until the ship gate passes or 5 rounds are used.
6. **Sound, formats, delivery.** Call the Skill tool with "sound-pass" once picture timing is locked. Render every format the brief asks for from the same timeline (`render.mjs full --format all`), never by cropping. Run the frame-review final checks on the delivered files.

## Modes

- **New film:** every gate, as above.
- **Same film in several styles:** one composition, frozen timing, one `STYLES` entry per look, `render.mjs full --style <name>` each, and a side-by-side compare (video-brief's `STYLES.md`).
- **Restyle** ("more cinematic", "make it cyberpunk"): modify, don't rebuild. Change the look tokens or motion constants, keep story, timing and assets, and edit only scenes whose assets clash.
- **Re-cut for another format:** re-lay out from the same timeline (`--format 9:16`), never crop; trim cut-downs on bar lines.
- **Take a note as a symptom, not a spec.** The person is almost always right that something is wrong and rarely precise about what: ask at which second, reproduce it on that frame before changing anything, then fix the mechanism and report back in their words. "Make it 3D" means a camera rig and depth on what the story touches, not a rotation; "I don't like the ripple" means everything that reads as a ripple; "it looks basic" means a shot carrying its beat with two rectangles, not a missing effect; "add a typing sound" may mean the cue exists and is too quiet to hear; "speed it up" usually means tighter clauses with the holds kept; "the cursor is bad" usually means it is invisible, not ugly. When a note is wrong, answer with a measurement.
- **Fix a note:** change numbers, re-render only the affected seconds (below). After a scripted edit, check it landed (the old text gone, the new one present, in that exact place): a replace that matches nothing does nothing, and stale code then ships while the log says fixed.
- **A new version:** when the user asks for a new version, write it beside the old one (`index-v2.html`) and keep both until they choose; never overwrite the approved one in place.
- **Proof scene first** (films over ~20 s): build the most style-defining shot plus the signature transition, render it, show it, and build the rest only once that is approved. A miss there costs one scene; the same miss after the whole build costs the build.
- **A paid job for a client:** scope it before the brief: one core interaction, a fixed runtime (15-30 s), the deliverables named (16:9 master, 9:16 cut from the same timeline, the source folder), and a revision cap (two rounds is usual). A concept demo of a real product made on spec is labelled "concept" and uses only that product's public screens.
- **Resuming:** read `review-log.md`, then check it against the code and the latest renders before new work; a log that says done for something the render doesn't show is fixed first.

## Deliver

Before calling it done, the gates on the delivered file all pass and their numbers go into the production log: smoke counters at 0, `look.py` G0 (renders, moves, right length, sound present), G2 (no run of more than 3 flat frames), G3 (end hold, final-shot share), `chrome_lint.mjs` G5 (no page chrome), and by eye G1 (the proof is readable: UI text at least 4% of the height, the fragment large or cropped by the frame) and G4 (one hero per frame). Never certify the film as good; say what was checked. The review lookup of AI defaults against designer decisions is seek-engine's `measured/slop.md`.

Keep the delivery folder clean: deliverables at the top, QA material (sheets, crops, reports) in `out/qa/` and `reviews/`.

1. `out/<format>.mp4` for every format, rendered from the same timeline
1b. For feeds, encode H.264 High profile at roughly 8-15 Mbps; much under 5 Mbps and the platform's re-encode visibly degrades it (render.mjs's CRF 16 at 1080p usually lands there; check the bitrate with ffprobe).
2. `out/poster.png`: the strongest frame, usually the last (`render.mjs still <t> --out out/poster.png`)
   For a landing page add a muted file (`render.mjs full --audio none`) and web encodes of it, best codec first: AV1 (`ffmpeg -i out/16x9.mp4 -c:v libsvtav1 -crf 35 -preset 6 -pix_fmt yuv420p -movflags +faststart -an out/16x9.av1.mp4`), a VP9 WebM (`ffmpeg -i out/16x9.mp4 -c:v libvpx-vp9 -b:v 0 -crf 32 -row-mt 1 -an out/16x9.webm`), and the H.264 MP4 as the fallback every browser plays (the `<source>` order and why all three: the `performance-and-caching` skill's BROWSER.md). Decode each with frame-review's `verify_delivery.py --bg <ground> --loop`: the ground must come back as the token and the last frame must equal the first.
3. the contact sheet of the decoded master
4. the final shot list and the exact runtime
5. the source folder and the commands that reproduce the render
6. the list of real assets used, with sources and licences
7. two lines on the motion language (the carrier, the curves, the camera)
8. what still needs a human eye, and any compromise you made
9. optional extras from the same timeline: a cover still at another size (2000×800 article cover, 1280×720 thumbnail) as a format of the same scene, and a GIF preview for a README or a post: `ffmpeg -i out/16x9.mp4 -vf "fps=12,scale=420:-1:flags=lanczos,hqdn3d=4:4:6:6,split[a][b];[a]palettegen=max_colors=64:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle" out/preview.gif` (keep it under ~4 MB)
   **A looping cover GIF** (a newsletter or post cover that moves): animate only the one element the user named, nothing else; rotate the loop so the first frame shows the finished picture (inboxes and link previews show frame 1 as a still); encode a flat image with no dithering (`palettegen=max_colors=128:stats_mode=full` then `paletteuse=dither=none`), which otherwise adds flicker to every frame; then measure, don't eyeball: the seam (mean difference between the last and first frame, target 0.0-0.3 on 0-255 grey at 216 px) and the excursion (the largest difference of any frame from frame 0, about 0.7-2.8; near 0 means nothing visible moves; never measure at the halfway frame, where a sine is back at zero). Look at it at 240 px wide, the inbox size, and check the uploaded link still ends in `.gif`. Animating a still image: mask the named element by colour, soften the mask's edge, change only those pixels (a video model asked to hold the camera still pushes in anyway; code is the only way to lock it). In ffmpeg's `eq` filter add `eval=frame`, or the expression is evaluated once and nothing moves.
10. the production log: every input and its source and licence; what made the pixels and the sound for each shot (code, supplied footage, which external model and version); model and service usage and cost, render time, revision count; the human decisions; claims still unverified

Credit honestly. "One prompt", "all code", "no external assets" and "no human edits" are four separate claims: state only the ones that are true, and say what the audio is (synthesized, supplied, generated, voiced).

Do not call a film done because the encoder exited 0: it is done when the evidence says it works.

## Long and unattended runs

A big film (a music video, a multi-minute short) can run for hours, but only with gates and evidence. Render it with `render.mjs full --chunk 10` so a stopped render resumes where it left off, and with `--gpu` when it is 3D or shader-heavy. Before splitting chapters across subagents, write `ANIMATION_GUIDE.md` (the house style in code: helpers, palette, type, motion classes) and `STORYBOARD.md` (the shared map), so every subagent animates the same film; each one owns its chapter file and nothing else. To keep the review loop running without the user, call the Skill tool with "frame-review": it describes a goal with a stop rule. Irreversible brand decisions still wait for the user at the gates. **Stop a loop that isn't converging:** when the same error or the same failed check comes back twice in a row after a fix, stop patching, write what was tried in `review-log.md`, re-read the code path from the top at higher effort, and change the approach; a third identical patch is a runaway loop, not persistence.

## Taking notes from the user

The user directs; you engineer. Turn every note into a change you can point at, in camera and timing words: "slow every zoom to 0.7x", "hard cut here", "push in on the button", "hold the number 0.5 s longer". A vague note ("make it pop") gets one clarifying question, or two or three still options to pick from. Change numbers, not structure, unless the note asks for a new shot: re-architecting a timeline to fix a duration quietly rewrites choreography the user already approved. Re-render only the affected seconds (`render.mjs sheet --from a --to b`, `full --range a:b`) and show the new sheet.

## Not a video

An interactive page (an engine you take apart in the browser, a playable scene, an explorable lab) is a different deliverable: these skills make films. When the user wants both, build the page so its state is a function of `t` too, then render a guided tour of it as the film. A page that must export a video in the viewer's own browser (no server) can encode with ffmpeg.wasm (`@ffmpeg/ffmpeg`; its core is GPL): browser only (it no longer runs in Node), about 12-25x slower than native ffmpeg in its own benchmark, inputs capped at 2 GB, and its faster multithread core needs a cross-origin-isolated page (COOP and COEP headers) for `SharedArrayBuffer`. Our own renders always use native ffmpeg.

## When to use a framework instead

The default engine is one HTML file with `window.seek(t)`, rendered by Playwright and ffmpeg: zero framework, every frame a pure function of time. Opus reaches for exactly this on its own, and it is the smallest system that works. Reach for a framework only when the brief needs what it adds:

| Need | Engine |
|---|---|
| a series of data-driven videos from one template, React components reused from the product | Remotion (`npx skills add remotion-dev/skills`); its licence is free for individuals, non-profits and companies of up to three employees, and a for-profit company of four or more needs a paid Company License: say so before choosing it. It also ships a large library of ready-made WebGL effects (`@remotion/effects`: light leaks, halftone, progressive blur and pixelate, pixel dissolve, glow, chromatic aberration and more) and map techniques, a reason to pick it when a brief leans on those |
| an existing HyperFrames project, its registry blocks (code diffs and morphs, flowcharts, charts, shader transitions), calibrated media treatments (VHS, 8 mm, print, CRT, ASCII), captions or audio-mixing tools | HyperFrames (`npx skills add heygen-com/hyperframes`) |
| how something works (an algorithm, a protocol, a mechanism) shown as an invented machine in isometric line art, 2D or turning in 3D, with WebGL fire, water or light | `seek-engine` with its `ISOMETRIC.md` and the isometric toolset (`templates/isokit/`); size it first (a 40-80 part figure is 30-90 min, a dense one hours) |
| a math or physics explainer built from equations and graphs | Manim (the `manim-video` skill in browser-use/video-use), voiced with the voiceover skill |
| a layered editor the agent drives (video layers, keyframes, shaders and audio in one local project) | Tesseract by Mirage (`npx skills add mirage-hq/Tesseract`); proprietary terms, its CLI is a downloaded binary |
| editing existing footage: cutting a talking-head clip, adding subtitles, graphics and music to it | a footage editor: HyperFrames `talking-head-recut` / `embedded-captions`, or browser-use/video-use |
| a format a HyperFrames community skill already templates: two apps on a photographed foldable (`duo`), an X profile as a licence card (`x-posting-license`), a Strudel track with its code lighting up (`prod-by-claude`), a film of the user's own sessions with the agent (`session-story`, `day-in-my-life`), a photo or clip repainted as brushwork (`p5-paint-animation`) | `npx skills add heygen-com/hyperframes-community-skills --skill <name>` |
| everything else | `seek-engine` |

Every rule in these skills (pure function of time, beat grid, stills first, contact-sheet review, caused sound) applies whichever engine renders the frames.

HyperFrames traps: an `<audio>` without an `id` is silently left out of the mix; a property written only on the `from` side of a `fromTo` (`{opacity: 1, scale: 0}` to `{scale: 1}`) is dropped when a parallel worker seeks mid-tween, so the element vanishes in the render though the snapshot looks right: repeat it on the `to` side; `font-family` set in an external stylesheet isn't embedded at render, so keep CSS inline; the root's `data-width`, `data-height` and `data-duration` are read as static attributes, so change them when the size or length changes; and a snapshot can differ from the render, so pull the peak frames from the rendered MP4.

Remotion traps that cost real time: its master is limited-range BT.601 and untagged, so convert it once with `scale=in_range=tv:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709` or a `#0a0a0a` ground comes back `#171717` (check with frame-review's `verify_delivery.py --bg`); its bundled ffmpeg has no `tmix`, `select` or `tile`, so blend motion blur with a full ffmpeg; `npx remotion still` re-bundles on every call, so bundle once and call `renderStill` per frame; stills don't forward console logs, so print measurements into the frame; `interpolateColors` can't parse `color-mix()`; in a monorepo pin every `remotion` and `@remotion/*` package to one exact version and never let the video workspace re-resolve the app's Tailwind.

## Effort

Match effort to the stage: storyboard, message and hook at low (fast back-and-forth with the user in the loop); building scenes at medium; the review loop, retiming and final polish at high (checking every frame pays off here); a whole film made unattended at xhigh or max. A launch whose first three seconds carry everything wants max on the hook. Re-renders and number tweaks are fine at medium.
