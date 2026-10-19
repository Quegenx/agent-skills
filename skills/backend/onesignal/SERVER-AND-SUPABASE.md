# Sending from servers, Supabase, and webhooks

Your backend sends OneSignal messages with the REST API or the Node server SDK, using an App API key that never leaves the server, and it learns what happened through Event Streams (outbound event webhooks). What decides most outcomes: the user must already be identified by the same External ID your server targets (your database or Supabase user ID passed to `OneSignal.login`), every send carries `target_channel` and an `idempotency_key`, and your webhook receiver answers fast and dedupes on `event.id`. Endpoints, limits and error codes are in [REST-API.md](REST-API.md); identifying users is [USER-MODEL.md](USER-MODEL.md); Supabase itself is [supabase SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/supabase/SKILL.md).

**Contents:** [Node server SDK](#node-server-sdk) · [Sending from Supabase Edge Functions](#sending-from-supabase-edge-functions) · [Choosing webhooks vs Event Streams](#choosing-webhooks-vs-event-streams) · [Event Streams](#event-streams) · [Event Stream data](#event-stream-data) · [Journey webhooks](#journey-webhooks) · [Web push webhooks](#web-push-webhooks) · [Prove it](#prove-it)

## Node server SDK

- **Package `@onesignal/node-onesignal`** (repo `https://github.com/OneSignal/onesignal-node-api`; latest observed on npm **5.20.0**, published 2026-10-15). Install with `npm install @onesignal/node-onesignal` (or `pnpm add`, `bun add`, `yarn add`). It is generated from the same OpenAPI spec as every OneSignal server SDK and covers Notifications, Users, Subscriptions, Segments, Templates, Live Activities, Custom Events, API Keys and Apps. The repo ships an `AGENTS.md` (`https://github.com/OneSignal/onesignal-node-api/blob/main/AGENTS.md`); the method list is in `DefaultApi.md`.
- **Keys:** App ID; REST API key (most endpoints); Organization API key only for app management (list, create, get, update apps), API-key management (view, create, update, rotate, delete) and copying a template to another app. "Set both on one configuration; the SDK sends the correct credential per endpoint." Read them from env vars or a secrets manager; never commit them.

```javascript
const OneSignal = require('@onesignal/node-onesignal');

const configuration = OneSignal.createConfiguration({
  restApiKey: process.env.ONESIGNAL_REST_API_KEY,
  organizationApiKey: process.env.ONESIGNAL_ORGANIZATION_API_KEY,
});

const client = new OneSignal.DefaultApi(configuration);
```

- **Positional arguments.** Methods take positional arguments: build the model and pass it directly; do not wrap it in a request or options object.
- **Push to a segment:**

```javascript
const notification = new OneSignal.Notification();
notification.app_id = 'YOUR_APP_ID';
notification.contents = { en: 'Hello from OneSignal!' };
notification.headings = { en: 'Push Notification' };
notification.included_segments = ['Subscribed Users'];

try {
  const response = await client.createNotification(notification);
  console.log('Notification ID:', response.id);
} catch (error) {
  console.error('Failed to create notification:', error);
}
```

- **Send by External ID.** "You must set `target_channel` when using aliases." Keys under `include_aliases` must match the API alias labels exactly (`external_id`, not `externalId`).

```javascript
const notification = new OneSignal.Notification();
notification.app_id = 'YOUR_APP_ID';
notification.contents = { en: 'Hello from OneSignal!' };
notification.include_aliases = { external_id: ['YOUR_USER_EXTERNAL_ID'] };
notification.target_channel = 'push';

const response = await client.createNotification(notification);
```

- **The full pattern: idempotency key, both `200` shapes, typed errors** (TypeScript):

```ts
import Onesignal from '@onesignal/node-onesignal';
import { randomUUID } from 'node:crypto';

const configuration = Onesignal.createConfiguration({
    restApiKey: 'YOUR_REST_API_KEY',
});
const apiInstance = new Onesignal.DefaultApi(configuration);

const notification = new Onesignal.Notification();
notification.app_id = 'YOUR_APP_ID';
notification.contents = { en: 'Hello from OneSignal!' };
notification.headings = { en: 'Push Notification' };
// Target by External ID: alias keys must match the API (external_id, not externalId).
notification.include_aliases = { external_id: ['YOUR_USER_EXTERNAL_ID'] };
notification.target_channel = 'push';
// Idempotency key: a client-generated UUID that lets you safely retry on network failure.
// If two requests arrive with the same key inside the 30-day window, only the first is sent
// and the second returns the original response. `randomUUID` is imported from `node:crypto`
// (available on Node 14.17+), DO NOT reuse keys across logically distinct sends.
notification.idempotency_key = randomUUID();

try {
  const response = await apiInstance.createNotification(notification);
  // `response.id` discriminates the two HTTP 200 shapes. A falsy value (empty string,
  // null, or undefined) means no notification was created (e.g. all targets were
  // unreachable / not subscribed). `response.errors` is polymorphic: a `string[]` in the
  // no-subscribers case, or an object keyed by recipient-identifier type
  // (`invalid_player_ids`, `invalid_external_user_ids`, `invalid_aliases`, …) when the
  // notification WAS created but some recipients were skipped.
  if (!response.id) {
    console.warn("Notification was not sent:", response.errors);
  } else if (response.errors) {
    console.log("Notification created:", response.id, "(partial failures:", response.errors, ")");
  } else {
    console.log("Notification created:", response.id);
  }
} catch (e) {
  if (e instanceof Onesignal.ApiException) {
    // `e.errorMessages` flattens any error-envelope shape to a `string[]`;
    // the raw parsed body remains on `e.body`.
    console.error("createNotification failed: HTTP " + e.code, e.errorMessages);
  } else {
    throw e;
  }
}
```

- **Built-in retry: `createNotificationWithRetry`.** It generates a UUIDv4 `idempotency_key` when absent (yours is respected), retries `429`, `503` and transport errors with the same key (honoring `Retry-After`, exponential backoff otherwise), fails fast on other errors, and returns `{ response, wasReplayed }` (`wasReplayed` comes from the `Idempotent-Replayed` header).

```javascript
const result = await client.createNotificationWithRetry(notification, { maxRetries: 5, baseDelayMs: 1000 });
console.log('id:', result.response.id, 'replayed:', result.wasReplayed);
```

- **Notification-level `external_id` is the deprecated idempotency field.** Use `idempotency_key`; don't confuse it with the `external_id` alias label under `include_aliases`.
- **Other targets:** `notification.include_subscription_ids = ['SUBSCRIPTION_ID_1', 'SUBSCRIPTION_ID_2'];`. Schedule with `notification.send_after = 'Thu Sep 24 2026 14:00:00 GMT-0700';`, optionally `delayed_option` `timezone` or `last-active`.
- **Email and SMS.** Email: set `email_subject`, `email_body`, `included_segments`, and `target_channel = 'email'`. SMS: `contents`, `included_segments`, `target_channel = 'sms'`, `sms_from = '+15551234567'`. Conflict: the docs server SDK page uses `target_channel`; the onesignal-node-api README's examples set `notification.channel_for_external_user_ids = 'email'` / `'sms'`. Confirm in the current docs.
- **Successful response:** `{"id": "b6b326a8-...", "recipients": 42, "external_id": null}`. An empty `id` with `"All included players are not subscribed"` means nothing was sent ([REST-API.md](REST-API.md#responses-and-errors)).
- **Users and subscriptions from Node:**

| Call | Endpoint |
|---|---|
| `apiInstance.createUser(appId, user)` (`const user: Onesignal.User = {};`) | Create user |
| `apiInstance.getUser(appId, "external_id", "YOUR_USER_EXTERNAL_ID")` | View user |
| `apiInstance.updateUser(appId, "external_id", "YOUR_USER_EXTERNAL_ID", updateUserRequest)` (`Onesignal.UpdateUserRequest`) | Update user |
| `apiInstance.deleteUser(appId, aliasLabel, aliasId)` | Delete user |
| `apiInstance.createAlias(appId, aliasLabel, aliasId, userIdentityBody)` (`Onesignal.UserIdentityBody`) | Create or update alias |
| `apiInstance.getAliases(appId, aliasLabel, aliasId)` / `getAliasesBySubscription(appId, subscriptionId)` | View identity |
| `apiInstance.createAliasBySubscription(appId, subscriptionId, userIdentityBody)` | Alias by subscription |
| `apiInstance.deleteAlias(appId, aliasLabel, aliasId, aliasLabelToDelete)` | Delete alias |
| `apiInstance.createSubscription(appId, aliasLabel, aliasId, subscriptionBody)` | Create subscription |
| `apiInstance.updateSubscription(appId, subscriptionId, subscriptionBody)` | Update subscription |
| `apiInstance.transferSubscription(appId, subscriptionId, transferSubscriptionRequestBody)` | Transfer subscription |
| `apiInstance.deleteSubscription(appId, subscriptionId)` | Delete subscription |
| `apiInstance.getNotification(appId, notificationId)` / `cancelNotification(appId, notificationId)` | View / cancel message |

  Catch `Onesignal.ApiException` and read `e.code`, `e.errorMessages`, `e.body`.

- **Any HTTP client works.** Send `Authorization: Key YOUR_REST_API_KEY` (the server SDK page writes `key`):

```bash
curl -X POST 'https://api.onesignal.com/notifications' \
  -H 'Authorization: key YOUR_REST_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "app_id": "YOUR_APP_ID",
    "contents": { "en": "Hello from OneSignal!" },
    "include_aliases": { "external_id": ["YOUR_USER_EXTERNAL_ID"] },
    "target_channel": "push"
  }'
```

## Sending from Supabase Edge Functions

OneSignal's own docs have no Supabase page. The two official sources (Supabase's integration guide at `https://supabase.com/docs/guides/integrations/onesignal` with the repo `https://github.com/supabase-community/onesignal`, and OneSignal's sample `https://github.com/OneSignalDevelopers/onesignal-supabase-sample-integration-supabase`, last pushed 2023-05-26, with a Flutter companion app) are written for the **legacy player model and a beta Node SDK**. Use their architecture; replace their API calls with the current ones listed below.

### The pattern

- **Identify with the Supabase user ID.** On sign-in the app initializes the OneSignal SDK and logs in with the Supabase user ID, "This allows us to later send push notifications to the user using their Supabase user ID from the backend":

```tsx
await OneSignal.login(uid)
```

  (The supabase-community repo's `app/pages/index.tsx` still calls `await OneSignal.setExternalUserId(uid)` with `react-onesignal` `^2.0.4` and a v15 worker; the guide text was updated to `login`.) The OneSignal sample creates profiles with a `handle_new_user` trigger on `auth.users` inserting into `public.profiles (id, email)`; the Supabase user ID is the External ID used for targeting. Web setup: [SETUP-WEB.md](SETUP-WEB.md); mobile: [SETUP-MOBILE.md](SETUP-MOBILE.md).
- **Database Webhook to Edge Function to OneSignal.** Example table `public.orders (id uuid pk default uuid_generate_v4(), created_at timestamptz default now(), user_id uuid not null default auth.uid(), price int8 not null)`; the client inserts only `price`. Create the function with `supabase functions new notify`; it receives the webhook payload `{ record }` (the inserted row). Add the webhook in **Database > Webhooks**: table `orders`, event insert, type HTTP Request, POST, URL = the Edge Function URL.
- **Secrets.** `supabase/.env` holds the OneSignal values; set them with `supabase secrets set --env-file ./supabase/.env`. Inside functions the sample reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `Deno.env`. Edge Functions run on Deno; packages load from esm.sh (no npm install).
- **Deploy** with `supabase functions deploy notify --no-verify-jwt`: "The `no-verify-jwt` flag is required if you plan to call the function from a webhook."
- **Broadcast.** The sample's `push-to-all-subs` function uses `notification.included_segments = ["Subscribed Users"]`.
- **Prompting.** The sample prompts for push with an in-app message using the **Push Permission Prompt** click action and an in-app trigger.

### The published function (legacy, do not copy unchanged)

```tsx
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import * as OneSignal from 'https://esm.sh/@onesignal/node-onesignal@1.0.0-beta7'

const _OnesignalAppId_ = Deno.env.get('ONESIGNAL_APP_ID')!
const _OnesignalUserAuthKey_ = Deno.env.get('USER_AUTH_KEY')!
const _OnesignalRestApiKey_ = Deno.env.get('ONESIGNAL_REST_API_KEY')!
const configuration = OneSignal.createConfiguration({
  userKey: _OnesignalUserAuthKey_,
  appKey: _OnesignalRestApiKey_,
})

const onesignal = new OneSignal.DefaultApi(configuration)

serve(async (req) => {
  try {
    const { record } = await req.json()

    // Build OneSignal notification object
    const notification = new OneSignal.Notification()
    notification.app_id = _OnesignalAppId_
    notification.include_external_user_ids = [record.user_id]
    notification.contents = {
      en: `You just spent $${record.price}!`,
    }
    const onesignalApiRes = await onesignal.createNotification(notification)

    return new Response(
      JSON.stringify({ onesignalResponse: onesignalApiRes }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    console.error('Failed to create OneSignal notification', err)
    return new Response('Server error.', {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
```

### What to change against current docs

| Legacy (Supabase guide and sample) | Current |
|---|---|
| `@onesignal/node-onesignal@1.0.0-beta7` | npm latest `5.20.0` |
| `createConfiguration({ userKey, appKey })` with a User Auth key (`USER_AUTH_KEY`) | `createConfiguration({ restApiKey, organizationApiKey })`; the legacy User Auth key is still accepted but no new ones can be created |
| `notification.include_external_user_ids = [...]` | `notification.include_aliases = { external_id: [...] }` plus `notification.target_channel` |
| `OneSignal.setExternalUserId(uid)` | `OneSignal.login(uid)` |
| v15 worker `importScripts('https://cdn.onesignal.com/sdks/OneSignalSDKWorker.js');` | v16 `importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");` |

- **Also add** an `idempotency_key` per logical send and check for an empty `id` in the response, as in the Node pattern above.
- **Local web dev.** The Supabase guide puts the worker file in Next.js `public/`, sets `allowLocalhostAsSecureOrigin: true` locally, and notes "if you decide to deploy your app to a hosting service, you would need to create another OneSignal app configured for your local address."

## Choosing webhooks vs Event Streams

| Mechanism | What it is | Where |
|---|---|---|
| **Event Streams** | The recommended way to get OneSignal data (sent, clicked, bounced and more, across every channel) into your systems | **Data > Event streams** |
| **Journey webhooks** | An HTTP request when a user reaches a Journey Webhook step | The webhooks docs page says **Settings > Journey webhooks**; the vendor Journeys skill says **Data > Webhooks** (confirm in the current dashboard); then a Webhook node |
| **Web push webhooks** | Older, browser-only client-side callbacks for web push only (not mobile push, email, SMS, in-app or server-side events) | **Settings > Web** or Web SDK `init()` |

- **"Most customers want Event Streams, not web push webhooks."**
- **Custom Events are the reverse direction.** Event Streams export message events out; Custom Events come in and are not in Event Streams.

## Event Streams

- **Events by channel:** push (sent, received, clicked, failed, unsubscribed); email (delivered, opened, clicked, bounced, unsubscribed and more); SMS (delivered, undelivered, failed); in-app (impression, clicked and more); Live Activity (sent, delivered, confirmed receipt, failed, unsubscribed, clicked).
- **Setup:** pick destination, scope and volume; expose a publicly reachable POST endpoint (routable HTTP(S) URL or IP, domain with a recognized TLD) that records events quickly; configure in **Data > Event streams > New Event Stream** (events, URL, auth headers, JSON body built from Event Streams Data fields in Liquid); test with webhook.site, then the **Send Test** button.
- **Every event counts toward your plan's message-event volume.** A send to 100,000 users = 100,000 `sent` events. Select only the types you need (e.g. `received` and `clicked`) and filter by message or template ID (**Messages > Templates > Options > Copy Template ID**).
- **Plan limits:** Free 1 stream, up to 1,000 events/month; Growth 3 streams, up to 10,000 events/month; Professional and Enterprise custom. Inbound Custom Events don't count.
- **Auth headers** may contain Liquid: `Authorization: Basic {{YOUR_TOKEN}}`, `Bearer {{YOUR_TOKEN}}`, `ApiKey {{YOUR_API_KEY}}`, or a custom `X-API-Key: {{YOUR_API_KEY}}`. OneSignal does not provide encryption services. Disallowed headers: `content-length`, `referer`, `metadata-flavor`, `x-google-metadata-request`, `host`, `x-onesignal*`.
- **Source IPs:** GCP `europe-west4` ([REST-API.md](REST-API.md#network)).
- **Body is JSON.** Example custom body:

```json
{
  "Event Data": {
    "event.kind": "{{ event.kind }}",
    "event.id": "{{ event.id }}",
    "event.timestamp": "{{ event.timestamp }}",
    "event.datetime": "{{ event.datetime }}",
    "event.app_id": "{{ event.app_id }}",
    "event.subscription_device_type": "{{ event.subscription_device_type }}",
    "event.subscription_id": "{{ event.subscription_id }}",
    "event.onesignal_id": "{{ event.onesignal_id }}",
    "event.external_id": "{{ event.external_id }}",
    "event.data.page_name": "{{ event.data.page_name}}",
    "event.data.page_id": "{{ event.data.page_id}}",
    "event.data.target_name": "{{ event.data.target_name}}",
    "event.data.target_id": "{{ event.data.target_id}}",
    "event.data.failure_reason": "{{ event.data.failure_reason}}"
  },
  "Message Data": {
    "message.id": "{{ message.id }}",
    "message.name": "{{ message.name }}",
    "message.title": "{{ message.title.en }}",
    "message.contents": "{{ message.contents.en }}",
    "message.template_id": "{{ message.template_id }}",
    "message.url": "{{ message.url }}",
    "message.app_url": "{{ message.app_url }}",
    "message.web_url": "{{ message.web_url }}"
  }
}
```

- **Liquid in JSON:** quote strings (`"user_id": "{{ user.onesignal_id }}"`); don't quote numbers or booleans (`"user_score": {{ user.tags.score }}`) or objects (`"user_data": {{ user.tags }}`). No `//` comments in real bodies.
- **Receiver rules:** record quickly into a queue or store; avoid slow responses and `429`s; size for volume (100k messages can mean up to 100k events per selected type); each event has a unique `event.id`, so include it in a header or the body and dedupe on it; point streams at your own servers first and buffer before forwarding to third parties.
- **Retries and auto-disable.** Recoverable statuses (e.g. `429`) retry with increasing delays; repeated failure marks the event permanently failed. Sustained failures can **auto-disable** the stream (admins are emailed before and on disable; a banner shows on the index page). The Report tab shows 2xx as success, 4xx/5xx as error, and timeouts as failed; the Logs tab shows sample requests and responses.
- **30-day message data.** Message data for Journey and API messages is available only **30 days**; events after that may be blank. Correlate `message.id` with the delivery event (`message.push.sent`, `message.email.received`, `message.sms.delivered`).

## Event Stream data

- **`event.*`:** `event.kind` (e.g. `message.push.clicked`), `event.id` (UUID v4, unique per event: your idempotency key), `event.timestamp` (UNIX int), `event.datetime` (ISO 8601 UTC), `event.app_id`, `event.subscription_device_type` (`iOS`, `Android`, `Huawei`, `FireOS`, `Chrome`, `Firefox`, `Safari`, `Email`, `SMS`; Live Activity events return `iOS`, so this field can't identify them), `event.subscription_id` (= `user.subscription.id`), `event.onesignal_id`, `event.external_id` (empty if none).
- **`event.data.*`** (empty string when not applicable): IAM `page_name`, `page_id`, `target_name`, `target_id`; Live Activity `live_activity_id`, `live_activity_type`; failed push or email `failure_reason`.
- **`event.id` vs `message.id`:** per event vs per message (sent and clicked share one `message.id`).

| Channel | Event kinds |
|---|---|
| Push | `message.push.sent` (delivered to FCM/APNs), `message.push.received` (only when Confirmed receipt is recorded: paid plan, OneSignal SDK on the device, supported platform; no dashboard toggle), `message.push.clicked`, `message.push.failed`, `message.push.unsubscribed` |
| In-app | `message.iam.impression`, `message.iam.clicked`, `message.iam.page_displayed` |
| Email | `message.email.received`, `message.email.opened`, `message.email.clicked`, `message.email.unsubscribed`, `message.email.reported_as_spam` (Gmail requires Google Postmaster Tools), `message.email.bounced`, `message.email.failed`, `message.email.suppressed` |
| SMS | `message.sms.delivered`, `message.sms.undelivered`, `message.sms.failed` |
| Live Activity | `message.live_activity.sent`, `.delivered`, `.clicked`, `.failed`, `.unsubscribed` |

- **`message.push.unsubscribed` is a reachability state** detected at send time when the push service reports an invalid token, not an opt-out caused by this message. OneSignal won't retry unless the user re-subscribes and opens the app.
- **Deprecated kinds** `message.email.sent` (use `message.email.received`; total attempts = received + failed + bounced) and `message.sms.sent` (use `message.sms.delivered`; total = delivered + failed + undelivered) can't be added to new streams.
- **`message.*`:** `message.id`, `message.name`, `message.title` (push: a localized object rendered as a Python-style dict `{'en':'...'}` that breaks JSON parsers, so use `{{ message.title.en }}`; email: the subject), `message.contents` (push and SMS, clipped at 50 characters; email body not provided), `message.template_id`, `message.template_name`, `message.url`, `message.app_url`, `message.web_url`, `message.data` (one JSON level, `{{ message.data.key }}`), `message.custom_data` (API only, multi-level), `message.live_activity_event_kind` (`start`, `update`, `end`).
- **`user.*`:** `user.onesignal_id`, `user.external_id`, `user.tags` (use `{{ user.tags.your_tag | default: '' }}`; don't dump the whole object, receivers often cap at 1 to 2 MB), `user.language`. Email and phone aren't on `user.*`: use `user.subscription.subscription_token`.
- **`user.subscription.*`:** `id`, `app_id`, `subscription_token` (email, E.164 phone or push token), `session_count`, `language`, `game_version` (app version, legacy name), `last_active`, `play_time` (seconds), `created_at`, `subscribed`, `sdk`, `device_model`, `device_os`.

## Journey webhooks

### Journey webhook transport contract

- **Access requires contacting sales.**
- **Where to configure:** the vendor skill says create webhooks in **Data > Webhooks** before adding them to a step; the webhook docs say **Settings > Journey webhooks**. Confirm in the current dashboard.
- **Endpoints must be public:** publicly routable over HTTP/HTTPS with a valid TLD.
- **Webhooks cannot call OneSignal APIs.** They are for external systems only.
- **Disallowed headers:** `content-length`, `referer`, `metadata-flavor`, `x-google-metadata-request`, `host`, any `x-onesignal*`.
- **Liquid works in all fields:** `{{ user.onesignal_id }}`, `{{ user.external_id }}`, `{{ user.tags.your_tag_key_here }}` (not in Test), `{{ user.language }}`.
- **Retries:** recoverable errors (for example `429`) retry with increasing delays; repeated failures become permanently failed; consistent failures auto-disable the webhook and email admins.
- **No rate limiting by OneSignal.** Many users reaching a webhook step at once send a burst of HTTP requests. Respond fast and defer processing; route through your own server or a queue rather than third parties.
- **Deduplicate retries on `event.id`.**
- **Secure the endpoint** with `Authorization: Bearer YOUR_SECRET_TOKEN`.
- **Tags are not available in standalone webhook tests;** use Test Users in a live Journey for full validation.

- **Add a 15-minute Wait after a Tag User step** before a webhook that depends on the tag.
- **Don't fire the same custom event from both the SDK and a backend webhook** unless it is deduplicated with `idempotency_key`.

## Web push webhooks

Legacy, browser-only, client-side. Browser support: Chrome (macOS, Windows, Android) all events; Firefox display and click; Safari none. Events: `notification.willDisplay`, `notification.clicked` (body or action button), `notification.dismissed` (Chrome only; not fired on click).

```javascript
// Add to your existing OneSignal initialization - do NOT call init twice
OneSignal.init({
  // Your other existing settings here
  webhooks: {
    cors: false, // Recommended: leave as false unless you need custom headers
    'notification.willDisplay': 'https://yoursite.com/webhook/display',
    'notification.clicked': 'https://yoursite.com/webhook/click',
    'notification.dismissed': 'https://yoursite.com/webhook/dismiss' // Chrome only
  }
});
```

- **HTTPS URLs only, one URL per event.** `cors: true` adds `Content-Type: application/json` and `X-OneSignal-Event: notification.clicked` headers and a `subscriptionId` field, and needs CORS support on your server.
- **Payload:** `{"event": "notification.clicked", "notificationId": "...", "heading": "...", "content": "...", "additionalData": {...}, "actionId": "buy-now-button", "url": "..."}`; an empty `actionId` = the body was clicked.
- **Endpoint:** return HTTP 200 within **10 seconds**; dedupe on `notificationId`; authenticate and validate; rate limit.
- **Users must be on a page running the webhook config;** deploy it on every page with OneSignal.

## Prove it

- Your server sends to a test user's External ID (the same ID your app passed to `OneSignal.login`) with `target_channel` set, and the response has a non-empty `id`; the device shows the push.
- `createNotificationWithRetry` returns `wasReplayed: true` when you resend with the same `idempotency_key`.
- The Supabase Edge Function deployed with `--no-verify-jwt` fires on a row insert from **Database > Webhooks**, and its code uses `include_aliases` + `target_channel` and `restApiKey`, not `include_external_user_ids` or `userKey`/`appKey`.
- No App API key appears in client code or the repo; the function reads it from secrets.
- **Send Test** on your Event Stream reaches your endpoint with a 2xx in the Report tab, and posting the same `event.id` twice stores one row.
- The stream is subscribed only to the event kinds you use.
