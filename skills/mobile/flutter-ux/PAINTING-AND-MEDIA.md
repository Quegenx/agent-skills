# Painting and media

Drawing with `CustomPainter` (redraw from a `ChangeNotifier`, round progress and timers, hit testing, `save`/`restore`, text and images on a canvas), turning a painter or a widget into an image, sharing it with `share_plus`, resizing and edge detection with `package:image`, cropping, playing sounds with `audioplayers`, and fullscreen video with `video_player`. Sources: ApparenceKit Flutter tips (apparencekit.dev) and FlutterPro's native-sharing tip (flutterpro.design), which state no Flutter, Dart or package version. Several blocks do not compile as published; each is followed by a labelled correction, with the official URL for API errors. Animation timing, springs and the neutral spinner's painter are in [MOTION-AND-FEEDBACK.md](MOTION-AND-FEEDBACK.md); paint cost (`saveLayer`, clips, `RepaintBoundary`) is in the [flutter PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/PERFORMANCE.md#paint-cost-savelayer-opacity-clips).

**Contents:** [Pick a capture route](#pick-a-capture-route) · [Redraw from a model](#redraw-from-a-model) · [Round progress and timers](#round-progress-and-timers) · [Hit testing a painter](#hit-testing-a-painter) · [Save and restore](#save-and-restore) · [Text on a canvas](#text-on-a-canvas) · [An image on a canvas](#an-image-on-a-canvas) · [Export a painter without showing it](#export-a-painter-without-showing-it) · [Capture an on-screen widget](#capture-an-on-screen-widget) · [Capture an offscreen widget](#capture-an-offscreen-widget) · [Share a file or a widget](#share-a-file-or-a-widget) · [Thumbnails and edges](#thumbnails-and-edges) · [Crop an image](#crop-an-image) · [Play a sound](#play-a-sound) · [Fullscreen video](#fullscreen-video) · [Share instead of download](#share-instead-of-download) · [Prove it](#prove-it)

## Pick a capture route

| What you have | Route | Section |
|---|---|---|
| A `CustomPainter`, not on screen | `ui.PictureRecorder` + `Canvas`, `toImage` | [Export a painter](#export-a-painter-without-showing-it) |
| A widget already on screen | `RepaintBoundary` + `GlobalKey`, `RenderRepaintBoundary.toImage` | [On-screen widget](#capture-an-on-screen-widget) |
| A widget that is never shown | `screenshot` package, `captureFromWidget` | [Offscreen widget](#capture-an-offscreen-widget) |

All three end in `toByteData(format: ui.ImageByteFormat.png)` or PNG bytes as a `Uint8List`. [ApparenceKit](https://apparencekit.dev/flutter-tips/export-flutter-canvas-to-image-programmatically/)

## Redraw from a model

[ApparenceKit](https://apparencekit.dev/flutter-tips/automatic-redraw-canvas-use-change-notifier/)

- Redraw a canvas without rebuilding the widget: the model `extends ChangeNotifier` and calls `notifyListeners()`; the painter passes it to `super(repaint: model)`. This drives repainting without rebuilding the widget that holds `CustomPaint`. [ApparenceKit](https://apparencekit.dev/flutter-tips/automatic-redraw-canvas-use-change-notifier/)
- **P2 correction:** `shouldRepaint` handles replacement delegates: return true when the new delegate represents different information. The source's unconditional `false` below assumes the delegate still represents the same information and the same notifying model; `repaint:` notifications do not make replacement comparisons unnecessary. [CustomPainter.shouldRepaint](https://api.flutter.dev/flutter/rendering/CustomPainter/shouldRepaint.html)

```dart
class WaveModel extends ChangeNotifier {
  // your data here
  ...

  void updateData() {
    // change your data
    notifyListeners(); // Tell everyone something changed!
  }
}
```

- Fix (not in the article): the published painter block has a stray `#### shouldRepaint Method` heading line inside the code, which does not compile. Corrected block, that line removed and nothing else changed:

```dart
class WorldPainter extends CustomPainter {
  final WaveModel model;

  WorldPainter({required this.model}) : super(repaint: model); // Link the painter to the model!

  @override
  void paint(Canvas canvas, Size size) {
    // your drawing code using model data
  }

  @override
  bool shouldRepaint(covariant WorldPainter oldDelegate) => false;
}
```


## Round progress and timers

- **Round progress.** Pass the animation to the painter so it redraws on every tick. For upload progress, start a new animation from the old value to the new one each time the value updates: the upload's duration is unknown, so animate after each update. The same painter can repeat forever as a loading indicator. No code in the source. [ApparenceKit](https://apparencekit.dev/flutter-tips/draw-animate-round-progress-custom-painter/)
- **Timer.** A `CircleTimerPainter` draws a full circle for the background and an arc whose length is the progress; `shouldRepaint` returns true only when the progress value changed. No code in the source. [ApparenceKit](https://apparencekit.dev/flutter-tips/draw-flutter-timer/)
- A complete arc painter (inset by half the stroke, `shouldRepaint` on its fields) is the neutral spinner in [MOTION-AND-FEEDBACK.md](MOTION-AND-FEEDBACK.md#neutral-spinner); a rounded linear bar is in [MOTION-AND-FEEDBACK.md](MOTION-AND-FEEDBACK.md#rounded-linear-progress).

## Hit testing a painter

[ApparenceKit](https://apparencekit.dev/flutter-tips/canvas-gesturedetector-radius-hit/)

- Wrap `CustomPaint` in a `GestureDetector` and override `hitTest(Offset position)` in the painter. Returning `true` makes the detector's callbacks (`onTap`, `onPanDown`, ...) fire; `false` ignores the tap. Use it to react only near something you drew, by radius:

```dart
Widget build(BuildContext context) {
  return GestureDetector(
    onTap: () => print("do what you want"), // This will fire when a tap is detected
    child: CustomPaint(
      size: Size.infinite,
      painter: WorldPainter(),
    ),
  );
}
```

```dart
class WorldPainter extends CustomPainter {
  // ... other painter code ...

  bool hitTest(Offset position) {
    var distance = position.distanceTo(this.location); // Calculate distance from tap to target
    return distance < detectionRadius; // Return true if within the radius
  }

  // ... rest of the painter class ...
}
```

- **Correction.** `Offset` has no `distanceTo` method; it has the `distance` and `distanceSquared` getters (https://api.flutter.dev/flutter/dart-ui/Offset-class.html). The official signature is `bool? hitTest(Offset position)`: `true` is a hit, `false` is outside, `null` defers to the default (every point a hit for a background painter, none for a foreground painter) (https://api.flutter.dev/flutter/rendering/CustomPainter/hitTest.html). The source omits `@override` and is wrong on `distanceTo`:

```dart
  @override
  bool? hitTest(Offset position) {
    final distance = (position - location).distance;
    return distance < detectionRadius;
  }
```

## Save and restore

[ApparenceKit](https://apparencekit.dev/flutter-tips/flutter-canvas-drawing-save-restore-tip/)

- `canvas.save()` snapshots the canvas state (translation, rotation, scale); `canvas.restore()` returns to the last save, so a transformed step does not leak into the next drawing.

```dart
canvas.save(); // Save the canvas state BEFORE translating
canvas.translate(size.width/2, size.height/2); // Translate (move) the canvas origin to the center
// ... now draw something relative to this new center point ...
canvas.drawLine(Offset(0, 0), model.offset, whitePainter); // Draw a line from the new origin
canvas.restore(); // Restore the canvas state back to what it was before the translate
// now any drawing here will happen relative to the original origin
```

- **[Flutter docs]:** `Canvas.save` "Saves a copy of the current transform and clip on the save stack" ([api.flutter.dev](https://api.flutter.dev/flutter/dart-ui/Canvas/save.html)); it is a different call from the expensive `saveLayer()` in the [flutter PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/PERFORMANCE.md#paint-cost-savelayer-opacity-clips).

## Text on a canvas

[ApparenceKit](https://apparencekit.dev/flutter-tips/draw-text-on-canvas/)

- Inside `CustomPainter.paint`: `TextStyle`, then `TextSpan`, then `TextPainter(text:, textDirection:)` (the direction is required), then `layout()` before painting, then `paint(canvas, offset)` where the offset is the top left.

```dart
final textStyle = TextStyle(
  color: Colors.black,
  fontSize: 40,
);
```

```dart
final textSpan = TextSpan(
  text: 'Hello, Canvas!',
  style: textStyle,
);

final textPainter = TextPainter(
  text: textSpan,
  textDirection: ui.TextDirection.ltr,
);
```

```dart
textPainter.layout();
```

```dart
final offset = Offset(50, 100); // Position (x, y)
textPainter.paint(canvas, offset);
```

- The source hard-codes `ui.TextDirection.ltr`; LTR and RTL text direction is in the [flutter LOCALIZATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/LOCALIZATION.md).

## An image on a canvas

[ApparenceKit](https://apparencekit.dev/flutter-tips/load-image-bytes-display-on-canvas/)

- `rootBundle.load(path)`, then `data.buffer.asUint8List()`, then `await decodeImageFromList(bytes)` (a `ui.Image`), then `canvas.drawImageRect(image, srcRect, dstRect, Paint())` in a painter.

```dart
final ByteData data = await rootBundle.load(path);
```

```dart
final Uint8List bytes = data.buffer.asUint8List();
```

```dart
final ui.Image image = await decodeImageFromList(bytes);
```

```dart
class MyPainter extends CustomPainter {
  final ui.Image image;

  MyPainter(this.image);

  @override
  void paint(Canvas canvas, Size size) {
    // Define source and destination rectangles
    final srcRect = Rect.fromLTWH(0, 0, image.width.toDouble(), image.height.toDouble());
    final dstRect = Rect.fromLTWH(0, 0, size.width, size.height);

    canvas.drawImageRect(image, srcRect, dstRect, Paint());
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
```

## Export a painter without showing it

[ApparenceKit](https://apparencekit.dev/flutter-tips/export-flutter-canvas-to-image-programmatically/)

- Uses: generating thumbnails, sharing images in the background, saving artwork. Steps: a `ui.PictureRecorder`, a `Canvas` on it, `canvas.scale(devicePixelRatio)` ("important"), `painter.paint(canvas, size)`, `recorder.endRecording()` (a `ui.Picture`), `toImage(width, height)` with the logical size times the pixel ratio, floored, then `toByteData(format: ui.ImageByteFormat.png)`. "Your canvas has to paint some things."

```dart
Future<Uint8List> toImage(BuildContext context, Size size) async {
  final devicePixelRatio = MediaQuery.of(context).devicePixelRatio;
  final recorder = ui.PictureRecorder();
  final canvas = Canvas(recorder);

  // important scale the canvas according to pixel ratio
  canvas.scale(devicePixelRatio);

  final painter = MyPainter(); // <-- this is your customPainter
  painter.paint(canvas, size);

  // export with according size
  final width = (size.width * devicePixelRatio).floor();
  final height = (size.height * devicePixelRatio).floor();

  // transform into a ui.image
  final imageResult = recorder.endRecording().toImage(width, height);

  // transform into a regular png byte array
  final byteData = await imageResult.toByteData(
    format: ui.ImageByteFormat.png,
  );

  return byteData!.buffer.asUint8List();
}

// PS: your canvas has to paint some things.
// Create your own CustomPainter first (MyPainter here)
```

- **Correction.** `Picture.toImage` is `Future<Image> toImage(int width, int height)` (https://api.flutter.dev/flutter/dart-ui/Picture/toImage.html), so the published block does not compile; await it:

```dart
  final imageResult = await recorder.endRecording().toImage(width, height);
```

- The source reads `MediaQuery.of(context).devicePixelRatio`. **[Flutter docs]:** prefer `MediaQuery.devicePixelRatioOf(context)`, which "will only rebuild the `context` when this specific attribute changes, not when *any* attribute changes" ([api.flutter.dev](https://api.flutter.dev/flutter/widgets/MediaQuery/devicePixelRatioOf.html)).

## Capture an on-screen widget

[ApparenceKit](https://apparencekit.dev/flutter-tips/create-image-from-flutter-widget/)

- Wrap the widget in a `RepaintBoundary` with a `GlobalKey`; find its `RenderRepaintBoundary`, call `toImage(pixelRatio: 3.0)`, then `toByteData` as PNG, then save to the gallery with `image_gallery_saver`.

```dart
final GlobalKey _repaintBoundaryKey = GlobalKey();

// ... inside your build method or wherever your widget is ...

RepaintBoundary(
  key: _repaintBoundaryKey,
  child: YourWidgetHere(), // <-- This is the widget you want to export
)
```

```dart
import 'package:image_gallery_saver/image_gallery_saver.dart';
import 'dart:ui'; // Import for Image type
import 'dart:typed_data'; // Import for Uint8List
import 'package:flutter/rendering.dart'; // Import for RenderRepaintBoundary

Future<void> exportImage() async {
  try {
    RenderRepaintBoundary boundary = _repaintBoundaryKey.currentContext!.findRenderObject() as RenderRepaintBoundary;
    ui.Image image = await boundary.toImage(pixelRatio: 3.0); // You can adjust pixelRatio
    ByteData? byteData = await image.toByteData(format: ui.ImageByteFormat.png);
    Uint8List? pngBytes = byteData?.buffer.asUint8List();

    if (pngBytes != null) {
      final result = await ImageGallerySaver.saveImage(
        pngBytes,
        quality: 100, // Image quality
        name: "my_widget_image_${DateTime.now().millisecondsSinceEpoch}.png", // File name
      );

      // Optional: Handle the result (e.g., show a success message)
      print(result); // Check result status
    }
  } catch (e) {
    // Handle any errors during the process
    print("Error exporting image: $e");
  }
}
```

- **Correction.** The block uses the `ui.` prefix but imports `dart:ui` without one; a prefix comes from `as` (https://dart.dev/language/libraries#specifying-a-library-prefix):

```dart
import 'dart:ui' as ui; // Import for Image type
```

- Golden tests also wrap a widget in a `RepaintBoundary` to focus the capture ([flutter TESTING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/TESTING.md)). This source does not mention permissions; ApparenceKit's permissions tip says iOS and Android require asking before the app saves to the photo gallery ([NOTIFICATIONS-AND-PERMISSIONS.md](NOTIFICATIONS-AND-PERMISSIONS.md)).

## Capture an offscreen widget

[ApparenceKit](https://apparencekit.dev/flutter-tips/create-image-from-flutter-widget-using-package/)

- To image a widget that is never shown, use the `screenshot` package: a `ScreenshotController`, then `captureFromWidget` with `targetSize` and `pixelRatio`.

```dart
import 'package:screenshot/screenshot.dart';
```

```dart
final controller = ScreenshotController();
```

```dart
final imgBytes = controller.captureFromWidget(
  widget,
  targetSize: const Size(320, 520), // Example size
  pixelRatio: 3, // Example quality
);
```

- **Correction.** `captureFromWidget` returns `Future<Uint8List>` (parameters: `widget`, `delay` defaulting to one second, `pixelRatio`, `context`, `targetSize`) (https://pub.dev/documentation/screenshot/latest/screenshot/ScreenshotController/captureFromWidget.html); without `await`, `imgBytes` is a `Future`, not bytes:

```dart
final imgBytes = await controller.captureFromWidget(
```

## Share a file or a widget

[ApparenceKit](https://apparencekit.dev/flutter-tips/share-image-in-flutter-app/)

- Share an existing file through the native share sheet with `share_plus`:

```dart
import 'package:share_plus/share_plus.dart';

await SharePlus.instance.share(ShareParams(
  files: [XFile(imageFile.path)],
  text: 'Check out this...',
  subject: 'My subject',
));
```

- Share a widget as an image: add `screenshot` and `path_provider`; build the widget offscreen inside its own `MaterialApp` and `Scaffold` (transparent background, `debugShowCheckedModeBanner: false`); `captureFromWidget(..., pixelRatio: 2.0, context: context)` ("Needed to build the widget tree"); write the bytes to `getTemporaryDirectory()`; share the temporary file's path.

```dart
import 'package:share_plus/share_plus.dart';
import 'package:screenshot/screenshot.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import 'dart:typed_data'; // For Uint8List

Future<void> shareMyWidget(BuildContext context) async {
  final screenshotController = ScreenshotController();

  // This is the widget you want to capture and share.
  // Replace `Text('My Awesome Stats!')` with your actual custom widget.
  final shareableWidget = MaterialApp(
    debugShowCheckedModeBanner: false, // Hide debug banner
    home: Scaffold(
      backgroundColor: Colors.transparent,
      body: Center(
        child: Text('My Awesome Stats!', style: TextStyle(fontSize: 24, color: Colors.black)), 
      ),
    ),
  );

  try {
    final Uint8List? imageBytes = await screenshotController.captureFromWidget(
      shareableWidget,
      pixelRatio: 2.0, // For better quality
      context: context, // Needed to build the widget tree
    );

    if (imageBytes == null) {
      print('Image capture failed.');
      return; // Handle if capture fails
    }

    final tempDir = await getTemporaryDirectory();
    final fileName = 'my_stats.png';
    final imageFile = File('${tempDir.path}/$fileName');
    await imageFile.writeAsBytes(imageBytes);

    await SharePlus.instance.share(ShareParams(
      files: [XFile(imageFile.path)],
      text: 'Check out my goals progress! 🎉',
      subject: 'My KUBBO Stats',
    ));
  } catch (e) {
    print('Error sharing widget: $e');
  }
}
```

- `SharePlus.instance.share(ShareParams(...))` is the API form the source uses; it states no `share_plus` version. `share_plus` is also on Apple's privacy-manifest SDK list in the [app-store-connect privacy file](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/PRIVACY-AND-COMPLIANCE.md).

## Thumbnails and edges

- **Thumbnail before upload** (saves bandwidth and storage): `decodeImage`, then `copyResize(image!, width: maxWidth)` (keeps the aspect ratio), then `encodeJpg(thumbnail, quality: quality)`. [ApparenceKit](https://apparencekit.dev/flutter-tips/create-image-thumbnail-flutter/)

```dart
import 'package:image/image.dart';

Future<List<int>> createJpg(File file, int maxWidth, int quality) async {
  var bytes = await file.readAsBytes();
  Image? image = decodeImage(bytes);
  var thumbnail = copyResize(image!, width: maxWidth);
  return encodeJpg(thumbnail, quality: quality);
}
```

- The source runs this on the calling isolate. The [flutter PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/PERFORMANCE.md#isolates) lists "processing or compressing photos" among the common uses for another isolate when it causes jank.
- **Edge detection:** apply a Laplacian kernel to every pixel with the `image` package's convolution function; it highlights where colors change quickly, usually the borders. No code or kernel values in the source. [ApparenceKit](https://apparencekit.dev/flutter-tips/extract-borders-from-image/)

## Crop an image

[ApparenceKit](https://apparencekit.dev/flutter-tips/how-to-crop-image-in-flutter/)

- A `Container` sets the size and alignment of the visible area; a `ClipRect` inside it; an `Image.asset` with its own `width` and `height` (may be larger than the box), `fit: BoxFit.none` (no scaling) and an `alignment` that picks which part shows.

```dart
Container(
  alignment: Alignment.topCenter,
  child: ClipRect(
    child: Image.asset(
      'assets/04.jpg',
      width: 400,
      height: 400,
      fit: BoxFit.none,
      alignment: Alignment.topCenter,
    ),
  ),
)
```

- A static crop like this is fine; the [flutter PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/PERFORMANCE.md#paint-cost-savelayer-opacity-clips) says "Avoid clipping in an animation; pre-clip the image."

## Play a sound

[ApparenceKit](https://apparencekit.dev/flutter-tips/how-to-play-sounds-in-flutter/)

- Play an asset with `audioplayers`. Replays need no prepare or reset step; `ReleaseMode.stop` releases the source when the sound finishes.

```dart
import 'package:audioplayers/audioplayers.dart';
```

```dart
await player.play(AssetSource("sounds/beep.wav"));
```

```dart
// This line stops the sound source when the sound finishes playing.
player.setReleaseMode(ReleaseMode.stop);
```

- The source never shows how `player` is created, and states no `audioplayers` version.
- ui-animation [ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PATTERNS.md) has a web example of a sound on completion (Honk).

## Fullscreen video

[ApparenceKit](https://apparencekit.dev/flutter-tips/play-video-fullscreen-flutter-aspect-ratio/)

- Add `video_player`. Place the player in a `Stack` with `Positioned.fill`; set `Scaffold(extendBodyBehindAppBar: true)` so the video goes behind the app bar.
- Wrap the player in a custom widget: `FittedBox(fit: BoxFit.cover)` around an `AspectRatio` whose ratio comes from the controller's value, so the video covers the screen without distortion at any screen size or orientation. No code in the source.

## Share instead of download

`SharePlus.instance.share(ShareParams(...))` is share_plus's instance API; the article gives no version, so check pub.dev at copy time. [FlutterPro](https://flutterpro.design/details/share-instead-of-download)

[FlutterPro](https://flutterpro.design/details/share-instead-of-download): a "Download" button usually drags in storage permission, handling the user saying no, finding the right public folder on Android, scoped storage, a different path on iOS, then hoping the user finds the file. Almost all of that only puts the file in a public folder, and right after, the user usually opens it or sends it. The OS already has a screen for that, the native share sheet: "Save to Files", AirDrop, Messages, Mail, WhatsApp.

So download the bytes, save them to the app's own cache, and pass the file to the share sheet. `getTemporaryDirectory()` (path_provider) needs no permission according to the source. The code below imports `dart:io`, so use it as a native file-sharing recipe; web code must not import `dart:io` ([Detect the platform](DEVICE-FEATURES.md#detect-the-platform)).

```dart
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:http/http.dart' as http;
import 'package:share_plus/share_plus.dart';

Future<XFile> _downloadToCache(String url, String filename) async {
  final http.Response response = await http.get(Uri.parse(url));

  final Directory dir = await getTemporaryDirectory();
  final File file = File('${dir.path}/$filename');
  await file.writeAsBytes(response.bodyBytes);

  return XFile(file.path);
}
```

Then open the share sheet:

```dart
Future<void> shareFile(String url) async {
  final XFile file = await _downloadToCache(url, 'invoice.pdf');

  await SharePlus.instance.share(
    ShareParams(files: [file]),
  );
}
```

- No `permission_handler`, no folders per platform, no "where did my file go". Show a loading state while the file downloads.
- **The rule:** "if "download" really means "let me do something with this file", let the OS show the options."
- **Status codes (two views, both tagged):** [Flutter docs, via flutter skill]: throw on any unexpected status code ([flutter SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/SKILL.md) rule 4, [flutter DATA-AND-NETWORKING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/DATA-AND-NETWORKING.md#making-requests)). [FlutterPro]: the sample writes `response.bodyBytes` without checking `response.statusCode`, so a 404 page would be shared as `invoice.pdf`. Add the check when copying.
- **Store side:** this is the Flutter form of App Review's "use the out-of-process picker or a share sheet rather than requesting full access" ([app-store-connect REVIEW-GUIDELINES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/REVIEW-GUIDELINES.md)) and avoids Google Play's access review for `MANAGE_EXTERNAL_STORAGE` ([google-play POLICY-AND-PREFLIGHT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/google-play/POLICY-AND-PREFLIGHT.md)).

## Prove it

- A notifying model reaches the painter through `repaint:`; a replacement delegate representing different information returns true from `shouldRepaint`. [CustomPainter.shouldRepaint](https://api.flutter.dev/flutter/rendering/CustomPainter/shouldRepaint.html)
- No `hitTest` calls `distanceTo`; every override is `@override bool? hitTest(Offset position)`.
- Every `canvas.save()` has a matching `canvas.restore()` in the same `paint` call.
- Every `TextPainter` calls `layout()` before `paint`.
- Every `Picture.toImage`, `RenderRepaintBoundary.toImage` and `captureFromWidget` call is awaited; files using `ui.` import `dart:ui as ui`.
- Offscreen exports scale the canvas by the pixel ratio and size the image as logical size times ratio.
- Saving to the gallery asks for the photo-gallery permission first; share flows write to `getTemporaryDirectory()`.
- Photo decoding and resizing that janks a frame runs in `Isolate.run` or `compute`.
- Fullscreen video shows no letterboxing and no stretching in portrait and landscape.
- **Share:** sharing a file triggers no permission prompt on either platform; a failed download shows an error, not a shared error page.
