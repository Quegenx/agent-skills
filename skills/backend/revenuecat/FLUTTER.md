# Flutter (purchases_flutter)

`purchases_flutter` wraps StoreKit, Google Play Billing and the RevenueCat backend for Flutter apps. Most outcomes come down to three things: `Purchases.configure` runs exactly once, awaited, before anything reads offerings or customer info; the right public key goes to the right platform; and access is decided by an entitlement identifier in `customerInfo.entitlements.active`, kept current by a listener, never by product IDs or purchase history. Entitlements, offerings and packages are explained in [CONCEPTS.md](CONCEPTS.md); store consoles in [STORE-SETUP.md](STORE-SETUP.md); paywalls in [PAYWALLS.md](PAYWALLS.md), subscriber management in [CUSTOMER-CENTER.md](CUSTOMER-CENTER.md); sandbox and Test Store in [TESTING.md](TESTING.md); errors in [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

**Contents:** [Install](#install) · [Configure](#configure) · [Identify users](#identify-users) · [Customer info and entitlement gates](#customer-info-and-entitlement-gates) · [Offerings and packages](#offerings-and-packages) · [Purchase flow](#purchase-flow) · [Restore](#restore) · [Flutter Web](#flutter-web) · [Customer attributes](#customer-attributes) · [Versions and breaking changes](#versions-and-breaking-changes) · [Prove it](#prove-it)

## Install

- **Prerequisite: Flutter 3.22 or later.** (v9.0.0 raised the minimum to Flutter 3.22.0 and Dart 3.4.0.)
- **Add the packages.** `flutter pub add purchases_flutter purchases_ui_flutter`. `purchases_ui_flutter` is only needed for [RevenueCat Paywalls](PAYWALLS.md) and [Customer Center](CUSTOMER-CENTER.md). Take the latest tag from https://github.com/RevenueCat/purchases-flutter/releases (the docs' pubspec example pins `^10.10.0` for both; if the releases page is unreachable, ask the user or check the existing `pubspec.yaml`).

```yaml
dependencies:
  purchases_flutter: ^<latest>
  # purchases_ui_flutter: ^<latest> # optional, for native paywalls
```

- **Fetch and link.** `flutter pub get`; with CocoaPods, `cd ios && pod install && cd ..`. New Flutter projects resolve native dependencies with Swift Package Manager automatically.
- **iOS target.** iOS 13.0 or higher (`ios/Podfile`: `platform :ios, '13.0'`), Swift 5.0 or higher. `purchases_ui_flutter` needs iOS 15.0 (see [PAYWALLS.md](PAYWALLS.md)). Enable the In-App Purchase capability in Xcode before App Store distribution; nothing else is needed to build and test with the Test Store.
- **Android target.** The integration skill and README say minSdk 21 (`android/app/build.gradle`: `defaultConfig { minSdk 21 }`); the 10.0.0 release (2026-04-15) raised the minimum to Android 6 (API 23). Confirm against the current release notes.
- **Android `launchMode`.** Backgrounding the app during a purchase (for example for bank-app verification) cancels the purchase if `launchMode` is anything other than `standard` or `singleTop`. New Flutter projects use `singleTop` (safe). Check `android/app/src/main/AndroidManifest.xml`:

```xml
<activity 
    android:name="com.your.Activity"
    android:launchMode="standard" />  <!-- or singleTop -->
```

- **Paywalls need `FlutterFragmentActivity`.** RevenueCat Paywalls require `MainActivity` to subclass `FlutterFragmentActivity` instead of `FlutterActivity`:

```kotlin
package com.your.package.name

import io.flutter.embedding.android.FlutterFragmentActivity

class MainActivity: FlutterFragmentActivity()
```

- **Platforms: the sources differ on web.** The integration skill says `purchases_flutter` supports iOS and Android only, not web, macOS, Windows or Linux; the docs and the 9.0.0 release note add Flutter Web through web billing (below). macOS, Windows and Linux are not supported; on unsupported platforms calls throw, so guard with `Platform.isIOS || Platform.isAndroid`.
- **Type-name conflicts with other plugins (e.g. mobx).** Import with an alias, `import 'package:purchases_flutter/purchases_flutter.dart' as purchases;`, then use `purchases.CustomerInfo`.

## Configure

- **Once, as early as possible.** Call `Purchases.configure(...)` exactly once per app launch at the app entry point; later calls no-op or warn. In Flutter it is async: `await` it before `runApp` or any code that reads offerings.
- **Public SDK keys only, one per platform.** Hybrid SDKs need a separate key per platform, found under **Project Settings > API keys > App specific keys**: iOS keys start `appl_`, Android `goog_`, Amazon `amzn_`. Public keys are safe in client code. Never put a secret key (`sk_`) in the app.
- **Keep keys out of source control.** Load them with `--dart-define` (or an environment wrapper for multi-flavor apps) rather than hard coding.
- **Debug logs first.** Set the log level before configuring; it is the first thing to check when the app behaves unexpectedly. Remove debug logging for release.

```dart
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:purchases_flutter/purchases_flutter.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Purchases.setLogLevel(LogLevel.debug); // remove for release

  final apiKey = Platform.isIOS
      ? 'appl_YOUR_IOS_PUBLIC_SDK_KEY'
      : 'goog_YOUR_ANDROID_PUBLIC_SDK_KEY';

  await Purchases.configure(PurchasesConfiguration(apiKey));

  runApp(const MyApp());
}
```

- **Web and Amazon branches.** For web, configure with `PurchasesConfiguration(<public_web_billing_api_key>)` when `kIsWeb`; for an Amazon build on Android, use `AmazonConfiguration(<public_amazon_api_key>)`. The configuring page's version, with every branch:

```dart
import 'dart:io' show Platform;

//...

Future<void> initPlatformState() async {
  await Purchases.setLogLevel(LogLevel.debug);
  
  PurchasesConfiguration configuration;
  if (kIsWeb) {
    // Only needed if you're targeting web
    configuration = PurchasesConfiguration(<public_web_billing_api_key>)
  } else if (Platform.isAndroid) {
    configuration = PurchasesConfiguration(<public_google_api_key>);
    if (buildingForAmazon) { 
      // use your preferred way to determine if this build is for Amazon store
      // checkout our MagicWeather sample for a suggestion
      configuration = AmazonConfiguration(<public_amazon_api_key>);
    }
  } else if (Platform.isIOS) {
    configuration = PurchasesConfiguration(<public_apple_api_key>);
  }
  await Purchases.configure(configuration);
}
```

- **Configuration options.** API key (required); App User ID (optional, `null` for anonymous; see below); Purchases Completed By (only if you have your own purchase code, see [MIGRATION.md](MIGRATION.md#adoption-observer-mode)).
- **Test Store key.** The Test Store has its own API key. In release builds the SDK crashes on purpose when it finds a Test Store key, and the Flutter SDK does not expose the opt-out. Never submit an app configured with a Test Store key: use the Test Store key for debug builds and the platform key for release (Test Store needs Flutter SDK 9.8.0+; details in [TESTING.md](TESTING.md)).
- **Blocked regions (mainland China, Russia, Myanmar).** Before configuring: `await Purchases.setProxyURL("https://api.rc-backup.com/");`.
- **Paywall locale.** `..preferredUILocaleOverride = 'es-ES'` on the configuration, or `await Purchases.overridePreferredUILocale('de-DE');`.
- **Check the banner.** After `flutter run`, the iOS Xcode console shows `[Purchases] - INFO: Purchases is configured`; on Android, `flutter logs` or `adb logcat` shows `Purchases: [Purchases] - INFO: Purchases is configured`. A wrong API key surfaces as an auth error as soon as the app fetches offerings.

## Identify users

Read the shared [App User ID and alias contract](IDENTITY.md#app-user-ids) before this platform adapter.

```dart
await Purchases.configure(
    PurchasesConfiguration(<public_sdk_key>)
      ..appUserID = <my_app_user_id>
);
```

- **Login result:** `Purchases.logIn(appUserID)` resolves to `LogInResult(customerInfo, created)`. Follow the [shared identity contract](IDENTITY.md#login-switching-and-aliases) for authentication timing and alias behavior.

```dart
import 'package:flutter/services.dart';
import 'package:purchases_flutter/purchases_flutter.dart';

Future<void> syncRevenueCat(String appUserID) async {
  try {
    final result = await Purchases.logIn(appUserID);
    // result.customerInfo is the current entitlement state for this user.
    // result.created is true the first time this appUserID reaches RevenueCat.
  } on PlatformException catch (e) {
    // Log and surface to your error pipeline; do not block the sign-in flow.
  }
}
```

- **`logOut` throws while anonymous** (`PlatformException`, `PurchasesErrorCode.logOutWithAnonymousUserError`). Guard with the current `Purchases.isAnonymous` (`Future<bool>`), not historical `originalAppUserId`: an anonymous-to-custom merge can retain an anonymous original ID after login. The old source's prefix check could skip logout for an identified user. [https://www.revenuecat.com/docs/customers/identifying-customers; https://github.com/RevenueCat/purchases-flutter/blob/main/lib/purchases_flutter.dart]

```dart
Future<void> signOutRevenueCat() async {
  if (await Purchases.isAnonymous) return;

  try {
    await Purchases.logOut();
  } on PlatformException {
    // Log; usually safe to ignore during sign-out.
  }
}
```

- **Account switching:** follow the shared [login and alias rules](IDENTITY.md#login-switching-and-aliases); the adapter below switches known IDs with `logIn` directly.

```dart
class RevenueCatIdentitySync {
  String? _previous;

  void attach(Stream<String?> currentUserIDStream) {
    currentUserIDStream.listen((next) async {
      final prev = _previous;
      _previous = next;
      if (prev == null && next != null) {
        await syncRevenueCat(next);
      } else if (prev != null && next == null) {
        await signOutRevenueCat();
      } else if (prev != null && next != null && prev != next) {
        await syncRevenueCat(next);
      }
    });
  }
}
```

- **Errors.** `PurchasesErrorHelper.getErrorCode(e)` turns a `PlatformException` into a `PurchasesErrorCode`; for `logIn`/`logOut`, log and continue.
- **Show the App User ID** in settings for support; read it with `Purchases.appUserID` (`Future<String>`).
- **Restore is not login.** On a new device, `logIn(appUserID)` first, then `restorePurchases()` only if the user expects to pull a receipt from the current store account.
- **Configure first.** `logIn` and `logOut` throw if `Purchases.configure` has not run.

## Customer info and entitlement gates

- **Gate on the entitlement identifier** (e.g. `"premium"`, configured in the dashboard and mapped to products), never on a product ID. The identifier is case sensitive; a typo silently gates everyone out.
- **`customerInfo.entitlements.active` is the source of truth.** Presence means access now. Expired subscriptions stay in `entitlements.all` but drop out of `active`; don't gate on purchase history. `info.entitlements.all['premium']?.isActive == true` is equivalent. Any active entitlement: `customerInfo.entitlements.active.isNotEmpty`.
- **Check when deciding which UI to show,** typically at launch and before presenting a paywall, and any time a user opens premium content. `getCustomerInfo` is safe to call repeatedly: it usually returns the cache, and the SDK refreshes a cache older than 5 minutes only when you call it, purchase or restore. Don't call it in a tight loop.

```dart
import 'package:purchases_flutter/purchases_flutter.dart';

Future<bool> hasPremium() async {
  try {
    final info = await Purchases.getCustomerInfo();
    return info.entitlements.active.containsKey('premium');
  } catch (e) {
    // Network or auth error. Treat as "no access" and log for diagnostics.
    return false;
  }
}
```

- **Fetch once, then subscribe.** `Purchases.addCustomerInfoUpdateListener` fires on every change received on this device (purchase, restore, renewal, expiration), at launch and through the app's life. RevenueCat does not push updates: they arrive only when the SDK makes a network request. Feed the listener into a `ChangeNotifier`, `StreamController` or your state management, and always `removeCustomerInfoUpdateListener` on dispose, or listeners leak.

```dart
import 'package:flutter/foundation.dart';
import 'package:purchases_flutter/purchases_flutter.dart';

class EntitlementsModel extends ChangeNotifier {
  bool _hasPremium = false;
  bool get hasPremium => _hasPremium;

  late final CustomerInfoUpdateListener _listener;

  EntitlementsModel() {
    _listener = (info) {
      final next = info.entitlements.active.containsKey('premium');
      if (next != _hasPremium) {
        _hasPremium = next;
        notifyListeners();
      }
    };
    Purchases.addCustomerInfoUpdateListener(_listener);
    _seed();
  }

  Future<void> _seed() async {
    try {
      final info = await Purchases.getCustomerInfo();
      _listener(info);
    } catch (_) {/* ignore; listener will fire on next update */}
  }

  @override
  void dispose() {
    Purchases.removeCustomerInfoUpdateListener(_listener);
    super.dispose();
  }
}
```

```dart
ChangeNotifierProvider(
  create: (_) => EntitlementsModel(),
  child: Consumer<EntitlementsModel>(
    builder: (_, model, __) =>
      model.hasPremium ? const PremiumScreen() : const PaywallScreen(),
  ),
);
```

- **`FutureBuilder<CustomerInfo>(future: Purchases.getCustomerInfo(), ...)`** works for a one-off check but does not react to purchase events.
- **Empty is normal before any purchase.** CustomerInfo has no entitlements until a purchase is made or transactions are synced, even if entitlements exist in the dashboard.
- **Cache timings.** The SDK refreshes after 5 minutes in the foreground, 25 hours in the background, and after a purchase or restore. Customer info and the App User ID persist between launches; an entitlement active when the user went offline stays active for up to three days. Force a refetch with `invalidateCustomerInfoCache()` (for example after a dashboard grant). Offline Entitlements grant access temporarily when RevenueCat is unreachable (not for one-time purchases, and not when your app completes transactions).
- **Repeated auth error at launch** means a wrong API key or an SDK that was never configured.
- **Will it renew?** [ApparenceKit](https://apparencekit.dev/flutter-tips/check-user-subscription-renewal-status/) reads `willRenew` to "reach out and maybe show them a special deal before they leave" (the messaging order is in [CONCEPTS.md](CONCEPTS.md#subscription-states-and-access)). Verbatim:

```dart
Future<bool> hasRenewal() async {
  final customerInfo = await Purchases.getCustomerInfo();
  final entitlements = customerInfo.entitlements.active.values.firstOrNull;
  return entitlements?.willRenew ?? false; // Added null check for safety
}
```

  `active.values.firstOrNull` reads whichever active entitlement comes first; with more than one entitlement, read the one that gates the feature: `customerInfo.entitlements.active['premium']?.willRenew ?? false`.

## Offerings and packages

- **Use the `current` offering,** never hard-coded identifiers; dashboard targeting and experiments can change it per user. If `current` is null, no packages are live for this user.

```dart
import 'package:purchases_flutter/purchases_flutter.dart';

Future<List<Package>> currentPackages() async {
  final offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages ?? const [];
}
```

- **Package access.** `.availablePackages`, `.monthly` (and the other duration types), `.getPackage("<package_id>")`; the product is `package.storeProduct` (`StoreProduct`), price text `package.storeProduct.priceString`. An offering by identifier: `offerings.getOffering("experiment_group")`. Placements: `await Purchases.getCurrentOfferingForPlacement(placementIdentifier: "your-placement-identifier")`.
- **Paywall helpers on a package** [ApparenceKit](https://apparencekit.dev/flutter-tips/revenuecat-flutter-boilerplate-tips/) (the article calls them extension methods; the `revenueCatPackage` and `revenueCatOffer` they read are not defined in it). The subscription period as a `Duration`, verbatim:

```dart
duration get duration => switch(revenueCatPackage.storeProduct.subscriptionPeriod) {
  'P1W' => const Duration(days: 7),
  'P1M' => const Duration(days: 30),
  'P3M' => const Duration(days: 90),
  'P6M' => const Duration(days: 180),
  'P1Y' => const Duration(days: 365),
  _ => Duration.zero,
};
```

  It does not compile: the return type is the class `Duration` (https://api.dart.dev/dart-core/Duration-class.html), not `duration`. Corrected first line:

```dart
Duration get duration => switch(revenueCatPackage.storeProduct.subscriptionPeriod) {
```

  Months count as 30 days and years as 365; any other period (`P2M`, `P1D`) and one-time products (period `null`) give `Duration.zero`. For labels, build from value and unit instead ([CONCEPTS.md](CONCEPTS.md#products)).
- **Free-trial days** from the introductory price, so trial text is computed, not hard-coded [ApparenceKit](https://apparencekit.dev/flutter-tips/revenuecat-flutter-boilerplate-tips/) (`IntroductoryPrice` has `price`, `periodUnit` and `periodNumberOfUnits`: https://github.com/RevenueCat/purchases-flutter/blob/main/lib/models/introductory_price.dart). Verbatim:

```dart
int? get trialDays {
  final introductory = revenueCatPackage.storeProduct.introductoryPrice;
  if (introductory == null) {
    return null;
  }
  if (introductory.price == 0) {
    final unit = introductory.periodUnit;
    switch (unit) {
      case PeriodUnit.day:
        return introductory.periodNumberOfUnits;
      case PeriodUnit.week:
        return introductory.periodNumberOfUnits * 7;
      case PeriodUnit.month:
        return introductory.periodNumberOfUnits * 30;
      case PeriodUnit.year:
        return introductory.periodNumberOfUnits * 365;
      default:
        return null;
    }
  }
  return null;
}
```

- **Localized paywall features from Offering metadata** [ApparenceKit](https://apparencekit.dev/flutter-tips/revenuecat-flutter-boilerplate-tips/): store `{ "<languageCode>": { "features": ["...", "..."] } }` in the offering's metadata and read the current language's list. Verbatim, including the source's `featuersObj` spelling; `LocaleSettings.currentLocale` comes from the article's localization package, which it doesn't name, `data["features"]!` throws when a locale entry has no `features`, and `e!` throws on a null item:

```dart
List<String>? get features {
  final locale = LocaleSettings.currentLocale.languageCode;
  if (revenueCatOffer.metadata[locale] == null) {
    return null;
  }
  final data = revenueCatOffer.metadata[locale] as Map<Object?, Object?>;
  final featuersObj = data["features"]! as List<Object?>;
  return featuersObj.map((e) => e! as String).toList();
}
```

- **Offerings don't persist between launches.** They are cached at configure and refreshed after 5 minutes; cache them yourself if you must show them offline.
- **Empty offerings** usually mean a store configuration mismatch: see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

## Purchase flow

Use this only for a custom paywall. A RevenueCat Paywall runs the purchase itself ([PAYWALLS.md](PAYWALLS.md)); settle which one the app uses before writing paywall code.

- **Flow.** `getOfferings()`, pick a `Package` from the current offering, purchase it. `Purchases.purchasePackage(pkg)` is the simplest call; `Purchases.purchase(PurchaseParams.package(pkg))` is the newer overload that accepts promotional offers and other options (products directly: `PurchaseParams.storeProduct(product)`; Android one-time products are fetched with `ProductCategory.nonSubscription`). Since v9.0.0 purchase methods return `PurchaseResult` (customerInfo plus StoreTransaction).
- **Cancellation is not an error.** Detect it with `PurchasesErrorHelper.getErrorCode(e) == PurchasesErrorCode.purchaseCancelledError` and return silently, no alert, no stuck loading state. Never read `PlatformException.code` strings: native error strings differ between iOS and Android.
- **Message only what the user can act on:** payment declined, network errors, store unavailable, receipt already in use. Log the rest and let the user retry. Never silently succeed when the purchase failed.
- **Don't unlock inside the purchase callback.** Let the customer-info listener flip the gated UI, so purchase and restore share one source of truth.

```dart
import 'package:flutter/services.dart';
import 'package:purchases_flutter/purchases_flutter.dart';

sealed class PurchaseOutcome {}
class Purchased extends PurchaseOutcome {}
class Cancelled extends PurchaseOutcome {}
class Failed extends PurchaseOutcome {
  final Object error;
  Failed(this.error);
}

Future<PurchaseOutcome> buy(Package pkg) async {
  try {
    await Purchases.purchasePackage(pkg);
    // Do not unlock content here. A CustomerInfoUpdateListener flips the
    // gated UI (see revenuecat-entitlements-gate).
    return Purchased();
  } on PlatformException catch (e) {
    final code = PurchasesErrorHelper.getErrorCode(e);
    if (code == PurchasesErrorCode.purchaseCancelledError) {
      return Cancelled();
    }
    return Failed(e);
  }
}
```

- **The docs' purchase snippet** checks the entitlement on the purchase result and unlocks there; the purchase-flow skill says not to unlock inside the purchase callback and to let the listener flip the UI (as `buy` above does):

```dart
// Using Offerings/Packages
try {
  final purchaseParams = PurchaseParams.package(package);
  PurchaseResult result = await Purchases.purchase(purchaseParams);
  if (result.customerInfo.entitlements.all["my_entitlement_identifier"]?.isActive ?? false) {
    // Unlock that great "pro" content
  }
} on PlatformException catch (e) {
  var errorCode = PurchasesErrorHelper.getErrorCode(e);
  if (errorCode != PurchasesErrorCode.purchaseCancelledError) {
    showError(e);
  }
}
```

- **One purchase at a time.** Disable buy buttons while a purchase is in flight to prevent double charges.
- **Meta purchase event.** To send the purchase to Meta, use `result.storeTransaction.transactionIdentifier` as the `eventId`; a third-party snippet that reads `res.purchaserInfo` does not compile on 9.0.0+, where `PurchaseResult` has only `customerInfo` and `storeTransaction` (https://github.com/RevenueCat/purchases-flutter/blob/main/lib/models/purchase_result.dart) ([app-growth META-ADS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/META-ADS.md#facebook-sdk-in-flutter)).

```dart
class BuyButton extends StatefulWidget {
  final Package package;
  const BuyButton(this.package, {super.key});

  @override
  State<BuyButton> createState() => _BuyButtonState();
}

class _BuyButtonState extends State<BuyButton> {
  bool _isBuying = false;

  Future<void> _tap() async {
    setState(() => _isBuying = true);
    try {
      final outcome = await buy(widget.package);
      if (!mounted) return;
      if (outcome is Failed) {
        showDialog<void>(
          context: context,
          builder: (_) => AlertDialog(
            title: const Text('Purchase failed'),
            content: Text(outcome.error.toString()),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('OK'),
              ),
            ],
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isBuying = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: _isBuying ? null : _tap,
      child: Text(widget.package.storeProduct.priceString),
    );
  }
}
```

- **Transactions are finished for you.** RevenueCat finishes (iOS) and acknowledges or consumes (Android) transactions unless you tell the SDK your app completes them.

## Restore

- **A visible button, triggered only by the user.** Put "Restore purchases" on the paywall and/or in settings; iOS legally requires one, and the docs recommend it even when every customer has an account. Never call `restorePurchases` programmatically: it may trigger OS sign-in prompts. For programmatic restore (typically migrations) use `syncPurchases`, which shows no prompts but can transfer or alias an anonymous user.

```dart
Future<CustomerInfo?> restore() async {
  try {
    return await Purchases.restorePurchases();
  } on PlatformException {
    return null;
  }
}
```

- **What restore does.** It attaches the current store receipt to the current RevenueCat user; it never switches identities. Whether it transfers access from another App User ID is the project's restore behavior setting (default: transfer), described in [IDENTITY.md](IDENTITY.md#restore-behavior).
- **Consumables and non-renewing subscriptions** can only be restored with custom App User IDs.
- **Consumed one-time products on Android.** Google Billing Client 8 removed querying consumed one-time purchases (purchases-flutter 9.0.0+), and 10.0.0 removed RevenueCat's workaround: without a login system, configure each one-time product correctly as consumable or non-consumable, or customers can't restore them from 10.0.0 on. Mitigation for anonymous apps: back up RevenueCat's SharedPreferences file (`RevenueCatBackupAgent.REVENUECAT_PREFS_FILE_NAME`) with Auto Backup, or set `android:backupAgent="com.revenuecat.purchases.backup.RevenueCatBackupAgent"` on `<application>` (this disables Auto Backup).

## Flutter Web

- **Same billing engines as the Web SDK:** RevenueCat Billing, Stripe Billing, Paddle Billing, configured with the web config's public API key.
- **Limitations.** `presentPaywall` is not yet supported on web; `getProducts`, `purchaseProduct` and `restorePurchases` don't work on web. Use the same `appUserID` across web and mobile; web products are configured separately, entitlements are shared.

## Customer attributes

The shared [attribute contract and setter calls](IDENTITY.md#customer-attributes) own limits, reserved keys, sync timing and write-only security.

## Versions and breaking changes

| Version | Date | Change |
|---|---|---|
| 10.0.0 | 2026-04-15 | Billing Library 8.3.0; Android minimum API 23 (was 21); consumed one-time product restore workaround removed |
| 9.0.0 | 2025-07-18 | Billing Library 8 (no querying expired subscriptions or consumed one-time products); min Flutter 3.22.0 / Dart 3.4.0; freezed removed (`toJson`, `StoreTransaction.revenueCatIdentifier` gone); `WebPurchaseRedemptionResult` sealed class; purchase methods return `PurchaseResult`; Flutter Web added |
| 8.0.0 | 2024-08-22 | You must configure the In-App Purchase Key: iOS purchases fail without it; embedding v1 removed |
| 7.0.0 | 2024-08-06 | Docs list Flutter 7.0.0+ as requiring the In-App Purchase Key (the 8.0.0 release note says 8.0.0; confirm in current docs) |

- Latest at research time: purchases-flutter 10.16.0 (2026-10-14). Always resolve the current tag from the releases page.

## Prove it

1. `flutter run` builds, and the platform log (Xcode console, or `flutter logs` / `adb logcat`) shows `Purchases is configured`, with no auth error when offerings load.
2. `await Purchases.getOfferings()` returns a non-null `current` with packages; prices come from `storeProduct.priceString`, not hard-coded strings.
3. The entitlement identifier in code matches the dashboard exactly; an entitled user sees the feature, others don't.
4. A sandbox purchase (or a manual grant in the dashboard) flips the gated UI without restarting the app; cancelling the store sheet shows no alert and clears the loading state.
5. Buying an already active subscription is handled without a crash (StoreKit and Play Billing surface a `productAlreadyPurchased` / `receiptAlreadyInUse` path); buttons are disabled while a purchase is in flight.
6. On a fresh install signed into the same store account, Restore brings back the entitlement and the UI.
7. After sign-in the dashboard Customer page shows your backend's ID, not `$RCAnonymousID:`; after sign-out `getCustomerInfo()` returns an `originalAppUserId` starting with `$RCAnonymousID:`; an anonymous purchase followed by `logIn` stays attached; `logOut` while anonymous neither crashes nor silently succeeds.
8. Release builds use the platform key, never the Test Store key.
