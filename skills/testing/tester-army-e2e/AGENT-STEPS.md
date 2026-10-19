# Agent steps

An agentic runner lets a model drive one goal through the app while the test pins the outcome with an exact check. The model never runs code: the runner validates and authorizes every tool call it proposes. What follows is the `e2e` runner's agent layer (`agent.act`, `assert`, `waitFor`, `extract`, the replay cache); the goal-splitting rules are in WRITING-TESTS.md. [tester-army/e2e, agent steps]

## How a call runs

- **Each call is one bounded invocation:** a fresh redacted observation, a deadline, a model-call budget, no shared transcript. No agent step means no model calls.
- **What the model sees:** a redacted snapshot (roles, names, text, states), prior-step summaries and the context. Never raw HTML, cookies, headers, environment or secret values; passwords are masked. Nothing the model returns runs as code or selectors.
- **Tool verbs the agent has:** `observe`, `tap`, `double_tap`, `long_press`, `right_click`, `hover`, `type`, `press` (`times` up to 20), `select`, `check` (sets a state, does not flip it), `scroll`, `scroll_to`, `drag`, `upload` (project-root files only; outside or hidden files like `.env` are `POLICY_DENIED`), `navigate`, `back`, `type_secret`, `screenshot`, the point tools `tap_at` / `hover_at` / `press_at` / `select_at` / `type_at`, `dismiss_keyboard`.
- **On touch screens a tap that closed the keyboard was often spent:** act again.

## act

- **Options:** `params` (wrap run-unique values in `unique(\`E2E ${Date.now()}\`)` so the cache keeps working), `timeout`, `maxSteps` (default 25 actions), `maxModelCalls` (default 25); both budgets may only be lowered. `act` takes no `schema` or `vision`.
- **Result:** `summary`, `modelCalls`, `actions`, `cache`.
- **Failure codes (`AgentError.code`):**

| Code | Meaning |
|---|---|
| `ACTION_FAILED` | product failure |
| `STEP_BUDGET_EXHAUSTED`, `STEP_TIMEOUT`, `CONTEXT_OVERFLOW` | out of room |
| `AUTH_CREDENTIAL_UNAVAILABLE`, `AUTH_CREDENTIAL_INVALID`, `SECRET_UNAVAILABLE`, `ENVIRONMENT_UNAVAILABLE`, `SEED_DATA_MISSING`, `TEST_SETUP_FAILED`, `AUTOMATION_UNSUPPORTED`, `POLICY_DENIED` | blocked from outside |
| `MODEL_OUTPUT_INVALID` | unusable answer |

## Judgments

- **`assert`** does not poll: 2 model calls, 30 s. False is `ASSERTION_FAILED`; too little on screen is `ASSERTION_INCONCLUSIVE`, also a failure.
- **`waitFor`** judges every interval (default 3 s, timeout default 30 s), and only when the screen changed.
- **`extract({ schema })`:** the model sees the shape, not the value rules. Missing data is `ASSERTION_INCONCLUSIVE`, never `""` or `0`; accept absence with `.nullable()` plus asking for it.
- **Judgments see the current screen only.** One repair round, then `MODEL_OUTPUT_INVALID`.
- **A value shown in more than one place must agree everywhere** or the judgment fails; name the one you mean (`'the order summary total is $42.00'`).
- **Judge the fact and put a deterministic `expect` beside it;** an agent judgment asserting exact phrasing flakes.
- **`vision`:** `false` the tree (default); `true` the tree plus a masked screenshot; `'only'` the screenshot alone, for overlays, broken layout and charts. `'only'` never falls back.

| Call | Budget |
|---|---|
| `act` | up to 25 model calls, 120 s |
| `assert` | 2 calls, 30 s |
| `extract` | 2 calls, 30 s |
| `waitFor` | up to 25 calls, 30 s |

## Shaping a step that fails

- **Order:** tighten the goal, then the context, then the agent (its system prompt), then tools, then the model and its options.
- **Agents config keys:** `model`, `judge`, `system`, `context`, `tools`, `maxSteps`, `maxModelCalls`, `judgmentTimeout`, `maxObservationBytes`, `maxInputTokens`, `providerOptions`, `executor`. None inherits from `default`. `model` drives `act`; judgments use `judge`, else `model`. `context` is app vocabulary sent to every call, judges included; `system` is how the acting agent works, act loop only.
- **Choosing an agent:** `--agent buyer` on the CLI; `{ agent: 'buyer' }` pins a test; a list runs once per agent; a per-call override wins. Personas are an agent plus a `session` in a `describe` repeated per persona.
- **Custom tools:** `defineTool(tool({...}), { mutates: true })` from `e2e/agent`; `createToolLoopExecutor`; or any `StepExecutor` `{ name, version?, cache?, runStep(ctx) }`. Setting `system` or `tools` beside `executor` is `INVALID_CONFIG`.
- **Inspect:** `--debug` prints a step table (duration, calls, tokens, cache share, cost) and transcripts; `--ai-trace` writes `.e2e/ai-trace.json`, read with `npx unbox-ai runs .e2e/ai-trace.json` and `npx unbox-ai summary ... --run 0`. Never read the trace file directly (megabytes). `--no-cache` traces the whole flow.

## The replay cache

- **A passing `act` saves its actions once a later verification passes;** the next run replays them without model calls, and the live agent takes over when the screen no longer matches. `assert`, `waitFor` and `extract` are never cached.
- **Verifications that confirm a recording:** a locator or engine `expect` matcher, `locator.waitFor`, `browser.waitForURL`, `agent.assert`, `agent.waitFor`. Not: a plain-value `expect`, `expect.poll`, `agent.extract`, another `act`, or the attempt passing. So an unchecked `act` never replays.
- **Replay needs the recorded route.** It re-finds controls by role, name, test id, placeholder, input purpose and named row; it passes alone only when the end route matches, and otherwise hands off. `step.cache.reason` says why: `no-entry`, `wrong-context`, `target-not-found`, `target-ambiguous`, `end-mismatch`, ...; `notRecorded: param-collision`.
- **Modes:** read-write by default, read-only in CI, off with `--no-cache` or `cache: 'off'`. Entries live in `.e2e/cache/`, one file per key digest; `E2E_CACHE_DIR` or `--cache-dir` shares them across worktrees. `e2e cache ls|stats|clear`.
- **Eviction:** a failing run evicts the entries it implicates; cancelled runs and `MODEL_PROVIDER_FAILED` / `MODEL_UNAVAILABLE` evict nothing.
- **Share replays with CI by committing `.e2e/cache/`.** `--strict-cache` fails a stale recording with `REPLAY_STALE` instead of quietly spending model calls; re-record read-write without the flag, and commit.

## Choosing a model

- **Any AI SDK provider with tool calls and LM spec v2+** works; `@ai-sdk/openai-compatible` covers `/v1/chat/completions` endpoints. Pass a model instance, not a string (`INVALID_CONFIG`). Keep `ai@^7` with any provider.
- **Auth options** (`npx e2e models [provider]` lists ids; use API keys in CI):

| Choice | Setup |
|---|---|
| ChatGPT Plus/Pro | `npx e2e login openai`; `model: chatgpt('<id>')` from `e2e/oauth/chatgpt` |
| GitHub Copilot | `npx e2e login github-copilot`; `copilot('<id>')` from `e2e/oauth/copilot`. Copilot Free serves by auto-selection only, so an id is usually refused (`MODEL_UNAVAILABLE`) |
| OpenCode Console | `npx e2e login opencode-console`; a bare id is Zen, a `go/` id the Go subscription; CI uses `OPENCODE_API_KEY` |
| SuperGrok / X Premium+ | `npx e2e login spacexai` |
| Claude Max/Team | no login: link the Claude Console org, create an API key, set `ANTHROPIC_API_KEY`, use `anthropic('<id>')` from `@ai-sdk/anthropic` |
| Vercel AI Gateway | `AI_GATEWAY_API_KEY`, or the Vercel CLI plus `npx vercel link` (OIDC) |
| OpenRouter | `OPENROUTER_API_KEY` |
| Local endpoint | URL, model, and a key if required |

- **A decision-model executor** is an option: [DECISION-EXECUTOR.md](DECISION-EXECUTOR.md) owns its two model roles, narrower AI SDK requirement, completion checks, gates and limitations. [tester-army/e2e, docs/decision-models.mdx]

## Prove it

Run the file with `--debug`: every `act` is followed by a confirming verification, so the second run shows its steps replayed with zero model calls; with `--strict-cache` in CI no step reports `REPLAY_STALE`; and the step table shows each call inside its budget.
