---
name: video-setup
description: Check and install the toolchain the video skills need (Node, ffmpeg, uv, Playwright Chromium) and the optional API keys. Run once per machine.
disable-model-invocation: true
---

# Video setup

Run the doctor from the project root:

```bash
bash <this skill>/scripts/doctor.sh
```

It checks Node 20+, an ffmpeg with libx264 and the `tmix` filter (motion blur), `uv` (or python3 with numpy), and a Playwright Chromium, and prints the fix for anything missing. Apply the fixes the user approves, then run it again until every required line reads `ok`:

| Missing | Fix |
|---|---|
| Node | `brew install node` |
| ffmpeg, or one without libx264 / tmix | `brew install ffmpeg` (a Remotion-bundled ffmpeg lacks tmix) |
| uv | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| Chromium | inside any film folder: `npm install && npx playwright install chromium` |

Optional keys, only when a film needs them, in the project's `.env` (never in a prompt or a commit; make sure `.env` is gitignored):

- `ELEVENLABS_API_KEY`: narration and cloned voices (voiceover)
- `FAL_KEY`: generated images or base footage (asset-prep)

Optional engines, only when a brief calls for one (see make-video): `npx skills add remotion-dev/skills` for Remotion, `npx skills add heygen-com/hyperframes` for HyperFrames. HyperFrames requires Node.js 22 or later and FFmpeg (github.com/heygen-com/hyperframes README), above the doctor's Node 20+ check: run `node --version` before choosing it.

Finish by telling the user what is ready and that `make-video` is the place to start ("make a 15-second launch video for …").
