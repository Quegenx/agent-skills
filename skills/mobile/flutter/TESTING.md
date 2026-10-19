# Testing

Flutter has three kinds of test: a unit test covers one function, method or class; a widget test (a "component test" elsewhere) covers one widget; an integration test covers the complete app or a large part of it, on a real device or emulator. A well-tested app has many unit and widget tests, tracked by code coverage, plus enough integration tests to cover all the important use cases. The test environment does not rebuild a widget after `setState()` on its own, so an interaction is followed by `pump()` or `pumpAndSettle()` before the next `expect()`. The SDK's `integration_test` package can't touch native platform UI (permission dialogs, notifications, platform views); for that, use Patrol, covered in [e2e-testing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/e2e-testing/SKILL.md) together with Maestro. Dart-only unit testing (the `test` package, mocks, coverage) is also in [dart SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/dart/SKILL.md).

**Contents:** [Pick the test](#pick-the-test) · [Unit tests](#unit-tests) · [Mocks and fakes](#mocks-and-fakes) · [Widget tests](#widget-tests) · [Golden tests](#golden-tests) · [Integration tests](#integration-tests) · [Running integration tests](#running-integration-tests) · [Performance integration tests](#performance-integration-tests) · [Debugging](#debugging) · [Prove it](#prove-it)

## Pick the test

| | Unit | Widget | Integration |
|---|---|---|---|
| Confidence | Low | Higher | Highest |
| Maintenance cost | Low | Higher | Highest |
| Dependencies | Few | More | Most |
| Execution speed | Quick | Quick | Slow |

- **Sources differ on the mix:** one community reference app (Emin Şahin's 100% coverage post) ran about 80% unit, 15% widget and 5% integration tests, "invest heavily in unit tests"; [testing INTEGRATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/testing/INTEGRATION.md) puts integration tests first for services, with unit tests at roughly 15 to 25%.
- **Unit tests mock their dependencies** and generally don't read from or write to disk, render to screen, or receive user actions from outside the process. For plugin code in unit tests see https://docs.flutter.dev/testing/plugins-in-tests; for testing plugins themselves, https://docs.flutter.dev/testing/testing-plugins.
- **Integration tests with native interaction need `patrol`** (third party): it adds permission dialogs, notifications and platform views. First test: https://patrol.leancode.co/documentation/write-your-first-test. Setup: https://patrol.leancode.co/getting-started.
- **Real devices:** ApparenceKit reports "Real-device bugs we hit on a Samsung Galaxy A12 that don't show up on emulators" ([ApparenceKit](https://apparencekit.dev/blog/buy-flutter-template-or-build-from-scratch/)).
- **Test first on small features** (community practice): "When you are writing your tests before writing your code, you are forced to think about the API of your code"; "You don't have to do this all the time. Start to do it on small features" ([ApparenceKit](https://apparencekit.dev/blog/write-efficient-flutter-unit-tests/)).
- **Tell a coding agent the strategy:** an agent rule file should say which test style the project uses (ApparenceKit's: fakes over mocks) and how to handle APIs, "as unit tests don't have access to network" ([ApparenceKit](https://apparencekit.dev/blog/flutter-cursor-ai-setup/); agent setup in [AGENT-TOOLING.md](AGENT-TOOLING.md)).
- **CI services** listed for Flutter: fastlane, Appcircle, Travis, Cirrus, Codemagic (Flutter and Patrol), Bitrise. CI release lanes are in [BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md).

## Unit tests

- **Packages:** `test` is the core; `flutter_test` adds widget utilities. Add `test` with `flutter pub add dev:test`, the best approach when writing packages consumed by web, server and Flutter apps.
- **Location and names:** test files live in `test/` at the project root and always end with `_test.dart`; the test runner relies on that convention.
- **Run:** `flutter test test/counter_test.dart`; one group with `flutter test --plain-name "Test start, increment, decrement"`; options with `flutter test --help`.
- **Sources differ on what a unit is.** The Flutter docs [official]: "a unit test covers one function, method or class" (above). ApparenceKit [community]: "A unit test is NOT a test for a single function. ... We want to test scenarios, not functions"; "You have an input and you want to make sure that you have the expected output. That's it"; it "should not be coupled to the implementation details" ([ApparenceKit](https://apparencekit.dev/blog/write-efficient-flutter-unit-tests/), "based on our own experience").
- **Name the scenario** in the `state, action => result` shape the same source uses: `test('calculator is empty, add 1 then add 2 => result equals 3', ...)` (general naming rule: [testing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/testing/SKILL.md)).

```dart
import 'package:counter_app/counter.dart';
import 'package:test/test.dart';

void main() {
  group('Test start, increment, decrement', () {
    test('value should start at 0', () {
      expect(Counter().value, 0);
    });

    test('value should be incremented', () {
      final counter = Counter();

      counter.increment();

      expect(counter.value, 1);
    });

    test('value should be decremented', () {
      final counter = Counter();

      counter.decrement();

      expect(counter.value, -1);
    });
  });
}
```

## Mocks and fakes

- **Why mock:** live services slow tests down, cause flaky failures, and make it hard to test every success and failure path.
- **Mockito setup:** `flutter pub add http dev:mockito dev:build_runner`. `mockito: 5.0.0` supports null safety through code generation.
- **Inject the client:** pass an `http.Client` into the code under test instead of calling static `http.get()`, which is difficult to mock.
- **Generate the mock:** annotate with `@GenerateMocks([], customMocks: [MockSpec<http.Client>(as: #MockHttpClient)])` (named so it isn't confused with `MockClient` from `package:http/testing.dart`), run `dart run build_runner build`, and import the generated `fetch_album_test.mocks.dart`.

```dart
test('returns an Album if the http call completes successfully', () async {
  final client = MockHttpClient();

  // Use Mockito to return a successful response when it calls the
  // provided http.Client.
  when(
    client.get(Uri.parse('https://jsonplaceholder.typicode.com/albums/1')),
  ).thenAnswer(
    (_) async =>
        http.Response('{"userId": 1, "id": 2, "title": "mock"}', 200),
  );

  expect(await fetchAlbum(client), isA<Album>());
});
```

- **Fakes are the other option:** the architecture case study uses hand-written fakes (`FakeBookingRepository`) and `package:mocktail` for `MockGoRouter`.
- **mocktail needs no code generation:** its pub.dev page says it mocks "without the need for manual mocks or code generation", so there is no `build_runner` step. Define a mock by extending `Mock` and implementing the interface; stubs and verifies take closures. From a community post (Emin Şahin, "How I Achieved 100% Test Coverage in a Flutter Enterprise App"):

```dart
class MockAuthRepository extends Mock implements IAuthRepository {}

// Usage
when(() => mockRepo.login(any(), any()))
    .thenAnswer((_) async => Right(user));
```

- **Stubbing an HTTP client with mocktail** ([ApparenceKit](https://apparencekit.dev/flutter-tips/mocking-rest-api-calls/)), to test "different API responses without needing a real network connection ... including error cases":

```dart
import 'package:mocktail/mocktail.dart';

class HttpClientMock extends Mock implements HttpClient {}
```

```dart
final httpClientMock = HttpClientMock();
```

```dart
when(() => httpClientMock.get(Uri.parse('myapi/ ...')))
    .thenAnswer((_) async => Response(
      '''
      {"id":"testId","route":"myPage"}
      ''',
      200,
    ));
```

  The tip does not say which `HttpClient` it means; `Response(body, 200)` matches `package:http`'s `Response(String body, int statusCode, ...)` (https://pub.dev/documentation/http/latest/http/Response/Response.html), whose client is `http.Client` (the Mockito recipe above). The same tip warns "Mocking can be tricky and reflect implementations details when testing".
- **Sources differ on how much to mock:** that post mocks every layer (use cases against a mocked repository, BLoCs against a mocked use case) and verifies calls on reads; [testing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/testing/SKILL.md) mocks only boundaries you don't own and records commands, not queries. ApparenceKit sits on the fewer-mocks side: "Instead of checking if certain functions were called on a mock object, focus on the *outcome* or *behavior* of your code", for example assert the notification arrived and its content "rather than checking if a specific 'send' method was called on a mocked object" ([ApparenceKit](https://apparencekit.dev/flutter-tips/avoid-testing-using-mocks/)).
- **Sources differ on mocking libraries at all.** The Flutter docs [official] recipe mocks with Mockito (above), and unit tests "mock their dependencies". ApparenceKit [community]: "Don't use mockito or any other mocking library", because "you are coupling your tests to the implementation details of your code" and "As your application grows, you will have more and more "when" mocking calls" ([ApparenceKit](https://apparencekit.dev/blog/write-efficient-flutter-unit-tests/)). The Flutter architecture guide's "Fakes for testing" (Strong, [ARCHITECTURE.md](ARCHITECTURE.md#recommendations-by-priority)) agrees with the fakes side. ApparenceKit writes its choice into its agent rules (above).
- **Hand-written fakes, the same source's way:**

```dart
class FakeCalculatorApi implements CalculatorApi {
  @override
  Future<int> add(int a, int b) async {
    return a + b;
  }
}
```

```dart
test('calculator is empty, add 1 then add 2 => result equals 3', () {
  final calculator = Calculator(api: FakeCalculatorApi());
  calculator.add(1);
  calculator.add(2);
  expect(calculator.result(), 3);
});
```

  - Keep fakes "in the `test` folder", in one place, since one fake serves many tests.
  - They stay in sync because they implement the real interface: "When you add a method to your real implementation, you will have to add it to your fake implementation".
  - For failures, "write another implementation of your fake API that will throw an exception." A fake can hold state (a fake auth API returns a token only after a login with the right credentials).
  - "'Test only what you own' is a good rule to follow."
  - The blog's test calls `add` without `await` although the fake is async; it is verbatim as published.
- **Seed state into fakes before the app starts** so route guards behave as in production: ApparenceKit's tests "inject a user state / subscription before app start so Guards will work as expected" ([ApparenceKit](https://apparencekit.dev/blog/apparencekit-4-update/)).
- **BLoC tests with `bloc_test`** (bloclibrary.dev, community practice in the same post): `blocTest` builds the bloc, acts on it and lists the states it must emit, in order.

```dart
blocTest<AuthBloc, AuthState>(
  'emits [loading, authenticated] when login succeeds',
  build: () {
    when(() => mockLoginUseCase(any()))
        .thenAnswer((_) async => Right(user));
    return AuthBloc(loginUseCase: mockLoginUseCase);
  },
  act: (bloc) => bloc.add(LoginRequested(email: 'test@test.com', password: '123')),
  expect: () => [
    const AuthState.loading(),
    AuthState.authenticated(user),
  ],
);
```

## Widget tests

- **Setup:** `flutter_test: sdk: flutter` under `dev_dependencies` (present by default). Tests go in `test/`, file names end in `_test.dart` (for example `widget_test.dart`).
- **The pieces:** `testWidgets()` creates a new `WidgetTester` per test. Finders: `find.text('Submit')`, `find.byType(TextField)`, `find.byKey(Key('submit_btn'))`. Matchers: `findsOneWidget`, `findsNothing`, `findsWidgets`, `findsNWidgets(2)`, `matchesGoldenFile` (verifies that a widget's rendering matches a particular bitmap image).
- **Workflow:** `testWidgets('description', (WidgetTester tester) async { ... })`; `await tester.pumpWidget(MyWidget())`, wrapped in `MaterialApp` or `Directionality` if the widget needs inherited directional or theme data; create finders; check the initial state with `expect(finder, matcher)`; interact (`await tester.tap(buttonFinder)`); `await tester.pump()` or `await tester.pumpAndSettle()`; check the updated state; run `flutter test test/your_test_file_test.dart`; re-run until it passes.
- **Tapping does not rebuild:** a tap calls `setState()`, but Flutter won't automatically rebuild the widget in the test environment. Pump after every interaction.

### Choosing a pump

| Situation | Do |
|---|---|
| Static rendering | `pumpWidget()` once, then `expect()` |
| Standard state change such as a button tap | `tap(finder)`, then `pump()` for a single frame rebuild |
| Animations, transitions, async UI | Trigger the action (for example `await tester.drag(finder, Offset(500, 0))`), then `pumpAndSettle()` |
| Text input | `await tester.enterText(textFieldFinder, 'Input string')` |
| Long or dynamic lists | `await tester.scrollUntilVisible(itemFinder, 500.0, scrollable: listFinder)` |

- **What each pump does:** `tester.pumpWidget()` builds and renders. `tester.pump(Duration)` schedules one frame; it does not schedule multiple frames even for a long duration. Call `pump()` once with no duration to start an animation ticker. `tester.pumpAndSettle()` repeats `pump()` until no more frames are scheduled. A custom render object that animates by itself must obey `TickerMode`, "especially important in a widget test environment" ([renderobjects](https://renderobjects.com/examples/apple-watch-app-grid/); [flutter-render-objects EXAMPLE-WATCH-GRID.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-render-objects/EXAMPLE-WATCH-GRID.md)).
- **Sources differ on taps:** the Flutter team's widget-test skill says a standard tap needs `pump()` and only animations need `pumpAndSettle()`; its integration-test skill uses `pumpAndSettle()` after interactions like `tester.tap()`.
- **Page transitions on Android:** since 3.38 the default transition lasts 450 ms instead of 300 ms. Use `TransitionDurationObserver` (`observer.pumpPastTransition(tester)`, `observer.transitionDuration ~/ 2`) instead of hardcoded durations. See [VERSIONS.md](VERSIONS.md).

Minimal widget test from the docs (the current complete example imports `package:material_ui/material_ui.dart`; see [VERSIONS.md](VERSIONS.md)):

```dart
void main() {
  testWidgets('MyWidget has a title and message', (tester) async {
    await tester.pumpWidget(const MyWidget(title: 'T', message: 'M'));
    final titleFinder = find.text('T');
    final messageFinder = find.text('M');

    // Use the `findsOneWidget` matcher provided by flutter_test to verify
    // that the Text widgets appear exactly once in the widget tree.
    expect(titleFinder, findsOneWidget);
    expect(messageFinder, findsOneWidget);
  });
}
```

Full interaction example, `lib/todo_list.dart`:

```dart
import 'package:flutter/material.dart';

class TodoList extends StatefulWidget {
  const TodoList({super.key});

  @override
  State<TodoList> createState() => _TodoListState();
}

class _TodoListState extends State<TodoList> {
  final todos = <String>[];
  final controller = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        body: Column(
          children: [
            TextField(controller: controller),
            Expanded(
              child: ListView.builder(
                itemCount: todos.length,
                itemBuilder: (context, index) {
                  final todo = todos[index];
                  return Dismissible(
                    key: Key('$todo$index'),
                    onDismissed: (_) => setState(() => todos.removeAt(index)),
                    child: ListTile(title: Text(todo)),
                  );
                },
              ),
            ),
          ],
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: () {
            setState(() {
              todos.add(controller.text);
              controller.clear();
            });
          },
          child: const Icon(Icons.add),
        ),
      ),
    );
  }
}
```

`test/todo_list_test.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/todo_list.dart';

void main() {
  testWidgets('Add and remove a todo item', (WidgetTester tester) async {
    // 1. Build the widget
    await tester.pumpWidget(const TodoList());

    // 2. Verify initial state
    expect(find.byType(ListTile), findsNothing);

    // 3. Enter text into the TextField
    await tester.enterText(find.byType(TextField), 'Buy groceries');

    // 4. Tap the add button
    await tester.tap(find.byType(FloatingActionButton));

    // 5. Rebuild the widget to reflect the new state
    await tester.pump();

    // 6. Verify the item was added
    expect(find.text('Buy groceries'), findsOneWidget);

    // 7. Swipe the item to dismiss it
    await tester.drag(find.byType(Dismissible), const Offset(500, 0));

    // 8. Build the widget until the dismiss animation ends
    await tester.pumpAndSettle();

    // 9. Verify the item was removed
    expect(find.text('Buy groceries'), findsNothing);
  });
}
```

**Pin context in context-aware screens** (community practice, from the post behind [LAYOUT-AND-RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md#context-aware-layouts-optional)): "there's a distribution of home screens, one per context. The practical fix is to make context an _injectable input_ so you can pin it in tests." Feed the screen a fabricated `UiContext` and assert the resulting layout, after one more pump for the stream to emit. `FakeEngine` is not defined in the post.

```dart
testWidgets('moving commuter gets the quick action', (tester) async {
  const ctx = UiContext(
    isNight: false,
    isMoving: true,
    ambientLux: 12000,
    batterySaver: true,
    predictedIntent: Intent.quickAction,
  );

  await tester.pumpWidget(
    MaterialApp(home: HomeScreen(engine: FakeEngine(ctx))),
  );
  await tester.pump(); // let the stream emit

  expect(find.byKey(const Key('primaryActionCard')), findsOneWidget);
  expect(find.byKey(const Key('discoveryGrid')), findsNothing);
});
```

More widget-test recipes (finders, scrolling, tap, drag and enter text, orientation) are under https://docs.flutter.dev/cookbook/testing/widget/finders. Community recipes (isolate work with `tester.runAsync()`, `ValueVariant`, every screen size, typed finders, expected errors with `FlutterError.onError`, testing go_router with the real router) are in [TESTING-RECIPES.md](TESTING-RECIPES.md#widget-test-recipes); sources differ on the router: that recipe pumps a real `MaterialApp.router`, the Compass case study mocks it (`MockGoRouter`).

## Golden tests

- **Signature:** `AsyncMatcher matchesGoldenFile(Object key, {int? version})`. It asserts that a `Finder`, `Future<ui.Image>` or `ui.Image` matches the golden file.
- **What gets captured:** for a `Finder` it must match exactly one widget, and the rendered image of the first `RepaintBoundary` ancestor of the widget is the image. Wrap the widget in a `RepaintBoundary` to focus the capture.
- **A parent golden catches child changes:** "if you have a complex card widget and you change something in a smaller widget inside it (like an avatar), the golden test for the card will fail, showing you the difference" ([ApparenceKit](https://apparencekit.dev/flutter-tips/test-flutter-widget-design-golden-files/)).
- **It is async:** use `expectLater` and await it.
- **Create or update goldens:** `flutter test --update-goldens`. ApparenceKit has a coding agent write goldens at the end of a feature across devices ("iPhone 15, Pixel 8, and a small device"), run them with `--update-goldens` and commit the baselines ([ApparenceKit](https://apparencekit.dev/blog/vibe-coding-flutter-claude-code/)).
- **Consistency, not device fidelity:** "The image created during the test is an internal rendering. It might not look exactly like it does when you run your app normally. This is okay, as the test's job is to ensure *consistency* in the rendering" (same golden tip).
- **Scope, two views from one publisher:** the golden tip calls goldens a safety net for the design; the same site's unit-test post says "I don't like to test design details ... If you test your UI, be sure to test details that really matters" and "You should be able to change UI often and easily" ([ApparenceKit](https://apparencekit.dev/blog/write-efficient-flutter-unit-tests/)).

```dart
await expectLater(
  find.byType(MyWidget),
  matchesGoldenFile('goldens/myWidget.png'),
);
```

- **Fonts make goldens differ:** goldens with custom fonts differ across operating systems and Flutter versions. The default test font is 'Ahem', which draws squares. Load a real font per test with `FontLoader('Roboto')..addFont(rootBundle.load('path/to/font-file/Roboto.ttf'))` then `await fontLoader.load()`, or for every test in `flutter_test_config.dart`:

```dart
Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  setUpAll(() async {
    final FontLoader fontLoader = FontLoader('SomeFont')..addFont(someFont);
    await fontLoader.load();
  });
  await testMain();
}
```

- **Integration test goldens:** the default `goldenFileComparator` for integration tests changed in 3.32 (see [VERSIONS.md](VERSIONS.md)).

## Integration tests

- **What `integration_test` is:** the official package, shipped in the SDK. It runs on the target device, runs from the host with `flutter test integration_test`, and uses the `flutter_test` APIs. Migrating off `flutter_driver`: https://docs.flutter.dev/release/breaking-changes/flutter-driver-migration.
- **Add the dev dependencies.** The Flutter team's skill uses:

  ```bash
  flutter pub add 'dev:integration_test:{"sdk":"flutter"}'
  flutter pub add 'dev:flutter_test:{"sdk":"flutter"}'
  ```

  The docs page writes the first one as `flutter pub add "dev:integration_test:{sdk: flutter}"`.
- **Key the widgets you target:** give critical widgets a `Key` (for example `key: const ValueKey('increment')` or `ValueKey('login_button')`) so tests find them reliably.
- **Location and names:** an `integration_test/` directory at the project root, files named `<name>_test.dart` (for example `integration_test/app_test.dart`).
- **Start every test file** with `IntegrationTestWidgetsFlutterBinding.ensureInitialized();` in `main()`.
- **Drive the UI:** `await tester.pumpWidget(MyApp());`, then `await tester.pumpAndSettle();` after interactions such as `tester.tap()`. Assert with `expect(find.byKey(ValueKey('foo')), findsOneWidget);` or `findsNothing`. Reach off-screen widgets with `await tester.scrollUntilVisible(itemFinder, 500.0, scrollable: listFinder);`.
- **Legacy `flutter_driver` tests** use `driver.waitFor()`, `driver.waitForAbsent()`, `driver.tap()` and `driver.scroll()` instead of the `WidgetTester` APIs.
- **For agent exploration over MCP**, the skill also turns on the Flutter Driver extension: import `package:flutter_driver/driver_extension.dart` and call `enableFlutterDriverExtension();` before `runApp()`, in `lib/main.dart` or a separate `lib/main_test.dart`. The source does not say whether this and `IntegrationTestWidgetsFlutterBinding` belong in the same entry point; it suggests the dedicated `lib/main_test.dart`. The exploration loop is in [AGENT-TOOLING.md](AGENT-TOOLING.md).

`integration_test/app_test.dart` (the docs version imports `package:material_ui/material_ui.dart` instead of `package:flutter/material.dart`):

```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:my_app/main.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('End-to-end test', () {
    testWidgets('tap on the floating action button, verify counter', (tester) async {
      // Load app widget.
      await tester.pumpWidget(const MyApp());

      // Verify the counter starts at 0.
      expect(find.text('0'), findsOneWidget);

      // Find the floating action button to tap on.
      final fab = find.byKey(const ValueKey('increment'));

      // Emulate a tap on the floating action button.
      await tester.tap(fab);

      // Trigger a frame and wait for animations.
      await tester.pumpAndSettle();

      // Verify the counter increments by 1.
      expect(find.text('1'), findsOneWidget);
    });
  });
}
```

## Running integration tests

- **Desktop, Android, iOS:** `flutter test integration_test/app_test.dart`. After a device run, verify that the test removed the app when it finished; if not, later tests fail.
- **With `flutter drive`** you need a host driver script at `test_driver/integration_test.dart` that calls `integrationDriver()`:

```dart
import 'package:integration_test/integration_test_driver.dart';

Future<void> main() => integrationDriver();
```

- **Android locally with drive:** `flutter drive --driver=test_driver/integration_test.dart --target=integration_test/app_test.dart`
- **Pre-grant Android permissions from the driver** so no dialog appears, without Patrol ([ApparenceKit](https://apparencekit.dev/flutter-tips/grant-permissions-android-integration-tests-adb/); the article's code is an image only). The commands are `adb shell pm grant <package_name> <permission>` and `adb shell pm revoke <package_name> <permission>`. In the driver script (where `integrationDriver()` is called), run them with `Process.runSync` from `dart:io` (it "runs a command line process and waits for it to finish"): command `'adb'`, args `['shell', 'pm', 'grant', ...]`. Loop `grant` over a `List<String>` of permissions (the example is `'android.permission.WRITE_EXTERNAL_STORAGE'`) for your package id (example `'com.apparence.example'`, "Make sure this matches your app's package ID") before `await integrationDriver();`, then loop `revoke` after "to ensure tests are independent". Maestro and Patrol permission settings are in [e2e-testing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/e2e-testing/SKILL.md).
- **Web (Chrome):** install ChromeDriver (`npx @puppeteer/browsers install chromedriver@stable`), start `chromedriver --port=4444` in a separate terminal, then `flutter drive --driver=test_driver/integration_test.dart --target=integration_test/app_test.dart -d chrome`. Headless: `-d web-server`.
- **Linux CI needs an X server:** run under `xvfb-run` (GitHub Actions example: `run: flutter test integration_test -d linux -r github`). Without it you get `Error waiting for a debug connection: The log reader stopped unexpectedly, or never started.`
- **Firebase Test Lab (Android):** `pushd android`; `flutter build apk --debug` (a standard `--release` build does not include `package:integration_test`); `./gradlew app:assembleAndroidTest`; `./gradlew app:assembleDebug -Ptarget=integration_test/<name>_test.dart`. Pass dart-defines base64-encoded as `-Pdart-defines=...`. Upload the app APK `build/app/outputs/apk/debug/<file>.apk` and the test APK `build/app/outputs/apk/androidTest/debug/<file>.apk` in the Firebase Test Lab console as an Instrumentation test.
- **Plugins:** four test layers (platform-interface mock, method channel, `example/integration_test/`, native) are in [TESTING-RECIPES.md](TESTING-RECIPES.md#plugin-tests).
- **iOS devices:** follow https://github.com/flutter/flutter/tree/main/packages/integration_test#ios-device-testing.

## Performance integration tests

- **A `Stopwatch` budget in a widget test** (ApparenceKit, [ApparenceKit](https://apparencekit.dev/flutter-tips/benchmark-function-test/)): "Small optimizations needs numbers to prove they work"; "If a code change makes something unexpectedly slow, your test will fail."

```dart
testWidgets('check huge function performance', (
  WidgetTester tester,
) async {
  final sw = Stopwatch()..start();
  await tester.tap(find.byKey(const ValueKey('btn')));
  await tester.pumpAndSettle(const Duration(milliseconds: 100));
  expect(sw.elapsedMilliseconds, lessThan(500));
});
```

  The article says `pumpAndSettle` "waits for any animations or rebuilds triggered by the tap to finish"; its `Duration` argument is the step per pump ("Repeatedly calls pump with the given `duration` until there are no longer any frames scheduled", https://api.flutter.dev/flutter/flutter_test/WidgetTester/pumpAndSettle.html). Sources differ on what this proves: it runs in the test environment, while the Flutter docs measure frame times only in profile mode on a device ([PERFORMANCE.md](PERFORMANCE.md#profiling), and the timeline recipe below). Use it as a regression tripwire.

- **Record a timeline:** wrap actions in `binding.traceAction(() async { await tester.scrollUntilVisible(itemFinder, 500.0, scrollable: listFinder); }, reportKey: 'scrolling_timeline');` (default key `timeline`). Not supported on web.
- **Driver:** `test_driver/perf_driver.dart` summarizes the timeline (default output `integration_response_data.json` otherwise):

```dart
import 'package:flutter_driver/flutter_driver.dart' as driver;
import 'package:integration_test/integration_test_driver.dart';

Future<void> main() {
  return integrationDriver(
    responseDataCallback: (data) async {
      if (data != null) {
        final timeline = driver.Timeline.fromJson(
          data['scrolling_timeline'] as Map<String, dynamic>,
        );

        final summary = driver.TimelineSummary.summarize(timeline);

        await summary.writeTimelineToFile(
          'scrolling_timeline',
          pretty: true,
          includeSummary: true,
        );
      }
    },
  );
}
```

- **Run in profile mode:** `flutter drive --driver=test_driver/perf_driver.dart --target=integration_test/scrolling_test.dart --profile`. Add `--no-dds` when running on a mobile device or emulator.
- **Outputs in `build/`:** `scrolling_summary.timeline_summary.json` (fields include `average_frame_build_time_millis`, `worst_frame_build_time_millis`, `missed_frame_build_budget_count`, `average_frame_rasterizer_time_millis`, `worst_frame_rasterizer_time_millis`, `missed_frame_rasterizer_budget_count`, `frame_count`, `frame_build_times`, `frame_rasterizer_times`) and `scrolling_timeline.timeline.json` (open at `chrome://tracing`).

## Debugging

| Symptom | Fix |
|---|---|
| `PumpAndSettleTimedOutException` | Look for an infinite animation; `pumpAndSettle()` waits until no frames are scheduled |
| Widget not found | It may be lazy-loaded in a `ListView` or `SliverList`: add `scrollUntilVisible` |
| Widget needs theme or text direction | Wrap it in `MaterialApp` or `Directionality` before `pumpWidget` |
| Golden differs on another machine | Custom fonts render differently across OSes and Flutter versions; load fonts in `flutter_test_config.dart` |
| Linux CI: `Error waiting for a debug connection` | Run under `xvfb-run` |
| Firebase Test Lab APK built with `--release` | A standard release build doesn't include `package:integration_test`; build with `flutter build apk --debug` |
| Next device test fails | The previous run left the app installed |
| Code matching a class name fails in an obfuscated build | Obfuscation renames symbols; see [BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md) |
| Test hangs on `compute` or other isolate work | Wrap the work in `tester.runAsync()` ([TESTING-RECIPES.md](TESTING-RECIPES.md#widget-test-recipes)) |
| Later tests fail after one that expected an error | Use the canonical [expected-framework-exception recipe](TESTING-RECIPES.md#widget-test-recipes), retaining the test binding's handler. P2 correction: the old row said to reset `FlutterError.onError`; [takeException](https://api.flutter.dev/flutter/flutter_test/TestWidgetsFlutterBinding/takeException.html) acknowledges expected framework exceptions. |
| A custom render object shows only its class name in a failure | Implement `debugFillProperties`; dump the tree with `debugDumpRenderTree()` ([flutter-render-objects DIAGNOSTICS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-render-objects/DIAGNOSTICS.md)) |

## Prove it

- `flutter test` passes, and every test file sits in `test/` or `integration_test/` with a `_test.dart` suffix.
- Every interaction in a widget test is followed by `pump()` or `pumpAndSettle()` before its `expect()`.
- Golden tests use `await expectLater(..., matchesGoldenFile(...))`, and `flutter test --update-goldens` was run once to create the files.
- Every integration test file calls `IntegrationTestWidgetsFlutterBinding.ensureInitialized()`, targets widgets by `ValueKey`, and passes with `flutter test integration_test/app_test.dart` on a real device or emulator.
- Flows that hit permission dialogs, notifications or platform views use Patrol, not `integration_test`.
- Performance tests ran with `--profile` and produced `build/scrolling_summary.timeline_summary.json`.
- The project's choice between mocks and fakes is written down once (test README or agent rules), and new tests follow it.
