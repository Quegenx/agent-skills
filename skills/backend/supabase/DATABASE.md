# Database: functions, triggers, connections, operations

Every project is a full Postgres database, and Auth, Storage, Realtime and Edge Functions are built on it. The Data API's mechanics and error codes are DATA-API.md. Servers and tools reach it through a direct connection or a pooler. Most outcomes are decided by which role a request runs as, what that role was granted, and which connection path it took. The security checklist for grants, RLS, views and definer functions is SECURITY.md; this file is the database around it.

**Contents:** [Dated changes to check first](#dated-changes-to-check-first) · [Database functions](#database-functions) · [Triggers](#triggers) · [Event triggers](#event-triggers) · [Database webhooks and pg_net](#database-webhooks-and-pg_net) · [Extensions](#extensions) · [Roles and privileges](#roles-and-privileges) · [Timeouts](#timeouts) · [Connecting from servers and tools](#connecting-from-servers-and-tools) · [Postgres configuration and disk](#postgres-configuration-and-disk) · [Advisors](#advisors) · [Replication and read replicas](#replication-and-read-replicas) · [Backups and PITR](#backups-and-pitr) · [Type generation](#type-generation) · [Debugging](#debugging) · [Prove it](#prove-it)

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
- **pg_net is beta;** function signatures may change. Enable with `create extension pg_net with schema "extensions";` (it creates its own `net` schema); disable with `drop extension if exists pg_net; drop schema net;`. Dropping it stops Database Webhooks.
- **Signatures:** `net.http_get(url text, params jsonb default '{}', headers jsonb default '{}', timeout_milliseconds int default 2000) returns bigint`; `net.http_post(url, body jsonb default '{}', params, headers default '{"Content-Type": "application/json"}', timeout_milliseconds default 2000)`; `net.http_delete(url, params, headers, timeout_milliseconds default 2000)`. All are SECURITY DEFINER; requests start only after the transaction commits; the POST body encoding matches `server_encoding`.
- **Limits:** up to 200 requests/second (reconfigurable from v0.12.0); webhooks execute the next 200 queued requests, so raise a webhook's timeout to avoid mass timeouts; responses kept 6 hours (`pg_net.ttl`) in the unlogged `net._http_response`, lost on crash; the queue `net.http_request_queue` deletes rows on execution; POST only with JSON; no PATCH or PUT; one database (`postgres`). Changing settings needs support to grant e.g. `grant alter system on parameter pg_net.ttl to postgres;`, then `alter system set pg_net.ttl to '24 hours'; select net.worker_restart();`.
- **The `net` tables leak secrets to login roles.** `net` grants `USAGE` to `PUBLIC`; `supabase_admin` owns it, so a `revoke` as `postgres` only prints `WARNING:  no privileges could be revoked for "net"` (the SQL Editor hides warnings). Roles with `login` (including `postgres`) can read and change queued rows, including `Authorization`/`apikey` headers and Vault-decrypted values in `headers`. RLS can't be added to them. `anon`/`authenticated` are `NOLOGIN` and `net` isn't exposed: never add `net` to the exposed schemas. Turning on Database Webhooks re-grants `usage` on `net` to `anon`, `authenticated`, `service_role`. A major Postgres upgrade or enabling pg_net 0.11 or earlier revokes `execute` on `net.http_get`/`net.http_post` from `PUBLIC` and grants it to `postgres`, `anon`, `authenticated`, `service_role`, `supabase_functions_admin`.
- **pg_net in `public`** (advisor finding) can't be moved: drop and recreate it in `extensions`, which deletes pending requests and stored responses. `42501 : permission denied for table http_request_queue`: make sure the queue is empty, then `drop extension pg_net; create extension pg_net schema extensions;`, else contact support.

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

## Connecting from servers and tools

| Use | Connect with |
|---|---|
| Frontend | Data API (needs RLS) |
| Serverless or edge | shared pooler, transaction mode |
| Persistent backend on IPv6 or with the IPv4 add-on | direct connection |
| Persistent backend on IPv4 only | shared pooler, session mode |
| BI and GUI tools | shared pooler, session mode |
| High performance on a paid plan | dedicated pooler |
| Migrations, `pg_dump`, backup and restore, replication | direct connection |

| Path | String | Port | IP | Username |
|---|---|---|---|---|
| Direct | `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres` | 5432 | IPv6; IPv4 with add-on | `postgres` |
| Shared pooler, session | `postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@[POOLER-HOST]:5432/postgres` | 5432 | IPv4 on every plan | `postgres.[PROJECT-REF]` |
| Shared pooler, transaction | same, port `6543` | 6543 | IPv4 on every plan | `postgres.[PROJECT-REF]` |
| Dedicated pooler (paid) | `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres` | 6543 | IPv6; IPv4 with add-on | `postgres` |

- **Copy strings from the Dashboard Connect dialog.** The shared pooler host is `aws-[INDEX]-[REGION].pooler.supabase.com`, where `[INDEX]` is a cluster index, not part of the region, and `aws-0` is not a safe default. A custom role through the shared pooler is `[ROLE].[PROJECT-REF]`. Percent-encode reserved password characters (`&`, `#`, `?`, space).
- **`Tenant or user not found`** (or `FATAL: (ENOTFOUND) tenant/user postgres.<project-ref> not found`) is a wrong host or username, not a password problem.
- **Ports:** 5432 is Postgres (direct) or Supavisor session mode; 6543 is PgBouncer (dedicated) or Supavisor transaction mode. An older troubleshooting page still says 6543 can be switched to session mode, and its pool field descriptions appear swapped; that predates the 2025-02-28 deprecation.
- **The IPv4 add-on isn't dual-stack:** enabling it swaps the AAAA record for an A record, so the endpoint becomes IPv4-only. It's a static ingress IP (outbound isn't static), Pro and above; each read replica gets its own; toggling causes under a minute of DNS downtime for direct connections; pausing, unpausing or toggling can change the address. Management API: `PATCH /v1/projects/$PROJECT_REF/billing/addons` with `{"addon_variant": "ipv4_default", "addon_type": "ipv4"}`. IPv4-only platforms include Retool, Vercel, GitHub Actions and Render; test IPv6 with `curl -6 https://ifconfig.co/ip` and resolve with `nslookup db.<PROJECT_REF>.supabase.co`.

### Transaction mode and prepared statements

- **Transaction mode doesn't support** prepared statements, query pipelining, `with hold` cursors across transactions, or session state (`set`/`reset`, session advisory locks, `listen`/`notify`, temp tables). Direct and session mode support all of them.
- **Turn prepared statements off:** Postgres.js/Drizzle `prepare: false`; Prisma `?pgbouncer=true`; asyncpg `statement_cache_size=0`; JDBC `prepareThreshold=0`; node-postgres omit `name`; Psycopg `prepare_threshold=None`. `prepared statement "XXX" already exists` comes from PgBouncer.
- **`postgres.js` pipelines by default,** which in transaction mode can hang queries or return mismatched rows.
- **Sporadic `cannot execute UPDATE in a read-only transaction` on 6543** is connection contamination: a client left `SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY` or `SET default_transaction_read_only = on` on a pooled backend. Use `BEGIN TRANSACTION READ ONLY;`, or run such scripts on 5432.

### Client setup

- **Serverless:** one client at module scope, pool size 1 (Postgres.js defaults to 10; Prisma to `1 + 2 * num_of_CPUs`), prepared statements off, SSL required:

```ts
import postgres from 'postgres'

export const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  prepare: false,
  ssl: 'require',
})
```

- **Vercel:** set `POSTGRES_URL` to the transaction pooler URI with `?workaround=supabase-pooler.vercel`. Stale sockets (`CONNECT_TIMEOUT`, hangs): use the Data API, a `SELECT 1` preflight with a short timeout, Fluid Compute `attachDatabasePool`, or retries.
- **SSL:** most drivers default to `prefer`; set `sslmode=require`, or `sslmode=verify-full` with `sslrootcert` pointing at the downloaded root certificate (`prod-ca-2021.crt`). SSL enforcement (Database Settings "Enforce SSL on incoming connections", Management API `PUT /v1/projects/$PROJECT_REF/ssl-enforcement` with `{"requestedConfig": {"database": true}}`, or CLI 1.37.0+ `supabase ssl-enforcement update --project-ref {ref} --enable-db-ssl-enforcement --experimental`) covers Postgres, Supavisor and PgBouncer and triggers a fast reboot; HTTP APIs always enforce SSL.
- **Network restrictions** apply to Postgres and the poolers, not to HTTPS APIs or supabase-js; with them on, Edge Functions lose direct database access (use supabase-js). Add both IPv4 and IPv6 CIDRs unless on the IPv4 add-on. CLI 1.22.0+: `supabase network-restrictions update --project-ref {ref} --db-allow-cidr 1.2.3.4/32 --append --experimental`; without `--append` it replaces; remove with `--db-allow-cidr 0.0.0.0/0 --db-allow-cidr ::/0`.
- **`connection refused` after failed attempts** is usually a temporary brute-force block: wait 30 minutes or contact support with your IP.

### Connection limits and pool size

| Compute | Direct | Pooler clients | Replication slots / WAL senders |
|---|---|---|---|
| Nano / Micro | 60 | 200 | 5 |
| Small | 90 | 400 | 5 |
| Medium | 120 | 600 | 5 |
| Large | 160 | 800 | 8 |
| XL | 240 | 1,000 | 24 |
| 2XL | 380 | 1,500 | 80 |
| 4XL | 480 | 3,000 | 80 |
| 8XL | 490 | 6,000 | 80 |
| 12XL | 500 | 9,000 | 80 |
| 16XL | 500 | 12,000 | 80 |

- **Budget:** direct + Supavisor backend + PgBouncer backend must stay below Postgres max connections, and Auth, Storage, PostgREST and the health checker draw from the same total. Pool size (Database Settings) is the most backend connections a pooler opens; Supavisor and PgBouncer read the same setting but apply it independently. The client limit comes from compute size and is hard-coded for Supavisor.
- **Supavisor pools per user + database + mode;** Storage is its own combination. With heavy PostgREST use keep pool size under 40% of max connections, otherwise up to 80%. Transaction mode opens connections as needed and closes ones idle for 5 minutes; session mode closes on release and can queue clients up to a minute; at least one hot connection stays while a client is connected. PostgREST, Realtime and Auth use internal poolers; PostgREST's pool size is in API settings.
- **`max_connections`** can be changed with `npx supabase --experimental --project-ref <PROJECT REF> postgres-config update --config max_connections=<INTEGER VALUE>`, but is then fixed and won't resize with compute.
- **Errors:** `too many connections for database "postgres"` means `datconnlimit` was changed from -1: `ALTER DATABASE postgres CONNECTION LIMIT DEFAULT;`. `remaining connection slots are reserved for non-replication superuser connections` / `sorry, too many clients already`: use the pooler, fewer connections or larger compute. `No more connections allowed (max_client_conn)`: fewer clients or bigger compute.
- **Monitor** in Observability reports (Database Connections, Dedicated Pooler and Shared Pooler Client Connections; not real-time), live with `pg_stat_activity` joined to `pg_stat_ssl`, or the Database Connections page (session states, blocking chains, terminate). `idle in transaction` holds locks indefinitely and `pg_cancel_backend` does nothing to it: use `pg_terminate_backend(pid)`. Find blockers with `pg_blocking_pids(a.pid)` from `pg_stat_activity` where `backend_type = 'client backend'`.

## Postgres configuration and disk

- **User-context settings** (`select * from pg_settings where context = 'user';`) are set per role or database in SQL, e.g. `alter database "postgres" set "statement_timeout" TO '60s';`. Through `supautils`, `postgres` can set at role level: `auto_explain.*`, `deadlock_timeout`, `log_duration`, `log_lock_waits`, `log_min_duration_statement`, `log_min_error_statement`, `log_min_messages`, `log_parameter_max_length`, `log_replication_commands`, `log_statement`, `log_temp_files`, `pg_stat_statements.*`, `pgaudit.*`, `pgrst.*`, `plan_filter.*`, `safeupdate.enabled`, `session_replication_role`, `track_functions`, `track_io_timing`, `wal_compression`.
- **System settings via CLI 1.69.0+:** `supabase postgres-config update --config shared_buffers=250MB --project-ref <project-ref> --experimental`; merges by default, `--replace-existing-overrides` replaces, `postgres-config delete --config a,b`, `--no-restart` defers. Changes permanently overwrite defaults (`reset all` won't revert) and override Supabase's per-compute tuning, so review them after compute changes; Owner or Administrator only. Restart-required: `max_connections`, `max_locks_per_transaction`, `max_logical_replication_workers`, `max_replication_slots`, `max_wal_senders`, `max_worker_processes`, `shared_buffers`, `track_activity_query_size`, `track_commit_timestamp`, `cron.log_statement`. A restart-required change (`pg_settings.context = 'postmaster'`) restarts the primary and replicas; some parameters must match on both, and `--no-restart` there can break a replica. Check with `select name, setting, context, pending_restart from pg_settings where ...;` and `select pg_postmaster_start_time();`.
- **Log defaults:** `log_statement` `ddl`, `log_min_duration_statement` `-1`, `cron.log_statement` `true`.
- **Version:** `show server_version;`.
- **Disk:** Pro and above auto-scale at 90% by +50% (at most +200 GB per step, one expansion per four hours, up to four changes per rolling 24 h); at 95% with the quota exhausted the project goes read-only; max Pro/Team disk 60 TB; disk can't shrink. Free goes read-only above 500 MB database size (1 GB disk); a new project uses about 40 to 60 MB.
- **Read-only mode** shows as `cannot execute INSERT in a read-only transaction` (25006) or `53100`, and lifts automatically below 95%. To free space by hand: `set session characteristics as transaction read write;`, delete, `vacuum;`, `set default_transaction_read_only = 'off';`.

## Advisors

Deterministic platform checks for health, security and performance. Run them in Studio (Health, Security, Performance Advisor), with MCP `get_advisors` (`type` `security` or `performance`), `supabase db advisors`, or the Management API (v1 security, v1 performance, v2 run project advisors). A finding may be intentional; health findings clear slowly because they measure error rates over time.

| Lint | Level | Finding |
|---|---|---|
| `log_data_api_error_rate_high` | | Data API 5xx rate on `/rest/v1` persistently high |
| `log_auth_error_rate_high` | | Auth error rate persistently high |
| `log_storage_error_rate_high` | | Storage error rate persistently high |
| `log_edge_function_error_rate_high` | | Edge Function error rate persistently high |
| `0001_unindexed_foreign_keys` | INFO | Unindexed foreign keys |
| `0002_auth_users_exposed` | ERROR | User data exposed through a view |
| `0003_auth_rls_initplan` | WARN | Slow security policy |
| `0004_no_primary_key` | INFO | Table has no primary key |
| `0005_unused_index` | INFO | Unused index |
| `0006_multiple_permissive_policies` | WARN | Multiple permissive policies on a table |
| `0007_policy_exists_rls_disabled` | INFO | Policy not enforced |
| `0008_rls_enabled_no_policy` | INFO | No access rules defined |
| `0009_duplicate_index` | WARN | Duplicate index |
| `0010_security_definer_view` | ERROR | View bypasses RLS |
| `0011_function_search_path_mutable` | WARN | Unsecured function search path |
| `0012_auth_allow_anonymous_sign_ins` | INFO | Anonymous sign-ins enabled |
| `0013_rls_disabled_in_public` | ERROR | Table publicly accessible |
| `0014_extension_in_public` | WARN | Extension in public schema |
| `0015_rls_references_user_metadata` | ERROR | Policy relies on user-editable data |
| `0016_materialized_view_in_api` | WARN | Materialized view exposed in API |
| `0017_foreign_table_in_api` | WARN | Foreign table exposed in API |
| `0018_unsupported_reg_types` | WARN | Column type blocks Postgres upgrades |
| `0019_insecure_queue_exposed_in_api` | ERROR | Queue exposed without protection |
| `0020_table_bloat` | WARN | Excess table bloat |
| `0021_fkey_to_auth_unique` | ERROR | Foreign key blocks Auth upgrades |
| `0022_extension_versions_outdated` | WARN | Extension out of date |
| `0023_sensitive_columns_exposed` | ERROR | Sensitive data publicly accessible |
| `0024_permissive_rls_policy` | WARN | Policy allows unrestricted access |
| `0025_public_bucket_allows_listing` | WARN | Public bucket contents listable through broad `SELECT` on `storage.objects` |
| `0026_pg_graphql_anon_table_exposed` | WARN | Object visible in GraphQL to the anon key |
| `0027_pg_graphql_authenticated_table_exposed` | WARN | Object visible in GraphQL to signed-in users |
| `0028_anon_security_definer_function_executable` | WARN | SECURITY DEFINER function callable without signing in |
| `0029_authenticated_security_definer_function_executable` | WARN | SECURITY DEFINER function callable by signed-in users |
| `0030_autovacuum_disabled` | INFO | Tables with `autovacuum_enabled=false` |

- **`0003`:** wrap `auth.uid()` and friends in a subquery, `using ( (select auth.uid()) = user_id )`, so it runs once per query (on 150,000 rows: over 3 seconds of overhead against microseconds).
- **`0011`:** pin `set search_path = ''` and fully qualify every reference.
- **`0010` / `0002`:** views default to security definer and bypass RLS; create them `with (security_invoker=on)` (Postgres 15+), or `alter view <name> set (security_invoker = true);`. Materialized views don't support RLS and need `refresh materialized view`.
- **`0015`:** `user_metadata` is user-editable (`updateUser({ data: { is_admin: true } })`); never use it in RLS.
- **`0021`:** Auth doesn't support user-defined FKs to non-primary-key unique constraints in `auth`; they block Auth migrations. Reference primary keys.
- **`0028` / `0029`:** PostgREST exposes every function the role can EXECUTE at `/rest/v1/rpc/<name>`; the Postgres default grants EXECUTE to PUBLIC, plus Supabase default privileges to `anon, authenticated, service_role`. Fix with `revoke execute on function public.my_priv_op(int, text) from anon, public;`, or `alter function ... security invoker;`, or keep it on purpose and validate inputs. Revoking from `anon` alone leaves it callable by every signed-up user: address both lints. Dropping `pg_graphql` doesn't fix it. The page's "prevent future auto-grants" line uses `in schema` (see the conflict under Database functions).
- **`0030`:** `ALTER TABLE public.orders RESET (autovacuum_enabled); VACUUM ANALYZE public.orders;`.

## Replication and read replicas

- **Three methods:** read replicas (Supabase Postgres copies); Pipelines (managed CDC over logical replication with the Supabase ETL engine, public alpha; destinations BigQuery, ClickHouse, DuckLake, Snowflake, all public alpha; uses `supabase_etl_admin`); manual logical replication to external tools. Read replicas live in Project Settings > Infrastructure; Database > Replication is for Pipelines destinations only.
- **Logical replication settings** `max_replication_slots`, `wal_keep_size`, `max_slot_wal_keep_size` (`-1` unlimited; a finite limit can invalidate a lagging slot) and `checkpoint_timeout` are CLI only. Pipelines needs one main slot plus a temporary slot per active table-sync worker. Slots retain WAL until consumers confirm.
- **Scale up before you add replicas.** Don't scale until CPU is sustained above 70%; optimize with `EXPLAIN ANALYZE` first; under about 80% reads, upgrade compute; replicas fit beyond 16XL or for isolation and geo-distribution.
- **Replicas are asynchronous and read-only.** Each has its own database and API endpoints (Connect panel / API settings "Source" dropdown) and its own Supavisor pool. They serve only REST `GET`; call read-only functions with `rpc(..., { get: true })`. Auth, Storage and Realtime can't use a replica endpoint.
- **The API load balancer** geo-routes GET Data API requests to the nearest database; non-GET goes to the primary; Auth always hits the primary; custom domains bypass the load balancer. Removing all replicas removes its endpoint. Logs: `Redirect Identifier` / `metadata.load_balancer_redirect_identifier`. Dashboard settings propagate to all databases.
- **Prerequisites:** Pro, Team or Enterprise on AWS, at least Small compute, Postgres 15+, not on legacy logical backups. Create in Infrastructure settings or `POST /v1/projects/$PROJECT_REF/read-replicas/setup` with `{"read_replica_region": "us-east-1"}`; remove with `/read-replicas/remove` and `database_identifier`. XL and above can have up to five, smaller up to two; replicas inherit the primary's compute size.
- **Lifecycle:** built from a physical backup plus WAL-G archives and streaming replication. On restart or compute change the primary goes first, then all replicas together. Project upgrades and data restores require removing all replicas first.
- **Lag:** Database Reports "Replica Information", the live value in Infrastructure Settings, metric `physical_replication_lag_physical_replica_lag_seconds`. Causes: access-exclusive locks (`drop table`, `reindex`), resource limits, long transactions on the primary. "Init failed" (e.g. 50+ GB under very high load) is safe to drop and retry, but keep it for support to investigate.

## Backups and PITR

- **Daily backups:** Pro keeps 7 days, Team 14, Enterprise up to 30. The database overview says daily backups run on every project, while the backups page lists them for Pro, Team and Enterprise only; check the current docs, and on Free export regularly with `supabase db dump`. Deleting a project deletes all its backups.
- **What's in a backup:** projects on Postgres `15.8.1.079`+ use physical backups. Backups exclude Storage API objects and custom role passwords (reset them after a restore).
- **Restoring takes the project offline** for a time that scales with size. Pick the closest backup before the target. Management API: `GET /v1/projects/$PROJECT_REF/database/backups`, `POST /v1/projects/$PROJECT_REF/database/backups/restore-pitr` with `{"recovery_time_target_unix": "1735689600"}`. First drop subscriptions and replication slots (Realtime's is handled): `SELECT * FROM pg_replication_slots; SELECT * FROM pg_subscription; DROP SUBSCRIPTION <subscription>; SELECT pg_drop_replication_slot(slot_name);`.
- **PITR** is an add-on on Pro, Team and Enterprise with at least Small compute: a WAL-G physical snapshot plus WAL uploaded every two minutes (or sooner past a size threshold), worst-case RPO two minutes; an idle database uploads no WAL, so the latest restore point can trail the clock. The backups page says the snapshot is daily, a troubleshooting page says full backups are weekly; check the current docs. Enabling PITR stops Daily Backups; after disabling it, backups stay physical and aren't downloadable, so use `supabase db dump` or `pg_dump`.
- **Manual backup with the CLI:**

```bash
supabase db dump --db-url [CONNECTION_STRING] -f roles.sql --role-only
supabase db dump --db-url [CONNECTION_STRING] -f schema.sql
supabase db dump --db-url [CONNECTION_STRING] -f data.sql --use-copy --data-only -x "storage.buckets_vectors" -x "storage.vector_indexes"
```

  Restore with `psql --single-transaction --variable ON_ERROR_STOP=1 --file roles.sql --file schema.sql --command 'SET session_replication_role = replica' --file data.sql --dbname [CONNECTION_STRING]`. Enable Webhooks and non-default extensions on the new project first; re-enable Realtime publications after. For Vault/pgsodium, copy the 64-character hex root key via `GET/PUT https://api.supabase.com/v1/projects/$REF/pgsodium` before pausing or deleting the old project. Dump the `supabase_migrations` schema to keep migration history. That page's "direct connection string" uses `postgres.[PROJECT-REF]` at `db.[PROJECT-REF].supabase.com`, unlike the connect guide's `postgres` at `db.[PROJECT-REF].supabase.co`; copy the string from the Connect dialog.

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
- **Connections:** the client connects with the string from the Connect dialog on the mode its runtime needs (prepared statements off in transaction mode), and `pg_stat_activity` shows no growing `idle in transaction` sessions.
- **Advisors:** `supabase db advisors` or MCP `get_advisors` for `security` and `performance` report nothing new, every remaining finding read and justified.
- **Types:** regenerating `database.types.ts` produces no diff against the committed file.
- **Backups:** on Free, a `supabase db dump` of roles, schema and data restores into a fresh project with the `psql --single-transaction` command above.
