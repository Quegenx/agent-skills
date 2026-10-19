# Data and bundles

How data reaches a React page without waterfalls, how much of it crosses into the client, which client cache to use, and how to keep the JavaScript bundle small: Server Component waterfalls and their fixes, request-scoped dedupe, the RSC serialization boundary, SWR and TanStack Query with their real imports, barrel files and `optimizePackageImports`, and dynamic imports. Rules come from Vercel's react-best-practices skill (MIT, tagged [Vercel, react-best-practices, <rule>]), each checked against nextjs.org, react.dev and swr.vercel.app (fetched 2026-10-18); where a rule disagrees with the docs, the docs' form is written and the line says what the rule said. The general rules for overlapping awaits (start early, await late; never ahead of the auth check; not for CPU-bound work) live in [performance-and-caching MEASURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/MEASURE.md#overlap-independent-waits) and are only pointed to here. Next.js APIs (Cache Components, `use cache`, Route Handlers) are in [NEXTJS.md](NEXTJS.md). Severity uses the P0 to P3 scale of [code-review REVIEWER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/REVIEWER.md): the source's CRITICAL and HIGH are written as P1, MEDIUM as P2, LOW as P3.

**Contents:** [Waterfalls in the server tree](#waterfalls-in-the-server-tree) · [Waterfalls inside one function](#waterfalls-inside-one-function) · [Dedupe within a request](#dedupe-within-a-request) · [What crosses the RSC boundary](#what-crosses-the-rsc-boundary) · [Client data: none, SWR or TanStack Query](#client-data-none-swr-or-tanstack-query) · [Barrel files and optimizePackageImports](#barrel-files-and-optimizepackageimports) · [Dynamic imports](#dynamic-imports) · [Paths the bundler can analyze](#paths-the-bundler-can-analyze) · [Prove it](#prove-it)

## Waterfalls in the server tree

"Waterfalls are the #1 performance killer. Each sequential await adds full network latency." [Vercel, react-best-practices, _sections.md]

- **An `await` in a parent delays its children (P1).** "React Server Components execute sequentially within a tree. Restructure with composition to parallelize data fetching." [Vercel, react-best-practices, server-parallel-fetching]

  ```tsx
  // Incorrect: Sidebar waits for Page's fetch to complete
  export default async function Page() {
    const header = await fetchHeader()
    return (
      <div>
        <div>{header}</div>
        <Sidebar />
      </div>
    )
  }

  // Correct: both fetch simultaneously
  async function Header() {
    const data = await fetchHeader()
    return <div>{data}</div>
  }

  async function Sidebar() {
    const items = await fetchSidebarItems()
    return <nav>{items.map(renderItem)}</nav>
  }

  export default function Page() {
    return (
      <div>
        <Header />
        <Sidebar />
      </div>
    )
  }
  ```

  The same works through `children`: a `Layout` renders `<Header />` and `{children}`, and the page passes `<Sidebar />` as the child. Next.js: "By default, layouts and pages are rendered in parallel", but "within *any* component, multiple `async`/`await` requests can still be sequential" (https://nextjs.org/docs/app/getting-started/fetching-data).
- **Put the wait behind `<Suspense>` so the frame renders first (P1)** [Vercel, react-best-practices, async-suspense-boundaries]: the code, the shared-promise form with `use(dataPromise)` and the rule's when-not-to list are in [BOUNDARIES-AND-SUSPENSE.md](BOUNDARIES-AND-SUSPENSE.md#where-suspense-boundaries-go).
- **Chain nested fetches per item (P1).** Two `Promise.all` stages make every author wait for the slowest chat: "If one `getChat(id)` out of 100 is extremely slow, the authors of the other 99 chats can't start loading even though their data is ready." [Vercel, react-best-practices, server-parallel-nested-fetching]

  ```tsx
  const chatAuthors = await Promise.all(
    chatIds.map(id => getChat(id).then(chat => getUser(chat.author)))
  )
  ```

  With data-dependent counts, bound the concurrency ([performance-and-caching MEASURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/MEASURE.md#overlap-independent-waits)).
- **Preload a request whose inputs are ready before other blocking work.** "call the data-fetching function without `await` before blocking work, then call the same function in the component that consumes the result"; the function must dedupe matching calls (`fetch` does; wrap an ORM call in `React.cache`; with Cache Components, `'use cache'`) (https://nextjs.org/docs/app/getting-started/fetching-data#preloading-data):

  ```tsx
  // app/item/[id]/item.tsx
  async function getItem(id: string) {
    const res = await fetch(`https://api.example.com/items/${id}`)
    return res.json()
  }

  export const preload = (id: string) => {
    void getItem(id)
  }

  export default async function Item({ id }: { id: string }) {
    const item = await getItem(id)
    return <div>{item.name}</div>
  }

  // app/item/[id]/page.tsx
  import Item, { preload } from './item'
  import { checkIsAvailable } from '@/app/lib/data'

  export default async function Page({
    params,
  }: {
    params: Promise<{ id: string }>
  }) {
    const { id } = await params

    preload(id)
    const isAvailable = await checkIsAvailable(id)

    return isAvailable ? <Item id={id} /> : null
  }
  ```

  "Keep the preload function next to the component that consumes the data."

## Waterfalls inside one function

- **Start early, await late (P1).** In API routes and Server Actions, start `auth()` and `fetchConfig()` before awaiting either, then `Promise.all` the config with the session-dependent fetch [Vercel, react-best-practices, async-api-routes]. The code, the longer-chain form (`userPromise.then(user => fetchProfile(user.id))`) and the third-party `better-all` option are in [performance-and-caching MEASURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/MEASURE.md#overlap-independent-waits).
- **Never move a private read ahead of the check that authorizes it:** the rule and its quote are in [performance-and-caching MEASURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/MEASURE.md#overlap-independent-waits) [Vercel, vercel-optimize, support-topics/auth-preserving-parallelization.md].
- **Await inside the branch that uses it (P1).** "Move `await` operations into the branches where they're actually used to avoid blocking code paths that don't need them." [Vercel, react-best-practices, async-defer-await]

  ```typescript
  // Correct: fetches only when needed
  async function updateResource(resourceId: string, userId: string) {
    const resource = await getResource(resourceId)

    if (!resource) {
      return { error: 'Not found' }
    }

    const permissions = await fetchPermissions(userId)

    if (!permissions.canEdit) {
      return { error: 'Forbidden' }
    }

    return await updateResourceData(resource, permissions)
  }
  ```

  "This optimization is especially valuable when the skipped branch is frequently taken, or when the deferred operation is expensive."
- **Check the cheap condition before the async flag.** [Vercel, react-best-practices, async-cheap-condition-before-await]

  ```typescript
  if (someCondition) {
    const someFlag = await getFlag()
    if (someFlag) {
      // ...
    }
  }
  ```

  "Keep the original order if `someCondition` is expensive, depends on the flag, or you must run side effects in a fixed order."

## Dedupe within a request

- **`React.cache` for non-fetch work (P2).** "Within a single request, multiple calls to `getCurrentUser()` execute the query only once." [Vercel, react-best-practices, server-cache-react]

  ```typescript
  import { cache } from 'react'

  export const getCurrentUser = cache(async () => {
    const session = await auth()
    if (!session?.user?.id) return null
    return await db.user.findUnique({
      where: { id: session.user.id }
    })
  })
  ```

- **Pass primitives.** "`React.cache()` uses shallow equality (`Object.is`) to determine cache hits. Inline objects create new references each call, preventing cache hits": `cache(async (uid: number) => ...)` called as `getUser(1)` hits; `getUser({ uid: 1 })` twice misses. To pass an object, pass the same reference (`const params = { uid: 1 }`).
- **Scope:** react.dev: "`cache` is only for use with React Server Components", "the cache will be invalidated across server requests", and call `cache` outside components (https://react.dev/reference/react/cache). Next.js: "`React.cache` is scoped to the current request only" (https://nextjs.org/docs/app/getting-started/fetching-data). Inside a `'use cache'` scope it is isolated ([NEXTJS.md](NEXTJS.md#use-cache)).
- **`fetch` needs no wrapper:** "Identical `fetch` requests in a React component tree are memoized by default, so you can fetch data in the component that needs it instead of drilling props" (same page). Use `React.cache` for "Database queries (Prisma, Drizzle, etc.)", "Heavy computations", "Authentication checks", "File system operations" [Vercel, react-best-practices, server-cache-react].
- **Data shared across requests** is a different tier: a bounded module-level LRU or `'use cache'` ([performance-and-caching CACHING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/CACHING.md#module-level-caches)).

## What crosses the RSC boundary

- **Send only the fields the client uses (P1).** "The React Server/Client boundary serializes all object properties into strings and embeds them in the HTML response and subsequent RSC requests. This serialized data directly impacts page weight and load time, so **size matters a lot**." [Vercel, react-best-practices, server-serialization]

  ```tsx
  // Incorrect: serializes all 50 fields
  async function Page() {
    const user = await fetchUser()  // 50 fields
    return <Profile user={user} />
  }

  // Correct: serializes only 1 field
  async function Page() {
    const user = await fetchUser()
    return <Profile name={user.name} />
  }

  'use client'
  function Profile({ name }: { name: string }) {
    return <div>{name}</div>
  }
  ```

  It is also a data-exposure rule: Next.js's data-security guide warns that "it's possible to accidentally expose private data through how data is fetched or passed to components", and offers `experimental.taint` with React's `experimental_taintObjectReference` and `experimental_taintUniqueValue` as "an additional layer of protection" (https://nextjs.org/docs/app/guides/data-security). The same column rule for queries is "Select only the columns the caller uses" ([performance-and-caching QUERIES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/QUERIES.md)).
- **Props must be serializable by React** (https://nextjs.org/docs/app/getting-started/server-and-client-components); a Server Action's return value is serialized the same way, so return `{ success: true }`, not the database row ([NEXTJS.md](NEXTJS.md#server-actions-and-their-auth)).
- **Don't send the same array twice (P3, unverified).** "RSC→client serialization deduplicates by object reference, not value"; `usernames={usernames} usernamesOrdered={usernames.toSorted()}` sends 6 strings where sorting on the client sends 3. `string[]` duplicates fully, `object[]` only the array; `.toSorted()`, `.filter()`, `.map()`, `.slice()`, `[...arr]`, `{...obj}`, `Object.assign()`, `structuredClone()` and `JSON.parse(JSON.stringify())` all make new references. "Exception: Pass derived data when transformation is expensive or client doesn't need original." [Vercel, react-best-practices, server-dedup-props] react.dev does not document dedupe by reference.

## Client data: none, SWR or TanStack Query

https://nextjs.org/docs/app/guides/client-side-data-fetching (checked 2026-10-18):

- **No library when the client only reads once.** "If a Client Component only needs to read server data once, pass it a Promise and unwrap it with React's `use()`." Use SWR, TanStack Query or Apollo Client "when Client Components need a shared browser cache" (focus revalidation, polling, request dedupe, optimistic updates).
- **The same three patterns in both:**

  | Pattern | SWR | TanStack Query | Data available |
  |---|---|---|---|
  | Inline loading states | `useSWR` | `useQuery` | browser request after hydration |
  | Suspense loading states | `useSWR` with `suspense: true` | `useSuspenseQuery` | browser request after hydration |
  | Provided by the server | `<SWRConfig fallback>` | `<HydrationBoundary>` | initial render or streamed |

- **Either one replaces a fetch in an Effect.** react-best-practices: "SWR enables request deduplication, caching, and revalidation across component instances", and multiple instances of `useSWR('/api/users', fetcher)` "share one request" [Vercel, react-best-practices, client-swr-dedup]. Why an Effect fetch needs a cleanup when you keep one is in [EFFECTS-AND-STATE.md](EFFECTS-AND-STATE.md#you-might-not-need-an-effect).
- **SWR imports, corrected** (the rule's own are wrong) [Vercel, react-best-practices, client-swr-dedup]:
  - `import useSWR from 'swr'`; `SWRConfig`, `useSWRConfig` and `mutate` are named exports of `'swr'`.
  - `import useSWRMutation from 'swr/mutation'`, a default export (https://swr.vercel.app/docs/mutation). The rule writes `import { useSWRMutation } from 'swr/mutation'`.
  - `import useSWRImmutable from 'swr/immutable'` (since SWR 1.0), equal to `useSWR(key, fetcher, { revalidateIfStale: false, revalidateOnFocus: false, revalidateOnReconnect: false })` (https://swr.vercel.app/docs/revalidation). The rule's `import { useImmutableSWR } from '@/lib/swr'` is a project-local helper, not SWR's API.
- **TanStack Query imports** all come from `'@tanstack/react-query'`: `QueryClient`, `QueryClientProvider`, `useQuery`, `useSuspenseQuery`, `useMutation`, `useQueryClient`, `queryOptions`, `HydrationBoundary`, `dehydrate`, `defaultShouldDehydrateQuery` (https://nextjs.org/docs/app/guides/client-side-data-fetching/tanstack-query). One query client per server render, one reused in the browser:

  ```tsx
  'use client'

  import type { ReactNode } from 'react'
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

  let browserQueryClient: QueryClient | undefined

  function getQueryClient() {
    // Keep server requests isolated and preserve the browser cache across renders.
    if (typeof window === 'undefined') return new QueryClient()
    browserQueryClient ??= new QueryClient()
    return browserQueryClient
  }

  export function Providers({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={getQueryClient()}>
        {children}
      </QueryClientProvider>
    )
  }
  ```

  Render it from the nearest shared layout. TanStack Query's defaults (`staleTime: 0`, `gcTime` 5 minutes, refetch on focus, in-flight dedupe) and `invalidateQueries` are in [performance-and-caching CACHING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/CACHING.md#layers-in-a-typescript-stack).
- **Three cache layers, one identity.** With Cache Components on, the Next.js server cache (`cacheLife` `revalidate`/`expire`), the client router cache (`cacheLife` `stale`) and the library's browser cache keep "independent freshness policies and do not need matching durations. Cache identities and mutation invalidation must stay coordinated across layers." After a mutation, invalidate the server read that provided the initial data: `updateTag(tag)` from a Server Action that must show the change at once, `revalidateTag(tag, 'max')` when stale is fine, `revalidateTag(tag, { expire: 0 })` from a webhook. "An optimistic update should restore the previous browser value if the write fails."

## Barrel files and optimizePackageImports

- **Barrels load what you don't use (P1).** "Popular icon and component libraries can have **up to 10,000 re-exports** in their entry file. For many React packages, **it takes 200-800ms just to import them**, affecting both development speed and production cold starts." "When a library is marked as external (not bundled), the bundler can't optimize it." [Vercel, react-best-practices, bundle-barrel-imports] Its example's counts ("Loads 1,583 modules, takes ~2.8s extra in dev") and claimed gains cite Vercel's blog post "How we optimized package imports in Next.js": "15-70% faster dev boot, 28% faster builds, 40% faster cold starts".
- **On Next.js, check the default list before adding to the config.** `experimental.optimizePackageImports` (badge "Experimental") "will only load the modules you are actually using". These are "optimized by default" (https://nextjs.org/docs/app/api-reference/config/next-config-js/optimizePackageImports, checked 2026-10-18): `lucide-react`, `date-fns`, `lodash-es`, `ramda`, `antd`, `react-bootstrap`, `ahooks`, `@ant-design/icons`, `@headlessui/react`, `@headlessui-float/react`, `@heroicons/react/20/solid`, `@heroicons/react/24/solid`, `@heroicons/react/24/outline`, `@visx/visx`, `@tremor/react`, `rxjs`, `@mui/material`, `@mui/icons-material`, `recharts`, `react-use`, `@material-ui/core`, `@material-ui/icons`, `@tabler/icons-react`, `mui-core`, `react-icons/*`, `effect`, `@effect/*`. The rule's example config (`optimizePackageImports: ['lucide-react', '@mui/material']`) adds nothing; of its "commonly affected" list only `lodash` (the list has `lodash-es`) and `@radix-ui/react-*` are missing:

  ```js
  module.exports = {
    experimental: {
      optimizePackageImports: ['package-name'],
    },
  }
  ```

  The rule dates the option to "Next.js 13.5+"; the docs page has no version history.
- **Elsewhere, import the subpath:** `import Button from '@mui/material/Button'`. "**TypeScript warning:** Some libraries (notably `lucide-react`) don't ship `.d.ts` files for their deep import paths. Importing from `lucide-react/dist/esm/icons/check` resolves to an implicit `any` type".
- **Your own code:** this repo's CLAUDE.md says "Avoid broad re-export barrels unless a framework requires one."

## Dynamic imports

https://nextjs.org/docs/app/guides/lazy-loading (checked 2026-10-18):

- **Lazy loading is for Client Components.** "By default, Server Components are automatically code split", and "When a Server Component dynamically imports a Client Component, automatic code splitting is currently **not** supported." Dynamically importing a Server Component lazy-loads only its Client Component children.
- **`ssr: false` only inside a Client Component.** "`ssr: false` option is not supported in Server Components. You will see an error if you try to use it in Server Components." react-best-practices' Monaco example (`dynamic(() => import('./monaco-editor').then(m => m.MonacoEditor), { ssr: false })`, Monaco "~300KB") [Vercel, react-best-practices, bundle-dynamic-imports] works only in a file with `'use client'` (below: the rule's code with `'use client'` added, per https://nextjs.org/docs/app/guides/lazy-loading):

  ```tsx
  'use client'

  import dynamic from 'next/dynamic'

  const MonacoEditor = dynamic(
    () => import('./monaco-editor').then(m => m.MonacoEditor),
    { ssr: false }
  )

  function CodePanel({ code }: { code: string }) {
    return <MonacoEditor value={code} />
  }
  ```

  The `.then(m => m.X)` form is the docs' way to import a named export; `{ loading: () => <p>Loading...</p> }` sets the placeholder.
- **Defer analytics and error tracking from a Client Component, not the root layout.** "Analytics, logging, and error tracking don't block user interaction. Load them after hydration." [Vercel, react-best-practices, bundle-defer-third-party] The rule's fix puts `dynamic(() => import('@vercel/analytics/react').then(m => m.Analytics), { ssr: false })` straight into `RootLayout`, which is a Server Component, where the docs say that errors. Move the `dynamic()` call into a `'use client'` wrapper and render the wrapper from the layout. Third-party `<script>` tags take a `next/script` `strategy` instead ([NEXTJS.md](NEXTJS.md#nextscript)); "Do not move required bot detection, consent, auth, or payment scripts later without product evidence" [Vercel, vercel-optimize, support-topics/next-script-third-party-strategy.md].
- **Load on activation.** Import a library inside the handler that needs it, as the docs do with `fuse.js` (`const Fuse = (await import('fuse.js')).default` in `onChange`), or in an Effect once a feature turns on, with a fallback: `import('./animation-frames.js').then(mod => setFrames(mod.frames)).catch(() => setEnabled(false))` [Vercel, react-best-practices, bundle-conditional].
- **Preload on intent.** Start the chunk on hover or focus so the click finds it loaded [Vercel, react-best-practices, bundle-preload]:

  ```tsx
  function EditorButton({ onClick }: { onClick: () => void }) {
    const preload = () => {
      if (typeof window !== 'undefined') {
        void import('./monaco-editor')
      }
    }

    return (
      <button
        onMouseEnter={preload}
        onFocus={preload}
        onClick={onClick}
      >
        Open Editor
      </button>
    )
  }
  ```

  The rules say the `typeof window !== 'undefined'` check "prevents bundling preloaded modules for SSR"; no Next.js page checked says so, so don't count on it for server bundle size.
- **Check the output.** Confirm the build produced the split chunk; the general rule is in [web-performance BROWSER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/BROWSER.md#bundle).

## Paths the bundler can analyze

"If you hide the real path inside a variable or compose it too dynamically, the tool either has to include a broad set of possible files, warn that it cannot analyze the import, or widen file tracing to stay safe." The costs: "Larger server bundles, Slower builds, Worse cold starts, More memory use" [Vercel, react-best-practices, bundle-analyzable-paths].

Incorrect (the bundler cannot tell what may be imported):

```ts
const PAGE_MODULES = {
  home: './pages/home',
  settings: './pages/settings',
} as const

const Page = await import(PAGE_MODULES[pageName])
```

Correct (use an explicit map of allowed modules):

```ts
const PAGE_MODULES = {
  home: () => import('./pages/home'),
  settings: () => import('./pages/settings'),
} as const

const Page = await PAGE_MODULES[pageName]()
```

- **Make each file-system path literal at the call site:** `kind === ContentKind.Blog ? path.join(process.cwd(), 'content/blog') : path.join(process.cwd(), 'content/docs')`, not `path.join(process.cwd(), 'content/' + contentKind)`. Next.js "will use `@vercel/nft` to statically analyze `import`, `require`, and `fs` usage" for output tracing, with `outputFileTracingIncludes` and `outputFileTracingExcludes` as the escape hatches (https://nextjs.org/docs/app/api-reference/config/next-config-js/output).

## Prove it

- A server trace of each slow page shows independent fetches starting together; no child's fetch starts after its parent's `await` returns, and no private read starts before its auth check.
- A `React.cache` function called twice with the same primitive arguments in one request runs its query once.
- The RSC payload for a page carrying a large record holds only the fields the client renders, and no Server Action returns a raw row.
- Every `useSWRMutation` and `useSWRImmutable` import uses the default export from `swr/mutation` and `swr/immutable`; TanStack Query has one `QueryClient` per server render.
- `next.config.*` `optimizePackageImports` lists no package from the default list; the build's bundle analysis shows icon imports pulling only the icons used.
- `ssr: false` appears only in `'use client'` files, `next build` passes, and the network panel shows the dynamic chunk loading on hover, focus or activation, not on first paint.
