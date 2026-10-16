# RPC, AI and CLI

Three schema-driven modules inside the `effect` package: `effect/rpc` (one procedure contract shared by client and server, any transport), `effect/ai` (a provider-agnostic language model with tools, chat history and an MCP server) and `effect/cli` (typed commands, flags and arguments). Provider SDKs stay separate as `@effect/ai-*`. Beta-era examples use `effect/unstable/*` paths; those were removed in `4.0.0-rc.118`, so import from `effect/rpc`, `effect/ai` and `effect/cli`. The effect.website v4 docs have no pages for these; the official sources are the package's `LLMS.md`, `ai-docs/` and `MCP.md`.

**Contents:** [RPC](#rpc) · [AI: models and providers](#ai-models-and-providers) · [AI: generating](#ai-generating) · [AI: tools](#ai-tools) · [AI: chat and agent loops](#ai-chat-and-agent-loops) · [AI: other modules](#ai-other-modules) · [MCP server](#mcp-server) · [CLI](#cli) · [Porting from v3](#porting-from-v3) · [Anti-patterns](#anti-patterns) · [Prove it](#prove-it)

## RPC

- **An `Rpc` records tag, payload, success, error and defect schemas, middleware and annotations;** client and server read the same declaration, so the contract doesn't depend on the transport.
- **`Rpc.make(tag, { payload?, success?, error?, stream?, primaryKey? })`.** Payload is a schema or struct fields: `Rpc.make("Increment", { payload: { amount: Schema.Int }, success: Schema.Int })`. `stream: true` wraps success and error in a stream schema and sets the normal error to `Schema.Never`. `primaryKey` derives a payload class with a primary key from the payload value.
- **Handler wrappers:** `Rpc.fork` runs a handler concurrently regardless of the server concurrency setting; `Rpc.uninterruptible` runs it uninterruptibly. `Rpc.custom<...>(schemas => ...)` builds custom constructors (for example a paginated one wrapping `success` in `{ offset, total, results }`).
- **`RpcGroup.make(...rpcs)`** with `add`, `merge`, `omit`, `middleware` (applies to the procedures added so far), `prefix`, `toHandlers`, `toLayer(handlers | Effect<handlers>)`, `of`, `toLayerHandler(tag, handler)`, `accessHandler`, `annotate`.
- **Server:** `RpcServer.layer(group, { disableTracing?, spanPrefix?, spanAttributes?, concurrency?: number | "unbounded", disableFatalDefects? })` starts a server on the current `Protocol`; it requires `Protocol | Rpc.ToHandler | Rpc.Middleware | Rpc.ServicesServer`. `RpcServer.layerHttp` registers a route on `HttpRouter`, websockets by default, HTTP if configured. Protocols: `layerProtocolHttp` (HTTP POST), `layerProtocolWebsocket`, `layerProtocolSocketServer`, `layerProtocolStdio`, `layerProtocolWorkerRunner`; also `toHttpEffect`, `toHttpEffectWebsocket`.
- **Client:** `RpcClient.make(group)` uses the current client `Protocol`. Protocols: `layerProtocolHttp` (over `HttpClient`, to the configured URL, optionally transforming the client), `layerProtocolSocket` (`pingInterval` defaults to 5 seconds, `pingTimeout` to the interval, `retryPolicy` for retries after socket errors), `layerProtocolWorker`. Headers: `RpcClient.withHeaders`, `CurrentHeaders`.
- **RPC over HTTP end to end; both sides must share `RpcSerialization.RpcSerialization`:**

```ts
// server
RpcServer.layerHttp({ group: Rpcs, path: "/rpc", protocol: "http" }).pipe(
  Layer.provide(Handlers),
  Layer.provide(layerSerialization)
)

// client
RpcClient.make(Rpcs).pipe(
  Effect.provide(RpcClient.layerProtocolHttp({ url: "http://test/rpc" }).pipe(
    Layer.provide(layerSerialization),
    Layer.provide(HttpClientLayer) // any HttpClient layer
  ))
)
```

- **Serialization:** `json`, `ndjson`, `jsonRpc`, `ndJsonRpc`, SchemaBinary; layers `layerJson`, `layerNdjson`, `layerNdjsonWith`, `layerJsonRpc`, `layerNdJsonRpc`, `layerSchemaBinary`; error `MaxBufferSizeExceeded`. There is no MessagePack serializer; a beta recap mentions `makeMsgPack`, but it was removed.
- **Middleware:** `RpcMiddleware.Service` creates a typed middleware class with optional requirements, provided services, error schema and client-side requirement metadata; `RpcMiddleware.layerClient` provides the client side.
- **Test without transport:** `RpcTest.makeClient(group)` connects a client straight to the group's handlers, with no HTTP, socket, worker or serializer.
- **Workers:** `RpcWorker.InitialMessage` / `layerInitialMessage` send one schema-encoded value before normal requests. Transports `NodeSocket`, `NodeSocketServer`, `NodeWorker`, `NodeWorkerRunner` (and Bun and browser equivalents) live in the platform packages.
- **Entities and workflows build on `Rpc`** (PLATFORM.md).

## AI: models and providers

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

- **`EmbeddingModel`** turns text into vectors; single `embed` calls can be batched internally.
- **`Tokenizer`** counts prompt tokens and shortens a prompt to a limit, keeping the newest messages that fit. **`Telemetry`** adds OpenTelemetry `gen_ai.*` attributes.
- **`Decision` / `DecisionModel`:** `decide` encodes one input as JSON, sends its named decisions in one provider call and validates the answers. Cloudflare: `CloudflareDecisionModel.layer({ model: "clef-flash" }).pipe(Layer.provide(CloudflareClient.layerConfig()), Layer.provide(FetchHttpClient.layer))`. TypeSafe: `TypeSafeClient.layerConfig()` reads `TYPESAFE_API_KEY`, model `TypeSafeDecisionModel.model("jev-latest")`. Neither client retries automatically.

## MCP server

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

## CLI

- **Imports:** `import { Argument, Command, Flag } from "effect/cli"`, runtime `import { NodeRuntime, NodeServices } from "@effect/platform-node"`.
- **Flags:** `Flag.String("workspace").pipe(Flag.withAlias("w"), Flag.withDescription("Workspace to operate on"), Flag.withDefault("personal"))`, `Flag.Boolean("verbose")`, `Flag.Literals("priority", ["low", "normal", "high"])`; `Flag.optional` yields an `Option`. Define flags outside commands to reuse them.
- **Arguments:** `Argument.String("title").pipe(Argument.withDescription("Task title"), Argument.withSchema(Schema.NonEmptyString))`. Flags and arguments parse plain strings; `withSchema` (also `Flag.withSchema(Email)`) validates or transforms at parse time, so handlers only see valid input.
- **Commands:** `Command.make("create", { title, priority, assignee }, Effect.fn(function*({ assignee, priority, title }) { ... }))`, with `Command.withDescription`, `Command.withAlias("ls")`, `Command.withExamples([{ command, description }])`.
- **Share parent flags explicitly:** `Command.make("tasks").pipe(Command.withSharedFlags({ workspace, verbose }), ...)`. A subcommand reads them by yielding the parent: `const root = yield* tasks; root.verbose`.
- **Run, providing the target platform's services:**

```ts
tasks.pipe(
  Command.withSubcommands([create, list]),
  Command.run({ version: "1.0.0" }),
  Effect.provide(NodeServices.layer),
  NodeRuntime.runMain
)
```

- **Other modules:** CliConfig, CliError, CliOutput, Completions, GlobalFlag, HelpDoc, Param, Primitive, Prompt.

## Porting from v3

- **`@effect/rpc`, `@effect/ai`, `@effect/cli`** are now `effect/rpc`, `effect/ai`, `effect/cli`.
- **RPC:** `RpcServer.layerHttpRouter` is `RpcServer.layerHttp` (an HTTP or WebSocket route on the v4 `HttpRouter`); `toHttpApp` is `toHttpEffect`; `RpcServer.toWebHandler` is gone, use `HttpRouter.toWebHandler(RpcServer.layerHttp(options).pipe(Layer.provide(options.layer)))`; `RpcServer.fiberIdClientInterrupt` is `RpcSchema.ClientAbort` (a Cause annotation); MessagePack serialization is gone, use `layerSchemaBinary` or `layerNdjson`.
- **CLI:** `Options` is `Flag`, `Args` is `Argument`; `Options.all` / `Args.all` become the config record passed to `Command.make`; `CliApp` is folded into the runnable `Command` tree, with `version` passed to `Command.run`.

## Anti-patterns

- **Importing from `effect/unstable/*`** or the v3 `@effect/rpc`, `@effect/ai`, `@effect/cli` packages.
- **Giving client and server different `RpcSerialization` layers.**
- **Forgetting the toolkit handler layer,** so tool calls have nothing to run.
- **Logging to stdout from a stdio MCP server.**
- **Validating CLI input in the handler** instead of with `withSchema` at parse time.

## Prove it

RPC: an `RpcTest.makeClient(group)` test calls every procedure, and the HTTP setup round-trips with one shared serialization layer. AI: a tool call shows up in `response.toolCalls` and its result in `response.toolResults`, and `AiError` maps to your own error. MCP: the stdio server starts with nothing but protocol messages on stdout. CLI: input a `withSchema` rejects (an empty title) fails at parse time, before the handler runs.
