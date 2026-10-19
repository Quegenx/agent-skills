# flutter_scale_kit (third party)

`flutter_scale_kit` is a third-party package (fodilfliti, MIT, https://pub.dev/packages/flutter_scale_kit, repo https://github.com/fodilfliti/flutter_scale_kit; its agent skill is version 2.0.2) that scales sizes, fonts and radii from a design canvas and adds `SK*` drop-in widgets, design tokens and device-class helpers. It is not part of Flutter. What decides most outcomes is the project's `style` in `scale_kit.yaml`, one `ScaleKitBuilder` above the app, and never scaling a value twice. Flutter's own responsive guidance is in [LAYOUT-AND-RESPONSIVE.md](LAYOUT-AND-RESPONSIVE.md); where this package's skill disagrees with it, both are stated below and marked.

**Contents:** [Where it disagrees with Flutter](#where-it-disagrees-with-flutter) · [Project style file](#project-style-file) · [Defaults](#defaults) · [Set up](#set-up) · [Theme Kit companion](#theme-kit-companion) · [API map](#api-map) · [Choosing an API](#choosing-an-api) · [Device classification](#device-classification) · [Patterns](#patterns) · [Prove it](#prove-it)

## Where it disagrees with Flutter

- **Phone vs tablet branching.** Flutter's official skill and docs: "Do not check for hardware types (e.g., 'phone' vs. 'tablet')"; base layout "strictly on available window space". This package's skill tells agents to use `context.isMobilePlatform` / `isResponsiveMobile` / `isTypeOfMobile()` for device-class branches. Both warn against orientation or width-only checks: Flutter against `MediaQuery.orientationOf` / `OrientationBuilder`, this package against `context.isMobile`.
- **MediaQuery.** Flutter recommends `MediaQuery.sizeOf(context)` for the window size. This package's skill: "Don't subscribe to full `MediaQuery` for scaling; the builder already handles size/orientation."
- **Screen-proportional scaling.** Owner's rule: putting `.w` / `.h` / `.sp` on every value is the web's `vw` mistake and breaks tablets and accessibility; size with `Theme` tokens, `LayoutBuilder` and clamped values instead ([RESPONSIVE-UNITS.md](RESPONSIVE-UNITS.md#dont-build-a-system-on-them)). Flutter's docs point the same way: base layout "strictly on available window space" (above) and "Make sure your layout has enough room to render all its contents when the font sizes are increased" ([ACCESSIBILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ACCESSIBILITY.md#design-values)). This package's `extensions` style scales with `.w` / `.sp` / `.rSafe` like ScreenUtil; its own table below also says not to put `.w` on every number. The owner's rule wins.
- **Choose per project and confirm in the current docs** of each before mixing them.

## Project style file

- **Read `scale_kit.yaml` or `.scalekit.yaml` at the app root.** If `style` is set, follow it for all UI and do not ask again. Do not switch styles mid-project unless the user asks.
- **If the file is missing,** ask once in a single message, recommending `design_system`, then write the file. If the user skips or says "defaults", use `style: design_system` and say so.
- **If `ScaleKitBuilder` already exists but the yaml is missing,** ask the style once and write the yaml, but do not re-wrap `main`.

| Style | What it means |
| --- | --- |
| `design_system` (recommended) | Tokens + `SK*` + `SKit.*Size` |
| `drop_in` | `SK*` with raw design px, little token use, still no `.w` |
| `extensions` | Keep Flutter widgets and scale with `.w` / `.sp` / `.rSafe`, like ScreenUtil |
| `hybrid` | New UI uses `design_system`; leftover or third-party widgets use `.w` / `.sp` / clamps |

- **Interview questions:**
  1. Style.
  2. Design size: Mobile 375×812 (default), Tablet 768×1024, Desktop 1440×900, or custom from Figma.
  3. Token scale: recommended 4 to 48 (default), `SizeValues.material3()`, `SizeValues.tailwind()`, or pasted Figma values.
  4. Fonts: skip (default), Inter via `google_fonts`, a custom family, or extra languages (for example `ar` → Almarai).
  5. Desktop/web: auto (default), lock as tablet, or lock as mobile.
  6. Dart config path: `lib/core/scale_kit.dart` (default).

```yaml
# Copy to the Flutter app root as scale_kit.yaml (or .scalekit.yaml).
# AI agents read this and follow `style` without asking again.
# Docs: https://pub.dev/packages/flutter_scale_kit#ai-agent-skill

style: design_system # design_system | drop_in | extensions | hybrid

design_width: 375
design_height: 812
design_type: mobile # mobile | tablet | desktop

tokens: recommended # recommended | material3 | tailwind
desktop: auto # auto | lock_tablet | lock_mobile
```

## Defaults

- **Design canvas** `375 × 812`, `DeviceType.mobile` ("iPhone 13 mini / common Figma mobile").
- **Tokens:** padding and spacing `4, 8, 16, 24, 32, 48`; radius `4, 8, 12, 16, 20, 28`; text `TextSizeValues.material3()`. The template's margin is `4, 8, 12, 16, 24, 32`.
- **The `material3` preset is different:** xs=4, sm=8, md=12, lg=16, xl=24, xxl=32. Shortcut: `setPaddingSizes/ setMarginSizes/ setRadiusSizes/ setSpacingSizes(SizeValues.material3())`. It is a separate preset from the recommended values above.
- **Desktop/web is auto-detected.** Skip `FontConfig` unless the app uses `google_fonts` or a named family.
- **Desktop locks:** `lockDesktopPlatforms: true, lockDesktopAsTablet: true` (tablet-like) or `lockDesktopPlatforms: true, lockDesktopAsMobile: true` (mobile-like).
- **Use `ResponsiveThemeData.create`** only if the app already has a `ThemeData` and does not use `flutter_scale_theme_kit`.

## Set up

1. `flutter pub add flutter_scale_kit`. If the font is Inter, also `flutter pub add google_fonts`. Do not add `google_fonts` otherwise; the package does not depend on it.
2. Write `scale_kit.yaml`.
3. Write `lib/core/scale_kit.dart` (or `lib/app/scale_kit.dart`). Keep tokens in that one file.
4. Call `initScaleKit()` at the top of `main()`, before `runApp`.
5. Wrap the existing root with `ScaleKitBuilder`, above `MaterialApp` / `GetMaterialApp` / `CupertinoApp`. Do not replace routing or state; keep their `MaterialApp` as the child. Do not copy flutter_screenutil's `ScreenUtilInit`.
6. Theme: with `flutter_scale_theme_kit`, use the merge below. Otherwise optionally set `theme: ResponsiveThemeData.create(context: context, ...)` inside a `Builder` under `ScaleKitBuilder`, because the context must see Scale Kit.

Checklist:
- [ ] yaml with `style`
- [ ] dependency
- [ ] `initScaleKit()` before `runApp`
- [ ] `ScaleKitBuilder` above the app
- [ ] "No second builder nested later"
- [ ] existing `MediaQuery` / Router / localization unchanged
- [ ] with Theme Kit: `theme:` is `appST.light.copyWith(textTheme: …createResponsiveTextTheme…)`, not `ResponsiveThemeData.create` alone

`lib/core/scale_kit.dart`:

```dart
import 'package:flutter_scale_kit/flutter_scale_kit.dart';
// import 'package:google_fonts/google_fonts.dart'; // only if user chose Google Fonts

/// Call from main() before runApp.
void initScaleKit() {
  setPaddingSizes(SizeValues.custom(xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48));
  setMarginSizes(SizeValues.custom(xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32));
  setRadiusSizes(SizeValues.custom(xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28));
  setSpacingSizes(SizeValues.custom(xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48));
  setTextSizes(TextSizeValues.material3());

  setDefaultPadding(16);
  setDefaultMargin(8);
  setDefaultRadius(12);
  setDefaultSpacing(8);
  setDefaultTextSize(14);

  // Optional fonts:
  // FontConfig.instance
  //   ..setDefaultFont(googleFont: GoogleFonts.inter)
  //   ..setLanguageGroupFont(LanguageGroupFontConfig(
  //     languageCodes: ['ar', 'fa', 'ur'],
  //     googleFont: GoogleFonts.almarai,
  //   ));
}

/// Compute-once tokens for a screen. Call inside build().
const appDesign = ScaleKitDesignValues(
  textXs: 12,
  textSm: 14,
  textMd: 16,
  textLg: 18,
  textXl: 24,
  textXxl: 32,
  paddingSm: 8,
  paddingMd: 16,
  paddingLg: 24,
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  spacingSm: 8,
  spacingMd: 16,
  spacingLg: 24,
);
```

`main.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:flutter_scale_kit/flutter_scale_kit.dart';
import 'core/scale_kit.dart';

void main() {
  initScaleKit();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ScaleKitBuilder(
      designWidth: 375,
      designHeight: 812,
      designType: DeviceType.mobile,
      // lockDesktopPlatforms: true,
      // lockDesktopAsTablet: true,
      child: MaterialApp(
        title: 'App',
        home: const HomePage(),
      ),
    );
  }
}
```

- **`designType` is not applied.** The init template and the yaml (`design_type`) pass it, yet the package's API notes say `designType` is "accepted, not applied yet" by `ScaleManager`. To force a device type, use `deviceTypeOverride`.

## Theme Kit companion

- **If `pubspec.yaml` lists `flutter_scale_theme_kit`, use it.** Theme Kit owns the look (`STTheme` / `context.st` / `appST.light` / `appST.dark`); size stays with flutter_scale_kit. Its own skill installs with `npx skills add fodilfliti/flutter_scale_theme_kit`.
- **Define `appST` in `lib/core/design.dart`** (`STTheme` + `STColors` + `STRadius`).
- **Do not set `theme: ResponsiveThemeData.create(...)`,** including with `colorScheme: appST.light.colorScheme`. It "drops card/button/input themes from Theme Kit".
- **Keep radius aligned:** `setRadiusSizes(SizeValues.custom(md: 12))` with `STRadius(md: 12)`.
- **The two packages are sibling folders,** and "Neither `lib/` imports the other".
- **In-app light/dark switch:** wrap `MaterialApp` in `STThemeModeScope` (`context.stMode`).

```dart
import 'package:flutter_scale_theme_kit/flutter_scale_theme_kit.dart';
import 'core/design.dart'; // appST

return ScaleKitBuilder(
  designWidth: 375,
  designHeight: 812,
  designType: DeviceType.mobile,
  child: Builder(
    builder: (context) {
      return STThemeModeScope(
        builder: (context, mode) {
          return MaterialApp(
            theme: appST.light.copyWith(
              textTheme: appST.light.createResponsiveTextTheme(
                appST.light.textTheme,
              ),
            ),
            darkTheme: appST.dark.copyWith(
              textTheme: appST.dark.createResponsiveTextTheme(
                appST.dark.textTheme,
              ),
            ),
            themeMode: mode.mode,
            home: const HomePage(),
          );
        },
      );
    },
  ),
);
```

## API map

- **Import:** `package:flutter_scale_kit/flutter_scale_kit.dart`. "Don't invent APIs. If unsure, read api.md or the installed package source."
- **`ScaleKitBuilder`** (required ancestor) fields:
  - `designWidth`, `designHeight`
  - `designType` ("accepted, not applied yet"), `deviceTypeOverride`
  - `minScale` / `maxScale` (omit for auto)
  - `autoScaleLandscape` (default true), `autoScalePortrait` (default false)
  - `enabled` / `enabledListenable`
  - `lockDesktopPlatforms`, `lockDesktopAsTablet`, `lockDesktopAsMobile`
  - `breakpoints` (`ScaleBreakpoints`), `sizeChangeThreshold`
- **`num` extensions:**

| Extension | Use |
| --- | --- |
| `.w` / `.h` | Width and height |
| `.sp` / `.spf` | Fonts; `.spf` is font × system text scale |
| `.r` | Full radius (pills, circles) |
| `.rSafe` | Clamped radius (cards) |
| `.rFixed` | No scaling |
| `.sw` / `.sh` | % of screen |
| `.wMax` / `.wMin` / `.wClamp` | Clamps; the same forms exist for `h`, `sp`, `r`, `sw`, `sh` |
| `12.horizontalSpace`, `16.verticalSpace` | Gap widgets |

  Also `EdgeInsets.all(12).w`, `BorderRadius.circular(16).h`, `Radius.circular(24).w`.
- **SK widgets take raw design numbers:** `SKContainer`, `SKPadding`, `SKMargin`, `SKText`, `SKIcon`, `SKCard`, `SKDivider`, `SKAppBar`, `SKListTile`, `SKSwitch`, `SKSwitchListTile`, `SKTextField`, `SKTextFormField`, `SKElevatedButton`, `SKTextButton`, `SKOutlinedButton`, `SKIconButton`, `SKActionChip`, `SKFilterChip`, `SKChoiceChip`, `SKInputChip`, `SKImage.asset/network/file/memory`. Const gaps: `HSpace`, `VSpace`, `SSpace`, `SKSizedBox`.
- **`SKit` helpers:**
  - `SKit.padding` / `paddingSize` / `paddingEdgeInsets` / `paddingEdgeInsetsSize`
  - `SKit.margin` / `marginSize`
  - `SKit.roundedContainer` / `roundedContainerSize` (`radiusMode: SKRadiusMode.safe` default)
  - `SKit.pad()` `SKit.margin()` `SKit.rounded()` (defaults from `setDefault*`)
  - `SKit.hSpace` `vSpace` `hSpaceSize` `vSpaceSize`
  - `SKit.text` / `textFull` / `textStyleFull`
  - `SKit.responsiveInt` / `responsiveDouble`
- **Tokens:**
  - `SKSize` xs, sm, md, lg, xl, xxl. `SKTextSize` s6…s52.
  - Setters: `setPaddingSizes` `setMarginSizes` `setRadiusSizes` `setSpacingSizes` `setTextSizes`, and `setDefaultPadding` `setDefaultMargin` `setDefaultRadius` `setDefaultSpacing` `setDefaultTextSize`.
  - `SizeValues.custom` / `.material3()` / `.tailwind()`, `TextSizeValues.custom` / `.material3()`.
  - `ScaleKitDesignValues` → `.compute()` → `ScaleKitDesignValuesSet` (scaled `EdgeInsets`, `BorderRadius`, `TextStyle`). Call `compute()` once per build or screen.
  - Deprecated: `SKitTheme` → `ScaleKitDesignValues`.
- **Responsive builders:**
  - `SKResponsive` has builders `mobile`, `mobileLandscape`, `tablet`, `tabletLandscape`, `desktop`.
  - `SKResponsiveBuilder` takes the same builders or `builder: (context, device, orientation)`.
  - Fallback: desktop → tablet → mobile, and landscape → portrait of the same device.
  - Flags: `deviceTypeOverride`, `desktopAs`, `lockDesktopAsTablet`, `lockDesktopAsMobile`.
- **Device queries:**
  - `context.isMobilePlatform` / `isAndroidPlatform` / `isIOSPlatform` / `isDesktopPlatform` / `isWebPlatform`
  - `context.isResponsiveMobile` / `isTypeOfMobile()`
  - `context.isMobileViewport` / `isMobileSize`
  - Legacy width names `context.isMobile` `isTablet` `isDesktop`
  - `context.screenSizeClass`, `isMobileSize` / `isTabletSize` / `isDesktopSize`
  - `context.isTypeOfMobile(source: DeviceClassificationSource.platform)`
  - `DeviceMetricsMixin` is width-only.
  - `DeviceType`: mobile, tablet, desktop, web. `DeviceClassificationSource`: responsive, platform, size.
- **Fonts:**
  - `FontConfig.instance.setDefaultFont(googleFont: ...)` or `customFontFamily:`
  - `setLanguageFont(LanguageFontConfig(languageCode: 'ja', googleFont: ...))`
  - `setLanguageGroupFont(LanguageGroupFontConfig(languageCodes: ['ar','fa','ur'], googleFont: ...))`
  - `ResponsiveThemeData.create(context: context, colorScheme: ..., useMaterial3: true)`
- **Engine, rarely needed:** `ScaleManager.instance.getWidth/getHeight/getFontSize/getRadius`, plus `screenWidth` `orientation` `deviceType` `platformCategory` `screenSizeClass`.

## Choosing an API

| Need | Best API | Do not |
| --- | --- | --- |
| Normal screen | Tokens + `SK*` | `.w` on every number, `SKResponsive` |
| Screen with many sizes | `final v = appDesign.compute()` then `v.paddingMd` | Repeating `16.w` |
| Card / section | `SKit.roundedContainerSize(all: SKSize.md, …)` | `BoxDecoration` + `.r` by hand |
| Odd Figma px (73) or leftover Flutter widget | `.w` / `.sp` / `.rSafe` | Converting the whole file only for one number |
| Width/font would get huge on desktop | `200.wMax(360)`, `16.spClamp(14, 20)` | Extra layout |
| Grid columns / item count | `SKit.responsiveInt` | `SKResponsive` wrapping the grid |
| Different structure (rail vs bottom bar, list vs split view) | `SKResponsive` / `SKResponsiveBuilder` | Responsive builder for padding/font |

- **"Never double-scale: `SKContainer(width: 120)` OK; `SKContainer(width: 120.w)` BAD."**
- **Radius:** cards use `.rSafe` / `SKRadiusMode.safe`; pills and avatars use `.r`.
- **No magic `EdgeInsets.all(13)`** when `SKSize.md` exists.
- **Do not wrap a screen in `SKResponsive`** just to change padding or font size.
- **Migrating:** `Container` → `SKContainer`, `Text` → `SKText` (move `style.fontSize` to `fontSize:`), `Padding` → `SKPadding`, `TextField` → `SKTextField`, `ElevatedButton` → `SKElevatedButton`. Keep numbers as design px.
- **After init with `design_system`:** normal screens use tokens + `SK*`; busy screens call `appDesign.compute()` once; grids use `SKit.responsiveInt`; split layouts use `SKResponsiveBuilder`; forms use `SKTextField` / `SKTextFormField` / `SKElevatedButton`.
- **"Do not treat 'Windows + small window' as a phone unless you intend that** (`lockDesktopAsMobile` or size-class checks)."

## Device classification

This section is the package's own model. Flutter's official guidance is to branch on window space, not device type (see [the disagreement above](#where-it-disagrees-with-flutter)).

| Goal | API | Landscape iPhone (~914×411) |
| --- | --- | --- |
| Phone OS (Android/iOS) | `context.isMobilePlatform` | `true` |
| Scaling + `SKText` / limits | `context.isResponsiveMobile` or `context.isTypeOfMobile()` | `true` |
| Same as `ScaleManager.deviceType` | `ScaleManager.instance.deviceType` | `DeviceType.mobile` |
| `SKResponsiveBuilder` device arg | `builder: (ctx, device, orientation) => …` | `DeviceType.mobile` |
| Viewport width bucket (CSS-like) | `context.isMobileViewport` / `context.isMobileSize` | `false` (width > 600) |
| Layout portrait vs landscape | `SKResponsive` / `SKResponsiveBuilder` with `mobileLandscape:` | use builders, not `if (isMobile)` |
| Force detection | `deviceTypeOverride: DeviceType.mobile` on `ScaleKitBuilder` or `SKResponsiveBuilder` | only when you must override |

- **Classification sources:**
  - `responsive` (default): platform detection + overrides + desktop lock fallback.
  - `platform`: the OS device class; on iOS and Android, phones are judged by the shortest side.
  - `size`: current width against the breakpoints only.
- **`context.isMobile` / `isMobileViewport` means width ≤ `mobileMaxWidth` (default 600).** A phone in landscape is often 800 to 900 wide, so it reads `false`.
- **`DeviceMetricsMixin` uses `DeviceDetector.detectDeviceType(width)`,** so it is width-only.
- **Portrait artboard on a landscape phone:** with a 402×874 artboard, scaling swaps the effective design width and height so fonts do not shrink to about half size.

```dart
context.isTypeOfMobile(); // responsive: default for scaling & SKResponsiveBuilder
context.isTypeOfMobile(source: DeviceClassificationSource.platform); // iOS/Android shortest-side phone vs tablet
context.isTypeOfMobile(source: DeviceClassificationSource.size); // current width only: same as isMobileViewport
```
```dart
// BAD: flips when user rotates
if (context.isMobile) { ... }

// GOOD: phone hardware
if (context.isMobilePlatform) { ... }

// GOOD: scaling / responsive device class
if (context.isResponsiveMobile) { ... }
```
```dart
// BAD: no effect on detection/scaling
ScaleKitBuilder(designType: DeviceType.mobile, ...);

// GOOD: when you must force
ScaleKitBuilder(deviceTypeOverride: DeviceType.mobile, ...);
```
```dart
SKResponsiveBuilder(
  mobile: (_) => portraitLayout,
  mobileLandscape: (_) => landscapeLayout,
)
```

## Patterns

```dart
// BEST default: tokens + SK (scales, consistent, short)
SKit.paddingSize(
  all: SKSize.md,
  child: SKit.roundedContainerSize(
    all: SKSize.md,
    child: Column(
      children: [
        SKText('Title', fontSize: 20, fontWeight: FontWeight.w600),
        SKit.vSpaceSize(SKSize.sm),
        SKText('Body', fontSize: 14),
      ],
    ),
  ),
);
```
```dart
// Escape hatch: one leftover widget or a clamp
SizedBox(width: 120.wMax(200), child: oldChild)
```
```dart
final v = appDesign.compute();
return SKPadding(
  padding: v.paddingMd!,
  child: SKContainer(
    padding: v.paddingMd,
    decoration: BoxDecoration(borderRadius: v.borderRadiusMd),
    child: SKText('Dashboard', fontSize: 20),
  ),
);
```
```dart
final columns = SKit.responsiveInt(
  context: context,
  mobile: 2,
  tablet: 4,
  desktop: 6,
);
GridView.count(crossAxisCount: columns, children: items);
```
```dart
SKResponsiveBuilder(
  mobile: (_) => const MobileHome(),
  tablet: (_) => const TabletHome(),
  desktop: (_) => const DesktopHome(),
);
```
```dart
Container(
  width: 200.wMax(360),
  padding: EdgeInsets.all(16).w,
  decoration: BoxDecoration(borderRadius: BorderRadius.circular(12.rSafe)),
  child: Text('Hello', style: TextStyle(fontSize: 16.sp)),
);
```
```dart
if (context.isIOSPlatform) return const CupertinoToolbar();
if (context.isDesktopSize) return const WideSidebar();
```
```dart
// drop_in
SKPadding(
  padding: EdgeInsets.all(16),
  child: SKContainer(
    height: 48,
    child: SKText('Save', fontSize: 16),
  ),
);
```
```dart
// extensions
Padding(
  padding: EdgeInsets.all(16.w),
  child: Container(
    height: 48.h,
    decoration: BoxDecoration(borderRadius: BorderRadius.circular(12.rSafe)),
    child: Text('Save', style: TextStyle(fontSize: 16.sp)),
  ),
);
```
```dart
// hybrid
SKit.paddingSize(
  all: SKSize.md,
  child: Column(
    children: [
      SKText('Title', fontSize: 18),
      SKit.vSpaceSize(SKSize.sm),
      SizedBox(width: 200.wMax(360), child: const LegacyChart()),
    ],
  ),
);
```
```dart
// patterns.md: enum padding without a theme object
SKit.paddingSize(
  horizontal: SKSize.lg,
  vertical: SKSize.sm,
  child: child,
);
```
```dart
// patterns.md: clamp one size (still one layout)
Row(
  children: [
    SKImage.asset('assets/logo.png', width: 48), // SK scales
    SKit.hSpaceSize(SKSize.sm),
    Expanded(child: SKText('Title', fontSize: 16)),
  ],
)
```
```dart
// patterns.md: raw Flutter child that would grow too wide on desktop
SizedBox(width: 280.wMax(400), child: const LegacyChart())
```

## Prove it

- **Style file:** `scale_kit.yaml` or `.scalekit.yaml` exists at the app root with a `style` key, and the UI code matches that style (no `.w` in `drop_in` or `design_system` code).
- **One builder:** `initScaleKit()` runs before `runApp`, exactly one `ScaleKitBuilder` sits above `MaterialApp` / `CupertinoApp`, and routing, localization and existing `MediaQuery` use are unchanged.
- **No double scaling:** search for `SK` widgets given `.w`, `.h`, `.sp` or `.r` values; there are none.
- **No reliance on `designType`:** forced device types use `deviceTypeOverride`.
- **Theme Kit projects:** `theme:` is `appST.light.copyWith(textTheme: ...createResponsiveTextTheme...)`, not `ResponsiveThemeData.create`, and radius tokens match `STRadius`.
- **Rotation:** rotate a phone; layouts that must not flip do not use `context.isMobile`.
