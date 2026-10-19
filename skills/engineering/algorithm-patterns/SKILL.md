---
name: algorithm-patterns
description: "Picks the right algorithm by recognizing the problem's shape: hash maps, windows, prefix sums, graphs, dynamic programming. Use when a loop is too slow or a task looks like a classic algorithm problem."
---

# Algorithm patterns

Most slow code is a nested loop that asks the same question again: "is the partner somewhere in the array?", "what is the sum of this range?", "which earlier item is still waiting?". Each pattern below replaces the rescan with a small piece of state that already holds the answer. Find the cue, apply the pattern, then prove it with the invariant.

| The cue in the problem | Pattern | Read |
|---|---|---|
| "Have I seen the value I need?", pairs summing to a target, duplicates, counts by value | Hash map or set, one pass | [PATTERNS.md](PATTERNS.md) |
| Small fixed key universe (26 letters, values 0..2, values bounded by n) | Counting table or direct addressing | [PATTERNS.md](PATTERNS.md) |
| Sorted input, a pair or triple with a target, "move the limiting side" | Converging two pointers | [PATTERNS.md](PATTERNS.md) |
| Filter or compact in order, merge sorted streams | Read and write pointers, one cursor per stream | [PATTERNS.md](PATTERNS.md) |
| Contiguous range of exactly k, or the longest / shortest range under a constraint | Sliding window | [PATTERNS.md](PATTERNS.md) |
| Range sums, "subarray summing to k", divisibility, balance of two kinds, negative values | Prefix sums plus a map of earlier prefix states | [PATTERNS.md](PATTERNS.md) |
| Next greater or smaller, span where an item is the minimum, histogram | Monotonic stack | [PATTERNS.md](PATTERNS.md) |
| Shortest range with negatives, sliding maximum | Monotonic deque | [PATTERNS.md](PATTERNS.md) |
| Sorted lookups; "smallest speed / capacity / day that works"; largest feasible value | Binary search, on the array or on the answer | [PATTERNS.md](PATTERNS.md) |
| "Minimum boats", "earliest finish", pick from both extremes | Sort plus a greedy choice with an exchange argument | [PATTERNS.md](PATTERNS.md) |
| Count pairs with an order condition (inversions, range sums in a band) | Merge-time counting | [PATTERNS.md](PATTERNS.md) |
| Sum over all subarrays of something | Contribution counting: how many subarrays contain each item | [PATTERNS.md](PATTERNS.md) |
| Grid regions, islands, spreading, shortest moves | BFS or DFS, multi-source BFS | [GRAPHS-AND-DP.md](GRAPHS-AND-DP.md) |
| Dependencies, "can everything finish", ordering | Topological sort (Kahn) | [GRAPHS-AND-DP.md](GRAPHS-AND-DP.md) |
| Repeated deterministic transformation, values bounded by the index range | Cycle detection (Floyd), functional graph | [GRAPHS-AND-DP.md](GRAPHS-AND-DP.md) |
| Recursion that recomputes the same subproblem; count ways, min cost, can-we-segment | Dynamic programming, often a rolling pair or one row | [GRAPHS-AND-DP.md](GRAPHS-AND-DP.md) |
| Big numbers, allocation budgets, signed bits, division of negatives | The budgets and numeric traps | [BUDGETS.md](BUDGETS.md) |

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

## The rules

1. **Write the honest brute force first** and keep it as the test oracle. Compare the fast version against it on many small random inputs; most pattern bugs (an off-by-one boundary, a missed seed state, a tie counted twice) show up within a few hundred cases.
2. **Name the invariant before coding.** "The stack holds unresolved indices with decreasing temperatures", "`seen` holds every prefix sum before index i". If you can't say what the state means after each step, the loop is a guess.
3. **Find the input that kills the naive version** and test it: the descending array, the all-equal string, the answer at the far end, the 200,000-element case with no match. Speed claims belong to a stated input size.
4. **Use the facts you were given.** Sorted input, a value range bounded by n, only positive numbers, an answer guaranteed to exist: each one enables a pattern, and each pattern's proof depends on it. If the contract loosens (negatives allowed, no majority guaranteed), the pattern may silently become wrong.
5. **Count every resource,** not only time: allocations per token, output built by repeated copying, recursion depth on a long chain, intermediate values that overflow. See [BUDGETS.md](BUDGETS.md).
6. **The simple scan can be right.** A straightforward check at each position, with allocation removed, beats a clever linear matcher when the constraints allow it. Reach for the advanced algorithm only when the worst case demands it.
7. **Don't mutate the caller's input** to make the algorithm easier; sort a copy (`[...nums].sort((a, b) => a - b)`, never the default string sort for numbers) unless in-place is the contract.
   In JavaScript the copying array methods do this in one call: `toSorted()`, `toReversed()`, `toSpliced()` and `with(index, value)` return a new array and leave the original alone, each Baseline since July 2023 and widely available since January 2026 (MDN, https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted). In React, `users.sort(...)` inside `useMemo` mutates the prop array and `users.toSorted(...)` doesn't; `[...items].sort()` is the fallback for older runtimes [Vercel, react-best-practices].

## Prove it

For the changed function: the brute-force oracle, a randomized comparison against it, the edge cases the pattern's proof depends on (empty input, one element, all equal, the boundary value, negatives if allowed), and one large input that the naive version can't finish, with its measured time.
