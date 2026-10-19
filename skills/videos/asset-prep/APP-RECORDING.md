# Recording a web app with Playwright

A scripted, repeatable demo of one flow in your own web app (signup, onboarding, a settings flow, a dashboard interaction): Playwright drives the app in headless Chromium, and the output is an MP4 with a title card, scene subtitles, a visible cursor and optional narration. From [coreyhaines31/marketingskills, video] `references/product-demo-recording.md` (MIT), which credits "a contribution by @klepfish (PR #345)"; the contributor's recorder and narrator scripts are pinned at github.com/coreyhaines31/marketingskills/tree/37cb655f4017ccec2680f9fa5f3c13e6eed36a7d/skills/feature-demo/scripts. Playwright facts are from playwright.dev, cookie facts from MDN. Once captured, the recording is footage: the asset-prep [SKILL.md](SKILL.md) and seek-engine's DEPTH-AND-FOOTAGE.md take it from there.

## When it pays off

[coreyhaines31/marketingskills, video]

| Situation | Format |
|---|---|
| Feature flow you'll re-record every release | Scripted in-app recording (this file) |
| Narrated walkthrough where personality matters | Live screen recording (Loom, Screen Studio, Tella) |
| Homepage hero or launch video with motion design | A code-built film over screen captures (make-video) |
| Talking-head explainer with UI cutaways | AI avatar plus screen recording ([marketing-video AVATARS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/marketing-video/AVATARS.md)) |
| Sales demo tailored to one prospect | Live recording, or an interactive demo tool |

- **Use it when** the UI changes often and the video must be regenerated in minutes, runs must be pixel-identical (same data, same pacing, no mouse jitter), the demo must run against a local or staging build before launch, or several flows need the same branded look.
- **Skip it** for a one-off video where a human recording would take ten minutes.

## Before recording

[coreyhaines31/marketingskills, video]

1. **Audience and product:** prospects, existing customers, developers or internal QA. This sets caption tone (jargon-light for prospects, implementation detail for developers) and pacing.
2. **Entry URL and scene list:** one line per scene. The scene list doubles as the subtitle captions, so write each line as the caption you want on screen.
3. **Auth state:** does the demo start logged in? Plan a seeded user plus a programmatic login or injected cookies.
4. **Narration:** default to silent with subtitles; add voiceover only if asked.
5. **Brand:** app name, demo domain for the fake URL bar, title-card background and accent colours, optional logo SVG. Pull them from `.agents/product-context.md` when it exists (the source calls the file `.agents/product-marketing.md`; see [anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md)).

## The workflow

1. **Bring the app up** at a stable URL (for example `http://127.0.0.1:8000`). Any stack works: the recorder only needs HTTP and a page that renders in headless Chromium. Open it in a real browser first and click through the flow once. [coreyhaines31/marketingskills, video]
2. **Tooling:** `npx playwright install chromium --with-deps` and `which ffmpeg || brew install ffmpeg` (or `apt-get install ffmpeg`). The source's scripts need Node 18+; this repo's [video-setup](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-setup/SKILL.md) doctor checks Node 20+ and the rest.
3. **The context.** `viewport` and `recordVideo.size` set to the same size (1280×800 is the source's default), `bypassCSP: true` so injected overlays aren't blocked, `ignoreHTTPSErrors: true` for a self-signed cert, and an `addInitScript` that injects the overlay (subtitle bar, step badge, fake cursor) on every page load. Record `Date.now()` when the context starts: every subtitle logs its offset from that moment, which is what lets narration line up later. [coreyhaines31/marketingskills, video]
4. **Set the size, or the video shrinks.** Without `recordVideo.size`, "the size will be equal to viewport scaled down to fit into 800x800. If viewport is not configured explicitly the video size defaults to 800x450"; the recorded frame rate "Defaults to 25" (https://playwright.dev/docs/api/class-browser#browser-new-context). "Videos are saved upon browser context closure": `await browserContext.close()` before reading the file (https://playwright.dev/docs/videos).
5. **Script the flow as steps.** Wrap each scene in a `step(label, caption, fn, { mode })` helper that shows the caption in the subtitle bar and logs `{ step, text, offsetMs }` to a timings array, waits for the narration (see step modes), runs the Playwright actions in `fn`, and on failure saves a screenshot named after the label. Captions of 50-80 characters read well and keep pauses short; show a "STEP N / TOTAL" badge; reset backend state at the top when the demo uses a fixed account; use explicit waits (`waitForURL`, `getByRole(...).waitFor()`) rather than fixed sleeps. [coreyhaines31/marketingskills, video]
6. **Make the cursor visible.** Playwright fires DOM events with no visible pointer, so inject a fake cursor and wrap actions: `clickWithCursor(locator)` scrolls the target into view, moves the cursor to its centre, plays a click ripple, then clicks; `fillWithCursor(locator, value)` does the same, then types. Keep targets above the subtitle bar so it never covers the element being clicked. [coreyhaines31/marketingskills, video] The source moves the cursor in "~500 ms"; frame-review's [frame-review TELLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/frame-review/TELLS.md) I6 calls straight paths at constant speed a tell and fixes it with an arc of 15-25% of the path and at most one click per 30 frames. Follow I6.
7. **Title card and browser chrome.** Render a full-frame PNG with the logo (or a text wordmark) on the brand background with an accent underline and hold it at the start; it also becomes the preview thumbnail. Render a tab strip and URL bar showing `demoDomain + path` as a separate PNG and stack it on the recording with ffmpeg, so the real localhost URL never shows. [coreyhaines31/marketingskills, video]
8. **Export.** Write the timings array to a JSON sidecar next to the `.webm`. For a silent version with subtitles and chrome [coreyhaines31/marketingskills, video]:

```bash
ffmpeg -y -i recording.webm -i browser-frame.png \
  -filter_complex "[1:v][0:v]vstack=inputs=2" \
  -c:v libx264 -crf 23 out.mp4
```

Trim the blank first-paint frames from the front (start about 150 ms before the first subtitle's offset) and export at the target platform's aspect ratio.

## Step modes

[coreyhaines31/marketingskills, video] Each step picks when narration plays relative to its action; this keeps audio and picture aligned, the same rule as the voiceover skill's "the audio is the clock".

| Mode | Order | Use for |
|---|---|---|
| `before` (default) | Caption and narration finish, then the action runs | A click that navigates to a new page; skip or dismiss, then navigate; a click that opens a modal you want to describe |
| `during` | Narration and action run in parallel; both must finish | Filling a form or typing; dragging; hovering or opening a menu without navigating; landing on a final state (dashboard, success screen) |
| `after` | Action runs, then caption and narration | Describing a state the action just produced (rare) |

- **Why `before` is the default:** if a navigating click fires early, the speaker keeps describing the old page while the viewer is already on the new one, and the whole video reads one scene off.
- **Pick per step.** Narration clips usually run 3-7 seconds while actions take 1.5-2 seconds; with one fixed mode for every step the two drift apart over a long demo.

## Local-app gotchas

- **`Secure; SameSite=None` cookies over plain HTTP.** MDN: "Insecure sites (http:) cannot set cookies with the Secure attribute. The https: requirements are ignored when the Secure attribute is set by localhost", and `SameSite=None` needs `Secure` ("The Secure attribute must also be set when using this value"; https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie). So on a LAN IP or a custom dev domain the session never sticks and every navigation bounces to login, while `http://localhost` is fine. Fix: drop `Secure` for the recording run and switch to `SameSite=Lax` at the same time (often an env flag), or serve HTTPS with a self-signed cert and `ignoreHTTPSErrors: true`. [coreyhaines31/marketingskills, video] Cookie handling for real sessions: [browser-automation SIGNED-IN-SESSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-automation/browser-automation/SIGNED-IN-SESSIONS.md).
- **Strict CSP blocks the overlay.** A `style-src 'self'` policy without `unsafe-inline` blocks the inline styles on the subtitle bar and cursor: keep `bypassCSP: true`. [coreyhaines31/marketingskills, video]
- **An SPA that crashes on boot records a blank video.** A missing env var that throws during bootstrap (a realtime client or analytics constructor given an empty key) leaves the page blank and the recorder captures it without complaint. Confirm the page renders in a real browser first; front-trimming can't rescue a broken page. [coreyhaines31/marketingskills, video]
- **State accumulates across runs.** Leftover rows from earlier runs make text selectors ambiguous (the new modal option and a leftover card both match). Reset at the top of the script only the rows the demo touches, with your stack's tool (a scoped SQL operation or an admin API call; the source's Rails/PHP branches are skipped for this stack), using the array form of `spawnSync` so the shell doesn't expand variables. A demo that signs up a fresh random email each run can skip this. [coreyhaines31/marketingskills, video]
- **Env vars pointing at production.** Some agent sessions export `DB_HOST` or `DB_PASSWORD` for a production database, and any reset or seed command that inherits the shell environment will hit prod. Pass an explicit env with the local database host to child processes instead of forwarding `process.env`. [coreyhaines31/marketingskills, video]
- **Revert recording-only config** (cookie flags, env overrides) before committing, so the diff contains only the recorder script. [coreyhaines31/marketingskills, video]

## Optional narration

[coreyhaines31/marketingskills, video] Narration reuses the subtitle captions as the script.

1. **One clip per caption** from a TTS provider (in this repo, the [voiceover](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/voiceover/SKILL.md) skill's script), cached by step so re-records skip the API.
2. **Real clip durations are the step waits.** Measure each clip with `ffprobe` and feed it into the `before` / `during` timing. Without TTS, estimate about 12 characters per second.
3. **Narrate the title card** with a one-sentence intro in the same voice.
4. **Mux with ffmpeg:** delay each clip to its subtitle offset (`adelay`), push back any clip that would overlap the previous one, mix with `amix`, and pad the video tail (`tpad=stop_mode=clone`) if audio runs past the picture.

The TTS key lives in an environment variable (for example `ELEVENLABS_API_KEY`) or a secret manager, loaded at runtime; never ask for it in chat and never write it into the repo or a committed `.env`. If it isn't set, say which variable to set and fall back to a silent recording. If a user pastes a key into chat anyway, don't use it: tell them to rotate it, since chat logs aren't a safe place for secrets.

## Prove it

[coreyhaines31/marketingskills, video] The page renders correctly in a real browser before recording; the session persists across navigations (cookie check); each step uses the right mode; the cursor is visible on every click and fill; subtitles are readable and never cover the active element; the fake URL bar shows the public domain; the title card works as a thumbnail; recording-only config is reverted; the MP4 is handed back with a one-line summary of what it shows. Add: `ffprobe` reports the MP4 at the size you set in `recordVideo.size` (plus the chrome strip), not 800 wide.
