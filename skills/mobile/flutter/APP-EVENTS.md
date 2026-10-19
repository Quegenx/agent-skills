# App events

ApparenceKit's community recipe for events between services, with its existing Dart buffering and exhaustiveness caveats preserved. Source: [ApparenceKit](https://apparencekit.dev/blog/flutter-app-events/), extracted from the former Flutter UX widget patterns.

## Global app events

[ApparenceKit](https://apparencekit.dev/blog/flutter-app-events/)

- **The problem:** one action (a game ends) calls many services directly (`serviceA.onGameEnded()`, `reviewService.onGameEnded()`, `ratingService.onGameEnded()`, `experienceService.onGameEnded()`...). You get concurrency you cannot follow ("You don't know who is doing something before another"), services that know each other, and code that is "completely impossible to test ... with unit test".
- **The fix:** the Observer pattern with one global queue, a single `AppEventsDispatcher` instance ("So only one queue will be available for our all app"). Each service listens for the events it cares about; tests "simply have to publish events". `asBroadcastStream` "allow you to have multiple simultaneous listeners".

```dart
class AppEventsDispatcher<T extends AppEvent> {
  final StreamController<T> _controller;
  late final Stream<T?> _stream;

  Stream<T?> get stream => _stream;

  final List<T> _onNotificationEventsSubscriber;

  AppEventsDispatcher()
      : _onNotificationEventsSubscriber = [],
        _controller = StreamController() {
    _stream = _controller.stream.asBroadcastStream();
  }

  void dispose() {
    _onNotificationEventsSubscriber.clear();
    _controller.close();
  }

  void publish(T event) {
    _controller.add(event);
  }
}
```

```dart
sealed class AppEvent { }

// or

abstract class AppEvent { }
```

```dart
appEventDispatcher.stream.listen(onEvent);
```

```dart
Future<void> onEvent(AppEvent? event) async {
    if (event == null) {
	    return;
    }
    switch (event) {
      case OnStartGameEvent endGameEvent:
        // handle startGame
      case OnEndGameEvent endGameEvent:
	      // handle endGameEvent
      default:
    }
}
```

- The author prefers `sealed` because "it has the advantage to force me handling any new cases I add"; the article's own `default:` branch turns that exhaustiveness check off (exhaustiveness: [dart LANGUAGE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/dart/LANGUAGE.md)). `_onNotificationEventsSubscriber` is only ever cleared.
- **Buffering, two views.** The article's single-subscription `StreamController()` accepts `publish` calls with no listener, and `asBroadcastStream` subscribes only on its first listen, so earlier events are buffered. The Dart guidance says "A `StreamController` must wait for a subscriber before starting work (it buffers events with no subscriber, which risks a memory leak)" ([dart ASYNC.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/dart/ASYNC.md)); the flutter skill's own key-value recipe uses `StreamController<bool>.broadcast()` ([flutter DATA-AND-NETWORKING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/DATA-AND-NETWORKING.md)). The article's design keeps services unaware of each other, which also fits "Repositories never know about each other" ([flutter ARCHITECTURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ARCHITECTURE.md)).
- "Getting further" (no code): events with a priority, consumed by the first service that needs them; a queue consumed one by one; a replayable queue; "make sure something will only be done once." "Don't forget to close the stream subscription" when the listener does not stay alive.

## Prove it

- Close the stream subscription when its listener does not stay alive. [ApparenceKit](https://apparencekit.dev/blog/flutter-app-events/)
- For buffering behavior, apply the two tagged views in [Global app events](#global-app-events). [existing flutter-ux, WIDGET-PATTERNS.md#global-app-events]
