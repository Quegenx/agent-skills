# Server setup

`posthog-node` sends events, evaluates feature flags, captures exceptions and records spans from a Node.js server, a serverless function or a Cloudflare Worker. It queues calls and flushes them in batches in the background, so short-lived runtimes need an explicit flush, an immediate capture or a shutdown to send what they queued, and backend events need a `distinctId` that matches the ID the frontend passes to `posthog.identify()`. The browser SDK is [SETUP-WEB.md](SETUP-WEB.md), mobile SDKs are [SETUP-MOBILE.md](SETUP-MOBILE.md), event naming and identity rules are [EVENTS.md](EVENTS.md), flags in depth are [FEATURE-FLAGS.md](FEATURE-FLAGS.md) and exceptions are [ERROR-TRACKING.md](ERROR-TRACKING.md). Vendor-neutral OpenTelemetry is the `observability` skill ([observability SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/SKILL.md)).

**Contents:** [How it works](#how-it-works) · [Install and initialize](#install-and-initialize) · [Options](#options) · [Shutdown, flush and short-lived processes](#shutdown-flush-and-short-lived-processes) · [Capturing events](#capturing-events) · [Super properties and contexts](#super-properties-and-contexts) · [Express request context](#express-request-context) · [Server and client capture together](#server-and-client-capture-together) · [Feature flags and local evaluation keys](#feature-flags-and-local-evaluation-keys) · [Groups](#groups) · [Error tracking](#error-tracking) · [Distributed tracing](TRACING.md#distributed-tracing) · [Next.js server code](#nextjs-server-code) · [Cloudflare Workers](#cloudflare-workers) · [API reference](#api-reference) · [Example app](#example-app) · [Debugging and upgrades](#debugging-and-upgrades) · [Prove it](#prove-it)

## How it works

- **Node.js 20+.** `posthog-node` uses an internal queue so calls are fast and non-blocking; it batches requests and flushes asynchronously. It supports feature flags too.
- **Identifying users is required.** Backend events need a `distinct_id` matching the ID the frontend uses in `posthog.identify()`. Without it, backend events are orphaned and cannot link to frontend events, session replays, LLM traces or error tracking.
- **Events are identified by default** and create person profiles. For anonymous events without a person profile, set `properties: { $process_person_profile: false }`.
- **GeoIP is off by default since posthog-node v3.0.** Before v3.0 GeoIP properties were added to all events from the server's IP, which gives the wrong location. Now the server IP is ignored, no GeoIP properties are added and they aren't used for flag evaluation. Re-enable with `disableGeoip: false`.
- **The SDK does not throw for background work.** Hook errors with `client.on("error", ...)`.
- **Never hardcode the project token or keys;** use environment variables.

## Install and initialize

```bash
npm install posthog-node --save
yarn add posthog-node
pnpm add posthog-node
bun add posthog-node
```

Set the project token before making any calls:

```javascript
import { PostHog } from 'posthog-node'

const client = new PostHog(
    '<ph_project_token>',
    { host: 'https://us.i.posthog.com' }
)

await client.shutdown()
```

- **Token and host** are on the project settings page (`https://app.posthog.com/project/settings`).
- **The API reference names the constructor** `PostHog(apiKey: string, options?: PostHogOptions)`; its examples use the class name `PostHogBackendClient` and host `https://app.posthog.com`, while the library guide imports `PostHog` and uses `https://us.i.posthog.com`.

## Options

| Option | Default | What it does |
|---|---|---|
| `host` | `https://us.i.posthog.com/` | PostHog host |
| `flushAt` | `20` | Capture calls before flushing the queue (one batch) |
| `flushInterval` | `5000` | Milliseconds before flushing the queue |
| `maxBatchSize` | `100` | Max queued events in one batch; cannot be lower than `flushAt` |
| `maxQueueSize` | `10000` | Max events held in the queue; when full, the oldest events are dropped |
| `secretKey` | `null` | Key for local flag evaluation (5.40.0+); providing it starts polling the flags service even if you don't use flags, unless `enableLocalEvaluation: false` |
| `personalApiKey` | `null` | Deprecated alias of `secretKey` (see the key note below) |
| `featureFlagsPollingInterval` | `30000` | Milliseconds between flag-definition fetches for local evaluation; minimum `100` |
| `enableLocalEvaluation` | `true` | `false` stops polling even with a key set |
| `featureFlagsRequestTimeoutMs` | `3000` | Flag request timeout |
| `requestTimeout` | `10000` | Timeout in ms for any call |
| `fetchRetryCount` | `3` | Retries for a failed request |
| `fetchRetryDelay` | `3000` | Milliseconds between retries |
| `maxCacheSize` | `50000` | Max cache size deduplicating `$feature_flag_called` per user |
| `disableGeoip` | `true` | Disables automatic GeoIP resolution for events and flags |
| `disabled` | `false` | Sends no data; useful for local environments |
| `isServer` | `true` | Controls the `$is_server` event property; keep it server-side, set `false` for a client-like runtime, CLI or desktop app so device OS attribution is handled normally |
| `evaluationContexts` | `undefined` | Tags limiting which flags are evaluated (only matching-tag or untagged flags returned); 5.23.0+. Legacy `evaluationEnvironments` (5.10.0+) still supported |
| `traces` | unset | Turns on distributed tracing (see below) |
| `enableExceptionAutocapture` | not stated | Used by the example app to autocapture exceptions; also a context key |

```javascript
const client = new PostHog('<ph_project_token>', {
    host: 'https://us.i.posthog.com',
    featureFlagsRequestTimeoutMs: 3000, // Time in milliseconds. Defaults to 3000 (3 seconds).
})
```

## Shutdown, flush and short-lived processes

- **`shutdown()` once, before the process exits:** it stops pending pollers and flushes remaining events (`shutdown(shutdownTimeoutMs?)`, default `30000` ms). Don't keep using the instance after calling it, and don't call it after each request on a reused client: use `flush()` for per-request cleanup. Completion doesn't guarantee PostHog received the events.

```node
// shutdown before process exit
process.on('SIGINT', async () => {
  await posthog.shutdown()
  process.exit(0)
})
```

- **Serverless (AWS Lambda, Vercel Functions), shared client:** create the client outside the handler and `await client.flush()` before returning (in `finally`), catching and logging flush failures. `flush()` has no overall timeout, so race it against the remaining time (the docs example reserves 100 ms using `context.getRemainingTimeInMillis()`). The container is reused across invocations, so `shutdown()` would throw away the connection pool and the flag cache; events and spans flush concurrently, one round trip.

```typescript
export const handler = async () => {
  await posthog.withSpan('handler', () => doWork())
  await posthog.flush()
}
```

- **Serverless, disposable per-invocation client:** await `shutdown()` at the end. Calls queued before it are flushed together, batched into one API call.
- **`captureImmediate` waits for one event's delivery attempt:** `await client.captureImmediate({...})` guarantees the HTTP request finishes before the function continues or shuts down.
- **Sources disagree on `flushAt: 1` and `flushInterval: 0`.** The Node guide recommends three things for AWS Lambda and Vercel Functions: `captureImmediate` instead of `capture`, `flushAt: 1` with `flushInterval: 0` so the queue flushes immediately, and an awaited `shutdown()` at the end (its options note repeats: always `await posthog.shutdown()`); Next.js server code and Cloudflare Workers use the same settings. The same guide's tracing section says a serverless handler should call `flush()`, not `shutdown()`, and the current library page says `flushInterval: 0` and `flushAt: 1` don't wait for delivery and recommends a shared client plus `flush()`, or `captureImmediate`. The guide's handler (verbatim; it notes this is also useful for shutting down a standard Node.js app):

```javascript
export const handler() {
  client.capture({
    distinctId: 'distinct_id_of_the_user',
    event: 'thing_happened'
  })

  client.capture({
    distinctId: 'distinct_id_of_the_user',
    event: 'other_thing_happened'
  })

  // So far 2 events are queued but not sent

  // Calling shutdown, flushed the queue but batched into 1 API call for maximum efficiency
  await client.shutdown()
}
```

- **Short-lived AI captures:** `captureAiImmediate(props)` resolves after sending; use it where the runtime may freeze before a background flush.

## Capturing events

```javascript
client.capture({
    distinctId: 'distinct_id_of_the_user',
    event: 'user signed up',
})
```

- **Name events `[object] [verb]`:** `project created`, `user signed up`, `invite sent`. Naming and taxonomy are in [EVENTS.md](EVENTS.md).

```javascript
client.capture({
  distinctId: 'distinct_id_of_the_user',
  event: 'user signed up',
  properties: {
    login_type: 'email',
    is_free_trial: true,
  },
})
```

- **Backend-only pageviews:** event `$pageview` with `properties: { $current_url: 'https://example.com' }`.
- **Person properties** go in `$set` and `$set_once`:

```javascript
client.capture({
  distinctId: 'distinct_id_of_the_user',
  event: 'movie_played',
  properties: {
    $set: { name: 'Max Hedgehog'  },
    $set_once: { initial_url: '/blog' },
  },
})
```

- **Helpers instead of hand-built `$set`, `$set_once`, `$unset`:** `setPersonProperties({ distinctId, properties, propertiesOnce })` and `unsetPersonProperties({ distinctId, properties })` (`properties: ['plan', 'email']`).

```node
client.setPersonProperties({
  distinctId: 'user_123',
  properties: { plan: 'premium' },
  propertiesOnce: { first_seen: '2026-06-15' }
})
```

- **`identify({ distinctId, properties, disableGeoip })`** identifies a user and sets their properties; `identifyImmediate(...)` does it immediately and returns a `Promise<void>`. The reference's example, verbatim (the missing comma after the `$set_once` line is in the source):

```node
// Using $set and $set_once
client.identify({
  distinctId: 'user_123',
  properties: {
    $set: { name: 'John Doe', email: 'john@example.com' },
    $set_once: { first_login: new Date().toISOString() }
    $anon_distinct_id: 'anonymous_user_456'
  }
})
```

- **A webhook that merges a third-party conversion** (booking, checkout) [coreyhaines31/marketingskills, attribution]: send it after the business work, with a timeout, non-fatal on failure; check `response.ok` (fetch resolves on HTTP errors), log the booking ID and status, never the payload or email; if delivery needs retry guarantees, enqueue analytics separately with idempotency rather than replaying the booking. A 200 alone doesn't prove acceptance: the capture docs say some invalid events still return "200: OK" ([posthog.com/docs/api/capture](https://posthog.com/docs/api/capture)). Recipe: [marketing-attribution FIRST-PARTY-STITCH.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-attribution/FIRST-PARTY-STITCH.md#2c-merge-in-the-webhook).
- **Alias** when the frontend distinct ID isn't available in the backend: `client.alias({ distinctId: 'distinct_id', alias: 'alias_id' })`. The docs strongly recommend reading the alias docs first ([EVENTS.md](EVENTS.md)). `aliasImmediate(...)` returns a promise.
- **Per-capture GeoIP:** pass `disableGeoip` on the capture call. It overrides `$geoip_city_name`, `$geoip_country_name`, `$geoip_country_code`, `$geoip_continent_name`, `$geoip_continent_code`, `$geoip_postal_code`, `$geoip_time_zone`.

## Super properties and contexts

- **Super properties (posthog-node 5.25.0+)** attach to every event from the client. An event property with the same key wins. They are global for the client's lifetime; for per-request scope use contexts.

```javascript
client.register({
  app_version: '1.2.0',
  environment: 'production',
})
```

  Remove with `client.unregister('environment')`.
- **Contexts (5.17.0+)** share state across events, exceptions included, during one user's interaction, and persist across function calls. A nested context inherits its parent unless `{ fresh: true }` (the third argument). Properties passed directly to `capture` override the context. Keys: `distinctId`, `sessionId` (override per event with `properties: { $sessionId: 'next-session' }`), `properties`, `enableExceptionAutocapture`.

```javascript
posthog.withContext(
  {
    distinctId: 'user-123',
    properties: { transactionId: 'abc123' }
  },
  () => {
    // This event is captured with the distinct ID and properties set above
    posthog.capture({ event: 'order_processed' })
  }
)
```

- **`enterContext(data?, options?)`** sets context without a callback using `AsyncLocalStorage.enterWith()`; it lives until that async context ends and must be called in the same async scope that makes the PostHog calls. Called outside a request-scoped async context, it leaks context across unrelated work. Prefer `withContext()` whenever you can wrap the code in a callback (isolated scope, automatic cleanup). `getContext()` returns the current context or `undefined`.

## Express request context

posthog-node 5.31.0+:

```typescript
import express from 'express'
import { PostHog, setupExpressRequestContext, setupExpressErrorHandler } from 'posthog-node'

const app = express()
const posthog = new PostHog('<ph_project_token>', {
  host: 'https://us.i.posthog.com',
})

// Register before routes.
setupExpressRequestContext(posthog, app)

app.post('/checkout', (req, res) => {
  posthog.capture({ event: 'checkout_started' })
  res.json({ status: 'ok' })
})

// Optional: register after routes to capture Express errors.
setupExpressErrorHandler(posthog, app)
```

- **Headers read:** `x-posthog-session-id` becomes `sessionId`, `x-posthog-distinct-id` becomes `distinctId`. Added automatically: `$current_url`, `$request_method`, `$request_path`, `$user_agent`, `$ip` (from `x-forwarded-for` behind a proxy). Properties and `distinctId` passed to `capture` take precedence.
- **Tracing headers are client-controlled analytics context, not authentication or authorization.** Pass an authenticated `distinctId` explicitly for security-sensitive server-side decisions.
- **Fastify** has its own guide: `/docs/libraries/fastify.md`.

## Server and client capture together

- **One distinct ID on both sides.** Identify in the browser after login with a stable ID from your auth system, and send the same ID from the server. Without it, server events belong to nobody.
- **Send the IDs from the client with tracing headers.** posthog-js `tracing_headers: ['api.example.com']` makes browser requests to that host include `X-POSTHOG-SESSION-ID` and `X-POSTHOG-DISTINCT-ID`; use `'localhost'`, not `'localhost:3000'`, and `localhost` is not `127.0.0.1`. React Native uses `addTracingHeaders` ([SETUP-MOBILE.md](SETUP-MOBILE.md)). The server reads them with `setupExpressRequestContext` or `withContext`. Browser setup is [SETUP-WEB.md](SETUP-WEB.md).
- **Server events default to `$is_server`** (`isServer: true`); only a client-like runtime (CLI, desktop app) should set `isServer: false`.
- **Flags evaluated on the server can feed a client:** `getFeatureFlagKeysByEvaluationRuntime(runtime)` lists which flags to hand to a browser, and React Native can take server-evaluated flags with `disableRemoteFeatureFlags` and `updateFlags()` ([SETUP-MOBILE.md](SETUP-MOBILE.md)).
- **Group the products** (marketing site, web app, mobile app) in one PostHog project to follow users across platforms.

## Feature flags and local evaluation keys

Flags in depth, including local evaluation and experiments, are [FEATURE-FLAGS.md](FEATURE-FLAGS.md). The Node essentials:

- **Evaluate once per user and read from the snapshot.** `evaluateFlags()` consolidates into a single `/flags` request per incoming request.

```javascript
const flags = await client.evaluateFlags('distinct_id_of_your_user')

if (flags.isEnabled('flag-key')) {
    // Do something differently for this user
    // Optional: fetch the payload
    const matchedFlagPayload = flags.getFlagPayload('flag-key')
}
```

- **`flags.getFlag()` returns** the variant string (multivariate), `true` (enabled boolean), `false` (disabled) or `undefined` (not returned). Experiments use the same code: `flags.getFlag('experiment-feature-flag-key')`.
- **Deprecated, still working during migration:** `client.isFeatureEnabled()`, `client.getFeatureFlag()`, `client.getFeatureFlagPayload()`, `capture({ sendFeatureFlags: true })`. Prefer `evaluateFlags()`. For the deprecated `getFeatureFlag(key, distinctId, options?)` (options `groups`, `personProperties`, `groupProperties`, `onlyEvaluateLocally`, `sendFeatureFlagEvents`, `disableGeoip`), `false` is a conclusive off and `undefined` means no result (the key wasn't returned, or local-only evaluation was inconclusive).
- **Attach flags to events (server SDKs only):** `client.capture({ distinctId, event, flags })` attaches exact values with no extra `/flags` request, as `$feature/<flag-key>` plus `$active_feature_flags`. Trim with `flags: flags.onlyAccessed()` (order-dependent: before any access it attaches nothing) or `flags: flags.only(['checkout-flow', 'new-dashboard'])`. Or set the property `'$feature/feature-flag-key': 'variant-key'` yourself.
- **Scope with `flagKeys`:** `client.evaluateFlags(id, { flagKeys: ['checkout-flow', 'new-dashboard'] })` scopes local evaluation, the `/flags` request and the snapshot. Remote responses are not cached, so a key missing both locally and remotely costs one `/flags` request per call.
- **`$feature_flag_called`** is sent on `flags.isEnabled()` and `flags.getFlag()`, deduplicated per `(distinct_id, flag, value)` in a local cache (reinitializing resets it; duplicates don't affect analytics). `flags.getFlagPayload()` sends no event and doesn't count for `onlyAccessed()`.
- **Override what the server knows** with `personProperties`, `groups` and `groupProperties`. GeoIP overrides go in person properties: `$geoip_country_code`, `$geoip_country_name`, `$geoip_city_name`, `$geoip_city_confidence`, `$geoip_continent_code`, `$geoip_continent_name`, `$geoip_latitude`, `$geoip_longitude`, `$geoip_postal_code`, `$geoip_subdivision_1_code`, `$geoip_subdivision_1_name`, `$geoip_subdivision_2_code`, `$geoip_subdivision_2_name`, `$geoip_subdivision_3_code`, `$geoip_subdivision_3_name`, `$geoip_time_zone`.
- **With a context:** `await client.withContext({ distinctId: 'user_123' }, async () => { const flags = await client.evaluateFlags(); ... client.capture({ event: 'page_viewed', flags }) })`.

### Local evaluation keys

- **Local evaluation is best practice when possible:** fewer API calls, faster. Give the client a key and it polls flag definitions every `featureFlagsPollingInterval` (default `30000` ms).
- **The key option's name differs between sources:** the current library page names it `secretKey` (5.40.0+, a Personal API Key or Project Secret API Key) with `personalApiKey` as a deprecated alias; the guide's options table still calls it `personalApiKey`. Remote config flags need the secret key too.
- **A key costs requests even without flags:** providing it triggers periodic calls to the flags service. `enableLocalEvaluation: false` turns polling off.
- **Locally resolved flags make no network call** and tag `$feature_flag_called` with `locally_evaluated: true`. A key missing locally falls back to `/flags` unless `onlyEvaluateLocally` is true. Locally resolved values stay authoritative when merged. A cached inactive definition is a conclusive `false` locally; remote evaluation omits globally inactive flags (keys absent).
- **Readiness:** `isLocalEvaluationReady()`, `await waitForLocalEvaluationReady(timeoutMs)` (default `30000`). Force a reload with `await client.reloadFeatureFlags()`.
- **Distributed and edge runtimes:** cache flag definitions yourself in Redis, Cloudflare KV and similar (`/docs/feature-flags/local-evaluation/distributed-environments`).
- **Other flag methods:** `getAllFlags(distinctId, { flagKeys, groups, personProperties })`; `getAllFlagsAndPayloads(distinctId, options?)` (`result.featureFlags`, `result.featureFlagPayloads`; option `onlyEvaluateLocally: true`); `getFeatureFlagResult(key, options?)` (`result.enabled`, `result.variant`, `result.payload`, one call instead of flag plus payload); `getRemoteConfigPayload(flagKey)`; `getFeatureFlagEvaluationRuntime(key)` (from local definitions, no request; no runtime means `all`); `getFeatureFlagKeysByEvaluationRuntime(runtime)` (`all` flags are returned for both `client` and `server`; asking for `all` returns every loaded flag).
- **Tests and local dev:** `overrideFeatureFlags` takes precedence over local and remote evaluation.

```node
// Clear all overrides
client.overrideFeatureFlags(false)

// Enable a list of flags (sets them to true)
client.overrideFeatureFlags(['flag-a', 'flag-b'])

// Set specific flag values/variants
client.overrideFeatureFlags({ 'my-flag': 'variant-a', 'other-flag': true })

// Set both flags and payloads
client.overrideFeatureFlags({
  flags: { 'my-flag': 'variant-a' },
  payloads: { 'my-flag': { discount: 20 } }
})
```

## Groups

```javascript
client.groupIdentify({
  groupType: 'company',
  groupKey: 'company_id_in_your_db',
  properties: {
    name: 'Awesome Inc',
    employees: 11,
  },
  // optional distinct ID to associate event with an existing person
  distinctId: 'xyz'
})
```

- **`name` is special:** the UI shows it; otherwise the group ID.
- **Pass a consistent `distinctId`** such as `group_identifier`. Without one it defaults to `${groupType}_${groupKey}` (for example `$company_company_id_in_your_db`), making each group a separate person.
- **Capture into a group** with `groups: { company: 'company_id_in_your_db' }`. `groupIdentifyImmediate(...)` returns a promise.

## Error tracking

Full setup is [ERROR-TRACKING.md](ERROR-TRACKING.md) (`/docs/error-tracking/installation/node.md`).

- **`captureException(error, distinctId?, additionalProperties?, uuid?, flags?)`**; `captureExceptionImmediate(error, distinctId?, additionalProperties?, flags?)` returns a promise.

```node
// Capture with additional properties
try {
  apiCall()
} catch (error) {
  client.captureException(error, 'user_123', {
    endpoint: '/api/users',
    method: 'POST',
    status_code: 500
  })
}
```

- **Express:** `setupExpressErrorHandler(posthog, app)` after routes, or your own handler (see the example app below).

## Distributed tracing

See [TRACING.md](TRACING.md#distributed-tracing).

## Next.js server code

Next.js server code (the app router server client with `flushAt: 1, flushInterval: 0` and `shutdown()`, next-auth's missing `session.user.id`, the fetch cache, `@posthog/next`) is in [SETUP-NEXTJS.md](SETUP-NEXTJS.md).

## Cloudflare Workers

- **Install `posthog-node`** and put `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` in `wrangler.jsonc` vars. Create the client with `flushAt: 1, flushInterval: 0`: batched async sends can be lost when the worker terminates. Create a new PostHog client per request.
- **Hand sends to `waitUntil`:**

```jsx
// src/index.js
import { createPostHogClient } from './posthog.js';

export default {
  async fetch(request, env, ctx) {
    const posthog = createPostHogClient(env);
    const distinctId = 'ian@posthog.com' // replace with actual user ID

    ctx.waitUntil(
      posthog.captureImmediate({
        distinctId: distinctId,
        event: 'hello_world_request',
        properties: {
          $current_url: request.url
        }
      })
    );

    const flag = await posthog.isFeatureEnabled('test_flag', distinctId) || false

    ctx.waitUntil(
      posthog.shutdown()
    );

    return new Response('Hello World! ' + flag);
  },
};
```

  The example reads the flag with `isFeatureEnabled`, which the Node guide marks deprecated in favor of `evaluateFlags()`.
- **No `nodejs_compat` needed for PostHog:** `posthog-node` has a `workerd` export. Other dependencies may need `compatibility_flags = ["nodejs_compat"]`. Error tracking needs Node.js compatibility for stack trace file system access.
- **Environment:** `process.env` is populated with `nodejs_compat` from compatibility date `2025-04-01`, or `import { env } from 'cloudflare:workers'`. React Router 7: `context.cloudflare.env.VAR_NAME`; Hono: `env.VAR_NAME`.
- **`waitUntil` by framework:** React Router 7 `context.cloudflare.ctx.waitUntil()`, Hono `c.executionCtx.waitUntil()`, raw `ctx.waitUntil()`, or `import { waitUntil } from 'cloudflare:workers'`.
- **Durable Objects with local evaluation:** set `featureFlagsPollingInterval: null` (posthog-node 5.55.0+) to stop polling timers; from compatibility date `2026-10-01` pending timers prevent idle eviction. Reload explicitly with `await posthog.reloadFeatureFlags()`, but not per request.
- **Edge tracing:** pass `parent` explicitly (see [Distributed tracing](TRACING.md#distributed-tracing)).

## API reference

Categories: Initialization, Identification, Capture, Error tracking, Privacy, Feature flags, Traces, Context. Most "other methods" examples in the reference are generated stubs.

| Method | Notes |
|---|---|
| `debug(enabled?)` | `client.debug(true)` / `client.debug(false)` |
| `getLibraryId()`, `getLibraryVersion()`, `getCustomUserAgent()` | The user agent reads like `"posthog-node/5.7.0"` |
| `getPersistedProperty(key)`, `setPersistedProperty(key, value \| null)` | Memory storage (for example `'userId'`, `'sessionId'`); `null` removes |
| `capture(props)`, `captureImmediate(props)` | Queued, or awaited |
| `captureAi(props)`, `captureAiImmediate(props)` | Beta, dedicated AI endpoint; size cap, batching and endpoint may change without notice; delivery async; no redaction or truncation applied |
| `identify`, `identifyImmediate`, `alias`, `aliasImmediate`, `groupIdentify`, `groupIdentifyImmediate` | Person and group calls |
| `setPersonProperties`, `unsetPersonProperties` | Person property helpers |
| `register(properties)`, `unregister(property)` | Super properties |
| `withContext`, `enterContext`, `getContext` | Request context |
| `flush()`, `shutdown(shutdownTimeoutMs?)` | Per-request flush, once-per-process shutdown |
| `on(event, cb)` | Returns `() => void` |
| `optIn()`, `optOut()`, `enable()`, `disable()` | Privacy opt-in and opt-out |
| `getSurveysStateless()` | Surveys |
| `prepareEventMessage(props)`, `fetch(url, options)` | Internals exposed on the client |

AI observability combines `posthog-node` with `@posthog/ai` (OpenAI, Vercel AI SDK).

## Example app

PostHog's reference Express Todo API (`https://github.com/PostHog/context-mill`, path `example-apps/javascript-node`) shows `capture()` on each route, `identify()` on write actions, flag gating (with the deprecated `isFeatureEnabled()`), `captureException()` plus `enableExceptionAutocapture`, and graceful shutdown. Its events use snake_case (`todo_added`, `todos_viewed`, `todo_completed`, `todo_deleted`, `stats_viewed`) where the Node guide recommends `[object] [verb]` with spaces.

```
# PostHog Configuration
POSTHOG_PROJECT_TOKEN=phc_your_project_token_here
POSTHOG_HOST=https://us.i.posthog.com

# Optional: Enable debug mode to see PostHog requests
# POSTHOG_DEBUG=true
```

A missing token returns `null` and the app keeps working:

```js
function initializePosthog() {
  const projectToken = process.env.POSTHOG_PROJECT_TOKEN;

  if (!projectToken) {
    console.log('WARNING: PostHog not configured (POSTHOG_PROJECT_TOKEN not set)');
    console.log('         App will work but analytics won\'t be tracked');
    return null;
  }

  const client = new PostHog(projectToken, {
    host: process.env.POSTHOG_HOST || 'https://us.i.posthog.com',
    enableExceptionAutocapture: true,
  });

  if (process.env.POSTHOG_DEBUG === 'true') {
    client.debug();
  }

  return client;
}
```

```js
app.use((err, req, res, _next) => {
  const userId = req.body?.user_id || req.query?.user_id || 'anonymous';

  if (posthog) {
    posthog.captureException(err, userId);
  }

  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});
```

```js
async function shutdown() {
  console.log('\nShutting down...');
  server.close();
  if (posthog) {
    await posthog.shutdown();
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
```

The example falls back to the distinct ID `'anonymous'`; the Next.js guide says never to use shared literals like `"anonymous"` or `"user"` as distinct IDs ([EVENTS.md](EVENTS.md)).

## Debugging and upgrades

- **Verbose logs:** `client.debug()`. **Background errors:** `client.on("error", (err) => { console.error("PostHog had an error!", err) })`.
- **V1 to V2:** rewritten in TypeScript on the shared JS core; minimum PostHog version 1.38; the optional `callback` last argument is gone; `isFeatureEnabled` and `getFeatureFlag` signatures changed. Changelog: `https://github.com/PostHog/posthog-js/blob/main/packages/node/CHANGELOG.md`.

## Prove it

- **Events arrive with the right person:** a server event for a signed-in user shows the same distinct ID as that user's browser events, not `undefined`, `'anonymous'` or `${groupType}_${groupKey}`.
- **Short-lived code delivers:** in a Lambda, Vercel Function or Worker, each invocation awaits `flush()`, `captureImmediate` or `shutdown()` (Workers inside `waitUntil`), and the event shows up after the function returns.
- **Long-running servers shut down once:** `shutdown()` runs on `SIGINT` and `SIGTERM`, never per request.
- **Errors surface:** `client.on("error", ...)` is registered, and `client.debug()` shows the batch requests in development.
- **Local evaluation is really local:** `waitForLocalEvaluationReady()` resolves `true` and `$feature_flag_called` events carry `locally_evaluated: true`.
- **Flags are on events:** captured events carry `$feature/<flag-key>` from `capture({ flags })`.
- **Express context:** with `setupExpressRequestContext` registered before routes, a request carrying `x-posthog-distinct-id` produces an event with that distinct ID and `$request_path`; security decisions use the authenticated ID, not the header.
