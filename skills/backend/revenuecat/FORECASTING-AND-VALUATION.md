# Forecasting and valuation

Forecasts project MRR, ARR, revenue or subscribers forward, and valuations estimate what a subscription app could sell for. Both are built from the account's own chart data (mechanics in [CHARTS-AND-METRICS.md](CHARTS-AND-METRICS.md)); forecast rates never come from published benchmarks, while valuation reads `get-benchmarks` percentiles into its scorecard. The forecast hinges on one line: churned MRR in a month is the MRR up for renewal that month times one minus the renewal rate, with due MRR from the Subscription Status chart by expiration month and the rate from Subscription Retention or Cohort Explorer. The valuation hinges on a named profit base times a multiple band, positioned on evidence, never a multiple of revenue. Plan durations, products and offerings are explained in [CONCEPTS.md](CONCEPTS.md).

**Contents:** [Pick the forecast method](#pick-the-forecast-method) · [The churn line](#the-churn-line) · [Due and rate by duration](#due-and-rate-by-duration) · [Steps for month-by-month MRR](#steps-for-month-by-month-mrr) · [Rest-of-period run-rates](#rest-of-period-run-rates) · [Scenario forecasts](#scenario-forecasts) · [Prediction Explorer](#prediction-explorer) · [Valuation ground rules](#valuation-ground-rules) · [The profit base](#the-profit-base) · [The bands](#the-bands) · [Positioning scorecard](#positioning-scorecard) · [Range and confidence](#range-and-confidence) · [Grounding in RevenueCat data](#grounding-in-revenuecat-data) · [Selling an app](#selling-an-app) · [Prove it](#prove-it)

## Pick the forecast method

Read this file before pulling charts for any forecast, projection, extrapolation, run-rate, or "what ad spend or acquisition hits this growth target" question. Use the MCP `get-chart-options-schema` and `get-chart-data` tools, not `rc charts show`: the CLI does not expose expiration-month segmentation and the selectors this method needs.

| Question | Method |
|---|---|
| Month-by-month MRR or ARR, including solve-for-spend, "in one month", "in N months" | [The churn line](#the-churn-line) plus [Steps](#steps-for-month-by-month-mrr). Short horizons are N steps of that line, not a net-movement trend. |
| Revenue to the end of the month or year | [Rest-of-period run-rates](#rest-of-period-run-rates). Do not run the MRR Steps. |
| Low, base and high cases, or "N months out" | [Scenario forecasts](#scenario-forecasts), with the churn line for MRR and subscribers |
| Underspecified ("forecast", "predict the future") | A 12-month MRR projection via the MRR Steps. Say the default out loud. |

- **Annual-heavy books under the default:** the Status snapshot won't fill every month. Use the expiration months it has, leave empty annual months at zero due (no fill-in), keep rolling short-duration due and inflows, and say the annual schedule only covers the live book's next cycle.

## The churn line

`churned MRR[m] = MRR up for renewal in m × (1 − renewal rate)`

- **It applies even when the user already gave churned MRR,** spend or efficiency numbers.
- **Short horizons (1 to 2 months, any small N) are N forward steps,** not a run-rate and not an average of recent net MRR movement:
  1. Read the Status `expiration_month` Total MRR for every calendar month overlapping the window (for example the remaining current month plus next month for about 30 days; two full months for "in two months").
  2. Each step: `churn[m] = due[m] × (1 − rate)` per duration. Roll P1M and P3M due past the snapshot; empty annual months are zero due.
  3. Add inflows from recent new, resubscription and expansion only.
  4. `MRR[m+1] = MRR[m] − churn[m] + inflow[m]`, once for N=1, twice for N=2.
  5. One script. Net movement or frozen churned MRR serve only as a diagnostic gap: never a second method for the headline, and never `annual_base / 12`.

Correct, one month ahead (same idea for N=2 with two months in the loop):

```
    # due from Status expiration_month (measure=mrr), not base/12
    due_annual_next = 28316.52          # e.g. Oct Total MRR for P1Y
    due_monthly = monthly_base          # standing P1M book
    churn = due_annual_next * (1 - r_annual) + due_monthly * (1 - r_monthly) + ...
    mrr_next = mrr_now - churn + inflow_run_rate
```

- **The renewal rate comes from Subscription Retention or Cohort Explorer** (chart literals only): not `observed_churned ÷ base`, not Set-to-Renew %. The rate applies to the due slice for that duration. Monthlies' due is about the stock; for quarterlies and longer, never take `churned ÷ full base` and apply it to the due slice, which understates churn.
- **"MRR up for renewal" comes from Subscription Status,** for the current cycle of the live book:

```
    get-chart-data(
      project_id="<id>",
      chart_name="subscription_status",
      realtime=true,
      resolution="<id from options schema>",
      start_date="<YYYY-MM-DD>",
      end_date="<YYYY-MM-DD>",
      segment="expiration_month",
      selectors="{\"measure\": \"mrr\"}",  # JSON string, not an object; not active_subscriptions
      limit_num_segments=24,               # so later months are not folded into Other
      # optional: filters="[{\"name\": \"product_duration\", \"values\": [\"P1Y\"]}]"
    )
```

- **Status-only options stay on Status.** Do not copy `segment=expiration_month`, `limit_num_segments` or `selectors.measure` onto Retention, Cohort Explorer, MRR or MRR Movement; take each chart's options from `get-chart-options-schema` with `"realtime": true`.
- **Each segment is the calendar month** when currently active subscriptions' periods end. Use Total MRR only as `due[m]`. Set to Renew, Cancel and Billing Issue are near-term intent labels, not renewal rates.
- **Status is a snapshot of the live book only.** Model new, resubscription and expansion from MRR Movement (or the user's spend plan) as inflows. If due can't be pulled, ask for the renewal schedule rather than using `annual_base / 12`.

## Due and rate by duration

| Duration | Due (Status available) | Due (Status unavailable) | Rate |
| --- | --- | --- | --- |
| P1Y | Total MRR by `expiration_month` (first and repeat renewals of the live book). Empty far months stay empty: do not invent fill-in. | Prior-year P1Y new plus resubscriptions in month M (misses repeat anniversaries: state that) | Retention Y1 or Cohort (`subscription_type = new` when using Retention) |
| P1M | Near-term expiration buckets, then roll about the standing monthly base each later month | Standing monthly base | Retention or Cohort (or movement `churned / due` where due is about the base) |
| P3M and other fixed | Near-term buckets, then roll about base / term-months | base / term-months | Retention or Cohort (or movement `churned / due`, never `churned / full base`) |

Wrong:

```
    annual_due = annual_base / 12          # or due_frac = {"annual": 1/12}
```

```
    repeat_annual = observed_annual_churn - annual_due[m] * (1 - rate)
    churn_annual = annual_due[m] * (1 - rate) + repeat_annual      # then projected
```

```
    rate = 1 - churned_P3M / p3m_base      # then churn = (p3m_base/3) * (1 - rate)  → understates
```

```
    # after due*(1-rate) disagrees with last month's churned MRR:
    project(net_fn)  or  mrr *= (1 - blended_churn) + inflow   # never
```

Correct:

```
    # due: subscription_status, measure=mrr, segment=expiration_month, filter product_duration=P1Y
    annual_due = {"2026-11": 17.32, "2027-02": 6.66, ...}   # Total MRR per expiration month
    # rate: Subscription Retention Y1 or Cohort Explorer, not Set-to-Renew %
    churn_annual[m]  = annual_due[m] * (1 - renewal_rate_annual)

    # monthly: expiration-month for the next cycle, then due ≈ standing monthly_base thereafter
    churn_monthly[m] = monthly_due[m] * (1 - renewal_rate_monthly)
    # quarterly: due ≈ p3m_base/3; rate from Retention (or churned_P3M / due, not / p3m_base)
```

## Steps for month-by-month MRR

For month-by-month MRR or ARR only.

1. **Current stocks:** pull MRR segmented by `product_duration`.
2. **Due:** pull Subscription Status (selectors `{"measure": "mrr"}`, `segment=expiration_month`, a high `limit_num_segments`), filtered by `product_duration` per modeled duration. Use Total MRR per expiration month as `due` only; roll P1M and P3M past the snapshot; leave empty annual months empty.
3. **Rates:** from Subscription Retention or Cohort Explorer, not Set-to-Renew %. Every rate literal in code must appear in a prior tool output.
4. **Inflows:** MRR Movement for new, resubscription and expansion run-rates only. Do not feed churned MRR, net movement or a blended churn rate into the projection; churn must be `due[m] × (1 − rate)`, never `project(net_fn)`, a fit on net MRR movement, or `mrr * (1 - blended_churn)`.
5. **Exactly one script** shaped like the Correct block. If month-1 modeled churn differs from observed, print the gap as a diagnostic only: no second calibrated, blended or net-movement projection, no residual. The renewal-due result is the central answer.
6. **Present** the central case, the range and its drivers, and the gap diagnostic. Call a number a floor or ceiling only if every stated assumption biases it that way.

## Rest-of-period run-rates

- **Today is incomplete:** exclude it from the daily average, or say you excluded it.
- **Give a range or state the observed day-to-day volatility.** A bare point estimate is not a forecast.
- **Triangulate two methods:** elapsed-day pace, and the prior period's shape applied to the current one. Say which you weighted and why.
- **Split out MRR already locked** via Subscription Status expiration months in the rest of the period, rather than assuming renewals spread evenly.
- **Put the headline numbers in the chat answer,** not deferred to a chart or artifact.

## Scenario forecasts

- **Each case names the driver that differs** (acquisition rate, renewal rate, a pricing change working through the base), not a multiplier on the same number.
- **Commit to a central case;** a range alone does not answer.
- **Every renewal or retention rate comes from a chart pull for this account.** Published benchmarks are context, not inputs.
- **"N months out" ends N months from today.** If anchored on the last complete month, say so and name the end month.
- **MRR or subscribers:** use the churn line for the retention side.

## Prediction Explorer

- **Models cohort LTV, not churn.** Use it for payback or LTV cross-checks when asked; it does not replace the churn line.

## Valuation ground rules

Use this when the user asks what their app is worth, what they could sell it for, how app valuations or acquisitions work, or how to prepare a subscription app for sale.

- **Always a range with a confidence level,** never a single guaranteed number. An app is ultimately worth what a buyer will pay, and there is no guarantee a buyer exists at any price.
- **General education, not financial, legal or tax advice.** For an appraisal, tax or deal terms, point to a broker, attorney or tax professional.
- **Ground estimates in the user's RevenueCat data** rather than quoting ranges in the abstract.
- **Four decisions, in order:** 1) choose and name the profit base; 2) choose the band; 3) position within the band on evidence; 4) state the range, the confidence and what would move it.

## The profit base

- **Apps are valued as a multiple of profit, not revenue.** Do not apply multiples directly to revenue metrics. MRR and ARR are the top line and inputs to retention, growth and concentration checks, not a valuation base.

| Base period | Broad market | Mature subscription |
|---|---|---|
| Monthly operating profit | 12x to 36x | 36x to 60x |
| Annual operating profit | 1x to 3x | 3x to 5x |

- **Revenue known but not costs:** ask for costs. If they're unavailable, state the assumed margin and show the arithmetic: "$200k ARR × 60% assumed margin = $120k profit × 3 to 5x = $360k to $600k".
- **Two bases, not interchangeable.** Pick one, name it, and apply the matching multiple:
  - **Owner earnings:** what a solo buyer who does the work themselves would take home. Proceeds minus cash operating costs, plus one-off and non-recurring costs added back. For owner-operated apps sold to individual buyers.
  - **Post-hire operating profit:** what the app earns after paying market rate for the work the founder does for free today: owner earnings minus the cost of replacing that work. For a studio or portfolio acquirer who will staff the app. Default to this. The published 3x to 5x band is a post-hire number: the acquirers quoting it are portfolio buyers who carry the operating cost.
- **Replacement cost:** ask the weekly hours across engineering, support, marketing and admin, who is paid and how much, and whether the founder stays through the transition. Part-time maintenance is about "a few thousand dollars a month"; a full-time founder doing engineering and UA "is a salary". Present it as a stated assumption.
- **Computing the base:** start from proceeds (revenue net of sales tax or VAT and store commissions) rather than gross revenue, since App Store and Play Store fees are already removed. The charts method says the opposite for general revenue questions: default to gross revenue and say so (see [CHARTS-AND-METRICS.md](CHARTS-AND-METRICS.md#revenue)). Request proceeds via `get-chart-data` on `revenue` with `revenue_type` = `proceeds`. Subtract operational costs (servers, support, licensing), marketing and UA spend, and ongoing maintenance; apply the add-backs.
  - **Do not subtract interest or corporate income tax:** they reflect the seller's financing and tax situation, which the buyer replaces with their own. The "taxes" removed in proceeds are sales tax and VAT.
  - **New-feature development is usually excluded** (it funds future profit); note when some of it belongs.
  - **Use trailing-twelve-month (TTM) figures** as the base.
- **Run-rate sensitivity:** annualize the last two full quarters. When that differs from TTM by more than about 20%, present both: "On trailing-twelve-month profit of $100k, the range is $300k to $500k. At the current run rate of $140k, the same multiples give $420k to $700k. Buyers will anchor closer to the trailing figure and ask you to prove the run rate holds: sustained growth is the argument for the top of the range, not for a bigger base."
- **Declining apps:** the run-rate is the floor a buyer pushes toward; TTM is what the seller defends. Show the gap either way.
- **Don't annualize a spike.** Two or more quarters of consistent movement is a trend; one strong month behind a launch or seasonal peak is not. Check chart `annotations` first.

## The bands

- **Two published ranges for different tiers of app,** not one range.
- **Broad-market heuristic:** 12x to 36x monthly operating profit (about 1x to 3x annual). It spans the whole market, including younger or higher-churn apps; some apps sell for many multiples more, some don't sell.
- **Mature-subscription floor:** 3x to 5x annual operating profit (about 36x to 60x monthly): where disciplined buyers anchor for proven, low-risk subscription businesses. $100k annual operating profit at 3 to 5x is about $300k to $500k.
- **The bands sit end to end,** meeting only at 3x annual or 36x monthly. Do not average the two or claim a single number reconciles them.
- **The mature band is gated on evidence, not age.** Qualification is about whether a full renewal cycle is observable, which is usually visible well before an app's second birthday. All three must hold:
  - **Subscription-dominant revenue:** roughly 70%+ of proceeds from subscriptions.
  - **A completed renewal cycle for the dominant plan duration,** read from `subscription_retention` or `cohort_explorer`. Check the annual-vs-monthly mix by revenue first. Annual-dominant needs cohorts observed past month 12; monthly-dominant needs cohorts well past the first-month churn cliff (several renewal periods). An 18-month-old annual-dominant app with complete month-12 cohorts qualifies; a three-year-old app that just launched annual plans does not.
  - **A flattened curve:** it decays, then levels off across at least two consecutive cohorts. A curve still falling steeply at the last observed period is incomplete evidence however long the history is.
- **Fail any check and use the broad-market band;** say which check failed and what clears it (usually a number of months). Past the gate, age is not a factor: the multiple is set by what the cohorts show.
- **Non-subscription-dominant apps:** RevenueCat has no published or recommended valuation insights. Do not offer a valuation.

## Positioning scorecard

The band is the starting point; these factors set where in it the app lands. Score each factor strong, neutral or weak, and say which evidence drove each call.

| Factor | Strong | Weak | Where to look |
| --- | --- | --- | --- |
| Retention (2x weight) | Churn or retention in the top 30% of category peers, flat curve | Bottom 30%, or a still-falling curve | `get-benchmarks` (monthly churn), `subscription_retention` |
| Trajectory | Growing 25%+ YoY, sustained two or more quarters | Declining 10%+ YoY | `revenue` (proceeds), trailing twelve vs prior twelve |
| Monetization | Realized LTV, trial and paying conversion in the top 30% | Bottom 30%, or no pricing headroom left | `get-benchmarks`, `conversion_to_paying` |
| Distribution | Compounding channels, healthy paid payback | Borrowed growth, or paid that does not pay back | Ask the user |
| Concentration | Diversified across store, geography and SKU | A single dependency past the thresholds below | `revenue` segmented by `store`, `country`, `product_id` |
| Transferability | Low ops burden, documented, transferable store account | Founder-dependent, undocumented, transfer-blocked | Ask the user |

- **`get-benchmarks` `percentile_bucket`:** 70+ strong, 30 to 70 neutral, under 30 weak. It already accounts for reverse metrics (a high percentile on churn means low churn). Rows with `is_eligible_for_benchmarking: false` are low-confidence: score them neutral and say so.
- **Position:** net two or more strong and no weak puts it in the top third; roughly balanced, the middle third; net two or more weak, the bottom third.
- **Caps on price:** declining revenue, transfer-blocking issues, undocumented financials, concentration. Mention any that apply.
- **Show the scorecard, not just the conclusion.** "Top-quartile retention and 30% year-over-year growth, but 90% of revenue from one country" is the answer; the number summarizes it.
- **Retention is the strongest signal and biggest lever** (hence the 2x weight). Buyers cited healthy annual-subscription retention from about 25% to about 70%. Benchmark against the category, be ready to explain early churn ("roughly 30% of subscriptions cancel in the first month"), and show that later cohorts stabilize.
- **Monetization headroom:** under-monetization is a plus (room in pricing, offers, plan mix).
- **Distribution tiers:** Compounding is strongest (organic ASO, SEO, brand, word of mouth). Rentable is paid UA: check the payback period, not just volume. Borrowed is weakest (UGC, viral loops, influencer- and algorithm-driven growth, a single creator, a store feature): discount it heavily and ask what happens if it stops tomorrow. Buyers differ on the organic and paid balance (cited preferences run from 100% organic through 50/50 to 75/25 paid/organic), so a defensible mix beats a dogmatic one. The same compounding-over-rented idea from the planning side is in [marketing-plan SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-plan/SKILL.md).
- **Concentration** (TTM top-segment share by `store`, `country`, `product_id`): iOS-only is common and a mild discount; one country above about 70% of revenue is a real cap; one product above about 70% means the business rests on one price point. Also watch a single traffic source, a single integration and (B2B-shaped) a handful of accounts.
- **Technical infrastructure** (clean architecture, low ops burden, documentation) is most of the transferability score.
- **Raise, but don't bake into the range:** these change the deal rather than the app's position in its band. Strategic or portfolio fit (the best price often comes from the buyer who sees the most synergy); founder involvement (staying through the transition is positive for most buyers, except large studios with in-house teams); deal structure: cash (most common), equity, earnouts. Roughly two-thirds of offers are pure cash; cash deals often pay about 50% at close and the remainder over 6 to 12 months.

## Range and confidence

- **Present:** the named profit base × the low multiple to × the high multiple, the position and why, and the confidence.
- **Low confidence:** thin or lumpy data, conflicting factors, several unverifiable user-supplied inputs, a large non-recurring share. **Higher:** 12+ clean months, low churn, a completed renewal cycle, diversified revenue.
- **A wide, honest range beats a tight one you cannot defend.** Market sizing for a marketing plan applies the same principle: every estimate a range with its assumptions, method, confidence label and the one assumption to test ([marketing-plan MARKET-SIZING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-plan/MARKET-SIZING.md#the-presentation-rule)), and spend judged as an investment ([marketing-plan SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-plan/SKILL.md#marketing-as-investing)).

## Grounding in RevenueCat data

- **Pull** (see [CHARTS-AND-METRICS.md](CHARTS-AND-METRICS.md)): proceeds (TTM and by quarter), subscription retention by cohort, monthly churn, trial and paying conversion, ARPU, annual-vs-monthly plan mix, realized LTV, and proceeds by store, country and product.
- **`get-benchmarks` categories:** realized LTV, trial conversion, initial conversion, conversion to paying, monthly churn, refund rate. Read the percentiles into the scorecard. The two sources differ here: the valuation method scores retention from the monthly-churn benchmark, while the charts method says the Churn chart blends periods and is hard to interpret or benchmark (see [CHARTS-AND-METRICS.md](CHARTS-AND-METRICS.md#retention)).
- **No acquisition-cost data:** RevenueCat cannot compute CAC, LTV/CAC or payback period on its own. Give no CAC-based number without user data. When the app sells through a marketplace that takes a recurring fee, the fee belongs in contribution margin and payback, not in upfront CAC, and is never counted twice ([coreyhaines31/marketingskills, co-marketing]; worked example in [partnerships PARTNERSHIP-TYPES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/partnerships/PARTNERSHIP-TYPES.md)).
- **Link the charts** (MRR, churn, subscription retention) so the user can see the inputs behind the estimate.
- **Ask once, together, for the non-RevenueCat inputs:** operating costs: servers, support, tooling, UA (profit base); founder and team hours and who is paid (add-backs, replacement cost); ad revenue by network (non-recurring streams); channel split, UA spend and payback (distribution); ops burden, documentation and transferability (transferability, hard caps).

## Selling an app

- **Transfer:** most App Store apps can transfer between developer accounts. Some cannot (conflicting in-app-purchase product IDs, some sandboxed Mac apps, Apple Arcade apps); then the whole developer account transfers. Point to Apple's app-transfer criteria.
- **Prepare:** clean, reconciled financials; a retention and growth story; tidy metrics; a low-friction product and infrastructure; handover documentation.
- **Buyers:** marketplaces and brokers (for example Flippa, AppFlip, App Business Brokers) and direct acquirers. Warm intros outperform cold outreach. Lawful cold outreach is [cold-outreach SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cold-outreach/SKILL.md).
- **Negotiating:** the first offer often lowballs; recommend independent legal and financial advice.
- **Cite the RevenueCat posts for their figures** (the two bands, retention ranges, channel-preference splits, deal-structure figures): "How to sell your mobile app" (https://www.revenuecat.com/blog/growth/how-to-sell-an-app/) and "What app buyers really want: insights from 10 leading acquirers" (https://www.revenuecat.com/blog/growth/guide-to-selling-apps/). The factor scorecard, concentration thresholds, add-back treatment and non-recurring revenue handling are general market practice, not RevenueCat findings: present them as how a buyer reasons and don't cite a RevenueCat post for them.
- **For more:** fetch those posts, search the RevenueCat blog and the State of Subscription Apps report, and benchmark peers with `get-benchmarks`.

## Prove it

- **One forecast script:** the projection is a single script where churn is `due[m] * (1 - rate)`, `due` comes from a `subscription_status` pull with `segment="expiration_month"`, `selectors="{\"measure\": \"mrr\"}"` and a high `limit_num_segments`, and no line computes `annual_base / 12`, a blended churn rate or a fit on net movement.
- **Rates traced:** every rate literal in the script appears in a prior Subscription Retention or Cohort Explorer output, not Set-to-Renew %.
- **Gap shown, not used:** month-1 modeled churn versus observed is printed as a diagnostic, and the headline stays the renewal-due result.
- **Run-rates:** today is excluded (or said to be), two methods are triangulated, and the answer gives a range in the chat.
- **Scenarios:** each case names its differing driver, a central case is committed to, and "N months out" names its end month.
- **Valuation:** the answer names its profit base (post-hire by default), starts from `revenue` with `revenue_type` = `proceeds` on TTM figures, applies the band the mature gate allows (and says which gate check failed if any), shows the scorecard with `get-benchmarks` buckets, and gives a range with a confidence level.
- **No revenue multiple and no CAC figure** appear unless the user supplied costs or acquisition data.
