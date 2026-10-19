# Next.js (App Router, version 16)

Next.js App Router facts that decide whether code is correct on the current major (16): where the server and client boundary sits, how Server Actions are reached and checked, Cache Components and its directives, Route Handler caching, `proxy.ts`, `after()`, `next/image`, `next/font`, `next/script` and the default browser targets. Every API line was re-checked against the nextjs.org page it cites (fetched 2026-10-18), with the version each feature became stable or changed. Advice comes from Vercel's react-best-practices and vercel-optimize skills (MIT), tagged per bullet; where a source drifted from the docs, the docs' form is written and the line says what the source said. Data flow, waterfalls and bundles are in [DATA-AND-BUNDLES.md](DATA-AND-BUNDLES.md); Effects and hydration-safe reads in [EFFECTS-AND-STATE.md](EFFECTS-AND-STATE.md); Actions, `useActionState` and `use` in [REACT-19.md](REACT-19.md). Severity uses the P0 to P3 scale of [code-review REVIEWER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/REVIEWER.md): Vercel's CRITICAL and HIGH are written as P1, MEDIUM as P2, LOW as P3.

**Contents:** [Versions](#versions) · [Server and Client Components](#server-and-client-components) · [Server Actions and their auth](#server-actions-and-their-auth) · [Cache Components](#cache-components) · [use cache](#use-cache) · [cacheLife](#cachelife) · [cacheTag, updateTag and revalidateTag](#cachetag-updatetag-and-revalidatetag) · [Static shell and dynamic holes](#static-shell-and-dynamic-holes) · [Route Handler caching](#route-handler-caching) · [proxy.ts (formerly middleware)](#proxyts-formerly-middleware) · [after()](#after) · [next/image](#nextimage) · [next/font](#nextfont) · [next/script](#nextscript) · [Browser targets](#browser-targets) · [Prove it](#prove-it)

## Versions

From each page's version history:

| Feature | Version | Source |
|---|---|---|
| GET Route Handlers no longer cached by default ("changed from static to dynamic"); `context.params` is a promise | 15.0.0-RC | https://nextjs.org/docs/app/api-reference/file-conventions/route |
| `connection()` stable | 15.0.0 | https://nextjs.org/docs/app/api-reference/functions/connection |
| `after` stable (`unstable_after` was 15.0.0-rc) | 15.1.0 | https://nextjs.org/docs/app/api-reference/functions/after |
| Middleware on the Node.js runtime stable (experimental in 15.2.0) | 15.5.0 | https://nextjs.org/docs/app/api-reference/file-conventions/proxy |
| `cacheComponents` stable, moved from `experimental.cacheComponents` to top level | 16.0.0 | https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents |
| `"use cache"` stable (experimental since 15.0.0) | 16.0.0 | https://nextjs.org/docs/app/api-reference/directives/use-cache |
| `"use cache: remote"` | 16.0.0 | https://nextjs.org/docs/app/api-reference/directives/use-cache-remote |
| `cacheLife`, `cacheTag` stable; `unstable_cacheLife`, `unstable_cacheTag` deprecated | 16.0.0 | https://nextjs.org/docs/app/api-reference/functions/cacheLife |
| Middleware deprecated and renamed to Proxy; Proxy defaults to Node.js | 16.0.0 | https://nextjs.org/docs/app/api-reference/file-conventions/proxy |
| `next/image`: `preload` added, `priority` deprecated, `qualities` default `[75]` | 16.0.0 | https://nextjs.org/docs/app/api-reference/components/image |
| `runtime = 'edge'` no longer supported (Next.js docs: "deprecated") | 16.3 | https://vercel.com/docs/functions/runtimes/edge |

vercel-optimize's version table says `'use cache'`, `cacheLife()` and `cacheTag()` need "Next ≥ 15.0" and `after()` "Next ≥ 15.0" [Vercel, vercel-optimize, references/recommendations.md]; the rows above are the documented versions, and in 15 `'use cache'` was experimental.

## Server and Client Components

https://nextjs.org/docs/app/getting-started/server-and-client-components (checked 2026-10-18):

- **Layouts and pages are Server Components by default.** Client Components are for state and event handlers, Effects, browser-only APIs (`localStorage`, `window`) and custom hooks; Server Components for data close to the source, secrets, and less JavaScript.
- **`"use client"` marks a boundary, not a component.** "Once a file is marked with `"use client"`, **all of its imports and the components it directly renders are included in the client bundle**." It "does not apply to Server Components passed as children or other props"; those are rendered on the server and passed in as rendered output.
- **Put the directive on the interactive leaf.** "add `'use client'` at the top of the files that define your interactive components instead of marking large parts of your UI as Client Components": a layout stays a Server Component and only `<Search />` is a Client Component.
- **Nest server UI inside client UI through `children`.** A `'use client'` `<Modal>` takes `children`, and the page renders `<Modal><Cart /></Modal>` with `<Cart>` fetching on the server.
- **Props crossing the boundary "need to be serializable by React".** What to send across is in [DATA-AND-BUNDLES.md](DATA-AND-BUNDLES.md#what-crosses-the-rsc-boundary).
- **Context lives in a Client Component provider** that takes `children`, rendered from the layout. "render providers as deep as possible in the tree", so `ThemeProvider` wraps `{children}`, not the whole `<html>`.
- **Third-party components that use client features without the directive** fail in a Server Component; re-export them from your own file:

  ```tsx
  'use client'

  import { Carousel } from 'acme-carousel'

  export default Carousel
  ```

- **Mark server-only modules** with `import 'server-only'`: importing one into a Client Component is a build-time error. `client-only` is the reverse. Only `NEXT_PUBLIC_` environment variables reach the client bundle; others become an empty string there.
- **Client Components also run on the server** during prerendering, "but must follow the same security assumptions as code running in the browser" (https://nextjs.org/docs/app/guides/data-security).

## Server Actions and their auth

The full rule and the validate, authenticate, authorize, mutate example are in [secure-coding AUTH.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/secure-coding/AUTH.md#nextjs-server-actions). What a Next.js reviewer checks (P1, the source's CRITICAL) [Vercel, react-best-practices, server-auth-actions]:

- **Every action re-checks the caller.** "Server Functions are reachable via direct POST requests, not just through your application's UI. Always verify authentication and authorization inside every Server Function" (https://nextjs.org/docs/app/getting-started/mutating-data). "A page-level authentication check does not extend to the Server Actions defined within it": the page's redirect controls which UI renders, but "the Server Action is a separate entry point and must verify the caller on its own" (https://nextjs.org/docs/app/guides/data-security).
- **Authorization is per resource,** against IDOR (data-security guide):

  ```tsx
  'use server'

  import { auth } from '@/lib/auth'
  import { db } from '@/lib/db'

  export async function deletePost(postId: string) {
    const session = await auth()
    if (!session?.user) {
      throw new Error('Unauthorized')
    }

    const post = await db.post.findUnique({ where: { id: postId } })

    // Check that the user owns this resource
    if (post.authorId !== session.user.id) {
      throw new Error('Forbidden')
    }

    await db.post.delete({ where: { id: postId } })
  }
  ```

- **Proxy is not the guard.** "A matcher change or a refactor that moves a Server Function to a different route can silently remove Proxy coverage. Always verify authentication and authorization inside each Server Function rather than relying on Proxy alone." (https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- **Return only what the UI needs:** "Server Action return values are serialized and sent to the client. Only return what the UI needs, not raw database records" (`return { success: true }`, not the updated row).
- **Closed-over values travel to the client and back.** An action defined inside a component captures outer variables; Next.js encrypts them with a per-build key, so "actions can only be invoked for a specific build", but "We don't recommend relying on encryption alone to prevent sensitive values from being exposed on the client."
- **CSRF:** actions accept only `POST`, and Next.js compares the `Origin` host with `x-forwarded-host` or `host`. "A request that carries no `Origin` header at all is allowed through with a warning rather than rejected." Behind a proxy that forwards its own host, list the browser-visible host in `experimental.serverActions.allowedOrigins` (`*` is one label, `**` one or more, ports are never wildcarded) (https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions).
- **Mutations never run during render.** "Next.js explicitly prevents setting cookies or triggering cache revalidation within render methods"; a logout goes through `<form action={logout}>`.

## Cache Components

https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents (checked 2026-10-18). Stable in 16.0.0; it "controls the `ppr`, `useCache`, and `dynamicIO` flags as a single, unified configuration". "Data fetching is dynamic by default, and you choose what to cache at the page, component, or function level." Next.js prerenders a static HTML shell and streams the rest.

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
}

export default nextConfig
```

- **Set `partialPrefetching` explicitly.** "Leaving it unset logs a warning"; set it to `false` only while migrating an app that adopted Cache Components before Partial Prefetching. "Both features will be enabled everywhere in the next major release, and the options will be removed."
- **Node.js only.** Cache Components "does not support the `runtime` route segment config. Remove any `runtime` export, including `runtime = 'nodejs'`."
- **Removed route segment configs.** "route segments that still export `dynamic`, `revalidate`, or `fetchCache` will error", and exporting `dynamicParams` "fails the build" (https://nextjs.org/docs/app/guides/migrating-to-cache-components). Replace `dynamicParams: false` with `notFound()` in the page.
- **Navigation keeps state with `<Activity>`.** The previous route is set to `"hidden"` instead of unmounted: state survives back navigation, and "Effects are cleaned up when a route is hidden, and recreated when it becomes visible again". Dropdowns and dialogs that assumed an unmount need the Preserving UI state guide.
- **Don't reach for the old switches.** "Do not suggest `dynamic`, `revalidate`, or `fetchCache` as the primary fix when Cache Components is enabled." The question is "whether the route can keep a static shell while dynamic data moves behind explicit cached or runtime boundaries" [Vercel, vercel-optimize, support-topics/cache-components-static-shell-boundaries.md].

## use cache

https://nextjs.org/docs/app/api-reference/directives/use-cache (checked 2026-10-18):

- **Where:** at the top of a file (every export cached), a component or a function. "Functions and components that use `use cache` must be async." In a Route Handler, "`use cache` cannot be used directly inside a Route Handler body; extract it to a helper function" (https://nextjs.org/docs/app/getting-started/route-handlers).
- **The key** is the build ID (or `deploymentId`), a hash of the function's location and signature, its serializable arguments, and captured outer variables ("automatically captured and bound as arguments").
- **Arguments and return values must serialize.** Arguments: primitives, plain objects, arrays, Dates, Maps, Sets, TypedArrays, ArrayBuffers; return values also JSX. Not class instances, functions, symbols, WeakMaps, WeakSets or URL instances. `children` and Server Actions pass through "as long as you don't introspect them".
- **No request-time APIs inside,** down the whole call stack: `cookies()`, `headers()` or `searchParams` in a helper fails with `next-request-in-use-cache`, and on a dynamic route "it can pass `next build` and fail under `next start`". Read them outside and pass the values in. `draftMode().isEnabled` is the one allowed read.
- **`React.cache` is isolated** inside a `use cache` scope: a value stored outside "is not visible inside it". Pass data as arguments.
- **In memory per instance by default.** On serverless, "Cache entries typically don't persist across requests (each request can be a different instance), or during revalidation. Build-time caching works normally." Self-hosted entries persist; size them with `cacheMaxMemorySize`. Neither directive survives a new deploy, because the key includes the build ID.
- **`'use cache: remote'`** stores output in a platform cache handler shared by all instances, at the cost of "infrastructure cost and network latency during cache lookups". Skip it when "operations are already fast (< 50ms)" (https://nextjs.org/docs/app/api-reference/directives/use-cache-remote). vercel-optimize adds "Avoid sub-ms reads (Edge Config)" [Vercel, vercel-optimize, support-topics/use-cache-remote-shared-origin-data.md].
- **Random values and timestamps** (`Math.random()`, `Date.now()`, `crypto.randomUUID()`) must be handled explicitly: per request, call `await connection()` first and wrap the component in `<Suspense>`; or cache the value inside `'use cache'` "so all users see the same value until revalidation" (https://nextjs.org/docs/app/getting-started/caching). vercel-optimize's scanner flags `new Date(`, `Date.now(` and `Math.random(` in a `'use cache'` file because it "forces a fresh ISR write on every regeneration" and says "Do not pass dates as arguments to `'use cache'` functions" [Vercel, vercel-optimize, lib/scanners/use-cache-date-stamp.mjs]; the docs show caching a random value as a supported choice, so treat the scanner's line as a cost warning, not a rule.
- **Don't copy "Default `'use cache'` does not dedupe identical calls across separate `<Suspense>` boundaries"** [Vercel, vercel-optimize, lib/scanners/cache-components-suspense-dedupe.mjs]: the docs say "Every later call with the same inputs reuses that output, within a render pass and across requests, for as long as the entry lasts."

## cacheLife

https://nextjs.org/docs/app/api-reference/functions/cacheLife (checked 2026-10-18). Import from `next/cache`; call it inside a cache directive scope only ("Calling it at the top level of a file will throw an error").

| Profile | `stale` | `revalidate` | `expire` |
|---|---|---|---|
| `default` | 5 minutes | 15 minutes | never |
| `seconds` | 30 seconds | 1 second | 1 minute |
| `minutes` | 5 minutes | 1 minute | 1 hour |
| `hours` | 5 minutes | 1 hour | 1 day |
| `days` | 5 minutes | 1 day | 1 week |
| `weeks` | 5 minutes | 1 week | 30 days |
| `max` | 5 minutes | 30 days | 1 year |

- **Set one in every `use cache` scope;** omitting it applies `default` implicitly. "Avoid abstracting it into shared utilities", and "ensure only one call executes per function invocation" (branches may pick different profiles). Custom values inline, as the docs' one-off example: `cacheLife({ stale: 3600, revalidate: 900, expire: 86400 })`; `expire` must be longer than `revalidate`.
- **`stale` is the client router's cache, not `Cache-Control`.** It travels in `x-nextjs-stale-time`, with "Minimum of 30 seconds is enforced". A revalidation call from a Server Action clears the whole client cache. What this proves for CDN headers is in [performance-and-caching CACHING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/CACHING.md#cachelife-in-nextjs-16-what-it-proves-and-what-it-doesnt).
- **Short lifetimes leave holes in the prerender:** `revalidate` of `0` or `expire` under 5 minutes is "excluded from prerenders, becoming a 'dynamic hole' resolved at request time"; `stale` under 30 seconds is excluded too; `stale` from 30 seconds to under 5 minutes is prerendered but kept out of the App Shell. Of the presets, only `seconds` falls under these. Wrap such caches in `<Suspense>`.
- **Nesting:** a short-lived `use cache` inside one without an explicit `cacheLife` "fails the build during prerendering".

## cacheTag, updateTag and revalidateTag

https://nextjs.org/docs/app/api-reference/functions/cacheTag, https://nextjs.org/docs/app/api-reference/functions/updateTag, https://nextjs.org/docs/app/api-reference/functions/revalidateTag (checked 2026-10-18):

```tsx
import { cacheTag } from 'next/cache'

export async function getData() {
  'use cache'
  cacheTag('my-data')
  const res = await fetch('https://api.example.com/data')
  const data = await res.json()
  return data
}
```

- **`cacheTag`** takes one or more strings: up to 128 tags per call, 256 characters each; longer tags are skipped and extra tags dropped, with a console warning. Tags are case-sensitive. `fetch(url, { next: { tags: ['posts'] } })` tags a fetch.
- **`updateTag(tag)` for read-your-own-writes,** "only" inside Server Actions: the next request "will wait to fetch fresh data rather than serving stale content".
- **`revalidateTag(tag, 'max')` when stale is acceptable,** in Server Functions and Route Handlers (not Client Components or Proxy): the next request is served stale while it revalidates. `revalidateTag(tag, { expire: 0 })` expires at once, for a webhook calling a Route Handler where `updateTag` isn't available. "A revalidation is triggered by a request, not by the `revalidateTag` call."
- **The one-argument `revalidateTag(tag)` is deprecated** and "Behaves like `{ expire: 0 }`"; migrate to `updateTag` in Server Actions or `'max'`.
- **A long lifetime on edited content needs a matching invalidation call** for the exact tag; "A cacheTag() in the cached function is not proof that CMS edits invalidate it" [Vercel, vercel-optimize, lib/verify-claim.mjs].

## Static shell and dynamic holes

- **Runtime data goes behind `<Suspense>`.** Components that read `cookies`, `headers`, `searchParams` or `params` "should be wrapped in `<Suspense>`"; an uncached fetch without one surfaces the blocking-route insight. "`<Suspense>` ... does not itself opt a component into dynamic rendering" (https://nextjs.org/docs/app/getting-started/caching).
- **A request-time read in a layout makes the whole segment dynamic.** For `cookies()`, `headers()` or `draftMode()` in a page, layout or template: "Move the dynamic API call into a child Server Component that lives inside a Suspense boundary". `export const dynamic = 'force-dynamic'` is "often a habit"; when the dynamism comes from those reads, "force-dynamic may be redundant - Next infers dynamic automatically". Don't remove dynamic rendering that auth, personalization, draft mode or per-request redirects need [Vercel, vercel-optimize, lib/scanners/headers-in-page.mjs, lib/scanners/force-dynamic.mjs, support-topics/dynamic-rendering-traps.md]. (Without Cache Components; with it, `dynamic` errors, above.)
- **A route-level `export const revalidate` is defeated** by `cookies()`, `headers()`, `draftMode()`, `connection()`, a `next/headers` import or an auth helper anywhere in the layout and template chain; prove it with `next build` or move the read out [Vercel, vercel-optimize, lib/verify-claim.mjs].
- **`params` without `generateStaticParams`:** pass the `params` promise into a `<Suspense>` boundary instead of awaiting it at the top, so the shell still prerenders (migrating guide).

## Route Handler caching

https://nextjs.org/docs/app/getting-started/route-handlers (checked 2026-10-18):

- **Not cached by default** since 15.0.0-RC. Only `GET` can opt in; "Other supported HTTP methods are **not** cached, even if they are placed alongside a `GET` method that is cached, in the same file." Without Cache Components the opt-in is `export const dynamic = 'force-static'`.
- **With Cache Components,** `GET` handlers "follow the same model as normal UI routes": prerendered when they touch no uncached or runtime data, request-time otherwise. Prerendering stops at network requests, database queries, async file system operations, request properties (`req.url`, `request.headers`, `request.cookies`, `request.body`), `cookies()`, `headers()`, `connection()` or non-deterministic operations.
- **Cache the data in a helper:**

  ```tsx
  import { cacheLife } from 'next/cache'

  export async function GET() {
    const products = await getProducts()
    return Response.json(products)
  }

  async function getProducts() {
    'use cache'
    cacheLife('hours')

    return await db.query('SELECT * FROM products')
  }
  ```

- **CDN headers** for handlers that set `Cache-Control` (`s-maxage`, 404s, `Vary`) are in [performance-and-caching CACHING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/CACHING.md#cdn-caching-on-vercel).

## proxy.ts (formerly middleware)

https://nextjs.org/docs/app/api-reference/file-conventions/proxy (checked 2026-10-18). In 16.0.0 "Middleware is deprecated and renamed to Proxy. Proxy defaults to the Node.js runtime". vercel-optimize's scanners only look for `middleware.{ts,js,mjs}` and call it "middleware (always edge)" [Vercel, vercel-optimize, lib/scanners/middleware-broad-matcher.mjs, lib/scanners/edge-heavy-import.mjs]; on 16 the file is `proxy.ts` and runs on Node.js.

- **One file** at the project root (or in `src`), beside `app`, exporting one function, default or named `proxy`:

  ```tsx
  import { NextResponse } from 'next/server'
  import type { NextRequest } from 'next/server'

  // This function can be marked `async` if using `await` inside
  export function proxy(request: NextRequest) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  export const config = {
    matcher: '/about/:path*',
  }
  ```

- **Migrate with the codemod:** `npx @next/codemod@canary middleware-to-proxy .` renames the file and `middleware()` to `proxy()`.
- **No `runtime` option.** "Setting the `runtime` config option in Proxy will throw an error."
- **Always give it a matcher.** "Without a `matcher`, Proxy runs on **every request**, including static files (`_next/static`), image optimizations (`_next/image`), and assets in the `public/` folder", so auth logic or redirects "can unintentionally block CSS, JS, or images from loading". The docs' negative match:

  ```js
  export const config = {
    matcher: [
      /*
       * Match all request paths except for the ones starting with:
       * - api (API routes)
       * - _next/static (static files)
       * - _next/image (image optimization files)
       * - favicon.ico, sitemap.xml, robots.txt (metadata files)
       */
      '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
  }
  ```

  vercel-optimize flags no matcher, `"/"` or `"/(.*)"`, and fixes with `"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"` [Vercel, vercel-optimize, lib/scanners/middleware-broad-matcher.mjs].
- **A last resort, without shared state.** "We recommend users avoid relying on Middleware unless no other options exist." "you should not attempt relying on shared modules or globals"; pass information on through headers, cookies, rewrites, redirects or the URL.
- **Not the auth boundary** for Server Actions ([above](#server-actions-and-their-auth)).

## after()

https://nextjs.org/docs/app/api-reference/functions/after (checked 2026-10-18). Stable since 15.1.0. `import { after } from 'next/server'` schedules a callback after the response (or prerender) finishes.

- **Where:** Server Components (including `generateMetadata`), Server Functions, Route Handlers and Proxy. The source lists only "Server Actions, Route Handlers, and Server Components" [Vercel, react-best-practices, server-after-nonblocking].
- **Request APIs inside the callback:** allowed in Route Handlers and Server Functions (`(await headers()).get('user-agent')`); in Server Components "**cannot** use `cookies`, `headers`, or other Request-time APIs inside `after`": read them before and pass the values in.
- **It is not a request-time API:** it doesn't make a route dynamic, and on a static page the callback runs at build time or on revalidation.
- **It runs anyway:** "even if the response didn't complete successfully. Including when an error is thrown or when `notFound` or `redirect` is called." It runs for the route's max duration (`maxDuration`). `React.cache` dedupes inside it, and calls can nest.
- **Only for work you can lose.** vercel-optimize: "Do not move work that decides the response, must fail the request, changes visible state synchronously, or needs a durable retry guarantee" [Vercel, vercel-optimize, support-topics/post-response-work-waituntil.md]. react-best-practices lists "Sending notifications" and "Cache invalidation" among its uses [Vercel, react-best-practices, server-after-nonblocking]; this repo's rule is "**Accepted means durable.** ... An in-memory queue or a fire-and-forget promise is lost on the next deploy" ([background-jobs SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/background-jobs/SKILL.md)). Keep `after()` to logs and analytics; a notification the user must get goes to a durable job.

## next/image

https://nextjs.org/docs/app/api-reference/components/image (checked 2026-10-18):

- **`preload` replaces `priority`** (16.0.0): "Starting with Next.js 16, the `priority` property has been deprecated in favor of the `preload` property". `preload` inserts a `<link>` in the `<head>`; use it for the LCP or above-the-fold hero image, not "When you have multiple images that could be considered the Largest Contentful Paint (LCP) element depending on the viewport", and not together with `loading` or `fetchPriority`.
- **Usually prefer the attributes:** "In most cases, you should use `loading="eager"` or `fetchPriority="high"` instead of `preload`." `loading` defaults to `lazy`; `fetchPriority` passes through to the `img`. For theme-swapped images, `preload` or `loading="eager"` would load both, so use `fetchPriority="high"`.
- **`sizes` with `fill` or CSS-responsive images.** Without it "the browser assumes the image will be as wide as the viewport (`100vw`)", and a `fill` image gets a `srcset` from `deviceSizes` only.
- **`unoptimized` for small (under 1 KB), SVG and animated GIF images.** SVG is not optimized by default, and `unoptimized` "happens automatically when `src` ends with `".svg"`". vercel-optimize's scanner flags `<Image src=".svg">` without `unoptimized` [Vercel, vercel-optimize, lib/scanners/unoptimized-image.mjs]; that only matters for an SVG whose URL doesn't end in `.svg`.
- **`qualities` defaults to `[75]`** in 16.
- **On a slow LCP,** first prove the LCP element is an image, then check `fill` without `sizes`, a deprecated `priority`, and `preload`/`fetchPriority`; "Do not preload multiple possible LCP images" [Vercel, vercel-optimize, support-topics/next-image-lcp-preload-sizes.md]. Don't route tiny icons, SVG UI assets or animated GIFs through optimization [Vercel, vercel-optimize, support-topics/image-optimization-cost-control.md].
- "Above-fold critical images: `priority` or `fetchpriority="high"`" [Vercel, web-design-guidelines] predates 16; use `preload` or `fetchPriority`.

## next/font

https://nextjs.org/docs/app/api-reference/components/font (checked 2026-10-18). `next/font` since 13.2.0 (renamed from `@next/font`). It self-hosts every font file; for Google Fonts "CSS and font files are downloaded at build time", and "No requests are sent to Google by the browser."

```tsx
import { Inter } from 'next/font/google'

// If loading a variable font, you don't need to specify the font weight
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})
```

- **`weight` is required** for a non-variable font; `subsets` lists what is preloaded; `display` defaults to `'swap'`; `preload` defaults to `true`; `adjustFontFallback` (default `true` for Google, `'Arial'` for local) adds a fallback font "to reduce Cumulative Layout Shift".
- **Preloading follows the file type:** a font called in a page preloads on that route, in a layout on every route under it, in the root layout on all routes.
- **Call each font once.** Each call is "hosted as one instance", so define fonts in one file (`styles/fonts.ts`) and import the objects.
- **Fonts as a CLS fix** only "when the route actually loads external font CSS or swaps text after render"; "Do not migrate fonts when CLS is caused by images, ads, embeds, or injected UI." [Vercel, vercel-optimize, support-topics/next-font-cls-self-hosting.md].
- A hand-written font preload needs `crossorigin`; that is in [web-performance BROWSER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/BROWSER.md#connections-fonts-and-scripts).

## next/script

https://nextjs.org/docs/app/api-reference/components/script (checked 2026-10-18). `next/script` since 11.0.0; `beforeInteractive` and `afterInteractive` support `app` since 13.0.0. Plain `defer` and `async` are in [web-performance BROWSER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/BROWSER.md#connections-fonts-and-scripts).

| `strategy` | When it loads | Docs' examples |
|---|---|---|
| `beforeInteractive` | "before any Next.js code and before any page hydration occurs" | bot detectors, cookie consent managers |
| `afterInteractive` (**default**) | "early but after some hydration on the page occurs" | tag managers, analytics |
| `lazyOnload` | "during browser idle time", after all page resources | chat support plugins, social media widgets |
| `worker` (experimental) | in a web worker | "does not yet work with the App Router" |

- **`beforeInteractive` goes in the root layout** ("must be placed inside a root layout, such as `app/layout.tsx`"), "should only be used for critical scripts", is always injected into the `head`, its execution "does not block page hydration", and it runs "once per document load" (not again on client navigation). react-best-practices' example puts a DOM-dependent script in a Page with `beforeInteractive` [Vercel, react-best-practices, rendering-script-defer-async]; that is the wrong place and the wrong job.
- **A consent manager cannot gate a `beforeInteractive` script.** The docs list "cookie consent managers" as a `beforeInteractive` use, but a consent provider's network blocker "cannot stop" code that runs before the provider renders, "such as `next/script` with `beforeInteractive`"; so load vendors through the consent manager's script loader, never `beforeInteractive` or a plain `next/script` [c15t, https://c15t.com/docs/frameworks/react/network-blocker.md]. The rules are [cookie-consent SCRIPT-GATING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/cookie-consent/SCRIPT-GATING.md#the-network-blocker).
- **Move a third-party script later only with proof** it blocks rendering, hydration or interaction; "Do not move required bot detection, consent, auth, or payment scripts later without product evidence" [Vercel, vercel-optimize, support-topics/next-script-third-party-strategy.md]. Its marketing playbook's "Cookie banner blocks first paint ... Defer; render after hydration" [Vercel, vercel-optimize, playbooks/marketing.md] contradicts that and the docs' `beforeInteractive` list; don't copy it.

## Browser targets

https://nextjs.org/docs/architecture/supported-browsers (checked 2026-10-18):

- **Zero-config targets:** Chrome 111+, Edge 111+, Firefox 111+, Safari 16.4+, as the default Browserslist `["chrome 111", "edge 111", "firefox 111", "safari 16.4"]`.
- **Change them in `package.json` `"browserslist"`.** css-modern-features says to check `next.config.*` "for `browserslist` or `transpilePackages`" [css-modern-features]; the docs page names only `package.json` as where Next.js reads a Browserslist configuration.
- **Polyfills:** Next.js injects `fetch()`, `URL` and `Object.assign()` only for browsers that need them; your own go in `instrumentation-client.ts` (`import './polyfills'`), or load one conditionally (`if (!('structuredClone' in globalThis)) { const mod = await import('polyfills/structured-clone') ... }`).
- CSS newer than these targets needs a fallback ([modern-css SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/SKILL.md)).

## Prove it

- `next build` passes with `cacheComponents: true` and `partialPrefetching` set, no route exports `dynamic`, `revalidate`, `fetchCache`, `dynamicParams` or `runtime`, and `next start` serves every dynamic route without `next-request-in-use-cache`.
- A grep finds no `middleware.ts`, no `unstable_cacheLife` or `unstable_cacheTag`, no one-argument `revalidateTag(`, and no `priority` on `<Image>`.
- Every `use cache` scope calls `cacheLife`, and each `cacheTag` has a matching `updateTag` or `revalidateTag` for the exact string.
- A `curl -X POST` to each Server Action without a session, and with another user's resource id, is refused; no action returns a raw database row.
- The Proxy matcher excludes `_next/static`, `_next/image` and public assets: CSS, JS and images load for a signed-out visitor.
- `after()` holds only logs and analytics; every `beforeInteractive` script sits in the root layout.
- The LCP image (proved in a trace) has `fetchPriority="high"` or `preload`, and every `fill` image has `sizes`.
