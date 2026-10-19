# Widget patterns

Small widget recipes and the framework mechanics behind them: avatars, app bars, overlays and tutorial overlays, zoom and pan, flex and row height, `OverflowBar` vs `Wrap`, selectable text, window-size changes, Stack clipping, keys, Actions and Intents, builders and factories. Lifecycle and first-frame work is in [APP-LIFECYCLE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/APP-LIFECYCLE.md); paged lists and loading are in [PAGINATION-AND-LOADING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/PAGINATION-AND-LOADING.md). Source: ApparenceKit tips and blog posts (apparencekit.dev, third-party; no article states a Flutter version), checked against api.flutter.dev where an API is named. Theming is in [THEMING.md](THEMING.md); lifecycle and scrolling tips from FlutterPro are in [APP-LIFECYCLE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/APP-LIFECYCLE.md) and [SCROLLING-AND-LAYOUT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/SCROLLING-AND-LAYOUT.md).

**Contents:** [Circular avatar with a border](#circular-avatar-with-a-border) · [Round button](#round-button) · [Custom app bar](#custom-app-bar) · [Overlays](#overlays) · [Tutorial overlays with pal_widgets](#tutorial-overlays-with-pal_widgets) · [Zoom and pan](#zoom-and-pan) · [Flex and row height](#flex-and-row-height) · [OverflowBar and Wrap](#overflowbar-and-wrap) · [Selectable text](#selectable-text) · [React to window size changes](#react-to-window-size-changes) · [Draw outside a Stack](#draw-outside-a-stack) · [Keys](#keys) · [Child to parent with Actions and Intents](#child-to-parent-with-actions-and-intents) · [Builders and factories](#builders-and-factories) · [Prove it](#prove-it)

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
- Flutter's performance guidance says "use `Opacity` only when necessary"; a semitransparent color is usually cheaper ([flutter PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/PERFORMANCE.md)). An `Opacity` around every disabled button is the case it warns about.

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

- **Flex allocation and the correction to ApparenceKit's fixed-flex claim:** [the canonical `Expanded` / `Flexible` rule](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md#branch-at-a-breakpoint), checked against the [Expanded constructor](https://api.flutter.dev/flutter/widgets/Expanded/Expanded.html). [ApparenceKit](https://apparencekit.dev/blog/flutter-flex/)

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

- **A Row inside a Column, two views.** ApparenceKit: a Row in a Column gets unbounded height, and children such as `Expanded` "struggle when they receive infinite constraints in the cross-axis (which is height for a Row)"; "the simple fix" is `IntrinsicHeight`, which "forces its child (your Row, in this case) to take on the minimum height that its children need". [ApparenceKit](https://apparencekit.dev/flutter-tips/size-row-height-in-column/) Flutter's performance guidance: "Avoid intrinsics", an intrinsic pass is a second layout pass; prefer a fixed cell size up front ([flutter PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/PERFORMANCE.md)).

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

- **`MediaQuery.of` vs `sizeOf`.** Flutter recommends `MediaQuery.sizeOf(context)` over `MediaQuery.of` "for performance reasons", since `sizeOf` rebuilds only when the size changes ([flutter-ui LAYOUT-AND-RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md#measure-the-window)). The getter becomes `double get viewportWidth => MediaQuery.sizeOf(context).width;`.
- **Breakpoints and names, two views.** ApparenceKit: buckets named `DeviceType` at 768 / 1024 / 1280. Flutter: the Material breakpoints (600 for compact) and "Never branch on hardware type" ([flutter-ui LAYOUT-AND-RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md#branch-at-a-breakpoint)). The builder branches on window width, not hardware, so only the naming and the values differ.
- ApparenceKit's `ResponsiveLayout` widget uses `LayoutBuilder` constraints and predefined breakpoints to pick a child (small, medium, large); its code is only in an external gist. [ApparenceKit](https://apparencekit.dev/flutter-tips/responsive-layout/) The `LayoutBuilder` breakpoint workflow is in [flutter-ui LAYOUT-AND-RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md#branch-at-a-breakpoint).

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

- **Official default:** `Stack.clipBehavior` "Defaults to `Clip.hardEdge`", so the article is right for `Stack`. The general line "By default, clipping is disabled (`Clip.none`)" in [flutter PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/PERFORMANCE.md) does not hold for `Stack`. [Stack.clipBehavior](https://api.flutter.dev/flutter/widgets/Stack/clipBehavior.html)
- **Taps do not follow the paint:** "Even when this is set to `Clip.none`, the stack itself does not extend its hit-test region: pointer events that fall outside the stack's own bounds will not reach a child even if that child is painted in that area." A tappable badge must sit inside the Stack's bounds. Also, "Stacks only clip children whose geometry overflows the stack"; a child's shadow or a `Transform` that paints outside is not clipped either way. [Stack.clipBehavior](https://api.flutter.dev/flutter/widgets/Stack/clipBehavior.html)

## Keys

- "Most of the time you don't need to use a widget key in Flutter. A new widget will only be used to update an existing element if its key is the same as the key of the current widget associated with that element." "Key allows Flutter to link an element from the ElementTree and a widget. If you ... swap two widgets with keys in the widget tree, Flutter will also swap these in the element tree." [ApparenceKit](https://apparencekit.dev/flutter-tips/why-use-flutter-widget-keys/)
- Use keys to clone a widget state across pages or tabs, change a widget's order inside a list, preserve scroll position (`PageStorageKey`, [flutter-ui LAYOUT-AND-RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md#input-and-state)), identify widgets and their state, and identify widgets in tests ([flutter TESTING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/TESTING.md)). [ApparenceKit](https://apparencekit.dev/flutter-tips/why-use-flutter-widget-keys/)
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

- **Move a widget without losing its state** with a `GlobalKey` and `KeyedSubtree` (wrap the widget or its parent); Flutter recognizes it after it moves. `Hero` does this. This is the mechanism behind "If depth must change, use a `GlobalKey` / `KeyedSubtree`" in [flutter PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/PERFORMANCE.md). Flutter's Hero source as quoted [ApparenceKit](https://apparencekit.dev/flutter-tips/understanding-keys-flutter/):

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

## Prove it

- Every `ScrollController`, `AnimationController` and `TransformationController` created in a `State` is disposed in `dispose`, never in `deactivate`.
- No `GlobalKey()` constructed inside `build`.
- No `Overlay.of(context)` followed by a null check; every inserted `OverlayEntry` has one `remove()` path.
- A tappable badge on a `Stack` with `Clip.none` sits inside the Stack's bounds; tap it in a widget test.
