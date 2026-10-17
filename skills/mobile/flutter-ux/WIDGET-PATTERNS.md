# Widget patterns

Small widget recipes and the framework mechanics behind them: avatars, app bars, overlays and tutorial overlays, zoom and pan, flex and row height, `OverflowBar` vs `Wrap`, selectable text, window-size changes, Stack clipping, keys, app lifecycle, the first frame, Actions and Intents, builders and factories, global events, and paginated lists with skeletons. Source: ApparenceKit tips and blog posts (apparencekit.dev, third-party; no article states a Flutter version), checked against api.flutter.dev where an API is named. Theming is in [THEMING.md](THEMING.md); lifecycle and scrolling tips from FlutterPro are in [APP-LIFECYCLE.md](APP-LIFECYCLE.md) and [SCROLLING-AND-LAYOUT.md](SCROLLING-AND-LAYOUT.md).

**Contents:** [Circular avatar with a border](#circular-avatar-with-a-border) · [Round button](#round-button) · [Custom app bar](#custom-app-bar) · [Overlays](#overlays) · [Tutorial overlays with pal_widgets](#tutorial-overlays-with-pal_widgets) · [Zoom and pan](#zoom-and-pan) · [Flex and row height](#flex-and-row-height) · [OverflowBar and Wrap](#overflowbar-and-wrap) · [Selectable text](#selectable-text) · [React to window size changes](#react-to-window-size-changes) · [Draw outside a Stack](#draw-outside-a-stack) · [Keys](#keys) · [App lifecycle states](#app-lifecycle-states) · [After the first frame](#after-the-first-frame) · [Child to parent with Actions and Intents](#child-to-parent-with-actions-and-intents) · [Builders and factories](#builders-and-factories) · [Global app events](#global-app-events) · [Pagination and skeletons](#pagination-and-skeletons) · [Prove it](#prove-it)

## Circular avatar with a border

[ApparenceKit](https://apparencekit.dev/flutter-tips/circular-avatar-with-border-flutter/)

- `CircleAvatar` has no border property. Nest it in a second `CircleAvatar` whose `radius` is a little larger and whose `backgroundColor` is the border color:

```dart
CircleAvatar(
  radius: radius + 2, // Make the outer circle a little bigger
  backgroundColor: borderColor, // This is the border color
  child: CircleAvatar( // This is your original avatar
    radius: radius, // Keep the inner circle the original size
    backgroundImage: NetworkImage(url), // Your image or child goes here
  ),
);
```

- For a gradient or another shape, wrap the `CircleAvatar` in a `Container` and use its `decoration`.

## Round button

[ApparenceKit](https://apparencekit.dev/flutter-tips/create-clean-round-button/)

- A custom `CircleButton` is built from `Opacity` (disabled look), `ClipOval` (round child), `Material` + `Ink` (ripple feedback), `BoxDecoration` (circle shape, background, border) and `InkWell` (`onTap`, checking `disabled`). The article's code is an image only.
- Flutter's performance guidance says "use `Opacity` only when necessary"; a semitransparent color is usually cheaper ([../flutter/PERFORMANCE.md](../flutter/PERFORMANCE.md)). An `Opacity` around every disabled button is the case it warns about.

## Custom app bar

[ApparenceKit](https://apparencekit.dev/flutter-tips/create-custom-app-bar-flutter/)

- A widget used as `Scaffold.appBar` must implement `PreferredSizeWidget` and return its `preferredSize`. Use `Size.fromHeight(kToolbarHeight)`; `kToolbarHeight` is "the standard height for toolbars", so the bar fits with standard widgets.

```dart
Scaffold(
  appBar: YourCustomAppBarWidget(),
  // ... rest of your screen content
)
```

## Overlays

[ApparenceKit](https://apparencekit.dev/flutter-tips/flutter-show-an-overlay/)

- `Overlay.of` needs a `MaterialApp` or a `Navigator` higher in the tree. Create an `OverlayEntry` (`opaque: true` "if it covers the whole screen below it"), get the overlay, insert the entry:

```dart
OverlayEntry overlayEntry = OverlayEntry(
  opaque: false, // set to true if it covers the whole screen below it
  builder: (context) => Container(...), // Put the widget you want to show here
);
```

```dart
final overlay = Overlay.of(context);
```

```dart
if (overlay != null) {
  overlay.insert(overlayEntry);
}
```

- **Correction:** `Overlay.of` now returns a non-null `OverlayState` and, in debug mode, throws if no overlay is found ("The most common way to add an Overlay to an application is to include a MaterialApp, CupertinoApp or Navigator widget in the runApp() call"). Use `Overlay.maybeOf` when it may be missing. [Overlay.of](https://api.flutter.dev/flutter/widgets/Overlay/of.html) The article's null check is from an older API; the insert becomes:

```dart
Overlay.of(context).insert(overlayEntry);
```

- The article never removes the entry. `OverlayEntry.remove()` "should only be called once". [OverlayEntry.remove](https://api.flutter.dev/flutter/widgets/OverlayEntry/remove.html)

## Tutorial overlays with pal_widgets

[ApparenceKit](https://apparencekit.dev/flutter-tips/flutter-tutorial-overlay-pal-widgets/)

- Package `pal_widgets` (0.4.0 on pub.dev, "unverified uploader"; check it is maintained before adding it) [pub.dev](https://pub.dev/packages/pal_widgets). Steps: add it to `pubspec.yaml` and run `flutter pub get`; put `HelperOrchestrator` high in the tree ("above your main page or even your `MaterialApp`"); define an `AnchoredHelper`; give the target widget `HelperOrchestrator.of(context).generateKey('startButton')`; show the helper after the first frame with `WidgetsBinding.instance.addPostFrameCallback`.
- Tips: several steps are possible; "Tapping anywhere on the dim background often hides the current tutorial step"; "save whether the user has seen a tutorial already (e.g., using `SharedPreferences`) so it only shows the first time".

```dart
HelperOrchestrator(
  child: Scaffold(
    appBar: AppBar(title: Text(widget.title)),
    body: Center(child: Text('Hello!')),
    // ... rest of your page content
  ),
)
```

```dart
AnchoredHelper get myFirstHelper => AnchoredHelper(
      title: 'Welcome!',
      description: 'Tap here to get started.',
      // You can add styles, colors, buttons here too!
    );
```

```dart
ElevatedButton(
  key: HelperOrchestrator.of(context).generateKey('startButton'), // Give it a unique ID like 'startButton'
  onPressed: () { /* do something */ },
  child: const Text('Start'),
)
```

```dart
@override
void initState() {
  super.initState();
  WidgetsBinding.instance.addPostFrameCallback((_) {
    HelperOrchestrator.of(context).ShowAnchoredHelper('startButton', myFirstHelper);
  });
}
```

- **Correction against the package README** [pub.dev](https://pub.dev/packages/pal_widgets): the method is `showAnchoredHelper` (lower-case s), `title` and `description` take `Text` widgets, and `bgColor` is required. The article's two blocks do not compile; use:

```dart
AnchoredHelper get myFirstHelper => AnchoredHelper(
      title: const Text('Welcome!'),
      description: const Text('Tap here to get started.'),
      bgColor: Colors.blue,
    );
```

```dart
    HelperOrchestrator.of(context).showAnchoredHelper('startButton', myFirstHelper);
```

- The README also lists `onTapAnchor`, `onLeftBtnTap` / `onRightTap` (hide with `HelperOrchestrator.of(context).hideHelper()`), `onError`, and `widgetFactory`, defaulting to `AnchoredCircleHoleHelper.anchorFactory` (also `AnchoredRectHoleHelper.anchorFactory`).

## Zoom and pan

[ApparenceKit](https://apparencekit.dev/flutter-tips/flutter-interactiveviewer-cheat-sheet/) [ApparenceKit](https://apparencekit.dev/flutter-tips/zoom-pan-transform-widgets-flutter/)

- `InteractiveViewer` works with any widget, not just images. Properties, all `true` by default: `scaleEnabled` (pinch zoom), `panEnabled` (drag), `constrained` ("`true` (default) to force the child to fit inside the viewer area. ... `false` for free panning and zooming outside the viewer boundaries").
- Callbacks: `onInteractionStart` ("gives details like where the interaction began and the current scale"), `onInteractionUpdate` (continuous, "great for tracking live gesture updates"), `onInteractionEnd`.

```dart
InteractiveViewer(
  key: previewWidgetKey, // An optional key
  transformationController: TransformationController(), // Controls the transformation
  scaleEnabled: true, // Allow scaling (zooming)
  constrained: false, // Set to true if the child fills the viewport
  panEnabled: true, // Allow panning (moving)
  clipBehavior: Clip.antiAlias, // How to clip content outside bounds
  child: Image.asset("name_of_your_image.png"), // Your widget here
)
```

- The inline comment on `constrained` reads differently from the cheat sheet's description (same site). The block creates a `TransformationController` inside `build`, so every rebuild gets a new one; the article does not address that.
- `scale` below 1 zooms out, above 1 zooms in. Transforms are a `Matrix4`: "The top-left 3x3 section (m00 to m22) handles rotation and scaling", "The last column (m03, m13, m23) handles translation", "The bottom row (m30 to m33) is used for perspective transformations".

## Flex and row height

- **Flexible defaults:** "By default Flexible element are set to flex 1. Flex 0 mean that the child determines his own size." Each child's share is "`(item flex / total flex) * height`"; "The higher the flex factor, the more space it will take." With `fit` tight a child takes all the space it is given; "Expanded is basically a shortcut for this", with a fixed flex of 1, so two `Expanded` children in a row get 50% each. [ApparenceKit](https://apparencekit.dev/blog/flutter-flex/) Official `Expanded` / `Flexible` rule: [../flutter/LAYOUT-AND-RESPONSIVE.md](../flutter/LAYOUT-AND-RESPONSIVE.md).

```dart
Column(
  children: [
    Flexible(
      child: Container(
        color: Colors.red,
      ),
    ),
    Flexible(
      child: Container(
        color: Colors.blue,
      ),
    ),
  ],
)
```

- **A Row inside a Column, two views.** ApparenceKit: a Row in a Column gets unbounded height, and children such as `Expanded` "struggle when they receive infinite constraints in the cross-axis (which is height for a Row)"; "the simple fix" is `IntrinsicHeight`, which "forces its child (your Row, in this case) to take on the minimum height that its children need". [ApparenceKit](https://apparencekit.dev/flutter-tips/size-row-height-in-column/) Flutter's performance guidance: "Avoid intrinsics", an intrinsic pass is a second layout pass; prefer a fixed cell size up front ([../flutter/PERFORMANCE.md](../flutter/PERFORMANCE.md)).

```dart
Column(
  children: [
    IntrinsicHeight(
      child: Row(
        // Your widgets like Expanded go here
      ),
    ),
    // Other widgets in your Column
  ],
)
```

## OverflowBar and Wrap

- **OverflowBar** lays its children "out in a row unless they 'overflow' the available horizontal space, in which case it lays them out in a column instead." `spacing` is the horizontal gap; `overflowSpacing`, `overflowAlignment` and `overflowDirection` shape the column. [OverflowBar](https://api.flutter.dev/flutter/widgets/OverflowBar-class.html) "OverflowBar pushes *all* the items to the next line (or column) when overflow happens"; it "is great when you want a group of items to either stay together in a row or all stack neatly in a column." [ApparenceKit](https://apparencekit.dev/flutter-tips/discovering-overflowbar-flutter-responsive-layout/)
- **Wrap** "places children next to each other ... if there isn't enough space on the current line, it will automatically move the next child to a new line. Think of it like text wrapping in a paragraph." [ApparenceKit](https://apparencekit.dev/flutter-tips/discovering-overflowbar-flutter-responsive-layout/)
- **Source error:** ApparenceKit's "OverflowBar or Wrap?" tip says the opposite ("If there isn't enough space, the children will extend beyond the available area", "Forces children onto one line, even if they overflow"). That contradicts the API docs above and the same site's other tip; the tip (no version stated) is wrong. [ApparenceKit](https://apparencekit.dev/flutter-tips/overflowbar-vs-wrap-flutter-difference/)

## Selectable text

[ApparenceKit](https://apparencekit.dev/flutter-tips/make-text-selectable-in-flutter/)

- "By default, text in Flutter apps isn't selectable." Selection lets people "copy details like addresses, phone numbers, or website links easily".
- "Use **SelectionArea** if you need to enable selection on multiple text widgets or other selectable widgets within a specific area. Use **SelectableText** if you only need to make a single Text widget selectable." Put `SelectionArea` "high up in your widget tree, like around your `Scaffold` or even `MaterialApp`".

```dart
return MaterialApp(
  home: SelectionArea(
    child: Scaffold(
      appBar: AppBar(title: const Text('SelectionArea Sample')),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            Text('Row 1'),
            Text('Row 2'),
            Text('Row 3'),
          ],
        ),
      ),
    ),
  ),
);
```

```dart
const SelectableText(
  'Hello! How are you?',
  textAlign: TextAlign.center,
  style: TextStyle(fontWeight: FontWeight.bold),
)
```

## React to window size changes

[ApparenceKit](https://apparencekit.dev/flutter-tips/listen-to-window-size-changes/) [ApparenceKit](https://apparencekit.dev/flutter-tips/flutter-responsive-devicesizebuilder/)

- Mix `WidgetsBindingObserver` into the `State` and call `WidgetsBinding.instance.addObserver(this)` in `initState`. `didChangeMetrics` "is automatically called whenever the screen size, device orientation, or other related things change". "In the `dispose` method, you must remove your widget's State as an observer. If you don't, your app might have problems or use too much memory."
- `DeviceSizeBuilder` keeps the last width bucket and calls `setState` only when `didChangeMetrics` crosses a breakpoint. Its comment gives a reason to measure the window: "I don't use View.of(context).physicalSize.width; because it returns the complete screen width on Web".

```dart
enum DeviceType {
  small(0),
  medium(768),
  large(1024),
  xlarge(1280);

  final int breakpoint;

  const DeviceType(this.breakpoint);

  static DeviceType fromWidth(double width) {
    return switch (width) {
      < 768 => DeviceType.small,
      < 1024 => DeviceType.medium,
      < 1280 => DeviceType.large,
      _ => DeviceType.xlarge,
    };
  }
}
```

```dart
typedef DeviceTypeBuilder = Widget Function(DeviceType);

/// A widget that helps you adapt  content to the current device type.
/// It uses the Most upper View to get the current device width
/// A builder is provided to let you adapt the content to the current device type.
/// It will rebuild the content when the device type changes.
class DeviceSizeBuilder extends StatefulWidget {
  final DeviceTypeBuilder builder;

  const DeviceSizeBuilder({
    super.key,
    required this.builder,
  });

  @override
  State<DeviceSizeBuilder> createState() => _DeviceSizeBuilderState();
}

class _DeviceSizeBuilderState extends State<DeviceSizeBuilder>
    with WidgetsBindingObserver {
  late DeviceType _lastSize;
  WidgetsBinding get widgetBinding => WidgetsBinding.instance;

  @override
  void initState() {
    super.initState();
    widgetBinding.addObserver(this);
  }

  @override
  void dispose() {
    widgetBinding.removeObserver(this);
    super.dispose();
  }

  // detect the viewport width
  // I don't use View.of(context).physicalSize.width;
  // because it returns the complete screen width on Web
  double get viewportWidth => MediaQuery.of(context).size.width;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _lastSize = DeviceType.fromWidth(viewportWidth);
  }

  @override
  void didChangeMetrics() {
    final newSize = DeviceType.fromWidth(viewportWidth);
    if (_lastSize != newSize) {
      _lastSize = newSize;
      setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    return widget.builder(_lastSize);
  }
}
```

- **`MediaQuery.of` vs `sizeOf`.** Flutter recommends `MediaQuery.sizeOf(context)` over `MediaQuery.of` "for performance reasons", since `sizeOf` rebuilds only when the size changes ([../flutter/LAYOUT-AND-RESPONSIVE.md](../flutter/LAYOUT-AND-RESPONSIVE.md#measure-the-window)). The getter becomes `double get viewportWidth => MediaQuery.sizeOf(context).width;`.
- **Breakpoints and names, two views.** ApparenceKit: buckets named `DeviceType` at 768 / 1024 / 1280. Flutter: the Material breakpoints (600 for compact) and "Never branch on hardware type" ([../flutter/LAYOUT-AND-RESPONSIVE.md](../flutter/LAYOUT-AND-RESPONSIVE.md#branch-at-a-breakpoint)). The builder branches on window width, not hardware, so only the naming and the values differ.
- ApparenceKit's `ResponsiveLayout` widget uses `LayoutBuilder` constraints and predefined breakpoints to pick a child (small, medium, large); its code is only in an external gist. [ApparenceKit](https://apparencekit.dev/flutter-tips/responsive-layout/) The `LayoutBuilder` breakpoint workflow is in [../flutter/LAYOUT-AND-RESPONSIVE.md](../flutter/LAYOUT-AND-RESPONSIVE.md#branch-at-a-breakpoint).

## Draw outside a Stack

[ApparenceKit](https://apparencekit.dev/flutter-tips/render-widget-outside-parent-bounds/)

- "By default, many Flutter widgets, like `Stack`, will 'clip' any content that goes beyond their own borders." To let a badge peek out of a card, set `clipBehavior: Clip.none` on the `Stack`:

```dart
return Stack(
  clipBehavior: Clip.none, // Add this line to prevent clipping!
  children: [
    Positioned(
      top: -24,
      right: -12,
      child: StreakNotification(task: widget.task),
    ),
    const SizedBox(height: 16.0),
    taskWidget,
  ],
);
```

- **Official default:** `Stack.clipBehavior` "Defaults to `Clip.hardEdge`", so the article is right for `Stack`. The general line "By default, clipping is disabled (`Clip.none`)" in [../flutter/PERFORMANCE.md](../flutter/PERFORMANCE.md) does not hold for `Stack`. [Stack.clipBehavior](https://api.flutter.dev/flutter/widgets/Stack/clipBehavior.html)
- **Taps do not follow the paint:** "Even when this is set to `Clip.none`, the stack itself does not extend its hit-test region: pointer events that fall outside the stack's own bounds will not reach a child even if that child is painted in that area." A tappable badge must sit inside the Stack's bounds. Also, "Stacks only clip children whose geometry overflows the stack"; a child's shadow or a `Transform` that paints outside is not clipped either way. [Stack.clipBehavior](https://api.flutter.dev/flutter/widgets/Stack/clipBehavior.html)

## Keys

- "Most of the time you don't need to use a widget key in Flutter. A new widget will only be used to update an existing element if its key is the same as the key of the current widget associated with that element." "Key allows Flutter to link an element from the ElementTree and a widget. If you ... swap two widgets with keys in the widget tree, Flutter will also swap these in the element tree." [ApparenceKit](https://apparencekit.dev/flutter-tips/why-use-flutter-widget-keys/)
- Use keys to clone a widget state across pages or tabs, change a widget's order inside a list, preserve scroll position (`PageStorageKey`, [../flutter/LAYOUT-AND-RESPONSIVE.md](../flutter/LAYOUT-AND-RESPONSIVE.md#input-and-state)), identify widgets and their state, and identify widgets in tests ([../flutter/TESTING.md](../flutter/TESTING.md)). [ApparenceKit](https://apparencekit.dev/flutter-tips/why-use-flutter-widget-keys/)
- A `GlobalKey` is unique across the whole app: "you should not create a new GlobalKey every time your widget builds. Instead, think of it as a long-lasting object that belongs to a widget's state." [ApparenceKit](https://apparencekit.dev/flutter-tips/understanding-keys-flutter/)
- Reach a `StatefulWidget`'s state from outside, for example to validate a `Form` [ApparenceKit](https://apparencekit.dev/flutter-tips/understanding-keys-flutter/):

```dart
final GlobalKey<FormState> _formKey = GlobalKey<FormState>(debugLabel: 'form');

// Later, to validate:
bool isFormValid() {
  if (_formKey.currentState == null) {
    return false;
  }
  return _formKey.currentState!.validate();
}
```

- **Move a widget without losing its state** with a `GlobalKey` and `KeyedSubtree` (wrap the widget or its parent); Flutter recognizes it after it moves. `Hero` does this. This is the mechanism behind "If depth must change, use a `GlobalKey` / `KeyedSubtree`" in [../flutter/PERFORMANCE.md](../flutter/PERFORMANCE.md). Flutter's Hero source as quoted [ApparenceKit](https://apparencekit.dev/flutter-tips/understanding-keys-flutter/):

```dart
class _HeroState extends State<Hero> {
  final GlobalKey _key = GlobalKey();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: _placeholderSize?.width,
      height: _placeholderSize?.height,
      child: Offstage(
        offstage: showPlaceholder,
        child: TickerMode(
          enabled: !showPlaceholder,
          child: KeyedSubtree(key: _key, child: widget.child),
        ),
      ),
    );
  }
}
```

## App lifecycle states

- Use the lifecycle to pause a video or stop a live process when the user leaves: add `WidgetsBindingObserver` to the widget's `State` and implement `didChangeAppLifecycleState`, which runs on every app state change. [ApparenceKit](https://apparencekit.dev/flutter-tips/observe-application-lifecycle-flutter/) (No code in the article.)
- **Correction:** the article lists "4 main states" (`resumed`, `inactive`, `paused`, `detached`). The current `AppLifecycleState` enum has five: `detached`, `resumed`, `inactive`, `hidden`, `paused`. The article (no version stated) misses `hidden`. [AppLifecycleState](https://api.flutter.dev/flutter/dart-ui/AppLifecycleState.html)
  - `resumed`: "the default running mode for a running application that has input focus and is visible".
  - `inactive`: "At least one view of the application is visible, but none have input focus." On iOS: phone call, TouchID request, app switcher, control center. "On Android and iOS, apps in this state should assume that they may be hidden and paused at any time."
  - `hidden`: "All views of an application are hidden". On iOS and Android it is synthesized before `paused` (from `inactive`) and before `inactive` (from `paused`), so one handler covers "hidden" on every platform.
  - `paused`: "not currently visible to the user, and not responding to user input"; only entered on iOS and Android.
  - `detached`: "still hosted by a Flutter engine but is detached from any host views"; also the state before the app initializes.
- Besides the `WidgetsBindingObserver` mixin, "changes to the state can be observed by creating an `AppLifecycleListener`"; the current state is `SchedulerBinding.instance.lifecycleState`. "Applications should not rely on always receiving all possible notifications": a killed app gets none. [AppLifecycleState](https://api.flutter.dev/flutter/dart-ui/AppLifecycleState.html) More lifecycle tips: [APP-LIFECYCLE.md](APP-LIFECYCLE.md).

## After the first frame

[ApparenceKit](https://apparencekit.dev/flutter-tips/wait-for-view-ready-flutter-app/)

- To run code once the view is built and visible (show a popup or welcome message, start the camera or a map, run animations, measure widget sizes that depend on the final layout), call `WidgetsBinding.instance.addPostFrameCallback` from `initState`. It "schedules a callback to run after the current frame has been rendered."

```dart
@override
void initState() {
  super.initState();
  WidgetsBinding.instance.addPostFrameCallback((_) {
    // Do your stuff here, after the view is ready
  });
}
```

- Prefer it to `Future.delayed(Duration(seconds: 1))`, which "is unreliable". "Don't Abuse It": for user input or data loading, other lifecycle methods or async patterns usually fit better.

## Child to parent with Actions and Intents

[ApparenceKit](https://apparencekit.dev/flutter-tips/change-parent-widget-model-from-child/)

- Instead of passing callbacks down several layers, use the built-in Actions and Intents ("I found this pattern inside the official Flutter source code"; no third-party package):
  1. A class extending `Intent` carries the data for the parent (example: `AppBarBuildIntent`).
  2. A class extending `Action<YourIntentType>` has an `invoke` method that updates the parent's model (example: `BartAppBarAction` updating a `ValueNotifier`).
  3. The parent wraps the subtree in `Actions` with a map from the `Intent` type to an `Action` instance.
  4. Any descendant calls `Actions.invoke(context, YourIntent(...))`; Flutter finds the matching `Action` and runs its `invoke`.
- Why: it makes the child-to-parent flow "more explicit and testable", "a structured alternative to callbacks". (The article's code is an image only.)

## Builders and factories

- **Delegate item design to a builder.** The list widget manages structure and data (`keys`, `_selectedIndex`); a builder function decides how each item looks. Example: a `RadioQuestion` over radio or checkbox items in a `ListView`. [ApparenceKit](https://apparencekit.dev/flutter-tips/delegate-widget-design/)

```dart
typedef OptionBuilder = Widget Function(String key, bool selected);
```

```dart
final OptionBuilder optionBuilder;
```

```dart
widget.optionBuilder(widget.keys[index], _selectedIndex == index)
```

- **Widget factories.** An abstract factory with a method (`create`) that builds the widget, concrete factories per variation (radio style, checkbox style), and a helper that takes a factory and calls `create`. "This pattern is different from basic builder patterns because you're often using premade build functions provided by the factory." [ApparenceKit](https://apparencekit.dev/flutter-tips/delegate-widget-design-with-factories/) (Code is an image only.) `pal_widgets`' `widgetFactory: AnchoredCircleHoleHelper.anchorFactory` is one in use ([above](#tutorial-overlays-with-pal_widgets)).

## Global app events

[ApparenceKit](https://apparencekit.dev/blog/flutter-app-events/)

- **The problem:** one action (a game ends) calls many services directly (`serviceA.onGameEnded()`, `reviewService.onGameEnded()`, `ratingService.onGameEnded()`, `experienceService.onGameEnded()`...). You get concurrency you cannot follow ("You don't know who is doing something before another"), services that know each other, and code that is "completely impossible to test ... with unit test".
- **The fix:** the Observer pattern with one global queue, a single `AppEventsDispatcher` instance ("So only one queue will be available for our all app"). Each service listens for the events it cares about; tests "simply have to publish events". `asBroadcastStream` "allow you to have multiple simultaneous listeners".

```dart
class AppEventsDispatcher<T extends AppEvent> {
  final StreamController<T> _controller;
  late final Stream<T?> _stream;

  Stream<T?> get stream => _stream;

  final List<T> _onNotificationEventsSubscriber;

  AppEventsDispatcher()
      : _onNotificationEventsSubscriber = [],
        _controller = StreamController() {
    _stream = _controller.stream.asBroadcastStream();
  }

  void dispose() {
    _onNotificationEventsSubscriber.clear();
    _controller.close();
  }

  void publish(T event) {
    _controller.add(event);
  }
}
```

```dart
sealed class AppEvent { }

// or

abstract class AppEvent { }
```

```dart
appEventDispatcher.stream.listen(onEvent);
```

```dart
Future<void> onEvent(AppEvent? event) async {
    if (event == null) {
	    return;
    }
    switch (event) {
      case OnStartGameEvent endGameEvent:
        // handle startGame
      case OnEndGameEvent endGameEvent:
	      // handle endGameEvent
      default:
    }
}
```

- The author prefers `sealed` because "it has the advantage to force me handling any new cases I add"; the article's own `default:` branch turns that exhaustiveness check off (exhaustiveness: [../dart/LANGUAGE.md](../dart/LANGUAGE.md)). `_onNotificationEventsSubscriber` is only ever cleared.
- **Buffering, two views.** The article's single-subscription `StreamController()` accepts `publish` calls with no listener, and `asBroadcastStream` subscribes only on its first listen, so earlier events are buffered. The Dart guidance says "A `StreamController` must wait for a subscriber before starting work (it buffers events with no subscriber, which risks a memory leak)" ([../dart/ASYNC.md](../dart/ASYNC.md)); the flutter skill's own key-value recipe uses `StreamController<bool>.broadcast()` ([../flutter/DATA-AND-NETWORKING.md](../flutter/DATA-AND-NETWORKING.md)). The article's design keeps services unaware of each other, which also fits "Repositories never know about each other" ([../flutter/ARCHITECTURE.md](../flutter/ARCHITECTURE.md)).
- "Getting further" (no code): events with a priority, consumed by the first service that needs them; a queue consumed one by one; a replayable queue; "make sure something will only be done once." "Don't forget to close the stream subscription" when the listener does not stay alive.

## Pagination and skeletons

[ApparenceKit](https://apparencekit.dev/blog/flutter-pagination-riverpod/)

The article's notifier is Riverpod; the parts below are the stack-neutral ones (the notifier code belongs with the Riverpod material).

- **Steps:** load the first page; load the next page near the end of the list; append the new items. "I generally use 15 items per page." "As Flutter only draws the visible items, you can have a list with thousands of items without any performance issues" (lazy lists: [../flutter/PERFORMANCE.md](../flutter/PERFORMANCE.md)).
- **Page state.** Keep the previous page to know whether more exist; or "instead of having a previousPage property, you can also try until the API answers with an empty list and store just a boolean".

```dart
class InboxPageState {
  final List<Inbox> items;
  final Pageable<Inbox>? previousPage;

  const InboxPageState({
    required this.items,
    this.previousPage,
  });

  bool get hasMore => previousPage?.hasMore ?? false;
}
```

- **Next-page guards:** skip while a load is in flight and when `!hasMore`; on success append to the existing items; on failure set the error state.
- **End-of-list detection:** a `ScrollController` listener calls `loadNextPage()` when `maxScrollExtent - pixels <= 200` ("The delta position is the distance from the end of the list ... Change it to fit your needs"):

```dart
class InboxPage extends ConsumerStatefulWidget {
  const InboxPage({super.key});

  @override
  ConsumerState<ConsumerStatefulWidget> createState() => _InboxPageState();
}

class _InboxPageState extends ConsumerState<InboxPage> {
  final ScrollController _scrollController = ScrollController(); // 1

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScrollListener);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScrollListener);
    super.dispose();
  }

  void _onScrollListener() {
    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentScroll = _scrollController.position.pixels;
    const delta = 200.0;
    if (maxScroll - currentScroll <= delta) { // 2
      ref.read(inboxNotifierProvider.notifier).loadNextPage();
    }
  }

  @override
  Widget build(BuildContext context) {
    ...
  }
}
```

  **Fix:** the `dispose` removes the listener but never disposes the controller; what a `State` allocates is disposed in `dispose` ([../flutter/PERFORMANCE.md](../flutter/PERFORMANCE.md)), so add `_scrollController.dispose();` before `super.dispose();`.
- **Slivers and skeleton rows.** The page is a `CustomScrollView` with slivers ("more flexible than regular lists ... cool animated headers"). While loading, it keeps the already-loaded items and adds 5 skeleton tiles after them (`itemCount: items.length + 5`, or 5 on first load): "To make it more interactive and fun, I display 5 fake items when loading".
- **Pull to refresh.** `RefreshIndicator.adaptive` wraps the `CustomScrollView` directly; "Flutter will automatically display the refresh indicator when the user pulls down the list."

```dart
RefreshIndicator.adaptive(
    displacement: 100,
    onRefresh: ()  {
        ref.read(inboxPageStateProvider.notifier).refresh();
    },
    child: CustomScrollView(
        controller: _scrollController,
        ...
```

  **Correction:** "The returned Future must complete when the refresh operation is finished." [RefreshIndicator.onRefresh](https://api.flutter.dev/flutter/material/RefreshIndicator/onRefresh.html) The block returns nothing; return the refresh `Future`: `onRefresh: () => ref.read(inboxPageStateProvider.notifier).refresh(),`.
- **Artificial delay, two views.** The article adds `Future.delayed(const Duration(seconds: 1))` before each load "to show the loading indicator even if the loading is fast". Against it: the same site calls `Future.delayed(Duration(seconds: 1))` "unreliable" ([After the first frame](#after-the-first-frame)), and the repo's UI rule is "Feedback is instant, results can follow" ([../../frontend/ui-animation/PATTERNS.md](../../frontend/ui-animation/PATTERNS.md)).
- **One loading state for first load and next page, two views.** The article sets the whole state to loading for the next page, so a next-page error replaces the list with the error branch. The repo's web rule keeps them apart: "'Loading more' is a separate flag from 'loading'", and "A failed refetch keeps what is shown until a later read succeeds; only a failed first read goes to the error state" ([../../frontend/app-ui/STATES.md](../../frontend/app-ui/STATES.md)).
- **Spinner or skeleton.** A basic indicator (`CircularProgressIndicator.adaptive()`, a `CupertinoActivityIndicator` on iOS) or a skeleton, "grey blocks that look like the layout of the page": "users perceive skeleton screens as loading faster, even if the actual load time is the same." Packages named: `sleek_circular_slider` ("customizable circular sliders"), `flutter_spinkit` ("many different kinds of loading animations"), `better_skeleton` ("Makes it easier to build these loading states"); no versions stated. [ApparenceKit](https://apparencekit.dev/flutter-tips/handle-loading-states-in-flutter/)
- **Skeleton tile with `better_skeleton`:** a 1000 ms `AnimationController` with `..repeat()` drives `AnimatedSkeleton(listenable: ...)`, which animates "the overlayed glass effect". "You can also share the animation controller between multiple widgets to make them animate at the same time."

```dart
import 'package:better_skeleton/skeleton_container.dart';
import 'package:flutter/material.dart';

class VideoSkeletonTile extends StatefulWidget {
  const VideoSkeletonTile({super.key});

  @override
  State<VideoSkeletonTile> createState() => _VideoSkeletonTileState();
}

class _VideoSkeletonTileState extends State<VideoSkeletonTile>
    with SingleTickerProviderStateMixin {
  late final AnimationController animationController; // ℹ️ 1

  @override
  void initState() {
    super.initState();
    animationController = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1000))
      ..repeat(); // ℹ️ 2
  }

  @override
  void deactivate() {
    animationController.dispose();
    super.deactivate();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSkeleton( // ℹ️ 3
      listenable: animationController,
      child: Container(
        height: 300,
        width: 200,
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.primary.withOpacity(.1),
          borderRadius: BorderRadius.circular(8),
        ),
        padding: const EdgeInsets.all(16),
      ),
    );
  }
}
```

  **Corrections:** dispose what `initState` allocates in `dispose`, not `deactivate` ([../flutter/PERFORMANCE.md](../flutter/PERFORMANCE.md)); and `Color.withOpacity` is deprecated since 3.22 for `withValues(alpha: ...)` ([../flutter/VERSIONS.md](../flutter/VERSIONS.md)). The article is out of date on both:

```dart
  @override
  void dispose() {
    animationController.dispose();
    super.dispose();
  }
```

```dart
          color: Theme.of(context).colorScheme.primary.withValues(alpha: .1),
```

## Prove it

- Every `addObserver(this)` has a matching `removeObserver(this)` in `dispose`; every `ScrollController`, `AnimationController` and `TransformationController` created in a `State` is disposed in `dispose`, never in `deactivate`.
- No `GlobalKey()` constructed inside `build`.
- No `Overlay.of(context)` followed by a null check; every inserted `OverlayEntry` has one `remove()` path.
- A lifecycle `switch` over `AppLifecycleState` names all five values, `hidden` included.
- A tappable badge on a `Stack` with `Clip.none` sits inside the Stack's bounds; tap it in a widget test.
- `onRefresh` returns the refresh `Future`; the spinner stays until the data is in.
- Scroll to the bottom of a paged list: one next-page request fires (not one per scroll event), loaded items stay visible, and skeleton rows appear after them.
- No `Future.delayed` used to wait for layout or to show a spinner.
