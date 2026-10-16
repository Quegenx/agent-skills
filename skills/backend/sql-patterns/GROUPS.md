# Sets, groups and aggregates

The examples use `customers`, `orders`, `order_lines`, `payments`, `shows` and `purchases`. Literal values stand in for bound parameters (`$1`).

## Joins that multiply

```sql
-- wrong: order 10 has two lines and two payments, so each sum counts four rows
select o.id, sum(l.quantity * l.unit_cents) as line_total, sum(p.amount_cents) as paid
from orders o
join order_lines l on l.order_id = o.id
join payments p on p.order_id = o.id
group by o.id;

-- right: bring each child to the order's grain, then join
select o.id, l.line_total, coalesce(p.paid, 0) as paid
from orders o
join (select order_id, sum(quantity * unit_cents) as line_total from order_lines group by order_id) l on l.order_id = o.id
left join (select order_id, sum(amount_cents) as paid from payments group by order_id) p on p.order_id = o.id
order by o.id;
```

`sum(distinct ...)` is not a fix: two different payments of the same amount collapse into one. When the order header stores a total, compare it with the line sum to find inconsistent rows (`where o.total_cents <> l.line_total`).

## Lines, orders and units

```sql
select c.id,
       count(l.*)                      as lines,
       count(distinct o.id)            as orders,
       coalesce(sum(l.quantity), 0)    as units
from customers c
left join orders o on o.customer_id = c.id
left join order_lines l on l.order_id = o.id
group by c.id
order by c.id;
```

`count(*)` would count the customer with no orders as one line; `count(l.*)` counts only matched rows. Keep every customer with `left join`, and filter the joined table in the `on` clause, not the `where` (a `where o.status = 'open'` after a left join silently turns it into an inner join and drops customers without open orders).

## "Bought all of them" (relational division)

```sql
-- customers who bought every drama
select p.customer_id
from purchases p
join shows s on s.id = p.show_id
where s.genre = 'drama'
group by p.customer_id
having count(distinct p.show_id) = (select count(*) from shows where genre = 'drama');
```

`distinct` matters: a customer who bought the same show twice must not count as owning two. Decide what "all of none" means: with no dramas, the subquery is 0 and no group has a count of 0, so nobody qualifies. The same shape answers "has every required certification" and "the entitlement satisfies every rule" (`having bool_and(rule_passed)`).

## Both, either, never

```sql
-- bought both a drama and a comedy
select p.customer_id
from purchases p join shows s on s.id = p.show_id
where s.genre in ('drama', 'comedy')
group by p.customer_id
having count(distinct s.genre) = 2;

-- in either segment, listed once: union removes duplicates, union all keeps them
select customer_id from orders where status = 'open'
union
select customer_id from purchases;

-- customers with orders in January but never in March
select distinct o.customer_id
from orders o
where o.created_at >= '2026-01-01' and o.created_at < '2026-02-01'
  and not exists (select 1 from orders m
                  where m.customer_id = o.customer_id
                    and m.created_at >= '2026-03-01' and m.created_at < '2026-04-01');
```

"Unsold here" is not "unsold everywhere": `not exists` scoped to one market answers the first; the second needs the check against all markets. `except` works for single-column sets but compares whole rows and removes duplicates.

## Subsets and identical baskets

Compare sets as sorted, distinct arrays:

```sql
with baskets as (
  select order_id, array_agg(distinct product_id order by product_id) as items
  from order_lines group by order_id
)
select a.order_id as smaller, b.order_id as larger
from baskets a join baskets b on a.order_id <> b.order_id
where a.items <@ b.items and a.items <> b.items          -- proper subset
order by 1, 2;
```

Two orders with the same products in different lines or quantities have equal `items`; join on `a.items = b.items and a.order_id < b.order_id` to list each pair once.

## Subtotals and grand totals in one pass

```sql
select coalesce(c.country, 'all countries') as country,
       case when grouping(c.id) = 1 then 'subtotal' else c.name end as customer,
       sum(o.total_cents) as revenue
from orders o join customers c on c.id = o.customer_id
group by rollup (c.country, (c.id, c.name))
order by grouping(c.country), c.country, grouping(c.id), c.name;
```

`grouping()` tells a subtotal row from a real NULL in the data; never detect subtotals by checking for NULL. `cube` produces every combination; `grouping sets ((a), (b), ())` lists exactly the ones you want.

## Cross-tabs

```sql
select c.country,
       count(*) filter (where o.status = 'open')   as open,
       count(*) filter (where o.status = 'closed') as closed,
       sum(o.total_cents) filter (where o.status = 'closed') as closed_revenue
from customers c join orders o on o.customer_id = c.id
group by c.country
order by c.country;
```

`filter (where ...)` keeps one pass over the data. A filtered `count` gives 0 when nothing matches, but a filtered `sum` or `avg` gives NULL: wrap those in `coalesce(..., 0)` when the report should show zero.

## Medians, trimmed means and honest averages

```sql
select c.country,
       percentile_cont(0.5) within group (order by o.total_cents) as median_interpolated,
       percentile_disc(0.5) within group (order by o.total_cents) as median_actual_value,
       avg(o.total_cents) as mean
from orders o join customers c on c.id = o.customer_id
group by c.country
order by c.country;

-- mean without the single highest and lowest value, only when there are at least three
select (sum(total_cents) - min(total_cents) - max(total_cents))::numeric / (count(*) - 2) as trimmed_mean
from orders
having count(*) >= 3;
```

**Share of a total, comparisons with the rest, concentration and correlation:**

```sql
select c.country, sum(o.total_cents) as revenue,
       round(100.0 * sum(o.total_cents) / sum(sum(o.total_cents)) over (), 1) as pct_of_all          -- slice of the pie
from orders o join customers c on c.id = o.customer_id
group by c.country order by c.country;

-- each order against the average of every other order (the window excludes the row itself)
select id, total_cents,
       avg(total_cents) over (order by id rows between unbounded preceding and unbounded following exclude current row) as avg_of_others
from orders order by id;

-- concentration per market: the sum of squared customer shares (1 = one customer has everything)
select country, round(sum(share * share), 3) as concentration
from (select c.country, sum(o.total_cents)::numeric / sum(sum(o.total_cents)) over (partition by c.country) as share
      from orders o join customers c on c.id = o.customer_id group by c.country, c.id) s
group by country order by country;

select corr(extract(epoch from created_at), total_cents) as correlation from orders;   -- -1 to 1; NULL when one side never varies
```

Correlation says whether two measures move together, not that one drives the other ("is spend still moving conversion" needs a comparison over time or an experiment).

Per-group comparisons use a window, not a second query: `total_cents > avg(total_cents) over (partition by country)` finds orders above their country's average (wrap it in a subquery to filter on it). Window functions run after `where` and `group by`, so a `where` on a window result in the same query is an error: number the rows in a subquery or CTE (`row_number() over (partition by customer_id order by created_at desc, id) as rn`) and filter `where rn = 1` outside it, the usual latest-row-per-group. `avg` of an empty set is NULL, and `avg` over integers returns `numeric`, but `sum(int) / count(*)` is integer division.

## Ties

```sql
select id, total_cents,
       row_number() over (order by total_cents desc, id) as position,   -- unique, arbitrary among ties unless a tie-breaker is given
       rank()       over (order by total_cents desc)     as rank,       -- 1, 1, 1, 4: gaps after ties
       dense_rank() over (order by total_cents desc)     as dense_rank  -- 1, 1, 1, 2: no gaps
from orders
order by total_cents desc, id;

-- "the top two" including everyone tied with second place
select id, total_cents from orders
order by total_cents desc
fetch first 2 rows with ties;
```

A podium with ties is `dense_rank() <= 3`; "the latest order per customer, including all orders at that exact instant" is `rank() ... = 1`, not `distinct on`. Without window functions, the top earner per group is a correlated `max`: `where total_cents = (select max(total_cents) from orders i where i.customer_id = o.customer_id)`, which also keeps ties.

## One row per key

```sql
-- one contact per email, case-insensitive, keeping the most recently updated
select distinct on (lower(email)) id, email, updated_at
from customers
where email is not null
order by lower(email), updated_at desc, id;
```

To delete the rest, delete where `id` isn't among those kept, in one statement, and add a unique index on `lower(email)` so the duplicates can't come back. `select distinct` with an `order by` on a column not in the select list is an error, and wrapping a sorted subquery in `distinct` can lose the order: put the ordering in the outermost query, or use `distinct on` / `group by`.

## Skylines and similarity

```sql
-- customers nobody beats on both order count and revenue
with stats as (
  select customer_id, count(*) as orders, sum(total_cents) as revenue from orders group by customer_id
)
select s.* from stats s
where not exists (
  select 1 from stats t
  where t.orders >= s.orders and t.revenue >= s.revenue
    and (t.orders > s.orders or t.revenue > s.revenue)
)
order by s.customer_id;
```

For "similar buyers", compare overlap, not volume: the Jaccard similarity of two customers' product sets is shared products divided by products either bought, so a heavy buyer isn't similar to everyone. For "bought together", support (how often the pair appears) isn't lift: lift divides the pair's frequency by what independence predicts (`P(A and B) / (P(A) * P(B))`); a pair of best-sellers has high support and a lift near 1.
