# Riverpod (third party)

Riverpod is a third-party state management and dependency package, not part of Flutter, and this skill's own guidance is built on `provider` plus `ChangeNotifier` view models ([ARCHITECTURE.md](ARCHITECTURE.md)). This file holds one community architecture that uses Riverpod throughout: ApparenceKit's tips and blog posts (apparencekit.dev, a commercial Flutter starter kit; "Our architecture template uses Riverpod throughout with this pattern applied to every feature module"). It covers code-generated async notifiers, `AsyncValue` in the UI, `Ref` extensions, listening to app events, a paginated list, and toasts. No article states a Riverpod, riverpod_generator or Flutter version. Riverpod 3.0 made `AsyncValue` "sealed" and renamed `valueOrNull` to `value` (https://riverpod.dev/docs/whats_new), so check the generated provider names (`tasksListNotifierProvider`, `inboxNotifierProvider`) and the `AsyncValue` calls against the current Riverpod docs before copying. Where the source disagrees with the skill's provider-based guidance, both are stated below and marked.

**Contents:** [Where it disagrees with the skill](#where-it-disagrees-with-the-skill) · [An async notifier with code generation](#an-async-notifier-with-code-generation) · [One UI per AsyncValue state](#one-ui-per-asyncvalue-state) · [Ref extensions](#ref-extensions) · [Listening to app events in a notifier](#listening-to-app-events-in-a-notifier) · [A paginated list](#a-paginated-list) · [Toasts from notifiers](#toasts-from-notifiers) · [Routing and guards](#routing-and-guards) · [Prove it](#prove-it)

## Where it disagrees with the skill

- **Dependency injection.** The skill [official]: "Use `package:provider`", injected through constructors and kept private ([ARCHITECTURE.md](ARCHITECTURE.md#dependency-injection)). ApparenceKit [community]: Riverpod "throughout", and notifiers fetch repositories with `ref.read(inboxRepositoryProvider)` inside `build` instead of receiving them in a constructor.
- **View models and their state.** The skill: a view model extends `ChangeNotifier`, the view listens with `ListenableBuilder`, and commands carry running, error and completed ([ARCHITECTURE.md](ARCHITECTURE.md#commands)). ApparenceKit: a notifier's `build` returns a `Future` and `AsyncValue` carries loading, data and error; the view uses `ref.watch` and `.map`.
- **UI calls from the logic layer.** The skill's first rule: "Never mix UI rendering with business logic or data fetching", and errors are shown from a listener in the view ([ARCHITECTURE.md](ARCHITECTURE.md#optimistic-state)). ApparenceKit shows toasts from notifiers through a global navigator key ([Toasts from notifiers](#toasts-from-notifiers)).
- **Routing.** The skill re-runs `redirect` with `refreshListenable` on one router ([ROUTING-AND-DEEP-LINKS.md](ROUTING-AND-DEEP-LINKS.md)). ApparenceKit rebuilds the `GoRouter` from a provider, or guards each route with a widget ([Routing and guards](#routing-and-guards)).

## An async notifier with code generation

[ApparenceKit](https://apparencekit.dev/flutter-tips/riverpod-asyncstate-state-management/)

- The notifier "should return a `Future` of your state. This `Future` is what Riverpod watches to know if your data is loading, done, or has an error."
- "After creating your notifier, don't forget to run the `build_runner` command. This tool generates the necessary Riverpod code from the annotations (like `@Riverpod`) you've added." (The skill's generator command is `dart run build_runner build`, [dart TESTING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/dart/TESTING.md).)

```dart
part 'tasks_list_notifier.g.dart';

@Riverpod(keepAlive: false)
class TasksListNotifier extends _$TasksListNotifier {
  @override
  Future<TasksListState> build() {
    return _loadTasks(TasksListTab.active)
           .then((tasks) => TasksListState(tasks: tasks));
  }
}
```

Listen in the widget:

```dart
final state = ref.watch(tasksListNotifierProvider);
```

## One UI per AsyncValue state

Same source. "Riverpod's `AsyncValue` (which is what `AsyncState` essentially provides) comes with a handy `.map()` method", one branch per state. `context.textTheme` and `context.colors` are the project's own extensions, not Flutter APIs.

```dart
state.map(
  data: (data) {
    if (data.value.tasks.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.only(top: 120.0),
          child: Text(
            "No item found",
            textAlign: TextAlign.center,
          ),
        ),
      );
    }
    return ListView.separated(
      itemCount: data.value.tasks.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) => TaskCard(task: data.value.tasks[index]),
    );
  },
  error: (error) => Center(
    child: Text(
      'Error',
      style: context.textTheme.headlineMedium?.copyWith(
        color: context.colors.error,
      ),
    ),
  ),
  loading: (loading) => Center(
    child: CircularProgressIndicator.adaptive(
      backgroundColor: context.colors.primary,
    ),
  ),
);
```

## Ref extensions

[ApparenceKit](https://apparencekit.dev/flutter-tips/riverpod-boilerplate-reduction-tip/)

- Cut repeated `ref.read(...)` / `ref.watch(...)` with an extension on `Ref`; callers write `ref.userSessionRepository`.
- "The `$` at the end is just a common way developers show that this property might give you a stream or something that changes over time, accessed here using `watch()`. You could name it differently".

```dart
extension UserSessionRepositoryProvider on Ref {
  UserSessionRepository get userSessionRepository =>
      read(userSessionRepositoryProvider);

  UserSessionRepository get userSessionRepository$ =>
      watch(userSessionRepositoryProvider);
}
```

## Listening to app events in a notifier

[ApparenceKit](https://apparencekit.dev/blog/flutter-app-events/). The dispatcher itself is stack-neutral and lives in [flutter-ux WIDGET-PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/APP-EVENTS.md#global-app-events).

```dart
part 'lobby_notifier.g.dart';

@riverpod
class LobbyNotifier extends _$LobbyNotifier {
	@override
  Future<LobbyState> build() async {
	  ...
	  
	  ref.read(appEventsDispatcherProvider).stream.listen(_onEvent);
	  return LobbyState(
			...
    );
  }
}
```

- "if your notifier is not going to stay alive (keep alive on riverpod) Don't forget to close the stream subscription." The skill's `ChangeNotifier` form cancels its `StreamSubscription` in `dispose()` ([DATA-AND-NETWORKING.md](DATA-AND-NETWORKING.md)).

## A paginated list

[ApparenceKit](https://apparencekit.dev/blog/flutter-pagination-riverpod/). This is the notifier half; the page state, scroll-end detection, pull to refresh and skeleton tiles are in [flutter-ux PAGINATION-AND-LOADING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/PAGINATION-AND-LOADING.md#pagination-and-skeletons). The article's Firestore query is out of scope here.

- **First page in `build`.** `build` can also take parameters (`build(String userId)`).

```dart
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'inbox_provider.g.dart'; // <-- This is the generated file from riverpod annotation

@riverpod
class InboxNotifier extends _$InboxNotifier {
  final logger = Logger();

  @override
  Future<InboxPageState> build() async {
    final inboxRepository = ref.read(inboxRepositoryProvider);
    final userState = ref.read(userStateNotifierProvider);

    await Future.delayed(const Duration(seconds: 1)); // 1
    try {
      final results = await inboxRepository.getPaged(userState.user.idOrThrow); // 2
      return InboxPageState(items: results.data, previousPage: results);
    } catch (err, stacktrace) {
      logger.e('Failed to load inbox $err, $stacktrace');
      rethrow;
    }
  }
```

```dart
@override
Future<InboxPageState> build(String userId) async {
    ...
}
```

- **Next page:** return if `state is AsyncLoading` or `!hasMore`, set loading, fetch with `previousPage` (or "the last element creationDate"), append, and set `AsyncValue.error` on failure.
  - **Check the installed Riverpod version, not the constructor alone.** In the upstream implementation read on 2026-10-19, the notifier setter delegates to `setValueFromState`, which reaches `asyncTransition` and `copyWithPrevious`; a loading transition can retain previous data. An empty `AsyncLoading` constructor alone does not prove this notifier loses its page data. The article states no Riverpod version. [Notifier setter](https://github.com/rrousselGit/riverpod/blob/master/packages/riverpod/lib/src/core/provider/notifier_provider.dart), [future modifier](https://github.com/rrousselGit/riverpod/blob/master/packages/riverpod/lib/src/core/modifiers/future.dart), [async transition](https://github.com/rrousselGit/riverpod/blob/master/packages/riverpod/lib/src/core/element.dart)

```dart
Future<void> loadNextPage() async {
    if (state is AsyncLoading) { // 1
      logger.d('Already loading next page');
      return;
    }
    if (!state.requireValue.hasMore) { // 2
      logger.d('No more pages to load');
      return;
    }
    final inboxRepository = ref.read(inboxRepositoryProvider);
    final user = ref.read(userStateNotifierProvider);
    state = const AsyncValue.loading(); // 3
    await Future.delayed(const Duration(seconds: 1));
    try {
      final results = await inboxRepository.getPaged(
        user.user.idOrThrow,
        previousPage: state.requireValue.previousPage, //4
      );

      state = AsyncValue.data(
        InboxPageState(
          items: [
            ...state.requireValue.items,
            ...results.data,
          ],
          previousPage: results,
        ),
      );
    } catch (err, stacktrace) {
      logger.e('Failed to load inbox $err, $stacktrace');
      state = AsyncValue.error(err, stacktrace);
    }
  }
```

- **The sliver UI.** The loading branch keeps the loaded items (`asyncLoading.value`) and adds 5 skeleton tiles.

```dart
@override
  Widget build(BuildContext context) {
    final state = ref.watch(inboxNotifierProvider); // ℹ️ 1

    return SafeArea(
      child: CustomScrollView(
        controller: _scrollController,
        slivers: [
          const InboxHeader(),
          state.map(
            data: (asyncData) => asyncData.value.items.isEmpty 
                ? const EmptyInboxContent() // ℹ️ 2
                : SliverPadding( // ℹ️ 3
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    sliver: SliverList.separated(
                      itemBuilder: (_, index) => InboxRecordCard(
                          inbox: asyncData.value.items[index],
                        ),
                      separatorBuilder: (_, __) => const SizedBox(
                        height: kSeparatorHeight,
                      ),
                      itemCount: asyncData.value.items.length,
                    ),
                  ),
            error: (err) => const Center(
              child: Text('Error while loading inbox'),
            ),
            loading: (asyncLoading) => SliverPadding( // ℹ️ 4
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              sliver: SliverList.separated(
                separatorBuilder: (_, __) => const SizedBox(
                  height: kSeparatorHeight,
                ),
                itemCount: switch (asyncLoading.value) {
                  InboxPageState() => asyncLoading.value!.items.length + 5,
                  null => 5,
                },
                // itemBuilder: (_, index) => const InboxCardSkeletonTile(),
                itemBuilder: (_, index) {
                  if (!asyncLoading.hasValue ||
                      index >= asyncLoading.value!.items.length) {
                    return const InboxCardSkeletonTile();
                  }
                  final item = asyncLoading.value!.items[index];
                  return InboxRecordCard(
                    inbox: item,
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
```

  Check before copying: the `error` branch returns a box widget (`Center`) inside `slivers:`, where a box widget needs a `SliverToBoxAdapter`, "A sliver that contains a single box widget" (https://api.flutter.dev/flutter/widgets/SliverToBoxAdapter-class.html); and the article names the provider `inboxPageStateProvider` in its refresh snippet but `inboxNotifierProvider` here.
- **One loading state for both loads, two views.** The article sets the whole state to `AsyncValue.loading()` for the next page and uses `state is AsyncLoading` as the in-flight guard, so a failed next page replaces the list with the error branch. Against it, the repo's web interface rules: ""Loading more" is a separate flag from "loading", so the next page's pending state never touches the list" and "A failed refetch keeps what is shown until a later read succeeds; only a failed first read goes to the error state" ([app-ui STATES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/STATES.md)).
- **Artificial delay, two views.** "We add a short delay to show the loading indicator even if the loading is fast" (`Future.delayed(const Duration(seconds: 1))` in both loads). Against it: the same site calls `Future.delayed(Duration(seconds: 1))` "unreliable" ([ApparenceKit](https://apparencekit.dev/flutter-tips/wait-for-view-ready-flutter-app/)), and "Feedback is instant, results can follow" ([ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PATTERNS.md)).

## Toasts from notifiers

[ApparenceKit](https://apparencekit.dev/flutter-tips/toast-riverpod/) (the article's code is an image only)

- "By utilizing a GlobalKey attached to your app's navigator, you gain access to a root BuildContext. A Riverpod Provider then encapsulates the toast display logic" (the example uses the `another_flushbar` package). Notifiers can then show a toast "after an asynchronous operation, without needing to manually manage or pass a widget's BuildContext."
- **Two views.** ApparenceKit [community]: trigger toasts from notifiers. The skill [official]: keep the SnackBar in the view, shown from a listener and cleared first so it shows once ([ARCHITECTURE.md](ARCHITECTURE.md#optimistic-state)). The toast look and the "don't show the same snack bar twice" rule are in [flutter-ux MOTION-AND-FEEDBACK.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/MOTION-AND-FEEDBACK.md).

## Routing and guards

- **Rebuilding `GoRouter` from a provider** that watches the user state, with a global `navigatorKey` and the previous location restored, and the article's own drawback that "it rebuilds the Router on any user state changes": code and the `refreshListenable` comparison are in [flutter-ux ROUTE-GUARDS-AND-SHELLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/ROUTE-GUARDS-AND-SHELLS.md) ([ApparenceKit](https://apparencekit.dev/blog/flutter-riverpod-gorouter-redirect/)).
- **An `AuthGuard` is a `ConsumerWidget`** whose `build(BuildContext context, WidgetRef ref)` watches the user state and hands a `canActivate` future to a `Guard` widget (same file). `WidgetRef ref` belongs to `ConsumerWidget`; a plain `StatelessWidget.build` takes only a `BuildContext` ([flutter-ui THEMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/THEMING.md) notes a source that mixed them up).
- **Error reporting:** Sentry hooks Riverpod through `ProviderScope(observers: [SentryProviderObserver()])` ([sentry FLUTTER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/sentry/FLUTTER.md)).

## Prove it

- **Generated code is current:** `dart run build_runner build` leaves `git status` clean, and every `part '*.g.dart';` file exists.
- **Subscriptions close:** every `.stream.listen(` inside a notifier that is not keepAlive has a matching cancel when the provider is disposed.
- **Artificial delays are a choice:** search notifiers for `Future.delayed`; each one matches the view the project picked above.
- **Next-page errors behave as chosen:** fail the second page in a test (a fake repository that throws on the second call); the screen shows what the project picked above (the article's error branch, or the loaded items kept).
- **Toasts show once:** trigger the same failing action twice; one toast per failure, none on unrelated rebuilds.
