# Wiring into CoAnimator

The supplied word-fold page and helpers use CoAnimator's player and timeline conventions. Read this when selecting that workflow; the main entry is [WORD-FOLD.md](../../../WORD-FOLD.md). [word-fold, references/coanimator.md and SKILL.md]

## Page and player

[word-fold, references/coanimator.md; assets/kit/kc-player.js and fold.js]

- Each `<project>/word-fold/<word>.html` loads `../vendor/kc-player.js` and `fold.js`, then mounts `window.__kcControl`: `seek`, `seekAndPause`, `play`, `pause`, `getTime` and `getDuration`. The 1920 by 1080 frame declares `data-kc-canvas` and fits into the viewport.
- The source uses 30 fps reference frames: frame = 151 + 30 times seconds. The imported `window.FOLD_INFO` exposes `F0`, `FPS`, `DUR`, `NSTEPS`, `T_LAND`, `VIEW_W`, `FINAL_SCALE`, available `letters`, the configured `word` and `ending`, plus `SFX_STEPS` and `SFX_LAND` in reference frames. Spacing includes the final camera scale in its pixel conversion; the sound helper consumes the engine's cue schedule instead of repeating rig timing constants.
- `window.FOLD` controls the word, gaps, ending, ribbon, ink and background colors. Rig constants and glyph geometry live in the project's `fold.js`; changing its timing requires regenerating the sound track.
- This is a different contract from the repo's [seek engine](../../../SKILL.md#the-contract). No conversion wrapper is bundled.

## Timeline files

[word-fold, references/coanimator.md and scripts/sfx_steps.py]

- Read the installation's `docs/timeline.md` before writing JSON. The supplied source describes `timelines/<id>.json` and audio clips with `id`, `name`, `src`, `startTime`, `duration`, `sourceDuration`, `volume` and `trimIn`. Paths are project-relative; clip IDs must remain unique across tracks. This source schema and the cited `window.coa.timelines.create` API have not been checked against an installed app version.
- Prefer creating the timeline through the app's timeline switcher. The [official Projects guide](https://coanimator.com/docs/projects) confirms multiple timelines with their own animation and tracks. Do not invent project metadata or a timeline scaffold from the clip field list.
- Write the selected timeline through a sibling temporary file and rename it into place. Preserve unrelated JSON fields. The SFX helper replaces its own track and explicitly resets the animation start and duration; confirm that those changes match the selected timeline.
- The source reports that the app hot-reloads timeline edits and a save race can leave a track missing. Inspect the actual editor after writing; a file on disk is not proof the intended timeline is visible. The exact race was not reproduced in this maintenance round.
- The app owns its project metadata and timeline list. Do not create projects or switch the open timeline without the user's direction.

## Prove it

[word-fold, SKILL.md and references/coanimator.md]

The project and timeline are the ones the user named, the installed timeline documentation was read, unrelated data is preserved and the editor shows the intended animation and sound track. Report the actual app version and any unverified schema/API behavior rather than claiming current compatibility from this source alone.
