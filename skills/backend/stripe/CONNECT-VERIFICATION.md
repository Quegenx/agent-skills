# Connect verification requirements

Which KYC information a connected account must provide depends on the platform country, account country, dashboard, service agreement, business type and structure, the requested capabilities and the Accounts API version. Stripe's page `https://docs.stripe.com/connect/required-verification-information` lets users pick those and see the fields; the same data comes from public docs endpoints, which this file shows how to query and present. Ask a field only after its dependencies resolve, show only options the endpoints validate, and never guess past a `validation_errors` response. Account setup and capability gating are in [CONNECT.md](CONNECT.md).

**Contents:** [Setup fields](#setup-fields) · [Asking the questions](#asking-the-questions) · [Capability resolution](#capability-resolution) · [Endpoints](#endpoints) · [Building the result tables](#building-the-result-tables) · [Row definitions](#row-definitions) · [JSON summary](#json-summary) · [Responding](#responding) · [Prove it](#prove-it)

## Setup fields

| Internal field | Say to the user |
|---|---|
| `apiVersion` | Accounts API version (`v1` or `v2`; recommend `v2`, always ask first) |
| `platformCountry` | Platform country |
| `accountCountry` | Account country |
| `dashboardType` | Dashboard type |
| `tosType` | Service agreement |
| `legalEntityType` | Business type |
| `businessStructure` | Business structure (optional; ask only when `legalEntityType` is not `individual`) |
| `capabilities` | Capabilities (at least one) |
| `orrProgram` | Requirements update (only if present in `programs`) |
| `eu2025` | Europe |

- **Dependency chain:** `platformCountry`, then `accountCountry`, then {`dashboardType`, `tosType`, `legalEntityType`, `capabilities`, `orrProgram`}; `legalEntityType` feeds `businessStructure`; `tosType` and `apiVersion` feed `capabilities`; everything feeds the final request. Ask a field only after its dependencies resolve.
- **Grouping:** ask `platformCountry` and `accountCountry` separately; `dashboardType`, `tosType` and `legalEntityType` may be grouped.
- **Skip `businessStructure`** when the map for the chosen `legalEntityType` is empty or holds exactly one key, `nil`; otherwise allow a `none` option.
- **Changing an earlier answer** invalidates and re-checks every downstream field. Changing `accountCountry`, `tosType` or `apiVersion` re-runs capability resolution.

## Asking the questions

- **Every field is a multiple-choice question;** free input goes through the question's free-response field. Reuse valid earlier answers.
- **More than four options:** print the full validated reference list first (countries as `Germany (DE)`), then a multiple-choice with a few suggestions (blank descriptions for country suggestions). Four or fewer: show them all directly.
- **Only show options pre-validated against known constraints;** never show one that will be removed or auto-adjusted.
- **On a conflict,** tell the user and ask them to revise; never drop a choice silently.

## Capability resolution

1. Start from `country_map[accountCountry].capabilities`.
2. `tosType=recipient`: force `transfers` and remove everything else except `crypto_transfers` (available in rare cases). With `apiVersion=v1` and `crypto_transfers`, also include `transfers`.
3. `apiVersion=v2`: drop capabilities not returned by `get-v2-supported-v1-capabilities`.
4. Show the filtered list. When asked, explain what was filtered out (for example `paypal_payments` is unavailable for `v2` accounts: offer switching to `v1` or picking another capability).
5. Empty list: tell the user no capabilities are supported and ask them to revise.

## Endpoints

Host: the public docs host, `https://docs.stripe.com`.

| Endpoint | Use | Response keys |
|---|---|---|
| `/_endpoint/get-platform-countries` | Platform country list | `platform_countries`, `default_country` |
| `/_endpoint/get-v2-supported-v1-capabilities` | v2 capability filter | (none listed) |
| `/_endpoint/get-requirement-selections-for-platform-country?platformCountry=...` | Valid downstream options | `country_map` (keys are the allowed account countries; each has `.dashboard_types`, `.tos_types`, `.entity_type_structures`, `.capabilities`, `.programs`); ignore `external_country_map` |
| `/_endpoint/get-requirements-for-setups` | The requirements (nested query string, not a JSON body) | `requirements`, `validation_errors`, `build_errors`; per setup `requirements[field_name]`, `extras`, `requirement_tags`, `requirement_groups` |
| `/_endpoint/get-website-requirements-for-capabilities?capabilities[i]=...` | Website requirements | `requirements_by_capability` |
| `/_endpoint/get-mcc-restrictions-for-capabilities?capabilities[i]=...` | MCC restrictions | `restrictions_by_capability` |

```bash
curl --get "$DOCS_HOST/_endpoint/get-requirements-for-setups" \
  --data-urlencode "account-setup-A[apiVersion]=v2" \
  --data-urlencode "account-setup-A[platformCountry]=CA" \
  --data-urlencode "account-setup-A[accountCountry]=FR" \
  --data-urlencode "account-setup-A[dashboardType]=none" \
  --data-urlencode "account-setup-A[tosType]=full" \
  --data-urlencode "account-setup-A[legalEntityType]=company" \
  --data-urlencode "account-setup-A[businessStructure]=corporation" \
  --data-urlencode "account-setup-A[capabilities][0]=card_payments"
```

- **The requirements update program** is one more parameter: `--data-urlencode "account-setup-A[orrProgram]=eu-2025"`.
- **`validation_errors`** mean the setup is invalid: ask the user to correct it, don't guess. **`build_errors`** are retryable; if they persist, say the helper endpoint failed. Conclude "unsupported setup" only from successful fetches and validation results.
- **Empty website or MCC maps are valid** for many standard capabilities; say so, so the user doesn't read it as a failed fetch. If MCC restrictions exist, ask what kind of business they run.
- **Comparing two setups** (or "update from X to Y"): validate setup A (`account-setup-A[...]`), then setup B (`account-setup-B[...]`), then send the request with both to diff them.

## Building the result tables

- **Split raw field keys by prefix into sections:** `company`, `documents`, `individual`, `representative`, `directors`, `owners`, `executives`, and everything else as `account`. One table per non-empty section, never merged.
- **Columns:** a blank first column (the row's display name), `Requirement` (one code-formatted bullet per field; alternatives as `` `field_a` or `field_b` ``), `Verification` (bullets from `extras[].value`), `Enforcement action`.
- **Enforcement action:** unverified limits (`capability_limit_amount`, `capability_limit_time`, `payment_limit_amount`, `payment_limit_time`, `payout_limit_amount`, `payout_limit_time`) read "if not provided"; their `verified_*` versions read "if not verified". A value `<= 0` means immediately. Join amount and time for the same impact with `or`, group identical thresholds ("Capability, payments, and payouts will be paused immediately if not provided."), and put "if not verified" sentences after, the first prefixed "Also,". No limits: the cell holds a single dash placeholder (U+2014).
- **Row families:** `account` rows for the account section; `entity` rows for company and documents; `person` rows for individual, representative, owners, executives and directors. Strip the section prefix before matching.
- **`apiVersion=v2`:** replace each field with its `v2_field_name` and use `v2_alternatives`; omit fields with no `v2_field_name`, then drop empty rows and sections.
- **Website and MCC results** go in their own tables.

## Row definitions

Account rows:

| Row | Pattern |
|---|---|
| Merchant category code | `/business_profile.mcc/` |
| URL | `/business_profile.(url\|requirement)/` |
| Product description | `/business_profile.product_description/` |
| Support phone | `/business_profile.support_phone/` |
| Statement descriptors | `/settings.payments.statement_descriptor/`, `/settings.card_payments.statement_descriptor/` |
| Konbini support email, phone, hours | `/settings.konbini_payments.support_email\|support_phone\|support_hours/` |
| Terms of service | `/^tos_acceptance\./` |
| Issuing terms of service | `/settings\.card_issuing\.tos_acceptance\./` |
| Estimated worker count | `/business_profile\.estimated_worker_count/` |
| Annual revenue | `/business_profile\.annual_revenue/` |
| External account | `/external_account/` |
| Legal guardian | `/legal_guardian\./` |

Entity rows:

| Row | Pattern |
|---|---|
| Company name | `/name$/`; kana `/name_kana/`; kanji `/name_kanji/` |
| Company address | `/address\..*/`, plus kana and kanji variants |
| Phone | `/phone/` |
| Tax ID | `/tax_id/` |
| Registration number | `/registration_number/` |
| ID number | `/id_number/` |
| Trade license | `/company_license/` |
| Memorandum of Association | `/company_memorandum_of_association/` |
| Proof of bank account | `/bank_account_ownership_verification/` |
| Directors, owners, executives provided | `/directors_provided/`, `/owners_provided/`, `/executives_provided/` |

Person rows:

| Row | Pattern |
|---|---|
| Name | `/(first\|last)_name/`, plus kana and kanji variants |
| Aliases | `/full_name_aliases/` |
| Date of birth | `/dob\./` |
| Address | `/^address\./`, plus kana and kanji variants |
| Registered address | `/registered_address/` |
| Email, Phone, Gender, Nationality, Passport | (one row each) |
| Political Exposure | `/political_exposure/` |
| Tax information | `/ssn_last_4$/` or `/id_number$/` |
| Secondary ID | `/(id_number_secondary)/` |
| Job title | `/(relationship\.title)/` |
| Relationship with legal entity | `/relationship\.(?!title)/` |
| Proof of liveness | `/proof_of_liveness/` |

(The `\|` in the tables is a literal `|` in the pattern.)

## JSON summary

Only when the user asks:

```json
{
  "requirements": {
    "currently_due": [
      "configuration.merchant.mcc",
      "company.name",
      "representative.first_name"
    ],
    "eventually_due": [
      "business_profile.url"
    ]
  }
}
```

- **`currently_due`** when any unverified or verified limit amount or time is `<= 0`; otherwise `eventually_due`. There is no `future_requirements` bucket: future changes are modeled through `orrProgram` and an A/B comparison.
- **Names:** v1 raw names; for v2, `v2_field_name` (omit fields without one). No ellipses or placeholders. For v2, say it's informational and not a real API response shape. A JSON diff compares names only.

## Responding

- **Restate the exact validated setup** and link the docs page with its exact query parameters, for example `https://docs.stripe.com/connect/required-verification-information?accountSetupKeys=account-setup-A&account-setup-A%5BapiVersion%5D=v2&account-setup-A%5BplatformCountry%5D=CA&account-setup-A%5BaccountCountry%5D=FR&account-setup-A%5BdashboardType%5D=full&account-setup-A%5BtosType%5D=full&account-setup-A%5BlegalEntityType%5D=individual&account-setup-A%5BbusinessStructure%5D=undefined&account-setup-A%5Bcapabilities%5D=card_payments&account-setup-A%5BorrProgram%5D=eu-2025`. Include setup B only if it was queried.
- **Say which choices dependencies changed,** present currently due separately from eventually due, explain verification from `extras[].value`, and mention requirements left out because they matched no row definition.

## Prove it

- Every option shown came from `get-platform-countries` or `country_map` for the chosen platform country, and the capability list went through the resolution steps (recipient forcing, v2 filtering).
- `get-requirements-for-setups` returned no `validation_errors` for the setup you report; any `build_errors` were retried or reported as an endpoint failure.
- One table per non-empty section, v2 field names used for `apiVersion=v2`, enforcement sentences built from the limit fields, website and MCC results in separate tables.
- The response links the docs page with the same query parameters you sent.
