# Pricing

Regional and purchasing-power pricing (PPP) on Google Play is set per region on one-time product purchase options and subscription base plans. Most failures come from two API rules: every update needs the current `--regions-version` and the right `--update-mask`, and the API rejects any update that drops a region already configured, so you always fetch, merge and send the complete list. Everything here comes from the gplay CLI's third-party author; the multipliers are that author's heuristic, which the source itself calls "starting points". Creating the products is [BILLING-AND-PURCHASES.md](BILLING-AND-PURCHASES.md); CLI basics and `--dry-run` are [CLI.md](CLI.md).

## Required flags

- **`--regions-version`:** use the latest. Send any value (for example `"2022/02"`) and the error reveals the latest: `Invalid regions version 2024/01, latest value is ExternalRegionLaunchVersionId{versionId=2025/03}`. `gplay pricing convert` also returns a `regionVersion` usable here.
- **`--update-mask "basePlans"`** for subscriptions. Without it: "update_mask must contain at least one path."
- **`--update-mask "purchaseOptions"`** for one-time products.
- **`--dry-run` is global:** `gplay --dry-run subscriptions update ...`, not `gplay subscriptions update --dry-run ...` (fails with "flag provided but not defined"). Other examples by the same author place `--dry-run` after the subcommand for `release` and `migrate`; check `gplay --help`.

## Fetch, then merge

- **Never send a partial region list.** The API rejects updates that remove existing regional configs. Example: 173 regions configured, send 30, get "Regional configs were removed from the base plan: BM, BO, CI...". Fetch the current config, override only the target regions, send the complete merged list.
- **Keep the new-regions defaults.** `otherRegionsConfig` (subscriptions) must be included if previously set. `newRegionsConfig` (one-time product purchase options) must be included if previously set, or you get "Cannot remove currency for new regions once it has been added: EUR."
- **Take currencies from Google Play, not assumptions.** They vary by `--regions-version` (Bulgaria `BG`: `BGN` in older versions, `EUR` in newer). Preserve the fetched currencies.
- **Don't mix money formats.** New subscriptions use `units`/`nanos`.

## Money format and rounding

`units` is the whole part as a string; `nanos` is 0 to 999999999.

| Price | `units` | `nanos` |
|---|---|---|
| $5.99 | `"5"` | `990000000` |
| ₹149.99 | `"149"` | `990000000` |
| ¥719 | `"719"` | `0` |

Round results to `.99` endings: $4.73 becomes $4.99, ₹249.37 becomes ₹249.99.

## Reference conversion

`gplay pricing convert --json @price-request.json` with body `{"price":{"currencyCode":"USD","units":"9","nanos":990000000}}` returns converted prices for all supported regions plus a `regionVersion`. Use it for reference and apply multipliers on top.

## PPP multipliers (third-party starting points)

| Tier | Region, multiplier, currency |
|---|---|
| 1 | US 1.0 USD, GB 1.0 GBP, DE 1.0 EUR, AU 1.0 AUD, CH 1.1 CHF, CA 1.0 CAD, NL 1.0 EUR, SE 1.0 SEK, NO 1.05 NOK, DK 1.0 DKK |
| 2 | FR 0.8 EUR, ES 0.7 EUR, IT 0.7 EUR, JP 0.8 JPY, KR 0.7 KRW, PL 0.6 PLN, PT 0.7 EUR, CZ 0.6 CZK, GR 0.65 EUR, CL 0.6 CLP, SA 0.8 SAR, AE 0.8 AED |
| 3 | IN 0.3 INR, BR 0.5 BRL, MX 0.45 MXN, ID 0.3 IDR, TR 0.35 TRY, VN 0.3 VND, PH 0.35 PHP, EG 0.3 EGP, CO 0.4 COP, AR 0.3 ARS, NG 0.3 NGN, PK 0.25 PKR, TH 0.4 THB, MY 0.45 MYR, ZA 0.4 ZAR, UA 0.3 UAH |

- **Strategies:** BigMac approach (US $9.99, India $2.99, Brazil $4.99, UK $9.99, Switzerland $10.99); tiered; revenue optimization (start with Tier 3 discounts, monitor per-region conversion, adjust).

## Workflows

- **Legacy `iap`:** `iap list`, then `iap get --sku` (save all `prices`), then build merged JSON with `defaultPrice` plus the full `prices` map, then `iap update --sku --json @ppp-prices.json`, then verify.
- **Subscriptions:** `subscriptions get`, then per base plan keep `otherRegionsConfig`, all `regionalConfigs`, and `autoRenewingBasePlanType` or `prepaidBasePlanType`; then `subscriptions update --json @ppp-subscription.json --regions-version "2025/03" --update-mask "basePlans"` (all three required); then verify.
- **One-time products:** `onetimeproducts patch --json --regions-version "2025/03" --update-mask "purchaseOptions"`.
- **Batch one-time products:** `regionsVersion` and `updateMask` go inside each request:

```json
{
  "requests": [
    {
      "oneTimeProduct": { "productId": "product_1", "purchaseOptions": [...] },
      "regionsVersion": { "version": "2025/03" },
      "updateMask": "purchaseOptions"
    }
  ]
}
```

- **Batch subscriptions conflict:** the same author states the "inside each request" rule for `subscriptions batch-update`, but its multiple-subscriptions section says "Update each subscription individually". Confirm with `gplay subscriptions batch-update --help` and the current API reference.

## Existing subscribers

New prices apply only to new subscribers. Migrate existing ones with `gplay baseplans migrate-prices --base-plan-id <id> --json @migration.json` for every changed base plan.

What existing subscribers then see is Google's rule ([Change subscription prices](https://developer.android.com/google/play/billing/price-changes)):

- **Opt-in by default:** "By default, price increases are opt-in changes for existing subscribers. Users must explicitly accept the higher price before it is first charged, or Google Play automatically cancels their subscription."
- **Timing:** the new price is charged after "an advance notification period of 37 days"; Play notifies users "Starting 30 days before this charge", and "you have seven days to notify your existing subscribers before Google Play begins to notify them directly". Google recommends an in-app notice with "a deep link to the Play Store subscription screen" (Billing Library 9's in-app messaging for opt-in increases is in [BILLING-AND-PURCHASES.md](BILLING-AND-PURCHASES.md#subscriptions-base-plans-and-offers)).
- **Opt-out increases:** notice of "either 30 days or 60 days", "only available in certain locations with limits on the increase amount and frequency".
- **Apple's rules differ** (consent thresholds, 27 or 7 days' notice): [app-store-connect PRICING-AND-SUBSCRIPTIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/PRICING-AND-SUBSCRIPTIONS.md#price-increases-for-existing-subscribers). Rollout strategy for a web price change (grandfathering, staged waves) is [pricing-strategy PRICE-CHANGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/pricing-strategy/PRICE-CHANGES.md); on Play it runs inside these rules.

## Prove it

- **The update kept every region:** compare the actual region IDs and configurations in `subscriptions get` (or `iap get`, `onetimeproducts get`) before and after: requested changes match the plan, and non-target regions/values survive. Equal counts alone can hide a substituted region or reject an intentional addition. [gplay, regional pricing fetch-and-merge]
- **New-regions defaults survived:** `otherRegionsConfig` or `newRegionsConfig` is still present after the update.
- **Prices are well formed:** every `nanos` is between 0 and 999999999, prices end in `.99` where intended, and currencies match the fetched ones.
- **Dry run first:** `gplay --dry-run subscriptions update ...` succeeds before the real call.
- **Existing subscribers moved:** `baseplans migrate-prices` ran for every base plan whose price changed, and for an opt-in increase the app showed its own notice within the first seven days.
