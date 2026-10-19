# Customer Center

Customer Center is a self-service screen where customers cancel, restore, contact support, open links or deep links, request refunds (iOS only), change plans (iOS only) and see in-app currency balances; developers can require app updates, collect cancellation reasons and offer promotional offers. It is available on the Pro and Enterprise plans. Paywalls are for new purchases; Customer Center is for existing subscribers, typically behind a "Manage subscription" row in settings.

The RevenueCat Customer Center documentation and customer-center skill supply the requirements, dashboard behavior and SDK examples below. Initial-purchase UI is in [PAYWALLS.md](PAYWALLS.md). [RevenueCat docs and customer-center skill]

## Requirements

- **Minimums:** `purchases_ui_flutter` 8.6.0+, `react-native-purchases-ui` 8.7.0+. Platforms iOS 15.0+, Mac Catalyst 15.0+, Android 7.0 (API 24); not macOS, tvOS, watchOS, visionOS. Android minSdk: the customer-center skill says 21 for `purchases_ui_flutter` and 24 for `react-native-purchases-ui`; the docs say API 24. It ships in the same UI packages as paywalls (Flutter: iOS 15 Podfile target, Jetpack Compose on Android; React Native: iOS 15+, Android minSdk 24, no Expo Go). [RevenueCat docs and customer-center skill]
- **Configure it in the dashboard first:** Project Settings > Monetization Tools > **Customer Center** (actions, copy, promotional offers, refund flows, cancel survey, support contact). Without configuration users see a minimal default layout with almost nothing useful.
- **Identify the user first.** It needs an identified user with purchases; an anonymous user with none sees an empty or restore-only screen. Call `Purchases.logIn(userId)` before opening it if the app has accounts.

## Dashboard configuration

- **Default options:** Cancellation, Missing Purchases, Refund Request (iOS), Plan Changes (iOS). The default cancellation survey offers "Too expensive", "Don't use the app", "Bought by mistake"; the first two get `Cancellation Retention Discount`, Refund Request gets `Refunds Retention Discount`. [RevenueCat docs and customer-center skill]
- **Promotional offers.** Store promo offer IDs are added per product under Lifecycle > Retention, Customer Center tab; without a matching offer ID the survey is bypassed. Hybrid apps must configure promotional offers in both Google Play Console and App Store Connect. Offer eligibility conditions: First Seen; Time Since First Purchase (a free-trial start does not count), "More than" / "Less than".
- **Screens** exist for users with and without an active subscription. Management options: Missing Purchase, Refund Request (hidden if not App Store, nothing paid, free trial, outside the refund window, or Family Sharing), Change Plans (hidden if not App Store, not auto-renewing, lifetime, expired, or Family Sharing), Cancel, Custom URL, Custom Action.
- **Support.** A support email (Lifecycle > Support) is optional; Contact Support shows by default to "Customers without an active subscription". In-app support tickets need RevenueCatUI iOS 5.49.0+ / Android 9.15.0+; metadata (App User ID, active entitlements, IP, total spent and more) appears in the email footer, so remove the quoted metadata before replying.
- **Other:** update warning (iOS 5.14.0+, not Android), purchase history link (iOS 5.15.1+, not Android), in-app currencies (iOS 5.32.0+, Android 9.7.0). Colors apply mainly to promo offer views, except the accent color. Localized in 32 languages.

## Behavior

- **The UI owns the flow** (restore, cancel, refund, promotional offers). Use the callbacks to react, not to drive. Don't call `Purchases.restorePurchases()` while it is on screen. [RevenueCat docs and customer-center skill]
- **Android differences.** Refund requests are iOS only (only Apple exposes in-app refund requests), so `onRefundRequestStarted` / `onRefundRequestCompleted` never fire on Android; "Manage subscription" deep links to Google Play's subscriptions screen. `shouldShowCloseButton` only affects iOS; Android always shows a close button. The iOS refund flow only runs when the dashboard has the refund action enabled and the transaction is eligible.
- **SDK too old?** Build a fallback screen: active entitlements from customer info, a `Purchases.restorePurchases()` button, and a link to the store's subscription management (Android: `https://play.google.com/store/account/subscriptions`), and point the user to upgrade the SDK.

## Flutter

- **Imperative for a "Manage subscription" button** (`RevenueCatUI.presentCustomerCenter(...)`, all callbacks optional; `await RevenueCatUI.presentCustomerCenter();` is the minimal call), `CustomerCenterView` to embed in a route. [RevenueCat docs and customer-center skill]

```dart
import 'package:purchases_flutter/purchases_flutter.dart';
import 'package:purchases_ui_flutter/purchases_ui_flutter.dart';

Future<void> openCustomerCenter() async {
  await RevenueCatUI.presentCustomerCenter(
    onRestoreCompleted: (customerInfo) {
      // refresh app state
    },
    onShowingManageSubscriptions: () {
      // user navigated into the manage-subscription flow
    },
    onManagementOptionSelected: (optionId, url) {
      // optionId is one of: 'cancel', 'custom_url', 'missing_purchase', 'refund_request', 'change_plans', …
    },
    onPromotionalOfferSucceeded: (customerInfo, transaction, offerId) {
      // promo offer accepted
    },
  );
}
```

- **Embedded view.** `CustomerCenterView` embeds a native platform view: put it inside a constrained container (`Scaffold`, `SizedBox` or `Expanded`), never with zero height.

```dart
import 'package:flutter/material.dart';
import 'package:purchases_ui_flutter/purchases_ui_flutter.dart';

class SubscriptionSettingsPage extends StatelessWidget {
  const SubscriptionSettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomerCenterView(
        shouldShowCloseButton: false, // rely on the app bar back button
        onDismiss: () => Navigator.of(context).pop(),
        onRestoreCompleted: (customerInfo) {
          // refresh app state
        },
        onManagementOptionSelected: (optionId, url) {
          // react to cancel / change plan / custom url
        },
      ),
    );
  }
}
```

## React Native

- **Callbacks** (all optional; the promise resolves when the Customer Center is dismissed): `onFeedbackSurveyCompleted`, `onShowingManageSubscriptions`, `onRestoreStarted`, `onRestoreCompleted`, `onRestoreFailed`, `onRefundRequestStarted` (iOS), `onRefundRequestCompleted` (iOS, `REFUND_REQUEST_STATUS`), `onManagementOptionSelected` (`CustomerCenterManagementOptionEvent`; `url` only for `custom_url`), `onPromotionalOfferSucceeded`. The docs import types with `import { CustomerInfo, PurchasesError, REFUND_REQUEST_STATUS, CustomerCenterManagementOptionEvent } from 'react-native-purchases';`. Import style differs: the docs' Customer Center page uses a named import, `import { RevenueCatUI } from 'react-native-purchases-ui';`, while the skills and the docs' paywall page use the default import `import RevenueCatUI from 'react-native-purchases-ui';`. [RevenueCat docs and customer-center skill]

```tsx
import RevenueCatUI from 'react-native-purchases-ui';

async function openCustomerCenter() {
  await RevenueCatUI.presentCustomerCenter({
    callbacks: {
      onRestoreCompleted: ({ customerInfo }) => {
        // refresh app state
      },
      onShowingManageSubscriptions: () => {
        // user navigated into the manage-subscription flow
      },
      onManagementOptionSelected: (event) => {
        // event.option is 'cancel' | 'custom_url' | 'missing_purchase' | 'refund_request' | 'change_plans' | ...
        // event.url is the custom URL for 'custom_url', null otherwise
      },
      onPromotionalOfferSucceeded: ({ customerInfo, transaction, offerId }) => {
        // promo offer accepted
      },
    },
  });
}
```

- **Embedded view.** A native view host: wrap it in `<View style={{ flex: 1 }} />` or give it an explicit height; zero size renders blank.

```tsx
import { View } from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';

export function SubscriptionSettingsScreen({ navigation }) {
  return (
    <View style={{ flex: 1 }}>
      <RevenueCatUI.CustomerCenterView
        shouldShowCloseButton={false}
        onDismiss={() => navigation.goBack()}
        onRestoreCompleted={({ customerInfo }) => {
          // refresh app state
        }}
        onManagementOptionSelected={(event) => {
          // react to cancel / change_plans / custom_url
        }}
      />
    </View>
  );
}
```

## Prove it

- A test user with an active sandbox subscription sees it in Customer Center; Restore fires restore-completed with non-empty `entitlements.active`; configured Cancel, Refund and Support actions fire `onManagementOptionSelected`, `onRefundRequestStarted` and the rest; the manage action opens the iOS manage-subscriptions sheet or Google Play's subscriptions screen; dismiss fires `onDismiss`. [RevenueCat docs and customer-center skill]
- An empty Customer Center for a user with purchases means the signed-in App User ID doesn't own the transactions or the dashboard section isn't configured.
