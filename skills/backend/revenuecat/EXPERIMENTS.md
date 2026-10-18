# Experiments

A RevenueCat experiment (A/B test) compares two to four offerings: `offering_a` is the control and `offering_b` to `offering_d` are treatments. Enrolled customers are served their variant's offering instead of the project's current offering. Setup is one offering per variant, then the experiment created as a draft; experiment enrollment begins at `start-experiment`; this does not prove the underlying offerings are unreachable through direct selection or targeting. The rules below center on keeping variants identical except the one thing under test, publishing treatment paywalls before the start, and analyzing results against the supporting chart data rather than the results alone. Offerings, packages and products are explained in [CONCEPTS.md](CONCEPTS.md); paywall design is in [PAYWALLS.md](PAYWALLS.md); chart mechanics are in [CHARTS-AND-METRICS.md](CHARTS-AND-METRICS.md).

## MCP tools

| Job | Tools |
|---|---|
| Lifecycle | `create-experiment`, `update-experiment`, `start-experiment`, `pause-experiment`, `resume-experiment`, `stop-experiment` |
| Reading | `list-experiments`, `get-experiment`, `get-experiment-results` |
| Variant offerings | `list-offerings`, `duplicate-offering` (options `source_paywall_version`, `include_paywall`), `detach-products-from-package`, `attach-products-to-package`, `list-products` |
| Variant paywalls | `edit-paywall-ai`, `create-paywall-ai`, `publish-paywall`, `attach-offering-to-paywall`, `detach-offering-from-paywall`, `render-paywall-screenshot` |
| Store facts | `get-product-store-state` |

- **The `create-experiment` schema lists the available experiment types** with recommended primary and secondary metrics. Refer to the MCP tool schemas for exact parameters.

## Setting up

### The control

- **Pass the current offering directly when control is what production does today:** use the offering marked `is_current` in `list-offerings` as `offering_a_id`. Do not duplicate it. Duplicate only when the control itself needs changes.

### The treatments

- **Change one thing.** Keep variants identical except the aspect under test, otherwise results cannot be attributed to the change: a lower-price test shares the paywall design and packages and differs only in product price.
- **Reuse before duplicating:** check `list-offerings` for an existing match first. Otherwise duplicate the closest offering (usually the control).
- **`duplicate-offering`** copies the packages (with the same existing products) and, if the source has a paywall, copies it as a new unpublished draft, returning the new offering including its new `paywall_id`. Pass `source_paywall_version: published` so the treatment copies the production paywall. That fails when the source paywall was never published; use the default (`draft`) only then.

| What the test changes | How to build the treatment |
|---|---|
| Paywall copy, layout, CTA, pricing display | Needs RevenueCat Paywalls (a paywall is an optional property of an offering). If the control's `paywall_id` is `null`, establish the actual UI from app evidence; absence of an attachment does not prove custom UI (see [PAYWALLS.md](PAYWALLS.md#create-and-edit-the-dashboard-paywall)). Otherwise read [PAYWALLS.md](PAYWALLS.md) and edit the duplicate with `edit-paywall-ai`, requesting only the minimum changes, then verify by looking at the result. |
| Price, trial or intro offer | These live on store products, so the treatment needs different products. Check `list-products`; create only the missing ones and their store counterparts. Swap them in with `detach-products-from-package`, then `attach-products-to-package`. |
| A brand-new paywall | `duplicate-offering` with `include_paywall: false`, read [PAYWALLS.md](PAYWALLS.md), then `create-paywall-ai` with the new `offering_id` so the generated draft is attached to it directly. |

- **Paywalls and offerings pair 1:1.** `attach-offering-to-paywall` fails if either side is already paired. Undo with `detach-offering-from-paywall` (unpublish the paywall first if it is published).
- **A treatment must have its intended published paywall before display, but publication needs explicit authorization.** The source called experiment preparation an automatic publishing exception because a noncurrent offering supposedly reaches nobody. Other offering identifiers and targeting can expose it; follow [PAYWALLS.md](PAYWALLS.md#create-and-edit-the-dashboard-paywall) rather than that safety claim. [RevenueCat/ai-toolkit, revenuecat-experiments; https://www.revenuecat.com/docs/getting-started/displaying-products#custom-offering-identifiers; https://www.revenuecat.com/docs/tools/targeting; user standing rules]

### Creating the draft

- **`create-experiment` inputs:** display name, `enrollment_percentage`, the variant offering IDs, `experiment_type`, `primary_metric` (plus `secondary_metrics`) matching the hypothesis, `enrollment_mode` (`only_new` unless the user explicitly wants existing customers), targeting and notes.
- **Creating never starts it.** Adjust drafts with `update-experiment`.
- **Verify before starting:** treatment paywalls are published, packages contain the intended products, and new products are available on the stores.

## Lifecycle

| Call | Effect |
|---|---|
| `start-experiment` | Begins enrolling real customers. Only with the user's explicit confirmation. |
| `pause-experiment` | Stops enrollment, keeps serving enrolled customers their variant, keeps collecting data. |
| `resume-experiment` | Continues enrollment. |
| `stop-experiment` | Terminal: enrolled customers fall back to the default offering, and it can never be restarted. |

| Status | Meaning |
|---|---|
| `draft` | Not started, no results. |
| `running` | Actively enrolling. |
| `paused` | Not enrolling; enrolled customers still assigned; collecting data for up to 400 days; can be resumed. |
| `stopped` | Not enrolling; enrolled customers back on the default offering; results continue to refresh for up to 400 days; cannot be started or resumed. |

## Analyzing an experiment

Six steps, in order: 1) get the experiment ID; 2) get its details; 3) get supporting chart data (do not skip); 4) get the results; 5) interpret; 6) report. Skip only a step you already have the information for (for example the ID). Within a step, issue independent calls in parallel.

### 1. The experiment ID

- **`list-experiments`** with `project_id` (the `proj...` ID); optional `status`: `draft`, `running`, `paused`, `stopped`.

### 2. Details

- **`get-experiment`** with `project_id`, `experiment_id`, and `expand`: `offering.package.product.indicative_price` and `offering.paywall`. Extract:
  - **Expand paths differ by tool:** here offerings come expanded through `get-experiment`; the charts method reads a single offering with `get-offering` and `expand: ["package.product"]` (see [CHARTS-AND-METRICS.md](CHARTS-AND-METRICS.md#mcp-tools)).
  - **Variants:** the offerings (`offering_a`, `offering_b`, ...). Sophisticated setups may include a `placements` object (different offerings per placement, for example onboarding or a feature gate).
  - **Prices:** products' `indicative_price` gives only USD prices for the US, and introductory prices are not returned. For price-localization tests, non-US tests or intro prices, use `get-product-store-state`.
  - **Paywall attachment:** `paywall_id` identifies an attached RevenueCat paywall; null alone does not establish custom UI. Use the [canonical evidence rule](PAYWALLS.md#create-and-edit-the-dashboard-paywall). [https://www.revenuecat.com/docs/tools/paywalls/displaying-paywalls#default-paywall]
  - **Catalog data can be stale.** Product fields (`indicative_price`, the `subscription` fields `trial_duration` and `duration`) are RevenueCat catalog data last synced from the store. Before presenting a trial, intro offer or price as fact, or flagging it as a confound, confirm it with `get-product-store-state` and cross-check the results' trial metrics.
  - **Setup fields:** `notes`, `display_name`, `targeting_conditions` (the experiment only applies to customers meeting them), `enrollment_mode` (only new customers by default, or also existing), `experiment_type` (from a predefined list), `primary_metric`, `secondary_metrics`, status.
- **Screenshot every RevenueCat paywall:** `render-paywall-screenshot` with `project_id`, `paywall_id` and `version: "published"` for each `paywall_id`. The tool defaults to the draft, which may contain unpublished edits. Skip RevenueCat rendering only when evidence confirms every relevant offering uses custom UI, not merely because its attachment is null.

### 3. Supporting chart data (do not skip)

- **Scope `get-chart-data` to the runtime:** it shows how the app performed overall in that time frame. `start_date` is the experiment start, `end_date` is the experiment end (or today if running), resolution week (or day if it has run under 2 weeks). See [CHARTS-AND-METRICS.md](CHARTS-AND-METRICS.md) for the call rules.
- **Resolution, two ways:** the analysis method writes the resolution as `week` or `day`; the charts method says every `get-chart-data` call passes a string resolution ID taken from `get-chart-options-schema` (such as `"0"` for day).

| `chart_name` | Shows |
|---|---|
| `revenue` | Revenue over the runtime |
| `conversion_to_paying` | The overall conversion trend |
| `trials_new` | Trial volume |
| `trial_conversion_rate` | Trial to paid |
| `initial_conversion` | Install to trial, upfront subscription or one-time purchase |

### 4. Results

- **`get-experiment-results`** with `project_id`, `experiment_id`, and optionally `platform` (for example `ios`), `country` (for example `us`) and `exposure_status`: `exposed` (viewed a paywall), `not_exposed` (did not), or omit for all enrolled customers. `exposure_status` works for both enrollment modes.
- **Call the `Exposed customers` metric `Paywall viewers`** when talking to the user.

### 5. Interpret

- **Interpret from what changed** between the variants.
- **Judge a price or paywall winner on revenue, not conversion alone** [coreyhaines31/marketingskills, marketing-loops]: "Judge winners on revenue per visitor, plan mix, refunds, downgrades, churn, and support load - not conversion rate alone"; "Do not promote a variant that lifts conversion but lowers revenue-per-visitor or raises refunds/churn".
- **Verify disputed catalog claims yourself:** if the user disputes a catalog-derived claim, check it with `get-product-store-state` rather than asking the user to check the store.

### 6. Report

- **Link the evidence:** report findings with links to the relevant charts and dashboard entities. The analysis method points to a `revenuecat-dashboard-links` skill for these links (its general paths are in [CLI-AND-API.md](CLI-AND-API.md#dashboard-links)), while the chart link rules come from the charts skill ([CHARTS-AND-METRICS.md](CHARTS-AND-METRICS.md#dashboard-chart-links)) and customer-list link rules from the audiences skill ([AUDIENCES.md](AUDIENCES.md#links)).

## Prove it

- **Control is not a copy** when it matches production: `offering_a_id` equals the `is_current` offering from `list-offerings`.
- **One difference:** comparing the variants' packages, products and paywalls (via `get-experiment` with the two `expand` paths and `render-paywall-screenshot`) shows only the aspect under test differs.
- **Ready to start:** every treatment paywall is published, each package holds the intended products, and any new products are available on the stores.
- **No silent start:** `start-experiment` appears only after the user's explicit confirmation, and `enrollment_mode` is `only_new` unless they asked for existing customers.
- **Analysis complete:** the report rests on `get-experiment`, published-version screenshots, the five runtime-scoped charts and `get-experiment-results`, and any price, trial or intro offer it states was confirmed with `get-product-store-state`.
