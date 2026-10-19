# Data API: exposure, requests and error codes

The browser reaches the database through the Data API (PostgREST), which turns each request into a single SQL statement run as `anon`, `authenticated` or `service_role`. Most outcomes are decided by which role a request runs as and what that role was granted. Functions, triggers, connections and operations are DATABASE.md; the security checklist is SECURITY.md.

**Contents:** [Dated changes to check first](#dated-changes-to-check-first) · [Data API: exposure and grants](#data-api-exposure-and-grants) · [Data API: requests, keys and roles](#data-api-requests-keys-and-roles) · [Data API error codes](#data-api-error-codes) · [Debugging](#debugging) · [Prove it](#prove-it)

## Dated changes to check first

| Date | Change |
|---|---|
| 2025-12 | PostgREST v14 rolled out: JWT cache, much faster schema cache loading. |
| 2026-03-11 / 2026-04-08 | The OpenAPI spec at `/rest/v1/` is no longer returned to `anon`-key requests (new projects / all projects). |
| 2026-04-28 | Opt-in checkbox "Automatically expose new tables" at project creation. |
| 2026-05-30 | New tables not exposed to the Data API by default on new projects (gradual rollout). |
| 2026-10-30 | New tables not exposed by default, enforced on all existing projects. |
| end of 2026 | Legacy `anon` and `service_role` keys deprecated; use publishable (`sb_publishable_xxx`) and secret (`sb_secret_xxx`) keys. |

## Data API: exposure and grants

- **Two layers on every exposed object.** Grants decide which roles (`anon`, `authenticated`, `service_role`) can reach a table, view or function; RLS decides which rows. RLS doesn't apply to functions.
- **New tables are no longer exposed automatically (breaking).** Historically, tables created in `public` received `SELECT, INSERT, UPDATE, DELETE` for `anon`, `authenticated`, `service_role`, and functions received `EXECUTE`, granted by the internal `supabase_admin` role. Under the change dated above, existing tables keep their grants; only new tables in `public` need an explicit `grant`. It doesn't affect direct Postgres connections, or the `storage`, `auth`, `realtime` or custom schemas. The Security Advisor flags affected tables until enforcement. Write the grants into every new table's migration:

```sql
grant select on public.your_table to anon;
grant select, insert, update, delete on public.your_table to authenticated;
grant select, insert, update, delete on public.your_table to service_role;
alter table public.your_table enable row level security;
create policy "users can read their own rows"
  on public.your_table for select to authenticated
  using (auth.uid() = user_id);
```

- **A missing grant is `42501` with a hint naming the fix:** `{"code": "42501", "message": "permission denied for table your_table", "hint": "Grant the required privileges to the current role with: GRANT SELECT ON public.your_table TO anon;"}`.
- **Opt in early by revoking the default privileges:**

```sql
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public;
```

  The changelog's version of this block shows only the tables and sequences statements (while calling them "four statements") and doesn't revoke function execute; the API security guide shows all four. Check the current docs. To roll back the opt-in, re-grant the default privileges on tables and sequences and run `grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role; grant usage, select on all sequences in schema public to anon, authenticated, service_role;`.
- **Dashboard alternative:** Integrations > Data API settings exposes specific tables and functions, and the toggle **Default privileges for new entities** grants access automatically for new tables and functions in `public`.
- **RLS default depends on where the table was made.** Tables created in the Dashboard have RLS enabled; tables created in the SQL Editor or other tools need `alter table your_table enable row level security;`.
- **Disable the whole Data API** in Integrations > Data API (**Enable Data API** off); then no REST endpoint responds regardless of grants or RLS. PostgREST isn't actually shut down: a `pg_pgrst_no_exposed_schemas` schema shows in exposed schemas and logs `schema "pg_pgrst_no_exposed_schemas" does not exist`. Workaround: `create schema pgrst_no_exposed_schemas; alter role authenticator set pgrst.db_schemas = 'pgrst_no_exposed_schemas'; notify pgrst;` (reverse with `alter role authenticator reset pgrst.db_schemas; notify pgrst;`).
- **The OpenAPI spec needs a secret key.** An `anon`-key request to `/rest/v1/` gets `{"message":"Access to schema is forbidden","hint":"Accessing the schema via the Data API is only allowed using a secret API key."}`; service role and secret keys still work, and the Management API endpoint v1-get-database-openapi needs only "Read-only project database access". `supabase.getOpenApiSpec()` lists only objects the caller's role holds privileges on; `.schema('billing').getOpenApiSpec()` reads another schema.
- **Don't name a column `apikey`;** it's a reserved keyword on the platform.

## Data API: requests, keys and roles

- **Endpoint:** `https://<project_ref>.supabase.co/rest/v1/` (URL in Integrations > Data API, keys in Settings > API Keys). Tables get a route accepting `GET`, `POST`, `PATCH`, `DELETE`. It works with views, materialized views, foreign tables, functions, computed columns and relationships.
- **Every request needs the `apikey` header;** it is mandatory and not configurable.

```bash
curl '<SUPABASE_URL>/rest/v1/todos' \
-H "apikey: <SUPABASE_PUBLISHABLE_KEY>" \
-H "Authorization: Bearer <SUPABASE_PUBLISHABLE_KEY>"
```

- **RLS follows the `Authorization` header, not `apikey`.** A client whose Authorization is the service role key always bypasses RLS. RLS errors on a "service role client" mean a user session replaced it: an SSR client sharing cookies, an Authorization header set by hand to a user JWT, or `signUp` and other auth calls made on it. Use `admin.createUser()` or a separate client. Adding `service_role` to RLS policies does nothing.
- **An empty `data` array while the table has rows** usually means RLS is enabled with no matching policy (or a filter). To see who the request runs as: `create function test_authorization_header() returns json language SQL as $$ select auth.jwt(); $$;` and call it with `rpc` to read `role` and `sub`.
- **Extra app keys** (e.g. `x-app-api-key`) are checked in a pre-request function, using `current_setting('request.jwt.claims', true)::json->>'role'` for the role.

### Exposed schemas

- **`public` is exposed by default.** To expose a custom schema, add it to "Exposed schemas" in API settings, then:

```sql
GRANT USAGE ON SCHEMA myschema TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA myschema TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA myschema TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA myschema TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA myschema GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA myschema GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA myschema GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
```

- **Query it** with `createClient(URL, KEY, { db: { schema: 'myschema' } })` or per query `supabase.schema('myschema').from('todos')`. Over HTTP send `Accept-Profile: myschema` for GET/HEAD and `Content-Profile: myschema` for POST/PATCH/PUT/DELETE. With generated types, `createClient<Database>` checks `db.schema` against `public` only; pass `createClient<Database, 'myschema'>` and include `myschema` in the generated types.
- **With several exposed schemas the first is the default** for unqualified names ("Could not find the table 'X' in the schema cache"): put it first or use `.schema()`.
- **`PGRST106` "The schema must be one of the following: public"** means `authenticator`'s `pgrst.db_schemas` lacks the schema: `ALTER ROLE authenticator SET pgrst.db_schemas = 'public, your_schema_name';`, or `ALTER ROLE authenticator RESET pgrst.db_schemas;` to return control to the Dashboard. After a manual `ALTER ROLE authenticator SET pgrst.db_schemas`, the Dashboard no longer manages schemas.
- **Remove a schema from Exposed schemas before dropping it.** A dropped exposed schema breaks schema cache building (`PGRST002`). Fix: recreate it, remove it in Settings > Data API, then drop it.
- **`auth` and `vault` are unreachable for API roles** (so are FDWs that rely on vault); use a security definer function if you must.
- **Dedicated `api` schema pattern:** objects in an exposed `api` schema define the API surface; internals stay in unexposed schemas.
- **Config knobs:** Terraform `db_schema = "public,storage,graphql_public"`, `db_extra_search_path = "public,extensions"`, `max_rows = 1000`; CLI `config.toml` `[api] schemas = ["public", "storage", "graphql_public"]`, per remote `[remotes.production.api] max_rows = 500`.

### Schema cache

- **Reload after DDL:** `NOTIFY pgrst, 'reload schema';`. Reload config with `NOTIFY pgrst, 'reload config';` after any `alter role authenticator set pgrst.*` or role timeout change.
- **New columns or functions still not recognized,** with logs showing `Failed listening for database notifications on the "pgrst" channel ... Could not open file "pg_xact/000B"`: run `select pg_notification_queue_usage();` (non-disruptive, no restart).
- **JWT cache (PostgREST v14):** default 1000 entries; disable with `ALTER ROLE authenticator SET pgrst.jwt_cache_max_entries TO 0;`.

### Pre-request functions and request info

- **Register:** `alter role authenticator set pgrst.db_pre_request = 'public.check_request'; notify pgrst, 'reload config';`. It runs only for the Data API, not Realtime or Storage; for those, call the function from RLS policies.
- **Request info via `current_setting()`:** `request.method`, `request.path` (`table`, `view`, `rpc/function`), `request.headers`, `request.cookies`, `request.jwt`. Client IP: `split_part(current_setting('request.headers', true)::json->>'x-forwarded-for', ',', 1)`.
- **Custom HTTP errors:**

```sql
raise sqlstate 'PGRST' using message = json_build_object('code','123','message','Payment Required','details','Quota exceeded','hint','Upgrade your plan')::text, detail = json_build_object('status', 402, 'headers', json_build_object('X-Powered-By','Nerd Rage'))::text;
```

  Include `status_text` for custom codes like 419 or 420. PostgREST 11 or earlier uses a legacy syntax.
- **Rate limiting works only on POST/PUT/PATCH/DELETE:** GET and HEAD run read-only and can be served by read replicas. The docs' example limits 100 writes per IP per 5 minutes with HTTP 420.

### Querying with supabase-js

- **Max rows:** projects return at most 1,000 rows by default (API settings); keep it low and paginate with `range(from, to)`, which is 0-based and inclusive (`range(1, 3)` is rows 2 to 4) and needs an `order` to be predictable.
- **Counting:** `count: 'exact' | 'planned' | 'estimated'` on `select`, `rpc`, `delete` and others; `select('*', { count: 'exact', head: true })` returns only the count. With `.range()` or `.limit()` the count is all matching rows, not the page. Embedded count: `select('*, instruments(count)')`.
- **Order of calls:** filters come after `select()` (`.from().eq().select()` is wrong), modifiers after filters. Filters work on `select()`, `update()`, `upsert()`, `delete()` and table-returning functions.
- **`filter()`, `not()`, `or()` take raw PostgREST syntax: sanitize their input.** `.filter('id', 'in', '(5,6,7)')`, `.not('name', 'is', null)`, `.or('id.gt.3,and(id.eq.1,name.eq.Luke)')`, `.or('section_id.eq.1,name.eq.guzheng', { referencedTable: 'instruments' })`. An `.or()` across multiple tables isn't possible.
- **JSON paths:** `.eq('address->postcode', 90210)`, `select('id, name, address->city')`.
- **Writes return no rows unless `.select()` is chained.** With RLS, `delete()` deletes only rows visible through SELECT policies. Upsert must include primary keys; options `onConflict`, `ignoreDuplicates`.
- **`single()` errors unless exactly one row;** `maybeSingle()` allows zero or one. Otherwise `PGRST116` (406).
- **Version-gated modifiers:** `maxAffected` needs PostgREST v13+ and PATCH/DELETE only; `stripNulls()` needs PostgREST 11.2.0+. `csv()`, `geojson()`, `explain()` exist. `.returns()` is deprecated; use `.overrideTypes<T, { merge: false }>()`.
- **No client-side transactions.** supabase-js doesn't group queries into a transaction; put multi-statement work in a database function. `rollback()` sends `Prefer: tx=rollback`: the query runs (RLS, triggers, constraints, RETURNING) and is rolled back.
- **`throwOnError()`** rejects instead of returning `error`; `setHeader()` sets a header for one request; `retry(false)` disables retry for one query.
- **Long URLs fail with Cloudflare 520,** most often at 16+ KB in headers or URL (long `in` lists): move the data into an RPC body.
- **`or()` bug:** 400 `column ... does not exist` on PATCH/POST/DELETE with `or()` filters in PostgREST before 14.4; upgrade (14.5+) or add `&select=id,example_column`.
- Auth callback reentrancy and its SDK-version boundary are defined in [AUTH-SESSIONS.md](AUTH-SESSIONS.md#client-api-notes-supabase-js).

### Querying with supabase_flutter (Dart)

The same builder in Dart, from [ApparenceKit's cheat sheet](https://apparencekit.dev/flutter-tips/supabase-query-cheat-sheet/) (the rules above still apply):

- **Insert:** drop the generated `id` first; `.select().single()` returns the inserted row (skip it if unneeded):

```dart
Future<TaskEntity> create(TaskEntity task) async {
  try {
    final res = await _client
      .from(_kTasksTable)
      .insert(task.toJson()..remove('id'))
      .select()
      .single();
    return TaskEntity.fromJson(res);
  } catch (e) {
    _logger.e(e);
    throw ApiError(
      code: 0,
      message: '$e',
    );
  }
}
```

- **Batch insert** takes a list; the article passes `defaultToNull: false` without explaining it:

```dart
Future<void> createBatch(List<TaskEntity> tasks) {
  return _client
    .from(_kTasksTable)
    .insert(
      tasks.map((e) => e.toJson()..remove('id')).toList(),
      defaultToNull: false,
    );
}
```

- **Null filters:** `.filter('date', 'is', null)` for null. For not null use `.not('date', 'is', null)` (line above). The article's `.neq('date', null)` is wrong: `neq` is `<>`, ([PostgREST operators](https://docs.postgrest.org/en/v12/references/api/tables_views.html)), and `7 <> NULL` yields null, not true ([Postgres](https://www.postgresql.org/docs/current/functions-comparison.html)), so it matches no rows.
- **Pages:** `.order('creation_date', ascending: false).range(page * itemPerPage, (page + 1) * itemPerPage - 1)` (0-based, inclusive).
- **Embeds:** the article calls `.select('*, goals(*)')` an inner join that "only returns rows when there's a match in all tables". That is wrong: embeds are left joins (Embedding related tables, below); write `goals!inner(*)` for an inner join. Its `goals!left(*)` spells out the default.
- **Live rows:** `.stream(primaryKey: ['id']).eq('user_id', userId)` streams rows (the article declares it `Stream<int>`; it emits `Stream<List<Map<String, dynamic>>>`, the rows ([reference](https://supabase.com/docs/reference/dart/stream)), so copy the call chain, not the signature). Enable Realtime on the table first: the article's path is Table editor > your table; see REALTIME.md, Turn it on per table.

### Retries

- **From supabase-js v2.102.0, `.from()` and `.rpc()` retry by default** with exponential backoff, only for GET/HEAD/OPTIONS, on 503, 520 and network failures. `.rpc()` is a POST, so it isn't retried unless called with `{ get: true }` or `{ head: true }`.
- **Disable** with `createClient(url, key, { db: { retry: false } })`. A hanging request never retries: cap it with `.abortSignal(AbortSignal.timeout(10_000))`. Many retries can exhaust the Data API connection pool.

### Embedding related tables

- **Relationships come from foreign keys.** One-to-many: `select('id, name, instruments ( id, name )')`. Many-to-many through a join table (composite primary key of two FKs) without naming it: `from('teams').select('id, team_name, users ( id, name )')`.
- **Embeds are left joins:** parents always return; the embed is `[]` (one-to-many) or `null` (many-to-one) when nothing matches. Filtering on an embedded column without `!inner` still returns every parent.
- **Syntax:** `alias:relation(cols)` renames; `relation!inner(cols)` inner-joins; `relation!foreign_key(cols)` disambiguates, e.g. `start_scan:scans!scan_id_start(...)` or by constraint name `from:users!messages_sender_id_fkey(name)` (needed for type inference).
- **Ordering:** ordering a referenced table affects parent order only with `!inner`; order parents by a referenced column with `.order('section(name)', { ascending: true })`; `.limit(1, { referencedTable: 'instruments' })`.
- **Errors:** `PGRST200` stale or missing FK relationship; `PGRST201` (300) ambiguous embedding; `PGRST108` filter on an embed not in `select`; `PGRST118` order by a related table without many-to-one/one-to-one; `PGRST120` an embedded resource only filterable with `is.null`/`not.is.null`.

### Query plans through the API

- **`explain()` is off by default.** Enable (non-production) with `alter role authenticator set pgrst.db_plan_enabled to 'true'; notify pgrst, 'reload config';`, then `.explain({ analyze: true, verbose: true })` (TEXT by default, JSON via `format`). In production restrict `application/vnd.pgrst.plan` in a pre-request function by `cf-connecting-ip`. Disable with `set pgrst.db_plan_enabled to 'false'`.

## Data API error codes

The error body is `{ "code", "details", "hint", "message" }`. Codes are in the response body, not the logs. Full list: `https://supabase.com/docs/guides/api/rest/postgrest-error-codes.md`.

| Postgres code | HTTP |
|---|---|
| `08*` | 503 |
| `09*`, `25*`, `2D*`, `38*`, `39*`, `3B*`, `40*`, `53400`, `54*`, `55*`, `57*`, `58*`, `F0*`, `HV*`, `P0*`, `XX*` | 500 |
| `0L*`, `0P*`, `28*` | 403 |
| `23503`, `23505` | 409 |
| `25006` | 405 |
| `53*` | 503 |
| `P0001` | 400 |
| `42883`, `42P01` | 404 |
| `42P17` (infinite recursion) | 500 |
| `42501` | 403 if authenticated, else 401 |
| anything else | 400 |

Platform conditions: `25006` read-only mode due to disk quota; `53100` disk full; `53300` too many connections; `57P03` cannot accept connections (restart or failover).

| PGRST code | HTTP | Meaning |
|---|---|---|
| `PGRST000` | 503 | bad connection string or Postgres down |
| `PGRST001` | 503 | internal |
| `PGRST002` | 503 | schema cache build failed |
| `PGRST003` | 504 | timed out waiting for a PostgREST pool connection |
| `PGRST100` | 400 | query string parse error |
| `PGRST101` | 405 | functions accept only GET/POST |
| `PGRST102` | 400 | invalid body |
| `PGRST103` | 416 | invalid range |
| `PGRST105` | 405 | invalid UPDATE/UPSERT |
| `PGRST106` | 406 | schema not exposed |
| `PGRST107` | 415 | bad Content-Type |
| `PGRST108` | 400 | filter on an embed not in `select` |
| `PGRST111` | 500 | invalid `response.headers` |
| `PGRST112` | 500 | status must be a positive integer |
| `PGRST114`, `PGRST115` | 400 | PUT upsert issues |
| `PGRST116` | 406 | singular response got 0 or more than 1 rows |
| `PGRST117` | 405 | verb unsupported |
| `PGRST118` | 400 | order by related table without to-one relationship |
| `PGRST120` | 400 | embed filter other than `is.null` |
| `PGRST121` | 500 | can't parse RAISE PGRST JSON |
| `PGRST122` | 400 | invalid Prefer with `handling=strict` |
| `PGRST123` | 400 | aggregates disabled |
| `PGRST124` | 400 | max-affected violated |
| `PGRST125` | 404 | invalid path |
| `PGRST126` | 404 | OpenAPI disabled |
| `PGRST127` | 400 | not implemented |
| `PGRST128` | 400 | max-affected with RPC |
| `PGRST200` | 400 | stale or missing relationship |
| `PGRST201` | 300 | ambiguous embedding |
| `PGRST202` | 404 | missing function or stale function signature |
| `PGRST203` | 300 | ambiguous overloaded functions |
| `PGRST204` | 400 | column not found |
| `PGRST205` | 404 | table not found |
| `PGRST300` | 500 | no JWT secret |
| `PGRST301` | 401 | invalid JWT |
| `PGRST302` | 401 | no bearer token while anon is disabled |
| `PGRST303` | 401 | JWT claims check failed |
| `PGRSTX00` | 500 | internal |

Platform HTTP codes: 402 service restriction (`exceed_*_quota`, `overdue_payment`); 540 project paused; 544 API gateway timeout; 546 Edge Functions resource limit.

- **`42501` causes:** a forbidden schema (`auth`, `vault`), an unexposed custom schema, missing table privileges (check `select grantee, privilege_type from information_schema.role_table_grants where table_name = 'your_table';`), column-level restrictions (including `select *`), RLS on INSERT/UPDATE.

## Debugging

- **Data API failures:** Postgres-level errors with `log_attributes['parsed.user_name'] = 'authenticator'`; gateway errors in `edge_logs` with `log_attributes['response.headers.sb_error_code']` (e.g. `UNAUTHORIZED_MISSING_API_KEY`; empty when PostgREST itself failed) and `match(log_attributes['request.path'], '^/rest/v1/')`.

## Prove it

- **Grants:** for each new table, `select grantee, privilege_type from information_schema.role_table_grants where table_name = 'your_table';` lists exactly the roles you intended, and RLS is enabled in the same migration.
- **API:** a request as `anon` and as a signed-in user returns the expected rows and the expected codes (`42501`, `PGRST116`, `PGRST205`) for the forbidden cases; after DDL, `NOTIFY pgrst, 'reload schema';` and the new objects respond.
