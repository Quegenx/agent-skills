# Web setup

`posthog-js` is PostHog's browser SDK; server-side JavaScript uses `posthog-node` instead. Setup is one `posthog.init(token, config)` that runs early, once, from environment variables, and every module then imports that same instance: events captured before `init()` runs are dropped. An integration can look complete while zero events arrive: a missing Content Security Policy entry stops delivery silently, ad blockers block known analytics domains, and the host must match the project's region (never assume US Cloud). Next.js has its own file, [SETUP-NEXTJS.md](SETUP-NEXTJS.md); init options and their defaults are in [CONFIG-WEB.md](CONFIG-WEB.md); the reverse proxy, consent, cookieless mode and EU hosting are in [PROXY-AND-PRIVACY.md](PROXY-AND-PRIVACY.md). Events, `identify`, `reset` and groups are in [EVENTS.md](EVENTS.md); flags in [FEATURE-FLAGS.md](FEATURE-FLAGS.md); replay in [SESSION-REPLAY.md](SESSION-REPLAY.md); exceptions in [ERROR-TRACKING.md](ERROR-TRACKING.md).

**Contents:** [The commandments](#the-commandments) · [The setup workflow](#the-setup-workflow) · [Pick the integration](#pick-the-integration) · [Plain web](#plain-web) · [React with Vite](#react-with-vite) · [React Router](#react-router) · [TanStack Router](#tanstack-router) · [TanStack Start](#tanstack-start) · [Linking frontend and backend](#linking-frontend-and-backend) · [Content Security Policy](#content-security-policy) · [Bundles](#bundles) · [Conflicts between sources](#conflicts-between-sources) · [Prove it](#prove-it)

## The commandments

- **A missing configuration never breaks the app, and never fails silently.** Read keys optionally (never a required setting), guard init and capture behind their presence, and keep build and boot working with no PostHog environment set. In development or debug builds fail loudly, with the language's idiomatic error and this message, substituting the variable name: "<VAR> variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once <VAR> is configured". Production stays a no-op. (The sources disagree here: the vanilla JS example app only `console.warn`s (see [Plain web](#plain-web)), and most other examples use non-null assertions (`!`) with no guard.)
- **Environment variables always, never hardcoded tokens.** Write them to the env file with the framework's naming convention (`.env.local` for Next.js, `.env` for others) and to the hosting provider (Vercel, Netlify, AWS). The project token (`phc_`) may be public; a personal API key (`phx_`) must never be.
- **Never assume US Cloud.** US is `https://us.i.posthog.com`, EU is `https://eu.i.posthog.com`.
- **Minimal changes.** Add PostHog code alongside existing integrations and below them; don't overwrite, replace or restructure existing code or the architecture of existing files. Read a file immediately before writing it.
- **Match the docs and the example.** Follow the framework reference's initialization and capture patterns exactly, and the example project's patterns as closely as possible.
- **Treat event names, property names and feature flag keys as an analytics contract.** Reuse the names and patterns already in the project; new ones are clear, descriptive and consistent with them.
- **Identifying users is required.** Call `posthog.identify(...)` after login and `posthog.reset()` on logout; see [EVENTS.md](EVENTS.md).
- **Update early, update often.** PostHog ships fast: `npm update posthog-js` / `pnpm update posthog-js` / `yarn upgrade posthog-js` / `bun update posthog-js` (or bump the constraint in `package.json` and reinstall). Avoid setups that cache the SDK version so it fails to update.

## The setup workflow

The order PostHog's own agent skills follow:

1. **Detect the platform** from dependency files (`package.json` and others) and the package manager from lockfiles (`pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`, `bun.lockb`). If PostHog is already installed and initialized, do not modify its code: tell the user and go to verification (or, when adding events, go straight to planning them).
2. **Read the framework reference.** It is the source of truth for initialization, provider setup and capture. With no matching reference, fall back to web search with `posthog.com/docs` as the primary source. The full index of PostHog's Markdown docs for LLMs is `https://posthog.com/llms.txt`.
3. **Install with the package manager's install command.** Do not edit `package.json` by hand.
4. **Initialize** as the reference says (for example `instrumentation-client.ts` for Next.js 15.3+), and set up the provider or wrapper component if the framework needs one.
5. **Environment variables.** If valid values already exist in `.env`, `.env.local` or the framework's env files, keep them. Otherwise get the token with the PostHog MCP server's `projects-get` tool (the project's `api_token`; ask which project if there are several), and the host from its `region` field (`US` to `https://us.i.posthog.com`, `EU` to `https://eu.i.posthog.com`). Without MCP, ask the user for the token and "Are you on PostHog US Cloud or EU Cloud?".
6. **Verify:** run the type check or build scripts from `package.json`, make sure every component you created is actually used, and run the linter or formatter only on files you edited or created, never across the whole codebase.

When the job is also adding events: pick 10 to 15 files with business value (conversion and churn events, login and signup for identify, error handling), note the existing `posthog.capture()` naming and supplement rather than duplicate, track actions rather than pageviews (pageviews are automatic; "viewed" events at the top of a conversion funnel are the exception), and add server-side events whenever the project has instrumentable server code (API routes, server actions, webhook handlers, payment or checkout completion, authentication endpoints). Schema management defines event schemas with typed properties and generates type-safe code (`/docs/product-analytics/schema-management`). Details are in [EVENTS.md](EVENTS.md).

**The wizard:** `npx @posthog/wizard` (beta, integration via LLM; also runnable as a prompt in coding agents).

## Pick the integration

| Framework | Install | Init lives in | Env vars |
|---|---|---|---|
| Plain web, snippet | none | `<script>` in the page | none shown |
| Plain web, bundled | `posthog-js` | one module imported first (`src/posthog.js`) | `VITE_POSTHOG_PROJECT_TOKEN`, `VITE_POSTHOG_HOST` (the Vite example) |
| React (Vite) | `posthog-js @posthog/react` | `src/main.jsx` + `<PostHogProvider client={posthog}>` | `VITE_POSTHOG_PROJECT_TOKEN`, `VITE_POSTHOG_HOST` |
| React (CRA) | `posthog-js @posthog/react` | root + provider | `REACT_APP_PUBLIC_POSTHOG_PROJECT_TOKEN`, `REACT_APP_PUBLIC_POSTHOG_HOST` |
| React Router 6, 7 declarative | `posthog-js @posthog/react` | `src/main.tsx`, provider around `BrowserRouter` | `VITE_` |
| React Router 7 data | `posthog-js @posthog/react` | `app/index.tsx`, provider around `RouterProvider` | `VITE_` |
| React Router 7 framework | `posthog-js @posthog/react`, `posthog-node` | `app/entry.client.tsx` + server middleware | `VITE_` |
| TanStack Router | `@posthog/react` (no install list in the sources) | `<PostHogProvider apiKey options>` in the root route | `VITE_` |
| TanStack Start | `@posthog/react posthog-node` | provider in `src/routes/__root.tsx` + server singleton | `VITE_` |
| Next.js | `posthog-js` (+ `posthog-node`) | `instrumentation-client.ts` | `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST`; see [SETUP-NEXTJS.md](SETUP-NEXTJS.md) |

Every package installs as `npm install --save <pkgs>`, `yarn add`, `pnpm add` or `bun add`. Vite exposes only `VITE_`-prefixed variables to the frontend.

## Plain web

- **The HTML snippet** (labelled recommended) goes in a `<script>` tag: a minified loader that stubs the API and loads `/static/array.js` from the assets host (`api_host` with `.i.posthog.com` replaced by `-assets.i.posthog.com`), followed by:

```html
posthog.init('<ph_project_token>', {
    api_host: 'https://us.i.posthog.com',
    defaults: '2026-05-30',
})
```

- **Snippet stub methods** include `captureException`, `get_session_replay_url` and `startSessionRecording`. [PostHog skills, ERROR-TRACKING.md]

- **TypeScript with the snippet:** `npm install @posthog/types`, then a `posthog.d.ts`:

```typescript
import type { PostHog } from '@posthog/types'
declare global {
    interface Window {
        posthog?: PostHog
    }
}
export {}
```

- **From a package manager:**

```javascript
import posthog from 'posthog-js'
posthog.init('<ph_project_token>', {
  api_host: 'https://us.i.posthog.com',
  defaults: '2026-05-30'
})
```

- **One init module, imported before anything that calls PostHog.** Initialize once, early; every other module imports the same instance. The vanilla JS example app's `src/posthog.js` (its `.env.example` also has an optional `# VITE_POSTHOG_DEBUG=true`):

```js
import posthog from 'posthog-js';

const projectToken = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN;
const apiHost = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

if (!projectToken) {
  console.warn(
    'PostHog not configured (VITE_POSTHOG_PROJECT_TOKEN not set).',
    'App will work but analytics will not be tracked.',
  );
} else {
  posthog.init(projectToken, {
    api_host: apiHost,
    // Autocapture is ON by default: tracks clicks, form submissions, pageviews
    // capture_pageview: true (default): captures $pageview on init
    // For SPAs with History API routing, use: capture_pageview: 'history_change'
  });
}

export default posthog;
```

  Conflict: this example only warns in the console ("The app works fine without PostHog configured") and sets no `defaults`; the missing-config commandment asks for a loud failure with a fixed message in development builds.
- **For an SPA with History API routing, `capture_pageview: 'history_change'` (the default with `defaults: '2025-05-24'` and later).
- **Skip local development data** by guarding the init: `if (!window.location.host.includes('127.0.0.1') && !window.location.host.includes('localhost')) { posthog.init(...) }`.
- **Global error handlers** for a vanilla app: `window.addEventListener('error', (event) => { posthog.captureException(event.error) })` and the same on `unhandledrejection` with `event.reason`. See [ERROR-TRACKING.md](ERROR-TRACKING.md).
- **The PostHog VS Code extension** shows live analytics, flag status and replay links inline (`/docs/vscode-extension.md`).
- **Google Tag Manager** has a PostHog tag template (`/docs/libraries/google-tag-manager.md`).
- **Marketing site and app:** put PostHog on both, in one project. PostHog sets a cross-domain cookie, so `yourapp.com` and `app.yourapp.com` follow the same user; different domains need the cross-domain tracking tutorial.
- **Multiple instances** are "not a first-class citizen": `posthog.init('<ph_project_token>', {}, 'project1')`, then `posthog.project1.capture('some_event')`. Disable autocapture (and some other events) so they aren't sent to both. `new PostHog()` creates an uninitialized instance; use it only when you must manage a separate instance yourself.

## React with Vite

For Next.js, Remix and React Router, use their own guides. Env in `.env.local` and the hosting provider:

```shell
VITE_POSTHOG_PROJECT_TOKEN=<ph_project_token>
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

Integrate at the root (`main.jsx` for Vite apps):

```jsx
// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import posthog from 'posthog-js';
import { PostHogProvider } from '@posthog/react'

posthog.init(import.meta.env.VITE_POSTHOG_PROJECT_TOKEN, {
  api_host: import.meta.env.VITE_POSTHOG_HOST,
  defaults: '2026-05-30',
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <App />
    </PostHogProvider>
  </StrictMode>,
)
```

### Provider-owned initialization alternative

The error-tracking reference also initializes through the provider's `apiKey` and `options` branch. Use this instead of the client-owned initialization above. [PostHog skills, ERROR-TRACKING.md]

- **Install** `posthog-js @posthog/react` (`npm install posthog-js @posthog/react`, or the yarn, pnpm or bun equivalent). Vite env in `.env`: `VITE_POSTHOG_PROJECT_TOKEN=<ph_project_token>`, `VITE_POSTHOG_HOST=https://us.i.posthog.com`.

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { PostHogProvider } from '@posthog/react'

const options = {
  api_host: import.meta.env.VITE_POSTHOG_HOST,
  defaults: '2026-05-30',
} as const

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PostHogProvider apiKey={import.meta.env.VITE_POSTHOG_PROJECT_TOKEN} options={options}>
      <App />
    </PostHogProvider>
  </StrictMode>
)
```

- **`defaults`** applies PostHog's recommended settings for new projects.
- **Access the client** with the `usePostHog` hook inside the provider, or `import posthog from 'posthog-js'` in non-React code.

### Using the React client

- **Inside components use `usePostHog()`;** outside them import `posthog` directly, as long as it is the instance you initialized. `usePostHog` returns the client from the nearest `PostHogProvider`; if the provider got a different instance, import that one.
- **The provider takes a client or an `apiKey` with `options`, never both.** `PostHogProviderProps` is a discriminated union: `{ client: PostHog; apiKey?: never; options?: never } | { apiKey: string; options?: Partial<PostHogConfig>; client?: never }`. With `apiKey`, the provider calls `posthog.init()` itself.
- **`TypeError: Cannot read properties of undefined (reading '...')`** means a call before init, for example on the first render. Children render even when PostHog isn't initialized so the app still loads. Use optional chaining (`posthog?.capture('test')`, recommended) or `if (posthog)`.
- **`@posthog/react` works only with the default `posthog-js` import,** not the `dist/module.*` variants (see [Bundles](#bundles)). Import `usePostHog` from `@posthog/react`; one TanStack example imports it from `posthog-js/react`, which is the odd one out.
- **Autocapture** records pageviews, element clicks, inputs and more by default; `className="ph-no-capture"` excludes an element (tuning in [CONFIG-WEB.md](CONFIG-WEB.md)).
- **`PostHogCaptureOnViewed`** (from `@posthog/react`) sends `$element_viewed` once per instance when the wrapped element enters the viewport. Props: `name`, `properties`, `trackAllChildren` (each child sends its own event with `child_index`), `observerOptions={{ threshold: 0.5, rootMargin: '0px' }}`; other props go to the wrapper `div`.
- **`PostHogErrorBoundary`** from `@posthog/react` wraps the app to capture unhandled React errors ([ERROR-TRACKING.md](ERROR-TRACKING.md)). Flag hooks and `<PostHogFeature>` are in [FEATURE-FLAGS.md](FEATURE-FLAGS.md).
- **With no router, capture pageviews on navigation yourself:** `posthog.capture('$pageview', { $current_url: \`/${target}\` })`.
- **CRA env names and backend linking:**

```jsx
posthog.init(process.env.REACT_APP_PUBLIC_POSTHOG_PROJECT_TOKEN, {
  api_host: process.env.REACT_APP_PUBLIC_POSTHOG_HOST,
  defaults: '2026-05-30',
  // Optional: send PostHog session/user context to your backend
  tracing_headers: ['api.example.com'],
});
```

## React Router

All four modes install `posthog-js @posthog/react` and read `VITE_POSTHOG_PROJECT_TOKEN` and `VITE_POSTHOG_HOST`. Feature flag and experiment setup is the same as React.

### v6 and v7 declarative mode (`src/main.tsx`)

```jsx
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";

import posthog from 'posthog-js';
import { PostHogErrorBoundary, PostHogProvider } from '@posthog/react'

// Initialize PostHog
posthog.init(import.meta.env.VITE_POSTHOG_PROJECT_TOKEN, {
  api_host: import.meta.env.VITE_POSTHOG_HOST,
  defaults: '2026-05-30',
});

const root = document.getElementById("root");

ReactDOM.createRoot(root).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
    <PostHogErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Root />}>
          {/* ... Your routes ... */}
        </Route>
      </Routes>
    </BrowserRouter>
    </PostHogErrorBoundary>
    </PostHogProvider>
  </StrictMode>,
);
```

The v6 docs page shows the same code; the v6 example app imports from `react-router-dom`. To link a backend, add `tracing_headers: [ window.location.hostname, 'localhost' ]` to the init. The v7 declarative example's `vite.config.ts` adds `resolve: { dedupe: ['react', 'react-dom'] }`.

### v7 data mode (`app/index.tsx`)

- **Init the same way, then wrap `RouterProvider` with the provider:** `<PostHogProvider client={posthog}><RouterProvider router={router} /></PostHogProvider>`, with `router` from `createBrowserRouter([{ path: "/", Component: Root, ErrorBoundary: RootErrorBoundary, children: [...] }])`. (The docs snippet for this step has mismatched closing brackets; build it from this description.)
- **Error boundary** exported from `app/root.tsx`:

```jsx
export function RootErrorBoundary() {
  const error = useRouteError();
  const posthog = usePostHog();
  if (error) {
    posthog.captureException(error);
  }
  // other error handling code...
}
```

- **Backend linking:** `tracing_headers: [ window.location.hostname, 'localhost' ]`.

### v7 framework mode (SSR)

- **Bundle the SDK into the SSR build** to avoid SSR errors. The prose says "set as external packages" but the config uses `ssr.noExternal`:

```typescript
export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  ssr: {
    noExternal: ['posthog-js', '@posthog/react']
  }
});
```

- **Client entry `app/entry.client.tsx`:**

```jsx
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

import posthog from 'posthog-js';
import { PostHogProvider } from '@posthog/react'

posthog.init(import.meta.env.VITE_POSTHOG_PROJECT_TOKEN, {
  api_host: import.meta.env.VITE_POSTHOG_HOST,
  defaults: '2026-05-30',
  tracing_headers: [ window.location.hostname, 'localhost' ],
});

startTransition(() => {
  hydrateRoot(
    document,
    <PostHogProvider client={posthog}>
      <StrictMode>
        <HydratedRouter />
      </StrictMode>
    </PostHogProvider>,
  );
});
```

- **Error boundary:** export `ErrorBoundary({ error }: Route.ErrorBoundaryProps)` from `app/root.tsx`, call `usePostHog()?.captureException(error)`, then render (the example shows the stack only when `import.meta.env.DEV`).
- **Server: `npm install posthog-node --save` and a middleware** in `app/lib/posthog-middleware.ts`. It creates a client per request, reads the tracing headers into a Node SDK context (every capture in the request is then identified with that user and session), and shuts the client down after the request:

```typescript
import { PostHog } from "posthog-node";
import type { RouterContextProvider } from "react-router";
import type { Route } from "../+types/root";

export interface PostHogContext extends RouterContextProvider {
  posthog?: PostHog;
}

export const posthogMiddleware: Route.MiddlewareFunction = async ({ request, context }, next) => {
  const posthog = new PostHog(process.env.VITE_POSTHOG_PROJECT_TOKEN!, {
    host: process.env.VITE_POSTHOG_HOST!,
    flushAt: 1,
    flushInterval: 0,
  });

  const sessionId = request.headers.get('X-POSTHOG-SESSION-ID');
  const distinctId = request.headers.get('X-POSTHOG-DISTINCT-ID');

  (context as PostHogContext).posthog = posthog;

  const response = await posthog.withContext(
    { sessionId: sessionId ?? undefined, distinctId: distinctId ?? undefined },
    next
  );

  await posthog.shutdown().catch(() => {});

  return response;
};
```

- **Register it in `app/root.tsx`:** `export const middleware: Route.MiddlewareFunction[] = [ posthogMiddleware, ];`, and turn middleware on in `react-router.config.ts`: `ssr: true`, `future: { v8_middleware: true }`.
- **Capture in actions without a distinct ID** (the context supplies it): `const posthog = (context as PostHogContext).posthog; posthog?.capture({ event: 'checkout_completed' });`.
- **Don't identify users on the server side;** identify once on the client at login. A Vite dev proxy for `/ingest` is in [PROXY-AND-PRIVACY.md](PROXY-AND-PRIVACY.md); in that example `api_host` is still the env host, not `/ingest`.

## TanStack Router

Client only (no server logic, no `posthog-node`). The provider initializes the client from `apiKey` and `options`: in `src/routes/__root.tsx` (`createRootRoute({ component: () => (<PostHogProvider ...>...) })`) for file-based routing, or in the `RootComponent` of `createRootRoute` in `src/main.tsx` for code-based routing.

```tsx
<PostHogProvider
  apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN!}
  options={{
    api_host: '/ingest',
    ui_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com',
    defaults: '2026-01-30',
    capture_exceptions: true,
    debug: import.meta.env.DEV,
  }}
>
```

- **`api_host: '/ingest'` relies on a proxy;** the example's is a Vite dev-server proxy only ([PROXY-AND-PRIVACY.md](PROXY-AND-PRIVACY.md)).
- **`ui_host` here reads the ingestion host variable** (`https://us.i.posthog.com`), while it should be the app host (`https://us.posthog.com`, `https://eu.posthog.com`), which the Next.js examples hard-code. Give `ui_host` its own value.

## TanStack Start

`npm install @posthog/react posthog-node`. Wrap the app in the root route `src/routes/__root.tsx` (`shellComponent: RootDocument`), inside `<body>` before `<Scripts />`. Once it's in place PostHog captures pageviews, sessions and web vitals.

```tsx
<PostHogProvider
  apiKey="<ph_project_token>"
  options={{
    api_host: 'https://us.i.posthog.com',
    defaults: '2026-05-30',
    capture_exceptions: true
  }}
>
  {children}
</PostHogProvider>
```

- **Backend linking, guarded for SSR** (the example app's options; `window` is undefined on the server):

```tsx
<PostHogProvider
  apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN!}
  options={{
    api_host: '/ingest',
    ui_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com',
    defaults: '2025-05-24',
    capture_exceptions: true,
    debug: import.meta.env.DEV,
    // Automatically add X-POSTHOG-SESSION-ID and X-POSTHOG-DISTINCT-ID
    // headers to same-origin requests so server-side events join the
    // same session. Guarded for SSR, where `window` is undefined.
    tracing_headers:
      typeof window !== 'undefined' ? [window.location.hostname] : [],
  }}
>
```

  Its `defaults: '2025-05-24'` is older than the docs' `'2026-05-30'`, and its `ui_host` has the same problem as TanStack Router's.
- **Server singleton `src/utils/posthog-server.ts`:**

```typescript
import { PostHog } from 'posthog-node'

let posthogClient: PostHog | null = null

export function getPostHogClient() {
  if (!posthogClient) {
    posthogClient = new PostHog(
      '<ph_project_token>',
      {
        host: 'https://us.i.posthog.com',
        flushAt: 1,
        flushInterval: 0,
      },
    )
  }
  return posthogClient
}
```

- **Server capture** in a route (`createFileRoute('/api/checkout')({ server: { handlers: { POST: async ({ request }) => { ... } } } })`) needs `distinctId` and `event` (`properties` optional): `posthog.capture({ distinctId: body.userId, event: 'item_purchased', properties: { item_id: body.itemId, price: body.price, source: 'api' } })`. Capture on the server what shouldn't be spoofable from the client, like purchases or authentication. To join the client's session, pass its `$session_id`:

```ts
const sessionId = request.headers.get('X-PostHog-Session-Id')

const posthog = getPostHogClient()
posthog.capture({
  distinctId: username,
  event: 'burrito_considered',
  properties: {
    $session_id: sessionId || undefined,
    total_considerations: totalConsiderations,
    username: username,
    source: 'api',
  },
})

// This handler is short-lived; flush so the enqueued event sends before it returns
await posthog.flush()
```

  The doc's route calls neither `flush()` nor `shutdown()`; the example flushes.
- **The example's Vite dev proxy** adds `secure: false` to each rule ([PROXY-AND-PRIVACY.md](PROXY-AND-PRIVACY.md)).

## Linking frontend and backend

- **`tracing_headers: ['api.example.com']`** (posthog-js 1.380.0+; `addTracingHeaders` and `__add_tracing_headers` are deprecated aliases) adds `X-POSTHOG-DISTINCT-ID` and `X-POSTHOG-SESSION-ID` to matching `fetch` and `XMLHttpRequest` requests, so server-side SDKs link backend events, logs, errors and LLM traces to frontend sessions and replays.
- **Hostnames only, matched exactly:** no protocols, paths, ports or wildcard subdomains. Use `'localhost'`, not `'localhost:3000'`; `localhost` and `127.0.0.1` are different hostnames, so use the one the app calls.
- **On the server, use the same distinct ID as the frontend's `identify()`,** or backend events are orphaned from replays, LLM traces and errors. Without tracing headers, derive the matching `distinctId` from your server-side stable IDs and pass it when capturing.
- **Tracing headers are client-controlled analytics context, not authentication or authorization.** Pass an authenticated `distinctId` explicitly for security-sensitive server-side decisions.

## Content Security Policy

The SDK lazy-loads extra bundles (session replay, surveys) from PostHog's CDN, and the `posthog.com` subdomains change over time, so allow the wildcard:

```
script-src 'self' https://*.posthog.com;
connect-src 'self' https://*.posthog.com;
worker-src 'self' blob: data:;
```

- **What each one covers:** `script-src` the snippet and lazy bundles, `connect-src` ingestion and feature flags, `worker-src` session replay. The toolbar needs more (`/docs/advanced/content-security-policy.md`), or use a reverse proxy.
- **A missing entry fails silently:** `capture` and `identify` never send while the integration looks complete. `connect-src` falls back to `default-src`, so `default-src 'self'` blocks event delivery even when the script itself is bundled.

## Bundles

By default only the core loads and extensions (surveys, replay recorder) load lazily from the CDN. That breaks when CSP blocks inline scripts, when you want build-time bundling, and in Chrome Web Store extensions or Electron (which block remote code):

```javascript
// No external code loading possible (this disables all extensions such as Replay, Surveys, Exceptions etc.)
import posthog from 'posthog-js/dist/module.no-external'
// No external code loading possible but all external dependencies pre-bundled
import posthog from 'posthog-js/dist/module.full.no-external'
// All external dependencies pre-bundled and with the ability to load external scripts (primarily useful is you use JS snippets)
import posthog from 'posthog-js/dist/module.full'
// Finally you can also import specific extra dependencies
import "posthog-js/dist/posthog-recorder"
import "posthog-js/dist/surveys"
import "posthog-js/dist/exception-autocapture"
import "posthog-js/dist/tracing-headers"
import "posthog-js/dist/web-vitals"
import posthog from 'posthog-js/dist/module.no-external'
```

- **With any `no-external` option the toolbar is unavailable** (it loads from `us.posthog.com` at runtime).
- **Always import `posthog-js` from the same module,** or several bundles end up included.
- **The slim bundle** (experimental, the biggest size cut) keeps only event capture, identify and group analytics; opt in to the rest through `__extensionClasses`:

```javascript
import posthog from 'posthog-js/dist/module.slim'
import {
    SessionReplayExtensions,
    AnalyticsExtensions,
} from 'posthog-js/dist/extension-bundles'
posthog.init('<ph_project_token>', {
    api_host: 'https://us.i.posthog.com',
    defaults: '2026-05-30',
    __extensionClasses: {
        ...SessionReplayExtensions,
        ...AnalyticsExtensions,
    }
})
```

| Extension bundle | Contains |
|---|---|
| `FeatureFlagsExtensions` | Feature flags |
| `SessionReplayExtensions` | Session replay |
| `AnalyticsExtensions` | Autocapture, pageview tracking, heatmaps, dead click detection, web vitals |
| `ErrorTrackingExtensions` | Error tracking |
| `SurveysExtensions` | Surveys |
| `ExperimentsExtensions` | Experiments |
| `SiteAppsExtensions` | JS snippets (site apps) |
| `TracingExtensions` | Distributed tracing header injection |
| `ToolbarExtensions` | Toolbar |
| `LogsExtensions` | Logs |
| `ConversationsExtensions` | Support |
| `WebMCPExtensions` | WebMCP tool call capture for MCP Analytics (add `ErrorTrackingExtensions` to send failed calls to Error Tracking) |
| `AllExtensions` | Everything (the default bundle) |

Each bundle includes its own dependencies.

## Conflicts between sources

- **`defaults` date:** the framework docs use `'2026-05-30'`; most example apps use `'2026-01-30'`; the TanStack Start example uses `'2025-05-24'`; the vanilla JS example sets none. Each snapshot changes behavior ([CONFIG-WEB.md](CONFIG-WEB.md)).
- **Vite env names:** the React and React Router docs use `VITE_POSTHOG_PROJECT_TOKEN` / `VITE_POSTHOG_HOST`; every React and TanStack example app uses `VITE_PUBLIC_POSTHOG_PROJECT_TOKEN` / `VITE_PUBLIC_POSTHOG_HOST`; the vanilla JS example uses `VITE_POSTHOG_PROJECT_TOKEN` / `VITE_POSTHOG_HOST`.
- **Who initializes:** most docs call `posthog.init()` and pass `<PostHogProvider client={posthog}>`; the TanStack docs and examples let the provider init from `apiKey` and `options`. Both are valid, never both at once.
- **Missing config:** the commandment requires a loud development-build error with the fixed message and a production no-op; the vanilla JS example only `console.warn`s; other examples use non-null assertions (`!`) with no guard.
- **Server flush:** see [SETUP-NEXTJS.md](SETUP-NEXTJS.md#flush-or-shut-down).

## Prove it

- **Events arrive:** with `debug: true` or `?__posthog_debug=true`, the console shows `[PostHog.js] Starting in debug mode` and every call; autocaptured pageviews and clicks plus one custom `posthog?.capture('button_clicked')` appear in the activity tab (`https://app.posthog.com/activity/explore`) within a minute or two.
- **Network:** DevTools shows requests to your `api_host` (or proxy path) returning success, with no CSP violations in the console.
- **Missing config:** with the token variable unset, a development build fails with the "variable required by PostHog is missing" message, and a production build boots and sends nothing.
- **Region:** the host matches the project's region from `projects-get` (or the user's answer).
- **Backend linking:** a request to a host in `tracing_headers` carries `X-POSTHOG-DISTINCT-ID` and `X-POSTHOG-SESSION-ID`, and the server event shows up in the same session as the frontend's.
- **Build and lint** pass for the files you touched, and every component you added is rendered somewhere.
