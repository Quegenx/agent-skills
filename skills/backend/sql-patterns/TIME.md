# Sequences, time and ranges

**Contents:** [The previous and next row](#the-previous-and-next-row) · [Running totals that don't jump](#running-totals-that-dont-jump) · [Streaks (gaps and islands)](#streaks-gaps-and-islands) · [Sessions from a clickstream](#sessions-from-a-clickstream) · [Funnels and attribution](#funnels-and-attribution) · [Cohort retention](#cohort-retention) · [Local time over a UTC column](#local-time-over-a-utc-column) · [Months](#months) · [Buckets](#buckets) · [Business hours](#business-hours) · [Averages over time](#averages-over-time) · [Ranges, availability and overlap](#ranges-availability-and-overlap) · [The busiest instant](#the-busiest-instant) · [What we knew, when (bitemporal)](#what-we-knew-when-bitemporal)

## The previous and next row

```sql
select id, customer_id, created_at,
       lag(created_at) over w                as previous_order_at,
       created_at - lag(created_at) over w   as since_previous
from orders
window w as (partition by customer_id order by created_at, id)
order by customer_id, created_at;
```

A window function computes an aggregate but, unlike `group by`, keeps every row: no self-join, no subquery. `over` has three parts: `partition by` restarts the calculation per group (leave it out to span the whole result), `order by` sets the order rows accumulate in (leave it out and every row gets the whole partition's aggregate), and an optional frame picks which neighbouring rows are visible. The `window` clause names a definition so you write it once. `lag` reads the previous row of the partition, `lead` the next.

"The order immediately before this one" is `lag` with a tie-breaker in the window order; "the last event that isn't this event" excludes the current row by construction. "Back after a real quiet period" is `since_previous > interval '90 days'`.

**Growth against the previous month** needs every month present, or `lag` compares March with January when February had no rows:

```sql
with months as (
  select generate_series(timestamp '2026-01-01', timestamp '2026-04-01', interval '1 month') as month   -- timestamp, not timestamptz
), revenue as (
  select m.month, coalesce(sum(o.total_cents), 0) as revenue
  from months m
  left join orders o on o.created_at >= m.month at time zone 'UTC'
                    and o.created_at <  (m.month + interval '1 month') at time zone 'UTC'
  group by m.month
)
select month::date, revenue,
       round(100.0 * (revenue - lag(revenue) over (order by month))
             / nullif(lag(revenue) over (order by month), 0), 1) as growth_pct
from revenue
order by month;
```

## Running totals that don't jump

```sql
select id, total_cents,
       sum(total_cents) over (order by total_cents) as default_frame,          -- tied rows share one total: it jumps
       sum(total_cents) over (order by total_cents, id
                              rows between unbounded preceding and current row) as running
from orders
order by total_cents, id;
```

With `order by` and no frame, the default frame is `range ... current row`, which includes every peer with the same sort value. Use `rows` and a unique tie-breaker for a row-by-row balance ("balance at every order").

**Trailing windows over calendar days:** `rows between 6 preceding` counts rows, not days, so fill the days first:

```sql
with days as (
  select d::date as day from generate_series(date '2026-01-01', date '2026-01-10', interval '1 day') d
), daily as (
  select d.day, coalesce(sum(o.total_cents), 0) as revenue
  from days d
  left join orders o on o.created_at >= d.day::timestamp at time zone 'UTC'
                    and o.created_at <  (d.day + 1)::timestamp at time zone 'UTC'
  group by d.day
)
select day, revenue,
       sum(revenue) over (order by day rows between 6 preceding and current row) as trailing_7_days
from daily
order by day;
```

On a dense date column, `range between interval '6 days' preceding and current row` expresses the same window by value.

## Streaks (gaps and islands)

Consecutive days minus their position in the sequence give the same value for every day of one streak:

```sql
with days as (select distinct user_id, day from logins),              -- two logins on one day count once
islands as (
  select user_id, day,
         day - (row_number() over (partition by user_id order by day))::int as island
  from days
)
select user_id, min(day) as streak_start, max(day) as streak_end, count(*) as days
from islands
group by user_id, island
order by user_id, streak_start;
```

The longest streak per user is the same query with `distinct on (user_id) ... order by user_id, days desc`. For readings that must hold for two in a row ("two consecutive readings confirm it"), compare with `lag`:

```sql
select sensor_id, at, value
from (select sensor_id, at, value, lag(value) over (partition by sensor_id order by at) as previous from readings) r
where value > 15 and previous > 15;
```

## Sessions from a clickstream

A new session starts when the gap since the previous click exceeds the timeout; a running sum of those starts numbers the sessions:

```sql
with marked as (
  select user_id, at,
         case when at - lag(at) over (partition by user_id order by at) <= interval '30 minutes'
              then 0 else 1 end as starts_session                      -- the first click: lag is NULL, so it starts one
  from clicks
), numbered as (
  select user_id, at,
         sum(starts_session) over (partition by user_id order by at rows unbounded preceding) as session
  from marked
)
select user_id, session, min(at) as started, max(at) as ended, count(*) as clicks
from numbered
group by user_id, session
order by user_id, session;
```

## Funnels and attribution

An ordered funnel counts a step only if it happened after the previous step:

```sql
with signups as (
  select user_id, min(at) as signup_at from events where step = 'signup' group by user_id
), views as (
  select s.*, (select min(e.at) from events e
               where e.user_id = s.user_id and e.step = 'view' and e.at > s.signup_at) as view_at
  from signups s
), buys as (
  select v.*, (select min(e.at) from events e
               where e.user_id = v.user_id and e.step = 'buy' and e.at > v.view_at) as buy_at
  from views v
)
select count(signup_at) as signed_up, count(view_at) as viewed_after_signup, count(buy_at) as bought_after_view
from buys;
```

A user who viewed before signing up doesn't count as having viewed in this funnel. Last-touch attribution takes the most recent touch before the conversion, inside the window, and leaves the conversion unattributed when there is none:

```sql
select c.id as conversion_id, t.channel
from conversions c
left join lateral (
  select channel from touches t
  where t.user_id = c.user_id
    and t.at <= c.at and t.at > c.at - interval '7 days'                -- a touch after the conversion can't cause it
  order by t.at desc
  limit 1
) t on true
order by c.id;
```

## Cohort retention

```sql
with first_orders as (
  select customer_id, date_trunc('month', min(created_at) at time zone 'UTC') as cohort
  from orders group by customer_id
), activity as (
  select distinct o.customer_id, f.cohort,
         ((extract(year from date_trunc('month', o.created_at at time zone 'UTC')) - extract(year from f.cohort)) * 12
          + extract(month from date_trunc('month', o.created_at at time zone 'UTC')) - extract(month from f.cohort))::int as month_number
  from orders o join first_orders f using (customer_id)
)
select cohort::date, month_number, count(*) as active_customers
from activity
group by cohort, month_number
order by cohort, month_number;
```

Divide each cell by the cohort's month-0 count for the retention rate. Respondents who vanish from later months are absent rows, not zeros: fill the grid with `generate_series` if the chart needs every cell.

## Local time over a UTC column

Store `timestamptz`. Turn the user's local boundaries into instants, and compare the bare column with them (sargable, and correct across DST):

```sql
-- orders placed during March 2026 in Lisbon
select id, created_at
from orders
where created_at >= timestamp '2026-03-01 00:00' at time zone 'Europe/Lisbon'
  and created_at <  timestamp '2026-04-01 00:00' at time zone 'Europe/Lisbon';

-- counting by local day (for grouping, converting the column is fine)
select (created_at at time zone 'Europe/Berlin')::date as local_day, count(*)
from orders group by 1 order by 1;

-- a local day is not always 24 hours
select (timestamp '2026-03-30 00:00' at time zone 'Europe/Berlin')
     - (timestamp '2026-03-29 00:00' at time zone 'Europe/Berlin') as spring_forward_day,
       (timestamp '2026-10-26 00:00' at time zone 'Europe/Berlin')
     - (timestamp '2026-10-25 00:00' at time zone 'Europe/Berlin') as fall_back_day;
```

- `timestamptz + interval '1 day'` follows the session's `TimeZone` setting; set it explicitly (`set time zone 'Europe/Berlin'`) or do the arithmetic on local `timestamp` values and convert at the end.
- **A business day that starts at 2:00** (a bar's tab, a night shift) groups by `((created_at at time zone zone) - interval '2 hours')::date`.
- **Daily jobs** run per zone at local midnight, not once at 00:00 UTC for everyone.

## Months

```sql
select n, (date '2026-01-31' + n * interval '1 month')::date as from_anchor
from generate_series(0, 3) n;                                          -- Jan 31, Feb 28, Mar 31, Apr 30

select ((date '2026-01-31' + interval '1 month') + interval '1 month')::date as drifted;   -- Mar 28: the 31st is lost
```

Month addition clamps to the last day of a shorter month. Compute each recurrence from the anchor date (`anchor + n months`), never by adding one month to the previous result.

## Buckets

```sql
-- fixed-width buckets with an explicit origin
select date_bin('17 minutes', at, timestamptz '2026-01-01 00:00+00') as bucket, count(*) as clicks
from clicks group by 1 order by 1;

-- every bucket, including empty ones
with buckets as (
  select generate_series(timestamptz '2026-01-01 10:00+00', timestamptz '2026-01-01 11:00+00', interval '15 minutes') as bucket
)
select b.bucket, count(c.at) as clicks
from buckets b
left join clicks c on c.at >= b.bucket and c.at < b.bucket + interval '15 minutes'
group by b.bucket
order by b.bucket;
```

`count(c.at)`, not `count(*)`: an empty bucket has one row with NULLs from the left join.

## Business hours

Elapsed working time between two instants: intersect the interval with each working day's hours and add up the pieces.

```sql
select t.id, sum(upper(x.w) - lower(x.w)) as business_time
from tickets t
cross join lateral generate_series(date_trunc('day', t.opened_at at time zone 'UTC'),
                                   date_trunc('day', t.closed_at at time zone 'UTC'),
                                   interval '1 day') as d(day)
cross join lateral (
  select tstzrange(t.opened_at, t.closed_at)
       * tstzrange((d.day + time '09:00') at time zone 'UTC', (d.day + time '17:00') at time zone 'UTC') as w
) x
where extract(isodow from d.day) < 6                                   -- Monday to Friday; join a holidays table to skip those too
  and not isempty(x.w)
group by t.id;
```

Use the support team's zone instead of UTC; the `*` operator returns the overlap of two ranges, empty when they don't meet.

## Averages over time

Readings arrive at irregular intervals; the average of the samples overweights bursts. Weight each value by how long it held:

```sql
select sensor_id,
       sum(value * extract(epoch from held)) / sum(extract(epoch from held)) as time_weighted,
       avg(value) as sample_average
from (
  select sensor_id, value,
         coalesce(lead(at) over (partition by sensor_id order by at), timestamptz '2026-01-01 02:00+00') - at as held
  from readings
) r
group by sensor_id;
```

When a reading expires (a sensor value is trusted for 15 minutes), it holds until `least(next_at, at + interval '15 minutes')`, and the time after that counts as unknown, not as the last value.

## Ranges, availability and overlap

Range types store intervals with their bounds (`[)` by default) and come with operators: `&&` overlaps, `@>` contains, `*` intersection, `-` difference, `-|-` adjacent.

```sql
-- the database refuses double bookings: exclude using gist (room_id with =, during with &&), needs btree_gist
insert into bookings(room_id, during) values (1, '[2026-01-01 10:30+00,2026-01-01 11:30+00)');    -- fails: overlaps 10:00 to 11:00

-- bookings overlapping a window; [9,10) and [10,11) touch but don't overlap
select id, room_id, during from bookings
where during && tstzrange('2026-01-01 09:45+00', '2026-01-01 10:15+00')
order by id;

-- when everyone is free: intersect each person's free time
select range_intersect_agg(free) as everyone_free from people_free;

-- free time inside working hours: subtract the busy intervals
select tstzmultirange(tstzrange('2026-01-01 08:00+00', '2026-01-01 12:00+00')) - range_agg(during) as free
from calls;
```

An exclusion constraint is the reliable way to forbid overlaps: a check-then-insert in code races with a concurrent insert. Multiranges (Postgres 14+) make free and busy time set arithmetic instead of hand-written interval merging.

## The busiest instant

Turn intervals into +1 and -1 events and take a running sum. At the same instant, process ends before starts, so touching intervals don't count as concurrent:

```sql
with edges as (
  select lower(during) as at, 1 as delta from calls
  union all
  select upper(during), -1 from calls
), running as (
  select at, sum(delta) over (order by at, delta rows unbounded preceding) as concurrent
  from edges
)
select at, concurrent from running
order by concurrent desc, at
limit 1;
```

## What we knew, when (bitemporal)

Two ranges per row: when the fact is true in the world (`valid`) and when the database believed it (`recorded`). Corrections close the old row's `recorded` range and insert the new version; nothing is updated in place.

```sql
-- the price valid on Feb 15, as we knew it on Feb 5 (before the correction was recorded)
select price_cents from prices
where product_id = 1 and valid @> timestamptz '2026-02-15' and recorded @> timestamptz '2026-02-05';

-- the same price as we know it now
select price_cents from prices
where product_id = 1 and valid @> timestamptz '2026-02-15' and recorded @> now();
```

Invoices, audits and regulatory reports replay with "as recorded at the time"; analytics uses "as known now".
