# Navigation and sheets

Modal sheets as routes (a spring sheet, scroll-to-dismiss, the iOS 26 sheet, popups that fit their content), dialog and sheet results, the Android back flag, tab reselect, keeping scroll position and page transitions. Sources: FlutterPro tips by Kamran Bekirov (flutterpro.design) and ApparenceKit tips and blog posts (apparencekit.dev), both community material, not Flutter-team docs. The official routing guidance is in [flutter ROUTING-AND-DEEP-LINKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ROUTING-AND-DEEP-LINKS.md); where these sources disagree with it, or with [flutter VERSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/VERSIONS.md) or the `ui-animation` skill, both sides are stated and marked. A form inside a bottom sheet with the keyboard open is in [KEYBOARD-AND-FOCUS.md](KEYBOARD-AND-FOCUS.md#forms-in-a-bottom-sheet); nested navigators, the sidebar shell and route guards are in [ROUTE-GUARDS-AND-SHELLS.md](ROUTE-GUARDS-AND-SHELLS.md).

**Contents:** [Where the sources disagree](#where-the-sources-disagree) · [Pick the sheet](#pick-the-sheet) · [Spring bottom sheet](#spring-bottom-sheet) · [Swipe down at the top to close](#swipe-down-at-the-top-to-close) · [iOS 26 adaptive sheet](#ios-26-adaptive-sheet) · [Popup that fits its content](#popup-that-fits-its-content) · [Dialog and sheet results](#dialog-and-sheet-results) · [Android back does not close modals](#android-back-does-not-close-modals) · [Tab reselect](#tab-reselect) · [Keep scroll position across tabs](#keep-scroll-position-across-tabs) · [Page transitions](#page-transitions) · [Date picker that matches the platform](#date-picker-that-matches-the-platform) · [Prove it](#prove-it)

## Where the sources disagree

- **Android default page transition (official, version fact).** Both sources' code names `ZoomPageTransitionsBuilder` for Android ([FlutterPro](https://flutterpro.design/details/web-page-transitions), [ApparenceKit](https://apparencekit.dev/flutter-tips/add-custom-page-transitions-gorouter/)); neither states a Flutter version. Since Flutter 3.38 the default is `PredictiveBackPageTransitionsBuilder`, so naming Zoom in `pageTransitionsTheme` keeps the old transition, and "you won't get predictive back route transitions" ([flutter VERSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/VERSIONS.md), https://docs.flutter.dev/release/breaking-changes/default-android-page-transition). The sources' snippets are correct for pre-3.38 apps; on 3.38+ put `PredictiveBackPageTransitionsBuilder` in the Android entry unless you mean to keep Zoom.
- **Page transitions on the web (opinion).** FlutterPro: "no transition on web and desktop" ([FlutterPro](https://flutterpro.design/details/web-page-transitions)). The `ui-animation` skill: "a page transition 400-600 ms" ([ui-animation SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md)). Both views are kept.
- **Guards, router rebuilds and named routes:** see [ROUTE-GUARDS-AND-SHELLS.md](ROUTE-GUARDS-AND-SHELLS.md#where-the-sources-disagree).
- **`IntrinsicHeight` (tension).** ApparenceKit fits a popup with `IntrinsicHeight`; the Flutter performance docs say "Avoid intrinsics" for list and grid cells ([flutter PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/PERFORMANCE.md)). The article applies it to one popup, not to list cells.
- **Dot shorthands.** FlutterPro code uses `.iOS`, `.android`, `.transparency`, `.vertical(...)`, which need Dart 3.10+ ([dart LANGUAGE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/dart/LANGUAGE.md)). The articles state no Dart or Flutter version.

## Pick the sheet

- **Small modal that does not scroll:** the spring sheet below. "This is for small modals that don't scroll." [FlutterPro](https://flutterpro.design/details/smooth-draggable-bottom-sheets)
- **Sheet with a list:** a `stupid_simple_sheet` route, which hands a swipe at the top of the list over to closing the sheet. [FlutterPro](https://flutterpro.design/details/scroll-to-close-sheet)
- **Full-screen content:** an iOS 26 style sheet. [FlutterPro](https://flutterpro.design/details/smooth-draggable-bottom-sheets)
- **Close, not back:** "modals (the ones opening from the bottom) get a close (X) at the top left, not a back arrow." [FlutterPro](https://flutterpro.design/details/adaptive-sheet-route)
- **Sheets pushed with `Navigator.of(context).push` are pageless,** so they are not deep-linkable, and removing a page-backed route removes the pageless routes after it ([flutter ROUTING-AND-DEEP-LINKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ROUTING-AND-DEEP-LINKS.md)).

## Spring bottom sheet

[FlutterPro](https://flutterpro.design/details/smooth-draggable-bottom-sheets): Material's `showModalBottomSheet` "is mechanical"; the replacement should "feel smooth, keep the speed of a fling and settle like a spring". `showSpringBottomSheet` has the same API as `showModalBottomSheet` and returns a `Future<T?>` that resolves to the value passed to `Navigator.pop`:

```dart
showSpringBottomSheet<bool>(
  context: context,
  builder: (context) {
    return ConfirmSheet();
  },
);
```

- **Technique:** a `PopupRoute<T>` whose `createAnimationController()` returns `AnimationController.unbounded(...)` and whose `createSimulation({required bool forward})` returns a `SpringSimulation` seeded with the release velocity. Dragging writes `controller.value` directly, so "the velocity of a released fling is carried into the open or close spring".
- **Spring numbers:** "SwiftUI's .smooth spring written out as plain numbers: critically damped, stiffness 4pi^2 / duration^2, at 300ms in and 200ms out". Enter `SpringDescription(mass: 1, stiffness: 438.6, damping: 41.9)`, exit `SpringDescription(mass: 1, stiffness: 987.0, damping: 62.8)`, `snapToEnd: true` on every simulation. Web springs for comparison: [ui-animation MATH.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/MATH.md#a-spring-by-hand) ("A spring has no duration") and [ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PATTERNS.md) (a sheet "slides in from its edge with the `enter` spring and closes faster").
- **Close rule:** a fling faster than 0.9 sheet heights per second down closes, faster than 0.9 up keeps it open; otherwise it closes when it rests below half its height.
- **Overdrag:** past fully open the drag meets resistance 100 (`delta *= 1 / (1 + overshoot * _overdragResistance)`), and on release the velocity is damped by the same factor before springing back to 1.
- **One coordinate space:** drag deltas and velocity are divided by the sheet's own height, "so the gesture and the route animation share one coordinate space".
- **Clamp what the barrier sees:** the unbounded controller passes 1 when overdragged, so the route's `animation` getter is wrapped in a clamped animation "so that dragging past fully open does not push the barrier curve out of range"; the slide reads the raw controller.
- **No double pop:** `didPop` sets `_popped`, and the drag handlers return early once it is set.
- **One surface:** `SheetContainer` gives every sheet the background, the rounded top corners and a `Material`, "so you don't repeat them in every modal. Edit it once to match your design."
- **Content:** a `Column` with `mainAxisSize: MainAxisSize.min` so the sheet is only as tall as its content; "don't pass a scrollable inside, it steals the drag and the sheet stops closing with it".

The whole file, as published:

```dart
import 'package:flutter/material.dart';
import 'package:flutter/physics.dart';
  
/// Shows a modal sheet anchored to the bottom edge of the screen.
///
/// A spring-driven replacement for showModalBottomSheet. The sheet enters
/// and exits on smooth springs, and dragging it drives the route animation
/// directly, so the velocity of a released fling is carried into the open
/// or close spring.
///
/// The sheet surface comes from [SheetContainer]; the widget returned by
/// [builder] brings only its content and padding.
///
/// Returns a [Future] that resolves to the value passed to [Navigator.pop]
/// when the sheet is closed.
Future<T?> showSpringBottomSheet<T>({
  required BuildContext context,
  required WidgetBuilder builder,
}) {
  return Navigator.of(context).push(
    SpringSheetRoute<T>(
      builder: builder,
    ),
  );
}
  
/// A route that shows a spring-driven modal sheet at the bottom of the
/// screen.
class SpringSheetRoute<T> extends PopupRoute<T> {
  SpringSheetRoute({
    required this.builder,
    super.settings,
  });
  
  /// Builds the content of the sheet.
  final WidgetBuilder builder;
  
  // SwiftUI's .smooth spring written out as plain numbers: critically
  // damped, stiffness 4pi^2 / duration^2, at 300ms in and 200ms out.
  static const SpringDescription _enterSpring = SpringDescription(
    mass: 1,
    stiffness: 438.6,
    damping: 41.9,
  );
  static const SpringDescription _exitSpring = SpringDescription(
    mass: 1,
    stiffness: 987.0,
    damping: 62.8,
  );
  
  // Resistance applied when dragging past fully open.
  static const double _overdragResistance = 100;
  
  // Thresholds past which a released drag closes the sheet: fling speed in
  // sheet heights per second, or resting position as a fraction of height.
  static const double _closeVelocity = 0.9;
  static const double _closePosition = 0.5;
  
  // Release velocity in sheet heights per second (positive is downward),
  // carried from the drag into the close simulation.
  double? _releaseVelocity;
  
  bool _popped = false;
  
  @override
  Color? get barrierColor => const Color(0x8A000000);
  
  @override
  bool get barrierDismissible => true;
  
  @override
  String? get barrierLabel => null;
  
  @override
  Duration get transitionDuration => const Duration(milliseconds: 300);
  
  @override
  Duration get reverseTransitionDuration => const Duration(milliseconds: 200);
  
  // The scrim fades with the clamped animation so that dragging past fully
  // open does not push the barrier curve out of range. The slide reads the
  // raw controller.
  @override
  Animation<double>? get animation {
    final Animation<double>? raw = super.animation;
    if (raw == null) return null;
  
    return _ClampedAnimation(raw);
  }
  
  @override
  AnimationController createAnimationController() {
    return AnimationController.unbounded(
      duration: transitionDuration,
      reverseDuration: reverseTransitionDuration,
      vsync: navigator!,
    );
  }
  
  @override
  Simulation? createSimulation({required bool forward}) {
    final double velocity = _releaseVelocity ?? 0;
    _releaseVelocity = null;
  
    return SpringSimulation(
      forward ? _enterSpring : _exitSpring,
      controller?.value ?? 0,
      forward ? 1 : 0,
      -velocity,
      snapToEnd: true,
    );
  }
  
  @override
  bool didPop(T? result) {
    _popped = true;
  
    return super.didPop(result);
  }
  
  void _dragBy(double relativeDelta) {
    if (_popped) return;
  
    final AnimationController controller = this.controller!;
  
    double delta = relativeDelta;
    if (controller.value > 1) {
      final double overshoot = controller.value - 1;
      delta *= 1 / (1 + overshoot * _overdragResistance);
    }
    controller.value -= delta;
  }
  
  void _endDrag(double relativeVelocity) {
    if (_popped) return;
    final AnimationController controller = this.controller!;
    final double value = controller.value;
  
    if (value > 1) {
      // Dragged past fully open. Settle back, damping the velocity by the
      // same resistance that was applied while dragging.
      final double overshoot = value - 1;
      final double damped =
          relativeVelocity / (1 + overshoot * _overdragResistance);
      controller.animateWith(
        SpringSimulation(_enterSpring, value, 1, -damped, snapToEnd: true),
      );

      return;
    }
  
    final bool close = switch (relativeVelocity) {
      > _closeVelocity => true,
      < -_closeVelocity => false,
      _ => value < _closePosition,
    };
  
    if (close) {
      _releaseVelocity = relativeVelocity;
      navigator?.pop();
    } else {
      controller.animateWith(
        SpringSimulation(
          _enterSpring,
          value,
          1,
          -relativeVelocity,
          snapToEnd: true,
        ),
      );
    }
  }
  
  @override
  Widget buildPage(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
  ) {
    return Align(
      alignment: Alignment.bottomCenter,
      child: AnimatedBuilder(
        animation: controller!,
        builder: (context, child) {
          return FractionalTranslation(
            translation: Offset(0, 1 - controller!.value),
            child: child,
          );
        },
        child: Builder(
          builder: (context) {
            // Drag deltas are normalized by the sheet's own height, so the
            // gesture and the route animation share one coordinate space.
            double height() => context.size?.height ?? 1;
  
            return GestureDetector(
              excludeFromSemantics: true,
              onVerticalDragUpdate: (details) {
                _dragBy(details.primaryDelta! / height());
              },
              onVerticalDragEnd: (details) {
                _endDrag(details.velocity.pixelsPerSecond.dy / height());
              },
              onVerticalDragCancel: () {
                _endDrag(0);
              },
              child: SizedBox(
                width: double.infinity,
                child: SheetContainer(
                  child: builder(context),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
  
/// The surface for sheets shown with [showSpringBottomSheet]: white with
/// rounded top corners, matching the old bottom sheet theme.
class SheetContainer extends StatelessWidget {
  const SheetContainer({
    super.key,
    required this.child,
  });
  
  final Widget child;
  
  @override
  Widget build(BuildContext context) {
    return Material(
      type: .transparency,
      child: ClipRRect(
        borderRadius: const .vertical(
          top: Radius.circular(20),
        ),
        child: ColoredBox(
          color: Colors.white,
          child: child,
        ),
      ),
    );
  }
}
  
/// An animation that forwards [parent] with its value clamped to the range
/// 0.0 to 1.0, for consumers such as the modal barrier that should not see
/// values past fully open.
class _ClampedAnimation extends Animation<double>
    with AnimationWithParentMixin<double> {
  _ClampedAnimation(this.parent);
  
  @override
  final Animation<double> parent;
  
  @override
  double get value => parent.value.clamp(0.0, 1.0);
}
```

## Swipe down at the top to close

[FlutterPro](https://flutterpro.design/details/scroll-to-close-sheet): when a sheet holds a list, swiping down at the top should start closing it; "Every native sheet works like this". `showModalBottomSheet` does not: the swipe only scrolls, stops at the top, and the sheet moves only when you drag a part that does not scroll.

- **Use a `stupid_simple_sheet` route** (https://pub.dev/packages/stupid_simple_sheet): every route in it does the handoff out of the box. "While the list can scroll, the swipe scrolls it. When it hits the top, the same swipe starts pulling the sheet down."

```dart
Navigator.of(context).push(
  StupidSimpleSheetRoute(
    child: FiltersPage(),
  ),
);
```

- **Keeping your own sheet:** the handoff alone is `scroll_drag_detector` (https://pub.dev/packages/scroll_drag_detector, same author). It gives the combined gesture; moving the sheet, the resistance and the close-or-snap-back decision stay on you. Working example: https://github.com/whynotmake-it/rivership/blob/main/packages/stupid_simple_sheet/lib/stupid_simple_sheet.dart
- **"Don't set a custom `ScrollConfiguration`"** on the sheet content: the package needs Flutter's default scroll behavior to catch the moment the list hits the top.
- The web counterpart (scroll chaining with `overscroll-behavior: auto`) is in [ui-animation SHEETS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SHEETS.md).

## iOS 26 adaptive sheet

[FlutterPro](https://flutterpro.design/details/adaptive-sheet-route): `CupertinoSheetRoute` gives the iOS 13 style modal sheet; iOS 26 moved to fully rounded sheets, so it "now looks dated". Use `StupidSimpleGlassSheetRoute` on iOS and the package's plain `StupidSimpleSheetRoute` on Android ("You can also swap `StupidSimpleSheetRoute` for `MaterialPageRoute` on Android. Your call."):

```dart
import 'package:flutter/foundation.dart';
import 'package:stupid_simple_sheet/stupid_simple_sheet.dart';
  
extension WidgetX on Widget {
  Route<T> asAdaptiveSheetRoute<T>() {
    final bool isIos = defaultTargetPlatform == .iOS;
  
    if (isIos) {
      return StupidSimpleGlassSheetRoute(
        child: this,
        blurBehindBarrier: false,
      );
    } else {
      return StupidSimpleSheetRoute(
        child: this,
      );
    }
  }
}
```

```dart
Navigator.of(context).push(
  BarcodePage().asAdaptiveSheetRoute(),
);
```

- **Platform switch:** this picks the route by `defaultTargetPlatform`. The official rule against `Platform.isAndroid` covers "layout decisions or assumptions about what a device can do" ([flutter-ui LAYOUT-AND-RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md#capabilities-and-policies)), and the same file lists bottom navigation per platform (`NavigationBar` on Android, `CupertinoTabBar` on iOS).
- **Official alternative:** Flutter 3.44 added `CupertinoSheetRoute.scrollableBuilder` and deprecated its `builder`/`pageBuilder` ([flutter VERSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/VERSIONS.md)). The article does not mention it or say whether it gives the iOS 26 look.

## Popup that fits its content

[ApparenceKit](https://apparencekit.dev/flutter-tips/bottom-modal-height/): a bottom popup (`showCupertinoModalPopup` or similar) can be taller than its content. Wrap the content in `IntrinsicHeight`, which sizes itself, and so the popup, to the child's minimum height:

```dart
showCupertinoModalPopup<void>(
  context: context,
  builder: (_) => const IntrinsicHeight(
    child: YourContentWidget(), // Put your content here
  ),
);
```

- **Tension:** `IntrinsicHeight` runs an intrinsic pass, which the Flutter performance docs say to avoid when all list or grid cells must match ([flutter PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/PERFORMANCE.md)). The article uses it on one popup.

## Dialog and sheet results

[ApparenceKit](https://apparencekit.dev/flutter-tips/handle-flutter-dialog-result-correctly/): code placed right after `Navigator.of(context).pop();` in a dialog button "might not finish or even start reliably because the context or widget tree state is changing rapidly as the dialog disappears."

- **Pass the value to `pop`** (`Navigator.of(context).pop(yourResult)`). `showDialog` and `showModalBottomSheet` return a `Future` that completes with it; `await` it and act after the dialog is gone. The go_router form for pages is `await context.push<bool>('/page2')` with `context.pop(true)` ([flutter ROUTING-AND-DEEP-LINKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ROUTING-AND-DEEP-LINKS.md)).

```dart
Future<void> _showMyDialog(BuildContext context) async {
  final result = await showDialog<MyResultType>(
    context: context,
    builder: (BuildContext context) {
      return AlertDialog(
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(context).pop(MyResultType.option1),
            child: const Text('Option 1'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(MyResultType.option2),
            child: const Text('Option 2'),
          ),
        ],
      );
    },
  );

  // Now you can safely use 'result' here
  if (result != null) {
    print('Dialog result: $result');
    // Perform actions based on the result
  }
}
```

- The `print` line is the article's placeholder; Flutter's default lints flag `avoid_print`, so replace it with the real action.

## Android back does not close modals

[FlutterPro](https://flutterpro.design/details/android-back-button): on some devices (a Xiaomi 12 on Android 15) full-screen sheets, dialogs and modals did not close with the back button or edge swipe, while they did on a Pixel 9 emulator (Android 16).

- **Cause and fix:** `OnBackInvokedCallback`, added in Android 13, is the new back dispatch and powers predictive back; it is opt-in. Add the flag to `AndroidManifest.xml`:

```xml
<application
    ...
    android:enableOnBackInvokedCallback="true">
```

- **"Watch out: this flag breaks `WillPopScope`. Migrate to `PopScope` first"** (https://docs.flutter.dev/release/breaking-changes/android-predictive-back). `WillPopScope` is deprecated; its replacement is `PopScope(canPop:, onPopInvokedWithResult:)` ([flutter VERSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/VERSIONS.md)).
- **The logcat warning does not prove the bug.** An app whose back works shows the same lines:

```text
W/WindowOnBackDispatcher: OnBackInvokedCallback is not enabled for the application.
W/WindowOnBackDispatcher: Set 'android:enableOnBackInvokedCallback="true"' in the application manifest.
```

- **Open caveat:** the author could not find why one app needed the flag and another on the same device, Android and Flutter version did not (bumping `androidx.activity` and removing a custom `Overlay` wrapper changed nothing). "add the flag, ship it."

## Tab reselect

[FlutterPro](https://flutterpro.design/details/bottom-nav-reselect): tapping the tab you are already on should scroll that page to the top; "Both Apple's HIG and Material spec it". Tapped again at the top, many apps do a second thing, such as focusing search. `BottomNavigationBar` does none of it.

- **Technique:** one `ScrollController` per tab and a `FocusNode` for a tab's search field. At top means `!scroller.hasClients || scroller.offset <= 0`; otherwise `animateTo(0)` over 300 ms with `Curves.easeOutCubic`.

```dart
import 'package:flutter/material.dart';
  
class BottomNavigationReselect {
  BottomNavigationReselect._();
  
  static final ScrollController homeScrollController = ScrollController();
  static final ScrollController catalogScrollController = ScrollController();
  static final ScrollController cartScrollController = ScrollController();
  static final ScrollController favoritesScrollController = ScrollController();
  static final ScrollController accountScrollController = ScrollController();
  
  static final FocusNode homeSearchFocusNode = FocusNode();
  
  static void scrollToTopOrFocusSearch(int index) {
    // scroll to top
    final ScrollController scroller = switch (index) {
      0 => homeScrollController,
      1 => catalogScrollController,
      2 => cartScrollController,
      3 => favoritesScrollController,
      _ => accountScrollController,
    };
  
    final bool atTop = !scroller.hasClients || scroller.offset <= 0;
  
    if (!atTop) {
      scroller.animateTo(
        0,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOutCubic,
      );
      return;
    }
  
    // already at top, focus search
    final FocusNode? searchFocus = switch (index) {
      0 => homeSearchFocusNode,
      _ => null,
    };
  
    searchFocus?.requestFocus();
  }
}
```

```dart
BottomNavigationBar(
  currentIndex: _currentIndex,
  onTap: (int index) {
    if (index == _currentIndex) {
      BottomNavigationReselect.scrollToTopOrFocusSearch(index);
      return;
    }
  
    setState(() => _currentIndex = index);
  },
  items: const [/* ... */],
)
```

```dart
ListView(
  controller: BottomNavigationReselect.homeScrollController,
  children: [
    TextField(
      focusNode: BottomNavigationReselect.homeSearchFocusNode,
    ),
    // ...
  ],
)
```

- **Shape is free:** a map, enum keys instead of an `int`; "only the idea matters: detect the reselect, then scroll to top or focus a search field."
- **Lifecycle:** the controllers and focus nodes live as long as the app because the bottom nav is always on screen. Optionally add a `dispose` called from the root widget that holds the nav. "Never dispose them while in use."
- **Material 3:** the article uses M2 `BottomNavigationBar`; the M3 replacement is `NavigationBar` ([flutter VERSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/VERSIONS.md)), which the article does not show.
- **With go_router tabs,** the official shell resets the branch when the active tab is tapped (`goBranch(index, initialLocation: index == navigationShell.currentIndex)`, [flutter ROUTING-AND-DEEP-LINKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ROUTING-AND-DEEP-LINKS.md#shell-routes-and-tabs)); scroll-to-top and the second-tap search focus are this source's addition.

## Keep scroll position across tabs

[ApparenceKit](https://apparencekit.dev/flutter-tips/preserve-page-scroll-position/): create a `PageStorageBucket`, wrap the area that swaps pages (the `Scaffold` body, a `PageView`) in `PageStorage`, and give each widget whose state should survive a unique `PageStorageKey`.

```dart
final PageStorageBucket _bucket = PageStorageBucket();
```

```dart
// Inside your build method:
Scaffold(
  body: PageStorage(
    child: pages[currentPageIndex], // Put your changing page widget here
    bucket: _bucket,
  ),
);
```

- This is for hand-rolled tab switching. go_router's `StatefulShellRoute.indexedStack` "keeps each branch's state" ([flutter ROUTING-AND-DEEP-LINKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ROUTING-AND-DEEP-LINKS.md)).

## Page transitions

### None on web and desktop

[FlutterPro](https://flutterpro.design/details/web-page-transitions): `CupertinoPageRoute` and `MaterialPageRoute` animations "belong to mobile"; "The web is click and open, with no transition animation." Set it once in `ThemeData.pageTransitionsTheme`; `context.push`, `context.pushNamed` and declarative routes all run through it. Without `MaterialApp`, customize it in the router (`go_router` uses `pageBuilder`).

```dart
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
  
const PageTransitionsTheme appPageTransitionsTheme = PageTransitionsTheme(
  builders: {
    .android: kIsWeb 
      ? _NoPageTransitionsBuilder() 
      : ZoomPageTransitionsBuilder(),
    .iOS: kIsWeb 
      ? _NoPageTransitionsBuilder() 
      : CupertinoPageTransitionsBuilder(),
  
    .macOS: _NoPageTransitionsBuilder(),
    .windows: _NoPageTransitionsBuilder(),
    .linux: _NoPageTransitionsBuilder(),
    .fuchsia: _NoPageTransitionsBuilder(),
  },
);
  
class _NoPageTransitionsBuilder extends PageTransitionsBuilder {
  const _NoPageTransitionsBuilder();
 
  @override
  Duration get transitionDuration => Duration.zero;
  
  @override
  Duration get reverseTransitionDuration => Duration.zero;
  
  @override
  Widget buildTransitions<T>(
    PageRoute<T> route,
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    return child;
  }
}
```

```dart
MaterialApp(
  theme: ThemeData(
    // ...your theme...
    pageTransitionsTheme: appPageTransitionsTheme,
  ),
);
```

- **Android entry on Flutter 3.38+:** the default is `PredictiveBackPageTransitionsBuilder`, not Zoom ([flutter VERSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/VERSIONS.md), https://docs.flutter.dev/release/breaking-changes/default-android-page-transition). To keep the native default there, put `PredictiveBackPageTransitionsBuilder` in the non-web branch of the `.android` entry instead of `ZoomPageTransitionsBuilder`.
- **Text versus code:** the article's rule says "native defaults on Android and iOS, even in a mobile browser", but its code uses the no-op builder for `.android` and `.iOS` whenever `kIsWeb`, so a mobile browser gets no transition too.
- **The other view:** the `ui-animation` skill gives a page transition 400-600 ms ([ui-animation SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md)). More web guidance is in [WEB-SHELL.md](WEB-SHELL.md).

### Per route with go_router

[ApparenceKit](https://apparencekit.dev/flutter-tips/add-custom-page-transitions-gorouter/): a helper returns a `CustomTransitionPage` keyed with `state.pageKey`, and the route uses it through `pageBuilder`. "You can build your own animations or use ones available from packages on pub.dev" (the article does not name the package `FadeThroughTransition` comes from).

```dart
Page<dynamic> buildPageTransition(
  BuildContext context, 
  GoRouterState state,
  Widget child,
) => CustomTransitionPage<dynamic>(
  key: state.pageKey,
  child: child,
  transitionsBuilder: (context, animation, secondaryAnimation, child) =>
    FadeThroughTransition(
      animation: animation,
      secondaryAnimation: secondaryAnimation,
      child: child,
    ),
);
```

```dart
GoRoute(
  path: '/signin',
  builder: (context, state) => const SignInPage(),
  pageBuilder: (context, state) => buildPageTransition(context, state, const SignInPage()),
),
```

App-wide defaults per platform go in the theme:

```dart
pageTransitionsTheme: PageTransitionsTheme(
  builders: {
    TargetPlatform.android: const ZoomPageTransitionsBuilder(),
    TargetPlatform.iOS: const CupertinoPageTransitionsBuilder(),
  },
),
```

- On Flutter 3.38+ the Android line above opts out of the new default; for the default name `PredictiveBackPageTransitionsBuilder` there ([flutter VERSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/VERSIONS.md)).

## Date picker that matches the platform

- Dot shorthands in these samples need Dart language version 3.10+ ([dart LANGUAGE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/dart/LANGUAGE.md)). [FlutterPro](https://flutterpro.design/details/adaptive-date-picker)
- The samples import `package:flutter/material.dart` and `package:flutter/cupertino.dart`; Material and Cupertino are moving to their own packages ([flutter-ui LAYOUT-AND-RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md#material-and-cupertino-as-packages)). Check at copy time. [FlutterPro](https://flutterpro.design/details/adaptive-date-picker)

[FlutterPro](https://flutterpro.design/details/adaptive-date-picker): `CupertinoDatePicker` looks polished, but it's iOS-native. Android users don't expect a scroll-wheel picker for dates, and "An iOS widget dropped into Android can even read as cheap." Use the scroll picker on iOS and the default Material one (`showDatePicker`) on Android.

- **Custom design is no reason to skip it.** The Material picker is platform UI, so users read the exception as normal. You can still theme it; keep the skeleton layout, "which is muscle memory for Android users."
- **Packages:** the author has "yet to find one neutral enough to justify mixing with a custom design."
- **Fits the official rules:** Flutter's `.adaptive()` constructors substitute Cupertino on iOS for switches, sliders, dialogs and more ([flutter-ui LAYOUT-AND-RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md#platform-adaptations)); this tip does the same by hand for the date picker. It branches a platform-idiom widget on `defaultTargetPlatform`, which [flutter PLATFORM-INTEGRATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/PLATFORM-INTEGRATION.md) names; [flutter SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/SKILL.md) rule 2 forbids branching *layout* on `Platform.isAndroid`, a different thing.

Call it and await the picked date. It returns `null` when the user dismisses the sheet, so keep the old value then:

```dart
final DateTime? date = await AdaptiveDatePicker.show(
  context,
  initialDate: _date,
  firstDate: DateTime(2000),
  lastDate: DateTime.now(),
);

if (date != null) {
  setState(() => _date = date);
}
```

The widget ("Tweak the values to taste": sheet height 400, horizontal padding 16, a 24 gap before Done). `Button` is a placeholder for your own button widget:

```dart
import 'package:flutter/cupertino.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

class AdaptiveDatePicker {
  const AdaptiveDatePicker._();

  static Future<DateTime?> show(
    BuildContext context, {
    required DateTime firstDate,
    required DateTime lastDate,
    DateTime? initialDate,
  }) {
    final bool isIos = defaultTargetPlatform == .iOS;

    if (isIos) {
      return _CupertinoDatePickerSheet.show(
        context,
        initialDate: initialDate,
        minimumDate: firstDate,
        maximumDate: lastDate,
      );
    }

    return showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: firstDate,
      lastDate: lastDate,
    );
  }
}

class _CupertinoDatePickerSheet extends StatefulWidget {
  final DateTime? initialDate;
  final DateTime? minimumDate;
  final DateTime? maximumDate;

  const _CupertinoDatePickerSheet({
    this.initialDate,
    this.minimumDate,
    this.maximumDate,
  });

  static Future<DateTime?> show(
    BuildContext context, {
    DateTime? initialDate,
    DateTime? minimumDate,
    DateTime? maximumDate,
  }) {
    return showModalBottomSheet<DateTime?>(
      context: context,
      builder: (BuildContext context) {
        return _CupertinoDatePickerSheet(
          initialDate: initialDate,
          minimumDate: minimumDate,
          maximumDate: maximumDate,
        );
      },
    );
  }

  @override
  State<_CupertinoDatePickerSheet> createState() =>
      _CupertinoDatePickerSheetState();
}

class _CupertinoDatePickerSheetState extends State<_CupertinoDatePickerSheet> {
  late DateTime _selectedDate = widget.initialDate ?? .now();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 400,
      padding: const .symmetric(horizontal: 16),
      child: SafeArea(
        child: Column(
          children: [
            Flexible(
              child: CupertinoDatePicker(
                mode: .date,
                initialDateTime: widget.initialDate,
                minimumDate: widget.minimumDate,
                maximumDate: widget.maximumDate,
                onDateTimeChanged: (DateTime dateTime) {
                  _selectedDate = dateTime;
                },
              ),
            ),
            const SizedBox(height: 24),
            // TODO: replace with your button widget
            Button(
              label: 'Done',
              onPressed: () {
                Navigator.of(context).pop(_selectedDate);
              },
            ),
          ],
        ),
      ),
    );
  }
}
```

## Prove it

- **Spring sheet:** a fast downward fling closes it from any position; a slow drag released above half its height springs back; dragging up past fully open resists, and the barrier never turns darker than at rest.
- **Sheet with a list:** scroll the list down, then swipe down at the top: the same swipe starts closing the sheet. `grep -rn ScrollConfiguration` finds none on sheet content.
- **Modal chrome:** every bottom-opening modal shows a close (X) at the top left, not a back arrow.
- **Results:** `grep -rn -A2 'pop();'` in dialog and sheet code finds no work after the `pop`; results come back through `await showDialog<T>` / `showModalBottomSheet<T>`.
- **Android back:** on a device that showed the bug, back and edge swipe close sheets, dialogs and modals. `grep -rn WillPopScope lib/` is empty before `android:enableOnBackInvokedCallback="true"` lands in `AndroidManifest.xml`.
- **Tab reselect:** scroll a tab, tap its icon: it scrolls to top; tap again at the top: the search field focuses (where the tab has one).
- **Transitions:** on the web build a push shows no animation; on an Android build on Flutter 3.38+, the theme does not name `ZoomPageTransitionsBuilder` unless someone chose it on purpose.
- **Date picker:** iOS shows the wheel in a sheet, Android the Material dialog; dismissing either keeps the previous date.
