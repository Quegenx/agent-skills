# Keywords and metadata

Metadata is the text a store indexes and shows: on the App Store, search reads the name, subtitle, keyword field and primary category; on Google Play, the name and the descriptions. Apple ranks on "text relevance (matches for your app's title, subtitle, keywords, and primary category), as well as user behavior (downloads, ratings and reviews, and more)", so most outcomes come down to putting distinct, researched words in the few indexed fields, never wasting characters on repeats, and keeping everything accurate enough to pass review. Limits and rules below come from Apple's and Google's docs unless tagged [eronred] or [rorkai] (third-party ASO skills); where they differ, both are given. Uploading metadata is [../app-store-connect/SKILL.md](../app-store-connect/SKILL.md) and [../google-play/SKILL.md](../google-play/SKILL.md).

**Contents:** [Field limits](#field-limits) · [What is indexed](#what-is-indexed) · [Keyword research](#keyword-research-eronred) · [App Store name and subtitle](#app-store-name-and-subtitle) · [App Store keyword field](#app-store-keyword-field) · [Description, promotional text, What's New](#description-promotional-text-whats-new) · [Rules that get metadata rejected](#rules-that-get-metadata-rejected) · [Localization](#localization) · [Category](#category) · [Prove it](#prove-it)

## Field limits

### App Store

| Field | Limit | Indexed | Notes |
|---|---|---|---|
| Name | 2 to 30 characters | Yes | editable until submission; after that, only with a new version; highest keyword weight [eronred] |
| Subtitle | 30 characters | Yes | second highest weight [eronred] |
| Keywords | 100 (see below) | Yes | hidden; required; localizable; each keyword more than two characters |
| Description | 4000 characters | No | plain text, no HTML; used for web engine search results after release |
| Promotional text | 170 characters | No | appears above the description; updatable without a new submission |
| What's New | 4000 characters | No | shown on update [eronred]; not available for the first version; required for every later one |

- **Keywords: 100 bytes or 100 characters.** App Store Connect Help says "up to 100 bytes of content"; Apple's product page and search pages say "100 characters total". A field that fits 100 bytes fits both; confirm in the current docs.
- **Promotional text is "the only metadata field updatable without a new submission"** [rorkai]; [eronred] uses it for timely messages: seasonal promos, feature launches, awards, events.

### Google Play

| Field | Limit | Indexed [eronred] |
|---|---|---|
| App name | 30 characters, one localized name per language | Yes, highest weight |
| Short description | 80 characters | Yes, high |
| Full description | 4000 characters | Yes, medium |
| Developer name | | Yes, low |

- **Character limits apply to both full-width and half-width characters.**
- Play-specific writing rules are in [ANDROID.md](ANDROID.md).

## What is indexed

- **App Store:** the name, subtitle, keywords and the primary and secondary category are indexed. "Promotional text doesn't affect your app's search ranking." Your app is already searchable by app name and company name.
- **Description and What's New are not indexed** for App Store search [eronred, rorkai]; better description coverage improves conversion, which "indirectly boosts search rankings" [rorkai]. Write keyword echoes in What's New for conversion only [rorkai].
- **Apple indexes each field separately but combines words across them:** full-text search matches words spread across title, subtitle and keywords [rorkai], so don't repeat a keyword across them [eronred].
- **Screenshot captions:** [rorkai] says they are OCR-indexed "since June 2025 algorithm update". Apple's docs read for this skill don't say so; treat it as unconfirmed.
- **App tags:** Apple may show tags in search results "generated using large language models (LLMs) based on the metadata you've provided". They aren't editable.
- **In-App Events:** event names and short descriptions are indexed by App Store search [eronred]; see [PRODUCT-PAGES.md](PRODUCT-PAGES.md).
- **Google Play:** title, short description and full description are indexed, and reviews and replies too (iOS reviews are not) [eronred]. Google penalizes stuffing: repetitive or irrelevant keywords in the app name or descriptions can get the app suspended.

## Keyword research [eronred]

Inputs: App ID, country (default US), 3 to 5 seed keywords, the goal (downloads, revenue or brand).

1. **Expand the seeds:** Apple Search Suggestions autocomplete (variations "[keyword] app", "[keyword] for [audience]", "best [keyword]"; long-tail is often lower competition); the keywords of the top 3 to 5 competitors; the category; synonyms, how users describe the problem, misspellings, abbreviations.
2. **Collect signals per keyword:** Search Volume (1 to 100), Difficulty (1 to 100), Relevance (manual, 1 to 100), Intent ("how to edit photos" vs "photo editor app"), current rank. Volume and difficulty come from a data provider (Appeeky or Astro, both third-party); never guess popularity [rorkai].
3. **Score:**

   ```
   Opportunity = (Volume × 0.4) + ((100 - Difficulty) × 0.3) + (Relevance × 0.3)
   ```

4. **Bucket:** Primary 3 to 5 (must be in the title or subtitle); Secondary 5 to 10 (subtitle and keyword field, may rotate); Long-tail 10 to 20 (fill the keyword field); Aspirational 3 to 5 (high volume and difficulty: track them, don't sacrifice primaries for them).
5. **Place:** `Title (30 chars): [primary 1] + [primary 2]`, `Subtitle (30 chars): [secondary]`, `Keyword Field (100): [remaining, comma-separated]`.

- **Cadence:** update keywords quarterly; track rankings weekly.
- **Appeeky endpoints (third-party):** `GET /v1/keywords/metrics?keywords=...&country=us`, `GET /v1/keywords/suggestions?term=...&country=us`, `GET /v1/keywords/trending?country=us&days=7`, `GET /v1/keywords/ranks?keyword=meditation&country=us&limit=10`, header `X-API-Key`.

## App Store name and subtitle

- **Name:** choose a unique name; balance branding with keyword inclusion [rorkai]. [eronred] formulas: `[Brand] - [Primary Keyword]` ("Calm - Sleep & Meditation"), `[Brand]: [Benefit Phrase]` ("Duolingo: Language Lessons"), `[Primary Keyword] [Brand]` ("Headspace: Mindful Meditation"). Lead with the brand if it's well known, the keyword if not; read naturally; don't stuff; use the full 30; skip ™ and ® (they waste space); offer 3 options with character counts.
- **Subtitle:** avoid generic subtitles such as "world's best app". It must not include inappropriate content, reference other apps, or make unverifiable product claims. [eronred]: never repeat title keywords; benefits, not features; use the full 30; a CTA feel is fine; offer 3 options.

## App Store keyword field

- **Format:** terms separated by commas and no spaces, e.g. `Property,House,Real Estate`.
- **Don't repeat** any word already in the app name, subtitle or category, and don't include the app name or company name (already searchable; Apple adds the name automatically [rorkai]).
- **Skip waste:** plurals of words already included, category names, the word "app", generic terms ("app", "game"), filler words ("the", "to"), duplicates, special characters.
- **Never use** trademarks, celebrity names, irrelevant terms, or the names of competing apps or other companies. Apple may modify inappropriate keywords at any time.
- **Singular vs plural:** Apple says avoid plurals of included words; [eronred] says Apple indexes singular and plural automatically, so use singular forms; [rorkai] says Apple handles stemming and to prefer single words.
- **[eronred] adds:** no "free"; no competitor brand names ("policy violation"); prioritize by volume × relevance; use all 100 characters.
- **Output format** [eronred]: `keyword1,keyword2,keyword3,keyword4,...` then `Characters used: [X]/100`.
- **Common mistakes** [eronred]: repeating keywords across title, subtitle and keyword field; plurals; spaces after commas; brand name in the field; stuffing; unused characters.

## Description, promotional text, What's New

- **Description:** the first sentence matters most; no unnecessary keywords; avoid specific prices. The first 170 characters are visible without tapping "more", and the first 3 lines are the hook [eronred]. [eronred] structure: hook (first 3 lines), social proof, 4 to 6 benefit bullets, how it works (3 steps), testimonial, CTA; line breaks and emoji for scanning; benefits ("Sleep better tonight") over features ("White noise generator"); never open with "Welcome to...".
- **If the app has in-app purchases,** the description, screenshots and previews must make clear whether featured items need an extra purchase.
- **Promotional text:** up to 170 characters, updatable any time; good for seasonal events (Ramadan, Eid, back-to-school, New Year); refresh monthly or with each major update [rorkai].
- **What's New:** must clearly describe new features; simple bug fixes may use a generic description. Writing and uploading release notes is in [../app-store-connect/SKILL.md](../app-store-connect/SKILL.md).
- **Output package** [eronred]: per field a Recommended version plus Alternative A (keyword emphasis) and Alternative B (positioning), each with an `[X]/[limit]` count, the keywords covered and a rationale; then a Keyword Coverage Matrix (title, subtitle, keyword field) and a before/after table.

## Rules that get metadata rejected

From App Review guideline 2.3 (Accurate Metadata):

- **2.3:** all metadata, "including privacy information, your app description, screenshots, and previews", must reflect the core experience and stay up to date.
- **2.3.7, verbatim:** "Choose a unique app name, assign keywords that accurately describe your app, and don't try to pack any of your metadata with trademarked terms, popular app names, pricing information, or other irrelevant phrases just to game the system. App names must be limited to 30 characters. Metadata such as app names, subtitles, screenshots, and previews should not include prices, terms, or descriptions that are not specific to the metadata type."
- **2.3.1(a):** misleading marketing, or a false price inside or outside the App Store, is grounds for removal and termination.
- **2.3.10:** no names, icons or imagery of other mobile platforms or alternative app marketplaces in the app or metadata. [rorkai] adds: no references to other platforms in What's New ("Now matching our Android version"), no competitor mentions.
- **4.1:** don't use another developer's icon, brand or product name without approval.

## Localization

- **Localize per market:** description, keywords, previews, screenshots and name. Supported App Store locales for version and app-info localizations [rorkai]: `ar-SA, bn-BD, ca, cs, da, de-DE, el, en-AU, en-CA, en-GB, en-US, es-ES, es-MX, fi, fr-CA, fr-FR, gu-IN, he, hi, hr, hu, id, it, ja, kn-IN, ko, ml-IN, mr-IN, ms, nl-NL, no, or-IN, pa-IN, pl, pt-BR, pt-PT, ro, ru, sk, sl-SI, sv, ta-IN, te-IN, th, tr, uk, ur-PK, vi, zh-Hans, zh-Hant`.
- **Keywords are not translations** [eronred, rorkai]: research each market from scratch with local autocomplete and local competitors. "budget tracker" becomes German "Haushaltsbuch", Japanese "家計簿", Spanish "control de gastos". Popularity varies by territory (70 in the US vs 5 in France in [rorkai]'s example).
- **English storefronts:** en-US keywords "may carry into other English-speaking storefronts", but dedicated localization outperforms [rorkai].
- **Pick markets** [eronred] by market size 30%, competition 25%, effort 20%, revenue potential 15%, strategic fit 10%. Tier 1: US en-US, UK en-GB, Germany de-DE, Japan ja, France fr-FR, South Korea ko, China zh-Hans ("needs ICP"), Brazil pt-BR, Canada en-CA/fr-CA, Australia en-AU. Tier 2: Spain es-ES, Italy it, Netherlands nl, Sweden sv, Russia ru, Mexico es-MX, India en-IN/hi, Indonesia id, Turkey tr, Saudi Arabia ar-SA. First ask whether the app UI is localized or only the listing, which markets, and the budget (professional vs AI-assisted).
- **Per market** [eronred]: title, subtitle, keyword field ("completely new research per market"), description, promotional text, What's New, screenshots, App Preview (subtitles or a localized version).
- **Adapt, don't only translate** [eronred]: currency, date and number formats; color associations (red is luck in China, danger in the West); imagery; formal vs informal tone; local press and social proof; purchasing-power pricing. Use native speakers with ASO knowledge and brief them ("This is an App Store title, must include [keyword]").
- **Workflow** [eronred]: research (top 10 local apps, local seeds), translate and adapt, launch and monitor weekly rankings per market and conversion by country.
- **Machine translation** with the asc CLI (formal register, per-field limits, approval before upload) is in [../app-store-connect/SKILL.md](../app-store-connect/SKILL.md). Play localization is in [ANDROID.md](ANDROID.md).

## Category

- **App Store:** a Primary and a Secondary category; Games or Stickers can take one or two subcategories. Both categories are indexed; pick the most appropriate one (Apple may change it), since irrelevant categories are grounds for rejection.
- **Category list** [eronred]: Books, Business, Catalogs, Developer Tools, Education, Entertainment, Finance, Food & Drink, Games, Graphics & Design, Health & Fitness, Lifestyle, Magazines & Newspapers, Medical, Music, Navigation, News, Photo & Video, Productivity, Reference, Shopping, Social Networking, Sports, Stickers, Travel, Utilities, Weather. Games subcategories: Action, Adventure, Arcade, Board, Card, Casino, Casual, Family, Music, Puzzle, Racing, Role Playing, Simulation, Sports, Strategy, Trivia, Word.
- **Regulated Medical Devices declaration:** required for apps in the EU/EEA, UK or US in Health & Fitness or Medical, or with "frequent" Medical or Treatment information in the age rating.
- **Choosing** [eronred]: the primary category drives chart rank, featuring and search. Pick "the highest audience-match category where you can plausibly reach top 100 within 6 months", weighing truth fit (required), competitive density, top-app strength, average downloads to reach #1 (Appeeky `get_downloads_to_top`, third-party), audience match and editorial activity (Health & Fitness, Productivity, Lifestyle and Education are "active editorial").
- **Default trade-offs** [eronred]: Health & Fitness over Lifestyle for wellness; Utilities for niche utilities, Productivity for workflow apps; Photo & Video for consumers vs Graphics & Design for pros; Education over Reference; Finance over Business; Social Networking only with a real social graph; Games by strongest mechanic, not Casual. Health & Fitness medical claims trigger 5.1.1 rejections; Kids brings the Kids category requirements (COPPA, no third-party ads); Utilities charts more easily but is rarely featured.
- **Switching costs** [eronred]: 4 to 8 weeks of re-indexing. iOS: App Store Connect > App Information > Primary/Secondary Category, effective after the next version submission, resets the category chart position, re-indexing 1 to 4 weeks. Android: Play Console > Store presence > Main store listing > Category, within 24 hours, resets, days to settle.
- **Mistakes** [eronred]: the broadest category; ignoring the secondary; ego picks; switching during launch; picking a Games subcategory by theme instead of mechanic; not checking downloads-to-top.
- Play categories and tags are in [ANDROID.md](ANDROID.md).

## Prove it

- Every field is within its limit in every locale, and the keyword field is under 100 bytes, not only 100 characters.
- No word appears twice across name, subtitle, keyword field and category in a locale; the keyword field has no spaces after commas, no app or company name, no "app", no competitor or trademark.
- No metadata field contains a price, a ranking claim, another platform's name or an unverifiable claim.
- Every non-primary locale has its own researched keywords, not a translation of the primary list.
- The primary category matches what the app actually does.
