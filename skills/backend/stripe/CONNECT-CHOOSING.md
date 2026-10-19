# Choosing a Connect configuration

How to recommend a Connect setup for a specific business: learn the business, scan the code, ask the discovery questions, map the answers to a dashboard, fee collection, negative balance liability and charge pattern, check the combination against the compatibility matrix, then write the plan. The decision that drives everything else is who owns checkout and the customer relationship: the seller (direct charges, SaaS) or the platform (destination or separate charges, marketplace). A combination the matrix rates BLOCKED is never presented. The account fields and charge code are in [CONNECT.md](CONNECT.md); PaymentIntents in general are [PAYMENTS.md](PAYMENTS.md); webhook handling is [WEBHOOKS.md](WEBHOOKS.md).

**Contents:** [The workflow](#the-workflow) · [Company research](#company-research) · [Discovery questions](#discovery-questions) · [Business model to configuration](#business-model-to-configuration) · [Charge pattern rules](#charge-pattern-rules) · [Dashboard rules](#dashboard-rules) · [Compatibility matrix](#compatibility-matrix) · [Blessed paths](#blessed-paths) · [Public-preview disclosure](#public-preview-disclosure) · [Fee structure](#fee-structure) · [Negative balance liability and risk](#negative-balance-liability-and-risk) · [Sales-led and out-of-scope cases](#sales-led-and-out-of-scope-cases) · [Recommendation template](#recommendation-template) · [Terminology rules](#terminology-rules) · [Prove it](#prove-it)

## The workflow

Progress checklist: Learn about your business, Scan your project, Recommend configuration + charge pattern, Produce recommendation plan.

1. **Learn about the business, always first.** Offer: "I have a URL", "Let me describe it", "Just scan my codebase", "Skip, ask me questions instead". Research it (below).
2. **Scan the project.** Look for `connect-recommend-plan.md` or a file containing `## Recommended Connect integration plan`; if found, offer "Use it as a starting point" or "Start fresh". Grep for `connected_account`, `account_id`, `stripe_account`, `destination`, `on_behalf_of`, `transfer_data`, `separate_charges`, `transfers.create`, `payouts.create`, `account.updated`, `capability`, `payout`, `application_fee_amount`.
3. **Ask the six discovery questions** that research didn't settle.
4. **Fee checkpoint before recommending:** fee type and amount, the `application_fee_amount` calculation, whether the margin warning is needed, and the `stripe.com/pricing` link.
5. **Generate the plan** and ask "Does this recommendation look right?" with options Looks good, Change something, Explain more about the options (at most 4 options). Write `connect-recommend-plan.md` at the project root only if asked.
6. **Next steps** split by where they happen: in code (charge pattern behavior, `application_fee_amount` math, transfer and reversal handling, webhook handlers); in the Dashboard (platform profile, Platform Pricing Tool, connected-account visibility, Radar for Platforms, monitoring); during onboarding and runtime (capability activation, payouts readiness, account-state transitions). End with "What would you like to do next?": Refine a decision, Expand implementation steps, Generate `connect-recommend-plan.md` and build.

Interaction rules:

- **Confidence decides whether to ask:** HIGH means auto-fill; MEDIUM means suggest and confirm ("I'm also assuming [X], sound right?"); LOW means ask the question.
- **One question at a time, every decision confirmed with numbered options.** Act without asking when generating the plan, scanning the codebase or reading references. Never end on passive text.
- **Keep it short:** about 40 lines per interactive response at most, warnings in 2 to 3 sentences, technical detail in the plan's "Details" section.
- **Any deviation from a blessed path triggers a compatibility check.** If it is BLOCKED, don't present it: explain the mechanism in 2 to 3 sentences, recommend the nearest allowed alternative (usually `losses_collector: "application"` or direct charges) and re-run the check.

## Company research

- **With a URL:** fetch the homepage with the prompt "Extract: what this company does, who the sellers or providers are, who the buyers or customers are, how payments and money flow between parties, any pricing or fee information, and whether this is a marketplace, platform, or SaaS product." Try `/about`, `/about-us`, `/how-it-works`, `/pricing`, `/plans` in parallel. On failure, web search the domain plus "business model how it works".
- **With a description only:** web search the name plus "business model" and "pricing". A generic description is classified directly, at most MEDIUM confidence. With no web access, cap web-derived dimensions at LOW.
- **Corroborate in the codebase:** find `package.json`, `requirements.txt`, `Gemfile`, `go.mod`, `pom.xml`; grep seller terms (`seller`, `vendor`, `operator`, `provider`, `merchant`, `host`, `creator`), buyer terms (`buyer`, `customer`, `rider`, `guest`, `client`), payment terms (`commission`, `fee`, `split`, `payout`, `transfer`, `earnings`) and multi-party terms (`marketplace`, `platform`, `connect`).
- **Six dimensions, each rated HIGH, MEDIUM or LOW:** business model, parties, payment flow, onboarding control, dispute responsibility, fee structure. Research reports findings; it doesn't apply the decision matrix.
- **Output:** `## Company Research: [Company Name or "Unknown"]`, a summary in the second person, a Research Findings table (Dimension, Finding, Confidence, Evidence), and Sources.
- **Edge cases:** 403, 404 or timeout: web search and note "Direct URL unreachable, used web search."; a single-page app: web search and check meta tags; pricing behind a login: fee confidence LOW, "Pricing not publicly available."; several products: classify the primary one at MEDIUM; conflicting signals: MEDIUM with the reasoning.
- **Not a Connect business:** purely B2C with no multi-party payments gets "This business appears to be a direct seller, standard Stripe integration may be more appropriate than Stripe Connect."

## Discovery questions

1. **Q1 Business model.** Options: Marketplace (Etsy, Airbnb); Platform with service providers (Uber, DoorDash); SaaS enabling payments (Shopify, Squarespace); Crowdfunding, subscription, or other.
2. **Q2 Parties.** Who the sellers or providers and the buyers are.
3. **Q3 Payment flow.** Platform collects then pays out, or buyers pay sellers directly; whether the platform holds funds until delivery or confirmation.
4. **Q4 Dashboard and onboarding control.** Stripe handles it, some customization, or fully custom. Every answer maps to `onboardingMethod: "embedded"`.
   - **Q4b, required for public-preview configurations:** "Are these connected accounts you're onboarding for the first time, or accounts you already have on a different Stripe configuration today?" Options: new, existing, mix. Mix means recommend for the new cohort only.
5. **Q5 Disputes and refunds, risk, negative balance liability.** Q5b records the risk shape (see [risk](#negative-balance-liability-and-risk)).
6. **Q6 Fee structure.** Options: percentage (8%), flat ($2), tiered or custom, subscription plus transaction; amounts 5%, 10%, 15%, Other. **Q6b** (`application_fee_amount` calculation) is asked only for destination charges: separate charges use transfer math, direct charges with Stripe pricing make it moot, and direct charges with platform pricing use the Platform Pricing Tool.

For enterprise signals, ask whether they work with a Stripe account team; align to that team's recommendation, otherwise remind them to check with their representative.

## Business model to configuration

The decision matrix in Stripe's `connect-recommend` skill:

| Business model | Dashboard | Fees | Losses | Charge | Onboarding | Reasoning |
|---|---|---|---|---|---|---|
| Marketplace | `express` | `application` | `application` | Destination | Embedded | Platform owns the customer relationship; platform pricing and liability required for Express today |
| On-demand services | `express` | `application` | `application` | Destination | Embedded | Fast onboarding for drivers and providers |
| Professional services | `express` | `application` | `application` | Destination | Embedded | Similar to marketplace |
| SaaS with payments (self-serve, minimal ops) | `express` | `stripe` | `stripe` | Direct | Embedded | Default for self-serve SaaS (public preview) |
| SaaS with payments (self-serve, pricing control) | `express` | `application` | `stripe` | Direct | Embedded | Pair with the Platform Pricing Tool (public preview) |
| SaaS with payments (established merchants) | `full` | `stripe` | `stripe` | Direct | Embedded | Independence, own Stripe accounts and branding |
| Crowdfunding | `express` | `application` | `application` | Separate | Embedded | Multi-party splits and delayed release; transfer math |
| Subscription platforms | `express` | `application` | `application` | Destination | Embedded | Platform manages subscriptions |
| E-commerce (white-label) | `none` | `application` | `application` | Destination or Direct | Embedded | Full branding control; fully custom adds significant complexity |
| Rental marketplace | `express` | `application` | `application` | Destination | Embedded | Platform owns the booking flow |
| Event ticketing | `express` | `application` | `application` | Destination | Embedded | Platform manages event and ticket flow |
| B2B platforms | `none` | `application` | `application` | Separate | Embedded | Complex enterprise multi-party flows; often sales engagement |

Answer combinations (Q1 model, Q3 flow, Q4 control):

| Model | Flow | Control | Dashboard | Fees / Losses | Charges |
|---|---|---|---|---|---|
| Marketplace | Platform collects | Stripe handles | `express` | `application` / `application` | Destination |
| Marketplace | Platform collects | Some custom | `express` | `application` / `application` | Destination |
| Marketplace | Platform collects | Fully custom | `none` | `application` / `application` | Destination |
| Marketplace | Direct to seller | Stripe handles | `full` | `stripe` / `stripe` | Direct |
| SaaS (self-serve, minimal ops) | Direct to seller | Stripe handles | `express` | `stripe` / `stripe` | Direct |
| SaaS (self-serve, pricing control) | Direct to seller | Stripe handles | `express` | `application` / `stripe` | Direct |
| SaaS (established, independent ops) | Direct to seller | Stripe handles | `full` | `stripe` / `stripe` | Direct |
| SaaS | Platform collects | Stripe handles | `express` | `application` / `application` | Destination |
| On-demand | Platform collects | Stripe handles | `express` | `application` / `application` | Destination |
| Crowdfunding | Platform collects | Stripe handles | `express` | `application` / `application` | Separate |
| Platform + contractors | Platform collects | Stripe handles | `express` | `application` / `application` | Destination |

All rows onboard with embedded components.

- **Stripe's `stripe-best-practices` skill maps differently for SaaS:** SaaS platform with payments, AI/API platform (SaaS) and e-commerce enabler (Shopify-like) all get `full` / `stripe` / `stripe` / Direct ("Sellers run own businesses, own customer relationship"; "Providers own payment relationship"; "Sellers create own stores"), and its defaults are `express` for marketplaces and `full` for SaaS. It also lists multi-seller cart as `express` / `application` / `application` / Separate and white-label commerce as `none` / `application` / `application` / Destination or direct. `connect-recommend` makes Express the self-serve SaaS default because of the public-preview Express + Stripe liability option; `full` remains its choice for established merchants. Both are Stripe's skills.
- **Within `connect-recommend` itself,** the account-types reference calls `fees_collector: 'stripe'` and `losses_collector: 'stripe'` "Most platforms", while the decision matrix defaults marketplaces to `application` / `application`.

## Charge pattern rules

- **Decision tree:** multiple sellers in one payment: separate charges and transfers. One seller and the seller runs checkout (seller name on receipt and statement): direct. The platform runs checkout: destination (the default).
- **Hold before release:** one seller but the platform must hold funds until a trigger (delivery, job completion, approval, campaign end): separate charges and transfers, with transfer math, not `application_fee_amount`. Triggers to listen for: the user picks "Platform holds funds, releases to sellers after delivery/confirmation", or describes delivery confirmation before payout, hold-and-release, release on completion, a manual transfer trigger, multiple sellers per checkout, or shipping with delayed payout.
- **One payment to one account with immediate transfer** (bank timing set by the payout schedule, not release logic): destination. Unsure and single-recipient immediate transfer: destination, "safest default".
- **Customer relationship:** platform owns it, destination; seller owns it, direct. "Platform collects then pays out" means destination; "buyers pay sellers directly" means direct. Signals for SaaS and direct: "create their own store", "accept payments", "run their own business", "own brand". Signals for marketplace and destination: "buyers purchase through our platform", "we handle checkout", "platform takes a cut".
- **Payout expectations aren't checkout ownership.** "Payments belong to sellers", "associated with sellers" or sellers who "run their own account" are payout or dashboard preferences: destination charges satisfy payouts through automatic transfers and Express satisfies "own account". Choose direct only when sellers own checkout (their own payment page, their branding on statements, they handle refunds and disputes).
- **Conflicting signals:** a "platform-provided checkout, booking, or listing UI" is the stronger signal, so destination.
- **Merchant-of-record check:** whose name is on the receipt and statement, and who handles refunds and disputes. Platform checkout with platform branding and support behaves as a marketplace; a seller payment relationship with seller support behaves as SaaS.
- **SaaS whose independent sellers own customer relationships:** direct charges first ("the charge pattern for SaaS regardless of dashboard"), then choose the dashboard.
- **B2B enterprise** with multi-party allocation, approval gates, staged release, multi-vendor purchase orders, per-vendor invoicing, partial payments or independent settlement timing: separate charges and transfers, not destination; if needs exceed the automated patterns, treat it as sales-led.
- **Hybrid** (the same accounts take direct and destination or separate charges): keep `express` / `application` / `application` for both and classify every transaction (connected account is merchant of record: direct; platform is: destination or separate). It adds two payment flows, two sets of webhook handlers and a bigger test matrix (refunds, disputes, transfer reversals, negative balance). Launch the most critical side first.
- **Anti-patterns:** describing destination charges as "holding funds before release" or "initiating transfers after delivery"; destination charges for hold-and-release; `on_behalf_of` for marketplaces; the Charges API for Connect.

## Dashboard rules

- **`full`:** sellers are established or enterprise merchants needing direct Dashboard access, Stripe apps, or managing payments, refunds and payouts without the platform's UI; or the user asks for it. Why-statement: independent seller control over payments, refunds, payouts.
- **`express`:** individual, self-serve or less technical sellers; a marketplace with platform-owned checkout; destination charges; a lightweight dashboard or cobranding is wanted; SaaS with direct charges and self-serve, low-ops needs (now the default, public preview). Why-statement: a cobranded seller dashboard with minimal maintenance.
- **SaaS + direct + Stripe-managed responsibilities "no longer automatically imply full dashboard":** default to Express for self-serve; `full` only when merchants need independent access, apps or full payment operations.
- **`none`:** only when white-label or fully embedded control is required. Why-statement: a white-labeled UX where the platform owns all seller UI. Always show the warning below.
- **"Not tech savvy" is a supporting signal only;** it doesn't override `full` for established merchants.

Required warning for `dashboard: "none"`:

```
WARNING: dashboard: none: Full Scope Warning:
- You must build custom onboarding and ongoing remediation logic (higher operational overhead than embedded/hosted)
- You must build refund management UI (connected accounts have no Stripe dashboard)
- You must build dispute management flows (connected accounts can't manage disputes themselves)
- You must build earnings/payout views for sellers
Consider embedded components as a middle ground for less maintenance.
```

Day-one scope for `none`: refund initiation, dispute response, and KYC requirement status and remediation with country-aware handling; if the platform won't build those, use Express.

## Compatibility matrix

Ratings: **BLOCKED** (never recommend: liability or fee model mismatch, or accounts can't manage key operations), **CAUTION** (works, with significant drawbacks and explicit warnings), **ALLOWED**, **OUT OF SCOPE** (redirect to docs or sales), **SALES-GATED**.

| Dashboard | Fees | Losses | Direct | Destination | Destination `on_behalf_of` | Separate | Separate `on_behalf_of` |
|---|---|---|---|---|---|---|---|
| `full` | `stripe` | `stripe` | ALLOWED | BLOCKED | OUT OF SCOPE | BLOCKED | OUT OF SCOPE |
| `full` | `stripe` | `application` | BLOCKED | BLOCKED | OUT OF SCOPE | BLOCKED | OUT OF SCOPE |
| `full` | `application` | `application` | SALES-GATED | SALES-GATED | OUT OF SCOPE | SALES-GATED | OUT OF SCOPE |
| `full` | `application` | `stripe` | SALES-GATED | SALES-GATED | OUT OF SCOPE | SALES-GATED | OUT OF SCOPE |
| `express` | `application` | `application` | ALLOWED | CAUTION | OUT OF SCOPE | CAUTION | OUT OF SCOPE |
| `express` | `stripe` | `stripe` | ALLOWED (PUBLIC PREVIEW) | BLOCKED | OUT OF SCOPE | BLOCKED | OUT OF SCOPE |
| `express` | `stripe` | `application` | BLOCKED | BLOCKED | OUT OF SCOPE | BLOCKED | OUT OF SCOPE |
| `express` | `application` | `stripe` | ALLOWED (PUBLIC PREVIEW) | BLOCKED | OUT OF SCOPE | BLOCKED | OUT OF SCOPE |
| `none` | `stripe` | `stripe` | BLOCKED | BLOCKED | OUT OF SCOPE | BLOCKED | OUT OF SCOPE |
| `none` | `stripe` | `application` | BLOCKED | BLOCKED | OUT OF SCOPE | BLOCKED | OUT OF SCOPE |
| `none` | `application` | `stripe` | BLOCKED | BLOCKED | OUT OF SCOPE | BLOCKED | OUT OF SCOPE |
| `none` | `application` | `application` | ALLOWED | ALLOWED | OUT OF SCOPE | ALLOWED | OUT OF SCOPE |

- **For GA configurations with `losses_collector: "stripe"`, only direct charges are safe.** The public-preview exception adds Express + `losses_collector: "stripe"` + direct for self-serve SaaS, in both fee variants; non-direct stays BLOCKED.
- **`fees_collector: "stripe"` + `losses_collector: "application"` is BLOCKED** for every charge type and dashboard.
- **`dashboard: "none"` allows only `application` / `application`,** "even for sold users".
- **`dashboard: "full"` + `fees_collector: "application"` is SALES-GATED** for every charge pattern: don't recommend it for self-serve; send the user to `https://stripe.com/contact/sales`.
- **`full` + `stripe` + destination or separate is BLOCKED:** switch to direct.
- **`application_fee_amount` with separate charges and transfers is BLOCKED.**
- **Refund, dispute and transfer-recovery mechanics** are defined in [CONNECT.md](CONNECT.md#disputes-refunds-and-transfer-reversals). Keep this recommendation policy distinct from the provider's actual API/account constraints.
- **CAUTION for `express` / `application` / `application` with destination or separate:** connected accounts can't manage refunds, disputes or Radar rules from the Express dashboard; disputes debit the platform first and recovery depends on reversing prior transfers. Viable only with webhook-driven refund and dispute recovery. Always include this Express dispute-visibility warning on the marketplace path.
- **Sources differ on `full` with destination or separate charges.** The decision matrix calls `dashboard: "full"` with destination or separate charges a blocked anti-pattern in general ("Full dashboard has reduced payment and dispute detail ... complete payment and dispute management for direct charges only"); the compatibility matrix blocks only `full` / `stripe` / `*` and rates `full` / `application` / `*` SALES-GATED. Stripe's `stripe-best-practices` skill rates `full` with destination or separate as CAUTION (limited functionality, prefer `express`).
- **Sources differ on the enterprise `none` / `application` / `application` charge types:** the decision matrix says "Any", the blessed-path table says "Destination or Direct", and the full matrix shows ALLOWED for direct, destination and separate.

## Blessed paths

| Business model | Dashboard | Fees | Losses | Charge | Status |
|---|---|---|---|---|---|
| Marketplace | `express` | `application` | `application` | Destination | CAUTION (recommended; include the Express dispute-visibility warning) |
| Self-serve SaaS, Stripe-managed pricing | `express` | `stripe` | `stripe` | Direct | ALLOWED (PUBLIC PREVIEW), low-operations default |
| Self-serve SaaS, platform-managed pricing | `express` | `application` | `stripe` | Direct | ALLOWED (PUBLIC PREVIEW), pair with the Platform Pricing Tool |
| SaaS (established merchants) | `full` | `stripe` | `stripe` | Direct | ALLOWED |
| Enterprise / white-label | `none` | `application` | `application` | Destination or Direct | ALLOWED |

## Public-preview disclosure

For the two Express + `losses_collector: "stripe"` + direct configurations:

- **Disclose the public preview in two or three sentences:** it requires the current Connect preview API version (`https://docs.stripe.com/changelog.md?preview=true`), recommend Radar for Platforms alongside Managed Risk, and it applies to new accounts only.
- **Ask Q4b** about new versus existing accounts. Existing accounts can't be migrated and keep their configuration "unless the platform pursues a separate account-migration path with Stripe".
- **Include this warning verbatim:**

```
WARNING: This configuration applies to new accounts only.
- Existing connected accounts can't be migrated to it.
- The dashboard choice (Express vs. full) is a permanent, one-way decision made at account creation for each connected account and can't be changed later.
- If you have existing accounts on a different configuration, they'll keep that configuration; only newly onboarded accounts can use this configuration.
```

## Fee structure

| Charge | Method | Notes |
|---|---|---|
| Direct (Stripe pricing) | `application_fee_amount` | Strongly recommended |
| Direct (platform pricing) | Platform Pricing Tool | Buy-rate pricing, interchange-plus passthrough, dispute fee passthrough, card-level pricing |
| Destination (platform pricing) | Platform Pricing Tool | Recommended; percentage or tiered commissions with Payments Metadata |
| Destination (platform pricing) | `application_fee_amount` | When fee logic is outside payment-time data |
| Destination (platform pricing) | Retain the transfer difference | Less transparent to the connected account by default |
| Separate charges and transfers | Transfer math | `application_fee_amount` NOT compatible |

- **Platform Pricing Tool** (`https://dashboard.stripe.com/settings/connect/platform_pricing`): requires `fees_collector: "application"`; supports direct and destination, not separate charges. It and an explicit `application_fee_amount` are mutually exclusive: an explicit `application_fee_amount` on the PaymentIntent overrides the tool's rules.
- **Without pricing expertise,** recommend `fees_collector: "stripe"` and `application_fee_amount` for platform revenue. With `fees_collector: "application"`, include an explicit breakeven analysis. The low-complexity margin path is direct charges with Stripe pricing plus a SaaS fee or application fee on top.
- **`application_fee_amount` modes for destination charges** (recommend one; show both only when the margin goal is unclear):
  - `stripe_fee_estimate` (recommended for low margins): `application_fee_amount` = estimated Stripe processing fee + platform margin, so the platform percentage survives as net margin; the account receives charge amount minus `application_fee_amount`.
  - `platform_fee_only`: the platform absorbs Stripe fees, net = platform fee minus Stripe fee; only when fee headroom is clearly high.
- **Reading the user's words:** "X% inclusive of all fees" or "X% total take" means `platform_fee_only`; "X% on top of processing fees" or "above Stripe fees" means `stripe_fee_estimate`; an unqualified "X% platform fee" means ask ("Are you trying to make X% margin, or do you want your users to pay X%?") or default to `stripe_fee_estimate`. Stripe's `stripe-best-practices` skill puts the threshold at a platform fee below about 4%: include estimated Stripe fees in `application_fee_amount`.
- **Stored shape:**

```json
"feeStructure": {
  "type": "percentage",
  "platformFeePercent": <value>,
  "applicationFeeIncludes": "stripe_fee_estimate" | "platform_fee_only",
  "description": "application_fee_amount = X% platform fee [+ estimated Stripe processing fee | only]"
}
```

- **The margin check always runs, even when the fee was auto-filled.** It triggers when the fee looks low and the charge is destination or separate, or direct with `fees_collector: "application"`; it doesn't apply to direct with `fees_collector: "stripe"`. Order: warn first, show the downside with one labeled illustrative example, then the fix, then how to validate (the pricing page and the margin report, `https://docs.stripe.com/connect/margin-reports.md`). Suggested wording: "**Warning:** Your platform fee may be below Stripe processing fees at standard rates. With this charge pattern, your platform pays Stripe processing fees on every transaction. If you absorb those fees, your net per transaction may be negative. Check stripe.com/pricing for your region and payment-method mix." The skill's main file words the warning shorter: "Your platform fee might be below Stripe's processing fees at standard rates. Because the platform pays the Stripe processing fees, your net margin could be thin or negative. Check stripe.com/pricing for your region's rates."
- **The fix, exactly one approach:** for destination or direct with `application` fees, prefer the Platform Pricing Tool set to include Stripe's estimated fee with no explicit `application_fee_amount`; compute `application_fee_amount` (platform fee + estimated Stripe fee) only when not using the tool. For separate charges, compute the net transfer amount.
- **Never hardcode processing fees** ("2.9% + $0.30" is US-only); link `https://stripe.com/pricing`. No definitive profit claims ("you may lose money at standard rates", not "you WILL"). Warn about margin compression when a low flat fee meets variable ticket sizes. Pricing negotiation goes to Stripe sales.

## Negative balance liability and risk

These are two separate decisions; never conflate them. **Negative balance liability** is who pays when disputes leave a negative balance, set at account creation and possibly acknowledged on the platform profile (`dashboard.stripe.com/settings/connect/platform-profile`, which asks about "Negative balance liability", formerly "loss liability"; Stripe manages losses means `losses_collector: "stripe"`, the platform manages means `"application"`). **Risk management** is who detects and prevents fraud, in code and Radar settings.

- **Destination charges need platform liability:** it lets connected-account balances go negative so the platform can reverse transfers for refunds or disputes. SaaS direct charges default to Stripe liability (the connected account is merchant of record).
- **Liability by model:** marketplace, on-demand, professional services, rental, event ticketing, crowdfunding, subscription platforms, white-label and B2B: platform. SaaS with payments: Stripe.
- **Explaining it:** a customer disputes $100. Platform liability: Stripe debits the platform $100, the platform reverses the earlier transfer, which may drive the account negative. Stripe liability: if the account goes negative and stays unresolved, Stripe absorbs the unrecovered amount.
- **Managed Risk** is Stripe's full-service product (merchant loss protection, ongoing risk monitoring and detection, interventions, negative-balance recovery, risk operations). `losses_collector: "stripe"` is the API field that enables its loss-protection part; they are not the same thing.
- **Radar is required whenever `losses_collector: "stripe"` or Managed Risk is recommended:** loss-protection pricing assumes Radar is active on connected accounts. Recommend Radar for Platforms in the same recommendation; never "upgrade to Radar later". With `losses_collector: "application"`, Radar is essential because fraud that slips through comes out of the platform balance. Radar automates detection; it doesn't mean "Stripe manages risk for you".
- **Risk owner by model (directional):** marketplace, on-demand, rental and white-label e-commerce: platform, Radar strongly recommended. SaaS: Stripe, Radar required. Professional services, crowdfunding and subscription platforms: Stripe recommended, Radar optional ("churn > fraud" for subscriptions). Detailed Radar configuration is in `https://docs.stripe.com/radar.md`. Destination or separate charges make the platform merchant of record, so it must manage risk; direct charges make Stripe-managed risk available and recommended; self-managing adds dispute webhooks, Radar configuration, monitoring and financial exposure.
- **Two risk types,** managed independently: transactional (fraudulent payments, chargebacks) and merchant fraud.
- **Q5b shapes:**
  - Marketplace: `riskManagement: { owner: "platform", radarEnabled: true, radarCustomRules: false|true }`
  - SaaS with Stripe liability: `riskManagement: { owner: "stripe", radarEnabled: true }`
  - Platform-managed Radar: `{ owner: "platform", radarEnabled: true, radarCustomRules: true }`
  - `losses_collector: "application"` service providers, Stripe-managed: `{ owner: "stripe", radarEnabled: false }`
  - Crowdfunding, subscription, other: `{ owner: "stripe", radarEnabled: false }`

## Sales-led and out-of-scope cases

- **Sales-led triggers:** `full` + `application` fees; `on_behalf_of`; fully custom API onboarding; OAuth or existing accounts; cross-border fund intermediation; complex B2B multi-vendor billing; regulated finance, remittance or fund segregation; Issuing, Treasury, Capital, Tax or Terminal with Connect. For non-payments products, say this guidance covers Connect payments only and point to that product's docs.
- **"Out of scope" means outside this guide, not outside Stripe:** research those topics on docs.stripe.com instead of declaring them out of scope, and mention limitations only when directly relevant.
- **Billing, Invoicing or Payment Links:** recommend direct charges; with destination charges add a concise compatibility warning.

## Recommendation template

Sections, in order:

- **A. Account configuration:** `/v2/core/accounts`, "Legacy account `type`: not used", dashboard, fee collection, negative balance liability. For marketplaces include: "Each connected account needs the recipient configuration (`configuration.recipient`) with `stripe_transfers` on `stripe_balance` requested, so the account can receive transfers from the platform. Marketplace connected accounts should NOT request merchant configuration or `card_payments` capability: this is unnecessary and causes longer onboarding."
- **B. Charge pattern** with a 2 to 3 sentence rationale.
- **C. Onboarding flow.**
- **D. Dashboard access.**
- **E. Embedded components.**
- **F. Webhook integration:** one sentence only, deferring event details to Stripe's `connect-build` skill (not part of this skill), linking signature verification. No event names, no "Required Webhooks" section, no embedded components here.
- **G. Onboarding status gating.**
- **H. Fee structure** with a funds-flow diagram and the pricing link. Without the Platform Pricing Tool, name the `applicationFeeIncludes` value and its margin meaning and recommend one approach; with the tool, skip `applicationFeeIncludes` and the fee math.
- **I. SaaS monetization.**
- **J. Implementation plan:** account setup, onboarding, payments and funds flow, webhook and readiness gating, go-live checks.
- **K. Risk and liability,** under separate headings.
- **L. Why this fits.**
- **M. Open questions.**

## Terminology rules

The plan is a public artifact: describe configurations by field values (dashboard, fee ownership, negative balance liability, charge pattern), never internal shorthand codes. Human label first, technical name in parentheses.

| Field value | Label |
|---|---|
| `losses_collector: application` | Negative balance liability: your platform |
| `losses_collector: stripe` | Negative balance liability: Stripe |
| `fees_collector: application` | Fee collection: your platform manages pricing |
| `fees_collector: stripe` | Fee collection: Stripe bills connected accounts |
| `dashboard=express` | Dashboard: Express (lightweight view for sellers) |
| `dashboard=full` | Dashboard: Full Stripe Dashboard (independent access) |
| `dashboard=none` | Dashboard: none (you build all seller-facing UIs) |

- **Two business categories, from Stripe's public docs:** "SaaS platform" (sellers collect directly, pay fees to Stripe, merchant of record under their own name) and "Marketplace" (the platform collects and distributes; the platform's name is on the statement). Don't say "service marketplace", "marketplace platform" or "SaaS marketplace"; "platform with service providers" appears only in the Q1 options.
- **Say "negative balance liability",** not "loss liability" or "who pays". Don't use "Platform-owned" or "Stripe-owned" as standalone labels.
- **Payout timing:** "hold funds before releasing" or "delivery-gated payout".
- **Compatibility:** "compatibility issue", "known incompatibility", "unsupported combination".
- **Legacy type names** only when explaining a v1 to v2 migration. Don't answer "what account type should I use?" with a type; reframe: "In Accounts v2, avoid the legacy `type` parameter and configure behavior with explicit fields: `dashboard`, `defaults.responsibilities.fees_collector`, `defaults.responsibilities.losses_collector`, and the appropriate account configuration (`merchant` for direct charges or `recipient` for destination or separate flows)."
- **No comparisons with other processors.** Sentence-case headings (Connect, Radar, Dashboard stay capitalized).

## Prove it

- The recommended dashboard, fees, losses and charge pattern appear in the compatibility matrix as ALLOWED or CAUTION, never BLOCKED, SALES-GATED or OUT OF SCOPE.
- Every `losses_collector: "stripe"` recommendation uses direct charges and recommends Radar for Platforms in the same plan; a public-preview one carries the disclosure, the Q4b answer and the new-accounts warning.
- Separate charges never carry `application_fee_amount`; destination charges are never described as holding funds.
- The fee section names one approach, links `stripe.com/pricing` and hardcodes no processing rate; the margin check ran.
- `dashboard: "none"` is recommended only after the user asked for white-label, with the full-scope warning shown.
- The plan contains sections A to M, uses the labels from the terminology table and no legacy type names outside a migration note.
