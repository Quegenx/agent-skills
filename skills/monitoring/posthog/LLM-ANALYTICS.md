# LLM analytics

Instruments AI model calls in JS/TS so PostHog records every generation with its model, provider, input, output, token counts, latency and cost. The product was called LLM analytics and is now AI Observability (docs under `/docs/ai-observability/*`). PostHog wraps your existing provider SDK: calls still go straight to the provider, and the wrapper extracts metadata and sends it to PostHog as an event. The per-provider and per-framework setup is in [LLM-PROVIDERS.md](LLM-PROVIDERS.md); reading traces, costs, clusters, evaluations and failures is in [LLM-EXPLORING.md](LLM-EXPLORING.md); MCP tool analytics is in [MCP-ANALYTICS.md](MCP-ANALYTICS.md); SQL over `$ai_*` events is in [HOGQL-EXAMPLES-SIGNALS.md](HOGQL-EXAMPLES-SIGNALS.md) and [HOGQL-TABLES-PRODUCTS.md](HOGQL-TABLES-PRODUCTS.md). Vendor-neutral OpenTelemetry is in [observability SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/SKILL.md).

**Contents:** [How it works](#how-it-works) · [The event hierarchy](#the-event-hierarchy) · [The commandment](#the-commandment) · [Adding it to a codebase](#adding-it-to-a-codebase) · [Integration styles](#integration-styles) · [Manual capture](#manual-capture) · [Event properties](#event-properties) · [Cost calculation](#cost-calculation) · [Privacy mode](#privacy-mode) · [Prove it](#prove-it)

## How it works

- **A generation is one LLM call,** captured as the event `$ai_generation`: model, provider, input, output, token counts, latency, cost. Generations also capture tool calls.
- **Every `$ai_`-prefixed event is an AI Observability event:** `$ai_generation`, `$ai_span`, `$ai_trace`, `$ai_embedding`, and any other `$ai_` name you send. These events do not create or update a person profile (`$set` and `$set_once` are ignored). The full event, including `$ai_input` and `$ai_output`, is kept 30 days; after that only a copy without those large properties. They are billed as AI Observability, not Product Analytics.
- **Don't use the `$ai_` prefix for events that need person profiles or Product Analytics pricing.**
- **They are still standard PostHog events,** usable in insights and alerts. LLM errors land in error tracking.
- **Message roles are `system`, `user`, `assistant`;** PostHog captures the full message array with roles intact.
- **Costs are calculated automatically** from model and provider against pricing data: OpenRouter pricing first, a manually maintained price list as fallback. See [Cost calculation](#cost-calculation).
- **Evaluations** come in three kinds: LLM-as-a-judge, code-based (Hog) and sentiment. Their use is in [LLM-EXPLORING.md](LLM-EXPLORING.md).

## The event hierarchy

| Level | Property | What it groups | Example |
|---|---|---|---|
| Session | `$ai_session_id` (optional) | Traces | A user's conversation thread |
| Trace | `$ai_trace_id` (required) | Generations and spans for one request | One chatbot message and response |
| Span | `$ai_span` | An operation within a trace | A retrieval step or function call |
| Generation | `$ai_generation` | One LLM call | |
| Embedding | `$ai_embedding` | Vectorizing documents | Indexing for RAG |

- **The rules:** a session optionally groups traces; the trace is the top-level required grouping; a trace can hold many spans and generations; a span can parent other spans; a generation can be the child of a span or a trace.
- **An AI session is not a web session.** `$ai_session_id` is typically one conversation; `$session_id` is session replay's continuous visit. One PostHog session can contain several AI sessions.
- **Pseudo-traces:** send `$ai_generation`, `$ai_span` or `$ai_embedding` with a `$ai_trace_id` and PostHog builds a pseudo-trace that aggregates the children's latency, tokens and costs. Pseudo-traces are not real events, so no explicit `$ai_trace` is needed. Send an explicit `$ai_trace` only to control the trace's metadata.
- **Correlate with distributed tracing:** if you also send OpenTelemetry spans to Distributed tracing, set `$ai_trace_id` to the surrounding span's trace ID (doc: `/docs/distributed-tracing/link-ai-observability.md`).
- **ID format** for `$ai_trace_id` and `$ai_session_id`: only letters, numbers and `-`, `_`, `~`, `.`, `@`, `(`, `)`, `!`, `'`, `:`, `|`. Example: `d9222e05-8708-41b8-98ea-d4a21849e761`.
- **Single-trace workloads** (batch jobs, one-shot generation): send `$ai_session_id` as `null`, which tells the instrumentation checklist the workload is complete rather than missing a session ID.

### Traces in the UI

- **Traces tab:** lists traces with the autocaptured person, total cost and total latency; tools called by generations show as tags.
- **Trace timeline:** a tree with a waterfall above it (latency breakdown, concurrency lanes, errored operations with a red border, click a bar to select). Time axis intervals such as 15s, 30s, 1m, 2m; at most 6 visible lanes, then it scrolls vertically. The waterfall also appears in the session view's steps drawer.
- **Conversation display:** Expand all; Expand user only; Collapse except output and last input (default).
- **Sentiment:** negative, neutral or positive from a local model (no data goes to third parties), run as a sentiment analysis evaluation you configure; an overall label and score per trace, with per-generation and per-message breakdowns.
- **PostHog AI** on an AI Observability page switches to AI Observability mode, with tools to search traces by date range, model, cost and error status, returning name, latency, cost, token counts and error count. Example prompts: "Show me recent LLM traces from the past week", "What are the most expensive LLM calls from today?", "Find traces with errors in the last 30 days", "What's happening in my most expensive trace?"

## The commandment

A missing PostHog configuration must never break the app. Read keys optionally (never as a required setting), guard init and capture behind their presence, and keep build and boot working with no PostHog environment set. But never silently: in development or debug builds fail loudly with the language's idiomatic error and this message, substituting the actual variable name:

> `<VAR> variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once <VAR> is configured`

Production stays a no-op.

## Adding it to a codebase

Steps in order:

1. **Detect the LLM stack:** provider SDKs and frameworks in dependency files and imports, the lockfile for the package manager, and any existing PostHog or observability setup. If PostHog and LLM tracing are already configured, skip to step 4.
2. **Find the matching setup** in [LLM-PROVIDERS.md](LLM-PROVIDERS.md); it is the source of truth for callback setup, middleware configuration and event capture. If none matches, use [Manual capture](#manual-capture).
3. **Install** the PostHog SDK and the integration packages with the package manager's install command. Do not edit dependency files by hand.
4. **Add tracing** that captures input tokens, output tokens, model name, latency and cost for every generation. Do not alter the fundamental architecture of existing files: add alongside existing LLM calls, minimal and targeted. Read a file immediately before writing it.
5. **Link generations to users** through distinct IDs where possible.
6. **Set env vars,** skipping any that already have valid values (`.env`, `.env.local`, framework env files). If the project token is missing, get the project's `api_token` with the PostHog MCP tool `projects-get`; with several projects, ask the user which; if MCP isn't connected or authenticated, ask the user for the token. Take the host from the `projects-get` `region` field: `US` is `https://us.i.posthog.com`, `EU` is `https://eu.i.posthog.com`. If it's unavailable, ask "Are you on PostHog US Cloud or EU Cloud?" Do not assume US Cloud. Write them with the framework's naming convention and reference env vars in code; never hardcode PostHog or provider keys.

- **Use the project token (`phc_`),** not a personal API key (`phx_...`), which won't work.
- **The wizard does it for you:** `npx @posthog/wizard ai-observability` installs the SDK and wires up AI Observability. See [MCP-AND-WIZARD.md](MCP-AND-WIZARD.md).

## Integration styles

| Style | Used by | Identity |
|---|---|---|
| SDK wrapper from `@posthog/ai/<provider>`, option `posthog` | OpenAI, Azure OpenAI, Anthropic, Gemini, every OpenAI-compatible provider and gateway | Per call `posthogDistinctId`, `posthogTraceId`, `posthogProperties` |
| OpenTelemetry with `PostHogSpanProcessor` from `@posthog/ai/otel` (options `projectToken`, `host`) | Vercel AI SDK v7, Instructor, Claude Platform SDK tracing | `posthog.distinct_id` resource or span attribute |
| Framework callback or exporter | `LangChainCallbackHandler` (LangChain, LangGraph), `PosthogExporter` from `@mastra/posthog` (option `apiKey`) | Handler `distinctId`, Mastra `userId` metadata |
| Manual `$ai_*` capture | Anything else, or the capture API | `distinctId` on `capture` |

- **Wrappers don't capture tool executions.** Capture each tool call yourself as an `$ai_span` with the same `$ai_trace_id`. LangChain and LangGraph handlers capture tool spans automatically.
- **Flush before exit:** `await provider.shutdown()` (Claude SDK tracing), `await posthogSpanProcessor.forceFlush()` (Vercel AI SDK), `client.shutdown()` (posthog-node).
- **Go has no wrapper** for the OpenAI, Anthropic, Gemini or OpenAI-compatible SDKs; use the OpenTelemetry integration (https://posthog.com/docs/ai-observability/installation/opentelemetry).

## Manual capture

For other server SDKs, or the capture API. `$ai_trace_id` groups one interaction; `$ai_session_id` is optional.

Capture API: `POST https://us.i.posthog.com/i/v0/e/` with a JSON body of `api_key`, `event` and `properties` (including `distinct_id`).

```bash
curl -X POST "https://us.i.posthog.com/i/v0/e/" \
        -H "Content-Type: application/json" \
        -d '{
            "api_key": "<ph_project_token>",
            "event": "$ai_generation",
            "properties": {
                "distinct_id": "user_123",
                "$ai_trace_id": "trace_id_here",
                "$ai_session_id": "conversation-abc",
                "$ai_model": "gpt-5-mini",
                "$ai_provider": "openai",
                "$ai_input": [{"role": "user", "content": "Tell me a fun fact about hedgehogs"}],
                "$ai_input_tokens": 10,
                "$ai_output_choices": [{"role": "assistant", "content": "Hedgehogs have around 5,000 to 7,000 spines on their backs!"}],
                "$ai_output_tokens": 20,
                "$ai_latency": 1.5,
                "$ai_stream": true,
                "$ai_time_to_first_token": 0.25
            }
        }'
```

Node: `npm install posthog-node`.

```javascript
import { PostHog } from 'posthog-node'

const client = new PostHog('<ph_project_token>', {
    host: 'https://us.i.posthog.com'
})
```

```javascript
// After your LLM call
client.capture({
    distinctId: 'user_123',
    event: '$ai_generation',
    properties: {
        $ai_trace_id: 'trace_id_here',
        $ai_session_id: 'conversation-abc', // optional: groups traces into one session
        $ai_model: 'gpt-5-mini',
        $ai_provider: 'openai',
        $ai_input: [{ role: 'user', content: 'Tell me a fun fact about hedgehogs' }],
        $ai_input_tokens: 10,
        $ai_output_choices: [{ role: 'assistant', content: 'Hedgehogs have around 5,000 to 7,000 spines on their backs!' }],
        $ai_output_tokens: 20,
        $ai_latency: 1.5,
        // For streaming responses, also include:
        // $ai_stream: true,
        // $ai_time_to_first_token: 0.25
    }
})

client.shutdown()
```

- **Large events:** use the dedicated AI ingestion path (`/docs/ai-observability/large-events.md`).

## Event properties

### `$ai_generation`

| Group | Properties |
|---|---|
| Core | `$ai_trace_id`; `$ai_session_id` (optional); `$ai_span_id` (optional); `$ai_span_name` (optional, e.g. `summarize_text`); `$ai_parent_id` (optional, parent span ID); `$ai_model` (e.g. `gpt-5-mini`); `$ai_provider` (e.g. `openai`, `anthropic`, `gemini`) |
| Input and output | `$ai_input`; `$ai_input_tokens`; `$ai_output_choices`; `$ai_output_tokens` |
| Timing | `$ai_latency` (optional, seconds); `$ai_time_to_first_token` (optional, seconds, streaming only) |
| Request | `$ai_http_status`; `$ai_base_url` (e.g. `https://api.openai.com/v1`); `$ai_request_url` (e.g. `https://api.openai.com/v1/chat/completions`); `$ai_stop_reason` (e.g. `end_turn`, `stop`, `max_tokens`, `tool_use`) |
| Errors | `$ai_is_error`; `$ai_error` |
| Pre-calculated cost | `$ai_input_cost_usd`, `$ai_output_cost_usd`, `$ai_request_cost_usd`, `$ai_web_search_cost_usd`, `$ai_total_cost_usd`, `$ai_cost_passthrough` |
| Custom pricing | `$ai_input_token_price`, `$ai_output_token_price`, `$ai_cache_read_token_price`, `$ai_cache_write_token_price`, `$ai_cache_write_1h_token_price`, `$ai_request_price`, `$ai_request_count`, `$ai_web_search_price`, `$ai_web_search_count` |
| Cache | `$ai_cache_read_input_tokens`, `$ai_cache_creation_input_tokens`, `$ai_cache_creation_5m_input_tokens`, `$ai_cache_creation_1h_input_tokens`, `$ai_cache_reporting_exclusive` |
| Model params | `$ai_temperature`, `$ai_stream`, `$ai_max_tokens`, `$ai_tools` (e.g. `[{"type":"function","function":{"name":"get_weather","parameters":{}}}]`) |

- **`$ai_input` and `$ai_output_choices`** are message arrays whose `role` is one of `"user"`, `"system"`, `"assistant"`. Content parts: `{type:"text",text}`, `{type:"image",image:url}`, `{type:"function",function:{name,arguments}}`.
- **`$ai_cost_passthrough`:** set it when your provider reports the real cost, such as an LLM gateway. PostHog keeps your `$ai_total_cost_usd` and leaves input and output costs unset.
- **Anthropic cache writes:** `$ai_cache_write_token_price` applies to both cache TTLs unless `$ai_cache_write_1h_token_price` is set, which takes precedence for 1-hour writes. When both TTL-specific counts are present, they are used instead of `$ai_cache_creation_input_tokens`; the aggregate should equal their sum, and if either is missing the aggregate is used.
- **Gemini:** built-in pricing uses normal input rates for cache writes and does not estimate storage fees.
- **`$ai_request_count`** defaults to 1 if `$ai_request_price` is set.
- **`$ai_cache_reporting_exclusive`** defaults to `true` for the Anthropic provider or Claude models, `false` otherwise.

### `$ai_trace`

`$ai_trace_id`, `$ai_session_id` (optional), `$ai_input_state`, `$ai_output_state` (messages or any JSON-serializable state), `$ai_latency` (optional), `$ai_span_name` (optional, the trace's name, e.g. `chat_completion`, `rag_pipeline`), `$ai_is_error`, `$ai_error`.

### `$ai_span`

`$ai_trace_id`, `$ai_session_id` (optional), `$ai_span_id` (optional), `$ai_span_name` (e.g. `vector_search`, `data_retrieval`, `tool_call`), `$ai_parent_id` (the `trace_id` or another `span_id`), `$ai_input_state`, `$ai_output_state`, `$ai_latency` (e.g. `0.361`), `$ai_is_error`, `$ai_error` (e.g. `{"message":"Connection timeout","code":"TIMEOUT"}`).

### `$ai_embedding`

`$ai_trace_id`, `$ai_session_id`, `$ai_span_id`, `$ai_span_name` (e.g. `embed_user_query`, `index_document`), `$ai_parent_id`, `$ai_model` (e.g. `text-embedding-3-small`, `text-embedding-ada-002`), `$ai_provider` (e.g. `openai`, `cohere`, `voyage`), `$ai_input` (a string, or an array for a batch), `$ai_input_tokens`, `$ai_latency`, `$ai_http_status`, `$ai_base_url`, `$ai_request_url` (e.g. `https://api.openai.com/v1/embeddings`), `$ai_is_error`, `$ai_error`. Costs: `$ai_input_cost_usd`, `$ai_output_cost_usd` (usually 0), `$ai_total_cost_usd`.

## Cost calculation

- **Precedence:** 1) pre-calculated costs; 2) custom pricing; 3) automatic model matching (OpenRouter, then the manual list).
- **Automatic:** cost comes from input and output tokens, plus per-request and per-web-search pricing where they apply, matched on `$ai_provider` and `$ai_model`. `$ai_total_cost_usd` is token cost plus cache read and write, request and web search costs. Reasoning (thinking) tokens are taken into account and cached-token pricing is applied automatically.
- **Cache accounting:** exclusive (Anthropic, Claude) keeps cache tokens separate from `$ai_input_tokens` (100 input plus 50 cached gives `$ai_input_tokens` 100); inclusive (OpenAI and most others) counts them in (gives 150). PostHog detects it by provider and model; override with `$ai_cache_reporting_exclusive: true|false`. When unset, PostHog resolves it and writes the resolved value back to the event.
- **Custom price per token:** `$ai_input_token_price` and `$ai_output_token_price` are both required for custom pricing to take effect; cache read and write, request and web search prices are optional. Prices are per individual token, not per million: $0.03 per 1M is `0.00000003`.

```javascript
import { OpenAI } from '@posthog/ai'
import { PostHog } from 'posthog-node'

const phClient = new PostHog(
  '<ph_project_token>',
  { host: 'https://us.i.posthog.com' }
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  posthog: phClient
})

const response = await openai.responses.create({
  model: 'my-custom-model',
  messages: [{ role: 'user', content: 'Hello' }],
  posthogProperties: {
    $ai_input_token_price: 0.00000003,   // $0.03 per 1M tokens = $0.00000003 per token
    $ai_output_token_price: 0.00000006,  // $0.06 per 1M tokens = $0.00000006 per token
    // Optional: cache pricing
    $ai_cache_read_token_price: 0.000000015,
    $ai_cache_write_token_price: 0.0000000375
  }
})
```

- **Conflict:** the cost page imports `OpenAI` from `'@posthog/ai'` and passes `messages` to `responses.create`; the OpenAI install page imports from `'@posthog/ai/openai'` and passes `input` (see [LLM-PROVIDERS.md](LLM-PROVIDERS.md#openai)). Confirm in the current docs.
- **Pre-calculated costs** (manual capture): `$ai_input_cost_usd`, `$ai_output_cost_usd`, `$ai_request_cost_usd`, `$ai_web_search_cost_usd` are used as given.

```javascript
// After making your LLM call and calculating costs
posthog.capture('$ai_generation', {
  $ai_trace_id: traceId,
  $ai_model: 'my-custom-model',
  $ai_provider: 'my-provider',
  $ai_input_tokens: inputTokens,
  $ai_output_tokens: outputTokens,
  $ai_input_cost_usd: 0.0042,
  $ai_output_cost_usd: 0.0028
  // ... other required properties
})
```

- **Conflict:** this snippet uses the event-name-first form `posthog.capture('$ai_generation', {...})`; the manual-capture page's posthog-node example uses `client.capture({ distinctId, event, properties })`. Confirm in the current docs.
- **Metadata PostHog sets on calculated events:** `$ai_model_cost_used` (e.g. `openai/gpt-4o-mini`), `$ai_cost_model_source` (`openrouter`, `manual`, `custom`, `passthrough`), `$ai_cost_model_provider` (`openai`, `anthropic`, `custom`). The cost code: https://github.com/PostHog/posthog/tree/master/nodejs/src/ingestion/pipelines/ai/costs

## Privacy mode

- **Privacy mode excludes `$ai_input` and `$ai_output_choices`.** Turn it on for the client with `new PostHog('<ph_project_token>', { host, privacyMode: true })`, or per request with `posthogPrivacyMode: true` (OpenAI TS).
- **The Vercel AI SDK OpenTelemetry path has no PostHog privacy switch;** use `recordInputs: false` and `recordOutputs: false` in `telemetry` ([LLM-PROVIDERS.md](LLM-PROVIDERS.md#vercel-ai-sdk)).

## Prove it

- **Rows arrive:** under **AI Observability**, the **Traces** and **Generations** tabs show rows for the call you just made (https://app.posthog.com/ai-observability/generations).
- **Every event has a trace:** each `$ai_generation`, `$ai_span` and `$ai_embedding` carries a `$ai_trace_id` matching the allowed character set, and tool calls from wrapper-based providers appear as `$ai_span` events under the same trace.
- **Users are attached:** generations show a person, not an anonymous or fallback ID, when the code passes a distinct ID.
- **Cost is set:** `$ai_total_cost_usd` is present, and `$ai_cost_model_source` names the source you expect (`custom` when you set prices, `passthrough` when you set `$ai_cost_passthrough`).
- **The app survives without PostHog:** with the PostHog env vars unset, the app builds and boots; a development build fails loudly with the commandment's message, and production does nothing.
- **Nothing is lost at exit:** a short script that ends right after its LLM call still shows its generation, because it calls `shutdown()` or `forceFlush()`.
