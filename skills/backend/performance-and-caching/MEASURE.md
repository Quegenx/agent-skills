# Measure, then remove work

## Get a breakdown

- Time each step of the request: every database query, every external call, the compute in between, serialization. Tracing (OpenTelemetry spans, set up as in the `observability` skill) shows it as a waterfall; at minimum, log durations per step with the request id.
- Measure on realistic data sizes and concurrency, several runs, and look at the slow end (p95, p99), not just the average: an average erases the shape of the distribution. A server where every request takes about 100 ms and one where most take 30 ms but some take 900 ms can both average 100 ms.
- **Define each journey metric so they compare:** add instrumentation until every one starts with a user interaction, ends once the result is rendered, and separates client and server work. Pick the journeys from usage data (in one case four journeys made up 95% of activity and gave thirteen measurements across web and desktop). That push reported real users at the 75th percentile, and afterwards the 95th percentile still had room to improve.
- **Every new count finds waste, so keep finding more things to measure:** once there is a number to beat, the optimizing can start. Measured cases: a React hook census found 6,900 hooks and 900 store subscriptions in a composer's typing path, re-rendering on every keystroke; counting style recalculations found a single `:root:has()` selector adding 24 ms to every DOM change; tracing code paths after first paint found a leftover `location.reload()` causing half a million hidden reloads a day that no load metric saw; profiler samples from idle tabs showed identical cache snapshots cloned into IndexedDB twice a minute, all on the main thread.
- In Postgres, run `explain (analyze, buffers)` on the slow queries: look for sequential scans on large tables, row estimates far from actual rows, and sorts or joins spilling to disk. In Supabase, the query performance reports show the most expensive queries.
- In the browser, the Network panel waterfall shows requests that wait for each other and payloads that are too large. A Lighthouse run is lab data: how its score is weighted, its bands, and the audit ids that changed in Lighthouse 13 are in [web-performance LIGHTHOUSE-CI.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/LIGHTHOUSE-CI.md#reading-a-lighthouse-result).

Write the baseline: total time and each step, with the data size and environment. Then fix the slowest step first: it gives the biggest gain, and fixing it often reveals the next bottleneck. Repeat until the target is met, not until nothing is left. A two-week push took the other reading: targets set by adding up per-project millisecond estimates are not the stopping point, and a thread closes when it reaches diminishing returns.

## Remove work

- **Round trips add up.** Each trip to the database or another service costs milliseconds (often 5 to 10 or more) before any work happens, so ten trips in a loop are visible. Look for hidden ones in the Network panel too: in one second-hand report, adding a custom header made a difference because every GET triggered a preflight.
- **N+1 queries:** a query per item in a list. Load them in one query (a join, `where id = any($1)` / `in (...)`, or a batched loader).
- **Several queries for one response:** combine them into one database function that returns everything (`supabase.rpc(...)` returning JSON), or one Convex query that reads all it needs, instead of a round trip per piece.
- **Several calls to the same service:** ask it for one batched call that returns everything the caller needs.
- **The same calculation with the same arguments** several times in one request: compute once (memoize for the request's lifetime). One profile found a quarter of a hot path's instructions were megamorphic dictionary lookups, resolving the same message ID three separate times.
- **Repeated queries:** the same lookup several times in one request. Load once and pass it down.
- **Over-fetching:** select only the columns and rows the response needs; paginate.
- **Missing indexes:** an index that matches the filter and sort of the slow query (in Convex, `.withIndex()` instead of `.filter()` on large tables). When the database is the bottleneck, this is often the whole fix. [QUERIES.md](QUERIES.md) has the query shapes and which index serves which one.
- **Work that doesn't belong in the request:** move it to a background job and return sooner (see the `background-jobs` skill).

## Overlap independent waits

Calls that don't depend on each other can run at the same time:

```ts
// sequential: total = a + b + c
const loans = await getLoans(userId);
const holds = await getHolds(userId);
const recs = await getRecommendations(userId);

// overlapped: total = max(a, b, c)
const [loans, holds, recs] = await Promise.all([getLoans(userId), getHolds(userId), getRecommendations(userId)]);
```

- Use `Promise.allSettled` when one failing call shouldn't fail the whole response, and decide what to show without it.
- **Bound the concurrency** when the count depends on data (one call per item): a limit (for example 5 at a time) protects the dependency and your connection pool. Unbounded `Promise.all` over a large list is a self-inflicted outage.
- All of them share the request's deadline and cancellation signal (see the `api-design` skill's RELIABILITY.md).

**Start early, await late,** when only part of the chain depends on an earlier result: "In API routes and Server Actions, start independent operations immediately, even if you don't await them yet." [Vercel, vercel-react-best-practices, async-api-routes.md]

```typescript
export async function GET(request: Request) {
  const sessionPromise = auth()
  const configPromise = fetchConfig()
  const session = await sessionPromise
  const [config, data] = await Promise.all([
    configPromise,
    fetchData(session.user.id)
  ])
  return Response.json({ data, config })
}
```

For partial dependencies the source's first choice is the third-party `better-all` package, which "automatically starts each task at the earliest possible moment" (https://github.com/shuding/better-all). Without it: "We can also create all the promises first, and do `Promise.all()` at the end" [Vercel, vercel-react-best-practices, async-dependencies.md]:

```typescript
const userPromise = fetchUser()
const profilePromise = userPromise.then(user => fetchProfile(user.id))

const [user, config, profile] = await Promise.all([
  userPromise,
  fetchConfig(),
  profilePromise
])
```

**When not to overlap** [Vercel, vercel-optimize, support-topics/auth-preserving-parallelization.md, function-duration-io-and-after.md, lib/verify-claim.mjs]:

- **Never move a private read ahead of the check that authorizes it.** "Parallelizing awaits is safe only when it does not move private data access ahead of the auth, ownership, tenant, or permission check protecting that data." "Do not parallelize a private record fetch with the ownership check that authorizes that fetch. Instead, recommend combining the guard and data lookup into one query constrained by the authenticated user, tenant, or ownership key." A `getSession()` that gates a redirect stays first. The example above is safe because `fetchData` waits for `session`. (The same skill's SaaS and API playbooks say "`await getSession()` then `await checkPermissions()` then `await loadData()`, these can often be parallelized when the permissions check doesn't depend on the data load"; the auth-preserving rule is the one to follow. Tenant isolation is in the `secure-coding` skill.)
- **Not for CPU-bound work.** "Do not recommend `Promise.all` for CPU-bound or compile-bound work unless trace/span evidence shows wait time to overlap. High `cpu.p95` near `latency.p95` is a warning sign." `Promise.all` overlaps waiting, not computing.
- **Not for dependent operations,** and "Do not replace `Promise.allSettled` when partial failure handling is intentional."
- **Don't promise the saving before measuring it:** "Do not promise a latency drop equal to a helper unless that helper duration was measured", and its verifier rejects a promised "helper/round-trip-sized drop without measured helper or span timing".

## Slow routes, cold starts and wall clock on Vercel

Thresholds from Vercel's vercel-optimize skill, all per 14-day window ([VERCEL-METRICS.md](VERCEL-METRICS.md) has the queries) [Vercel, vercel-optimize, lib/gates/slow-route.mjs, lib/gates/cold-start.mjs, lib/reconcile-candidates.mjs, lib/investigation-brief.mjs, support-topics/]:

- **A slow route is worth the work at** p95 over 500 ms with at least 1,400 invocations, or p95 over 1,500 ms with at least 250. "1.4k/14d is the floor where p95 stabilizes statistically and a 3-5x performance win still pays for engineering time." Rank by p95 times invocations.
- **A route with more than 50% 5xx is a reliability problem,** not a tuning target: its "latency reflects crash time, not work time". Two more reasons to stop before reading code: the per-route follow-up shows p95 under 500 ms (the broad query misled), or the worst deployment's p95 is at least 1,000 ms and at least twice the next one, which is a deployment regression to triage (it needs 3 or more deployments to tell). 3xx and 4xx slices inflate p95.
- **CPU against wall clock decides where to look.** "If cpu << latency, the bottleneck is wall-clock / external IO / awaits ... If cpu ≈ latency, look for in-process compute." "When wall-clock latency is much higher than CPU time, check critical-path awaits before blaming rendering or compute." TTFB close to total latency points at streaming earlier or moving work after the response (`after()`, stable since Next.js 15.1.0, https://nextjs.org/docs/app/api-reference/functions/after). "For streaming, SSE, resumable chat ... do not treat high wall-clock duration alone as a bug."
- **Cold starts count only at volume:** cold share over 40% with at least 1,000 invocations; "30% is the noise floor for serverless without keep-warm", and 1,000 per window "keeps Poisson CI on cold rate at ~±5% near the 40% threshold". Look at module-scope SDK and database client construction, top-level network calls, heavy dependencies and the runtime export; cold starts concentrated on the newest deployment point at a regression (imports, init code, a framework upgrade). "Do not blame cold starts when warm requests are similarly slow. Do not recommend keep-warm traffic or more memory before proving initialization or runtime pressure." (The skill's "Cold starts add 200-800ms per request" has no source; don't quote it.)
- **Slow upstreams:** host p75 over 2,000 ms with at least 500 calls, ranked by p75 times calls ("100k-call/2.1s outranks 1k-call/8s"). A wide p95 to p99 spread means a flaky upstream; a narrow one, slow by design. "Do not blame Vercel runtime when the upstream owns the latency."
- **Errors cost money too:** "Errored function invocations still bill at full duration." Flag a route at more than 250 5xx, or at least 1,000 requests with over 1% 5xx; name a runtime cause only with log or stack evidence.

## Cache last

Only after the above. A cache adds stale data and a second source of truth. Good candidates are read often and change rarely; decide how long a value may be stale and how it gets cleared before adding it ([CACHING.md](CACHING.md)).

## Compare honestly

Apply one change, re-measure the same way, record the result, then the next change. Keep a small table: change, before, after, conditions. Revert changes that didn't help; they're only complexity. A change that does help can still be refused when the gain isn't worth its upkeep: one 900-line PR got "going to gavel that 2ms per send is not worth the complexity of maintaining this build plugin."

## Compare the completed task

[morluto/rea, rea-analysis-optimization/SKILL.md]

- Pin the completed task, target/input identity, options, host and evidence coverage before comparing implementations. A smaller projection is not equivalent if it omits facts needed to finish the task.
- Include admission, producer work, decoding, lookup, projection, serialization, retained evidence and cleanup. Count catalog/discovery calls and continuations when they affect the actual task.
- Compare small/empty as well as representative inputs. Distinguish fresh sessions, warm runtime caches and OS file caches; keep failed attempts and resource stops.
- Account for the process family and retained state, not just the parent heap. Projection can reduce transport output while leaving analysis work and peak memory unchanged.
- For token claims, count discovery/schema, arguments, replies, retries and follow-up calls. Label tokenizer estimates separately from actual model usage. Smaller JSON alone proves neither fewer model tokens nor a better completed investigation.
- Use an [independent correctness oracle](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/testing/INTEGRATION.md#independent-evidence) before comparing speed. Shared-work cancellation and cleanup follow the canonical [resource ownership contract](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-harness/TOOLS.md#evidence-and-resource-ownership).

## An optimization loop (run by you or by an agent)

For a sustained push on one hot path, write the goal down before the first change, so neither you nor an agent can move it later:

- **One score over several cells:** the cases that matter (each platform, single and multi-threaded, one request and a batch, small and large inputs), combined as a harmonic mean of the per-cell speedups, so one big win can't hide a loss elsewhere. Weight the cells by how much they matter.
- **What counts as a win:** the score up by a set margin (say 1%) and no cell worse beyond noise (say 1%). A change that trades one cell for another is a failed hypothesis, not a trade-off.
- **Correctness gates that never bend:** identical outputs (bit for bit where the result is deterministic, or "at least 99.9% of queries return the same results" where it is approximate), the test suite green, the file format and memory per item unchanged.
- **A cell with no weight to catch cost-shifting:** time the next step too (load and then the first query), so a "faster load" that moves the work into the first query doesn't count.
- **Fixed, dedicated machines,** never a laptop or a shared box; a clean build before each measurement; a sanity check that the measurements aren't contaminated (a ratio between two cells that should stay constant across runs).
- **Two stages per hypothesis:** a quick screen of a few minutes, and only a passing screen gets the long confirmation run.
- **Log every hypothesis with its numbers and verdict, wins and failures alike,** with the baseline it was scored against. A tried-and-failed idea is listed as such; reopening it needs a reason (what new measurement no longer covers it), not a bare retry.
- **Stop at a run of failures** (say 20 in a row without a win); every win resets the count.

The loop suits an agent well: a written goal, a harness that scores a candidate in one command, and a log the next session can read are what keep it from declaring victory early or re-running last week's dead ends.

Steering an agent through a push like this:

- **Ask for boldness once the guardrails are in place.** By default the agent is careful about scope: it tickets findings, hedges on feasibility and pads its estimates. Prompts that worked: "please be braver", and when threads slowed at the targets, "Let's keep driving this down, the targets are not the stopping point. What's next? Be ambitious."
- **One named human owner per thread, and each thread narrow:** one benchmark or journey, improvements only within that scope. The human calls are sequencing and user impact: which surfaces to prioritize, how to combine threads that are stepping on each other, and when to close a thread that has reached diminishing returns.
- **Every user-perceptible change goes to the owner with before-and-after screenshots or recordings.** Whether a table fills in cell by cell or waits for each row, or a loading skeleton shows at once or after half a second, is a taste call for a human.

## Deterministic counts and ratchets

- **Wall-clock time is what users feel, but it's noisy,** and milliseconds are too flaky to use as a CI gate. For pure-JS hot paths, count instructions: "run the benchmark under Valgrind with `node --predictable` and compare to a checked-in baseline: one run, no statistics needed." In the browser there's no instruction counting under Chromium, but there are other deterministic counts: React commits per interaction, function call counts from V8's precise coverage, layout and style-recalc counts, DOM mutations.
- **A count stays only once it proves it tracks wall-clock time.** Each benchmark has two jobs: a metric to move in the lab, and a CI guardrail with a number that can only ratchet down. Throw out one that is flaky or doesn't correlate with user latency, rather than climb the wrong hill. The prompt for an agent:

```
@Claude please prove that hill climbing against each of these can result in measurable wall clock perf wins. we'll unship the benches for any candidates that cannot prove that
```

  Measured: message-tree assembly cut instructions 48% and wall-clock time 78% (4.6x faster); a status-line scanner cut instructions 31% and wall-clock time 44% (1.8x). Counts under Valgrind with `node --predictable`; timings on the same benchmark under plain node with the JIT warm.
- **Ratchet each proven count in CI:** any PR that raises the count fails, and a daily job lowers the ceiling whenever the count goes down, so a win doesn't decay in a fast-moving codebase.
- **Lighthouse CI gates the same way** ([web-performance LIGHTHOUSE-CI.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/LIGHTHOUSE-CI.md#variance), "Assert facts over conclusions"). In LHCI that is `"resource-summary:script:count": ["error", {"maxNumericValue": N}]` and `maxLength: 0` on opportunity audits, with today's failing audits turned `"off"` as a burndown list and turned back on as each is fixed ([web-performance LIGHTHOUSE-CI.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/LIGHTHOUSE-CI.md#start-slowly-then-ratchet)). Site auditors gate on rule findings, which are deterministic too: squirrelscan's GitHub Action "fail[s] the build on regressions" ([site-audit SQUIRRELSCAN.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/site-audit/SQUIRRELSCAN.md#ci)).
- **The other view: a controlled wall-clock gate.** React Doctor's [paired comparison and slowdown thresholds](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/lint-rule-authoring/BASE-HEAD-PARITY.md#slowdown-thresholds) own its complete-report, identical-coverage, sequential-run and threshold contract. Both views stand: deterministic counts for the per-change CI gate; wall clock under that comparison's controlled conditions. [React Doctor, run-parity]

## Lab to field, one slow spot at a time

Lab counts let an agent iterate faster than the deploy cadence; field data confirms the win. One thread runs:

1. Someone opens a thread about a slow stretch of a journey, often with a screenshot or recording.
2. The agent traces the flow, then finds or builds a benchmark that demonstrates the problem.
3. With a promising lab result, it opens a PR, often several, sized for risk and review, with anything user-visible behind a flag (the rollout ladder is in the `api-design` skill's [api-design FLAGS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/api-design/FLAGS.md)).
4. After it ships, the agent watches the deploy and reads the field data by build and platform.
5. If performance improved, it locks in the win by ratcheting the benchmark down; if not, it turns the flag off and iterates.
6. Then it looks for the next slow spot in the same journey.

## Prove it

Take a reader dashboard that queries loans and calls two remote services. Measure the breakdown. Remove one repeated query and measure. Then run the two remote calls in parallel with a concurrency bound and measure again. Report each change's effect separately, with the conditions. For any count used as a CI gate, show that driving it down moved wall-clock time on the same benchmark.
