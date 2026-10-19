# Rules

Each rule: what it looks like, why it costs, the fix. Examples are TypeScript-flavored; the rules hold in any language.

## Looks done but isn't

**Placeholder behind a confident name.** `async function syncInventory() { return true }`, a hard-coded list where a query belongs, `// TODO: implement` inside shipped code. The caller trusts the name. Implement it, or remove it and say it's not done.

**Swallowed errors and silent fallbacks.** `catch { return [] }`, `?? defaultConfig` papering over a value that should never be missing. The failure moves somewhere harder to find. Let it fail loudly, or handle the specific case and log enough to act on.

**Invented APIs.** A method, option, flag or endpoint that the library doesn't have. Check the installed version's types or docs before calling anything you haven't used in this codebase.

For imported packages, distinguish an unresolved local dependency from a nonexistent registry name. A successful registry lookup establishes that the name exists, not that it is the intended package; a failed network lookup is not evidence of nonexistence. Check the project's manifest and the package's actual purpose before treating the import as invented. [MrSpideyNihal/FixMySlop, fixmyslop/core/slop/rules_deps.py]

## Defense in the wrong places

**Generic catch that only logs.**
```ts
try { total = items.reduce((s, i) => s + i.price, 0) } catch (e) { console.error("error", e) }
```
Nothing here throws in a way the catch handles. Remove it; catch only where you can recover or add context, and catch the specific error.

**Impossible null checks.** Remove a redundant guard only where the actual contract establishes the invariant. A TypeScript non-null assertion is erased and does not validate a runtime value; keep validation at untrusted input boundaries and fix a misleading type. The old line treated a non-optional type as sufficient runtime proof. [TypeScript everyday types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html); [asyrafhussin/agent-skills, code-slop/rules/defensive-impossible-null.md]

**Missing real defenses.** These take systems down and are the ones usually absent:
- outbound HTTP with no timeout;
- retries with no backoff and jitter, or retrying non-idempotent calls;
- payment, order or message creation with no idempotency key;
- check-then-act on shared data with no lock, transaction or unique constraint;
- calls to rate-limited APIs with no limit handling;
- queues and workers with no bound or backpressure.
Add the one the code path needs, not all of them everywhere.

## Tests that can't fail

**Mock everything.** Every collaborator mocked, then asserting the mocks were called. The test passes whatever the code does. Use real objects or in-memory fakes for your own code; mock only the boundary (network, clock, payment provider). Assert on outcomes.

**"Doesn't throw."** `expect(() => run()).not.toThrow()` as the only assertion. Assert what `run()` produced or changed.

**Mirror of the implementation.** The test recomputes the expected value with the same formula as the code. If the formula is wrong, both agree. Use known literal inputs and outputs.

**Snapshot instead of behavior.** A snapshot of a whole component standing in for "the total shows the discount". Snapshots catch unintended change; behavior needs explicit assertions.

**Fixing a bug: the test comes first.** Write the failing test with the correct expected value, see it fail, then change the code. Never regenerate a test after the fix: it will happily ratify the buggy behavior.

**The check that a test can fail:** break the code it covers (flip a condition, return early). If the test still passes, it isn't a test.

## Over-engineering

**Interface with one implementation** and no second planned: `IUserRepository` with only `UserRepository`. Use the concrete type; extract an interface when the second implementation arrives.

**Single-method class.** `class PriceCalculator { calculate(items) { ... } }` instantiated to call one method. Make it a function.

**Wrapper called once** that only delegates: `function getUser(id) { return userService.getUser(id) }`. Call the real thing. The same goes for single-branch helpers and "layers that exist only to forward arguments": collapse them. [React Doctor, deslop]

**Single-use function** with its one caller next door: inline it at that call site, and "keep a named function only when the name itself is what makes the call site readable" [React Doctor, deslop]. That exception is the reason `refactoring` gives for extracting a function or naming a complex condition ([refactoring SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/refactoring/SKILL.md#techniques-smallest-first)), so the two rules agree.

**Dependency creep.** A new package for something the standard library or an installed dependency already does (a date library when `Intl` suffices, a second HTTP client). Use what's there.

**Options nobody uses.** Config flags, parameters and extension points for hypothetical futures. Delete them; add them when needed.

**Leftovers from earlier attempts.** Remove "all code not needed for the final solution that solves the requested behavior - dead branches, unused exports, speculative options, and scaffolding left over from earlier iterations" [React Doctor, deslop], within the code this change created or touched.

## Structure

**Spaghetti growth.** A new `if (isEnterprise && !legacyMode && region === "eu")` inside an unrelated flow. Give the special case its own function, policy or dispatch, or reshape the model so the branch disappears.

**Flag parameters.** `render(data, true, false)`. Split into two functions or pass a named option.

**Wrong layer.** Feature-specific logic in a shared utility, UI formatting in the data layer, business rules in a controller. Move it to the module that owns the concept.

**Duplicate helpers.** A new `formatCurrency` beside the existing one. Search by name and behavior first; reuse the canonical one.

The search, before writing and for every helper, type or constant the change touched or added [React Doctor, find-similar-functions]:
1. State the behavior you are about to implement in a few words.
2. Derive 3-6 queries from it: the proposed name; domain nouns (`symbol`, `path`, `file`, `route`, `token`, `config`); verbs (`parse`, `normalize`, `discover`, `scan`, `format`, `rank`, `score`, `resolve`, `validate`); "common abbreviations and synonyms, such as `btn` for `button` or `cfg` for `config`".
3. Search the narrowest useful root first, then broaden. No match on the precise name: search the noun and the verb separately. The utility may live outside `src/`: try library, package, app or test roots. Too many matches: "restrict `--kind` and reduce the root rather than skimming unrelated output".
4. Read every close match, with its nearby tests and call sites: "a near-name is not proof of duplication" [React Doctor, deslop].
5. **The reuse test:** an existing symbol is reusable when it "already handles the same input shape, side effects, error behavior, and return shape, or when a small extension would preserve its current contract". Prefer reusing, extending or moving it; create new code only after the search shows nothing fits.
6. Merging copies is the full move: one focused definition, "repoint every call site at it, and delete the duplicates and any now-dead imports" [React Doctor, deslop].
7. "Re-run the search afterward to confirm a single definition remains." [React Doctor, deslop]

The other view, not taken: React Doctor's deslop extracts the merged helper as "one function per file under `utils/`, per the repo convention". That is its repo's convention; here the file is named after the concept it implements, and a reflexive `*Util` is itself slop (see Names).

For Deslop structural matching, truffler symbol search and jscpd clone passes, use the canonical [duplication tool references](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/refactoring/DUPLICATION.md). The semantic reuse test above remains the decision rule. [ApparenceKit](https://apparencekit.dev/blog/deslop-duplicate-code-flutter/); [React Doctor, find-similar-functions]; [kucherenko/jscpd, jscpd; dry-refactoring]

**Deep nesting.** Four levels of `if`. Guard clauses and early returns.

**Size.** A change that pushes a file past about 1,000 lines, or a function past what fits on a screen, usually hides a missing split. Decompose by responsibility, not by line count.

**Needless sequencing.** Awaiting independent calls one by one. Run them together when that's also simpler.

## Types and style

- `as any`, `@ts-ignore`, `@ts-expect-error`, `!` non-null assertions to silence the checker: fix the type or narrow properly.
- Debug output in production paths: `console.log`, `print`, `var_dump`, `dd()`, leftover `debugger`.
- `if (x) return true; else return false;` -> `return x`. `const count: number = 0` -> `const count = 0`.
- Nested ternaries: "Avoid nested ternary operators - prefer switch statements or if/else chains for multiple conditions" [Anthropic, code-simplifier]. An `if / else if` chain on a type field goes further, to an exhaustive `switch` ([refactoring SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/refactoring/SKILL.md#techniques-smallest-first)).
- Magic numbers in logic with no name: name the constant where it's defined, with its unit.

## Names

- Placeholders: `data`, `result`, `info`, `temp`, `obj`, `item2`, `handleStuff`. Name what it holds or does: `unpaidInvoices`, `retryDelayMs`.
- Type in the name: `userObject`, `resultArray`, `stringData`. The type is in the type.
- Run-on names: `theCurrentlyLoggedInUserObject`. `currentUser`.
- Reflexive suffixes: `*Manager`, `*Helper`, `*Util`, `*Processor`, `*Service` on things that manage nothing. Name the responsibility.

## Comments

| Remove | Example |
|---|---|
| Narration of the next line | `// increment counter` above `count++` |
| Step lists | `// Step 1: validate`, `// Step 2: save` |
| Banners and emoji | `// ===== HELPERS =====`, `// 🚀 fast path` |
| Docblocks that repeat the signature | `@param price The price. @returns The total.` |
| End markers | `} // end if`, `# end of function` |
| Empty labels | `// main logic`, `// important!` |
| Vague TODOs | `// TODO: improve this` |
| Comment per trivial line | One per logical block at most |
| A paragraph for a one-line fact | Cut to the constraint, one or two lines |

Keep, short and in plain sentences: why the code does something non-obvious, constraints, workarounds and what they avoid, security and concurrency notes, protocol and API contracts, performance trade-offs, edge cases, licence and legal notices. Example worth keeping: `// The provider retries webhooks for up to 3 days; dedupe on event ID.`

## When it is not slop

Over-cleaning is its own damage. Leave these alone:
- **Null checks** at trust boundaries (request, queue, file, third-party returns), on partially built values, or wherever the runtime contract permits null. Use [the actual-contract rule](#defense-in-the-wrong-places), not a type-only test. The old summary asked only whether the type allowed null. [TypeScript everyday types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- **Short conventional names** in tiny scopes: `i`, `j` in a short loop, `x`, `y` for coordinates, `_` for ignored values, `acc` in a reduce, `req`, `res`, `next` where the framework uses them. Anything that lives past a few lines gets a real name.
- **Suffixes with a real convention:** `*Repository`, `*Controller`, `*Middleware`, `*Gateway` at an external boundary, `*Listener`, and `*Service` used sparingly for orchestration. `*Helper`, `*Manager`, `*Util`, `*Wrapper`, `*Processor` are the suspect ones.
- **Type words that carry meaning:** `userId` beside `user`, `itemCount`, `isPaid`, `hasShipping`, `usersByEmail`, wire-format types like `OrderPayload`.
- **Single-method classes** that hold injected dependencies (an invokable action or command with collaborators), and **wrappers** that add real behavior: retries, error normalization, metrics, a stable boundary over a vendor SDK.
- **An interface** that production code actually varies on. (One created only so a test can mock it is still slop: inject the concrete class with fakes instead.)
- **Type escape hatches** with a reason in a comment: wrong upstream types (`@ts-expect-error` with the issue link, never a bare `@ts-ignore`), a tracked migration, a generic the compiler can't prove.
- **Logging** in CLI and migration scripts meant to be verbose, in test files, or behind an explicit debug flag. Never raw debug output in production handlers, services or jobs.
- **Explicit annotations** on public API signatures, hard-to-read inferred types, and configuration objects (`as const`, `satisfies`); a spread that makes a needed copy.
- **"Doesn't throw" tests** that are a named regression test for a specific past crash, or a one-off smoke test on a public contract.
- **Mocks** at real boundaries: network, payment providers, rate-limited APIs, the clock, hard-to-trigger failures.
- **Snapshots** of large generated artifacts, public API shapes, or real visual regression, kept small and reviewed like code.
- **Explicit code over compact code.** Don't clean toward fewer lines: "Choose clarity over brevity". Avoid cleanups that "Create overly clever solutions", "Combine too many concerns into single functions or components", "Remove helpful abstractions that improve code organization", or "Prioritize 'fewer lines' over readability (e.g., nested ternaries, dense one-liners)". [Anthropic, code-simplifier]
- **Formatting and style** that matches the codebase. Never add fake `HACK` comments or deliberate inconsistency to make code "look human".
