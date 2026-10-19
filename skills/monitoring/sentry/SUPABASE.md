# Supabase and Sentry

Three connections between Supabase and Sentry: `supabaseIntegration` turns Supabase client calls into spans, errors and breadcrumbs; W3C trace propagation makes Supabase's API Gateway and Edge Function logs share the app's trace ID; and the Supabase Log Drain ships Supabase logs into Sentry Logs. Edge Functions themselves use the Sentry Deno SDK. Supabase itself is the `supabase` skill ([supabase SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/supabase/SKILL.md)); base SDK setup is in the platform files ([BROWSER.md](BROWSER.md), [REACT.md](REACT.md), [NEXTJS.md](NEXTJS.md), [NODE.md](NODE.md), [FLUTTER.md](FLUTTER.md)). What decides most outcomes for propagation: Sentry's propagator omits `traceparent` by default, so `propagateTraceparent: true` plus `tracePropagation` on the Supabase client are both required, and browsers also need the project URL in `tracePropagationTargets` and `sentry-trace` in Edge Function CORS.

**JavaScript version boundary:** retained vendor examples target the stated SDK 10 era source unless marked 11; read the [SDK 11 migration](UPGRADE.md#v10-to-v11) before applying them to 11. Native Flutter/RN SDK versions are separate. [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/]

**Contents:** [The integration (JS)](#the-integration-js) · [Trace propagation (JS)](#trace-propagation-js) · [Dart and Flutter](#dart-and-flutter) · [Edge Functions](#edge-functions) · [Log drain](#log-drain) · [Troubleshooting](#troubleshooting) · [Prove it](#prove-it)

## The integration (JS)

- **`Sentry.supabaseIntegration({ supabaseClient })`** instruments a `@supabase/supabase-js` `>=2.0.0` client.

```javascript
import * as Sentry from "<sdk-package-name>";
import { createClient } from "@supabase/supabase-js";

const supabaseClient = createClient(
  "YOUR_SUPABASE_URL",
  "YOUR_SUPABASE_KEY",
);

Sentry.init({
  dsn: "https://<key>@o<orgId>.ingest.sentry.io/<projectId>",
  integrations: [Sentry.supabaseIntegration({ supabaseClient })],
  tracesSampleRate: 1.0,
});
```

- **Auth spans:** `signInWithPassword`, `signOut`, `signInAnonymously`, `signInWithOAuth`, `signInWithIdToken`, `signInWithOtp`, `signInWithSSO`, `signUp`, `verifyOtp`, `reauthenticate`. **Admin:** `createUser`, `deleteUser`, `listUsers`, `getUserById`, `updateUserById`, `inviteUserByEmail`.
- **DB spans** carry `db.table`, `db.schema`, `db.url`, `db.sdk`, `db.system.name` ('postgresql'), `db.query`, `db.body`, which feed Query Dashboards. Failed operations are captured as errors, and DB calls become breadcrumbs. Queue spans are "in progress".
- **Query data is captured:** `db.query` and `db.body` hold query params and mutation bodies. Separately, the v11 options page says `dataCollection.databaseQueryData` (default `true`) governs bound params and payloads; the Supabase integration page doesn't mention `dataCollection`.

## Trace propagation (JS)

So API Gateway (PostgREST, Auth, Storage, Realtime) and Edge Function logs carry the same `trace_id` as the app, via the W3C `traceparent` header.

- **Requirements:** `@supabase/supabase-js` `2.106.0`+, Sentry JS `10.10.0`+, the npm package (not the CDN), and `@opentelemetry/api` at runtime.
- **Steps:**
  1. With supabase-js `2.112.0`+, add `import "@supabase/supabase-js/tracing";` once at the entry point.
  2. Set `propagateTraceparent: true` in `Sentry.init()` ("Sentry's propagator omits `traceparent` by default"; this applies to Node, including the Next.js server, and to browsers). In browsers also add the project URL (`https://<ref>.supabase.co`) to `tracePropagationTargets`, since it is cross-origin.
  3. Set `tracePropagation: true` on `createClient`, or the object form `tracePropagation: { enabled: true, respectSamplingDecision: false }` (`enabled` default `false`, `respectSamplingDecision` default `true`).
  4. If the browser calls Edge Functions directly, add `sentry-trace` to the function's CORS allow-list ("Sentry always sends its own header, and it isn't part of `corsHeaders`").
- **Edge Function CORS:** import `corsHeaders` from `npm:@supabase/supabase-js@^2.112.3/cors`, or add `traceparent`, `tracestate` and `baggage` yourself, plus `sentry-trace`.
- **Headers go only to** `*.supabase.co`, `*.supabase.in` and `localhost`.
- **Unsampled requests:** from supabase-js `2.112.3`, unsampled requests include `traceparent` but omit `tracestate` and `baggage`; `respectSamplingDecision: false` sends the full context.

## Dart and Flutter

- **`sentry` / `sentry_flutter` 9.7.0+.** Set `options.propagateTraceparent = true` AND pass `httpClient: SentryHttpClient()` to the Supabase client: "The Dart SDK does not intercept HTTP globally, so the option has no effect on a default `SupabaseClient`."

```dart
import 'package:sentry/sentry.dart';
import 'package:supabase/supabase.dart';

await Sentry.init((options) {
  options.dsn = 'https://<key>@o<orgId>.ingest.sentry.io/<projectId>';
  options.tracesSampleRate = 1.0;
  options.propagateTraceparent = true;
});
final supabase = SupabaseClient(
  'https://xyzcompany.supabase.co',
  'your-anon-key',
  httpClient: SentryHttpClient(),
);
```

- **Flutter:** `SentryFlutter.init` with `options.propagateTraceparent = true`, then `await Supabase.initialize(url: 'https://xyzcompany.supabase.co', anonKey: 'your-anon-key', httpClient: SentryHttpClient());` (imports `package:sentry_flutter/sentry_flutter.dart` and `package:supabase_flutter/supabase_flutter.dart`). Supabase is an opt-in Flutter integration; the package list is in [FLUTTER.md](FLUTTER.md#ecosystem-integrations).
- **Supabase side:** `TracePropagationOptions(enabled: true, traceContextProvider: () => ...)` on `SupabaseClient` or `Supabase.initialize`.

## Edge Functions

- **Use the Sentry Deno SDK:** `import * as Sentry from 'npm:@sentry/deno@^8'` (the version pin the Supabase page shows), then `Sentry.init({ dsn: Deno.env.get('SENTRY_DSN'), defaultIntegrations: false, tracesSampleRate: 1.0, profilesSampleRate: 1.0 })`.
- **Tag each event:** `region` = `SB_REGION`, `execution_id` = `SB_EXECUTION_ID`.
- **Flush before returning:** in the `catch`, `Sentry.captureException(e)` then `await Sentry.flush(2000)`.
- **No per-request scope:** the Deno SDK doesn't instrument `Deno.serve`, so requests aren't separated into scopes; default integrations are disabled. Use `withScope`, or pass context directly to `captureException` / `captureMessage`.
- **Deno runtime setup** in general is in [NODE.md](NODE.md).

## Log drain

- **Supabase Pro, Team and Enterprise plans only.** Create a Sentry log drain in the Supabase dashboard with the project DSN; every log field becomes a Sentry log attribute.
- **Only sampled requests have a Sentry span.** `respectSamplingDecision: false` sends the context but doesn't make Sentry sample; use cross-event querying when the sample rates differ.
- **Drains carry logs and traces only** (no errors, no metrics): Vercel (logs and traces), Cloudflare Workers (logs and traces), Heroku, OpenRouter (traces), Supabase (logs), Shopify Hydrogen (traces). Drains use the platform's own export; OTLP forwarding is for your own collector pipeline ([OTEL.md](OTEL.md)).

## Troubleshooting

When `trace_id` is missing from Supabase logs, check in this order:

1. The tracing runtime isn't imported (a one-time console warning).
2. No active span at request time.
3. `@opentelemetry/api` is missing.
4. No `TracerProvider` is registered.
5. The propagator doesn't emit `traceparent`.
6. The upstream request was unsampled (before supabase-js `2.112.3`).
7. A non-Supabase host via a custom fetch.
8. A CDN build.

| Symptom | Fix |
|---|---|
| Dart client sends no `traceparent` | Pass `httpClient: SentryHttpClient()`; the option alone does nothing |
| Edge Function events mix context between requests | Use `withScope` or pass context per call |

## Prove it

- **Spans:** a Supabase query and a sign-in inside a traced request appear as DB and auth spans with `db.table`, `db.system.name` 'postgresql' and the operation names above; a failed query shows as an error.
- **One trace ID end to end:** a request from the app shows a `trace_id` in the Supabase API Gateway logs (or Edge Function logs) equal to the Sentry trace's ID.
- **Browser CORS:** a browser call to an Edge Function with `sentry-trace` and `traceparent` passes preflight.
- **Dart:** a request through `SupabaseClient(..., httpClient: SentryHttpClient())` carries `traceparent`.
- **Edge Function:** a thrown error appears in Sentry tagged with `region` and `execution_id`.
- **Drain:** with the log drain on (Pro or higher), Supabase logs appear in Sentry Logs with their fields as attributes.
