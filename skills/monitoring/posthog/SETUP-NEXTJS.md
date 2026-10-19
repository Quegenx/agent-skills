# Next.js setup

Next.js uses two SDKs: `posthog-js` in the browser and `posthog-node` on the server. The browser side initializes once in `instrumentation-client.ts`, which serves both the app router and the pages router; the server side runs in short-lived functions, so whether events arrive depends on flushing before the function returns, and whether they join the right person depends on using the same distinct ID as the client. The general rules (commandments, CSP, bundles, tracing headers) are in [SETUP-WEB.md](SETUP-WEB.md); the Next.js reverse proxy recipes are in [PROXY-AND-PRIVACY.md](PROXY-AND-PRIVACY.md); init options in [CONFIG-WEB.md](CONFIG-WEB.md); the Node SDK itself in [SETUP-SERVER.md](SETUP-SERVER.md); `identify` in [IDENTITY.md](IDENTITY.md); server-side flag evaluation in [FEATURE-FLAGS.md](FEATURE-FLAGS.md).

## Client

- **Install and set env** in `.env.local` and the hosting provider. The names need the `NEXT_PUBLIC_` prefix to reach the client. The demo app is `https://github.com/PostHog/posthog-js/tree/main/playground/nextjs`; `npx @posthog/wizard` can do the setup.

```shell
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=<ph_project_token>
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

  (EU: `https://eu.i.posthog.com`.)
- **`instrumentation-client.ts|js` at the project root**, for both routers:

```typescript
import posthog from 'posthog-js'

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  defaults: '2026-05-30'
});
```

- **The example apps' version** routes through a `/ingest` proxy, turns on exception capture and debug in development:

```ts
import posthog from "posthog-js"

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  api_host: "/ingest",
  ui_host: "https://us.posthog.com",
  // Include the defaults option as required by PostHog
  defaults: '2026-01-30',
  // Enables capturing unhandled exceptions via Error Tracking
  capture_exceptions: true,
  // Turn on debug in development mode
  debug: process.env.NODE_ENV === "development",
});

//IMPORTANT: Never combine this approach with other client-side PostHog initialization approaches, especially components like a PostHogProvider. instrumentation-client.ts is the correct solution for initializating client-side PostHog in Next.js 15.3+ apps.
```

  Both snippets use non-null assertions on the token; the missing-config commandment in [SETUP-WEB.md](SETUP-WEB.md#the-commandments) asks for a guard instead.
- **Use it anywhere after init:** `import posthog from 'posthog-js'` in a `"use client"` component and call `posthog.capture("test_event")`. No provider is needed: React flag hooks from `@posthog/react` (for example `useFeatureFlagEnabled("new-feature")` in a `"use client"` component) work with the `instrumentation-client.ts` singleton.
- **Don't add a `PostHogProvider` on top.** The example apps say never to combine `instrumentation-client.ts` with another client-side initialization, especially a provider.
- **Bootstrapping is limited:** values passed to `init` in `instrumentation-client` stay fixed for the whole session, so bootstrapping only works when flags are evaluated before the app renders (on the server). Otherwise evaluate on the server and pass the value in, or evaluate in an earlier page or state and reuse it, as long as client and server use the same `distinct_id`.
- **SSR hydration errors** from injected scripts: `external_scripts_inject_target: 'head'` (the default from `defaults: '2026-01-30'`; see [CONFIG-WEB.md](CONFIG-WEB.md)).

### Provider-based router alternatives

The error-tracking source also describes these alternatives; the example-app guidance above says not to combine a provider with `instrumentation-client.ts`. Keep the source views distinct and use only one initialization path. [PostHog skills, ERROR-TRACKING.md; SETUP-NEXTJS.md]

- **App router alternative:** `app/providers.tsx` with `'use client'`, `posthog.init(...)` inside `useEffect(() => {...}, [])`, children wrapped in `PostHogProvider as PHProvider` from `@posthog/react` with `client={posthog}`; wrap it in `app/layout.tsx`.
- **Pages router:** `pages/_app.tsx`, init in `useEffect` with `loaded: (posthog) => { if (process.env.NODE_ENV === 'development') posthog.debug() }`, wrapped in `<PostHogProvider client={posthog}>`.

### `@posthog/next` (pre-release)

A simplified integration with synchronized client and server identity, server-side flag bootstrapping and a built-in API proxy (`/docs/libraries/next-js/posthog-next.md`).

- **Its middleware's `proxy?: boolean | PostHogProxyOptions`** rewrites requests under a path prefix (default `/ingest`) to the PostHog ingest host; set `api_host` to that prefix (for example `/ingest`) in the `PostHogProvider` options.
- **Server request errors:** `instrumentation.ts` with `export { onRequestError } from '@posthog/next'` captures them as `$exception`.

## Server

- **Install `posthog-node`** (`npm install posthog-node --save`). Server functions in Next.js can be short-lived, so the client sends each capture immediately (`flushAt: 1`, the number of captures per flushed batch; `flushInterval: 0`, the milliseconds before flushing).
- **App router factory:**

```javascript
// app/posthog.js
import { PostHog } from 'posthog-node'

export default function PostHogClient() {
  const posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0
  })
  return posthogClient
}
```

  In a server component: `const flags = await posthog.getAllFlags('user_distinct_id'); await posthog.shutdown()`, then render on `flags['main-cta']`.
- **Pages router `getServerSideProps`:** get the session with `getServerSession(ctx.req, ctx.res, authOptions)` (pass `authOptions`, or your session callbacks don't run), create `new PostHog(token, { host })`, take `distinctId = session.user.id` (a stable ID from your auth system, not an email), call `client.getAllFlags(distinctId)` and `client.capture({ distinctId, event: 'loaded blog article', properties: { $current_url: ctx.req.url } })`, then `await client.shutdown()`.
- **next-auth leaves `session.user.id` undefined** (the session is `{ name, email, image }`) until a session callback adds it: `session.user.id = token?.sub ?? user.id` (JWT sessions carry the ID in `token.sub`, database sessions in `user.id`). Capturing with an `undefined` distinct ID creates events that belong to nobody, so check that the ID arrives.
- **The example apps' server client** is a lazy singleton in `src/lib/posthog-server.ts`: `new PostHog(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, { host: process.env.NEXT_PUBLIC_POSTHOG_HOST, flushAt: 1, flushInterval: 0 })` plus `export async function shutdownPostHog() { if (posthogClient) { await posthogClient.shutdown(); } }` (the app router version also calls `posthogClient.debug(true)`). Their login route (`src/app/api/auth/login/route.ts` POST, or `src/pages/api/auth/login.ts`):

```ts
const posthog = getPostHogClient();
posthog.capture({
  distinctId: username,
  event: 'server_login',
  properties: {
    isNewUser: isNewUser,
    source: 'api'
  }
});

// Identify user on server side
posthog.identify({
  distinctId: username,
  properties: {
    username: username,
    createdAt: isNewUser ? new Date().toISOString() : undefined
  }
});

// This handler is short-lived; flush so the enqueued events send before it returns
await posthog.flush();
```

  The React Router examples say the opposite: identify once on the client, never on the server. Backend `identify` only updates person profiles (there are no anonymous sessions in backend SDKs). See [EVENTS.md](EVENTS.md).
- **Link to the browser session** with `tracing_headers` on the client ([SETUP-WEB.md](SETUP-WEB.md#linking-frontend-and-backend)), and use the same distinct ID on both sides.

### Request-error server factory

The request-error example in [ERROR-TRACKING.md](ERROR-TRACKING.md#nextjs) uses this lazy server factory. Its shared-client delivery follows [Flush or shut down](#flush-or-shut-down). [PostHog skills, ERROR-TRACKING.md]

```javascript
import { PostHog } from 'posthog-node'
let posthogInstance = null
export function getPostHogServer() {
  if (!posthogInstance) {
    posthogInstance = new PostHog(
      process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
      {
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        flushAt: 1,
        flushInterval: 0,
      }
    )
  }
  return posthogInstance
}
```

### Flush or shut down

- **`next-js.md`:** "Make sure to *always* call `await client.shutdown()` after sending events from the server-side", because PostHog queues events into batches and this flushes them.
- **The Next.js and TanStack Start example apps** keep one long-lived singleton and call `await posthog.flush()` at the end of each short-lived handler.
- **The Node SDK page:** `shutdown()` (timeout default 30000 ms) is for disposable clients and program exit, not after each request on a reused client (use `flush()`); in serverless (Vercel Functions) keep a shared client outside the handler and `await client.flush()` before returning, in `finally`. So: a client created per request gets `shutdown()`, a shared client gets `flush()`.

### Fetch cache

PostHog ignores the Next.js fetch cache by default. Opting in can return cached flag results:

```jsx
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN, {
  // ... your configuration
  fetch_options: {
    cache: 'force-cache', // Use Next.js cache
    next_options: {       // Passed to the `next` option for `fetch`
      revalidate: 60,     // Cache for 60 seconds
      tags: ['posthog'],  // Can be used with Next.js `revalidateTag` function
    },
  }
})
```

## Proxy

Reverse proxy options include PostHog's managed proxy (free on Cloud), Next.js rewrites in `next.config`, the Next.js proxy file (`middleware.js` before Next.js 16), or Vercel rewrites. The rewrites, the proxy file, the matcher pitfall with next-intl or NextAuth, and the Vercel costs are all in [PROXY-AND-PRIVACY.md](PROXY-AND-PRIVACY.md#nextjs).

## App router or pages router

| | App router | Pages router |
|---|---|---|
| Folder | `src/app/` | `src/pages/` |
| Layout | `layout.tsx`, metadata export | `_app.tsx`, `next/head` |
| API routes | `src/app/api/**/route.ts` | `src/pages/api/` |
| Client code | `'use client'` | no directive |
| Router hook | `useRouter` from `next/navigation` | `next/router` |
| Server rendering | server components by default | `getServerSideProps` |

The client init (`instrumentation-client.ts`) is identical in both. The pages router example's `next.config.ts` adds `reactStrictMode: true`.

## Prove it

- **Client:** `posthog.capture("test_event")` from a `"use client"` component shows up in the activity tab, and `debug` (development only) logs it in the console.
- **One initialization:** the codebase has `posthog.init` only in `instrumentation-client.ts`, and no `PostHogProvider` beside it.
- **Server delivery:** each server path that captures ends with `await posthog.flush()` (shared client) or `await client.shutdown()` (per-request client), and its event arrives.
- **Distinct ID:** server events carry the same distinct ID as the browser's `identify()`; no server event has an `undefined` distinct ID (with next-auth, `session.user.id` is set by the session callback).
- **Proxy:** with `api_host: '/ingest'`, `/ingest/flags`, `/ingest/e/` and `/ingest/static/...` all succeed in DevTools, not only the static script.
