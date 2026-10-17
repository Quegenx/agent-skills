# Google Play ASO

Google Play has no hidden keyword field: per [eronred] it indexes the app name, both descriptions, the developer name, and reviews and replies; Google enforces a strict metadata policy, so Play ASO is natural keyword placement in visible copy that never claims rank, price or promotion. Store listing limits, asset specs and policy come from Google's docs; [eronred] tags third-party practice, and where it differs from Google both are given. Uploading the listing is [../google-play/SKILL.md](../google-play/SKILL.md).

**Contents:** [How Play differs from the App Store](#how-play-differs-from-the-app-store) · [Listing fields](#listing-fields) · [Writing the copy](#writing-the-copy) · [Graphic assets](#graphic-assets) · [Preview video](#preview-video) · [Metadata policy](#metadata-policy) · [Category and tags](#category-and-tags-eronred) · [Custom store listings](#custom-store-listings) · [Store listing experiments](#store-listing-experiments) · [Prove it](#prove-it)

## How Play differs from the App Store

[eronred] comparison:

| Factor | Google Play | App Store |
|---|---|---|
| Keyword indexing | title + short description + full description | title + subtitle + keyword field only |
| Hidden keyword field | none | 100-char field |
| Ratings | continuous, never reset | reset per version (on request) |
| A/B testing | Play Store Experiments | Product Page Optimization |
| Screenshots | 2 to 8 per language | up to 10 per language |
| Feature graphic | required (1024×500 px) | none |
| Algorithm signals | installs, engagement, ratings, keywords | keyword match, ratings, conversions |

- **Backlinks** [ApparenceKit](https://apparencekit.dev/blog/aso-flutter-app-store-optimization/): "links to your Play Store listing from websites influence ranking." Google's docs read for this skill don't say so.
- **App quality counts:** "Your app's core vitals affect your app's visibility on Google Play." The vitals and their thresholds are in [../google-play/SKILL.md](../google-play/SKILL.md).

## Listing fields

- **Where:** Grow users > Store presence > Main store listing; graphics in its "Graphics" section.
- **Limits:** app name 30 characters (one localized name per language); short description 80; full description 4000. "Character limits apply to both full-width and half-width characters."
- **Required to publish:** app icon, short description, feature graphic, at least two screenshots (across device types).
- **Contact details:** email required; website highly recommended; phone optional.
- **Languages:** the default is English (United States, en-US). Add translations and localized graphics, otherwise users may see automated translations ("automated translations aren't supported for Armenian, Raeto-romance, Tagalog, and Zulu"). [eronred]: "don't just auto-translate"; Play indexes descriptions per language, so each locale is a fresh keyword opportunity.
- **License:** publishing grants Google a license to use the icon, screenshots and videos for promotion.

## Writing the copy

- **Title:** unique and accurately describing what the app does; no pricing or ranking claims. [eronred] pattern `Brand: Keyword Descriptor`, e.g. "Headspace: Meditation & Sleep", not "Best Meditation App for You".
- **Short description:** a summary of the biggest benefits, not repeated in the full description. Avoid line breaks, emojis, symbols and repeated punctuation, and don't capitalize for emphasis. [eronred]: pack the 2 to 3 most important keywords into one sentence without repeating the title's primary keyword, e.g. "Guided meditation, sleep sounds & breathing exercises for stress relief".
- **Full description** [eronred]: a hook paragraph of 2 to 3 sentences with the primary keyword in the first 167 characters ("shown above the fold"); 5 to 8 `• [Feature]: [Benefit]` bullets; social proof; a CTA; a closing paragraph using keyword variants naturally. Long-tail phrases work because the full description is indexed, and "Google's algorithm understands synonyms".
- **Keyword density conflict** [eronred]: its metadata skill says 2 to 3% density, front-loaded in the first paragraph; its Android skill says the target keyword 3 to 5 times across the full description (exact plus variants). [ApparenceKit](https://apparencekit.dev/blog/aso-flutter-app-store-optimization/) gives a third figure: "Aim for 3-5 keyword mentions per 1,000 characters". Either way, repetitive or irrelevant keywords in the app name, description or promotional description can get the app suspended.
- **Play audit** [eronred]: Title, Short description, Full description, Screenshots, Feature graphic and Ratings 1 to 10 each, out of 60, plus the top 3 improvements (see [AUDIT.md](AUDIT.md)).

## Graphic assets

| Asset | Spec |
|---|---|
| App icon | 32-bit PNG with alpha, 512 x 512 px, max 1024 KB; meets the Google Play icon design specifications; no badges or text suggesting ranking, price or Play categories |
| Feature graphic | JPEG or 24-bit PNG (no alpha), 1024 x 500 px; alt text 140 characters or less; key elements away from cutoff zones; no device imagery or store badges |
| Phone screenshots | up to 8 per device type; JPEG or 24-bit PNG (no alpha); min dimension 320 px, max 3840 px; long side at most twice the short side |
| Tablet and Chromebook | at least 4 screenshots, 1,080 to 7,680 px, 16:9 landscape or 9:16 portrait |
| Wear OS | at least one, 1:1, min 384 x 384, no device frames |
| Android TV | at least one TV screenshot plus a TV banner (1280 x 720, JPEG or 24-bit PNG) |
| Android XR | 4 to 8 screenshots, 8:5, up to 8 MB each |

- **Promotion eligibility (highly recommended):** apps need at least four screenshots at 1080 px minimum (16:9 landscape at least 1920 x 1080, or 9:16 portrait at least 1080 x 1920); games at least three 16:9 or 9:16 screenshots at those minimums; taglines cover no more than 20% of the image.
- **Feature graphic** [eronred]: shown at the top of the listing when there's no video; must work without its text, which may be truncated.
- **Adaptive icon** [eronred]: 108×108 dp with a 66×66 dp safe zone.
- Screenshot slot strategy (hook first, one benefit per slot) is in [VISUALS.md](VISUALS.md).

## Preview video

- **Google's rules:** a single YouTube video URL (no playlist or channel, no timecode parameters); ads disabled; public or unlisted; not age-restricted; embeddable. Only the first 30 seconds autoplay (muted); show real footage in the first 10 seconds; at least 80% representative of the experience. The video shows before the screenshots.
- **[eronred]:** 30 s recommended, 2 min max; landscape preferred; audio allowed and recommended; real people, narration and a marketing intro are fine (logo or intro at most 3 s); it may end on "Get it free".
- **CTA conflict:** Google says avoid "Free" and calls to action like "download now", "install now", "play now", "try now" in assets and copy, so leave out [eronred]'s "Get it free" ending.

## Metadata policy

- **Words to avoid** in assets and copy: "Best", "#1", "Top", "New", "Million Downloads"; "Free", "Discount", "Sale"; calls to action ("download now", "install now", "play now", "try now"); unrelated keywords; time-sensitive copy; device imagery and store badges; third-party trademarks without permission.
- **Title, icon and developer name:** "Don't use emojis, emoticons, or repeated special characters"; "Avoid ALL CAPS unless it is part of your brand name".
- **No performance or promotion claims:** no text or images indicating store performance, ranking, price, promotion, or relation to Google Play programs. Violations include "App of the year", "#1", "Best of Play 20XX", "Popular", "10% off", "$50 cash back", "free for limited time only", "Editor's choice", "New".
- **No misleading icon symbols** (e.g. a new-message dot when there are none) and **no unattributed or anonymous user testimonials** in the description.

## Category and tags [eronred]

- **One category** (it drives top charts) and up to 5 tags ("can't change often"); the content rating is required and separate; game subcategories mirror iOS.
- **Changing category:** Play Console > Store presence > Main store listing > Category; takes effect within 24 hours, resets chart position, settles in days. Category choice in general is in [KEYWORDS-AND-METADATA.md](KEYWORDS-AND-METADATA.md).

## Custom store listings

- **Up to 50** custom store listing pages. Each customizes the name, icon, descriptions and graphic assets; contact details, privacy policy and category stay shared with the main listing.
- **Targeting:** country or region ("You can only target a country with one custom store listing at a time"), pre-registration users, inactive users (lapsed = "haven't opened your app in the last 28 days"; churned = uninstalled), a unique URL (a string parameter unique across your custom listings), Google Ads traffic, search keywords.
- **For Google Ads:** the listing must be fully reviewed and approved, then selected as the landing page in Google Ads. Running the campaigns is [../app-growth/SKILL.md](../app-growth/SKILL.md).

## Store listing experiments

- **Types:** default graphics experiments (icon, feature graphic, screenshots in the default language) and localized experiments (also the descriptions, in up to five languages).
- **Concurrency:** "For each app, you can run one default graphics experiment or up to five localized experiments at the same time." Experiments run on the default and on custom store listings.
- **Variants:** Google says up to 2 variants; [eronred] says up to 3 per element (icon, feature graphic, screenshots, short description, full description). Confirm in the current Play Console.
- **Settings:** target metric (Unique user install clicks, Unique user open clicks, Unique user pre-registration clicks), audience percentage, minimum detectable effect, confidence level ("Increasing the confidence level decreases the likelihood of a false positive").
- **Duration:** experiments stop automatically after 6 months. [eronred]: run at least 7 days or 1,000 impressions.
- **Finish:** apply the winning variant from the recommendation, or "Keep current listing". Test one asset at a time. The general test method is in [PRODUCT-PAGES.md](PRODUCT-PAGES.md).
- **Where:** Play Console > Store listing experiments > New experiment [eronred]; Google reports install conversion rate per variant [eronred].

## Prove it

- Name within 30, short description within 80, full description within 4000 in every language, with no emojis, ALL CAPS, ranking, price or "Free" claims in the name, icon, developer name or short description.
- Icon is a 512 x 512 32-bit PNG under 1024 KB; feature graphic is 1024 x 500 without alpha; at least two screenshots across device types, within 320 to 3840 px with the 2:1 ratio cap, and four at 1080 px or more for promotion eligibility.
- The preview video is a single public or unlisted, embeddable YouTube URL with ads disabled and real footage in the first 10 seconds.
- Each custom store listing targets a country no other custom listing targets; each experiment tests one asset.
