# Realtime

Realtime sends messages between clients over WebSockets in three forms: Broadcast (low-latency messages, including database changes sent from triggers), Presence (shared, synchronized user state) and Postgres Changes (rows streamed from the database's replication slot). Delivery is best effort: the server does not guarantee every message reaches every client, and a client that disconnects for 30 seconds loses what happened in those 30 seconds. Most outcomes come down to three things: whether the channel is private and RLS on `realtime.messages` allows it, whether the table is in the `supabase_realtime` publication and readable by the subscriber's role, and whether the client cleans up and reconnects properly.

**Contents:** [Pick the feature](#pick-the-feature) · [How it works](#how-it-works) · [Client setup](#client-setup) · [Channels and their lifecycle](#channels-and-their-lifecycle) · [Broadcast](#broadcast) · [Presence](#presence) · [Postgres Changes](#postgres-changes) · [Authorization and private channels](#authorization-and-private-channels) · [Connections, heartbeats and reconnects](REALTIME-OPERATIONS.md#connections-heartbeats-and-reconnects) · [Limits](REALTIME-OPERATIONS.md#limits) · [Settings (Dashboard Realtime > Settings)](REALTIME-OPERATIONS.md#settings-dashboard-realtime--settings) · [Local development and self-hosting](REALTIME-OPERATIONS.md#local-development-and-self-hosting) · [The wire protocol](REALTIME-OPERATIONS.md#the-wire-protocol) · [Debugging](REALTIME-OPERATIONS.md#debugging) · [Changes by date](REALTIME-OPERATIONS.md#changes-by-date) · [Prove it](#prove-it)

## Pick the feature

| Feature | Use for | Status |
|---|---|---|
| Broadcast | Messaging, notifications, custom events, game state, cursors and other high-frequency updates, database change notifications via triggers. Most use cases. | GA |
| Broadcast from Database | Database changes for many connected users: choose the actions (`INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`), the columns sent and route to channels with SQL. Sanitized payloads, lower latency. | Public beta |
| Presence | Online status, active user counters. Use minimally: it has computational overhead. | GA |
| Postgres Changes | Quick testing and development, a low number of connected users. Simpler, but does not scale as well. | GA |
| Broadcast and Presence Authorization | Private channels guarded by RLS. | Public beta |
| Broadcast Replay | Re-reading recent database broadcasts on join. | Public alpha (2026-05-05) |

- **For database changes, Broadcast is the recommended method** for scalability and security. Above roughly 3,000 concurrent subscribers on the same changes, use Broadcast instead of Postgres Changes.
- **Treat a Realtime event as a signal to re-fetch,** not as the only source of truth, whenever a missed update matters. Network blips and reconnects drop events.
- **Never use Postgres Changes to replicate data into another system.** It uses a temporary replication slot, keeps no read position, does not queue and does not resume on reconnect (latency is typically under 100 ms). Replication needs an at-least-once pipeline with a permanent slot.
- **All features are available self-hosted.**

## How it works

- **A cluster of nodes, any node serves any client.** Clients connect to any node and can message clients on any other node; Broadcast takes the shortest path between regions. Presence is an in-memory key-value store backed by a CRDT, replicated to all nodes.
- **Postgres Changes:** when a client subscribes, Realtime connects from the region closest to the database, polls the logical replication slot, tags each WAL record with the matching subscription IDs and delivers it. Every region has at least two nodes so the other reconnects if one goes offline. With no subscribers it stops replicating; a new slot is created when clients subscribe again.
- **Broadcast from Database:** Realtime publishes `realtime.messages`, reads its WAL and sends a message on every insert. The table is partitioned by day and partitions older than 3 days are deleted. It uses Realtime Authorization by default.
- **At most 2 replication slots:** one for Broadcast from Database, one for Postgres Changes.

### Database resources

Connections Realtime opens: Migrations (two temporary connections); Authorization (configurable pool, always started); Broadcast from Database (one connection to the replication slot, always started); Postgres Changes pools (only when you use Postgres Changes): Subscription management, Subscription cleanup, WAL pull.

| Compute | Broadcast from DB | Authorization | Subscription mgmt | Subscription cleanup | WAL pull |
|---|---|---|---|---|---|
| Nano, Micro | 1 | 2 | 2 | 2 | 2 |
| Small, Medium, Large | 1 | 5 | 4 | 4 | 4 |
| XL, 2XL, 4XL | 1 | 10 | 7 | 7 | 7 |
| 8XL, 12XL, 16XL, >16XL | 1 | 15 | 9 | 9 | 9 |

The Authorization pool is the "Database connection pool size" setting.

- **The `realtime` schema:** `schema_migrations`, `subscription` (Postgres Changes subscribers), `messages` (partitioned per day; used by Authorization and Broadcast from Database).

```sql
create table realtime.messages (
topic text not null, -- The topic of the message
extension text not null, -- The extension of the message (presence, broadcast)
payload jsonb null, -- The payload of the message
event text null, -- The event of the message
private boolean null default false, -- If the message is going to use a private channel
updated_at timestamp without time zone not null default now(), -- The timestamp of the message
inserted_at timestamp without time zone not null default now(), -- The timestamp of the message
id uuid not null default gen_random_uuid (), -- The id of the message
constraint messages_pkey primary key (id, inserted_at)) partition by RANGE (inserted_at);
```

- **Functions:** `realtime.send` inserts into `realtime.messages` and catches exceptions (sending the error to the Realtime server via `pg_notify` for logging) so the calling trigger doesn't break; `realtime.send_binary` sends binaries; `realtime.broadcast_changes` uses `realtime.send` with a Postgres-Changes-compatible format.
- **Partitions are created only** the first time a client joins a channel for the project (after migrations run), and by the scheduled janitor roughly every 3 to 4 hours, only for projects connected currently or since its previous run. Each run creates yesterday, today and the next three days. `realtime.send`, `send_binary`, the Broadcast REST endpoint, subscribe and replication operations and the Dashboard's tenant health check do not create partitions.
- **Postgres versions:** below 14 not supported; 14.x works with limitations (needs superuser; on 14.5 and earlier `realtime.broadcast_changes(...)` fails when a trigger calls it with `PERFORM`); 15, 16, 17 supported. On 17.x-orioledb before 17.11.0.004, `REPLICA IDENTITY FULL` UPDATE/DELETE can miss old values of TOASTed columns and Broadcast from Database can lose messages sent from a trigger.

### The schema is locked

- **Since Realtime v2.112.7 (2026-07-14), hosted and self-hosted,** creating, altering or dropping anything in the `realtime` schema fails with `permission denied for schema realtime`: `ALTER TABLE realtime.messages ...`, `DROP FUNCTION realtime.topic()`, `INSERT` or `DELETE` on `realtime.schema_migrations`, new tables. Creating and changing RLS policies on `realtime.messages` is still allowed. (An earlier restriction from 2025-04-21 still allowed triggers on `realtime.messages` and foreign keys referencing these tables, and already blocked revoking API role privileges in `auth`, `storage` and `realtime`.)
- **`postgres` can** create, alter and drop policies on `realtime.messages`, `comment on policy`, `select`, `insert`, and `grant select`/`grant insert` to your own roles. **It cannot** `alter table` in any form, `drop table`, or create tables or functions in the schema. The table is owned by `supabase_realtime_admin`; `grant supabase_realtime_admin to postgres` fails (role memberships are reserved), support can't grant it, and `do` blocks or `security definer` functions don't get around it.
- **Never write `alter table realtime.messages enable row level security`.** RLS is already on; the statement fails with `42501 must be owner of table messages`, aborts the transaction and skips every `create policy` after it. `supabase db push` runs each migration file in one transaction, so nothing is recorded in `supabase_migrations.schema_migrations`. Delete the line. To check RLS without altering: `select relrowsecurity from pg_class where oid = 'realtime.messages'::regclass;`.

## Client setup

- **Install and create the client once:** `npm install @supabase/supabase-js`, then `createClient('https://<project>.supabase.co', '<sb_publishable_key>')`. Use publishable (`sb_publishable_xxx`) and secret (`sb_secret_xxx`) keys; `anon` and `service_role` keys are being deprecated by the end of 2026. Never expose `service_role` on the client.
- **Node.js below 22 needs the `ws` transport** (since realtime-js 2.15.1 / supabase-js 2.55.0, 2025-08-12). Browsers and Node 22+ need nothing. `TIMED_OUT` on connect often means this; upgrade Node or set the transport. supabase-js dropped Node 18 on 2025-10-31 and Node 20 on 2026-06-30, and requires TypeScript 5.0 from 2027-01-31.

```ts
import ws from "ws";
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  // Explicitly set the WebSocket transport here
  realtime: { transport: ws as any },
});
```

- **Realtime client options:** `transport`, `timeout`, `heartbeatIntervalMs`, `heartbeatCallback(status, latency?)`, `vsn`, `logger(kind, msg, data)`, `encode`, `decode`, `reconnectAfterMs(tries)`, `headers`, `params`, `logLevel` (`log_level` is deprecated), `fetch`, `worker`, `workerUrl`, `accessToken: () => Promise<string | null>`, `disconnectOnEmptyChannelsAfterMs`, `sessionStorage`.

| Client default | Value |
|---|---|
| Heartbeat interval | 25000 ms |
| Reconnect backoff | `[1000, 2000, 5000, 10000]` ms, then 10000 |
| Timeout | 10000 ms |
| Protocol `vsn` | `2.0.0` (the server's default when a client sends none is `1.0.0`) |
| Push buffer | 100 messages |
| `disconnectOnEmptyChannelsAfterMs` | 2 × heartbeat interval; `0` disconnects as soon as no channels remain |

- **Heartbeat statuses:** `'sent' | 'ok' | 'error' | 'timeout' | 'disconnected'`. `removeChannel` resolves to `'ok' | 'timed out' | 'error'`.
- **Standalone realtime-js:** `new RealtimeClient(REALTIME_URL, { params: { apikey: API_KEY } })` with `ws://localhost:4000/socket` locally or `wss://<project_ref>.supabase.co/realtime/v1`; the key is a JWT with `exp` and `role` claims.

## Channels and their lifecycle

- **A channel is a topic plus public or private.** Topic is the channel name, event the message type, payload the data. The name can be any string except `'realtime'`; on the wire it is prefixed (`realtime:room1`). A public and a private channel with the same topic are separate channels and share no messages.
- **Public channels let anyone subscribe, send and receive.** With "Allow public access" on, anyone holding the project's public key can subscribe and broadcast on any public channel. Use private channels in production.
- **Name topics `scope:id:entity`:** `room:123:messages`, `game:456:moves`, `user:789:notifications`. Sender and listeners must use exactly the same topic; a mismatch fails quietly. Never use random topic names.
- **Subscribe statuses:** `SUBSCRIBED`, `CHANNEL_ERROR` (the error carries a message), `TIMED_OUT` (the server did not respond in time), `CLOSED`. Always log the second argument: `.subscribe((status, err) => ...)`. A join rejection reads `"<ErrorCode>: <human message>"`, for example `"InvalidJWTExpiration: Token has expired 300 seconds ago"` (`UnknownErrorOnChannel` arrives bare as `"Unknown Error on Channel"`). The server delays its error reply (default 5000 ms for joins, 2000 ms for WebSocket connect errors), so don't retry in a tight loop.
- **`SUBSCRIBED` only means the channel joined,** not that the client can see any data.
- **The client reuses channels with the same topic:** `supabase.channel('chat') === supabase.channel('chat')` is `true`, and the logger shows `transport: leaving duplicate topic "realtime:chat"`.
- **Create the client once at module level and always clean up.** `ChannelRateLimitReached` (TooManyChannels) comes from channels created per render, effects re-running because of their dependencies, unmounting without cleanup, strict mode running effects twice, clients created inside components and random topic names. A changing `roomId` without cleanup gives duplicate events or events for the wrong room. In an effect, return the teardown: `return () => { supabase.removeChannel(channel) }`.

- **Teardown calls differ between pages:** some use `supabase.removeChannel(channel)` ("unsubscribes, removes and tears down"), the TooManyChannels guide uses `channel.unsubscribe()`, and the realtime-js README uses `channel.unsubscribe(); client.removeChannel(channel)`. `removeChannel` alone is documented as doing all three; check the current reference. To close everything: `client.removeAllChannels(); client.disconnect()`.
- **On logout,** `await supabase.removeAllChannels()` before `supabase.auth.signOut()`.
- **Find leaks with `supabase.getChannels()`:** a climbing count or duplicate topics.

## Broadcast

- **Receive** with `.on('broadcast', { event: 'shout' }, cb)`; `event: '*'` receives all events. **Send** with `channel.send({ type: 'broadcast', event, payload })`: before subscribing it goes over HTTP, after subscribing over the WebSocket.
- **`self`:** messages go only to other clients unless `config: { broadcast: { self: true } }`.
- **`ack`:** with `config: { broadcast: { ack: true } }`, `send` resolves after the server receives the message; otherwise it resolves immediately. With `ack: false` (default), every failed push on a private channel, including oversized payloads and RLS write denials, is dropped silently. With `ack: true` an oversized payload gets `{ "status": "error", "response": { "error": "payload_size_exceeded" } }`, and the JS `send()` resolves to the string `'error'` without the reason. RLS denials are silent regardless of `ack`. These errors exist only on private channels.
- **`channel.httpSend(event, payload)`** (supabase-js 2.107.0+) always uses REST, needs no subscription, sends `ArrayBuffer`/`ArrayBufferView` as `application/octet-stream` and everything else as JSON. Still call `supabase.removeChannel(channel)` afterwards.

### Binary payloads

- **Binary works over WebSocket, REST and the database** (2026-06-11). Minimums: supabase-js 2.91.0 (WebSocket), 2.107.0 (`httpSend`), supabase-swift 2.44.0, Realtime server 2.103.2. Clients on older SDKs drop binary payloads silently. The Dart, Kotlin and Python clients don't support them yet.

```js
myChannel.send({ type: 'broadcast', event: 'cursor-pos', payload: new Uint8Array([1, 2, 3]).buffer })
```

### From the database

- **`realtime.send(payload, event, topic, is_private)`** inserts a broadcast; `realtime.send_binary('\x012345'::bytea, 'event', 'topic', true)` sends bytes.

```sql
select
  realtime.send(
    jsonb_build_object('hello', 'world'), -- JSONB Payload
    'event', -- Event name
    'topic', -- Topic
    false    -- Private flag - true: Private (default), false: Public
  );
```

- **The private flag must match the client channel's `private` setting:** a public broadcast reaches only public channels, a private one only private channels. Database broadcasts are private by default. The flag only controls who can subscribe to the topic; Realtime reads the database as the admin role either way.
- **`realtime.broadcast_changes(topic, event, operation, table, schema, new, old)`** sends the full change with metadata on a private channel and needs broadcast authorization policies; `realtime.send` is for custom payloads. A trigger:

```sql
create or replace function public.your_table_changes()
returns trigger
security definer
language plpgsql
as $$
begin
  perform realtime.broadcast_changes(
    'topic:' || coalesce(NEW.id, OLD.id) ::text,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  return null;
end;
$$;

create trigger handle_your_table_changes
after insert or update or delete
on public.your_table
for each row
execute function your_table_changes ();
```

  `coalesce(NEW.id, OLD.id)` also covers `DELETE`, where `NEW` is null. Another docs version of this trigger uses `'topic:' || NEW.id::text` with `security definer set search_path = ''`; the `security definer` rules in SECURITY.md apply either way.
- **Listen on the client** with `await supabase.realtime.setAuth()` first, then `.channel(\`topic:${id}\`, { config: { private: true } }).on('broadcast', { event: 'INSERT' }, ...)`.
- **Messages live in `realtime.messages` and are deleted after 3 days.**
- **Connect a client before broadcasting from the database.** `WarnSendingBroadcastMessage: <reason>` in the Postgres logs means `realtime.send` could not insert; the usual reason is `no partition of relation "messages" found for row`, because no client has connected since partitions lapsed. The replication slot starts only once a client connects and never replays, so those messages would have reached nobody anyway. For scheduled database broadcasts, keep a subscriber connected. If no client can connect at all (for example after rotating the JWT secret or moving to asymmetric keys, when old sessions stop validating), partitions are never created. When partitions exist and clients are connected, the `<reason>` is the real SQL error (a constraint violation, permissions).

### Over REST

```bash
curl -v \
-H 'apikey: <SUPABASE_TOKEN>' \
-H 'Content-Type: application/json' \
--data-raw '{ "test": "test" }' \
'https://<PROJECT_REF>.supabase.co/realtime/v1/api/broadcast/test/events/event'
```

- **One message:** `POST /realtime/v1/api/broadcast/<topic>/events/<event>`, `Content-Type: application/json` or `application/octet-stream`, `?private=true` for private channels. **Batch:** `POST /realtime/v1/api/broadcast` with `{"messages": [{"topic", "event", "payload"}]}`, JSON only.
- **Responses:** `429` when rate limited (with `x-rate-limit` and `x-rate-limit-remaining` headers), `422` for an oversized payload, `403` when Realtime is disabled.
- **The Getting Started page shows a different endpoint,** `/rest/v1/rpc/broadcast` with `{topic, event, payload, private}`, and its snippets are not valid code. The Broadcast guide documents `/realtime/v1/api/broadcast/...`; use that and check the current docs.

### Replay

- **Private channels only, and only Broadcast from Database messages.** `since` (required, epoch ms) and `limit` (optional, max 25). supabase-js 2.74.0+, Dart 2.10.0+. Replayed messages carry `payload.meta.replayed`.

```js
const config = {
  private: true,
  broadcast: { replay: { since: 1697472000000, limit: 10 } }
}
const channel = supabase.channel('main:room', { config })
```

- **Retention:** the Broadcast guide says a message stays available at least 72 hours and at most 4 days (daily partitions, dropped after 72 hours); other pages say 3 days, and the limits table says 72 hours. Check the current docs.

## Presence

- **Each client publishes state under a presence key;** the channel keeps the merged view and sends it to new joiners immediately. Events: `sync`, `join`, `leave`. A `sync` can arrive with `join` and `leave` together when nobody moved: that is reconciliation.

```js
channel
  .on('presence', { event: 'sync' }, () => channel.presenceState())
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {})
  .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {})
```

  `presenceState()` returns `{ "client_key_1": [{ "userId": 1, "typing": false }], ... }`.
- **Call `track(state)` only after `SUBSCRIBED`,** inside the subscribe callback; earlier calls don't register reliably. `track` fires your own `sync` and `join`; `untrack()` fires `sync` and `leave`. The state must be a map, or the push fails with `Presence track payload must be a map` (`InvalidPresencePayload`).
- **Keys** default to a server-generated UUIDv1; set `config: { presence: { key: 'userId-123' } }` with a value unique among clients.
- **`config.presence.enabled`** is set automatically when you add a presence listener and controls only whether this client receives presence. Make sure nothing sets `presence: { enabled: false }`. On private channels receiving also needs the read policy.
- **At most 5 `track()`/`untrack()` calls per client per 30 seconds.** Exceeding it logs `ClientPresenceRateLimitReached`, sends a `system` error and closes the channel, stopping Presence, Broadcast and Postgres Changes on it until reconnect (separate from the project-wide `PresenceRateLimitReached`). Use Presence for slow-changing state and Broadcast for anything high-frequency like mouse movement.

## Postgres Changes

### Turn it on per table

```sql
alter publication supabase_realtime add table your_table_name;
```

- **Creating a table and enabling Realtime on it are separate steps** (SQL above, or Dashboard Database > Publications). Check with `select * from pg_publication_tables where pubname = 'supabase_realtime';`. To start over with an empty publication:

```sql
begin;
drop publication if exists supabase_realtime;
create publication supabase_realtime;
commit;
alter publication supabase_realtime add table messages;
```

- **The subscriber's role needs `select` on the table and RLS must allow the rows.** In schemas other than `public`, grant it yourself (`grant select on "non_private_schema"."some_table" to authenticated;`; there is no dashboard toggle) and enable RLS there, or the role reads everything.

### Subscribe

- **`.on('postgres_changes', { event, schema, table?, filter?, select? }, cb)`** with `event` one of `INSERT`, `UPDATE`, `DELETE`, `*`; `schema` and `table` accept `*`. Add several `.on` calls to one channel for different combinations; registering the same filter twice is ignored with a logged error. Overlapping subscriptions on a channel can deliver the same change to a client more than once.
- **Payload fields:** `schema`, `table`, `commit_timestamp`, `type`, `columns [{name, type}]`, `record`, `old_record`, `errors`, and `ids`, which must match the subscription IDs from the join reply; a mismatch means inconsistent state, so leave and rejoin.
- **`select: ['id', 'username']`** sends only those columns (the primary key always included); they must be readable by the role, and `schema` and `table` must be explicit.
- **Wait for confirmation before writing** (most visible in tests): there is a gap between `SUBSCRIBED` and the replication listener being ready, and writes in it are missed. supabase-js 2.113.0 adds `postgres_changes_options: { wait: true, timeout? }`, which holds `SUBSCRIBED` until the server confirms (timeout default 15000 ms, clamped by the server to 20 s by default, join timeout extended automatically) and reports failure as `CHANNEL_ERROR` with `PostgresChangesSubscribeTimeout: ...` or `RealtimeDisabledForConfiguration: ...`. On older clients, listen for the `system` message (one troubleshooting page calls it not formally documented; the protocol page documents it as `"Subscribed to PostgreSQL"`). A fixed delay (for example 1000 ms) after `SUBSCRIBED` is a weaker fallback.

```js
supabase
  .channel('room1')
  .on('system', '*', (payload) => {
    if (payload.extension === 'postgres_changes' && payload.status === 'ok') {
      console.log('changes are ready', payload) // safe to write now
    }
  })
  .on('postgres_changes', { event: '*', schema: '*' }, (payload) => {
    console.log('Change received!', payload)
  })
  .subscribe()
```

### Filters

- **Format `column=operator.value`, evaluated on the server** (filtered-out events never leave the database). Write `room_id=eq.abc123`, never `room_id = abc123`.

| Operator | Notes |
|---|---|
| `eq`, `neq`, `lt`, `lte`, `gt`, `gte` | Comparisons use Postgres operators, so they work on non-numeric types |
| `in` | Up to 100 values |
| `like`, `ilike` | Text-compatible columns; wildcard is `%`, not `*` |
| `match` (`~`), `imatch` (`~*`) | Text-compatible columns; regex validated at subscribe |
| `is` | `null` on any column; `true`, `false`, `unknown` on booleans |
| `isdistinct` | `IS DISTINCT FROM` |

- **Negate with `not.`** (`status=not.in.(draft,archived)`); **commas combine with AND.** There is no OR, no `or()` and no resource embedding (`!inner`).
- **Build filters with `postgresChangesFilter()`** (from `@supabase/supabase-js` or `@supabase/realtime-js`; `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`, `like`, `ilike`, `match`, `imatch`, `is`, `isDistinct`, `not(column, operator, value)`; `.build()` returns the string). Dart has `PostgresChangeFilter`, Swift `RealtimePostgresFilter`.
- **Reserved characters in values are disputed:** the guide and protocol pages say to double-quote values containing `,`, `(`, `)`, `"` or `\` (`name=eq."Doe, Jane"`) and that the builders quote for you; the realtime-js README says values are sent verbatim, a literal comma in a scalar can't be expressed (commas inside `in.(...)` are fine) and the builder throws. Check the current docs before relying on either.

### Old records, DELETE and RLS

- **Only the new row is sent by default;** for old values on `UPDATE` and `DELETE`, `alter table messages replica identity full;`. With RLS enabled, `old` still contains only the primary key, and there's no way around it while RLS is on. So `payload.old.status !== payload.new.status` is true on every update, because `old.status` is `undefined`.
- **RLS is not applied to `DELETE` events,** and deletes can be filtered only with `replica identity full`.
- **An update must pass RLS for both its old and new state:** a policy allowing only `status = 'active'` can fail to deliver the update that flips a row to `archived`.
- **Missing events after `SUBSCRIBED` are most often RLS.** Select the changed row with the client's own credentials to test.
- **A custom JWT** goes in with `supabase.realtime.setAuth('your-custom-jwt')` after creating the client and before joining a channel.

### Throughput

- **Every change is authorized once per subscriber** (one change, 100 subscribers, 100 checks) on a single thread to keep order, so bigger compute barely raises throughput. Use filters, column selection and cheap, indexed policies. When the database can't keep up, changes are delayed until they time out. At scale, use a separate table without RLS and filters, or consume changes server-side and re-stream them through Broadcast.
- **Payload limit 1,024 KB;** past it, `new` and `old` keep only fields whose values are 64 bytes or smaller.

| Compute | RLS | Clients | DB changes/s | Msgs/client/s | Total msgs/s | p95 |
|---|---|---|---|---|---|---|
| Micro | No | 500 / 5,000 / 10,000 / 30,000 | 64 / 10 / 5 / 1 | same | 32,000 / 50,000 / 50,000 / 30,000 | 238 / 807 / 1310 / 941 ms |
| Micro | Yes | 500 / 1,500 / 3,000 | 30 / 10 / 5 | 6 / 2 / 1 | 3,000 | 228 / 356 / 616 ms |
| Small to Medium | No | 500 / 5,000 / 10,000 / 35,000 | 64 / 10 / 5 / 1 | same | 32,000 / 50,000 / 50,000 / 35,000 | 184 / 782 / 1349 / 1287 ms |
| Small to Medium | Yes | 500 / 1,500 / 3,000 | 30 / 10 / 5 | 6 / 2 / 1 | 3,000 | 282 / 387 / 920 ms |
| Large to 16XL | No | 500 / 5,000 / 10,000 / 35,000 / 100,000 / 200,000 | 64 / 10 / 5 / 1 / 0.1 / 0.05 | same | 32,000 / 50,000 / 50,000 / 35,000 / 40,000 / 40,000 | 184 / 672 / 1253 / 1257 / 4951 / 4581 ms |
| Large to 16XL | Yes | 500 / 2,000 / 4,000 | 40 / 10 / 5 | 8 / 2 / 1 | 4,000 | 618 / 606 / 918 ms |

For comparison, measured Broadcast: 32,000 users at 224,000 msgs/s (median 6 ms, p95 28 ms, p99 213 ms); 250,000 users above 800,000 msgs/s (median 58 ms); Broadcast from Database 80,000 users at 10,000 inserts/s (median 46 ms, p95 132 ms); payloads of 1, 10 and 50 KB at 4,000 users, median 13, 16 and 27 ms; Realtime Authorization 50,000 users at 500 connections/s and 1,000 joins/s, median 19 ms.

## Authorization and private channels

- **Two steps:** RLS policies on `realtime.messages`, and channels created with `config: { private: true }`. To force every channel private, turn off "Allow public access" in Realtime Settings; then clients without `private: true` are rejected with `PrivateOnly`, and with no policies clients connect but receive nothing.
- **Policies decide who can broadcast (`insert`, extension `broadcast`), receive broadcasts (`select`), publish presence (`insert`, extension `presence`) and receive presence (`select`).** `realtime.topic()` is the topic being joined, `realtime.messages.extension` is `'broadcast'` or `'presence'`, and JWT claims come from `current_setting('request.jwt.claims')::json`. Joining a Broadcast channel needs at least one read or write permission on the topic.

```sql
create policy "authenticated can receive broadcast"
on "realtime"."messages"
for select
to authenticated
using (
exists (
    select
      user_id
    from
      rooms_users
    where
      user_id = (select auth.uid())
      and room_topic = (select realtime.topic())
      and realtime.messages.extension in ('broadcast')
  )
);
```

  Sending is the same with `for insert ... with check (...)`; presence uses `extension in ('presence')`, both `('broadcast', 'presence')`. The getting-started policies `using (true)` / `with check (true)` admit every signed-in user to every topic (SECURITY.md: authentication is not authorization).
- **Missing `select` policy:** sends succeed and nothing comes back. **Presence on a private channel needs both** `select` (receive) and `insert` (`track()`); missing either drops presence silently while subscribe succeeds.
- **Permissions are computed at join** from the policies, the JWT, request headers and the topic: Realtime inserts a message, tries to read it and rolls back. Read is checked once per subscription; write on the first message, then cached. The cache refreshes only on subscribe and when a new JWT arrives. **Revoking access (deleting a membership row) does not cut off a connected user** until their JWT expires or a new one is sent, so keep JWT expiry short.
- **Policy cost hits join time.** Each private join, each token refresh and each private Broadcast REST request runs an authorization query on the Authorization pool. Complex policies raise connection latency, lower join rates, and a slow one makes the join time out instead of failing.

### Tokens

- **`supabase.realtime.setAuth(token?)`** sets the JWT used for channel authorization. Called with nothing, it uses the `accessToken` callback or the client's session token; the docs call `await supabase.realtime.setAuth()` before subscribing to private database-broadcast channels. An explicit token without an `accessToken` callback survives `removeChannel` and resubscribe. With an `accessToken` callback, the callback stays the source of truth and runs on connect and every heartbeat (25 s): return a token valid past the next call (if it has 27 s left, refresh now), or the server closes the channel at expiry and does not resubscribe.
- **JWTs need `role` and `exp` claims and must not be expired;** inspect one with `atob(token.split('.')[1])`. Third-party auth needs a reachable JWKS endpoint. Tokens with the `sb_*` prefix are silently ignored as access tokens. The server coalesces token refreshes faster than every 10000 ms.
- **After rotating the JWT secret or moving to asymmetric signing keys,** old sessions stop validating: users must sign out and sign in again.

**Moved:** connections, heartbeats and reconnects, limits, settings, local development and self-hosting, the wire protocol, debugging and the dated changes is now in [REALTIME-OPERATIONS.md](REALTIME-OPERATIONS.md).

## Prove it

- **Publication:** `select * from pg_publication_tables where pubname = 'supabase_realtime';` lists every table you subscribe to.
- **Partitions exist:** this returns rows (none means no client has ever connected; `42P01 relation "realtime.messages" does not exist` means migrations are missing and needs a support ticket):

```sql
select c.relname
from pg_inherits i
  join pg_class c on c.oid = i.inhrelid
where i.inhparent = 'realtime.messages'::regclass
order by c.relname;
```

- **RLS on `realtime.messages`** reads `true` from `select relrowsecurity from pg_class where oid = 'realtime.messages'::regclass;`, and no migration contains `alter table realtime.messages`.
- **Private channels, two users:** with public access off, a user who belongs to the topic subscribes and receives; a user who doesn't is rejected or receives nothing; a client without `private: true` gets `PrivateOnly`. Run it as each signed-in user, not as `postgres`.
- **Postgres Changes as the real role:** in Inspector, a change arrives as `postgres` and as the signed-in user; the row is readable with the user's own credentials; an update that moves a row out of the policy is checked explicitly.
- **Round trip:** with `config: { broadcast: { self: true, ack: true } }` and the logger on, `send` resolves with the server's response (not `'error'`) and your own listener fires.
- **Tests subscribe, wait, then write:** `postgres_changes_options.wait` or the `system` ok message before the first insert, never back to back.
- **No leaks:** `supabase.getChannels().length` stays flat across navigation, room switches and remounts, and drops to zero after `removeAllChannels()` on logout.
- **Survives a background tab:** with `worker: true` and a `heartbeatCallback`, a tab left in the background for minutes still receives on return; DevTools shows heartbeats every 25 s.
- **Database broadcasts:** with a client connected, the trigger fires and Postgres logs show no `WarnSendingBroadcastMessage`.
