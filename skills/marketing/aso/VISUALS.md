# Visuals: icon, screenshots and preview videos

Visuals turn a search impression into an install. The icon is the first thing seen in search [eronred]; previews autoplay muted, so their first seconds must be visually compelling, and on the App Store the first one to three screenshots appear in search results when no preview is available. Specs and rules come from Apple's and Google's docs unless tagged [eronred] (a third-party ASO skill, whose lift percentages are its own claims) or [ApparenceKit] (a Flutter starter-kit author's ASO posts); where they differ, both are given. Play asset specs are in [ANDROID.md](ANDROID.md); uploading is [app-store-connect SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/SKILL.md) and [google-play SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/google-play/SKILL.md). Capture assessment, pairings, connected composition and final-image QA are in [SCREENSHOT-PRODUCTION.md](SCREENSHOT-PRODUCTION.md); optional art directions are in [SCREENSHOT-STYLES.md](SCREENSHOT-STYLES.md).

**Contents:** [Rules for every asset](#rules-for-every-asset) · [App icon](#app-icon) · [Screenshot specs](#screenshot-specs-app-store) · [Screenshot strategy](#screenshot-strategy) · [App preview specs](#app-preview-specs-app-store) · [Preview strategy](#preview-strategy) · [Product page header and search assets](#product-page-header-and-search-assets-fall-2026) · [Prove it](#prove-it)

## Rules for every asset

Apple's metadata rules are [App Review Guidelines 2.3](https://developer.apple.com/app-store/review/guidelines/#accurate-metadata); Play's screenshot-specific guidance is in [ANDROID.md](ANDROID.md#graphic-assets).

- **Show the real app.** Screenshots "should show the app in use, and not merely the title art, login page, or splash screen"; text and image overlays are allowed (2.3.3). Previews "may only use video screen captures of the app itself"; narration and video or text overlays are allowed (2.3.4).
- **Keep it 4+.** Icons, screenshots and previews must fit a 4+ age rating even when the app is rated higher; "For Kids" and "For Children" are reserved for the Kids Category (2.3.8).
- **Own the rights and fake the data.** Secure rights to every material in icons, screenshots and previews, and show fictional account information, never a real person's data (2.3.9).
- **Other platforms:** no names, icons or imagery of other mobile platforms or alternative app marketplaces unless there is specific approved interactive functionality (2.3.10). The old line omitted that exception. [https://developer.apple.com/app-store/review/guidelines/#accurate-metadata]
- **No prices or off-type text.** Screenshots and previews must not include prices, terms or descriptions that aren't specific to the metadata type (2.3.7). If the app has in-app purchases, screenshots and previews must make clear whether featured items need an extra purchase (2.3.2).
- **Apple-designated recognitions:** do not include them in App Store assets, including earned App of the Day, Editor's Choice, App of the Year or Apple Design Award recognitions. The supplied screenshot guide and Scrnsht Studio article recommend awards as trust signals; Apple's asset guidance takes precedence over that general advice. [https://developer.apple.com/app-store/asset-best-practices/; app-store-screenshots, SKILL.md, Visual Design Principles; Scrnsht Studio, How to Make Your App Store Screenshots Convert (With These 7 Principles).md, principle 6]
- **Apple-provided product images:** keep them unmodified under Apple's usage guidelines. Do not add shadows, highlights or reflections, crop, tilt, obstruct, animate or make elements break out of that artwork. The supplied screenshot guides prescribe some of these treatments; that does not grant permission to modify Apple's assets. This restriction concerns Apple-provided product artwork, not a blanket rule about every separately authorized generic frame or real capture. [https://developer.apple.com/app-store/marketing/guidelines/; app-store-screenshots, SKILL.md, Phone framing; aso-appstore-screenshots, SKILL.md, Breakout elements]

## App icon

- **Why it matters** [eronred]: it's the first thing seen in search and "can lift TTR by 20 to 40% with no other changes". [ApparenceKit](https://apparencekit.dev/blog/aso-flutter-app-store-optimization/) [ApparenceKit](https://apparencekit.dev/flutter-tips/ab-test-apple-app-icons/): "your app icon can double your conversion rate"; "I have seen icon changes alone increase conversion by 30-100%"; for a developer-made icon it is "probably your single highest-ROI optimization".
- **Design** [eronred]: icons render at 60×60 pt in iPhone search; at most 2 elements; no text ("Apple discourages it"); a strong silhouette; test at 60×60 px; high contrast in light and dark mode (avoid white and very dark icons). Look at the top 20 competitors' icons, then be distinguishable; check that someone can describe it in 3 words. [ApparenceKit](https://apparencekit.dev/blog/aso-flutter-app-store-optimization/): simple, distinctive, relevant, high contrast, no text, "recognizable at 29x29 pixels" (a smaller test size than [eronred]'s 60×60). Category conventions to break: Productivity is blue and clean (stand out with warmer colors); Meditation is purple and blue (use an unexpected contrast color).
- **Sizes** [eronred]: App Store master 1024×1024 px, a single PNG with no transparency and no rounded corners (Apple applies the mask); home screen 60×60 pt @1x/@2x/@3x; iPad 76×76 pt @1x/@2x; Watch 40×40 pt to 44×44 pt; Android adaptive icon 108×108 dp with a 66×66 dp safe zone. The Play listing icon is 512 x 512 px (see [ANDROID.md](ANDROID.md)).
- **Audit** [eronred]: clarity at 60×60, color contrast, category differentiation, simplicity, brand alignment, each 1 to 10, out of 50.
- **Designer brief** [eronred]: 3 concepts at 1024×1024 px, each mocked at 60×60 px in a search-results context; final PNG, no alpha, no rounded corners.
- **Testing icons:** Product Page Optimization tests up to three icon treatments, and every alternate icon must be included in the binary of the published app. See [PRODUCT-PAGES.md](PRODUCT-PAGES.md).

## Screenshot specs (App Store)

- **Count and format:** at least one, up to 10 per device size; .jpeg, .jpg or .png; "Images can't include alpha channels or transparencies." Required and localizable.
- **Required to submit:** iPhone: "At least one screenshot for iPhone with Dynamic Island (medium display)." iPad, if the app runs on iPad: "At least one screenshot for iPad 13-inch display."
- **One set can cover all sizes:** if the UI is the same across sizes, provide only the highest required resolution; App Store Connect scales it down.
- **iPhone Duo:** "Starting in April 2027", iPhone Duo screenshots "will be required for any app using the iOS 27.1 SDK or later."

| Device class | Portrait sizes (landscape equivalents accepted) |
|---|---|
| iPhone with Dynamic Island, large (iPhone Air, 18 Pro Max, 17 Pro Max, 16 Pro Max, 16 Plus, 15 Pro Max, 15 Plus, 14 Pro Max) | 1260 x 2736, 1290 x 2796, 1320 x 2868 |
| iPhone with Dynamic Island, medium (18 Pro, 17 Pro, 17, 16 Pro, 16, 15 Pro, 15, 14 Pro) | 1179 x 2556, 1206 x 2622 |
| iPhone with Face ID, large | 1284 x 2778, 1242 x 2688 |
| iPhone with Face ID, medium | 1170 x 2532, 1125 x 2436, 1080 x 2340 |
| iPhone with Home Button, large / medium | 1242 x 2208 / 750 x 1334 |
| iPhone Duo (outer / inner) | 1398 x 2034 / 2007 x 2853 (submitting them shows an "optimized for iPhone Duo" badge) |
| iPad 13" (required if the app runs on iPad) | 2064 x 2752, 2048 x 2732 |
| iPad 11" | 1488 x 2266, 1668 x 2420, 1668 x 2388, 1640 x 2360 |
| Mac (16:10) | 1280 x 800, 1440 x 900, 2560 x 1600, 2880 x 1800 |
| Apple TV / Vision Pro | 1920 x 1080, 3840 x 2160 / 3840 x 2160 |
| Apple Watch (one size across all localizations) | e.g. 422 x 514 (Ultra 4, Ultra 3), 416 x 496 (Series 12, 11, 10), 396 x 484 (Series 9, 8, 7) |

- **Apple's advice:** up to 10 screenshots; the first one to three appear in search results when there's no preview; consider at least one Dark Mode screenshot; localize screenshots per market. [ApparenceKit](https://apparencekit.dev/blog/aso-flutter-app-store-optimization/): "Apple gives you 10. Use at least 6"; avoid "Dark screenshots that look the same at thumbnail size", stock-photo backgrounds and too much text; design for small size with large text and high contrast. How many to fill is practice, not a rule (Apple requires one): [eronred] scores "all 10 slots", [ApparenceKit] says at least 6, and [coreyhaines31/marketingskills, aso] flags fewer than 5 and calls 4 to 5 optimal for utilities and 5 to 6 for complex apps, with "diminishing returns" past 6 ([BENCHMARKS.md](BENCHMARKS.md#screenshots-and-preview-video)).
- Resizing and the automated capture pipeline are in [app-store-connect SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/SKILL.md).

## Screenshot strategy

Source: [eronred].

- **The first three decide:** users spend 3 to 6 seconds on a product page, and the first 3 screenshots (visible without scrolling) "determine 80% of the conversion decision". [ApparenceKit](https://apparencekit.dev/blog/aso-flutter-app-store-optimization/): "Most users decide in under 2 seconds whether to download based on the first 2-3 screenshots", and the first 3 "are the only ones visible in search results and category listings".
- **Slot plan:**

| Slot | Content |
|---|---|
| 1 | The hook: benefit headline plus key UI, a before/after, or the problem statement. Any proof must follow the store-specific asset rules above. Never "Welcome to [App]", login or signup, or settings. |
| 2 to 3 | The two most compelling features |
| 4 to 7 | One feature each: `[Benefit Headline] + [Feature UI] + [Supporting Detail]` |
| 8 to 9 | Trust and differentiation within the store-specific asset rules above |
| 10 | A closing benefit or further real features, within the store-specific asset rules above |

The old [eronred] slot plan proposed social proof and a trial or millions-of-users CTA. Google's screenshot guidance recommends excluding testimonial, store-performance and CTA material; Apple's asset guidance excludes Apple-designated recognitions. Use the compliant closing alternatives from [app-store-screenshots, copy-ideas.md, Closer], not a universal proof/CTA slot. [https://support.google.com/googleplay/android-developer/answer/9866151?hl=en; https://developer.apple.com/app-store/asset-best-practices/]

- **Overlays:** benefit headlines of 4 to 6 words, at least 60 px font, high contrast, consistent fonts. Not feature names ("Push Notifications"), paragraphs or busy backgrounds.
- **Visual:** real content (no lorem ipsum), modern device frames or frameless, dark mode if the app supports it. Portrait for most apps; landscape for games, video and productivity.
- **Localize:** translate overlays and consider right-to-left layouts for Arabic and Hebrew [eronred]. The old line also recommended local currency on pricing screenshots; instead apply Apple's qualified 2.3.7 metadata rule above and review the actual localized app capture and overlay separately. [https://developer.apple.com/app-store/review/guidelines/#accurate-metadata; app-store-screenshots, copy-ideas.md, Localization notes]
- **Deliverable:** per slot `Slot [N]: [Headline] / Caption / Screen / Layout / Key element`, a design brief, and an audit table of competitors' screenshots ("Look at the top 10 apps in your category. Note what their first screenshot shows" [ApparenceKit](https://apparencekit.dev/blog/aso-flutter-app-store-optimization/)).
- **Counts across stores:** up to 10 per language on iOS; 2 to 8 on Play (Google: at least two to publish, up to 8 per device type).
- **Art direction is optional:** the incoming source puts headlines in the top 30 to 40% of the canvas; Google's highly recommended tagline limit is 20% ([ANDROID.md](ANDROID.md#graphic-assets)). Keep store constraints ahead of that author recipe, and choose a brand-appropriate direction from [SCREENSHOT-STYLES.md](SCREENSHOT-STYLES.md). [app-store-screenshots, SKILL.md, Headlines dominate; https://support.google.com/googleplay/android-developer/answer/9866151?hl=en]

## App preview specs (App Store)

- **Count:** optional; up to three per device size and language (iOS, macOS, tvOS, visionOS). Not available for iMessage apps.
- **Placement:** previews always appear before screenshots and autoplay muted, so the first seconds must be visually compelling. A preview whose aspect ratio differs from the screenshots goes to "A Closer Look".
- **File:** .mov, .m4v or .mp4 (H.264), or .mov for ProRes 422 (HQ only); max 500 MB; 15 to 30 seconds; processing takes up to 24 hours. iOS portrait or landscape; macOS, tvOS and visionOS landscape only.
- **Encoding:** H.264 target 10 to 12 Mbps, progressive, up to High Profile Level 4.0, max 30 fps, stereo 256 kbps AAC at 44.1 or 48 kHz. ProRes 422 HQ: VBR 220 Mbps, max 30 fps, audio PCM (16/24/32-bit) or 256 kbps AAC.
- **Resolution:** "Use the accepted resolution, not the device resolution, when preparing your video file."

| Device class | Accepted resolution |
|---|---|
| All modern iPhones (Duo, Dynamic Island large and medium, Face ID large and medium) | 886 x 1920 portrait, 1920 x 886 landscape |
| iPhone Home Button large and 4" | 1080 x 1920 |
| iPhone Home Button medium | 750 x 1334 |
| iPhone 3.5" | not supported |
| iPad 13", 11", 10.5" | 1200 x 1600 / 1600 x 1200 (iPad 12.9" also 900 x 1200) |
| iPad 9.7" | 900 x 1200 |
| Mac, Apple TV / Vision Pro | 1920 x 1080 / 3840 x 2160 |

- **Poster frame:** Apple's default poster frame is at 5 seconds. [eronred] says the poster frame is the first frame shown when paused and "The 0:00 frame is what 80% of users see"; make it visually striking, not text-heavy. Confirm in the current docs.
- **Resolution conflict:** [eronred] says "native device resolution (1080×1920 portrait min)"; Apple's spec table above accepts 886 x 1920 for every modern iPhone and says to use the accepted resolution, not the device one. Follow Apple's table.

## Preview strategy

Source: [eronred].

- **Goal:** up to 3 App Previews (or 1 Play promo video) "that lift product page conversion by 5 to 25%". Skip video for simple utilities and content-value apps.
- **iOS specs** [eronred]: 15 to 30 seconds; up to 3 per locale; autoplays muted in search results and on the product page; H.264, MP4 or MOV; 30 fps; portrait or landscape matching the screenshots. In-app footage only: no marketing intros, logos or real people; audio optional, subtitles required when audio carries information.
- **Basics** [eronred]'s screenshot skill: hook in the first 3 s, 15 to 30 s, no dependence on sound, show real usage.
- **30-second beat template:** 0:00 to 0:02 hook (the outcome, not the app); 0:02 to 0:08 problem framing; 0:08 to 0:20 core feature demo (speeding up 1.25 to 1.5× is fine); 0:20 to 0:26 social proof or breadth; 0:26 to 0:30 resolution plus CTA. On iOS, no "Download Now" CTA ("Apple rejects"); end on the outcome state instead.
- **CTA conflict:** [eronred]'s screenshot skill says end a video with a CTA ("Download Free" or the key benefit); its preview skill says no "Download Now" CTA on iOS ("Apple rejects"). Confirm in the current guidelines.
- **Guideline citation:** [eronred] cites "Apple guideline 2.3.10" for banning "Download Now", "Available on App Store" and app-icon overlays; Apple's 2.3.10 text covers names, icons or imagery of other mobile platforms and alternative app marketplaces.
- **Three variants:** A Outcome (default first), B Demo, C Social proof; each in its own slot.
- **Checklist:** right resolution; no download CTA, store badge or app-icon overlay; no marketing intro card; audio with captions, or no audio; poster frame not mid-typing; checked both in the search result card and on the product page; top 3 markets localized.
- **Rejections and fixes:** real people or hands: strip them; logo or intro card: cut the first 1 to 2 s; "Download" CTA: replace with the outcome state; footage doesn't match the current version: re-record after a major UI change; narration without captions: burn in captions or remove the audio.
- **Localization tiers:** Tier 1 (English, Japanese, German, French, Spanish, Chinese) localize overlays and re-record with localized in-app strings; Tier 2 overlays only; Tier 3 skip. "A localized video typically lifts conversion 8 to 15% in that market vs the default English video."
- **Capturing Android footage:** `adb shell screenrecord` and the show-touches setting are in [google-play LISTING-AND-METADATA.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/google-play/LISTING-AND-METADATA.md#screenshots-capture-and-upload).
- **Testing:** through Product Page Optimization ([PRODUCT-PAGES.md](PRODUCT-PAGES.md)); primary metric product page conversion rate, secondary video play-through rate.

## Product page header and search assets (fall 2026)

- **New creative assets** (guideline 2.3.14): a product page header and search results assets. They must pertain to the app or brand, be appropriate for all audiences, and contain no misleading references to other apps, no unverifiable claims, "or specific or discounted pricing information".
- **Images:** product page header 21:9 at 3840 x 1646 (.jpeg, .jpg, .png) or 16:9 at 5244 x 2950 (.png); search results 3:2 from 1920 x 1280 to 3840 x 2560 (.jpeg, .jpg, .png) or 16:9 at 5244 x 2950 (.png); no alpha channels.
- **Videos:** header 21:9 at 3840 x 1646, search 3:2; 30 or 60 fps; 5 to 30 seconds; .mov, .m4v, .mp4; muted by default (they can't be unmuted in search) and loop continuously.
- **Asset Library and preview tool** (October 5, 2026): upload and pre-approve assets in the Asset Library in App Store Connect, and use the preview tool (Dark Mode, devices, orientations) to see the product page and search results before submitting. Uploading through the asc CLI is in [app-store-connect SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/SKILL.md).

## Prove it

- Every screenshot is .png or .jpeg without alpha, at a size in the table, with at least one iPhone Dynamic Island (medium) shot and, for iPad apps, one 13-inch shot.
- Screenshot 1 shows the app in use with a benefit headline, not a splash, login or welcome screen; screenshots satisfy the qualified price/off-type, platform, fictional-data and asset-usage rules above. The old check said no screenshot could show any price; retain Apple's 2.3.7 qualifier rather than extending it into a blanket ban on prices inside real app UI. [https://developer.apple.com/app-store/review/guidelines/#accurate-metadata]
- A produced screenshot deck passes [SCREENSHOT-PRODUCTION.md](SCREENSHOT-PRODUCTION.md#prove-it), including the final exported images and intended locales. [aso-appstore-screenshots, SKILL.md; app-store-screenshots, template/src/lib/export-assets.ts; template/src/lib/export-render.ts]
- Every preview is 15 to 30 s, at most 30 fps, under 500 MB, at an accepted resolution, built only from screen captures, with no download CTA; its paused frame reads well.
- The icon is a 1024×1024 PNG with no transparency or rounded corners and stays recognisable at 60×60.
- Header and search assets match the 2.3.14 sizes, carry no pricing, and were checked in the preview tool.
