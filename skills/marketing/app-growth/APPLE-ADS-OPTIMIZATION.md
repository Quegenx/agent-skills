# Apple Ads optimization and ROAS

Running Apple Ads week to week: pacing, bid changes, search term mining, negatives, and deciding which keywords make money. The mechanism that decides most outcomes is the revenue join: Apple Ads reports spend, taps and installs, "but revenue lives in RevenueCat", so a cheap-install keyword can attract trial churners while an expensive brand term brings the highest-LTV subscribers. Everything in this file is third-party practice: [appeeky] (UA skills built on the vendor Appeeky MCP server, whose tool names appear below) and [eronred] (ASO skills). Apple's own rules for bids, match types and Maximize Conversions are in [APPLE-ADS.md](APPLE-ADS.md) and win where they differ. The same edits through Apple's APIs or the `asc ads` CLI are [APPLE-ADS-API.md](APPLE-ADS-API.md); targets such as LTV and target CPA come from [BUDGET-AND-ROAS.md](BUDGET-AND-ROAS.md).

**Contents:** [Before you start](#before-you-start) · [The weekly routine](#the-weekly-routine) · [Pacing](#pacing) · [Bid rules](#bid-rules) · [Search term mining](#search-term-mining) · [ROAS analysis](#roas-analysis) · [Scaling (admaxxing)](#scaling-admaxxing) · [Thresholds that disagree](#thresholds-that-disagree) · [Appeeky MCP tools for Apple Ads](#appeeky-mcp-tools-for-apple-ads) · [Prove it](#prove-it)

## Before you start

- **Connect both sides or stop.** Check `asa_credentials_status`, `rc_overview` (with `rc_key` and `rc_project`) and `asa_playbook_status`. "If ASA or RC not connected, list what's missing and stop: don't guess profitability from ASA spend alone." [appeeky]
- **Readiness for recommendations:** `asa_playbook_status` needs Apple Ads connected, RevenueCat connected, attribution enabled (RevenueCat must carry Apple Ads media source attributes) and enough data. Fixes: connect in Appeeky Settings; supply `rc_key` and `rc_project` or use Appeeky Connect; low data → wait 7 to 14 more days and lower `min_spend` temporarily; attribution gap → enable RevenueCat's Apple Ads attribution and verify the MMP to RevenueCat pipeline. "Do not pull recommendations until readiness passes." [appeeky]
- **Install credit needs AdServices** (not legacy iAd), and RevenueCat's Apple Ads attribution attributes enabled; see [ANALYTICS-AND-ATTRIBUTION.md](ANALYTICS-AND-ATTRIBUTION.md). [appeeky]
- **Windows:** last 7 days for actions, last 14 days for profitability. [appeeky]

## The weekly routine

| Day | Job [appeeky] | Tools |
|---|---|---|
| Monday | Reports and pacing | `asa_report_keywords`, `asa_report_search_terms` |
| Tuesday | Profitability, keyword level | `asa_profitability` |
| Wednesday | Bid and keyword changes | `asa_update_targeting_keywords`, `asa_create_targeting_keywords` |
| Thursday | Negatives | see [APPLE-ADS.md](APPLE-ADS.md#negative-keywords) |
| Friday | Scale review, cross-checked against Tuesday's profitability | `asa_playbook_status`, `asa_admaxxing_recommendations` |

Compress it into one session in the same order if needed. List campaigns first with `asa_list_campaigns`. Monday's calls:

```
asa_report_keywords
  campaign_id: "<id>"
  days: 7

asa_report_search_terms
  campaign_id: "<id>"
  days: 7
  limit: 100
```

- **[eronred]'s weekly checklist:** move search terms to exact; add new negatives; adjust where impression share < 50%; "Pause keywords with 100+ taps and 0 installs"; check TTR per ad group and test a new custom product page if < 3%; no campaign hitting its daily cap before noon; compare CVR across campaigns.
- **[eronred]'s ua-campaign checklist** adds: pause CPA > 2× target; raise bids where CPA < target; custom product pages per keyword intent; day-of-week and time bid adjustments.

## Pacing

| Signal | Action [appeeky] |
|---|---|
| Hits the daily cap before 2pm | Budget +20% or raise the cap |
| Spends < 50% of budget | Lower bids or expand keywords |
| One keyword > 40% of spend | Diversify or cap its bid |
| Zero impressions on new keywords | Raise the bid 20% or check the match type |

## Bid rules

- **Tuesday buckets,** for every keyword with $20+ spend over 14 days [appeeky]:

| Bucket | Condition | Action |
|---|---|---|
| Scale | ROAS > target, low impression share | Bid +10% |
| Hold | | |
| Trim | ROAS 0.7 to 1.0× target | Bid −15% |
| Pause | ROAS < 0.7× target, $50+ spend | Pause |
| Promote | Search term ROAS > 1.5×, not yet a keyword | Add as exact |

- **Wednesday rules [appeeky]:** ROAS < 1.0 and spend > $50 → −15% or pause; ROAS > 2.0 at rank 5 to 15 → +10%; ROAS > 1.5 at rank 1 to 3 → hold ("don't overbid"); high impressions, 0 taps → pause if TTR < 1%; 100+ taps, 0 installs → pause immediately; new high-intent search terms → exact match in the category campaign.
- **"Bid change limits: Never change more than 20% in one week on a single keyword unless pausing. Large swings destabilize Apple's auction learning."** [appeeky] Its own pacing rule ("raise bid 20%" for zero impressions) sits at that limit.
- **Write calls:** `asa_update_targeting_keywords` (`campaign_id`, `ad_group_id`, bid and status per keyword ID), `asa_create_targeting_keywords`, `asa_targeting_keyword_recommendations`, `asa_bid_recommendations` (with `keywords: ["meditation", "sleep tracker"]`). [appeeky]

## Search term mining

- **Pull the search terms report; keep terms with installs > 0 OR taps > 10;** drop terms already targeted as exact; add the top performers as exact in the right campaign (brand, category or competitor); send irrelevant ones to Thursday's negatives. [appeeky]
- **Mistakes:** changing bids daily; pausing discovery before mining it; ignoring TTR. [appeeky]

## ROAS analysis

- **The primary call** [appeeky]:

```
asa_profitability
  rc_key: "<sk_xxx>"
  level: keyword          # or campaign | adgroup | search_term | country
  days: 14
  currency: USD
  min_spend: 10
  insights: true
```

| Parameter | Use for [appeeky] |
|---|---|
| `level: keyword` | Weekly work and bids |
| `level: campaign` | Budget across campaign types |
| `level: adgroup` | Comparing custom product pages |
| `level: search_term` | Negatives |
| `level: country` | Geo ROAS |
| `days: 7` / `days: 30` | Recent changes / apps with stable LTV |
| `min_spend: 20` | Filtering noise |

- **Supporting calls:** `rc_overview` (MRR baseline) and `rc_attribution_summary` (Apple Ads share against other media sources). [appeeky]
- **ROAS, CPA and profit definitions:** use [BUDGET-AND-ROAS.md](BUDGET-AND-ROAS.md#campaign-profitability). [appeeky] uses > 1.0 ROAS as its revenue/spend break-even threshold, > 1.5 to scale, CPA < 0.5× LTV to scale, CVR below 30% to investigate, and TTR > 5% as strong. These thresholds do not prove profit after costs.
- **Source arithmetic error:** [appeeky] said "A 0.9× ROAS app with 60% margins may still be profitable." For the same cohort/window, revenue/spend below 1 means revenue is below ad spend even before store fees or other costs, contradicting its own revenue-minus-spend formula. Compare actual revenue and costs on the same basis; do not invent projected lifetime revenue to rescue that claim ([canonical formulas](BUDGET-AND-ROAS.md#campaign-profitability)).
- **Rank by profit, not ROAS:** "A keyword with $200 profit at 1.2× ROAS beats one with $20 profit at 3.0× ROAS." [appeeky]

| Campaign type | Expected ROAS [appeeky] | If below |
|---|---|---|
| Brand | 1.5 to 3.0× | Investigate product page CVR |
| Category | 0.8 to 1.5× | Test custom product page routing |
| Competitor | 0.5 to 1.0× | Tighten bids, add negatives |
| Discovery | Variable | Mine search terms, promote winners |

- **Bleeders** meet all of: ROAS < 1.0 (or target), spend > `min_spend`, 7+ days and 20+ taps → pause or cut the bid. **Scalers:** ROAS > 1.5×, impression share < 50%, CVR stable 7+ days → bid +10 to 15%, validated in admaxxing. [appeeky]

| Pattern | Meaning | Action [appeeky] |
|---|---|---|
| High TTR, low CVR | Product page mismatch | Test a custom product page |
| Low TTR, decent CVR | Irrelevant keyword or weak creative | Pause or negative |
| High spend, 0 RevenueCat revenue | Attribution gap or bad traffic | Check RevenueCat's Apple Ads attributes |
| Brand ROAS < 1.0 | Onboarding or paywall problem | Fix those, "not more bids" |
| Profitable Discovery terms | | Promote to exact |

| Decision | Minimum data [appeeky] |
|---|---|
| Keyword bid change | $20+ spend, 7+ days |
| Campaign budget change | $100+ spend, 14+ days |
| Geo expansion | 50+ conversions in the home geo |
| ROAS trend call | 30+ days or 100+ installs |

## Scaling (admaxxing)

"Admaxxing" is [appeeky]'s automated layer on top of ROAS analysis: it joins Apple Ads spend with RevenueCat revenue and recommends scaling winners, pausing or trimming bleeders, negatives, geo expansion, and blocking scale when the App Store rating is too low.

```
asa_admaxxing_recommendations
  rc_key: "<sk_xxx>"
  app_id: "<apple_app_id>"
  level: "keyword"
  days: 14
  min_spend: 20
```

| Recommendation | Action | High confidence when [appeeky] |
|---|---|---|
| Scale keyword | Bid +10 to 15% or raise the cap | ROAS > 1.5× for 14 days |
| Pause | Status `PAUSED` | ROAS < 0.5× and $50+ spend |
| Trim | Bid −15% | (medium) ROAS 0.5 to 1.0× |
| Add negative | Campaign negative | $20+ spend, 0 installs |
| Expand geo | After the country gate | (medium) |
| Hold | Nothing | Insufficient data |

- **Priority:** 1 pause bleeders, 2 add negatives, 3 scale winners, 4 expand geo. [appeeky]
- **Validate** with `asa_profitability` (keyword, 14 days, `min_spend: 10`, `insights: true`): "If admaxxing says 'scale' but ROAS dropped 30% in the last 7 days, recommend hold and explain." [appeeky]
- **Country gate before scaling or new geos:** `asa_review_country_gate` with `app_id` and `min_rating: 4.5`. Pass → proceed; fail on low rating → block and route to review management ([aso RATINGS-AND-REVIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/RATINGS-AND-REVIEWS.md)); fail on too few reviews → hold and collect reviews. "Low ratings crush CVR." [appeeky]
- **Execute:** bid change or pause → `asa_update_targeting_keywords`; budget → `asa_update_campaign`; negative → `asa_create_campaign_negative_keywords`; new keyword → `asa_create_targeting_keywords`. "**Always confirm with user before executing write operations** unless they explicitly asked to apply changes." [appeeky]
- **Scale decision [appeeky]:** blended ROAS (14 days) > 1.0×; brand ROAS > 1.0×; top 5 keywords all in profit; country gate passes; not hitting the daily cap by noon; at least 1 custom product page variant live. "If 4+ checks pass → recommend 20% budget increase. If < 3 pass → optimize before scaling."
- **[eronred]'s scaling gate:** CVR > 30% on main campaigns; CPI < 3× target; stable manual bids; negatives maintained; at least 2 custom product page variants tested.
- **Cadence:** weekly on Friday; before a budget increase; after a major app update; monthly alongside campaign profitability ([BUDGET-AND-ROAS.md](BUDGET-AND-ROAS.md)). [appeeky]

## Thresholds that disagree

All within [appeeky] unless noted; none comes from Apple.

- **Pause:** ROAS < 0.5× and $50+ (admaxxing) versus ROAS < 0.7× target and $50+ (weekly buckets) versus ROAS < 1.0 and > $50 → −15% or pause (Wednesday rules).
- **Daily cap timing:** "before 2pm" (pacing) versus "not hitting cap by noon" (scale checks, and [eronred]).
- **Custom product page variants before scaling:** at least 1 live [appeeky] versus at least 2 tested [eronred].

## Appeeky MCP tools for Apple Ads

- **Status:** `asa_credentials_status`, `asa_playbook_status`.
- **Read:** `asa_list_campaigns`, `asa_report_keywords`, `asa_report_search_terms`, `asa_profitability`, `asa_admaxxing_recommendations`, `asa_review_country_gate`, `asa_targeting_keyword_recommendations`, `asa_bid_recommendations`, `asa_list_campaign_negative_keywords`, `asa_list_adgroup_negative_keywords`.
- **Write:** `asa_update_targeting_keywords`, `asa_create_targeting_keywords`, `asa_update_campaign`, `asa_create_campaign_negative_keywords`, `asa_create_adgroup_negative_keywords`.

```
asa_create_campaign_negative_keywords
  campaign_id: "<id>"
  keywords: [{ text: "...", matchType: "EXACT" }]

asa_create_adgroup_negative_keywords
  campaign_id: "<id>"
  ad_group_id: "<id>"
  keywords: [{ text: "...", matchType: "BROAD" }]
```

Check for duplicates first with `asa_list_campaign_negative_keywords` (`campaign_id`) and `asa_list_adgroup_negative_keywords` (`campaign_id`, `ad_group_id`).

## Prove it

- **The join works:** `asa_playbook_status` passes, and `asa_profitability` at `level: campaign` returns revenue for campaigns with installs (high spend with zero RevenueCat revenue points to an attribution gap or bad traffic; check RevenueCat's Apple Ads attributes).
- **Every bid change has the data behind it:** $20+ spend and 7+ days on the keyword, and no keyword moved more than 20% this week unless paused.
- **Ranking is by profit:** the scale list is sorted by profit, not ROAS.
- **Search terms mined before negatives:** every term with installs > 0 or taps > 10 is either an exact keyword or deliberately left out.
- **Scale is gated:** the country gate passed at `min_rating: 4.5` and at least four of the six scale checks hold before a 20% budget increase.
- **Writes were confirmed** with the user before running.
