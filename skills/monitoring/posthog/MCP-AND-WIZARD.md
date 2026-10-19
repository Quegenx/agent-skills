# MCP server and wizard

The PostHog MCP server lets an agent read and change a PostHog project (insights, flags, experiments, errors, logs, persons, SQL, billing and more) from any MCP client; the AI wizard is the agentic CLI that installs PostHog into a codebase and can add the MCP server for you. What the server can do in a session is decided by its auth (OAuth or a personal API key), the project it's pinned to, the tool mode (one `exec` tool or every tool registered), and the read-only and feature filters. The Supabase warehouse source, also set up through the wizard, is at the end. Warehouse syncs in general are [DATA-WAREHOUSE.md](DATA-WAREHOUSE.md), SDK setup is [SETUP-WEB.md](SETUP-WEB.md), and the SQL the `execute-sql` tool runs is [HOGQL.md](HOGQL.md).

**Contents:** [Set up the MCP server](#set-up-the-mcp-server) · [Auth, pinning and accounts](#auth-pinning-and-accounts) · [Tool mode and filters](#tool-mode-and-filters) · [The exec commands](#the-exec-commands) · [Rate limits](#rate-limits) · [Tools](#tools) · [The AI wizard](#the-ai-wizard) · [posthog-js source cross-checks](#posthog-js-source-cross-checks) · [Prove it](#prove-it)

## Set up the MCP server

- **The hosted endpoint is `https://mcp.posthog.com/mcp`,** free to connect to and call (standard PostHog usage and billing still apply to the data your queries consume); its auth server routes to US or EU by account. It works with any MCP client (PostHog Desktop, Claude Code, Claude Desktop, Cursor, Codex, VS Code, Windsurf, Zed) and platforms (Lovable, Replit, v0). Source: github.com/PostHog/posthog/tree/master/services/mcp.
- **The server is a proxy:** it doesn't store analytics data.
- **Install with the wizard:** `npx @posthog/wizard mcp add` (also `mcp remove`, `mcp tutorial`).
- **Claude Code:** `claude mcp add --transport http posthog https://mcp.posthog.com/mcp -s user` (a login prompt appears on first use). Or the plugin: `claude plugin install posthog`, then `/mcp` to log in; it adds the slash commands `/posthog:flags`, `/posthog:insights`, `/posthog:errors`, `/posthog:experiments`.
- **Setup prompt:** `posthog:posthog-setup` (Next.js supported).
- **Review tool calls before executing them:** be mindful of prompt injection.
- **Some tools use LLMs internally,** billed as PostHog AI spend and only available when AI data processing is enabled in organization settings.

## Auth, pinning and accounts

- **OAuth is recommended.** Otherwise use a personal API key with the `MCP Server` preset (it scopes access to a specific project), sent as an `Authorization: Bearer phx_...` header (e.g. in `.cursor/mcp.json`). Enterprise: enterprise-managed authorization (ID-JAG) through the IdP.
- **Pin the org and project** with headers `x-posthog-organization-id` and `x-posthog-project-id`, or query params `organization_id` and `project_id`. Pinning a project removes both the `switch-organization` and `switch-project` tools; pinning only an organization removes only `switch-organization`.
- **Several accounts or regions:** one MCP server entry per account with distinct names (e.g. `posthog-acme-us`, `posthog-acme-eu`). Per-entry personal API keys avoid OAuth mixups.

## Tool mode and filters

| Setting | How |
|---|---|
| CLI mode: a single `exec` tool (plus `render-ui` on MCP-apps hosts). Recommended; the default for Claude, Claude Code, Cowork, Codex | Header `x-posthog-mcp-mode` or `?mode=cli` |
| Tools mode: every tool registered. The default for Cursor | Header `x-posthog-mcp-mode` or `?mode=tools` |
| Read-only: tools that create, update or delete data are excluded | Header `x-posthog-read-only: true` or `?readonly=true` (both accept `true` or `1`) |
| Feature categories | `?features=flags,dashboards,insights` |
| Single tools | `?tools=dashboard-get,feature-flag-get-all,execute-sql` |

- **For mode and read-only, the header takes precedence** if you set both header and query parameter.
- **`features` and `tools` combine as a union** (e.g. `?features=flags&tools=dashboard-get`); with neither, all tools are available. Category names include `workspace`, `actions`, `alerts`, `cohorts`, `dashboards`, `data_schema`, `docs`, `error_tracking`, `events`, `experiments`, `flags`, `insights`, `ai_observability`, `prompts`, `logs`, `persons`, `reverse_proxy`, `search`, `sdk_doctor`, `sql`, `surveys`, `replay`, `web_analytics`, `tracing`, and more; hyphens and underscores are interchangeable.

## The exec commands

In CLI mode every tool is reached through `exec`:

| Command | Does |
|---|---|
| `help [command]` | Help |
| `learn <topic...>` | Claude web and desktop only |
| `tools` | List tools |
| `search <words or regex_pattern>` | Matches tool names, titles and descriptions, not schemas |
| `info [--json] <tool_name>` | A tool's details |
| `schema <tool_name> [field_path]` | Drill into a field, e.g. one that has a `hint` |
| `call [--json] [--confirm] <tool_name> [json_input]` | Run a tool; `--confirm` is required for destructive tools |

- **One command per request:** no batching, but parallel calls are fine.
- **A namespaced `posthog:<tool-name>`** maps to `posthog:exec({ "command": "info <name>" })`, then `call`. Run `info` once and reuse it.
- **Some clients expose the dispatcher as `mcp__posthog__exec`:** search for the tool (e.g. `billing`) first.

## Rate limits

- **480 requests per minute and 4,800 per hour per credential** (OAuth token or personal API key). Over the limit: `429` with `Retry-After`.
- **Everything counts:** opening a session, the ready notification and listing tools each count as a request.
- **API rate limits may also apply:** the default API limits count only personal-API-key requests; OAuth skips them. AI-powered tools have lower limits.
- **For heavy use,** move to batch exports or endpoints.

## Tools

Tool counts by category: Access control 15, Actions 5, AI observability 95, Alerts 8, Annotations 6, Billing 15, Cohorts 6, Conversations 13, Core 20, Dashboards 19, Data warehouse 27, Data schema 1, Debug 1, Docs 1, Early access features 5, Endpoints 14, Error tracking 28, Error tracking alerts 4, Events & properties 3, Experiments 50, Feature flags 29, Health 3, Insights & analytics 1, Logs 21, Notebooks 26, Organization & project management 4, Persons 7, Product analytics 9, Query wrappers 12, Reverse proxy 6, Session replays 8, SQL 1, Surveys 11, Tracing 12, Web analytics 17, Workflows 38.

Plus others; the full list is in the server source. Names below are verbatim; a description is given only where the name doesn't say it.

- **SQL and schema:** `execute-sql`; `read-data-schema` (explore the user's events, actions, properties and property values); `docs-search`.
- **Organization, project, health:** `organizations-get`, `projects-get`, `switch-organization`, `switch-project`; `health-issues-get`, `health-issues-list`, `health-issues-summary`.
- **Product analytics:** `elements-stats-retrieve`, `insight-create`, `insight-delete`, `insight-get`, `insight-update`, `insights-activity-retrieve`, `insights-all-activity-retrieve`, `insights-list`, `insights-trending-retrieve`; `insight-query` (run a saved insight's query and return results).
- **Query wrappers:** `query-funnel`, `query-funnel-actors`, `query-lifecycle`, `query-lifecycle-actors`, `query-paths`, `query-paths-actors`, `query-retention`, `query-retention-actors`, `query-stickiness`, `query-stickiness-actors`, `query-trends`, `query-trends-actors`.
- **Dashboards** (and others): `dashboard-create`, `dashboard-create-tile`, `dashboard-delete`, `dashboard-get`, `dashboard-insights-run`, `dashboard-update`, `dashboards-get-all`.
- **Cohorts:** `cohorts-create`, `cohorts-list`, `cohorts-retrieve`, `cohorts-partial-update`, `cohorts-add-persons-to-static-cohort-partial-update`, `cohorts-rm-person-from-static-cohort-partial-update`.
- **Persons:** `persons-list`, `persons-retrieve`, `persons-cohorts-retrieve`, `persons-values-retrieve` (person property values), `persons-property-set`, `persons-property-delete`, `persons-bulk-delete`.
- **Events and properties:** `event-definition-create`, `event-definition-update` (metadata), `property-definition-update` (metadata).
- **Feature flags:** `create-feature-flag`, `update-feature-flag`, `delete-feature-flag`, `feature-flag-archive`, `feature-flag-unarchive`, `feature-flag-enable`, `feature-flag-disable`, `feature-flag-get-all`, `feature-flag-get-definition`, `feature-flag-get-definition-by-key`, `feature-flag-roll-out-to-everyone`, `feature-flag-set-release-condition-rollout`, `feature-flags-activity-retrieve`, `feature-flags-bulk-delete-create`, `feature-flags-bulk-keys-retrieve` (look up flag keys by ID), `feature-flags-bulk-update-tags-create`, `feature-flags-copy-dependencies-check` (whether a flag's dependencies can be copied), `feature-flags-copy-flags-create` (copy across projects), `feature-flags-dependent-flags-retrieve`, `feature-flags-evaluation-reasons-retrieve`, `feature-flags-my-flags-retrieve` (my evaluated flags), `feature-flags-status-retrieve`, `feature-flags-test-evaluation-create`, `feature-flags-user-blast-radius-create`; scheduled changes `scheduled-changes-create`, `scheduled-changes-get`, `scheduled-changes-list`, `scheduled-changes-update`, `scheduled-changes-delete`.
- **Experiments:** `experiment-create`, `experiment-create-from-prompt` (from an LLM prompt), `experiment-get`, `experiment-get-by-flag-key`, `experiment-list`, `experiment-update`, `experiment-delete`, `experiment-duplicate`, `experiment-copy-to-project`, `experiment-launch`, `experiment-pause`, `experiment-resume`, `experiment-end`, `experiment-reset`, `experiment-archive`, `experiment-unarchive`, `experiment-ship-variant`, `experiment-freeze-exposure`, `experiment-unfreeze-exposure`, `experiment-activity` (change history), `experiment-calculate-running-time`, `experiment-cleanup-task` (flag cleanup task status), `experiment-migrate` (legacy experiment), `experiment-setup-context`, `experiment-stats` (velocity stats), `experiment-results-get` (metric and exposure results with self-describing per-metric metadata), `experiment-timeseries-results` (metric results over time), `experiment-metrics-recalculation-create`, `experiment-metrics-recalculation-latest-retrieve` (get experiment results), `experiment-metrics-recalculation-retrieve` (one recalculation run), `experiment-prompt-templates` (LLM prompt metric templates), `experiment-holdouts-create`, `experiment-holdouts-list`, `experiment-holdouts-retrieve`, `experiment-holdouts-partial-update`, `experiment-holdouts-destroy`, `experiment-saved-metrics-create`, `experiment-saved-metrics-list`, `experiment-saved-metrics-retrieve`, `experiment-saved-metrics-partial-update`, `experiment-saved-metrics-destroy` (shared metrics), `experiments-bulk-update-tags-create`, `experiments-session-event-deltas-create` (find recordings worth watching per variant); prompts `llma-prompt-create`, `llma-prompt-duplicate`, `llma-prompt-get`, `llma-prompt-list`, `llma-prompt-update`, `llma-prompt-label-set`, `llma-prompt-label-delete`.
- **Error tracking:** `query-error-tracking-issues-list`, `query-error-tracking-issue`, `query-error-tracking-issue-events`, `error-tracking-issues-partial-update`, `error-tracking-issues-assign-partial-update`, `error-tracking-issues-merge-create`, `error-tracking-issues-split-create` (split issue fingerprints), `error-tracking-external-references-create`, `error-tracking-recommendations-list`, `error-tracking-settings-get`, `error-tracking-settings-update`; rules `error-tracking-assignment-rules-create` / `-list`, `error-tracking-bypass-rules-create` / `-list` / `-update`, `error-tracking-grouping-rules-create` / `-list` / `-update`, `error-tracking-severity-rules-create` / `-list` / `-update`, `error-tracking-suppression-rules-create` / `-list` / `-update`; symbol sets `error-tracking-symbol-sets-list`, `error-tracking-symbol-sets-retrieve`, `error-tracking-symbol-sets-download-retrieve`; alerts `error-tracking-alerts-create`, `error-tracking-alerts-list`, `error-tracking-alerts-partial-update`, `error-tracking-alerts-delete`.
- **Logs:** `query-logs`, `logs-count`, `logs-count-ranges` (by time bucket), `logs-facet-values-create` (facet counts), `logs-attributes-list`, `logs-attribute-values-list`, `logs-patterns` (mine patterns), `logs-patterns-diff` (diff patterns between two windows), `logs-services-create` (list services with stats), `logs-sparkline-query`, `logs-anomalies-scan` (scan a service's logs for volume anomalies), `logs-anomalies-series-bands` (per-series volume with expected bands); alerts `logs-alerts-create`, `logs-alerts-list`, `logs-alerts-retrieve`, `logs-alerts-partial-update`, `logs-alerts-destroy`, `logs-alerts-simulate-create`, `logs-alerts-events-list`, `logs-alerts-destinations-create` (attach a destination), `logs-alerts-destinations-delete-create` (detach one).
- **Session replays:** `query-session-recordings-list`, `session-recording-get`, `session-recording-delete`, `session-recording-bulk-delete`, `session-recording-playlist-create`, `session-recording-playlist-get`, `session-recording-playlist-update`, `session-recording-playlists-list`.
- **Surveys** (and others): `survey-create`, `survey-get`, `survey-launch`, `survey-stats`, `survey-stop`, `survey-update`, `surveys-get-all`, `surveys-responses-list`.
- **Reverse proxy:** `proxy-create`, `proxy-get`, `proxy-list`, `proxy-diagnose`, `proxy-retry` (retry provisioning), `proxy-delete`.
- **Billing, access control and health tools** used for investigations are listed with their workflows in [INGESTION-AND-COSTS.md](INGESTION-AND-COSTS.md).

## The AI wizard

- **An agentic CLI, and the recommended, default install method:** `npx -y @posthog/wizard@latest` (or `npx @posthog/wizard`). It authenticates, installs SDKs, scans the codebase, creates custom events from real product flows, configures `.env`, instruments client and server side, generates insights and dashboards, and optionally installs the MCP server. Repo: github.com/PostHog/wizard.

| Command | Does |
|---|---|
| `wizard` | Default flow: installs and instruments PostHog (was `integrate`) |
| `wizard self-driving` | Open beta: enables signal sources, sets up scouts, gives your inbox link |
| `wizard audit <subcommand>` | `events` (default), `all`, `autocapture`, `feature-flags`, `identify`, `session-replay`, `web-analytics` (`events-audit` became `audit events`; bare `wizard audit` runs `events`) |
| `wizard revenue-analytics` | Wires up Stripe + PostHog revenue analytics (was `revenue`) |
| `wizard mcp-analytics` | Instruments your own MCP server with MCP Analytics |
| `wizard ai-observability` | Instruments your LLM calls with AI Observability |
| `wizard replay-vision` | Turns on Session Replay and creates Replay Vision scanners for your product |
| `wizard migrate` | Migrates from another analytics or feature-flag vendor |
| `wizard upload-source-maps` | Uploads source maps to Error Tracking (was `upload-sourcemaps`; the old name still works) |
| `wizard error-tracking` | Sets up Error Tracking, with source map upload and release linking |
| `wizard warehouse` | Detects and connects data warehouse sources, e.g. Supabase below |
| `wizard feature-flags` | Sets up example feature flags |
| `wizard metrics` | Adds PostHog application metrics to your project |
| `wizard mcp add` / `mcp remove` / `mcp tutorial` | Manages the PostHog MCP server for your AI agent, or explores the MCP tutorial |
| `wizard slack add` | Connects PostHog to your Slack |
| `wizard skill <skill-name>` | Runs a single skill by name (listed in the context-mill releases) |

- **Audit subcommands:** `events` audits event capture quality and cost; `all` audits every area; `autocapture` and `feature-flags` audit setup or usage and cost; `identify` audits your `$identify` implementation; `session-replay` and `web-analytics` audit their setup.
- **The wizard page also recommends** a reverse proxy, and grouping the marketing site, mobile app and web app in one project.
- **Add PostHog's IPs to your WAF allowlist** for features like heatmaps, where the WAF may block PostHog's requests to your site. EU: `3.75.65.221`, `18.197.246.42`, `3.120.223.253`. US: `44.205.89.55`, `52.4.194.122`, `44.208.188.173`. Heatmap screenshots are captured with Browserless, which has its own IP addresses (Browserless publishes the current list). An allowlist does not help when the app has a private address.

Supabase warehouse connection modes, credentials, TLS and CDC prerequisites are in [DATA-WAREHOUSE.md](DATA-WAREHOUSE.md#supabase-as-a-warehouse-source). [existing MCP-AND-WIZARD.md]

## posthog-js source cross-checks

- **`@posthog/next` middleware option `proxy?: boolean | PostHogProxyOptions`:** requests matching the path prefix (default `/ingest`) are rewritten to the PostHog ingest host. When you use it, set `api_host` to that prefix (e.g. `/ingest`) in the PostHogProvider options.
- **`@posthog/react` `PostHogProviderProps` is a discriminated union:** `{ client: PostHog; apiKey?: never; options?: never } | { apiKey: string; options?: Partial<PostHogConfig>; client?: never }`. Pass a client or apiKey/options, not both.
- **`@posthog/next` server request errors:** `export { onRequestError } from '@posthog/next'` in `instrumentation.ts` captures them as `$exception`.

## Prove it

- With the server connected, `exec` `tools` (CLI mode) or the client's tool list (tools mode) shows only the categories you filtered to; with `?readonly=true` no write tool is listed.
- With the project pinned, `switch-project` and `switch-organization` are absent.
- `posthog:execute-sql` with a trivial query returns rows from the intended project, and a burst of calls stays under 480 per minute without a `429`.
- After the wizard runs, `.env` holds the PostHog settings and events from the instrumented flows appear in the project.
- For Supabase, the source connects with the pooler host and `postgres.<project-ref>` user, over SSL, as a read-only role, and the first sync lists the `public` tables.
