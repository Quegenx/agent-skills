# Realtime: operations

Moved unchanged from [REALTIME.md](REALTIME.md) to keep each file under the size cap. Connections, heartbeats and reconnects, limits, settings, local development and self-hosting, the wire protocol, debugging and the dated changes

## Connections, heartbeats and reconnects

- **The client sends a heartbeat every 25 s** and reconnects with backoff 1, 2, 5, 10 s when one times out. Watch it with `supabase.realtime.onHeartbeat(cb)` or `realtime: { heartbeatCallback }`; reconnect manually with `supabase.realtime.connect()`. The interval is configurable (`heartbeatIntervalMs: 15000`).
- **Background browser tabs throttle timers,** heartbeats stop and the socket drops silently. Use both `realtime: { worker: true }` (heartbeats in a Web Worker, optional `workerUrl: '/worker.js'`) and `heartbeatCallback: (status) => { if (status === 'disconnected') client.connect() }`.
- **Mobile apps:** when `AppState` becomes `active`, `if (!supabase.realtime.isConnected()) supabase.realtime.connect()`.
- **Treat unexpected `CLOSED` or `TIMED_OUT` as reconnect cases,** not hard errors, and always back off exponentially: reconnect loops are a listed cause of project suspension. `tenant_events` disconnects reconnect by themselves once throughput falls below the limit.
- **Reverse proxies must forward the `Upgrade` and `Connection` headers;** the WebSocket request must return `101 Switching Protocols`.

### What to do with each error

| Join error | Action |
|---|---|
| `InvalidJWTExpiration` | Refresh the token, then rejoin |
| `MalformedJWT`, `JwtSignatureError`, `Unauthorized` | Don't retry; fix the token |
| `ConnectionRateLimitReached`, `ClientJoinRateLimitReached`, `ChannelRateLimitReached` | Back off |
| `InitializingProjectConnection`, `IncreaseConnectionPool`, `DatabaseLackOfConnections`, `UnableToConnectToProject` | Retry with exponential backoff |
| `TopicNameRequired`, `TenantNotFound`, `RealtimeDisabledForTenant`, `RealtimeDisabledForConfiguration` | Don't retry; fix the configuration |
| `RealtimeRestarting` | Retry with backoff |

- **Channel-level `system` errors** have no code (match on `message`), are always followed by `phx_close`, and reach you only if you listen to `system` events: `Too many messages per second`, `Too many presence messages per second`, `Client presence rate limit exceeded`, `Track message size exceeded`, `Token has expired`, ``Fields `role` and `exp` are required in JWT``, `Server requested disconnect`, `Replication connection was not established in time`. After a rate-limit close, throttle before rejoining; after a token error, refresh first; a `phx_close` with no preceding error is a clean close. On `phx_error` (the channel process died), rejoin with backoff.
- **Postgres Changes subscription errors leave the channel open:** an invalid filter operator or missing schema or table (fix and rejoin; the server won't retry); a failed subscription insert because the table or publication is missing, or a database error (the server retries every 5 to 10 s); `Too many database timeouts` (the protocol page says no server retry, the settings page says clients retry after 5 to 10 s; check the current docs).
- **`MalformedWebSocketMessage` and `UnknownErrorOnWebSocketMessage`** drop the message and keep the connection.
- **The full error code table** (88 codes) is at `https://supabase.com/docs/guides/realtime/error_codes.md`. Codes worth recognizing: `IncreaseSubscriptionConnectionPool`, `UnableCheckoutConnection`, `QueryCanceled` (usually a statement timeout), `MissingAPIKey` (no `x-api-key` header or `apikey` query param), `RlsPolicyError`, `UnableToSetPolicies`, `ReplicationSlotLagTooHigh` (WAL lag above 50% of `max_slot_wal_keep_size`; the connection restarts to avoid slot invalidation), `ReplicationMaxWalSendersReached`, `ReplicationSlotBeingUsed`, `ReplicationConnectionDown`, `ReplicationPollerMaxRetriesReached`, `StartReplicationFailed`, `UnableToBroadcastChanges`, `MissingPartition`, `PartitionCreationFailed`, `JanitorFailedToDeleteOldMessages`, `UnableToReplayMessages`.

## Limits

| Limit | Free | Pro | Pro, no spend cap | Team | Enterprise |
|---|---|---|---|---|---|
| Concurrent connections | 200 | 500 | 10,000 | 10,000 | 10,000+ |
| Messages per second | 100 | 500 | 2,500 | 2,500 | 2,500+ |
| Channel joins per second | 100 | 500 | 2,500 | 2,500 | 2,500+ |
| Channels per connection | 100 | 100 | 100 | 100 | 100+ |
| Presence keys per object | 10 | 10 | 10 | 10 | 10+ |
| Presence messages per second | 20 | 50 | 1,000 | 1,000 | 1,000+ |
| Presence calls per client per 30 s | 5 | 5 | 5 | 5 | 5 |
| Broadcast payload | 256 KB | 3,000 KB | 3,000 KB | 3,000 KB | 3,000+ KB |
| Postgres Changes payload | 1,024 KB | 1,024 KB | 1,024 KB | 1,024 KB | 1,024+ KB |
| Replay retention / messages per request | 72 h / 25 | 72 h / 25 | 72 h / 25 | 72 h / 25 | 72 h / 25 |

- **Counting:** an event is a WebSocket message sent to or from a client, so one broadcast to 100 subscribers is 100 events, and each database change counts once per listening client. Messages per second is a rolling average over the last minute. "Presence keys per object" is not defined anywhere in the docs.
- **What a "connection" is differs between pages:** the Concepts page counts subscribed channels across all clients; the Settings page and the peak-connections guide count one WebSocket per client no matter how many channels it joins (100 connected users are 100 connections, each joining several channels). Check the current docs.
- **Refusals:** `too_many_channels` (per connection), `too_many_connections` (project), `too_many_joins` (per second), `tenant_events` (messages per second; disconnects). Limits beyond Free and Pro can be raised through support. Suspension is manual, after review of a project far over limits or misbehaving, shows as `RealtimeDisabledForTenant`, and is lifted through support. Load tests or staging pointed at production are a listed cause; keep dev and prod separate.

## Settings (Dashboard Realtime > Settings)

Any change disconnects every client. Rate and payload limits are editable only with the organization's spend cap off.

| Setting | Default | Effect when wrong |
|---|---|---|
| Enable Realtime service | On | Off: clients disconnected, new connections `403` `Realtime was disabled for this tenant`, joins `RealtimeDisabledForTenant`, REST `403`; database connections and the slot are released until the first connection after re-enabling |
| Allow public access to channels | On | On: no policy check on public channels. Off: every join checked against RLS, non-private clients get `PrivateOnly` |
| Database connection pool size | By compute (1 to `max_connections`) | Too low: `IncreaseConnectionPool`, dropped broadcasts, failed presence; once timeouts in a 30 s window reach the pool size, later checks fail immediately. Too high: competes for `max_connections`; Realtime won't start (`DatabaseLackOfConnections`) |
| Postgres Changes connection pool size | 2 (1 to 20) | Used only while creating subscriptions. Too low: `Too many database timeouts` during bursts; raise it for deploys and mass reconnects |
| Max concurrent clients | Plan limit | Too low: `429` `Too many connected users` |
| Max events per second | Plan limit | Too low: channels closed with `Too many messages per second` (supabase-js rejoins), REST `429`. Too high: no protection from runaway loops |
| Max presence events per second | Plan limit | Too low: `Too many presence messages per second`; presence also counts toward events per second |
| Max payload size in KB | Plan limit | Oversized broadcasts dropped (the sender learns only with `ack`), REST `422`, oversized `track` closes the channel with `Track message size exceeded` |

The Postgres Changes pool default of 2 differs from the per-compute Subscription management defaults (2 to 9) in the resources table; the docs don't say whether they are the same pool.

## Local development and self-hosting

- **CLI `config.toml`:** `[realtime] enabled` (default `true`), `ip_version` (default `"IPv6"`).
- **Self-hosted Docker:** Realtime is at `http://<your-domain>:8000/realtime/v1/` and can be removed from `docker-compose.yml` if unused. Secrets: `SECRET_KEY_BASE` (at least 64 characters, `openssl rand -base64 48`) and `REALTIME_DB_ENC_KEY` (exactly 16 characters, `openssl rand -hex 8`, encrypts fields in the `_realtime` schema). Asymmetric keys: `API_JWT_JWKS: ${JWT_JWKS:-{"keys":[]}}`. Postgres `log_min_messages` defaults to `fatal` to hide redundant Realtime logs.
- **Compose service:** image `supabase/realtime:v2.143.3`; keep the container name `realtime-dev.supabase-realtime` (the tenant ID is parsed from the subdomain); healthcheck `http://localhost:4000/api/tenants/realtime-dev/health`; env includes `PORT: 4000`, `DB_USER: supabase_admin` (must be a superuser), `DB_AFTER_CONNECT_QUERY: 'SET search_path TO _realtime'`, `API_JWT_SECRET: ${JWT_SECRET}`, `SEED_SELF_HOST: "true"`, `RUN_JANITOR: "true"`.
- **Self-hosted limits live on the tenant record** (for example `max_concurrent_users`). Server defaults used at tenant creation: `TENANT_MAX_CONCURRENT_USERS` 200, `TENANT_MAX_EVENTS_PER_SECOND` 100, `TENANT_MAX_JOINS_PER_SECOND` 100, `TENANT_MAX_CHANNELS_PER_CLIENT` 100, `TENANT_MAX_BYTES_PER_SECOND` 100_000. The server's env docs call `TENANT_MAX_CONCURRENT_USERS` a per-channel limit while the platform docs treat `max_concurrent_users` as the project quota; check the current docs.
- **Other server defaults:** `MAX_CONNECTIONS` 16384 (soft WebSocket cap), `MAX_HEADER_LENGTH` 4096 bytes, `NUM_ACCEPTORS` 100, `DB_POOL_SIZE` 5, `DB_QUEUE_TARGET`/`DB_QUEUE_INTERVAL` 5000, `CLIENT_PRESENCE_MAX_CALLS` 5, `CLIENT_PRESENCE_WINDOW_MS` 30000, `PRESENCE_BROADCAST_PERIOD_IN_MS` 1500, `PRESENCE_POOL_SIZE` 10, `CHANNEL_ERROR_BACKOFF_MS` 5000, `CONNECT_ERROR_BACKOFF_MS` 2000, `ACCESS_TOKEN_THROTTLE_MS` 10000, `WEBSOCKET_MAX_HEAP_SIZE` 50MB (the socket process is killed at it), `LOG_LEVEL` info. `SLOT_NAME_SUFFIX` is appended to `supabase_realtime_replication_slot` (64 characters total at most). `JWT_CLAIM_VALIDATORS` (for example `{"iss":"Issuer"}`), `API_JWT_SECRET_NEXT` for secret rotation, `DB_ENC_KEY_GCM` (32 characters, AES-256-GCM) with `DB_ENC_WRITE_GCM`, `JANITOR_SCHEDULE_TIMER_IN_MS`.
- **The `realtime` schema lock-down applies self-hosted too.**

## The wire protocol

For clients without a Supabase SDK.

- **URL:** hosted `wss://<PROJECT_REF>.supabase.co/realtime/v1/websocket?apikey=<API_KEY>`, self-hosted `wss://<HOST>:<PORT>/socket/websocket?apikey=<API_KEY>`. Params: `vsn` (`1.0.0` or `2.0.0`, default `1.0.0`), `log_level` (server logs only).
- **v1.0.0** sends JSON objects (`event`, `topic`, `payload`, `ref`, `join_ref`) in text frames. **v2.0.0** sends arrays `[join_ref, ref, topic, event, payload]` plus binary frames type 3 `USER_BROADCAST_PUSH` and 4 `USER_BROADCAST` (1-byte header sizes, so join ref, ref, topic, user event and metadata are at most 255; payload encoding 0 binary, 1 JSON).
- **Client events:** `phx_join`, `phx_leave`, `heartbeat`, `access_token`, `broadcast`, `presence`. **Server events:** `phx_close`, `phx_error`, `phx_reply`, `system`, `broadcast`, `presence_state`, `presence_diff`, `postgres_changes`.
- **`phx_join` config:** `broadcast { ack, self, replay { since, limit }, replication_ready }`, `presence { enabled, key }`, `postgres_changes [{ event, schema, table, filter, select }]`, `private`, and optional `access_token` (otherwise the API key is used). `replication_ready: true` makes the server send `system` `"Replication connection established"`, or an error and close with `Replication connection was not established in time`.
- **Heartbeat** at least every 25 s on topic `phoenix`: `[null, "26", "phoenix", "heartbeat", {}]`.
- **`access_token`** refreshes the JWT without rejoining; success has no reply, failure sends a `system` error and closes the channel.
- **Errors arrive four ways:** a WebSocket close before join, a `phx_reply` with `status: "error"`, a `system` event, or `phx_error` when the channel process dies.

## Debugging

Work from server to client:

1. **Is Realtime on and the project awake?** After a pause or restart the replication slot may need to reconnect.
2. **Inspector** (Dashboard Realtime > Inspector) uses the project's own keys. Test Postgres Changes as `postgres`, then as a signed-in user; public broadcast and presence as `postgres`; private ones as both. It only observes presence; `track()` must come from your app. Fails as `postgres`: the publication, configuration or the sender/trigger. Works as `postgres` but not as the user: RLS.
3. **Strip the subscription to the minimum** (no filter, `event: '*'`). Still silent: publication or RLS.
4. **Client logger:** `createClient(url, key, { realtime: { logger: (kind, msg, data) => ..., logLevel: 'info' } })`. Logging is off by default; `logLevel` (`info`, `warn`, `error`) sets server-side logging. Kinds: `push`, `receive`, `transport`, `error`, `worker`. Look for `push: ... phx_join` followed by `receive: ok ... phx_reply`.
5. **Browser DevTools:** Network, the `wss://<project-ref>.supabase.co/realtime/v1/websocket` request, Messages tab: check `phx_join` and `phx_reply`, and leave it open 1 to 2 minutes to see heartbeats.
6. **Logs:** the Dashboard's Realtime logs; for database broadcasts, `WarnSendingBroadcastMessage` in Postgres logs, `raise notice` inside the trigger, and `is_private` against `config.private`.
7. **Your callbacks:** a thrown error or rejected promise inside one swallows events. Use recent `@supabase/supabase-js` and `@supabase/realtime-js`.

- **Reports** (Project Settings > Product Reports > Realtime): connected clients, broadcast, presence and Postgres Changes events, channel join rate, payload size, requests, errors and response speed on all plans; Broadcast from Database replication lag and private channel RLS execution time (read and write) on Pro and above.
- **Egress** is everything the server sends to clients over the WebSocket plus HTTP Broadcast requests, heartbeats and control frames included, not database-to-Realtime replication; there's no per-source breakdown. Estimate it as events per day × average delivered payload × average concurrent subscribers.
- **`Stop tenant ... because of no connected users`** followed by slot recreation is normal idling.

## Changes by date

- **2026-10-12:** four CBC-mode TLS 1.2 ciphers are removed from project HTTP APIs, Realtime included, no earlier than 2026-11-10; TLS 1.3 is unchanged.
- **2026-07-14:** `realtime` schema locked down (v2.112.7).
- **2026-06-11:** binary Broadcast payloads.
- **2026-06-30:** supabase-js requires Node 22+.
- **2025-08-12:** Node below 22 needs the `ws` transport.
- **2025-07-11:** Realtime Settings screen (max events per second added Oct 2025, three more settings Nov 2025).
- **2025-04-21:** SQL restrictions on the `auth`, `storage` and `realtime` schemas.
- **2025 Launch Week 14:** Broadcast from Database. **2024-05:** standardized error codes. **2024-04-04:** Broadcast and Presence Authorization (public beta).
