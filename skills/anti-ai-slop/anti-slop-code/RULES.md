# Rules

Each rule: what it looks like, why it costs, the fix. Examples are TypeScript-flavored; the rules hold in any language.

## Looks done but isn't

**Placeholder behind a confident name.** `async function syncInventory() { return true }`, a hard-coded list where a query belongs, `// TODO: implement` inside shipped code. The caller trusts the name. Implement it, or remove it and say it's not done.

**Swallowed errors and silent fallbacks.** `catch { return [] }`, `?? defaultConfig` papering over a value that should never be missing. The failure moves somewhere harder to find. Let it fail loudly, or handle the specific case and log enough to act on.

**Invented APIs.** A method, option, flag or endpoint that the library doesn't have. Check the installed version's types or docs before calling anything you haven't used in this codebase.

## Defense in the wrong places

**Generic catch that only logs.**
```ts
try { total = items.reduce((s, i) => s + i.price, 0) } catch (e) { console.error("error", e) }
```
Nothing here throws in a way the catch handles. Remove it; catch only where you can recover or add context, and catch the specific error.

**Impossible null checks.** `if (!user) return` right after a line that guarantees `user`, or on a non-optional typed parameter. Trust the type; if the type is wrong, fix the type.

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

**Wrapper called once** that only delegates: `function getUser(id) { return userService.getUser(id) }`. Call the real thing.

**Dependency creep.** A new package for something the standard library or an installed dependency already does (a date library when `Intl` suffices, a second HTTP client). Use what's there.

**Options nobody uses.** Config flags, parameters and extension points for hypothetical futures. Delete them; add them when needed.

## Structure

**Spaghetti growth.** A new `if (isEnterprise && !legacyMode && region === "eu")` inside an unrelated flow. Give the special case its own function, policy or dispatch, or reshape the model so the branch disappears.

**Flag parameters.** `render(data, true, false)`. Split into two functions or pass a named option.

**Wrong layer.** Feature-specific logic in a shared utility, UI formatting in the data layer, business rules in a controller. Move it to the module that owns the concept.

**Duplicate helpers.** A new `formatCurrency` beside the existing one. Search by name and behavior first; reuse the canonical one.

A tool for the search step: [Deslop](https://apparencekit.dev/blog/deslop-duplicate-code-flutter/) (https://github.com/Nimblesite/Deslop) parses code into a tree-sitter AST for Dart, C#, Rust, Python, JavaScript, TypeScript/TSX, PHP, F# and Go, "No source-level regex touches this pipeline", so renamed copies match:

```dart
String formatUserLabel(User u) => '${u.firstName} ${u.lastName}';

String buildAuthorName(Author a) => '${a.firstName} ${a.lastName}';
```

Three scores fuse into one; pairs must cross `FUSED_THRESHOLD` 0.85 and group by transitive closure; clusters rank by `weight = clone_node_count × (cluster_size − 1) × log2(1 + spanned_bytes)`. Run `deslop .` (install `brew install nimblesite/tap/deslop`); reports land in `.deslop/` (git-ignore it). Exclude generated code in `.deslop.toml` (`exclude` skips files, `report_hide` counts them but hides them):

```toml
[defaults]
exclude = ["**/build/**", "**/.dart_tool/**"]
report_hide = ["**/*.g.dart", "**/*.freezed.dart", "**/*.gr.dart"]

[threshold]
max_duplication_percent = 5.0
```

For an agent, its MCP server's `find-similar` belongs in the write loop: call it before writing a function and reuse what is close (`claude mcp add deslop -s user -- deslop-mcp --root .`). Limits: it finds and does not fix, and lookalikes can mean different things ("A price formatter and a weight formatter share every line and must stay apart"); on a first run take the top ten by weight and ignore the tail. The CI gate is in the `code-review` skill's LAYERS.md.

**Deep nesting.** Four levels of `if`. Guard clauses and early returns.

**Size.** A change that pushes a file past about 1,000 lines, or a function past what fits on a screen, usually hides a missing split. Decompose by responsibility, not by line count.

**Needless sequencing.** Awaiting independent calls one by one. Run them together when that's also simpler.

## Types and style

- `as any`, `@ts-ignore`, `@ts-expect-error`, `!` non-null assertions to silence the checker: fix the type or narrow properly.
- Debug output in production paths: `console.log`, `print`, `var_dump`, `dd()`, leftover `debugger`.
- `if (x) return true; else return false;` -> `return x`. `const count: number = 0` -> `const count = 0`.
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
- **Null checks** where the type really allows null, at trust boundaries (request, queue, file, third-party returns), or on partially built values. The test: does the type say it can be null?
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
- **Formatting and style** that matches the codebase. Never add fake `HACK` comments or deliberate inconsistency to make code "look human".
