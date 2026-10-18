# Security and keys

Stripe security comes down to who holds which key and what each key may do. Publishable keys are safe in the browser and apps; secret and restricted keys move money and read account data, so they live only on your servers, in a vault, scoped to one service each. Stripe now recommends restricted keys (RAKs) over secret keys for new and existing integrations, access policies on every live key, and immediate rotation on any exposure. Fraud and authentication sit on top of that: Radar scores every charge, and 3D Secure handles Strong Customer Authentication where regulation requires it. Webhook verification is in [WEBHOOKS.md](WEBHOOKS.md); Connect liability in [CONNECT.md](CONNECT.md).

## Key types

| Prefix (sandbox / live) | Key | Where it goes |
|---|---|---|
| `pk_test_` / `pk_live_` | Publishable | Safe to expose (Stripe.js, Elements, mobile SDKs); can't create charges or read account data |
| `rk_test_` / `rk_live_` | Restricted (RAK) | Server only; permissions you control |
| `sk_test_` / `sk_live_` | Secret | Server only; Stripe doesn't recommend secret keys for new use cases and recommends migrating existing ones to RAKs |
| `sk_org_...` | Organization | The docs list the prefix only |

- **Webhook signing secrets (`whsec_`) aren't API keys,** but handle them like secret keys.
- **Sandbox and live are separate:** separate keys and objects, and objects in one aren't reachable from the other. Use separate keys per environment (production, staging, QA), and don't use live keys where sandbox keys suffice.
- **Errors:** a missing key returns an invalid request error; an expired key returns an authentication error.
- **Live secret and restricted keys are shown once** at creation and can't be revealed later.
- **Managed API keys** are issued by hosting platforms.

## Restricted keys

- **Always recommend a RAK (`rk_`) over a secret key (`sk_`);** don't default to secret keys. All Stripe APIs support RAKs, and a RAK is a drop-in replacement.
- **Permissions per resource:** Read, Write or None (default None); Write implies Read.
- **One restricted key per service or use case,** for example a billing service, a reporting service, a webhook handler. Least privilege.
- **Keys for AI agents:** RAKs are the recommended type for keys you give agents. Tag the key "Authorizing agent access to your account" to get approval rules (the defaults cover payouts, refunds and account configuration); this is Stripe's recommended way to give autonomous agents access. Stripe maintains AI agent skills at `https://github.com/stripe/ai/tree/main/skills`. Agent tooling is in [AGENT-TOOLS.md](AGENT-TOOLS.md).
- **Never share secret keys with third parties;** if one is needed, give a minimal-permission RAK. Don't share keys over email or chat.

### Migrate a secret key to RAKs

The docs and Stripe's skill give the same path in slightly different words:

1. Review the secret key's request logs in Workbench (GET means read, POST and DELETE mean write).
2. Create a sandbox RAK, either with no permissions (docs) or with matching permissions (skill).
3. Watch logs with `stripe logs tail` while testing in staging.
4. Fix each `403` (`403 ERR` in the RAK logs) by adding the missing permission.
5. Create the live RAK and replace the secret key.
6. Rotate or expire the old secret key (delayed expiration up to 7 days).

## Storing keys

- **Never put secret keys in source code** or in config committed to version control, including committed environment files. Doc examples like `new Stripe("sk_...")` are for running quickly; never introduce them into real code, and never suggest substituting a real secret key into example code.
- **Use a secrets vault; environment variables only if there is no vault.** Options: AWS Secrets Manager or Parameter Store (`SecureString`), Google Cloud Secret Manager, Azure Key Vault (each granting read only to the app that needs it), HashiCorp Vault. Env var example: `export STRIPE_API_KEY=sk_test_...`.
- **Sources differ on environment variables:** Stripe's skill says on AWS "Do not store keys in environment variables or userdata"; the docs list env vars as the fallback when there's no vault; the appeeky audit skill [appeeky] accepts "env/secrets vault". Stripe's position is vault first.
- **Vercel has no built-in vault:** use third-party add-ons that sync to env vars, or a sensitive environment variable, which is write-only and never shown in logs or the UI. On other platforms use the equivalent vault.
- **Mark env vars sensitive** where supported; never build endpoints or error pages that dump environment variables.
- **Never log keys** or put them in error messages or analytics; remove them from logs. Also keep full card numbers, secrets and `client_secret` out of logs [appeeky], and print no PII beyond last4 and country [appeeky].
- **Never embed secret or restricted keys in apps or client code,** which can be extracted or decompiled; apps get publishable keys. Where a client must call Stripe directly, use ephemeral keys (short-lived, resource-scoped, auto-expiring); for most integrations, proxy Stripe calls through your backend. Mobile setup is in [MOBILE.md](MOBILE.md).
- **Stripe never asks you for your secret API key.**

## Catch leaks

- **Scan code, config and CI** with a secret scanner that knows Stripe's key patterns, and add a pre-commit hook that catches `"sk_..."` and `"rk_..."`.
- **Patterns:** `/[sr]k_live_.*/` in source means live keys; for `/[sr]k_test_.*/` warn that it's risky, and never include a live key. The appeeky audit greps for `sk_live`, `sk_test`, `rk_live`, `whsec_` and hardcoded keys outside env [appeeky].
- **Key exposures in repositories are the leading cause of API key takeovers.**

## Access policies

- **Access policies replaced IP address restrictions.** Stripe recommends them on all live mode keys, with a different policy per key (production vs QA).
- **Types:** IP addresses (IPv4 or CIDR), or Advanced: an ASN allowlist, countries, and blocking anonymous VPNs, public proxies, residential proxies and Tor exit nodes. Rules are ANDed.
- **Keys unused for transfers or payouts for over 180 days** may have that access limited; restore it in the Dashboard.

## Rotation and incidents

- **Rotate periodically** with a contingency plan, and when anyone with access leaves. Practice rolling keys before you need to.
- **During a roll, old and new keys both work for up to 7 days.** Roll out the new key gradually and expire the old one only once its request volume is zero. Revoke old keys in the Dashboard [appeeky].
- **On any exposure, rotate immediately,** even if unsure it was used: treat any exposure as a potential compromise.
  1. Roll or delete the key at `https://dashboard.stripe.com/apikeys`.
  2. Check the Workbench request logs.
  3. Contact Stripe support about unrecognized activity (`https://support.stripe.com/questions/protecting-against-compromised-api-keys`).
- **Stripe may detect exposed keys** and notify you or deactivate them, but detection isn't guaranteed.
- **Audit request logs** regularly.

## Going live

- **Replace `pk_test_` with `pk_live_`,** use RAKs server-side, update webhook endpoint URLs and copy the new signing secrets.

## Web app hardening

- **Verify every webhook signature** with the signing secret before processing; allowlisting Stripe's IPs (`https://docs.stripe.com/ips.md`) is defense in depth. Never skip verification [appeeky]. Details in [WEBHOOKS.md](WEBHOOKS.md).
- **Send a `Content-Security-Policy` header** on every web app that loads Stripe.js or hosted UIs. At minimum allow `https://*.stripe.com` in `script-src`, `frame-src` and `connect-src`; add `https://*.link.com` when integrating link.com assets (both for the embedded crypto onramp). Never `default-src *`, and never omit CSP. Full directives: `https://docs.stripe.com/security/guide.md`.
- **PCI scope:** use Checkout or Elements (SAQ-A), not raw card handling [appeeky]. Raw PAN handling is in [PAYMENTS.md](PAYMENTS.md).

## Accounts, OAuth, 2FA and SSO

- **Connect OAuth:** always send a unique, unguessable `state` per request and verify it in the callback. The same applies to Link and Stripe Apps ([STRIPE-APPS.md](STRIPE-APPS.md)).
- **2FA:** prefer passkeys or authenticator apps over SMS (SIM swapping); audit team members on weak 2FA, and require stronger methods if needed.
- **SSO** with SAML through an IdP (Okta, Google and others), plus SCIM provisioning for automatic deprovisioning.

## Radar

- **Radar scores transactions, accounts and customers** with AI. It covers risk evaluation, manual reviews, fraud alerts, customer abuse (account evaluations, free-trial abuse, pay-as-you-go abuse, bots, account farming), account fraud on Connect, a rules engine (allow, block, review, request 3DS), lists and analytics.
- **Radar is per charge.** It doesn't scan SetupIntents without a charge unless "Use Radar on payment methods saved for future use" is on in Radar settings.
- **Give Radar the most risk signals:** Payment Links, Checkout, and Elements with customer risk factors rank highest; then the direct API with Radar Sessions plus customer risk factors. Estimated fraud model improvement: advanced risk factors 36%, IP address 12%, customer email 11%, customer name 3%, billing address 1%. Checkout passes session, device and lifecycle context automatically.
- **Create payments with Customer objects** (email, name, billing and shipping address). If you reuse a PaymentIntent, track repeated attempts (card testing).
- **Load Stripe.js on every page,** not just checkout, and always from Stripe; a local copy isn't supported:

```html
<script async src="https://js.stripe.com/endive/stripe.js"></script>
```

- **Update your privacy policy** to say Stripe collects device information, linking `https://stripe.com/privacy`.

### Rules

[appeeky] These come from the appeeky Radar and card-funding skills, not from Stripe. Check attribute names with the MCP `search_stripe_documentation` tool before writing rules.

- **Custom rules need a paid Radar tier.** appeeky calls it "Radar for Fraud Teams"; Stripe's docs refer to Radar Plus for custom 3DS rules and metadata in rules. Confirm the current name in the docs.
- **Default rules often include** blocking `risk_level = highest`, default block lists, and 3DS, CVC and postal checks (often disabled). Review them in Dashboard, Radar, Rules.
- **Suggested SaaS rules:** (1) `:card_funding: = 'prepaid'` Block; (2) `:is_new_card_on_customer:` Request 3DS; (3) `:risk_level: = 'elevated'` Review; (4) repeated failed CVC Block (if enabled).
- **Start with Review before Block** to measure false positives: Review for 7 days, then Block. Check the effect in Dashboard, Payments (outcome: blocked).
- **Card funding:** read `payment_method.card.funding` (`credit`, `debit`, `prepaid`, `unknown`) by expanding `data.default_payment_method` on active, past_due and trialing subscriptions, and cross-tab funding against status.

| Option | Catches | Misses |
|---|---|---|
| Radar `Block if :card_funding: = 'prepaid'` | Prepaid, many disposable cards | Virtual debit |
| Radar 3DS on new cards | Fraud, some disposable cards | Low-balance debit |
| Webhook reject on `prepaid` | Post-checkout cleanup | After the first charge |

## SCA and 3D Secure

- **SCA under PSD2 in the EEA,** and similar rules in the UK, India, Japan and Australia, may require 3DS for card payments; 3DS is optional elsewhere. SCA has been in effect since September 14, 2019. You're affected if your business is in the EEA (or charges on behalf of EEA connected accounts), serves EEA customers and accepts cards.
- **SCA-ready:** Checkout, Billing, the Payment Intents API, the Setup Intents API and SCA-ready partners. The legacy Charges API isn't SCA-ready. Handle `incomplete` subscription statuses ([BILLING.md](BILLING.md)).
- **How Stripe decides:** from regulation, Radar rules, manual requests and soft declines. Not required: the PaymentIntent goes to `processing`. Not supported: `requires_payment_method` (it may still proceed). Required: `requires_action`. The default trigger is Radar's dynamic 3DS; mandatory SCA rules always run.
- **Request 3DS manually** with `payment_method_options[card][request_three_d_secure]` set to `any` (prefers frictionless) or `challenge`, on PaymentIntent, SetupIntent and Checkout Session create or confirm. You can't use Stripe's APIs to turn 3DS off. Read the outcome from `three_d_secure.authentication_flow` on the Charge or SetupAttempt.
- **Web:** Stripe.js shows the 3DS modal on `confirmCardPayment` and `handleCardAction`, with redirect or iframe alternatives. **React Native:** the Payment Sheet handles 3DS automatically; `StripeProvider` takes `urlScheme` to auto-dismiss the web view and `threeDSecureParams` (`timeout` at least 5 minutes). See [MOBILE.md](MOBILE.md).

### Off-session payments

- **Authenticate once on-session, then reuse:** save with `setup_future_usage: 'off_session'` or a SetupIntent with `usage: 'off_session'`, and set `off_session: true` on off-session PaymentIntents. Properly saved cards make later payments merchant-initiated transactions, exempt from SCA, but exemptions aren't guaranteed. If the bank declines, the PaymentIntent returns to `requires_payment_method`; build a recovery path.
- **Mandates** must cover permission, frequency and how the amount is set. Example text: "I authorize [business] to send instructions to the financial institution that issued my card to take payments from my card account in accordance with the terms of my agreement with you."
- **Grandfathered cards:** EU cards saved before December 31, 2020; UK cards before September 14, 2021.
- **Plugins** should call `setAppInfo`.

### Liability shift

- **Successful 3DS doesn't guarantee liability shift.** Never state or imply that a successful payment or 3DS authentication guarantees it.
- **`charge.succeeded` confirms only the payment;** `three_d_secure.result = authenticated` confirms only the authentication. The ECI is in `electronic_commerce_indicator`.
- **Answer inquiries on 3DS charges:** unanswered ones that become chargebacks can invalidate the liability shift.
- **Apple Pay and Google Pay cryptograms** can carry liability shift in some cases. Radar Plus supports custom 3DS rules.

## Prove it

- **No key in the repo:** a scan for `sk_live`, `sk_test`, `rk_live`, `rk_test` and `whsec_` finds nothing outside the vault or env config, and a pre-commit hook rejects a test commit containing `sk_`.
- **Server code runs on RAKs,** one per service, and staging shows no `403` in the RAK request logs.
- **Every live key has an access policy.**
- **The app bundle and client JavaScript contain only `pk_` keys;** no endpoint or error page prints environment variables, and logs contain no key or `client_secret`.
- **CSP is present** on pages that load Stripe.js and allows `https://*.stripe.com` in `script-src`, `frame-src` and `connect-src`, with no `default-src *`.
- **3DS works:** test card `4000002500003155` shows the challenge and the PaymentIntent moves through `requires_action` to `succeeded`.
- **A rotation drill:** roll a sandbox key, deploy the new one, watch the old key's request volume drop to zero, then expire it.
- **New Radar rules ran in Review** before Block, and the Payments view shows the blocked outcomes you expected.
