# Analytics and privacy

Reading OneSignal's numbers correctly (delivery, confirmed receipt, CTR, conversions), keeping them past the retention window, the plan limits that change what an implementation can do, and handling personal data (consent gating, GDPR requests, deletion). Most reporting mistakes come from three facts: Delivered only means the push service accepted the message (Confirmed Receipt means the SDK on the device got it), the API field `failed` means **unsubscribed** while `errored` means a delivery error, and messages sent through the API are kept for only about 30 days unless you send them from a template. Live Activities analytics are in [LIVE-ACTIVITIES.md](LIVE-ACTIVITIES.md); message timing and frequency in [MESSAGING-PRACTICES.md](MESSAGING-PRACTICES.md); Journey analytics in [JOURNEYS.md](JOURNEYS.md); in-app reports in [IN-APP-MESSAGES.md](IN-APP-MESSAGES.md).

**Contents:** [Push message reports](#push-message-reports) · [Confirmed receipt](#confirmed-receipt) · [CTR and why it drops](#ctr-and-why-it-drops) · [Metric names across dashboard, API, CSV, Event Streams](#metric-names-across-dashboard-api-csv-event-streams) · [Conversion metrics, goals, outcomes](#conversion-metrics-goals-outcomes) · [Retention and exports](#retention-and-exports) · [Plan limits that change the implementation](#plan-limits-that-change-the-implementation) · [Consent and personal data](#consent-and-personal-data) · [GDPR requests](#gdpr-requests) · [Deleting users and subscriptions](#deleting-users-and-subscriptions) · [Security](#security) · [Prove it](#prove-it)

## Push message reports

| Metric | Meaning |
|---|---|
| Audience | |
| Sent | Delivered + Unsubscribed + Failed |
| Remaining | |
| Delivered | The push service (APNs, FCM, ADM, HMS) accepted it |
| Confirmed Receipt | The OneSignal SDK on the device received it |
| Clicked | Counted once per notification |
| Unsubscribed | Reachability at send time, not caused by this message |
| Failed | Errors; retried in future messages |
| Frequency Capped | Users skipped by frequency capping |
| Influenced Opens | Window set at **Settings > Push & In-App > Influenced Opens** |

- **Delivery statuses:** Sent, Scheduled, Sending, Queued, Canceled, No Recipients, Failed.
- **The stats graph covers 30 days after send.**
- **Track real opt-outs** with the SDK Subscription Observer or Event Streams, not the per-message Unsubscribed count. Unsubscribes are detected on app open (the SDK updates immediately) or when the push service rejects a token on send, which typically takes 2+ messages. Apple delays unsubscribe reporting by 14+ days.

| Failure error | Meaning or fix |
|---|---|
| 401 Unauthorized | Web; retry cautiously (duplicates) |
| 404 Not Found | Bad token |
| FCM Authentication Error | Re-upload the service account |
| APNs DeviceTokenNotForTopic | Bundle ID mismatch |
| Expired Certificate | p12 |
| FcmV1InvalidToken | |
| None/Missing | Enable the FCM API |
| Permission Denied | |
| SenderIdMismatch | |
| APNs TopicDisallowed | Check Team ID, Key ID, Bundle ID |

## Confirmed receipt

- **Available only on paid plans.** There is no dashboard toggle; it needs the OneSignal SDK on the device and does not exist for API-only subscriptions. Event Stream event `message.push.received`.
- **It doesn't fire for:** Safari web push; Huawei `message` type; silent iOS (content-available); VoIP; API-only subscriptions; Live Activities on iOS SDK < 5.2.15.
- **Web needs the v16 Web SDK:** `https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js` and in the service worker `importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");`.
- **iOS needs a Notification Service Extension and an App Group:**
  - The group `group.YOUR_MAIN_APP_BUNDLE_ID.onesignal`, the same on both targets (a custom group via the Info.plist key `OneSignal_app_groups_key`).
  - The NSE links `OneSignalExtension` (the main app uses `OneSignalFramework`) and calls `OneSignalExtension.didReceiveNotificationExtensionRequest`.
  - Matching minimum deployment targets; uncheck "Copy only when installing".
  - `mutable-content: 1` is set automatically. Do not set `mutable_content: false`.
- **Android:** some OEMs treat swipe-away as a force quit (which stops the SDK), and a custom notification service extension can block receipt.
- **Confirmed but not displayed:** Focus modes; `event.preventDefault()` in the foreground lifecycle listener or an Android NSE; `removeDeliveredNotifications`; priority not high; `collapse_id`.
- **Inactive devices:** retarget **Did Not Confirm Receipt** within 30 days, segment by Last Session (e.g. inactive 90+ days), and periodically prune unreachable devices.

## CTR and why it drops

- **CTR = (Clicks / Delivered) × 100.** Swipes, Dismiss and clearing the tray are not clicks. Confirmed CTR (CCTR) = Clicks / Confirmed Receipt. Exclude data-only notifications from CTR. Focus modes and muted Android channels count as Delivered but are never seen.
- **Compare to your own baseline,** not an industry average: windows of similar volume and targeting, and like message types (marketing vs transactional vs API).
- **Low-CTR causes:** stale subscriptions inflate Delivered (delete those users); broader segments lower CTR; more frequency without a content reason lowers CTR.
- **Click-tracking breakers:** OneSignal not loaded on every web page; multiple service workers (e.g. a PWA service worker); an Android NSE calling `complete(null)`; wrong SDK init.

## Metric names across dashboard, API, CSV, Event Streams

In the View Message(s) API and the Notifications CSV, the field name `failed` represents **unsubscribed** Subscriptions and `errored` represents **delivery errors**.

| Push metric | View Message API | Notifications CSV | Event Streams |
|---|---|---|---|
| Delivered | `successful` | `delivered` | `message.push.sent` |
| Confirmed Receipt | `received` | `confirmed_receipt` | `message.push.received` |
| Unsubscribed | `failed` | `failed` | `message.push.unsubscribed` |
| Failed | `errored` | `errored` | `message.push.failed` |
| Clicked | `converted` | `converted` | `message.push.clicked` |
| Influenced Opens | `influenced_opens` | | |
| Frequency Capped | `frequency_capped` | | |

- **Sent has no API field:** sum `successful + failed + errored`. The API also has per-platform fields (`ios_clicked`, `android_clicked`).

| Email metric | API (`platform_delivery_stats.email.`) | CSV | Event Streams |
|---|---|---|---|
| Sent | `successful` | | `message.email.sent` (deprecated; use `message.email.received`) |
| Delivered | `received` | `email_delivered` | `message.email.received` |
| Failed | `failed` | `email_failed` | `message.email.failed` |
| Suppressed | `suppressed` | | `message.email.suppressed` |
| Bounced | `bounced` | `email_bounced` | `message.email.bounced` |
| Reported as Spam | `reported_spam` | `email_reported_spam` | `message.email.reported_as_spam` |
| Unsubscribed | `unsubscribed` | `email_unsubscribed` | `message.email.unsubscribed` |
| Total Opens | `opened` | `email_opened` | `message.email.opened` |
| Total Clicks | `clicked` | `email_clicked` | `message.email.clicked` |
| Unique Opens, Unique Clicks | `unique_opens`, `unique_clicks` | | (no event) |

- **The dashboard labels spam** as Reported as Spam, Spam or Complained.

| SMS/RCS metric | API (`platform_delivery_stats.sms.`) | Event Streams |
|---|---|---|
| Sent | `successful` | `message.sms.sent` (deprecated; use `message.sms.delivered`) |
| Delivered | `provider_successful` | `message.sms.delivered` |
| Failed | `failed` + `errored` | `message.sms.failed` |
| Suppressed | `suppressed` | |
| Provider Errored | `provider_errored` | |
| Provider Undelivered | `provider_failed` | `message.sms.undelivered` |

- **Derived SMS metrics:** Rejected = provider errors + failures; No Delivery Report = Sent minus Failed minus Rejected minus Delivered (delivery reports are best effort); Read (RCS); Replied (non-consent keywords); Unsubscribed (opt-out keywords).
- **In-app Event Streams:** `message.iam.impression`, `message.iam.page_displayed` (card impressions), `message.iam.clicked`.
- **Retention chart:** the cohort is fixed on the start date; windows of 7, 14 and 30 days; counts users and all sessions.
- **Other rates:** email Open Rate = Unique Opens / Delivered; SMS Delivery Rate = Delivered / Sent.

## Conversion metrics, goals, outcomes

- **Conversion Metrics replace Custom Outcomes** (Custom Outcomes are legacy and being deprecated; there is no automatic migration). Conversion Metrics are on all plans; the defaults are App Sessions and Clicks. Custom metrics from Custom Events need a paid plan; Free gets App Sessions unattributed only.
- **Create one** at **Data > Events & conversions > Conversion Metrics** > **Create Conversion Metric**. "Track a value for each event" only works for a number-typed property and only at creation.
- **Attribution windows per channel** at **Settings > Analytics > Attribution Windows:** Push from delivered or clicked; Email from opened or clicked (a delivered-only email gets no credit); In-App impression or click; SMS delivered; RCS delivered or read.
- **Last-touch cross-channel attribution:** the attributed message is the most recent qualifying interaction (Push click, In-App click, Email open or click, SMS click on a tracked link, RCS read or click); other qualifying interactions, including push/SMS/RCS deliveries and in-app impressions, are influenced. At most one attributed message per conversion; the global dashboard gives each channel at most 1 influenced credit per conversion.
- **Measures:** conversion yield = direct conversions / delivered; value per delivery.
- **App Sessions became a Conversion Metric on June 25, 2026.** Under-reporting was fixed in Android SDK 5.7.1 and iOS SDK 5.5.1.
- **Goals (Beta):** a Journey Goal or a Message Goal; conversion Goals on Push, Email, SMS and In-App steps (not RCS). Measures: Clicks (CTR or count), App Sessions (count or session yield), a custom metric (count or conversion yield; value and value per delivery if it tracks value). Progress counts direct attribution only. Clicks goals are on all plans; App Sessions and custom goals need a paid plan. Goals don't affect delivery.
- **Legacy Custom Outcomes** (Professional/Enterprise, push and in-app only): mobile `addOutcome`, `addOutcomeWithValue`, `addUniqueOutcome`; web `sendOutcome`, `sendUniqueOutcome`. Attribution direct, influenced, unattributed, total. Values round to whole numbers, strings are not supported, and they are cached offline. Dashboard notifications keep outcome data forever, API notifications 30 days. Disable at **Settings > Push & In-App > Outcomes Tracking**.

```js
OneSignal.Session.sendOutcome("Purchase", 20.20);
```

## Retention and exports

| Data | Free | Growth | Professional | Enterprise |
|---|---|---|---|---|
| Analytics (message reports, Conversion Metrics, template analytics) | 30 days | 90 days | 1 year | 2 years |
| Message events | | 30 days | 60 days | 90 days |
| Session events | 7 days | 30 days | 60 days | 90 days |

- **Messages sent through the API are only retained for 30 days,** and so is audience activity. Dashboard-sent messages are stored indefinitely. Sources differ on Journeys: one page says API messages are deleted about 30 days after delivery; another says message data "sent via API or Journeys" is retained 30 days.
- **Send API and transactional messages from a template** to keep performance history beyond the 30-day API retention: the templates page says aggregate analytics on the Templates page are lifetime, while the template analytics page says template analytics are retained for up to 2 years depending on plan; per-send data follows plan retention. Template CTR = Clicked / Delivered.
- **Message events on Free:** the message events page says "Not available" on Free and the billing FAQ table lists only Growth, Professional and Enterprise; segmentation still uses events regardless of plan.
- **User records:** paid plans keep them until deleted; Free retains only records active in the last 18 months (dormant push subscriptions are auto-deleted after 18 months).
- **Exports** contain Subscription records, not Users. The View messages API returns up to 50 per page and takes only `app_id`, `limit`, `offset`, `kind`, `template_id` and `time_offset` (no channel filter); isolate channels with Event Streams instead.

## Plan limits that change the implementation

- **Free plan MAU limit:** fewer than **1,000 MAU** to send mobile push and in-app messages, for new customers from **September 1, 2026** and existing ones from **October 1, 2026**. Over the limit, mobile push and in-app stop (web push, email and SMS continue) and Journeys skip push and in-app steps for mobile Subscriptions. You get 24 hours to upgrade after crossing. It is measured over the trailing 30 days at Organization level (the sum of its apps); after deleting subscriptions, sending re-enables only once you stay under for 30 days. Alerts: the billing FAQ says 80%, 90% and 100%; an August 2026 OneSignal blog post says 75%, 90% and 100%.
- **Free plan Journeys and tags** (August 2026 blog): Free gets 3 Journeys with unlimited step counts and 6 Data Tags; Growth gets 5 Journeys; all paid plans have unlimited Journey message steps.
- **Billing MAU:** mobile Subscriptions (iOS, Android, Huawei, Amazon, macOS, Windows, Chrome Extensions) with at least one session in the billing cycle, regardless of subscription status. Updating `last_active` via the API counts as a session (including imports); each device counts separately even with one External ID; counted in increments of 10, rounded down. Web push is billed per subscribed browser. Reduce MAU by delaying SDK init with the privacy methods (see [Consent and personal data](#consent-and-personal-data)).
- **Web push on Free:** up to 10,000 web push subscribers; no limit on mobile app Subscriptions.
- **Email:** billed for emails that leave OneSignal (delivered, bounced, most failures; not invalid ESP credentials or Delivery Error). Self-serve (Growth and legacy) is capped at 500,000 emails per month.
- **Event Streams:** Free 1 active stream up to 1,000 events/month; Growth 3 streams up to 10,000 events; Professional/Enterprise custom.
- **Organizations:** billing is per Organization; apps and orgs are unlimited (e.g. a "Free" org for dev and test, a "Paid" one for production). Self-serve accounts are disabled after three failed payments.
- **Other plan-gated features:** frequency capping (select paid plans), confirmed receipt (paid), Time Operators (paid), Custom Events (paid), full email validation (paid), A/B variants (2 vs 10), Live Activities (not on Free with >10,000 subscribers), Journey webhooks (sales), PII masking (Enterprise, or Growth/Professional with the Security & Legal package), the audit logs API (Enterprise). Segment, active-Journey and tags-per-user limits are on the pricing page.

## Consent and personal data

- **OneSignal does not automatically collect any PII except IP addresses in countries outside the EU.** By default IP is not collected for EU and UK users; disabling IP collection globally goes through support and is permanent per app.
- **Consent gating:** enable the consent requirement before SDK init. The SDK then collects nothing until consent is granted, ignores earlier calls, and persists consent across sessions.
- **Consent is not message opt-in.** A user who previously allowed push and then revokes consent can still get push: call `optOut` **before** revoking consent.
- **Location:** the Web SDK collects none; mobile location sharing can be disabled.
- **Disclose** the third-party notification service in your privacy policy.
- **What the SDK collects:**
  - Segmentation fields: first and last session (UTC), session count, usage duration, OS, language, IANA timezone, country, push permission, app version, location (mobile only, opt-in).
  - Non-segment fields: app identifier, carrier, device model, IP (not stored for the EU), `web_auth`/`web_p256`, push tokens.
- **Web storage (no cookies):** IndexedDB `ONE_SIGNAL_SDK_DB`; Local Storage `os_pageViews`, `isOptedOut`, `isPushNotificationsEnabled`; Session Storage `onesignal-pageview-count`, `ONESIGNAL_HTTP_PROMPT_SHOWN`; Cloudflare's `__cf_bm` cookie is strictly necessary.
- **PII masking** (email, phone) is display-level only, for the dashboard and dashboard exports; it does not apply to the REST API, External IDs or Tags. A DPA and SCCs come with paid plans.

## GDPR requests

| Right | How |
|---|---|
| Informed | SDK methods to delay initialization until consent |
| Access | Dashboard CSV export or the `View user` API (JSON) |
| Rectification | Import or the Update user API; respond within one calendar month |
| Erasure | Delete user API (one at a time) or bulk in the dashboard; irreversible |
| Restrict processing | Don't send tags conditionally |
| Portability | CSV or `View user` JSON |
| Object | Restrict plus erase |

## Deleting users and subscriptions

- **Deletion is irreversible: export first.**
- **Automatic:** a user is deleted when their last Subscription is deleted and they have no External ID or aliases; users with an External ID are kept with their properties.
- **By API:** Delete User (by `external_id`, `onesignal_id` or aliases) or Delete Subscription.
- **In bulk:** build a segment (e.g. **Last Session > 4321 hours**, about 6 months; consider two re-engagement notifications first), then **Delete Subscriptions In Segment**. It only deletes subscribed records, one segment at a time per app. To include unsubscribed records, export with `"include_unsubscribed": true` and `"segment_name"` through the Export Subscriptions API, then delete via the API (mind the rate limits).
- **Deleted users come back only** when a web user clears cookies and revisits, a mobile user reopens the app, or an email or SMS is re-added.

## Security

- **Never expose REST API Keys or App Keys** in public repositories or client-side code; rotate or delete compromised keys. The App ID is public. A user's own `subscription_id` is safe to show that user, never someone else's; use Identity Verification.
- **Certifications and hosting:** primary data centers in the EU; EU-U.S. DPF; TLS 1.2+ in transit, AES-256 at rest; SOC 2 Type II, ISO 27001/27701; HIPAA; Families Ads Program (January 10, 2022).

## Prove it

- **Dashboards and code that read the View Message API** treat `failed` as unsubscribed and `errored` as delivery errors, and compute Sent as `successful + failed + errored`.
- **Confirmed receipt:** on a paid plan, an iOS test push produces `message.push.received` (the NSE links `OneSignalExtension` and both targets share `group.YOUR_MAIN_APP_BUNDLE_ID.onesignal`); the web service worker imports the v16 `OneSignalSDK.sw.js`.
- **API and transactional sends use a `template_id`,** so their analytics outlive the 30-day API retention.
- **New metrics are Conversion Metrics,** not `addOutcome` or `sendOutcome` calls.
- **Consent:** with the consent requirement on, the SDK sends nothing before consent is granted, and the revoke path calls `optOut` before revoking.
- **Free plan:** the Organization's trailing-30-day MAU across all apps stays under 1,000 if it relies on mobile push or in-app.
- **No REST API Key** appears in the client bundle or the repository.
