# kitcn React, caching and server rendering

Client guidance comes from [udecode/kitcn, SKILL.md, references/features/react.md, references/setup/react.md, next.md, start.md, expo.md] and [kitcn's React docs](https://kitcn.dev/docs/react). This topic owns adapter-specific behavior; React fundamentals remain in the [global React skill](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/react/SKILL.md). Read [setup](KITCN-SETUP.md) for generated imports, CLI ownership and environment URLs.

## Providers and client lifetime

[udecode/kitcn, references/setup/react.md; references/features/react.md, Setup; https://kitcn.dev/docs/react]

- `createCRPCContext({ api, convexSiteUrl })` supplies `CRPCProvider`, `useCRPC` and `useCRPCClient`. The first hook returns TanStack options/proxies; the second returns an imperative typed client.
- Mount the Convex provider and TanStack `QueryClientProvider`, with `CRPCProvider` inside the QueryClient provider and above every consumer. The source error is `useCRPC must be used within CRPCProvider`.
- Without auth use the Convex provider; the kitcn Better Auth path uses `ConvexAuthProvider` from `kitcn/auth/client`, the auth client, Convex client and selected query bridge. Authenticated Next SSR passes its initial token; public-only paths can intentionally omit it.
- `getQueryClientSingleton(factory)` implements the existing [request-local server/reused browser rule](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/react/DATA-AND-BUNDLES.md#client-data-none-swr-or-tanstack-query). `getConvexQueryClientSingleton` creates/connects the subscription bridge with `convex`, `queryClient`, optional `authStore` and `unsubscribeDelay`, whose source default is 3000 ms.
- Subscription lifetime is mount, subscribe, unmount, delay, unsubscribe; cached data remains until `gcTime`. The delay supports StrictMode remounts and quick back navigation; it is not an authorization grace period.
- The auth client's plugin-specific exports require their matching plugins. Source setup exports organization hooks without `organizationClient`; use the [corrected auth plugin contract](KITCN-AUTH.md) rather than copying that client template.

## Query methods and cache ownership

[udecode/kitcn, references/features/react.md, Queries; references/features/http.md, Client integration; https://kitcn.dev/docs/react/queries]

| Method | Where | Cache behavior |
|---|---|---|
| `client.*.query()` from the vanilla client | Imperative code | Direct call without TanStack caching |
| `crpc.*.queryOptions(args, options?)` | Component render | Uses hooks and reactive auth state |
| `crpc.*.staticQueryOptions(...)` | Event handlers/prefetch and other non-hook code | Cache-compatible; auth resolved at execution, without reactive auth state |
| `crpc.*.queryKey(args)` | Cache get/set/fetch | Exact key used by options and RSC |
| `crpc.*.queryFilter(args?)` | Cache matching | Prefix match; without args includes all input variants |

- `subscribe` defaults to true for ordinary cRPC queries. Convex pushes into the QueryClient; source defaults are `staleTime: Infinity`, `gcTime: 5 minutes`, and disabled mount/window-focus refetch. Actions are detected as non-subscribing calls.
- For subscribed paths, the source says not to use `invalidateQueries` as the refresh mechanism. `subscribe: false` is one-time HTTP fetching and allows ordinary refetch/fetch/invalidation. Generated `crpc.http.*` route query options use a 30-second stale time and leave `refetchOnMount` at TanStack's default, so an invalidated unmounted route can refetch when mounted.
- These are kitcn delivery defaults, not generic TanStack defaults or a replacement for the owner's UI policy. Preserve the [owner conflict](#error-envelopes-and-owner-ui) before changing application freshness behavior.
- Add `select` separately after spreading generated query options. Prefer generated key/filter helpers to manually assembling cache keys.
- `skipUnauth` defaults to false; when enabled it skips the unauthenticated query. It is a client execution choice, not server authorization.

| Procedure metadata | While auth loads | Logged out |
|---|---|---|
| Public | Runs | Runs |
| `auth: 'optional'` | Waits | Runs |
| `auth: 'required'` | Waits | Skips |

The metadata must match the application's actual builders and enforced middleware; use [the authenticated-builder correction](KITCN-AUTH.md#jwt-session-and-public-boundary-enforcement). [udecode/kitcn, SKILL.md, section 6; references/features/react.md, Conditional queries]

## Mutations and optimistic updates

[udecode/kitcn, references/features/react.md, Mutations; https://kitcn.dev/docs/react/mutations]

`crpc.path.mutationOptions(options?)` supplies the mutation function; other options follow TanStack's mutation options. Action procedures can use this interface for outside API work without subscriptions. Inline success/error/settled callbacks, form cleanup and promise feedback are source patterns; their visual placement still follows the owner UI.

Pass `optimisticUpdate(localStore, args)` to use Convex's local query store. Kitcn removes that option before returning TanStack options; Convex replays the update as query data changes and owns rollback when the mutation completes. Do not invent a separate manual cache rollback alongside this mechanism. [https://kitcn.dev/docs/react/mutations]

For `createAuthMutations`, logout ordering and the raw Convex preset distinction, use [the canonical auth-client guidance](KITCN-AUTH.md#client-authentication-recovery-and-identity). [udecode/kitcn, SKILL.md, section 8; references/setup/start.md; https://kitcn.dev/docs/auth/client]

## Infinite queries

[udecode/kitcn, references/features/react.md, Infinite queries; https://kitcn.dev/docs/react/infinite-queries]

- Import `useInfiniteQuery` from `kitcn/react` for this adapter; native TanStack pagination alone does not provide its per-page Convex subscriptions.
- On the server, `.paginated({ limit, item })` precedes `.query()`, adds cursor, optional endCursor and limit input, and accepts the full Convex page result including `pageStatus` and `splitCursor`. Forward all cursor bounds into the ORM query; do not discard endCursor during live page splits.
- The client limit is optional when server metadata supplies it, and cannot exceed that server limit. `skipUnauth` is also supported. Read the selected proxy's `.meta.limit` rather than inventing a second limit.
- Each page owns a subscription; split pages use endCursor to bound adjacent ranges. `InvalidCursor` on a loaded page resets the list to page zero. Pagination state persists in QueryClient for scroll restoration.

| Returned field | Contract |
|---|---|
| `data` | Flattened items |
| `pages` | Raw pages |
| `fetchNextPage(limit?)` | Load another page |
| `hasNextPage` | Whether more pages can load |
| `status` | `LoadingFirstPage`, `LoadingMore`, `CanLoadMore`, `Exhausted` |
| `isPlaceholderData` | Placeholder-data indicator |

The source's public session-pagination backend accepts an optional userId without establishing ownership. Do not copy that example; [Convex authorization](https://docs.convex.dev/auth/functions-auth) and [the existing app boundary](AUTH.md#public-functions-and-referenced-parents) still apply to paginated reads. [udecode/kitcn, references/features/react.md, Infinite queries backend]

## Error envelopes and owner UI

[udecode/kitcn, references/features/react.md, Error handling; https://kitcn.dev/docs/react/error-handling]

Server `CRPCError` arrives as a `ConvexError`; inspect `error.data` for code, message and deliberate domain payload. `CRPCClientError` represents client-side errors such as skipped authenticated calls. The code meanings and HTTP mapping have one owner in [KITCN.md](KITCN.md#errors).

| Source view | Existing owner view and retained behavior |
|---|---|
| Source SKILL section 8 prefers a global QueryClient mutation `onError` toast, using `mutation.meta.errorMessage` or `skipErrorToast` | [owner-design, app-ui/STATES](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/STATES.md#where-messages-go) puts an error in its relevant row, field or form. Retain the owner placement. |
| Source prefers `error.data.message` over `error.message` and directly renders it | [app-ui, STATES, Messages](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/STATES.md) maps error codes to the app's own localized words. Retain code-to-message mapping. |
| Source subscription defaults disable refetch/invalidation refresh | [app-ui, STATES, Freshness](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/STATES.md) rereads shown data older than 30 seconds on mount/visibility/online and invalidates changed entities. Treat this as an integration-policy conflict if applying the adapter defaults would change owner behavior. |

The source's preference describes its own generic app. It is not approval to rewrite app-ui, landing-page-ui or agent-chat-ui. A backend integration keeps the owner design until a specific change is approved. [user owner-design rule; udecode/kitcn, SKILL.md, section 8]

## Next.js server rendering

[udecode/kitcn, references/setup/next.md; references/features/react.md, Server components; https://kitcn.dev/docs/nextjs; https://kitcn.dev/docs/nextjs/rsc]

`convexBetterAuth` from `kitcn/auth/nextjs` supplies `createContext`, `createCaller` and the `handler` exported as GET/POST/OPTIONS in `src/app/api/auth/[...all]/route.ts`. Without this auth provider, use the documented `createCallerFactory` server-only path instead. Read installed package peers: the fetched Next setup pins Better Auth 1.6.5 while the fetched current kitcn manifest requires >=1.7.0 <1.8.0. Do not copy that old pin into new setup. [https://github.com/udecode/kitcn/blob/main/packages/kitcn/package.json]

Keep `await headers()` in the request-scoped, React-cached RSC context factory. `createServerCRPCProxy({ api })` provides query options, not RSC mutation options. `getServerQueryClientOptions({ getToken, convexSiteUrl })` configures HTTP fetching; share the selected hydration/serialization settings across server, client and caller. Date handling is owned by [the procedure contract](KITCN.md#inputs-outputs-and-context).

| Pattern | Blocks / returns data | Hydrates client | Source purpose |
|---|---|---|---|
| `prefetch(...)` | No / void | Yes | Client-owned data, parallel nonblocking prefetch |
| `caller.*` | Yes / yes | No | Server-only checks, redirects or sensitive data |
| `preloadQuery(...)` | Yes / yes | Yes | Metadata, 404/redirect checks requiring immediate data |

`HydrateClient` must wrap every client component consuming prefetched queries. Server and client proxies use the same query keys. Do not render one fetched value in both a Server Component and a reactive client view while expecting QueryClient revalidation to update the server-rendered copy. Prefer prefetch for client ownership; preload only when the server needs the result. [https://kitcn.dev/docs/nextjs/rsc]

### JWT cache and request timing

[udecode/kitcn, references/setup/next.md, JWT cache and partial prefetching; https://github.com/udecode/kitcn/blob/main/packages/kitcn/src/auth-nextjs/index.ts; https://github.com/udecode/kitcn/blob/main/packages/kitcn/src/auth/internal/token.ts]

- `auth.jwtCache` defaults to true and accepts a boolean or `{ now }`. `now` returns finite Unix seconds or a promise of seconds, not milliseconds. `auth.expirationToleranceSeconds` is a sibling option, default 60; `auth.isUnauthorized` customizes unauthorized detection.
- The clock is awaited only after decoding a cached JWT with expiry. Disabled caching, force refresh, absent/malformed cookie or absent expiry bypass it and fetch a token. An expired decoded token calls the clock, then refreshes. Clock failures propagate; NaN/infinity are rejected. The clock controls the expiry comparison, not every token operation.
- With the source's Next 16 Cache Components/partial-prefetch configuration, defer request-time token work deliberately; its headers-first context alone is not the whole timing policy. The source helper checks the matching session cookie before token work and uses the same gated getToken for provider/route gating and server query options. Token-dependent subtrees belong under Suspense.
- `connection()` can defer subsequent work until a request. A token read already behind it does not need another clock hook. If using a separate request-time clock that awaits it, remember token-fetch paths can bypass that hook. [https://nextjs.org/docs/app/api-reference/functions/connection]
- For `'use cache: private'`, the source uses a separate factory with default/synchronous clock; never call connection inside that cache or reuse the connection-gated token helper there. Next permits headers/cookies in private cache but prohibits connection. The source's `cacheLife({ stale: 30 })` helper is one policy, not a global auth freshness guarantee; private caching does not make request auth static. [https://nextjs.org/docs/app/api-reference/directives/use-cache-private]
- `jwtCache: false` avoids the cookie-expiry clock but fetches a token on every context creation. Kitcn does not detect Next render stages or suppress render aborts. Do not classify every AbortError as a render abort or suppress ordinary auth/network failures; an app-owned abort policy must cover the whole token operation, not only the clock callback.

## TanStack Start and Expo

[udecode/kitcn, references/setup/start.md, references/setup/expo.md; https://kitcn.dev/docs/tanstack-start; https://kitcn.dev/docs/expo]

- Start uses `convexBetterAuthReactStart` from `kitcn/auth/start/server`, its generated auth-server module and `src/routes/api/auth/$.ts`. The kitcn Next helper is not its adapter.
- Start `getToken` fetches through the auth route; enabling `auth.jwtCache` reads a cookie token. Leave that cache off when priming the browser Convex client from getToken, because the browser captures a token it cannot renew through that captured value.
- Use request-scoped Caller or `fetchAuthQuery` in server code. `createCaller()` resolves the current request on every call and shares one token fetch within that request; a module-scope caller does not itself retain request state. A supplied context factory is for deliberately different headers.
- Reach server Caller from `createServerFn` or server routes. A route loader also runs in the browser during navigation; it cannot assume server request scope.
- Only client/router loaders using the shared QueryClient before the provider mounts need `syncConvexAuthForStartLoader` from `kitcn/auth/start`. Put it in root beforeLoad before child loaders. It supports ConvexReactClient/ConvexQueryClient, updates browser/server HTTP auth, avoids duplicate setAuth for the same token and clears auth when no token exists.
- Expo's provider/client and public-environment setup is owned by [KITCN-SETUP.md](KITCN-SETUP.md). Its default auth scaffold and `/auth` screen do not authorize replacing the owner's mobile design.

## Prove it

[udecode/kitcn, SKILL.md, sections 8, 11 and 12; references/features/react.md]

Read the provider tree and generated API before adding hooks. Establish selected delivery mode, auth-loading behavior, client/server cache lifetime and exact query keys. Trace pagination endCursor/split handling, InvalidCursor reset and optimistic rollback ownership. Identify which server data is hydrated and who owns later refresh. Preserve owner error placement/localization/freshness, verify JWT clock units and request scope, and record any integration conflict or unperformed runtime validation. Execution follows [TESTING.md](TESTING.md) and the user's no-tests/builds rule.
