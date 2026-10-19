# Attribution models

Attribution models split credit *within* your tracked data; they can't say what would have happened anyway (that is [MEASUREMENT-PARADIGMS.md](MEASUREMENT-PARADIGMS.md)). This file is the model table, what Google still offers, one journey scored six ways and data-driven attribution in plain words, from [coreyhaines31/marketingskills, attribution] (SKILL.md and references/attribution-models.md, MIT). PostHog's first-touch, last-touch and per-step breakdown choice for funnels is [posthog METRICS-MODELING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/METRICS-MODELING.md#conversion).

## The models

[coreyhaines31/marketingskills, attribution] Last non-direct is a last-touch variant (skip the junk drawer), not a separate school of thought.

| Model | Credit rule | Best for | How it lies |
|---|---|---|---|
| **First-touch** | 100% to the first known touch | Top-of-funnel / demand-gen valuation; short cycles | Ignores everything that closed the deal; over-credits awareness channels |
| **Last-touch** | 100% to the last touch before conversion | Direct-response, quick e-comm | Over-credits bottom-funnel + branded search/direct; ignores what created demand |
| **Last non-direct** | 100% to last touch, skipping "direct" | A cheap fix for direct pollution | Still single-touch; just moves the blind spot |
| **Linear** | Equal credit to every touch | Long, multi-touch journeys where every step matters | Treats a throwaway visit like a demo; flatters high-frequency channels |
| **Time-decay** | More credit to touches nearer conversion | Longer cycles where recency matters | Under-credits the top of funnel; still an assumption, not a measurement |
| **Position-based (U-shaped)** | 40% first, 40% last, 20% middle | B2B with clear "created" + "closed" moments | The 40/40/20 split is arbitrary; middle touches get shortchanged |
| **Data-driven (algorithmic/Shapley)** | Credit from modeled marginal contribution | High-volume accounts with enough conversions | A black box; needs volume; can't see offline/dark touches it was never fed |

- **For a long sales cycle, never report a single model in isolation.** Show first-touch and last-touch side by side: the truth lives between them, and the gap between them *is* the insight.
- **The model matters far less than being consistent** and pairing it with an out-of-model sanity check (self-reported attribution, [SKILL.md](SKILL.md#self-reported-attribution)).

## Platform availability

- **GA4:** first click, linear, time decay and position-based are "no longer available as of November 2023". GA4 offers "Data-driven attribution", "Paid and organic last click" and "Google paid channels last click" ([support.google.com/analytics/answer/10596866](https://support.google.com/analytics/answer/10596866)).
- **Google Ads:** the same rule-based models are "no longer supported", and "Conversion actions that used the deprecated attribution models have been upgraded to use data-driven attribution" ([support.google.com/google-ads/answer/6259715](https://support.google.com/google-ads/answer/6259715)).
- The source said "retired ... (2023)" without the month or the automatic upgrade.
- Teach the full table as *concepts* and as models you compute on your own event path, CRM or warehouse, not as Google dropdown options. [coreyhaines31/marketingskills, attribution]

## Data-driven attribution needs volume

- **Google's current wording:** "we recommend having at least 200 conversions and 2,000 ad interactions in supported networks within a 30-day period", and "All conversion actions are eligible for data-driven attribution (DDA), regardless of conversion or interaction volume" ([support.google.com/google-ads/answer/6394265](https://support.google.com/google-ads/answer/6394265)). The source also said Google "historically gated DDA behind ~3,000 ad interactions and ~300 conversions"; that figure is not on the current page.
- [coreyhaines31/marketingskills, attribution] Below that volume DDA often collapses toward last-click priors. On Google or GA4 when thin: prefer last-click (or accept that DDA is close to last-click). Elsewhere (first-party, CRM, warehouse): compute position-based, or first-touch and last-touch side by side.

## One journey, six rules

[coreyhaines31/marketingskills, attribution] A single B2B buyer's path to a $12,000 annual deal, five touches over 38 days:

| # | Day | Touch | Role in the story |
|---|---|---|---|
| T1 | 0 | LinkedIn ad (paid social) | First discovered you; created awareness |
| T2 | 5 | Organic blog post (organic search) | Came back to learn; built interest |
| T3 | 12 | Retargeting ad (paid social) | Nudged back mid-consideration |
| T4 | 30 | Branded search (paid search, branded) | Ready to act; searched your name |
| T5 | 38 | Direct, then demo request (direct) | Converted |

| Touch | Channel | First-touch | Last-touch | Last non-direct | Linear | Time-decay | Position (U) |
|---|---|---|---|---|---|---|---|
| T1 | Paid social | **$12,000** | $0 | $0 | $2,400 | $175 | **$4,800** |
| T2 | Organic | $0 | $0 | $0 | $2,400 | $290 | $800 |
| T3 | Paid social | $0 | $0 | $0 | $2,400 | $575 | $800 |
| T4 | Paid search (branded) | $0 | $0 | **$12,000** | $2,400 | $3,415 | $800 |
| T5 | Direct | $0 | **$12,000** | $0 | $2,400 | **$7,545** | **$4,800** |

Time-decay uses a 7-day half-life, weight = 0.5^(days-before-conversion / 7), normalized: shares of about 1.5% / 2.4% / 4.8% / 28.5% / 62.9% (dollars rounded to sum to $12,000). On a 38-day journey the credit concentrates on the last two touches, which is why time-decay behaves almost like last-touch on long cycles. Position-based is 40/40/20, the 20% split evenly across T2 to T4.

- **First-touch** hands everything to the LinkedIn ad: good for arguing paid social's demand-gen value, blind to what closed it.
- **Last-touch** hands everything to Direct, which is really "we don't know". This is how top-of-funnel gets defunded.
- **Last non-direct** hands it to branded search, but branded search only happened because the LinkedIn ad and blog created the demand.
- **Linear** spreads it evenly: honest that all five mattered, useless for deciding what to cut.
- **Time-decay** favors the recent: reasonable for short cycles, here it under-credits the ad that started everything.
- **Position-based** credits the bookends (discovered and closed): usually the most defensible single model for B2B, because what created a deal and what closed it are the two decisions you actually make.
- **The takeaway:** report first-touch and last-touch side by side. The LinkedIn-vs-Direct gap tells you paid social creates demand that later shows up as direct or branded.

## Data-driven attribution, plainly

[coreyhaines31/marketingskills, attribution] Data-driven attribution (Google's DDA, most MTA tools) asks a counterfactual: how much does each touch change the probability of conversion? The formal engine is the Shapley value from cooperative game theory.

- Treat each touch as a "player" on a team that produced the conversion, and look across all journeys, converting and non-converting.
- For a given touch, compare conversion rates of journeys that had it with otherwise similar journeys that didn't, across every combination of the other touches. Its credit is its **average marginal lift** to conversion probability across those combinations.
- If journeys with a retargeting touch convert more often than identical journeys without it, retargeting earns credit; if adding a channel changes nothing, it earns about zero even when it appears on every path.
- **Worth it when** you have volume (the counterfactuals need enough conversions to be stable) and journeys are mostly digital and tracked. Offline events, dark social and cookie-lost touches are invisible to it, so a word-of-mouth B2B motion gets a confidently wrong DDA; pair it with self-reported attribution.
- **Limits:** a black box ("The model says so" is a weak budget argument); correlation, not causation, which is why incrementality tests exist to validate it; garbage in (if half the journeys are "direct", it splits credit on half-blind data).

## Choosing a model

[coreyhaines31/marketingskills, attribution]

- **Short cycle, few touches, small volume:** last non-direct, plus a self-reported survey. Don't over-model.
- **Long B2B cycle, clear created and closed moments:** position-based as the primary *on your own path data*, first-touch and last-touch alongside. Not a Google Ads model picker option.
- **High volume, mostly digital, day-to-day allocation:** data-driven, validated periodically by incrementality.
- **Offline and brand-heavy, real budget:** no user-level model; MMM plus incrementality ([MEASUREMENT-PARADIGMS.md](MEASUREMENT-PARADIGMS.md)).
- In every case: pick one model, stay consistent, pair it with an out-of-model check. "Model-switching to make a channel look good is the fastest way to lose trust in the whole attribution program."
- To run these models on your own data you need the full ordered touch path, not only first touch ([FIRST-PARTY-STITCH.md](FIRST-PARTY-STITCH.md#step-4-report)).

## Prove it

Every reported attribution names its model and window; a long-cycle report shows first-touch and last-touch together; no recommendation tells a user to pick linear, time-decay or position-based in a Google Ads or GA4 dropdown; a recomputation of the time-decay column from the stated half-life gives the same shares; and a DDA recommendation states the account's 30-day conversions and interactions against Google's recommended volume.
