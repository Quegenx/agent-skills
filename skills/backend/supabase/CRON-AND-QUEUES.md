# Cron, Queues and pg_net

Background work on Supabase runs inside Postgres: Supabase Cron (the `pg_cron` extension) schedules jobs, Supabase Queues (the `pgmq` extension) holds durable messages, and `pg_net` sends HTTP requests from SQL, which is how a job or trigger reaches an Edge Function. Most outcomes are decided by three mechanisms: every cron job takes a database connection and keeps its history until you delete it, a queue message stays invisible only for its visibility timeout and reappears unless deleted or archived, and a `pg_net` request is a row in an unlogged queue table that starts only after the transaction commits and that every connecting role can read, headers included.

**Contents:** [Version gates](#version-gates) · [Cron: how it works](#cron-how-it-works) · [Cron: install and remove](#cron-install-and-remove) · [Cron: schedules](#cron-schedules) · [Cron: the SQL API](#cron-the-sql-api) · [Cron: examples](#cron-examples) · [Cron: calling an Edge Function](#cron-calling-an-edge-function) · [Cron: limits and timeouts](#cron-limits-and-timeouts) · [Cron: run history](#cron-run-history) · [Cron: debugging](#cron-debugging) · [Queues: how they work](#queues-how-they-work) · [Queues: the pgmq API](#queues-the-pgmq-api) · [Queues: exposing them to clients](#queues-exposing-them-to-clients) · [Queues: permissions and RLS](#queues-permissions-and-rls) · [Queues: consumers](#queues-consumers) · [pg_net: async HTTP from SQL](#pg_net-async-http-from-sql) · [pg_net: security](#pg_net-security) · [pg_net: debugging](#pg_net-debugging) · [The full pattern: trigger, queue, cron, pg_net, Edge Function](#the-full-pattern-trigger-queue-cron-pg_net-edge-function) · [Local development, migrations, restores](#local-development-migrations-restores) · [Prove it](#prove-it)

## Version gates

| Feature | Needs |
|---|---|
| Seconds schedules (`30 seconds`) | Postgres 15.1.1.61+ |
| pg_cron 1.6.4 (many bug fixes, auto-revive) | Postgres 15.6.1.122+; 1.6.4 is the current version on Supabase |
| `pgmq` | Postgres 15.6.1.143+ |
| pgmq 1.5.1 (breaking for `delay`, below) | New projects on Postgres 17.6.1.016+ |
| `pg_net` timeout bug fix (v0.11) | Postgres 15.6.1.135+ |
| `net.worker_restart()` | pg_net 0.8+ |
| Reconfiguring pg_net settings | pg_net 0.12.0+ |
| Native local runtime running cron jobs in background workers | CLI 2.121.0+ |

## Cron: how it works

- **Jobs live in Postgres.** The extension creates a `cron` schema; every job is a row in `cron.job` and every run, with its status, a row in `cron.job_run_details`. Create jobs in SQL or in the Dashboard (Integrations > Cron). Schedules range from every second to once a year.
- **Four job types:** a SQL snippet (reports, cleaning stale data, refreshing materialized views), a database function (batch processing, periodic maintenance, multi-step updates in transactions), an HTTP request (external workflows, third-party sync, notifications) and an Edge Function (embeddings, emails, pulling external data in). SQL and functions run with zero network latency. HTTP and Edge Function jobs need `pg_net` enabled.
- **Only one instance of a given job runs at a time.** Different jobs run in parallel; if a job triggers again before its previous run finishes, the new run is queued and starts as soon as the first completes.
- **The extension is maintained upstream, not by Supabase.** For a pg_cron bug, also consider an issue in the pg_cron repository.

## Cron: install and remove

```sql
create extension pg_cron with schema pg_catalog;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;
```

- **Or in the Dashboard:** Integrations > Cron Postgres Module > enable `pg_cron`.
- **Disabling pg_cron permanently deletes all jobs.** Uninstall is `drop extension if exists pg_cron;`.

## Cron: schedules

```
┌───────────── min (0 - 59)
│ ┌────────────── hour (0 - 23)
│ │ ┌─────────────── day of month (1 - 31)
│ │ │ ┌──────────────── month (1 - 12)
│ │ │ │ ┌───────────────── day of week (0 - 6) (0 to 6 are Sunday to
│ │ │ │ │                  Saturday, or use names; 7 is also Sunday)
* * * * *
```

- **Sub-minute:** `[1-59] seconds`, for example `'30 seconds'` (Postgres 15.1.1.61+). Seconds can't be combined with other time units.
- **Last day of the month:** `$` in the day-of-month field; `'0 12 $ * *'` runs at 12:00 on the last day of each month. Parsing follows Vixie cron, so its options work; check expressions in a cron expression checker before scheduling.
- **The Dashboard also accepts natural language** for the schedule.
- **Schedules run in GMT.** Every Supabase example annotates times as GMT (`'0 0 * * *'` is midnight GMT), and pg_cron's `cron.timezone` defaults to `GMT`. No Supabase page documents changing `cron.timezone` on the hosted platform, and it is not in the custom Postgres config parameter list; write schedules in GMT.
- **Outdated statement:** the pg_net extension page says pg_cron schedules with "up to a minute precision"; the Cron quickstart supports seconds on 15.1.1.61+. Trust the Cron docs and check the version.

## Cron: the SQL API

```sql
-- Cron Job name cannot be edited
select cron.schedule('permanent-cron-job-name', '30 seconds', 'CALL do_something()');
```

- **Names are case sensitive, can't be edited, and upsert.** Scheduling a second job with the same name (same case) overwrites the first. `cron.schedule(schedule, command)` (unnamed) and `cron.schedule(job_name, schedule, command)` both return the job id. Another database: `cron.schedule_in_database(job_name text, schedule text, command text, database text, username text DEFAULT NULL, active boolean DEFAULT true) RETURNS bigint`.
- **Change a job with `cron.alter_job`:**

```sql
select cron.alter_job(
  job_id := (select jobid from cron.job where jobname = 'permanent-cron-job-name'),
  schedule := '*/5 * * * *'
);

-- full signature
cron.alter_job(
  job_id bigint,
  schedule text default null,
  command text default null,
  database text default null,
  username text default null,
  active boolean default null
)
```

- **Pause and resume** with `cron.alter_job(job_id := ..., active := false)` (or `true`), or the Active/Inactive toggle in the Dashboard.
- **Delete** with `select cron.unschedule('permanent-cron-job-name');`. The job leaves `cron.job`; its history stays in `cron.job_run_details`. Deleting in the Dashboard asks you to type the job name.
- **Never insert into or update `cron.job` directly.** Since 2023-11-29 Supabase disallows it, because it bypasses the security checks in the pg_cron functions. The upstream README still says jobs can be managed through the table; on Supabase they can't. Use only `cron.schedule`, `cron.alter_job` and `cron.unschedule`; if a job is inaccessible, contact Support.
- **Jobs are private to their creator.** An RLS policy upstream lets only the creating user see and modify a job, unless the role is superuser or has `bypassrls`.

## Cron: examples

```sql
select cron.schedule('saturday-cleanup', '30 3 * * 6', $$ delete from events where event_time < now() - interval '1 week' $$);
select cron.schedule('nightly-vacuum', '0 3 * * *', 'VACUUM');
select cron.schedule('call-db-function', '*/5 * * * *', 'SELECT hello_world()');
select cron.schedule('call-db-procedure', '*/5 * * * *', 'CALL my_procedure()');
select cron.schedule('@daily', $$call partman.run_maintenance_proc()$$);   -- pg_partman maintenance
```

- **Other uses in the docs:** deleting old `private.rate_limits` rows, hard-deleting soft-deleted rows in batches during low traffic, and a nightly foreign data wrapper ETL (`'0 3 * * *'`). Moving large amounts of data that way can tax the database; a dedicated sync tool is often better.
- **Careful with system maintenance jobs.** A job that terminates idle connections with `pg_terminate_backend(pid)` can disrupt nightly backups; use existing settings such as `idle_session_timeout` instead.

## Cron: calling an Edge Function

Keep the project URL and key in Vault, not in the job text:

```sql
select vault.create_secret('https://project-ref.supabase.co', 'project_url');
select vault.create_secret('YOUR_SUPABASE_PUBLISHABLE_KEY', 'publishable_key');

select
  cron.schedule(
    'invoke-function-every-minute',
    '* * * * *', -- every minute
    $$
    select
      net.http_post(
          url:= (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/function-name',
          headers:=jsonb_build_object(
            'Content-type', 'application/json',
            'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key')
          ),
          body:=concat('{"time": "', now(), '"}')::jsonb
      ) as request_id;
    $$
  );
```

- **Set `timeout_milliseconds` on the call** when the function needs more than the default (the quickstart's 30-second example passes `timeout_milliseconds:=5000`).
- **For a privileged function, send the secret key on `apikey`, not `Authorization: Bearer`.** pg_net calls (Database Webhooks included) used to send `service_role` as a Bearer token; the new secret keys aren't JWTs and are rejected there:

```sql
select net.http_post(
  url := 'https://your-project.supabase.co/functions/v1/your-function',
  headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', 'sb_secret_...'),
  body := jsonb_build_object('event', 'ping')
);
```

  Don't hardcode it: `'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'secret_key')`. On the function side, for calls from cron, workers or `pg_net`, disable `verify_jwt` and use `auth: 'secret'`, which validates against the secret key named `default` and provides `ctx.supabaseAdmin`.
- **Vault doesn't hide the key from other database roles.** The decrypted value is written into the queued request's headers (pg_net security, below).

## Cron: limits and timeouts

| Limit | Value |
|---|---|
| Recommended concurrent jobs | no more than 8 |
| Recommended run time per job | no more than 10 minutes |
| Hard ceiling on concurrent jobs | 32 (`cron.max_running_jobs` default), each using a database connection |
| `postgres` role statement timeout | none of its own, capped by the global default of 2 minutes |
| `anon` / `authenticated` | 3 s / 8 s |
| `service_role` | none of its own, falls back to `authenticator`'s 8 s |

- **Space jobs out** when too many run at once; they compete for connections and fail. Peak connection usage is at the bottom of the Observability Dashboard. With `cron.use_background_workers = on` (default `off`) concurrency is limited by `max_worker_processes` instead.
- **pg_cron can use a lot of memory.**
- **Long jobs hit the statement timeout.** Wrap the work in a function with its own timeout; that is how a job goes beyond 2 minutes:

```sql
create or replace function myfunc()
returns void as $$
 select pg_sleep(3); -- simulating some long-running process
$$
language sql
set statement_timeout TO '4s'; -- set custom timeout
```

## Cron: run history

- **`cron.job_run_details` is never cleaned up automatically,** not even when a job is unscheduled, and it fills the disk. Schedule a cleanup:

```sql
select cron.schedule(
  'job-run-details-cleanup', -- name of the cron job
  '0 0 * * *', -- daily at midnight (GMT)
  $$ delete from cron.job_run_details where end_time < now() - interval '7 days' $$
);
```

- **Prune it before a project upgrade.** The upgrade drops and recreates pg_cron and duplicates `cron.job_run_details` first to keep the logs; a huge table causes disk pressure, degraded performance or a failed upgrade.
- **Columns:** `jobid, runid, job_pid, database, username, command, status, return_message, start_time, end_time`. Statuses include `running`, `succeeded`, `failed`; messages include `server restarted` and `job canceled`. Each user who can schedule jobs can delete their own history rows. `cron.log_run = off` stops recording.
- **`cron.log_statement`** writes a log line when a job starts (`cron job 1 starting: select 1`). Consider turning it off and monitoring through `cron.job_run_details` only. It is set through the CLI only and needs a restart (a few seconds of downtime): `supabase postgres-config update --project-ref <ref> --config cron.log_statement=false`.
- **Launcher crashing about every minute with `duplicate key value violates unique constraint "job_run_details_pkey"`:** `cron.runid_seq` is out of sync with the table. Back it up if needed, then `TRUNCATE cron.job_run_details;`.

## Cron: debugging

1. **Upgrade first** if Postgres is below 15.6.1.122, to get pg_cron 1.6.4+.
2. **Is the scheduler alive?**

```sql
SELECT pid as process_id, usename as database_user, application_name,
  backend_start as when_process_began, wait_event_type, state, query, backend_type
FROM pg_stat_activity where application_name ilike 'pg_cron scheduler';
```

   No row means the worker died: do a fast reboot in General Settings. The same query with `application_name ilike 'pg_cron'` shows jobs running now.
3. **Which runs failed?**

```sql
SELECT * FROM cron.job_run_details
WHERE (status <> 'succeeded' AND status <> 'running')
  AND start_time > NOW() - INTERVAL '5 days'
ORDER BY start_time DESC LIMIT 10;
```

   One job's last runs: `select * from cron.job_run_details where jobid = (select jobid from cron.job where jobname = 'permanent-cron-job-name') order by start_time desc limit 10;` (or the History button next to the job). List jobs: `select schedule, jobname, command from cron.job;`; count them: `select COUNT(*) from cron.job;`.
4. **Read the Postgres logs** (Logs source in the SQL Editor or Logs Explorer), filtering `log_attributes['parsed.error_severity'] in ('ERROR','FATAL','PANIC')` and `match(log_attributes['parsed.application_name'], 'pg_cron')`.
5. **Add your own logs:** wrap the job in a plpgsql function that does `raise log 'logging start of cron function call: (%)', (select now());` and an `exception when others then raise exception ... sqlerrm` block, then search Logs > Postgres.
6. **Check database strain** on the reports page; a compute upgrade may be the fix.

## Queues: how they work

- **A pull-based, durable Postgres queue built on `pgmq`.** Consumers fetch messages; order is FIFO with no priority levels. A message is a JSON object kept until a consumer explicitly deletes or archives it. There is no background worker, only Postgres functions; the API mirrors SQS and RSMQ.
- **Exactly once within a visibility window.** A read message is invisible to other consumers for `vt` seconds; if it isn't deleted or archived in time it becomes visible again and another consumer can read it.
- **Enqueue in the same transaction** that changes the related data.
- **Status: Public Alpha;** available on self-hosted. No hard limits (message size, queue count, throughput) are documented; size Compute and Disk for the workload.
- **Two queue types.** A basic queue is a durable, logged table. An unlogged queue (`pgmq.create_unlogged`) is faster and may lose messages; use it when write throughput matters more than durability. The quickstart says "three types" but lists two; the launch post names the third, partitioned queues, as coming soon. `pgmq.list_queues()` reports `is_partitioned`, but no Supabase page documents creating one.
- **Each queue is two tables:** `pgmq.q_<queue_name>` (active messages) and `pgmq.a_<queue_name>` (archive). For an unlogged queue only `q_` is unlogged; the archive stays logged. Table shape: `msg_id bigint generated always as identity, read_ct int default 0 not null, enqueued_at timestamptz default now() not null, vt timestamptz not null, message jsonb`.
- **Queue names are lowercase;** hyphens and underscores are allowed.

## Queues: the pgmq API

Enable with `create extension pgmq;`. Upstream docs: https://pgmq.github.io/pgmq/

| Function | Does |
|---|---|
| `pgmq.create(queue_name text) returns void` | Creates a queue: `select from pgmq.create('my_queue');` |
| `pgmq.create_unlogged(queue_name text) returns void` | Creates an unlogged queue |
| `pgmq.send(queue_name text, msg jsonb, delay integer default 0) returns setof bigint` | Enqueues; `delay` is seconds before visible |
| `pgmq.send_batch(queue_name text, msgs jsonb[], delay integer default 0) returns setof bigint` | Enqueues several |
| `pgmq.read(queue_name text, vt integer, qty integer) returns setof pgmq.message_record` | Reads `qty` messages, hiding them for `vt` seconds |
| `pgmq.read_with_poll(queue_name text, vt integer, qty integer, max_poll_seconds integer default 5, poll_interval_ms integer default 100)` | Long poll: waits up to `max_poll_seconds` when empty, returns as soon as messages arrive |
| `pgmq.pop(queue_name text) returns setof pgmq.message_record` | Reads one message and deletes it |
| `pgmq.delete(queue_name text, msg_id bigint) returns boolean` | Deletes one; the `msg_ids bigint[]` form returns only ids that existed |
| `pgmq.archive(queue_name text, msg_id bigint) returns boolean` | Moves to the archive; the `msg_ids bigint[]` form returns ids archived |
| `pgmq.set_vt(queue_name text, msg_id bigint, vt_offset integer) returns pgmq.message_record` | Sets visibility to now + `vt_offset` seconds |
| `purge_queue(queue_name text) returns bigint` | Deletes all messages, returns the count |
| `pgmq.drop_queue(queue_name text) returns boolean` | Deletes the queue and its archive |
| `pgmq.detach_archive(queue_name text)` | Takes the archive out of the extension so `drop extension pgmq` keeps it; archiving still appends |
| `pgmq.list_queues()` | `queue_name, created_at, is_partitioned, is_unlogged` |
| `pgmq.metrics(queue_name)` / `pgmq.metrics_all()` | `queue_name, queue_length, newest_msg_age_sec, oldest_msg_age_sec, total_messages` (all time), `scrape_time` |

```sql
select * from pgmq.send('my_queue', '{"hello": "world"}');
select * from pgmq.send_batch('my_queue', array['{"hello": "world_0"}'::jsonb, '{"hello": "world_1"}'::jsonb]);
select * from pgmq.read('my_queue', 10, 2);
```

- **`pgmq.message_record`:** `msg_id bigint`, `read_ct bigint` (increments on each read), `enqueued_at timestamptz`, `vt timestamptz` (when it can be read again), `message jsonb`.
- **`pop` is at-most-once.** The message is gone before processing; if the consumer fails, it is lost. Use `read` then `delete` or `archive` when work must not be dropped.
- **`read`'s `qty`:** the docs table says it defaults to 1, but the signature shows no default. Pass it explicitly and check the current docs.
- **No dead-letter queue or max-retry setting exists.** `read_ct` is the counter to build one on. No automatic archive retention is documented either.
- **Breaking change (2025-10-08): pgmq 1.4.4 to 1.5.1.** New projects on Postgres 17.6.1.016+ get 1.5.1; upgrades of existing projects were halted, so they stay on 1.4.4 until an upstream fix. In 1.5 `delay` accepts `integer` or `timestamptz`, so an implicitly cast string breaks: `pgmq.send('myq', '{"hello": "world"}', '10')` fails. Write `pgmq.send('x', '{...}')`, `pgmq.send('x', '{...}', 10)` or `pgmq.send('x', '{...}', '2024-12-01 02:29:20.889403+00'::timestamptz)`. 1.5 also adds an experimental `conditional` filter on `pgmq.read()`, message headers and `queue_visible_length` in metrics; the Studio wrapper passes `conditional := '{}'::jsonb` on newer pgmq. Check your pgmq version before relying on either form.

## Queues: exposing them to clients

- **Queues are not on the Data API by default;** only Postgres clients reach them. The `pgmq` schema's tables have no RLS by default, so never expose `pgmq` itself.
- **Expose through `pgmq_public`:** Queues > Settings > Expose Queues via PostgREST creates the `pgmq_public` schema with wrappers for message operations only (no create or drop):

| Wrapper | Note |
|---|---|
| `pgmq_public.send(queue_name text, message jsonb, sleep_seconds integer default 0)` | `sleep_seconds` is the delay |
| `pgmq_public.send_batch(queue_name text, messages jsonb[], sleep_seconds integer default 0)` | |
| `pgmq_public.read(queue_name text, sleep_seconds integer, n integer)` | `sleep_seconds` is the visibility timeout, not a poll wait |
| `pgmq_public.pop(queue_name text)` | Calls `pgmq.pop`: reads and deletes |
| `pgmq_public.archive(queue_name text, message_id bigint)` | |
| `pgmq_public.delete(queue_name text, message_id bigint)` | |

- **The wrappers are not `security definer`.** They are `plpgsql` with `set search_path = ''`, so the caller's grants and RLS apply. Enabling exposure grants `execute` on the wrappers and the underlying `pgmq.*` functions to `postgres, service_role, anon, authenticated`; all privileges on `pgmq` tables (existing and future) to `postgres, service_role` only; `usage` on `pgmq` and `pgmq_public` to all four; and `usage, select, update` on `pgmq` sequences to `anon, authenticated, service_role`. Turning it off drops the wrappers and `pgmq_public` and revokes the `pgmq` schema and default privileges from `anon, authenticated, service_role`.
- **Doc errors to avoid:** the Edge Function consumer example calls `rpc('delete', { queue_name, msg_id })`, but the parameter is `message_id`. The same example comments `sleep_seconds: 0` as "don't wait if queue is empty", but it is the visibility timeout. A Studio comment says `pop` "retrieves and locks"; it deletes.

```ts
const result = await supabase.schema('pgmq_public').rpc('send', {
  queue_name: 'foo',
  message: { hello: 'world' },
  sleep_seconds: 30,
})
const popped = await supabase.schema('pgmq_public').rpc('pop', { queue_name: 'foo' })
```

  Dart: `supabase.schema('pgmq_public').rpc('send', params: {...})`. Swift: `.schema("pgmq_public").rpc("send", params: [...]).execute()`. Python: `supabase.schema("pgmq_public").rpc("send", {...}).execute()`. Or create the client with `{ db: { schema: 'pgmq_public' } }` and call `.rpc('send', {...})`.

## Queues: permissions and RLS

- **Leave RLS enabled when creating a queue in the Dashboard.** Once queues are exposed, every `pgmq.q_*` table must have RLS enabled and policies for the queues clients use (the "Add RLS Policy" button on the queue overview).
- **Grant per role per operation** (the queue's Settings cog):

| Operations | Table permissions |
|---|---|
| `send`, `send_batch` | Select, Insert |
| `read`, `pop` | Select, Update |
| `archive`, `delete` | Select, Delete |

  The docs list `pop` as needing Select and Update although `pgmq.pop` deletes; no source explains it, so test `pop` as the client role. A typical setup: `anon` none; `authenticated`, `postgres` and `service_role` all four. `postgres` and `service_role` have them by default and should keep them for server-side work; never use either from a client.
- **Advisor lint `0019_insecure_queue_exposed_in_api` (ERROR):** a queue is exposed without protection and anyone with the project URL can read, change and delete its messages. Fix with `alter table pgmq.q_<queue_name> enable row level security;` and then policies (API access is blocked until they exist), or remove `pgmq_public` from Exposed schemas.
- **Local CLI and self-hosted need manual exposure,** after `pgmq_public` exists. CLI: add it to `config.toml`, then `supabase stop && supabase start`:

```toml
[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public", "pgmq_public"]
```

  Docker Compose: `PGRST_DB_SCHEMAS=public,graphql_public,pgmq_public` in `.env`, then `docker compose down` and `up -d`. Remove it from the list and restart to stop exposing.

## Queues: consumers

- **Edge Function consumer:** call `supabase.schema('pgmq_public').rpc('read', { queue_name, sleep_seconds: <visibility seconds>, n: 5 })`, process each message (`msg_id, read_ct, vt, enqueued_at, message`), delete each on success, and log failures; a failed message stays and is read again next run. Run it on a cron schedule (every N minutes or seconds) or on demand with `supabase.functions.invoke`.
- **Or connect the function straight to Postgres** and run ``select pgmq.delete(${QUEUE_NAME}, ${jobId}::bigint)`` after each job, returning 200 with the completed and failed jobs.
- **Use a queue instead of recursive Edge Function calls** for large datasets (it handles backpressure), and to move long work out of a function that hits worker timeouts into chunked async processing.
- **Monitor** in the Dashboard (status, retries, payload; postpone, archive or delete a message) or with `pgmq.metrics`.

- **Consumer visibility and poison messages:** set visibility longer than the handler's worst case; zero makes a read message immediately available to another worker. After a chosen read-count ceiling (the existing worker example uses 5), archive the poison message to a dead-letter queue or table and alert. This is an application retry policy; pgmq has no built-in dead-letter/max-retry setting.
- Trigger consumers through cron or a scheduled Edge Function, process small batches and stay below the function runtime limit. [Existing background-jobs/WORKERS.md, Supabase Queues]

## pg_net: async HTTP from SQL

- **Asynchronous, so it is usable inside triggers.** The API is in beta and signatures may change.
- **Requests start only after the transaction commits.**
- **Install into `extensions`:** `create extension pg_net with schema "extensions";` (it creates its own `net` schema; this keeps it out of `public` and satisfies the Security Advisor). It is non-relocatable: if it is in `public`, `alter extension ... set schema` fails; drop and recreate it, which deletes pending requests and stored responses. Remove: `drop extension if exists pg_net; drop schema net;`.

```sql
net.http_get(url text, params jsonb default '{}'::jsonb, headers jsonb default '{}'::jsonb, timeout_milliseconds int default 2000) returns bigint
net.http_post(url text, body jsonb default '{}'::jsonb, params jsonb default '{}'::jsonb, headers jsonb default '{"Content-Type": "application/json"}'::jsonb, timeout_milliseconds int default 2000) returns bigint
net.http_delete(url text, params jsonb default '{}'::jsonb, headers jsonb default '{}'::jsonb, timeout_milliseconds int default 2000) returns bigint
```

- **Each returns a request id;** they are `SECURITY DEFINER`. The POST body uses the database `server_encoding`.
- **Default timeout conflict:** the Supabase pg_net page gives 2000 ms; the upstream README and source give 5000 ms, and upstream `http_delete` also takes an optional `body jsonb default NULL`. Always pass `timeout_milliseconds` and check the current docs for `http_delete`.
- **From a trigger:** `perform "net"."http_post"(... jsonb_build_object('old_row', to_jsonb(old.*), 'new_row', to_jsonb(new.*)) ...)` in an `after update ... for each row` trigger. For many rows send `jsonb_agg(to_jsonb(<table>.*))` and `LIMIT` it.
- **Database Webhooks wrap triggers around pg_net,** sending POST or GET with a JSON payload; their history is in the `net` schema. The pg_net page says POST supports only JSON and there is no PATCH or PUT; the webhooks page adds GET.

| Limit | Value |
|---|---|
| Reliable throughput | about 200 requests per second; raising it can introduce instability |
| Requests per worker pass | next 200 queued (`pg_net.batch_size`, default 200) |
| Response retention | at least 6 hours (`pg_net.ttl`) |
| Methods | GET, POST (JSON only), DELETE; no PATCH or PUT |
| Databases | one at a time, `postgres` by default (`pg_net.database_name`) |
| Max timeout | `pg_net.max_timeout_ms`, default 600000; a timeout outside `1..max_timeout_ms` isn't sent and gets an ERROR response |
| Durability | queue and response tables are unlogged, lost on a crash or unclean shutdown |
| Retries | none built in; build a tracker table and a wrapper, called from cron |

- **Mechanics:** pending requests are rows in `net.http_request_queue (id, method, url, headers jsonb, body bytea, timeout_milliseconds)`, deleted when executed; responses go to `net._http_response (id, status_code, content_type, headers, content, timed_out, error_msg, created)`, without the request headers. Expired responses are deleted by the worker while it processes requests, so they can outlive `pg_net.ttl` when idle. `pg_net.username` defaults to NULL (the bootstrap user); changing it or `database_name` needs a worker restart.
- **Very heavy requests can time out in bulk;** raise the timeout.
- **The queue table has no index** (to keep writes cheap). Keep `select count(*) from net.http_request_queue;` relatively low, under 20,000; otherwise upgrade compute or `TRUNCATE net.http_request_queue;`.
- **Never put a trigger on `net._http_response` or `net.http_request_queue`;** it risks an infinite loop.
- **Reconfigure (pg_net 0.12.0+):** read with `select "name", "setting" from pg_settings where "name" like 'pg_net%';`. Changing needs superuser, so ask Support for a grant such as `grant alter system on parameter pg_net.ttl to postgres;`, then `alter system set pg_net.ttl to '24 hours'; select net.worker_restart();`.

Database Webhooks execute the next queued batch; a too-short webhook timeout can therefore produce bulk timeouts. Dropping pg_net stops Database Webhooks. [DATABASE.md](DATABASE.md#database-webhooks-and-pg_net) owns the webhook trigger/payload contract.

## pg_net: security

- **Every role that can use pg_net can read every queued request, `Authorization` and `apikey` headers included.** A Vault secret is encrypted at rest, but its decrypted value sits in `headers` like any other. `postgres` and any `login` role can use pg_net. On some projects only `postgres, anon, authenticated, service_role, supabase_functions_admin` can execute `http_get` and `http_post`, but other roles can still insert into the queue and the worker sends those rows. A `PUBLIC`-derived privilege lets any session insert into `net.http_request_queue`.
- **Schema usage:** `net` grants `USAGE` to `PUBLIC`; `anon` and `authenticated` are `NOLOGIN` and `net` is not exposed. Turning on Database Webhooks re-grants `usage` on `net` to `anon`, `authenticated` and `service_role`. [Existing DATABASE.md, Database webhooks and pg_net]
- **You can't lock it down with grants or RLS.** `supabase_admin` owns the tables; RLS can't be added and changing grants isn't supported. `revoke` as `postgres` prints `WARNING: no privileges could be revoked for "net"` (hidden in the SQL Editor), `grant` prints `no privileges were granted`. Removing the `PUBLIC` grants breaks pg_net with `permission denied for table http_request_queue`, and with it every cron job that calls pg_net.
- **Mitigate instead:** give `login` only to trusted service roles; treat header credentials as readable by every connecting role; never add `net` to exposed schemas (then `anon` and `authenticated` could read queued credentials); drop pg_net if unused (that deletes unsent requests and stored responses and stops Database Webhooks).
- **Grants come back** on `create extension pg_net`, a major Postgres upgrade, or turning on Database Webhooks. Major upgrades (and enabling pg_net 0.11 or older) revoke `execute` on `http_get` and `http_post` from `PUBLIC` and grant it to the five roles above.
- **`42501: permission denied for table http_request_queue`:** check the queue is empty, then `drop extension pg_net; create extension pg_net schema extensions;`. If dependent objects block the drop, contact Support.

## pg_net: debugging

- **Is the worker running?** `select pid from pg_stat_activity where backend_type ilike '%pg_net%';`. Restart with `select net.worker_restart();` (0.8+), otherwise a fast reboot.
- **Failed requests:** `select * from net._http_response where "status_code" >= 400 or "error_msg" is not null order by "created" desc;`
- **Timeout bug:** every `_http_response` column except `id`, `error_msg` and `created` is NULL. Fixed in pg_net 0.11 (Postgres 15.6.1.135+).
- **See the payload you send:** post to an echo endpoint, then read the response:

```sql
select net.http_post(url := 'https://postman-echo.com/post', body := '{"key1": "value", "key2": 5}'::jsonb);
select "content" from net._http_response where id = <request_id>;
```

- **Log row data:** wrap the call in a function and `raise log` the values; read them in the Postgres logs.

## The full pattern: trigger, queue, cron, pg_net, Edge Function

The automatic embeddings guide wires all three together, and its shape fits any per-row background job:

1. **Extensions:** `pgmq` and `pg_cron` in their own schemas, `pg_net` `with schema extensions`.
2. **Project URL in Vault:** locally `select vault.create_secret('http://api.supabase.internal:8000', 'project_url');` in `supabase/seed.sql`; in the cloud, the project's API URL.
3. **A trigger enqueues:** a `for each row` trigger function, `security definer` with `set search_path = ''`, runs `perform pgmq.send(queue_name => 'embedding_jobs', msg => jsonb_build_object(...))`.
4. **Cron drains in batches:** a job on `'10 seconds'` ("a good starting point") reads with `qty => max_requests * batch_size` (defaults 10 x 10) and `vt => timeout_milliseconds / 1000`, so the visibility timeout equals the HTTP timeout (default 5 minutes). Batching avoids single long requests and timeouts; one request per row risks rate limits.
5. **pg_net calls the function:** `util.invoke_edge_function(name, body, timeout_milliseconds int = 5 * 60 * 1000)` reuses the `authorization` header from `current_setting('request.headers', true)` inside a PostgREST session, then `perform net.http_post(url => util.project_url() || '/functions/v1/' || name, ...)`.
6. **The function deletes what it finished.** Anything it fails on reappears after the visibility timeout and the next cron run retries it. Diagnose failures in `net._http_response`.

A plain table drained every minute works too: the Send Email and Send SMS hook guides queue rows in a table and run `cron.schedule(..., '* * * * *', 'select dequeue_and_run_jobs();')`.

## Local development, migrations, restores

- **Local Docker:** Postgres is in a container, so `localhost` in a pg_net URL is the container. Use `http://host.docker.internal:54321/functions/v1/my-function-name` or the machine's local IP.
- **Native local runtime (CLI 2.121.0+)** runs each cron job in a background worker, not a new connection, so a job body can't contain its own `BEGIN`/`COMMIT`. Older CLIs fail every native cron job on macOS with `connection failed` or `job startup timeout`.
- **Declarative schemas track named cron jobs.** Declare each in a file under `supabase/schemas/` with `select cron.schedule('<name>', ...)`; jobs with a missing or duplicate `jobname` are skipped with a warning. Generated migrations create jobs with `cron.schedule_in_database(...)`, remove them with `cron.unschedule(...)`, and change one by unscheduling then scheduling. Apply with `supabase db schema declarative sync`. If migrations call `pg_net` (webhooks), add `[experimental.webhooks] enabled = true` to `config.toml`.
- **Create queues through pgmq functions, never raw tables.** Diffs emit queue changes as calls like `select pgmq.drop_queue('q');`, flagged destructive.
- **Read diffs for `DROP EXTENSION`.** User-enabled extensions are diffed like any object, so `DROP EXTENSION "pg_net";` can appear when local and remote differ, and it applies silently on `db reset`.
- **CLI internals:** the diff shadow database starts with `max_worker_processes=0` (no background workers), restores append `cron.launch_active_jobs = off`, `db reset` resets the `postgres` database because pg_cron and pg_net require it, and `config.toml` `[db.settings]` has no pg_cron settings.
- **Restoring to a new project is a binary restore:** pg_cron jobs and pg_net requests start running as soon as it completes, with no way to pause them. To inspect or remove cron jobs first, do a logical restore with the CLI.
- **The Postgres 17 upgrade patches `pg_net` and `pg_cron`** (ownership, grants, foreign server options).

## Prove it

- **Cron:** `select schedule, jobname, command from cron.job;` lists each job you meant, under the name you meant; the scheduler query on `pg_stat_activity` returns a row; after one interval `cron.job_run_details` shows the job `succeeded`, and the failed-runs query returns nothing; a `job-run-details-cleanup` job exists; no more than 8 jobs overlap.
- **Cron to Edge Function:** after a run, `net._http_response` has a row for the request with a 2xx `status_code` and null `error_msg`; the job text holds no literal key (it reads Vault).
- **Queues:** send a message, `read` it with a visibility timeout, wait past it without deleting, and read it again with `read_ct` incremented; then delete it and `pgmq.metrics('<queue>')` shows `queue_length` 0.
- **Exposed queues:** the advisors report no `0019_insecure_queue_exposed_in_api`; as `anon` a `pgmq_public` `send` or `read` is refused; as `authenticated` each permitted operation works and each unpermitted one fails.
- **pg_net:** the extension is in `extensions` (no Security Advisor warning), `select count(*) from net.http_request_queue;` stays under 20,000, and the pg_net worker shows in `pg_stat_activity`.
- **Migrations:** the generated diff contains no unexpected `DROP EXTENSION` or `pgmq.drop_queue`, and `supabase db reset` on a fresh local database recreates every declared cron job.
