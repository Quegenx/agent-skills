# B2B paid acquisition and ABM

Cross-platform rules for B2B, where sales cycles run 2 to 24 months, in-platform conversions mislead, and lead quality matters more than lead cost; then account-based marketing with ads. From [coreyhaines31/marketingskills, ads, b2b-paid-playbook.md and abm-playbook.md] (MIT; both credit Ivan Falco's ads-skills, and the thresholds are practitioner starting points to recalibrate on your own first 30 days). Platform detail: [GOOGLE-SEARCH.md](GOOGLE-SEARCH.md), [META-WEB-ADS.md](META-WEB-ADS.md), [LINKEDIN-ADS.md](LINKEDIN-ADS.md). CRM-side lead scoring and routing: [revops](../revops/SKILL.md).

**Contents:** [The demand lifecycle](#the-demand-lifecycle) · [Budget by stage](#budget-by-stage) · [Leading vs lagging signals](#leading-vs-lagging-signals) · [Breakeven CPL and CPC](#breakeven-cpl-and-cpc) · [Kill heuristics](#kill-heuristics) · [The optimize-to-quality trap](#the-optimize-to-quality-trap) · [Lead quality scoring](#lead-quality-scoring) · [The scaling quadrant](#the-scaling-quadrant) · [Measurement maturity](#measurement-maturity) · [Channel selection](#channel-selection) · [When ABM](#when-abm) · [LinkedIn ABM](#linkedin-abm) · [ABM on Meta](#abm-on-meta) · [Acceleration campaigns](#acceleration-campaigns) · [Cross-channel orchestration](#cross-channel-orchestration) · [Cross-channel UTM remarketing](#cross-channel-utm-remarketing) · [Sales follow-up](#sales-follow-up) · [Measuring ABM](#measuring-abm) · [Prove it](#prove-it)

## The demand lifecycle

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

| Stage | Budget | Time to ROI | Difficulty |
|---|---|---|---|
| Create | High | 90+ days | High (needs strong content and POV) |
| Capture | Moderate | Under 45 days | High (expensive, competitive) |
| Accelerate/Activate | Low | Tracks the sales cycle | Low |
| Revive | Low | Under 45 days | Low |
| Expand | Low | Under 60 days | Medium (small audiences) |

Product-led skews budget to Create and Capture; sales-led with a small TAM to Create and Accelerate. The stage with the most pipeline doesn't automatically deserve the most budget: fund where pipeline share exceeds budget share and the audience is under-penetrated.

## Leading vs lagging signals

- **Leading** (moves within a month; optimize on these): CTR, engagement, CPL, cost per qualified lead, accounts reached.
- **Lagging** (moves over months; the truth, reviewed monthly or quarterly): pipe-to-spend, influenced revenue, time to close, expansion revenue.

A leading metric worth optimizing demonstrably correlates with a lagging one, and is measurable, moveable, not an average, and hard to game. CPL falling while pipeline doesn't move means the proxy broke: fix the proxy, not the ads.

## Breakeven CPL and CPC

Derive targets from deal math, not platform benchmarks:

- **Breakeven CPL** = average deal size × lead-to-close rate ($3,000 ACV × 10% = $300).
- **Breakeven CPC** = target CPL × landing page conversion rate ($300 × 5% = $15).

Set the target below breakeven by your required margin. This is the B2B form of app-growth's "Break-even CPA = LTV × (1 − store fee %)" ([BUDGET-AND-ROAS.md](../../mobile/app-growth/BUDGET-AND-ROAS.md#campaign-profitability)); how long the cash is tied up is in [PAYBACK.md](PAYBACK.md).

## Kill heuristics

The source states two rules to remove emotion from pausing:

- **Non-performer** (new ads): pause once an ad has spent **2 to 3× target CPL with zero conversions** ($300 target → $600 to 900).
- **Maintenance** (ads past ~7 to 14 days): pause when CPL runs **1.5 to 2× target** ($450 to 600).

In its words, "These aren't statistically rigorous": they're repeatable and cheap. Its own guardrail file says no fixed kill rule decides alone, so gate both with sample size, conversion lag and learning state ([AUDIT-GUARDRAILS.md](AUDIT-GUARDRAILS.md#recommendation-safety)), and never pause a producer without a replacement staged ([META-WEB-ADS.md](META-WEB-ADS.md#swap-rules)).

## The optimize-to-quality trap

Smart bidding optimizes toward whatever you call a conversion; fed raw form fills it buys cheap junk, and CPL improves while pipeline dies. In order:

1. **Close the offline conversion loop:** push CRM stage changes (MQL → SQL → opportunity → closed-won) back to the platforms: GCLID and offline import on Google, Conversions API lifecycle events on Meta, the Conversions API on LinkedIn ([CONVERSION-TRACKING-WEB.md](CONVERSION-TRACKING-WEB.md)). The source calls this the single highest-impact move in a B2B account.
2. **Value conversions differently:** a demo request is not an ebook download.
3. **Until offline data flows, a human reads lead quality weekly:** titles and companies, not just CPL.

Reconcile platform conversions against the CRM monthly; when they disagree, the CRM wins.

## Lead quality scoring

The platform can't see quality; score it yourself and rank ads by it:

- **Urgency** (0 to 3): 0 browsing → 3 burning need with a timeline
- **Budget** (0 to 3): 0 none or no authority → 3 approved
- **Fit** (0 to 3): 0 not ICP → 3 perfect ICP

Whoever runs sales calls scores each lead (max 9) against its originating ad. After ~20 scored calls, rank ads by average score, not CPL or CTR; the best-CPL ad is often the one producing 3/9 leads. Scale high scorers; kill variations averaging below ~5.

## The scaling quadrant

| | Low effort | High effort |
|---|---|---|
| **High budget** | Audiences: bigger audiences, more segments, more frequency | Geography: new countries and regions (localization) |
| **Low budget** | Ads: new creative, angles, formats | Objectives and bids: change objective or bid strategy to buy cheaper |

Budget but no time → the top row; capped on budget → the bottom row (better creative and cheaper bidding free up money).

## Measurement maturity

Before scaling, score 1 to 3 each: a blended pipeline dashboard; a per-channel dashboard; conversion tracking (1 none, 2 pixel only, 3 offline conversions flowing); web analytics; a documented, agreed attribution process ([marketing-attribution](../marketing-attribution/SKILL.md)). Under ~6/15, fix visibility before adding budget, lowest score first.

## Channel selection

Five families: paid social, paid search, **paid review listings** (G2, Capterra, Software Advice; often skipped, high intent), programmatic (display, audio, CTV, native) and sponsorships (newsletters, podcasts, events, creators: [creator-marketing](../creator-marketing/SKILL.md)). Judge each on whether it can target your ICP, media cost, reach at your targeting, and its policy for your industry. Before committing, run a ~$100 test to learn the real CPC and CPM for your targeting; the source says platform estimates and published benchmarks are consistently wrong for specific ICPs.

## When ABM

ABM ads are a pipeline-influence motion, not lead gen; measure accordingly. Run paid ABM when the target account list is ≥ ~1,000 companies (or you accept 1:1 or 1:few economics), deals are ~$25K+, cycles 60+ days, sales and marketing agree on the list, and (for Meta) contact enrichment is available. Skip it with a list under ~500 and no enrichment, no first-party data, under ~$3K a month, or a short transactional cycle.

## LinkedIn ABM

- **1:1:** the company by name, creative personalized for one account. **1:few:** up to ~10 to 20 accounts per campaign with a shared pain or industry angle. **1:many:** an uploaded list or native targeting, scaled creative.
- **Lists:** "300 matched members minimum" to serve, which matches LinkedIn's minimum ad set audience of 300 member accounts (https://www.linkedin.com/help/lms/answer/a424655). Aim for 1,000+ rows (duplicate company names are fine; it dedupes on match). Contact lists match best at scale (the source says LinkedIn suggests ~10K emails); company lists beat contact lists for most teams. Cold ABM audiences need ~15K members to deliver reliably.
- **Segment mixed lists:** as one audience, LinkedIn over-serves the largest enterprises (the source reports accounts stuck at 15% list coverage); split into enterprise, mid-market and SMB bands with separate campaigns and budgets. Use the per-company engagement report to find under-served priority accounts and break them out.
- **Account pages:** send 1:1 and 1:few clicks to a page built for that account or segment, through a personalization layer on the site, a CMS template fed from a list, a dynamic route reading the CRM or a sheet, or an AI site platform. Keep account pages `noindex` and out of the sitemap, use only public or first-party facts about the account, and have a human review before anything publishes.
- **Personalized creative:** the source says the account's name or logo in the creative can lift CTR ~5 to 10×, and that you should not run company-name or logo-personalized ads into Germany, calling it "privacy law, not platform policy". It cites no statute: treat it as a practitioner claim, not law.
- **Frequency cap** ~3 impressions per person per week in priority accounts: build a company-engagement audience of accounts past ~500 impressions in 7 days and add it as an exclusion, so accounts rotate out as they cool (300 if fatigue shows, 750 for more pressure).

## ABM on Meta

Meta has no company targeting; bring your own matched audience.

- **Match rates:** raw work emails match under ~5% on Meta; identity-graph enrichment providers raise that to ~40 to 85% (practitioner). Uploading enriched personal data needs a lawful basis and notice under GDPR (Art. 6) and the advertiser's right to use the data under Meta's Custom Audience terms; record the basis before uploading, and route the consent and privacy side through [email-practices COMPLIANCE.md](../../backend/email-practices/COMPLIANCE.md). Workflow: firmographic criteria → identity match → Custom Audience → target directly or seed a 1% lookalike.
- **Sizes:** account-list audiences ~1,000 companies (5 to 10K optimal); retargeting slices down to ~100 accounts; lookalike seeds 500+.
- **Advantage+ won't stay locked to a list:** run ABM manual, or hybrid (manual for the list, Advantage+ for the broad layer).
- Meta's ABM role is cheap air cover and reaching the buying committee beyond the champion, while LinkedIn does precision.

## Acceleration campaigns

Ads aimed at accounts already in pipeline, to speed deals rather than source them: segment the CRM by stage (evaluation, proposal, negotiation), filter to deals worth the spend, upload as an audience, refresh weekly. Use an **awareness or reach objective, not conversions**: you're keeping the vendor in front of the committee, not asking for a demo they already booked. Creative: case studies, proof and objection handlers matched to stage; the source spends $100 to 200 a day on larger open deals and a maintenance dose on stalled ones.

## Cross-channel orchestration

The source's default B2B ABM split: ~60% LinkedIn / ~30% Meta / ~10% other. LinkedIn buys precision at $40 to 70 CPMs, Meta presence and committee reach at $10 to 25. Sequence LinkedIn first to validate the audience, then extend to Meta.

## Cross-channel UTM remarketing

Retarget one platform's validated clickers on another:

1. Tag all paid traffic with consistent UTMs (`utm_source=linkedin`, `utm_source=google&utm_medium=cpc`).
2. On Meta, build a website Custom Audience with the rule **"URL contains `utm_source=linkedin`"** (or `utm_source=google`).
3. Retarget it on Meta: LinkedIn-grade audience quality at Meta-grade CPMs (the source says 50 to 70% cheaper reach).

It works in reverse (search clickers → LinkedIn), which the source says pays above roughly $30K a month search spend. It needs enough source traffic to clear minimum audience sizes; keep a consistent account or campaign token in the UTMs so attribution survives the hop. UTM conventions: [marketing-attribution](../marketing-attribution/SKILL.md).

## Sales follow-up

ABM ads without sales follow-up are billboard spend. Pipe engagement signals to the CRM and treat a spike as a sales trigger, with outreach within ~48 hours; post new leads to a shared channel with a per-campaign quality reaction as the cheapest feedback loop; hold a monthly sales and marketing session on the list itself (who engages, who's dark, who closed) and re-cut it. The source expects ~7 to 10 cross-channel touches before a sales conversation. Outreach itself: [cold-outreach](../cold-outreach/SKILL.md).

## Measuring ABM

Judge account movement, not CPL: account penetration ~40 to 60% of the list; cost per engaged account ~$100 to 300; account → opportunity ~10 to 20%; pipeline influenced 3 to 5× spend. **Incrementality:** hold out ~20% of the list from ads and compare pipeline formation after 21+ days, the only honest answer to "did the ads do anything?"

## Prove it

A B2B plan derives its CPL and CPC targets from deal size, close rate and page conversion; names leading metrics that track a lagging one; feeds CRM stages back to each platform; ranks ads by U/B/F score after ~20 calls; and an ABM plan states list size, deal size and cycle against the go/no-go, segments mixed lists, keeps account pages `noindex`, records the lawful basis for any enriched upload, and holds out part of the list.
