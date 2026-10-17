# React Native and Expo: Reanimated, Gesture Handler, Expo Router

Motion in a React Native or Expo app. The source is Emil Kowalski's `animate-expo` skill (SKILL.md and RECIPES.md, tagged [Emil Kowalski, animate-expo]), checked against the official docs; each correction gives the official form, its URL and what the source said. The web numbers are in [TIMING.md](TIMING.md); where this file disagrees with them, both are stated and neither wins.

**Contents:** [Three premises](#three-premises) · [Should it animate](#should-it-animate) · [Pick the tool](#pick-the-tool) · [Properties](#properties) · [Spring or timing](#spring-or-timing) · [JS thread](#keep-it-off-the-js-thread) · [Press, not hover](#press-not-hover) · [Haptics](#haptics) · [Reduced motion](#reduced-motion-and-text-size) · [Setup](#setup-that-silently-breaks-motion) · [Conventions](#recipe-conventions) · [Two worklets](#two-worklets-projection-and-rubber-banding) · [Press feedback](#press-feedback) · [Sheet](#drag-to-dismiss-sheet) · [Swipe to delete](#swipe-to-delete) · [Collapsing header](#collapsing-header) · [List entrances](#list-entrances) · [Keyboard](#keyboard-synced-ui) · [Tab indicator](#tab-indicator) · [Screen transitions](#screen-transitions) · [Toast](#toast) · [Threshold](#fire-once-at-a-threshold) · [Never ship](#never-ship) · [Prove it](#prove-it)

## Three premises

[Emil Kowalski, animate-expo]

1. **There is no hover.** "Every affordance the web puts in hover has to live in press, position, or nothing."
2. **There are two runtimes.** Worklets (Reanimated 4) makes this explicit: the React Native runtime, where React renders and app logic runs, and the UI runtime, where worklets run every frame (plus optional worker runtimes). "An animation that touches the RN runtime stutters the moment the app does anything else. The whole craft is keeping motion on the UI runtime." The web form of this is in [PERFORMANCE.md](PERFORMANCE.md#move-only-what-the-compositor-can-move).
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

- **"Tab switches never slide."** "Tabs are peers, not a hierarchy: sliding implies depth that isn't there, and the user pays for it dozens of times a session. `animation: 'none'`." `app-ui` does this instead on the web: `--duration-fast` 250ms is for "menus and modals opening, icon swaps, tabs sliding, page slides" ([../app-ui/TOKENS.md](../app-ui/TOKENS.md#motion-tokens)). app-ui governs app-ui.
- **Name the purpose in one word:** feedback, spatial consistency, state indication, preventing a jarring change, explanation, or delight (rare tier only). "Can't name it? Don't build it."
- **Frequency, both ways:** the 100+ tier says no animation at all; [PATTERNS.md](PATTERNS.md#buttons-presses-and-feedback) still animates a press "under 100 ms in: some buttons are pressed hundreds of times a day". Neither wins.

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
| Pull to refresh | **`RefreshControl`**; hand-roll only for a signature interaction ([threshold recipe](#fire-once-at-a-threshold)) |
| UI that tracks the keyboard | **`react-native-keyboard-controller`** |
| Vector illustration, celebration, empty state | **Lottie**, "for illustration only, never for UI state" |
| A huge animated scene, freeform drawing | **`@shopify/react-native-skia`**, "for when the view hierarchy itself is the bottleneck" |

- **`NativeTabs` import, corrected:** SDK 58 and later import from `expo-router/native-tabs`; `expo-router/unstable-native-tabs` is SDK 54-57. All tab screens render eagerly, and that can't be changed ([Expo native tabs](https://docs.expo.dev/router/advanced/native-tabs/)). The source gave only `expo-router/unstable-native-tabs`.
- **`Link.Preview` and `Link.Menu`** are an "iOS-only feature available in SDK 54 and later"; a `Link` with a preview or menu but no `Link.Trigger` throws ([Expo link preview](https://docs.expo.dev/router/reference/link-preview/)).
- **`headerLargeTitleEnabled`:** React Navigation documents this name, iOS-only. The source adds "`headerLargeTitle` is deprecated"; that is not stated there (unconfirmed).
- "Reach for a shared value only when the value is continuous or interruptible. A press scale is a CSS transition; a drag is a shared value."

**Install with `npx expo install <package>`**, which "resolves the version that matches the project's SDK, which plain `npm install` won't". Animation needs `react-native-reanimated` + `react-native-worklets`.

## Properties

[Emil Kowalski, animate-expo]

- **`transform` and `opacity` are free.** "`width`, `height`, `margin`, `padding`, `flex`, `top`, `left`, `gap` re-run Yoga on every frame for that node *and its siblings*."
- **The one exception: an absolutely positioned element with no children** (a tab pill, a progress fill). "It's out of flow, so nothing else re-lays-out, and animating `width` keeps the corner radius that `scaleX` would smear." **Both ways:** rule 7 in [SKILL.md](SKILL.md) says "Only transform and opacity move", and [PERFORMANCE.md](PERFORMANCE.md#move-only-what-the-compositor-can-move) resizes with `scale` and counter-scales; this exception, and Argyle's layout animations recorded there, take the other side. Neither wins.
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

- **A spring's `duration` is perceptual:** "Perceptual duration … Actual duration is 1.5 times" that value, and v3 configs migrate by dividing by 1.5 ([withSpring](https://docs.swmansion.com/react-native-reanimated/docs/animations/withSpring/)). So `{ duration: 400 }` runs about 600 ms, past the source's own "under 300ms". Defaults: `duration` 550, `dampingRatio` 1, `energyThreshold` 6e-9. If both forms are passed, `duration` and `dampingRatio` override `stiffness` and `damping`. Motion's `visualDuration` is in [TIMING.md](TIMING.md#springs); the mass, stiffness and damping form is in [PHYSICS.md](PHYSICS.md#modal-and-physical-numbers).
- **"Bounce only when the gesture carried momentum."** "Overshoot on a menu that faded in feels wrong; overshoot on a card you flicked feels right."

**Easing**, for everything without a finger on it: entering or exiting `ease-out`; moving or morphing on screen `ease-in-out`; constant motion `linear`; default `ease-out`. **"Never `ease-in` on UI.** It starts slow, delaying the exact moment the user is watching." [Emil Kowalski, animate-expo]

```js
import { Easing } from 'react-native-reanimated';

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);      // strong ease-out for UI
const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);  // on-screen movement
const EASE_SHEET = Easing.bezier(0.32, 0.72, 0, 1);    // iOS sheet curve
```

**Curves, both ways:** [TIMING.md](TIMING.md#curves) eases exits in on purpose (`exit | 0.55, 0.055, 0.675, 0.19 | leaving: accelerates away`), where this file never uses ease-in; its `out` is `0.16, 1, 0.3, 1` against `EASE_OUT`'s `0.23, 1, 0.32, 1`, and its `inOut` `0.87, 0, 0.13, 1` against `0.77, 0, 0.175, 1`. `EASE_SHEET` is the `[0.32, 0.72, 0, 1]` curve TIMING.md names for Benji Taylor's icons. Neither wins.

**Durations** [Emil Kowalski, animate-expo]: press feedback 100-150ms; toggle, chip, small state change 150-200ms; sheet, modal, drawer a spring of about 300ms perceived; screen transition the platform default. "Mobile UI animations stay under 300ms, same as web. The platform's own transitions are longer (iOS push is 350ms); match the platform for navigation, beat it everywhere else." The 350ms figure has no official source here (unconfirmed). **Both ways:** rule 2 in [SKILL.md](SKILL.md) gives "a modal 300-400 ms, a page transition 400-600 ms", and [TIMING.md](TIMING.md#duration-by-element) a press 120-180 ms. Neither wins.

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

- **Feedback on press-in, commit on press-out.** "Waiting for the tap to complete before showing anything feels dead." The web rule is "the press responds in the same frame" ([PATTERNS.md](PATTERNS.md#buttons-presses-and-feedback)).
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

**Pairings, both ways:** FlutterPro's table pairs "medium" with "slider reaches a snap point" and "pull-to-refresh triggers", and "heavy" with "confirm account deletion" ([../../mobile/flutter-ux/MOTION-AND-FEEDBACK.md](../../mobile/flutter-ux/MOTION-AND-FEEDBACK.md#haptics)); this file uses selection for detents, Light for pull-to-refresh arming and Medium for destructive actions. Neither wins.

## Reduced motion and text size

```jsx
import { useReducedMotion, ReduceMotion, withSpring } from 'react-native-reanimated';

const reduced = useReducedMotion();
const y = useSharedValue(reduced ? 0 : SHEET_HEIGHT);

// or let each animation decide
withSpring(0, { duration: 300, dampingRatio: 0.8, reduceMotion: ReduceMotion.System });
```

- **`useReducedMotion` reads the setting once:** it "returns a boolean indicating whether the reduced motion setting was enabled when the app started", and "Changing the reduced motion system setting doesn't cause your components to rerender" ([useReducedMotion](https://docs.swmansion.com/react-native-reanimated/docs/device/useReducedMotion/)). The source used it for screen options without that caveat. `reduceMotion: ReduceMotion.System` on each animation follows a change mid-session.
- "Reduced motion means **fewer and gentler**, not zero: keep opacity and color changes that explain a state change, drop translation, scale, parallax and overshoot. Screen transitions become `animation: 'fade'`." [Emil Kowalski, animate-expo] Same as rule 8 in [SKILL.md](SKILL.md).
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

## Recipe conventions

The recipes assume `npx expo install react-native-reanimated react-native-worklets react-native-gesture-handler expo-haptics`, the imports below, and the curves from [Spring or timing](#spring-or-timing). [Emil Kowalski, animate-expo]

```js
import { useState, useEffect, useMemo } from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedScrollHandler, useAnimatedReaction,
  withSpring, withTiming, interpolate, Extrapolation, Easing,
  FadeInDown, FadeOutDown, LinearTransition,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import * as Haptics from 'expo-haptics';
```

- **Gestures are wrapped in `useMemo`.** "Rebuilding a gesture on every render can reattach the recognizer and drop a drag that's mid-flight." The performance guide adds that the React Compiler memoizes them automatically.
- **Gesture Handler 3:** "Expo installs v2." In v3 each gesture is a hook taking one config object, `onStart` becomes `onActivate`, `onEnd` becomes `onDeactivate`, `success` becomes `event.canceled` (inverted), and old-API types get a `Legacy` prefix ([upgrading to 3](https://docs.swmansion.com/react-native-gesture-handler/docs/guides/upgrading-to-3/)). The source adds "The hook manages its own identity, so drop the `useMemo`"; the guide doesn't mention `useMemo`:

```jsx
const pan = usePanGesture({
  activeOffsetY: [-10, 10],
  onActivate: () => { context.set(translateY.get()); },
  onUpdate: (e) => { translateY.set(context.get() + e.translationY); },
  onDeactivate: (e) => { /* settle with withSpring as below */ },
});
```

## Two worklets: projection and rubber-banding

"Momentum projection decides *where a flick was going*, so a fast short swipe commits and a slow long one doesn't. Rubber-banding makes a boundary resist instead of stopping dead." [Emil Kowalski, animate-expo]

`project(velocity, decelerationRate = 0.998)` and `rubberband(overshoot, dimension, constant = 0.55)`, with their provenance (the source credits Apple; the projection matches Nathan Gitter's WWDC18 sample, the rubber band has no named source) and the other ways to project and resist, are in [MATH.md](MATH.md#gesture-handoff-project-normalise-resist). The recipes below call both from gesture callbacks, so in Reanimated each one starts with `'worklet';`, the rule in [Keep it off the JS thread](#keep-it-off-the-js-thread).

## Press feedback

"120ms and a 3% scale is the ceiling for something touched this often." No gesture, no shared value; `setState` is fine here, "it fires twice per press, not per frame." [Emil Kowalski, animate-expo]

```jsx
import Animated, { cubicBezier } from 'react-native-reanimated';
import { Pressable, StyleSheet } from 'react-native';

function PressableScale({ onPress, children }) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      hitSlop={12}
      pressRetentionOffset={16}
    >
      <Animated.View style={[styles.box, pressed && styles.pressed]}>{children}</Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    transform: [{ scale: 1 }],
    transitionProperty: 'transform',
    transitionDuration: '120ms',
    transitionTimingFunction: cubicBezier(0.23, 1, 0.32, 1),
  },
  pressed: { transform: [{ scale: 0.97 }] },
});
```

**Timing function, corrected:** Reanimated documents the predefined strings (`linear`, `ease`, `ease-in`, `ease-out`, `ease-in-out`, `step-start`, `step-end`) and the `cubicBezier(x1, y1, x2, y2)` helper imported from `react-native-reanimated`, with no `'cubic-bezier(...)'` string form ([transition-timing-function](https://docs.swmansion.com/react-native-reanimated/docs/css-transitions/transition-timing-function/)). The source wrote `transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)'`. `transitionDuration` does accept `'120ms'` ([transition-duration](https://docs.swmansion.com/react-native-reanimated/docs/css-transitions/transition-duration/)).

## Drag-to-dismiss sheet

"If the sheet is its own destination, use `presentation: 'formSheet'`" ([Screen transitions](#screen-transitions)); build this only when the sheet lives inside an existing screen. [Emil Kowalski, animate-expo]

```jsx
const translateY = useSharedValue(0);
const context = useSharedValue(0);

const pan = useMemo(() => Gesture.Pan()
  .activeOffsetY([-10, 10])   // let a horizontal swipe win; require intent before committing
  .onStart(() => {
    context.set(translateY.get());   // start from the current on-screen value, not from 0
  })
  .onUpdate((e) => {
    const next = context.get() + e.translationY;
    // downward is free; upward past the top resists
    translateY.set(next >= 0 ? next : rubberband(next, HEIGHT));
  })
  .onEnd((e) => {
    const projected = translateY.get() + project(e.velocityY);
    if (projected > HEIGHT * 0.4) {
      translateY.set(withSpring(HEIGHT, {
        duration: 300, dampingRatio: 1, velocity: e.velocityY, overshootClamping: true,
      }, (finished) => { if (finished) scheduleOnRN(onClose); }));
    } else {
      translateY.set(withSpring(0, { duration: 300, dampingRatio: 0.8, velocity: e.velocityY }));
      scheduleOnRN(Haptics.impactAsync, Haptics.ImpactFeedbackStyle.Light);   // it snapped home
    }
  }), [onClose]);

const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.get() }] }));
const backdropStyle = useAnimatedStyle(() => ({
  opacity: interpolate(translateY.get(), [0, HEIGHT], [1, 0], Extrapolation.CLAMP),
}));
```

- **`onStart` captures the current value;** without it, "grabbing a sheet mid-animation teleports it".
- **Velocity decides, not distance:** "a quick flick dismisses even a few pixels down. Requiring 40% travel makes the sheet feel heavy."
- **Velocity is handed to the spring:** "the single detail that most separates 'fluid' from 'fine'".
- **`overshootClamping` on dismissal,** or the sheet springs past the bottom and flashes a gap.
- The backdrop derives from the same value, "so it's always in sync and costs nothing". Web sheets: [SHEETS.md](SHEETS.md).

## Swipe to delete

Gesture Handler's `ReanimatedSwipeable` already does swipe-to-reveal actions; reach for it when the row reveals buttons, and build the gesture only for swipe-to-commit with projection. [Emil Kowalski, animate-expo] It imports from `react-native-gesture-handler/ReanimatedSwipeable`; props include `friction`, `leftThreshold` and `rightThreshold` (default half the panel width) and `overshootFriction` ("8 or higher feel more native"); its ref has `close`, `openLeft`, `openRight` and `reset` ([ReanimatedSwipeable](https://docs.swmansion.com/react-native-gesture-handler/docs/components/reanimated_swipeable/)).

```jsx
const x = useSharedValue(0);
const context = useSharedValue(0);

const pan = useMemo(() => Gesture.Pan()
  .activeOffsetX([-10, 10])   // must declare the axis, or it fights the vertical scroll
  .onStart(() => { context.set(x.get()); })   // grab mid-spring continues from where the row is, not from 0
  .onUpdate((e) => { x.set(Math.min(0, context.get() + e.translationX)); })
  .onEnd((e) => {
    const projected = x.get() + project(e.velocityX);
    if (projected < -SWIPE_THRESHOLD) {
      x.set(withTiming(-WIDTH, { duration: 200, easing: EASE_OUT }, (f) => {
        if (f) scheduleOnRN(onDelete, id);
      }));
    } else {
      x.set(withSpring(0, { duration: 300, dampingRatio: 1, velocity: e.velocityX }));
    }
  }), [onDelete, id]);
```

Closing the gap is the list's job: `const ROW_CLOSE = LinearTransition.duration(200);` at module scope, then `<Animated.FlatList data={items} itemLayoutAnimation={ROW_CLOSE} ... />`. `itemLayoutAnimation` works on a single-column list only (`numColumns` at most 1) and needs a `key` or `id` on items or a `keyExtractor` ([list layout animations](https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/list-layout-animations/)).

## Collapsing header

[Emil Kowalski, animate-expo]

```jsx
const scrollY = useSharedValue(0);
const onScroll = useAnimatedScrollHandler((e) => { scrollY.set(e.contentOffset.y); });

const titleStyle = useAnimatedStyle(() => ({
  opacity: interpolate(scrollY.get(), [0, 60], [1, 0], Extrapolation.CLAMP),
  transform: [{ translateY: interpolate(scrollY.get(), [0, 60], [0, -12], Extrapolation.CLAMP) }],
}));

<Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16}>
```

- **Never animate the header's `height` to collapse it:** "the one animation guaranteed to stutter, because it's competing with the scroll itself." Give the container a fixed height, translate the content, clip with `overflow: 'hidden'`.
- "`Extrapolation.CLAMP` is not optional": without it, opacity keeps going negative past 60.

## List entrances

```jsx
// The Reanimated docs recommend building layout animations outside components,
// or in useMemo: an inline chain in JSX rebuilds the builder on every render.
// A per-index delay can't live at module scope, so the row memoizes its own:
function Row({ item, index }) {
  const entering = useMemo(() => FadeInDown.duration(250).delay(index * 40), [index]);
  return <Animated.View entering={entering}>{/* ... */}</Animated.View>;
}
```

- The docs: "outside of components or with `useMemo`" ([entering and exiting](https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/entering-exiting-animations/)).
- **Stagger 30-80ms.** "Longer feels slow, shorter reads as simultaneous." [Emil Kowalski, animate-expo] **Both ways:** [TIMING.md](TIMING.md#staggers-and-sequencing) spaces list items 30-60 ms apart. Neither wins.
- **No `entering` on a virtualized row** (`FlatList`, `FlashList`): the source says rows are recycled, "so the animation re-fires every time one scrolls back into view". That is the source's view; the Reanimated docs don't say it (they note only that FlashList items can briefly sit in the wrong position when mounted during a running animation). Animate the container once, or use `itemLayoutAnimation` for reflow.
- "A list they scroll past all day should already be there."

## Keyboard-synced UI

`npx expo install react-native-keyboard-controller`, then `<KeyboardProvider>` in the root `_layout` next to `GestureHandlerRootView` ([Expo keyboard handling](https://docs.expo.dev/guides/keyboard-handling/)). The module "is not included in Expo Go", so it needs a development build, and it "requires react-native-reanimated". [Emil Kowalski, animate-expo]

```jsx
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';

const { height } = useReanimatedKeyboardAnimation();   // 0 → -keyboardHeight, on the UI thread
const footerStyle = useAnimatedStyle(() => ({ transform: [{ translateY: height.get() }] }));
```

- **The sign is unconfirmed:** the hook's page says `height` "changes between 0 and keyboardHeight" without a sign ([useReanimatedKeyboardAnimation](https://kirillzyusko.github.io/react-native-keyboard-controller/docs/api/hooks/keyboard/use-reanimated-keyboard-animation)), and Expo's guide uses `useKeyboardHandler` instead. Check the direction on a device before copying.
- "Never build this from `Keyboard.addListener` plus a timing animation." The keyboard rides a private system curve and the event arrives late, so any duration "will visibly lag or lead it".

## Tab indicator

Measure once with `onLayout` into state, then animate transforms. [Emil Kowalski, animate-expo]

```jsx
const [layouts, setLayouts] = useState({});   // measured with onLayout, not per frame
const x = useSharedValue(0);
const w = useSharedValue(0);

useEffect(() => {
  const l = layouts[active];
  if (!l) return;
  x.set(withTiming(l.x, { duration: 250, easing: EASE_IN_OUT }));
  w.set(withTiming(l.width, { duration: 250, easing: EASE_IN_OUT }));
}, [active, layouts]);

const pillStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: x.get() }],
  width: w.get(),
}));
```

- The sanctioned `width` animation: absolutely positioned, no children, "its corner radius survives". `ease-in-out`, because the pill moves across the screen. Fire `Haptics.selectionAsync()` on the press, not when the pill lands.
- `app-ui` does its segmented tabs this way instead: "the pill on a spring of 420, 32, 1; at up to 1000px/s it narrows by up to 35% and grows up to 21% taller", and "Only a user's pick springs it, by pointer or keyboard. A saved value arriving, a reset, or a resize places it instantly" ([../app-ui/CONTROLS.md](../app-ui/CONTROLS.md#segmented-tabs)); this recipe also animates on `layouts` changes. app-ui governs app-ui.

## Screen transitions

"Never rebuild a screen transition in JS: the native one runs on the platform side, keeps the interactive back gesture, and matches every other app on the device." [Emil Kowalski, animate-expo]

```jsx
<Stack screenOptions={{ animation: reduced ? 'fade' : 'default' }}>
  <Stack.Screen name="settings" />
  <Stack.Screen name="compose" options={{ presentation: 'modal' }} />
  <Stack.Screen name="filter" options={{
    presentation: 'formSheet',
    sheetAllowedDetents: 'fitToContents',
    sheetGrabberVisible: true,
  }} />
</Stack>
```

- **Corrected:** the source gave `settings` `options={{ animation: 'slide_from_right', animationMatchesGesture: true }}`. In React Navigation, `slide_from_right` "falls back to the default animation on iOS", and `animationMatchesGesture` is iOS-only, defaults to false and doesn't affect modals, so the pair adds nothing to the default push. `animationDuration` (iOS only, default 500) can't be set for `default`, `modal` or `formSheet` ([native stack navigator](https://reactnavigation.org/docs/native-stack-navigator/)).
- **`reduced` comes from `useReducedMotion()`,** which doesn't follow a mid-session change ([Reduced motion](#reduced-motion-and-text-size)).
- Deeper into a hierarchy: `animation: 'default'`. A self-contained task the user can abandon: `presentation: 'modal'`. A short interruption (picker, filter, share): `presentation: 'formSheet'` with detents. Between tabs: `animation: 'none'`. Reduced motion: `animation: 'fade'`.
- **`formSheet` differs by platform** ([Expo modals](https://docs.expo.dev/router/advanced/modals/)): Android caps detents at three; `sheetGrabberVisible` is iOS-only; Android form sheets can't host native headers or nested stacks; `fitToContents` needs explicitly sized content, not a `flex: 1` root.

## Toast

```jsx
// Module scope: layout-animation builders live outside the component.
const TOAST_ENTER = FadeInDown.duration(300).easing(EASE_OUT);
const TOAST_EXIT = FadeOutDown.duration(250).easing(EASE_OUT);

<Animated.View
  entering={TOAST_ENTER}
  exiting={TOAST_EXIT}
  style={{ position: 'absolute', bottom: insets.bottom + 16, left: 16, right: 16 }}
/>
```

- "The 300ms cap holds here too": a toast is uninvited, so it should be "quicker and quieter than motion the user asked for". It exits the way it entered. Safe-area insets always. [Emil Kowalski, animate-expo]
- **"Exit ~20% faster than entry."** **Both ways:** rule 4 in [SKILL.md](SKILL.md) makes exits "about half to two thirds of the entrance", and [TIMING.md](TIMING.md#duration-by-element) gives a toast "250-350 in, 150-200 out". Neither wins.
- Stacked toasts that reflow: add `itemLayoutAnimation` and tune the opacity against the reflow by eye; "there's no formula for that pair. Look at it again the next day."

## Fire once at a threshold

For a detent, a snap or pull-to-refresh arming: don't poll from JS and don't `scheduleOnRN` every frame. [Emil Kowalski, animate-expo]

```jsx
const armed = useSharedValue(false);

useAnimatedReaction(
  () => pullDistance.get() > REFRESH_THRESHOLD,
  (isArmed, wasArmed) => {
    if (isArmed !== wasArmed) {
      armed.set(isArmed);
      scheduleOnRN(Haptics.impactAsync, Haptics.ImpactFeedbackStyle.Light);
    }
  }
);
```

"The comparison runs on the UI thread every frame; the JS call happens twice per pull."

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
