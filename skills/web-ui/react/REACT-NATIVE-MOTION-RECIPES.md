# React Native motion recipes

Worked React Native and Expo motion recipes from Emil Kowalski's animate-expo skill, with the existing official corrections and source disagreements preserved. Read [motion policy and setup](REACT-NATIVE-MOTION.md) first; the recipes use its [curves and springs](REACT-NATIVE-MOTION.md#spring-or-timing) and [UI-runtime rules](REACT-NATIVE-MOTION.md#keep-it-off-the-js-thread). [Emil Kowalski, animate-expo]

**Contents:** [Recipe conventions](#recipe-conventions) · [Two worklets: projection and rubber-banding](#two-worklets-projection-and-rubber-banding) · [Press feedback](#press-feedback) · [Drag-to-dismiss sheet](#drag-to-dismiss-sheet) · [Swipe to delete](#swipe-to-delete) · [Collapsing header](#collapsing-header) · [List entrances](#list-entrances) · [Keyboard-synced UI](#keyboard-synced-ui) · [Tab indicator](#tab-indicator) · [Screen transitions](#screen-transitions) · [Toast](#toast) · [Fire once at a threshold](#fire-once-at-a-threshold) · [Prove it](#prove-it)

## Recipe conventions

The recipes assume `npx expo install react-native-reanimated react-native-worklets react-native-gesture-handler expo-haptics`, the imports below, and the curves from [Spring or timing](REACT-NATIVE-MOTION.md#spring-or-timing). [Emil Kowalski, animate-expo]

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

`project(velocity, decelerationRate = 0.998)` and `rubberband(overshoot, dimension, constant = 0.55)`, with their provenance (the source credits Apple; the projection matches Nathan Gitter's WWDC18 sample, the rubber band has no named source) and the other ways to project and resist, are in [ui-animation MATH.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/MATH.md#gesture-handoff-project-normalise-resist). The recipes below call both from gesture callbacks, so in Reanimated each one starts with `'worklet';`, the rule in [Keep it off the JS thread](REACT-NATIVE-MOTION.md#keep-it-off-the-js-thread).

For a recipe that calls `project` or `rubberband`, the named ui-animation `MATH.md` section above is a required source reference, available from that installed skill or its linked public source. These recipes do not bundle those helper definitions; if the reference is unavailable, report it rather than inventing a replacement. [Emil Kowalski, animate-expo; ui-animation MATH.md, Gesture handoff]

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
- The backdrop derives from the same value, "so it's always in sync and costs nothing". Web sheets: [ui-animation SHEETS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SHEETS.md).

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
- **Stagger 30-80ms.** "Longer feels slow, shorter reads as simultaneous." [Emil Kowalski, animate-expo] **Both ways:** [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md#staggers-and-sequencing) spaces list items 30-60 ms apart. Neither wins.
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
- `app-ui` does its segmented tabs this way instead: "the pill on a spring of 420, 32, 1; at up to 1000px/s it narrows by up to 35% and grows up to 21% taller", and "Only a user's pick springs it, by pointer or keyboard. A saved value arriving, a reset, or a resize places it instantly" ([app-ui CONTROLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CONTROLS.md#segmented-tabs)); this recipe also animates on `layouts` changes. app-ui governs app-ui.

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
- **`reduced` comes from `useReducedMotion()`,** which doesn't follow a mid-session change ([Reduced motion](REACT-NATIVE-MOTION.md#reduced-motion-and-text-size)).
- Deeper into a hierarchy: `animation: 'default'`. A self-contained task the user can abandon: `presentation: 'modal'`. A short interruption (picker, filter, share): `presentation: 'formSheet'` with detents. Between tabs: `animation: 'none'`. Reduced motion: `animation: 'fade'`.
- **Native sheet platform limits:** read [React Native sheets and modals](REACT-NATIVE.md#sheets-and-modals) for detents, grabbers, native headers, nested stacks and fitToContents sizing before using this recipe. [Expo modals](https://docs.expo.dev/router/advanced/modals/)

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
- **"Exit ~20% faster than entry."** **Both ways:** rule 4 in [ui-animation SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md) makes exits "about half to two thirds of the entrance", and [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md#duration-by-element) gives a toast "250-350 in, 150-200 out". Neither wins.
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

## Prove it

Use the [device feel checks and reporting contract](REACT-NATIVE-MOTION.md#prove-it): flick, interrupt and reverse the interaction in a release build on the slowest supported device. Keep the recipe's own correction notes, platform limits and unconfirmed behavior visible. [Emil Kowalski, animate-expo]
