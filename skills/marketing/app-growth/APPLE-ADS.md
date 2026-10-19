# Apple Ads

Apple Ads (formerly Apple Search Ads) places your app in the App Store: the Today tab, the Search tab, search results and product pages. Most outcomes come down to two mechanisms: an ad only shows when Apple judges the app relevant to the search (relevance plus bid decide ranking, and no bid buys an irrelevant placement), and the campaign structure keeps exact-match brand, category and competitor keywords apart from a discovery campaign that finds new ones. Apple's help pages and developer docs are the authority here; [eronred] (third-party ASO skills) and [appeeky] (third-party UA skills) add practice and benchmarks, and where they differ from Apple, both are given. Weekly operations and profitability are [APPLE-ADS-OPTIMIZATION.md](APPLE-ADS-OPTIMIZATION.md); the APIs and the `asc ads` CLI are [APPLE-ADS-API.md](APPLE-ADS-API.md); how Apple Ads fits the whole budget is [BUDGET-AND-ROAS.md](BUDGET-AND-ROAS.md); AdServices and SKAdNetwork attribution are [ANALYTICS-AND-ATTRIBUTION.md](ANALYTICS-AND-ATTRIBUTION.md).

**Contents:** [Tiers and naming](#tiers-and-naming) · [Placements](#placements) · [Campaign structure](#campaign-structure) · [Match types](#match-types) · [Search Match](#search-match) · [Negative keywords](#negative-keywords) · [Bidding](#bidding) · [Custom product pages in ads](#custom-product-pages-in-ads) · [Metrics and benchmarks](#metrics-and-benchmarks) · [Prove it](#prove-it)

## Tiers and naming

- **The product is now "Apple Ads".** Help pages live at `ads.apple.com/app-store/help/...`; `searchads.apple.com/help/...` serves the same pages. The tiers are **Apple Ads Basic** and **Apple Ads Advanced**.
- **Basic bids max CPI** (maximum cost per install); **Advanced bids max CPT** (maximum cost per tap). The four placements below are Apple Ads Advanced.
- **Why it comes first on iOS [eronred, appeeky]:** highest intent; ads look like organic results (only an "Ad" badge); keyword-based only, no demographic or interest targeting; CPI is higher but LTV proportionally higher; "Typically 30 to 50% tap-to-install CVR"; no creative needed beyond the product page. [eronred] says conversion data "is reliable (no ATT/SKAdNetwork limitations)" and [appeeky] "Reliable attribution (no SKAN delay)"; Apple's attribution for these ads goes through AdServices (see [ANALYTICS-AND-ATTRIBUTION.md](ANALYTICS-AND-ATTRIBUTION.md)).

## Placements

| Placement | Where | Tap destination and notes |
|---|---|---|
| Today tab | Front page of the App Store | App name, icon, subtitle; always a custom product page, its assets animate in the background in a color from the app icon; deep links on iOS 18+. Name, icon, subtitle and the page's assets must be approved for advertising first |
| Search tab | Top of the suggested apps list | Default or custom product page (with deep link). "Over 70 percent of App Store visitors use search to discover apps." |
| Search results | Top of results or further down | Maximize Conversions or Manage Bids; default ad or ad variations from custom product pages; deep links on iOS/iPadOS 18+. Apple: "more than a 60 percent average conversion rate for ads at the top of search results" |
| Product pages, while browsing | Top of "You Might Also Like" at the bottom of product pages | Name, icon, subtitle; runs across categories or refined categories; not in mainland China |

- **All ads use the metadata and assets already in App Store Connect** and carry an ad disclosure icon. Some app categories aren't eligible on some placements, varying by country or region.
- **You can't pick or bid for a position.** "If your app isn't relevant to what the user is searching for, it won't be displayed, regardless of how much you may be willing to pay."
- **[eronred] differs on search results:** it places the ad "Below the first organic result for a keyword"; Apple says top of results or further down. [eronred] also says "Start with Search Results."
- **Availability:** Today tab, Search tab and search results in 91 countries and regions; product pages in 90 (no mainland China). Mainland China needs the business and app approved, plus additional requirements.

| Feature | Placements |
|---|---|
| Cost-per-tap pricing, daily budget, optional audience settings, daily budget recommendations, Insights, Apple Ads Platform API, Apple Ads Attribution API | All |
| Target CPA, keywords, suggested bid at ad group level, Maximize Conversions, ad variations from custom product pages, keyword and bid recommendations with estimated results | Search results only |
| Custom product page and deep link integration | Today tab, Search tab, search results |

- **Ad groups:** in Today tab, Search tab and product pages campaigns an ad group holds bids and audience settings only. In search results campaigns it can hold bids, audience settings, keywords, negative keywords and ad variations. Each Manage Bids search results ad group should focus on one keyword theme.

## Campaign structure

### Apple's recommendation

- **Four search results campaigns, split by keyword theme:**

| Campaign | Keywords | Settings |
|---|---|---|
| Brand | App and company name | Exact match, Search Match off |
| Category | Nonbranded descriptive terms | Exact match, Search Match off |
| Competitor | Similar apps | Exact match, Search Match off |
| Discovery | Two ad groups: a broad match ad group with every keyword from the other three set to broad, Search Match off; and a Search Match ad group with no keywords, Search Match on | Finds keywords to add to the first three |

- **Put your most aggressive max CPT bids on the highest-performing exact keywords** in brand, category and competitor. When a discovery term performs, add it as an exact keyword in brand, category or competitor. Exact match "is especially useful in brand campaigns and competitor campaigns."
- **Countries:** use a single-country campaign for larger markets that need their own budget or objective, or to learn the value of one country. Use multi-country for ease of management, optimizing by customer value, language, region or sales center, the same customer value across countries, regional sales teams or credit lines, or the first paid campaigns in those markets.
- **Duplication** copies campaigns, ad groups, search results keywords and settings, only into the same placement type.

### Third-party structure

Source: [eronred, appeeky].

- **Account > App > Campaigns:** Brand, Competitor, Category, Discovery (Search Match, no keywords), and an optional Search Tab campaign (no keywords). Separate campaigns give separate budgets (protect brand spend), separate bid strategies, clean data and easy pause and scale. [eronred]
- **Category match type differs:** [eronred]'s ua-campaign says Category uses "broad + exact"; Apple says exact, with broad only in Discovery.
- **Seeds [eronred]:** Brand: app name exact, misspellings, developer name. Competitor: the top 5 to 10 competitor names, exact; bid lower, they convert at lower rates. Category: generic and long-tail terms. Keyword data from the third-party Appeeky API:

```
GET /v1/keywords/metrics?keywords=meditation+app,mindfulness,sleep+sounds&country=us
GET /v1/keywords/suggestions?term=meditation&country=us
```

- **Campaign-type playbook [appeeky]:** Brand: always win brand terms, bid for 80%+ impression share, rarely pause; if brand ROAS < 1.0, fix the product page, not bids. Category: high-intent generic searches, moderate bid, test a custom product page per keyword cluster. Competitor: conservative bid, expect lower CVR; pause terms with CPA > 2× target after $30 spend. Discovery (Search Match): find new keywords cheaply at the lowest bid, mine weekly, "never leave running without negatives".
- **Don't** put broad match keywords in a brand campaign, or scale competitor campaigns with brand-level ROAS expectations. [appeeky]

## Match types

- **Two match types: broad and exact.** Broad is the default for new keywords; exact is the default for negative keywords. [eronred] lists Search Match as a third match type; Apple treats it as a separate feature (below).
- **Broad** runs on relevant variants and related terms, including category terms and similar products' names. "photo edit free" may match "edit photo free, free photos editor, フォトエディター, app for editing photos, photo collage maker, photo filters". It may not suit countries where certain keywords are restricted. Matched terms show in the Search Terms tab.
- **Exact** still includes spelling variations, rearrangements, translations and close variants ("photoeditfree, edit photo free, free photos editor, fre photo editor, free photo editor app, フォトエディター"). Fewer impressions, but TTR and conversions may be higher. Add with brackets: `[keyword]`.
- **A saved keyword's match type can't change:** pause it and re-add it with the other type. Pause a broad keyword whose CPA is above the cap and re-add it as exact.
- **Bulk upload columns** include Keyword ID (blank for new), Keyword, Match Type (`BROAD` or `EXACT`), Status (`ACTIVE` or `PAUSED`).
- **Workflow [eronred]:** Search Match plus broad in discovery, mine the search terms report weekly, move winners to exact in a separate campaign with higher bids. [appeeky] adds: promote profitable Discovery terms (search term ROAS > 1.5×) to exact match in the right campaign (brand, category or competitor).

## Search Match

- **Default for Manage Bids search results campaigns** and required for the automatic ad group in Maximize Conversions campaigns. It matches the ad to searches automatically from the App Store listing metadata, similar apps in the same genre and other search data.
- **Turn it off per ad group:** Campaigns > campaign > ad group > "Edit ad group settings" > Search Match toggle > save. Consider negative keywords alongside it.
- **Reports** have a field saying whether a search results impression came from Search Match or a bidded keyword.
- **Don't pause discovery before mining its search terms.** [appeeky]

## Negative keywords

### How Apple matches negatives

- **Negative exact** blocks only that exact term, not close variants or reordered words: negative exact "kids puzzles" still shows for "kids puzzles apps".
- **Negative broad** blocks when all its words are present, in any order: "kids puzzle games" blocks "puzzle games kids" but not "kids puzzle apps".
- **[appeeky] describes BROAD as blocking "query + close variants"**; Apple's rule is all words present, in any order. Apple's docs are the authority; confirm in the current help page.
- **Levels:** campaign level (most common, for Discovery waste) or ad group level (for example a competitor ad group blocking specific rivals). Don't use ad group level when campaign level fits. [appeeky]

### Finding them

Source: [appeeky, eronred].

- **"Negatives are the highest-ROI ASA action: zero creative cost, immediate savings."** Without them "10 to 30% of ASA spend goes to irrelevant searches", competitor brand terms trigger the ad, and "free" or "hack" searchers never convert. [appeeky]
- **Pull search terms from all campaigns,** brand included: lookback 14 days, minimum $5 spend per term. Category broad match leaks too, not only Discovery. [appeeky]
- **Flag:** irrelevant intent; competitor brands you don't conquest; zero conversions (spend > $20, 0 installs, 14 days); free or crack intent ("free", "hack", "mod apk", "cracked"); wrong platform ("apk", "google play"); wrong category; kids or parental mismatch; low-TTR waste. [appeeky]
- **Default to EXACT** unless 5+ related terms share a pattern, then BROAD. [appeeky]

| Situation | Spend | Installs | Action [appeeky] |
|---|---|---|---|
| Irrelevant | > $5 | 0 | EXACT, campaign level |
| Theme across 5+ terms | > $50 combined | 0 | BROAD |
| Competitor you don't target | > $10 | 0 | EXACT |
| Relevant, poor ROAS | > $50 | > 0 | Lower the bid, NOT a negative |
| Relevant, high ROAS | any | > 0 | Promote to an exact keyword |
| > 1000 impressions, 0 taps | any | 0 | EXACT negative |

- **"Never negative a term that drives profitable installs."** Check search-term profitability first (see [APPLE-ADS-OPTIMIZATION.md](APPLE-ADS-OPTIMIZATION.md)). [appeeky]
- **Thresholds differ inside [appeeky]:** $5 per term in its defaults and matrix versus "spend > $20, zero installs" in its flag list and weekly routine; "500+ impressions, 0 taps" in the flags versus "> 1000 impressions" in the matrix.
- **Account-level negative library [appeeky]:** free intent (free, gratis, kostenlos); piracy (hack, cracked, mod, apk); wrong platform (android, google play, apk download); employment (jobs, hiring, career, for non-job apps); support (customer service, refund, cancel subscription). Add it to Discovery and Category at least; **do not** add it to Brand. [eronred] keeps account-level negatives for untargeted competitor names, irrelevant Search Match terms (weekly) and high-impression zero-tap terms.
- **Savings estimate:** `Estimated weekly savings = (term_spend_14d / 14) × 7`. "Typical first pass saves 10 to 25% of Discovery campaign spend." [appeeky]
- **Cadence:** weekly for Discovery and Category; after a metadata change; for 7 days after a custom product page launch; a monthly audit for over-blocking. [appeeky]
- **Mistakes:** negativing terms with acceptable-ROAS installs; BROAD when EXACT suffices; checking only Discovery; no duplicate check; forgetting competitor names in non-competitor campaigns. [appeeky]

## Bidding

### Max CPT (Manage Bids)

- **Max CPT is the most you'll pay for a tap.** You pay only when the ad shows and is tapped; the actual price may be lower, set by a dynamic pricing mechanism (relevance, your bid, other advertisers' bids, user experience, a reserve price).
- **Apple's starting formula:** if you can afford $2.50 per customer and estimate 40 percent of tappers convert, start the default max CPT at $1.00. [eronred]'s equivalent: Target CPT = Target CPI × historical CVR (installs / taps).
- **Where bids live:** max CPT is set on the ad group and applies to all its keywords unless a keyword bid overrides it; the ad group default still applies to newly added keywords.
- **Bulk edit:** up to 50 keywords per page; a new bid must be below the daily budget; bid changes may not take effect right away. [appeeky]: "ASA needs 3 to 5 days to reflect bid impact"; don't change bids daily.
- **Tiered bidding:** most aggressive bids on important exact keywords, strong bids on broad, moderate bids for Search Match discoveries. Raise max CPT when Search Match terms convert, when a keyword converts below the CPA cap, or when popular keywords get few impressions; lower it when taps bring few conversions at a CPA above the cap.
- **Third-party starting bids [eronred]:** Brand $2 to 5 ("you should always win your brand terms"); Competitor $1 to 2; Category $0.80 to 1.50; Discovery $0.50 to 0.80. Its own ua-campaign skill disagrees on Brand: "Low bids, high volume", target CPA < $0.50. Bid strategy and target CPA by campaign there: Brand low bids, high volume, < $0.50; Category medium bids, $1 to 3; Competitor higher bids, lower volume, $2 to 5; Discovery low bids, broad, $1 to 3.

### CPA cap

- **Optional, tap-through, set on the ad group.** It derives a bid ceiling for every keyword even when their max CPT is higher, limits impressions and installs, is not guaranteed, and never exceeds max CPT. Let the campaign run before setting one.
- **"If you set your CPA cap too low or below your max CPT bid, you may miss out on valuable impressions and conversions."**
- **Removing one:** reduce the bid, wait one day, then remove the cap.
- **Being retired:** Apple says CPA caps "will soon be unavailable" (no date given) on its Maximize Conversions best-practices page. Confirm the current status in the help pages.

### Maximize Conversions (target CPA)

- **A search results bid strategy** for the most tap-through installs at a target CPA, using an auto-bidder and Search Match. "Maximize Conversions is designed to drive the most app downloads at your target CPA on a weekly basis."
- **It creates an Automated Ad Group:** Search Match required, audience "Reach All Eligible Users", ad from the default product page. An optional additional ad group can change the audience, use a custom ad, select or pause keywords and add negative keywords. You can't add or manage keyword bids. AdServices attribution doesn't change. The bid strategy can be changed anytime.
- **Budget for at least five conversions per day,** note Apple offers a target CPA suggestion at creation, pay only on taps, and let it run at least two weeks before judging or changing the target. Daily budget means the average spend per day over a month.
- **Post-launch only:** use manual bids for pre-order campaigns.
- **Third-party threshold differs:** [eronred] says move to automated bidding (target CPA or ROAS) only after "50+ conversions per ad group per week" and a manual CPT baseline. Apple's stated requirement is a budget for at least five conversions per day.
- **History:** Maximize Conversions arrived in Campaign Management API 5.5 (February 2026).

## Custom product pages in ads

- **Ad variations:** search results ad groups can use ads built on custom product pages from App Store Connect, with deep links on iOS/iPadOS 18+. Creating pages needs no new app version, only the Marketing role in App Store Connect; up to 70 pages. Each ad group has only one active custom ad. The default ad uses the default product page's screenshots and previews in upload order and runs where no variation exists or while a custom ad is on hold.
- **Create:** Ad Groups > ad group > Create Ad > name > select custom product page > preview > Save.
- **Align pages with keyword themes and audiences:** a flights page for flight-booking keywords, deep-linking to the booking screen.
- **Naming differs:** [eronred] calls this "Creative Product Sets / CPP routing" (App Store Connect > Custom Product Pages > create > ASA > Ad Group > select CPP) and claims "TTR and CVR both improve (typically +15 to 30%)". Apple deprecated Creative Sets in Campaign Management API 5.0 (May 2024); today's term is ad variations.
- **When TTR is low [appeeky]:** if TTR < 3% on a high-volume ad group, check the page routing, add a page variant matching the keyword intent, and re-test 7 days before changing bids. Creating the pages themselves is [aso PRODUCT-PAGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/PRODUCT-PAGES.md).

## Metrics and benchmarks

- **Apple's definitions:** Average CPA (Tap-Through) = total campaign spend / taps that led to installs; Avg CPT = average paid per tap; TTR = taps / impressions. The dashboard splits Installs and New Downloads and Redownloads into Tap-Through, View-Through and Total, plus Pre-orders Placed.
- **Third-party benchmarks disagree on CVR:**

| Metric | [eronred] apple-search-ads | [eronred] ua-campaign | [appeeky] |
|---|---|---|---|
| TTR | > 5% strong, < 3% investigate creative | CTR > 5% | > 5% strong |
| CVR (installs / taps) | > 50% good, < 30% review product page | > 30% | investigate below 30% |
| ROAS | > 100% profitable, target 150%+ | > 1.0 break even, > 2.0 good | > 1.0 break even, > 1.5 scale |

  Apple cites a 60 percent average conversion rate at the top of search results. [appeeky]: compare ROAS to your own targets, not generic benchmarks (see [BUDGET-AND-ROAS.md](BUDGET-AND-ROAS.md)).
- **Diagnose [eronred]:** impression share < 50% → raise bid; high TTR, low conversion → fix the product page or paywall; low TTR → creative mismatch; high CVR but not scaling → raise bid or budget; CPT rising without CVR gain → lower bid or pause. "Low TTR means creative/metadata problem, not bid problem." [appeeky]

## Prove it

- **Structure:** brand, category and competitor campaigns hold only exact keywords with Search Match off; Discovery has a broad ad group (Search Match off) and a Search Match ad group with no keywords.
- **Search terms:** the Search Terms tab shows matched queries for every broad keyword, and the report field separates Search Match impressions from bidded ones.
- **Negatives behave as Apple defines them:** for each negative exact, a close variant still triggers; for each negative broad, a query containing all its words in another order does not.
- **No profitable term blocked:** every negative was checked against search-term ROAS before it was added, and none is on the Brand campaign from the account library.
- **Bids:** every ad group has a default max CPT, keyword overrides are deliberate, and no CPA cap sits below its max CPT.
- **Maximize Conversions:** the daily budget covers at least five conversions at the target CPA, and the target hasn't changed in the last two weeks.
- **Ad variations:** each search results ad group has at most one active custom ad, linked to a page that matches its keyword theme.
