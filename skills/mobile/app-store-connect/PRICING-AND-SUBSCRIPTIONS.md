# App Store pricing, in-app purchases and subscriptions

Setting up in-app purchases and auto-renewable subscriptions in App Store Connect, pricing them per territory, localizing their display names, mirroring the catalog into RevenueCat, and staying inside Apple's purchase rules, including the US and EU external purchase options. Three things decide most outcomes: digital unlocks must go through in-app purchase outside the exceptions Apple lists; since API 4.4.1, localizations hang off a product's version ID, not the product ID; and a product only syncs cleanly when its metadata, review screenshot, full price matrix and availability are complete. The SDK side, entitlements, offerings and paywalls are in [revenuecat SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/SKILL.md). `asc` CLI facts come from its third-party authors (rorkai); where they differ from Apple's docs, both are given.

**Contents:** [Purchase rules](#purchase-rules) · [Product types and subscription groups](#product-types-and-subscription-groups) · [External purchase links: US and EU](#external-purchase-links-us-and-eu) · [asc ground rules for products](#asc-ground-rules-for-products) · [Create products and set prices](#create-products-and-set-prices) · [Purchasing-power pricing](#purchasing-power-pricing) · [Price increases for existing subscribers](#price-increases-for-existing-subscribers) · [Localize subscription and IAP names](#localize-subscription-and-iap-names) · [Sync the catalog to RevenueCat](#sync-the-catalog-to-revenuecat) · [Test purchases in TestFlight](#test-purchases-in-testflight) · [Prove it](#prove-it)

## Purchase rules

App Review Guidelines, last updated October 16, 2026.

- **3.1.1 Use in-app purchase to unlock anything digital:** "If you want to unlock features or functionality within your app, (by way of example: subscriptions, in-game currencies, game levels, access to premium content, or unlocking a full version), you must use in-app purchase. Apps may not use their own mechanisms to unlock content or functionality, such as license keys, augmented reality markers, QR codes, cryptocurrencies and cryptocurrency wallets, etc."
- **3.1.1 details:**
  - IAP currencies may be used to tip. Credits and in-game currencies bought with IAP may not expire.
  - Provide a restore mechanism for any restorable purchase.
  - Gifting is allowed; refunds go only to the original purchaser.
  - Loot boxes must disclose odds before purchase.
  - Digital gift cards redeemable for digital goods must be sold with IAP.
  - A non-subscription app may offer a free trial as a Non-Consumable IAP at Price Tier 0 named "XX-day Trial", disclosing its duration, what becomes inaccessible and any later charges.
  - NFT services may be sold with IAP; owning an NFT may not unlock features.
- **2.1(b) Reviewable purchases:** IAPs must be "complete, up-to-date, visible to the reviewer and functional". If a configured item can't be found or reviewed in the app, explain why in the review notes.
- **2.3.2 Promoted IAPs** need a fitting display name, screenshot and description, and the app must handle `SKPaymentTransactionObserver` so the purchase completes at launch. The product page can promote up to 20 items across its IAP and subscription sections, with names up to 35 characters and descriptions up to 55.
- **3.1.2 Subscriptions:** "If you offer an auto-renewable subscription, you must provide ongoing value to the customer, and the subscription period must last at least seven days and be available across all of the user's devices." Examples of ongoing value: new game levels, episodic content, multiplayer support, consistent substantive updates, media collections, SaaS, cloud support.
- **3.1.2(a):**
  - Subscriptions may sit alongside a la carte purchases, and must work on every device of the user where the app is available.
  - Users get what they paid for without extra tasks (posting on social media, uploading contacts, checking in).
  - When moving to subscriptions, don't take away primary functionality existing users already paid for.
  - Free trials are set up in App Store Connect. Scams and bait-and-switch lead to removal.
- **3.1.2(b) Upgrades and downgrades** must be seamless; users "should not be able to inadvertently subscribe to multiple variations of the same thing".
- **3.1.2(c) Say what they get before asking:** "Before asking a customer to subscribe, you should clearly describe what the user will get for the price. How many issues per month? How much cloud storage? What kind of access to your service? Ensure you clearly communicate the requirements described in Schedule 2 of the Apple Developer Program License Agreement."
- **3.1.3 Other purchase methods:** apps cannot encourage other purchase methods in-app "except for apps on the United States storefront and as set forth in 3.1.1(a) and 3.1.3(a)". Developers may talk about other purchase methods outside the app.
  - **(a) Reader apps** (magazines, newspapers, books, audio, music, video) may apply for the External Link Account Entitlement (not required on the US storefront).
  - **(b) Multiplatform services** may unlock content bought elsewhere "provided those items are also available as in-app purchases within the app".
  - **(d)** Real-time person-to-person services may use other methods; one-to-few and one-to-many must use IAP.
  - **(e)** Physical goods and services consumed outside the app must use other methods (Apple Pay, credit card).
  - **(f)** Free stand-alone companions to paid web tools (VoIP, cloud storage, email, web hosting) need no IAP if nothing is bought inside.

## Product types and subscription groups

- **Four IAP types:** Consumable; Non-Consumable; Auto-Renewable Subscription (can support multiseat purchasing); Non-Renewing Subscription.
- **One active product per group.** A user can subscribe to one product per subscription group at a time. Rank levels from most (level 1) to least.

| Change | When it takes effect |
|---|---|
| Upgrade | Immediately, with a prorated refund of the lower level |
| Downgrade | At the next renewal |
| Crossgrade | At the next renewal if the durations differ; immediately if the same |

- **Durations:** 1 week, 1 month, 2 months, 3 months, 6 months, 1 year. "The duration can't be changed after you submit for review."
- **Renewal dates:** renewals land on the same calendar date (Jan 30, then Feb 28 or 29, then Mar 30).
- **Display names** may not contain control characters, markup or emoji.
- **Multiseat purchases** are on by default for all auto-renewable subscriptions and required for selling in Apple Business and Apple School Manager.
- **Monthly with a 12-month commitment** (announced April 27, 2026): worldwide except the United States and Singapore, on iOS 26.4 and later, live with the iOS 26.5 release in May 2026. People can cancel at any time, which stops renewal after they complete the agreed payments. Users see completed and remaining payments in their Apple Account; Apple sends email and, if opted in, push reminders before renewal. Manage it with `asc subscriptions pricing monthly-commitment enable|disable|list`.
- **iOS 27 (September 16, 2026):** "make sure your apps use StoreKit 2". Bundles and Suites (request access) come later in iOS 27; Volume Purchasing launches October 22, 2026; Group Purchases this winter.

## External purchase links: US and EU

### United States storefront

- **May 1, 2025:** the guidelines changed to comply with a US court decision on buttons, external links and other calls to action, in 3.1.1, 3.1.1(a), 3.1.3 and 3.1.3(a).
- **Current rule:** entitlements "are not required for developers to include buttons, external links, or other calls to action in their United States storefront apps".

### Every other storefront

- **No calls to action to other purchase methods** without a regional entitlement: "In all other storefronts, except for the United States storefront, where this prohibition does not apply, apps and their metadata may not include buttons, external links, or other calls to action that direct customers to purchasing mechanisms other than in-app purchase."
- **3.1.1(a) Link to Other Purchase Methods:** apply for the StoreKit External Purchase Link Entitlements (or the Music Streaming Services Entitlement) in specific regions to link to a permitted destination. The link may say items may be available "for a comparatively lower price". Misleading marketing or scams around the entitlement lead to removal.
- **October 16, 2026:** the separate Music Streaming Services bullet in 3.1.1(a) was folded into the StoreKit External Purchase Link Entitlements bullet, which now says links may go to a permitted destination.
- **Keys in the StoreKit External Purchase docs:** `com.apple.developer.storekit.external-purchase-link` (Boolean, link to a website for external purchase) and `SKExternalPurchaseCustomLinkRegions` (array of country codes for custom links).

### European Union

- **August 8, 2024:** the StoreKit External Purchase Link Entitlement (EU) began allowing offers at a destination of choice (alternative marketplace, another app, or website, in a web view or outside), prices and instructions in the app, actionable links, any number of URLs without declaring them in Info.plist, and links with parameters and redirects.
- **October 1, 2026 (ADPLA updated August 18, 2026):** one set of EU business terms. The Core Technology Fee is replaced by a 5% Core Technology Commission on digital transactions in apps distributed outside the App Store; the Initial Acquisition Fee and Store Services Fee are gone; apps may offer alternative payments alongside Apple IAP. Attachment 14 of the ADPLA supersedes the Alternative Terms Addendum and the StoreKit External Purchase Link Entitlement (EU) Addendum.
- **Choose an option and keep it.** Options: Apple IAP; alternative payment processing in the app; out-of-app offers (website, alternative marketplace or another app) with or without an actionable link. The chosen option or combination must stay the same across all EU storefronts for 12 months.
- **Alongside IAP:** offer IAP at the same time, "displayed at least as prominently as any other payment option"; the Apple IAP button is black or white with Apple-provided artwork; flows "may not discourage or disrupt the use of Apple In-App Purchase"; the product page may not mention alternative payment.
- **Technical requirements:** the StoreKit External Purchases or Offers Entitlement, and the `ExternalPurchaseCustomLink` API (with the system disclosure sheet) for in-app alternative processing or actionable links. Multiplatform services (3.1.3(b)) must offer IAP and/or in-app alternative processing.
- **Entitlement key:** `com.apple.developer.storekit.custom-purchase-link.allowed-regions`, an array of ISO 3166-1 alpha-2 codes: at, be, bg, hr, cy, cz, dk, ee, fi, fr, de, gr, hu, is, ie, it, lv, lt, lu, mt, nl, no, pl, pt, ro, sk, si, es, se. Minimum OS: iOS 26.2, iPadOS 26.2, macOS 26.6, tvOS 26.6, visionOS 26.6, watchOS 26.6.
- **Order of checks before an alternative flow:** check `canMakePayments`; check `ExternalPurchaseCustomLink.isEligible`; when the user taps the alternative payment button, show the disclosure sheet with `showNotice`.
- **Child safety:** Kids category: the alternative processor behind a parental gate and no out-of-app web offers. Under 13: alternative purchases behind a parental gate, no out-of-app offers. 13 to 17: both behind a parental gate (higher thresholds where a storefront's age of consent is above 13).
- **Review:** name your payment service provider in the review notes. The PSP must meet PCI Level 1 and offer customer service (disputes, subscription management, refunds).
- **Commissions (reduced rate in parentheses for the Small Business, Mini Apps Partner and Video Partner programs and subscriptions after year one):** IAP 26% (15%); in-app alternative processing 20% (10%); store services commission on out-of-app offers with actionable links 15% (10%), only on sales within 7 days of the link tap.
- **Who gets the Small Business rate** ([App Store Small Business Program](https://developer.apple.com/app-store/small-business-program/)): 15% "on paid apps and Apple In-App Purchases" for developers with "up to 1 million USD in proceeds in the prior calendar year", or new to the store; once proceeds pass $1M in the current year, the standard rate applies to "future sales"; a developer who falls back below can re-qualify the following year; Associated Developer Accounts count toward proceeds; proceeds adjust 15 days after the end of the fiscal month in which the developer is approved.
- **Reporting:** report alternative transactions monthly, within 15 days after month end, with the External Purchase Server API on iOS 26.4 and later. Invoices are payable within 30 days.
- **Music Streaming Services (EEA) Entitlement:** under Attachment 14 from October 1, 2026; uses `ExternalPurchaseCustomLink` and `com.apple.developer.storekit.external-purchase-link-streaming`; the app's primary purpose must be music streaming, its primary category Music, on iOS or iPadOS in an EEA storefront.
- **Read at runtime:** https://developer.apple.com/support/apps-using-alternative-payment-providers-in-the-eu/

## asc ground rules for products

- **Authenticate first** (`asc auth login` or `ASC_*` variables) and confirm flags with `--help`.
- **Versions, not products, since API 4.4.1.** IAPs, subscriptions and subscription groups have discrete versions, and a version ID differs from the product, subscription or group ID. Never pass a product, subscription or group ID to a version-scoped command.
- **Zero, one or many:** when listing versions, zero matches means create one, one means reuse its ID, more than one means stop and require an explicit version ID. Never create a version to resolve ambiguity.
- **Versions can't be deleted.** None of the three version families has a delete command, and deleting a live parent did not cascade to IAP or subscription versions.
- **Per-item failures:** log, continue with the remaining items and locales, and report every failure together at the end.

## Create products and set prices

- **High-level flows:** `asc subscriptions setup` and `asc iap setup` create the parent and set pricing; `asc subscriptions pricing ...`; `asc iap pricing summary` and `asc iap pricing schedules ...`. List territories with `asc pricing territories list --paginate`. The base territory is usually `USA`.
- **New subscription:**

```bash
asc subscriptions setup \
  --app "APP_ID" \
  --group-reference-name "Pro" \
  --reference-name "Pro Monthly" \
  --product-id "com.example.pro.monthly" \
  --subscription-period ONE_MONTH \
  --review-screenshot "./review.png" \
  --price "9.99" \
  --price-territory "USA" \
  --territories "USA,CAN,GBR" \
  --no-verify \
  --output json
```

  It creates the group and subscription, uploads the App Review screenshot, materializes Apple's full equalized price matrix and sets sale availability. Capture `.groupId` and `.subscriptionId`.
  - **Skip its localization flags:** they use the deprecated v1 resources. Add v2 version localizations afterwards.
  - **`--no-verify` is deliberate here:** the parent stays `MISSING_METADATA` until the v2 steps finish. Omit it otherwise.
  - **Tier-driven pricing:** use `--tier` or `--price-point-id` instead of `--price`.
  - **Stuck in `MISSING_METADATA` with the same base price:** rerun with `--repair`, which rebuilds and re-saves the matrix atomically.
  - **Final check:** `asc validate subscriptions --app "APP_ID" --output table`.
- **Inspect subscription prices:** `asc subscriptions pricing summary --subscription-id "SUB_ID" --territory "USA"`; `asc subscriptions pricing prices list --subscription-id "SUB_ID" --paginate`.
- **Derive one price from another** (for example yearly at about 10 times monthly):

```bash
asc subscriptions pricing derive \
  --source-subscription-id "MONTHLY_SUB_ID" \
  --target-subscription-id "YEARLY_SUB_ID" \
  --multiplier "10" \
  --round nearest \
  --dry-run \
  --output table
```

  - `--round`: `exact` (fail unless on the ladder), `nearest` (ties go lower), `up`, `down`.
  - `--confirm` builds a fresh plan rather than reusing the dry run, so rerun the dry run immediately before.
  - Source and target must be distinct and already have standard `UPFRONT` prices. It is a one-time snapshot, not a persistent link. It fails closed if any territory can't resolve, skips matching prices and verifies by readback. Focus with `--territory "SWE"`.
  - Approved or live targets are scheduled for tomorrow by default (`--auto-start-date` defaults to true); pass `--auto-start-date=false` to apply immediately. It does not change sale availability. Apple's ladders scale unevenly across territories.
- **Price points:** `asc subscriptions pricing price-points list --subscription-id --territory "USA" --paginate --price "9.99"`; `... price-points equalizations --price-point-id --paginate`; `... price-points adjusted-equalizations --price-point-id --upfront-price-point-id --plan-type MONTHLY --subscription-id --paginate` (API 4.4.1 subscription-specific adjustments; a fresh request needs both `--upfront-price-point-id` and `--plan-type`). `--next` is an opaque continuation URL: on resume pass only `--next`.
- **Availability:** the subscription-availability resource is deprecated in ASC API 4.4 with no one-for-one replacement; keep it for compatibility only: `asc subscriptions pricing availability edit --subscription-id --territories "USA,CAN,IND,BRA"`, `... availability view`.
- **Removed path:** never use `asc subscriptions prices ...`. There is no before-and-after diff command; run the summary before and after. Price changes can take time to propagate.
- **New one-time IAP:**

```bash
asc iap setup \
  --app "APP_ID" \
  --type NON_CONSUMABLE \
  --reference-name "Pro Lifetime" \
  --product-id "com.example.pro.lifetime" \
  --price "9.99" \
  --base-territory "USA" \
  --output json
```

  It verifies the created IAP and its price schedule by default. Capture `.iapId`; localize through the v2 version. The lower-level create is `asc iap create --app --type NON_CONSUMABLE --ref-name "Lifetime" --product-id "com.example.lifetime" --output json` (note `--ref-name` there versus `--reference-name` in `iap setup`). Groups: `asc subscriptions groups create --app --reference-name "Premium" --output json`.
- **IAP pricing:** `asc iap pricing summary --iap-id --territory` (base territory, current price, estimated proceeds, scheduled changes); `asc iap pricing price-points list --iap-id --territory "USA" --paginate --price "9.99"`; `asc iap pricing price-points equalizations --id`. Schedules: `asc iap pricing schedules create --iap-id --base-territory "USA" --price "4.99" --start-date "2026-04-01"` (or `--tier 5`, or `--prices "PRICE_POINT_ID:2026-04-01"`); `schedules view`, `schedules manual-prices --schedule-id --paginate`, `schedules automatic-prices`. Future-dated schedules show as scheduled changes.

## Purchasing-power pricing

- **Bulk CSV import is the safest batch path** for broad purchasing-power pricing:

```csv
territory,price,start_date,preserved
IND,2.99,2026-04-01,false
BRA,4.99,2026-04-01,false
MEX,4.99,2026-04-01,false
DEU,8.99,2026-04-01,false
```

  `asc subscriptions pricing prices import --subscription-id "SUB_ID" --input "./ppp-prices.csv" --dry-run --output table`, then the same with `--confirm`. Required columns `territory` and `price`; optional `currency_code`, `start_date`, `preserved`, `preserve_current_price`, `price_point_id`. Territory may be a 3-letter ID, a 2-letter code or a common name. `--continue-on-error=false` makes it fail fast.
- **One territory:** `asc subscriptions pricing prices set --subscription-id "SUB_ID" --price "2.99" --territory "IND"` (or `--tier 5`, or `--price-point "PRICE_POINT_ID"`), with `--start-date "YYYY-MM-DD"` and `--preserved` as needed.
- **Strategy:** set the base territory first; tier regionally (high-income near the baseline, mid-income moderate discounts, lower-income stronger discounts); run spreadsheet-driven rollouts as CSV, dry run, fix, apply, re-check.
- **Why and how far** [ApparenceKit](https://apparencekit.dev/blog/localize-app-store-prices-175-countries/) (a post selling the author's pricing tool; figures as the post gives them): 175 territories, each with its own currency, VAT and purchasing power; "The latest Adapty report shows that localized prices can increase your revenue by 20-50%" (report not linked). At purchasing-power parity a $9.99 subscription "might be $4-5" in India or Vietnam: "Conversion climbs 20-50%. You lose per-user revenue ... but you multiply the user count by 3-5x." "In Europe, the display price includes VAT. In the US it doesn't" (Norway 25%, Hungary 27%, Chile 19%), so a $9.99 net price displays at "$12.50 or higher": localize so display prices "land on a psychological anchor ($9.99 or $8.99 with VAT included)". 3 tiers × 175 countries is 525 prices: pick a base currency (usually USD), compute per-territory prices from a tier list (3 tiers "for smooth pricing", 4 "for more aggressive promotions in emerging markets"), review a diff of current vs new before pushing, version every push for rollback, and allow per-country overrides. The API key needs pricing access ([CLI.md](CLI.md)).
- **Third-party tool:** ParityAppKit, the post author's paid macOS app, pushes such a matrix through the App Store Connect API for paid apps, IAPs and auto-renewable subscriptions (local-only, key in the macOS Keychain). Its license prices in the post are launch-time offers; `asc ... prices import` above does the same from a CSV.

## Price increases for existing subscribers

Apple decides whether a subscriber must agree to a higher price ([Manage pricing for auto-renewable subscriptions](https://developer.apple.com/help/app-store-connect/manage-subscriptions/manage-pricing-for-auto-renewable-subscriptions)):

- **Consent is needed if** "The subscriber is located in a region that requires consent for any price changes", or "The price increase is more than 50% of the current price and the difference in price exceeds approximately US$5 per period for non-annual subscriptions, or US$50 per year for annual subscriptions", or "The subscriber experienced a price increase for that subscription within the past 12 months." India UPI AutoPay subscribers must consent too.
- **Otherwise Apple notifies** the subscriber "27 or 7 days before the next renewal date". "If a price increase occurs within the minimum required notice period, subscribers will renew at their existing price for one more billing period."
- **Consent requests** start "60 days before renewal date" for 2 month, 3 month, 6 month and annual subscriptions, 27 days for monthly and 7 days for weekly; the minimum notice period is "7 days for weekly subscriptions, 27 days for 1 month subscriptions, and 30 days for subscription durations longer than 1 month" (https://developer.apple.com/help/app-store-connect/manage-subscriptions/manage-pricing-for-auto-renewable-subscriptions/).
- **Google Play's rules differ** (opt-in by default, auto-cancel without acceptance, 37 days): [google-play PRICING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/google-play/PRICING.md#existing-subscribers). Strategy for a price change (signals, grandfathering, staged rollout) is [pricing-strategy PRICE-CHANGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/pricing-strategy/PRICE-CHANGES.md); for store subscriptions it runs inside these rules.

## Localize subscription and IAP names

- **Display names are what users see** on the subscription management sheet and in purchase dialogs. Apple's IAP display name (2 to 30 characters) and description (up to 45) limits, quoted, and promoted IAPs in search: [aso KEYWORDS-AND-METADATA.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/KEYWORDS-AND-METADATA.md#field-limits). Given a single name, use it in every locale.
- **Locales:** `ar-SA, ca, cs, da, de-DE, el, en-AU, en-CA, en-GB, en-US, es-ES, es-MX, fi, fr-CA, fr-FR, he, hi, hr, hu, id, it, ja, ko, ms, nl-NL, no, pl, pt-BR, pt-PT, ro, ru, sk, sv, th, tr, uk, vi, zh-Hans, zh-Hant` (39). This is shorter than the app metadata list: it has no bn-BD, gu-IN, kn-IN, ml-IN, mr-IN, or-IN, pa-IN, sl-SI, ta-IN, te-IN or ur-PK.
- **Use the v2 version-scoped commands for all new work.** The v1 product- and group-scoped localization commands are deprecated by API 4.4.1 and the CLI warns about them.
- **Resolve the version:**

```bash
asc iap versions list --iap-id "IAP_ID" --state PREPARE_FOR_SUBMISSION --paginate --output table
asc subscriptions versions list --subscription-id "SUB_ID" --state PREPARE_FOR_SUBMISSION --paginate --output table
asc subscriptions groups versions list --group-id "GROUP_ID" --state PREPARE_FOR_SUBMISSION --paginate --output table
```

  Create only on zero matches: `asc iap versions create --iap-id`, `asc subscriptions versions create --subscription-id`, `asc subscriptions groups versions create --group-id` (with `--output json`).
- **Bulk import from one JSON file:** `asc subscriptions versions localizations import --version-id "VERSION_ID" --file "./localizations.json" --dry-run`, then `--confirm`. It validates the whole file, then writes one locale at a time (Apple has no bulk localization endpoint); it creates missing locales, updates only differing fields, never clears or deletes, and reports per-locale failures. IAP import takes `name` and `description`; group import takes `name` and `customAppName`.
- **Subscription version localizations:** `list --version-id ... --paginate`; `create --version-id --locale --name --description`; `update --id "LOC_ID" --name --description`. Never combine a value flag with `--clear-name` / `--clear-description`.
- **Descriptions can't be empty.** The 4.4.1 schema permits JSON `null`, but Apple's live service rejects an empty `--description` and `--clear-description` for subscription-version and IAP-version localizations (at least 1 character). So creating a missing locale needs a non-empty description; a name-only run may update existing locales but must not create missing ones.
- **Group version localizations:** `create --version-id --locale --name --custom-app-name "My App"`; `update --id`. Groups have no description. Use `--clear-custom-app-name` only on explicit opt-in.
- **IAP version localizations:** `asc iap versions localizations create --version-id --locale --name --description`; update takes `--localization-id "LOC_ID"` (subscription update takes `--id`).
- **List before create:** creating an existing locale fails.

## Sync the catalog to RevenueCat

- **Preconditions:** asc auth; the RevenueCat MCP configured (OAuth in Cursor and VS Code, or an API key); the `APP_ID`, RevenueCat `project_id`, app type (`app_store` or `mac_app_store`) and bundle ID; a write-enabled RevenueCat API v2 key to apply.
- **Safety:** audit mode (read-only) by default; explicit confirmation before writes; never delete; continue past per-item failures.
- **One identifier:** ASC `productId` equals RevenueCat `store_identifier`. Keep `productId` stable once live; never use display names as identifiers. The RevenueCat MCP does not create ASC products.
- **Apply in this order:** ASC groups, subscriptions and IAPs; RevenueCat app and products; entitlements and their attachments; offerings, packages and their attachments; verify and summarize.
- **Read ASC:** `asc subscriptions groups list --app --paginate --output json`; `asc iap list --app --paginate --output json`; `asc subscriptions list --group-id --paginate --output json`.
- **Gate on strict validation** (it must exit zero before any RevenueCat create or attach, even on zero-write runs):

```bash
mkdir -p "./audit"
asc validate subscriptions --app "APP_ID" --strict --output json --pretty \
  > "./audit/subscriptions-validation.json"
asc validate iap --app "APP_ID" --strict --output json --pretty \
  > "./audit/iap-validation.json"
```

  Block on warnings, errors, `MISSING_METADATA`, a review screenshot that isn't `COMPLETE`, or incomplete or unverified pricing. Keep the JSON as audit evidence.
- **Audit IAP pricing and availability:** `asc iap pricing summary --iap-id --output json`; `asc iap pricing availability view --iap-id --output json`; capture `.data.id`, then `asc iap pricing availabilities available-territories --id "AVAILABILITY_ID" --paginate --output json`. Only a `404` on the summary proves there is no schedule, and only a `404` on the availability parent means availability is missing; every other error stops that item. Never infer territories from the parent view's relationship data (optional and possibly paged). Set with `asc iap pricing availability set --iap-id --territories "USA" --output json` and schedule with `asc iap pricing schedules create --iap-id --base-territory "USA" --prices "PRICE_POINT_ID" --output json`.
- **IAP review images:** `asc iap versions images list --version-id --paginate --output json`; `asc iap versions images create --version-id --file "./lifetime-review.png" --output json`. `images update` changes upload state only; it can't replace the file.
- **RevenueCat MCP tools:** `mcp_RC_get_project`, `mcp_RC_list_apps`, `mcp_RC_list_products`, `mcp_RC_list_entitlements`, `mcp_RC_list_offerings`, `mcp_RC_list_packages`, `mcp_RC_create_app`, `mcp_RC_create_product` (`store_identifier`, `app_id`, `type`), `mcp_RC_create_entitlement`, `mcp_RC_attach_products_to_entitlement`, `mcp_RC_get_products_from_entitlement`, `mcp_RC_create_offering`, `mcp_RC_update_offering` (`is_current=true` only when asked), `mcp_RC_create_package`, `mcp_RC_attach_products_to_package` with `eligibility_criteria: "all"`. Paginate with `starting_after`.

| ASC type | RevenueCat `type` |
|---|---|
| Auto-renewable subscription | `subscription` |
| `CONSUMABLE` | `consumable` |
| `NON_CONSUMABLE` | `non_consumable` |
| `NON_RENEWING_SUBSCRIPTION` | `non_renewing_subscription` |

| ASC period | Package key |
|---|---|
| `ONE_WEEK` | `$rc_weekly` |
| `ONE_MONTH` | `$rc_monthly` |
| `TWO_MONTHS` | `$rc_two_month` |
| `THREE_MONTHS` | `$rc_three_month` |
| `SIX_MONTHS` | `$rc_six_month` |
| `ONE_YEAR` | `$rc_annual` |
| lifetime | `$rc_lifetime` |
| custom | `$rc_custom_<name>` |

- **Entitlements:** one per subscription group (or per the user's map) and one per non-consumable; consumables get none by default.
- **Natural-language prompts work with the MCP,** for example "Create offering default with packages $rc_monthly and $rc_annual".
- **Summarize like this:**

```text
ASC: created groups=1 subscriptions=2 iap=1, skipped=14, failed=0
RC: created apps=0 products=3 entitlements=2 offerings=1 packages=2, skipped=27, failed=1
Attachments: entitlement_products=3 package_products=2
Failures:
- com.example.premium.annual: duplicate store_identifier exists on another RC app
```

- **Pitfalls:** the wrong `project_id` or app ID; RevenueCat products under the wrong platform app; consumables attached to entitlements; skipping the ASC re-read after creates; mapping before ASC setup has finished localization, review screenshot, full price matrix and availability; not verifying offerings and packages.
- **References:** https://www.revenuecat.com/docs/tools/mcp , /tools/mcp/setup , /tools/mcp/tools-reference , /tools/mcp/usage-examples , /tools/mcp/best-practices-and-troubleshooting , https://www.revenuecat.com/docs/projects/configuring-products , https://www.revenuecat.com/docs/getting-started/entitlements/ios-products

## Test purchases in TestFlight

- **TestFlight subscriptions renew daily,** up to 6 times within a week regardless of duration. TestFlight apps run in the sandbox environment.
- **Other scenarios** such as billing retry need a Sandbox Apple Account (Developer settings). More testing in [revenuecat SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/SKILL.md).

## Prove it

- **Validation:** `asc validate subscriptions --app "APP_ID" --strict --output json` and `asc validate iap --app "APP_ID" --strict --output json` exit zero with no warnings, no `MISSING_METADATA`, and review screenshots `COMPLETE`.
- **Prices:** `asc subscriptions pricing summary` and `asc iap pricing summary` for the base territory and each PPP territory show the intended price (or a scheduled change) after the import; the CSV dry run showed no failed rows.
- **Localizations:** every locale in the 39-locale list you target has a non-empty name and description on the version ID (not the product ID), and a fresh list shows no duplicates.
- **RevenueCat:** every ASC `productId` appears exactly once as a `store_identifier` on the right platform app; each subscription group and non-consumable has its entitlement; no consumable is attached to one; each offering's packages carry the expected `$rc_*` keys.
- **Rules:** the paywall states what the user gets for the price before subscribing; every subscription period is at least seven days; restore works; outside the US storefront, no button or link points to another purchase method unless the app holds a regional entitlement.
- **EU alternative payments:** `canMakePayments` and `ExternalPurchaseCustomLink.isEligible` are checked and the `showNotice` sheet appears before the alternative flow, with IAP offered at least as prominently.
- **TestFlight:** a monthly subscription renews daily in TestFlight and stops after 6 renewals.
