# Capability inventory: what to expose from source

Before editing anything, build an inventory of what the app already does for a user, traced end to end. Report what each step found as you go, not only at the end.

## Establish the application boundary

- **Read the target repo first:** its instructions, package manifests, framework config and current git status. Preserve unrelated changes.
- **Find the real browser app.** In a monorepo, identify the actual browser app and the server packages it calls before editing.
- **Search signals are leads, not conclusions.** A scan that reports file and line leads (without printing source snippets) tells you where to look; open only the relevant files and follow imports and calls by hand.

## Trace every candidate

Follow each candidate from its user-visible entry point through:

1. client handler
2. validation schema
3. server boundary
4. authorization checks
5. side effect
6. returned state

Look at routes and screens; forms and submit handlers; server actions, API handlers, RPC procedures and service clients; Zod, Valibot, Yup, Joi, JSON Schema or equivalent validators; authentication, authorization, CSRF, idempotency, rate limits and audit hooks.

## Where to look, by framework

| Stack | Signals |
|---|---|
| Next.js App Router | `app/**/page.*`, `route.*`, files with `"use server"`, client components, server actions, root layouts and providers |
| Next.js Pages Router | `pages/**`, `pages/api/**`, `_app.*`, API clients, form handlers |
| React routers | `<Route>`, `createBrowserRouter`, route modules, mutation and query hooks, the root render entry |
| Vue/Nuxt, Svelte/SvelteKit, Remix and similar | route modules, server/load/action files, composables, root layouts |
| Any stack | `<form>`, submit listeners, task-named functions (`search*`, `calculate*`, `save*`), network clients and query/mutation hooks, RPC routers, OpenAPI or JSON Schema, validation libraries, authorization middleware, local persistence or state stores (including localForage), existing `modelContext` usage |

A line-level scan for leads can match these kinds:

| Kind | Matches |
|---|---|
| webmcp | `navigator.modelContext` or `document.modelContext`, `registerTool(`, `toolname=` |
| form | `<form`, `onSubmit=`, `addEventListener("submit"`, `useForm(` |
| server-action | a `"use server"` line, `export async function` named action, create, update, delete, submit, send, publish or save*, `serverAction(` |
| route-handler | exported `GET`, `POST`, `PUT`, `PATCH`, `DELETE` functions; `router` or `app` `.get/.post/...(`; `createBrowserRouter`, `createRoutesFromElements`; `<Route` |
| schema | `z.object(`, `yup.object(` or `Joi.object(`, `v.object(` or `valibot.object(`, `jsonSchema`, `inputSchema`; files named `*schema`, `*validator`, `*validation` |
| client-state | `localStorage` or `sessionStorage` `getItem/setItem/removeItem`, `indexedDB.open/deleteDatabase`, localForage methods, `atomWithStorage(` |
| network-client | `fetch(`, `axios.*(`, `useQuery(`, `useMutation(`, `useLazyQuery(`, `graphql` or `gql` templates |
| capability-function | functions named add, calculate, compute, convert, create, delete, export, fetch, filter, find, get, import, list, load, lookup, move, publish, remove, save, search, send, set, start, submit, toggle, update* |
| authorization | authorize, authorization, permission, requireUser, requireAuth, isAdmin, canAccess, csrf, idempotency |
| framework-route (by path) | `app/**/page.*`, `app/**/layout.*` and `app/**/route.*`, `pages/` including `pages/api/`, `routes/`, `route/` or `router/` directories |

Scan scope that keeps it sane: source extensions `.js .jsx .mjs .cjs .ts .tsx .vue .svelte .html`; skip `.git .next .nuxt .output .svelte-kit .turbo .vercel build coverage dist node_modules out target vendor`, symlinks, files over 512 KB, and files starting with `.env`, `credentials` or `secrets`. Detect frameworks from every `package.json` (dependencies and devDependencies): next, react, react-router or react-router-dom, @remix-run/react, vue, nuxt, svelte, @sveltejs/kit, vite, astro, express, fastify, hono. With a file cap (10,000 by default), fail loudly and ask to narrow the repository rather than truncating silently.

- **A Node script that never runs when symlinked:** comparing `process.argv[1]` with `import.meta.url` through `path.resolve` alone never matches when the script is reached through a symlink, and the script exits silently. Resolve both with `realpathSync`:

```js
const resolveReal = (value) => {
  try {
    return realpathSync(value);
  } catch {
    return value;
  }
};

const invokedPath = process.argv[1] ? resolveReal(path.resolve(process.argv[1])) : "";
if (invokedPath === resolveReal(fileURLToPath(import.meta.url))) {
  main().catch((error) => { /* ... */ process.exitCode = 1; });
}
```

## Choose and exclude

- **Prefer complete user tasks** such as `search_catalog` or `save_draft`, not a mechanical tool per endpoint.
- **Exclude:** internal or admin-only operations, authentication bypasses, raw database access, secret-bearing operations, and capabilities the UI does not grant the current user.
- **A route name or schema alone does not prove** that a capability is usable, authorized or safe to expose.

## The inventory table

Build it before editing:

| Capability | UI entry | Handler/service | Validator | Auth/guard | Side effect | Risk | Proposed tool/test |
|---|---|---|---|---|---|---|---|

For each selected tool, also record its source files, the existing validation and authorization boundary, side effects, risk class (TOOL-CONTRACT.md), confirmation behavior, and a safe fixture input.

## Prove it

Every row in the table traces to a UI entry, a handler and a guard you opened and read, not to a scan hit. Every exclusion has a reason that will appear in the report. Each selected tool has a risk class and a synthetic or disposable fixture input.
