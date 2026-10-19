# Segments

A Segment is a dynamic group of Subscriptions defined by filters, and it updates automatically as users interact with the app or site. Three things to get right: which filters the Segment uses (subscription properties, or message and custom events, which change what can be combined with it and how its count is shown), what each channel does with unsubscribed Subscriptions in it, and whether the data the filters read (tags, sessions, events) was sent in the right shape. Identity (External ID, users and Subscriptions) is in [USER-MODEL.md](USER-MODEL.md); the Create Segment and Create Custom Events endpoints are in [REST-API.md](REST-API.md); sending to a Segment well is in [MESSAGING-PRACTICES.md](MESSAGING-PRACTICES.md).

**Contents:** [How it works](#how-it-works) · [Creating Segments](#creating-segments) · [Filters](#filters) · [Combining Segments](#combining-segments) · [Counts](#counts) · [Sessions](#sessions) · [Tags](#tags) · [Time Operators](#time-operators) · [Custom Events](#custom-events) · [Message events](#message-events) · [User-based segmentation (coming soon)](#user-based-segmentation-coming-soon) · [Limits](#limits) · [Building a Segment for someone](#building-a-segment-for-someone) · [Anti-patterns](#anti-patterns) · [Prove it](#prove-it)

## How it works

- **Segments are Subscription-based today.** A subscription-based Segment filters on subscription attributes: device type, language, app version, tags, country, location, session activity.
- **Event-based Segments** contain message event or Custom Event filters. They make all of the user's Subscriptions eligible.
- **Each channel treats status differently.** Push, email and SMS go only to opted-in (subscribed) Subscriptions. In-app messages display to all mobile Subscriptions in the Segment regardless of status. In Journeys, the Segment resolves its Subscriptions to Users regardless of status, and matching users enter the Journey.
- **No filters means every user.** A Segment with no filters selected can default to every user of the app. Avoid it unless the user explicitly wants all users.
- **Words that mean a Segment:** "audience", "cohort", "targeting group" or "suppression group" likely mean a Segment, unless the user means a static CSV import, a one-time recipient list, or a dynamic API filter on a single message.

## Creating Segments

- **Three ways:** the dashboard (**Audience > Segments**), the Create Segment API, or a CSV import.
- **Description** holds up to 255 characters.
- **The public API covers fewer filters.** Create Segment API filters: tag, last session, first session, session count, session time, language, app version, location, country. Message-event or custom-event Segments created in the dashboard may not be fully supported by the public Create/Update Segment APIs.
- **You cannot hand-add users to a Segment.** Tag them and filter on the tag. The CSV importer has an "Automatically create a Segment" option.
- **Set a default Segment** to reduce targeting mistakes.
- **Deleting a Segment does not delete users.**

## Filters

| Filter | Notes |
|---|---|
| First session | Equals `created_at`. |
| Last session | Session activity; see [Sessions](#sessions). |
| Session count | |
| Usage duration | Recorded only when a session is longer than 60 seconds. |
| Language | Device language; see [PERSONALIZATION.md](PERSONALIZATION.md) for language codes. |
| App version | Android `versionCode`, iOS `CFBundleShortVersionString`. Combine with Device type. |
| Device type | "is any of" / "is not any of". |
| User tag | String values; see [Tags](#tags). |
| Location | Radius, at least 1 meter, up to 2 decimal places. |
| Country | From the last IP, ISO 3166-1 alpha-2. |
| Test users | |
| Message event | See [Message events](#message-events). |
| Custom event | See [Custom Events](#custom-events). |

- **AND is the default; OR must be explicit.** Filters combine with AND/OR.
- **Message event filters** target interactions by channel: sent, delivered, opened, clicked, bounced, failed, suppressed, reported spam or received, depending on the channel.
- **Custom event filters** target meaningful actions tracked in the app, website, integrations or API.

## Combining Segments

- **Outside Journeys, event-based and plain Segments do not mix.** You cannot include or exclude event-based Segments (custom event or message event) together with Segments that have no event filters.
- **Dashboard versus API:** in the dashboard you can send custom event Segments and message event Segments together. The API accepts message event Segments only with other message event Segments, and custom event Segments only with other custom event Segments.
- **Inside Journeys any combination works.**

## Counts

- **Counts include subscribed and unsubscribed Subscriptions,** for transparency.
- **Counts return within about 15 seconds.** Big or complex Segments show estimates: `140,000 +/- 5,000` above 10,000, `<4,800` below. Estimates are never 0. Label estimates clearly when you report a count.
- **Event-based Segments have no live estimate in the editor.** Their counts appear on the Segments page after processing.
- **User-based Segment counts may not be available** in all contexts.

## Sessions

- **A new session** is an app open from closed, or after at least 30 seconds in the background.
- **Sessions are collected from push Subscriptions only** and aggregated per user.
- **API fields:** `user.properties.first_active`, `user.properties.last_active`, `subscription.session_count`.
- **The mobile last session decides MAU billing.**
- **In-app messages are evaluated at session start** (see [IN-APP-MESSAGES.md](IN-APP-MESSAGES.md)).

## Tags

The string representation, restricted keys, identity, plan limits and SDK write lifecycle are owned by [USER-MODEL.md](USER-MODEL.md#tags). Avoid PII in tag-derived criteria; Time Operators below own timestamp targeting.

## Time Operators

- **Paid plans only.**
- **Store a Unix timestamp in seconds** (10 digits, not milliseconds) as a string tag. `time_elapsed = current_time - tag_timestamp`.
- **Time Elapsed Greater Than** takes a positive value for "after a past event" and a negative value for "before a future event".
- **Add an upper limit** (for example, more than 24 hours AND less than 48 hours), or users stay in the Segment forever.
- **The same seconds tag works in Liquid.** A tag such as `bill_due: 1687968776` works for both the Liquid `date` filter and Time Operator segmentation.
- **Birthday pattern:** Journey re-entry of **52 weeks**, and update the tag after the send.

```javascript
// SDK example
const timestampSeconds = String(Math.floor(Date.now() / 1000));
OneSignal.User.addTag("current_time", timestampSeconds);
```

## Custom Events

- **Prefer Custom Events over Tags in most cases.** Custom Events are more powerful than Tags.
- **Paid plans.** Custom Events come only from your SDK or the Create Custom Events API; the dashboard cannot fire one.
- **Uses:** Journey entry and exit, Wait Until, personalization (`{{ journey.first_event.properties.item }}`), Conversion Metrics (cross-channel last-touch; "Track a value for each event"), and Segments (these need storage).

| Field or limit | Value |
|---|---|
| `name` | max `512` bytes |
| Event payload | max 2024 bytes |
| Request | max 1 MB |
| `idempotency_key` | UUID |
| `timestamp` | ISO 8601; used by time filters, otherwise receipt time |
| Identity | API requires either `external_id` or `onesignal_id` |
| Unique event names | up to **1,000** per app; a warning past 900; new names past the limit are rejected per event (HTTP `202`, `errors` array, code `too many event names`) |
| Appears on profile | up to 5 minutes |
| Hourly limit (storage) | 60 events per user per event name per hour, by event `timestamp` |

- **Put variable data in properties, not names.**
- **Name events in snake_case and past tense** (`signup_completed`, `cart_updated`, `payment_failed`). Keep names stable; do not rename events that Journeys depend on.
- **Send numbers as numbers.** A string `"84.5"` never matches `greater than 50`; numeric filters fail silently.
- **Property filters are exact and case sensitive.** Use the same property names on every event.
- **One Segment filter cannot combine properties from two events.**
- **Keep PII out of event properties;** use anonymized IDs.
- **Do not fire the same event from both the SDK and a backend** unless it is deduplicated with `idempotency_key`.

### Storage

- **Storage is needed only for Segments and user profiles.** Journeys, Conversions and Liquid work without it.
- **Retention:** max 90 days, with a per-event override of the app default. Shortening retention deletes already-stored data (overnight).
- **Included stored events per month (organization level):** Growth 1,000,000, Professional 5,000,000, Enterprise 10,000,000. Sending events is free.
- **Rollout:** storage is "coming soon to all apps".

## Message events

- **Window:** last 24 hours to last 90 days, or `between` (days ago), with min, max or exact counts.

| Channel | Trackable events |
|---|---|
| Push | Delivered, Confirmed Receipt, Clicked, Failed |
| SMS | Delivered, Read, Failed |
| Email | Delivered, Opened, Clicked, Bounced, Failed, Suppressed, Reported as spam |
| In-App | Impression, Clicked |

- **Retention:** Growth 30 days, Professional 60 days, Enterprise 90 days. For Free, the message-events page says "Not available" and the billing FAQ lists only paid plans; segmentation still uses events regardless of plan. Confirm in the current docs.
- **Stored since April 14, 2026;** older events are still usable in segmentation.
- **Up to 5 minutes of latency.** Use Event Streams for long-term storage.
- **Channel conflict:** when a Segment depends on a channel that is unavailable, not configured, or unlikely to have native engagement data (SMS, for example), offer to use an enabled channel, use custom events or tags instead, or continue anyway.

## User-based segmentation (coming soon)

The docs call user-based segmentation "coming soon" and not available yet; existing Segments auto-convert on early access. The vendor Segments skill describes User-based Segments as a current type ("User-based Segments use user-level filters such as message events and custom events"; "User-based Segment counts may not be available in all contexts"). Confirm in the current docs. How the docs say it will behave:

- **A user enters with all Subscriptions** if one Subscription matches AND the user has at least one subscribed Subscription.
- **AND filters must match the same Subscription.**
- **App Version must pair with Device Type.**
- **Without Subscription filters, a push reaches every push Subscription of each user:** an iOS-filtered Segment still sends to Android and web.

## Limits

- **Segment count is plan-dependent** (see the pricing page). Only **active** Segments count; paused Segments do not.
- **"Targeting a paused segment will fail."**

## Building a Segment for someone

- **Collect, most important missing decision first:** purpose, Segment type or filter family, criteria, time window (for behavior or event criteria), match logic, name.
- **Purpose options:** send a campaign or newsletter; suppress or exclude people; track or analyze an audience; re-engage inactive users.
- **Criteria options:** user behavior or activity; message engagement; user tags or attributes; location, language, app version or device properties.
- **For campaign targeting, clarify include or exclude.**
- **For behavioral Segments, ask for a timeframe** if it is missing.
- **Define vague words before filtering.** "Engaged": opened a message, clicked a message, opened and clicked, or performed a custom event. "Inactive": no recent app or website session, no recent message opens or clicks, no recent purchase or conversion event, or no recent custom event, and over what timeframe. "VIP": value, a tag or tier, purchase behavior, or engagement.
- **With several conditions, clarify AND or OR.**
- **Suggest a clear name** if none is given.
- **Inspect before acting:** list existing Segments when one is named; inspect a Segment before explaining or changing it; preview or validate counts before creating, if supported; inspect channel setup when the Segment depends on channel engagement.
- **Summarize in plain language and get explicit approval before creating:** name, purpose, type, filters, time window, match logic, assumptions, limitations or warnings.

## Anti-patterns

- Asking the user for raw Segment API fields.
- Asking every question upfront.
- Guessing "engaged", "inactive" or "VIP" when the meaning changes the Segment.
- Creating a Segment with no filters.
- Creating without a summary and approval.
- Inventing filters.
- Tags for identity (use External ID), tags holding arrays or JSON (use Custom Events), numbers sent as strings in event properties.

## Prove it

- **Count check:** the new Segment returns a count within about 15 seconds (or, for an event-based Segment, on the Segments page after processing), and any estimate is labeled as one.
- **Not empty by accident:** the Segment has at least one filter unless the user asked for all users.
- **Combination check:** an API send never mixes an event-based Segment with a plain one, or message event Segments with custom event Segments.
- **Numeric filters match:** a test event with a numeric property (sent as a number) and a tag sent as `"42"` both satisfy a `greater than` filter.
- **Time Operator bounded:** every Time Elapsed filter has an upper limit, and the tag is 10 digits.
- **Not paused:** the Segment you target is active.
- **Event names:** the app stays under 1,000 unique event names, and no request returned `too many event names`.
