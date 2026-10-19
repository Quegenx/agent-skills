# Checkout with Next.js

Stripe Checkout in a Next.js App Router app is a server Route Handler that creates a Checkout Session and redirects to its URL, a success page that reads the Session back, and a webhook that fulfills the order. The mechanism that decides most outcomes: the customer's redirect to your success page is not guaranteed, so webhooks are required for fulfillment, and the fulfillment function must be safe to run many times, even concurrently, for the same Session. Choosing Checkout over other options is in [PAYMENTS.md](PAYMENTS.md); webhook endpoints and signature verification in [WEBHOOKS.md](WEBHOOKS.md); subscriptions in [BILLING.md](BILLING.md).

## Setup

- **Install:** `npm install --save stripe @stripe/stripe-js next`. The React client sample pins `"@stripe/react-stripe-js": "^3.7.0"` and `"@stripe/stripe-js": "^7.3.0"`; check the registry for current versions.
- **`.env`:** Next.js loads the keys; the webhook secret comes from the Dashboard or the Stripe CLI.

```
# https://dashboard.stripe.com/apikeys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<<YOUR_PUBLISHABLE_KEY>>
STRIPE_SECRET_KEY=<<YOUR_SECRET_KEY>>
# Set this environment variable to support webhooks: https://stripe.com/docs/webhooks#verify-events
# STRIPE_WEBHOOK_SECRET=whsec_12345
```

- **A server-only Stripe client,** so the secret key can't be bundled into client code (prefer a restricted key, see [SECURITY-AND-KEYS.md](SECURITY-AND-KEYS.md)):

```js
import 'server-only'

import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
```

- **Run locally** with webhooks forwarded: `stripe listen --forward-to localhost:3000/api/webhooks`, then `STRIPE_WEBHOOK_SECRET=$(stripe listen --print-secret) npm run dev`.

## Create the Session in a Route Handler

- **Add a Route Handler that creates the Checkout Session.** Cards and other common payment methods are enabled by default; don't pass `payment_method_types` ([PAYMENTS.md](PAYMENTS.md)).
- **Keep price and availability on the server** so the client can't manipulate them: use predefined Price IDs or `price_data`, and whitelist the price IDs a request may use [appeeky].

```js
    const session = await stripe.checkout.sessions.create({
      customer_email: 'customer@example.com',
      submit_type: 'donate',
      billing_address_collection: 'auto',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
      line_items: [
        {
          // Provide the exact Price ID (for example, price_1234) of the product you want to sell
          price: '{{PRICE_ID}}',
          quantity: 1,
        },
      ],
      mode: {{CHECKOUT_MODE}},
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      automatic_tax: {enabled: true},
      // Provide a name (for example, hosted_web_0001) to label this Checkout integration and measure its conversion independently
      integration_identifier: '{{INTEGRATION_ID}}',
    });
    return NextResponse.redirect(session.url, 303)
```

- **The page posts a form to the route:** `<form action="/api/checkout_sessions" method="POST"> ... <button type="submit" role="link">Checkout</button>`.

| Option | Notes |
|---|---|
| `mode` | `payment` (one-time), `subscription`, `setup` (save for future payments) |
| `customer_email` | Prefills the email |
| `customer` / `customer_account` | An existing Customer ID, or an Account v2 ID |
| `submit_type` | Four submit types (the sample uses `donate`) |
| `billing_address_collection` | `auto` in the sample |
| `shipping_address_collection` | Requires `allowed_countries` |
| `automatic_tax: { enabled: true }` | After activating Stripe Tax in the Dashboard ([TAX.md](TAX.md)) |
| `integration_identifier` | Labels this integration so you can compare its conversion with other Checkout flows (API version `2026-03-25.dahlia` or later) |
| `success_url` | Must be publicly accessible; include `{CHECKOUT_SESSION_ID}` |
| `customer_creation: 'always'` | Forces a Customer; by default Checkout creates one only when required (for example, subscriptions) and otherwise uses guest customers |

- **After the redirect to Checkout the order is final;** the customer can't change it without a new Checkout Session.

### Subscription sessions: what the third-party skill adds

[appeeky] These come from the appeeky checkout skill, not from Stripe:

- **Essentials:** `mode: subscription`; `line_items` with price and quantity; `customer` or `customer_email`; `success_url` and `cancel_url`; `allow_promotion_codes: true`; `subscription_data` metadata `user_id` (so the webhook can provision the right user); `automatic_tax` enabled if you use Stripe Tax.
- **Reuse the customer:** look up an existing `stripe_customer_id` before creating a session, to avoid duplicate customers.
- **Plan changes use `subscriptions.update`** (with proration), never a second subscription. Plan changes are in [BILLING.md](BILLING.md).

## The success page

A server component reads the Session; `status` decides what to render:

```js
export default async function Success({ searchParams }) {
  const { session_id } = await searchParams

  if (!session_id)
    throw new Error('Please provide a valid session_id (`cs_test_...`)')

  const {
    status,
    customer_details: { email: customerEmail }
  } = await stripe.checkout.sessions.retrieve(session_id, {
    expand: ['line_items', 'payment_intent']
  })

  if (status === 'open') {
    return redirect('/')
  }

  if (status === 'complete') {
    return (
      <section id="success">
        <p>
          We appreciate your business! A confirmation email will be sent to{' '}
          {customerEmail}. If you have any questions, please email{' '}
          <a href="mailto:orders@example.com">orders@example.com</a>.
        </p>
      </section>
    )
  }
}
```

- **Wait to fulfill** (shipping, receipt emails) until the payment succeeds.

## Fulfillment

- **Webhooks are required.** Customers aren't guaranteed to reach your landing page, and subscriptions and payment methods with delayed success notification need webhook fulfillment. Payment Links run on Checkout, so the same applies.
- **Also fulfill from the landing page,** because webhooks can be delayed: read the Session ID from the URL on the server, run the same fulfillment function, then render. Webhooks stay required. The old shared rule prohibited fulfillment from the success page; Stripe recommends this additional server entrypoint, never a client-only success decision. [https://docs.stripe.com/checkout/fulfillment?payment-ui=stripe-hosted]
- **Fulfill once per payment.** The function may be called several times, possibly concurrently, for the same Session. It must: (1) handle repeated calls with the same Session ID; (2) accept a Session ID; (3) retrieve the Session with `line_items` expanded; (4) check `payment_status`; (5) fulfill the line items; (6) record fulfillment status.

```node
async function fulfillCheckout(sessionId) {
  const stripe = require('stripe')('<<YOUR_SECRET_KEY>>');

  console.log('Fulfilling Checkout Session ' + sessionId);

  // TODO: Make this function safe to run multiple times,
  // even concurrently, with the same session ID

  // TODO: Make sure fulfillment hasn't already been
  // performed for this Checkout Session

  // Retrieve the Checkout Session from the API with line_items expanded
  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items'],
  });

  // Check the Checkout Session's payment_status property
  // to determine if fulfillment should be performed
  if (checkoutSession.payment_status !== 'unpaid') {
    // TODO: Perform fulfillment of the line items

    // TODO: Record/save fulfillment status for this
    // Checkout Session
  }
}
```

- **Many line items:** use auto-pagination on the Checkout line items API.
- **Events:** fulfill on `checkout.session.completed` and on `checkout.session.async_payment_succeeded`, which delayed methods (ACH direct debit, bank transfers) send later; handle `checkout.session.async_payment_failed`; use `checkout.session.expired` to restock or send an abandoned-cart email. The Express sample reads the raw body with `bodyParser.raw({type: 'application/json'})`:

```js
if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') { fulfillCheckout(event.data.object.id); }
```

- **Landing page URL:** `success_url: 'https://example.com/after-checkout?session_id={CHECKOUT_SESSION_ID}'` (the default `ui_mode` is `hosted_page`). For Payment Links through the API: `after_completion: { type: 'redirect', redirect: { url: '...?session_id={CHECKOUT_SESSION_ID}' } }`; in the Dashboard: After Payment tab, "Don't show confirmation page".
- **Checkout waits up to 10 seconds** for your server to answer the `checkout.session.completed` delivery before redirecting, when an endpoint listens for that event and a `success_url` is set. With the Stripe CLI forwarding locally it redirects immediately. This doesn't apply to organization webhook endpoints.

## Conversion

- **Measure each flow separately:** give every Checkout integration its own `integration_identifier` and compare them in the Dashboard.
- **Conversion from Sessions [appeeky]:** list Checkout Sessions for a recent window (`GetCheckoutSessions`, `limit: 100`, follow `has_more` with `starting_after`), segment by `status` (`complete`, `expired`, `open`), link the `subscription` ID for `mode: subscription`, and check `payment_status` on completed sessions. Formula: `Conversion % = complete / (complete + expired) × 100`.
- **Cross-check the code [appeeky]:** search for `/api/checkout`, `checkout.sessions.create`, `success_url` and `cancel_url`. Common problems: no customer reuse (double subscription risk) and no promotion code tracking.
- **Querying through the Stripe MCP [appeeky]:** see [AGENT-TOOLS.md](AGENT-TOOLS.md#the-stripe-mcp); revenue metrics are in [REVENUE-METRICS.md](REVENUE-METRICS.md).

## Prove it

- **`import 'server-only'`** is on the module that creates the Stripe client, and no client component imports it.
- **With `stripe listen` running,** a payment with `4242424242424242` (any future expiry, any 3-digit CVC, postal code `90210`) reaches the success page with `status === 'complete'` and the webhook fires `checkout.session.completed`.
- **`4000002500003155`** shows the 3DS challenge; **`4000000000009995`** is declined and nothing is fulfilled.
- **Fulfillment runs once:** replay the same event (and load the success page twice) and the order is recorded a single time.
- **A tampered price** from the client is rejected; the route only accepts known Price IDs.
- **Delayed payment methods** (ACH direct debit, bank transfers) fulfill on `checkout.session.async_payment_succeeded`, not on `checkout.session.completed` with `payment_status` `unpaid`.
