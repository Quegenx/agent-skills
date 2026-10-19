# OneSignal REST API

The REST API sends push, email and SMS, manages users and subscriptions, and reads delivery stats from your server. Most outcomes are decided by three things: which key you send (App API key for one app, Organization API key for org-level calls), the one targeting method in each Create message request, and whether retries reuse the same `idempotency_key`. Sending from Node and Supabase is [SERVER-AND-SUPABASE.md](SERVER-AND-SUPABASE.md); users, External IDs and aliases as concepts are [USER-MODEL.md](USER-MODEL.md); building segments is [SEGMENTS.md](SEGMENTS.md).

**Contents:** [Which API for which job](#which-api-for-which-job) · [Keys and authentication](#keys-and-authentication) · [Network](#network) · [Rate limits and message limits](#rate-limits-and-message-limits) · [Retries and idempotency](#retries-and-idempotency) · [Create message](#create-message) · [Push fields](#push-fields) · [Data (silent) notifications](#data-silent-notifications) · [Transactional sends and custom_data](#transactional-sends-and-custom_data) · [Responses and errors](#responses-and-errors) · [View and cancel messages](#view-and-cancel-messages) · [Users API](#users-api) · [Aliases API](#aliases-api) · [Subscriptions API](#subscriptions-api) · [Deleting users and subscriptions](#deleting-users-and-subscriptions) · [Prove it](#prove-it)

## Which API for which job

| Job | Endpoint |
|---|---|
| Send push, email or SMS | Create message (`POST https://api.onesignal.com/notifications`) |
| User data | Create user / Update user |
| Target a group | Create Segments, or inline `filters` on Create message |
| Journeys | Create / View / Update journey |
| Export | CSV Export / CSV of Events |
| App config | Create / Update App |

- **No client SDK needed for some jobs.** You can send email and SMS, manage users and trigger messages with the REST API or a server SDK alone. Client SDKs are required for push, in-app messages and client-side identification ([SETUP-WEB.md](SETUP-WEB.md), [SETUP-MOBILE.md](SETUP-MOBILE.md)).
- **In-app messages and Live Activities need the SDK.** The API alone cannot deliver them; never claim otherwise.
- **Web Push Subscriptions cannot be created via the REST API.** They can be updated via the Users and Subscriptions APIs.
- **Windows, macOS (Mac Catalyst via the iOS SDK), watchOS and Wear OS** are supported through the REST API.
- **Journeys API.** Journeys are always created in `draft`. View journeys finds an `id`; View journey returns node ids and the `concurrency_key`. Activate with Update journey `state: "active"` and poll until `state` is `active`. Patch one node with Update journey node instead of replacing the graph. Archive to stop and keep data; Delete journey is permanent.
- **Prefer Event Streams to View message.** For delivery data, "in most cases, you will likely want to use Event Streams instead" of View message ([SERVER-AND-SUPABASE.md](SERVER-AND-SUPABASE.md#event-streams)).

## Keys and authentication

| ID or key | Scope | Secret | Where |
|---|---|---|---|
| App ID | SDK init and API requests (UUID v4) | No | **Settings > Keys & IDs**, or the View apps API |
| Organization ID | Org-level APIs such as Create/Update an app (UUID v4) | No | **Organization settings > Security** |
| App API key | One app: sending messages, creating users, reading stats and history | Yes | Dashboard or Create API key API; up to **16 per app** |
| Organization API key | Whole org: creating apps, managing other API keys; grants access to every app | Yes | **Dashboard only** (no API to create it); up to **16 per organization** |

- **Send the key with the `Key` scheme.** `Authorization: Key YOUR_APP_API_KEY`. The server SDK page writes `key` in lower case; most pages write `Key`.
- **The value is shown once.** Key values start with `os_v2_app_` (the keys page states this prefix for both App and Organization keys) and appear only at create or rotate. The dashboard never shows existing values; the Key ID column is an internal identifier, and sending it returns `401 Unauthorized`.
- **Rotate and delete.** Rotating gives a new secret with the same Key ID, name and allowlist; the old value stops working **immediately**. Delete is permanent and immediate. Edit, rotate and delete via the API only for App API keys. Rotate when a key is exposed, a team member leaves, on a routine schedule, or when the value is lost; after an exposure, rotate first, then review audit logs.
- **IP allowlist.** Optional and strongly recommended: space-separated CIDR blocks (e.g. `192.0.2.0/24 192.0.2.123/32`); other IPs are denied.
- **Keep keys on the backend.** "Never embed the REST API key in a mobile or web client." Store keys in env vars or a secrets manager, never commit them, and use separate keys for staging and production. Never ask for API keys, p8 keys or p12 certificates in chat.
- **Legacy keys (before November 2024).** App and Organization API keys arrived in **November 2024**. The legacy User Auth key and original REST API key are still accepted, but no new ones can be created and their management UI is gone. Migration is in [MIGRATION-AND-TROUBLESHOOTING.md](MIGRATION-AND-TROUBLESHOOTING.md#legacy-api-keys-and-base-url).
- **Identity Verification changes user endpoints.** With the Token Identity Verification toggle on, Create user, View user, Update user, Delete user, View user identity, Create alias, Delete alias, Create subscription and Update subscription require `Authorization: Bearer YOUR_ONESIGNAL_JWT` (the App API key is not accepted for them), and `identity.external_id` must match the user in the path. Create message and the rest still use `Authorization: Key YOUR_APP_API_KEY`. Identity verification "is optional but strongly recommended for production apps. Without it, any client can call `login` with an arbitrary External ID." The JWT itself is in [USER-MODEL.md](USER-MODEL.md).

```bash
curl -X GET 'https://api.onesignal.com/apps/YOUR_APP_ID/users/by/external_id/YOUR_EXTERNAL_ID' \
  -H 'Authorization: Bearer YOUR_ONESIGNAL_JWT'
```

## Network

- **Base URL** `https://api.onesignal.com`. HTTPS with **TLS 1.2+** on port `443`; allow outbound to `https://api.onesignal.com:443`; respect the DNS **TTL of 300 seconds**.
- **Inbound to OneSignal passes through Cloudflare.** Use Cloudflare's official IP ranges; avoid allowlisting specific Cloudflare IPs. The TLS certificate is Cloudflare-managed and auto-renewed: don't pin the leaf (it rotates every few months); trust root or intermediate CAs or pin the CA SPKI.
- **Outbound from OneSignal (webhooks, Event Streams) comes from GCP `europe-west4`** (Groningen, Netherlands). Allow inbound from `https://api.onesignal.com`, or filter the GCP ranges at `https://www.gstatic.com/ipranges/cloud.json` by `europe-west4`.
- **Push gateways.** FCM ports `5228`, `443`, `5229`, `5230`; APNs ports `5223`, `443`, `2197`; APNs sandbox `api.sandbox.push.apple.com:443`, production `api.push.apple.com:443`, IP range `17.0.0.0/8`.
- **Default API response timeout is 100 seconds.**
- **`UnknownHostException - Unable to resolve host api.onesignal.com`** is DNS, firewall or connectivity: try `8.8.8.8` or `1.1.1.1` and flush the DNS cache.

## Rate limits and message limits

Limits are **per app and per endpoint**, evaluated when the request is received.

| Endpoint | Limit |
|---|---|
| Create message and Cancel message (shared between `POST /notifications` and `DELETE /notifications`) | Free **150 requests/sec/app**; Paid **6,000 requests/sec/app** (more via support) |
| Create custom events | Its own limit; 2,024 bytes per event, 1 MB per request body |
| Journeys API | Per app per endpoint; honor `Retry-After`; back off when polling View journey |
| Create, update, delete users or subscriptions | **1,000 requests/sec/app**; **1 request/sec per user or subscription**; up to **100 property updates per request** |
| View endpoints (messages, templates, users) | **1 request/sec/app**; up to **10 look-back requests/sec** |
| Message History and CSV exports | Keep parallel exports under 100 GB per file |

- **`429` never disables your app.** Body `{"errors": ["API rate limit exceeded."]}` plus a `Retry-After` header in seconds. Journey coded errors use `{ "errors": [{ "code", "title", "meta" }] }`.
- **The application message limit can.** In any rolling 15-minute window an app may deliver up to **10 × total subscribed Subscriptions** messages (1,000 subscriptions gives 10,000 per 15 minutes). Past it the app is temporarily disabled, admins are emailed, and a re-enable banner appears. Fix: pause sending, find the cause (loops, retry storms, segment growth), click **Re-enable**, or contact `support@onesignal.com`.
- **Batch audiences.** Send fewer create requests with larger audiences, not one request per user.

## Retries and idempotency

- **Never retry a message send without an `idempotency_key`.** A `429`, a `5xx` or a timeout may still be processing.
- **Retryable:** timeouts, no response, `429`, `5xx`. **Not retryable:** `400`, `401`, `403`.
- **Simple strategy:** wait 100 seconds (the maximum API response timeout), up to **3 total attempts**, same key.
- **Time-sensitive strategy:** exponential backoff with jitter (2s, 4s, 8s... up to 60s), cap **10 attempts**, stop after **10 to 15 minutes**, and on `429` wait `max(Retry-After, backoff)`.
- **On `429`:** stop, wait the full `Retry-After`, back off exponentially, reuse the same `idempotency_key`; on a journey `PATCH` send the current `concurrency_key`.
- **Journeys endpoints don't take `idempotency_key`.** They return `429` with `Retry-After`, and retrying Create journey can create another draft.
- **Wait time conflict.** The rate-limits page says wait 100 seconds; the idempotency page gives "for example, a 60-second HTTP timeout". Confirm in the current docs.

```text
attempt = 1
max_attempts = 3

send request with idempotency_key

if response is success:
  stop

if response is 429:
  wait Retry-After seconds
elif response is 5xx or timeout:
  wait 100 seconds

if attempt < max_attempts:
  retry with same idempotency_key
else:
  fail safely
```

- **What the key is.** Supported on `notifications#create` and `custom_events#create`. A unique **RFC 9562 UUID** with strong randomness, one per logical send, stored with the request metadata. Valid **30 days** for notifications (after that a reuse may send a new message); custom events dedupe best-effort within **4 hours**.
- **Reusing a key for a different message processes only the first.** Idempotency guarantees at-most-once processing, not delivery. A replay returns the original response with header `Idempotent-Replayed: true`; the server SDK page lists `409` as "typically the `idempotency_key` was replayed".
- **Old name.** The field was previously `external_id` (confused with the Users `external_id`); both names currently work; use `idempotency_key`.
- **Common mistakes:** a new key per attempt; infinite retries; retrying `400`/`401`; one request per user instead of batched audiences.

## Create message

`POST https://api.onesignal.com/notifications` (push reference: `?c=push`). Required: `app_id` and content. Prerequisites: the channel is set up, there are subscriptions, and you have the App API key and App ID.

```bash
curl -X "POST" "https://api.onesignal.com/notifications" \
     -H 'Content-Type: application/json' \
     -H 'Authorization: Key YOUR_API_KEY' \
     -d $'{
      "target_channel": "push",
      "included_segments": [
        "Subscribed Users"
      ],
      "app_id": "YOUR_APP_ID",
      "contents": {
        "en": "Hello, world",
        "es": "Hola mundo",
        "fr": "Bonjour le monde",
        "zh-Hans": "你好世界"
      }
    }'
```

### Targeting: exactly one method per request

Use aliases, subscription IDs, segments, or filters. `include_aliases`, `include_subscription_ids`, `included_segments`/`excluded_segments` and `filters` are mutually incompatible; mixing them returns a validation error.

| Method | Field | Max | Notes |
|---|---|---|---|
| Aliases (recommended; "best for Transactional Messages") | `include_aliases` keyed by `external_id`, `onesignal_id` or a custom alias label | **20,000** | Requires `target_channel`. The alias must already be registered on the user. |
| Subscription IDs | `include_subscription_ids` | 20,000 | "Not recommended because Users can have multiple Subscriptions." |
| Email addresses | `email_to` | 20,000 | Creates the email subscription if missing |
| Phone numbers | `include_phone_numbers` (E.164) | 20,000 | Creates the SMS subscription if missing |
| Segments | `included_segments`, `excluded_segments` | | Users in several segments receive once |
| Filters | `filters` | **200 entries** (rows plus operators) | |

```json
{
  "include_aliases": {
    "external_id": [
      "user1",
      "user2",
      "user3"
    ]
  },
  "target_channel": "push"
}
```

- **`target_channel`:** `"push"` (default), `"email"`, `"sms"` (`sms` covers RCS; there is no `"rcs"` value). Required with `include_aliases` or `included_segments` and when sending SMS or RCS. For SMS segments set `target_channel: "sms"` (or the legacy `isSms=true`).
- **Alias keys match the API exactly:** `external_id`, not `externalId`.
- **Email targeting conflict.** The Create message guide and the email OpenAPI schema use `email_to`; the transactional messages page uses `include_email_tokens`. Confirm in the current docs.
- **Segments.** Segment names are case-sensitive. Targeting a paused segment fails. Segments with message event or custom event filters combine only with segments of the same event filter type, else `400` `Segments are incompatible`. Building segments: [SEGMENTS.md](SEGMENTS.md).
- **Filters.** Implicit AND; `{"operator": "OR"}` starts a new branch; never end `filters` with an operator. Fields: `tag`, `last_session` (`hours_ago`; recommended for recently active users), `first_session`, `session_count`, `session_time` (seconds), `language`, `app_version`, `location` (`radius` in meters, `lat`, `long`), `country` (ISO alpha-2 upper case). Tag relations: `">"`, `"<"`, `"="`, `"!="`, `"exists"`, `"not_exists"`, `"in_array"`, `"not_in_array"` (comma-separated, up to 20 values), `"time_elapsed_gt"`, `"time_elapsed_lt"` (Time Operators, paid plan).
- **Filter speed.** Fast: tag `"="`/`"exists"`, `last_session`, `session_count`, `country`. Slower: `"!="`, `"not_exists"`. Slow by default: numeric `">"`/`"<"` on tags (indexing on request).
- **Don't target individual users with tags** (like a "user id" tag). Use External ID or aliases with `include_aliases`.
- **Platform flags** `isIos`, `isAndroid`, `isHuawei`, `isAnyWeb`, `isChromeWeb`, `isFirefox`, `isSafari`, `isWP_WNS`, `isAdm` each default `true`. "If set to `true`, all other platforms are disabled unless explicitly enabled."

```json
"filters": [
  {"field": "tag", "key": "level", "relation": "=", "value": "10"},
  {"operator": "OR"},
  {"field": "tag", "key": "level", "relation": "in_array", "value": "10,20,30"}
]
```

### Content and scheduling

- **Minimum content.** Push and SMS: `contents`; email: `email_subject` + `email_body`; or `template_id`. Push `contents.en` is required; localize with `{"en": ..., "es": ..., "fr": ..., "zh-Hans": ...}`.
- **Email fields:** `email_subject`, `email_body`, `email_preheader`, `template_id`, `email_from_name`, `email_from_address`, `email_sender_domain`, `email_reply_to_address` (the create-message guide writes `email_reply_to`), `email_bcc`, `include_unsubscribed`, `disable_email_click_tracking`, `email_warm_up`, `custom_data`.
- **SMS fields:** `contents`, `template_id`, `sms_media_urls` (MMS), `sms_from`.
- **`send_after`:** UTC; ISO 8601 or anything JS `Date()` parses, e.g. `"2025-09-24T14:00:00-07:00"`.
- **`delayed_option`:** `"timezone"` or `"last-active"` (push and email only); not with throttling (set `throttle_rate_per_minute: 0`). `delivery_time_of_day` goes with `timezone`: `"9:00AM"`, `"21:45"`, `"09:45:30"`.
- **`throttle_rate_per_minute`** must be enabled in the dashboard; `0` sends immediately. **`enable_frequency_cap`** must be enabled in the dashboard first; `false` disables it.
- **No `//` comments in JSON bodies.**
- **Downstream providers:** push FCM, APNs, HMS; email your ESP; SMS Twilio.

## Push fields

From the push OpenAPI (3.1.0, `version: '11.6'`).

| Field | Meaning |
|---|---|
| `headings` | Required for Huawei and Web Push (web defaults to Site Name); not required with `template_id` or `content_available`; same languages as `contents` |
| `subtitle` | iOS only |
| `name` | Internal, max 128 chars |
| `template_id` | UUID |
| `ios_attachments` | `{"id": "<url>"}` |
| `big_picture`, `huawei_big_picture`, `adm_big_picture` | Android, Huawei, Amazon images |
| `chrome_web_image` | Chrome on Windows and Android; macOS expands `chrome_web_icon` instead |
| `small_icon`, `large_icon` (+ huawei/adm variants), `chrome_web_icon`, `firefox_icon`, `chrome_web_badge` | Icons; `chrome_web_badge` is the monochrome Android status-bar icon for Chrome |
| `android_channel_id` / `existing_android_channel_id` | Channel created in OneSignal / in your app (Huawei equivalents exist) |
| `huawei_category` | `MARKETING` (default), `IM`, `VOIP`, `SUBSCRIPTION`, `TRAVEL`, `HEALTH`, `WORK`, `ACCOUNT`, `EXPRESS`, `FINANCE`, `DEVICE_REMINDER`, `MAIL` |
| `huawei_msg_type` | `message` (default) or `data` |
| `huawei_badge_class`, `huawei_badge_set_num` (0 to 99, takes priority; EMUI 10.0.0+, Push SDK 10.1.0+), `huawei_badge_add_num` (1 to 99) | Huawei badges |
| `priority` | `10` high (default, recommended) or `5` normal (recommended for data/background) |
| `ios_interruption_level` | `active` (default), `passive`, `time_sensitive`, `critical` |
| `ios_sound` | Sound file with extension in the app bundle (e.g. `explode_sound.wav`); "Omit this field to deliver it silently." |
| `ios_badgeType` + `ios_badgeCount` | `None` (default), `SetTo`, `Increase` |
| `android_accent_color` | ARGB hex; Android 8+ uses channels |
| `url`, `app_url`, `web_url` | `url` https opens in browser; `app_url` mobile only (`your-app-scheme://`); `web_url` goes with `app_url` |
| `target_content_identifier` | App Clip or scene |
| `buttons` / `web_buttons` | Max **3** (Android and iOS: `id`, `text`, optional `icon`) / max **2** (Chrome: `id`, `text`, `url`) |
| `thread_id`, `android_group`, `adm_group`, `ios_relevance_score` (0 to 1) | Grouping |
| `ttl` | Seconds, `0` to `2419200` (28 days); default `259200` (3 days) |
| `collapse_id` / `web_push_topic` | Replace older notifications with the same id (mobile only) / web only |
| `data` | Custom map passed to the app |
| `custom_data` | Use with `template_id`; max 2KB (Push/SMS), 10KB (Email) |
| `ios_category`, `apns_push_type_override` | `apns_push_type_override` only for VoIP: `voip` |

- **Use `collapse_id` for rapidly changing updates** (scores, ETAs). A repeated collapse ID silently replaces unread notifications.

## Data (silent) notifications

- **Shape:** `content_available: true`, omit `contents`, `headings` and `subtitle`, add `data`, and set **`priority: 5`**. The default `10` is wrong here: Apple requires normal priority, and FCM deprioritizes apps whose high-priority messages never produce a visible notification, which degrades their visible pushes too.

```bash
curl -X POST https://api.onesignal.com/notifications \
  -H "Authorization: Key YOUR_APP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "app_id": "YOUR_APP_ID",
    "include_aliases": { "external_id": ["user-123"] },
    "target_channel": "push",
    "content_available": true,
    "priority": 5,
    "data": {
      "action": "sync_data",
      "version": "2"
    }
  }'
```

- **Best effort only.** Not received when the iOS app was swiped away or the Android app was force-stopped (including OEM auto force-stop). Apple: "don't try to send more than two or three per hour"; the iOS energy and data budget resets about daily; throttling is off when running from Xcode, so testing looks more reliable than production. iOS gives about 30 seconds to finish and call the completion handler. **Never use silent notifications for critical updates.**
- **Only sent to subscribed Subscriptions.**
- **React Native and Flutter can't handle them in JS or Dart.** "Wrapper SDKs such as React Native and Flutter have no cross-platform handler for them": handle them in native code (iOS `application:didReceiveRemoteNotification:fetchCompletionHandler:` with Background Modes > Remote notifications, data under `userInfo["custom"]["a"]`; Android a notification service extension reading `additionalData`, registered in `AndroidManifest.xml`).
- **Dashboard "Content available"** under "Send to Apple iOS" applies to all platforms.
- **Huawei:** `huawei_msg_type=data` with no visible content for silent; `data` is a transport type (visible content still displays).
- **VoIP:** OneSignal does not register VoIP tokens automatically.
- **Confirmed delivery:** Android yes (if not force-stopped); iOS no (the NSE runs only for displayed notifications).
- **Don't use silent pushes to detect uninstalls or reachability.** Send visible notifications to all users at least once a month.

## Transactional sends and `custom_data`

- **Identify by External ID** mapped to your database user ID, plus up to **10 aliases per user**; email and SMS can target addresses or numbers directly.

```json
{
  "app_id": "YOUR_APP_ID",
  "include_aliases": {"external_id": ["userA", "userB"]},
  "contents": {"en": "English Message"},
  "target_channel": "push"
}
```

- **Custom alias:** `"include_aliases": { "alias_label": ["alias_id_1", "alias_id_2"] }` with `"target_channel": "email"`.
- **`custom_data` is per message and not stored.** It exists only during the request, **must be used with a `template_id`**, and is referenced in the template as `{{ message.custom_data.key_name }}`. Use it for data that changes per message, arrays, data that must not persist (OTPs, temporary URLs), backend-triggered sends and bulk personalization. Generate codes on your server.

```json
{
  "app_id": "YOUR_APP_ID",
  "include_aliases": { "external_id": ["userA"] },
  "template_id": "8458af75-4da2-4ecf-afb5-f242a8926cc3",
  "custom_data": { "verification_code": "123456" }
}
```

with template text `Your verification code is {{ message.custom_data.verification_code }}`.

- **Missing keys render empty, and the message still sends.** Invalid Liquid too. Use default filters (`{{message.custom_data.user_name | default: "there"}}`), check `.size > 0` before looping, keep fallback templates for critical transactional messages, pre-format complex data in the backend, log API responses server-side. Field names are case-sensitive.
- **Arrays:** zero-indexed `{{message.custom_data.cart_items[0].item_name}}` (a missing index is empty), loops `{% for item in message.custom_data.cart_items %}`, `.size`, `.first`, `.last`.
- **Bulk personalization:** key `custom_data.users` by external_id and look up with `{% assign user = message.custom_data.users[subscription.external_id] %}`. Every recipient needs an `external_id` and a matching key, else its fields are empty.

```json
{
  "app_id": "YOUR_APP_ID",
  "template_id": "YOUR_TEMPLATE_ID",
  "include_aliases": {
    "external_id": ["user123", "user456"]
  },
  "custom_data": {
    "users": {
      "user123": { "first_name": "John", "points": "150", "level": "Gold" },
      "user456": { "first_name": "Sarah", "points": "200", "level": "Platinum" }
    }
  }
}
```

- **Per-channel `custom_data` cap:** 2KB for push/SMS, 10KB for email. The [specific push API reference](https://documentation.onesignal.com/reference/push-notification) and [email API reference](https://documentation.onesignal.com/reference/email), fetched for this correction, both specify those limits. The [general personalization guide](https://documentation.onesignal.com/docs/en/personalization-api-custom-data) still says “Stay under 2KB” and “Request body too large” universally, including its email example. That conflicting general claim is retained here; use the channel API contract. The guide’s cart advice is to limit the first 3 to 5 items. Test empty arrays, missing fields and maximum item counts before production.
- **Separate high-volume transactional sends from marketing.**
- **Scheduled transactional message you may not need:** send with `send_after`, store the returned `id`, and cancel it if it is no longer needed.

## Responses and errors

- **`200` with an `id`:** the message was created; save the `id` for View message. The response also carries `recipients`, `external_id` (echo of `idempotency_key` or null), optional `errors` (`invalid_aliases.external_id[]` / `invalid_aliases.onesignal_id[]` for aliases whose subscriptions were unsubscribed; `invalid_player_ids[]` for subscription IDs that exist but are unsubscribed) and optional `warnings` (`invalid_external_user_ids`).
- **`200` with an empty `id` means nothing was sent.** `{"id": "", "recipients": 0, "errors": ["All included players are not subscribed"]}`. Causes: a misspelled or wrong-case segment name, an `external_id` or subscription ID that doesn't exist, all targets unsubscribed, a segment of zero, phone numbers not matching an SMS subscription. Always check `id`, never only the status code.
- **`errors` is polymorphic:** a `string[]` when nothing was sent, an object keyed by identifier type when the message was created but some recipients were skipped.
- **Dashboard `Sent`** = View message `successful + failed + errored`.

| Status | Meaning |
|---|---|
| `400` | Malformed or invalid field: `Message Notifications must have English language content`; `Incorrect subscription_id format in include_subscription_ids (not a valid UUID):`; `Platforms You may only send to one delivery channel at a time...`; `Segments are incompatible` |
| `401` | Missing or invalid API key, or a key for another app (also: sending the Key ID instead of the value) |
| `403` | Wrong key type (App vs Organization), IP allowlist, revoked or rotated key, Journeys not enabled (`journey-not-entitled`), or `This API is not available for applications on your plan.` |
| `404` | Not found |
| `409` | Conflict; for idempotent sends, typically the `idempotency_key` was replayed |
| `429` | Rate limited; `Retry-After` always emitted |
| `503` / `5xx` | `Service temporarily unavailable` (Retry-After optional); retry with backoff and the same key |

- **`BasicErrorResponse`:** `errors` string array, `success` (false on some endpoints), `reference`. User and subscription endpoints return structured errors `{ "errors": [{ "code", "title", "meta" }] }`.

## View and cancel messages

- **View message:** `GET https://api.onesignal.com/notifications/{message_id}?app_id={app_id}` with `Authorization: Key YOUR_APP_API_KEY`. Not available for Journey-sent messages. API-sent messages stay accessible **30 days after creation**; dashboard-sent ones for the app's lifetime. The response reflects how you targeted; for per-user events on segment or filter sends, use the Export audience activity CSV.
- **Delivery counts:** `successful` (delivered to push, email or SMS servers), `failed` (subscriptions reported unsubscribed for this message), `errored`, `converted` (push clicks), `received` (Confirmed Deliveries), `remaining` (not sent yet; `null` = still processing the audience, try later). Other fields include `canceled`, `queued_at`, `send_after`, `completed_at`, `platform_delivery_stats`, `outcomes`, `fcap_status`.
- **Outcomes:** `outcome_names` like `os__click.count`, `os__confirmed_delivery.count`, `os__session_duration.count`, or `my_outcome.count` / `.sum`; `outcome_time_range` `1h` (default), `1d`, `1mo`; `outcome_platforms` default `0,1,2,5,8,11,14,17`; `outcome_attribution`.
- **Cancel message:** `DELETE https://api.onesignal.com/notifications/{message_id}?app_id={app_id}` stops scheduled or currently outgoing messages. It doesn't delete the message, and an in-progress send may not be fully stopped. Shares the Create message rate limit.

## Users API

All paths are under `https://api.onesignal.com/apps/{app_id}`, header `Authorization: Key YOUR_APP_API_KEY` (or the Bearer JWT under Identity Verification). Look users up by `alias_label`/`alias_id`, usually `external_id` (the recommended primary identifier); use label `onesignal_id` to look up by OneSignal ID.

| Operation | Method and path | Success |
|---|---|---|
| Create user | `POST /users` | `200` new (`identity.onesignal_id`), `202` existing user modified |
| View user | `GET /users/by/{alias_label}/{alias_id}` | `200` |
| Update user | `PATCH /users/by/{alias_label}/{alias_id}` | `202` |
| Delete user | `DELETE /users/by/{alias_label}/{alias_id}` | `202`, asynchronous |

- **Pre-User Model SDKs warning.** On Mobile v4 or lower or Web v15 or lower, "Discrepancies may occur where the External ID set through the SDK and the External ID set through the API do not generate matching OneSignal IDs." Upgrade to Mobile 5+ / Web 16+, or keep using Add a Device / Edit Tags with External User ID / Edit a Device until migrated ([MIGRATION-AND-TROUBLESHOOTING.md](MIGRATION-AND-TROUBLESHOOTING.md)).
- **Create user** imports users from other systems or defines users outside SDK sessions; with frontend SDKs users are created by `login`, `addEmail`, `addSms`. Provide at least one of `identity` or `subscriptions` (a user without subscriptions needs `identity`, e.g. `external_id`, which "must be used and should be unique across users"). Up to 10 custom aliases (key and value max 128 chars) and 20 subscriptions.
- **`properties`:** `tags` (string values only, no arrays or nesting), `language` (ISO 639-1 lower case, default `en`), `timezone_id` (tz database, default `America/Los_Angeles`), `lat` (-90 to 90), `long` (-180 to 180), `country` (ISO alpha-2 upper case, default `US`), `first_active`, `last_active` (Unix seconds), `ip` (response only), `test_user_name`.
- **`subscriptions[]`:** `type` (required: `Email`, `SMS`, `iOSPush`, `AndroidPush`, `HuaweiPush`, `FireOSPush`, `WindowsPush`, `macOSPush`, `ChromePush`, `FirefoxPush`, `SafariPush`; `ChromeExtensionPush` also appears), `token` (required: email, E.164 phone, APNs 64 hex, FCM about 163 chars), `enabled` (default `true`; `false` = unsubscribed), `notification_types` (`1` subscribed, `-31` reserved for unsubscribed via API), `session_time`, `session_count`, `app_version`, `device_model`, `device_os`, `test_type` (omit/`null`/`0` Production including App Store and TestFlight, `1` Development, `2` Ad-Hoc). `sdk`, `web_auth`, `web_p256` are set by the SDK: "Do not use this field".
- **`409` on Create user** means the claimed identity is bound to a different user: `code: Conflict`, `title: Conflicting aliases`, `errors[].meta.conflicting_aliases` (e.g. `{"external_id": "user-already-claimed-by-another-account"}`).
- **View user** returns `properties`, `identity` (all aliases) and `subscriptions[]` (with `id`, `type`, `token`, `enabled`, `notification_types`, device and session fields). "When querying with any alias other than `onesignal_id`, authentication is required"; missing auth gives `401` `code: auth-1`. View endpoints are limited to 1 request/sec/app.
- **Update user changes user-level properties only.** Change identity with the Aliases API and subscriptions with Create Subscription or Create user. Body: `properties` (same fields as Create user) and `deltas` (`session_time`, `session_count`, `purchases[]` with `sku`, `iso` (default `USD`), `amount`, `count`) for frequently incrementing values. Optional header `onesignal-subscription-id` also updates session time and count on that subscription. `409` with code `Subscription Limit Exceeded`. The Update user reference does not describe how to remove a tag.
- **Test users via API:** set `properties.test_user_name`; clear it with `""`.

```bash
curl -X POST https://api.onesignal.com/apps/YOUR_APP_ID/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Key YOUR_APP_API_KEY" \
  -d '{
    "properties": {
      "test_user_name": "QA Device - Jane"
    }
  }'
```

## Aliases API

| Operation | Method and path |
|---|---|
| Create or update alias | `PATCH /users/by/{alias_label}/{alias_id}/identity` with `{"identity": {"external_id": "user_123", "crm_user_id": "XYZ789"}}` |
| View user identity | `GET /users/by/{alias_label}/{alias_id}/identity` |
| View identity by subscription | `GET /subscriptions/{subscription_id}/user/identity` |
| Create alias by subscription | `PATCH /subscriptions/{subscription_id}/user/identity` (upsert) |
| Delete alias | `DELETE /users/by/{alias_label}/{alias_id}/identity/{alias_label_to_delete}` |

- **Upsert semantics.** Only the `identity` object changes (no users created, no subscriptions or tags touched). Same label: value replaced; new label: added; omitted aliases: unchanged; changes are immediate. `onesignal_id` is read-only and can't be deleted. Subscription IDs are immutable.
- **Set `external_id` before custom aliases** (SDK `login`). One `external_id` plus up to **10 custom aliases**; labels and values max **128 characters**.
- **`409 Conflict` `user-2`** (`One or more Aliases claimed by another User`, `errors[].meta` maps label to conflicting ID): label+value pairs are unique per app; nothing changes on either user; the endpoint never moves aliases or merges users. A 409 usually means the target user already exists: use **Transfer Subscription** instead of retrying.
- **`400` `request-1`** `Invalid UUID`.
- **No External ID yet:** a custom alias added to a user without an External ID attaches to that one record only; adding the same value to a second record returns `409`.
- **Delete alias** is synchronous; the user and subscriptions stay. You may delete the alias you used to look the user up.

## Subscriptions API

| Operation | Method and path | Success |
|---|---|---|
| Create subscription by alias | `POST /users/by/{alias_label}/{alias_id}/subscriptions` with `{"subscription": {"type": ..., "token": ..., "enabled": ..., "notification_types": ...}}` | `200` created, `202` existing subscription transferred |
| Update subscription by ID | `PATCH /subscriptions/{subscription_id}` with `{"subscription": {...}}` | |
| Transfer subscription | `PATCH /subscriptions/{subscription_id}/owner` with `{"identity": {"external_id": "..."}}` | `200` with the new `identity` |
| Delete subscription | `DELETE /subscriptions/{subscription_id}` | asynchronous |

- **Create needs an existing user** (to create user and subscriptions at once, use Create user). `type` and `token` are required. **If the `type` and `token` already exist in the app, the subscription is transferred to the user in the path.** `404` `subscription-0` `Subscription not found`.
- **Update by ID is "primarily used by the OneSignal SDK".** Most external jobs fit **Update Subscription by token** (email or phone as token) or Update user better; for email opt-outs prefer **Unsubscribe Email (with token)**. `type` can't change (delete and recreate). Disable with `enabled: false` (and `notification_types: -31`).
- **Transfer takes exactly one alias** (`external_id` recommended, `onesignal_id` or custom) and can't cross OneSignal apps. "It is highly recommended to use our web and mobile SDKs to set and update the External ID with the `login` method instead of this API. Your app or website may continue to be setting the wrong External ID."
- **Delete does not block the same token returning.** Reopening the app or re-submitting the email or phone may create a new subscription. On the last subscription the user is kept only if it has an External ID or alias. Find IDs via View user `subscriptions[].id`.

## Deleting users and subscriptions

- **Irreversible.** Export user data (CSV) first and double-check the audience. Deleted users receive again only if web clears cookies and revisits, mobile reopens the app (latest SDK), or email/SMS is re-added.
- **Delete User** (by `external_id` recommended, `onesignal_id` or another alias) removes all aliases, subscriptions and properties; best for privacy compliance. **Delete Subscription** removes one.
- **Automatic deletion.** A user is deleted when its last subscription goes and it has no External ID or aliases. On Free plans, subscriptions inactive **18+ months** are auto-deleted; paid plans keep them.
- **Bulk delete in the dashboard deletes only subscribed records.** To delete every matching record, export with "Include unsubscribed records" or call Export Subscriptions with `"include_unsubscribed": true` and `"segment_name": "..."` (poll the gzip link), then Delete User or Delete Subscription per record within rate limits.

## Prove it

- A send by `include_aliases.external_id` with `target_channel` returns a non-empty `id`; the same body with a misspelled segment name or unknown `external_id` returns `200` with `id: ""`, and your code treats that as a failure.
- Sending the same body twice with the same `idempotency_key` produces one message, and the second response carries `Idempotent-Replayed: true`.
- Your retry code never retries `400`, `401` or `403`, reuses the key, waits `Retry-After` on `429`, and stops after its attempt cap.
- A request with both `include_aliases` and `included_segments` is rejected, and none ships in your code.
- `grep` the client bundle and repo for `os_v2_app_`: no hits outside your secrets store.
- View message for a sent `id` shows `successful + failed + errored` matching the dashboard `Sent`.
