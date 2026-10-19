# Auth: keys, sessions, JWTs and server-side rendering

Supabase Auth signs users in (password, magic link, OTP, social login, SSO, Web3, passkeys, anonymous) and issues the JWTs that every other Supabase API trusts. The token is the mechanism that decides most outcomes: its `role` claim picks the Postgres role, its `sub` is `auth.uid()` in RLS, its claims are only as fresh as its last refresh, and it stays valid until `exp` whatever happens to the session behind it. This file covers keys, sessions, tokens and checking the user on the server; sign-in methods are AUTH-SIGN-IN.md, and MFA, hooks, roles and user management AUTH-USERS.md. SECURITY.md has the short checklist.

**Contents:** [How it works](#how-it-works) · [Keys and roles](#keys-and-roles) · [Sessions](#sessions) · [JWTs and claims](#jwts-and-claims) · [Signing keys and rotation](#signing-keys-and-rotation) · [Verifying the user on the server](#verifying-the-user-on-the-server) · [Choosing a server package](#choosing-a-server-package) · [SSR with @supabase/ssr](#ssr-with-supabasessr) · [Client API notes (supabase-js)](#client-api-notes-supabase-js) · [Dated changes](#dated-changes) · [Conflicting statements: check the current docs](#conflicting-statements-check-the-current-docs) · [Prove it](#prove-it)

## How it works

- **Four layers:** the client (SDKs or raw HTTP), the API gateway shared by all products, the Auth service (formerly GoTrue, repo `github.com/supabase/auth`) and Postgres. The Auth service validates, issues and refreshes JWTs, reads and writes auth data in the database, and talks to external providers for social login and SSO.
- **Auth data lives in the `auth` schema, which the auto-generated API doesn't expose.** Connect it to your own tables with foreign keys and triggers. Auth tables you will meet: `auth.users`, `auth.identities`, `auth.sessions`, `auth.mfa_factors`, `auth.audit_log_entries`.
- **Views over auth data bypass RLS** unless created `with (security_invoker = true)` (Postgres 15+); otherwise, or on older versions, they run with the owner's permissions. Enable RLS or revoke grants on them.
- **A user** is a row in `auth.users` that can be issued an access token. Permanent users have identities tied to an email, phone or third-party account; anonymous users have none and can't sign back in once signed out.
- **Identities:** Email, Phone, OAuth, SAML; a user can have several. An identity row has `provider_id` (for OAuth the user's ID at the provider; for email and phone the user's ID from `auth.users`), `user_id`, `identity_data`, `id`, `provider`, `email` (generated from `identity_data`), `created_at`, `last_sign_in_at`, `updated_at`.
- **The user object:** `id`, `aud`, `role`, `email`, `email_confirmed_at`, `phone`, `phone_confirmed_at`, `confirmed_at`, `last_sign_in_at`, `app_metadata` (`provider` = the first provider used to sign up, `providers` = those usable to sign in), `user_metadata`, `identities`, `created_at`, `updated_at`, `is_anonymous`.
- **By default a user with an unverified email or phone can't sign in.**
- **General settings:** Allow new users to sign up (off: only existing users can sign in), Confirm Email (off: email is treated as confirmed), Allow anonymous sign-ins, Allow manual linking.

## Keys and roles

| Key | Looks like | Role it maps to | Where it goes |
|---|---|---|---|
| Publishable | `sb_publishable_...` | `anon`; `authenticated` when a user JWT is sent too | anything you ship: browser, mobile, CLI, script |
| Secret | `sb_secret_...` | `service_role` (`BYPASSRLS`: policies never apply) | only code you control: server, Edge Function, cron |
| `anon` (legacy) | long JWT starting `eyJ` | `anon` | legacy publishable |
| `service_role` (legacy) | long JWT starting `eyJ` | `service_role` | legacy secret |

- **`anon` and `service_role` keys are being deprecated by the end of 2026.** Creating new keys doesn't revoke legacy ones; both work until you disable the legacy keys in Settings > API Keys (check their "last used" indicators first; they can be reactivated).
- **Grants are evaluated before RLS.** A missing grant returns a permission error, even for `service_role`; a policy matching no rows returns empty. Check grants before debugging policies.
- **Secret keys don't work in a browser:** the `User-Agent` header is matched and the request gets HTTP 401.
- **Send new keys in the `apikey` header, not `Authorization: Bearer`** (they aren't JWTs). Edge Functions' `verify_jwt` accepts them on either header for migration compatibility, but that doesn't authenticate the caller: authorize API keys in code.
- **Handle the secret key like a password.** Never put it in a browser (even localhost), a URL or query param, chat or email. Log at most 6 characters of the random part after the prefix, or a SHA256 hash. Give each backend component its own secret key.
- **Leaked key:** fix the root cause, create a new secret key, replace it everywhere, confirm, then delete the compromised secret key (irreversible) or deactivate legacy keys (reversible).
- **Retrieving keys:** Dashboard Connect dialog or Settings > API Keys; `supabase projects api-keys --project-ref <ref>` (a preview branch has its own keys); Management API `GET https://api.supabase.com/v1/projects/$PROJECT_REF/api-keys?reveal=true` (OAuth scope `secrets:read`; a scoped token needs API Keys Read, plus API Key Secrets Read for `reveal=true`, else 403).
- **Locally,** `supabase start` prints a publishable and a secret key under "Authentication Keys" (the local secret replaces the local `service_role`); `supabase status` prints them again. Local keys are unrelated to hosted keys.
- **Hosted, the gateway verifies the `apikey` header** (the query param on WebSockets) against the project's key list and mints a short-lived JWT for the project servers.
- **Public Realtime connections last at most 24 hours** unless upgraded to user-level auth.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
# Server-only. Never prefix these, or your bundler will ship the key.
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
```

- **Edge Functions called with a secret key:** use `withSupabase({ auth: 'secret' }, ...)` from `npm:@supabase/server@1` (`ctx.supabaseAdmin` bypasses RLS) and set `[functions.<name>] verify_jwt = false`. Manually: `JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')!)['default']`. `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are still injected but carry the legacy keys.

## Sessions

- **A session is an access token (JWT) plus a refresh token.** Access tokens are short-lived, usually 5 minutes to 1 hour. Refresh tokens never expire but can be used once.
- **By default a session lasts indefinitely,** with unlimited active sessions per user across devices.
- **A session ends** (depending on config) when the user signs out, changes password or does another security-sensitive action, hits the inactivity timeout or maximum lifetime, or signs in on another device.
- **Every access token carries `session_id`,** the primary key of its row in `auth.sessions`.
- **Session limits (Pro Plan and up, Auth > Sessions):** time-box (maximum lifetime), inactivity timeout (not refreshed within the duration), single session per user (keeps the most recent sign-in).
- **Those limits apply only at the next refresh,** so the real duration is the configured limit plus the JWT expiry, and single-session takes effect at JWT-expiry intervals. Ended sessions aren't terminated proactively; they're deleted progressively 24 hours after they expire.
- **JWT expiry: keep the default 1 hour.** Over 1 hour is discouraged; never go below 5 minutes (especially not below 2): more refresh load, device clocks off by minutes or hours, libraries refresh ahead of time, and a token should outlive the longest request.
- **Refresh token reuse detection.** A refresh token may be reused within the reuse interval (default 10 seconds; don't change it), for SSR server and client sharing a token and for serialization bugs; and using the parent of the currently active token returns the active token (unreliable networks). Any other reuse terminates the session and revokes all its refresh tokens. It can be disabled in Advanced Settings (not recommended). It protects against refresh tokens leaked through logs or third-party servers, not a session stolen from the device.
- **Cookies holding tokens:** set `Expires`/`Max-Age` far in the future and let Auth control validity. Short cookie lifetimes only degrade the experience.
- **HTTP-only cookies work only for server-only apps that return rendered HTML.** With client JavaScript the browser must read and refresh the session (it needs the refresh token), so HttpOnly is not necessary; the JS libraries give only limited support for it through a custom server `storage`.

### Signing out and revocation

- **`signOut()` removes the active session and clears auth data from storage.** Scopes: `global` (all the user's sessions), `local` (this one), `others` (all but this one; fires no `SIGNED_OUT`).
- **Default scope differs by SDK:** JS, Swift, Python and C# default to `global`; Dart and Kotlin to `local`. With `global`, other devices fail at their next refresh with `AuthApiError: Invalid Refresh Token: Refresh Token Not Found`. Pass `{ scope: 'local' }` for independent per-device sessions.
- **Sign-out destroys refresh tokens, not access tokens.** Access tokens of revoked sessions stay valid until `exp`; they can't be revoked, only shortened.
- **To guarantee a JWT is dead after sign-out,** check that its `session_id` still exists in `auth.sessions` (sign-out deletes those rows). Do this only for the most sensitive actions.

## JWTs and claims

- **Shape:** `<header>.<payload>.<signature>`, header `{ "typ": "JWT", "alg": "<HS256 | ES256 | RS256>", "kid": "<unique key identifier>" }`. `iss` is `https://project_id.supabase.co/auth/v1`; append `/.well-known/jwks.json` for the public keys.
- **Supabase creates JWTs** continuously for each signed-in user (short-lived), and on the fly from publishable and secret keys (short-lived, generally not accessible to you). It can also accept third-party JWTs or JWTs you mint with an imported signing key.

| Claims | Values |
|---|---|
| Required (always present, can't be removed) | `iss`, `aud` (`authenticated` or `anon`), `exp`, `iat`, `sub` (user ID), `role` (`anon`, `authenticated`, `service_role`), `aal` (`aal1`, `aal2`), `session_id`, `email`, `phone`, `is_anonymous` |
| Optional | `jti`, `nbf`, `app_metadata`, `user_metadata`, `amr` (array of `{ method, timestamp }`) |
| Special | `ref` (project ref; anon and service_role tokens only) |
| `amr.method` | `oauth`, `password`, `otp`, `totp`, `recovery`, `invite`, `sso/saml`, `magiclink`, `email/signup`, `email_change`, `token_refresh`, `anonymous` |

- **Legacy anon and service_role key payloads:** `{ "iss": "supabase", "ref": "...", "role": "anon" | "service_role", "iat", "exp" }`.
- **In Rust, `ref` is reserved:** use `#[serde(rename = "ref")]`.
- **Never implement signature verification yourself.** Use `supabase.auth.getClaims()` or a quality JWT library. `getClaims()` is meant only for JWTs issued by Supabase Auth; self-minted JWTs from an imported key may fail it, so verify those with a JWT library.
- **Verify with the JWKS:**

```ts
import { createRemoteJWKSet, jwtVerify } from 'jose'
const PROJECT_JWKS = createRemoteJWKSet(new URL('https://project-id.supabase.co/auth/v1/.well-known/jwks.json'))
async function verifyProjectJWT(jwt: string) { return jwtVerify(jwt, PROJECT_JWKS) }
```

- **The JWKS returns only public asymmetric keys,** and no keys at all if the project doesn't use asymmetric signing keys. It is cached at the Supabase edge for 10 minutes; client libraries may cache keys in memory another 10 minutes. Don't cache it longer in your app, or provide a purge.
- **With the HS256 shared secret,** verify by calling `GET /auth/v1/user` with `apikey` and `Authorization: Bearer <JWT>` (200 means valid). The Auth server runs only in the project's region, so avoid this from the edge. Verifying with the shared secret yourself is strongly discouraged: it leaks easily (a `NEXT_PUBLIC_`, `VITE_` or `PUBLIC_` prefix ships it), complicates compliance and makes rotation cause downtime.
- **Pass third-party or self-minted JWTs through the `accessToken` option.** A custom `Authorization` header on the client is no longer recommended.

```ts
const supabase = createClient('https://<supabase-project>.supabase.co', 'SUPABASE_PUBLISHABLE_KEY', {
  accessToken: async () => { return '<your JWT here>' },
})
```

- **Keep the JWT small for cookie auth:** some browsers limit each cookie to 4096 bytes. The Custom Access Token hook can strip claims (Hooks below).

## Signing keys and rotation

- **Two systems.** The legacy JWT secret is one shared secret signing `anon`, `service_role`, every user token and some Storage pre-signed URLs; it is no longer recommended and kept for compatibility. Signing keys are asymmetric (RSA or EC) or a shared secret.
- **Why asymmetric keys:** fast local verification without the Auth server; revocation through the discovery endpoint; zero-downtime, reversible rotation that signs no one out (legacy rotation signs out active users immediately); publishable and secret keys independent of the signing key (legacy `anon` and `service_role` must rotate together); a private key that can't be extracted.

| Algorithm | Status |
|---|---|
| ES256 (NIST P-256) | recommended; shorter signatures help cookie size |
| RS256 (RSA 2048) | supported; P-256 recommended instead |
| EdDSA (Ed25519) | coming soon |
| HS256 | not recommended for production |

- **Migrate without downtime:** on the JWT signing keys page (`/settings/jwt`), *Migrate JWT secret* imports the legacy secret and creates a new asymmetric key as standby. Before *Rotate keys*: make sure nothing verifies against the legacy secret directly (`jose`, `jsonwebtoken`), turn off Verify JWT on Edge Functions that have it, and switch code to `getClaims()`.
- **After rotating,** Auth issues tokens with the new key and still accepts unexpired old ones. With a 1-hour expiry, wait at least 1 hour 15 minutes before revoking the legacy secret (now under *Previously used*).
- **Key states:** standby -> in use -> previously used -> revoked. Previously used or revoked keys can go back to standby; every action is reversible except deletion. Create: only the current key is accepted, the new public key is published. Rotate: both trusted. Revoke: only the current one trusted. Delete: destroys the private key permanently.
- **Caches:** Supabase products (Auth, Data API, Storage, Realtime) don't rely on the JWKS cache, so revocation is instant for them, and an app using only RLS gets instant rotation and revocation. Your own verifiers need cache busting for urgent revocation, and must see the new standby key before you rotate: wait at least 20 minutes after creating a standby key or revoking a used one (the multi-level cache clears every 20 minutes).
- **Throttling and guards:** most signing-key state changes are throttled for about 5 minutes. The legacy JWT secret can't be deleted (so you can go back). Revoking it requires disabling the `anon` and `service_role` keys first, because they are JWTs signed with it.
- **Legacy keys can't be rotated any more;** regenerating the JWT secret immediately invalidates all current API secrets. Migrate to signing keys and new API keys. On signing keys: Rotate Keys, then Revoke the previously used key, or it stays valid.
- **Rotate when** a secret leaked, a member's device was compromised, a malicious member left, or compliance requires it; rotate at least once a year, and switch to publishable and secret keys with `anon`/`service_role` disabled.
- **Minting your own JWTs:** only the legacy secret is extractable, so import a key instead: `supabase gen signing-key --algorithm ES256`, create a standby key in the dashboard from the JWK, then Rotate. The header needs the matching `alg` and `kid`; the payload `sub` (optional user UUID), `role` (an existing Postgres role), `exp` (in the future, short). For testing: `supabase gen bearer-jwt --role authenticated --sub <uuid>`.
- **A minted JWT goes in `Authorization: Bearer`,** and an `apikey` header (publishable, secret or legacy) is still required; a minted JWT can't go in `apikey`.

## Verifying the user on the server

| Call | What it does | Use it for |
|---|---|---|
| `getClaims()` | Reads the access token from storage and verifies it: locally with WebCrypto and a cached JWKS on asymmetric keys, or by calling the Auth server (like `getUser`) on a symmetric secret or without WebCrypto. Claims come from the JWT, not a user lookup. Refreshes the session first when the token is about to expire. | Protecting pages and data |
| `getUser(jwt?)` | Network request to Auth for the current user record; authentic | When you need the up-to-date user, or to detect a revoked session |
| `getSession()` | Loads the session from storage, refreshing if needed, without revalidating; low-level since asymmetric keys; warns when storage is cookie-based | Only when you need the raw tokens, for example to forward the access token |

- **Never trust `getSession()` in server code** (Proxy, middleware, route handlers): anyone can forge the session cookie, and the embedded user object can't be trusted when storage is shared with the client.
- **`getClaims()` doesn't detect a revoked session whose token hasn't expired.** The only way to detect server-side that a session ended is `getUser()`.
- **The guides disagree on the default.** The SSR guide says always use `getClaims()` to protect pages and data; the JS reference says `getUser()` "should always be used when checking for user authorization on the server". Use `getClaims()` for routine checks, `getUser()` where revocation matters, and check the current docs.
- **In ephemeral environments** (Lambda and similar) the JWKS is fetched per invocation; the edge cache helps. Polyfill WebCrypto where it is missing, or `getClaims()` falls back to a network call.
- **`401: invalid claim: missing sub`:** `getUser()` received an API key instead of a user access token, or sign-in didn't complete. Pass the user's JWT, for example `getUser(user_jwt)` from the `Authorization: Bearer` header.

## Choosing a server package

| Identity reaches your code as | Package |
|---|---|
| Cookies (Next.js, SvelteKit, TanStack Start) | `@supabase/ssr`: cookie sessions with refresh-token rotation |
| Per-request `Authorization: Bearer <jwt>` (Edge Functions, Workers, Vercel, Bun, Hono, H3, Elysia, NestJS) | `@supabase/server`: stateless Bearer JWT plus `apikey` |
| Base client or do-it-yourself | `@supabase/supabase-js` |

- **Both wrappers build on supabase-js, and they coexist:** `@supabase/ssr` is not deprecated. They can be composed (ssr owns cookies, server primitives get the token); see `https://github.com/supabase/server/blob/main/docs/ssr-frameworks.md`.
- **`@supabase/server`:** its Bearer/API-key modes, caller/admin context, OAuth discovery and portable package middleware have one owner in [SERVER-MIDDLEWARE.md](SERVER-MIDDLEWARE.md).

The [Fetch handler example](SERVER-MIDDLEWARE.md#fetch-handler-example) shows the caller-scoped query.

- **A plain server-side supabase-js client** takes `auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }`. Without storage it warns "No storage option exists to persist the session..."; safe to ignore if you don't use auth on the server.

## SSR with @supabase/ssr

- **`@supabase/ssr` is in beta:** adoption is recommended, but the API may still break. Its clients use PKCE by default and store the session in cookies.
- **Install** `npm install @supabase/supabase-js @supabase/ssr`. It replaces the Auth Helpers (`@supabase/auth-helpers-nextjs`, `-sveltekit`, `-remix`, being deprecated): uninstall them; `@supabase/ssr` exports `createBrowserClient` and `createServerClient`.

| Framework | URL and key variables |
|---|---|
| Next.js | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| SvelteKit, Astro | `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| Remix, React Router, Express, Hono | `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` |
| Nuxt | `NUXT_PUBLIC_SUPABASE_URL`, `NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, mapped into `runtimeConfig.public` |
| TanStack Start | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` |

Astro needs `output: 'server'`. The Next.js quickstart is `npx create-next-app -e with-supabase` (cookie auth, sign-up at `/auth/sign-up`); compare your setup against it when debugging.

- **`createBrowserClient` is a singleton** in browser code. **`createServerClient` is created anew per request** (it configures a `fetch` with that request's cookies). Never keep a server client at module scope: with Vercel Fluid compute it is reused across users' requests and leaks sessions.
- **Cookies:** `cookies: { getAll, setAll }`. `setAll(cookiesToSet, headers)` receives the cookies and a headers object with `Cache-Control`, `Expires`, `Pragma`, which must be applied to the response so CDNs don't cache and leak sessions. Since v0.10.0 those headers are passed automatically whenever a refresh occurs; on older versions set `Cache-Control: private, no-store` on auth routes yourself. The default cookie name is `sb-<project_ref>-auth-token`.
- **Cookie internals:** default options `{ path: "/", sameSite: "lax", httpOnly: false, maxAge: 400 days }`. Values over 3180 bytes are split into chunk cookies `name.0`, `name.1`, ...; stale chunks are cleared with `Max-Age=0`. `cookieEncoding` defaults to `base64url` (values prefixed `base64-`). `SameSite=Lax` is a good default; `Secure` can be a problem on `localhost`.
- **`createBrowserClient` forces `auth.flowType: "pkce"` and ignores `auth.storage`** (passing it logs a warning). Without `cookies` it falls back to `document.cookie`. `cookieOptions.name` maps to `auth.storageKey`. An experimental `cookies.encode: "tokens-only"` keeps only tokens in cookies and the user in `userStorage`.
- **`createServerClient` requires `cookies.getAll`;** `setAll` is optional but recommended (it warns otherwise). The old `get`/`set`/`remove` cookie methods are deprecated and won't be supported in the next major version.

### Next.js

Server Components can't write cookies, so a Proxy refreshes tokens: it calls `getClaims()`, passes the refreshed token to Server Components via `request.cookies.set` and to the browser via `response.cookies.set`. On Next.js 15 and earlier `proxy.ts` is never called (sessions never refresh, users get signed out): use `middleware.ts` with `export async function middleware`; it was renamed in Next.js 16.

```ts
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

```ts
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet, _headers) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have a proxy refreshing user sessions.
          }
        },
      },
    }
  )
}
```

```ts
// proxy.ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'
export async function proxy(request: NextRequest) { return await updateSession(request) }
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}

// lib/supabase/proxy.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
          Object.entries(headers).forEach(([key, value]) => supabaseResponse.headers.set(key, value))
        },
      },
    }
  )
  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims
  if (!user && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/auth')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  // IMPORTANT: You *must* return the supabaseResponse object as it is. ...
  return supabaseResponse
}
```

- **Return the `supabaseResponse` that `setAll` last built.** An earlier response lacks the refreshed cookies, and the user is signed out on the next request. To return a different response, copy the cookies and cache headers:

```ts
const myNewResponse = NextResponse.next({ request })
myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
for (const header of ['cache-control', 'expires', 'pragma']) {
  const value = supabaseResponse.headers.get(header)
  if (value) myNewResponse.headers.set(header, value)
}
return myNewResponse
```

- **Refreshing in two places signs users out.** A reuse outside the two exceptions (the short reuse window, parent-of-active) revokes the whole session, which looks like random sign-outs.
- **Prefetching** (`<Link>`, `Router.push()`) can reach the server before the browser has processed the tokens and render unauthenticated: after sign-in, redirect to a page without prefetching.
- **Server fetches to your own API routes must forward the cookie header:** `fetch(url, { headers: { cookie: headers().get('cookie') as string } })`.

### Other frameworks

- **SvelteKit** `hooks.server.ts` sets `event.locals.supabase = createServerClient(...)`; `setAll` must pass `{ ...options, path: '/' }` (SvelteKit's cookie API requires a path) and call `event.setHeaders(headers)`; `resolve(event, { filterSerializedResponseHeaders(name) { return name === 'content-range' || name === 'x-supabase-api-version' } })`.
- **TanStack Start** needs no proxy (routes render on the server): protect each route with a `fetchClaims` server function that calls `getClaims()` (returning `null` on error), called from a layout route's `beforeLoad` (for example `_protected.tsx`) that redirects to `/login`. `beforeLoad` only gates rendering: every server function that returns or changes private data must call `getClaims()` itself.
- **Remix-style frameworks:** pass the collected `Set-Cookie` headers on redirects (see OAuth below).

### Caching leaks

- **A cached `Set-Cookie` signs other users in as the wrong person.** Don't use ISR on routes that refresh sessions; in Nuxt avoid `isr` on authenticated routes; in Next.js use `export const dynamic = 'force-dynamic'`. CDN and reverse-proxy caching carry the same risk.
- **CloudFront may cache despite `Cache-Control: private, no-store`** when Minimum TTL > 0 or cookies and `Set-Cookie` aren't forwarded: set Minimum TTL to 0, use `Cache-Control: no-cache="Set-Cookie"`, or disable caching (managed `CachingDisabled` policy) on auth routes. AWS Amplify and other managed CDNs may ignore the headers too.
- **If you cache SSR pages,** cache only routes that never write `Set-Cookie`, and put the refresh token cookie value in the cache key for user-specific content.
- **Anonymous users and static rendering:** user metadata has been reported cached across anonymous users by Next.js static rendering; render those pages dynamically.

## Client API notes (supabase-js)

- **Defaults:** `autoRefreshToken: true`, `persistSession: true` (local storage), `detectSessionInUrl: true` (can be a function, to ignore other OAuth providers' fragments), `flowType: 'implicit'`, `debug: false`, `throwOnError: false`, `lockAcquireTimeout: 5000`, `skipAutoInitialize: false`. `initialize()` runs automatically; call it yourself only with `skipAutoInitialize: true`.
- **No more `navigator.locks`:** in-tab refreshes are single-flight, cross-tab races are resolved server-side by parent-of-active, and rotated tokens are discarded if storage changed mid-refresh (`AuthRefreshDiscardedError`). To be v3-ready, omit `lock` and `lockAcquireTimeout`.
- **`onAuthStateChange((event, session) => ...)`** events: `INITIAL_SESSION`, `SIGNED_IN` (sign-in and tab refocus; can fire very often), `SIGNED_OUT` (sign-out, sign-out from another device, time-box, inactivity, single-session), `TOKEN_REFRESHED` (keep the access token in memory instead of calling `getSession()` often), `USER_UPDATED`, `PASSWORD_RECOVERY`, `MFA_CHALLENGE_VERIFIED`. Events are awaited in order, so keep callbacks quick; events are emitted across tabs. Unsubscribe with `data.subscription.unsubscribe()`. Register it early and keep it bug-free: a broken one is a common cause of server "invalid refresh token" errors.
- **Prefer a synchronous callback and defer refresh-triggering work.** Since auth-js v2.107.0, the default lockless path permits `getUser`, `setSession` and session reads inside callbacks; older clients and the custom-lock path retain the lock-based hazard. Awaiting `refreshSession` or another `_callRefreshToken` path inside `TOKEN_REFRESHED` still deadlocks, and the async overload remains deprecated for that case. The old DATA-API line said async Supabase calls always deadlock; the old AUTH-SESSIONS line permitted async auth calls without this refresh exception. [https://github.com/supabase/supabase-js/blob/master/packages/core/auth-js/migrations/lockless-coordination.md; https://github.com/supabase/supabase-js/blob/master/packages/core/auth-js/src/GoTrueClient.ts; https://supabase.com/docs/reference/javascript/auth-onauthstatechange]
- **Non-browser apps** (React Native, Electron) call `startAutoRefresh()` and `stopAutoRefresh()`, wired to `AppState` `'active'`; browsers refresh only in foreground tabs.
- **`auth.dispose()`** stops auto-refresh, removes the `visibilitychange` listener, closes the cross-tab `BroadcastChannel` and clears subscribers; for React Strict Mode and HMR. Safe to call repeatedly; an in-flight refresh may still persist a rotated session.
- **`refreshSession()`** or `refreshSession({ refresh_token })` always returns a new session and throws on an invalid token. `setSession({ access_token, refresh_token })` refreshes if expired and fires `SIGNED_IN`.
- **`resend({ type: 'signup' | 'sms' | 'email_change' | 'phone_change', email | phone, options: { emailRedirectTo } })`** resends only if an initial request exists. Resend magic links and OTPs by calling `signInWithOtp()` again, recovery by calling `resetPasswordForEmail()` again.
- **`updateUser({ email | phone | password | data | nonce })`:** an email change sends confirmations to both the current and the new address by default (turn off Secure email change for new-only).
- **`verifyOtp` types:** phone `sms`, `phone_change`; email `email`, `recovery`, `invite`, `email_change` (`signup` and `magiclink` are deprecated); or `{ token_hash, type }`.
- **`signUp` and `signInWithOtp` with phone take `options.channel: 'sms' | 'whatsapp'`.**
- **Since 2026-06-30, supabase-js and auth-js require Node 22+** (Node 20 dropped).

### Mobile deep links

- **Expo:** register `"scheme": "com.supabase"` in the app config, add a redirect URL such as `com.supabase://**`, build the redirect with `makeRedirectUri()` from `expo-auth-session`. For OAuth: `signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } })`, then `WebBrowser.openAuthSessionAsync(data.url, redirectTo)`, parse `access_token` and `refresh_token` from the returned URL and call `setSession({ access_token, refresh_token })`. `WebBrowser.maybeCompleteAuthSession()` is required on web.
- **Flutter:** a callback such as `io.supabase.flutterquickstart://login-callback` (`[YOUR_SCHEME]://[YOUR_HOSTNAME]`) in Additional Redirect URLs, plus an Android intent filter and iOS `CFBundleURLSchemes`. The intent filter for a `your-scheme://callback` redirect, as [ApparenceKit](https://apparencekit.dev/blog/flutter-supabase-apple-sign-in/) uses for Apple OAuth on Android:

```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="your-scheme" android:host="callback" />
</intent-filter>
```
- **Redirect URLs for apps:** for example Site URL `com.supabase://login-callback/` and `com.supabase.staging://login-callback/` as an extra.

## Dated changes

| Date | Change |
|---|---|
| 2026-06-30 | supabase-js and auth-js drop Node.js 20: use Node 22+ |
| 2026-05 | Custom OAuth/OIDC providers; `@supabase/server` SDK |
| 2025-07-24 | Data API v13 tightened JWT validation, breaking some custom JWT setups; fix by re-importing the custom signing key |
| 2025-05-01 | New projects get an RSA asymmetric signing key by default |
| 2024-09-13 | Asymmetric signing keys, JWKS endpoint, `getClaims()` |
| 2024-06-05 | `@supabase/ssr` v0.4 with the `getAll`/`setAll` cookie API; the old API goes away at v1.0.0 |
| end of 2026 | `anon` and `service_role` keys deprecated |

## Conflicting statements: check the current docs

| Item | One source says | Another says |
|---|---|---|
| Default signing algorithm | SSR guide: asymmetric keys are the default for new projects; changelog: RSA for projects created after 2025-05-01 | OAuth server guide: HS256 by default. The signing-keys guide recommends ES256. Check the project's JWT keys page |
| Server user check | SSR guide: `getClaims()` to protect pages and data | JS reference: `getUser()` for authorization on the server |
| API gateway | architecture page: Envoy | search index copy of the page: Kong |
| Where the JWT secret lives | migrating-users page: Settings > API > JWT Secret | API keys guide: Settings > API Keys and Settings > JWT Keys; there is no Settings > API page |

## Prove it

- **Server checks:** no `getSession()` in server code; every protected route, server function and proxy calls `getClaims()` (or `getUser()` where revocation matters). Forge a session cookie with a fake user and confirm the route rejects it.
- **SSR session survives:** sign in, wait past the JWT expiry, load a server-rendered page: still signed in, and the response carries `Cache-Control: private, no-store` (or the headers `setAll` received). No auth route uses ISR or a cached CDN behavior.
- **Sign-out:** after `signOut({ scope: 'global' })` another device gets `refresh_token_not_found` at its next refresh, and the `auth.sessions` row for that `session_id` is gone.
- **Keys:** no `sb_secret_` or `eyJ...service_role` value in any bundle or `NEXT_PUBLIC_`/`VITE_`/`PUBLIC_` variable; a browser request with the secret key gets 401; legacy keys show no recent use before you disable them.
