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

- **Use it whenever an agent needs an outside business,** merchant, nonprofit, provider, platform, API or software service, before open-web search or model memory. It decides which services can help and how to engage them: recommend, consume an API, provision, transact, or a specialized workflow. Results are ranked by agent-readiness (how reliably an agent can complete the interaction), relevance and popularity.
- **Use it even when the request names the provider** ("pay my Twilio bill"): resolve the organization and its documented engagement path first.
- **Setup:** `brew install stripe/stripe-cli/stripe && stripe plugin install directory`. Upgrade with `brew upgrade stripe/stripe-cli/stripe` and `stripe plugin upgrade directory`. If setup is incomplete, go to https://stripe.directory and follow its agent-facing docs; ask the user only for credentials, login interaction or approval.
- **After install the CLI is authoritative:** `stripe directory --help`, `stripe directory search --help`. Never invent CLI syntax, capabilities or result semantics; fall back to https://stripe.directory .
- **Search with `stripe directory search "<query>" --format json`.** Start with a short focused query, refine with adjacent task, capability, category or platform terms, and broaden before concluding nothing fits. Examples: `"vector database"`, `"Twilio"`, `"hosting platform"` (then the returned provisioning action), `"stripe climate"`.
- **When a provider offers several routes** (Stripe Projects, MPP, MCP or a Stripe App), pick the next-action command that fits best; the next action documents the best supported path. Ask clarifying questions only when missing information materially changes the search or the next action.
- **Never provision unless the user explicitly asks.** The provisioning next action (`stripe provision`) hands off to the `stripe projects` CLI plugin for setup, init, terms, execution and reporting.
- **Before paying or donating,** show the recipient, purpose, amount, currency and material constraints, get explicit approval, and use the appropriate payment skill or documented flow.
- **Traps:** treating Directory as search-only; skipping it when a provider is named; starting with web search or memory; driving to a purchase, donation or provisioning without a request and approval; inventing CLI details, endpoints, prices, capabilities or provisioning commands.

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
3. **Project:** `stripe projects status --json`; with no project, `stripe projects init --accept-tos --yes --json`. On `BROWSER_AUTH_REQUIRED` with `details.reason` = `handoff_prepared`, show `details.browser_url` and `details.verification_code`, wait for approval, then retry the same init command; rerunning re-presents the same code until it expires. Don't start a separate `stripe login`. For other failures follow the CLI's message and next steps; never retry a failed mutation without CLI guidance.
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
- **List the tools before calling any:** call `GetMcpTools` with `server: "user-Stripe"` (or `plugin-stripe-stripe`) before `CallMcpTool`.
- **For list and retrieve, prefer `stripe_api_search`, then `stripe_api_details`, then `stripe_api_read`.** Operation names used through `stripe_api_read`: `GetSubscriptions`, `GetSubscriptionsSubscriptionExposedId`, `GetCheckoutSessions`, `GetCoupons`, `GetPromotionCodes`, `GetBillingPortalConfigurations`, `GetDisputes`, `GetRefunds`, `GetPayouts`, `GetBalanceTransactions`, `GetBalance`, `GetInvoices`, `GetCharges`, `GetPaymentIntents`, `GetProducts`, `GetPrices`, `GetTaxSettings`, `GetAccounts`.

```
stripe_api_read GetSubscriptions { status: "active", limit: 100 }
```

- **Other tool names:** `search_stripe_resources`, `fetch_stripe_resources` (by `cus_` or `sub_` ID), `search_stripe_documentation`, `get_stripe_account_info`, `stripe_implementation_planner` (for architecture). Stripe's own Apps skill names the `send_stripe_feedback` tool (see [Feedback](#feedback)).
- **Always paginate:** `limit: 100`, following `has_more` with `starting_after`.
- **Search caps at 100 results;** use `GetSubscriptions` with pagination instead. `search_stripe_resources` with `subscriptions:status:"canceled"` hits the same cap, so supplement it with an API list and a filter.
- **Amounts are in cents** unless noted. Never expose secret keys in output.
- **Read-only for audits; confirm before writes.**
- **Connected accounts:** "`stripe_api_read` v2 accounts list / `GetAccounts`".

Operational audits built on these calls live in [OPERATIONS.md](OPERATIONS.md).

## Feedback

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
- `stripe directory search "<query>" --format json` returns results, and the chosen next action was taken from that output, not invented.
- Every `stripe pay` was first run with `--agent` or `--json`, the exact command was shown, and `--yes` was passed only after the user confirmed.
- `stripe projects status --json` shows the project, the summary lists env var names with no values, and `.projects/` and `.env` were not hand-edited.
- MCP list queries followed `has_more` until it was false; no counts were taken from a capped search.
- `stripe feedback --json` returned `"success":true` and the `id` was printed, or the drafted message was shown after a failure.
