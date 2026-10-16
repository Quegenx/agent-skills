# Migrating Effect v3 to v4

Drive the migration from the generated migration reference that ships in the Effect repo. Every rename, removal and signature change is answered by that data; don't guess replacements.

## The workflow

1. **Set up and validate two local checkouts** (below).
2. **Read `MIGRATION.md`** and list `.repos/effect/migration/` for the background and the guide index.
3. **Migrate `package.json` first:** remove the consolidated packages and align every remaining Effect package on one v4 version. Done later, the first type-check drowns in unresolved imports from packages that no longer exist.
4. **Run the project's type-check** (for example `tsc --noEmit`) for the initial error inventory.
5. **Iterate until it's clean:** for each error, look the symbol up in `migration/v3-to-v4.md`, escalate per the reading order, fix the call site, and hand per-file fixes to sub-agents. Never silence an error instead of resolving it.
6. **Finish:** type-check clean; run the tests and report their outcome honestly; write the summary.

## Local checkouts

Two shallow, single-branch clones of the canonical repo:

```sh
git clone --depth 1 --single-branch https://github.com/Effect-TS/effect .repos/effect
git clone --depth 1 --single-branch --branch v3 https://github.com/Effect-TS/effect .repos/effect-v3
```

- **`.repos/effect`** is v4 (`main`): `MIGRATION.md`, the `migration/` guides and the v4 source.
- **`.repos/effect-v3`** is the `v3` branch, for old semantics only when needed.
- **Each clone is re-runnable and deletable on its own.** Don't share one clone between branches with `git worktree`.

**Validate an existing `.repos/effect` before trusting it.** Older setup instructions cloned the superseded `Effect-TS/effect-smol` repo, which is stale and has no `migration/v3-to-v4.md`:

```sh
git -C .repos/effect remote get-url origin   # must be the canonical Effect-TS/effect repo
node -p "require('./.repos/effect/packages/effect/package.json').version"   # must be 4.x
```

If the origin is `effect-smol` or the version isn't `4.x`, delete the directory and clone again.

## Reading order

1. **`MIGRATION.md` once,** at the start (`.repos/effect/MIGRATION.md`).
2. **`migration/v3-to-v4.md` first for every API,** searched, never read whole.
3. **A topic guide** (`.repos/effect/migration/*.md`) when the mapping means a rewrite rather than a rename: `Context.Tag` to `Context.Service` is a structural change, not a symbol swap. Open them on demand from the `MIGRATION.md` index.
4. **The v4 source** (`.repos/effect/packages/*/src/`) to confirm a replacement's real signature before coding against it.
5. **The v3 source** (`.repos/effect-v3`) only when unsure about the old semantics.

## Searching the reference

**The most important rule:** `migration/v3-to-v4.md` is about 17,000 lines and 350k tokens; reading it in one pass blows the context window and the migration with it. Search it and read only the matches with their context.

It has four sections: **Import Map**, **No Counterpart Imports**, **Removed Modules** and **API Reference** (one `` ### `<v3 module path>` `` heading per module). Entries are one-liners, `` - `Old.symbol` -> `New.symbol`: <rationale> ``, and removals are explicit `` -> `none` `` entries with a stated alternative.

```sh
# Look up a specific v3 symbol
rg -n 'AnthropicTokenizer\.layer' .repos/effect/migration/v3-to-v4.md

# Read a whole module's section via its heading
rg -n -A 40 '^### `@effect/platform/FileSystem`' .repos/effect/migration/v3-to-v4.md

# Resolve a v3 import path in the Import Map
rg -n '^@effect/platform/FileSystem ' .repos/effect/migration/v3-to-v4.md

# List every module section for a package
rg -n '^### `@effect/cluster/' .repos/effect/migration/v3-to-v4.md
```

Look APIs up as you meet them, one search at a time. A miss in the Import Map isn't a dead end: check **Removed Modules** and **No Counterpart Imports** before concluding anything.

## Repo-level changes

Per-API lookup alone still leaves a broken `package.json`. Handle these once, up front:

- **Package consolidation:** `@effect/platform`, `@effect/rpc`, `@effect/cluster` and others merged into the core `effect` package. Remove them from `package.json` and rewrite their imports per the Import Map. Packages that stay separate (`@effect/platform-*`, `@effect/sql-*`, `@effect/ai-*`, `@effect/opentelemetry`, `@effect/atom-*`, `@effect/vitest`, and others) remain dependencies. The consolidated v3 packages (including `@effect/sql` and `@effect/cli`) still have npm `latest` tags pointing at `0.x`: remove them rather than bumping everything to `latest`.
- **One version for everything:** target the current stable `latest` 4.x release. In v4 all ecosystem packages share one version number, so every remaining `effect` and `@effect/*` dependency uses that same version.
- **Module paths and stability:** stable imports use paths such as `effect/http`, `effect/rpc` and `effect/ai/LanguageModel`. Stability is a JSDoc tag, not a path segment: `@stability unstable` APIs may break in minor releases, `@stability experimental` ones in patch releases. Code that targeted a beta or RC with `effect/unstable/<module>` imports drops the `unstable` segment (`effect/unstable/http` becomes `effect/http`); there are no compatibility exports for the old paths, and moving a module doesn't make its API stable.

## Sub-agents

Per-file migration is context-hungry; do it in sub-agents so the main session's context lasts the whole migration.

- **One sub-agent per file (or module),** given the specific v3 symbols to resolve there.
- **It returns the edit and the mappings it used;** the main session keeps the error inventory and the running summary.
- **Sub-agents follow the same reading order, search recipes and prohibitions,** and never read the reference whole either: a blown sub-agent context still costs that file.

## Prohibitions

- **Never reintroduce a v3-shaped compatibility layer.** A `v3-compat.ts` that re-exports old names makes the errors vanish and freezes the codebase between versions. Migrate the call sites.
- **No `any`, no `as` casts** to silence a post-migration type error: it usually means the replacement has a different shape, and the cast deletes that information. Go back to the reference or the v4 source.
- **No invented APIs.** Every replacement traces to the reference, a topic guide or the v4 source.

## Done

**The project type-checks against v4.** The migration is a type-level exercise: unresolved imports and changed signatures surface there and nowhere else. Run the type-check until it's clean.

Running the tests is recommended and their outcome must be reported honestly, but it isn't the gate: a repo mid-migration often has tests that can't run for unrelated reasons. Don't weaken tests to make them pass.

## Prove it

The final summary states the type-check result, the test result (or why tests weren't run), every constructed replacement, and every gap reported rather than bridged.
