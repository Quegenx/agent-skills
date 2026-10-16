# The harness

## The run

Each case is a conversation: the customer's messages, the data it starts from (a waiting gift order, a paid website order), and its checks. The harness plays each message through the production turn, exactly as the inbound path stores and handles it, and collects:

- every turn's reply, the tools called with their inputs and outputs (from the wire, not from the agent's account), and the final state of the records (the latest order, an open draft);
- the conversation as the judges read it;
- tokens in, out and cached, and the versions of the model, the judge, the prompts and the tools (hashes of their folders).

**A fresh data store per case,** seeded with the real catalogue and settings as of a fixed date and no customer data. **Only the clock is faked:** each case's first message arrives at a fixed time (say Tuesday 12:00 local), each later one a minute after; timers and timeouts stay real.

## Fixtures and the network guard

Replace the global `fetch` for the whole eval process and never restore it, so work a case leaves running is guarded too:

```ts
type Fixture = (url: URL, init?: RequestInit) => Response | Promise<Response>;

export function guardNetwork(passThrough: readonly string[], fixtures: Record<string, Fixture>) {
  const real = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : input.toString());
    if (passThrough.includes(url.host)) return real(input, init);               // the model APIs only
    const fixture = fixtures[url.host];
    if (fixture) return fixture(url, init);
    throw new Error(`EVAL_UNREACHABLE_SERVICE: ${url.host} has no fixture`);   // a harness error, not the agent's fail
  }) as typeof fetch;
}
```

- Fixtures answer in the shape the app's own clients parse, and a test runs those clients against the fixtures, so a fixture can't drift from reality unnoticed.
- **A "down" case per outside service:** the fixture answers 503 and the case checks the agent hands off and promises nothing.
- Tests never message real people, charge cards or send campaigns; the guard is what enforces it.

## Run records

Per run: a manifest (fingerprint, variant, models, versions), one result line per case and repetition (`case_id`, `rep`, `passed_all`, each check's pass, reason and, for judges, probability and confidence, the output, the tools called, the trace steps), errors kept apart from failures, and a summary. Store them locally (out of git) with a small report page; track the case index and where each case came from.

## Fingerprints, variants, resume

A **variant** is one version of the code. Its fingerprint hashes the commit, the uncommitted and untracked changes (outside the records folder), the case index and the repetitions. A run directory with another fingerprint is refused (`EVAL_RUN_CHANGED`): changed code is a new variant. Filters (by file or case name) narrow a run without changing its fingerprint, and a rerun of the same variant skips the slots already finished.

Run full suites from a **separate checkout or worktree** pinned to a commit, in the background, so you can keep editing; never change the code a recorded run is using.

## Repetitions and intervals

Run each repetition as its own process (a test runner's built-in repeat often stops at the first failure). Report the pass rate with a 95% interval, so a change is judged against noise:

```ts
/** Wilson score interval for a pass rate: honest at small n and near 0 or 1. */
export function passRateInterval(passed: number, total: number, z = 1.96) {
  const p = passed / total, z2 = z * z, d = 1 + z2 / total;
  const centre = (p + z2 / (2 * total)) / d;
  const half = (z / d) * Math.sqrt((p * (1 - p)) / total + z2 / (4 * total * total));
  return { rate: p, low: Math.max(0, centre - half), high: Math.min(1, centre + half) };
}
```

Compare runs case by case, not only by the headline: list the cases that fell from all-pass and the ones that rose.

## Snapshots and the real entry path

- **Pin the rendered prompt and tool schemas** as snapshot files, refreshed on purpose and reviewed as diffs.
- **Re-recording a baseline produces fixtures, not correctness:** a refresh can commit errors as the expected output. Assert error counts separately.
- **At least one test drives the real entry path and needs no key** (a scripted fake model). A feature can be dead in production behind hundreds of green tests that mounted it by hand while the one end-to-end test was skipped for lack of a key.
- **A regression test must be able to fail for the reported mechanism,** not pass on a timeout.
