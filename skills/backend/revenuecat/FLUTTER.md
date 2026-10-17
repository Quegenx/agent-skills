# Flutter (purchases_flutter)

`purchases_flutter` wraps StoreKit, Google Play Billing and the RevenueCat backend for Flutter apps. Most outcomes come down to three things: `Purchases.configure` runs exactly once, awaited, before anything reads offerings or customer info; the right public key goes to the right platform; and access is decided by an entitlement identifier in `customerInfo.entitlements.active`, kept current by a listener, never by product IDs or purchase history. Entitlements, offerings and packages are explained in [CONCEPTS.md](CONCEPTS.md); store consoles in [STORE-SETUP.md](STORE-SETUP.md); paywalls and Customer Center in [PAYWALLS.md](PAYWALLS.md); sandbox and Test Store in [TESTING.md](TESTING.md); errors in [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

**Contents:** [Install](#install) · [Configure](#configure) · [Identify users](#identify-users) · [Customer info and entitlement gates](#customer-info-and-entitlement-gates) · [Offerings and packages](#offerings-and-packages) · [Purchase flow](#purchase-flow) · [Restore](#restore) · [Flutter Web](#flutter-web) · [Customer attributes](#customer-attributes) · [Versions and breaking changes](#versions-and-breaking-changes) · [Prove it](#prove-it)

## Install

- **Prerequisite: Flutter 3.22 or later.** (v9.0.0 raised the minimum to Flutter 3.22.0 and Dart 3.4.0.)
- **Add the packages.** `flutter pub add purchases_flutter purchases_ui_flutter`. `purchases_ui_flutter` is only needed for RevenueCat Paywalls and Customer Center. Take the latest tag from https://github.com/RevenueCat/purchases-flutter/releases (the docs' pubspec example pins `^10.10.0` for both; if the releases page is unreachable, ask the user or check the existing `pubspec.yaml`).

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

- **Configuration options.** API key (required); App User ID (optional, `null` for anonymous; see below); Purchases Completed By (only if you have your own purchase code, see [CONCEPTS.md](CONCEPTS.md)).
- **Test Store key.** The Test Store has its own API key. In release builds the SDK crashes on purpose when it finds a Test Store key, and the Flutter SDK does not expose the opt-out. Never submit an app configured with a Test Store key: use the Test Store key for debug builds and the platform key for release (Test Store needs Flutter SDK 9.8.0+; details in [TESTING.md](TESTING.md)).
- **Blocked regions (mainland China, Russia, Myanmar).** Before configuring: `await Purchases.setProxyURL("https://api.rc-backup.com/");`.
- **Paywall locale.** `..preferredUILocaleOverride = 'es-ES'` on the configuration, or `await Purchases.overridePreferredUILocale('de-DE');`.
- **Check the banner.** After `flutter run`, the iOS Xcode console shows `[Purchases] - INFO: Purchases is configured`; on Android, `flutter logs` or `adb logcat` shows `Purchases: [Purchases] - INFO: Purchases is configured`. A wrong API key surfaces as an auth error as soon as the app fetches offerings.

## Identify users

- **Anonymous by default.** Without an App User ID, RevenueCat generates `$RCAnonymousID:...` and caches it on the device; a reinstall creates a new one, and anonymous IDs can't share status across apps and platforms. Pass `appUserID` at configure only if you already have an authenticated user at launch; otherwise call `logIn` later.

```dart
await Purchases.configure(
    PurchasesConfiguration(<public_sdk_key>)
      ..appUserID = <my_app_user_id>
);
```

- **Choose the ID carefully; it is hard to change.** Use a stable, opaque, non-guessable value such as your backend user UUID (UUID v4 recommended) or a hash of the user id. Never an email, phone number, sequential database id, IDFA, or a hard-coded string (it could unlock entitlements for users who never paid). Max 100 characters, case sensitive, scoped to the whole project; no `/`. Blocked values include `'no_user'`, `'null'`, `'none'`, `'nil'`, `'(null)'`, `'NaN'`, `'\\x00'`, `''`, `'unidentified'`, `'undefined'`, `'unknown'`, `'anonymous'`, `'guest'`, `'-1'`, `'0'`, `'[]'`, `'{}'`, `'[object Object]'`.
- **Call `logIn` after your auth confirms the session,** typically from your auth-state listener, not speculatively. `Purchases.logIn(appUserID)` resolves to `LogInResult(customerInfo, created)`; `created` is true the first time this ID reaches RevenueCat. Anonymous purchases are aliased onto the real ID on the first `logIn`, so letting users buy before signing in loses nothing. In webhooks `original_app_user_id` is then the anonymous id and `app_user_id` the provided one.

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

- **`logOut` throws while anonymous** (`PlatformException`, `PurchasesErrorCode.logOutWithAnonymousUserError`). Guard it: `Purchases.isAnonymous` (a `Future<bool>`) exists, and the skill's code checks the `originalAppUserId` prefix. `logOut` generates a new anonymous ID and clears the customer-info cache.

```dart
Future<void> signOutRevenueCat() async {
  final info = await Purchases.getCustomerInfo();
  // Anonymous IDs always start with $RCAnonymousID:
  if (info.originalAppUserId.startsWith(r'$RCAnonymousID:')) return;

  try {
    await Purchases.logOut();
  } on PlatformException {
    // Log; usually safe to ignore during sign-out.
  }
}
```

- **Account switching: the sources disagree.** The RevenueCat identify-user skill says `logOut()` first, then `logIn(newId)`, because a second `logIn` would alias the two IDs together. The docs say to call `logIn` directly with no `logOut`, and their alias table says a logIn from a non-anonymous ID never merges. The listener below follows the skill. Confirm in https://www.revenuecat.com/docs/customers/identifying-customers.md.
- **Custom-IDs-only apps.** If every user has an account, identify before configuring, configure only with the custom ID, and never call `logOut`; on account switch call `logIn`. Otherwise a provided user's subscription may be transferred to an anonymous ID, recoverable only through restore on the original platform.
- **Configured with an `appUserID` up front,** you generally don't need `logIn` until that user signs out and back in as somebody else.
- **What `logIn` merges (docs alias table).** Anonymous to a new ID, or to an existing ID without an anonymous alias: merged. Anonymous to an existing ID that already has an anonymous alias, or any non-anonymous ID to any ID: the current ID is logged out, the provided one logged in, no merge or purchase transfer. After a merge only one ID stays in `original_app_user_id` (webhooks list the others in `aliases`), and any merged ID returns the same CustomerInfo, history and attributes.
- **Custom IDs are cross-platform.** The same ID on different platforms is the same user with shared entitlements, but a user can only manage a subscription on the platform it was purchased from.

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
        await signOutRevenueCat();
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

- **What restore does.** It attaches the current store receipt to the current RevenueCat user; it never switches identities. Whether it transfers access from another App User ID is the project's restore behavior setting (default: transfer), described in [CONCEPTS.md](CONCEPTS.md).
- **Consumables and non-renewing subscriptions** can only be restored with custom App User IDs.
- **Consumed one-time products on Android.** Google Billing Client 8 removed querying consumed one-time purchases (purchases-flutter 9.0.0+), and 10.0.0 removed RevenueCat's workaround: without a login system, configure each one-time product correctly as consumable or non-consumable, or customers can't restore them from 10.0.0 on. Mitigation for anonymous apps: back up RevenueCat's SharedPreferences file (`RevenueCatBackupAgent.REVENUECAT_PREFS_FILE_NAME`) with Auto Backup, or set `android:backupAgent="com.revenuecat.purchases.backup.RevenueCatBackupAgent"` on `<application>` (this disables Auto Backup).

## Flutter Web

- **Same billing engines as the Web SDK:** RevenueCat Billing, Stripe Billing, Paddle Billing, configured with the web config's public API key.
- **Limitations.** `presentPaywall` is not yet supported on web; `getProducts`, `purchaseProduct` and `restorePurchases` don't work on web. Use the same `appUserID` across web and mobile; web products are configured separately, entitlements are shared.

## Customer attributes

- **Set** with `Purchases.setAttributes({ "age" : "24", "custom_group_id" : "abc123" });`; clear one by passing `null` or an empty string (`Purchases.setAttributes({"age" : ""});`).
- **Limits.** Up to 50 custom attributes per subscriber; keys up to 40 characters, starting with a letter, letters, numbers, `-` and `_` only, no whitespace; values up to 500 characters. Keys starting with `$` are reserved.
- **Reserved keys** (e.g. `$displayName`, `$email`, `$phoneNumber`, `$fcmTokens`, `$posthogUserId`, `$mixpanelDistinctId`, `$amplitudeUserId`, `$onesignalId`, attribution keys such as `$mediaSource` and `$campaign`) can be set by key or with helpers: `Purchases.setEmail("test@example.com")`, `Purchases.setPhoneNumber("+16505551234")`, `Purchases.setDisplayName("John Appleseed")`. Device identifiers and attribution data can't be changed once set.
- **Sync timing.** Attributes reach RevenueCat only when `Purchases.configure()` runs, the app is backgrounded, or a purchase is made or restored. Call `syncAttributesAndOfferingsIfNeeded()` to sync immediately; it is needed when Targeting uses custom attributes and also refreshes the cached Offering.
- **Write-only and not secure storage.** The SDK can't read attributes back (use the REST API with a secret key, webhooks' `subscriber_attributes`, integrations or exports), and anyone with the public key can write them, so never keep subscription status or balances in them.

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
