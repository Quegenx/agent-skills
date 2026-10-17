# API versions and SDK upgrades

Stripe's API is versioned by date (`2026-09-30.endive`, `2025-08-27.basil`, `2024-12-18.acacia`), and the version decides request and response behavior. Your account has a default version, each SDK release targets the version current when it shipped, and each snapshot event destination is pinned to its own version. Most upgrade trouble comes from those three pins drifting apart: pin the version explicitly in code, find every pin before moving one, and replace snapshot destinations instead of editing them. Event handling itself is in [WEBHOOKS.md](WEBHOOKS.md).

## How versioning works

- **Release cadence:** starting with `2024-09-30.acacia`, Stripe releases new API versions monthly with no breaking changes. Twice a year a new major release (for example Basil) starts with an API version containing breaking changes. You can safely upgrade to any monthly release without updating your code.
- **Identifiers** start with their release date in YYYY-MM-DD format.
- **Backward-compatible (no code change):** new API resources; new optional request parameters; new properties in existing responses; changes to opaque string lengths (for example object IDs); new webhook event types.
- **Breaking (code change needed):** field renames or removals; behavioral modifications; removed endpoints or parameters. Breaking changes are tagged by product area (Payments, Billing, Connect, and so on). Multiple API versions coexist, so adoption can be staged.
- **Defaults:** curl and the CLI use the account default unless you pass `Stripe-Version` / `--stripe-version`. Webhook events use the account default unless an API version is set when the endpoint is created.
- **Rollback:** for 72 hours after upgrading, you can roll back to the previous API version in Workbench (https://dashboard.stripe.com/workbench/overview). Workbench Overview also shows the versions your integration uses.
- **Preview channels:** public preview uses `.preview` versions (current preview `2026-09-30.preview`) with SDK `-beta.N` releases; private preview uses `-alpha.N`.
- **Docs:** changelog https://docs.stripe.com/changelog.md, upgrade guide https://docs.stripe.com/upgrades.md, setting the version in an SDK https://docs.stripe.com/sdks/set-version.md.

## Choosing the target version

- **Use the version the user names.** Otherwise look up the current version: run `stripe docs /api/versioning`, or read https://docs.stripe.com/api/versioning.md, which states it in the sentence beginning "The current version is". On 2026-10-17 that page said `2026-09-30.endive`.
- **The bundled fallback** in Stripe's upgrade skill is `2026-09-30.endive` (snapshot from 2026-10-17). Use it only when docs.stripe.com is unreachable; a fallback dated more than a month ago is probably stale. Never guess a newer version number.
- **Compare the target with every pinned version** before changing anything: client configuration, per-request overrides and webhook endpoints. Unless explicitly asked, don't move any pin to an older version, or a stable pin to a preview version. If a pin already matches, report it unchanged.
- **Say where the target came from.** If live verification fails, say the latest version remains unverified; don't claim the integration is on the latest version.
- **Use the target everywhere:** client configuration, per-request overrides and curl `Stripe-Version` test headers. Replace bundled versions in examples before copying them.

## Server SDKs

- **Pin the version in code.** Specify the API version you integrate against instead of relying on the account default:

```javascript
// Good: Explicit version
const stripe = require('stripe')('sk_test_xxx', {
  apiVersion: '2026-09-30.endive'
});

// Avoid: Relying on account default
const stripe = require('stripe')('sk_test_xxx');
```

- **stripe-node pins itself:** starting from stripe-node v12, requests align with the API version that was current when your stripe-node version was released. TypeScript types encode that version in the `API_VERSION` file. Overriding it with `apiVersion` might cause inaccurate TypeScript types.
- **Dynamically typed SDKs** (Node.js, Ruby, Python, PHP) support a global setting and a per-request override. **Strongly typed SDKs** (Java, Go, .NET) use a fixed API version matching the SDK release: don't set a different one, since response objects might not match the SDK's types; select an SDK release that targets the version instead.
- **Preview targets** need the matching `beta` SDK release in every language (https://docs.stripe.com/sdks/versioning.md).
- **SDK semver:** major is breaking, minor adds backward-compatible features, patch fixes bugs. Each SDK version uses the API version current at its release. New features land only on the latest major.
- **Node runtimes:** LTS (even numbered) versions of Node 20 and later are supported. Node 20 is deprecated (EOL April 2026, support dropped September 2027); Node 18 is unsupported (last compatible SDK `v22.6.2`); Node 22 support is dropped September 2028.
- **CLI:** `stripe charges create --stripe-version 2026-09-30.endive`.
- **[appeeky] review item:** API version pinned explicitly, not floating. Search the code for `new Stripe(` and `apiVersion`.

### Per-request overrides: two shapes

- **The upgrades page** shows `stripe.paymentIntents.retrieve('pi_...', { apiVersion: '2026-09-30.endive' })`.
- **The stripe-node v22 migration guide** says that when you omit params on a method that takes both params and options, you must pass `undefined` explicitly: `stripe.customers.retrieve('cus_123', undefined, {stripeAccount: 'acct_123'})` (before v22: `stripe.customers.retrieve('cus_123', {stripeAccount: 'acct_123'})`). By that guide, the upgrades page example is the pre-v22 shape. v22 also removed callback arguments (use promises) and no longer accepts the API key as a string argument or `apiKey`/`host` inside params. Confirm against the SDK version you install.
- **v13:** `stripe.subscriptions.del` was removed; use `stripe.subscriptions.cancel`.

## Stripe.js and mobile SDKs

- **Stripe.js** is evergreen with biannual major releases (Acacia, Basil, Clover, Dahlia, Endive). Script tag: `<script src="https://js.stripe.com/endive/stripe.js"></script>`; npm: `npm install @stripe/stripe-js`, whose major versions correspond to specific Stripe.js versions. Each Stripe.js version pairs with its API version (Endive uses `2026-09-30.endive`, Acacia uses `2024-12-18.acacia`), and you can't override that. Details: https://docs.stripe.com/sdks/stripejs-versioning.md.
- **Leaving Stripe.js v3:** identify the API version in your code, review the changelog, and consider gradually updating your API version before switching Stripe.js versions. Stripe keeps supporting v3 indefinitely.
- **Mobile:** iOS and Android follow semver, with features and fixes only on the latest major. The React Native SDK uses 0.x.y: minor (x) means breaking changes and new features, patch (y) means critical bug fixes only. All mobile SDKs work with any API version used on your backend unless the docs say otherwise. Details: https://docs.stripe.com/sdks/mobile-sdk-versioning.md.

## Event destinations during an upgrade

- **Thin payloads are unversioned** and need no upgrade; API calls that retrieve the full event or the related resource stay versioned. Leave thin destinations unchanged.
- **Snapshot destinations are pinned** by `snapshot_api_version` (https://docs.stripe.com/api/v2/core/event-destinations/object.md#v2_event_destination_object-snapshot_api_version), which can only be set at creation. For every snapshot destination (webhook endpoint, Amazon EventBridge, Azure Event Grid) whose version differs from the target: create a replacement, test it, then delete or disable the old one to avoid duplicate delivery. Keep the handler idempotent while both are active. For a replacement webhook endpoint, save its new signing secret and accept both secrets during testing and cutover.
- **Webhook endpoint cutover, step by step:**
  1. Create a new, disabled endpoint with the same URL plus a query parameter (for example `?version=2024-04-10`), the same `enabled_events` and the new `api_version`.
  2. Make the code ignore new-version events (return `200`).
  3. Enable it; every event is now delivered twice.
  4. Switch the code to process new-version events and return `400` for old ones, so Stripe keeps retrying the old ones in case you roll back.
  5. Monitor, then disable the old endpoint.
- **Moving to thin events** for supported event types (https://docs.stripe.com/webhooks/migrate-snapshot-to-thin-events.md) means payloads no longer depend on API version upgrades. Webhook versioning: https://docs.stripe.com/webhooks/versioning.md.
- **Handle unfamiliar event types gracefully,** and test webhooks with the new version's structure before upgrading.

## Upgrade checklist

1. Review the API changelog between the current and target versions.
2. Check the API upgrades guide.
3. Update the server SDK package (for example `npm update stripe`).
4. Update `apiVersion` in client initialization.
5. Test with the `Stripe-Version` header.
6. Review each snapshot event destination's API version.
7. Update the Stripe.js script tag or npm package if needed.
8. Update mobile SDK versions if needed.
9. Store Stripe object IDs in database columns that hold up to 255 characters (case-sensitive collation).

Test a version without changing the account default:

```bash
curl https://api.stripe.com/v1/customers \
  -u sk_test_xxx: \
  -H "Stripe-Version: 2026-09-30.endive"
```

- **Test in a sandbox first;** test Billing changes with test clocks ([TESTING-AND-CLI.md](TESTING-AND-CLI.md)).

## Version-dependent behavior to watch

- **Refund and dispute mapping** to a subscription differs for `2025-03-31.basil` and later (invoice payments, `parent.subscription_details.subscription`) versus earlier versions such as `2025-02-24.acacia` (the Charge's `invoice` field). See [WEBHOOKS.md](WEBHOOKS.md#mapping-events-to-your-records).
- **Blocked vs declined** via `charge.outcome.type` requires API 2022-11-15 or later ([IDEMPOTENCY-AND-ERRORS.md](IDEMPOTENCY-AND-ERRORS.md)).
- **Thin events for API v1 resources:** the upgrades page says they are in private preview (previously thin events supported only API v2 resources); the event destinations page lists thin events for both API v1 and v2 resource changes. Confirm in the current docs.

## Prove it

- The target version is stated with its source (the versioning page, or the fallback flagged as unverified).
- `new Stripe(` / `require('stripe')(` sets `apiVersion` explicitly, and no pin moved backwards or from stable to preview.
- A curl with `-H "Stripe-Version: <target>"` against your key returns the shapes your code expects.
- Every snapshot destination's `snapshot_api_version` matches the target, or a replacement exists, has been tested, and the old one is disabled.
- After the upgrade, Workbench Overview shows the versions in use; rollback to the previous version is available there for 72 hours.
- Stripe ID columns hold 255 characters with case-sensitive collation.
