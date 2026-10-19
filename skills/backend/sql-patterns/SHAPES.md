# Hierarchies, JSON, networks, money and query structure

## Hierarchies and graphs

```sql
-- everyone under the CTO, with depth and the chain of command
with recursive reports as (
  select id, name, manager_id, 0 as depth, array[id] as path
  from employees where id = 1
  union all
  select e.id, e.name, e.manager_id, r.depth + 1, r.path || e.id
  from employees e join reports r on e.manager_id = r.id
)
select id, name, depth, path from reports order by path;
```

Order by `path` to print the tree depth-first. Index `manager_id`; every recursion step is a join on it.

**Graphs can loop.** Following money from account to account, a cycle makes a naive recursive query run forever. Postgres 14+ marks and stops cycles for you:

```sql
with recursive flow(account, path) as (
  select 'a'::text, array['a']                                          -- the start is a row too, so returning to it is detected
  union all
  select t.to_account, f.path || t.to_account
  from transfers t join flow f on t.from_account = f.account
) cycle account set is_cycle using visited
select path, is_cycle from flow order by array_length(path, 1), path;
```

On older versions, carry the visited path and add `where not t.to_account = any(f.path)`. Bound the depth too (`where depth < 20`) when the data isn't trusted.

**Quantities multiply down the tree** (a bill of materials):

```sql
with recursive bom as (
  select child as part, quantity::bigint as total from components where parent = 'bike'
  union all
  select c.child, b.total * c.quantity from components c join bom b on c.parent = b.part
)
select part, sum(total) as needed from bom group by part order by part;
```

A part used in several places (a bolt in the frame and in each wheel) appears once per path; the final `sum` adds them. For pairs that link both ways ("cities connected both ways"), self-join the edge table on reversed endpoints and keep `a.from < a.to` to list each pair once.

**State that depends on the previous result** (a balance that can't go below zero, capacity that spills into the next period) can't be a window function, because each step uses the clamped value of the step before. Walk the rows with a recursive CTE:

```sql
with recursive moves as (
  select row_number() over (order by day) as n, amount
  from (values (date '2026-01-01', 50), (date '2026-01-02', -80), (date '2026-01-03', 40)) v(day, amount)
), balance as (
  select n, amount, greatest(amount, 0) as balance from moves where n = 1
  union all
  select m.n, m.amount, greatest(b.balance + m.amount, 0)
  from moves m join balance b on m.n = b.n + 1
)
select n, amount, balance from balance order by n;
```

## JSON out: the whole response in one query

```sql
select json_build_object(
  'id', c.id,
  'name', c.name,
  'orders', coalesce(
    (select json_agg(json_build_object('id', o.id, 'total_cents', o.total_cents) order by o.created_at)
     from orders o where o.customer_id = c.id),
    '[]'::json)                                                         -- json_agg over no rows is NULL, not []
) as body
from customers c
where c.id in (1, 5)
order by c.id;
```

One query returns one parent with its children nested, instead of a query per child collection or a join that repeats the parent on every row. Supabase's PostgREST builds the same shape from `select('id, name, orders(id, total_cents)')`; a Postgres function returning `json` covers what that syntax can't.

## JSON in: rows from a document

```sql
-- a manifest posted as JSON becomes typed rows, ready to insert or join
select * from jsonb_to_recordset('[{"sku":"A","qty":2},{"sku":"B","qty":1,"note":"gift"}]'::jsonb)
  as item(sku text, qty int, note text);

-- a missing key, a JSON null and an empty string are three different states
select id,
       case when not doc ? 'k'              then 'absent'
            when doc -> 'k' = 'null'::jsonb then 'json null'
            when doc ->> 'k' = ''           then 'empty string'
            else 'value' end as k_state
from docs order by id;
```

```sql
select payload ->> 'type'           as type,       -- text
       payload -> 'user' ->> 'plan' as plan,       -- navigate with ->, read the last step with ->>
       payload #>> '{user,id}'      as user_id     -- the same by path
from events
where payload @> '{"user": {"plan": "pro"}}';      -- containment matches a nested shape
```

`->` returns `jsonb`, `->>` returns `text`: chain `->` while navigating and end with `->>` for the value. `doc ->> 'k'` returns SQL NULL for both an absent key and a JSON null; test with `?` when the difference matters (a PATCH that means "clear this field" versus "leave it alone"). For searching inside documents, containment (`doc @> '{"status":"failed"}'`) can use a GIN index (`using gin (doc jsonb_path_ops)`); a function on `doc ->> 'status'` needs an expression index.

## Ordered lists

```sql
select t.position, t.track
from unnest(array['intro', 'song', 'outro']) with ordinality as t(track, position);
```

When order matters (a playlist, steps of a recipe), the position is data: store it in a column with a unique constraint per list, never rely on insertion order or the physical row order. Reordering renumbers the affected rows in one statement (or uses gapped or fractional positions so a move touches one row).

## Networks, distance and permissions

```sql
-- the most specific firewall rule wins: the containing network with the longest prefix
select ip, r.id, r.network, r.action
from (values (inet '10.1.2.3'), (inet '10.1.9.9'), (inet '192.168.0.1')) v(ip)
cross join lateral (
  select id, network, action from firewall_rules
  where v.ip <<= network
  order by masklen(network) desc
  limit 1
) r;

-- nearest depots without sorting every row: the <-> operator walks a GiST index in distance order
select id, location <-> point(0.9, 0.8) as distance
from depots
order by location <-> point(0.9, 0.8)
limit 2;
```

`inet` and `cidr` store addresses natively (`<<=` is "contained in or equal"); text comparisons of IP addresses are wrong. `point` distance is planar; for distances on the Earth use PostGIS `geography` with the same `<->` ordering.

```sql
-- permission bits: denials override grants, and every required bit must be present
select user_id, ((granted & ~denied) & 5) = 5 as can_read_and_export      -- 5 = bit 0 (read) + bit 2 (export)
from grants order by user_id;

select (1::bigint << 63) as bit_63_is_the_sign_bit;
```

A `bigint` holds 63 usable flag bits; the 64th is the sign. Past that, use `bit varying`, several columns, or a permissions table (the usual choice once permissions are managed by people, the `secure-coding` skill's AUTH.md).

## Money: allocations and brackets

**Every cent must land somewhere.** Splitting 10.00 three ways can't give 3.33 each; distribute the leftover cents by largest remainder (ties broken deterministically):

```sql
with shares(name, weight) as (values ('a', 1), ('b', 1), ('c', 1)),
raw as (
  select name,
         1000.0 * weight / sum(weight) over () as exact,
         floor(1000.0 * weight / sum(weight) over ())::int as floored
  from shares
), ranked as (
  select *, row_number() over (order by exact - floored desc, name) as rn,
         1000 - sum(floored) over () as leftover
  from raw
)
select name, floored + case when rn <= leftover then 1 else 0 end as cents
from ranked order by name;
```

The same rule splits an order discount across lines and a payment across invoices; the parts always sum to the total. An invoice that is "off by four cents" usually rounded each line and then summed, or summed and then rounded, inconsistently with the other system: pick one rule and document it.

**A marginal rate is not a flat rate:** each bracket taxes only the part of the amount inside it.

```sql
with brackets(lower_cents, upper_cents, rate) as (
  values (0, 1000000, 0.10), (1000000, 4000000, 0.20), (4000000, null, 0.30)
)
select sum((least(5000000, coalesce(upper_cents, 5000000)) - lower_cents) * rate) as tax_cents
from brackets
where 5000000 > lower_cents;                                           -- an amount of 50,000.00
```

**Integer arithmetic:** `quantity * unit_cents` overflows `integer` past about 2.1 billion; cast one side to `bigint`. Whole cases needed for an order rounds up with integer math, `(quantity + per_case - 1) / per_case`, not with floats.

```sql
select 50000::bigint * 50000 as no_overflow, (17 + 6 - 1) / 6 as cases_for_17_units_at_6_per_case;
select 50000 * 50000 as overflows;                                     -- ERROR: integer out of range
```

## Reconciling two sources

Match rows that exist on both sides, including repeated identical rows, by numbering duplicates within each key:

```sql
with a as (select ref, amount_cents, row_number() over (partition by ref, amount_cents) as n from ledger_a),
     b as (select ref, amount_cents, row_number() over (partition by ref, amount_cents) as n from ledger_b)
select coalesce(a.ref, b.ref) as ref,
       coalesce(a.amount_cents, b.amount_cents) as amount_cents,
       case when a.ref is null then 'only in b' else 'only in a' end as problem
from a full join b on a.ref = b.ref and a.amount_cents = b.amount_cents and a.n = b.n
where a.ref is null or b.ref is null
order by 1, 3;
```

A plain join on `ref` matches one row to every duplicate on the other side and hides the extra payment. A sync job that reports success should also compare counts and sums per key between source and target; equal row counts can hide a missing row plus a duplicate.

## LIKE with user input

```sql
-- "50%_off" must match literally as a prefix, not as wildcards
select name from (values ('50%_off sale'), ('50 percent off'), ('50x off')) v(name)
where name like replace(replace(replace('50%_off', '\', '\\'), '%', '\%'), '_', '\_') || '%' escape '\';
```

In TypeScript, escape before binding: `const pattern = input.replace(/[\\%_]/g, (c) => "\\" + c) + "%"`, then `where name like $1 escape '\'`. Index/collation requirements for prefix and case-insensitive searches are in [performance-and-caching QUERIES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/QUERIES.md#predicates-the-index-can-use-sargable).

## Partitions and CTEs

See [partition-pruning/CTE plans and Postgres partition lifecycle](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/QUERIES.md#partitions-and-cte-materialization).

## Prove it

Check the changed query against the relevant examples above; for partition pruning or materialization, use the [plan evidence](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/QUERIES.md#prove-it) at its owner.
