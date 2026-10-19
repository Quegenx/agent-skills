# Privacy and Compliance

Apple checks privacy in three places: the binary (a `PrivacyInfo.xcprivacy` manifest that declares tracking domains, collected data and every required reason API, for the app and each bundled SDK), App Store Connect (the privacy policy URL and the App Privacy answers shown as the product page's privacy label), and the running app (the ATT prompt before tracking, consent before sharing data with third parties including AI, account deletion, and the login options). App Store Connect does not accept an app whose manifest leaves out a required reason, and rejects submissions with an invalid manifest. Rules come from Apple's documentation and the App Review Guidelines (current text dated October 16, 2026); third-party preflight rules are marked where they add or differ.

**Contents:** [Privacy manifests](#privacy-manifests) · [Required reason APIs](#required-reason-apis) · [Privacy policy and privacy labels](#privacy-policy-and-privacy-labels) · [App Tracking Transparency](#app-tracking-transparency) · [Third-party AI consent](#third-party-ai-consent) · [Account deletion](#account-deletion) · [Sign in with Apple](#sign-in-with-apple) · [Review notes](REVIEW-OPERATIONS.md#review-notes) · [Prove it](#prove-it)

Related: [REVIEW-GUIDELINES.md](REVIEW-GUIDELINES.md) (5.1.1 and 5.1.2 text), [PREFLIGHT.md](PREFLIGHT.md) (automated scans), [PRICING-AND-SUBSCRIPTIONS.md](PRICING-AND-SUBSCRIPTIONS.md), [METADATA-AND-SCREENSHOTS.md](METADATA-AND-SCREENSHOTS.md), [TESTFLIGHT-AND-RELEASE.md](TESTFLIGHT-AND-RELEASE.md).

## Privacy manifests

- **What it is:** a property list named `PrivacyInfo.xcprivacy` ("the required file name for bundled privacy manifests") that apps and third-party SDKs (XCFrameworks, Swift packages, Xcode projects) can contain. It records collected data types (all platforms) and required reason APIs used (iOS, iPadOS, tvOS, visionOS, watchOS).
- **Create it:** Xcode > File > New File > Resource > App Privacy File, and add it to the target's resources ("Copy Bundle Resources"). "For Flutter apps, place the manifest in `ios/Runner/PrivacyInfo.xcprivacy`."
- **Location in the bundle:** iOS, iPadOS, tvOS, visionOS and watchOS apps at the bundle root (`Sample.app/PrivacyInfo.xcprivacy`); macOS in `Contents/Resources/`. Swift packages put it in `Sources/<Target>` or `Sources/<Target>/Resources` and declare `.process("PrivacyInfo.xcprivacy")` (or the Resources directory) in `resources:`. Static libraries (`.a`) can't hold resources: wrap them in a static framework.

| Key | Type | Meaning |
|---|---|---|
| `NSPrivacyTracking` | Boolean | The app or SDK tracks; when true, provide `NSPrivacyTrackingDomains` |
| `NSPrivacyTrackingDomains` | Array of strings | Tracking domains. "If the user has not granted tracking permission through the App Tracking Transparency framework, network requests to these domains fail and your app receives an error" |
| `NSPrivacyCollectedDataTypes` | Array of dictionaries | Data types collected |
| `NSPrivacyAccessedAPITypes` | Array of dictionaries | Required reason APIs used, with reasons |

Minimal example (declares UserDefaults use for app-only data):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSPrivacyTracking</key>
    <false/>
    <key>NSPrivacyAccessedAPITypes</key>
    <array>
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>CA92.1</string>
            </array>
        </dict>
    </array>
</dict>
</plist>
```

- **Invalid manifests are rejected:** "App Store Connect rejects app submissions that include invalid privacy manifest files"; an email names the invalid file path; troubleshoot with TN3181. If a third-party SDK's manifest is invalid and no fix exists, you may delete or fix it in the archive and resubmit via Xcode (this breaks the signature; Xcode re-signs when distributing from the Organizer).
- **Commonly used SDKs need their own manifest and signature:** "Starting February 12, 2025, apps you submit for review in App Store Connect must contain a valid privacy manifest file for a certain number of commonly used third-party SDKs." This applies to new apps and to updates that add them, signatures when used as binary dependencies, any version and repackagings. Xcode combines all SDK manifests into one report when you distribute, and SDK signatures let Xcode check a new version was signed by the same developer.
- **Listed SDKs that Flutter and React Native apps ship:** Flutter, connectivity_plus, device_info_plus, file_picker, flutter_inappwebview, flutter_local_notifications, fluttertoast, geolocator_apple, image_picker_ios, package_info, package_info_plus, path_provider, path_provider_ios, share_plus, shared_preferences_ios, sqflite, url_launcher, url_launcher_ios, video_player_avfoundation, wakelock, webview_flutter_wkwebview, hermes, Capacitor, Cordova, Firebase (ABTesting, Auth, Core, CoreDiagnostics, CoreExtension, CoreInternal, Crashlytics, DynamicLinks, Firestore, Installations, Messaging, RemoteConfig), GoogleSignIn, OneSignal (OneSignal, OneSignalCore, OneSignalExtension, OneSignalOutcomes), FBSDK (CoreKit, CoreKit_Basics, LoginKit, ShareKit), FBAEMKit, Lottie, UnityFramework. Native libraries on the list: Abseil, AFNetworking, Alamofire, AppAuth, BoringSSL / openssl_grpc, Charts, DKImagePickerController, DKPhotoGallery, FBLPromises, FMDB, GoogleDataTransport, GoogleToolboxForMac, GoogleUtilities, grpcpp, GTMAppAuth, GTMSessionFetcher, IQKeyboardManager, IQKeyboardManagerSwift, Kingfisher, leveldb, MBProgressHUD, nanopb, OpenSSL, OrderedSet, Promises, Protobuf, Reachability, RealmSwift, RxCocoa, RxRelay, RxSwift, SDWebImage, SnapKit, Starscream, SVProgressHUD, SwiftyGif, SwiftyJSON, Toast.
- **When the app itself needs one (sources differ):** the preflight skill's SKILL.md says the manifest "is required even if your app doesn't call Required Reason APIs directly. Third-party SDKs (Firebase, Amplitude, etc.) that use `UserDefaults` or `NSFileManager` trigger this requirement transitively." Its own rule file says it is required "if they use any of Apple's 'Required Reason APIs'" and that many SDKs bundle their own manifest, so "Ensure your app's manifest covers APIs used in your own code." Apple: use in your code goes in your app's manifest, use in an SDK goes in the SDK's manifest, and each executable or dynamic library's bundle needs its own. Confirm against Apple's current documentation.
- **Detect:** `find . -name "PrivacyInfo.xcprivacy" -not -path "./.build/*"`, or `greenlight privacy .`.

## Required reason APIs

- **Why:** these APIs could be misused for fingerprinting. "Regardless of whether a user gives your app permission to track, fingerprinting is not allowed."
- **Deadline:** "Starting May 1, 2024, apps that don't describe their use of required reason API in their privacy manifest file aren't accepted by App Store Connect." The reasons cover the app's code "including from third-party SDKs".
- **Who declares:** each `NSPrivacyAccessedAPITypes` entry has `NSPrivacyAccessedAPIType` (category string) and `NSPrivacyAccessedAPITypeReasons` (array of reason codes). "Your third-party SDK can't rely on the privacy manifest files for apps that link the third-party SDK." Request a new reason at https://developer.apple.com/contact/request/privacy-manifest-reason/

| Category | APIs | Reasons |
|---|---|---|
| `NSPrivacyAccessedAPICategoryFileTimestamp` | creationDate, modificationDate, fileModificationDate, contentModificationDateKey, creationDateKey, getattrlist, getattrlistbulk, fgetattrlist, stat, fstat, fstatat, lstat, getattrlistat | `DDA9.1` display timestamps to the user, not sent off-device; `C617.1` timestamps, size or metadata of files inside the app container, app group container or CloudKit container; `3B52.1` files the user specifically granted access to (e.g. document picker); `0A2A.1` third-party SDK wrapper only |
| `NSPrivacyAccessedAPICategorySystemBootTime` | systemUptime, mach_absolute_time() | `35F9.1` measure elapsed time between in-app events or for timers (elapsed time may leave the device); `8FFB.1` calculate absolute timestamps for in-app events; `3D61.1` optional user-submitted bug report |
| `NSPrivacyAccessedAPICategoryDiskSpace` | volumeAvailableCapacityKey, volumeAvailableCapacityForImportantUsageKey, volumeAvailableCapacityForOpportunisticUsageKey, volumeTotalCapacityKey, systemFreeSize, systemSize, statfs, statvfs, fstatfs, fstatvfs, getattrlist, fgetattrlist, getattrlistat | `85F4.1` display disk space to the user; `E174.1` check there is space to write files, or delete files when low (the app must behave observably differently; it may skip downloads); `7D9E.1` optional bug report; `B728.1` health research apps only |
| `NSPrivacyAccessedAPICategoryActiveKeyboards` | activeInputModes | `3EC4.1` custom keyboard apps; `54BD.1` present the correct customized UI for text fields |
| `NSPrivacyAccessedAPICategoryUserDefaults` | UserDefaults | `CA92.1` read and write data only the app itself can access; `1C8F.1` same App Group; `C56D.1` third-party SDK wrapper only; `AC6B.1` MDM managed configuration keys `com.apple.configuration.managed` / `com.apple.feedback.managed` |

- **Rejection wording:** Apple's example rejection names the missing categories, e.g. `NSPrivacyAccessedAPICategoryUserDefaults`, `NSPrivacyAccessedAPICategoryFileTimestamp`.

## Privacy policy and privacy labels

- **Privacy policy URL:** the App Privacy help page says it "is required for all apps"; the App Information reference says it is required for iOS and macOS apps (confirm in the current docs). It goes in the App Store Connect field and inside the app "in an easily accessible manner" (5.1.1(i)); a user privacy choices URL is optional. URL changes release with the next app version and are localizable. Content requirements: [REVIEW-GUIDELINES.md](REVIEW-GUIDELINES.md#5-legal).
- **App Privacy answers** (the privacy "nutrition label") are app-level, cover all platforms (answer for the most inclusive one) and include your third-party partners' practices. Steps: App Privacy > Get Started > "Yes, we collect data from this app" or "No, we do not collect data from this app" > select data types > answer per type > Publish (confirm accuracy). Role: Account Holder, Admin or App Manager. They are required to submit new apps and updates. "You may update your answers at any time, and you do not need to submit an app update in order to change your answers."
- **What "collect" means:** "'Collect' refers to transmitting data off the device in a way that allows you and/or your third-party partners to access it for a period longer than what is necessary to service the transmitted request in real time." Data collected only for app functionality is still declared.
- **Optional disclosure** only when ALL hold: not used for tracking; not used for third-party advertising, your advertising or marketing, or other purposes; collected only infrequently, not part of primary functionality and optional for the user; provided by the user in the UI with their name or account shown, chosen affirmatively each time. Separate criteria exist for Product Improvement Programs, Regulated Financial Services and Health Research. "data collected on an ongoing basis after an initial request for permission must be disclosed."

| Category | Data types |
|---|---|
| Contact Info | Name, Email Address (incl. hashed), Phone Number (incl. hashed), Physical Address, Other User Contact Info |
| Health & Fitness | |
| Financial Info | Payment Info (not collected if a payment service handles entry outside your app and you never access it), Credit Info, Other |
| Location | Precise (latitude and longitude with three or more decimal places), Coarse |
| Sensitive Info, Contacts | |
| User Content | Emails or Text Messages, Photos or Videos, Audio Data, Gameplay Content, Customer Support, Other User Content |
| Browsing History, Search History | |
| Identifiers | User ID, Device ID (incl. advertising identifier) |
| Purchases | |
| Usage Data | Product Interaction, Advertising Data, Other Usage Data |
| Diagnostics | Crash Data, Performance Data, Other Diagnostic Data |
| Surroundings, Body (Hands, Head), Other Data | |

- **Per data type** you also answer the purposes (Third-Party Advertising; Developer's Advertising or Marketing; Analytics; Product Personalization; App Functionality; Other Purposes), whether it is linked to the user, and whether it is used for tracking. "'Personal Information' and 'Personal Data', as defined under relevant privacy laws, are considered linked to the user."
- **Edge cases:** declare web views' traffic data (unless navigating the open web); declare IP address per use (precise or coarse location, device ID, diagnostics); in-app private messaging is Emails or Text Messages; data kept only on device is not collected; precise location coarsened immediately is Coarse Location; data sent and immediately discarded (an auth token, an IP not retained) need not be disclosed; data you collect from Apple frameworks is declared, data Apple collects is not.
- **Keep it consistent:** align the label with the onboarding fields you require ([PREFLIGHT.md](PREFLIGHT.md#rules-privacy)) and name third-party AI providers under Data Shared ([Third-party AI consent](#third-party-ai-consent)). 2.3 counts privacy information as metadata that must be accurate.
- **Accessibility Nutrition Label:** indicate support (VoiceOver, Voice Control, Larger Text, Captions, and more) in App Store Connect; it shows per platform on the product page.

## App Tracking Transparency

- **The rule:** "In iOS 14.5, iPadOS 14.5, and tvOS 14.5 or later, you need to receive the user's permission through the App Tracking Transparency (ATT) framework in order to track them or access their device's advertising identifier." 5.1.2(i) repeats it.
- **Tracking is** "linking user or device data collected from your app with user or device data collected from other companies' apps, websites, or offline properties for targeted advertising or advertising measurement purposes. Tracking also refers to sharing user or device data with data brokers." Embedding an SDK that combines your app's data with other developers' apps' data for ads counts "even if you don't use the SDK for these purposes".
- **Not tracking:** linking on device only without sending identifiable data off it; data brokers used solely for fraud detection, prevention or security; consumer reporting agencies for creditworthiness.
- **The prompt:** a purpose string is required in the system prompt. Show it whenever you choose; you may explain beforehand if you are transparent; you may link to Settings if the user turned tracking off for your app. Without permission "the device's advertising identifier value will be all zeros".
- **Never:** gate functionality on allowing tracking or incentivize it (5.1.2(i)); track with hashed email, phone or other identifiers without permission; fingerprint (apps referencing SDKs that fingerprint may be rejected).
- **Also requires ATT:** third-party deep-linking or deferred deep-linking tools that pass unique identifiers across companies for ad targeting or measurement; tracking inside a web view (unless open-web navigation). You are responsible for your SDKs' and SSO providers' tracking. Governed identifiers include the advertising identifier, session IDs, fingerprint IDs and device graph identifiers.
- **IDFV** may be used for analytics across apps from the same content provider without ATT; never combine it to track across other companies.
- **Consent management platforms** are allowed but must always respect the ATT response. Example purpose string referencing a prior CMP consent: "[App] indicates you allowed it to use your data for advertising purposes in its legal prompt. Would you like your Apple device to provide [App] access to the advertising ID or otherwise allow it to use other means for the data processing described above?"
- **EU alternative prompt:** "Beginning with iOS 27.2 and iPadOS 27.2, developers will have the option to use an alternative version of the App Tracking Transparency system prompt in the EU." In Germany, France, Italy, Poland and Romania only the alternative prompt is available. It has an optional "Additional Information" text button. EU users can be reprompted "one year after the user's previous choice", but not when "Allow Apps to Request to Track" (EU name: "Allow Apps to Request to Link Your Activity Across Companies") is off. New docs: "Requesting Authorization with Expanded Interface", "Tracking Markdown Usage Description".
- **Additional Information consent:** after that screen or page, return to ATT only if the user has not opted out of all relevant legal-consent choices there. The old attribution instruction said to request again without this condition. CMP controls still cannot override the ATT response. [https://developer.apple.com/app-store/user-privacy-and-data-use/]
- **Manifest link:** with `NSPrivacyTracking` true, list `NSPrivacyTrackingDomains`; requests to them fail until the user grants permission.
- **Attribution without tracking:** AdAttributionKit attributes in-app ad campaigns and web ads on mobile while keeping privacy.

## Third-party AI consent

5.1.2(i): "You must clearly disclose where personal data will be shared with third parties, including with third-party AI, and obtain explicit permission before doing so." The preflight rule (truongduy2611) turns this into checks:

- **Must:** disclose what data goes to which provider; get explicit permission by an affirmative action (button, toggle, checkbox): "A line buried in the ToS doesn't count"; allow easy withdrawal (5.1.1(ii)); name the provider in the privacy policy (5.1.1(i)) and in the App Privacy "Data Shared" answers. Personal data includes prompts, chat text, photos, voice, documents, contacts and health data.
- **In scope:** direct calls; your backend forwarding to AI ("proxying through your own backend doesn't exempt you"); Firebase AI Logic and Vertex AI (Gemini). **Out of scope:** Apple Foundation Models (on device). A self-hosted model is not third-party, but 5.1.1 still applies.
- **Detect AI endpoints:**

```bash
grep -rnE "api\.openai\.com|generativelanguage\.googleapis\.com|aiplatform\.googleapis\.com|api\.anthropic\.com|api\.x\.ai|api\.mistral\.ai|api\.groq\.com|openrouter\.ai|api\.together\.xyz|api\.replicate\.com|api\.stability\.ai|api\.elevenlabs\.io|api\.deepgram\.com|api\.assemblyai\.com|api\.perplexity\.ai|api\.deepseek\.com" .
```

- **Detect AI SDKs** (`dart_openai`, `google_generative_ai`, `firebase_ai`, `firebase_vertexai`, `@anthropic-ai/sdk`, `@google/generative-ai`, `from 'openai'`) across `pubspec.yaml`, `package.json`, `Podfile`, `Package.swift`, `Package.resolved`:

```bash
grep -rnE "import (OpenAI|GoogleGenerativeAI|FirebaseAI|FirebaseVertexAI|SwiftAnthropic|SwiftOpenAI)|dart_openai|google_generative_ai|firebase_ai|firebase_vertexai|@anthropic-ai/sdk|@google/generative-ai|from ['\"]openai['\"]" \
  --include="*.swift" --include="*.dart" --include="*.ts" --include="*.tsx" --include="*.js" --include="Package.swift" --include="Package.resolved" --include="pubspec.yaml" --include="package.json" --include="Podfile" .
```

- **Detect backend AI proxies:** `grep -rnE "\"/(v1/)?(chat|generate|ai|completion|completions|transcribe|summarize|assistant)" --include="*.swift" --include="*.dart" --include="*.ts" --include="*.tsx" --include="*.js" .`
- **Detect the consent gate:**

```bash
grep -rnE "aiConsent|AIConsent|ai_consent|hasAcceptedAI|aiDataSharing|ai_data_sharing|consentToAI|thirdPartyAI" \
  --include="*.swift" --include="*.dart" --include="*.ts" --include="*.tsx" --include="*.js" .
```

- **Check the gate:** an AI call with no gate is a rejection. The gate runs before the first request, names the provider and data types, leaves the rest of the app usable when declined (5.1.1(iv)) or makes the AI feature clearly optional, and can be withdrawn later (e.g. a Settings toggle).
- **Check the policy URL:** `jq -r '.privacyPolicyUrl // empty' ./metadata/app-info/*.json`.
- **Consent copy example:** "To generate responses, [App] sends your messages and attached photos to **OpenAI**. OpenAI processes this data under its own privacy policy. [Allow] [Not now]"
- **Resolution:** a consent screen before the first request; store the choice and check it before every call; a withdraw option; a privacy policy naming each provider, the data and retention; updated App Privacy answers; review notes naming the provider, the data and where the consent screen appears.

## Account deletion

- **The rule (5.1.1(v)):** "Apps submitted to the App Store that support account creation must also let people initiate deletion of their account within the app."
- **Make it findable,** typically in account settings. Offer deletion of the entire account record and associated personal data: "only offering to temporarily deactivate or disable an account is insufficient". If a website is needed, link directly to the deletion page.
- **Tell people** if deletion takes time (then confirm when it completes), how billing and cancellation work for IAP, and what data is legally retained.
- **Friction:** phone call, email or chat support flows are allowed only for highly regulated industries (5.1.1(ix)). Reauthentication and confirmation (e.g. a code sent to the account's email or phone) are fine, but "apps that make it unnecessarily difficult ... will not pass review."
- **Scope:** accounts created in the default web browser still need in-app deletion, and linking out to a browser to sign in or register is "a poor user experience and isn't appropriate, per App Review Guideline 4." Auto-created ("guest") accounts must be deletable. User-generated content shared with others (photos, videos, posts, reviews) is deleted too. Offering deletion only where CCPA or GDPR require it is not enough: "Everyone should be able to delete their accounts".
- **Auto-renewable subscriptions:** tell the user billing continues through Apple and ask them to cancel first; use `showManageSubscriptions` (iOS 15+) or link https://apps.apple.com/account/subscriptions/; for refunds `beginRefundRequest` (iOS 15+) or https://support.apple.com/118223. You may schedule deletion for when the subscription expires if an immediate option also exists.
- **Sign in with Apple accounts:** revoke user tokens with the Sign in with Apple REST API and use server-to-server notification endpoints. Developers in the Republic of Korea must provide a server-to-server notification endpoint when registering a new Services ID.
- **Static scans can't see wiring:** a `deleteAccount` string suppresses the 5.1.1 warning even when the button does nothing; walk the flow, or run `greenlight verify` ([PREFLIGHT.md](PREFLIGHT.md#runtime-verification-optional)).

## Sign in with Apple

- **When it is required (4.8):** a third-party or social login (Facebook Login, Google Sign-In, Log in with X, Sign In with LinkedIn, Login with Amazon, WeChat Login) that sets up or authenticates the primary account requires an equivalent option that limits data to name and email, lets users keep their email private, and doesn't collect interactions for ads without consent. The current 4.8 text names no provider; exemptions are in [REVIEW-GUIDELINES.md](REVIEW-GUIDELINES.md#4-design). Preflight fix for Expo: add `expo-apple-authentication` alongside Google or Facebook login. For the standard button in Flutter, the preflight rule names the `sign_in_with_apple` package.
- **Guideline number (sources differ):** the preflight rule files cite 4.0 for the sign-in UX rules below; the guideline index and Apple put the requirement to offer it under 4.8. They cover different points.
- **UX violations (preflight rule):** asking for name or email after Sign in with Apple; a non-standard button (use `ASAuthorizationAppleIDButton` or an equivalent); the button hidden or de-emphasized next to other logins ("must be equally prominent"); not handling relay addresses.
- **Use what Apple returns:** take `fullName` and `email` from `ASAuthorizationAppleIDCredential` and cache them on first use; don't re-ask; a hidden email means use the relay address, a hidden name means use a default.
- **Relay email domains:** "Starting later this year, new Sign in with Apple addresses, previously issued on privaterelay.appleid.com, will be issued on private.icloud.com. Existing addresses on privaterelay.appleid.com will continue to work". Account systems, email validation logic and allowlists must accept `private.icloud.com` in addition to `privaterelay.appleid.com`. Hide My Email addresses stay on icloud.com (August 24, 2026 note, superseding June 15, 2026). A hard-coded `privaterelay.appleid.com` check without `private.icloud.com` breaks for new users and is flagged as a rejection.
- **Detect (Swift and Dart):**
  - `grep -rn "ASAuthorizationAppleIDProvider\|SignInWithApple\|appleIDCredential\|apple.*sign.*in" --include="*.swift" --include="*.dart" .`
  - `grep -rn "askForName\|askForEmail\|nameTextField\|emailTextField\|profileSetup\|completeProfile" --include="*.swift" --include="*.dart" .`
  - `grep -rn "privaterelay.appleid.com\|@privaterelay\|private.icloud.com\|email.*validation\|isValid.*email" --include="*.swift" --include="*.dart" .`
- **Visual check:** sign in choosing "Hide My Email"; a form for name or email is a violation, landing in the main app is correct.
- **Human Interface Guidelines:**
  - Offer it on all platforms "including non-Apple platforms". [ApparenceKit](https://apparencekit.dev/blog/flutter-supabase-apple-sign-in/) holds the opposite opinion for Android (Apple has no native SDK there, so it falls back to an OAuth redirect with a webview login: the author doesn't recommend offering it, and if you do, also offer Google Sign-In); that is the author's opinion, the HIG line is Apple's recommendation. Ask to sign in only in exchange for value, delay sign-in as long as possible, in commerce apps wait until after purchase, welcome people right after sign-in, and show "Using Sign in with Apple" in settings.
  - "Don't ask people to supply a password." "Avoid asking for a personal email address when people supply a private relay address." Say whether extra data is required or optional, and don't block features when optional data is declined.
  - "Make a Sign in with Apple button no smaller than other sign-in buttons, and avoid making people scroll to see the button."
  - Titles: "Sign in with Apple", "Sign up with Apple", "Continue with Apple" (watchOS: "Sign in"). Styles: white, white with outline (iOS, macOS, web), black; corner radius adjustable. APIs: `ASAuthorizationAppleIDButton` (iOS, macOS, tvOS), `WKInterfaceAuthorizationAppleIDButton` (watchOS), web button generator https://appleid.apple.com/signinwithapple/button.
  - Minimum size: width 140pt (280px @2x), height 30pt (60px @2x), margin 1/10 of the button height.
  - Custom buttons: App Review evaluates every custom button. Use only the Apple Design Resources logo artwork; only the three titles; logo and title black or white; title font size 43% of button height; title-to-right-edge margin at least 8% of the width; PNG logo files only for 44pt-tall buttons (44x44 pt for logo-only).
- **Entitlement:** Sign in with Apple maps to `com.apple.developer.applesignin`; remove it if unused ([PREFLIGHT.md](PREFLIGHT.md#rules-entitlements)). In a Flutter project [ApparenceKit](https://apparencekit.dev/blog/flutter-supabase-apple-sign-in/): Runner target > Signing & Capabilities > + Capability > Sign In with Apple (Xcode writes the entitlement, no `Info.plist` change); on macOS add the same capability and check that `macos/Runner/DebugProfile.entitlements` and `Release.entitlements` contain:

```xml
<key>com.apple.developer.applesignin</key>
<array>
  <string>Default</string>
</array>
```

## Review notes

Reviewer access details, the six-section template and regulated documentation are in [REVIEW-OPERATIONS.md](REVIEW-OPERATIONS.md#review-notes).

## Prove it

- `find . -name "PrivacyInfo.xcprivacy" -not -path "./.build/*"` finds the app manifest (for Flutter at `ios/Runner/PrivacyInfo.xcprivacy`), it is in Copy Bundle Resources, and every required reason API your own code uses has a category and reason code from the table.
- Every listed SDK the app ships is a version that includes its own valid, signed manifest; App Store Connect sends no invalid-manifest email after upload.
- If any SDK tracks, `NSPrivacyTracking` is true with `NSPrivacyTrackingDomains`, the ATT prompt has a purpose string, and declining it leaves every feature usable.
- The App Privacy answers name every data type the app and its SDKs send off the device, including third-party AI providers under Data Shared, and match the required onboarding fields.
- The AI endpoint, SDK and proxy greps each lead to a call guarded by the consent gate.
- On a device: create an account, delete it from settings, and confirm the whole record goes (not a deactivation), subscribers are told to cancel billing, and Sign in with Apple tokens are revoked.
- Sign in with "Hide My Email" lands in the main app with no name or email form, and email validation accepts both `privaterelay.appleid.com` and `private.icloud.com`.
- The review notes pass [REVIEW-OPERATIONS.md](REVIEW-OPERATIONS.md#prove-it).
