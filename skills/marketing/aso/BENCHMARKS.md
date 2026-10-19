# ASO benchmarks

Third-party conversion, rating, screenshot, video, custom page and event figures in one place, each with the source that reports it and that source's date. None of them is Apple's or Google's; the official figures (Apple's 2.5 percentage point custom product page lift, Google's LiveOps blog numbers) are in [PRODUCT-PAGES.md](PRODUCT-PAGES.md) and [ANDROID.md](ANDROID.md#promotional-content). Every figure below is reported by [coreyhaines31/marketingskills, aso] `references/benchmarks.md` ("Industry data from AppTweak, SplitMetrics, Sensor Tower, and others. Updated March 2026"), which names its underlying sources per section; none were re-checked for this skill. Treat them as context for reading your own numbers, never as a target or a promised lift.

**Contents:** [Conversion rate by category](#conversion-rate-by-category) · [Ratings](#ratings) · [Screenshots and preview video](#screenshots-and-preview-video) · [Custom product pages and custom store listings](#custom-product-pages-and-custom-store-listings) · [In-app events](#in-app-events) · [Reading a test's lift](#reading-a-tests-lift) · [Prove it](#prove-it)

## Conversion rate by category

[coreyhaines31/marketingskills, aso] reports, citing "AppTweak 2025 Benchmarks Report (H1 2024 data, US market)": average page view to install conversion iOS 25.0%, Google Play 27.3%.

| Category | iOS CVR | Google Play CVR |
|---|---|---|
| Navigation | 115%* | -- |
| Auto & Vehicles | -- | 70.5% |
| Business | 66.7% | -- |
| Music (Games) | -- | 45.0% |
| Utilities & Tools | -- | 36.8% |
| Shopping | -- | 27.7% |
| Health & Fitness | -- | 23.2% |
| Finance | -- | 19.7% |
| Food & Drink | -- | 13.1% |
| Games (Board) | 1.2% | 7.3% |
| Games (overall) | 3-5% realistic | -- |

*"Above 100% = some users install from search without visiting product page."

## Ratings

[coreyhaines31/marketingskills, aso] reports, citing AppFollow, MobileAction, Sensor Tower and Troof.ai:

| Rating change | Conversion impact |
|---|---|
| 3.0 to 4.0 stars | +89% |
| 4.0 to 4.5 stars | +20-30% |
| 4.3 to 4.6 stars | +22-28% (Finance, Health) |
| 0.4-star gap vs competitor | ~25% lost installs from same search |
| 3-star vs 5-star app | 50% fewer conversions for 3-star |

- "4.5+ stars = optimal zone. Sweet spot: 4.1-4.9"; "5.0 stars can look suspicious to users"; "79% of users check ratings before downloading"; "50% reject apps below 3 stars".
- **Not official:** the same file's "4.0 stars = minimum for Apple featuring" and "Below 3.5 = sharp visibility drop on both stores" are stated without an Apple or Google source, and no store page read for this skill says either. [eronred]'s "rating below 4.0" as a bad time to pitch editors is in [PRODUCT-PAGES.md](PRODUCT-PAGES.md#getting-featured).

## Screenshots and preview video

[coreyhaines31/marketingskills, aso] reports, citing AppTweak, ASOMobile and Sensor Tower for screenshots and StoreMaven, SplitMetrics and Leanplum for video:

- **Screenshots:** "90% of users do not scroll past the 3rd screenshot"; "Average scroll rate: only 17%"; users scan 6 to 10 seconds before deciding; well-designed screenshots lift conversion 20 to 35%; A/B test winners see 10 to 25%; optimal count "4-5 for utility apps, 5-6 for complex apps", and "More than 6: diminishing returns, can cause decision paralysis"; top 200 apps update screenshots 2 to 4 times a year, top Play games up to 8 times; "57% of top games A/B tested screenshots at least 2x in 2024".
- **The count conflicts:** [eronred] scores "all 10 slots" ([AUDIT.md](AUDIT.md#the-weighted-score)) and [ApparenceKit] says "Use at least 6" ([VISUALS.md](VISUALS.md)). All three are practice; Apple requires one screenshot.
- **Video:** iOS +20 to 40% conversion lift; "Autoplay introduced in iOS 11 caused +47% conversion jump"; viewers are "2x more likely to install"; average watch time "4-6.5 seconds (first 5 seconds are critical)"; "50%+ of viewers watch to the end". The source's own takeaway: "Treat reported video benchmarks as context, not a guaranteed lift." Its Play note: "A tap-to-play rate does not measure all video exposure or establish conversion lift", citing [Google's preview asset guidelines](https://support.google.com/googleplay/android-developer/answer/9866151) for playback (autoplay muted up to 30 seconds).

## Custom product pages and custom store listings

[coreyhaines31/marketingskills, aso] reports, citing AppTweak, SplitMetrics and MobileAction (CPPs) and Phiture and MobileAction (CSLs):

- **Apple custom product pages:** average lift "+5.9% for apps, +3.5% for games", best cases up to +8.6%; Apple Ads CPP conversion "55.8% in 2024 (up from 42.1% in 2023)"; "Only 31% of apps and 26% of games use CPPs"; screenshot reordering alone gave +16.6% installs in one case. Apple's own figure (2.5 percentage points, 156%) is in [PRODUCT-PAGES.md](PRODUCT-PAGES.md#custom-product-pages).
- **Play custom store listings:** one case study (Lockwood, Avakin Life) "+57% CVR over 2 months".

## In-app events

[coreyhaines31/marketingskills, aso] reports, citing Phiture, AppTweak and Appalize: 55% of the top 200 apps use them regularly; 15 to 20% more impressions from editorial and browse placements; single cases of +124% impressions and of +50% impressions and first-time downloads; search conversion +10.3%; re-downloads +15.5%; "Boost is short-lived -- KPIs drop to baseline when event ends"; "Optimal: 2-4 active events per month". Apple's limits on events are in [PRODUCT-PAGES.md](PRODUCT-PAGES.md#in-app-events).

## Reading a test's lift

[coreyhaines31/marketingskills, aso] reports, citing SplitMetrics and MobileAction:

| Improvement | Classification |
|---|---|
| >10% | Strong winner -- apply immediately |
| 5-10% | Meaningful winner |
| 2-5% | Marginal winner |
| <2% | Noise -- not significant |

Apple's rule for applying a treatment is the confidence it reports, at least 90% ([PRODUCT-PAGES.md](PRODUCT-PAGES.md#product-page-optimization)); sizing a test from a baseline and the lift to detect is [ab-testing SAMPLE-SIZE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SAMPLE-SIZE.md).

## Prove it

- Every benchmark quoted in an audit or plan names the source this file gives and its date, and none is presented as Apple's or Google's.
- A test is called a winner from the store's reported confidence, not from the lift bands alone.
