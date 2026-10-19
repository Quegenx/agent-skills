# Subscription offers

The offer types each store lets you attach to a subscription: Apple's introductory, promotional, win-back offers and offer codes, and Google Play's base plans, offer phases and eligibility rules. Every limit and rule here comes from Apple's and Google's docs; where the [eronred] playbook disagrees, both are given. When to offer what (trials, the cancellation flow, the win-back ladder) is in [RETENTION-AND-MONETIZATION.md](RETENTION-AND-MONETIZATION.md); purchase code and entitlements are in [revenuecat SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/SKILL.md).

## Apple subscription offers

- **Three StoreKit offer types:** `Product.SubscriptionOffer.OfferType` is `introductory`, `promotional` or `winBack` (iOS 15+). Offer codes are a fourth way in. Setting up introductory offers in App Store Connect needs the Account Holder, Admin, App Manager or Marketing role.

| | Introductory | Promotional | Win-back | Offer codes |
|---|---|---|---|---|
| Who | New subscribers; lapsed subscribers who never used an intro offer in the group | Existing and previously subscribed customers, even after an intro offer | Churned subscribers (`expirationDate` in the past, `willAutoRenew` false) | New, existing (includes billing retry and grace with auto-renew on), or expired subscribers |
| Not eligible | Existing subscribers (upgrade, downgrade, crossgrade) | | Only the most recently lapsed product in each group | |
| Limit | One per customer per subscription group; one current and one future per storefront | Up to 10 active per subscription; all storefronts (can't limit by country) | 350 per subscription, 5 running per storefront per subscription | 10 active offers; 1,000,000 codes per app per quarter |
| After creation | Can't be edited: delete and recreate; overlapping dates, the latest action wins | Only price editable | Price can't change; overlapping offers, Apple picks one | |
| Shown | Automatically on the product page to eligible users | In your app to eligible subscribers | Manage Subscriptions (iOS 14.3+ / macOS 14+), in-app sheet (iOS 18+ / macOS 15+), App Store promotion (iOS 18+ / macOS 15+) | Redemption sheet |
| Needs | | An In-App Purchase key and a server signature; iOS 12.2+, macOS 10.14.4+, tvOS 12.2+ | Subscription approved by App Review | Subscription codes iOS 14.2+, other IAP types iOS 16.3+ |

- **Introductory payment modes:** free trial (the subscription begins immediately, billing after the trial), pay as you go (for example $1.99/month for 3 months), pay up front (for example $1.99 for 2 months).

| Standard duration | Pay as you go |
|---|---|
| 1 Week | 1 to 12 Weeks |
| 1 Month | 1 to 12 Months |
| 2 Months | 2, 4, 6, 8, 10 or 12 Months |
| 3 Months | 3, 6, 9 or 12 Months |
| 6 Months | 6 or 12 Months |
| 1 Year | 1 Year |

  Pay Up Front (1, 2, 3 or 6 Months, 1 Year) and Free Trial (3 Days, 1 or 2 Weeks, 1, 2, 3 or 6 Months, 1 Year) are the same for every standard duration.
- **Promotional offers:** your server generates a signature (time sensitive, unique per offer, redeemable once) from `applicationUsername`, `productIdentifier` and the offer `identifier`, and returns `nonce`, `timestamp`, `keyIdentifier`; the app passes them in `SKPaymentDiscount`, and `applicationUsername` on the payment must match. On failure, generate a new signature. The offer period starts at the next billing event. A suggested eligibility signal is `DID_CHANGE_RENEWAL_STATUS`.
- **Win-back offers** (announced September 10, 2024; WWDC24 session 10110) are configured per subscription product, not per group. Earliest start is one day after today; minimum run 3 days; priority Normal or High. Eligibility: Minimum Paid Duration (1-24 months, or 3, 4 or 5 years) and Time Since Last Subscribed (1 to 24 months), both required; Wait Between Offers (2-24 months) optional. App Store promotion (product page, editorial, personalized recommendations) needs an approved subscription image (not the app icon or a screenshot) and replaces In-App Purchase promotions in that storefront.
- **Win-back in code:** link directly with `https://apps.apple.com/win-back/<win-back offer Apple ID>`, after checking eligibility server-side through Get All Subscription Statuses and `JWSRenewalInfoDecodedPayload.eligibleWinBackOfferIds` (best offer first). With Streamlined Purchasing on (the default) a completed transaction arrives in `Transaction.updates` / `all` / `currentEntitlements`; with it off a `PurchaseIntent` arrives in `intents` (the latest approved binary must handle `PurchaseIntent` before you turn it off). In-app, `Transaction.offer` has type `winBack`; on the server `offerType` is `4`.

- **Conflict on win-back code:** the playbook says StoreKit 2 win-back offers (iOS 18+, App Store Connect > Subscriptions > Win-Back Offers) are presented automatically in the App Store and need no code beyond a StoreKit 2 integration. Apple's docs: with Streamlined Purchasing on (the default) the completed transaction is delivered in `Transaction.updates` / `all` / `currentEntitlements`, and turning it off delivers a `PurchaseIntent` that the latest approved binary must handle. Apple also shows win-back offers in Manage Subscriptions from iOS 14.3, not only iOS 18.
- **The cancel screen:** Apple's Retention Messaging API puts a system message (text, text with image, switch-plan or promotional offer) on the Confirm Cancellation page, needs a default message per product and locale, and is pre-release with a "Request access" link (https://developer.apple.com/documentation/retentionmessaging); details in [RETENTION-AND-MONETIZATION.md](RETENTION-AND-MONETIZATION.md#subscription-lifecycle).
- **Offer codes:** one-time-use codes (expire after at most six months, batches of 500 to 25,000), custom codes (for example SPRINGPROMO, no expiration needed) and sandbox codes (10 to 10,000 per batch, up to 10,000 per quarter). Choose whether codes stack with the introductory offer. Redeem with `offerCodeRedemption(options:isPresented:onCompletion:)` (SwiftUI), `presentOfferCodeRedeemSheet(from:options:)` (UIKit/AppKit), or `presentCodeRedemptionSheet()` on iOS 16 and earlier. Server `offerType` is `3`; notifications `OFFER_REDEEMED`, `SUBSCRIBED`, `ONE_TIME_CHARGE`.
- **Guideline 3.1.2(a):** auto-renewable subscriptions must provide ongoing value, and "the subscription period must last at least seven days and be available across all of the user's devices."

## Google Play subscription offers

- **Model:** subscription, then base plans (auto-renewing, prepaid, installments), then offers. Installments exist only in Brazil, France, Italy and Spain, paid monthly. Up to 250 base plans and offers per subscription, 50 active at once. Offers attach only to auto-renewing base plans.
- **Offer phases:** free trial (3 days to 3 years); introductory pricing (absolute amount, fixed discount or percentage, at or below the base price); single payment; multiple payments (a discount for 1 to 52 recurrences of the billing period).
- **Eligibility:** New customer acquisition (never had this subscription, or never had any subscription in the app); Upgrade (a current subscription and optional billing period, with a redemption cap); Developer determined (you decide the business logic; it can't be purchased outside the app; for example limited to past subscribers who canceled, to win them back). Up to 20 offer tags, invisible to users; offers return their own tags and their base plan's.
- **Select the offer in code:** pass `productDetails.getSubscriptionOfferDetails(selectedOfferIndex).getOfferToken()` to `ProductDetailsParams.setOfferToken(...)` in `BillingFlowParams`.
- **Win-back on Play:** Google's support and developer docs, as searched, show no separate win-back offer type; the documented routes are developer-determined offers and a winback SKU. Resubscribe from the Play Store subscriptions center is on by default for up to one year after expiration. For a free trial or intro price on a winback SKU, uncheck "Allow one free trial per app"; resubscribing to the same SKU loses trial and intro eligibility. Free trials verify a valid payment method with a temporary hold; cancelling during the trial keeps access to its end. Promo codes can grant extended free trials.
- **Deadline:** by Aug 31, 2026 all new apps and updates must use Billing Library version 8 or later, with an extension available until Nov 1, 2026. Store-side setup is in [google-play SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/google-play/SKILL.md).

## Prove it

- **Offers (Apple):** in sandbox, an introductory offer shows only to an eligible user; a promotional offer purchase succeeds with a fresh server signature and fails with a reused one; an offer code redeems through the redemption sheet and the server receives `OFFER_REDEEMED`; a win-back purchase arrives in `Transaction.updates` with offer type `winBack`.
- **Offers (Play):** the purchase flow passes the selected offer's `getOfferToken()` to `setOfferToken(...)`, and the app is on Billing Library 8 or later.
