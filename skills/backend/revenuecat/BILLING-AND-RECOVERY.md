# Billing and recovery

What happens to a subscription after the first purchase: failed renewals, cancellations, pauses, refunds, plan changes, win-back, Google Play's alternative billing programs, with web purchase setup in [WEB-BILLING.md](WEB-BILLING.md). The mechanism that decides most outcomes: the store owns the money and the state, RevenueCat turns every state change into `CustomerInfo` fields and webhook events, and access is read from the entitlement's `isActive` (or v2 `gives_access`), never computed from dates. The webhook side of each flow is in [BACKEND-AND-WEBHOOKS.md](BACKEND-AND-WEBHOOKS.md); SDK syntax is in [FLUTTER.md](FLUTTER.md) and [REACT-NATIVE.md](REACT-NATIVE.md); entitlements and offerings are in [CONCEPTS.md](CONCEPTS.md); Stripe itself is [stripe SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/SKILL.md).

**Contents:** [Read state, don't compute it](#read-state-dont-compute-it) · [Billing issues and grace periods](#billing-issues-and-grace-periods) · [Cancellations](#cancellations) · [Pauses](#pauses) · [Win-back and retention](#win-back-and-retention) · [Refunds](#refunds) · [Refund Control](#refund-control) · [Upgrades, downgrades and crossgrades](#upgrades-downgrades-and-crossgrades) · [Price changes](#price-changes) · [Google Play alternative billing](#google-play-alternative-billing) · [RevenueCat Web: pick a billing engine](#revenuecat-web-pick-a-billing-engine) · [RevenueCat Billing](#revenuecat-billing) · [Web SDK](#web-sdk) · [Stripe Billing integration](#stripe-billing-integration) · [Redemption Links](#redemption-links) · [Testing web purchases](#testing-web-purchases) · [Prove it](#prove-it)

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
- **Send users to fix or cancel through `managementURL`** from CustomerInfo. It is already a URI; do not re-parse it. Google's [Subscriptions policy](https://support.google.com/googleplay/android-developer/answer/9900533): "You must also include in your app access to an easy-to-use, online method to cancel the subscription", met in account settings by "A link to Google Play's Subscription Center ... and/or direct access to your cancellation process" (the full policy is in [google-play BILLING-AND-PURCHASES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/google-play/BILLING-AND-PURCHASES.md#subscriptions-policy)). This line used to say only "Google requires apps to let customers cancel a subscription within the app".
- **Grace-period subscriptions count as active.**

## Billing issues and grace periods

- **The flow on Google Play:** a failed renewal enters a grace period (access kept while Google retries the card), then account hold (access revoked until the payment method is fixed). Both states land in `CustomerInfo` automatically, and Google's in-app message shows by default.
- **Google's defaults** ([subscription lifecycle](https://developer.android.com/google/play/billing/lifecycle/subscriptions)): grace is enabled by default on all auto-renewing base plans; "You can set a grace period of 0 days, but Play will wait a minimum of 1 day"; account hold is enabled by default and lasts "60 days minus any grace period duration"; "Specifying a length less than the default value may reduce the number of subscriptions recovered".
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

- **UI branching order:** no entitlement or not active, the subscribe screen; billing issue and active, a grace-period warning; billing issue and not active, the account-hold screen; otherwise premium. For your own grace-period banner, [coreyhaines31/marketingskills, churn-prevention] shows it "on every page load during dunning period", dismissible but shown "again next session", and says "Don't block the product"; web dunning in full is [churn-prevention SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/churn-prevention/SKILL.md).
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

- **Google's pause lengths** ([subscription lifecycle](https://developer.android.com/google/play/billing/lifecycle/subscriptions)): weekly plans 1, 2, 3 or 4 weeks; monthly, three-month, six-month and annual plans 1, 2 or 3 months, "Subject to change at any time". Apps "should also provide a way for the user to manually resume ... using a deep link to Google Play".
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

- **You cannot upgrade or downgrade on behalf of customers.**
- **App Store: no code changes.** Upgrades are immediate with a prorated refund, downgrades apply at next renewal, crossgrades are immediate if the duration is the same, else at next renewal. Upgrades during intro periods keep both products active.
- **Google Play: pass the old product and a replacement mode.** RevenueCat Paywalls use the editor setting **Play Store only: Replacement mode**. Custom flows pass the old product ID and an optional mode. Preconditions: exactly one active Play subscription to replace (none: do a fresh purchase), fresh or recently cached CustomerInfo, the target Package resolved from the current offering, Billing Library 7+ (via the SDK).

Flutter:

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

React Native:

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

| Scenario | Mode | Billing effect |
|---|---|---|
| Standard upgrade (monthly to annual) | `WITH_TIME_PRORATION` | Immediate switch, remaining time credited |
| Upgrade, keep the existing billing date | `CHARGE_PRORATED_PRICE` | Immediate switch, prorated charge now |
| Switch to or from a prepaid plan | `CHARGE_FULL_PRICE` | Immediate switch, full charge now |
| Upgrade during an active free trial | `CHARGE_PRORATED_PRICE` | Immediate switch, prorated charge now |
| Downgrade (annual to monthly) | `DEFERRED` | Switch applies at next renewal |

- **The RevenueCat default is `WITHOUT_PRORATION`; set the intended mode explicitly.** For trial upgrades, use `WITHOUT_PRORATION` to preserve the trial, or `CHARGE_PRORATED_PRICE` to end it. The source wrongly banned preserving trial access. [RevenueCat/ai-toolkit, rc-plan-changes; https://www.revenuecat.com/docs/subscription-guidance/managing-subscriptions; https://developer.android.com/google/play/billing/subscriptions#replacement-recommendations]
- **`CHARGE_PRORATED_PRICE` requires an increased price per unit of time; `DEFERRED` can upgrade or downgrade at renewal.** Check restrictions for the actual plan transition: same-subscription switches to an auto-renewing plan support `CHARGE_FULL_PRICE` or `WITHOUT_PRORATION`, not every mode. The source wrongly said Google rejects every deferred upgrade. [https://developer.android.com/google/play/billing/subscriptions#replacement-modes]
- **Derive the old product ID from `activeSubscriptions`,** stripping the `:basePlanId` suffix: "Hardcoded SKUs break when a user has migrated between plans." If you pass `"productId:basePlanId"` the SDK strips it, but slicing it yourself is clearer.
- **After the change** `activeSubscriptions` holds the new `productId:basePlanId` and the entitlement stays active across the switch: "do not gate UI on the SKU string". For `DEFERRED`, `activeSubscriptions` reports the old product until next renewal; RevenueCat tracks the pending switch and flips it after Google's renewal RTDN.
- **Delete `linkedPurchaseToken` traversal code.** RevenueCat resolves the chain, marks the old token replaced, and attributes both tokens to the same App User ID.
- **`DEFERRED` requires Google server notifications** ([STORE-SETUP.md](STORE-SETUP.md#google-real-time-developer-notifications-rtdn)). [https://www.revenuecat.com/docs/subscription-guidance/managing-subscriptions]
- **Webhooks:** `PRODUCT_CHANGE` is informative; its `expiration_at_ms` is for the old product.
- **Amazon doesn't support product changes.** RevenueCat Billing: upgrade and downgrade paths live in the web Customer Portal; upgrades are immediate with a partial refund, downgrades apply at cycle end, not prorated.

## Price changes

These rules come from the Google Play chapter.

- **Two kinds for active subscribers.** Opt-out (typically decreases, and increases within Google's opt-out threshold) applies automatically at next renewal. Opt-in (larger increases) shows Google's own consent dialog; consent continues at the new price, decline cancels at period end.
- **"For most price change scenarios, there is nothing to implement in your app or backend."** RevenueCat processes `SUBSCRIPTION_PRICE_CHANGE_UPDATED` and related RTDNs and updates CustomerInfo when cohort or consent state changes.

| Question | Opt out | Opt in |
|---|---|---|
| Typical trigger | Decrease, or small increase within Google's threshold | Larger increase above Google's threshold |
| User consent | Not required | Required, prompted by Google Play UI |
| If user declines | N/A | Subscription cancels at period end, `CANCELLATION` webhook fires |
| New price applies | Automatically at next renewal | After user consents in Play's dialog |
| RTDN RevenueCat consumes | `SUBSCRIPTION_PRICE_CHANGE_UPDATED` | `SUBSCRIPTION_PRICE_CHANGE_UPDATED`, then `SUBSCRIPTION_CANCELED` if declined |
| App code change | None required | None required |
| Paywall price source | `pkg.product.price.formatted` [Kotlin] (new purchases only) | `pkg.product.price.formatted` [Kotlin] (new purchases only) |

1. **Edit the price in Play Console** (subscription > base plan > edit price); Google asks how existing subscribers are treated, based on magnitude and region.
2. **Nothing to toggle in RevenueCat.** Confirm the new price appears on the product in the dashboard after propagation.
3. **Optionally refresh offerings** so new purchasers see the new price.
4. **Read entitlements as usual after consent resolves.** "Do not build a consent dialog. Google Play shows it."
5. **Treat a decline like any other cancellation** (`CANCELLATION` webhook).
6. **Optional pre-warning:** an in-app banner driven by a webhook event, or a specific Offering for the affected cohort via Targeting; "an enhancement, not part of the price change contract".

- **Legacy cohorts keep the old price** until Google migrates them; this is not visible in the SDK. The product's formatted price is always correct for new purchases.
- **Apple Server Notifications V2 auto-detect price changes** (see [STORE-SETUP.md](STORE-SETUP.md)).

## Google Play alternative billing

- **Programs:** User Choice Billing, Alternative Billing Only, External Offers and External Payment Links. Each has different Play requirements; Google gates them by country and app category. You enroll through Play Console, not through RevenueCat.
- **RevenueCat support is limited.** The skill says "as of SDK 9.x" in its body and "Android SDK 10.x" in its description; check the RevenueCat changelog for newer releases before you start.

| Option | Status |
|---|---|
| RevenueCat Web Billing via `Offering.webCheckoutURL` / `Package.webCheckoutURL` | Supported. Not a Google alternative billing program. |
| User Choice Billing, Alternative Billing Only, External Offers, External Payment Links | No dedicated SDK APIs. Implement with the Play Billing Library alongside RevenueCat. |

- **Don't conflate RevenueCat's web checkout with Google's alternative billing.** After a web purchase, users redeem it in the app through deep link handling ([Redemption Links](WEB-BILLING.md#redemption-links)).
- **Path A:** wait for SDK support (avoids raw Play Billing Library code next to RevenueCat). **Path B:** hand-roll it. The SDK owns the `BillingClient` instance, so raw `BillingClient` calls alongside it need care; set `purchasesAreCompletedBy(PurchasesAreCompletedBy.MY_APP)` so acknowledgement stays with your app for purchases you manage, while standard Play purchases stay with the SDK.

## RevenueCat Web: pick a billing engine

See [WEB-BILLING.md](WEB-BILLING.md#revenuecat-web-pick-a-billing-engine).

## RevenueCat Billing

See [WEB-BILLING.md](WEB-BILLING.md#revenuecat-billing).

## Web SDK

See [WEB-BILLING.md](WEB-BILLING.md#web-sdk).

## Stripe Billing integration

See [WEB-BILLING.md](WEB-BILLING.md#stripe-billing-integration).

## Redemption Links

See [WEB-BILLING.md](WEB-BILLING.md#redemption-links).

## Testing web purchases

See [WEB-BILLING.md](WEB-BILLING.md#testing-web-purchases).

## Prove it

- With a Google Play test card that declines renewals: the subscription enters grace with `billingIssueDetectedAt` non-null and `isActive` true; at account hold `isActive` is false and `billingIssueDetectedAt` still non-null; after updating the payment method `billingIssueDetectedAt` returns to null; the backend receives `BILLING_ISSUE` once, on the first transition.
- Cancelling in the Play Store sets `unsubscribeDetectedAt` while `isActive` stays true, and the app's management link opens the Play subscriptions screen.
- Pausing in the Play sandbox gives `isActive` false, and `/v1/subscribers/{id}` returns `paused_expiration_time_ms`.
- A dashboard refund on Google Play or RevenueCat Billing expires the subscription immediately.
- With alternative billing, standard purchases still appear in the dashboard, alternative-billing purchases reconcile with RevenueCat subscriber state, and each purchase is acknowledged exactly once.
- Web purchase redemption passes the checks in [WEB-BILLING.md](WEB-BILLING.md#prove-it).
