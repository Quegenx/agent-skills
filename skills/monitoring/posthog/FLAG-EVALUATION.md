# Flag Evaluation

Where and how PostHog flag values get computed and delivered: server-side local evaluation, bootstrapping values into client SDKs so there is no flicker, payloads and remote config, evaluation contexts, the raw `/flags` API, and what each of these costs. Writing flag code per SDK, best practices and testing are [FEATURE-FLAGS.md](FEATURE-FLAGS.md); SDK install is [SETUP-WEB.md](SETUP-WEB.md); experiments are [EXPERIMENTS.md](EXPERIMENTS.md). The mechanism that decides most outcomes: the inputs. Local evaluation needs every property the release conditions use, and a bootstrapped client needs the same distinct ID, properties and contexts the server used; when an input is missing the result is `undefined`, a fallback request, or a different value.

**Contents:** [Server-side local evaluation](#server-side-local-evaluation) · [Bootstrapping and flicker](#bootstrapping-and-flicker) · [Payloads and remote config](#payloads-and-remote-config) · [Evaluation contexts and runtime](#evaluation-contexts-and-runtime) · [The /flags API](#the-flags-api) · [Costs](#costs) · [Prove it](#prove-it)

## Server-side local evaluation

- **How it works:** remote evaluation makes one billable `POST /flags` per check. Local evaluation polls `GET /flags/definitions` in the background every 30 s and evaluates in process. You must pass every property the release conditions need; otherwise the SDK falls back to a remote request or returns `undefined`. Cached definitions keep working when PostHog is unreachable; add per-flag safe defaults so even a cold start during an outage returns usable values. "It is best practice to use local evaluation flags when possible."
- **The key:** a project secret API key with the `feature_flag:read` scope (the "Local feature flag evaluation" preset), hashed at rest, up to 50 per project, shown once. It must never be used in a frontend. The `secretKey` option needs `posthog-node` 5.40.0+; older versions use `personalApiKey` (now a deprecated alias). The legacy feature flags secure API key is deprecated. Keep a personal API key if you use encrypted payloads: it is the only key that returns them decrypted. Source map uploads use separate CLI auth.

  ```javascript
  import { PostHog } from "posthog-node"

  const client = new PostHog(
      "<ph_project_token>",
      {
          host: "https://us.i.posthog.com",
          // Requires posthog-node 5.40.0+. Older versions use personalApiKey instead.
          secretKey: "<ph_personal_api_key>", // or your project secret API key
          featureFlagsPollingInterval: 30000 // Optional. Measured in milliseconds. Defaults to 30000 (30 seconds)
      }
  )
  ```

- **Evaluate once and read from the snapshot:**

  ```javascript
  const flags = await client.evaluateFlags("distinct_id_of_the_user", {
    // Include any person properties, groups, or group properties required to evaluate the flag
    personProperties: { property_name: "value" },
    groups: {
      your_group_type: "your_group_id",
      another_group_type: "another_group_id",
    },
    groupProperties: {
      your_group_type: { group_property_name: "value" },
      another_group_type: { group_property_name: "another value" },
    },
    onlyEvaluateLocally: false, // Optional. Defaults to false. Set to true if you don't want PostHog to make a server request if it can't evaluate locally.
  });

  const flagValue = flags.getFlag("flag-key");
  ```

  `await client.reloadFeatureFlags();` forces a reload of definitions.
- **Cold start:** for up to one polling interval there are no definitions and flags return `undefined`. Use per-flag defaults, `posthog.getFeatureFlag("checkout-redesign") ?? "control"`; a shared cache removes the window.
- **Version:** a flag's `version` increments on flag edits and when a referenced cohort's conditions change.
- **Not locally evaluable:** experience continuity, early access feature flags, static cohorts, the `is_not_set` operator, and "Stop evaluation at first matching condition set" (most SDKs evaluate all groups locally). The dynamic cohorts restriction does not apply to Node v2.6.0+.
- **Edge and Lambda:** creating a client per invocation loses the in-memory cache. "Do not use local evaluation in an edge or Lambda environment": use regular evaluation, a shared module-level client, or an external cache provider.

### Distributed and stateless environments

Each instance polls and is billed (the first fetch after start counts 10). An external cache provider (Node, Python, PHP, Ruby, JVM, Elixir) shares definitions:

| Deployment | Cache |
|---|---|
| Single server, or multiple workers in one process | Built-in memory |
| Multiple servers or containers | Redis or a database, with distributed locks |
| Edge workers (Cloudflare, Vercel Edge) | KV with split read/write: a cron writes, handlers read |

```typescript
interface FlagDefinitionCacheProvider {
  // Retrieve cached flag definitions
  getFlagDefinitions(): Promise<FlagDefinitionCacheData | undefined> | FlagDefinitionCacheData | undefined

  // Determine if this instance should fetch new definitions
  shouldFetchFlagDefinitions(): Promise<boolean> | boolean

  // Store definitions after a successful fetch
  onFlagDefinitionsReceived(data: FlagDefinitionCacheData): Promise<void> | void

  // Clean up resources on shutdown
  shutdown(): Promise<void> | void
}
```

- **Wiring:** `import { FlagDefinitionCacheProvider, FlagDefinitionCacheData } from 'posthog-node'`; the data shape is `{ flags, group_type_mapping, cohorts }`; init with `new PostHog("<ph_project_token>", { secretKey, enableLocalEvaluation: true, flagDefinitionCacheProvider: cache })`. Provider errors are caught and logged.
- **Lock pattern:** one instance owns the lock for its lifetime, refreshes the TTL each cycle, releases on shutdown only if it is the owner, and lets locks expire on a crash.
- **Examples:** Cloudflare KV in the posthog-js repo at `examples/example-cloudflare-kv-cache`. With Durable Objects a shared cache doesn't remove the polling timer.

## Bootstrapping and flicker

- **Why:** fetching flags "takes about 100-500ms", during which a flag reads as disabled: the flicker. Bootstrapping makes precomputed values available at client SDK init, which prevents flicker and lets startup logic (redirects) run before the first `/flags` request. The alternative is hiding the element until flags load. Available in JavaScript web, React Native, iOS, Android and Flutter.
- **Server flow:** get or create the client's distinct ID; call `getAllFlags()` (or `getAllFlagsAndPayloads()` for payloads) in posthog-node, ideally with local evaluation; include the flags and distinct ID in the rendered response; pass them to `bootstrap`. Use the same distinct ID, and consistent person and group properties and evaluation contexts, on server and client:

  ```javascript
  posthog.init('<ph_project_token>', {
      api_host: 'https://us.i.posthog.com',
      defaults: '2026-05-30',
      bootstrap: {
          distinctID: 'distinct_id_used_on_the_server',
          isIdentifiedID: true,
          featureFlags: serverEvaluatedFlags,
      },
  })
  ```

- **Web values and payloads:** `bootstrap: { featureFlags: { 'new-checkout': true, 'checkout-variant': 'test' }, featureFlagPayloads: { 'checkout-variant': { buttonText: 'Try the new checkout' } } }`. **React Native:** `PostHogProvider options={{ host, bootstrap: { featureFlags: {...} } }}`. **Flutter** (assign before `setup()`; needs Flutter SDK 5.31.0+, iOS 3.66.0+, Android 3.55.0+):

  ```dart
  final config = PostHogConfig('<ph_project_token>');
  config.host = 'https://us.i.posthog.com';
  config.bootstrap = PostHogBootstrapConfig(
    featureFlags: {
      'new-checkout': true,
      'checkout-variant': 'test',
    },
  );
  await Posthog().setup(config);
  ```

  On Flutter web `bootstrap` isn't applied: configure it in posthog-js `posthog.init({...})`.
- **Lifecycle:** bootstrapped values are served immediately; the next complete `/flags` response replaces the whole set (bootstrap-only keys are removed); a partial or errored response updates only the computed flags; `reset()` clears bootstrapped flags; with automatic flag requests disabled, use `updateFlags()`. Only enabled flags are seeded (`true` or a non-empty string); `false` and empty values are dropped. Flag values must be JSON-serializable.
- **Identity keys:** JS web `distinctID`, `isIdentifiedID`, `sessionID`; React Native, iOS, Android and Flutter `distinctId`, `isIdentifiedId`. Only JS web can bootstrap a session ID. Set `isIdentifiedID: true` for signed-in IDs (no prior `$identify` needed).
- **Reconciliation with persisted identity:** none persisted, the bootstrapped one is used (no `$identify`); an anonymous one exists and differs, `identify()` emits `$identify`; a different identified one exists, it is kept with a warning (call `reset()` before init to switch users). If identity arrives asynchronously, call `identify()` instead. On mobile, bootstrapped identity doesn't overwrite persisted identity, and persisted flags take precedence over bootstrapped ones.
- **Session ID (web):** from `posthog.get_session_id()`; it must be a valid UUID v7, unique to the person, timestamped no later than the session's first event and at most 24 h before its last.
- **SPAs and Next.js `instrumentation-client`:** init runs once and its values stay fixed for the session, so bootstrapping only works if flags are evaluated before the app renders (on the server). Otherwise evaluate on the server and pass the value in, or evaluate earlier (an earlier page or state) and reuse it, with the same `distinct_id` on client and server.
- **Persistent overrides:** Node `posthog.overrideFeatureFlags({ 'new-checkout': true })`; web `posthog.featureFlags.overrideFeatureFlags({ flags: {...}, payloads: {...} })`.

## Payloads and remote config

- **Payloads** come with the same evaluation result: `getFeatureFlagResult(key)?.payload` (web, React Native, Flutter), `flags.getFlagPayload(key)` (Node), `useFeatureFlagPayload` paired with an exposure hook (React). `flags.getFlagPayload()` and `useFeatureFlagPayload` don't send `$feature_flag_called`.
- **Remote config flags** are single-variant flags that return the same payload everywhere, rolled out to 100% by default. Read on the client with `posthog.getFeatureFlagPayload('landing-page-config')` (via `/flags` with the project token); on the server with `const config = await client.getRemoteConfigPayload("landing-page-config")` (returns `JsonType`).
- **Encrypted payloads** are excluded from `/flags`, server-only, and decrypted only with a personal API key; secret API keys return them redacted.
- **A secret key enables local evaluation by default** in posthog-node; turn it off with `enableLocalEvaluation: false`.

## Evaluation contexts and runtime

- **Contexts are tags on the flag** (per-flag UI section, max 50 contexts of 255 characters each). The SDK must declare matching contexts: web `evaluation_contexts: ['main-app', 'web', 'checkout']` (1.331.0+), Node `evaluationContexts` (5.23.0+; legacy `evaluationEnvironments` 5.10.0+), React Native `evaluationContexts` (4.21.0+). A flag with no contexts always evaluates; otherwise at least one must match. The most common issue is an SDK not configured with contexts.
- **Local evaluation filters by context** in Node.js 5.51.4+; the definitions payload isn't reduced.
- **Runtime** (client, server or all) is separate and auto-detected from the request; contexts and runtime are sequential filters. Narrow a flag that only the server reads to server runtime.

## The /flags API

- **Request:** `POST https://us.i.posthog.com/flags?v=2` with `distinct_id`, optional `groups` (only for group-based flags, e.g. `company: "Twitter"`), `person_properties`, `group_properties`, and `evaluation_contexts: ["production", "web"]` (legacy `evaluation_environments` still accepted). `&config=true` adds PostHog config for client SDK init. The project token field is `"token"` in the API reference and `"api_key"` in the adding-flag-code page; confirm in the current docs.
- **Response:** `flags.<key>` with `key`, `enabled`, `variant`, `reason { code, condition_index, description }` (codes such as `condition_match`, `no_condition_match`), `metadata { id, version, payload }`; top-level `errorsWhileComputingFlags` and `requestId`. `errorsWhileComputingFlags: true` means some flags weren't computed (for example in an incident) and allows partial updates. With `config=true` it adds `config`, `toolbarParams`, `isAuthenticated`, `supportedCompression` (`gzip`, `lz64`).
- **Runtime detection:** client User-Agent patterns `Mozilla/`, `Chrome/`, `Safari/`, `Firefox/`, `Edge/`, `posthog-android/`, `posthog-ios/`, `posthog-react-native/`, `posthog-flutter/`; server patterns `posthog-python/`, `posthog-ruby/`, `posthog-php/`, `posthog-java/`, `posthog-go/`, `posthog-node/`, `posthog-dotnet/`, `posthog-elixir/`, `python-requests/`, `curl/`. The headers `Origin`, `Referer`, `Sec-Fetch-Mode`, `Sec-Fetch-Site` indicate a client. Undetermined requests get flags with no runtime requirement and "all". A custom `"User-Agent": "posthog-node/3.0.0"` forces server.
- **GeoIP override:** header `HTTP_X_FORWARDED_FOR: <client ip>` overrides the 7 default GeoIP properties.
- **Attach a flag to an event:** `POST https://us.i.posthog.com/i/v0/e/` with `"properties": {"$feature/feature-flag-key": "variant-key"}`.
- **Manual exposure:** send `$feature_flag_called` with `$feature_flag` (the key) and `$feature_flag_response` (the variant).

## Costs

- **Billing counts `/flags` requests,** not `$feature_flag_called` events. The first 1 million requests are free.
- **What triggers a billable request:** server-side methods (`evaluateFlags()`, `getFeatureFlag()`, `getAllFlags()`, `isFeatureEnabled()`) unless resolved locally; client SDK init, `identify`, person property updates, `reloadFeatureFlags()`, group creation; survey targeting, which evaluates all active flags. So you can be charged without using flags. The client `getFeatureFlag()` reads the cache and isn't billed per call. The number of active flags doesn't change per-request cost, but a request that evaluates at least one active billable flag is billable.
- **Estimate web traffic** as `/flags` requests per pageview times monthly pageviews (2 x 150,000 is about 300,000).
- **Local evaluation:** an unchanged poll (ETag, `304 Not Modified`) counts 1 request, a poll that returns definitions counts 10. At the 30 s interval that's about `2 * 60 * 24 * 30 = 86,400` per server per month, or `864,000` without ETag. ETag support starts at Node.js 5.17.2, Python 7.13.0, Go 1.12.2, Ruby 3.4.0, PHP 3.7.3, .NET 2.4.2, Java 2.2.0. Reduce with ETag-capable SDK versions, a longer polling interval (for example 5 min) and a shared cache provider.
- **Client reductions:**

| Option | Effect |
|---|---|
| `advanced_disable_feature_flags_on_first_load: true` | No flag request on first load (`identify` still triggers one); requests made are not charged |
| `advanced_only_evaluate_survey_feature_flags: true` | Only survey flags evaluate; requests made are not charged |
| `advanced_disable_feature_flags: true` plus bootstrap | No flag requests. The cost guide says it also disables surveys; its audit snippet comment says "Disables feature flags, surveys, and session recording". Confirm in the current docs |

- **Quota limiting:** the billing limit is set at organization level and shared across projects. When exceeded, evaluations pause and SDKs return defaults (`false` for `isFeatureEnabled()`, `null` for `getFeatureFlag()`). The cost guide shows `{ "quota_limited": true, "featureFlags": {} }`; the v2 response shows `"flags": {}` with `"quotaLimited": ["feature_flags"]`. Raise the quota in billing under **Feature flags & Experiments**.
- **Find forgotten environments:** a trends insight on `$feature_flag_called` or `$identify`, Table chart, broken down by `$lib`, `$lib_version`, `$host`, `$device_name`, `$app_version`, last 30 days.

## Prove it

- On the server, `onlyEvaluateLocally: true` still returns values for your flags (they are locally evaluable and you pass every needed property), and definition polls return `304 Not Modified` between flag edits.
- No edge or Lambda handler creates a locally evaluating client per invocation; multi-instance deployments share definitions through a `flagDefinitionCacheProvider`.
- With the network slowed, the first client render already shows the bootstrapped value, and the distinct ID in the page matches the one the server evaluated with.
- The SDK declares `evaluation_contexts` / `evaluationContexts` matching every tagged flag it reads.
- The `/flags` response has no `quotaLimited` entry and `errorsWhileComputingFlags` is `false`.
- A trends insight on `$feature_flag_called` or `$identify`, broken down by `$lib`, `$lib_version` and `$host` over 30 days, shows no environment you didn't expect.
