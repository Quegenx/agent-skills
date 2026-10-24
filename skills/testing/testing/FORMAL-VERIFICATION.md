# Formal verification tied to current code

Use this to create or maintain a project-local verification skill for a costly promise that ordinary tests rarely reach. Sources: [new/skills, create-formal-verification-skill/SKILL.md, maintain-formal-verification-skill/SKILL.md and statechart/SKILL.md]. Model-checker claims below are checked against the official TLA+ documentation. Execution remains subject to the task's authorization; this guide does not authorize installing tools, running checks or changing product code. [owner AGENTS.md, Pause and confirm and Goal-Driven Execution]

## Choose the promise and tool

[new/skills, create-formal-verification-skill/SKILL.md]

- Start with the named bug or area; otherwise find a promise whose violation harms users and whose failing cases ordinary tests rarely reach. Choose from the code, rather than choosing the easiest demonstration.
- Let the question choose the cheapest suitable tool. Ordering and interleaving questions suit a small design model; the source prefers TLA+ for that job. Memory safety, overflow and data-structure invariants may suit a verifier operating on the actual code. When the language has no suitable verifier, say so and use generated inputs against the real code; do not call those tests a proof of a hand-written model.
- A finite bound is insufficient for a promise that must hold at every size; that question may need a proof. Name the chosen scope, assumptions and omitted behavior before interpreting a result.
- State the property and the harm in one plain sentence each. Take names from the repository, and link every model element to code a reviewer can open. An indivisible model action must correspond to an indivisible step in the code.

## Build a check that can expose the failure

[new/skills, create-formal-verification-skill/SKILL.md; statechart/SKILL.md]

- Preserve existing invariants when starting from an established model. To compare implementation behavior with it, model the actual code in a separate copy and check the unchanged agreed model with its authors' intended configuration.
- Tie variables, actions and guards to their implementation locations. Put the file and line of the code that enforces each guard beside that condition. A model that waits for a condition the code never checks can pass for the wrong reason.
- Include the state each property needs. Do not drop a rule because the initial model has no variable for it. If a rule applies only after autonomous work settles, make that condition explicit; the source uses `Settled == ~ENABLED System`, where `System` includes the autonomous actions. A rule about a narrower completion point needs that point's predicate instead.
- Demonstrate that each selected property detects its intended broken variant, such as a removed guard or reordered step, only within authorized verification. Remove the scratch break and re-establish the original result. Reuse the [mutation sensitivity rule](SKILL.md#the-rules), including its distinction for equivalent mutants.
- A failure remains a finding. Do not weaken the model or property to make current code pass, and do not turn verification maintenance into an unsolicited product fix.

## Read model-checker results within their scope

- TLC is an explicit-state checker for a supported subset of TLA+, especially finite systems. Record constants, bounds, assumptions and completion status; a completed selected model does not establish correctness of arbitrary system sizes or the implementation. [TLC model checker](https://docs.tlapl.us/using:tlc:start), [new/skills, create-formal-verification-skill/SKILL.md]
- An invariant is a state predicate required in every reachable state. A temporal property describes behavior; the behavior specification may include a fairness formula. Report the actual fairness assumptions rather than inferring eventual progress from a state chart. [TLA+ model overview](https://dl.tlapl.us/tlatoolbox/doc/model/overview-page.html)
- Default breadth-first model checking provides a shortest safety counterexample. Simulation does not examine all reachable states, and depth-first iterative deepening usually does not return a shortest trace. The supplied statechart help described broken-rule reruns as finding the shortest bug paths; its one-worker rerun applies to broken invariants, while temporal properties run separately. Do not extend that shortest-path claim to arbitrary temporal counterexamples. [TLC options](https://nightly.tlapl.us/doc/model/tlc-options-page.html), [new/skills, statechart/scripts/statechart-help.mjs and statechart/scripts/statechart.mjs]
- TLC's `-deadlock` flag disables deadlock checking and overrides the corresponding configuration entry. The supplied statechart wrapper passes it on every TLC call to allow resting systems, so its successful run does not establish deadlock freedom. [TLC CLI parameters](https://docs.tlapl.us/using:tlc:start), [new/skills, statechart/scripts/statechart.mjs]
- The supplied wrapper can exit zero when exactly the declared expected rules fail. It can also retain a real counterexample from a later-incomplete run while warning that other states may be missing. Read the rule results and completion warnings, not just the process exit code. [new/skills, statechart/scripts/statechart.mjs, statechart/scripts/lib.mjs and statechart/scripts/statechart-help.mjs]
- TLC stores 64-bit state fingerprints; its documentation describes collision estimates and reruns with another fingerprint function. Keep the actual checker evidence and limits instead of describing a pass as an unconditional mathematical proof. [TLC options](https://nightly.tlapl.us/doc/model/tlc-options-page.html)

## Explain the counterexample

[new/skills, statechart/SKILL.md and statechart/scripts/statechart-help.mjs]

- Label states and transitions with what the intended reader observes or cares about. Split a label when it hides a consequential difference or a step the reader needs to distinguish. Keep implementation detail available separately.
- A reduced overview must list the states and transitions it omits. Use the generated summary for counts; a projected chart is not the whole model or a proof of implementation equivalence.
- For an existential reachability question, the source deliberately checks an invariant saying the goal never happens and expects it to fail. Identify that declared failure as a goal path in the handoff, because the tool labels it as a bug. This demonstrates one path to the goal, not eventual arrival on every behavior.
- State charts show invariant violations; hand over a broken temporal property's own checker counterexample separately. Name known expected failures, newly found failures and model omissions separately.
- Replay a code model's story through real public entrances and assert observable outcomes, one model action at a time. Say which steps were executed and which were established only by source reading. If a step cannot occur in the real code, repair the model before treating the story as a product bug.
- When replay copies implementation that cannot be imported, record its commit, line range and omitted behavior. For a design with no implementation, explicitly identify the model trace as the evidence. The general [evidence boundary contract](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/debugging/VERIFICATION.md#compare-the-actual-fix) owns the wider claim limits.
- If an agreed chart comes first, give independently changing parts separate regions and show stop/restart events explicitly. After adding implementation guards and variables, take differences back to the behavior owner to decide whether the code or agreed behavior changes.

The source toolkit reads a restricted Mermaid subset and gives special meaning to `%% never` and `%% when`. Mermaid itself treats `%%` as comments and supports diagram forms the toolkit rejects. Treat those extensions as toolkit syntax, not native executable Mermaid semantics. Its executable toolkit is not bundled here; report an unavailable selected tool rather than inventing its commands or installing it implicitly. [Mermaid state diagrams](https://mermaid.js.org/syntax/stateDiagram.html), [new/skills, statechart/scripts/lib.mjs and statechart/SKILL.md; owner AGENTS.md, Prefer established dependencies]

## Record a reusable verification skill

[new/skills, create-formal-verification-skill/SKILL.md]

- Give the project skill frontmatter naming the area and its use conditions. Include real commands, paths and repository nouns, without placeholders.
- Record each property's covered files/functions, bounds, assumptions, reproducible tool version and one rerun command. Record the commit at which the verification was last confirmed to describe that code.
- Explain how to recognize a touched verification boundary, run its check, distinguish a modeling error from a product bug and update an intentional promise change. A skill that was never followed successfully is a draft; report the blocked prerequisite instead of implying execution.
- Hand over the property, tool and reason, bounds, findings in code terms, rerun command and gaps. A second target is useful only when another close candidate was actually found.

## Maintain the model after code changes

[new/skills, maintain-formal-verification-skill/SKILL.md]

1. Find the selected project verification skill and collect its property, code coverage, assumptions, bounds, command and sync commit. If the sync commit is absent, use the last verification-file change as the starting point and disclose that choice.
2. Within authorized execution, record the existing check before changing it. A pass still concerns the old description; it does not establish that the description matches current code.
3. Read changes since the sync point, including moved or split functions and new writers of guarded state. Distinguish no semantic effect, representation drift, an intentionally changed promise supported by code/tests/docs/change evidence, and a possible broken promise.
4. Update the verification from current code before rerunning. Preserve actual atomicity. Change a property only with evidence of the intended promise change, recording old and new wording. Retain bounds unless they became wrong; disclose any reduction.
5. Recheck sensitivity to the relevant broken variant after a pass. On failure, replay against real code and distinguish an impossible model step from an actual bug. Report the harm and introducing commit when established; keep runtime reproduction separate from source-only evidence.
6. Update coverage, commands, assumptions and the sync commit only for a check confirmed against that revision. Do not advance a blocked check. Follow the maintained skill as its next user would, within authorization, and keep verification updates separate from product fixes.

Report `in sync`, `updated`, `bug` or `blocked` per check. `updated` and `bug` can coexist. Include commits read, changes and their reasons, actual results, sensitivity evidence, counterexamples and gaps. If a stale check passed before correction and fails afterward, say that the old pass described stale behavior. [new/skills, maintain-formal-verification-skill/SKILL.md]

## Prove it

Each selected property names its code, actual atomicity, assumptions and bounds; sensitivity evidence distinguishes an observed check from a draft; counterexamples identify model-only, source-read and executed steps; expected failures and incomplete checks stay visible; the sync point advances only after current-code confirmation; and the report does not claim deadlock, liveness or implementation correctness beyond the check performed. [new/skills, create-formal-verification-skill/SKILL.md, maintain-formal-verification-skill/SKILL.md and statechart/SKILL.md; TLC model overview and options]
