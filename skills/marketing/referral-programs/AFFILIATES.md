# Affiliate programs

Commission-based partners who may not be customers: structures, recruitment, economics, terms, disclosure, reconciliation and measurement. From [coreyhaines31/marketingskills, referrals, references/affiliate-programs.md, affiliate-operations.md and viral-mechanisms.md] unless tagged. Creator sponsorships and audience vetting are in [creator-marketing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/creator-marketing/SKILL.md); finding partners is in [prospecting](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/SKILL.md); co-marketing with partner companies is in [partnerships](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/partnerships/SKILL.md).

**Contents:** [Commission structures](#commission-structures) · [Cookie windows](#cookie-windows) · [Economics before a rate](#economics-before-a-rate) · [Recruiting](#recruiting) · [Enablement](#enablement) · [Terms](#terms) · [Disclosure](#disclosure) · [Reconciliation and payouts](#reconciliation-and-payouts) · [Measuring](#measuring) · [Power law, buyouts and launches](#power-law-buyouts-and-launches) · [Tools](#tools) · [Prove it](#prove-it)

## Commission structures

The source's standard ranges, unsourced:

- **Percentage of sale:** 10-30% of the first sale or first year; for e-commerce and SaaS with clear pricing ("Earn 25% of every sale you refer").
- **Flat fee per action:** $5-500 depending on value; for lead gen, trials, freemium ("$50 for every qualified demo").
- **Recurring:** 10-25% of recurring revenue; for subscriptions ("20% of subscription for 12 months").
- **Tiered:** to motivate high performers ("20% for 1-10 sales, 25% for 11-25, 30% for 26+").

"A headline percentage without its base and duration is not a program offer."

## Cookie windows

How long after a click the affiliate gets credit:

| Duration | Use case |
|---|---|
| 24 hours | High-volume, low-consideration purchases |
| 7-14 days | Standard e-commerce |
| 30 days | Standard SaaS and B2B |
| 60-90 days | Long sales cycles, enterprise |
| Lifetime | Premium affiliate relationships |

## Economics before a rate

Use collected eligible revenue and the business's real variable costs, refund and churn history, partner support, tooling, recruitment and payout fees. Decide whether taxes, discounts, refunds, renewals, upgrades and existing customers belong in the commission base.

```text
cohort contribution = collected eligible revenue after refunds
                    - product/service variable costs
                    - affiliate commissions
                    - partner support and program operations
                    - payout fees
```

The source's illustrative cohort, "not an industry benchmark": $12,000 collected minus $2,000 refunds leaves $10,000 eligible revenue; at 20%, commission is $2,000; with $3,000 variable costs, $800 partner support, $1,200 program operations and $100 payout fees, contribution is $2,900. Don't count support in both variable costs and operations; deferred or clawed-back commissions get their own ledger entries, "not a second subtraction of the same refund".

For recurring programs, model actual retention and commission duration by cohort. For lead or demo bounties, define the accepted action, duplicates, cancellations and qualification criteria before quoting a rate. Compare with the same acquisition and payback period used for other channels.

## Recruiting

**Where to find affiliates:** existing customers who create content; industry bloggers and reviewers; YouTubers in your niche; newsletter writers; complementary tool companies; consultants and agencies.

Build a small shortlist with audience and ICP evidence, relevant content, acquisition channel and a realistic first placement. Distinguish editorial publishers, consultants and agencies, complementary products, creators and coupon partners: "they may introduce demand or intercept an existing purchase differently."

**The partner funnel, with denominators:** qualified candidates → contacted → accepted → activated → first accepted conversion → retained productive partner. Count distinct partners. "An accepted application or generated link is not an activated partner." Activation is a real, approved placement or campaign.

**The offer** states audience fit, commission base, rate and duration, eligibility, allowed channels, payment timing, a support contact and the proposed first activity.

**Outreach template**, copied from the source:

```
Subject: Partnership opportunity - [Your Product]

Hi [Name],

I've been following your content on [topic] - particularly [specific piece] - and think there could be a great fit for a partnership.

[Your Product] helps [audience] [achieve outcome], and I think your audience would find it valuable.

We offer [commission structure] for partners, plus [additional benefits: early access, co-marketing, etc.].

Would you be open to learning more?

[Your name]
```

"Draft outreach without claiming familiarity with work you have not reviewed. Apply existing user authorization before sending." An unsolicited email is cold outreach: its legal rules (CAN-SPAM, GDPR, CASL and others) are in [email-practices COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/COMPLIANCE.md) and the practice is in [cold-outreach](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cold-outreach/SKILL.md).

## Enablement

Give affiliates: unique tracking links or codes; a product overview and key benefits; the target audience description; a comparison to competitors; creative assets (logos, banners, images); sample copy and talking points; case studies and testimonials (permissioned ones, [review-management REVIEW-PROGRAMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/review-management/REVIEW-PROGRAMS.md#reusing-reviews-as-evidence)); demo access or a free account; FAQ and objection handling; payment terms and schedule.

Test the customer journey and attribution "with authorized test data before inviting a broad cohort", and give each partner a tested link or code, truthful positioning, approved assets, disclosure guidance, a first-placement plan and a support contact.

## Terms

Return a decision table for review, "not invented legal boilerplate":

| Decision | Specify |
|---|---|
| Attribution | Link or code priority, window, repeat purchases, cross-device gaps, competing partners |
| Eligible conversion | New or existing customer treatment, accepted lead or order, refunds and cancellations |
| Channel policy | Brand bidding, coupon publishing, email outreach, paid ads, self-referrals, sub-affiliates |
| Commission | Base, rate, duration, tier transitions, currency and rounding |
| Payout | Hold period, threshold, schedule, verification, disputes, chargeback handling |
| Changes and exit | Effective date, treatment of accrued commissions, notice, dispute contact |

"Do not promise a tracking rule the tool cannot implement." Legitimate coupon partners are not automatically fraud, and shared IPs or devices are "a signal for review, not proof of abuse". The fraud list is in [PROGRAM-DESIGN.md](PROGRAM-DESIGN.md#fraud).

## Disclosure

The source: partners "should explain the material connection clearly near the recommendation/link, rather than relying on a hidden terms page or an ambiguous label", with the example draft "I earn a commission if you buy through this link." The FTC's FAQ ([FTC, "FTC's Endorsement Guides: What People Are Asking"](https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking)) agrees and adds:

- Its own example wording: "I get commissions for purchases made through links in this post."
- "Affiliate link" alone may not be understood, and a "buy now" button isn't a disclosure; "Paid link" right next to the link "should be an adequate disclosure"; "commissionable link" "is probably not a clear disclosure".
- The disclosure sits "very close to, or - even better - part of, the endorsement"; one in the comments or behind a hyperlink "is easily avoidable".
- Advertisers "need to have reasonable programs in place to train and monitor members of their network", and outsourcing the program doesn't remove that responsibility.

Match the wording to the real relationship; "do not fabricate personal use or authorize unsupported product claims." Other markets need their own guidance; the source and this skill cover only the US FTC.

## Reconciliation and payouts

- Reconcile each eligible conversion to the platform's real states: pending, approved or due, paid, refunded or adjusted, disputed. Keep stable order, customer and partner IDs and the effective policy version.
- "Replayed webhooks and exports must not count a conversion or payment twice." Idempotent event handling is in [stripe](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/SKILL.md) and [background-jobs](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/background-jobs/SKILL.md).
- Choose the hold period from actual refund and cancellation exposure and the agreed terms.
- "Marking a commission paid is not necessarily a money transfer." Check whether the tool only calculates commissions or also sends payouts; the source cites Rewardful's [commission payment workflow](https://help.rewardful.com/en/articles/2773351-how-do-i-pay-commissions) and [refund handling](https://www.rewardful.com/automated-refund-handling) as one tool's behavior, not every platform's.
- Handle a disputed sale with the attribution record, the policy and the refund state. "Do not silently retroactively change earned commissions to make a report look better."

## Measuring

Report active placements, accepted conversions, collected eligible revenue, refund and churn by cohort, commissions pending, due and paid, total program cost, and contribution. Keep new customers apart from existing-customer upgrades and late coupon touches. "Cookie/code attribution assigns credit; it cannot establish what would have happened without the affiliate": where feasible, compare a bounded partner rollout or holdout with an untreated cohort, and label observational comparisons as such ([METRICS.md](METRICS.md#return)).

The deliverable: a cohort economics worksheet with explicit assumptions, a partner shortlist and activation funnel, reviewed terms decisions, an enablement checklist, a reconciliation sample, and a small launch plan with success and stop criteria from measured margins.

## Power law, buyouts and launches

From [coreyhaines31/marketingskills, referrals, references/viral-mechanisms.md], the author's claims:

- **20/80:** "Roughly 20% of affiliates drive ~80% of results." Identify super-promoters and invest in them (higher tiers, custom assets, co-marketing, a direct relationship, early access); "Recruiting 1,000 passive affiliates is worth less than activating 10 great ones."
- **Buyout clause:** for high performers on recurring commissions, the right to buy out the future commission stream for a lump sum, "commonly around 12× the monthly commission".
- **Launch stacking:** time affiliate promotion to a launch or hard deadline with a shared date, shared assets and a reason to act now. The source reports Cometly drove "$251K on a single launch day" this way; that figure is unverified.

## Tools

Named by the source: networks and SaaS affiliate tools ShareASale, Impact, PartnerStack, Tapfiliate, FirstPromoter, Rewardful (Stripe-integrated), Refersion (e-commerce), Tolt; partner relationship management Introw. Referral platforms are in [PROGRAM-DESIGN.md](PROGRAM-DESIGN.md#tools).

## Prove it

The offer states base, rate, duration and window; the economics worksheet uses collected revenue after refunds and counts each cost once; the funnel counts distinct activated partners; the terms table is filled and reviewed; every partner placement carries a disclosure next to the link in plain words; a replayed webhook leaves commission totals unchanged; "paid" in the report matches money actually sent; and outreach went only to recipients allowed under the email rules.
