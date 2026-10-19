# React Native and Expo (react-native-purchases)

`react-native-purchases` links native StoreKit and Google Play Billing code into a React Native or Expo app. Most outcomes come down to three things: the app runs in a build that contains the native code (a development build under Expo, never Expo Go for real purchases); `Purchases.configure` runs once with the right public key for the platform; and access is decided by an entitlement identifier in `customerInfo.entitlements.active`, kept current by a listener, never by product IDs. Entitlements, offerings and packages are explained in [CONCEPTS.md](CONCEPTS.md); store consoles in [STORE-SETUP.md](STORE-SETUP.md); paywalls in [PAYWALLS.md](PAYWALLS.md), subscriber management in [CUSTOMER-CENTER.md](CUSTOMER-CENTER.md); sandbox and Test Store in [TESTING.md](TESTING.md); errors in [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

**Contents:** [Install (bare React Native)](#install-bare-react-native) · [Install (Expo)](#install-expo) · [Configure](#configure) · [Identify users](#identify-users) · [Customer info and entitlement gates](#customer-info-and-entitlement-gates) · [Offerings and packages](#offerings-and-packages) · [Purchase flow](#purchase-flow) · [Restore](#restore) · [React Native Web](#react-native-web) · [Customer attributes](#customer-attributes) · [Versions and breaking changes](#versions-and-breaking-changes) · [Prove it](#prove-it)

## Install (bare React Native)

- **Prerequisite: React Native 0.73 or later;** on Android, Kotlin 1.8.0 or later.
- **Add the packages.** `react-native-purchases-ui` is only needed for RevenueCat Paywalls and Customer Center. npm resolves the latest version at install time (no pin needed; check `package.json` afterwards). Releases: https://github.com/RevenueCat/react-native-purchases/releases. SDK reference: https://revenuecat.github.io/react-native-purchases-docs/.

```bash
npm install react-native-purchases
# npm install react-native-purchases-ui # optional, for native paywalls
cd ios && pod install && cd ..
```

- **Linking.** Both packages autolink; CocoaPods installs automatically on first run. `react-native link react-native-purchases` is only for legacy projects before 0.60 (the command was removed in 0.69).
- **Xcode 27.** Add the `post_install` hook from https://www.revenuecat.com/docs/known-store-issues/xcode-27/cocoapods-deployment-target-error.md to `ios/Podfile`.
- **Deployment targets.** iOS 13+, Android minSdk 21 for the base SDK (the 10.0.0 release, 2026-04-15, raised the Android minimum to API 23; confirm in the current release notes). `react-native-purchases-ui` needs iOS 15+ and Android minSdk 24 (see [PAYWALLS.md](PAYWALLS.md)).
- **Android `launchMode`.** New React Native projects set the main Activity's `launchMode` to `singleTask`, which can cancel purchases when the app is backgrounded mid-purchase. Set it to `standard` or `singleTop` in `android/app/src/main/AndroidManifest.xml`:

```xml
<activity 
    android:name="com.your.Activity"
    android:launchMode="standard" />  <!-- or singleTop -->
```

- **R8 build failure with `react-native-purchases-ui`** (`Execution failed for task ':app:mergeExtDexDevDebug'`): add to the project-level `build.gradle`:

```gradle
buildscript {
    repositories {
        mavenCentral()
        maven {
            url = uri("https://storage.googleapis.com/r8-releases/raw")
        }
    }
    dependencies {
        classpath("com.android.tools:r8:8.1.44")
    }
}
```

- **Other stores.** Amazon: configure with `useAmazon: true` and the Amazon `.pem` key. Galaxy Store (SDK 10.3.0+): `npm install --save react-native-purchases-store-galaxy`, configure with `store: 'GALAXY'`; `galaxyBillingMode` defaults to `GALAXY_BILLING_MODE.PRODUCTION` (`TEST` and `ALWAYS_FAIL` for testing); Galaxy test purchases need a physical Galaxy device. Vega OS is not supported.

## Install (Expo)

- **A development build is required.** `react-native-purchases` links native code, so it needs an Expo development build:

```bash
npx expo install expo-dev-client
npx expo install react-native-purchases react-native-purchases-ui
```

- **Rebuild after installing.** After installing the SDKs you must run the full build; hot reloading without building fails with errors such as `Invariant Violation: new NativeEventEmitter() requires a non-null argument`.
- **Make the dev client** with `npx expo prebuild` or `eas build --profile development`, and run it with `npx expo start --dev-client`.
- **EAS.** `npm install -g eas-cli`, `eas login`, `eas init`, `eas build:configure`. iOS simulator profile in `eas.json`:

```json
"ios-simulator": {
  "extends": "development",
  "ios": {
    "simulator": true
  }
}
```

  Then `eas build --platform ios --profile ios-simulator` and `npx expo start`. Android: `eas build --platform android --profile development` with `developmentClient: true`. The bundle ID / application ID must match the RevenueCat app config and the store console.
- **Expo Go: the sources differ.** The RevenueCat agent skills say the SDK does not work in Expo Go and that purchase, `logIn` and entitlement calls throw there. The docs and README say `react-native-purchases` has a built-in **Preview API Mode** that detects Expo Go and replaces native calls with JavaScript mocks, so the app runs but real purchases don't. Either way, test purchases only in a development build; confirm current behavior in https://www.revenuecat.com/docs/getting-started/installation/expo.md.
- **Xcode 27 on Expo SDK 56 or earlier.** Add the same `post_install` hook to the `Podfile` with a config plugin.

## Configure

- **Once, when the app mounts.** Call `Purchases.configure(...)` exactly once, as early as possible (in `App.tsx` or `index.js`); later calls no-op or warn. In React Native it is synchronous and starts async initialization internally, so `getOfferings()` can be called right after without awaiting.
- **Public SDK keys only, one per platform.** Keys are under **Project Settings > API keys > App specific keys**: iOS `appl_`, Android `goog_`, Amazon `amzn_`. Branch on `Platform.OS`. Never put a secret key (`sk_`) in the app. Keep keys out of source control in `.env`.
- **Debug logs first.** Set the log level before configuring; remove debug logging for release. The integration skill and configuring page use `Purchases.setLogLevel(LOG_LEVEL.DEBUG)` / `Purchases.LOG_LEVEL.DEBUG`; the quickstart and Expo pages use `LOG_LEVEL.VERBOSE`.

```tsx
import { useEffect } from 'react';
import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

export default function App() {
  useEffect(() => {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG); // remove for release

    const apiKey = Platform.OS === 'ios'
      ? 'appl_YOUR_IOS_PUBLIC_SDK_KEY'
      : 'goog_YOUR_ANDROID_PUBLIC_SDK_KEY';

    Purchases.configure({ apiKey });
  }, []);

  return /* … your UI … */;
}
```

- **Other branches.** Web: `Purchases.configure({ apiKey: <public_web_billing_api_key> })` when `Platform.OS === 'web'`. Amazon: `Purchases.configure({ apiKey: <public_amazon_api_key>, useAmazon: true })`. Galaxy: `Purchases.configure({ apiKey: <public_galaxy_api_key>, store: 'GALAXY', galaxyBillingMode: GALAXY_BILLING_MODE.TEST })` with `GALAXY_BILLING_MODE` imported from `react-native-purchases-store-galaxy`. The configuring page's version, with every branch:

```jsx
import { Platform, useEffect } from 'react-native';
import Purchases from 'react-native-purchases';
import { GALAXY_BILLING_MODE } from 'react-native-purchases-store-galaxy';

//...

export default function App() {

  useEffect(() => {
    Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);

    if (Platform.OS === 'web') {
      // Only needed if you're targeting web
      Purchases.configure({ apiKey: <public_web_billing_api_key> });
    } else if (Platform.OS === 'ios') {
      Purchases.configure({ apiKey: <public_apple_api_key> });
    } else if (Platform.OS === 'android') {
      Purchases.configure({ apiKey: <public_google_api_key> });

      // OR: if building for Amazon, be sure to follow the installation instructions then:
      Purchases.configure({ apiKey: <public_amazon_api_key>, useAmazon: true });

      // OR: if building for Galaxy Store, install react-native-purchases-store-galaxy, then:
      Purchases.configure({
        apiKey: <public_galaxy_api_key>,
        store: 'GALAXY',
        galaxyBillingMode: GALAXY_BILLING_MODE.TEST,
      });
    }

  }, []);
}
```

- **Configuration options.** `apiKey` (required); `appUserID` (optional, `null` for anonymous; see below); Purchases Completed By (only if you have your own purchase code, see [MIGRATION.md](MIGRATION.md#adoption-observer-mode)); `preferredUILocaleOverride: 'es-ES'` for paywall locale (or later `await Purchases.overridePreferredLocale('de-DE');`).
- **Test Store key.** The Test Store has its own key. In release builds the SDK crashes on purpose when it finds a Test Store key, and the React Native SDK does not expose the opt-out. Never submit an app with a Test Store key: Test Store key for debug, platform key for release (Test Store needs SDK 9.5.4+; details in [TESTING.md](TESTING.md)).
- **Blocked regions (mainland China, Russia, Myanmar).** Before configuring: `await Purchases.setProxyURL("https://api.rc-backup.com/");`.
- **Check the banner in native logs.** iOS Xcode console: `[Purchases] - INFO: Purchases is configured`; Android logcat tag `Purchases`: `[Purchases] - INFO: Purchases is configured`. Metro's JS console does not show native SDK logs; use the platform logs. A wrong API key surfaces as an auth error as soon as the app fetches offerings.

## Identify users

Read the shared [App User ID and alias contract](IDENTITY.md#app-user-ids) before this platform adapter.

- **Login result:** `Purchases.logIn(appUserID)` resolves to `{ customerInfo, created }`. Follow the [shared identity contract](IDENTITY.md#login-switching-and-aliases) for authentication timing and alias behavior.

```ts
import Purchases from 'react-native-purchases';

export async function syncRevenueCat(appUserID: string): Promise<void> {
  try {
    const { customerInfo, created } = await Purchases.logIn(appUserID);
    // customerInfo is the current entitlement state for this user.
    // created is true the first time this appUserID reaches RevenueCat.
  } catch (e) {
    console.warn('RevenueCat logIn failed', e);
  }
}
```

- **`logOut` throws while anonymous** (`PURCHASES_ERROR_CODE.LOG_OUT_ANONYMOUS_USER_ERROR`); guard with `Purchases.isAnonymous()`, which reads the current identity. The old source inspected `originalAppUserId`, which can remain anonymous after a merge into a custom ID and is not current-identity evidence. `logOut()` creates a new anonymous ID. [https://www.revenuecat.com/docs/customers/identifying-customers; https://github.com/RevenueCat/react-native-purchases/blob/main/src/purchases.ts]

```ts
export async function signOutRevenueCat(): Promise<void> {
  if (await Purchases.isAnonymous()) return;

  try {
    await Purchases.logOut();
  } catch (e) {
    console.warn('RevenueCat logOut failed', e);
  }
}
```

- **Account switching:** follow the shared [login and alias rules](IDENTITY.md#login-switching-and-aliases); the adapter below switches known IDs with `logIn` directly.

```tsx
import { useEffect, useRef } from 'react';
import { syncRevenueCat, signOutRevenueCat } from './revenuecatIdentity';

export function useRevenueCatIdentity(currentUserID: string | null) {
  const previous = useRef<string | null>(null);

  useEffect(() => {
    const prev = previous.current;
    previous.current = currentUserID;

    (async () => {
      if (prev == null && currentUserID != null) {
        await syncRevenueCat(currentUserID);
      } else if (prev != null && currentUserID == null) {
        await signOutRevenueCat();
      } else if (prev != null && currentUserID != null && prev !== currentUserID) {
        await syncRevenueCat(currentUserID);
      }
    })();
  }, [currentUserID]);
}
```

```tsx
function Root() {
  const currentUserID = useCurrentUserID(); // from your auth library
  useRevenueCatIdentity(currentUserID);
  return <AppNavigator />;
}
```

- **Show the App User ID** in settings for support.
- **Restore is not login.** On a new device, `logIn(appUserID)` first, then `restorePurchases()` only if the user expects to pull a receipt from the current store account.
- **Configure first.** `logIn` and `logOut` throw if `Purchases.configure` has not run.

## Customer info and entitlement gates

- **Gate on the entitlement identifier** (e.g. `"premium"`), never on a product ID. It is case sensitive; a typo silently gates everyone out.
- **`customerInfo.entitlements.active` is the source of truth.** Presence means access now; expired subscriptions stay in `entitlements.all` but drop out of `active`. Any active entitlement: `Object.entries(customerInfo.entitlements.active).length`.
- **Check when deciding which UI to show,** typically at launch, before presenting a paywall, and whenever premium content opens. `getCustomerInfo` is safe to call repeatedly: it usually returns the cache, refreshed when older than 5 minutes only when you call it, purchase or restore. Don't poll in a loop.

```ts
import Purchases from 'react-native-purchases';

export async function hasPremium(): Promise<boolean> {
  try {
    const info = await Purchases.getCustomerInfo();
    return info.entitlements.active['premium'] !== undefined;
  } catch (e) {
    // Network or auth error. Treat as "no access" and log for diagnostics.
    console.warn('RevenueCat getCustomerInfo failed', e);
    return false;
  }
}
```

- **Fetch once, then subscribe.** `Purchases.addCustomerInfoUpdateListener` fires on every change received on this device (purchase, restore, renewal, expiration). RevenueCat does not push updates; they arrive only when the SDK makes a network request. Always `removeCustomerInfoUpdateListener` (returns `boolean`) on unmount, or listeners accumulate across navigation.

```tsx
import { useEffect, useState } from 'react';
import Purchases, { CustomerInfo } from 'react-native-purchases';

export function useHasPremium(entitlementId = 'premium'): boolean {
  const [hasPremium, setHasPremium] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const apply = (info: CustomerInfo) => {
      if (cancelled) return;
      setHasPremium(info.entitlements.active[entitlementId] !== undefined);
    };

    const listener = (info: CustomerInfo) => apply(info);
    Purchases.addCustomerInfoUpdateListener(listener);

    // Seed initial value.
    Purchases.getCustomerInfo().then(apply).catch(() => {/* ignore */});

    return () => {
      cancelled = true;
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [entitlementId]);

  return hasPremium;
}
```

```tsx
function RootScreen() {
  const hasPremium = useHasPremium();
  return hasPremium ? <PremiumScreen /> : <PaywallScreen />;
}
```

- **Empty is normal before any purchase.** CustomerInfo has no entitlements until a purchase is made or transactions are synced.
- **Cache timings.** Refresh after 5 minutes in the foreground, 25 hours in the background, and after a purchase or restore. Customer info persists between launches; an entitlement active when the user went offline stays active for up to three days. `invalidateCustomerInfoCache(): Promise<void>` forces a refetch when info changed externally (for example a dashboard grant); misused, it can leave the app stale.

## Offerings and packages

- **Use the `current` offering,** never hard-coded identifiers; targeting and experiments can change it per user. If `current` is null, no packages are live for this user.

```ts
import Purchases, { PurchasesPackage } from 'react-native-purchases';

export async function currentPackages(): Promise<PurchasesPackage[]> {
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages ?? [];
}
```

- **Package access.** `.availablePackages`, `.monthly` (and the other duration types); the product is `pkg.product`, price text `pkg.product.priceString`. An offering by identifier: `offerings.all["experiment_group"]`. Placements: `await Purchases.getCurrentOfferingForPlacement(inputValue)`.
- **Offerings don't persist between launches;** cache them yourself to show them offline.
- **Empty offerings** usually mean a store configuration mismatch: see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

## Purchase flow

Use this only for a custom paywall. A RevenueCat Paywall runs the purchase itself ([PAYWALLS.md](PAYWALLS.md)); settle which one the app uses before writing paywall code.

- **Flow.** `getOfferings()`, pick a package from the current offering, `Purchases.purchasePackage(pkg)`; it resolves with a `customerInfo` that already reflects the purchase. Products directly: `Purchases.purchaseStoreProduct(product)` with `getProducts` (Android one-time products: `Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION`).
- **Cancellation is not an error.** The SDK sets `error.userCancelled = (error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR)` in the reject path, so `e.userCancelled === true` is safe on iOS and Android (there is still an error object). Return silently, no alert.
- **Message only what the user can act on:** payment declined, network errors, store unavailable, receipt already in use. Log the rest and let the user retry. Never silently succeed when the purchase failed.
- **Don't unlock inside the purchase callback.** Let the customer-info listener flip the gated UI.

```ts
import Purchases, { PurchasesPackage } from 'react-native-purchases';

export type PurchaseOutcome =
  | { kind: 'purchased' }
  | { kind: 'cancelled' }
  | { kind: 'failed'; error: unknown };

export async function buy(pkg: PurchasesPackage): Promise<PurchaseOutcome> {
  try {
    await Purchases.purchasePackage(pkg);
    // Do not unlock content here. A CustomerInfoUpdateListener flips the
    // gated UI (see revenuecat-entitlements-gate).
    return { kind: 'purchased' };
  } catch (e: any) {
    if (e?.userCancelled === true) return { kind: 'cancelled' };
    return { kind: 'failed', error: e };
  }
}
```

- **The docs' purchase snippet** checks the entitlement on the returned `customerInfo` and unlocks there; the purchase-flow skill says not to unlock inside the purchase callback and to let the listener flip the UI (as `buy` above does):

```jsx
// Using Offerings/Packages
try {
  const { customerInfo } = await Purchases.purchasePackage(package);
  if (
    typeof customerInfo.entitlements.active["my_entitlement_identifier"] !==
    "undefined"
  ) {
    // Unlock that great "pro" content
  }
} catch (e) {
  if (!e.userCancelled) {
    showError(e);
  }
}
```

- **One purchase at a time.** StoreKit and Play Billing queue duplicate calls; disable buy buttons while a purchase is in flight.

```tsx
import React, { useState } from 'react';
import { Alert, Button } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { buy } from './buy';

export function BuyButton({ package: pkg }: { package: PurchasesPackage }) {
  const [isBuying, setIsBuying] = useState(false);

  const onPress = async () => {
    setIsBuying(true);
    const outcome = await buy(pkg);
    setIsBuying(false);
    if (outcome.kind === 'failed') {
      Alert.alert('Purchase failed', String((outcome.error as any)?.message ?? outcome.error));
    }
  };

  return (
    <Button
      disabled={isBuying}
      title={pkg.product.priceString}
      onPress={onPress}
    />
  );
}
```

- **Transactions are finished for you** (iOS finish, Android acknowledge and consume) unless you tell the SDK your app completes them.

## Restore

- **A visible button, triggered only by the user.** Put "Restore purchases" on the paywall and/or in settings; iOS legally requires one. Never call `restorePurchases` programmatically: it may trigger OS sign-in prompts. For programmatic sync (typically migrations) use `Purchases.syncPurchasesForResult()` (`const { customerInfo } = await Purchases.syncPurchasesForResult();`), which shows no prompts but can transfer or alias an anonymous user.

```ts
export async function restore(): Promise<boolean> {
  try {
    await Purchases.restorePurchases();
    return true;
  } catch {
    return false;
  }
}
```

- **What restore does.** It attaches the current store receipt to the current RevenueCat user; it never switches identities. Whether it transfers access from another App User ID is the project's restore behavior setting (default: transfer), described in [IDENTITY.md](IDENTITY.md#restore-behavior).
- **Consumables and non-renewing subscriptions** can only be restored with custom App User IDs.
- **Consumed one-time products on Android.** Google Billing Client 8 removed querying consumed one-time purchases (react-native-purchases 9.0.0+), and 10.0.0 removed RevenueCat's workaround: without a login system, configure each one-time product correctly as consumable or non-consumable, or customers can't restore them from 10.0.0 on. Mitigation: back up RevenueCat's SharedPreferences file (`RevenueCatBackupAgent.REVENUECAT_PREFS_FILE_NAME`) with Auto Backup, or `android:backupAgent="com.revenuecat.purchases.backup.RevenueCatBackupAgent"` on `<application>` (disables Auto Backup).

## React Native Web

- **Requires RevenueCat Billing.** `getProducts`, `purchaseProduct` and `restorePurchases` don't work on web. Use the same App User ID across web and mobile.

## Customer attributes

The shared [attribute contract and setter calls](IDENTITY.md#customer-attributes) own limits, reserved keys, sync timing and write-only security.

## Versions and breaking changes

| Version | Date | Change |
|---|---|---|
| 10.0.0 | 2026-04-15 | Billing Library 8.3.0; Android minimum API 23 (was 21); consumed one-time product restore workaround removed |
| 9.0.0 | 2025-07-18 | Billing Library 8; own-IAP-code mode (previously Observer Mode) still supported; Kotlin 2.0.21, min Kotlin 1.8.0; web target with hard-coded fakes |
| 8.0.0 | 2024-08-01 | You must configure the In-App Purchase Key (iOS purchases fail without it); guide `migrations/v8-MIGRATION.md` |
| 7.0.0 | 2023-10-05 | Release date recorded only; the docs list 8.0.0+ as requiring the In-App Purchase Key |

- Latest at research time: react-native-purchases 10.14.0 (2026-10-15). Always check the releases page.

## Prove it

1. The app builds (`npx react-native run-ios`, or an Expo development build run with `npx expo start --dev-client`), and the native log (Xcode console or logcat tag `Purchases`) shows `Purchases is configured`, with no auth error when offerings load.
2. Under Expo, purchases are tested in a development build, not Expo Go.
3. `await Purchases.getOfferings()` returns a non-null `current` with packages; prices come from `pkg.product.priceString`.
4. The entitlement identifier in code matches the dashboard exactly; an entitled user sees the feature, others don't.
5. A sandbox purchase (or a manual dashboard grant) flips the gated UI without a restart; cancelling the store sheet shows no alert and clears the loading state.
6. Buying an already active subscription is handled without a crash (StoreKit and Play Billing surface a `productAlreadyPurchased` / `receiptAlreadyInUse` path); the buy button is disabled while in flight.
7. On a fresh install signed into the same store account, Restore brings back the entitlement and the UI.
8. After sign-in the dashboard Customer page shows your backend's ID, not `$RCAnonymousID:`; after sign-out the ID is anonymous again; `logOut` while anonymous neither crashes nor silently succeeds.
9. The Android main Activity's `launchMode` is `standard` or `singleTop`; release builds use the platform key, never the Test Store key.
