# Troubleshooting

Work in two passes, in order: first the code side (debug log, the universal checklist, then platform specifics), then the dashboard (through the RevenueCat MCP server or the `rc` CLI). Most reports resolve before platform specifics. "Roughly 80% of reports are diagnosable from the log output alone." Testing channels are in [TESTING.md](TESTING.md), store credentials in [STORE-SETUP.md](STORE-SETUP.md), SDK setup in [FLUTTER.md](FLUTTER.md) and [REACT-NATIVE.md](REACT-NATIVE.md).

**Contents:** [Read the debug log](#read-the-debug-log) · [Universal checklist](#universal-checklist) · [Symptoms](#symptoms) · [SDK error codes](#sdk-error-codes) · [App Store and iOS](#app-store-and-ios) · [Google Play and Android](#google-play-and-android) · [Flutter](#flutter) · [React Native and Expo](#react-native-and-expo) · [Known platform issues](#known-platform-issues) · [App Store rejections](#app-store-rejections) · [Dashboard inspection](#dashboard-inspection) · [Prove it](#prove-it)

## Read the debug log

- **Set the log level before `configure`.** It "should be the first thing you check if your app is behaving unexpectedly".

```dart
import 'package:purchases_flutter/purchases_flutter.dart';

await Purchases.setLogLevel(LogLevel.debug);
```

```ts
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

Purchases.setLogLevel(LOG_LEVEL.DEBUG);
```

- **Read the native console, not the Dart or Metro console.** iOS: Xcode (Window, Devices and Simulators, the device, Open Console; or `flutter run` with Xcode attached; or Console.app filtered by bundle ID). Android: `flutter logs`, Android Studio Logcat or `adb logcat -s Purchases`. Seeing only Dart `print` or Metro JS output is "the most frequent 'I have no logs' situation".
- **The configure banner** is a line ending in `Purchases is configured` (iOS `[Purchases] - INFO: ...`; logcat `Purchases: ... [Purchases] - INFO: ...`). No banner means `configure` never ran.
- **Log line prefixes** use emoji by source: an apple for Apple and StoreKit, a robot for Google Play, a package for Amazon, a crying cat for the RevenueCat backend.
- **Drop back to info before release:** `await Purchases.setLogLevel(LogLevel.info);` in Flutter, `LOG_LEVEL.INFO` in React Native.
- **If you can't reproduce locally,** get the full debug log from launch to failure.

## Universal checklist

Checks 1 to 5 resolve most reports.

1. **Debug logging on,** reproduce, read the log.
2. **The API key matches the platform:** iOS `appl_`, Android `goog_`, Amazon `amzn_`. A mismatch fails the first network call with an authentication error (`INVALID_CREDENTIALS` on iOS, `InvalidCredentialsError` on Android). A Google key on iOS fetches the wrong configuration. MCP: `list-app-public-api-keys`.
3. **Bundle ID or package name matches the RevenueCat app exactly,** capitalization included, per environment. A mismatch gives empty offerings. MCP: `list-apps` (`bundle_id` for iOS, `package_name` for Play and Amazon).
4. **The current offering has packages:** MCP `list-offerings` with `expand=items.package.product`; the offering with `is_current: true` needs at least one package, each pointing at a store product. Zero packages gives empty `availablePackages` while `getOfferings` succeeds.
5. **Store products are live:** "Ready to Submit" or "Approved" in App Store Connect, "Active" in Play Console. Drafts are not returned, even in sandbox. When offerings arrive but products fail to resolve, this is "almost always the cause". MCP `get-product-store-state` (field `store_status`).
6. **The test account and build use the selected channel:** follow [TESTING.md](TESTING.md#google-play-testing) for licensed Android debug or test-track paths; use a sandbox Apple account on iOS.
7. **Network:** corporate VPNs, captive portals and some DNS filters silently block the RevenueCat or store APIs; try another network. In mainland China, Russia and Myanmar set `await Purchases.setProxyURL("https://api.rc-backup.com/");` before configuring.
8. **The `appUserID`:** a wrong `logIn(appUserID)` attaches entitlements to a different RevenueCat user. Print the current ID (Flutter `Purchases.appUserID`).
9. **Reset:** uninstall, sign back into the sandbox or tester account, reinstall from the correct channel, relaunch.

## Symptoms

| Symptom | Cause | Fix |
|---|---|---|
| `There's a problem with your configuration. None of the products registered in the RevenueCat dashboard could be fetched from the [Play Store/App Store].` | Products are fetched from the store on the device, so any configuration mismatch blocks them | Work the [store checklists](#store-checklists) and checks 2 to 5 |
| `current` offering is null | No current offering on the dashboard | Mark one offering current |
| `availablePackages` empty | Current offering has no packages, or its store products didn't resolve: "almost always a product ID mismatch" | Attach products; match IDs exactly, case included |
| Purchase succeeds, no entitlement | Product not attached to an entitlement, or the store identifier differs | Attach the product to the entitlement; read `getCustomerInfo()` right after the purchase, not a cached variable |
| Purchase succeeds on device, nothing in the dashboard Sandbox view | The SDK didn't report it (key, `configure`, network), or a StoreKit Configuration File is attached | Check the key and banner; detach the StoreKit file |
| Subscription status out of sync | The SDK caches `CustomerInfo`: refreshed after 5 minutes in the foreground, 25 hours in the background, or a purchase or restore. Default fetch policy `cachedOrFetched` returns cached data even if stale; the log shows `[Purchases] - DEBUG: Vending customerInfo from cache` | Force a fresh fetch; React Native `invalidateCustomerInfoCache()` after an outside change such as a dashboard grant ("Can leave app in a stale state if misused"); turn on store server notifications and the `CustomerInfo` listener for faster updates. `logOut` clears the cache |
| Entitlement still active offline | An entitlement active when the user went offline "will remain active for up to three days" | Expected |
| Offerings missing when the app starts offline | "Currently `offerings` do not persist between app launches" | Cache and display them yourself |
| Paywall renders nothing | The offering has no paywall template, or offerings were fetched before the paywall was configured (stale cache); renderer needs iOS 15+ and Android minSdk 24 | Configure the paywall on the offering; restart the app to refetch |
| Webhook receives nothing | URL not reachable from the internet, not returning 200 OK, or the environment filter (production versus sandbox) doesn't match | Test the URL with webhook.site; check the integration's environment |
| `RECEIPT_ALREADY_IN_USE` on restore | Restore behavior is **Keep with original App User ID** | Review the restore behavior in **Project settings > General** |
| Consumed one-time product can't be restored | Google Billing Client 8 removed querying consumed one-time purchases (purchases-flutter 9.0.0+, react-native-purchases 9.0.0+), for apps with anonymous users | See [MIGRATION.md](MIGRATION.md#breaking-changes-by-version) |
| Inconsistent entitlement state, double acknowledgement | `purchasesAreCompletedBy` is `MY_APP` and both your code and RevenueCat finish transactions | One side owns finishing; see [MIGRATION.md](MIGRATION.md#adoption-observer-mode) |
| Play refunds purchases automatically | With `purchasesAreCompletedBy` `MY_APP`, your code didn't acknowledge within 3 days ("a Play Billing rule") | Acknowledge within 3 days |

## SDK error codes

| Code | Cause | Fix |
|---|---|---|
| `INVALID_APP_USER_ID` | Reserved characters or an empty string | Use only letters, digits, underscores and hyphens |
| `INVALID_CREDENTIALS` | Wrong API key, or bundle ID mismatch | Match the key to the app |
| `NETWORK_ERROR` | No connectivity, or a firewall | Check the network; allow RevenueCat domains |
| `STORE_PROBLEM` | Store downtime, configuration, or the iOS 18.x bug | Check store status, configuration and [known issues](#known-platform-issues) |
| `SIGNATURE_VERIFICATION_FAILED` | Tampered receipt or configuration error | Verify the In-App Purchase Key (iOS) or service credentials (Android) |
| `RECEIPT_ALREADY_IN_USE` | | Call `restorePurchases()` or sync the customer |
| `PRODUCT_NOT_AVAILABLE_FOR_PURCHASE` | | Check the product's status in App Store Connect or Play Console |
| `PURCHASE_NOT_ALLOWED` | | Check parental controls and the payment method |
| `PRODUCT_ALREADY_PURCHASED` | | Call `restorePurchases()` to sync |
| `LOG_OUT_ANONYMOUS_USER_ERROR` (React Native) | `logOut()` on an anonymous user (Flutter throws a `PlatformException` in the same case) | |

- **Cancel is still an error object:** check `userCancelled` (React Native) or `PurchasesErrorCode.purchaseCancelledError` (Flutter) before showing an error.

## App Store and iOS

| Symptom | Cause | Fix |
|---|---|---|
| Purchases "succeed", dashboard Sandbox view empty, entitlements may or may not update | A StoreKit Configuration File attached to the active scheme: "the single most common iOS gotcha" | Set the scheme's StoreKit Configuration to **None**; use a sandbox Apple account |
| Products empty in testing | Products not **Ready to Submit** or further; Paid Applications Agreement or banking not done; product too new | Finish the agreement, banking and metadata; wait (a few hours per the testing skill, up to 24 hours per the troubleshooting skill and docs) |
| `Error fetching offerings` in the log | Dashboard misconfigured, or bundle ID mismatch | Checks 3 and 4 |
| Offerings fetched, packages empty | The current offering has no packages | Attach packages |
| Products fail to load from StoreKit | Dashboard product IDs don't match the approved App Store Connect IDs (case sensitive) | Match the IDs |
| Transactions not recorded (SDK 5.x+, Flutter 7.0.0+, React Native 8.0.0+) | In-App Purchase Key missing: "transactions will fail to be recorded without this key being set" | Upload the key; see [STORE-SETUP.md](STORE-SETUP.md) |
| `flutter run` ignores the StoreKit file | StoreKit files work only when the app runs directly from Xcode | Run from Xcode, or test in sandbox |
| Simulator purchases fail | Simulators work only with StoreKit Configuration files | Use a physical device |
| Sandbox prices wrong or in USD | Sandbox and TestFlight pricing | Check the sheet's currency and the Apple ID country; hardcode no currency |
| A test customer has 100 App Store subscription receipts | RevenueCat keeps at most 100 App Store subscription receipts per customer | Delete the customer |
| Crash on launch with Xcode 26 | Initialization order | Initialize RevenueCat before other networking libraries |

- **iOS checklist:** Paid Applications agreement signed in App Store Connect; In-App Purchase Key uploaded to RevenueCat (StoreKit 2, SDK 5.x+); products "Ready to Submit" or "Approved"; the bundle ID matches in Xcode, App Store Connect and RevenueCat; new products wait 24 hours.

## Google Play and Android

| Symptom | Cause | Fix |
|---|---|---|
| Purchases fail on a build from `flutter run`, `npx react-native run-android`, Android Studio or `adb install` | Check the actual account and build against the selected licensed-testing path | Follow [TESTING.md](TESTING.md#google-play-testing); a debug signature alone does not exclude a license tester |
| Products don't load | Products not **Active**, or the account/build does not meet the selected testing path | Activate the product or base plan; check the [licensed-testing contract](TESTING.md#google-play-testing), including opt-in when using a test track |
| "not available in your country" on the opt-in link | Fresh upload still propagating (roughly 15 minutes) | Wait and retry |
| "Item attempting to purchase could not be found" | Check the build, tester account and configured products | Follow the [licensed testing contract](TESTING.md#google-play-testing) and match product identifiers |
| A real card is charged | The account isn't a license tester | Add it under License testing |
| "Something went wrong" | The device may need a PIN | Set a device PIN |
| Every request returns "app not found" equivalents | The `applicationId` in `android/app/build.gradle(.kts)` (not the Kotlin package) differs from Dashboard, Project, Apps, Android, Package name | Match it; each flavor gets its own dashboard entry or RevenueCat project |
| Build not accepted on the track | The AAB's SHA-1 signing fingerprint doesn't match what Play expects; Play App Signing changes the effective key | Check Play Console, Setup, App signing |
| `BillingResponseCode.BILLING_UNAVAILABLE` | Usually the Play Store app is out of date or the user isn't signed in | Update Play Store; sign in |
| `ITEM_UNAVAILABLE` | Product ID doesn't match a live Play Console product, or it is a draft | Match the ID; activate the product |
| "Invalid Play Store credentials" (503 or 521) | New service credentials take up to 36 hours to work | Wait; see [STORE-SETUP.md](STORE-SETUP.md) |
| `NoCoreLibraryDesugaringException`, `NoClassDefFoundError`, crash on launch | Desugaring off or `minSdk` too low | Enable core library desugaring in `build.gradle` or raise `minSdk` to 24+ |
| Reflection crash only in release | R8 or Proguard rules overridden (the SDK ships consumer rules, no extra config needed) | Pair `minifyEnabled true` with `shrinkResources true`; don't override the SDK's consumer rules |
| `ProxyBillingActivity` `NullPointerException` | Automated tests or Play pre-launch reports on LG Nexus 5X or rooted devices | Safe to ignore; silence it in crash reporting |

- **Android checklist:** test account added as a license tester; service account credentials (JSON) uploaded to RevenueCat with Finance permissions; subscriptions use `product_id:base_plan_id`; new products wait 24 hours. Use the [licensed-testing paths](TESTING.md#google-play-testing) for the account and distribution check.
- **Don't call `getOfferings` in your Android app's `Application.onCreate`:** it causes extra network requests (for example on push notifications), and the SDK pre-fetches offerings automatically (<https://www.revenuecat.com/docs/getting-started/displaying-products>).
- **Testing path:** use the [single licensed-testing contract](TESTING.md#google-play-testing) for debug sideloading versus track distribution; do not infer eligibility from the track alone.

### Store checklists

From the docs' empty-offerings page: App Store Connect agreements including the Paid Applications Agreement signed with banking done (up to 24 hours to propagate); Apple Developer membership active and auto-renewing; App-Specific Shared Secret and In-App Purchase Key both added; Google Play agreements signed; the [licensed debug or test-track requirements](TESTING.md#google-play-testing); App Store products Approved or with complete metadata ("Prepare for Submission" and "Ready for Review" load in sandbox when the metadata is complete); the first in-app purchase submitted with an app version, never separately; identifiers match exactly; a physical device; bundle ID and package name match (case sensitive, per environment); the per-platform API key; no StoreKit Configuration in the Xcode scheme when testing live; new products can take up to 24 hours after release.

## Flutter

| Symptom | Cause | Fix |
|---|---|---|
| No SDK logs | Only Dart `print` output visible | Attach Xcode or `adb logcat -s Purchases` |
| Key or configuration change has no effect | Hot reload and hot restart don't re-run native init | Fully stop and relaunch |
| Build problems after a dependency change | Stale native state after changing `pubspec.yaml`, the Podfile or a native dependency | Run the block below |
| Android works, iOS "invalid credentials" | `Platform.isIOS` returned false because it ran on a macOS desktop target; `purchases_flutter` doesn't support macOS, Windows, Linux or Web | Test on an iOS or Android device |
| `getOfferings()` throws | Network failure | Wrap it in try/catch and print the error |
| `dev` flavor gets empty offerings | Testing the `dev` flavor with the `prod` key | One dashboard app and key per flavor |
| `purchases_ui_flutter` paywall blank | No paywall template on the offering; stale offerings; below iOS 15 or Android minSdk 24 | Configure it; refetch |

```bash
flutter clean
flutter pub get
cd ios && pod install && cd ..
```

```dart
import 'dart:io';

final apiKey = Platform.isIOS
    ? 'appl_YOUR_IOS_PUBLIC_SDK_KEY'
    : 'goog_YOUR_ANDROID_PUBLIC_SDK_KEY';
```

## React Native and Expo

| Symptom | Cause | Fix |
|---|---|---|
| No SDK logs | Only Metro's JS output visible: "This catches most 'I have no logs' reports" | Watch Xcode or Console.app and Logcat |
| "native module not found", or calls return mock data | Running in Expo Go (the docs: Preview API Mode swaps native calls for JS mocks) | Use a development build: `npx expo prebuild` or `eas build --profile development` |
| One platform works, the other gets `INVALID_CREDENTIALS` | `Platform.OS` fell through to the wrong branch, or both platforms share one key constant | Branch per platform, as below |
| Crash at configure after an SDK bump | iOS native code still old: `pod install` not run | `cd ios && pod install`; check that `ios/Podfile.lock` matches the JS package version |
| JS bound to an old native module | Stale caches after a bump or native build file change | `npx react-native start --reset-cache`, `pod install`, or `npx expo prebuild --clean` |
| Key change has no effect | A JS reload doesn't re-run native init | Kill and relaunch |
| `current: null` or empty `current.availablePackages` | Dashboard offering misconfigured; watch the native console for product lookup failures | Match IDs, case included |
| Entitlement not active | Read before the purchase promise resolved; product not attached; test account/build mismatch | Await `Purchases.getCustomerInfo()` after the purchase; attach the product; follow the [licensed-testing contract](TESTING.md#google-play-testing) |
| `react-native-purchases-ui` paywall blank | No paywall on the offering; offerings fetched before it was configured; below iOS 15 or Android minSdk 24 | Configure it; restart the app |

```ts
import { Platform } from 'react-native';

const apiKey = Platform.OS === 'ios'
  ? 'appl_YOUR_IOS_PUBLIC_SDK_KEY'
  : 'goog_YOUR_ANDROID_PUBLIC_SDK_KEY';
```

## Known platform issues

| Issue | Scope | Fix |
|---|---|---|
| StoreKit Daemon Connection Failure: `STORE_PROBLEM` (NSCocoaErrorDomain Code 4097) on about 25% of purchases | iOS 18.0 to 18.3.2, physical devices | iOS 18.4+ |
| Products empty with sandbox | iOS 18.4 to 18.5 Simulator only | Physical device, or Xcode 26+ with iOS 26+ simulators |
| `ProxyBillingActivity` `NullPointerException` | Android automated testing, Play pre-launch reports | Ignore |
| Desugaring exceptions | Android | Desugaring or `minSdk` 24+ |

- **A bug on one platform only** points at that native SDK; on both, at shared configuration (API key, `appUserID`, offerings).

## App Store rejections

| Reviewer says | Fix |
|---|---|
| "Issues fetching products" | Products must be submitted for review with the app on first submission: create them in App Store Connect, then submit the app and products together |
| "Error during purchase" (sandbox) | Apple sandbox downtime: tell the reviewer, attach a RevenueCat Sandbox dashboard screenshot showing test purchases work, ask them to retry |
| "Content not unlocked after purchase" | Check the product to entitlement link; make sure the app calls `getCustomerInfo()` after purchase |

## Dashboard inspection

Use it when checks 3 to 5 point at the dashboard, when no working app exists yet, or to confirm a fix.

- **Always call `list-projects` first** (a key may reach several projects); ask which one if there are several.
- **Ask first:** the symptom, error and platform (iOS, Android, Web); new purchases or existing subscribers; sandbox or production.
- **CLI equivalents:** each `list-*` tool maps to `rc <noun> list` (`list-offerings` to `rc offerings list`, `list-apps` to `rc apps list`); `list-app-public-api-keys` to `rc apps keys <app-id>`; `get-product-store-state` to `rc products show <product-id> --store-state`.

| Check | Tools | Pass when |
|---|---|---|
| 1. Project | `list-projects`, `list-apps` | The app exists with the right identifier |
| 2. Products | `list-products`, `get-product-store-state` | One product per store item; store identifiers match exactly; types right (subscription or one-time); Play uses `product_id:base_plan_id`; `store_status.status` is `ok` |
| 3. Entitlements | `list-entitlements`, `get-products-from-entitlement` | One entitlement per access level, products attached, no orphaned products |
| 4. Offerings | `list-offerings`, `list-packages` | At least one offering with `is_current: true`; packages hold products; standard package identifiers (`$rc_monthly` and so on) |
| 5. Webhooks (server-side issues) | `list-webhook-integrations` | URL correct and reachable; environment matches (production or sandbox) |

- **Report** as Checks Passed and Issues Found (CRITICAL, WARNING, INFO) with Recommended Actions, then ask before fixing. A missing webhook is INFO: "Optional but recommended for server-side access control".
- **Fix only after the user confirms,** with `attach-products-to-entitlement` and `attach-products-to-package`. To change a product's store state, use the store-state tooling.

## Prove it

- **Not fixed until all three:** the log shows the expected success line (offerings with at least one package, purchase completed, entitlement active); the dashboard reflects it (Sandbox view, Customers page, right `appUserID`); the original repro steps pass.
- **The configure banner** appears in the native console on each platform.
- **Both platforms checked:** a pass on one says nothing about the other.
- **Log level back to info** in the release build.
