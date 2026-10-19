# Budgets and numeric traps

An algorithm that is right on paper can still fail on the platform: it allocates a string per token, copies its output on every step, or overflows a number. These traps show up only on the large or adversarial input, so test that input.

## Allocation and copying

- **Answer metadata without materializing.** Decoded base64 length is `(len / 4) * 3` minus the `=` padding; run-length decoded length is the sum of the counts; word count is the number of space-to-word transitions. Expanding, decoding or splitting just to read `.length` allocates the whole output.
- **Parse in place with `charCodeAt`.** Summing space-separated integers, hex bytes (`high * 16 + low`, digits `c - 48`, letters `c - 87` for lowercase), digit sums (`n % 10`, `Math.floor(n / 10)`) and counts of matches all work on the original string. `split`, `slice`, `substring`, regex `match` and `toString()` per token each create a new string. Flush the pending token at the end of input as well as at each separator.
- **Compare in place.** Counting overlapping occurrences: at each start, compare characters directly (or `text.startsWith(needle, i)`), advance by one even after a match.
- **Build output once.** Collect pieces in an array and `join('')` at the end, or fill a preallocated typed array and decode once. Prepending to a growing string or array (`result = digit + result`, `unshift`) copies or reshuffles what's already there on every step; build in reverse and reverse once. Engines optimize some concatenation, but the array-and-join form is predictably linear everywhere.
- **Project tokens onto the property you need.** "Most common word length" needs lengths, not words: scan runs of non-space characters, bump a small frequency array indexed by length at each space and at the end, then scan the buckets from shortest to longest, replacing the best only on a strictly larger count so ties go to the shorter length.
- **Run-length encoding output:** find the end of each run, then emit the character and the count once per run into the pieces array; `+=` per run on a long alternating input (`abab...`) is the slow form.
- **Queues need an index.** `shift()` on a large array can move every remaining element; use a head index over an array or a typed array.
- **Iterator chains allocate.** `map(...).filter(...).reduce(...)` creates intermediate arrays; on a hot path with a memory budget, write the loop.
- **A stack only for what you read.** If only the depth matters, count it.

## Numbers in JavaScript

- **Integers are exact only up to `Number.MAX_SAFE_INTEGER` (2⁵³ - 1).** Large counts (`n(n - 1) / 2` pairs for n = 200,000 is fine; products of two 10⁹ values are not), modular multiplication with a modulus near 10⁹ (the product reaches 10¹⁸), factorial-like DP counts: use `bigint` (`10n ** 18n`) or check `Number.isSafeInteger`. In typed languages the same trap is a 32-bit accumulator; widen the accumulator, not the inputs.
- **Arbitrary-length arithmetic on strings** (add two 300,000-bit binary strings, multiply 3,000-digit numbers): column arithmetic from the right with a carry. For multiplication, digit `i` times digit `j` lands in result slots `i + j` and `i + j + 1`; the result has at most `m + n` digits; strip leading zeros but keep a single `"0"`. `bigint` handles it in JavaScript, but the column form is what the problem tests.
- **Modular exponentiation:** square-and-multiply over the exponent's bits, reducing after every multiplication, about 60 steps for 10¹⁸. With `bigint`, or with a mulmod that keeps products below 2⁵³.
- **Truncation is not floor.** Integer division toward zero is `Math.trunc(a / b)`: `Math.trunc(6 / -132)` is 0 while `Math.floor` gives -1. Bucket starts for negative timestamps need floor (`Math.floor(t / w) * w`, so -1 maps to -10 for width 10), not truncation.
- **Modulo keeps the dividend's sign.** `-1 % 26` is `-1`; normalize with `((x % m) + m) % m` before using it as an index or residue.
- **Bit operators work on 32-bit signed integers.** `x >> 1` and `x | 0` wrap above 2³¹ - 1; `>>>` is the unsigned shift, and `(x >>> 0)` reinterprets as unsigned. Reversing a 32-bit pattern: loop exactly 32 times with `result = ((result << 1) | ((n >>> i) & 1)) >>> 0`. For bit tricks on wider values use `bigint` (`1n << 40n`).
- **Guard the bit tricks.** `n > 0 && (n & (n - 1)) === 0` for a power of two (zero passes the bit test alone); `x & (x - 1)` clears the lowest set bit; Gray code of i is `i ^ (i >> 1)` (with `bigint` past 2³¹).
- **No floating point where exact integers are required.** Use integer search or Horner accumulation (`total = total * 26 + digit`, with digits 1..26 because that numeral system has no zero). The source's specific claim that `Math.Pow` drifts at spreadsheet column `FXSHRXW` is unverified; do not present it as a demonstrated runtime failure. JavaScript safe-integer limits are documented separately. [katabench, excel-column-number; https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isSafeInteger]
- **Clamp while accumulating.** Parsing a 32-bit integer with saturation (atoi): skip spaces, one optional sign, digits; compare against the limit after every digit and return the clamped bound as soon as it's crossed, so a 1,000-digit input never overflows the accumulator.
- **Comparators don't subtract.** `(a, b) => a - b` is fine for safe numbers, but in 32-bit languages it overflows at the extremes; compare (`a < b ? -1 : a > b ? 1 : 0`). And `Array.prototype.sort()` without a comparator sorts numbers as strings.
- **Versions and numbered labels compare numerically per component:** `"1.10" > "1.9"`, `"1.01"` equals `"1.001"`, a missing component is 0. A component longer than a safe integer needs length-then-string comparison after stripping leading zeros.

## Prove it

Keep positional accumulation within the chosen integer representation and distinguish safe-integer limits from an unverified claim that a particular runtime example fails. [katabench, excel-column-number; https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isSafeInteger]
