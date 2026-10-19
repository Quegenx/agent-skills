# Images and typography

How images and text arrive on screen without popping, jumping or looking off-brand in Flutter: a disk cache for network images, placeholders and cross-fades, preloading icons and Google Fonts during the splash screen, tabular figures, the yellow-underline default text style, and selection colors. Source: FlutterPro tips by Kamran Bekirov (flutterpro.design), third-party community advice that leans on pub packages (`extended_image`, `image_fade`, `flutter_svg`, `google_fonts`), not Flutter team docs. Where a tip differs from the official-docs [flutter](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/SKILL.md) skill, both sides are stated and tagged. Reserving an image's box so the layout does not jump is covered below.

**Contents:** [Version notes](#version-notes) · [Reserve image space](#reserve-image-space) · [Cache network images on disk](#cache-network-images-on-disk) · [Cross-fade images in](#cross-fade-images-in) · [Preload icons during the splash](#preload-icons-during-the-splash) · [Preload Google Fonts](#preload-google-fonts) · [Tabular figures](#tabular-figures) · [Yellow underlines](#yellow-underlines) · [Selection color](#selection-color) · [Line height, wrapping and trim](#line-height-wrapping-and-trim) · [Prove it](#prove-it)

## Version notes

- No article states a Flutter, Dart or package version. Check `svg.cache`, `SvgAssetLoader`, `cacheKey(null)` and `loadBytes(null)` against the current `flutter_svg`, and `GoogleFonts.pendingFonts` and `extended_image`'s `cache: true` against their current packages, before copying.
- `Colors.purple.withValues(alpha: 0.3)` uses the current API (`withOpacity` is deprecated, [flutter VERSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/VERSIONS.md)).

## Reserve image space

[FlutterPro](https://flutterpro.design/details/reserve-image-space): an image widget has no size until its bytes arrive, then "snaps to its real height and pushes everything below it down". Fix: "decide the image's box before the bytes show up".

Known ratio, `AspectRatio`:

```dart
AspectRatio(
  aspectRatio: 16 / 9,
  child: Image.network(
    url, fit: BoxFit.cover,
  ),
)
```

Known exact size (avatars, thumbnails, list leading icons):

```dart
SizedBox(
  width: 48,
  height: 48,
  child: Image.network(
    url, 
    fit: BoxFit.cover,
  ),
)
```

The parent fixes the height (a fixed-height product card): `Expanded` gives the image what is left:

```dart
SizedBox(
  height: 320,
  child: Column(
    children: [
      Expanded(
        child: Image.network(
          url, fit: BoxFit.cover,
        ),
      ),
      // title, price, button
    ],
  ),
)
```

- "One catch with `Expanded`: it needs a bounded main axis. `Column` has one, but `ListView` doesn't (its scroll axis is infinite)." The errors this throws are in [flutter-ui LAYOUT-AND-RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md#fix-layout-errors). [FlutterPro](https://flutterpro.design/details/reserve-image-space)
- Not fixes: "`fit` does not reserve space. `BoxFit.cover`, `.fitWidth`, any of them only decide how the image paints inside a box that's *already* been sized." And "Setting only a width still leaves the height to the image's real ratio, unknown until it loads." [FlutterPro](https://flutterpro.design/details/reserve-image-space)
- To cross-fade the image in once loaded instead of popping, the tip points to the `image_fade` package; see [IMAGES-AND-TYPOGRAPHY.md](IMAGES-AND-TYPOGRAPHY.md#cross-fade-images-in) (the official-docs choice there is built-in `FadeInImage`). [FlutterPro](https://flutterpro.design/details/reserve-image-space)

## Cache network images on disk

[FlutterPro](https://flutterpro.design/details/cache-network-images): "Network images in Flutter are only cached in memory. Restart the app and every image downloads again." (The flutter skill's networking samples use bare `Image.network`, [flutter DATA-AND-NETWORKING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/DATA-AND-NETWORKING.md).)

Disk cache with [`extended_image`](https://pub.dev/packages/extended_image), `cache: true`:

```dart
ExtendedImage.network(
  url, 
  cache: true,
)
  
// or as an ImageProvider
ExtendedNetworkImageProvider(
  url, 
  cache: true,
)
```

"While it loads, show a subtle box instead of a spinner, fade the image in when it arrives, and show a broken image icon when it fails." `SmartNetworkImage` does all of it: [FlutterPro](https://flutterpro.design/details/cache-network-images)

```dart
import 'package:extended_image/extended_image.dart';
import 'package:flutter/material.dart';
import 'package:image_fade/image_fade.dart';
  
class SmartNetworkImage extends StatelessWidget {
  const SmartNetworkImage(
    this.url, {
    super.key,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
  });
  
  final String url;
  final double? width;
  final double? height;
  final BoxFit fit;
  
  @override
  Widget build(BuildContext context) {
    return ImageFade(
      image: ExtendedNetworkImageProvider(
        url, 
        cache: true,
      ),
      width: width,
      height: height,
      fit: fit,
      placeholder: Container(
        color: Colors.grey.shade100,
      ),
      errorBuilder: (context, exception) {
        return Container(
          color: Colors.grey.shade100,
          child: Icon(
            Icons.broken_image_outlined,
            size: 20,
            color: Colors.grey.shade400,
          ),
        );
      },
    );
  }
}
```

## Cross-fade images in

[FlutterPro](https://flutterpro.design/details/smooth-image-loading): "By default, images in Flutter load with no transition. They just pop in." Use [`image_fade`](https://pub.dev/packages/image_fade) "to show a placeholder while loading, then cross-fade to the loaded image or an error widget".

**Two ways to fade:**

- **[Flutter docs, via flutter skill]:** "Avoid `Opacity` in an animation; use `AnimatedOpacity`, or `FadeInImage` for fading images (a GPU fragment shader)" ([flutter PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/PERFORMANCE.md#paint-cost-savelayer-opacity-clips)). `FadeInImage` is built in, no package.
- **[FlutterPro]:** the third-party `image_fade` package, for the same fade plus a placeholder and an error cross-fade.

```dart
ImageFade(
  image: NetworkImage(
    'https://example.com/image.png',
  ),
  // or 
  // image: AssetImage(
  //   'assets/image.png',
  // ),
  placeholder: Container(
    color: Colors.grey.shade100,
  ),
  errorBuilder: (context, exception) {
    return Container(
      color: Colors.grey.shade100,
      child: Icon(
        Icons.error_outline,
        size: 20,
        color: Colors.grey.shade400,
      ),
    );
  },
)
```

- "`image` takes any `ImageProvider`: `NetworkImage`, `AssetImage`, `CachedNetworkImageProvider`, `ExtendedNetworkImageProvider`, etc." It also supports `width`, `height`, `fit`, `duration`, `syncDuration` "and more". [FlutterPro](https://flutterpro.design/details/smooth-image-loading)
- "Keep placeholders simple: a solid light grey or a shimmer. Avoid loading indicators, they're distracting." "Same for error states: keep them subtle. A small icon at most, no technical messages." Values in both samples: placeholder `Colors.grey.shade100`, icon `size: 20` in `Colors.grey.shade400`. [FlutterPro](https://flutterpro.design/details/smooth-image-loading)

## Preload icons during the splash

[FlutterPro](https://flutterpro.design/details/precache-icons): icons pop in one or two frames late because "Flutter loads assets into memory when a widget first asks for them, and decoding takes time." Fix: preload them during the splash screen. For SVGs, [`flutter_svg`](https://pub.dev/packages/flutter_svg) has its own mechanism; for everything else, `precacheImage`. This helper handles both:

```dart
import 'package:flutter_svg/flutter_svg.dart';
  
Future<void> precacheAssets({
  required BuildContext context, 
  List<String> paths,
}) async {
  for (final String path in paths) {
    if (path.endsWith('.svg')) {
      final SvgAssetLoader loader = SvgAssetLoader(path);
        
      await svg.cache.putIfAbsent(
        loader.cacheKey(null),
        () => loader.loadBytes(null),
      );
    } else {
      await precacheImage(AssetImage(path), context);
    }
  }
}
```

Fix (not in the article): as printed, `List<String> paths` is a named parameter that is neither `required`, nullable nor defaulted. Dart: "If you don't provide a default value or mark a named parameter as `required`, their types must be nullable" ([dart.dev](https://dart.dev/language/functions)). The fix adds `required`, which keeps the call sites below working:

```dart
  required List<String> paths,
```

Await what the first screen shows; load the rest in the background: [FlutterPro](https://flutterpro.design/details/precache-icons)

```dart
Future<void> preloadAssets(BuildContext context) async {
  // User sees these when app opens, wait for them
  await precacheAssets(
    context: context,
    paths: [
      'assets/icons/nav-bar/home.svg',
      'assets/icons/nav-bar/search.svg',
      'assets/icons/nav-bar/profile.svg',
      'assets/images/logo.png',
    ],
  );
  
  // User won't see these yet, load in the background
  precacheAssets(
    context: context, 
    paths: [
      'assets/icons/account/settings.svg',
      'assets/icons/account/notifications.svg',
    ],
  );
}
```

"If you use asset codegen like `flutter_gen`, you can use `Assets.icons.values` instead of listing paths manually." [FlutterPro](https://flutterpro.design/details/precache-icons) Here `flutter_gen` means the FlutterGen asset codegen package, not the synthetic `package:flutter_gen` for localization that the flutter skill says was removed after 3.32 ([flutter LOCALIZATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/LOCALIZATION.md)). Same name, different thing.

## Preload Google Fonts

[FlutterPro](https://flutterpro.design/details/google-fonts-glitch): "The google_fonts package downloads fonts when first used. That means on a fresh install, users see your text in the default font for a split second before it swaps to your chosen one." Preload with `GoogleFonts.pendingFonts` during the splash; load the rest in the background:

```dart
Future<void> preloadFonts() async {
  await GoogleFonts.pendingFonts([
    GoogleFonts.inter(fontWeight: FontWeight.w400),
    GoogleFonts.inter(fontWeight: FontWeight.w700),
  ]);
  
  // Preload other weights in the background
  _preloadOtherFonts();
}
  
Future<void> _preloadOtherFonts() async {
  await GoogleFonts.pendingFonts([
    GoogleFonts.inter(fontWeight: FontWeight.w600),
  ]);
}
```

- "`GoogleFonts.inter()` doesn't load the whole font. It only loads weight 400, normal style. So when preloading, specify the exact weights and styles you've used in your app. If you used `w700` on a heading and `w400` italic on a caption, preload both." [FlutterPro](https://flutterpro.design/details/google-fonts-glitch)
- The rule: "preload fonts you need immediately, then load the rest in the background." [FlutterPro](https://flutterpro.design/details/google-fonts-glitch) [flutter-ui SCALE-KIT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/SCALE-KIT.md) sets `GoogleFonts.inter` as a default font and says nothing about preloading.

## Tabular figures

[FlutterPro](https://flutterpro.design/details/tabular-figures): "in most fonts a `1` is thinner than an `8`", so changing digits shift whatever follows them. Tabular figures make every digit the same width:

```dart
Text(
  '00:48',
  style: TextStyle(
    fontFeatures: [
      FontFeature.tabularFigures(),
    ],
  ),
);
```

- Three places for it: numbers that change (timers, counters, prices); numbers in a list (tables, totals), so they line up; long numbers (card numbers, codes) read digit by digit. [FlutterPro](https://flutterpro.design/details/tabular-figures)
- Not global: "The cost is that equal-width digits look a little loose inside normal sentences, since the narrow ones get padded. So it is not a global setting." [FlutterPro](https://flutterpro.design/details/tabular-figures)
- "The rule is: if the number changes or lines up with others, give it tabular figures. If it just sits in a sentence, leave it." [FlutterPro](https://flutterpro.design/details/tabular-figures)

## Yellow underlines

[FlutterPro](https://flutterpro.design/details/yellow-underlines): a `Text` with no `Scaffold` above it (an overlay, a custom dialog, a hero flight) shows red text with double yellow underlines. That is deliberate: "`MaterialApp` sets the app-wide default text style to an intentionally ugly one: red, monospace, 48px, bold, yellow double underline. Only a `Material` replaces it with your theme's style. `Scaffold` carries one".

- "`CupertinoApp` sets a normal default, `WidgetsApp` none at all, plain white text." [FlutterPro](https://flutterpro.design/details/yellow-underlines)
- Your `style` merges over the default: "`fontSize` and `color` win, but nobody sets `decoration`, so the yellow underline always stays. The red and the rest show up only on texts with no style of their own." [FlutterPro](https://flutterpro.design/details/yellow-underlines)

Fixes by location: [FlutterPro](https://flutterpro.design/details/yellow-underlines)

- A full page: wrap it in a `Scaffold`.
- Not a page: a transparent `Material` (no visual change):

```dart
Material(
  type: MaterialType.transparency,
  child: ...,
)
```

- A single text (for example in a hero flight):

```dart
style: TextStyle(
  decoration: TextDecoration.none,
)
```

## Selection color

[FlutterPro](https://flutterpro.design/details/selection-color): `MaterialApp` picks cursor and selection colors for you. `textSelectionTheme` on `ThemeData` "applies to `TextField`, `SelectableText`, and anything else that uses text selection":

```dart
ThemeData(
  textSelectionTheme: TextSelectionThemeData(
    selectionColor: Colors.purple.withValues(alpha: 0.3),
    selectionHandleColor: Colors.purple,
    cursorColor: Colors.purple,
  ),
)
```

"Your accent or brand color works best here. Selection sits behind text, so contrast matters. Light brand colors usually work as is. Dark ones can clash with the text, so add some opacity until it reads cleanly. Cursor and handles can stay at full color, they're small enough." The article gives no contrast ratio; the flutter skill's ratios are in [flutter ACCESSIBILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ACCESSIBILITY.md#design-values). [FlutterPro](https://flutterpro.design/details/selection-color)

## Line height, wrapping and trim

Owner's rules, checked against api.flutter.dev; the full CSS-to-Flutter list is [flutter-ui RESPONSIVE-UNITS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/RESPONSIVE-UNITS.md#the-parallel-list).

- **Space by the line, not magic numbers** (CSS `lh`). A line is `fontSize * TextStyle.height` tall; `StrutStyle` fixes the line height for a whole paragraph ([StrutStyle](https://api.flutter.dev/flutter/painting/StrutStyle-class.html)); `leadingDistribution: TextLeadingDistribution.even` splits the extra leading above and below like CSS, where the default `proportional` does not ([TextLeadingDistribution](https://api.flutter.dev/flutter/dart-ui/TextLeadingDistribution.html)). `TextStyle` has no `cap` unit.
- **No `text-wrap: balance` or `pretty`.** Don't truncate headings without a reason: wrapping is already the default (`DefaultTextStyle.softWrap` is `true`, [softWrap](https://api.flutter.dev/flutter/widgets/DefaultTextStyle/softWrap.html)), so leave `maxLines` and `TextOverflow.ellipsis` off headings. For chat bubbles and tags that should hug their text, `textWidthBasis: TextWidthBasis.longestLine`: "The width will be exactly enough to contain the longest line" ([TextWidthBasis](https://api.flutter.dev/flutter/painting/TextWidthBasis.html)).
- **No `text-box-trim`.** `TextHeightBehavior(applyHeightToFirstAscent: false)` uses the font's default ascent for the first line, so it only drops the extra line height above line one, and "only has effect if a non-null TextStyle.height is specified" ([applyHeightToFirstAscent](https://api.flutter.dev/flutter/dart-ui/TextHeightBehavior/applyHeightToFirstAscent.html)). Closer to CSS: `applyHeightToFirstAscent: false` with `applyHeightToLastDescent: false` and `TextLeadingDistribution.even`, then manual padding for the cap-height part.

## Prove it

- **Layout jump:** every network image sits in a sized box (`AspectRatio`, `SizedBox` with both sides, or `Expanded` in a bounded parent); on a throttled network, nothing below an image moves when it loads.

- **Disk cache:** load a screen of network images, kill and relaunch the app offline; images that use the disk-cached provider still show.
- **Loading states:** on a throttled network, image placeholders are a flat light box or shimmer (no spinner), images fade in instead of popping, and a broken URL shows a small icon with no error text.
- **Icons:** on a cold start, the first screen's icons appear in the first frame; the splash awaits only the first screen's assets.
- **Fonts:** on a fresh install, the first screen never shows the default font; every weight and style the app uses is in a `pendingFonts` call.
- **Digits:** a ticking timer, counter or price does not shift the text after it; numbers in a column line up; numbers inside sentences have no tabular figures.
- **Yellow underlines:** open every overlay, custom dialog and hero transition; no text shows red or double yellow underlines.
- **Selection:** select text in a `TextField` and a `SelectableText` in light and dark mode; the selection, cursor and handles use the brand color and the selected text stays readable.
