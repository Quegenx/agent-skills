# Backend and webhooks

Your server never verifies receipts with RevenueCat: RevenueCat's backend is the receipt verification server, and your backend only learns state from it, either by asking (the REST API with a secret key) or by being told (webhooks). Most outcomes come down to three things: which mechanism a premium endpoint trusts (and that it is never the client), whether the webhook handler is authenticated, idempotent and quick to acknowledge, and whether it revokes access only on `EXPIRATION`. Key handling and Trusted Entitlements are [ERRORS-AND-SECURITY.md](ERRORS-AND-SECURITY.md); the `rc` CLI and dashboard paths are [CLI-AND-API.md](CLI-AND-API.md); entitlements, offerings and App User IDs are [CONCEPTS.md](CONCEPTS.md).

**Contents:** [What the backend owns](#what-the-backend-owns) · [Pick the mechanism](#pick-the-mechanism) · [Webhooks: setup and delivery](#webhooks-setup-and-delivery) · [Webhook authentication](#webhook-authentication) · [The handler](#the-handler) · [Event types](#event-types) · [Event fields](#event-fields) · [Event flows](#event-flows) · [Example payloads](#example-payloads) · [REST API v1](#rest-api-v1) · [REST API v2](#rest-api-v2) · [Store notifications to your own server](#store-notifications-to-your-own-server) · [Supabase and other backends](#supabase-and-other-backends) · [Prove it](#prove-it)

## What the backend owns

- **RevenueCat verifies receipts.** On a purchase token post it calls `purchases.subscriptionsv2.get` or `purchases.products.get` on the Google Play Developer API, validates the receipt and product, records the transaction and returns `CustomerInfo` to the SDK. Neither your app nor your server calls the Google Play Developer API for this.
- **You may not need a backend at all.** If the app only gates features inside the client, there may be no backend component. Serve premium content from a server only when you can verify entitlement on the server.
- **Your backend still owns:** user authentication, your database of users and access levels, the endpoints serving premium content, and the webhook receiver.
- **Your backend does not own:** Google Play Developer API credentials, receipt verification code, `linkedPurchaseToken` chain traversal, or subscription state computation across the seven subscription states.
- **What not to build:** no Google Play receipt verification endpoint; do not pass purchase tokens from client to server for manual verification (the SDK handles the round trip); do not query the Google Play Developer API from your backend unless you are building a custom integration that bypasses the SDK; do not mirror the seven-state subscription machine in your database. Consume `CustomerInfo.entitlements.active` or webhook events instead. The one stated exception is deferral and revocation through `purchases.subscriptionsv2.defer` and `purchases.subscriptionsv2.revoke` (see [BILLING-AND-RECOVERY.md](BILLING-AND-RECOVERY.md)).
- **Before coding,** have a secret API key, know which `app_user_id` the SDK uses (the same identifier your auth system uses), and decide between real-time state (REST) and event-driven state (webhooks).

## Pick the mechanism

| Use case | Mechanism | Notes |
|---|---|---|
| React to purchase, renewal, cancellation | Webhook receiver | RevenueCat posts normalized events; your server updates its own DB. |
| Check current entitlement for a user | `GET /v1/subscribers/{app_user_id}` | Secret API key in `Authorization` header. |
| Grant promotional access (support, refunds, comps) | `POST /v1/subscribers/{app_user_id}/entitlements/{entitlement_id}/promotional` | Server side only. |
| Revoke promotional access | `POST /v1/subscribers/{app_user_id}/entitlements/{entitlement_id}/revoke_promotionals` | Server side only. |
| Set subscriber attributes from server side data | `POST /v1/subscribers/{app_user_id}/attributes` | Useful for CRM fields the SDK does not know. |
| Bulk data export | RevenueCat data export | Scheduled exports to your warehouse. |

- **SDK or REST:** use the SDK when code runs in the app (purchase, restore, cached CustomerInfo, offerings, identify and log out, listeners, UI entitlement gating). Use REST when code runs on your backend, a webhook handler, an admin tool or a scheduled job: grant or revoke a promotional entitlement, override a subscription, look up a subscriber from another service, refund, deliver events to another system, or integrate a system that cannot embed the SDK.
- **Per premium endpoint, pick one:** (1) call the RevenueCat REST API per request, or (2) read a local `has_entitlement` flag driven by webhooks. Option 2 is cheaper at request time; option 1 has no cache staleness. Pick one, document it, and do not mix per endpoint without a reason. Never trust `customerInfo` or a header sent by the client.
- **For access decisions in REST API v2,** read `gives_access` on the subscription instead of writing your own logic.
- **After a server-side grant,** the client should force a fresh CustomerInfo fetch instead of reading its cache (the Android SDK's `CacheFetchPolicy.FETCH_CURRENT`; React Native has `invalidateCustomerInfoCache()` for info changed externally, such as a dashboard grant). See [FLUTTER.md](FLUTTER.md) and [REACT-NATIVE.md](REACT-NATIVE.md).

## Webhooks: setup and delivery

- **Plan:** webhooks are available on the Pro plan.
- **Register:** project, **Integrations**, **Webhooks**, **Add new configuration**: name, HTTPS URL, an optional authorization header sent with each POST, production, sandbox or both, one app or all apps, and an optional event-type filter. A project can have several webhook integrations (for example separate production and sandbox backends). Dashboard path: `/projects/{projectId}/integrations/webhooks`.
- **Prerequisites:** an HTTPS POST endpoint that takes a JSON body, plus durable storage for processed event IDs and entitlement state per `app_user_id`.
- **One endpoint, one schema:** RevenueCat posts one normalized JSON event schema for every store. Products are already mapped to entitlements, so branch on `event.type` and read `event.entitlement_ids`; do not keep a product-to-entitlement table on your backend.
- **Success is 200.** Any other status is a failure. RevenueCat retries up to 5 times with exponential backoff at about 2.5, 5, 10, 20 and 40 minutes (with jitter), about 80 minutes in total, then stops. Retry manually with **Retry** on the integration page or the event details page.
- **60-second limit:** the response must finish within 60 s or RevenueCat disconnects. Defer processing until after the response is sent.
- **Delivery delays:** most events arrive within 5 to 60 seconds; cancellation events usually within 2 hours.
- **At least once:** delivery is best effort for at least one delivery, so the same event can arrive twice. `id` and `event_timestamp_ms` are reused on retries.
- **Future proofing:** new fields and event types may be added without changing the API version.
- **Testing:** sandbox purchases (`environment` = `SANDBOX`) or test events sent from the dashboard (`TEST` events come for App Store and Google Play only). The dashboard **Customers** page shows the purchase and `CustomerInfo` JSON; its **Events** tab shows the webhooks fired for a test purchase.

## Webhook authentication

The sources disagree on how RevenueCat authenticates a webhook. Confirm the current method at `https://www.revenuecat.com/docs/integrations/webhooks` before building.

| Source | Mechanism |
|---|---|
| rc-webhooks skill | Verify a signature in header `X-RevenueCat-Signature` against the webhook secret (`verifySignature(body, signature, webhookSecret)` over the raw body text, read first); respond 401 on failure. It does not define the algorithm. The secret lives under **Integrations**, **Webhooks**. |
| rc-backend skill | Compare the `Authorization` header to `"Bearer ${RC_WEBHOOK_SECRET}"`: verify the authorization header you configured in the dashboard. |
| RevenueCat docs | Two options. (1) The recommended authorization header value you set in the dashboard; your server should verify it on every notification. (2) Optional **HMAC webhook signing** with header `X-RevenueCat-Webhook-Signature` (not `X-RevenueCat-Signature`). |

HMAC signing as the docs define it:

- **Header:** `X-RevenueCat-Webhook-Signature: t=<unix_timestamp>,v1=<hmac_sha256_hex>`.
- **Signed string:** HMAC-SHA256 over `"<timestamp>.<raw_json_body>"` with the signing secret, computed over the raw body bytes exactly as received (in Express, `express.raw()`), compared in constant time.
- **Replay window:** optionally reject when `abs(now - t)` exceeds a tolerance (for example 5 minutes). `t` and `v1` are recomputed on every attempt, so do not size the tolerance to the 80-minute retry window.
- **Secret:** shown only once. **Rotate secret** invalidates the old one immediately.

```js
const crypto = require("crypto");
function verifySignature(payload, header, secret, tolerance = 300) {
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const idx = p.indexOf("=");
      return [p.slice(0, idx), p.slice(idx + 1)];
    }),
  );
  const timestamp = parts.t;
  const expectedSig = parts.v1;
  const signedPayload = `${timestamp}.${payload}`;
  const computed = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");
  if (
    !crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(expectedSig))
  ) {
    return false;
  }
  if (Math.abs(Date.now() / 1000 - parseInt(timestamp)) > tolerance) {
    return false;
  }
  return true;
}
```

## The handler

- **The job:** verify the request, deduplicate by `event.id`, dispatch per event type.
- **Acknowledge fast:** return 2xx as soon as the event is persisted. If processing is slow, enqueue it and acknowledge. A slow handler causes retries and duplicate deliveries.
- **Idempotency key is `event.id`.** An already-processed event falls through and the responder still returns 200. The insert-if-absent must be atomic (a unique index on `event_id` plus an insert that swallows duplicate-key errors works). Do all downstream writes in the same transaction as the event ID insert, so a crash mid-handler cannot leave an event marked but unapplied.
- **Dispatch:** `INITIAL_PURCHASE`, `RENEWAL`, `UNCANCELLATION` grant (with `expiration_at_ms`); `CANCELLATION` schedules revocation; `EXPIRATION` revokes; `BILLING_ISSUE` flags; `PRODUCT_CHANGE` updates the product; `SUBSCRIBER_ALIAS` and `TRANSFER` merge identity. Non-renewing purchase fulfillment follows its product contract; do not discard `NON_RENEWING_PURCHASE` as an unknown no-op. [https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields]
- **Grant must be idempotent and additive,** so it is safe on `RENEWAL` against a user whose entitlements are currently revoked. Extending only an existing expiry leaves a resubscribed user locked out.
- **Scheduled revocation:** store a pending job keyed by `(app_user_id, entitlement_id)` that fires at `expiration_at_ms`. If `UNCANCELLATION` arrives first, cancel the job. If `EXPIRATION` arrives first, let the `EXPIRATION` handler revoke and drop the pending job.
- **Alternative: sync, don't interpret.** The docs recommend calling `GET /subscribers` after receiving any webhook, so data always arrives in the same format, instead of custom logic per event.
- **Find the user by every ID:** search both `original_app_user_id` and the `aliases` array when looking up users from a webhook.
- **Parse defensively:** keys marked "Always" may still be `null`; keys marked "Sometimes" may be omitted.
- **Stripe renewals:** the entitlement is extended when the new period starts, but the `RENEWAL` webhook comes only after the invoice is paid. Do not remove access as soon as the previous `expiration_at_ms` passes; keep it until `EXPIRATION`, or call `GET /subscribers` first. A missing `RENEWAL` webhook does not mean the subscription expired.
- **Conflict on CANCELLATION:** the rc-backend skill's outline groups `CANCELLATION` with `EXPIRATION` into `scheduleRevocation(event.appUserId)`, grants only on `INITIAL_PURCHASE` and `RENEWAL`, and reads `event.entitlements`. The rc-webhooks skill and the docs field list use `entitlement_ids` (the docs mark `entitlement_id` deprecated), schedule revocation at `expiration_at_ms` on `CANCELLATION`, revoke on `EXPIRATION` and grant on `UNCANCELLATION`. Follow the rc-webhooks pattern and confirm field names in the current docs.

### Rules for access changes

- **`CANCELLATION` is not an access change.** It is an intent signal. Revoking now deletes paid access the user still owns. It also fires for refunds (with `cancel_reason` `CUSTOMER_SUPPORT`; for refunds auto-renew may still be on; it fires only when the latest period is refunded).
- **`EXPIRATION` is the access change.** Revoke then. It arrives within seconds to minutes with platform server notifications, otherwise with about a 1-hour delay.
- **`BILLING_ISSUE` is not revocation.** It does not mean the subscription expired; revoking cuts off users still inside a grace period or account hold. RevenueCat sends `EXPIRATION` if recovery fails. It fires once per failure streak. You can ignore it if you handle `CANCELLATION` with `cancel_reason=BILLING_ERROR`.
- **`SUBSCRIPTION_PAUSED` is not revocation** (Google only). Revoke only on `EXPIRATION` with expiration reason `SUBSCRIPTION_PAUSED`.
- **Resubscription:** the rc-webhooks and rc-cancellations skills say resubscription after `EXPIRATION` fires `RENEWAL`, not `INITIAL_PURCHASE`. The docs' event flows say a Google resubscribe can be `RENEWAL` (during grace) or `INITIAL_PURCHASE` (after expiry). Either way, grant access on both events.

## Event types

| Event type | Meaning | Handler action |
|---|---|---|
| `TEST` | Test event from the dashboard (App Store and Google Play only) | None |
| `INITIAL_PURCHASE` | First paid transaction for this user and product | Grant `entitlement_ids` |
| `RENEWAL` | Renewal, or a lapsed user resubscribed | Grant or extend `entitlement_ids` |
| `CANCELLATION` | Auto-renew turned off, or refunded; access continues until `expiration_at_ms` | Schedule revocation at `expiration_at_ms`; do not revoke now |
| `UNCANCELLATION` | Auto-renew re-enabled before expiry (not Stripe) | Cancel any scheduled revocation |
| `NON_RENEWING_PURCHASE` | A purchase that won't auto-renew | Apply its consumable/non-consumable fulfillment contract |
| `SUBSCRIPTION_PAUSED` | Scheduled to pause at the end of the current period (Google only) | Do not revoke |
| `EXPIRATION` | Subscription actually ended; remove the user's access | Revoke now |
| `BILLING_ISSUE` | Payment failed; user may be in grace period or on hold | Flag; do not revoke |
| `PRODUCT_CHANGE` | Plan switched (upgrade, downgrade, crossgrade); not necessarily in effect immediately (not Amazon, Roku, Promo) | Update the product on record; entitlements follow `entitlement_ids` |
| `SUBSCRIPTION_EXTENDED` | The current period's expiration date was pushed back. On Google Play it can also fire when Google defers a renewal charge by less than 24 hours; `RENEWAL` or `BILLING_ISSUE` may follow within 24 hours | |
| `REFUND_REVERSED` | A refund was reversed (App Store only) | |
| `INVOICE_ISSUANCE` | A new, unpaid invoice was issued (RevenueCat Billing only) | |
| `TRANSFER` | A transaction moved between app user IDs; sent only for the destination user | Move entitlements from the old ID to the new ID |
| `TEMPORARY_ENTITLEMENT_GRANT` | Outage grant of at most 24 hours, followed by `INITIAL_PURCHASE` or `EXPIRATION`; only `app_user_id` identity | |
| `VIRTUAL_CURRENCY_TRANSACTION` | Virtual currency transaction | |
| `EXPERIMENT_ENROLLMENT` | Experiment enrollment | |
| `PURCHASE_REDEEMED` | Paddle, RevenueCat Billing or Stripe redemption deep link; sent in addition to `TRANSFER` if transferred | |
| `SUBSCRIBER_ALIAS` | Two app user IDs merged | Merge local records. The docs mark it **Deprecated**: new projects don't receive it. |
| `PRICE_INCREASE_CONSENT_REQUIRED`, `PRICE_INCREASE_CONSENT_APPROVED` | App Store, Google Play | |

- **Pause conflict:** the rc-cancellations skill says RevenueCat does not emit a dedicated pause webhook; the docs list `SUBSCRIPTION_PAUSED` (Google only). Confirm in the current docs.

## Event fields

- **Envelope:** `{ "api_version": "1.0", "event": { ... } }`.
- **Example event keys:** `aliases`, `app_id`, `app_user_id`, `commission_percentage`, `country_code`, `currency`, `entitlement_id`, `entitlement_ids`, `environment`, `event_timestamp_ms`, `expiration_at_ms`, `id`, `is_family_share`, `offer_code`, `original_app_user_id`, `original_transaction_id`, `period_type`, `presented_offering_id`, `price`, `price_in_purchased_currency`, `product_id`, `purchased_at_ms`, `store`, `subscriber_attributes`, `takehome_percentage`, `tax_percentage`, `transaction_id`, `type`.
- **`app_id`** is omitted for the `PROMOTIONAL` store and for `EXPERIMENT_ENROLLMENT`.

| Field | Values and rules |
|---|---|
| `product_id` | Google products after Feb 2023: `<subscription_id>:<base_plan_id>` |
| `period_type` | `TRIAL`, `INTRO`, `NORMAL`, `PROMOTIONAL`, `PREPAID` |
| `expiration_at_ms` | `null` for non-subscription and lifetime. Period duration = `expiration_at_ms - purchased_at_ms`. |
| `purchased_at_ms` | App Store renewals can be later than `event_timestamp_ms` (Apple charges up to 24 hours early) |
| `environment` | `SANDBOX`, `PRODUCTION` |
| `entitlement_id` | **Deprecated**; use `entitlement_ids` |
| `store` | `AMAZON`, `APP_STORE`, `MAC_APP_STORE`, `PADDLE`, `PLAY_STORE`, `PROMOTIONAL`, `RC_BILLING`, `ROKU`, `STRIPE`, `TEST_STORE` |
| `price` | USD; 0 for trials, negative for refunds |
| `takehome_percentage` | **Deprecated** |
| `renewal_number` | Starts at 1; trial conversions count |
| `metadata` | RevenueCat Billing |
| `grace_period_expiration_at_ms` | `BILLING_ISSUE` only |
| `auto_resume_at_ms` | `SUBSCRIPTION_PAUSED` |
| `is_trial_conversion` | `RENEWAL` |
| `new_product_id` | `PRODUCT_CHANGE` |
| `transferred_from`, `transferred_to` | `TRANSFER` (arrays) |
| `redeemed_from`, `redeemed_by`, `redemption_outcome` (`alias`, `transfer`, `redeemer_owns`), `redemption_platform` | `PURCHASE_REDEEMED` |

Other fields: `presented_offering_id`, `transaction_id`, `original_transaction_id`, `is_family_share`, `country_code`, `currency`, `price_in_purchased_currency`, `tax_percentage`, `commission_percentage`, `offer_code`, `discount_*`, `quantity`, `subscriber_attributes`.

`cancel_reason` and `expiration_reason` values:

| Value | Meaning |
|---|---|
| `UNSUBSCRIBE` | Subscriber canceled voluntarily; fires at unsubscribe, not at expiry |
| `BILLING_ERROR` | The store could not charge the subscriber's payment method. `CANCELLATION` with this reason fires as soon as the billing issue is detected; `EXPIRATION` with it fires if the grace period ends without recovery |
| `DEVELOPER_INITIATED` | Developer cancelled |
| `PRICE_INCREASE` | Subscriber did not agree to a price increase |
| `CUSTOMER_SUPPORT` | Refunds. Does not mean auto-renew was turned off; check the current subscription status. |
| `UNKNOWN` | Apple did not provide the reason |
| `SUBSCRIPTION_PAUSED` | `EXPIRATION` only, Google |

Use `cancel_reason` for backend win-back segmentation.

## Event flows

Events may arrive out of order.

- **Cancellation:** `CANCELLATION`, then `EXPIRATION` at period end.
- **Billing issue:** `BILLING_ISSUE` and `CANCELLATION` (`BILLING_ERROR`) immediately. Without a grace period, `EXPIRATION` immediately. With one, `RENEWAL` if recovered or `EXPIRATION` at its end.
- **Trials:** `INITIAL_PURCHASE` with `period_type` `TRIAL`; conversion is `RENEWAL`; cancel during trial is `CANCELLATION` then `EXPIRATION`. On Apple, cancelling within 24 h of trial end may yield `CANCELLATION` then `RENEWAL`.
- **Product change, immediate:** `PRODUCT_CHANGE` plus `RENEWAL` (App Store) or `INITIAL_PURCHASE` (Google). **At period end:** `PRODUCT_CHANGE` now, `RENEWAL` at renewal. `PRODUCT_CHANGE` is informative; its `expiration_at_ms` is for the old product.
- **Transfer:** only when restore behaviour is transfer.
- **Android pause:** revokes at term end.
- **Refund sample:** a `CANCELLATION` with `"cancel_reason" : "CUSTOMER_SUPPORT"` and `"price" : -9.99`. The docs publish samples for every event type at `https://www.revenuecat.com/docs/integrations/webhooks/sample-events`.

## Example payloads

`INITIAL_PURCHASE`:

```json
{
  "api_version": "1.0",
  "event": {
    "id": "evt_01HABCXYZ0000000000000001",
    "type": "INITIAL_PURCHASE",
    "app_user_id": "user_12345",
    "product_id": "premium_monthly",
    "period_type": "NORMAL",
    "purchased_at_ms": 1700000000000,
    "expiration_at_ms": 1702592000000,
    "store": "PLAY_STORE",
    "environment": "PRODUCTION",
    "entitlement_ids": ["pro_access"],
    "transaction_id": "GPA.1234-5678-9012-34567"
  }
}
```

`CANCELLATION` (access continues until `1702592000000`):

```json
{
  "api_version": "1.0",
  "event": {
    "id": "evt_01HABCXYZ0000000000000010",
    "type": "CANCELLATION",
    "app_user_id": "user_12345",
    "product_id": "premium_monthly",
    "purchased_at_ms": 1700000000000,
    "expiration_at_ms": 1702592000000,
    "entitlement_ids": ["pro_access"],
    "store": "PLAY_STORE",
    "environment": "PRODUCTION"
  }
}
```

`EXPIRATION` (revoke now):

```json
{
  "api_version": "1.0",
  "event": {
    "id": "evt_01HABCXYZ0000000000000011",
    "type": "EXPIRATION",
    "app_user_id": "user_12345",
    "product_id": "premium_monthly",
    "expiration_at_ms": 1702592000000,
    "entitlement_ids": ["pro_access"],
    "store": "PLAY_STORE",
    "environment": "PRODUCTION"
  }
}
```

`RENEWAL` after expiry (resubscription):

```json
{
  "api_version": "1.0",
  "event": {
    "id": "evt_01HABCXYZ0000000000000012",
    "type": "RENEWAL",
    "app_user_id": "user_12345",
    "product_id": "premium_monthly",
    "purchased_at_ms": 1705270400000,
    "expiration_at_ms": 1707862400000,
    "entitlement_ids": ["pro_access"],
    "store": "PLAY_STORE",
    "environment": "PRODUCTION"
  }
}
```

## REST API v1

- **Base:** `https://api.revenuecat.com/v1`. The secret key goes in `Authorization` (v1 also accepted the bare key; v2 requires `Bearer`).
- **Endpoints:** `GET /subscribers/{app_user_id}` (Get or Create Customer), `DELETE /subscribers/{app_user_id}`, `POST /subscribers/{app_user_id}/attribution`, `POST /subscribers/{app_user_id}/attributes`, the promotional grant and revoke paths in [Pick the mechanism](#pick-the-mechanism), plus the authenticated-customer endpoints `GET /customer`, `POST /customer/attributes`, `GET /customer/virtual_currencies`, `POST /customer/virtual_currencies/spend` and `GET /{project_id}/.well-known/jwks.json` (see [ERRORS-AND-SECURITY.md](ERRORS-AND-SECURITY.md)).

```http
GET https://api.revenuecat.com/v1/subscribers/{app_user_id}
Authorization: Bearer sk_...
X-Platform: android
```

- **REST v1 and SDK CustomerInfo are different representations.** REST returns `request_date`, `request_date_ms` and a `subscriber` wrapper with snake_case fields such as `original_app_user_id`; Flutter's wrapper parser reads `originalAppUserId`, `activeSubscriptions`, `allPurchaseDates` and `requestDate`. Parse the REST schema rather than casting its response to SDK CustomerInfo. The old source said the response body had the same structure. [https://www.revenuecat.com/docs/api-v1/customer-info-model; https://www.revenuecat.com/docs/api-v1/customers; https://github.com/RevenueCat/purchases-flutter/blob/main/lib/models/customer_info_wrapper.dart]

```http
POST https://api.revenuecat.com/v1/subscribers/{app_user_id}/entitlements/{entitlement_id}/promotional
Authorization: Bearer sk_...
Content-Type: application/json

{"duration": "monthly"}
```

- **`duration` values include** `daily`, `three_day`, `weekly`, `monthly`, `two_month`, `three_month`, `six_month`, `yearly`, `lifetime`. Use this for support workflows, never from the client.
- **Env var names in the examples:** `RC_SECRET_KEY` and `RC_WEBHOOK_SECRET` (rc-backend), `RC_SECRET_API_KEY` (rc-cancellations).

## REST API v2

- **Base:** `https://api.revenuecat.com/v2`. Header `Authorization: Bearer YOUR_REVENUECAT_API_KEY`; the `Bearer` type is required. API v1 keys do not work with v2: create a v2 secret key in project settings, **API keys**, **+ New**, select `V2`, set permissions, **Generate**. OAuth tokens use the same Bearer format.
- **Requests:** POST bodies are JSON with `Content-Type: application/json`; URL-encode params such as `app_user_id`. Use the `expand` query param for related objects (for example `expand=attributes` on Get a customer).
- **Pagination:** lists return `{ "object": "list", "items": [...], "next_page": "...?starting_after=LAST_ID", "url": "..." }`; params `limit` (default 20) and `starting_after`; forward only.

### Rate limits

| Domain | Requests per minute |
|---|---|
| Customer Information | 480 |
| Charts & Metrics | 25 |
| Project Configuration | 60 |
| In-App Currencies | 480 |

Limits apply per API key (app level) or per developer. Headers `RevenueCat-Rate-Limit-Current-Usage` and `RevenueCat-Rate-Limit-Current-Limit`. A 429 carries `Retry-After` and a body like `{"type": "rate_limit_error", ..., "retryable": true, "doc_url": "https://errors.rev.cat/rate-limit-error", "backoff_ms": 1000}`. Error types are in [ERRORS-AND-SECURITY.md](ERRORS-AND-SECURITY.md).

### Subscription model

- **`gives_access`:** use it to decide whether a subscription currently provides access, instead of building your own logic from `status`.
- **`status`:** `trialing`, `active`, `expired`, `in_grace_period`, `in_billing_retry` (access suspended), `paused`, `unknown`, `incomplete`.
- **`auto_renewal_status`:** `will_renew`, `will_not_renew`, `will_change_product`, `will_pause`, `requires_price_increase_consent`, `has_already_renewed`.
- **Also:** `store_subscription_identifier`, `total_revenue_in_usd`, `current_period_ends_at`, `ends_at`, `pending_changes`.
- **What counts as a new subscription:** resubscribing after a lapse; a paid product change (except during a trial); family sharing (with no revenue).

### Customer endpoints (Customer Information domain)

| Endpoint | Permission |
|---|---|
| `GET /projects/{project_id}/customers` | `customer_information:customers:read` |
| `POST /projects/{project_id}/customers` | |
| `GET`, `DELETE /projects/{project_id}/customers/{customer_id}` | |
| `POST .../customers/{customer_id}/actions/assign_offering` | |
| `POST .../actions/grant_entitlement` | `customer_information:customers:read_write` |
| `POST .../actions/revoke_granted_entitlement` | |
| `POST .../actions/restore_purchase_by_order_id` | Google Play |
| `POST .../actions/transfer` | |
| `GET .../aliases`, `GET`/`POST .../attributes` | |
| `GET .../active_entitlements` | `customer_information:customers:read` |
| `GET .../customer_center`, `.../events`, `.../purchases`, `.../subscriptions` | |

- **Customer object** includes `first_seen_at`, `last_seen_at`, `last_seen_app_version`, `last_seen_country`, `last_seen_platform` and `active_entitlements.items[]` (`entitlement_id`, `expires_at`).
- **Grant entitlement** body `{ "entitlement_id": "entla1b2c3d4e5", "expires_at": 1658399423658 }` creates a promotional subscription. A grant within two hours of an existing one is ignored as a duplicate. Extend by granting with an `expires_at` at least two hours later; shorten by revoking, then granting.
- **Revoke granted entitlement** revokes all active promotional grants of that entitlement; access ends immediately.

### Subscription endpoints

Permissions `customer_information:subscriptions:read` and `read_write`.

| Endpoint | Notes |
|---|---|
| `GET /projects/{project_id}/subscriptions` | Search by store identifier, such as Apple `transactionId` or a Google order ID |
| `GET .../subscriptions/{subscription_id}` | |
| `POST .../actions/cancel` | Web Billing; access until period end |
| `POST .../actions/extend` | Apple, Google Play, Web Billing; Apple needs `extend_reason_code` and caps at 90 days |
| `POST .../actions/refund` | Web Billing; access lost immediately |
| `GET .../authenticated_management_url` | Single-use customer portal link |
| `GET .../entitlements` | |

### Entitlement endpoints

Project Configuration domain (60/min), permissions `project_configuration:entitlements:read` and `read_write`: list, create, delete, get, update, archive, unarchive, attach products, detach products, list products.

## Store notifications to your own server

- **Platform server notifications go from the stores to RevenueCat.** For your own server, use webhooks instead.
- **If you need Apple's notifications yourself,** use RevenueCat webhooks, or set the **Apple Server Notification Forwarding URL** in RevenueCat. If your server receives them first and forwards them to RevenueCat, pass the payload as-is. Apple's allowlist: hostname `dps.iso.aple.com`, IPs `17.58.0.0/18` and `17.58.192.0/18`.

```js
app.post('/subscription-update', (req, res) => {
  // - Let Apple know we received the notification
  res.status(200).json();
  // - Forward the request body as-is to RevenueCat
  axios.post(process.env.REVENUECAT_URL, req.body)
  .then(response => {
    // - Successfully forwarded to RevenueCat
    console.log("Successfully forwarded to RevenueCat", response);
  })
  .catch(error => {
    // - Consider a retry to RevenueCat if there's a network error or status code is 5xx
    // - This is optional as RevenueCat should recheck the receipt within a few hours
    console.error("Failed to send notification to RevenueCat", error);
  });
  // - Anything else you want to do with the request can go here
});
```

## Supabase and other backends

- **There is no RevenueCat and Supabase integration page.** The only Supabase mention in the docs: for the Web SDK, identify customers with a third-party auth provider such as Firebase or Supabase, or a library such as auth.js; sharing authentication across web and mobile lets customers reach their purchases on any platform.
- **The documented backend pattern** is the same for any backend: receive webhooks with an authorization header and/or an HMAC signature, respond 200 fast, process idempotently by event `id`, then call `GET /subscribers` to sync status; look users up by `original_app_user_id` and `aliases`; read status from your server with the REST API and a secret key; use v2 `gives_access` for access decisions; keep Stripe access until `EXPIRATION`.
- **Forward purchases to Meta's Conversions API** [ApparenceKit](https://apparencekit.dev/blog/facebook-flutter-sdk-meta-ads-events/): from the purchase webhook, send the same purchase to the Conversions API with the store transaction ID as `event_id`, the ID the app passed as `eventId` through the Facebook SDK, so Meta keeps one event and recovers ones lost to "network issues, app crashes, or ad blockers" ([app-growth META-ADS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/META-ADS.md#facebook-sdk-in-flutter)).
- **Customer attributes on the server:** read them with the REST API and a secret key, or from `subscriber_attributes` in webhooks; the SDK cannot read them. They are writable with the public key, so never store subscription status or balances in them.

## Prove it

- A request without the configured authorization header (or with a wrong HMAC signature) is rejected; a valid one returns 200 within 60 seconds even when downstream work is async.
- Replaying the same `event.id` is a no-op and still returns 200; the event ID insert and its downstream writes commit in one transaction.
- `CANCELLATION` does not revoke; `EXPIRATION` revokes the `entitlement_ids`; `RENEWAL` (and `INITIAL_PURCHASE`) after `EXPIRATION` restores access; `BILLING_ISSUE` flags without revoking; `SUBSCRIPTION_PAUSED` does not revoke.
- A sandbox purchase or a dashboard test event reaches the endpoint and shows in the customer's **Events** tab.
- Every premium endpoint checks entitlement through one documented mechanism (REST per request or a webhook-driven flag), and none trusts a value sent by the client.
