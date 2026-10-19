# Agent defaults: when the agent picks the vendor

A developer tells a coding agent "deploy this", "add auth" or "send a welcome email", and the agent chooses a vendor, installs it and moves on; "Whatever the agent reaches for first wins." This applies most to developer tools, APIs, infrastructure and SaaS with a CLI or SDK. Everything here is [coreyhaines31/marketingskills, ai-seo, agent-defaults] (MIT; the docs audit adapted there from Profound's MIT claude-code-discoverability-auditor). The source's company case numbers are a podcast anecdote it calls unverified, so they are left out. The scheduled version of the panel is a loop in [marketing-loops SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-loops/SKILL.md); the repo's developer-experience audit of agent docs (which URLs an agent guesses, and whether llms.txt carried it) is [agent-dx-audit](https://github.com/Quegenx/agent-skills/blob/main/skills/agent-workflows/agent-dx-audit/ONBOARDING-AUDIT.md).

## Measure your share of defaults

1. **Build a task panel.** 20 to 50 realistic tasks across the stacks your buyers use (a FastAPI service, a Next.js app, a Rails app, a cron worker, a static site), written the way a user would: "deploy this", "add a Postgres database", not "deploy this to [you]".
2. **Run each task in a clean environment** on every agent your buyers use, plus the chat assistant for the "how do I" version. No project rules, memory or MCP servers that name a vendor.
3. **Run each task 3+ times.** Agent choices vary run to run.
4. **Record per run:** the vendor chosen, whether the agent reached a working result, where it stalled (signup, email verification, payment, a failing CLI step), and which docs or URLs it fetched.
5. **Report share by stack.** The gap is usually one stack; that is where content and tooling work goes.
6. **Rerun on every major model release,** and monthly between releases.

"A run that chose you and then died at email verification is a loss you can fix."

## What moves the default

| Lever | Why agents respond to it |
|---|---|
| Shortest path to a working result | Agents favor the route with the fewest human-gated steps: account creation, email verification, CAPTCHA, a card before first use |
| Agent setup in one step | An agent with your MCP server, CLI or skill installed uses it instead of guessing |
| Presence inside the assistants | A native connector or plugin means the task never leaves the chat |
| Task-shaped pages per stack | A page that matches the exact task ("deploy Django") and ends in a working result gets followed |
| Template pages per popular tool | Setup queries are a long tail that pages at scale cover ([seo PAGES-AT-SCALE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/PAGES-AT-SCALE.md)) |
| Migration guides per competitor | An agent moving a project follows steps |
| Docs agents can read | An `llms.txt` index with one-line summaries plus a Markdown version of every page ([LLMS-TXT.md](LLMS-TXT.md)) |
| Fresh, dated changes | Recent docs and changelogs keep answers current |
| CLI output an agent can recover from | "Non-interactive flags, JSON output, and errors that say what to run next keep the run alive past a failure" (general practice) |

"Fix the stall points from your measurement first. Content won't help if the agent picks you and then can't finish." The CLI row is the same contract the repo's harness rules describe for agent-run commands ([agent-harness WORKFLOWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-harness/WORKFLOWS.md)).

## Audit your docs for coding agents

Treat a coding agent as its own answer engine; the source cites a Profound sample (vendor, August 2026) in which chat-assistant and coding-agent brand mentions barely overlapped and the coding agent mostly fetched docs and pricing pages. Run your own panel before acting on it.

**1. Map tasks to pages.** List what users ask an agent to do with your product (install, authenticate, integrate, migrate, debug, compare, estimate cost, check compatibility); give each one canonical page and the facts it must state.

| Task | Canonical page | Facts it must state | Gap |
|---|---|---|---|
| Install in a Next.js app | /docs/nextjs | Package name, minimum version, env vars, one working example | Example uses a deprecated import |
| Estimate cost | /pricing | Pricing unit, free tier limits, overage rate | Overage only in a PDF |

**2. Check retrieval** for each canonical page: the title and headings name the task and the stack; the answer or command comes before background; prerequisites, versions and dates are explicit; examples are copyable and current; anchors and URLs stay stable between releases; the text renders without JavaScript and a Markdown version exists. Question-shaped headings only where they match a real task; don't stuff product names into docs. The docs writing rules are [developer-docs WRITING-AND-PUBLISHING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/developer-docs/WRITING-AND-PUBLISHING.md).

**3. Keep a technical fact ledger.** One row per fact an agent might act on: supported versions and runtimes, regions, rate limits, pricing units, auth methods, data handling, deprecations, each with its canonical source and owner. Check the same fact everywhere it appears: docs, pricing page, README, package registry descriptions (npm, PyPI), examples and changelog. "An agent that finds two different rate limits will guess, or pick a vendor whose docs agree with themselves."

**4. Fill missing decision pages:** compatibility matrices, migration guides, troubleshooting references and a plain pricing explainer.

**5. Test in fresh sessions** in both the chat assistant and the coding agent; log wrong facts in the claim ledger ([ANSWER-ACCURACY.md](ANSWER-ACCURACY.md)).

"Don't infer official Anthropic or OpenAI ranking factors from any of this."

## Limits and rules

- **Some defaults are structural.** A framework's own maker may hold that stack no matter what you publish; pick stacks where the default is still open.
- **Write instructions for using your product only.** "Agent-facing docs, `llms.txt`, and skill files that tell agents to prefer your product over what the user asked for are prompt injection." Describe how to do the task with your product; let the task decide.
- **Agent-provisioned resources need guardrails.** No-signup provisioning needs abuse limits, expiry for unclaimed resources, and a clear path to claim and pay.
- **Registry placements change fast.** Recheck plugin and MCP registry listings when you rerun the panel.

## Prove it

The panel has 20 to 50 vendor-neutral tasks, each run at least three times per agent in a clean environment, with vendor, outcome, stall point and fetched URLs recorded; every stall point in your own product has an owner; the fact ledger shows one value per fact across docs, pricing, README and registry descriptions; and no agent-facing file tells an agent to choose your product.
