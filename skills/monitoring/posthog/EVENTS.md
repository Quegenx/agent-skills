# Events

An event is a name, a `distinct_id`, a `timestamp` and properties; system events such as `$identify`, `$groupidentify` and `$feature_flag_called` power PostHog features. Treat event and property names as an analytics contract and keep them static. This file covers naming, what to capture, autocapture, super properties, the data model and troubleshooting. Identity (identify, alias, reset, merge, anonymous vs identified, person properties, groups) is in [IDENTITY.md](IDENTITY.md). SDK installation is in [SETUP-WEB.md](SETUP-WEB.md), [SETUP-SERVER.md](SETUP-SERVER.md) and [SETUP-MOBILE.md](SETUP-MOBILE.md); SQL over events is [HOGQL.md](HOGQL.md).

**Contents:** [What to capture](#what-to-capture) · [Naming events and properties](#naming-events-and-properties) · [Capturing custom events](#capturing-custom-events) · [Super properties](#super-properties) · [Autocapture](#autocapture) · [Cutting unwanted events](#cutting-unwanted-events) · [The events data model](#the-events-data-model) · [Ordering and late events](#ordering-and-late-events) · [Filtering internal users](#filtering-internal-users) · [Querying events](#querying-events) · [Troubleshooting](#troubleshooting) · [Prove it](#prove-it)

## What to capture

- **Start with growth events:** signups, subscriptions, purchases. Many teams rely on autocapture and miss a proper `user_signed_up` event. Track signup explicitly from both frontend and backend.

```javascript
posthog.capture('user_signed_up', {
    signup_method: 'email',
    referral_source: 'google',
    plan: 'free'
})
```

- **Prefer backend tracking when accuracy matters.** Users block tracking, and frontend JS can be interrupted (network, CORS, browser settings); you control the backend. Use the frontend where partial data is acceptable (journeys, clicks, scrolls, forms, client performance); use the backend (or a database query) when you need accurate numbers (e.g. signups last week) or analysis against business metrics.
- **Server-side events are required** when the project has instrumentable server code: API routes, server actions, webhook handlers, payment or checkout completion, authentication endpoints.
- **Plan before instrumenting.** Pick 10 to 15 files with business value, especially conversion and churn events, plus the login files (for identify) and error handling. Find existing `posthog.capture()` calls, note their name format, and supplement rather than duplicate them.
- **Track actions, not pageviews:** pageviews are captured automatically. The exception is "viewed"-type events at the top of a conversion funnel.
- **Start from product goals,** make the data accessible where you capture it, and verify the format.
- **Leave other tools alone.** If a file already has another tool's integration code, don't overwrite or remove it; place PostHog code below it, keep additions minimal and targeted, and don't change the file's architecture.
- **Set up a reverse proxy** so tracking and ad blockers are less likely to block events (see [SETUP-WEB.md](SETUP-WEB.md)).
- **Use one project for the marketing site and the app:** full journeys, channel attribution, CAC and LTV, cross-platform funnels. The formulas (CAC = total sales + marketing spend / new customers; pipeline velocity) are in [revops PIPELINE-AND-METRICS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/revops/PIPELINE-AND-METRICS.md#metrics).
- **Form and popup funnels:** form views, first field focus, each field completion, errors by field, submit attempts, successful submissions [coreyhaines31/marketingskills, cro]; for popups also close-button clicks, outside clicks and Escape [coreyhaines31/marketingskills, popups]. The metrics (start rate, completion, field drop-off) are in [cro SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cro/SKILL.md).
- **Lead-magnet quality as funnel steps** [coreyhaines31/marketingskills, lead-magnets]: per magnet source, click through to content or product pages, return to the site within 30 days, progress to trial, demo or purchase within 90 days. The full signal list and A/B candidates (gate level, fields asked, delivery) are in [lead-magnets PROMOTION-AND-MEASUREMENT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/lead-magnets/PROMOTION-AND-MEASUREMENT.md#lead-quality).
- **Keep PII out of event properties.** One example app says never send PII or user-generated content in capture properties and puts name and email in `identify` instead; most other examples send `username` as an event property.

## Naming events and properties

Treat event names, property names and feature flag keys as an analytics contract: reuse existing names and patterns in the project, and make new ones clear, descriptive and consistent with existing conventions.

| Rule | Example |
|---|---|
| Lowercase letters only, snake case | `signup_button_click` |
| Present-tense verbs from the allowed list: click, submit, create, view, add, invite, update, delete, remove, start, end, cancel, fail, generate, send | `submit`, not `submitted` |
| Event name as **category:object_action** (category = context, object = component or location noun, action = verb) | `account_settings:forgot_password_button_click`, `signup_flow:pricing_page_view` |
| Property names as **object_adjective** | `user_id`, `item_price`, `member_count` |
| Booleans start with `is` or `has` | `is_subscribed`, `has_seen_upsell` |
| Dates and timestamps end in `_date` or `_timestamp` | `user_creation_date`, `last_login_timestamp` |
| Version events after a revamp | `registration:sign_up_button_click` to `registration_v2:sign_up_button_click` |

- **Conflict on format:** the product analytics best-practices page uses snake case `category:object_action`; the SDK usage page recommends an `[object] [verb]` format such as `project created`, `user signed up`, `invite sent`. Pick one per project and confirm in the current docs. A third convention: [coreyhaines31/marketingskills, analytics] recommends an Object-Action format in lowercase with underscores (`signup_completed`, `button_clicked`, `form_submitted`). Reuse whichever the project already has (rule 6); the marketing tracking plan is [google-analytics TRACKING-PLAN.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/google-analytics/TRACKING-PLAN.md#naming-events).
- **Anti-pattern, inconsistent names across platforms:** web `Create Account`, iOS `user_sign_up`, Android `create-account` for the same action.
- **Keep names static; never interpolate.** Each interpolated name creates a new event definition. Same for properties: `feature_${featureName}_used` becomes a `feature_name` property. Too many unique property names get new property definitions rate limited, and they stop appearing in filters and breakdowns.

```javascript
// Bad: creates a new event definition for every page
posthog.capture(`page_viewed_${pageName}`)

// Good - one event, filterable by page name
posthog.capture('page_viewed', { page_name: pageName })
```

- **Events can't be renamed.** Use actions as aliases, and to combine events.

## Capturing custom events

- **Web:** `capture(event_name, properties?: Properties | null, options?: CaptureOptions)` returns `CaptureResult | undefined`.

```javascript
posthog.capture('cta-button-clicked', { button_name: 'Get Started', page: 'homepage' })
```

- **Every event needs a distinct ID.** Backend capture always takes `distinct_id` as a required argument; web and mobile SDKs generate an anonymous one automatically. Choosing and linking IDs is in [IDENTITY.md](IDENTITY.md).
- **Groups per event:** on web, `posthog.group('company', 'id:5')` associates subsequent events; other SDKs pass groups on each event (see [IDENTITY.md](IDENTITY.md#group-analytics)).
- **Frontend plus backend:** pass the client's distinct ID and session ID to the server in the `X-POSTHOG-DISTINCT-ID` and `X-POSTHOG-SESSION-ID` headers, and make sure server events carry the matching distinct ID.
- **Listen to captures:** `on('eventCaptured' | 'featureFlagsReloading', cb)` returns an unsubscribe function. It isn't called on registration (unlike `onFeatureFlags` and `onSessionId`). `eventCaptured` fires immediately before the SDK tries to send; `featureFlagsReloading` fires after `identify()`, `group()` or `reloadFeatureFlags()`.
- **Server-side capture with no person:** jobs and system events take a fresh ID per run and `$process_person_profile: false` (see [IDENTITY.md](IDENTITY.md#catch-all-ids)).

## Super properties

Super properties are stored in persistence and added to every event across sessions. They are stored on events, not on the user: use identify or person properties for user data.

| Call | Behavior |
|---|---|
| `register(properties, days?)` | Adds to every event, overwrites the same keys. `posthog.register({ campaign: 'summer_sale' }, 7) // expires in 7 days` |
| `register_once(properties, default_value?, days?)` | Won't overwrite an existing value. `default_value` defaults to `'None'` |
| `register_for_session(properties)` | Kept in `sessionStorage`, cleared when the session ends |
| `unregister(property)` / `unregister_for_session(property)` | Removes one |
| `get_property(name)` | Returns a super property |
| `getSessionProperty(name)` | Based on browser-level `sessionStorage`, NOT the PostHog session |

- **Read only after load:** `get_property` and `getSessionProperty` work only once the SDK has loaded; use the `loaded` callback in init.
- **`reset()` on logout clears all super properties.**

## Autocapture

| SDK | Autocapture default |
|---|---|
| JavaScript Web | Enabled |
| React | Enabled |
| React Native | Disabled |
| Flutter | Disabled |

- **Types:** interaction, navigation (pageview, pageleave, screen), clipboard, heatmap, dead clicks, exception, session, web vitals (LCP, FID, CLS, FCP), lifecycle.
- **Web interaction autocapture** captures clicks on `a`, `button`, `form`, `input`, `select`, `textarea`, `label`; form submissions and changes; `contenteditable="true"` changes; clipboard copies. Events get names like `clicked span with text "Delete"`.
- **Limitations:** little signal on high-traffic sites (use filters, actions, insights); frontend only; customization needs custom events. Don't let it replace explicit growth events.
- **Navigation:** `capture_pageview` is `boolean` or `'history_change'` (the default, works on SPAs); `capture_pageleave` is `boolean` or `'if_capture_pageview'` (default). On SPAs, pageviews rely on page loads unless `capture_pageview: 'history_change'` or a recent `defaults` is set.
- **Disable it** in project settings, with `autocapture: false`, or `posthog.set_config({ autocapture: false })`. This does NOT disable pageviews or pageleaves: use `capture_pageview: false` and `capture_pageleave: false`.
- **Exclude elements:** `className="ph-no-capture"` excludes an element (and is the place to mark whole sections such as a navbar).
- **Add properties:** `data-ph-capture-attribute-some-key={someValue}` adds `some-key` to autocapture events from that element and its children. Form values are NOT captured (sensitive data); add them with `data-ph-capture-attribute-*` on the form.

### Autocapture config

All keys go under `autocapture: {...}`:

| Key | Meaning |
|---|---|
| `url_allowlist`, `url_ignorelist` | The allowlist is checked first; the ignorelist can override it |
| `dom_event_allowlist` | DOM events to capture |
| `element_allowlist` | Element tags to capture |
| `css_selector_allowlist` | Only elements matching these selectors |
| `css_selector_ignorelist` | Defaults `.ph-no-autocapture` and `[data-ph-no-autocapture]`; any custom list REPLACES the defaults, so repeat them |
| `element_attribute_ignorelist` | Attributes never recorded |
| `capture_copied_text` | Copy and cut capture |

```javascript
posthog.init('<ph_project_token>', {
    api_host: 'https://us.i.posthog.com',
    defaults: '2026-05-30',
    autocapture: {
        // URL filtering
        url_allowlist: ['https://example.com', 'test.com/.*'],
        url_ignorelist: ['https://example.com/admin', 'test.com/private/.*'],

        // Event filtering
        dom_event_allowlist: ['click', 'change', 'submit', 'input'],

        // Element filtering
        element_allowlist: ['a', 'button', 'form', 'input', 'select', 'textarea', 'label'],
        css_selector_allowlist: ['[ph-capture]', '[data-track]'],
        css_selector_ignorelist: ['.ph-no-autocapture', '[data-ph-no-autocapture]', '[data-sensitive]'],

        // Attribute filtering
        element_attribute_ignorelist: ['aria-label', 'data-attr-pii', 'data-sensitive'],

        // Copy/cut capture
        capture_copied_text: true,
    },
})
```

### Rage clicks, dead clicks, clipboard, heatmaps

- **Rage click:** `$rageclick` fires after three clicks each within **30 pixels** and **1 second**. The latest `defaults` ignore navigation controls (`next`, `previous`, `>`, `<`), steppers (`+`, `-`) and text-selection surfaces. Tune with `content_ignorelist`, `ignore_text_selection` and the `.ph-no-rageclick` class. Confirm against replays before treating rage clicks as a frustration signal.
- **Dead clicks:** `capture_dead_clicks: true`; exclude with `.ph-no-deadclick`; `capture_dead_clicks.css_selector_ignorelist` replaces the defaults. Heatmap dead clicks are free; dead-click autocapture is priced as standard events.
- **Clipboard:** `capture_copied_text: true` produces `$selected_content` and respects password fields.
- **Heatmaps** enabled in project settings create no additional events.

### Analysing autocapture

- **Filter** by tag name, text, `href` or CSS selector; rename and organize with actions; query `elements_chain` with SQL.
- **Default web properties** include `$current_url`, `$host`, `$pathname`, `$lib`, `$lib_version`, `$referrer`, `$active_feature_flags`, `$event_type`, `$utm_*`, ad click IDs (`$gclid`, `$fbclid`, `$msclkid`, `$ttclid`, ...) and `$ip`.
- **React Native autocapture properties:** `description`, `text`, `screen_name`, `elements_chain`.

## Cutting unwanted events

- **`autocapture: false`** keeps `$pageview` and `$pageleave`.
- **Kill switch with a flag,** set up in `loaded`: `posthog.onFeatureFlags(() => { if (posthog.isFeatureEnabled("disable-autocapture")) { posthog.config.autocapture = false } })`.
- **Gate high-volume captures:** `if (!posthog.isFeatureEnabled("disable-event-capture")) posthog.capture("event")`.
- **`ph-no-capture` on whole sections,** e.g. the navbar.
- **"Filter Out" transformation** with JSON rules (`property`, `type`, `operator`, `value`). Test the filters: a rule on email drops events that lack the key, and autocaptured properties start with `$`.
- **Avoid the Downsampling plugin** ("not recommended"): random drops can break funnels and paid-subscription data.

## The events data model

| Field | Meaning |
|---|---|
| `event` | The name. `$`-prefixed names are PostHog defaults; `$ai_` names are AI Observability, stored and billed differently |
| `distinct_id` | Who did it, commonly a `uuidv7` |
| `timestamp` | ISO 8601, set at SDK call time; may be in the past |
| `created_at` | Server receipt time. Build analysis on `timestamp`, not this |
| `properties` | Event properties |

- **System events power features:** `$set` and `$unset` (person properties), `$identify`, `$create_alias`, `$groupidentify`, `$pageleave` (bounce rate), `$feature/<key>` and `$feature_flag_called` (experiments).
- **Events keep their original `distinct_id`** after identity merges; only the `person_id` mapping changes (see [IDENTITY.md](IDENTITY.md#what-a-merge-does)).
- **Event definitions** carry tags, descriptions, image previews and a status: Visible, Verified or Hidden. Hide instead of deleting.
- **Deduplication:** events with the same `uuid`, `event`, `timestamp` and `distinct_id` are duplicates and are eventually merged (ClickHouse background merges).
- **Re-sending to correct an event:** sending the same four fields upserts and replaces the event completely. Include all properties, keep the timestamp identical, avoid `sent_at`, omit `$set` and `$set_once`. Downstream destinations and batch exports may re-trigger.
- **The Activity tab** refreshes every 30 seconds.

## Ordering and late events

- **Ordering is guaranteed only** for the same `distinct_id` within one API call, or across sequential calls when you wait for each response. Otherwise it isn't.
- **Latency:** most web and server events are ingested within 60 seconds; mobile events can arrive hours or days late. PostHog does not buffer or reorder late mobile data.
- **Person properties follow ingestion order:** `$set` reflects the last ingested value and `$set_once` is claimed by the first ingested event. Use event timestamps for time analysis and never build logic that assumes ingestion order.
- **One distinct ID above about 5,000 events a minute** crosses a per-distinct-ID rate limit: its events lose strict ordering and person profile updates until the spike subsides. Send such events with person processing disabled (see [IDENTITY.md](IDENTITY.md#catch-all-ids)).

## Filtering internal users

Project settings "Filter out internal and test users" describes the traffic to KEEP, so use negative operators (**doesn't equal**, **doesn't contain**). Toggle it on each insight; Web Analytics has "Filter test accounts".

| Traffic | Filter |
|---|---|
| Your team | Person property `email` **doesn't end with** `@yourcompany.com` (identified users only) |
| Local and staging | Event property **Host** doesn't contain `localhost` (Host includes the port, e.g. `localhost:3000`) |
| Office or VPN | **IP address** doesn't equal (fails if the project discards IPs) |
| Your own browser | `posthog.setInternalOrTestUser()` keeps capturing and sets the `$internal_or_test_user` person property (enables person processing); new projects include an "Internal / Test users" cohort and filter. Or config `internal_or_test_user_hostname: 'localhost'` |
| Stop your browser entirely | `posthog.opt_out_capturing()` stops all capture including replay |

- **Per browser:** redo after clearing cookies. With an npm install `posthog` isn't on the console; call it from app code.

## Querying events

- **Faster queries:** pick a specific event (not "All events"), a shorter period, and `person.properties.<property>` instead of `pdi.person.properties.<property>`. Full SQL is [HOGQL.md](HOGQL.md).
- **Filtering SQL by one `distinct_id` misses a person's other IDs;** join through `person_distinct_ids`.
- **Joining your own tables, e.g. Supabase users:** import the `auth` schema's `users` table into the data warehouse (prefix like `supabase_` if a Postgres source already exists), then join on `distinct_id`.

```sql
with sb_users as (
    select email, last_sign_in_at, created_at from supabase_postgres_users
),
big_events as (
    select count(*) as event_count, distinct_id
    from events
    group by distinct_id
)
select email, last_sign_in_at, created_at, event_count
from sb_users
left join big_events on big_events.distinct_id = sb_users.email
```

- **Supabase query stats:** link `pg_stat_statements` from the `extensions` schema, e.g. `SELECT quantile(0.95)(total_exec_time) AS p95_exec_time, median(rows) AS median_rows_read FROM sb_stats_postgres_pg_stat_statements`.
- **Use warehouse data wherever persons are used:** add a join between the PostHog `persons` table and the Supabase `users` table (data warehouse > persons source > Add join).

## Troubleshooting

- **Events not appearing:** point `api_host` at a webhook.site URL to see what the SDK sends; decode the base64 `data=` payload for support tickets.
- **Debug mode:** `posthog.debug()` or `debug(true)` logs every PostHog call to the console; URL `?__posthog_debug=true` does the same without a code change. A common pattern is `debug` true only in local development.
- **Bots are blocked by default:** googlebot, bingbot, gptbot, ahrefsbot, semrushbot and more.
- **Automated browsers send nothing:** with `navigator.webdriver` true or `HeadlessChrome` in the user agent or brands (Playwright, Puppeteer, Selenium), the SDK loads and flags and identify work, but event requests never leave the page. `?__posthog_debug=true` shows "likely bot". Do not bypass bot detection. [User standing safety instruction]
- **A property disappears from filters:** too many unique property names, so new definitions are rate limited. Stop interpolating names.
- **`$set` values not filterable on events:** they aren't stored on events; query person properties (see [IDENTITY.md](IDENTITY.md#person-properties)).
- **Missing configuration:** follow [the setup commandment](SETUP-WEB.md#the-commandments).

## Prove it

- With `?__posthog_debug=true` (or `api_host` pointed at webhook.site), trigger each new custom event once and see it leave the page with the planned static name and properties.
- The Activity tab (refreshes every 30 seconds) shows each new event; no event or property name contains an interpolated value.
- Every growth event (`user_signed_up` and the like) arrives from the backend, not only from autocapture.
- An event in an internal-users-filtered insight from `localhost` is excluded; one from production is kept.
- A Playwright or headless run is expected to send no events; do not bypass bot detection. [User standing safety instruction]
