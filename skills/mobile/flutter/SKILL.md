---
name: flutter
description: "Builds Flutter apps the way the Flutter team's docs and official agent skills prescribe: layered MVVM architecture with repositories, commands and Result, layout that fits the window (breakpoints, large screens, orientation, layout errors, widget previews), go_router navigation and Android App Links and iOS Universal Links, HTTP, JSON and local storage with offline sync, platform channels and Pigeon, unit, widget, golden and integration tests, performance and DevTools, accessibility, localization with gen-l10n, flavors, signing and store builds (AGP 9, SwiftPM, UIScene), the Dart and Flutter MCP server and agent plugin, and versions and breaking changes. Use when building, reviewing or debugging a Flutter app, setting up its routing, data, tests or release builds, or upgrading Flutter."
---

# Flutter

Flutter's own docs (docs.flutter.dev, every page also served as markdown at `<page-url>.md`) and the Flutter team's agent skills (flutter/agent-plugins) set the guidance this skill follows. Most outcomes in a Flutter app come down to a few mechanisms: widgets stay free of data logic while a repository owns each piece of data, layout reads the window it gets ("Constraints go down. Sizes go up. Parent sets position."), page-backed routes are the ones that deep-link, and tests and profiling only mean something when frames are pumped and builds are measured in profile mode. Two files hold third-party material: [SCALE-KIT.md](SCALE-KIT.md) is the fodilfliti `flutter_scale_kit` package, which disagrees with Flutter on device-type branching, and parts of [VERSIONS.md](VERSIONS.md) (the full history matrix, deprecation table and upgrade runbook) come from the [RandalSchwartz] changelog skill; both mark where they differ from the official sources. The Dart language, packages and Dart-only tests are [../dart/SKILL.md](../dart/SKILL.md); store submission is [../app-store-connect/SKILL.md](../app-store-connect/SKILL.md) and [../google-play/SKILL.md](../google-play/SKILL.md); Patrol and Maestro end-to-end tests are [../../web-automation/e2e-testing/SKILL.md](../../web-automation/e2e-testing/SKILL.md); in-app subscriptions are [../../backend/revenuecat/SKILL.md](../../backend/revenuecat/SKILL.md); crash and error reporting is [../../monitoring/sentry/SKILL.md](../../monitoring/sentry/SKILL.md).

| The job | Read |
|---|---|
| Layers (views, view models, repositories, services, optional use cases), recommendations by priority, project structure, DI with `provider`, commands, the `Result` type, optimistic state, state management options, the Compass case study | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Responsive and adaptive design, measuring the window, breakpoints, large screens and foldables, orientation, `SafeArea`, capabilities and policies, `.adaptive()` widgets, layout error fixes, widget previews | [LAYOUT-AND-RESPONSIVE.md](LAYOUT-AND-RESPONSIVE.md) |
| The third-party `flutter_scale_kit` package: style file, `ScaleKitBuilder`, `SK*` widgets, tokens, device classification, and where it disagrees with Flutter | [SCALE-KIT.md](SCALE-KIT.md) |
| `Navigator` or Router, `go_router` setup, parameters, shell routes and tabs, redirects and auth, errors, type-safe routes, Android App Links, iOS Universal Links, third-party link plugins | [ROUTING-AND-DEEP-LINKS.md](ROUTING-AND-DEEP-LINKS.md) |
| `http` requests, showing them with `FutureBuilder`, JSON by hand, parsing off the main isolate, generated models, local storage, key-value and SQL, offline first and sync | [DATA-AND-NETWORKING.md](DATA-AND-NETWORKING.md) |
| Platform channels, codec types, Android and iOS hosts, threading, Pigeon, and the native files a Flutter app edits | [PLATFORM-INTEGRATION.md](PLATFORM-INTEGRATION.md) |
| Unit tests, mocks and fakes, widget tests and choosing a pump, golden tests, integration tests and running them, performance integration tests, debugging tests | [TESTING.md](TESTING.md) |
| Frame budget, build cost, `const`, `saveLayer`, opacity and clips, lazy lists, isolates, build modes, profiling, DevTools, Impeller, app size | [PERFORMANCE.md](PERFORMANCE.md) |
| Accessibility regulations and release checklist, contrast and tap targets, `Semantics`, screen readers, web semantics, guideline tests and scanners | [ACCESSIBILITY.md](ACCESSIBILITY.md) |
| `flutter_localizations` and `gen-l10n`, delegates, ARB files, placeholders, plurals and select, number and date formats, locale resolution, `l10n.yaml` options | [LOCALIZATION.md](LOCALIZATION.md) |
| Flavors, `--dart-define`, version numbers, Android and iOS release builds, signing, app bundles, obfuscation, SwiftPM and CocoaPods, AGP 9 and built-in Kotlin, UIScene, continuous delivery, secrets | [BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md) |
| The official agent plugin, installing it per client, the Dart and Flutter MCP server and its tools, connecting to a running app, the hot reload rule, docs for agents, AI features inside apps | [AGENT-TOOLING.md](AGENT-TOOLING.md) |
| Current stable and release history, what 3.47 and 3.44 changed, minimum OS and toolchain, breaking changes, `material_ui` and `cupertino_ui`, deprecations, Material 3, upgrading an old app | [VERSIONS.md](VERSIONS.md) |

## The rules

1. **Never mix UI rendering with business logic or data fetching.** Views hold only show/hide conditions, animation, layout from device information and simple routing; view models get repositories through their constructors and keep them private; the repository is the single source of truth and the only class that changes its data.
2. **Base every layout decision on the available window space,** read with `MediaQuery.sizeOf(context)` or `LayoutBuilder`: never on hardware type ("phone" vs "tablet"), `Platform.isAndroid` or orientation, and never portrait-lock the app.
3. **Be lazy with lists:** for unknown or large item counts always use `ListView.builder` or `GridView.builder`, prefer many small `const` widgets, and keep `build()` cheap.
4. **Fail loudly on the network:** throw (or return an error `Result`) on any unexpected status code and never return `null` on failure, cast `jsonDecode` results to typed models, and move parsing that takes longer than 16 ms off the main isolate with `compute()`.
5. **Use `go_router` for navigation,** "the preferred way to write 90% of Flutter applications": page-backed routes deep-link, named routes and `Navigator.push` pages do not, and `context.go()` beats imperative `push` for browser history.
6. **Pump after every interaction in a widget test:** a tap calls `setState()` but the test environment does not rebuild on its own, so call `pump()` (or `pumpAndSettle()` for animations) before the next `expect()`.
7. **Measure performance in profile mode on a physical device,** the slowest one your users might reasonably use; debug builds and emulators are not indicative of release performance.
8. **Keep secrets out of the app and its repository:** storing secrets in an app is a poor security practice (obfuscation only renames symbols), and `key.properties` and the upload keystore never go into source control.

## Prove it

`flutter analyze` is clean and `flutter test` passes (through the MCP `run_tests` tool when an agent runs it); no view imports a repository or service; no layout branches on device type, platform or orientation; a request that returns 404 or 500 ends in an error state, not an endless spinner; deep links open the target screen from a cold start on both platforms; performance claims come from a profile build on a device; `git ls-files` shows no keystore or `key.properties`; and every file's own Prove it checks pass for the parts you touched.
