# Webhooks

Resend sends real-time HTTPS POSTs with a JSON body `{ type, created_at, data }` when email, domain, contact, suppression, topic and inbox events happen. Delivery is signed with Svix, at least once and not in order. The sources require verifying the signature against the raw request body (parsing and re-stringifying JSON breaks it), deduping on the `svix-id` header, and returning 200 quickly; any other response triggers retries. Inbound mail (`email.received`) is covered in [RECEIVING.md](RECEIVING.md), inbox events in [AGENT-INBOX.md](AGENT-INBOX.md).

**Contents:** [Uses](#uses) · [Event types](#event-types) · [Bounce types](#bounce-types) · [Payloads](#payloads) · [Create a webhook](#create-a-webhook) · [Verify the signature](#verify-the-signature) · [Handle events](#handle-events) · [Retries and replays](#retries-and-replays) · [Delivery history](#delivery-history) · [Manage webhooks](#manage-webhooks) · [Store the events](#store-the-events) · [IP allowlist](#ip-allowlist) · [Local development](#local-development) · [Common mistakes](#common-mistakes) · [Prove it](#prove-it)

## Uses

Track delivery status in your database, remove bounced addresses from lists, trigger follow-ups on open or click, process inbound email, alert on failures or complaints, and build analytics dashboards.

## Event types

### Email

| Event | Trigger | Use |
|---|---|---|
| `email.sent` | API request successful, delivery attempted | Confirm the email was accepted |
| `email.delivered` | Reached the recipient's mail server | Confirm delivery |
| `email.delivery_delayed` | Temporary issue (soft bounce); Resend retries | Monitor; may resolve on its own |
| `email.bounced` | Permanently rejected (hard bounce) | Remove from the list, alert |
| `email.complained` | Recipient marked it as spam | Unsubscribe, review content |
| `email.opened` | Recipient opened it | Engagement |
| `email.clicked` | Recipient clicked a link | Engagement |
| `email.failed` | Send error: invalid recipients, API key problems, domain verification issues, quota limits | Debug, alert |
| `email.scheduled` | Email scheduled | |
| `email.suppressed` | Send to a suppressed address, not attempted | Doesn't count toward bounce rate |
| `email.received` | Inbound email arrived at your receiving domain | Process, auto-reply, forward ([RECEIVING.md](RECEIVING.md)) |

### Other

| Group | Events |
|---|---|
| Domain | `domain.created`, `domain.updated`, `domain.deleted` |
| Contact | `contact.created` (not triggered by CSV imports), `contact.updated`, `contact.deleted`, `contact.topics.updated` |
| Suppression | `suppression.added`, `suppression.removed` |
| Topic | `topic.created`, `topic.updated`, `topic.deleted` |
| Inbox (private beta) | `inbox.created`, `inbox.updated`, `inbox.deleted`; `inbox.thread.created`, `inbox.thread.folder.updated`, `inbox.thread.assigned`, `inbox.thread.unassigned`, `inbox.thread.labels.updated`; `inbox.email.received`, `inbox.email.sent`; `inbox.draft.created`, `inbox.draft.updated`, `inbox.draft.sent`, `inbox.draft.deleted` |

- **`domain.verified` doesn't exist in the event list,** though the multi-tenant guide mentions it. The Verify Domain reference says status changes fire `domain.updated`. Confirm in the current docs.
- **Inbox event payloads carry no email or draft body;** see [AGENT-INBOX.md](AGENT-INBOX.md).

## Bounce types

| Type | Event | Action |
|---|---|---|
| Hard (`Permanent`) | `email.bounced` | Remove the address immediately, never retry. Continuing to send destroys sender reputation |
| Soft (`Transient`) | `email.delivery_delayed` | Monitor; Resend retries for up to 14 hours, then sends `email.bounced` |
| `Undetermined` | `email.bounced` | Treat as hard if repeated |

- **Permanent subtypes:** `General` (the provider sent a hard bounce), `NoEmail` (the address doesn't exist or couldn't be determined).
- **Transient subtypes, and when they may clear:** `General` (temporary rejection; when the underlying issue clears), `MailboxFull` (when the recipient frees space), `MessageTooLarge` (when you reduce size), `ContentRejected` (when you change content), `AttachmentRejected` (when you change the attachment). Transient bounces may relate to autoresponders.
- **Undetermined subtype:** `Undetermined`.
- **Hard bounces and complaints suppress the address automatically** ([SENDING.md](SENDING.md#suppressions)), but don't unsubscribe the contact: do that from the webhook.

## Payloads

```json
{
  "type": "email.delivered",
  "created_at": "2024-01-15T12:00:00.000Z",
  "data": {
    "email_id": "ae2014de-c168-4c61-8267-70d2662a1ce1",
    "from": "Acme <noreply@acme.com>",
    "to": ["delivered@resend.dev"],
    "subject": "Welcome to Acme"
  }
}
```

- **Common email `data` fields:** `broadcast_id`, `created_at`, `email_id`, `message_id`, `from` (for sent mail, as passed including the display name; for received mail, the bare address, with the display name in `headers.from` on the retrieve endpoint), `to`, `subject`, `template_id`, `tags`.
- **`tags` shape:** the payload reference types it as an object `Record<string, string>` (e.g. `{"category":"confirm_email"}`); the multi-tenant guide calls it "the `tags` array". Confirm in the current docs.
- **Extra fields by event:**

| Event | Extra `data` |
|---|---|
| `email.bounced` | `bounce: { diagnosticCode (array, e.g. "smtp; 550 5.5.0 Requested action not taken: mailbox unavailable"), message, subType (e.g. Suppressed, MessageRejected), type (e.g. Permanent, Temporary) }` |
| `email.clicked` | `click: { ipAddress, link, timestamp, userAgent }` |
| `email.failed` | `failed: { reason }` (e.g. `reached_daily_quota`) |
| `email.suppressed` | `suppressed: { message, type: "OnAccountSuppressionList" }` |
| `email.received` | Metadata only: `bcc`, `cc`, `received_for` (from the `for` clause of `Received` headers), `attachments[] { id, filename, content_type, content_disposition, content_id }`. No body, headers or attachment content |
| `contact.created` | `id, audience_id, segment_ids, created_at, updated_at, email, first_name, last_name, unsubscribed` |
| `contact.topics.updated` | `{ email, topics: [{ id, subscription: opt_in \| opt_out }] }`, only the changed topics |
| `suppression.added` | `{ id, email, origin, source_id, created_at }` |
| `topic.created` | `{ id, name, description, default_subscription, deleted, created_at, updated_at }` |
| `domain.updated` | `{ id, name, status, created_at, region, capabilities, records[] }`; record `SPF`, `DKIM`, `Receiving MX`, `Tracking` or `TrackingCAA`, type `MX`, `TXT`, `CNAME` or `CAA` |

- **`email.received` has no body by design** (serverless request-size limits and large attachments): fetch it with `resend.emails.receiving.get(event.data.email_id)` ([RECEIVING.md](RECEIVING.md)).

## Create a webhook

1. **Create a POST endpoint** on a public HTTPS URL that returns HTTP 200.
2. **Register it** with the API (preferred) or the dashboard (https://resend.com/webhooks > Add Webhook: URL and events), the CLI or the MCP server.
3. **Verify signatures:** required.
4. **Test locally** through a tunnel ([below](#local-development)).

- **Prefer the API:** it is faster, less error-prone and returns the signing secret in the response.

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const { data, error } = await resend.webhooks.create({
  endpoint: 'https://example.com/webhook',
  events: ['email.delivered', 'email.bounced', 'email.received'],
});

if (error) {
  console.error('Failed to create webhook:', error);
  throw error;
}

// IMPORTANT: Store the signing secret, you need it to verify incoming webhooks
console.log('Webhook created:', data.id);
console.log('Signing secret:', data.signing_secret); // whsec_xxxxxxxxxx
```

```bash
curl -X POST 'https://api.resend.com/webhooks' \
  -H 'Authorization: Bearer re_xxxxxxxxx' \
  -H 'Content-Type: application/json' \
  -d '{
    "endpoint": "https://example.com/webhook",
    "events": ["email.delivered", "email.bounced", "email.received"]
  }'

# Response:
# {
#   "object": "webhook",
#   "id": "4dd369bc-aa82-4ff3-97de-514ae3000ee0",
#   "signing_secret": "whsec_xxxxxxxxxx"
# }
```

- **CLI:** `resend webhooks create --endpoint ... --events email.sent` (`--events all` is supported) ([CLI.md](CLI.md)).
- **Store the secret as `RESEND_WEBHOOK_SECRET`** (it starts with `whsec_`), never hardcoded. Where to read it again, sources disagree: one part of the vendor skill says it is returned only once, at creation; another part and the docs say it is in the create, get (retrieve) and list responses and on the webhook's dashboard page, and `rotateSigningSecret` returns a new one. The vendor skill says store it as `RESEND_WEBHOOK_SECRET` immediately.

## Verify the signature

- **Verify every request.** A webhook is an unauthenticated POST; anyone who knows the URL can send fake events. The signature proves it came from Resend, and unique signatures stop replays of old payloads.
- **Headers:** `svix-id` (unique message ID), `svix-timestamp` (Unix time sent), `svix-signature` (e.g. `v1,g0hM9SsE+...`).
- **Use the raw request body:** `await req.text()` in a Fetch-style handler, `express.raw()` (not `express.json()`) on the Express webhook route. Parsing then stringifying JSON breaks verification.
- **With the SDK:** `resend.webhooks.verify(...)` throws on an invalid signature and returns the parsed payload otherwise. The two sources publish different Next.js examples (the conflict is stated below them). The docs' Next.js example:

```js
export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();

    // Throws an error if the webhook is invalid
    // Otherwise, returns the parsed payload object
    const result = resend.webhooks.verify({
      payload,
      headers: {
        id: req.headers['svix-id'],
        timestamp: req.headers['svix-timestamp'],
        signature: req.headers['svix-signature'],
      },
      webhookSecret: process.env.RESEND_WEBHOOK_SECRET,
    });

    // Handle the result after validating it
  } catch {
    return new NextResponse('Invalid webhook', { status: 400 });
  }
}
```

The vendor skill's Next.js example (`headers` keyed by the `svix-*` names, and `secret`):

```typescript
import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    // Important: Use raw body, not parsed JSON
    const payload = await req.text();

    // Throws an error if the webhook is invalid
    const event = resend.webhooks.verify({
      payload,
      headers: {
        'svix-id': req.headers.get('svix-id'),
        'svix-timestamp': req.headers.get('svix-timestamp'),
        'svix-signature': req.headers.get('svix-signature'),
      },
      secret: process.env.RESEND_WEBHOOK_SECRET,
    });

    switch (event.type) {
      case 'email.delivered':
        // Update database with delivery status
        break;
      case 'email.bounced':
        // Hard bounce: remove from mailing list immediately
        break;
      case 'email.complained':
        // Spam complaint: unsubscribe and flag
        break;
      case 'email.received':
        // Inbound email: retrieve body and process
        const { data: email } = await resend.emails.receiving.get(event.data.email_id);
        break;
      default:
        break;
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook verification failed:', error);
    return new NextResponse('Invalid signature', { status: 400 });
  }
}
```

- **Option names, sources disagree:** the SDK source (`VerifyWebhookOptions`) and the docs' verify page use `headers: { id, timestamp, signature }` and `webhookSecret`. The vendor skill, the Agent Email Inbox skill page and the examples repo pass `headers: { 'svix-id', 'svix-timestamp', 'svix-signature' }` and `secret`. In the v6.34.1 source, `VerifyWebhookOptions` is `{ payload: string; headers: { id; timestamp; signature }; webhookSecret: string }`, and `verify` maps those headers to Svix's `webhook-id`, `webhook-timestamp` and `webhook-signature`. Confirm in the current docs.
- **Manually with Svix:** `npm install svix`, then `import { Webhook } from 'svix'; const wh = new Webhook(secret); wh.verify(payload, headers);` with the `svix-id`, `svix-timestamp` and `svix-signature` headers; it throws on failure. Fully manual header verification: https://docs.svix.com/receiving/verifying-payloads/how-manual.
- **Return 400 on a failed verification** and 200 on every valid event.

## Handle events

- **Switch on `event.type`:** `email.delivered`, update delivery status in the database; `email.bounced`, remove from the mailing list immediately; `email.complained`, unsubscribe and flag; `email.received`, fetch the body with `resend.emails.receiving.get(event.data.email_id)` and process it.
- **At-least-once delivery:** dedupe by storing processed `svix-id` values. Retries of inbox events keep the same `svix-id`.
- **Order is not guaranteed** (`email.opened` can arrive before `email.delivered`): sort by the payload's `created_at`.
- **Return 200 fast and process asynchronously if needed.** Any non-200 response, including on a valid webhook, triggers retries.
- **Route multi-tenant events by tag** (e.g. `tenant_id`) ([DOMAINS.md](DOMAINS.md#multi-tenant-setups)).

## Retries and replays

- **Retry schedule when the endpoint doesn't return 200,** each delay counted from the previous failure:

| Attempt | Vendor skill | Docs |
|---|---|---|
| 1 | Immediately | Immediately |
| 2 | 5 seconds | 5 seconds |
| 3 | 5 minutes | 5 minutes |
| 4 | 30 minutes | 30 minutes |
| 5 | 2 hours | 2 hours |
| 6 | 5 hours | 5 hours |
| 7 | 10 hours | 10 hours |
| 8 | | 10 hours |

  Example from the docs: an event that fails 3 times then succeeds is delivered about 35 minutes 5 seconds after the first attempt. A separate docs page says Resend retries failed deliveries "for up to 24 hours" when the endpoint returns 5xx, which is shorter than the schedule above. Confirm in the current docs.
- **Removing or disabling the endpoint stops attempts.**
- **An endpoint that keeps failing is disabled automatically,** and the team gets an email (endpoint URL, how long it has failed). Re-enable it on the Webhooks page.
- **Manual replay** from the dashboard works on `failed` and `succeeded` messages: backfill after an outage, reprocess with new code, or send to another endpoint. The API replay `resend.webhooks.events.replay({ webhookId, eventId })` queues one more delivery immediately, returns the same event ID and does not schedule or change automatic retries. It returns 422 if the webhook is disabled or the payload is no longer available.

## Delivery history

Inspect what Resend sent and how your endpoint answered, instead of asking someone to check the dashboard.

```typescript
// 1. Find the event: most recent first, forward-only pagination
const { data: events, error } = await resend.webhooks.events.list({
  webhookId: '4dd369bc-aa82-4ff3-97de-514ae3000ee0',
  limit: 20,
});
if (error) throw error;
// events.data[i]: { id, type, created_at, status }
// status: 'pending' | 'attempting' | 'success' | 'failed'
const eventId = events.data[0].id;

// 2. See the exact payload Resend sent, and when the next retry is due
const { data: event } = await resend.webhooks.events.get({
  webhookId: '4dd369bc-aa82-4ff3-97de-514ae3000ee0',
  eventId,
});
// event.next_attempt_at is null once status is 'success' or 'failed'
// event.payload is the JSON body your endpoint received

// 3. Manually replay a failed or missed event: queues one more delivery
const { data: replayed, error: replayError } = await resend.webhooks.events.replay({
  webhookId: '4dd369bc-aa82-4ff3-97de-514ae3000ee0',
  eventId,
});
// replayed.id is the same event ID: replay does not schedule automatic retries

// 4. See what your endpoint returned on each try
const { data: attempts } = await resend.webhooks.events.attempts.list({
  webhookId: '4dd369bc-aa82-4ff3-97de-514ae3000ee0',
  eventId,
});
// attempts.data[i]: { id, http_status_code, response, sent_at }
```

- **Both lists take `limit` (1 to 100, default 20) and `after`** (the last `id` of the previous page). There is no `before`: the API rejects it with 422.

## Manage webhooks

| Operation | Node |
|---|---|
| Create | `resend.webhooks.create({ endpoint, events })`, returns `{ object, id, signing_secret }` |
| List | `resend.webhooks.list()` |
| Get | `resend.webhooks.get(id)`: `status` (`enabled` or `disabled`), `endpoint`, `events`, `signing_secret` |
| Update | `resend.webhooks.update(id, { endpoint, events, status })`, partial updates allowed |
| Delete | `resend.webhooks.remove(id)` (not `.delete()`) |
| Rotate signing secret | `resend.webhooks.rotateSigningSecret(id)` (`POST /webhooks/:id/signing-secret/rotate`), returns `{ object: 'webhook', id, signing_secret }` |
| List events | `resend.webhooks.events.list({ webhookId, ...params })` |
| Get event | `resend.webhooks.events.get({ webhookId, eventId })` |
| Replay event | `resend.webhooks.events.replay({ webhookId, eventId })` |
| List event attempts | `resend.webhooks.events.attempts.list({ webhookId, eventId, ...params })` |

```typescript
// List all webhooks
const { data: webhooks, error: listError } = await resend.webhooks.list();

// Update endpoint URL or subscribed events
const { data: updated, error: updateError } = await resend.webhooks.update(
  '4dd369bc-aa82-4ff3-97de-514ae3000ee0',
  {
    endpoint: 'https://new-domain.com/webhook',
    events: ['email.delivered', 'email.bounced'],
  }
);

// Delete a webhook
const { data: deleted, error: deleteError } = await resend.webhooks.remove('4dd369bc-aa82-4ff3-97de-514ae3000ee0');

// Rotate the signing secret: for 24 hours payloads are signed with both secrets, then only the new one
const { data: rotated, error: rotateError } = await resend.webhooks.rotateSigningSecret('4dd369bc-aa82-4ff3-97de-514ae3000ee0');
// rotated: { object: 'webhook', id, signing_secret: 'whsec_...' }
// Update RESEND_WEBHOOK_SECRET with rotated.signing_secret right away
```

- **Rotate a leaked secret:** for 24 hours after rotation payloads are signed with both the old and the new secret, then only the new one. Update `RESEND_WEBHOOK_SECRET` with the new secret right away.
- **CLI:** `resend webhooks update ... --events email.sent email.delivered --status enabled`, `delete`, `get`, `list`.

## Store the events

- **Webhooks are ephemeral, and Resend keeps email data 30 days on all plans** (flexible on Enterprise). Store events yourself for longer.
- **Store at least** the `svix-id`, event type, timestamp and email ID.
- **Volume estimate:** 10,000 emails a month produce 30,000 to 50,000 events of 1 to 2 KB each, about 50 to 100 MB a month. Keep operational data 30 to 90 days; compliance often needs 1 to 7 years.
- **Webhook Ingester:** an open-source Next.js app (github.com/resend/resend-webhooks-ingester, Docker `ghcr.io/resend/resend-webhooks-ingester`) with Svix verification and idempotent storage on `svix_id`. Connectors at endpoints `/supabase`, `/neon`, `/postgresql`, `/mysql`, `/planetscale`, `/mongodb`, `/snowflake`, `/bigquery`, `/clickhouse`. Env `RESEND_WEBHOOK_SECRET` plus the connector's (e.g. `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `POSTGRESQL_URL`). Setup `pnpm db:setup --postgresql`. Tables `resend_wh_emails`, `resend_wh_contacts`, `resend_wh_domains` with `svix_id`, `event_type`, `event_created_at`, `webhook_received_at`. One database per deployment; retention by a scheduled delete (Supabase `pg_cron`).

```sql
SELECT
  DATE(event_created_at) AS day,
  event_type,
  COUNT(*) AS count
FROM resend_wh_emails
GROUP BY DATE(event_created_at), event_type
ORDER BY day DESC, event_type;
```

## IP allowlist

- **IPv4:** `44.228.126.217`, `50.112.21.217`, `52.24.126.164`, `54.148.139.208`.
- **IPv6:** `2600:1f24:64:8000::/52`.

## Local development

```bash
# Tailscale Funnel (recommended: permanent URL)
sudo tailscale funnel 3000

# ngrok
ngrok http 3000
# Then use the tunnel URL in Resend dashboard
```

- **VS Code Port Forwarding** also works. Register the tunnel URL with your route path, e.g. `https://example123.ngrok.io/api/webhook`.
- **CLI:** `resend webhooks listen --url <public url> [--events ...] [--forward-to <local url>] [--port 4318]` starts a server, registers a temporary webhook, streams events and cleans up on exit; `--forward-to` passes the original Svix headers ([CLI.md](CLI.md)).

## Common mistakes

| Mistake | Fix |
|---|---|
| Not verifying signatures | Always verify; unverified webhooks can't be trusted |
| Using the parsed JSON body | Use the raw request body; JSON parsing breaks the signature |
| Using `express.json()` middleware | Use `express.raw()` for webhook routes |
| Hardcoding the webhook secret | Store it in an environment variable |
| Returning non-200 for valid webhooks | Return 200 to acknowledge |
| Expecting the email body in `email.received` | Fetch it from the API |

## Prove it

- **Signature check works:** a POST to the endpoint with a made-up body and headers gets 400; a real event (send to `delivered@resend.dev`) gets 200.
- **Raw body is used:** the handler reads `req.text()` or `express.raw()` before anything parses it.
- **Dedupe works:** replaying an event with `resend.webhooks.events.replay` leaves one row for that `svix-id`.
- **Order doesn't matter:** status updates use `created_at`, so an `email.opened` processed before `email.delivered` leaves the right final state.
- **Bounces act:** a send to `bounced@resend.dev` produces `email.bounced`, and your handler removes or unsubscribes the address.
- **Endpoint health:** `resend.webhooks.events.list({ webhookId })` shows recent events as `success`, and `attempts.list` shows `http_status_code` 200.
- **Rotation drill:** after `rotateSigningSecret` and updating `RESEND_WEBHOOK_SECRET`, new events still verify.
