# Inventory integrity and player release history

Use this for item transactions, save migration, a player-visible changelog or its menu behavior. The sources keep item identity and release identity explicit so a presentation change cannot destroy an item or invent release history. [MengTo/Skills, build-game-inventory; build-game-changelog, SKILL.md and references/reference-architecture.md]

## Commit complete item transactions

[MengTo/Skills, build-game-inventory]

- Separate authored item definition from a runtime item's unique identity, owner, stack count and applied effects. A definition ID is not the identity of every owned instance.
- For move, equip, stack, split, drop or use, validate the complete source and destination result before committing once. Check slot/type/capacity/quantity constraints before removing anything from the source.
- A failed destination leaves the original intact. Repeated dispatch cannot duplicate the instance, consume twice or apply the same effect twice.
- Preserve item conservation except for explicit authored reward creation and consumption. Keep those transitions distinguishable from accidental duplication or loss.
- Save/load and migration preserve identity, ownership and effect application. Include reset, repeated input, changed definitions and migration cases in the selected acceptance journey.
- Provide keyboard and touch alternatives where drag is offered; item integrity cannot depend on one pointer path working.

## State actual production releases

[MengTo/Skills, build-game-changelog]

- Follow the project's established version scheme. The source's patch-only `0.9.x` policy is local, not a requirement to renumber a released game.
- Write entries for player-visible production releases rather than manufacturing an entry for every implementation commit. Use actual deployed revision/date evidence and do not invent historical versions.
- Derive the displayed current version from the newest real entry. A release entry cannot contain its own final commit hash before that commit exists; use the project's truthful revision/deployment ledger.
- Source GitHub scripts, deployment paths and browser assumptions are not a new release system. Operational deployment stays with [deployment](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/deployment/SKILL.md); the game-specific deployed journey stays in [GAME-VERIFICATION.md](GAME-VERIFICATION.md).

## Return from the changelog coherently

[MengTo/Skills, build-game-changelog]

Closing by X, toggling the same menu action, Escape or controller Back uses the same back operation and input precedence. Return to the previous screen and pause state, preserve focus and allow the changelog list to scroll independently. Opening release notes cannot silently resume gameplay behind a menu or discard the current run.

## Prove it

Each allowed item operation produces the validated complete state; failure and repeated dispatch preserve identity, count and effects. Reload, migration and reset meet their declared persistence behavior. The visible version comes from a real newest production entry, every recorded release has evidence, and all supported back/close paths return to the prior screen and pause state. [MengTo/Skills, build-game-inventory; build-game-changelog]
