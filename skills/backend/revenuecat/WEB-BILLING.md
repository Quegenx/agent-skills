# Web billing and purchase redemption

RevenueCat's web billing and Web SDK guidance covers RevenueCat Billing, the Stripe Billing integration, Paddle Billing and redemption links. The existing provider setup, compatibility limits and SDK calls are collected here; subscription recovery remains in [BILLING-AND-RECOVERY.md](BILLING-AND-RECOVERY.md), and purchase testing in [TESTING.md](TESTING.md). [RevenueCat docs, web billing and Web SDK]

## RevenueCat Web: pick a billing engine

- **Engines:** RevenueCat Billing (Stripe as the payment gateway), Stripe Billing, or Paddle Billing (Paddle as merchant of record). **Integration paths:** Web Purchase Links, the Web SDK, Web Paywalls, Funnels, app-to-web purchases, Redemption Links. [RevenueCat docs, web billing]
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

- **Formerly "Web Billing",** recommended for a deeper integration. RevenueCat doesn't store card data. The web config attaches an existing Stripe account or a **claimable sandbox**, which cannot take real payments until claimed (claim it before the deadline). [RevenueCat docs, RevenueCat Billing]
- **Connect Stripe:** only the RevenueCat project owner can connect. Install the RevenueCat Stripe App from the Stripe App Marketplace through account settings, **Connect Stripe account**, then **View Stripe app settings** and sign in with RevenueCat. Uninstalling the app revokes all permissions. Several Stripe accounts are possible.
- **Test mode or Sandboxes:** with test mode, one RevenueCat Billing config and Stripe test cards. With Sandboxes, install the app in each sandbox and create two RevenueCat Billing configs (production and sandbox). RevenueCat anticipates test mode will eventually be deprecated.
- **Webhook-only event:** `INVOICE_ISSUANCE` fires for RevenueCat Billing only; `metadata` on events is RevenueCat Billing only.

## Web SDK

- **Install:** `npm install --save @revenuecat/purchases-js`. With unpkg, use `Purchases.Purchases.configure()`. [RevenueCat docs, Web SDK]
- **Configure once:** `Purchases.configure({ apiKey: WEB_BILLING_PUBLIC_API_KEY, appUserId: appUserId })`. `Purchases.getSharedInstance()` throws if not configured.
- **Identity:** identify customers through shared auth such as Firebase, Supabase or auth.js, so purchases follow them across web and mobile. For anonymous buyers use `Purchases.generateRevenueCatAnonymousAppUserId()` together with Redemption Links.
- **Offerings:** `getOfferings({ currency: "EUR" })`; otherwise the geolocated currency or the app default.
- **Purchase:** `purchase({ rcPackage: pkg })` returns a `PurchaseResult` with `customerInfo` and `redemptionInfo`. `PurchaseParams` options: `customerEmail`, `defaultLocale`, `selectedLocale`, `htmlTarget`, `metadata`.
- **Paywall:** `presentPaywall({ htmlTarget, offering })`.
- **Attributes:** `Purchases.getSharedInstance().setAttributes({...})`.
- **Apple Pay and Google Pay** are registered automatically on `pay.rev.cat` and `signup.cat`; register your own domain for the Web SDK.

## Stripe Billing integration

- **Setup:** connect the Stripe account; **Web**, create a Stripe config (toggles: **Use Managed Payments when Available**; External Purchase Tracking, registering on invoice creation or after paid; Redemption Links; Appearance; Subscription management, where the **Stripe Customer Portal URL** is returned as `managementUrl`); create products in Stripe (one price per product recommended); **Product Catalog**, **Products**, the Stripe config, **Import**; create Offering packages; Web Purchase Links live under **Funnels > Purchase Links**. [RevenueCat docs, Stripe Billing integration]
- **Tax behaviour:** configs created on or after May 1, 2026 default to **Tax-excluded**; earlier configs use the legacy estimate.
- **Stripe server notifications are required for Stripe.**
- **Pricing models in RevenueCat flows:** recurring flat rate and one-off flat rate. Package pricing only as external purchases. Tiered, usage-based and customer-chooses pricing are not supported. A price's type can't change after import. Repeat consumables are allowed (enforce limits in Stripe).
- **Unsupported payment methods:** async bank debits (`us_bank_account`, `sepa_debit`, ...), bank transfers, cash vouchers, PayPal, UPI, and redirect-based methods (Cash App Pay, iDEAL, Bancontact, Revolut Pay, Klarna).
- **Other limits:** prorations are not in MRR (pass `prorate=false`); cancellations can take up to two hours to show; one billing issue event per failure; self-service runs through the Stripe Customer Portal; Test Clocks are not fully supported; `UNCANCELLATION` is not sent for Stripe.
- **Renewal gap:** the entitlement extends when the new period starts, but `RENEWAL` arrives only after the invoice is paid. Keep access until `EXPIRATION`, or call `GET /subscribers` before removing it. A missing `RENEWAL` does not mean the subscription expired.

## Redemption Links

- **What they are:** one-time-use deep links, valid for 60 minutes after a web purchase, so checkout needs no App User ID. A link is valid for one redemption; redeeming on another device sends a new link to the billing email. [RevenueCat docs, Redemption Links]
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

Use the [web testing channel](TESTING.md#other-stores-and-web) and the single [accelerated-renewal matrix](TESTING.md#accelerated-renewals) for sandbox periods, renewal limits, grace and retry timing. [RevenueCat docs, web billing sandbox]

- **Test a redemption link** with `<YOUR_CUSTOM_SCHEME>://redeem_web_purchase?redemption_token=<ANY_TOKEN>` (for example `xcrun simctl openurl booted "..."`); the app should show its invalid-link UI.

## Prove it

- The selected billing engine matches the integration path and its documented limitations above. [RevenueCat docs, web billing and Web SDK]
- A sandbox redemption link opens the app and grants the entitlement; an invalid token shows the invalid-link UI.
- The web sandbox follows the [testing contract](TESTING.md#accelerated-renewals), and no sandbox URL is shared with users.
