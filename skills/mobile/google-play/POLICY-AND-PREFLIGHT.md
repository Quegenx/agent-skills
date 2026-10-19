# Preflight, submission checks and policy

Most Play rejections are knowable before upload: a debuggable or test-only manifest, a target SDK below the floor, a restricted permission without a declaration, a leaked secret, an incomplete Data safety form, or an app that lets users create an account but not delete it. Google says review is not a troubleshooting step: submitting non-compliant apps for reviewers to find issues leads to rejections, review delays and longer appeals. So check in order from cheapest to most expensive: the offline `gplay preflight` scan of the artifact, then the live `gplay validate` readiness report, then Google Checks, then a dry-run release. The Play policies the checks enforce follow.

**Contents:** [The check ladder](#the-check-ladder) · [Offline preflight](#offline-preflight) · [Preflight scanners](#preflight-scanners) · [Readiness report and validators](#readiness-report-and-validators) · [Common rejections](#common-rejections) · [Data safety](#data-safety) · [Account deletion](#account-deletion) · [Permissions](#permissions) · [Privacy policy and disclosure](#privacy-policy-and-disclosure) · [Other policy](#other-policy) · [Rejection recovery](#rejection-recovery) · [Prove it](#prove-it)

Source scanner `error`/blocking findings map to P1, `warning` to P2 and `info` to P3 in human reports; reserve P0 for independently assessed immediate incidents. Exact `--fail-on`, JSON severity and Google Checks PRIORITY literals remain machine values. [gplay, preflight]

## The check ladder

| Step | Auth | What it checks |
|---|---|---|
| `gplay preflight` | None | The artifact, offline |
| `gplay validate` | Yes | Local checks plus live track and listing state |
| `gplay checks analyze` | Yes | Google Checks privacy and policy, server-side, async |
| `gplay release --dry-run` | Yes | The full pipeline against a real edit, discarded before commit |

- **Run preflight before any upload** and report its findings. It is the cheapest step and catches the most.
- **Report every failure together,** not just the first. Prefer first-class gplay commands over hand-written scripts.
- **Remind the user about Data safety** if they haven't mentioned it.

## Offline preflight

- **No API calls, no credentials, no `--package`, no network:** it inspects a local `.aab` or `.apk`. Run it before `gplay validate`.
- **Usage:** `gplay preflight --file app-release.aab`; add `--listings-dir ./fastlane/metadata/android` to validate the listing in the same pass (pass it whenever metadata exists); `--output json --pretty`; `--list-scanners` lists scanners.
- **Scope scanners** with `--only` or `--skip` (comma-separated IDs): `manifest`, `permissions`, `native_libs`, `metadata`, `secrets`, `billing`, `privacy`, `policy`, `size`. Take the list from `--list-scanners` and confirm flags with `--help`.
- **Gate CI:** `--fail-on error` (hard blockers) or `--fail-on warning` (stricter), for example `--only manifest,permissions,native_libs,secrets --fail-on warning`. `--skip-secrets` is faster on very large builds. Exit 0 means no findings at or above `--fail-on`; 1 means some. Example: `gplay preflight --file app-release.aab --max-size 150M --fail-on warning`.
- **Treat `error` as blocking** unless the user says otherwise, and report each finding's `hint` and `ref`.
- **JSON report:** format, package, version code and name, min and target SDK, per-scanner run status, and findings with `check`, `severity`, `message`, `entry`, `hint` and an optional `ref` policy link. Errors only: `jq '[.findings[] | select(.severity=="error")]'`. Skipped scanners: `jq '.scanners[] | select(.skipped)'`.
- **How it reads the artifact:** it fully decodes `AndroidManifest.xml` (binary AXML for APKs, aapt2 protobuf for bundles). Resource-reference attributes such as `android:debuggable="@bool/isDebug"` are reported as not statically determinable, not `false`. Large entries stream in bounded chunks (flat memory). Scanner IDs and finding `check` names are stable across versions.
- **A missing finding is not proof of compliance** when the manifest couldn't be decoded or the build is heavily obfuscated. Aggressive shrinking can rename or remove classes, so a missed SDK isn't proof it's absent; a match is high confidence.

## Preflight scanners

- **`manifest`:**
  - `android:debuggable="true"`: error.
  - `android:testOnly="true"`: error; Play rejects the upload outright.
  - A component with an `<intent-filter>` and no `android:exported` on targetSdk 31+: error, install failure on Android 12+ (launcher activities exempt).
  - An exported `<provider>` with `grantUriPermissions`: error.
  - A foreground service type without its matching permission on targetSdk 34+: Android 14 throws `SecurityException` (`dataSync` needs `FOREGROUND_SERVICE_DATA_SYNC`).
  - `usesCleartextTraffic="true"`: warning, downgraded to info when `networkSecurityConfig` is present.
  - Also `allowBackup`, `requestLegacyExternalStorage`, and package and version sanity.
- **`permissions`:**
  - Restricted permissions that need a Play declaration form: SMS and Call Log groups, `MANAGE_EXTERNAL_STORAGE`, `ACCESS_BACKGROUND_LOCATION`, `QUERY_ALL_PACKAGES`, `SYSTEM_ALERT_WINDOW`, `BIND_ACCESSIBILITY_SERVICE`, `USE_FULL_SCREEN_INTENT`, `SCHEDULE_EXACT_ALARM` and others, each with its policy doc link.
  - Sensitive permissions that need Data safety disclosure (info).
  - Legacy storage: `WRITE_EXTERNAL_STORAGE` without `maxSdkVersion` on targetSdk 30+, `READ_EXTERNAL_STORAGE` on 33+.
  - Duplicate and deprecated permissions.
- **`native_libs`:**
  - Missing `arm64-v8a`: error ("Play has required 64-bit since 2019").
  - 16 KB memory page alignment, read from the real ELF program headers: error on targetSdk 35+, warning below. Android 15 devices with 16 KB pages won't load misaligned `.so` files.
  - `x86` without `x86_64`, bare `armeabi`, unstripped `.debug_*` or `.symtab`, and `extractNativeLibs="true"` (larger install footprint).
- **`metadata`** (only with `--listings-dir`; fastlane layout `<dir>/<locale>/title.txt`, `<dir>/<locale>/images/...`): title 30, short description 80, full description 4000 and release notes 500 characters, counted in runes not bytes; real pixel sizes for icon 512×512, feature graphic 1024×500, promo graphic 180×120, TV banner 1280×720; screenshots 320px to 3840px per side, at most 2:1, at least 2 phone screenshots, at most 8 per form factor, at most 8 MB each. Listing rules in full: [LISTING-AND-METADATA.md](LISTING-AND-METADATA.md).
- **`secrets`** (dex bytecode is scanned, so hardcoded string literals are caught):
  - Errors: private key blocks, AWS access keys, Stripe `sk_live_`, GitHub tokens, Slack tokens and webhooks, SendGrid keys, Google OAuth client secrets, OpenAI and Anthropic keys, service-account JSON, shipped keystores (`.jks`, `.keystore`, `.p12`, `.pfx`, `.pem`, `.ppk`), and `.git/` or `.env` leakage.
  - Warnings: Google API keys (`AIza…`) and JWTs. Google API keys are a warning on purpose: Android apps embed Maps and Firebase keys by design. The fix is to restrict the key to the package name and signing certificate in Cloud Console; never advise deleting it.
- **`billing`:** third-party processors (Stripe, Braintree, PayPal, Adyen, Razorpay and others) warn, downgraded to info when Play Billing is also present; flags `com.android.vending.BILLING` with no billing implementation, and billing wrappers (RevenueCat, Adapty, Qonversion) shipped without the Play Billing Library. Billing rules: [BILLING-AND-PURCHASES.md](BILLING-AND-PURCHASES.md).
- **`privacy`:** an inventory of 40+ analytics, attribution and ads SDKs (info); warns when an ads or tracking SDK is present on targetSdk 33+ without the `AD_ID` permission, and notes the reverse.
- **`policy`:** targetSdkVersion below Play's floor (a constant Google raises each August; override with `--min-target-sdk` when the bump lands before a new gplay release); restricted services (accessibility, VPN, device admin, notification listener); APK versus AAB upload format. Current floor: [BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md#target-api-level).
- **`size`:** `--max-size` download budget, `--max-dex` per-dex budget, dex fragmentation, and a payload breakdown with the largest entries.

## Readiness report and validators

- **Preconditions:** auth configured, the package known, the artifact built and signed, and a service account with at least "Release Manager".
- **The canonical readiness report** combines local artifact, metadata, screenshot and release-note checks with remote track and listing state and Console-only follow-ups. Scope it with `--bundle`, `--listings-dir`, `--screenshots-dir`, `--track`; `--strict` makes warnings fail. Always run it before releasing.

```bash
gplay validate \
  --package com.example.app \
  --bundle app-release.aab \
  --track production \
  --strict
```

- **Source conflict:** the submission-checks skill's notes say `gplay validate` commands run locally without API calls, while the preflight skill and the same skill's body say `gplay validate --package` needs auth and reads live track and listing state.
- **Per-artifact validators:**
  - `gplay validate bundle --file app-release.aab` (or `.apk`): the file exists and is readable, `.aab` extension, valid ZIP, contains the manifest, resources and dex.
  - `gplay validate listing --dir ./metadata` (`--locale en-US`, `--format json`): title max 30, short description max 80, full description max 4000, required fields, valid UTF-8.
  - `gplay validate screenshots --dir ./metadata` (`--locale`): at least 2, at most 8 per device type, PNG or JPEG, readable.
  - `gplay sync diff-listings` compares local and live listings.
- **Google Checks gate:**

```bash
gplay checks upload \
  --account "$CHECKS_ACCOUNT" \
  --app "$CHECKS_APP" \
  --binary app-release.aab \
  --binary-type ANDROID_AAB \
  --severity-threshold PRIORITY
```

- **Publish behind the report:** `gplay publish track --strict` builds the readiness report, stops on blocking issues (and warnings with `--strict`) and releases only if it passes, for example with `--package --track production --bundle app-release.aab --release-notes @release-notes.json --strict`.
- **Dry run as the final gate:** `gplay release --dry-run` creates a real edit, uploads, configures the track, validates and discards it without committing. "If the dry run succeeds, the real release will succeed."
- **Full pipeline order:** validate bundle, validate listing, validate screenshots, diff listings, dry-run release, then upload the deobfuscation file in an edit and commit.
- **Content rating:** complete the questionnaire; missing ratings block distribution.

## Common rejections

| Message | Fix |
|---|---|
| "Version code already exists" | Increment `versionCode` and rebuild |
| "APK/Bundle targets an SDK below the required level" | Raise `targetSdkVersion` to the current floor |
| "Data safety form incomplete" | Complete it in Console or with `gplay data-safety update` |
| "Screenshots missing for required device type" | At least 2 phone screenshots |
| "Release notes missing for default locale" | Pass `--release-notes` |
| "Signing key mismatch" | Sign with the upload key configured in Play App Signing |
| "Deobfuscation file too large" | The mapping file is over 300 MB; strip or compress it |

- **Unused sensitive permissions** are a top rejection reason; remove what you don't need. Permissions that need Console justification: `ACCESS_FINE_LOCATION` and `ACCESS_BACKGROUND_LOCATION`, `READ_CONTACTS`, `READ_CALL_LOG`, `READ_SMS`, `CAMERA`, `RECORD_AUDIO`, `REQUEST_INSTALL_PACKAGES`, `QUERY_ALL_PACKAGES`.
- **Missing or inaccurate Data safety** is a common rejection reason.

## Data safety

- **Where:** Policy > App content in Play Console. Google reviews it as part of app review and shows it on the store listing. A green check mark in the Data safety section of App content means compliant.
- **Who must complete it:** all developers with an app published on Google Play, including apps on closed, open or production testing tracks, and pregranted or preloaded apps updated through Play. Apps active only on internal testing tracks don't need it (effective October 24, 2022), nor do system services and private apps. Apps that collect no user data must still complete it and link a privacy policy.
- **Old artifacts** with effective targetSdkVersion below 21 can be excluded when 90%+ of the active install base is on targetSdkVersion 21+.
- **Include every SDK:** declare data collected and handled through third-party libraries and SDKs; check the Google Play SDK Index for provider guidance.
- **Collection:** "collect" means transmitting data from your app off a user's device, including through libraries and SDKs and from a webview your app controls (not a webview on the open web). Not collection: data processed only locally on the device, and end-to-end encrypted data no intermediary (including you) can read. Pseudonymous collection is still disclosed.
- **Ephemeral processing:** data held only in memory and kept no longer than needed to serve a real-time request. The help page says such off-device data "needs to be included in your form response" but, if it meets the standard, is not shown in the Data safety section; its FAQ says a transient use before logging "you do not need to include it in your form response". Both are on the same page; any use beyond ephemeral processing, including what you log, must be declared, and building advertising or user profiles is never ephemeral.
- **Sharing:** transferring collected data to a third party, off-device or on-device to another app, or through SDKs or a webview you control. Not sharing: transfers to a service provider processing data on your behalf and on your instructions (analytics, cloud hosting), for legal purposes, on a user-initiated action or prominent disclosure and consent, or of fully anonymized data. An SDK building advertising profiles across multiple customers is sharing.
- **Payment services:** data a payment service (PayPal, Google Pay, Google Play's billing system) collects to process transactions needn't be declared if your app never accesses it and the service collects it directly under its own terms.
- **Optional versus required:** declare "optional" only if all users, regardless of device or region, can opt in or out; if primary functionality needs it, it's "required". Never call collection optional if it's required for any users.
- **Data types (category: types):**

| Category | Types |
|---|---|
| Location | Approximate (area of 3 square km or more, or `ACCESS_COARSE_LOCATION`); Precise (under 3 square km, or `ACCESS_FINE_LOCATION`). Location inferred from IP address must be disclosed as location. |
| Personal info | Name, Email address, User IDs, Address, Phone number, Race and ethnicity, Political or religious beliefs, Sexual orientation, Other info |
| Financial info | User payment info, Purchase history, Credit score, Other financial info |
| Health and fitness | Health info, Fitness info |
| Messages | Emails, SMS or MMS, Other in-app messages |
| Photos and videos | Photos and videos |
| Audio files | Voice or sound recordings, Music files, Other audio files |
| Files and docs | Files and docs |
| Calendar events | Calendar events |
| Contacts | Contacts |
| App activity | App interactions (including screenshots taken), In-app search history, Installed apps, Other user-generated content, Other actions |
| Web browsing | Web browsing history |
| App info and performance | Crash logs, Diagnostics, Other app performance data |
| Device or other IDs | IMEI, MAC address, Widevine Device ID, Firebase installation ID, advertising identifier (Android Advertising ID belongs here) |

- **Purposes:** App functionality, Analytics, Developer communications, Advertising or marketing, Fraud prevention security and compliance, Personalization, Account management.
- **Encryption in transit** can be declared only if it applies to all user data the app, including all SDKs, transmits off-device.
- **Deletion:** state whether you provide a data deletion request mechanism (in-app feature, contact form, email alias); see [Account deletion](#account-deletion). You may select the deletion request mechanism badge if you provide such a mechanism, or if collected data is automatically deleted or anonymized within 90 days of collection.
- **Badges:** "Committed to follow the Play Families Policy" (opt in via Security practices > Go to Target audience and content); "Independent Security Review" through MASA (Mobile Application Security Assessment) against OWASP MASVS by a Google Authorized Lab, developer-paid; "Offers Payments through UPI" (India only).
- **One global form per package name,** "agnostic to usage, app version, region, and user age": declare the sum of practices across every distributed version.
- **No install-time consent replaces in-app consent:** apps collecting personal and sensitive data must still implement in-app disclosures and consent under the User Data policy.
- **CSV import and export:** one row per response, TRUE or FALSE in "Response value", question IDs such as `PSL_DATA_TYPES_PERSONAL`, `PSL_NAME`, `PSL_DATA_USAGE_ONLY_COLLECTED`, `PSL_APP_FUNCTIONALITY`. "Answers already entered into your form will be overwritten when you import a CSV."
- **From the CLI:** `gplay data-safety update --package com.example.app --json @data-safety.json`.
- **Keep it current:** update it whenever data practices change; responses "must remain accurate and complete at all times". Misrepresentation leads to enforcement such as blocked updates or removal.
- **The install-time permissions list** on the listing is built from the manifest's declared install-time permissions.

## Account deletion

- **The rule:** "If your app allows users to create an account from within your app, our User data policy requires that it must also allow users to request for their account to be deleted."
- **What every developer does:** complete the Data deletion questions in the Data safety form. Apps that enable account creation must provide (a) an in-app path to delete the account and its data, and (b) a web link where users can request account and data deletion.
- **Account creation counts** whether completed in the app or in an external flow the app directs users to, and even if some features work without an account.
- **The in-app path** should be prominent (for example in account settings). An in-app link to the web deletion resource is acceptable instead of full in-app deletion.
- **The web link** must let users request deletion without being sent back to the app or having to reinstall it. It must load without error, make the deletion pathway prominent and discoverable, and reference the app or developer name as shown on the store listing. Extra steps (for example cancelling a subscription) must be clearly outlined with a support flow. If it's a section of an existing privacy policy page, link straight to it (for example an anchor link).
- **Deletion means deleting the data:** deleting an account means deleting its associated user data; "merely freezing the account is not sufficient". Data can be kept for security, fraud prevention or regulatory compliance if users are clearly told (for example in the privacy policy). Ask service providers to delete shared data too. Complete requests "within a reasonably quick period of time".
- **Exempt:** permanently private apps and enterprise device management apps; offline-only accounts aren't app accounts. Android TV, Wear OS and web surfaces need not offer in-app initiation but must provide the web link in Play Console.
- **Timeline:** announced April 2023; Data deletion questions due December 7, 2023 (extension to May 31, 2024); the data deletion badge shown from early 2024; after May 31, 2024 non-compliant apps may face enforcement such as removal.
- **Blocked publishing:** without completed Data deletion questions you can't publish a new app or update, and if the answers have issues, new submissions and updates are rejected. To proceed temporarily with other updates, clear your Data deletion answers.

## Permissions

- **Core rule:** request only permissions and sensitive APIs "necessary to implement current features or services in your app that are promoted in your Google Play listing". Request them in context (incremental requests); new uses need affirmative consent. Personal and sensitive data from permissions "may never be sold nor shared for a purpose facilitating sale."
- **Restricted permissions** are Dangerous, Special, Signature or documented ones, and their data is personal and sensitive under the User Data policy. Respect denials, don't manipulate users, and offer alternatives (for example manual phone number entry instead of Call Logs). Request dangerous permissions (such as `READ_CALENDAR`) at runtime with an explanation; send users to system settings for special permissions (such as `SYSTEM_ALERT_WINDOW`).
- **Declaration form:** https://goo.gle/play-permission-decl-form.

| Permission or API | Rule |
|---|---|
| `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO` (targeting Android 13+, API 33+) | Only if the system pickers (Android Photo Picker) aren't enough for core functionality; Play Console declaration. One-time or infrequent use (a profile picture, a check photo) doesn't qualify, nor does a custom picker. Introduced October 2023; full compliance mandatory from May 28, 2025. Private and enterprise device management apps are exempt. The Flutter call that uses the system picker with no permission is in [flutter-ux NOTIFICATIONS-AND-PERMISSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/NOTIFICATIONS-AND-PERMISSIONS.md) ([FlutterPro](https://flutterpro.design/details/native-photo-picker)). |
| `READ_CONTACTS` (targeting Android 17+, API 37+) | Only if the Android Contact Picker (`Intent.ACTION_PICK_CONTACTS`, `ACTION_PICK`) is insufficient; declaration choosing use cases (Contact Management, Dialing or SMS sending, Call History, CRM, Call Screening, Accessibility features, Personal Assistants, Friend matching/search, Backup and Restore, Auto-Correct/Auto-Complete, User-initiated device contact selection, Other) and explaining why the picker isn't enough. Announced April 15, 2026 (still a preview in the current policy article): Play Console prompts for the declaration from September 2026, and compliance is mandatory for apps targeting Android 17+ from January 27, 2027, with a 30-day automatic self extension in Console. |
| SMS and Call Log | Only when actively registered as the default SMS, Phone or Assistant handler; otherwise don't declare them in the manifest at all (including placeholder text); stop using them when no longer default; prefer the SMS Retriever API; declaration form. |
| Location | Minimum scope (coarse over fine, foreground over background); never solely for ads or analytics; stop when no longer needed; background location only for user-beneficial core features, with a declaration; foreground-service location only to continue a user-initiated action, ending right after. No device location for apps directed at children; never sell location. |
| `MANAGE_EXTERNAL_STORAGE` (All Files Access, Android 11+) | Access review before publishing; prompt users to enable "All files access" under "Special app access"; prefer Storage Access Framework or MediaStore; not for media files or user-selected individual files. |
| `QUERY_ALL_PACKAGES` (targeting API 30+) | Only for use cases needing interoperability with any and all apps; not when targeted package visibility declarations suffice; app inventory data never sold or shared for analytics or ads; declaration form. |
| Accessibility API | Only disability-support apps may set `isAccessibilityTool=true` (exempt from prominent disclosure); others need an accessibility declaration, demo video, in-app disclosure and consent. Not for remote call audio recording or "an app that autonomously initiates, plans, and executes actions or decisions". Document the use in the listing. |
| `REQUEST_INSTALL_PACKAGES` | Only when core functionality is sending or receiving app packages with user-initiated install (web browsing, communication attachments, file sharing, enterprise management, backup and restore, device migration, wearable or IoT companion); not for self-updates, modifications or bundling other APKs in the asset file unless for device management. Peer-to-peer sharing qualifies only as the app's primary purpose. |
| Body sensors (targeting Android 16+) | Move from `android.permission.BODY_SENSORS` to granular permissions such as `android.permission.health.READ_HEART_RATE`, `READ_OXYGEN_SATURATION`, `READ_SKIN_TEMPERATURE`; all requests reviewed. |
| Health Connect | Approved use cases: fitness and wellness, rewards, fitness coaching, corporate wellness, medical care, health research, games. No headless apps, not for apps solely targeting children, no transfer for ads, data brokers or credit-worthiness; the privacy policy explains how users manage and delete data; declaration form. |
| `VpnService` | Only core VPN apps or listed exceptions (parental control, enterprise, usage tracking, device security, network tools, browsers, carrier apps); document in the listing; encrypt device-to-tunnel traffic; no traffic redirection for monetization. |
| `USE_EXACT_ALARM` (Android 13+) | Only alarm or timer apps, or calendar apps with event notifications; otherwise use `SCHEDULE_EXACT_ALARM` (user-granted); declaration form. |
| `USE_FULL_SCREEN_INTENT` (targeting Android 14+) | Special app access, auto-granted only for alarms or incoming phone and video calls; otherwise request it from the user; declaration form for pre-grant eligibility. |
| Age Signals API | Data only to comply with legal or regulatory obligations (age-appropriate experiences); not for ads, analytics, profiling or third-party sharing. |

- **Announced for January 27, 2027:** a Location Permissions update making the location button the recommended minimum scope for precise location, and a Contacts Permissions policy requiring the Android Contact Picker for apps without broad-access needs. Preview: https://support.google.com/googleplay/android-developer/answer/16909972.

## Privacy policy and disclosure

- **Privacy policy:** "All apps must post a privacy policy link in the designated field within Play Console, and a privacy policy link or text within the app itself." It must be on an "active, publicly accessible and non-geofenced URL (no PDFs)" and be non-editable. Apps that access no personal and sensitive user data must still submit one.
- **What it must say:** developer information and a privacy point of contact or a way to submit inquiries; the personal and sensitive data types accessed, collected, used and shared, and the parties it's shared with; secure handling procedures; the data retention and deletion policy; and clear labeling as a privacy policy. It must name the entity in the store listing, or the app. It covers all data handling, not only what the Data safety section lists.
- **Prominent disclosure** is in the app (not only the description or website), shows in normal use without navigating menus, describes the data, isn't only in the privacy policy or terms, and immediately precedes the consent request.
- **Consent needs an affirmative action** (tap to accept, tick a box). Navigating away or an auto-dismissing message is not consent.
- **Transmit personal data with modern cryptography** (for example HTTPS).

## Other policy

- **Policy areas:** Restricted Content; Impersonation; Intellectual Property; Privacy, Deception and Device Abuse; Use of SDKs In Apps; Monetization and Ads; Store Listing and Promotion; Spam, Functionality, and User Experience; Malware; Mobile Unwanted Software; Families; Other Programs; Enforcement. You're responsible for third-party SDK code and practices.
- **Minimum functionality:** no apps with limited functionality or content, and no crashes, force closes or freezes. Violations include apps that don't install, load or respond, static text-only or PDF apps, single-wallpaper apps, and apps that do nothing.
- **Enforcement:** rejection; removal (doesn't immediately affect account standing, but multiple can lead to suspension); suspension ("count as strikes"); limited visibility (discoverability restricted but still reachable by direct link; no effect on standing); limited regions (downloadable only in certain regions); account termination (all apps removed). "Multiple strikes can result in the termination of individual and related Google Play Developer accounts." Repeated or serious violations (such as malware, fraud and apps that may cause user or device harm) result in termination. Actions stay unless an appeal is granted.
- **Payments and subscriptions policy:** [BILLING-AND-PURCHASES.md](BILLING-AND-PURCHASES.md). Store listing and metadata policy: [LISTING-AND-METADATA.md](LISTING-AND-METADATA.md). The Apple equivalents: [app-store-connect SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/SKILL.md).

## Rejection recovery

The policy buckets below and the automated-suspension appeal route are [eronred, rejection-recovery]. They are a classification aid; use the actual enforcement notice and current policy rather than treating an author timeline as a guarantee.

| Google Play policy | Bucket | Typical fix |
|---|---|---|
| Restricted Content | Sexual content, hate, violence | Content moderation, age gate |
| Privacy, Deception, Device Abuse | Disclosure, permissions | Privacy policy, accurate Data Safety form |
| Intellectual Property | Trademark, copyright | Get rights or remove |
| Monetization and Ads | Disruptive ads, IAP bypass | Use Play Billing |
| Store Listing and Promotion | Misleading metadata | Match the listing to the app |
| Spam and Minimum Functionality | Repetitive content, low quality | Add unique value |
| Families | Apps for kids | COPPA / GDPR-K compliance, ad SDK whitelist |
| Permissions | High-risk permissions | Remove or justify (Special Permissions Declaration form) |
| Health misinformation | Medical claims | Add disclaimers, provide credentials |
| Foreground services | Background work | Justify in the Play Console form |

- **Automated Play suspensions** (no human review): use the Play Console appeal form with a written justification.
## Prove it

- `gplay preflight --file app-release.aab --listings-dir <dir> --fail-on error` exits 0, and `jq '.scanners[] | select(.skipped)'` on its JSON shows only scanners you meant to skip.
- `gplay validate --package <pkg> --bundle app-release.aab --track production --strict` passes, then `gplay release ... --dry-run` succeeds.
- Every restricted permission left in the manifest has a submitted declaration, and no permission is declared that the listing's features don't need.
- The Data safety section in App content shows the green check mark, and it covers every SDK the `privacy` scanner lists.
- If the app creates accounts: the in-app delete path is reachable from account settings, the web deletion link loads without the app, names the app as on the listing, and a test deletion removes the data rather than freezing the account.
- The privacy policy URL opens publicly, is not a PDF, and is linked both in Play Console and inside the app.
