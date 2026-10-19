# Testing recipes (community)

Community widget-test and plugin-test recipes from ApparenceKit's tips and blog posts (apparencekit.dev, a third-party Flutter starter kit; no article states a Flutter version): isolate work in widget tests, `ValueVariant`, screen sizes, typed finders, expected errors, go_router navigation; the four layers of plugin tests are in [PLUGINS.md](PLUGINS.md#testing-a-plugin). The official testing guidance (pumps, goldens, integration tests, mocks and fakes, and where these sources differ from it) is in [TESTING.md](TESTING.md).

**Contents:** [Widget-test recipes](#widget-test-recipes) · [Plugin tests](#plugin-tests) · [Prove it](#prove-it)

## Widget-test recipes

- **Isolate work hangs a widget test.** "When you run code that uses `compute` or other isolate methods directly in a widget test, the test environment might not wait for it properly. This can make your test hang and never finish." Wrap it in `tester.runAsync()`, which "sets up a test zone that correctly manages and waits for the asynchronous tasks running on the isolate" ([ApparenceKit](https://apparencekit.dev/flutter-tips/how-to-test-an-isolate/)). Verbatim (it computes `bytes` and `xfile` but passes `file`; `_avatarThumbnail` and `XFile`'s package are not shown):

```dart
testWidgets('upload file and save avatar', (tester) async {
  await tester.runAsync(() async { // <--- use this
    final file = await rootBundle.load('assets/images/splashscreen.png');
    final bytes = file.buffer.asUint8List();
    final xfile = XFile.fromData(bytes);

    final jpgData = await compute(_avatarThumbnail, file);
  });
});
```

- **One test, many values: `ValueVariant`.** Pass a `ValueVariant` as `variant:` to `testWidgets` and read the current item through `.currentValue`. Its constructor takes `Set<T>`, not a list. [ValueVariant constructor](https://api.flutter.dev/flutter/flutter_test/ValueVariant/ValueVariant.html). P2 correction: [ApparenceKit's value-variant tip](https://apparencekit.dev/flutter-tips/flutter-test-value-variants/) and the old line here said any list would do.
- **Screen-size variants:** the source models each size with a name, width, height and pixel density; `toString()` labels each run by name. Its published recipe passes the `basicPhones` List to `ValueVariant`, omits `_setScreenSize`, and never declares `screenSizeVariants`; the incomplete blocks are omitted here. Use the constructor's documented Set contract when supplying values. [ApparenceKit](https://apparencekit.dev/flutter-tips/run-flutter-tests-multiple-screen-sizes/), [ValueVariant](https://api.flutter.dev/flutter/flutter_test/ValueVariant/ValueVariant.html). Manual resize checks: [LAYOUT-AND-RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md).

- **Typed finder helpers,** kept "in a dedicated file, like `test_utils.dart`, within your test directory" ([ApparenceKit](https://apparencekit.dev/flutter-tips/easy-access-widget-flutter-test/)); use as `findWidget<MyWidget>()` and `findNWidget<MyWidget>(1)` for the second:

```dart
import 'package:flutter_test/flutter_test.dart';

// An easy way to get the first widget of a specific type
T findWidget<T>() => find
  .byType(T)
  .evaluate()
  .first
  .widget as T;

// An easy way to get the N-th widget of a specific type
T findNWidget<T>(int n) => find
  .byType(T)
  .evaluate()
  .toList()
  .elementAt(n)
  .widget as T;
```

- **Expected framework exceptions:** call `tester.takeException()` to retrieve an exception caught by the framework; an expected exception that is not taken is rethrown when `testWidgets` completes. [WidgetTester.takeException](https://api.flutter.dev/flutter/flutter_test/WidgetTester/takeException.html), [TestWidgetsFlutterBinding.takeException](https://api.flutter.dev/flutter/flutter_test/TestWidgetsFlutterBinding/takeException.html). P2 correction: [ApparenceKit](https://apparencekit.dev/flutter-tips/test-throwing-errors-flutter-widgets/) replaced `FlutterError.onError` and reset it to `FlutterError.presentError`, which does not restore the test binding's handler. The old copied block is removed; use the documented exception API without replacing that handler.

- **Test go_router navigation with the real router** ([ApparenceKit](https://apparencekit.dev/flutter-tips/how-to-test-gorouter-navigation-flutter/)): "1. **Embed your router within a Material app:** Wrap your GoRouter setup inside a `MaterialApp.router`." 2. Add your pages within routes. 3. Pump that `MaterialApp.router` with `testWidgets`. 4. `expect` the widgets that should appear after navigation, or behaviors like redirects. Build the router in a function that takes `initialLocation`, so a test can start on any page. "Testing widgets directly is often simpler, but testing navigation flow can be useful for certain scenarios." Sources differ: the Compass case study mocks the router instead (`MockGoRouter`, [ARCHITECTURE.md](ARCHITECTURE.md#testing-each-layer)).

## Plugin tests

The four layers of plugin tests from ApparenceKit's plugin guide, with their code checked against the official testing pages, are in [PLUGINS.md](PLUGINS.md#testing-a-plugin).

## Prove it

- Expected framework exceptions are retrieved with `tester.takeException()` while the test binding retains its error handler. [TestWidgetsFlutterBinding.takeException](https://api.flutter.dev/flutter/flutter_test/TestWidgetsFlutterBinding/takeException.html)
- Every widget test that runs `compute` or an isolate wraps it in `tester.runAsync()` and finishes.
- Layout-heavy screens have a widget test run per screen size through a `ValueVariant`, and the runner lists one result per device name.
