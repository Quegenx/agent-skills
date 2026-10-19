# Migration

Two different jobs share this file. **Adoption** (Path A) adds RevenueCat to an app that already sells through StoreKit or Google Play Billing directly, or through a Flutter or React Native IAP library. **Version upgrade** (Path B) moves an app across a RevenueCat SDK major. If you need both, run Path A first, then Path B. Exactly one side, your code or RevenueCat, may finish (iOS) and acknowledge (Android) each purchase. SDK setup is in [FLUTTER.md](FLUTTER.md) and [REACT-NATIVE.md](REACT-NATIVE.md), store credentials in [STORE-SETUP.md](STORE-SETUP.md), sandbox checks in [TESTING.md](TESTING.md).

- **Stale note: Glassfy.** ApparenceKit's Supabase Flutter template once paid through Glassfy (Apple) and Play Billing ([ApparenceKit](https://apparencekit.dev/blog/supabase-flutter-template-released/)); its CLI 3.0.0 moved to RevenueCat entirely ("we are migrating to this solution completely", [ApparenceKit](https://apparencekit.dev/blog/apparencekit-cli-3-update/)). This skill does not cover Glassfy.

## Adoption: observer mode

The configuration option is "Purchases Completed By" (optional, only if you have your own purchase code); the SDKs call it `purchasesAreCompletedBy`, and the docs once called it Observer Mode. It is "the key lever for adopting RevenueCat without rewriting purchase code": the SDK observes the transactions your StoreKit or Billing code processes, sends them to RevenueCat for validation and updates subscriber state, but does **not** start or finish them. Your purchase UI, receipt validation and finishing stay as they are.

| Platform | Setting |
|---|---|
| Flutter | `const PurchasesAreCompletedByMyApp(storeKitVersion: StoreKitVersion.storeKit2)` on `PurchasesConfiguration` |
| React Native | `purchasesAreCompletedBy: { type: PURCHASES_ARE_COMPLETED_BY_TYPE.MY_APP, storeKitVersion: STOREKIT_VERSION.STOREKIT_2 }` |
| iOS native | `purchasesAreCompletedBy: .myApp` with `storeKitVersion: .storeKit1` or `.storeKit2` on `Configuration.Builder` (separate parameters, not one associated value) |
| Android native | `purchasesAreCompletedBy(PurchasesAreCompletedBy.MY_APP)` on `PurchasesConfiguration.Builder` |

- **The default is RevenueCat completes** (`REVENUECAT`, `.revenueCat`, `PurchasesAreCompletedByRevenueCat`): RevenueCat finishes iOS transactions and acknowledges and consumes Android ones.
- **The StoreKit version is required on iOS even in observer mode.** Use StoreKit 1 if your iOS code uses StoreKit 1. The setting only affects iOS; Android ignores it.
- **Your code keeps finishing.** With `MY_APP`, RevenueCat does not call `finishTransaction` (StoreKit 1) or `Transaction.finish()` (StoreKit 2) on iOS, and on Android your code must call `acknowledgePurchase` (or `consumePurchase` for consumables) within 3 days or Play refunds the purchase.
- **Still supported on Billing Library 8:** "own-IAP-code mode (previously Observer Mode)" works with Google Play Billing Library 8.0.0+ (SDK 9.0.0).
- **Recommended native floors for adoption:** "a recent 5.x release" on iOS, "a recent 8.x or newer release" on Android.

### Flutter

Typical prior setups are `in_app_purchase` or a custom MethodChannel wrapper. Add `purchases_flutter` to `pubspec.yaml`, run `flutter pub get` (full setup in [FLUTTER.md](FLUTTER.md)), then configure:

```dart
import 'dart:io';
import 'package:purchases_flutter/purchases_flutter.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Purchases.setLogLevel(LogLevel.debug);

  final apiKey = Platform.isIOS
      ? 'appl_YOUR_IOS_PUBLIC_SDK_KEY'
      : 'goog_YOUR_ANDROID_PUBLIC_SDK_KEY';

  final config = PurchasesConfiguration(apiKey)
    ..purchasesAreCompletedBy = const PurchasesAreCompletedByMyApp(
      storeKitVersion: StoreKitVersion.storeKit2,
    );

  await Purchases.configure(config);

  runApp(const MyApp());
}
```

### React Native and Expo

Typical prior setups are `react-native-iap` or a custom native module.

```bash
npm install react-native-purchases
cd ios && pod install && cd ..
```

Expo managed:

```bash
npx expo install react-native-purchases
npx expo prebuild --clean # dev client required, Expo Go does not work
```

```ts
import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ARE_COMPLETED_BY_TYPE,
  STOREKIT_VERSION,
} from 'react-native-purchases';

Purchases.setLogLevel(LOG_LEVEL.DEBUG);

const apiKey = Platform.OS === 'ios'
  ? 'appl_YOUR_IOS_PUBLIC_SDK_KEY'
  : 'goog_YOUR_ANDROID_PUBLIC_SDK_KEY';

Purchases.configure({
  apiKey,
  purchasesAreCompletedBy: {
    type: PURCHASES_ARE_COMPLETED_BY_TYPE.MY_APP,
    storeKitVersion: STOREKIT_VERSION.STOREKIT_2,
  },
});
```

Use `STOREKIT_VERSION.STOREKIT_1` for StoreKit 1 code. Your iOS code keeps finishing transactions and your Android code keeps acknowledging within 3 days.

### Keep users continuous

- **If the app has its own accounts,** call `await Purchases.logIn(existingAppUserID);` once configured, after your authentication completes. It attaches prior purchase history to the right RevenueCat user on ingestion; without it, purchases go to an anonymous RevenueCat user and can't be matched later. Skip it only when there are no authenticated users.
- **Bring existing purchases in with `syncPurchases`,** not `restorePurchases`. `syncPurchases` shows no OS prompts and is "typically used for migrating subscriptions"; it carries a risk of transferring or aliasing an anonymous user. React Native's current method is `syncPurchasesForResult()`: `const { customerInfo } = await Purchases.syncPurchasesForResult();`. `restorePurchases` "**should not** be triggered programmatically, since it may cause OS level sign-in prompts"; call it only from a user action.
- **Restore behavior:** use the shared [project and sandbox transfer policy](IDENTITY.md#restore-behavior) when ingesting receipts that already belong to another user.

### Cut over to RevenueCat

- **Once observer mode is stable,** optionally move to full RevenueCat mode: remove the `purchasesAreCompletedBy` setting (back to the default), replace your purchase calls with `Purchases.purchasePackage(...)` or `Purchases.purchaseStoreProduct(...)`, and remove your own finishing and acknowledgement code **in the same change**.
- **Never double process.** Removing the flag while old finishing code stays means transactions are acknowledged twice and entitlement state goes inconsistent. "Exactly one side must own finishing / acknowledging. Pick a side and remove the other." "Do not ship an interim build where both sides try to finish transactions."

## Version upgrade

- **Majors change the configuration shape, drop deprecated APIs and shift defaults.** "Treat the SDK repo's docs as authoritative": walk the CHANGELOG from your installed version to the target, read any `*MIGRATION*.md` file or `migrations/` directory in the repo (React Native has `migrations/v8-MIGRATION.md`), and each major's GitHub release notes.
- **Hybrid majors usually track native majors,** so the native CHANGELOGs apply too.

| SDK | CHANGELOG | Releases |
|---|---|---|
| `purchases_flutter` | <https://github.com/RevenueCat/purchases-flutter/blob/main/CHANGELOG.md> | <https://github.com/RevenueCat/purchases-flutter/releases> |
| `react-native-purchases` | <https://github.com/RevenueCat/react-native-purchases/blob/main/CHANGELOG.md> | <https://github.com/RevenueCat/react-native-purchases/releases> |
| purchases-ios | <https://github.com/RevenueCat/purchases-ios/blob/main/CHANGELOG.md> (migration guide as DocC under `Sources/DocCDocumentation`) | |
| purchases-android | <https://github.com/RevenueCat/purchases-android/blob/main/CHANGELOG.md> | |

- **The docs' agent index** (`https://www.revenuecat.com/docs/llms.txt`) lists "Major-version migration guides for the iOS and Android native SDKs"; append `.md` to any docs URL for Markdown.
- **Order on every platform:** (1) bump the SDK in a branch; (2) fix compile errors from the CHANGELOG's deprecations and removals; (3) fix runtime behavior by reading the SDK log on first launch; (4) run the test suite and manual sandbox scenarios before merging.
- **After the bump,** run `cd ios && pod install` (React Native) or `flutter clean`, `flutter pub get`, `pod install` (Flutter), and relaunch fully; see [TROUBLESHOOTING.md](TROUBLESHOOTING.md#react-native-and-expo).

### Breaking changes by version

| Version | Date | Change |
|---|---|---|
| 10.0.0 | Flutter and React Native 2026-04-15 | Billing Library 8.3.0; Android minimum raised to API 23 (Android 6), previously 21. Removes the workaround that restored consumed one-time products: without a login system, configure one-time products correctly as consumable or non-consumable or customers "won't be able to restore them from version 10.0.0 onward". purchases-hybrid-common 18.0.0 |
| 9.0.0 | Flutter and React Native 2025-07-18 | Google Play Billing Library 8: no querying expired subscriptions or consumed one-time products. Flutter: minimum Flutter 3.22.0 and Dart 3.4.0; freezed removed (`toJson` and `StoreTransaction.revenueCatIdentifier` gone); `WebPurchaseRedemptionResult` is a sealed-class switch; purchase methods return `PurchaseResult` (customerInfo plus StoreTransaction) instead of `CustomerInfo`; Flutter Web added. React Native: Kotlin 2.0.21, minimum Kotlin 1.8.0; web target with hardcoded fakes |
| 8.0.0 | Flutter 2024-08-22, React Native 2024-08-01 | "you **must** configure your In-App Purchase Key ... **Purchases on iOS will fail if the key is not configured**." Flutter dropped embedding v1 |
| 7.0.0 | Flutter 2024-08-06, React Native 2023-10-05 | |

- **In-App Purchase Key threshold disagrees:** the docs list Flutter 7.0.0+ and React Native 8.0.0+; the Flutter 8.0.0 release note says the requirement starts at v8. Check the current docs.
- **Moving from StoreKit 1 to StoreKit 2:** update to iOS SDK 5.0+ (StoreKit 2 needs iOS 15+), configure the In-App Purchase Key, remove the App-Specific Shared Secret. See [STORE-SETUP.md](STORE-SETUP.md).
- **Consumed one-time purchases after Billing Client 8** (purchases-flutter 9.0.0+, react-native-purchases 9.0.0+): apps with anonymous users that sold consumed one-time products lose the ability to restore them from the store. Mitigation: back up RevenueCat's SharedPreferences file (`RevenueCatBackupAgent.REVENUECAT_PREFS_FILE_NAME`) with Android Auto Backup (on by default, 25 MB limit) or key-value backup via `android:backupAgent="com.revenuecat.purchases.backup.RevenueCatBackupAgent"` on `<application>` (which disables Auto Backup).
- **Releases at the time of writing:** purchases-flutter 10.16.0 (2026-10-14), react-native-purchases 10.14.0 (2026-10-15).

## Prove it

- **Builds on the new SDK** on iOS and Android with no deprecated-API warnings you care about, and the native console shows the `Purchases is configured` banner on each.
- **A sandbox purchase on each platform** lands in the dashboard Sandbox view on the expected `appUserID`.
- **An existing pre-migration subscriber keeps the right entitlement:** for Path A this proves observer ingestion, for Path B that no state was dropped.
- **Exactly one side finishes transactions:** in observer mode your code finishes and acknowledges (within 3 days on Android); after cutover none of your finishing code remains.
- **The debug log level override is gone** before shipping (`LogLevel.info`, `LOG_LEVEL.INFO`).
