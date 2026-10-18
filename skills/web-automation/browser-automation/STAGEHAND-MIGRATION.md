# The determinism spectrum and migrating browser-use to Stagehand

**Contents:** [The principle](#the-principle) · [The spectrum](#the-spectrum) · [Deterministic runs](#deterministic-runs) · [Migration workflow](#migration-workflow) · [API mapping](#api-mapping) · [Gaps to flag](#gaps-to-flag) · [Trace-assisted migration](#trace-assisted-migration) · [Prove it](#prove-it)

## The principle

An agentic-by-default loop, where the model decides every action on every run, is fine for demos and exploration and becomes expensive, flaky and undebuggable in production. Use AI only where the page is genuinely unpredictable and make everything else deterministic. A migration is a refactor with judgment, not a transpile. The honest trade-off: decomposing costs more authoring up front.

This targets Stagehand v3 (checked against 3.6.x and browser-use 0.13.x). The live docs and the installed types win on any conflict; if the installed Stagehand major version is not 3, treat this as conceptual only.

## The spectrum

| Level | Surface | Use when | Cost |
|---|---|---|---|
| 1 Autonomous | `stagehand.agent().execute()` | Open-ended, unknown path, exploration | Highest, least deterministic |
| 2 Per-step AI | `act()`, `extract(instr, schema)` | Steps known, markup varies | One LLM call per step |
| 3 Observe then act | `observe()` then `act(action)` | A known, repeatable step | Replay makes no LLM call |
| 4 Self-heal and cache | `selfHeal`, `cacheDir`, `serverCache` | Production replay that tolerates DOM drift | Cheapest steady state |
| 5 Navigation | `page.goto`, `page.url()` | Known URL | No AI |

- **Decide per step:** a known URL is `goto`; reading structured data is `extract`, never a full agent; an on-page action that repeats is observed once, persisted and replayed; a truly open-ended job is an agent; anything else is `act`.
- **Split each natural-language task into its implied steps** and place each on the spectrum. "Go to the store, search, buy the cheapest" becomes `goto`, `act` search, `extract` prices and pick the minimum in plain code, `act` add to cart, and checkout through a persisted context.
- **Keep `agent()`** when the job is exploratory, the step count or order is unknown, it runs once, or it is the first lift-and-shift for parity. Then tighten it with `maxSteps`, `systemPrompt`, `executionModel` (a cheaper inner model) and `mode` (`"dom"` default, `"cua"` for visual pages).

## Deterministic runs

- **Settle with `waitForLoadState("domcontentloaded")` or `"load"`.** Avoid `"networkidle"`: it never fires on sites with continuous background traffic (Google, analytics, long-poll or websocket) and throws a 15 s timeout. Wait for a specific element when one matters.
- **Scope `extract` and `observe` with `selector`** (CSS or xpath, such as `//main`) to cut noise and cost.
- **Lock the viewport so cached selectors stay valid:** `page.setViewportSize(1280, 720)`, positional arguments in v3.
- **Pass `variables`** so different inputs share one cache entry and secrets stay out of prompts: the model sees a `%key%` token and the value is substituted locally.
- **Anchor prompts to visible UI labels,** not internal structure.
- **Loop over extracted lists in plain code.** Resolve relative links with `new URL(href, page.url()).toString()` (a bare relative `goto` throws `Cannot navigate to invalid URL`), and wrap each iteration in try/catch so one dead link doesn't abort the run.
- **Check caching:** `result.cacheStatus === "HIT"` or `"MISS"`. `cacheDir` is local; `serverCache` is Browserbase's (on by default, keyed by instruction, page and options).

## Migration workflow

1. **Get the source and gate the scope.** browser-use run as an MCP server (`uvx browser-use --mcp`) has no equivalent: out of scope. Embedded in an app: convert only the browser-use surface and keep the app's glue.
2. **Detect the variant:** legacy before 0.12 (`BrowserConfig`, `BrowserContext`, `Controller`), stable 0.12.x (`BrowserProfile`, `Tools`), the Rust beta 0.13.x only on a literal `browser_use.beta` import (`ChatBrowserUse` is not a beta tell). Normalize legacy names first.
3. **Inventory:** tasks, model, browser config, structured output, secrets, guardrails (`allowed_domains`, `max_steps`), custom actions, setup (`initial_actions`, secondary LLMs).
4. **Decide determinism per step** on the spectrum.
5. **Verify the API against the installed types,** then emit code.
6. **Write a migration summary:** variant, per-step choices, items needing human review, next step.
7. **Offer the trace-assisted path only if warranted,** and never run it without a go-ahead.

Validation checklist: AI methods on the Stagehand instance, not the page; the page from `context.pages()[0]`; a `"provider/model"` string with its matching key; zod in the dependencies (a peer dependency, v3 or v4); secrets through variables and env; `init()` and `close()` in `finally`; every step placed; the summary lists the review items.

Common mistakes: copying v2 syntax (`page.act()`, `stagehand.page`, `modelName` and `modelClientOptions`, `enableCaching`); translating every step to `act()`; defaulting everything to `agent()`; silently dropping `allowed_domains`; inventing options.

## API mapping

| browser-use | Stagehand v3 |
|---|---|
| `Agent(task, llm)` | Decompose; else `agent().execute({instruction, maxSteps})` |
| `ChatAnthropic(model=...)` | `model: "anthropic/..."` |
| `ChatBrowserUse()` | Pick a provider string |
| `output_model_schema` | `extract(instr, zod)` (a top-level `z.array` is allowed) |
| `Browser()` | `env: "LOCAL", localBrowserLaunchOptions: {headless, viewport}` |
| `cdp_url` on Browserbase | `env: "BROWSERBASE"`; Stagehand manages the session, apiKey and projectId default from env |
| `user_data_dir`, `storage_state` | A persistent context, `browserSettings.context: {id, persist: true}`: the biggest reliability win in most migrations |
| `sensitive_data` | `variables` |
| `initial_actions` | Plain code before the first AI call |
| `use_vision` | Agent `mode: "hybrid"` or `"cua"` versus `"dom"` |
| `page_extraction_llm` | `extract(..., {model})` |
| `planner_llm` | `agent({model, executionModel})` |
| `domSettleTimeoutMs` (v2) | `domSettleTimeout` |
| `enableCaching` (v2) | `cacheDir`, `serverCache` |

- **Structured output from an agent** needs `experimental: true` (otherwise `ExperimentalNotConfiguredError`; it also bypasses the managed API path) and a zod object (wrap arrays). Custom `tools` and MCP `integrations` sit behind the same gate. Recommended: run the agent without output, then a separate `extract`.
- **Custom actions:** a deterministic side effect becomes plain TypeScript; an agent capability becomes `agent({tools: {x: tool({description, inputSchema, execute})}})` with `ai@^5` (v4 emits `parameters` and fails the type check), or a plain object `{description, inputSchema, execute}`.
- **Don't let the model supply values the original read from the browser** (such as the current URL): use `inputSchema: z.object({})` and close over `page`.
- **MCP integrations in 3.6.0:** passing an MCP `Client` instance throws `TypeError: Converting circular structure to JSON` (the agent stringifies integrations for logging); URL-string integrations work. Close MCP clients in `finally`.
- **Output templates:** `package.json` with `@browserbasehq/stagehand ^3.0.0`, `dotenv ^16`, `zod ^3.25.0`, dev `tsx ^4`, `typescript ^5`; `.env` with `BROWSERBASE_API_KEY`, `BROWSERBASE_PROJECT_ID` and the provider key.

## Gaps to flag

- **`allowed_domains` has no equivalent:** there is no domain firewall. Mitigate with the system prompt, Browserbase proxy domain rules, or a `page.url()` host check before acting. When `allowed_domains` was a security boundary paired with `sensitive_data`, mark it "needs human review"; never drop it silently.
- **No direct mapping:** `use_thinking` and `flash_mode`, `max_actions_per_step`, per-action `domains=`, `terminates_sequence`, MCP `tool_filter` and `prefix`.
- **Long-lived mutable executors** become stateless `messages`; pause and resume map roughly to an `AbortSignal`.
- **Sync-over-async code becomes async.**
- **Vision intent is silently lost** if mapped to a text-only model.

## Trace-assisted migration

- **Run the original unmodified on Browserbase;** the only change is `cdp_url=session.connect_url`. Tag the session with `user_metadata` and keep recording on. Connect within about 5 minutes or the session terminates. Do not use session settings to evade bot detection. [owner safety policy]
- **Logs drive the rewrite, video is for eyeballing it.** The machine-readable trace is the Session Logs API (`bb.sessions.logs.list(id)`: CDP network, console and lifecycle, available after the run); the recording is H.264 or HLS video for human QA, not DOM events.
- **From the logs:** navigations become `goto` anchors; network calls show what mattered (maybe read an API response instead of scraping); console errors mark fragile spots.
- **Validate the rewrite against the baseline:** same navigations, end state and extracted data, reusing the same context and session parameters.
- **Use it** for one opaque giant task, a flaky script, a first rewrite that doesn't reproduce, or opaque auth and redirects; skip it for clear, simple scripts. It costs real LLM and browser money, so it is opt-in.
- **The recommended path:** lift and shift onto Browserbase, observe, rewrite incrementally, validate against the baseline, then harden (self-heal and caching, pinned models, scoped extracts, a locked viewport, `domcontentloaded`).

## Prove it

The migrated script reproduces the baseline's navigations, end state and extracted data; a second run reports `cacheStatus === "HIT"` on the replayed steps; the summary lists every step's place on the spectrum and every flagged gap, including any dropped `allowed_domains`.
