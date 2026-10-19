---
name: marketing-attribution
description: "Works out which marketing caused conversions and revenue: choosing and comparing attribution models, MTA vs MMM vs incrementality tests, self-reported attribution, reconciling ad platforms, analytics and the CRM, the direct, branded, dark-social and AI blind spots, B2B, DTC and PLG playbooks, and owning first-party attribution by stitching anonymous visits to conversions, including bookings and checkouts on another domain, then into the CRM. Use when dashboards disagree, choosing first-touch or last-touch, asking for the real CAC or which channel drives revenue, planning a holdout or geo test, adding a how-did-you-hear question, or connecting a booking or checkout back to its source."
---

# Marketing attribution

Attribution answers which efforts caused a conversion and its revenue, and every answer is a model built from incomplete data: platforms claim the same sale, "direct" and branded search hide where demand was created, and each model encodes an opinion. The work has two pillars: **(A) interpretation**, choosing a model or measurement approach and reconciling conflicting numbers, which applies to everyone with no engineering; and **(B) owning first-party attribution**, instrumenting and stitching it yourself when you control the site or app. Most requests start with A. Sources: [coreyhaines31/marketingskills, attribution] v1.1.5 (MIT, (c) 2025 Corey Haines, copied with its notice); its first-party method is adapted from Tessa Kriesel's PostHog attribution approach, and her production refinements are credited where they appear. Errors the source carries are corrected against the official pages and say what the source said.

Product context: read `.agents/product-context.md` first if it exists (defined in [anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md)); business type, sales cycle and primary conversion drive almost every recommendation here. The source names this file `.agents/product-marketing.md`.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| The seven models and how each lies, Google's retired models and DDA volume, one $12,000 journey scored six ways, Shapley in plain words, choosing a model | [ATTRIBUTION-MODELS.md](ATTRIBUTION-MODELS.md) |
| MTA vs MMM vs incrementality, test designs (geo holdout, PSA, ghost ads, intent-to-treat, on-off, holdout audiences), reading a test, the mature stack, triangulated overrides | [MEASUREMENT-PARADIGMS.md](MEASUREMENT-PARADIGMS.md) |
| The B2B SaaS, ecommerce and DTC, and PLG-with-sales playbooks and their traps | [BY-BUSINESS-TYPE.md](BY-BUSINESS-TYPE.md) |
| First-party build: audit, identify at conversion, the third-party-domain stitch with code, guards, referrer exclusions, cross-subdomain, reporting, the CRM last mile, other stacks | [FIRST-PARTY-STITCH.md](FIRST-PARTY-STITCH.md) |

## Boundaries

[coreyhaines31/marketingskills, attribution] Attribution assumes tracking exists. The line: analytics is "what events and how to fire them"; attribution is "how touches join to conversions and survive to revenue."

- **Event tracking, tracking plans, UTMs, GA4 and GTM:** [google-analytics SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/google-analytics/SKILL.md) and [posthog EVENTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/EVENTS.md).
- **Ad-platform pixels, CAPI, server-side conversion tracking:** [paid-ads SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/SKILL.md); for app campaigns, [app-growth META-ADS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/META-ADS.md). Attribution consumes platform-reported numbers and corrects for their bias.
- **Pipeline stages, lead lifecycle, CRM revenue dashboards:** [revops SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/revops/SKILL.md). Attribution feeds it the source dimension.
- **Showing up in and measuring AI search:** [ai-search-visibility SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ai-search-visibility/SKILL.md). Attribution names AI traffic as a blind spot only.
- **Mobile install attribution** (ATT, AdAttributionKit, SKAdNetwork, AdServices, MMPs, the Play Install Referrer): [app-growth ANALYTICS-AND-ATTRIBUTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/ANALYTICS-AND-ATTRIBUTION.md).
- **Controlled experiments on site changes:** [ab-testing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SKILL.md), the incrementality mindset applied to on-site changes.

## What attribution can and can't tell you

[coreyhaines31/marketingskills, attribution] Set expectations before touching a number:

- **Attribution is directional, not truth.** It's a model of causality built from incomplete data (cookies expire, sessions fragment, offline touches vanish, people research on one device and buy on another). Treat it as a strong hint, never a verdict.
- **Every model is an opinion.** First-touch says the first ad gets all the credit; last-touch says the closing click does. Both are wrong in opposite directions. Choosing a model is choosing whose story to believe; say so out loud.
- **The attribution gap is normal, so separate outcomes from credit.** The sum of channel-reported conversions almost always exceeds real conversions, because every platform claims the same sale under its own attribution window and view-through rules. Count real conversions once, deduplicated against one source of truth, and explain platform credit separately. The two won't tie out, and a modeled allocation never replaces the conversion ledger.
- **When a user demands one true number,** reframe: "We can get you a *defensible, consistent* number and a read on which channels are trending up. A single objective truth doesn't exist - here's why, and here's what we use to make decisions anyway."

## Self-reported attribution

[coreyhaines31/marketingskills, attribution] The most underused signal, and often the most honest for long cycles and dark social. A post-conversion "How did you hear about us?" question catches what tracking structurally cannot: podcasts, word of mouth, Slack communities, a founder's tweet, "a friend told me."

- **When it beats tracking:** long consideration cycles, high word of mouth, brand or community-led growth, heavy dark social. A big "direct" share is a self-reported-shaped hole.
- **Ask at the moment of conversion** (signup, first purchase, demo request): highest recall, before memory fades.
- **Wording:** open-ended ("How did you first hear about us?") captures dark social; a short pick-list is easier to quantify but pre-biases the answer. Best practice: a pick-list of your known channels plus a free-text "other/tell us more." [coreyhaines31/marketingskills, ai-seo] adds an AI option with a "What did you ask?" follow-up.
- **Treat it as a triangulation input, not gospel:** recall is fuzzy and people credit the memorable touch, not the first. Discount survey share when turning it into credit (22% recall of YouTube is evidence of awareness, not a claim that YouTube deserves 22% of conversions). Pair it with incrementality or platform deltas before writing an allocation rule.
- **On the build side** it's a form field written to the CRM and analytics as a person property ([FIRST-PARTY-STITCH.md](FIRST-PARTY-STITCH.md#the-last-mile-into-the-crm)). A PostHog survey can ask it ([posthog SURVEYS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/SURVEYS.md)).

## Reconciling conflicting sources

[coreyhaines31/marketingskills, attribution] The request behind most attribution work: "Google says 50, Meta says 40, GA says 60, my CRM says 35. Who's right?" Nobody is.

| Source | Biased toward | Because |
|---|---|---|
| **Ad platforms** (Google, Meta, LinkedIn) | Over-counts *itself* | Claims view-through and click conversions in its own window; every platform counts the same sale; motivated to look good |
| **GA / web analytics** | Last non-direct click | Loses cross-device, loses cookie-blocked users, dumps the unknown into direct |
| **CRM** | Whatever the rep typed or the form captured | Human entry, lead-source overwrites, offline deals with no digital trail |
| **Self-reported survey** | The *memorable* touch | Recall bias; under-counts boring-but-real touches like retargeting |

1. **Pick one source of truth for the conversion count,** usually the CRM or backend (the system where money is real). Everything else explains where those came from; it doesn't redefine how many.
2. **Never sum across platforms.** If Google and Meta both claim a conversion, you have one conversion with two claimants. De-dupe against the source-of-truth total.
3. **Read directional agreement, not absolute match.** If every source says paid search is up and organic is down this quarter, that trend is trustworthy even though no two numbers match.
4. **Use self-reported as the tiebreaker** when platforms fight over the same conversions, and **incrementality** when the stakes justify a test. Do not turn a platform-vs-GA gap into a multiplier rule (Meta claims 2x GA is not "double Meta"); investigate windows and view-through, then ground any override in incrementality.
5. **Expect and budget for the gap.** Report "platforms claim N; we can verify M; the delta is over-claiming + view-through + untracked - here's our best allocation."
6. **Operationalize triangulation as documented rules** once a holdout or a trusted survey band exists ([MEASUREMENT-PARADIGMS.md](MEASUREMENT-PARADIGMS.md#triangulated-overrides)).

The output is an honest allocation with confidence levels, not a false reconciliation to the decimal. For apps, the same rule: never add up per-network installs; the store or RevenueCat count is the total ([app-growth BUDGET-AND-ROAS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/BUDGET-AND-ROAS.md)).

## The blind spots

[coreyhaines31/marketingskills, attribution] Where conversions hide, making real channels look weak:

- **Direct:** the junk drawer. Bookmarks and typed URLs, but also stripped referrers, app-to-web, dark social and any touch your tracking dropped. A large direct share can include genuine direct visits, repeat users and measurement loss; investigate its composition before treating it as a tracking defect.
- **Branded search:** people who discovered you elsewhere and searched your name. Last-touch hands the credit to branded search; the real driver was whatever made them search. Segment branded vs non-branded, or you'll defund the top of funnel.
- **Dark social:** sharing that carries no referrer (DMs, Slack and Discord, podcasts, newsletters, screenshots). Structurally invisible to tracking; self-reported is the only way to see it.
- **AI traffic:** assistants and AI search influence buyers who then arrive via branded search or direct, so the AI touch is invisible in analytics. [coreyhaines31/marketingskills, ai-seo] groups known AI referrers (chatgpt.com, perplexity.ai, gemini.google.com, copilot.microsoft.com, claude.ai) into one channel and expects it to undercount; deeper work is [ai-search-visibility SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ai-search-visibility/SKILL.md).
- When direct and branded search dominate, the most common explanation is a working top of funnel that attribution hides. Confirm before concluding: rule out existing customers, lost referrers and offline discovery, then check self-reported attribution or run an incrementality test. Say which way the evidence points.

## The readout

[coreyhaines31/marketingskills, attribution] Deliver an attribution readout, not a data dump:

```markdown
# Attribution Readout - [date]

## The question
[What decision this informs - e.g. "where should next quarter's budget go?"]

## Source of truth
[Which system defines the conversion count, and why]

## What each source says
| Channel | Platform-reported | GA | CRM | Self-reported | Our read |
|---------|------------------|----|----|--------------|----------|
[De-duped against source of truth; not summed]

## Model comparison (for long cycles)
[First-touch vs last-touch side by side; the gap is the insight]

## Confidence & gaps
[The attribution gap, the blind spots, what we can't see]

## Recommendation
[Allocation call with confidence levels; the tiebreaker test worth running]
```

## The rules

1. **Know the pillar first:** interpretation (A) or the first-party build (B). [coreyhaines31/marketingskills, attribution]
2. **One source of truth defines the conversion count;** platforms, GA and surveys explain it and are never summed. [coreyhaines31/marketingskills, attribution]
3. **Never report one model alone for a long cycle:** show first-touch and last-touch side by side; the gap is the insight. Pick one model, stay consistent, and pair it with an out-of-model check. [coreyhaines31/marketingskills, attribution]
4. **Teach Google's retired models as concepts only,** computed on your own data, not as dropdown options ([ATTRIBUTION-MODELS.md](ATTRIBUTION-MODELS.md#platform-availability)). [support.google.com/analytics/answer/10596866]
5. **Causality needs an experiment:** use incrementality for the "always credited" channels (retargeting, branded search) before scaling on reported ROAS. [coreyhaines31/marketingskills, attribution]
6. **Ask "How did you hear about us?" at conversion** and discount its share before turning it into credit. [coreyhaines31/marketingskills, attribution]
7. **No platform-gap multipliers;** overrides are documented, bounded and grounded in a test. [coreyhaines31/marketingskills, attribution]
8. **Match rigor to the decision:** most small businesses need good UTMs, last non-direct, a survey and the occasional on-off test, not an MMM. [coreyhaines31/marketingskills, attribution]
9. **First-party stitching fails closed:** smuggle only an anonymous ID; when identity is ambiguous, send nothing ([FIRST-PARTY-STITCH.md](FIRST-PARTY-STITCH.md#the-anonymity-guard)). [coreyhaines31/marketingskills, attribution]

## Prove it

From the source's evals: "Google 50, Meta 40, GA 60, CRM 35" gets no single "right" number, an explicit warning against summing, the CRM as the count, the bias of at least three sources and a directional read; a B2B team with a two-month cycle gets first-touch and last-touch side by side, position-based on its own data (not as a Google UI model), self-reported at demo and the CRM as truth; "Meta says 6x ROAS on retargeting but revenue is flat" gets a holdout and incremental CPA; "half our conversions are direct" gets the junk-drawer answer, branded vs non-branded segmentation and the AI blind spot; a $200k-a-month DTC brand with podcasts gets the store count as truth, MMM, incrementality and a post-purchase survey; a GA4 setup request is routed to the analytics skill; and the SavvyCal, stale-decorator and webhook-timeout cases pass the checks in [FIRST-PARTY-STITCH.md](FIRST-PARTY-STITCH.md#prove-it).
