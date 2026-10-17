# Audiences

Audiences filter a project's customers into a segment (who they are, a product or duration, spend, renewals, status, country, attribution) and share a dashboard link to that set. RevenueCat can filter and segment customers: do not tell the user it cannot. Filters select the segment; `sort_by` and `sort_direction` on `preview-audience` order the sample. The rules below guard against inventing field names or project-specific values (a filter on a non-existent value silently matches zero customers), reading counts from the sample instead of `stats`, and linking the wrong identifier. There is no first-class `rc` CLI command for audiences; use the MCP tools. Products, offerings and entitlements are explained in [CONCEPTS.md](CONCEPTS.md); aggregate metrics are in [CHARTS-AND-METRICS.md](CHARTS-AND-METRICS.md). Field reference: https://www.revenuecat.com/docs/dashboard-and-metrics/audiences

**Contents:** [MCP tools](#mcp-tools) · [Workflow](#workflow) · [Filter rule shape](#filter-rule-shape) · [Fields and operators](#fields-and-operators) · [Value formats](#value-formats) · [Project-specific values](#project-specific-values) · [Links](#links) · [Examples](#examples) · [Prove it](#prove-it)

## MCP tools

| Tool | Use |
|---|---|
| `get-audience-filter-options` | Project-specific values for fields (params `project_id`, `fields`) |
| `preview-audience` | Read-only preview of a segment (params `project_id`, `body.rules` or `body.audience_uuid`, top-level `sort_by`, `sort_direction`) |
| `create-audience` | Save a rule as an audience |
| `get-audience`, `list-audiences` | Read saved audiences |
| `list-projects` | Project IDs (`proj...`) |

## Workflow

1. **Fetch project-specific values:** `get-audience-filter-options` (`project_id`, `fields`) for any project-specific field you use.
2. **Preview:** `preview-audience` with `project_id` and `body.rules` (or `body.audience_uuid` for a saved audience from `list-audiences`). It is read-only and saves nothing. Do not `create-audience` just to inspect a segment.
3. **Rank with top-level params,** not inside `body`: `sort_by` (`status`, `latest_auto_renew_intent`, `first_seen_at`, `last_seen_at`, `total_spent`) and `sort_direction` (`asc` default, or `desc`). `total_spent` with `desc` puts the highest spenders first, so the first `customer_sample` row is the top spender. The sample is capped (typically 50): it shows the top or bottom matches, not every customer.
4. **Count from `stats`, never from the sample size:** `total_customers`, `active_subscriptions`, `active_trials`, `total_revenue` (in `currency`). When `stats.is_approximate` is true, give counts and revenue as approximate ("about 6,400 customers").
5. **Name customers only from `customer_sample` fields:** `app_user_id`, `email`, `status`, `total_spent`, `latest_product_name`, first and last seen. Without `sort_by` the sample is unordered: call it a sample, not a ranking.
6. **`totalRenewals` is filter-only:** not a `sort_by` option and not a sample column. Filter on a high threshold and report the matches; don't invent a renewal count or claim a unique maximum.
7. **Share the tool's link:** the `preview-audience` result for `body.rules` includes a line starting "Dashboard URL for this result"; link that exact URL. Build one yourself only when no tool gave a URL.

- **Field groups:** product and duration (`latestProduct`, `allPurchasedProductIds`, `latestPurchasedOffering`, entitlements, offers); spend and renewals (`totalSpent` as a filter and `sort_by: total_spent`; `totalRenewals` filter only, no renewal sort); subscription state (`status`, trial, auto-renew intent, ownership); store, platform and country (`platform`, `latestStore`, `country`, `storefront`); dates (first seen, purchases, renewals, expiration, trial, cancellation); attribution and experiments (media source, campaign, ad group, keywords, price experiment); identity and custom attributes (app user ID, email, locale, `customAttribute:{key}`). Map the question onto those fields, filter, then read a sample.
- **The dashboard preview table shows only** Customer, Subscription Status, Auto-Renewal Status, Spent and Latest Purchase. Other attributes are in the **Export all** CSV or the customer profile.

## Filter rule shape

```json
{
  "groups": [
    {
      "conditions": [{ "field": "platform", "operator": "is", "value": "android" }]
    }
  ]
}
```

- **Conditions within a group AND; groups OR.** Use one group per OR branch.
- **`value` is always a JSON string:** booleans `"true"` or `"false"`, numbers `"42"`, lists comma-separated, date ranges and relative dates as stringified JSON.

## Fields and operators

Use these exact strings. Do not invent field or operator names.

| Type | Operators | Fields |
|---|---|---|
| Text | `is`, `isNot`, `contains`, `doesNotContain`, `isEmpty`, `isNotEmpty` | `customerId` (App user ID), `originalAppUserId`, `email`, `phoneNumber`, `locale`, `appVersion`, `sdkVersion`, `platformVersion` (OS version), `projectId` (e.g. `proj1ab2c3d4`), `projectName`, `appConfigId` (App ID e.g. `app1ab2c3d4`), `appConfigName`, `idfa`, `idfv`, `gpsAdId`, `latestPurchasedOffering`, `latestOffer`, `latestEntitlements`, `allPurchasedProductIds` |
| Enum | `is`, `isNot`, `isAnyOf`, `isNotAnyOf`, `isEmpty`, `isNotEmpty` | See the enum table below |
| Boolean | `is`, `isNot` (value exactly `"true"` or `"false"`) | `hasMadeSandboxPurchase`, `hasMadeNonSubscriptionPurchase`, `latestAutoRenewIntent` (`true` = set to renew), `isCurrentlyTrialing`, `isRcPromo` (entitlement granted via RevenueCat promotional) |
| Number | `equal`, `notEqual`, `greaterThan`, `greaterThanOrEqual`, `lessThan`, `lessThanOrEqual`, `isEmpty`, `isNotEmpty` (numeric string, e.g. `"50"`) | `totalSpent`, `totalRenewals` |
| Date | `before`, `beforeOrOn`, `on`, `after`, `afterOrOn`, `within`, `between`, `notBetween`, `isEmpty`, `isNotEmpty` | `firstSeenAt`, `lastSeenAt`, `firstPurchaseAt`, `mostRecentPurchaseAt`, `mostRecentRenewalAt`, `latestExpirationAt`, `trialStartAt`, `trialEndAt`, `subscriptionOptOutAt` (most recent cancellation), `trialOptOutAt` (most recent trial cancellation) |
| Custom attribute | Enum operators | `customAttribute:{key}` (e.g. `customAttribute:favorite_team`). Fetch keys and values with `get-audience-filter-options`; never invent a key. |

| Enum field | Values |
|---|---|
| `platform` | `iOS`, `android`, `web`, `macOS`, `amazon`, `roku`, `tvOS`, `visionOS`, `watchOS` |
| `status` | `active`, `trialing`, `in_grace_period`, `in_billing_retry`, `paused`, `expired`, `incomplete`, `unknown` |
| `latestStore` (and `anyActiveStore`) | `app_store`, `play_store`, `promotional`, `mac_app_store`, `stripe`, `amazon`, `roku`, `rc_billing`, `paddle`, `external` |
| `latestOwnershipType` | `PURCHASED`, `FAMILY_SHARED` |
| `latestOfferType` | `no_offer`, `free_trial`, `introductory_offer`, `offer_code`, `promotional_offer`, `win_back_offer`, `unspecified_offer` |
| `priceExperimentVariant` | `a`, `b`, `c`, `d` |
| `country` (last seen country), `latestStoreCountry`, `storefront` (store country) | ISO 3166-1 alpha-2 (e.g. `US`, `DE`) |
| Project-specific: `mediaSource`, `campaign`, `adGroup`, `ad`, `keyword`, `creative`, `priceExperimentId`, `latestProduct` (product IDs) | From `get-audience-filter-options` |

## Value formats

| Operator | Value |
|---|---|
| `isEmpty`, `isNotEmpty` | `"value": ""` (ignored) |
| `isAnyOf`, `isNotAnyOf` | `"value": "US,CA,MX"` |
| `before`, `beforeOrOn`, `on`, `after`, `afterOrOn` | `"value": "2026-01-31"` (YYYY-MM-DD) |
| `between`, `notBetween` | Stringified JSON with exactly `from` and `to`: `"value": "{\"from\":\"2026-01-01\",\"to\":\"2026-01-31\"}"` (`from` <= `to`) |
| `within` | Stringified JSON with exactly `direction`, `value`, `unit`: `"value": "{\"direction\":\"last\",\"value\":30,\"unit\":\"days\"}"`; `direction` `last` or `next`; `unit` `minutes`, `hours` or `days`; `value` a non-negative integer |

- **Relative dates on other operators:** `before`, `beforeOrOn`, `after` and `afterOrOn` also accept the `within` relative format (`on` does not).

## Project-specific values

- **`get-audience-filter-options` params:** `project_id` (required) and `fields` (required, at least one): any of the eight project-specific fields, `customAttribute:{key}`, or `customAttribute` to list every key with its values.
- **`cardinality_exceeded: true`** on a custom attribute: a value the user stated verbatim can still be valid even if it is not listed.
- **Fixed-value fields are not served by this tool** (`country`, `platform`, `status` and the others in the enum table).
- **Never guess project-specific values:** a filter on a non-existent value silently matches zero customers.

## Links

### Filtered (ad hoc) lists

- **URL:** `https://app.revenuecat.com/projects/{project_id}/customer-lists/all-customers?filters={encoded_rule}`, with `{project_id}` from `list-projects` and the `proj` prefix stripped. Filters only work on the `all-customers` list. The unfiltered Audiences home is `/projects/{project_id}/customer-lists`.
- **Construct it in order:** project ID (strip `proj`); fields and operators from the tables above; project-specific values fetched first; the rule assembled (one group per OR branch, conditions inside a group for AND); serialized and URL-encoded with a short script (do not encode by hand); appended as `filters`.

```python
import json
from urllib.parse import quote

rule = {
    "groups": [
        {"conditions": [{"field": "platform", "operator": "is", "value": "android"}]},
    ]
}

print(quote(json.dumps(rule, separators=(",", ":")), safe=""))
```

- **Correct encoding** (compact JSON, whole value URL-encoded): `?filters=%7B%22groups%22%3A%5B%7B%22conditions%22%3A%5B%7B%22field%22%3A%22platform%22%2C%22operator%22%3A%22is%22%2C%22value%22%3A%22android%22%7D%5D%7D%5D%7D`
- **Wrong:** `?filters={"groups": [{"conditions": [...]}]}` (raw JSON, spaces, unencoded quotes and braces).
- **Offer to save, once per conversation.** A filtered link is ad hoc; say so in one sentence and offer: "This view isn't saved. Want me to save it as an audience so you can find it later?" On accept, `create-audience` with the same rule, then link it. Don't offer for saved-audience links.

### Saved audiences

- **Link the tool's URL:** `create-audience` and `get-audience` results include a "Dashboard URL for this result" line.
- **From `list-audiences` only, use `customer_list_id`** (the field returned alongside `id`): `https://app.revenuecat.com/projects/{project_id}/customer-lists/{customer_list_id}`.
- **`id` (`aud...`) and `customer_list_id` (`list...`) are different identifiers.** The route resolves only `customer_list_id`; an `aud...` id renders "Audience not found".
  - Correct: `https://app.revenuecat.com/projects/56965ae1/customer-lists/list7c1f0a2b93`
  - Wrong: `https://app.revenuecat.com/projects/56965ae1/customer-lists/audf0269cdf3df84dd2`
- **No `filters` param on a saved-audience link:** the audience carries its own rules. If there is no `customer_list_id`, link to `/customer-lists` and name the audience rather than guessing.

## Examples

- **"Android customers acquired through Instagram"** (`proj56965ae1`): both conditions in one group (AND):

```json
{
  "groups": [
    {
      "conditions": [
        { "field": "platform", "operator": "is", "value": "android" },
        { "field": "mediaSource", "operator": "is", "value": "Instagram" }
      ]
    }
  ]
}
```

  Link:

```
https://app.revenuecat.com/projects/56965ae1/customer-lists/all-customers?filters=%7B%22groups%22%3A%5B%7B%22conditions%22%3A%5B%7B%22field%22%3A%22platform%22%2C%22operator%22%3A%22is%22%2C%22value%22%3A%22android%22%7D%2C%7B%22field%22%3A%22mediaSource%22%2C%22operator%22%3A%22is%22%2C%22value%22%3A%22Instagram%22%7D%5D%7D%5D%7D
```

- **"iOS or Android, currently trialing, first seen in the last 30 days":**

```json
{
  "groups": [
    {
      "conditions": [
        { "field": "platform", "operator": "isAnyOf", "value": "iOS,android" },
        { "field": "isCurrentlyTrialing", "operator": "is", "value": "true" },
        {
          "field": "firstSeenAt",
          "operator": "within",
          "value": "{\"direction\":\"last\",\"value\":30,\"unit\":\"days\"}"
        }
      ]
    }
  ]
}
```

## Prove it

- **Values exist:** every project-specific value and custom attribute key in the rule came from `get-audience-filter-options` (or was stated verbatim by the user on a `cardinality_exceeded` attribute).
- **Nothing saved by accident:** inspection used `preview-audience`; `create-audience` ran only after the user accepted the save offer.
- **Counts from `stats`:** every "how many" figure matches `stats`, marked approximate when `stats.is_approximate` is true.
- **Rankings are sorted:** any "top" or "highest" claim comes from a preview with `sort_by` and `sort_direction` at the top level, and no claim ranks by renewals.
- **Links resolve:** the shared link is the tool's "Dashboard URL for this result" line, or a script-encoded `all-customers?filters=` URL, or a `customer_list_id` (`list...`) URL with no `filters` param, all with the `proj` prefix stripped.
