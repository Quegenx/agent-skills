# Paid account-based marketing

Account-based marketing with ads: named-account qualification, LinkedIn and Meta lists, account pages, acceleration, cross-channel orchestration, sales follow-up and measurement. From [coreyhaines31/marketingskills, ads, abm-playbook.md] (MIT; Ivan Falco's practitioner playbook), retaining its privacy qualifications and practitioner thresholds, which are starting points to recalibrate on your own first 30 days. Generic B2B acquisition and lead quality are in [B2B-ACQUISITION.md](B2B-ACQUISITION.md); campaign operations remain in [SKILL.md](SKILL.md).

## When ABM

[coreyhaines31/marketingskills, ads, abm-playbook.md] ABM ads are a pipeline-influence motion, not lead gen; measure accordingly. Run paid ABM when the target account list is ≥ ~1,000 companies (or you accept 1:1 or 1:few economics), deals are ~$25K+, cycles 60+ days, sales and marketing agree on the list, and (for Meta) contact enrichment is available. Skip it with a list under ~500 and no enrichment, no first-party data, under ~$3K a month, or a short transactional cycle.

## LinkedIn ABM

[coreyhaines31/marketingskills, ads, abm-playbook.md]

- **1:1:** the company by name, creative personalized for one account. **1:few:** up to ~10 to 20 accounts per campaign with a shared pain or industry angle. **1:many:** an uploaded list or native targeting, scaled creative.
- **Lists:** "300 matched members minimum" to serve, which matches LinkedIn's minimum ad set audience of 300 member accounts (https://www.linkedin.com/help/lms/answer/a424655). Aim for 1,000+ rows (duplicate company names are fine; it dedupes on match). Contact lists match best at scale (the source says LinkedIn suggests ~10K emails); company lists beat contact lists for most teams. Cold ABM audiences need ~15K members to deliver reliably.
- **Segment mixed lists:** as one audience, LinkedIn over-serves the largest enterprises (the source reports accounts stuck at 15% list coverage); split into enterprise, mid-market and SMB bands with separate campaigns and budgets. Use the per-company engagement report to find under-served priority accounts and break them out.
- **Account pages:** send 1:1 and 1:few clicks to a page built for that account or segment, through a personalization layer on the site, a CMS template fed from a list, a dynamic route reading the CRM or a sheet, or an AI site platform. Keep account pages `noindex` and out of the sitemap, use only public or first-party facts about the account, and have a human review before anything publishes.
- **Personalized creative:** the source says the account's name or logo in the creative can lift CTR ~5 to 10×, and that you should not run company-name or logo-personalized ads into Germany, calling it "privacy law, not platform policy". It cites no statute: treat it as a practitioner claim, not law.
- **Frequency cap** ~3 impressions per person per week in priority accounts: build a company-engagement audience of accounts past ~500 impressions in 7 days and add it as an exclusion, so accounts rotate out as they cool (300 if fatigue shows, 750 for more pressure).

## ABM on Meta

[coreyhaines31/marketingskills, ads, abm-playbook.md] Meta has no company targeting; bring your own matched audience.

- **Match rates:** raw work emails match under ~5% on Meta; identity-graph enrichment providers raise that to ~40 to 85% (practitioner). Uploading enriched personal data needs a lawful basis and notice under GDPR (Art. 6) and the advertiser's right to use the data under Meta's Custom Audience terms; record the basis before uploading, and route the consent and privacy side through [email-practices COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/COMPLIANCE.md). Workflow: firmographic criteria → identity match → Custom Audience → target directly or seed a 1% lookalike.
- **Sizes:** account-list audiences ~1,000 companies (5 to 10K optimal); retargeting slices down to ~100 accounts; lookalike seeds 500+.
- **Advantage+ won't stay locked to a list:** run ABM manual, or hybrid (manual for the list, Advantage+ for the broad layer).
- Meta's ABM role is cheap air cover and reaching the buying committee beyond the champion, while LinkedIn does precision.

## Acceleration campaigns

[coreyhaines31/marketingskills, ads, abm-playbook.md] Ads aimed at accounts already in pipeline, to speed deals rather than source them: segment the CRM by stage (evaluation, proposal, negotiation), filter to deals worth the spend, upload as an audience, refresh weekly. Use an **awareness or reach objective, not conversions**: you're keeping the vendor in front of the committee, not asking for a demo they already booked. Creative: case studies, proof and objection handlers matched to stage; the source spends $100 to 200 a day on larger open deals and a maintenance dose on stalled ones.

## Cross-channel orchestration

[coreyhaines31/marketingskills, ads, abm-playbook.md] The source's default B2B ABM split: ~60% LinkedIn / ~30% Meta / ~10% other. LinkedIn buys precision at $40 to 70 CPMs, Meta presence and committee reach at $10 to 25. Sequence LinkedIn first to validate the audience, then extend to Meta.

## Cross-channel UTM remarketing

[coreyhaines31/marketingskills, ads, abm-playbook.md] Retarget one platform's validated clickers on another:

1. Tag all paid traffic with consistent UTMs (`utm_source=linkedin`, `utm_source=google&utm_medium=cpc`).
2. On Meta, build a website Custom Audience with the rule **"URL contains `utm_source=linkedin`"** (or `utm_source=google`).
3. Retarget it on Meta: LinkedIn-grade audience quality at Meta-grade CPMs (the source says 50 to 70% cheaper reach).

It works in reverse (search clickers → LinkedIn), which the source says pays above roughly $30K a month search spend. It needs enough source traffic to clear minimum audience sizes; keep a consistent account or campaign token in the UTMs so attribution survives the hop. UTM conventions: [marketing-attribution](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-attribution/SKILL.md).

## Sales follow-up

[coreyhaines31/marketingskills, ads, abm-playbook.md] ABM ads without sales follow-up are billboard spend. Pipe engagement signals to the CRM and treat a spike as a sales trigger, with outreach within ~48 hours; post new leads to a shared channel with a per-campaign quality reaction as the cheapest feedback loop; hold a monthly sales and marketing session on the list itself (who engages, who's dark, who closed) and re-cut it. The source expects ~7 to 10 cross-channel touches before a sales conversation. Outreach itself: [cold-outreach](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cold-outreach/SKILL.md).

## Measuring ABM

[coreyhaines31/marketingskills, ads, abm-playbook.md] Judge account movement, not CPL: account penetration ~40 to 60% of the list; cost per engaged account ~$100 to 300; account → opportunity ~10 to 20%; pipeline influenced 3 to 5× spend. **Incrementality:** hold out ~20% of the list from ads and compare pipeline formation after 21+ days, the only honest answer to "did the ads do anything?"

## Prove it

[coreyhaines31/marketingskills, ads, abm-playbook.md] An ABM plan states list size, deal size and cycle against the go/no-go, segments mixed lists, keeps account pages `noindex`, records the lawful basis for any enriched upload, and holds out part of the list.
