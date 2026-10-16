# Tenant isolation

In a shared database, the one bug that ends a business is tenant A seeing tenant B's data. Two independent layers keep it from happening: the application scopes every query, and the database refuses rows from the wrong tenant even when the application forgets.

## Layer 1: the application scopes every query

- **Resolve the tenant from the verified identity** (a claim in the access token, the membership table), never from a header, subdomain or body field the client controls, unless that value is checked against the user's memberships.
- **Put the predicate in one place:** a repository or query helper that always adds `tenant_id = $tenant`, so handlers can't forget it. Raw SQL, bulk updates and admin reports are where it gets skipped, which is why layer 2 exists.
- **Scope lookups by ID too:** `where id = $1 and tenant_id = $2`. Another tenant's row is "not found", not "forbidden" (no enumeration).
- **Include the tenant in cache keys, file paths, queue messages and search indexes;** isolation that stops at the database leaks through everything derived from it.

## Layer 2: Postgres row-level security

A policy is a predicate Postgres adds to every statement on the table, for every role that isn't exempt. The application never sees it, so it can't forget it.

```sql
alter table invoices enable row level security;
alter table invoices force row level security;            -- the table owner is subject to it too

create policy tenant_isolation on invoices
  using      (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)   -- which rows reads, updates, deletes reach
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);  -- which rows inserts and updates may write
```

- **RLS fails closed:** with RLS enabled and no policy that applies, the table is empty for everyone who isn't exempt.
- **`using` guards what is read, `with check` what is written.** `using` decides which existing rows `select`, `update` and `delete` see; `with check` decides which new row versions `insert` and `update` may write. An `insert` policy has only `with check` (`create policy tenant_writes on invoices for insert with check (...)`), so a tenant can't plant rows in another tenant's data that it could never read back.
- **`nullif(..., '')` fails closed:** a request that never set the tenant matches no rows, instead of erroring in a way someone "fixes" by matching everything.
- **The application must not connect as an exempt role.** Superusers, roles with `bypassrls` and (without `force`) the table owner skip policies. Run migrations as an owner role and serve requests as a role that owns nothing and has only the grants it needs; that also keeps `drop policy` out of the application's reach.
- **Set the tenant per transaction, on the connection actually used.** With a connection pool, a value set at the start of a request may land on a different connection than the next query, and a session-level value left on a pooled connection leaks into the next request. Set it inside each transaction with the transaction-local form:

```ts
export async function withTenant<T>(tenantId: string, work: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.query(`select set_config('app.tenant_id', $1, true)`, [tenantId]);   // true: ends with this transaction
    return work(tx);
  });
}
```

  This also works behind transaction-mode poolers (PgBouncer, Supabase's pooled connection), where session state can't be trusted at all.
- **Never keep the tenant in a long-lived object.** A pooled or cached client, ORM context or singleton that captured the first request's tenant serves it to every later request; resolve the tenant per request and pass it in.
- **What the policy does to bypass attempts:** a query that skips the application filter reads only the current tenant's rows; an update or delete by primary key on another tenant's row affects zero rows (some ORMs then report a concurrency conflict, which is misleading); an insert carrying another tenant's ID fails with a policy violation.
- **What it can't do:** decide which tenant is right. If layer 1 resolves the wrong tenant, the policy faithfully enforces the wrong one.
- **Cost:** one extra statement per transaction and a predicate the planner handles like any other; index `tenant_id` (usually as the leading column of composite indexes).
- **Cross-tenant work** (backups, billing runs, support tooling) uses a separate role with `bypassrls`, used only by those jobs and audited.

## Supabase

The full platform checklist (Data API grants, views and `security definer` functions that bypass RLS, update policies, storage, keys) is the `supabase` skill's SECURITY.md.

Every table exposed through the API needs RLS enabled with policies, because the browser talks to the database through it (the anonymous and authenticated roles are subject to policies; the service-role key bypasses them and stays on servers).

```sql
create policy "members read their tenant's projects" on projects
  for select to authenticated
  using (tenant_id in (select tenant_id from memberships where user_id = (select auth.uid())));
```

- **Wrap `auth.uid()` and `auth.jwt()` in `(select ...)`** so Postgres evaluates them once per statement instead of once per row; on large tables that is the difference between fast and unusable.
- **Tenant or role claims come from `app_metadata`** (server-written), never `user_metadata`, which users can edit.
- **Write separate policies per command** (`select`, `insert`, `update`, `delete`) with both `using` and `with check` where rows are written, and index the columns policies filter on.
- **Test policies as each role:** in SQL, `set local role authenticated; set local request.jwt.claims = '{"sub": "..."}'`, then try another tenant's rows; or use two real test users through the client.

## Prove it

Two tenants with data. As tenant A: list everything (only A's rows), fetch B's row by ID (not found), update and delete B's row by ID (zero rows), insert a row with B's tenant ID (rejected), run a raw query that skips the application filter (only A's rows). Then make a request that sets no tenant: it sees nothing. Repeat on a pooled connection that previously served tenant B.
