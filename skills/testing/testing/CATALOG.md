# What to test, by kind of code

Each entry lists the cases that catch the usual broken versions. Expected values are worked out by hand.

## Thresholds and classifications

- **Every cutoff, at and one below:** grades at 90/89, 80/79, 70/69, 60/59. A `>=` turned into `>` changes exactly one of the pair.
- **One input per branch, plus the overlap:** FizzBuzz needs a plain number (7), a multiple of 3 only (9), of 5 only (10) and of both (15), so the combined rule's precedence shows. Leap years need 2023, 2024, 1900 (century, not leap) and 2000 (every 400th, leap).
- **Clamp:** below, inside, above, exactly min and exactly max, a negative-to-positive range, and min equal to max. Assert that below returns min and above returns max, not each other.
- **Triangle-like classifiers:** each outcome, every arrangement of the equal pair (5,5,8 / 5,8,5 / 8,5,5), both reasons for invalid (a non-positive side, the inequality failing) and the degenerate 1,2,3 where `<` versus `<=` hides.
- **Max of several arguments:** the largest value in each position, and an unordered case (3,1,2) that catches comparing against the previous argument instead of the running maximum; all negative values catch a running maximum initialized to 0.

## Formulas and money

- **Separate the parts:** temperature conversion at 0 °C (only the offset) and 100 °C (the scale dominates), plus a value that isn't a multiple of 5 to expose integer division order.
- **Marginal bands:** an income inside each band, exactly at each threshold, just above it, and a high one that stacks every band (only the slice inside a band is taxed at its rate).
- **Splitting money:** totals that don't divide (1000 / 3 is 334,333,333; 1001 / 3 is 334,334,333), a total smaller than the group (2 / 3), one payer. Assert the exact shares, that they sum to the total, and who gets the extra cent.
- **Stacked discounts:** each rule alone at its edge from both sides; one SKU split across two lines to test aggregation; fixtures where each step leaves a fractional cent; a cart that a discount pushes across a shipping threshold; for each adjacent pair of rules, a cart where the wrong order gives a different total.
- **Checksums (Luhn):** a known-valid number, the same number with one digit changed, a digit whose doubling exceeds 9 (`"91"`), odd and even lengths, empty input and a non-digit.
- **Arithmetic on negatives:** floor versus truncation for signed buckets (width 7: -8 to -14, -7 to -7, -1 to -7, 0 to 0, 7 to 7), a width other than the obvious one, an invalid width, and a value too large for a 32-bit intermediate.

## Parsers and text

- **Partition the grammar:** CSV needs plain fields, empty input (one empty field), leading/adjacent/trailing empty fields, whitespace kept as data, a quoted comma, a doubled quote inside quotes, and each malformed case (unterminated quote, a quote inside an unquoted field, junk after a closing quote) asserting the exact error.
- **Expression evaluators:** subtraction and division where reversed operands give a different answer, integer division of negatives, and each error separately (too few operands, leftover operands, unknown token, division by zero).
- **Run-length encoding:** several runs of different lengths, all-distinct characters (`"abc"` to `"a1b1c1"`), a character recurring in two separate runs (`"aabaa"` to `"a2b1a2"`), a single character (only the final flush), empty input, a run longer than 9.
- **Ciphers:** wraparound at both ends of the alphabet in both cases, non-letters unchanged, negative shifts and shifts above 26.
- **Character classes:** every member of the set in both cases, the near miss (`y` for vowels), punctuation, empty text, and a word whose count is clearly less than its length.
- **Palindromes:** mixed case, punctuation, digits next to letters, an even-length string whose mismatch sits in the middle (`"abca"`), and whatever the contract says about null or empty.
- **Unicode:** `.length` counts UTF-16 code units. A surrogate pair counts once and the next character must not be skipped; combining marks count separately; test an isolated low surrogate, a trailing high surrogate, a high surrogate followed by the wrong kind, and NUL. Worst-case names for code that derives initials or slices names are in the [people and names cases](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/browser-ui-qa/WORST-CASE-VALUES.md#people-and-names) [Emil Kowalski, break-ui]; the expected fix takes "Initials from grapheme clusters (`Intl.Segmenter`), first + last word, fallback icon". `Intl.Segmenter` is Baseline 2024 ([MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter)).
- **Brackets:** a type mismatch `"(]"`, an unclosed `"{"`, a lone `")"`, crossed nesting `"([)]"`, every bracket kind, ordinary text if the contract ignores it.
- **Version comparison:** `1.10` against `1.9` (numeric, not text), all three outcomes, a difference only at the minor and only at the patch, padded `1.2` against `1.2.0`, and each unequal pair reversed to check the sign flips.
- **Roman numerals:** a subtractive form from each tier (4, 40, 900), an exact table value (`>` versus `>=`), and a mixed number such as 1994 (MCMXCIV).

## Dates and time windows

- **Next day:** the day before a month ends and the last day, a 30-day month, December 31, February 28 in 2020, 2021, 1900 and 2000, and the zero-padded format.
- **Windows that wrap midnight:** both stretches of an overnight window, each edge from both sides (start inclusive, end exclusive), a same-day window, start equal to end (disabled), and the full date and time a held message is released, including the next-day case.
- **Expiry at the exact instant:** for "expires at `expiresAt`", assert one millisecond before (accepted), exactly at (rejected) and one after (rejected). A `<` changed to `<=` passes the before and after checks and fails only the middle one. Pass `now` into domain functions (`canAccept(invite, now)`); inject a clock only where something must read time or schedule work itself.
- **Delays and timeouts without waiting:** with `vi.useFakeTimers()`, create the delay first, then `await vi.advanceTimersByTimeAsync(...)` to just before and exactly at its duration; for a retry loop, advance once per scheduled delay rather than in one jump. Fake timers control `setTimeout`, `setInterval` and `Date`, not `AbortSignal.timeout()`, which keeps real time; build cancellable timeouts from an `AbortController` aborted by `setTimeout` (or from the injected clock) so the test can trigger them, and assert the pending work actually stops (cancellation only works if the code passes the signal on). Guard each such test with a short real-time limit, so a timer that escaped the fake clock fails in seconds instead of hanging. Call `vi.useRealTimers()` after each test.
- **What a fake clock can't reach:** the database's `now()`, a cache server's TTL and another process's clock keep real time; cover them in integration tests ([INTEGRATION.md](INTEGRATION.md)).

## Stateful code: drive sequences, assert everything

- **State machines:** list every (operation, state) pair and test each; reach each state by every path the table allows (a cancelled order with and without a refund due); a refusal throws **and** leaves every field as it was.
- **LRU cache:** capacity 2 is enough. `put 1, put 2, get 1, put 3` must evict 2; overwriting refreshes recency; a miss returns exactly the documented sentinel.
- **Expiring cache with an injected clock:** one tick before the expiry and exactly at it; reading doesn't extend life; overwriting restarts it; the TTL counts from the set call, not from construction; the count excludes an entry that expired unread; zero or negative TTL is rejected.
- **Rate limiter:** fill the window, assert the next call is rejected, jump forward and assert it's allowed again; rejected calls must not be recorded (allow two, reject one, then find room); the exact edge with a capacity of one.
- **Retry executor:** a counting operation that fails on chosen calls. The budget includes the first call (always failing with 3 attempts means exactly 3 calls and the last error rethrown); a non-retryable error stops after one call even if the next would succeed; no call after success.
- **Circuit breaker:** consecutive versus total failures (a success in between resets); just before, at and after the open deadline; a rejected call neither runs the operation nor extends the deadline; a failed half-open probe reopens from the probe time.
- **Leases with fencing tokens:** rejected acquisitions don't consume tokens; acquisition is allowed at exactly the expiry; renewal measured from now may shorten the lease; a stale token stays powerless even after the same holder name acquires again; failed renewals and releases leave the current owner intact; release never resets the counter.
- **Stock reservations:** two counters move for different reasons (holds lower available, only confirmation lowers on-hand); expiry frees units with no call at all; reserving exactly what's left succeeds; confirm or release on an expired hold fails. If the code tidies up only inside one method, observe the state with as few calls in between as possible, or the tidy-up hides the bug.
- **Ledgers with idempotency keys:** assert both balances after every call; the exact remaining balance succeeds; a rejected transfer doesn't reserve its ID (deposit, retry the same ID, it succeeds); the same ID and amount is a duplicate that moves nothing; the same ID with a different amount is a conflict.
- **Priority queues:** ties leave in insertion order, duplicates included; peek doesn't consume; two instances don't share contents; the extreme priorities catch a comparator that subtracts.
- **Interval merging:** overlap, touching ends (merge when the contract says so), containment (the larger end survives), disjoint, unsorted input, a chain of overlaps, empty input; assert the complete ordered output.
- **Scoring with look-ahead (bowling):** a single spare, a single strike, consecutive strikes, final-frame bonuses, and the perfect game. The source code reads two bonus rolls for every strike, including a final-frame strike in a non-perfect game; the source explanation and our old line incorrectly made that look-ahead exclusive to the perfect game. [katabench, coding-exercises/test-writing/bowling-score-tests.md, Score implementation]

## Orchestration

See the recording-fake pattern in [SKILL.md](SKILL.md): one shared call log for order across collaborators, commands recorded and queries left out, amounts that a unit bug would change, and an injected collaborator failure with the stated recovery asserted. Say in the test where the contract accepts a gap (saving first and sending a best-effort receipt second can lose the receipt if the process dies in between; an outbox closes that gap when the message must not be lost, see the `domain-modeling` skill's EVENTS.md).

## Prove it

For look-ahead scoring, distinguish an ordinary strike's bonus access, final-frame bonus rolls and the perfect-game sequence; do not claim only the perfect game reads two rolls ahead. [katabench, coding-exercises/test-writing/bowling-score-tests.md, Score implementation]
