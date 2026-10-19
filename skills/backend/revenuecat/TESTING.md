# Testing

You cannot charge real money during development, so every store has its own testing channel, and RevenueCat adds a Test Store of its own. Higher fidelity exercises more of the real pipeline; lower fidelity iterates faster. Store credentials and product setup are in [STORE-SETUP.md](STORE-SETUP.md); SDK setup is in [FLUTTER.md](FLUTTER.md) and [REACT-NATIVE.md](REACT-NATIVE.md); when a test fails, go to [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

**Contents:** [Pick the channel](#pick-the-channel) · [Test Store](#test-store) · [Keys per build](#keys-per-build) · [Flutter](#flutter) · [React Native and Expo](#react-native-and-expo) · [App Store sandbox](#app-store-sandbox) · [Google Play testing](#google-play-testing) · [Other stores and web](#other-stores-and-web) · [Accelerated renewals](#accelerated-renewals) · [Test cases](#test-cases) · [Confirm on the dashboard](#confirm-on-the-dashboard) · [Prove it](#prove-it)

## Pick the channel

| Channel | Fidelity | What it does | Dashboard |
|---|---|---|---|
| RevenueCat Test Store | Lowest, fastest, deterministic | Synthetic store hosted by RevenueCat; a dialog lets you pick success, failure or cancel; entitlements and `CustomerInfo` update; no Apple or Google call | Sandbox data |
| iOS StoreKit Configuration File | Low (Apple synthetic) | Xcode stubs the store; purchases succeed instantly, no login, no network | May or may not appear depending on SDK version and routing; not a faithful dashboard test |
| iOS Sandbox (sandbox Apple account) / Android Internal or Closed Testing (license tester) | High | Real store backends, real receipts, real dashboard ingestion; slower (build, install, wait for propagation) | Sandbox |
| TestFlight | Apple platform sandbox | Uses production Apple accounts but sandbox purchases | Sandbox, including install/paywall views |
| Play test tracks | Distribution validation | License testers can use test methods; other testers may pay real money | Classify the actual purchase, not the track alone |
| Production | Real money | Do not use for testing | Production |

- **Start with the lowest fidelity that answers the question, then move up.** Paywall and UI iteration belong in the Test Store; entitlement flips, renewals, grace periods and pending purchases belong in a store sandbox.
- **Without any key in debug** [ApparenceKit](https://apparencekit.dev/blog/apparencekit-flutter-template-v5-release/): a starter kit shows paywalls from mock product data in debug mode and warns to configure RevenueCat for production. The Test Store covers the same need with real SDK calls; either way, release builds use the platform key.
- **Workflow:** Test Store in development, then the platform sandbox with the platform key before review, then production with the platform key, never the Test Store key. RevenueCat detects sandbox versus production itself.
- **Store sandboxes are required before launch.** "If the app ships subscriptions, keep one Sandbox pass in the pre-ship checklist even if the Test Store covers daily iteration."
- **In sandboxes, test the purchase flow** (start, complete, verify the unlock), not prices, names or descriptions.

| Scenario | Use |
|---|---|
| Success, failure, cancel paths | Test Store |
| Unit tests of view models | A fake behind a thin billing interface |
| CI on every push | Test Store plus unit tests |
| Subscription renewal cycles | Store sandbox |
| Pending purchase (parental approval) | Store sandbox |
| Full end-to-end payment | Store sandbox |

## Test Store

- **What it is:** a store configured per project that writes real RevenueCat backend records (`CustomerInfo` updates, entitlement transitions, dashboard transactions) without calling the App Store or Google Play. It is provisioned with every project, needs no platform accounts, and suits Expo, web apps, paywall iteration, deterministic integration tests and CI smoke runs. RevenueCat validates Test Store purchases itself.
- **What it does not simulate:** Ask to Buy approval, region-specific pricing, server-side receipt validation specifics, store review and rejection paths, StoreKit or billing grace edge cases, and full renewal cadence. Move up to a store sandbox for those.
- **Minimum SDK versions:** Flutter 9.8.0, React Native 9.5.4, Web 1.15.0 (iOS 5.43.0, Android 9.9.0, KMP 2.2.2, Capacitor 11.2.6, Cordova 7.2.0, Unity 8.3.0).
- **Create it:** Dashboard, **Apps and providers**, _Test configuration_ section, **Test Store**, Create or Enable. The key appears under **Project Settings, API keys** with a `test_` prefix. One Test Store key covers both iOS and Android in Flutter and React Native, and works for any Android target store. To verify, the console shows the SDK configured with a `test_` key, and Successful Purchase flips the entitlement on the returned `CustomerInfo` while the dashboard records the transaction.
- **Products:** create them in **Product catalog, Products** (**+ New product, Test Store**) and attach them in **Offerings**. Saved Test Store products can't be edited (identifier, duration, price): create a new one, swap it into the package, archive the old one.
- **Purchases open a dialog** with Successful Purchase, Failed Purchase and Cancel. Success returns active entitlements; Failed throws a payment error; Cancel throws with `userCancelled` set. These run through the same error and `userCancelled` paths the app already handles for real stores, because SDK calls don't change in Test Store mode, only the key does. Walk every branch of your error handling to check the UI states.
- **Sandbox Testing Access settings** decide whether test purchases grant entitlements. Test Store purchases are reported as sandbox data.
- **Never ship a Test Store key.** In release builds the SDK "logs an error, shows an alert ... and then crashes on purpose" (iOS: compiled without `DEBUG`; Android: not debuggable). TestFlight and Play internal, closed and open tracks are release builds and crash too. The opt-out `forceAllowTestStoreInReleaseBuilds` exists only in iOS SDK 5.89.0+ and Android SDK 10.21.0+; "The Flutter, React Native, Capacitor, Cordova, Unity, and Kotlin Multiplatform SDKs do not expose this setting yet." Switch from the Test Store key to the platform key before review.

## Keys per build

- **Debug builds carry the `test_` key, release builds the store key** (`appl_` for iOS, `goog_` for Android, `amzn_` for Amazon). Gate the key behind build configuration so a release binary cannot route through the Test Store.
- **Keep the `test_` key out of git:** read it from an environment variable (for example `RC_TEST_STORE_KEY`) and store it as a CI repository secret. A CI job running Test Store and unit tests needs no device and no Google account.
- **Wrap the SDK for unit tests.** "The `Purchases` singleton is not mockable. A thin interface lets you inject a fake in tests and keeps ViewModels free of SDK types." Give the interface `getOfferings`, `purchase` (returning `CustomerInfo`) and `getCustomerInfo`, with one RevenueCat implementation. "Add one test per branch: success grants access, failure shows error, cancel stays idle."
- **Debug logging only in debug builds,** set before `configure`.
- **Configuration runs once per native process launch.** After changing the API key, `purchasesAreCompletedBy` or any configuration, kill and relaunch the app. Flutter hot reload and hot restart, and a React Native JS reload, keep the old SDK state.

## Flutter

`purchases_flutter` runs on the native iOS and Android SDKs, so testing means testing each platform against its own store channel; Flutter adds no testing mode. Run every check on iOS and Android separately.

- **Switch keys with `--dart-define`:**

```bash
flutter run --dart-define=REVENUECAT_TEST_KEY=test_YOUR_TEST_STORE_KEY
```

```dart
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:purchases_flutter/purchases_flutter.dart';

const _testKey = String.fromEnvironment('REVENUECAT_TEST_KEY');
const _prodKeyIOS = 'appl_YOUR_IOS_PRODUCTION_KEY';
const _prodKeyAndroid = 'goog_YOUR_ANDROID_PRODUCTION_KEY';

String _apiKey() {
  if (kReleaseMode) {
    return Platform.isIOS ? _prodKeyIOS : _prodKeyAndroid;
  }
  return _testKey;
}

await Purchases.configure(PurchasesConfiguration(_apiKey()));
```

  The `kReleaseMode` branch makes the test key dead code in release builds, and it gets eliminated. The alternative is Flutter flavors, each compiling its own key constant and mapping to its own dashboard app entry.
- **iOS sandbox:** `flutter run` on a connected device with a development provisioning profile and a sandbox Apple account. For TestFlight, `flutter build ipa` and upload. `flutter run` does not use a StoreKit Configuration File (see [App Store sandbox](#app-store-sandbox)).
- **Android sandbox:** use the platform key and the [licensed testing paths](#google-play-testing). The old source claimed every `flutter run` signature prevents sandbox purchases; Google permits the licensed debug path. [https://developer.android.com/google/play/billing/test]
- **Flavors:** each flavor (dev, staging, prod with different bundle IDs or applicationIds) needs its own App Store Connect and Play Console app with its own products, and its own RevenueCat app entry and key. The common mistake is testing the `dev` flavor with the `prod` key: offerings come back empty because no dashboard app matches the `dev` bundle ID. Branch on flavor (`--dart-define=FLAVOR=dev` or equivalent).
- **Logs:** iOS in Xcode (attached to `flutter run`); Android with `flutter logs` or `adb logcat -s Purchases`. Dart `print` output does not show native SDK logs.
- **Verify:** (1) `await Purchases.setLogLevel(LogLevel.debug);` before `configure`; (2) the intended platform-sandbox build and licensed test account are selected (licensed debug or a test-track build on Android, sandbox device on iOS); (3) the purchase succeeds and the native console shows the SDK posting the transaction; (4) the dashboard Sandbox view shows it on the expected `appUserID`; (5) `await Purchases.getCustomerInfo()` shows the entitlement active; (6) drop to `LogLevel.info` before shipping.

## React Native and Expo

`react-native-purchases` runs on the native SDKs; React Native adds no testing mode. Run every check on iOS and Android separately.

```tsx
import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

const TEST_KEY = 'test_YOUR_TEST_STORE_KEY';
const PROD_KEY_IOS = 'appl_YOUR_IOS_PRODUCTION_KEY';
const PROD_KEY_ANDROID = 'goog_YOUR_ANDROID_PRODUCTION_KEY';

const apiKey = __DEV__
  ? TEST_KEY
  : Platform.OS === 'ios'
    ? PROD_KEY_IOS
    : PROD_KEY_ANDROID;

Purchases.configure({ apiKey });
```

- **`__DEV__` is `false` in release builds,** so dead code elimination removes the test key.
- **Expo: one key per EAS build profile** (`development`, `preview`, `production`), each with its own `EXPO_PUBLIC_REVENUECAT_API_KEY`, so a key never lands in the wrong build's JS bundle:

```
# eas.json
{
  "build": {
    "development": { "env": { "EXPO_PUBLIC_REVENUECAT_API_KEY": "test_YOUR_TEST_STORE_KEY" } },
    "preview":     { "env": { "EXPO_PUBLIC_REVENUECAT_API_KEY": "test_YOUR_TEST_STORE_KEY" } },
    "production":  { "env": { "EXPO_PUBLIC_REVENUECAT_API_KEY": "appl_YOUR_IOS_PRODUCTION_KEY" } }
  }
}
```

- **Expo Go cannot make purchases.** The testing and troubleshooting skills say any SDK call throws "native module not found" and Expo Go cannot be fixed to support it; the docs say the SDK's **Preview API Mode** detects Expo Go and swaps native calls for JavaScript mocks, so the app runs but real purchases do not. Either way, test purchases in a development build: `npx expo prebuild` or `eas build --profile development`.
- **iOS sandbox:** `npx react-native run-ios` on a connected device with a sandbox Apple account. TestFlight: `eas build --profile preview` or an archive uploaded to TestFlight.
- **Android sandbox:** use the platform key and the [licensed testing paths](#google-play-testing). The old source claimed every `npx react-native run-android` debug signature prevents sandbox purchases; Google permits the licensed debug path. [https://developer.android.com/google/play/billing/test]
- **Every bundle ID and applicationId you test** must be registered in Dashboard, Project, Apps with a matching public SDK key; each environment with its own identifier needs its own app entry and key. Branch on `Platform.OS` plus an env var or build-time constant.
- **Logs:** Metro's console does not show native SDK logs. Watch the Xcode console or Console.app (filter by bundle ID) and Android Studio Logcat or `adb logcat -s Purchases`.
- **After bumping `react-native-purchases` or changing a native build file,** clear stale caches that bind JS to an old native module:

```bash
npx react-native start --reset-cache
cd ios && pod install && cd ..
# for Expo:
npx expo prebuild --clean
```

- **Verify:** (1) `Purchases.setLogLevel(LOG_LEVEL.DEBUG);` before `configure` (the quickstart and Expo pages use `LOG_LEVEL.VERBOSE`); (2) a dev client for real purchases, and on Android the intended licensed debug or test-track build; (3) the purchase succeeds and the native console shows the posting; (4) the dashboard Sandbox view shows it on the expected `appUserID`; (5) `await Purchases.getCustomerInfo()` shows the entitlement active; (6) back to `LOG_LEVEL.INFO` before shipping.

## App Store sandbox

- **Prerequisites:** the latest Paid Applications Agreement is signed ("You will not be able to test in-app purchases until the latest version of this agreement is signed"), and products are **Ready to Submit** or further: sandbox does not return draft products. New products take time to appear: the testing-setup skill says "up to a few hours", the troubleshooting skill and docs say up to 24 hours. See [STORE-SETUP.md](STORE-SETUP.md).
- **Create a sandbox tester:** App Store Connect, Users and Access, **Sandbox** tab, Testers, **+**. Use an email **not** tied to a real Apple ID (a plus-addressed alias such as `tester+rc@example.com`) and set the region to the storefront you want to test.
- **Sign in on the device:** the docs give iOS 18+ `Settings > Developer > Sandbox Apple Account` and iOS 13+ `Settings > App Store > Sandbox Account`; the testing skill gives iOS 14+ `Settings > App Store > Sandbox Account`. No need to sign out of the production Apple ID; iOS asks for the sandbox password on the first purchase.
- **Use a physical device.** Simulators work only with StoreKit Configuration files.
- **Timing:** sandbox purchases may take upwards of 15 seconds; the transaction should then reach the dashboard **Sandbox** view within seconds. Look for `PostedTransaction` or `Purchase succeeded` style lines in the log.
- **Prices in sandbox and TestFlight may be wrong or in USD.** Check the purchase sheet currency, that entitlements unlock, the Apple ID's country, and that no currency is hardcoded.
- **Receipt limit:** RevenueCat keeps at most 100 App Store subscription receipts per customer; delete the customer to reset.
- **Clean first-purchase state:** purchase history stays on the sandbox account, so testing first purchases, intro offers or free trials on a used account misleads. Create a new sandbox tester, or App Store Connect, Sandbox, Testers, select the tester, clear purchase history. Deleting the RevenueCat customer doesn't delete Apple's history.
- **TestFlight is sandbox for RevenueCat.** Purchases and the install itself, including pre-purchase paywall views, are treated as sandbox and excluded from experiment results. The old source described SDK behavior as production and the table labeled its dashboard Production. [https://www.revenuecat.com/docs/test-and-launch/sandbox/apple-app-store]

### StoreKit Configuration File

- **Create:** Xcode, File, New, File, **StoreKit Configuration File**; save it in the project (for example `Configuration.storekit`); add products with **+** using the App Store Connect product IDs. Attach it in Product, Scheme, Edit Scheme, Run, Options, **StoreKit Configuration**; detach by setting it back to **None**.
- **Limits:** simulator, iOS 14+, Flutter SDK 2.0.0+, React Native SDK 4.0.0+. It "only works if you are running your app directly through Xcode. Any command line tools that use the `xcodebuild` command ... (like `flutter run` or Flutter's VSCode plugin) won't use the StoreKit Configuration File". Incompatible with macOS. Products must exist in RevenueCat.
- **To reach RevenueCat,** save the public certificate (**Editor > Save Public Certificate**) and upload it under **Project Settings > Apps > [app] > StoreKit testing framework**. Cancellations and refunds made in Xcode don't appear in RevenueCat. For subscription offers on the simulator, export the Subscription Offers Key as `SubscriptionKey_XXXXXX.p8` (under 512 B) and upload it.
- **Detach it before testing a live sandbox.** An attached StoreKit file is "the single most common iOS gotcha": purchases seem to succeed and the dashboard shows nothing.

## Google Play testing

- **Licensed Play testing:** use a license-tester account and the matching Play package/products. A signed test-track build is a distribution path; a matching-package sideloaded debug build is also permitted for license testers. The old three-part requirement incorrectly made a Play-installed build mandatory. [https://developer.android.com/google/play/billing/test]
- **Track guidance differs:** [RevenueCat/ai-toolkit, revenuecat-testing-setup, revenuecat-troubleshoot] recommends different internal/closed-track setups, and RevenueCat's sandbox guide describes a closed track. Google's primary guide separately permits licensed sideloaded debug testing. Do not turn the troubleshooting path into a universal requirement. [https://www.revenuecat.com/docs/test-and-launch/sandbox/google-play-store; https://developer.android.com/google/play/billing/test]
- **License testers:** Play Console, **Setup, License testing** (the docs: **Settings > License testing**), add the Gmail accounts, set **License response** to `RESPOND_NORMALLY` (other values simulate errors). RevenueCat recommends a single signed-in tester account to avoid account-selection problems; Google also documents how purchase-account selection works when several accounts are present. [https://developer.android.com/google/play/billing/test] Testers pay a test price ("test card, always approves") and can trigger renewal scenarios on Google's accelerated clock.
- **Upload the build:** (1) a signed AAB whose key matches the Play Console upload key or is uploaded under Play App Signing; (2) Play Console, **Release, Testing, Internal testing** (per the testing-setup skill), create a release, upload; (3) add the testers to the track's list; (4) publish to the track (the docs: no need to roll out; make the release available in at least one country); (5) each tester opens the opt-in link, accepts, and installs **from the Play Store link** for that distribution path; this does not prohibit licensed debug sideloading. "You must open the Opt-in URL" or products won't load. Fresh uploads take roughly 15 minutes; "not available in your country" on the opt-in link means wait and retry.
- **Debug sideloading is supported for license testers.** Match the package name to the Play-configured app and use a license-tester Google account for that Console account. The old troubleshooting source prohibited sideloaded debug builds even for license testers; that prohibition was wrong. [https://developer.android.com/google/play/billing/test]
- **Identifiers:** the AAB's `applicationId` must match the Play Console app and the Android app in the RevenueCat dashboard. Suffixed flavor IDs (`com.example.myapp.dev`) need their own Play Console and RevenueCat app entries.
- **Products:** **Monetize, In-app products** (one-time, must be **Active**) or **Monetize, Subscriptions** (at least one **Active** base plan). IDs are case sensitive and can't be reused after deletion. Non-active products show up as empty offerings in RevenueCat.
- **You may need** `<uses-permission android:name="com.android.vending.BILLING" />`, and a device PIN (otherwise a cryptic "Something went wrong").
- **Who pays what:**

| Account and build | Result |
|---|---|
| License tester and closed-track tester | Test card |
| Matching-package sideloaded debug build and license tester | Test purchases are supported; a closed-track install is not a universal prerequisite |
| Not a license tester | Real card purchase |

- **Clean first-purchase state:** there is no one-click clear. Use another license tester Gmail, or cancel in Play Store, Subscriptions on the device, wait for expiry (fast on the test clock), and retry.
- **Subscription test accounts** (Play Console, Subscriptions testing) have configurable test clocks; they are separate from license testers and exercise different code paths.
- **The transaction should reach the dashboard Sandbox view within seconds.**

## Other stores and web

- **Amazon Appstore** (`amzn_` key) and **Samsung Galaxy Store** have their own sandboxes: <https://developer.amazon.com/docs/in-app-purchasing/iap-testing-overview.html> and <https://developer.samsung.com/iap/iap-test-guide.html>. React Native's Galaxy Store configuration (SDK 10.3.0+) takes `galaxyBillingMode`, which defaults to `GALAXY_BILLING_MODE.PRODUCTION`; `TEST` and `ALWAYS_FAIL` are for testing, and Galaxy test purchases need a physical Galaxy device.
- **Web (RevenueCat Billing):** there is no App Review on the web, so test thoroughly in sandbox, and "Don't share sandbox URLs with users". Stripe Billing and Paddle sandboxes renew on full periods. Apple Pay and Google Pay can use real cards in sandbox.

## Accelerated renewals

Use accelerated renewals to exercise renewal callbacks, grace periods and billing retry logic.

| Period | Test Store | Apple sandbox | Google Play | RevenueCat Billing (web) |
|---|---|---|---|---|
| 1 day | | 3 min (skill) | | 5 min |
| 3 days | | 2 min (docs) | | 5 min |
| 1 week | 5 min | 3 min | 5 min | 5 min |
| 1 month | 5 min | 5 min | 5 min | 5 min |
| 2 months | 10 min | 10 min | | 10 min |
| 3 months | 15 min | 15 min | 10 min | 15 min |
| 6 months | 30 min | 30 min | 15 min | 30 min |
| 1 year | 1 hour | 1 hour | 30 min | 60 min |
| Renewals | 5, then cancels | Up to 12 renewals, then auto-renewal disables on attempt 13 (Apple) | At most 6 | At most 6 |

- **Web extras:** trial 5 min, intro 5 min, discount window 11 min, grace 3 min, billing retries every 3 minutes up to 5 attempts.
- **Apple sandbox count correction:** the old source said six renewals and the old table said twelve per day. Apple states up to twelve renewals, disabling auto-renewal on the thirteenth attempt, with configurable sandbox-account speeds; the default equalizes one month to five minutes. [https://developer.apple.com/help/app-store-connect/test-in-app-purchases/manage-sandbox-apple-account-settings/]

- **TestFlight renews "once every 24 hours"** since December 2024.

## Test cases

Run each on iOS and Android separately: a pass on one platform says nothing about the other.

1. **Success, failure, cancel** in the Test Store: success unlocks, failure shows an error, cancel stays idle.
2. **First purchase** from a fresh sandbox tester: the transaction appears in the Sandbox view on the logged-in `appUserID`, and the entitlement is active on a fresh `getCustomerInfo()`.
3. **Restore on a fresh install** restores the entitlement to the same test user.
4. **Intro offer and free trial** on a fresh tester only.
5. **Renewal, grace period, billing retry and expiry** on the accelerated clock.
6. **Pending purchase** (Ask to Buy, parental approval) in a store sandbox.
7. **Webhooks:** the endpoint receives events for sandbox purchases (`environment` = `SANDBOX`), or send a test event from the dashboard; the customer's **Events** tab shows what fired.
8. **One full store sandbox pass** before every release that ships subscriptions.
9. **Paywalls:** preview in the RevenueCat iOS app (v1.2+, drafts included, with preview prices); in-app preview by URL scheme is native only (iOS 5.80.0, Android 10.11.0; "Support for previewing paywalls in the hybrid SDKs is coming soon"). Override a customer's current offering in the Customer Profile, or target internal builds with "App Version equals X.Y.Z". Cover device sizes, every purchase flow, localization, variables, light and dark mode, and every multi-step navigation.

## Confirm on the dashboard

- **The device is not the evidence.** Confirm (1) the transaction is on the dashboard, (2) the expected `appUserID` owns it, (3) the expected entitlement is active on that user. Device success with an empty dashboard is a configuration-path problem, not the store.
- **The Sandbox data toggle** (Overview) shows Test Store and store sandbox purchases; they never appear in the Production view. "There's no concept of a sandbox or production *user*", and the toggle doesn't affect New or Active Customers.
- **Nothing in the Sandbox view** means the SDK did not report it (key, `configure` call, network) or the purchase ran against a StoreKit file that never reached RevenueCat.
- **Customers page:** pick the user and check the purchase, the entitlement and the `CustomerInfo` JSON.

## Prove it

- **Done means all four:** a test purchase succeeds end to end from a test user; it is in the dashboard Sandbox view on the logged-in `appUserID`; the entitlement is active on `customerInfo`; restoring on a fresh install gives the entitlement back to the same test user. If any fails, go to [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
- **Release builds use the store key,** not the `test_` key.
- **The `test_` key is not committed;** CI reads it from a secret.
- **Debug logging is gated** and dropped to info before shipping.
- **Success, failure and cancel** each produce the right UI in the Test Store dialog.
- **At least one end-to-end purchase** succeeded in each store sandbox, on each platform.
- **The webhook endpoint received** the sandbox purchase's event.
