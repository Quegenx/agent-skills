# B2B paid acquisition

Cross-platform rules for B2B, where sales cycles run 2 to 24 months, in-platform conversions mislead, and lead quality matters more than lead cost. From [coreyhaines31/marketingskills, ads, b2b-paid-playbook.md] (MIT; it credits Ivan Falco's ads-skills, and the thresholds are practitioner starting points to recalibrate on your own first 30 days). Platform detail: [GOOGLE-SEARCH.md](GOOGLE-SEARCH.md), [META-WEB-ADS.md](META-WEB-ADS.md), [LINKEDIN-ADS.md](LINKEDIN-ADS.md). CRM-side lead scoring and routing: [revops](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/revops/SKILL.md).

**Contents:** [The demand lifecycle](#the-demand-lifecycle) · [Budget by stage](#budget-by-stage) · [Leading vs lagging signals](#leading-vs-lagging-signals) · [Breakeven CPL and CPC](#breakeven-cpl-and-cpc) · [Kill heuristics](#kill-heuristics) · [The optimize-to-quality trap](#the-optimize-to-quality-trap) · [Lead quality scoring](#lead-quality-scoring) · [The scaling quadrant](#the-scaling-quadrant) · [Measurement maturity](#measurement-maturity) · [Channel selection](#channel-selection) · [Prove it](#prove-it)

## The demand lifecycle

[coreyhaines31/marketingskills, ads, b2b-paid-playbook.md]

The funnel stops at conversion; B2B revenue doesn't. Closed-lost deals, open pipeline and customers are all reachable with ads:

| Stage | Outcome | Buyer awareness | Typical offers | KPIs |
|---|---|---|---|---|
| **Create** | Build affinity and trust | Unaware, problem-aware | Educational content, POV | Cost per consumption, blended cost per opp |
| **Capture** | Convert in-market buyers | Solution, product-aware | Demos, trials | Pipe-to-spend, direct cost per opp |
| **Accelerate** (sales-led) / **Activate** (product-led) | Close open deals faster, convert free users | Product, offer-aware | Case studies, webinars, events | Pipeline velocity, paid signups |
| **Revive** | Restart closed-lost | Offer-aware | Incentivized demos, guided trials | SQOs created, cost per SQO |
| **Expand** | Grow existing accounts | Most aware | Referral programs, new-feature content | Expansion revenue, influenced SQOs |

Build bottom-up for the fastest return: Expand → Revive → Accelerate/Activate → Capture → Create. The bottom stages are cheap, small and quick to pay back; Create is the biggest and slowest.

## Budget by stage

[coreyhaines31/marketingskills, ads, b2b-paid-playbook.md]

| Stage | Budget | Time to ROI | Difficulty |
|---|---|---|---|
| Create | High | 90+ days | High (needs strong content and POV) |
| Capture | Moderate | Under 45 days | High (expensive, competitive) |
| Accelerate/Activate | Low | Tracks the sales cycle | Low |
| Revive | Low | Under 45 days | Low |
| Expand | Low | Under 60 days | Medium (small audiences) |

Product-led skews budget to Create and Capture; sales-led with a small TAM to Create and Accelerate. The stage with the most pipeline doesn't automatically deserve the most budget: fund where pipeline share exceeds budget share and the audience is under-penetrated.

## Leading vs lagging signals

[coreyhaines31/marketingskills, ads, b2b-paid-playbook.md]

- **Leading** (moves within a month; optimize on these): CTR, engagement, CPL, cost per qualified lead, accounts reached.
- **Lagging** (moves over months; the truth, reviewed monthly or quarterly): pipe-to-spend, influenced revenue, time to close, expansion revenue.

A leading metric worth optimizing demonstrably correlates with a lagging one, and is measurable, moveable, not an average, and hard to game. CPL falling while pipeline doesn't move means the proxy broke: fix the proxy, not the ads.

## Breakeven CPL and CPC

[coreyhaines31/marketingskills, ads, b2b-paid-playbook.md]

Derive targets from deal math, not platform benchmarks:

- **Breakeven CPL** = average deal size × lead-to-close rate ($3,000 ACV × 10% = $300).
- **Breakeven CPC** = target CPL × landing page conversion rate ($300 × 5% = $15).

Set the target below breakeven by your required margin. This is the B2B form of app-growth's "Break-even CPA = LTV × (1 − store fee %)" ([app-growth BUDGET-AND-ROAS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/BUDGET-AND-ROAS.md#campaign-profitability)); how long the cash is tied up is in [PAYBACK.md](PAYBACK.md).

## Kill heuristics

[coreyhaines31/marketingskills, ads, b2b-paid-playbook.md]

The source states two rules to remove emotion from pausing:

- **Non-performer** (new ads): pause once an ad has spent **2 to 3× target CPL with zero conversions** ($300 target → $600 to 900).
- **Maintenance** (ads past ~7 to 14 days): pause when CPL runs **1.5 to 2× target** ($450 to 600).

In its words, "These aren't statistically rigorous": they're repeatable and cheap. Its own guardrail file says no fixed kill rule decides alone, so gate both with sample size, conversion lag and learning state ([AUDIT-GUARDRAILS.md](AUDIT-GUARDRAILS.md#recommendation-safety)), and never pause a producer without a replacement staged ([META-WEB-ADS.md](META-WEB-ADS.md#swap-rules)).

## The optimize-to-quality trap

[coreyhaines31/marketingskills, ads, b2b-paid-playbook.md]

Smart bidding optimizes toward whatever you call a conversion; fed raw form fills it buys cheap junk, and CPL improves while pipeline dies. In order:

1. **Close the offline conversion loop:** push CRM stage changes (MQL → SQL → opportunity → closed-won) back to the platforms: GCLID and offline import on Google, Conversions API lifecycle events on Meta, the Conversions API on LinkedIn ([CONVERSION-TRACKING-WEB.md](CONVERSION-TRACKING-WEB.md)). The source calls this the single highest-impact move in a B2B account.
2. **Value conversions differently:** a demo request is not an ebook download.
3. **Until offline data flows, a human reads lead quality weekly:** titles and companies, not just CPL.

Reconcile platform conversions against the CRM monthly; when they disagree, the CRM wins.

## Lead quality scoring

[coreyhaines31/marketingskills, ads, b2b-paid-playbook.md]

The platform can't see quality; score it yourself and rank ads by it:

- **Urgency** (0 to 3): 0 browsing → 3 burning need with a timeline
- **Budget** (0 to 3): 0 none or no authority → 3 approved
- **Fit** (0 to 3): 0 not ICP → 3 perfect ICP

Whoever runs sales calls scores each lead (max 9) against its originating ad. After ~20 scored calls, rank ads by average score, not CPL or CTR; the best-CPL ad is often the one producing 3/9 leads. Scale high scorers; kill variations averaging below ~5.

## The scaling quadrant

[coreyhaines31/marketingskills, ads, b2b-paid-playbook.md]

| | Low effort | High effort |
|---|---|---|
| **High budget** | Audiences: bigger audiences, more segments, more frequency | Geography: new countries and regions (localization) |
| **Low budget** | Ads: new creative, angles, formats | Objectives and bids: change objective or bid strategy to buy cheaper |

Budget but no time → the top row; capped on budget → the bottom row (better creative and cheaper bidding free up money).

## Measurement maturity

[coreyhaines31/marketingskills, ads, b2b-paid-playbook.md]

Before scaling, score 1 to 3 each: a blended pipeline dashboard; a per-channel dashboard; conversion tracking (1 none, 2 pixel only, 3 offline conversions flowing); web analytics; a documented, agreed attribution process ([marketing-attribution](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-attribution/SKILL.md)). Under ~6/15, fix visibility before adding budget, lowest score first.

## Channel selection

[coreyhaines31/marketingskills, ads, b2b-paid-playbook.md]

Five families: paid social, paid search, **paid review listings** (G2, Capterra, Software Advice; often skipped, high intent), programmatic (display, audio, CTV, native) and sponsorships (newsletters, podcasts, events, creators: [creator-marketing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/creator-marketing/SKILL.md)). Judge each on whether it can target your ICP, media cost, reach at your targeting, and its policy for your industry. Before committing, run a ~$100 test to learn the real CPC and CPM for your targeting; the source says platform estimates and published benchmarks are consistently wrong for specific ICPs.

Paid ABM list, account-page and cross-channel workflows are in [ABM.md](ABM.md).

## Prove it

[coreyhaines31/marketingskills, ads, b2b-paid-playbook.md]

A B2B plan derives its CPL and CPC targets from deal size, close rate and page conversion; names leading metrics that track a lagging one; feeds CRM stages back to each platform; ranks ads by U/B/F score after ~20 calls.

For an account-based plan, also complete [the ABM checks](ABM.md#prove-it). [coreyhaines31/marketingskills, ads, abm-playbook.md]
