# App Store Preflight

A preflight scans the project and App Store metadata for rejection patterns. RevylAI's `greenlight` CLI provides a static scan with severity plus optional runtime checks of flows Apple tests by hand. truongduy2611's app-store-preflight-skills provides detect commands for metadata pulled with `asc` and app-type checklists. Both paraphrase the App Review Guidelines; differences from Apple's text are preserved in [REVIEW-GUIDELINES.md](REVIEW-GUIDELINES.md#where-preflight-summaries-differ-from-apple). Static checks see strings, not behavior: `deleteAccount` passes even when the button does nothing.

**Contents:** [Greenlight CLI](#greenlight-cli) · [Rule-file workflow with asc](#rule-file-workflow-with-asc) · [Rules: metadata](#rules-metadata) · [Rules: subscriptions](#rules-subscriptions) · [Rules: design](#rules-design) · [Rules: entitlements](#rules-entitlements) · [Rules: privacy](#rules-privacy) · [Checks by app type](#checks-by-app-type) · [Prove it](#prove-it)

Related: [privacy](PRIVACY-AND-COMPLIANCE.md) (manifest, AI consent and sign-in detection), [review notes](REVIEW-OPERATIONS.md#review-notes), [purchases](PRICING-AND-SUBSCRIPTIONS.md), [metadata](METADATA-AND-SCREENSHOTS.md), [submission](TESTFLIGHT-AND-RELEASE.md).

## Greenlight CLI

- **Run it first, install only if missing:** "Run `greenlight preflight` immediately on the project root." Install commands:

```bash
# Homebrew (macOS)
brew install revylai/tap/greenlight

# Go install
go install github.com/RevylAI/greenlight/cmd/greenlight@latest

# Build from source
git clone https://github.com/RevylAI/greenlight.git
cd greenlight && make build
# Binary at: build/greenlight
```

- **Commands:** `greenlight preflight .` scans the project root; `greenlight preflight . --ipa /path/to/build.ipa` includes a built IPA.

```bash
greenlight codescan .                      # Code-only scan
greenlight privacy .                       # Privacy manifest scan
greenlight ipa /path/to/build.ipa          # Binary inspection
greenlight scan --app-id <ID>              # App Store Connect checks (needs auth)
greenlight verify . --dry-run              # Runtime flow validation via Revyl (needs revyl CLI)
greenlight guidelines search "privacy"     # Search Apple guidelines
```

- **Re-run often:** "The scan runs in under 1 second so re-run frequently." Every finding carries a severity, guideline reference, file location and fix suggestion.

Severity mapping: CRITICAL/REJECTION -> P1, WARN/WARNING -> P2, INFO -> P3; P0 requires an independently assessed immediate incident. Exact GREENLIT/CRITICAL/FAILED CLI literals remain tool statuses. [RevylAI/greenlight; truongduy2611/app-store-preflight-skills]

| Severity | Source meaning | Action required |
|---|---|---|
| P1 | Blocking rejection finding | Must fix before submission |
| P2 | High rejection risk | Should fix, strongly recommended |
| P3 | Best practice | Consider fixing, improves approval odds |

- **Loop to GREENLIT:** "zero CRITICAL findings = GREENLIT status." Fix P1, then P2, then P3, and keep looping: "Some fixes can introduce new issues (e.g., adding a tracking SDK requires ATT)."
- **Scope:** the greenlight skill's description claims Google Play and Android checks, but its body documents only iOS commands; the app-store-preflight-compliance variant is Apple only.

### Fix recipes

| Finding | Fix |
|---|---|
| Hardcoded secrets | Expo app config/`extra` is public client data, not secret storage; the source incorrectly suggested it or bundled `process.env` values as the remedy. [https://docs.expo.dev/workflow/configuration] |
| External payment for digital goods | StoreKit or IAP instead of Stripe or PayPal for digital content. greenlight says "External payment is only OK for physical goods"; Apple also allows person-to-person real-time services and US storefront links (see [REVIEW-GUIDELINES.md](REVIEW-GUIDELINES.md#3-business)) |
| Social login | Apply [4.8's privacy properties and exemptions](REVIEW-GUIDELINES.md#4-design), which name no provider. greenlight's `expo-apple-authentication` fix is a conditional option, not a universal requirement. [https://developer.apple.com/app-store/review/guidelines/] |
| Account creation without deletion | A "Delete Account" option in settings |
| Platform references | Evaluate matches under [2.3.10's approved-functionality exception](REVIEW-GUIDELINES.md#23-accurate-metadata); the source prescribed unconditional removal. |
| Placeholder content | Replace "Lorem ipsum", "Coming soon", "TBD" with real content |
| Vague purpose strings | Say specifically why: not "Camera needed" but "PostureGuard uses your camera to analyze sitting posture in real-time" |
| Hardcoded IPv4 | Proper hostnames |
| HTTP URLs | `https://` |
| Console logs | Remove, or gate behind the `__DEV__` flag |
| Missing privacy policy | Set it in App Store Connect, with the other required metadata |

### Runtime verification (optional)

Apple tests account creation, in-app purchases and social login by hand. `verify` runs those flows on a cloud device; it is the only greenlight command that is not offline and needs the `revyl` CLI and a Revyl account. Without it, run the static steps and note that runtime validation is available.

```bash
# See which flows the app claims and the exact tests that would run, no device needed:
greenlight verify . --dry-run

# Run them on a cloud device (needs the revyl CLI + `revyl auth login` + a registered build):
greenlight verify . --build-name "<your Revyl build>" \
  --var email=<test account> --var password=<test password>

# Have a local build that isn't on Revyl yet? Upload it as part of the run with
# --artifact. Revyl runs on cloud simulators, so pass a simulator .app (iOS) or
# an .apk (Android), NOT a device .ipa. A new --build-name registers a new app.
greenlight verify . --build-name "<your Revyl build>" --artifact ./build/MyApp.app \
  --var email=<test account> --var password=<test password>
```

- **Results:** VERIFIED (flow works); FAILED (passed static analysis but broke at runtime: account deletion dead-ends, Restore Purchases is a no-op, Sign in with Apple is a dead button; "Fix the wiring, not just the presence of the string"); SETUP (could not run: not authenticated, no build, no device). Treat a FAILED flow as P1 (the source equates it to a CRITICAL finding). Ready to submit only when preflight is GREENLIT and verify reports no failed flows.

## Rule-file workflow with asc

- **Prerequisites:** the asc CLI (`brew install asc`, https://github.com/rudrankriyam/App-Store-Connect-CLI), the ASC CLI Skills (https://github.com/rudrankriyam/app-store-connect-cli-skills), jq optional. The skill's README also names the `asc-metadata-sync` skill as an alternative way to get the metadata. Install the skill with `npx skills add truongduy2611/app-store-preflight-skills` (version 1.1, guidelines synced 2026-10-16).
- **Auth:** `asc metadata pull` needs App Store Connect auth. Run `asc auth login`, or set `ASC_KEY_ID`, `ASC_ISSUER_ID` and one of `ASC_PRIVATE_KEY_PATH`, `ASC_PRIVATE_KEY`, `ASC_PRIVATE_KEY_B64`. Debug with `asc auth doctor`.

1. **Identify the app type.** Always load the all-apps checklist, then the type's list ([Checks by app type](#checks-by-app-type)).
2. **Pull metadata:** `asc metadata pull --app "<APP_ID>" --version "<VERSION>" --dir ./metadata`. App info lands in `./metadata/app-info/*.json`, version localizations in `./metadata/version/<VERSION>/*.json`. The review-notes rule file writes `asc metadata pull --output-dir ./metadata` instead; confirm the flags in the current asc docs. With a fastlane `metadata/` layout, adapt the paths or pull the asc layout first. Creative assets (product page headers, search result assets, 2.3.14) live in the App Store Connect Asset Library: "If your `asc` version doesn't pull them, review them by hand against 2.3.14."
3. **Run the rule checks** in `references/rules/{metadata,subscription,privacy,design,entitlements}/*.md`. Each rule has What to Check, How to Detect, Resolution, Example Rejection.
4. **Report** rejections first, then warnings, then passed:

The report keeps the source's counts, guideline number, issue description, offending file and proposed fix, but labels rejections P1 and warnings P2, followed by passed checks. [truongduy2611/app-store-preflight-skills, preflight report]

5. **Autofix and re-scan.** Auto-fixable: competitor terms (suggest replacement text), metadata character limits (show current vs max), missing links (generate template ToS and privacy policy URLs). Re-run the affected checks; "Only mark as resolved once the re-scan passes." Screenshots and UI redesigns are manual: give instructions, don't auto-fix.

New rules retain the source fields: title, guideline number, severity (P1 or P2 under the mapping above), category (`metadata`, `subscription`, `privacy`, `design`, `entitlements`), then What to Check, How to Detect, Resolution and Example Rejection. [truongduy2611/app-store-preflight-skills, rule format]

## Rules: metadata

### Competitor platform terms (2.3.10)

- **Fields:** name, subtitle, description, keywords, promotional text, What's New, creative assets, unless the reference is "specific, approved interactive functionality".
- **Banned terms:** `Android`, `Google Play`, `Google Play Store`, `Samsung`, `Galaxy Store`, `Huawei`, `AppGallery`, `Amazon Appstore`, `Windows Store`, `Microsoft Store`, `APK`, `sideload`, `AltStore`, `Epic Games Store`, `Setapp Mobile`, `Aptoide`.

```bash
grep -ri "android\|google play\|samsung\|huawei\|apk\|amazon appstore\|windows store\|microsoft store\|altstore\|epic games store\|setapp\|aptoide" \
  ./metadata/app-info/ ./metadata/version/<VERSION>/
grep -ri "android\|google play\|samsung\|huawei\|apk\|amazon appstore\|windows store\|microsoft store\|altstore\|epic games store\|setapp\|aptoide" ./fastlane/metadata/
grep -ri "android\|google play" *.xcodeproj/project.pbxproj
```

- **Replacements:** "Available on Android" to "Available on multiple platforms"; "Also on Google Play" removed; "Transfer from Android" to "Transfer from your previous device". Verify with `asc metadata push --app "<APP_ID>" --version "<VERSION>" --dir ./metadata --dry-run`.

### Apple trademarks (5.2.5)

- **Icon:** no Apple device silhouettes, Apple logo, or icons similar to Apple's apps. The example rejection cites "iPhone device found in the application icon".
- **Name and subtitle:** no "iPhone Cleaner", "iPad Manager", "My iCloud Backup", "Siri Helper". **Metadata:** no "best app in the App Store", "iPhone app", "iPad edition".
- **Screenshots:** no unauthorized 3D renders, illustrations (unless instructional and showing your app), Apple devices next to competitor products, exploited Apple logo, die-cut promotions, or images from apple.com. Allowed: your app on a real Apple device in natural use, the device not the focal point.
- **Flagged terms:** `iPhone`, `iPad`, `Mac`, `MacBook`, `Apple Watch`, `Apple TV`, `Vision Pro`, `iMessage`, `FaceTime`, `Siri`, `AirDrop`, `iCloud`, `App Store` (generic), `Apple` (implying endorsement).
- **Detect:** `grep -ri "iphone\|ipad\|macbook\|apple watch\|apple tv\|imessage\|facetime\|siri\|airdrop\|vision pro" ./metadata/app-info/ ./metadata/version/<VERSION>/`, and inspect `Assets.xcassets/AppIcon.appiconset/`.
- **Fixes:** "iPhone Cleaner Pro" to "Phone Cleaner Pro"; "My iPad Manager" to "My Tablet Manager"; "Works with iPhone" to "Works with your phone"; "Download on App Store" removed; "Best Siri alternative" to "Best voice assistant".

### China storefront AI references (5, Chinese deep synthesis rules)

- **Scope:** metadata and in-app functionality on the China mainland storefront: name, subtitle, promotional text, description, keywords, screenshot text overlays, What's New. Banned AI terms are checked across ALL locales, not just `zh-Hans`.
- **Banned terms:** `ChatGPT`, `GPT-4`, `GPT-4o`, `GPT`, `OpenAI`, `Gemini`, `Bard`, `Claude`, `Anthropic`, `Midjourney`, `DALL-E`, `DALL·E`, `Copilot` (in AI context), `Stable Diffusion` (cloud API context).
- **Detect:** `grep -i "chatgpt\|openai\|gpt-4\|gemini\|claude\|anthropic\|midjourney\|dall-e\|copilot\|bard" ./metadata/app-info/zh-Hans.json ./metadata/version/<VERSION>/zh-Hans.json 2>/dev/null`; all locales: `grep -ri "chatgpt\|openai\|gpt-4\|gemini\|claude\|anthropic\|midjourney\|dall-e" ./metadata/app-info/ ./metadata/version/<VERSION>/`; and check China mainland availability.
- **Options:** (A) remove the brand names in all locales (use "AI-powered" or "smart assistant"), suppress AI in the China build, note it in Review Notes; (B) App Store Connect > Pricing and Availability > deselect "China mainland"; (C) obtain MIIT permits under the *Administrative Provisions on Deep Synthesis of Internet-based Information Services*. Apple's example: deep synthesis provided while connected to the Internet needs a license from the Ministry of Industry and Information Technology (MIIT); otherwise deactivate it in the China version and remove references from name, subtitle, promotional text, description and screenshots.

### App preview frames (2.3.4)

- **Rule:** previews carry no device images or frames, framing around the capture, or non-app content; narration and text overlays are allowed. The skill adds "Static screenshots may use device frames."
- **Download previews:** `asc video-previews list --version-localization "<VERSION_LOCALIZATION_ID>"`, then `asc video-previews download --version-localization "<VERSION_LOCALIZATION_ID>" --output-dir ./previews`. Pull the first frame of each to inspect:

```bash
find ./previews -type f \( -name "*.mov" -o -name "*.mp4" \) -print0 | \
  while IFS= read -r -d '' preview; do
    ffmpeg -i "$preview" -vframes 1 -q:v 2 "${preview%.*}_frame.jpg"
  done
```

- **Fix:** re-record with screen capture only (Xcode Simulator recording, QuickTime) and upload in App Store Connect via "View All Sizes in Media Manager".

## Rules: subscriptions

- **ToS and privacy policy in two places:** links are required in BOTH the App Store description AND the in-app purchase screen; "Missing either one is a separate rejection."
- **The in-app subscription screen shows:** title, length of period, price (and price per unit if appropriate), a tappable Privacy Policy link, a tappable Terms of Use (EULA) link, and a "Restore Purchases" button. [ApparenceKit](https://apparencekit.dev/blog/flutter-good-paywall/): show the subscription name filled in on App Store Connect ("Apple will reject your app if that is not the case"); on iOS the terms are the EULA from App Store Connect and the privacy policy is the one filled in there, while Google Play needs your own terms of service.
- **In metadata:** the Privacy Policy URL field is set; the EULA is either a functional link in the App Description or a custom EULA in the EULA field; with Apple's standard EULA, link it in the description for every locale. Description footer:

```
Terms of Use: https://yourdomain.com/terms
Privacy Policy: https://yourdomain.com/privacy
```

- **Detect missing links:** `grep -i "terms of use\|terms of service\|terms and conditions\|eula\|end user license" ./metadata/version/<VERSION>/*.json`; `grep -i "privacyPolicyUrl" ./metadata/app-info/*.json`; `grep -oE 'https?://[^" ]+' ./metadata/version/<VERSION>/*.json`; App Store Connect > App Information > EULA section. In code, find paywalls with `grep -rn "subscribe\|paywall\|purchase\|StoreKit\|RevenueCat\|Superwall" --include="*.swift" --include="*.dart" .` then confirm links with `grep -rn "terms\|privacy\|eula\|TermsOfService\|PrivacyPolicy" --include="*.swift" --include="*.dart" .`.
- **Misleading pricing:** the billed amount is the most prominent price. Apple's wording: "In the purchase flow, the amount that will be billed must be the most prominent pricing element in the layout. For example, an annual subscription should clearly display the total amount that will be billed upon purchase. While you may also present a breakdown price that the annual amount is equivalent to or a savings when compared to weekly or monthly subscriptions, these additional elements should be displayed in a subordinate position and size to the annual price." ([Auto-renewable Subscriptions, Billing amount](https://developer.apple.com/app-store/subscriptions/)) Violations: large bold "$2.50/mo" next to small gray "$29.99/year"; a bright accent on the monthly figure; a per-month breakdown above the charge; free trial text overshadowing the post-trial price. Detect with `grep -rn "paywall\|subscribe\|pricing\|subscription" --include="*.swift" --include="*.dart" .` and `grep -rn "perMonth\|per_month\|monthly.*price\|price.*month\|calculated\|divided" --include="*.swift" --include="*.dart" .`, then check visually: billed amount has the largest font, highest contrast and most prominent position. Third-party paywall advice to show "the monthly price or daily price" instead of the yearly one [ApparenceKit](https://apparencekit.dev/blog/flutter-good-paywall/) breaks this rule unless the billed amount stays dominant. HIG: https://developer.apple.com/design/human-interface-guidelines/in-app-purchase
- **Same rule on Play, and outside the stores:** Google's Subscriptions policy lists "Annual subscriptions that most prominently display their pricing in terms of monthly cost" as a violation ([google-play BILLING-AND-PURCHASES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/google-play/BILLING-AND-PURCHASES.md#subscriptions-policy)); the FTC rules on price comparisons, "free" and urgency claims are in [offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md).

## Rules: design

### Hidden features (2.5.19)

New on October 16, 2026 (formerly part of 2.3.1). Severity P1, and it "can also lead to app removal and developer account termination". Feature flags are allowed when every feature they can enable is in the reviewed build, reachable by the reviewer, and described in review notes. Gating on review-environment checks is bait-and-switch.

- **Review-environment detection** ("App Review uses sandbox receipts"); gating features on it is a rejection, gating only analytics, logging or receipt-validation endpoints is fine:

```bash
grep -rnE "sandboxReceipt|isTestFlight|isInReview|inReview|reviewMode|isReviewer|appReview|underReview|AppTransaction.*environment|\.sandbox\b|\.xcode\b" \
  --include="*.swift" --include="*.m" --include="*.dart" --include="*.ts" --include="*.tsx" --include="*.js" .
```

- **Time bombs:** a hard-coded date that unlocks functionality is a rejection; one that ends a promotion or rental is not.

```bash
grep -rnE "timeIntervalSince1970 *[<>]|Date\(\) *[<>]|DateComponents\(year: *20[2-9][0-9]|DateTime\.now\(\)\.isAfter|new Date\(\) *[<>]" \
  --include="*.swift" --include="*.m" --include="*.dart" --include="*.ts" --include="*.tsx" --include="*.js" .
```

- **Remote flags:** list every flag that gates a user-facing feature. For each: the code is in this build (not downloaded later, 2.5.2), the reviewer can reach it (the flag is on for review, or the notes explain how to enable it), the notes describe it.

```bash
grep -rnE "RemoteConfig|remoteConfig|LaunchDarkly|LDClient|Statsig|GrowthBook|Optimizely|ConfigCat|featureFlag|FeatureFlag|isEnabled\(\"" \
  --include="*.swift" --include="*.m" --include="*.dart" --include="*.ts" --include="*.tsx" --include="*.js" .
```

- **Region gates:** gating for legal reasons (China DST, gambling licenses) is fine when the notes say so; hiding a feature from the review region (usually the US) is a rejection.

```bash
grep -rnE "Storefront\.current|SKStorefront|countryCode|Locale\.current\.(region|regionCode)|ipapi|ip-api|geoip" \
  --include="*.swift" --include="*.m" --include="*.dart" --include="*.ts" --include="*.tsx" --include="*.js" .
```

- **Downloaded or obfuscated code:** decoding hidden URLs, endpoints or class names that turn on features is a rejection; base64 for images or payloads is fine.

```bash
# Remote code execution paths (also 2.5.2)
grep -rnE "dlopen|NSClassFromString\(|JSContext|evaluateScript|evaluateJavaScript|eval\(" \
  --include="*.swift" --include="*.m" --include="*.ts" --include="*.tsx" --include="*.js" .

# Obfuscated strings / URLs
grep -rnE "base64EncodedString|Data\(base64Encoded|atob\(|base64Decode|xorDecode|deobfuscate|SwiftShield|obfuscat" \
  --include="*.swift" --include="*.m" --include="*.dart" --include="*.ts" --include="*.tsx" --include="*.js" .
```

- **Cross-check the notes:** `grep -ril "flag\|remote config\|region\|enable" ./metadata/`.
- **Resolution:** remove review detection (sandbox checks only for receipt-validation endpoints); ship what you review; document each gated feature, its default state and how to enable it; a new capability is a new submission (2.3.1(a), 2.3.12); explain region gating (e.g. "AI chat disabled in China mainland: no DST license"). Encrypting secrets is fine; hiding features is not.

### Minimum functionality (4.2, 4.3)

- **Typical 4.2 rejections:** one or two screens; a WebView wrapper; nothing beyond Safari; links or RSS; marketing or catalog apps; a book or game guide (belongs on Apple Books); template apps.
- **Red flags:** "< 3 unique screens -> Very likely to trigger 4.2"; a single WebView to an external URL; no model layer; no offline functionality; only static content. Metadata signal: `jq -r '.description // empty' ./metadata/version/<VERSION>/<LOCALE>.json | wc -w`; "Very short descriptions (< 50 words) can indicate minimal functionality".
- **Saturated categories (4.3(b)):** flag P2 and check the notes explain the difference.
- **Resolution:** offline mode or caching, push notifications, device integrations (camera, location, HealthKit), UGC or personalization, native UI (swipe actions, drag and drop, widgets). For wrappers: native auth (Sign in with Apple, biometrics), native navigation, local storage, Apple frameworks (Share Sheet, Spotlight, Shortcuts). In the notes, explain what a website can't do, the audience and non-obvious features.

### Sign in with Apple UX

Detect commands and fixes: [PRIVACY-AND-COMPLIANCE.md](PRIVACY-AND-COMPLIANCE.md#sign-in-with-apple).

## Rules: entitlements

- **Unused entitlements (2.4.5(i)):** severity P1 (source: info request, blocks review). Apple asks you to justify entitlements with no matching functionality.
- **iOS capabilities to match:** Push Notifications `aps-environment`; HealthKit `com.apple.developer.healthkit`; Sign in with Apple `com.apple.developer.applesignin`; iCloud `com.apple.developer.icloud-*`.
- **Detect:** `find . -name "*.entitlements" -not -path "./.build/*"`; `plutil -p *.entitlements`; HealthKit use `grep -rn "HKHealthStore\|HealthKit\|health_kit" --include="*.swift" --include="*.dart" .`; on the built app `codesign -d --entitlements :- /path/to/YourApp.app`.
- **Resolution:** remove keys from `.entitlements` and capabilities in Xcode > Target > Signing & Capabilities; if one is needed, reply in App Store Connect explaining how and where it is used; "Developer Reject the current submission, rebuild, and upload a new binary".

## Rules: privacy

- **Privacy manifest and required reason APIs, third-party AI consent:** [PRIVACY-AND-COMPLIANCE.md](PRIVACY-AND-COMPLIANCE.md).
- **Unnecessary personal data (5.1.1):** require only directly relevant data; useful-but-not-essential fields are optional. Flagged when required: phone number, gender, marital status, date of birth (unless age-gating is legally required), home address. Context matters: fitness may require gender, dating may require age and gender, shopping should not require marital status, note-taking should not require a phone number. Detect with `grep -rn "phone\|gender\|marital\|birthdate\|date.of.birth\|address\|registration\|onboarding\|signup\|sign.up\|profile" --include="*.swift" --include="*.dart" .` and `grep -rn "required\|validator\|isRequired\|optional" --include="*.swift" --include="*.dart" .`, then run onboarding and check each field. Fix: make it optional, add "Skip" or "Not now", explain the personalization opt-in, align the App Privacy label.

## Checks by app type

### All apps

- **Pre-submission:** final, complete, tested on-device (2.1); metadata complete, no placeholder text or empty URLs; a demo account (or demo mode with prior Apple approval); backend live during review; IAP findable and functional or explained (2.1(b)); review notes with all six new-submission sections; specific notes (2.3.1(a)); nothing unlocks after approval (2.5.19).
- **Metadata:** name 30 characters or fewer, unique, no trademark stuffing, pricing, other app names or irrelevant phrases (2.3.7); 2.3.10; 2.3.3; 2.3.4; 4+ icons, screenshots and previews (2.3.8); "fictional account data in screenshots" (2.3.9); 2.3.12; 2.3.14; 4.1(c); 5.2.5.
- **Privacy:** privacy policy linked in App Store Connect AND in the app (5.1.1(i)); consent (5.1.1(ii)); relevant data only (5.1.1(iii)); account deletion (5.1.1(v)); permission before sharing with third parties including AI (5.1.2(i)); ATT for cross-app tracking; push, location or tracking never required to use the app or get rewards; `PrivacyInfo.xcprivacy` declares all required reason APIs.
- **Design:** 4.1, 4.2, 4.3(b); equivalent login option where 4.8 applies, subject to its exemptions; don't re-ask its name or email (cited as 4.0); 2.5.1; IPv6-only networks (2.5.5); recording consent (2.5.14); 4.5.3.
- **Business:** IAP (3.1.1); 3.2.2(x); review prompts through the system API (`SKStoreReviewController` / `requestReview`), not a custom prompt (5.6.1); support URL with easy contact (1.5); verifiable identity (5.6.2).
- **App Store Connect requirements:** builds made with the iOS 26 SDK or later (tvOS, visionOS, watchOS 26 SDKs likewise) since April 28, 2026; older Xcode fails at upload, not at review. Age rating questions incl. social media capability (2.3.6); regulated medical device status where it applies (see Health); age assurance laws (Texas, Utah, Louisiana, Brazil, Australia, Singapore) checked against the Declared Age Range API and PermissionKit Significant Change API. Upload deadlines and screenshot sizes: [TESTFLIGHT-AND-RELEASE.md](TESTFLIGHT-AND-RELEASE.md), [METADATA-AND-SCREENSHOTS.md](METADATA-AND-SCREENSHOTS.md).

### Subscriptions and IAP

- **P1:** IAP for digital unlocks within [3.1's actual category/storefront conditions](PRICING-AND-SUBSCRIPTIONS.md#purchase-rules) (the source's unconditional wording omitted those conditions); ongoing value, minimum 7-day period, works on all the user's devices (3.1.2(a)); the screen describes what the user gets (3.1.2(c)); billed amount most prominent, not the calculated monthly price; description has a functional Terms of Use (EULA) link and Privacy Policy link; Privacy Policy URL set in App Store Connect; loot box odds; IAP currencies don't expire; Restore Purchases for restorable IAP; all IAP visible to the reviewer (2.1(b)).
- **P2:** no accidental duplicate subscriptions (3.1.2(b)); 2.3.2; don't remove previously paid functionality when switching to subscriptions; a free trial states its duration, what ends and post-trial charges; 4.10; 3.2.2(x).
- **Rules and detect commands:** [Rules: subscriptions](#rules-subscriptions); setup in [PRICING-AND-SUBSCRIPTIONS.md](PRICING-AND-SUBSCRIPTIONS.md).

### Social and UGC

- **P1:** content filter; reporting with timely responses; blocking users; published contact info; prevent and remove nonconsensual intimate imagery, including AI-generated; a removal process after notice; 4.8-equivalent login where applicable, with its exemptions and the sign-in UX constraints; account deletion (5.1.1(v)); access without social login if core functionality isn't specific to a social network; privacy policy in the app and in App Store Connect.
- **P2:** 1.1.1; recording consent for camera, microphone and screen (2.5.14); clear purpose strings (5.1.1(ii)); ATT; no compiling personal info from non-user sources (5.1.1(viii)); 4.5.4; 5.1.1(iii).
- **UGC rules:** NSFW from web services hidden by default and turned on only via your website; no Chatroulette-style random chat, anonymous bullying or "hot-or-not" voting; no apps primarily for porn; random or anonymous chat meets all UGC requirements.
- **Age:** "A social feed or similar discovery of UGC counts; it puts the app in the Social Media Time Allowance category and adds a Social Media content descriptor". Australia: social media platforms must prevent under-16s from holding accounts (since December 10, 2025); use the Declared Age Range API and state the restriction in the description. Texas, Utah, Louisiana: Declared Age Range API and PermissionKit Significant Change API.

### Kids

- **P1 (1.3, 5.1.4(a)):** no external links or purchasing unless behind a parental gate; no third-party advertising; no third-party analytics (the skill lists exceptions as "no IDFA, no PII, no location"; Apple's text allows analytics that don't collect the IDFA or identifiable information, see [REVIEW-GUIDELINES.md](REVIEW-GUIDELINES.md#1-safety)); COPPA and GDPR; no PII or device information to third parties; a privacy policy that meets children's statutes, linked in App Store Connect and in the app. Parental gate guidance: https://developer.apple.com/app-store/kids-apps/
- **P2:** "For Kids" and "For Children" are reserved; non-Kids apps can't imply children are the main audience in name, subtitle, icon, screenshots or description; keep meeting the guidelines in updates; third-party contextual ads only with documented Kids-specific policies and human review (5.1.4(b)); no ads in extensions, widgets, App Clips, keyboards or watchOS (2.5.18).
- **Age assurance (any app with minor users):** Texas (since June 4, 2026), Utah, Louisiana: parental consent for minors' downloads, IAP and significant app changes; Declared Age Range API; PermissionKit Significant Change API; handle the App Store server notification for revoked consent. Brazil, Australia, Singapore: 18+ apps blocked for unconfirmed adults. Brazil: loot boxes make the app 18+. Australia: the 15+ rating is gone; unrestricted web access, frequent medical information or loot boxes make it 16+. Vietnam ratings: 00+, 12+, 16+, 18+. Reference: https://developer.apple.com/support/age-assurance

### Finance and crypto

- **P1:** wallets from enrolled organizations (3.1.5(i)); no on-device mining, cloud is fine (ii); exchanges licensed (iii); ICOs, futures and crypto-securities only from established banks or financial institutions (iv); no crypto for completing tasks (v); no binary options (3.2.2(viii)); CFD and FOREX licensed; loans: APR 36% or less, no full repayment in 60 days or less, disclose APR and due date (3.2.2(ix)); submit as a legal entity (5.1.1(ix)).
- **P2:** privacy policy covers financial data; crypto can't unlock features; 1.1.6; 2.3.1(a); 5.1.1(v); 1.6.
- **NFTs:** sold or minted via IAP; ownership can't unlock features; browsing others' NFTs has no external purchase links (except on the US storefront).

### VPN

- **P1 (5.4):** the `NEVPNManager` API; organization enrollment; never sell, use or disclose data to third parties, and the privacy policy commits to this; an on-screen declaration of the data collected and its use, shown before any purchase or use; license information in App Review Notes where a territory requires a VPN license; local laws.
- **Exception:** "Parental control, content blocking, and security apps from approved providers may also use `NEVPNManager`; content blocking alone is not a 5.4 violation."
- **P2:** privacy policy; IPv6-only networks (2.5.5); 2.3.1(a); 2.5.19; premium VPN features via IAP (3.1.1).

### Health and fitness

- **P1:** disclose data and methodology, no sensor-only diagnostics (x-rays, blood pressure, blood glucose, SpO2), remind users to check with a doctor (1.4.1); dosage calculators only from a manufacturer, hospital, university or FDA-approved source (1.4.2); HealthKit not for advertising, marketing or data mining (5.1.3(i)); no false data (5.1.3(ii)); never store personal health data in iCloud; research needs informed consent covering nature, purpose, duration, risks, confidentiality and withdrawal (5.1.3(iii)) and an independent ethics review board (5.1.3(iv)).
- **Regulated medical device status:** declare it in App Store Connect if the app ships in the EEA, UK or US and its primary or secondary category is Health & Fitness or Medical, or the age rating questionnaire declares frequent Medical or Treatment Information. Required for new apps since March 26, 2026; existing apps must declare by early 2027 or updates are blocked. Select "No" if it is not a medical device. How-to: https://developer.apple.com/help/app-store-connect/manage-app-information/declare-regulated-medical-device-status
- **P2:** the privacy policy describes health data; HealthKit used for health purposes (2.5.1); data minimization; a regulatory clearance link with matching regulatory information; legal entity (5.1.1(ix)); no targeted ads based on health data (2.5.18).

### AI apps

- **P1:** China mainland deep synthesis rules (remove AI brand names from metadata, suppress AI or get an MIIT license, see [China storefront](#china-storefront-ai-references-5-chinese-deep-synthesis-rules)); no misleading AI capabilities such as an "AI doctor" (1.1.6); medical disclaimers (1.4.1); 2.3.1(a); 2.5.19; explicit permission before sending personal data, with the provider named (5.1.2(i), see [PRIVACY-AND-COMPLIANCE.md](PRIVACY-AND-COMPLIANCE.md#third-party-ai-consent)); AI content creation apps are UGC apps under 1.2 (filter output, report, block, contact info); prevent nonconsensual intimate imagery ("nudification", face-swap porn); no nudity generation (1.1.4).
- **P2:** no "GPT", "ChatGPT", "OpenAI", "Gemini", "Claude" or their logos in the name or icon without approval (4.1(c)); no keyword stuffing with AI brand names (2.3.7); the privacy policy names the AI providers (5.1.1(i)); chatbots and plug-ins (4.7); consent for AI processing of recordings (2.5.14); send no more data than needed (5.1.1(iii)); AI credits via IAP (3.1.1).

### Games

- **P1:** IAP for currency, levels and premium; loot box odds before purchase; IAP currencies don't expire; Restore Purchases; 1.1.2; licensed gambling and lotteries (5.3); no IAP for real-money credit (5.3.3); 5.3.4. Brazil fixed-odds betting needs a valid SPA license, with license details in the review Notes plus documents: "Updating App Review Information alone doesn't start verification; submit a new version".
- **P2:** honest age rating (2.3.6); 4+ metadata even when the game is rated higher (2.3.8); Siri remote on Apple TV (2.4.3); rich AR (4.2.1); streaming game subscriptions (3.1.2(a)); no crypto mining, even in the background (2.4.2); 1.4.5; keep "full game unlock" content when switching to subscriptions; loot boxes in the questionnaire make the game 18+ in Brazil and 16+ in Australia.
- **Also:** mini games, streaming games and emulators (4.7); lasting entertainment value (4.2); no duplicate variants (4.3(a)); drinking games rejected (4.3(b)); screenshots show actual gameplay (2.3.3); Player IDs (4.5.3, 4.5.5).

### macOS

- **P1 (2.4.5):** (i) sandboxed, appropriate APIs, entitlements match functionality; (ii) packaged via Xcode, no third-party installers, a single bundle; (iii) no auto-launch without consent, no background processes after quit, no auto-added Dock or desktop icons; (iv) no downloading standalone apps, kexts or code; (v) no root or setuid; (vi) no license screens, keys or custom copy protection; (vii) updates via the Mac App Store only; (viii) current OS, no deprecated tech (Java); (ix) all localizations in one bundle.
- **P2:** 2.5.1, 2.5.2, no iOS-only language (2.3.10), 5.2.5, 5.1.1(i), 2.5.5.
- **Entitlements audit:** `com.apple.security.network.server` (justify), `com.apple.security.network.client` (standard), `com.apple.security.files.downloads.read-only` (justify), `com.apple.security.files.user-selected.read-write` (standard), `com.apple.security.temporary-exception.*` (extra scrutiny: Apple asks you to justify every one). Also flagged when unused: `files.downloads.read-write`, `files.user-selected.read-only`, `files.bookmarks.app-scope`.

## Prove it

- `greenlight preflight .` reports GREENLIT (zero CRITICAL); re-run it after every fix, because a fix can add a finding.
- If the app has accounts, purchases or social login, `greenlight verify . --dry-run` lists the flows, and a real run reports no FAILED flow.
- Metadata findings are reviewed against their actual policy scopes, approved-functionality/rights exceptions and China availability; raw term matches or zero matches alone do not prove compliance. The old check required every competitor/trademark/China-term scan to be empty. [https://developer.apple.com/app-store/review/guidelines/; truongduy2611/app-store-preflight-skills]
- Every paywall screen shows the billed amount most prominently, tappable Terms and Privacy links and Restore Purchases, and every locale's description carries both links.
- The review-environment, time-bomb, remote-flag and region-gate greps show no feature gated on review detection, and every flag that gates a user-facing feature is described in the review notes.
- `plutil -p` on each `.entitlements` file shows only capabilities the app uses.
- The app-type checklist for this app has every P1 item checked.
