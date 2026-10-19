# Errors and security

RevenueCat turns the stores' billing error codes into one cross-platform error type and already retries transient failures, so app code handles errors by mapping a few codes to user-facing messages and never loops. On security, RevenueCat's backend validates receipts and deduplicates purchase tokens; what is left to you is keeping the secret key off every client, turning on Trusted Entitlements, identifying real users, and making your server (not the client) the authority for paid content. Webhook authentication is in [BACKEND-AND-WEBHOOKS.md](BACKEND-AND-WEBHOOKS.md); the exact error enums and verification-mode syntax per SDK are in [FLUTTER.md](FLUTTER.md) and [REACT-NATIVE.md](REACT-NATIVE.md).

## SDK error handling

- **One error type.** RevenueCat collapses Google Play `BillingResponseCode` handling (retriable and non-retriable groups plus backoff) into `PurchasesError`, with `code` (`PurchasesErrorCode`), `underlyingErrorMessage` and `message`. `PurchasesErrorCode` is a cross-platform enum with stable, readable codes. (The names here are the Android SDK's; see [FLUTTER.md](FLUTTER.md) and [REACT-NATIVE.md](REACT-NATIVE.md) for yours.)
- **`message` belongs in logs, not the UI.** It is a technical description. Never pass it to the UI; keep a single function that maps a code to a user-facing string.
- **No retry loops.** The SDK already retries transient billing and network failures internally. Any error that reaches you has used up the SDK's retry budget. Do not add your own backoff loop; the only retry you implement is a user-triggered "Try Again" button.
- **Check `userCancelled` first,** return silently, then branch on the code. On Android, the purchase call throws `PurchasesTransactionException` (which adds `userCancelled`); offerings, products, customer info and restore calls throw `PurchasesException` (no `userCancelled`).
- **Before writing a catch block, decide:** which call you wrap (this picks the exception type), which codes get specific handling (everything else goes to a generic message), and which user-facing string each handled code maps to.
- **Non-purchase calls:** on `NetworkError` show an offline or cached fallback where you have one; otherwise log.
- **Logging out an anonymous user is an error:** React Native's `Purchases.logOut()` may throw `PURCHASES_ERROR_CODE.LOG_OUT_ANONYMOUS_USER_ERROR`; Flutter's throws `PlatformException` when the current user is anonymous.
- **Trusted Entitlements verification errors** are forwarded to `Purchases.errorHandler`.

| Code | Meaning | Handling | Example user message |
|---|---|---|---|
| `PurchaseCancelledError` | User backed out of the flow | Do nothing; `userCancelled` is also `true` | "" (empty) |
| `ProductAlreadyPurchasedError` | Product already active for the user | Refresh `CustomerInfo` and check entitlements | "You already have this subscription." |
| `PaymentPendingError` | Purchase entered pending state | Show a pending message; wait for the customer info update listener | "Your payment is being processed. We'll notify you when it completes." |
| `NetworkError` | Request failed due to connectivity | Prompt the user to retry | "Please check your internet connection and try again." |
| `StoreProblemError` | Google Play issue | Prompt to retry or update Play Store | "There was a problem with Google Play. Please try again." |
| `PurchaseNotAllowedError` | Device or account cannot purchase | Show an explanatory message | |
| `IneligibleError` | User not eligible for the offer | Show the base plan instead | |
| `ConfigurationError` | Listed as a key code in the quick reference | | |
| anything else | | Generic message | "Something went wrong. Please try again." |

The two sources list different key codes: the error-handling skill has `PurchaseNotAllowedError` and not `ConfigurationError`; the quick reference has `ConfigurationError` and not `PurchaseNotAllowedError`.

## REST API errors

- **Shape:** errors return `type`, `param`, `message`, `retryable` and `doc_url`.
- **Types:** `authentication_error`, `authorization_error`, `invalid_request`, `parameter_error` (IDs must be 1 to 255 chars), `rate_limit_error`, `resource_missing`, `resource_already_exists`, `resource_locked_error` (423), `server_error`, `store_error`, `unprocessable_entity_error`, `entity_references_archived_entities`.
- **Status codes include** 409 Conflict, 418 I'm a teapot, 422, 423 Locked and 429.
- **A 429** carries `Retry-After` and a body with `"retryable": true`, `doc_url` `https://errors.rev.cat/rate-limit-error` and `backoff_ms` (for example `1000`). Limits per domain are in [BACKEND-AND-WEBHOOKS.md](BACKEND-AND-WEBHOOKS.md#rate-limits).
- **CLI exit codes** are in [CLI-AND-API.md](CLI-AND-API.md).

## What RevenueCat already covers

| Concern | Who handles it | How |
|---|---|---|
| Receipt validation against Google Play | RevenueCat backend | Runs before the purchase call returns |
| Purchase token reuse | RevenueCat backend | Tokens are deduplicated server side |
| Fabricated purchase tokens | RevenueCat backend | Fails Google Play verification, no entitlement granted |
| HTTPS transport to RevenueCat | SDK | Always on |
| Retry of token post on network failure | SDK | Retries on next app launch |

## API keys

| Key | Prefix | Where it lives | What it can do |
|---|---|---|---|
| Public (SDK API key) | `appl_`, `goog_`, `amzn_` | Embedded in the app; one per app, created automatically, can't be changed | Post purchases and fetch `CustomerInfo` for the calling user only |
| Test Store | `test_` | Debug builds and CI secrets only; never in release | Test Store purchases |
| Secret | `sk_` | Your server, a secret manager or an env var; project-wide | Full REST API: read any subscriber, grant or revoke entitlements, delete subscribers, set attributes, bulk operations |

- **Never put a secret key in an app or website,** in a build config field or in any client bundle. Someone who decompiles the app can call admin REST endpoints with it. Treat it like a database password.
- **Never commit it.** Grep the app source tree for the `sk_` prefix and confirm zero hits before release.
- **Who manages them:** project Admins create and revoke secret keys, under **Project Settings**, **API Keys** (dashboard path `/projects/{projectId}/api-keys`). Revoked keys are invalidated immediately.
- **Rotate** secret keys regularly and whenever a leak is possible (for example when an employee leaves), and immediately if one leaks.
- **REST API v2 needs a v2 key** and the `Bearer` header: `Authorization: Bearer sk_1234567890abcdef`. v1 keys do not work with v2.
- **Third-party clients** should use OAuth instead of shared keys.
- **Switch from the Test Store key to the platform key before App Review.**

## Trusted Entitlements

Trusted Entitlements protects against man-in-the-middle attacks that grant entitlements: the SDK verifies a cryptographic signature on entitlement data and gives you the result. **Enabling it does not automatically protect your app**: in informational mode a failed check is only reported.

| Mode | Failed verification does what | Pick when |
|---|---|---|
| Disabled | No signing happens | Only for quick prototypes |
| Informational | Logged, access still granted | You want signal without risking false denials to real users |
| Enforced | Not exposed by the current Flutter/RN enums | Do not promise automatic denial |

- **Defaults conflict between sources.** The rc-security skill says the default is `DISABLED`, in which case `CustomerInfo` is trusted without signature checking. The docs say iOS SDK 5.15.0+ and Android SDK 8.11.0+ enable it by default in informational mode, while older versions (iOS 4.25.0 to 5.14.x, Android 6.6.0 to 8.10.x) have it disabled by default. Set the mode explicitly and confirm in `https://www.revenuecat.com/docs/customers/trusted-entitlements`.
- **Support:** iOS SDK 4.25.0+, Android SDK 6.6.0+; devices on Android 4.4+ and iOS 13.x+. No performance impact.
- **Supported modes:** current Flutter and RN expose disabled/informational. Informational reports verification failure while still granting entitlements; the app decides its handling. The old source claimed an available enforced mode automatically set `isActive` false and recommended graduating to it; Flutter's enforced value is commented out until supported. Keep native version-qualified defaults above distinct from wrapper configuration defaults. [https://github.com/RevenueCat/purchases-flutter/blob/main/lib/models/entitlement_verification_mode.dart; https://github.com/RevenueCat/react-native-purchases/blob/main/_autodocs/types-enums.md; https://www.revenuecat.com/docs/customers/trusted-entitlements]
- **Anti-pattern:** leaving it disabled in production lets a man in the middle forge `CustomerInfo` responses.
- **Flutter:** `configuration.entitlementVerificationMode = EntitlementVerificationMode.disabled;` (use `EntitlementVerificationMode.informational` to enable on older SDKs). **React Native:** `entitlementVerificationMode: ENTITLEMENT_VERIFICATION_MODE.DISABLED`.
- **Read the result** from `customerInfo.entitlements.verification` (and per entitlement):

| Result (Flutter `VerificationResult.` / RN `VERIFICATION_RESULT.`) | Meaning | Action |
|---|---|---|
| `notRequested` / `NOT_REQUESTED` | Verification disabled | Grant |
| `verified` / `VERIFIED` | Authentic | Grant |
| `verifiedOnDevice` / `VERIFIED_ON_DEVICE` | Verified locally | Grant |
| `failed` / `FAILED` | Possible tampering, possibly a MiTM attack | Log and alert |

- **After switching from disabled to informational,** cached data still reads "not requested". Call `Purchases.invalidateCustomerInfoCache()` so unverified entitlements are not used.
- **Keys:** intermediate keys rotate frequently and are signed by a root key.

## The server is the authority

- **The client is not the authority for paid content, regardless of its verification result.** Each premium endpoint either calls the RevenueCat REST API per request or reads a local `has_entitlement` flag driven by webhooks (see [BACKEND-AND-WEBHOOKS.md](BACKEND-AND-WEBHOOKS.md#pick-the-mechanism)).
- **Never trust `customerInfo` sent from the client** or any client header on the server: a tampered client can claim any entitlement. The logic is: fetch the subscriber, and if the entitlement is not active, respond Forbidden.
- **Customer attributes are not secure storage.** They are writable with the public key, so never keep subscription status, coins or similar values in them.

## User identity

See the shared [identity contract](IDENTITY.md) for anonymous IDs, authenticated login and alias behavior.

## Customer Authentication (private beta)

- **What it is:** iOS SDK 5.88.0+, behind an internal flag (Android, then the hybrid SDKs, to follow). The app exchanges an identity provider's ID token (OpenID Connect, Google ID, Apple ID, Firebase) for a RevenueCat access token and no longer passes an App User ID. It enables spending in-app currency from the app, reading attributes (coming soon), and securing calls to your own backend.
- **Verify the access token on your backend:** it is a JWT. Check `iss` and `aud` equal `https://api.revenuecat.com/auth/{YOUR_PROJECT_ID}`, check `exp`, and verify the signature with the JWKS at `https://api.revenuecat.com/auth/{YOUR_PROJECT_ID}/.well-known/jwks.json` (match `kid`; cache the JWKS). Don't write your own verification logic. Read `sub` (the RevenueCat Customer ID) and `rc.app_user_id`. Tokens expire after three hours.
- **Or ask RevenueCat:** call `GET /v1/customer` with `Authorization: Bearer <ACCESS_TOKEN>` (no API key) and cache the result for 30 seconds.
- **Beta limits:** no custom audiences or scopes.

## Prove it

- A grep of the app source for `sk_` returns zero hits; release builds use the platform key, never `test_`.
- The installed SDK's verification mode is set explicitly, failure results are observed and handled according to the app's chosen policy; no unsupported enforced-mode guarantee substitutes for server authorization. [https://www.revenuecat.com/docs/customers/trusted-entitlements]
- Every catch block checks `userCancelled` first, logs `message`, shows a mapped string, and contains no retry loop; `PaymentPendingError`, `ProductAlreadyPurchasedError` and `NetworkError` each have their own flow.
- Real users are identified with `logIn`; anonymous IDs appear only before login.
- Every paid-content endpoint verifies entitlement through the REST API or a webhook-driven flag.
