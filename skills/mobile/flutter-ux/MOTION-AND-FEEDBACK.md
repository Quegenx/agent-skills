# Motion and feedback

How a Flutter app answers a touch: press feedback, stripping Material tap effects, haptics, snack bars, switch thumb icons, a neutral spinner, a rounded progress bar and a swipe-action hint. Sources: FlutterPro tips by Kamran Bekirov (flutterpro.design) and ApparenceKit Flutter tips (apparencekit.dev). Neither states a Flutter, Dart or package version; check `motor`, `haptic_feedback`, `flutter_slidable` and `once` names against their current pub.dev release before copying. Animation timing, curves, springs and entrance sequences are in [flutter-ui ANIMATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/ANIMATION.md). Painting with `CustomPainter`, image export and media are in [PAINTING-AND-MEDIA.md](PAINTING-AND-MEDIA.md).

**Contents:** [Press feedback](#press-feedback) · [Strip Material tap effects](#strip-material-tap-effects) · [Haptics](#haptics) · [Snack bars](#snack-bars) · [Switch thumb icons](#switch-thumb-icons) · [Loading indicators](#loading-indicators) · [Swipe-action hint](#swipe-action-hint) · [Prove it](#prove-it)

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

- **Press depth and timing, views side by side.** FlutterPro: 0.96 on `CupertinoMotion.smooth()`, the same spring in and out. ui-animation [ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PATTERNS.md#buttons-presses-and-feedback): 0.97 with its `ui` spring, under 100 ms in, and "press in faster than release" (Kiem's playful press goes to 0.94). None wins.

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
- **Pressed state.** ui-animation [ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PATTERNS.md#buttons-presses-and-feedback): "Every pressable element has a pressed state". FlutterPro strips the ripple for a custom design language and does not say what replaces it; its `Pressable` above is a press state that uses no ink.

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
- Reference implementation: bunpod.app's open-source [expressive_snack](https://github.com/kamranbekirovyz/bunpod/tree/main/packages/expressive_snack) package (handles both, plus RTL and icons). The source gives no shake duration; ui-animation [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md) gives an error shake 300-400 ms, never a bounce. The state side (an error shows once because it is cleared first) is in the [flutter ARCHITECTURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ARCHITECTURE.md).

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
- Whether to show a spinner at all is a separate question; see ui-animation [ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PATTERNS.md).

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

- If `ThemeData` uses `NoSplash.splashFactory`, the component themes also clear `overlayColor`, and pressable widgets still show a press state.
- Haptic calls go through one helper that checks `canVibrate` once.
- Triggering the same snack bar twice shows one bar, which shakes.
- No switch thumb has an icon on one side only; switch titles name the on state.
- Every `await` in a delayed hint or animation sequence is followed by a `mounted` check.
