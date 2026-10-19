# Concepts

RevenueCat sits between your app and the stores: its SDK runs the store purchase UI, posts every purchase token to the RevenueCat backend for verification before your app sees confirmation, and the backend computes which access the customer owns. Most outcomes come down to keeping two reads apart: Offerings say what to sell, CustomerInfo says what the user owns ("Most confusion comes from mixing these two"), and access is gated on one field, `entitlement.isActive`. Several sources here are chapters of RevenueCat's Android SDK handbook; names tagged [Kotlin] are Android SDK names, not Flutter or React Native names. For Flutter and React Native calls see [FLUTTER.md](FLUTTER.md) and [REACT-NATIVE.md](REACT-NATIVE.md).

**Contents:** [What RevenueCat replaces](#what-revenuecat-replaces) · [RevenueCat or raw billing](#revenuecat-or-raw-billing) · [The object model](#the-object-model) · [Products](#products) · [Entitlements](#entitlements) · [Offerings and packages](#offerings-and-packages) · [Placements and targeting](#placements-and-targeting) · [Subscription options and offers (Google Play)](#subscription-options-and-offers-google-play) · [CustomerInfo](#customerinfo) · [Caching and offline](#caching-and-offline) · [Subscription states and access](#subscription-states-and-access) · [The purchase call](#the-purchase-call) · [One-time products](#one-time-products) · [Plan changes](#plan-changes) · [Price changes](#price-changes) · [Cancellations](#cancellations) · [Prove it](#prove-it)

## What RevenueCat replaces

- **Three raw systems fold into one SDK and one dashboard.** On Android: `BillingClient` in the client becomes the `Purchases` SDK in your app; the Google Play Developer API on your server becomes the RevenueCat backend (RevenueCat managed); Real Time Developer Notifications (RTDN) via Cloud Pub/Sub become RevenueCat webhooks delivered to your server (see [BACKEND-AND-WEBHOOKS.md](BACKEND-AND-WEBHOOKS.md)).
- **Call path:** `Your App -> Purchases SDK -> RevenueCat Backend -> Google Play Developer API -> Google Play`. The SDK talks to the store for the purchase UI and to the RevenueCat backend for verification and entitlement storage. Your server talks to the RevenueCat backend, not to the store.
- **RevenueCat is in the verification path.** After a purchase completes, the SDK posts the token to RevenueCat before your app sees confirmation: "You trade a network round trip for not having to build server side verification yourself." RevenueCat always validates transactions: Test Store purchases itself, real store purchases through the platform.
- **The SDK singleton is configured once at startup** and needs no connection management: "It reconnects and queues calls for you." [Kotlin: `Purchases.sharedInstance`, `Purchases.configure(...)`] Duplicate anonymous users mean `configure` ran more than once per process, or an unstable id was passed as the App User ID.
- **Not replaced:** the store consoles (you still create products, base plans and offers there), your app UI (you build the paywall and display prices; RevenueCat supplies data, RevenueCat Paywalls are optional, see [PAYWALLS.md](PAYWALLS.md)), and your authentication (you bring your own user IDs and pass them to the SDK).
- **The tradeoff is a dependency.** A RevenueCat backend outage affects purchase verification. Two mitigations: the disk cache of CustomerInfo (automatic, always on) returns the last known server state, and Offline Entitlements computes entitlements on device from local store purchases. "Neither is a full substitute for a reachable backend. Use both where they apply." The Android handbook says Offline Entitlements runs only when explicitly configured; the customer-info docs say it grants entitlements temporarily, automatically. Confirm in the current docs. Details in [Caching and offline](#caching-and-offline).

### Client side: raw Play Billing Library (PBL) vs RevenueCat

| Concern | Raw PBL | RevenueCat |
|---|---|---|
| BillingClient setup and configuration | You write | Handled internally |
| Connection lifecycle and reconnection | You write | Handled internally |
| PurchasesUpdatedListener | You write | Replaced by purchase callbacks |
| `queryProductDetailsAsync()` | You write | Replaced by `awaitOfferings()` / `awaitGetProducts()` [Kotlin] |
| `launchBillingFlow()` | You write | Called internally by `awaitPurchase()` [Kotlin] |
| Acknowledgement after purchase | You write | Handled automatically |
| Consumption of consumables | You write | Handled automatically (mark the product consumable in the dashboard) |
| `queryPurchasesAsync()` on launch | You write | Handled internally on connection |
| Retry logic for transient errors | You write | Handled internally by SDK |
| BillingResponseCode handling | You write | Abstracted to PurchasesErrorCode |
| In-app payment recovery messages | You write | Automatic [Kotlin: `showInAppMessagesAutomatically = true`] |
| Subscription option selection for offers | You write | `defaultOption` selected automatically |

### Server side

| Concern | Raw PBL | RevenueCat |
|---|---|---|
| Google Play Developer API integration | You build | RevenueCat backend |
| Service account credential management | You manage | Configured once in RC dashboard |
| Receipt verification on every purchase | You build | Automatic |
| Purchase token validation and deduplication | You build | RevenueCat backend |
| `linkedPurchaseToken` chain traversal | You build | RevenueCat backend |
| RTDN processing and dispatch | You build | RevenueCat processes, sends webhooks |
| Cloud Pub/Sub setup | You set up | Not needed |
| Subscription state machine on backend | You build | CustomerInfo computed by RC |
| Entitlement computation across 7 states | You build | `isActive` computed by RC |
| Grace period / account hold tracking | You build | `billingIssueDetectedAt` |
| Cancellation with access-until-expiry logic | You build | `isActive` + `unsubscribeDetectedAt` |
| Price cohort tracking | You build | RC backend handles |
| Product-to-entitlement mapping | You build | Configured in RC dashboard |

The two tables come from the Android handbook, which marks Cloud Pub/Sub setup "Not needed". The server-notification docs call Google RTDN through Pub/Sub "strongly recommended" for RevenueCat (see [STORE-SETUP.md](STORE-SETUP.md)). Confirm in the current docs.

### Your responsibility either way

| Concern | Notes |
|---|---|
| User authentication system | You bring your own; pass user ID to RC |
| Your own database of users | RC is not your primary user database |
| Premium content server side | Verify via RC REST API or webhooks |
| Webhook receiver endpoint | You build; RC sends, you receive |
| Play Console product creation | Still done in Play Console |
| Subscription deferral | Direct Google Play API call |
| Subscription revocation | Direct Google Play API call |
| Alternative billing programs | Limited RC support; may need raw PBL |
| App UI (paywalls, onboarding) | You build (RC Paywalls UI optional) |
| Push notifications for payment issues | You build on top of webhook events |

- **Split concerns are yours to glue.** If RevenueCat verifies the token but you still gate premium content on your API, you own the integration between them.

## RevenueCat or raw billing

1. **Keep a raw billing path for the gaps.** If the app needs subscription deferral, revocation, or an alternative billing program RevenueCat does not yet cover, keep raw PBL for those specific calls regardless of the main choice.
2. **Default to RevenueCat when building from scratch.** If you would otherwise build receipt verification, an RTDN pipeline and a subscription state machine, the server-side table lists at least eight concerns RevenueCat removes: "Choose RevenueCat unless you have a concrete reason to own that stack."
3. **With a mature billing backend the gain is smaller.** Weigh verified tokens and tested state handling you already own against RevenueCat's client simplifications and dashboard-driven catalog.
4. **Staff the "your responsibility" rows.** RevenueCat does not replace auth, the user database, paywall UI, or the premium content gate; passing the App User ID and verifying entitlements server side via REST API or webhooks is still on you.
5. **Map every requirement to a row.** Anything in "your responsibility either way" costs the same both ways and should not drive the decision.

```text
need custom RTDN pipeline?      -> raw PBL only if you must own it end to end
need deferral or revocation?    -> keep a raw PBL path for those API calls
need fast time to production?   -> RevenueCat, then add raw PBL escape hatches later
```

## The object model

| Concept | What it is | Where you define it |
|---|---|---|
| Product | A subscription, base plan, or one time purchase | The store console (Test Store products in RevenueCat) |
| Package | A Product wrapped with a type label (Monthly, Annual, Lifetime, custom). The unit your paywall displays | RevenueCat dashboard |
| Offering | A group of Packages. One Offering is marked Current and returned as `current` | RevenueCat dashboard |
| Entitlement | A logical access level your app checks, such as `"pro_access"`. Products are attached to Entitlements | RevenueCat dashboard |

- **CustomerInfo is the runtime snapshot** of the user's purchase history and active Entitlements, computed and cached by RevenueCat.
- **Name the object before answering a question.** Say whether it is about a Product, Package, Offering or Entitlement ("These are not interchangeable"), and whether it needs Offerings or CustomerInfo.
- **The store holds the billable SKU; RevenueCat decides surfacing.** The store console owns products, base plans, offers and prices (e.g. `premium_monthly`, base plan `p1m`, an intro offer). The RevenueCat dashboard owns Entitlements, Offerings, Packages and Targeting (e.g. `pro` entitlement, `default` offering, `$rc_monthly` package). "Play Console holds the billable SKU. RevenueCat decides which SKU gets surfaced to which user and under which entitlement key."
- **Example identifiers vary across sources** (`pro_access`, `pro`, `premium`); they are examples, not reserved names.

## Products

- **Two kinds:** Test Store products, created in RevenueCat (**Products > + New product > Test Store**), and real store products.
- **Import from the store (recommended)** via **Products > + New > Import Products**. Google one-time products must be backwards compatible to auto-import. RevenueCat pulls the Play catalog through the service account (see [STORE-SETUP.md](STORE-SETUP.md)).
- **Manual entry:** the identifier "exactly as it appears in the store"; for Google Play add the subscription ID and base plan ID. Display names are unique within an app. Bulk changes go through the Product Editor (CSV).
- **Unknown purchased products are tracked and auto-created.**
- **Google Play identifiers map to base plans:** `<subscription_id>:<base-plan-id>` (products from before February 2023: `<subscription_id>`). Old SDKs only see base plans and offers marked backwards compatible.
- **Period strings are ISO 8601:** `"P1M"`, `"P1Y"`, null for one-time. `billingPeriod.value` is the count in the period's unit, not days: `P1W` gives `value = 1`, `unit = WEEK`. Build labels from value and unit (DAY, WEEK, MONTH, YEAR), else fall back to the ISO string.
- **Never call the store's catalog endpoints yourself.** Do not call Google Play Developer `monetization.subscriptions` or `monetization.onetimeproducts` from your app or backend. To automate catalog edits (e.g. seeding dozens of offerings across environments), use the RevenueCat REST API for products, entitlements and offerings (see [CLI-AND-API.md](CLI-AND-API.md)); the store console stays the product source of truth.

## Entitlements

- **An entitlement is "a level of access, features, or content that a user is 'entitled' to".** It is scoped to a project and shared across all apps in it. "Most apps only have one entitlement" (e.g. `pro_access`; an optional second tier like `team_access`).
- **Pick a stable identifier.** "Renaming an entitlement later means rewriting every feature gate." Create it in **Product catalog > Entitlements > + New entitlement**.
- **Attach every product that unlocks access.** Many products can unlock one entitlement (monthly, annual and lifetime all unlock `pro_access`), and one product can unlock many entitlements. Forgetting to attach a new product "could lead to your users making purchases that don't unlock access".
- **Attachments are retroactive.** Attaching an entitlement grants it to past purchasers; detaching removes it.
- **Duration follows the product.** Subscriptions unlock for the subscription duration; "non-consumable and consumable purchases that are attached to an entitlement will unlock that content **forever**". Consumables are usually not attached.
- **Prefer entitlements over product IDs** everywhere: `activeSubscriptions` exists, but "You should be using entitlement though".

## Offerings and packages

- **An Offering is a group of Packages; a Package holds the equivalent products across iOS, Android and web.** Offerings are optional, but they enable Paywalls, Experiments and Targeting. A RevenueCat Paywall is paired to a single Offering. Any product can be in an Offering even without an entitlement.
- **Use `current`, not hardcoded identifiers.** "We strongly recommend utilizing the `current` Offering feature." Current may vary by experiment, targeting, or the default Offering. Offering changes take effect for all users right away, with no app release (the Android handbook says edits propagate on the next app launch).
- **The Offering identifier "cannot be changed later".**
- **Package identifiers:** `$rc_monthly`, `$rc_annual`, and so on for standard durations, or a custom identifier. Decide the identifier so paywall code keeps working when you swap the product. Package display order in the dashboard is reflected in the SDK.
- **Package types (docs):** `UNKNOWN`, `CUSTOM`, `LIFETIME`, `ANNUAL`, `SIX_MONTH`, `THREE_MONTH`, `TWO_MONTH`, `MONTHLY`, `WEEKLY`. The Android handbook lists the same standard types and says anything else is `CUSTOM`.
- **Two access patterns.** Named slots (`.monthly`, `.annual`, `.weekly`) for fixed paywalls with known durations; iterate `availablePackages` for dynamic layouts, unknown durations or custom types. Flutter also has `.getPackage("<package_id>")`; Web has `.packagesById["<package_id>"]`. The product is `.storeProduct` in Flutter and `.product` in React Native and Web.
- **Removing a package hides a plan from new customers only.** It does not remove products, transactions or entitlement links; existing subscribers keep renewing. "Apple has no option that blocks new purchases only."
- **Build the paywall dynamically:**

| Do | Don't |
|---|---|
| Make paywalls dynamic | Hardcode product IDs |
| Use default package types | Use custom identifiers in place of default options |
| Allow any number of products | Support only a fixed number of products |
| Support different or no free trial | Hardcode free trial text |

- **Plan a catalog change by where it lives:** a new product starts in Play Console; repackaging (a new offering, targeting, entitlement mapping) stays in RevenueCat; create the entitlement first if none matches; plan the placement name and targeting rule (OS version, country, custom attribute) if users should see different offerings.
- **Common mistakes:** creating an offering before importing the product ("Import first, then wire"); hard-coding product IDs in paywall UI ("Use package identifiers so you can swap products without an app release"); forgetting to mark an offering Current.
- **A package is unexpectedly null** when the offering is not marked Current, the product is not attached to the package, or the store has not finished propagating.

## Placements and targeting

- **Placements pick an offering per spot in the app.** In **Targeting > Placements**, create a placement (e.g. `paywall_upsell`) and add rules mapping users to offerings by predefined dimensions (OS version, country) or any custom attribute.
- **Ask for the placement's offering and fall back to `current`.** Flutter `Purchases.getCurrentOfferingForPlacement(placementIdentifier: ...)`, React Native `Purchases.getCurrentOfferingForPlacement(...)` [Kotlin: `offerings.getCurrentOfferingForPlacement("paywall_upsell") ?: offerings.current`]. Rules change later with no app update.
- **Fetch a specific offering by identifier** (experiment or segment paywall): Flutter `offerings.getOffering("experiment_group")`, React Native `offerings.all["experiment_group"]`. You can also write local logic that picks offering identifiers.

## Subscription options and offers (Google Play)

The Play hierarchy maps onto RevenueCat types. These type names are from the Android handbook [Kotlin]; `SubscriptionOption` is a Play base plan and offer concept.

| Google Play | RevenueCat |
|---|---|
| Subscription (product ID) | `StoreProduct` |
| Base Plan | `SubscriptionOption` (base plan) |
| Offer | `SubscriptionOption` (offer) |
| Group of base plans grouped in dashboard | `Package` inside an `Offering` |

- **`StoreProduct`** has a `subscriptionOptions` list and a `defaultOption`. **`SubscriptionOption`** (base plan or offer) has `pricingPhases`, `tags`, `id`. **`PricingPhase`** is one billing segment (intro trial, intro price, or recurring) with `billingPeriod`, `price`, `offerPaymentMode`, `recurrenceMode`. [Kotlin]
- **How `defaultOption` is chosen:** (1) filter out options tagged `"rc-ignore-offer"` or `"rc-customer-center"`; (2) pick the option with the longest free trial or the cheapest first phase; (3) fall back to the base plan if no offer qualifies.
- **The SDK does not filter trial eligibility.** Google Play only returns offers the user is eligible for, so a consumed free trial simply does not appear and the base plan becomes default.
- **Standard paywall: pass the Package** and let `defaultOption` apply. For a specific offer (win back, promo, tag selected), find the option by tag or ID and pass that, and "Always fall back to `defaultOption`" so the paywall works when the targeted offer is absent.
- **Trial detection:** the first pricing phase is the trial or intro when present; detect it with `offerPaymentMode == FREE_TRIAL`. [Kotlin]
- **Prepaid base plans** use the same option API; their phases report `RecurrenceMode.NON_RECURRING`. Accepting pending purchases for prepaid plans needs a configuration-time flag [Kotlin: `.pendingTransactionsForPrepaidPlansEnabled(true)`].
- **EU personalized pricing:** set the personalized-price flag on the purchase params so Play shows the customized price notice [Kotlin: `.isPersonalizedPrice(true)`].

## CustomerInfo

- **Check status whenever you decide which UI to show,** "typically on app launch and before presenting a paywall". Flutter reads `customerInfo.entitlements.all[id].isActive`; React Native checks `customerInfo.entitlements.active[id]` is defined. Any active entitlement: Flutter `entitlements.active.isNotEmpty`, React Native `Object.entries(customerInfo.entitlements.active).length`.
- **Empty is normal before any purchase.** "CustomerInfo will be empty if no purchases have been made and no transactions have been synced. This means that entitlements may not exist in CustomerInfo even if they have been set up in the RevenueCat dashboard."
- **Updates are pulled, never pushed.** "RevenueCat does *not* push `CustomerInfo` updates to your app; updates only happen when the SDK makes an outbound network request to RevenueCat." The update listener (Flutter and React Native `Purchases.addCustomerInfoUpdateListener`) fires on a change received from `getCustomerInfo()`, a purchase, or `restorePurchases()`, on the current device, at launch and throughout the life of the app.
- **Also fetch on launch, not only listen.** The Android handbook: "The listener does not fire when the SDK starts with a cache hit and nothing changed." Register the listener so UI reacts to purchases, restores and background refreshes without polling.
- **From your own backend use the REST API:** `GET https://api.revenuecat.com/v1/subscribers/<app_user_id>` (see [BACKEND-AND-WEBHOOKS.md](BACKEND-AND-WEBHOOKS.md) and [CLI-AND-API.md](CLI-AND-API.md)).

### CustomerInfo fields

| Field | Meaning |
|---|---|
| Request Date | Server date, affected by device cache; do not compute elapsed time from it, use device time |
| Original App User ID | The one ID kept after merges |
| First Seen | When the customer first appeared |
| Original Application Version | iOS only; "1.0" in sandbox |
| Original Purchase Date | iOS only |
| Management URL | App Store, Play Store, Amazon, Paddle portal, RevenueCat Web Billing Customer Portal, or configured Stripe Customer Portal URL; null with no active subscription or no Stripe portal configured; with several platforms it uses the `X-Platform` header OS, else the farthest-future expiration |
| All Purchased Product Identifiers, All Expiration Dates By Product, All Purchase Dates By Product | Per-product history |
| Non Subscription Transactions | One-time purchases |
| Latest Expiration Date | Across products |
| Active Subscriptions | Product IDs; on Play a set of `"subscriptionId:basePlanId"` strings. "You should be using entitlement though" |
| Entitlements | The `EntitlementInfo` map |

### EntitlementInfo fields

| Field | Meaning |
|---|---|
| Identifier, Product Identifier | The entitlement and the product that unlocked it |
| Is Active | Access right now: the only gate |
| Will Renew | Renews at period end; may lag store state by a "multiple hour delay" |
| Period Type | Trial, Promotional, Intro, Normal (the Android handbook also names prepaid) |
| Latest Purchase Date, Original Purchase Date | Purchase timestamps |
| Expiration Date | When paid access ends; null for lifetime; the trial expiration while in trial |
| Store | App Store, Mac App Store, Play Store, Amazon Appstore, Stripe, Promotional |
| Is Sandbox | Sandbox purchase |
| Unsubscribe Detected At | Canceled but may still have time left; "does not mean that the entitlement is inactive" |
| Billing Issue Detected At | Payment problem; null again once resolved; "does not mean that the entitlement is inactive" |
| Ownership Type | Family sharing, iOS only |
| Product Plan Identifier | Google base plan |

Platform Server Notifications reduce these delays (see [STORE-SETUP.md](STORE-SETUP.md)).

## Caching and offline

- **Reads come from cache first.** The Android handbook: fetching CustomerInfo returns the disk cache immediately, then refreshes from the network in the background, so entitlement checks stay fast, even offline. `getCustomerInfo` "is safe to call repeatedly"; the SDK caches the latest CustomerInfo whenever it updates. Default fetch policy `cachedOrFetched` returns cached data if available (even if stale), or fetches. Debug log line: `[Purchases] - DEBUG: Vending customerInfo from cache`.
- **When the cache refreshes:** after "5 minutes with the app in the foreground", "25 hours with the app in the background", or when "a purchase is made or restored". It updates only if you call `getCustomerInfo()`, purchase or restore, "so it's a good idea to call `getCustomerInfo()` any time a user accesses premium content."
- **Force a fresh read after a server-side change** (a dashboard grant, promo, refund or support action) with `invalidateCustomerInfoCache()` [Kotlin: `CacheFetchPolicy.FETCH_CURRENT`]. React Native's reference warns it "Can leave app in a stale state if misused." Calling `logOut` clears the cache.
- **Offerings are cached in memory only.** Products and offerings are cached at configure and refreshed if changed or after 5 minutes. "Currently `offerings` do not persist between app launches, so you will need to cache this data and display them yourself when the app is offline."
- **Offline, cached access lasts up to three days.** `app_user_id` and CustomerInfo are cached between launches; an entitlement active when the user went offline "will remain active for up to three days".
- **Offline Entitlements** (when RevenueCat servers can't respond): the SDK verifies Apple, Google and Amazon purchases on device and grants entitlements temporarily. Purchases are processed later with no data lost; they don't appear in charts and webhooks until pushed; there is no cross-platform recognition meanwhile; they do not work for one-time purchases (an error is returned instead); they are disabled when your app completes transactions itself.
- **Dashboard numbers lag too:** Overview metrics are usually real time (New and Active Customers may be cached 1 to 2 hours); Customer Lists refresh every two hours.

## Subscription states and access

- **Seven Play states collapse into `isActive`,** computed on the backend from Google's `SubscriptionPurchaseV2` resource. Do not reimplement this on the client.

| Play state | Grants access |
|---|---|
| ACTIVE | Yes |
| IN_GRACE_PERIOD | Yes |
| CANCELED (before `expirationDate`) | Yes |
| ON_HOLD | No |
| PAUSED | No |
| EXPIRED | No |
| PENDING | No |

- **Gate features on `isActive == true`. "Nothing else."** Do not check the store transaction to decide access.
- **Use the other fields only for messaging,** checked in this order on an active entitlement:

| Signal | Message |
|---|---|
| `billingIssueDetectedAt != null` | "Payment problem, update method" (fix-payment prompt) |
| `unsubscribeDetectedAt != null` | "Access ends on `expirationDate`" (renewal reminder while access is valid) |
| `willRenew == false` alone | "Will not renew this period" |
| `periodType == TRIAL` or `INTRO` | "Trial or intro pricing in effect" |

- **Decide before coding:** which entitlement gates the feature; a plain boolean or also *why*; cached (fast, possibly stale) or fresh (server-authoritative); once on launch or live changes.
- **Grace periods and billing retries** belong to [BILLING-AND-RECOVERY.md](BILLING-AND-RECOVERY.md).

## The purchase call

- **One call runs the whole flow.** On Android the SDK builds the billing params from the Package, launches the store sheet, waits for the result, posts the purchase token to RevenueCat, the backend verifies it (`purchases.subscriptionsv2.get` or `purchases.products.get`), and the SDK acknowledges (subscriptions, non-consumables) or consumes (consumables) "within the 3 day Google window". "Retriable failures are retried automatically."
- **RevenueCat finishes transactions for you** (finishes on iOS, acknowledges and consumes on Android) unless you tell the SDK your app completes them (see [MIGRATION.md](MIGRATION.md)). Once integrated, do not call the store's product query, acknowledge or consume APIs yourself: "The SDK owns the `BillingClient` instance."
- **Gate on the returned CustomerInfo,** not the transaction. The transaction (order ID, null for restored purchases; purchase token; product IDs; purchase time in epoch millis; type `SUBS` or `INAPP`) is only for logging or your backend.
- **Restore** (reinstall or device switch) queries store purchases, posts everything found to RevenueCat and returns fresh CustomerInfo; gate the same way, and with no active entitlement show "No active purchases found".
- **User cancellation is not an error to surface.** Check the cancel flag first, then the error code. Error handling lives in [ERRORS-AND-SECURITY.md](ERRORS-AND-SECURITY.md); restore in [FLUTTER.md](FLUTTER.md) and [REACT-NATIVE.md](REACT-NATIVE.md).

## One-time products

- **Consumable or non-consumable is a dashboard flag.** Mark consumables in the RevenueCat dashboard so the SDK consumes them. Non-consumable Google products (e.g. lifetime) must be configured as non-consumable in the dashboard, otherwise RevenueCat consumes them and Google allows repurchase (Android SDK 7.11.0+).
- **Restore depends on that flag from v10.** v10.0.0 (Flutter and React Native, 2026-04-15) moved to Billing Library 8.3.0 and removed the workaround that restored consumed one-time products: without a login system, configure one-time products correctly as consumable or non-consumable or customers "won't be able to restore them from version 10.0.0 onward". Consumables and non-renewing subscriptions can only be restored with custom App User IDs.
- **Prep:** create the product in the store console as a one-time product; in RevenueCat attach it to an offering and package and flag it consumable if needed. Use entitlements (e.g. `lifetime_access`) so access logic stays decoupled from product IDs; fall back to `nonSubscriptionTransactions` matched by `productIdentifier`.
- **The purchase call waits for backend verification,** then the SDK acknowledges non-consumables and consumes consumables automatically.
- **Outcomes:**

| Outcome | Handling |
|---|---|
| Success | Grant from entitlements or `nonSubscriptionTransactions` |
| User cancel | Swallow silently |
| Pending payment (`PaymentPendingError`) | Show a pending message; the entitlement arrives later through the CustomerInfo listener |
| Other error | Surface the error message |

- **"Do not grant access from optimistic local state."** Trust the purchase result's CustomerInfo; pending purchases grant nothing until paid, so register the update listener.
- **Server-side provisioning:** non-renewing purchases emit `NON_RENEWING_PURCHASE`; the old source said `INITIAL_PURCHASE` fires for every new non-subscription purchase. Fulfillment follows the consumable/non-consumable contract. [RevenueCat/ai-toolkit, rc-one-time-products; https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields]
- **Offline Entitlements do not cover one-time purchases.**

## Plan changes

The complete [plan-change contract](BILLING-AND-RECOVERY.md#upgrades-downgrades-and-crossgrades) owns replacement modes, platform behavior and SDK calls.

## Price changes

Store-controlled price changes and their RevenueCat events are in [BILLING-AND-RECOVERY.md](BILLING-AND-RECOVERY.md#price-changes).

## Cancellations

Cancellation ownership, detection and the deletion boundary are in [BILLING-AND-RECOVERY.md](BILLING-AND-RECOVERY.md#cancellations); the [management link](BILLING-AND-RECOVERY.md#read-state-dont-compute-it) opens the appropriate store screen.

## Prove it

- **Two reads, two answers:** fetching offerings returns a non-null `current` with packages; fetching CustomerInfo before any purchase may show no entitlements at all, and that is expected.
- **Every gate reads `isActive`:** search the app for checks on product IDs, `activeSubscriptions` or transactions used to grant access; there should be none.
- **Test matrix passes:** fresh purchase gives `isActive` true (premium); grace period true (premium plus billing warning); canceled before expiration true (premium plus expiry notice); on hold, paused, expired and pending (no payment yet) all false.
- **The gate flips when the listener fires** after a purchase; a forced fresh fetch updates after a backend grant (promo, refund, support action); after `logOut` CustomerInfo reflects an anonymous user; an offline launch still gates from cache.
- **A test purchase of each product** makes the expected entitlement active; a Google lifetime product is flagged non-consumable in the dashboard (otherwise RevenueCat consumes it and Google allows repurchase).
- **Each plan-change call sets its intended replacement policy explicitly,** including whether a trial continues or ends, and uses an allowed mode for the concrete plan transition above. [https://developer.android.com/google/play/billing/subscriptions#replacement-recommendations]
