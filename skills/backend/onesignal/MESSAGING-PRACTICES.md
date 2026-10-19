# Messaging practices

How to write, time and pace push notifications so they get delivered, seen and clicked without burning out the audience, and how to earn the push permission in the first place. Most outcomes come down to three things: whether the user said yes at a moment that made sense to them (iOS lets you show the system prompt once), whether each message is relevant to the people it reaches (broad segments and frequency without a content reason lower CTR), and which delivery control wins when several are set (throttling overrides Intelligent Delivery and timezone delivery; frequency capping drops messages, it never queues them). Segments are in [SEGMENTS.md](SEGMENTS.md), Journeys in [JOURNEYS.md](JOURNEYS.md), in-app soft prompts in [IN-APP-MESSAGES.md](IN-APP-MESSAGES.md), Live Activities in [LIVE-ACTIVITIES.md](LIVE-ACTIVITIES.md), email and SMS in [EMAIL-AND-SMS.md](EMAIL-AND-SMS.md), Liquid and templates in [PERSONALIZATION.md](PERSONALIZATION.md), reports and CTR in [ANALYTICS-AND-PRIVACY.md](ANALYTICS-AND-PRIVACY.md).

**Contents:** [Audience and schedule](#audience-and-schedule) · [Delivery time per user](#delivery-time-per-user) · [Push content limits](#push-content-limits) · [Payload, priority, TTL, replacing](#payload-priority-ttl-replacing) · [iOS interruption levels and relevance](#ios-interruption-levels-and-relevance) · [Throttling](#throttling) · [Frequency capping](#frequency-capping) · [How often to send](#how-often-to-send) · [Mobile push permission](#mobile-push-permission) · [Web push permission](#web-push-permission) · [Web push browser behavior](#web-push-browser-behavior) · [A/B testing and retargeting](#ab-testing-and-retargeting) · [API rate limits and app disablement](#api-rate-limits-and-app-disablement) · [Auditing a messaging program](#auditing-a-messaging-program) · [Prove it](#prove-it)

## Audience and schedule

- **No segment means everyone subscribed.** The audience defaults to all "Subscribed Users"; include and exclude segments to narrow it. Filters and Aliases targeting are API only, not in the dashboard.
- **Schedule up to 30 days ahead** with `send_after`, or send immediately.
- **The send time is the audience cutoff.** OneSignal evaluates audience membership at that moment, and anyone in the audience receives the message regardless of per-user optimization settings.
- **Test on test users or a single-user segment.**
- **Cancel only works before Delivered** (Message Report Actions > Cancel, or the Cancel Message API), and it does not remove notifications already on devices. After delivery, the only way to replace a notification is a Collapse ID or a Web push topic.

## Delivery time per user

| Option | Behavior | API |
|---|---|---|
| Everyone at the same time | Best for urgent messages | (default) |
| Intelligent Delivery | Sends at the optimal time for each user based on their session activity | `delayed_option: last-active` |
| Custom time per timezone | Same local time for everyone | `delayed_option: timezone` + `delivery_time_of_day` |

- **Per-user delivery spans 24 hours.** With Intelligent Delivery or Custom time per timezone, every record in the audience gets a chance to receive it. If it is already 10 AM for a recipient when a 9 AM local-time message sends, they receive it at 9 AM the following day.
- **Pick by use case:** send immediately for time-sensitive messages (breaking news); timezone for the same local time (a TV episode at 3 PM local); Intelligent Delivery to reach each user at their most active hour. Event reminders count back from the event's start (confirmation immediately, T-1 day, T-1 hour, T-5 minutes with the join link) [coreyhaines31/marketingskills, events]; timezone delivery would move each to the same local clock time instead, so send them immediately at each step.
- **Sources disagree on what Intelligent Delivery uses.** The current push docs say "session activity" and the email docs say "open and click activity (excludes bot activity)"; a 2019 OneSignal blog post says it uses "up to three months of historical data" of when a user used this and other OneSignal apps and sites. Confirm in the current docs.
- **Throttling disables both** (see [Throttling](#throttling)).

## Push content limits

| Field | API | Rule |
|---|---|---|
| Title | `headings` | Required for web push and Huawei; defaults to the site name on web. Recommended 25 to 35 characters (mobile), 60 to 80 (web) |
| Subtitle | `subtitle` | iOS and macOS only; recommended 25 to 50 characters |
| Message | `contents` | Required unless background; no custom fonts or styling; recommended about 150 characters |
| Image | `ios_attachments`, `big_picture`, `chrome_web_image` | Recommended `1024×512px` (2:1); max 1 MB, max width 2000 px; PNG, JPG, GIF (animated only on iOS); not supported on Safari (macOS, iOS) or macOS Notification Center |
| Icons | | Small and large on Android and web; iOS always uses the app icon |
| Action buttons | | Android 4.1+ and iOS 8.0+ |
| Launch URL | `url` (universal), `app_url` (deep link, e.g. `your-app://screen`), `web_url` | |
| Badges | iOS `ios_badgeType`, `ios_badgeCount`; Huawei `huawei_badge_class`, `huawei_badge_set_num`, `huawei_badge_add_num`; Chrome on Android `chrome_web_badge` | Android needs notification categories; the Chrome badge is a square PNG 96×96 (min 72×72) |
| Sound | iOS `ios_sound` | Android via categories; not available on web |

- **Truncation is not yours to control.** Push platforms do not truncate at a fixed character count: it depends on device, orientation, system text size and the Android launcher or manufacturer, and no API or payload option can override it.
- **Host images on a CDN.** A self-hosted image costs one HTTP request to your server per delivered notification.

## Payload, priority, TTL, replacing

- **Background (data-only) pushes** omit `headings` and `contents`, set `content_available` to `true` on both iOS and Android, and may carry `data`.
- **Payload is a hard limit set by APNs and FCM:** max total payload about 4 KB, the `data` field up to 2048 bytes. Exceeding it may cause notifications to be truncated or rejected. The dashboard only takes simple key-value data; use the API `data` field for nested JSON.
- **Priority:** High `10` (default and recommended) for alerts; Normal `5` recommended for background and data-only. API `priority`.
- **TTL:** default 3 days; range 0 to 2,419,200 seconds (28 days). Use `ttl: 0` for messages that should never be delivered late. While a device is offline, APNs stores only the most recent notification.
- **Replace instead of stacking:** `collapse_id` (mobile, max 64 chars) replaces earlier notifications with the same id; `web_push_topic` (max 64 chars) does the same on web, and unique topics keep web notifications independent.
- **Grouping:** Android and iOS auto-group after 4 or more; set iOS `thread_id` or Android `android_group` to group yourself.
- **Huawei `huawei_msg_type`:** `data` lets the SDK render it (full features, confirmed delivery) but it is not shown if the app was force quit, and it is "not a silent notification"; `message` (default) is rendered by HMS (title and body) and shows even after force quit.

## iOS interruption levels and relevance

| `ios_interruption_level` | Behavior |
|---|---|
| `"active"` | Default |
| `"time-sensitive"` | Breaks through Focus and scheduled delivery. Use only when urgent |
| `"passive"` | No sound, does not break Focus |
| `"critical"` | Bypasses everything; requires Apple approval (entitlement `com.apple.developer.usernotifications.critical-alerts`) and a separate user opt-in. Request critical permission after standard push permission |

- **Relevance score `ios_relevance_score`** (0.0 to 1.0, requires the Notification Service Extension) sorts your app's notifications: the highest score gets featured in the Notification Summary. Reserve `1.0` for the most critical messages: overusing high scores makes the system ignore the distinction. Examples: DMs 1.0, daily reminders 0.6, promos 0.2.

```bash
curl --request POST \
 --url 'https://api.onesignal.com/notifications?c=push' \
 --header 'Authorization: <authorization>' \
 --header 'Content-Type: application/json' \
 --data '{
     "app_id": "YOUR_APP_ID",
         "include_aliases": {
             "external_id": ["EXTERNAL_ID"],
         },
         "contents": {
             "en": "English Message"
         },
         "ios_relevance_score": 0.5
 }'
```

## Throttling

Throttling spreads one send over time so the traffic it causes (app opens, image fetches) does not overload your servers.

- **Enable it globally first:** **Settings > Push & In-App > Throttling**. It then applies to all pushes; each message has an override box (enter "0" to disable for that message). API `throttle_rate_per_minute`.
- **Only for the Create notification API and Messages > New Push.** Not supported for Journeys.
- **Throttling takes precedence over Timezone and Intelligent Delivery:** OneSignal ignores them for that notification. To use them, set the override to "0" / `throttle_rate_per_minute: 0`.
- **The rate rounds down per second:** per-minute / 60, rounded down. 1,019/min becomes 16/s, so 960/min actual.
- **24-hour window:** a throttled send must complete in 24 hours, and OneSignal raises the rate automatically (10/min for 20,000 users would take about 33 h, so it runs at about 14/min).
- **Other load OneSignal puts on you:**
  - Simultaneous app opens: throttle or auto-scale.
  - Event Streams webhooks: OneSignal does not rate-limit outbound Event Stream traffic, so use queue destinations (Kinesis, Pub/Sub).
  - Journey webhooks are not affected by throttling: respond `200 OK` fast and defer work to the background; `429` responses can make OneSignal disable the webhook.
  - Service worker fetches: serve `OneSignalSDKWorker.js` from a CDN with cache headers.

## Frequency capping

- **Available on select paid plans.** Enable at **Settings > Push & In-app > Frequency Capping**.
- **Rolling windows only:** per minute, hour, day (rolling 24 h), week (rolling 7 days); never calendar boundaries.
- **Push only** (not email, SMS or in-app), but for every push source: Create notification API, Journeys and the dashboard.
- **Capped messages are dropped, not queued. They are never retried.**
- **Override per message:** dashboard "Override frequency capping settings", API `"enable_frequency_cap": false`. Overrides only matter when capping is enabled, and overridden messages still count toward the cap.
- **Reporting:** each message shows Capped (users skipped) and Overridden counts in the dashboard report and the View message API.
- **Use it when** several teams or overlapping campaigns reach the same users, or for high-frequency triggers (stock prices, automated news).

## How often to send

- **There is no universal limit:** frequency tolerance varies by platform, vertical and content type. Increasing frequency without a content reason often lowers CTR. Use segmentation and frequency capping instead of sending everything to everyone.
- **Send to all users at least once or twice a month** so unsubscribes are detected gradually. Detection happens on app open (the SDK, immediately) or on send when the push service rejects the token, which typically takes 2+ messages.
- **Chromium revokes permission for noisy, low-engagement sites.** Since October 2025 it automatically revokes push permission for users with low site engagement (about 30 days of inactivity) who receive a high volume of notifications.
- **News publishers (2019 report):** most outlets send 4 to 10 alerts a day, some 16. Give each alert context, send in pulses with events, and offer segmented opt-in topic channels so less-engaged readers are not over-alerted.
- **Content levers:** relevance (category slidedown, Data Tags, segments), timing (Intelligent Delivery), content (images, emojis, personalization). Put emojis at the start or end and avoid ambiguous ones.

## Mobile push permission

Prompt strategy, provisional notifications, in-app configuration, the funnel and examples are owned by [PERMISSIONS.md](PERMISSIONS.md#mobile-in-app-soft-prompt).

## Web push permission

Prompt types, code, Bell, native browser restrictions and back-off are owned by [PERMISSIONS.md](PERMISSIONS.md#web-prompt-types).

## Web push browser behavior

Permission states, browser-closed source qualifications and the first-visitor test are maintained in [PERMISSIONS.md](PERMISSIONS.md#web-push-browser-behavior).

## A/B testing and retargeting

- **Campaign A/B tests are dashboard only** (not available with the API), for push and email. Professional and Enterprise get up to 10 variants, Free and Growth 2.
- **Split:** by default 25% of the audience gets the test, split evenly (25% over 10 variants is 2.5% each). Any percentage other than 100% lets you pick a winner for the rest; there is no automatic winner, you choose it manually.
- **Run it properly:** set benchmarks and a hypothesis, change one variable at a time, keep a control (a random tag plus an exclude segment), send the variants simultaneously.
- **Segments cannot be A/B tested** in the standard form; use Journey Split or Yes/No branches ([JOURNEYS.md](JOURNEYS.md)).
- **Retargeting** (push only, dashboard only) builds a new send from a message's Audience activity within **30 days**: Sent, Confirmed Receipt, Did Not Confirm Receipt, Clicked, Did Not Click, Failed, Unsubscribed. It is not retroactive after a plan upgrade, and API and automated messages are deleted after about 30 days. For the API, capture the outcome as a tag and target a segment.

## API rate limits and app disablement

The request limits, rolling application message limit and disable/re-enable behavior are owned by [REST-API.md](REST-API.md#rate-limits-and-message-limits); retry strategies and idempotency are owned by [Retries and idempotency](REST-API.md#retries-and-idempotency).

## Auditing a messaging program

- **Baseline first:** comparable periods, the same eligible audience, consistent event definitions. Compare against your own dashboard, not an industry benchmark.
- **Audit in order:** delivery, then targeting, then cadence, then content, then channel fit.
- **Cadence signal:** a histogram of messages received per user per week over 30 days. When the top decile gets 3 to 4 times the median, fatigue opt-outs may concentrate there.
- **Map every campaign and Journey that reaches the same user** (entry, waits, exits, suppression). Review segments not referenced in 90 days. Spot-check the personalization fallbacks of your top 5 templates. Test the full deep-link destination.
- **Change one thing** with a hypothesis, a success metric and a guardrail metric (e.g. opt-outs).
- **Channel roles:** push for time-sensitive, email for visual or long, in-app for contextual messages to active users, SMS/RCS for consented direct messages, Live Activities for ongoing changing information. Consent is separate per channel: a yes to push doesn't carry over to texts. For texts: "If it could wait 24 hours, send it via email" [coreyhaines31/marketingskills, sms]; see [sms-marketing CHANNEL-AND-COPY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sms-marketing/CHANNEL-AND-COPY.md#when-sms-beats-email).

## Prove it

- **Delivery controls:** if throttling is enabled globally, a message meant for Intelligent Delivery or timezone delivery has `throttle_rate_per_minute: 0`, and a message that must bypass capping sets `"enable_frequency_cap": false`.
- **Payload:** `data` is under 2048 bytes and the total under about 4 KB; data-only sends omit `headings` and `contents`, set `content_available: true` and priority `5`.
- **Images** come from a CDN, are at most 1 MB and 2000 px wide.
- **Permission:** no `requestPermission()`, `optIn()`, native `requestAuthorizationWithOptions` or Android `requestPermissions` runs on app start; the soft prompt's report after 1 to 2 weeks shows impressions, clicks and the system prompt result.
- **Web:** after resetting permission and site data, the prompt appears only after the configured page views and seconds, and a test push reaches the subscription added to Test Users.
- **Retries:** every send retry reuses its `idempotency_key`, and no code path sends one request per user in a loop.
- **Frequency:** the per-message Capped count and the weekly messages-per-user histogram show no group getting 3 to 4 times the median.
