# Webhooks

Stripe tells your server what happened through events sent to an event destination (a webhook endpoint, Amazon EventBridge or Azure Event Grid). Webhooks are never optional: they are recommended for every payment integration and required for subscriptions, delayed-notification payment methods and any post-payment side effect. Most outcomes come down to four things: verifying the signature against the untouched raw body with the right `whsec_` secret, returning `2xx` fast before heavy work, deduplicating because Stripe retries and doesn't guarantee order, and using the shared [Checkout fulfillment contract](CHECKOUT-NEXTJS.md#fulfillment). Checkout specifics live in [PAYMENTS.md](PAYMENTS.md), the subscription lifecycle in [BILLING.md](BILLING.md), Supabase Edge Functions in [SUPABASE.md](SUPABASE.md).

**Contents:** [Why webhooks are required](#why-webhooks-are-required) · [Event destinations](#event-destinations) · [Thin vs snapshot events](#thin-vs-snapshot-events) · [The handler contract](#the-handler-contract) · [Next.js route handlers](#nextjs-route-handlers) · [Express handlers](#express-handlers) · [Event notification handlers (thin events)](#event-notification-handlers-thin-events) · [Signature verification by hand](#signature-verification-by-hand) · [Fulfillment](#fulfillment) · [Subscription events to handle](#subscription-events-to-handle) · [Mapping events to your records](#mapping-events-to-your-records) · [Retries, ordering and duplicates](#retries-ordering-and-duplicates) · [Secrets, IPs and versions](#secrets-ips-and-versions) · [Local testing](#local-testing) · [Troubleshooting and recovery](#troubleshooting-and-recovery) · [Conflicts between sources](#conflicts-between-sources) · [Prove it](#prove-it)

## Why webhooks are required

- **Never present webhooks as optional.** Never call webhook setup "optional", "nice to have" or skippable for a first pass. For a proof of concept, say webhooks are recommended now and required before launch or before adding subscriptions. Don't treat a Checkout integration as complete without an event handler; list it as a required remaining step.
- **Required for:** subscriptions and recurring billing (renewals, payment failures, cancellations, disputes, refunds and fraud signals happen asynchronously); delayed-notification payment methods (they succeed or fail hours or days later); any post-payment side effect (granting access, a confirmation email, decrementing inventory, writing an order to the database).
- **Connect:** webhooks are the source of truth for payment status; don't rely solely on synchronous API responses.

## Event destinations

- **Create** through the EventDestinations API (`/v2/core/event_destinations`) or the Webhooks tab in Workbench (Workbench replaces the Developers Dashboard). Dashboard flow: Create an event destination, Your account, payload format **Thin** (recommended) or **Snapshot** (snapshot also selects the API version), event types, Webhook endpoint, URL, then reveal the `whsec_` signing secret.
- **Limits:** a maximum of 16 event destinations per livemode or sandbox account; up to three uniquely versioned snapshot destinations with a version different from the account default. Webhook endpoints must be publicly accessible HTTPS URLs.

```curl
curl -X POST https://api.stripe.com/v2/core/event_destinations \
  -H "Authorization: Bearer <<YOUR_SECRET_KEY>>" \
  -H "Stripe-Version: 2026-09-30.preview" \
  --json '{
    "name": "My event destination",
    "type": "webhook_endpoint",
    "events_from": [
        "@self"
    ],
    "event_payload": "snapshot",
    "enabled_events": [
        "payment_intent.succeeded",
        "payment_intent.payment_failed"
    ],
    "webhook_endpoint": {
        "url": "https://mycompanysite.com/webhook"
    },
    "include": [
        "webhook_endpoint.signing_secret"
    ]
  }'
```

- **Thin destinations:** set `"event_payload": "thin"` (for example `"enabled_events": ["v1.billing.meter.error_report_triggered"]`). Thin events need a separate webhook endpoint.
- **Scopes (`events_from`):** `["@self"]` for your account, `["@accounts"]` for connected accounts. Organizations: `@organization_members`, `@organization_members/@accounts`.
- **Organization destinations can't** influence the Checkout redirect wait on `checkout.session.completed`, can't influence automatic invoice finalization by failing `invoice.created`, and can't subscribe to `issuing_authorization.request`.
- **Subscribe only to what you act on.** Listening for extra events (or all events) puts undue strain on your server. Changing `enabled_events` affects only future delivery.
- **Event permissions:** a restricted key with `Read` on the event's resource (for example `payment_intent`) can retrieve those events.
- **Retention:** Workbench shows 13 months. Under 15 days: full payload and resend; 16 to 30 days: payload only; over 30 days: summary only. The Events APIs return full payloads for 30 days. EventBridge events can't be manually resent.

## Thin vs snapshot events

| | Thin | Snapshot |
|---|---|---|
| Recommendation | Use for new integrations | Use when a third-party tool needs the full `Event` payload, you need `previous_attributes` without an extra API call, or a point-in-time view is acceptable |
| Versioning | Unversioned; fully typed in the SDKs | Payload version is `snapshot_api_version`, settable only at creation |
| Payload | `type`, `id`, `created`, `related_object` (`id`, `type`, `url`), `reason`, `context`; the full event adds `data` and `changes` (a `changes` hash) | `data.object` is the object at the time of the event |
| Getting current state | `fetchRelatedObject()` for the latest object, `.fetchEvent()` for more data | Can be stale by the time you process it: fetch the latest version from the API before acting |
| SDK types | `{EventType}EventNotification` / `{EventType}Event`; events the SDK has no classes for arrive as `UnknownEventNotification` | `Stripe.Event` |

- **Thin events require the Clover API release or later** in the handler.
- **Organizations (thin):** use `eventNotification.context` and set `stripeContext` on other calls yourself: `client.invoices.list(undefined, { stripeContext: eventNotification.context });`. `fetchEvent` and `fetchRelatedObject` set it automatically.
- **Statically typed SDKs** (.NET, Java, Go) need destination version equal to the SDK version.
- **Migrating snapshot to thin** for supported event types: https://docs.stripe.com/webhooks/migrate-snapshot-to-thin-events.md. After it, payloads no longer depend on API version upgrades.

## The handler contract

- **Accept a POST with JSON.**
- **Verify** with the raw payload, the `Stripe-Signature` header and the endpoint's `whsec_` secret before processing anything.
- **Don't manipulate the raw body.** Any change to it (reordering keys, stripping whitespace, converting to JSON, changing encoding) makes verification fail. The body must be the exact UTF-8 string.
- **Return `2xx` quickly**, before any complex logic that might time out. Process with an asynchronous queue: load spikes such as the beginning of the month when all subscriptions renew are expected.
- **Exempt the webhook route from CSRF protection.**
- **On a bad signature, respond `400`.** `StripeSignatureVerificationError`: catch it and respond with a `400 Bad Request`.
- **Handle unfamiliar event types gracefully;** new webhook event types count as backward-compatible changes.
- **[appeeky] must-haves:** raw body (no JSON pre-parse); `stripe.webhooks.constructEvent(body, sig, secret)`; dedupe by `event.id` (store processed IDs); return `200` fast with heavy work async; handle only subscribed events and ignore the rest gracefully. Match the project's stack (Next.js route, Express, Supabase Edge Function) or ask. Its pseudocode:

```
event = constructEvent(rawBody, sig, secret)
if alreadyProcessed(event.id): return 200
switch event.type: ...handle...
markProcessed(event.id)
return 200
```

## Next.js route handlers

- **App Router:** read the raw body with `await req.text()` and pass it to `constructEvent`. The official stripe-node example (`examples/webhook-signing/nextjs/app/api/webhooks/route.ts`):

```ts
import {Stripe} from 'stripe';
import {NextResponse} from 'next/server';
import {headers} from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: Request) {
  let event: Stripe.Event;

  try {
    const stripeSignature = (await headers()).get('stripe-signature');

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error(
        'Please set the STRIPE_WEBHOOK_SECRET environment variable'
      );
    }

    event = stripe.webhooks.constructEvent(
      await req.text(),
      stripeSignature as string,
      webhookSecret
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    // On error, log and return the error message.
    if (err! instanceof Error) console.log(err);
    console.log(`Error message: ${errorMessage}`);
    return NextResponse.json(
      {message: `Webhook Error: ${errorMessage}`},
      {status: 400}
    );
  }

  // Successfully constructed event.
  console.log('Success:', event.id);

  const permittedEvents: string[] = [
    'checkout.session.completed',
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
  ];

  if (permittedEvents.includes(event.type)) {
    let data;

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          data = event.data.object as Stripe.Checkout.Session;
          console.log(`CheckoutSession status: ${data.payment_status}`);
          break;
        case 'payment_intent.payment_failed':
          data = event.data.object as Stripe.PaymentIntent;
          console.log(`Payment failed: ${data.last_payment_error?.message}`);
          break;
        case 'payment_intent.succeeded':
          data = event.data.object as Stripe.PaymentIntent;
          console.log(`PaymentIntent status: ${data.status}`);
          break;
        default:
          throw new Error(`Unhandled event: ${event.type}`);
      }
    } catch (error) {
      console.log(error);
      return NextResponse.json(
        {message: 'Webhook handler failed'},
        {status: 500}
      );
    }
  }

  // Return a response to acknowledge receipt of the event.
  return NextResponse.json({message: 'Received'}, {status: 200});
}
```

- **Pages Router:** disable the body parser with `export const config = { api: { bodyParser: false } };`, read the body with a `buffer(req)` helper that concatenates the `data` chunks into a `Buffer`, then call `stripe.webhooks.constructEvent(body, sig, webhookSecret)`. Return `405` with `Allow: POST` for other methods (`examples/webhook-signing/nextjs/pages/api/webhooks.ts` in stripe-node).

## Express handlers

- **Keep `express.json()` off the webhook route:** use `express.raw({type: 'application/json'})` on it, and make sure `app.use(express.json())` appears after the webhook route.

Snapshot handler:

```javascript
// The express.raw middleware keeps the request body unparsed;
// this is necessary for the signature verification process
app.post('/webhook', express.raw({type: 'application/json'}), (request, response) => {
  let event;
  if (endpointSecret) {
    // Get the signature sent by Stripe
    const signature = request.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        signature,
        endpointSecret
      );
    } catch (err) {
      console.log(`Webhook signature verification failed.`, err.message);
      return response.sendStatus(400);
    }
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      break;
    case 'payment_method.attached':
      const paymentMethod = event.data.object;
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  response.json({received: true});
});
```

Thin handler (TypeScript, core):

```typescript
const client = new Stripe(apiKey);
app.post(
  '/webhook',
  express.raw({type: 'application/json'}),
  async (req, res) => {
    const sig = req.headers['stripe-signature'] ?? '';
    try {
      const eventNotification = client.parseEventNotification(
        req.body,
        sig,
        webhookSecret
      );
      if (eventNotification.type == 'v1.billing.meter.error_report_triggered') {
        console.log(`Meter w/ id ${eventNotification.related_object.id} had a problem`);
        const meter = await eventNotification.fetchRelatedObject();
        const event = await eventNotification.fetchEvent();
        console.log(`More info: ${event.data.developer_message_summary}`);
      }
      res.sendStatus(200);
    } catch (err) {
      res.status(400).send(`Webhook Error: ${(err as any).message}`);
    }
  }
);
```

## Event notification handlers (thin events)

- **Status:** public preview, described as "the preferred approach to process thin events in production". Node GA from `v22.6.0` (public preview `v20.2.0-beta.1`). Not supported for EventBridge on the public preview channel.
- **API:** `client.notificationHandler(webhookSecret, fallbackCallback)`; `client.notificationHandlerWithoutVerification(fallbackCallback)` for EventBridge and Event Grid; `handler.on('v1.billing.meter.error_report_triggered', async (event) => {...})`; `await handler.handle(req.body, sig)`; `handler.preHandle(fn)` returning `false` stops processing (use it for dedup). Errors such as `SignatureVerificationError` surface from `.handle(...)`.

## Signature verification by hand

- **Header format:** `t=...,v1=...,v0=...`. Only `v1` is a valid live scheme (`v0` is a fake for test events). Ignore every scheme that isn't `v1` (downgrade attacks).
- **Compute** HMAC SHA-256 over `timestamp + "." + raw body` with the endpoint secret, and compare in constant time.
- **Replay protection:** the libraries default to a tolerance of 5 minutes between the timestamp and the current time. Keep the clock synced with NTP. Don't use a tolerance of `0`: it disables the recency check entirely. Retries get a new signature and timestamp.

## Fulfillment

- **Checkout fulfillment and its server entrypoints** are defined once in [CHECKOUT-NEXTJS.md](CHECKOUT-NEXTJS.md#fulfillment). Required webhooks cover customers who never reach the redirect.
- **Checkout events:** handle `checkout.session.completed`, `checkout.session.async_payment_succeeded` and `checkout.session.async_payment_failed` under the [payment-status-gated fulfillment contract](CHECKOUT-NEXTJS.md#fulfillment).
- **Subscriptions:** provision when you receive `invoice.paid` and the subscription `status` is `active` (see below).

## Subscription events to handle

A subscription integration requires a destination that handles webhook events, because most subscription activity happens asynchronously. Use `customer.subscription.*` events whether customers are Accounts v2 or Customer objects. Before calling a subscription integration complete, handle `customer.subscription.*`, `invoice.paid` and `invoice.payment_failed`; never describe this handler as optional or "later". Lifecycle detail is in [BILLING.md](BILLING.md).

| Event | Meaning and action |
|---|---|
| `customer.created` / `v2.core.account.created` | Customer created |
| `customer.subscription.created` | Status might be `incomplete` if authentication is needed or with `payment_behavior: default_incomplete` |
| `customer.subscription.updated` | Subscription starts or changes (renewal, coupon, discount, invoice item, plan change) |
| `customer.subscription.deleted` | Subscription ends |
| `customer.subscription.paused` | Status `paused` (for example a trial ended without a payment method); not sent when you pause payment collection |
| `customer.subscription.resumed` | Resumed from `paused`; not sent for unpausing collection |
| `customer.subscription.trial_will_end` | Sent 3 days before the trial ends (immediately if the trial is shorter than 3 days); verify a payment method exists |
| `entitlements.active_entitlement_summary.updated` | Provision or de-provision features |
| `invoice.created` | If Stripe gets no successful response, finalizing all invoices with automatic collection is delayed for up to 72 hours |
| `invoice.finalized` | Invoice finalized |
| `invoice.finalization_failed` | Inspect `last_finalization_error`; Stripe Tax `automatic_tax[status]=requires_location_inputs`: collect location; `failed`: retry later |
| `invoice.paid` | Provision access when this arrives and the subscription `status` is `active` |
| `invoice.payment_action_required` | Payment needs authentication |
| `invoice.payment_failed` | Notify the customer, enable Smart Retries, collect a new payment method and confirm the PaymentIntent, update `default_payment_method`. The subscription stays `incomplete` only for the first invoice |
| `invoice.upcoming` | A few days before renewal per the "Upcoming renewal events" setting; not sent for `collection_method=send_invoice`; add extra invoice items here |
| `invoice.updated` | Payment succeeds (`status` `paid`) or fails (`status` stays `open`) |
| `payment_intent.created`, `payment_intent.succeeded` | PaymentIntent lifecycle |
| `subscription_schedule.aborted`, `.canceled`, `.completed`, `.created`, `.expiring` (7 days before expiry), `.released`, `.updated` | Schedule lifecycle |

- **Also handle risk events in production:** `charge.dispute.created`, `charge.refunded`, `radar.early_fraud_warning.created`. If you omit them, you won't learn about disputes or fraud warnings until you check the Dashboard.
- **Local Customer copy:** if you store Customer data (email, name, address, default payment method), also handle `customer.updated`. Accounts v2: `v2.core.account[configuration.customer].updated` (customer-config changes such as the default payment method) and `v2.core.account[identity].updated` (billing address, identity fields). Integrations that don't store Customer data can skip these.
- **Track access with an expiration timestamp per customer.** On `invoice.paid`, find the customer, retrieve the subscription and confirm its status is `active` before extending access. A paid invoice doesn't necessarily move the subscription to `active` when status resolution uses all invoices.
- **Status changes:** on `past_due`, notify the customer. When a subscription changes to `canceled` or `unpaid`, revoke access.
- **Invoice timing:** Stripe waits an hour after a successful response to `invoice.created` before attempting payment. Without a successful response within 72 hours, Stripe attempts to finalize and send the invoice anyway; it won't charge the customer until it gets a successful response, and emails you. This applies to Connect apps' endpoints too; organization endpoints don't affect finalization. Check the invoice's `subscription` property to tell one-off invoices from subscription invoices.
- **Subscriptions stay active if invoices can't be finalized,** so users may keep access while you can't collect payment.
- **[appeeky] core events for subscription SaaS:** `checkout.session.completed` to provision access and save customer and subscription IDs; `customer.subscription.updated` to sync plan and status; `customer.subscription.deleted` to revoke access; `invoice.payment_failed` to trigger a dunning email or banner; `invoice.paid` to confirm renewal. Stripe's own subscription webhooks page instead ties provisioning to `invoice.paid` with an `active` subscription. Confirm in the current docs.

## Mapping events to your records

- **Stripe's skill:** don't map async events to application objects through metadata by default. Resolve each event through Stripe's object graph to the first-class Stripe resource that represents your app's ownership boundary, then map its ID to your database records. Use metadata only as an explicit fallback.
- **Stripe's error-handling docs** say the opposite for creates: include a local identifier in the resource's metadata so you can match an object received through a webhook to your local records. Both are Stripe's; confirm in the current docs which fits your case.
- **Refund or dispute to subscription (API `2025-03-31.basil` or later):** get the PaymentIntent ID, list invoice payments with `payment.type=payment_intent`, `payment.payment_intent=<id>`, `status=paid` (paginate: one PaymentIntent can map to several invoices), retrieve each Invoice, check `parent.type` is `subscription_details` and read `parent.subscription_details.subscription`. Before basil: the Charge's `invoice` field leads to the Invoice's `subscription`.

## Retries, ordering and duplicates

- **Automatic retries:** live mode, for up to three days with exponential back off; sandbox, three times over a few hours. Disabled or deleted destinations stop retries.
- **Manual retries:** Dashboard **Resend** up to 15 days after creation; CLI `stripe events resend <event_id> --webhook-endpoint=<endpoint_id>` up to 30 days (`--account` for Connect endpoints). A manual resend doesn't cancel the automatic retry schedule, even if it returns `2xx`.
- **No ordering guarantee.** Creating a subscription can deliver `customer.subscription.created`, `invoice.created`, `invoice.paid`, `charge.created` in any order. Snapshot events record `created` in seconds, so distinct events can share a timestamp: don't use `created` to order events or to decide whether you processed one. Retrieve missing objects from the API.
- **Duplicates:** log processed event IDs. Sometimes two separate Event objects are generated for one change; identify those with the ID of the object in `data.object` together with `event.type`.
- **Already processed:** skip it and return `200` so Stripe stops retrying.

| Response | Meaning |
|---|---|
| `2xx` | Delivered |
| `3xx` | Counts as a failure |
| `400`, `401`, `403`, `404`, `405` | Make sure the endpoint is public and accepts POST |
| `5xx` | Check your logs |
| TLS error | Only TLS v1.2 and v1.3 are supported |
| Timeout | Defer complex logic until after the response |

The Event deliveries tab shows `Delivered`, `Pending` and `Failed`.

## Secrets, IPs and versions

- **Each endpoint has its own secret,** and test and live secrets differ. Signing secrets aren't API keys, but handle them like secret API keys.
- **Roll signing secrets periodically:** Workbench, endpoint, the overflow menu, **Roll secret**. You can delay the old secret's expiry for up to 24 hours; Stripe signs once per active secret.
- **Defense in depth:** use both IP allowlisting (https://docs.stripe.com/ips.md) and signature verification.
- **Event structure follows the account's API version at the time of the event.** Per-request version overrides don't change it, and events are immutable. Webhook events use the account default unless an API version is set when the endpoint is created. Test destinations can be set to the default or latest version. Upgrading a destination's version: [API-VERSIONS.md](API-VERSIONS.md).

## Local testing

- **Forward events:** `stripe login`, then `stripe listen --forward-to localhost:4242/webhook` (snapshot) or `stripe listen --forward-thin-to localhost:4242/webhook --thin-events "*"` (thin). Connect: `stripe listen --forward-connect-to localhost:4242/webhook`; thin Connect: `stripe listen --forward-thin-connect-to localhost:4242/webhook --thin-events "*"`. Output: `Ready! Your webhook signing secret is '{{WEBHOOK_SIGNING_SECRET}}' (^C to quit)`. `--forward-to` can't be used in the Workbench Shell.
- **Trigger:** `stripe trigger payment_intent.succeeded`; thin: `stripe trigger v1.billing.meter.error_report_triggered`. Without a public URL, an ngrok tunnel also works. More CLI flags in [TESTING-AND-CLI.md](TESTING-AND-CLI.md).

## Troubleshooting and recovery

- **`Webhook signature verification failed. Err: No signatures found matching the expected signature for payload.`** One of body, signature or secret is wrong. Most common: the wrong secret. The CLI's secret differs from the Dashboard endpoint's; both start with `whsec_`. Then check the body is untouched and the header has the `t=xxx,v1=yyy,v0=zzz` shape.
- **Backlog recovery:** list undelivered events and replay them through your handler, guarded by a processing check:

```
stripe.events.list({ ending_before: 'evt_001', types: [...], delivery_success: false })
```

  with `.autoPagingEach(...)`. Only events from the last 30 days are returned; the default page is 10; `ending_before` with auto-pagination returns chronological order. Guard each one with `is_processing_or_processed` / `mark_as_processing` / `mark_as_processed`. Stripe still treats manually processed events as undelivered and keeps retrying them; skip them and return `200`.
- **Missing event types:** recover with List events v1 (`type`) or v2 (`types`) within 30 days, per account context (`Stripe-Account` / `Stripe-Context`).
- **Event-generation failures (public preview):** Stripe sends `v2.core.health.event_generation_failure.resolved`. The missed event is irrecoverable; poll the affected resource (for example retrieve the PaymentIntent).
- **[appeeky] reliability audit:** check the Dashboard's recent deliveries (Developers, Webhooks); search the code for `stripe.webhooks`, `checkout.session.completed`, `customer.subscription`, `invoice.payment_failed`; list endpoints, handled events, missing critical events and failed deliveries. Typical symptoms: "subscription not syncing", "checkout completed but no access".

## Conflicts between sources

- **`invoice.payment_failed` PaymentIntent status:** Stripe's subscription webhooks page says it "changes to `requires_action`" in its main table and its "requires additional action" table, but "changes to `requires_payment_method`" in its "Handle payment failures" table. Confirm in the current docs.
- **`trial_will_end` timing:** the webhooks page says "3 days before"; the trials page says the Dashboard "Trial ending events" setting defaults to 3 days. Stripe's reminder emails go at 7 days.
- **Thin events for API v1 resources:** the event destinations page lists thin events for "API v1 and API v2 resource state changes"; the upgrades page says thin events for v1 resources are in private preview. Confirm in the current docs.
- **Thin event parsing in Node:** the webhooks page uses `parseEventNotification`; the usage-based recording page uses `parseThinEvent` plus `client.v2.core.events.retrieve`.

## Prove it

- `stripe listen --forward-to localhost:4242/webhook` prints `Ready! Your webhook signing secret is ...`, and the handler uses that secret locally.
- `stripe trigger payment_intent.succeeded` reaches the handler and returns `200`; altering the body or using the Dashboard secret returns `400`.
- The route reads the raw body (`await req.text()`, `express.raw`, or `bodyParser: false` with `buffer(req)`), and no JSON parser runs before it.
- Sending the same event twice (`stripe events resend <event_id> --webhook-endpoint=<endpoint_id>`) changes nothing the second time and returns `200`.
- Checkout passes the [fulfillment checks](CHECKOUT-NEXTJS.md#prove-it), including repeated webhook delivery and landing-page requests, with payment-status gating.
- A subscription integration handles `customer.subscription.*`, `invoice.paid` and `invoice.payment_failed`, plus `charge.dispute.created`, `charge.refunded` and `radar.early_fraud_warning.created`, and nothing it doesn't act on.
- The Event deliveries tab shows `Delivered`, with no `Failed` entries.
