# Measuring AI search visibility and its effect

How to measure presence in AI answers without fooling yourself, and how to see its effect past the referral click. Sources: Google's AI optimization guide and spam policies, [coreyhaines31/marketingskills, ai-seo] (MIT; its attribution framework adapted there from Profound's MIT ai-search-attribution-planner), [openseo.so] and [freescan]. Event capture and channel wiring are [posthog SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/SKILL.md); touch-to-revenue attribution in general is [marketing-attribution SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-attribution/SKILL.md).

## Google's own report

"To measure how your content is performing in generative AI features on Google Search and Discover, use the Generative AI performance report in Search Console." [https://developers.google.com/search/docs/fundamentals/ai-optimization-guide, updated 2026-07-10] The source says "there is no AI-specific Search Console reporting"; that was written against an older version of the same guide. Google's changelog also records that "AI Overviews are counted and logged in Search Console" (2024-08-15) and that AI Mode data "is now counting towards the totals in the Search Console Performance report" (2025-06-16) [https://developers.google.com/search/updates]. Working with Search Console: [search-console SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/search-console/SKILL.md).

For Google results, use Search Console rather than automated result scraping: Google's spam policies list "scraping results for rank-checking purposes" without permission [https://developers.google.com/search/docs/essentials/spam-policies]. Automated checks of AI chat apps follow each app's own terms.

## One answer is an anecdote

[coreyhaines31/marketingskills, ai-seo, format-volatility] (rigor framing credited there to Initial Commit's AEO audit skill)
- Collapse wording variants into one core prompt per intent and spend the budget on repeat runs.
- Run each query 3 to 5 times per platform, in a fresh session each time.
- Track the mention or citation *rate* ("cited in 3 of 5 runs"), never a yes or no from one run, and report the sample size with every number ("40% mention rate, n=5").
- "Compare rates over time, not runs. A drop from 4/5 to 3/5 is noise; a drop from 4/5 to 0/5 sustained across a month is signal."
- Before diagnosing why you're not cited, split the cause: **technical** (can't be crawled or parsed, [AGENT-READINESS.md](AGENT-READINESS.md)), **comprehension** (described inaccurately or vaguely, [ANSWER-ACCURACY.md](ANSWER-ACCURACY.md)), or **trust** (understood but not selected, [VISIBILITY-AUDIT.md](VISIBILITY-AUDIT.md#cited-is-not-recommended)).

Trackers differ in what they sample: OpenSEO collects ChatGPT and Gemini from their consumer sites and Claude and Perplexity through their APIs, uses the latest finished run per day for its trend, and charges more for "Run now" than for scheduled checks [openseo.so, /docs/ai-visibility]. Check what each tool samples before comparing numbers across tools. [coreyhaines31/marketingskills, ai-seo]

## Formats and sources move

[coreyhaines31/marketingskills, ai-seo] Which page formats and third-party sites an engine cites shifts with model and retrieval updates. The source records August 2026 vendor data (Peec AI, shared via Lily Ray) of ChatGPT citing listicles and comparison pages much less after one release, and practitioner reports of Reddit nearly disappearing from ChatGPT citations; these are dated, third-party snapshots. The rules that survive them: format strategy is per platform; never concentrate third-party work in one surface; owned-site fundamentals hedge the volatility; and "verify against your own citation monitoring before betting budget".

## Four layers of effect

[coreyhaines31/marketingskills, ai-seo, ai-attribution] Report each layer separately. "Rising visibility does not prove rising revenue."

| Layer | What it captures | Where it comes from |
|---|---|---|
| **Exposure** | Mentions, recommendations, prominence, framing, citations | Prompt tracking ([PROMPT-RESEARCH.md](PROMPT-RESEARCH.md)) |
| **Immediate behavior** | AI referral sessions, landing pages, engaged sessions | Analytics, with AI referrers grouped |
| **Delayed behavior** | Branded search, direct visits, return visits, cross-session conversions | Search Console branded queries, analytics, CRM |
| **Business outcome** | Signups, leads, qualified pipeline, purchases, revenue, retention | CRM and billing |

The source cites vendor studies (Profound, July 2026; SimilarWeb) in which most downstream visits after an AI recommendation carried no AI referrer and many came days later; treat that as a reason to measure delayed windows, not as a forecast.

**Setup:**
1. Name the decision ("Should we keep funding AEO content?" vs "Did fixing our pricing page change anything?").
2. Define exposure by engine, prompt cohort, market, language and date.
3. Fix referral capture: group known AI referrers (chatgpt.com, perplexity.ai, gemini.google.com, copilot.microsoft.com, claude.ai) into one channel; preserve landing page, referrer and query parameters; expect it to undercount.
4. Add delayed windows: branded search and direct visits to exposed pages over 1-hour, 24-hour and 7-day windows after a known exposure change.
5. Ask people: a "How did you hear about us?" field with an AI option and a "What did you ask?" follow-up, plus tagged sales-call notes. The answers also feed the prompt portfolio.
6. Join to outcomes in the CRM without counting one conversion twice across layers.

FreeScan's list of what to track is the same shape: crawl and index state, landing-page traffic, identifiable referrals, brand and topic demand, assisted conversions, and verifiable cited appearances, "without inventing attribution". [freescan]

## Evaluation designs

[coreyhaines31/marketingskills, ai-seo] Pick the strongest design you can afford and say which one you used. List confounders first: campaigns, launches, press, seasonality, pricing changes, model or retrieval updates.

| Design | Use when | Confidence |
|---|---|---|
| **Holdout** | You can leave comparable pages, products or markets untouched | Highest |
| **Matched comparison** | Similar pages or markets exist, but you can't randomize | Medium |
| **Interrupted time series** | One clear intervention date and a long, stable baseline | Medium |
| **Pre/post on a stable cohort** | Nothing better is possible | Low; confounders easily swamp it |
| **Exposure panel or incrementality study** | Budget for a vendor panel | Varies with the panel's method |

**Reporting language:** say whether you have an **observation** ("branded search rose after the change"), an **association** ("pages with more AI mentions saw more direct visits") or a **causal result** ("the holdout pages didn't move; the treated pages did"). "Most AEO reporting only supports the first two. Say so." Aggregate small groups in panel and self-reported data and follow your consent and retention policies.

## Prove it

Every visibility number carries its run count and n; the portfolio version is the same across any two periods compared; AI referrers land in one analytics channel and a test visit from each listed referrer shows up there; the how-did-you-hear field has an AI option and stores the free-text prompt; and every effect claim in a report names its layer and its evaluation design.
