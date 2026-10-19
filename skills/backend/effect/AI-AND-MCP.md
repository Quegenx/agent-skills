# Effect AI and MCP

Effect v4 package guidance from the shipped `LLMS.md` and `ai-docs/`; MCP also uses `MCP.md`. These modules remain unstable. The effect.website v4 docs have no pages for these modules. The [setup guide](SETUP.md#v4-module-paths) owns the removed beta/v3 import paths.

## AI: models and providers

[Effect v4 package, LLMS.md and ai-docs/; MCP.md]

- **Providers:** `@effect/ai-anthropic` (typed client, language model layers, tools, telemetry), `@effect/ai-openai` (language and embedding model layers, tools, telemetry), `@effect/ai-openrouter`, `@effect/ai-openai-compat` (any OpenAI-compatible API: chat completions and embeddings), `@effect/ai-cloudflare`, `@effect/ai-typesafe`.
- **Build the provider client from Config; it needs an `HttpClient`:**

```ts
const AnthropicClientLayer = AnthropicClient.layerConfig({
  apiKey: Config.Redacted("ANTHROPIC_API_KEY")
}).pipe(
  // Providers typically require an HttpClient, but you can choose which one to use.
  Layer.provide(FetchHttpClient.layer)
)
```

- **Pick a model with `.model(...)`,** which returns a Layer for `Effect.provide`: `OpenAiLanguageModel.model("gpt-4.1")`, `AnthropicLanguageModel.model("claude-opus-4-6")`. Inside a service layer, `yield* OpenAiLanguageModel.model("gpt-4.1").captureRequirements` moves the model's requirements (the provider client) into the enclosing layer's requirements.
- **Fall back across providers with an `ExecutionPlan`:**

```ts
const DraftPlan = ExecutionPlan.make(
  { provide: OpenAiLanguageModel.model("gpt-5.2"), attempts: 3 },
  { provide: AnthropicLanguageModel.model("claude-opus-4-6"), attempts: 2 }
)
const draftsModel = yield* DraftPlan.captureRequirements
// ...effect.pipe(Effect.withExecutionPlan(draftsModel))
```

- **`Model`** is usable anywhere its Layer is, and puts `Model.ProviderName` and `Model.ModelName` in context.

## AI: generating

[Effect v4 package, LLMS.md and ai-docs/; MCP.md]

- **Text:**

```ts
const model = yield* LanguageModel.LanguageModel
const provider = yield* Model.ProviderName
const response = yield* model.generateText({ prompt })
// response.text, response.finishReason, response.usage.outputTokens.total
```

- **Structured output** is validated and decoded through the schema: `model.generateObject({ objectName: "launch_plan", prompt, schema: LaunchPlan })`, then `response.value`.
- **Streaming:**

```ts
LanguageModel.streamText({ prompt }).pipe(
  Stream.filter((part): part is Response.TextDeltaPart => part.type === "text-delta"),
  Stream.map((part) => part.delta),
  Stream.provide(launchPlanModel),
  Stream.mapError(...)
)
```

- **Errors:** `AiError.AiError` carries a `reason`; `AiError.AiErrorReason` is a Schema, so put it in your own error: `Schema.TaggedError<AiWriterError>()("AiWriterError", { reason: AiError.AiErrorReason })`, and map with `Effect.catchTag("AiError", (error) => Effect.fail(new AiWriterError({ reason: error.reason })), (e) => Effect.die(e))`. Reasons cover transport problems, provider responses, rate limits, authentication, content policy, invalid requests, invalid output, unsupported schemas, tool failures, invalid user input and unknown failures.

## AI: tools

[Effect v4 package, LLMS.md and ai-docs/; MCP.md]

- **Define a tool:**

```ts
const SearchProducts = Tool.make("SearchProducts", {
  description: "...",            // shown to the model to decide when to call it
  parameters: Schema.Struct({
    query: Schema.String.annotate({ description: "..." }),
    maxResults: Schema.Natural.pipe(Schema.withDecodingDefault(Effect.succeed(10)))
  }),
  success: Schema.Array(Product),
  failureMode: "error"
})
```

  `failureMode: "error"` (the default) puts handler errors in the calling effect's error channel; `"return"` captures them in the tool call result. A tool may have no parameters (`Tool.make("GetCurrentTime", { description, success: Schema.Number })`); use `EmptyParams` when an explicit empty object schema is needed. `needsApproval?: boolean | NeedsApprovalFunction` requires approval before execution.
- **Group tools and implement handlers:** `const ProductToolkit = Toolkit.make(SearchProducts, GetInventory)`, then `ProductToolkit.toLayer(Effect.gen(function*() { return ProductToolkit.of({ SearchProducts: Effect.fn(...)(function*({ query, maxResults }) { ... }), ... }) }))`. Each handler gets decoded parameters and returns an Effect of the success type. Get the toolkit with `const toolkit = yield* ProductToolkit`.
- **Call with tools:** `LanguageModel.generateText({ prompt: question, toolkit, toolChoice: "required" })`; the framework resolves parameters, runs handlers and feeds results back. `toolChoice` defaults to `"auto"`. Inspect `response.toolCalls` (`name`, `id`, decoded params) and `response.toolResults` (`name`, `id`, result, `isFailure`).
- **Provide the handler layer** (`Layer.provide(ProductToolkitLayer)`) along with the provider client, or the model's tool calls can't run.
- **Provider-defined tools** run server-side and need no handler: `OpenAiTool.WebSearch({ search_context_size: "medium" })` merged into `Toolkit.make(SearchProducts, GetInventory, webSearch)`; only handler tools appear in `toLayer`. Generic form: `Tool.providerDefined`.
- **Runtime-discovered tools** (such as MCP tools): `Tool.dynamic(name, { parameters })`; with a JSON Schema `parameters`, the handler receives `unknown` and nothing is validated.
- **Toolkit execution** validates parameters, runs the handler, encodes the result, supports preliminary streamed results and applies the failure mode.

## AI: chat and agent loops

[Effect v4 package, LLMS.md and ai-docs/; MCP.md]

- **`Chat` keeps `Prompt` history in a `Ref`** and appends response parts. Start with `Chat.empty`, `Chat.fromPrompt(Prompt.empty.pipe(Prompt.setSystem("...")))` or `Chat.fromPrompt([{ role: "system", content }, { role: "user", content }])`. Persist with `session.exportJson` and `Chat.fromJson(json)`, or `Chat.makePersisted` / `Chat.layerPersisted`; also `Chat.fromExport`.
- **Each turn** is `session.generateText({ prompt: message }).pipe(Effect.provide(modelLayer))`; turns can use different models. Read history with `Ref.get(session.history)`.
- **Agent loop;** the Chat adds tool results to history before the next turn:

```ts
while (true) {
  const response = yield* session.generateText({ prompt: [], toolkit: tools }).pipe(Effect.provide(modelLayer))
  if (response.toolCalls.length > 0) continue
  return response.text
}
```

- **`Prompt`** is an ordered list of system, user, assistant and tool messages with text, file, reasoning, tool call, tool result and approval parts.

## AI: other modules

[Effect v4 package, LLMS.md and ai-docs/; MCP.md]

- **`EmbeddingModel`** turns text into vectors; single `embed` calls can be batched internally.
- **`Tokenizer`** counts prompt tokens and shortens a prompt to a limit, keeping the newest messages that fit. **`Telemetry`** adds OpenTelemetry `gen_ai.*` attributes.
- **`Decision` / `DecisionModel`:** `decide` encodes one input as JSON, sends its named decisions in one provider call and validates the answers. Cloudflare: `CloudflareDecisionModel.layer({ model: "clef-flash" }).pipe(Layer.provide(CloudflareClient.layerConfig()), Layer.provide(FetchHttpClient.layer))`. TypeSafe: `TypeSafeClient.layerConfig()` reads `TYPESAFE_API_KEY`, model `TypeSafeDecisionModel.model("jev-latest")`. Neither client retries automatically.

## MCP server

[Effect v4 package, LLMS.md and ai-docs/; MCP.md]

```ts
const ServerLayer = Layer.mergeAll(
  DemoResource,
  DemoPrompt,
  McpServer.toolkit(MyToolkit).pipe(
    Layer.provideMerge(MyToolkit.toLayer({ DemoTool: ({ message }) => Effect.succeed(`Echo: ${message}`) }))
  )
).pipe(
  Layer.provide(McpServer.layerStdio({ name: "Demo MCP Server", version: "1.0.0", protocols: [McpProtocol.v2025_06_18] })),
  Layer.provide(NodeStdio.layer),
  Layer.provide(Logger.layer([Logger.consolePretty()])),
  Layer.provideMerge(Layer.succeed(Logger.LogToStderr, true))
)
Layer.launch(ServerLayer).pipe(NodeRuntime.runMain)
```

- **Send logs to stderr over stdio;** anything on stdout corrupts the protocol.
- **Resources:** `McpServer.resource({ uri, name, description?, mimeType?, content })`, or the template form `` McpServer.resource`file://path/to/file/${idParam}`({ ..., completion, content: Effect.fn(function*(_uri, id) { ... }), audience: ["assistant", "user"] }) `` with `McpSchema.param("id", Schema.NumberFromString)`.
- **Prompts:** `McpServer.prompt({ name, description, parameters, completion, content })`. **Tools:** `McpServer.toolkit(toolkit)`. **Elicitation:** `McpServer.elicit({ message, schema })`, handling `Effect.catchTag("ElicitationDeclined", ...)`.
- **Protocols:** `McpProtocol.v2024_11_05`, `v2025_03_26`, `v2025_06_18`. The ordered, non-empty `protocols` list names implemented adapters, not arbitrary version strings. `v2024_11_05` does not implement the old two-endpoint HTTP+SSE transport. `McpServer.layerHttp` is the HTTP alternative to `layerStdio`.

## Anti-patterns

[Effect v4 package, LLMS.md and ai-docs/; MCP.md]

- **Forgetting the toolkit handler layer,** so tool calls have nothing to run.
- **Logging to stdout from a stdio MCP server.**

## Prove it

[Effect v4 package, LLMS.md and ai-docs/; MCP.md]

AI: a tool call shows up in `response.toolCalls` and its result in `response.toolResults`, and `AiError` maps to your own error. MCP: the stdio server starts with nothing but protocol messages on stdout.
