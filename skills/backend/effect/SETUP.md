# Setup

## Install

Use the project's package manager:

```sh
pnpm add effect@latest
```

In a monorepo, install it as a dev dependency at the root, so the source is reachable at `node_modules/effect/src`:

```sh
pnpm add -D effect@latest
```

## Point the agents at the installed guide

Make sure the repo's agent instructions (`AGENTS.md` or `CLAUDE.md`) contain:

```md
# Learning more about Effect

This repository uses the Effect Typescript library.

Before writing any Effect code, first read `node_modules/effect/AGENTS.md`
**completely**, and follow the links in the file when required.

If you need to learn more about particular Effect apis and concepts that the
guide doesn't cover, search through the source code in `node_modules/effect/src`.
```

## v4 module paths

- **`@effect/rpc`, `@effect/ai`, `@effect/cli`** are now `effect/rpc`, `effect/ai`, `effect/cli`. Beta-era `effect/unstable/*` paths were removed in `4.0.0-rc.118`. Provider SDKs remain separate as `@effect/ai-*`. [Existing RPC-AI-CLI.md, introduction and Porting from v3]

## Prove it

`node_modules/effect/AGENTS.md` and `node_modules/effect/src` exist after install, and the block above is in the agent instructions file.
