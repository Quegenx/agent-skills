---
name: video-setup
description: Check and install the toolchain the video skills need (Node, ffmpeg, uv, Playwright Chromium) and the optional API keys. Use when preparing a machine for the video workflow.
disable-model-invocation: true
---

# Video setup

Run the doctor from the project root:

```bash
bash <this skill>/scripts/doctor.sh
```

It checks Node 22+, an ffmpeg with libx264 and the `tmix` filter (motion blur), `uv` (or python3 with numpy), and a Playwright Chromium, and prints the fix for anything missing. Apply the fixes the user approves, then run it again until every required line reads `ok`:

| Missing | Fix |
|---|---|
| Node | `brew install node` |
| ffmpeg, or one without libx264 / tmix | `brew install ffmpeg` (inspect the installed build for tmix; bundling alone does not establish filter availability) |
| uv | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| Chromium | inside any film folder: `npm install && npx playwright install chromium` |

Optional keys, only when a film needs them, in the project's `.env` (never in a prompt or a commit; make sure `.env` is gitignored):

- `ELEVENLABS_API_KEY`: narration and cloned voices (voiceover)
- `FAL_KEY`: generated images or base footage (asset-prep)

Optional engines, only when a brief calls for one (see make-video): `npx skills add remotion-dev/skills` for Remotion, `npx skills add heygen-com/hyperframes` for HyperFrames. HyperFrames requires Node.js 22 or later and FFmpeg (github.com/heygen-com/hyperframes README), matching the complete toolchain check: run `node --version` before choosing it.

Finish by telling the user what is ready and that `make-video` is the place to start ("make a 15-second launch video for …").

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

## Prerequisite correction

The CDP helpers directly use global `WebSocket`. Node documents it as unflagged from 22.0; the old complete-toolchain check accepted Node 20+ without its required flag. This does not raise every independent script minimum. [https://nodejs.org/docs/latest-v22.x/api/globals.html#class-websocket]

## Prove it

The doctor reports actual installed capabilities, optional secrets are never printed, and the selected engine requirements are checked.
