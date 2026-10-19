# Database: connections and operations

Moved unchanged from [DATABASE.md](DATABASE.md) to keep each file under the size cap. Connecting from servers and tools, Postgres configuration and disk, advisors, replication and read replicas, and backups and PITR

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

## Prove it

- **Connections:** the client connects with the string from the Connect dialog on the mode its runtime needs (prepared statements off in transaction mode), and `pg_stat_activity` shows no growing `idle in transaction` sessions.
- **Advisors:** `supabase db advisors` or MCP `get_advisors` for `security` and `performance` report nothing new, every remaining finding read and justified.
- **Backups:** on Free, a `supabase db dump` of roles, schema and data restores into a fresh project with the `psql --single-transaction` command in [Backups and PITR](#backups-and-pitr).
