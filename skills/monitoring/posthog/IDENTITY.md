# Identity

Identity decides which person each event belongs to. Web and mobile SDKs start with an anonymous distinct ID; `identify` links it to a stable ID you choose, `alias` links two IDs, and `reset` starts a new anonymous person on logout. PostHog merges exactly what you tell it to, so identity resolution is your engineering problem: incoherent IDs make flags flip, experiments double-count, funnels misattribute and replays fragment. The root cause is always the same: two distinct IDs that should be one person aren't linked. Use an identical `distinct_id` string in every environment, and run `identify()` before flag evaluations and conversion events. Events and naming are in [EVENTS.md](EVENTS.md); SDK setup is in [SETUP-WEB.md](SETUP-WEB.md), [SETUP-SERVER.md](SETUP-SERVER.md) and [SETUP-MOBILE.md](SETUP-MOBILE.md); SQL over persons is [HOGQL.md](HOGQL.md).

**Contents:** [How it works](#how-it-works) · [Choosing the distinct ID](#choosing-the-distinct-id) · [Identify](#identify) · [Reset on logout](#reset-on-logout) · [Alias](#alias) · [Across platforms and environments](#across-platforms-and-environments) · [What a merge does](#what-a-merge-does) · [Merge and split by hand](#merge-and-split-by-hand) · [Catch-all IDs](#catch-all-ids) · [Anonymous vs identified events](#anonymous-vs-identified-events) · [Person profiles](#person-profiles) · [Person properties](#person-properties) · [Cookieless tracking](#cookieless-tracking) · [Group analytics](#group-analytics) · [Symptoms](#symptoms) · [Prove it](#prove-it)

## How it works

- **Three layers of IDs:** Layer 0 is a stable ID, assigned at first sight and never changed. Layer 1 is authentication IDs (email, backend user_id, SSO subject, OAuth sub). Layer 2 is device and session IDs (SDK anonymous_id, device_id, session tokens). Breaks happen when a Layer 2 ID is replaced by a Layer 1 ID.
- **Anonymous ID first:** web and mobile SDKs generate an anonymous `distinct_id` (a UUID) and store it locally. With persistence as cookies or `localStorage`, anonymous users are tracked across sessions.
- **Identify merges anonymous into identified:** calling `identify` with a stable `distinct_id` merges the anonymous person into the identified one, so "all past and future events made with that anonymous ID are now associated with the distinct ID". Looking up either ID shows the full history.
- **Backend SDKs have no anonymous sessions.** Backend capture always requires `distinct_id`, and backend `identify` only updates person profiles.

## Choosing the distinct ID

- **Prefer a stable ID from your auth system,** not an email or display name; email works as a fallback if unique. The framework setup docs say this; the cross-SDK identify page says "usually the user's ID in your database, or their email", and some examples identify with `user.email` or `username`. Confirm in the current docs.
- **The golden path:** mint a stable ID once (ideally on your server) and pass it to every environment (bootstrap, URL params, cookies).

```javascript
// Server: mint or retrieve the stable ID
const stableId = getOrCreateStableId(sessionCookie) // your logic

// Pass to the client at render time via bootstrap
posthog.init('phc_...', {
  bootstrap: {
    distinctID: stableId,
    featureFlags: preEvaluatedFlags  // optional: skip the /flags call entirely
  }
})
```

- **Client only:** `const stableId = localStorage.getItem('app_user_id') || crypto.randomUUID()` then bootstrap with it, or persist `posthog.get_distinct_id()` in a `_canonical_uid` cookie (maxAge 2 years) and bootstrap with that.
- **On login, enrich; don't replace:** `posthog.identify(stableId, { email, backend_user_id, plan })`.
- **Identical strings everywhere,** no type coercion: `"user-456"`, `"456"` and `"USER-456"` are three people. Use one backend helper (e.g. `user.posthog_id`) for the canonical ID.
- **Unique IDs:** the same ID merges users. Clashes come from weak ID generation, or bugs that identify with generic values like `null`, `true` or `distinctId`. PostHog also has built-in protections to stop the most common distinct ID mistakes.

### Blocked IDs

Using one of these keeps the event (ingested normally, tied only to its `distinct_id`), but the merge is refused and an ingestion warning is logged; merges fail silently, so use UUIDs or validate IDs against the list.

| Match | Values |
|---|---|
| Whitespace | Whitespace-only and empty strings |
| Case-insensitive | `anonymous`, `guest`, `distinctid`, `distinct_id`, `id`, `not_authenticated`, `email`, `undefined`, `true`, `false` |
| Case-sensitive | `[object Object]`, `NaN`, `None`, `none`, `null`, `0` |

The identity resolution page also lists quoted variants of all of these.

## Identify

| SDK | Call |
|---|---|
| Web | `posthog.identify('distinct_id', { email: 'max@hedgehogmail.com', name: 'Max Hedgehog' })` |
| React Native | `posthog.identify('distinct_id', {...})` |
| Flutter (Dart) | `await Posthog().identify(userId: 'distinct_id', userProperties: {'email': ..., 'name': ...});` |
| Node | `posthog.withContext({ distinctId: 'user-123' }, () => { posthog.capture({ event: 'order_processed' }) })`; an explicit `distinctId` in capture overrides the context |

- **Web signature:** `identify(new_distinct_id, userPropertiesToSet?, userPropertiesToSetOnce?)`. `new_distinct_id` must be a non-empty string. If a key is in both, set overwrites set_once for flag evaluation.

```javascript
posthog.identify('user_12345')
posthog.identify('user_12345', { email: 'user@example.com', plan: 'premium' })
posthog.identify('user_12345', { last_login: new Date() }, { signup_date: new Date() })
```

- **When:** as soon as you can, every time the app loads and directly after login or signup. Once per session is enough; repeated identical calls without a page reload are ignored. Use the contents of login and signup forms to identify on submit.
- **Identify in `loaded`** when the user is known at init; if the user loads asynchronously, call `posthog.identify()` when the data arrives.

```javascript
posthog.init('<ph_project_token>', {
    api_host: 'https://us.i.posthog.com',
    defaults: '2026-05-30',
    loaded: (posthog) => {
        if (currentUser?.id) {
            posthog.identify(currentUser.id, {
                email: currentUser.email,
                name: currentUser.name,
            })
        }
    },
})
```

- **React, Remix, React Router:** use `usePostHog` from `@posthog/react` (not a direct import) and identify inside an effect that runs once the user is known.

```jsx
useEffect(() => {
    if (user) {
        // Identify sends an event, so you may want to limit how often you call it
        posthog?.identify(user.id, {
            email: user.email,
        })
        posthog?.group('company', user.company_id)
    }
}, [posthog, user.id, user.email, user.company_id])
```

- **Next.js:** after init in `instrumentation-client.ts`, import `posthog` directly. The pre-release `@posthog/next` has its own `usePostHog` (`import { usePostHog } from '@posthog/next'`) and keeps client and server identity in sync.
- **Before flags and conversions:** `identify()` must run before flag evaluations and conversion events. If identity only exists after login, either defer flag evaluation until it's resolved, or use the stable ID for flags and hold `identify()` with person properties until login (a stable ID alone doesn't create an identified person profile).
- **Pass all available person properties** on each identify call.
- **You can't re-identify an identified user with a different ID:** `identify('distinct_id_two')` after `identify('distinct_id_one')` isn't possible.
- **Server-side identify, conflicting examples:** React Router examples say "do not identify users on the server-side"; the Next.js and TanStack Start examples call server `posthog.identify({ distinctId, properties })`. Backend identify only updates person profiles either way.
- **`identify()` is not `setIdentity()`:** `setIdentity(distinctId, hash)` is HMAC identity verification for products like conversations (hash = HMAC-SHA256 of distinct_id computed server-side with the Secret API key from Support settings; project secret API keys and personal API keys are rejected). `clearIdentity()` reverts to anonymous.
- **Read the current ID:** `posthog.get_distinct_id()` (Web, React Native), `await Posthog().getDistinctId();` (Flutter).

## Reset on logout

- **Call `reset` on logout, and only then.** Shared computers otherwise merge users through shared cookies. "We strongly recommend you call `reset` on logout even if you don't expect users to share a computer." Calling it at the wrong time causes split sessions.

| SDK | Call |
|---|---|
| Web, React Native | `posthog.reset()` |
| Flutter (Dart) | `await Posthog().reset();` |
| Also reset `device_id` | `posthog.reset(true)` |
| Web, bootstrap a new anonymous ID | `posthog.reset({ bootstrap: { distinctID: myAnonymousID, isIdentifiedID: false, featureFlags: { 'my-flag': true } } })` |

- **What it clears (web):** session ID, super properties, identification (a new random distinct_id), cached data and consent settings.
- **Reset before opting in.** Because consent is cleared, with `opt_out_capturing_by_default` calling `reset()` after `opt_in_capturing()` silently stops capturing. Always `reset()` first, then opt in.
- **Logout event ordering, conflicting examples:** most examples capture `user_logged_out` then `reset()` ("Capture logout event before resetting"); one calls `reset()` first; one calls only `reset()`. Confirm in the current docs.

## Alias

- **Use case:** several distinct IDs for one user when the primary one is inaccessible, e.g. the frontend ID isn't available in your backend. It merges past and future events into the same user, subject to alias restrictions; it does not rewrite stored event distinct IDs. The old line said alias linked IDs only going forward. [PostHog, https://posthog.com/docs/product-analytics/identify#alias-assigning-multiple-distinct-ids-to-the-same-user]. Call it when a user signs up to connect their anonymous session with their account.

| SDK | Call |
|---|---|
| Node | `client.alias({ distinctId: 'frontend_id', alias: 'backend_id' })` |
| Web | `posthog.alias('backend_id', 'frontend_id');` (signature `alias(alias, original?)`) |
| API | `$create_alias` event with properties `distinct_id` and `alias` |

- **Rules:** an alias ID can't be associated with more than one `distinct_id`, and must not have been used before as the `distinct_id` of an `identify()` or `alias()` call.

## Across platforms and environments

- **Web to mobile when one side is unauthenticated** (pre-auth onboarding, unauthenticated web to authenticated app, authenticated web prompting an app download): (1) read `posthog.get_distinct_id()` (the anonymous ID if unauthenticated); (2) put it in the deep link or universal link query params with UTM params (examples use `ph_distinct_id`); also pass `$session_id`; (3) in the app, if authenticated call `posthog.alias(webDistinctId)`; if unauthenticated call `posthog.identify(webDistinctId)`, then `identify()` again with the canonical user ID on login.
- **Marketing site to product:** a shared domain or subdomain cookie, or URL params.
- **A conversion on a domain you don't own** (a booking tool, hosted checkout) [coreyhaines31/marketingskills, attribution]: a capture-phase `click` and `auxclick` listener adds the anonymous ID to the outbound link through the tool's metadata passthrough (`metadata[ph_distinct_id]` on SavvyCal), and *deletes* that parameter when the guard rejects the current ID, or a reused anchor keeps a stale one; the webhook then sends `$identify` with `$anon_distinct_id`. Carry only an anonymous ID: under email identity reject anything containing `@` or over 100 characters; under UUID identity it is anonymous only while `distinct_id` equals `$device_id`, and false when either is unreadable. "When identity is ambiguous, send nothing." Code and checks: [marketing-attribution FIRST-PARTY-STITCH.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-attribution/FIRST-PARTY-STITCH.md).
- **Server to client:** bootstrap.
- **Client to server:** send `distinct_id` and `$session_id` in API calls, cookies or headers (`X-POSTHOG-DISTINCT-ID`, `X-POSTHOG-SESSION-ID`).
- **SSR auth to SPA:** a URL param or a shared cookie; prefer the shared cookie or server session.
- **Same person properties at flag evaluation everywhere:** server-side local evaluation requires passing properties.
- **Server-side GeoIP uses the server's IP:** set `$geoip_disable: true` or pass the user's IP.
- **Timing of linking is secondary,** except for feature flags.

## What a merge does

- **`identify('user-456')` sends `$identify`** with the anonymous and new IDs; the merge pipeline links them, past anonymous events are attributed to the person and future events use the new ID.
- **Events keep their original `distinct_id`; it is never rewritten.** Only the `person_id` mapping changes (a background squash job). SQL filtering by one `distinct_id` misses the others: use the `person_distinct_ids` table.
- **Two already-identified profiles won't merge:** the ingestion warning is "Refused to merge an already identified user".

## Merge and split by hand

- **`$merge_dangerously`** is irreversible, has no safeguards and is for one-off recovery only. Check whether alias fits first.

```javascript
client.capture({ distinctId: 'distinct_id_of_user_to_merge_into', event: '$merge_dangerously', properties: { alias: 'distinct_id_of_user_to_be_merged' } })
```

- **Split:** the person page's "Split IDs" separates IDs, with no guarantee for past events.

## Catch-all IDs

- **Never use one ID like `"system"`, `"backend"` or `"cron"` for server events.** It funnels everything into one person, hits the per-distinct-ID rate limit (events still processed, not dropped, but without strict ordering and without person updates during the spike), costs up to 4x and makes the data unusable.
- **Fix: one random ID per job run plus `$process_person_profile: false`.** Disabling person processing alone doesn't fix a shared ID. If the job runs for a user, use that user's distinct ID.

```javascript
const runId = crypto.randomUUID() // one ID per job run

client.capture({
    distinctId: runId,
    event: 'batch_job_completed',
    properties: {
        job_name: 'nightly_sync',
        duration_ms: 4500,
        $process_person_profile: false,
    },
})
```

## Anonymous vs identified events

| | Anonymous events | Identified events |
|---|---|---|
| Event properties, filters on them (URL, location, UTM) | Yes | Yes |
| Trends, funnels, SQL insights | Yes | Yes |
| Person properties, filters on them, `persons` table | No | Yes |
| Cohorts, Lifecycle insights | No | Yes |
| Flag, A/B test, survey targeting on person properties | No | Yes |
| Group analytics | No | Yes |
| Cost | Up to 4x cheaper | More (JOINs with person profiles) |

- **Choose identified** for logged-in B2B or B2C SaaS users, segmented analysis and the full conversion lifecycle. **Choose anonymous** for marketing sites, content sites, B2C apps without login and web analytics. Capture identified events only when needed.
- **After identifying:** future events are identified and billed as identified; past events are attributed to the person but stay billed as anonymous. Once identified, you can't mix anonymous and identified for the same user. `reset()` creates a new anonymous ID; using the old distinct ID again keeps events identified.
- **Billing lines:** the invoice's "person profiles" line is the number of identified events; "events" is anonymous events. The first one million events a month are free regardless of type.
- **Initial properties at identification** come from the persistence store: `$initial_current_url`, `$initial_pathname`, `$initial_referrer`, `$initial_referring_domain`, `$initial_host`, `$initial_utm_campaign`, `$initial_utm_content`, `$initial_utm_medium`, `$initial_utm_source`. They work across subdomains only with `persistence: "localStorage+cookie"` (default) or `"cookie"`. Cross-domain or web to mobile: call `posthog.identify()` (persistent ID) or `posthog.createPersonProfile()` (none), bootstrapping the second site or app with the first site's anonymous distinct ID. For a server-side merge after a third-party booking or checkout, the merge carries the anonymous events but the `$initial_*` properties may not land on the person under `identified_only`: call `createPersonProfile()` before the visitor leaves, or pass first-touch values through the metadata and re-assert them with `$set_once` ([posthog-js#1524](https://github.com/PostHog/posthog-js/issues/1524); [coreyhaines31/marketingskills, attribution]).

## Person profiles

- **Modes:** `person_profiles: 'identified_only'` (web; iOS `.identifiedOnly`, recommended and default), `'always'`, `'never'`. With identified-only, `identify()`, `alias()` or `group()` creates the profile, and all subsequent events are identified.
- **Profiles are created by** `posthog.identify()`, `posthog.setPersonProperties()` (creates one under `identified_only`) or `posthog.createPersonProfile()` (warns and does nothing under `'never'`). A data warehouse table can enrich existing profiles but never creates one.
- **Conflict on `$set` events:** the persons page lists "capture an event with `$set` or `$set_once` properties" as creating a profile; the person properties page says "When using anonymous events with `person_profiles: 'identified_only'`, adding `$set` or `$set_once` properties to an event will not create a person profile." Confirm in the current docs.
- **Switching modes:** `identified_only` to `always` does NOT backfill person data for old anonymous events; `always` to `identified_only` causes dips in insights filtered by person properties. Lifecycle insights exclude anonymous events. "Person without distinct_id" means anonymous users without a profile.
- **Mobile:** `personProfiles` changes apply only to users on the new app version. Use flags with a version payload to detect old versions or force updates. FlutterPro's forced update, soft update and maintenance mode from one server config: ../../mobile/flutter-ux/APP-LIFECYCLE.md ([FlutterPro](https://flutterpro.design/details/forced-update)).
- **Duplicate profiles** usually come from a missing `identify` on a device, or different IDs without `alias`. They inflate cohort sizes and flag targeting counts.
- **Last seen:** opt in at Settings > Product analytics > Person last seen tracking. `last_seen_at` updates once an hour (rounded down). Suppress per event with `$update_person_last_seen_at: false`, e.g. for backend enrichment jobs.
- **Logs on the profile:** anything with the `posthogDistinctId` attribute.
- **Deletion is async.** Avoid reusing a deleted `distinct_id` (or use the "Reset deleted person" tool). API options: `delete_events=true`, `delete_recordings=true` (crypto-shredding).
- **Display name** is configurable in project settings (default `distinct_id`).

## Person properties

- **`set` replaces; `set_once` writes only if the key was never set** (for never-changing facts like first URL or first login date). Both apply in ingestion order, not timestamp order (historical imports, offline mobile batching and delayed server flushes all reorder).
- **Pass person properties on `identify`, or with `$set` in a `capture`.** Prefer the SDK helpers over raw `$set` events; they handle switching to identified mode. `setPersonProperties` sends a `$set` event, updating the profile without a custom event.

```javascript
posthog.setPersonProperties(
    { name: 'Max Hedgehog' }, // $set properties
    { initial_url: '/blog' }  // $set_once properties
)
```

| Job | Web | Node |
|---|---|---|
| Set | `posthog.setPersonProperties(set?, setOnce?)` | `client.setPersonProperties({ distinctId: 'distinct_id', properties: { name: 'Max Hedgehog' }, propertiesOnce: { initial_url: '/blog' } })` |
| Unset | `posthog.unsetPersonProperties('email')` (`string \| string[]`; ignored under `person_profiles: 'never'`) | `client.unsetPersonProperties({ distinctId: "distinct_id", properties: ["email"] })` |

- **Other SDKs** send a `$unset` array. On web, `$fbc` and `$fbp` read by the SDK are unset for that call only; `save_campaign_params: false` stops the reads.
- **`$set` and `$set_once` aren't stored on events:** they only update person data during ingestion, so you can't filter, break down or query events by them. Query person properties, e.g. `person.properties.your_property` in SQL.
- **Values:** strings, booleans, numbers, objects, arrays. Limit **512KB** per person record (combined); over-limit updates are rejected with an ingestion warning.
- **Warehouse properties:** Data > Warehouse properties > Add person property; map a distinct ID column plus column mappings. Updates only existing persons.
- **Backend enrichment without touching last seen:**

```javascript
client.capture({
  distinctId: "distinct_id",
  event: "backend_enrichment",
  properties: {
    $update_person_last_seen_at: false,
    $set: {
      enriched_property: "value",
    },
  },
});
```

- **Defaults set by posthog-js:** `utm_campaign`, `utm_content`, `utm_medium`, `utm_source` (last touch), `$browser`, `$browser_version`, `$initial_browser`, `$initial_browser_version`, `$initial_current_url`, `$initial_device_type`, `$initial_os`, `$initial_pathname`, `$initial_referrer`, `$initial_referring_domain`, `$initial_utm_*` (first touch), `$os`, `$referrer`, `$referring_domain`.
- **GeoIP (on by default):** `$geoip_city_name`, `$geoip_continent_code`, `$geoip_country_code`, `$geoip_country_name`, `$geoip_latitude`, `$geoip_longitude`, `$geoip_postal_code`, `$geoip_subdivision_1_code`/`_name`, `$geoip_subdivision_2_code`/`_name`, `$geoip_time_zone`, plus `$initial_geoip_*`.

## Cookieless tracking

- **Enable "Cookieless server hash mode"** in Project Settings > Web analytics.
- **No banner:** `posthog.init("<token>", { cookieless_mode: "always", api_host: "https://us.i.posthog.com", defaults: "2026-05-30" })`.
- **With a banner:** `cookieless_mode: "on_reject"`. Show the banner when `posthog.get_explicit_consent_status() === "pending"` (returns `'granted' | 'denied' | 'pending'`); on the user's choice call `posthog.opt_in_capturing()` or `posthog.opt_out_capturing()`, which sets the mode and hides the banner.
- **How it identifies:** `hash(team_id, daily_salt, ip_address, user_agent, hostname)`. The daily salt is deleted after the day's events are processed; the hash is not Personal Data.
- **Identity limits:** users without consent appear as new people each day (inflated weekly and monthly uniques, no cross-device without identify); hash collisions for the same IP and user agent (e.g. a corporate network); session replay and surveys are disabled without consent; no cached flags (a delay unless bootstrapped); no GeoIP or bot detection (the IP is stripped before transformations, so the Web Analytics world map is empty). The first-party cookie works across subdomains.

## Group analytics

Groups aggregate events by an entity such as a company or project. People and groups are connected by events, not membership lists, so one person can be in several groups of a type. It is a paid add-on, not on the open-source or free cloud plan; once subscribed, billing applies to ALL identified events in the project from when it's enabled on the billing page, and stops on unsubscribe (code can stay). If you only need a list of users, use a cohort instead: cohorts are built in PostHog with no code.

- **Web, associate the session:** `posthog.group('company', 'company_id_in_your_db')` sends `$groupidentify`, creates the type if needed, associates all subsequent events with the group and reloads feature flags. Or add `'$groups': { 'company': '...' }` to one capture.
- **Web, set group properties (recommended):** `posthog.group('company', 'company_id_in_your_db', { name: 'PostHog', subscription: "subscription", date_joined: '2020-01-23' })`. Alternative: `posthog.capture('$groupidentify', { '$group_type': 'company', '$group_key': ..., '$group_set': {...} })`, which doesn't associate the session.
- **Web helpers:** `getGroups()`, `resetGroups()`.
- **Node:** `posthog.groupIdentify({ distinctId: 'user_distinct_id', groupType: 'company', groupKey: 'company_id_in_your_db', properties: {...} })`, then every event that should link passes `groups: { company: 'company_id_in_your_db' }`. Group-only events use `distinctId: 'static_string_for_group_events'`.
- **Other SDKs** pass groups on each event.
- **Linking rules:** events must be identified to link to groups; `$process_person_profile: false` events won't link. One event can't belong to two groups of the same type, but can belong to groups of different types.
- **Naming:** singular type names ("company", not "companies"); unique IDs as keys, not names. A group needs at least one property to show in the People and groups tab; the UI shows the `name` property (falls back to the key).
- **Flags with groups:** on web call `posthog.group()` earlier in the session, then `posthog.isFeatureEnabled('new-groups-feature')`. On Node:

```javascript
const flags = await posthog.evaluateFlags('user_distinct_id', {
    groups: { company: 'company_id_in_your_db' },
})

if (flags.isEnabled('new-groups-feature')) {
    // Toggle feature-flag specific behavior
}
```

- **Insights:** "Unique" with a group type; funnels "Aggregating by" a group type.
- **Managing types:** rename or delete in Settings > Customer Analytics. Deleting keeps the event data (filtered by deletion timestamp) and frees a slot; new events with the same key recreate the type.

| Limit | Value |
|---|---|
| Group types per project | 5 |
| Groups per type | Unlimited |
| Delete individual groups | Not possible |
| Cohorts from groups | Not possible |
| Related people and groups tabs | Last 90 days |
| Lifecycle insights, user paths | Group types not supported |

## Symptoms

| Symptom | Cause |
|---|---|
| Flags differ before and after login | The hash input changed |
| A user is in both control and test of an experiment | Two unlinked persons, each assigned independently |
| Exposure exists but conversion is missing | Exposure on the anonymous ID, conversion on the identified ID |
| Replay recording breaks at login | `distinct_id` changed mid-session without linkage |
| Funnels attribute a conversion to the wrong user | Events split across unlinked persons |
| Error Tracking shows phantom users with one error each | Transient IDs creating a new person per error |
| Duplicate persons, inflated cohorts | Missing `identify` on a device, or different IDs without `alias` |
| Ingestion warning "Refused to merge an already identified user" | Merging two identified profiles |
| Merge silently doesn't happen | A blocked ID value |

In every case the fix is upstream: put the right identity strategy in place and link IDs before the events that need to be connected.

## Prove it

- One person per email in People; the person's Distinct IDs tab lists both the anonymous and identified IDs.
- A `$identify` event carries both IDs, and events from every SDK (web, server, mobile) sit on one person timeline.
- After logout and login as a second user on the same browser, the second user is a separate person.
- The same `distinct_id` string reaches the server (check the `X-POSTHOG-DISTINCT-ID` header) and server events land on the same person.
- A flag evaluated before and after login returns the same variant.
- No server event uses a constant ID like `"system"`; batch jobs show one random ID per run with `$process_person_profile: false`.
- With groups on, a group shows in People and groups with its `name` property, and grouped events are identified.
