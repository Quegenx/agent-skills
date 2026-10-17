# In-app messages

In-app messages (IAMs) show inside a mobile app that runs the OneSignal mobile SDK; they are not available on web. "In-app messages are not actively pushed. Instead, they're pulled at app start based on audience, then displayed based on trigger logic." Because of that pull, a user must meet the audience criteria **before** a new session starts, and a new session means the app was backgrounded or closed for at least 30 seconds. HTML IAMs and the `OneSignalIamApi` bridge are in [IAM-HTML.md](IAM-HTML.md); Liquid and languages in [PERSONALIZATION.md](PERSONALIZATION.md); IAM steps in Journeys in [JOURNEYS.md](JOURNEYS.md#message-steps); SDK setup and users in [USER-MODEL.md](USER-MODEL.md).

## How it works

- **Created in the dashboard only.** "You must create in-app messages within the OneSignal dashboard."
- **To fire one from your backend,** put the IAM in a Journey and enter users through Custom Events from the API (see [REST-API.md](REST-API.md)).
- **Audience:** delivered to all mobile Subscriptions in the Segment regardless of push opt-in. With no Segment, it defaults to all "Subscribed Users". A push prompt click action hides the IAM from Subscriptions that are already opted in.
- **Segment changes mid-session need a reopen.** Dashboard updates to an IAM also apply only after the app has been closed for 30 seconds.
- **IAMs need internet;** there is no offline display.
- **Free plan:** the Organization needs fewer than **1,000 MAU** to send mobile push and in-app messages (effective for new customers September 1, 2026, existing October 1, 2026). Over the limit, IAM stops and Journeys skip IAM steps for mobile Subscriptions.

## Triggers

| Trigger | Use |
|---|---|
| On app open | No code required. Show message upon next app open. Users within the audience will be eligible to receive the message when they open the app. |
| Session duration | No code required. Show message after a specific number of seconds within the current app session. |
| Duration since last in-app | No code required. Show message after a specific number of seconds since the most recent in-app message. Include it in less urgent or lower priority messages so they do not display too closely to more important messages. |
| In-app trigger | Code required. Show message when user performs certain actions. Set from code with `addTrigger(s)`. |

- **Combine triggers with AND/OR.**
- **In-app trigger keys and values are space and case sensitive.** Remove one with `removeTrigger`. Greater than and less than work on numeric strings. Example level trigger: `addTrigger("level", "5")`.
- **Triggers are not tags.** "Set tags for segments to use in the audience and use triggers to display the message."

## Display rules

- **Dismiss:** show until dismissed, or auto-dismiss after N seconds (for informative messages).
- **Frequency:**
  - **Only once** (default).
  - **Every time:** in-app triggers may fire multiple times per session; other triggers once per session.
  - **Multiple times:** for example `2` times with a `1` hour gap, or `12` times every `30` days (about monthly for a year).

## Click actions

One action per element.

| Action | Bridge method | Notes |
|---|---|---|
| URL | `openUrl` | Opens the browser. For in-app deep links use a Custom action ID. |
| Push permission prompt | `triggerPushPrompt` | |
| Location prompt | `triggerLocationPrompt` | |
| Send outcome | `sendOutcome` | "Unattributed"; sets tag `outcome_name : true`. |
| Tag user | `tagUser` | |
| Custom action ID | `addClickName` | Read in the SDK IAM Click Listener. |

- **Deep links and `openUrl` disagree across pages:** the click-actions page says URL opens the browser and in-app deep links should use a Custom action ID; the IAM API page says `openUrl` supports deep linking. Confirm in the current docs and test on a device.

## Design (block editor)

- **Layouts:** Top, Center, Bottom, Full. Carousels on the Full type, up to 10 cards.
- **Image block:** `.jpg`, `.png`, `.gif`, max 5MB; aspect ratios `16:9`, `4:3`, `3:2`; host on a CDN. Dynamic image URL: `https://example.com/images/{{ tag_key }}.png`.
- **Background padding** defaults to `24px`.
- **Close button:** recommended `10x10px`. If you disable it, provide another exit.
- **Recommended SDKs:** iOS 5.1.5+, Android 5.1.9+. Templates are tested portrait-only.
- **Hide the banner shadow or overlay:**

| Platform | Key | SDK |
|---|---|---|
| iOS Info.plist | `OneSignal_in_app_message_hide_drop_shadow`, `OneSignal_in_app_message_hide_gray_overlay` | 5.1.5+ |
| Android manifest | `com.onesignal.inAppMessageHideGrayOverlay`, `com.onesignal.inAppMessageHideDropShadow` | 5.1.9+ |

- **Quickstart designs:** Messages > In-App > New In-App > OneSignal quickstart designs; tested on iPhone 13+ and Pixel 8+; not landscape-optimized. Copy and paste HTML templates are in [IAM-HTML.md](IAM-HTML.md#html-templates).

## Personalization and languages

- **IAMs support only Tag substitution** in Liquid (no `journey.*`, `message.*`, `subscription.*`, `user.*`). Tags must be set before the session starts; the available tags are what `getTags` returns.
- **Tag substitution needs** iOS SDK 2.16.4+, Android 3.16.0+.
- **Languages:** use **Add Languages** (block, HTML and Journey in-app steps), which reads the language property, or separate IAMs per language targeting device-language Segments. IAM Liquid cannot read `user.language`; details in [PERSONALIZATION.md](PERSONALIZATION.md#multi-language).
- **Each language variant has its own 1 MB size limit.**

## Testing

- **Set `setLogLevel` to Verbose.**
- **Put the device in the Segment** (tip: the Test Users filter).
- **Background the app for 30 seconds,** then reopen.
- **Set frequency to "Every time" while testing.**
- **Test & Preview** sends a push to a test device, which must be push-subscribed. "Tag substitution does not work for test in-app messages."
- **Test sends do not count** in IAM analytics.

## Troubleshooting

| Symptom | Check |
|---|---|
| IAM never shows | User met the audience before the session started; app backgrounded 30 s; frequency; triggers (space and case sensitive). |
| Dashboard edit not visible | App must be closed 30 s. |
| Blank or white IAM | A custom webview or `WindowManager.LayoutParams`. |
| Android duplicates on back button or Activity transitions | The IAM View is a child of the current Activity. |
| HTML IAM shows as Center Modal | SDK below the HTML minimum; see [IAM-HTML.md](IAM-HTML.md). |

- **Minimum OS:** Android 4.4, iOS 10.0.

## Reports

- **Metrics:** Impression, Card Impressions, Total Clicks (excludes the Close Button), Unique Clicks.
- **CTR** = ((Clicks of all blocks - Close Button) / Impressions) × 100%.
- **Editing blocks creates "Deleted" blocks** in the report.
- **Audience activity** covers 30 days.

## Prove it

- **On a device in the Segment:** with Verbose logging and frequency "Every time", background the app for 30+ seconds, reopen, and the IAM displays.
- **In-app trigger:** `addTrigger` with the exact key and value (same case and spacing) shows the IAM; `removeTrigger` stops it.
- **Each click action** does what its row says on a real device; the URL action is checked for both a web link and a deep link.
- **Personalized IAM:** the tag exists in `getTags` before the session starts, and the message is checked on a real send, not Test & Preview.
- **Close path:** with the close button disabled, another element dismisses the IAM.
- **Android:** pressing back or switching Activities does not show the IAM twice.
