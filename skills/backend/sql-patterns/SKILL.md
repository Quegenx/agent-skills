---
name: sql-patterns
description: "Writes SQL that returns the correct answer: joins that multiply totals, NULLs, ties, time zones, streaks, ranges, hierarchies, JSON. Use when writing a report, analytics or reconciliation query, or when a total or count looks wrong."
---

# SQL patterns

Most wrong query results come from a few mistakes: a row that means something other than you think, a NULL that makes a comparison unknown, a tie that the question didn't mention, a time boundary in the wrong zone. Speed is the `performance-and-caching` skill's QUERIES.md, and schema, migrations and operations are the `postgres` skill; this skill is about correctness. Pick the file:

| The question | Read |
|---|---|
| Joins that multiply, division ("bought all"), both/either/never, subsets, rollups, cross-tabs, medians, ratios, ties, deduplication, skylines | [GROUPS.md](GROUPS.md) |
| Previous and next rows, running totals, streaks, sessions, funnels, attribution, cohorts, time zones, months, buckets, business hours, ranges, availability, bitemporal data | [TIME.md](TIME.md) |
| Hierarchies and graphs, JSON in and out, ordered lists, networks, nearest neighbors, bitmasks, allocating money, brackets, reconciliation, LIKE escaping; routes to partition/CTE plan guidance | [SHAPES.md](SHAPES.md) |

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

## The rules

1. **Name the grain before writing the query:** what does one output row mean (one customer, one customer-month, one order line)? Joining a parent to two child tables multiplies every child row by the other's: an order with three lines and two payments produces six rows and doubles or triples both sums. Aggregate each child to the parent's grain first, then join.
2. **Count the thing the question names.** `count(*)` after joining lines counts lines; orders are `count(distinct order_id)`; units are `sum(quantity)`. "Loyal customers with three orders" means three orders, not three lines.
3. **NULL means unknown.** `x = null` is never true (`is null`); `not in (subquery)` returns nothing if the subquery yields one NULL (use `not exists`); `count(col)`, `avg` and `sum` skip NULLs; `sum` over no rows is NULL (`coalesce(sum(x), 0)`); a NULL in a `case` falls to `else`. In JSON, a missing key, a JSON `null` and an empty string are three different answers.
4. **Ratios: sum, then divide.** The conversion rate over a month is `sum(conversions) / sum(visits)`, not the average of daily rates (a day with 2 visits weighs as much as one with 20,000). Guard the denominator with `nullif(x, 0)`. Integer division truncates (`7 / 2 = 3`): cast one side to `numeric`. Products of integers overflow `int4` past about 2.1 billion: `quantity::bigint * unit_cents`.
5. **Ties are part of the question.** "Top three" with a tie at third: three rows (`row_number`), every tied row (`rank() <= 3` or `fetch first 3 rows with ties`), or three distinct values (`dense_rank`). Ask, then pin it with a test. Every `order by` that feeds a `limit` or a cursor needs a unique tie-breaker. `desc` puts NULLs first in Postgres: `order by rating desc nulls last`.
6. **Every bucket exists.** A report by day, month or category must show zero rows: generate the buckets (`generate_series`, the category table) and `left join` the facts onto them.
7. **Intervals are half-open:** `[start, end)`. Two bookings 9:00 to 10:00 and 10:00 to 11:00 touch but don't overlap; a month is `>= first day and < next first day`.
8. **Time zones are data.** Store `timestamptz`; compute local day and month boundaries in the user's zone and compare the stored column to those instants. A local day can be 23 or 25 hours.
9. **Money is integer cents,** and any split must add back up to the original total exactly.
10. **One statement, set-based.** A loop that queries per row (or two round trips where one would do) is slower and sees inconsistent snapshots; express the whole question in one statement, and let constraints (unique, exclusion, check) enforce invariants instead of a check-then-insert in code.

## Prove it

Test each query against a small fixture built to break it: a tie at the cutoff, a NULL in each nullable column, an empty group, a parent with two children on each side of a join, a value exactly at each boundary instant, a DST change day, duplicates on both sides of a match. State the expected rows by hand before running it.
