# Stripe Tax and Managed Payments

Stripe Tax calculates sales tax, VAT and GST on Subscriptions, Invoices, Checkout Sessions and Payment Links, monitors thresholds and can file returns; Managed Payments goes further and makes Stripe the merchant of record for digital products. The mechanism that decides most outcomes: "Without a registration in the customer's location, the calculation returns zero tax", and enabling `automatic_tax` without one returns no error. So a working setup needs a head office address, an active registration per jurisdiction, a resolvable customer address and a product tax code, and you verify it by reading `taxability_reason`, not the amount. Subscription setup is in [BILLING.md](BILLING.md); one-time payments in [PAYMENTS.md](PAYMENTS.md). Bullets marked [appeeky] come from a third-party skill set, not from Stripe.

**Contents:** [Scope](#scope) · [Setup in three steps](#setup-in-three-steps) · [Settings and tax behavior](#settings-and-tax-behavior) · [Product tax codes](#product-tax-codes) · [Customer location](#customer-location) · [Per integration](#per-integration) · [Registrations](#registrations) · [Threshold monitoring](#threshold-monitoring) · [Filing](#filing) · [Verify and diagnose zero tax](#verify-and-diagnose-zero-tax) · [Refunds](#refunds) · [Connect](#connect) · [Sandboxes and unsupported regions](#sandboxes-and-unsupported-regions) · [Managed Payments](#managed-payments) · [Prove it](#prove-it)

## Scope

- **Use Stripe Tax for any subscription, invoice or Checkout Session** with customers across several jurisdictions (sales tax, VAT, GST). Overview: https://docs.stripe.com/tax.md
- **It does:** calculation; nexus threshold monitoring (Dashboard > Tax > Locations > Needs attention, plus email alerts); "Register for me" for eligible US remote sellers, eligible non-residents under Canada's simplified GST/HST, and eligible non-EU businesses under EU Non-Union OSS through Ireland; automated filing in the US (https://docs.stripe.com/tax/file-with-stripe.md) and for Canadian simplified GST/HST and EU Non-Union OSS via Ireland (https://docs.stripe.com/tax/file-with-stripe-outside-us.md), or through a filing partner (https://docs.stripe.com/tax/filing.md). Filing is automatic in over 90 countries and all US states.
- **It doesn't:** process off-Stripe payments (use the standalone Tax APIs, https://docs.stripe.com/tax/off-stripe.md), automatically file every return, or support every jurisdiction (https://docs.stripe.com/tax/supported-countries.md). Claims that it has no nexus monitoring are false.
- **Never give legal answers.** Never tell a user where they must register or whether they are legally obligated; recommend a tax advisor. For EU VAT, don't choose a registration scheme from a general request; point to https://docs.stripe.com/tax/supported-countries/european-union.md and a tax advisor. Not legal or tax advice; recommend an accountant. [appeeky]

## Setup in three steps

With execution access (MCP, or the CLI with a valid token), first read the current Tax Settings (https://docs.stripe.com/api/tax/settings.md or Dashboard > Tax > Settings) and don't overwrite an existing head office address or preset tax code.

1. **Head office address in Tax Settings.** It defaults to the Stripe business address. Adding registrations without it fails with `invalid_request_error`. Settings `status` is `pending` until it is set, then `active`; `automatic_tax` doesn't calculate while `pending`.
2. **A registration for each jurisdiction where you are obligated** (Tax Registrations API, https://docs.stripe.com/api/tax/registrations.md, or Dashboard, https://docs.stripe.com/tax/registering.md). Then point the user to threshold monitoring.
3. **`automatic_tax: { enabled: true }`** on the Subscription, Invoice, Checkout Session or Payment Link. Custom PaymentIntent flows use the Tax API instead. Enabling it doesn't update existing invoices, subscriptions or payment links: update each one.

- **The most common mistake** is enabling `automatic_tax` without an active registration: no error, no tax. Confirm a registration exists or tell the user no tax will be collected.
- **"Active registration"** means a jurisdiction added to Stripe that shows as *Collecting*. It is per jurisdiction and isn't the same as having a Stripe account.
- **With execution access, run the test calculation yourself in the same turn** (a customer address in the registered jurisdiction plus the product's tax code); don't hand the user a "run a test calculation" checklist item.
- **`automatic_tax` can't coexist with manual `tax_rates`** on the same object. Enabling it while any `default_tax_rates` or item-level `tax_rates` remain is rejected: clear them all first (all or nothing). `automatic_tax` still taxes each line item from its product tax code. To schedule the switch at the next billing cycle without prorations, use the API, not the Dashboard. In bulk, the Tax migration tool (https://docs.stripe.com/billing/taxes/migration.md) removes the tax rates for you.
- **Compliance checklist** [appeeky]: Stripe Tax enabled (Dashboard > Tax); registrations for nexus countries and states; products have tax codes; Checkout has automatic tax enabled; prices marked tax-inclusive or exclusive on purpose. Audit with `GetTaxSettings` (automatic tax enabled, default behavior) and check subscriptions and invoices for `automatic_tax.enabled` and `tax` amounts; countries with sales but no tax collected point to a possible nexus gap. Use `search_stripe_documentation` for country thresholds.

## Settings and tax behavior

- **Preset product tax code:** the default when a Product has no `tax_code`. "You must select the most appropriate product tax code for every product or service you sell." A preset shipping tax code covers shipping fees.
- **Default tax behavior:** Exclusive, Inclusive, or Automatic ("Stripe excludes tax from prices in USD and CAD, but includes it in prices for all other currencies"). A Price's `tax_behavior` overrides it.
- **Where each goes:** tax code on the Product, `tax_behavior` on the Price (https://docs.stripe.com/tax/products-prices-tax-codes-tax-behavior.md).

## Product tax codes

- **Never invent, guess or hardcode a `txcd_`.** Take it from the Tax Codes API (https://docs.stripe.com/api/tax_codes.md) or the guide (https://docs.stripe.com/tax/tax-codes.md), and link one of them next to the value.
- **Don't default to General - Electronically Supplied Services `txcd_10000000`** for US sales (too broad); pick a specific digital or SaaS code (https://docs.stripe.com/tax/digital-products.md; AI products: https://docs.stripe.com/tax/ai.md).
- **Show candidates; the user confirms.**

## Customer location

- **Customer v1 subscriptions and invoices** take the location in this order: (1) shipping address, (2) Customer billing address, (3) the most specific payment method billing details, (4) customer IP. If a higher-priority address is present but invalid, the call fails with `customer_tax_location_invalid` and doesn't fall back: fix the address. Accounts v2 hierarchy: https://docs.stripe.com/tax/customer-locations.md
- **Checkout:** a new customer with billing only uses the billing address; with shipping collected, the shipping address; an existing customer uses the saved shipping address, else the billing address (with `customer_update[address]=auto`) or the saved billing address.
- **A country code alone** works in most countries but not the US, Canada or India; collect a full US address when accuracy matters.
- **IP is an estimate only.** "We don't recommend relying on a customer's IP address to determine their address beyond an initial estimate."

## Per integration

Every integration needs a resolvable customer address, an active registration there, a product tax code and `tax_behavior` (or the account's preset tax code and default tax behavior).

- **Checkout Sessions:** `automatic_tax: { enabled: true }`; it applies to the whole session regardless of payment method (stablecoins included). New customer: Checkout collects the address; don't force `billing_address_collection: 'required'` (friction); use `customer_creation: 'always'` with `automatic_tax: { enabled: true }`. Existing customer: the saved address by default; to tax the address entered at checkout, set `customer_update: { address: 'auto' }` and make sure Checkout collects a fresh address (shipping, or `billing_address_collection: 'required'` when not collecting shipping). https://docs.stripe.com/tax/checkout.md
- **Google Pay with Tax in Checkout:** "you must either collect a shipping address or provide an existing customer with a saved shipping address."
- **Embedded Checkout** uses `ui_mode: 'embedded_page'` with `return_url` (the hosted default `ui_mode` is `hosted_page`; Elements uses `ui_mode: "elements"`). A preview for no-code automatic tax in Checkout (one-time payments only): `tax_default_on_checkout_preview`.
- **Invoices:** `automatic_tax: { enabled: true }`; the customer needs a saved address.
- **Subscriptions:** `automatic_tax: { enabled: true }`; clear existing `tax_rates` first. Flow: preview with `POST /v1/invoices/create_preview`, update the customer address, create the subscription, return the client secret, `stripe.confirmPayment()`. Before you have an address: `stripe.invoices.createPreview({ automatic_tax: { enabled: true }, customer_details: { tax: { ip_address } }, subscription_details: { items: [{ price }] } })`; once you have it, add `customer_details.address` (and `shipping`).
- **Payment Links:** `automatic_tax: { enabled: true }`; collect addresses when you need more precision (the Dashboard address-collection setting is optional); follow https://docs.stripe.com/tax/payment-links.md
- **Custom PaymentIntents:** no `automatic_tax` field. Create a tax calculation with the customer address, set the PaymentIntent `amount` to the calculation total, link the calculation to the PaymentIntent, and record a tax transaction after payment or the sale never appears in tax reports. The simplified integration records it automatically once linked; the custom integration records it yourself.
- **B2B and reverse charge:** collect a tax ID (`tax_id_collection: { enabled: true }` on Checkout, or on the Customer, https://docs.stripe.com/billing/customer/tax-ids.md). Without a valid tax ID, cross-border B2B is treated as B2C and taxed. https://docs.stripe.com/tax/checkout/tax-ids.md. The Customer Portal has a tax ID collection toggle.
- **Metronome:** never finalize a Stripe invoice before tax calculation completes (Stripe Tax, Avalara, Anrok). See [USAGE-BASED.md](USAGE-BASED.md).

## Registrations

- **Create via the API** (Node):

```node
const registration = await stripe.tax.registrations.create({
  country: '{{COUNTRY_CODE}}',
  country_options: {
    us: {
      state: '{{STATE}}',
      type: 'state_sales_tax',
    },
  },
  active_from: 'now',
});
```

- **Operations:** list, create, update, expire (set `expires_at`; there is no delete). A scheduled expiration can change; one that took effect is permanent (add a new registration to collect again); there's no pause. The head office address is required first. Registrations can be scheduled for the future (Dashboard Locations or Registrations tab).
- **Adding a registration records one you already hold;** it doesn't register you with the authority. Creating or expiring changes only what Stripe collects. Prepare the change and have the user confirm; never create or expire a registration automatically.
- **Paths to register (the user chooses):** register yourself, then record it (API, or Dashboard > Tax > Locations > Add registration); Tax Complete with "Register for me" (eligibility: https://docs.stripe.com/tax/use-stripe-to-register/united-states.md#eligibility and https://docs.stripe.com/tax/use-stripe-to-register/outside-united-states.md; the non-US service doesn't support Canadian normal GST/HST, separate provincial sales taxes or other EU VAT schemes); or Taxually where available (https://docs.stripe.com/tax/use-taxually-to-register.md).
- **Unknown jurisdictions:** don't guess or add a registration without confirmation; ask where the business sells.

## Threshold monitoring

- **With execution access:** use the `GetTaxThresholdMonitoring` MCP dynamic tool or the `get_tax_threshold_monitoring` CLI tool. Report the relevant jurisdictions and the computation timestamp if available; if data is absent or undetermined, say so.
- **Where it shows:** Dashboard > Tax > Locations > Needs attention, plus email and Dashboard alerts. Don't promise a threshold-alert API or webhook. It doesn't cover physical presence.
- **Present it as information:** don't say the user must register, and there's no universal percentage-of-threshold rule. https://docs.stripe.com/tax/monitoring.md
- **Live mode only:** sandbox transactions don't count. Notifications arrive within 1 or 2 days after crossing; if one was sent in the past 7 days, new changes are batched one week after the last notification.

## Filing

- **Collecting doesn't file,** and "Register for me" doesn't enroll you in filing.
- **Tax Complete** enables automated filing for US sales tax, Canada simplified GST/HST and EU Non-Union OSS via Ireland; other countries go through Taxually. US TaxJar filing requires a US-based bank account. Don't promise fixed Taxually filing credits or coverage.

## Verify and diagnose zero tax

- **Confirm registrations** through the Tax Registrations API or the Dashboard; other prerequisites: https://docs.stripe.com/tax/set-up.md
- **With authorized execution access, inspect a test Tax Calculation** and `tax_breakdown[].taxability_reason`, not just the amount. `not_collecting` can mean no registration or an intentionally Nontaxable product; `not_supported` can mean an unsupported country, territory or product. The old source said `not_collecting` always meant broken setup and every other reason meant success. Report the documented reason and have the user confirm applicability with a tax advisor; never swap tax codes merely to produce tax. Read-only advice is not executed verification. [https://docs.stripe.com/tax/zero-tax; https://docs.stripe.com/tax/testing]
- **Zero tax, in order:** first confirm `automatic_tax` is enabled on the object; then read `taxability_reason` on the line item `taxes` (for a Checkout Session, retrieve it with `expand[]=line_items.data.taxes`).
- **`not_collecting` is ambiguous:** no active registration (the usual cause) or the Nontaxable code `txcd_00000000`. Rule out the Nontaxable code first.
- **Other reasons:** `reverse_charge`, `customer_exempt`, `not_subject_to_tax`, `product_exempt`, `zero_rated`, `vat_exempt`, `standard_rated` (https://docs.stripe.com/tax/zero-tax.md).
- **Diagnose before changing tax setup:** confirm the product's tax code and delivery/customer treatment, then the applicable registration and supported jurisdiction. A zero amount does not itself establish a legal registration obligation. Make only authorized changes and verify the expected documented reason, which may legitimately be `not_collecting`. [https://docs.stripe.com/tax/zero-tax]
- **`invoice.finalization_failed`:** inspect `last_finalization_error`; `automatic_tax[status]=requires_location_inputs` means collect the location; `failed` means retry later. See [WEBHOOKS.md](WEBHOOKS.md).
- **Past transactions:** don't promise that config changes fix completed transactions; use tax reports (https://docs.stripe.com/tax/reports.md); historical obligations go to a tax advisor.

## Refunds

- **PaymentIntents:** the simplified integration (https://docs.stripe.com/tax/payment-intent/simplified.md) records the reversal for refunds automatically; the custom integration (https://docs.stripe.com/tax/payment-intent/custom.md) gives you control.
- **Taxed invoices** are adjusted automatically when refunded or credited (https://docs.stripe.com/tax/invoicing/refunds.md). For other integrations follow their guide; don't extrapolate.

## Connect

- **First decide who is liable,** the platform or the connected account; the legal determination goes to a tax advisor. Don't infer it from the business label, the charge type or `on_behalf_of`. https://docs.stripe.com/tax/connect.md
- **`automatic_tax.liability`** on Checkout, Invoices, Subscriptions and Payment Links: `{ type: 'self' }` (the platform's settings and registrations) or `{ type: 'account', account: '<id>' }` (the connected account's). Destination and separate charges support both. The platform-liable direct-charge path uses the gated `{ type: 'application' }` with a matching issuer setting; don't recommend it unless the account has access. Guides: connected account collects, https://docs.stripe.com/tax/tax-for-platforms.md; platform collects, https://docs.stripe.com/tax/tax-for-marketplaces.md
- **When the connected account is liable,** confirm its tax settings (https://docs.stripe.com/tax/settings-api.md) `status` is `active` before enabling `automatic_tax`, and manage its registrations with the Tax Registrations API using the `Stripe-Account` header (or Connect embedded components).

## Sandboxes and unsupported regions

- **Sandbox registrations and Tax Settings are scoped to each sandbox.** Re-create them in live mode (Dashboard > Tax > Locations) before real payments; without live registrations the first real transaction is silently taxed at 0. Sandbox transactions don't affect threshold monitoring.
- **Unsupported region:** say it isn't supported yet; collect manually with `tax_rates` on the subscription or invoice (not alongside `automatic_tax`). Customs duties and excise taxes are out of scope. Don't proxy with a supported region.

## Managed Payments

- **Stripe as merchant of record** for digital products (SaaS, software, digital content): it handles sales tax, VAT and GST in more than 80 countries, fraud, disputes and transaction-level customer support. "If you sell digital products, Managed Payments transfers tax liability to Stripe."
- **Works with** Checkout and Payment Links (and a mobile app path); subscriptions run through Billing; the Customer Portal works with it.
- **Not supported:** Connect; embeddable web components and advanced integrations; invoice items on a Customer attached to a Managed Payments subscription; one-off invoices; subscriptions created outside Checkout or Payment Links; third-party tax integrations.

## Prove it

- **Settings:** Tax Settings `status` reads `active` and a head office address is set.
- **Registration:** the customer's jurisdiction shows as *Collecting* in live mode, not only in the sandbox.
- **Calculation:** a test Tax Calculation with an address in that jurisdiction and the product's real tax code returns the documented reason expected for that product/customer/jurisdiction; valid zero-tax cases remain explicit. [https://docs.stripe.com/tax/zero-tax]
- **Checkout:** a completed session retrieved with `expand[]=line_items.data.taxes` shows taxes on each line, with `automatic_tax` enabled.
- **No mixing:** no subscription or invoice carries `tax_rates` or `default_tax_rates` alongside `automatic_tax`.
- **Custom PaymentIntents:** after a paid test order, a tax transaction is recorded and the sale appears in tax reports.
- **Tax codes:** every Product's `tax_code` came from the Tax Codes API or guide, and none is `txcd_00000000` or a default `txcd_10000000` for US SaaS.
