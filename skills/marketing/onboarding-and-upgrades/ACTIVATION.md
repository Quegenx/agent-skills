# Activation and onboarding

Getting a new signup to the moment they "get it", fast: the principles, the psychology behind progress mechanics, the components to build from, how to find the activation event from data, the minimum path to value, the first 30 seconds, checklists, empty states and tours, email alongside the product, stalled users, and the audit format. From [coreyhaines31/marketingskills, onboarding] `SKILL.md` and `references/minimum-path-to-value.md` (MIT, Copyright (c) 2025 Corey Haines), which cites Amplitude's Compass docs for the aha-moment method; people it credits (BJ Fogg, Ramli John) are kept. Written for web products; app onboarding (permissions, store sign-in, push) is in [app-growth ONBOARDING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/ONBOARDING.md). The signup form before onboarding is in [cro SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cro/SKILL.md).

**Contents:** [Principles](#principles) · [Psychology](#psychology) · [The toolkit](#the-toolkit) · [Defining activation](#defining-activation) · [Find the aha moment](#find-the-aha-moment) · [Minimum path to value](#minimum-path-to-value) · [The first 30 seconds](#the-first-30-seconds) · [Checklists, empty states and tours](#checklists-empty-states-and-tours) · [Email alongside the product](#email-alongside-the-product) · [Stalled users](#stalled-users) · [Measure it](#measure-it) · [Patterns by product type](#patterns-by-product-type) · [Output formats](#output-formats) · [Prove it](#prove-it)

## Principles

[coreyhaines31/marketingskills, onboarding]

1. **Time to value is everything:** remove every step between signup and core value.
2. **One goal per session:** the first session aims at one successful outcome; advanced features wait.
3. **Do, don't show:** "Interactive > Tutorial. Doing the thing > Learning about the thing."
4. **Progress creates motivation:** show advancement, celebrate completions, make the path visible.

## Psychology

[coreyhaines31/marketingskills, onboarding] The source's frames; none comes with a study in the source.

- **Endowed progress:** people finish faster when progress is already started for them. The source claims a checklist that opens at "20% done" (a step pre-completed on their behalf) drives "roughly +40% completion" against 0%; treat the figure as its claim and test it.
- **[Peak-end rule](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/growth-ideas/PSYCHOLOGY.md#peak-end-rule):** engineer a clear high point and end each session well.
- **Goldilocks rule:** motivation peaks when a task is on the edge of ability; early steps achievable, not trivial.
- **[BJ Fogg Behavior Model](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/growth-ideas/PSYCHOLOGY.md#bj-fogg-behavior-model):** if a step is not happening, check motivation, ability and the prompt; the source attributes the model to BJ Fogg. Use the canonical owner's official form and old-source correction rather than treating the source's multiplication symbols as an arithmetic formula.
- **Boosters and blockers** (credited to Ramli John): add boosters (pre-filled data, templates, quick wins, celebrations), remove blockers (required fields, dead ends, confusing empty states).
- **[Hick's Law](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/growth-ideas/PSYCHOLOGY.md#hicks-law):** every step, field and option is a decision.

## The toolkit

[coreyhaines31/marketingskills, onboarding] Use the fewest that reach value.

| Component | Purpose |
|---|---|
| Welcome forms | Capture role or goal to personalize the path (keep short) |
| Initial screens | Orient and point to one clear action |
| Drip emails | Multi-touch nurture, "one concept per email" |
| Skippable tutorials | Optional guidance users can bypass; never trap them |
| Videos | Show complex workflows |
| Docs / help center | Self-serve reference for when users get stuck |
| Onboarding calls | Human touch for complex or high-value accounts |
| Data inputs | Get the user's real data in so value feels real |
| Checklists | Ordered, value-first steps with visible progress |
| Empty states | Guided first actions, not dead ends |

## Defining activation

[coreyhaines31/marketingskills, onboarding]

- **"Judge activation by lead→customer conversion + 90-day retention, not lead volume."**
- **Pick the activation model first** (freemium, free trial, paid trial, money-back, consultation): it shapes the whole path ([ACTIVATION-MODELS.md](ACTIVATION-MODELS.md)).
- **Examples by product type:** project management, create the first project + add a team member; analytics, install tracking + see the first report; design tool, create a design + export or share; marketplace, complete the first transaction.
- **Activation metrics:** % of signups who reach it, time to it, steps to it, and each by cohort and source.

## Find the aha moment

[coreyhaines31/marketingskills, onboarding] Find early actions associated with later retention, on a defined cohort and timeline:

1. **Define signup as time zero,** an early activation window, and a separate retention outcome after it (for example, first-seven-day actions and return activity in week four; choose windows that fit the product's cadence).
2. **Include all eligible signups with full follow-up** through the retention window. Show recent, immature cohorts separately; don't count them as churned or restrict the denominator to users who already activated.
3. **Compare actions in the early window only.** "A week-four return cannot also be the early activation predictor of week-four retention."
4. **Treat high-correlation events and thresholds as hypotheses.** Report counts, uncertainty and acquisition or product segments; confirm on a later mature cohort before adopting the definition.
5. **Test whether an onboarding intervention improves later retention** or conversion. "Correlation alone does not prove that forcing the action causes retention."

The source cites [Amplitude's Compass setup](https://amplitude.com/docs/analytics/charts/compass/compass-aha-moment) (early actions separate from later retention, time for every cohort member to retain) and its [interpretation guide](https://amplitude.com/docs/analytics/charts/compass/compass-interpret-1) (correlation vs causation). Building the cohorts in PostHog is in [posthog SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/SKILL.md).

## Minimum path to value

[coreyhaines31/marketingskills, onboarding]

- **MPTV:** "the least number of steps to experience *enough* value to make a confident decision". Not the fastest path to any value, not the full tour.
- **Inventory → remove → reconstruct:** (1) list every step between signup and value: every screen, field, click, confirmation, permission prompt and empty state ("Most teams underestimate their own step count by half"); (2) for each, does the user have to do it to reach value now? If not, cut, defer, pre-fill or make it skippable; configuration, profile completeness, advanced settings and "nice to know" education are almost never essential; (3) rebuild in value-first order, measure, and cut again: "the first reconstruction is a hypothesis, not a finish line". Treat every retained step "as guilty until proven essential".
- **Not repeated as fact:** the source's abandonment figures ("40-60% of users who sign up for a free trial abandon after a single session"; "75-80% of trial abandonment happens within the first day") and its Stripe, Calendly and Notion benchmarks ("~7 lines of code / ~60% activation") have no source.

## The first 30 seconds

[coreyhaines31/marketingskills, onboarding]

| Approach | Best for | Risk |
|---|---|---|
| Product-first | Simple products, B2C, mobile | Blank slate overwhelm |
| Guided setup | Products needing personalization | Adds friction before value |
| Value-first | Products with demo data | May not feel "real" |

Whatever you choose: a clear single next action, no dead ends, progress indication if multi-step.

## Checklists, empty states and tours

[coreyhaines31/marketingskills, onboarding]

- **Checklists** for multiple setup steps, several features to discover, or self-serve B2B: 3 to 7 items, ordered by value, quick wins first, a progress bar, a celebration on completion, and a dismiss option.
- **Empty states** are onboarding opportunities: explain what the area is for, show what it looks like with data, one clear primary action, optionally pre-populated example data. [app-ui STATES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/STATES.md#empty-loading-filtered-partial) does it its own way: "Empty states sit on a card", with what to do and the action, and no example data; [anti-slop-copy MICROCOPY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/MICROCOPY.md) has the copy rule ("Empty states point forward").
- **Tooltips and tours** for complex UI or power features: 3 to 5 steps at most, dismissable at any time, not repeated for returning users.

## Email alongside the product

[coreyhaines31/marketingskills, onboarding]

- **Trigger-based emails:** welcome (immediate); incomplete onboarding (24h, 72h); activation achieved (celebration + next step); feature discovery (days 3, 7, 14).
- **Email "should reinforce in-app actions, not duplicate them"**, drive back to the product with a specific CTA, and be personalized by actions taken.
- **Sending and compliance** are in [email-practices SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/SKILL.md); app push schedules in [app-growth RETENTION-AND-MONETIZATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/RETENTION-AND-MONETIZATION.md#retention-and-engagement).

## Stalled users

[coreyhaines31/marketingskills, onboarding] Define "stalled" (X days inactive, incomplete setup), then: an email sequence (value reminder, blockers, an offer of help); in-app recovery ("Welcome back", pick up where they left off); a human touch for high-value accounts.

## Measure it

[coreyhaines31/marketingskills, onboarding] Activation rate, time to activation, onboarding completion, day 1, 7 and 30 retention, and drop-off at each step:

```
Signup → Step 1 → Step 2 → Activation → Retention
100%      80%       60%       40%         25%
```

The percentages are the source's illustration, not a benchmark. Fix the biggest drop first. Experiments to try are in [EXPERIMENTS.md](EXPERIMENTS.md).

## Patterns by product type

[coreyhaines31/marketingskills, onboarding]

| Product type | Key steps |
|---|---|
| B2B SaaS | Setup wizard → First value action → Team invite → Deep setup |
| Marketplace | Complete profile → Browse → First transaction → Repeat loop |
| Content platform | Follow/customize → Consume → Create → Engage |
| Mobile app | Permissions → Quick win → Push setup → Habit loop |

**The mobile row conflicts with app-growth's rule** "Ask for permissions in context; they are the #1 drop-off point. Push after activation, never on cold open" [eronred]; app-growth records all three views and keeps the in-context rule ([app-growth ONBOARDING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/ONBOARDING.md)). Follow app-growth for apps.

## Output formats

[coreyhaines31/marketingskills, onboarding]

- **Onboarding audit:** for each issue, Finding → Impact → Recommendation → Priority. Write Priority on the P0 to P3 scale of [code-review REVIEWER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/REVIEWER.md) (P0 blocks the primary task; P1 likely task failure; P2 meaningful friction; P3 minor craft).
- **Onboarding flow design:** the activation goal, the step-by-step flow, checklist items, empty-state copy, email triggers, and the metrics plan.
- **Ask first:** which early action predicts later retention, with what activation window and fully observed cohort; what happens right after signup; where users drop off; the activation target; whether a cohort comparison of retained vs churned users exists.

## Prove it

The activation event was chosen from a fully observed cohort with the early and retention windows apart, and confirmed on a later cohort; every step left between signup and that event survived the "does the user *have* to do this to reach value right now?" test; the first screen has one next action; checklists have 3 to 7 items and can be dismissed; onboarding emails each carry one concept; and audit findings carry P0 to P3.
