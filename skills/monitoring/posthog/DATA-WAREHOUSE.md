# Data warehouse

The PostHog data warehouse imports business data PostHog does not collect itself (payments, subscriptions, CRM records, support tickets, your production tables) so it can be queried next to events and persons in HogQL ([HOGQL.md](HOGQL.md)). Each source writes tables named `{prefix}_{table_name}`, and each table's sync type, incremental field, primary key and frequency decide most outcomes: whether rows arrive at all, whether updates are missed, whether duplicates appear, and how many rows you are billed for. Modeling on top of the imported tables (catalog, views, dimension tables, warehouse person properties, data quality checks) is [WAREHOUSE-MODELING.md](WAREHOUSE-MODELING.md).

**Contents:** [Native or imported](#native-or-imported) · [Connect a source](#connect-a-source) · [Credentials per source](#credentials-per-source) · [Supabase as a warehouse source](#supabase-as-a-warehouse-source) · [Advanced flow: wizard, db-schema, create](#advanced-flow-wizard-db-schema-create) · [Sync types](#sync-types) · [Frequency](#frequency) · [CDC](#cdc) · [Webhooks](#webhooks) · [Tune a sync](#tune-a-sync) · [Diagnose a failed sync](#diagnose-a-failed-sync) · [Source health audit](#source-health-audit) · [Batch export file downloads](#batch-export-file-downloads) · [Prove it](#prove-it)

## Native or imported

- **PostHog collects** product analytics events, persons, sessions and groups through its SDKs. Session replay, feature flags, experiments, surveys, web analytics, error tracking, AI observability, conversations, logs, revenue analytics, workflows, CDP destinations and batch exports must be enabled.
- **External business data must be imported** through the warehouse: payments, subscriptions, CRM records, support tickets from other systems, production database tables.
- **Signals that data needs importing:** the user names an external tool; a HogQL query fails with "table not found"; the analysis needs revenue, tickets or CRM deals; the user wants PostHog data exported to compare elsewhere.
- **Look before saying data doesn't exist.** Call `posthog:external-data-sources-list`, then `posthog:external-data-schemas-list`, and query `system.information_schema.tables` with `posthog:execute-sql`. Don't guess table names: imported tables are often prefixed (`stripe_charges`, not `charges`) and the user may not know the prefix.
- **Unsupported system:** suggest Postgres or MySQL as a bridge if they can export to a database, or mention that custom sources can be requested.
- **Auto-documentation:** after the first sync PostHog generates descriptions for imported tables and columns (from source column comments where present, plus an LLM pass using table relationships and the team's business context). They appear in `system.information_schema.columns`.

| Need | Sources | Typical tables |
|---|---|---|
| Revenue, payments | Stripe, Chargebee, Shopify | charges, subscriptions, invoices, customers |
| CRM, sales | Hubspot, Salesforce, Attio | contacts, deals, companies |
| Support tickets | Zendesk | tickets, users, organizations |
| Product data from your own DB | Postgres, MySQL, BigQuery, Snowflake, Redshift | your own tables |
| Marketing, ads | Google Ads, Meta Ads, LinkedIn Ads, TikTok Ads | campaigns, ad_groups, ads |
| Email marketing | Mailchimp, Klaviyo | campaigns, lists, subscribers |
| Project management | Linear | issues, projects |
| External error tracking | Sentry | issues, events |

- **Join imported data to persons** (verbatim): `SELECT * FROM stripe_customers sc JOIN persons p ON sc.email = p.properties.$email`. Other useful joins: CRM deals with events (usage against sales outcomes), support tickets with session recordings.

## Connect a source

| Tool | Use |
|---|---|
| `data-warehouse-source-connect-link` | Preferred way to collect credentials: a secure browser or OAuth link |
| `data-warehouse-source-setup` | Preferred way to create: one call validates, discovers tables, applies sync defaults, creates |
| `external-data-sources-wizard` | Source types and the fields each needs |
| `external-data-sources-db-schema` | Validate credentials, list tables with the sync methods each supports |
| `external-data-sources-create` | Advanced create; needs a `schemas` array built from db-schema |
| `external-data-sources-check-cdc-prerequisites-create` | Postgres CDC pre-flight |
| `external-data-sources-webhook-info-retrieve`, `external-data-sources-create-webhook-create`, `external-data-sources-update-webhook-inputs-create` | Webhook state, registration, manual signing secret |
| `external-data-sources-list`, `external-data-schemas-list` | Status after create |
| `data-warehouse-stored-credentials-list` | Find a stored credential id (filter by `source_type`, newest first) |
| `external-data-sources-destinations-retrieve` | Where a source writes, when destinations are on for the project |

### The one-step flow

1. **Optional:** `external-data-sources-wizard` to learn the credential fields.
2. **`data-warehouse-source-connect-link({source_type})`** returns a `connect_url` to a minimal page with the source's full connection form (OAuth or credentials; the response's `auth_method` says which). The page validates against a live connection and stores the details encrypted in a temporary store. It does NOT create the source. Find the id with `data-warehouse-stored-credentials-list` and pass `{"credential_id": <id>}` to setup. Stored credentials are single-use (deleted when setup consumes them) and expire after 24 hours.
3. **`data-warehouse-source-setup({source_type, payload, prefix})`** validates, discovers all tables, enables them with defaults (incremental where a tracking column exists, else append, else full_refresh, never CDC), sets `created_via=mcp` and creates. The payload carries `{"credential_id": ...}`, or the OAuth integration id key, or inline credentials for headless automation; no `schemas` array.

- **Every discovered table is enabled.** Flag row counts for very large tables and offer the advanced flow to sync a subset. Syncing is metered by rows synced: flag large tables and offer longer sync frequencies (`sync_frequency: "24hour"`) as the default. On success, call `external-data-schemas-list` to show what was enabled and how each table syncs.
- **An already-connected OAuth integration** goes in by its id key, for example `{"hubspot_integration_id": 123}`.
- **Webhooks register automatically** for sources that support them (currently Stripe). Read the `webhook` key in the setup response. On success webhook-capable tables sync in real time and webhook-only tables are enabled too. On failure tables keep polling defaults and webhook-only tables (for example Stripe Discount) stay disabled; relay `webhook.error`. If `webhook.pending_inputs` is non-empty, submit them with `external-data-sources-update-webhook-inputs-create`.
- **Never ask users to paste raw database passwords, API keys or OAuth tokens into chat.** Use the connect link.

### Prefix

- **Tables become `{prefix}_{table_name}` in HogQL.** Default prefix: the source type lowercased (`stripe`, `postgres`). If one exists, distinguish (`postgres_prod`, `postgres_analytics`). Lowercase, underscore-separated. Confirm before creating: changing it later renames every table.

### After create

- **Every enabled schema goes `Running`, then `Completed`.** First syncs take seconds to hours. Query with `SELECT * FROM {prefix}_{table_name} LIMIT 10`.
- **Destinations:** a new source syncs to the PostHog warehouse by default; some projects can also send tables to their own database. Never set up a destination while creating a source: one added after sync has none of the history until resynced, and a resync bills every destination.

## Credentials per source

- **Reachable host:** `localhost`, `127.0.0.1` and private RFC-1918 hosts (`10.x`, `192.168.x`, `172.16.x` to `172.31.x`) are rejected. Serverless or managed Postgres (Neon, Supabase, RDS behind strict rules) often needs PostHog's egress IPs allowlisted. If the host isn't publicly reachable: browser deep-link or SSH tunnel.
- **Never pass an unresolved `{"secretRef": ...}`;** create, db-schema and setup reject it.

| Source | Use |
|---|---|
| Supabase | Use the [canonical Supabase connection modes and CDC prerequisites](#supabase-as-a-warehouse-source). Database passwords differ from API/JWT and account credentials. [existing DATA-WAREHOUSE.md; official Supabase/PostHog connection docs below] |
| Stripe | A restricted key (`rk_live_…`), not the standard secret key (`sk_live_…`). One recovery example in the vendor sync-diagnosis skill updates Stripe with `stripe_secret_key: "sk_live_..."` while its own text says to grab a fresh restricted key; the source setup skill says `rk_live_…`. |
| RevenueCat | v2 secret key (`sk_…`) with read scopes |
| Sentry | Internal-integration token, not a DSN, not a personal auth token |
| Convex | Requires the Professional plan |
| Twilio | API Key SID plus Secret, not the account auth token |
| Mailchimp | The key carries a datacenter suffix (`key-usX`) |
| Resend, Mailgun (send-only) | The key in the env is often restricted; import needs a full or read-access key |

## Supabase as a warehouse source

- **Set up:** `npx @posthog/wizard warehouse`, or Data pipeline > sources > New source > Supabase. The Supabase connector is the Postgres integration; CDC sync is in alpha.
- **Connection details:** Supabase dashboard **Connect** > **Direct** tab > **Session pooler** or **Direct connection**.

| Field | Value |
|---|---|
| Host | The Session pooler hostname, e.g. `aws-0-us-east-1.pooler.supabase.com`. Not the Project URL `<ref>.supabase.co` (the REST endpoint); not the direct host `db.<ref>.supabase.co` (IPv6 unless the IPv4 add-on is enabled; CDC requirements are below) |
| Port | Default `5432` |
| Database | `postgres` |
| User | `postgres.<project-ref>` |
| Schema | Optional; default `public`, blank means all |

- **Connection modes:** shared Session pooler uses `5432`; shared Transaction pooler uses `6543`; Direct uses `5432`. The old vendor credential row called `6543` the Session port. Copy the actual hostname, port and role from Dashboard Connect; the pooler cluster index cannot be inferred from region. Shared pooler custom-role usernames are `<role>.<project-ref>`, while direct credentials use the role itself. [https://supabase.com/docs/guides/database/connecting-to-postgres.md; https://posthog.com/docs/cdp/sources/supabase]
- **IP qualification:** shared poolers are IPv4. The direct host is IPv6 unless the project has the IPv4 add-on, which switches that endpoint to IPv4. The source's unqualified direct-is-IPv6 wording applies without that add-on. [https://supabase.com/docs/guides/database/connecting-to-postgres.md]
- **CDC needs Direct connection plus the Supabase IPv4 add-on:** logical replication doesn't work through the pooler.
- **SSH tunnel** is optional ("Require TLS through tunnel?" defaults to on).
- **Sources created after February 18, 2026 require SSL/TLS.**
- **Columns are selectable per table;** the primary key and incremental field are always synced.
- **Connect as a dedicated read-only role,** not the `postgres` superuser.
- **Allow PostHog's inbound IPs.** US: `44.205.89.55`, `52.4.194.122`, `44.208.188.173`. EU: `3.75.65.221`, `18.197.246.42`, `3.120.223.253`.

## Advanced flow: wizard, db-schema, create

- **Call the wizard WITH `source_type`** (comma-separated, for example `Postgres,Stripe`); the unfiltered response is hundreds of KB. To enumerate all, pass `fields: ['*.name', '*.caption']`. The response is a dict keyed by source type: `name`, `caption`, `fields` (each with `name`, `type` of input/password/switch/select/file-upload, `required`), `featured`, `unreleasedSource`. Skip `unreleasedSource: true` unless the user asked for a preview.
- **An ambiguous "database":** present Postgres, MySQL, MongoDB, BigQuery, Snowflake, Redshift.
- **OAuth sources (Hubspot, Salesforce, Google Ads):** the user authorizes in the PostHog UI. OAuth is authentication, not data flow; they still use polling bulk sync, not webhooks.
- **Never ask for more fields than the wizard marks required.**
- **db-schema validates credentials:** a 400 carries `message`; show it verbatim (for example "password authentication failed for user 'x'"). Each returned entry has `table`, `should_sync`, `rows`, `incremental_available`, `append_available`, `cdc_available` (null means not enabled for the team), `supports_webhooks`, `incremental_fields` [{field, type, label}], `detected_primary_keys`, `available_columns` [{field, type, nullable}], `description`.
- **Create payload** (verbatim, Postgres):

```json
{
  "source_type": "Postgres",
  "prefix": "postgres_prod",
  "payload": {
    "host": "...",
    "port": "5432",
    "dbname": "...",
    "user": "...",
    "password": "...",
    "schema": "public",
    "schemas": [
      {
        "name": "orders",
        "should_sync": true,
        "sync_type": "incremental",
        "incremental_field": "updated_at",
        "incremental_field_type": "datetime",
        "primary_key_columns": ["id"]
      },
      {
        "name": "users",
        "should_sync": true,
        "sync_type": "full_refresh"
      },
      {
        "name": "audit_log",
        "should_sync": false
      }
    ]
  }
}
```

- **`schemas` rules:** include every db-schema table (unmentioned ones get `should_sync: false`); `sync_type` is required only when `should_sync: true`; `incremental_field` and `incremental_field_type` are required for `incremental` or `append`; `primary_key_columns` is required for `cdc`. The first sync starts automatically.
- **Anti-patterns:** skipping db-schema (create accepts invalid credentials, then fails async and the source shows `Error` with no tables); auto-selecting every table in a large database (billing); inventing schemas db-schema didn't return.

## Sync types

| Sync type | What it does | Requires | Good for |
|---|---|---|---|
| `full_refresh` | Drops everything, re-imports each sync | Nothing | Small tables, dimension tables, when in doubt |
| `incremental` | Only rows where `incremental_field > last_value` | `incremental_field` + `incremental_field_type` | Large tables with `updated_at`/`modified_at` |
| `append` | Like incremental but keeps prior versions | same | Immutable or append-only (events, logs) |
| `cdc` | Postgres logical replication | Postgres, PKs, wal_level=logical | Near-real-time large Postgres tables |
| `webhook` | Real-time push from the source's webhook | Source implements `WebhookSource` | Stripe |

- **Under about 50k rows with no ordering column:** `full_refresh` daily. Don't fake incremental.
- **Large with `updated_at`/`modified_at`:** `incremental`. **Large with only `created_at`:** `incremental`, with a warning that it misses updates. **Monotonic integer id:** `incremental` with type `integer`.
- **Immutable events or logs:** `append` if available, else `incremental`.
- **Postgres needing changes within minutes, including deletes:** `cdc` (see [CDC](#cdc)).
- **`supports_webhooks: true`:** `webhook` (see [Webhooks](#webhooks)). Tables on the same source that don't support webhooks need a normal bulk `sync_type`.

### Incremental field and type

- **Priority:** (1) `updated_at` / `modified_at` / `last_modified` / `hs_lastmodifieddate`; (2) `created_at` / `inserted_at` (immutable tables only); (3) a monotonic integer PK (`id`, `sequence_number`); (4) MongoDB `_id` (ObjectId). The field must appear in db-schema's `incremental_fields` (only timestamp, integer or ObjectID columns the source can filter cheaply).
- **`incremental_field_type`:** `datetime` (TIMESTAMP, DATETIME, TIMESTAMP WITH TIME ZONE), `date` (DATE), `timestamp` (unix-epoch integers), `integer` (INT, BIGINT, SERIAL), `numeric` (monotonically increasing NUMERIC, DECIMAL), `objectid` (MongoDB). A mismatch fails the first sync with a type coercion error.
- **`primary_key_columns`:** required for `cdc`, strongly recommended for `incremental` on mutable tables (upsert dedup). If the source didn't detect one but the table has a natural key, pass it explicitly. With no unique key, avoid `cdc`. Errors: "Primary key required for incremental syncs", "primary keys for this table are not unique".

## Frequency

- **`sync_frequency` values:** `"5min"`, `"15min"`, `"30min"`, `"1hour"`, `"6hour"`, `"12hour"`, `"24hour"`, `"7day"`, `"30day"`, `"never"`. `5min` is the floor for every type; the API rejects anything faster.
- **Pick by type:** non-trivial full_refresh `24hour` (sub-hour is usually wasteful); incremental and append `1hour` or `6hour` (for real time prefer `cdc` or `webhook` over `5min`); cdc `5min` to stay near real time (the API rejects slower than `7day` for cdc because captured changes expire after 14 days); cold archives `7day` or `30day`.
- **`never` freezes the schema;** trigger manually with `external-data-schemas-reload`.
- **`sync_time_of_day`:** `HH:MM:SS`, for daily or weekly-scale frequencies.

## CDC

- **Pre-flight first:** run `external-data-sources-check-cdc-prerequisites-create` before db-schema. It returns `{valid, errors[]}` covering wal_level, replication slot, publication and permissions. If `valid: false`, don't create: unmet prerequisites fail the sync immediately on the first run.
- **Loads on the sync frequency,** every 5 minutes at the fastest.
- **`cdc_table_mode`:** `consolidated` (default, current state per row); `cdc_only` (append-only change log of insert, update, delete); `both` (consolidated plus a separate CDC log table; doubles storage).

## Webhooks

- **Only Stripe implements `WebhookSource`.** Don't promise webhooks for Hubspot, Salesforce or Postgres. Per-table `supports_webhooks` is the source of truth.
- **Check before registering:** `external-data-sources-webhook-info-retrieve({id})`. If `exists: true`, don't call create-webhook again (duplicate deliveries).
- **`external-data-sources-create-webhook-create({id})`** creates the HogFunction, builds the schema_mapping, registers with the source API and on Stripe captures the `signing_secret` automatically. Returns `{success, webhook_url, error}`. Call it after create when a table uses `webhook`; skipped, webhook schemas sit with no data flowing.
- **On a permission failure** the HogFunction is created disabled. The user creates the webhook manually at `webhook_url` and copies the signing secret; then call `external-data-sources-update-webhook-inputs-create({id}, {inputs: {signing_secret: "whsec_..."}})`.
- **Healthy:** `exists: true`, `external_status.status: "enabled"`, no `error`.
- **The first load still polls** (until `initial_sync_complete` flips true), and a webhook schema keeps its `sync_frequency` as a reconciliation safety net. Both are expected.

For this workflow, read [CUSTOM-SOURCES.md](CUSTOM-SOURCES.md). [existing skills/monitoring/posthog/DATA-WAREHOUSE.md]

## Tune a sync

In an authorized recovery follow-up, billing-capped schemas can be disabled with `external-data-schemas-partial-update`; a read-only health audit must not perform that mutation. The old health-audit paragraph mixed the two modes. [existing DATA-WAREHOUSE.md]

- **Change with `external-data-schemas-partial-update`,** sending only changed fields: `sync_type`, `incremental_field`, `incremental_field_type`, `primary_key_columns`, `cdc_table_mode`, `sync_frequency`, `sync_time_of_day`, `should_sync`.
- **Always `external-data-schemas-retrieve` first, and don't tune a `Running` schema** (wait or `external-data-schemas-cancel`): a mid-sync update can leave the high-water mark inconsistent.
- **Availability changes over time:** the incremental-fields response tells you what is available now (CDC may have been enabled for the team since creation). If the target field isn't listed, the user picks another or adds one to the source table.
- **`external-data-schemas-incremental-fields-create`** re-reads the source and returns `incremental_fields`, `incremental_available`, `append_available`, `cdc_available`, `full_refresh_available`, `detected_primary_keys`, `available_columns`.

Example payloads (verbatim):

```json
// Switch from full_refresh to incremental
{
  "sync_type": "incremental",
  "incremental_field": "updated_at",
  "incremental_field_type": "datetime"
}

// Change sync frequency to hourly
{"sync_frequency": "1hour"}

// Fix wrong PK on a CDC table
{"primary_key_columns": ["tenant_id", "order_id"]}

// Pause a schema
{"should_sync": false}
```

| Change | Resync? |
|---|---|
| `sync_frequency`, `sync_time_of_day`, `should_sync` | No |
| `cdc_table_mode` | No, in most cases |
| incremental to/from full_refresh with the same field | No |
| to/from webhook | No |
| `incremental_field` | May need one |
| `primary_key_columns` | May need one; required on a CDC table (tombstones and upsert keys mismatch) |
| full_refresh to append, append to full_refresh | May need one |
| to/from cdc | May need one; required for incremental to cdc |

- **When a resync may be needed:** partial-update, warn the user, then `resync` (or `delete-data` then `reload`). Without a wipe after a shape change, row shapes mix and queries return garbage.
- **Incremental to CDC:** prerequisites return `valid: true`, confirm `cdc_available: true`, partial-update `{sync_type: "cdc", primary_key_columns: [...], cdc_table_mode: "consolidated"}`, then resync.
- **Switching to webhook:** confirm `supports_webhooks: true`, partial-update, register if none exists, no resync, keep `sync_frequency` (for example `24hour`). **Switching off:** partial-update to a bulk type with its `incremental_field` + `incremental_field_type`, then delete the webhook (`external-data-sources-delete-webhook-create`) only if no other webhook schema on the source uses it; webhooks are registered per source and shared.
- **Rotate a signing secret** with `update-webhook-inputs-create`; no reload needed.
- **After a non-destructive change:** `reload` to apply it now instead of waiting for the schedule, then retrieve to confirm `Running` then `Completed` (a frequency change needs no reload). Resume a paused schema with `{should_sync: true}`, then `reload`. Frequency is cheap to change; `sync_type` and `incremental_field` are expensive.

## Diagnose a failed sync

- **Work top-down: source, then schema, then recovery.** Don't jump to resync.
- **Source level:** `ExternalDataSource.status = "Error"` affects every table. **Schema level:** `"Failed"`, `"Billing limits"`, `"Billing limits too low"` (enums `BillingLimitReached`, `BillingLimitTooLow`; match both). A source can look `Completed` while a schema is `Failed`.
- **Statuses:** `Running` (normal unless stuck; `Running` with `last_synced_at` 12 hours ago is almost certainly stuck), `Completed`, `Failed` (read `latest_error`), `Paused` (`should_sync = false`), the billing statuses. If `latest_error` is null but the schema is `Failed`, retrieve the schema directly. `Billing limits` means the team hit its row quota; `Billing limits too low`, insufficient credit.
- **Source status overrides schema status:** fixing a source in `Error` usually fixes all its schemas.
- **Webhook failures hide behind a green status:** the bulk safety-net sync keeps the schema `Completed` while the push path is broken, and webhook issues don't surface on `external-data-schemas-list`. When data is hours behind on a webhook schema, call `webhook-info-retrieve` first.

| `latest_error` contains | Cause | Fix |
|---|---|---|
| `authentication failed`, `401`, `403`, `invalid credentials` | Credentials expired or rotated | `external-data-sources-partial-update` with new `job_inputs` |
| `Could not establish session to SSH gateway`, `Could not connect to your SSH tunnel` | SSH tunnel | Check host, key, bastion |
| `Primary key required for incremental syncs` | No PK with incremental or cdc | Add a PK or switch to `full_refresh` |
| `primary keys for this table are not unique` | Wrong PK | Pick a different PK via `partial-update` |
| `Integration matching query does not exist` | Saved integration deleted | Recreate the source |
| `column "X" does not exist`, `does not have a column named` | Schema drift | `incremental-fields-create`, then `partial-update` |
| `relation "..." does not exist` | Table dropped or renamed | Remove the schema or rename source-side |
| `SSL`, `connection refused`, `timeout`, `unreachable` | Network, firewall, allowlist | User side: check host, port, allowlist |
| `replication slot`, `publication`, `wal_level` | CDC prerequisites | `check-cdc-prerequisites-create`; may need the slot recreated |
| `Schema exceeds row limit`, `billing` | Billing | Upgrade the plan or disable the schema |

| Case | Recovery |
|---|---|
| A: transient | `external-data-schemas-reload` |
| B: credentials | partial-update, then the automatic reload or `external-data-sources-reload` |
| C: schema drift | `external-data-schemas-incremental-fields-create` + `external-data-schemas-partial-update` |
| C2: new or renamed tables | `external-data-sources-refresh-schemas` |
| D: bad incremental state (duplicates, missing rows) | `external-data-schemas-resync` |
| E: CDC broken | Prerequisites, fix, reload (resync if the WAL position is lost) |
| F: stuck `Running` | `external-data-schemas-cancel`, then `reload` |
| G: corrupt data, keep the config | `external-data-schemas-delete-data`, then reload |
| H: billing | Non-technical |
| I: webhook not receiving | webhook-info, then re-create, re-enable, or rotate the signing secret via `update-webhook-inputs-create`; confirm 2xx in the source's webhook logs. Remove a broken webhook with `external-data-sources-delete-webhook-create` before re-registering. |

- **Destructive, confirm first:** `external-data-schemas-resync`, `external-data-schemas-delete-data`, `external-data-sources-destroy`.
- **Starting a table over:** prefer `delete-data` + `reload` over `resync` plus a new schema entry.
- **Destination failures:** `latest_error` is prefixed with the destination name, for example `customer postgres: connection refused`. That is the customer's database refusing the write: check it and its credentials, not the source. One unreachable destination holds up the whole sync, PostHog included.

## Source health audit

- **`data-warehouse-data-health-issues-retrieve`** aggregates five categories: `source`, `external_data_sync`, `materialized_view`, `destination` (batch export), `transformation` (HogFunction). Entries carry `id`, `name`, `type`, `status`, `error`, `failed_at`, `url` and `source_type`. Materialized view issues are in [WAREHOUSE-MODELING.md](WAREHOUSE-MODELING.md#view-health-audit).
- **`source`:** `ExternalDataSource.status = Error` (High). **`external_data_sync`:** Failed or BillingLimitReached, returned as `status: "failed"` or `status: "billing_limit"` (Medium to High).
- **Not flagged:** paused schemas (`should_sync = false`), stale but `Completed` schemas, webhook problems.
- **Priority:** sources in Error first (they cascade; name the schemas under them), then `billing_limit`, then Failed on heavily used tables, then the rest.
- **Deeper checks, only when asked:** stale schemas (old `last_synced_at` against `sync_frequency`, for example `1hour` last synced 3 days ago); abandoned sources (every schema `should_sync: false` or `Paused`), cleaned up with `external-data-sources-destroy`; webhook state via `external-data-sources-webhook-info-retrieve` (`exists: false`, `external_status.error`, `external_status.status` not `"enabled"`).
- **The audit is read-only.** An empty response means no issue was returned in its supported categories; paused schemas, stale Completed schemas and webhook failures still need their own checks. The old line called the empty result healthy despite those omissions. Hand off authorized fixes to [Diagnose a failed sync](#diagnose-a-failed-sync) or [Tune a sync](#tune-a-sync); route destination and transformation entries to their product owners. [existing DATA-WAREHOUSE.md, source health audit]

## Batch export file downloads

- **Tools:** `posthog:file-download-batch-exports-create`, `posthog:file-download-batch-exports-retrieve`, `posthog:file-download-batch-exports-cancel-create`, `posthog:file-download-batch-exports-count-rows-create`. Don't use an MCP tool for `/download/` (it redirects).
- **`model`:** `events`, `persons`, `sessions` or `hogql`.
- **`data_interval_start` / `data_interval_end`:** ISO 8601, not in the future, ordered, at most one week apart. Required for events, persons and sessions; for hogql only for the placeholders the query references (with one placeholder, the other bound may be omitted and the one-week limit doesn't apply). Split longer requests into separate runs.
- **`file.format`:** `Parquet` (compact analytics) or `JSONLines` (line-oriented text processing). **`file.compression`:** `zstd`, `gzip`, `brotli`, `lz4`, `snappy` (JSONLines only `gzip`, `brotli`). **`file.max_size_mb`:** part size, default 1024 MiB (a part can go a little over); `null` means a single file.
- **`include` / `exclude`** event filters apply to events only. **`hogql_modifiers`** (optional), for example `{"convertToProjectTimezone": true}`; timestamps are UTC otherwise. Pass the same modifiers to count-rows.
- **The hogql model** is a closed beta per team: every SELECT column must be a field or aliased; placeholders are `{data_interval_start}` / `{data_interval_end}`, compared as `>= {data_interval_start}` and `< {data_interval_end}` so consecutive ranges don't export a row twice. The bounds only replace placeholders and filter nothing themselves. A permission error saying HogQL batch exports aren't enabled means no beta: report it (support grants access), don't retry. Resource limits are stricter: on memory, time or bytes-read failures, narrow the WHERE clause.

```json
{
  "model": "events",
  "file": {
    "format": "JSONLines",
    "compression": "gzip"
  },
  "include": ["$pageview"],
  "data_interval_start": "2026-05-25T00:00:00Z",
  "data_interval_end": "2026-05-26T00:00:00Z"
}
```

```json
{
  "model": "hogql",
  "file": {
    "format": "Parquet"
  },
  "hogql_query": "SELECT event, timestamp, properties.$current_url AS url FROM events WHERE timestamp >= {data_interval_start} AND timestamp < {data_interval_end}",
  "data_interval_start": "2026-05-25T00:00:00Z",
  "data_interval_end": "2026-05-26T00:00:00Z"
}
```

- **Statuses:** `Starting` / `Running` (poll); `Completed` (read `files`, which are UUIDs, and `records_completed`); `Cancelled`; `Failed`, `FailedRetryable`, `FailedBilling`, `Terminated`, `TimedOut` (report `error`). It may briefly report `Running` after completing. Finished or failed exports can't be cancelled; a cancelled `id` can't be reused but still retrieves `Cancelled`. Report `records_completed` to the user.
- **Download each part:** `GET /api/projects/{project_id}/file_download_batch_exports/{run_id}/download/{part}/` (`part` is a file UUID or a zero-based index ordered by key); a single file: `GET /api/projects/{project_id}/file_download_batch_exports/{run_id}/download/`. Follow the redirect or read `Location`. Signed URLs are temporary (call the endpoint again for a fresh one); don't send them to unrelated services unless asked. Save to a file with names like `posthog-events-<run_id>-<part>.jsonl.gz` or `posthog-persons-<run_id>-<part>.parquet`. Download every part.

## Prove it

- **The tables exist:** `system.information_schema.tables` lists `{prefix}_{table_name}` for every enabled schema, and `SELECT * FROM {prefix}_{table_name} LIMIT 10` returns rows.
- **Every schema finished:** `external-data-schemas-list` shows each enabled schema `Completed`, none `Failed` or in a billing status, and no `Running` schema whose `last_synced_at` is hours old.
- **Credentials never went through chat:** the source was created from a `credential_id` (connect link) or an OAuth integration id.
- **Incremental tables are right:** each `incremental` schema uses a field from db-schema's `incremental_fields` with the matching `incremental_field_type`, mutable ones have `primary_key_columns`, and a second sync adds no duplicates.
- **CDC pre-flight passed:** `external-data-sources-check-cdc-prerequisites-create` returned `valid: true` before any `cdc` schema was created.
- **Webhooks are live:** `external-data-sources-webhook-info-retrieve` shows `exists: true`, `external_status.status: "enabled"`, no `error`, and the source's webhook logs show 2xx.
- **Custom REST previewed:** `external-data-sources-preview-resource` returned real records (not an envelope like `[{ "data": [...] }]`) for every resource, with a unique `primary_key`, before create.
- **Health is clean:** `data-warehouse-data-health-issues-retrieve` returns nothing for `source` and `external_data_sync`.
- **Exports complete:** each file download run reaches `Completed` with `records_completed` reported, and every part in `files` was downloaded.
