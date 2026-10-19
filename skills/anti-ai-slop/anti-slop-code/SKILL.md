---
name: anti-slop-code
description: "Removes AI code slop (narrating comments, bloated names, needless wrappers, misplaced error handling) without changing behavior. Use when cleaning up or reviewing agent-written code."
---

# Anti-slop code

The cost of writing code collapsed; the cost of reading it didn't. Code that's slow to understand is slop even when it works. Load `anti-slop` for the shared rules (do what was asked, verify before claiming). The rule catalogue with examples is [RULES.md](RULES.md).

Rules tagged in RULES.md come from: Anthropic's [code-simplifier](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/code-simplifier/agents/code-simplifier.md) agent (Apache-2.0), tagged [Anthropic, code-simplifier]; React Doctor's `deslop` skill, which is that agent's text with additions (indirection, inlining single-use functions, leftover scaffolding, consolidating duplicates with truffler), tagged [React Doctor, deslop] for the additions only; and React Doctor's `find-similar-functions`, which comes from the [truffler](https://github.com/rayhanadev/truffler) repo (MIT), tagged [React Doctor, find-similar-functions]. React Doctor's `deslop` is not Nimblesite's Deslop duplicate finder; the [duplication reference](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/refactoring/DUPLICATION.md#deslop) tells the two apart.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Review or remove code slop without changing behavior | [RULES.md](RULES.md) |
| Use FixMySlop when selected, with its rule controls, baseline and source-version limits | [FIXMYSLOP.md](FIXMYSLOP.md) |
| Select Deslop, truffler or jscpd for duplication and reuse evidence | [Duplication tools](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/refactoring/DUPLICATION.md) |

## Guardrails

- **Behavior stays the same** unless you're fixing a clear bug, and then you say so. A cleanup that changes behavior is a new bug.
- **Scope:** the diff against the main branch when reviewing a branch; the named files when given; otherwise ask, or start with the most recently changed files. The other view, not taken: code-simplifier and deslop end with "You operate autonomously and proactively, refining code immediately after it's written or modified without requiring explicit requests" [Anthropic, code-simplifier]. Here a cleanup runs when asked, on the scope above.
- **Match the codebase,** not your taste: its naming, error handling, comment density and test style. Something is slop when it's inconsistent with the surrounding code or adds reading cost for nothing, not when it differs from what you'd write.
- **Minimal, focused edits.** Remove the slop; don't rewrite working code around it. Comment-only cleanups touch comments only.
- **Run the tests and the type checker** before and after. Report what you ran and the result.

## What to look for

In order of damage (details and examples in [RULES.md](RULES.md)):
1. **Looks done but isn't:** placeholder logic behind a confident name, mocked or hard-coded data in a real path, `// TODO: implement`, swallowed errors, silent fallbacks that hide a broken invariant, calls to functions or APIs that don't exist.
2. **Defense in the wrong places:** generic try/catch that only logs, guards redundant under an established runtime contract (see [Impossible null checks](RULES.md#defense-in-the-wrong-places)), while external calls have no timeout, retries no backoff, payments no idempotency key, shared state no lock or unique constraint. [TypeScript everyday types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
3. **Tests that can't fail:** everything mocked, "doesn't throw" assertions, tests that re-compute the implementation, snapshots in place of behavior.
4. **Over-engineering:** interfaces with one implementation and no second planned, classes wrapping one function, wrappers called once that only delegate, single-use functions that a name doesn't make clearer, leftover scaffolding and unused exports, new dependencies for what an existing one or the standard library does, config and options nobody uses.
5. **Structure:** spaghetti growth (one-off conditionals in unrelated flows, flag parameters, special cases inside busy functions), logic in the wrong layer, duplicated helpers (search with 3-6 queries, reuse only what passes the four-part test, then re-search), files pushed past a healthy size, deep nesting that early returns would flatten.
6. **Types and style:** `as any`, `@ts-ignore` and casts to silence the checker, debug output left in (`console.log`, `print`, `dd()`), `if (x) return true; else return false`, nested ternaries, redundant annotations on obvious literals.
7. **Names:** placeholders (`data`, `result`, `info`, `temp`, `item2`), type-in-name (`userObject`, `resultArray`), run-on names, reflexive `*Manager` / `*Helper` / `*Util` / `*Service` suffixes.
8. **Comments:** narration of the next line, step-by-step "Step 1/2/3", decorative banners and emoji, docblocks that repeat the signature, end-of-block markers, vague TODOs, and paragraph-long comments for a one-line fact.

Keep comments that explain why: business rules, constraints, workarounds and the bug they avoid, security, concurrency, protocol details, performance trade-offs, edge cases, legal notices.

## The structural review (when asked for a strict or deep review)

Don't stop at local polish. For each meaningful change ask: is there a reframing that makes whole branches, helpers, modes or layers disappear? Prefer deleting complexity to moving it around. Flag, as presumptive blockers unless justified: a file crossing about 1,000 lines because of the change; ad-hoc branches bolted onto an existing flow; feature logic leaking into shared code; a new helper duplicating a canonical one; an abstraction that adds indirection without clarity; casts and optionality that hide the real contract; independent work serialized for no reason; updates that can leave state half-applied. Fewer, high-conviction findings beat a long list of nits. Be direct and specific, not rude: "this adds another special case to an already busy flow; can it live behind its own function?"

## Reviewing code an agent wrote

The fundamentals are the review checklist, whoever typed the code: does this rule belong in the domain model, or is it a copy in a handler? Will this change break an existing API client? What happens when this network call fails: is there a timeout, a bounded retry, an idempotency key, an outbox for the message? The agent changes how fast the code appears, not what makes it correct.

**Before "does it work", ask "should it exist".** When building is cheap, code arrives from everyone (engineers, agents, designers, PMs, marketing, sales), and checking that it runs is the easy part. For a new feature, screen, setting or flow:
- **The need:** who asked for it, and what evidence says users need it (a request, a ticket, a metric), not only that it could be built.
- **What already exists:** search for the feature, component or flow that already covers part of it. Estimate how far the new feature is needed against refactoring what already exists. Extending or refactoring that beats a second way to do the same thing; two date pickers, two settings pages or two ways to share are a UX problem every user pays for.
- **What it touches:** open the change running (a preview deployment of the branch), use it, and walk the screens and shared components it changed, not only the new one. Check it matches the patterns around it.
- **The verdict can be "don't ship":** not needed, or fold it into what exists. Saying so is part of the review, not a failure of it.

**Asking a model for a bug review,** keep it to blockers with evidence:
```
Review the diff on this branch against main.
List only problems you'd block the merge for. For each one, give the file and line, why it's wrong, and how to show it fails.
```
Review instructions for a repo (a `REVIEW.md` written by its code owners) work when they are short: they say what failure looks like there (for docs it's "it lies", for config it's "it misroutes"), cap the nits, list paths to skip, and ask for a file and line as evidence instead of a guess from a name. **When the reviewer keeps flagging the same thing, fix it at the source:** in the skill, with a lint rule, or in the instruction files the reviewer loads.

## Output

**Cleanup:** the diff, then one to three sentences: what was removed, that behavior is unchanged, and the test and type-check results.

**After a duplicate search** that shaped the change, say what you found and whether you reused something or added new code [React Doctor, find-similar-functions]:
```markdown
I checked for existing symbols with `truffler` using queries like `normalize`, `path`, and `resolve`. The closest match was `normalizePath` in `src/files.ts`, so I reused that behavior instead of adding a separate helper.
```
```markdown
I searched with `truffler` for `parse`, `config`, and `loadConfig` across `src/`; the matches were unrelated, so I added a new helper in the nearest module.
```

**Review:** start with a count of findings, and say plainly when there's nothing to fix. Then findings most damaging first, one per root cause, each with `file:line` (read, not guessed from a name), the problem, why it costs (a reader, a failure mode, a maintenance burden) and the concrete fix. Use [P0 to P3 severity](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/REVIEWER.md#tags-and-output), and record **Pre-existing** separately as a [status by cause](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/CHANGE-SCOPE.md#status-by-cause), so a bug the change didn't introduce doesn't look like the author's fault. The old output mixed **Important**, **Nit** and **Pre-existing** as alternative tags; impact and origin are separate. Name the class of bug, so the author fixes every instance, not one line. End with a per-file verdict:

| File | Verdict | Main findings | Action |
|---|---|---|---|

Verdicts: **clean**, **minor** (a few local fixes), **inflated** (works but verbose; cleanup recommended), **unneeded** (works, but no evidence anyone needs it, or it duplicates what exists; fold in or drop), **blocker** (looks done but isn't, missing real defenses, or a structural regression; fix before merge). Never mark clean what you didn't read.
