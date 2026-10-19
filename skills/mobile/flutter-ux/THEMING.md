# Theming

How to give a Flutter app its own colors and text styles without copy-pasting them: a `ThemeExtension` for brand colors, a theme factory built from one palette, light and dark switching without a restart, `DefaultTextStyle.merge` for one-property tweaks, and the font and spacing rules that keep a design calm. Source: ApparenceKit tips and blog posts (apparencekit.dev, a commercial boilerplate vendor; third-party material, no Flutter version stated in any article), checked against api.flutter.dev where an API is named. Widget recipes are in [WIDGET-PATTERNS.md](WIDGET-PATTERNS.md); type and image details in [IMAGES-AND-TYPOGRAPHY.md](IMAGES-AND-TYPOGRAPHY.md).

**Contents:** [Two things called theme extension](#two-things-called-theme-extension) · [Custom colors with ThemeExtension](#custom-colors-with-themeextension) · [A theme factory from one palette](#a-theme-factory-from-one-palette) · [Light and dark without a restart](#light-and-dark-without-a-restart) · [Tweak one text property](#tweak-one-text-property) · [Colors, fonts and spacing](#colors-fonts-and-spacing) · [Prove it](#prove-it)

## Two things called theme extension

- Keep the terms apart. Flutter's `ThemeExtension<T>` is a class you register in `ThemeData.extensions`. ApparenceKit also calls a Dart `extension ... on BuildContext` with getters like `context.colors` a "theme extension", and one of its snippets names that extension `ThemeExtension`, the same name as Flutter's class. [ApparenceKit](https://apparencekit.dev/flutter-tips/create-flutter-theme-extension/) [ApparenceKit](https://apparencekit.dev/blog/flutter-theme-made-easy/)
- The other tips name the same kind of `BuildContext` extension `ThemeColors` and `ApparenceKitThemeExt`.

## Custom colors with ThemeExtension

[ApparenceKit](https://apparencekit.dev/flutter-tips/flutter-create-custom-color-theme/)

- Extend `ThemeExtension<T>` with your brand colors. It needs `copyWith` and `lerp`; add `light()` / `dark()` factories. The article calls this a simplified example ("you'll need the full implementation"):

```dart
import 'package:flutter/material.dart';

class MyAppColors extends ThemeExtension<MyAppColors> {
  final Color primaryBrand;
  final Color secondaryBrand;
  // Add all your custom colors here

  const MyAppColors({
    required this.primaryBrand,
    required this.secondaryBrand,
  });

  // You'll need copyWith and lerp methods for ThemeExtension
  // (Simplified example below, you'll need the full implementation)
  @override
  MyAppColors copyWith({Color? primaryBrand, Color? secondaryBrand}) {
    return MyAppColors(
      primaryBrand: primaryBrand ?? this.primaryBrand,
      secondaryBrand: secondaryBrand ?? this.secondaryBrand,
    );
  }

  @override
  MyAppColors lerp(ThemeExtension<MyAppColors>? other, double t) {
    if (other is! MyAppColors) {
      return this;
    }
    return MyAppColors(
      primaryBrand: Color.lerp(primaryBrand, other.primaryBrand, t)!,
      secondaryBrand: Color.lerp(secondaryBrand, other.secondaryBrand, t)!,
    );
  }

  // You can add factory methods for light/dark themes here
  factory MyAppColors.light() => const MyAppColors(
    primaryBrand: Color(0xFF123456),
    secondaryBrand: Color(0xFFABCDEF),
  );

  // Add MyAppColors.dark() if you support dark mode
}
```

- Register it in `ThemeData.extensions`:

```dart
MaterialApp(
  theme: ThemeData(
    // ... other theme properties
    extensions: <ThemeExtension<dynamic>>[
      MyAppColors.light(), // Or .dark() based on theme mode
    ],
  ),
  // ... rest of your app
)
```

- Add a `BuildContext` getter so callers write `context.colors.primary` instead of `Theme.of(context).colorScheme.primary`. [ApparenceKit](https://apparencekit.dev/flutter-tips/create-flutter-theme-extension/) Both variants from the tips:

```dart
extension ApparenceKitThemeExt on BuildContext {
  ApparenceKitColors get colors => Theme.of(this).extension<ApparenceKitColors>()!;
  // Add more getters for textTheme, custom data, etc.
}
```

```dart
extension ThemeColors on BuildContext {
  MyAppColors get colors => Theme.of(this).extension<MyAppColors>()!;
}
```

```dart
Container(
  color: context.colors.primaryBrand,
  // ...
)
```

## A theme factory from one palette

[ApparenceKit](https://apparencekit.dev/blog/flutter-theme-made-easy/)

- **The problems with building `ThemeData` by hand:** "many developers copy pasting colors throughout the app and the themeData file"; "You can't switch the theme without restarting the app (dark/light?)"; no way "to set different theme for different platform".
- **The fix:** "not duplicate your theme but to create a factory that will create the theme from a color palette." Keep the color palette and the default text theme in separate files.
- **Every color has an "on" color:** "if you have a white background you should have a black text color." "Switching from light to dark should only rely on switching some colors. You should not have to handle if case in your code."
- The factory interface and one implementation, verbatim (the `...` is the article's):

```dart
abstract class ApparenceKitThemeDataFactory {
  const ApparenceKitThemeDataFactory();

  ApparenceKitThemeData build({
    required ApparenceKitColors colors,
    required ApparenceKitTextTheme defaultTextStyle,
  });
}
```

```dart
class UniversalThemeFactory extends ApparenceKitThemeDataFactory {
  const UniversalThemeFactory();

  @override
  ApparenceKitThemeData build({
    required ApparenceKitColors colors,
    required ApparenceKitTextTheme defaultTextStyle,
  }) {
    return ApparenceKitThemeData(
      colors: colors,
      defaultTextTheme: defaultTextStyle,
      materialTheme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: colors.primary).copyWith(
          surface: colors.surface,
          onSurface: colors.onSurface,
          background: colors.background,
          onBackground: colors.onBackground,
          primary: colors.primary,
          error: colors.error,
        ),
        elevatedButtonTheme: elevatedButtonTheme(
          colors: colors,
          textTheme: defaultTextStyle,
        ),
        inputDecorationTheme: inputDecorationTheme(
          colors: colors,
          textTheme: defaultTextStyle,
        ),
        textTheme: textTheme(
          colors: colors,
          defaultTextStyle: defaultTextStyle,
        ),
      ),
      ...
    );
  }
```

- **Correction:** `ColorScheme.background` and `onBackground` are deprecated: "Use surface instead. This feature was deprecated after v3.18.0-0.1.pre." and "Use onSurface instead." ([background](https://api.flutter.dev/flutter/material/ColorScheme/background.html), [onBackground](https://api.flutter.dev/flutter/material/ColorScheme/onBackground.html)). The block already sets `surface` and `onSurface`, so drop these two lines:

```dart
          background: colors.background,
          onBackground: colors.onBackground,
```

  The article (no version stated) is out of date here.
- The same article shows `Theme.of(context).textTheme.headline1`; that name is gone (`headline1` to `displayLarge`, see [flutter VERSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/VERSIONS.md)).

## Light and dark without a restart

[ApparenceKit](https://apparencekit.dev/blog/flutter-theme-made-easy/)

- Put a `ThemeProvider` (an `InheritedNotifier`) above `MaterialApp`, and feed `theme`, `darkTheme` and `themeMode` from it, so the mode switches without a restart. "We don't use riverpod here so we can get the theme from the context and regular widgets". Verbatim (the article elides `updateShouldNotify` and the rest of `MaterialApp`):

```dart
/// We use this to access the theme from the BuildContext in all our widgets
/// We don't use riverpod here so we can get the theme from the context and regular widgets
class ThemeProvider extends InheritedNotifier<AppTheme> {
  const ThemeProvider({
    super.key,
    super.notifier,
    required super.child,
  });

  @override
  bool updateShouldNotify(covariant InheritedNotifier<AppTheme> oldWidget) {
    ...
  }

  static AppTheme of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<ThemeProvider>()!.notifier!;
}
```

```dart
class MyApp extends StatelessWidget {
  const MyApp({
    super.key,
  });

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ThemeProvider(
      notifier: AppTheme.uniform(
        themeFactory: const UniversalThemeFactory(),
        lightColors: ApparenceKitColors.light(),
        darkColors: ApparenceKitColors.dark(),
        textTheme: ApparenceKitTextTheme.build(),
        defaultMode: ThemeMode.light,
      ),
      child: Builder(builder: (context) {
        return MaterialApp(
          title: 'Flutter Pro Starter Kit',
          initialRoute: 'home',
          theme: ThemeProvider.of(context).light,
          darkTheme: ThemeProvider.of(context).dark,
          themeMode: ThemeProvider.of(context).mode,
```

- **Correction:** `StatelessWidget.build` takes only a `BuildContext` ([StatelessWidget.build](https://api.flutter.dev/flutter/widgets/StatelessWidget/build.html)); `WidgetRef ref` belongs to Riverpod's `ConsumerWidget` and contradicts the "We don't use riverpod here" comment. The article's line is wrong; use:

```dart
  Widget build(BuildContext context) {
```

- `initialRoute: 'home'` is named-route style; the flutter skill routes with go_router ([flutter ROUTING-AND-DEEP-LINKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ROUTING-AND-DEEP-LINKS.md)).
- Shortcut getters on `BuildContext`, verbatim (the extension is named `ThemeExtension` in the article; see [the naming note](#two-things-called-theme-extension)):

```dart
extension ThemeExtension on BuildContext { // See our tip on [creating theme extensions](/flutter-tips/create-flutter-theme-extension/)
  // access the theme from anywhere in the app using context.theme
  ApparenceKitThemeData get theme => ThemeProvider.of(this).current;
  // access the color palette from anywhere in the app using context.colors
  ApparenceKitColors get colors => ThemeProvider.of(this).current.colors;
  // access the text theme from anywhere in the app using context.textTheme
  ApparenceKitTextTheme get textTheme => ThemeProvider.of(this).current.textTheme;
  // access the theme mode from anywhere in the app using context.themeMode
  ThemeMode get themeMode => ThemeProvider.of(this).mode;
  // toggle the theme mode from anywhere in the app using context.toggleTheme
  void toggleTheme() => ThemeProvider.of(this).toggle();
}
```

- Persisting the user's choice across launches is the official `ThemeSwitch` / `ThemeRepository` example in [flutter DATA-AND-NETWORKING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/DATA-AND-NETWORKING.md); the provider above is a context-only pattern and does not persist.

## Tweak one text property

[ApparenceKit](https://apparencekit.dev/flutter-tips/pass-text-style-efficiently-to-widgets/)

- To change one property of the inherited text style, use `DefaultTextStyle.merge` instead of `Theme.of(context).textTheme... .copyWith()`: "you only need to include the properties you want to change or add. `merge` takes the existing style from above it in the widget tree and applies your new style on top." Setting only `color` keeps the inherited size, weight and family.
- Official detail: `merge` "cannot be used to override the `maxLines` property of the ancestor with the value null, since null here is used to mean 'defer to ancestor'"; to remove an inherited `maxLines`, read `DefaultTextStyle.of` and build a new `DefaultTextStyle` directly. A passed `textHeightBehavior` replaces the inherited one completely. [DefaultTextStyle.merge](https://api.flutter.dev/flutter/widgets/DefaultTextStyle/merge.html)

## Colors, fonts and spacing

- **One or two colors:** "Try making your app with one or two colors." "(Please note that black, white, and greys are exceptions and are not considered as colors.)" The article cites Facebook, Instagram, Twitter and Youtube as apps that "don't use a lot of colors". [ApparenceKit](https://apparencekit.dev/blog/flutter-theme-made-easy/)
- **Two fonts at most:** "Stick to a maximum of two fonts: one for important titles and another for general text." [ApparenceKit](https://apparencekit.dev/flutter-tips/app-design-tips/) ("Our designer at Apparence tend to limit his usage to 2 fonts." [ApparenceKit](https://apparencekit.dev/blog/flutter-theme-made-easy/))
- **Two or three sizes per page:** "Try to use only 2 or 3 different font sizes on any given page." [ApparenceKit](https://apparencekit.dev/flutter-tips/app-design-tips/)
- **Hierarchy by weight and color:** "Make important information stand out by using bolder weights or distinct colors. For less crucial details, like descriptions or alternative texts, you can decrease their opacity or use lighter colors." [ApparenceKit](https://apparencekit.dev/flutter-tips/app-design-tips/) Lowered opacity must still pass the contrast values in [flutter ACCESSIBILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ACCESSIBILITY.md#design-values).
- **The 8pt rule:** "all the measurements in your design (things like the width and height of elements, and the space between them) should be a multiple of 8. This means using values like 8, 16, 24, 32, and so on." [ApparenceKit](https://apparencekit.dev/flutter-tips/spacing-design-8-rule/)
- **A spacer so code reads `AppSpacer.p16()`** instead of `SizedBox(width: 16)`. Verbatim [ApparenceKit](https://apparencekit.dev/flutter-tips/spacing-design-8-rule/):

```dart
class AppSpacer extends StatelessWidget {
  final double? width;
  final double? height;

  const AppSpacer._({Key? key, this.width, this.height}) : super(key: key);

  factory AppSpacer.p32() => const AppSpacer._(height: 32, width: 32);
  factory AppSpacer.p24() => const AppSpacer._(height: 24, width: 24);
  factory AppSpacer.p16() => const AppSpacer._(height: 16, width: 16);
  factory AppSpacer.p8() => const AppSpacer._(height: 8, width: 8);

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      height: height,
    );
  }
}
```

  It compiles; current style passes the key with `super.key` ([flutter VERSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/VERSIONS.md)): `const AppSpacer._({super.key, this.width, this.height});`. Each factory sets width and height, so in a `Row` `AppSpacer.p16()` also adds 16 of height.

## Prove it

- Search the app for `Color(0x`: hex colors appear only in the palette file and the `ThemeExtension` factories, never in widgets.
- `Theme.of(context).extension<...>()` calls appear only inside the `BuildContext` getter; widgets use `context.colors`.
- No `ColorScheme(... background:` / `onBackground:` and no `headline1`.
- Toggle light and dark at runtime: every screen changes without a restart and no widget has an `if (dark)` branch.
- Count distinct `fontFamily` values (at most two) and font sizes per screen (two or three); spacing values are multiples of 8.
