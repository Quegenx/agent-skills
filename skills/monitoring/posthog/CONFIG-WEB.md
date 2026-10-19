# Web SDK configuration

`posthog.init(token, config?, name?)` takes a `Partial<PostHogConfig>` and returns the instance; `posthog.set_config(config)` changes options later without re-initializing. The option that decides most defaults is `defaults`: a date naming a configuration snapshot. `'unset'` gives legacy behavior; with a date, every option you don't set explicitly takes that snapshot's value. The full option list is `https://posthog.com/docs/libraries/js/config`. Setup per framework is in [SETUP-WEB.md](SETUP-WEB.md); consent, cookieless mode and the proxy options in context are in [PROXY-AND-PRIVACY.md](PROXY-AND-PRIVACY.md).

## `defaults` snapshots

| Value | Adds |
|---|---|
| `'unset'` | Legacy behavior |
| `'2025-05-24'` | `capture_pageview: 'history_change'` |
| `'2025-11-30'` | `session_recording.strictMinimumDuration`, `rageclick.content_ignorelist` |
| `'2026-01-30'` | `external_scripts_inject_target: 'head'` (avoids SSR hydration errors) |
| `'2026-05-30'` | `persistence_save_debounce_ms: 250`, `split_storage: true`, `detect_google_search_app: true`, expanded rageclick defaults |
| `'2026-06-25'` | `session_recording.streamNetworkBody: true` |
| `'2026-08-29'` | `cookieWinsOnConflict: true` |
| `'2026-08-30'` | `session_recording.captureJsonLd: true` |

Each snapshot includes the earlier ones' changes. An option you set explicitly overrides the snapshot. The framework docs currently use `'2026-05-30'`; the example apps use older dates ([SETUP-WEB.md](SETUP-WEB.md#conflicts-between-sources)).

## Core options

| Option | Default | Notes |
|---|---|---|
| `api_host` | `https://us.i.posthog.com` | EU: `https://eu.i.posthog.com`; a proxy URL or relative path like `/ingest` when proxying |
| `ui_host` | | The app host (`https://us.posthog.com`, `https://eu.posthog.com`); set it whenever `api_host` is a proxy, or the toolbar and recordings player break |
| `flags_api_host` | | A separate reverse proxy host for flag requests, so blocking analytics doesn't block flags |
| `asset_host` | | Serves `/static/*` only |
| `rewriteRequestPath` | | `(url: URL) => URL`, posthog-js 1.416.0+, for custom proxy paths; doesn't replace the host options. The docs example maps `/i/v0/e/` to `/a1/`, `/e/` to `/a2/`, `/s/` to `/a3/`, `/flags/` to `/a4/`, and on the asset host `/array/` to `/a5/` and `/static/` to `/a6/` |
| `strict_script_versioning` | `'fallback'` | `true` is recommended when your proxy or CDN serves versioned `/static/*` |
| `external_scripts_inject_target` | `'body'` (`'head'` from `2026-01-30`) | Use `'head'` for Next.js, TanStack Router and React SSR hydration errors |
| `autocapture` | `true` | |
| `capture_pageview` | `true` (on page load) | `'history_change'` from `2025-05-24`, for SPAs |
| `capture_pageleave` | `'if_capture_pageview'` | |
| `capture_dead_clicks` | `true` (config table) | The autocapture page says to enable dead clicks in settings or config; the two pages differ |
| `capture_exceptions` | | Exception autocapture ([ERROR-TRACKING.md](ERROR-TRACKING.md)) |
| `capture_heatmaps` | | Replaces deprecated `enable_heatmaps` |
| `capture_performance` | `undefined` | Falls back to the project's remote config |
| `person_profiles` | `'identified_only'` | `'always'`, `'identified_only'` (recommended), `'never'` ([EVENTS.md](EVENTS.md)) |
| `reuseAnonymousId` | | `identify` doesn't send `$anon_distinct_id` |
| `bootstrap` | `{}` | Seeds `distinctID`, `isIdentifiedID`, `sessionID`, `featureFlags`, `featureFlagPayloads` |
| `tracing_headers` | | Hostnames that get `X-POSTHOG-DISTINCT-ID` and `X-POSTHOG-SESSION-ID` ([SETUP-WEB.md](SETUP-WEB.md#linking-frontend-and-backend)) |
| `session_idle_timeout_seconds` | `1800` | |
| `rate_limiting` | `{ events_per_second: 10, events_burst_limit: events_per_second * 10 }` | |
| `rageclick` | `threshold_px` 30, `click_count` 3, `timeout_ms` 1000 | Also `content_ignorelist` (max 10 items), `ignore_text_selection` |
| `mask_all_text`, `mask_all_element_attributes` | `false` | |
| `property_denylist` | | |
| `respect_dnt` | `false` | Do Not Track is deprecated; best effort |
| `opt_out_useragent_filter` | | Sets `$browser_type` to bot or browser instead of dropping bots |
| `custom_blocked_useragents` | | For example `['<user_agent_string>']`; Lighthouse (Ahrefs, Semrush) isn't blocked by default |
| `custom_campaign_params`, `secure_cookie` | | |
| `remote_config_refresh_interval_ms` | `300000` (5 min) | `0` disables |
| `on_request_error` | | |
| `debug` | | Development only, through env vars |
| `loaded` | | `(posthog) => {}` callback after load; identify an already signed-in user here |
| `fetch_options` | | `cache` and `next_options` for the Next.js fetch cache ("tricky"; [SETUP-NEXTJS.md](SETUP-NEXTJS.md#fetch-cache)) |

Consent, persistence and cookie options (`opt_out_capturing_by_default`, `cookieless_mode`, `persistence`, `cross_subdomain_cookie`, `cookie_expiration`) are under [Persistence and cookies](#persistence-and-cookies) and in [PROXY-AND-PRIVACY.md](PROXY-AND-PRIVACY.md).

### Feature flag options

Details in [FEATURE-FLAGS.md](FEATURE-FLAGS.md).

| Option | Default | Notes |
|---|---|---|
| `feature_flag_request_timeout_ms` | `3000` | |
| `flag_keys` | | Scopes evaluation, for example `['checkout-flow', 'new-dashboard']` |
| `evaluation_contexts` | | posthog-js 1.331.0+; legacy `evaluation_environments` (1.269.0+) |
| `feature_flag_cache_ttl_ms` | `0` | Never expires |
| `advanced_disable_flags` | | Disables `/flags`, and with it autocapture, session recording, compression, feature flags, surveys and the toolbar |
| `advanced_disable_decide` | | Legacy |
| `advanced_disable_feature_flags` | | Also disables surveys; with surveys use `advanced_only_evaluate_survey_feature_flags: true` |
| `advanced_disable_feature_flags_on_first_load` | | |
| `advanced_feature_flags_dedup_per_session` | | Dedupes `$feature_flag_called` per session (mobile SDKs already do) |

- **Narrower wording from [c15t]:** "With feature flags off, surveys that target a feature flag never show" (PostHog logs a warning); for those surveys leave flags on and pass `advanced_only_evaluate_survey_feature_flags: true`, which still requests `/flags` but evaluates only survey flags. Use `advanced_disable_feature_flags: true` to stop `/flags`, not `advanced_disable_flags: true`, which also stops the remote config so session replay never starts.
- **Modules that load anyway** [c15t]: "PostHog downloads `surveys.js` whenever the remote config includes a `surveys` value, even when surveys are off in the project"; `disable_surveys: true` is the only way to skip it. While heatmaps are on, PostHog loads `dead-clicks-autocapture.js` "whatever `capture_dead_clicks` says"; turn off both. Product tours and exception autocapture load only when the project turns them on; `disable_product_tours: true` and `capture_exceptions: false` keep them off. Sizes c15t measured (brotli, posthog-js 1.436.1): `surveys.js` about 29 KB, `product-tours.js` about 36 KB, `dead-clicks-autocapture.js` about 8 KB, `web-vitals-with-attribution.js` and `exception-autocapture.js` about 6 KB each.

### Logs options

`captureConsoleLogs` (it may forward passwords or tokens written to the console), `serviceName` (default `'unknown_service'`), `environment`, `serviceVersion`, `resourceAttributes`, `flushIntervalMs` (3000), `maxBufferSize` (100), `maxLogsPerInterval` (1000). Send a log with `posthog.captureLog({ body: 'checkout completed', level: 'info', attributes: { order_id: 'ord_789', amount_cents: 4999 } })`.

## Autocapture

- **On the web it captures** pageviews, pageleaves, clicks, input changes and form submissions on `a`, `button`, `form`, `input`, `select`, `textarea` and `label`.
- **From `<input>` only the `name`, `id` and `class` attributes are collected.** Exclude an element with the `ph-no-capture` class.

## `before_send`

- **Amends, filters, samples or rejects events** before they leave the browser (posthog-js 1.187.0+, JavaScript Web SDK only). Return `null` to drop an event; for example, null out `$current_url`, or in development log and return `null` so nothing is sent.
- **Only modify or sample your own custom events.** Core features may need 100% of unmodified events; sampling `$pageview` or `$pageleave` breaks web analytics.
- **Built-in samplers** from `posthog-js/customizations`: `sampleByEvent(['$dead_click', '$web_vitals'], 0.5)`, `sampleByDistinctId(0.4)`, `sampleBySessionId(0.25)`. With the snippet, use `posthogCustomizations.*` from `https://us.i.posthog.com/static/customizations.full.js`. Chain them with an array:

```typescript
posthog.init('<ph_project_token>', {
  before_send: [
    sampleByDistinctId(0.5), // only half of people
    sampleByEvent(['$web_vitals'], 0.1), // and they capture all events except 10% of web vitals
    sampleByEvent(['$$heatmap'], 0.5), // and 50% of heatmaps
  ]
})
```

## Persistence and cookies

- **What the browser stores:** `distinct_id`, session ID, device ID, active flags, super properties and some config.
- **`persistence` default `"localStorage+cookie"`:** full state in `localStorage`, the identity and session subset in a first-party cookie `ph_<project_token>_posthog` that expires after `cookie_expiration` (`365` days). Other values: `"cookie"`, `"localStorage"`, `"sessionStorage"`, `"memory"` (lives as long as the page view).
- **Across subdomains:** `cross_subdomain_cookie` defaults to `true`. `localStorage` and `sessionStorage` don't cross subdomains. `cookieWinsOnConflict: true` (posthog-js 1.418.0+, `localStorage+cookie` only, on by default from `defaults: '2026-08-29'`; it replaces the deprecated `__preview_cookie_wins_on_conflict`) makes the shared cookie authoritative over stale per-origin `localStorage`, syncing identity, session, replay sampling state, person-processing state and `cookie_persisted_properties`.
- **Share super properties across subdomains** with `cookie_persisted_properties: ['user_preferences', 'signup_source']` plus `posthog.register(...)` and `posthog.get_property(...)`. Cookies hold about 4KB; large values truncate or cause `431 Request Header Fields Too Large`, as do many flags in a cookie (use `localStorage+cookie`).
- **Cross-site iframes** treat the cookie as third party: pass the ID from the parent and `identify` or bootstrap. **Browser extensions** use `localStorage`, `sessionStorage` or `memory` and supply their own shared `distinct_id`.
- **`disable_persistence: true`** stores nothing: a new anonymous ID on every page load unless bootstrapped with a stable one.
- **Analytics storage and consent storage are separate:** `persistence` for one, `opt_out_capturing_persistence_type` (default `localStorage`) for the other. Shared identity is not shared consent ([PROXY-AND-PRIVACY.md](PROXY-AND-PRIVACY.md#consent)).

## Runtime calls

- **Sending on unload:** `posthog.capture("user_clicked_reload", { button: "reload" }, { transport: "sendBeacon", send_instantly: true })`. `transport` only picks the network transport (with `request_batching` events are still batched); `send_instantly: true` sends at once. The browser SDK has no public `flush()` for custom events.
- **`posthog.shutdown()`** flushes the queues and always resolves in the browser (the timeout argument is ignored); safe in isomorphic teardown (`await posthog.shutdown()`).
- **Debugging:** `debug: true` in config, `posthog.debug()`, or the URL parameter `?__posthog_debug=true`. To use the instance from the console, right-click the `[PostHog.js] Starting in debug mode` log and choose "Store as global variable".
- **Informational IDs:** `posthog.get_session_id()` (for information only), `posthog.getPageViewId()`, `posthog.onSessionId((sessionId, windowId) => ...)` (called immediately when a session exists; use it to sync with a backend session).
- **`posthog.push(['register', { a: 'b' }])`** is only for external integrations.
- **`posthog.setInternalOrTestUser()`** sets the `$internal_or_test_user` person property (and enables person processing); or set `internal_or_test_user_hostname: 'localhost'` in config.

## Prove it

- **`defaults` is set** to a date from the table, and you know what that date changes for the options you didn't set.
- **`ui_host` is set** whenever `api_host` is a proxy: the toolbar launches and recordings play.
- **`before_send` leaves PostHog's own events alone:** it modifies or samples only your custom events, never `$pageview` or `$pageleave`.
- **Persistence:** in DevTools, the `ph_<project_token>_posthog` cookie exists with `localStorage+cookie`, and nothing PostHog-related is stored with `memory` or cookieless mode.
