# React Native illustration clocks and faces

Rossark's React Native motion.ts and liveFace.tsx describe SVG illustration rigs driven by Reanimated shared values. This topic documents those supplied APIs; it does not install or bundle the source templates. The source comments target Reanimated 3/4. Check the target app's installed version and existing [native motion setup](REACT-NATIVE-MOTION.md#setup-that-silently-breaks-motion) before adapting it. Platform-neutral acting and recipe values live in [living illustrations](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/ILLUSTRATION-ACTING.md). [rossark-motion-skill, templates/react-native/motion.ts; templates/react-native/liveFace.tsx]

These helper names belong to the supplied source, not Reanimated itself. If an adaptation requires a template that is unavailable in the target workspace, report that missing source instead of silently assuming the helper exists. [rossark-motion-skill, templates/react-native/motion.ts; skill-authoring, DISTRIBUTION.md#composing-skills]

## Clock contract

[rossark-motion-skill, templates/react-native/motion.ts]

| Source API | Actual behavior |
|---|---|
| `useLoopClock(period, live)` | Creates a shared value at zero. On the effect's live/period dependency change, cancels existing animation and resets zero. When live, repeats a linear timing animation to period with duration equal to period; cleanup cancels it. |
| `useOneShotClock(duration, play, reduced)` | Initializes at duration if reduced, otherwise zero. The effect cancels the previous animation; play=false resets zero, play=true with reduced jumps to duration, otherwise starts a linear timing from zero to duration. Cleanup cancels active playback. |
| `useChoreoClock` | Alias of `useLoopClock`, exported by liveFace.tsx. |

- Decide the live condition from the scene's visibility, background state and motion preference. The template accepts that boolean; it does not install visibility observers or application-background subscriptions for the caller. [rossark-motion-skill, SKILL.md sections 1 and 8; templates/react-native/motion.ts]
- A live=false loop freezes at zero and restarts from zero when live returns. Describe this as cancellation/reset, not phase-preserving pause/resume. An inactive one-shot also resets zero even if reduced is true; the final-frame behavior applies when play is true. [rossark-motion-skill, templates/react-native/motion.ts]
- Use one clock per scene, character or object group. Derive each part from its time; use [the shared math definitions](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/MATH.md#illustration-tracks-and-stable-variation) for pose tracks, phase, envelopes and stable variation. [rossark-motion-skill, SKILL.md sections 2 and 8]

## Animated SVG props

[rossark-motion-skill, templates/react-native/liveFace.tsx; https://docs.swmansion.com/react-native-reanimated/docs/core/useAnimatedProps]

- The source wraps SVG Rect, Path, Circle and Line with `Animated.createAnimatedComponent`, then passes shared-value-derived coordinates or path data through `animatedProps`. Keep per-frame drawing values off React state.
- `useAnimatedProps` returns the props object for an animated third-party component. Its optional dependency array matters when using Reanimated without the Worklets Babel plugin on Web; the plugin otherwise supplies inferred dependencies. On that Web configuration, provide the actual captured dependencies. The source's blanket instruction to put live in every useAnimatedProps array is not a universal native requirement. [https://docs.swmansion.com/react-native-reanimated/docs/core/useAnimatedProps; https://docs.swmansion.com/react-native-reanimated/docs/guides/web-support; rossark-motion-skill, SKILL.md section 8]
- Worklets capture referenced variables. Rossark keeps shared easing constants at module top, but its claim that every constant declared farther down is undefined inside a worklet is not a general declaration-order rule. Keep its placement as a style choice, and check the actual closure and initialization. [https://docs.swmansion.com/react-native-reanimated/docs/guides/worklets; rossark-motion-skill, templates/react-native/motion.ts]
- The source's illustration easings are Easing.bezierFn(.77, 0, .175, 1) for travel, (.23, 1, .32, 1) for arrival and (.55, 0, 1, .45) for falling/leaving. The native interface's existing [curve policy](REACT-NATIVE-MOTION.md#spring-or-timing) remains separate from drawing-internal motion. [rossark-motion-skill, templates/react-native/motion.ts; react, REACT-NATIVE-MOTION.md]

## Choreography and geometry

[rossark-motion-skill, templates/react-native/liveFace.tsx]

| Source type | Fields and meaning |
|---|---|
| `Choreo` | Required period, lookX, lookY and lid tracks; optional lidRight, cheek, mouth and tilt tracks. Tilt is applied by the caller to the head group. |
| `EyeGeometry` | Eye center cx/cy, white width/height, pupilW/pupilH, pupilTop measured from the white's top, and highlight radius shine. Zero shine suppresses the highlight. |
| `FaceInk` | White, pupil, skin and line colors, optional lineWidth; the source defaults the line width to 5 drawing units. |
| `LiveEye` | Viewer-left side -1 or viewer-right side 1, geometry, ink, choreography, shared clock and a supplied ID. The right eye uses lidRight when supplied. |
| `LiveMouth` | Corner coordinates x0/x1, top, optional tilt, mouth/tongue/optional teeth colors, choreography, shared clock and restDepth. The source's fallback depth is 11. |

- Draw whites without baked-in pupils. Mount both live eyes inside the same head transform, then draw occluding nose, hair or glasses. The reusable [face layering and timing](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/ILLUSTRATION-ACTING.md#a-face-that-stays-part-of-the-drawing) owns the visual recipe. [rossark-motion-skill, templates/react-native/liveFace.tsx]
- The pupil and highlight read the same gaze tracks. Lids and cheeks are skin rectangles moving across clipped whites; closed-eye and happy-squint lines are separate paths whose opacity follows their respective tracks. The mouth path changes depth while the tongue follows; optional teeth stay at the upper edge. [rossark-motion-skill, templates/react-native/liveFace.tsx]
- ClipPath references use `clipPath="url(#id)"`. Keep each eye's supplied ID and its derived Skin ID distinct among the rig's definitions; do not assume that a web document's global ID rule proves identical native scope. The source says IDs are global to the screen, but that native-wide assertion was not established by the official component contract. [https://github.com/software-mansion/react-native-svg/blob/main/_autodocs/api-reference/elements-grouping.md; rossark-motion-skill, templates/react-native/liveFace.tsx]

## Motion preferences and lifecycle

[rossark-motion-skill, SKILL.md sections 1 and 8; templates/react-native/motion.ts]

- The caller supplies reduced to the one-shot clock and incorporates it into a loop's live condition. Follow the existing [reduced-motion setting caveat](REACT-NATIVE-MOTION.md#reduced-motion-and-text-size): useReducedMotion reports the startup setting and does not itself rerender the component on later system changes.
- Cancel active repeats during cleanup. A hidden SVG with opacity zero still has a running clock unless the live condition or lifecycle actually cancels it.
- Rossark's still-loop/final-one-shot preference differs from the existing native UI preference for fewer movements with retained fades and color feedback. Keep both tagged views; the project's motion policy and the protected owner's design remain in force.
- Native SwiftUI templates and the macOS demo renderer are not React Native dependencies. Do not translate their examples into new code or add them to a TS/JS app merely because the illustration method is shared.

## Prove it

[rossark-motion-skill, SKILL.md sections 10 and 11; templates/react-native/motion.ts; templates/react-native/liveFace.tsx]

- Record the installed Reanimated/SVG versions and the actual clock owner. Verify that no per-part React state update drives the frames.
- Inspect live=false and live=true transitions, cleanup and replay: document the reset behavior rather than claiming seamless phase resume.
- Check play=false, reduced play=true and normal completion separately. The final frame must communicate the scene's result; frame zero must remain a complete drawing for a frozen loop.
- Inspect both eyes, each clip reference, covered white edges, mouth and head transform at the same timestamps. State whether the target was actually observed on a device; reading these templates alone does not verify runtime performance.
