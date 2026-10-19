# Google Ads audit (ecommerce)

An itemized audit of a live Google Ads and Merchant Center account: 32 checks in 11 categories, built to find wasted spend, uncover prospecting room and surface incremental revenue before scaling. From [coreyhaines31/marketingskills, ads, google-ads-audit-checklist.md] (MIT), which adapts ECHELONN's public Google Ads Audit Checklist (Jackson Blackledge, ECHELONN.IO) and takes the two deep dives from Marek Dąbrowski's "The Paid Ads Operator's Guide to Claude" (Adlume, 2026-07-16).

Load [AUDIT-GUARDRAILS.md](AUDIT-GUARDRAILS.md) first: every check resolves to exactly one of Pass, Fail, Unknown or Not applicable; an Unknown reduces coverage, never health; Shopping checks on a lead-gen account are Not applicable. Work top to bottom. For each item record the result, the evidence you saw (or the missing source), and on a Fail a draft fix, not an applied one.

**Contents:** [Tracking](#tracking) · [Targeting](#targeting) · [Campaign structure](#campaign-structure) · [Merchant Center](#merchant-center) · [Shopping](#shopping) · [Bidding and budget](#bidding-and-budget) · [Search](#search) · [Performance Max](#performance-max) · [Landing page](#landing-page) · [Demand Gen](#demand-gen) · [Conversion signal audit](#conversion-signal-audit) · [Wasted spend and negatives](#wasted-spend-and-negatives) · [Rolling it up](#rolling-it-up) · [Prove it](#prove-it)

## Tracking

1. **Conversion tracking configuration.** One source of truth for purchases. Two systems counting one order (GA4 import plus the native tag, or a duplicate gtag) inflate conversions and train the bidder on phantom volume. *Fail on double counting or missing purchase value; Pass on a verified test conversion with the right value and currency.* Setup: [CONVERSION-TRACKING-WEB.md](CONVERSION-TRACKING-WEB.md).

## Targeting

2. **Customer list.** A hashed customer email list is uploaded and *used*: as a signal source for prospecting and as an exclusion where it belongs (existing buyers on non-upsell campaigns). Uploaded but unused is a Fail.
3. **Negative keyword lists** (Search, Shopping). Shared and campaign negatives for irrelevant, out-of-market or unprofitable queries. **No search terms report → Unknown, not Fail.** Never name candidates from imagination; request the report and run the overblocking review.

## Campaign structure

4. **Branded vs non-branded split.** Brand in its own campaign. Brand terms inside generic or catch-all campaigns inflate blended ROAS and hide non-brand waste. Fail if brand and non-brand share a campaign with no way to read them apart.

## Merchant Center

5. **Shipping settings** match real fulfillment. Understated speed loses the auction; overstated speed risks disapproval. Free-shipping thresholds reflected.
6. **Promotions:** live sales and evergreen offers set up as Merchant Center promotions so they show on Shopping ads.
7. **Product feed titles.** The first ~70 characters do the ranking and the clicking: the highest-intent keyword, then the key feature or benefit, before truncation. Brand-first titles waste that space unless the brand is the query.
8. **Product images** stand out in the Shopping carousel (clean, on white where required, distinct from competitors).
9. **Store quality overview:** disapprovals, missing or invalid attributes (GTIN, availability, price mismatches), feed warnings. A disapproved product is silent zero-impression revenue.
10. **Product ratings** sync from the review source and render as stars. A configured feed with no stars is a Fail worth chasing.
11. **Impressions on eligible products:** the whole catalog serves, not a few hero SKUs soaking up impressions. Zero-impression eligible products are untested inventory.

## Shopping

12. **Segmentation:** each Shopping or PMax segment has enough volume (~30 to 50+ conversions a month) for the bidder to learn. Over-segmentation starves every bucket; consolidate before adding structure.
13. **Budget across products:** spend flows to positive-ROI SKUs. Losers eating budget while winners are capped is a reallocation Fail; draft the shift, and don't restructure a learning campaign as a reflex.

## Bidding and budget

14. **Branded bidding** (Search). Brand clicks are cheap and near-certain; loose tROAS or Maximize conversion value can overpay for volume you'd win anyway. Prefer manual or portfolio control or a tight target on brand.
15. **Campaign targets:** every Target ROAS or CPA fits its campaign type (brand vs non-brand, hero vs long-tail). One blanket target across mismatched economics is a Fail.
16. **Non-branded terms in brand campaigns:** generic queries leaking into brand. Move them so brand ROAS isn't propped up by prospecting spend.
17. **Non-branded strategy** (Search, PMax, Shopping, Demand Gen): matched to volume and goal. Value-based bidding needs conversion data; thin campaigns may need manual or tCPA first; a mismatched strategy on low volume never exits learning. Google's own volume requirements are in [GOOGLE-SEARCH.md](GOOGLE-SEARCH.md#bidding-by-conversion-volume).

## Search

18. **New terms for expansion:** converting queries not yet targeted; add them as keywords and feed their language into titles and content. Same report as item 3: pull it once.
19. **Ad copy performance:** CTR relative to impressions, ad strength, underperformers refreshed. Read [Quality Score as a diagnostic](GOOGLE-SEARCH.md#quality-score-and-landing-pages). Google says it is not an auction input (https://support.google.com/google-ads/answer/6167118?hl=en); the old line said weak copy raises CPC through that score.
20. **Brand keyword match types:** exact or phrase only. Broad on brand spends brand budget on loosely related queries.
21. **Brand ad copy:** consistent formatting, USPs first, the promotional calendar tracked.
22. **Quality Score** as a diagnostic (expected CTR, ad relevance, landing page experience), not a metric to game.

## Performance Max

23. **Signals:** asset groups carry audience signals (search themes plus the customer list), not empty fields. Signals are advisory, but empty ones forfeit a lever.
24. **Budget on Shopping:** a meaningful share of PMax spend lands on Shopping (from the account report or product data) rather than low-intent display and video. Brand exclusions and negatives: [GOOGLE-SEARCH.md](GOOGLE-SEARCH.md#performance-max).

## Landing page

25. **Comparison page funnel.** The source looks for "a listicle-style review page on an independent domain that positions the brand as #1" as a cold-traffic funnel. That is legal risk if the brand controls the page and doesn't say so: the FTC's rule on consumer reviews and testimonials prohibits "misrepresenting that a website or entity it controls provides independent reviews or opinions about a category of products or services that includes its own products or services" (https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials, 16 CFR Part 465). Audit it as: an owned comparison page that discloses ownership. Honest comparison pages: [comparison-pages](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/comparison-pages/SKILL.md).
26. **Head-to-head competitor pages** ("us vs them") for comparison-stage demand. Absence is an opportunity, not a defect.
27. **Advertorials:** cold traffic met with a story-led page, not only a raw product page.
28. **Above-the-fold match:** the ad's promise (offer, price, hero product) is clearly on the page above the fold. The source calls ad-to-page mismatch the highest-leverage post-click fix.

## Demand Gen

29. **Performance by format:** Shorts, In-Stream, In-Feed + Discovery, Gmail, Display read separately; a blended number hides the winner and the drain.
30. **Quiz funnel for cold traffic:** a quiz that warms and segments cold Google or Demand Gen traffic. Its absence is a gap to flag.
31. **Demographics:** age, gender, parental status and household-income bands, to catch mis-serving and inform exclusions.
32. **Top-of-funnel campaign** (Search): something reaches cold audiences, with a conversion goal, not a bare awareness objective. All-bottom-funnel accounts cap at existing demand.

## Conversion signal audit

Item 1 asks whether conversions are counted correctly; this asks whether the bidder learns from the right actions. Smart Bidding optimizes toward whatever is in the Conversions column, so a cheap action there trains the account to buy more of it.

Pull every active conversion action with its category, count setting (one or every), value (static or dynamic), primary or secondary status and recent volume. Then check:

1. **Low-intent actions feeding bidding:** newsletter signups, page views, scroll depth, add-to-cart on a lead-gen account, any form fill sales wouldn't call a lead. Primary means the bidder chases it.
2. **Double counting:** one event tracked twice (GA4 import plus the native tag, two tags on one thank-you page), or a lead action counting "every" when a person can submit twice.
3. **Value mismatches:** a static value on an action whose value varies, or values that ignore margin or close rate.
4. **Primary vs secondary:** only revenue or qualified pipeline is primary; keep the rest secondary so you can still report on it.
5. **Lead quality:** join a sample of recent conversions to CRM outcomes; an action whose leads rarely become opportunities shouldn't teach the bidder.

End with the single change most likely to improve lead or revenue quality and what to verify first. "Changing which actions are primary resets learning on every campaign that uses them," so draft it for approval and time it outside a peak.

## Wasted spend and negatives

With a search terms report (and a placement report for Display, PMax or Demand Gen) for the last 30 to 60 days:

1. **Flag terms and placements with spend above target CPA and zero conversions,** after the break-even CVR check in [READING-AD-DATA.md](READING-AD-DATA.md#small-numbers).
2. **Group them by reason:** irrelevant intent, wrong geography, junk placements, unwanted competitor terms, job seekers.
3. **Split the list:** *safe to add now* (clearly irrelevant to anything you sell) and *check before excluding* (brand-adjacent terms, research queries, anything that might assist a later conversion; these need a human).
4. **Total what each list would have saved last period;** that number gets the list reviewed.

The negatives stay a draft. Run the overblocking review on every candidate and check match-type mechanics ([GOOGLE-SEARCH.md](GOOGLE-SEARCH.md#negative-keywords)).

## Rolling it up

- Score only verified items; present health and evidence coverage as two numbers.
- Below 60% coverage, report findings and unknowns instead of a score.
- List every Unknown with the exact evidence that would resolve it (usually the search terms report, Merchant Center access, conversion-action settings, or account-level PMax and Demand Gen reports).
- Deliver Fails as drafts (current state → change → expected effect → rollback), ranked P0 to P3 when the report needs a ranking ([AUDIT-GUARDRAILS.md](AUDIT-GUARDRAILS.md#audit-scoring)).

## Prove it

Asked to audit a DTC account with Shopping, PMax and Demand Gen, Merchant Center access but no search terms report: the audit walks all 32 checks, marks items 3 and 18 Unknown (not Fail) and requests the report without naming negatives, covers feed, segmentation, PMax and Demand Gen depth, keeps health and coverage apart, and delivers Fails as drafts with a rollback [coreyhaines31/marketingskills, ads, evals #8].
