# Architecture

How a Flutter app is split into layers so each piece can change and be tested alone. Separation of concerns is the most important principle: a UI layer (views and view models, MVVM) over a data layer (repositories and services), with an optional domain layer between them. The rules the sources stress: widgets stay free of data logic, the repository is the only class that changes its data (the single source of truth), and dependencies arrive through constructors. The recommendations are guidelines, not steadfast rules: adapt them to your requirements. The language itself is [dart SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/dart/SKILL.md).

**Contents:** [The layers](#the-layers) · [Recommendations by priority](#recommendations-by-priority) · [Project structure](#project-structure) · [Views](#views) · [View models](#view-models) · [Repositories](#repositories) · [Services](#services) · [Domain layer and use cases](#domain-layer-and-use-cases) · [Dependency injection](#dependency-injection) · [Commands](#commands) · [The Result type](#the-result-type) · [Optimistic state](#optimistic-state) · [State management options](#state-management-options) · [Building a feature, in order](#building-a-feature-in-order) · [The Compass case study](#the-compass-case-study) · [Testing each layer](#testing-each-layer) · [Prove it](#prove-it)

## The layers

- **Two to three layers.** UI (presentation), Logic (domain, optional; CRUD apps may not need it), Data. View models in the UI layer depend on repositories in the data layer; the repositories stay private to the view models. [Architecture guide](https://docs.flutter.dev/app-architecture/guide), [UI-layer case study](https://docs.flutter.dev/app-architecture/case-study/ui-layer)
  - P2 correction: the old line said the UI and data layers did not know each other existed, contradicting the view-model/repository dependency below.
- **MVVM mapping.** Views plus view models are the UI layer; repositories plus services are the data (model) layer.
- **Every feature has** one view to describe the UI, one view model for its logic, one or more repositories as sources of truth, and zero or more services that talk to external APIs (servers, platform plugins).
- **Never mix UI rendering with business logic or data fetching.**
- **Single source of truth (SSOT).** If the app can modify a piece of data, the SSOT class is the only class that can do so; generally that is a repository. Within a class, derive values from the SSOT field with getters, and use a list of records instead of parallel lists.
- **Unidirectional data flow.** (1) A UI event calls a logic-layer method; (2) the logic calls a repository; (3) the repository updates data and returns it; (4) the logic saves the new state and sends it to the UI; (5) the UI displays it. Data changes always happen in the SSOT, the data layer.
- **UI is a function of (immutable) state.** Data is immutable and persistent; views contain as little logic as possible.
- **Testability.** Test a view model by mocking a repository; adding a new view model cannot break any logic from the data or business logic layers.

| Who | Knows | Unaware of |
|---|---|---|
| View | Exactly one view model | Everything else |
| View model | One or more repositories (through its constructor) | Its view |
| Repository | Many services (through its constructor) | The view models that use it, and other repositories |
| Service | The API endpoint or data source it wraps | The repositories that use it |

Repositories and view models are many to many; services and repositories are many to many.

## Recommendations by priority

Strong: always do it in a new app, consider refactoring existing apps. Recommend: will likely improve your app. Conditional: helps in certain circumstances.

| Recommendation | Priority | Note |
|---|---|---|
| Clearly defined data and UI layers | Strong | |
| Repository pattern in the data layer (repository plus service classes) | Strong | |
| ViewModels and Views in the UI layer (MVVM) | Strong | Widgets stay "dumb" |
| No logic in widgets | Strong | Only the four kinds listed under [Views](#views) |
| Unidirectional data flow | Strong | |
| Immutable data models | Strong | |
| Dependency injection | Strong | Use the `provider` package |
| Abstract repository classes | Strong | Different implementations, for example "development" and "staging" |
| Test components separately and together | Strong | Unit tests for every service, repository and view model; widget tests for views; testing routing and DI is particularly important |
| Fakes for testing | Strong | Fakes care about inputs and outputs |
| `Commands` for user interaction events | Recommend | Prevents rendering errors and standardizes how the UI sends events to the data layer |
| `freezed` or `built_value` for immutable models | Recommend | JSON serialization, deep equality, copy methods; can add significant build time if you have a lot of models |
| `go_router` for navigation | Recommend | Preferred for 90% of apps; see [ROUTING-AND-DEEP-LINKS.md](ROUTING-AND-DEEP-LINKS.md) |
| Standardized naming | Recommend | `HomeViewModel`, `HomeScreen`, `UserRepository`, `ClientApiService` |
| `ChangeNotifier` and `Listenable` for widget updates | Conditional | State management is ultimately personal preference |
| A domain layer | Conditional | Apps with complex logic; in most apps use cases add unnecessary overhead |
| Separate API models and domain models | Conditional | Large apps |

## Project structure

- **Hybrid layout.** Group the UI by feature (one view plus one view model each); group the data layer by type, since it is shared across features.
- **Shared widgets go in `ui/core/`,** not a directory called `/widgets`, so names do not clash with Flutter SDK objects.
- **The two sources draw the tree differently.** The `flutter-apply-architecture-best-practices` skill uses `ui/features/<feature>/views/` and `data/models/`; the Compass case study uses `ui/<feature>/widgets/` and `data/model/`. Both put API models in `data/` and clean models in `domain/models/`. A third-party layout, ApparenceKit's template [community]: a `core` folder for shared code plus "a module folder for each module of your app", in "an hexagonal architecture so your business logic is totally decoupled from your UI"; "Take the module you don't want to use and delete it" ([ApparenceKit](https://apparencekit.dev/blog/flutter-template-advantages/)).

The skill's tree:

```text
lib/
├── data/
│   ├── models/         # API models
│   ├── repositories/   # Repository implementations
│   └── services/       # API clients, local storage wrappers
├── domain/
│   ├── models/         # Clean domain models
│   └── use_cases/      # Optional business logic classes
└── ui/
    ├── core/           # Shared widgets, themes, typography
    └── features/
        └── [feature_name]/
            ├── view_models/
            └── views/
```

The Compass app's tree:

```
lib/
  ui/
    core/
      ui/
        <shared_widgets>
      themes/
    <feature_name>/
      view_models/
        <view_model_class>.dart
      widgets/
        <feature_name>_screen.dart
        <other_widgets>
  domain/
    models/
      <model_name>.dart
  data/
    repositories/
      <repository_class>.dart
    services/
      <service_class>.dart
    model/
      <api_model_class>.dart
  config/
  utils/
  routing/
  main_staging.dart
  main_development.dart
  main.dart
test/      // Contains unit and widget tests. (structure matches lib/)
  data/ domain/ ui/ utils/
testing/   // Contains mocks that other classes need to execute tests.
  fakes/
  models/
```

- **Three entry points:** `main_development.dart`, `main_staging.dart`, `main.dart` (production). Flavors are in [BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md).
- **`testing/` is a subpackage** of mocks and test utilities that other packages' tests can use: a version of your app you do not ship.

## Views

- **A view is a composition of widgets that make a feature,** often a screen with a `Scaffold` and everything below it. Not every view is a screen: logout can be a `LogoutViewModel` plus a `LogoutView` holding one button you drop into other widgets.
- **Views and view models are one to one.** A view model maps to a collection of widgets, not to one widget.
- **The only logic a view may contain:** simple if-statements that show or hide widgets based on a flag or nullable field in the view model; animation logic (that relies on the widget to calculate); layout logic based on device information (screen size, orientation); simple routing logic. All logic related to data belongs in the view model.
- **A view's inputs are a `key` and its view model.** All data comes from the view model.
- **Listen with `ListenableBuilder`** (or `AnimatedBuilder`) on the view model. Key list items with `ValueKey(viewModel.bookings[index].id)`: without keys an insert in the middle "shifts" every later child so stateful children "lose their state"; with keys they keep "State, animation progress, scroll position" ([renderobjects](https://renderobjects.com/guides/children/list-of-children/)).

## View models

- **Responsibilities:** retrieve data from repositories and transform it (filter, sort, aggregate); keep the current state so the view can rebuild without losing data; expose callbacks, called commands, to the view.
- **Inputs and outputs only.** A view model takes in data sources such as repositories and exposes only commands and data formatted for views.
- **Repositories are private members,** assigned in the constructor; otherwise the view would have direct access to the data layer.

```dart
class HomeViewModel {
  HomeViewModel({
    required BookingRepository bookingRepository,
    required UserRepository userRepository,
  }) :
    // Repositories are manually assigned because they're private members.
    _bookingRepository = bookingRepository,
    _userRepository = userRepository;

  final BookingRepository _bookingRepository;
  final UserRepository _userRepository;
  // ...
}
```

- **UI state is an immutable snapshot** of the data needed to fully render a view. Expose lists as `UnmodifiableListView<BookingSummary> get bookings => UnmodifiableListView(_bookings);`. For complex state you might create a `HomeUiState` class.
- **Extend `ChangeNotifier`** (or use `Listenable`) and call `notifyListeners()` when new data arrives (the Compass `_load` example calls it in a `finally` block). The flow: repository provides state, view model updates, `notifyListeners`, view re-renders.
- **Combine data from two repositories in the view model** (or the domain layer). Repositories never know about each other. A community alternative for one action that many services react to: a global `AppEventsDispatcher` stream each service listens to, tested by publishing events ([flutter-ux WIDGET-PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/APP-EVENTS.md#global-app-events)).

The skill's service, repository, view model and view, end to end:

```dart
// 1. Service (Raw API interaction)
class ApiClient {
  Future<UserApiModel> fetchUser(String id) async {
    // HTTP GET implementation...
  }
}

// 2. Repository (Single source of truth, returns Domain Model)
class UserRepository {
  UserRepository({required ApiClient apiClient}) : _apiClient = apiClient;
  
  final ApiClient _apiClient;
  User? _cachedUser;

  Future<User> getUser(String id) async {
    if (_cachedUser != null) return _cachedUser!;
    
    final apiModel = await _apiClient.fetchUser(id);
    _cachedUser = User(id: apiModel.id, name: apiModel.fullName); // Transform to Domain Model
    return _cachedUser!;
  }
}
```

```dart
// 3. ViewModel (State management and presentation logic)
class ProfileViewModel extends ChangeNotifier {
  ProfileViewModel({required UserRepository userRepository}) 
      : _userRepository = userRepository;

  final UserRepository _userRepository;

  User? _user;
  User? get user => _user;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  Future<void> loadProfile(String id) async {
    _isLoading = true;
    notifyListeners();

    try {
      _user = await _userRepository.getUser(id);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}

// 4. View (Dumb UI component)
class ProfileView extends StatelessWidget {
  const ProfileView({super.key, required this.viewModel});

  final ProfileViewModel viewModel;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: viewModel,
      builder: (context, _) {
        if (viewModel.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        
        final user = viewModel.user;
        if (user == null) {
          return const Center(child: Text('User not found'));
        }

        return Column(
          children: [
            Text(user.name),
            ElevatedButton(
              onPressed: () => viewModel.loadProfile(user.id),
              child: const Text('Refresh'),
            ),
          ],
        );
      },
    );
  }
}
```

## Repositories

- **The source of truth for model data.** Repositories poll services and turn raw data into domain models. Write one repository class for each type of data the app handles (Compass: `UserRepository`, `BookingRepository`, `AuthRepository`, `DestinationRepository`).
- **They own** caching, error handling, retry logic, refreshing data, polling services, refreshing on user actions, and synchronizing data when offline is supported (see [DATA-AND-NETWORKING.md](DATA-AND-NETWORKING.md)).
- **They can expose streams,** for example a `UserProfileRepository` exposing `Stream<UserProfile?>`.
- **App-wide session state** (active user session, in-memory caches, transient settings) lives in repositories; several view models share the same repository instance through a service locator or DI container.
- **Services are private members** of the repository, so the UI layer cannot bypass the repository and call a service directly.
- **Domain models hold only the data the rest of the app needs.** A repository may combine several service endpoints into one domain model.
- **Abstract repository, several implementations.** `class BookingRepositoryRemote implements BookingRepository` takes an `ApiClient`; `BookingRepositoryLocal` serves local development.

## Services

- **The lowest layer.** Services wrap API endpoints (REST endpoints, platform APIs, local files) and expose `Future` and `Stream`. One service class per data source.
- **Stateless, without side effects.** Any data the app needs that is not created inside the app's own code is fetched from a service class.
- **Return raw API models or `Result` wrappers.** Compass's `ApiClient` exposes `Future<Result<List<ContinentApiModel>>> getContinents()`, `getDestinations()`, `getActivityByDestination(String ref)`, `getBookings()`, `getBooking(int id)`, `postBooking(BookingApiModel)`, `Future<Result<void>> deleteBooking(int id)`, `getUser()`.
- **Wrap third-party plugins** in a service (for example a `SharedPreferencesService`) to hide the dependency from the rest of the app. The HTTP client itself is in [DATA-AND-NETWORKING.md](DATA-AND-NETWORKING.md).

## Domain layer and use cases

- **Add use cases (interactors) only when needed:** when logic merges data from several repositories, is exceedingly complex, or is reused by different view models. The skill puts it the same way: only if business logic clutters the view model or must be shared; skip it for simple CRUD.
- **Pros:** less duplication, better testability and readability. **Cons:** more classes and cognitive load, more mocks, boilerplate.
- **Rules:** use cases depend on repositories; use cases and repositories are many to many; a view model can depend on one or more use cases and one or more repositories at once.

### CQRS variant (community)

One developer's Clean Architecture pattern (Emin Şahin, "CQRS Pattern in Flutter", DEV), community practice and not Flutter team guidance. It puts operations in use cases, including pass-through reads such as `CheckUserExists`, which conflicts with the official advice above to add use cases only when needed. The CQRS idea itself is in [domain-modeling EVENTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/architecture/domain-modeling/EVENTS.md#cqrs).

- **Type use cases by their nature:** "Name your operations by what they DO, and type them by their NATURE (read vs write)." With a separate base type for reads and writes, the post says, team members "can easily find all write vs read operations".
- **Not the Compass `Command`:** a CQRS command is a write use case in the domain layer; a Compass [command](#commands) is a view model property that wraps any action, read or write, for the view.
- **`FutureResult<T>` is never defined** in the post; its `fold((failure) => ..., (value) => ...)` calls point to an Either-style type rather than the Compass `Result`.

```dart
/// Base class for commands that mutate state
abstract class Command<Params, Output> {
  const Command();

  FutureResult<Output> call(Params params);
}

/// Base class for queries that read data
abstract class Query<Params, Output> {
  const Query();

  FutureResult<Output> call(Params params);
}
```

- **No-params and stream variants:** the post adds `CommandNoParams<Output>` and `QueryNoParams<Output>` (`call()` with no argument), and `StreamQuery<Params, Output>` and `StreamCommand<Params, Output>` returning `StreamResult<Output>`, for example a `WatchAuthChanges` query that emits whenever the auth state changes.

## Dependency injection

- **Use `package:provider`.** Teams at Google recommend it for DI, based on their experience building Flutter apps. The skill names `provider` or `get_it`.
- **Inject through constructors and keep the injected component private** inside the view model or repository.
- **Register services and repositories at the root,** typed as their abstract repository:

```dart
runApp(
  MultiProvider(
    providers: [
      Provider(create: (context) => AuthApiClient()),
      Provider(create: (context) => ApiClient()),
      Provider(create: (context) => SharedPreferencesService()),
      ChangeNotifierProvider(
        create: (context) => AuthRepositoryRemote(
          authApiClient: context.read(),
          apiClient: context.read(),
          sharedPreferencesService: context.read(),
        ) as AuthRepository,
      ),
      Provider(create: (context) =>
        DestinationRepositoryRemote(
          apiClient: context.read(),
        ) as DestinationRepository,
      ),
      Provider(create: (context) =>
        ContinentRepositoryRemote(
          apiClient: context.read(),
        ) as ContinentRepository,
      ),
      // In the Compass app, additional service and repository providers live here.
    ],
    child: const MainApp(),
  ),
);
```

- **Create screen view models in the `go_router` route builders,** reading repositories with `context.read()`, for example `HomeScreen(viewModel: HomeViewModel(bookingRepository: context.read()))`. The full Compass router is in [ROUTING-AND-DEEP-LINKS.md](ROUTING-AND-DEEP-LINKS.md#redirects-and-auth).

## Commands

- **The problem they solve.** Without commands each action needs its own `runningLoad`, `errorLoad`, `runningEdit`, `errorEdit`; a shared running flag does not work; and UI actions triggered by listening to the view model (a SnackBar, navigation) need the error cleared each time, otherwise the action fires on every `notifyListeners()`.
- **A command is a persistent view model property** wrapping one async action, with `running`, `error` and `completed` states. Because it persists, it does not matter when the load resolves relative to the view's first render. (With streams and `StreamBuilder`, `AsyncSnapshot` gives you this built in.)
- **`execute()`** sets running, resets error and completed, and when done sets running false. While `running` is true the command cannot start again, which stops users triggering it by tapping a button rapidly. The recipe says `execute()` captures thrown exceptions and exposes them in the `error` state; in the Compass class below the action itself returns a `Result`.
- **`Command0`, `Command1`:** the number is the argument count.
- **Create commands in the view model constructor:** `load = Command0(_load)..execute(); deleteBooking = Command1(_deleteBooking);` with `late Command0 load; late Command1<void, int> deleteBooking;`. The view calls `viewModel.deleteBooking.execute(id)` (for example from a `Dismissible`).
- **Package option:** `command_it` provides command types that track running, completed and error.
- **Repeated taps, a community alternative:** ApparenceKit debounces taps with RxDart, a `BehaviorSubject` of taps, `.debounceTime()` (example 1000 ms), `.listen()` for the action, and the subscription cancelled in `dispose()` ([ApparenceKit](https://apparencekit.dev/flutter-tips/prevent-button-spam-flutter-rxdart/)). It adds `rxdart` and runs the action only after the pause; the command's `running` flag [official] needs no package and runs the first tap at once.

The Compass `Command`, verbatim:

```dart
import 'dart:async';

import 'package:flutter/foundation.dart';

import 'result.dart';

/// Defines a command action that returns a [Result] of type [T].
/// Used by [Command0] for actions without arguments.
typedef CommandAction0<T> = Future<Result<T>> Function();

/// Defines a command action that returns a [Result] of type [T].
/// Takes an argument of type [A].
/// Used by [Command1] for actions with one argument.
typedef CommandAction1<T, A> = Future<Result<T>> Function(A);

abstract class Command<T> extends ChangeNotifier {
  bool _running = false;

  /// Whether the action is running.
  bool get running => _running;

  Result<T>? _result;

  /// Whether the action completed with an error.
  bool get error => _result is Error;

  /// Whether the action completed successfully.
  bool get completed => _result is Ok;

  /// The result of the most recent action.
  ///
  /// Returns `null` if the action is running or completed with an error.
  Result<T>? get result => _result;

  /// Clears the most recent action's result.
  void clearResult() {
    _result = null;
    notifyListeners();
  }

  /// Execute the provided [action], notifying listeners and
  /// setting the running and result states as necessary.
  Future<void> _execute(CommandAction0<T> action) async {
    // Ensure the action can't launch multiple times.
    // e.g. avoid multiple taps on button
    if (_running) return;

    // Notify listeners.
    // e.g. button shows loading state
    _running = true;
    _result = null;
    notifyListeners();

    try {
      _result = await action();
    } finally {
      _running = false;
      notifyListeners();
    }
  }
}

/// A [Command] that accepts no arguments.
final class Command0<T> extends Command<T> {
  /// Creates a [Command0] with the provided [CommandAction0].
  Command0(this._action);

  final CommandAction0<T> _action;

  /// Executes the action.
  Future<void> execute() async {
    await _execute(_action);
  }
}

/// A [Command] that accepts one argument.
final class Command1<T, A> extends Command<T> {
  /// Creates a [Command1] with the provided [CommandAction1].
  Command1(this._action);

  final CommandAction1<T, A> _action;

  /// Executes the action with the specified [argument].
  Future<void> execute(A argument) async {
    await _execute(() => _action(argument));
  }
}
```

- **Render by command state.** Listen to the command, show progress while running, an error with a retry while in error, else the child:

```dart
child: ListenableBuilder(
  listenable: viewModel.load,
  builder: (context, child) {
    if (viewModel.load.running) {
      return const Center(child: CircularProgressIndicator());
    }

    if (viewModel.load.error) {
      return ErrorIndicator(
        title: AppLocalization.of(context).errorWhileLoadingHome,
        label: AppLocalization.of(context).tryAgain,
          onPressed: viewModel.load.execute,
        );
     }

    // The command has completed without error.
    // Return the main view widget.
    return child!;
  },
),
```

- **Stack two builders** to show running and error before data: `ListenableBuilder(listenable: widget.viewModel.load, ...)` with `child: ListenableBuilder(listenable: widget.viewModel, ...)`.
- **UI actions from a listener: clear, then act.**

```dart
void _onViewModelChanged() {
  if (widget.viewModel.load.error != null) {
    widget.viewModel.load.clear();
    // Show Snackbar
  }
}
```

- **The recipe's listener snippet and the Compass class do not match.** The snippet tests `load.error != null` and calls `load.clear()`; the Compass class exposes `bool get error` and `clearResult()`. Confirm against the current recipe and the Compass source.
- **After a successful add,** clear the input when `add.completed`, then call `add.clearResult()`.

## The Result type

- **Why.** Dart exceptions are unchecked: methods that throw need not declare it, and callers need not catch, which in large projects leads to crashes. A `Result` forces callers to check for errors, improves control flow over try-catch, and being `sealed` works with `switch`.
- **It is a recommendation, not a requirement.** Ready-made packages: `result_dart`, `result_type`, `multiple_result`.

```dart
sealed class Result<T> {
  const Result();

  /// Creates a successful [Result], completed with the specified [value].
  const factory Result.ok(T value) = Ok._;

  /// Creates an error [Result], completed with the specified [error].
  const factory Result.error(Exception error) = Error._;
}

/// A successful [Result] with a returned [value].
final class Ok<T> extends Result<T> {
  const Ok._(this.value);

  /// The returned value of this result.
  final T value;

  @override
  String toString() => 'Result<$T>.ok($value)';
}

/// An error [Result] with a resulting [error].
final class Error<T> extends Result<T> {
  const Error._(this.error);

  /// The resulting error of this result.
  final Exception error;

  @override
  String toString() => 'Result<$T>.error($error)';
}
```

- **Unwrap with a `switch`:**

```dart
switch (result) {
  case Ok<UserProfile>():
    userProfile = result.value;
  case Error<UserProfile>():
    error = result.error;
}
```

- **Services catch everything into the Result:** `on Exception catch (exception) { return Result.error(exception); }`; a non-200 response returns `const Result.error(HttpException('Invalid response'))`. Repositories wrap the same way: `try { ... } on Exception catch (e) { return Result.error(e); }`.
- **Fallbacks without nested try/catch:** `if (apiResult is Ok) return apiResult; ... return Result.error(Exception('Failed to get user profile'));`.

## Optimistic state

- **Show success before the background task finishes, revert on failure.** Anything taking more than a few milliseconds can feel slow or unresponsive to the user.

```dart
Future<void> subscribe() async {
  // Ignore taps when subscribed.
  if (subscribed) {
    return;
  }

  // Optimistic state.
  // It will be reverted if the subscription fails.
  subscribed = true;
  // Notify listeners to update the UI.
  notifyListeners();

  try {
    await subscriptionRepository.subscribe();
  } catch (e) {
    print('Failed to subscribe: $e');
    // Revert to the previous state.
    subscribed = false;
    // Set the error state.
    error = true;
  } finally {
    notifyListeners();
  }
}
```

- **Show the error from a listener** added in `initState` and removed in `dispose` (call `removeListener()` on dispose to avoid errors). Reset `error = false` before `ScaffoldMessenger.of(context).showSnackBar(...)` so it is not shown more than once. ApparenceKit instead shows toasts from Riverpod notifiers through a navigator `GlobalKey` ([RIVERPOD.md](RIVERPOD.md#toasts-from-notifiers)).
- **A third pending state** (for example a chat message with a pending icon) can come from the command's running state.
- **The recipe's button styles** for the two states:

```dart
class SubscribeButtonStyle {
  static const unsubscribed = ButtonStyle(
    backgroundColor: WidgetStatePropertyAll(Colors.red),
  );

  static const subscribed = ButtonStyle(
    backgroundColor: WidgetStatePropertyAll(Colors.green),
  );
}
```

## State management options

- **Ephemeral state** (UI or local state) lives in one widget: the current `PageView` page, animation progress, the selected `BottomNavigationBar` tab. All you need is a `StatefulWidget`. **App state** is shared across parts of the app and kept between sessions: preferences, login info, notifications, a cart, read/unread. There is no universal rule ("Do whatever is less awkward"). The Flutter team uses `setState` for all state in many simple samples, including the `flutter create` starter.
- **Built-in approaches:**

| API | Use |
|---|---|
| `setState` | Low level, widget-specific ephemeral state |
| `ValueNotifier`, `InheritedNotifier` | Only Flutter-provided APIs |
| `InheritedWidget`, `InheritedModel` | Low level, ancestors to children; what `provider` and many others use under the hood |
| `ChangeNotifier` | Part of `flutter:foundation`; what the architecture guide's view models extend |

- **Depend or read once.** Choose dependency-creating versus one-shot lookups using the canonical [ancestor lookup rules](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-render-objects/ELEMENTS.md#ancestor-and-descendant-lookups). Keep that lookup fresh across builds; costs are in [PERFORMANCE.md](PERFORMANCE.md#build-cost).
  - P2 correction: the old line grouped `Form.of` and `Scrollable.of` with the one-shot `Scaffold.of` lookup. The official dependency distinction and original renderobjects source claim are recorded at that owner. [Form.of](https://api.flutter.dev/flutter/widgets/Form/of.html), [Scrollable.of](https://api.flutter.dev/flutter/widgets/Scrollable/of.html)
- **An `InheritedNotifier` in practice:** a `ThemeProvider` above `MaterialApp` switches the theme mode without a restart ([flutter-ui THEMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/THEMING.md)).

- **Community packages.** The state management options page no longer names packages; it points to the pub.dev `state-management` topic and says the best choice depends on the app's complexity, the team's preferences and the problem. The architecture pages name `riverpod`, `flutter_bloc` and `signals` as alternatives to `ChangeNotifier`, and the Compass UI could have used streams or those libraries. One third-party Riverpod architecture, and where it departs from this file, is [RIVERPOD.md](RIVERPOD.md).
- **Start with `provider`** if you are new to Flutter and have no strong reason for another approach (Redux, Rx, hooks). Install with `flutter pub add provider`, import `package:provider/provider.dart`. Three concepts: `ChangeNotifier`, `ChangeNotifierProvider`, `Consumer`.
- **Call `notifyListeners()`** whenever the model changes in a way that might change the UI. A `ChangeNotifier` is unit-testable without widget tests:

```dart
test('adding item increases total cost', () {
  final cart = CartModel();
  final startingPrice = cart.totalPrice;
  var i = 0;
  cart.addListener(() {
    expect(cart.totalPrice, greaterThan(startingPrice));
    i++;
  });
  cart.add(Item('Dash'));
  expect(i, 1);
});
```

- **Do not place `ChangeNotifierProvider` higher than necessary** (it pollutes the scope). It does not rebuild the model unless necessary and calls `dispose()` automatically. Several at once: `MultiProvider(providers: [ChangeNotifierProvider(create: (context) => CartModel()), Provider(create: (context) => SomeOtherClass())], child: const MyApp())`.
- **`Consumer<CartModel>` needs the generic** (provider is based on types). Put `Consumer` widgets as deep in the tree as possible, and pass an expensive subtree as `child` so it is built once:

```dart
return Consumer<CartModel>(
  builder: (context, cart, child) => Stack(
    children: [
      // Use SomeExpensiveWidget here, without rebuilding every time.
      ?child,
      Text('Total price: ${cart.totalPrice}'),
    ],
  ),
  // Build the expensive widget here.
  child: const SomeExpensiveWidget(),
);
```

- **Only calling a method, not displaying data:** `Provider.of<CartModel>(context, listen: false).removeAll();` does not rebuild the widget on `notifyListeners`.
- **State lost on restart:** see Restore state on Android (`/platform-integration/android/restore-state-android`) and iOS (`/platform-integration/ios/restore-state-ios`) on docs.flutter.dev.

## Building a feature, in order

1. Immutable domain models with `freezed` or `built_value`.
2. Services.
3. Repositories.
4. A use case, only for complex transforms or cross-repository logic; skip it for simple CRUD.
5. A view model extending `ChangeNotifier`, exposing immutable state and commands.
6. A view that listens with `ListenableBuilder` or `AnimatedBuilder`.
7. Register the service, repository and view model in the DI container.
8. Unit tests for the view model and the repository.

Compass models use `package:freezed` for deep immutability plus `copyWith` and `toJson`:

```dart
@freezed
class User with _$User {
  const factory User({
    /// The user's name.
    required String name,

    /// The user's picture URL.
    required String picture,
  }) = _User;

  factory User.fromJson(Map<String, Object?> json) => _$UserFromJson(json);
}
```

## The Compass case study

- **What it is:** a trip itinerary booking app with an HTTP server, development and production environments, brand-specific styling and high test coverage; the docs walk through its "Home" feature. Source: https://github.com/flutter/samples/tree/main/compass_app (the `Command` lives at `app/lib/utils/command.dart`).
- **Wiring:** `MultiProvider` at the root with services and abstract-typed repositories; `GoRouter` with `refreshListenable: authRepository` and a top-level `redirect`; view models built in route builders; views take only `key` and `viewModel`; commands drive loading and error UI; `context.push(Routes.bookingWithId(id))` for navigation.
- **Layer communication** used method calls including polling; streams would work too.
- **Related resources named by the guide:** `very_good_cli` (https://cli.vgv.dev/), VGV architecture docs, DevTools, and `flutter_lints` (the lints the Flutter team recommends for Flutter apps).

## Testing each layer

- **View model tests do not rely on Flutter libraries or testing frameworks.** Repositories are the only dependencies to fake (`FakeBookingRepository implements BookingRepository`):

```dart
void main() {
  group('HomeViewModel tests', () {
    test('Load bookings', () {
      // HomeViewModel._load is called in the constructor of HomeViewModel.
      final viewModel = HomeViewModel(
        bookingRepository: FakeBookingRepository()
          ..createBooking(kBooking),
        userRepository: FakeUserRepository(),
      );

      expect(viewModel.bookings.isNotEmpty, true);
    });
  });
}
```

- **Widget tests reuse the same fakes;** mock the router with `package:mocktail` (`MockGoRouter`, `when(() => goRouter.push(any())).thenAnswer((_) => Future.value(null));`).
- **Repository tests fake the services** (`FakeApiClient`) and assert `result.asOk.value`.
- **If the architecture is sound,** view and view model tests only need mocked repositories. The shared `testApp` helper and the rest of the test setup are in [TESTING.md](TESTING.md).

## Prove it

- **No data logic in widgets:** every view's `build` contains only show/hide conditions on view model fields, animation, layout from device info and simple routing; data calls go through the view model.
- **No layer skipping:** no view imports a repository or service; every repository and service field in a view model or repository is private (starts with `_`).
- **Repositories are isolated:** no repository class imports or holds another repository.
- **One writer per data type:** searching for writes to a model's data finds only its repository.
- **Double tap is harmless:** tapping a command-backed button twice quickly starts the action once (`running` blocks the second call).
- **Errors surface once:** after an error SnackBar shows, the next `notifyListeners()` does not show it again (the error was cleared first).
- **View models test without Flutter:** each view model's unit test builds it with fake repositories only and needs no Flutter library or widget pumping.
- **Swappable data:** the development entry point runs on local repository implementations (for example `BookingRepositoryLocal`) with no code change outside DI.
