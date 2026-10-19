# Patterns on arrays and strings

Each section: the cue, the move, the invariant that makes it correct, and the trap. Code is TypeScript; `n` is the input length.

## Hash map or set: remember instead of rescanning

**Cue:** for each item you search the rest of the input for a partner, a repeat or a count. `indexOf`, `includes` or `filter` inside a loop is the same nested loop with shorter spelling.

```ts
function twoSum(nums: number[], target: number): [number, number] | null {
  const indexOf = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const j = indexOf.get(target - nums[i]);
    if (j !== undefined) return [j, i];                // look up before inserting: an item never pairs with itself
    indexOf.set(nums[i], i);
  }
  return null;
}
```

- **Duplicates:** `if (seen.has(v)) return true; seen.add(v)` exits at the first repeat.
- **Iterable inputs and equality:** constructing a `Set` adds every element of the supplied iterable, rather than stopping at the first repeat. Comparing its size with the input's length requires an input with a known element count. The old FUNCTIONAL.md line instead said "for a one-shot iterator it doesn't work at all". A `Set` compares objects by reference; compare a key when value equality is required. [Set constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/Set), [Set value equality](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set#value_equality)
- For speed claims, measure your real collection: where the duplicate sits changes how much work the early exit saves. See [performance-and-caching](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/SKILL.md).
- **Pairs counted by index:** keep a frequency map and count partners **before** inserting the current value. Each pair is counted once, when its later item arrives, and three earlier copies of a partner make three pairs. For "difference exactly k" the partners are `v - k` and `v + k` (with k = 0 they coincide and would double count).
- **Unique means frequency one,** not "distinct": histogram first, then filter by count.
- **Top k by frequency:** count in one pass, then sort only the distinct values by the full key (`count desc, value asc`). A heap of size k beats the sort only when k is tiny against many distinct values.
- **Longest run of consecutive values:** put everything in a set and walk a run only from its start (`!set.has(v - 1)`), so each run is walked once.
- **Bijection (isomorphic strings, pattern matching):** check the mapping in both directions; a one-way map accepts `"ab"` to `"aa"`.
- **Meet in the middle for four-item sums:** count quadruples `i < j < k < l` summing to a target with a map of pair sums. Sweep k; before using k, the map holds sums of pairs `i < j < k`; for each `l > k` add `map[target - a[k] - a[l]]`; then fold the pairs ending at k into the map. O(n²) instead of O(n⁴), and the index order is never violated.
- **First and last index plus count per value** answer "shortest range with the same degree": the range for a top-frequency value is forced to span its first to last occurrence.

## Counting tables and direct addressing

**Cue:** the keys come from a small, fixed universe, or from a range bounded by the input length.

- 26 lowercase letters: `new Int32Array(26)` indexed by `code - 97`. Anagram check: add for one string, subtract for the other, all zero at the end (check lengths first).
- Presence of letters: a 26-bit mask, `mask |= 1 << idx`.
- Only values 0, 1, 2: counting sort, or the three-way partition (Dutch flag) with `low`, `mid`, `high`. After swapping a 2 to `high`, don't advance `mid`: the swapped-in value hasn't been classified.
- **Prove a bound on the answer first.** The first missing positive of n values lies in `1..n+1`, so a boolean table of size n + 2 is enough and everything outside the range is irrelevant. A value range of `1..n` in an array of n + 1 slots guarantees a repeat (pigeonhole), and the array can be read as a graph (see cycle detection in [GRAPHS-AND-DP.md](GRAPHS-AND-DP.md)).
- A complete set with one item missing: expected sum `n(n+1)/2` minus the actual sum, or XOR of both sets. XOR also finds the one value with an odd count, since `x ^ x === 0`.

## Two pointers

**Converging (sorted input or a pair that depends on both ends).** Start at both ends and prove which end can be discarded at each step.

- **Two sum on sorted input:** sum too small, move the left up; too large, move the right down. O(1) extra space.
- **Container with most water:** the shorter wall caps the area, so moving the taller wall can only lose width. Always move the shorter one.
- **Trapping rain water:** the side with the lower running maximum has a settled water level, because the other side is at least that high. Add `maxSide - height` there and move it inward.
- **Boats (at most two per boat, weight limit):** sort; the heaviest person always takes the next boat; add the lightest if they fit.
- **Three sum:** sort a copy, fix each anchor, run two-sum on the suffix. Skip an anchor equal to the previous one, and after a hit skip every copy of both pointer values. Sorted order also makes the output canonical.

**Palindrome check with filtering:** pointers at both ends, each skipping characters that don't count (non-alphanumerics), comparing the lowercase forms. Digits count, so `"0P"` is not a palindrome; a string with nothing left is. No filtered or reversed copy.

**Read and write pointers (compaction).** One pointer reads every item, a slower one writes only the kept ones. Moving zeroes to the end, removing duplicates from sorted input (keep `i === 0 || a[i] !== a[i - 1]`), filtering in place. Deleting with `splice` inside the loop shifts the tail each time and makes it quadratic.

**One cursor per sorted stream.** Merging: compare the two heads, copy the smaller, advance only that cursor, then copy the rest. `<=` takes ties from the first stream, which is stable. Never `shift()` the front of an array in a loop; keep an index.

**Expand around centers** for palindromes: 2n - 1 centers (each character and each gap), push outward while equal, length `right - left - 1`. O(n²) worst case, O(1) space, no substrings.

## Sliding window

**Fixed size k:** sum the first window, then `sum += a[i] - a[i - k]`. Seed `best` from the first real window, not 0, or an all-negative input returns 0. Fixed-width anagram search keeps a 26-slot count plus a `matching` tally of slots equal to the target, updated only for the two letters that cross the boundary.

**Longest window under an "at most" constraint:** expand right; while invalid, shrink left; then the window is the longest valid one ending here.

```ts
function longestWithAtMostTwoKinds(items: number[]): number {
  const count = new Map<number, number>();
  let left = 0, best = 0;
  for (let right = 0; right < items.length; right++) {
    count.set(items[right], (count.get(items[right]) ?? 0) + 1);
    while (count.size > 2) {
      const c = count.get(items[left])! - 1;
      if (c === 0) count.delete(items[left]); else count.set(items[left], c);   // delete zero counts, or size lies
      left++;
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
}
```

- **Replace up to k characters to make one repeated letter:** a window is valid when `length - maxFrequency <= k`. The stored `maxFrequency` may stay a stale historical maximum: it can delay shrinking but can't produce a longer answer that was never valid.

**Shortest window that covers a requirement:** expand until valid, then shrink while still valid, recording the length at each shrink. For "contains every character of `chars`, with multiplicity" keep a signed `need` table and a `missing` count of instances, not of distinct keys.

**When the window is wrong:** the shrink argument needs monotonicity. "Shortest subarray with sum at least target" works with a window only when every value is positive; with negatives, adding an item can lower the sum. Use prefix sums with a monotonic deque instead.

## Prefix sums and a map of earlier states

**Cue:** a property of a contiguous range that can be written as a difference of two running totals. `sum(i..j) = prefix[j + 1] - prefix[i]`.

```ts
function countSubarraysSummingTo(nums: number[], k: number): number {
  const seen = new Map<number, number>([[0, 1]]);    // the empty prefix, so ranges starting at index 0 count
  let prefix = 0, count = 0;
  for (const v of nums) {
    prefix += v;
    count += seen.get(prefix - k) ?? 0;              // every earlier prefix equal to prefix - k starts one range
    seen.set(prefix, (seen.get(prefix) ?? 0) + 1);
  }
  return count;
}
```

- **Store frequencies** when counting ranges, **earliest index** when maximizing length.
- **Divisible by k:** equal residues; normalize `((p % k) + k) % k`, because `%` keeps the sign of the dividend in JavaScript.
- **Equal numbers of two kinds:** map one kind to +1 and the other to -1; equal balances enclose a balanced range. Seed balance 0 at index -1.
- **"More of A than B" (strict majority):** with +1/-1 scores, if the running score is positive the whole prefix qualifies; otherwise look up the earliest index of `score - 1`.
- **Pivot / both sides:** total once, running left sum, `right = total - left - a[i]`; compare before adding `a[i]` to the left.
- **Product except self:** prefix products left to right into the output, then multiply by a running suffix product right to left. No division, zeros handled.
- **Removing one item flips the parity of everything after it:** keep left even/odd sums and right even/odd sums; after removal, `even = leftEven + rightOdd`.
- **Sorted array, sum of `|a[i] - a[j]|` over all j:** the signs are known, so `i * a[i] - leftSum + rightSum - rightCount * a[i]`.
- **Count ranges whose sum lies in a band with negatives:** merge sort over prefix sums, counting crossing pairs with two forward-moving boundaries (see merge-time counting).

## Monotonic stack

**Cue:** for each item, the nearest item to one side that is greater or smaller; a rescan forward from every position.

```ts
function daysUntilWarmer(t: number[]): number[] {
  const answer = new Array<number>(t.length).fill(0);
  const waiting: number[] = [];                      // indices still unresolved, temperatures decreasing
  for (let i = 0; i < t.length; i++) {
    while (waiting.length && t[waiting[waiting.length - 1]] < t[i]) {   // strictly warmer resolves; equal does not
      const j = waiting.pop()!;
      answer[j] = i - j;
    }
    waiting.push(i);
  }
  return answer;
}
```

Each index is pushed once and popped at most once, so the inner `while` is linear overall.

- **Largest rectangle in a histogram:** keep an increasing stack; when a shorter bar arrives, the popped bar's span runs from the new top (exclusive) to the current index (exclusive). A zero-height sentinel at the end flushes the stack.
- **Sum of subarray minimums:** each item's contribution is `value * leftChoices * rightChoices`, with the left boundary at the previous **strictly** smaller item and the right boundary at the next smaller **or equal** one. The asymmetric tie rule assigns a subarray with repeated minima to exactly one index.
- **Plain stack for nesting:** matching brackets (push the expected closer, compare on close, empty stack at the end), `k[inner]` decoding (push prefix and repeat count at `[`, pop and repeat at `]`, parse multi-digit counts), path normalization (`..` pops only when there is something to pop, `...` is a name), adjacent-pair cancellation (the output buffer is the stack), postfix evaluation (pop the right operand first).
- **When a counter is enough:** if every opener is the same, depth is one integer, and a stack only allocates.

## Monotonic deque

**Shortest subarray with sum at least target, negatives allowed:** a deque of prefix indices with increasing prefix sums. For each `end`: pop qualifying starts from the front (record the length; a later end with the same start is only longer), pop from the back while `prefix[end] <= prefix[back]` (the newer index dominates: shorter and at least as large a sum), then push `end`. Every index enters and leaves once. The same shape gives sliding-window maxima.

## Binary search

**On a sorted array:** `lo <= hi`, `mid = lo + Math.floor((hi - lo) / 2)`, discard the half that can't hold the target. JavaScript `>>` converts numbers to signed 32-bit integers, so subtracting before shifting does not protect a gap of 2³¹ or more. The old line used `lo + ((hi - lo) >> 1)`. [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Right_shift]

**On the answer:** when the question is "the smallest x that works" or "the largest x that works" and feasibility flips only once, search x and test it with a linear check.

```ts
function smallestFeasible(lo: number, hi: number, works: (x: number) => boolean): number {
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);      // lower midpoint for "smallest feasible"
    if (works(mid)) hi = mid; else lo = mid + 1;
  }
  return lo;                                          // caller checks works(lo) when nothing may be feasible
}
// "largest feasible" uses the upper midpoint, lo + Math.ceil((hi - lo) / 2), and lo = mid on success, so it can't loop forever
```

| Problem | Searched value and bounds | Feasibility check |
|---|---|---|
| Eating speed within h hours | speed, 1 .. max pile | `sum(ceil(p / s)) <= h`, with ceiling as `Math.floor((p + s - 1) / s)`; stop once over budget |
| Ship packages in order within d days | capacity, max weight .. total weight | greedy: fill each day until the next package overflows |
| Bouquets of k adjacent flowers | day, min .. max bloom day | count runs of bloomed flowers, reset on an unbloomed one; reject `m * k > n` first |
| Equal ribbon pieces, at least k | length, 1 .. longest | `sum(floor(r / L)) >= k`; 0 if length 1 fails |
| Largest minimum gap between m balls | gap, 1 .. span | sort, place greedily at the first basket far enough |
| Integer square root | r, 0 .. 3,037,000,499 for 64-bit | `r * r <= n` in exact integers (bigint in JS), or `r <= Math.floor(n / r)` to avoid the product overflowing; never `Math.sqrt` near 10¹⁸ |
| k-th missing positive | index in the array | missing before `a[i]` is `a[i] - (i + 1)`; answer `k + lo` |

The proof is the monotonicity: write down why a larger speed can't need more hours, or why a longer piece can't yield more pieces. If it can flip back, binary search is wrong.

## Sort plus a greedy choice

Sort, then make the choice an exchange argument proves safe: anchoring the most constrained extreme (boats), the earliest finish (unweighted interval scheduling), placing each item as early as allowed (gap placement). Prove it by showing that swapping any optimal solution's choice for the greedy one can't make it worse.

- **Weighted intervals break greedy:** sort by end, `best[i + 1] = max(best[i], best[p] + value[i])`, where `p` is the number of earlier jobs that end (plus any cleanup gap) by this start, found by binary search.
- **Merge intervals:** sort by start, extend the running end with `Math.max` (a contained interval must not shrink it), merge on `start <= end` when touching counts.
- **Partition so each letter is in one part:** record each letter's last index, extend the current end to the farthest last index seen, cut when the scan reaches it.
- **Minimum jumps:** BFS layers compressed to intervals. Scan the current reachable interval, track the farthest next boundary, count a jump when the scan passes the old boundary; fail if the boundary can't advance. Jumping to the farthest immediate index is not optimal.
- **Greedy over a table with the exceptions included:** integer to Roman with the 13 pairs (`900 CM`, `4 IV` ...) in descending order needs no special cases. Roman to integer: a symbol smaller than its right neighbor subtracts.
- **Text justification:** greedy packing, then `spaces / gaps` per gap with `spaces % gaps` extra on the leftmost gaps; the last line and one-word lines are left-aligned and padded.

## Merge-time counting

Counting pairs `i < j` with an order condition (inversions, `prefix[j] - prefix[i]` in a band): split, count inside each half recursively, then count crossing pairs while both halves are sorted. For inversions, when a right value is smaller than the current left value, it is smaller than every unmerged left value, so add their count in one step. Take the left value on ties when the definition is strict. Sort a private copy, reuse one buffer, and count with enough width (`n(n - 1) / 2` pairs).

## Contribution counting

Instead of enumerating ranges, ask how many ranges contain each item. Index i (0-based) of n lies in `(i + 1) * (n - i)` subarrays, so the sum of all subarray sums is `sum(a[i] * (i + 1) * (n - i))`. Combined with monotonic boundaries, the same move gives sums of minimums or maximums over all subarrays.

## The scan with tiny state

Some problems need neither a structure nor a trick, only the smallest state that preserves the answer:

- Best single trade: running minimum price and best profit.
- Maximum subarray (Kadane): `cur = max(v, cur + v)`, `best = max(best, cur)`, both seeded with the first item.
- Longest strictly rising streak: extend on a strict rise, reset to 1 otherwise; compare values directly, don't subtract.
- Majority element (more than n/2 guaranteed): Boyer-Moore voting. Without the guarantee, verify the candidate with a second pass.
- Word count: count transitions from space to non-space.
- Trimmed sum (drop one min and one max): total, min and max in one pass, no sort.
- Min or max of objects (the latest, the oldest and newest) [Vercel, react-best-practices]: one O(n) pass, not a sort for `sorted[0]`. "Single pass through the array, no copying, no sorting":

  ```typescript
  function getOldestAndNewest(projects: Project[]) {
    if (projects.length === 0) return { oldest: null, newest: null }

    let oldest = projects[0]
    let newest = projects[0]

    for (let i = 1; i < projects.length; i++) {
      if (projects[i].updatedAt < oldest.updatedAt) oldest = projects[i]
      if (projects[i].updatedAt > newest.updatedAt) newest = projects[i]
    }

    return { oldest, newest }
  }
  ```

  `Math.max(...arr)` is fine for a few numbers only: "both spread (`...`) and `apply` will either fail or return the wrong result if the array has too many elements, because they try to pass the array elements as function parameters. ... The `reduce` solution does not have this problem" (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/max). The rule's per-browser limits (about 124,000 in Chrome 143, 638,000 in Safari 18) come from a jsfiddle, not a spec.
- GCD of many values: fold Euclid's `gcd(a, b) = gcd(b, a % b)` across the array and stop as soon as the running value is 1. Trying divisors downward from the minimum is billions of steps when the answer is 1.
- Zigzag layout over r rows: simulate the row index bouncing between 0 and r - 1, appending to one buffer per row, then join the rows. With one row, or at least as many rows as characters, return the input: the direction would never flip.

## Prove it

Binary-search midpoint arithmetic must not coerce the index gap to a signed 32-bit number; compare the chosen expression with JavaScript's documented shift semantics. [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Right_shift]
