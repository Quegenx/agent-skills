# Scrolling and layout

Polish for scrolling screens in Flutter: bottom breathing room instead of `SafeArea` on scroll views, edge-to-edge horizontal lists, status-bar tap to top, scrollbars, keeping a selected tab in view, edge fades with `ShaderMask`, a text-scale cap, and `GestureDetector` hit areas. Source: FlutterPro tips by Kamran Bekirov (flutterpro.design), third-party community advice, not Flutter team docs. Where a tip differs from the official-docs [flutter](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/SKILL.md) skill, both sides are stated and tagged. Image loading and fonts are in [IMAGES-AND-TYPOGRAPHY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/IMAGES-AND-TYPOGRAPHY.md).

**Contents:** [Version notes](#version-notes) · [Bottom padding instead of SafeArea](#bottom-padding-instead-of-safearea) · [Horizontal lists inside padded pages](#horizontal-lists-inside-padded-pages) · [Status-bar tap to scroll to top](#status-bar-tap-to-scroll-to-top) · [Scrollbars](#scrollbars) · [Keep the selected tab in view](#keep-the-selected-tab-in-view) · [Edge fades with ShaderMask](#edge-fades-with-shadermask) · [Progressive fade under the status bar](#progressive-fade-under-the-status-bar) · [Text scale cap](#text-scale-cap) · [GestureDetector hit area](#gesturedetector-hit-area) · [Prove it](#prove-it)

## Version notes

- The articles state no Flutter or Dart version. Several samples use dot shorthands (`.symmetric(horizontal: 24)`, `.only(...)`, `.all(24)`, `.topCenter`, `.dstIn`, `.vertical`), which need Dart language version 3.10+ ([dart LANGUAGE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/dart/LANGUAGE.md)); `separatorBuilder: (_, _) => ...` needs wildcard variables, 3.7+. The others use full names. [FlutterPro](https://flutterpro.design/details/safe-area-replacement)
- The samples import `package:flutter/material.dart`; `MaterialScrollBehavior`, `Scrollbar`, `Colors` and `MaterialApp` would move with Material to its own package ([flutter-ui LAYOUT-AND-RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md#material-and-cupertino-as-packages)). Check at copy time.
- `textScaler` with `TextScaler.clamp(maxScaleFactor:)` is the current API; `MediaQueryData.textScaleFactor` is deprecated ("Use textScaler instead", deprecated after v3.12.0-2.0.pre). [api.flutter.dev](https://api.flutter.dev/flutter/widgets/MediaQueryData/textScaleFactor.html)

## Bottom padding instead of SafeArea

[FlutterPro](https://flutterpro.design/details/safe-area-replacement): "Don't use SafeArea with scrollable widgets." Wrapping a scrollable in `SafeArea` "just told the list 'Hey, don't render your items after this line, OK?!' So, category items get cut off." "`SafeArea` shrinks the viewport. `BottomPadding` adds breathing room."

**Two views (style choice, pick per screen):**

- **[Flutter docs, via flutter skill]:** `SafeArea` insets for notches, cutouts, the status bar and rounded corners, all four sides on by default; wrap the `Scaffold` body, not the `Scaffold` ([flutter-ui LAYOUT-AND-RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md#safearea-and-mediaquery)). It gives no caveat for scrollable bodies.
- **[FlutterPro]:** for a scrollable body, skip `SafeArea` and add bottom padding inside the scroll view, sized to the bottom system bar, so content scrolls under it and still ends clear of it.

The goal: breathing room "only at the bottom", sized to the bottom system bar, with a minimum when there is none. It reads `MediaQuery.viewPaddingOf(context).bottom` (view padding, not `padding`). [FlutterPro](https://flutterpro.design/details/safe-area-replacement)

```dart
import 'package:flutter/widgets.dart';
  
class BottomPadding extends StatelessWidget {
  const BottomPadding({super.key});
  
  static double of(
    BuildContext context, {
    double minimum = 16,
  }) {
    // Get size of the bottom system bar
    final double viewPadding = MediaQuery.viewPaddingOf(context).bottom;
  
    // Use the system bar size if it's bigger than the minimum,
    // otherwise fall back to the minimum.
    final double height = viewPadding > minimum ? viewPadding : minimum;
  
    return height;
  }
  
  @override
  Widget build(BuildContext context) {
    final double height = of(context);
  
    // Return a box of that height.
    return SizedBox(height: height);
  }
}
```

Use it as the last child of the scroll view's `Column`: it gives breathing space on devices with a bottom system bar, and "if there isn't one, it just adds a 16px box, so content still doesn't hit the bottom edge". [FlutterPro](https://flutterpro.design/details/safe-area-replacement)

```dart
return Scrollbar(
    child: SingleChildScrollView(
        padding: .symmetric(horizontal: 24),
        child: Column(
            children: <Widget>[
                SizedBox(height: 16),
                CategoriesList(),
                SizedBox(height: 24),
                Button(
                    label: 'new.',
                    onPressed: () {},
                ),
                const BottomPadding(),
            ],
        ),
    ),
);
```

Or as list padding:

```dart
ListView(
    padding: .only(
        bottom: BottomPadding.of(context),
    ),
),
```

Why not a fixed `padding: .all(24)`: "the bottom system bar isn't always 24px. `BottomPadding` calculates it dynamically." Combined form: [FlutterPro](https://flutterpro.design/details/safe-area-replacement)

```dart
return Scrollbar(
    child: SingleChildScrollView(
        padding: .all(24).copyWith(
            bottom: BottomPadding.of(context, minimum: 24),
        ),
    ),
);
```

These samples pad the page's `SingleChildScrollView` horizontally by 24, which is consistent with the next section only when the page holds no horizontal list.

## Horizontal lists inside padded pages

[FlutterPro](https://flutterpro.design/details/horizontal-list-padding): horizontal padding on a page's scrollable clips horizontal lists inside it. The pitfall:

```dart
SingleChildScrollView(
  padding: const EdgeInsets.symmetric(horizontal: 24),
  child: Column(
    children: [
      ...
      NewArrivalProducts(),
      ...
    ],
  ),
),
```

Fix: drop the padding from the page, give each child its own; the horizontal list sets its own `padding`:

```dart
SizedBox(
  height: 318,
  child: ListView.separated(
    itemCount: products.length,
    scrollDirection: Axis.horizontal,
    padding: const EdgeInsets.symmetric(horizontal: 16),
    itemBuilder: (_, int index) => ProductItem(product: products[index]),
    separatorBuilder: (_, _) => const SizedBox(width: 8),
  ),
),
```

The rule: "horizontally scrollable widgets should reach the edges. Keep the page's scrollable widget edge to edge (no padding), and give each child its own horizontal padding." [FlutterPro](https://flutterpro.design/details/horizontal-list-padding)

## Status-bar tap to scroll to top

[FlutterPro](https://flutterpro.design/details/statusbar-tap-scroll): Flutter handles tapping the status bar to scroll to top automatically "when you use `Scaffold` and `CupertinoPageScaffold`" (the flutter skill lists it under automatic platform adaptations, [flutter-ui LAYOUT-AND-RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md#platform-adaptations)). The catch: "If you have a custom `ScrollController`, you must wrap the `Scaffold` (or `CupertinoPageScaffold`) with a `PrimaryScrollController` and provide that controller down the widget tree".

```dart
PrimaryScrollController(
    controller: _scrollController, // pass here
    child: Scaffold(
        appBar: const MyAppBar(),
        body: NestedScrollView(
            controller: _scrollController, // also pass to the scrollable
            headerSliverBuilder: (context, innerScrolled) {
                return [
                    ...
                ];
            },
            body: ...
        ),
    ),
);
```

## Scrollbars

[FlutterPro](https://flutterpro.design/details/scrollbars): "Flutter automatically adds a scrollbar to most vertically scrollable widgets on desktop platforms (including web when opened via a desktop browser)." On mobile it is your job, and "if you add one manually, it clashes with the automatic desktop scrollbar on the same page, and both stop working right."

**Manual approach** ("Best when you only need scrollbars in a few places"): `MagicalScrollbar` adds `Scrollbar` only on Android and iOS via `defaultTargetPlatform`. [FlutterPro](https://flutterpro.design/details/scrollbars)

```dart
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
  
class MagicalScrollbar extends StatelessWidget {
  final Widget child;
  final ScrollController? controller;
  
  const MagicalScrollbar({
    super.key,
    required this.child,
    this.controller,
  });
  
  @override
  Widget build(BuildContext context) {
    final bool isMobile = [TargetPlatform.android, TargetPlatform.iOS]
        .contains(defaultTargetPlatform);
  
    if (isMobile) {
      return Scrollbar(
        controller: controller,
        child: child,
      );
    } else {
      return child;
    }
  }
}
```

With its own controller, pass it to both:

```dart
MagicalScrollbar(
    controller: controller,
    child: ListView.builder(
        controller: controller,
        ...
    ),
),
```

The flutter skill says to avoid `Platform.isAndroid` and similar checks for layout decisions ([flutter-ui LAYOUT-AND-RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md#capabilities-and-policies)). `MagicalScrollbar` branches on `defaultTargetPlatform` to decide whether a scrollbar appears, not to size the layout.

**Automatic approach** ("Best when you want scrollbars app-wide"): override `MaterialApp.scrollBehavior`. [FlutterPro](https://flutterpro.design/details/scrollbars)

```dart
class AlwaysScrollbarBehavior extends MaterialScrollBehavior {
  const AlwaysScrollbarBehavior();
  
  @override
  Widget buildScrollbar(context, child, details) {
    return Scrollbar(
      controller: details.controller,
      child: child,
    );
  }
}
```

```dart
MaterialApp(
    ...
    scrollBehavior: const AlwaysScrollbarBehavior(),
    ...
);
```

Exemptions: "single-line `EditableText`, `PageView`, `ListWheelScrollView`, `NestedScrollView`, and `DropdownButton` stay scrollbar-free even with an app-wide override, because each overrides the inherited behavior locally to drop the scrollbar, since one would misrepresent how you actually interact with them." [FlutterPro](https://flutterpro.design/details/scrollbars)

## Keep the selected tab in view

[FlutterPro](https://flutterpro.design/details/tab-visibility): Material `TabBar` auto-scrolls a tapped tab into view; a custom tab strip must call `Scrollable.ensureVisible`.

- Give each tab a `GlobalKey`; on select pass its context; `alignment: 0.5` centers it.
- Wait one frame (`addPostFrameCallback`) in `initState`, because the tabs are not laid out yet; scroll again in `didUpdateWidget` when `selected` changes.
- Values in the sample: duration 200 ms, `Curves.easeInOut`, strip height 44, horizontal padding 16, tab gap 8, radius 22.
- **P2 sample limitation:** the source creates `_keys` once from the initial `labels.length`; its `didUpdateWidget` handles selection changes only. Use this sample only with a stable label count and a valid selected index. Configuration changes reach [State.didUpdateWidget](https://api.flutter.dev/flutter/widgets/State/didUpdateWidget.html); the article supplies no key-list update for a changing tab count. [FlutterPro](https://flutterpro.design/details/tab-visibility)

```dart
import 'package:flutter/material.dart';
  
class FilterTabs extends StatefulWidget {
  final List<String> labels;
  final int selected;
  final ValueChanged<int> onSelected;
  
  const FilterTabs({
    super.key,
    required this.labels,
    required this.selected,
    required this.onSelected,
  });
  
  @override
  State<FilterTabs> createState() => _FilterTabsState();
}
  
class _FilterTabsState extends State<FilterTabs> {
  // One key per tab, so we can later find and scroll to any of them.
  late final List<GlobalKey> _keys = List.generate(
    widget.labels.length,
    (_) {
      return GlobalKey();
    },
  );
  
  @override
  void initState() {
    super.initState();
  
    // Tabs aren't laid out yet, so wait one frame, then scroll to the
    // tab that's selected when the strip first appears.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _scrollTo(widget.selected);
    });
  }
  
  void _scrollTo(int index) {
    final BuildContext? context = _keys[index].currentContext;
    if (context == null) return;
  
    // Bring the tapped tab fully into view, centered.
    Scrollable.ensureVisible(
      context,
      alignment: 0.5,
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeInOut,
    );
  }
  
  @override
  void didUpdateWidget(FilterTabs oldWidget) {
    super.didUpdateWidget(oldWidget);
  
    // If the selection changed (from a tap or from the parent), scroll to it.
    if (oldWidget.selected != widget.selected) {
      _scrollTo(widget.selected);
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 44,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: widget.labels.length,
        itemBuilder: (context, i) {
          final String label = widget.labels[i];
          final bool selected = i == widget.selected;
  
          return _Tab(
            // Attach this tab's key so we can scroll to it.
            key: _keys[i],
            label: label,
            selected: selected,
            onTap: () {
              widget.onSelected(i);
            },
          );
        },
      ),
    );
  }
} 
  
class _Tab extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  
  const _Tab({
    super.key,
    required this.label,
    required this.selected,
    required this.onTap,
  });
  
  @override
  Widget build(BuildContext context) {
    final Color background = selected ? Colors.black : Colors.black12;
    final Color foreground = selected ? Colors.white : Colors.black;
  
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.translucent,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: background,
            borderRadius: BorderRadius.circular(22),
          ),
          child: Text(
            label,
            style: TextStyle(color: foreground),
          ),
        ),
      ),
    );
  }
}
```

- `ListView.builder` builds lazily, so a far-off tab's `currentContext` can be null, and the code just returns (`if (context == null) return;`). The source says no more about it.
- This sample uses `HitTestBehavior.translucent`, while the same author's hit-area tip says "Make `opaque` your default" ([GestureDetector hit area](#gesturedetector-hit-area)).

## Edge fades with ShaderMask

[FlutterPro](https://flutterpro.design/details/shader-mask): "Long lists aren't obviously scrollable." Fading the edges "signals that it scrolls". `ShaderMask` with `BlendMode.dstIn`, no package.

```dart
ShaderMask(
  shaderCallback: (Rect bounds) {
    return const LinearGradient(
      begin: .topCenter,
      end: .bottomCenter,
      colors: [
        Colors.transparent,
        Colors.white,
        Colors.white,
        Colors.transparent,
      ],
      stops: [0.0, 0.12, 0.88, 1.0],
    ).createShader(bounds);
  },
  blendMode: .dstIn,
  child: // your scrollable widget
)
```

Stops: `[0.0, 0.1, 0.9, 1.0]` is subtle, `[0.0, 0.3, 0.7, 1.0]` aggressive. "Fading only the bottom edge usually works best. If they've scrolled down, they already know there's a top, they only need a hint that there's more below." [FlutterPro](https://flutterpro.design/details/shader-mask)

Bottom only:

```dart
colors: [
  Colors.white,
  Colors.white,
  Colors.white,
  Colors.transparent,
],
stops: [0.0, 0.0, 0.88, 1.0],
```

Top only:

```dart
colors: [
  Colors.transparent,
  Colors.white,
  Colors.white,
  Colors.white,
],
stops: [0.0, 0.12, 1.0, 1.0],
```

Horizontal lists:

```dart
begin: .centerLeft,
end: .centerRight,
```

A reusable `Edgy` widget: [FlutterPro](https://flutterpro.design/details/shader-mask)

```dart
class Edgy extends StatelessWidget {
  final Widget child;
  final Axis axis;
  final bool fadeStart;
  final bool fadeEnd;
  
  const Edgy({
    super.key,
    required this.child,
    this.axis = .vertical,
    this.fadeStart = true,
    this.fadeEnd = true,
  });
  
  @override
  Widget build(BuildContext context) {
    final bool isVertical = axis == .vertical;
  
    return ShaderMask(
      shaderCallback: (Rect bounds) {
        return LinearGradient(
          begin: isVertical ? .topCenter : .centerLeft,
          end: isVertical ? .bottomCenter : .centerRight,
          colors: <Color>[
            fadeStart ? const Color(0x00FFFFFF) : const Color(0xFFFFFFFF),
            const Color(0xFFFFFFFF),
            const Color(0xFFFFFFFF),
            fadeEnd ? const Color(0x00FFFFFF) : const Color(0xFFFFFFFF),
          ],
          stops: <double>[0.0, 0.12, 0.88, 1.0],
        ).createShader(bounds);
      },
      blendMode: .dstIn,
      child: child,
    );
  }
}
```

"The mask is alpha-only, so this works the same in light and dark mode." [FlutterPro](https://flutterpro.design/details/shader-mask)

**Cost, two views:**

- **[FlutterPro]:** both fade tips present `ShaderMask` as free ("no extra package") and say to wrap the scrollable or the page body; they say nothing about rendering cost.
- **[Flutter docs, via flutter skill]:** "`saveLayer()` is expensive", and `ShaderMask` is listed among the widgets that might trigger it; debug with `checkerboardOffscreenLayers` ([flutter PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/PERFORMANCE.md#paint-cost-savelayer-opacity-clips)).

## Progressive fade under the status bar

[FlutterPro](https://flutterpro.design/details/progressive-fade): on pages with no `AppBar` the body runs behind the status bar, and content collides with the clock and battery (the flutter skill's "The `AppBar` already goes under the status bar" covers only pages that have one). A progressive top fade dissolves content under the status bar. `height` (default 120 logical px) is how far down the fade reaches; the stops are fractions of the screen height.

```dart
class ProgressiveFade extends StatelessWidget {
  final Widget child;
  final double height;
  
  const ProgressiveFade({
    super.key,
    required this.child,
    this.height = 120,
  });
  
  @override
  Widget build(BuildContext context) {
    final double end = height / MediaQuery.of(context).size.height;
  
    return ShaderMask(
      shaderCallback: (Rect bounds) {
        return LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: const [
            Color(0x00FFFFFF),
            Color(0x26FFFFFF),
            Color(0x66FFFFFF),
            Color(0xB3FFFFFF),
            Color(0xFFFFFFFF),
          ],
          stops: [
            0.0,
            end * 0.25,
            end * 0.5,
            end * 0.75,
            end,
          ],
        ).createShader(bounds);
      },
      blendMode: BlendMode.dstIn,
      child: child,
    );
  }
}
```

```dart
Scaffold(
  body: ProgressiveFade(
    child: ListView(
      children: [
        // ...your content...
      ],
    ),
  ),
)
```

- "The several stops are what make it progressive. A two-color gradient gives a hard linear fade. The extra steps ease the content out gradually, so the top edge feels soft instead of cut." [FlutterPro](https://flutterpro.design/details/progressive-fade)
- "The mask is alpha-only, so this works the same in light and dark mode." [FlutterPro](https://flutterpro.design/details/progressive-fade)
- The sample reads `MediaQuery.of(context).size`; the flutter skill measures the window with `MediaQuery.sizeOf(context)` ([flutter-ui LAYOUT-AND-RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md#measure-the-window)). The verbatim block is kept; `MediaQuery.sizeOf(context).height` is the skill's form.
- The `saveLayer` cost note above applies here too.

## Text scale cap

**Two views (opinion, decide per app):**

- **[Flutter docs, via flutter skill]:** Flutter text widgets respect the OS font-size setting; "Make sure your layout has enough room to render all its contents when the font sizes are increased." Test on a small-screen device at the largest font ([flutter ACCESSIBILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ACCESSIBILITY.md#design-values)). The flutter skill states no cap.
- **[FlutterPro](https://flutterpro.design/details/text-scale-factor):** override `MediaQuery.textScaler` and clamp to 1.1: "don't ignore user's preference completely, just it limit to x1.1 at max". "Most apps can handle x1.1 scaling without layout breaks. It's not a magical number. So test for your app and either adapt to it, or limit to x1.0 **only** if you have to." The article shows overflow at x1.8 against x1.0.
- **Owner's rule (wins over the cap):** never lock or cap text scaling app-wide, at x1.0, x1.1 or any value. When a row breaks at large text, change the structure (`Row` to `Column`), don't shrink the font; `MediaQuery.withClampedTextScaling` belongs only around one region that truly can't grow ([flutter ACCESSIBILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ACCESSIBILITY.md#design-values), [flutter-ui RESPONSIVE-UNITS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/RESPONSIVE-UNITS.md#enhancement-not-the-base)).

```dart
MaterialApp(
    ...
    builder: (context, child) {
        final MediaQueryData mediaQueryData = MediaQuery.of(context);
  
        return MediaQuery(
            data: mediaQueryData.copyWith(
                textScaler: mediaQueryData.textScaler.clamp(
                    maxScaleFactor: 1.1,
                ),
            ),
            child: child!,
        );
    },
    ...
);
```

## GestureDetector hit area

[FlutterPro](https://flutterpro.design/details/gesture-detector-hit-area): use `GestureDetector` instead of `InkWell` for a tappable widget without the Material splash. By default it "only takes taps on its child": for a `Row` with an icon and text, the padding and gaps do nothing. The one-line fix:

```dart
GestureDetector(
  behavior: HitTestBehavior.opaque,
  onTap: () {},
  child: ...,
)
```

`behavior` options: [FlutterPro](https://flutterpro.design/details/gesture-detector-hit-area)

- **deferToChild** (default): only the child takes taps. "A `Container` takes taps on its whole box only if it has a color."
- **opaque:** the whole box is tappable; widgets behind do not get the tap.
- **translucent:** permits hit-test targets behind it to participate; that does not make competing tap recognizers both win. In the documented parent/child case both enter the gesture arena and only one `onTap` wins, whether the behavior is `opaque` or `translucent`. [GestureDetector](https://api.flutter.dev/flutter/widgets/GestureDetector-class.html)
- **P2 correction:** FlutterPro says "Two overlapping detectors can both fire" and recommends `translucent` when both should respond. Its hit-test setting does not guarantee both tap callbacks; keep the author's preference for `opaque` separate from gesture-arena resolution. [FlutterPro](https://flutterpro.design/details/gesture-detector-hit-area), [GestureDetector](https://api.flutter.dev/flutter/widgets/GestureDetector-class.html)

Tap-target sizes (48x48, 44x44) are in [flutter ACCESSIBILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ACCESSIBILITY.md#design-values). The sample's `onTap: () {}` is a placeholder.

## Prove it

- **Scroll bodies:** no scrollable is wrapped in `SafeArea` where its items get cut off at the bottom inset, or the team chose `SafeArea` knowingly; scrolled to the end, the last item clears the bottom system bar (or sits 16 px off the edge without one).
- **Horizontal lists:** on a page with a horizontal list, the page scroll view has no horizontal padding and the list scrolls to the screen edges.
- **Status bar:** with a custom `ScrollController`, tapping the iOS status bar scrolls to top (a `PrimaryScrollController` wraps the `Scaffold`).
- **Scrollbars:** on desktop or desktop web, each list shows one working scrollbar, not two; on mobile, long lists that need one have it.
- **Tabs:** selecting a tab off screen in a custom strip scrolls it to center, including the initial selection.
- **Fades:** edge fades look the same in light and dark mode; `checkerboardOffscreenLayers` shows whether a fade adds an offscreen layer.
- **Text scale:** at the largest OS font size, no overflow stripes appear and no app-wide cap suppresses the user's setting; apply the owner's structural-layout rule and its narrowly scoped region exception ([Text scale cap](#text-scale-cap)). The old check accepted the FlutterPro x1.1 app-wide cap.
- **Hit areas:** tapping the padding or gap of a custom `GestureDetector` row triggers it; competing parent/child `onTap` callbacks follow gesture-arena resolution rather than assuming `translucent` makes both fire. [GestureDetector](https://api.flutter.dev/flutter/widgets/GestureDetector-class.html)
