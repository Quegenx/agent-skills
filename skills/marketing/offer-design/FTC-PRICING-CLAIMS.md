# FTC pricing claims

The one place in these skills that defines the US Federal Trade Commission rules on what a price, a discount, a "free" bonus, a guarantee, a deadline or a subscription offer may claim. Every other skill links here instead of restating them: pricing pages in [pricing-strategy SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/pricing-strategy/SKILL.md), save offers in [churn-prevention CANCEL-FLOWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/churn-prevention/CANCEL-FLOWS.md), upgrade prompts in [onboarding-and-upgrades UPGRADE-PROMPTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/onboarding-and-upgrades/UPGRADE-PROMPTS.md), and the offers in this skill. The rules come from the official texts: 16 CFR Part 233, Guides Against Deceptive Pricing (https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-233); 16 CFR Part 251, the Guide Concerning Use of the Word "Free" (https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-251); 16 CFR Part 239, Guides for the Advertising of Warranties and Guarantees (https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-239); the FTC staff report "Bringing Dark Patterns to Light" (September 2022, https://www.ftc.gov/system/files/ftc_gov/pdf/P214800%20Dark%20Patterns%20Report%209.14.2022%20-%20FINAL.pdf); and ROSCA, 15 U.S.C. 8403 (https://www.law.cornell.edu/uscode/text/15/8403). Under all of them sits the FTC Act Section 5 ban on deceptive practices.

Scope: US federal rules only. Not checked here, so named only: EU and UK consumer law (the Omnibus 30-day prior-price rule, the 14-day withdrawal right, which matters for a "no refunds" offer sold to EU consumers), state auto-renewal laws, and the FTC rule on fake reviews, 16 CFR 465 (it matters for "named customer" proof).

**Contents:** [Former prices and sales](#former-prices-and-sales) · [Comparable value and "worth $X"](#comparable-value-and-worth-x) · [Advance sales and limited offers](#advance-sales-and-limited-offers) · ["Free" offers and bonuses](#free-offers-and-bonuses) · [Guarantees](#guarantees) · [Scarcity, urgency and dark patterns](#scarcity-urgency-and-dark-patterns) · [Installments and per-period prices](#installments-and-per-period-prices) · [Trials, auto-renewal and cancellation](#trials-auto-renewal-and-cancellation) · [What the sources got wrong](#what-the-sources-got-wrong) · [Prove it](#prove-it)

## Former prices and sales

[16 CFR 233.1](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-233)

- **A "was" price must be real.** A former-price comparison is legitimate only if the former price is "the actual, bona fide price at which the article was offered to the public on a regular basis for a reasonably substantial period of time" (§233.1(a)).
- **Never raise the price just before a sale.** Inflating a price and then "cutting" it to the usual price is "obviously a false claim" (§233.1(c)).
- **"Formerly sold at $__"** needs substantial sales at that price, not only an offer at it (§233.1(b)).
- **An unstated "Sale" reduction** must not be "so insignificant as to be meaningless": "Reduced to $9.99" from $10 misleads (§233.1(e)).
- **So a strikethrough price on a pricing page** shows a price you really charged, openly, for a substantial period. The discount rules for when to run a sale at all are in [DISCOUNTS.md](DISCOUNTS.md).

## Comparable value and "worth $X"

[16 CFR 233.2](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-233)

- **A "Comparable Value $15.00" or "Retail Value" claim is deceptive** unless "a reasonable number of the principal outlets in the area" offer comparable goods at that price; a few isolated higher prices do not count (§233.2(a) to (c)).
- **For a bonus stack:** a stated "$X value" must be a price at which substantial sales actually happen, yours or representative sellers'. If you can't name that price, drop the dollar figure ([BONUSES.md](BONUSES.md)). The source's "keep the bonus total under 2x the price" is its own heuristic, not this rule.

## Advance sales and limited offers

[16 CFR 233.5](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-233)

- **Don't "offer an advance sale under circumstances where they do not in good faith expect to increase the price at a later date, or make a 'limited' offer which, in fact, is not limited."**
- **So founding-member pricing and scheduled price increases** happen when you said they would: the price rises at member 50 or on November 1 ([SCARCITY.md](SCARCITY.md)). "Limited time" with no real time limit fails this rule.

## "Free" offers and bonuses

[16 CFR 251.1](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-251)

- **A bonus is "free" in law.** The "Free" rules cannot be avoided by calling the item a "gift", "given without charge" or "bonus" (§251.1(i)).
- **No mark-up to pay for it.** The seller must not "directly and immediately recover... the cost of the free merchandise... by marking up the price of the article which must be purchased" (§251.1(b)(1)). "Regular" price means the price over "a reasonably substantial period of time, i.e., a 30-day period" (§251.1(b)(2)). So don't raise the core price to cover a bonus.
- **Terms go next to the offer.** All terms "clearly and conspicuously at the outset"; "a footnote... referenced by an asterisk... is not regarded as making disclosure at the outset" (§251.1(c)).
- **Six months in twelve.** Do not advertise the same "Free" offer in a trade area "for more than 6 months in any 12-month period", and wait at least 30 days between offers (§251.1(h)). An evergreen "free bonus" that runs longer is no longer a special offer.

## Guarantees

[16 CFR 239.3 to 239.5](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-239)

- **"Money back" means the full price.** Use "Satisfaction Guarantee" or "Money Back Guarantee" "only if the seller... refunds the full purchase price... at the purchaser's request" (§239.3(a)). §239.3(a) names "Free Trial Offer" alongside "Money Back Guarantee". A refund of the unused balance is a pro-rated refund: call it that, not money-back.
- **Conditions sit next to the claim.** Disclose "any material limitations or conditions... with such clarity and prominence as will be noticed and understood" (§239.3(b)); the guide's own example: "return the unused portion within 30 days for a full refund". "100% guaranteed" with no stated conditions fails this, and so does a guarantee hidden in fine print.
- **"Lifetime" names the life.** A "lifetime" guarantee must disclose "the life to which the representation refers" (the car's life or the owner's ownership) (§239.4). "Lifetime access" to a product is not a warranty, so §239.4 applies to it only by analogy; still say whose lifetime it is.
- **Only promise what you perform.** Advertise a guarantee "only if the seller... promptly and fully performs" (§239.5). Over-promising ("double your revenue or refund + $1,000") runs into this.
- **Which guarantee to offer** is in [GUARANTEES.md](GUARANTEES.md).

## Scarcity, urgency and dark patterns

The FTC report's Appendix A names these as dark patterns; under Section 5 they are deception, not only bad marketing. [FTC, Bringing Dark Patterns to Light](https://www.ftc.gov/system/files/ftc_gov/pdf/P214800%20Dark%20Patterns%20Report%209.14.2022%20-%20FINAL.pdf)

| Pattern | The report's example |
|---|---|
| False Low Stock Message | "Only 1 left in stock - order soon" |
| False High Demand Message | "20 other shoppers have this item in their cart" |
| Baseless Countdown Timer | "a fake countdown clock that just goes away or resets when it times out"; "Offer ends in 00:59:48" |
| False Limited Time Message | "the offer is good only for a limited time or that the deal ends soon - but without a deadline or with a meaningless deadline that just resets when reached" |
| False Discount Claims | "a fake 'discounted' or 'sale' price" |
| False Activity Messages | "24 other people are viewing this listing" |
| Price Comparison Prevention | "listing the price per payment (such as $10 per week) without disclosing the total number of payments or overall cost" |

- **The UK view, quoted in the same report:** it cites the CMA on "countdown clocks that reset" (p. 21). The report also lists "Preselection" (p. 25), with "the accept tracking cookies box is pre-checked" as its example: an opt-in box starts unchecked.
- **The rule that follows:** a countdown ends on a real date and the offer verifiably ends then; a stock, seat or viewer count is the real number. A trial countdown in an app ("3 days left") counts down to a real deadline, so it is fine.
- **The honest formats** are in [SCARCITY.md](SCARCITY.md). A save offer that says "This offer expires when you leave this page" must be true, or it is a False Limited Time Message ([churn-prevention CANCEL-FLOWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/churn-prevention/CANCEL-FLOWS.md)).

## Installments and per-period prices

- **Show the count and the total.** An installment offer shows the number of payments and the total: "$797 × 3" is $2,391, against $1,997 paid in full. Listing only the per-payment price is the report's Price Comparison Prevention pattern (table above).
- **The app stores add their own rule.** Apple: the billed amount "must be the most prominent pricing element" ([app-store-connect PREFLIGHT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/PREFLIGHT.md)); Google Play lists "Annual subscriptions that most prominently display their pricing in terms of monthly cost" as a violation ([onboarding-and-upgrades UPGRADE-PROMPTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/onboarding-and-upgrades/UPGRADE-PROMPTS.md#store-rules-for-in-app-upgrades)).

## Trials, auto-renewal and cancellation

[ROSCA, 15 U.S.C. 8403](https://www.law.cornell.edu/uscode/text/15/8403)

- **ROSCA's three duties** for any online negative-option offer (a free trial that converts, an auto-renewing plan):
  1. "clearly and conspicuously discloses all material terms of the transaction" before obtaining billing information;
  2. "obtains a consumer's express informed consent before charging";
  3. "provides simple mechanisms for a consumer to stop recurring charges".
- **The "click-to-cancel" rule is not in force.** The FTC's amended Negative Option Rule of 2024 was vacated in full by the Eighth Circuit on July 8, 2025 ([FTC status report, December 2025](https://www.ftc.gov/system/files/ftc_gov/pdf/2025-12-Final-Public.pdf)). On March 11, 2026 the FTC published an advance notice of proposed rulemaking asking about "adopting provisions of the vacated 2024 Rule or some other provisions", and its press release names "difficult cancellation processes, unlawful retention tactics" ([FTC press release](https://www.ftc.gov/news-events/news/press-releases/2026/03/ftc-seeks-public-comment-response-advance-notice-proposed-rulemaking-regarding-negative-option)). What binds today federally is ROSCA plus Section 5. State auto-renewal laws may be stricter (not fetched).
- **Do not make an online signup cancel by phone.** The vacated rule barred it, the churn source's own compliance note says "Cannot require a phone call to cancel if signup was online", and ROSCA requires "simple mechanisms". Routing a high-value account to a person while the self-serve cancel still works is a different thing ([churn-prevention CANCEL-FLOWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/churn-prevention/CANCEL-FLOWS.md#b2b-and-team-plans)).
- **A save offer is allowed;** the way out stays visible on every step. The churn source recommends a pre-billing notice before renewals, but ROSCA itself has no renewal-notice duty; a state law may (not fetched).

## What the sources got wrong

- **The churn source cites a rule that was vacated.** [coreyhaines31/marketingskills, churn-prevention] said: "Many jurisdictions require easy cancellation (FTC Click-to-Cancel rule)" and listed the rule's duties as current law. The official position is the ROSCA section above.
- **The offers source labels a pro-rated refund as money-back.** [coreyhaines31/marketingskills, offers] put the coaching guarantee "we end it and refund the unused balance" in the money-back family; §239.3(a) reserves that label for a full purchase-price refund.
- **The offers source's own example breaks its rule.** Its worked example lists bonuses at "~$12K value" with no comparable and "priceless"; both fail §233.2 and the source's own "stated value the buyer can verify". They are not copied into this skill.
- **The offers source frames fake scarcity as reputational risk only** ("torches trust"); the FTC treats the same patterns as deception (table above).

## Prove it

Every strikethrough price on the page was charged openly for a substantial period; every "$X value" names the comparable price; no bonus came with a raised core price, and its terms sit beside it with no asterisk; every money-back guarantee refunds the full price and states its conditions beside it; every countdown, stock or viewer count is real and the offer ends when it says; every installment offer shows the number of payments and the total; the trial or auto-renew screen states the terms before billing details are collected, takes express consent, and the account settings hold a cancel path that needs no phone call.
