# LLM evaluations

Scores AI output in two ways. Online evaluations run inside PostHog and score each matching `$ai_generation` (or a whole trace or AI session) as it arrives, writing `$ai_evaluation` events; offline experiments store results from applications and evaluators you ran elsewhere. Three rules recur: each eval comes from one real failure mode found by reading traces, the fail predicate is written for the eval's output type and excludes skipped runs, and online passing rules are applied at read time (changing one reinterprets history) while offline scorer versions never are. Finding the failure modes first is in [LLM-EXPLORING.md](LLM-EXPLORING.md#finding-ai-failures); the `system.evaluations`, `system.score_definitions`, trace review and dataset tables are in [HOGQL-TABLES-PRODUCTS.md](HOGQL-TABLES-PRODUCTS.md#llm-analytics); capture is in [LLM-ANALYTICS.md](LLM-ANALYTICS.md) and [LLM-PROVIDERS.md](LLM-PROVIDERS.md).

**Contents:** [Kinds and outputs](#kinds-and-outputs) · [Tools](#tools) · [The $ai_evaluation event](#the-ai_evaluation-event) · [The fail predicate](#the-fail-predicate) · [Why an eval is failing](#why-an-eval-is-failing) · [Creating online evaluations](#creating-online-evaluations) · [Targets and settle windows](#targets-and-settle-windows) · [Conditions](#conditions) · [Payload reference](#payload-reference) · [Backfill and reports](#backfill-and-reports) · [Offline evaluations](#offline-evaluations) · [Prove it](#prove-it)

## Kinds and outputs

| Type | What it does | Cost |
|---|---|---|
| `hog` | Deterministic Hog code returning boolean, numeric score or categories, optionally N/A. "Cheap, fast, reproducible: no LLM call per run"; "sub-millisecond evaluation" | No provider key |
| `llm_judge` | An LLM scores against your prompt. "A few hundred milliseconds + LLM cost are acceptable" | One LLM call per run |
| `sentiment` | Classifies user messages: a label and score, not pass/fail | No judge cost, no provider key |

- **"Reach for Hog by default";** switch to a judge only when the criterion can't be expressed as code. Hog: structural checks (JSON parses, schema matches), deterministic results, cheap criteria, no AI data processing approval, hard limits (length, cost). Judge: meaning (on-topic, helpful, factual), reading and understanding text, rating a quality dimension, where a little variability is acceptable. Hog runs as plain code on the ingestion pipeline. Layer them: a Hog gate, then a judge on passing generations via `conditions`.
- **Judges are non-deterministic:** "expect 1-5% noise even with a fixed prompt and model". For small regressions prefer Hog, or pin a deterministic provider or seed in `model_configuration`.
- **Conflict on judge approval:** the exploring-evaluations skill says `llm_judge` requires org-level AI data processing approval (`is_ai_data_processing_approved`); the creating skill says a judge draft needs only provider and model, with a usable key only to enable. Confirm in the current docs.
- **Boolean** sets `$ai_evaluation_result`. **Numeric** (`output_type: "numeric"`) stores `$ai_evaluation_numeric_result` (plus optional `_min`/`_max`), never `$ai_evaluation_result`; `output_config.passing_rule` decides pass (`gte` = at least the threshold, `lte` = at most). Without a passing rule there are no pass rates or reports; inspect means and distributions. **Categorical** (when enabled for the project) uses `output_config.options` `{key, label}` pairs and `selection_mode` `single` or `multiple`, storing the list in `$ai_evaluation_categorical_result`. **Sentiment** sets `$ai_sentiment_*`.
- **Categorical pass rules:** `single` needs exactly one key (Hog may return one key string); `multiple` accepts `[]`. With `passing_rule.categories` nonempty, a nonempty result passes only when every returned key is passing, and `[]` fails; an empty rule passes only `[]` and is allowed only in multiple mode.
- **Changing the passing rule reinterprets history;** saved reports keep their snapshot.

## Tools

Defined in `products/ai_observability/mcp/tools.yaml`. Read tools need scope `evaluation:read`, mutating ones `evaluation:write`, except `llma-evaluation-config-get` and `llma-evaluation-judge-models`, which use `llm_analytics:read`.

| Tool | Does |
|---|---|
| `posthog:llma-evaluation-list` | Filter by name (`search`) and `enabled` |
| `-get`, `-create`, `-update` | Read and change one; `-delete` soft-deletes via PATCH `{deleted: true}` |
| `-run` | Run against one specific `$ai_generation` |
| `-test-hog` | Dry-run Hog source on samples, nothing saved |
| `-report-list`, `-report-create`, `-report-run-list`, `llma-evaluation-report-generate` | Reports by email or Slack; past runs with content; run one now |
| `posthog:llma-evaluation-config-get` | The active provider key |
| `posthog:llma-provider-key-list` | Keys in `ok` state |
| `posthog:llma-evaluation-judge-models` | `{}` = the whole catalog; `{ "provider": "openai" }` narrows; providers PostHog funds no models for come back empty unless you pass `key_id` |
| `posthog:llma-evaluation-directory-list`, `-directory-create` | Directories |
| `posthog:llma-evaluation-backfill-estimate`, `-create`, `-get`, `-list`, `-cancel` | Backfills |

Plus `posthog:execute-sql`, `posthog:query-llm-trace` and `posthog:generate-app-url`. For filtering the list tool can't do, query the `evaluations` Postgres table or `$ai_evaluation` events with `execute-sql`.

## The $ai_evaluation event

| Property | Meaning |
|---|---|
| `$ai_evaluation_id`, `$ai_evaluation_name` | Which eval |
| `$ai_target_event_id` | UUID of the scored generation |
| `$ai_trace_id` | Its trace |
| `$ai_evaluation_result_type` | `boolean`, `numeric`, `categorical`, `sentiment` |
| `$ai_evaluation_result`, `$ai_evaluation_numeric_result`, `$ai_evaluation_categorical_result` | The raw result |
| `$ai_evaluation_reasoning` | Why |
| `$ai_evaluation_applicable` | `false` = N/A; null = treat as applicable |
| `$ai_evaluation_skipped` | `true` = not graded, excluded from pass rates (distinct from N/A); `$ai_evaluation_skip_reason` says why |
| `$ai_sentiment_label`, `$ai_sentiment_score` | `positive`, `neutral`, `negative` |

- **Check skipped first.** `output_config.true_is_failure: false` maps true to pass; `true` is for detector-style evals.
- **`$ai_evaluation` events carry cost** but are excluded from stock cost rollups ([LLM-EXPLORING.md](LLM-EXPLORING.md#costs)).

## The fail predicate

Events store the raw result; PostHog applies the current config at read time.

| Output | Fails when |
|---|---|
| Boolean, `true_is_failure` false or unset | `properties.$ai_evaluation_result = 'false'` |
| Boolean detector | `properties.$ai_evaluation_result = 'true'` |
| Numeric `gte` T | `toFloat(properties.$ai_evaluation_numeric_result) < T` |
| Numeric `lte` T | `toFloat(properties.$ai_evaluation_numeric_result) > T` |
| Categorical `[a,b]` | `NOT (notEmpty(<cats>) AND hasAll(['a', 'b'], <cats>))` |
| Categorical `[]` | `notEmpty(<cats>)` |

`<cats>` is `JSONExtract(ifNull(properties.$ai_evaluation_categorical_result, '[]'), 'Array(String)')`.

- **Always add `(isNull(properties.$ai_evaluation_skipped) OR properties.$ai_evaluation_skipped != 'true')`:** a skipped run can store `result = false`.
- **Compare to the strings `'true'` and `'false'`:** projects without Boolean property definitions read them as strings.

## Why an eval is failing

Diagnosis is the same for `hog` and `llm_judge`: you read the resulting `$ai_evaluation` events, not the evaluator; only the fix differs (edit the Hog source or the prompt).

1. **Find it and read its logic:** `posthog:llma-evaluation-list {"search": "hallucination", "enabled": true}`; read `evaluation_config.prompt` (judge) or `evaluation_config.source` (Hog, the "ground truth" for why it passes or fails).
2. **Count pass, fail and N/A:**

```sql
SELECT
    countIf(properties.$ai_evaluation_applicable = 'false') AS na_count,
    countIf((isNull(properties.$ai_evaluation_applicable) OR properties.$ai_evaluation_applicable != 'false') AND NOT (<fail predicate>)) AS pass_count,
    countIf((isNull(properties.$ai_evaluation_applicable) OR properties.$ai_evaluation_applicable != 'false') AND (<fail predicate>)) AS fail_count
FROM events
WHERE event = '$ai_evaluation'
    AND properties.$ai_evaluation_id = '<evaluation_uuid>'
    AND (isNull(properties.$ai_evaluation_skipped) OR properties.$ai_evaluation_skipped != 'true')
    AND timestamp >= now() - INTERVAL 7 DAY
```

3. **Read failing runs:** select `$ai_target_event_id`, `$ai_trace_id`, `$ai_evaluation_reasoning` and timestamp with the fail predicate plus the N/A and skipped guards, 7 days, `LIMIT 25`. The N/A guard matches the backend's bucketing.
4. **Drill:** `posthog:query-llm-trace {"traceId": "<trace_id>", "dateRange": {"date_from": "-30d"}}`.

- **Fails per day:** `SELECT toDate(timestamp) AS day, count() AS fails ... INTERVAL 30 DAY GROUP BY day`.
- **Too many N/A:** filter `AND properties.$ai_evaluation_applicable = 'false'` and read the reasoning. A judge that's too broad: narrow it. Hog with `allows_na: true` returning null too eagerly: tighten it.
- **Same root content both passes and fails:** an ambiguous judge prompt (reword it) or a Hog rule under- or over-matching (narrow and retest).
- **Hog regression bisect:** `-get` (source, `updated_at`), then re-run the source with `-test-hog` and `conditions` targeting the failing generations. Same result: the generations changed (the producer). Different: the evaluator was edited (check the activity log).
- **Report with one or two example trace links** showing the failure pattern.

Run one eval on one generation (`timestamp` is required for an efficient ClickHouse lookup; passing `distinct_id` speeds it further):

`posthog:llma-evaluation-run {"evaluationId": "<eval_uuid>", "target_event_id": "<generation_event_uuid>", "timestamp": "2026-04-01T19:39:20Z", "event": "$ai_generation"}`

Test Hog without saving (for numeric or categorical previews send the saved `output_type`, `output_config`, and `allows_na: true` if null is allowed):

`posthog:llma-evaluation-test-hog {"source": "return event.properties.$ai_output_choices[1].content contains 'sorry';", "sample_count": 5, "allows_na": false}`

## Creating online evaluations

An online eval scores each matching generation, trace or session automatically until disabled. It comes from a real failure mode in production traffic, "not from a guess or a generic metric like "hallucination" or "helpfulness"".

- **One eval per failure mode,** as many as the data justifies ("sometimes one, often three or four"); never bundle unrelated modes. Exception: modes that are outcomes of the same check become one categorical eval with a category per mode.
- **Propose before creating;** never create evals the user hasn't picked. If the user is vague, find failures first ([LLM-EXPLORING.md](LLM-EXPLORING.md#finding-ai-failures)).
- **Keep a candidate when** it hurts (frequent or painful), it's checkable (one crisp criterion stated in a line, e.g. "the tool call must include an `order_id`") and it's distinct (two that fail on the same generations are one eval). Propose roughly the top five and mention the weaker ones set aside.
- **Proposal format:** numbered, plain language, one or two lines each: what it checks, what it surfaces, rough volume; no Hog or filters; flag LLM-judge ones (cost per run). Example: "Found 3 failure patterns worth watching. Which should I set up? **1. Replies drift off topic**: checks the answer addresses what the user actually asked. Catches support replies that confidently answer a different question. Seen ~40×/day. **2. Order lookups missing an order ID**: checks every `lookup_order` call includes an `order_id`. ... Seen ~15×/day. **3. Refuses questions it can answer**: ... Costs an LLM call per check."
- **"All of them" or "go ahead"** accepts the whole set. Suggest a prompt fix alongside the eval; a rising pass rate confirms the fix.
- **Nothing surfaced:** propose a `sentiment` eval ("User frustration: labels each user message positive, neutral, or negative. ... No judge cost."). No `$ai_generation` events at all means no eval of any kind; instrument first ([LLM-ANALYTICS.md](LLM-ANALYTICS.md)).

Per accepted eval, steps 1 to 5; then step 6 once for the whole set. Leave every eval disabled until the whole set is verified.

1. **Type:** `hog` first (structural; no provider key); `llm_judge` when there's no deterministic way (provider and model; a usable key only to enable); `sentiment` only for labels. **Output:** `boolean` (default; `true_is_failure: true` for detectors), `numeric` (a 1 to 5 rating or a measured value; set `min`/`max` so out-of-range scores are skipped; `passing_rule` `gte`/`lte`; `step` is only a hint: a judge may return `3.7` with `step: 1`, stored as returned), `categorical` (stable lowercase keys; `single` usually with a "no problem" key in the passing categories; `multiple` with no "no problem" key and `categories: []`). For judge numeric and categorical outputs PostHog tells the judge the format; the prompt only describes meanings.
2. **Target:** see [Targets and settle windows](#targets-and-settle-windows).
3. **Judge config:** `provider_key_id` is the UUID of an `ok`-state key for the same provider (pin it, preferred, so a team-wide active-key change doesn't change behavior) or `null` (the team's active key, which must be `ok` and the same provider to enable). With no usable key, create a disabled draft, don't spot-run or enable, and ask the user to add or validate a key in the UI. "A listed model is not a free model."
4. **Create disabled.** For a directory, `llma-evaluation-directory-list` and pass the UUID as `directory_id` (omit or null = top level; directories cannot be nested; create one only when asked).

```json
posthog:llma-evaluation-create
{
  "name": "Output is not empty",
  "description": "Fails when a generation has no readable output",
  "evaluation_type": "hog",
  "evaluation_config": { "source": "let count := 0\nfor (let i, item in evaluation_events) {\n    if (item.event == '$ai_generation') {\n        count := count + 1\n        if (length(trim(item.output_text)) == 0) { return false }\n    }\n}\nreturn count > 0" },
  "output_type": "boolean",
  "output_config": { "allows_na": false },
  "target": "generation",
  "target_config": {},
  "conditions": [
    { "id": "default", "rollout_percentage": 100, "properties": [{ "key": "$ai_model", "type": "event", "operator": "icontains", "value": "gpt" }] }
  ],
  "enabled": false
}
```

  A judge uses `evaluation_config` `{ "prompt": "…" }` and `"model_configuration": { "provider": "openai", "model": "gpt-5-mini", "provider_key_id": null }`. Two more examples from the exploring skill:

```json
posthog:llma-evaluation-create
{
  "name": "Output is valid JSON",
  "description": "Fails when the assistant message can't be parsed as JSON",
  "evaluation_type": "hog",
  "evaluation_config": {
    "source": "let raw := event.properties.$ai_output_choices[1].content; try { jsonParseStr(raw); return true; } catch { return false; }"
  },
  "output_type": "boolean",
  "enabled": true
}
```

```json
posthog:llma-evaluation-create
{
  "name": "Response stays on-topic",
  "description": "LLM judge - fails if the assistant changes topic from the user's question",
  "evaluation_type": "llm_judge",
  "evaluation_config": {
    "prompt": "You are evaluating whether the assistant's reply stays on-topic relative to the user's most recent question. Return true if it does, false if the assistant changed the subject. Return N/A if the user did not actually ask a question."
  },
  "output_type": "boolean",
  "output_config": { "allows_na": true },
  "model_configuration": {"provider": "openai", "model": "gpt-5-mini"},
  "enabled": false
}
```

  A judge has no `test-hog` equivalent: create it with `enabled: false`, run it manually on known-good and known-bad generations, refine with `-update` (`evaluation_config.source`/`.prompt`, `output_config.allows_na`, `output_config.true_is_failure`, `enabled`), then enable.
5. **Verify scope:**

```sql
SELECT count() AS matched, count() / 7 AS per_day
FROM events
WHERE event = '$ai_generation'
    AND properties.$ai_model ILIKE '%gpt%'      -- mirror each condition property
    AND timestamp >= now() - INTERVAL 7 DAY
```

  For a generation target `count()` is the run volume; for a trace target count distinct non-empty `$ai_trace_id`. High volume: set `rollout_percentage` below 100. Spot-check with `test-hog` (same `output_type`/`output_config`) or `run`; both use generation samples and don't reproduce a settled trace, so review the first live trace results before raising rollout. "Watch out: some orgs reuse a single `$ai_trace_id` across 100k+ events."
6. **Enable:** `posthog:llma-evaluation-update {"evaluationId": "<uuid>", "enabled": true}`. The Slack feed is `feature-usage-feed`. Close the loop with one short list and a link each; mention any left disabled and what unblocks them.

- **Links:** `generate-app-url {url: "/ai-evals/evaluations"}` or `{url: "/ai-evals/evaluations/{id}", params: {id: "<evaluation_id>"}}`, resolving to e.g. `https://us.posthog.com/project/<id>/ai-evals/evaluations/<evaluation_id>`. The exploring skill hand-builds `https://app.posthog.com/ai-evals/evaluations/<evaluation_id>`; the creating skill says never hand-write the host.

## Targets and settle windows

| Target | Runs |
|---|---|
| `generation` (default) | Once per match, immediately after ingestion |
| `trace` | Once, after the first matching generation plus a settle wait |
| `session` | Once per `$ai_session_id`, after settle |

| Target | Strategy | Shape | Ranges and defaults |
|---|---|---|---|
| Trace | `fixed_window` (also when no `strategy` key) | `{ "strategy": "fixed_window", "window_seconds": 1800 }` | 10 s to 2 h, default 30 min (payload 10..7200) |
| Trace | `inactivity` | `{ "strategy": "inactivity", "quiet_period_seconds": 300, "max_age_seconds": 7200 }` | Quiet 10 s to 30 min, default 5 min (10..1800); max age 1 min to 2 h, default 2 h (60..7200), at least the quiet period |
| Session | `inactivity` (default) | `{ "strategy": "inactivity", "quiet_period_seconds": 3600, "max_age_seconds": 86400 }` | Quiet 10 s to 24 h, default 1 h; max age 1 min to 7 days, default 24 h |
| Session | `fixed_window` | | 10 s to 7 days (payload 10..604800, default 1800) |

- **Session evals fire only for events with `$ai_session_id`;** producers set it on every generation or none. `$ai_session_id` is not `$session_id` (the product-analytics session, unrelated).
- **A skipped session** gets `$ai_evaluation_skipped: true`, `$ai_evaluation_skip_reason`, and `$ai_evaluation_result` `false` when N/A is disallowed; exclude skipped runs from pass rates. Sessions are skipped above 2500 events (usually a session id shared across conversations), when nothing is found in the window, or (judge) when the transcript is too long.
- **A session is evaluated at most once per evaluation** while the completed run is in Temporal's retention window; resumed sessions may be re-evaluated. Pick a long enough quiet period: "A longer quiet period costs only latency."
- **Conditions match the triggering generation;** the evaluator receives the complete trace or session. Sentiment supports only the generation target.
- **Hog globals (new source):** `evaluation_events` (one generation, or every captured event for a trace or session), `target` (`type`, `id`, `total_cost_usd`, `total_latency_seconds`), `item.input_text`/`item.output_text` (best-effort readable text for length, keyword and regex checks), `item.input`/`item.output` (raw serialized). For a session `target.id` is the session id and cost and latency are summed across traces; `total_latency_seconds` is AI work time, not wall-clock (derive wall-clock from `evaluation_events` timestamps). **Legacy globals:** generation `input`, `output`, `properties`, `event`; trace `events`, `trace`; a session gets only `target` and `evaluation_events`.

## Conditions

- **A list of condition sets:** OR between sets, AND within `properties`. Each set is `{ id, rollout_percentage, properties[] }`. Omitted or empty means every `$ai_generation`.
- **No time window inside conditions;** sampling is only `rollout_percentage` (0 to 100, default 100).
- **Filter:** `{ "key", "type": "event" | "person", "operator", "value" }` with operators `exact`, `is_not`, `icontains`, `not_icontains`, `regex`, `gt`, `lt`, `is_set`, `is_not_set`.

`[{ "id": "openai", "rollout_percentage": 100, "properties": [{"key": "$ai_provider", "type": "event", "operator": "exact", "value": "openai"}] }, { "id": "anthropic", "rollout_percentage": 25, "properties": [{"key": "$ai_provider", "type": "event", "operator": "exact", "value": "anthropic"}] }]`

- **Cluster-scoped evals:** identify the cluster ([LLM-EXPLORING.md](LLM-EXPLORING.md#clusters)) and translate its event filter into `conditions`.

## Payload reference

- **Top level:** `name` (required, up to 400 chars), `description` (default `""`), `evaluation_type` (`"hog"`, `"llm_judge"`, `"sentiment"`), `evaluation_config`, `output_type`, `output_config`, `model_configuration` (judge only; rejected on hog and sentiment), `target`, `target_config`, `conditions`, `enabled` (default `false`).
- **Valid pairs:** `(hog, boolean)`, `(llm_judge, boolean)`, `(hog, numeric)`, `(llm_judge, numeric)`, `(hog, categorical)`, `(llm_judge, categorical)`, `(sentiment, sentiment)`. The output type cannot change after creation.
- **`LLMJudgeConfig`:** `prompt` (required, minLength 1), `judge_method` (`"llm"`, `"decision"` or null; "Omit to keep the saved method; null restores automatic routing.").
- **`HogEvalConfig`:** `source` (required), `bytecode` (written by the server on save; never pass it).
- **`SentimentEvalConfig`:** `source` const `"user_messages"`. "The classifier is an English-trained model, so labels are unreliable for other languages. A multilingual agent should use an llm_judge evaluation instead."
- **Boolean output:** `allows_na` (default false), `true_is_failure` (default false). N/A differs from an execution error that skips a run.
- **Numeric output:** `min`, `max` (inclusive; an out-of-bounds score skips the run), `step` (>0, guides without rounding), `allows_na` (allow `null` from Hog), `passing_rule` `{"operator": "gte", "threshold": 7}`. Return a finite number, not a boolean or numeric string.
- **Categorical output:** `options` 1 to 100 `{key, label}`; key pattern `^[a-z0-9]+(?:[_-][a-z0-9]+)*$` (max 128), label max 256; keep a key stable when renaming its label; `selection_mode` default `single`; Hog returns a list of keys, or a single key string in single mode; `null` = N/A when allowed; `passing_rule` `{"categories": ["no_problem"]}`; in multiple mode `{"categories": []}` passes only empty results (detectors).
- **`model_configuration.provider`:** `openai`, `anthropic`, `gemini`, `openrouter`, `fireworks`, `azure_openai`, `together_ai`; `model` e.g. `gpt-5-mini`; `provider_key_id` optional. A disabled draft without a usable key cannot be tested or enabled.
- **Full Hog example** ("Reply is under 2,000 characters"; the same source works for trace and session targets by changing only the target fields): `"for (let i, item in evaluation_events) { if (item.event == '$ai_generation' and length(item.output_text) >= 2000) { return false } } return true"`.
- **Full judge prompt example:** "Return true if the assistant's reply stays on the user's topic, false if it changes subject. Return N/A if the user did not ask a question."

## Backfill and reports

- **Backfill covers at most the last 30 days.** `backfill-estimate` (window, `conditions`, `rerun_existing`) reports `total_units`, the returned (clamped) window and cost per unit (one eval run counts as an AI Observability event, plus a model call for a judge); `already_evaluated_units` are excluded unless `rerun_existing` is true.
- **`backfill-create` only after the user says yes,** with the returned `window_start`/`window_end`. `backfill-get`: skipped units were already covered; if `remaining_count` > 0, offer one more backfill once, and if it remains, tell the user. If create "could not confirm the start", call `backfill-list` before retrying. `backfill-cancel` stops it; started evals still finish. One backfill per evaluation at a time.
- **Reports:** `llma-evaluation-report-create` with `frequency: "scheduled"` and an `rrule` (daily or weekly), or `frequency: "every_n"` with `trigger_threshold`; deliver via `delivery_targets` (email or Slack).

## Offline evaluations

Offline experiments store results from applications and evaluators executed outside PostHog: the create and upload tools record results, they do not run code or call a judge. The `posthog:llma-offline-*` tools exist only where offline evaluations are enabled; if they're absent, tell the user and stop, and don't substitute the online tools.

### Find runs and compare

- **`posthog:llma-offline-experiment-list`, then `posthog:llma-offline-experiment-get`** (context, coverage). Scope by suite, execution dates, run source, dataset identity and revision. Date ranges include `date_from` and exclude `date_to`.
- **Prefer `statuses: "completed"`:** lists include every upload state by default, and uploading or failed runs may be partial. Scorer history defaults to completed runs. An empty list means no matching stored experiments.
- **Before attributing a change,** check suite, dataset source, identifier and revision, scorer version and trial coverage; state what changed and what was held constant. Differing cohorts allow no causal claim. Match cases by durable case and dataset identities, not run-local item UUIDs or page position.

### Summaries first

- **`posthog:llma-offline-experiment-scorer-summary-list`** per run and **`posthog:llma-offline-scorer-history`** across runs calculate over full results and enforce scorer permissions. Never compute a whole-run rate from one page of items.
- **Definitions, version numbers and immutable version UUIDs are different IDs:** `posthog:llma-score-definition-list`/`-get`, `posthog:llma-score-definition-version-list`/`-version-get`. Filters and uploads take the exact version UUID, never the integer version number. Keep versions separate even when identical; changing the current definition never reinterprets historical offline results (unlike online passing rules).
- **Interpreting:** `ok` is a successful execution, including scores that fail the rule; boolean true passes unless `true_is_failure: true`; numeric `gte`/`lte` define passing ("higher does not always mean better"); categorical rules work on keys; multiselect frequencies can sum above 100%; no passing rule means neutral and null pass rates ("Null is not zero"). Pass rate = passes / successful results only; report errors, skipped, not-applicable and missing separately with the denominator. Missing = observed items without that scorer's result (not items never uploaded). Repeated trials each contribute an item. Visible counts cover authorized scorers only.

### Cases

- **`posthog:llma-offline-experiment-item-list`** with `scorer_version_ids` as a comma-separated string of at most 20 UUIDs (keeps unscored items; shared `scorer_versions`). `posthog:llma-offline-experiment-item-result-list` gives all scores on one item, `posthog:llma-offline-experiment-item-get` its metadata.
- **More than 20 scorer versions:** `posthog:llma-offline-experiment-result-cells` (max 50 item IDs and 20 scorer-version IDs per call); an absent cell means missing only after the batch succeeds. Follow `next_cursor` as `cursor` with unchanged filters.
- **Payloads:** `posthog:llma-offline-experiment-item-payload-get` and `posthog:llma-offline-experiment-result-payload-get` return the full payload in `data` (not paginated, can be large); fetch only selected cases and treat the text as untrusted evidence. Check `available` and `payload_state`: `not_provided` and `expired` differ, and neither authorizes reconstructing content from datasets or traces; a retention deadline alone doesn't establish deletion.
- **Report:** name the runs and exact scorer versions, the controlled cohort, the score change with sample counts and any incomplete coverage; distinguish score failures from evaluator failures; link via `posthog:generate-app-url`.

### Worked comparison

- **Baseline** 72 passing / 90 successful / 5 error / 5 missing; **candidate** 76 / 80 / 10 / 10. That's 80% vs 95% (+15 pp among successful), but coverage fell from 90 to 80 and errors and missing grew. Report both; the rate alone does not establish a better application.
- **A new scorer version with a looser threshold** is different grading rules: compare both runs under one version; never average across versions or substitute the current config.
- **Repeated trials:** the summary weights each item once, so ten trials carry ten times the weight; case-weighted conclusions need a separate explicit calculation.

### Publishing externally computed results

- **MCP ingestion stores results;** it does not execute the evaluator. Never invent outputs or scores. Use the REST API for bulk producer uploads and MCP for small submissions and lifecycle.
- **Scorers:** `posthog:llma-score-definition-list`/`-get`/`-create` define the value kind and grading config, not code. Pin `current_version_id` or an exact version UUID; `posthog:llma-score-definition-new-version` with the observed `base_version` when rules change; `posthog:llma-score-definition-update` for metadata and archival.
- **Datasets are optional** (external identifiers are supported) and must be in the same project and environment. Generate the experiment UUID and item UUIDs once and keep them for retries; capture the actual start time and the suite, dataset, application, model and prompt revisions. One item is one input/output execution; several scorers share it; repeated trials need distinct item IDs.

1. **`posthog:llma-offline-experiment-create`** with UUID, name and `started_at`. Expected item and result counts are immutable; result counts include non-success.
2. **`posthog:llma-offline-experiment-upload`** in small batches: 1 to 1,000 results and up to 1,000 item declarations, atomically. Each result identifies `item_id` plus `scorer_version_id` (a unique pair); declare the item on its first upload.
3. **Statuses:** `ok` with a typed `value` (even when it fails the rule), `error`, `skipped`, `not_applicable`. Preserve omitted vs empty object vs explicit null.
4. **`posthog:llma-offline-experiment-complete`** after every upload is acknowledged. A count mismatch returns 409 and leaves the experiment uploading.
5. **`posthog:llma-offline-experiment-fail`** only for interrupted execution or upload. Both closures are terminal.

- **Retries:** reuse the same IDs and identical content (valid even after closure); changed immutable content is a conflict; never create new IDs to evade it. A 403 is a permission problem: don't retry with a broader credential.
- **Scope `offline_evaluation_ingestion:write`** (no payload reads, no scorer admin). Project secret API keys are ingestion-only here. Acknowledgments are the source of truth for upload success.

## Prove it

- **Every eval traces to a mode:** each created eval names one failure mode found in read traces, was proposed and picked by the user, and was created with `enabled: false`.
- **Scope is sized:** the verify-scope query mirroring each condition returns the expected per-day volume, and `rollout_percentage` is below 100 when it's high.
- **The predicate fits the output type:** a pass/fail/N/A query for the eval uses the matching row of the fail predicate table, includes the skipped guard, and compares to `'true'`/`'false'` strings.
- **A spot-run agrees:** `llma-evaluation-run` on a known-bad generation fails and on a known-good one passes before `enabled: true`.
- **Offline uploads close:** `llma-offline-experiment-complete` succeeds (no 409, so the uploaded counts match the expected item and result counts), and the report states errors, skipped, not-applicable and missing next to the pass rate's denominator.
