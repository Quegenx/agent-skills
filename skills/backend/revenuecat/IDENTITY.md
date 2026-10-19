# Customer identity, aliases and attributes

RevenueCat's identifying-customer guidance defines App User IDs, aliasing and account switching; its restore behavior and customer-attribute guidance define the shared project settings. These existing rules apply to both SDKs. Platform syntax stays in [FLUTTER.md](FLUTTER.md#identify-users) and [REACT-NATIVE.md](REACT-NATIVE.md#identify-users); webhook identity resolution remains in [BACKEND-AND-WEBHOOKS.md](BACKEND-AND-WEBHOOKS.md#the-handler). [https://www.revenuecat.com/docs/customers/identifying-customers]

## App User IDs

- **Anonymous by default.** Without an App User ID, RevenueCat generates `$RCAnonymousID:...` and caches it on the device; a reinstall creates a new one, and anonymous IDs can't share status across apps and platforms. Pass `appUserID` at configure only if you already have an authenticated user at launch; otherwise call `logIn` later. [https://www.revenuecat.com/docs/customers/identifying-customers]
- **Choose the ID carefully; it is hard to change.** Use a stable, opaque, non-guessable value such as your backend user UUID (UUID v4 recommended) or a hash of the user id. Never an email, phone number, sequential database id, IDFA, or a hard-coded string (it could unlock entitlements for users who never paid). Max 100 characters, case sensitive, scoped to the whole project; no `/`. Blocked values include `'no_user'`, `'null'`, `'none'`, `'nil'`, `'(null)'`, `'NaN'`, `'\\x00'`, `''`, `'unidentified'`, `'undefined'`, `'unknown'`, `'anonymous'`, `'guest'`, `'-1'`, `'0'`, `'[]'`, `'{}'`, `'[object Object]'`.
- **Anonymous IDs are not credentials.** They are device-scoped identifiers shared by users of the same device; use them only for pre-login flows. [RevenueCat/ai-toolkit, rc-security]

## Login, switching and aliases

- **Call `logIn` after your authentication confirms the session,** typically from your auth-state listener, not speculatively. It returns CustomerInfo and a `created` flag (true the first time this ID reaches RevenueCat); platform result types are in the SDK guides. An anonymous login may merge identities under the alias table below. [https://www.revenuecat.com/docs/customers/identifying-customers]
- **Account switching: the sources disagree.** The RevenueCat identify-user skill says `logOut()` first, then `logIn(newId)`, because a second `logIn` would alias the two IDs together. The docs say to call `logIn` directly with no `logOut`, and their alias table says a logIn from a non-anonymous ID never merges. The official form governs the SDK adapters: switch known IDs with `logIn` directly. The source's merge claim is wrong for a non-anonymous current ID. See https://www.revenuecat.com/docs/customers/identifying-customers.md.
- **Custom-IDs-only apps.** If every user has an account, identify before configuring, configure only with the custom ID, and never call `logOut`; on account switch call `logIn`. Otherwise a provided user's subscription may be transferred to an anonymous ID, recoverable only through restore on the original platform.
- **Configured with an `appUserID` up front,** you generally don't need `logIn` until that user signs out and back in as somebody else.
- **What `logIn` merges (docs alias table).** Anonymous to a new ID, or to an existing ID without an anonymous alias: merged. Anonymous to an existing ID that already has an anonymous alias, or any non-anonymous ID to any ID: the current ID is logged out, the provided one logged in, no merge or purchase transfer. After a merge only one ID stays in `original_app_user_id` (webhooks list the others in `aliases`), and any merged ID returns the same CustomerInfo, history and attributes.
- **Custom IDs are cross-platform.** The same ID on different platforms is the same user with shared entitlements, but a user can only manage a subscription on the platform it was purchased from.
- **Current identity is distinct from `originalAppUserId`.** An anonymous original ID may survive a merge into a custom ID. Guard anonymous logout using the SDK's current-identity API in [Flutter](FLUTTER.md#identify-users) or [React Native](REACT-NATIVE.md#identify-users), not an original-ID prefix. The old source used that historical prefix as current-identity evidence. [https://www.revenuecat.com/docs/customers/identifying-customers]
- **Restore is not login.** On a new device, log in first; restore only when the user expects to pull a receipt from the current store account.
- **Show the App User ID in settings for support.** [https://www.revenuecat.com/docs/customers/identifying-customers]

## Restore behavior

Set in **Project settings > General**; applies to all apps in the project, with an optional separate sandbox behavior ("Use a different restore behavior for sandbox"). It also applies when an identified user makes a new purchase whose receipt belongs to another identified user (except legacy share). It only governs purchases owned by identified IDs; anonymous owners get aliased. [RevenueCat docs, restore behavior]

| Option | Behavior |
|---|---|
| **Transfer to new App User ID** (default) | UserA loses access when UserB restores on the same device; an anonymous user restoring an identified owner's receipt receives the transfer; two anonymous users get aliased |
| **Transfer if there are no active subscriptions** | One-time purchases don't prevent transfer |
| **Keep with original App User ID** | "Use with caution"; returns `RECEIPT_ALREADY_IN_USE`; only for apps requiring accounts before purchase |
| **Share between App User IDs (legacy)** | Legacy projects only; can't be re-enabled once switched |

| App type | Choose |
|---|---|
| No login (anonymous only) | Transfer (required to restore after reinstall) |
| Optional login, or purchase before account | Transfer |
| Account required | Transfer recommended |
| Account required plus strict single-owner logic | Keep with original |

## Customer attributes

- **Set** with `Purchases.setAttributes({ "age" : "24", "custom_group_id" : "abc123" });`; clear one by passing `null` or an empty string (`Purchases.setAttributes({"age" : ""});`). [RevenueCat docs, customer attributes]
- **Limits.** Up to 50 custom attributes per subscriber; keys up to 40 characters, starting with a letter, letters, numbers, `-` and `_` only, no whitespace; values up to 500 characters. Keys starting with `$` are reserved.
- **Reserved keys** (e.g. `$displayName`, `$email`, `$phoneNumber`, `$fcmTokens`, `$posthogUserId`, `$mixpanelDistinctId`, `$amplitudeUserId`, `$onesignalId`, attribution keys such as `$mediaSource` and `$campaign`) can be set by key or with helpers: `Purchases.setEmail("test@example.com")`, `Purchases.setPhoneNumber("+16505551234")`, `Purchases.setDisplayName("John Appleseed")`. Device identifiers and attribution data can't be changed once set.
- **Sync timing.** Attributes reach RevenueCat only when `Purchases.configure()` runs, the app is backgrounded, or a purchase is made or restored. Call `syncAttributesAndOfferingsIfNeeded()` to sync immediately; it is needed when Targeting uses custom attributes and also refreshes the cached Offering.
- **Write-only and not secure storage.** The SDK can't read attributes back (use the REST API with a secret key, webhooks' `subscriber_attributes`, integrations or exports), and anyone with the public key can write them, so never keep subscription status or balances in them.

## Prove it

- Real users are identified after authentication; anonymous IDs appear only in the chosen pre-login flow. [RevenueCat docs, identifying customers, restore behavior and customer attributes]
- Switching known IDs calls `logIn` directly and does not merge them; current-identity checks guard anonymous logout.
- The project's restore behavior and any sandbox override are explicit, and Restore attaches the receipt to the current RevenueCat user.
- Attributes follow the limits and sync timing above and never hold subscription status or balances.
