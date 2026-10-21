# Videos skills

Make, edit, render and review videos. The code-built film studio and tool-based generation, avatars and editing keep their own workflows. Details in the [main README](../../README.md#videos).

12 skills.

Category membership is the primary home, not an instruction to install every skill here. Apply the selected job's routes and checks. Required selected-branch dependencies and optional related skills remain distinct.

## Skills

| Skill | Covers |
|---|---|
| [asset-prep](asset-prep/SKILL.md) | Screens, brand extraction, recording and prepared assets; renderer integration links to seek-engine. |
| [beat-grid](beat-grid/SKILL.md) | Measured music and the shared picture/sound clock |
| [frame-review](frame-review/SKILL.md) | Review and measured tells, separate decoded-file checks, full-text DOM read sampling and explicitly measured sync. |
| [make-video](make-video/SKILL.md) | Gated film production with engine selection before setup; shared story/review gates and engine-specific runtime contracts. |
| [marketing-video](marketing-video/SKILL.md) | Marketing video with tools: AI generation, avatars, repurposing and transcript-grounded cards over complete programs. Source-scoped camera direction presets distinguish movement, lens, framing, focus, time and transitions. |
| [seek-engine](seek-engine/SKILL.md) | Pure-time rendering, measured motion, drawing/hero templates, anatomy/cinematic film adapters and a sourced word-fold CoAnimator kit; live figures link to frontend. |
| [shotlist](shotlist/SKILL.md) | Storyboards, measured composition/type/demo/transitions, separate beat-role and composition-diagram references, and sourced technique catalogues. Generated-footage camera directions link to marketing-video. |
| [sound-pass](sound-pass/SKILL.md) | Picture-driven effects, transformed peak alignment, separate music and measured sound chapters, selected mastering profiles. |
| [video-brief](video-brief/SKILL.md) | Briefs, source-qualified measured judgment, brand/world choices and narrated explainers. |
| [video-help](video-help/SKILL.md) | Choosing a video skill and phase, with shared production gates and renderer-specific contracts. |
| [video-setup](video-setup/SKILL.md) | Complete unflagged Node22+ toolchain and installed ffmpeg/browser capability checks. |
| [voiceover](voiceover/SKILL.md) | Narration and cached takes, conditional caption mapping, bounded subtitle rows and source-qualified mouth timing. |

## Related task routes

These are discovery links; follow only the selected task's requirements.

- [isometric-figures](../web-ui/isometric-figures/SKILL.md)
- [ad-creative](../marketing/ad-creative/SKILL.md)
- [social-media](../marketing/social-media/SKILL.md)

## Code-made production workflow

Every frame is code. No After Effects, no video editor: the agent writes a program, the program draws frames, a renderer turns them into an MP4, and a review loop decides whether anyone should see it.

Everyone shares the same "one prompt" video, and most first tries look the same: a centred title on a gradient, everything fading in, a logo at the end. The prompt is about 10% of a good film. The other 90% is the harness around the model:

- **No brief:** the model fills every missing decision with its safest default. → `video-brief` separates facts from choices.
- **No reference:** it falls back on its own look. → `video-brief` turns a reference into a style guide: the grammar, never the content.
- **No real assets:** it draws your product from imagination, and it looks fake. → `asset-prep` captures the real screens, colours, fonts and logo.
- **No clock:** sound and picture drift; cuts miss the beat. → `beat-grid` (or `voiceover`) makes one clock that drives both.
- **No plan:** events pile up and nothing reads. → `shotlist` puts states and the viewer's reads on the grid.
- **No determinism:** renders flicker and fixes mean starting over. → `seek-engine`: every frame is a pure function of time.
- **No eyes:** it never looks at what it made. → `frame-review`: counters that must read zero, contact sheets, scores, three fixes per round.
- **Silence, or sound that isn't connected:** → `sound-pass` places every sound on the frame that causes it.

Run `/video-setup` once per machine; not sure where to start, `/video-help`. Then start with `make-video` ("make a 20-second launch video for https://…"). It runs the studio as gates and calls the rest:

```
video-brief (+ asset-prep)  →  beat-grid / voiceover  →  shotlist  →  seek-engine: stills  →  build
      →  frame-review (loop until it passes)  →  sound-pass  →  render every format  →  frame-review final checks
```

Each gate writes a file in `films/<slug>/` (`brief.md`, `style-guide.md`, `audio/beats.json`, `shotlist.md`, `index.html`, `review-log.md`), so a later session, a subagent or a colleague can pick the film up where it stopped.

**Requirements:** Node 22+ for the complete unflagged CDP toolchain, ffmpeg with libx264, uv (or Python 3 with numpy), and Playwright's Chromium. Optional: `ELEVENLABS_API_KEY` for narration, `FAL_KEY` for generated imagery, both in the project's `.env`.
