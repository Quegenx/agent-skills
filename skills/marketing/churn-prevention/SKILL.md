---
name: churn-prevention
description: "Reduces subscription churn for SaaS and web products: cancel flows with an exit survey, save offers matched to the reason, discount limits, pause and downgrade paths, B2B routing without forced calls, post-cancel confirmation and win-back timing, risk signals and a health score that handles missing data, churn metrics and cancel-flow tests, and dunning for failed payments (prevention, retries, the four emails, grace periods and in-app banners), with the US cancellation law and Stripe's real retry settings. Use when churn is high, building or fixing a cancel flow or save offer, adding a pause or downgrade option, scoring account health, or recovering failed payments."
---

# Churn prevention

Churn comes in two kinds with different fixes: voluntary (the customer chooses to cancel; cancel flows, save offers, exit surveys) and involuntary (a payment fails; retries, dunning emails, card updaters). The best save happens before the customer clicks Cancel, and the cancel itself stays easy: the way out is visible on every screen and the cancellation completes even if the save flow errors. This skill comes from [coreyhaines31/marketingskills, churn-prevention] (MIT, Copyright (c) 2025 Corey Haines), checked against ROSCA and the FTC's 2026 rulemaking notice, Stripe's Smart Retries, card and cancellation-page docs, Paddle's webhook overview, and GDPR Art. 12. The source's churn statistics carry no study and are left out or labelled. It is for subscriptions you bill yourself; store subscriptions (where the user cancels in the App Store or Play) are in [app-growth RETENTION-AND-MONETIZATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/RETENTION-AND-MONETIZATION.md) and [revenuecat BILLING-AND-RECOVERY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/BILLING-AND-RECOVERY.md). Stripe mechanics stay in [stripe SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/SKILL.md); preventing early churn through activation is [onboarding-and-upgrades SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/onboarding-and-upgrades/SKILL.md).

Read the product context file first, `.agents/product-context.md` ([anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md)); the source calls it `.agents/product-marketing.md`. Then ask [coreyhaines31/marketingskills, churn-prevention]: monthly churn, voluntary vs involuntary if known; active subscribers and average MRR; whether a cancel flow exists; the billing provider and intervals; whether pause or downgrade is supported; whether usage is tracked per user and what the activation metric is; past cancel reasons; B2B or B2C; and the brand tone for offboarding.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| The five-step cancel flow, the exit survey, offers by reason, discount, ladder and pause rules, downgrade, wireframes, B2C, B2B and freemium flows, monthly vs annual, segments, post-cancel, data after cancel | [CANCEL-FLOWS.md](CANCEL-FLOWS.md) |
| Risk signals, the health score with partial coverage, interventions, churn metrics and formulas, cohorts, cancel-flow A/B tests | [HEALTH-SCORE.md](HEALTH-SCORE.md) |
| Involuntary churn: prevention, card updaters, retries and Stripe's real settings, the four dunning emails, grace periods and access, in-app banners, Stripe and Paddle webhooks | [DUNNING-COPY.md](DUNNING-COPY.md) |
| The law: ROSCA's three duties, the vacated 2024 rule and the March 2026 rulemaking, fake urgency in save offers | [offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md#trials-auto-renewal-and-cancellation) |

## The rules

1. **Cancelling stays simple.** "Continue cancelling" is visible on every step, B2C flows take 2 to 3 screens, the cancellation completes even if the save flow errors, and no account size is forced onto a phone call; ROSCA requires "simple mechanisms for a consumer to stop recurring charges" ([offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md#trials-auto-renewal-and-cancellation)).
2. **Ask once, then match the offer to the reason:** one single-select question with 5 to 8 reasons, then one primary offer and one fallback, never a wall of options [coreyhaines31/marketingskills, churn-prevention] ([CANCEL-FLOWS.md](CANCEL-FLOWS.md#match-the-offer-to-the-reason)).
3. **Keep discounts shallow and rare:** 20 to 30% for 2 to 3 months, never above 30%, at most two per session, never re-offered to a repeat canceller; any "expires when you leave" claim is true [coreyhaines31/marketingskills, churn-prevention].
4. **Offer pause and downgrade before the exit:** pauses of 1 to 3 months with data kept and an advance reactivation email; downgrades that show keep vs lose and preserve data.
5. **New customers get onboarding, not discounts;** dormant ones get a pause and a question, not a coupon ([CANCEL-FLOWS.md](CANCEL-FLOWS.md#segments)).
6. **Score health on one scale and never count missing data as zero;** report coverage and validate thresholds against later renewals before acting ([HEALTH-SCORE.md](HEALTH-SCORE.md#the-health-score)).
7. **Count a save only if it lasts:** track the LTV of saved customers and name the churn formula in every report ([HEALTH-SCORE.md](HEALTH-SCORE.md#metrics)).
8. **Dunning runs on the provider's real settings:** on Stripe, Smart Retries at Billing > Revenue recovery > Retries ("8 tries within 2 weeks" by default), at most three custom retries, and Stripe's own hard-decline list ([DUNNING-COPY.md](DUNNING-COPY.md#retries)).
9. **Dunning copy never blames,** links straight to the payment update, states real dates, and the product stays usable during grace ([DUNNING-COPY.md](DUNNING-COPY.md#the-four-emails)).
10. **Post-cancel mail is marketing mail:** consent and unsubscribe rules apply ([email-practices COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/COMPLIANCE.md)).

## Prove it

Given 7% monthly churn at $49/mo, the answer splits voluntary and involuntary churn, builds a survey-plus-offer flow and a dunning sequence, and asks for activation data before discounting; given 40% "too expensive" answers, it checks activation and usage before cutting price; a test cancel completes with no phone step; a Paddle integration listens for `transaction.payment_failed`, `subscription.past_due` and `subscription.canceled`; and every file's own Prove it checks pass for the parts you touched.
