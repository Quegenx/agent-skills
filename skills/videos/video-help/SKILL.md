---
name: video-help
description: Routes a video request to the relevant skill and production phase. Use when choosing a video skill or resuming the film workflow.
disable-model-invocation: true
---

# Video help

You don't remember every skill, so ask. Before stating what a skill does or recommending a step be skipped, read that skill's SKILL.md: the summaries here are for orientation only.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

## The main flow: idea → film

Most work travels this route. Start it with **`/make-video`**, which runs the gates and calls the rest for you:

1. **`/video-brief`**: facts vs choices, the one sentence, banned looks, and a style guide from a reference. When the film shows a real product, **`/asset-prep`** collects the real screens, colours, fonts and logo first.
2. **The clock.** **`/beat-grid`** measures a supplied track or picks a tempo. Narrated films use **`/voiceover`**: the voice's word timings become the clock, with music under them.
3. **`/shotlist`** puts the states and the viewer's reads on that clock, with three storyboard variants when the direction is open.
4. **`/seek-engine`** builds it: stills for every shot first, then motion between approved stills.
5. **`/frame-review`** loops until the evidence passes: smoke counters at zero, every score 8+, the three worst defects fixed per round.
6. **`/sound-pass`** once picture timing is locked, then every format is rendered from the same timeline and frame-review checks the delivered files.

## Jumping in mid-flow

| You have | Reach for |
|---|---|
| a vague idea, or "make it insane" | `/video-brief` (it asks for what it can't find) |
| a reference video to match | `/video-brief` (the style guide part) |
| a URL and no assets | `/asset-prep` |
| posters or images to bring to life | `/asset-prep` (cutouts, layers, textures), then `/make-video` |
| a song and a rough idea | `/beat-grid`, then `/shotlist` |
| a music video or visualizer that should react to the song, or a lyric video | `/beat-grid` (`bands` for reactivity, word-by-word lyric timing), then `/shotlist` |
| explain how something works as a crafted machine (isometric, 2D or 3D) | `/make-video`; the build is `/seek-engine`'s `ISOMETRIC.md` |
| a script to narrate | `/voiceover` |
| a film that feels rushed or confusing | `/shotlist` (the reads), then `/frame-review` |
| a render that flickers, differs between runs or jumps at the loop | `/seek-engine` (the contract), then `/frame-review` (the smoke test) |
| director's notes on a finished render | `/make-video` (taking notes), which re-renders only the affected seconds |
| silence, or sound that doesn't land | `/sound-pass` |
| a new machine | `/video-setup` |

## Phase boundaries

A film is a long job. Every gate leaves a file in `films/<slug>/` (`brief.md`, `style-guide.md`, `audio/beats.json`, `shotlist.md`, `index.html`, `review-log.md`), so at any gate you can clear the context and resume from the files: a fresh session reads `review-log.md` first. For a long autonomous run, split chapters across subagents only after an `ANIMATION_GUIDE.md` exists, so they all code in one style.

## Engines

The default is `seek-engine` (one HTML file, `seek(t)`, Playwright and ffmpeg). Remotion and HyperFrames are for briefs that need their specific strengths; `/make-video` says when. The shared brief, story, timing and review gates apply across engines; renderer commands and runtime contracts apply to the selected engine. [Quegenx/agent-skills, make-video/ENGINES.md]
