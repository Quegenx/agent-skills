---
name: referral-programs
description: "Designs and runs customer referral, affiliate and review programs: whether to build virality into the product first (the viral potential spectrum, Powered By badges, exposure loops, embeds, watermarks), the referral loop, trigger moments and share mechanics, reward types and sizing against target CAC, launch and nurture emails, fraud and clawbacks, FTC disclosure of rewards and commissions, K-factor, referral rate and ROI with incrementality, affiliate commissions, cookie windows, recruitment, terms, payout reconciliation and partner funnels, and honest review requests for G2, Capterra, Trustpilot and Google with replies, reputation triage and testimonial permissions. Use when planning or fixing a refer-a-friend or affiliate program, sizing a referral reward, choosing referral or affiliate tools, writing referral emails, asking customers for reviews, replying to a bad review, or reusing reviews as testimonials."
---

# Referral programs

Existing customers and partners can bring new customers three ways: the product spreads through normal use, a reward program pays customers or affiliates for referrals, and honest reviews persuade strangers. This skill holds Corey Haines's `referrals` skill (v2.2.1) from [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) (MIT), checked against the FTC's Endorsement Guides FAQ, the FTC's Consumer Reviews and Testimonials Rule Q&A, Google Maps' content policy and Trustpilot's business guidelines. The source's benchmark ranges and outcome claims come without studies and appear only labelled as its own.

The source reads its context from `.agents/product-marketing.md`; this repo's file is `.agents/product-context.md`, defined in [anti-slop-copy CONTEXT.md](../../anti-ai-slop/anti-slop-copy/CONTEXT.md). For a mobile app, the store rules (Apple's guidelines on referral rewards, contacts, ATT and push, and Google Play's) and deep-link mechanics are in [app-growth LAUNCH-AND-MARKETING.md](../../mobile/app-growth/LAUNCH-AND-MARKETING.md#referral-programs).

| The job | Read |
|---|---|
| Should the product spread on its own: the viral potential spectrum, the seven viral mechanisms, leading with the larger number, reward timing, friction | [VIRAL-LOOPS.md](VIRAL-LOOPS.md) |
| Designing a referral program: the questions, referral or affiliate, the loop, trigger moments, share mechanics, reward types and examples, sizing the reward (two formulas), disclosure, fraud, the launch checklist and emails, fixing a weak program | [PROGRAM-DESIGN.md](PROGRAM-DESIGN.md) |
| Measuring it: program health and business metrics, K-factor and its bands, referral rate, ROI with a holdout, the source's benchmarks and claims | [METRICS.md](METRICS.md) |
| An affiliate program: commission structures, cookie windows, recruitment and the outreach template, enablement, tools, cohort economics, the partner funnel, terms, FTC disclosure, reconciliation, buyouts and the 20/80 rule | [AFFILIATES.md](AFFILIATES.md) |
| Reviews on G2, Capterra, Trustpilot and Google: neutral invitations, no sentiment gating, platform incentive rules, replying to a review, reputation triage, quote permissions | [REVIEW-PROGRAMS.md](REVIEW-PROGRAMS.md) |

## The rules

1. **Check the product's viral potential before paying for referrals.** Collaboration, communication and user-facing outputs spread through use; backend, internal-only and competitive-advantage tools don't, so don't force a loop there [coreyhaines31/marketingskills, referrals].
2. **Ask at a value moment and reward after a qualifying action,** right after the first "aha", a milestone, great support or a renewal, never at signup [coreyhaines31/marketingskills, referrals].
3. **Size the reward inside the acquisition budget,** counting both sides of a double-sided reward and valuing credits at their real cost; if other costs already reach target CAC, pause or redesign ([PROGRAM-DESIGN.md](PROGRAM-DESIGN.md#sizing-the-reward)).
4. **A material connection is disclosed next to the recommendation.** Commissions and rewards are disclosed in words the reader understands, close to the link; a platform's built-in label is not necessarily enough ([FTC Endorsement Guides FAQ](https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking)).
5. **Fraud signals start a review, not a verdict.** Hold rewards until the referred customer is real, cap them, claw back on refunds and chargebacks, and treat shared IPs or devices as "a signal for review, not proof of abuse" [coreyhaines31/marketingskills, referrals].
6. **Attribution is not incrementality.** Without a holdout, report "attributed contribution return", never causal ROI [coreyhaines31/marketingskills, referrals].
7. **Never buy a sentiment.** No reward tied to a positive review, no review invitations sent only to happy customers, no incentives at all on Google Maps or Trustpilot, and a disclosure does not cure a positivity condition ([REVIEW-PROGRAMS.md](REVIEW-PROGRAMS.md#platform-rules): Google Maps, Trustpilot and the [FTC review rule Q&A](https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers)).
8. **Drafts are not sends.** Outreach, invitations, replies, moderation flags and payouts go out only within what the user has authorized [coreyhaines31/marketingskills, referrals].

## Prove it

The plan places the product on the viral spectrum before proposing rewards; the reward passes the sizing check with both sides counted; every reward fires only after a qualifying action and has a cap and a clawback rule; shared links and affiliate placements carry a disclosure next to the link; a replayed webhook or export doesn't count a conversion or payout twice; ROI is labelled attributed unless a holdout exists; review invitations go to everyone who meets a neutral milestone; and every file's own Prove it checks pass for the parts you touched.
