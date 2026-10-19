# ASO audit rubric

A third audit method, for a listing read from its public page: classify the app's brand tier, score six weighted dimensions 0 to 10, flag the common issues, and write a report whose every recommendation is an exact replacement with its character count. It comes from coreyhaines31/marketingskills `aso` (MIT), tagged [coreyhaines31/marketingskills, aso] here; it sits beside the [eronred] score and the [rorkai] offline checks in [AUDIT.md](AUDIT.md). Its rubric bands are the source's practice, not Apple's or Google's; where a band leans on a store claim that the official docs don't support, the line says so. The source rates quick wins High or Medium impact; this file writes them as P1 and P2, the scale in [code-review REVIEWER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/REVIEWER.md).

**Contents:** [Brand tier before scoring](#brand-tier-before-scoring) · [Six dimensions and the grade](#six-dimensions-and-the-grade) · [Dimension rubrics](#dimension-rubrics) · [Common issues checklist](#common-issues-checklist) · [Report rules](#report-rules) · [Report template](#report-template) · [Prove it](#prove-it)

## Brand tier before scoring

[coreyhaines31/marketingskills, aso] Classify the app first: a deliberate brand choice by a household name is not the same as a missed opportunity by an unknown app.

| Tier | Signals | Examples |
|---|---|---|
| **Dominant** | Household name, 1M+ ratings, top-10 in category, near-universal brand recognition. Users search by brand name, not generic keywords. | Instagram, Uber, Spotify, WhatsApp, Netflix |
| **Established** | Well-known in their category, 100K+ ratings, strong organic installs, recognized brand but not universally known. | Strava, Notion, Duolingo, Cash App, Calm |
| **Challenger** | Building awareness, <100K ratings, needs discovery through keywords and ASO tactics. Most apps fall here. | Your app, most indie/startup apps |

- **Dominant adjustments:** brand-only or brand-first titles are valid (score 8+ if the brand is the keyword); the description is scored on conversion quality only, not keyword presence; lifestyle or brand photography instead of UI demos is a legitimate conversion strategy, and no video is acceptable if the product is hard to demo in 30 s or awareness is near-universal; generic release notes at a weekly or faster cadence score 8+; missing in-app events for utility apps with massive install bases is not a penalty; localization is scored against the actual market ("A US-only fintech with 2 languages (English + Spanish) is appropriately localized").
- **Established:** brand-first titles are fine but should still include 1 to 2 keywords; strategic description choices get the benefit of the doubt; everything else is scored normally.
- **Challenger:** "scored strictly against textbook ASO best practices - every character, screenshot, and keyword matters."
- **Key principle:** "Is this a mistake or a deliberate choice by a team that has data I don't?" With 1M+ ratings and a dedicated ASO team, assume the choices are data-informed unless clearly wrong.

## Six dimensions and the grade

[coreyhaines31/marketingskills, aso]

| # | Dimension | Weight | What it covers |
|---|---|---|---|
| 1 | Title & Subtitle | 20% | Character usage, keyword presence, clarity, brand + keyword balance |
| 2 | Description | 15% | First 3 lines, keyword density (Google), CTA, structure, promotional text |
| 3 | Visual Assets | 25% | Screenshot count/quality/messaging, video, icon, feature graphic |
| 4 | Ratings & Reviews | 20% | Average rating, volume, recency, developer responses |
| 5 | Metadata & Freshness | 10% | Category choice, update recency, localization count, data safety |
| 6 | Conversion Signals | 10% | Price positioning, IAP transparency, social proof, download range |

```
Final Score = (Title * 0.20) + (Description * 0.15) + (Visuals * 0.25)
            + (Ratings * 0.20) + (Metadata * 0.10) + (Conversion * 0.10)

Scale to 100: Final Score * 10
```

Example: Title 7, Description 6, Visuals 8, Ratings 9, Metadata 5, Conversion 7 gives 1.4 + 0.9 + 2.0 + 1.8 + 0.5 + 0.7 = 7.3, so 73/100, grade B.

| Score | Grade | Meaning |
|---|---|---|
| 85-100 | A | Well-optimized; focus on A/B testing and iteration |
| 70-84 | B | Good foundation; clear opportunities to improve |
| 50-69 | C | Significant gaps; prioritized fixes will have high impact |
| 30-49 | D | Major optimization needed across multiple dimensions |
| 0-29 | F | Listing needs a complete overhaul |

- **Per dimension:** 9-10 = A, 7-8 = B, 5-6 = C, 3-4 = D, 1-2 = F; 0 means "Cannot assess (data unavailable)".
- **Against [eronred]'s printed weights** ([AUDIT.md](AUDIT.md#the-weighted-score)): both source tables print visual weights totaling 25 (eronred: screenshots 15 + preview 5 + icon 5), but eronred's full iOS table totals 110%, so these are not equal normalized shares. The source tables differ on ratings (20 here, 15 there) and description (15 flat here, 5 iOS and 15 Android there); use the arithmetic correction at that owner when calculating the weighted average. [coreyhaines31/marketingskills, aso; eronred, ASO audit]

## Dimension rubrics

[coreyhaines31/marketingskills, aso] Challenger bands; apply the tier adjustments above first.

### 1. Title & Subtitle (20%)

| Score | Criteria |
|---|---|
| 9-10 | Brand + high-value keyword in title, complementary keywords in subtitle, no word repetition across fields, near max character usage, instantly communicates app purpose |
| 7-8 | Good keyword presence, minor character waste (5+ unused chars), clear purpose |
| 5-6 | Has keywords but poor placement, some repetition between fields, purpose somewhat clear |
| 3-4 | Title is brand-only or generic, subtitle missing or weak, poor character usage |
| 1-2 | No keyword strategy, title doesn't communicate purpose, major character waste |

Check: characters used against the limit ("Near max" = within 3 chars of the limit, 27+/30, 77+/80); primary keyword in the title; duplication between title and subtitle; purpose immediately clear; articles and prepositions eating space; "#1" or "best" claims that risk rejection.

### 2. Description (15%)

| Score | Apple App Store | Google Play |
|---|---|---|
| 9-10 | First 3 lines hook with clear value prop, structured with features/benefits/social proof/CTA, promotional text actively used, compelling and scannable | Keywords in first 3 sentences, 2-3% natural density throughout, HTML formatting used, structured sections, strong CTA, keywords feel natural |
| 7-8 | Good opening, decent structure, could improve scannability or CTA | Good keyword presence, some structure, density slightly off (1-2% or 3-4%) |
| 5-6 | Generic opening ("Welcome to..."), some structure, missing CTA or social proof | Keywords present but sparse (<1%) or stuffed (>5%), weak structure |
| 3-4 | Wall of text, no clear value prop above fold, no promotional text | No keyword strategy visible, poor formatting, wall of text |
| 1-2 | Minimal or boilerplate description, no effort | Minimal description, no keywords, no structure |

Density is target keywords divided by total words, Play only. The other Play density figures ([eronred]'s 3 to 5 mentions, [ApparenceKit]'s 3 to 5 per 1,000 characters) are in [ANDROID.md](ANDROID.md#writing-the-copy).

### 3. Visual Assets (25%)

| Score | Criteria |
|---|---|
| 9-10 | 8-10 screenshots with clear messaging/captions, preview video present, screenshots tell a story in sequence, each communicates one benefit, icon is distinctive and memorable |
| 7-8 | 6-7 screenshots with captions, good icon, no video OR good video but some screenshot messaging unclear |
| 5-6 | 5+ screenshots but weak/no captions, basic icon, no video, screenshots are UI dumps |
| 3-4 | 3-4 screenshots, no captions, generic icon, no storytelling |
| 1-2 | Fewer than 3 screenshots, or screenshots are raw unedited UI, poor icon |

Check: one message per screen in 5 to 7 words; the first 3 screenshots; preview presence; no text in the icon; feature graphic on Play; localized assets. The source also checks "Caption keywords (Apple - indexed since June 2025)", which Apple's docs don't confirm ([KEYWORDS-AND-METADATA.md](KEYWORDS-AND-METADATA.md#what-is-indexed)), and calls the feature graphic "mandatory for featured placements", while Google requires it to publish at all ([ANDROID.md](ANDROID.md#listing-fields)).

### 4. Ratings & Reviews (20%)

| Score | Criteria |
|---|---|
| 9-10 | 4.5+ stars, 10K+ ratings, recent reviews positive, developer responds to negatives, steady review flow |
| 7-8 | 4.0-4.4 stars, 1K+ ratings, mostly positive recent reviews, some developer responses |
| 5-6 | 3.5-3.9 stars, 500+ ratings, mixed recent reviews, no developer responses |
| 3-4 | 3.0-3.4 stars, <500 ratings, negative themes in recent reviews |
| 1-2 | Below 3.0 stars, few ratings, no developer engagement, visible complaints |

0 means no ratings yet. Check the last 5 to 10 visible reviews, complaint themes (bugs, crashes, pricing, UX), reply presence and quality, and the trend.

### 5. Metadata & Freshness (10%)

| Score | Criteria |
|---|---|
| 9-10 | Updated within last month, 10+ localizations, optimal category choice, in-app events/LiveOps active, data safety complete |
| 7-8 | Updated within 2 months, 5+ localizations, good category, data safety present |
| 5-6 | Updated within 3 months, 2-4 localizations, acceptable category |
| 3-4 | Updated 3-6 months ago, 1-2 localizations, possibly wrong category |
| 1-2 | Not updated in 6+ months, single language, poor category choice |

### 6. Conversion Signals (10%)

| Score | Criteria |
|---|---|
| 9-10 | Clear value before download, transparent pricing/IAP, social proof visible (press, awards), download range suggests strong traction, developer credibility strong |
| 7-8 | Good value communication, pricing clear, some social proof |
| 5-6 | Value prop exists but weak, pricing unclear or IAP heavy, limited social proof |
| 3-4 | Unclear what user gets, confusing pricing, no social proof, low downloads visible |
| 1-2 | No value communication, suspicious pricing, app looks abandoned |

Check: price model clear; IAP names communicate value; Play download range ("10K+, 100K+, 1M+ signals trust"); "Editors' Choice" or featured badges; press or awards in the description; other apps from the same developer; privacy practices.

## Common issues checklist

[coreyhaines31/marketingskills, aso]

- **Always flag:** rating below 4.0; last update more than 3 months ago; a Play description under 1% density; no Play feature graphic; an Apple keyword field that likely repeats title or subtitle words (inferred, since the field is hidden); a less competitive category the app would fit; fewer than 5 screenshots (other sources' screenshot counts: [VISUALS.md](VISUALS.md)).
- **Flag for Challenger and Established only:** a brand-only title; a subtitle or short description that duplicates the title; generic first 3 lines; no preview; UI dumps without captions; only 1 to 2 localizations; no in-app events or promotional content.
- **Flag for every tier, with context:** no replies to negative reviews ("responding at 10M+ reviews is a different challenge than at 1K"); generic What's New (acceptable at a weekly or faster cadence for Established and Dominant apps).

## Report rules

[coreyhaines31/marketingskills, aso]

- Every recommendation is specific: "Change subtitle from X to Y", not "Improve subtitle".
- Character counts on every text recommendation.
- Flag Apple and Google differences where they matter.
- "Note what CANNOT be assessed without paid tools (search volume, exact rankings)".
- Explain why each suggested keyword matters.
- The report holds a score card, the top 3 quick wins (under 1 hour, highest impact), per-dimension findings, keyword suggestions, visual recommendations, and an action plan by impact against effort.

## Report template

[coreyhaines31/marketingskills, aso] `references/report-template.md`, with the source's vendor prices removed and its High/Medium impact written as P1/P2.

The keyword table uses the same shared scale: the source's High/Med/Low priorities become P1/P2/P3. [coreyhaines31/marketingskills, aso]

```
# ASO Audit: {App Name}
**Store:** {Apple App Store / Google Play}
**URL:** {listing URL}
**Audit date:** {date}
**Brand tier:** {Dominant / Established / Challenger} - {one-line justification}
**Overall Score:** {score}/100 (Grade: {A/B/C/D/F})

| Dimension | Score | Grade | Key Issue |
|-----------|-------|-------|-----------|
| Title & Subtitle | X/10 | {grade} | {one-line summary} |
| Description | X/10 | {grade} | {one-line summary} |
| Visual Assets | X/10 | {grade} | {one-line summary} |
| Ratings & Reviews | X/10 | {grade} | {one-line summary} |
| Metadata & Freshness | X/10 | {grade} | {one-line summary} |
| Conversion Signals | X/10 | {grade} | {one-line summary} |
| **OVERALL** | **{weighted}/100** | **{grade}** | |
```

Quick wins, three of them:

```
### 1. {Action verb} - {specific change}
**Impact:** {P1/P2} | **Effort:** {<15 min / <30 min / <1 hour}
**Current:** {what it is now}
**Recommended:** {exact replacement, with character count}
**Why:** {one sentence explaining the impact}
```

Per-dimension blocks:

```
**Current title:** "{title}" ({X}/30 chars used)
**Current subtitle/short desc:** "{subtitle}" ({X}/30 or /80 chars used)
**Issues found:** {issues}
**Recommended title:** "{new title}" ({X}/30 chars) - {rationale}

**First 3 lines (above fold):** > {quoted text}
**Keyword density (Google Play only):** {X}% - target: 2-3%
**Missing high-value keywords:** {keyword1}, {keyword2}

**Screenshots:** {count} ({store} shows first {3/all} in search)
**Preview video:** {Yes/No}   **Feature graphic (Google Play):** {Yes/No}
**Screenshot audit:** 1. {description} - {pass/issue}

**Average rating:** {X.X} stars ({count} ratings)
**Common complaints:** {theme1}, {theme2}
**Developer responses:** {Yes, active / Sporadic / None}

**Last updated:** {date} ({X days/months ago})
**Localizations:** {count} languages   **In-app events/LiveOps:** {Yes/No}

**Price model:** {Free / Freemium / Paid}   **IAP count:** {count}
**Downloads (Google Play):** {range}   **Social proof visible:** {awards, press, badges - or "none"}
```

Keywords, competitors and the plan:

```
| Keyword | Rationale | Where to Place | Priority |
|---------|-----------|----------------|----------|
| {keyword} | {why this keyword} | {title/subtitle/description/keyword field} | {P1/P2/P3} |

| Metric | {Your App} | {Competitor 1} | {Competitor 2} |
|--------|-----------|----------------|----------------|
| Title keywords | ... | ... | ... |
| Rating | ... | ... | ... |
| Overall ASO score | ... | ... | ... |

### Do This Week (Quick Wins)
### Do This Month (Medium Effort)
### Plan for Next Quarter (High Effort)
```

The keyword table carries the source's note: without a paid ASO tool there is no exact search volume, so the suggestions rest on category analysis, competitor metadata and semantic relevance. Every report ends with this block:

```
**What this audit cannot measure without paid ASO tools:**
- Exact keyword search volume and difficulty scores
- Historical keyword ranking positions
- Download and revenue estimates
- Apple keyword field contents (hidden from public view)
- Install conversion rate data (only available to app owner in console)
- A/B test results from previous experiments
```

## Prove it

- The report states the brand tier with a one-line reason before any score.
- The overall score equals the weighted sum of the six dimension scores times 10, and its grade matches the band table.
- Every text recommendation quotes the current text, the exact replacement and its character count within the store's limit.
- The Limitations block is present, and no figure in the report claims a search volume or ranking the audit could not measure.
