# Mobile

Stripe in a React Native or Flutter app is a native Payment Sheet driven by objects your server creates: the app never creates PaymentIntents, Customers or keys itself, and it never decides that a payment succeeded. Most outcomes are decided before any code: whether what you sell is allowed through Stripe in the app at all. Digital goods consumed in the app (subscriptions, premium content, in-game currency) generally must use Apple's and Google's in-app purchase systems, with exceptions by region (notably the United States). For in-app subscriptions through the stores, use [revenuecat SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/SKILL.md).

## Digital goods: what the stores allow

Stripe's own statements:

- **iOS (US only):** if you sell digital products, content and subscriptions in the US, you can redirect customers to an external payment page using Stripe Checkout. Physical goods use in-app payments.
- **Android (US only):** you can process payments directly in the app with a third-party processor like Stripe.
- **Stripe's subscriptions guide warns:** for digital products or services consumed in the app (subscriptions, in-game currencies, game levels, premium content, unlocking a full version) you must use Apple's in-app purchase APIs, with exceptions including one-to-one personal services and apps based in specific regions (Stripe links `https://support.stripe.com/questions/changes-to-mobile-app-store-rules`).
- **Apple Pay for digital goods, the sources differ:** the Payment Links page says your iOS app can accept Apple Pay through Payment Links for digital products sold in the United States or the EEA, and not in other regions; the digital goods overview says US only for the external payment page. Confirm in the current docs and Apple's guidelines.

The stores' own rules:

| Rule | Says |
|---|---|
| Apple 3.1.1 | Unlocking features or functionality (subscriptions, in-game currencies, game levels, premium content, a full version) must use in-app purchase; no license keys, AR markers, QR codes or crypto to unlock content. IAP credits and in-game currencies may not expire; provide a restore mechanism. |
| Apple 3.1.1(a) | Developers may apply for entitlements to link to their own website for digital content. These entitlements are not required for buttons, external links or other calls to action in United States storefront apps. StoreKit External Purchase Link Entitlements apply in specific storefronts; elsewhere (except the US storefront) such buttons and links are not allowed. |
| Apple 3.1.3 | Apps allowed other purchase methods cannot, within the app, encourage users to use a method other than IAP, except on the United States storefront and as set out in 3.1.1(a) and 3.1.3(a). |
| Apple 3.1.3(d) | Real-time person-to-person services between two individuals may use non-IAP methods; one-to-few and one-to-many real-time services must use IAP. |
| Apple 3.1.3(e) | Physical goods or services consumed outside the app must use methods other than IAP, such as Apple Pay or card entry. |
| Google Play | Apps charging for in-app features, digital content or goods must use Google Play's billing system unless Section 3, 8 or 9 applies, and may not lead users to another payment method (listing, promotions, webviews, buttons, links, sign-up flows) outside those sections. Play billing must not be used for physical goods and services, credit card or utility bill remittances, peer-to-peer payments, online auctions, tax-exempt donations or online gambling. In some markets Google Pay is offered for physical goods and services. |

- **flutter_stripe's README** says the in-app purchase requirement does not apply to app developers in the USA, as they are excluded by a new court ruling in 2025. Read the rules themselves (`https://developer.apple.com/app-store/review/guidelines/` and Google Play's Payments policy) before shipping.

### App-to-web with Checkout (US iOS digital goods)

- **Detect the storefront** with StoreKit's Storefront property to know where the app was downloaded from.
- **Flow:** the app asks your server for a Checkout URL, opens it in the browser, a `checkout.session.completed` webhook fulfills ([CHECKOUT-NEXTJS.md](CHECKOUT-NEXTJS.md)), and the `success_url` is a Universal Link back into the app. Not for physical items, goods or services consumed outside the app, or real-time person-to-person services (use native in-app payments for those). It doesn't cover StoreKit IAP. A Managed Payments variant exists.
- **Options:** a prebuilt payment page (recommended), Payment Links (low code), a custom in-app flow (Android), and the customer portal for managing subscriptions ([BILLING.md](BILLING.md)).

### Payment Links in an iOS app

- **Use Payment Links** when you have few products and no server; use Checkout or Elements for dynamic carts or to attach a Customer. Cards and Apple Pay are on by default.
- **Universal links:** serve `.well-known/apple-app-site-association` with MIME `application/json` (check with `curl -I`), with `applinks.details[].appIDs` (`<TeamID>.<bundle id>`) and `components` (for example `"/": "/checkout_redirect*"`); add the Associated Domains entitlement `applinks:example.com`; add a fallback page.
- **Payment Link settings:** After payment, "Don't show confirmation page", with the universal link as success URL.
- **URL parameters:** `prefilled_email`, `locked_prefilled_email` (takes precedence), `client_reference_id` (alphanumeric, dashes, underscores, up to 200 characters; sent in `checkout.session.completed`). Open the link in Safari.

```
https://buy.stripe.com/test_eVa3do41l4Ye6KkcMN?prefilled_email=jenny%40example.com&client_reference_id=id_123
```

## Pick the UI and the API

| UI | Complexity | Use |
|---|---|---|
| Payment Sheet | 2/5 | Recommended; least integration effort |
| Flow Controller (custom flow) | 3/5 | You confirm yourself, for example to adjust totals |
| Payment Element | 3/5 | An embeddable view with the most layout control |

- **All three** support 40+ payment methods including Apple Pay, Google Pay and Link, handle 3DS2, and take the Appearance API (more than 50 aspects).
- **PaymentIntent** charges now (the UI shows "Save my info"); **SetupIntent** saves without a charge (reusable methods only); **PaymentIntent with `setup_future_usage`** charges and saves, but disables one-time methods like most BNPLs; use `payment_method_options[card][setup_future_usage]` to save only cards.
- **The server creates every object.** For security reasons the app can't create PaymentIntents, Customers or keys. Don't keep secret or restricted keys in the app; see [SECURITY-AND-KEYS.md](SECURITY-AND-KEYS.md).
- **Never fulfill from the client callback.** Listen for `payment_intent.succeeded`, `payment_intent.processing` and `payment_intent.payment_failed` on your server, because a malicious client could manipulate the response ([WEBHOOKS.md](WEBHOOKS.md)).

## React Native

- **SDK offerings:** Mobile Payment Sheet (recommended), Mobile Payment UI (FlowController), Mobile Payment Element, Address Element, Appearance API, Customer Sheet (beta), Apple Pay, Google Pay, Card Element (legacy).
- **The Payment Sheet supports only Customer objects,** not customer-configured Accounts.
- **Install:** server `npm install stripe --save`; client `npm install @stripe/stripe-react-native` (or `yarn add`); iOS `pod install`; Android needs nothing more.
- **Init:** wrap the app in `StripeProvider` or call `initStripe`. Only `publishableKey` is required (the example fetches it from the server); `merchantIdentifier="merchant.identifier"` is required for Apple Pay; `urlScheme="your-app"` is required for 3D Secure and bank redirects. `threeDSecureParams` styles the 3DS screen (`timeout` must be at least 5 minutes; `backgroundColor` and `footer` are iOS only). The Payment Sheet supports 3DS automatically.

### Server endpoint

- **`/payment-sheet` (Express):** create or reuse a Customer, create a CustomerSession and a PaymentIntent for the same Customer, and return the PaymentIntent client secret, `customerSessionClientSecret`, `customer` and `publishableKey`. Currency filters which methods show.

```js
stripe.customerSessions.create({ customer, components: { mobile_payment_element: { enabled: true, features: { payment_method_save: 'enabled', payment_method_redisplay: 'enabled', payment_method_remove: 'enabled' } } } })
```

```js
stripe.paymentIntents.create({ amount: 1099, currency: 'eur', customer, automatic_payment_methods: { enabled: true } })
```

- **Manual list, only if you must:** `allowed_payment_method_types: ['bancontact', 'card', 'ideal', 'klarna', 'sepa_debit']` (see dynamic payment methods in [PAYMENTS.md](PAYMENTS.md)).
- **CustomerSession or ephemeral key, the docs disagree:** this page's server returns `customerSessionClientSecret`, but its client sample reads `ephemeralKey` and passes `customerEphemeralKeySecret`; the React Native subscriptions guide and flutter_stripe use ephemeral keys. Match server and client to one model and check the current guide.

### Client

```js
const { initPaymentSheet, presentPaymentSheet } = useStripe();
```

- **`initPaymentSheet({ merchantDisplayName: "Example, Inc.", customerId, customerEphemeralKeySecret, paymentIntentClientSecret, allowsDelayedPaymentMethods: true, defaultBillingDetails: { name: 'Jane Doe' } })`,** then `const { error } = await presentPaymentSheet();` and show `Alert.alert(`Error code: ${error.code}`, error.message)` on failure.
- **`allowsDelayedPaymentMethods: true`** allows delayed methods such as US bank accounts; fulfill only when the payment succeeds.
- **`merchantDisplayName`** defaults to the app name; `style: 'alwaysDark' | 'alwaysLight'` (iOS).
- **Custom flow:** `customFlow: true`; `presentPaymentSheet()` returns `paymentOption`; then `confirmPaymentSheetPayment()`.
- **Return URL (iOS only):** register a custom URL scheme (Universal Links aren't supported here), forward URLs with `handleURLCallback(url)` from `useStripe` through `Linking.getInitialURL()` and `Linking.addEventListener('url', ...)`, and set `returnURL: 'your-app://stripe-redirect'` in `initPaymentSheet`. Expo: set the scheme in `app.json`.
- **Card scanning is required for Apple's iOS app review:** set `NSCameraUsageDescription` in `Info.plist`. On Android, use Google Pay production access or the Stripe card scanner `implementation 'com.stripe:stripecardscan:23.23.0'` (public preview).
- **Link:** prefill `defaultBillingDetails` (name, email, phone); on logout call `resetPaymentSheetCustomer()`.

### Apple Pay and Google Pay

- **Apple Pay:** an Apple Merchant ID (recommended form `merchant.com.{{YOUR_APP_NAME}}`), an iOS certificate from a CSR in the Dashboard (one CSR, one certificate), the Apple Pay capability in Xcode, and `applePay: { merchantCountryCode: 'US' }`. Recurring payments: `cartItems` with a recurring summary item and `request: { type: PaymentRequestType.Recurring, description, managementUrl, billing, billingAgreement }` per Apple's guidelines. Order tracking: `setOrderTracking` (iOS 16+).
- **Google Pay:** add `<meta-data android:name="com.google.android.gms.wallet.api.enabled" android:value="true" />` to AndroidManifest and `googlePay: { merchantCountryCode: 'US', testEnv: true }`. Google Pay can only be tested on a physical Android device.

### Subscriptions from React Native

```node
const subscription = await stripe.subscriptions.create({
  customer: '{{CUSTOMER_ID}}',
  items: [
    {
      price: '{{PRICE_ID}}',
    },
  ],
  payment_behavior: 'default_incomplete',
  payment_settings: {
    save_default_payment_method: 'on_subscription',
  },
  billing_mode: {
    type: 'flexible',
  },
  expand: ['latest_invoice.confirmation_secret'],
});
```

- **Return `subscription.latest_invoice.confirmation_secret.client_secret`** to the app. `billing_mode[type]=flexible` requires API version `2025-06-30.basil` or later. `save_default_payment_method: 'on_subscription'` raises the success rate of later payments. For multi-currency prices pass `currency`.
- **Ephemeral key:** `stripe.ephemeralKeys.create({customer: customerId}, {apiVersion: '2025-06-30.basil'})`; respond `{ subscriptionId, clientSecret, ephemeralKey: ephemeralKey.secret, customerId }` and pass `customerId` and `customerEphemeralKeySecret` to `initPaymentSheet`.
- **Client:** `initPaymentSheet({ paymentIntentClientSecret: clientSecret, returnURL: 'stripe-example://payment-sheet', allowsDelayedPaymentMethods: true })`; handle `PaymentSheetError.Failed` and `PaymentSheetError.Canceled`. The guide says the Payment Element confirms the subscription's first PaymentIntent and handles SCA.
- **`invoice.paid` provisions services** (the sample: after the trial has ended) and `invoice.payment_failed` is handled; store the status in your database and read it when a user accesses the service, to avoid hitting rate limits. Subscription events are in [BILLING.md](BILLING.md).

## Flutter (flutter_stripe)

- **Package:** `flutter_stripe` (repo org `flutter-stripe`, which calls it "The Stripe Flutter SDK"), `14.2.0` on pub.dev as of 2026-10-17, environment `sdk: >=3.8.1 <4.0.0`. Install with `dart pub add flutter_stripe` (or `flutter pub add flutter_stripe`).
- **Android:** API 21+, Kotlin 1.8.0+, Android Gradle plugin 8+, an activity theme descending from `Theme.AppCompat`, an up-to-date Gradle, `FlutterFragmentActivity` instead of `FlutterActivity` in `MainActivity.kt`, and these proguard rules. Rebuild after changing them (hot reload doesn't apply).

```proguard
-dontwarn com.stripe.android.pushProvisioning.**
-dontwarn com.google.android.gms.tapandpay.**
-dontwarn kotlinx.parcelize.Parceler$DefaultImpls
-dontwarn kotlinx.parcelize.Parceler
-dontwarn kotlinx.parcelize.Parcelize
# Keep Stripe classes
-keep class com.stripe.** { *; }
```

- **A `PlatformException` on Android** usually means those requirements aren't met (minSdkVersion 21, Kotlin 1.8.0, `class MainActivity: FlutterFragmentActivity()`).
- **iOS:** iOS 13+, Podfile `platform :ios, '13.0'`, and `NSCameraUsageDescription` for card scanning.
- **Web is highly experimental:** a subset only (create payment method, confirm payment or setup intent, create token), needs `flutter_stripe_web`, widgets Payment Element (recommended on web) and Express Checkout. WASM: `flutter build web --wasm`, served with COOP `same-origin` and COEP `credentialless` headers (for example with `dhttpd`).
- **Use the Payment Sheet.** Stripe is sunsetting `CardField` and `CardForm` in favor of PaymentSheet and recommends PaymentSheet for all new integrations. Also available: Apple Pay, Google Pay, Customer Sheet, Address sheet, Financial Connections, and Pay plugin support (`PaymentMethodParams.cardFromToken`, `Stripe.instance.confirmPayment(clientSecret, params)`).

### Init and the Payment Sheet

- **`Stripe` settings:** `publishableKey` (required), `stripeAccountId`, `threeDSecureParams`, `merchantIdentifier`. Set them in `main`: `void main() async { Stripe.publishableKey = stripePublishableKey; runApp(const App()); }`; with Apple Pay and redirects also `Stripe.merchantIdentifier = 'merchant.flutter.stripe.test'; Stripe.urlScheme = 'flutterstripe'; await Stripe.instance.applySettings();`.
- **The server returns** the PaymentIntent client secret, an Ephemeral Key secret and the Customer ID; the app can't create these.

```dart
await Stripe.instance.initPaymentSheet(
  paymentSheetParameters: SetupPaymentSheetParameters(
    // Main params
    paymentIntentClientSecret: data['paymentIntent'],
    merchantDisplayName: 'Flutter Stripe Store Demo',
    // Customer params
    customerId: data['customer'],
    customerEphemeralKeySecret: data['ephemeralKey'],
    // Return URL for redirect-based payment methods
    returnURL: 'flutterstripe://redirect',
    // Extra options
    primaryButtonLabel: 'Pay now',
    applePay: PaymentSheetApplePay(
      merchantCountryCode: 'US',
    ),
    googlePay: PaymentSheetGooglePay(
      merchantCountryCode: 'US',
      testEnv: true,
    ),
    style: ThemeMode.dark,
    billingDetails: billingDetails,
  ),
);
```

- **Present** with `await Stripe.instance.presentPaymentSheet();`, catching `StripeException` (`e.error.localizedMessage`). Custom flow: `customFlow: true`, `presentPaymentSheet()`, then `confirmPaymentSheetPayment()`. Don't assume you have been paid at this point; listen for `payment_intent.succeeded` on the server.
- **Options:** `preferredNetworks: [CardBrand.Visa, CardBrand.Amex]`, `appearance: PaymentSheetAppearance(...)`, Apple and Google `buttonType: PlatformButtonType.buy|book|...`.
- **Dart API:** `createPaymentMethod`, `handleNextAction`, `confirmPayment`, `configure3dSecure`, `isApplePaySupported`, `presentApplePay`, `confirmApplePayPayment`, `confirmSetupIntent`, `retrievePaymentIntent`, `createTokenForCVCUpdate`, `initPaymentSheet`, `presentPaymentSheet`, `confirmPaymentSheetPayment`.

### Return URLs and deep links

- **iOS:** `CFBundleURLTypes` with scheme `flutterstripe`. **Android:** an intent filter with `<data android:scheme="flutterstripe" android:host="redirect" />`. Both match `returnURL: 'flutterstripe://redirect'`. Google Pay also needs the `com.google.android.gms.wallet.api.enabled` manifest meta-data.
- **flutter_stripe forwards only pending Stripe redirects** and returns `false` for other links. With `UISceneDelegate` (the Flutter default since 3.41) use `app_links` 7.0.0 or later, check `FlutterDeepLinkingEnabled`, keep `CFBundleURLSchemes`, `Stripe.urlScheme` and `returnURL` on the same scheme, and forward with `await Stripe.instance.handleURLCallback(uri.toString());`.
- **Local webhooks** in the example: `stripe listen --forward-to localhost:4242/webhook`.

## Prove it

- **The store question is answered first:** what you sell is physical, a person-to-person service, or allowed through Stripe in the storefront you ship to; otherwise it goes through in-app purchase ([revenuecat SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/SKILL.md)).
- **The app bundle holds only a `pk_` key;** PaymentIntents, Customers, CustomerSessions and ephemeral keys come from your server.
- **Test cards in the sheet:** `4242424242424242` succeeds, `4000002500003155` asks for authentication and returns to the app through the return URL, `4000000000009995` fails (insufficient funds).
- **The order is fulfilled by `payment_intent.succeeded` on the server,** not by the `presentPaymentSheet` result; killing the app right after paying still fulfills.
- **Google Pay** is tested on a physical Android device with `testEnv: true`; **Apple Pay** appears with the merchant ID and certificate in place.
- **Flutter Android** builds with `FlutterFragmentActivity` and the proguard rules in a release build, with no `PlatformException` on `initPaymentSheet`.
- **For US iOS app-to-web,** the Checkout `success_url` universal link opens the app, and `apple-app-site-association` is served as `application/json`.
