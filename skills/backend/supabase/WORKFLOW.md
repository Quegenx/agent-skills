# Workflow: CLI, MCP, migrations, debugging

## The CLI

- **Discover commands with `--help`; never guess them.** The command tree changes between versions: `supabase --help`, `supabase db --help`, `supabase db push --help`. Check `supabase --version` and the CLI changelog for version-specific features.
- **Version gates:** `supabase db query` needs CLI 2.79.0+ (otherwise MCP `execute_sql` or `psql`); `supabase db advisors` needs 2.81.3+ (otherwise MCP `get_advisors`).
- **Create hand-written migrations with `supabase migration new <name>`.** Never invent a migration file name or its timestamp format from memory.

## The MCP server

Setup is in the platform's MCP guide (server `https://mcp.supabase.com/mcp`). When its tools don't show up, in order:

1. **Is it reachable?** `curl -so /dev/null -w "%{http_code}" https://mcp.supabase.com/mcp` returns `401` when it is up (no token sent); a timeout or refused connection means it may be down.
2. **Is it configured?** The project's `.mcp.json` points at that URL.
3. **Is it authenticated?** It uses OAuth 2.1: the user starts the sign-in from their agent, finishes it in the browser and reloads the session. Where no browser can run (CI), pass a scoped personal access token as `Authorization: Bearer`.
4. **Does the token allow this tool?** "You do not have permission to perform this action" with a scoped token means the token lacks that tool's permission or the project is outside its scope; the tokens guide lists what each tool needs.

## Docs

In this order: the MCP `search_docs` tool (returns the relevant passages); any docs page fetched as markdown by adding `.md` to its path; a web search when you don't know which page.

## Schema changes

First find out which workflow the project uses.

**Declarative schema** (a `supabase/schemas/` folder, or `schema_paths` in `config.toml`): edit the desired state in those files, generate the migration from them, and review it. Don't start by writing a migration by hand.

**Imperative migrations** (everything else):

1. **Iterate with SQL that writes no history:** MCP `execute_sql` or `supabase db query` against the local database. Don't use `apply_migration` for this: every call writes a migration history entry, so you can't iterate, and `db diff` or `db pull` then produce empty or conflicting results.
2. **Run the advisors** (`supabase db advisors` or MCP `get_advisors`) and fix what they report.
3. **Re-read the security checklist** (SECURITY.md) if the change touches views, functions, triggers or storage.
4. **Generate the migration:** `supabase db pull <descriptive-name> --local --yes`.
5. **Check it:** `supabase migration list --local`, then review the file for locks and table rewrites (the `postgres` skill's MIGRATIONS.md).

## Debugging

When a request fails (a REST or PostgREST error code, a Postgres error, an empty result, an unexpected RLS block, permission denied, a schema cache error, a timeout, or an Auth, Realtime, Edge Functions or Storage error), read the platform's monitoring and debugging guide (`https://supabase.com/docs/guides/monitoring-and-debugging.md`) before diagnosing, and read the logs (Logs Explorer). Common first checks:

- **Empty result, no error:** RLS filtered everything; run the query as that role (SECURITY.md) and read the policies. An update that "worked" with zero rows is a missing `select` policy.
- **Permission denied for table (`42501`):** the role lacks a grant (Data API exposure), not a policy.
- **A new column, table, view or function missing from the API:** the PostgREST schema cache is stale; reload it (`notify pgrst, 'reload schema'`) and check the grants.
- **Slow requests or timeouts:** the slow query and missing-index advice in the same guide, and the `postgres` skill's MONITORING.md.

## Prove it

The migration applied to a fresh local database from zero (`supabase db reset` locally, after confirming), the advisors clean, and the change exercised once through the client as the affected role.
