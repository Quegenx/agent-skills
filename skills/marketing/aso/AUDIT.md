# ASO audit

An audit scores a store listing field by field, finds wasted characters and repeated words, and turns the gaps into a ranked fix list. In the [eronred] score the title weighs most (20%), then the subtitle, keyword field, screenshots and ratings (15% each). Three third-party methods exist and all are kept: a weighted 0 to 100 score [eronred] and six offline checks on the pulled metadata files run with the asc CLI [rorkai] here, and a brand-tier-adjusted six-dimension score with its report template [coreyhaines31/marketingskills, aso] in [AUDIT-RUBRIC.md](AUDIT-RUBRIC.md). Apple's and Google's docs set the limits they check against; [eronred], [rorkai], [coreyhaines31/marketingskills, aso] and the Appeeky data API are third-party. Third-party benchmark figures are collected in [BENCHMARKS.md](BENCHMARKS.md).

**Contents:** [Inputs](#inputs) · [The weighted score](#the-weighted-score) · [Offline metadata checks](#offline-metadata-checks) · [Keyword gaps with data](#keyword-gaps-with-data) · [App tags and Apple's search plan](#app-tags-and-apples-search-plan) · [Report and fix order](#report-and-fix-order) · [Reading your own numbers](#reading-your-own-numbers) · [Prove it](#prove-it)

## Inputs

- **Identify the app and scope:** App ID (Apple numeric ID or Google Play package name), target country (default US), platform (iOS, Android or both). [eronred]
- **Read the shared product context first,** including its [mobile app fields](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md#mobile-app-context). The [eronred] source used `app-marketing-context.md`; recognize that legacy name through the shared context's discovery rules rather than creating a second file. [eronred, app-marketing-context]
- **Find the listing** [coreyhaines31/marketingskills, aso]: `apps.apple.com/{country}/app/{name}/id{digits}` is Apple, `play.google.com/store/apps/details?id={package}` is Google; given only a name, search `site:apps.apple.com "{app name}"` or `site:play.google.com "{app name}"`.
- **Fields to read from a live listing** [coreyhaines31/marketingskills, aso]: Apple: name, subtitle, description, promotional text, primary and secondary category, screenshots (count, order, captions), preview, rating and count, visible reviews, price and IAPs, developer, last updated, version notes, age rating, size, languages, in-app events. Play: name, short and full description, category and tags, feature graphic, screenshots, preview, rating and count, visible reviews, price and IAPs, developer, last updated, What's New, downloads range, content rating, Data safety, languages.
- **What a fetch misses** [coreyhaines31/marketingskills, aso]: stores render client-side, so "note gaps and work with what's available. Ask the user to paste missing fields if critical." A page fetch can't read screenshot images or caption text: capture a full-page screenshot of the listing (or ask the user for one). Apple's promotional text "is often indistinguishable from [the description] in scraped HTML. If you cannot confirm its presence, note this and recommend the user check App Store Connect."
- **Pull the data.** With the Appeeky MCP or API (third-party), fetch metadata, keyword rankings, the top 3 to 5 competitors, category chart position and review sentiment; without it, ask the user. [eronred]
- **For the offline checks, start from canonical files:** `./metadata` from `asc metadata pull`. Normalize `asc migrate export` or `asc localizations download` output into that layout first. Read the latest version directory under `metadata/version/` (highest semantic version) for version fields, and treat `en-US` as the primary locale unless the user says otherwise. The app name may be missing from an export: fetch it with `asc apps info list` or ask, and flag it only when the app-info JSON has a `name` key with an empty value. Uploading the fixed metadata is [app-store-connect SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/SKILL.md) (iOS) and [google-play SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/google-play/SKILL.md) (Play). [rorkai]

## The weighted score

[eronred] Score each factor 0 to 10; the ASO Score is the weighted average out of 100.

**Source arithmetic correction:** the printed iOS percentage weights below sum to 110%, not 100%; using the printed Android description weight would sum to 120%. Preserve the source values, but do not report their unnormalized sum as a score out of 100. Divide the weighted sum of the 0 to 10 factor scores by the actual sum of their selected weights, then multiply that 0 to 10 average by 10. Keep the separate Play out-of-60 method below distinct. [eronred, ASO audit; arithmetic from the source table]

| Factor | Weight | Key checks |
|---|---|---|
| Title | 20% | #1 keyword; close to 30 chars; brand vs keyword balance; readable; unique |
| Subtitle (iOS) | 15% | secondary keywords not in the title; a benefit; about 30 chars |
| Keyword field (iOS) | 15% | no repeats; commas without spaces; singular; all 100 used; all relevant; no brand, category or "app" |
| Description | 5% iOS / 15% Android | first 3 lines hook; benefits; Android keyword density; formatting; CTA; social proof |
| Screenshots | 15% | all 10 slots; first 3 strongest; captions; consistency; localized; modern frames or frameless |
| App Preview video | 5% | exists; hook in the first 3 s; 15 to 30 s; works without sound |
| Ratings and reviews | 15% | 4.5+; count; 30-day trend; replies to negatives; strategic prompts |
| Icon | 5% | distinct; simple at small size; fits the category; no text |
| Keyword rankings | 10% | top 10 for target keywords; coverage; trend; gap to competitors |
| Conversion signals | 5% | promotional text; What's New; In-App Events; Custom Product Pages |

- **Title bands:** 9 to 10 = primary keyword plus brand, natural, full characters; 7 to 8 = has the keyword, room to optimize; 4 to 6 = missing the primary keyword or poor balance; 0 to 3 = generic, no keywords, or truncated.
- **Play variant:** score Title, Short description, Full description, Screenshots, Feature graphic and Ratings 1 to 10 each, overall out of 60, plus the top 3 improvements.
- **The other weighting:** [coreyhaines31/marketingskills, aso] weighs Title & Subtitle 20%, Description 15%, Visual Assets 25%, Ratings & Reviews 20%, Metadata & Freshness 10%, Conversion Signals 10%, after a brand-tier adjustment ([AUDIT-RUBRIC.md](AUDIT-RUBRIC.md)).
- **Check against the official limits,** not only the third-party ones: [KEYWORDS-AND-METADATA.md](KEYWORDS-AND-METADATA.md) has both stores' field limits and the places they disagree.

## Offline metadata checks

[rorkai] Run per locale on the pulled `./metadata` files; they read local files only, with no network calls. The source introduces them as "these 5 checks" but lists six; all six are kept.

Source severity mapping: Error becomes P1, Warning P2 and Info P3 in this report, using the [shared severity convention](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/REVIEWER.md#tags-and-output). These labels do not imply P0 urgency. [rorkai]

| # | Check | Rule | Severity |
|---|---|---|---|
| 1 | Keyword waste | tokens of the subtitle (and name) that also appear in keywords | P2 |
| 2 | Underutilized fields | keywords under 90/100 ("90%+ usage maximizes indexing"); subtitle under 20/30 ("65%+ usage recommended") | P2 |
| 3 | Missing fields | `subtitle`, `keywords`, `description`, `whatsNew` | P1 |
| 4 | Bad separators | spaces after commas, semicolons, pipes | P1 |
| 5 | Cross-locale gaps | keywords identical (case-insensitive) to the primary locale: likely not localized | P2 |
| 6 | Description keyword coverage | substring check including inflections; don't flag Latin keywords in non-Latin descriptions | P3 |

- **Tokenize by script:** Latin and Cyrillic split on whitespace, strip punctuation, lowercase; CJK split on `、` `，` `,` or per character; Arabic also strips the ال prefix ("القرآن" flags "قرآن").
- **Non-Latin storefronts:** Arabic ال normalization is "likely"; hamza variants ("قران" vs "قرآن") target different queries; Chinese tokens split on `、` and `，`; in Cyrillic storefronts, include the Latin spelling (e.g. "quran") for Latin-script searchers.
- **Cross-field combinations count:** Apple's full-text search combines words across title, subtitle and keywords, so "namaz" in keywords plus existing "vakti" makes "namaz vakti" (popularity 66), and "holy" plus subtitle "Quran" makes "holy quran" (58).
- **Description coverage is for conversion:** Apple doesn't index the description, but users who see their search terms in it are more likely to download, which "indirectly boosts rankings"; weave missing keywords into existing sentences.
- **Promotional text** appears in the utilization table for completeness only; no check validates it, since Apple doesn't index it.
- **What's New missing is not an error on a first version:** Apple doesn't offer What's New for the first version and requires it for every later one.

## Keyword gaps with data

- **Validate keywords with popularity data; never guess.** [rorkai]
- **Astro MCP (third-party, optional) [rorkai]:** `get_app_keywords`, `get_keyword_suggestions`, `search_rankings`, `extract_competitors_keywords` (3 to 5 competitors, per store; called "the highest-value Astro tool"), `add_keywords` (only when the user authorizes tracking setup), `mcp__astro__add_app`. Run per store and locale, not just the US store, since popularity varies across markets; diff suggested and competitor keywords against the tokens in the subtitle, name and keyword field, and rank gaps by popularity with their source (competitor or suggestion). Report untracked stores as unavailable and continue: empty rankings for an untracked store do not prove poor performance. Astro is additive; the audit is useful without it. When it isn't available, the report says "Connect Astro MCP for keyword gap analysis" or "Add app to Astro with `mcp__astro__add_app` for gap analysis".
- **Appeeky (third-party) [eronred]:** keyword rankings, competitor keywords and charts come from its MCP or REST API (`X-API-Key` header); endpoints are in [COMPETITORS-AND-MARKET.md](COMPETITORS-AND-MARKET.md).

## App tags and Apple's search plan

- **App tags are Apple-generated and not editable.** Apple generates them with large language models from the metadata you provide and may show them in search results. Read them for context only [rorkai]: note when they reinforce the subtitle and keyword strategy; when they point to an unintended category or use case, recommend metadata or category changes that may improve future classification; don't promise that metadata changes will change tags immediately.

  `asc app-tags list --app "APP_ID" --output json` and `asc app-tags view --app "APP_ID" --id "TAG_ID" --output json`

- **Apple's Search Plan (experimental, read-only; needs App Store Connect and Ads auth) [rorkai]:**

  ```bash
  asc optimize search plan \
    --app "APP_ID" \
    --version "1.2.3" \
    --ad-account "AD_ACCOUNT_ID" \
    --country "US" \
    --genre "PRODUCTIVITY_UTILITIES" \
    --locale "en-US" \
    --out-dir ".asc/optimization/1.2.3" \
    --output markdown
  ```

  Authenticate App Store Connect with `asc auth` and Apple Ads separately with `asc ads auth login`; the two credential sets are independent. Treat the generated CSV and JSON files as review artifacts. It does not apply metadata, exact keywords or negative keywords, and partial Apple Ads source failures stay visible in the report. Keep popularity, paid reach, paid outcomes and metadata coverage as separate numbers, and do not infer organic rank or difficulty from it.

## Report and fix order

- **[rorkai] template:** Field Utilization (Name 30, Subtitle 30, Keywords 100, Promotional Text 170, Description 4000), an Offline Checks table, a Keyword Gap table, then Recommendations ordered errors, keyword waste, utilization, gaps.
- **[coreyhaines31/marketingskills, aso] template:** header with the brand tier, score card, three quick wins with current text, exact replacement and character count, per-dimension findings, a keyword table, a competitor table, a week/month/quarter plan and an always-present Limitations block ([AUDIT-RUBRIC.md](AUDIT-RUBRIC.md#report-template)).
- **[eronred] template:** a score card with bars; Quick Wins (today, 3 to 5); High-Impact Changes (this week, 3 to 5); Strategic Recommendations (this month, 3 to 5); a comparison against the top 3 competitors.
- **[rorkai] keyword follow-up:** `asc metadata keywords diff`, then `asc metadata keywords apply ... --confirm` (or `keywords sync --input "./keywords.csv"` for external research), then re-run the audit to verify the fixes. Other fixes go out through the metadata workflow in [app-store-connect SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/SKILL.md) or [google-play SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/google-play/SKILL.md).

## Reading your own numbers

[eronred] Apple's own view first ([Apple, Search](https://developer.apple.com/app-store/search/)): App Analytics shows "impressions, conversion rate, downloads"; "filter by source type ... to understand how many people downloaded your app from App Store search. Keep in mind that your Apple Ads performance shows up here as well."

Data here comes from App Store Connect through Appeeky Connect (third-party): connect App Store Connect in Settings > Integrations > App Store Connect; Indie plan or higher, 2 credits per request; nightly sync; up to 90 days of history. Endpoints: `GET /v1/connect/metrics/apps`, `GET /v1/connect/metrics?from=YYYY-MM-DD&to=YYYY-MM-DD`, `GET /v1/connect/metrics/apps/:appId?from=...&to=...` (response `daily[]`, `countries[]`, `totals`).

- **Compare periods:** downloads, revenue, subscriptions, trials, trial to subscription rate. Downloads up with revenue flat points at pricing or the paywall; trials up with conversions flat points at the paywall or onboarding.
- **Daily trend:** spikes, drops, and the 7-day moving average against the prior 7 days. Alert when a change exceeds 20%.
- **Countries:** top 5 by downloads and by revenue; high downloads with low revenue, or low downloads with high revenue, is a localization candidate.
- **Benchmarks** (third-party; more in [BENCHMARKS.md](BENCHMARKS.md)): ARPD (revenue / downloads) above $0.05 good, above $0.20 excellent; trial rate (trials / downloads) above 20% means strong paywall reach; subscription conversion (subs / trials) above 25% strong.
- **"Why did my downloads drop?":** find the start date in the daily trend, check whether an update shipped that day, then keyword rankings, then competitor activity.
- **Revenue, paywall and paid acquisition problems** leave ASO: see [app-growth SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/SKILL.md).

## Prove it

- Every field in every locale is within the official limit (Apple: name 30, subtitle 30, keywords 100, promotional text 170, description 4000; Play: name 30, short description 80, full description 4000).
- No token in the keyword field also appears in the name or subtitle of the same locale, and no keyword list contains a space after a comma, a semicolon or a pipe.
- Keyword field uses at least 90 of 100, subtitle at least 20 of 30; no non-primary locale has keywords identical to the primary.
- `subtitle`, `keywords` and `description` exist in every locale, and `whatsNew` in every locale of every version after the first.
- Every recommended keyword has a popularity or volume number from a data source behind it.
- A weighted score uses the actual total of its stated weights; the source's 110% iOS table is not treated as a normalized 100% table. The independent six-dimension rubric and Play out-of-60 score remain distinct. [eronred; coreyhaines31/marketingskills, aso]
