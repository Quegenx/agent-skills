# Campaign planning

What to ask, where to advertise, how to structure and name an account, where audience knowledge belongs, retargeting, brand vs non-brand, scaling, and the setup checklists per platform. From [coreyhaines31/marketingskills, ads] (SKILL.md, platform-setup-checklists.md, audience-targeting.md) unless a line names another source; stale platform lines are corrected with the official URL and what the source said.

**Contents:** [Questions first](#questions-first) · [Platform choice](#platform-choice) · [Audience knowledge goes into creative first](#audience-knowledge-goes-into-creative-first) · [Structure and naming](#structure-and-naming) · [Budget phases](#budget-phases) · [Metrics and levers](#metrics-and-levers) · [Retargeting](#retargeting) · [Brand vs non-brand](#brand-vs-non-brand) · [Scaling on net cash](#scaling-on-net-cash) · [Landing page continuity](#landing-page-continuity) · [Setup checklists](#setup-checklists) · [Audience options per platform](#audience-options-per-platform) · [Common mistakes](#common-mistakes) · [Prove it](#prove-it)

## Questions first

Ask only what `.agents/product-context.md` doesn't answer [coreyhaines31/marketingskills, ads]:

- **Goals:** the primary objective (awareness, traffic, leads, sales, app installs), target CPA or ROAS, monthly or weekly budget, constraints (brand, compliance, geography).
- **Offer:** what is promoted (product, free trial, lead magnet, demo), the landing page URL, why the offer is compelling.
- **Audience:** the ideal customer, the problem solved, what they search for or follow, existing customer data for seed audiences.
- **Current state:** past ads and results, existing pixel or conversion data, the current funnel conversion rate.
- **Task-specific:** platforms running or wanted, what a conversion is and what it is worth, existing creative, which landing page, whether tracking is set up.

## Platform choice

| Platform | Best for | Use when |
|---|---|---|
| Google Ads | High-intent search traffic | People actively search for your solution |
| Meta | Demand generation, visual products | Creating demand, strong creative assets |
| LinkedIn | B2B, decision-makers | Job title or company targeting matters, higher price points |
| X | Tech audiences, thought leadership | The audience is active on X, timely content |
| TikTok | Younger demographics, video creative | The audience skews 18 to 34, video capacity |

[coreyhaines31/marketingskills, ads]. Search harvests existing demand and cannot create it: with near-zero search volume, put the budget upstream on social ([GOOGLE-SEARCH.md](GOOGLE-SEARCH.md#capture-before-you-create)). Before committing to a new channel, run a ~$100 test to learn its real CPC and CPM for your targeting ([B2B-ACQUISITION.md](B2B-ACQUISITION.md#channel-selection)). App installs: [app-growth](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/SKILL.md).

## Audience knowledge goes into creative first

Knowing the audience (titles, pains, fears, hopes, their exact words, what they tried) is still the highest-leverage work; what changed is where it goes. Algorithms find the person better than stacked filters, so feed the identifiers into headlines, copy, visuals and hooks first, and into targeting filters second [coreyhaines31/marketingskills, ads]. The source's split, which it calls directional, not precise:

| Platform | Knowledge into creative | Into targeting filters | Note |
|---|---|---|---|
| Meta | 80%+ | 20% | Broad targeting with specific creative; interest stacking hurts ([META-WEB-ADS.md](META-WEB-ADS.md#andromeda-practice)) |
| Google Search | 40% | 60% | Keywords, match types and negatives still drive it; RSA copy is downstream of the keyword |
| Google PMax and Demand Gen | 70% | 30% | Audience signals are advisory; creative and feed quality dominate |
| LinkedIn | 40% | 60% | Firmographic and job data are precise; creative makes the click |
| TikTok | 70% | 30% | Closer to Meta: broad targeting and native-feeling creative |
| X | 50% | 50% | Interest and follower targeting still matter |

Put each kind of knowledge where it works: demographic and niche identifiers as identity-trigger words in the headline ("for dentists"); pains and fears in the headline and first line, in the customers' own words; hopes in the transformation copy and CTA; objections and "why they didn't buy" in retargeting ads; their vocabulary as the whole copy voice; the customer base as seed audiences. The common failure is making up for weak creative with precise targeting: 12 interests and 3 filters on a generic ad build a small audience that all see a bad ad. Write five variants that each speak to one segment, target broadly, and let delivery match them [coreyhaines31/marketingskills, ads].

## Structure and naming

```
Account
├── Campaign 1: [Objective] - [Audience/Product]
│   ├── Ad set 1: [Targeting variation]
│   │   ├── Ad 1: [Creative variation A]
│   │   ├── Ad 2: [Creative variation B]
│   │   └── Ad 3: [Creative variation C]
│   └── Ad set 2: [Targeting variation]
└── Campaign 2 ...
```

Naming: `[Platform]_[Objective]_[Audience]_[Offer]_[Date]`, for example `META_Conv_Lookalike-Customers_FreeTrial_2024Q1`, `GOOG_Search_Brand_Demo_Ongoing`, `LI_LeadGen_CMOs-SaaS_Whitepaper_Mar24` [coreyhaines31/marketingskills, ads]. LinkedIn's level names changed: see [LINKEDIN-ADS.md](LINKEDIN-ADS.md#build-order).

## Budget phases

- **Testing (first 2 to 4 weeks):** 70% to proven campaigns, 30% to new audiences or creative [coreyhaines31/marketingskills, ads].
- **Scaling:** consolidate into winners; the source raises budgets "~20% at a time, never 30%+ in one move (resets platform learning)" and waits 3 to 5 days between increases [coreyhaines31/marketingskills, ads]. The percentage is practitioner: Meta publishes none and says only to "avoid frequent budget changes" (https://www.facebook.com/business/help/112167992830700). Google's own budget and target rules are in [GOOGLE-SEARCH.md](GOOGLE-SEARCH.md#bidding-by-conversion-volume).
- **Bid strategy progression:** start manual or with cost caps, gather conversion data, switch to automated targets from history, adjust targets on results [coreyhaines31/marketingskills, ads]. The source says "50+ conversions" before switching; Google's Target ROAS needs "At least 15 conversions in the past 30 days" on Search and Shopping (https://support.google.com/google-ads/answer/6268637).

## Metrics and levers

| Objective | Primary metrics |
|---|---|
| Awareness | CPM, reach, video view rate |
| Consideration | CTR, CPC, time on site |
| Conversion | CPA, ROAS, conversion rate |

- **CPA too high:** check the landing page first (is the problem after the click?), then audience, new angles, ad relevance or Quality Score, bid strategy.
- **CTR low:** the creative isn't landing (new hooks or angles), audience mismatch, or fatigue.
- **CPM high:** the audience is too narrow, competition is high (try other placements), or relevance is low.

[coreyhaines31/marketingskills, ads]. Read the levers through [AUDIT-GUARDRAILS.md](AUDIT-GUARDRAILS.md#the-weekly-operating-check): the weekly check finds which one moved before you pull any.

## Retargeting

| Funnel stage | Audience | Message | Goal |
|---|---|---|---|
| Top | Blog readers, video viewers | Educational, social proof | Move to consideration |
| Middle | Pricing and feature page visitors | Case studies, demos | Move to decision |
| Bottom | Cart abandoners, trial users | Urgency, objection handling | Convert |

| Stage | Window | Frequency cap |
|---|---|---|
| Hot (cart, trial) | 1 to 7 days | Higher is fine |
| Warm (key pages) | 7 to 30 days | 3 to 5 a week |
| Cold (any visit) | 30 to 90 days | 1 to 2 a week |

Exclude existing customers (unless upselling), recent converters (7 to 14 days), visitors who bounced in under 10 seconds, and careers and support visitors [coreyhaines31/marketingskills, ads]. Urgency only when it is genuine: the FTC rules on scarcity and deadlines are in [offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md).

- **Retarget with a different offer, not the same one harder.** Sabri Suby's principle, as the source quotes it: the main reason someone didn't buy is that the offer wasn't right for them. Visitor viewed pricing and didn't sign up → a free audit; downloaded a lead magnet and didn't book → a different lead magnet [coreyhaines31/marketingskills, ads]. The source adds that "a 2-3 ROAS audience on the original offer can hit 6+ ROAS on a different offer"; that is an unsourced practitioner claim, not a forecast.
- **Four retargeting ads at once:** an objection-handling ad (call the leads who didn't convert, ask why, use their words as the headline); a proof carousel of testimonials that support the original ad's claims; your other best ads for other offers in one CBO; a value-first audit or assessment ad [coreyhaines31/marketingskills, ads].
- **LinkedIn audiences don't backfill:** create them before launch ([LINKEDIN-ADS.md](LINKEDIN-ADS.md#retargeting-starts-when-the-audience-exists)).

## Brand vs non-brand

Wherever people can search your name, split brand from non-brand before you evaluate or optimize anything. A branded query is demand that already exists, so a cheap brand CPA reads your awareness, not your media efficiency [coreyhaines31/marketingskills, ads].

- **Report blended, optimize on non-brand.** Blended ROAS or CAC is the honest top-line number for the whole account; targets, bids and budgets are set on non-brand ROAS, or cheap brand conversions loosen every target and hide non-brand waste.
- **Never report a low brand CPA as a win** unless you measure incrementality, for example a brand-campaign holdout. The brand pause test for Search is in [GOOGLE-SEARCH.md](GOOGLE-SEARCH.md#brand-bidding-and-the-pause-test).
- app-growth's Apple Ads scale gate uses "brand ROAS > 1.0×" ([app-growth APPLE-ADS-OPTIMIZATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/APPLE-ADS-OPTIMIZATION.md)); the same caution applies there: brand ROAS is not incremental.

## Scaling on net cash

The common scaling failure: an account at 40 ROAS on $5k a month refuses to spend more because ROAS will drop. ROAS falling from 10 to 5 while spend goes from $10k to $100k can net far more profit; judge headroom on blended business-level ROAS, optimize on non-brand ROAS, and better still on net free cash flow [coreyhaines31/marketingskills, ads].

- **Find the ceiling:** the most you can pay for a customer and stay profitable is your break-even CPA or ROAS; scale until you approach it, not until account ROAS dips below a preference. Payback timing is in [PAYBACK.md](PAYBACK.md).
- **The founder review:** the source has founders block about 3 hours a month to go through the numbers themselves ("Data gives you confidence. Confidence gives you speed.").
- **Call the leads who didn't convert:** their answers become objection-handling ads [coreyhaines31/marketingskills, ads].
- When reach stalls rather than CPA, see rolling reach and partnership ads in [META-WEB-ADS.md](META-WEB-ADS.md#rolling-reach).

## Landing page continuity

The source calls ad-to-page congruence the most underrated lever and tells you to flip the usual 90/10 effort split toward the page. Use ads to screen headline language, then prove it on the page [coreyhaines31/marketingskills, ads]:

1. Screen a manageable set of headline hypotheses with enough traffic each; compare CTR with qualified conversions, cost and sample sizes, since a high-CTR headline can attract visitors who don't buy.
2. Treat the apparent winner as a candidate. Ordinary ad variations with optimized delivery are exploratory; use a randomized ad experiment for a causal comparison, and account for multiple comparisons. Meta's A/B testing randomizes comparable exposure (https://www.facebook.com/business/help/1738164643098669).
3. Mirror the candidate's promise in a truthful landing-page variant and run a fresh randomized test against the unchanged page, with ads and traffic split held constant and the primary metric, guardrails, sample size and stopping rule fixed in advance ([ab-testing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SKILL.md)).
4. Report the effect and its uncertainty. "There is no guaranteed minimum conversion lift"; keep the original page when the evidence doesn't justify replacing it.

The source also says to keep "at least 3 split tests running" because "3 × ~10-20% lift each (compounding)" builds a better funnel; that arithmetic contradicts its own no-guaranteed-lift line and is left out here. Page message match is in [landing-page-ui](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SKILL.md) and [cro](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cro/SKILL.md).

## Setup checklists

From [coreyhaines31/marketingskills, ads, platform-setup-checklists.md], corrected where marked. Tracking code is in [CONVERSION-TRACKING-WEB.md](CONVERSION-TRACKING-WEB.md); current image sizes and text limits in [ad-creative PLATFORM-SPECS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ad-creative/PLATFORM-SPECS.md) (the source's own creative size lists are left out here so the sizes have one definition).

**Google Ads**

- Account: verified, billing, time zone and currency, team access.
- Conversions: Google tag on all pages, conversion actions (purchase, lead, signup) with values, Enhanced Conversions on, a test conversion fired, GA4 import optional.
- Analytics: GA4 linked, auto-tagging on, GA4 audiences available, cross-domain tracking if several domains.
- Audiences: remarketing tag verified; visitor audiences (all visitors 180 days, key pages such as pricing and demo, converters for exclusion); customer match lists uploaded. The source's "Similar audiences enabled" is stale: Google replaced similar segments, "Instead of targeting a similar segment, you can turn on optimized targeting ... and include your first-party data segments as hints" (https://support.google.com/google-ads/answer/12463119).
- Campaign readiness: negative lists ([GOOGLE-SEARCH.md](GOOGLE-SEARCH.md#negative-keywords)), location and language set (location "Presence", not the default), ad schedule (business hours for B2B), device adjustments considered.
- Extensions (the source's word): sitelinks (4 to 6), callouts, structured snippets, call (if phone leads matter), lead form, price, image.
- Brand protection: a brand campaign running, competitor campaigns considered, brand terms negative in non-brand campaigns.

**Meta**

- Foundation: the source says "Business Manager"; business verification if the ad types need it, ad account, payment, roles.
- Pixel: on all pages; standard events PageView, ViewContent, Lead, Purchase, AddToCart and InitiateCheckout for ecommerce; Conversions API; test events in Events Manager. The source's "Event Match Quality score > 6" is a practitioner bar: no Meta threshold was found.
- Aggregated Event Measurement: the source requires domain verification and "Top 8 events prioritized ... for iOS 14+". Jon Loomer (jonloomer.com) reports that in 2025 Meta stopped requiring web event prioritization and domain verification and removed the AEM tab; no Meta help page confirmed it, so check Events Manager before doing either. App campaigns are separate ([app-growth META-ADS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/META-ADS.md#ios-14-skadnetwork-and-aem)).
- Audiences: website visitors (30, 60, 90, 180 days), key pages, video viewers, engagers, customer list; lookalikes (1%, 1 to 3%); saved audiences.
- Catalog (ecommerce): connected, feed updating, catalog sales and dynamic product ads.
- Compliance: the source lists Special Ad Categories as "housing, credit, employment, politics". Meta: "The Credit Special Ad Category has been replaced by the Financial Products and Services category", required since January 21, 2025 for advertisers based in the US or targeting the US (https://www.facebook.com/business/help/399587795372584). Ads about social issues, elections or politics go through their own authorization. The landing page and ads must follow Meta's policies.
- UTM parameters on every destination URL.

**LinkedIn**

- Campaign Manager account, Company Page connected, billing, team access.
- Insight Tag on all pages and verified; URL-based and event-based conversions with values.
- Matched Audiences: website retargeting, company list (ABM), contact list. The source's "Lookalike audiences created" is stale: LinkedIn retired lookalike audiences on February 29, 2024 (https://www.searchenginejournal.com/linkedin-retires-lookalike-audiences-urges-shift-to-new-targeting/506197/), and its targeting page now lists "Matched Audiences and predictive audiences" (https://www.linkedin.com/help/lms/answer/a424655).
- Lead Gen Forms: templates, few fields, privacy policy URL, thank-you message, CRM sync or CSV export.
- Document ads: files uploaded, gating (full or preview), Lead Gen Form connected.
- Budget: realistic for LinkedIn CPCs; sizing in [LINKEDIN-ADS.md](LINKEDIN-ADS.md#audience-sizing); daily vs lifetime budget; bid strategy.

**X:** ads account, payment, verification if required; the X Pixel (the source says "Twitter Pixel") and conversion events; custom audiences of visitors and customer lists (the source's "Tailored audiences"); follower lookalikes; interest and keyword targets; cards configured.

**TikTok:** Ads Manager account, business verification, payment; pixel with ViewContent and Purchase and the Events API; custom and lookalike audiences, interest categories; vertical 9:16 creative that feels native, a hook in the first 3 seconds, captions, licensed music.

**Pre-launch, any platform:** conversion tracking tested with a real conversion; landing page mobile-friendly and fast; UTMs working; budget type, start and end dates correct; targeting matches the intended audience; creative approved; team told; reporting ready [coreyhaines31/marketingskills, ads]. The source's "loads fast (<3 sec)" is not a Core Web Vitals threshold: use web.dev's Core Web Vitals instead, LCP of 2.5 seconds or less (https://web.dev/articles/vitals); measuring it is in [web-performance](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/SKILL.md).

## Audience options per platform

From [coreyhaines31/marketingskills, ads, audience-targeting.md]; the sizes are practitioner guides.

- **Google Search:** exact `[keyword]`, phrase `"keyword"`, broad `keyword` (with smart bidding only); add audiences in observation mode first, switch high performers to targeting; RLSA to bid higher on past visitors, show them different ads, and exclude converters from prospecting.
- **Google Display and YouTube:** custom segments built from converting keywords (the source says "custom intent audiences"), in-market, affinity (awareness), customer match. Not similar segments (above).
- **Meta:** start broad and let delivery optimize; always exclude customers. Custom audiences from website visitors (the source says 180 days maximum), customer lists, video viewers and engagers, app activity. Lookalikes from high-LTV customers (purchasers over leads over visitors), at least 100 source people, ideally 1,000+; 1% is the closest match, 1 to 3% balanced, 3 to 5% scale, 5 to 10% awareness only; exclude the source.
- **Customer list match rates:** the source says "typically 30-70%" for Meta customer lists, and its ABM file says raw work emails match "under ~5%". Both are practitioner; the difference is personal vs work email ([ABM.md](ABM.md#abm-on-meta)).
- **LinkedIn:** titles (specific, verify the normalization), functions (broader, pair with seniority), seniority, skills (self-reported); company size bands 1-10 up to 5000+, industry, company lists, growth rate. Combinations: enterprise = 1000+ employees + VP or CXO + industry; SMB = 11 to 200 + manager or director + function; developer tools = skills + function; ABM = company list + decision-maker titles. Details in [LINKEDIN-ADS.md](LINKEDIN-ADS.md).
- **X:** follower lookalikes of relevant accounts, interests, keywords in posts, conversation topics, events, your own lists; cheaper CPMs than LinkedIn or Meta, less precise.
- **TikTok:** demographics, interests, behaviors, device, custom and lookalike audiences; skews 18 to 34; creative matters more than targeting.

| Platform | Minimum the source recommends | Ideal range |
|---|---|---|
| Google Search | 1,000+ searches a month | 5,000 to 50,000 |
| Google Display | 100,000+ | 500K to 5M |
| Meta | 100,000+ | 500K to 10M |
| LinkedIn | 50,000+ | 100K to 500K |
| X | 50,000+ | 100K to 1M |
| TikTok | 100,000+ | 1M+ |

Too narrow is expensive and learns slowly; too broad wastes spend. Always exclude existing customers (unless upselling), recent converters, sub-10-second bounces, employees, careers and support visitors, and identifiable competitors.

## Common mistakes

Launching without conversion tracking; too many campaigns fragmenting budget; stopping campaigns mid-learning; optimizing the wrong metric; audiences too narrow or overlapping; not excluding customers; one ad per ad set; no creative refresh; ad and page mismatch; spreading budget thin; big budget swings [coreyhaines31/marketingskills, ads].

## Prove it

A plan for a $99-per-seat HR SaaS with $15k a month names its platforms with reasons, a structure with names in the pattern above, targeting per platform, a budget split, success metrics and a scaling plan [coreyhaines31/marketingskills, ads, evals #1]; a retargeting plan has segments by intent, a message and window per segment, frequency caps and exclusions [evals #3]; no checklist line tells anyone to enable similar audiences, create LinkedIn lookalikes, or declare a "credit" category.
