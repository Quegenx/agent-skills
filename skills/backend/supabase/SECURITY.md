# Security checklist

Run through it for any change that touches auth, policies, views, functions, storage or user data. Each item is a trap that opens access without an error.

## Exposure: which tables the API can reach

- **The Data API reaches a table only through grants.** Depending on the project's Data API settings, a table created in SQL may not be exposed automatically; then `anon` and `authenticated` need explicit grants. A table "unexpectedly inaccessible" from the client: check the settings and the grants first, not RLS.
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

- **Updates need both `using` and `with check`.** Without `with check`, a user can update their own row so that `user_id` points at someone else:

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

## Views and functions that bypass RLS

- **Views run with their owner's rights and skip RLS by default.** On Postgres 15+ create them `with (security_invoker = true)`; on older versions revoke access from `anon` and `authenticated` or keep them in a schema the API doesn't expose.
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

revoke execute on function private.is_team_member(bigint) from public, anon, authenticated;
```

  Keep it in a schema the API doesn't expose, check `auth.uid()` in its body, pin `search_path`, revoke `execute` from roles that shouldn't call it, and run the advisors afterwards.

## Auth and sessions

- **`user_metadata` (`raw_user_meta_data`) is editable by the user** and appears in `auth.jwt()`: never authorize on it. Roles, plans and tenant IDs go in `app_metadata` (`raw_app_meta_data`), written only by the server.
- **JWT claims are only as fresh as the token.** A role or `app_metadata` change takes effect at the next refresh; for a revocation that must be immediate, check the database, not the claim.
- **Deleting a user doesn't invalidate their access tokens.** Sign the user out or revoke their sessions first, keep token lifetime short for sensitive apps, and for strict guarantees check the token's `session_id` against `auth.sessions` on sensitive operations.
- **On the server, verify the user** (`getUser()` or `getClaims()`, which validate the token) rather than trusting a session read from cookies (`getSession()`), which the client could have tampered with. Check the current docs for the recommended call for your SSR setup.

## Keys and tokens

- **Publishable key in front ends; the service-role or secret key only on servers.** The secret key bypasses RLS entirely. Any environment variable with a public prefix (`NEXT_PUBLIC_`, `VITE_`, `PUBLIC_`) is shipped to the browser. Legacy `anon` keys exist only for compatibility.
- **Scripts, CI and agents use a scoped personal access token,** limited to the organizations, projects and permissions the task needs. A classic token (what the browser `supabase login` flow creates) carries the whole account. The personal access tokens guide lists the permission each Management API endpoint and MCP tool needs: look it up there, don't guess. In CI set `SUPABASE_ACCESS_TOKEN` to the scoped token; it takes precedence over a saved login. Commands that connect with the database password (`--password`, `SUPABASE_DB_PASSWORD`, as in `supabase db push`) are not limited by the token's scope.

## Storage

- **Storage access is RLS on `storage.objects`.** An upsert (replacing a file) needs `insert`, `select` and `update` policies; with `insert` alone new uploads work and replacements fail silently.
- **Scope storage policies by path** (a folder per user or tenant, checked against `auth.uid()`), the same way as table policies.

## Dependencies

Pin package versions and commit the lockfile for every Supabase package (`@supabase/supabase-js`, `@supabase/ssr`, `supabase-py` and the rest); follow the platform's npm security guide. For anything not covered here, read the product security index (`https://supabase.com/docs/guides/security/product-security.md`).

## Prove it

Test policies as each role, not as the dashboard's superuser. In SQL:

```sql
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub": "<user-a-uuid>", "role": "authenticated"}';
select count(*) from public.notes;                                    -- only user A's rows
update public.notes set body = 'x' where user_id = '<user-b-uuid>';   -- UPDATE 0
rollback;
```

Repeat as `anon`, as user B, and through every view and exposed function; then run the security advisor (WORKFLOW.md) and read every finding.
