---
name: supabase
description: "Builds on Supabase without the platform's silent traps: which tables the Data API exposes, RLS policies that authorize and not only authenticate, views and security definer functions that bypass RLS, keys and tokens, auth sessions, storage permissions, the CLI and MCP server, schema changes and migrations, and how to debug errors. Use for any Supabase task: database, auth, RLS, storage, edge functions, realtime, the CLI or MCP, migrations, or a Supabase error."
---

# Supabase

Supabase puts Postgres directly behind an HTTP API the browser can call. That makes the database's own permissions (grants and row-level security) the application's access control, and most Supabase security bugs are places where Postgres quietly allows more than you meant: a view, a function, a policy that checks who you are but not what you own. Postgres itself is the `postgres` skill; tenant isolation in general is the `secure-coding` skill's TENANCY.md.

| The job | Read |
|---|---|
| Data API exposure, grants, RLS policies, views, functions, keys, auth sessions, storage, dependencies: the security checklist | [SECURITY.md](SECURITY.md) |
| The CLI, the MCP server, docs, schema changes and migrations, advisors, debugging | [WORKFLOW.md](WORKFLOW.md) |

## The rules

1. **Supabase changes often: check before you build.** Read the changelog index (`https://supabase.com/changelog.md`) for breaking changes in the area you touch, then the current docs (any docs page as markdown by adding `.md` to its URL, or the MCP `search_docs` tool). Function signatures, `config.toml` keys and CLI commands move between versions.
2. **RLS on every table in an exposed schema** (`public` by default), with policies written for that table's real access model, not one copied `auth.uid() = user_id` everywhere.
3. **Authorization lives in what users can't edit:** ownership columns and `app_metadata`, never `user_metadata`.
4. **The service-role or secret key never reaches a browser or app bundle.** Front ends use the publishable key.
5. **Verify every change:** after a fix, run a query or request as the affected role and see the expected rows. A fix that wasn't run isn't done.
6. **Two or three failed attempts mean stop and rethink,** not retry: read the error closely, the logs and the docs before trying again.
7. **Confirm before destructive actions** on a project: dropping tables, resetting the database, deleting branches, rotating keys.

## Prove it

As `anon` and as two different signed-in users: each table returns only the rows that user should see, updates and deletes on another user's row affect zero rows, inserts with another user's ID are rejected, every view and exposed function obeys the same rules, and the security advisor reports nothing new.
