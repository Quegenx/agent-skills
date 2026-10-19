# Motion and feedback

How a Flutter app moves and answers a touch: enter and exit timing, curves and springs (`SpringDescription`, `SpringSimulation`, scroll physics, routes, the `motor` package), implicit and switched animations, one controller with `Interval`s, a reusable `flutter_animate` entrance, press feedback, stripping Material tap effects, haptics, snack bars, switch thumb icons, a neutral spinner, a rounded progress bar and a swipe-action hint. Sources: FlutterPro tips by Kamran Bekirov (flutterpro.design) and ApparenceKit Flutter tips (apparencekit.dev). Neither states a Flutter, Dart or package version; check `motor`, `haptic_feedback`, `flutter_slidable`, `once` and `flutter_animate` names against their current pub.dev release before copying. The framework-neutral numbers (durations, staggers, spring presets for Motion and CSS) live in [frontend/ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/frontend/ui-animation/TIMING.md); where these sources disagree with it, both are stated below. Painting with `CustomPainter`, image export and media are in [PAINTING-AND-MEDIA.md](PAINTING-AND-MEDIA.md).

**Contents:** [Enter slow, exit fast](#enter-slow-exit-fast) · [Curve names](#curve-names) · [Springs](#springs) · [Implicit animations](#implicit-animations) · [AnimatedSwitcher and keys](#animatedswitcher-and-keys) · [Animate on a property change](#animate-on-a-property-change) · [Chain on one controller](#chain-on-one-controller) · [One reusable entrance](#one-reusable-entrance) · [Animated gradient button](#animated-gradient-button) · [Press feedback](#press-feedback) · [Strip Material tap effects](#strip-material-tap-effects) · [Haptics](#haptics) · [Snack bars](#snack-bars) · [Switch thumb icons](#switch-thumb-icons) · [Loading indicators](#loading-indicators) · [Swipe-action hint](#swipe-action-hint) · [Prove it](#prove-it)

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
- **How much faster, two views.** FlutterPro: the Material pair, exit half the entrance (entrance 100% longer). ui-animation [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/frontend/ui-animation/TIMING.md#staggers-and-sequencing): "Entrances run 30-50% longer than exits"; its SKILL.md says exits are "about half to two thirds of the entrance". Pick one per app.
- **Springs: the difference is also bounce.** FlutterPro: "An expressive spring overshoots ... that bounce is what makes users notice the entrance. On an exit the same bounce pulls attention to something that's leaving. So exits use a standard spring: it stops at the target, no bounce." The rule is relative: "whatever spring the entrance uses, exit on a faster one without bounce." ui-animation [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/frontend/ui-animation/TIMING.md) agrees on the exit (`bounce: 0`) but gives its enter spring `bounce: 0` too and keeps overshoot "for true landings (a toggle knob, a dropped card), a couple per screen at most". Both stated; neither wins.
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
- **Example values, two views.** The source's 1300 ms `Curves.bounceIn` is an example. ui-animation [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/frontend/ui-animation/TIMING.md) caps a hero reveal at 600-1200 ms and says "Errors, prices and numbers never bounce."

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

- **Style, two views:** the source writes `break;` in each case. The [dart skill](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/dart/RECORDS-AND-PATTERNS.md) says Dart 3 "non-empty cases break implicitly (no `break`)", so the `break` lines are redundant there; both compile.

## Chain on one controller

[ApparenceKit](https://apparencekit.dev/flutter-tips/create-complex-flutter-animations/)

- Manage the whole timeline with one `AnimationController`. For each part (fade, move, resize) create a `CurvedAnimation` on that controller with an `Interval` that defines when it runs inside the total duration. Parts can sequence or overlap. The source has no code. The web-side sequencing rules are ui-animation's [four placements](https://github.com/Quegenx/agent-skills/blob/main/skills/frontend/ui-animation/TIMING.md#composing-a-sequence) (sequential, overlapping, simultaneous, staggered).

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

- **Stagger, two views.** ApparenceKit staggers 150 ms per item with no cap (index 4 starts at 650 ms). ui-animation [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/frontend/ui-animation/TIMING.md#staggers-and-sequencing): "Total stagger under about 500 ms, whatever the count: list items 30-60 ms apart", and animate only the first visible 8 to 12. Its card and list-item range is 200-350 ms, which the 300 ms fade fits and the 450 ms move exceeds.

## Animated gradient button

[ApparenceKit](https://apparencekit.dev/flutter-tips/gradient-button-with-animation/)

- Make the widget stateful; wrap a Material button in a container that carries the gradient; on tap run an animation and compute the colors with `Color.lerp` from the animation's value; when it finishes, animate back.
- Further options the source lists: your own render object, rebuild the button without `MaterialButton`, or extend `ButtonStyleButton`. No code in the source.

## Press feedback

[FlutterPro](https://flutterpro.design/details/pressable-spring)

- `motor` ships iOS spring presets and Material 3 motion tokens; `SingleMotionBuilder` animates a value to a target on the chosen spring:

```
SingleMotionBuilder(
  // autocomplete to see other variants, MaterialSpringMotion too
  motion: CupertinoMotion.smooth(),
  value: _scale,
  builder: (context, scale, child) {
    return Transform.scale(
      scale: scale, 
      child: child
    );
  },
  child: widget.child,
);
```

- A reusable widget, pressed to scale 0.96:

```
class Pressable extends StatefulWidget {
  final VoidCallback? onTap;
  final Widget child;
  
  const Pressable({
    super.key, 
    this.onTap, 
    required this.child,
  });
  
  @override
  State<Pressable> createState() => _PressableState();
}

class _PressableState extends State<Pressable> {
  double _scale = 1.0;
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      onTapDown: (_) {
        setState(() {
          _scale = 0.96;
        });
      },
      onTapUp: (_) {
        setState(() {
          _scale = 1.0;
        });
      },
      onTapCancel: () {
        setState(() {
          _scale = 1.0;
        });
      },
      child: SingleMotionBuilder(
        motion: CupertinoMotion.smooth(),
        value: _scale,
        builder: (context, scale, child) {
          return Transform.scale(
            scale: scale, 
            child: child,
          );
        },
        child: widget.child,
      ),
    );
  }
}
```

- **Press depth and timing, views side by side.** FlutterPro: 0.96 on `CupertinoMotion.smooth()`, the same spring in and out. ui-animation [ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/frontend/ui-animation/PATTERNS.md#buttons-presses-and-feedback): 0.97 with its `ui` spring, under 100 ms in, and "press in faster than release" (Kiem's playful press goes to 0.94). None wins.

## Strip Material tap effects

[FlutterPro](https://flutterpro.design/details/strip-material-tap-effects)

- `splashFactory: NoSplash.splashFactory` on `ThemeData` disables the ripple globally; the global properties cover every widget that uses Flutter's default ink: `InkWell`, `ListTile`, `Chip`, `BottomNavigationBar`, `NavigationRail`, `NavigationDrawer`, `PopupMenuButton`.
- **Pitfall:** that's only the ripple. M3 widgets also show an overlay color on press, hover and focus from their own component theme through `overlayColor`; the global splash properties don't touch it. The full theme (if a property errors because you already set it, move your value inside this one):

```
final ButtonStyle noSplash = ButtonStyle(
  overlayColor: WidgetStateProperty.all(
    Colors.transparent,
  ),
  splashFactory: NoSplash.splashFactory,
);
  
ThemeData(
  // Disable global ripple/highlight
  splashColor: Colors.transparent,
  splashFactory: NoSplash.splashFactory,
  highlightColor: Colors.transparent,
  hoverColor: Colors.transparent,
  focusColor: Colors.transparent,
  
  // Disable each widget's own tap effect.
  iconButtonTheme: IconButtonThemeData(
    style: noSplash,
  ),
  
  floatingActionButtonTheme: FloatingActionButtonThemeData(
    splashColor: Colors.transparent,
  ),
  textButtonTheme: TextButtonThemeData(
    style: noSplash,
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: noSplash,
  ),
  outlinedButtonTheme: OutlinedButtonThemeData(
    style: noSplash,
  ),
  filledButtonTheme: FilledButtonThemeData(
    style: noSplash,
  ),
  
  navigationBarTheme: NavigationBarThemeData(
    overlayColor: WidgetStateProperty.all(
      Colors.transparent,
    ),
  ),
  tabBarTheme: TabBarThemeData(
    overlayColor: WidgetStateProperty.all(
      Colors.transparent,
    ),
    splashFactory: NoSplash.splashFactory,
  ),
  
  checkboxTheme: CheckboxThemeData(
    overlayColor: WidgetStateProperty.all(
      Colors.transparent,
    ),
    splashRadius: 0,
  ),
  radioTheme: RadioThemeData(
    overlayColor: WidgetStateProperty.all(
      Colors.transparent,
    ),
    splashRadius: 0,
  ),
  switchTheme: SwitchThemeData(
    overlayColor: WidgetStateProperty.all(
      Colors.transparent,
    ),
  ),
  sliderTheme: SliderThemeData(
    overlayColor: Colors.transparent,
    overlayShape: SliderComponentShape.noOverlay,
  ),
  
  menuButtonTheme: MenuButtonThemeData(
    style: noSplash,
  ),
  segmentedButtonTheme: SegmentedButtonThemeData(
    style: noSplash,
  ),
  toggleButtonsTheme: ToggleButtonsThemeData(
    splashColor: Colors.transparent,
    highlightColor: Colors.transparent,
  ),
  searchBarTheme: SearchBarThemeData(
    overlayColor: WidgetStateProperty.all(
      Colors.transparent,
    ),
  ),
)
```

- The block imports from `package:flutter/material.dart` and uses `TabBarThemeData`, the newer class name; see the [flutter VERSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/VERSIONS.md) for the Material package move.
- **Pressed state.** ui-animation [ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/frontend/ui-animation/PATTERNS.md#buttons-presses-and-feedback): "Every pressable element has a pressed state". FlutterPro strips the ripple for a custom design language and does not say what replaces it; its `Pressable` above is a press state that uses no ink.

## Haptics

[FlutterPro](https://flutterpro.design/details/haptic-feedback)

- Flutter's built-in `HapticFeedback` covers only a few generic types; the [haptic_feedback](https://pub.dev/packages/haptic_feedback) package gives more. Wrap it so the `canVibrate` check isn't repeated:

```
import 'package:haptic_feedback/haptic_feedback.dart';
  
class HapticsHelper {
  HapticsHelper._();
  
  static bool? _canVibrate;
  
  static Future<void> _vibrate(HapticsType type) async {
    _canVibrate ??= await Haptics.canVibrate();
    
    if (_canVibrate ?? false) {
      await Haptics.vibrate(type);
    }
  }
  
  // Declarative shorthand for each type
  static Future<void> success() => _vibrate(HapticsType.success);
  static Future<void> warning() => _vibrate(HapticsType.warning);
  static Future<void> error() => _vibrate(HapticsType.error);
  static Future<void> light() => _vibrate(HapticsType.light);
  static Future<void> medium() => _vibrate(HapticsType.medium);
  static Future<void> heavy() => _vibrate(HapticsType.heavy);
  static Future<void> selection() => _vibrate(HapticsType.selection);
}
```

```
await HapticsHelper.success();
```

- The pairings below also name `rigid` and `soft`, which the helper does not wrap.
- Pairings: "no formula ... learn these common pairings, then trust your own judgement".

| Type | When |
|---|---|
| success | purchase completed, form submitted, file upload finished, task marked done |
| warning | incomplete form, back button with unsaved changes, storage almost full |
| error | wrong password, payment declined, network request failed |
| light | tap a like button, toggle a switch, open a bottom sheet, tap a tab bar item |
| medium | pull-to-refresh triggers, long press on a message, drag and drop an item, slider reaches a snap point |
| heavy | confirm account deletion, clear all data, force close a session, complete a high-value transaction |
| rigid | dragging to snap positions, resizing UI elements, rearranging items on a board, element snaps to grid |
| soft | toggling a checkbox, adjusting settings in a relaxation app, gentle confirmations |
| selection | scroll through a date picker, pick from a dropdown, swipe between options, select a color or size |

- "The best haptic experience is one that people may not be conscious of, but miss when it's turned off" (Apple HIG, https://developer.apple.com/design/human-interface-guidelines/playing-haptics, as quoted by the source).

## Snack bars

[FlutterPro](https://flutterpro.design/details/dont-show-snackbar-twice)

- Don't show the same snack bar twice. If it's already on screen, shake it instead: "A duplicate tells the user nothing new. The shake says 'this just happened again' without piling up copies of the same message."
- If that snack bar is on screen but stacked behind a newer one, bring it to the front and reset its timer so it stays long enough to read again.
- Reference implementation: bunpod.app's open-source [expressive_snack](https://github.com/kamranbekirovyz/bunpod/tree/main/packages/expressive_snack) package (handles both, plus RTL and icons). The source gives no shake duration; ui-animation [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/frontend/ui-animation/TIMING.md) gives an error shake 300-400 ms, never a bounce. The state side (an error shows once because it is cleared first) is in the [flutter ARCHITECTURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ARCHITECTURE.md).

## Switch thumb icons

[FlutterPro](https://flutterpro.design/details/switch-thumb-icons)

- `Switch.thumbIcon` takes a `WidgetStateProperty`; `selected` is the on state, `any` covers everything else:

```
Switch(
  value: isDark,
  thumbIcon: const WidgetStateProperty<Icon?>.fromMap({
    WidgetState.selected: Icon(
      Icons.dark_mode_rounded,
    ),
    WidgetState.any: Icon(
      Icons.light_mode_rounded,
    ),
  }),
  onChanged: ...,
)
```

- Choosing icons: both sides a real state (dark theme): a real icon each, moon on, sun off. Off just means not enabled (Download over Wi-Fi only): Wi-Fi on, a plain X off. The tile already has an icon (New episode alerts, a bell): check and X, so the thumb doesn't repeat it.
- **Pitfall:** "Don't leave the off side without an icon: the thumb gets smaller and bigger as you toggle."
- The map accepts any `WidgetState` (`pressed`, `dragged`, `hovered`, `focused`, `scrolledUnder`, `disabled`, `error`), combinable with `&`:

```
WidgetState.disabled & WidgetState.selected: Icon(...)
```

- "iOS apps rarely use thumb icons, so think twice before adding them to `Switch.adaptive` or `CupertinoSwitch`."
- The author's clear on-state title advice and the P2 correction to the title-only screen-reader claim are in [flutter ACCESSIBILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ACCESSIBILITY.md#semantics-and-screen-readers). [FlutterPro](https://flutterpro.design/details/switch-thumb-icons), [SwitchListTile](https://api.flutter.dev/flutter/material/SwitchListTile-class.html)

## Loading indicators

### Neutral spinner

[FlutterPro](https://flutterpro.design/details/neutral-loading-spinner)

- `CircularProgressIndicator` is a Material widget; in a custom design "the spinner is one of the last places Material leaks in". A copy-paste spinner that imports only `package:flutter/widgets.dart`:

```
import 'dart:math';
import 'package:flutter/widgets.dart';
  
const Color _defaultColor = Color(0xFF1A1A1A);
  
class Spinner extends StatefulWidget {
  final double size;
  final double strokeWidth;
  final Color? color;
  
  const Spinner({
    super.key,
    this.size = 20,
    this.strokeWidth = 2,
    this.color,
  });
  
  @override
  State<Spinner> createState() => SpinnerState();
}
  
class SpinnerState extends State<Spinner>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  
  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(
        milliseconds: 1000,
      ),
    )..repeat();
  }
  
  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Loading',
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return Transform.rotate(
            angle: _controller.value * 2 * pi,
            child: CustomPaint(
              painter: _SpinnerPainter(
                color: widget.color ?? _defaultColor,
                strokeWidth: widget.strokeWidth,
              ),
              size: Size.square(
                widget.size,
              ),
            ),
          );
        },
      ),
    );
  }
}
  
class _SpinnerPainter extends CustomPainter {
  final Color color;
  final double strokeWidth;
  
  _SpinnerPainter({
    required this.color,
    required this.strokeWidth,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    final Paint paint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
  
    final double inset = strokeWidth / 2;
  
    canvas.drawArc(
      Rect.fromLTWH(
        inset,
        inset,
        size.width - strokeWidth,
        size.height - strokeWidth,
      ),
      0,
      pi * 1.5,
      false,
      paint,
    );
  }
  
  @override
  bool shouldRepaint(_SpinnerPainter oldDelegate) =>
      oldDelegate.color != color || oldDelegate.strokeWidth != strokeWidth;
}
```

```
const Spinner()
const Spinner(
  size: 24, strokeWidth: 3,
)
const Spinner(
  color: Color(0xFFFFFFFF),
)
```

- The arc insets by half the stroke width, so it stays inside `size` at any stroke; the color falls back to `_defaultColor`. It rotates on a plain `..repeat()`, linear, 1000 ms per turn, and labels itself with `Semantics(label: 'Loading')`.
- **Where the painter is built, two views.** The source builds the `CustomPaint` inside the `AnimatedBuilder` builder. The [flutter PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/PERFORMANCE.md): "do not put a subtree that does not depend on the animation in the builder. Build it once and pass it as `child`."
- Whether to show a spinner at all is a separate question; see ui-animation [ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/frontend/ui-animation/PATTERNS.md).

### Rounded linear progress

[ApparenceKit](https://apparencekit.dev/flutter-tips/create-round-progress-flutter/)

- Round a `LinearProgressIndicator` by wrapping it in `ClipRRect`. `value` is 0.0 to 1.0, `minHeight` sets the thickness, `color` the bar, `backgroundColor` the track:

```dart
ClipRRect(
  borderRadius: BorderRadius.all(Radius.circular(10)),
  child: LinearProgressIndicator(
    minHeight: 14,
    value: progress,
    color: Colors.red,
    backgroundColor: Colors.white,
  ),
)
```

- **Clip, two views.** ApparenceKit clips the bar. The [flutter PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/PERFORMANCE.md) says clipping is still costly, to use `borderRadius` instead of a clip for rounded rectangles, and to avoid clipping in an animation. **[Flutter docs]:** `LinearProgressIndicator.borderRadius` is "The border radius of both the indicator and the track" (defaults to radius 2 under Material 3) ([api.flutter.dev](https://api.flutter.dev/flutter/material/LinearProgressIndicator/borderRadius.html)), so the bar can be rounded without `ClipRRect`.
- A round progress or timer drawn with `CustomPainter` is in [PAINTING-AND-MEDIA.md](PAINTING-AND-MEDIA.md#round-progress-and-timers).

## Swipe-action hint

[FlutterPro](https://flutterpro.design/details/flutter-slidable-controller)

- Hint at swipe actions so the user knows they exist. Use [flutter_slidable](https://pub.dev/packages/flutter_slidable); its `SlidableController` opens and closes action panes programmatically. The example previews on the first item only, once ever: 500 ms settle, open 400 ms, hold 900 ms, close 300 ms, pause 400 ms, then the other side.

```
class TaskItem extends StatefulWidget {
  final Task task;
  final bool isFirst;
  
  const TaskItem({
    super.key,
    required this.task,
    required this.isFirst,
  });
  
  @override
  State<TaskItem> createState() => _TaskItemState();
}
  
class _TaskItemState extends State<TaskItem> with SingleTickerProviderStateMixin {
  late final SlidableController _controller;
  
  @override
  void initState() {
    super.initState();
    _controller = SlidableController(this);
  
    // only the first item runs the preview
    if (widget.isFirst) {
      // show the hint once, ever
      Once.runOnce(
        'task_swipe_hint',
        callback: () {
          _runPreview();
        },
      );
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
  
  Future<void> _runPreview() async {
    // let the page finish settling first
    await Future.delayed(const Duration(milliseconds: 500));
    if (!mounted) return;
  
    // peek the delete action (start pane = swipe right)
    await _controller.openStartActionPane(
      duration: const Duration(milliseconds: 400),
    );
  
    // hold it open long enough for the user to notice
    await Future.delayed(const Duration(milliseconds: 900));
    if (!mounted) return;
  
    await _controller.close(duration: const Duration(milliseconds: 300));
  
    // brief pause before showing the other side
    await Future.delayed(const Duration(milliseconds: 400));
    if (!mounted) return;
  
    // peek the edit action (end pane = swipe left)
    await _controller.openEndActionPane(
      duration: const Duration(milliseconds: 400),
    );
  
    await Future.delayed(const Duration(milliseconds: 900));
    if (!mounted) return;
  
    await _controller.close(duration: const Duration(milliseconds: 300));
  }

  @override
  Widget build(BuildContext context) {
    return Slidable(
      controller: _controller,
      startActionPane: ActionPane(
        extentRatio: 0.2,
        motion: const DrawerMotion(),
        children: [
          SlidableAction(
            onPressed: (_) { /* delete */ },
            backgroundColor: Colors.red,
            icon: Icons.delete_outline,
          ),
        ],
      ),
      endActionPane: ActionPane(
        extentRatio: 0.2,
        motion: const DrawerMotion(),
        children: [
          SlidableAction(
            onPressed: (_) { /* edit */ },
            backgroundColor: Colors.blue,
            icon: Icons.edit_outlined,
          ),
        ],
      ),
      child: ListTile(
        title: Text(widget.task.title),
      ),
    );
  }
}
```

- Pass `isFirst: index == 0` from the list builder so only the first item previews. Show it just once: `Once.runOnce` from the [once](https://pub.dev/packages/once) package, or your own persisted flag.
- **Pitfall:** check `mounted` after every `await` before touching the controller.

## Prove it

- Every `AnimationController` that animates in both directions sets `reverseDuration` (or the route sets `reverseTransitionDuration`), and the exit is shorter than the entrance.
- Every controller driven by a bouncy `SpringSimulation` is `AnimationController.unbounded`; on a drag release the simulation gets the gesture's velocity, not `0`.
- A custom `ScrollPhysics` overrides `applyTo` and returns its own type with `buildParent(ancestor)`.
- Every `AnimatedSwitcher` whose child keeps the same type carries a `ValueKey` on the changing value; no `Text` under `AnimatedDefaultTextStyle` sets its own `style`.
- Every `didUpdateWidget` compares a specific field of `widget` and `oldWidget` before starting a controller.
- Entrance animations come from one shared widget; list staggers have a chosen per-item delay and a cap the team agreed on (see the two views above).
- If `ThemeData` uses `NoSplash.splashFactory`, the component themes also clear `overlayColor`, and pressable widgets still show a press state.
- Haptic calls go through one helper that checks `canVibrate` once.
- Triggering the same snack bar twice shows one bar, which shakes.
- No switch thumb has an icon on one side only; switch titles name the on state.
- Every `await` in a delayed hint or animation sequence is followed by a `mounted` check.
