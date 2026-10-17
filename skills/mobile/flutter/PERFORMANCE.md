# Performance

Keeping a Flutter app inside its frame budget, and measuring when it is not. "Flutter applications are performant by default, so you only need to avoid common pitfalls": rebuilding far more UI than expected each frame, "Building a large list of children directly, rather than using a ListView", and expensive paint effects (`saveLayer`, opacity, clips). What decides most outcomes is measuring correctly first: profile mode on a physical device, then DevTools to tell a slow UI thread (Dart code) from a slow raster thread (the scene). Widget structure is in [ARCHITECTURE.md](ARCHITECTURE.md), performance integration tests in [TESTING.md](TESTING.md), animation timing and curves in [../../frontend/ui-animation/SKILL.md](../../frontend/ui-animation/SKILL.md).

**Contents:** [Categories](#categories) · [Frame budget](#frame-budget) · [Build cost](#build-cost) · [const and caching subtrees](#const-and-caching-subtrees) · [Paint cost: saveLayer, opacity, clips](#paint-cost-savelayer-opacity-clips) · [Lists and grids](#lists-and-grids) · [Isolates](#isolates) · [Build modes](#build-modes) · [Profiling](#profiling) · [DevTools](#devtools) · [Impeller](#impeller) · [App size](#app-size) · [Prove it](#prove-it)

## Categories

- **Four categories,** matching the flutter/flutter GitHub labels: "perf: speed", "perf: memory", "perf: app size", "perf: energy". Pages: https://docs.flutter.dev/perf/metrics, /perf/faq, /perf/appendix.

## Frame budget

- **Target:** "Flutter aims to provide 60 frames per second (fps) performance, or 120 fps on devices that support it." That is about 16 ms per frame at 60 fps.
- **Split:** "you have 16ms for building, and 16ms for rendering on a 60Hz display. If latency is a concern, build and display a frame in 16ms _or less_. Note that means built in 8ms or less, and rendered in 8ms or less".
- **120 fps devices:** render "under 8ms (total)".
- **Faster than 16 ms** "improves battery life and thermal issues". Test on the lowest device you target.

## Build cost

- **Keep `build()` cheap.** It "can be invoked frequently when ancestor widgets rebuild", so avoid repetitive and costly work there, and avoid overly large single widgets.
- **Localize `setState()`** "to the part of the subtree whose UI actually needs to change".
- **Push state to the leaves.** For example, a dedicated ticking clock widget instead of a ticking screen.
- **Two kinds of stateful widget:** ones that allocate in `initState`, dispose in `dispose`, and never call `setState` or depend on InheritedWidgets are cheap ("built once then never update"); ones that use `setState` or depend on InheritedWidgets rebuild many times.
- **Minimize the nodes build creates.** "Ideally ... a single widget, and that widget would be a RenderObjectWidget".
- **Do not change subtree depth or widget types.** Always wrap in `IgnorePointer` and toggle `IgnorePointer.ignoring`. If depth must change, use a `GlobalKey` / `KeyedSubtree`.
- **Prefer a widget over a helper method.** "To create reusable pieces of UIs, prefer using a `StatelessWidget` rather than a function." "If the created widget is const, Flutter would short-circuit most of the rebuild work." Video: https://www.youtube.com/watch?v=IOyq-eTRhvo
- **`AnimatedBuilder`:** do not put a subtree that does not depend on the animation in the builder. Build it once and pass it as `child`. Rebuild traversal "stops when the same instance of the child widget as the previous frame is re-encountered" (the `TransitionBuilder` pattern; see the `SlideTransition` source).
- **Never override `operator ==` on `Widget` objects.** "It results in O(N²) behavior", and "even one override of `operator ==` can result in across-the-board performance degradation as the compiler can no longer assume that the call is always static". The only exception: leaf widgets where comparing is cheaper and the configuration rarely changes.
- **Strings in loops:** use `StringBuffer`. The `+` operator "creates a new `String` object on each concatenation"; `StringBuffer` concatenates once at `toString()`.
- **See rebuilds in the IDE:** Flutter Performance window → enable **Show widget rebuild information**. Android Studio and IntelliJ also have the Widget Rebuild Profiler.

## const and caching subtrees

- **"Use const widgets where possible.** (This is equivalent to caching a widget and re-using it.)"
- **Many small `const` widgets beat one large widget.** "Having lots of small `const` widgets improves rebuild times over having large, complex widgets. Flutter can reuse `const` widget instances".
- **Cache unchanging subtrees** in a final state variable ("massively more efficient").

## Paint cost: saveLayer, opacity, clips

- **`saveLayer()` is expensive.** It allocates an offscreen buffer and may trigger a render target switch, "particularly disruptive to rendering throughput" on mobile GPUs. It is required for cases such as dynamic overlapping semi-transparent shapes from a server.
  - **Debug it** with the `PerformanceOverlayLayer.checkerboardOffscreenLayers` switch in the DevTools Performance view.
  - **Minimize it:** precalculate and cache static overlapped shapes, refactor to avoid overlaps, ask package owners.
  - **Widgets that might trigger it:** `ShaderMask`, `ColorFilter`, `Chip` (if `disabledColorAlpha != 0xff`), `Text` (if there is an `overflowShader`).
- **Opacity:** use `Opacity` only when necessary. Drawing simple shapes or text with a semitransparent color is usually faster. Avoid `Opacity` in an animation; use `AnimatedOpacity`, or `FadeInImage` for fading images (a GPU fragment shader). Apply opacity to individual widgets rather than a parent group.
- **Clipping:** "Clipping doesn't call `saveLayer()` (unless explicitly requested with `Clip.antiAliasWithSaveLayer`)" but is still costly. "By default, clipping is disabled (`Clip.none`)". For rounded rectangles use `borderRadius` instead of a clip. Avoid clipping in an animation; pre-clip the image.
- **A static scene being faded or rotated:** a `RepaintBoundary` might help.
- **Raster cache:** "Because raster cache entries are expensive to construct and take up loads of GPU memory, cache images only where absolutely necessary."

## Lists and grids

- **"Be lazy!"** Use lazy builder methods with callbacks so only the visible portion is built. The default `ListView` "requires creating all items at once"; `ListView.builder()` "creates items as they're scrolled onto the screen."
- **Avoid constructors with a concrete `List` of children** (`Column()`, `ListView()`) when most children are not visible.
- **Give item extents.** `prototypeItem`, `itemExtent` or `itemExtentBuilder` are "more efficient than letting the children determine their own extent". Use `prototypeItem` / `itemExtent` for fixed-size items and `itemExtentBuilder` for different sizes.

```dart
ListView.builder(
  itemCount: items.length,
  prototypeItem: ListTile(title: Text(items.first)),
  itemBuilder: (context, index) {
    return ListTile(title: Text(items[index]));
  },
)
```

- **Avoid intrinsics.** An intrinsic pass (a second layout pass) happens when all cells must match the biggest or smallest cell. Find it with **Track layouts** in DevTools (events labeled '$runtimeType intrinsics'). Avoid it with a fixed cell size up front, or an "anchor" cell with a custom `RenderObject`.
- **Layout rule:** "Constraints go down. Sizes go up. Parent sets position." Large-screen grids are in [LAYOUT-AND-RESPONSIVE.md](LAYOUT-AND-RESPONSIVE.md#large-screens-and-foldables).

## Isolates

- **Flutter does all work on the main isolate by default** and adds a "paint frame" event 60 times per second. Work that cannot finish in a frame gap should move to another isolate.
- **"There is only one hard rule for when you should use isolates, and that's when large computations are causing your Flutter application to experience UI jank."**
- **Common uses:** reading from a local database, sending push notifications, parsing or decoding large files, processing or compressing photos, audio and video, converting media, async support with FFI, filtering complex lists or filesystems.
- **Messages are copied** between isolates, except immutable objects (String, unmodifiable bytes) and `Isolate.exit` (transfers ownership). "Both `Isolate.run` and `compute` use `Isolate.exit` under the hood."

```dart
// Produces a list of 211,640 photo objects.
// (The JSON file is ~20MB.)
Future<List<Photo>> getPhotos() async {
  final String jsonString = await rootBundle.loadString('assets/photos.json');
  final List<Photo> photos = await Isolate.run<List<Photo>>(() {
    final List<Object?> photoData = jsonDecode(jsonString) as List<Object?>;
    return photoData.cast<Map<String, Object?>>().map(Photo.fromJson).toList();
  });
  return photos;
}
```

- **Repeated work:** long-lived background workers with `Isolate.spawn()`, `Isolate.exit()`, `ReceivePort`, `SendPort` and `send()`; or the `worker_manager` package, `isolate_agents`, `IsolateNameServer`.
- **Plugins in a background isolate** need `BackgroundIsolateBinaryMessenger`:

```dart
void main() {
  // Identify the root isolate to pass to the background isolate.
  RootIsolateToken rootIsolateToken = RootIsolateToken.instance!;
  Isolate.spawn(_isolateMain, rootIsolateToken);
}

Future<void> _isolateMain(RootIsolateToken rootIsolateToken) async {
  // Register the background isolate with the root isolate.
  BackgroundIsolateBinaryMessenger.ensureInitialized(rootIsolateToken);

  // You can now use the shared_preferences plugin.
  SharedPreferences sharedPreferences = await SharedPreferences.getInstance();

  print(sharedPreferences.getBool('isDebug'));
}
```

- **Limits:**
  - Globals are copied, not shared.
  - Web does not support isolates; use `compute()`, which runs on the main thread on web. On mobile and desktop, `await compute(fun, message)` equals `await Isolate.run(() => fun(message))`.
  - No `rootBundle` and no `dart:ui` or widget work in spawned isolates.
  - Background isolates cannot receive unsolicited host messages (no long-lived Firestore listener; one-off queries are fine).
- **Dart-side isolate details** are in [../dart/ASYNC.md](../dart/ASYNC.md).

## Build modes

| Mode | What it is | How to run |
| --- | --- | --- |
| Debug | Assertions and service extensions on, optimized for fast dev cycles, DevTools can connect; web uses dartdevc, not minified. "Hot reload works _only_ in debug mode." "The emulator and simulator execute _only_ in debug mode." | Default for `flutter run` |
| Profile | Like release plus some service extensions (performance overlay) and tracing; disabled on emulator and simulator | `flutter run --profile` |
| Release | Assertions off, debug info stripped, debugging and service extensions off, optimized for startup, execution and size; not on simulator or emulator; web minified and tree-shaken (dart2js) | `flutter run --release`, `flutter build <target>` (`flutter help build` lists targets) |

## Profiling

- **Profile in profile mode.** "The default Flutter build creates an app in _debug_ mode, which is not indicative of release performance."
- **On a physical device.** "Almost all performance debugging for Flutter applications should be conducted on a physical Android or iOS device, with your Flutter application running in profile mode." Emulators use different hardware, debug asserts are expensive, and debug is JIT while profile and release are AOT ("JIT can cause the app to pause for JIT compilation"). Check "on the slowest device that your users might reasonably use."
- **Start profile mode:** VS Code `launch.json` `"flutterMode": "profile"`; Android Studio "Run > Flutter Run main.dart in Profile Mode"; CLI `flutter run --profile`. DevTools cannot connect to a Flutter web app in profile mode; use Chrome DevTools.
- **Tools:** Performance Overlay, DevTools Performance view, tracing with `dart:developer`, benchmarking through integration tests (jank, download size, battery, startup time; see [TESTING.md](TESTING.md)), Widget Rebuild Profiler (Android Studio / IntelliJ).
- **Threads:**
  - Platform thread: plugin code; not shown.
  - UI thread: all Dart code; builds the layer tree. "Don't block this thread!"
  - Raster thread: Skia and Impeller run here; it runs on the CPU.
  - I/O thread: not shown.
- **Performance overlay:** toggle it from the DevTools Performance view, the **P** key in `flutter run`, or in code. Each graph shows the last 300 frames, with white lines at 16 ms increments. The top graph (GPU) is the raster thread, the bottom is the UI thread.
  - "If a red bar appears in the UI graph, the Dart code is too expensive. If a red vertical bar appears in the GPU graph, the scene is too complicated to render quickly." When both are red, start with the UI thread.
  - GPU red but UI fine: look for unnecessary `saveLayer`, intersecting opacities, clips or shadows.
- **Slow Animations** in the inspector slows animations 5x.
- **First-run animation jank on mobile only:** "make sure you're using Flutter's default graphic renderer, Impeller."

## DevTools

- **Shipped with the SDK.** "DevTools is distributed as part of the Flutter SDK"; run `flutter upgrade` for the latest, or the `beta` / `main` channels for earlier access.
- **What it does:** inspect UI layout and state, diagnose jank, CPU profiling, network profiling, source-level debugging, memory, logs, "Analyze code and app size", "Validate deep links in your Android or iOS app."
- **Jank workflow:** start at Performance > Timeline, then the CPU profiler. Frequent GC events: "In most cases, it's not a problem."
- **Performance view** works for mobile and desktop; for web, timeline events go to Chrome DevTools. Use a profile build.
  - **Flutter frames chart** (UI and raster bars). Jank is a frame over about 16 ms (red). Shader compilation frames are dark red.
  - **Frame analysis tab:** hints for janky frames.
  - **Timeline events:** add your own with `dart:developer` `Timeline` and `TimelineTask`.
  - **Enhance tracing:** **Track Widget Builds**, **Track Layouts**, **Track Paints** (they may affect frame times).
  - **Rendering layer toggles:** Render Clip layers, Render Opacity layers, Render Physical Shape layers (shadows and elevation). If raster time drops with one disabled, reduce that effect.
  - **Snapshots:** import and export; "DevTools only supports importing files that were originally exported from DevTools."

## Impeller

- **Default:** "As of the 3.27 release, Impeller is the default rendering engine for both iOS and Android API 29+." Support details: https://flutter.dev/go/can-i-use-impeller
- **Why:** Impeller "precompiles a smaller, simpler set of shaders at engine-build time so they don't compile at runtime." All shaders and reflection are compiled offline and pipeline state objects are built up front, for predictable performance. It uses Metal and Vulkan and concurrency.
- **Per platform:**

| Platform | Status | Opt out |
| --- | --- | --- |
| iOS | "the **only supported** rendering engine on iOS with no ability to switch to Skia" | None |
| Android | Default on API 29+; below that or without Vulkan it "falls back to the legacy OpenGL renderer" automatically | Debugging: `flutter run --no-enable-impeller`. Deployed app: manifest entry below |
| Web | Uses Skia; "might use Impeller in the future" | n/a |
| macOS, Linux, Windows | "available and enabled by default as of Flutter 3.47. In a future release, the ability to opt out of using Impeller will be removed." | macOS Info.plist `<key>FLTEnableImpeller</key> <false />`; Linux `fl_dart_project_set_enable_impeller(project, FALSE);` in `linux/runner/my_application.cc`; Windows `project.set_impeller_switch(flutter::ImpellerSwitch::Disabled);` in `windows\runner\main.cpp` |

Android opt-out, in `AndroidManifest.xml` under `<application>`:

```xml
<meta-data
    android:name="io.flutter.embedding.android.EnableImpeller"
    android:value="false" />
```

- **Docs conflict:** the rendering-performance page still credits "Flutter's Skia engine" for default performance, while the Impeller page makes Impeller the default on iOS, Android API 29+ and desktop. Confirm in the current docs.
- **Filing Impeller bugs:** prefix the title with `[Impeller]` and include device and chip info, screenshots or recordings, and a zipped DevTools performance trace export.

## App size

- **Measure the right build.** Debug builds (`flutter run`) are not representative. Default release builds (`flutter build apk` / `flutter build ios`) are upload packages, not download size; the stores split by DPI and CPU architecture.
- **Android estimate:** `flutter build appbundle`, upload the .aab to Play Console, then **Android vitals -> App size**. "Download size is calculated based on an XXXHDPI (~640dpi) device on an arm64-v8a architecture."
- **iOS estimate:** `flutter build ipa --export-method development`, `open build/ios/archive/*.xcarchive`, then Distribute App → Development → App Thinning "all compatible device variants" → Strip Swift symbols, and read `App Thinning Size Report.txt`. The exact size requires uploading a release IPA to App Store Connect. "IPAs are commonly larger than APKs".
- **Size analysis:** add `--analyze-size` to `flutter build apk|appbundle|ios|linux|macos|windows` (since Flutter 1.22 / DevTools 0.9.1). It writes `*-code-size-analysis_*.json`; open it with `dart devtools` → "Open app size tool", and diff two JSON files. On iOS it creates a .app, not an IPA.
- **Reduce size:**
  - `--split-debug-info` "can dramatically reduce code size".
  - Remove unused resources and minimize resources imported from libraries.
  - Compress PNG and JPEG.
  - Platform checks such as `if (Platform.isWindows)` let the compiler remove unreachable code.

## Prove it

- **Measured, not guessed:** every performance claim comes from `flutter run --profile` on a physical device (the slowest one you target), not a debug build or an emulator.
- **Frames:** the DevTools Performance view shows no red frames (over about 16 ms) on the flows you changed, and no dark red shader compilation frames.
- **Thread split:** for a janky frame, the overlay or frames chart says whether the UI or raster thread is red, and the fix matches (build cost for UI, `saveLayer`, opacity, clips or shadows for raster).
- **Rebuilds:** with **Show widget rebuild information** or **Track Widget Builds** on, an interaction rebuilds only the subtree that changed.
- **Lists:** search for `ListView(children:` and `Column(children:` with large or unknown counts; they use `.builder` constructors, with `itemExtent` or `prototypeItem` where items share a size.
- **No widget `operator ==` overrides:** search widget classes for `operator ==`.
- **Isolates:** heavy parsing (such as large JSON) runs in `Isolate.run` or `compute`, and the UI graph stays green during it.
- **Size:** `flutter build appbundle --analyze-size` (or the iOS equivalent) produces a size JSON; compare it against the previous build's.
