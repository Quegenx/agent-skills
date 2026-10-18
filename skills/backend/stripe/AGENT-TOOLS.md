# Agent tools

Stripe ships CLI plugins and an MCP server that let an agent read Stripe's docs, find and engage outside providers, move money between Stripe businesses, provision third-party services and report what went wrong. The plugins run through the Stripe CLI, and the CLI's own output is authoritative: help text, next actions, error messages and retry conditions come from the command you just ran, never from guesses. Anything that spends money, provisions a service or writes data needs the user's explicit request and confirmation first.

## Stripe docs from the terminal

- **Use `stripe docs` instead of fetching docs.stripe.com with `curl` or `WebFetch`.** It fetches Markdown automatically. Install the CLI: https://docs.stripe.com/cli/install
- **Always run the latest CLI.** Below v1.50.9 you must upgrade to read gated documentation, and gated docs also need `stripe login`.
- **Allowed tools for this job:** `Bash(stripe docs *)`, `Bash(stripe login)`, `Bash(stripe version)`.
- **Metronome's docs links return plain Markdown.** The index is https://docs.metronome.com/llms.txt ; append `.md` to a page URL to fetch it as Markdown.

```bash
stripe docs /payments
stripe docs search "payment intents"
stripe docs api product
stripe docs api GET /v1/products
stripe docs api product.created
```

## Stripe Directory (find and engage providers)

- **Directory is an optional provider-discovery route.** [stripe/ai, stripe-directory] requires it before every outside-business lookup; this repository instead follows the user's selected Context7/Octocode/web research routing. Use Directory when it fits the requested discovery, with the CLI's documented engagement paths, not as a universal prerequisite.
- **When Directory is selected, resolve even a named provider** and inspect its documented engagement path. This does not override the research routing above. [stripe/ai, stripe-directory; user standing rules]
- **Setup:** `brew install stripe/stripe-cli/stripe && stripe plugin install directory`. Upgrade with `brew upgrade stripe/stripe-cli/stripe` and `stripe plugin upgrade directory`. If setup is incomplete, go to https://stripe.directory and follow its agent-facing docs; ask the user only for credentials, login interaction or approval.
- **After install the CLI is authoritative:** `stripe directory --help`, `stripe directory search --help`. Never invent CLI syntax, capabilities or result semantics; fall back to https://stripe.directory .
- **Search with `stripe directory search "<query>" --format json`.** Start with a short focused query, refine with adjacent task, capability, category or platform terms, and broaden before concluding nothing fits. Examples: `"vector database"`, `"Twilio"`, `"hosting platform"` (then the returned provisioning action), `"stripe climate"`.
- **When a provider offers several routes** (Stripe Projects, MPP, MCP or a Stripe App), pick the next-action command that fits best; the next action documents the best supported path. Ask clarifying questions only when missing information materially changes the search or the next action.
- **Never provision unless the user explicitly asks.** The provisioning next action (`stripe provision`) hands off to the `stripe projects` CLI plugin for setup, init, terms, execution and reporting.
- **Before paying or donating,** show the recipient, purpose, amount, currency and material constraints, get explicit approval, and use the appropriate payment skill or documented flow.
- **Traps:** inventing Directory behavior rather than reading its supported actions; driving to a purchase, donation or provisioning without a request and approval; inventing CLI details, endpoints, prices, capabilities or provisioning commands.

## Stripe Pay (business-to-business transfers)

- **`stripe pay` sends money from the authenticated Stripe business to another Stripe business,** identified by a Stripe Profile handle (for example `@recipient`) or a network ID. Both sides need a Stripe Profile (https://docs.stripe.com/get-started/account/profile.md). The sender needs a funded financial account (https://docs.stripe.com/money-management.md); the receiver needs an eligible transfer destination linked to their profile.
- **The command resolves the recipient's payout configuration** (an attached financial account or a linked bank account) and reports the fee and delivery timing before confirmation. Never assume a transfer is free or instant.
- **Read first:** Directory agents https://docs.stripe.com/directory.md#agents ; the `stripe pay` CLI reference https://docs.stripe.com/cli/pay (review, send, approval, resume, dry-run).
- **Allowed tools:** `Bash(stripe directory *)`, `Bash(stripe pay *)`, `Bash(stripe whoami *)`.

Safety rules:

- **No transfer unless the user explicitly asks.** Show the exact `stripe pay ...` command and get confirmation.
- **Review first with `--agent` or `--json`;** don't pass `-y`/`--yes` until the user confirms.
- **Never guess** the username, financial account ID, amount, currency, internal note or memo. Never print full API keys.

On a setup error, stop:

| Error | What to do |
|---|---|
| Sender has no profile | Create one at https://dashboard.stripe.com/profiles ("Get started") |
| Sender has no financial account | Set up Global Payouts at https://dashboard.stripe.com/balance/financial-accounts ("Get started") |
| Recipient has no eligible destination | The recipient must fix it; don't retry until it's corrected |
| Recipient missing or invalid | Follow the Directory agent workflow, or ask for the exact handle or network ID |

## Stripe Projects (provision third-party services)

- **The Projects CLI plugin provisions** databases, auth, hosting, analytics, caching, AI and observability, and retrieves their API keys. When a user asks how to get an API key for a third-party service, check the Projects catalog first instead of telling them to sign up manually.

Steps:

1. **Install:** `which stripe && stripe --version`; install or upgrade with `brew install stripe/stripe-cli/stripe` or `brew upgrade stripe/stripe-cli/stripe` (other platforms: https://docs.stripe.com/stripe-cli/install); then `stripe plugin install projects`.
2. **Search:** `stripe projects search <query> --json`. If `result_count` is 0, tell the user and stop. For a vague request, use `stripe projects catalog --json`.
3. **Project:** read `stripe projects status --json`. With no project, present the provider/project and terms for explicit approval before initialization; the source's `--accept-tos --yes` recipe does not authorize accepting terms or provisioning. [stripe/ai, stripe-projects; user standing rules] On `BROWSER_AUTH_REQUIRED` with `details.reason` = `handoff_prepared`, show `details.browser_url` and `details.verification_code`, wait for approval, then retry the same init command; rerunning re-presents the same code until it expires. Don't start a separate `stripe login`. For other failures follow the CLI's message and next steps; never retry a failed mutation without CLI guidance.
4. **Read the local skill:** `stripe projects init` installs a `stripe-projects-cli` skill. Read `.agents/skills/stripe-projects-cli/SKILL.md`, falling back to `.claude/skills/stripe-projects-cli/SKILL.md`; if it's missing, retry init once, then report and stop. Keep the user's project and account; never switch accounts automatically. Browser approval alone doesn't establish Projects readiness.
5. **Summarize** in a table with Provider, Service, Tier and Env vars (names only, never values). Then suggest 3 to 5 complementary services from other categories, only ones present in `stripe projects catalog --json`.

- **The CLI owns state under `.projects/` and generates `.env` files;** don't hand-edit them. Services and health: `stripe projects status --json`; env var names: `stripe projects env --json`; browse: `stripe projects catalog --json`.
- **Project variables** hold non-provider values such as an app URL, a feature flag or a self-managed API key:

```bash
stripe projects variables set <name> --env-key <ENV_KEY> --value <value>
stripe projects env add <name> --variable --env-key <ENV_KEY>
stripe projects env remove <name> --variable
stripe projects variables list --json
stripe projects variables delete <name> --yes
```

- **`variables set` syncs the active environment's output file immediately.** Omit `--value` only in interactive mode, so the CLI prompts securely. Never print secret values. `env remove` unbinds without deleting the stored variable.
- **Treat each CLI response as the source** of the message, next steps and retry conditions. Don't infer eligibility, approval or recovery commands from an error code alone.

## The Stripe MCP

The usage below comes from a third-party skill set (appeeky/stripe-skills), not from Stripe's own skills; confirm tool names with the server's tool list and https://docs.stripe.com/mcp .

- **Connect the Stripe MCP via OAuth or a restricted key.** Docs: https://docs.stripe.com/mcp
- **Discover the host's actual tools and schemas before calling them.** The [appeeky/stripe-skills] examples name GetMcpTools, CallMcpTool, user-Stripe and stripe_api_* wrappers; those are source host conventions, not a verified universal Stripe MCP API. Confirm the authorized account/project and read scope without printing credentials. [https://docs.stripe.com/mcp]
- **Paginate by the actual endpoint.** List APIs commonly use `has_more` with `starting_after`; Search uses `page` and `next_page`, with at most 100 results per page. The old source called 100 a total Search cap and applied list cursors universally. A host wrapper may impose a different cap; inspect it and report incomplete coverage. [https://docs.stripe.com/api/pagination/search; https://docs.stripe.com/api/subscriptions/search]
- **Use each currency's minor unit and documented exceptions.** Zero-decimal currencies and decimal price strings cannot be normalized by blindly dividing every amount by 100. The old source said all amounts were cents. Never expose secret keys. [https://docs.stripe.com/currencies#minor-units-in-api-amounts]
- **Audits remain read-only.** A discovered write tool or example operation does not authorize a mutation. [appeeky/stripe-skills; user standing rules]

Operational audits built on these calls live in [OPERATIONS.md](OPERATIONS.md).

## Feedback

**Send only on the user's explicit request.** [stripe/ai, stripe-apps] asks for one report per build session and other automatic feedback; the user's authorization rule takes precedence. Otherwise keep an optional draft, without contacting Stripe.

```bash
stripe feedback \
  --json \
  --actor agent \
  --feature apps \
  --sentiment <positive|negative|neutral> \
  --message "<what broke or worked, concrete and specific>" \
  --context "<what you were building, which path, CLI version>"
```

- **`--message` and `--context` take 10 to 2000 characters each;** `--message` needs at least 5 words.
- **`--json` returns `{"id":"...","success":true}`;** print the `id`.
- **For a user's complaint, use `--actor human`** with their verbatim words. Submissions are PII-scrubbed, including URLs.
- **The `send_stripe_feedback` MCP tool** is the alternative.
- **Never fail or stall on a failed submission.** Don't retry on `429` (rate-limited per device); otherwise show the drafted message so it can be sent later.
- **When to send differs within Stripe's Apps skill:** the workflow says one report per build session, and also to send feedback when the goal wasn't reached on the first try; the feedback reference says to send when something was useful, confusing, wrong or incomplete.

## Prove it

- `stripe version` is v1.50.9 or newer, and `stripe docs api GET /v1/products` prints Markdown.
- When Directory is selected, its chosen next action comes from the actual output and is within the authorized task. [stripe/ai, stripe-directory; user research-routing rules]
- Every `stripe pay` was first run with `--agent` or `--json`, the exact command was shown, and `--yes` was passed only after the user confirmed.
- `stripe projects status --json` shows the project, the summary lists env var names with no values, and `.projects/` and `.env` were not hand-edited.
- MCP totals exhaust the actual endpoint's pagination and disclose host/output caps; the account/project and currency convention are explicit. [https://docs.stripe.com/api/pagination/search]
- Feedback was sent only on the user's explicit request; otherwise any prepared message remains a draft. [stripe/ai, stripe-apps; user standing rules]
