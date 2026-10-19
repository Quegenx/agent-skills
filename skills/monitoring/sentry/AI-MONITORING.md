# AI monitoring

Sentry's AI (agent) monitoring records LLM calls, agent runs, tool calls and handoffs as `gen_ai.*` spans and groups them into Conversations, with token counts and costs. It rides on tracing, so what decides most outcomes is sampling: agent runs are sampled as complete span trees, and "If the root trace is dropped, the agent run is dropped." Then: one AI span producer per runtime, the prompt and output capture choice (the sources disagree on the default), and a stable conversation ID. Base SDK setup is in the platform files ([NODE.md](NODE.md), [NODE-TRACING.md](NODE-TRACING.md), [NEXTJS-FEATURES.md](NEXTJS-FEATURES.md), [NESTJS.md](NESTJS.md), [CLOUDFLARE.md](CLOUDFLARE.md), [REACT-NATIVE-FEATURES.md](REACT-NATIVE-FEATURES.md)); attribute naming for other domains is in [INSTRUMENTATION.md](INSTRUMENTATION.md#attribute-semantics).

**JavaScript version boundary:** retained vendor examples target the stated SDK 10 era source unless marked 11; read the [SDK 11 migration](UPGRADE.md#v10-to-v11) before applying them to 11. Native Flutter/RN SDK versions are separate. [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/]

**Contents:** [Before you edit](#before-you-edit) · [Docs to read](#docs-to-read) · [Detect](#detect) · [Integrations](#integrations) · [Cloudflare Workers](#cloudflare-workers) · [Browser and Next.js](#browser-and-nextjs) · [Vercel AI SDK](#vercel-ai-sdk) · [Manual instrumentation](#manual-instrumentation) · [Attributes](#attributes) · [Tokens and cost](#tokens-and-cost) · [Conversations](#conversations) · [Sampling](#sampling) · [Troubleshooting](#troubleshooting) · [Prove it](#prove-it)

## Before you edit

- **Requires tracing** (`tracesSampleRate > 0`), sampled so the AI traces survive ([Sampling](#sampling)).
- **One AI span producer per runtime.** Preserve existing instrumentation where possible; never create a second Sentry initialization, OTLP exporter or AI span producer.
- **Decide prompt and output capture with the user.** Prompt and output recording is likely PII. JS genAI input/output capture is **on by default**, governed by `dataCollection.genAI`, with per-integration overrides `recordInputs` / `recordOutputs`. The sources disagree on what to do: the AI-monitoring setup skill says "Ask the user whether they want prompt/output capture enabled. Do not enable prompt/output capture without explicit confirmation"; the instrument skill and the AI-monitoring concept say keep prompt, response, tool argument, tool result and system-instruction capture enabled by default (the Agent Tracing transcript relies on it) and disable or scope it only on a privacy, security, compliance or volume concern, preserving restrictions already chosen. The data-scrubbing concept says this capture is opt-in (only when PII capture is enabled). Before relying on capture, the setup skill says to confirm the app's privacy policy permits capturing prompts and responses, the data complies with applicable regulations (GDPR, CCPA), and Sentry's data retention fits the data's sensitivity. Default server-side scrubbing rules don't cover these attributes ([PRACTICES.md](PRACTICES.md)).
- **Set a conversation ID by default** for multi-turn chats, anywhere it makes sense to identify a chat session; some integrations infer it, many setups must set it ([Conversations](#conversations)).
- **`tracesSampleRate: 1.0` only in development;** in production use a lower value or a `tracesSampler` function.
- **These APIs are examples.** SDK versions, API names and samples change; verify against docs.sentry.io, which is the source of truth.

## Docs to read

| Need | Docs |
|---|---|
| Product overview, conversations, costs, privacy | https://docs.sentry.io/product/agents/ , https://docs.sentry.io/product/agents/conversations/ (#conversation-id), https://docs.sentry.io/product/agents/costs/ , https://docs.sentry.io/product/agents/privacy/ |
| Node, Bun, Deno | https://docs.sentry.io/platforms/javascript/guides/node/agent-tracing/ |
| Next.js / NestJS / Cloudflare | `https://docs.sentry.io/platforms/javascript/guides/{nextjs,nestjs,cloudflare}/agent-tracing/` |
| React Native | https://docs.sentry.io/platforms/react-native/agent-tracing/ |
| Per integration (Node) | `https://docs.sentry.io/platforms/javascript/guides/node/agent-tracing/{vercelai,openai,anthropic,google-genai,langchain,langgraph,mastra,flue}/` |
| Custom spans | https://getsentry.github.io/sentry-conventions/attributes/gen_ai/ and https://github.com/getsentry/sentry-conventions/ |

- **Prefer the conventions page for manual spans:** the JS manual-instrumentation docs (https://docs.sentry.io/platforms/javascript/guides/connect/ai-agent-monitoring/#manual-instrumentation) "may lag behind; do not set attributes marked deprecated".
- **Eve:** use the Sentry Node SDK path (Node Agent Tracing plus the Vercel AI SDK guide); it "requires `@sentry/node` v11 or newer". Don't install Eve's OTLP exporter unless explicitly asked; if one exists, ask which to keep and "do not run both".

## Detect

```bash
grep -E '"(openai|@anthropic-ai/sdk|ai|@langchain|@google/genai)"' package.json
grep -E 'tracesSampleRate|tracesSampler' sentry.*.config.* instrument.* src/instrument.* app/instrument.* 2>/dev/null
```

- **If the rate is below 1.0 and there is no `tracesSampler`, ask:** "Your current sample rate is {rate}. Agent runs are sampled as complete span trees; if the root span is dropped, all child gen_ai spans are lost. For full AI visibility, gen_ai-related transactions should be sampled at 100%. Would you like me to set up a `tracesSampler` that keeps AI traces at 100% while sampling other traffic at your current rate?"

## Integrations

| Package | Integration | Auto |
|---|---|---|
| `openai` | `openAIIntegration()` | Yes |
| `@anthropic-ai/sdk` | `anthropicAIIntegration()` | Yes |
| `ai` (Vercel AI SDK) | `vercelAIIntegration()` | Yes, but requires `experimental_telemetry` per call before Sentry SDK 11 ([below](#vercel-ai-sdk)) |
| `@langchain/*` | `langChainIntegration()` | Yes |
| `@langchain/langgraph` | `langGraphIntegration()` | Yes |
| `@google/genai` | `googleGenAIIntegration()` | Yes |

- **Minimum Sentry JS SDK 10.53.0.** In Node.js the integrations auto-enable when the package is installed; just enable tracing:

```javascript
Sentry.init({
  dsn: "YOUR_DSN",
  tracesSampleRate: 1.0, // Lower in production (e.g., 0.1)
  // OpenAI, Anthropic, Google GenAI, LangChain integrations auto-enable in Node.js
});
```

- **To customize** (for example prompt capture), pass the integration. The LangChain/LangGraph section, though titled auto-enabled, lists them explicitly: `integrations: [Sentry.langChainIntegration(), Sentry.langGraphIntegration()]`.

```javascript
Sentry.init({
  dsn: "YOUR_DSN",
  tracesSampleRate: 1.0,
  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
  integrations: [
    Sentry.openAIIntegration({
      // recordInputs/recordOutputs default to true (governed by dataCollection.genAI)
    }),
  ],
});
```

## Cloudflare Workers

- **`workerd` doesn't support monkey-patching,** so the routes are: the host wrapper, the Agents SDK wrapper, Workers AI automatic spans, Vite build-time injection, or manual instrumentation.
- **Workers AI (`env.AI`)** is auto-instrumented by `withSentry` (v10.67.0+). **`openai`, `@anthropic-ai/sdk`, `@google/genai`, `ai`** need the build-time Sentry Cloudflare Vite plugin (v10.68.0+, experimental) or manual client wrapping. **LangChain and LangGraph** are manual only.
- **"Do not add provider instrumentation to Flue-generated model calls."** Keep capture enabled by default (see the disagreement in [Before you edit](#before-you-edit)). "Verify under the real Worker or Durable Object path that performs the AI call."
- **Docs to read** (base `https://docs.sentry.io/platforms/javascript/guides/cloudflare/`):

| Case | Path |
|---|---|
| Worker or Pages | `agent-tracing/` |
| Workers AI (`env.AI`) | `features/workers-ai/` |
| Agents SDK | `features/agents-sdk/` |
| Durable Object host | `features/durableobject/` |
| OpenAI, Anthropic, Google Gen AI, Vercel AI SDK, LangChain, LangGraph, Flue | `agent-tracing/{openai,anthropic,google-genai,vercelai,langchain,langgraph,flue}/` |
| Build-time provider instrumentation | `features/vite-plugin/` |
| Node.js compat | `features/nodejs-compat/` |
| Custom | `agent-tracing/manual-instrumentation/` plus sentry-conventions |

Worker setup itself is in [CLOUDFLARE.md](CLOUDFLARE.md).

## Browser and Next.js

- **"In browser-side code or Next.js meta-framework apps, auto-instrumentation is not available."** Wrap the client by hand.

```javascript
import OpenAI from "openai";
import * as Sentry from "@sentry/nextjs"; // or @sentry/react, @sentry/browser

const openai = Sentry.instrumentOpenAiClient(new OpenAI());
// Use 'openai' client as normal
```

## Vercel AI SDK

- **Edge runtime:** before Sentry SDK 11, add `Sentry.vercelAIIntegration()` to `sentry.edge.config.ts`. From SDK 11, Sentry's Vercel AI page says the Edge runtime isn't instrumented (see below); confirm in the current docs.
- **Enable telemetry per call:**

```javascript
await generateText({
  model: openai("gpt-4o"),
  prompt: "Hello",
  experimental_telemetry: {
    isEnabled: true,
    recordInputs: true,
    recordOutputs: true,
  },
});
```

- **From Sentry SDK 11.0.0** (the setup above is for earlier versions), Sentry's Vercel AI page supports `ai` `>=3.0.0 <=7`, sets no per-call telemetry and records inputs and outputs through the integration's own `recordInputs` / `recordOutputs`. It doesn't instrument the Edge runtime (the instrumentation relies on diagnostics channels); run AI calls in Node. Don't use the AI SDK's `registerTelemetry` (AI SDK 7) with `vercelAIIntegration`: the integration already instruments the SDK, and both produce duplicate spans. On AI SDK 7, `generateObject()` and `streamObject()` produce no spans; use `generateText()` or `streamText()` with an `output` setting. `experimental_decide()` is traced from Sentry SDK 11.7.0 with AI SDK 7.0.128.
- **AI SDK 7 renamed `experimental_telemetry` to `telemetry`** (the old name is a deprecated alias) and made telemetry opt-out once an integration is registered (AI SDK 7.0 migration guide).

## Manual instrumentation

| Span | Op | Name |
|---|---|---|
| LLM call | `gen_ai.{gen_ai.operation.name}`: `gen_ai.chat`, `gen_ai.embeddings`, `gen_ai.generate_content`, `gen_ai.text_completion` (also `gen_ai.request`) | `{operation} {model}`, e.g. `chat gpt-4o` |
| Agent run | `gen_ai.invoke_agent` | `invoke_agent {agent_name}` |
| Tool call | `gen_ai.execute_tool` | `execute_tool {tool_name}` |
| Handoff | `gen_ai.handoff` | `handoff from {source} to {target}` |

- **"Span attributes only accept primitives; arrays/objects must be JSON-stringified."**

```javascript
const inputMessages = [
  { role: "user", parts: [{ type: "text", content: "Tell me a joke" }] },
];

await Sentry.startSpan({
  op: "gen_ai.chat",
  name: "chat gpt-4o",
  attributes: {
    "gen_ai.request.model": "gpt-4o",
    "gen_ai.operation.name": "chat",
    "gen_ai.input.messages": JSON.stringify(inputMessages),
  },
}, async (span) => {
  const result = await llmClient.complete(inputMessages);

  const outputMessages = [
    {
      role: "assistant",
      parts: [
        // Thinking/reasoning content goes in a `reasoning` part, NOT a `text` part.
        // Sentry surfaces it separately and filters it out of the Conversations view.
        { type: "reasoning", content: result.reasoning },
        { type: "text", content: result.text },
      ],
      finish_reason: result.finishReason,
    },
  ];
  span.setAttribute("gen_ai.output.messages", JSON.stringify(outputMessages));
  span.setAttribute("gen_ai.usage.input_tokens", result.inputTokens);
  span.setAttribute("gen_ai.usage.output_tokens", result.outputTokens);
  return result;
});
```

- **Reasoning is its own part:** represent Anthropic `thinking`, Gemini `thought` and DeepSeek `reasoning_content` as `{"type": "reasoning", "content": "..."}`; don't fold it into `text`, and include the same reasoning parts in `gen_ai.input.messages` when they are fed back.

## Attributes

- **From the setup skill:** common `gen_ai.request.model` (required), `gen_ai.operation.name`, `gen_ai.agent.name`; model config `gen_ai.request.reasoning_effort`; content (PII) `gen_ai.input.messages` (JSON array of `{role, parts}`; roles `user`, `assistant`, `tool`, `system`; part types `text`, `reasoning`, `tool_call`, `tool_call_response`), `gen_ai.output.messages`, `gen_ai.system_instructions`, `gen_ai.tool.definitions`; tokens `gen_ai.usage.input_tokens` (includes cached), `gen_ai.usage.input_tokens.cached`, `gen_ai.usage.input_tokens.cache_write`, `gen_ai.usage.output_tokens` (includes reasoning), `gen_ai.usage.output_tokens.reasoning`, `gen_ai.usage.total_tokens`; tool spans `gen_ai.tool.name`, `gen_ai.tool.description`, `gen_ai.tool.call.arguments`, `gen_ai.tool.call.result`.
- **From the semantic-conventions table** (type in parentheses where given):

| Group | Keys |
|---|---|
| Identity | `gen_ai.agent.name`, `gen_ai.conversation.id`, `gen_ai.function_id`, `gen_ai.pipeline.name`, `gen_ai.prompt.name`, `gen_ai.provider.name` |
| Operation | `gen_ai.operation.name` (well-known 'chat', 'create_agent', 'embeddings', 'execute_tool', 'generate_content', 'invoke_agent', 'text_completion'; MUST be used if applicable); `gen_ai.operation.type` ('agent', 'ai_client', 'tool', 'handoff', 'other'; added during ingestion) |
| Request | `gen_ai.request.frequency_penalty`, `max_tokens`, `model`, `presence_penalty`, `reasoning.level`, `seed`, `stop_sequences`, `temperature`, `top_k`, `top_p` |
| Response | `gen_ai.response.finish_reasons`, `id`, `model`, `streaming`, `time_to_first_chunk` (seconds), `tokens_per_second` |
| Content | `gen_ai.input.messages` (stringified array; `role` must be `"user"`, `"assistant"`, `"tool"` or `"system"`; non-tool content a string or a `{type: "text", text:"..."}` list), `gen_ai.output.messages`, `gen_ai.system_instructions`, `gen_ai.embeddings.input` |
| Tools | `gen_ai.tool.name`, `gen_ai.tool.description`, `gen_ai.tool.definitions`, `gen_ai.tool.call.arguments`, `gen_ai.tool.call.result` (stringified) |
| Usage (integer) | `gen_ai.usage.input_tokens` ("including cached input tokens"), `gen_ai.usage.cache_read.input_tokens`, `gen_ai.usage.cache_creation.input_tokens`, `gen_ai.usage.output_tokens` ("including reasoning tokens"), `gen_ai.usage.reasoning.output_tokens`, `gen_ai.usage.total_tokens` |
| Cost (double, USD) | `gen_ai.cost.input_tokens` ("includes cached and cache creation tokens"), `gen_ai.cost.cache_read.input_tokens`, `gen_ai.cost.cache_creation.input_tokens`, `gen_ai.cost.output_tokens` ("includes reasoning tokens"), `gen_ai.cost.reasoning.output_tokens`, `gen_ai.cost.total_tokens` |
| Context | `gen_ai.context.utilization` (double), `gen_ai.context.window_size` (integer) |

- **The two sources spell cache and reasoning token keys differently:** the setup skill uses `gen_ai.usage.input_tokens.cached`, `gen_ai.usage.input_tokens.cache_write` and `gen_ai.usage.output_tokens.reasoning`; the conventions table uses `gen_ai.usage.cache_read.input_tokens`, `gen_ai.usage.cache_creation.input_tokens` and `gen_ai.usage.reasoning.output_tokens`. Check https://getsentry.github.io/sentry-conventions/attributes/gen_ai/ and skip keys marked deprecated.

## Tokens and cost

- **Cached, cache-creation and reasoning counts are subsets** of the total input or output count, and Sentry subtracts them when costing (https://docs.sentry.io/ai/monitoring/agents/costs/). A subset larger than its total produces negative costs. Correct: `input_tokens = 100`, `input_tokens.cached = 90`. Wrong: `input_tokens = 10`, `input_tokens.cached = 90`.

## Conversations

- **Explore > Conversations** groups AI spans by `gen_ai.conversation.id`. Prerequisites: tracing above 0; Gen AI span streaming (`streamGenAiSpans`, available since JS SDK 10.53.0, default `true` since 10.61.0, sends AI spans as standalone items so large inputs and outputs don't hit transaction payload limits); and input/output capture enabled, otherwise conversations appear empty.
- **The conversation ID** is inferred automatically by the OpenAI SDK for Node; otherwise set it at the start of the conversation. Without one, the spans still work but Conversations can't group the session.

```javascript
import * as Sentry from "@sentry/node"; // or @sentry/nextjs, @sentry/nestjs, etc.

// Set at the start of a conversation
Sentry.setConversationId("conv_abc123");

// All subsequent AI calls carry gen_ai.conversation.id: "conv_abc123"
await openai.chat.completions.create({
  model: "gpt-5.5",
  messages: [{ role: "user", content: "Hello" }],
});
```

- **Keep it short and opaque** (alphanumerics, dashes, underscores); never a URL, email or free text. It is used as a URL path segment, so a slash breaks Conversations. Good: UUID `48e35936-82ab-4f1a-beaf-b2fa4273ac5e`, `conv_5j66UpCpwteGg4YSxUnt7lPYU`, `asst_abc12345`, `sess_987654`.
- **User column:** call `Sentry.setUser(...)` once per request or session before the AI calls; any of `id`, `email`, `username` suffices; "Unknown" means it wasn't called. The setup skill's example is `Sentry.setUser({ id: "user_123", email: "jane@example.com", username: "jane" });`; the logging guide prefers opaque user IDs ([SIGNALS-PRACTICE.md](SIGNALS-PRACTICE.md#what-to-log)).
- **Conversations and traces are independent:** one conversation can span several traces (a page refresh mid-conversation starts a new trace with the same conversation ID), and one trace can hold several conversations (a new chat started without refreshing).

## Sampling

- **The decision is made at the root and children inherit;** `tracesSampler` only fires on root spans. Two cases: the gen_ai span is the root (a cron, queue consumer, CLI), so match it and return 1.0; or gen_ai spans are children of HTTP transactions, so sample the AI routes at 1.0. `inheritOrSampleWith` needs `@sentry/node` 9.x or newer.

```javascript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampler: ({ name, attributes, inheritOrSampleWith }) => {
    // Standalone gen_ai root spans
    if (attributes?.['sentry.op']?.startsWith('gen_ai.') || attributes?.['gen_ai.system']) {
      return 1.0;
    }
    // HTTP routes that trigger AI calls
    if (name?.includes('/api/chat') || name?.includes('/api/agent')) {
      return 1.0;
    }
    return inheritOrSampleWith(0.2); // adjust to your baseline
  },
});
```

- **"If AI is the core product, skip `tracesSampler` and use `tracesSampleRate: 1.0`."**
- **If 100% tracing isn't feasible,** emit metrics (a `gen_ai.token_usage` distribution, a `gen_ai.calls` count with `status`) and logs on every LLM call, with `Sentry.metrics.*` and `Sentry.logger.*`. The fallback example puts `user_id` on the metric, which the signal guide warns against for metric dimensions ([INSTRUMENTATION.md](INSTRUMENTATION.md#gotchas)).

## Troubleshooting

| Symptom | Fix |
|---|---|
| No `gen_ai.*` spans | `tracesSampleRate > 0`; check the SDK version |
| Spans missing although the sampler returns 1.0 | The parent HTTP transaction is sampled lower; add its route to the sampler |
| Sampler not called for gen_ai spans | Expected: it only fires on roots |
| Every trace sampled at 100% | Check the `inheritOrSampleWith()` fallback |
| Token counts missing | Some providers don't return tokens for streaming |
| Negative costs | A cached or reasoning subset exceeds its total |
| Prompts not captured (JS) | Make sure it isn't `dataCollection: { genAI: { inputs: false } }`, or pass `recordInputs: true` |
| Vercel AI SDK not recorded | Before Sentry SDK 11, add `experimental_telemetry` to each call; from 11, run the call in Node, and on AI SDK 7 use `generateText`/`streamText` rather than `generateObject` |
| Conversations empty | Span streaming on, input/output capture on, a conversation ID set |
| User column "Unknown" | Call `Sentry.setUser(...)` before the AI calls |

## Prove it

- **Spans arrive:** make a real LLM call through the app and see `gen_ai.*` spans (for example `chat gpt-4o`) in the Traces dashboard, with `gen_ai.request.model` and token counts.
- **Sampling keeps them:** with the production sampler in place, an AI route or gen_ai root shows up every time while other traffic is sampled at the baseline.
- **Costs are sane:** no negative costs; cached and reasoning counts are at most their totals.
- **Conversations group:** two turns with the same conversation ID appear as one conversation under Explore > Conversations, with a user, not "Unknown".
- **Capture matches the choice made:** prompts and outputs appear only if capture was left or turned on, and are absent when `dataCollection.genAI` or `recordInputs` / `recordOutputs` turn them off.
- **One producer:** the runtime has one Sentry init and no second OTLP exporter or AI span producer.
