# Route guards and shells

Nested navigators and `rootNavigator`, a sidebar built on a go_router `StatefulShellRoute`, and guarding routes (the `redirect` function, rebuilding the router from a Riverpod provider, guard widgets per route). Source: ApparenceKit tips and blog posts (apparencekit.dev), community material, not Flutter-team docs. The official routing guidance is in [flutter ROUTING-AND-DEEP-LINKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ROUTING-AND-DEEP-LINKS.md); where ApparenceKit disagrees with it, both sides are stated and marked. Sheets, dialog results and page transitions are in [NAVIGATION-AND-SHEETS.md](NAVIGATION-AND-SHEETS.md).

**Contents:** [Where the sources disagree](#where-the-sources-disagree) · [Nested navigators](#nested-navigators) · [Sidebar shell](#sidebar-shell) · [Route guards](#route-guards) · [Prove it](#prove-it)

## Where the sources disagree

- **Auth in a guard widget or in `redirect` (opinion).** ApparenceKit puts each route's condition in a `Guard` widget ([ApparenceKit](https://apparencekit.dev/blog/flutter-riverpod-gorouter-redirect/)); the official go_router docs handle auth with `redirect` and re-run it with `refreshListenable` ([flutter ROUTING-AND-DEEP-LINKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ROUTING-AND-DEEP-LINKS.md#redirects-and-auth)). Details under [Route guards](#route-guards).
- **Rebuilding the router from a provider (opinion).** ApparenceKit shows a community workaround that builds a new `GoRouter` on every user-state change; the official route keeps one router and notifies `refreshListenable`.
- **Named routes in examples (official).** The `rootNavigator` and Navigator 1.0 guard examples use `pushNamed` / `pushReplacementNamed`; the Flutter docs say "Do not use named routes for most apps" ([flutter ROUTING-AND-DEEP-LINKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ROUTING-AND-DEEP-LINKS.md)). Keep the technique, not the named route.
- **Deprecated color API in the sidebar (official).** The sidebar code calls `withOpacityCpy`, which is not a Flutter API and which the article does not define. Flutter's own `Color.withOpacity` is deprecated in Flutter 3.22 for `Color.withValues(alpha: o)` ([flutter VERSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/VERSIONS.md)). The article states no Flutter version.

## Nested navigators

[ApparenceKit](https://apparencekit.dev/flutter-tips/multiple-navigators-in-flutter/): a secondary navigator for a self-contained flow (onboarding, login) keeps it apart from the main navigation. From inside it, `Navigator.of(context, rootNavigator: true)` returns the top-level navigator, for example to leave onboarding for the main app:

```dart
Navigator.of(context, rootNavigator: true).pushNamed("premium")
```

- The example uses a named route, which the Flutter docs advise against for most apps ([flutter ROUTING-AND-DEEP-LINKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ROUTING-AND-DEEP-LINKS.md)); keep `rootNavigator: true` and push a `MaterialPageRoute` or go through go_router.
- **go_router branches** are nested navigators too: each `StatefulShellBranch` "works like its own mini-navigator" with its own stack, so switching away and back returns where you left off [ApparenceKit](https://apparencekit.dev/flutter-tips/nested-navigation-go-router/). Setup: [flutter ROUTING-AND-DEEP-LINKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ROUTING-AND-DEEP-LINKS.md#shell-routes-and-tabs).

## Sidebar shell

[ApparenceKit](https://apparencekit.dev/blog/how-to-build-flutter-sidebar-menu/): a sidebar for tablets and the web, built on go_router nested navigation. Pages without the sidebar (sign-in) are top-level `GoRoute`s; pages with it sit in a `StatefulShellRoute`, one `StatefulShellBranch` per item, "Every items will have it's own navigation stack."

```text
-- GoRoute
-- GoRoute
-- GoRoute
-- StatefulShellRoute 
---- StatefulShellBranch
------ GoRoute
------ GoRoute
---- StatefulShellBranch
------ GoRoute
------ GoRoute
```

The router as published (it uses the base `StatefulShellRoute` with `navigatorContainerBuilder`, not the `.indexedStack` shown in the official docs):

```dart
import 'package:go_router/go_router.dart';


GoRouter generateRouter() {
    return GoRouter(
        routes: [
            // page without sidebar
            GoRoute(
                name: 'signin',
                path: '/signin',
                builder: (context, state) => const SigninPage(),
            ),
            // page with sidebar
            StatefulShellRoute(
                parentNavigatorKey: navigatorKey,
                // the sidebar will be displayed on the left
                // prefer wrap this into a widget
                builder: (context, state, navigationShell) => Row( 
                    children: [
                        SideBar(state: state),
                        Expanded(child: navigationShell),
                    ],
                );
                // the builder will be called when the route is activated
                // the navigationShell is a widget that will display the content of the route
                // it will show the current latest page of the navigation stack for each branch
                navigatorContainerBuilder: (
                    BuildContext context,
                    StatefulNavigationShell navigationShell,
                    List<Widget> children,
                ) {
                    if(children.isEmpty) {
                        return SizedBox();
                    }
                    return Scaffold(
                        body: children[navigationShell.currentIndex],
                    );
                },
                branches: [
                StatefulShellBranch(
                    routes: [
                    GoRoute(
                        name: 'users',
                        path: '/users',
                        builder: (context, state) => const AuthenticatedGuard(
                        fallbackRoute: '/signin',
                        child: UsersPage(),
                        ),
                    ),
                    GoRoute(
                        name: 'user profile',
                        path: '/users/:userId',
                        builder: (context, state) =>  AuthenticatedGuard(
                        fallbackRoute: '/signin',
                        child: UserProfilePage(userId: state.pathParameters['userId']!),
                        ),
                    ),
                    ],
                ),
                StatefulShellBranch(
                    routes: [
                        GoRoute(
                            name: 'notifications',
                            path: '/notifications',
                            builder: (context, state) => const AuthenticatedGuard(
                            fallbackRoute: '/signin',
                            child: PageFake(),
                            ),
                        ),
                        ],
                    ),
                ],
            ),
        ]
    );
}
```

- **Does not compile as printed:** the `builder:` argument ends with `);`. Replace that `;` with `,` so `navigatorContainerBuilder:` follows as the next argument.
- **Active item from the route:** pass the `GoRouterState` to the sidebar and test `state.matchedLocation.startsWith(route)`, not `==`, "because the route can be a nested route" (so `/users/:userId` keeps Users highlighted). Navigate with `context.go('/notifications')` from the item's `onTap`.

```dart
class SideBar extends StatelessWidget {
   final GoRouterState state; // <-- we add this

    const SideBar({
        super.key,
        required this.state, // <-- we add this
    });

    bool isRouteActive(String route) {
        return state.matchedLocation.startsWith(route);
    }

  ...
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ...
              SideBarCategoryItem(
                icon: Icons.notifications,
                title: 'Notifications',
                status: isRouteActive('/notifications') 
                    ? SidebarItemStatus.active 
                    : SidebarItemStatus.inactive,
                onTap: () {
                  // we need to implement this
                },
              ),
              ...
            ],
          ),
        );
      }
    );
  }
}
```

The article's final version of the item fills in `onTap`:

```dart
SideBarCategoryItem(
    icon: Icons.notifications,
    title: 'Notifications',
    status: isRouteActive('/notifications') 
        ? SidebarItemStatus.active 
        : SidebarItemStatus.inactive,
    onTap: () {
        context.go('/notifications');
    },
),
```

### Sidebar design

- **Container:** width 280, full height from `LayoutBuilder` (`constraints.maxHeight`) rather than `MediaQuery.of(context).size.height`, "For performance reasons"; a right border at 5% opacity of the foreground color; a `Column` with `CrossAxisAlignment.stretch`. [ApparenceKit](https://apparencekit.dev/blog/how-to-build-flutter-sidebar-menu/)
- **Category heading:** top padding 16; title padding vertical 10, horizontal 24; uppercase `bodySmall`, color `0xFF666666`, size 11, bold. The author's own improvements: take the color and the text style from the theme.
- **Item:** three states (active, hovered, inactive). `Material(color: Colors.transparent)` so `InkWell` gives the ripple and `onHover`; outer horizontal padding 16; `Ink` height 40, padding vertical 6 and horizontal 12, radius 12. Active: background color, foreground text at `w600`. Hovered: primary at 30% opacity. Inactive: transparent, text at 80% opacity, `w300`. Icon right padding 12; title on one line with `TextOverflow.ellipsis`. The article says `onHover` fires "only for web".
- The article shows the sidebar always (tablet and web); it does not switch at a breakpoint. Breakpoints and the navigation rail are in [flutter-ui LAYOUT-AND-RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md).

```dart
class SideBar extends StatelessWidget {

  const SideBar({
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return Container(
          width: 280,
          height: constraints.maxHeight,
          decoration: BoxDecoration(
            color: context.colors.onBackground,
            border: Border(
              right: BorderSide(
                color: context.colors.onBackground.withOpacityCpy(.05),
              ),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // This will be the content of the sidebar menu
            ],
          ),
        );
      }
    );
  }
}
```

```dart
class SideBarCategory extends StatelessWidget {
  final String? category;
  final List<Widget> items;

  const SideBarCategory({
    super.key,
    this.category,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (category != null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 24),
              child: Text(
                category!.toUpperCase(),
                style: context.textTheme.bodySmall?.copyWith(
                  color: const Color(0xFF666666), 
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ...items,
        ],
      ),
    );
  }
}
```

```dart
class SideBarCategoryItem2 extends StatefulWidget {
  final String title;
  final VoidCallback onTap;
  final IconData icon;
  final SidebarItemStatus status;

  const SideBarCategoryItem2({
    super.key,
    required this.title,
    required this.icon,
    required this.status,
    required this.onTap,
  });

  @override
  State<SideBarCategoryItem2> createState() => _SideBarCategoryItemState2();
}

class _SideBarCategoryItemState2 extends State<SideBarCategoryItem2> {
  late SidebarItemStatus _status;

  @override
  void initState() {
    super.initState();
    _status = widget.status;
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0),
        child: InkWell(
          onTap: widget.onTap,
          onHover: (value) {
            setState(() {
              if (value) {
                _status = SidebarItemStatus.hovered;
              } else {
                _status = widget.status;
              }
            });
          },
          borderRadius: BorderRadius.circular(12),
          child: Ink(
            height: 40,
            padding: const EdgeInsets.symmetric(
              vertical: 6,
              horizontal: 12,
            ),
            decoration: BoxDecoration(
              color: switch (_status) {
                SidebarItemStatus.active => context.colors.background, // white 
                SidebarItemStatus.hovered => context.colors.primary.withOpacityCpy(.3), 
                SidebarItemStatus.inactive => Colors.transparent,
              },
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Padding(
                  padding: const EdgeInsets.only(right: 12.0), 
                  child: SidebarItemIcon(
                    icon: widget.icon, 
                    color: switch (_status) {
                      SidebarItemStatus.active => context.colors.onBackground, // black
                      SidebarItemStatus.hovered => context.colors.onBackground, // black
                      SidebarItemStatus.inactive => context.colors.background.withOpacityCpy(.8), // grey
                    },
                  ),
                ),
                Expanded(
                  child: Text(
                    widget.title,
                    maxLines: 1, // we want to show only one line
                    overflow: TextOverflow.ellipsis, // if the text is too long, it will be ellipsed
                    style: context.textTheme.bodyMedium?.copyWith(
                      color: switch (_status) {
                        SidebarItemStatus.active => context.colors.onBackground, // black
                        SidebarItemStatus.hovered => context.colors.onBackground, // black
                        SidebarItemStatus.inactive => context.colors.background.withOpacityCpy(.8), // grey
                      },
                      fontWeight: switch (_status) {
                        SidebarItemStatus.active => FontWeight.w600, // semi - bold
                        _ => FontWeight.w300, // light when hovered or inactive
                      },
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
```

- **Before copying:** `context.colors`, `context.textTheme`, `withOpacityCpy` and `SidebarItemIcon` are ApparenceKit's own helpers, not Flutter APIs. For opacity, Flutter's `Color.withOpacity` is deprecated in 3.22 for `Color.withValues(alpha: o)` ([flutter VERSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/VERSIONS.md)). The item copies `widget.status` into state only in `initState`, so a status change from the parent shows only after the next hover ends (the article has no `didUpdateWidget`). The usage snippets call `SideBarCategoryItem` while the class is `SideBarCategoryItem2`.

## Route guards

### The redirect function

[ApparenceKit](https://apparencekit.dev/blog/flutter-riverpod-gorouter-redirect/): "The redirect function is called every time the router is updated." Return the new path, or `null` to stay; the current path is `state.matchedLocation`. The return type is `FutureOr<String?>`, so a redirect can be async:

```dart
typedef GoRouterRedirect = FutureOr<String?> Function(
        BuildContext context, 
        GoRouterState state,
    );
```

- Uses beyond auth: send a non-subscriber to a premium page; send everyone to `/loading` while the subscription state loads.

### Rebuilding the router from a Riverpod provider

A community pattern ("Thanks CreativeCreatororMaybeNot", https://github.com/flutter/flutter/issues/112915): a `Provider` watches the user state and builds a new `GoRouter` on each change; a global `navigatorKey` keeps the widget tree, and the previous router restores `initialLocation`. [ApparenceKit](https://apparencekit.dev/blog/flutter-riverpod-gorouter-redirect/)

```dart
// This is super important - otherwise, we would throw away the whole widget tree when the provider is updated.
final navigatorKey = GlobalKey<NavigatorState>();
// We need to have access to the previous location of the router. Otherwise, we would start from '/' on rebuild.
GoRouter? _previousRouter;

final routerProvider = Provider((ref) {
  final userState = ref.watch(userStateNotifierProvider);

  return _previousRouter = GoRouter(
    initialLocation: _previousRouter?.routerDelegate.currentConfiguration.fullPath,
    navigatorKey: navigatorKey,
    routes: [...],
    redirect: (context, state) {
      try {
        final isLoading = userState!.subscription.maybeMap(
          loading: (_) => true,
          orElse: () => false,
        );
        if (isLoading) {
          return '/loading';
        }
        if (!userState.subscription.isActive && state.matchedLocation == '/') {
          debugPrint("Redirect to premium from (${state.matchedLocation})");
          return '/premium';
        }
      } catch (e) {
        debugPrint("Error in redirect: $e");
      }
      return null;
    },
  );
});
```

- **The article's own drawbacks:** "it rebuilds the Router on any user state changes" (renaming the user rebuilds the whole router), and one function for every redirect gets hard in complex apps.
- **Official way:** one router whose `redirect` re-runs when `refreshListenable` notifies ([flutter ROUTING-AND-DEEP-LINKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ROUTING-AND-DEEP-LINKS.md#redirects-and-auth)), which avoids the rebuild. The article states no go_router version.

### Guard widgets per route

[ApparenceKit](https://apparencekit.dev/blog/flutter-riverpod-gorouter-redirect/): a widget checks a `Future<bool> canActivate` before showing `child`, otherwise sends the user to `fallbackRoute`. "The AuthGuard or Guard do not exist in the GoRouter package or Flutter." The author prefers it: readable per route, and no previous-router bookkeeping.

```dart
class Guard extends StatelessWidget {
  final Future<bool> canActivate;
  final Widget child;
  final String fallbackRoute;

  const Guard({
    super.key,
    // this is the condition to check within a Future as it can be async
    required this.canActivate,
    // this is the child to display if the condition is met
    required this.child,
    // this is the route to redirect if the condition is not met
    required this.fallbackRoute,
  });

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future: canActivate,
      builder: (_, result) {
        if (!result.hasData || result.hasError) {
          return Container();
        }
        final bool canActivate = result.data!;
        if (canActivate) {
          return child;
        }
        redirect(context);
        return Container();
      },
    );
  }

  void redirect(BuildContext context) {
    WidgetsBinding.instance.addPostFrameCallback((timeStamp) {
      context.pushReplacement(fallbackRoute);
    });
  }
}
```

```dart
class AuthGuard extends ConsumerWidget {
  final String fallbackRoute;
  final Widget child;

  const AuthGuard({
    super.key,
    required this.fallbackRoute,
    required this.child,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(userStateNotifierProvider);
    return Guard(
      canActivate: authState.user.maybeMap(
        authenticated: (user) async => true,
        anonymous: (user) async => false,
      ),
      fallbackRoute: fallbackRoute,
      child: child,
    );
  }
}
```

```dart
GoRoute(
    name: 'home',
    path: '/',
    builder: (context, state) => AuthGuard(
        fallbackRoute: '/signup',
        child: HomePage(),
    ),
),
```

- **"You can't navigate during the build",** so the redirect runs in `WidgetsBinding.instance.addPostFrameCallback`.
- **`pushReplacement`,** so back cannot return to the restricted page [ApparenceKit](https://apparencekit.dev/flutter-tips/create-flutter-page-route-guard/).
- **Skip the redirect when already on `fallbackRoute`,** "to prevent loops" [ApparenceKit](https://apparencekit.dev/flutter-tips/secure-flutter-pages-with-gorouter-guards/). go_router's own loop cap (`redirectLimit`, default 5) covers only `redirect`.
- **Several conditions:** nest one guard per condition (cascade), or combine them into one `canActivate`. A `UserInfosGuard` waits for user data with a loading indicator, then sends users who have not onboarded to `/onboarding`. The author's suggested improvements: a loading state, and a transition state while redirecting.
- **Navigator 1.0 form** [ApparenceKit](https://apparencekit.dev/flutter-tips/create-flutter-page-route-guard/), where the guard falls back with `Navigator.pushReplacementNamed`:

```dart
Route<dynamic> route(RouteSettings settings) {
  switch (settings.name) {
    case 'init_account':
      return MaterialPageRoute(
        builder: (_) => AuthenticatedGuard(child: InitAccountPage()),
      );
    // ... other routes
  }
}
```

- **Where the official docs differ:**
  - Auth placement: the Flutter docs "Handle auth and state-based routing with `redirect`" ([flutter ROUTING-AND-DEEP-LINKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ROUTING-AND-DEEP-LINKS.md#redirects-and-auth)); ApparenceKit uses a widget per route. Both are sources; choose one per app.
  - Future created in build: `AuthGuard.build` creates a new `canActivate` future on every build and hands it to `FutureBuilder`; the Flutter docs say "Create the Future once in `initState`, so rebuilds do not fetch again" ([flutter DATA-AND-NETWORKING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/DATA-AND-NETWORKING.md)).
  - Imperative redirect: `pushReplacement` is imperative navigation, which "is known to cause issues with the browser history" ([flutter ROUTING-AND-DEEP-LINKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ROUTING-AND-DEEP-LINKS.md)); matters on the web.
  - Named routes: the Navigator 1.0 form routes on `settings.name` and falls back with `pushReplacementNamed`; the Flutter docs advise against named routes for most apps.

## Prove it

- **Sidebar:** opening `/users/42` highlights Users; switching sections and back returns to the same page in each branch.
- **Root navigator:** `grep -rn rootNavigator lib/` shows the nested flow's exit pushing through `Navigator.of(context, rootNavigator: true)`, not the nested navigator, and with a page route rather than a route name.
- **Guards:** signed out, opening a guarded path lands on the fallback route and back does not return; opening the fallback route itself does not loop.
- **Guard futures:** a guard does not start a new network check on every rebuild (watch the network log while the guarded page rebuilds).
