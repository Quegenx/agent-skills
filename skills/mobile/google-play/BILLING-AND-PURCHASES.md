# Billing and Purchases

Selling inside an Android app on Google Play means three pieces: products defined in Play (one-time products and subscriptions with base plans and offers), the Play Billing Library in the app, and a backend that verifies every purchase token, acknowledges it and listens for real-time developer notifications. Most outcomes come down to whether the server verifies before granting, whether purchases are acknowledged within 3 days, and whether the app ships a Billing Library version Play still accepts. Facts tagged as the gplay CLI's come from its third-party author; Google's docs are the authority where they differ. Regional prices are [PRICING.md](PRICING.md); CLI auth, profiles and edits are [CLI.md](CLI.md); a managed alternative for entitlements across stores is [revenuecat SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/SKILL.md).

**Contents:** [Products: which API](#products-which-api) · [One-time products](#one-time-products) · [Subscriptions, base plans and offers](#subscriptions-base-plans-and-offers) · [Subscriptions policy](#subscriptions-policy) · [Testing purchases](#testing-purchases) · [Server-side verification](#server-side-verification) · [Real-time developer notifications](#real-time-developer-notifications) · [Orders, refunds and voided purchases](#orders-refunds-and-voided-purchases) · [Play Billing Library versions and deadlines](#play-billing-library-versions-and-deadlines) · [Play Integrity API](#play-integrity-api) · [Prove it](#prove-it)

## Products: which API

Since Billing Library 8.0.0 (2025-06-30), Google says "In-app items will now be referred to as one-time products", with multiple purchase options and offers per one-time product. The gplay CLI exposes two APIs for them:

| | Legacy `gplay iap` | New `gplay onetimeproducts` |
|---|---|---|
| API | `inappproducts` | `monetization.onetimeproducts` |
| Price | `priceMicros` / `currency` | `units` / `nanos` / `currencyCode` |
| Regions | flat `prices` map, `--auto-convert-prices` | `purchaseOptions` with `regionalPricingAndAvailabilityConfigs` |
| States | `active` / `inactive` | `DRAFT` then `ACTIVE` (explicit activation) |
| Required | | `--regions-version` |

- **Use the new API for new products.** Use legacy only for existing legacy products. Never mix the two for the same product.
- **Product IDs are permanent.** Google Play reserves an ID after deletion; it cannot be reused, even through the other API. Never create a "test" product with a good ID and delete it. If an ID is burned, pick a new one like `premium_unlock_v2`.
- **Name IDs clearly:** `premium_monthly`, not `prod_001`.
- **Find command groups with `gplay --help`.** Groups used here: `onetimeproducts`, `purchase-options`, `iap`, `subscriptions`, `baseplans`, `offers`, `otp-offers`, `pricing`, `purchases`, `orders`, `rtdn`.

## One-time products

- **Create:** `gplay onetimeproducts create --package --product-id premium_unlock --json @product.json --regions-version "2025/03"`. `--regions-version` is required because create uses PATCH with `allowMissing=true`.

```json
{
  "productId": "premium_unlock",
  "listings": [
    { "languageCode": "en-US", "title": "Premium Unlock", "description": "Unlock all premium features" },
    { "languageCode": "es-ES", "title": "Desbloqueo Premium", "description": "Desbloquea todas las funciones premium" }
  ],
  "purchaseOptions": [
    {
      "buyOption": { "legacyCompatible": true },
      "newRegionsConfig": {
        "availability": "AVAILABLE",
        "usdPrice": { "currencyCode": "USD", "units": "9", "nanos": 990000000 },
        "eurPrice": { "currencyCode": "EUR", "units": "9", "nanos": 990000000 }
      },
      "regionalPricingAndAvailabilityConfigs": [
        { "regionCode": "US", "availability": "AVAILABLE", "price": { "currencyCode": "USD", "units": "9", "nanos": 990000000 } },
        { "regionCode": "GB", "availability": "AVAILABLE", "price": { "currencyCode": "GBP", "units": "7", "nanos": 990000000 } },
        { "regionCode": "IN", "availability": "AVAILABLE", "price": { "currencyCode": "INR", "units": "249", "nanos": 990000000 } }
      ]
    }
  ]
}
```

- **Activate after creating.** New products start in `DRAFT`. Activation lives under `gplay purchase-options`, not `onetimeproducts`:

```bash
gplay purchase-options batch-update-states \
  --package com.example.app \
  --product-id premium_unlock \
  --json '{"requests":[{"activatePurchaseOptionRequest":{"packageName":"com.example.app","productId":"premium_unlock","purchaseOptionId":"default"}}]}'
```

- **Other commands:** `patch --json --regions-version "2025/03" --update-mask "purchaseOptions"`; `get`; `delete --confirm`; `batch-get --product-ids "premium_unlock,coins_100"`; `batch-update --json @products-batch.json` (here `regionsVersion` goes inside the JSON).
- **One-time product offers:** `gplay otp-offers list|activate|deactivate --product-id --purchase-option-id default [--offer-id promo_50off]`.
- **Legacy `iap`:** `iap list`; `iap create --json @product.json` (no `--sku` flag: the SKU lives in the body); `iap update --sku`; `iap batch-update`; `iap batch-get --skus "premium,coins_100,coins_500"`; `iap delete --sku --confirm` (permanent). Body keys: `sku`, `status: "active"`, `purchaseType: "managedUser"`, `defaultPrice {priceMicros "990000", currency "USD"}`, a `prices` map by region, and `listings` as an object keyed by locale.

## Subscriptions, base plans and offers

- **Commands:** `gplay subscriptions list|create|get|update`.
- **Body keys:** `productId`; `basePlans[]` with `basePlanId`, `state: "ACTIVE"`, `regionalConfigs[] {regionCode, newSubscriberAvailability, price{currencyCode,units,nanos}}`, `autoRenewingBasePlanType { billingPeriodDuration: "P1M" }`; `listings[] {languageCode,title,description}`.
- **Billing periods:** `P1W`, `P1M`, `P3M`, `P6M`, `P1Y`.
- **Localize every listing in one call.** Listings are an array of per-locale objects with `languageCode`, `title`, `benefits` (array) and `description`. Limits: title max 55 characters, description max 80, benefits max 4. One `subscriptions update --product-id --json @subscription-listings.json --update-mask listings` sets every locale atomically without touching base plans or pricing. With a single display name, reuse it for all locales. Verify with `subscriptions get --pretty`. Across all subscriptions:

```bash
PACKAGE="com.example.app"
gplay subscriptions list --package "$PACKAGE" --paginate \
  | jq -r '.[].productId' \
  | while read -r PRODUCT_ID; do
      gplay subscriptions update \
        --package "$PACKAGE" \
        --product-id "$PRODUCT_ID" \
        --json @subscription-listings.json \
        --update-mask listings
    done
```

- **Base plans:** `gplay baseplans activate|deactivate --product-id --base-plan-id`; `baseplans migrate-prices --json @migration.json`. Price changes affect existing subscribers: see [PRICING.md](PRICING.md).
- **Offers:** `gplay offers list|create|activate|deactivate --product-id --base-plan-id [--offer-id]`. Free trial body: `{"offerId":"trial_7day","state":"ACTIVE","phases":[{"duration":"P7D","pricingType":"FREE_TRIAL"}],"regionalConfigs":[{"regionCode":"US"}]}`. Intro price body: `pricingType: "SINGLE_PAYMENT"`, `duration "P1M"`, `price {"priceMicros":"2490000","currency":"USD"}`.
- **Price format conflict:** the CLI author's intro-offer example uses `priceMicros`/`currency`, while the same author says subscriptions use `units`/`nanos`/`currencyCode` and not to mix formats. Check the current API reference before sending offer prices.
- **Billing Library 7.0.0** added installment subscriptions; 8.1.0 added `SubscriptionProductReplacementParams` with `KEEP_EXISTING` ("lets you keep the existing payment schedule unchanged for an item"); 9.0.0 added in-app messaging for opt-in price increases (shown "a maximum of once every 7 days").
- **Terms on the paywall:** for Google Play "you have to show your own terms of services" (on iOS, Apple's EULA from App Store Connect serves) [ApparenceKit](https://apparencekit.dev/blog/flutter-good-paywall/).

## Subscriptions policy

Google's rules for how an app presents, names and cancels a subscription, quoted from the [Subscriptions policy](https://support.google.com/googleplay/android-developer/answer/9900533) unless another page is named. The Apple equivalents (3.1.2) are in [app-store-connect REVIEW-GUIDELINES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/REVIEW-GUIDELINES.md); paywall design across both stores is [app-growth RETENTION-AND-MONETIZATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/RETENTION-AND-MONETIZATION.md).

- **Transparency:** "You must be transparent about your offer. This includes clearly and explicitly disclosing your offer terms, the cost of your subscription, the frequency of your billing cycle, the automatic renewal terms, whether a subscription is required to use the app, and any other material information about the subscription. Users should not have to perform any additional action to review the information."
- **Examples of violations:**
  - "Monthly subscriptions that do not inform users they will be automatically renewed and charged every month."
  - "Annual subscriptions that most prominently display their pricing in terms of monthly cost." (Apple's matching rule, the billed amount as the most prominent price, is in [app-store-connect PREFLIGHT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/PREFLIGHT.md).)
  - "Subscription pricing and terms that are incompletely localized."
  - "In-app promotions that do not clearly demonstrate that a user can access content without a subscription (when available)."
  - "SKU names that do not accurately convey the nature of the subscription, such as "Free Trial" or "Try Premium membership - 3 days for free," for a subscription with an auto-recurring charge."
  - "Multiple screens in the purchase flow that lead users into accidentally clicking the subscribe button."
  - "Subscriptions that do not offer sustained or recurring value, for example, offering 1,000 gems for the first month, then reducing the benefit to 1 gem in subsequent months of the subscription."
  - "Requiring a user to sign up to an auto-renewing subscription to deliver a one-time benefit, and canceling a user's subscription without their request after the purchase."
- **Free trials and introductory offers:** "Before a user is enrolled in your subscription: You must clearly and accurately describe the terms of your offer, including the duration, pricing, and description of accessible content or services. Be sure to let your users know how and when a free trial will convert to a paid subscription, how much the paid subscription will cost, and how a user can cancel if they do not want to convert." The policy's annotated examples mark as violations a dismiss button that "is missing or not clearly visible", an offer that "emphasizes the free trial and users may not understand that they will automatically be charged at the end of the trial", an offer that "most prominently displays pricing in terms of monthly breakdown cost, rather than what the users will actually be charged", a trial charge amount that "is hard to read", no stated trial period, unlocalized language and currency, no explanation of how to cancel, and "Recurring clicks in the same button area" that make the user "inadvertently click the final 'continue' button to subscribe". [Create and manage subscriptions](https://support.google.com/googleplay/android-developer/answer/140504): "Free trials must be between 3 days and 3 years."
- **Manage and cancel in the app:** "you must ensure that your app(s) clearly disclose how a user can manage or cancel their subscription. You must also include in your app access to an easy-to-use, online method to cancel the subscription." In account settings (or an equivalent page) that means "A link to Google Play's Subscription Center (for subscriptions that use Google Play's billing system); and/or direct access to your cancellation process."
- **Refunds:** after a cancel, "the user will not receive a refund for the current billing period, but will continue to receive their subscription content for the remainder of the current billing period regardless of the cancellation date"; "Users in some countries may be able to cancel their subscription immediately and receive a prorated refund, in accordance with applicable law"; "You (as the content or access provider) may implement a more flexible refund policy with your users directly", and notifying users of policy changes is your responsibility.
- **Sustained value:** "Products that do not offer sustained and recurring value must use an in-app product instead of a subscription product."
- **Names and IDs** ([Create and manage subscriptions](https://support.google.com/googleplay/android-developer/answer/140504)): subscription name "up to 55 characters"; "Your subscription name must accurately reflect your offer. For example, don't name your subscription 'Free Trial.'"; product ID "up to 40 characters", starting with a number or lowercase letter.
- **Prices match** ([Payments policy](https://support.google.com/googleplay/android-developer/answer/9858738)): "Developers must clearly and accurately inform users about the terms and pricing ... In-app pricing must match the pricing displayed in the user-facing Play billing interface"; a store listing that mentions paid in-app features "must clearly notify users that payment is required"; loot-box odds are disclosed "in advance of, and in close and timely proximity to, that purchase".

## Testing purchases

- **Static test product IDs:** `android.test.purchased`, `android.test.canceled`, `android.test.refunded`, `android.test.item_unavailable`.
- **License testers:** Play Console Settings > License Testing. Test with test accounts.

## Server-side verification

Client verification can be bypassed: verify on the server.

- **Flow:** purchase, then the app sends the token, the server verifies, acknowledges, grants, stores the token, and listens for RTDN.
- **Acknowledge within 3 days.** Unacknowledged purchases are refunded after 3 days.
- **Service account:** Google Cloud Console, create a service account with the "Service Account User" role and a JSON key; then Play Console > Users & Permissions, grant it app access.
- **One-time products from the CLI:** `gplay purchases products get --package --product-id --token <PURCHASE_TOKEN>`; `acknowledge`; `consume` (consumables).
- **`purchaseState`:** 0 Purchased, 1 Canceled, 2 Pending. **`consumptionState`:** 0 yet to be consumed, 1 consumed.
- **Subscriptions: prefer v2.** `gplay purchases subscriptionsv2 get --token` (also `subscriptionsv2 cancel|defer|revoke`, and `purchases productsv2 get`). v2 `SubscriptionPurchaseV2` reflects base plans and offers; v1 `purchases subscriptions get` returns the legacy shape.
- **Actual state fields:** v1 `SubscriptionPurchase` has no `subscriptionState`; its `paymentState` is 0 pending, 1 received, 2 free trial, 3 pending deferred upgrade/downgrade, and is absent for canceled/expired subscriptions. It also exposes expiry, auto-renewal and cancellation fields. v2 uses named `SUBSCRIPTION_STATE_*` values for pending, active, paused, grace, hold, canceled, expired and pending-purchase-canceled; canceled is not yet expired. The old source invented v1 integer subscriptionState values 0 through 5. [https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptions; https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptionsv2]
- **Legacy CLI management:** `purchases subscriptions cancel|revoke --token`; `defer --json @defer.json` with `{"deferralInfo":{"expectedExpiryTimeMillis":"1709000000000"}}`. The current v1 API resource marks cancel/defer deprecated in favor of v2; verify installed CLI support rather than assuming a legacy wrapper is the current API contract. [https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptions]
- **Suspended subscriptions:** since Billing Library 8.1.0 a new `queryPurchasesAsync()` parameter includes them ("the user paused the subscription or their renewal payment method was declined"). The `Purchase` returns "`isSuspended() = true` for any suspended subscriptions. In this case, you shouldn't grant access to the purchased subscription", and instead guide the user to the subscriptions center.
- **Purchase history is yours to keep** (Billing Library 7.0.0, when `queryPurchaseHistoryAsync()` was deprecated): use `queryPurchasesAsync()` for acknowledged and pending purchases; "Consumed purchases: Developers should keep track of consumed purchases on their own servers"; canceled purchases come from the voided-purchases developer API.

Node.js verification with `googleapis`:

```javascript
const { google } = require('googleapis');

async function verifyPurchase(packageName, productId, token) {
  const auth = new google.auth.GoogleAuth({
    keyFile: '/path/to/service-account.json',
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });

  const androidpublisher = google.androidpublisher({
    version: 'v3',
    auth: await auth.getClient(),
  });

  const result = await androidpublisher.purchases.products.get({
    packageName: packageName,
    productId: productId,
    token: token,
  });

  return result.data;
}
```

The `POST /verify-purchase` handler grants only when `purchase.purchaseState === 0`. Retry transient failures, never invalid tokens:

The old source retry block retried every non-404/410 error, including authorization and argument failures, and its table equated 404 with invalid/expired and 410 with refunded/canceled. Retire that example rather than inferring entitlement from a status code. The subscription resources document reason-specific errors: 404 `notFound` calls for checking identifiers; 410 can mean a permanently invalid token, a subscription unavailable after more than 60 days expired, or an operation on an expired subscription. Read the resource and reason; query state before entitlement decisions. Retry documented transient 5xx errors and concurrent-update 409 with backoff, not authorization/argument failures. The one-time products resource does not currently supply error-table entries, so do not copy a subscription-only mapping onto it. [https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptionsv2; https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.products]

- **Do:** verify on the server; store tokens securely; acknowledge within 3 days; handle refunds and cancellations; use HTTPS; rate-limit the verification endpoint; log attempts.
- **Don't:** verify only on the client; expose service account credentials; skip acknowledging; grant before verification; ignore voided purchases; store card data.
- **Track:** verification success rate, acknowledgment rate, refund rate, churn, failed payment rate.

## Real-time developer notifications

- **Setup:** create a Pub/Sub topic; Play Console > Monetization Setup > Real-time developer notifications, enter the topic name. `gplay rtdn setup --package` prints the topic and the Console steps.
- **Decode a payload:** `gplay rtdn decode --data '{"message":{"data":"<BASE64_DATA>"}}'` or `cat payload.json | gplay rtdn decode --file -`. It accepts the Pub/Sub envelope or the raw notification.
- **`subscriptionNotification.notificationType`:** 1 `SUBSCRIPTION_RECOVERED`, 2 `SUBSCRIPTION_RENEWED`, 3 `SUBSCRIPTION_CANCELED`, 4 `SUBSCRIPTION_PURCHASED`, 7 `SUBSCRIPTION_RESTARTED`, 10 `SUBSCRIPTION_PAUSED`, 12 `SUBSCRIPTION_REVOKED`, 13 `SUBSCRIPTION_EXPIRED`. The old source mapped 7 to EXPIRED and glossed REVOKED as refunded; the official event means revoked before expiration. [https://developer.android.com/google/play/billing/rtdn-reference] The token is in `purchaseToken`. RTDN reports a change, not complete purchase state: query the Developer API before updating backend state. [https://developer.android.com/google/play/billing/rtdn-reference]

## Orders, refunds and voided purchases

- **Voided purchases:** `gplay purchases voided list --start-time 1706400000000 --end-time 1709000000000`. Remove the entitlements for these.
- **Orders:** `gplay orders get --order-id GPA....`; `orders batch-get --order-ids`.
- **Refund:** `orders refund --order-id --revoke --confirm` is destructive and irreversible and refuses without `--confirm`; `--revoke` also revokes the entitlement.

## Play Billing Library versions and deadlines

"All versions of the Google Play Billing Library have a two-year deprecation cycle." Unmaintained APKs don't need updates and existing apps still work, "but new apps and updates must use supported versions". On an unsupported version Play Console shows a warning; "On the warning's details page on the Policy status page, open the extension form." Confirm dates at https://developer.android.com/google/play/billing/deprecation-faq.

| Version | New app and update deadline | Extension deadline |
|---|---|---|
| 5 | August 31, 2024 | November 1, 2024 |
| 6 | August 31, 2025 | November 1, 2025 |
| 7 | August 31, 2026 | November 1, 2026 |
| 8 | August 31, 2027 | November 1, 2027 |
| 9 | August 31, 2028 | November 1, 2028 |

- **Find the version:** check `build.gradle`; "These dependencies only appear in APKs that require the `com.android.vending.BILLING` permission."
- **Warning after updating:** "Make sure your `AndroidManifest.xml` file contains `com.google.android.play.billingclient.version`. If it's missing, check whether manifest merging removes this attribute."
- **Upgrade skill:** Google ships an Android skill for the upgrade: `android skills add play-billing-library-version-upgrade`.

| Release | Changes |
|---|---|
| 9.1.0 (2026-06-18) | Billing Choice APIs `BillingClient.getBillingChoiceInfoAsync()`, `showBillingProgramInformationDialog()` |
| 9.0.0 (2026-05-19) | Blocked Play Store response changed from `ERROR` to `BILLING_UNAVAILABLE` (needs AndroidX core 1.9 or later); `DeveloperProvidedBillingDetails.getLinkUri()` now `@Nullable` (handle both null and `""`); targetSdkVersion 35; in-app messaging for opt-in price increases |
| 8.3.0 (2025-12-23) | External payments APIs (`BillingProgram.EXTERNAL_PAYMENTS`, `enableBillingProgram(EnableBillingProgramParams)`, `BillingFlowParams.Builder.enableDeveloperBillingOption`); abandoned external flows return `BillingResponseCode.USER_CANCELED (1)` with debug message `BILLING_ACTIVITY_PAUSED` (previously `BillingResponseCode.ERROR (6)`) |
| 8.2.1 (2025-12-15) | Fixes `isBillingProgramAvailableAsync` and `createBillingProgramReportingDetailsAsync`: "Update to version 8.2.1 to use these APIs introduced in 8.2.0" |
| 8.2.0 (2025-12-09) | `enableBillingProgram`, `isBillingProgramAvailableAsync`, `createBillingProgramReportingDetailsAsync`, `launchExternalLink` for external content links and external offers; deprecated `enableExternalOffer`, `isExternalOfferAvailableAsync`, `createExternalOfferReportingDetailsAsync`, `showExternalOfferInformationDialog` |
| 8.1.0 (2025-11-06) | Suspended subscriptions in `queryPurchasesAsync()`; `SubscriptionProductReplacementParams` with `KEEP_EXISTING` (`SubscriptionUpdateParams setSubscriptionReplacementMode` "will be deprecated"); pre-order API `getPreorderDetails()`; minSdkVersion 23 |
| 8.0.0 (2025-06-30) | One-time products with multiple purchase options and offers; `queryProductDetailsAsync()` returns unfetched products with status codes (`ProductDetailsResponseListener.onProductDetailsResponse()` signature change); `BillingClient.Builder.enableAutoServiceReconnection()`; `launchBillingFlow()` sub-response codes `PAYMENT_DECLINED_DUE_TO_INSUFFICIENT_FUNDS`, `USER_INELIGIBLE`, `NO_APPLICABLE_SUB_RESPONSE_CODE` (default). Removed `queryPurchaseHistory()`, `querySkuDetailsAsync()`, parameterless `enablePendingPurchases()`, `queryPurchasesAsync(String skuType, ...)` |
| 7.0.0 (2024-05-14) | Installment subscriptions; `enablePendingPurchases(PendingPurchasesParams)`; prepaid plan pending transactions. Removed `enableAlternativeBilling()`, `ProrationMode` (use `ReplacementMode`), `setOldSkuPurchaseToken()`; minSdkVersion 21, targetSdkVersion 34 |

## Play Integrity API

"The Play Integrity API helps you check that user actions and server requests are coming from your genuine app, installed by Google Play, running on a genuine and certified Android device."

- **Verdicts:** `accountDetails` (installed or paid on Google Play: check `appLicensingVerdict` is `LICENSED`); `appIntegrity` (check `appRecognitionVerdict` is `PLAY_RECOGNIZED`); `deviceIntegrity` (genuine certified Android device or Google Play Games for PC); `requestDetails` (verify `requestHash` or `nonce`).
- **Check the baseline first:** `requestDetails` match (the `requestHash` or `nonce`), `appRecognitionVerdict` is `PLAY_RECOGNIZED`, `appLicensingVerdict` is `LICENSED`; only then tier on device trust.
- **Device labels, most to least trusted:** `MEETS_STRONG_INTEGRITY` (Android 13+: "requiring hardware-backed security signals and a recent security patch"); `MEETS_DEVICE_INTEGRITY` (Android 13+) and `MEETS_STRONG_INTEGRITY` (pre-Android 13); `MEETS_DEVICE_INTEGRITY` (pre-Android 13); `MEETS_BASIC_INTEGRITY` ("The weakest trust tier, just before receiving no device labels at all"). The full set comes after opting in through Play Console; "Fewer devices are in the higher trust tiers", so tier enforcement instead of relying only on the top tiers.
- **Opt-in verdicts:** `appAccessRiskVerdict` (apps that could capture the screen, display overlays or control the device), `playProtectVerdict`, `recentDeviceActivity` (anomalously high request volume), `deviceRecall` (beta).

| | Standard request | Classic request |
|---|---|---|
| Use | Any app, on demand: "Frequent (on-demand check for any action or request)" | "Infrequent (one-off check for highest value actions or most sensitive requests)" |
| Minimum Android | Android 6.0 (API level 23) (library v1.4.0 and later) | Android 6.0 (API level 23) (library v1.4.0 and later) |
| Warm up | Required ("a few seconds") | None |
| Latency | "a few hundred milliseconds on average" | "a few seconds on average" |
| Binding | `requestHash` | `nonce`, with server-side logic |
| Replay | Mitigated automatically by Google Play | |

- **Quota:** "By default, your app can make up to 10,000 total requests per day across all installs. You can request to increase your daily maximum."
- **Don't cache verdicts:** "Caching integrity verdicts increases the risk of proxying"; make a standard request on demand instead. Request an app access risk verdict "as close as possible to the time of the action or server request" you defend. Send a range of responses from your server rather than a binary Allow/Deny, for example "Allow, Allow with limits, Allow with limits after CAPTCHA completion, and Deny".
- **Hash what you bind.** "Data that you use for the `requestHash` and `nonce` fields is visible in cleartext to your app, and to Google. You should encrypt or hash the data before passing it to the Play Integrity API." `requestHash` has "a maximum length of 500 bytes": compute a digest of all relevant request parameters (for example SHA256 of a stable request serialization); "Never put any sensitive information as plain-text into the requestHash argument"; the server recomputes the digest and, if they do not match, "the request is not trustworthy".
- **Standard flow:** prepare once (`IntegrityManagerFactory.createStandard(context)`, `PrepareIntegrityTokenRequest.builder().setCloudProjectNumber(...)`, `prepareIntegrityToken()`), then on demand `integrityTokenProvider.request(StandardIntegrityTokenRequest.builder().setRequestHash(requestHash).build())` and send `response.token()` to the server.
- **Warm-up** takes "a few seconds and the majority of all warm ups are under 10s"; use a timeout like 1 minute. Each app instance can prepare at most 5 times per minute. When the provider expires you get `INTEGRITY_TOKEN_PROVIDER_INVALID`: request a new provider.
- **Server decode:** create a service account in the linked Google Cloud project, get an access token with the playintegrity scope, and call `playintegrity.googleapis.com/v1/PACKAGE_NAME:decodeIntegrityToken -d '{ "integrity_token": "INTEGRITY_TOKEN" }'`. Google Play "automatically prevents integrity tokens from being reused many times": repeatedly decrypting the same token clears the verdicts (device recognition verdict empty; app recognition and app licensing `UNEVALUATED`; opt-in verdicts `UNEVALUATED` or empty).
- **Platforms with official samples:** Java, Unity (Play Integrity Unity Plugin v2.0.0+ for `StandardIntegrityManagerV2`), Unreal, Native C.

## Prove it

- **Products are live:** after create, the purchase option is activated with `gplay purchase-options batch-update-states`, and `gplay onetimeproducts get` no longer shows `DRAFT`.
- **Subscription listings landed:** `gplay subscriptions get --pretty` shows every locale, titles at most 55 characters, descriptions at most 80, at most 4 benefits.
- **Verification works end to end:** a test purchase token returns `purchaseState` 0 from `gplay purchases products get --token`, and the backend acknowledges it within 3 days.
- **Refunds remove access:** `gplay purchases voided list` over the last window returns no token that still holds an entitlement in your database.
- **RTDN arrives:** `gplay rtdn decode` on a received Pub/Sub message shows a `notificationType` and `purchaseToken`.
- **Billing Library is current:** the app's Billing Library major version has not passed its "New app and update deadline" in the table, the merged manifest contains `com.google.android.play.billingclient.version`, and Play Console's Policy status shows no unsupported-version warning.
- **The paywall meets the Subscriptions policy:** the billed amount and period are the most prominent price, the auto-renew line and trial length and its end charge are readable without a tap, access to available free content is clear, terms and currency are localized in every language, the subscription name doesn't say "Free Trial", and account settings link to the Play Subscription Center or your cancel flow. Apply the policy's dismiss control for offers of a free trial or subscription where free content is available; the old check made it universal. The stricter source preference for a visible close control remains in [app-growth PAYWALLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/PAYWALLS.md). [https://support.google.com/googleplay/android-developer/answer/9900533]
- **Integrity tokens are bound:** the server recomputes `requestHash` from the request and rejects mismatches, and does not decrypt the same token repeatedly.
