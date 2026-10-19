# Flutter animation

Enter and exit timing, curves and springs (`SpringDescription`, `SpringSimulation`, scroll physics, routes, the `motor` package), implicit and switched animations, one controller with `Interval`s, a reusable `flutter_animate` entrance and animated gradients. Sources: FlutterPro tips by Kamran Bekirov (flutterpro.design) and ApparenceKit Flutter tips (apparencekit.dev), extracted from the existing Flutter UX motion guidance. Neither states a Flutter, Dart or package version; check `motor` and `flutter_animate` names against their current pub.dev release before copying. The framework-neutral numbers (durations, staggers, spring presets for Motion and CSS) live in [web-ui/ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md); where these sources disagree with it, both are stated below. Press feedback, haptics, snack bars, loading indicators and swipe hints remain in [flutter-ux MOTION-AND-FEEDBACK.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/MOTION-AND-FEEDBACK.md).

**Contents:** [Enter slow, exit fast](#enter-slow-exit-fast) · [Curve names](#curve-names) · [Springs](#springs) · [Implicit animations](#implicit-animations) · [AnimatedSwitcher and keys](#animatedswitcher-and-keys) · [Animate on a property change](#animate-on-a-property-change) · [Chain on one controller](#chain-on-one-controller) · [One reusable entrance](#one-reusable-entrance) · [Animated gradient button](#animated-gradient-button) · [Prove it](#prove-it)

## Enter slow, exit fast

[FlutterPro](https://flutterpro.design/details/enter-slow-exit-fast)

- An entering element is new information: users need a beat to notice it. An exiting element "is already dismissed in the user's head: every extra frame is waiting." So the two directions must not share one animation.
- Material's spec: enter over 400ms on a decelerate curve, exit over 200ms on an accelerate curve. Flutter ships both:

```
final AnimationController controller = AnimationController(
  vsync: this,
  duration: const Duration(milliseconds: 400),
  reverseDuration: const Duration(milliseconds: 200),
);
  
final CurvedAnimation animation = CurvedAnimation(
  parent: controller,
  curve: Easing.emphasizedDecelerate,
  reverseCurve: Easing.emphasizedAccelerate,
);
```

- In a route, the same split is `transitionDuration` and `reverseTransitionDuration`.
- **How much faster, two views.** FlutterPro: the Material pair, exit half the entrance (entrance 100% longer). ui-animation [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md#staggers-and-sequencing): "Entrances run 30-50% longer than exits"; its SKILL.md says exits are "about half to two thirds of the entrance". Pick one per app.
- **Springs: the difference is also bounce.** FlutterPro: "An expressive spring overshoots ... that bounce is what makes users notice the entrance. On an exit the same bounce pulls attention to something that's leaving. So exits use a standard spring: it stops at the target, no bounce." The rule is relative: "whatever spring the entrance uses, exit on a faster one without bounce." ui-animation [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md) agrees on the exit (`bounce: 0`) but gives its enter spring `bounce: 0` too and keeps overshoot "for true landings (a toggle knob, a dropped card), a couple per screen at most". Both stated; neither wins.
- With the `motor` package's Material springs, entering on `expressiveSpatialDefault` means exiting on `standardSpatialFast`:

```
// Enter slower, with bounce
static const Motion enter = MaterialSpringMotion.expressiveSpatialDefault();
// Exit faster, no bounce
static const Motion exit = MaterialSpringMotion.standardSpatialFast();
```

- Rolling your own `SpringDescription`: raise the stiffness and keep the damping ratio at 1 or above for the exit. "Stiffer is faster, and at full damping there is no bounce."

## Curve names

[FlutterPro](https://flutterpro.design/details/enter-slow-exit-fast)

- `Curves` encodes the shape in the name: every `easeOut*` curve decelerates (starts fast, lands gently), every `easeIn*` curve accelerates (starts gently, leaves fast). "Yes, the names cross: In/Out is about where the motion is slow, not about entering the screen."
- Any twin pair works: `easeOutCubic` in, `easeInCubic` out. The suffix is the strength: `Quad`, `Cubic`, `Quart`, `Quint`, each sharper than the last.

## Springs

[FlutterPro](https://flutterpro.design/details/spring-physics)

- Flutter's spring has three properties:

```
SpringDescription(
  mass: 1.0,
  stiffness: 100.0,
  damping: 10.0,
)
```

| Property | What it does | Low | High |
|---|---|---|---|
| `mass` | how heavy; heavier is slower to start and to stop | 0.3: quick, light, snappy | 2.0: slow, heavy, lazy |
| `stiffness` | how strong the pull back | 50: slow, soft, takes time to settle | 500: fast, sharp, snaps into place |
| `damping` | how fast the bouncing stops | 3: bounces many times | 30: barely bounces, settles almost immediately |

- Zero damping bounces forever: "never use this". The source shows the block above to name the three properties; ui-animation TIMING.md says Motion's default with the same numbers "wobbles visibly".
- **Drive a spring through a controller** with `animateWith` and a `SpringSimulation`. Use it in a gesture's `onEnd`, or wherever you'd call `.forward()` / `.animateTo()`. Pass the release velocity in so the spring carries the user's motion (drag-to-dismiss sheets, swipeable cards):

```
_controller.animateWith(
  SpringSimulation(
    SpringDescription(
      mass: 0.5, 
      stiffness: 200, 
      damping: 18,
    ),
    _controller.value, // start
    1.0,               // end
    0,                 // initial velocity
  ),
);
```

- **Pitfall:** use `AnimationController.unbounded(vsync: this)`. "A plain `AnimationController` clamps values to `[0, 1]` and silently eats the spring's overshoot, so the bounce disappears."
- **Scroll physics.** Every scrollable takes `physics`; override the `spring` getter:

```
class SnappyPagePhysics extends PageScrollPhysics {
  const SnappyPagePhysics({super.parent});
  
  @override
  SpringDescription get spring {
    return SpringDescription(
      mass: 0.5,
      stiffness: 200,
      damping: 18,
    );
  }
  
  @override
  SnappyPagePhysics applyTo(ScrollPhysics? ancestor) {
    return SnappyPagePhysics(
      parent: buildParent(ancestor),
    );
  }
}
```

```
PageView(
  physics: const SnappyPagePhysics(),
  children: pages,
)
```

- Works on `PageView`, `TabBarView` (snap between pages); `ListWheelScrollView` (snap to items in pickers); `CarouselView` (snap between items); `ListView`, `GridView`, `SingleChildScrollView`, `CustomScrollView` (edge bounce-back); `NestedScrollView`, `ReorderableListView`.
- **Pitfall:** snapping widgets feel the spring every swipe. Free-scrolling lists use it for edge bounce-back only under `BouncingScrollPhysics` (iOS default); Android's `ClampingScrollPhysics` glows instead.
- **Routes:** override `TransitionRoute.createSimulation()` to return a `SpringSimulation` instead of a duration-based curve, and the route enters and exits on the spring.
- **Presets.** "There are no correct values ... Tweak until it feels right." The [motor](https://pub.dev/packages/motor) package ships presets matching each platform's design system:

```
// iOS feel
SingleMotionBuilder(
  // autocomplete to see other variants too
  motion: CupertinoMotion.bouncy(), 
  value: target,
  builder: (context, v, _) {
    return Transform.translate(
      offset: Offset(v, 0),
      child: child,
    );
  },
);
  
// Material 3 feel
SingleMotionBuilder(
  // autocomplete to see other variants too
  motion: MaterialSpringMotion.expressiveSpatialDefault(),
  value: target,
  builder: (context, v, _) {
    return Transform.translate(
      offset: Offset(v, 0),
      child: child,
    );
  },
);
```

- `MaterialSpringMotion` splits spatial (position, size) from effects (opacity, color), each standard or expressive at fast, default or slow. "Match the platform you're emulating, or mix on purpose."
- "Using one spring across platforms is fine, they are high-quality standards. If you want users to feel more at home, use `CupertinoMotion` on iOS/macOS, and `MaterialSpringMotion` on the rest." [FlutterPro](https://flutterpro.design/details/pressable-spring)

## Implicit animations

[ApparenceKit](https://apparencekit.dev/flutter-tips/easy-implicit-text-animations-flutter/)

- Implicit animations are widgets that automatically animate changes to their properties: "When a certain property is updated, the widget handles the smooth transition from the old value to the new one all by itself."
- `AnimatedDefaultTextStyle` animates between text styles. Props: `curve` (example `Curves.bounceIn`), `duration` (example `Duration(milliseconds: 1300)`), `style` (the target `TextStyle`), `child` (the `Text`).
- **Pitfall:** "Make sure not to set a `style` directly on the child `Text` widget, as `AnimatedDefaultTextStyle` manages it."
- Trigger: update the style variables (`textColor`, `fontSize`) inside `setState`; the widget detects the change and animates. Example: a button toggles the color red to black and changes the size.
- **Example values, two views.** The source's 1300 ms `Curves.bounceIn` is an example. ui-animation [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md) caps a hero reveal at 600-1200 ms and says "Errors, prices and numbers never bounce."

## AnimatedSwitcher and keys

[ApparenceKit](https://apparencekit.dev/flutter-tips/animatedswitcher-riverpod-animate-text/)

- `AnimatedSwitcher` animates between its old and new child when the child changes. Default is a fade; customize it with `transitionBuilder`. It works for any two widgets, not only text. The rebuild on a state change "is what `AnimatedSwitcher` needs to potentially trigger an animation".
- **Pitfall, the key:** when the same widget type (a `Text`) changes content, key it on the changing value, `ValueKey(state.value.myText)`. The key change makes `AnimatedSwitcher` treat it as a new widget and run the animation.
- The source's example: a `ScaleTransition` in `transitionBuilder`, 250 ms, `Curves.easeInOut`, state from Riverpod. The [flutter skill's architecture](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ARCHITECTURE.md) uses `ChangeNotifier` and `ListenableBuilder` instead.

## Animate on a property change

[ApparenceKit](https://apparencekit.dev/flutter-tips/run-animation-property-change/)

- `didUpdateWidget(oldWidget)` runs each time the `StatefulWidget` is rebuilt with new data; compare `widget.x` with `oldWidget.x` to start or reverse a controller. "Using `didUpdateWidget` is the standard way to react to property changes in a StatefulWidget".
- **Pitfall:** it fires whenever any property changes, so the check must be specific.

```dart
@override
void didUpdateWidget(covariant UploadedAvatarAnimation oldWidget) {
  super.didUpdateWidget(oldWidget);
  if (widget.isUploading && !oldWidget.isUploading) {
    // Start your animation here
    _controller.forward(from: 0);
  }
}
```

- Several transitions: switch on a record of old and new values:

```dart
@override
void didUpdateWidget(covariant UploadedAvatarAnimation oldWidget) {
  super.didUpdateWidget(oldWidget);
  final (wasUploading, isUploading) = (
    oldWidget.isUploading,
    widget.isUploading
  );
  switch ((wasUploading, isUploading)) {
    case (false, true):
      // Transition from not uploading to uploading
      _controller.forward(from: 0);
      break;
    case (true, false):
      // Transition from uploading to not uploading
      _controller.reverse(from: 1);
      break;
    default:
      // No change in upload status or other transitions
      break;
  }
}
```

- **Style, two views:** the source writes `break;` in each case. The [dart skill](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/dart/RECORDS-AND-PATTERNS.md) says Dart 3 "non-empty cases break implicitly (no `break`)", so the `break` lines are redundant there; both compile.

## Chain on one controller

[ApparenceKit](https://apparencekit.dev/flutter-tips/create-complex-flutter-animations/)

- Manage the whole timeline with one `AnimationController`. For each part (fade, move, resize) create a `CurvedAnimation` on that controller with an `Interval` that defines when it runs inside the total duration. Parts can sequence or overlap. The source has no code. The web-side sequencing rules are ui-animation's [four placements](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md#composing-a-sequence) (sequential, overlapping, simultaneous, staggered).

## One reusable entrance

[ApparenceKit](https://apparencekit.dev/flutter-tips/consistent-animations-flutter-app/)

- Define an entrance once as a `StatelessWidget` wrapping `Animate` from `flutter_animate`, and reuse it everywhere so every screen moves the same way. Expose `delayInMs` for staggering.

```dart
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

class MoveFadeAnim extends StatelessWidget {
  final int? delayInMs;
  final Widget child;

  const MoveFadeAnim({
    super.key,
    required this.child,
    this.delayInMs,
  });

  @override
  Widget build(BuildContext context) {
    return Animate(
      effects: [
        // Add your list of effects here
      ],
      child: child,
    );
  }
}
```

```dart
effects: [
  FadeEffect(
    delay: Duration(milliseconds: delayInMs ?? 0),
    duration: const Duration(milliseconds: 300),
    curve: Curves.easeIn,
  ),
  MoveEffect(
    delay: Duration(milliseconds: delayInMs ?? 0),
    duration: const Duration(milliseconds: 450),
    curve: Curves.easeOut,
    begin: const Offset(0, 50),
    end: Offset.zero,
  ),
],
```

```dart
// Example usage in a list builder
return MoveFadeAnim(
  delayInMs: index * 150 + 50, // Calculate delay for staggered effect
  child: MenuCard(
    height: 130,
    // ... other properties
  ),
);
```

- **Stagger, two views.** ApparenceKit staggers 150 ms per item with no cap (index 4 starts at 650 ms). ui-animation [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md#staggers-and-sequencing): "Total stagger under about 500 ms, whatever the count: list items 30-60 ms apart", and animate only the first visible 8 to 12. Its card and list-item range is 200-350 ms, which the 300 ms fade fits and the 450 ms move exceeds.

## Animated gradient button

[ApparenceKit](https://apparencekit.dev/flutter-tips/gradient-button-with-animation/)

- Make the widget stateful; wrap a Material button in a container that carries the gradient; on tap run an animation and compute the colors with `Color.lerp` from the animation's value; when it finishes, animate back.
- Further options the source lists: your own render object, rebuild the button without `MaterialButton`, or extend `ButtonStyleButton`. No code in the source.

## Prove it

- Every `AnimationController` that animates in both directions sets `reverseDuration` (or the route sets `reverseTransitionDuration`), and the exit is shorter than the entrance.
- Every controller driven by a bouncy `SpringSimulation` is `AnimationController.unbounded`; on a drag release the simulation gets the gesture's velocity, not `0`.
- A custom `ScrollPhysics` overrides `applyTo` and returns its own type with `buildParent(ancestor)`.
- Every `AnimatedSwitcher` whose child keeps the same type carries a `ValueKey` on the changing value; no `Text` under `AnimatedDefaultTextStyle` sets its own `style`.
- Every `didUpdateWidget` compares a specific field of `widget` and `oldWidget` before starting a controller.
- Entrance animations come from one shared widget; list staggers have a chosen per-item delay and a cap the team agreed on (see the two views above).
