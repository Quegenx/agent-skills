# Onboarding and upgrade experiments

A catalogue of tests for activation and in-product upgrades, with the store and legal limits marked. From [coreyhaines31/marketingskills, onboarding] `references/experiments.md` and [coreyhaines31/marketingskills, paywalls] `references/experiments.md` (MIT, Copyright (c) 2025 Corey Haines). Design, sample size and significance are in [ab-testing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SKILL.md); running them on flags in [posthog EXPERIMENTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/EXPERIMENTS.md).

**Contents:** [Onboarding experiments](#onboarding-experiments) · [Upgrade prompt experiments](#upgrade-prompt-experiments) · [What to measure](#what-to-measure) · [Prove it](#prove-it)

## Onboarding experiments

[coreyhaines31/marketingskills, onboarding]

| Area | Tests |
|---|---|
| Reduce friction | Email verification during vs after onboarding; empty states vs dummy data; pre-filled templates; OAuth options; fewer required steps; optional vs required fields; skip options |
| Step sequencing | Step order; highest-value features first; hard steps later; ratio of required to optional; one path vs branching by persona; quick start vs full setup |
| Progress and motivation | Progress bars; checklist length 3-5 vs 5-7; badges, rewards, achievements; "X% complete" visibility; starting at 20% vs 0%; celebration moments |
| Product tours | Interactive tours; tooltip vs modal guidance; video for complex workflows; self-paced vs guided; shorter vs comprehensive; automatic vs user-started |
| CTAs | Copy; placement; in-app tooltips for discovery; sticky CTAs; contrast; "Learn more" secondary vs primary only |
| UI guidance | Hotspots; coachmarks; feature announcements; contextual help; search vs guided |
| Personalization | Role-based paths; goal-based paths; role-specific dashboards; a use-case question; industry paths; beginner vs expert; personalized welcome; industry examples; recommendations from answers; segment templates; industry benchmark data |
| Quick wins | "Complete your first X"; success messages; milestone celebrations; next-step suggestions; showing what they achieved; an outcome preview |
| Motivation mechanics | Badges; streaks; leaderboards (if appropriate); rewards; features unlocked progressively |
| Support | Free onboarding calls; contextual help; chat during onboarding; proactive outreach to stuck users; help docs and videos; community access |
| Onboarding emails | Founder welcome vs generic; behavior triggers; immediate vs delayed; more vs fewer touches; short tips; video in email; subject lines; name vs behavior personalization; one clear CTA; testimonials; trial reminders; plain text vs designed |
| Feedback | When to ask NPS; a blocking question ("What's stopping you?"); follow-up by score; thumbs up/down on features; survey timing; feedback incentives |
| Stalled users | Re-engagement timing; human vs automated; a simplified path for returners; an incentive (discount or extended trial); asking what's blocking; a demo offer |
| Return experience | "Welcome back"; resume where they left off; what changed while away; a fresh-start option; trial time remaining |
| Performance | Load time; progressive loading; offline capability (mobile); graceful errors |
| Mobile | Touch targets; swipe navigation; fewer screens; mobile-friendly inputs; permission timing |
| Accessibility | Screen reader support; keyboard navigation; color contrast; font sizing |

- **Already decided elsewhere, don't re-test blindly:** permission timing on mobile has an in-context rule in app-growth ([app-growth ONBOARDING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/ONBOARDING.md)); accessibility items are requirements, not variants ([web-accessibility SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/SKILL.md)).
- **A "trial time remaining" or "urgency" variant** must show the real remaining time ([offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md#scarcity-urgency-and-dark-patterns)).

## Upgrade prompt experiments

[coreyhaines31/marketingskills, paywalls] Arms marked "web only" or "not on mobile" break a store rule there ([UPGRADE-PROMPTS.md](UPGRADE-PROMPTS.md#store-rules-for-in-app-upgrades)).

| Area | Tests |
|---|---|
| When to show | After the aha moment vs at the feature attempt; trial reminder 7 days vs 1 day before; after X actions vs after X days; soft prompts at different engagement thresholds; usage-based vs time-based |
| Trigger type | Hard gate vs soft gate (preview + prompt); feature lock vs usage limit as primary trigger; in-context modal vs dedicated page; banner vs modal; exit intent on free plan pages (web only) |
| Layout | Full screen vs modal; minimal vs feature-rich; single plan vs comparison; image vs text only; vertical vs horizontal on desktop |
| Value presentation | Feature list vs benefit statements; loss vs gain framing; a personalized value summary; before and after; an ROI calculator |
| Visuals | Screenshots or previews; a short demo video or GIF; illustration vs product imagery; animated vs static; progress visualization |
| Price display | Monthly vs annual vs both with a toggle; annual savings as $ vs %; per-day framing (on mobile only with the billed amount dominant); price after trial vs "Start Free" emphasis and prominent vs de-emphasized price (not on mobile) |
| Plan options | One recommended plan vs several; a "Most Popular" badge; 2 vs 3 plans; show or hide enterprise; a one-time purchase alongside the subscription (an in-app product on the stores) |
| Discounts and offers | First month or year discount; a countdown offer (real deadline only); loyalty discount by free usage; annual bundle; referral discount |
| Headlines | Benefit vs feature; question vs statement; urgency ("Don't lose your work") vs value; personalized with name or usage; social proof ("Join 10,000+ Pro users", only if true) |
| CTAs | "Start Free Trial" vs "Upgrade Now" vs "Continue with Pro"; first vs second person; value-specific vs generic; urgency vs none; price in the CTA vs separate |
| Objection handling | Money-back guarantee (web only; full refund, conditions beside it); "Cancel anytime" prominent; FAQ on the paywall; objections per gated feature; chat or support |
| Trial structure | 7 vs 14 vs 30 days; card required or not (web only); full vs limited trial; extension for engaged users; a second trial for churned users (not on mobile: use win-back offers) |
| Trial expiration | Countdown always vs near the end; reminder frequency; a lapse window vs immediate downgrade (web); a "last chance" discount (real deadline only); pause vs cancel (pause exists on Play only) |
| Upgrade path | One-click vs separate checkout, pre-filled payment, multiple payment methods (web only); a quarterly plan; a team invite flow for solo-to-team |
| Personalization | Copy by features used; most-used premium features; usage stats ("You've created 50 projects"); a plan recommendation by behavior; power vs casual users; B2B vs B2C; industry; role; traffic source |
| Frequency | Prompts per session; cool-down in days (not hours); escalating vs consistent; once per feature vs consolidated; re-show after major engagement |
| Dismiss | "Maybe later" vs "No thanks" vs "Remind me tomorrow"; asking the reason; an alternative offer on dismiss (on iOS, see the RevenueCat note in [UPGRADE-PROMPTS.md](UPGRADE-PROMPTS.md#store-rules-for-in-app-upgrades)); an exit survey; friendly vs neutral copy |

**Cooldown: two source views.** The test catalogue proposes "cool-down hours vs days"; the existing prompt rule requires "days, not hours" ([timing and frequency](UPGRADE-PROMPTS.md#timing-and-frequency)). Keep the existing days floor; the hours arm is a recorded conflict, not an executable variant. [coreyhaines31/marketingskills, paywalls]

## What to measure

[coreyhaines31/marketingskills, onboarding] [coreyhaines31/marketingskills, paywalls]

- **Onboarding:** activation rate, time to activation, step completion, drop-off points, return rate, day 1, 7 and 30 retention, feature adoption, support requests during onboarding.
- **Upgrade prompts:** impression rate, click-through, completion, revenue per user, churn after upgrade. A variant that lifts upgrades but raises later churn or refunds didn't win.

## Prove it

Each running test names its metric and guardrail (retention or post-upgrade churn), and has no arm that breaks a store rule on its platform or shows a deadline, count or "value" that isn't real. The source favors changing one thing to attribute an effect to that component; [ab-testing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SKILL.md) also supports deliberately testing whole variants, whose result estimates the aggregate variant effect. This file formerly made one change mandatory for every test. Keep those scopes distinct instead of calling a whole-variant result uninterpretable. [coreyhaines31/marketingskills, onboarding/references/experiments.md; Yuzzyuk/marketing-os, references/analytics.md]
