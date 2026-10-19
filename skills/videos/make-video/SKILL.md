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

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

**Required skills by phase:** This studio composes video-brief, shotlist, seek-engine or the selected engine contract, frame-review and sound-pass. Select asset-prep for real product assets and beat-grid/voiceover for the chosen clock. These are workflow dependencies, not requirements to install another rendering framework. Read the selected phase before executing it. [Quegenx/agent-skills, make-video/SKILL.md#the-gates]

## Setup

Choose the renderer through [ENGINES.md](ENGINES.md) before scaffolding. The setup and `render.mjs` commands below describe the default seek-engine studio; an existing Remotion or HyperFrames project follows its engine contract while keeping the shared production gates. [Quegenx/agent-skills, make-video/ENGINES.md]

1. For the default seek-engine studio, scaffold the film's studio folder from the project root: `bash <this skill>/scripts/new-film.sh <slug>`, then `npm install` inside `films/<slug>/`. If tools are missing, tell the user to run `/video-setup`. The scaffold writes the film's house rules (`AGENTS.md`, which Claude Code reads through `CLAUDE.md`): the render contract, the banned looks and the review loop, read on every run so they never need repeating. When the film lives inside an existing product repo, build it beside what is there and never regress an existing composition.
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
4. **Stills before motion.** For the default engine, call the Skill tool with "seek-engine"; otherwise follow the selected engine's contract. Build the composition, and render one still per shot (`render.mjs still`). Fixing a still costs seconds; fixing a render costs minutes. Get the stills approved.
5. **Build, then review until it passes.** Animate between the approved stills, then render the animatic (`render.mjs full --scale 0.5 --sub 1`) and fix pacing before any polish. Before the full render, render the **hardest 2-4 seconds** at full quality (`render.mjs full --range a:b --sub 8`) and check them frame by frame (`strip a b`): contacts, occlusion, speed, seams, captions, sync. If the hardest stretch doesn't hold, the full render won't either. Call the Skill tool with "frame-review" after every meaningful change. It owns the loop: the smoke counters read zero, the contact sheet scores 8+ on every axis, and the three worst defects are fixed per round. For a launch film or anything long, run its critic rounds (director, art/copy/UI and sound lenses, a verifier, the 11-dimension rubric) until the ship gate passes or 5 rounds are used. At the cap, report unresolved gates as incomplete.
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

Follow [DELIVERY.md](DELIVERY.md) for deliverables and [ENGINES.md](ENGINES.md) for engine selection, then [REMOTION.md](REMOTION.md) if selected. The review gate must pass; reaching a round cap means stop and report remaining failures, not certify delivery.

## Long and unattended runs

A big film (a music video, a multi-minute short) can run for hours, but only with gates and evidence. Render it with `render.mjs full --chunk 10` so a stopped render resumes where it left off, and with `--gpu` when it is 3D or shader-heavy. Before splitting chapters across subagents, write `ANIMATION_GUIDE.md` (the house style in code: helpers, palette, type, motion classes) and `STORYBOARD.md` (the shared map), so every subagent animates the same film; each one owns its chapter file and nothing else. To keep the review loop running without the user, call the Skill tool with "frame-review": it describes a goal with a stop rule. Irreversible brand decisions still wait for the user at the gates. **Stop a loop that isn't converging:** when the same error or the same failed check comes back twice in a row after a fix, stop patching, write what was tried in `review-log.md`, re-read the code path from the top at higher effort, and change the approach; a third identical patch is a runaway loop, not persistence.

## Taking notes from the user

The user directs; you engineer. Turn every note into a change you can point at, in camera and timing words: "slow every zoom to 0.7x", "hard cut here", "push in on the button", "hold the number 0.5 s longer". A vague note ("make it pop") gets one clarifying question, or two or three still options to pick from. Change numbers, not structure, unless the note asks for a new shot: re-architecting a timeline to fix a duration quietly rewrites choreography the user already approved. Re-render only the affected seconds (`render.mjs sheet --from a --to b`, `full --range a:b`) and show the new sheet.

## Not a video

An interactive page (an engine you take apart in the browser, a playable scene, an explorable lab) is a different deliverable: these skills make films. When the user wants both, build the page so its state is a function of `t` too, then render a guided tour of it as the film. A page that must export a video in the viewer's own browser (no server) can encode with ffmpeg.wasm (`@ffmpeg/ffmpeg`; its core is GPL): browser only (it no longer runs in Node), about 12-25x slower than native ffmpeg in its own benchmark, inputs capped at 2 GB, and its faster multithread core needs a cross-origin-isolated page (COOP and COEP headers) for `SharedArrayBuffer`. Our own renders always use native ffmpeg.

## Effort

Match effort to the stage: storyboard, message and hook at low (fast back-and-forth with the user in the loop); building scenes at medium; the review loop, retiming and final polish at high (checking every frame pays off here); a whole film made unattended at xhigh or max. A launch whose first three seconds carry everything wants max on the hook. Re-renders and number tweaks are fine at medium.
