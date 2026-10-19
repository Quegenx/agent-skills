# Competitors, market and seasons

This is the outside view: what the apps you compete with rank for and change, how the charts in your category move, and when the calendar makes different keywords worth more. Everything here is third-party practice from the [eronred] ASO skills, and nearly all of the data comes from the Appeeky MCP and REST API (`https://api.appeeky.com`, header `X-API-Key`), a third-party data vendor, so chart positions, download estimates and keyword volumes are its estimates, not Apple's or Google's. The source's seasonal rule: only swap evergreen keywords that are already underperforming, and never sacrifice a high-ranking keyword for seasonal speculation.

**Contents:** [Competitor analysis](#competitor-analysis) · [Competitor tracking](#competitor-tracking) · [Market movers and pulse](#market-movers-and-pulse) · [Seasonal ASO](#seasonal-aso) · [Trending moments](#trending-moments) · [Appeeky reference](#appeeky-reference) · [Prove it](#prove-it)

## Competitor analysis

- **One-time teardown vs ongoing tracking:** a named competitor can mean a deep teardown (this section) or weekly tracking (next section); ask which.
- **Find competitors:** the category chart, keyword overlap, "You Might Also Like", and "What would your users use if your app didn't exist?".
- **Pick 3 to 5:** 2 direct, 1 to 2 aspirational, 1 emerging.
- **Compare:**

| Area | What to compare |
|---|---|
| Metadata | each field's character use (e.g. title out of 30) |
| Keyword gap | keywords only they rank for (opportunities), only you rank for (protect), and where they outrank you |
| Creative | screenshot count (target 10), first screenshot, overlays, video, icon |
| Ratings and reviews | average, count, complaint themes |
| Growth signals | chart position, download and revenue estimates, update frequency, in-app events, custom product pages, Apple Ads |
| Monetization | price model, trial length, IAP count, paywall timing |

- **Reading a competitor's reviews** [coreyhaines31/marketingskills, customer-research]: 1 to 2 stars first, then 3-star, then 5-star; "Sort by 'Most Recent' to get fresh signal, then 'Most Critical' for pain themes"; extract "I use this to...", the moment it stopped working, what they switched from. The full playbook is [customer-research SOURCES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/customer-research/SOURCES.md#consumer-products).
- **Output:** an executive summary, a position map, the top opportunities, the threats.
- **Gap analysis per store and locale** with Astro MCP (`extract_competitors_keywords`) is in [AUDIT.md](AUDIT.md).
- **Then:** competitor analysis feeds keyword research, then metadata ("Beat my competitor" = competitor-analysis, keyword-research, metadata-optimization); see [KEYWORDS-AND-METADATA.md](KEYWORDS-AND-METADATA.md).

## Competitor tracking

- **Cadence:** weekly, every Monday. Check pricing and paywalls by hand every 4 to 6 weeks.
- **Watch:** title, subtitle, description and screenshot changes; keywords gained and dropped; rating drops; 1-star surges; chart positions.
- **Deep-dive triggers:** a competitor jumps 10+ chart positions; a competitor changes its title; a new app enters the top 10; your rank drops on a keyword a competitor recently targeted.
- **Responses:**

| Signal | Response |
|---|---|
| A competitor puts your #1 keyword in its title | check your metadata; consider raising Apple Ads bids |
| A competitor drops a shared keyword | double down on it |
| A competitor's rating falls below 4.0 | mention your rating in promotional text |
| A new top-10 entrant | run a full competitor analysis |

- **Semi-automated snapshot** (store the weekly output and diff it against the previous week):

  ```bash
  #!/bin/bash
  APPS=("6759740679" "987654321" "111222333")
  KEY="apk_your_key"

  for APP_ID in "${APPS[@]}"; do
    echo "=== $APP_ID ==="
    curl -s "https://api.appeeky.com/v1/apps/$APP_ID" \
      -H "X-API-Key: $KEY" | jq '.data | {title, subtitle, rating, reviewCount}'
  done
  ```

- **Raising bids and other paid moves** are [app-growth SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/SKILL.md).

## Market movers and pulse

- **Charts:** top-free (default), top-paid, top-grossing; default country US.
- **Movers:** gainers, losers, new top-100 entries, apps that dropped out. For each gainer, work out the cause (viral, update, featuring, ads, seasonal) and whether it will last. Alerts use one line per mover marked as gainer, loser, new or dropped.
- **Pulse briefing:** headlines, chart dynamics, your position (downloads needed to hold it or to move up 10), trending keywords, Apple featuring, new launches and new #1s, category health. Run it weekly.

## Seasonal ASO

- **Lead time:** "Metadata takes 1 to 3 days to index. Plan changes 2 weeks before the event; revert 3 to 5 days after peak."
- **US calendar:**

| Moment | Window | Keywords to target |
|---|---|---|
| New Year | Dec 26 to Jan 7 | "new year", "resolution", "goals", "habit", "fresh start" |
| Valentine's Day | Feb 1 to 14 | "valentine", "love", "couples", "romantic", "gift" |
| Spring and Easter | March to April | "spring", "easter", "refresh", "clean", "declutter" |
| Mother's Day | May 1 to 12 | "mom", "mother", "family", "gift for mom" |
| Summer | June to August | "summer", "vacation", "travel", "outdoor", "beach" |
| Back to School | Jul 15 to Sep 10 | "school", "study", "student", "homework", "planner" |
| Halloween | Oct 1 to 31 | "halloween", "scary", "spooky", "costume", "trick" |
| Black Friday | Nov 20 to 30 | "deal", "sale", "discount", "shopping", "gift" |
| Christmas | Dec 1 to 26 | "christmas", "gift", "holiday", "santa", "family" |
| End of Year | Dec 27 to 31 | "year review", "recap", "goals 2026", "new year" |

- **Pick seasonal keywords by:** a volume spike against the 30-day baseline, difficulty under 60 preferred, and relevance.
- **What changes:** in the keyword field, swap out low-performing keywords for seasonal terms, add 2 to 4 seasonal terms while keeping the best evergreen terms, and remove seasonal terms irrelevant to the core use case; a seasonal hook in the subtitle ("Your Holiday Planner", "New Year Goal Tracker") only if the subtitle isn't keyword-critical; a seasonal frame on the first 2 screenshots; promotional text always ("instant, no review"), for a seasonal call to action, limited-time feature highlights and event tie-ins.
- **Trade-off:** seasonal keywords have temporarily very high volume and very high competition at peak, and rankings drop after the peak; evergreen keywords are stable, moderately competitive and give sustained growth.
- **The rule:** "Only swap evergreen keywords that are already underperforming. Never sacrifice a high-ranking keyword for seasonal speculation."
- **Timeline:**

| Day | Step |
|---|---|
| T-14 | research and brief |
| T-10 | write the metadata and promotional text |
| T-7 | submit screenshot updates |
| T-5 | submit the keyword and subtitle update |
| T-0 | monitor daily |
| T+3 | revert the metadata |
| T+5 | revert the promotional text |

- **Review conflict:** the source marks the T-7 screenshot update "no review needed". [rorkai] says promotional text is "the only metadata field updatable without a new submission", and Apple's docs name promotional text as the field updatable without one; confirm in the current docs before counting on a review-free screenshot swap.
- **Holiday push sequence:** seasonal ASO, then metadata, then an in-app event ([PRODUCT-PAGES.md](PRODUCT-PAGES.md)).

## Trending moments

- **Spot them:** `GET /v1/keywords/trending?country=us&days=3`.
- **Act within 24 to 48 hours,** change only the promotional text, and revert after 3 to 7 days.

## Appeeky reference

Third-party API and MCP; check the vendor's current docs for plans and limits.

- **MCP tools:** `get_market_movers`, `get_market_activity`, `get_category_top`, `get_app`, `get_trending_keywords`, `get_featured_apps`, `get_new_releases`, `get_new_number_1`, `get_downloads_to_top`, `get_app_keywords`, `get_app_reviews`.
- **REST endpoints:** `GET /v1/apps/:id`, `GET /v1/apps/:id/intelligence`, `GET /v1/apps/:id/keywords`, `GET /v1/apps/:id/reviews?sort=recent&limit=20`, `GET /v1/market/movers?genre=[genre_id]&country=us`, `GET /v1/categories/:id/top?country=us&limit=25`, `GET /v1/keywords/ranks?keyword=meditation&country=us&limit=10`, `GET /v1/keywords/metrics?keywords=...&country=us`, `GET /v1/keywords/suggestions?term=...&country=us`, `GET /v1/keywords/trending?country=us&days=7`.
- **Your own App Store Connect numbers** through Appeeky Connect are in [AUDIT.md](AUDIT.md).

## Prove it

- The competitor set has 3 to 5 apps (2 direct, 1 to 2 aspirational, 1 emerging) and every gap claim names the keyword, both ranks and the data source.
- Weekly snapshots exist and are diffed; each deep-dive trigger that fired has a response.
- Every seasonal change has a revert date, and no high-ranking keyword was removed for it.
