---
name: onboarding-and-upgrades
description: "Gets new signups to value and free users to paid inside a web product: onboarding principles and psychology, the onboarding toolkit, finding the activation event from fully observed cohorts, the minimum path to value, first-run screens, checklists, empty states and tours, onboarding email, stalled users, the five activation models and the card-required decision judged on visitor-to-paid, upgrade prompts and paywall screens, their timing, frequency and templates, and the App Store and Google Play rules that change them on mobile, plus an experiment catalogue. Use when users sign up but don't activate, designing onboarding or a checklist, choosing freemium, a trial or a paid trial, building an upgrade screen, feature gate or limit prompt, or testing either."
---

# Onboarding and upgrades

Signups mean nothing until they reach value and stay: "Judge activation by lead→customer conversion + 90-day retention, not lead volume." The path from signup to the activation event should be the shortest one that makes the user confident ("the least number of steps to experience *enough* value to make a confident decision"), and the ask to pay comes after that moment, not before, with an easy way to say no. This skill comes from [coreyhaines31/marketingskills, onboarding] and [coreyhaines31/marketingskills, paywalls] (MIT, Copyright (c) 2025 Corey Haines; the aha-moment method cites Amplitude, the card data ChartMogul, model-market fit Brian Balfour), checked against Apple's App Review Guidelines and Google Play's Subscriptions and Payments policies. Both sources write for web products; native app onboarding and paywalls are in [app-growth ONBOARDING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/ONBOARDING.md), [app-growth PAYWALLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/PAYWALLS.md) and [revenuecat PAYWALLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/PAYWALLS.md); the signup form before onboarding and the public pricing page are in [cro SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cro/SKILL.md) and [pricing-strategy SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/pricing-strategy/SKILL.md); early churn after activation is [churn-prevention SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/churn-prevention/SKILL.md).

Read the product context file first, `.agents/product-context.md` ([anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md)); the sources call it `.agents/product-marketing.md`. Then ask: B2B or B2C and the core value; the aha moment and the action that shows a user "gets it"; what happens after signup and where users drop off; for upgrades, the model (freemium, trial, tier upgrade, usage limit), what's behind the paywall, and whether it's a mobile app, a web app, or both.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Principles, psychology, the 10-component toolkit, defining activation, the aha-moment method, minimum path to value, the first 30 seconds, checklists, empty states, tours, onboarding email, stalled users, metrics, patterns by product type, audit output | [ACTIVATION.md](ACTIVATION.md) |
| Freemium, free trial, paid trial, money-back and consultation, the card decision on visitor-to-paid, model-market fit, hook don't satisfy | [ACTIVATION-MODELS.md](ACTIVATION-MODELS.md) |
| Upgrade prompts: principles, triggers, the seven screen parts, templates, timing and frequency, after the upgrade, dark patterns, the App Store and Play rules, what to measure | [UPGRADE-PROMPTS.md](UPGRADE-PROMPTS.md) |
| The test catalogue for onboarding and upgrade prompts, with store-invalid arms marked | [EXPERIMENTS.md](EXPERIMENTS.md) |
| Recovery audience worksheet: event evidence, billing and cross-platform identity, segment precedence, exclusions, channel eligibility and measurement handoff | [RECOVERY-COHORTS.md](RECOVERY-COHORTS.md) |

## The rules

1. **Find the activation event from data:** early window and retention window apart, every eligible signup with full follow-up, immature cohorts shown separately, the result confirmed on a later cohort and tested causally [coreyhaines31/marketingskills, onboarding] ([ACTIVATION.md](ACTIVATION.md#find-the-aha-moment)).
2. **Cut the path to value:** inventory every step, remove what isn't needed for first value, rebuild in value-first order, measure, cut again ([ACTIVATION.md](ACTIVATION.md#minimum-path-to-value)).
3. **One goal per session and one next action per screen;** no dead ends; tutorials and checklists can be skipped or dismissed [coreyhaines31/marketingskills, onboarding].
4. **Pick the activation model from the market,** and decide card-required on visitor-to-paid over the same horizon, not on trial-to-paid ([ACTIVATION-MODELS.md](ACTIVATION-MODELS.md#the-card-decision)).
5. **Ask to upgrade after value, never mid-flow,** with a cool-down of days after a dismiss and a visible "Not now" [coreyhaines31/marketingskills, paywalls] ([UPGRADE-PROMPTS.md](UPGRADE-PROMPTS.md#timing-and-frequency)).
6. **On mobile the store's rules win:** the billed amount is the most prominent price, trial terms say when the charge happens and how to cancel, the store owns payment and refunds, and lapsed users get win-back offers, not a second trial ([UPGRADE-PROMPTS.md](UPGRADE-PROMPTS.md#store-rules-for-in-app-upgrades)).
7. **Every trial that converts follows ROSCA,** and every countdown, count or "value" on a prompt is real ([offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md)).
8. **In the owner's app, plan gates follow app-ui:** an empty state with a link to the plans, and a muted line at the limit ([app-ui STATES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/STATES.md#empty-loading-filtered-partial)).
9. **Label unsourced numbers.** The sources' "+40% completion" from endowed progress, abandonment rates and product benchmarks have no study; quote them as the source's claims or leave them out.

## Prove it

Given a choice between a card-required trial (3% signup, 25% trial-to-paid) and no card (10%, 10%), the answer computes 0.75% vs 1% visitor-to-paid and recommends a randomized test rather than a universal rate; an onboarding audit lists findings with impact, recommendation and P0 to P3; an upgrade prompt for a mobile app shows the billed amount most prominently and no "de-emphasize price" arm; and every file's own Prove it checks pass for the parts you touched.
