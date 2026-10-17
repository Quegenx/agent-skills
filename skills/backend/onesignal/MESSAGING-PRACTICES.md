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
- **Pick by use case:** send immediately for time-sensitive messages (breaking news); timezone for the same local time (a TV episode at 3 PM local); Intelligent Delivery to reach each user at their most active hour.
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

The system prompt can be shown **once on iOS and twice on Android (Google and Huawei)**; after that the user must re-enable notifications in system settings. Apple and Google both recommend explaining the value before asking.

- **Ask after a value moment.** Prompting on first launch is the single biggest cause of low opt-in rates (the exception: apps whose value is obvious within seconds, such as ride-hailing). Be specific about what they will get ("Get a heads-up the moment your order leaves the kitchen. That's it, no promos.").
- **Most iOS apps should combine provisional notifications with an in-app soft prompt; most Android apps should start with the soft prompt.** Provisional is often the highest-conversion path on iOS and the default starting point.
- **Explain value with an in-app soft prompt.** Dismissing it does not consume a system prompt attempt, so re-ask users who declined it (for example every 2 weeks). Iterating on copy and timing routinely shifts opt-in rates by tens of percentage points.
- **Three approaches:**
  - In-app soft prompt: recommended and the default; needs no code release.
  - Programmatic `requestPermission()` / `optIn()`: for preference centers and profile screens.
  - Provisional: iOS only.
- **Remove every other prompt first.** The soft prompt needs the `OneSignalInAppMessages` package. Remove `requestPermission()` / `optIn()` on app start, native `requestAuthorizationWithOptions` (iOS), Android `requestPermissions`, and any code that generates push tokens directly.
- **The Push Permission Prompt click action** auto-filters to unsubscribed users (in-app messages with it are not shown to users who already allowed notifications), and for a user who already declined the maximum number of times it opens the app's notification settings, like `requestPermission(fallbackToSettings: true)`.
- **Triggers, lowest to highest conversion:** on app open (rarely optimal); after session time (a good default); on a specific user event (best for conversion); programmatically via the in-app trigger SDK methods. Tip: trigger the soft prompt right after a user opens or acts on a provisional notification.
- **Schedule:** Only once converts poorly, Every time is too aggressive; use Multiple times, e.g. `20` per user with a `2 weeks` gap. Loosen to `30 days` or `60 days` for lower-engagement or utility apps.
- **Programmatic calls:** pass `fallbackToSettings: true` to `requestPermission()`. If the user opted out via `optOut()` (`notification_types: -2`), `requestPermission()` alone will not change the status; call `optIn()`, which requests permission and clears the opt-out.
- **Measure the funnel:** in-app message click listener (button tapped), in-app message lifecycle listener (impressions, dismissals), push permission observer (system prompt result).
- **The native system prompt cannot be customized.** Android shows a runtime permission only on Android 13 (API 33)+; since August 31, 2023 Play requires target API 33+; Android 12 and lower grant automatically.

### iOS provisional (Direct-to-History)

- **What it does:** iOS 12+ delivers quietly to Notification Center only (no banner, sound or lock screen); the user can choose Deliver Quietly or Turn Off. Requires OneSignal SDK 2.9.0 or newer. With it on, all iOS Subscriptions start as Subscribed.
- **Enable it:** **Settings > Apple iOS > Advanced Configuration > Enable iOS 12 direct to history** (unchecked by default).
- **A denied regular prompt stops provisional too.** If you prompt for regular permission and the user denies, provisional notifications stop.

### Example onboarding strategy

1. **iOS only:** enable direct to history and send 2 to 3 high-quality notifications in the first week. Android and Huawei skip this phase.
2. **Soft prompt** in **Messages > In-App**: audience **Show to all users** (the Push Permission Prompt click action filters to unsubscribed), trigger on a high-signal event or 5 minutes of session time, schedule **Multiple times** with max `20` per user and gap `2 weeks` (about 10 months).
3. **After 1 to 2 weeks** check the report, instrument the funnel with the SDK listeners, and change one variable at a time.

## Web push permission

Browsers highly recommend that websites be more selective with the native prompt. OneSignal soft prompts (slidedown, email/phone, bell, custom link) run before the native prompt; they do not subscribe anyone by themselves.

- **Set up prompts** at **Settings > Push & In-App > Web Settings > Permission Prompt Setup > Add Prompt**, or in custom code with `promptOptions` in `init` (`slidedown`, `text`, `categories`, `type` = `email` | `sms` | `smsAndEmail`, `customlink`, `autoPrompt`, `delay`) and the bell via `notifyButton`.
- **Default icon:** **Settings > Push & In-App > Web**; PNG, JPG or non-animated GIF; recommended `256×256`; without it a generic bell shows.
- **Slide prompt text:** action message up to 90 characters, button labels up to 15; font, size and colors are not customizable.
- **Categories:** up to 10, each stored as a Data Tag `1`/`0`, key convention `cat_<category>` (e.g. `cat_breaking_news`).
- **Bell:** the icon image cannot change and it cannot sit in the top corners; it cannot be disabled per page. Hide it with `displayPredicate` returning `false` (or a Promise of false), e.g. `return !OneSignal.Notifications.permission`. Its default accessible name "Manage notifications" is set via `launcher.button.aria-label`. It suits returning visitors and those who dismissed a prompt.

```html
<script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
<script>
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  OneSignalDeferred.push(function(OneSignal) {
    OneSignal.init({
      appId: "YOUR_APP_ID",
      notifyButton: {
        enable: true,
        size: 'medium',
        theme: 'default',
        position: 'bottom-right',
        showCredit: false,
        displayPredicate: function() {
          return !OneSignal.Notifications.permission;
        }
      }
    });
  });
</script>
```

(Trimmed from the full docs example: the `offset`, `text` and `colors` keys are omitted.)

- **Custom link:** `promptOptions.customlink` { `enabled`, `style` ('button'|'link'), `size`, `color`, `text`{`subscribe`,`unsubscribe`,`explanation`}, `unsubscribeEnabled` }, rendered into `<div class='onesignal-customlink-container'></div>`.
- **Auto prompt delays** are Page Views AND Seconds on Page: both must be satisfied.
- **Slidedown back-off:** after the 1st dismissal wait 3 days, the 2nd 7 days, the 3rd+ 30 days. It applies to Push, Category and Email/Phone slidedowns; bypass it with the Web SDK Slidedown methods; clearing cookies resets the cycle. The native prompt's own back-off cannot be bypassed.
- **Native prompt per browser:** Chrome 80+ shows a quieter UI for frequent deniers and high-denial sites, and backs off after 3 attempts (after the 3rd dismissal it is suppressed for 7 days). Firefox 72+ and Safari 12.1+ require a user gesture. Edge is trust-based (untrusted sites get a bell icon in the browser bar). The typical setup auto-shows the Slide Prompt on Chrome mobile, Firefox and Safari; to use the native prompt directly, turn off Auto Prompt and call the Web SDK `requestPermission()`.
- **Ask when engaged:** after add-to-cart, a profile update or sign-in. Put opt-in controls in a preference center.
- **Measure before experimenting:** start with the native browser prompt for a few months to measure your baseline opt-in rate, then experiment. Track with the `permissionPromptDisplay`, `permissionChange` and `slidedown` events. To A/B test prompts, set up your own method with custom code: initialize with different prompting options, detect subscribes with the Subscription Change event and tag users by variant.
- **Where it never works:** the native prompt never shows in Incognito, Private or Guest modes; social-media in-app webviews (Instagram, TikTok, Facebook) do not support web push.

## Web push browser behavior

- **Permission states:** Default, Granted, Denied (temporary after repeated "x", permanent after Block or a settings change). Clearing cookies or site data stops notifications temporarily, but the user may be re-subscribed automatically on return if permission was not removed.
- **Browser closed:** Chrome, Firefox, Opera and Edge receive with the browser closed on Android and Windows, not on macOS; Safari does on macOS. Subscribers have up to 3 days to retrieve the last known missing notification before it expires.
- **Test a prompt like a first-time visitor:** not in incognito. Reset the permission, delete site data, prompt and Allow, check the console, read `OneSignal.User.PushSubscription.id` in the console, add that subscription to Test Users, then send via Test & Preview > Send Test Push.

## A/B testing and retargeting

- **Campaign A/B tests are dashboard only** (not available with the API), for push and email. Professional and Enterprise get up to 10 variants, Free and Growth 2.
- **Split:** by default 25% of the audience gets the test, split evenly (25% over 10 variants is 2.5% each). Any percentage other than 100% lets you pick a winner for the rest; there is no automatic winner, you choose it manually.
- **Run it properly:** set benchmarks and a hypothesis, change one variable at a time, keep a control (a random tag plus an exclude segment), send the variants simultaneously.
- **Segments cannot be A/B tested** in the standard form; use Journey Split or Yes/No branches ([JOURNEYS.md](JOURNEYS.md)).
- **Retargeting** (push only, dashboard only) builds a new send from a message's Audience activity within **30 days**: Sent, Confirmed Receipt, Did Not Confirm Receipt, Clicked, Did Not Click, Failed, Unsubscribed. It is not retroactive after a plan upgrade, and API and automated messages are deleted after about 30 days. For the API, capture the outcome as a tag and target a segment.

## API rate limits and app disablement

The full retry rules belong with the REST API; these are the ones that decide whether a send storm takes your app down.

- **Application message limit:** in any rolling 15-minute window, up to **10 × total subscribed Subscriptions** messages. Exceeding it temporarily disables the app (admins get an email and a Re-enable banner). Causes: infinite loops, retry storms, unexpected segment growth. A `429` never disables the app; only message volume can.
- **Never retry message sends without an `idempotency_key`,** and reuse the same key on every attempt. Simple retry: wait 100 s, up to 3 total attempts. Time-sensitive: exponential backoff with jitter (2s, 4s, 8s... up to 60s), cap 10 attempts, stop after 10 to 15 minutes, wait `max(Retry-After, backoff)`. Don't retry 400, 401 or 403.
- **Batch:** high-volume messaging should use fewer message creation requests with larger audiences, not one request per user. Create/Cancel message: Free 150 req/sec/app, Paid 6,000 req/sec/app; `POST /notifications` and `DELETE /notifications` share a limit. A `429` body is `{"errors": ["API rate limit exceeded."]}` with `Retry-After`.

## Auditing a messaging program

- **Baseline first:** comparable periods, the same eligible audience, consistent event definitions. Compare against your own dashboard, not an industry benchmark.
- **Audit in order:** delivery, then targeting, then cadence, then content, then channel fit.
- **Cadence signal:** a histogram of messages received per user per week over 30 days. When the top decile gets 3 to 4 times the median, fatigue opt-outs may concentrate there.
- **Map every campaign and Journey that reaches the same user** (entry, waits, exits, suppression). Review segments not referenced in 90 days. Spot-check the personalization fallbacks of your top 5 templates. Test the full deep-link destination.
- **Change one thing** with a hypothesis, a success metric and a guardrail metric (e.g. opt-outs).
- **Channel roles:** push for time-sensitive, email for visual or long, in-app for contextual messages to active users, SMS/RCS for consented direct messages, Live Activities for ongoing changing information. Consent is separate per channel: a yes to push doesn't carry over to texts.

## Prove it

- **Delivery controls:** if throttling is enabled globally, a message meant for Intelligent Delivery or timezone delivery has `throttle_rate_per_minute: 0`, and a message that must bypass capping sets `"enable_frequency_cap": false`.
- **Payload:** `data` is under 2048 bytes and the total under about 4 KB; data-only sends omit `headings` and `contents`, set `content_available: true` and priority `5`.
- **Images** come from a CDN, are at most 1 MB and 2000 px wide.
- **Permission:** no `requestPermission()`, `optIn()`, native `requestAuthorizationWithOptions` or Android `requestPermissions` runs on app start; the soft prompt's report after 1 to 2 weeks shows impressions, clicks and the system prompt result.
- **Web:** after resetting permission and site data, the prompt appears only after the configured page views and seconds, and a test push reaches the subscription added to Test Users.
- **Retries:** every send retry reuses its `idempotency_key`, and no code path sends one request per user in a loop.
- **Frequency:** the per-message Capped count and the weekly messages-per-user histogram show no group getting 3 to 4 times the median.
