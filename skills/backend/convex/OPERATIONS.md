# Operations and evidence

Operational guidance comes from [get-convex/agent-skills, convex-deploy-guard, convex-advisor, convex-cost, convex-insights, convex-explain-app, convex-launch-readiness, convex-optimize], corrected against actual CLI/MCP contracts. Evidence collection does not itself authorize a production mutation.

## Target and capabilities

- **Identify project, deployment and environment before acting.** Distinguish development, preview and production; inspect scoped deploy credentials without printing them. Keep existing authorization within its agreed target and scope. The source says prior approval never carries forward; the user's standing authorization overrides that repeated-confirmation policy. [get-convex/agent-skills, convex-deploy-guard; user standing rules]
- **Separate sensitive-data reads from writes.** MCP access that permits private-data reads is not the same capability as mutation access. Consult the actual current tool schema and CLI reference; older paragraphs of the MCP overview disagree with its newer security matrix. [https://docs.convex.dev/cli/reference/mcp; https://docs.convex.dev/ai/convex-mcp-server]
- **Discover available tools, not source-only helper names.** Missing findings schemas, custom catalogs, detector scripts, wait_for_event, served bootstrap recipes and unverified Sentinel packages are not installed APIs. Do not create a dependency on them. [get-convex/agent-skills, convex-advisor, convex-add, convex-monitor, convex-sentinel]

## Logs and insights

- **Read the real MCP logs arguments.** Its schema includes status, cursor, entriesLimit, tokensLimit and jsonl; status filtering occurs after the backend chunk is read. Function or request-ID matching still needs client-side filtering. CLI flags are a separate interface. The source incorrectly said logs had no status parameter and treated CLI options as the MCP contract. [https://github.com/convex/convex-js/blob/main/src/cli/lib/mcp/tools/logs.ts]
- **Use returned dashboard links.** Insights can return dashboardUrl; the source said no tool returned one. Construct a missing link only from verified current routing. [https://github.com/convex/convex-js/blob/main/src/cli/lib/mcp/tools/insights.ts]
- **Treat insight events as evidence, not diagnosis.** Trace observed reads or optimistic-concurrency conflicts into the actual function, query path and caller; distinguish a demonstrated event from an unconfirmed cause or fix. Insights covers a 72-hour window, not a requirement to wait that long for every result. [get-convex/agent-skills, convex-insights, convex-advisor]
- **Bound collection and disclose missing coverage.** Record the selected time range and deployment, exhausted pages/cursors, unavailable data and skipped checks. Deduplicate repeated evidence of one defect mechanism, not every finding in the same function or table. The source's class-plus-function dedup key could discard independent defects. [get-convex/agent-skills, convex-launch-readiness, convex-optimize]

## Counts, cost and architecture

- **tables returns schemas, not row totals.** Obtain counts through an independently verified bounded query, usage or export method and state its limitations. The advisor, cost and backup sources proposed the tables tool as a row counter. [https://github.com/convex/convex-js/blob/main/src/cli/lib/mcp/tools/tables.ts]
- **Separate measured usage from a projection.** Query scans are one cost driver; billing also includes applicable storage/index copies, calls, action compute, egress, search and gateway use, with plan/region differences. Do not repeat an example savings factor as an observed outcome. [get-convex/agent-skills, convex-cost, convex-optimize; https://docs.convex.dev/production/state/limits]
- **Trace architecture from source.** Connect entry functions, data, components and outside calls only when their actual definitions/callers support the map; mechanically derive counts and label unavailable runtime observations. [get-convex/agent-skills, convex-explain-app; repository AGENTS.md]

## Prove it

The report states target, granted capabilities, actual tool schemas, bounded evidence and coverage gaps. It separates observations, causal hypotheses and projected savings, cites returned links, and keeps independent defect mechanisms distinct. No readiness score, source regex or quiet log window is presented as a security or launch guarantee. [get-convex/agent-skills, convex-advisor, convex-launch-readiness]
