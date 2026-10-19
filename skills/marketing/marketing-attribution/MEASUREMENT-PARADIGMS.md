# Measurement paradigms

Models split credit inside tracked data ([ATTRIBUTION-MODELS.md](ATTRIBUTION-MODELS.md)); these three paradigms are increasingly rigorous, increasingly expensive ways to get closer to causality. This file helps pick one and read a test honestly, not run the statistics. From [coreyhaines31/marketingskills, attribution] (references/measurement-paradigms.md, MIT). The statistics of a controlled test are [ab-testing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SKILL.md); holdouts on PostHog experiments are [posthog EXPERIMENT-CHANGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/EXPERIMENT-CHANGES.md).

## The three, compared

[coreyhaines31/marketingskills, attribution]

| | **MTA** (multi-touch) | **MMM** (media mix modeling) | **Incrementality** (experiments) |
|---|---|---|---|
| **Approach** | Bottom-up: stitch user-level touches, apply a model | Top-down: regress outcomes vs. spend/factors over time | Controlled: withhold exposure from a group, measure the difference |
| **Answers** | "Which touchpoints are on converting journeys?" | "What's each channel's aggregate contribution?" | "Did this channel *cause* lift I wouldn't have gotten?" |
| **Granularity** | Per user, per touch | Per channel, per week | Per test (one channel/tactic at a time) |
| **Data needed** | Clean cross-device user-level tracking | 2 to 3 yrs weekly data + spend variation | Ability to withhold + enough volume for significance |
| **Reacts** | Real-time | Slowly (weeks/quarters) | Per test cycle |
| **Handles offline/brand** | No | Yes | Yes (if you can split exposure) |
| **Privacy-durable** | Weak (cookie/ID loss) | Strong (aggregate) | Strong (aggregate) |
| **Cost/effort** | Low to medium | High | Medium to high |

**How to choose:** small budget or short cycle: good UTMs, last non-direct and a self-reported survey beat a fancy model. Mid budget, several channels: MTA day to day plus periodic incrementality tests on the biggest line items. Large budget with offline and brand spend: MMM for the portfolio plus incrementality to validate MMM's coefficients. Incrementality is the tiebreaker whenever two channels claim the same conversions.

## MTA

[coreyhaines31/marketingskills, attribution]

- **What it is:** the user-level approach most marketers mean by "attribution": join a person's touches, apply first, linear, position or data-driven credit.
- **Where it shines:** day-to-day tactical decisions ("Is this campaign showing up on converting journeys?"); fast, granular, cheap if tracking exists.
- **Why it's weakening:** it depends on tracking one person across touches and devices, and that data keeps eroding: Safari and Firefox cookie limits, iOS ATT, consent gating, ad blockers, cross-device and in-app-browser behavior (research on mobile, buy on desktop).
- **Chrome third-party cookies:** on 17 October 2025 Google wrote that "Chrome will maintain our current approach to offering users third-party cookie choice in Chrome" and that "Some Privacy Sandbox technologies are being phased out" ([privacysandbox.google.com](https://privacysandbox.google.com/blog/update-on-plans-for-privacy-sandbox-technologies)). The source said only that deprecation "was announced, then walked back"; "cookies are going away" is not the story, but everything else above already limits user-level tracking.
- **The click-path bias:** impression channels (social, video, display) often never enter the journey, because a view with no click leaves no stitchable touch. So MTA over-weights demand capture (search, email, direct) and under-weights demand creation, silently under-measures what it can't follow (dumping it into direct) and over-measures what it can see. Treat MTA as "incomplete and directionally biased", not a clean lower bound (its retargeting and branded numbers are often over-stated).
- **Use it for** ongoing optimization and trend-watching, never as the sole basis for a big budget reallocation.

## MMM

[coreyhaines31/marketingskills, attribution]

- **What it is:** a top-down statistical model (historically regression; open-source options include Meta's Robyn and Google's Meridian) explaining an outcome (revenue, signups) as a function of spend per channel plus controls (seasonality, promotions, price, macro). It never looks at individuals, which is why privacy changes don't touch it.
- **What only it gives:** offline, brand and hard-to-track channels (TV, podcasts, OOH, PR, organic); diminishing returns and saturation curves (where the next dollar stops paying off); a portfolio view of the whole mix.
- **What it costs:** 2 to 3 years of weekly data and real variation in spend (if you always spend the same on Meta, the model can't learn Meta's effect; you sometimes deliberately vary budgets to feed it). Correlational and slow (it reacts in quarters). Sensitive to specification: garbage controls, garbage coefficients.
- **Use it for** annual or quarterly allocation across material, multi-channel (especially offline) spend, and validate its coefficients with incrementality tests: MMM says "Meta contributed X"; a holdout proves whether that's causal.

## Incrementality

[coreyhaines31/marketingskills, attribution] The only paradigm that measures causality directly: split the audience into an exposed and a withheld (control) group; the difference in outcomes is the incremental lift.

- **Geo holdout / geo-lift:** run the channel in some regions, hold it out of comparable ones, compare outcomes. The workhorse for channels you can't split by user (Meta's GeoLift, Google's geo experiments).
- **PSA tests:** the control group sees a public-service ad in your ad's place, so both groups are equally targeted and ad-exposed; isolates the ad effect from audience-quality bias.
- **Ghost ads:** the platform runs the auction but withholds your ad from the control group and logs the impression that would have served (the control user may see another advertiser's ad). Cleaner and cheaper than PSAs, and the modern default where the platform supports it. Logging would-have-served opportunities identifies the comparison set; it is separate from intent-to-treat.
- **Intent-to-treat analysis:** compare outcomes by the groups people were randomly assigned to, whether or not they saw an ad. It estimates the effect of assignment and preserves the randomized comparison; it is not a synonym for switching a channel off ([Cochrane handbook, chapter 8](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-08)).
- **On-off (pulse) tests:** switch a channel off for a defined window and examine total outcomes. A simple before/after can be confounded by seasonality, demand changes and other campaigns; use randomized regions or time blocks when feasible ([Google's geo-experiment research](https://research.google.com/pubs/archive/38355.pdf)), and account for carryover and spillover before calling the change causal.
- **Holdout audiences:** withhold a random share from a retargeting or email program; the delta is the program's true lift. OneSignal's Journeys equivalent is in [onesignal JOURNEYS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/onesignal/JOURNEYS.md).

### Reading a test

[coreyhaines31/marketingskills, attribution]

1. **Lift = exposed rate minus control rate.** Exposed geos at 4.2% and control at 3.6% is about 0.6 points of incremental lift; the rest of the 4.2% would have converted anyway. This is why last-click ROAS is almost always overstated: it counts the whole 4.2%.
2. **Check the confidence interval.** "5% lift, interval -2% to +12%" includes zero and losses: you can't claim a win. Compare the interval to the smallest lift that changes your decision; if it straddles it, the test was too small to decide.
3. **Watch for contamination.** Control users reached anyway (cross-device, spillover between geos) shrink the measured gap; a "no lift" result can be a leaky test, not a dead channel.
4. **Translate to a decision.** Incremental CPA = spend / *incremental* conversions (not total). This is the number that should move budget, and it's usually worse than the platform's reported CPA. The ROAS formulas for apps are in [app-growth BUDGET-AND-ROAS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/BUDGET-AND-ROAS.md).

**Use it for** the highest-stakes questions and tiebreakers: does retargeting do anything; is paid branded search buying clicks you'd get free; which of two big channels really drives growth. You can only test a few things at a time, so spend tests on the decisions that matter most.

## The mature stack

[coreyhaines31/marketingskills, attribution] Layers, not competitors:

- **MTA** for daily and weekly tactical optimization and trend-watching.
- **MMM** for quarterly and annual portfolio allocation including offline. Allocate the next dollar on marginal ROI and saturation curves, not average platform ROAS.
- **Incrementality** as the calibration and tiebreaker that keeps MTA and MMM honest, run on the biggest bets.

## Triangulated overrides

[coreyhaines31/marketingskills, attribution] When incrementality, surveys and platform gaps all say one channel is under-credited in click MTA, don't invent a platform-gap multiplier. Document a rule:

1. **Channel-level override (reporting layer):** after MTA runs, shift a bounded share of conversions from Direct or branded search into the under-credited channel for the window you have evidence for (holdout dates, campaign flight). Keep the raw MTA table intact; decision dashboards read the adjusted table. Fast to ship; channel level only.
2. **User-level insertion (advanced):** before MTA runs, add synthetic touchpoints (for example "YouTube impression") onto a subset of Direct journeys where survey match, geo-test membership or platform exposure logs justify it, then re-score. Needs engineering; unlocks creative and audience granularity.

Start with one channel, one override, temporal bounds and a conservative slice of measured lift (not 100% of a noisy point estimate). Expand only after stakeholders trust the first rule.

**Scale to the user:** most small businesses need good UTMs, last non-direct, a self-reported survey and the occasional on-off test, not an MMM. Bring in MMM when offline or brand spend is material and MTA visibly can't see it; formal incrementality when one channel's budget is big enough that being wrong about it is expensive.

## Prove it

A recommended paradigm matches the budget, cycle and channel mix stated in the brief; every test readout states lift as exposed minus control, its interval, the smallest decision-changing lift and contamination checks; budget moves cite incremental CPA or ROAS, not platform-reported; and every override names its channel, window, share and the test that justifies it, with the raw MTA table kept.
