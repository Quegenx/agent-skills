# Pipeline, deal desk, data hygiene and metrics

Pipeline stages and their hygiene, when deals need a deal desk, keeping CRM data clean, and the revenue metrics and dashboards. From coreyhaines31/marketingskills, skill `revops` (SKILL.md, MIT). The benchmarks in the source carry no citation; they are written here as "the source's benchmark", for orientation, not as targets.

**Contents:** [Pipeline stages](#pipeline-stages) · [Stage hygiene](#stage-hygiene) · [Deal desk](#deal-desk) · [Data hygiene](#data-hygiene) · [Metrics](#metrics) · [Dashboards](#dashboards) · [Prove it](#prove-it)

## Pipeline stages

[coreyhaines31/marketingskills, revops]

| Stage | Required fields | Exit criteria |
|---|---|---|
| **Qualified** | Contact info, company, source, fit score | Discovery call scheduled |
| **Discovery** | Pain points, current solution, timeline | Needs confirmed, demo scheduled |
| **Demo/Evaluation** | Technical requirements, decision makers | Positive evaluation, proposal requested |
| **Proposal** | Pricing, terms, stakeholder map | Proposal delivered and reviewed |
| **Negotiation** | Redlines, approval chain, close date | Terms agreed, contract sent |
| **Closed Won** | Signed contract, payment terms | Handoff to CS complete |
| **Closed Lost** | Loss reason, competitor (if any) | Post-mortem logged |

Closed-lost reasons feed win-loss analysis, which treats a one-word CRM reason as low-confidence ([sales-enablement WIN-LOSS-ANALYSIS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sales-enablement/WIN-LOSS-ANALYSIS.md)).

## Stage hygiene

[coreyhaines31/marketingskills, revops]

- **Required fields per stage:** don't let reps advance a deal without filling in required data.
- **Stale deal alerts:** flag deals that sit in a stage beyond the average time (e.g., 2x average days). The source's per-stage stale thresholds: Discovery 14 days, Proposal 10 days, Negotiation 21 days.
- **Stage skip detection:** alert when deals jump stages (Qualified → Proposal skipping Discovery).
- **Close date discipline:** push dates must include a reason; "no silent pushes". A close date pushed 2+ times triggers a forecast review ([LIFECYCLE.md](LIFECYCLE.md#slas)).

| Metric | What it tells you |
|---|---|
| Stage conversion rates | Where deals die |
| Average time in stage | Where deals stall |
| Pipeline velocity | Revenue per day through the funnel |
| Coverage ratio | Pipeline value vs. quota (the source's target: 3-4x) |
| Win rate by source | Which channels produce real revenue |

## Deal desk

[coreyhaines31/marketingskills, revops] When you need one:

- ACV above $25K (or your threshold for non-standard deals).
- Non-standard payment terms (net-90, quarterly billing).
- Multi-year contracts with custom pricing.
- Volume discounts beyond published tiers.
- Custom legal terms or SLAs.

| Deal | Approval required |
|---|---|
| Standard pricing | Auto-approved |
| 10-20% discount | Sales manager |
| 20-40% discount | VP Sales |
| 40%+ discount or custom terms | Deal desk review |
| Multi-year / enterprise | Finance + Legal |

Document every exception. Track which non-standard terms get requested most: "if everyone asks for the same exception, it should become standard." Review quarterly. Published tiers and discount policy are in [pricing-strategy SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/pricing-strategy/SKILL.md); prices and coupons in billing are in [stripe BILLING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/BILLING.md).

## Data hygiene

[coreyhaines31/marketingskills, revops]

Dedup:

- **Matching rules:** email domain + company name + phone as primary match keys.
- **Merge priority:** the CRM record wins over marketing automation; the most recent activity wins for fields.
- **Scheduled dedup:** weekly automated dedup with manual review for edge cases.

Required fields: enforce them at each lifecycle stage; block stage advancement if they are empty; use progressive profiling: don't require everything up front.

Quarterly audit:

- Review and merge duplicates.
- Validate email deliverability on stale contacts.
- Archive contacts with no activity in 12+ months.
- Audit lifecycle stage distribution (look for bottlenecks).
- Verify enrichment data accuracy on a sample set.

Two rules on inactivity, for different objects. The source archives CRM contacts after 12+ months with no activity. The email rule in this repo is stricter for sending: "**Inactive** means no opens or clicks in 45 to 90 days", followed by a re-engagement email and removal of non-responders ([email-practices LISTS-AND-CAPTURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/LISTS-AND-CAPTURE.md#hygiene-and-re-engagement)). Both hold: a contact can stay in the CRM for a year while it has already left the active mailing list.

The source's enrichment vendor table (Clay, Apollo, ZoomInfo) is left out as vendor opinion.

## Metrics

[coreyhaines31/marketingskills, revops]

| Metric | Formula / definition | The source's benchmark |
|---|---|---|
| Lead-to-MQL rate | MQLs / total leads | 5-15% |
| MQL-to-SQL rate | SQLs / MQLs | 30-50% |
| SQL-to-Opportunity | Opportunities / SQLs | 50-70% |
| Pipeline velocity | (# deals x avg deal size x win rate) / avg sales cycle | Varies by ACV |
| CAC | Total sales + marketing spend / new customers | LTV:CAC > 3:1 |
| LTV:CAC ratio | Customer lifetime value / CAC | 3:1 to 5:1 "healthy" |
| Speed-to-lead | Time from form fill to first rep contact | "< 5 minutes ideal" |
| Win rate | Closed-won / total opportunities | 20-30% (varies) |

Where the inputs come from: one PostHog project for site and app gives "full journeys, channel attribution, CAC and LTV" ([posthog EVENTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/EVENTS.md)); Stripe revenue metrics are in [stripe REVENUE-METRICS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/REVENUE-METRICS.md), and RevenueCat "cannot compute CAC, LTV/CAC or payback period on its own" ([revenuecat FORECASTING-AND-VALUATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/FORECASTING-AND-VALUATION.md)). Which touches get credit for a deal is [marketing-attribution SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-attribution/SKILL.md).

## Dashboards

[coreyhaines31/marketingskills, revops] Three views:

1. **Marketing:** lead volume, MQL rate, source attribution, cost per MQL.
2. **Sales:** pipeline value, stage conversion, velocity, forecast accuracy.
3. **Executive:** CAC, LTV:CAC, revenue vs. target, pipeline coverage.

Building them in PostHog: [posthog INSIGHTS-AND-DASHBOARDS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/INSIGHTS-AND-DASHBOARDS.md).

## Prove it

Every pipeline stage has required fields that block advancement when empty; a deal past 2x the stage average is flagged; a skipped stage alerts; every close-date push has a reason; Closed Lost requires a loss reason and the competitor; discounts route to the approval tier in the table; duplicates are merged weekly with CRM data winning; the quarterly audit ran; every benchmark shown on a dashboard is labelled with its source or replaced by the team's own baseline.
