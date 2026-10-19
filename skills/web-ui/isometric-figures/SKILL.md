---
name: isometric-figures
description: "Builds live interactive explanatory figures with the bundled isokit SVG and WebGL toolkit: physical mechanisms, controls, readouts, turning groups and geometry review. Use when a website needs a crafted object whose moving parts explain a concept or mechanism."
---

# Isometric figures

From the bundled isokit reference manuals and example source, previously routed through seek-engine. A live figure uses its own interaction loop; the [video adapter](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/ISOMETRIC.md#into-seekt) replaces that clock with a pure seek(t). Static printable sheets keep their distinct rules in [technical-drawing](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/technical-drawing/SKILL.md); general React and Next.js guidance stays in [react](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/react/SKILL.md). [isokit, references/craft.md; references/motion.md; original seek-engine ISOMETRIC.md]

Copy the whole templates/isokit subtree to the working project before building a standalone example, keeping its inner kit, scripts, references and examples paths. Generated pages belong in that workspace. The original React examples require absent kit/iso-kit.ts and kit/react/draw.tsx/live.tsx dependencies; their described API is preserved as a [source prerequisite](templates/isokit/references/kit.md#9-react-components), not a bundled implementation. The turning renderer remains beta, and the stress example is not audit-clean. [isokit, example imports; references/kit.md; references/3d.md]

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Choose the figure and its physical vocabulary | [Craft](templates/isokit/references/craft.md) and [walkthrough](templates/isokit/references/walkthrough.md) |
| Build round parts, pipes and recorded geometry | [Round parts API](templates/isokit/references/kit-lathe-and-tube.md) and [geometry audit](templates/isokit/references/kit-audit.md) |
| Drive live input and motion | [Motion and interaction](templates/isokit/references/motion.md) |
| Build turning groups and select their runtime | [3D](templates/isokit/references/3d.md) and [3D checks and limits](templates/isokit/references/3d-checks.md) |
| Put shader fields inside the drawing | [WebGL](templates/isokit/references/webgl.md) and [light theme](templates/isokit/references/webgl-light-theme.md) |
| Verify the figure and report the actual coverage | [Verify](templates/isokit/references/verify.md) and [review checklist](templates/isokit/references/verify-checklist.md) |
| Adapt a figure to a deterministic film clock | [seek-engine ISOMETRIC.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/ISOMETRIC.md#into-seekt) |
| Toolkit source: LICENSE | [LICENSE](templates/isokit/LICENSE) |
| Example source: examples/arcade-cabinet/arcade-cabinet.css | [examples/arcade-cabinet/arcade-cabinet.css](templates/isokit/examples/arcade-cabinet/arcade-cabinet.css) |
| Example source: examples/arcade-cabinet/build.mjs | [examples/arcade-cabinet/build.mjs](templates/isokit/examples/arcade-cabinet/build.mjs) |
| Example source: examples/arcade-cabinet/cabinet-scene.mjs | [examples/arcade-cabinet/cabinet-scene.mjs](templates/isokit/examples/arcade-cabinet/cabinet-scene.mjs) |
| Example source: examples/arcade-cabinet/live.js | [examples/arcade-cabinet/live.js](templates/isokit/examples/arcade-cabinet/live.js) |
| Example source: examples/arcade-cabinet/parts.mjs | [examples/arcade-cabinet/parts.mjs](templates/isokit/examples/arcade-cabinet/parts.mjs) |
| Example source: examples/arcade-cabinet/screen.mjs | [examples/arcade-cabinet/screen.mjs](templates/isokit/examples/arcade-cabinet/screen.mjs) |
| Example source: examples/desk-computer/build.mjs | [examples/desk-computer/build.mjs](templates/isokit/examples/desk-computer/build.mjs) |
| Example source: examples/dial-indicator/build.mjs | [examples/dial-indicator/build.mjs](templates/isokit/examples/dial-indicator/build.mjs) |
| Example source: examples/raptor-engine/build.mjs | [examples/raptor-engine/build.mjs](templates/isokit/examples/raptor-engine/build.mjs) |
| Example source: examples/raptor-engine/live.js | [examples/raptor-engine/live.js](templates/isokit/examples/raptor-engine/live.js) |
| Example source: examples/raptor-engine/raptor-stand.mjs | [examples/raptor-engine/raptor-stand.mjs](templates/isokit/examples/raptor-engine/raptor-stand.mjs) |
| Example source: examples/raptor-engine/raptor-subject.mjs | [examples/raptor-engine/raptor-subject.mjs](templates/isokit/examples/raptor-engine/raptor-subject.mjs) |
| Example source: examples/raptor-engine/raptor.css | [examples/raptor-engine/raptor.css](templates/isokit/examples/raptor-engine/raptor.css) |
| Example source: examples/ripple-tank/build.mjs | [examples/ripple-tank/build.mjs](templates/isokit/examples/ripple-tank/build.mjs) |
| Example source: examples/ripple-tank/live.js | [examples/ripple-tank/live.js](templates/isokit/examples/ripple-tank/live.js) |
| Example source: examples/ripple-tank/model.mjs | [examples/ripple-tank/model.mjs](templates/isokit/examples/ripple-tank/model.mjs) |
| Example source: examples/ripple-tank/ripple.css | [examples/ripple-tank/ripple.css](templates/isokit/examples/ripple-tank/ripple.css) |
| Example source: examples/spot-plate/art.tsx | [examples/spot-plate/art.tsx](templates/isokit/examples/spot-plate/art.tsx) |
| Example source: examples/spot-plate/drops.ts | [examples/spot-plate/drops.ts](templates/isokit/examples/spot-plate/drops.ts) |
| Example source: examples/spot-plate/fan.ts | [examples/spot-plate/fan.ts](templates/isokit/examples/spot-plate/fan.ts) |
| Example source: examples/spot-plate/figure.tsx | [examples/spot-plate/figure.tsx](templates/isokit/examples/spot-plate/figure.tsx) |
| Example source: examples/spot-plate/geometry.ts | [examples/spot-plate/geometry.ts](templates/isokit/examples/spot-plate/geometry.ts) |
| Example source: examples/spot-plate/live.tsx | [examples/spot-plate/live.tsx](templates/isokit/examples/spot-plate/live.tsx) |
| Example source: examples/spot-plate/rig.ts | [examples/spot-plate/rig.ts](templates/isokit/examples/spot-plate/rig.ts) |
| Example source: examples/spot-plate/spot-plate.css | [examples/spot-plate/spot-plate.css](templates/isokit/examples/spot-plate/spot-plate.css) |
| Example source: examples/test-rig/art.tsx | [examples/test-rig/art.tsx](templates/isokit/examples/test-rig/art.tsx) |
| Example source: examples/test-rig/figure.tsx | [examples/test-rig/figure.tsx](templates/isokit/examples/test-rig/figure.tsx) |
| Example source: examples/test-rig/geometry.ts | [examples/test-rig/geometry.ts](templates/isokit/examples/test-rig/geometry.ts) |
| Example source: examples/test-rig/live.tsx | [examples/test-rig/live.tsx](templates/isokit/examples/test-rig/live.tsx) |
| Example source: examples/test-rig/pose.ts | [examples/test-rig/pose.ts](templates/isokit/examples/test-rig/pose.ts) |
| Example source: examples/test-rig/rig.ts | [examples/test-rig/rig.ts](templates/isokit/examples/test-rig/rig.ts) |
| Example source: examples/test-rig/stretch.css | [examples/test-rig/stretch.css](templates/isokit/examples/test-rig/stretch.css) |
| Example source: examples/test-rig/view.ts | [examples/test-rig/view.ts](templates/isokit/examples/test-rig/view.ts) |
| Example source: examples/turning-dial/build.mjs | [examples/turning-dial/build.mjs](templates/isokit/examples/turning-dial/build.mjs) |
| Example source: examples/turning-dial/dial.css | [examples/turning-dial/dial.css](templates/isokit/examples/turning-dial/dial.css) |
| Example source: examples/turning-dial/film.js | [examples/turning-dial/film.js](templates/isokit/examples/turning-dial/film.js) |
| Example source: examples/turning-dial/live.js | [examples/turning-dial/live.js](templates/isokit/examples/turning-dial/live.js) |
| Example source: examples/turning-dial/stress.mjs | [examples/turning-dial/stress.mjs](templates/isokit/examples/turning-dial/stress.mjs) |
| Toolkit source: kit/LICENSE-anatomy-reveal.txt | [kit/LICENSE-anatomy-reveal.txt](templates/isokit/kit/LICENSE-anatomy-reveal.txt) |
| Toolkit source: kit/audit-depth.mjs | [kit/audit-depth.mjs](templates/isokit/kit/audit-depth.mjs) |
| Toolkit source: kit/audit-geometry.mjs | [kit/audit-geometry.mjs](templates/isokit/kit/audit-geometry.mjs) |
| Toolkit source: kit/audit-routes.mjs | [kit/audit-routes.mjs](templates/isokit/kit/audit-routes.mjs) |
| Toolkit source: kit/audit.mjs | [kit/audit.mjs](templates/isokit/kit/audit.mjs) |
| Toolkit source: kit/canvas-painter.mjs | [kit/canvas-painter.mjs](templates/isokit/kit/canvas-painter.mjs) |
| Toolkit source: kit/gl.mjs | [kit/gl.mjs](templates/isokit/kit/gl.mjs) |
| Toolkit source: kit/iso-kit.mjs | [kit/iso-kit.mjs](templates/isokit/kit/iso-kit.mjs) |
| Toolkit source: kit/iso.css | [kit/iso.css](templates/isokit/kit/iso.css) |
| Toolkit source: kit/lathe-basis.mjs | [kit/lathe-basis.mjs](templates/isokit/kit/lathe-basis.mjs) |
| Toolkit source: kit/lathe-shading.mjs | [kit/lathe-shading.mjs](templates/isokit/kit/lathe-shading.mjs) |
| Toolkit source: kit/lathe.mjs | [kit/lathe.mjs](templates/isokit/kit/lathe.mjs) |
| Toolkit source: kit/tube.mjs | [kit/tube.mjs](templates/isokit/kit/tube.mjs) |
| Toolkit source: kit/turn-audit-analysis.mjs | [kit/turn-audit-analysis.mjs](templates/isokit/kit/turn-audit-analysis.mjs) |
| Toolkit source: kit/turn-audit-orbit.mjs | [kit/turn-audit-orbit.mjs](templates/isokit/kit/turn-audit-orbit.mjs) |
| Toolkit source: kit/turn-audit.mjs | [kit/turn-audit.mjs](templates/isokit/kit/turn-audit.mjs) |
| Toolkit source: kit/turn-build-analysis.mjs | [kit/turn-build-analysis.mjs](templates/isokit/kit/turn-build-analysis.mjs) |
| Toolkit source: kit/turn-build-output.mjs | [kit/turn-build-output.mjs](templates/isokit/kit/turn-build-output.mjs) |
| Toolkit source: kit/turn-build.mjs | [kit/turn-build.mjs](templates/isokit/kit/turn-build.mjs) |
| Toolkit source: kit/turn-emission.mjs | [kit/turn-emission.mjs](templates/isokit/kit/turn-emission.mjs) |
| Toolkit source: kit/turn-fixed.mjs | [kit/turn-fixed.mjs](templates/isokit/kit/turn-fixed.mjs) |
| Toolkit source: kit/turn-geometry.mjs | [kit/turn-geometry.mjs](templates/isokit/kit/turn-geometry.mjs) |
| Toolkit source: kit/turn-mount.mjs | [kit/turn-mount.mjs](templates/isokit/kit/turn-mount.mjs) |
| Toolkit source: kit/turn-outlines.mjs | [kit/turn-outlines.mjs](templates/isokit/kit/turn-outlines.mjs) |
| Toolkit source: kit/turn-primitives.mjs | [kit/turn-primitives.mjs](templates/isokit/kit/turn-primitives.mjs) |
| Toolkit source: kit/turn-projection.mjs | [kit/turn-projection.mjs](templates/isokit/kit/turn-projection.mjs) |
| Toolkit source: kit/turn-runtime.mjs | [kit/turn-runtime.mjs](templates/isokit/kit/turn-runtime.mjs) |
| Toolkit source: kit/turn.mjs | [kit/turn.mjs](templates/isokit/kit/turn.mjs) |
| Reference: 3d-checks | [references/3d-checks.md](templates/isokit/references/3d-checks.md) |
| Reference: 3d | [references/3d.md](templates/isokit/references/3d.md) |
| Reference: craft-round-parts | [references/craft-round-parts.md](templates/isokit/references/craft-round-parts.md) |
| Reference: craft | [references/craft.md](templates/isokit/references/craft.md) |
| Reference: kit-audit | [references/kit-audit.md](templates/isokit/references/kit-audit.md) |
| Reference: kit-lathe-and-tube | [references/kit-lathe-and-tube.md](templates/isokit/references/kit-lathe-and-tube.md) |
| Reference: kit | [references/kit.md](templates/isokit/references/kit.md) |
| Reference: motion | [references/motion.md](templates/isokit/references/motion.md) |
| Reference: verify-checklist | [references/verify-checklist.md](templates/isokit/references/verify-checklist.md) |
| Reference: verify | [references/verify.md](templates/isokit/references/verify.md) |
| Reference: walkthrough | [references/walkthrough.md](templates/isokit/references/walkthrough.md) |
| Reference: webgl-craft-rules | [references/webgl-craft-rules.md](templates/isokit/references/webgl-craft-rules.md) |
| Reference: webgl-light-theme | [references/webgl-light-theme.md](templates/isokit/references/webgl-light-theme.md) |
| Reference: webgl | [references/webgl.md](templates/isokit/references/webgl.md) |
| Toolkit source: scripts/capture.mjs | [scripts/capture.mjs](templates/isokit/scripts/capture.mjs) |
| Toolkit source: scripts/chrome-port.mjs | [scripts/chrome-port.mjs](templates/isokit/scripts/chrome-port.mjs) |
| Toolkit source: scripts/drive.mjs | [scripts/drive.mjs](templates/isokit/scripts/drive.mjs) |
| Toolkit source: scripts/inline-kit.mjs | [scripts/inline-kit.mjs](templates/isokit/scripts/inline-kit.mjs) |
| Toolkit source: scripts/line-ends.mjs | [scripts/line-ends.mjs](templates/isokit/scripts/line-ends.mjs) |
| Toolkit source: scripts/lines.mjs | [scripts/lines.mjs](templates/isokit/scripts/lines.mjs) |
| Toolkit source: scripts/turn-bench.mjs | [scripts/turn-bench.mjs](templates/isokit/scripts/turn-bench.mjs) |
| Toolkit source: scripts/turn-check-probes.mjs | [scripts/turn-check-probes.mjs](templates/isokit/scripts/turn-check-probes.mjs) |
| Toolkit source: scripts/turn-check.mjs | [scripts/turn-check.mjs](templates/isokit/scripts/turn-check.mjs) |
| Toolkit source: scripts/turn-fidelity.mjs | [scripts/turn-fidelity.mjs](templates/isokit/scripts/turn-fidelity.mjs) |


## The rules

1. Resolve the mechanism and its pure model before drawing; the visible readout and motion use the same model state. [isokit, references/craft.md; references/motion.md]
2. Keep the existing camera, parts, tone and line vocabulary together in [Craft](templates/isokit/references/craft.md). The real-object film branch uses the [faithful reconstruction rules](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/REAL-OBJECTS.md) instead of inventing a metaphor. [isokit, references/craft.md; original seek-engine REAL-OBJECTS.md]
3. Draw and record the same geometry, including the real contacts, gaps, route ownership and explode state; keep numerical checks within their recorded shapes, sampled states and tolerances. [isokit, references/kit-audit.md; references/verify.md]
4. Follow the [live motion contract](templates/isokit/references/motion.md) for input, settling, visibility, reduced motion and announcements; keep those live clocks out of the [film adapter](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/ISOMETRIC.md#into-seekt). [isokit, references/motion.md; original seek-engine ISOMETRIC.md]
5. Use [turning groups](templates/isokit/references/3d.md) only when their motion explains the mechanism. Preserve the separate general and fixed-camera runtime contracts; the fixed backend supplies the canvas path. [isokit, references/3d.md; references/3d-checks.md; kit/turn.mjs; kit/turn-fixed.mjs]
6. Put [shader fields inside the drawing's camera and layer stack](templates/isokit/references/webgl.md), with an SVG fallback. For paper, read the [light-ink rules](templates/isokit/references/webgl-light-theme.md); the Raptor's older light branch is a known counterexample. [isokit, references/webgl.md; references/webgl-light-theme.md]
7. Use the canonical [kit API](templates/isokit/references/kit.md), and preserve complete dependency closures when inlining the split modules. Keep each example's DATA fields, output names and selected runtime together. [isokit, references/kit.md; scripts/inline-kit.mjs; example builders]
8. Review using [Verify](templates/isokit/references/verify.md) and its [checklist](templates/isokit/references/verify-checklist.md), retaining full, quick, partial and skipped outcomes as distinct evidence. The source's historical timings and passing runs are not a fresh result for the current figure. [isokit, references/verify.md; references/3d-checks.md]

## Prove it

[isokit, references/verify.md; references/verify-checklist.md; references/3d-checks.md] The figure explains its named mechanism, its readout agrees with the same model instant, contacts and texture ends survive close review in both themes, and the selected geometry, line and browser checks report their actual coverage and results. Input remains usable with reduced motion and WebGL unavailable. Do not claim unrun checks, missing React dependencies, a quick audit or an omitted optional check as a full pass. For a film, use the deterministic acceptance in [seek-engine ISOMETRIC.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/ISOMETRIC.md#check).
