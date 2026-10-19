# Sentry Practices

The rules that hold on every platform: how to set up and verify a project, the core SDK options, filtering noise, environments, distributed tracing and PII. Sampling, quotas, rate limits and spike protection are in [SAMPLING-AND-QUOTAS.md](SAMPLING-AND-QUOTAS.md); which signal to use for what (errors, spans, logs, metrics, replay, crons, uptime, alerts) is in [SIGNALS.md](SIGNALS.md). Vendor-neutral OpenTelemetry is the `observability` skill. Most outcomes come down to three things: `init` runs before the code that fails, the event reaches Sentry and is confirmed there rather than assumed, and data is filtered and scrubbed in the SDK before it is sent.

**Contents:** [Ground rules for agents](#ground-rules-for-agents) · [Route to the platform file](#route-to-the-platform-file) · [Setup order](#setup-order) · [Create or select the project](#create-or-select-the-project) · [Verify end to end](#verify-end-to-end) · [Core SDK options](JAVASCRIPT.md#core-sdk-options) · [Filtering noise](#filtering-noise) · [Inbound filters](#inbound-filters) · [Environments](#environments) · [Distributed tracing](#distributed-tracing) · [PII and data scrubbing](#pii-and-data-scrubbing) · [Prove it](#prove-it)

## Ground rules for agents

- **Do not rely on training data for Sentry setup or configuration.** Read the current docs: every docs page is served as Markdown by appending `.md` to its URL (catalog: https://docs.sentry.io/platforms.md). A path that doesn't exist still answers HTTP 200 with a page titled "Page Not Found", so check the title, not the status.
- **Check the package registry for the latest SDK version.** Do not use memorized version numbers.
- **Keep the DSN in an environment variable** (`SENTRY_DSN` or `NEXT_PUBLIC_SENTRY_DSN`). Never hardcode DSN strings in source.
- **Prefer Sentry Logs over Breadcrumbs** unless the user explicitly asks for breadcrumbs.
- **Use existing authorization.** Perform authorized local setup within scope; ask for unresolved decisions or actions beyond it. The upstream setup source requires a new confirmation before every install/file/config change; this repository keeps existing user permission. [getsentry/sentry-for-ai, SDK setup sources; user standing rules]
- **Sentry tooling for agents:** the plugin installs with `npx @sentry/agent-plugin install` (Claude Code, Cursor, Codex, Grok); the skill library is https://skills.sentry.dev/ (SDK setup at https://skills.sentry.dev/instrument, plus `/workflows` and `/features`; source repo https://github.com/getsentry/sentry-for-ai); the MCP server for live issue analysis is `https://mcp.sentry.dev`.

## Route to the platform file

Identify the platform from project files, then report what you found; resolve only material uncertainty rather than requesting confirmation already supplied by the task. [getsentry/sentry-for-ai, SDK setup sources; user standing rules] When several rows match, take the most specific: Next.js over React or Node.js, NestJS over Node.js, Cloudflare over Node.js, React Native over React. Integrations: some are auto-enabled per SDK, others must be enabled in `init`. `release`, `environment` and `dist` are on the platform's `configuration/options` docs page.

| Platform | Detect from | Read |
|---|---|---|
| Next.js | `next` | [NEXTJS.md](NEXTJS.md), [NEXTJS-FEATURES.md](NEXTJS-FEATURES.md) |
| NestJS | `@nestjs/core` | [NESTJS.md](NESTJS.md) |
| Cloudflare Workers and Pages | `wrangler.toml`, `wrangler.jsonc` | [CLOUDFLARE.md](CLOUDFLARE.md) |
| React Router Framework | `@react-router/dev`, `@sentry/react-router` | [REACT-ROUTER-AND-TANSTACK.md](REACT-ROUTER-AND-TANSTACK.md) |
| TanStack Start React | `@tanstack/react-start` | [REACT-ROUTER-AND-TANSTACK.md](REACT-ROUTER-AND-TANSTACK.md) |
| React Native and Expo | `react-native`, `expo` | [REACT-NATIVE.md](REACT-NATIVE.md), [REACT-NATIVE-FEATURES.md](REACT-NATIVE-FEATURES.md) |
| React | `react` without a more specific framework | [REACT.md](REACT.md), [REACT-TRACING.md](REACT-TRACING.md), [BROWSER-REPLAY-AND-PROFILING.md](BROWSER-REPLAY-AND-PROFILING.md) |
| Node.js | `package.json` without a more specific framework | [NODE.md](NODE.md), [NODE-TRACING.md](NODE-TRACING.md) |
| Bun | `bun.lock`, `bunfig.toml` | [NODE.md](NODE.md) |
| Deno | `deno.json`, `deno.jsonc` | [NODE.md](NODE.md) |
| Browser JavaScript | Plain JS, jQuery, static sites, CDN script | [BROWSER.md](BROWSER.md), [BROWSER-TRACING.md](BROWSER-TRACING.md) |
| Flutter | `pubspec.yaml` with a `flutter` dependency | [FLUTTER.md](FLUTTER.md), [FLUTTER-FEATURES.md](FLUTTER-FEATURES.md) |
| Dart | `pubspec.yaml` without Flutter | [FLUTTER.md](FLUTTER.md) |

SDK major upgrades are in [UPGRADE.md](UPGRADE.md); releases, source maps and debug files in [RELEASES-AND-SOURCEMAPS.md](RELEASES-AND-SOURCEMAPS.md); what to instrument in [INSTRUMENTATION.md](INSTRUMENTATION.md).

## Setup order

Six steps, in this order. Each hands off to its section or platform file.

1. **Detect the platform** from `package.json`, `pubspec.yaml` and the like (table above), resolve material ambiguity, and fetch the docs for install, `init`, errors and tracing.
2. **Provision the project and DSN** ([Create or select the project](#create-or-select-the-project)). Create only within existing external-project authorization; otherwise propose it and request consent. [user standing rules; getsentry/sentry-for-ai, setup sources]
3. **Install the SDK with the docs' recommended default setup as written**, which in practice is errors and tracing. Don't ask the user which signals to enable, and don't pare it back to errors only. Heavier signals (profiling, replay, logs, metrics) are added when the use case warrants it.
4. **Verify end to end** ([Verify end to end](#verify-end-to-end)): run the real app, make it throw through its actual init path (a temporary real trigger in the app is fine, never a standalone script that bypasses init), poll the MCP, and show the user the issue title, the error message or value, and the direct issue URL, not just the link.
5. **Get it into production: this is the point.** Use the existing deploy context (CI/CD config, deploy script, Dockerfile or Procfile, Vercel, Fly, Render, Heroku, a deploy section in `AGENTS.md` or `CLAUDE.md`) and make sure the DSN, `release`, `environment` and the production sample rate are set in production. Without deploy context, advocate and ask. No deploy actions without consent.
6. **Make production stack traces readable:** source maps for JS and TS, debug symbols (dSYM, ProGuard/R8) for native and mobile ([RELEASES-AND-SOURCEMAPS.md](RELEASES-AND-SOURCEMAPS.md)). Inspect the verified issue with `get_sentry_resource`: frames should show file, line and function. Degraded frames even locally are a strong signal production will be worse.

**Done** means: SDK installed with errors and tracing, a real error confirmed through the MCP with title, message and URL shown, the user worked toward production, and stack-trace quality addressed. A local-only setup isn't the finish line.

**Onboarding status stages** (only when the calling skill defined onboarding status updates): `analyze_project`, `create_project` (report slugs in `update.extra.projectSlugs`; for an existing project, `update.eventNote: Project already existed.`), `instrument_app`, `plan_test_error`, `send_verification_error`, `receive_verification_error` (issue IDs in `update.extra.issueIds`; never include event IDs), `prepare_production`, `check_stack_trace_quality` (`skipped` with `update.runStatus: completed` only when the platform needs no artifact work). States: `active`, `waiting`, `completed`, `skipped`.

## Create or select the project

- **Needs the Sentry MCP connected and authenticated.** If it can't authenticate at all, the user may have no account: send them to `https://sentry.io/signup` (there is no agent flow for account creation).
- **Tool exposure:** `find_organizations` and `find_projects` are exposed directly; `find_dsns`, `create_project`, `find_teams` and `create_team` are catalog tools, reached through `search_sentry_tools` and `execute_sentry_tool`.
- **Find the org, then the project.** `find_organizations` gives the org slug (ask if there are several). `find_projects` returns slugs only and can't tell you the platform.
- **Get the DSN:** `find_dsns` takes the org slug and the project slug.
- **Create a project:** `create_project` requires `organizationSlug`, `teamSlug` and `name`; optional `slug`, `platform`, `repository`. Use `find_teams` for the team slug; with no team, `create_team` first.

| Response | Meaning and fix |
|---|---|
| DSN `unavailable` | The project was still created. Call `create_dsn`. |
| `403 ... disabled this feature for members` | The user creates the project in the UI, then you call `find_dsns`. |

- **In reference text,** the placeholder `___DSN___` is fine.

## Verify end to end

Every instrumentation task ends here. Do not tell the user to "go check your dashboard" and stop: confirm the event landed through the MCP. Announce it: "Sentry is instrumented, now let's get real instrumentation data flowing through it so we know it works."

- **Decide who boots the app; do not assume.** Keep the event identifiable, for example `Sentry test error <timestamp>`.
- **Trigger each signal on a real path:**

| Signal | Trigger |
|---|---|
| First error | The real app throws on a real path (a temporary `/debug-sentry` route, a throw behind a one-off flag, an intentional bug), then remove it. Do not call `captureException` from an isolated script. |
| Tracing | A real traced request. |
| Logging | A log at a captured level on a real path. |
| Metrics | Exercise the emitting code. |
| Crons | Invoke the job so its check-in fires. |
| Uptime | Nothing to trigger: wait for the first check and confirm with `get_uptime_monitor_details`. |

- **Poll with the MCP:** `search_events` for a fast "did anything arrive" (`period` accepts `^\d+[hdw]$`, minimum `1h`); `search_issues`; `get_sentry_resource` with `resourceType: 'issue'` (identical to the catalog tool `get_issue_details`, but exposed directly). Events usually appear within about 30 seconds. A transient 400 from `search_issues` is a query-rewrite artifact: retry.
- **Show what was captured.** The output's `Description` reads `Type: value`; quote it with the `URL`: "Confirmed, your test error landed in Sentry end to end: <Description> <URL>". Offer to open it, and offer to resolve the test issue as cleanup after the user opens it.
- **Check the stack trace is usable.** Readable frames carry a source-context line; minified ones show single-character function names and huge column numbers. Ignore the boilerplate first-party/third-party note. Uploading artifacts now won't repair this event (native can be reprocessed, source maps can't): re-verify on a new one.
- **Nothing after about 2 minutes:** check the DSN, that `init` runs before the error, and that the triggering code ran; run `search_events` for any recent event (wrong project or environment); keep debugging DSN, init ordering, environment and the network path.

## Core SDK options

Use the shared core sdk options guidance in [JAVASCRIPT.md](JAVASCRIPT.md#core-sdk-options). [getsentry/sentry-for-ai, SDK references]

## Filtering noise

- **Filter in the SDK first.** Inbound filters exist server-side, but client-side filtering removes the overhead of sending events you don't want.
- **`ignoreErrors`** (`Array<string | RegExp>`): strings match partially, use a regex for an exact match. It matches the message or `ExceptionType: value`.

```javascript
ignoreErrors: ["fb_xd_fragment", /^Exact Match Message$/]
```

- **`denyUrls` / `allowUrls`** (`Array<string | RegExp>`): match the source file URL of the top stack frame, not the page URL. Strings use contains, regexes use match. They apply to captured exceptions, not raw message events. Combining `allowUrls` and `denyUrls` can block subdomains of allowed domains. Example: `allowUrls: [/https?:\/\/((cdn|www)\.)?example\.com/]`.
- **Pass these to the root `Sentry.init` call, not the integration.** `eventFiltersIntegration` (default; before v11 named `InboundFilters` / `inboundFiltersIntegration`) reads `ignoreErrors`, `ignoreTransactions`, `denyUrls` and `allowUrls` from `init`. By default it ignores errors starting with `Script error` or `JavaScript error: Script error`, and `ignoreTransactions` filters typical API health check transactions. `ignoreTransactions` is deprecated and works only with `traceLifecycle: 'static'`.
- **`beforeSend` is the last chance** to drop or edit data; it runs for error and message events.

```javascript
beforeSend(event) {
  if (event.user) {
    // Don't send user's email address
    delete event.user.email;
  }
  return event;
},
```

- **Use hints for decisions.** Hints reach `beforeSend`, `beforeBreadcrumb` and `Sentry.addEventProcessor()`. Event hints: `event_id`, `originalException`, `syntheticException`, `data`. Breadcrumb hints: `event` (DOM), `level`/`input` (console), `response`/`input` (fetch), `request`/`response`/`event` (Node http), `xhr`. Set a fingerprint from the original exception:

```javascript
beforeSend(event, hint) {
  const error = hint.originalException;
  if (error && error.message && error.message.match(/database unavailable/i)) {
    event.fingerprint = ["database-unavailable"];
  }
  return event;
},
```

- **Drop breadcrumbs** with `beforeBreadcrumb`:

```javascript
beforeBreadcrumb(breadcrumb, hint) { return breadcrumb.category === "ui.click" ? null : breadcrumb; }
```

- **Drop third-party errors in the browser** with `thirdPartyErrorFilterIntegration` (browser SDKs from 8.10.0). It needs a bundler and a Sentry bundler plugin: set `applicationKey: "your-custom-application-key"` in `sentryVitePlugin`, `sentryWebpackPlugin`, `sentryEsbuildPlugin` or `sentryRollupPlugin` (Next.js: the `applicationKey` build option, Webpack and Turbopack). It does not work with the Loader Script or CDN bundles (they are detected as third party).

```javascript
Sentry.thirdPartyErrorFilterIntegration({
  filterKeys: ["your-custom-application-key"],
  behaviour: "drop-error-if-contains-third-party-frames",
}),
```

`behaviour` values: `"drop-error-if-contains-third-party-frames"`, `"drop-error-if-exclusively-contains-third-party-frames"`, `"apply-tag-if-contains-third-party-frames"`, `"apply-tag-if-exclusively-contains-third-party-frames"` (tag modes add `third_party_code: true`).

- **Spans:** change them with `beforeSendSpan`, drop them with `ignoreSpans`, decide at start with `tracesSampler`. In `ignoreSpans` use the service span op (`http.server`, `pageload`, `navigation`) so you don't match unrelated child spans.
- **`ignoreSpans`** (since `10.2.0`) takes strings, RegExps or `{name?, op?, attributes?}`. Ignoring a service span drops its children; ignoring a child reparents its children. Stream mode evaluates at span start (initial name and attributes only); transaction mode evaluates at transaction end. Use `debug: true` to see initial span names.

```javascript
Sentry.init({
  ignoreSpans: [
    // Browser connection events
    { op: /^browser\.(cache|connect|DNS)$/ },
    // Fonts
    { op: "resource.other", attributes: { "url.full": /.+\.(woff2|woff|ttf|eot)$/ } },
    // CSS files
    { op: "resource.link", attributes: { "url.full": /.+\.css.*$/ } },
    // JS files
    { op: /resource\.(link|script)/, attributes: { "url.full": /.+\.js.*$/ } },
    // Images
    { op: /resource\.(other|img)/, attributes: { "url.full": /.+\.(png|svg|jpe?g|gif|bmp|tiff?|webp|avif|heic?|ico).*$/ } },
    // Drop spans whose name contains "healthcheck"
    "healthcheck",
    // Drop spans matching name and attribute conditions
    { name: /^GET \//, attributes: { "http.route": "/api/status" } },
    // Measure spans
    { op: "measure" },
  ],
});
```

- **Errors worth sending:** expected 404s and validation rejections aren't errors. `globalHandlersIntegration` captures `onerror` and `onunhandledrejection` (both on by default).

## Inbound filters

Project Settings > Inbound Filters. They apply only at ingest, and filtered events do not consume quota.

- **Built-in filters:** browser extension errors, health check and ping transactions, legacy browsers, localhost, web crawlers, React hydration errors, ChunkLoadErrors, IP addresses, error messages, release versions, non-allowed domains.
- **Legacy browser filters were updated in December 2025.** Old ones show "Deprecated" and still work, but can't be re-enabled once turned off.
- **Web crawlers** are matched by user agent (Baidu, Yahoo, Sogou, Facebook, Alexa, Slack, Google Indexing, Pingdom, Lytics, AWS Security Scanner, Hubspot, Bytedance, generic bots). Slackbot errors are not filtered.
- **Health check globs:** `*healthcheck*`, `*health-check*`, `*heartbeat*`, `*/health`, `*/healthy`, `*/healthz`, `*/_health`, `*/[_health]`, `*/live`, `*/livez`, `*/ready`, `*/readyz`, `*/ping`, `*/up`.
- **IP filter** uses the originating client IP (forwarded IP, else direct), not the user IP in the payload; IPv4, IPv6 and CIDR.
- **Allowed Domains** checks `Origin` and `Referer`; rejections show as **Disallowed Domain** in Stats. Requests without those headers (server SDKs) are always accepted: restrict server ingestion with a project rate limit or a network allowlist.
- **Custom filters** (error message, releases, log message) need a Trial, Business or Enterprise plan and are not case-sensitive. The error message filter matches `{exception.type}: {exception.value}` (wildcards like `*ConnectionError*`) and never matches transactions. The release filter matches the full name or globs like `my-example@1.*` and never applies to events without a release. Glob syntax: `?`, `*`, `\`, reserved `[ ] { }`, `!` only inside brackets. Filters run before symbolication and deobfuscation: compare against `exception.values.raw_type`.
- **Per data type:** Session Replay honors only IP Addresses, Releases, Request URLs and User-Agents (outcomes are per segment, so Stats shows more filtered outcomes, as expected); Logs only Log Message and Releases; Application Metrics a metric name glob (e.g. `my_metric.*`) and Releases.

## Environments

- **Set `environment` in every SDK** (development, testing, staging, production). Use projects to separate services or applications, and environments to separate stages within each.
- **Naming rules:** case-sensitive; no newlines, spaces or forward slashes; not the string "None"; max 64 characters. Sentry creates the environment on the first event that carries it.
- **Environments can't be deleted, only hidden** (Project Settings > Environments > "Hide"). Hidden environments' events still count against your quota.
- **Scope:** environments are unique per organization; their settings (hiding) are per project. An issue appears under every environment any of its events carry, and the environment filter affects all issue metrics.
- **Releases vs deploys:** a release isn't tied to an environment, but a deploy must have one. Alerts can be restricted to environments.
- **Defaults differ by SDK:** JS lists `production` (the text says `development` or `production` depending on packaging); Flutter's `environment` is not set by default. Set it explicitly.

## Distributed tracing

- **Two headers carry the trace:** `sentry-trace` (trace ID, span ID, sampling decision) and `baggage` (metadata, including the sample rate). Add both to your CORS allowlist and make sure proxies, gateways and firewalls don't block or strip them, or propagation silently fails and you get two disconnected traces. With `propagateTraceparent`, `traceparent` is sent too.
- **Out of the box:** with `browserTracingIntegration`, distributed tracing works without extra setup; define `tracePropagationTargets` to get around browser CORS issues. On Next.js it works out of the box for the client, server and edge runtimes.
- **Sampling is head-based:** the originating service decides and the decision propagates downstream.
- **`tracePropagationTargets`** (`Array<string | RegExp>`, strings match by contains) controls which outgoing requests get the headers. Add your API domains. Port numbers matter: add `http://localhost:3000` for a local backend on port 3000. `[]` disables propagation. Every service involved must use Sentry for the trace to cross the whole system.

```javascript
Sentry.init({
  dsn: "https://<key>@o<orgId>.ingest.sentry.io/<projectId>",
  integrations: [Sentry.browserTracingIntegration()],
  // Capture 100% of spans. This is useful for development and debugging. Consider reducing in production or using traceSampler
  tracesSampleRate: 1.0,
  tracePropagationTargets: ["https://myproject.org", /^\/api\//],
});
```

- **The browser default disagrees between pages:** the options page says all same-origin requests are propagated by default; the automatic-instrumentation page says `['localhost', /^\/$/]`. Flutter unset means every outgoing request from the instrumented client. Set it explicitly and confirm in the current docs.
- **Server-rendered pages hand the trace to the browser** through `<meta name="sentry-trace">` and `<meta name="baggage">`, which `browserTracingIntegration` continues automatically. On Next.js 14 App Router, add trace data to the root layout metadata:

```typescript
import * as Sentry from "@sentry/nextjs";
import type { Metadata } from "next";

export function generateMetadata(): Metadata {
  return {
    // ... your existing metadata
    other: {
      ...Sentry.getTraceData(),
    },
  };
}
```

- **Trace lifetime:** in the browser a new trace starts on every page (re)load (`pageload` span) and every navigation (`navigation` span); later spans stay in that trace until the next one. Server SDKs continue a trace when the request carries a trace header, else start one that lasts until the response is sent.
- **Propagate by hand over non-HTTP channels** such as WebSockets:

```javascript
// Extract trace data from the current scope
const traceData = Sentry.getTraceData();
const sentryTraceHeader = traceData["sentry-trace"];
const sentryBaggageHeader = traceData["baggage"];

// Add to your custom request (example using WebSocket)
webSocket.send(
  JSON.stringify({
    message: "Your data here",
    metadata: {
      sentryTrace: sentryTraceHeader,
      baggage: sentryBaggageHeader,
    },
  }),
);
```

- **Public APIs: set `strictTraceContinuation: true`** (since v10) so only traces from your own Sentry organization are continued and others start a new trace, avoiding unwanted traces, extra billing and skewed performance data. The org ID is parsed from the DSN (`o<number>`); override with `orgId: 12345`.
- **Vocabulary:** a trace is every transaction and span sharing a `trace_id`. Transactions are a legacy concept replaced by service spans, entry-point spans that mark a service boundary; use Trace Explorer and the Spans dataset. In the span model, scope-level tags and data are replaced by span attributes. Transaction names can contain sensitive data.
- **Gaps in a trace:** an orphan transaction is a parentless non-originating one, when a service lacks tracing or fails to report. Items can still be missing when rate limiting or quota enforcement drops them. For clock skew, use NTP or the cloud provider's clock sync.

## PII and data scrubbing

Sensitive data includes emails, names, IPs, user IDs, request and response bodies, headers (auth tokens, cookies, session IDs), token query strings and passwords. Decide the policy early, communicate it, and enforce it in code review. Three places to scrub:

| Where | Effect | Changes |
|---|---|---|
| SDK hooks | Data is not sent | Need a redeploy |
| Server-side scrubbing | Data is not stored | Apply immediately to new events, from the UI |
| A local Relay between SDK and Sentry | Data is not sent | Configurable without deploying |

### In the SDK

Use the [JavaScript privacy schema and version boundary](JAVASCRIPT.md#datacollection); other SDKs retain their platform-specific options. [https://docs.sentry.io/platforms/javascript/configuration/options/#dataCollection]

### On the server

- **Keep server-side data scrubbing on** (it's on by default). Org-wide: Organization Settings > Security & Privacy > "DATA SCRUBBING"; per project: Project Settings > Security & Privacy. Org-wide settings override project settings. It is a backstop, not a license to log carelessly.
- **Default scrubbing** covers credit-card-like values and keys or values containing `password`, `secret`, `passwd`, `api_key`, `apikey`, `auth`, `credentials`, `mysql_pwd`, `privatekey`, `private_key`, `token`, `bearer`. "Additional Sensitive Fields" match key names and values containing the string (an entry `exp` removes the string `"Unexpected error"`).
- **Whole objects get nulled** (a `credentials` object, for example). Add the key to Safe Fields to keep the object while scrubbing its entries. Safe Fields take Advanced Data Scrubbing source syntax (`user.id`, `'sys.argv'.*`, `extra.credentials.**`). Breadcrumbs can't be excluded through Safe Fields category names.
- **Turn on "prevent storing IP addresses"** when PII matters, especially with the browser SDK. Geo info is still derived from the IP; remove it with `[Remove] [Anything] from [$user.geo.**]`.
- **Advanced rules** (they take precedence over Safe Fields) are Method + Data Type + Source.
  - Methods: Remove, Mask (`*`), Hash, Replace (default placeholder `[Filtered]`).
  - Data types: Regex Matches (no `/.../g` delimiters, `(?i)` for case-insensitive, test with the Rust dialect on regex101, "Only replace first capture match"), Credit Card Numbers, Password Fields, IP Addresses, IMEI Numbers, Email Addresses, UUIDs, PEM Keys, Auth in URLs, US social security numbers, Usernames in filepaths, MAC Addresses, Anything.
  - Sources: `**` (default event PII fields only), `$error.value`, `$message`, `extra.'My Value'`, `extra.**`, `$http.headers.x-custom-token`, `$user.ip_address`, `$frame.vars.foo`, `contexts.device.timezone`, `tags.server_name`. Keys are case-insensitive. Boolean `!`, `&&`, `||`. Wildcards `**` (all subpaths, PII fields only) and `*` (one level). Value types `$string`, `$number`, `$datetime`, `$array`, `$object`; aliases `$error`, `$stack`, `$frame`, `$http`, `$user`, `$message`, `$logentry`, `$thread`, `$breadcrumb`, `$span`, `$sdk`, `$attachments`, `$minidump`, `$binary`. Escape keys with quotes; `''` for a single quote.
  - Examples: `[Remove] [Anything] from [extra.foo]`; `[Remove] [Anything] from [exception.values.*.value]`; `[Remove] [Anything] from [logentry.formatted]`. `[Mask] [Anything] from [$frame.**]` does not scrub `filename` or `abs_path`: use `[Mask] [Anything] from [$frame.*]` or `[$frame.filename]` / `[$frame.abs_path]`.
  - Limits: non-string values are removed or nulled whatever the method; hashed or masked IPs move into the user ID; file base names can't be scrubbed server-side (use `RewriteFrames` or `beforeSend`). Logs honor the default server-side rules; advanced rules for logs choose the dataset.
- **Removing leaked data:** tag values are removed in Project Settings > Tags; single events can't be deleted, so delete the issue; a widespread leak may need deleting and re-creating the project.

### Session Replay

- **Replay is private by default:** it records DOM changes, not the screen, and redacts all text nodes and images before they leave the browser. Opt static non-PII elements in with the class `sentry-unmask`; don't opt in known user-generated content. Turn default privacy off only for static content sites known to hold no sensitive user information.
- **Keypresses are all redacted;** mouse movement records only source and target. Console logs and network metadata are scrubbed server-side for credit cards, SSNs and API tokens.
- **Legal:** the DPA covers GDPR and CCPA; a BAA covers HIPAA PHI including replay. Given US wiretapping-law lawsuits, consider starting Replay only after consent.

## Prove it

- **The DSN comes from an environment variable:** search the source for `ingest.sentry.io` or a DSN literal; there should be none outside docs and env files.
- **A real error landed:** trigger it through the real app's init path, then `search_issues` or `get_sentry_resource` returns the issue; you showed the user its `Description` and `URL`.
- **Frames are readable:** the verified issue's frames show file, line, function and a source-context line, not single-character names and huge columns.
- **`environment` is set:** the verified event carries the expected environment, and production config sets `release`, `environment` and a production sample rate.
- **Filters work:** an error matching `ignoreErrors` or `beforeSend`'s drop condition doesn't appear in `search_events`; one that shouldn't match still does.
- **Traces connect:** a frontend request to your API shows one trace with both the browser and the server spans; the API's request headers include `sentry-trace` and `baggage`.
- **Scrubbing works:** trigger an event carrying a test email, token or header and check the stored event shows `[Filtered]` or nothing. Logs and replay or screenshots are the easiest leaks; check them too.
