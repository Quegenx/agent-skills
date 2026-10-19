# Shared JavaScript SDK contract

Shared JavaScript SDK options, privacy categories, capture APIs and scopes from the Sentry SDK references and current official option/migration pages. Browser, React, Next.js and Node keep their runtime setup in their own files. SDK v10 and v11 differ: use [UPGRADE.md](UPGRADE.md) before applying a version-specific example. [getsentry/sentry-for-ai, SDK references; https://docs.sentry.io/platforms/javascript/configuration/options/; https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/]

## Core SDK options

[getsentry/sentry-for-ai, shared JavaScript SDK references; https://docs.sentry.io/platforms/javascript/configuration/options/]

JavaScript SDK options (v10 and v11). Other SDKs have their own options page; the platform files list their differences.

| Option | Default | What it does |
|---|---|---|
| `dsn` | unset | Where events go. Unset means the SDK sends nothing. |
| `orgId` | from the DSN | Used for trace propagation. |
| `debug` | `false` | SDK debug output. |
| `release` | unset | In the browser the SDK tries `window.SENTRY_RELEASE.id`. |
| `environment` | `production` (the text says `development` or `production` depending on whether the app is packaged) | See [Environments](PRACTICES.md#environments). |
| `tunnel` | unset | URL to transport events through, to get around ad-blockers. Still needs the DSN and a custom server endpoint. |
| `sampleRate` | `1.0` | Error sampling, events picked randomly. |
| `maxBreadcrumbs` | `100` | Events over the max payload size are dropped. |
| `attachStacktrace` | true in SDK 11; false in the older browser source | Events group differently with and without stack traces, so toggling it creates new groups. |
| `initialScope` | | Object or callback `(scope) => scope`. |
| `maxValueLength` | | Truncation length for string properties. |
| `normalizeDepth` / `normalizeMaxBreadth` | `3` / `1000` | |
| `enabled` | `true` | `false` doesn't remove all instrumentation overhead. To disable Sentry completely per environment, call `Sentry.init` conditionally. |
| `sendClientReports` | `true` | Sends outcomes for events that were never sent. |
| `integrations` / `defaultIntegrations` | | Array or `(integrations) => integrations`; `defaultIntegrations: false` means none, an array replaces them. |
| `transport` / `transportOptions` | `fetch` in the browser | Transports drop an event that fails to send for lack of connection. `transportOptions`: `headers`, `fetchOptions`. |
| `enhanceFetchErrorMessages` | `'always'` (since `10.34.0`) | `'always' \| 'report-only' \| false`. Appends the hostname, e.g. "Failed to fetch (example.com)". `'always'` changes the real error message and may break packages that match exact messages (`is-network-error`, `p-retry`); `'report-only'` changes it only in what is sent to Sentry. |
| `traceLifecycle` | `'stream'` since 11.0.0 (option since `10.53.1`) | `'stream'` sends spans in batches as they finish; `'static'` keeps them in memory and sends a transaction when the root span ends. |
| `propagateTraceparent` | `false` (since `10.10.0`) | Adds the W3C `traceparent` header to fetch and XHR next to `sentry-trace` and `baggage`, for OpenTelemetry-instrumented backends. The backend's CORS must allow `traceparent`. |
| `enableLogs` | opt-in below 10.71; removed in 11 | Earlier 10.x requires true; 11 emits through API calls/integrations without this option. |
| `profileSessionSampleRate` | `0` (since `10.27.0`) | Required to enable profiling; decided once per session (browser session = page-load SDK init until the tab closes). |
| `profileLifecycle` | `"manual"` (since `10.27.0`) | `"manual"` uses `startProfiler()` and `stopProfiler()`, and only `profileSessionSampleRate` affects it; `"trace"` starts and stops with root spans as long as tracing is enabled, runs while at least one sampled root span is active, max 5 minutes per root span, and is affected by both `profileSessionSampleRate` and the trace sample rate. |

Sampling options (`tracesSampleRate`, `tracesSampler`, `replaysSessionSampleRate`, `replaysOnErrorSampleRate`) are in [SAMPLING-AND-QUOTAS.md](SAMPLING-AND-QUOTAS.md). Data-collection options are in [PII and data scrubbing](PRACTICES.md#pii-and-data-scrubbing).

**Hook signatures:**

| Hook | Signature | Notes |
|---|---|---|
| `beforeSend` | `(event: Event, hint: EventHint) => Event \| null` | Errors and messages. All scope data is already applied when it runs, so scope changes there have no effect. |
| `beforeBreadcrumb` | `(breadcrumb: Breadcrumb, hint?: BreadcrumbHint) => Breadcrumb \| null` | Returning nothing drops the breadcrumb. |
| `beforeSendSpan` | `(span: StreamedSpanJSON) => StreamedSpanJSON` | Runs for every finished span; check `span.is_segment` for service spans. Cannot drop (cannot return `null`): use `ignoreSpans`. With `traceLifecycle: 'static'` wrap it with `Sentry.withStaticSpan()`; a callback that doesn't match the lifecycle is ignored. |
| `beforeSendTransaction` | | Deprecated; applies only with `traceLifecycle: 'static'`. |
| `beforeSendLog` | `(log: Log) => Log \| null` | |
| `beforeSendMetric` | `(metric: Metric) => Metric \| null` | |

## dataCollection

[getsentry/sentry-for-ai, shared JavaScript SDK references; https://docs.sentry.io/platforms/javascript/configuration/options/]

- **Scrub before sending** with `beforeSend` (errors, messages), `beforeSendSpan`, `beforeSendLog`, `beforeSendMetric` and `beforeSendTransaction` (transaction mode).
- **`dataCollection`** (JS since `10.57.0`) controls the auto-collected categories. In v10 its defaults apply only when you set it; without it the deprecated `sendDefaultPii` decides. From v11 the defaults always apply. It does not affect Session Replay (use Replay's privacy options).

| Key | Default | Notes |
|---|---|---|
| `userInfo` | `true` | `user.*` id, email, username, ip_address from instrumentation; `Sentry.setUser()` data is always sent. |
| `cookies` | `true` | Names always included; sensitive values replaced with `[Filtered]`. |
| `httpHeaders` | `true`, or `{ request?, response? }` both `true` | |
| `httpBodies` | all types | `"incomingRequest"`, `"outgoingRequest"`, `"incomingResponse"`, `"outgoingResponse"`; `[]` disables. |
| `urlQueryParams` | `true` | |
| `graphQL` | `{ document?, variables? }` both `true` | |
| `genAI` | `{ inputs?, outputs? }` both `true` | Options set on an AI integration take precedence. |
| `databaseQueryData` | `true` | Bound params, write payloads, result data; `db.query.text` is not controlled by it. |
| `queues` | `true` | |
| `stackFrameVariables` | `true` | |
| `frameContextLines` | `5` | |

```typescript
type CollectBehavior = boolean | { allow: string[] } | { deny: string[] };
// true          → collect all (sensitive denylist still scrubs values)
// false         → collect nothing
// { deny: [] }  → collect all, extending the denylist with the given terms
// { allow: [] } → only the listed keys send their real value
```

- **The built-in denylist always applies, even to `allow` keys,** matching partially and case-insensitively (`auth` matches `Authorization` and `X-Auth-Token`): `["auth", "token", "secret", "password", "passwd", "pwd", "key", "jwt", "bearer", "sso", "saml", "csrf", "xsrf", "credentials", "session", "sid", "identity"]`. To also filter user-identifying values that aren't credentials (`x-forwarded-for`, `x-user-id`), extend it with `["forwarded", "-ip", "remote-", "via", "-user"]`.
- **Defaults differ by SDK:** JS v11 collects user info, headers, bodies and cookies by default behind the denylist; Flutter's `sendDefaultPii` defaults to `false`.
- **Where sensitive data hides:** stack locals (Node), breadcrumbs (do not log PII when log statements become breadcrumbs; query strings and fragments in breadcrumb data), user context, HTTP query strings, transaction names (raw URLs like `/users/1234/details` when parameterization fails), HTTP spans (query string and fragment), attributes (scrub with `beforeSendSpan`, `beforeSendLog`, `beforeSendMetric`).
- **Send identifiers, not personal data:** hash confidential context, `Sentry.setTag("birthday", checksumOrHash("08/12/1990"));`, and send an internal ID instead of the email, `Sentry.setUser({ id: user.id });` or `Sentry.setUser({ username: user.username });`. For logging: anonymize, filter with `beforeBreadcrumb`, or disable the logging breadcrumb integration.
- **AI prompts and completions** (`gen_ai.input.messages`, `gen_ai.output.messages`, `gen_ai.tool.call.*`, ...) are not scrubbed by the default server-side rules. Scrub them with an advanced rule on `$span.data.'<attribute>'` or disable capture. The sources disagree on the default: the data-scrubbing reference calls capture opt-in (only with PII capture enabled); the AI-monitoring reference says keep capture enabled by default and disable it only on a privacy concern. Confirm with the user.

### React reference example

[getsentry/sentry-for-ai, shared JavaScript SDK references; https://docs.sentry.io/platforms/javascript/configuration/options/]

The React source uses the following allow/deny example. The built-in sensitive denylist above still applies to allowlisted keys; this is not permission to transmit credentials. [getsentry/sentry-for-ai, sentry-react-sdk; https://docs.sentry.io/platforms/javascript/configuration/options/#dataCollection]

```typescript
Sentry.init({
  dataCollection: {
    cookies: { allow: ['session', 'user_id'] },
    httpHeaders: {
      request: { allow: ['authorization', 'x-request-id'] },
      response: { deny: ['set-cookie'] },
    },
  },
});
```

## Capture APIs

[getsentry/sentry-for-ai, shared JavaScript SDK references; https://docs.sentry.io/platforms/javascript/configuration/options/]

- **`Sentry.captureException(error, captureContext?)`:** pass `Error` objects (they carry stack traces). Returns the event id, which feeds `showReportDialog` and `captureFeedback`. Context: `level` (`"fatal" | "error" | "warning" | "log" | "info" | "debug"`), `tags` (`Record<string,string>`), `extra`, `user` (`{ id?, email?, username?, ip_address? }`), `contexts`, `fingerprint` (`string[]`).

```javascript
Sentry.captureException(err, {
  level: "fatal",
  tags: { module: "checkout", payment_provider: "stripe" },
  extra: { orderId: order.id, amount: order.total },
  user: { id: "u_123", email: "user@example.com" },
  fingerprint: ["checkout-payment-fail"],
  contexts: {
    payment: { provider: "stripe", amount: 9999, currency: "usd" },
  },
});
```

- **`Sentry.captureMessage(message, levelOrContext?)`:** e.g. `Sentry.captureMessage("Something went wrong", "warning");`; also takes a full context.
- **`Sentry.captureEvent(event)`:** for custom integrations and forwarding legacy loggers; `timestamp` in Unix seconds (`Date.now() / 1000`).
- **Utilities:** `Sentry.lastEventId()`; `await Sentry.flush(2000)` waits up to 2 s; `await Sentry.close(2000)` flushes and disables the SDK permanently; `Sentry.isEnabled()`.

## Scopes and enrichment

[getsentry/sentry-for-ai, shared JavaScript SDK references; https://docs.sentry.io/platforms/javascript/configuration/options/]

- **Merge order: Global, Isolation, Current, then the event's own context.** `getGlobalScope()` lives for the whole app (app-wide constants: version, build ID, region), `getIsolationScope()` per page load (user info, session data, tags from top-level `setTag()`), `withScope()` per event (one API call, one form submit). A browser has no per-request isolation, so the isolation scope effectively behaves like the global one (the distinction matters in Node.js, Deno and Cloudflare Workers). Top-level `Sentry.setTag` / `setTags` write to the isolation scope.
- **`withScope` is the way to attach per-event data;** it forks the scope and discards it after the callback:

```javascript
Sentry.withScope((scope) => {
  scope.setTag("transaction_id", "txn_abc123");
  scope.setExtra("requestPayload", { amount: 50, currency: "USD" });
  scope.setLevel("warning");
  scope.setUser({ id: "u_789" });
  scope.setFingerprint(["payment-error", "stripe"]);
  Sentry.captureException(new Error("Payment failed"));
  // scope is discarded after this callback
});
```

- **Scope methods in the retained SDK 10 source:** `setUser({ id, email, username, ip_address })` (`null` clears), `setTag`, `setTags`, `setExtra`, `setExtras`, `setContext(name, obj)` (`null` removes), `setLevel`, `setFingerprint`, `addBreadcrumb`, `addEventProcessor`, `clear()`.
- **Tags for data you filter on, context for debugging data:** tags are indexed, context is not.
- **Tags** (searchable): keys ≤32 chars from `a-zA-Z0-9_.:-`, no spaces; values ≤200 chars, no newlines. Built-in tags (`browser`, `os`, `url`, `environment`, `release`) overwrite yours of the same name.
- **Context** isn't indexed or searchable but shows in full on the event page; normalized to 3 levels deep (change `normalizeDepth`).
- **User:** `Sentry.setUser({...})` accepts extra fields; call it after login, not in init, and `Sentry.setUser(null)` on logout. `Sentry.setUser({ ip_address: "{{auto}}" })` infers the IP; collection follows `dataCollection.userInfo`.
- **`initialScope`:** an object (`{ tags, user }`) or a callback `(scope) => { ...; return scope; }`.
- **Never send emails, card numbers or passwords as tags or extra;** scrub PII in `beforeSend`. Always set `release` and `environment`: source maps and environment-aware alerts need them.
- **Avoid capturing in render paths:** put Sentry calls in event handlers or `try/catch` blocks.

## Breadcrumbs

[getsentry/sentry-for-ai, shared JavaScript SDK references; https://docs.sentry.io/platforms/javascript/configuration/options/]

- **Buffered locally** and attached to the next event sent to Sentry.
- **Manual:** `Sentry.addBreadcrumb({ category: "auth", message: "User authenticated", level: "info", data: { userId: user.id, method: "oauth2", provider: "google" } })`.
- **Automatic:** `console` (log, warn, error, debug), `dom` (click, keypress), `fetch`, `xhr`, `history` (pushState, replaceState, navigations), `sentry` (SDK sends).
- **Shape:** `message`, `type` (`"default"|"debug"|"error"|"info"|"navigation"|"http"|"query"|"ui"|"user"`), `level`, `category` (dot-namespaced), `data`, `timestamp`.
- **`beforeBreadcrumb(breadcrumb, hint)`** returns `null` to drop; `hint?.xhr` exists for http breadcrumbs. `maxBreadcrumbs` defaults to 100.
- **Configure sources in the retained SDK 10 source:** `Sentry.breadcrumbsIntegration({ console, dom: { serializeAttribute: ["data-testid", "aria-label"] }, fetch, history, xhr, sentry })`.

## Hooks and event processors

[getsentry/sentry-for-ai, shared JavaScript SDK references; https://docs.sentry.io/platforms/javascript/configuration/options/]

- **`beforeSend(event, hint)` runs last,** after scope data is applied; return `null` to drop. Hint: `originalException`, `syntheticException`, `event_id`, `data`. Uses: drop ResizeObserver errors, drop errors with `extension://` frames, delete `event.user.email`, set fingerprints.
- **`beforeSendTransaction(event)`** is the separate hook for transactions, e.g. drop `/health` and `/ping`, normalize `/users/\d+` to `/users/:id`.
- **`Sentry.addEventProcessor((event, hint) => ...)` against `beforeSend`:** processor order is unspecified while `beforeSend` always runs last; any number of processors but one `beforeSend`; processors can be scope-level while `beforeSend` is init-only; both may be async (slower).

## Source qualifiers

[getsentry/sentry-for-ai, shared JavaScript SDK references; https://docs.sentry.io/platforms/javascript/configuration/options/]

- **Scopes in the browser and server differ.** Node forks request isolation through AsyncLocalStorage; browser isolation is effectively page-global. Keep runtime-specific lifetimes in [NODE.md](NODE.md#scopes-and-context) and the platform setup files. [getsentry/sentry-for-ai, sentry-node-sdk and sentry-react-sdk]
- **React context keys:** `type` is reserved in setContext; prefer structured context over extras. React-source user setup uses `ip_address: "{{ auto }}"`, while the browser reference uses `"{{auto}}"`; verify the installed SDK rather than treating the two literal spellings as an unsupported correction. [getsentry/sentry-for-ai, sentry-react-sdk and sentry-browser-sdk]
- **SDK 11 removes Scope.clear and the console option of breadcrumbsIntegration.** Console breadcrumbs now come from consoleIntegration; the scope-method list and breadcrumbs recipe above describe the retained v10 source contract. v11 resets state with a fresh withScope/withIsolationScope or SDK reinitialization. [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/#all-sdks; https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/#browser]

- The original browser setup dated dataCollection to 10.54+; the shared/current schema above records 10.57.0. The original option table also spelled attachStackTrace while the capture reference used attachStacktrace; use the actual installed option. [getsentry/sentry-for-ai, sentry-browser-sdk; https://docs.sentry.io/platforms/javascript/configuration/options/]
- **Breadcrumb shape correction:** SDK Event.breadcrumbs is an array, not a .values wrapper. The old Node source used event.breadcrumbs.values; use beforeBreadcrumb for per-breadcrumb filtering. [existing sentry/NODE.md correction; https://github.com/getsentry/sentry-javascript/blob/develop/packages/core/src/types/event.ts]
- The React source replaces the deprecated configureScope API (since SDK 8) with getIsolationScope or withScope; its beforeBreadcrumb examples inspect hint.event.target for password-field clicks, hint.xhr for HTTP enrichment and the console level for debug filtering. captureMessage defaults to info and can record deprecated API calls, suspicious conditions or rate-limit hits. [getsentry/sentry-for-ai, sentry-react-sdk]

## Prove it

[getsentry/sentry-for-ai, shared JavaScript SDK references; https://docs.sentry.io/platforms/javascript/configuration/options/]

The installed SDK major matches the option and hook contract; event context uses the intended scope, no per-request user is put on a process-global scope, and explicit privacy settings remove the categories the application must not send. Capture and filtering are exercised through the application's real init path using [PRACTICES.md](PRACTICES.md#verify-end-to-end). [getsentry/sentry-for-ai, SDK references; https://docs.sentry.io/platforms/javascript/configuration/options/]
