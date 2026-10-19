# Store setup

Before an app can sell anything, three places must agree: the store console (App Store Connect or Google Play Console) holds the products and the agreements, the RevenueCat project holds an app config per platform with the store credentials, and the app ships with that platform's public SDK key. Products are fetched from the store on the device, so any mismatch between them (bundle ID or package name, product identifiers, unsigned agreements, credentials still propagating) blocks them and offerings come back empty. For the meaning of products, entitlements, offerings and packages see [CONCEPTS.md](CONCEPTS.md).

**Contents:** [Order of work](#order-of-work) · [Create the project](#create-the-project) · [Bootstrap with the MCP server or CLI](#bootstrap-with-the-mcp-server-or-cli) · [Apps and store connections](#apps-and-store-connections) · [API keys](#api-keys) · [App Store Connect](#app-store-connect) · [Google Play Console](#google-play-console) · [Server notifications from the stores](#server-notifications-from-the-stores) · [Catalog in the dashboard](#catalog-in-the-dashboard) · [Restore behavior (project setting)](#restore-behavior-project-setting) · [When products don't load](#when-products-dont-load) · [Prove it](#prove-it)

## Order of work

- **Route by where the user is:** no RevenueCat account: create one and a project; account but no app for the platform: add the app; app but store not connected: add credentials; store connected but no entitlements or offerings: build the catalog; all configured: verify.
- **Ask first:** is the app published on the store (even internal testing)? Are products live or still drafts? Do you have the Google service account JSON? If products do not exist yet, pause: product creation is a store console task.
- **Two orders appear in the sources.** The Android handbook imports products from Play first and then attaches entitlements ("Import first, then wire"). The project bootstrap skill creates products in RevenueCat first and lists "Create products in App Store Connect / Play Console" as a next step, using the `test_store` app when no store app exists. Either way, the store console stays the product source of truth.

## Create the project

1. **Sign up or log in at `app.revenuecat.com` and create a project.** One project holds the iOS, Android and web apps for the same product. Entitlements, custom App User IDs and secret keys are project-wide.
2. **Every project has a Test Store.** You can build and test against it before any store exists (see [TESTING.md](TESTING.md)). Before review, connect the real stores and set up server notifications.
3. **Add an app config** from **Apps** (App Store, Play Store, Amazon) or a **web config** from **Web** (RevenueCat Billing, "formerly Web Billing"; Stripe, a manual integration; Paddle). Web billing is covered in [WEB-BILLING.md](WEB-BILLING.md).
4. **Build the catalog:** entitlements, imported products attached to entitlements, an offering with packages marked Current ([Catalog in the dashboard](#catalog-in-the-dashboard)).
5. **Copy each platform's public SDK API key** from the app settings and hand off to SDK configuration with: the API key, the current offering identifier, the entitlement identifiers.

## Bootstrap with the MCP server or CLI

The RevenueCat MCP server and the `rc` CLI cover the same actions; command details are in [CLI-AND-API.md](CLI-AND-API.md).

- **Always list projects first** (`list-projects` or `rc projects list`); if there are several, ask which to use or whether to create a new one. Store `project_id` for all later calls.
- **Discovery questions:** platforms (iOS, Android, Web, multiple); business model (subscriptions, one-time, consumables, mix); tiers (common: Monthly + Annual, single tier, Freemium + Premium); app details: iOS bundle ID (e.g. `com.company.appname`), Android package name, display name.
- **Create in this order ("dependencies matter"):**

| Step | MCP tool | `rc` command |
|---|---|---|
| 1. Find or create the project | `list-projects`, `create-project` | `rc projects list`, `rc projects create` |
| 2. Apps per platform | `create-app` | `rc apps create` |
| 3. One product per subscription or purchase | `create-product` | `rc products create` |
| 4. One entitlement per access level | `create-entitlement` | `rc entitlements create` |
| 5. Attach products | `attach-products-to-entitlement` | `rc entitlements attach` |
| 6. Offering (lookup_key `"default"`) | `create-offering` | `rc offerings create` |
| 7. Packages (`$rc_monthly`, `$rc_annual`, etc.) | `create-package` | `rc packages create` |
| 8. Attach products to packages | `attach-products-to-package` | `rc packages attach` |
| 9. Public keys | `list-app-public-api-keys` | `rc apps keys` |

- **App type per platform:** for mobile, ask whether the app is already set up in App Store Connect or Google Play Console; if yes, `create-app` with type `app_store` or `play_store`; if not, use the automatically generated `test_store` app and tell the user the store integration can be set up later. Web apps: type `rc_billing`.
- **On errors:** report the specific error, suggest a fix (e.g. "Bundle ID may already be in use"), offer retry or skip, and continue the remaining steps if possible.
- **Report with this summary:**

```
Project Setup Complete!
=======================

Project: {project_name} ({project_id})

Apps Created:
  iOS: {app_name} - API Key: appl_xxxxx
  Android: {app_name} - API Key: goog_xxxxx

Products:
  - monthly_premium (subscription, P1M)
  - annual_premium (subscription, P1Y)

Entitlements:
  - premium → monthly_premium, annual_premium

Offering: default (current)
  └── $rc_monthly → monthly_premium
  └── $rc_annual → annual_premium

Next Steps:
1. Configure store credentials in RevenueCat dashboard
2. Create products in App Store Connect / Play Console
3. Add SDK to your app (see /rc:create-app)
4. Implement paywall UI using the "default" offering
```

## Apps and store connections

| Store | What the app config needs |
|---|---|
| Apple App Store | **App name**, **Bundle ID**, **Shared Secret**, **In-App Purchase Key**; App Store Connect API Key also recommended (fetches products from App Store Connect) |
| Google Play | **App name**, **Package Name**, **Service Credentials** |
| Amazon | Package name and Shared Secret |
| Web | RevenueCat Billing, Stripe or Paddle config |

- **Identifiers must match exactly.** The Bundle ID or package name in RevenueCat must match the store console and the app build (case-sensitive, per environment). With Expo, the bundle ID and application ID in the build must match the RevenueCat config and the store console.

## API keys

- **Public SDK keys configure the SDK.** One per app, auto-created, can't be changed. Flutter and React Native need a separate key per platform, under **Project Settings > API keys > App specific keys**. Prefixes: iOS `appl_`, Android `goog_` (e.g. `goog_xxxxxxxxxxxxxxxxxxxxxxxx`). "Do not reuse iOS or web keys in the Android app": a Google key on iOS fetches the wrong config.
- **Keep the public key out of source;** inject it via build config or a secret manager.
- **The Test Store has its own key.** "In release builds, the SDK crashes on purpose when it finds a Test Store API key." "You must NEVER submit an app to the App Store or Google Play that is configured with a Test Store API key." Use build configurations or env vars: Test Store key for debug, platform key for release. Switch to the platform key before review.
- **Secret keys** (prefix `sk_`) are project-wide, created and revoked by project Admins, for restricted requests (deleting subscribers, granting entitlements), "only stored on your own servers"; "never embed secret API keys in your app or website". Rotation and handling are in [ERRORS-AND-SECURITY.md](ERRORS-AND-SECURITY.md).

## App Store Connect

### Agreements and membership

- **Sign the latest Paid Applications Agreement** in "Business": "You will not be able to test in-app purchases until the latest version of this agreement is signed". Complete Tax and Banking until the status is "Clear". Propagation can take up to 24 hours.
- **Keep the Apple Developer membership active and auto-renewing.**
- **Enable the In-App Purchase capability in Xcode** before App Store distribution (Flutter install docs; "Nothing else is needed to build and test with the Test Store").

### Create subscription products

1. **My Apps > app > Features > Subscriptions > +** to create a Subscription Group (Reference Name), then **+** to add a product.
2. **Reference Name** (max 64 characters, not user-facing) and **Product ID** ("can't be used again across any of your apps, even if the product is deleted"). Naming scheme `<app>_<price>_<duration>_<intro duration><intro price>`, e.g. `rc_3999_1y_1w0`.
3. **Duration and price** (Apple auto-fills all regions).
4. **Introductory Offers:** Free plus a Duration for trials.
5. **Localization:** Subscription Display Name and Description (user-visible); reuse the same name for products with the same access.
6. **Reviewer screenshot** (required; a 640 x 920 placeholder is fine while testing).
7. **Subscription Group localization:** Group Display Name and App Name.

- **Other IAP types** (consumable, non-consumable, non-renewing) live under "In-App Purchases".
- **Product status:** Approved, or complete metadata. Products in Prepare for Submission or Ready for Review load in sandbox once metadata is complete. The first IAP must be submitted with an app version, never separately.

### In-App Purchase Key (required)

- **"This is a required configuration step. When using Purchases v5.x+ (i.e., StoreKit 2), transactions will fail to be recorded without this key being set."** "The key is required for all Apple App Store app configs." It is also required for subscription offers and order-ID lookup; adding it to an existing app may update historical data.
- **SDK versions that require it (docs):** Flutter 7.0.0+, React Native 8.0.0+ (also Capacitor 9.0.0+, Cordova 6.0.0+, iOS 5.0.0+, Unity 7.0.0+). The v8.0.0 release notes (Flutter 2024-08-22, React Native 2024-08-01) say "When upgrading to v8, you **must** configure your In-App Purchase Key ... **Purchases on iOS will fail if the key is not configured**." The Flutter threshold differs (7.0.0 vs 8.0.0); confirm in the current docs, and configure the key regardless.
- **Steps:**
  1. App Store Connect **Users and Access > Integrations > In-App Purchase**: generate a key (one key works across all apps of the account).
  2. Download the `.p8` (one-shot download). Upload it without renaming.
  3. In the RevenueCat app settings tab **In-app purchase key configuration**, upload the `.p8` and enter the Issuer ID. If there is no Issuer ID, create an App Store Connect API key; both use the same Issuer ID.
  4. The credential validator shows "Valid credentials".
- **Invalid permissions:** check Bundle ID capitalization, the Issuer ID, and that the key is Active (not revoked).

### App-Specific Shared Secret

- **"Mandatory for receipt validation when using StoreKit 1";** StoreKit 1 is deprecated by Apple. StoreKit 2 (iOS 15+, RevenueCat SDK v5.0+) uses the In-App Purchase Key (Issuer ID, Key ID, Private Key) instead.
- **Generate:** App Store Connect > My Apps > app > General > App Information > App-Specific Shared Secret > Manage > generate; paste it in the RevenueCat iOS app settings.
- **Migrating StoreKit 1 to 2:** update to SDK v5.0+, configure the In-App Purchase Key, remove the shared secret.
- **The troubleshooting checklist says to add both** the App-Specific Shared Secret and the In-App Purchase Key.

### App Store Connect API key (product import)

1. **Users and Access > Integrations > App Store Connect API:** create a key with access level at least **App Manager**.
2. **Download the `.p8` once** and note the Issuer ID.
3. **In the RevenueCat app settings tab App Store Connect API,** upload it and enter the Issuer ID and the **Vendor number** (App Store Connect > Payments and Financial Reports).

## Google Play Console

### Prerequisites

| Prerequisite | Where it lives | Why RevenueCat needs it |
|---|---|---|
| Google Play Console app | Play Console | Dashboard connects by package name |
| Package name | Play Console app listing | Must match your Android app exactly |
| In-app products or subscriptions | Play Console monetization | RevenueCat imports the catalog |
| Base plans for subscriptions | Play Console subscription | Billing Library 6+ requires them |
| Google Cloud service account JSON | Google Cloud Console | RevenueCat authenticates to the Play Developer API |
| Financial data viewer permission | Play Console users and permissions | Service account reads subscription state |

- **Upload a build before creating store products.** The store-setup source requires an uploaded APK for product creation. For purchase-test eligibility, use the [licensed debug and test-track paths](TESTING.md#google-play-testing); a closed-track install is not a universal requirement. [https://developer.android.com/google/play/billing/test]

### Create products

1. **Play Console > app > Monetize > Products > Subscriptions > Create subscription** (or **In-app products** for one-time products).
2. **Product ID** (not reusable), **Name** (up to 55 characters), description. Naming scheme `<app>_<entitlement>_<version>`, e.g. `rc_premium_v1`.
3. **Add a base plan** for each subscription: billing period, price, renewal type; name it like `annual-autorenewing`; click "Activate". Products migrated in May 2022 have base plans like `P1Y`.
4. **Optionally add offers** (intro pricing, free trial) and activate.
5. **Wait for propagation:** a few minutes after creation; product edits reach the app within a few hours.

- **Backwards compatibility:** old SDKs only see base plans and offers marked backwards compatible ("Use for deprecated billing methods"; one per subscription or base plan). Google one-time products must be backwards compatible to auto-import.
- **"Make editable" is safe:** RevenueCat does not use the InAppProduct API for subscriptions.
- **Flag non-consumables in RevenueCat.** A Google non-consumable (e.g. lifetime) must be configured as non-consumable in the RevenueCat dashboard, otherwise RevenueCat consumes it and Google allows repurchase.

### Service credentials

- **Propagation takes time.** Docs: "It can take up to 36 hours for new Play service credentials to work"; until then you see "Invalid Play Store credentials" errors (503 or 521). The Android handbook says "allow up to 24 hours". Confirm in the current docs.
- **Automated (Cloud Shell):** run `bash credentials.sh`. It enables `androidpublisher.googleapis.com`, `playdeveloperreporting.googleapis.com` and `pubsub.googleapis.com`, creates `revenuecat-service-account` with roles `roles/pubsub.editor` and `roles/monitoring.viewer`, and writes `revenuecat-key.json`.
- **Manual, in the Google Cloud project linked to Play Console:**
  1. Enable the Google Play Android Developer API and the Google Play Developer Reporting API.
  2. Create a service account with **Pub/Sub Editor** (for RTDN) and **Monitoring Viewer**. If topic creation fails with permission errors, use **Pub/Sub Admin**.
  3. Create and download a JSON key.
- **Role grants differ between sources.** The Android handbook says to skip role grants on the Cloud side; the credentials docs grant Pub/Sub Editor and Monitoring Viewer. Confirm in the current docs.
- **Org policies can block keys.** Organizations created on or after May 3, 2024 may block service accounts via `iam.disableServiceAccountCreation` or `iam.disableServiceAccountKeyCreation`.
- **Invite the service account in Play Console > Users and Permissions:** invite the `client_email` from the JSON, add the app, and grant four permissions:
  - "View app information and download bulk reports (read-only)"
  - "View financial data, orders, and cancellation survey responses"
  - "Manage orders and subscriptions"
  - "Manage store presence" (needed for the Product Editor, MCP server and AI Toolkit)

  The Android handbook names only app-level access plus Financial data viewer; the credentials docs list the four above.
- **Upload the JSON** in RevenueCat **Apps > Play Store app > Service Account Credentials JSON** and save; confirm the package name matches. RevenueCat validates by calling the Play Developer API. The validation modal shows Project ID, Private Key ID and Client Email; **Check credentials** re-runs it.
- **Validation fails** for missing API enablement, the wrong Cloud project, or a service account not yet propagated in Play.
- **Speed-up workaround:** edit and save any product description in Play Console Monetize > Products, then revert it. Then upload a signed APK or AAB.

## Server notifications from the stores

Stores send these to RevenueCat (your own server gets RevenueCat webhooks instead, see [BACKEND-AND-WEBHOOKS.md](BACKEND-AND-WEBHOOKS.md)). They also allow tracking new purchases without the SDK, and they do not affect RevenueCat billing. They speed up webhooks and integrations, reduce Charts lag, and are usually how RevenueCat learns about one-time purchase refunds. Confirm each with the 'Last received' timestamp; notifications for untracked subscriptions get a 200 but don't update the label.

### Apple

- **Set it up if you sell consumables, non-consumables or non-renewing subscriptions;** it is not required for most subscription updates, but enables Refund Control and faster refund detection.
- **One click:** RevenueCat **Apps > iOS app > Apple Server to Server notification settings > Apply in App Store Connect** applies the URL to Production and Sandbox. Manual: paste the **Apple Server Notification URL** into App Store Connect **App Information > App Store Server Notifications**, in both the Production and Sandbox URL fields.
- **Use Version 2** (auto-detects price changes, better Refund Control, faster one-time refund detection; Apple deprecated V1).
- **Need Apple's notifications on your own server too?** Use RevenueCat webhooks, or set the **Apple Server Notification Forwarding URL** in RevenueCat. Forwarding from your server is covered in [BACKEND-AND-WEBHOOKS.md](BACKEND-AND-WEBHOOKS.md).

### Google Real-time developer notifications (RTDN)

- **"Strongly recommended":** price accuracy, faster webhooks, less Charts lag; needed for one-time product refunds and voids, and for the `DEFERRED` replacement mode.
- **Steps:**
  1. Enable Pub/Sub in the same Cloud project as the service account.
  2. In RevenueCat **Google Play App Settings > Connect to Google**, generate a topic ID.
  3. In Play Console **Monetize > Monetization Setup > Real-time developer notifications**, paste it as **Topic name** and set Notification content to **Subscriptions, voided purchases, and all one-time products**.
  4. Click **Send test notification** and check "Last received" in RevenueCat.
- **Test fails:** grant `google-play-developer-notifications@system.gserviceaccount.com` the Pub/Sub Publisher role on the topic. "Domain Restricted Sharing" (`constraints/iam.allowedPolicyMemberDomains`, on by default for orgs created on or after May 3, 2024) can cause `One or more users named in the policy do not belong to a permitted customer`. Wait about 36 hours after creating credentials.

### "Track new purchases from server-to-server notifications"

- **Apple:** new purchases are associated with the App User ID matching `appAccountToken`, which the SDK sets unless the App User ID isn't a valid UUID or the store notification arrives first; otherwise an anonymous ID is generated and transfer behavior applies. Customer attributes may then be missing from webhooks and integrations (AppsFlyer and Meta skip the event) and are not resent. "If you report all your purchases through the SDK, turn off" this option.
- **Google App User ID detection:** **Use anonymous App User IDs** ("strongly recommend" with the SDK, which sets `obfuscatedExternalAccountId` to a hashed App User ID) or **Use Google's obfuscatedExternalAccountId as App User ID** (only SDK-less, with that field as the ID).
- **Safe only if** you don't use Keep with original, Transfer if no active subscriptions, or legacy share restore behavior; or you don't set `appAccountToken` / `obfuscatedExternalAccountId`; or those match the RevenueCat App User ID and it is a valid UUID v4; or (Google with the SDK) "Use anonymous App User ID" detection is selected. Otherwise App User ID B may never get the entitlement.

## Catalog in the dashboard

1. **Entitlements:** **Product catalog > Entitlements > + New entitlement**, one per access tier, with a stable identifier ("Most apps ship with a single entitlement").
2. **Products > Import:** RevenueCat pulls the store catalog. Select products and attach each to an entitlement; every product that unlocks pro features attaches to it.
3. **Offerings:** create one (e.g. `default`), add packages (type Monthly, Annual, Lifetime or custom; identifier `$rc_monthly`, `$rc_annual` or custom), assign a product to each, save, and mark one offering Current. Swap the current offering later from the dashboard without an app update.
4. **Mark consumables** (and Google non-consumables) on the product.
5. **Targeting (optional):** **Targeting > Placements** to map users to offerings (see [CONCEPTS.md](CONCEPTS.md#placements-and-targeting)).

- **A product with no price** means the service account is connected but the product is not active in the store; fix the listing, then re-import.

## Restore behavior (project setting)

The shared [restore-transfer policy](IDENTITY.md#restore-behavior) defines project and sandbox settings, ownership and aliases.

## When products don't load

Debug log: `There's a problem with your configuration. None of the products registered in the RevenueCat dashboard could be fetched from the [Play Store/App Store].` Work through this before touching code (more in [TROUBLESHOOTING.md](TROUBLESHOOTING.md)):

- **Agreements:** App Store Connect Paid Applications Agreement signed with banking (up to 24 hours to propagate); Google Play agreements accepted.
- **Apple membership** active and auto-renewing; both the App-Specific Shared Secret and the In-App Purchase Key added.
- **Play testing:** follow the [licensed debug or test-track prerequisites](TESTING.md#google-play-testing).
- **App Store product status** Approved or metadata complete.
- **Identifiers** match exactly; Bundle ID and package name match (case-sensitive, per environment).
- **Correct per-platform API key.**
- **Device:** a physical device (simulators only with StoreKit Configuration files); no StoreKit Configuration in the Xcode scheme when testing live.
- **Time:** new products may take up to 24 hours after release; Play credentials up to 36 hours.
- **Offering:** marked Current, with each package linked to a product.

## Prove it

| Check | How to verify | Pass signal |
|---|---|---|
| Store credentials accepted | RevenueCat app settings, store section | Google Play shows connected with a green indicator; Apple's validator shows "Valid credentials" |
| Products imported | Products tab | Store products appear with live prices |
| Entitlement attachments | Open each product | Shows the attached entitlement |
| Offering current | Offerings tab | One offering tagged Current |
| Package product links | Open the current offering | Each package shows a product identifier |
| API key scope | Project settings, API keys | Each platform key is distinct; release builds use platform keys, not the Test Store key |
| Server notifications | App settings | 'Last received' shows the Apple notification and the Google test notification |

- **Smoke test in the app:** fetch offerings and log the current offering's identifier. Non-null means the API key, package name or bundle ID, and network path work; null means check the dashboard offering and the identifier match before touching code.
- **A test purchase** makes the expected entitlement active (see [TESTING.md](TESTING.md)).
