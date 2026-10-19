# LinkedIn ads

Operating rules for LinkedIn: bidding, audience sizing, scaling triggers, benchmarks and format tactics. LinkedIn is the precision channel, the highest-quality B2B targeting at the highest cost, so the discipline is about not wasting that precision. From [coreyhaines31/marketingskills, ads, linkedin-b2b-playbook.md] (MIT; it credits Ivan Falco's ads-skills, and its benchmarks are practitioner). LinkedIn's help pages are quoted with URLs where they confirm or correct the source. ABM on LinkedIn is in [ABM.md](ABM.md#linkedin-abm).

**Contents:** [Bidding](#bidding) · [Audience sizing](#audience-sizing) · [Functions vs titles](#functions-vs-titles) · [Splitting audiences](#splitting-audiences) · [Penetration-based scaling](#penetration-based-scaling) · [Benchmarks](#benchmarks) · [Thought leader ads](#thought-leader-ads) · [Build order](#build-order) · [Formats](#formats) · [Retargeting starts when the audience exists](#retargeting-starts-when-the-audience-exists) · [Audit shortlist](#audit-shortlist) · [Prove it](#prove-it)

## Bidding

1. **Week 1:** automated bidding or maximum delivery; don't touch it, you're buying CPC data.
2. **Week 2+:** manual CPC about 20% below the average CPC the automated phase produced; the source says this cuts CPC without killing delivery.
3. **Exceptions:** small retargeting and ABM audiences stay automated (manual underdelivers on small pools); reset to automated for a week after changing objective; audiences under ~10K may never spend their budget at any bid.

The source says LinkedIn's ad day resets at UTC midnight (not checked against LinkedIn's help) and that professional activity peaks weekday mornings to early afternoon in the audience's time zone, so dayparting there stretches a small budget.

## Audience sizing

- **Cold prospecting:** 50K to 300K members, minimum ~15K per cold campaign (practitioner).
- **Too narrow:** hyper-narrow audiences spike CPMs several-fold and stall; if it isn't spending, the audience is usually too small, not the bid too low.
- **Tiny TAM (under ~30K addressable):** skip the top and bottom split; run one campaign that saturates the whole audience with every funnel layer.
- **Retargeting:** roughly 1K to 5K per segment (site visitors, 50%+ video viewers) works; the source says below ~300 won't deliver. LinkedIn: "The minimum audience size required to run an ad set is 300 member accounts" (https://www.linkedin.com/help/lms/answer/a424655), and video audiences "need to match at least 300 member accounts" (https://www.linkedin.com/help/lms/answer/122355).

## Functions vs titles

Title targeting is precise but small and expensive. **Job function + seniority** typically triples the addressable audience at cheaper reach with similar engagement, at the cost of a weekly negative-title pass for the first ~2 months (exclude irrelevant titles as they appear in demographics, like negative keywords).

- The source says "Job-title targeting and seniority targeting are mutually exclusive"; LinkedIn's targeting page describes Job Title, Function and Seniority as separate Job Experience facets and doesn't say this (https://www.linkedin.com/help/lms/answer/a424655). Unverified: check in Campaign Manager before planning around it.
- The **Business Development** function includes many CEOs, CMOs and managing directors; filter with seniority exclusions rather than excluding the function when you sell to the C-suite.
- Leave **Audience Expansion off** (the source says it spends a meaningful share on out-of-ICP members) and **Audience Network off** for B2B lead gen. LinkedIn's targeting page now also describes auto-targeting and predictive audiences, so the setting names may have changed; check the current campaign settings.

## Splitting audiences

Priority: **intent > persona > region or company size > seniority.**

- **Region:** keep the US separate (the most expensive market eats a shared budget). DACH needs localized ads; the UK, Canada and Australia group fine; the Nordics and the Netherlands run fine in English. Never group an expensive market with small ones.
- **Company size:** segment by employee count, not revenue (LinkedIn's revenue data is estimated); start with two bands. Unsegmented, LinkedIn over-serves the smallest and largest companies and underserves mid-market.

## Penetration-based scaling

Penetration (reached ÷ audience size) is the trigger, not spend:

- 30-day penetration **under 25%** → room to raise budget.
- **25 to 35%** → hold.
- **~35%+** → healthy saturation; scale horizontally (new audiences), not vertically.
- Doubling budget grows penetration ~50 to 70%, not 100%.
- One campaign at 35%+ beats three at 12% each; consolidate before multiplying.
- **Spend up, reach flat (frequency climbing):** competitors outbid you or ad quality drags your price. Strong ads → raise budget or bids; weak ads → fix creative first.

## Benchmarks

For engagement and thought-leader campaigns LinkedIn's "CTR" includes social actions; judge traffic on **click-through to landing page (CTRTLP)**.

| Metric | Cold / top | Middle | Bottom / retargeting |
|---|---|---|---|
| CTRTLP | 0.30 to 0.55% | 0.55 to 0.80% | 0.80 to 1.30% |
| CPM | $33 to 65 typical | | |
| CPC | $8 to 22+ | | lower |
| Cost per lead (Lead Gen Form) | | $50 to 200 | |
| Cost per website form fill | | | $200 to 500 |

Other bars, practitioner: Lead Gen Form fill rate > 8% (below = form too long, offer weak or audience too cold); cost per SQL under ~$500 (enterprise ACVs tolerate $300 to 500+ CPLs, SMB needs $50 to 150); video view rate > 40%, completion 8 to 15% for horizontal; return data lags 3 to 6 months. Recalibrate on your own account ([AUDIT-GUARDRAILS.md](AUDIT-GUARDRAILS.md#benchmark-discipline)).

## Thought leader ads

Ads promoted from a person's profile rather than the company page; the source calls them the platform's biggest efficiency arbitrage:

- TLAs typically deliver ~3 to 6× the CTR of company-page ads at a fraction of the CPC (practitioner).
- Non-employee creator TLAs often beat employee TLAs; the source puts them at 30 to 50% of TLA budget where available. A paid creator's post needs a clear paid-partnership disclosure ([creator-marketing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/creator-marketing/SKILL.md)).
- **Organic first:** posts that reach ~2 to 3% organic CTR are the TLA candidates.
- **The 72-hour edit:** organic reach concentrates in the first ~3 days; let the post run organically, then add the CTA or product mention and promote it.
- Single-image ads face the most auction competition; document, conversation and TLA formats often buy cheaper reach because fewer advertisers use them.

## Build order

The source calls these "campaign groups". LinkedIn renamed campaign groups to campaigns, and campaigns to ad sets, from October 2025 (reported in LinkedIn posts; LinkedIn's help now says "ad set", https://www.linkedin.com/help/lms/answer/a424655). Add them in ROI order, funding each before the next:

1. **Product value** (direct response on the core offer)
2. **Remarketing**
3. **Content** (only content that can't be consumed in-feed; it must earn the click)
4. **Social proof** (case studies, testimonials)
5. **Thought leadership** (slowest payback, last)

Budget optimization across a group tends to favor cheap audiences and video: don't mix enterprise with SMB or static with video in one.

## Formats

- **Document ads:** 1080×1350 portrait (4:5), 5 to 7 slides: hook → pain → shift → solution → differentiators → CTA. The classic mistake is a generic "solution" slide and a "differentiator" slide that repeats it; each slide must add what the previous couldn't. Big standalone stat slides (one number, source small) carry them.
- **Conversation ads:** subject 2 to 4 words; 3 to 5 short lines per message; specific numbers over vague claims; a soft CTA ("see how it works") over "book a demo"; route the main CTA to a Lead Gen Form, not a scheduling link. Benchmarks: 35 to 50%+ open, 2 to 5% CTR.
- **CTV:** Brand Awareness objective only, auto-bid only, ~$50 a day minimum, limited geos; completion metrics mean nothing (forced view); the source says it pays only above roughly $15K a month total spend.

Character limits and image sizes: [ad-creative PLATFORM-SPECS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ad-creative/PLATFORM-SPECS.md#linkedin).

## Retargeting starts when the audience exists

"LinkedIn retargeting audiences only start collecting from the moment you create them." LinkedIn agrees: "Once you set up your website audience in Campaign Manager, your audience will begin to build", and the Insight Tag must be installed "for your website audiences to build" (https://www.linkedin.com/help/lms/answer/a420433). Create every audience you might want (site visitors, video viewers, ad engagers, lead-form openers, company page visitors) before launch. Video audiences use 25, 50, 75 and 97% thresholds (https://www.linkedin.com/help/lms/answer/122355).

Sequence by behavior so each audience sees the next step: saw a founder or creator ad → customer proof; visited the site → the use case matching the page read; watched most of a video → a stronger CTA (trial, demo or Lead Gen Form). Exclude converters. Cross-channel audiences from UTMs: [ABM.md](ABM.md#cross-channel-utm-remarketing).

## Audit shortlist

The most frequent findings, in order: Audience Expansion on · Audience Network on · audiences too small to deliver · fewer than 4 active ads per campaign · campaigns under ~10 results a week (starved; consolidate) · creative 3+ months old · no retargeting audiences created · lead quality never reconciled against the CRM · brand and geo budgets mixed · everything on automated bidding forever. Score each as in [AUDIT-GUARDRAILS.md](AUDIT-GUARDRAILS.md#audit-scoring).

## Prove it

A LinkedIn plan names its audience size per campaign (cold within 50K to 300K, retargeting above LinkedIn's 300-member minimum), creates retargeting audiences before launch, separates the US, uses CTRTLP for engagement campaigns, and uses LinkedIn's current level names; no checklist creates lookalike audiences ([CAMPAIGN-PLANNING.md](CAMPAIGN-PLANNING.md#setup-checklists)).
