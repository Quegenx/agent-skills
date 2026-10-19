# Measurement

Every plan needs a measurement section that tells the team how to know if the plan is working. This doc is the source for Section 13's measurement subsection.

Source: [coreyhaines31/marketingskills, marketing-plan] `references/measurement-framework.md` (v1.2.2, MIT, Corey Haines), copied with its dashes replaced, its file and skill names mapped to this repo, and `.agents/product-marketing.md` written as `.agents/product-context.md`. "Quietude" is the source's anonymized example client.

**Related docs:**
- [GROWTH-PATTERNS.md](GROWTH-PATTERNS.md) - the 3-3-2-2-2 VC growth path (3× in years 1 to 2, 2× in years 3 to 7 from $1M ARR) and which phase of SaaS growth the company is in ($0 to 10K / $10K - 100K / $100K - 1M+)
- [BUDGET.md](BUDGET.md) - CAC calculation (blended, not paid-only) and the forecasting reality check (forecasts under $100M ARR are educated guesses, not precise predictions)

## The north-star principle

A north star is one metric that captures the business-model thesis at the highest level. It should:
- Be derivable from the funnel + revenue model
- Move slowly enough to be a strategic compass (not whipsawed by weekly noise)
- Trade off correctly against other metrics - improving the north star should generally improve the business

Don't default to "ARR" or "MRR" alone. Those are outcomes, not norths. Pick something that captures the business model.

**Every rate divides matching closed windows** [coreyhaines31/marketingskills, marketing-plan, SKILL.md]: "an activation rate counts only cohorts whose observation window has ended (a trial still inside its window is pending, not failed - keep it out of the denominator and label it pending)." The same rule in tools: [posthog EXPERIMENT-CHANGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/EXPERIMENT-CHANGES.md) (`only_count_matured_users`) and [revenuecat CHARTS-AND-METRICS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/CHARTS-AND-METRICS.md) (`incomplete: true` points).

## North-star patterns by business model

### B2B SaaS (subscription)
- **Net Revenue Retention (NRR)** - keeps existing customers + expansion in focus
- Alternative: "Logo retention × expansion ARR"
- Why: ARR alone hides churn / lets gross-add growth mask product fit problems

### D2C consumer app (subscription)
- **Blended LTV / blended CAC** - keeps unit economics honest as paid layer scales
- Alternative: "Day-35 paid users from cohort × LTV"
- Why: monthly subscription metrics are volatile; cohort × LTV smooths it

### Hybrid hardware + software (e.g., Quietude)
- **Blended LTV / blended CAC across hardware + software** - captures the wedge thesis
- Alternative: "Hardware-buyers-to-subscriber conversion × blended margin"
- Why: hardware revenue isn't free (cost to make); subscription revenue isn't expensive to acquire if hardware funds it

### Marketplace (two-sided)
- **Liquidity ratio × take-rate** - captures both sides + monetization
- Alternative: "Monthly transacting users × take-rate × repeat frequency"
- Why: GMV alone doesn't capture whether the marketplace is becoming a habit

### Developer tool / open source
- **Weekly active developers × paid-conversion** - captures both adoption and monetization
- Alternative: "Weekly active orgs × seats per org × ARPU"

### Content / media business
- **Daily active readers / listeners × ad revenue per session** - captures both reach and monetization
- Alternative: "Subscriber count × retention × ARPU"

### Commerce (DTC, non-subscription)
- **Repeat purchase rate × AOV × frequency** - captures monetization layered on quality of customer
- Alternative: "Customer LTV / CAC × payback period"

## Leading indicators by AARRR stage

After the north star, every plan needs leading indicators per AARRR stage. These move faster than the north star and trigger investigations.

### Acquisition leading indicators
- Organic visits/month, total + per pillar (SEO health)
- App Store / Play Store visit-to-install rate (ASO health)
- Founder-led social channel growth → email subscriber conversion (LinkedIn / X / Substack funnels)
- Event-to-app conversion rate (event ROI)
- Ambassador-attributed visits (referral funnel)
- Paid CAC by channel (when paid is firing)

### Activation leading indicators
- Day 1 / Day 7 / Day 35 → paid conversion rate
- Onboarding session-completion rate
- First key-action completion (post-signup activation event; pick the event by retention, not by assumption: [posthog METRICS-MODELING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/METRICS-MODELING.md))
- App Store conversion rate (install → trial → paid)
- Trial → paid conversion rate

### Retention leading indicators
- Day 30 / Day 60 / Day 90 retention
- Monthly churn rate (gross + net)
- Lifecycle email engagement (open / click / unsubscribe by flow)
- Hardware → app activation rate (for hybrid businesses)
- Win-back / reactivation rate

### Referral leading indicators
- Ambassador-attributed new subs (via Dub or similar)
- Share-after-value moment rate (% of users sharing)
- Two-sided referral completion rate
- Guides program referrals (when live)
- NPS score (if surveyed)

### Revenue leading indicators
- ARPU by cohort
- Annual plan adoption %
- Cohort LTV by source
- Plan mix shifts
- Eye-mask / hardware attach rate (for hybrid)
- Expansion revenue (B2B)

## Review cadence

The plan should specify three rhythms:

### Weekly (operational sync)
- **Who:** fCMO ↔ founder (CEO usually)
- **Duration:** 30 min
- **Format:** AARRR scoreboard (current vs. last week numbers across the leading indicators) + this week's ships + blockers
- **Output:** Action items, decisions made

### Monthly (metrics review)
- **Who:** fCMO + founder + extended team (CXO, product lead, designer if applicable)
- **Duration:** 60 to 90 min
- **Format:** Full metrics review + comparison against quarterly KPI targets + qualitative learnings + idea bank reprioritization
- **Output:** Possible plan adjustments, hire decisions

### Quarterly (plan recalibration)
- **Who:** fCMO + founders + key advisors
- **Duration:** 2 to 3 hours
- **Format:** Full plan review against 90-day and 12-month outcomes, channel-level analysis, funding-stage transition check, recalibration of next 90 days
- **Output:** Updated plan (could be v2 / v3 document iteration)

## KPI target setting

For each quarter in Section 10, the plan must include 3 to 5 specific KPI targets. These should be:
- **Specific** - not "improve retention," but "Day 30 retention from 22% → 30%"
- **Measurable** - pull from a wired data source
- **Stretch but plausible** - based on funnel state + historical patterns
- **Decision-triggering** - if missed, what does that mean? (Adjust strategy, kill a channel, etc.)

### KPI target patterns by quarter

**Q1 (foundation quarter):**
- Mostly *bedrock* metrics - fixing leaks. "Headphones-gate conversion drop reverses." "Day 1 → paid +25 to 50%."
- Some *foundation* metrics - laying tracks. "4 SEO pillars staked." "App Store rewrite shipped."
- Avoid bold growth targets - the foundations aren't in yet

**Q2 (validation quarter):**
- Mostly *validation* metrics - does what we built work? "Paid CAC < $X blended." "Organic traffic 1,500 to 3,500/mo."
- Some *cohort* metrics - do new cohorts behave better? "Day 7 retention for Q2 cohort vs. Q1."

**Q3 (scaling quarter):**
- Mostly *scaling* metrics - how far does it go? "Paid scaling to $20 to 30K/mo with CAC steady." "First B2B install reference case live."
- Some *capability* metrics - what new things are live? "First Guides pilot launched."

**Q4 (compound quarter):**
- Mostly *compound* metrics - is the flywheel turning? "50%+ of new subs from non-paid channels." "Ambassador-driven 15 to 25% of new subs."
- Some *narrative* metrics - does the Series A story write itself? "Blended LTV/CAC > 3."

## Anchoring against the VC growth path

For VC-backed clients past $1M ARR, anchor 12-month and multi-year targets against the **3-3-2-2-2 rule** (3× in years 1 and 2, then 2× in years 3 through 7). Hitting it is rare; most companies don't. Anchoring against it forces the plan to either match it and show how, or explicitly defend choosing a slower trajectory. Full table and context in [GROWTH-PATTERNS.md](GROWTH-PATTERNS.md).

For non-VC-backed companies (bootstrapped, founder-funded, profit-focused), the 3-3-2-2-2 doesn't apply. Use linear-pattern targets ("$X MRR added per month") or step-function targets ("$Y revenue jump after the enterprise tier launches") instead.

## Forecasting reality check

A plan derives a budget and an annual goal. It does not produce a 12-month month-by-month forecast that's reliably accurate to the dollar.

**Unless the company is publicly traded, all forecasts are educated guesses.** No startup under $100M ARR consistently hits month-by-month forecasts. Quarterly review is when the plan adjusts - not when variance is treated as failure.

What the plan commits to honestly:
- The annual goal is a defensible direction-of-travel
- The budget is the resource commitment that makes the goal plausible
- The 90-day roadmap (Section 9) is what's actionable now
- Month-to-month projection is illustrative, not promised

Founders who over-engineer the forecast end up explaining variance every month instead of executing. The plan should resist this - name the annual target, the quarterly KPIs, and the kill criteria. Don't promise the month.

Full context in [BUDGET.md](BUDGET.md).

## Kill criteria

For every channel or initiative, the plan should specify when to stop. Often missing from plans, kill criteria force discipline.

Examples:
- "If a paid channel has CAC > 2× target after 30 days at meaningful spend, pause."
- "If onboarding Variant 3 doesn't show statistically meaningful lift (or directional lift + congruent qualitative signal) after 4 weeks, move to Variant 1."
- "If lifecycle Flow 4 has open rate < 12% after 6 weeks, redo subject lines + audience segmentation." (Opens are unreliable: Google says low open rates "aren't necessarily an accurate indicator of deliverability", quoted in [email-practices DELIVERABILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/DELIVERABILITY.md); [email-marketing SEQUENCES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/email-marketing/SEQUENCES.md) reports "clicks, conversions, unsubscribes and complaints, not opens".)

**Two scopes, both kept.** The source's "CAC > 2× target after 30 days at meaningful spend" is a plan-level, blended-CAC rule. [app-growth BUDGET-AND-ROAS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/BUDGET-AND-ROAS.md) has a per-channel test rule [appeeky]: "spend > 2× target CPA with 0 conversions = pause channel" with a 48-hour first kill window. Use each at its own scope. Likewise the source's "Blended LTV/CAC > 3" is a plan health check, while app-growth's "CPA < 0.5× LTV to scale aggressively" is a paid-scaling gate on a different denominator.

## Guardrail metrics

Some metrics get a hard guardrail (cannot drop below threshold). Useful for protecting brand or unit economics during aggressive growth.

Examples:
- "Brand voice complaint rate > 1% of customer feedback triggers content review."
- "Paid CAC > $X for two consecutive months pauses paid scaling pending audit."
- "App Store rating drops below 4.5 triggers product review."

## Data sources mapping

The plan should name where each metric comes from. This makes it auditable.

| Metric | Source |
|---|---|
| Organic traffic | GA4 / Ahrefs |
| App Store conversion | App Store Connect |
| Funnel conversion (Day N → paid) | Internal analytics (Mixpanel / Amplitude; this repo: [posthog](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/SKILL.md)) or App Store Connect cohort export |
| Retention | Customer.io segments + product analytics |
| MRR / ARR | Stripe (via MCP if wired) |
| Plan mix | Stripe |
| Lifecycle email metrics | Customer.io (this repo's stacks: [resend](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/resend/SKILL.md), [onesignal](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/onesignal/SKILL.md)) |
| Ambassador attribution | Dub.co |
| Hardware → app activation | Shopify + App Store + internal join |
| NPS | Survey tool (Customer.io / Typeform / SurveyMonkey) |

## When data isn't wired

If a metric can't currently be measured, flag it in Section 13's open decisions. Example:

> "Hardware → app activation rate not currently visible in the App Store dashboard. Requires Shopify ↔ App Store Connect join. Q1 work item."

A plan with un-measurable goals is a plan that can't be validated. Surface the instrumentation work explicitly.

## Reporting cadence + automation

Where possible, auto-generate the metrics review rather than building it manually each time. Stripe MCP + GA4 MCP + Customer.io MCP can pull most of what's needed.

For Tier 1 clients, a simple weekly metrics email to the team (Markdown table, generated via skills + MCPs) costs nothing and creates discipline.

For Tier 2+ clients, consider a real dashboard (Hex, Metabase, Looker, or internal tool).

## Prove it

Section 13 names a north star specific to the business model (not ARR alone), leading indicators per stage with a data source each, the weekly, monthly and quarterly cadence, 3 to 5 decision-triggering KPIs per quarter, kill criteria and guardrails; every rate counts only closed windows; an unwired metric is an open decision; no month is promised.
