---
name: effect
description: "Sets up a repository to use the Effect TypeScript library so agents learn it from the installed source, and migrates a codebase from Effect v3 to v4 from the generated migration reference. Use when adding Effect to a repo, writing Effect code in a repo that lacks the setup, or upgrading effect or any @effect/* package across the v3 to v4 boundary."
---

# Effect

Effect ships its own agent guide and its full source inside the installed package. Writing Effect code from memory, or guessing a v4 replacement for a v3 API, produces APIs that don't exist; reading what the installed package and the migration reference actually say doesn't.

| The job | Read |
|---|---|
| Installing Effect and pointing agents at its guide and source | [SETUP.md](SETUP.md) |
| Migrating v3 to v4: the checkouts, the lookup order, package changes, sub-agents, prohibitions, done condition | [MIGRATION-V3-TO-V4.md](MIGRATION-V3-TO-V4.md) |

## The rules

1. **Before writing any Effect code, read `node_modules/effect/AGENTS.md` completely** and follow its links when needed; for APIs it doesn't cover, search `node_modules/effect/src`.
2. **No invented APIs.** In a migration, every replacement traces to the migration reference, a topic guide or the v4 source.
3. **Never read `migration/v3-to-v4.md` whole** (about 17,000 lines, 350k tokens): search it and read the matched lines.
4. **No compatibility layer, no `any`, no `as`** to make migration errors disappear.
5. **Done means the project type-checks against v4;** test results are reported honestly but are not the gate.

## Prove it

Setup: `node_modules/effect/AGENTS.md` exists and the repo's agent instructions contain the Effect block. Migration: the type-check is clean, no `v3-compat` file, `any` or `as` cast was added for it, and the summary lists the type-check result, the test result (or why tests didn't run), every constructed replacement, and the gaps reported rather than bridged.
