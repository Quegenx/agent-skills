# Designing a referral program

The questions to ask, the loop, rewards and their size, disclosure, fraud, and launch. From [coreyhaines31/marketingskills, referrals] unless tagged. Whether the product should spread on its own first is in [VIRAL-LOOPS.md](VIRAL-LOOPS.md); the numbers are in [METRICS.md](METRICS.md).

**Contents:** [Before starting](#before-starting) · [Referral or affiliate](#referral-or-affiliate) · [The referral loop](#the-referral-loop) · [Rewards](#rewards) · [Sizing the reward](#sizing-the-reward) · [Disclosing the reward](#disclosing-the-reward) · [Fraud](#fraud) · [Launch](#launch) · [Emails](#emails) · [Fixing a weak program](#fixing-a-weak-program) · [Tools](#tools) · [Prove it](#prove-it)

## Before starting

Read `.agents/product-context.md` first, then gather what it lacks:

- **Program type:** customer referral, affiliate, or both; B2B or B2C; average customer LTV; current CAC from other channels.
- **Current state:** an existing program; the current referral rate (% who refer); incentives already tried.
- **Product fit:** is it shareable, does it have network effects, do customers talk about it naturally.
- **Resources:** tools or platforms in use or considered; budget for incentives.

## Referral or affiliate

| | Customer referral | Affiliate |
|---|---|---|
| Best for | Existing customers recommending to their network; products with natural word of mouth; lower-ticket or self-serve products | Reaching audiences you don't have; content creators, influencers, bloggers; higher-ticket products that justify commissions |
| Referrer | An existing customer | May not be a customer |
| Reward | One-time or limited | An ongoing commission relationship |
| Trade-off | Higher trust, lower volume | Higher volume, variable trust |

Getting creators to promote a $199-499 course is an affiliate program in the source's eval, with commission, cookie and payout terms [coreyhaines31/marketingskills, referrals evals]. The affiliate playbook is in [AFFILIATES.md](AFFILIATES.md); creator sponsorships and vetting are in [creator-marketing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/creator-marketing/SKILL.md).

## The referral loop

```
Trigger Moment → Share Action → Convert Referred → Reward → (Loop)
```

- **Trigger moments (high intent):** right after the first "aha" moment; after a milestone; after exceptional support; after renewing or upgrading.
- **Share mechanism, ranked by the source** (its own ranking, no data given): 1. in-product sharing ("highest conversion"); 2. personalized link; 3. email invitation; 4. social sharing; 5. referral code ("works offline").
- **Reduce friction:** one-click share, pre-written messages ([VIRAL-LOOPS.md](VIRAL-LOOPS.md#referral-best-practices)).

On iOS, an invite flow that touches Contacts, push reminders or a free subscription period as the reward has App Review rules of its own, collected in [app-growth LAUNCH-AND-MARKETING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/LAUNCH-AND-MARKETING.md#referral-programs).

## Rewards

**Structures:** single-sided (referrer only), "Simpler, works for high-value products"; double-sided (both parties), "Higher conversion, win-win framing"; tiered, "Gamifies referral process, increases engagement". Reward at the aha moment or a milestone, not signup.

**Incentive types** [coreyhaines31/marketingskills, referrals, references/program-examples.md]:

| Type | Pros | Cons | Best for |
|---|---|---|---|
| Cash or credit | Universally valued | Feels transactional | Marketplaces, fintech |
| Product credit | Drives usage | Only valuable if they'll use it | SaaS, subscriptions |
| Free months | Clear value | May attract freebie-seekers | Subscription products |
| Feature unlock | Low cost to you | Only works for gated features | Freemium products |
| Swag or gifts | Memorable, shareable | Logistics complexity | Brand-focused companies |
| Charity donation | Feel-good | Lower personal motivation | Mission-driven brands |

**Examples the source gives:**

- **Dropbox:** give 500MB storage, get 500MB; the reward is tied to product value, low friction (just an email), both benefit equally, progress tracking.
- **Uber and Lyft:** give $10 ride credit, get $10 when they ride; double-sided, easy to share by code or link.
- **Morning Brew:** tiered rewards for subscriber referrals: 3 referrals stickers, 5 a T-shirt, 10 a mug, 25 a hoodie; physical rewards are themselves shareable.
- **Notion:** $10 credit per referral (education), aimed at a high-sharing audience (students).

For a $29/month product offering $10 to the referrer only, the source's eval names it single-sided, suggests testing double-sided and tiered rewards, and notes the incentive may not be the only problem [coreyhaines31/marketingskills, referrals evals].

## Sizing the reward

Two formulas, from two third-party sources; they differ.

**This source** [coreyhaines31/marketingskills, referrals, references/program-examples.md]:

```
Total Referral CAC = Total Reward Cost + Other Acquisition Cost
Max Total Reward Cost = max(0, Target CAC - Other Acquisition Cost)
```

"Use costs per newly acquired paying customer over the same cohort and period. Total reward cost includes both sides of a two-sided reward; other acquisition cost includes allocated tool, campaign, and management costs." Value credits and free months at their actual cost or foregone contribution, not at face value, and not at zero.

Worked example: lifetime revenue $1,200 at 70% gross margin gives $840 lifetime gross profit; target total referral CAC $200; other acquisition cost $40 per customer; so the maximum combined reward is $200 - $40 = $160 (for example $80 cash to each side), and total referral CAC is $200. "The old $640 reward would produce $680 CAC with these other costs, exceeding the $200 target." "Lifetime gross profit helps assess whether the chosen acquisition budget is viable; it is not the reward budget minus target CAC." "If other costs already meet or exceed target CAC, pause or redesign the program; a zero remaining reward budget does not make an already over-budget acquisition acceptable." Check retention, refunds and cash payback before committing. The source points to [Stripe's CAC guide](https://stripe.com/resources/more/cac-in-saas) for the cost definition.

**The mobile source's formula** [eronred, referral-programs]: `Max referral reward (per side) ≤ (LTV × target margin) - other CAC`, with "Never make rewards larger than CAC". Its mobile delivery and store-specific restrictions remain in [app-growth LAUNCH-AND-MARKETING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/LAUNCH-AND-MARKETING.md#referral-programs); the formula is defined here.

The differences: the Corey Haines source caps the combined reward of both sides against a target CAC; [eronred, referral-programs] caps each side against LTV times margin. Run both and state which one the plan uses.

**Typical rewards the source lists** (unsourced): B2C $10-50 or 10-25% of the first purchase; B2B SaaS $50-500 or 1-3 months free; enterprise higher, often custom. app-growth gives its own defaults by app type (subscription about $5-15 as 1 month free; marketplace $5-25 invitee, $5-15 inviter; fintech $5-25 cash after a qualifying action) [eronred]. Both are author claims.

## Disclosing the reward

The FTC's Endorsement Guides FAQ has no question that names refer-a-friend programs. The nearest answers ([FTC, "FTC's Endorsement Guides: What People Are Asking"](https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking)):

- A small incentive such as "a $1-off coupon, an entry in a sweepstakes" needs disclosure depending on "whether knowing about that gift or incentive would affect the weight or credibility your readers give" to the recommendation.
- Asked whether a platform's built-in disclosure tool is enough: "Not necessarily. It's good that some platforms offer these tools, and we don't want to dissuade you from using them."
- "There is nothing special about hashtags from a disclosure perspective"; starting a post with "Ad:" or "#ad" "would likely be effective".

Applying this to a referral link posted publicly for a reward is interpretation, not a ruling: give the share sheet's pre-written public message a disclosure the user can keep, for example "I get a free month if you join with my link". Affiliate disclosure is in [AFFILIATES.md](AFFILIATES.md#disclosure).

## Fraud

[coreyhaines31/marketingskills, referrals, references/affiliate-programs.md]

- **Common fraud:** self-referrals (fake accounts); referral rings (groups referring each other); unauthorized coupon distribution or attribution interception; fake email addresses; VPN and device spoofing.
- **Technical:** email verification; device fingerprinting; IP address monitoring; delayed payout (after activation); a minimum activity threshold.
- **Policy:** clear terms; a maximum number of referrals per period; reward clawback for refunds and chargebacks; manual review of suspicious patterns.
- **Structural:** the referred user must take a meaningful action; cap lifetime rewards; pay in product credit ("less attractive to fraudsters").

"Shared IPs or devices can be a signal for review, not proof of abuse. Apply rules consistently and retain the evidence for decisions." Legitimate coupon partners "are not automatically fraud" [coreyhaines31/marketingskills, referrals, references/affiliate-operations.md]. On iOS, Apple's privacy rules conflict with device fingerprinting; the conflict and app-growth's fraud table are in [app-growth LAUNCH-AND-MARKETING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/LAUNCH-AND-MARKETING.md#referral-programs). Store and process reward events idempotently so a replayed webhook never pays twice ([background-jobs](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/background-jobs/SKILL.md)).

## Launch

**Before launch:** define goals and success metrics; design the incentive structure; build or configure the referral tool; create the referral landing page; set up tracking and attribution; define fraud prevention rules; create terms and conditions; test the complete referral flow.

**Launch:** announce to existing customers; add in-app referral prompts; update the website with program details; brief the support team.

**First 30 days:** review the conversion funnel; identify top referrers; gather feedback; fix friction points; send reminder emails to non-referrers.

## Emails

The launch email, copied from the source with its placeholders:

```
Subject: You can now earn [reward] for sharing [Product]

We just launched our referral program!

Share [Product] with friends and earn [reward] for each signup.
They get [their reward] too.

[Unique referral link]

1. Share your link
2. Friend signs up
3. You both get [reward]
```

The nurture sequence: Day 7, remind about the program; Day 30, "Know anyone who'd benefit?"; Day 60, a success story plus a referral prompt; after a milestone, "You achieved [X] - know others who'd want this?" The success story must be a real, permissioned one ([review-management REVIEW-PROGRAMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/review-management/REVIEW-PROGRAMS.md#reusing-reviews-as-evidence)).

These are marketing emails: consent, unsubscribe and frequency rules are in [email-practices](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/SKILL.md). Moved to push on iOS, they need the explicit opt-in Apple requires for promotional push (in app-growth's referral section).

## Fixing a weak program

- **Few customers refer:** ask at better moments; simplify sharing; test incentive types; make the program prominent in the product.
- **Referrals don't convert:** improve the landing experience for referred users; strengthen the new user's incentive; make the referrer's endorsement visible.
- **A/B tests:** incentive (amount, type, single or double-sided, timing); messaging (program description, CTA copy, landing page copy); placement (where and when the prompt appears). Test design is in [ab-testing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SKILL.md).

| Problem | Fix |
|---|---|
| Low awareness | Add prominent in-app prompts |
| Low share rate | Simplify to one click |
| Low conversion | Optimize the referred user's experience |
| Fraud or abuse | Add verification, limits |
| One-time referrers | Add tiered or gamified rewards |

## Tools

The source names, with no comparison it verified: Rewardful (Stripe-native affiliates), Tolt (SaaS affiliates), Mention Me (enterprise referral), Dub.co (link tracking and attribution), Stripe (payment processing for commission tracking), Introw (channel partner programs with tiers, deal registration, QBRs), PartnerStack (enterprise partner and affiliate programs); referral platforms ReferralCandy (e-commerce), Ambassador (enterprise), Friendbuy (e-commerce and subscription), GrowSurf (SaaS and tech), Viral Loops (template-based campaigns); built-in options in Stripe, HubSpot and Segment. Choose on integration with your payment system, fraud detection, payout management, reporting, customization, and price against scale. Mobile deep-link and referral vendors are in app-growth.

## Prove it

The referral flow is tested end to end with test accounts before announcement; the reward fires only after the qualifying action; the sizing check is written with both sides counted and credits at their real cost; the pre-written public share message carries a disclosure; terms state the cap, the hold and the clawback; a replayed reward event pays once; and the launch and nurture emails go only to addresses with marketing consent.
