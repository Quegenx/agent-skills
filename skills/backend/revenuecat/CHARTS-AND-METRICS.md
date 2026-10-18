# Charts and metrics

RevenueCat's charts answer questions about revenue, MRR, conversion, retention and churn through two MCP tools: `get-chart-options-schema` says what a chart accepts, and `get-chart-data` returns its numbers. The rules below guard against three mistakes: guessing filter values or segments instead of reading the schema, comparing numbers from different charts or windows as if they were the same metric, and explaining a shift from the chart alone without looking up the configuration (offerings, paywalls, experiments) that charts cannot show. Offerings, packages and products are explained in [CONCEPTS.md](CONCEPTS.md); paywall advice is in [PAYWALLS.md](PAYWALLS.md). Forecasts and run-rates are in [FORECASTING-AND-VALUATION.md](FORECASTING-AND-VALUATION.md): read it before pulling charts for a projection.

**Contents:** [MCP tools](#mcp-tools) · [The query workflow](#the-query-workflow) · [Reading the schema](#reading-the-schema) · [Calling get-chart-data](#calling-get-chart-data) · [Reading the output](#reading-the-output) · [Analysis rules](#analysis-rules) · [Chart IDs](#chart-ids) · [Metric definitions](#metric-definitions) · [Investigating a metric shift](#investigating-a-metric-shift) · [Populations and denominators](#populations-and-denominators) · [Comparisons](#comparisons) · [Dashboard chart links](#dashboard-chart-links) · [Prove it](#prove-it)

## MCP tools

| Job | Tools |
|---|---|
| Charts and metrics | `get-chart-options-schema`, `get-chart-data` |
| Peer benchmarks | `get-benchmarks` (fields `percentile_bucket`, `is_eligible_for_benchmarking`) |
| Projects | `list-projects` (returns IDs starting with `proj`) |
| Resolving user-supplied names to filter option IDs | `list-products`, `list-offerings`, `list-apps` |
| Offering details | `get-offering` with `expand: ["package.product"]` (the experiment-analysis method instead expands offerings through `get-experiment` with `offering.package.product.indicative_price` and `offering.paywall`; see [EXPERIMENTS.md](EXPERIMENTS.md)) |
| Store status of a product | `get-product-store-state` |
| Paywalls | `list-paywalls` |
| Experiments | `list-experiments`, `get-experiment`, `get-experiment-results` (see [EXPERIMENTS.md](EXPERIMENTS.md)) |
| Customer lists | `get-audience-filter-options`, `preview-audience`, `create-audience`, `get-audience`, `list-audiences` (see [AUDIENCES.md](AUDIENCES.md)) |

- **The `rc` CLI has chart commands:** `rc charts list` (list charts), `rc charts options <chart>` (schema), `rc charts show <chart>` (data).
- **Prefer the MCP tools over `rc charts show` for forecasting:** the CLI surface does not expose expiration-month segmentation and the selectors the forecasting method needs.

## The query workflow

1. **Discover the options:** `get-chart-options-schema` for the chart.
2. **Fetch the data:** `get-chart-data` with the right options.
3. **Analyze with scripts** for any non-trivial arithmetic.

- **Start narrow and coarse:** to avoid clogging the context, start with defined timeframes and larger resolution, then narrow down.
- **Mind rate limits:** don't query too many charts at once.

## Reading the schema

- **The schema is the source of truth** for each chart before `get-chart-data`. It returns `resolutions`, `filters`, `segments` and `user_selectors`. Always call it with `"realtime": true`. Later `get-chart-data` calls must use the string IDs exactly as returned.
- **`filters`:** each has an `id` (used later as the filter `name`) and a `value_mode`:

| `value_mode` | What to pass |
|---|---|
| `inline_enum` | The `id` of one of the returned `options`. Resolve user-supplied names first with `list-products`, `list-offerings`, `list-apps` and similar. |
| `inferred_standard` | The standard code from `value_source`, such as an ISO country code. |
| `dynamic` | Values from observed project data; they must match exactly. |

- **Never pass guessed values:** no display names, store product identifiers, bundle IDs or guessed values unless the schema says they are valid.
- **`segments`:** give the dimension `id` to group by; do not list values. Filters and segments are separate per-chart lists, so never assume a filterable dimension is segmentable. For example, `conversion_to_paying` may support `product_id` and `offering_identifier` as filters but not as segments.
- **`user_selectors`:** chart-specific switches keyed by selector ID, with allowed option IDs plus a default. Examples: the `revenue` chart's `revenue_type` (`revenue`, `revenue_net_of_taxes`, `proceeds`); conversion charts' `conversion_timeframe`, default `7_days`. State non-default selector choices when presenting results.
- **`resolutions`:** string IDs. Always pass one (such as `"0"` for day or `"2"` for month).

## Calling get-chart-data

- **Always set `"realtime": true`** and specify the start date, end date and resolution ID.
- **Date ranges are inclusive.** "Last N days" means end date today and start date (N-1) days before today.
- **`filters`** is a JSON-encoded array of `{"name": "<filter id>", "values": ["<value id>", ...]}`. Values within one entry are ORed; separate entries are ANDed. App Store revenue in the US or UK:

```
"[{\"name\": \"store\", \"values\": [\"app_store\"]}, {\"name\": \"country\", \"values\": [\"US\", \"GB\"]}]"
```

- **One entry per filter name:** a repeated name silently replaces the earlier entry (it does not combine with it). Filter values must not contain commas.
- **`selectors`** is a JSON-encoded object mapping selector IDs to option IDs, for example `"{\"revenue_type\": \"proceeds\"}"`. Omitted selectors use their defaults; the response echoes the applied values in `user_selectors`.
- **`segment` multiplies output size.** Keep it small with a coarser resolution, a shorter range, `limit_num_segments` (keeps the top N by value and folds the rest into "Other"), or `aggregate`.
- **`aggregate`** answers summary-only questions (totals, averages, for example "total Q1 revenue"); prefer it over computing from raw points. With `segment` it returns per-segment summaries. The output's `values` is empty and `summary` holds just those operations.
- **`currency`** converts outputs to a monetary unit (see `yaxis_currency` in the response).

## Reading the output

- **`measures`:** the metrics returned (display name, unit, description). Most charts return several; `revenue` may return Revenue, Transactions and Ad Impressions.
- **`values`:** a flat array of `{cohort, measure, value, incomplete}`, plus `segment` when segmented. `cohort` is the Unix timestamp of the period start; `measure` and `segment` are indexes into `measures` and `segments`. The first segment is usually `"is_total": true`: never sum it together with the other segments.
- **`summary`:** `total` and `average` per measure display name, nested per segment when segmented.
- **`incomplete: true` points cover partial periods:** the current period, and the first period when `start_date` falls mid-period (`expand_periods` defaults to false). Exclude them from trend or comparison analysis and call them out. Point-in-time charts (MRR, actives, trials) ignore `expand_periods`; their values are snapshots at period boundaries and are never partial.
- **`annotations`:** dated notes the user made on their dashboard (releases, launches, experiments). Check them when explaining movements.
- **400 `parameter_error`:** invalid filters, segments or selector values fail with a message listing the supported IDs. Re-read the options schema instead of retrying guesses.

## Analysis rules

- **Use `Total` as the baseline; do not sum segments yourself.** Segmented responses include a `Total` segment, and `limit_num_segments` folds overflow into `Other`.
- **Compute with scripts:** growth rates, segment shares and cross-call combinations go through `jq` or a short Python script, not reasoning over the numbers.
- **Never compare an incomplete most-recent period against full periods** without saying so.
- **Check annotations before speculating** about the cause of a shift.
- **Hold cohort windows constant.** Cohort charts measure within a cumulative window from first seen, chosen by a selector (`conversion_timeframe` on conversion charts, `customer_lifetime` on realized LTV charts), one window per call. State the window and keep it the same when comparing cohorts.

## Chart IDs

- **IDs in use:** `revenue`, `churn`, `mrr`, `conversion_to_paying`, `trials_new`, `trial_conversion_rate`, `initial_conversion`, `subscription_status`, `subscription_retention`, `cohort_explorer`.
- **Named charts without a known ID:** New Customers, MRR Movement, Resubscription MRR, Prediction Explorer, realized LTV charts.

## Metric definitions

- **Four forces move revenue:** Acquisition (new customers arriving), Conversion (into trials or paid plans), Retention (how long they stay), Reactivation (bringing back old users). Net revenue movement is their combination. When giving advice, always use benchmark data (`get-benchmarks`) so you don't misdiagnose an issue.
- **Find the metric before saying it doesn't exist.** Pick the likely chart(s), call the schema, then `get-chart-data` and check `periods` and `measures`: unfamiliar names are often one period or measure inside a chart, which the schema alone does not list. Missing from `get-benchmarks` means no peer percentile band, not that the value can't be computed.
- **Do not invent a definition.** If nothing matches, or two readings give materially different numbers, ask the user to define the metric.

### Revenue

- **Default to gross revenue** (including taxes and store commissions) for a general revenue question without a specification, and say so. The valuation method says the opposite for its task: start from `proceeds` rather than gross revenue (see [FORECASTING-AND-VALUATION.md](FORECASTING-AND-VALUATION.md#the-profit-base)).

### Acquisition

- **New Customers chart** is the top of the funnel; segment by Country or Apple Ads dimensions. RevenueCat's Apple Ads integration sets attribution dimensions (campaign, ad group, keyword); developers can also set them per customer with reserved customer attributes.
- **A zero from an attribution filter is not proof of zero users.** `attribution_source = Organic` only means users explicitly tagged with that value; it does not include untagged users or every organic or non-paid user. Say "unattributed" or "not explicitly tagged" when data is sparse.

### Conversion

The definition of conversion may vary with the app's model: customers may convert to a trial that then converts into a subscription, or go directly to a subscription.

| Chart | Measures |
|---|---|
| Initial Conversion (`initial_conversion`) | Share of new customers that start a subscription or trial within the conversion timeframe |
| Conversion to Paying (`conversion_to_paying`) | Share of new customers that made a payment within the timeframe |
| New Trials (`trials_new`) | Whether trials are used (trial volume) |
| Trial Conversion Rate (`trial_conversion_rate`) | Trial conversion performance |

- **Initial Conversion and Conversion to Paying are different metrics.** Never use one as a stand-in for the other, or compare a value from one against a value from the other.
- **Filtered conversion charts keep the all-new-customers denominator.** Filtering Conversion to Paying on a `product_id` gives the share of all new customers converting to that product, not that product's own rate. State this caveat.

### Retention

- **Churn chart:** the % of the active subscriber base lost each period. It is hard to interpret and benchmark because it blends periods. The valuation method still scores retention from the `get-benchmarks` monthly-churn benchmark (see [FORECASTING-AND-VALUATION.md](FORECASTING-AND-VALUATION.md#positioning-scorecard)): the two sources differ on how far to trust a monthly-churn reading.
- **Reconcile before reporting outside the team** [coreyhaines31/marketingskills, marketing-plan]: its worked example flags "29% monthly App Store churn vs. 38% 12-month retention claim" as a definition mismatch ("Both can be true"), and an implied ~$4 per subscriber a month against a $30 list price as plan mix or promo pricing. Settle which definition each number uses before it goes into a plan or a pitch.
- **Long-term product retention:** the Subscription Retention chart, or Cohort Explorer with the `retained_subscriptions` measure (subscriptions still active, that is not expired, over time).
- **When in the lifecycle subscriptions get cancelled** (auto-renew turned off): Cohort Explorer with the `subscriptions_set_to_renew` measure.
- **Subscription Retention** reports each cohort's renewals period by period as counts and precomputed rates ("Month N" and "Month N rate" columns). A single period answers questions like "what share renewed once": the first renewal is the period matching the plan length (Month 1 for monthly, Year 1 for annual). Filter by `product_duration` for one plan length per read, and by `subscription_type` (`new`) to exclude product changes and resubscriptions. Periods a cohort hasn't fully reached are reported incomplete: don't read them as zeros.

### Reactivation

- **Read the MRR Movement chart and Resubscription MRR:** that is the only real way to understand Reactivation.

## Investigating a metric shift

Follow these steps in order. Do not skip step 2.

1. **Quantify the shift:** pull chart data and confirm the magnitude and timing.
2. **Check configuration.** Offerings, packages, products, paywalls and experiments are not visible in metrics, so never infer them from a chart. If the answer names any of them, look it up in this run:
   - `list-experiments` with `status="stopped"` and `status="running"`. If one stopped near the shift, `get-experiment-results` to see which variant won.
   - `list-offerings` with `limit: 100` (the default page of 20 rarely covers a real project), then `get-offering` on the `is_current` id with `expand: ["package.product"]`. `paywall_id: null` means no RevenueCat paywall: read [PAYWALLS.md](PAYWALLS.md) before giving paywall advice.
   - `get-product-store-state` before saying a product is retired, unavailable or no longer selling. Report store status in plain language, never raw field names.
   - If experiments and offerings don't explain it, `list-paywalls` for paywall changes.
3. **Check the annotations** in the chart response.
4. **Only then form a hypothesis,** and present it as one. An unverified guess about configuration is a missing tool call, never the headline finding.

- **If the calls can't explain the shift, say so** rather than constructing a mechanism.

## Populations and denominators

- **A rate only describes its denominator population.** Before presenting one, check that this is the population the question is about. When one segment dominates the denominator, the blended rate describes that segment, not the app; re-query filtered to the right population and lead with that number.
- **Never present a rate as evidence while calling its denominator inflated or unrepresentative.** Re-query with a filter instead of caveating, and report the filtered numbers yourself rather than telling the user to look.

## Comparisons

- **Compare like with like:** same chart and metric, same conversion window and cohort definition, same date range except in deliberate period-over-period comparisons. If one side is missing, query it with the same chart and settings; don't substitute from another chart.
- **"How are {segment} users doing?"** Pull the segment and an overall, unfiltered baseline for the key conversion or revenue-quality metric. Don't call a segment "healthy" or "underperforming" without a baseline.
- **Don't compare a filtered new-customer cohort's revenue or conversions against total app revenue** from all cohorts and renewals. If there is no matching baseline, say so and avoid directional claims.
- **When two metrics diverge, say what each counts** before explaining the gap.
- **One column per metric.** Wrong, different charts merged under one header:

| Country | Conversion to paying (14d) |
| ------- | ----------------------------------- |
| US | 26.3% (this is Initial Conversion) |
| PL | 2.1% (this is Conversion to Paying) |

Correct:

| Country | Initial conversion (14d) | Conversion to paying (14d) |
| ------- | ------------------------ | -------------------------- |
| US | 26.3% | 9.6% |
| PL | 4.3% | 2.1% |

## Dashboard chart links

- **Build a link only from a verified, successful `get-chart-data` call.** If none exists, run the query workflow first.
- **Link specifically:** carry the filters, segments, date range and selectors. Proceeds for the last 3 months is the revenue chart with a custom range and `revenue_type=proceeds`, not the plain chart.
- **Structure:** `https://app.revenuecat.com/projects/{project_id}/charts/{chart_name}?range={range_value}`. `{project_id}` is the short hex ID (for example `56965ae1`), not `proj56965ae1`: take it from `list-projects` and strip the `proj` prefix. The project ID goes in the path, not a query param. `{chart_name}` is the same name used with `get-chart-data`.
- **Steps:** base URL; add `range` (required); add `resolution` (don't trust defaults); add `filter` params; add `segment` if segmenting; add chart-specific selectors; URL-encode all values (spaces to `+`, colons to `%3A`).

| Param | Format |
|---|---|
| `range` | `{preset}:{start_date}:{end_date}`, dates `YYYY-MM-DD`, preset `Custom`, `:` encoded as `%3A`: `range=Custom%3A2025-01-01%3A2025-12-31`. Never use `start_date`, `end_date`, `chart_start` or `chart_end` params. |
| `resolution` | `0` daily, `1` weekly, `2` monthly, `3` quarterly, `4` yearly |
| `segment` | The exact dimension ID used in `get-chart-data`: `country`, `store`, `product_id`, `platform`, `offering_identifier`. Only link a segment you successfully used for that chart. |
| `filter` | One param per value, `{dimension}%3A%3D%3A{value}`, with the dimension names used in the `get-chart-data` request: `filter=country%3A%3D%3AUS`, `filter=store%3A%3D%3Aapp_store`, `filter=product_id%3A%3D%3Aprodbb68905d98`, `filter=platform%3A%3D%3AiOS`. Same dimension = OR, different dimensions = AND. |
| Selectors | Individual query params with the same names and values as the `get-chart-data` `selectors` |

- **Selector values are orientative; the truth is in `get-chart-data`:** `revenue_type`: `revenue`, `revenue_net_of_taxes`, `proceeds`. `conversion_timeframe`: `0_days`, `3_days`, `7_days`, `14_days`, `30_days`, `unbounded`. `customer_lifetime` (realized LTV): `7_days`, `14_days`, `30_days`, `3_months` up to `24_months`, or `unbounded`.
- **API to dashboard mapping:** `start_date` + `end_date` become `range=Custom%3A{start}%3A{end}`; `segment` stays `segment`; the `filters` JSON array becomes individual `filter` params; the `selectors` JSON object becomes individual query params.
- **Correct:** `https://app.revenuecat.com/projects/56965ae1/charts/revenue?range=Custom%3A2025-11-16%3A2026-02-13`
- **Wrong:** `https://app.revenuecat.com/charts/revenue?project=proj56965ae1&chart_start=...&chart_end=...`
- **Examples (today 2026-02-13):** revenue for the last 90 days, segmented by country, filtered to US and Germany:

```
https://app.revenuecat.com/projects/56965ae1/charts/revenue?range=Custom%3A2025-11-16%3A2026-02-13&segment=country&filter=country%3A%3D%3AUS&filter=country%3A%3D%3ADE
```

  Churn from August 2025 to now:

```
https://app.revenuecat.com/projects/56965ae1/charts/churn?range=Custom%3A2025-08-01%3A2026-02-13
```

## Prove it

- **Schema first:** every `get-chart-data` call is preceded by `get-chart-options-schema` for that chart, both with `"realtime": true`, and every filter, segment, selector and resolution value appears in that schema output.
- **No 400 retries by guessing:** after a `parameter_error`, the next call uses an ID from the error message or the re-read schema.
- **Filters:** no filter name appears twice in one `filters` array, and no value contains a comma.
- **Totals:** no answer sums the `is_total` segment with other segments; segment shares are computed by a script against `Total`.
- **Incomplete periods:** every `incomplete: true` point is excluded from trends or called out. The same rule for rates [coreyhaines31/marketingskills, marketing-plan]: "every rate divides matching closed windows", and "a trial still inside its window is pending, not failed".
- **Selectors stated:** any non-default selector (for example `revenue_type=proceeds`, `conversion_timeframe=14_days`) is named in the answer, and cohort comparisons use one window.
- **Shift explained from tool calls:** an answer to "why did X change" that names an offering, package, product, paywall or experiment rests on `list-experiments`, `list-offerings`, `get-offering`, `get-product-store-state` or `list-paywalls` calls from this run, and the annotations were checked.
- **Links:** every chart link uses the short project ID in the path, a `range=Custom%3A...` param, an explicit `resolution`, and only filters, segments and selectors from a successful call.
