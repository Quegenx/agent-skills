# Sentry Sampling and Quotas

How much data reaches Sentry and what it costs: SDK sample rates for errors, traces, replays and profiles, the `tracesSampler` function, a sampling strategy, and the server-side controls (quotas, inbound filters, rate limits, spike protection, Delete & Discard). Core options, filtering hooks and inbound filters are in [PRACTICES.md](PRACTICES.md); per-platform sampling setup is in the platform files. The mechanism that decides most outcomes: sampling is decided once, at the head of a trace, and propagated downstream, so a service that overrides its parent's decision breaks distributed traces; and the SDK sample rate is fixed until you redeploy, while server-side controls change without a deploy.

**Contents:** [The sample-rate options](#the-sample-rate-options) · [tracesSampler](#tracessampler) · [Precedence and inheritance](#precedence-and-inheritance) · [Choosing rates](#choosing-rates) · [A sampling strategy](#a-sampling-strategy) · [Dynamic Sampling (legacy)](#dynamic-sampling-legacy) · [What counts against quota](#what-counts-against-quota) · [Reducing volume, easiest first](#reducing-volume-easiest-first) · [Rate limits](#rate-limits) · [Spike protection](#spike-protection) · [Per-category quotas](#per-category-quotas) · [Prove it](#prove-it)

## The sample-rate options

| Option | Default | What it samples |
|---|---|---|
| `sampleRate` | `1.0` | Errors, picked randomly. |
| `tracesSampleRate` | unset | Fraction 0 to 1 of traces. In stream mode sampling applies to service spans instead of transactions. |
| `tracesSampler` | unset | Function returning a rate per trace; takes precedence over `tracesSampleRate`. |
| `replaysSessionSampleRate` | | Full session replays. |
| `replaysOnErrorSampleRate` | | Replays kept when an error happens: records up to a minute before the error and continues until the session ends. |
| `profileSessionSampleRate` | `0` | Profiling, decided once per session (see [JAVASCRIPT.md](JAVASCRIPT.md#core-sdk-options)). |

- **Tracing is off unless you set one of them.** By default neither `tracesSampleRate` nor `tracesSampler` is set, so no transactions are sent. Either one must be defined to enable tracing.
- **`tracesSampleRate: 0` does not disable tracing:** it keeps tracing enabled but samples nothing, and no downstream spans are sampled. Omit the sampling config entirely to truly disable it.
- **The error sample rate limits visibility into the source of events,** and changing it requires a redeploy. A project rate limit, which only drops events when volume is high, may suit better ([Rate limits](#rate-limits)).
- **There is no `replaysSampler`.** Per-page replay needs the manual pattern in [A sampling strategy](#a-sampling-strategy).

## tracesSampler

- **Signature:** `(samplingContext: SamplingContext) => number | boolean`. Returning `true` or `false` equals `1` or `0`. `samplingContext` holds `inheritOrSampleWith`, `parentSampled`, `parentSampleRate`, `name` and `attributes` (`location` from BrowserTracing).
- **Always return the fallback through `inheritOrSampleWith`** (introduced in SDK v9). It is strongly encouraged over `parentSampled` because it allows deterministic sampling and metric extrapolation for downstream traces, keeps the frontend in sync with backend decisions, and prevents orphaned spans.
- **`name` is the initial span name,** which may be unparameterized: `GET /users/123` rather than `GET /users/:id` for `http.server`.
- **Use it to sample noise down and important paths up:**

```javascript
tracesSampler: ({ name, attributes, inheritOrSampleWith }) => {
  // Do not sample health checks ever
  if (name.includes("healthcheck")) {
    return 0;
  }
  // These are important - take a big sample
  if (name.includes("auth")) {
    return 1;
  }
  // These are less important or happen much more frequently - only take 1%
  if (name.includes("comment")) {
    return 0.01;
  }
  // Otherwise, inherit the sample sampling decision of the incoming trace, or use a fallback sampling rate.
  return inheritOrSampleWith(0.5);
},
```

- **Other documented shapes:** by environment (development `1.0`, production `0.05`, else `inheritOrSampleWith(0.2)`); by critical flow (checkout `1.0`, login `0.5`, else `inheritOrSampleWith(0.1)`); by user tier (premium `1.0`, `hasRecentErrors` `0.8`, `/api/metrics` `0.01`, default `inheritOrSampleWith(0.2)`); by feature flag (`if (attributes?.['feature_flag.new_v2_ui'] === true) return 1.0; return inheritOrSampleWith(0.05);`).
- **Health checks need no sampler:** Sentry's inbound filters drop them ([PRACTICES.md](PRACTICES.md#inbound-filters)).

## Precedence and inheritance

1. **`tracesSampler`** if defined. Avoid overriding the parent's decision in it: that breaks distributed traces.
2. **The parent's sampling decision**, carried in `sentry-trace` and `baggage`.
3. **`tracesSampleRate`.**

- **Inherit in most cases** to avoid breaking distributed traces. With `tracesSampleRate` the decision is always inherited.
- **If the root trace is dropped, everything under it is dropped,** including an AI agent run traced inside it.

## Choosing rates

- **Why sample traces:** the overhead of tracing every request, and managing event volume.
- **Start low and increase** as you learn your traffic patterns and volume. A uniform `tracesSampleRate` is the recommended starting point; use a sampling function for granular control.
- **Per environment:** locally use the full rate so verification sees a trace; in production keep an existing rate or base it on traffic, else start low. Tell the user which rate you chose.
- **Errors:** sample lightly or not at all, and filter known noise instead. **Spans:** sample aggressively with `tracesSampler`, respecting the parent decision. **Replays and profiles:** keep the asymmetric defaults (high on error, low on normal sessions).
- **The sources disagree on the production trace rate.** State the choice and confirm in the current docs:

| Source | Production `tracesSampleRate` |
|---|---|
| SDK sampling pages and the sample-rates concept page | Start low and increase |
| Sentry's tracing concept reference | Start at 5 to 20% |
| Next.js wizard | Dev `1.0`, prod `0.1` |
| Sampling-strategy blog post | Dev `1.0`, prod `0.05`, while saying production "almost always" wants 100% of traces unless you trace strategically at very high traffic |
| Dynamic Sampling page | 100% (`1.0`), but that feature is not available to new customers |
| Distributed tracing examples | `1.0` with the comment "Consider reducing in production or using traceSampler" |

- **Replay session rate also disagrees:** `0.1` in the SDK pages, a traffic table of `0.01` / `0.1` / `0.25` on the Session Replay page, `0.01` in the blog. The on-error rate is high everywhere (often `1.0`).

## A sampling strategy

Blanket sampling rates can be wasteful. 100% of everything is fine for small or new apps; at scale it hurts the signal-to-noise ratio and the network footprint. Sampling affects volume, not visibility: errors at 100% means every failure is seen, and 5% of performance data still shows slowness.

```ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  // 1. Errors: We want to capture 100% of errors.
  // 1.0 is the default, and this is usually omitted.
  sampleRate: 1.0,
  // 2. Tracing: A uniform slice of your traffic.
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.05,
  // 3. Full Replays: Great for UX audits.
  replaysSessionSampleRate: 0.01,
  // 4. Error Replays: The "Flight Recorder" that triggers on crashes.
  replaysOnErrorSampleRate: 1.0,
});
```

- **Errors stay at `1.0`.** Trace a uniform slice and raise it on the paths that matter with `tracesSampler` and `inheritOrSampleWith`.
- **Replays are scarcer than spans:** a typical plan comes with 5 million spans but the strategy starts with 50 Session Replays.
- **Per-page replay without a sampler:** set `replaysSessionSampleRate: 0` and use a `useSessionReplay` React hook (Next.js `"use client"`) that decides randomly, sets tags, and calls `replay.stop(); replay.start();` on mount; on unmount it calls `replay.stop(); replay.startBuffering();` to keep error replays working. Downside: recording starts after mount and can miss early hydration issues.
- **Logs: filter at the source** with `beforeSendLog`, or with LogTape (`@logtape/logtape`, `@logtape/sentry` `getSentrySink()`, `lowestLevel`, filters such as `(isHighSignal(rec) || sampleRate(rec)) && noDev(rec)` with 5% sampling). Stop sending info logs for every routine event.
- **The blog's short login example is broken** (it destructures only `{name}`, reads `attributes`, and returns nothing on the fallback path): don't copy it.

## React source rate example

These are the React source's traffic-tier recommendations and SDK 10 sampler example, distinct from the other production-rate preferences above. [getsentry/sentry-for-ai, sentry-react-sdk]

| Daily transactions | `tracesSampleRate` |
|---|---|
| <10K (also dev, staging) | 1.0 |
| 10K to 100K | 0.2 |
| 100K to 1M | 0.05 to 0.1 |
| >1M | 0.01 to 0.02, with `tracesSampler` for priority routes |

- **`tracesSampler` wins** when both are set. It receives `{ name, attributes, parentSampled, parentSampleRate, inheritOrSampleWith }` and returns a rate or a boolean (`true` = 1.0, `false` = 0).

```typescript
Sentry.init({
  tracesSampler: ({ name, attributes, inheritOrSampleWith }) => {
    // Drop health checks and internal routes
    if (["/health", "/ping", "/readyz"].some(p => name.includes(p))) return 0;

    // Always capture critical flows
    if (name.startsWith("/checkout") || name.startsWith("/payment")) return 1.0;

    // Sample admin routes at 50%
    if (name.startsWith("/admin")) return 0.5;

    // High-volume search at 5%
    if (name.includes("/search")) return 0.05;

    // For everything else: honor parent's decision, fall back to 10%
    return inheritOrSampleWith(0.1);
  },
});
```

- **Use `inheritOrSampleWith(fallback)`, not a hand check of `parentSampled`:** it keeps sampling deterministic across the trace, metric extrapolation accurate and `sentry-sampled` correct in downstream baggage.

## Dynamic Sampling (legacy)

- **Only for organizations that already have it enabled;** it isn't available to new customers. Everyone else controls span volume with SDK sampling.
- **Applies only to spans and transactions,** not errors. Performance metrics shown are still based on all events sent. It keeps every transaction of a trace if the head is kept.
- **Needs Admin permissions** and SDK minimums including JavaScript 7.6.0, React Native 4.3.0, Dart and Flutter 6.11.0.
- **Priorities** (Settings > Projects > [project] > Performance > "DYNAMIC SAMPLING PRIORITIES"): Latest Release (environment-aware); Dev Environments (globs `*debug*`, `*dev*`, `*local*`, `*qa*`, `*test*`); Low Volume Projects (org-wide, can't be disabled); Low Volume Transactions; Health Checks deprioritized (`*healthcheck*`, `*heartbeat*`, `*/health`, `*/healthy`, `*/healthz`, `*/live`, `*/livez`, `*/ready`, `*/readyz`, `*/ping`).
- **Metering is on received, not stored, events.** Raising the SDK sample rate may require adjusting the quota.

## What counts against quota

Quotas are per data category: errors, replays, spans or transactions, profiles, logs, application metrics, attachments. Errors, spans, replays and profiles are billed by volume; logs and metrics by size. Check Stats > "Usage" (any member); a per-project breakdown is in Settings > Subscription > "View all usage" (Owner or Billing).

| Doesn't count | Counts |
|---|---|
| Events dropped while spike protection is active | Repeats of resolved issues |
| Events after the quota is exceeded | Repeats of ignored issues |
| Events over a project rate limit | |
| Repeats of "Delete & Discard" issues | |
| Inbound-filtered events | |
| Events sampled, filtered or configured out in the SDK | |
| Events over size limits | |

- **Issues don't count; their events do.** Logs and metrics are counted individually. Events without a valid DSN or project, unparsable events and errors without a valid fingerprint are rejected.
- **Hidden environments still count** against quota.
- **Over quota, the server returns 429 with `Retry-After`.** Clients must not retry: they drop events until the rate limit expires. The 429 is slightly delayed. The first overage on a paid plan gets a one-time grace period.
- **Spending:** reserved volume is cheaper than pay-as-you-go; use PAYG for temporary increases (rolling out a new version). Decreases apply at the end of the billing period, so change subscriptions before the last day.

## Reducing volume, easiest first

| Action | Applies to | Where |
|---|---|---|
| Spike protection | errors, spans, attachments | sentry.io |
| Adjust quota | all | sentry.io |
| Rate limit | errors, attachments | sentry.io |
| Review repeated events (Delete & Discard) | errors | sentry.io |
| Inbound filters | errors, spans, attachments, logs, metrics | sentry.io |
| SDK sample rate | errors, spans | sentry.io |
| SDK filtering: `beforeSend`, `beforeSendTransaction`, `beforeSendLog`, `beforeSendMetric` | per hook | SDK |
| SDK configuration | | SDK |
| Manage data size | | SDK |

- **Workflow:** find the top offenders, add inbound filters, add a `tracesSampler`, set rate limits and spike protection, then re-measure.
- **Find the busiest issues** on the Errors page with columns `issue`, `title`, `project`, `count()` sorted by COUNT(), or in the Feed sorted by "Events".
- **Delete & Discard** (Business and Enterprise): future events with the same fingerprint don't count. The list is at Project Settings > Inbound Filters > Discarded Issues; then consider adding them to `beforeSend`.
- **Release and error-message inbound filters** are Business and Enterprise.

## Rate limits

- **Per DSN key** (Business and Enterprise): Client Keys (DSN) > Configure, for example "500 events per minute". Use a separate unlimited key for staging.
- **A ceiling, not a throttle:** you shouldn't constantly hit your rate limit. Size it from "KEY USAGE IN THE LAST 30 DAYS" max daily rate (about 35K per day is about 1458 per hour, about 24 per minute). Use a minute-based rate.
- **Server SDKs bypass Allowed Domains** (no `Origin` or `Referer`): restrict their ingestion with a project rate limit or a network allowlist.

## Spike protection

- **Per project,** Settings > Spike Protection (toggle or "Enable All"), by Manager, Billing or Owner. Applies to errors, transactions or spans, and attachments. Not active during trials.
- **No notifications by default:** add actions (Sentry Notification, Slack, PagerDuty, Opsgenie); the personal setting is User Settings > Notifications > Spike Protection.
- **Threshold:** the higher of a minimum event calculation (the max of 1/10 of the Developer plan minimum reserved volume, or `(3 * your quota)/(720 * number of projects)` with projects capped at 5) and a usage-based weighted 168-hour projection with seasonality, times a multiplier of 5x standard deviation bounded 3 to 6. Recalculated hourly during a spike; sustained high volume becomes the new baseline. Dropped events' contribution decays to about 10% weight after 24 hours and about zero after two days.
- **Bursty projects** (cron, Airflow, task runners) may turn it off.
- **Managing a spike:** find the consuming issues in Stats, set DSN rate limits, set Monitors on event counts, inbound-filter a bad release, set a pay-as-you-go budget. Stats shows windows from 6 hours to 30 days and spikes over 1 hour; shorter ones are in the Audit Log (`spike-protection.activated`, `spike-protection.deactivated`, `spike-protection.disabled`, `spike-protection.enabled`).

## Per-category quotas

- **Spans:** the "Usage Stats" tab is visible on Team, Business and Enterprise. Reduce with the SDK sample rate or `tracesSampler`.
- **Replays:** a PAYG budget, shared or per category; changes take effect within minutes, at most 24 hours.
- **Logs** (Team, Business, Developer plans): filtering at the source is the most effective reduction. Use log level WARNING and above in production, structured attributes rather than verbose messages, `beforeSendLog`, Usage Stats and quota alerts. Inbound filters for logs: Log Message (e.g. `*Connection timeout*`) and Releases.

```js
Sentry.init({
  dsn: "https://<key>@o<orgId>.ingest.sentry.io/<projectId>",
  enableLogs: true,
  beforeSendLog: (log) => {
    if (log.level === "info") {
      // Filter out all info logs
      return null;
    }
    return log;
  },
});
```

## Prove it

- **Tracing is really on (or really off):** `tracesSampleRate` or `tracesSampler` is set where you expect traces; where tracing should be off, neither is set (not `tracesSampleRate: 0`).
- **The sampler inherits:** every fallback path in `tracesSampler` returns `inheritOrSampleWith(...)`, and a frontend-to-backend request shows one connected trace with no orphan spans.
- **Production rates are explicit:** the production config sets `sampleRate`, the trace rate and the replay rates, and you told the user which values you chose.
- **Health checks are gone:** after the inbound health-check filter or the sampler, no `*/health`-style transactions appear in the Spans dataset.
- **Quota is measured:** Stats > "Usage" shows per-category volume before and after a change; the busiest issues query (`issue`, `title`, `project`, `count()`) shows the top offenders shrinking.
- **Rate limit is a ceiling:** the DSN key's limit sits above the max daily rate in "KEY USAGE IN THE LAST 30 DAYS" converted to per minute.
- **Spike protection notifies:** the project has spike protection on and at least one notification action configured.
