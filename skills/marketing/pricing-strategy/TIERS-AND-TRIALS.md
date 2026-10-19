# Tiers, trials and enterprise

How to package: how many tiers, Good-Better-Best, what separates tiers, packaging for personas, freemium or free trial, and when to add an enterprise tier. From [coreyhaines31/marketingskills, pricing] `SKILL.md` and `references/tier-structure.md` (MIT, Copyright (c) 2025 Corey Haines). How a user tries the product before paying (freemium, free trial, paid trial, money-back, consultation) and the card-required decision are in [onboarding-and-upgrades ACTIVATION-MODELS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/onboarding-and-upgrades/ACTIVATION-MODELS.md); Stripe trial mechanics in [stripe SUBSCRIPTION-CHANGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/SUBSCRIPTION-CHANGES.md); app-store trials in [app-growth RETENTION-AND-MONETIZATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/RETENTION-AND-MONETIZATION.md#trials).

**Contents:** [How many tiers](#how-many-tiers) · [Good-Better-Best](#good-better-best) · [What separates tiers](#what-separates-tiers) · [Example tier structure](#example-tier-structure) · [Packaging for personas](#packaging-for-personas) · [Freemium or free trial](#freemium-or-free-trial) · [Enterprise](#enterprise) · [Prove it](#prove-it)

## How many tiers

[coreyhaines31/marketingskills, pricing]

| Tiers | Works for | Risk |
|---|---|---|
| 2 | A clear SMB vs Enterprise split | "May leave money on table" |
| 3 | "Industry standard": entry, recommended, high-value | |
| 4+ | A wide range of customer sizes | "Decision paralysis, complexity" |

RevenueCat makes the same point about paywalls: "equal-weight cards cause decision paralysis" ([revenuecat PAYWALLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/PAYWALLS.md)).

## Good-Better-Best

[coreyhaines31/marketingskills, pricing]

- **Good (entry):** removes barriers to entry; core features, limited usage; low price; small teams, try before you buy.
- **Better (recommended):** "Where most customers land"; full features, reasonable limits; "Your 'anchor' price"; growing teams, serious users.
- **Best (premium):** captures high-value customers; everything, advanced features, higher limits; "Premium (often 2-3x 'Better')"; larger teams, power users, enterprises.
- **Two views on three tiers with a highlighted middle.** The source treats it as the default. [anti-slop-ui PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/PATTERNS.md) lists "Three tiers, middle highlighted" as a template tell to replace with "Whatever the real pricing is", and [anti-slop-copy PAGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/PAGES.md) says "Not always three tiers with a highlighted middle." Both hold: use three tiers when the segments are real, and recommend a plan only when the recommendation is real. [landing-page-ui SECTIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SECTIONS.md#plans) does it its own way: "Three cards", "the recommended plan's solid and the others soft".

## What separates tiers

[coreyhaines31/marketingskills, pricing]

- **Feature gating:** basic features in all tiers, advanced in higher ones; works when features have clear value differences. Don't gate the feature that delivers the core value ([MODELS.md](MODELS.md#the-eight-models)).
- **Usage limits:** same features, different limits (users, storage, API calls); works when value scales with usage.
- **Support level:** Email → Priority → Dedicated success; works for products with implementation complexity.
- **Access and customization:** API access, SSO, custom branding; works for enterprise differentiation.

## Example tier structure

[coreyhaines31/marketingskills, pricing] The source's template:

| | Starter $29/mo | Pro $79/mo | Business $199/mo |
|---|---|---|---|
| Users | Up to 5 | Up to 20 | Unlimited |
| Projects | 10 | Unlimited | Unlimited |
| Storage | 5 GB | 50 GB | 500 GB |
| Integrations | 3 | 10 | Unlimited |
| Analytics | Basic | Advanced | Custom |
| Support | Email | Priority | Dedicated |
| API access | No | Yes | Yes |
| SSO | No | No | Yes |
| Audit logs | No | No | Yes |

On the page, state each limit in words, not only as checkmarks ([PAGE-TEARDOWN.md](PAGE-TEARDOWN.md#common-failure-patterns)). In Stripe, each pricing-page row is its own Product ([stripe BILLING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/BILLING.md#model-the-catalog)).

## Packaging for personas

[coreyhaines31/marketingskills, pricing] Customers differ in willingness to pay, feature needs, buying process and value perception. Segment by company size (solopreneur → SMB → enterprise), use case (marketing vs sales vs support), sophistication (beginner → power user) and industry (different budget norms).

1. **Define personas:**

| Persona | Size | Needs | WTP | Example |
|---|---|---|---|---|
| Freelancer | 1 person | Basic features | Low | $19/mo |
| Small Team | 2-10 | Collaboration | Medium | $49/mo |
| Growing Co | 10-50 | Scale, integrations | Higher | $149/mo |
| Enterprise | 50+ | Security, support | High | Custom |

2. **Map features to personas:** core features in all; collaboration from Small Team; integrations limited then full; API access from Growing; SSO/SAML, audit logs and a custom contract for Enterprise.
3. **Price to value per persona:** research willingness to pay per segment ([RESEARCH.md](RESEARCH.md)), set prices that capture value without blocking adoption, and consider segment-specific landing pages.

## Freemium or free trial

[coreyhaines31/marketingskills, pricing]

- **Freemium works when** the product has viral or network effects, free users add value (content, data, referrals), the market is large, the marginal cost of a free user is low, and there's a clear feature or usage limit to trigger the upgrade. **Risks:** free users never convert, it devalues the product, support costs for non-payers, harder to raise prices later. The onboarding source puts it as "the free experience should hook, not satisfy" ([onboarding-and-upgrades ACTIVATION-MODELS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/onboarding-and-upgrades/ACTIVATION-MODELS.md)).
- **A free trial works when** the product needs time to show value, setup is an investment, B2B buying committees decide, the price is higher, or the product is "sticky" once configured.
- **Trial practice:** "7-14 days for simple products; 14-30 days for complex products"; full access, not feature-limited; a clear countdown and reminders; the card-required trade-off. These are SaaS lengths. For apps, [eronred]'s playbooks give "Simple app or utility | 3 days | 3-7 days" and "Complex or B2B | 14 days" ([app-growth RETENTION-AND-MONETIZATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/RETENTION-AND-MONETIZATION.md#trials)). Both stand, each for its context. A countdown must count to the real end ([offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md#scarcity-urgency-and-dark-patterns)).
- **Card upfront:** the source claims "Higher trial-to-paid conversion (40-50% vs. 15-25%)", lower trial volume and better qualified leads, with no study named. ChartMogul's 2026 report, quoted by the onboarding source, gives ~30% for card-required B2B trials. App-growth's own playbooks disagree again for store trials. Decide on visitor-to-paid, not trial-to-paid ([onboarding-and-upgrades ACTIVATION-MODELS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/onboarding-and-upgrades/ACTIVATION-MODELS.md#the-card-decision)).
- **Hybrids:** freemium + trial (a free tier plus a trial of premium; the source's example is Zoom, free 40 minutes and a trial of Pro); **reverse trial** (start with full access, then downgrade to the free tier after the trial).
- **Any trial that converts to paid** carries ROSCA's duties: terms before billing details, express consent, a simple way to stop ([offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md#trials-auto-renewal-and-cancellation)).

## Enterprise

[coreyhaines31/marketingskills, pricing]

- **Add "Contact Sales" when** deals "exceed $10k+ ARR", customers need custom contracts, implementation or onboarding is required, security or compliance requirements apply, or procurement is involved. Still show a starting price or range somewhere ([PAGE-TEARDOWN.md](PAGE-TEARDOWN.md#common-failure-patterns)).
- **Table stakes:** SSO/SAML, audit logs, admin controls, uptime SLA, security certifications. **Value-adds:** dedicated support or success, custom onboarding, training, custom integrations, priority roadmap input.
- **Strategies:** per-seat at scale with volume discounts ($15/user standard → $10/user at 100+); platform fee + usage ($500/mo base + $0.01 per API call); value-based contracts (percent of transactions, revenue share). Deal-desk approval rules are in [revops SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/revops/SKILL.md).

## Prove it

The tier count matches real segments; each tier names who it's for and its limits in words; the core-value feature is in every tier; a trial's length fits the product's time to value and its terms are disclosed before billing; and an enterprise tier exists only where the source's triggers apply.
