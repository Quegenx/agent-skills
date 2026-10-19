# Async, streams and isolates

All Dart code runs in isolates: each has its own memory and a single-threaded event loop that handles events one at a time, in order. A `Future` is one result that arrives later (a value or an error), a `Stream` is a sequence of them, and an isolate is how work runs in parallel without sharing memory. Most outcomes come down to three things: every future is awaited or deliberately left unawaited, errors are caught where the `await` or the stream listener is, and long synchronous work leaves the main isolate so the UI does not jank. Lints that enforce this are in [ANALYSIS-AND-LINTS.md](ANALYSIS-AND-LINTS.md); naming and usage rules in [USAGE-AND-DESIGN.md](USAGE-AND-DESIGN.md).

**Contents:** [async and await](#async-and-await) · [Waiting on several futures](#waiting-on-several-futures) · [The Future API](#the-future-api) · [Using streams](#using-streams) · [Creating streams](#creating-streams) · [Isolates](#isolates) · [Long-lived isolates](#long-lived-isolates) · [Recent API changes](#recent-api-changes) · [Prove it](#prove-it)

## async and await

- **`await` works only inside an `async` function.** A compile-time error on `await` or `await for` means the enclosing function is not `async` (for example, write `void main() async` or `Future<void> main() async { ··· }`).
- **An `async` function runs synchronously until its first `await`,** then returns a Future. If the function has a return type `T`, change it to `Future<T>`; with no useful value, return `Future<void>`: `Future<String> lookUpVersion() async => '1.0.0';`.
- **Handle errors with `try` / `catch` / `finally` around `await`.** In `await expression`, a non-Future value is wrapped in a Future.
- **Never call an async function without awaiting by accident** (`checkVersion();`). Enable the `unawaited_futures` and `discarded_futures` lints. Dart 3.9 added the lint `unnecessary_unawaited` and the `@awaitNotRequired` annotation (third-party RandalSchwartz changelog skill); Dart 3.13 added `async_return_with_no_await`.
- **`await for (varOrType identifier in expression) { ... }`** waits for each value until the stream closes; `break` or `return` unsubscribes. Usually do not use `await for` for UI event listeners: those streams never end.

## Waiting on several futures

- **`Future.wait`** completes with all results, or with an error if any fails: `await Future.wait([deleteLotsOfFiles(), copyLotsOfFiles(), checksumLotsOfOtherFiles()]);`.
- **`.wait` on a record or an iterable of futures** keeps each result's type and, on failure, throws `ParallelWaitError`, which lets you handle each error and dispose of the results that succeeded:

```dart
try {
  final (deleteInt, copyString, errorBool) =
      await (delete(), copy(), errorResult()).wait;
} on ParallelWaitError<
  (int?, String?, bool?),
  (AsyncError?, AsyncError?, AsyncError?)
> catch (e) {
  // ...
}
```

- **Iterable form:** `await [delete(), copy(), errorResult()].wait;`, catching `ParallelWaitError<List<bool?>, List<AsyncError?>>` and reading `e.values[i]` / `e.errors[i]`.
- **`Future.any` returns the first future to complete:** start several futures at once (multiple servers, different caches, or a mix of local and remote sources) and continue with whichever finishes first; they can be of different kinds ([ApparenceKit](https://apparencekit.dev/flutter-tips/flutter-future-any-first-response/)):

```dart
import 'dart:async';
import 'package:http/http.dart' as http;

void main() async {
  try {
    // We're racing to get a post from SERVER_1 or SERVER_2
    String postContent = await Future.any([
      getPost('https://api.server1.com/post/1'), // Imagine SERVER_1 URL
      getPost('https://api.server2.com/post/1'), // Imagine SERVER_2 URL
    ]);
    print('Received post content: $postContent');
  } catch (e) {
    print('Failed to get any post: $e');
  }
}

Future<String> getPost(String url) async {
  final response = await http.get(Uri.parse(url));
  if (response.statusCode == 200) {
    return response.body; // Success!
  } else {
    // If a server responds with an error, we throw an Exception
    throw Exception('Failed to load post from $url with status ${response.statusCode}');
  }
}
```

- **The first future to finish wins, error or not.** The API reference: "The returned future is completed with the result of the first future in `futures` to report that it is complete, whether it's with a value or an error. The results of all the other futures are discarded. If `futures` is empty, or if none of its futures complete, the returned future never completes." (https://api.dart.dev/dart-async/Future/any.html). ApparenceKit says the same about errors ("It won't wait for other Futures that might succeed later"), then suggests catching errors inside each future and returning `Future.value(null)` so that `Future.any` can "potentially wait for another Future to succeed". Per the reference, that is wrong: a future that completes with `null` is still the first to complete, and `null` becomes the result. To get the first *success*, the failing futures must not complete at all.
- **Version conflict:** the third-party RandalSchwartz changelog skill lists `ParallelWaitError` and `(f1, f2).wait` at 3.0.0 in one file and "`ParallelWaitError` metadata" in its 3.4 notes. Check https://dart.dev/libraries/dart-async before relying on a specific minimum.

## The Future API

You do not need this API if the code uses `async`, `await` and `try` / `catch`. When you do:

- **`then` is try, `catchError` is catch, `whenComplete` is finally:** `myFunc().then(processValue).catchError(handleError);`, `.whenComplete(server.close)`.
- **Signatures:** `Future<R> then<R>(FutureOr<R> Function(T value) onValue, {Function? onError});` and `Future<T> catchError(Function onError, {bool Function(Object error)? test});`. Use `test` to catch specific errors: `test: (e) => e is FormatException`.
- **Do not register both `onError` and `catchError`** without a compelling reason. An error in the middle of a chain propagates to the next `catchError`.
- **A `catchError` that does not rethrow ends the error, and the chain reports success** ([ApparenceKit](https://apparencekit.dev/flutter-tips/handling-errors-with-futures/)): "The `.then`'s `onError` won't be called, and you might get unexpected 'success' results." With `Future<void> functionInError() async { throw "I am failing"; }`:

```dart
functionInError()
  .catchError((err) => print("error catched"))
  .then(
    (value) => print("success"),
    onError: (err) => print("I failed"),
  );
// Result: ------\n// error catched \n// success
```

- **Rethrow inside `catchError` to keep the error going;** use `catchError` "only when you intend to stop the error propagation or transform it", otherwise handle errors in `then`'s `onError` (same source). The source rethrows with `throw err` inside the callback:

```dart
functionInError()
  .catchError((err) {
    print("error catched");
    throw err;
  })
  .then(
    (value) => print("success"),
    onError: (err) => print("I failed"),
  );
// Result: ------\n// error catched \n// I failed
```

- **An error skips the rest of the chain until a handler:** here `workingFuture()` never runs and the `onError` two links down catches the error from `functionInError()` (same source):

```dart
void main() {
  functionInError()
  .then((res) => workingFuture())
  .then((res) => print("ended"),
  onError: (err) => print("error catched") // This catches the error from functionInError()
  );
}

Future<void> workingFuture() async {
  print("working future");
}

Future<void> functionInError() async {
  throw "I am failing";
}
// Result:\n// error catched
```
- **`whenComplete()`'s future completes like its receiver** unless its callback throws.
- **Register error handlers before the future completes.** Registering `catchError` 500 ms later inside `Future.delayed` leaves the error unhandled.
- **Do not mix sync and async errors.** A function that returns a Future should report errors through the future: wrap the body in `Future.sync(() { ... })`.

## Using streams

- **Two kinds.** Single subscription: listen once (files, web requests). Broadcast: listen at any time, many listeners, re-listen after cancel (for example mouse events).
- **A broadcast stream drops events nobody is listening to.** Broadcast streams "do not buffer events when there is no listener", and "if there are no listeners at the time the event or error is added, it will just be dropped"; a paused listener "will buffer events internally until unpaused or canceled" (https://api.dart.dev/dart-async/StreamController/StreamController.broadcast.html). [ApparenceKit](https://apparencekit.dev/flutter-tips/pause-stream-no-subscriber/) says only that events with no listener "might just disappear", without naming the stream kind; that matches broadcast streams, while a single-subscription controller buffers ([Creating streams](#creating-streams)). Its fix: pause the stream when the last listener unsubscribes and resume it when the first one subscribes, so a new listener gets every event emitted during the pause. The article has no code.
- **Consume with `await for` or `listen()`.** With `await for`, an error event is thrown by the loop and ends it: catch it with `try` / `catch`; code after the loop runs after the stream closes. Most streams stop after the first error. With the Stream API, pass `onError` and `onDone` to `listen`.
- **`listen`'s signature:** `StreamSubscription<T> listen(void Function(T event)? onData, {Function? onError, void Function()? onDone, bool? cancelOnError});`. The subscription can pause, resume and cancel.
- **Methods that return a Future:** `first`, `isEmpty`, `last`, `length`, `single`, `any`, `contains`, `drain`, `elementAt`, `every`, `firstWhere`, `fold`, `forEach`, `join`, `lastWhere`, `pipe`, `reduce`, `singleWhere`, `toList`, `toSet` (all except `drain()` and `pipe()` mirror `Iterable`).
- **Methods that return a new stream:** `cast`, `expand`, `map`, `skip`, `skipWhile`, `take`, `takeWhile`, `where`, `asyncExpand`, `asyncMap`, `distinct`, plus `handleError`, `timeout` and `transform`. Each waits until the new stream is listened to.
- **`handleError` filters errors before `await for`,** since otherwise the first error ends the loop with no recovery.
- **`timeout`:** `timeout(const Duration(seconds: 2), onTimeout: (eventSink) { eventSink.addError('Timed out after 2 seconds'); eventSink.close(); })`.
- **`transform()` takes a `StreamTransformer`** such as `utf8.decoder` or `LineSplitter`: `utf8.decoder.bind(file.openRead()).transform(const LineSplitter())`.

## Creating streams

- **Three ways, in order of preference:** transform an existing stream (`map()`, `where()`, `expand()`, `take()`, or `transform()`); write an `async*` function; use a `StreamController`.
- **`async*` generators.** The body starts when the stream is listened to and the stream closes when the function returns. Emit with `yield` or `yield*`. After `cancel()`, the next `yield` acts as `return` (finally blocks run), and `cancel()`'s future completes when the function exits.

```dart
Stream<int> sumStream(Stream<int> stream) async* {
  var sum = 0;
  await for (final value in stream) {
    yield sum += value;
  }
}
```

- **Periodic values:** `Stream.periodic(const Duration(seconds: 1), (i) => i * i)`.
- **A countdown comes from a stored end time, not from counting ticks** ([ApparenceKit](https://apparencekit.dev/flutter-tips/create-accurate-flutter-timer/)). "Standard timer ticks can be delayed", especially under heavy CPU load. Record the start time, set end time = start + total duration, and on each tick (for example every second) compute remaining = `endTime - currentTime` and update the UI from it; the tick only refreshes the display. After the user leaves the app and comes back, the remaining time is still right: "No lost seconds!" The article has no code.
- **A `StreamController` must wait for a subscriber before starting work** (it buffers events with no subscriber, which risks a memory leak) **and must honor pause** (otherwise the buffer grows without limit). Implement all of `onListen`, `onPause`, `onResume` and `onCancel`:

```dart
Stream<int> timedCounter(Duration interval, [int? maxCount]) {
  late StreamController<int> controller;
  Timer? timer;
  int counter = 0;

  void tick(_) {
    counter++;
    controller.add(counter); // Ask stream to send counter values as event.
    if (counter == maxCount) {
      timer?.cancel();
      controller.close(); // Ask stream to shut down and tell listeners.
    }
  }

  void startTimer() {
    timer = Timer.periodic(interval, tick);
  }

  void stopTimer() {
    timer?.cancel();
    timer = null;
  }

  controller = StreamController<int>(
    onListen: startTimer,
    onPause: stopTimer,
    onResume: startTimer,
    onCancel: stopTimer,
  );

  return controller.stream;
}
```

- **Avoid synchronous controllers** (`StreamController(sync: true)`).
- **`onListen` runs before `listen` returns the subscription;** do not depend on the subscription inside it. State callbacks never fire during an event or during another state handler.
- **Do not implement the `Stream` interface yourself.** Prefer a class that *has* a Stream over one that *is* a Stream.
- **Generator return types (3.10):** a `sync*` or `async*` function with no declared return type infers a non-nullable element type when it yields no null. The third-party RandalSchwartz changelog skill phrases this as a `sync*` generator with no `yield` inferring `Iterable<Never>` instead of `Iterable<dynamic>`.

## Isolates

- **Isolates share no state.** They communicate only by message passing: no mutexes, locks or data races, though race conditions are still possible (the actor model). A global mutable variable is separate in each isolate; isolates are not threads.
- **Messages are copied** between isolates, except immutable objects (String, unmodifiable bytes) and `Isolate.exit` (transfers ownership). "Both `Isolate.run` and `compute` use `Isolate.exit` under the hood." [Flutter isolates](https://docs.flutter.dev/perf/isolates)
- **Platforms:** only Dart Native implements isolates. The web uses web workers (a separate entrypoint compiled separately, data copied). "Multiple Isolates not supported by Flutter web".
- **When to use one:** a computation big enough to block others, most often to keep a Flutter UI responsive. Examples: parsing large JSON; processing or compressing photos, audio or video; converting media; complex search or filtering over large lists or file systems; I/O such as database communication; large volumes of network requests. A long synchronous operation on the main isolate causes jank.
- **`Isolate.run()` is the recommended API** for a single background computation. It spawns an isolate, runs the function, captures the result, returns it, terminates the isolate, and rethrows errors in the calling isolate. The result's memory is transferred, not copied (after a verification pass). It always returns a Future and accepts closures: `await Isolate.run(() async { ... })`. In Flutter you can use `compute` instead. `Isolate.run` arrived in Dart 2.19 (third-party RandalSchwartz changelog skill).

```dart
int slowFib(int n) => n <= 1 ? 1 : slowFib(n - 1) + slowFib(n - 2);

// Compute without blocking current isolate.
void fib40() async {
  var result = await Isolate.run(() => slowFib(40));
  print('Fib(40) = $result');
}
```

- **Isolate groups.** Isolates from `Isolate.spawn()` share executable code (one group). `Isolate.exit()` works only within the same group. `Isolate.spawnUri()` is much slower, is not in the spawner's group, and message passing across groups is slower.
- **Cannot be sent through a `SendPort`:** objects with native resources (for example `Socket`), `ReceivePort`, `DynamicLibrary`, `Finalizable`, `Finalizer`, `NativeFinalizer`, `Pointer`, `UserTag`, and instances of classes marked `@pragma('vm:isolate-unsendable')`. `Isolate.spawn()` and `Isolate.exit()` have the same limits.
- **How many.** Hundreds of isolates can run concurrently with async messaging (round-robin). The parallel limit is computed from the available Dart VM heap size, not hardcoded, and matters only for synchronous blocking through FFI, which may deadlock: C code should leave the isolate (`Dart_ExitIsolate` / `Dart_EnterIsolate`) before blocking.
- **Finding many isolates:** Flutter's `IsolateNameServer` or `package:isolate_name_server`.

## Long-lived isolates

- **Short-lived isolates pay spawn and copy costs.** For repeated work, keep one isolate alive with `Isolate.spawn()`, `Isolate.exit()`, `ReceivePort`, `SendPort` and `SendPort.send()`.
- **Ports.** A `SendPort` is tied to exactly one `ReceivePort`; a `ReceivePort` can have many `SendPort`s. A receive port is a single-listener `Stream`, not a broadcast one.
- **The robust ports pattern:**
  - Create a `RawReceivePort` first, which separates startup from message handling, and complete a `Completer<(ReceivePort, SendPort)>.sync()` from its handler.
  - Wrap `Isolate.spawn` in `try` / `on Object`, closing the init port and rethrowing.
  - Call messages from the main isolate to the worker *commands* and messages back *responses*.
  - Tag each request with an id in a record `(id, message)` and track `Map<int, Completer<Object?>> _activeRequests`, so out-of-order responses reach the right caller.
  - On failure, the worker sends `RemoteError(e.toString(), '')` and the caller runs `completer.completeError(response)`.
  - `close()` sends `'shutdown'` and closes the responses port once no requests are active; calls after close throw `StateError('Closed')`.
  - Close the channels and stop the isolate when its task finishes "or if the user leaves the page", to save resources ([ApparenceKit](https://apparencekit.dev/flutter-tips/isolates-communication-flutter-guide/), which names no API for it).
  - The complete example is under "Robust ports example" at https://dart.dev/language/isolates.

```dart
static Future<Worker> spawn() async {
  // Create a receive port and add its initial message handler.
  final initPort = RawReceivePort();
  final connection = Completer<(ReceivePort, SendPort)>.sync();
  initPort.handler = (initialMessage) {
    final commandPort = initialMessage as SendPort;
    connection.complete((
      ReceivePort.fromRawReceivePort(initPort),
      commandPort,
    ));
  };

  // Spawn the isolate.
  try {
    await Isolate.spawn(_startRemoteIsolate, (initPort.sendPort));
  } on Object {
    initPort.close();
    rethrow;
  }

  final (ReceivePort receivePort, SendPort sendPort) =
      await connection.future;

  return Worker._(receivePort, sendPort);
}
```

## Recent API changes

- **`Future.pause([Duration? duration])` (3.13):** an alternative to `Future.delayed` when there is no callback.
- **`Future.syncValue` (3.10)** (third-party RandalSchwartz changelog skill).
- **Experimental isolate APIs are being removed.** The third-party RandalSchwartz changelog skill lists `Isolate.runSync`, `Isolate.create`, `Isolate.shutdownSync`, `Isolate.pinToCurrentThread` / `isPinnedToCurrentThread`, `Isolate.runEventLoopSync` and `Isolate.onEvent` / `handleEvent` as Dart 3.13 additions. The official SDK CHANGELOG says they were "accidentally exposed in Dart 3.13" and lists their unshipping as a breaking change under the unreleased 3.14.0 (sdk#64285).
- **`dart:cli` `waitFor` was removed in 3.4** (third-party RandalSchwartz changelog skill).

## Prove it

- **No dropped futures:** `unawaited_futures` and `discarded_futures` are enabled and `dart analyze` reports nothing for them.
- **Errors reach a handler:** every `await` that can fail sits in a `try` / `catch`, every `listen` passes `onError`, and no `catchError` is registered after the future may already have completed.
- **`catchError` is deliberate:** each `catchError` either rethrows or is meant to end the error; no `Future.any` relies on a `null` result to wait for a later success.
- **Timers survive delay:** a countdown test that delays ticks or advances the clock still shows the remaining time computed from the stored end time.
- **Parallel waits:** code that awaits a record or list with `.wait` catches `ParallelWaitError` and handles `e.errors` and `e.values`.
- **Controllers behave:** a test listens late, pauses and cancels a custom `StreamController` stream and checks that no work starts before `onListen` and that work stops on `onPause` and `onCancel`.
- **Main isolate stays free:** large JSON parsing and media work run through `Isolate.run` (or `compute` in Flutter), and nothing unsendable (a `Socket`, a `ReceivePort`, a `Pointer`) is captured in the closure.
- **No experimental isolate APIs:** a search for `Isolate.runSync`, `Isolate.create` or `pinToCurrentThread` finds nothing.
