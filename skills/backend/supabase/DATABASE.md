# Database: functions, triggers, connections, operations

Every project is a full Postgres database, and Auth, Storage, Realtime and Edge Functions are built on it. The Data API's mechanics and error codes are DATA-API.md. Servers and tools reach it through a direct connection or a pooler. Most outcomes are decided by which role a request runs as, what that role was granted, and which connection path it took. The security checklist for grants, RLS, views and definer functions is SECURITY.md; this file is the database around it.

**Contents:** [Dated changes to check first](#dated-changes-to-check-first) · [Database functions](#database-functions) · [Triggers](#triggers) · [Event triggers](#event-triggers) · [Database webhooks and pg_net](#database-webhooks-and-pg_net) · [Extensions](#extensions) · [Roles and privileges](#roles-and-privileges) · [Timeouts](#timeouts) · [Connecting from servers and tools](DATABASE-OPERATIONS.md#connecting-from-servers-and-tools) · [Postgres configuration and disk](DATABASE-OPERATIONS.md#postgres-configuration-and-disk) · [Advisors](DATABASE-OPERATIONS.md#advisors) · [Replication and read replicas](DATABASE-OPERATIONS.md#replication-and-read-replicas) · [Backups and PITR](DATABASE-OPERATIONS.md#backups-and-pitr) · [Type generation](#type-generation) · [Debugging](#debugging) · [Prove it](#prove-it)

## Dated changes to check first

| Date | Change |
|---|---|
| 2024-01-24 | Supavisor enforces Network Restrictions. |
| 2025-02-28 | Supavisor deprecated Session Mode on port 6543: 6543 is transaction mode only, session mode is on 5432. |
| 2025-03-25 | Dedicated Pooler (PgBouncer) GA on Pro and above. |
| 2025-04-04 | The read replica load balancer geo-routes GET requests to the nearest database (previously round-robin). |
| 2026-05-18 | `pg_graphql` no longer enabled by default. |
| 2026-09-18 | Health Check Advisors added. |

## Database functions

- **Use database functions for data-intensive work** (callable from the REST and GraphQL APIs) and Edge Functions for low-latency, globally distributed TypeScript. Call them with `rpc()`.

```sql
create or replace function add_planet(name text)
returns bigint
language plpgsql
as $$
declare
  new_row bigint;
begin
  insert into planets(name)
  values (add_planet.name)
  returning id into new_row;

  return new_row;
end;
$$;
```

- **Shape:** `returns void` for nothing; languages `sql`, `plpgsql`, `plpython` and others; the function returns its final query's result, which can be an `insert`/`update`/`delete ... returning`. Reference an argument as `add_planet.name` in plpgsql to disambiguate it from the column.
- **Calling:** `const { data, error } = await supabase.rpc('add_planet', { name: 'Jakku' })` (named object). Other clients: Dart `supabase.rpc('hello_world')`, Swift `try await supabase.rpc("hello_world").execute()`, Kotlin `supabase.postgrest.rpc("hello_world")`, Python `supabase.rpc('hello_world').execute()`, C# `await supabase.Rpc("hello_world", null);`.
- **A `returns setof <table>` function filters like a table:** `supabase.rpc('get_planets').eq('id', 1)`. `rpc` returns a filter builder (`.eq()`, `.single()`, `.order()`, `.limit()`, `.abortSignal()`), and takes `{ head, get, count }`; `get: true` sends a GET for read-only functions (`supabase.rpc('hello_world', undefined, { get: true })`). Cross-schema with failed inference: `supabase.schema('schema_b').rpc('function_a', {}).overrideTypes<...>()`.
- **Queries too complex for the client** (many joins) go in a `returns table (...)` plpgsql function called with `supabase.rpc("get_my_complex_query", { parameter: 1 })`.
- **Overloaded functions aren't supported:** give every function a unique name (`PGRST203` otherwise).
- **Use snake_case.** camelCase identifiers must be double-quoted at definition and at every use, and you will forget.

### Security definer, search_path and execute privileges

- **Prefer `security invoker` (the default).** With `security definer`, set `search_path`:

```sql
create or replace function hello_world()
returns text
language plpgsql
security definer set search_path = ''
as $$
begin
  return 'hello world';
end;
$$;
```

  With `search_path = ''`, schema-qualify every relation (`from public.table`).
- **A definer function owned by `postgres` bypasses RLS and any role can call it, including `anon`.** Functions made in the Dashboard or by a migration are owned by `postgres`. Pinning `search_path` doesn't change who can call it. For per-user data, check ownership in the body (granting execute to `authenticated` still returns any user's row to every signed-in caller) and narrow the execute privilege.
- **Definer functions used inside RLS policies** need not be in Exposed Schemas or Extra Search Path if the policy uses the schema-qualified name (e.g. `security.rls_func`).
- **Functions are executable by PUBLIC by default.** Revoke from both `public` and the role:

```sql
revoke execute on function public.hello_world from public;
revoke execute on function public.hello_world from anon;
```

  For all existing and future functions:

```sql
revoke execute on all functions in schema public from public;
revoke execute on all functions in schema public from anon, authenticated;

alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon, authenticated;

grant execute on function public.hello_world to authenticated;
```

- **Conflict on future PUBLIC execute:** the functions guide uses `alter default privileges in schema public revoke execute on functions from public;`, but a troubleshooting page says a default privilege set `in schema` can't remove the PUBLIC default for functions ("Postgres adds schema defaults to the global ones") and uses the global form `alter default privileges for role postgres revoke execute on functions from public;`. Check the current docs, and verify with `select defaclrole::regrole as owner, defaclnamespace::regnamespace as schema, defaclacl from pg_default_acl where defaclobjtype = 'f';`.
- **Verify a revoke:** `begin; set local role anon; select foo();` must give `ERROR:  permission denied for function foo`.

### Raising errors from RPC functions

- **Never `raise exception using errcode = '40001'`** (serialization_failure): PostgREST treats it as transient and retries, flooding logs and splitting one request into several transactions (bug in PostgREST 14, fixed in 16). Use plain `raise exception 'MSG'` (SQLSTATE `P0001`, HTTP 400) or the `PT` prefix, e.g. `raise sqlstate 'PT409' using message = 'YOUR_ERROR_MESSAGE';` for HTTP 409. Kill looping backends by hand (`select pid, state, query_start, query from pg_stat_activity where usename = 'authenticator'`, then `pg_terminate_backend(pid)`) or restart the project.

### Debugging functions

- **`raise` writes to the Postgres logs.** Three levels show by default: `raise log 'logging message: %', log_message;`, `raise warning ...`, `raise exception ...` (ends the function and reverts the transaction). `assert <condition>, 'message';` checks values; `exception when others then raise exception '...: %', sqlerrm;` rewrites errors; log a whole row with `to_jsonb(some_table.*)`.
- **`EXPLAIN ANALYZE` on a function shows only a function scan.** Use the pre-installed `auto_explain` in a rolled-back transaction:

```sql
begin;

set local auto_explain.log_min_duration = '0';       -- log all query plans
set local auto_explain.log_analyze = true;           -- use explain analyze
set local auto_explain.log_buffers  = true;          -- use explain (buffers)
set local auto_explain.log_nested_statements = true; -- log query plans in functions

select example_func(); ---<--ADD YOUR FUNCTION HERE

rollback;
```

  Plans appear in the Postgres logs starting with "duration:". Don't set a role-level `log_min_duration` below `1s` for long. Find them in Logs Explorer:

```sql
select
  timestamp,
  event_message as query_and_plan,
  log_attributes['parsed.user_name'] as user_name,
  log_attributes['parsed.context'] as context
from logs
where
  source = 'postgres_logs'
  and match(event_message, 'duration:')
  and match(log_attributes['parsed.context'], '(?i)FUNCTION_NAME')
order by timestamp desc
limit 100;
```

## Triggers

- **A trigger is a trigger function plus the trigger object,** firing on INSERT, UPDATE, DELETE or TRUNCATE.

```sql
create function update_salary_log()
returns trigger
language plpgsql
as $$
begin
  insert into salary_log(employee_id, old_salary, new_salary)
  values (new.id, old.salary, new.salary);
  return new;
end;
$$;

create trigger salary_update_trigger
after update on employees
for each row
execute function update_salary_log();
```

- **Variables:** `TG_NAME`, `TG_WHEN` (BEFORE/AFTER), `TG_OP`, `OLD` (UPDATE/DELETE), `NEW` (UPDATE/INSERT), `TG_LEVEL` (ROW/STATEMENT), `TG_RELID`, `TG_TABLE_NAME`, `TG_TABLE_SCHEMA`, `TG_ARGV`, `TG_NARGS`.
- **`NEW` and `OLD` are null unless it's a ROW trigger, and the Dashboard UI defaults to STATEMENT.** `for each row` runs once per affected row; `for each statement` runs once per operation and is cheaper for multi-row statements.
- **Drop** with `drop trigger "trigger_name" on "table_name";`. A trigger in a restricted schema can't be dropped for lack of permission: back up the function it depends on, then `drop function if exists restricted_schema.function_name() cascade;`.

### Triggers on auth.users

- **A trigger on `auth.users` runs in the signup transaction, so its errors block signups.** "Database error saving new user" usually comes from such a trigger, an unmet constraint added on `auth.users`, or Prisma having broken permissions on `auth.users`. Read the Auth logs, then the Postgres logs. Example: a `public.handle_new_user()` trigger inserting into a missing `profiles` table gives `relation "profiles" does not exist (SQLSTATE 42P01)` with context `PL/pgSQL function public.handle_new_user() line 3 at SQL statement`.
- **Expose user data through a `public.profiles` table filled by a trigger on `auth.users`,** not a view over `auth.users`. Write the trigger function as a definer function with `search_path = ''` (the advisors page's sample uses `search_path = public` and inserts a column its table doesn't define; don't copy it).
- **Don't insert users into `auth.users` with SQL** (or let an AI tool do it): columns like `confirmation_token` stay NULL where Auth expects `''`, giving `500: Database error querying schema ... converting NULL to string is unsupported`. Fix: `update auth.users set confirmation_token = '' where confirmation_token is null;`.
- **Dashboard `invalid byte sequence for encoding "UTF8": 0x00` on the Triggers or Webhooks pages** means `standard_conforming_strings` is off: `ALTER DATABASE postgres SET standard_conforming_strings = on;`, wait a few minutes for pooled connections, restart if it persists.

## Event triggers

- **Only the `postgres` user can create event triggers** (enabled by the `Supautils` extension, installed on all projects). Events: `ddl_command_start`, `ddl_command_end`, `sql_drop` (before `ddl_command_end` for DROP; altering a table can cause a drop), `table_rewrite` (before `ALTER TABLE` rewrites). They run for every DDL command and can cost performance.
- **Example, block table drops:**

```sql
CREATE OR REPLACE FUNCTION dont_drop_function()
  RETURNS event_trigger LANGUAGE plpgsql AS $$
DECLARE
    obj record;
    tbl_name text;
BEGIN
    FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
    LOOP
        IF obj.object_type = 'table' THEN
            RAISE EXCEPTION 'ERROR: All tables in this schema are protected and cannot be dropped';
        END IF;
    END LOOP;
END;
$$;

CREATE EVENT TRIGGER dont_drop_trigger
ON sql_drop
EXECUTE FUNCTION dont_drop_function();
```

- **Example, auto-enable RLS on new tables:** a `SECURITY DEFINER SET search_path = pg_catalog` function loops over `pg_event_trigger_ddl_commands()` where `command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')` and `object_type IN ('table','partitioned table')`, running `format('alter table if exists %s enable row level security', cmd.object_identity)`; register it with `CREATE EVENT TRIGGER ensure_rls ON ddl_command_end WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO') EXECUTE FUNCTION rls_auto_enable();`. It covers only tables created after it exists.
- **Disable / drop:** `ALTER EVENT TRIGGER dont_drop_trigger DISABLE;` / `DROP EVENT TRIGGER dont_drop_trigger;`.

## Database webhooks and pg_net

- **Webhooks are triggers that call `pg_net`:** they fire after INSERT, UPDATE or DELETE, asynchronously, so a slow endpoint doesn't block the write. HTTP only, `POST` or `GET` with a JSON payload. Create in Integrations > Webhooks or SQL (arguments: URL, method, headers JSON, params JSON, timeout ms):

```sql
create trigger "my_webhook" after insert
on "public"."my_table" for each row
execute function "supabase_functions"."http_request"(
  'http://host.docker.internal:3000',
  'POST',
  '{"Content-Type":"application/json"}',
  '{}',
  '1000'
);
```

- **Payloads:**

```typescript
type InsertPayload = { type: 'INSERT'; table: string; schema: string; record: TableRecord<T>; old_record: null }
type UpdatePayload = { type: 'UPDATE'; table: string; schema: string; record: TableRecord<T>; old_record: TableRecord<T> }
type DeletePayload = { type: 'DELETE'; table: string; schema: string; record: null; old_record: TableRecord<T> }
```

- **Locally, `localhost` is the Postgres container:** use `host.docker.internal` (or the machine's IP), e.g. `http://host.docker.internal:54321/functions/v1/my-function-name`.
- Read [pg_net installation, API and limits](CRON-AND-QUEUES.md#pg_net-async-http-from-sql), [queued-credential security](CRON-AND-QUEUES.md#pg_net-security) and [worker/error diagnosis](CRON-AND-QUEUES.md#pg_net-debugging).

## Extensions

- **Enable** in Database > Extensions or `create extension pgtap with schema extensions;`; disable with `drop extension pgtap;`. Over 50 come pre-configured; pure SQL extensions install through the SQL Editor, others via database.dev. Procedural languages install into `pg_catalog`.
- **Most install into `extensions`, which `public` can use.** Don't create other objects there. To restrict an extension's tables, install it in a separate schema. Some require their own schema (`postgis_tiger_geocoder` creates `tiger`): avoid clashing names.
- **New extension versions need a software upgrade** (or server restart) in General Settings.

## Roles and privileges

| Role | Used by |
|---|---|
| `postgres` | default admin; Dashboard (queries carry `-- source: dashboard`) and external tools |
| `anon` | API requests when not signed in |
| `authenticator` | PostgREST: validates the JWT and switches to another role |
| `authenticated` | API requests when signed in |
| `service_role` | API role that bypasses RLS |
| `supabase_auth_admin` | Auth, scoped to `auth` |
| `supabase_storage_admin` | Storage, scoped to `storage` |
| `supabase_etl_admin` | Pipelines: read-all, replication, bypasses RLS, can create event triggers, writes to `etl` |
| `supabase_replication_admin` | read replica sync |
| `supabase_admin` | internal admin for upgrades and automation; Realtime and project config |
| `dashboard_user` | Dashboard |

- **No superuser access:** `COPY ... FROM PROGRAM` and `ALTER USER ... WITH SUPERUSER` are unsupported.
- **One role per external service** (it shows in `pg_stat_statements`): `create role "role_name" with login password 'extremely_secure_password';`. Percent-encode special characters in connection strings (`p%3Dword`). Changing the `postgres` password causes no downtime; Supabase services update themselves, hardcoded external services don't.
- **A custom role still inherits PUBLIC grants:** `connect` and `temporary` on the `postgres` database (revocable, but revoking `connect` disconnects Data API, Auth and Storage); `usage` on `public` and `execute` on functions created there (revocable); the `net` schema and large-object functions (not revocable); system catalog reads. `auth`, `storage`, `extensions`, `vault`, `cron` grant no `usage` to PUBLIC. `noinherit` doesn't affect PUBLIC grants. Helper functions outside `public` used in RLS need an explicit `grant execute ... to authenticated`.
- **A custom role is subject to RLS** on tables it doesn't own unless it has `bypassrls`; owners bypass unless `force row level security`. Never grant membership in `postgres` or Supabase roles. `default_transaction_read_only` and `search_path` don't restrict a role; sessions can change them.
- **Delete a role:** `GRANT <role> TO "postgres"; REASSIGN OWNED BY <role> TO postgres; DROP OWNED BY <role>; DROP role <role>;`.
- **`FATAL: (EAUTHQUERY) unsupported or invalid secret format`** on Supavisor: the custom role's `VALID UNTIL` expired; `ALTER ROLE example_role VALID UNTIL 'infinity';`.

## Timeouts

| Role | Default `statement_timeout` |
|---|---|
| `anon` | 3s |
| `authenticated` | 8s |
| `service_role` | none (falls back to `authenticator`'s 8s) |
| `postgres` | none (capped by the global default of 2min) |

- **Dashboard and client queries cap at 60 seconds** (configurable maximum); the SQL Editor has a 1-minute limit. Longer work goes through the session pooler (5432) or a direct connection.
- **Where to set it:** session `set statement_timeout = '10min';` (session pooler or direct only; not the Dashboard, the client API or transaction mode on 6543); function `... language sql set statement_timeout TO '4s';` (works through REST); role `alter role example_role set statement_timeout = '10min';` then `NOTIFY pgrst, 'reload config';` (may need a quick reboot; check with `select rolname, rolconfig from pg_roles where rolname in (...)`, not `SHOW`); global `alter database postgres set statement_timeout TO '4s';`.
- **Long tasks:** psql over the session pooler or direct connection, `set statement_timeout = '120min';` or `'0'` to disable; optionally upsize compute temporarily.
- **Find timeouts** in Logs Explorer with `match(event_message, 'duration|statement timeout')`; the Query Performance page shows only slow queries that succeeded.

**Moved:** connecting from servers and tools, Postgres configuration and disk, advisors, replication and read replicas, and backups and PITR is now in [DATABASE-OPERATIONS.md](DATABASE-OPERATIONS.md).

## Type generation

- **Generate** from the Dashboard or the CLI (v1.8.1+, `npm i supabase@">=1.8.1" --save-dev`, `npx supabase login`, `npx supabase init`):

```bash
npx supabase gen types typescript --project-id "$PROJECT_REF" --schema public > database.types.ts
npx supabase gen types typescript --local > database.types.ts
npx supabase gen types typescript --db-url postgres://postgres.[POOLER_TENANT_ID]:[POSTGRES_PASSWORD]@[your-domain-or-ip]:5432/postgres --schema public > database.types.ts
```

- **Shape:** `Database['public']['Tables'][name]` with `Row` (select), `Insert` (generated columns `?: never`, `not null` without default required, nullable optional), `Update` (all optional), and a `Json` alias. Use `createClient<Database>(URL, KEY)`; shorthands `Tables<'movies'>`, `Enums<...>`. `QueryData<typeof query>` infers nested join results; `QueryError` and `QueryResult` come from `@supabase/supabase-js`.
- **Overrides:** views may type columns as nullable; fix with type-fest `MergeDeep` (needs `strictNullChecks: true`). From supabase-js v2.48.0, custom JSON column types via `MergeDeep` give typed `->`/`->>` selectors. Per response: `.overrideTypes<Array<{ id: string }>>()` (merge) or `{ merge: false }` (replace).
- **Custom schemas** must be in the generated types (`--schema`, comma-separated); type `db.schema` with `createClient<Database, 'myschema'>`.
- **Keep types in sync** with a scheduled CI job running `npx supabase gen types --lang=typescript --project-id "$PROJECT_REF" > database.types.ts` with `SUPABASE_ACCESS_TOKEN` (e.g. cron `'0 0 * * *'`). supabase-js 2.46.2-rc.3 changed embedding inference (single vs array, nullability) and may need regenerated types.
- **Flags** (from the CLI's development branch, which may describe an unreleased version; confirm with `supabase gen types --help`): `--local`, `--linked`, `--project-id`, `--db-url`, `--lang` (`typescript` default, `go`, `swift`, `python`), `--schema`/`-s`, `--swift-access-control` (`internal` default, `public`, `private`, `package`), `--query-timeout` (15s default on explicit project paths), `--postgrest-v9-compat` (needs `--db-url`). `--linked`/`--project-id` TypeScript is generated server-side, and locally a NOT NULL jsonb column becomes `NonNullable<Json>`, so local and remote output can differ.

## Debugging

- **Logs Explorer** (SQL Editor with source **Logs**) runs ClickHouse SQL: no `*` for columns, at most 1000 rows per run, use `match()`. Postgres events have `source = 'postgres_logs'`, fields via `log_attributes['parsed.<field>']`: `query`, `command_tag`, `internal_query`, `error_severity`, `detail`, `sql_state_code`, `hint`, `context`, `session_id`, `connection_from`, `user_name`, `application_name`, `database_name`, `process_id`, `backend_type` (`client backend` vs workers like pg_net, pg_cron).
- **Filter by role** to find the caller: `authenticator` is the Data API, `supabase_auth_admin` Auth, `supabase_storage_admin` Storage, `postgres` the Dashboard (with `-- source: dashboard`) and external tools.
- **`supabase inspect db`** with `bloat`, `vacuum-stats`, `table-record-counts`, `table-sizes`, `index-sizes`, `table-index-sizes`, `cache-hit`, `unused-indexes`, `index-usage`, `seq-scans`, `long-running-queries`, `outliers`, `locks`, `blocking`, `role-connections`, `replication-slots` (also `calls`, `db-stats`, `index-stats`): works on any Postgres via `--db-url`, or automatically after `supabase link --project-ref <project-id>`; some need `pg_stat_statements`, whose counters are cumulative since the last reset. Also the Explorer source **Database** and MCP `execute_sql`.
- **Slow queries:** index `where`, `join` and `order by` columns; `explain`; BRIN for monotonically increasing columns (10x+ smaller); partial and composite indexes; `analyze`; the `index_advisor` extension.
- **HTTP API 5xx or timeouts** usually mean under-provisioned compute. A restart terminates workloads and restarts every database including replicas. The Disk IO budget drains and refills daily.
- **Tests:** pgTAP files in `supabase/tests/database/*.sql`, run with `supabase test db` (CLI v1.11.4+).

## Prove it

- **Functions:** `begin; set local role anon; select foo();` gives `permission denied for function foo` for every function `anon` shouldn't call; the same as `authenticated` for internal ones; `pg_default_acl` shows the intended default for `defaclobjtype = 'f'`.
- **Triggers on `auth.users`:** a test signup succeeds and the Auth and Postgres logs show no error.
- **Webhooks:** `select * from net._http_response where "status_code" >= 400 or "error_msg" is not null order by "created" desc;` returns nothing new, and `select pid from pg_stat_activity where backend_type ilike '%pg_net%';` returns a worker (else `select net.worker_restart();`). Rows with only `id`, `error_msg`, `created` filled are the timeout bug patched in pg_net v0.11 (Postgres 15.6.1.135+).
- **Types:** regenerating `database.types.ts` produces no diff against the committed file.
