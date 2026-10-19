---
name: testing
description: "Writes tests that catch real bugs, from unit tests to integration tests on real Postgres, architecture tests, test-first behavior slices and interactive terminal harnesses. Use when writing or reviewing tests, setting up a test database, or investigating an interactive CLI or TUI."
---

# Testing

A test is worth what it would catch. Imagine the plausible broken versions of the code (a `<` that should be `<=`, a dropped rule, swapped operands, a missing reset, an unrounded cent) and make sure at least one test fails for each. A suite that only checks the happy path passes against almost all of them. Read the catalog for the kind of code under test:

| The code under test | Read |
|---|---|
| Thresholds, formulas, parsers, text, dates, money, comparators, state machines, time-based and stateful code, delays and timeouts, orchestration | [CATALOG.md](CATALOG.md) |
| The shape of the suite, integration tests against real Postgres in containers, data isolation, async workflows across modules, architecture and contract tests, end-to-end tests (writing and running them in a browser or on a device is the `e2e-testing` skill) | [INTEGRATION.md](INTEGRATION.md) |
| Creating or evaluating a lint rule or detector, including its contract, fixtures, real-code labels, fuzzing and paired comparisons | [lint-rule-authoring](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/lint-rule-authoring/SKILL.md) |
| Authorized test-first development: one public behavior slice, the intended failing check, minimal implementation and existing persistence/callback exceptions | [TDD.md](TDD.md) |
| An interactive CLI or TUI: reuse its harness, capture before acting, deterministic prompt waits, transcripts, inspector environment and profile evidence | [CLI-HARNESS.md](CLI-HARNESS.md) |

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

## The rules

1. **Green on correct code first.** A test that's wrong about correct behavior is a bug. Work each expected value out by hand from the contract, not by running the code and pasting its output, and leave the arithmetic in a comment (`// 3000 + 599 shipping`) so a failure explains itself.
2. **Aim at failure modes, not lines.** List what could go wrong (each rule dropped, each comparison off by one, each branch swapped) and write a test that fails for each. Coverage measures what ran, not what was checked.
3. **Partition the contract.** Split inputs into the classes the rules treat differently (plain, empty, quoted, malformed; below, inside, above) and give each class its own test, so a failure points at one cause.
4. **Boundaries from both sides.** For every cutoff test the value exactly at it and the value one step on the other side. Bugs live at 89 and 90, not at 95. Pin whether each end is inclusive or exclusive, and try a degenerate range (min equals max).
5. **One variable at a time for negatives.** Start from an input that satisfies every rule, break exactly one, assert rejection. A test that breaks two rules can't tell you that one of them disappeared. The length boundary is 7 for an 8-character minimum, not 6.
6. **Isolate independent parts.** One input can't separate a wrong offset from a wrong scale: use one where the scaled part is zero and one where it dominates. Put the winning value in every argument position. Use non-commutative operations (`10 3 -`) where swapped operands would hide.
7. **Make rounding and order visible.** Round numbers never exercise a rounding step: pick amounts that leave a fraction of a cent. Rule order only shows when the two orders give different totals; if both orders agree for your fixture, it proves nothing about order.
8. **Assert the whole outcome.** Compare the complete result (every field, every element, the full date and time, both balances), not a count or a status alone. Arrays and objects compare by identity with `===`; use `toEqual` or assert length plus each index.
9. **Error paths are half the contract.** Assert the exact error type or tagged error (`toThrow(RangeError)`, a `_tag`), and for a refusal also assert that nothing changed: snapshot the state before the call and compare after.
10. **Never sleep.** Inject a clock (or pass `now` in) and move it explicitly; start it at a fixed date so nothing agrees with the wall clock by accident. Fresh state and a fresh clock per test.
11. **One behavior per test, named for it.** Arrange, act, assert, with the act as one visible step. Several assertions are fine when they describe one outcome; two unrelated behaviors are two tests. Name the scenario and the expected result (`cancel: a shipped order is refused`), one convention per project, so a failure reads as a sentence.
12. **Test behavior through the public surface, not implementation.** A test that asserts a repository method was called breaks on a rename and stays green when the save is missing. Assert the returned result and the observable state; record calls only where calling is the behavior (below).
13. **Mock only boundaries you don't own** (payment and email providers, third-party APIs, the clock); never mock domain objects, test them directly. Many mocks for one unit means it has too many dependencies. Don't unit test the framework, the ORM's mapping, middleware or plain data types; integration tests cover them ([INTEGRATION.md](INTEGRATION.md)).
14. **Build test data with factories that default everything** (`aCustomer({ vip: true })`), so a new required field changes one function instead of every test, and the test shows only the values that matter. Use `test.each` for a table of cases instead of copied tests, and keep test files mirroring the source tree.
15. **Check the suite against broken code.** Run a mutation tool (StrykerJS for TypeScript) or plant the bugs by hand, one at a time, and inspect survivors. An equivalent mutant has the same observable behavior and cannot be killed by a test; classify it before claiming a missing test or weak assertion. The old line called every survivor a test gap; the source's clamp comparison change also leaves the endpoint result unchanged. [Stryker: Equivalent mutants](https://stryker-mutator.io/docs/mutation-testing-elements/equivalent-mutants), [katabench, coding-exercises/test-writing/clamp-tests.md]
16. **Reproduce a bug before fixing it, and test against a simple reference.** Run the reproducer before editing, and check that the new test would have caught the original bug and fails on half-finished fixes. A reference must be [independent of the producer being checked](INTEGRATION.md#independent-evidence); two wrappers around one faulty decoder are not two correctness oracles. [morluto/rea, rea-analysis-optimization/SKILL.md] Where a reference exists (a separate brute-force solver, a reference that never compacts), test on random inputs against it; for code with many hidden edge cases, like an HTML sanitizer, add a standard XSS test suite and a random-document fuzzer.

## Fakes for code that orchestrates

A stub answers questions; a recording fake also remembers what it was told. When the code's job is to call collaborators in the right order with the right arguments, return values can't show it.

```ts
type Call = { to: "payments" | "orders" | "receipts"; op: string; args: unknown[] };

function fakes(opts: { approve: boolean; existing?: string[]; receiptFails?: boolean }) {
  const log: Call[] = [];                                   // one log shared by every fake: order across collaborators
  const existing = new Set(opts.existing ?? []);
  return {
    log,
    payments: { charge: (id: string, cents: number) => { log.push({ to: "payments", op: "charge", args: [id, cents] }); return opts.approve; } },
    orders: {
      exists: (id: string) => existing.has(id),            // a query: not recorded, the code may ask it any time
      save: (id: string, cents: number) => { log.push({ to: "orders", op: "save", args: [id, cents] }); },
    },
    receipts: { send: (id: string) => { log.push({ to: "receipts", op: "send", args: [id] }); if (opts.receiptFails) throw new Error("mail down"); } },
  };
}

test("an approved order is charged, then saved, then receipted", () => {
  const f = fakes({ approve: true });
  expect(placeOrder(f, "A-100", 2599)).toBe("placed");    // 2599, not 2500: a cents/units bug changes it
  expect(f.log).toEqual([
    { to: "payments", op: "charge", args: ["A-100", 2599] },
    { to: "orders", op: "save", args: ["A-100", 2599] },
    { to: "receipts", op: "send", args: ["A-100"] },
  ]);
});
```

- Record **commands** and leave **queries** out, so the test doesn't pin how often the code asks.
- Assert what must **not** happen: a duplicate order is never charged again, a declined payment saves nothing and sends nothing.
- Inject the failure the contract tolerates (the receipt throws) and assert the stated recovery and the calls already made.
- **Count callback invocations** whenever a `false` or a rejection can mean two things: a circuit breaker that rejects without calling and one that called and failed return the same value.
- Write fakes as small classes or objects you own; reach for a mocking library's `vi.fn()` when you only need call capture, not behavior.

## Prove it

Plant the plausible behavior-changing bugs one at a time (or run a mutation tool) and show the suite fails for each, while staying green on the correct code; classify equivalent survivors using [rule 15](#the-rules). For every boundary in the contract, point to the test on each side of it. For a bug fix, show the new test red on the unfixed code and green on the fix; for an intermittent one, repeat both (red 20 of 20 runs on main, green 20 of 20 on the branch).
