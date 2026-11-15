# Continuous scroll worlds

An optional architecture from [MengTo/Skills, build-threejs-scroll-worlds/SKILL.md and references/realtime-architecture.md]: native page scrolling moves a camera through one persistent spatial world. Select this when chapters occupy the same place. For independent section scenes and render-target crossfades, use [LAUNCH-SITES.md](LAUNCH-SITES.md); choose the branch before constructing the scene.

## Separate semantic progress from camera motion

Keep the measured native scroll position as the authoritative state for chapter ownership, navigation, URL restoration, accessible content and which objects can be activated. Derive a second, smoothed value for camera and decorative motion. A camera that is still catching up must not leave the previous chapter's controls active. Keep normalization, clamping and chapter boundaries in one conductor rather than letting each effect read its own scroll clock. [MengTo/Skills, build-threejs-scroll-worlds/SKILL.md, normalized reversible state and exact versus damped progress; references/realtime-architecture.md]

Record chapter ranges, camera position/target endpoints, transition overlap, foreground ownership, interaction proxies and mobile variants together. A chapter's scroll weight allocates travel time; it does not require equal physical distance. Design mobile camera endpoints deliberately instead of cropping a desktop path. Build forward and reverse traversal from the same progress function, without accumulating direction-dependent scene mutations. [MengTo/Skills, build-threejs-scroll-worlds/SKILL.md, chapter schema, mobile cameras and scrollWeight]

One world renderer persists across seams. Reuse geometry/materials and define who owns shared resources before disposing a chapter. Keep HTML content and a meaningful still fallback available through the existing [launch-site scene contract](LAUNCH-SITES.md) and [widget lifecycle](WIDGETS.md). The source's illustrative performance budgets and extra cloth canvases do not establish a universal one-canvas count or a measured device guarantee. [MengTo/Skills, build-threejs-scroll-worlds/references/realtime-architecture.md; references/kage-anatomy.md; demo/index.html]

## Resolve interaction in the moving world

Use explicit interaction proxies and filter them to the exact active chapter. Convert the pointer through the displayed canvas rectangle and camera before raycasting. A pointer that has not moved can still hit a different object when the camera, world or layout moves, so invalidate cached hits on those changes too. Decorative overlays must preserve access to the real page controls. [MengTo/Skills, build-threejs-scroll-worlds/SKILL.md, interaction proxies; references/realtime-architecture.md; source raycast caching requires this moving-camera correction]

Treat reload at a deep position, back/forward restoration, rapid jumps, reverse scrolling, orientation changes and viewport-height changes as normal inputs. Remeasure and resample authoritative scroll state before presenting a restored frame. Do not assume unchanged width means unchanged scroll geometry. Reconcile animation state when resuming after visibility changes; a cancelled frame handle must not prevent restarting. Use the lifecycle owner for reduced motion, idle scheduling, context loss and teardown rather than copying the source's continuous-loop helpers. [MengTo/Skills, build-threejs-scroll-worlds/references/scroll-conductor.js and demo/index.html; WIDGETS.md]

## Choose media scrubbing when the world is already filmed

A scroll-scrubbed video or frame sequence is a different rendering choice: map normalized scroll progress to media time while preserving readable HTML. Keep a poster/still branch and gate loading and work using the existing lifecycle. For video, coalesce requests to the latest desired time and reconcile pending targets after a seek completes; issuing a seek on every scroll event does not prove the displayed frame has caught up. Keep a frame sequence's asset and memory budget explicit. [MengTo/Skills, scroll-scrubbed-visual-sequence/SKILL.md and demo/index.html; source demo's native video seeking is illustrative, not a completion protocol]

## Prove it

Inspect the first frame, every seam and final frame in both directions. Test a deep reload, browser restoration, fast jump, resized viewport and moving-camera pointer hit. Exact chapter/content/interaction ownership must agree while the visual camera lags. Check the reduced-motion and failed-renderer surfaces, idle/hidden work and repeat mount/unmount through [WIDGETS.md](WIDGETS.md#prove-it). Report actual device measurements and any untested path; reading the source demo is not a runtime test. [MengTo/Skills, build-threejs-scroll-worlds/references/quality-and-qa.md; source defects qualified above]
