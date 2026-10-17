# Billing and recovery

What happens to a subscription after the first purchase: failed renewals, cancellations, pauses, refunds, plan changes, win-back, Google Play's alternative billing programs, and selling on the web with RevenueCat's web billing. The mechanism that decides most outcomes: the store owns the money and the state, RevenueCat turns every state change into `CustomerInfo` fields and webhook events, and access is read from the entitlement's `isActive` (or v2 `gives_access`), never computed from dates. The webhook side of each flow is in [BACKEND-AND-WEBHOOKS.md](BACKEND-AND-WEBHOOKS.md); SDK syntax is in [FLUTTER.md](FLUTTER.md) and [REACT-NATIVE.md](REACT-NATIVE.md); entitlements and offerings are in [CONCEPTS.md](CONCEPTS.md); Stripe itself is [../stripe/SKILL.md](../stripe/SKILL.md).

**Contents:** [Read state, don't compute it](#read-state-dont-compute-it) · [Billing issues and grace periods](#billing-issues-and-grace-periods) · [Cancellations](#cancellations) · [Pauses](#pauses) · [Win-back and retention](#win-back-and-retention) · [Refunds](#refunds) · [Refund Control](#refund-control) · [Upgrades, downgrades and crossgrades](#upgrades-downgrades-and-crossgrades) · [Google Play alternative billing](#google-play-alternative-billing) · [RevenueCat Web: pick a billing engine](#revenuecat-web-pick-a-billing-engine) · [RevenueCat Billing](#revenuecat-billing) · [Web SDK](#web-sdk) · [Stripe Billing integration](#stripe-billing-integration) · [Redemption Links](#redemption-links) · [Testing web purchases](#testing-web-purchases) · [Prove it](#prove-it)

## Read state, don't compute it

| State | Signal in CustomerInfo | Notes |
|---|---|---|
| Active and renewing | `willRenew == true` | Normal state |
| Canceled, still has access | `unsubscribeDetectedAt != null` and `isActive == true` | Show "ends on [expirationDate]" |
| Grace period | `isActive == true` and `billingIssueDetectedAt != null` | Access retained while Google retries the card |
| Account hold | `isActive == false` and `billingIssueDetectedAt != null` | Access revoked until the payment method is fixed |
| Recovered | `billingIssueDetectedAt == null` | Nothing to show |
| Paused | `isActive == false` while the product is still owned | Resume date needs the REST API |

- **Do not compute access from `expirationDate`.** Read `isActive` and `willRenew`. Field names above are the Android SDK's; see [FLUTTER.md](FLUTTER.md) and [REACT-NATIVE.md](REACT-NATIVE.md).
- **Spelling conflict:** the cancellations skill writes `billingIssuesDetectedAt` (plural); the payment-recovery skill and the quick reference write `billingIssueDetectedAt`. Check your SDK's API reference.
- **Send users to fix or cancel through `managementURL`** from CustomerInfo. It is already a URI; do not re-parse it. Google requires apps to let customers cancel a subscription within the app.
- **Grace-period subscriptions count as active.**

## Billing issues and grace periods

- **The flow on Google Play:** a failed renewal enters a grace period (access kept while Google retries the card), then account hold (access revoked until the payment method is fixed). Both states land in `CustomerInfo` automatically, and Google's in-app message shows by default.
- **`billingIssueDetectedAt`** is non-null from the moment Google reports a billing problem until the user resolves it.
- **Where grace periods exist:** optional and customizable on App Store, Google Play, RevenueCat Billing, Stripe and Paddle; Amazon does not support them. iOS 16.4+ shows a system sheet to update payment.
- **Events:** only one `BILLING_ISSUE` per failure streak. Entering grace also sends cancellation events while access remains. Detect grace from the webhook's `grace_period_expiration_at_ms` (`BILLING_ISSUE` only) or `grace_period_expires_date` in `GET /subscriber` (null when not in grace; always null for Stripe).
- **Most apps need none of this code.** Pick by need:

| You want | Do |
|---|---|
| Google's default in-app message | Nothing; the SDK shows it when the billing client connects |
| Your own banner | Read `billingIssueDetectedAt` and branch on `isActive` |
| The message only on specific screens | Disable the automatic message and call `showInAppMessagesIfNeeded(activity)` yourself (Android) |
| A server-side flag (recovery email) | Handle the `BILLING_ISSUE` webhook; no app code |

- **UI branching order:** no entitlement or not active, the subscribe screen; billing issue and active, a grace-period warning; billing issue and not active, the account-hold screen; otherwise premium.
- **Stripe failed-payment settings** (Stripe **Settings > Billing > Subscriptions and email > Manage failed payments**):

| Stripe setting | RevenueCat result |
|---|---|
| Cancel (default) | Access revoked; `CANCELLATION` with `BILLING_ERROR` |
| Unpaid | Access revoked; zero-price `RENEWAL` events |
| Past-due | Access kept; zero-price `RENEWAL` events |

- **Paddle** events always show a 30-day `grace_period_end_time`.

## Cancellations

- **Detection:** within a few hours, near real time with platform server notifications.
- **`unsubscribeDetectedAt`** is set when RevenueCat receives Google's `SUBSCRIPTION_CANCELED` RTDN. `isActive` stays `true` until the billing period ends.
- **Who can cancel:** Apple, only the user, at least 24 hours before renewal. Google, developers can cancel through Play Console or the API; prepaid plans can't be cancelled. Stripe, through its dashboard or API. Amazon, developers can't cancel. RevenueCat Billing, `POST .../subscriptions/{id}/actions/cancel` in REST API v2 (access until period end).
- **Deleting a user from RevenueCat will not cancel their subscription.**
- **Resubscribe before expiry** fires Google's `SUBSCRIPTION_RESTARTED`; RevenueCat clears `unsubscribeDetectedAt` and sets `willRenew = true`, so just re-read customer info. Resubscribe after expiry: see the `RENEWAL` versus `INITIAL_PURCHASE` conflict in [BACKEND-AND-WEBHOOKS.md](BACKEND-AND-WEBHOOKS.md#rules-for-access-changes), and grant on both.
- **Deferral and revocation on Google Play** go through the Google Play Developer API from your backend (`purchases.subscriptionsv2.defer`, `purchases.subscriptionsv2.revoke`); RevenueCat processes the resulting RTDN and updates CustomerInfo. (The backend skill otherwise says not to call the Google Play Developer API from your backend unless you build a custom integration.)

## Pauses

- **RevenueCat resolves pause state** from the server-side subscription state; you don't query suspended subscriptions yourself.
- **The resume date is not in the SDK.** Fetch `/v1/subscribers/{app_user_id}` on your backend, read `paused_expiration_time_ms` on the subscription, and expose it to the client through your own endpoint.

```bash
curl -H "Authorization: Bearer $RC_SECRET_API_KEY" \
  https://api.revenuecat.com/v1/subscribers/$APP_USER_ID
```

- **Webhook:** the docs list `SUBSCRIPTION_PAUSED` (Google only, carries `auto_resume_at_ms`; do not revoke on it); the cancellations skill says there is no dedicated pause webhook. An Android pause revokes at term end, with `EXPIRATION` reason `SUBSCRIPTION_PAUSED`.

## Win-back and retention

- **Win-back campaigns need no SDK code.** Configure them in Play Console or the RevenueCat dashboard (`/projects/{projectId}/lifecycle/winback`; retention offers at `/lifecycle/retention`).
- **An accepted Play win-back offer** surfaces as a normal subscription.
- **Before they lapse:** with `willRenew == false` (or `unsubscribeDetectedAt` set) while access is still active, show a promotion before losing the user [ApparenceKit](https://apparencekit.dev/blog/apparencekit-4-update/); the Dart check is in [FLUTTER.md](FLUTTER.md#customer-info-and-entitlement-gates).
- **Segment win-back on the backend** with the `CANCELLATION` webhook's `cancel_reason`: `UNSUBSCRIBE`, `BILLING_ERROR`, `DEVELOPER_INITIATED`, `PRICE_INCREASE`.

## Refunds

- **CustomerInfo updates automatically** when RevenueCat detects a refund. The webhook is a `CANCELLATION` with `cancel_reason` `CUSTOMER_SUPPORT` and a negative `price`.

| Store | Refunds |
|---|---|
| Apple | Subscription refunds detected automatically. Developers can't issue refunds; direct customers to https://support.apple.com/118223. Non-subscription refunds need platform server notifications; consumable refunds are detected with the In-App Purchase Key. |
| Google Play | Refund active subscriptions and non-subscriptions from the RevenueCat dashboard (customer profile, Entitlements card, "...", **Refund**) or REST API v2; this immediately revokes and refunds the last purchase and expires the subscription. Refunds granted in Play Console can take up to 24 hours to be detected, must be "refund and revoke" to be detected, and refunds of unacknowledged purchases aren't detected. |
| Stripe | Detected automatically (needs Stripe server notifications); refunds after the billing cycle closed aren't picked up. |
| Amazon | Developers can't refund; refunds by Amazon support aren't detected. |
| RevenueCat Billing | Refund from the dashboard (expires the subscription immediately) or `POST .../subscriptions/{id}/actions/refund` (access lost immediately). |

- **For one-time purchases** platform server notifications are usually how RevenueCat learns of refunds (Stripe is the exception).

## Refund Control

- **Policies are project-level,** evaluated top to bottom; the first match decides the preference sent to Apple or Google; the default policy sits at the bottom. Each preference is used by only one policy.
- **Preferences:** **Prefer full refund**, **Prefer no refund**, **Send consumption data only**, **Do not respond to refund requests**. Use **Prefer no refund** for a targeted group. No partial refunds.
- **Data sent to Apple:** `customerConsented` `true`, `deliveryStatus` (`DELIVERED` or `UNDELIVERED_OTHER`), `sampleContentProvided` `true`, `refundPreference`. **To Google** (`orders.reviewrefund`): `pendingRefundToken`, `sampleContentProvided`, `refundPreference` `APPROVE`, `DECLINE` or `NEUTRAL`.
- **Legacy, Apple only:** the per-customer attribute `$appleRefundHandlingPreference` with `DO_NOT_HANDLE`, `GRANT_REFUND`, `DECLINE_REFUND`, `LET_APPLE_DECIDE`.
- **Apple notifications** (Version 2 recommended) improve Refund Control.

## Upgrades, downgrades and crossgrades

- **Developers cannot change a plan on the customer's behalf.**
- **App Store:** no code changes. Upgrades are immediate with a prorated refund; downgrades take effect at the next renewal; crossgrades are immediate if the duration matches, else at the next renewal. Upgrades during intro periods keep both products active.
- **Google Play:** RevenueCat Paywalls use the editor setting **Play Store only: Replacement mode**. Custom flows pass the old product ID and an optional replacement mode:

```dart
final productChangeInfo = StoreProductChangeInfo(
  "oldProductId",
  replacementMode: StoreReplacementMode.withoutProration,
);
final purchaseResult = await Purchases.purchase(
  PurchaseParams.storeProduct(
    newProduct,
    productChangeInfo: productChangeInfo,
  ),
);
```

```jsx
const productChangeInfo = {
  oldProductIdentifier: "oldProductId",
  replacementMode: Purchases.STORE_REPLACEMENT_MODE.WITHOUT_PRORATION,
};
const { customerInfo } = await Purchases.purchaseStoreProduct(
  newProduct,
  productChangeInfo,
);
```

| Replacement mode | Notes |
|---|---|
| `WITHOUT_PRORATION` | Default |
| `WITH_TIME_PRORATION` | |
| `CHARGE_FULL_PRICE` | |
| `CHARGE_PRORATED_PRICE` | Upgrades only |
| `DEFERRED` | Requires Google server notifications |

- **Amazon** doesn't support product changes.
- **RevenueCat Billing:** upgrade and downgrade paths live in the web Customer Portal; upgrades are immediate with a partial refund, downgrades at cycle end, not prorated.
- **`PRODUCT_CHANGE` is informative,** and its `expiration_at_ms` is for the old product. Event flows are in [BACKEND-AND-WEBHOOKS.md](BACKEND-AND-WEBHOOKS.md#event-flows).

## Google Play alternative billing

- **Programs:** User Choice Billing, Alternative Billing Only, External Offers and External Payment Links. Each has different Play requirements; Google gates them by country and app category. You enroll through Play Console, not through RevenueCat.
- **RevenueCat support is limited.** The skill says "as of SDK 9.x" in its body and "Android SDK 10.x" in its description; check the RevenueCat changelog for newer releases before you start.

| Option | Status |
|---|---|
| RevenueCat Web Billing via `Offering.webCheckoutURL` / `Package.webCheckoutURL` | Supported. Not a Google alternative billing program. |
| User Choice Billing, Alternative Billing Only, External Offers, External Payment Links | No dedicated SDK APIs. Implement with the Play Billing Library alongside RevenueCat. |

- **Don't conflate RevenueCat's web checkout with Google's alternative billing.** After a web purchase, users redeem it in the app through deep link handling ([Redemption Links](#redemption-links)).
- **Path A:** wait for SDK support (avoids raw Play Billing Library code next to RevenueCat). **Path B:** hand-roll it. The SDK owns the `BillingClient` instance, so raw `BillingClient` calls alongside it need care; set `purchasesAreCompletedBy(PurchasesAreCompletedBy.MY_APP)` so acknowledgement stays with your app for purchases you manage, while standard Play purchases stay with the SDK.

## RevenueCat Web: pick a billing engine

- **Engines:** RevenueCat Billing (Stripe as the payment gateway), Stripe Billing, or Paddle Billing (Paddle as merchant of record). **Integration paths:** Web Purchase Links, the Web SDK, Web Paywalls, Funnels, app-to-web purchases, Redemption Links.
- **Choose your path:** no other billing tool, RevenueCat Billing; keep an existing Stripe checkout and only sync, Stripe Billing plus Track External Purchases; Stripe as merchant of record, Stripe Managed Payments.
- **iOS links to the web:** an April 2025 U.S. District Court ruling lets iOS developers guide users to web payment flows without extra Apple fees. Only show links to web checkout in storefronts where you're eligible for alternative payments.

| | RevenueCat Billing | Stripe Billing | Paddle Billing |
|---|---|---|---|
| Merchant of record | You (Stripe gateway) | You by default, or Stripe with Managed Payments | Paddle |
| Products created in | RevenueCat | Imported from Stripe | Imported from Paddle |
| Taxes | Optional Stripe Tax or Avalara AvaTax | | |
| Customer management | RevenueCat Customer Portal | Stripe Customer Portal or a custom URL | Paddle URLs |
| Emails | RevenueCat | Stripe (except redemption emails) | Paddle |
| Testing | Stripe Test Mode or Sandboxes (Sandboxes recommended) | Stripe Test Mode or Sandboxes | Separate Paddle sandbox |
| Limits | No translated content in web purchase links; India not supported; no B2B | | One product per purchase |

## RevenueCat Billing

- **Formerly "Web Billing",** recommended for a deeper integration. RevenueCat doesn't store card data. The web config attaches an existing Stripe account or a **claimable sandbox**, which cannot take real payments until claimed (claim it before the deadline).
- **Connect Stripe:** only the RevenueCat project owner can connect. Install the RevenueCat Stripe App from the Stripe App Marketplace through account settings, **Connect Stripe account**, then **View Stripe app settings** and sign in with RevenueCat. Uninstalling the app revokes all permissions. Several Stripe accounts are possible.
- **Test mode or Sandboxes:** with test mode, one RevenueCat Billing config and Stripe test cards. With Sandboxes, install the app in each sandbox and create two RevenueCat Billing configs (production and sandbox). RevenueCat anticipates test mode will eventually be deprecated.
- **Webhook-only event:** `INVOICE_ISSUANCE` fires for RevenueCat Billing only; `metadata` on events is RevenueCat Billing only.

## Web SDK

- **Install:** `npm install --save @revenuecat/purchases-js`. With unpkg, use `Purchases.Purchases.configure()`.
- **Configure once:** `Purchases.configure({ apiKey: WEB_BILLING_PUBLIC_API_KEY, appUserId: appUserId })`. `Purchases.getSharedInstance()` throws if not configured.
- **Identity:** identify customers through shared auth such as Firebase, Supabase or auth.js, so purchases follow them across web and mobile. For anonymous buyers use `Purchases.generateRevenueCatAnonymousAppUserId()` together with Redemption Links.
- **Offerings:** `getOfferings({ currency: "EUR" })`; otherwise the geolocated currency or the app default.
- **Purchase:** `purchase({ rcPackage: pkg })` returns a `PurchaseResult` with `customerInfo` and `redemptionInfo`. `PurchaseParams` options: `customerEmail`, `defaultLocale`, `selectedLocale`, `htmlTarget`, `metadata`.
- **Paywall:** `presentPaywall({ htmlTarget, offering })`.
- **Attributes:** `Purchases.getSharedInstance().setAttributes({...})`.
- **Apple Pay and Google Pay** are registered automatically on `pay.rev.cat` and `signup.cat`; register your own domain for the Web SDK.

## Stripe Billing integration

- **Setup:** connect the Stripe account; **Web**, create a Stripe config (toggles: **Use Managed Payments when Available**; External Purchase Tracking, registering on invoice creation or after paid; Redemption Links; Appearance; Subscription management, where the **Stripe Customer Portal URL** is returned as `managementUrl`); create products in Stripe (one price per product recommended); **Product Catalog**, **Products**, the Stripe config, **Import**; create Offering packages; Web Purchase Links live under **Funnels > Purchase Links**.
- **Tax behaviour:** configs created on or after May 1, 2026 default to **Tax-excluded**; earlier configs use the legacy estimate.
- **Stripe server notifications are required for Stripe.**
- **Pricing models in RevenueCat flows:** recurring flat rate and one-off flat rate. Package pricing only as external purchases. Tiered, usage-based and customer-chooses pricing are not supported. A price's type can't change after import. Repeat consumables are allowed (enforce limits in Stripe).
- **Unsupported payment methods:** async bank debits (`us_bank_account`, `sepa_debit`, ...), bank transfers, cash vouchers, PayPal, UPI, and redirect-based methods (Cash App Pay, iDEAL, Bancontact, Revolut Pay, Klarna).
- **Other limits:** prorations are not in MRR (pass `prorate=false`); cancellations can take up to two hours to show; one billing issue event per failure; self-service runs through the Stripe Customer Portal; Test Clocks are not fully supported; `UNCANCELLATION` is not sent for Stripe.
- **Renewal gap:** the entitlement extends when the new period starts, but `RENEWAL` arrives only after the invoice is paid. Keep access until `EXPIRATION`, or call `GET /subscribers` before removing it. A missing `RENEWAL` does not mean the subscription expired.

## Redemption Links

- **What they are:** one-time-use deep links, valid for 60 minutes after a web purchase, so checkout needs no App User ID. A link is valid for one redemption; redeeming on another device sends a new link to the billing email.
- **Where the link appears:** Web Purchase Links show it on the success page and in the email; a custom redirect gets a `redeem_url` query param (for example `https://your-app.com/success?redeem_url=rc-abc123://redeem_web_purchase?redemption_token=xyz789`). The Web SDK returns `PurchaseResult.redemptionInfo` instead.
- **Failure cases:** the app isn't installed, a desktop browser, or the link is older than 60 minutes (show a QR code). An expired link triggers a new emailed link (unless recovery emails are disabled).
- **Minimum SDKs:** purchases-flutter 8.4.0, react-native-purchases 8.5.0, iOS 5.14.1, Android 8.10.6.
- **Setup:** copy the custom URL scheme from the web config; register it (iOS URL Types; an Android intent-filter with `android:scheme=<YOUR_CUSTOM_SCHEME>`); handle the deep link (in Flutter with `app_links` or similar). In the dashboard add an App icon, App name and a store link, and set **Enable only for Sandbox** first.
- **Association:** anonymous and identified combinations are aliased, except identified plus identified, which follows restore behaviour (default transfer). The resulting `PURCHASE_REDEEMED` webhook is described in [BACKEND-AND-WEBHOOKS.md](BACKEND-AND-WEBHOOKS.md#event-types).
- **Flutter:**

```dart
String redemptionUrl = 'YOUR_REDEMPTION_URL';
final webPurchaseRedemption = await Purchases.parseAsWebPurchaseRedemption(redemptionUrl);
if (webPurchaseRedemption != null) {
  final result = await Purchases.redeemWebPurchase(webPurchaseRedemption);
  switch (result) {
    case WebPurchaseRedemptionSuccess(:final customerInfo):
      // Redemption was successful and entitlements were granted to the user.
      break;
    case WebPurchaseRedemptionError(:final error):
      // Redemption failed due to an error.
      break;
    case WebPurchaseRedemptionPurchaseBelongsToOtherUser():
      // The purchase associated to the link belongs to a different user and it cannot be redeemed.
      break;
    case WebPurchaseRedemptionInvalidToken():
      // The redemption link is invalid.
      break;
    case WebPurchaseRedemptionExpired(:final obfuscatedEmail):
      // The redemption link has expired. A new one has been sent to the user to the provided obfuscated email.
      break;
  };
}
```

- **React Native:** `const webPurchaseRedemption = await Purchases.parseAsWebPurchaseRedemption(redemptionUrl);`, then `const result = await Purchases.redeemWebPurchase(webPurchaseRedemption);` and `switch (result.result)` over `WebPurchaseRedemptionResultType.SUCCESS` (`result.customerInfo`), `ERROR` (`result.error`), `PURCHASE_BELONGS_TO_OTHER_USER`, `INVALID_TOKEN` and `EXPIRED` (`result.obfuscatedEmail`). (The docs' React Native snippet starts with a Dart-style `String redemptionUrl = ...` line, which is not valid TypeScript.)

## Testing web purchases

- **There is no App Review on the web,** so test thoroughly in sandbox. Don't share sandbox URLs with users.
- **RevenueCat Billing sandbox** renews at most six times, on a compressed clock:

| Period | Sandbox length |
|---|---|
| P1D to P1M | 5 minutes |
| P2M | 10 minutes |
| P3M | 15 minutes |
| P6M | 30 minutes |
| P1Y | 60 minutes |
| Trial, intro | 5 minutes |
| Discount window | 11 minutes |
| Grace period | 3 minutes |
| Billing retries | Every 3 minutes, up to 5 attempts |

- **Stripe Billing and Paddle sandboxes** use full periods. Apple Pay and Google Pay can use real cards in sandbox.
- **Test a redemption link** with `<YOUR_CUSTOM_SCHEME>://redeem_web_purchase?redemption_token=<ANY_TOKEN>` (for example `xcrun simctl openurl booted "..."`); the app should show its invalid-link UI.

## Prove it

- With a Google Play test card that declines renewals: the subscription enters grace with `billingIssueDetectedAt` non-null and `isActive` true; at account hold `isActive` is false and `billingIssueDetectedAt` still non-null; after updating the payment method `billingIssueDetectedAt` returns to null; the backend receives `BILLING_ISSUE` once, on the first transition.
- Cancelling in the Play Store sets `unsubscribeDetectedAt` while `isActive` stays true, and the app's management link opens the Play subscriptions screen.
- Pausing in the Play sandbox gives `isActive` false, and `/v1/subscribers/{id}` returns `paused_expiration_time_ms`.
- A dashboard refund on Google Play or RevenueCat Billing expires the subscription immediately.
- With alternative billing, standard purchases still appear in the dashboard, alternative-billing purchases reconcile with RevenueCat subscriber state, and each purchase is acknowledged exactly once.
- A RevenueCat Billing sandbox monthly subscription renews every 5 minutes up to six times, and a redemption link opens the app and grants the entitlement; an invalid token shows the invalid-link UI.
