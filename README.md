# Video skills

Make videos with a coding agent, where every frame is code. No After Effects, no video editor: the agent writes a program, the program draws frames, a renderer turns them into an MP4, and a review loop decides whether anyone should see it.

Works in Claude Code, Codex and any agent that reads Agent Skills: the skills live in [`.claude/skills/`](./.claude/skills), and `.agents/skills/` holds symlinks to them for Codex and other harnesses. Each skill has a docs page in [`docs/`](./docs).

## Why these skills exist

Everyone shares the same "one prompt" video, and most first tries look the same: a centred title on a gradient, everything fading in, a logo at the end. The prompt is about 10% of a good film. The other 90% is the harness around the model:

- **No brief:** the model fills every missing decision with its safest default. → `video-brief` separates facts from choices.
- **No reference:** it falls back on its own look. → `video-brief` turns a reference into a style guide: the grammar, never the content.
- **No real assets:** it draws your product from imagination, and it looks fake. → `asset-prep` captures the real screens, colours, fonts and logo.
- **No clock:** sound and picture drift; cuts miss the beat. → `beat-grid` (or `voiceover`) makes one clock that drives both.
- **No plan:** events pile up and nothing reads. → `shotlist` puts states and the viewer's reads on the grid.
- **No determinism:** renders flicker and fixes mean starting over. → `seek-engine`: every frame is a pure function of time.
- **No eyes:** it never looks at what it made. → `frame-review`: counters that must read zero, contact sheets, scores, three fixes per round.
- **Silence, or sound that isn't connected:** → `sound-pass` places every sound on the frame that causes it.

## Install (30-second setup)

The skills are plain folders. Claude Code reads `.claude/skills/`; Codex and other Agent Skills harnesses read `.agents/skills/`, so each skill is linked into both.

<details>
<summary><strong>One project</strong> (Claude Code + Codex)</summary>

```bash
git clone https://github.com/Quegenx/video-skills /tmp/video-skills
mkdir -p .claude/skills .agents/skills
cp -R /tmp/video-skills/.claude/skills/* .claude/skills/
for s in .claude/skills/*/; do n=$(basename "$s"); ln -sfn "../../.claude/skills/$n" ".agents/skills/$n"; done
```

</details>

<details>
<summary><strong>Every project on this machine</strong></summary>

```bash
mkdir -p ~/.claude/skills ~/.agents/skills
for s in /tmp/video-skills/.claude/skills/*/; do ln -sfn "$s" ~/.claude/skills/; ln -sfn "$s" ~/.agents/skills/; done
```

</details>

<details>
<summary><strong>Any other agent</strong> (skills.sh)</summary>

```bash
npx skills@latest add Quegenx/video-skills -a <agent>   # cursor, opencode, windsurf, ...; omit -a to choose
```

</details>

Then run `/video-setup` once per machine. Not sure where to start? `/video-help`.

## The flow

Start with `make-video` ("make a 20-second launch video for https://…"). It runs the studio as gates and calls the rest:

```
video-brief (+ asset-prep)  →  beat-grid / voiceover  →  shotlist  →  seek-engine: stills  →  build
      →  frame-review (loop until it passes)  →  sound-pass  →  render every format  →  frame-review final checks
```

Each gate writes a file in `films/<slug>/` (`brief.md`, `style-guide.md`, `audio/beats.json`, `shotlist.md`, `index.html`, `review-log.md`), so a later session, a subagent or a colleague can pick the film up where it stopped.

## Skills

### User-invoked

- **[video-help](./.claude/skills/video-help/SKILL.md)**: Ask which video skill or flow fits your situation. A router over the set.
- **[video-setup](./.claude/skills/video-setup/SKILL.md)**: Check and install the toolchain the video skills need. Run once per machine.

### Model-invoked

- **[make-video](./.claude/skills/make-video/SKILL.md)**: Direct and render a video from code as a gated production. The entry point and the map of the flow.
- **[video-brief](./.claude/skills/video-brief/SKILL.md)**: The director's brief (facts vs choices, banned looks, the copy budget) and a style guide: look, motion language and video type as separate layers, the same film in several styles, restyles. Holds the spec patterns behind the films people copied.
- **[asset-prep](./.claude/skills/asset-prep/SKILL.md)**: Real screens and brand facts captured from a site; cutouts, layers, textures and upscaling of supplied images; generated base footage to trace over. Official logos fetched as SVG.
- **[beat-grid](./.claude/skills/beat-grid/SKILL.md)**: Find, scan and measure music into `audio/beats.json`, the clock for picture and sound; per-frame band energy for audio-reactive visuals; word-by-word lyric timing.
- **[voiceover](./.claude/skills/voiceover/SKILL.md)**: ElevenLabs narration with word timings, per-line cache, pronunciation fixes and pause trimming, plus lip sync for a talking character.
- **[shotlist](./.claude/skills/shotlist/SKILL.md)**: A concept that passes ownership tests, a measured precedent per beat, beat structures by format, the viewer's reads on the grid, one carrier object, techniques drawn from a 273-entry library, three storyboard variants.
- **[seek-engine](./.claude/skills/seek-engine/SKILL.md)**: The `seek(t)` render contract, the starter film, the motion number sheet and the renderer (stills, sheets, strips, motion-blurred MP4 in every format). A measured corpus from 53 professional moments, the 12 measured eases, a seekable 3D hero and iOS UI builders.
- **[frame-review](./.claude/skills/frame-review/SKILL.md)**: The smoke test's zero counters, contact sheets, phone test, a catalogue of AI-video tells, critic lenses with a verify pass, a rubric and ship gate, and sync and loudness checks on the delivered file. Page-chrome lint and file-level gates (end hold, flat frames, audio audit) and a blind A/B review page.
- **[sound-pass](./.claude/skills/sound-pass/SKILL.md)**: Synthesized SFX on measured peaks, scaled to their cause, with a progress motif; music and voice mixed; mastered to -14 LUFS and -1 dBTP; the sound norms of top launch films.

## Requirements

Node 20+, ffmpeg with libx264, uv (or Python 3 with numpy), and Playwright's Chromium. Optional: `ELEVENLABS_API_KEY` for narration, `FAL_KEY` for generated imagery, both in the project's `.env`.
