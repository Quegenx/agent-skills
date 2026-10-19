# Deep modules and their interfaces

Matt Pocock's codebase-design defines depth by the capability a caller gains from a small interface, and improve-codebase-architecture uses that vocabulary to find useful refactors. This is a design lens alongside the existing dependency and responsibility rules, not a requirement to rename every established architectural term. [mattpocock/skills, codebase-design/SKILL.md, improve-codebase-architecture/SKILL.md]

## Vocabulary and deletion test

[mattpocock/skills, codebase-design/SKILL.md]

- A **module** has an interface and an implementation, at any scale. The **implementation** is its internal code. Its **interface** is the caller-facing surface, including what a caller must know: types, invariants, ordering, errors, configuration and performance constraints.
- A **deep module** gives substantial behavior through a small interface. **Leverage** describes what callers gain; **locality** describes how knowledge, fixes and verification concentrate for maintainers. Counting implementation lines is not the measure of depth.
- A **seam** is a place where behavior can vary without editing that place; an **adapter** describes the role of satisfying an interface there, regardless of how large its own implementation is. Internal seams can remain private even when tests use them.
- Apply the deletion test: if removing a module removes complexity, it may be a pass-through; if the complexity returns across callers, it was doing useful work. Ask whether fewer operations or simpler parameters can hide more implementation without weakening the contract.

## Choose where to deepen

[mattpocock/skills, improve-codebase-architecture/SKILL.md]

- Start with the area the user named, or recent change hotspots when no area was named. Read its glossary and decisions before proposing changes that reopen them.
- Look for one concept spread over many small modules, interfaces as complicated as their implementations, tightly coupled modules leaking knowledge, and real bugs that tests of extracted helpers cannot reach.
- Show candidates before designing their replacement interfaces: affected files, problem, proposed consolidation, benefits to locality/testability, before/after relationships and recommendation confidence. Every diagram edge still needs source evidence, as in [software-architecture](https://github.com/Quegenx/agent-skills/blob/main/skills/architecture/software-architecture/SKILL.md#drawing-it-c4).
- Surface an ADR conflict only when observed friction justifies revisiting it. Let the user select the candidate; do not turn a survey into an unsolicited refactor.

## Dependencies and test surfaces

[mattpocock/skills, codebase-design/DEEPENING.md]

| Dependency | Source strategy |
|---|---|
| Pure in-process computation or state | Consolidate and exercise the public interface directly |
| A dependency with a local stand-in | Test the module with that stand-in, keeping the seam internal |
| Remote service the project owns | Put a port at the seam; production transport and a test adapter satisfy it |
| External service the project does not control | Inject the external port and substitute a boundary adapter for tests |

The source offers PGlite as a local Postgres stand-in. This repository's existing [integration rule](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/testing/INTEGRATION.md#integration-tests-against-real-infrastructure) prefers the real engine. Keep that rule; choose a substitute only for the behavior it actually models. [PGlite's official implementation](https://github.com/electric-sql/pglite/blob/main/packages/pglite/src/pglite.ts) uses single-user mode with background and parallel workers disabled, so it cannot establish production multi-connection behavior. Embedded Postgres still has SQL constraints; the generic in-memory warning must not be extended into a claim that it has none.

The source's two-adapter test makes a seam earn its indirection: identify the actual variation, typically production and test, rather than create a port for an imagined future. Dependency ownership and wiring remain in [DEPENDENCIES.md](DEPENDENCIES.md); injection remains in [SKILL.md](SKILL.md#techniques-smallest-first). [mattpocock/skills, codebase-design/DEEPENING.md]

Tests should observe the new interface's behavior and survive internal changes. The source recommends replacing obsolete shallow-unit tests with interface tests. Delete only tests whose behavior is actually covered at the replacement surface; preserve the repository's existing integration observations and contract-driven recording-fake rules. [mattpocock/skills, codebase-design/DEEPENING.md] [testing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/testing/SKILL.md#the-rules)

## Design alternatives

[mattpocock/skills, codebase-design/DESIGN-IT-TWICE.md]

- State the constraints and dependency categories before proposing an interface. Supply the domain glossary and relevant code evidence to each independent design brief.
- Ask for meaningfully different interfaces: a minimal caller surface, broader flexibility, the common caller's simplest path, or a ports/adapters design when the dependencies warrant it.
- Compare operations/types, invariants, ordering, errors, usage, hidden implementation and dependency strategy. Judge depth, locality and seam placement, then recommend a design or an explicitly reasoned combination.
- The source uses three or more parallel designers as its exploration pattern. Apply the existing [workflow cost and scope rules](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-harness/WORKFLOWS.md#cost-and-stopping); the number is an optional source technique, not a mandatory panel for every module.

## Prove it

[mattpocock/skills, codebase-design/SKILL.md, codebase-design/DEEPENING.md, codebase-design/DESIGN-IT-TWICE.md]

Name what complexity each proposed interface hides, where the deletion test moves it, which dependency justifies each adapter, and what the tests observe across the public surface. Alternatives must differ in interface choices rather than names alone. A replacement test must reach the behavior before its predecessor is removed.
