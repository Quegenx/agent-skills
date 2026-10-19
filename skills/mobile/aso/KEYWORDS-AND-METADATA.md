# Keywords and metadata

Metadata is the text a store indexes and shows: on the App Store, search reads the name, subtitle, keyword field and primary category; on Google Play, the name and the descriptions. Apple ranks on "text relevance (matches for your app's title, subtitle, keywords, and primary category), as well as user behavior (downloads, ratings and reviews, and more)", so most outcomes come down to putting distinct, researched words in the few indexed fields, never wasting characters on repeats, and keeping everything accurate enough to pass review. Limits and rules below come from Apple's and Google's docs unless tagged [eronred] or [rorkai] (third-party ASO skills) or [ApparenceKit] (a Flutter starter-kit author's ASO posts); where they differ, both are given. Uploading metadata is [app-store-connect SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/SKILL.md) and [google-play SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/google-play/SKILL.md).

**Contents:** [Field limits](#field-limits) · [What is indexed](#what-is-indexed) · [Keyword research](#keyword-research) · [App Store name and subtitle](#app-store-name-and-subtitle) · [App Store keyword field](#app-store-keyword-field) · [Description, promotional text, What's New](#description-promotional-text-whats-new) · [Rules that get metadata rejected](#rules-that-get-metadata-rejected) · [Localization](#localization) · [Category](#category) · [Prove it](#prove-it)

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
- **In-App Purchase display name and description** ([Apple, In-App Purchase information](https://developer.apple.com/help/app-store-connect/reference/in-app-purchases-and-subscriptions/in-app-purchase-information)): "The display name must be at least two characters and no more than 30 characters"; "The description must be no more than 45 characters", and it "displays under your In-App Purchase name on the App Store" when the purchase is promoted. Localized changes go through review. [coreyhaines31/marketingskills, aso] says 35 and 55 characters; Apple's numbers win.
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

- **App Store:** the name, subtitle, keywords and the primary and secondary category are indexed. "Promotional text doesn't affect your app's search ranking." Your app is already searchable by app name and company name. [coreyhaines31/marketingskills, aso]'s index table marks "Developer name" as not indexed by Apple; Apple's wording above says otherwise, so keep Apple's.
- **Where search results show more than the app** ([Apple, Search](https://developer.apple.com/app-store/search/)): results include "developer cards, Apple In-App Purchases, In-App Events, and custom product pages, as well as categories, editorial content, and Apple Ads. Your app's rating and up to three screenshots or app previews may display in search results depending on the platform and image orientation." "Promoted Apple In-App Purchases appear in App Store search results and people can tap them to be directed to your product page."
- **Description and What's New are not indexed** for App Store search [eronred, rorkai]; better description coverage improves conversion, which "indirectly boosts search rankings" [rorkai]. Write keyword echoes in What's New for conversion only [rorkai].
- **Apple indexes each field separately but combines words across them:** full-text search matches words spread across title, subtitle and keywords [rorkai], so don't repeat a keyword across them [eronred].
- **Screenshot captions:** [rorkai] says they are OCR-indexed "since June 2025 algorithm update"; [ApparenceKit](https://apparencekit.dev/blog/aso-flutter-app-store-optimization/) agrees ("Since a few months we are all sure that Apple also index keywords in your screenshots", undated) and puts target keywords in captions ("Track your habits and routines", not "Your companion and name of app"). [coreyhaines31/marketingskills, aso] states it as fact too ("Screenshot captions indexed since June 2025 (AI extraction)"). Apple's docs read for this skill don't say so (the [Search](https://developer.apple.com/app-store/search/) page, checked 2026-10-18, still doesn't mention captions); treat it as unconfirmed.
- **Behaviour signals and IAP names** [ApparenceKit](https://apparencekit.dev/blog/aso-flutter-app-store-optimization/): "**In-app purchase names**: yes, these are indexed", alongside rating and review velocity, download velocity and engagement (retention, session length, crash rate). Apple's docs say only "user behavior (downloads, ratings and reviews, and more)". The same post: "65-70% of app downloads come from store searches".
- **App tags:** Apple may show tags in search results "generated using large language models (LLMs) based on the metadata you've provided". They aren't editable.
- **In-App Events:** event names and short descriptions are indexed by App Store search [eronred]; see [PRODUCT-PAGES.md](PRODUCT-PAGES.md).
- **Google Play:** title, short description and full description are indexed, and reviews and replies too (iOS reviews are not) [eronred]. Google penalizes stuffing: repetitive or irrelevant keywords in the app name or descriptions can get the app suspended.

## Keyword research

[eronred] Inputs: App ID, country (default US), 3 to 5 seed keywords, the goal (downloads, revenue or brand).

1. **Expand the seeds:** Apple Search Suggestions autocomplete (variations "[keyword] app", "[keyword] for [audience]", "best [keyword]"; long-tail is often lower competition; [ApparenceKit](https://apparencekit.dev/blog/aso-flutter-app-store-optimization/): "Target long-tail keywords first ... Rank for 20 long-tail keywords before trying to compete on the big ones", e.g. "habit tracker for students", "morning routine app"); the keywords of the top 3 to 5 competitors; the category; synonyms, how users describe the problem, misspellings, abbreviations. Apple's own trade-off ([Search](https://developer.apple.com/app-store/search/)): "Popular, functional terms, such as 'jobs' or 'social' and trending or seasonal terms ... are highly competitive - especially if you are a newer or smaller app. Less common terms drive lower traffic, but are less competitive."
2. **Collect signals per keyword:** Search Volume (1 to 100), Difficulty (1 to 100), Relevance (manual, 1 to 100), Intent ("how to edit photos" vs "photo editor app"), current rank. Volume and difficulty come from a data provider (Appeeky or Astro, both third-party); never guess popularity [rorkai]. [ApparenceKit](https://apparencekit.dev/blog/aso-flutter-app-store-optimization/) also names AppTweak, Sensor Tower ("comprehensive but expensive") and "Apple Search Ads: free keyword suggestions with relative popularity scores".
3. **Score:**

   ```
   Opportunity = (Volume × 0.4) + ((100 - Difficulty) × 0.3) + (Relevance × 0.3)
   ```

4. **Bucket:** Primary 3 to 5 (must be in the title or subtitle); Secondary 5 to 10 (subtitle and keyword field, may rotate); Long-tail 10 to 20 (fill the keyword field); Aspirational 3 to 5 (high volume and difficulty: track them, don't sacrifice primaries for them).
5. **Place:** `Title (30 chars): [primary 1] + [primary 2]`, `Subtitle (30 chars): [secondary]`, `Keyword Field (100): [remaining, comma-separated]`.

- **Cadence:** update keywords quarterly; track rankings weekly.
- **Appeeky endpoints (third-party):** `GET /v1/keywords/metrics?keywords=...&country=us`, `GET /v1/keywords/suggestions?term=...&country=us`, `GET /v1/keywords/trending?country=us&days=7`, `GET /v1/keywords/ranks?keyword=meditation&country=us&limit=10`, header `X-API-Key`.

## App Store name and subtitle

- **Name:** choose a unique name; balance branding with keyword inclusion [rorkai]. [eronred] formulas: `[Brand] - [Primary Keyword]` ("Calm - Sleep & Meditation"), `[Brand]: [Benefit Phrase]` ("Duolingo: Language Lessons"), `[Primary Keyword] [Brand]` ("Headspace: Mindful Meditation"). Example pair [ApparenceKit](https://apparencekit.dev/blog/aso-flutter-app-store-optimization/): bad `Streaks - Daily Habit Tracker` + `Track Your Daily Habits`; good `Streaks - Daily Habit Tracker` + `Build Routines & Reach Goals`. Lead with the brand if it's well known, the keyword if not; read naturally; don't stuff; use the full 30; skip ™ and ® (they waste space); offer 3 options with character counts.
- **Subtitle:** avoid generic subtitles such as "world's best app". It must not include inappropriate content, reference other apps, or make unverifiable product claims. [eronred]: never repeat title keywords; benefits, not features; use the full 30; a CTA feel is fine; offer 3 options.

## App Store keyword field

- **Format:** terms separated by commas and no spaces, e.g. `Property,House,Real Estate`.
- **Don't repeat** any word already in the app name, subtitle or category, and don't include the app name or company name (already searchable; Apple adds the name automatically [rorkai]).
- **Skip waste:** plurals of words already included, category names, the word "app", generic terms ("app", "game"), filler words ("the", "to"), duplicates, special characters.
- **Never use** trademarks, celebrity names, irrelevant terms, or the names of competing apps or other companies. Apple may modify inappropriate keywords at any time.
- **Singular vs plural:** Apple says avoid plurals of included words; [eronred] says Apple indexes singular and plural automatically, so use singular forms; [rorkai] says Apple handles stemming and to prefer single words.
- **[eronred] adds:** no "free"; no competitor brand names ("policy violation"); prioritize by volume × relevance; use all 100 characters.
- **Example** [ApparenceKit](https://apparencekit.dev/blog/aso-flutter-app-store-optimization/): bad `habit tracker, daily habits, habit tracking app, best habit tracker`; good `habit,routine,goal,streak,daily,reminder,wellness,productivity,journal,challenge`.
- **Output format** [eronred]: `keyword1,keyword2,keyword3,keyword4,...` then `Characters used: [X]/100`.
- **Common mistakes** [eronred]: repeating keywords across title, subtitle and keyword field; plurals; spaces after commas; brand name in the field; stuffing; unused characters.

## Description, promotional text, What's New

- **Description:** the first sentence matters most; no unnecessary keywords; avoid specific prices. The first 170 characters are visible without tapping "more", and the first 3 lines are the hook [eronred]. [eronred] structure: hook (first 3 lines), social proof, 4 to 6 benefit bullets, how it works (3 steps), testimonial, CTA; line breaks and emoji for scanning; benefits ("Sleep better tonight") over features ("White noise generator"); never open with "Welcome to...".
- **If the app has in-app purchases,** the description, screenshots and previews must make clear whether featured items need an extra purchase.
- **Promotional text:** up to 170 characters, updatable any time; good for seasonal events (Ramadan, Eid, back-to-school, New Year); refresh monthly or with each major update [rorkai].
- **What's New:** must clearly describe new features; simple bug fixes may use a generic description. Writing and uploading release notes is in [app-store-connect SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/SKILL.md).
- **Output package** [eronred]: per field a Recommended version plus Alternative A (keyword emphasis) and Alternative B (positioning), each with an `[X]/[limit]` count, the keywords covered and a rationale; then a Keyword Coverage Matrix (title, subtitle, keyword field) and a before/after table.

## Rules that get metadata rejected

From App Review guideline 2.3 (Accurate Metadata):

- **2.3:** all metadata, "including privacy information, your app description, screenshots, and previews", must reflect the core experience and stay up to date.
- **2.3.7, verbatim:** "Choose a unique app name, assign keywords that accurately describe your app, and don't try to pack any of your metadata with trademarked terms, popular app names, pricing information, or other irrelevant phrases just to game the system. App names must be limited to 30 characters. Metadata such as app names, subtitles, screenshots, and previews should not include prices, terms, or descriptions that are not specific to the metadata type."
- **2.3.1(a):** misleading marketing, or a false price inside or outside the App Store, is grounds for removal and termination.
- **2.3.10:** no names, icons or imagery of other mobile platforms or alternative app marketplaces in the app or metadata unless there is specific, approved interactive functionality. The old summary omitted that exception. [rorkai]'s blanket no-other-platform advice for What's New ("Now matching our Android version") is a stricter source preference; the official qualified rule takes precedence. [https://developer.apple.com/app-store/review/guidelines/#accurate-metadata; rorkai]
- **4.1:** don't use another developer's icon, brand or product name without approval.

## Localization

- **Localize per market:** description, keywords, previews, screenshots and name. Supported App Store locales for version and app-info localizations [rorkai]: `ar-SA, bn-BD, ca, cs, da, de-DE, el, en-AU, en-CA, en-GB, en-US, es-ES, es-MX, fi, fr-CA, fr-FR, gu-IN, he, hi, hr, hu, id, it, ja, kn-IN, ko, ml-IN, mr-IN, ms, nl-NL, no, or-IN, pa-IN, pl, pt-BR, pt-PT, ro, ru, sk, sl-SI, sv, ta-IN, te-IN, th, tr, uk, ur-PK, vi, zh-Hans, zh-Hant`.
- **Keywords are not translations** [eronred, rorkai]: research each market from scratch with local autocomplete and local competitors. "budget tracker" becomes German "Haushaltsbuch", Japanese "家計簿", Spanish "control de gastos". Popularity varies by territory (70 in the US vs 5 in France in [rorkai]'s example).
- **English storefronts:** en-US keywords "may carry into other English-speaking storefronts", but dedicated localization outperforms [rorkai].
- **Pick markets** (this weights store locales; entering a new market as a business is a separate gate in [marketing-plan SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-plan/SKILL.md#the-market-quality-gate), scored with the attractiveness scorecard in [marketing-plan MARKET-SIZING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-plan/MARKET-SIZING.md#market-attractiveness-scorecard)) [eronred] by market size 30%, competition 25%, effort 20%, revenue potential 15%, strategic fit 10%. Tier 1: US en-US, UK en-GB, Germany de-DE, Japan ja, France fr-FR, South Korea ko, China zh-Hans ("needs ICP"), Brazil pt-BR, Canada en-CA/fr-CA, Australia en-AU. Tier 2: Spain es-ES, Italy it, Netherlands nl, Sweden sv, Russia ru, Mexico es-MX, India en-IN/hi, Indonesia id, Turkey tr, Saudi Arabia ar-SA. First ask whether the app UI is localized or only the listing, which markets, and the budget (professional vs AI-assisted). [ApparenceKit](https://apparencekit.dev/blog/aso-flutter-app-store-optimization/): "Even if your app is English-only, localized metadata in Japanese, Korean, and German can unlock massive markets."
- **Tiers: the sources differ.** [ApparenceKit](https://apparencekit.dev/blog/automate-flutter-ios-deploy-fastlane/) Tier 1 ("the largest App Store markets by revenue and downloads"): en-US, en-GB ("optionnal as it's covered by en-US"), ja, zh-Hans, ko, de-DE, fr-FR, es-ES ("Gateway to all Spanish-speaking countries"), pt-BR, en-AU. Tier 2: zh-Hant, it, nl-NL, sv, da, no, tr, pl, ar-SA, he, en-CA, fr-CA ("Required for Quebec App Store visibility"), es-MX, pt-PT. Tier 3 ("English metadata often performs just as well"): ca, cs, ru ("Large user base but currently can't pay for apps"), el, fi, hi, hr, hu, id, ms, ro, sk, th, uk, vi ("can be used to impact US market"). Against [eronred] above: es-ES is Tier 1 here (Tier 2 there); en-CA and fr-CA Tier 2 (Tier 1 there); ru, id and hi Tier 3 (Tier 2 there).
- **Translate by tier** [ApparenceKit](https://apparencekit.dev/blog/automate-flutter-ios-deploy-fastlane/): "start with Tier 1 using quality translations, cover Tier 2 with machine translation reviewed by a native speaker, and use English fallbacks for Tier 3 until your app gains traction in those markets." On a first release, research the US market in English, script-translate the description and promotional text, and write title, subtitle and keywords by hand per market ("they require some research and creativity"); "don't translate litterally everything. Some countries, even if they are non-English, will have better ASO with English metadata."
- **Keep metadata in version control** [ApparenceKit](https://apparencekit.dev/blog/aso-flutter-app-store-optimization/) [ApparenceKit](https://apparencekit.dev/blog/automate-flutter-ios-deploy-fastlane/): history of every change, revert, translator PRs. Both use fastlane metadata folders; the App Store Connect skill treats fastlane as legacy and syncs with `asc metadata` ([app-store-connect METADATA-AND-SCREENSHOTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/METADATA-AND-SCREENSHOTS.md#legacy-fastlane-metadata)).
- **Per market** [eronred]: title, subtitle, keyword field ("completely new research per market"), description, promotional text, What's New, screenshots, App Preview (subtitles or a localized version).
- **Adapt, don't only translate** [eronred]: currency, date and number formats; color associations (red is luck in China, danger in the West); imagery; formal vs informal tone; local press and social proof; purchasing-power pricing. Use native speakers with ASO knowledge and brief them ("This is an App Store title, must include [keyword]").
- **Workflow** [eronred]: research (top 10 local apps, local seeds), translate and adapt, launch and monitor weekly rankings per market and conversion by country.
- **Machine translation** with the asc CLI (formal register, per-field limits, approval before upload) is in [app-store-connect SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/SKILL.md). Play localization is in [ANDROID.md](ANDROID.md).

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
- Metadata passes the qualified 2.3.7 price/off-type rule and 2.3.10 platform rule, including its approved interactive-functionality exception; it makes no misleading or unverifiable product claim. The old acceptance line imposed a blanket price/platform ban across every field. [https://developer.apple.com/app-store/review/guidelines/#accurate-metadata]
- Every non-primary locale has its own researched keywords, not a translation of the primary list.
- The primary category matches what the app actually does.
