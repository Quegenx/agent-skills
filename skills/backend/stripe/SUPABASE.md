# Stripe with Supabase

Three ways to bring Stripe into a Supabase project: the Stripe Wrapper reads Stripe live from Postgres through a foreign data wrapper (no webhooks, every query is an API call), the Stripe Sync Engine keeps a `stripe` schema in your database current by processing webhooks, and your own Edge Function receives webhooks directly. What decides most outcomes is that the wrapper doesn't do real-time updates, and that webhook functions must verify the raw body with the async, Web Crypto based verifier and run without Supabase JWT verification. Supabase itself (RLS, Edge Functions, Vault, secrets) is in [supabase SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/supabase/SKILL.md); event handling rules are in [WEBHOOKS.md](WEBHOOKS.md).

## Pick the approach

| Approach | What it does | Mind |
|---|---|---|
| Stripe Wrapper (`wrappers` extension) | Reads Stripe from Postgres; inserts, updates and deletes on customers, products, subscriptions | Each query calls the Stripe API; no webhooks or real-time updates |
| Stripe Sync Engine (`@supabase/stripe-sync-engine`) | Mirrors Stripe into a `stripe` schema on each webhook; can backfill | Needs a webhook endpoint (Edge Function or the Fastify server) |
| Own Edge Function | Verifies and handles webhooks with your logic | You write the handling ([WEBHOOKS.md](WEBHOOKS.md)) |

## Stripe Wrapper (Postgres FDW)

- **Enable** from the Dashboard or SQL:

```sql
create extension if not exists wrappers with schema extensions;
```

```sql
create foreign data wrapper stripe_wrapper
  handler stripe_fdw_handler
  validator stripe_fdw_validator;
```

- **Store the key in Vault.** By default Postgres stores FDW credentials in `pg_catalog.pg_foreign_server` in plain text, and anyone with access to that table can view them; Supabase recommends Vault:

```sql
-- Save your Stripe API key in Vault and retrieve the secret id (UUID) used for api_key_id
select vault.create_secret(
  '<Stripe API key>',
  'stripe',                          -- key name, used for api_key_name option
  'Stripe API key for Wrappers'      -- key description
);
```

- **Create the server** with either `api_key_id` (the UUID `vault.create_secret` returns, also `select id as key_id from vault.secrets where name = 'stripe';`) or `api_key_name 'stripe'`; only one is required, and `api_key_id` takes precedence if both are given. `api_url` and `api_version` are optional (`api_version` defaults to the account's default API version):

```sql
create server stripe_server
  foreign data wrapper stripe_wrapper
  options (
    api_key_id '<key_id>',  -- UUID returned by vault.create_secret, or retrieved via: select id from vault.secrets where name = 'stripe'
    api_url 'https://api.stripe.com/v1/',  -- Stripe API base URL, optional. Default is 'https://api.stripe.com/v1/'
    api_version '2024-06-20'  -- Stripe API version, optional. Default is your Stripe account’s default API version.
  );
```

  With a name instead, replace the `api_key_id` line with `api_key_name 'stripe',  -- name used when creating the secret via vault.create_secret`.

- **Import the tables:** `create schema if not exists stripe;` then `import foreign schema stripe from server stripe_server into stripe;` (or narrow with `limit to (...)` / `except (...)`).
- **Objects:** select-only for most (accounts, balance, balance_transactions, charges, checkout_sessions, disputes, events, files, file_links, invoices, mandates, meters, payment_intents, payouts, prices, refunds, setup_attempts, setup_intents, tokens, topups, transfers). Customers, products and subscriptions also support insert, update and delete (they need `rowid_column 'id'`). Extra fields come through the `attrs` jsonb column.
- **`where` pushes down:** `select * from stripe.customers where id = 'cus_xxx';` calls `https://api.stripe.com/v1/customers/cus_xxx`. Always limit records to reduce API calls to Stripe.
- **Inserts with sub-fields** use API parameter names as columns, for example `insert into stripe.subscriptions(customer, "items[0][price]") values (...)` on an insert-only table definition.
- **Limitations:** large result sets are slow; webhook events and real-time updates are not supported; API version mismatches cause data format issues; materialized views on these tables may fail during logical backups.

## Stripe Sync Engine

- **Packages:** `@supabase/stripe-sync-engine` (TypeScript library) and `stripe-sync-fastify` (a Fastify server, Docker image `supabase/stripe-sync-engine`, exposing `/webhooks`). It creates a `stripe` schema with tables matching Stripe and inserts, updates or deletes rows on each webhook.
- **Grant access** to the role that reads it:

```sql
GRANT USAGE ON SCHEMA stripe TO your_user; GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA stripe TO your_user;
```

- **Install and process webhooks:** `npm install @supabase/stripe-sync-engine stripe`, then `new StripeSync({ poolConfig: { connectionString, max: 10 }, stripeSecretKey, stripeWebhookSecret })` and `await sync.processWebhook(payload, signature)`. Run migrations with `runMigrations({ databaseUrl })`.
- **Options:** `schema` (default `stripe`), `stripeApiVersion` (default `2020-08-27`), `autoExpandLists`, `backfillRelatedEntities`, `revalidateObjectsViaStripeApi` (array of: charge, credit_note, customer, dispute, invoice, payment_intent, payment_method, plan, price, product, refund, review, radar.early_fraud_warning, setup_intent, subscription, subscription_schedule, tax_id), `poolConfig`, `logger` (pino). `databaseUrl` and `maxPostgresConnections` are deprecated.
- **Supported webhooks** include `checkout.session.*`, `customer.subscription.*` (including `pending_update_applied`, `pending_update_expired`, `trial_will_end`), `invoice.*`, `payment_intent.*`, `price.*`, `product.*` and `entitlements.active_entitlement_summary.updated`. `invoice.upcoming` is unsupported ("Event has no id and cannot be processed"). `charge.refund.updated` is partial; use `refund.updated`.
- **Single objects:** `sync.syncSingleEntity('cus_12345')` infers the type from the ID prefix (`ent_` unsupported).
- **Backfill:** `sync.syncBackfill({ object: 'product', created: { gte: 1643872333 } })`. Objects: `all`, `charge`, `customer`, `dispute`, `invoice`, `payment_method`, `payment_intent`, `plan`, `price`, `product`, `setup_intent`, `subscription`. For more than 10,000 objects, loop per day.
- **In an Edge Function:** `import { StripeSync } from 'npm:@supabase/stripe-sync-engine@0.37.2'`; read the raw body as `new Uint8Array(await req.arrayBuffer())`, call `await stripeSync.processWebhook(rawBody, req.headers.get('stripe-signature'))`, and respond `202`. Set secrets with `supabase secrets set --env-file ./supabase/.env`: `DATABASE_URL`, `DATABASE_SSL_CA` (base64), `STRIPE_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY`.

## Webhooks in your own Edge Function (Deno)

- **Use `constructEventAsync` with `Stripe.createSubtleCryptoProvider()`** in Deno, so verification runs on the Web Crypto API.
- **Read the body with `.text()`:** verification needs the raw body, not parsed JSON.
- **Deploy with `verify_jwt = false`:** Stripe authenticates through its signature, not a Supabase JWT.

```ts
import Stripe from 'npm:stripe@^22'
import { withSupabase } from 'npm:@supabase/server@^1'

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY') as string)
// This is needed in order to use the Web Crypto API in Deno.
const cryptoProvider = Stripe.createSubtleCryptoProvider()

// Stripe verifies the request via its signature, so deploy with verify_jwt = false.
export default {
  fetch: withSupabase({ auth: 'none' }, async (req) => {
    const signature = req.headers.get('Stripe-Signature')

    // First step is to verify the event. The .text() method must be used as the
    // verification relies on the raw request body rather than the parsed JSON.
    const body = await req.text()
    let receivedEvent
    try {
      receivedEvent = await stripe.webhooks.constructEventAsync(
        body,
        signature!,
        Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')!,
        undefined,
        cryptoProvider
      )
    } catch (err) {
      return new Response(err.message, { status: 400 })
    }
    console.log(`Event received: ${receivedEvent.id}`)
    return Response.json({ ok: true })
  }),
}
```

- **Then apply the handler rules** in [WEBHOOKS.md](WEBHOOKS.md): dedupe by event ID, return `2xx` fast, fulfill subscriptions on the events listed there. Subscription state rules are in [BILLING.md](BILLING.md), Checkout in [PAYMENTS.md](PAYMENTS.md).
- **[appeeky]:** match the project's stack when implementing webhooks; a Supabase Edge Function is one of the named targets alongside a Next.js route and Express.

## Prove it

- The Stripe key used by the wrapper lives in Vault (`vault.create_secret`), not in `pg_foreign_server` options.
- Wrapper queries filter with `where` (for example by `id`) and never pull whole tables.
- No feature relies on the wrapper for webhook-driven or real-time data.
- `stripe listen --forward-to <function URL>` plus `stripe trigger payment_intent.succeeded` returns `200` from your function (or `202` from the Sync Engine function), and a tampered body returns `400`.
- The function is deployed with `verify_jwt = false`, and Stripe's request reaches it without a Supabase JWT.
- With the Sync Engine, a triggered event appears as a row in the `stripe` schema, and nothing depends on `invoice.upcoming` arriving there.
