# Web shell

Flutter web's HTML shell: a progress bar while the engine boots, link preview cards and a browser tab title per page. Source: FlutterPro tips by Kamran Bekirov (flutterpro.design), third-party community advice, not Flutter team docs, checked against docs.flutter.dev where a sample needed it. Where a tip differs from the official-docs [flutter](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/SKILL.md) skill, both sides are stated and tagged. Routing itself is in [flutter ROUTING-AND-DEEP-LINKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ROUTING-AND-DEEP-LINKS.md). Native date pickers are in [NAVIGATION-AND-SHEETS.md](NAVIGATION-AND-SHEETS.md#date-picker-that-matches-the-platform), wakelock and social links in [DEVICE-FEATURES.md](DEVICE-FEATURES.md#keep-the-screen-awake-only-where-needed), and native file sharing in [PAINTING-AND-MEDIA.md](PAINTING-AND-MEDIA.md#share-instead-of-download).

**Contents:** [Version notes](#version-notes) · [Loading progress before the engine paints](#loading-progress-before-the-engine-paints) · [Link previews with Open Graph](#link-previews-with-open-graph) · [Browser tab title per page](#browser-tab-title-per-page) · [Prove it](#prove-it)

## Version notes

- No article states a Flutter, Dart or package version. [FlutterPro](https://flutterpro.design/details/flutter-web-loading-progress)

## Loading progress before the engine paints

[FlutterPro](https://flutterpro.design/details/flutter-web-loading-progress): Flutter web has to download `main.dart.js`, the CanvasKit (or skwasm) runtime, fonts and your assets before it can paint a single pixel. Depending on their size, that's "easily 3 to 5 seconds of staring at a blank white page".

No Dart needed: Flutter mounts into `<body>`, so anything you put there shows immediately and disappears on its own once the engine takes over. The source bar steps at loader lifecycle stages. [FlutterPro](https://flutterpro.design/details/flutter-web-loading-progress)

Markup in `web/index.html`:

```html
<body>
  <div class="progress-container">
    <div class="progress-bar"></div>
  </div>

  <script src="flutter_bootstrap.js" async></script>
</body>
```

Style it in `web/style.css` and link it from the head:

```html
<link rel="stylesheet" href="style.css" />
```

```css
body {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  margin: 0;
  background-color: #ffffff;
}

.progress-container {
  width: 120px;
  height: 8px;
  background-color: #FAFAFA;
  border-radius: 10px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  width: 0;
  background-color: #B591FF;
  transition: width 0.4s ease;
}
```

Make it move with a custom `web/flutter_bootstrap.js` next to `index.html`. "If the file exists, Flutter uses it instead of the auto-generated one." Hook into the loader stages:

```js
{{flutter_js}}
{{flutter_build_config}}

const bar = document.querySelector('.progress-bar');
const setProgress = (pct) => { bar.style.width = pct + '%'; };

setProgress(20); // bootstrap running

_flutter.loader.load({
  onEntrypointLoaded: async function (engineInitializer) {
    setProgress(50); // main.dart.js downloaded
    const appRunner = await engineInitializer.initializeEngine();
    setProgress(80); // engine ready
    await appRunner.runApp();
    // Flutter has taken over the page, nothing else to do
  },
});
```

- **Stage weights, not measured completion:** the source sets 20, 50 and 80 as constants at bootstrap, entrypoint-loaded and engine-ready stages. These are author-chosen weights, not byte or workload measurements. P3 correction: the old "Real milestones, not fake percentages" line overstated what the sample measures. This follows from the literal sample above and the documented [loader lifecycle](https://docs.flutter.dev/platform-integration/web/initialization). [FlutterPro](https://flutterpro.design/details/flutter-web-loading-progress)
- **Pitfall:** everything here ships as plain HTML and CSS with the initial page request. "Don't load a 2MB animated background, or you'll be solving one loading problem by creating another."
- **Official check** (https://docs.flutter.dev/platform-integration/web/initialization): a custom `flutter_bootstrap.js` needs the `{{flutter_js}}` token, the `{{flutter_build_config}}` token and a call to `_flutter.loader.load()`; the sample has all three. When you provide your own `onEntrypointLoaded`, "the `config` that you pass to `_flutter.loader.load()` is **not** forwarded to the engine automatically"; pass it to `initializeEngine()` yourself, for example `initializeEngine({ renderer: 'canvaskit' })`.

## Link previews with Open Graph

[FlutterPro](https://flutterpro.design/details/flutter-web-og-image): by default a Flutter web link shares as a bare URL (WhatsApp, Slack, X, anywhere). A few meta tags in the `<head>` of `web/index.html` give it a preview card with a title, description and image: Open Graph plus a few X-specific tags.

The source's HTML block used a real product's identity and URLs. Use the existing [link-preview markup rules](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/LINK-PREVIEWS.md) for the selected product instead. [FlutterPro](https://flutterpro.design/details/flutter-web-og-image)

- **`og:image` has to be an absolute URL.** A relative path like `og-image.png` gets ignored.
- **Size it at least 1200×630.** Meta: "Use images that are at least 1200 x 630 pixels", with a ratio "as close to 1.91:1" (https://developers.facebook.com/docs/sharing/webmasters/images). The line said "Size it 1200×630", an exact size where Meta gives a minimum.
- **`twitter:card` picks the X layout.** The archived X Cards markup says `twitter:image` falls back to `og:image`, and "If an og:type, og:title and og:description exist in the markup but twitter:card is absent, then a summary card may be rendered"; set `twitter:card` to `summary_large_image` for the wide image. The line said X "only sometimes falls back to `og:image`". Per-platform rules are in [seo LINK-PREVIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/LINK-PREVIEWS.md#x-cards).
- The fuller tag set for a marketing site (site name, locale, a share image per language) is in [landing-page-ui DISCOVERY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/DISCOVERY.md).

## Browser tab title per page

[FlutterPro](https://flutterpro.design/details/browser-tab-title): the web app's title shows in the tab, history, bookmarks and autocomplete bar. Leave it the same on every page and a user with several tabs open can't tell them apart.

The tab title is whatever the nearest `Title` widget above the current page says. Wrap a page in one and that page owns its tab title:

The source wraps the page in `Title`, with its page/app title, `color: Theme.of(context).colorScheme.surface` and a `Scaffold` child. Its printed title named a real product, so that sample block is omitted. [FlutterPro](https://flutterpro.design/details/browser-tab-title)

Doing this on every page is easy to forget. Wrap once instead, in `MaterialApp`'s `builder`, the single place every page flows through (its `child` is the active page). A fixed string there would repeat one title everywhere, so the wrapper reads the current route:

```dart
MaterialApp.router(
  routerConfig: goRouter,
  builder: (context, child) {
    return RouteTitle(
      child: child!,
    );
  },
)
```

"This uses go_router, adapt it to your own routing state." `RouteTitle` watches the global `goRouter` and rebuilds the `Title` on every navigation:

```dart
class RouteTitle extends StatelessWidget {
  final Widget child;

  const RouteTitle({
    super.key,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: Listenable.merge([
        goRouter.routerDelegate,
        goRouter.routeInformationProvider,
      ]),
      builder: (context, _) {
        final String path = goRouter.routeInformationProvider.value.uri.path;

        return Title(
          title: titleForPath(path),
          color: Theme.of(context).colorScheme.surface,
          child: child,
        );
      },
    );
  }
}
```

`titleForPath` is yours: map the path to a readable name, with a fallback so the tab is never blank (a list-pattern `switch`, see [dart LANGUAGE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/dart/LANGUAGE.md)):

The source's `titleForPath` helper parses `Uri.parse(path).pathSegments`, maps `billing` to Billing, `project/<id>/insights` to Insights plus the ID, and `project/<id>` to that ID, with a nonblank app-name fallback. Its printed helper hardcoded a real product's brand, so that sample block is omitted; supply the selected app's name and route map. [FlutterPro](https://flutterpro.design/details/browser-tab-title)

- **`Title.color` is required and must be opaque** (alpha `0xFF`). It feeds the Android task switcher and is ignored on web.
- **`onGenerateTitle` can't track routes:** it only reruns on app rebuild, not navigation. The flutter skill uses it for the one localized app title ([flutter LOCALIZATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/LOCALIZATION.md)); per-route titles need `Title`.

## Prove it

- **Boot stages:** the bar follows the loader callbacks and disappears when the app paints; describe its 20/50/80 values as stage weights, not measured download completion. [Flutter initialization](https://docs.flutter.dev/platform-integration/web/initialization)
- **Link previews:** a link pasted into a chat or a card validator shows the title, description and an image of at least 1200×630; `og:image` is absolute, and any explicit `twitter:image` is absolute; X may use its documented OG fallback ([X Cards](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/LINK-PREVIEWS.md#x-cards)).
- **Tab titles:** navigating between pages changes the browser tab title each time; an unknown path shows the fallback, never a blank tab; `Title.color` is opaque.
