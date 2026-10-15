# Graphs, grids and dynamic programming

## Grids are graphs

Each cell is a node; edges go to the 4 (or 8) neighbors the problem allows. Decide the topology and whether distance counts cells or moves before writing the loop.

- **Count components (islands):** scan every cell; an unvisited land cell starts a new component, and one traversal marks all of it. Mark a cell **when it is enqueued**, not when it is dequeued, or neighbors enqueue it several times. Repeated label-propagation sweeps cost a pass per unit of diameter and die on a long winding island.
- **Flood fill:** capture the original color first; if the new color equals it, return unchanged, or recoloring marks no progress and the fill revisits cells forever. Recoloring doubles as the visited mark. Fill a copy if the caller's grid must not change.
- **Perimeter:** `4 * land - 2 * sharedEdges`, checking only the neighbor above and to the left so each shared edge counts once. Inner lakes add perimeter too.
- **Shortest path, all moves cost the same:** BFS from the start; the first time the target is reached is the shortest route. Reject a blocked start or target up front; a one-cell open grid has length 1 when distance counts cells.
- **Simultaneous spreading (rotting, fire, infection):** multi-source BFS with every source enqueued at time 0. Track the remaining count to tell "done", "nothing to do" (0) and "unreachable" (-1) apart.
- **Recursion depth:** a 200x200 serpentine region is 40,000 frames deep. Use an explicit queue or stack in JavaScript, whose call stack is far smaller than that.

```ts
function bfsSteps(grid: number[][], sr: number, sc: number, tr: number, tc: number): number {
  const rows = grid.length, cols = grid[0].length;
  const dist = new Int32Array(rows * cols).fill(-1);
  const queue = new Int32Array(rows * cols);          // an index-based queue: no shift(), no reallocation
  let head = 0, tail = 0;
  dist[sr * cols + sc] = 0; queue[tail++] = sr * cols + sc;
  while (head < tail) {
    const cell = queue[head++], r = Math.floor(cell / cols), c = cell % cols;
    if (r === tr && c === tc) return dist[cell];
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc, next = nr * cols + nc;
      if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || grid[nr][nc] === 1 || dist[next] !== -1) continue;
      dist[next] = dist[cell] + 1;                    // marked at discovery
      queue[tail++] = next;
    }
  }
  return -1;
}
```

## Dependencies: topological sort

Prerequisites form a directed graph; everything can finish exactly when it has no cycle. Kahn's algorithm: build the adjacency list once, queue every node with indegree 0, pop, decrement successors, queue those that reach 0. If fewer than all nodes were processed, the rest sit on or behind a cycle. Rescanning the whole edge list at every step instead is O(V·E·depth). Test a self-loop and a cycle in a disconnected component, not only one chain from node 0.

## Cycles in deterministic sequences

**A repeated deterministic transformation is a linked list in disguise.** Each value has exactly one next value, so the sequence either reaches a terminal state or enters a cycle. Detect the repeat instead of capping iterations at an arbitrary number, which proves nothing.

- **Floyd's tortoise and hare:** `slow` moves one step, `fast` two; they meet inside a cycle. To find the cycle's entry, restart one pointer at the beginning and move both one step until they meet. Constant space.
- **Duplicate in n + 1 values from 1..n, without modifying or allocating:** index i points to `nums[i]`; no pointer targets index 0, so walking from 0 enters a cycle whose entry is the duplicate. (Allocation-free fallback: binary search the value range, counting entries at most `mid`.)
- **Happy number:** digit-square sums either reach 1 or cycle; Floyd or a small set.
- **Longest cycle when each node has at most one outgoing edge:** states unseen / active in this walk / done, plus the step at which each active node was discovered. Reaching an active node closes a cycle of length `step - discoveredAt[node]`; reaching a done node only joins finished work. Retire the walk's nodes to done afterward, so every node is processed a constant number of times. Iterate, don't recurse.

## Dynamic programming

**Cue:** the recursion is correct but recomputes the same subproblem (Fibonacci-shaped call trees, include-or-exclude branching, "try every split"). Define the state as the smallest description of "where I am", write the recurrence by the last decision, fill the states in an order where dependencies are already known, then keep only the states the recurrence reads.

| Problem | State and recurrence | Space after rolling |
|---|---|---|
| Ways to climb 1 or 2 steps | `ways(i) = ways(i-1) + ways(i-2)` | two variables |
| Min cost stairs (start at 0 or 1) | cost to **reach** position i, the top is one past the last step: `min(reach(i-1) + cost[i-1], reach(i-2) + cost[i-2])` | two variables |
| No two adjacent (house robber) | `best(i) = max(best(i-1), best(i-2) + a[i])` | two variables |
| Same on a circle | max of the line without the first and the line without the last; one item handled alone | two variables |
| Decode digits to letters | `ways(i) = ways(i+1) if s[i] != '0'` plus `ways(i+2) if 10..26`; empty suffix is 1 way | two variables |
| Fewest coins | `best[a] = min(best[a - c] + 1)`, unreachable as Infinity, never add 1 to it; greedy fails for `[1, 3, 4]`, 6 | one array of amount |
| Coin combinations (order ignored) | `ways[0] = 1`; **coins outer, amounts inner**, `ways[a] += ways[a - c]`; swapping the loops counts orderings instead | one array |
| Equal-sum partition | subset sum to `total / 2` (odd total fails); `reach[s] ||= reach[s - v]` iterating s **downward** so each item is used once | one boolean array |
| Edit distance | `d[i][j]` from replace `d[i-1][j-1]`, delete `d[i-1][j]`, insert `d[i][j-1]`; equal last chars cost 0; `d[i][0] = i` | two rows |
| Lattice paths right/down | `row[c] += row[c - 1]` | one row |
| Word segmentation | `can[0] = true`, `can[i] = some word w with can[i - w.length]` and the suffix matching `w`; dictionary in a Set | one array |
| Longest increasing subsequence | `tails[k]` = smallest tail of a length k+1 subsequence; lower-bound search, replace or append; `tails` isn't the subsequence, its length is the answer | one array, O(n log n) |
| Bits in every i | `bits[i] = bits[i >> 1] + (i & 1)`, filling the returned array | the output only |
| Travel passes over sparse dates | `best[i]` = cheapest cover from date index i onward; for each pass, binary search the first date at or after `day + duration`; iterate over travel dates, not calendar days | one array |

Rules that keep DP honest:

- **Loop direction encodes the rules.** Downward over amounts means each item once; upward means unlimited reuse. Outer loop over items means combinations; outer loop over totals means sequences. Decide what counts as a distinct answer before writing loops.
- **Seed the base state on purpose:** zero coins make amount 0, the empty prefix is segmentable, the empty suffix decodes one way. Most wrong DP answers are a wrong seed.
- **Pick the width for the largest answer:** 90 stairs or a 17-digit decode count don't fit in 32 bits, and above 2⁵³ JavaScript numbers lose integers (see [BUDGETS.md](BUDGETS.md)).
- **Memoized recursion is fine** for the first correct version, but the recursion depth is the state count; the bottom-up loop has none.
