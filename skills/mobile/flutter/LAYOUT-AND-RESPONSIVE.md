# Layout and responsive design

How a Flutter screen fits the space it gets and stays usable there: measuring the window, branching layouts at breakpoints, large screens and foldables, platform adaptations, fixing the layout exceptions Flutter throws, and previewing widgets while you build them. One rule decides most outcomes: "Constraints go down. Sizes go up. Parent sets position." Every layout decision is based on the available window space, never on the device type or its orientation. Layering and widget structure are in [ARCHITECTURE.md](ARCHITECTURE.md), rebuild cost in [PERFORMANCE.md](PERFORMANCE.md), tap targets and text scaling in [ACCESSIBILITY.md](ACCESSIBILITY.md), widget and golden tests in [TESTING.md](TESTING.md), and animation in [../../frontend/ui-animation/SKILL.md](../../frontend/ui-animation/SKILL.md). The third-party `flutter_scale_kit` package is in [SCALE-KIT.md](SCALE-KIT.md).

**Contents:** [Responsive and adaptive](#responsive-and-adaptive) · [Measure the window](#measure-the-window) · [Branch at a breakpoint](#branch-at-a-breakpoint) · [Large screens and foldables](#large-screens-and-foldables) · [Orientation](#orientation) · [SafeArea and MediaQuery](#safearea-and-mediaquery) · [Input and state](#input-and-state) · [Capabilities and policies](#capabilities-and-policies) · [Platform adaptations](#platform-adaptations) · [Material and Cupertino as packages](#material-and-cupertino-as-packages) · [Fix layout errors](#fix-layout-errors) · [Widget previews](#widget-previews) · [Prove it](#prove-it)

## Responsive and adaptive

- **Two words, two jobs.** "Responsive design is about fitting the UI _into_ the space and adaptive design is about the UI being _usable_ in the space." Both together are often called "adaptive design".
- **Three steps: Abstract, Measure, Branch.**
  - **Abstract:** pull out the data shared by the variants (dialogs, navigation rail or bottom bar, custom layouts). Example: one `Destination` with an icon and a label, used by both `NavigationBar` and `NavigationRail`.
  - **Measure:** read the window or the parent constraints (next section).
  - **Branch:** pick the layout for that size.
- **Break widgets down.** "Having lots of small `const` widgets improves rebuild times over having large, complex widgets. Flutter can reuse `const` widget instances."
- **Design to each form factor's strengths.** "Solve touch first", then tune visual density for the mouse and add other inputs as accelerators.
- **Codelab:** https://codelabs.developers.google.com/codelabs/flutter-animated-responsive-layout

## Measure the window

- **Measure the app window, not the physical device.**
  - `MediaQuery.sizeOf(context)` gives the whole app window.
  - `LayoutBuilder` gives the space the parent allocated (`BoxConstraints` min and max). Use it for custom widgets and branch on `constraints.maxWidth`.
- **Use `MediaQuery.sizeOf`, not `MediaQuery.of`,** "for performance reasons": `sizeOf` rebuilds the context only when the size changes.
- **Sizes are logical pixels.**
- **Never branch on hardware type** ("phone" vs "tablet"). Apps run in resizable windows (ChromeOS), multi-window and picture-in-picture. Flutter's official skill and docs both say this. The third-party `flutter_scale_kit` skill says the opposite for device-class branches; see [SCALE-KIT.md](SCALE-KIT.md#device-classification).

## Branch at a breakpoint

- **Material breakpoint:** "a bottom nav bar for windows less than 600 logical pixels wide, and a nav rail for those that are 600 pixels wide or greater." Switch `BottomNavigationBar` and `NavigationRail` by space. "Your choice shouldn't depend on the _type_ of device, but on the device's available window size."
- **Workflow:**
  1. Wrap the widget in `LayoutBuilder` and set a breakpoint (example `largeScreenMinWidth = 600`).
  2. If `maxWidth > largeScreenMinWidth`, return the large layout (for example a `Row` with a nav sidebar and content).
  3. Otherwise return the small layout (a `Column` or standard navigation).
  4. Resize the window and fix any overflows.

```dart
import 'package:flutter/material.dart';

const double largeScreenMinWidth = 600.0;

class AdaptiveLayout extends StatelessWidget {
  const AdaptiveLayout({super.key});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth > largeScreenMinWidth) {
          return _buildLargeScreenLayout();
        } else {
          return _buildSmallScreenLayout();
        }
      },
    );
  }

  Widget _buildLargeScreenLayout() {
    return Row(
      children: [
        const SizedBox(width: 250, child: Placeholder(color: Colors.blue)),
        const VerticalDivider(width: 1),
        Expanded(child: const Placeholder(color: Colors.green)),
      ],
    );
  }

  Widget _buildSmallScreenLayout() {
    return const Placeholder(color: Colors.green);
  }
}
```

- **`Expanded` vs `Flexible`.** `Expanded` makes a child fill all remaining space; it equals `Flexible` with `fit: FlexFit.tight` and a `flex` of 1.0. `Flexible` lets a child size itself up to a limit. `flex` sets the ratio between siblings.

## Large screens and foldables

- **What counts as large:** tablets, foldables, ChromeOS, plus web, desktop and iPads. Supporting them improves engagement and Play Store visibility (ratings are shown by device type, and missing large-screen support is flagged) and meets the iPadOS submission guidelines.
- **Lists become grids.** Change `ListView.builder` to `GridView.builder` with `SliverGridDelegateWithMaxCrossAxisExtent` (the official skill) or `SliverGridDelegateWithFixedCrossAxisCount` (the docs list both), so the column count follows the window size. Never hardcode columns per device type.
- **Do not stretch boxes and text fields to the full width.** Wrap `GridView` and `ListView` in a `ConstrainedBox` or `Container` with a `maxWidth` in `BoxConstraints`; wrap forms and text blocks in a `ConstrainedBox(BoxConstraints(maxWidth: ...))` inside a `Center`.

```dart
import 'package:flutter/material.dart';

class ConstrainedContent extends StatelessWidget {
  const ConstrainedContent({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(
            maxWidth: 800.0, // Maximum width for readability
          ),
          child: ListView.builder(
            itemCount: 50,
            itemBuilder: (context, index) {
              return ListTile(
                title: Text('Item $index'),
              );
            },
          ),
        ),
      ),
    );
  }
}
```

- **Unknown or large item counts:** "Always use `ListView.builder` or `GridView.builder`". See [PERFORMANCE.md](PERFORMANCE.md#lists-and-grids).
- **Android tier 3 requires mouse and stylus input.**

## Orientation

- **Do not lock the orientation.** "The Material Guidelines encourage you to never _portrait lock_ your app". Locked screens can be an accessibility issue. "Android large format tiers require both portrait and landscape support" (at the lowest tier). Android can override a locked screen. Apple says aim to support both orientations.
- **Foldables:** a portrait lock with `setPreferredOrientations` puts Android into portrait compatibility mode, which letterboxes the app (centered with black borders), and `MediaQuery` never sees the larger window.
- **If business rules truly require a lock,** read the physical screen from the `Display` API (`View.maybeOf(context)?.display`) instead of `MediaQuery`.
- **Android 17:** for apps targeting Android 17+, orientation, resizability and aspect-ratio restrictions do not apply on displays of 600dp or more, and `SystemChrome.setPreferredOrientations` is ignored there (details in [VERSIONS.md](VERSIONS.md)).
- **Do not switch layouts on orientation** with `MediaQuery.orientationOf` or `OrientationBuilder` near the top of the tree. "Device orientation does not accurately reflect the available app window space." Use `sizeOf` or `LayoutBuilder` with the Material breakpoints.

## SafeArea and MediaQuery

- **`SafeArea` insets for notches, cutouts, the status bar and rounded corners.** All four sides are on by default.
- **Wrap the `Scaffold` body, not the `Scaffold`.** The `AppBar` already goes under the status bar.
- **Nested `SafeArea`s apply padding once.** Only the topmost applies it, because it rewrites the `MediaQuery` for its children. Reading `MediaQueryData.padding` directly does not behave this way.
- **`MediaQuery` also exposes** high contrast, text scaling, whether TalkBack or VoiceOver is on, and hinge or fold information.

## Input and state

- **Support mice, trackpads and keyboard shortcuts.** Keep common flows keyboard-navigable and size touch targets appropriately (see [ACCESSIBILITY.md](ACCESSIBILITY.md)).
- **Keep state across rotate, resize and fold or unfold.** Restore list scroll position across rotation with `PageStorageKey`. Some native extensions lose state.

## Capabilities and policies

- **Flutter's recommended pattern** is a set of `Capability` and `Policy` classes.
  - **Capability:** what the code or device *can* do (an API exists, OS restrictions, hardware such as a camera).
  - **Policy:** what it *should* do (app store guidelines, design preferences, host-specific copy, server-side features).
- **"Avoid using `Platform.isAndroid` and similar functions to make layout decisions or assumptions about what a device can do."**
- **Name methods by what they branch on,** not by device type, and mock capabilities and policies in widget tests.
- **Policies can be** compile-time (a platform requires not linking to the Play store, or a specific payment provider), runtime (a touch screen is present), or RPC-backed (incremental rollout).

```dart
class Policy {
  bool shouldAllowPurchaseClick() {
    // Banned by Apple App Store guidelines.
    return !Platform.isIOS;
  }
}
```

### Context-aware layouts (optional)

Community practice from one Flutter Community post (Rudraksh Shukla, "The Death of the Static UI"), whose author calls its code "illustrative and simplified". In a context-aware screen "the interface has conditional branches, and an on-device model decides which branch to render", fed by sensors, system state and usage history. The reactive plumbing stays the same (`StreamBuilder`, `ValueListenableBuilder`, Riverpod, Bloc pointed at a stream of context).

- **Write the branches as if/then rules:** moving (accelerometer, gyroscope): enlarge touch targets and simplify the layout; bright light outdoors: boost contrast; night: dark mode; usage history: "promote the three features this user actually touches, demote the ones they never open"; dying battery or weak connection: "drop to a minimalist, low-power layout".
- **Branch whole layouts on the predicted intent,** as in [Branch at a breakpoint](#branch-at-a-breakpoint): one shared list of actions, a large primary-action card for a user in a hurry, a denser discovery grid for browsing. Give each branch root a `Key` so a test can find it ([TESTING.md](TESTING.md#widget-tests)).
- **Keep a stability budget:** "users build spatial memory, and moving the button they reach for by reflex is a bug, not a feature. Adapt at sensible boundaries (app launch, a clear context change), not continuously."
- **Let users see and reset adaptation:** give them "a visible, easy way to see and reset how the app has adapted to them".
- **Make accessibility an explicit adaptation rule,** "rather than hoping it falls out": the post calls real-time touch-target enlargement and automatic WCAG-compliant contrast natural fits for adaptive systems. Values: [ACCESSIBILITY.md](ACCESSIBILITY.md#design-values).
- **Design review approves rules and bounds,** not one comp: "designers specify how far the UI is allowed to move, not one frozen state."
- **Signal and model packages** named in the post: [PLATFORM-INTEGRATION.md](PLATFORM-INTEGRATION.md#pick-the-mechanism). Battery cost: [PERFORMANCE.md](PERFORMANCE.md#isolates).

## Platform adaptations

- **Automatic, no code needed:**
  - Page transitions: the platform-adaptations page says Android push uses `ZoomPageTransitionsBuilder`, while the 3.38 breaking change makes `PredictiveBackPageTransitionsBuilder` the Android default (see [VERSIONS.md](VERSIONS.md)); confirm in the current docs. iOS push is a slide with parallax, and `PageRoute.fullscreenDialog` gives a bottom-up modal.
  - Back: the Android back button pops the top route; the iOS edge swipe pops.
  - Scroll physics, overscroll, momentum stacking (iOS) and status-bar tap to scroll to top (iOS).
  - Typography: Roboto on Android, San Francisco on iOS (the SF license limits it to Apple platforms).
- **`Icons.adaptive`** gives platform icons.
- **`.adaptive()` constructors substitute Cupertino on iOS.** Follow platform conventions for these:

| Constructor | On iOS |
| --- | --- |
| `Switch.adaptive()` | `CupertinoSwitch` |
| `Slider.adaptive()` | `CupertinoSlider` |
| `CircularProgressIndicator.adaptive()` | `CupertinoActivityIndicator` |
| `RefreshIndicator.adaptive()` | `CupertinoActivityIndicator` |
| `Checkbox.adaptive()` | `CupertinoCheckbox` |
| `Radio.adaptive()` | `CupertinoRadio` |
| `AlertDialog.adaptive()` | `CupertinoAlertDialog` |

- **Bottom navigation per platform:** `NavigationBar` on Android, `CupertinoTabBar` on iOS.
- **Platform idioms:** matching them reduces cognitive load and builds trust ("better app store ratings"). Assign a platform advocate per platform. Examples: `Scrollbar(thumbVisibility: DeviceType.isDesktop, ...)`, `SelectableText` / `SelectableText.rich` on web, tooltips after 200 to 400 ms of hover.

## Material and Cupertino as packages

- **Material and Cupertino are moving out of the SDK** into the `material_ui` and `cupertino_ui` packages. Current docs samples import `package:material_ui/material_ui.dart`, while the official agent skills' samples in this file still import `package:flutter/material.dart`.
- **`flutter create` does not yet default to them.** Migrate with `dart fix --apply --code=migrate_design_widgets`.
- **Timeline and package requirements** (frozen in 3.44, 1.0 packages in 3.47, in-SDK deprecation planned for the November stable release, go_router 18.0.0 already migrated) are in [VERSIONS.md](VERSIONS.md).

## Fix layout errors

| Error text | Cause | Fix |
| --- | --- | --- |
| "Vertical viewport was given unbounded height" | A scrollable (`ListView`, `GridView`) inside an unconstrained vertical parent (`Column`) | Wrap the scrollable in `Expanded`, or in a `SizedBox` with an absolute height |
| "An InputDecorator...cannot have an unbounded width" | A `TextField` or `TextFormField` inside an unconstrained horizontal parent (`Row`) | Wrap it in `Expanded` or `Flexible` |
| "RenderFlex overflowed" (yellow and black stripes) | A child of a `Row` or `Column` asks for more than the constraints allow | Wrap the child in `Expanded` (forces it to fit) or `Flexible` (lets it be smaller than the allocated space) |
| "Incorrect use of ParentData widget" | A `ParentDataWidget` that is not a direct child of its required ancestor (`Expanded` outside a `Flex`, `Positioned` outside a `Stack`) | Make `Expanded`/`Flexible` direct children of `Row`/`Column`/`Flex`, and `Positioned` a direct child of `Stack` |
| "RenderBox was not laid out" | A cascading side effect | Ignore it and look further up the stack trace for the primary violation, usually unbounded height or width |

- **Workflow:** run in debug mode to capture the exception, find the primary error, apply the fix from the table, hot reload, then confirm the red or grey error screen or the stripes are gone. Repeat if new errors appear.

```dart
// Throws "Vertical viewport was given unbounded height"
Column(
  children: <Widget>[
    const Text('Header'),
    ListView(
      children: const <Widget>[
        ListTile(title: Text('Item 1')),
        ListTile(title: Text('Item 2')),
      ],
    ),
  ],
)
```
```dart
// Wrap ListView in Expanded to constrain its height to the remaining Column space
Column(
  children: <Widget>[
    const Text('Header'),
    Expanded(
      child: ListView(
        children: const <Widget>[
          ListTile(title: Text('Item 1')),
          ListTile(title: Text('Item 2')),
        ],
      ),
    ),
  ],
)
```
```dart
// Throws "An InputDecorator...cannot have an unbounded width"
Row(
  children: [
    const Icon(Icons.search),
    TextField(), 
  ],
)
```
```dart
// Wrap TextField in Expanded to constrain its width to the remaining Row space
Row(
  children: [
    const Icon(Icons.search),
    Expanded(
      child: TextField(),
    ),
  ],
)
```
```dart
// Throws "A RenderFlex overflowed by X pixels on the right"
Row(
  children: [
    const Icon(Icons.info),
    const Text('This is a very long text string that will definitely overflow the available screen width and cause a RenderFlex error.'),
  ],
)
```
```dart
// Wrap the Text widget in Expanded to force it to wrap within the available constraints
Row(
  children: [
    const Icon(Icons.info),
    Expanded(
      child: const Text('This is a very long text string that will definitely overflow the available screen width and cause a RenderFlex error.'),
    ),
  ],
)
```

## Widget previews

### Rules

- **What `@Preview` can annotate:** top-level functions, static methods in a class, or public widget constructors and factories that have no required arguments and return a `Widget` or `WidgetBuilder`.
- **Always import `package:flutter/widget_previews.dart`.**
- **Parameters:** `name`, `group`, `size`, `theme`, `brightness`.
- **Shared properties:** extend `Preview` to make a custom annotation that injects themes or wrappers.
- **Several previews of one target:** stack several `@Preview` annotations, or extend `MultiPreview`.
- **Runtime configuration:** override `transform()` in a custom `Preview` or `MultiPreview`, for example to generate names from dynamic values, "which is impossible in a `const` context".

### Limits (the previewer runs in a web environment)

- **No native plugins and no `dart:io` or `dart:ffi`.** A widget with a transitive dependency on `dart:io` or `dart:ffi` throws when invoked. Use conditional imports to mock or bypass these in preview mode.
- **Package-based asset paths.** Assets loaded through the `dart:ui` `fromAsset` APIs need `packages/my_package_name/assets/my_image.png`, not `assets/my_image.png`.
- **Callbacks must be public and constant,** because code generation requires it.
- **Unconstrained widgets get about half the viewport** by default. Set `size` on `@Preview` for explicit constraints.

### Launching

- **IDE:** in Android Studio, IntelliJ, or VS Code with Flutter 3.38+, the Widget Previewer starts automatically. Open the "Flutter Widget Preview" tab in the sidebar. To see previews outside the active file, toggle "Filter previews by selected file" at the bottom left.
- **Command line:** run `flutter widget-preview start` in the project root. Chrome opens automatically.
- **Status:** Widget Previews are stable as of Flutter 3.47, with a `.widget_preview/` cache.
- **Iterating:** after changing global state (such as static initializers), click the global hot restart button at the bottom right. To reset one widget's local state, click the hot restart button on that preview card.

### Code

```dart
import 'package:flutter/widget_previews.dart';
import 'package:flutter/material.dart';

@Preview(name: 'My Sample Text', group: 'Typography')
Widget mySampleText() {
  return const Text('Hello, World!');
}
```
```dart
import 'package:flutter/widget_previews.dart';
import 'package:flutter/material.dart';

final class TransformativePreview extends Preview {
  const TransformativePreview({
    super.name,
    super.group,
  });

  PreviewThemeData _themeBuilder() {
    return PreviewThemeData(
      materialLight: ThemeData.light(),
      materialDark: ThemeData.dark(),
    );
  }

  @override
  Preview transform() {
    final originalPreview = super.transform();
    final builder = originalPreview.toBuilder();
    
    builder
      ..name = 'Transformed - ${originalPreview.name}'
      ..theme = _themeBuilder;

    return builder.toPreview();
  }
}

@TransformativePreview(name: 'Custom Themed Button')
Widget myButton() => const ElevatedButton(onPressed: null, child: Text('Click'));
```
```dart
import 'package:flutter/widget_previews.dart';
import 'package:flutter/material.dart';

/// Creates light and dark mode previews automatically.
final class MultiBrightnessPreview extends MultiPreview {
  const MultiBrightnessPreview({required this.name});

  final String name;

  @override
  List<Preview> get previews => const [
        Preview(brightness: Brightness.light),
        Preview(brightness: Brightness.dark),
      ];

  @override
  List<Preview> transform() {
    final previews = super.transform();
    return previews.map((preview) {
      final builder = preview.toBuilder()
        ..group = 'Brightness'
        ..name = '$name - ${preview.brightness!.name}';
      return builder.toPreview();
    }).toList();
  }
}

@MultiBrightnessPreview(name: 'Primary Card')
Widget cardPreview() => const Card(child: Padding(padding: EdgeInsets.all(8.0), child: Text('Content')));
```

## Prove it

- **No device-type or orientation branching:** search the code for `OrientationBuilder`, `MediaQuery.orientationOf`, `Platform.isAndroid` / `Platform.isIOS` used for layout, and phone or tablet checks. Each layout branch reads `MediaQuery.sizeOf` or `LayoutBuilder` constraints.
- **No `MediaQuery.of(context).size`:** window size comes from `MediaQuery.sizeOf(context)`.
- **Resize test:** run the app in a resizable window and drag it across 600 logical pixels. The navigation switches between bottom bar and rail, no yellow and black overflow stripes appear, and wide screens show a capped content width or a grid.
- **Orientation:** no `setPreferredOrientations` portrait lock, unless business rules require it and the code reads `View.maybeOf(context)?.display`.
- **Rotation keeps state:** rotate with a scrolled list; the position survives (`PageStorageKey`).
- **Layout errors:** a debug run shows no red or grey error screen; for each exception, the fix matches the table above, and "RenderBox was not laid out" was traced to its primary violation.
- **Previews:** `flutter widget-preview start` opens Chrome and every `@Preview` renders; previewed widgets have no transitive `dart:io` or `dart:ffi` dependency.
