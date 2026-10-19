# Testing

Dart tests run on `package:test` (Flutter's `flutter_test` is built on it): `test()` cases grouped by `group()`, checked with `expect()` from package:matcher or, in newer code, `check()` from package:checks. The sources' rules center on three things: whether the code takes its dependencies through constructors (so mockito can replace them), whether async results are awaited and stubbed with `thenAnswer`, and whether the runner finds the files (`test/`, `*_test.dart`). Widget and integration tests for Flutter apps are in [flutter SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/SKILL.md); testing command-line tools is in [CLI-APPS.md](CLI-APPS.md).

**Contents:** [Kinds of tests](#kinds-of-tests) · [Layout](#layout) · [Writing tests](#writing-tests) · [Running tests](#running-tests) · [Platforms, skips, timeouts and tags](#platforms-skips-timeouts-and-tags) · [dart_test.yaml](#dart_testyaml) · [Mocks with mockito](#mocks-with-mockito) · [Migrating to package:checks](#migrating-to-packagechecks) · [Coverage](#coverage) · [Prove it](#prove-it)

## Kinds of tests

| Kind | Covers | Tools |
|---|---|---|
| Unit (most numerous) | Functions, methods, classes | `package:test`; `package:mockito` for dependencies |
| Component (widget tests in Flutter) | Behavior, layout and interaction, often with mocks | `flutter_test` |
| Integration (end to end) | Whole app flows on a simulated or real device or browser | `integration_test/`, `flutter_driver` |

- **Current version:** `test` 1.33.0 (2026-10-08, sdk `^3.11.0`).
- **CI:** GitHub Actions or AppVeyor. With `GITHUB_ACTIONS=true` the reporter defaults to `github`.

## Layout

- **All tests in `test/`** at the package root, mirroring `lib`, with `_test.dart` appended: `lib/src/utils.dart` becomes `test/src/utils_test.dart`.
- **Integration tests in `integration_test/`** at the package root. The default runner ignores them, so name the directory: `dart test integration_test` or `flutter test integration_test`.

## Writing tests

- **Import** `package:test/test.dart` (or `package:flutter_test/flutter_test.dart` for Flutter) and the target library, and define `main()`.
- **`group()`** gives related tests shared context and prefixes their descriptions; **`test()`** defines a case; **`expect()`** checks results with matchers such as `equals()`, `isTrue` and `throwsA()`.
- **`setUp()` and `tearDown()`** run before and after every test in a group or suite; `tearDown` runs even if the test fails.
- **Async tests:** write them with `async`/`await`; the runner waits for the returned `Future`. Uncaught async errors in the test zone fail the test (possibly late), so register error handlers before futures complete.
- **Workflow:** create the file in `test/` with the `_test.dart` suffix; import; define `main()`; set up shared resources or mocks in `setUp()`; write `test()` cases grouped by `group()`; run; read the stack trace, fix the implementation or the assertions, and re-run until it passes.

```dart
import 'package:test/test.dart';
import 'package:my_package/calculator.dart';

void main() {
  group('Calculator', () {
    late Calculator calc;

    setUp(() {
      calc = Calculator();
    });

    test('adds two numbers correctly', () {
      expect(calc.add(2, 3), equals(5));
    });

    test('handles asynchronous operations', () async {
      final result = await calc.fetchRemoteValue();
      expect(result, isNotNull);
      expect(result, greaterThan(0));
    });
  });
}
```

## Running tests

- **Pure Dart:** `dart test`. **Flutter:** `flutter test`. With the MCP server, its `run_tests` tool says "ALWAYS use instead of `dart test` or `flutter test` shell commands" (see [ANALYSIS-AND-LINTS.md](ANALYSIS-AND-LINTS.md)).
- **What runs:** by default the runner searches `test/` recursively for `*_test.dart` (the pattern is overridable in `dart_test.yaml`); other directories run only when passed explicitly.
- **Select:** `dart test path/to/test.dart`, `dart test path/to/dir`; `-n "regex"`/`--name` matches the full description, `-N` plain-text contains; `--tags`/`-t`, `--exclude-tags`/`-x`. Repeated flags must all match. Path queries: `dart test "path/to/test.dart?line=10&col=2"` (also `name`, `full-name`).
- **Platforms and compilers:** `-p chrome`, `-p "chrome,vm"`; `-c source`, `-c vm:source`.
- **Sharding:** `--total-shards 3 --shard-index 0`; by test case (default, partitioned after filters) or `--shard-by-suite`.
- **Concurrency:** suites run concurrently on half the host's CPU cores by default; `--concurrency=4`.
- **Shuffle:** `--test-randomize-ordering-seed=12345` or `random` (0 leaves the order unchanged).
- **Reporters:** `--reporter=compact` (default), `expanded`, `github`, `json`.
- **Flags:** no general `-D` compiler flags; for browser and node use `--dart2js-args`; VM-wide flags go in `DART_VM_OPTIONS` or before `test` on the `dart` command.
- **Debugging:** `--pause-after-load` prints the VM debugger URL.
- **Hybrid tests:** `spawnHybridCode()` and `spawnHybridUri()` return a `StreamChannel` (add a `stream_channel` dependency); the hybrid library defines `hybridMain(StreamChannel channel)`.
- **build_runner users** need `build_test` in dev_dependencies.

## Platforms, skips, timeouts and tags

- **`@TestOn('vm')`** goes at the top of the file, before `library` and imports. Selector identifiers: `vm`, `chrome`, `firefox`, `safari` (needs `safaridriver --enable`), `edge`, `node`, `dart-vm`, `browser`, `js`, `blink`, `windows`, `mac-os`, `linux`, `android`, `ios`, `posix`, `dart2js`, `dart2wasm`, `kernel`, `source`; they combine, as in `@TestOn('browser && !chrome && dart2js')`. Package-wide: `test_on` in the config.
- **Skip:** `@Skip('currently failing (see issue 1234)')` on a suite; `skip: true` or a reason string on `group` or `test`. Use `@TestOn` instead for platform incompatibility.
- **Timeouts:** the default is 30 seconds of inactivity (not total duration). `@Timeout(Duration(seconds: 45))`, `@Timeout.factor(1.5)`, `timeout: Timeout.factor(2)`, `timeout: Timeout(Duration(minutes: 1))`. Nested timeouts apply outermost to innermost.
- **Per platform:** `@OnPlatform({'windows': Timeout.factor(2)})`, `onPlatform: {'safari': Skip('...')}`; the last matching value wins.
- **Browser binaries:** `CHROME_EXECUTABLE`, `MS_EDGE_EXECUTABLE`, `FIREFOX_EXECUTABLE`, `SAFARI_EXECUTABLE`.
- **Tags:** `@Tags(['browser'])`, `tags: 'chrome'`, `tags: ['chrome', 'firefox']`; filter with `--tags "(chrome || firefox) && !slow"`. Tags must be valid Dart identifiers (hyphens allowed). Undeclared tags print a warning, so declare them in `dart_test.yaml`.

## dart_test.yaml

Sets package defaults that command-line flags override.

```yaml
# This package's tests are very slow. Double the default timeout.
timeout: 2x

# This is a browser-only package, so test on chrome by default.
platforms: [chrome]

tags:
  # Integration tests are even slower, so increase the timeout again.
  integration: {timeout: 2x}

  # Sanity tests are quick and verify that nothing is obviously wrong. Declaring
  # the tag allows us to tag tests with it without getting warnings.
  sanity:
```

- **Retries:** `tags: chrome: retry: 3` retries tagged tests (retry isn't supported in the global config file).
- **Presets:** `presets: debug: run_skipped: true, paths: ["test/", "extra_test/"]`, selected with `-P`.
- **`paths:`** sets default test paths (relative, URL format; default `[test]`).
- **`override_platforms: chrome: settings: executable: chromium`.**

## Mocks with mockito

**Make code testable first:** pass external services (for example `http.Client`) in through constructors, represent URLs only as `Uri` objects (`Uri.parse(string)`), and use classes and mixins to define interfaces for external interactions.

**Setup:** `dart pub add http`, then `dart pub add dev:test dev:mockito dev:build_runner`. Import HTTP with a prefix: `import 'package:http/http.dart' as http;`.

- **Always use `@GenerateNiceMocks`** ("preferable to `@GenerateMocks` to avoid missing stub exceptions"), with a list of `MockSpec<Type>()`, in the test file, then import the generated `.mocks.dart` file. The examples put the annotation directly before `import '<name>_test.mocks.dart';`; the mocks skill's workflow says to add "the `part` or `import` directive".
- **Generate** with `dart run build_runner build`. [ApparenceKit](https://apparencekit.dev/flutter-tips/optimize-flutter-code-generation/) runs `flutter packages pub run build_runner build --delete-conflicting-outputs` from the project root; keep the `dart run build_runner build` form above and add the `--delete-conflicting-outputs` flag if you want it (the article does not explain the flag). In larger projects, a root `build.yaml` that tells each generator which folders to include and which to exclude (tests, already generated `.g.dart` and `.freezed.dart` files) speeds generation up (same source, which shows no `build.yaml` content). The class name is `Mock` plus the type name: `MockSpec<http.Client>()` gives `MockClient`, `MockSpec<ApiClient>()` gives `MockApiClient`.
- **Sync stubs:** `when(mock.method()).thenReturn(value)`.
- **CRITICAL: always use `thenAnswer((_) async => value)`** for methods returning a `Future` or `Stream`. Never use `thenReturn` for asynchronous returns.
- **Verify** call counts with `verify(mock.method()).called(1)`. Argument matchers: `any`, `anyNamed`, `captureAny`.

Workflow: find the dependency to mock; inject it through the target's constructor; create the test file with `@GenerateNiceMocks([MockSpec<Dependency>()])`; add the directive for the generated `.mocks.dart`; run `dart run build_runner build`; write cases with `group()`/`test()`; stub with `when()`; call the target method; check with `verify()` and `expect()`; run `dart test`.

The system under test, `lib/api_service.dart`:

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  final http.Client client;

  ApiService(this.client);

  Future<String> fetchData(String urlString) async {
    final uri = Uri.parse(urlString);
    final response = await client.get(uri);

    if (response.statusCode == 200) {
      return jsonDecode(response.body)['data'];
    } else {
      throw Exception('Failed to load data');
    }
  }
}
```

The test, `test/api_service_test.dart`:

```dart
import 'package:test/test.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:http/http.dart' as http;
import 'package:my_app/api_service.dart';

// Generate the mock class for http.Client
@GenerateNiceMocks([MockSpec<http.Client>()])
import 'api_service_test.mocks.dart';

void main() {
  group('ApiService', () {
    late ApiService apiService;
    late MockClient mockHttpClient;

    setUp(() {
      mockHttpClient = MockClient();
      apiService = ApiService(mockHttpClient);
    });

    test('returns data if the http call completes successfully', () async {
      // Arrange: Stub the async HTTP GET request using thenAnswer
      when(mockHttpClient.get(any)).thenAnswer(
        (_) async => http.Response('{"data": "Success"}', 200),
      );

      // Act
      final result = await apiService.fetchData('https://api.example.com/data');

      // Assert
      expect(result, 'Success');

      // Verify the mock was called with the correct Uri
      verify(mockHttpClient.get(Uri.parse('https://api.example.com/data'))).called(1);
    });

    test('throws an exception if the http call completes with an error', () {
      // Arrange
      when(mockHttpClient.get(any)).thenAnswer(
        (_) async => http.Response('Not Found', 404),
      );

      // Act & Assert
      expect(
        apiService.fetchData('https://api.example.com/data'),
        throwsException,
      );
    });
  });
}
```

| Symptom | Fix |
| --- | --- |
| A mock method throws an unexpected null error | Make sure you used `@GenerateNiceMocks` |
| An async stub throws an `ArgumentError` | Change `thenReturn` to `thenAnswer` |
| `build_runner` fails | Make sure the `.mocks.dart` import matches the file name exactly |

Also review missing stubs, mismatched argument matchers, and syntax errors in the generated files.

## Migrating to package:checks

`package:matcher` is exported by default from `package:test/test.dart`. `package:checks` is "modern, type-safe, and literate": static type safety, better IDE autocomplete and more detailed failure output.

1. **Add it:** `dart pub add dev:checks`. Remove `package:matcher` only if it is listed explicitly under dev_dependencies (it arrives transitively through `package:test`, which is fine).
2. **Find targets** with the discovery greps below, then choose a full or an incremental migration.
3. **Swap imports:** replace `import 'package:test/test.dart';` with `import 'package:test/scaffolding.dart';` plus `import 'package:checks/checks.dart';`. For an incremental migration also add `import 'package:test/expect.dart'; // Temporarily allows legacy expect()`.
4. **Finish:** for a full migration remove the `package:test/expect.dart` import; any `expect` left becomes a compiler error.
5. **Verify:** run `dart analyze` (watch the type parameters on `.isA<Type>()` and look for `unawaited_futures` warnings on unawaited async checks), then `dart test`, and read the checks failure output to tell a real failure from a bad translation.

```bash
grep -rn "expect(" test/
grep -rn "expectLater(" test/
grep -rn "expect(.*, \[" test/
grep -rn "expect(.*, {" test/
grep -rn "matches(" test/
grep -rn "having(" test/
```

**Mapping:**

| Legacy Matcher | Package Checks Equivalent | Notes |
| :--- | :--- | :--- |
| `expect(actual, expected)` | `check(actual).equals(expected)` | Use `.deepEquals` for collections! |
| `expect(actual, equals(expected))` | `check(actual).equals(expected)` | Use `.deepEquals` for collections! |
| `isA<T>()` | `check(actual).isA<T>()` | Chaining is supported directly |
| `same(expected)` | `check(actual).identicalTo(expected)` | Verifies identity |
| `anyElement(matcher)` | `check(iterable).any(conditionCallback)` | E.g. `check(list).any((e) => e.equals(1))` |
| `everyElement(matcher)` | `check(iterable).every(conditionCallback)` | E.g. `check(list).every((e) => e.isGreaterThan(0))` |
| `hasLength(expected)` | `check(actual).length.equals(expected)` | Works on String, Map, Iterable, etc. |
| `isNot(matcher)` | `check(actual).not(conditionCallback)` | E.g. `check(val).not((it) => it.equals(5))` |
| `contains(element)` | `check(actual).contains(element)` | Works on String, Iterable (use `containsKey` for Map!) |
| `contains(key)` (on a Map) | `check(map).containsKey(key)` | Map key containment |
| `startsWith(prefix)` | `check(string).startsWith(prefix)` | String only |
| `endsWith(suffix)` | `check(string).endsWith(suffix)` | String only |
| `isEmpty` | `check(actual).isEmpty()` | Works on String, Map, Iterable |
| `isNotEmpty` | `check(actual).isNotEmpty()` | Works on String, Map, Iterable |
| `isNull` | `check(actual).isNull()` | |
| `isNotNull` | `check(actual).isNotNull()` | |
| `isTrue` / `true` | `check(actual).isTrue()` | Works on non-nullable `bool` only |
| `isFalse` / `false` | `check(actual).isFalse()` | Works on non-nullable `bool` only |
| `completion(matcher)` | `await check(future).completes(conditionCallback)` | Must be awaited! |
| `throwsA(matcher)` | `await check(future).throws<Type>()` | Must be awaited! |
| `emits(value)` | `await check(streamQueue).emits(conditionCallback)` | Must be awaited! |
| `emitsThrough(value)` | `await check(streamQueue).emitsThrough(conditionCallback)` | Must be awaited! |
| `stringContainsInOrder(list)` | `check(string).containsInOrder(list)` | String only |
| `pairwiseCompare(...)` | `check(actual).pairwiseMatches(...)` | |

**No direct replacement:** `throwsArgumentError`, `throwsStateError`, `throwsUnsupportedError` become `await check(triggerError()).throws<ArgumentError>();` (with the matching type). `anything` becomes an empty callback `(_) {}`, as in `await check(someFuture).completes((_) {});`. `isPositive` becomes `isGreaterThan(0)`, `isNegative` `isLessThan(0)`, `isZero` `equals(0)`, `isNonNegative` `isGreaterOrEqual(0)` (`isNonPositive` and `isNonZero` are given no mapping). Ranges (`inClosedOpenRange`, `inInclusiveRange`) become cascades: `check(actualValue)..isGreaterOrEqual(min)..isLessThan(max);`.

**Pitfalls:**

1. **Collections need `.deepEquals`.** `expect` and `equals()` compare collections deeply; checks' `.equals` "corresponds strictly to `operator ==`", so on a collection it checks identity and almost certainly fails at runtime: `check(myList).deepEquals([1, 2, 3]);`.
2. **`reason:` becomes `because:`,** passed to `check` before the subject: `check(because: 'Explanation', actual).expectation();`.
3. **`matches(r'\d+')` turned a String into a RegExp;** `.matchesPattern(pattern)` treats a String as a literal, so pass a `RegExp`: `check(someString).matchesPattern(RegExp(r'\d+'));`.
4. **`having` becomes `has`,** which takes one fewer argument and returns a new `Subject`: `isA<Person>().having((p) => p.name, 'name', startsWith('A'))` becomes `check(actual).isA<Person>().has((p) => p.name, 'name').startsWith('A');`.
5. **`throws` differs for sync and async.** On `Subject<T Function()>`, `.throws<E>()` returns `Subject<E>` and does not accept a callback (passing one is a compiler error). On `Subject<Future<T>>`, it returns `Future<void>` and requires an inspection callback; `await check(future).throws<E>().equals(...)` does not compile.

   The source's sync block, with its own YES and NO labels (the NO line is the wrong form; the stray `"` in `triggerSync"` is in the source):

   ```dart
   // YES (Synchronous chaining)
   check(() => triggerSyncError()).throws<ArgumentError>()
     ..has((e) => e.message, 'message').equals('invalid input');

   // NO (Passing a callback to sync throws will cause a compiler error!)
   check(() => triggerSync").throws<ArgumentError>((it) => ...); // ERROR!
   ```
   ```dart
   // YES (Asynchronous callback)
   await check(triggerAsyncError()).throws<ArgumentError>((it) => it
     ..has((e) => e.message, 'message').equals('invalid input'));
   ```
6. **Separate `RegExp` instances are not `==`:**

   ```dart
   check(myPattern).isA<RegExp>()
     ..has((r) => r.pattern, 'pattern').equals('Hello')
     ..has((r) => r.isMultiLine, 'isMultiLine').isTrue();
   ```
7. **`.isTrue()` and `.isFalse()` exist only on `Subject<bool>`,** not `Subject<bool?>`. Use `.isNotNull().isTrue()`, or `.equals(true)` / `.equals(false)`.
8. **Map keys:** `.contains(...)` on `Subject<Map>` does not compile; use `check(myMap).containsKey('my_key');`.
9. **Extension types** (for example `extension type const QrEciValue(int value) implements int`): `.equals(3)` fails on `Subject<QrEciValue>` and `as int` triggers an "Unnecessary cast" warning. Use `check<int>(QrEciValue.iso8859_1).equals(3);`.
10. **Dynamic JSON lookups:** cast first, as in `check(myIterable).deepEquals(json['data']['items'] as List);`.

**Before and after:**

```dart
expect(someValue, isNotNull);
expect(result, isTrue, reason: 'should be successful');
expect(myString, startsWith('hello'));
// ->
check(someValue).isNotNull();
check(because: 'should be successful', result).isTrue();
check(myString).startsWith('hello');
```

```dart
expect(response, isA<Response>()
    .having((r) => r.statusCode, 'statusCode', 200)
    .having((r) => r.body, 'body', contains('success')));
// ->
check(response).isA<Response>()
  ..has((r) => r.statusCode, 'statusCode').equals(200)
  ..has((r) => r.body, 'body').contains('success');
```

```dart
expect(fetchData(), completes);
expect(fetchData(), completion(equals('data')));
expect(failingCall(), throwsA(isA<StateError>()));
// ->
await check(fetchData()).completes();
await check(fetchData()).completes((it) => it.equals('data'));
await check(failingCall()).throws<StateError>();
```

```dart
var queue = StreamQueue(Stream.fromIterable([1, 2, 3]));
await expectLater(queue, emitsInOrder([1, 2, 3]));
// ->
await check(queue).inOrder([
  (s) => s.emits((e) => e.equals(1)),
  (s) => s.emits((e) => e.equals(2)),
  (s) => s.emits((e) => e.equals(3)),
]);
```

```dart
expect(someString, allOf([
  startsWith('a'),
  contains('b'),
  endsWith('c'),
]));
// ->
check(someString)
  ..startsWith('a')
  ..contains('b')
  ..endsWith('c');
```

**Custom expectations** replace custom `Matcher` subclasses: write `extension` methods on `Subject<T>` and import `package:checks/context.dart`.

- **`context.expect(() => [description], (actual) => null | Rejection(which: [...]))`** for a check.
- **`has`** is "Recommended for simple, non-failing field access": `Subject<Address> get address => has((p) => p.address, 'address');`.
- **`context.nest('has a valid SSN', (actual) { ... })`** for extraction that can fail, returning `Extracted.rejection(which: ['has no SSN'])` or `Extracted.value(ssnValue)`.
- **Async:** `context.expectAsync` or `context.nestAsync`, returning the Future.

```dart
extension CustomFutureChecks<T> on Subject<Future<T>> {
  Future<void> completesNormally() {
    return context.expectAsync(
      () => ['completes without throwing'],
      (actual) async {
        try {
          await actual;
          return null; // Pass
        } catch (e) {
          return Rejection(which: ['threw $e']);
        }
      },
    );
  }
}
```

```dart
extension CustomPersonChecks on Subject<Person> {
  void isAdult() {
    context.expect(
      () => ['is an adult (age >= 18)'],
      (actual) {
        if (actual.age >= 18) return null; // Pass
        return Rejection(
          which: ['is only ${actual.age} years old'],
        );
      },
    );
  }
}
```

## Coverage

- **Add `coverage` only as a dev_dependency** ("Do not add it to standard dependencies"): `dart pub add dev:coverage`, or `flutter pub add dev:coverage`. The skill's example pubspec: `environment: sdk: ^3.0.0`, `dependencies: path: ^1.8.0`, `dev_dependencies: test: ^1.24.0`, `coverage: ^1.15.0`.
- **With package:test alone:** `dart test --coverage-path=./coverage/lcov.info` writes LCOV (VM or Chrome only); render it with `genhtml -o ./coverage/report ./coverage/lcov.info`.
- **Automated path with package:coverage:** `dart run coverage:test_with_coverage` runs all tests, collects JSON coverage from the Dart VM and writes LCOV. In a workspace name the test directories: `dart run coverage:test_with_coverage -- pkgs/foo/test pkgs/bar/test`. Output: `coverage/coverage.json` (raw) and `coverage/lcov.info` (the report).
- **With Very Good CLI** (third party, used in a community post on reaching 100% coverage): `very_good test --coverage` collects coverage; its docs add `--min-coverage`, `--exclude-coverage` and `--show-uncovered`. The post then renders `genhtml coverage/lcov.info -o coverage/html`.
- **Don't chase 100%:** the same post, after reaching it on a reference app, cautions that in production "Going from 80% to 100% often costs more than it's worth" and "High coverage doesn't mean high-quality tests": "Aim for **meaningful coverage** (70-90%) on critical paths rather than chasing a number." That is one author's range; [testing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/testing/SKILL.md) sets no number and aims tests at failure modes, not lines.
- **A file with no coverage:** make sure the tests import and run it, or add `// coverage:ignore-file` if leaving it out is deliberate.
- **`exit()` gives 0% coverage:** package:coverage reads the VM Service in the paused-on-exit state, which `exit()` skips (see [CLI-APPS.md](CLI-APPS.md)).

**Manual path** (VM service, isolate control, branch or function coverage):

```bash
dart run --pause-isolates-on-exit --disable-service-auth-codes --enable-vm-service=8181 test &
```
```bash
dart run coverage:collect_coverage --wait-paused --uri=http://127.0.0.1:8181/ -o coverage/coverage.json --resume-isolates
```

Optional `--function-coverage` and `--branch-coverage` (branch coverage "requires Dart VM 2.17.0+"). Then:

```bash
dart run coverage:format_coverage --packages=.dart_tool/package_config.json --lcov -i coverage/coverage.json -o coverage/lcov.info --check-ignore
```

**Ignore directives** "prevent generated code or untestable edge cases from lowering coverage scores": line `// coverage:ignore-line`, block `// coverage:ignore-start` ... `// coverage:ignore-end`, file `// coverage:ignore-file`. `--check-ignore` enforces them (the manual workflow passes it to `coverage:format_coverage`).

```dart
// coverage:ignore-file
import 'package:meta/meta.dart';

class SystemConfig {
  final String env;

  SystemConfig(this.env);

  // coverage:ignore-start
  void legacyInit() {
    print('Deprecated initialization');
  }
  // coverage:ignore-end

  bool isProduction() {
    if (env == 'prod') return true;
    return false; // coverage:ignore-line
  }
}
```

## Prove it

- **`dart test`** (or `flutter test`) passes, and `dart test integration_test` passes when the package has integration tests.
- **Every test file** sits under `test/`, mirrors its `lib` path and ends in `_test.dart`.
- **Mocks:** each test file with mocks uses `@GenerateNiceMocks`; `dart run build_runner build` succeeds; no `thenReturn` stubs a `Future` or `Stream`.
- **After a checks migration:** the discovery greps return nothing (or only intended `expect` under `package:test/expect.dart`), `dart analyze` shows no `unawaited_futures` warnings, and no `.equals` compares a collection.
- **Coverage:** `coverage/lcov.info` exists and lists every file under `lib/` not marked `// coverage:ignore-file`.
- **Tags:** every tag used is declared in `dart_test.yaml`, so the run prints no undeclared-tag warnings.
