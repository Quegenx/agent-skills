# CSS units in Flutter

The repo owner's rules for sizing Flutter UI when you think in CSS units. Owner's rule: "There is a system. There are no CSS units; there are constraints + Theme + MediaQuery." Sizes are logical pixels, and the system is constraints going down ([LAYOUT-AND-RESPONSIVE.md](LAYOUT-AND-RESPONSIVE.md)), `Theme` tokens and `MediaQuery`. Every line below tagged "Owner's rule" is the owner's; a "Docs:" note corrects it against the official page it links, keeping the owner's meaning. The CSS side of each unit is in [modern-css TYPOGRAPHY-AND-UNITS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/TYPOGRAPHY-AND-UNITS.md). The third-party `flutter_scale_kit` disagrees with several of these rules ([SCALE-KIT.md](SCALE-KIT.md#where-it-disagrees-with-flutter)).

## The iron rule

Owner's rule, in this order:

1. **Intrinsic first:** `Flex` / `Wrap` / `Grid` / `AspectRatio`.
2. **Fluid:** clamp + `Theme`.
3. **Component:** `LayoutBuilder`.
4. **Page skeleton:** `MediaQuery.sizeOf` + the M3 breakpoints below.
5. **Safe area always.**

Owner's rule: "There's no real `cqi` in Flutter. `LayoutBuilder` is the substitute. Whoever puts `.w` / `.h` on everything makes the web's `vw` mistake."

## The parallel list

For production. Owner's rule on each line:

- **`ThemeData.textTheme` / `ThemeExtension` = `rem`.** Fonts and spacing as tokens, not numbers scattered on screens. Spacing tokens in a `ThemeExtension`: [flutter-ui THEMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/THEMING.md).
- **`value.clamp(min, max)` + `lerpDouble` = `clamp(rem, rem + cqi, rem)`.** A smooth scale with a floor and a ceiling. With the width from `LayoutBuilder`: `lerpDouble(minValue, maxValue, ((width - w0) / (w1 - w0)).clamp(0.0, 1.0))!` ([lerpDouble](https://api.flutter.dev/flutter/dart-ui/lerpDouble.html)).
- **`LayoutBuilder` + `constraints.maxWidth` = `cqi`.** The component reacts to the width it got, not the whole screen.
- **`min(constraints.maxWidth, constraints.maxHeight)` = `cqmin`.** For squares and cards inside a container. `constraints.biggest.shortestSide` is the same; in a vertical scroller `maxHeight` is infinite, so both return the width.
- **Changing structure by `constraints.maxWidth` = container queries.** Column or row, list-detail, a rail instead of the bottom bar. The `LayoutBuilder` workflow: [LAYOUT-AND-RESPONSIVE.md](LAYOUT-AND-RESPONSIVE.md#branch-at-a-breakpoint).
- **`Expanded` / `Flexible` / `Wrap` / `GridView` + `maxCrossAxisExtent` = `%` + `fr` + `minmax` + `auto-fill`.** Mechanics: [LAYOUT-AND-RESPONSIVE.md](LAYOUT-AND-RESPONSIVE.md#branch-at-a-breakpoint) and [lists become grids](LAYOUT-AND-RESPONSIVE.md#large-screens-and-foldables).
- **`math.min` / `math.max` / `ConstrainedBox` = `min()` / `max()`.** For a readable text width: `ConstrainedBox(constraints: BoxConstraints(maxWidth: 65 * 8), child: ...)`. Docs: `ConstrainedBox` takes its limits as `constraints: BoxConstraints(...)`, so `ConstrainedBox(maxWidth: ...)` does not compile ([ConstrainedBox](https://api.flutter.dev/flutter/widgets/ConstrainedBox-class.html)). `65 * 8` assumes about 8 logical pixels per character, roughly a 16 px font; the next line gives the general form.
- **Text width about 45 to 75 characters: there is no `ch`.** Put a `maxWidth` on the paragraph of about 32 to 40 times its font size (a character averages about half the font size, so 65 characters is about 32 to 40 font sizes, depending on the font). Docs: M3 says to adjust margins and type styles to keep text between 40 and 60 characters per line ([M3 breakpoints](https://m3.material.io/foundations/layout/applying-layout/window-size-classes)); 45 to 75 is the owner's range, not M3's.
- **`TextStyle.height` / `StrutStyle` / `TextHeightBehavior` = `lh` / `cap`.** Spacing by the line, not magic numbers. Details and the missing `cap`: [flutter-ui IMAGES-AND-TYPOGRAPHY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/IMAGES-AND-TYPOGRAPHY.md#line-height-wrapping-and-trim).
- **`SafeArea` + `MediaQuery.padding` / `viewPadding` / `viewInsets` = `dvh` + `env(safe-area-inset-*)`.** Notch, Dynamic Island, keyboard. Mechanics: [LAYOUT-AND-RESPONSIVE.md](LAYOUT-AND-RESPONSIVE.md#safearea-and-mediaquery).
- **`MediaQuery.sizeOf` = `vw`.** Only for the page skeleton (navigation, scaffold), never an inner card. `MediaQuery.sizeOf` only when the value truly belongs to the whole window; in a component, always `LayoutBuilder`. Docs: `MediaQuery.widthOf(context)` "Returns width of MediaQueryData.size", for a width-only `vw` ([widthOf](https://api.flutter.dev/flutter/widgets/MediaQuery/widthOf.html)).
- **`Border.all(width: 1)` and fixed shadows = `px`.** Not scaled with the screen.
- **`AspectRatio` + a condition in `build` (`if (hasImage) AspectRatio(...)`) = `:has()` + `aspect-ratio`.**
- **`TextAlign` / `TextOverflow` / `maxLines`: there is no `text-wrap: pretty`.** Closest: don't truncate headings without a reason. Docs: wrapping is already the default (`DefaultTextStyle.softWrap` is `true`, [softWrap](https://api.flutter.dev/flutter/widgets/DefaultTextStyle/softWrap.html)), so `softWrap: true` changes nothing; the fix is not setting `maxLines` or an ellipsis ([flutter-ui IMAGES-AND-TYPOGRAPHY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/IMAGES-AND-TYPOGRAPHY.md#line-height-wrapping-and-trim)).
- **There is no `text-box-trim`.** Closest: `TextHeightBehavior(applyHeightToFirstAscent: false)` or manual padding. Docs: it only drops the extra line height above the first line, "This property only has effect if a non-null TextStyle.height is specified", and it does not trim to the cap height ([applyHeightToFirstAscent](https://api.flutter.dev/flutter/dart-ui/TextHeightBehavior/applyHeightToFirstAscent.html)); the fuller form is in [flutter-ui IMAGES-AND-TYPOGRAPHY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/IMAGES-AND-TYPOGRAPHY.md#line-height-wrapping-and-trim).
- **`IntrinsicWidth` / `IntrinsicHeight` on fields = `field-sizing: content`.** Use them carefully (expensive); prefer `minLines` / `maxLines` in `TextField`. Field growth: [flutter-ux FORMS-AND-INPUT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/FORMS-AND-INPUT.md#fields-that-grow-with-their-content).
- **`EdgeInsetsDirectional` / `AlignmentDirectional` / `TextDirection` = logical properties.** Mandatory in Hebrew ([LOCALIZATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/LOCALIZATION.md#wire-the-delegates)).

## M3 breakpoints

Owner's rule: structure changes at these breakpoints; continuous sizes come from clamp / lerp, not a branch at every width. Docs: M3 now lists five breakpoints ("previously window size classes"), adding Large and Extra-large ([M3 breakpoints](https://m3.material.io/foundations/layout/applying-layout/window-size-classes)):

| Breakpoint | Width (dp) |
| --- | --- |
| Compact | under 600 |
| Medium | 600 to 839 |
| Expanded | 840 to 1199 |
| Large | 1200 to 1599 |
| Extra-large | 1600 and up |

Flutter's own docs state only the 600 switch from bottom bar to rail ([LAYOUT-AND-RESPONSIVE.md](LAYOUT-AND-RESPONSIVE.md#branch-at-a-breakpoint)).

## Enhancement, not the base

Owner's rule: these refine a layout that already works.

- **`MediaQuery.textScalerOf` + `MediaQuery.withClampedTextScaling` = `rem` accessibility.** Don't disable text zoom globally. If a layout breaks at large text, change the structure (`Row` to `Column`), don't shrink the font. Docs: `withClampedTextScaling` clamps the scale "to prevent excessive text scaling that would break the UI" ([withClampedTextScaling](https://api.flutter.dev/flutter/widgets/MediaQuery/withClampedTextScaling.html)); it is the same mechanism as an app-wide cap, so keep it around one region that truly can't grow, never the app root. Optional package: `scale_aware_layout` 0.1.1 (MIT, from an unverified uploader on pub.dev) reflows `Row` to `Column` by text scale with `AdaptiveRowColumn(breakScale: 1.3, ...)` and `ScaleAwareBuilder` ([scale_aware_layout](https://pub.dev/packages/scale_aware_layout)); plain Flutter does the same by branching on `MediaQuery.textScalerOf(context).scale(1)` or with `OverflowBar` ([LAYOUT-AND-RESPONSIVE.md](LAYOUT-AND-RESPONSIVE.md#branch-at-a-breakpoint)). Where this meets the community cap: [flutter-ux SCROLLING-AND-LAYOUT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/SCROLLING-AND-LAYOUT.md#text-scale-cap).
- **`DisplayFeature` / a hinge on foldables: a dead gap in the middle of the screen.** Docs: only `DisplayFeatureType.hinge` and `DisplayFeatureType.cutout` obstruct the display, "while DisplayFeatureType.fold does not" ([DisplayFeatureType](https://api.flutter.dev/flutter/dart-ui/DisplayFeatureType.html)), and the list "is populated only on Android" ([displayFeatures](https://api.flutter.dev/flutter/widgets/MediaQueryData/displayFeatures.html)). Read it with `MediaQuery.displayFeaturesOf(context)`; `DisplayFeatureSubScreen` places a child clear of obstructing features ([DisplayFeatureSubScreen](https://api.flutter.dev/flutter/widgets/DisplayFeatureSubScreen-class.html)).
- **Adaptive navigation: bar to rail.** Docs: `NavigationSuiteScaffold` is Jetpack Compose, not Flutter ([Compose adaptive navigation](https://developer.android.com/develop/ui/compose/layouts/adaptive/build-adaptive-navigation)), and Flutter's `flutter_adaptive_scaffold` is discontinued on pub.dev ([flutter_adaptive_scaffold](https://pub.dev/packages/flutter_adaptive_scaffold)). In Flutter, switch `NavigationBar` to `NavigationRail` (extended on wide windows) yourself in a `LayoutBuilder` ([LAYOUT-AND-RESPONSIVE.md](LAYOUT-AND-RESPONSIVE.md#branch-at-a-breakpoint)). The owner's list ends at a drawer; M3's breakpoint table lists no drawer, giving "Modal or standard expanded navigation rail" from Expanded up ([M3 breakpoints](https://m3.material.io/foundations/layout/applying-layout/window-size-classes)).
- **`SliverGridDelegateWithMaxCrossAxisExtent`:** a grid that packs itself.
- **`FittedBox`:** only for an icon or logo fitting a box, never body text. Docs: `FittedSizes` is not a widget but "The pair of sizes returned by applyBoxFit" ([FittedSizes](https://api.flutter.dev/flutter/painting/FittedSizes-class.html)); the widget is `FittedBox`.

## Don't build a system on them

Owner's rule:

- **`flutter_screenutil` on every pixel:** `vw` on everything. It breaks tablets and accessibility. The same holds for `flutter_scale_kit`'s `.w` / `.sp` style ([SCALE-KIT.md](SCALE-KIT.md#where-it-disagrees-with-flutter)).
- **`OrientationBuilder` at the top of the tree:** orientation is not available space ([LAYOUT-AND-RESPONSIVE.md](LAYOUT-AND-RESPONSIVE.md#orientation)).
- **`Platform.isIOS` for layout:** it doesn't know how much width the window has ([LAYOUT-AND-RESPONSIVE.md](LAYOUT-AND-RESPONSIVE.md#capabilities-and-policies)).
- **`MediaQuery.of(context).size`:** needless rebuilds. Use `sizeOf` / `paddingOf` / `textScalerOf` separately ([LAYOUT-AND-RESPONSIVE.md](LAYOUT-AND-RESPONSIVE.md#measure-the-window)).
- **Locking `textScaler` to 1.0 in the whole app:** it ruins accessibility ([ACCESSIBILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ACCESSIBILITY.md#design-values)).
- **`AutoSizeText` as the default:** it shrinks text instead of changing the layout (`auto_size_text` shrinks the font down to `minFontSize`, [auto_size_text](https://pub.dev/packages/auto_size_text)).

## Prove it

- Component layout reads its parent constraints; whole-window measurements are reserved for the page skeleton. [Owner's rule, The parallel list](#the-parallel-list)
- Fonts and spacing use theme tokens, and layout changes structure at the selected breakpoints. [Owner's rule, The parallel list](#the-parallel-list), [M3 breakpoints](#m3-breakpoints)
- At large OS text sizes, change the layout rather than applying an app-wide text-scale cap. [Owner's rule, Enhancement, not the base](#enhancement-not-the-base)
