# Platform specs

Character limits, sizes and placement rules per ad platform. Platforms reject or truncate copy that exceeds them, so count every line before delivering. Where [coreyhaines31/marketingskills, ad-creative] (platform-specs.md, generative-tools.md) disagreed with the platform's current help page, the platform's figure is given with its URL and the source's number is noted; those pages were checked in October 2026 for this skill, and they change, so re-check before a big push. App-install creative for Meta (the API's 1024×1024 output and the Appeeky pipeline) is in [app-growth AD-CREATIVES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/AD-CREATIVES.md#meta-static-specs-and-copy); TikTok app creative in [app-growth TIKTOK-ADS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/TIKTOK-ADS.md#creative-strategy).

**Contents:** [Google Ads](#google-ads) · [Meta](#meta) · [LinkedIn](#linkedin) · [TikTok](#tiktok) · [X](#x) · [Counting characters](#counting-characters) · [Writing for several platforms](#writing-for-several-platforms) · [Prove it](#prove-it)

## Google Ads

**Responsive search ads** (https://support.google.com/google-ads/answer/7684791):

| Element | Limit | Count |
|---|---|---|
| Headline | 30 characters | 3 minimum, 15 maximum |
| Description | 90 characters | 2 minimum, 4 maximum |
| Display path 1 and 2 | 15 characters each | optional |
| Final URL | | required |

"Every character in a double width language like Korean, Japanese, or Chinese counts as 2 characters"; "a minimum of one headline and one description will be selected"; the source adds that Google shows up to 3 headlines and 2 descriptions together. An ad group takes "3 enabled responsive search ads" (https://support.google.com/google-ads/answer/6372658). The output spec with ad groups, negatives, sitelinks and callouts is in [paid-ads GOOGLE-SEARCH.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/GOOGLE-SEARCH.md#rsa-output-spec).

RSA writing rules [coreyhaines31/marketingskills, ad-creative]:

- Every headline makes sense alone and in any combination; any headline can appear in any position unless pinned.
- Pinning reduces Google's ability to optimize: pin the brand to position 1 only if brand rules require it, the strongest CTA to position 2 or 3, and leave the rest unpinned.
- At least one keyword headline, one benefit headline and two or three CTA headlines.
- A 15-headline mix: 3 to 4 keyword, 3 to 4 benefit, 2 to 3 social proof, 2 to 3 CTA, 1 to 2 differentiators, 1 brand.
- A 4-description mix: benefit + proof; feature + outcome; social proof + CTA; offer + CTA (if there is a real one).
- Dynamic keyword insertion (`{KeyWord:default}`) can exceed limits; set a safe default.

**Performance Max text assets** (https://support.google.com/google-ads/answer/14528373). The source said 5 headlines and 5 long headlines required and 1 description required; Google:

| Element | Limit | Count |
|---|---|---|
| Headline | 30 characters; "include at least one with 15 characters or less" | "11+ (minimum of 3, maximum of 15)" |
| Long headline | 90 characters | "2+ (minimum of 1, maximum of 5)" |
| Description | 90 characters | "4+ (minimum of 2, maximum of 5)" |
| Business name | 25 characters; must match the domain or a verified name | 1 |
| Display path | 15 characters | 2 |

**Display ads** (source, not re-checked): headline 30, long headline 90, description 90, business name 25. Image recommendations per Google's spec hub (https://support.google.com/google-ads/answer/13676244); the source lists landscape 1.91:1 at 1200×628 and square 1200×1200.

## Meta

**Feed image, every objective** (https://www.facebook.com/business/ads-guide/update/image): "Primary text: 50-150 characters", "Headline: 27 characters"; ratio 4:5 at 1440 × 1800, minimum width 600 px, files up to 30 MB. The source said primary text "125 chars visible (up to 2,200)", headline "40 characters recommended", description "30 characters recommended" and a 1:1 1080×1080 feed image; those are out of date. Front-load the hook in the first line, use line breaks in longer primary text, and keep emojis to 1 or 2 if you test them [coreyhaines31/marketingskills, ad-creative].

**Reels:** Facebook Reels video "Primary Text: 40 characters", "Headline Text: 55 characters" (https://www.facebook.com/business/ads-guide/update/video/facebook-facebook-reels); Instagram Reels "Primary text: 44 characters" (https://www.facebook.com/business/ads-guide/update/video/instagram-reels/traffic); 9:16 at 1440 × 2560. The source's "keep under 72 chars" for Stories and Reels overlays is wrong.

**Safe zones.** Reels: leave "roughly 14% of the top, 35% of the bottom, and 6% on each side ... free from text, logos" (Reels guide pages above; https://www.facebook.com/business/help/980593475366490). On a 1080 × 1920 canvas that is about 269 px top, 672 px bottom and 65 px each side. Stories: "14% of the top and 20% of the bottom" (https://www.facebook.com/business/help/304846896685564). The source's cross-platform band is corrected in [SHORT-FORM-VIDEO.md](SHORT-FORM-VIDEO.md#safe-zones).

**Text on images.** Meta's text-overlay guidance has no 20% limit: use large, contrasting type, "Don't communicate too many messages", "Stay within the safe zone" (https://www.facebook.com/business/help/980593475366490). [coreyhaines31/marketingskills, ads] says "Bold, readable text overlay (keep under 20%)"; Meta's page has no such cap, so don't apply it as one.

**Placements** (source, not re-checked): right column shows only the headline; Audience Network varies by publisher.

**Lead ads (instant form)** (https://www.facebook.com/business/help/1664458123767694): "Below Greeting, enter a Headline no longer than 60 characters"; with rich creative, intro headline 45, description 81, each benefit 57, list bullets 80. Custom disclaimers "have no character limit" (https://www.facebook.com/business/help/179258984144385). The source's "Greeting description 360" and "Privacy policy text 200" weren't found on Meta's page. Form type and qualifiers: [paid-ads META-WEB-ADS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/META-WEB-ADS.md#lead-forms).

## LinkedIn

**Single image** (https://www.linkedin.com/help/lms/answer/a426534): intro text "up to 150 characters ... to avoid truncation (3,000 character maximum)"; headline 70 recommended, 200 maximum; description 100 recommended, 300 maximum, "displayed ... when your image is less than 200 pixels wide or ... through the LinkedIn Audience Network". Images: 1.91:1 at 1200 × 628 (minimum 640 × 360), square 1200 × 1200, vertical 4:5 at 720 × 900, and "Vertical assets serve only on mobile devices". The source's 600-character intro maximum and 1200×627 are out of date.

**Carousel and video** (https://www.linkedin.com/help/lms/answer/a424737): carousel intro text "up to 150 characters to avoid truncation (a maximum of 255)", 2 to 10 cards, 1080 × 1080 recommended and "scaled to 312 x 312px", card headline "a maximum of two lines before being truncated" (the source's 45 characters appears only in an old LinkedIn PDF); video headline 70 / 200, intro 150 / 3,000.

**Message and text ads** (source, not verified on a current page): message subject 60, body 1,500, CTA button 20; text ad headline 25, description 75. Document ads are 1080 × 1350 portrait ([paid-ads LINKEDIN-ADS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/LINKEDIN-ADS.md#formats)).

**Tone** [coreyhaines31/marketingskills, ad-creative]: professional but not dull; job-specific language the audience recognizes; data points; no consumer hype ("Amazing!"); first-person peer testimonials, real ones only.

## TikTok

**Auction In-Feed** (https://ads.tiktok.com/help/article?aid=10002742; TikTok's Reservation In-Feed spec article for the caption rules):

- **Ad caption:** up to 4 lines; "keep the ad captions within 50 characters for CN/JP/KR or 100 characters in other languages to avoid being covered by See more"; full-width characters count 2. It "Cannot support Emojis and '{ }'", and non-Spark captions do "not support any clickable links, symbols (@), or hashtags". The source's "80 chars recommended" is unsourced.
- **Account name:** "Displays only one line with a maximum of 10 characters (Chinese, Japanese, and Korean) or 20 characters in other languages"; app names are "automatically extracted from the App Store or Google Play". The source's 40-character display name is wrong.
- **Spark Ads** use the organic post's caption ("A maximum of 4 lines ... including emojis") and the creator's handle; the CTA button is added by the advertiser.
- **Video:** 9:16 at least 540 × 960, 16:9 at least 960 × 540, 1:1 at least 640 × 640; up to 10 minutes; up to 500 MB; at least 516 kbps. Profile photo 98 × 98, under 50 KB.
- **Safe zone:** no fixed numbers; "The safe zone size is determined by the dimension ..., ad caption length, and any additional formats used", with downloadable overlay files on the same page.
- **Tone** [coreyhaines31/marketingskills, ad-creative]: native content beats polished ads; the first 2 seconds decide; trending sounds and formats; on-screen text, since many watch muted; vertical only.

## X

From https://business.x.com/en/help/campaign-setup/creative-ad-specifications: post text 280 characters, and "each link used reduces character count by 23 characters"; website card title 70 characters, two lines maximum, and "limiting ... to 50 characters should ensure no truncation on most devices"; images 800 × 418 (1.91:1) or 800 × 800 (1:1), "1:1 will be cropped to 1.91:1" on the mobile timeline, up to 5 MB; video 16:9 or 1:1. The source's "Card description 200 characters" and "Feed 16:9 1200x675" weren't found in X's spec. Tone [coreyhaines31/marketingskills, ad-creative]: conversational, short sentences, one message per post, hashtags 1 to 2 at most (often none for ads), threads for consideration content.

## Counting characters

Spaces count on every platform; special characters (|, &) count 1; URLs in body text count (on X, 23 per link); full-width CJK characters count 2 on Google and TikTok. The source's "Emojis count as 1-2 characters depending on platform" is unsourced, and TikTok's non-Spark captions take none. Always check the platform's ad preview before launch.

## Writing for several platforms

Start with the tightest field and expand [coreyhaines31/marketingskills, ad-creative], with the order updated for current limits: Meta's 27-character feed headline is now tighter than Google's 30, so write it first, then Google RSA headlines (30), LinkedIn intro text (150 before truncation), Meta primary text (50 to 150). The core message then works everywhere and gets richer where there's room.

## Prove it

Every delivered line carries its character count against the figure in this file (double-width counted as 2, links on X as 23); no Meta line is checked against 125/40/30, no LinkedIn intro against 600, no TikTok caption carries an emoji, @ or hashtag outside Spark, and no image rule caps text at 20%.
