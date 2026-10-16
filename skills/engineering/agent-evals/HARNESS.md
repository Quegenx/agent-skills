# The harness

## The run

Each case is a conversation: the customer's messages, the data it starts from (a waiting gift order, a paid website order), and its checks. The harness plays each message through the production turn, exactly as the inbound path stores and handles it, and collects:

- every turn's reply, the tools called with their inputs and outputs (from the wire, not from the agent's account), and the final state of the records (the latest order, an open draft);
- the conversation as the judges read it;
- tokens in, out and cached, and the versions of the model, the judge, the prompts and the tools (hashes of their folders).

**Say what a case grades,** since each catches a different failure: the **end result** (did the task get done, judged on the final state, not on the agent's account of it), the **path** (which tools, with which inputs, in which order, how many steps), or **one part** (the planner, the retriever, one tool's input) in isolation. Path checks name their strictness: the right tools in any order, the exact order, or the exact inputs too. A plan can be good and not followed, or followed and bad: check both when the agent plans.

**A fresh data store per case,** seeded with the real catalogue and settings as of a fixed date and no customer data. **Only the clock is faked:** each case's first message arrives at a fixed time (say Tuesday 12:00 local), each later one a minute after; timers and timeouts stay real.

## The cases

- **Each case records where it came from:** the source (a real conversation, a reported failure, written to fill a gap), its group, where its expected answer came from, and the fixtures that replay it. Expected answers written by a model are marked, and a person checks them before they count.
- **Mix regressions, normal requests and negatives** (things the agent must refuse or leave alone). Keep a **hard set** of known tricky cases apart from the **representative set**; a pass rate on the hard set says nothing about how often users fail.
- **Write cases only to fill a gap** real traffic doesn't cover, by crossing a few dimensions (the request, how ambiguous it is, which policy exception applies); write the inputs first and separately, mark them as written, and have the product owner drop the unrealistic ones.
- **Group before you split:** messages from one conversation, one customer, one document, or paraphrases of one request stay in the same split, or the test leaks. Remove duplicates first.
- **Three splits:** dev (read failures, fix), validation (choose between variants), test (once, at the end). Freeze the splits before optimizing and never redraw them to get a better number. A small set supports "looks better", not a rate.
- **Expected answers live where the agent can't reach them:** a separate store only the grader reads. Telling an agent not to look doesn't work.
- **A sample picked to find failures** can't give a failure rate; a rate needs a random sample, or weights per stratum.

## Simulated users

A multi-turn case can't be replayed from an old conversation: the user's next message answered the old reply, so a changed agent talks to a user who no longer makes sense. Simulate the user instead:

- **A case is a scenario, an expected outcome and a persona** ("wants to move a delivery to Friday; ends with the new date confirmed; short messages, impatient, writes the address in two parts"). The same scenario with three personas gives three different conversations.
- **A model plays the user against the real agent** until the outcome is reached or a turn limit hits (4 to 8 turns to start, longer for long workflows, 3 to 5 for a smoke run). Hitting the limit is a result to grade, not a harness error.
- **Each simulated conversation gets its own id,** so state the agent keeps by conversation (orders, memory) stays apart; give fixed opening turns when the product always opens the same way.
- **Return what each turn did** (tools called, context retrieved) with the reply, so per-turn checks can grade it; a conversation of text alone only supports conversation-level judges.
- The simulated user is a model too: read a few simulated conversations before trusting the suite, and drop a persona that keeps breaking character.

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
- **Seeded faults:** a run can inject tool failures and slow answers from a fixed seed, to score recovery the same way every time.
- Tests never message real people, charge cards or send campaigns; the guard is what enforces it.

## Run records

Per run: a manifest (fingerprint, variant, models, versions), one result line per case and repetition (`case_id`, `rep`, `passed_all`, each check's pass, reason and, for judges, probability and confidence, the output, the tools called, the trace steps), errors kept apart from failures, and a summary. Store them locally (out of git) with a small report page; track the case index and where each case came from.

- **Every slot ends with one status:** `ok`, `app_error`, `grader_error`, `timeout` or `truncated`. Only `ok` slots carry quality grades; the summary reports the error counts and both denominators (all slots, graded slots). An undecidable grade is a grader error, never a fail.
- **Retry only transient errors,** keep every attempt, and never pick the best one. A case has a deadline; a timed-out call may still be billed.
- **Token counts come from the leaf model calls,** never added again from a parent's total; an unknown count is empty, not zero. A cost names its price source and date and says whether every call was counted.
- **Pilot one case first:** check that every recorded field is filled for real (an unknown silently written as 0 looks like a cheap run) and that the setting you are testing actually reached the agent and its subagents.

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

- **Fresh outputs for every variant:** regrading stored outputs is for testing a grader, not the agent. Compare the same cases in pairs (or the same groups), on the same judge, config and fixtures.
- **Repetitions measure variability on fixed cases;** they are not extra cases. When a variant builds something random (an index, a summary), add a no-change control run to see that variance.
- **Name the primary metric before looking at results.** Comparing once at a planned size is a plain test; checking as results arrive needs a sequential test made for peeking; three or more variants need a correction for multiple comparisons. A comparison informs a person's choice; it is not a merge gate.
- **Recompute the headline from the raw rows** before quoting it.

## Snapshots and the real entry path

- **Pin the rendered prompt and tool schemas** as snapshot files, refreshed on purpose and reviewed as diffs.
- **Re-recording a baseline produces fixtures, not correctness:** a refresh can commit errors as the expected output. Assert error counts separately.
- **At least one test drives the real entry path and needs no key** (a scripted fake model). A feature can be dead in production behind hundreds of green tests that mounted it by hand while the one end-to-end test was skipped for lack of a key.
- **A regression test must be able to fail for the reported mechanism,** not pass on a timeout.

## Scripted model tests

Below the eval suite sits a layer of fast, free, exact tests: the real agent object with a model that replays a script, one reply per step. They prove the loop's own rules (what stops it, what the policy does, which tools run in which order) on every commit, where an eval can only sample them.

```ts
import { isStepCount, ToolLoopAgent } from "ai";
import { MockLanguageModelV4 } from "ai/test";

const usage = { inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 5, text: 5, reasoning: undefined } };
const callStep = (id: string, toolName: string, input: object) => ({
  content: [{ type: "tool-call" as const, toolCallId: id, toolName, input: JSON.stringify(input) }],
  finishReason: { unified: "tool-calls" as const, raw: undefined }, usage, warnings: [],
});

test("a cancel waits for the user after the lookup", async () => {
  const model = new MockLanguageModelV4({
    doGenerate: [callStep("c1", "findOrder", { orderNumber: "1042" }), callStep("c2", "cancelOrder", { orderNumber: "1042" })],
  });
  const agent = new ToolLoopAgent({ model, tools: orderTools, stopWhen: isStepCount(6), toolApproval: { findOrder: "approved", cancelOrder: "user-approval" } });

  const result = await agent.generate({ prompt: "Cancel order 1042" });

  expect(result.steps.map((step) => step.toolCalls.map((call) => call.toolName))).toEqual([["findOrder"], ["cancelOrder"]]);
  expect(result.steps[1].content.map((part) => part.type)).toContain("tool-approval-request");
  expect(model.doGenerateCalls).toHaveLength(2); // stopped for the user; no third model call
});
```

`model.doGenerateCalls` holds every request the agent sent, so the same test can assert what the model was shown: a policy denial's reason in the next prompt, a note added by step preparation, the tool list unchanged between steps.
