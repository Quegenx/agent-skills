# Meta Ads

Meta app ads buy installs and in-app events across Facebook, Instagram, Messenger and Audience Network. The app must be registered and linked to the ad account, the optimization event (Purchase or Subscribe) must reach Meta from the SDK, the Conversions API or a mobile measurement partner (MMP), and the campaign must use the app promotion objective with an app destination; without registration or linking, Meta optimizes for link clicks. Bullets tagged [appeeky] come from third-party UA skills built on the Appeeky MCP and REST API (a paid service that needs an Appeeky API key); bullets tagged [ApparenceKit] come from a Flutter starter-kit author who publishes his own fork of the Flutter Facebook plugin; bullets tagged [coreyhaines31/marketingskills, <skill>] come from that MIT-licensed practitioner repo and [lightreel] from lightreel.ai's observational blog; untagged facts come from Meta's own docs. Where the two disagree, both are stated. Creatives and their upload to Meta live in [AD-CREATIVES.md](AD-CREATIVES.md); cross-channel spend and payback in [BUDGET-AND-ROAS.md](BUDGET-AND-ROAS.md); MMPs, SKAdNetwork and AdAttributionKit in [ANALYTICS-AND-ATTRIBUTION.md](ANALYTICS-AND-ATTRIBUTION.md); Apple's own ads in [APPLE-ADS.md](APPLE-ADS.md).

**Contents:** [Prerequisites](#prerequisites) · [Objectives](#objectives) · [Campaign setup](#campaign-setup) · [Advantage+ app campaigns](#advantage-app-campaigns) · [Audiences and placements](#audiences-and-placements) · [Measurement: SDK, Conversions API, MMP](#measurement-sdk-conversions-api-mmp) · [iOS 14+: SKAdNetwork and AEM](#ios-14-skadnetwork-and-aem) · [Audits](#audits) · [Budget optimization](#budget-optimization) · [Appeeky MCP tools](#appeeky-mcp-tools) · [Prove it](#prove-it)

## Prerequisites

- **Register and link the app.** Register the app on Meta for Developers, link the ad account to it (App Dashboard > App settings > Advanced) and integrate the Facebook SDK with App Events to optimize for installs, events or value. Without registration or linking, ads "automatically optimize for link clicks ... instead of app installs". A Facebook Page is a prerequisite to advertise.
- **Events before optimization.** On first app setup you can only optimize for `LINK_CLICK`; add events (codeless setup in Events Manager, or manual code) to optimize for installs, purchases, or D2/D7 retention. Measurement requires a promoted object containing the app ID.
- **SDK versus MMP.** Meta: "We recommend that all advertisers use Facebook's SDK to measure mobile installs"; MMPs are supported, and Meta's older best-practice page (updated Feb 27, 2024) also recommends working with an MMP. [appeeky] requires the MMP live before spend ("App → MMP (AppsFlyer/Adjust/Singular) → Meta partner integration"), or "optimization degrades to installs or link clicks", and treats the MMP as the source of truth for revenue events. [ApparenceKit](https://apparencekit.dev/blog/facebook-flutter-sdk-meta-ads-events/) disagrees: "if Meta is your primary ad channel, you don't need one"; the Facebook SDK plus the Conversions API gives AEM tracking, deduplication, advanced matching and data control, and MMPs make sense with "5+ ad networks simultaneously". It puts Adjust, AppsFlyer and Branch at "$500 to $2,000+ per month after 10k monthly active users" and calls them "really hard to set up correctly". See [ANALYTICS-AND-ATTRIBUTION.md](ANALYTICS-AND-ATTRIBUTION.md).
- **Start from the app's ads context.** Know target CPA, LTV, geo, monthly budget and cap, and the angles that already win before touching a campaign; compare results to those targets, not to generic benchmarks. [appeeky]
- **Setup gate.** Purchase or Subscribe firing in Meta Events Manager in the last 7 days; Meta OAuth connected (`meta_ads_credentials_status`), then `meta_ads_list_advertisable_applications` and `meta_ads_list_pages`; at least 3 creatives. [appeeky]
- **Never auto-activate.** Create every entity `PAUSED`; activate only on the user's explicit approval and with MMP events verified. [appeeky]

## Objectives

- **Five objectives can run app ads.** App promotion (formerly "app installs") gets installs, optimizes for App Events, or maximizes value of conversions; traffic gets installed users to re-open; engagement drives a specific in-app action (spend more, start spending, lapsed return); sales and leads also use App as the conversion location. Meta's 2024 developer best-practice page still lists three (App installs, traffic, conversions) and the developer get-started page names `APP_INSTALLS`, `TRAFFIC`, `CONVERSIONS`; confirm in the current docs.
- **Use app promotion, not Traffic or Engagement, for acquisition.** The API objective is `OUTCOME_APP_PROMOTION`; Traffic brings junk clicks. [appeeky]
- **Bidding.** Meta's older best-practice page: start with Optimized CPM (oCPM), later explore CPA. For Advantage+ app campaigns Meta suggests "the Lowest cost bid type and not adding a bid cap for best results". [appeeky] uses lowest cost with an optional cost cap at scale.

## Campaign setup

All steps below are [appeeky] unless marked otherwise.

### Structure

```
Ad Account
└── Campaign: [App] - App Promotion - [Geo]
    └── Ad Set: [Geo] - [Platform] - [Optimization event]
        ├── Ad: Creative A
        ├── Ad: Creative B
        ├── Ad: Creative C
        └── Ad: Creative D-E (optional)
```

| Monthly budget | Campaigns | Ad sets | Creatives | Daily budget |
|---|---|---|---|---|
| < $1.5K | 1 | 1 | 3 | $30 to 50 |
| $1.5K to 10K | 1 | 2 (iOS/Android or geo) | 5 | $50 to 100 per set |
| $10K to 50K | 1 to 2 per geo | 2 to 3 per campaign | 5 to 8 | Scale winners |
| $50K+ | Per geo + objective | LAL + broad | Continuous refresh | CBO at scale |

First test: one campaign, one ad set, 3 to 5 creatives.

### Campaign level

- **Settings.** Objective App promotion (`OUTCOME_APP_PROMOTION`); CBO off for the initial test; iOS 14+ uses AEM + SKAN (delayed reporting is normal); special ad categories none unless regulated (health, housing, credit); status `PAUSED`.

```
meta_ads_create_campaign
  ad_account_id: "act_1234567890"
  name: "FocusApp - App Installs - US"
  objective: "OUTCOME_APP_PROMOTION"
  status: "PAUSED"
  is_adset_budget_sharing_enabled: false
```

### Ad set level

- **Settings.** Optimization app event Purchase or Subscribe; destination `APP` (`destination_type`), "never default `WEBSITE`"; billing Impressions; bid lowest cost (cost cap optional at scale); daily budget $30 to 50 minimum, +20% per day on winners; geo US, expand after 7 days of stable CPA; Advantage+ placements ON; age 18 to 65+; gender all; audience Broad, LAL 1% after 100+ events.

```
meta_ads_create_adset
  ad_account_id: "act_1234567890"
  campaign_id: "<campaign-id>"
  name: "US - iOS - Purchase"
  daily_budget_minor: 5000
  billing_event: "IMPRESSIONS"
  optimization_goal: "OFFSITE_CONVERSIONS"
  destination_type: "APP"
  promoted_object: {
    "application_id": "<meta-app-id>",
    "object_store_url": "https://apps.apple.com/us/app/id123456789",
    "custom_event_type": "PURCHASE"
  }
  targeting: { "geo_locations": { "countries": ["US"] } }
  status: "PAUSED"
```

- **Use `SUBSCRIBE`** if that is the primary MMP event.
- **Meta rejects `OFFSITE_CONVERSIONS` without `custom_event_type`.**
- **Budgets are in minor units:** $30 to 50 is `3000` to `5000`.
- **promoted_object checklist:** `application_id` matches the Events Manager app; `object_store_url` is the full store URL for the right platform (Google Play URL for Android); `custom_event_type` is `PURCHASE` or `SUBSCRIBE`, never omitted; SDK or MMP is sending events to Meta.
- **Split iOS and Android.** iOS-only ad set for iOS-first apps or limited budget; Android-only for Play-first; separate ad sets above $3K per month; combined only for a tiny budget. Android often gives faster conversion feedback; blended results mislead.

### Ad level

- **Ads.** 3 to 5 creatives minimum; static required, add video if available; CTA Install Now (`INSTALL_MOBILE_APP`); hook in the first 125 characters; name `[App] - [Geo] - VarX - [Angle] - [date]`. Build and upload them with [AD-CREATIVES.md](AD-CREATIVES.md).
- **Skip `meta_ads_create_app_install_draft` for subscription and IAP apps:** it defaults to `APP_INSTALLS` and cannot set `custom_event_type`. Games and ad-supported apps can use it with `optimization_goal: "APP_INSTALLS"` passed explicitly.

### Tracking events

- **Events Manager events (via MMP):** App Install (funnel baseline), Complete Registration (optional, activation), Purchase, Subscribe, Start Trial (freemium subscriptions).
- **What is normal on iOS after ATT:** 24 to 48 hour conversion delay; SKAN null conversions early (trust the MMP's modeled data); a Meta versus MMP CPA gap of 20%+ (the MMP is the source of truth). Zero events after 72 hours is NOT normal: debug the MMP setup.

### Activation

- **Only after the user confirms:** `meta_ads_update_campaign status "ACTIVE"`, `meta_ads_update_adset status "ACTIVE"`, `meta_ads_update_ad status "ACTIVE"`. The creative-to-Meta pipeline activates in the order ad, ad set, campaign.

### Setup validation

| Check | Pass |
|---|---|
| Events in last 7 days | ≥ 1 purchase or subscription |
| Creatives | ≥ 3 |
| Daily budget | ≥ $30 |
| Optimization | Purchase or Subscribe |
| Store URL | Opens the correct app |

- **Setup mistakes:** Traffic objective (junk clicks); optimizing for installs (low LTV); one creative; interest-heavy day 1; activating without the MMP; "$10/day budget: No exit velocity: $30+ or fewer variants"; ignoring the iOS delay.

| API error | Fix |
|---|---|
| OAuth expired | `meta_ads_oauth_start` |
| Invalid `application_id` | Register or add the app in Events Manager |
| Budget below minimum | Raise `daily_budget_minor` |
| Policy review | Soften claims |
| No Page | Connect a Page in Business Settings |
| Invalid app link | Full App Store or Play URL |

## Advantage+ app campaigns

- **What it is.** Formerly Automated App Ads. Structure is 1 campaign, 1 ad set, multiple ads (a manual campaign has multiple ad sets); "Manually test up to 50 creative combinations." SKAdNetwork Advantage+ app campaigns for iOS 14 are available. You can run as many Advantage+ app campaigns as needed.
- **Creative volume.** Bulk create up to 50 ads at a time, no limit on total creatives; upload up to 50 images, videos, playables or Instant Experiences at once; up to 5 texts and headlines. Upload a high volume of creative and "refresh them a few times a month to avoid creative fatigue".
- **Delivery.** Advantage+ placements across Facebook, Messenger, Instagram and Audience Network; lowest cost bid strategy with optional bid cap (Meta suggests no cap); breakdowns by age, gender, country, device, platform and placement.
- **Leave it alone while learning.** "Making changes while the campaign is in the learning phase is not recommended." [appeeky] scales winners by +20% per day and caps changes at 20% while an ad set has under 50 conversions (see [Budget optimization](#budget-optimization)); confirm against Meta's current guidance before changing a learning campaign. Meta's list of significant edits, each of which sends an ad set back into learning: "Any change to targeting", "Any change to ad creative", "Any change to optimization event", "Adding a new ad to your ad set", "Pausing your ad set for 7 days or longer", "Changing bid strategy"; budget, bid or ROAS-goal amounts "may or may not be significant, depending on the magnitude" ($100 to $101 unlikely, $100 to $1000 may) (https://www.facebook.com/business/help/316478108955072). So adding a variant to a learning ad set resets it; Meta publishes no safe percentage, the 20% caps here are [appeeky]'s.
- **Breaking API change (Marketing API v25.0).** "As of v25.0, Marketing API developers will no longer be able to use ... the Advantage+ app campaign API with the `smart_promotion_type=SMART_APP_PROMOTION` field"; instead set Advantage+ audience, Advantage+ campaign budget and Advantage+ placements with an `advantage_state`.
- **Legacy API fields.** Campaign: `objective=APP_INSTALLS`, `buying_type` AUCTION only, `special_ad_categories=[]`, `is_skadnetwork_attribution`. Ad set: `billing_event=IMPRESSIONS`, `promoted_object {application_id, object_store_url, custom_event_type}`, `campaign_attribution` `AEM` or `SKADNETWORK` (required for iOS 14+, the same across ad sets); targeting only `geo_locations` and `locales` (no OS targeting; SKAN Advantage+ targets only iOS 14.5+).

| `optimization_goal` | Bid strategies | Event |
|---|---|---|
| `APP_INSTALLS` | `LOWEST_COST_WITHOUT_CAP`, `LOWEST_COST_WITH_BID_CAP` | not listed |
| `APP_INSTALLS_AND_OFFSITE_CONVERSIONS` | `LOWEST_COST_WITHOUT_CAP` | `PURCHASE` |
| `OFFSITE_CONVERSIONS` | both lowest-cost strategies | any standard app event |
| `VALUE` | `LOWEST_COST_WITHOUT_CAP`, `LOWEST_COST_WITH_MIN_ROAS` | `PURCHASE` |

- **Campaign budget optimization.** [appeeky] keeps CBO off for testing (ABO gives control per test), turns it on after 1+ proven ad sets, and runs a hybrid at scale (a CBO campaign for winners, ABO for tests). [coreyhaines31/marketingskills, ads] disagrees for testing: a separate CBO testing campaign (~20% of budget), because "Why not ABO for testing: equal forced distribution keeps spending on ads Meta has already deprioritized". Both are practitioner.

## Audiences and placements

- **Phase 1, Broad (days 1 to 14):** no interest stacking, 3 to 5 variants. [appeeky]
- **Phase 2, Lookalike after 100+ purchase events:** 1% for highest quality, 1 to 3% for expansion, 3 to 5% only if the 1% CPA is stable. [appeeky]
- **Phase 3, interest stacks (optional):** "Interest targeting shrinks over time on Meta: creative matters more." [appeeky]
- **Creative requirements:** square static 1024×1024; vertical video 9:16, 15 to 30 s; 3 to 5 primary text hooks; refresh every 2 to 3 weeks or at frequency > 3. [appeeky] Meta says refresh "a few times a month", and its own size recommendations are 4:5 at 1440 x 1800 for Feed images and 9:16 at 1440 x 2560 for Reels ([AD-CREATIVES.md](AD-CREATIVES.md#meta-static-specs-and-copy)). A refresh changes the premise, wording, emotion or use case: near-identical frustration-to-app videos see one take reach and the rest stay interchangeable [lightreel].

## Measurement: SDK, Conversions API, MMP

### Facebook SDK on iOS

- **Info.plist keys:** `FacebookAppID`, `FacebookClientToken`, `FacebookDisplayName`, and the URL scheme `fbAPP-ID`.
- **Automatic events:** App Install, App Launch, In-App Purchase. Disable with `<key>FacebookAutoLogAppEventsEnabled</key><false/>` and re-enable after consent with `Settings.shared.isAutoLogAppEventsEnabled = true`.
- **ATT flag:** "Starting with iOS 14.5, you will need to set `isAdvertiserTrackingEnabled`": `Settings.shared.isAdvertiserTrackingEnabled = true` if the device consents, `false` otherwise.
- **SKAN campaigns:** configure event priority (conversion value). Meta Business SDK v8.0+ is required for iOS 14+ campaigns, and 16.2.1+ for SKAN 4.0; update MMP SDKs too.

### Facebook SDK in Flutter

All [ApparenceKit](https://apparencekit.dev/blog/facebook-flutter-sdk-meta-ads-events/) unless marked. Why iOS matters: iOS users spend 2 to 3 times more than Android users on in-app purchases and subscriptions; the problem: "On average, only 20-30% of iOS users opt in" to tracking (compare [eronred]'s "about a 25% opt-in rate" in [ANALYTICS-AND-ATTRIBUTION.md](ANALYTICS-AND-ATTRIBUTION.md#the-ios-attribution-stack)).

- **Pick the package.** `flutter_facebook_app_events` "works well for basic event tracking. But it does not support AEM." The author forked it as `facebook_flutter_sdk` (https://pub.dev/packages/facebook_flutter_sdk) with AEM built in; "The API is compatible. Switching is a one-line change in your pubspec." Use the original if you don't run Meta ads or need AEM. The fork is the article author's own package and the article states no version: check its pub.dev page for maintenance before adopting it.
- **Install** and take the **App ID** (Meta for Developers > Settings > Basic) and the **Client Token** (Settings > Advanced):

```bash
flutter pub add facebook_flutter_sdk
```

- **Android:** `android/app/src/main/res/values/strings.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="facebook_app_id">YOUR_APP_ID</string>
    <string name="facebook_client_token">YOUR_CLIENT_TOKEN</string>
</resources>
```

  and in `AndroidManifest.xml`, inside `<application>`:

```xml
<meta-data
    android:name="com.facebook.sdk.ApplicationId"
    android:value="@string/facebook_app_id" />
<meta-data
    android:name="com.facebook.sdk.ClientToken"
    android:value="@string/facebook_client_token" />
```

- **iOS:** `ios/Runner/Info.plist`; the `fb` prefix on the URL scheme "is required by the Facebook SDK":

```xml
<key>FacebookAppID</key>
<string>YOUR_APP_ID</string>
<key>FacebookClientToken</key>
<string>YOUR_CLIENT_TOKEN</string>
<key>FacebookDisplayName</key>
<string>Your App Name</string>
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>fbYOUR_APP_ID</string>
    </array>
  </dict>
</array>
```

- **ATT through `permission_handler`,** which "supports ATT out of the box", then tell the SDK the answer (the plugin documents `setAdvertiserTracking` as "Sets advertiser tracking / advertiser ID collection flags", https://pub.dev/documentation/facebook_flutter_sdk/latest/facebook_flutter_sdk/FacebookAppEvents/setAdvertiserTracking.html):

```bash
flutter pub add permission_handler
```

```xml
<key>NSUserTrackingUsageDescription</key>
<string>This identifier will be used to deliver personalized ads to you.</string>
```

```dart
import 'package:permission_handler/permission_handler.dart';
import 'package:facebook_flutter_sdk/facebook_flutter_sdk.dart';

Future<void> requestTracking() async {
  final status = await Permission.appTrackingTransparency.request();
  final facebookAppEvents = FacebookAppEvents();

  // Tell Facebook SDK whether the user opted in
  await facebookAppEvents.setAdvertiserTracking(
    enabled: status.isGranted,
  );
}
```

- **When to ask:** the article says early, "typically after onboarding", and not too late: "If you request ATT after the user has already triggered events, those early events are sent without tracking authorization. Request it during onboarding, before any purchase flow." [eronred] says after a value moment and never on first open; both are in [ANALYTICS-AND-ATTRIBUTION.md](ANALYTICS-AND-ATTRIBUTION.md#app-tracking-transparency-att). Apple's rules apply either way: ask only while the app is active, and gate nothing on the answer.
- **Events.** Create the client once (`final facebookAppEvents = FacebookAppEvents();`), then log custom events, purchases ("the most important event for ad optimization") with an `eventId` for deduplication, and add-to-cart:

```dart
await facebookAppEvents.logEvent(
  name: 'level_completed',
  parameters: {
    'level': '5',
    'score': '1200',
  },
);
```

```dart
await facebookAppEvents.logPurchase(
  amount: 9.99,
  currency: 'USD',
  eventId: transactionId, // unique ID for deduplication
);
```

```dart
await facebookAppEvents.logAddToCart(
  id: 'premium_yearly',
  type: 'product',
  price: 49.99,
  currency: 'USD',
);
```

- **Advanced matching** "improves attribution accuracy by letting Meta match events to users across devices"; Meta "also accepts pre-hashed values":

```dart
await facebookAppEvents.setUserData(
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  country: user.country,
);
```

  The article puts no ATT condition on this, and that is wrong for iOS: asked whether an app without ATT permission can use "a hashed email address or hashed phone number" to track a user, Apple answers "No. You will need to receive the user's permission through the App Tracking Transparency framework to track that user" (https://developer.apple.com/app-store/user-privacy-and-data-use/; see also [ANALYTICS-AND-ATTRIBUTION.md](ANALYTICS-AND-ATTRIBUTION.md#app-tracking-transparency-att)). Call `setUserData` on iOS only when the ATT status is authorized; hashing does not change that.
- **After a RevenueCat purchase,** log it with `transactionIdentifier` as the `eventId`. The article's block, verbatim (its leading `...` and the helper `logMetaPurchase` are not defined in it):

```dart
...
final facebookAppEvents = FacebookAppEvents();

final purchaseParams = PurchaseParams.package(package);
final res = await Purchases.purchase(purchaseParams);
if (res.purchaserInfo.entitlements.all.isNotEmpty) {
  final transactionId = res.storeTransaction.transactionIdentifier;

  await logMetaPurchase(transactionId, package.storeProduct.price, package.storeProduct.currencyCode);
}
```

  It does not compile against purchases_flutter 9.0.0+: `PurchaseResult` has `customerInfo` and `storeTransaction`, no `purchaserInfo` (https://github.com/RevenueCat/purchases-flutter/blob/main/lib/models/purchase_result.dart, and [revenuecat FLUTTER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/FLUTTER.md#purchase-flow)). `entitlements.all.isNotEmpty` is also true for an expired entitlement; RevenueCat gates on `isActive`. The check from RevenueCat's docs (https://www.revenuecat.com/docs/getting-started/making-purchases), where `result` is the `PurchaseResult` (the article's `res`; it states no SDK version):

```dart
if (result.customerInfo.entitlements.all["my_entitlement_identifier"]?.isActive ?? false) {
```

- **Client plus server, one event.** The app sends the event through the SDK with an `eventId`; the backend sends the same event through the Conversions API with the same id; Meta keeps one. With RevenueCat, forward its purchase webhooks to the Conversions API with the same transaction ID ([revenuecat BACKEND-AND-WEBHOOKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/BACKEND-AND-WEBHOOKS.md)). Reason: "Some events get lost due to network issues, app crashes, or ad blockers." Without `eventId`, "You either miss events or double-count them."
- **Events Manager error "Volume of Advertiser Tracking Enabled parameter out of range".** The article says it appears "when plugin is not properly implementing AEM protocol", and that with it "you can't start a campaign to optimize for purchases. You can only optimize for install or user SKAdNetwork events." Its fix is to switch to the author's own `facebook_flutter_sdk`.

### Conversions API for app events

- **Dataset.** App events sent via the Conversions API must be associated with a dataset linked to the app (one application per dataset). Check with `GET https://graph.facebook.com/v16.0/{ads-pixel-id}/is_consolidated_container`.
- **Send.** `POST https://graph.facebook.com/{API_VERSION}/{DATASET_ID}/events?access_token={TOKEN}`.
- **Required fields:** `action_source: "app"`; `event_id` for deduplication; `app_data.advertiser_tracking_enabled` (ATT on iOS 14.5+, `0` or `1`); `app_data.extinfo` (16 ordered values, version `a2` Android or `i2` iOS, OS version required, empty strings as placeholders).
- **Optional fields:** `application_tracking_enabled`, `campaign_ids`, `install_referrer` (Android), `vendor_id`.
- **User data, never hashed:** `anon_id` (install ID), `client_ip_address`, `madid` (IDFA or Android advertising ID).
- **Deduplication.** `event_id` + `event_name` deduplicate against SDK, App Events API and MMP events. Installs are already deduplicated: "only one install is attributed in the last 90-day window", the first event kept. An install payload uses `event_name: "MobileAppInstall"`.
- **Test** with the Payload Helper and the Test Events tool.

## iOS 14+: SKAdNetwork and AEM

Framework-level SKAN and AdAttributionKit rules are in [ANALYTICS-AND-ATTRIBUTION.md](ANALYTICS-AND-ATTRIBUTION.md). Meta adds its own limits:

- **Quotas per Meta App ID:** 9 ad campaigns across up to 9 ad accounts, and 5 ad sets.
- **Promotion rules.** The promoted app must be an iTunes app; promoted object required; the ad account must have permission to advertise the app; you can't promote an app already promoted in another ad account; you can't edit the promoted object or the SKAN flag once live.
- **Unavailable or restricted.** `buying_type` auction only; `TARGET_COST` unavailable (CBO and ad sets); deferred deep linking not available for new iOS 14+ SKAN campaigns; `user_os` must specify at least iOS 14; `billing_event` and `optimization_goal` can't both be `APP_INSTALLS`.
- **Insights.** Non-inline conversion metrics can't be aggregated across iOS 14 and non-iOS 14 campaigns.
- **Aggregated Event Measurement (iOS 14.5+)** limits apps and domains to 8 conversion events. If SKAN can't be used, use AEM (no SKAN reporting). [ApparenceKit](https://apparencekit.dev/blog/facebook-flutter-sdk-meta-ads-events/) adds that "only the highest-priority event per user gets reported", opted-out data is delayed 24 to 72 hours and filled by Meta's modeling, AEM works alongside SKAdNetwork postbacks, and it "does not magically bypass ATT. It does not send individual conversion data for users who opted out." Its delay figures for opted-in purchases: 24 to 48 hours without AEM, "only 30 mn to 24 hours delay" with it; without AEM you rely on SKAdNetwork, "which only reports app installs and a few post-install events with heavy limitations".
- **SKAN configuration in Events Manager:** Use recommendations (Facebook SDK, Conversions API or App Events API), Import from a partner app (the MMP's schema, refreshed hourly), or Customise. Requirements: ad account access to the business portfolio permitted to advertise the app; the app active in Events Manager with events received in the past 90 days; Facebook SDK 16.2.1+ for SKAN 4.0.
- **SKAN schema limits.** Fine values: up to 63 individual or bundled events. Coarse values: up to 3 per postback window (high, medium, low), with an option to apply the same setup to all three windows. "Maximise value of conversions" (purchase only) uses at least four event slots. Events without conversion values become inactive for reporting.
- **Switching SKAN 4.0 on or off** may take at least 24 hours; frequent switching may affect performance.
- **Reporting lag.** iOS shows 24 to 72 hour delays; wait 48 hours minimum before kills and "Do not pause winners at 24h on iOS alone". Trust the MMP over the Meta dashboard for iOS conversion counts. [appeeky]
- **Before launch,** set the user's expectations for iOS AEM and SKAN. [appeeky]

## Audits

All [appeeky].

- **Primary metrics:** cost per purchase or subscribe (CPA) and conversion volume; CTR and CPC are secondary. "Audit the same event you're optimizing toward."
- **When to audit:** 48 hours after launch (first full audit); an ad with $100+ spend and 0 conversions (emergency kill review); daily while scaling (morning and evening at most); frequency > 3 (fatigue); weekly full scorecard. "Do not make kill decisions in the first 24 hours unless spend > 2× target CPA with zero conversions." On iOS allow 48 hours for SKAN and MMP lag.

### Pull the data

```
meta_ads_list_campaigns
  ad_account_id: "act_1234567890"

meta_ads_list_adsets
  ad_account_id: "act_1234567890"
  campaign_id: "<optional>"

meta_ads_list_ads
  ad_account_id: "act_1234567890"
  adset_id: "<optional>"
```

```
meta_ads_insights
  target_type: "adset"
  target_id: "<adset-id>"
  level: "ad"
  date_preset: "last_3d"
  fields: "spend,impressions,clicks,ctr,cpc,cpm,frequency,actions,cost_per_action_type"
```

- **Campaign level:** `target_type: "campaign"`, `date_preset: "last_7d"`, `fields: "spend,impressions,actions,cost_per_action_type"`. **Account overview:** `target_type: "ad_account"`, `date_preset: "last_7d"`, `level: "campaign"`.
- **Action type keys:** Purchase `purchase` / `omni_purchase`; Subscribe `subscribe`; App install `mobile_app_install`; Registration `complete_registration`.

### Decide

- **Winning:** CPA under target (for example $14 versus $20) → scale; CPA < LTV × 0.5 → aggressive scale; 15+ conversions is minimum confidence, 25+ high confidence; CTR > 1% with CPA on target = creative validated.
- **Scale:** +20% per day until CPA rises 15%+ above target; one variable per day; duplicate a winner to a new ad set only after 50+ conversions at stable CPA; refresh creative every 2 to 3 weeks even on winners. [coreyhaines31/marketingskills, ads] paces it slower, "+20% every 5 days"; Meta only says to avoid frequent budget changes (https://www.facebook.com/business/help/112167992830700).
- **Kill:** spend > 2× target CPA with 0 conversions → pause now; after 48 hours, batch CPA > 1.5× target → pause the weakest, keep the 1 to 2 best; CPA > 2× target after 20+ conversions → pause; CTR < 0.5% after 5K impressions → hook failure; frequency > 4 with CTR down 40%+ → replace the creative. [coreyhaines31/marketingskills, ads] warns against pausing on a fixed CPA multiple alone ("A doubled CPA on 6 conversions with a 14-day conversion lag is noise"): check sample size, conversion lag and learning state first ([paid-ads AUDIT-GUARDRAILS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/AUDIT-GUARDRAILS.md#recommendation-safety)).
- **Hold:** CPA 0.8 to 1.2× target; fewer than 15 conversions; iOS days 1 to 2.
- **Pause, never delete:** deleting loses learning history.

| Impressions | CTR | Clicks | Conversions | Diagnosis | Fix |
|---|---|---|---|---|---|
| Low | Low | Low | Low | Creative doesn't resonate | New batch ([AD-CREATIVES.md](AD-CREATIVES.md)) |
| High | Low | Low | Low | Weak hook / thumb-stop | New hooks; competitor teardown ([AD-CREATIVES.md](AD-CREATIVES.md)) |
| High | High | High | Low | Store / onboarding issue | Audit the listing and onboarding |
| High | High | High | High, bad CPA | Paywall / pricing | Paywall work, check LTV |
| High | High | Low | Low | Listing issue | Screenshots, ratings |
| Even delivery, all bad CPA | Medium | Medium | Low | Wrong audience or event | Verify MMP setup + optimization goal |

For video, read one funnel stage at a time, as in [ad-creative's diagnostic funnel](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ad-creative/HOOKS.md#the-diagnostic-funnel); for an app, the post-click page is the store listing.

| Frequency | CTR trend | Action |
|---|---|---|
| < 2 | Stable | Scale |
| 2 to 3 | Slight drop | Prepare refresh |
| 3 to 4 | Drop 20%+ | A′ edit or new variant |
| > 4 | Drop 40%+ | Pause, new creative mandatory |

Per-campaign-type frequency bands (cold prospecting, retargeting, ABM) are in [paid-ads META-WEB-ADS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/META-WEB-ADS.md#fatigue) [coreyhaines31/marketingskills, ads]; both tables are practitioner.

| Benchmark (Meta app campaigns) | Weak | OK | Strong |
|---|---|---|---|
| Link CTR | < 0.8% | 0.8 to 1.5% | > 1.5% |
| CPA vs target | > 1.5× | 0.8 to 1.2× | < 0.8× |
| Frequency (early test) | > 4 | 2 to 3 | < 2 |
| Install → purchase rate | < 3% | 3 to 8% | > 8% |
| Install rate (click → install, static) | < 8% | 8 to 15% | > 15% |

Frequency before fatigue on statics is OK at 2.5 to 3.5; refresh at 3+. "CTR alone does not win."

- **Actions:** `meta_ads_update_ad ad_id status "PAUSED"`; `meta_ads_update_adset adset_id daily_budget_minor: 6000`; `meta_ads_update_adset status "PAUSED"`. Each write costs 2 Appeeky API credits.
- **Playbook.** Week 1: 3 to 5 ads at $30 to 50/day, kill at 2× CPA with 0 conversions, identify 1 to 2 winners by day 5. Week 2: +20% daily, A′ variations, no new geos. Week 3+: a new batch every 2 to 3 weeks, expand geo when US CPA has been stable 7+ days, cross-check profitability against RevenueCat (`rc_overview`, see [revenuecat SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/SKILL.md)).
- **Audit mistakes:** optimizing on CTR alone; killing at 12 hours on iOS; scaling an ad set with losers still active; +50% jumps; no frequency check; deleting ads.

## Budget optimization

All [appeeky]. The minimum conversions for scaling differ inside the source: the audit treats 15+ conversions as eligible, the optimizer requires 20+ before +20%.

| Signal | Action |
|---|---|
| CPA < 0.8× target, 20+ conv | +20% daily budget |
| CPA 0.8 to 1.2× | Hold |
| CPA 1.2 to 1.5×, 15+ conv | Hold, watch 48 h |
| CPA > 1.5×, 15+ conv | -20% or pause the weakest ad |
| Spend > 2× CPA, 0 conv | Pause immediately |
| Frequency > 3.5 and CTR down 25%+ | No scale, add creative first |
| Ad set CPA < target and budget capped by noon | +20% |
| Campaign hits monthly cap | Reallocate from losers |

- **Scale increment cap.** "Never increase > 20% per day on campaigns under $500/day: disrupts learning phase." $30 to 100 → +20% ($6 to 20); $100 to 500 → +20%; $500+ → +15 to 20%; $2K+ → +10 to 15% with an optional cost cap test.
- **Daily pull:**

```
meta_ads_insights
  target_type: "ad_account"
  level: "ad"
  date_preset: "last_3d"
  fields: "spend,impressions,clicks,ctr,cpc,frequency,actions,cost_per_action_type"
  limit: 100
```

- **Rank ads with ≥ 5 conversions by CPA** and split ad set spend: S (CPA < 0.8×) 50 to 70%; A (0.8 to 1.0×) 20 to 30%; B (1.0 to 1.2×) 10 to 20%, hold; C (> 1.2×) pause or minimum; F (0 conv, spend > 2× CPA) pause.
- **Campaign-level budget (CBO only):** `meta_ads_update_campaign campaign_id daily_budget_minor: 15000`.
- **Weekly rhythm:** Monday full audit; Tuesday to Thursday daily optimizer; Friday fatigue check; light weekend. Shift 10 to 20% from the worst quartile to the best; never move > 20% of total budget in one day.
- **Monthly pacing.** Cap $10,000, 12 days left, $7,200 spent → $2,800 left → at most $233/day; reduce proportionally if the run rate exceeds the cap.
- **Learning-phase protection.** Ad set under 50 total conversions → avoid > 20% changes; new creative added today → don't scale budget today; geo expansion → test budget, don't scale for 7 days.
- **Frequency gate** (`last_7d`, `frequency,ctr`): < 2.5 scale if CPA is good; 2.5 to 3.5 cautiously +10%; > 3.5 no scale.
- **Scenarios.** CPA > 1.3× target for 48 hours after a scale → roll back; budget spent by 2 pm → +20% only if CPA < target; iOS reporting lag → use MMP CPA and hold kills except under the 2× rule; one ad dominates with good CPA → allow it.
- **Cross-channel.** Meta CPA 30%+ above TikTok → flag for cross-channel budgeting ([BUDGET-AND-ROAS.md](BUDGET-AND-ROAS.md)); "ASA brand cheap, Meta broad expensive: Normal: different intent"; don't cut Meta purely on CPA when LTV by channel differs.
- **Cadence.** Under $50/day check once daily; $50 to 200 twice daily; $200+ twice daily plus a weekly audit; $1K+ consider rules plus human review. "Don't hover hourly."
- **Mistakes:** daily major restructures (one change type per day); CBO too early; emotional loyalty to a creative.

## Appeeky MCP tools

`meta_ads_credentials_status`, `meta_ads_oauth_start`, `meta_ads_list_ad_accounts`, `meta_ads_set_default_ad_account`, `meta_ads_list_pages`, `meta_ads_list_advertisable_applications`, `meta_ads_list_campaigns`, `meta_ads_list_adsets`, `meta_ads_list_ads`, `meta_ads_insights`, `meta_ads_create_campaign`, `meta_ads_create_adset`, `meta_ads_create_creative`, `meta_ads_create_ad`, `meta_ads_create_app_install_draft`, `meta_ads_upload_ad_image_from_url`, `meta_ads_update_campaign`, `meta_ads_update_adset`, `meta_ads_update_ad`. REST base `https://api.appeeky.com/v1/connect/meta-ads/` (paths in [AD-CREATIVES.md](AD-CREATIVES.md#push-creatives-to-meta)). Writes cost 2 Appeeky API credits each.

## Prove it

- Events Manager shows the app, linked to the ad account, with Purchase or Subscribe received in the last 7 days; without that, ads are optimizing for link clicks.
- The ad set has `destination_type: "APP"`, `optimization_goal: "OFFSITE_CONVERSIONS"` and a `promoted_object` whose `application_id`, `object_store_url` and `custom_event_type` (`PURCHASE` or `SUBSCRIBE`) are all set.
- Every entity was created `PAUSED` and moved to `ACTIVE` only after the user approved.
- On iOS 14.5+, the SDK sets `isAdvertiserTrackingEnabled` (Flutter: `setAdvertiserTracking`) from the ATT result, `setUserData` runs on iOS only after ATT is authorized, purchase events carry an `eventId` shared with the Conversions API, the SKAN schema is configured in Events Manager, and no more than 9 campaigns and 5 ad sets exist per App ID.
- Conversions API payloads carry `action_source: "app"`, `event_id`, `advertiser_tracking_enabled` and a 16-value `extinfo`, and pass in the Test Events tool.
- No ad was deleted, no ad set budget moved more than 20% in a day while under 50 conversions, and no kill happened in the first 24 hours (48 on iOS) without spend > 2× target CPA and zero conversions.
- Advantage+ app campaign API code does not use `smart_promotion_type=SMART_APP_PROMOTION` on Marketing API v25.0+.
