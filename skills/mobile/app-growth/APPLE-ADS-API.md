# Apple Ads APIs and the asc ads CLI

Apple Ads has two programmatic surfaces: the **Apple Ads Platform API** (`https://api.ads.apple.com/v1/`, scoped by ad account) and the older **Campaign Management API v5** (`https://api.searchads.apple.com/api/v5/`, scoped by organization). "The Apple Ads Campaign Management API is deprecated and will be sunset on January 26, 2027. Use the Apple Ads Platform API instead." The sources warn most about mixing the two: an org ID where an ad account ID belongs, v5 payload shapes sent to v1, and spend-changing writes sent without `--confirm`. Apple's developer docs are the authority; the `asc ads` commands come from the third-party `asc` CLI authors [rorkai]. What to bid and when is [APPLE-ADS.md](APPLE-ADS.md) and [APPLE-ADS-OPTIMIZATION.md](APPLE-ADS-OPTIMIZATION.md); the rest of the `asc` CLI is [app-store-connect CLI.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/CLI.md).

**Contents:** [Versions and dates](#versions-and-dates) · [OAuth](#oauth) · [Calling the Platform API](#calling-the-platform-api) · [App Store campaign flow](#app-store-campaign-flow) · [Rate limits and errors](#rate-limits-and-errors) · [The legacy v5 API](#the-legacy-v5-api) · [asc ads](#asc-ads) · [Prove it](#prove-it)

## Versions and dates

| Version | Date | Change |
|---|---|---|
| Platform API 1.0 | August 2026 | Initial release, App Store and Apple Maps advertising |
| Campaign Management 5.6 | June 2026 | Lifetime budgets deprecated, `budgetAmount` removed: use `dailyBudgetAmount` |
| 5.5 | February 2026 | Maximize Conversions |
| 5.4 | December 2025 | Pre-order metrics `tapPreOrdersPlaced`, `viewPreOrdersPlaced`, `totalPreOrdersPlaced` |
| 5.3 | August 2025 | Budget orders no longer support a single placement |
| 5.2.1 | May 2025 | Optional `budgetAmount` at creation |
| 5.2 | March 2025 | App details endpoints; `APPSTORE_SEARCH_TAB` needs a default product page creative; custom product pages as tap destination |
| 5.1 | October 2024 | Read-only `deepLink` on `ProductPageDetail` |
| 5.0 | May 2024 | View-through metrics; `suggestedBidAmount` replaces `bidMin`/`bidMax`; search term reports require timezone `ORTZ`; `dailyBudgetAmount` required; Creative Sets deprecated |
| Campaign Management API (all of v5) | Sunset January 26, 2027 | Move to the Platform API |

API versions 1 to 3 are no longer supported. [rorkai] gives the same retirement date for v5.

## OAuth

Both APIs use the same flow:

1. **Invite a user with an API role** (Account Settings > User Management).
2. **Create a key pair:**

```
openssl ecparam -genkey -name prime256v1 -noout -out private-key.pem
openssl ec -in private-key.pem -pubout -out public-key.pem
```

3. **Upload the public key** at Account Settings > API to get `clientId`, `teamId` and `keyId`.
4. **Client secret:** an ES256 JWT with header `alg: ES256`, `kid: keyId` and claims `sub: clientId`, `iss: teamId`, `aud: https://appleid.apple.com`, `iat`, `exp` (less than 180 days after `iat`).
5. **Token:** `POST https://appleid.apple.com/auth/oauth2/token`, `Content-Type: application/x-www-form-urlencoded`, with `grant_type=client_credentials`, `client_id`, `client_secret`, `scope=searchadsorg`. The response has `token_type: Bearer` and `expires_in: 3600`.

- **Apple's client libraries handle the token lifecycle:** `apple-ads-platform-api-swift`, `apple-ads-platform-api-python`, `apple-ads-platform-api-java`, `apple-ads-platform-api-node`.

## Calling the Platform API

- **Base and headers:** `https://api.ads.apple.com/v1/` with `Authorization: Bearer {access_token}` and `X-AP-Context: adAccountId={adAccountId}`. The context header isn't needed for Get User ACL, Get Me Details, Get Org by ID, Get Advertiser Resources and Create Ad Accounts. Budget orders are organization-scoped.
- **Ad accounts:** an App Store account needs `productFeatures: ["APPSTORE_APP_MANUAL"]` (Maps uses `BUSINESS_BRAND_MANUAL`) and a `CONTENT_PROVIDER` delegation with the CPID as `resourceId`. An App Store account can't run Maps campaigns and vice versa. `delegations` uses full-replacement semantics: an update replaces the whole list.
- **Query:** `POST /v1/<entity>/query` with `filters` (`field`, `operator`, `value`, `ignoreCase`), `sorting` (`ASC`/`DESC`, default by ID ascending) and `pagination` (`offset`, `pageSize`, `fetchTotalCount`). Deleted entities come back only when you filter for them.
- **Updates:** PUT is partial, but arrays are replaced entirely.
- **Bulk:** `items[]` of `{correlationId, data}` plus `allowPartialSuccess` (default `false`: any failure rejects the whole batch).
- **Responses** wrap `result`, `pagination` and `error {code, message, details[{code, message, info}]}`.

## App Store campaign flow

1. `GET /v1/acls`, then `GET /v1/ad-accounts/{adAccountId}`.
2. `GET /v1/search/apps`: the Adam ID becomes `promotedObjectId`. `GET /v1/apps/{adamId}` and check `availableStorefronts`. `POST /v1/eligibilities/apps/query`.
3. `POST /v1/campaigns` with `promotedObjectType: "APPSTORE_APP"`, `billingEvent: "TAPS"`, `dailyBudget`, `targeting {supplySource APPSTORE, supplyPlacement APPSTORE_SEARCH_RESULTS | APPSTORE_SEARCH_TAB | APPSTORE_TODAY_TAB | APPSTORE_PRODUCT_PAGES, countryOrRegion (ISO 3166-1 alpha-2)}` and `bidStrategy {bidStrategyType: "MANUAL_CPT", bidStrategyGoal: "TAP"}`. `supplySource` is fixed at creation; placement and country can change.
4. `POST /v1/adgroups` (`pricingModel: "CPT"`, bid, start and end).
5. `POST /v1/keywords/bulk-create` (`matchType` `BROAD` or `EXACT`, optional per-keyword bid).
6. `POST /v1/negative-keywords`: campaign level sets `campaignId` and omits `adGroupId`; ad group level the reverse.
7. `POST /v1/creatives` (`creativeType: DEFAULT_PRODUCT_PAGE`, or `CUSTOM_PRODUCT_PAGE` with `productPageId`; `destination.destinationType: APP_STORE_PRODUCT_PAGE`), then `POST /v1/ads`.
8. **Reports:** `POST /v1/reports/apps/campaigns/query` with a required `timeRange {start, end, timeZone, granularity}`.
9. **Optimize** with Query Daily Budget Recommendations, Impression Share Query, Search Term Popularity Query, Query Keyword Suggestions and Query Phrase Suggestions.

## Rate limits and errors

- **Every response carries** `RateLimit-Limit`, `RateLimit-Remaining` and `RateLimit-Reset` (delta seconds), per the IETF RateLimit header draft. A `429` adds `Retry-After`, which takes precedence over `RateLimit-Reset`. Double the wait on consecutive 429s up to a maximum such as 16 seconds, and reset the backoff after a success. Generated clients expose `_with_http_info` methods returning `(data, status_code, headers)`.

| Status | Code |
|---|---|
| 400 | `bad_request` |
| 401 | `unauthorized` |
| 403 | `forbidden` |
| 404 | `not_found` |
| 429 | `rate_limit_exceeded` |
| 500 | `internal_server_error` |

## The legacy v5 API

Only for code not yet moved; it stops working on January 26, 2027.

```
curl "https://api.searchads.apple.com/api/v5/campaigns" -H "Authorization: Bearer {access_token}" -H "X-AP-Context: orgId={orgId}"
```

- **Context is `orgId`,** not `adAccountId`.
- **Create campaign fields:** `orgId`, `adChannelType: "SEARCH"`, `supplySources: ["APPSTORE_SEARCH_RESULTS"]`, `billingEvent: "TAPS"`, `name`, `dailyBudgetAmount {amount, currency}`, `adamId`, `countriesOrRegions`. Partial updates send a `campaign` envelope on PUT; partial fetch with `?fields=id,name,countriesOrRegions`.
- **Errors and retries:** 401 unauthorized means an invalid or expired token; 403 forbidden means insufficient privileges. Retry with exponential backoff of 2, 4, 8, 16 seconds, then cap.

## asc ads

Source: [rorkai].

### Auth and context

- **Apple Ads credentials are separate from App Store Connect:** `asc auth login` does not configure Ads.

```bash
asc ads auth login \
  --name "Marketing" \
  --client-id "$ASC_ADS_CLIENT_ID" \
  --team-id "$ASC_ADS_TEAM_ID" \
  --key-id "$ASC_ADS_KEY_ID" \
  --private-key "$ASC_ADS_PRIVATE_KEY_PATH" \
  --ad-account "987654" \
  --org "123456" \
  --network
```

- **CI env:** `ASC_ADS_CLIENT_ID`, `ASC_ADS_TEAM_ID`, `ASC_ADS_KEY_ID`, `ASC_ADS_PRIVATE_KEY_PATH`, `ASC_ADS_AD_ACCOUNT_ID`, `ASC_ADS_BYPASS_KEYCHAIN=1`; also `ASC_ADS_PRIVATE_KEY`, `ASC_ADS_PRIVATE_KEY_B64`, `ASC_ADS_ACCESS_TOKEN` (a short-lived token from a trusted process).
- **Check access:** `asc ads auth status --validate --output json`; `asc ads auth discover --ads-profile "Marketing" --output json` (calls `GET /v1/me` and `GET /v1/acls`); `asc ads auth doctor --output json`. Never auto-select the first ACL.
- **Two APIs, two IDs:** `asc ads <resource>` is Platform API v1 with an ad account ID; `asc ads v5 ...` is the deprecated v5 API with an organization ID. Never substitute the org ID for the ad account ID. The CLI doesn't translate v1 and v5 payloads.
- **Context precedence:** v1: `--ad-account`, `ASC_ADS_AD_ACCOUNT_ID`, the selected profile, the profile-less root config. v5: `--org`, then the `ASC_ADS_ORG_ID` chain. Named profiles' `ad_account_id` and `org_id` don't inherit.
- **Read-only checks:** `asc ads me view`, `asc ads acls list`, `asc ads orgs view --org-id`. Prove the account with `asc ads apps search --ads-profile --ad-account --query "Example" --limit 1 --output json` (needs one of `--query`, `--cpids`, `--return-owned-apps`; storefronts as an ISO alpha-2 comma list).

### Bodies, queries and reports

- **`--file -` reads JSON from stdin** (rejected on a terminal). Resource, report, upload and raw commands emit lossless JSON; use `jq`.
- **v1 query body:**

```json
{
  "filters": [
    {"field": "campaignId", "operator": "EQUALS", "value": ["campaign-id"]}
  ],
  "pagination": {"offset": 0, "pageSize": 100, "fetchTotalCount": true}
}
```

- **No `--paginate` on `asc ads campaigns find`:** advance `pagination.offset`. Platform filters use a singular `value`; v5 `Selector` fields (`conditions`, plural `values`) are rejected.
- **Keywords:** targeting keyword queries need an `id`, `adGroupId` or `campaignId` filter; negative keyword queries need `id` or `adGroupId`; campaign-level negatives combine `campaignId` with `adGroupId` operator `IS_NULL`. Commands: `asc ads targeting-keywords find`, `asc ads negative-keywords find --file`.
- **Reports body:**

```json
{
  "pagination": {"offset": 0, "pageSize": 20},
  "filters": [
    {"field": "campaignId", "operator": "EQUALS", "value": ["campaign-id"]}
  ],
  "groupBy": ["countryOrRegion"],
  "timeRange": {
    "start": "2026-08-01",
    "end": "2026-08-14",
    "timeZone": "ORTZ",
    "granularity": "DAILY"
  }
}
```

  Run `asc ads reports apps campaigns --ads-profile --ad-account --file report.json --output json`; no `--paginate`.
- **Recommendations:** `asc ads recommendations daily-budgets find|apply ... --confirm` (apply and dismiss can change spend).

### Creating and changing spend

- **`CampaignCreate` requires** `adAccountId`, `billingEvent`, `dailyBudget`, `name`, `promotedObjectId`, `promotedObjectType`, `targeting`. `--ad-account` does not inject `adAccountId` into the JSON. A paused template:

```json
{
  "name": "ASC agent validation 2026-08-15T00:00:00Z",
  "status": "PAUSED",
  "adAccountId": 987654,
  "promotedObjectType": "APPSTORE_APP",
  "promotedObjectId": "123456789",
  "billingEvent": "TAPS",
  "dailyBudget": {"value": {"amount": "1", "currency": "USD"}},
  "startTime": "2030-01-01T00:00:00.000",
  "endTime": "2030-01-02T00:00:00.000",
  "targeting": {"countryOrRegion": {"include": ["US"]}},
  "bidStrategy": {"bidStrategyType": "MANUAL_CPT", "bidStrategyGoal": "TAP"}
}
```

- **`--confirm` rules:** an explicit top-level `"status":"PAUSED"` create runs without `--confirm`; an omitted or non-paused status needs it. Commands: `campaigns create`, `campaigns pause`, `campaigns resume --confirm`. Campaign updates touching budget, targeting, bids, delivery, dates or status need `--confirm` (name-only or name plus `PAUSED` don't). Deletes, bulk writes, recommendation apply or dismiss and budget-order writes require confirmation before auth or network. Ad group creates and keyword bulk writes are always confirmed; v1 bulk keyword files use wrapper objects like `KeywordCreateBulkRequest`, not v5 raw arrays. Shared budgets: `asc ads budget-orders create|update|delete ... --confirm`. Ad account creation requires `--confirm` (its family can't change and there's no delete endpoint); an ad account update with `delegations` replaces the complete list.
- **Assets:** `asc ads assets upload --ads-profile --file ./brand.png --brand "BRAND_ID" --ad-account`, then poll `asc ads assets view --asset "ASSET_UUID"`. Use only `eligibility.status` `ELIGIBLE`; for `LIMITED` inspect `allowedGroups`; never attach `PENDING` or `INELIGIBLE`.
- **Raw requests:** `asc ads api request --method POST --path v1/campaigns/query ...` (only `v1/...` paths or `https://api.ads.apple.com/v1/...`; unknown mutations fail closed; multipart is rejected). Legacy: `asc ads v5 api request --method POST --path v5/campaigns/find --org "123456" --file selector.json`.

### v5 to v1 command map

| v5 | v1 |
|---|---|
| `v5 campaigns list` | `campaigns find` |
| `v5 apps localized-details` | `apps locales find` |
| `v5 product-pages list` | `product-pages find` |
| `v5 reports campaigns` | `reports apps campaigns` |
| `v5 campaigns pause/resume` | `campaigns pause/resume` |
| v5 negative keywords | `negative-keywords ...` with the scope in the body |

Seven v5 leaves have no one-command v1 replacement: product-page countries, product-page devices, targeting-keyword bulk delete, both negative-keyword bulk deletes, and the impression-share report list and view.

### Live-test cleanup

ACL discovery plus a one-result app search; a unique timestamped name and `PAUSED`; save every ID; pause first; reread with `asc ads campaigns view ... --campaign`; delete only what the test created, with `--confirm`. A not-found on re-view is the cleanup proof.

## Prove it

- **No v5 left before the sunset:** no code or script calls `api.searchads.apple.com/api/v5` or `asc ads v5`, and every request that needs a context header sends `X-AP-Context: adAccountId=...`, not `orgId`.
- **Token:** a token request returns `token_type: Bearer` with `expires_in: 3600`, and the client secret's `exp` is under 180 days from `iat`.
- **Access:** `asc ads auth status --validate --output json` succeeds and `asc ads apps search ... --limit 1` returns the app under the intended ad account.
- **Backoff:** a forced `429` waits `Retry-After`, doubles on repeats up to the cap, and resets after a success.
- **Safe writes:** a test campaign is created `PAUSED`, read back, and deleted with `--confirm`; re-viewing it returns not-found.
- **Arrays:** after a PUT that touches an array field (or `delegations`), a read-back shows the full intended list, not just the items sent.
