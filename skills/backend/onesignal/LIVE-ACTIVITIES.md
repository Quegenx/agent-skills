# Live Activities

iOS Live Activities show one ongoing, changing event on the Lock Screen and in the Dynamic Island, updated from your server through OneSignal. They have their own iOS permission, so users who declined push still see them, and one Update request reaches every device registered to an `activity_id` (OneSignal stores the APNs update tokens). What decides most outcomes is whether the event deserves one at all (Apple prohibits purely promotional activities, and unexpected ones make users disable them app-wide) and how you spend the per-device update budget. Push content and timing are in [MESSAGING-PRACTICES.md](MESSAGING-PRACTICES.md); reports for other channels in [ANALYTICS-AND-PRIVACY.md](ANALYTICS-AND-PRIVACY.md).

## When to use one

- **Use a Live Activity only when all are true:** the user expects the event; the status changes more than once (once means a push; never means a widget); it ends within 8 hours; each update is glanceable.
- **Never for** ads, promotions or flash sales (Apple prohibits purely promotional activities), always-on data (stock ticker, weather), multi-day events, re-engagement, or sensitive information.

## How it works

- **`activity_id`:** share one id across many users following the same event (target them via segments); use a unique id per user or order for individual events (target by user).
- **Each use case ships natively:** it requires a widget extension and an App Store release. Cross-platform apps (React Native, Expo, Flutter and others) use the SDK `setupDefault`; the only native code is the widget layout.
- **Support every presentation:** Compact, Minimal, Expanded and Lock Screen.
- **Lifecycle:**
  - Start via the Start Live Activity API or ActivityKit in the app.
  - Update via the Update Live Activity API.
  - End via the SDK `exit()` (stops updates, doesn't remove the UI), the API `event: end` with an optional `dismissal_date`, or a user action.
- **`dismissal_date`:** a future time within 4 hours, or a past time to remove the activity immediately (requires that the user tapped Allow on their first activity). Apple suggests 15 to 30 minutes for most cases.
- **Liquid works** in `event_updates`, `contents` and `headings` ([PERSONALIZATION.md](PERSONALIZATION.md)).

## Requirements and limits

| Item | Value |
|---|---|
| OS | iOS 16.1+ / iPadOS 17+ |
| Push-to-start | iOS 17.2+ and iOS SDK 5.2.0+ |
| Click tracking and confirmed receipt | iOS SDK 5.2.15+ |
| Active updates | up to 8 hours |
| Dismissal window after end | up to 4 more hours |
| Simultaneous activities per app | up to 5 |
| First activity | provisional |
| Stale marker | `stale_date` |
| Plans | all plans except Free plans with more than 10,000 opted-in subscribers |
| History | **All messages** for 30 days |

## Update budget and priority

- **`priority: 5`** is opportunistic and unmetered: use it for routine updates.
- **`priority: 10`** is immediate and spends the per-device budget. An omitted priority is `10`.
- **More budget:** set `NSSupportsLiveActivitiesFrequentUpdates` = `YES`. Detect `frequentPushesEnabled` in the app and store it as a tag; OneSignal doesn't sync it.
- **Relevance:** set `ios_relevance_score` (0.0 to 1.0) on the Update API. The Dynamic Island shows the activity with the highest score; ties go to the earliest started. On the Lock Screen the score also sets the display order of your app's Live Activities.

## Analytics

| Metric | Meaning |
|---|---|
| Sent | Composite; includes push-to-start and updates |
| Delivered | APNs accepted it |
| Confirmed Receipt | The device received it (iOS SDK 5.2.15+) |
| Failed | Retried |
| Unsubscribed | Dismissed, disabled, uninstalled or opted out |
| Clicked | Includes repeat clicks |

- **Rates:** Confirmed Receipt Rate = Confirmed / Delivered; CTR = Clicked / Delivered; Confirmed CTR = Clicked / Confirmed.
- **Retention:** reports are kept 30 days; Engagement Trends up to 2 years depending on plan.
- **No REST analytics endpoint** for Live Activities (View messages can't filter them). Use Event Streams, whose names are shifted one step:

| Event | Means |
|---|---|
| `message.live_activity.sent` | Delivered |
| `message.live_activity.delivered` | Confirmed Receipt |
| `message.live_activity.failed` | Failed |
| `message.live_activity.unsubscribed` | Unsubscribed |
| `message.live_activity.clicked` | Clicked |

- **View Message fields:** `successful` is Delivered, `errored` is Failed, `failed` is Unsubscribed. To isolate Live Activities in Event Streams, stream `message.live_activity.*` events and read `event.data.live_activity_id`, `event.data.live_activity_type` and `message.live_activity_event_kind`. Do not use `event.subscription_device_type`: it returns `iOS` for Live Activities, the same value as a regular iOS push.

## Prove it

- **The use case passes all four tests** (expected, changes more than once, ends within 8 hours, glanceable) and is not promotional.
- **Routine updates are sent with `priority: 5`;** only updates that must appear now use `10`, and no update request omits `priority` by accident.
- **Every activity ends** with `event: end` and a `dismissal_date`, and none runs past 8 hours.
- **Event Streams consumers** map `message.live_activity.sent` to Delivered and `.delivered` to Confirmed Receipt, and filter on `event.data.live_activity_id`.
- **The iOS SDK is 5.2.15+** if you report clicks or confirmed receipt, and 5.2.0+ on iOS 17.2+ if you use push-to-start.
