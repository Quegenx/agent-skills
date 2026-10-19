# Pagination and loading

Paged lists, load-more guards, pull-to-refresh and skeleton rows from [ApparenceKit](https://apparencekit.dev/blog/flutter-pagination-riverpod/) and its [loading-state tips](https://apparencekit.dev/flutter-tips/handle-loading-states-in-flutter/). The Riverpod notifier and its loading-state decisions are in [flutter RIVERPOD.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/RIVERPOD.md#a-paginated-list); keep the source examples and their corrections together.

## Pagination and skeletons

[ApparenceKit](https://apparencekit.dev/blog/flutter-pagination-riverpod/)

The article's notifier is Riverpod; the parts below are the stack-neutral ones (the notifier code belongs with the Riverpod material).

- **Steps:** load the first page; load the next page near the end of the list; append the new items. "I generally use 15 items per page." "As Flutter only draws the visible items, you can have a list with thousands of items without any performance issues" (lazy lists: [flutter PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/PERFORMANCE.md)).
- **Page state.** Keep the previous page to know whether more exist; or "instead of having a previousPage property, you can also try until the API answers with an empty list and store just a boolean".

```dart
class InboxPageState {
  final List<Inbox> items;
  final Pageable<Inbox>? previousPage;

  const InboxPageState({
    required this.items,
    this.previousPage,
  });

  bool get hasMore => previousPage?.hasMore ?? false;
}
```

- **Next-page guards:** skip while a load is in flight and when `!hasMore`; on success append to the existing items; on failure set the error state.
- **End-of-list detection:** a `ScrollController` listener calls `loadNextPage()` when `maxScrollExtent - pixels <= 200` ("The delta position is the distance from the end of the list ... Change it to fit your needs"):

```dart
class InboxPage extends ConsumerStatefulWidget {
  const InboxPage({super.key});

  @override
  ConsumerState<ConsumerStatefulWidget> createState() => _InboxPageState();
}

class _InboxPageState extends ConsumerState<InboxPage> {
  final ScrollController _scrollController = ScrollController(); // 1

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScrollListener);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScrollListener);
    super.dispose();
  }

  void _onScrollListener() {
    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentScroll = _scrollController.position.pixels;
    const delta = 200.0;
    if (maxScroll - currentScroll <= delta) { // 2
      ref.read(inboxNotifierProvider.notifier).loadNextPage();
    }
  }

  @override
  Widget build(BuildContext context) {
    ...
  }
}
```

  **Fix:** the `dispose` removes the listener but never disposes the controller; what a `State` allocates is disposed in `dispose` ([flutter PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/PERFORMANCE.md)), so add `_scrollController.dispose();` before `super.dispose();`.
- **Slivers and skeleton rows.** The page is a `CustomScrollView` with slivers ("more flexible than regular lists ... cool animated headers"). While loading, it keeps the already-loaded items and adds 5 skeleton tiles after them (`itemCount: items.length + 5`, or 5 on first load): "To make it more interactive and fun, I display 5 fake items when loading".
- **Pull to refresh.** `RefreshIndicator.adaptive` wraps the `CustomScrollView` directly; "Flutter will automatically display the refresh indicator when the user pulls down the list."

```dart
RefreshIndicator.adaptive(
    displacement: 100,
    onRefresh: ()  {
        ref.read(inboxPageStateProvider.notifier).refresh();
    },
    child: CustomScrollView(
        controller: _scrollController,
        ...
```

  **Correction:** "The returned Future must complete when the refresh operation is finished." [RefreshIndicator.onRefresh](https://api.flutter.dev/flutter/material/RefreshIndicator/onRefresh.html) The block returns nothing; return the refresh `Future`: `onRefresh: () => ref.read(inboxPageStateProvider.notifier).refresh(),`.
- **Artificial delay, two views.** The source and the repo views are defined in [Riverpod pagination](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/RIVERPOD.md#a-paginated-list). [ApparenceKit](https://apparencekit.dev/blog/flutter-pagination-riverpod/)
- **One loading state for first load and next page, two views.** The source and the repo views are defined in [Riverpod pagination](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/RIVERPOD.md#a-paginated-list). [ApparenceKit](https://apparencekit.dev/blog/flutter-pagination-riverpod/)
- **Spinner or skeleton.** A basic indicator (`CircularProgressIndicator.adaptive()`, a `CupertinoActivityIndicator` on iOS) or a skeleton, "grey blocks that look like the layout of the page": "users perceive skeleton screens as loading faster, even if the actual load time is the same." Packages named: `sleek_circular_slider` ("customizable circular sliders"), `flutter_spinkit` ("many different kinds of loading animations"), `better_skeleton` ("Makes it easier to build these loading states"); no versions stated. [ApparenceKit](https://apparencekit.dev/flutter-tips/handle-loading-states-in-flutter/)
- **Skeleton tile with `better_skeleton`:** a 1000 ms `AnimationController` with `..repeat()` drives `AnimatedSkeleton(listenable: ...)`, which animates "the overlayed glass effect". "You can also share the animation controller between multiple widgets to make them animate at the same time."

```dart
import 'package:better_skeleton/skeleton_container.dart';
import 'package:flutter/material.dart';

class VideoSkeletonTile extends StatefulWidget {
  const VideoSkeletonTile({super.key});

  @override
  State<VideoSkeletonTile> createState() => _VideoSkeletonTileState();
}

class _VideoSkeletonTileState extends State<VideoSkeletonTile>
    with SingleTickerProviderStateMixin {
  late final AnimationController animationController; // ℹ️ 1

  @override
  void initState() {
    super.initState();
    animationController = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1000))
      ..repeat(); // ℹ️ 2
  }

  @override
  void deactivate() {
    animationController.dispose();
    super.deactivate();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSkeleton( // ℹ️ 3
      listenable: animationController,
      child: Container(
        height: 300,
        width: 200,
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.primary.withOpacity(.1),
          borderRadius: BorderRadius.circular(8),
        ),
        padding: const EdgeInsets.all(16),
      ),
    );
  }
}
```

  **Corrections:** dispose what `initState` allocates in `dispose`, not `deactivate` ([flutter PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/PERFORMANCE.md)); and `Color.withOpacity` is deprecated since 3.22 for `withValues(alpha: ...)` ([flutter VERSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/VERSIONS.md)). The article is out of date on both:

```dart
  @override
  void dispose() {
    animationController.dispose();
    super.dispose();
  }
```

```dart
          color: Theme.of(context).colorScheme.primary.withValues(alpha: .1),
```

## Prove it

- `onRefresh` returns the refresh `Future`; the spinner stays until the data is in. [RefreshIndicator.onRefresh](https://api.flutter.dev/flutter/material/RefreshIndicator/onRefresh.html)
- Scroll to the bottom of a paged list: one next-page request fires (not one per scroll event), loaded items stay visible, and skeleton rows appear after them. [ApparenceKit](https://apparencekit.dev/blog/flutter-pagination-riverpod/)
- The source skeleton controller is disposed in `dispose`, and the source version/API corrections are applied when copying it. [ApparenceKit](https://apparencekit.dev/flutter-tips/handle-loading-states-in-flutter/)
- Loading-state and artificial-delay choices follow the tagged alternatives in [Riverpod pagination](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/RIVERPOD.md#a-paginated-list).
