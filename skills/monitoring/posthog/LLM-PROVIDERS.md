# LLM providers and frameworks

The JS/TS setup for AI Observability per provider SDK and framework. Each one takes one of three routes: a PostHog wrapper around the provider client (`@posthog/ai/<provider>`), an OpenTelemetry span processor (`PostHogSpanProcessor` from `@posthog/ai/otel`), or the framework's own callback or exporter. Which route you're on decides how you pass the user, whether tool calls are captured for you, and how you flush. The event model, manual capture, costs and the setup rules are in [LLM-ANALYTICS.md](LLM-ANALYTICS.md); reading the results is in [LLM-EXPLORING.md](LLM-EXPLORING.md); MCP tool analytics is in [MCP-ANALYTICS.md](MCP-ANALYTICS.md).

**Contents:** [Common to every wrapper](#common-to-every-wrapper) · [OpenAI](#openai) · [Azure OpenAI](#azure-openai) · [Anthropic](#anthropic) · [Google Gemini](#google-gemini) · [OpenAI-compatible providers and gateways](#openai-compatible-providers-and-gateways) · [Vercel AI SDK](#vercel-ai-sdk) · [Mastra](#mastra) · [LangChain and LangGraph](#langchain-and-langgraph) · [Instructor and other OpenTelemetry instrumentations](#instructor-and-other-opentelemetry-instrumentations) · [LiteLLM proxy](#litellm-proxy) · [Prove it](#prove-it)

## Common to every wrapper

- **Per call options:** `posthogDistinctId`, `posthogTraceId`, `posthogProperties` (put `$ai_session_id` here). Omit `posthogDistinctId` for anonymous capture.
- **Auto-captured `$ai_generation` properties:** `$ai_model`, `$ai_latency` (seconds), `$ai_time_to_first_token` (streaming only), `$ai_tools`, `$ai_input`, `$ai_input_tokens`, `$ai_output_choices`, `$ai_output_tokens`, `$ai_total_cost_usd`.
- **Tool calls are not captured.** The wrapper captures the standard response as a generation; you capture every tool call yourself as an `$ai_span` with the same `$ai_trace_id`.
- **Examples:** `https://github.com/PostHog/posthog-js/tree/main/examples/example-ai-<slug>` (e.g. `example-ai-groq`).
- **The wizard** installs any of these: `npx @posthog/wizard ai-observability`.

## OpenAI

Install: `npm install @posthog/ai posthog-node openai`. Examples: https://github.com/PostHog/posthog-js/tree/main/examples/example-ai-openai

```typescript
import { OpenAI } from '@posthog/ai/openai'
import { PostHog } from 'posthog-node'

const posthog = new PostHog('<ph_project_token>', { host: 'https://us.i.posthog.com' })

const client = new OpenAI({
  apiKey: 'your_openai_api_key',
  posthog,
})
```

Call (Responses API):

```typescript
const traceId = crypto.randomUUID()

const response = await client.responses.create({
  model: 'gpt-5-mini',
  input: [{ role: 'user', content: "What's the weather in Paris?" }],
  tools,
  posthogDistinctId: 'user_123',
  posthogTraceId: traceId,
  posthogProperties: {
    $ai_session_id: 'conversation-abc',
  },
})
```

Tool calls as spans:

```typescript
for (const item of response.output) {
  if (item.type !== 'function_call') continue

  const start = Date.now()
  const result = await runTool(item.name, JSON.parse(item.arguments))

  posthog.capture({
    distinctId: 'user_123',
    event: '$ai_span',
    properties: {
      $ai_trace_id: traceId,
      $ai_session_id: 'conversation-abc',
      $ai_span_id: crypto.randomUUID(),
      $ai_span_name: item.name,
      $ai_input_state: item.arguments,
      $ai_output_state: result,
      $ai_latency: (Date.now() - start) / 1000,
    },
  })
}
```

Embeddings through the wrapped client are captured as `$ai_embedding`:

```typescript
const response = await client.embeddings.create({
  input: 'The quick brown fox',
  model: 'text-embedding-3-small',
})
```

## Azure OpenAI

Same as OpenAI, except import `AzureOpenAI` from `'@posthog/ai/openai'`, call with `model: '<your-deployment-name>'` and `posthogProperties: { $ai_session_id: 'conversation-abc', $ai_provider: 'azure' }`. The page has no embeddings section. Examples: https://github.com/PostHog/posthog-js/tree/e08ff1be/examples/example-ai-azure-openai

```typescript
const client = new AzureOpenAI({
  apiKey: '<azure_openai_api_key>',
  apiVersion: '2024-10-21',
  endpoint: 'https://<your-resource>.openai.azure.com',
  posthog,
})
```

## Anthropic

Two routes: Claude Platform OpenTelemetry tracing, or the PostHog wrapper.

### Claude Platform tracing

- **Pick one source per PostHog project.** If you use both, each request reaches PostHog twice.
  - **SDK tracing:** set up in code with the Claude SDK; covers the calls your app makes and the tools it runs itself; can link traces to users and add custom properties.
  - **Console destination:** add PostHog in Claude Console, no code; covers Messages API requests, server tools such as web search, and Managed Agents sessions. It does not yet support person identification or custom properties.
- **Install (Node):** `npm install @posthog/ai @opentelemetry/sdk-trace-node @opentelemetry/resources @opentelemetry/exporter-trace-otlp-http`. PostHog has a span processor for Python, Node and Go; Java and Ruby use the standard OTLP exporter (endpoint `https://us.i.posthog.com/i/v0/ai/otel`, header `Authorization: Bearer <ph_project_token>`).
- **Register a tracer provider before your first Claude call,** and set the content mode to see prompts and responses: the SDK sends metadata only by default.

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { PostHogSpanProcessor } from '@posthog/ai/otel'

const provider = new NodeTracerProvider({
  resource: resourceFromAttributes({
    'service.name': 'my-app',
    'posthog.distinct_id': 'user_123', // optional: identifies the user in PostHog
    foo: 'bar', // custom properties are passed through
  }),
  spanProcessors: [
    new PostHogSpanProcessor({
      projectToken: '<ph_project_token>',
      host: 'https://us.i.posthog.com',
    }),
  ],
})
provider.register()

const client = new Anthropic({ openTelemetry: { traces: { contentMode: 'content' } } })

const message = await client.messages.create({
  model: 'claude-opus-5',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Tell me about hedgehogs' }],
})

// Flush the batched spans before a script exits.
await provider.shutdown()
```

- **Content mode by env:** `ANTHROPIC_OPEN_TELEMETRY_TRACES_CONTENT_MODE=content`.
- **Sessions:** set a conversation ID on the client or request (https://platform.claude.com/docs/en/manage-claude/opentelemetry/sdk#configure-the-sdk); PostHog uses it as the session ID.
- **Per-request users:** pass `client: posthog` to `PostHogSpanProcessor` and wrap the work in `posthog.withContext({ distinctId, properties: { $ai_session_id } }, ...)`. Requires `@posthog/ai` 8.14.0 and `posthog-node` 5.15.0 or later.
- **Console destination setup:** Claude Console OpenTelemetry settings (https://platform.claude.com/settings/telemetry-destinations) > **Add destination** (admin role). Provider PostHog; Region US (`us.posthog.com`) or EU (`eu.posthog.com`); Project token `phc_`; Content mode **Full content** or **Metadata only** (tokens, costs and timing without messages); Workspaces **All**, **Selected** or **All except**.
- **What arrives:** each request is an `anthropic.messages.create` trace with cost, tokens and messages. With SDK tracing the tool runner gives each tool its own span. The Console destination sends an `anthropic.model_request` span per model request (more than one with web search, for example). Managed Agents send a span per turn, model request and tool use; a session can span several traces; filter by `anthropic.session.id`.

| Symptom | Meaning and fix |
|---|---|
| Delivery Failing with 401 | The token in Claude Console is a personal API key; use the project token. |
| Delivery Healthy but PostHog is empty | Check the token is from this project and the region matches your PostHog cloud. |
| No traces from the Console destination | The Workspaces setting must cover the API key's workspace. Traces can take up to a minute to arrive. |
| No traces from the Claude SDK | Register the tracer provider before the first Claude call. `ANTHROPIC_OPEN_TELEMETRY=false` turns the spans off. |
| Traces stop at the end of a script | Shut down the tracer provider before exit so the last batch is sent. |
| No prompts or responses | The Console destination is on Metadata only; orgs with a data-handling restriction such as HIPAA always export metadata only; with the SDK, set content mode `content`. |
| Each request appears twice | The Console destination and the SDK both send; remove one. |

### PostHog Anthropic wrapper

Install: `npm install @posthog/ai posthog-node @anthropic-ai/sdk`. Examples: https://github.com/PostHog/posthog-js/tree/main/examples/example-ai-anthropic

```typescript
import { Anthropic } from '@posthog/ai/anthropic'
import { PostHog } from 'posthog-node'

const posthog = new PostHog('<ph_project_token>', { host: 'https://us.i.posthog.com' })

const client = new Anthropic({
  apiKey: 'sk-ant-api...',
  posthog,
})
```

```typescript
const traceId = crypto.randomUUID()

const response = await client.messages.create({
  model: 'claude-sonnet-4-5',
  max_tokens: 1024,
  messages: [{ role: 'user', content: "What's the weather in Paris?" }],
  tools,
  posthogDistinctId: 'user_123',
  posthogTraceId: traceId,
  posthogProperties: {
    $ai_session_id: 'conversation-abc',
  },
})
```

- **Tool spans:** iterate `response.content`, `if (block.type !== 'tool_use') continue`, run `runTool(block.name, block.input)`, and capture `$ai_span` with `$ai_span_name: block.name` and `$ai_input_state: block.input`; the rest matches the OpenAI span loop.

## Google Gemini

Install: `npm install @posthog/ai posthog-node @google/genai`. Examples: https://github.com/PostHog/posthog-js/tree/main/examples/example-ai-gemini

```typescript
import { GoogleGenAI } from '@posthog/ai/gemini'
import { PostHog } from 'posthog-node'

const posthog = new PostHog('<ph_project_token>', { host: 'https://us.i.posthog.com' })

const client = new GoogleGenAI({
  apiKey: 'your_gemini_api_key',
  posthog,
})
```

```typescript
const traceId = crypto.randomUUID()

const response = await client.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: "What's the weather in Paris?",
  config: { tools },
  posthogDistinctId: 'user_123',
  posthogTraceId: traceId,
  posthogProperties: {
    $ai_session_id: 'conversation-abc',
  },
})
```

- **Tool spans:** loop `for (const call of response.functionCalls ?? [])`, run `runTool(call.name, call.args)`, and set `$ai_span_name: call.name`, `$ai_input_state: call.args`.
- **Embeddings** are captured as `$ai_embedding`: `await client.models.embedContent({ model: 'gemini-embedding-001', contents: 'The quick brown fox' })`.

## OpenAI-compatible providers and gateways

Every OpenAI-compatible provider uses PostHog's OpenAI wrapper pointed at the provider's base URL. Install `npm install @posthog/ai posthog-node openai`. OpenRouter shown:

```typescript
import { OpenAI } from '@posthog/ai/openai'
import { PostHog } from 'posthog-node'

const posthog = new PostHog('<ph_project_token>', { host: 'https://us.i.posthog.com' })

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: '<openrouter_api_key>',
  posthog,
})
```

```typescript
const traceId = crypto.randomUUID()

const response = await client.chat.completions.create({
  model: 'gpt-5-mini',
  messages: [{ role: 'user', content: "What's the weather in Paris?" }],
  tools,
  posthogDistinctId: 'user_123',
  posthogTraceId: traceId,
  posthogProperties: {
    $ai_session_id: 'conversation-abc',
    $ai_provider: 'openrouter',
  },
})
```

Tool spans for the chat completions shape:

```typescript
for (const call of response.choices[0].message.tool_calls ?? []) {
  const start = Date.now()
  const result = await runTool(call.function.name, JSON.parse(call.function.arguments))

  posthog.capture({
    distinctId: 'user_123',
    event: '$ai_span',
    properties: {
      $ai_trace_id: traceId,
      $ai_session_id: 'conversation-abc',
      $ai_span_id: crypto.randomUUID(),
      $ai_span_name: call.function.name,
      $ai_input_state: call.function.arguments,
      $ai_output_state: result,
      $ai_latency: (Date.now() - start) / 1000,
    },
  })
}
```

Swap these values per provider:

| Provider | `baseURL` | `apiKey` | Example `model` | `$ai_provider` |
|---|---|---|---|---|
| OpenRouter | `https://openrouter.ai/api/v1` | `<openrouter_api_key>` | `gpt-5-mini` | `openrouter` |
| Cerebras | `https://api.cerebras.ai/v1` | `<cerebras_api_key>` | `llama-3.3-70b` | `cerebras` |
| Cohere | `https://api.cohere.ai/compatibility/v1` | `<cohere_api_key>` | `command-a-03-2025` | `cohere` |
| DeepSeek | `https://api.deepseek.com` | `<deepseek_api_key>` | `deepseek-chat` | `deepseek` |
| Fireworks AI | `https://api.fireworks.ai/inference/v1` | `<fireworks_api_key>` | `accounts/fireworks/models/llama-v3p3-70b-instruct` | `fireworks-ai` |
| Groq | `https://api.groq.com/openai/v1` | `<groq_api_key>` | `llama-3.3-70b-versatile` | `groq` |
| Hugging Face | `https://router.huggingface.co/v1/` | `<huggingface_api_key>` | `meta-llama/Llama-3.3-70B-Instruct` | `hugging-face` |
| Mistral | `https://api.mistral.ai/v1` | `<mistral_api_key>` | `mistral-large-latest` | `mistral` |
| Ollama | `http://localhost:11434/v1` | `ollama` | `llama3.2` | `ollama` |
| Perplexity | `https://api.perplexity.ai` | `<perplexity_api_key>` | `sonar` | `perplexity` |
| Together AI | `https://api.together.xyz/v1` | `<together_api_key>` | `meta-llama/Llama-3.3-70B-Instruct-Turbo` | `together-ai` |
| xAI | `https://api.x.ai/v1` | `<xai_api_key>` | `grok-3` | `xai` |
| Helicone (gateway) | `https://ai-gateway.helicone.ai/` | `<helicone_api_key>` | `gpt-5-mini` | `helicone` |

- **Portkey (gateway):** `npm install @posthog/ai posthog-node openai portkey-ai`; `import { PORTKEY_GATEWAY_URL } from 'portkey-ai'`; `baseURL: PORTKEY_GATEWAY_URL`, `apiKey: '<portkey_api_key>'`; `model: '@<integration-slug>/gpt-5-mini'`; `$ai_provider: 'portkey'`; same tool span loop. Examples: https://github.com/PostHog/posthog-js/tree/e08ff1be/examples/example-ai-portkey
- **Gateways that report the real cost:** set `$ai_cost_passthrough` ([LLM-ANALYTICS.md](LLM-ANALYTICS.md#cost-calculation)).

## Vercel AI SDK

- **v7 goes through OpenTelemetry.** This integration is the supported path for Vercel AI SDK v7. The legacy PostHog `withTracing` wrapper supports the v5 and v6 provider interfaces and rejects v7 models.
- **Requires Node.js 22.22 or later.** Install: `npm install @posthog/ai@^8.7.0 @ai-sdk/openai @ai-sdk/otel ai @opentelemetry/sdk-node @opentelemetry/resources zod`
- **Create `instrumentation.ts`:** start the OTel SDK with `PostHogSpanProcessor`, then register the AI SDK integration. Both setup calls must finish before the first AI SDK call; their relative order does not matter, because the integration obtains a lazy OpenTelemetry tracer.

```typescript
import { OpenTelemetry } from '@ai-sdk/otel'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { PostHogSpanProcessor } from '@posthog/ai/otel'
import { registerTelemetry } from 'ai'

export const posthogSpanProcessor = new PostHogSpanProcessor({
  projectToken: '<ph_project_token>',
  host: 'https://us.i.posthog.com',
})

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    'service.name': 'my-app',
  }),
  spanProcessors: [posthogSpanProcessor],
})

sdk.start()

registerTelemetry(
  new OpenTelemetry({
    enrichSpan: ({ runtimeContext }) => ({
      environment:
        typeof runtimeContext?.properties === 'object' &&
        runtimeContext.properties !== null &&
        'environment' in runtimeContext.properties &&
        typeof runtimeContext.properties.environment === 'string'
          ? runtimeContext.properties.environment
          : undefined,
      'posthog.distinct_id':
        typeof runtimeContext?.distinctId === 'string'
          ? runtimeContext.distinctId
          : undefined,
      '$ai_session_id':
        typeof runtimeContext?.sessionId === 'string'
          ? runtimeContext.sessionId
          : undefined,
      '$ai_trace_name':
        typeof runtimeContext?.traceName === 'string'
          ? runtimeContext.traceName
          : undefined,
      '$groups':
        typeof runtimeContext?.groups === 'object' &&
        runtimeContext.groups !== null &&
        !Array.isArray(runtimeContext.groups)
          ? JSON.stringify(runtimeContext.groups)
          : undefined,
    }),
  })
)
```

```typescript
import { generateText, tool, isStepCount } from 'ai' // v7 renamed stepCountIs (migration guide 7.0)
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { posthogSpanProcessor } from './instrumentation'

async function runWeatherAgent(): Promise<string> {
  const result = await generateText({
    model: openai('gpt-5-mini'),
    prompt: "What's the weather in Paris?",
    tools: {
      get_weather: tool({
        description: 'Get the weather for a city',
        inputSchema: z.object({ city: z.string() }),
        execute: async ({ city }) => `It's always sunny in ${city}!`,
      }),
    },
    stopWhen: isStepCount(5), // let the model see the tool result and respond
    runtimeContext: {
      distinctId: 'user_123',
      sessionId: 'conversation-abc',
      traceName: 'weather-agent',
      groups: {
        company: 'company_123',
      },
      properties: {
        environment: 'production',
      },
    },
    telemetry: {
      functionId: 'my-ai-function',
      includeRuntimeContext: {
        distinctId: true,
        sessionId: true,
        traceName: true,
        groups: true,
        properties: true,
      },
    },
  })

  return result.text
}

try {
  console.log(await runWeatherAgent())
} finally {
  // Spans are still queued in the batch processor when this script exits,
  // so without this flush they never reach PostHog.
  await posthogSpanProcessor.forceFlush()
}
```

- **Flush per request in request-scoped runtimes:** keep the processor reference and `await posthogSpanProcessor.forceFlush()` before the request lifecycle ends, or attach the promise to a lifecycle hook such as `waitUntil`. Long-running services can flush during graceful shutdown.
- **Pass `distinctId` for stable attribution.** Omitting it does not make capture anonymous: PostHog assigns fallback IDs when no distinct ID is present.
- **Groups:** ingestion turns the JSON-string `$groups` attribute into native group associations; other scalar attributes from `enrichSpan` (such as `environment`) stay filterable custom properties.
- **Trace names are not configurable on the v7 OpenTelemetry path yet.** The displayed name comes from the OTel span name, which takes precedence over `$ai_trace_name`; `functionId` is emitted as `gen_ai.agent.name` and does not set the trace name.
- **`runtimeContext` reaches `enrichSpan`** only for `generateText` and `streamText` in the current `@ai-sdk/otel`; object generation, embeddings and reranking don't pass it yet.
- **Privacy:** v7 records prompts and outputs by default. Set `recordInputs: false` / `recordOutputs: false` in `telemetry`; there is no separate PostHog privacy switch on this path.

## Mastra

Install: `npm install @mastra/core @mastra/observability @mastra/posthog`. The official `@mastra/posthog` exporter sends traces as `$ai_generation`. Examples: https://github.com/PostHog/posthog-js/tree/main/examples/example-ai-mastra (wrapper alternative: https://github.com/PostHog/posthog-js/tree/e08ff1be/examples/example-ai-mastra)

```typescript
import { Mastra } from '@mastra/core'
import { Agent } from '@mastra/core/agent'
import { Observability } from '@mastra/observability'
import { PosthogExporter } from '@mastra/posthog'

const weatherAgent = new Agent({
  id: 'weather-agent',
  name: 'Weather Agent',
  instructions: 'You are a helpful assistant with access to weather data.',
  model: { id: 'openai/gpt-4o-mini' },
})

const mastra = new Mastra({
  agents: { weatherAgent },
  observability: new Observability({
    configs: {
      posthog: {
        serviceName: 'my-app',
        exporters: [
          new PosthogExporter({
            apiKey: '<ph_project_token>',
            host: 'https://us.i.posthog.com',
            defaultDistinctId: 'user_123', // fallback if no userId in metadata
          }),
        ],
      },
    },
  }),
})
```

Per request, `tracingOptions.metadata` maps `userId` to the distinct ID, `sessionId` to `$ai_session_id`, and every other key to a custom property:

```typescript
const agent = mastra.getAgent('weatherAgent')

const result = await agent.generate("What's the weather in Dublin?", {
  tracingOptions: {
    metadata: {
      userId: 'user_123', // becomes distinct_id
      sessionId: 'session_abc', // becomes $ai_session_id
      conversation_id: 'abc-123', // custom property
    },
  },
})
```

- **Anonymous:** omit `userId` and don't set `defaultDistinctId`.

## LangChain and LangGraph

- **Install LangChain:** `npm install posthog-node @posthog/ai langchain@^1.0 @langchain/core @langchain/openai zod`. **LangGraph:** `npm install posthog-node @posthog/ai @langchain/langgraph @langchain/openai @langchain/core zod`.
- **Create the PostHog client once, then a callback handler per request or conversation.** Build the agent once and the handler on each turn.

```typescript
import { PostHog } from 'posthog-node'
import { LangChainCallbackHandler } from '@posthog/ai/langchain'

const posthog = new PostHog('<ph_project_token>', { host: 'https://us.i.posthog.com' })

function createHandler(userId: string, sessionId: string): LangChainCallbackHandler {
  return new LangChainCallbackHandler({
    client: posthog,
    distinctId: userId,
    properties: { $ai_session_id: sessionId },
  })
}
```

```typescript
import { ChatOpenAI } from '@langchain/openai'
import { tool } from '@langchain/core/tools'
import { createAgent } from 'langchain'
import { z } from 'zod'

const getWeather = tool(
  (input) => `It's always sunny in ${input.city}!`,
  {
    name: 'get_weather',
    description: 'Get the weather for a given city',
    schema: z.object({
      city: z.string().describe('The city to get the weather for'),
    }),
  }
)

const model = new ChatOpenAI({ apiKey: 'your_openai_api_key' })
const agent = createAgent({ model, tools: [getWeather] })

async function ask(userInput: string, userId: string, conversationId: string): Promise<string> {
  const handler = createHandler(userId, conversationId)
  const result = await agent.invoke(
    { messages: [{ role: 'user', content: userInput }] },
    { callbacks: [handler] }
  )
  return result.messages[result.messages.length - 1].content
}

await ask("What's the weather in Paris?", 'user_123', 'conversation-abc')
```

- **Traces, generations and tool-call spans are captured automatically.**
- **LangGraph:** `import { createReactAgent } from '@langchain/langgraph/prebuilt'`, build with `createReactAgent({ model, tools: [getWeather] })`, and attach the handler through `config` on invoke inside the per-turn function. Because `create_react_agent` runs the turn as a single root run, PostHog nests each tool call as an `$ai_span` under the trace automatically, with real latency.
- **LangChain 0.x** used `AgentExecutor`; the handler and properties are the same on either version.
- **Identity and grouping:** omit `distinctId` for anonymous capture; pass the same `$ai_session_id` to every handler of a conversation; pass `traceId` to set the top-level trace ID instead of letting PostHog generate one.

## Instructor and other OpenTelemetry instrumentations

Install: `npm install @instructor-ai/instructor openai zod @posthog/ai @opentelemetry/sdk-node @opentelemetry/resources @opentelemetry/instrumentation-openai`. PostHog converts `gen_ai.*` spans into `$ai_generation` events automatically.

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { PostHogSpanProcessor } from '@posthog/ai/otel'
import { OpenAIInstrumentation } from '@opentelemetry/instrumentation-openai'

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    'service.name': 'my-app',
    'posthog.distinct_id': 'user_123', // optional: identifies the user in PostHog
    foo: 'bar', // custom properties are passed through
  }),
  spanProcessors: [
    new PostHogSpanProcessor({
      projectToken: '<ph_project_token>',
      host: 'https://us.i.posthog.com',
    }),
  ],
  instrumentations: [new OpenAIInstrumentation()],
})
sdk.start()
```

- **Use:** `Instructor({ client: oai, mode: 'TOOLS' })`, then `client.chat.completions.create({ model: 'gpt-4o-mini', response_model: { schema: UserSchema, name: 'User' }, messages: [...] })`.
- **Anonymous:** omit the `posthog.distinct_id` resource attribute.
- **Sessions on OTel instrumentation paths:** the instrumentation creates the span, so add a span processor that sets `$ai_session_id` on start. PostHog forwards span attributes it doesn't recognize onto the event. If the instrumentation sets `gen_ai.conversation.id`, PostHog uses it as the session ID; an explicit `$ai_session_id` takes priority.

```typescript
import { AsyncLocalStorage } from 'node:async_hooks'
import type { Span, SpanProcessor } from '@opentelemetry/sdk-trace-base'

const sessionStore = new AsyncLocalStorage<string>()

class SessionIdSpanProcessor implements SpanProcessor {
  onStart(span: Span): void {
    const sessionId = sessionStore.getStore()
    if (sessionId) {
      span.setAttribute('$ai_session_id', sessionId)
    }
  }
  onEnd(): void {}
  async shutdown(): Promise<void> {}
  async forceFlush(): Promise<void> {}
}

// Every span started inside the callback carries this session ID
const reply = await sessionStore.run('conversation-abc', () => handleTurn(userMessage))
```

- **Wire it in:** add `new SessionIdSpanProcessor()` to the `NodeSDK` `spanProcessors` array next to `PostHogSpanProcessor`. If a process handles only one session, set `$ai_session_id` as a resource attribute next to `service.name` instead (resource attributes apply to every span).

## LiteLLM proxy

- **Requires LiteLLM 1.77.3 or higher.** Run the proxy with `pip install 'litellm[proxy]'` or `docker run --rm -p 4000:4000 ghcr.io/berriai/litellm:latest`, then `litellm --config config.yaml`.

```yaml
# config.yaml
model_list:
- model_name: gpt-5-mini
  litellm_params:
    model: gpt-5-mini

litellm_settings:
  success_callback: ["posthog"]
  failure_callback: ["posthog"]  # Optional: also log failures

environment_variables:
  POSTHOG_API_KEY: "<ph_project_token>"
  POSTHOG_API_URL: "https://us.i.posthog.com"  # Optional
```

- **`POSTHOG_API_URL` is optional** and defaults to `https://app.posthog.com`.
- **Identity and traces go in the request `metadata`:** `user_id` becomes the distinct ID, plus `$ai_session_id`, `$ai_trace_id` and custom keys. There is no dedicated `posthog_trace_id` parameter. Omit `user_id` for anonymous capture.
- **`{"no-log": true}` in metadata** disables logging for that request.
- **Tool spans** you capture yourself; embeddings through `/embeddings` are captured too.

## Prove it

- **Rows arrive:** under **AI Observability**, the **Traces** and **Generations** tabs show the call (https://app.posthog.com/ai-observability/generations).
- **Wrapper routes:** a call with tools shows the generation plus one `$ai_span` per tool call under the same trace; without your span loop, there are none.
- **LangChain and LangGraph:** tool calls appear as `$ai_span` events under the trace without any capture code.
- **Vercel AI SDK:** generations carry the `distinctId` from `runtimeContext`, not a fallback ID, and `$groups` shows as a group association. A script or request handler that ends right after the call still delivers spans, because it awaits `forceFlush()`.
- **Claude Platform:** each request appears once (not twice), and with content mode `content` the prompts and responses are visible.
- **OpenAI-compatible providers:** `$ai_provider` on each generation matches the table, so cost matching uses the right provider.
