# Layout and responsive design

How a Flutter screen fits the space it gets and stays usable there: measuring the window, branching layouts at breakpoints, large screens and foldables, platform adaptations, fixing the layout exceptions Flutter throws, and previewing widgets while you build them. One rule decides most outcomes: "Constraints go down. Sizes go up. Parent sets position." Every layout decision is based on the available window space, never on the device type or its orientation. Layering and widget structure are in [ARCHITECTURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ARCHITECTURE.md), rebuild cost in [PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/PERFORMANCE.md), tap targets and text scaling in [ACCESSIBILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ACCESSIBILITY.md), widget and golden tests in [TESTING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/TESTING.md), and animation in [ui-animation SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md). The owner's CSS-units rules (the parallel list, M3 breakpoints, the iron rule) are in [RESPONSIVE-UNITS.md](RESPONSIVE-UNITS.md). The third-party `flutter_scale_kit` package is in [SCALE-KIT.md](SCALE-KIT.md). Community scrolling and layout polish (bottom padding instead of `SafeArea` on scrollables, scrollbars, edge fades, hit areas) is in [flutter-ux SCROLLING-AND-LAYOUT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/SCROLLING-AND-LAYOUT.md), small widget mechanics (flex, `OverflowBar`, clipping, window-size listeners) in [flutter-ui WIDGET-PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/WIDGET-PATTERNS.md), and custom `RenderObject` layout in [flutter-render-objects LAYOUT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-render-objects/LAYOUT.md).

**Contents:** [Responsive and adaptive](#responsive-and-adaptive) · [Measure the window](#measure-the-window) · [Branch at a breakpoint](#branch-at-a-breakpoint) · [Large screens and foldables](#large-screens-and-foldables) · [Orientation](#orientation) · [SafeArea and MediaQuery](#safearea-and-mediaquery) · [Input and state](#input-and-state) · [Capabilities and policies](#capabilities-and-policies) · [Platform adaptations](#platform-adaptations) · [Material and Cupertino as packages](#material-and-cupertino-as-packages) · [Fix layout errors](#fix-layout-errors) · [Widget previews](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/AGENT-TOOLING.md#widget-previews) · [Prove it](#prove-it)

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
  - `MediaQuery.sizeOf(context)` gives the whole app window. Owner's rule: it is `vw`, for the page skeleton (navigation, scaffold), never an inner card; `MediaQuery.widthOf` when only the width matters ([RESPONSIVE-UNITS.md](RESPONSIVE-UNITS.md#the-parallel-list)).
  - `LayoutBuilder` gives the space the parent allocated (`BoxConstraints` min and max). Use it for custom widgets and branch on `constraints.maxWidth`; it is the closest thing to `cqi`. ApparenceKit's sidebar reads its full height from `constraints.maxHeight` rather than `MediaQuery.of(context).size.height`: "For performance reasons, it is better to use LayoutBuilder" ([ApparenceKit](https://apparencekit.dev/blog/how-to-build-flutter-sidebar-menu/)).
  - Not `View.of(context).physicalSize.width`: an ApparenceKit code comment notes "it returns the complete screen width on Web" ([ApparenceKit](https://apparencekit.dev/flutter-tips/flutter-responsive-devicesizebuilder/)).
- **Use `MediaQuery.sizeOf`, not `MediaQuery.of`,** "for performance reasons": `sizeOf` rebuilds the context only when the size changes. Owner's rule: one accessor per value, `sizeOf` / `paddingOf` / `textScalerOf`.
- **Listening instead of rebuilding** ([ApparenceKit](https://apparencekit.dev/flutter-tips/listen-to-window-size-changes/)): mix `WidgetsBindingObserver` into a `State`, call `WidgetsBinding.instance.addObserver(this)` in `initState`, and `didChangeMetrics` "is automatically called whenever the screen size, device orientation, or other related things change"; remove the observer in `dispose` ("If you don't, your app might have problems or use too much memory"). ApparenceKit's `DeviceSizeBuilder` uses it to `setState` only when a width bucket changes, with buckets at 768, 1024 and 1280 rather than the Material 600 below, and reads `MediaQuery.of(context).size.width`, which the rule above replaces with `sizeOf` ([flutter-ui WIDGET-PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/WIDGET-PATTERNS.md#react-to-window-size-changes)).
- **Sizes are logical pixels.**
- **Never branch on hardware type** ("phone" vs "tablet"). Apps run in resizable windows (ChromeOS), multi-window and picture-in-picture. Flutter's official skill and docs both say this. The third-party `flutter_scale_kit` skill says the opposite for device-class branches; see [SCALE-KIT.md](SCALE-KIT.md#device-classification).

## Branch at a breakpoint

- **Material breakpoint:** "a bottom nav bar for windows less than 600 logical pixels wide, and a nav rail for those that are 600 pixels wide or greater." Switch `BottomNavigationBar` and `NavigationRail` by space. "Your choice shouldn't depend on the _type_ of device, but on the device's available window size." M3 lists five breakpoints (600, 840, 1200, 1600): [RESPONSIVE-UNITS.md](RESPONSIVE-UNITS.md#m3-breakpoints).
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

- **`Expanded` vs `Flexible`.** `Expanded` uses `FlexFit.tight` to fill its allocated main-axis space; its configurable `int flex` defaults to 1. Flex factors divide the remaining main-axis space after inflexible children; `Flexible` with a loose fit allows a child to be smaller than its allocation. [Expanded constructor](https://api.flutter.dev/flutter/widgets/Expanded/Expanded.html), [Flex layout algorithm](https://api.flutter.dev/flutter/widgets/Flex-class.html). P2 correction: ApparenceKit's [flex article](https://apparencekit.dev/blog/flutter-flex/) and the old community line called the flex fixed at 1; the old line here also previously used the wrong type, "1.0".
  - A community view: for a `Row` inside a `Column` whose children "struggle when they receive infinite constraints in the cross-axis", ApparenceKit wraps the `Row` in `IntrinsicHeight` ([ApparenceKit](https://apparencekit.dev/flutter-tips/size-row-height-in-column/)); the Flutter performance docs say "Avoid intrinsics" (a second layout pass, [PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/PERFORMANCE.md)). Both: [flutter-ui WIDGET-PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/WIDGET-PATTERNS.md#flex-and-row-height).
- **`OverflowBar` vs `Wrap`.** `OverflowBar` "lays out its children in a row unless they "overflow" the available horizontal space, in which case it lays them out in a column instead" (https://api.flutter.dev/flutter/widgets/OverflowBar-class.html); `Wrap` moves children to the next line one by one ([ApparenceKit](https://apparencekit.dev/flutter-tips/discovering-overflowbar-flutter-responsive-layout/)). ApparenceKit's "OverflowBar or Wrap?" tip ([ApparenceKit](https://apparencekit.dev/flutter-tips/overflowbar-vs-wrap-flutter-difference/), no version stated) says children "extend beyond the available area" instead; that contradicts the API doc and is wrong.
- **`Stack` clips by default.** `Stack.clipBehavior` defaults to `Clip.hardEdge` (https://api.flutter.dev/flutter/widgets/Stack/clipBehavior.html); set `clipBehavior: Clip.none` to let a badge peek out of a card ([ApparenceKit](https://apparencekit.dev/flutter-tips/render-widget-outside-parent-bounds/), code and the hit-test catch in [flutter-ui WIDGET-PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/WIDGET-PATTERNS.md#draw-outside-a-stack)).

## Large screens and foldables

- **What counts as large:** tablets, foldables, ChromeOS, plus web, desktop and iPads. Supporting them improves engagement and Play Store visibility (ratings are shown by device type, and missing large-screen support is flagged) and meets the iPadOS submission guidelines.
- **Lists become grids.** Change `ListView.builder` to `GridView.builder` with `SliverGridDelegateWithMaxCrossAxisExtent` (the official skill) or `SliverGridDelegateWithFixedCrossAxisCount` (the docs list both), so the column count follows the window size. Never hardcode columns per device type.
- **Do not stretch boxes and text fields to the full width.** Wrap `GridView` and `ListView` in a `ConstrainedBox` or `Container` with a `maxWidth` in `BoxConstraints`; wrap forms and text blocks in a `ConstrainedBox(constraints: BoxConstraints(maxWidth: ...))` inside a `Center` (paragraph width: [RESPONSIVE-UNITS.md](RESPONSIVE-UNITS.md#the-parallel-list)).

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

- **Unknown or large item counts:** "Always use `ListView.builder` or `GridView.builder`". See [PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/PERFORMANCE.md#lists-and-grids).
- **Android tier 3 requires mouse and stylus input.**

## Orientation

- **Do not lock the orientation.** "The Material Guidelines encourage you to never _portrait lock_ your app". Locked screens can be an accessibility issue. "Android large format tiers require both portrait and landscape support" (at the lowest tier). Android can override a locked screen. Apple says aim to support both orientations.
- **Foldables:** a portrait lock with `setPreferredOrientations` puts Android into portrait compatibility mode, which letterboxes the app (centered with black borders), and `MediaQuery` never sees the larger window.
- **If business rules truly require a lock,** read the physical screen from the `Display` API (`View.maybeOf(context)?.display`) instead of `MediaQuery`. Set the lock in `main()` after `WidgetsFlutterBinding.ensureInitialized()` and before `runApp()` ([ApparenceKit](https://apparencekit.dev/flutter-tips/flutter-force-portrait-mode/)). That article presents the lock as a general choice, which the rule above contradicts, and states no version; the Android 17 rule below limits it ([flutter-ux DEVICE-FEATURES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/DEVICE-FEATURES.md#portrait-lock)).
- **Android 17:** for apps targeting Android 17+, orientation, resizability and aspect-ratio restrictions do not apply on displays of 600dp or more, and `SystemChrome.setPreferredOrientations` is ignored there (details in [VERSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/VERSIONS.md)).
- **Do not switch layouts on orientation** with `MediaQuery.orientationOf` or `OrientationBuilder` near the top of the tree. "Device orientation does not accurately reflect the available app window space." Use `sizeOf` or `LayoutBuilder` with the Material breakpoints.

## SafeArea and MediaQuery

- **`SafeArea` insets for notches, cutouts, the status bar and rounded corners.** All four sides are on by default. `SafeArea(minimum: ...)` with `MediaQuery.of(context).viewInsets.bottom` ("zero when the keyboard is hidden and non-zero when it's visible") also clears the software keyboard ([ApparenceKit](https://apparencekit.dev/blog/bottom-sheet-flutter-keyboard-fix/), [flutter-ux KEYBOARD-AND-FOCUS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/KEYBOARD-AND-FOCUS.md#forms-in-a-bottom-sheet)).
- **Wrap the `Scaffold` body, not the `Scaffold`.** The `AppBar` already goes under the status bar. For full-bleed media that goes behind the app bar, ApparenceKit's fullscreen video uses `Scaffold(extendBodyBehindAppBar: true)` ([ApparenceKit](https://apparencekit.dev/flutter-tips/play-video-fullscreen-flutter-aspect-ratio/)).
- **A community view on scrollable bodies** ([FlutterPro](https://flutterpro.design/details/safe-area-replacement)): "Don't use SafeArea with scrollable widgets"; it "shrinks the viewport", so list items get cut off. Pad the bottom inside the scroll view from `MediaQuery.viewPaddingOf(context).bottom` instead. The Flutter docs above give `SafeArea` around the body with no scrollable exception; both are kept ([flutter-ux SCROLLING-AND-LAYOUT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/SCROLLING-AND-LAYOUT.md#bottom-padding-instead-of-safearea)).
- **Nested `SafeArea`s apply padding once.** Only the topmost applies it, because it rewrites the `MediaQuery` for its children. Reading `MediaQueryData.padding` directly does not behave this way.
- **`MediaQuery` also exposes** high contrast, text scaling, whether TalkBack or VoiceOver is on, and hinge or fold information (`displayFeaturesOf`, Android only; a hinge or cutout obstructs the display, a fold does not: [RESPONSIVE-UNITS.md](RESPONSIVE-UNITS.md#enhancement-not-the-base)).

## Input and state

- **Support mice, trackpads and keyboard shortcuts.** Keep common flows keyboard-navigable and size touch targets appropriately (see [ACCESSIBILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ACCESSIBILITY.md)). The widgets: `Shortcuts` maps key combinations to actions, `Actions` lets children trigger actions defined higher up (and works without `Shortcuts`), an `Intent` is the intention and an `Action` holds the logic ([ApparenceKit](https://apparencekit.dev/flutter-tips/handle-keyboard-shortcuts/)).
- **Keep state across rotate, resize and fold or unfold.** Restore list scroll position across rotation with `PageStorageKey`. Some native extensions lose state. For hand-rolled page switching (not go_router's `StatefulShellRoute.indexedStack`, which keeps it already), hold one `PageStorageBucket` in a field, wrap the swapped area in `PageStorage(bucket: _bucket, ...)` and give each widget a unique `PageStorageKey` ([ApparenceKit](https://apparencekit.dev/flutter-tips/preserve-page-scroll-position/), code in [flutter-ux NAVIGATION-AND-SHEETS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/NAVIGATION-AND-SHEETS.md#keep-scroll-position-across-tabs)).

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

- **`defaultTargetPlatform` for features, not layout.** ApparenceKit's `PlatformUtils` (`isDesktop` / `isMobile` from `defaultTargetPlatform`, `isWeb` from `kIsWeb`, all in `package:flutter/foundation.dart`) is offered for "a different layout for desktop or a feature only for mobile" ([ApparenceKit](https://apparencekit.dev/flutter-tips/detect-flutter-running-platform/)); the rule above rules out the layout use, while feature and policy checks fit. Its exported code (`static bool isDesktop =>` without `get`) does not compile ([flutter-ux DEVICE-FEATURES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/DEVICE-FEATURES.md#detect-the-platform)).

### Context-aware layouts (optional)

Community practice from one Flutter Community post (Rudraksh Shukla, "The Death of the Static UI"), whose author calls its code "illustrative and simplified". In a context-aware screen "the interface has conditional branches, and an on-device model decides which branch to render", fed by sensors, system state and usage history. The reactive plumbing stays the same (`StreamBuilder`, `ValueListenableBuilder`, Riverpod, Bloc pointed at a stream of context).

- **Write the branches as if/then rules:** moving (accelerometer, gyroscope): enlarge touch targets and simplify the layout; bright light outdoors: boost contrast; night: dark mode; usage history: "promote the three features this user actually touches, demote the ones they never open"; dying battery or weak connection: "drop to a minimalist, low-power layout".
- **Branch whole layouts on the predicted intent,** as in [Branch at a breakpoint](#branch-at-a-breakpoint): one shared list of actions, a large primary-action card for a user in a hurry, a denser discovery grid for browsing. Give each branch root a `Key` so a test can find it ([TESTING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/TESTING.md#widget-tests)).
- **Keep a stability budget:** "users build spatial memory, and moving the button they reach for by reflex is a bug, not a feature. Adapt at sensible boundaries (app launch, a clear context change), not continuously."
- **Let users see and reset adaptation:** give them "a visible, easy way to see and reset how the app has adapted to them".
- **Make accessibility an explicit adaptation rule,** "rather than hoping it falls out": the post calls real-time touch-target enlargement and automatic WCAG-compliant contrast natural fits for adaptive systems. Values: [ACCESSIBILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ACCESSIBILITY.md#design-values).
- **Design review approves rules and bounds,** not one comp: "designers specify how far the UI is allowed to move, not one frozen state."
- **Signal and model packages** named in the post: [PLATFORM-INTEGRATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/PLATFORM-INTEGRATION.md#pick-the-mechanism). Battery cost: [PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/PERFORMANCE.md#isolates).

## Platform adaptations

- **Automatic, no code needed:**
  - Page transitions: the platform-adaptations page says Android push uses `ZoomPageTransitionsBuilder`, while the 3.38 breaking change makes `PredictiveBackPageTransitionsBuilder` the Android default (see [VERSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/VERSIONS.md)); confirm in the current docs. iOS push is a slide with parallax, and `PageRoute.fullscreenDialog` gives a bottom-up modal. A community view: no page transition at all on web and desktop, set once in `ThemeData.pageTransitionsTheme` with a zero-duration builder ([FlutterPro](https://flutterpro.design/details/web-page-transitions)); its map names `ZoomPageTransitionsBuilder` for Android, which on 3.38+ pins the old transition, and its `kIsWeb` branch gives mobile browsers no transition either, though the text says native ones ([flutter-ux NAVIGATION-AND-SHEETS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/NAVIGATION-AND-SHEETS.md#page-transitions)).
  - Back: the Android back button pops the top route; the iOS edge swipe pops.
  - Scroll physics, overscroll, momentum stacking (iOS) and status-bar tap to scroll to top (iOS). The status-bar tap is automatic "when you use `Scaffold` and `CupertinoPageScaffold`"; "If you have a custom `ScrollController`, you must wrap the `Scaffold` (or `CupertinoPageScaffold`) with a `PrimaryScrollController` and provide that controller down the widget tree" ([FlutterPro](https://flutterpro.design/details/statusbar-tap-scroll), code in [flutter-ux SCROLLING-AND-LAYOUT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/SCROLLING-AND-LAYOUT.md#status-bar-tap-to-scroll-to-top)). Tab reselect is the other scroll-to-top convention, and it is not automatic ([ROUTING-AND-DEEP-LINKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ROUTING-AND-DEEP-LINKS.md#shell-routes-and-tabs)).
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

- **`RefreshIndicator.adaptive`** can wrap a `CustomScrollView` directly; "Flutter will automatically display the refresh indicator when the user pulls down the list" ([ApparenceKit](https://apparencekit.dev/blog/flutter-pagination-riverpod/)). `onRefresh` is a `RefreshCallback` (`Future<void> Function()`) whose "returned [Future] must complete when the refresh operation is finished" (https://github.com/flutter/flutter/blob/master/packages/flutter/lib/src/material/refresh_indicator.dart); the article's `onRefresh` body returns nothing, so return the refresh work's `Future`.
- **Date pickers have no row above.** FlutterPro branches by hand: `CupertinoDatePicker` (scroll wheel) on iOS, `showDatePicker` on Android, keeping the Material picker on Android even in a custom design ([FlutterPro](https://flutterpro.design/details/adaptive-date-picker), code in [flutter-ux NAVIGATION-AND-SHEETS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/NAVIGATION-AND-SHEETS.md#date-picker-that-matches-the-platform)).
- **Bottom navigation per platform:** `NavigationBar` on Android, `CupertinoTabBar` on iOS.
- **Platform idioms:** matching them reduces cognitive load and builds trust ("better app store ratings"). Assign a platform advocate per platform. Examples: `Scrollbar(thumbVisibility: DeviceType.isDesktop, ...)`, `SelectableText` / `SelectableText.rich` on web, tooltips after 200 to 400 ms of hover.
  - Scrollbars: "Flutter automatically adds a scrollbar to most vertically scrollable widgets on desktop platforms (including web when opened via a desktop browser)"; on mobile it is your job, and one added by hand on desktop "clashes with the automatic desktop scrollbar on the same page, and both stop working right" ([FlutterPro](https://flutterpro.design/details/scrollbars)). A community view: FlutterPro adds scrollbars on mobile too, by hand where needed or app-wide through `MaterialApp.scrollBehavior` ([flutter-ux SCROLLING-AND-LAYOUT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/SCROLLING-AND-LAYOUT.md#scrollbars)).
  - Selection: "By default, text in Flutter apps isn't selectable." Use `SelectionArea` "if you need to enable selection on multiple text widgets or other selectable widgets within a specific area" (placed high, around the `Scaffold` or `MaterialApp`), and `SelectableText` for a single `Text` ([ApparenceKit](https://apparencekit.dev/flutter-tips/make-text-selectable-in-flutter/), [flutter-ui WIDGET-PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/WIDGET-PATTERNS.md#selectable-text)).

## Material and Cupertino as packages

- **Material and Cupertino are moving out of the SDK** into the `material_ui` and `cupertino_ui` packages. Current docs samples import `package:material_ui/material_ui.dart`, while the official agent skills' samples in this file still import `package:flutter/material.dart`.
- **`flutter create` does not yet default to them.** Migrate with `dart fix --apply --code=migrate_design_widgets`.
- **Timeline and package requirements** (frozen in 3.44, 1.0 packages in 3.47, in-SDK deprecation planned for the November stable release, go_router 18.0.0 already migrated) are in [VERSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/VERSIONS.md).

## Fix layout errors

| Error text | Cause | Fix |
| --- | --- | --- |
| "Vertical viewport was given unbounded height" | A scrollable (`ListView`, `GridView`) inside an unconstrained vertical parent (`Column`) | Wrap the scrollable in `Expanded`, or in a `SizedBox` with an absolute height |
| "An InputDecorator...cannot have an unbounded width" | A `TextField` or `TextFormField` inside an unconstrained horizontal parent (`Row`) | Wrap it in `Expanded` or `Flexible` |
| "RenderFlex overflowed" (yellow and black stripes) | A child of a `Row` or `Column` asks for more than the constraints allow | Wrap the child in `Expanded` (forces it to fit) or `Flexible` (lets it be smaller than the allocated space) |
| "Incorrect use of ParentData widget" | A `ParentDataWidget` that is not a direct child of its required ancestor (`Expanded` outside a `Flex`, `Positioned` outside a `Stack`) | Make `Expanded`/`Flexible` direct children of `Row`/`Column`/`Flex`, and `Positioned` a direct child of `Stack` |
| "RenderBox was not laid out" | A cascading side effect | Ignore it and look further up the stack trace for the primary violation, usually unbounded height or width |

- **Workflow:** run in debug mode to capture the exception, find the primary error, apply the fix from the table, hot reload, then confirm the red or grey error screen or the stripes are gone. Repeat if new errors appear. "Flutter shows a red screen (debug mode) or a grey screen (production mode) by default when there's a rendering error" ([ApparenceKit](https://apparencekit.dev/flutter-tips/create-custom-flutter-error-screen/)); replacing it with `ErrorWidget.builder` is in [flutter-ux APP-LIFECYCLE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/APP-LIFECYCLE.md#replace-the-default-error-view).
- **Why the ParentData error happens:** each `ParentDataWidget` declares `debugTypicalAncestorWidgetClass`, which this error names, and writes one parent data type (`Positioned` to `StackParentData`, `Expanded` and `Flexible` to `FlexParentData`, `LayoutId` to `MultiChildLayoutParentData`) ([renderobjects](https://renderobjects.com/guides/children/parent-data/), [flutter-render-objects PARENT-DATA.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-render-objects/PARENT-DATA.md)).
- **A list nested in another scrollable:** "Using `shrinkWrap: true` on your `ListView` is a good practice if this list is nested inside another scrollable view" ([ApparenceKit](https://apparencekit.dev/flutter-tips/how-to-create-checkbox-list-using-checkboxlisttile-flutter/)). The table's fix for a list in a plain `Column` stays `Expanded` or a fixed-height `SizedBox`.

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

Preview annotations, the web-runtime limits, IDE/CLI launch and examples are in [AGENT-TOOLING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/AGENT-TOOLING.md#widget-previews).

## Prove it

- **No device-type or orientation branching:** search the code for `OrientationBuilder`, `MediaQuery.orientationOf`, `Platform.isAndroid` / `Platform.isIOS` used for layout, and phone or tablet checks. Each layout branch reads `MediaQuery.sizeOf` or `LayoutBuilder` constraints.
- **No `MediaQuery.of(context).size`:** window size comes from `MediaQuery.sizeOf(context)`.
- **Resize test:** run the app in a resizable window and drag it across 600 logical pixels. The navigation switches between bottom bar and rail, no yellow and black overflow stripes appear, and wide screens show a capped content width or a grid.
- **Orientation:** no `setPreferredOrientations` portrait lock, unless business rules require it and the code reads `View.maybeOf(context)?.display`.
- **Rotation keeps state:** rotate with a scrolled list; the position survives (`PageStorageKey`).
- **Status-bar tap (iOS):** on every screen with a custom `ScrollController`, tapping the status bar scrolls to the top (the `Scaffold` sits under a `PrimaryScrollController` with that controller).
- **Window listeners clean up:** every `WidgetsBinding.instance.addObserver(this)` has a matching `removeObserver(this)` in `dispose`.
- **Layout errors:** a debug run shows no red or grey error screen; for each exception, the fix matches the table above, and "RenderBox was not laid out" was traced to its primary violation.
