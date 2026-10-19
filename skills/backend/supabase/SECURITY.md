# Security checklist

Run through it for any change that touches auth, policies, views, functions, storage or user data. Each item is a trap that opens access without an error.

## Exposure: which tables the API can reach

- **The Data API reaches a table only through grants.** New tables in `public` are no longer granted to `anon`, `authenticated` and `service_role` automatically: the default for new projects from 2026-05-30, enforced on all existing projects on 2026-10-30. Existing tables keep their grants; every new table needs explicit grants (DATA-API.md has the per-table unit). A table "unexpectedly inaccessible" from the client returns `42501` with a hint naming the missing `GRANT`: check the Data API settings and the grants first, not RLS.
- **Grants decide whether a table is reachable; RLS decides which rows.** Whenever you grant `anon` or `authenticated` anything, enable RLS on that table in the same migration.

```sql
alter table public.notes enable row level security;
grant select, insert, update, delete on public.notes to authenticated;
```

- **Every table in an exposed schema gets RLS,** `public` included; tables in private schemas get it too, as a second layer.

## Policies

- **`to authenticated` alone is authentication, not authorization.** It admits every signed-in user to every row (the classic insecure direct object reference). Pair the role with an ownership or membership predicate:

```sql
create policy "owners read their notes" on public.notes
  for select to authenticated
  using ((select auth.uid()) = user_id);
```

- **Make old-row and new-row authorization explicit.** `using` selects rows an update can reach; `with check` validates its new values. For an UPDATE or ALL policy without an explicit check, PostgreSQL uses its `using` expression as the check too. The old line said omission alone allowed ownership reassignment; that is false for this policy. Keeping both clauses states the intent clearly. [https://www.postgresql.org/docs/18/sql-createpolicy.html]

```sql
create policy "owners update their notes" on public.notes
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
```

- **An update also needs a `select` policy.** Postgres has to read the row before updating it; without a select policy the update matches nothing and returns zero rows, with no error.
- **Use the `to` clause, not `auth.role()`.** `auth.role() = 'authenticated'` is deprecated, and anonymous sign-ins carry the `authenticated` role, so the check lets them through; `to authenticated` with an ownership predicate doesn't depend on it.
- **Wrap `auth.uid()` and `auth.jwt()` in `(select ...)`** so they're evaluated once per statement, not once per row (a large table goes from unusable to fast), and index every column a policy filters on.
- **Write one policy per command** (`select`, `insert`, `update`, `delete`) rather than `for all`, so each states exactly what it allows.
- **Complex membership checks** go in a `security definer` helper in a private schema (below), called as `(select private.is_team_member(team_id))`.

  A SELECT wrapper permits an init-plan optimization only when its result does not depend on each row. This helper receives that row's `team_id`; the wrapper does not make its membership result constant for the whole query. [https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select]

### Tenant membership

A tenant policy checks actual membership:

```sql
create policy "members read their tenant's projects" on projects
  for select to authenticated
  using (tenant_id in (select tenant_id from memberships where user_id = (select auth.uid())));
```

Test this as each role, using `set local role authenticated; set local request.jwt.claims = '{"sub": "..."}'`, or two real users through the client. Generic tenant-context handling stays in [secure-coding TENANCY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/secure-coding/TENANCY.md).

## Views and functions that bypass RLS

- **Views apply their owner's permissions and policies by default, and the owner is usually `postgres`, so they bypass RLS.** On Postgres 15+ create them `with (security_invoker = true)`; on older versions revoke access from `anon` and `authenticated` or keep them in a schema the API doesn't expose.
- **`security definer` functions run as their creator,** usually a role that bypasses RLS. Never add it to make a permission error go away: it removes the check instead of fixing the cause. Default to `security invoker`.
- **Every new function is executable by `PUBLIC`,** so a `security definer` function in `public` is an open API endpoint for `anon` and `authenticated` with no grant needed. When one is genuinely needed (an internal lookup across RLS):

```sql
create or replace function private.is_team_member(p_team_id bigint)
returns boolean
language sql
security definer
set search_path = ''                                  -- no schema the caller can shadow
as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id and user_id = (select auth.uid())   -- always check the caller inside
  );
$$;
```

  This block defines the helper; complete its permissions before use. Keep it in a schema the API doesn't expose, check `auth.uid()` in its body and pin `search_path`. Revoke broad default execution, then grant EXECUTE selectively to the role whose policy calls the helper, including `authenticated` when that is the intended caller. The old example revoked that role without restoring invocation permission: SECURITY DEFINER changes privileges inside the function, not the caller's need for EXECUTE. Review as the affected role and run the advisors when that execution is authorized. [https://www.postgresql.org/docs/18/sql-createpolicy.html#SQL-CREATEPOLICY-NOTES; https://www.postgresql.org/docs/18/sql-createfunction.html]

## Auth and sessions

- **`user_metadata` (`raw_user_meta_data`) is editable by the user** and appears in `auth.jwt()`: never authorize on it. Roles, plans and tenant IDs go in `app_metadata` (`raw_app_meta_data`), written only by the server.
- **JWT claims are only as fresh as the token.** A role or `app_metadata` change takes effect at the next refresh; an admin update doesn't fire the client's `onAuthStateChange`, so the client calls `refreshSession()` to pick it up.
- **Deleting a user or signing them out doesn't invalidate access tokens already issued;** they stay valid until they expire. Deleting a user removes their sessions and refresh tokens. Keep token lifetime short for sensitive apps, and for strict guarantees check the token's `session_id` against `auth.sessions` on sensitive operations.
- **On the server, verify the user with `getClaims()` or `getUser()`.** `getClaims()` verifies the token locally only with asymmetric signing keys (with a symmetric secret it calls the Auth server), and it doesn't detect a session revoked before its token expired; `getUser()` asks the Auth server and does. The JS reference recommends `getUser()` for authorization checks on the server (AUTH-SESSIONS.md has the details). Never trust `getSession()` in server code: it reads the session out of the cookie without revalidating it, and anyone can forge the cookie. Check the current docs for the recommended call for your SSR setup.

## Keys and tokens

- **Publishable key in front ends; the service-role or secret key only on servers.** The secret key bypasses RLS entirely (`service_role` has `bypassrls`). In Next.js any `NEXT_PUBLIC_` environment variable is shipped to the browser. Legacy `anon` keys exist only for compatibility.
- **Scripts, CI and agents use a scoped personal access token,** limited to the organizations, projects and permissions the task needs. A classic token (what the browser `supabase login` flow creates) carries the whole account. The personal access tokens guide lists the permission each Management API endpoint and MCP tool needs: look it up there, don't guess. In CI set `SUPABASE_ACCESS_TOKEN` to the scoped token; it takes precedence over a saved login. Commands that connect with the database password (`--password`, `SUPABASE_DB_PASSWORD`, as in `supabase db push`) are not limited by the token's scope.

## Storage

- **Storage access is RLS on `storage.objects`.** An upsert (replacing a file) needs `insert`, `select` and `update` policies; with `insert` alone new uploads work and replacements fail silently.
- **Scope storage policies by path** (a folder per user, `(storage.foldername(name))[1]` checked against `auth.uid()`), the same way as table policies.

## Dependencies

Pin package versions and commit the lockfile for every Supabase package (`@supabase/supabase-js`, `@supabase/ssr`, `supabase-py` and the rest); follow the platform's npm security guide. For anything not covered here, read the product security index (`https://supabase.com/docs/guides/security/product-security.md`).

## Prove it

Test policies as each role, not as `postgres`, which has `bypassrls`. In SQL:

```sql
begin;
set local role authenticated;
set local request.jwt.claim.sub = '<user-a-uuid>';
select count(*) from public.notes;                                    -- only user A's rows
update public.notes set body = 'x' where user_id = '<user-b-uuid>';   -- UPDATE 0
rollback;
```

Repeat as `anon`, as user B, and through every view and exposed function; then run the security advisor (WORKFLOW.md) and read every finding.
