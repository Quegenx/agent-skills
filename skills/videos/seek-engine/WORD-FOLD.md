# Word fold

A geometric SVG strip walks across one word like a folding compass, reveals each letter behind it and becomes the final letter. The planted leg pivots on its foot; the swing leg holds back, whips forward and kicks its lower half back. The camera eases from the first bar to the whole word. This kit comes from the supplied word-fold skill, its references, engine, helpers and three sounds. [word-fold, SKILL.md and assets/kit/fold.js]

## Choose this effect

[word-fold, SKILL.md; assets/kit/fold.js; references/coanimator.md]

Use for a single word or label in this walking/folding style. The bundled alphabet is **A D E G I L N O R T**; implemented endings are **A, T, I, N**. Other letters require the glyph guide and other final letters require an ending implementation. The source's description said "any word" and referenced Animator timelines; those examples and the digit implementation are absent. They are not bundled or verified output.

The source kit is a **CoAnimator page/timeline workflow**. It exposes `window.__kcControl`, not this skill's `seek`, `configure` and `timeline` API. Do not pass it directly to `scripts/render.mjs` or claim that a bridge is supplied. CoAnimator is required only when selecting its timeline workflow, not for the other video techniques in this skill.

| The job | Read |
|---|---|
| Word setup, controls, workflow and limitations | This file |
| Add or inspect letter geometry | [glyphs.md](templates/word-fold/references/glyphs.md), [fold.js](templates/word-fold/assets/kit/fold.js) |
| Extend the strip's final letter | [endings.md](templates/word-fold/references/endings.md) |
| Select the project and inspect the player/timeline contract | [coanimator.md](templates/word-fold/references/coanimator.md), [kc-player.js](templates/word-fold/assets/kit/kc-player.js) |
| Configure the word, gaps and colors | [starter.html](templates/word-fold/assets/kit/starter.html) |
| Copy missing assets and create a word page | [init_word.py](templates/word-fold/scripts/init_word.py) |
| Measure and adjust optical gaps | [space_word.py](templates/word-fold/scripts/space_word.py) |
| Capture a frame or inspect page metadata | [capture.mjs](templates/word-fold/scripts/capture.mjs) |
| Write the preset steps track | [sfx_steps.py](templates/word-fold/scripts/sfx_steps.py) |
| Supplied footsteps and landing accent | [step-1.wav](templates/word-fold/assets/sfx/step-1.wav), [step-2.wav](templates/word-fold/assets/sfx/step-2.wav), [land.wav](templates/word-fold/assets/sfx/land.wav) |
| Effect-specific acceptance and unverified outcomes | [quality-check.md](templates/word-fold/references/quality-check.md) |

## Work in the named project

[word-fold, SKILL.md, scripts/init_word.py and scripts/space_word.py]

1. Use the CoAnimator project the user names. Do not create projects or switch the open timeline on your own. Read that app installation's `docs/timeline.md` before editing timeline JSON.
2. From `templates/word-fold/`, run `python3 scripts/init_word.py <project> WORD --color '#RRGGBB'`. Supply one word; for a phrase, use one page and timeline per word. The helper preserves existing engine/player/sound files and refuses to overwrite an existing word page. Edit the **project's** `word-fold/fold.js` when extending the alphabet or endings, not the skill's copy.
3. Choose a strip color that reads against the near-black stage and fits the supplied identity. The source keeps the letters at ink `#FAF9EF`. Colors, ink and background live in the page's `window.FOLD`; step rhythm and knee kick live in the project's `RIG`.
4. Run `python3 scripts/space_word.py <project>/word-fold/<word>.html WORD` after adding glyphs. Its default target, **18.45 local units**, is this series' house spacing, not a universal kerning rule. Open letter pairs intentionally tuck in. Read the measurement limits below before changing the palette.
5. Create a timeline through CoAnimator's timeline switcher, using `word-fold/<word>.html` as the animation. Check the installed timeline documentation before using an app API or editing its schema; the exact current `window.coa.timelines.create` signature and audio schema were not verified in this import.
6. After checking that schema, run `python3 scripts/sfx_steps.py <project> <timeline-id> word-fold/<word>.html`. It replaces its own `track-sfx-steps` track, sets timeline/animation duration from the page and sets `animationStart` to zero. Inspect the editor to confirm the intended timeline changed.
7. Apply the effect's [quality checks](templates/word-fold/references/quality-check.md). Hand over the timeline unless the user asks for a video export. Report its name, duration, strip color and any added glyph or ending.

The official [Projects guide](https://coanimator.com/docs/projects) confirms editable project files and multiple timelines. The [download page](https://coanimator.com/download) offers free use, with free exports at 720p and a watermark. The source called it a free app without stating those export limits.

## Preserve the supplied construction

[word-fold, SKILL.md, references/endings.md and assets/kit/fold.js]

- Keep the strip clipped to the letter band. Its dimensions and glyph weights have one definition in the [glyph guide](templates/word-fold/references/glyphs.md) and the engine.
- A crossbar joining a strip-made letter clips against the strip's actual legs, not an ideal letter outline, so its edges finish flush.
- Keep changing clips on `setClip`'s alternating clip paths. The source reports stale uncovered regions when changing a clip in place in Chrome. This is a source-observed workaround; no browser bug/version or reproduction was supplied.
- Keep geometry a function of the requested time, under the [canonical deterministic render rule](SKILL.md#the-contract). The player supplies the preview clock. Alternating clip IDs are bookkeeping, not proof that pixels are independent of seek history; the image comparison still has to be performed.

## Keep the source profiles explicit

| Existing default | Word-fold source | Use |
|---|---|---|
| Readable text lives in the DOM. [Quegenx/agent-skills, seek-engine, The contract] | Letters are SVG paths. [word-fold, assets/kit/fold.js] | Preserve the default; inspect this pictured lettering on rendered frames because DOM text probes do not cover it. |
| Timing and cues use beat data. [Quegenx/agent-skills, seek-engine, The contract] | Rig timing uses 30 fps reference frames with origin 151. [word-fold, references/coanimator.md] | Keep this effect's reference-frame profile distinct; do not relabel those values as beats. |
| Gradient stages are baked PNGs. [Quegenx/agent-skills, seek-engine, Looks] | The kit uses an SVG linear gradient. [word-fold, assets/kit/fold.js] | Preserve both tagged views and the existing default; keep the supplied kit's look when choosing this source profile. |
| Sound timing comes from the picture's shared data. [Quegenx/agent-skills, sound-pass, Cues come from the picture] | The source SFX script repeated rig constants. [word-fold, scripts/sfx_steps.py] | The imported helper reads the engine's timing metadata; source accent offsets remain unchanged. |
| The film workflow renders a final video after its gates. [Quegenx/agent-skills, make-video] | Timeline handoff, export only on request. [word-fold, SKILL.md] | Apply the timeline-only handoff when this source workflow is selected. |

## Helper corrections and measurement limits

[word-fold, scripts/capture.mjs, scripts/init_word.py, scripts/space_word.py, scripts/sfx_steps.py and assets/kit/fold.js]

- **Capture prerequisites:** Node 22+ for the helper's unflagged global `WebSocket`, plus an installed Chrome/Chromium or an explicit `CHROME` path. The source only said Node and advertised Playwright discovery, but its fallback was one hardcoded cache revision. [Node 22 changelog](https://github.com/nodejs/node/blob/main/doc/changelogs/CHANGELOG_V22.md)
- **Spacing prerequisites:** Python 3 with NumPy, SciPy and Pillow, plus the capture prerequisites above. [word-fold, scripts/space_word.py]
- **Capture success:** navigation, readiness and evaluated seek must succeed before writing a frame. CDP reports navigation `errorText` and JavaScript `exceptionDetails` separately from protocol errors; the source ignored these failures and proceeded after its readiness wait expired. [CDP Page.navigate](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-navigate), [CDP Runtime.evaluate](https://chromedevtools.github.io/devtools-protocol/tot/Runtime/#method-evaluate)
- **Capture coordinates:** use `W=1920 H=1080 node scripts/capture.mjs page.html outdir 1.5 99` from the kit. `EVAL` prints a value from the page. The helper now defaults to the authored landscape size and frame origin 151; the source defaulted to portrait and origin 152 despite its own origin-151 comment. Seconds input remains seconds.
- **Safe setup:** the source stripped punctuation/spaces and always rewrote the word page. The imported helper rejects invalid word/color input and an existing page rather than silently joining words or losing solved gaps. Missing glyphs/endings remain authoring work, not completed animations.
- **Spacing scope:** the source detects ink using RGB brightness/color thresholds and ignores small raster components. This is not a general measurement for arbitrary backgrounds, dark low-chroma ribbons, very small lettering or all future glyph shapes. A component count matching the word is necessary, not proof of correct segmentation. The imported conversion uses `VIEW_W` and the engine's final camera scale; the source omitted that camera scale. Inspect actual frames and do not describe these raster measurements as exact geometric proof. [word-fold, scripts/space_word.py and assets/kit/fold.js, cam]
- **Spacing result:** a one-letter word has no pairs to adjust. For longer words the source's four-pass ceiling remains bounded; the imported helper measures the saved result, reports pair residuals and separation, and fails when the target/tolerance or minimum separation remains unresolved. The source compared proposed shifts with 0.3, then could finish without checking its final saved page. The source's 20-unit capped mean and 5-unit minimum can constrain the target; SciPy's solver requires a bracket containing a sign change, not an arbitrary solvable target. [SciPy brentq](https://github.com/scipy/scipy/blob/main/scipy/optimize/_zeros_py.py)
- **Authored sound accents:** keep sparse alternating soft steps and one landing accent, without whooshes, risers or swells. The source said the landing sound marks the completed final letter, but its A/T/N accents occur before the extra stroke finishes. Preserve the preset accent offsets rather than changing the sound design to fit that claim. The I schedule has no separate final-step clip; its landing accent is retained. Clip start times are not measurements of audible peaks; use [sound-pass](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/sound-pass/SKILL.md#check-sync) when verifying an actual export.
- **Extension limits:** unsupported endings must be implemented, not allowed to fall through to a stem. The source's fixed clip extents and raster thresholds do not establish an unlimited word-length guarantee. Changing rig rhythm requires re-running SFX from the updated engine metadata and checking the picture and sound together.
- **Existing project copies:** setup preserves an engine already in the project. If it predates the imported cue metadata, the sound helper cannot use the new schedule. Preserve custom glyphs/endings when updating that project copy; do not silently substitute old timing constants. [word-fold, scripts/init_word.py and scripts/sfx_steps.py; approved shared-timing correction]

## Prove it

[word-fold, references/quality-check.md; Quegenx/agent-skills, frame-review]

Use the [effect-specific checklist](templates/word-fold/references/quality-check.md) alongside [frame-review](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/frame-review/SKILL.md). Report which glyphs/endings were added, actual spacing residuals, picture/sound checks and the installed timeline schema consulted. This import received source/diff review and JavaScript syntax checks only; it does not establish pixel determinism, visual quality, editor integration or audible synchronization.
