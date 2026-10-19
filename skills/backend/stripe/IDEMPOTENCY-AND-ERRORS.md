# Idempotency, errors and rate limits

A request to Stripe can fail before it runs, fail while it runs, or succeed without your code hearing back. Idempotency keys make retrying safe: retries with the same key return the saved result instead of repeating the operation. Most outcomes come down to three things: generating and persisting one key per operation and reusing it on every attempt, treating network errors and `500`s as indeterminate (reconcile before you start over with a new key), and catching errors by type. Webhook duplicates are covered in [WEBHOOKS.md](WEBHOOKS.md).

## Idempotency keys

- **Send the `Idempotency-Key` header** (curl: `-H "Idempotency-Key: KG5LxwFBepaKHyUD"`). The SDKs take the key in request options (`idempotencyKey` in Node).
- **`POST` only.** All `POST` requests accept idempotency keys. Don't send idempotency keys in `GET` and `DELETE` requests.
- **Key format:** V4 UUIDs, or another random string with enough entropy, up to 255 characters. Don't use sensitive data (email addresses, personal identifiers) as keys. Another strategy is deriving the key from a user-attached object such as a cart ID.
- **Persist the key per operation.** If you retry across separate SDK calls or process restarts, generate and persist a key for the operation and supply it to every attempt.
- **What gets saved (API v1):** Stripe saves the status code and body of the first request once endpoint execution begins. Retries with the same key return the saved response, including `500` errors. Content errors (4xx) are cached when execution began. Errors before execution (invalid parameters, invalid key, rate limiting), validation failures and concurrent conflicts aren't saved, so they are retryable.
- **API v2:** retries don't repeat successful operations, and Stripe retries failed work to completion. It uses different replay behavior and a 30-day window.
- **Parameters must match.** Stripe compares them with the original request and errors if they differ. Change parameters only after confirming the original didn't succeed, and use a new key then.
- **Pruning:** keys can be pruned after at least 24 hours; reusing a pruned key creates a new request.
- **Replays** carry the header `Idempotent-Replayed: true`.
- **`409`:** another request with the same key is still executing. Wait and retry with the same key. A new key can start a second operation.
- **[appeeky] review item:** `idempotencyKey` on create calls so retries are safe, plus an existing-subscription check before creating one (no double-bill).

## Retries and indeterminate outcomes

- **Network errors:** retry with the same idempotency key and parameters within the first 24 hours after the original request. After that, stop and reconcile.
- **`500`:** treat the outcome as indeterminate. Don't retry with a new key until reconciled: retrieve the object, inspect the Dashboard, use webhooks.
- **Leave a trail for reconciling.** When creating a resource, include a local identifier in its metadata so you can match an object received through a webhook to your local records. (Stripe's best-practices skill prefers resolving webhook events through the object graph over metadata; see [WEBHOOKS.md](WEBHOOKS.md#mapping-events-to-your-records).)
- **`Stripe-Should-Retry: true|false`:** the SDKs respect this header.
- **Configure SDK retries** in Node, with a restricted key loaded from env or a secrets manager:

```
require('stripe')(process.env.STRIPE_SECRET_KEY, { maxNetworkRetries: 2 })
```

- **Search is eventually consistent.** If a just-created object doesn't show up in search, don't retry the request that created it: that can create duplicate objects. Retrieve it by a deterministic ID (for example the Checkout Session ID) or a list endpoint.

## Status codes

| Code | Meaning |
|---|---|
| `402` | Request failed |
| `403` | Key lacks permissions |
| `409` | Conflict (same idempotency key still executing) |
| `424` | External dependency failed |
| `429` | Too many requests |
| `500`, `502`, `503`, `504` | Server errors; outcome indeterminate |

## Error handling in Node

- **Error fields:** `code`, `doc_url`, `message`, `param`, `request_log_url`, request ID (`req_...`), `type`.
- **Switch on `e.type`** (https://docs.stripe.com/error-handling.md?lang=node):

```javascript
// Don't put any keys in code. See https://docs.stripe.com/keys-best-practices.
const stripe = require('stripe')('<<YOUR_SECRET_KEY>>');

async function exampleFunction(args) {
  try {
    const paymentIntent = await stripe.paymentIntents.create(args);
    console.log('No error.');
  } catch (e) {
    switch (e.type) {
      case 'StripeCardError':
        console.log(`A payment error occurred: ${e.message}`);
        break;
      case 'StripeInvalidRequestError':
        console.log('An invalid request occurred.');
        break;
      // Add additional case statements for other Stripe error types as needed.
      // See all error types at https://docs.stripe.com/api/errors/handling?lang=node
      default:
        if (e instanceof stripe.errors.StripeError) {
          // All other Stripe errors
          console.log(`Status: ${e.statusCode}, Code: ${e.code}, Message: ${e.message}, Request ID: ${e.requestId}`);
        } else {
          throw e;
        }
        break;
    }
  }
}
```

- **`e.rawType`** holds the raw API type. Stored errors (for example `last_payment_error`) use API types (`card_error`, `invalid_request_error`).

| SDK error type | Problem | What the docs say to do |
|---|---|---|
| `StripeCardError` | An error occurred during a payment: a blocked payment, an issuer decline, or another payment error | Declines and other payment errors can occur when your integration is working correctly; use the decline code or error code to choose next steps |
| `StripeInvalidRequestError` | You made an API call with the wrong parameters, in the wrong state, or in an invalid way | Consult the error code documentation |
| `StripeConnectionError` | There was a network problem between your server and Stripe | Treat the result as indeterminate: retrieve the object and check its status, or listen for the webhook. For API v1, retry with the same idempotency key and parameters within 24 hours. This error can mask others |
| `StripeAPIError` | Something went wrong on Stripe's end (these are rare) | Treat the result as indeterminate; rely on webhooks for the outcome |
| `StripeAuthenticationError` | Stripe can't authenticate you with the information provided | Use the correct API key, and make sure it isn't one you rotated or revoked |
| `StripeIdempotencyError` | You used an idempotency key for something unexpected, like replaying a request with different parameters | Reuse a key only for identical API calls; keep keys under the 255-character limit |
| `StripePermissionError` | The API key used doesn't have the necessary permissions | Make sure a restricted key isn't used for a service it can't access; don't act in the Dashboard under a role that lacks permission |
| `StripeRateLimitError` | You made too many API calls in too short a time | Wait and retry; retry after a delay that grows exponentially if the error continues |
| `StripeSignatureVerificationError` | Webhook signature verification couldn't verify that an event is authentic | Can occur when a third party sends a fake webhook. Catch it and respond with a `400 Bad Request` |
- **Blocked vs declined:** retrieve `e.payment_intent.latest_charge`; `charge.outcome.type === 'blocked'` means a Radar block (requires API 2022-11-15 or later). Radar-blocked payments are card errors with code `fraud`.
- **Stored errors:** PaymentIntent `last_payment_error` (cleared on update; not a history log), SetupIntent `last_setup_error`, Invoice `last_finalization_error`, SetupAttempt `setup_error`, Payout `failure_code`, Refund `failure_reason`.
- **Least privilege:** use restricted keys with only the needed permissions (for example `payment_intent_write`, `payment_intent_read`, `charge_read`).
- **Test errors** with the PaymentMethods `pm_card_visa`, `pm_card_chargeDeclinedFraudulent`, `pm_card_radarBlock`, and `stripe trigger payment_intent.payment_failed`. Decline card numbers: [TESTING-AND-CLI.md](TESTING-AND-CLI.md).
- **[appeeky] review items:** Stripe errors caught by type with user-friendly messages; amounts follow the [currency contract](AGENT-TOOLS.md#the-stripe-mcp), with no float rounding bugs.

## Rate limits

| Limit | Value |
|---|---|
| Global, live | 100 requests/second |
| Global, sandbox | 25 requests/second |
| Individual endpoints | 25 requests/second unless noted |
| PaymentIntents | 1000 updates per PaymentIntent per hour |
| Subscriptions | 10 new invoices per subscription per minute, 20 per day; 200 quantity updates per hour |
| Files | 20/20 |
| Payouts | 15 creates/second |
| Connect account creation | 30/second live, 5/second sandbox |
| Search | 20 reads/second |
| Concurrency (live, default global) | 50 in-progress requests; list and expansion requests are heavier |
| Read allocation | Average 500 read requests per transaction |

- **Read the reason:** a `429` carries `Stripe-Rate-Limited-Reason`: `global-rate`, `endpoint-rate`, `global-concurrency`, `endpoint-concurrency`, `resource-specific`.
- **`429` without a reason may be a `lock_timeout`:** "This object cannot be accessed right now because another API request or Stripe process is currently accessing it...". The SDK retries lock timeouts automatically. Queue mutations to the same object sequentially.
- **Back off** exponentially with jitter, and use a client-side token bucket.
- **Don't load test against a sandbox:** its rate limiter is stricter, limits are lower and latency is mocked. Mock Stripe instead.
- **Test clocks:** many updates on a clocked subscription can hit rate limits; advance a few minutes between requests ([TESTING-AND-CLI.md](TESTING-AND-CLI.md)).

## Prove it

- Create calls pass an `idempotencyKey`, generated once per operation and persisted so retries after a restart reuse it; no `GET` or `DELETE` sends one.
- No idempotency key contains an email address or other personal identifier.
- Repeating a create with the same key returns the same object, with `Idempotent-Replayed: true` on the response.
- Catch blocks switch on `e.type`, and the webhook handler answers `StripeSignatureVerificationError` with `400`.
- A `500` or `StripeConnectionError` path retries with the same key or reconciles; it never retries with a new key blindly.
- Load tests run against a Stripe mock, not a sandbox.
