# Google App campaigns

Google Ads App campaigns (often called UAC) promote an app across Google Search and search partners, Google Play (search results, related apps, homepage), YouTube, the Display Network (Gmail, other apps, mobile websites) and Discover from a few lines of text, a bid, a budget, assets, languages and locations. The system tests the combinations itself, so two things decide most outcomes: the conversion event the campaign optimizes toward (an in-app action that predicts value, not the install) and the volume and quality of assets it has to mix. Google's help pages are the authority here; [appeeky] and [eronred] (third-party UA and ASO skills) add practice, and where their numbers differ from Google's, both are given. The tracking it depends on is [ANALYTICS-AND-ATTRIBUTION.md](ANALYTICS-AND-ATTRIBUTION.md); how much budget it gets is [BUDGET-AND-ROAS.md](BUDGET-AND-ROAS.md).

**Contents:** [Subtypes and requirements](#subtypes-and-requirements) · [When it fits](#when-it-fits) · [Tracking setup](#tracking-setup) · [Campaign setup](#campaign-setup) · [Bidding](#bidding) · [Budget and learning](#budget-and-learning) · [Assets](#assets) · [iOS App campaigns](#ios-app-campaigns) · [Measuring and maintaining](#measuring-and-maintaining) · [Troubleshooting](#troubleshooting) · [Prove it](#prove-it)

## Subtypes and requirements

| Subtype | For | Requirements |
|---|---|---|
| App campaigns for installs (ACi) | New users; automates targeting and bidding; optional audience signals tell Google AI which users are likely to install, to "overcome cold start challenges" | No strict requirements |
| App campaigns for engagement (ACe) | Re-engaging installed users: lapsed payers, in-app purchases, cart completion, installed but not opened, live events | At least 50,000 installs, deep links, audience lists, mobile app conversion tracking (Firebase or an app attribution partner), a privacy policy compliant with Google's EU user consent policy |
| Pre-registration (Android only) | Sign-ups before launch | An APK on at least one Play Console release track, launch within 90 days of opening pre-registration, the app not installable or purchasable in the targeted country |

- **Any App campaign needs** the app published on Google Play or the Apple App Store, a payment method, the app name, category and target audience.
- **Review:** most ads are reviewed within 24 to 48 hours, and editing during review restarts it.

## When it fits

Source: [appeeky].

| App | Fit |
|---|---|
| Android-primary | Strong |
| iOS, broad audience | Medium ("ASA usually outperforms") |
| High search intent utility | Low (Apple Ads for iOS, UAC Search for Android) |
| Visual consumer | Medium |
| Gaming | Strong (YouTube plus Play Store) |
| Monthly budget < $1.5K | Weak |

- **[appeeky] has no Google Ads API:** everything here is done in the Google Ads UI.
- **On iOS [appeeky]:** Apple Ads almost always outperforms for search intent; use App campaigns for YouTube and Display reach; SKAN applies; priority is Apple Ads, then Meta or TikTok ([META-ADS.md](META-ADS.md), [TIKTOK-ADS.md](TIKTOK-ADS.md)), then App campaigns.
- **Prerequisites before spending [appeeky]:** app published; MMP verified; a Firebase project linked to Google Ads; the Google Play Install Referrer API integrated (Android, the "Android source of truth"); in-app conversion events in Firebase.

## Tracking setup

- **Optimizing for in-app actions needs conversion events** in Google Ads or Firebase; linking Firebase lets you bid on in-app events set up as conversions.
- **Link Firebase [appeeky]:** Firebase Console > Project Settings > Integrations > Google Ads > link; import Firebase events as conversions; make the primary conversion `in_app_purchase` or a custom subscribe event.
- **Verify before launch [appeeky]:** install on a test device from an ad click and complete the event; it should appear in Firebase > Events within minutes, in Google Ads > Conversions within 24 to 48 hours, and in the MMP within minutes.

## Campaign setup

- **Path [appeeky]:** Google Ads > New Campaign > App promotion > platform > goal In-app actions > conversion event > locations and languages > daily budget.
- **Goal: In-app actions (Purchase or Subscribe), not Installs.** Bid with Target CPA after learning, or Maximize conversions. [appeeky] Google's in-app action guidance: pick an action "completed by at least 10 different users per day in the campaign".
- **"Creative quality is everything":** Google mixes the assets across Search, Display, YouTube and Play Store. [appeeky; eronred: "focus on creative"]

## Bidding

- **Every App campaign strategy is a "Target" strategy** delivering over the in-app event's conversion window; daily performance may be above or below target.

| Optimizing for | Bid | Example |
|---|---|---|
| Installs | Target CPI; leave it unchecked for Maximize conversions | $100 daily budget at $2 target CPI ≈ 50 installs/day |
| In-app actions | Target CPA; start from the budget-weighted average of existing in-app action bids (Report editor "Cost / all conv.") | $300 budget at $10 tCPA ≈ 30 actions/day |
| Value | Target ROAS | $300 budget at 20% tROAS ≈ $60 value |
| Pre-registration | Target cost-per-pre-registration, using Target CPA | |

- **Maximize conversions variants:** for installs, for in-app actions, and Maximize conversion value. With small budgets "the optimal bid per conversion may be higher than your budget" and the campaign may get no conversions.
- **Target ROAS** requires the Google Analytics for Firebase SDK and optimizes first-party in-app events from GA for Firebase, or Google Play codeless conversions (Android only), that pass a dynamic revenue value. A higher ROAS target narrows scale; base the first tROAS on the ROAS your tCPA campaigns actually achieved.
- **Phases [appeeky]:** days 1 to 7 Maximize conversions (no CPA target); days 8 to 30 Target CPA set 20% above actual CPA; day 30+ lower the target 10% every 7 days. "Do not set target CPA on day 1: Google needs 50+ conversions to optimize." [eronred]: "set CPA high then lower gradually".
- **Google's guidance differs from those phases:** set targets close to the last 30 days of actual values, and "Allow a 7-14 days stability period after each adjustment". Google's volume rules are budget multiples of the target (next section). Confirm in the current help pages.

## Budget and learning

### Google's numbers

- **Installs:** daily budget "at least 50 times your target CPI". A higher-value-installs campaign should set its target CPI "at least 20% higher" than the "All users" campaign.
- **In-app actions:** daily budget "at least 10 times your target CPA".
- **Changes restart learning:** bid strategy, budget or target changes can trigger a new learning period. Keep budget changes within a 10 to 20% range, allow 7 to 14 days of stability after each, don't remove high-performing assets or audience segments, aim for "Good" or "Excellent" Ad Strength, and judge competitive trends over a 30-day window.
- **Learning period** depends on the number of conversions, the conversion cycle length and the bid strategy: "It can take a few conversion cycles (1-2 typically)". Learning continues after the status clears. A campaign may show fluctuations or lower spend while ramping up.
- **Android vitals issues** (high crash rates, ANRs) may disqualify the app from premium Play Store inventory.
- **App Uplift experiments:** budget and bid for at least 100 (ideally 150+) conversions per day; if budget-constrained, actual CPI or CPE should not be more than 2 times lower than target.

### Third-party numbers

Source: [appeeky].

| Monthly budget | Daily | Learning |
|---|---|---|
| $1,500 | $50 | 14 days |
| $3,000 | $100 | 7 days |
| $10,000 | $333 | 5 days |

- **"Do not run UAC below ~$1.5K/month ($50/day)."** Judge at 7 days minimum, 14 ideally. In a cross-channel budget App campaigns get "typically 0% until social is proven; 5 to 10% only at $10K+".
- **Floors disagree inside [appeeky]:** "$30 to 50/day for 7+ days" (prerequisites), "$50/day" (budget table and the cross-channel floor), and $30 in the cross-channel launch sequence. Google's rule ties the budget to the target instead (50× target CPI, 10× target CPA).

## Assets

### Google's specs

- **Text:** up to 5 headlines (30 characters or less) and 5 descriptions (90 characters or less).
- **Video:** hosted on YouTube; landscape, portrait or square; Google Ads may auto-generate one. Videos 10 to 30 seconds.
- **Images:** `.jpg` or `.png`, max 5MB.

| Ratio | Minimum | Recommended |
|---|---|---|
| 1:1 | 200x200 | 1200x1200 |
| 1.91:1 | 600x314 | 1200x628 |
| 4:5 | 320x400 | 1200x1500 |

- **HTML5:** `.ZIP` max 5MB, max 512 files, up to 20 ZIPs per ad group, UTF-8, responsive; validate with the HTML5 Validator.
- **Store assets** come from the listing: app video, cover photo, screenshots, short description, title.
- **Per ad group:** up to 10 text, 20 image and 20 video assets.
- **Best practice:** upload the maximum, "4 for text, 20 each for images, videos, and where applicable, HTML5"; keep blank space under 80% of an image and overlays under 20% of its surface; hook in the first 2 to 3 seconds; 2+ cuts in the first 5 seconds; HTML5 interaction within 3 or 4 seconds.
- **Ratings:** after "Learning", assets are rated "Low", "Good" or "Best". At the maximum, replace "Low"; below it, add assets similar to "Best"; refresh gradually.
- **Google's pages disagree on text counts:** up to 5 headlines and 5 descriptions (asset specs), "4 for text" (creative best practices), "up to 10 text" assets per ad group (volume guidance). Confirm in the current docs.

### Third-party asset practice

- **[appeeky]:** videos 5+ (15 to 30 s), images 5+ (1200×1200 and 1200×628), 5 headlines (30 characters max), 5 descriptions (90 characters max); HTML5 optional (playables for games); "Google requires 20+ total assets for optimal performance."
- **[eronred]:** 4 text ideas, 20 images, 5 videos.
- **Reuse [appeeky]:** TikTok winners become videos (16:9 if needed); Meta statics become 1200×628; App Store screenshots become 1200×1200; trim the app preview to 30 s. Headlines: 5 different angles (benefit, social proof, problem, feature, urgency).

## iOS App campaigns

- **8 or fewer iOS App campaigns per app.** More "can hinder measurement within SKAdNetwork" (the limit is to be removed for apps with on-device measurement event data).
- **Consider the ATT prompt** (optionally after a warm-up explainer screen) and AdSupport to collect IDFA. If you bid on in-app actions, prompt for ATT and/or implement on-device conversion measurement.
- **Integrate SKAdNetwork** for install measurement (Google Analytics can register the app for 'first open'), and set a conversion value schema through Google Analytics, an app attribution partner or the Google Ads API, including the biddable events.
- **SKAN schema:** each event in the schema should have more than 10 conversion events per day; aim for around 50 installs per day; fine values 0 to 63. "We currently do not support SKAN version 4's coarse conversion values." (Meta supports SKAN 4 coarse values from Meta SDK 16.2.1; see [META-ADS.md](META-ADS.md).)
- **On-device conversion measurement** uses sign-in emails (for example via Google Analytics for Firebase); only de-identified data leaves the device.

## Measuring and maintaining

- **Sources [appeeky]:** Google Ads (high reliability for Android), Firebase (source of truth for events), the MMP (cross-channel; "10 to 20% discrepancy normal"), and Play Console's install source report. "Use MMP for cross-channel comparison, Google for UAC optimization."
- **Cadence [appeeky]:** day 3, is it spending; day 7, CPA and CPI plus asset performance; day 14, replace the bottom 2 assets and add 2; day 30, set target CPA and check ROAS; monthly, refresh 30% of assets.
- **Asset signals [appeeky]:** low impressions → replace; high impressions, low installs → weak hook; one headline dominating → add variations; CPA rising after 21 days → creative fatigue.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Not running | Ads still in review (24 to 48 hours; edits restart it), or learning ramp-up | Wait; don't edit during review |
| Not spending [appeeky] | Too few assets or budget too low | Add assets; $50/day |
| No conversions on a small budget | The optimal bid per conversion exceeds the budget | Raise the budget relative to the target (10× tCPA, 50× tCPI) |
| Installs but 0 in-app actions [appeeky] | Wrong conversion event | Link Firebase events |
| High CPI, low quality [appeeky] | Optimizing for installs | Switch to in-app action optimization |
| Google and MMP differ > 30% [appeeky] | Attribution window difference | "Normal; use MMP for cross-channel" |
| Assets disapproved [appeeky] | Text overlay, health claims | Check the text overlay and health claims |
| Performance swings after a change | New learning period | Changes within 10 to 20%, then 7 to 14 days of stability |

## Prove it

- **The conversion is real:** a test install from an ad click shows its in-app event in Firebase > Events within minutes and in Google Ads > Conversions within 24 to 48 hours.
- **The goal is an in-app action** that at least 10 different users complete per day in the campaign, not installs, for a subscription app.
- **The budget matches the target:** daily budget ≥ 10× target CPA (or ≥ 50× target CPI for install campaigns).
- **Targets and stability:** use the platform guidance already documented above: targets informed by recent actual values, 7 to 14 days of stability after adjustments, and budget moves within 10 to 20%. The old check imposed [appeeky]'s day-one target prohibition as a universal gate, although the preceding official guidance differs.
- **Assets are full:** every ad group is at or near the per-ad-group maximums, and no "Low" asset stays once the maximum is reached.
- **iOS:** at most 8 active iOS App campaigns per app, and a SKAN conversion value schema that includes the biddable events.
