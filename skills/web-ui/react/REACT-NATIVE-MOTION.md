# React Native and Expo: Reanimated, Gesture Handler, Expo Router

Motion in a React Native or Expo app. The source is Emil Kowalski's `animate-expo` skill (SKILL.md and RECIPES.md, tagged [Emil Kowalski, animate-expo]), checked against the official docs; each correction gives the official form, its URL and what the source said. The web numbers are in [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md); where this file disagrees with them, both are stated and neither wins.

**Contents:** [Three premises](#three-premises) · [Should it animate](#should-it-animate) · [Pick the tool](#pick-the-tool) · [Properties](#properties) · [Spring or timing](#spring-or-timing) · [JS thread](#keep-it-off-the-js-thread) · [Press, not hover](#press-not-hover) · [Haptics](#haptics) · [Reduced motion](#reduced-motion-and-text-size) · [Setup](#setup-that-silently-breaks-motion) · [Conventions](REACT-NATIVE-MOTION-RECIPES.md#recipe-conventions) · [Two worklets](REACT-NATIVE-MOTION-RECIPES.md#two-worklets-projection-and-rubber-banding) · [Press feedback](REACT-NATIVE-MOTION-RECIPES.md#press-feedback) · [Sheet](REACT-NATIVE-MOTION-RECIPES.md#drag-to-dismiss-sheet) · [Swipe to delete](REACT-NATIVE-MOTION-RECIPES.md#swipe-to-delete) · [Collapsing header](REACT-NATIVE-MOTION-RECIPES.md#collapsing-header) · [List entrances](REACT-NATIVE-MOTION-RECIPES.md#list-entrances) · [Keyboard](REACT-NATIVE-MOTION-RECIPES.md#keyboard-synced-ui) · [Tab indicator](REACT-NATIVE-MOTION-RECIPES.md#tab-indicator) · [Screen transitions](REACT-NATIVE-MOTION-RECIPES.md#screen-transitions) · [Toast](REACT-NATIVE-MOTION-RECIPES.md#toast) · [Threshold](REACT-NATIVE-MOTION-RECIPES.md#fire-once-at-a-threshold) · [Never ship](#never-ship) · [Prove it](#prove-it)

## Three premises

[Emil Kowalski, animate-expo]

1. **There is no hover.** "Every affordance the web puts in hover has to live in press, position, or nothing."
2. **There are two runtimes.** Worklets (Reanimated 4) makes this explicit: the React Native runtime, where React renders and app logic runs, and the UI runtime, where worklets run every frame (plus optional worker runtimes). "An animation that touches the RN runtime stutters the moment the app does anything else. The whole craft is keeping motion on the UI runtime." The web form of this is in [ui-animation PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PERFORMANCE.md#move-only-what-the-compositor-can-move).
3. **The user's finger is on the element.** Interruptibility and velocity handoff "aren't polish, they're the baseline."

Two failure modes, the first worse: animating something that shouldn't animate, and animating the right thing on the wrong thread ("a `setState` per frame, a `PanResponder`, an animated `height`"). Make the call, state the reasoning in one line, write the code; "Never present motion options as a menu."

## Should it animate

[Emil Kowalski, animate-expo]

| Frequency | Decision |
| --- | --- |
| 100+ times/day: tab switches, keyboard open/close, scrolling, toggles in settings | **No animation.** Platform default or nothing. Stop here. |
| Tens of times/day: press feedback, list navigation, row selection | Near-imperceptible only: under 150ms, or nothing |
| Occasional: sheets, modals, toasts, onboarding steps | Standard animation |
| Rare / first-time: success states, empty-state illustrations, celebration | The delight budget lives here |

- **"Tab switches never slide."** "Tabs are peers, not a hierarchy: sliding implies depth that isn't there, and the user pays for it dozens of times a session. `animation: 'none'`." `app-ui` does this instead on the web: `--duration-fast` 250ms is for "menus and modals opening, icon swaps, tabs sliding, page slides" ([app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md#motion-tokens)). app-ui governs app-ui.
- **Name the purpose in one word:** feedback, spatial consistency, state indication, preventing a jarring change, explanation, or delight (rare tier only). "Can't name it? Don't build it."
- **Frequency, both ways:** the 100+ tier says no animation at all; [ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PATTERNS.md#buttons-presses-and-feedback) still animates a press "under 100 ms in: some buttons are pressed hundreds of times a day". Neither wins.

## Pick the tool

Walk down; stop at the first that fits. [Emil Kowalski, animate-expo]

| Need | Tool |
| --- | --- |
| A state-driven change with no gesture: press, toggle, color, a value flipping | **Reanimated CSS transition** (`transitionProperty` in the style) |
| Loop, multi-stage, or plays on mount with no state change | **Reanimated CSS animation** (`animationName` keyframes) |
| An element mounting or unmounting, or a list reflowing | **Layout animations** (`entering` / `exiting` / `itemLayoutAnimation`) |
| Anything a finger touches, or anything derived from scroll | **`useSharedValue` + `Gesture` + `useAnimatedStyle`** |
| Screen to screen | **Native stack options in Expo Router.** Never hand-roll this |
| A bottom sheet that is its own screen | **`presentation: 'formSheet'`**: "a real UISheetPresentationController, free and correct" |
| Tab bar | **`NativeTabs`**, the platform's real tab bar |
| Context menu, press-and-hold preview | **`Link.Menu` / `Link.Preview`** (iOS-only) |
| Header that collapses into a large title | **`headerLargeTitleEnabled`** on the native stack (iOS-only), not a scroll worklet |
| Pull to refresh | **`RefreshControl`**; hand-roll only for a signature interaction ([threshold recipe](REACT-NATIVE-MOTION-RECIPES.md#fire-once-at-a-threshold)) |
| UI that tracks the keyboard | **`react-native-keyboard-controller`** |
| Vector illustration, celebration, empty state | **Lottie**, "for illustration only, never for UI state" |
| A huge animated scene, freeform drawing | **`@shopify/react-native-skia`**, "for when the view hierarchy itself is the bottleneck" |

- **Native tabs:** the [SDK-specific imports and API](REACT-NATIVE.md#navigation) live in the global React guide. All tab screens render eagerly, and that can't be changed ([Expo native tabs](https://docs.expo.dev/router/advanced/native-tabs/)).
- **Native preview and menu:** use the [Link.Preview, Link.Menu and Link.Trigger restrictions](REACT-NATIVE.md#pressables-and-menus) before choosing the native route. [Emil Kowalski, animate-expo]
- **Large-title header:** use the [native header option and its platform/name qualification](REACT-NATIVE.md#navigation), rather than a scroll worklet. [Emil Kowalski, animate-expo]
- "Reach for a shared value only when the value is continuous or interruptible. A press scale is a CSS transition; a drag is a shared value."

**Install with `npx expo install <package>`**, which "resolves the version that matches the project's SDK, which plain `npm install` won't". Animation needs `react-native-reanimated` + `react-native-worklets`.

## Properties

[Emil Kowalski, animate-expo]

- **`transform` and `opacity` are free.** "`width`, `height`, `margin`, `padding`, `flex`, `top`, `left`, `gap` re-run Yoga on every frame for that node *and its siblings*."
- **The one exception: an absolutely positioned element with no children** (a tab pill, a progress fill). "It's out of flow, so nothing else re-lays-out, and animating `width` keeps the corner radius that `scaleX` would smear." **Both ways:** rule 7 in [ui-animation SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md) says "Only transform and opacity move", and [ui-animation PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PERFORMANCE.md#move-only-what-the-compositor-can-move) resizes with `scale` and counter-scales; this exception, and Argyle's layout animations recorded there, take the other side. Neither wins.
- **Never `scale(0)`.** Start from `scale(0.9-0.97)` + `opacity: 0`. "Nothing in the real world appears from nothing."
- **`transform` is an array and order matters:** `[{ translateY }, { scale }]` scales after moving; reversed, the translate gets scaled too. Keep translate first.
- **Android shadows are `elevation`,** and animating it re-renders the shadow every frame: animate the opacity of a pre-shadowed layer.
- **Never animate `BlurView` intensity;** on Android it re-renders the blur each frame. Crossfade a static `BlurView`.
- **Percentages in translate, corrected form:** `{ translateY: '100%' }` (or the string transform `'translateY(100%)'`) moves an element by its own height; percentages are relative to the element's own width or height, "supported on the New Architecture" ([React Native transforms](https://reactnative.dev/docs/transforms)). The source wrote `translateY('100%')`, as if a function.
- **Core `Animated`, corrected:** "you can only animate non-layout properties: things like `transform` and `opacity` will work, but Flexbox and position properties will not" with the native driver ([React Native animations](https://reactnative.dev/docs/animations)). The source said `useNativeDriver` "refuses anything but transform and opacity". Reanimated stays the rule for anything a finger drives.

## Spring or timing

**"If a finger was involved, use a spring."** Springs carry velocity through an interruption; timing curves restart. [Emil Kowalski, animate-expo] Reanimated's spring takes duration and damping ratio; use this form, not mass, stiffness and damping:

| Interaction | Config |
| --- | --- |
| Default settle, no overshoot | `{ duration: 400, dampingRatio: 1 }` |
| Reposition / snap back after a drag | `{ duration: 400, dampingRatio: 0.8, velocity }` |
| Sheet, drawer | `{ duration: 300, dampingRatio: 0.8, velocity }` |
| Must not pass a hard edge | add `overshootClamping: true` |

- **A spring's `duration` is perceptual:** "Perceptual duration … Actual duration is 1.5 times" that value, and v3 configs migrate by dividing by 1.5 ([withSpring](https://docs.swmansion.com/react-native-reanimated/docs/animations/withSpring/)). So `{ duration: 400 }` runs about 600 ms, past the source's own "under 300ms". Defaults: `duration` 550, `dampingRatio` 1, `energyThreshold` 6e-9. If both forms are passed, `duration` and `dampingRatio` override `stiffness` and `damping`. Motion's `visualDuration` is in [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md#springs); the mass, stiffness and damping form is in [ui-animation PHYSICS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PHYSICS.md#modal-and-physical-numbers).
- **"Bounce only when the gesture carried momentum."** "Overshoot on a menu that faded in feels wrong; overshoot on a card you flicked feels right."

**Easing**, for everything without a finger on it: entering or exiting `ease-out`; moving or morphing on screen `ease-in-out`; constant motion `linear`; default `ease-out`. **"Never `ease-in` on UI.** It starts slow, delaying the exact moment the user is watching." [Emil Kowalski, animate-expo]

```js
import { Easing } from 'react-native-reanimated';

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);      // strong ease-out for UI
const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);  // on-screen movement
const EASE_SHEET = Easing.bezier(0.32, 0.72, 0, 1);    // iOS sheet curve
```

**Curves, both ways:** [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md#curves) eases exits in on purpose (`exit | 0.55, 0.055, 0.675, 0.19 | leaving: accelerates away`), where this file never uses ease-in; its `out` is `0.16, 1, 0.3, 1` against `EASE_OUT`'s `0.23, 1, 0.32, 1`, and its `inOut` `0.87, 0, 0.13, 1` against `0.77, 0, 0.175, 1`. `EASE_SHEET` is the `[0.32, 0.72, 0, 1]` curve TIMING.md names for Benji Taylor's icons. Neither wins.

**Durations** [Emil Kowalski, animate-expo]: press feedback 100-150ms; toggle, chip, small state change 150-200ms; sheet, modal, drawer a spring of about 300ms perceived; screen transition the platform default. "Mobile UI animations stay under 300ms, same as web. The platform's own transitions are longer (iOS push is 350ms); match the platform for navigation, beat it everywhere else." The 350ms figure has no official source here (unconfirmed). **Both ways:** rule 2 in [ui-animation SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md) gives "a modal 300-400 ms, a page transition 400-600 ms", and [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md#duration-by-element) a press 120-180 ms. Neither wins.

## Keep it off the JS thread

"This is the mobile-specific craft, and it's where most React Native motion dies." [Emil Kowalski, animate-expo]

- **Never `setState` from a gesture or scroll handler.** "One React render per frame is the single biggest cause of jank in RN apps." Shared value → `useAnimatedStyle`.
- **Never schedule back to the RN runtime inside `onUpdate` or a scroll handler.** `scheduleOnRN(fn, ...args)` from `react-native-worklets` replaces the deprecated `runOnJS(fn)(...args)`; in `onUpdate` it runs 60-120 times a second. It belongs in `onEnd`, or in a `useAnimatedReaction` that fires at a threshold. The Reanimated 4 migration also renames `runOnUI` to `scheduleOnUI` and `useScrollViewOffset` to `useScrollOffset`, removes `useAnimatedGestureHandler` and `useWorkletCallback`, and moves the Babel plugin to `react-native-worklets/plugin` ([migration from 3.x](https://docs.swmansion.com/react-native-reanimated/docs/guides/migration-from-3.x/)).
- **Never read or write a shared value during render** (`translateY.get()` in JSX): "Don't read or modify the value of a shared value during a component's render" ([useSharedValue](https://docs.swmansion.com/react-native-reanimated/docs/core/useSharedValue/)). Touch them only in worklets, handlers and effects.
- **Use `.get()` / `.set()`, not `.value`;** the docs call them "compliant with the React Compiler", and `set` takes an updater: `sv.set((v) => v + 1)`. Reading `sv.value` on the RN runtime blocks the JS thread ([performance guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/)).
- **Functions called from a worklet need `'worklet'`** as their first line, "or they throw at runtime on device while working fine in the debugger."

**More from the Reanimated performance guide** ([docs](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/)): animate "no more than 100 components for low-end Android devices" (500 on iOS), past that use Skia; "consider using `Pressable` from `react-native-gesture-handler`"; drive an animated counter with a shared value into an animated `TextInput`, not state; build Android with the `debugOptimized` variant (React Native 0.82 and later) to test performance.

## Press, not hover

[Emil Kowalski, animate-expo]

- **Feedback on press-in, commit on press-out.** "Waiting for the tap to complete before showing anything feels dead." The web rule is "the press responds in the same frame" ([ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PATTERNS.md#buttons-presses-and-feedback)).
- **`scale: 0.97` in 100-150ms** on any pressable, `Pressable` + a CSS transition; "`scale` takes the label and icons with it, which is what makes it read as physical."
- **Touch targets:** the source says 44×44pt minimum (48dp Android); if the visual is smaller, add `hitSlop`, don't grow the visual. Android: "at least 48dp x 48dp" ([Android accessibility](https://developer.android.com/guide/topics/ui/accessibility/apps)); the Apple 44pt page was not checked here.
- **`pressRetentionOffset`** "so a finger drifting a few pixels doesn't cancel a press the user meant."
- **Android ripple only in a Material-styled app.** "In a custom-designed app, the same scale on both platforms is more coherent than a ripple on one."

## Haptics

[Emil Kowalski, animate-expo]

| Moment | Call |
| --- | --- |
| A value ticks past a step: picker, slider detent, segmented control | `Haptics.selectionAsync()` |
| Something snaps home, a sheet detent catches, a drag commits | `Haptics.impactAsync(ImpactFeedbackStyle.Light)` |
| A heavy object lands, a destructive action fires | `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` |
| Operation succeeded or failed | `Haptics.notificationAsync(NotificationFeedbackType.Success / Error)` |

- **Same frame as the visual.** "Fire it at the causal moment (the detent catching), not when the animation finishes."
- **One per user action.** "Never on scroll, never per frame, never on an entrance animation the user didn't cause."
- **Never the only feedback.** "Haptics are off system-wide for many users"; the visual has to stand alone.
- From a worklet, schedule it: `scheduleOnRN(Haptics.selectionAsync)`.

**Android, corrected** ([expo-haptics](https://docs.expo.dev/versions/latest/sdk/haptics/)): the source says haptics are "silent on most Android hardware". The docs say Android plays them through `Vibrator`, which Android does "not recommend … for implementing haptics feedback", and offer the Android-only `Haptics.performAndroidHapticsAsync(AndroidHaptics.Confirm | Reject | Toggle_On | Long_Press …)`, which needs no `VIBRATE` permission. On iOS, Taptic feedback does nothing in Low Power Mode, with Taptic disabled, or while the Camera or dictation is active. Also available: `ImpactFeedbackStyle.Heavy`, `Rigid`, `Soft`, `NotificationFeedbackType.Warning`; `impactAsync` defaults to Medium.

**Pairings, both ways:** FlutterPro's table pairs "medium" with "slider reaches a snap point" and "pull-to-refresh triggers", and "heavy" with "confirm account deletion" ([flutter-ux MOTION-AND-FEEDBACK.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/MOTION-AND-FEEDBACK.md#haptics)); this file uses selection for detents, Light for pull-to-refresh arming and Medium for destructive actions. Neither wins.

## Reduced motion and text size

```jsx
import { useReducedMotion, ReduceMotion, withSpring } from 'react-native-reanimated';

const reduced = useReducedMotion();
const y = useSharedValue(reduced ? 0 : SHEET_HEIGHT);

// or let each animation decide
withSpring(0, { duration: 300, dampingRatio: 0.8, reduceMotion: ReduceMotion.System });
```

- **`useReducedMotion` reads the setting once:** it "returns a boolean indicating whether the reduced motion setting was enabled when the app started", and "Changing the reduced motion system setting doesn't cause your components to rerender" ([useReducedMotion](https://docs.swmansion.com/react-native-reanimated/docs/device/useReducedMotion/)). The source used it for screen options without that caveat. `reduceMotion: ReduceMotion.System` on each animation follows a change mid-session.
- "Reduced motion means **fewer and gentler**, not zero: keep opacity and color changes that explain a state change, drop translation, scale, parallax and overshoot. Screen transitions become `animation: 'fade'`." [Emil Kowalski, animate-expo] Same as rule 8 in [ui-animation SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md).
- **Text scales.** "`allowFontScaling` is on by default, so any height you measured at default type size is wrong at 200%. Never animate to a hardcoded height: measure with `onLayout`, or animate a transform instead."

## Setup that silently breaks motion

[Emil Kowalski, animate-expo]

- `npx expo install react-native-reanimated react-native-worklets`. "Reanimated Babel plugin is automatically configured in babel-preset-expo" ([Expo Reanimated](https://docs.expo.dev/versions/latest/sdk/reanimated/)); a bare project adds it, and it "has to be listed last" ([getting started](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/)). A missing or misplaced plugin throws `Failed to create a worklet` at runtime.
- `GestureHandlerRootView` must wrap the app, "or gestures do nothing with no error"; in Expo Router, in the root `_layout` with `style={{ flex: 1 }}`.
- Reanimated 4 "supports only the New Architecture".
- "Expo Go is not a performance environment." Judge feel in a release build.

**120fps:** on ProMotion iPhones, third-party animations are capped at 60fps unless `CADisableMinimumFrameDurationOnPhone` is set; then the frame budget is 8ms, not 16.

```json
{ "expo": { "ios": { "infoPlist": { "CADisableMinimumFrameDurationOnPhone": true } } } }
```

The source says "Recent Expo SDKs set it by default". The Reanimated docs say the React Native app template enables it from React Native 0.82 and say nothing about Expo ([performance guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/)); confirm it's there.

## Worked recipes

The complete imports, worklets and interaction recipes are in [REACT-NATIVE-MOTION-RECIPES.md](REACT-NATIVE-MOTION-RECIPES.md). Read this file's policy and setup before using them. [Emil Kowalski, animate-expo]

## Never ship

[Emil Kowalski, animate-expo]

| Never | Instead |
| --- | --- |
| `PanResponder` | `Gesture.Pan()` from gesture-handler |
| `setState` in a gesture or scroll handler | shared value + `useAnimatedStyle` |
| `runOnJS` (deprecated in Reanimated 4) | `scheduleOnRN` from `react-native-worklets` |
| `scheduleOnRN` per frame | `onEnd`, or `useAnimatedReaction` at a threshold |
| Reading or writing a shared value during render | `.get()` / `.set()` in worklets, handlers, effects |
| Core `Animated` for anything a finger touches | Reanimated |
| Animating `height` / `width` / `margin` / `flex` / `top` | `transform` + `opacity` (absolute, childless elements exempt) |
| Animating `BlurView` intensity or Android `elevation` | crossfade a static layer |
| `entering` on a virtualized list row | animate the container, or `itemLayoutAnimation` |
| A screen transition rebuilt in JS | native stack `animation` |
| Sliding between tabs | `animation: 'none'` |
| `Easing.in(...)` on a UI element | `Easing.bezier(0.23, 1, 0.32, 1)` |
| `scale(0)` entrance | `scale(0.95)` + `opacity: 0` |
| Distance-only dismissal threshold | velocity **or** distance: a flick is enough |
| Hard stop at a boundary | rubber-band resistance |
| A haptic per frame, or as the only feedback | one per commit, always paired with a visual |
| Judging feel in Expo Go or the simulator | release build, slowest supported device |

## Prove it

"Feel is judged on a release build on the slowest device you support. Nothing else counts as verified." [Emil Kowalski, animate-expo] After the code, report in a few lines:

- **The gate result:** frequency tier and named purpose, and what was rejected and why.
- **The ingredients:** tool, properties, spring or curve + duration, thread.
- **What to feel-check on device:** "flick it, interrupt it mid-flight, reverse it, run it on the slowest Android you have".

"The code is the deliverable. Don't pad it into a report."
