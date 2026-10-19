# Feature Flags

PostHog feature flags turn code paths on per user, roll changes out by percentage, carry JSON payloads and back experiments (designing and reading those is [EXPERIMENTS.md](EXPERIMENTS.md); SDK install and CSP are [SETUP-WEB.md](SETUP-WEB.md); the reverse proxy is [PROXY-AND-PRIVACY.md](PROXY-AND-PRIVACY.md); local evaluation, bootstrapping, payloads, remote config, the `/flags` API and costs are [FLAG-EVALUATION.md](FLAG-EVALUATION.md); retiring flags is [FLAG-CLEANUP.md](FLAG-CLEANUP.md)). A flag is a deterministic function of its definition and the distinct ID: same flag key plus same distinct ID gives the same result. Almost every surprising result is an input problem (the wrong distinct ID, missing properties, a changed definition), then an output problem (`undefined` read as `false`, no handling of the loading gap, re-evaluating instead of recording), and only rarely an incident (check status.posthog.com).

**Contents:** [How a flag evaluates](#how-a-flag-evaluates) · [Best practices](#best-practices) · [Stable identity](#stable-identity) · [Adding flag code per SDK](#adding-flag-code-per-sdk) · [Testing flags](#testing-flags) · [Limits](#limits) · [Debugging](#debugging) · [Prove it](#prove-it)

## How a flag evaluates

- **Property targeting runs first.** If the person doesn't match the release conditions, the hash never runs and the flag returns `false`.
- **Then a SHA-1 hash places the user on a line from 0 to 1:**

  ```
  hash_key = "{flag_key}.{distinct_id}"
  position = parseInt(sha1(hash_key).slice(0, 15), 16) / LONG_SCALE  → float in [0, 1]
  in_rollout = position <= rollout_percentage / 100
  ```

  Variants use a second hash salted with `"variant"`. The flag key is in the hash, so one user gets independent assignments across flags.
- **"Pure" means deterministic given a stable definition.** The definition (rollout %, targeting rules, variants) is external state; experience continuity adds server-side persistence on top.
- **Condition sets are evaluated top to bottom, first match wins.** Raising the rollout % keeps everyone already matched; lowering it drops some.
- **Holdouts:** users in an experiment holdout get the variant `holdout-{holdout_id}` (for example `holdout-727`). Detect them by the prefix `holdout-`.

## Best practices

The production checklist, in order:

1. **Call `identify()` before evaluating flags.** It is the most common input problem. A flag evaluated before `identify()` used the anonymous ID; after it the hash input changes and the value can flip. In auth flows call `identify()` before any evaluation, or bootstrap the stable ID at init. Server SDKs don't need `identify()`.
2. **Evaluate server-side with local evaluation.** It is the recommended default: every input is explicit and the data is at hand. Client-side is right when you need browser-only properties, real-time flag changes, or have no server. See [FLAG-EVALUATION.md](FLAG-EVALUATION.md).
3. **Bootstrap client-side flags.** Client evaluation is async; bootstrapping closes the gap ([FLAG-EVALUATION.md](FLAG-EVALUATION.md)). Otherwise use `onFeatureFlags()` with a loading state (spinner, skeleton).
4. **Handle `undefined` explicitly.** It means "not evaluated yet", not `false`. The not-loaded value varies by SDK (`undefined`/`nil`/`None`, `false`, or a `defaultValue`). Check the current identity with `posthog.get_distinct_id()`; to check a flag exists, use the Feature Flags API.

   ```javascript
   // Returns undefined before flags load, not false
   if (posthog.getFeatureFlag('my-experiment') === 'test') {
     // Never runs during the loading gap
   }
   ```

5. **Evaluate once and record the result.** Rollouts re-evaluate only on meaningful user state changes; experiments need one exposure per user, with the variant recorded.
6. **Evaluate where the data lives.** If you target `plan_type: "pro"`, evaluate on your server. Client-side, set properties locally first with `setPersonPropertiesForFlags()`.
7. **Choose the evaluation context deliberately.** New flags default to "server and client" for backwards compatibility: "a safe starting point, not a recommendation". Pick by where the flag is consumed.
8. **Clean up flags that have done their job.** A flag at 100% with no property targeting is finished but keeps making billable `/flags` requests. Remove it and hardcode the winning path, or at least archive it. Stale flags are the most common source of unnecessary evaluation and cost. One idea: a "gate flag" the server reads once every 30 seconds (not per user); when `true`, skip per-user evaluation.
9. **Disable client-side evaluation for server-side flags** that the server already evaluates and passes to the frontend.
10. **Use a reverse proxy.** Ad blockers can disable flags. PostHog offers a free managed reverse proxy ([PROXY-AND-PRIVACY.md](PROXY-AND-PRIVACY.md)).
11. **Call each flag in as few places as possible.** Wrap it in one function:

    ```javascript
    function useBetaFeature() {
        return posthog.isFeatureEnabled('beta-feature')
    }
    ```

12. **Name flags clearly.** Descriptive (`is_v2_billing_dashboard_enabled` over `is_dashboard_enabled`); suffix the purpose (`new-billing-experiment`, `new-billing-release`); reflect the return type (`is_premium_user` boolean, `selected_theme` string); positive booleans (`is_premium_user`, not `is_not_premium_user`).
13. **Roll out progressively.** Start at 5 to 10% of users, monitor, then increase. PostHog itself goes developer, internal team, beta users, everyone.

- **SPA timing:** the SDK updates `distinct_id` synchronously on `identify()`, but a `capture()` called first in the same frame uses the anonymous ID. Call `identify()` before the navigation that mounts post-auth components: in React, before `navigate()`, not in a `useEffect` inside the target route.
- **Flag dependencies:** keep chains simple and never circular.
- **Don't target "Latest" person properties** (for example "Latest Current URL", "Latest Referring Domain"). They update on every event, so the flag can change with every event. Capture a stable property once instead, such as `first_landing_page` via `$set_once`.
- **Missing PostHog config must never break the app.** Read keys optionally, guard init and capture, and make the app build and boot with no PostHog env. In dev or debug fail loudly with "<VAR> variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once <VAR> is configured"; in production stay a no-op.
- **Keys and host come from env vars,** never hardcoded. Host by region: `US` is `https://us.i.posthog.com`, `EU` is `https://eu.i.posthog.com`. Don't assume US Cloud; ask. With the PostHog MCP, `projects-get` returns the project's `api_token`.
- **Agent workflow for a new flag:** detect the platform from dependency files and lockfiles and check for an existing PostHog setup; find or create the flag with the PostHog MCP (or ask the user to create it in the dashboard); plan release conditions (percentage, user targeting, group targeting); instrument with minimal targeted changes, server-side when possible to avoid UI flicker; boolean flags first unless multivariate is asked for.

## Stable identity

- **Anonymous to identified changes the hash input:** `hash("my-experiment", "anon-uuid-123") → 0.31 → "test"` but `hash("my-experiment", "user-456") → 0.72 → "control"`. For experiments that is data corruption. Prevent it with a stable ID from first touch, or a server bootstrap with the known ID.
- **Device bucketing (the recommended mitigation)** hashes `$device_id`: no database cost, supports local evaluation and bootstrapping, works with `identified_only`. It is per device only, and `$device_id` is lost when cookies are cleared.
- **Experience continuity** (`ensure_experience_continuity`, "persist flag across authentication steps") reads Postgres on every evaluation and writes on first identify. It has no local evaluation, isn't bootstrap-compatible, needs `person_profiles: 'always'` (with `identified_only` the override write fails silently), writes overrides during `/flags` requests that carry `$anon_distinct_id` (server SDKs must pass `$anon_distinct_id`), is skipped for 100% non-multivariate flags, is slower, and has known bugs where values change after `identify()` (https://github.com/PostHog/posthog-js/issues/2623). Treat it as a migration path.
- **Changing the bucketing method re-evaluates every user** and can corrupt running experiments.

| You need | Use |
|---|---|
| Same value on a single device | Stable ID or device bucketing |
| Cross-device, logged in | Target person properties (for example `plan = "enterprise"`), not the hash |
| Cross-device, anonymous | Not solvable |
| Maximum control | Server-side local evaluation with a stable ID |
| A quick fix | Device bucketing |
| Can't change the identity flow | Experience continuity |

For experiments across platforms, evaluate on the server and distribute the value by bootstrap or API response.

## Adding flag code per SDK

| SDK | Boolean | Variant | Payload | Not loaded yet | Request timeout default |
|---|---|---|---|---|---|
| Web `posthog-js` | `posthog.getFeatureFlagResult(key)?.enabled` or `posthog.isFeatureEnabled(key)` | `getFeatureFlagResult(key)?.variant` | `getFeatureFlagResult(key)?.payload` | `undefined` | `feature_flag_request_timeout_ms` 3000 |
| React `@posthog/react` | `useFeatureFlagEnabled(key)` | `useFeatureFlagVariantKey(key)` | `useFeatureFlagPayload(key)` | `undefined` unless a default is passed | |
| Node `posthog-node` | `flags.isEnabled(key)` | `flags.getFlag(key)` | `flags.getFlagPayload(key)` | `undefined` | `featureFlagsRequestTimeoutMs` 3000 |
| React Native | `useFeatureFlag(key)`, `posthog.isFeatureEnabled(key)` | `posthog.getFeatureFlag(key)` | `useFeatureFlagWithPayload`, `getFeatureFlagResult(key)?.payload` | `undefined` | `featureFlagsRequestTimeoutMs` 10000 |
| Flutter `posthog_flutter` | `result.enabled` | `result.variant` | `result.payload` | `result` can be `null` (the docs check `result != null`) | |

### Web (posthog-js)

- **SDK installation and initialization:** [SETUP-WEB.md](SETUP-WEB.md).

- **Read one result** for enabled, variant and payload from the same evaluation:

  ```javascript
  const result = posthog.getFeatureFlagResult('flag-key')
  if (result?.enabled) {
      // Optional: fetch the payload from the same evaluation result
      const matchedFlagPayload = result?.payload
  }
  ```

  Multivariate: `if (result?.variant == 'variant-key')`. The web reference also shows `posthog.isFeatureEnabled('flag-key')` for booleans.
- **Storage:** flags are kept in the persistence option (local storage by default) and are available immediately, except on a user's first visit.
- **`getAllFeatureFlags()`** returns each flag's `key`, `enabled`, `variant`, `payload` and does not send `$feature_flag_called`.
- **`onFeatureFlags(function (flags, flagVariants, { errorsLoading }) { ... })`:** `flags: string[]`, `flagVariants: Record<string, string | boolean>`, `errorsLoading` is `true` if the request timed out or errored. It fires on every reload; in React use the hooks instead.
- **`flag_keys: ['checkout-flow', 'new-dashboard']`** in `posthog.init` scopes evaluation; dependency flags may also be evaluated and returned.
- **`posthog.reloadFeatureFlags()`** refetches cached values.
- **Override properties for evaluation:** `posthog.setPersonPropertiesForFlags({...})` lasts the whole session, is additive across calls and triggers a flag reload (pass `false` as the second argument to skip it); `resetPersonPropertiesForFlags()`; `setGroupPropertiesForFlags({'company': {...}})`; `resetGroupPropertiesForFlags('company')` or `resetGroupPropertiesForFlags()`. Group properties attach to the group set via `posthog.group()` and reset when the group changes.
- **Automatic overrides:** person properties from `posthog.identify` and groups from `posthog.group()` are added to evaluation, plus GeoIP from the IP: `$geoip_city_name`, `$geoip_country_name`, `$geoip_country_code`, `$geoip_continent_name`, `$geoip_continent_code`, `$geoip_postal_code`, `$geoip_time_zone`.
- **Wrap evaluation in try/catch with fallback logic** (the docs show this pattern for web, React and React Native).

### React (@posthog/react)

- **SDK setup and provider alternatives:** [React with Vite](SETUP-WEB.md#react-with-vite).

| Hook | Sends `$feature_flag_called` | Notes |
|---|---|---|
| `useFeatureFlagEnabled` | Yes | `boolean \| undefined` while loading or absent; a default (`useFeatureFlagEnabled('flag-key', false)`) narrows it to `boolean` |
| `useFeatureFlagVariantKey` | Yes | |
| `useActiveFeatureFlags` | No | |
| `useFeatureFlagPayload` | No | Always pair it with `useFeatureFlagEnabled` or `useFeatureFlagVariantKey` so the exposure is sent |

```jsx
import { useFeatureFlagEnabled, useFeatureFlagPayload } from '@posthog/react'

function App() {
  const variant = useFeatureFlagEnabled('show-welcome-message')
  const payload = useFeatureFlagPayload('show-welcome-message')
  ...
```

- **`<PostHogFeature flag='show-welcome-message' match={true}>`:** `match` is `true` or a variant key; `fallback` renders default content; children can be a function receiving the payload; it captures view and interaction metrics automatically; it requires `PostHogProvider`; `visibilityObserverOptions` takes IntersectionObserver options (default threshold 0.1).

### Next.js

- **Client initialization and the pre-release integration:** [SETUP-NEXTJS.md](SETUP-NEXTJS.md#client).

- **`@posthog/react` hooks work automatically** with that init (they use the posthog-js singleton):

  ```javascript
  "use client";
  import { useFeatureFlagEnabled } from "@posthog/react";

  export default function FeatureComponent() {
    const showNewFeature = useFeatureFlagEnabled("new-feature");

    return showNewFeature ? <NewFeature /> : <OldFeature />;
  }
  ```

- **Server factory, Pages router, auth identity and fetch cache:** [SETUP-NEXTJS.md](SETUP-NEXTJS.md#server). Short-lived delivery is owned by [Flush or shut down](SETUP-NEXTJS.md#flush-or-shut-down); frontend context headers and CSP by [SETUP-WEB.md](SETUP-WEB.md).

### Node.js (posthog-node)

- **Node SDK setup:** [SETUP-SERVER.md](SETUP-SERVER.md). Local evaluation credentials are in [FLAG-EVALUATION.md](FLAG-EVALUATION.md).
- **Evaluate once, read from the snapshot:**

  ```javascript
  const flags = await client.evaluateFlags('distinct_id_of_your_user')

  if (flags.isEnabled('flag-key')) {
      const matchedFlagPayload = flags.getFlagPayload('flag-key')
  }
  ```

  `flags.getFlag()` returns the variant string, `true` for an enabled boolean, `false` for disabled, `undefined` when the flag wasn't returned. Limit evaluation with `evaluateFlags(id, { flagKeys: [...] })`; override inputs with `evaluateFlags(id, { personProperties, groups, groupProperties })`.
- **Deprecated during the migration:** `client.isFeatureEnabled()`, `client.getFeatureFlag()`, `client.getFeatureFlagPayload()` and `capture({ sendFeatureFlags: true })`. Prefer `evaluateFlags()`. The Node.js SDK reference still teaches those methods (with `personProperties`/`groups`/`groupProperties`) and calls `sendFeatureFlags: true` "(recommended)", and the bootstrapping and Next.js guides use `getAllFlags()`; the adding-flag-code page marks the methods deprecated. Confirm in the current docs.
- **Attach flags to server events** (needed for breakdowns; only server SDKs and the API need this): `client.capture({ distinctId, event: 'event_name', flags })` adds every flag as `$feature/<flag-key>` plus `$active_feature_flags` without another `/flags` request. Filter with `flags.onlyAccessed()` (order-dependent: called before any access it attaches nothing) or `flags.only(['checkout-flow', 'new-dashboard'])`, or set `'$feature/feature-flag-key': 'variant-key'` by hand.
- **Exposure events:** `$feature_flag_called` is sent on `flags.isEnabled()` and `flags.getFlag()`, deduplicated per `(distinct_id, flag, value)` in a local cache that resets when the client is re-created; duplicates don't affect analytics. `flags.getFlagPayload()` doesn't send it and doesn't count as an access for `onlyAccessed()`.
- **GeoIP overrides in person properties** (when there's no PostHog on the frontend, or to use the client's location instead of the server's): `$geoip_country_code`, `$geoip_country_name`, `$geoip_city_name`, `$geoip_city_confidence`, `$geoip_continent_code`, `$geoip_continent_name`, `$geoip_latitude`, `$geoip_longitude`, `$geoip_postal_code`, `$geoip_subdivision_1_code`, `$geoip_subdivision_1_name`, `$geoip_subdivision_2_code`, `$geoip_subdivision_2_name`, `$geoip_subdivision_3_code`, `$geoip_subdivision_3_name`, `$geoip_time_zone`.

### React Native and Expo

- **Expo and bare setup:** [SETUP-MOBILE.md](SETUP-MOBILE.md).

- **Hooks:** `import { useFeatureFlag } from 'posthog-react-native'` returns `undefined` while loading; `useFeatureFlagWithPayload` for payloads. The React Native reference says "Use `useFeatureFlagEnabled` for boolean flags" while its code calls `posthog.isFeatureEnabled('flag-key')` via `usePostHog()`; the adding-flag-code page uses `useFeatureFlag`. Confirm in the current docs.
- **Direct calls:** `posthog.isFeatureEnabled(key)`, `posthog.getFeatureFlag(key)` (`undefined` if not loaded or the load failed; multivariate returns a string), `posthog.getFeatureFlagResult(key)?.payload`. `getAllFeatureFlags()` doesn't send `$feature_flag_called`.
- **Loading:** flags load at instantiation and refresh when flag-affecting methods are called. `posthog.onFeatureFlags((flags) => {...})`; `reloadFeatureFlagsAsync().then(...)` or `reloadFeatureFlags()`.
- **Stale cache:** values in AsyncStorage persist indefinitely with no TTL until a successful API call, so inactive users can get a cached `false` first and fresh values after. Call `await posthog.reloadFeatureFlagsAsync()` on app start, or `posthog.reset()` to clear cached data.
- **Overrides:** `setPersonPropertiesForFlags`, `resetPersonPropertiesForFlags`, `setGroupPropertiesForFlags`, `resetGroupPropertiesForFlags()`, with the same automatic and GeoIP overrides as web.

### Flutter (posthog_flutter)

- **Install:** `posthog_flutter: ^5.24.0` in `pubspec.yaml` (bootstrapping needs 5.31.0+). Android `AndroidManifest.xml` meta-data: `com.posthog.posthog.PROJECT_TOKEN`, `com.posthog.posthog.POSTHOG_HOST`, `com.posthog.posthog.TRACK_APPLICATION_LIFECYCLE_EVENTS`, `com.posthog.posthog.DEBUG`. iOS `Info.plist`: `com.posthog.posthog.PROJECT_TOKEN`, `com.posthog.posthog.POSTHOG_HOST`, `com.posthog.posthog.CAPTURE_APPLICATION_LIFECYCLE_EVENTS`, `com.posthog.posthog.DEBUG`; Podfile `platform :ios, '13.0'`. Web: the posthog-js snippet in `web/index.html` with `defaults: '2026-05-30'`.
- **Minimum Android SDK conflict:** the Flutter reference text says 21 while its code block sets `minSdkVersion 23`. Confirm in the current docs.
- **Evaluate:**

  ```dart
  final result = await Posthog().getFeatureFlagResult('flag-key');
  if (result != null && result.enabled) {
    // Do something differently for this user
    // Optional: fetch the payload from the same evaluation result
    final matchedFlagPayload = result.payload;
  }
  ```

  Multivariate: `result.variant == 'variant-key'`. The Flutter reference also uses `await Posthog().isFeatureEnabled('flag-key')`, `await Posthog().getFeatureFlag('flag-key')` and `(await Posthog().getFeatureFlagResult('flag-key'))?.payload`.
- **`onFeatureFlags` needs manual SDK setup:** disable `com.posthog.posthog.AUTO_INIT` on Android and iOS first, then:

  ```dart
  final config = PostHogConfig('<ph_project_token>');
  config.host = 'https://us.i.posthog.com';
  config.onFeatureFlags = () async {
    if (await Posthog().isFeatureEnabled('flag-key')) {
      // do something
    }
  };
  await Posthog().setup(config);
  ```

- **Reload:** `await Posthog().reloadFeatureFlags();`

## Testing flags

- **Target yourself:** a release condition `email = your_email@domain.com` at 100% (optionally with a variant override), or `distinct_id equals`; for logged-out pages, `?utm_source=your_variant_name`.
- **Override in code:** `posthog.featureFlags.overrideFeatureFlags({ flags: {...} })` (JS web and React Native only).
- **Toolbar** (JS web only): affects only your browser; "Viewing as" evaluates for another distinct ID.
- **The flag's Testing tab,** including "Test all N distinct IDs" for merged persons.
- **MCP:** `feature-flags-test-evaluation-create` with the flag ID plus `distinct_id` or `person_id`, optional `timestamp`.
- **Test and CI runs:** stop flag traffic and stub values.
  - Web: when `process.env.NODE_ENV === 'test' || process.env.CI === 'true'`, set `advanced_disable_feature_flags: true`, bootstrap flags, `autocapture: false`, `disable_session_recording: true`.
  - React Native: `preloadFeatureFlags: false, sendFeatureFlagEvent: false, flushAt: 100, flushInterval: 120000` and `posthog.updateFlags({ 'your-flag': true })`.
  - Flutter: `config.preloadFeatureFlags = false; config.sendFeatureFlagEvents = false; config.flushAt = 100; config.flushInterval = const Duration(seconds: 120);`. "The Flutter SDK doesn't support local feature flag overrides."

## Limits

- **2,000 active flags per team;** surveys, web experiments and product tours create backing flags that count.
- **512KB filter size per flag.**
- **`in` / `not_in` operators** only for cohort properties.
- **Behavioral and lifecycle dynamic cohorts** aren't supported in flags (too slow). Duplicate the cohort as a static cohort, or `$set` a person property on the event and use `setPersonPropertiesForFlags()`. Realtime cohorts are in early beta.

## Debugging

- **Start at the person's feature flags tab** (the "match evaluation" column) to see what the flag returned for them and why.
- **Wrong value after login:** `identify()` ran after evaluation; see [Stable identity](#stable-identity).
- **Flags never load in some browsers:** ad blockers; use a reverse proxy or `flags_api_host` ([PROXY-AND-PRIVACY.md](PROXY-AND-PRIVACY.md)).
- **A property condition doesn't match:** the properties aren't ingested yet; pass them in the call (`setPersonPropertiesForFlags()`, `personProperties`).
- **Read `$feature_flag_called` values:** `false` means no condition matched (everything was evaluable); `None` or `(empty string)` means disabled, failed to load, network error or ad blocker; `None` also means not fully locally evaluable.
- **Server returns `undefined`:** a cold start, missing properties for local evaluation, or a condition that isn't locally evaluable.
- **Flags empty for everyone:** check for quota limiting in the `/flags` response.
- **A flag missing in one app:** its evaluation contexts don't match what the SDK declares, or its runtime excludes the caller.

## Prove it

- Log `posthog.get_distinct_id()` at the first flag evaluation after login: it is the identified ID, not the anonymous one.
- With the network slowed, the flagged UI renders the bootstrapped or loading state, never the wrong variant first, and no code treats `undefined` as `false`.
- Each experiment flag's events carry `$feature/<flag-key>` and a `$feature_flag_called` exposure per user.
- `feature-flags-test-evaluation-create` (or the Testing tab) returns the expected value for a test user in each condition set.
- The app builds and boots with every PostHog env var unset, and CI runs make no `/flags` requests.
