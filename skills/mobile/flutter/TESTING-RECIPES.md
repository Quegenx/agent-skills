# Testing recipes (community)

Community widget-test and plugin-test recipes from ApparenceKit's tips and blog posts (apparencekit.dev, a third-party Flutter starter kit; no article states a Flutter version): isolate work in widget tests, `ValueVariant`, screen sizes, typed finders, expected errors, go_router navigation; the four layers of plugin tests are in [PLATFORM-INTEGRATION.md](PLATFORM-INTEGRATION.md#testing-a-plugin). The official testing guidance (pumps, goldens, integration tests, mocks and fakes, and where these sources differ from it) is in [TESTING.md](TESTING.md).

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

- **One test, many values: `ValueVariant`.** Pass a `ValueVariant` of any list as `variant:` to `testWidgets`; the framework runs "this *single* test multiple times, once for each item", and the test reads the current item with `.currentValue` ([ApparenceKit](https://apparencekit.dev/flutter-tips/flutter-test-value-variants/)).
- **Every screen size, to catch overflows.** "Widget tests are great for checking this automatically" ([ApparenceKit](https://apparencekit.dev/flutter-tips/run-flutter-tests-multiple-screen-sizes/)). `toString()` returning `name` labels each run by device:

```dart
class ScreenSize {
  final String name;
  final double width;
  final double height;
  final double pixelDensity;

  const ScreenSize(this.name, this.width, this.height, this.pixelDensity);

  @override
  String toString() => name;
}

const iphone8Plus = ScreenSize('iPhone 8 Plus', 414, 736, 3);
const iphone11Max = ScreenSize('iPhone 11 Max', 414, 896, 3);
const samsungGalaxyS = ScreenSize('Android Samsung Galaxy S', 480, 800, 1);

final basicPhones = <ScreenSize>[iphone8Plus, iphone11Max];
```

```dart
extension ScreenSizeManager on WidgetTester {
  Future<void> setScreenSize(ScreenSize screenSize) async {
    return _setScreenSize(
      width: screenSize.width,
      height: screenSize.height,
      pixelDensity: screenSize.pixelDensity,
    );
  }
}

testWidgets(
  'click on button => shows an anchored widget overlay',
  (WidgetTester tester) async {
    await tester.setScreenSize(screenSizeVariants.currentValue!); // Set the current screen size
    
    await tester.pumpWidget(const MyAppWithCircleAnchored());
    expect(find.byType(AnchoredHelper), findsNothing);
    
    await tester.tap(find.byType(OutlinedButton).first);
    await tester.pump(const Duration(seconds: 2));
    expect(find.byType(AnchoredHelper), findsOneWidget);
  },
  variant: ValueVariant<ScreenSize>(basicPhones), // Run the test for each screen in the list
);
```

  The article never defines `_setScreenSize` (the call that sets the surface size is not shown) and never declares `screenSizeVariants`; hold the `ValueVariant` in a variable with that name and pass it as `variant:`. The manual resize check is in [LAYOUT-AND-RESPONSIVE.md](LAYOUT-AND-RESPONSIVE.md).
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

- **Assert that a widget throws** by swapping `FlutterError.onError`, since "unhandled errors can make your test fail"; "always reset `FlutterError.onError` after your test is done checking the error. This prevents side effects in other tests" ([ApparenceKit](https://apparencekit.dev/flutter-tips/test-throwing-errors-flutter-widgets/)). The corrected block (the export had `→` where Dart needs `=>`, used `isInstanceOf<T>()`, which package:matcher deprecates with "Use `isA<MyType>()` instead" (https://pub.dev/documentation/matcher/latest/matcher/isInstanceOf-class.html), and pumped `MyAppWithError` without calling it):

```dart
testWidgets('creating a widget with some param => throw', (WidgetTester tester) async {
  var exceptionRes;

  // Catch Flutter error or this will make your test fail
  FlutterError.onError = (details) {
    exceptionRes = details.exception;
  };

  await tester.pumpWidget(MyAppWithError());

  // Set Flutter onError back. Flutter will throw if not handled.
  FlutterError.onError = (details) => FlutterError.presentError(details);

  // Now you can check the caught error
  expect(exceptionRes, isNotNull);
  expect(exceptionRes, isA<MyCustomException>());
});
```

- **Test go_router navigation with the real router** ([ApparenceKit](https://apparencekit.dev/flutter-tips/how-to-test-gorouter-navigation-flutter/)): "1. **Embed your router within a Material app:** Wrap your GoRouter setup inside a `MaterialApp.router`." 2. Add your pages within routes. 3. Pump that `MaterialApp.router` with `testWidgets`. 4. `expect` the widgets that should appear after navigation, or behaviors like redirects. Build the router in a function that takes `initialLocation`, so a test can start on any page. "Testing widgets directly is often simpler, but testing navigation flow can be useful for certain scenarios." Sources differ: the Compass case study mocks the router instead (`MockGoRouter`, [ARCHITECTURE.md](ARCHITECTURE.md#testing-each-layer)).

## Plugin tests

The four layers of plugin tests from ApparenceKit's plugin guide, with their code checked against the official testing pages, are in [PLATFORM-INTEGRATION.md](PLATFORM-INTEGRATION.md#testing-a-plugin).

## Prove it

- Every test that assigns `FlutterError.onError` restores it before it ends.
- Every widget test that runs `compute` or an isolate wraps it in `tester.runAsync()` and finishes.
- Layout-heavy screens have a widget test run per screen size through a `ValueVariant`, and the runner lists one result per device name.
