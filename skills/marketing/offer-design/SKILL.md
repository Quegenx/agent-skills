---
name: offer-design
description: "Designs and repairs the offer itself (what a buyer gets, why it's worth it, why now): the value equation and its four levers, the six components of a complete offer, scope and naming, payment structures, guarantee types, objection-closing bonuses, honest scarcity and urgency, when to discount, formats by business type, paid info-product validation and delivery, and the US FTC rules on former prices, comparable values, free bonuses, guarantees, fake urgency and dark patterns, installments, trials and cancellation (ROSCA). Use when building or improving an offer, a guarantee, a bonus stack, a deadline or a payment plan, when an offer isn't converting, before running a discount, when validating or building a paid knowledge product, or when checking whether a price, value, guarantee or countdown claim is lawful."
---

# Offer design

The offer is the thing, not the page: "Better copy on a weak offer compounds slowly. A stronger offer with average copy converts immediately." Most "we need better copy" requests are a weak offer in disguise, and most "we need to lower the price" requests are one of six components missing or weak. This skill builds the offer from [coreyhaines31/marketingskills, offers] (MIT, Copyright (c) 2025 Corey Haines; the value equation credited to Alex Hormozi's *$100M Offers*) and checks every claim against the official US texts (16 CFR Parts 233, 239 and 251, the FTC dark patterns report, ROSCA), which live once in [FTC-PRICING-CLAIMS.md](FTC-PRICING-CLAIMS.md). It is strongest for services, courses, coaching, info products, high-ticket B2B and direct response; for self-serve SaaS, tiers and the value metric do more work, so start in [pricing-strategy SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/pricing-strategy/SKILL.md). The page that presents the offer is [anti-slop-copy SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md) and [cro SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cro/SKILL.md); in-app upgrade prompts are [onboarding-and-upgrades SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/onboarding-and-upgrades/SKILL.md).

Read the product context file first, `.agents/product-context.md` ([anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md)); the source calls it `.agents/product-marketing.md`.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Paid knowledge products: evidence-of-spend research, validation, complete product, distribution and opted-in audience | [INFO-PRODUCTS.md](INFO-PRODUCTS.md) |
| The value equation and its four levers, scoring them, the six components, scope, naming, price and payment structure, the diagnostic loop, projecting the lift | [OFFER-ANATOMY.md](OFFER-ANATOMY.md) |
| The eight guarantee types, picking one, examples by business, wording, the 10% stress test, when to offer none | [GUARANTEES.md](GUARANTEES.md) |
| Bonuses as objection handlers, finding the objections, the 3-5 stack, stated values, timing, the audit | [BONUSES.md](BONUSES.md) |
| Honest scarcity and urgency formats, fake patterns to remove, when scarcity isn't needed, the diagnostic | [SCARCITY.md](SCARCITY.md) |
| Never discount to acquire, when a discount works, sales under the former-price rule, offers that replace a discount | [DISCOUNTS.md](DISCOUNTS.md) |
| Default formats for service, course, coaching, info product, high-ticket B2B, agency, self-serve SaaS and direct response | [OFFER-FORMATS.md](OFFER-FORMATS.md) |
| The US rules: former prices, comparable value, advance sales, "free" and bonuses, guarantees, dark patterns, installments, ROSCA and the Negative Option Rule's status, the sources' errors | [FTC-PRICING-CLAIMS.md](FTC-PRICING-CLAIMS.md) |

## The rules

1. **Fix the offer before the copy.** Score dream outcome, perceived likelihood, time delay and effort 1 to 10 and work on the lowest; most stuck offers need proof, not features [coreyhaines31/marketingskills, offers] ([OFFER-ANATOMY.md](OFFER-ANATOMY.md#scoring-the-levers)).
2. **Ship all six components or leave one out on purpose:** core, bonuses, guarantee, scarcity, name, price and payment structure [coreyhaines31/marketingskills, offers].
3. **Every number on the offer is real.** A "was" price was charged openly for a substantial period; a "$X value" names a comparable price that substantial sales happen at; an installment plan shows the count and the total (16 CFR 233.1, 233.2; FTC dark patterns report) ([FTC-PRICING-CLAIMS.md](FTC-PRICING-CLAIMS.md)).
4. **A bonus is a "free" item:** no mark-up on the core to pay for it, terms beside it and not behind an asterisk, not the same offer more than 6 months in 12 (16 CFR 251.1).
5. **"Money back" refunds the full price,** and every guarantee's conditions (two at most, per the source) sit beside it, above the buy button (16 CFR 239.3) ([GUARANTEES.md](GUARANTEES.md)).
6. **Only real scarcity.** Every countdown ends on a real date, every count is true, and on the date the price rises or the bonus goes; fake timers and stock or activity counts are FTC dark patterns (16 CFR 233.5) ([SCARCITY.md](SCARCITY.md)).
7. **Never discount to acquire;** discount for upgrades, cross-sells or a real seasonal window, and replace a discount with an offer that removes the real objection [coreyhaines31/marketingskills, offers] ([DISCOUNTS.md](DISCOUNTS.md)).
8. **Trials and renewals follow ROSCA:** disclose the terms before billing details, get express consent, give a simple way to stop the charges. The 2024 "click-to-cancel" rule was vacated on July 8, 2025 ([FTC-PRICING-CLAIMS.md](FTC-PRICING-CLAIMS.md#trials-auto-renewal-and-cancellation)).
9. **Project lifts by multiplying, and test.** +20% then +30% is 1.56x, not 1.5x; a projection is a scenario until an A/B test confirms it ([ab-testing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SKILL.md)).
10. **Write offer language with specific numbers, named customers and real timelines,** never "game-changing", "revolutionary", "secret", "limited time" without a limit, "worth $X" without a comparable, or "100% guaranteed" without conditions [coreyhaines31/marketingskills, offers].

## Prove it

Given a stuck B2B SaaS where prospects fear migrating off an incumbent, the answer rejects a launch coupon, names migration risk as the real objection, and proposes a done-for-you migration with a guarantee on the switching cost and capacity-real scarcity; given 2% conversion and two lifts of +20% and +30%, it reports 3.12% (1.56x, +1.12 points) as a scenario and routes the test to ab-testing; the live offer passes every check in [FTC-PRICING-CLAIMS.md](FTC-PRICING-CLAIMS.md#prove-it); and every file's own Prove it checks pass for the parts you touched.
