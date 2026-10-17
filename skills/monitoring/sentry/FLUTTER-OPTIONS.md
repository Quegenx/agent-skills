# Flutter options from the v10 docs

Option and symbol-upload details from Sentry's current Flutter docs (`sentry_flutter` v10) that [FLUTTER.md](FLUTTER.md) has no room for. The option tables, setup and the full debug-symbol flow are in FLUTTER.md; tracing, replay, logs and metrics options in [FLUTTER-FEATURES.md](FLUTTER-FEATURES.md).

## Init in the docs' style

The options page initializes with a cascade:

```dart
import 'package:flutter/widgets.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

Future<void> main() async {
  await SentryFlutter.init(
    (options) => options
      ..dsn = 'https://<key>@o<orgId>.ingest.sentry.io/<projectId>'
      ..release = 'my-project-name@2.3.12'
      ..environment = 'staging',
    appRunner: () => runApp(MyApp()),
  );
}
```

## Option notes

- **`release`:** set it manually to keep it in sync with deploys and symbol uploads. `dist` is the build number or version code (max 64 chars).
- **`sendDefaultPii`** defaults to `false` ("By default, no such data is sent"); if you turn it on, remove unwanted data with the sensitive-data features. The hooks for that are `beforeSend`, `beforeSendTransaction` and `beforeSendSpan` (stream mode).
- **`maxCacheItems`** (`30`): envelopes cached offline; the oldest are deleted.
- **In-app frames:** `considerInAppFramesByDefault`, `inAppIncludes` (takes precedence) and `inAppExcludes`.
- **Since versions:** `sendClientReports` 6.6.0; `captureFailedRequests` 7.0.0 (HTTP client errors as events).
- **`beforeSend`** runs with all scope data already applied. Examples from the filtering page: `event.serverName = "";`, `return hint is MyHint ? null : event;`, and a fingerprint, `if (event.throwable is DatabaseException) { event.fingerprint = ['database-connection-error']; }`. `beforeSendTransaction` applies in transaction mode.

## Sentry Dart Plugin in the docs

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
