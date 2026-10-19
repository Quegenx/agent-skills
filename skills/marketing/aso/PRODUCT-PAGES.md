# Product pages, tests, events, App Clips and featuring

Beyond the default listing, the App Store gives four more surfaces: custom product pages (alternate pages with their own URL, and now their own keywords), product page optimization (A/B tests of the default page's visuals), in-app events (timed cards in search, the product page and the Today tab) and App Clips. Custom product pages, in-app events and new metadata in a test treatment must be approved by App Review before they show, and Apple recommends applying a treatment only once it performs better or worse with at least 90% confidence. Limits come from Apple's docs; [eronred] and [ApparenceKit] (a Flutter starter-kit author) tag third-party practice and lift claims, and several of its numbers differ from Apple's: both are given. The Play equivalents (custom store listings, store listing experiments) are in [ANDROID.md](ANDROID.md); sending paid traffic to these pages is [app-growth SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/SKILL.md).

**Contents:** [Custom product pages](#custom-product-pages) · [Product page optimization](#product-page-optimization) · [Running a store test](#running-a-store-test) · [In-app events](#in-app-events) · [App Clips](#app-clips) · [Getting featured](#getting-featured) · [Submitting them for review](#submitting-them-for-review) · [Prove it](#prove-it)

## Custom product pages

- **What they are:** up to 70 per app. Each can vary screenshots, previews, promotional text and keywords; each is localizable and has a unique URL (the default URL plus a product page ID parameter). Pages show on iOS 15 / iPadOS 15 and later, only through their link or through the keywords assigned to them in search. Disabled or deleted page URLs redirect to the default page.
- **Third-party numbers differ:** [eronred] says up to 35, shown only via the URL (never organic), that promotional text (170 characters), up to 10 screenshots per device size and up to 3 App Preview videos can change, and that keywords, name, subtitle, description, icon, age rating, price and IAPs can't change. Apple's current docs say 70 and allow assigned keywords in search; name, subtitle, description and icon stay out of the list of varied fields in both. Confirm in the current docs.
- **Keywords:** assign them from the latest approved version and "select a unique set of keywords for each page". Apple's [Search](https://developer.apple.com/app-store/search/) page adds: "ensure the keywords you select match the intent of your custom product page and that each keyword combination is unique to a single product page."
- **Before you can create one:** the app must be Ready for Distribution in at least one country. Required role: Account Holder, Admin, App Manager or Marketing.
- **Review:** every page must be approved before it's visible; page metadata is reviewed independently of an app update ([eronred]: 1 to 3 days per page). API automation is available.
- **Deep link (optional):** a universal link or custom URL for users on iOS 18 / iPadOS 18 and later; avoid URL shorteners; the deep link must be approved too.
- **Ad networks:** pass `customProductPageIdentifier` with `SKOverlay`, or `SKStoreProductParameterCustomProductPageIdentifier` with `SKStoreProductViewController`. Apple Ads can use pages on the Today tab, Search tab and in search-results ad variations. A Today tab ad shows the app name, icon and subtitle and uses a custom product page as its tap destination; ad creative can use assets from specific custom product pages, with deep links; only App Review-approved assets can be used in ads.
- **Measured lift:** Apple: "Developers see a 2.5 percentage point increase on average when referring people to a custom product page. This is a 156% increase compared to the 1.6% average conversion rate on default product pages." [eronred] claims 10 to 40% tap-through-to-install over the default page. [coreyhaines31/marketingskills, aso] quotes "+5.9% avg conversion lift" (its benchmarks cite AppTweak, SplitMetrics and MobileAction), a third-party figure beside Apple's; more third-party figures are in [BENCHMARKS.md](BENCHMARKS.md#custom-product-pages-and-custom-store-listings).
- **Metrics:** App Store Connect > Analytics > Custom Product Pages (impressions, product page views, conversion rate, install events) [eronred]; Apple shows metrics once a page has at least five first-time downloads.

### When they're worth it

Source: [eronred].

- **Worth it:** paid campaigns with distinct angles; a generic default page with niche ads; Apple Ads ad groups by theme; influencer and affiliate partners; distinct audiences that convert differently.
- **Not worth it:** all-organic traffic; under 1,000 installs a month from the source; a default page that isn't optimized yet.
- **Patterns:** pick ONE axis (audience, use case, feature, channel, funnel stage, geo or language) and ship 2 to 4 pages.
- **Apple Ads:** create the page in App Store Connect first, then in Apple Ads assign its URL under Ad Group > Creative Sets, matching the keyword theme (a journaling app: "gratitude", "mood tracker", "anxiety relief" ad groups).
- **Social ads:** put the page URL in the App Install ad's destination URL. Some networks deep-link through their SDK and may bypass the page; verify in your MMP.
- **Judge after:** at least 1,000 product page views per page and at least 14 days.
- **Mistakes:** 30 pages up front; same screenshots with only new promo text; forgetting to swap the URL in the ad; treating pages as A/B tests (they aren't); routing organic traffic to a page URL (it loses organic social proof and featuring eligibility).

## Product page optimization

- **What it tests:** up to three treatments of app icons, screenshots and previews on the default page, iOS and iPadOS only, shown to users on iOS 15 / iPadOS 15 and later. Not the description, name or subtitle [eronred]. Not available for custom product pages, Apple Watch or iMessage pages.
- **Before starting:** the app must be Ready for Distribution; reference name up to 64 characters; one test at a time; a running test can't be changed.
- **Review and binaries:** new metadata in a treatment must be approved by App Review. Alternate icons must all be included in the binary of the published app; tests without alternate icons can be submitted without a new version.
- **Icon test from a Flutter project** [ApparenceKit](https://apparencekit.dev/flutter-tips/ab-test-apple-app-icons/): (1) in Xcode, in the project's `Assets`, add a new "iOS App Icon" set with all required sizes for each icon to test; (2) in project settings, General > "App Icons and Launch Screen" > "App Icons Source", select the set to use ("the name of the default icon you select here is the one you provided in your assets folder"); (3) submit the build and wait for Apple to validate it; (4) App Store Connect > Product Page Optimization > create a test with the icon versions; (5) "Now you have to send this test to validation (again)." The tip doesn't say how the non-default sets get into the binary, which Apple requires (line above): check the build includes them before step 4.
- **Traffic:** you set the proportion of traffic split across treatments (30% with three treatments gives 10% each). [eronred] conflicts with itself: its A/B skill says "Traffic split is automatic (not configurable)"; its icon skill says "Set traffic allocation (20 to 33% per variant)". Apple's docs describe a proportion you choose. [ApparenceKit](https://apparencekit.dev/blog/aso-flutter-app-store-optimization/): "I recommend 50/50 for faster results with two variants".
- **Releasing during a test** ([Apple, PPO overview](https://developer.apple.com/help/app-store-connect/create-product-page-optimization-tests/overview-of-product-page-optimization)): "Releasing a new app version while a test is in progress may impact the results if your version contains assets or metadata that are currently being tested." Treatments "can be localized in any language your app supports."
- **Duration:** "A test runs for 90 days or until you manually stop it." [eronred] gives 7 to 90 days, a 7-day minimum (icon skill) and a 14-day minimum (preview skill).
- **Confidence:** Apple's estimate targets at least 90% confidence and recommends waiting until a treatment performs better or worse "with at least 90% confidence" before applying it. [eronred] says 90% minimum, aim for 95%; its preview skill targets 95% or more; its icon skill p < 0.05. [coreyhaines31/marketingskills, aso] calls Apple's method "Bayesian"; Apple's overview says only that results are "based on the estimated lift in conversion rate, as well as algorithms that provide confidence", so don't repeat the method name.
- **Ending:** applying a treatment ends the test. Scope note [eronred]: tests use organic App Store traffic only.
- **Where:** App Store Connect > App > Product Page Optimization > Create Test [eronred].

## Running a store test

[eronred] The source writes this method for Apple's product page optimization; Play's store listing experiments and their own settings are in [ANDROID.md](ANDROID.md).

- **What to test first:** the first screenshot (15 to 30% lift possible), then the icon (10 to 20%), screenshot order (5 to 15%, low effort), screenshot style (5 to 15%, high effort), preview video (5 to 10%). "Always start with the first screenshot"; "80% of users never scroll past the first 3 screenshots". [ApparenceKit](https://apparencekit.dev/blog/aso-flutter-app-store-optimization/) orders it differently: "**A/B test quarterly.** Icon first, then screenshots, then description", and "Run at least one test per quarter" (a 10% lift from a screenshot test means 10% more free downloads every day).
- **Hypothesis:** `If we [change], then [metric] will [improve/increase] because [reason].`
- **Variants:** change ONE thing ("if you're testing icons, don't change your app screenshots at the same time" [ApparenceKit](https://apparencekit.dev/flutter-tips/ab-test-apple-app-icons/)), make it a significant change, and use at most 3 variants including the control. [ApparenceKit](https://apparencekit.dev/blog/aso-flutter-app-store-optimization/): "when starting out: create 3 completely different screenshots to test different angles. Don't just change the colors or captions. Test different value propositions."
- **Sample size:** at least 1,000 impressions per variant (a fixed floor from the source; to size a test from your own baseline and the lift you need to detect, use [ab-testing SAMPLE-SIZE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SAMPLE-SIZE.md)). Duration by daily impressions: under 1,000, 30 to 90 days; 1,000 to 5,000, 14 to 30 days; over 5,000, 7 to 14 days.
- **While it runs:** monitor, but don't stop early.
- **Reading results:** the primary metric is install conversion rate (impressions to installs); read the confidence interval, not the point estimate; check segments (new vs returning, country, source).
- **Test ideas and expected impact:** first screenshot feature- vs benefit-focused 10 to 30% CVR; a "5M+ users" badge 5 to 15%; video vs none 5 to 15%; 30 s vs 15 s video 3 to 8%; icon color 5 to 20% TTR.
- **Output:** a test plan; results (significance, lift with its confidence interval, segments, next test, annual impact = downloads × lift); a 3-month roadmap.

## In-app events

- **Where they show:** the product page, search results, and the Today, Games and Apps tabs on iOS 15 / iPadOS 15 and later. In search, people who downloaded the app before see the event card; others see screenshots and previews. [eronred] adds personalized recommendations for lapsed users as a surface.
- **Limits:**

| Item | Limit |
|---|---|
| Published at a time | 10 |
| Approved in App Store Connect | 15 |
| Overlapping start times | 10 events |
| Reference name / event name | 64 / 30 characters |
| Short / long description | 50 / 120 characters |
| Duration | 15 minutes to 31 days |
| Publish date | up to 14 days before the start |
| Regional start dates | within 48 hours of each other |

- **Required fields:** a deep link (universal link recommended), a purpose (Appropriate for all users, Attract new users, Keep active users informed, Bring back lapsed users), a priority (High or Normal), and whether an IAP is required. Every event must be approved. Required role: Account Holder, Admin, App Manager or Marketing.
- **Badges:** Challenge, Competition, Live Event, Major Update, New Season, Premiere, Special Event. ([eronred]'s events skill lists six, without New Season; its featuring skill lists all seven.)
- **Guideline 2.3.13:** the event must fall within an event type App Store Connect provides, metadata must pertain to the event, it must happen at the selected times across storefronts, and the deep link must go to the right place.
- **Not good candidates:** daily tasks or rewards, price promotions without new content, general app awareness.
- **Copy:** event name in title case, the actual event name, not a call to action; descriptions in sentence case; no unverifiable claims ("the best", "#1"); "Don't include specific prices ... will lead to rejection". [eronred]: lead the name with the benefit, not the app name ("30-Day Habit Challenge", not "AppName Challenge 2026"), and work in 1 to 2 target keywords naturally, since names and short descriptions are indexed.
- **Media:** card image or video 16:9, 1920x1080 to 3840x2160; details page 9:16, 1080x1920 to 2160x3840; video 30 or 60 fps, 15 to 30 seconds; max 500 MB; .jpg, .jpeg, .png and .mov, .m4v, .mp4. Avoid text or logos in the media, and no borders or gradients. [eronred] gives other card sizes (2160×1080 at 2:1 in its events skill, 1920×1080 in its featuring skill); use Apple's spec. [eronred]: test the thumbnail at 390×195 px and show the outcome or reward, not UI.
- **Notifications:** Apple: users can opt in to a notification when the event starts. [eronred] claims lapsed users "receive a push notification for your event automatically, no opt-in required" and advises writing the event name as the notification subject. Apple's wording describes an opt-in; confirm in the current docs.
- **Which badge by app type** [eronred]: games Challenge, Competition, Major Update; fitness Challenge, Live Event, Major Update; productivity Major Update, Premiere; social Live Event, Challenge; streaming Premiere, Special Event; utility Major Update, Special Event.
- **Timing:** Apple allows publishing up to 14 days before the start. [eronred] says review takes "typically 24 to 48 hours" and to submit 3 to 5 days before the start (4 to 5 elsewhere in the same skill; its featuring skill says 2+ weeks).
- **Cadence** [eronred]: "Run at least one event per month"; the Today tab favors timely, high-quality, engaging, consistent events, and events shorter than 7 days miss Today tab consideration.
- **Where:** App Store Connect > App > In-App Events > `+` [eronred]. Creating events with the asc CLI is in [app-store-connect SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/SKILL.md).

## App Clips

- **Rules:** App Clips cannot contain advertising (2.5.16, 2.5.18).
- **Size:** Apple's maximum build sizes for App Clips: 100 MB on iOS 17 and later (digital invocations only, not supported below iOS 17), 15 MB on iOS 16 and later, 10 MB earlier. [eronred] says at most 15 MB (thinned binary); confirm in the current docs.
- **Surfaces** [eronred]: App Store search (a separate card labelled "App Clip" with "Open"), Smart App Banners, QR and App Clip codes (NFC/QR), Safari, Messages, Maps, Siri suggestions. The App Clip card inherits the main app's title and description metadata. Clip-to-full-app conversion is "typically 3 to 5× higher than cold organic traffic".
- **Scope** [eronred]: the core experience only, delivered within 60 seconds; Apple Pay or Sign in with Apple; no clip-only content; only essential permissions ("no push notifications in App Clips").
- **Setup** [eronred]: URL pattern `https://yourdomain.com/clip/[experience]`; configure in App Store Connect > App > App Clip Experiences; Associated Domains entitlement; check the size report in Xcode. Hand off to the full app with `SKOverlay.AppClipConfiguration(position: .bottom)`, presented after the user gets value.
- **Card** [eronred]: title at most 18 characters, subtitle at most 13; header image 3000×2000 px; an action button ("Order", "Pay", "Play"); multiple experiences per URL pattern (default, location, campaign, feature).
- **Measure** [eronred]: App Store Connect > App Analytics > App Clips: sessions, cards displayed, Clip-to-full-app conversions, unique users.

## Getting featured

[eronred] All third-party guidance; the nomination form is Apple's.

- **Placements:** App of the Day, Game of the Day, Today Tab Story, Apps We Love, Category Feature, Search Feature, In-App Events.
- **What editors weigh:** design quality and adoption of Apple technology (very high), unique value, story, timeliness (high), rating 4.5+, stability, accessibility, privacy (medium).
- **Checklist:** HIG, dark mode, iPad, all 10 screenshot slots; Apple tech such as WidgetKit, Live Activities, App Intents and Shortcuts, SharePlay, StoreKit 2, App Clips, visionOS ("highest priority in 2025-2026"), Apple Intelligence; quality: 4.5+ rating, monthly updates, launch under 2 seconds, VoiceOver and Dynamic Type, accurate privacy labels, ATT. The source also says "Apple strongly favors SwiftUI apps", a native-iOS claim.
- **Nominate:** https://developer.apple.com/contact/app-store/promote/
- **Pitch:** name and link, a one-sentence pitch, what's new, the Apple tech used, the story angle, timing, assets.
- **Timing:** best 2 to 4 weeks before a major update, around Apple events, seasonal and cultural moments, and the day of an OS release. Worst: after a buggy update, with a rating below 4.0, or with no recent updates. [coreyhaines31/marketingskills, aso]'s benchmarks say "4.0 stars = minimum for Apple featuring"; no Apple page read for this skill states a rating floor, so treat both as third-party.

## Submitting them for review

- Custom product pages, product page optimization tests and in-app events are items you add to a submission, with an app version or on their own.
- "Each platform can have one app version submission under review at a time." At most two submissions per platform can be under review: one that includes an app version and one with items only (in-app events, custom product pages). Submissions may not be reviewed in order.
- "All items submitted together must be Accepted to complete the submission." The submission steps are in [app-store-connect TESTFLIGHT-AND-RELEASE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/TESTFLIGHT-AND-RELEASE.md).

## Prove it

- Every custom product page has its own keyword set taken from the latest approved version, is approved, and its URL (not the default one) is in the ad that should use it.
- A PPO test changes one asset type, every alternate icon it uses is in the shipped binary, and a treatment is applied only after Apple reports at least 90% confidence.
- Each in-app event uses one of the seven badges, its name is the event's real name in title case within 30 characters, its descriptions fit 50 and 120, its media are 16:9 and 9:16 at the listed sizes with no prices, text or logos, and its deep link opens the event.
- The App Clip shows no ads.
