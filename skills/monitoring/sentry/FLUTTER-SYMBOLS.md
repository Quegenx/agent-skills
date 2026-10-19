# Flutter symbols and source maps

Flutter build artifacts, Sentry Dart Plugin configuration and upload diagnosis from the Flutter SDK references and official v10 docs. Keep SDK setup and errors in [FLUTTER.md](FLUTTER.md); cross-platform Debug ID, release and artifact matching is in [RELEASES-AND-SOURCEMAPS.md](RELEASES-AND-SOURCEMAPS.md). [getsentry/sentry-for-ai, sentry-flutter-sdk; https://docs.sentry.io/platforms/flutter/debug-symbols/]

## Debug symbols

[getsentry/sentry-for-ai, sentry-flutter-sdk and shared debug-artifact references]

- **Obfuscated builds need their debug symbols uploaded** for readable stack traces. Configure `sentry_dart_plugin` in `pubspec.yaml`:

```yaml
dev_dependencies:
  sentry_dart_plugin: ^3.2.1

sentry:
  project: YOUR_PROJECT_SLUG
  org: YOUR_ORG_SLUG
  auth_token: YOUR_AUTH_TOKEN  # prefer SENTRY_AUTH_TOKEN env var instead
  upload_debug_symbols: true
  upload_sources: true
  upload_source_maps: true     # for Web
```

- **Build, then upload:**

```bash
# Android
flutter build apk \
  --release \
  --obfuscate \
  --split-debug-info=build/debug-info \
  --extra-gen-snapshot-options=--save-obfuscation-map=build/app/obfuscation.map.json
dart run sentry_dart_plugin

# iOS
flutter build ipa \
  --release \
  --obfuscate \
  --split-debug-info=build/debug-info \
  --extra-gen-snapshot-options=--save-obfuscation-map=build/app/obfuscation.map.json
dart run sentry_dart_plugin

# Web
flutter build web --release --source-maps
dart run sentry_dart_plugin
```

- **The current docs pin `sentry_dart_plugin: ^3.4.0`** and add `dart_symbol_map_path: build/app/obfuscation.map.json` to the `sentry:` block (in `pubspec.yaml` or `sentry.properties`). Precedence: env vars > `--sentry-define` (for example `dart run sentry_dart_plugin --sentry-define=release=my-app@1.0.0`) > `pubspec.yaml` > `sentry.properties`.
- **Upload even without obfuscation:** "Even if you don't use `split-debug-info` or `obfuscate`, we recommend uploading all available debug files with the Sentry Dart Plugin" (it also symbolicates native iOS frames). Manual upload is not recommended. "Obfuscation is encouraged for production builds"; `--obfuscate` must pair with `--split-debug-info` (output dir inside the project).
- **Plugin defaults:** `upload_debug_symbols` `true`, `upload_source_maps` `false`, `upload_sources` `false`, `release` from `SENTRY_RELEASE` (default `name@version` from pubspec), `dist` from `SENTRY_DIST` (default the build number after `+`), `build_path` `build`, `web_build_path` `web`, `symbols_path` `.`, `url_prefix` (for example `~/`; needed for non-root web deploys), `legacy_web_symbolication` `false`, `commits` `auto`, `ignore_missing` `false`, `wait_for_processing` `false`, `log_level` `warn`; also `url`, `bin_dir`, `bin_path`, `sentry_cli_cdn_url` (`SENTRYCLI_CDNURL`), `sentry_cli_version`.
- **Source context** works on iOS and Android only with `--split-debug-info` (Flutter 3.10.0+ and `upload_sources`) and covers the main app package only. Symbolicated issue titles for obfuscated builds exist only on iOS and Android, not web.
- **R8/ProGuard:** configure the Sentry Android Gradle Plugin in `app/build.gradle.kts` with `autoInstallation { enabled.set(false) }`, `org`, `projectName` and `authToken.set(System.getenv("SENTRY_AUTH_TOKEN"))` (never hardcode). AGP 7.4+ fixes the Gradle plugin circular dependency.
- **Upload failures:** previous release missing from git history: `ignore_missing: true`; web source maps with plugin 3.0.0+ need the Flutter SDK 9.1.0+ (else `legacy_web_symbolication: true`); a non-root web deploy needs `url_prefix: ~/my-app/` plus a `beforeSend` that rewrites `frame.absPath` to include the prefix; Flutter 3.32.0+ with Android flavors and `--split-debug-info` can overwrite `.symbols` (use a `variantFilter` and `--android-project-arg=active-flavor=...`).
- **Keep the auth token out of the app.** `SENTRY_AUTH_TOKEN` is for the build tool only; a `sentry_dart_plugin` auth error means use the env var, not a hard-coded token.
- **Symptoms of missing symbols:** Dart frames shown as `_f`, `_g` (upload Dart symbols); native frames shown as hex addresses (upload dSYMs with the Sentry Xcode build phase or `sentry_dart_plugin`); missing Android ProGuard mapping (pass `--extra-gen-snapshot-options=--save-obfuscation-map=...`); missing iOS dSYMs (`upload_debug_symbols: true` in the `sentry:` block); missing Web stack traces (build with `--source-maps`, then `dart run sentry_dart_plugin`).

## Sentry Dart Plugin in the docs

[getsentry/sentry-for-ai, sentry-flutter-sdk and shared debug-artifact references]

- **The docs' `sentry:` block:**

```yaml
sentry:
  project: <your-project-slug>
  org: <your-org-slug>
  dart_symbol_map_path: build/app/obfuscation.map.json
  upload_sources: true
  upload_source_maps: true
```

- **Build and run, as the docs write it:** `flutter build <target> --obfuscate --split-debug-info=<output-directory> --extra-gen-snapshot-options=--save-obfuscation-map=build/app/obfuscation.map.json` (web: `flutter build web --release --source-maps`), then `flutter pub run sentry_dart_plugin`. The vendor skill runs `dart run sentry_dart_plugin` instead (FLUTTER.md).
- **Environment variables for the plugin keys:** `project` (`SENTRY_PROJECT`), `org` (`SENTRY_ORG`), `auth_token` (`SENTRY_AUTH_TOKEN`, a CI secret, not in source control), `url` (`SENTRY_URL`), `log_level` (`SENTRY_LOG_LEVEL`).

## Source differences

[getsentry/sentry-for-ai, sentry-flutter-sdk and shared debug-artifact references]

- The shared release reference describes `ignore_missing: true` while the Flutter plugin defaults table says `false`; true is also its recommended response to missing release history. Keep the configured value distinct from an asserted default and check the installed plugin docs. The shared reference also warns that wrong keys may be ignored and manual upload paths are less reliable than the documented plugin workflow. [getsentry/sentry-for-ai, shared release and Flutter references]
- A release build that uploads a different artifact than the deployed binary can still show unreadable frames; identify the event's debug images rather than treating a green upload log as matching evidence. [getsentry/sentry-for-ai, shared debug-artifact references]

## Prove it

[getsentry/sentry-for-ai, sentry-flutter-sdk and shared debug-artifact references]

An error from the shipped obfuscated build resolves to Dart function names; native frames have their matching symbols and web builds have source maps. The upload token is held by the build tool, never embedded through dart-define or SDK init. The upload target and release/dist agree with the event. [getsentry/sentry-for-ai, Flutter debug-symbol and shared release references]
