# Analytics and attribution

Knowing what users do in the app, which crashes hurt them, and which ad or channel brought each install. On iOS the mechanism that decides attribution quality is privacy: without App Tracking Transparency (ATT) permission the advertising identifier is all zeros, so most ad measurement runs through Apple's aggregated frameworks (AdAttributionKit and SKAdNetwork postbacks carrying a conversion value you design) plus AdServices for Apple Ads. On Android the Google Play Install Referrer is the deterministic source. Apple's and Google's docs are the authority for every API, window, limit and rule here; bullets tagged [eronred] are a third-party playbook whose benchmarks are its author's claims, and where the two differ both are given. Ad-network setup and their SKAN schema rules are in [APPLE-ADS.md](APPLE-ADS.md), [GOOGLE-APP-CAMPAIGNS.md](GOOGLE-APP-CAMPAIGNS.md), [META-ADS.md](META-ADS.md) and [TIKTOK-ADS.md](TIKTOK-ADS.md); ROAS math is [BUDGET-AND-ROAS.md](BUDGET-AND-ROAS.md); subscription analytics are [revenuecat SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/SKILL.md).

**Contents:** [The analytics stack](#the-analytics-stack) · [Metrics and formulas](#metrics-and-formulas) · [Event tracking plan](#event-tracking-plan) · [Dashboards](#dashboards) · [Crash analytics](#crash-analytics) · [App Tracking Transparency (ATT)](#app-tracking-transparency-att) · [The iOS attribution stack](#the-ios-attribution-stack) · [AdAttributionKit and SKAdNetwork](#adattributionkit-and-skadnetwork) · [Designing the conversion value schema](#designing-the-conversion-value-schema) · [AdServices (Apple Ads attribution)](#adservices-apple-ads-attribution) · [MMP setup checklists](#mmp-setup-checklists) · [Android attribution](#android-attribution) · [Deep links](#deep-links) · [Debugging attribution](#debugging-attribution) · [Prove it](#prove-it)

## The analytics stack

Source: [eronred].

- **Ask first:** which tools are in use; the top 3 questions about performance; which decisions the data must inform; whether paid acquisition runs (then attribution matters).

| Tool | Purpose | Cost | Need |
|---|---|---|---|
| App Store Connect | Store metrics | Free | Must have |
| Firebase Analytics | In-app events, funnels, audiences | Free | Must have |
| Mixpanel / Amplitude | Product analytics, cohorts | Free tier | Recommended |
| RevenueCat | Subscription analytics, paywall testing | Free tier | If subscriptions |
| Adjust / AppsFlyer | Attribution | Paid | If running ads |
| Crashlytics | Crash reporting | Free | Must have |

- **App Store Connect's free metrics:** Impressions, Product Page Views, App Units (first-time downloads), Conversion Rate (Product Page Views to Downloads), Proceeds (revenue after Apple's cut), Sessions, Active Devices, Retention (Day 1, Day 7, Day 28), Crash Rate (crashes per session). Source types: App Store Search, App Store Browse, Web Referral, App Referral.

## Metrics and formulas

Source: [eronred].

| Group | Metric | Formula or benchmark |
|---|---|---|
| Acquisition | Tap-Through Rate | Taps / Impressions |
| | Conversion Rate | Downloads / Page Views |
| | CPI | Ad Spend / Installs |
| | Organic % | Organic / Total Installs |
| Engagement | DAU, MAU, Session Length | |
| | Stickiness | DAU/MAU; over 20% is good |
| | Sessions/User | Total Sessions / DAU |
| Retention | Day 1 / Day 7 / Day 30 | Users on day N / Installs; 25-40% / 10-20% / 5-10% |
| | Churn Rate | Lost Users / Start Users; under 5% monthly (subscriptions) |
| Revenue | ARPU | Revenue / All Users |
| | ARPPU | Revenue / Paying Users |
| | LTV | ARPU x Avg Lifetime |
| | Trial-to-Paid | Conversions / Trial Starts |
| | MRR, Churn Revenue | Churn Revenue = Lost MRR / Start MRR |

- **The playbooks disagree with themselves:** LTV is ARPU x Avg Lifetime here and in the monetization playbook, but ARPU / Monthly churn rate in the subscription lifecycle playbook; the per-category retention benchmarks in [RETENTION-AND-MONETIZATION.md](RETENTION-AND-MONETIZATION.md#retention-and-engagement) differ from the general numbers above.
- **Five stages, not four** [coreyhaines31/marketingskills, marketing-plan]: its AARRR table adds Activation (signup completion, time-to-value, % first key action, trial to paid) and Referral (viral coefficient, NPS, ambassador attribution) between the groups above; landing on the signup page is Acquisition, completing signup and everything after is Activation.

## Event tracking plan

Source: [eronred].

```
# Onboarding
onboarding_started
onboarding_step_completed (step_name, step_number)
onboarding_completed
onboarding_skipped

# Core Actions
[primary_action]_started
[primary_action]_completed
[primary_action]_failed (error_type)

# Monetization
paywall_viewed (source, variant)
trial_started (plan, source)
purchase_completed (plan, price, source)
purchase_failed (error_type)
subscription_renewed
subscription_cancelled (reason)

# Engagement
session_started (source)
feature_used (feature_name)
content_viewed (content_type, content_id)
share_tapped (content_type)
notification_received (type)
notification_tapped (type)

# Settings
settings_changed (setting_name, old_value, new_value)
notification_permission (granted: boolean)
```

- **Name events `snake_case` as `[object]_[action]`** (`photo_saved`, `workout_completed`). Specific but not too granular; relevant properties but no PII; the same names on every platform.
- **Referral events** (`invite_sent` and the rest) are in [LAUNCH-AND-MARKETING.md](LAUNCH-AND-MARKETING.md#referral-programs).
- **Write the plan as a table:** event name, when it fires, its properties, and which tool tracks it.
- **When reading the user's data:** compare it with the benchmarks, say what the trends indicate, and give specific actions.

## Dashboards

Source: [eronred].

| Dashboard | Cadence | Contents |
|---|---|---|
| Executive | Weekly | Downloads, Revenue, DAU, Conversion, D1 Retention, Rating, each with % change |
| Funnel | Daily | Impressions, Page Views, Downloads, Activation, Purchase, with step % |
| Cohort | Monthly | Retention curves by install-date cohort, acquisition source, country, subscription plan |

## Crash analytics

Source: [eronred].

- **Why it matters:** Apple's ranking penalizes high crash rates and a high crash rate disqualifies editorial featuring (the playbook names over 2%); crashes are the #1 cause of 1-star reviews; a first-session crash destroys D1 retention.
- **Targets:** crash-free sessions over 99.5%, crash-free users over 99%.

| Tool | Gives | Setup |
|---|---|---|
| Firebase Crashlytics | Real-time crashes, ANRs, symbolicated traces | iOS: add the `FirebaseCrashlytics` pod or SPM package. Android: `implementation("com.google.firebase:firebase-crashlytics:18.x.x")` in `build.gradle (app)`; auto-captures unhandled exceptions |
| App Store Connect | Crash rate trend | Built in: App Analytics > Crashes, trend per version |
| Xcode Organizer | TestFlight and App Store crash logs | Xcode > Window > Organizer > Crashes |
| MetricKit | Hang rate, launch time (iOS 13+) | Automatic |

- **Use Crashlytics (real-time alerts and search), and App Store Connect to validate the trend.** Compare the crash rate before and after each release. Crash rate = Crashes / Sessions x 100; a spike on one version is a regression in that release.
- **Record non-fatals with context:** set custom keys `user_id` and `current_screen`. Swift: `Crashlytics.crashlytics().record(error:)`, `setCustomValue(_:forKey:)`. Kotlin: `FirebaseCrashlytics.getInstance().recordException(throwable)`.
- **Prioritize:** Priority Score = Crash Frequency x Affected Users x User Segment Weight.

| Priority | Where | Share of sessions | When |
|---|---|---|---|
| P0 | Launch, checkout, core feature | Over 1% | Fix today |
| P1 | Common flows | Over 0.1% | This release |
| P2 | Edge cases | Under 0.1% | Next release |
| P3 | Rare | Under 0.01% | Backlog |

- **Triage in Crashlytics:** sort by Impact (unique users), not frequency; group by onboarding, checkout, core feature, background, launch; assign P0/P1 to the top 3-5; set a velocity alert for any issue affecting over 0.5% of users.
- **Debug:** open the file and line; check what can be nil; reproduce with the user's context (OS, device, screen); write a failing test before fixing.
- **Symbolicate:** automatic if dSYMs are uploaded. Manual upload:

```bash
./Pods/FirebaseCrashlytics/upload-symbols -gsp GoogleService-Info.plist -p ios MyApp.app.dSYM
```

  For Bitcode builds, download dSYMs from App Store Connect > Activity > Build > dSYMs.
- **Roll out in phases and watch each step:** iOS App Store Connect > Version > Phased Release (the playbook describes a 7-day rollout of 1%, 2%, 5%, 10%, 20%, 50%, 100%); Android Play Console > Production > Managed publishing > Rollout percentage. Watch Crashlytics for 24 hours at each phase; if the crash rate rises by more than 0.2%, pause the rollout. Release mechanics are in [app-store-connect SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/SKILL.md) and [google-play SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/google-play/SKILL.md).
- **Recover crash-driven 1-star reviews:** identify the version where they appeared, fix the crash, reply to each crash-related review "Fixed in version X.X, please update", and after the update prompt for ratings ([RETENTION-AND-MONETIZATION.md](RETENTION-AND-MONETIZATION.md#rating-prompts)).

## App Tracking Transparency (ATT)

Tracking definitions, exemptions, EU prompt/reprompt rules, hashed identifiers, IDFV, CMP and deep-link privacy boundaries have one owner: [ASC privacy](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/PRIVACY-AND-COMPLIANCE.md#app-tracking-transparency). The API behavior and source timing choices below apply within that policy. [https://developer.apple.com/app-store/user-privacy-and-data-use/]

- **Three steps:** ATT is available from iOS 14.0; add `NSUserTrackingUsageDescription`; call `requestTrackingAuthorization(completionHandler:)`; check `trackingAuthorizationStatus`. The app crashes if it uses ATT without the key. Keep the string short and specific; the app name is shown already.
- **Signatures:** `class func requestTrackingAuthorization(completionHandler completion: @escaping @Sendable (ATTrackingManager.AuthorizationStatus) -> Void)` and `class func requestTrackingAuthorization() async -> ATTrackingManager.AuthorizationStatus`. Statuses: `authorized`, `denied`, `notDetermined`, `restricted`.
- **No prompt appears** (the handler runs immediately) when tracking is restricted, the user turned off "Allow Apps to Request to Track" (EU: "Allow Apps to Request to Link Your Activity Across Companies"), a request is already pending, the call comes from an app extension, or the app state is not `UIApplicationStateActive`. If the system dismisses without a decision you get `notDetermined`: call again.
- **EU expanded-prompt API:** `requestTrackingAuthorization(preferExpandedInterface:additionalInformationAction:completionHandler:)` uses a full-page sheet with Markdown from `NSUserTrackingMarkdownUsageDescription` (bold, italic, bullet lists and paragraph breaks, no underline) with an optional Additional Information button. Tapping it dismisses without an answer and returns `notDetermined`; return to ATT after the information flow only within the [policy owner's consent conditions](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/PRIVACY-AND-COMPLIANCE.md#app-tracking-transparency), never when all relevant legal-consent choices were declined. Outside the EU the two parameters are ignored. The old instruction omitted that consent condition. [Apple, AppTrackingTransparency; https://developer.apple.com/app-store/user-privacy-and-data-use/]
- **Settings link:** use `openSettingsURLString` to let a user change a denied choice; it does not override the ATT response. [https://developer.apple.com/app-store/user-privacy-and-data-use/]
- **Privacy manifests:** apps with third-party SDKs must describe what they collect, use and whether they track; Xcode combines the manifests into a report for the Privacy Nutrition Labels.
- **When to ask [eronred]:** after a value moment, once the user is invested; never on first open (too early kills the opt-in rate). Fire the prompt before any IDFA-dependent SDK call. A pre-permission screen that explains why raises grant rates (the playbook claims 2-3x). Onboarding permission order is in [ONBOARDING.md](ONBOARDING.md).
- **When to ask: the sources differ.** [ApparenceKit](https://apparencekit.dev/blog/facebook-flutter-sdk-meta-ads-events/) warns against asking too late: "If you request ATT after the user has already triggered events, those early events are sent without tracking authorization. Request it during onboarding, before any purchase flow"; its starter kit asks "within onboarding" ([ApparenceKit](https://apparencekit.dev/blog/apparencekit-4-update/)). [eronred] (above) says never on first open, when a new user's onboarding runs. Apple's rules above apply either way.
- **Attribution APIs don't need ATT:** apps can call AdAttributionKit and SKAdNetwork regardless of tracking authorization status, and their signed postbacks carry no user- or device-specific data.

## The iOS attribution stack

- **The playbook's view ("2024+") [eronred]:** IDFA with ATT opt-in is available but at about a 25% opt-in rate ([ApparenceKit](https://apparencekit.dev/blog/facebook-flutter-sdk-meta-ads-events/): "On average, only 20-30% of iOS users opt in"), deterministic where you have it; SKAdNetwork (SKAN 4.0) is the default for ad networks; AdAttributionKit (iOS 17.4+) is Apple's evolution of SKAN, used alongside it and required by some networks; the source claims MMP probabilistic matching is "banned by Apple for fingerprinting; allowed for limited use", but that claim does not authorize fingerprinting; Apple Ads attribution gives campaign and keyword detail for Apple Ads only and is always on. Its default 2025 stack: Apple Ads attribution (built in) + SKAN 4 + AdAttributionKit + an MMP for orchestration + the Apple Ads API for depth.
- **Apple's view:** "Use AdAttributionKit for app ad campaigns on the App Store and alternative marketplaces." Apple's privacy page says no fingerprinting (apps may be rejected, including for SDKs that do it) and names no limited-use exception, while the playbook says probabilistic matching is "allowed for limited use". Do not fingerprint or derive device data to identify a user/device; MMP terms cannot authorize it. The old source implied a limited-use exception. [https://developer.apple.com/app-store/user-privacy-and-data-use/]

| Framework | Available from | Works with |
|---|---|---|
| ATT | iOS 14.0 | |
| SKAdNetwork | iOS 11.3 | App Store only |
| AdServices | iOS 14.3, macOS 11.1, visionOS 1.0 | Apple Ads |
| AdAttributionKit | iOS 17.4, iPadOS 17.4, Mac Catalyst 17.4 | App Store and alternative marketplaces |

## AdAttributionKit and SKAdNetwork

- **Three participants:** ad networks register with Apple for an ad network ID, sign ads, and receive and verify postbacks; publisher apps list ad network IDs in Info.plist (`SKAdNetworkItems`, an array of dictionaries) and show signed ads; advertised apps update conversion values and can receive a copy of the winning postback.
- **If you integrate both frameworks, call both update APIs.** Calls are ignored when no postback is pending. `.adattributionkit` and `.skadnetwork` ad network IDs work in both frameworks. SKAdNetwork's `updatePostbackConversionValue(...)` calls are mirrored into AdAttributionKit's `updateConversionValue(_:lockPostback:)`.
- **One winner across both frameworks:** the most recently tapped ad wins, else the most recently viewed; click-through always beats view-through; then by timestamp; at most six impressions are considered per conversion.
- **SKAdNetwork does nothing** (empty values) in an iPhone/iPad app on macOS or visionOS, a Mac Catalyst app, or an App Clip.

### Windows (AdAttributionKit)

| Window | Value |
|---|---|
| View-through to install | 24 hours (configurable 1-7 days) |
| Click-through to install | 30 days (configurable 1-30 days) |
| First conversion update after install | 60 days |
| First conversion update after reengagement | 2 days |
| Conversion to postback receipt | At least 24-48 hours (5-10 minutes in Developer Mode) |
| View-through impressions kept per publisher app | 15, then the oldest is discarded; they expire after 24 hours |

- **Configure attribution rules** in Info.plist: `AdAttributionKitConfigurations` > `AttributionWindows` > `global` or `<ad-network-id>` > `install` > `click` (1-30 days) / `view` (1-7 days). Precedence: ad network, then global, then the system default. `ignoreInteractionType` (`view` or `click`) is allowed only in per-network configs. Cooldowns: `AttributionCooldown` > `install-cooldown-hours` / `re-engagement-cooldown-hours`, 0 to 720 hours.

```xml
    <key>AdAttributionKitConfigurations</key>
    <dict>
        <key>AttributionWindows</key>
        <dict>
            <key>global</key>
            <dict>
                <key>install</key>
                <dict>
                    <key>view</key>
                    <integer>3</integer>
                </dict>
            </dict>
        </dict>
  </dict>
```

- **Postback types:** install postbacks have `conversion-type` `download` or `redownload`; reengagement postbacks `re-engagement`. One winner (`did-win: true`); for installs up to five other networks get one nonwinning postback each (`did-win: false`); each network gets at most one postback. Reengagement comes only from clicks and has no nonwinning postbacks. Reengagement is limited monthly per app and yearly per device; Apple gives no numbers.
- **Reengagement URLs (iOS 18+):** a publisher app can pass a URL that must be a registered universal link of the advertised app; the system appends `AdAttributionKitReengagementOpen` (`Postback.reengagementOpenURLParameter`) and strips known tracking parameters.
- **Dated changes:** June 2024 added reengagement and reengagement URLs; June 2025 added multiple conversion windows, `country-code` in postbacks, attribution rules and cooldown windows.

### Conversion windows, values and tiers

- **Three conversion windows from first launch:** days 0-2, 3-7 and 8-35, the same in AdAttributionKit and SKAdNetwork 4. A winning attribution gets up to three postbacks, and the app must update the conversion value in each window. Tier 0 gets only the first postback; nonwinning attributions get one; ads signed with SKAdNetwork 3 or earlier get one winning postback.
- **Start the window:** the advertised app must call an update method at least once; call it at first launch. AdAttributionKit: `Postback.updateConversionValue(_:)`, `updateConversionValue(_:coarseConversionValue:lockPostback:)`, `updateConversionValue(_:lockPostback:)`, and `Postback.isSupported`. SKAdNetwork: `updatePostbackConversionValue(_:coarseValue:lockWindow:completionHandler:)`, `updatePostbackConversionValue(_:coarseValue:completionHandler:)`, `updatePostbackConversionValue(_:completionHandler:)`. Deprecated: `registerAppForAdNetworkAttribution()` and `updateConversionValue(_:)`.
- **iOS 18+:** `PostbackUpdate(fineConversionValue:lockPostback:conversionTypes:)` with `[.install]` or `[.reengagement]` (`nil` updates all), passed to `Postback.updateConversionValue(_:)`. iOS 18.4+: `conversionTag` on `PostbackUpdate` updates only the conversion with that tag (delivered in the reengagement URL); without a tag the most recent conversion is updated. The native-only Swift implementation is skipped; its published sample passes the install update again on its second call rather than the separately prepared reengagement update. Keep the intended install/reengagement contract distinct. [Apple, AdAttributionKit]

- **Send delay:** after a window ends or is locked, the first postback goes out after a random 24-48 hours, the second and third after 24-144 hours. Locking (`lockPostback` / `lockWindow`) finalizes the window immediately and ignores later updates in it. SKAdNetwork 3 finalizes 24 h after the last update plus a random 0-24 h; SKAdNetwork 4 locks, then waits a random 24-48 h; both versions total 24-48 h for the first postback.
- **Values:** the fine `conversion-value` is an unsigned 6-bit value (0-63) and appears only in the first postback. `coarse-conversion-value` is `low`, `medium` or `high`, sent instead in lower tiers and in postbacks 2 and 3.

| Tier (crowd anonymity) | First postback | Postbacks 2 and 3 |
|---|---|---|
| 3 | source-identifier (2-4 digits), conversion-value, publisher-item-identifier (SKAN: `source-app-id` or `source-domain`), optional country-code | 2-digit source-identifier, coarse value |
| 2 | source-identifier (2-4 digits), conversion-value | 2-digit source-identifier, coarse value |
| 1 | 2-digit source-identifier, coarse value | 2-digit source-identifier, coarse value |
| 0 | 2-digit source-identifier only | None |

- **The tier depends on crowd size** of the publisher app or domain, the advertised app, the install country and the source identifier. The playbook's privacy threshold [eronred]: if install volume is too low, the value becomes coarse or null.

### Postback copies and format

- **Get your own copy** (an exact copy sent at the same time as the network's). AdAttributionKit: Info.plist `AttributionCopyEndpoint` (Xcode: "AdAttributionKit - Postback Copy URL") set to `https://example.com`; the system uses the registrable domain (ignores subdomains) and needs valid SSL; your server accepts HTTPS POST at `https://example.com/.well-known/appattribution/report-attribution/`. Reengagement copies also need "AdAttributionKit - Opt in for Reengagement Postback Copies" = YES. SKAdNetwork: Info.plist `NSAdvertisingAttributionReportEndpoint`, path `https://example.com/.well-known/skadnetwork/report-attribution/`, copies for versions 2+ on iOS 15+. Using both frameworks: add both URLs.
- **AdAttributionKit postback JSON:** `jws-string`, optional `conversion-value`, optional `coarse-conversion-value`, `ad-interaction-type` (`view` / `click`), `country-code` (ISO 3166-2 two-letter; on the App Store, the signed-in account's location at install). JWS header `{"kid": "apple-development-identifier/1", "alg": "ES256"}`; payload keys `postback-identifier`, `publisher-item-identifier`, `marketplace-identifier`, `impression-type` (`app-impression`), `ad-network-identifier`, `did-win`, `postback-sequence-index` (0, 1, 2), `conversion-type`, `source-identifier`, `advertised-item-identifier`.

### SKAdNetwork versions

| Version | iOS |
|---|---|
| 4 | 16.1+ |
| 3 | 14.6+ |
| 2.2 | 14.5+ |
| 2.1, 2 | 14+ |
| 1 | 11.3+ |

- **Use the most recent version.** SKAdNetwork 4 signs with version "4.0", needs the app built with the iOS 16.1 SDK or later (web ads: Safari 16.1+) and a device on iOS 16.1+, and adds multiple postbacks, coarse values, hierarchical source identifiers (2, 3 or 4 digits by tier) and web ads. Apps built with earlier SDKs register only one conversion.
- **The playbook's summary [eronred]** matches Apple on the 0-63 fine value, low/medium/high coarse value and the three windows; it describes the 4-digit source identifier as encoding campaign + ad + creative and says SKAN supports Safari-to-App Store web-to-app attribution.

### Testing

- **iOS 18+:** enable Developer Mode, then Settings > Developer > Ad Attribution Testing > AdAttributionKit Developer Mode. It turns off after two weeks and needs a production Apple ID (no sandbox). Development impressions use AdAttributionKit publisher item identifier `0` (SKAdNetwork: source App Store ID `0`); development postbacks are signed with `kid` `apple-development-identifier/0`, skip reengagement rate limits and get the highest tier. Developer Mode windows are 0-3, 3-6 and 6-9 minutes with a 5-10 minute delay. Production impressions take priority over development ones. Inspect postbacks through a Wi-Fi HTTP proxy. Before iOS 18, use the testing profile.

## Designing the conversion value schema

Source: [eronred].

- **The schema is the single highest-leverage attribution decision.** Align it to the LTV signal (not vanity events), front-load it (most signal in window 1, days 0-2), and keep it monotonic when possible.

| Window 1, 6-bit fine value | Event |
|---|---|
| 0 | Install only |
| 1-5 | Onboarding completed |
| 6-15 | Activation event (for example first session of at least X) |
| 16-30 | Trial started |
| 31-45 | Paywall viewed N times (intent) |
| 46-63 | Subscription purchased |

- **Later windows:** window 2 (3-7 days) carries trial-to-paid and ARPU buckets; window 3 (8-35 days) carries D7/D14 retention and a renewal signal. Apple's docs send only a coarse value (low, medium, high) in postbacks 2 and 3, so these later-window signals can only arrive as one of those three. Non-subscription apps: revenue buckets $0, $1-5, $5-20, $20-50, $50+.
- **Network limits differ:** Google's and Meta's own SKAN schema requirements are in [GOOGLE-APP-CAMPAIGNS.md](GOOGLE-APP-CAMPAIGNS.md) and [META-ADS.md](META-ADS.md).
- **Anti-patterns:** a schema on vanity metrics (sessions); not testing the privacy threshold (low-volume campaigns return null values); mixing SDK-side and dashboard-side value mapping (pick one).

## AdServices (Apple Ads attribution)

- **Flow:** get a token from `AAAttribution.attributionToken()` (`class func attributionToken() throws -> String`), send it to Apple's attribution server, and receive a record that maps to Apple Ads campaign IDs. The token is a Base64 string with a 24-hour TTL. Give it to your MMP, or POST it yourself to `https://api-adservices.apple.com/api/v1/` with `Content-Type: text/plain` and the token as the raw body.

| Code | Meaning |
|---|---|
| 200 | Record returned (`attribution=true` or `false`) |
| 400 | Invalid token |
| 404 | Not found, or token older than 24 h; also when called too quickly: retry at 5-second intervals, max three attempts |
| 500 | Server down; retry later |

- **Payload fields:** `attribution`, `orgId`, `campaignId`, `conversionType` (`Download`, `Redownload`, `PreOrder`), `clickDate` or `impressionDate`, `claimType` (`Click` / `Impression`), `adGroupId`, `countryOrRegion`, `keywordId` (absent when Search Match matched), `adId` (iOS 15.2+), `supplyPlacement` (`APPSTORE_SEARCH_RESULTS`, `APPSTORE_SEARCH_TAB`, `APPSTORE_TODAY_TAB`, `APPSTORE_PRODUCT_PAGES`). `attribution` is true for a tap up to 30 days or a view within 24 hours before download; tap-through is prioritized over view-through. Pre-orders count when placed within 30 days of a click or 1 day of a view, with lookbacks of 90 days (click) and 61 days (view). Developer mode returns a test payload.
- **Changes by date:** September 2026, `attribution = false` for campaigns using age or gender targeting; January 2026, `supplyPlacement` added; November 2025, Apple News unsupported on iOS 26.1+; October 2025, pre-order attribution; March 27, 2025, view-through attribution with `impressionDate`; November 2024, `claimType: Click`; May 2024, the API holds connections up to 1 second before a 404 (client timeouts under 1 s may increase 404s); March 2023, a workflow update; January 2022, Creative Sets unsupported and `adId` on iOS 15.2+. Maximize Conversions campaigns bring no change to AdServices attribution.
- **Never skip it [eronred]:** an MMP without the AdServices integration silently undercounts Apple Ads installs (the playbook claims by 30-60%). If Apple Ads attribution shows more installs than the MMP, the playbook's diagnosis is that the MMP is missing the `iAd Framework` integration: switch to the AdServices framework (iOS 14.3+). Campaign setup is in [APPLE-ADS.md](APPLE-ADS.md).

## MMP setup checklists

Source: [eronred].

- **Ask first:** iOS, Android or both; current MMP (AppsFlyer, Adjust, Singular, Branch, Kochava); paid channels (Apple Ads, Meta, TikTok, Google App campaigns); the goal (new setup, a discrepancy, a value schema, migrating to AdAttributionKit).
- **AppsFlyer:** SDK started with `AppsFlyerLib.shared().start()` in `applicationDidFinishLaunching`; App ID and dev key in the dashboard; SKAN mode (Conversion Studio recommended); AdAttributionKit toggle ON for iOS 17.4+; OneLink for deep linking; in-app events via `logEvent` for purchase, subscription and trial start; the ATT prompt fires before any IDFA-dependent SDK call; network integrations enabled.
- **Adjust:** SDK and token in `Adjust.appDidLaunch(...)`; value mapping in the dashboard or SDK-side; AdAttributionKit + SKAN dual mode on; subscription tracking (App Store Server Notifications recommended for accuracy); deep links via `AdjustDeeplink`.
- **Singular:** SDK init with the API key; SKAN + AdAttributionKit configured; conversion model Predicted LTV or Custom Events; cost ETL for Apple Ads, Meta, TikTok and Google.
- **Cost and need** [ApparenceKit](https://apparencekit.dev/blog/facebook-flutter-sdk-meta-ads-events/): Adjust, AppsFlyer and Branch run "$500 to $2,000+ per month after 10k monthly active users"; "if Meta is your primary ad channel, you don't need one", using the Facebook SDK plus the Conversions API instead ([META-ADS.md](META-ADS.md#prerequisites)).
- **Branch (mainly deep linking):** Universal Links and App Links domains verified; deferred deep link tested (install, then first open routes correctly); Branch Discounts / People-Based Attribution if used as the MMP.

## Android attribution

Source: [eronred].

- **Always integrate the Google Play Install Referrer API**, even with an MMP: it is the deterministic install source and the source of truth. The data remains available for 90 days and does not change unless the app is reinstalled; call once during the first execution after install. The old source claimed a 60-second deadline. [https://developer.android.com/google/play/installreferrer/library]
- **Google Ads attribution** is built in for App campaigns ([GOOGLE-APP-CAMPAIGNS.md](GOOGLE-APP-CAMPAIGNS.md)); use an MMP SDK for Meta and TikTok.

## Deep links

Source: [eronred].

| Type | When to use |
|---|---|
| Universal Links (iOS) / App Links (Android) | Open the app from web or email if installed; fall back to the web |
| Deferred deep link | Install from an ad, then after first open route to a specific screen |
| Custom URL scheme (`myapp://`) | Internal navigation only; don't use it for ads (it won't work if the app isn't installed) |

- **Test the matrix:** install state x source x OS x OS version.
- **Common failure:** the deferred deep link works on Android but iOS falls back to the App Store homepage because the Universal Links domain isn't verified.
- **ATT applies:** Apple counts third-party deferred deep-linking tools that pass unique identifiers or create a shared identity as tracking (see ATT above).

## Debugging attribution

Source: [eronred].

| Symptom | Likely cause |
|---|---|
| MMP shows installs, the network doesn't | Postback timing, or privacy threshold not met |
| Apple Ads attribution higher than the MMP | MMP missing the `iAd Framework` integration; switch to the AdServices framework (iOS 14.3+) |
| Conversion values all 0 or null | Privacy threshold (low volume), or schema not implemented in the app |
| Install Referrer empty on Android | Inspect the Play service connection and actual referral data; the official availability is 90 days, not the old source's 60-second expiry ([guide](https://developer.android.com/google/play/installreferrer/library)) |
| Deferred deep link drops params | App doesn't handle cold-start launch params |
| Revenue mismatch between MMP and RevenueCat / App Store Connect | Currency conversion, refunds, Family Sharing; expect a 5-10% delta |

- **Never add up what each network claims** [coreyhaines31/marketingskills, attribution]: ad platforms over-count themselves (view-through, their own windows), so per-network installs overlap; count conversions once against one source of truth (the store or RevenueCat count) and explain each platform's credit separately. Reconciling sources, attribution models and incrementality tests are in [marketing-attribution SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-attribution/SKILL.md#reconciling-conflicting-sources).
- **Ask users where they heard of you** [coreyhaines31/marketingskills, attribution]: a self-reported question at the moment of conversion (for an app, an onboarding question) with a pick-list of known channels plus a free-text "other" catches dark social and word of mouth that no postback sees; answers lean toward the most memorable touch, so a 22% "YouTube" share is not 22% of the credit ([marketing-attribution SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-attribution/SKILL.md#self-reported-attribution)).

- **Testing plan:** install from each channel and verify the postback in the MMP; trigger a value update and verify it propagates; test the deferred deep link from each ad source.
- **Anti-patterns:** the ATT prompt too early; URL-scheme deep links in ad creative; forgetting AdServices for Apple Ads.

## Prove it

- **Events:** every event in the plan is `snake_case` `[object]_[action]`, carries no PII, and appears under the same name on iOS and Android in the analytics debug view.
- **Crashes:** a forced test crash and a recorded non-fatal show up in Crashlytics symbolicated, with `user_id` and `current_screen` keys; crash-free sessions read over 99.5% before widening a phased release.
- **ATT:** Info.plist has `NSUserTrackingUsageDescription`; the prompt appears only while the app is active, after a value moment, and no feature or reward depends on the answer; IDFA-dependent SDK calls happen only after the callback.
- **AdAttributionKit / SKAdNetwork:** with AdAttributionKit Developer Mode on (iOS 18+), a development impression produces a postback signed with `kid` `apple-development-identifier/0` within the 0-3 minute window plus the 5-10 minute delay, and your `/.well-known/appattribution/report-attribution/` endpoint receives the copy.
- **Conversion values:** the app calls an update method at first launch and at each schema step, and both frameworks' update APIs are called.
- **AdServices:** posting a fresh token returns 200 with an `attribution` field; a 404 is retried at 5-second intervals at most three times.
- **Totals:** installs and revenue are counted once, from App Store Connect, Play Console or RevenueCat, and never as the sum of what each network claims.
- **Android:** the Install Referrer is requested once during the first execution after install, after a successful Play service connection; inspect the returned data without treating every empty referrer as a missed 60-second deadline. [https://developer.android.com/google/play/installreferrer/library]
- **Deep links:** a deferred deep link from each ad source lands on the intended screen after install on iOS and Android, and the Universal Links / App Links domains verify.
