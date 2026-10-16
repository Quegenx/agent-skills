# Auth

Supabase Auth signs users in (password, magic link, OTP, social login, SSO, Web3, passkeys, anonymous) and issues the JWTs that every other Supabase API trusts. The token is the mechanism that decides most outcomes: its `role` claim picks the Postgres role, its `sub` is `auth.uid()` in RLS, its claims are only as fresh as its last refresh, and it stays valid until `exp` whatever happens to the session behind it. SECURITY.md has the short checklist; this file is the full treatment.

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
- **`@supabase/server`** verifies JWTs, resolves the new API keys (`SUPABASE_PUBLISHABLE_KEYS`, `SUPABASE_SECRET_KEYS`), and gives a caller-scoped client and an admin client. `withOAuthProtectedResource` handles OAuth discovery for MCP servers.

```ts
import { withSupabase } from '@supabase/server'
export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    // ctx.supabase is scoped to the caller and respects RLS
    const { data } = await ctx.supabase.from('todos').select()
    return Response.json(data)
  }),
}
```

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

## PKCE and implicit flows

- **Implicit:** the redirect carries `#access_token=...&refresh_token=...` in the URL fragment; the client library detects and stores it. It works only on the client, because browsers never send the fragment to the server. Use PKCE to get tokens on a server; with SSR you are using PKCE.
- **Client-only defaults:** implicit in JavaScript (supabase-js `flowType: 'implicit'`) and Dart, PKCE in Swift.
- **PKCE:** the redirect carries `?code=...`; exchange it with `exchangeCodeForSession(code)`. The code is valid for 5 minutes and can be exchanged once. The code verifier is stored locally when the flow starts, so the exchange must happen in the same browser on the same device.
- **PKCE covers** magic link, OAuth, sign-up and password recovery (`signInWithOtp`, `signInWithOAuth`, `signUp`, `resetPasswordForEmail`). Phone and email OTPs behave the same in both flows (the access token comes in the response body). PKCE can't be used when autoconfirm is enabled.
- **Client config for PKCE without `@supabase/ssr`:** `auth: { detectSessionInUrl: true, flowType: 'pkce', storage: { getItem, setItem, removeItem } }`, where the storage implements `SupportedStorage` (a custom adapter, since `localStorage` may be missing server-side).
- **Overlapping flows** (`signInWithOAuth()` in two tabs) overwrite the earlier verifier and the first exchange fails. An experimental opt-in (API may change without notice) appends `sb_flow_id` to `redirectTo`:

```js
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { experimental: { appendPkceFlowIdToRedirects: true } },
})
const { data } = await supabase.auth.signInWithOAuth({ provider: 'github' })
const flowId = data.flowId
await supabase.auth.exchangeCodeForSession(authCode, { flowId })
```

  With a flow ID whose verifier is missing, the exchange fails instead of trying another verifier (a wrong one would consume the single-use code); without one the most recent verifier is used; browsers read `sb_flow_id` automatically.

## Redirect URLs

- **`redirectTo` must match the Redirect URLs allow list** (Dashboard URL Configuration; locally `auth.additional_redirect_urls`). A non-matching `redirectTo` is silently ignored and the user goes to the Site URL, no error.
- **Set the Site URL to production.** It is the default redirect (`http://localhost:3000` until changed) and critical for email confirmations and password resets.
- **Wildcards:** `*` any sequence without separators, `**` any sequence, `?` one non-separator character, `\c` a literal, `[!range]` a negated range; separators are `.` and `/`. `http://localhost:3000/*` matches `/foo` but not `/foo/bar` or `/foo/`; `/**` matches nested paths. Use exact paths in production rather than `**`.
- **Preview deployments:** `http://localhost:3000/**` plus `https://**--my_org.netlify.app/**` or `https://*-<team-or-account-slug>.vercel.app/**`. A `getURL()` helper picks `NEXT_PUBLIC_SITE_URL` ?? `NEXT_PUBLIC_VERCEL_URL` ?? `http://localhost:3000/`, forcing `https://` and a trailing `/`.
- **With `redirectTo`, use `{{ .RedirectTo }}` instead of `{{ .SiteURL }}` in email templates.**
- **On failure the user is still redirected,** with `error_code` and `error_description` in the URL fragment.
- **The OAuth 2.1 server's redirect URIs are configured separately.** Web3 sign-in rejects messages for URLs not on the list.

## Sign-in methods

### Email and password

- **Email auth is on by default.** Email confirmation is on by default on hosted projects and off for self-hosted and local dev (`auth.email.enable_confirmations`).
- **`signUp({ email, password, options: { emailRedirectTo } })`:** with Confirm email on it returns `user` with `session: null`; off, both. For an existing confirmed user, if both Confirm email and Confirm phone are enabled (even with the phone provider disabled) it returns an obfuscated fake user; if either is disabled it returns `User already registered`. An email already used through OAuth gets an obfuscated response and no email.
- **`signInWithPassword({ email, password })`** or `({ phone, password })` (`POST /auth/v1/token?grant_type=password`). Its error doesn't distinguish a missing account, a wrong password or a social-only account.
- **PKCE confirmation:** link the email template to your own route, which calls `verifyOtp({ type, token_hash })` and redirects to `next`.

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next={{ .RedirectTo }}">Confirm email address</a>
```

```ts
import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'
  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) { redirect(next) }
  }
  redirect('/auth/auth-code-error')
}
```

- **Password reset:** a public page calls `resetPasswordForEmail(email, { redirectTo })` (redirect on the allow list), which never reveals whether the account exists (no email, no error). An authenticated-only page calls `updateUser({ password })`. The PKCE reset template uses `type=recovery&next=/account/update-password`; on recovery link pages `onAuthStateChange` fires `PASSWORD_RECOVERY` instead of `SIGNED_IN`.
- **Check the current password** with `updateUser({ password, current_password })` (supabase-js v2.102.0+, supabase-kt 3.5.0+).
- **Reauthentication:** with Secure password change on, a user whose session is older than 24 hours must call `reauthenticate()` (sends a nonce OTP to the email, or the confirmed phone when there is no confirmed email) and pass it as `updateUser({ password, nonce })`; otherwise the change fails with `reauthentication_needed`.
- **Password rules:** minimum length (below 8 not recommended; local default 6), required character classes (strongest: digits, lowercase, uppercase, symbols), leaked password protection through HaveIBeenPwned (Pro Plan and above). Stronger rules don't lock out existing users, but `signInWithPassword` returns a `WeakPasswordError` explaining why. Passwords are bcrypt-hashed with a random salt in `auth.users.encrypted_password`.
- **Phone as a password identifier is usually discouraged** (numbers get recycled); enable MFA if you use it. `signUp({ phone: '+13334445555', password })`, then `verifyOtp({ phone, token, type: 'sms' })` (`POST /auth/v1/signup`, `POST /auth/v1/verify`).

### Magic link and email OTP

- **Both are on by default; magic links are email-only and single-use.** `signInWithOtp` sends a magic link when the template contains `{{ .ConfirmationURL }}` and a six-digit code when it contains `{{ .Token }}` (for example `<p>Please enter this code: {{ .Token }}</p>`); verify a code with `verifyOtp({ email, token: '123456', type: 'email' })`.
- **It signs users up automatically** unless `shouldCreateUser: false`. Its errors don't distinguish a missing account from a social-only one.

```js
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'valid.email@supabase.io',
  options: { shouldCreateUser: false, emailRedirectTo: 'https://example.com/welcome' },
})
```

- **Defaults:** one request per 60 seconds per user; links and codes expire after 1 hour. Email OTP expiration (Authentication > Sign In / Providers > Email) also governs magic links, confirmation, recovery, email change and invite links. Above 86,400 seconds is strongly discouraged and only settable through the Management API. The JS reference says 24 hours by default; the guides say 1 hour: check the current docs.
- **Expo:** `emailRedirectTo: makeRedirectUri()` from `expo-auth-session`.

### Phone OTP

- **Needs an SMS provider:** MessageBird, Twilio, Vonage, or TextLocal (community-supported); WhatsApp only through Twilio and Twilio Verify (`options.channel: 'whatsapp'`). Config namespace `auth.sms`.
- **`signInWithOtp({ phone: '+13334445555' })`** (`POST /auth/v1/otp`), then `verifyOtp({ phone, token, type: 'sms' })`, which returns `{ access_token, token_type: 'bearer', expires_in: 3600, refresh_token }`. Change number with `updateUser({ phone })`.
- **Timing conflicts on the same page:** one request per 60 seconds and expiry after 1 hour, but also "a 6-digit pin that you must verify within 60 seconds". Check the current docs.
- **Control SMS cost** with rate limits and CAPTCHA, and follow country rules such as India's TRAI DLT.
- **`auth.users.phone_change` isn't unique:** an abandoned verification can make a later `updateUser({ phone })` verification attach the number to a different user. Clear stale `phone_change` values periodically.

### Anonymous sign-ins

- **`signInAnonymously({ options: { captchaToken, data } })`** creates a user that can't be recovered after sign-out, cleared browsing data or a different device.
- **Anonymous users get the `authenticated` role** with `is_anonymous` in the JWT. That's unlike the `anon` key, which creates no user. Review existing RLS before enabling them, and gate what permanent users only may do with a restrictive policy (a restrictive policy alone admits nothing; some permissive policy must also pass):

```sql
create policy "Only permanent users can post to the news feed"
on news_feed as restrictive for insert
to authenticated
with check ((select (auth.jwt()->>'is_anonymous')::boolean) is false );
```

- **Convert to permanent** (needs manual linking enabled): `updateUser({ email })`, verify it, then `updateUser({ password })`; or `linkIdentity({ provider: 'google' })`. If the email belongs to an existing user, `updateUser` errors: sign in to that account and move the rows yourself (`update ... set user_id = existingUser.id where user_id = anonId`), resolving conflicts by overwriting or merging.
- **Abuse:** enable invisible CAPTCHA or Turnstile; the per-IP limit is 30 per hour (configurable). There is no automatic cleanup:

```sql
delete from auth.users
where is_anonymous is true and created_at < now() - interval '30 days';
```

### Social login (OAuth)

- **Providers:** Apple, Azure (Microsoft), Bitbucket, Discord, Facebook, Figma, GitHub, GitLab, Google, Kakao, Keycloak, LinkedIn, Notion, Slack, Spotify, Twitter, Twitch, WorkOS, Zoom, plus any OAuth2 or OIDC provider as a custom provider.
- **`signInWithOAuth({ provider, options: { redirectTo, scopes: 'repo gist notifications', queryParams, skipBrowserRedirect } })`.** Native sign-in and One Tap use `signInWithIdToken({ provider, token, nonce? })`.
- **Starting OAuth on the server:** use an `@supabase/ssr` server client, redirect to `data.url`, and send the client's cookies with the redirect. `signInWithOAuth` stores the PKCE verifier in a cookie; if that `Set-Cookie` never reaches the browser the callback can't exchange the code. Next.js and SvelteKit cookie APIs handle it; in Remix-style frameworks pass the collected `Set-Cookie` headers yourself.
- **The callback route** (Next.js `/auth/callback`) calls `exchangeCodeForSession(code)`, accepts only a relative `next` (`if (!next.startsWith('/')) next = '/'`), honors `x-forwarded-host` in production, and sends failures to `/auth/auth-code-error`.
- **Provider tokens:** the session carries `provider_token` and `provider_refresh_token` for calling the provider's API. Auth doesn't refresh the provider token, so use the provider refresh token; none can mean the provider doesn't issue one or extra scopes are needed. Provider tokens aren't stored in the database: to use them outside the browser that completed the flow, send them to a trusted server.
- **Google:** scopes `openid` (add it yourself), `.../auth/userinfo.email`, `.../auth/userinfo.profile`; extra sensitive scopes can trigger a long verification. Use a custom domain (for example `auth.example.com`) and brand verification, or users see `<project-id>.supabase.co` on the consent screen. The web client's Authorized JavaScript origins are your app URLs; its redirect URI is the Supabase callback from the dashboard (locally `http://127.0.0.1:54321/auth/v1/callback`). Several client IDs (web, iOS, Android) are comma-separated with the web one first; iOS native needs Skip nonce check.
- **Google refresh token:** not sent by default; pass `options: { queryParams: { access_type: 'offline', prompt: 'consent' } }`, and store `provider_token` from the session returned by `signInWithOAuth` (implicit) or `exchangeCodeForSession` (PKCE).
- **Google One Tap:** `signInWithIdToken({ provider: 'google', token: response.credential, nonce })`; set `data-use_fedcm_for_prompt="true"` for the third-party cookie phase-out; give Google the SHA-256 hex hash of the nonce and Supabase the raw nonce.
- **Google "Error getting user email from external provider":** some Workspace setups need the explicit scope `https://www.googleapis.com/auth/userinfo.email` in `signInWithOAuth({ options: { scopes } })`.

```toml
[auth.external.google]
enabled = true
client_id = "<client-id>"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET)"
skip_nonce_check = false
```

  Management API keys: `external_google_enabled`, `external_google_client_id`, `external_google_secret`.

- **Apple:** the OAuth flow (web, Flutter web, Kotlin outside iOS) needs a new client secret generated from the `.p8` key every 6 months, or auth breaks. Apple gives the user's full name only on the first sign-in through native methods (Sign in with Apple JS or native SDKs), never through OAuth: save it with `updateUser` (revoking and re-authorizing returns it again). Expo Go uses App ID `host.exp.Exponent`, which must be in Client IDs with every bundle ID variant.

### Custom OAuth and OIDC providers

- **Identifier** `custom:` followed by 2 to 50 characters (lowercase alphanumerics, hyphens, colons). Types `oauth2` (manual authorization, token and userinfo URLs) and `oidc` (issuer discovery from `{issuer}/.well-known/openid-configuration` or `discovery_url`; `openid` scope always added; ID tokens verified against the provider JWKS; `skip_nonce_check` defaults to false). Free plan: up to 3. Copy the read-only Callback URL into the IdP.
- **Manage with the admin API:** `supabase.auth.admin.customProviders.createProvider({...})` (validates OIDC discovery), `listProviders({ type })`, `updateProvider(id, {...})` (partial; can't change `provider_type` or `identifier`; rotate by updating `client_secret`), `deleteProvider(id)`. Sign in with `signInWithOAuth({ provider: 'custom:my-provider' })` or `GET /auth/v1/authorize?provider=custom:my-provider`.
- **Options:** PKCE on by default (`pkce_enabled: true`; disable only if the IdP lacks it); extra `authorization_params` (strings), except the reserved `client_id`, `client_secret`, `redirect_uri`, `response_type`, `state`, `code_challenge`, `code_challenge_method`, `code_verifier`, `nonce`; `acceptable_client_ids` for multi-platform audiences; `email_optional: true` for providers without email.
- **Errors:** `validation_failed` 400, `conflict` 400 (identifier exists), `over_custom_provider_quota` 400, `custom_provider_not_found` 404.

### Enterprise SSO (SAML 2.0)

- **Any SAML 2.0 IdP** (Google Workspace, Okta, Auth0, Microsoft Entra, PingIdentity, OneLogin). Off by default; Pro plan and above. Managed with `supabase sso` (CLI v1.46.4+); only project writers can manage IdPs.
- **Service provider values:** EntityID and metadata `https://<project>.supabase.co/auth/v1/sso/saml/metadata` (`?download=true` for a file), ACS `https://<project>.supabase.co/auth/v1/sso/saml/acs`. An SLO URL is advertised but single logout isn't supported: rely on time-box and inactivity timeouts. NameID must be `emailAddress` or `persistent`. `supabase sso info --project-ref <ref>`.
- **Add an IdP:** `supabase sso add --type saml --project-ref <ref> --metadata-url '<url>' --domains company.com` (or `--metadata-file`). Prefer metadata URLs (Okta, Entra, Ping support them; Google Workspace and on-premises need the XML). Also `supabase sso list`, `show <id> -o json`, `update <id>`.
- **`supabase sso remove <id>` logs all its users out immediately, and those accounts can never be accessed again,** even if the IdP is added back. The EntityID can't change (a new EntityID is a new IdP). The SAML private key can't be extracted.
- **Sign in** SP-initiated with `signInWithSSO({ domain: 'company.com' })` or `({ providerId })`, then `window.location.href = data.url`. IdP-initiated sign-in doesn't work with PKCE (no verifier): instead link the IdP to a "bookmark app" endpoint such as `/auth/saml-init` that calls `signInWithSSO`. For several subdomains pass `options: { redirectTo }` and exchange the code on a `/callback`.
- **Attributes:** without a mapping only the email is extracted; users without an email are rejected. Map more with `--attribute-mapping-file` (`{ "keys": { "email": { "name": "mail" }, "first_name": { "name": "givenName" } } }`; options `array: true`, `default`, `names: [...]`). Mapped attributes land in the JWT, `auth.identities.identity_data` (provider `sso:<uuid>`, id = NameID) and `auth.users.raw_user_meta_data`. Email lookup order: `urn:oid:0.9.2342.19200300.100.1.3`, `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress`, `http://schemas.xmlsoap.org/claims/EmailAddress`, `mail`, `email`, then NameID with format `urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress`.
- **SSO users are never identity-linked:** a password user and an SSO user with the same email are two accounts. Emails aren't unique, so reference users by UUID. The IdP may limit sessions, and SSO users can't update fields like email (`user_sso_managed`).
- **RLS on SSO:** `auth.jwt()#>>'{amr,0,method}'` (`sso/saml`), `auth.jwt()#>>'{amr,0,provider}'` (IdP UUID), `auth.jwt()#>>'{user_metadata,iss}'` (IdP EntityID); with MFA, `amr[0]` may be another method. Per-tenant: store `organization_settings.sso_provider_id` and add a restrictive policy `sso_provider_id = (select auth.jwt()#>>'{amr,0,provider}')`.

### Web3 (Ethereum, Solana)

- **Any Ethereum or Solana wallet,** using EIP-4361 messages. Auth checks the structure, the signature, a timestamp within 10 minutes of the call, and that the URI and domain are on the Redirect URLs list (register the sign-in page, for example `https://example.com/sign-in/`, where the last slash matters, or `https://example.com/**`). The wallet address is the identity.
- **Calls:** `signInWithWeb3({ chain: 'ethereum', statement })` (EIP-1193 `window.ethereum`), with `wallet: selectedWallet` (EIP-6963), or `{ chain: 'ethereum', message, signature }`. Solana: `{ chain: 'solana', statement }` with `window.solana` (most wallets require the statement), or `wallet: window.braveSolana`, `window.phantom` or a Wallet Adapter `useWallet()` object. Add email, phone or social later with `updateUser()` or `linkIdentity()`.
- **Abuse:** sign-ins need no email or phone and are free to automate, so keep the rate limit (30 per 5 minutes per IP) and add CAPTCHA.

```toml
[auth.web3.solana]
enabled = true
[auth.web3.ethereum]
enabled = true
```

### Passkeys (experimental)

- **Opt in on the client:** `createClient(url, key, { auth: { experimental: { passkey: true } } })`, with `@supabase/supabase-js` v2.105.0+, `supabase_flutter` v2.15.0+ or `supabase-swift` v2.48.0+. The API may change.
- **Discoverable credentials** (no email or username needed). Registering needs an existing, confirmed, non-anonymous user; signing in needs a confirmed email or phone and no ban. SSO and anonymous users can't register passkeys.
- **Enable** in Authentication > Passkeys: Relying Party display name, RP ID (bare domain: no scheme, port or path), RP origins (up to 5; HTTPS except loopback; hostnames equal to or under the RP ID; Android `android:apk-key-hash:<...>`). **Changing the RP ID makes every existing passkey unusable.** Management API keys `passkey_enabled`, `webauthn_rp_id`, `webauthn_rp_display_name`, `webauthn_rp_origins`.

```toml
[auth.passkey]
enabled = true
[auth.webauthn]
rp_display_name = "My App"
rp_id = "example.com"
rp_origins = ["https://example.com", "https://app.example.com"]
```

- **APIs:** `auth.registerPasskey()` (signed in), `auth.signInWithPasskey()` (fires `SIGNED_IN`; `{ options: { mediation: 'conditional' } }` for autofill), two-step `auth.passkey.startRegistration()`/`verifyRegistration()` and `startAuthentication()`/`verifyAuthentication()`, `passkey.list()`, `update({ passkeyId, friendlyName })` (max 120 characters, derived from the AAGUID by default), `delete()`. Admin (secret key): `auth.admin.passkey.listPasskeys({ userId })`, `deletePasskey({ userId, passkeyId })`.
- **The challenge expires after 5 minutes** (`GOTRUE_WEBAUTHN_CHALLENGE_EXPIRY_DURATION`) with `webauthn_challenge_expired`; a retry cancels the pending ceremony (`ERROR_CEREMONY_ABORTED`). Errors: `passkey_disabled`, `too_many_passkeys`, `webauthn_credential_exists`, `webauthn_credential_not_found`, `webauthn_challenge_not_found`, `webauthn_challenge_expired`, `webauthn_verification_failed`, plus `email_not_confirmed`, `phone_not_confirmed`, `user_banned`.

### Third-party auth (Clerk, Firebase, Auth0, Cognito, WorkOS, custom OIDC)

- **The Data API, Storage, Realtime and Functions can trust another provider's JWTs,** alongside or instead of Supabase Auth (which can't be disabled). Pass the token with `createClient(url, key, { accessToken: async () => getAccessTokenFromYourProvider() })`, returning `null` when signed out.
- **The provider must sign asymmetrically with a `kid` header via an OIDC discovery URL** (no HS256; Auth0 tenants on HS256 or PS256 aren't supported). Signing keys are stored in project config and checked periodically: allow up to 30 minutes after the provider rotates keys.
- **The JWT needs a `role` claim** (`authenticated` for signed-in users), or requests run as `anon`. Cognito: a Pre-Token Generation Trigger. Auth0: an Action calling `api.idToken.setCustomClaim('role', 'authenticated')`, and pass the ID token (Auth0 strips non-namespaced claims from access tokens, so `api.accessToken.setCustomClaim` doesn't work). Firebase: a custom user claim through the admin SDK or blocking functions. Clerk: customize session tokens.
- **Custom OIDC:** the issuer must be HTTPS with `<issuer>/.well-known/openid-configuration`; add it under Authentication > Sign In / Providers > Third-Party Auth or the Management API (`oidc_issuer_url`); it isn't available in the CLI or `config.toml`. Clerk locally: `[auth.third_party.clerk] enabled = true domain = "example.clerk.accounts.dev"`.
- **`auth.uid()` casts `sub` to uuid and fails on non-UUID subjects:** use `(select auth.jwt()->>'sub')` against a `text` column. With several issuers (or Supabase Auth as well) `sub` values can collide: add a restrictive policy checking `iss`.
- **Firebase uses one key set for every Firebase project.** Hosted projects reject unregistered Firebase project IDs before the database; self-hosted projects must add a restrictive policy checking `iss = 'https://securetoken.google.com/<firebase-project-id>'` and `aud = '<firebase-project-id>'` (a helper such as `is_supabase_or_firebase_project_jwt()`).

### Supabase as an OAuth 2.1 provider (beta)

- **Auth can act as an OAuth 2.1 and OIDC provider** ("Sign in with [Your App]", MCP agent auth, first-party apps): authorization code flow with mandatory PKCE, ID tokens (`openid` scope), UserInfo, discovery, scopes `openid`, `email`, `profile`, `phone`, dynamic client registration for MCP. OAuth users count as MAU.
- **Enable** in Authentication > OAuth Server or `[auth.oauth_server] enabled = true authorization_url_path = "/oauth/consent" allow_dynamic_registration = false`. You build the consent UI with `supabase.auth.oauth.getAuthorizationDetails(authorization_id)` (`scope` is a space-separated string). Manage clients with `admin.oauth.*` (create, delete, get, list, regenerateClientSecret, update).
- **ID tokens need asymmetric signing keys;** generation fails with HS256.
- **OAuth access tokens are ordinary Supabase JWTs plus a `client_id` claim.** Scopes control OIDC data, not database access: restrict clients in RLS, for example `(auth.jwt() ->> 'client_id') = 'mobile-app-client-id'`, or `IS NULL` for direct user sessions only. Custom Access Token hooks run for every issuance; tell them apart by `client_id` or `authentication_method = 'oauth_provider/authorization_code'`.
- **Since 2026-06-01 the token endpoint `/v1/oauth/token` returns 200 instead of 201.**

## Identity linking

- **Automatic linking** joins identities with the same email into one user. To prevent pre-account takeover, linking a new identity removes the user's other unconfirmed identities. SAML SSO users are never linked.
- **Manual linking (beta)** needs Enable Manual Linking (self-hosted `GOTRUE_SECURITY_MANUAL_LINKING_ENABLED: true`) and a signed-in user: `linkIdentity({ provider: 'google' })` (redirect; supports PKCE; the browser redirects automatically, a server must redirect itself), or natively `linkIdentity({ provider: 'google', token: idToken, access_token })` for the `signInWithIdToken()` providers: Google, Apple, Facebook, Kakao, Keycloak. It fails if the identity is already linked to this or another user.
- **Unlink** with `getUserIdentities()` then `unlinkIdentity(identity)`: signed in, at least 2 identities, and the identity must belong to the user.
- **Add a password to an OAuth account** with `updateUser({ password })`.

## MFA

- **Factors:** TOTP (authenticator app) and phone (SMS or WhatsApp, codes generated by Auth). Up to 10 enrolled factors per user. Setting a factor to Verification Disabled turns off both its challenge and verify APIs.
- **Assurance levels:** `aal1` is a conventional sign-in (password, magic link, OTP, phone, social); `aal2` adds at least one verified second factor. It's the JWT's `aal` claim; a JWT without one is `aal1`.
- **Four parts, all required:** enrollment, unenrollment, a challenge at sign-in, and enforcement in the frontend, backend, APIs and RLS. A UI alone adds no security.
- **TOTP:** `mfa.enroll({ factorType: 'totp' })` returns `{ id, type, totp: { qr_code, secret, uri }, friendly_name }` (the QR code is SVG for an `<img src>` data URL; the URI looks like `otpauth://totp/supabase:alice@supabase.com?secret=<secret>&issuer=supabase`), then `mfa.challenge({ factorId })`, then `mfa.verify({ factorId, challengeId, code })`; the factor becomes active on success. `mfa.challengeAndVerify({ factorId, code })` combines them (TOTP only). A code is valid for one 30-second interval, with one interval of clock skew. "Invalid TOTP code entered" usually means the device clock is off.
- **Verifying a factor logs out all other sessions** and promotes the current one to `aal2`; the client refreshes the session automatically.
- **Phone MFA** shares provider config with phone sign-in (or the Send SMS hook). `mfa.enroll({ phone, factorType: 'phone' })`; `challenge()` sends the code (`channel` defaults to `sms`, or `whatsapp`). One verified phone factor per number (a duplicate errors). Codes are valid up to 5 minutes, earlier codes stay valid until expiry; use the longest acceptable code length, minimum 6 (Auth > MFA). It is vulnerable to SIM swap.
- **The challenge step:** `mfa.getAuthenticatorAssuranceLevel()` returns `{ currentLevel, nextLevel, currentAuthenticationMethods }`. Without a JWT it takes microseconds and rarely hits the network (so does `listFactors()`); with a JWT (for example in Edge Functions) it makes a request.

| current | next | Meaning |
|---|---|---|
| aal1 | aal1 | no MFA enrolled |
| aal1 | aal2 | enrolled but not verified this session: show the challenge (`nextLevel === 'aal2' && nextLevel !== currentLevel`) |
| aal2 | aal2 | verified |
| aal2 | aal1 | a factor was disabled (stale JWT) |

- **Unenroll** with `mfa.unenroll({ factorId })`: a verified factor needs `aal2` first. The JWT drops to `aal1` only at the next refresh; call `refreshSession()` for an immediate downgrade. Admin `mfa.deleteFactor({ id, userId })` on a verified factor logs the user out of all sessions.
- **On the server,** create a client per request and use `getAuthenticatorAssuranceLevel()` and `listFactors()`. A lower AAL isn't necessarily an attack (an abandoned or long-open tab, a lost device): redirect to the MFA page rather than returning 401 or 403. Other APIs: verify the JWT with a library, compare `aal`, and check factors via `https://<project-ref>.supabase.co/rest/v1/auth/factors`, acting only on `verified` ones.
- **Enforce in RLS with restrictive policies; don't drop `as restrictive`.** All users:

```sql
create policy "Policy name."
  on table_name
  as restrictive
  to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2');
```

  New users only (created after a date):

```sql
create policy "Policy name."
  on table_name
  as restrictive -- very important!
  to authenticated
  using
    (array[(select auth.jwt()->>'aal')] <@ (
       select
         case
           when created_at >= '2022-12-12T00:00:00Z' then array['aal2']
           else array['aal1', 'aal2']
         end as aal
       from auth.users
       where (select auth.uid()) = id));
```

  Users who opted in:

```sql
create policy "Policy name."
  on table_name
  as restrictive -- very important!
  to authenticated
  using (
    array[(select auth.jwt()->>'aal')] <@ (
      select
          case
            when count(id) > 0 then array['aal2']
            else array['aal1', 'aal2']
          end as aal
        from auth.mfa_factors
        where ((select auth.uid()) = user_id) and status = 'verified'
    ));
```

- **Recent sign-in method:** `amr` is ordered most recent first; `jsonb_path_query((select auth.jwt()), '$.amr[0]')` in a policy can require, say, a recent password sign-in. `invite`, `magiclink`, `email/signup` and `email_change` appear only with PKCE.
- **Recovery codes conflict:** the JS reference's MFA overview says recovery codes aren't supported, while the same reference documents an experimental `mfa.recoveryCodes` API (`generate`, `getStatus`, `regenerate`, `unenroll`, `verify`; opt in with `auth: { experimental: { recoveryCodes: true } }`). As documented: it needs `aal2` and another verified factor (`mfa_recovery_codes_sole_factor`), one set per user, codes shown once; verifying upgrades to `aal2`, fires `MFA_CHALLENGE_VERIFIED`, signs out other `aal1` sessions and adds `mfa/recovery_code` to `amr`; too many attempts give `mfa_recovery_codes_locked` (429). Check the current docs.
- **Availability conflict:** the TOTP docs say the TOTP API is free and on for every project; the CLI template says MFA is available on Pro, and its local TOTP `enroll_enabled`/`verify_enabled` are false. Check the current docs and set the local flags explicitly.

## Authorization data in RLS

- **`auth.uid()` returns `null` with no token or an expired session,** so `auth.uid() = user_id` fails silently. Write `auth.uid() IS NOT NULL AND auth.uid() = user_id`, or scope the policy `to authenticated` (which also stops evaluation for `anon`).
- **Wrap `auth.uid()` and `auth.jwt()` in `(select ...)`** so the optimizer evaluates them once per statement (an `initPlan`) instead of per row.
- **`app_metadata` (`raw_app_meta_data`) is for authorization; `user_metadata` (`raw_user_meta_data`) never is:** users can edit it with `updateUser` without checks. Example: `using ( team_id in (select auth.jwt() -> 'app_metadata' -> 'teams'))`. Set `app_metadata` on the server with `admin.updateUserById(id, { app_metadata: { plan: 'trial' } })`.
- **Claims lag:** an `app_metadata` change appears only when the JWT refreshes. Admin updates don't fire the client's `onAuthStateChange`; the client must call `refreshSession()` (fires `TOKEN_REFRESHED`).

### Custom claims and roles (RBAC)

The Custom Access Token hook (Hooks below) puts a role into every token; a helper checks permissions in policies.

```sql
create type public.app_permission as enum ('channels.delete', 'messages.delete');
create type public.app_role as enum ('admin', 'moderator');
create table public.user_roles (
  id        bigint generated by default as identity primary key,
  user_id   uuid references auth.users on delete cascade not null,
  role      app_role not null,
  unique (user_id, role)
);
create table public.role_permissions (
  id           bigint generated by default as identity primary key,
  role         app_role not null,
  permission   app_permission not null,
  unique (role, permission)
);
```

- **The hook** (PL/pgSQL, `stable`) selects the role from `user_roles` and sets it with `jsonb_set(claims, '{user_role}', to_jsonb(user_role))`, or `'null'`. Grants: `grant usage on schema public to supabase_auth_admin; grant execute on function ... to supabase_auth_admin; revoke execute ... from authenticated, anon, public; grant all on table public.user_roles to supabase_auth_admin; revoke all on table public.user_roles from authenticated, anon, public;` and a policy letting the hook read:

```sql
create policy "Allow auth admin to read user roles" ON public.user_roles
as permissive for select
to supabase_auth_admin
using (true);
```

```sql
create or replace function public.authorize(requested_permission app_permission)
returns boolean as $$
declare
  bind_permissions int;
  user_role public.app_role;
begin
  select (auth.jwt() ->> 'user_role')::public.app_role into user_role;
  select count(*) into bind_permissions from public.role_permissions
  where role_permissions.permission = requested_permission and role_permissions.role = user_role;
  return bind_permissions > 0;
end;
$$ language plpgsql stable security definer set search_path = '';

create policy "Allow authorized delete access" on public.channels for delete to authenticated using ( (SELECT authorize('channels.delete')) );
```

- **The hook changes only the access token, not the auth response:** to read custom claims on the client, decode `session.access_token` (for example `jwtDecode` from `jwt-decode`) in `onAuthStateChange`.

## Auth hooks

| Hook | Config name | Plans |
|---|---|---|
| Before User Created | `before_user_created` | Free, Pro |
| Custom Access Token | `custom_access_token` | Free, Pro |
| Send SMS | `send_sms` | Free, Pro |
| Send Email | `send_email` | Free, Pro |
| MFA Verification Attempt | `mfa_verification_attempt` | Teams, Enterprise |
| Password Verification Attempt | `password_verification_attempt` | Teams, Enterprise |

- **Two kinds:** a Postgres function (one `jsonb` argument, returns `jsonb`; the request never leaves the instance) or an HTTP endpoint (JSON in and out; an Edge Function is easiest). Configure in Authentication > Hooks; save hook functions as migrations (`supabase migration new`).
- **Postgres hooks run as `supabase_auth_admin`,** which has no permissions on `public` by default. Supabase applies these grants when you configure the hook in the dashboard; locally you add them yourself. RLS on tables the hook reads must allow `supabase_auth_admin`.

```sql
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
grant usage on schema public to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
```

- **`security definer` on hooks conflicts within the hooks guide:** its security model section offers creating the function in the dashboard as `security definer` (owned by `postgres`); its developing section recommends against `security definer` and for explicit `supabase_auth_admin` grants. Prefer the explicit grants above and check the current docs.
- **Local config:**

```toml
[auth.hook.<hook_name>]
enabled = true
uri = "pg-functions://postgres/<schema>/<function_name>"
```

```toml
[auth.hook.send_sms]
enabled = true
uri = "http://host.docker.internal:54321/functions/v1/send_sms"
secrets = "env(SEND_SMS_HOOK_SECRETS)"
```

  Serve an HTTP hook locally with `supabase functions serve send-sms --no-verify-jwt` (deploy likewise with `--no-verify-jwt`): hooks run before a JWT exists, and authenticity comes from the Standard Webhooks signature.
- **HTTP hooks follow Standard Webhooks:** headers `webhook-id`, `webhook-timestamp`, `webhook-signature`; secret format `v1,whsec_<base64-secret>`; the env var is plural (`SEND_SMS_HOOK_SECRETS`) to allow several secrets later (`secret1|secret2`). Always verify:

```js
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
Deno.serve(async (req) => {
  const payload = await req.text()
  const hookSecret = Deno.env.get('SEND_SMS_HOOK_SECRETS').replace('v1,whsec_', '')
  const headers = Object.fromEntries(req.headers)
  const wh = new Webhook(hookSecret)
  const data = wh.verify(payload, headers)
})
```

| Limit or behavior | Value |
|---|---|
| Payload | uncompressed, 20 KB max |
| Timeout | Postgres hooks 2 seconds, HTTP hooks 5 seconds; both run in a transaction |
| HTTP 200, 202, 204 | proceed (204 not allowed for Custom Access Token, MFA Verification, Password Verification: they need a body) |
| HTTP 400, 403 | treated as 500 |
| HTTP 429, 503 | retryable, only with a non-empty `retry-after` header; up to 3 retries, 2-second back-off, 5-second total budget |
| Content type | every response must be `Content-Type: application/json`, or Auth returns 500 |
| Postgres hook error | return `{ "error": { "http_code": 429, "message": "..." } }` (`http_code` defaults to 500, `message` required); not retried; the rest of the payload is ignored |

- **The SQL Editor mishandles the `?` jsonb operator:** define such functions over a direct database connection. SQL Editor > Templates has hook templates. Mock payloads with JSON Schema Faker; test HTTP hooks with the Standard Webhooks simulator.

### Custom Access Token

- **Runs before every token is issued.** Input: `user_id`, `claims` (may include `client_id` in OAuth flows), `authentication_method` (`oauth`, `password`, `otp`, `totp`, `recovery`, `invite`, `sso/saml`, `magiclink`, `email/signup`, `email_change`, `token_refresh`, `oauth_provider/authorization_code`, `anonymous`). Output: `{ claims }`. Auth checks the required claims afterwards and errors if any is missing.
- **Minimal JWT** (SSR cookie size: long names or emails, too many OAuth claims, big avatar URLs): loop over a keep-list with `original_claims ? claim` and `jsonb_set`, return `jsonb_build_object('claims', new_claims)`.
- **Admin claim:** read `profiles.is_admin`, make sure `app_metadata` exists, `jsonb_set(claims, '{app_metadata, admin}', 'true')`, with `grant all on table public.profiles to supabase_auth_admin; revoke all on table public.profiles from authenticated, anon, public;`.
- **Restrict to SSO users:** `authentication_method` arrives double-quoted when read with `->` (strip with `replace(authentication_method, '"', '')`); reject with `jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', '...'))`.

### Before User Created

- **Runs before the user is inserted** (it doesn't exist in Postgres yet): block disposable domains, regions or IPs, or require a company domain. Input: `metadata` (`uuid`, `time`, `name: "before-user-created"`, `ip_address`) and `user` (the `auth.users` shape).
- **Allow** with `{}` and 200, or 204. **Reject** with `{ "error": { "http_code": 400, "message": "Only company emails are allowed to sign up." } }`. Its page says a 4xx propagates the message to the client; the general hooks page says 400 and 403 become 500. Check what the client receives.
- **SQL patterns:** allow or deny domains from a `signup_email_domains` table with `split_part(email, '@', 2)`; block new signups through one OAuth provider (`event->'user'->'app_metadata'->>'provider' = 'discord'`) while existing users still sign in; allow or deny by CIDR with `ip := event->'metadata'->>'ip_address'` and `ip <<= cidr`. Grant execute and table access to `supabase_auth_admin`, revoke from `authenticated, anon, public`.
- **HTTP version:** `BEFORE_USER_CREATED_HOOK_SECRET="v1,whsec_<base64_secret>"` (generated in Auth Hooks), `supabase secrets set --env-file .env`, `supabase functions new before-user-created-hook`, verified with `standardwebhooks@1.0.0`.

### Send Email and Send SMS

- **Send Email replaces built-in sending** (own provider, i18n, fallback). Input: `user` and `email_data` (`token`, `token_hash`, `redirect_to`, `email_action_type`, `site_url`, `token_new`, `token_hash_new`, `old_email`, `old_phone`, `provider`, `factor_type`). An empty 200 is success.
- **`email_action_type`:** `signup`, `invite`, `magiclink`, `recovery`, `email_change`, `email`, `reauthentication`, `password_changed_notification`, `email_changed_notification`, `phone_changed_notification`, `identity_linked_notification`, `identity_unlinked_notification`, `mfa_factor_enrolled_notification`, `mfa_factor_unenrolled_notification`.
- **Who sends:** email provider on and hook on: the hook (SMTP unused); provider on and hook off: SMTP (custom or default); provider off: email signups disabled regardless.
- **Email change:** with Secure Email Change on there are two OTPs (current `user.email` and `user.new_email`) and two emails; off, one OTP to the new address. The token hash names are reversed for compatibility: `token_hash_new` goes with the current email and `token`; `token_hash` goes with the new email and `token_new`.
- **Confirmation URL:** `https://${PROJECT_REF}.supabase.co/auth/v1/verify?token=<token_hash>&type=<email_action_type>&redirect_to=<redirect_to>`.
- **Send SMS replaces built-in SMS** (regional providers, WhatsApp, fallback, Android `AppHash`). Input `user` and `sms: { otp }`; an empty 200 is success.

### MFA and Password Verification Attempt

- **MFA Verification:** input `factor_id`, `factor_type` (`totp` or `phone`), `user_id`, `valid`; output `{ decision: 'reject' | 'continue', message }`. `reject` denies and signs the user out of all sessions (`mfa_verification_rejected`). Example: one wrong code per 2 seconds, tracked in `mfa_failed_verification_attempts`, with a 429.
- **Password Verification:** input `user_id`, `valid`; output `decision`, `message`, `should_logout_user`. It runs on unauthenticated requests, so attackers can trigger it repeatedly: prefer notifying over blocking. Examples: one wrong password per 10 seconds (429); an email alert after 5 failures in a day using Vault (`vault.create_secret`, `vault.decrypted_secrets`) and `pg_net` (`net.http_post`).

## Email

- **Built-in SMTP is for non-production only:** it sends only to the organization's team members (others fail with `email_address_not_authorized`), currently 2 messages per hour (may change without notice), no SLA. Configure custom SMTP for anything real: email and password, OTPs, magic links, invites, social login with email confirmation.
- **Custom SMTP:** any SMTP service. Management API keys `external_email_enabled`, `mailer_secure_email_change_enabled`, `mailer_autoconfirm`, `smtp_admin_email`, `smtp_host`, `smtp_port` (for example 587), `smtp_user`, `smtp_pass`, `smtp_sender_name`. After enabling it a 30-per-hour limit applies until you raise it in Rate Limits.
- **Since 2026-06-03, new Free plan projects on the default SMTP can't customize auth email templates.**
- **Templates:** Confirm sign up, Invite user, Magic link or OTP, Change email address, Reset password, Reauthentication; security notifications (sent only if enabled): password changed, email changed, phone changed, sign-in method linked or removed, verification method added or removed.
- **Variables:** `{{ .ConfirmationURL }}`, `{{ .Token }}` (6-digit OTP), `{{ .TokenHash }}`, `{{ .SiteURL }}`, `{{ .RedirectTo }}`, `{{ .Data }}` (user_metadata), `{{ .Email }}` (empty when linking an email to an anonymous user), `{{ .NewEmail }}` (change email only), `{{ .OldEmail }}`, `{{ .Phone }}`, `{{ .OldPhone }}`, `{{ .Provider }}`, `{{ .FactorType }}` (notifications). Templates are Go templates: `{{ if eq .Data.Domain "https://www.example.com" }} ... {{ else if ... }} ... {{ end }}`.
- **Where to edit:** hosted in Dashboard Email Templates; locally and self-hosted in `supabase/config.toml` with HTML files (the dashboard builder doesn't apply); by API `GET`/`PATCH https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth` with keys such as `mailer_subjects_confirmation`, `mailer_templates_confirmation_content`, `mailer_subjects_magic_link`, `mailer_templates_recovery_content`, `mailer_notifications_password_changed_enabled`.
- **For SSR,** link to your server endpoint with `token_hash={{ .TokenHash }}&type=invite&redirect_to={{ .RedirectTo }}` and call `verifyOtp({ token_hash, type })`: the session comes back in the body, readable on the server. The default link puts the session in the URL fragment, which the server never sees.
- **Link scanners consume single-use links** (Microsoft Defender Safe Links and other prefetchers), giving "Token has expired or is invalid". Send `{{ .Token }}` and verify with `verifyOtp({ email, token, type: 'email' })`, or link to your own page with `?confirmation_url={{ .ConfirmationURL }}` and a button. Turn off the provider's link tracking, which rewrites links.
- **Mobile magic links:** Go templates sanitize non-http(s) schemes in `{{ .SiteURL }}`, which shows up as `#ZgotmplZ`. Set the Site URL to a web URL, add `your-app-scheme://*` to the redirect URLs, and go email -> website (the user taps a button) -> app deep link; this also fixes "cannot parse response" from in-app browsers and scanners breaking PKCE.
- **Protect deliverability:** CAPTCHA is the most effective defense against bot sign-ups with real addresses (meant to hurt your reputation, cause denial of service or push you to disable confirmations); prefer OAuth, SSO or passwordless; never disable email confirmations under pressure. Set up DKIM, DMARC and SPF and a custom domain, separate auth from marketing domains and addresses, keep a standby SMTP, keep content, links and images minimal, keep user-provided data out of emails, and plan for surges (waitlists).
- **Short sessions mean more sign-in emails.** An unexplained surge of sign-ins in an SSR app usually means misconfigured middleware: keep `@supabase/ssr` updated and follow the guides.
- **Emails not arriving:** check Auth logs for handover errors, then the provider's logs and suppression lists, then recipient firewalls (the default sender domain is `supabase.io`). Test with Mailtrap. Local dev captures mail in Mailpit (`supabase status` prints its URL).

## Abuse protection

- **Rate limits** are set in Authentication > Rate Limits or by `PATCH /v1/projects/$PROJECT_REF/config/auth` (`rate_limit_anonymous_users`, `rate_limit_email_sent`, `rate_limit_sms_sent`, `rate_limit_verify`, `rate_limit_token_refresh`, `rate_limit_otp`, `rate_limit_web3`). Per-IP limits are token buckets, mostly with capacity 30; the anonymous bucket's capacity equals its hourly limit. Exceeding a limit returns 429.

| Limit | Default |
|---|---|
| Emails sent (project) | 2 per hour on the built-in provider; changeable only with custom SMTP or the Send Email hook |
| SMS sent (project) | 30 per hour |
| Sign-ups and sign-ins (`/signup`, `/recover`, `/resend`, `/magiclink`, `/otp`, `/user`; per IP; not anonymous) | 30 per 5 minutes, bursts of 30 |
| OTP or magic link, signup confirmation, password reset (per user) | one per 60 seconds |
| Verify (`/verify`, per IP) | 30 per 5 minutes |
| Token (`/token`, per IP: password, refresh, ID token, PKCE) | 150 per 5 minutes, bursts of 30 |
| MFA challenge and verify (per IP) | 15 per minute, bursts of 30; not customizable |
| Anonymous sign-ins (per IP) | 30 per hour |
| Web3 (`/token`, per IP) | 30 per 5 minutes |

  The production checklist states the same limits per hour (OTP and verify 360, token 1800).
- **Behind a server or proxy, forward the end-user IP** (by default the client IP is used): send `Sb-Forwarded-For` with a secret key (publishable and legacy keys aren't supported), after enabling it (Rate Limits > IP Address Forwarding, or `"security_sb_forwarded_for_enabled": true`):

```ts
const supabase = createServerClient('https://<your-project-id>.supabase.co', '<your-secret-key>', {
  global: { headers: { 'sb-forwarded-for': request.headers.get('x-forwarded-for') } },
})
```

- **CAPTCHA:** hCaptcha or Cloudflare Turnstile on sign-in, sign-up and password reset; enable under Auth > Attack Protection with the provider's secret key. The frontend passes `options: { captchaToken }` (for example to `signUp`). hCaptcha via `@hcaptcha/react-hcaptcha` (`onVerify`; reset with `captcha.current.resetCaptcha()` after each call); Turnstile via `@marsidev/react-turnstile` (`onSuccess`). Local hCaptcha needs ngrok or a hosts entry; Turnstile needs localhost on its domain allowlist.
- **Audit logs** record sign-ups, sign-ins, password changes and resets, email verification, token refresh and sign-out (actions such as `login`, `logout`, `user_signedup`, `user_deleted`, `user_modified`, `user_updated_password`, `token_revoked`, `token_refreshed`, `factor_unenrolled`, `mfa_code_login`, `identity_unlinked`). They go to log storage (queryable only in the dashboard, after a short delay) and optionally to `auth.audit_log_entries` ("Write audit logs to the database" under Authentication > Audit Logs; costs database storage).

## Users and your own tables

- **Expose user data through your own `public` table** with RLS and minimal grants, referencing `auth.users` with `on delete cascade`. Reference only primary keys of Supabase-managed tables: primary keys never change, every other managed column, index or constraint may.

```sql
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  first_name text,
  last_name text,
  primary key (id)
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;
alter table public.profiles enable row level security;
```

- **Fill it with a trigger on `auth.users`.** Trigger functions there run as `supabase_auth_admin`, which can't touch tables outside `auth`, so the function is `security definer` with `search_path = ''`. A failing trigger blocks signups: test it thoroughly.

```sql
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (new.id, new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'last_name');
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

- **Signup metadata:** `signUp({ email, password, options: { data: { first_name: 'John', age: 27 } } })` stores it in `raw_user_meta_data`; read it as `user.user_metadata`. It is user-editable: fine for a display name, never for authorization. Don't rely on its key order.
- **Never insert users with raw SQL** (or let an AI tool do it): use the Auth API. Direct inserts leave columns `NULL` where Auth expects empty strings, giving `500: Database error querying schema` or `Scan error on column "confirmation_token": converting NULL to string is unsupported`. Fix: `update auth.users set confirmation_token = '' where confirmation_token is null;` (same for whichever column is named).
- **Export users** with `select * from auth.users;` (and `auth.identities`) in the SQL Editor, as CSV. Moving users between projects: the `auth` schema (password hashes included) moves by backup or `pg_dump`/`psql`; existing tokens stay valid only if the same JWT secret is reused (setting it regenerates the legacy anon and service_role keys).

### Admin API

- **Every `supabase.auth.admin` method needs a secret key on a trusted server,** on a client created with `auth: { autoRefreshToken: false, persistSession: false }` (the invite example also sets `detectSessionInUrl: false`).

```js
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
})
const { data, error } = await supabase.auth.admin.inviteUserByEmail('someone@example.com', {
  data: { name: 'Jane' }, // optional, stored in user_metadata
  redirectTo: 'https://example.com/welcome',
})
```

- **Invites** create an unconfirmed user; inviting an existing confirmed user errors. Invite links expire with Email OTP Expiration (default 1 hour). `inviteUserByEmail` doesn't support PKCE (the inviting browser isn't the accepting one).
- **`admin.createUser({ email, password, user_metadata, email_confirm, phone, phone_confirm })`:** `email_confirm` and `phone_confirm` default to false, and it sends no confirmation email (use `inviteUserByEmail`).
- **`admin.generateLink({ type, email, password?, newEmail? })`** for sending through your own provider; types `signup`, `magiclink`, `invite`, `recovery`, `email_change_current`, `email_change_new`, `phone_change`. It creates the user for `signup`, `invite` and `magiclink`; the current-address email-change link exists only with Secure email change on.
- **`admin.updateUserById(id, { email, password, user_metadata, app_metadata, email_confirm, phone_confirm, ban_duration: '876000h' })`** applies directly, without confirmation flows.
- **Also:** `admin.getUserById(id)`, `admin.listUsers({ page, perPage })` (50 per page by default), `admin.deleteUser(id)`, `admin.signOut` (removes a signed-in session), `admin.mfa.listFactors()`, `admin.mfa.deleteFactor({ id, userId })`.

### Removing a user's access

- **`admin.deleteUser()`** (default `shouldSoftDelete: false`) removes the `auth.users` row, cascading to `auth.sessions` and invalidating refresh tokens. Their access token still works until it expires.
- **A ban (`admin.updateUserById` with `ban_duration`) only blocks new sign-ins;** existing sessions stay. Marking a user deleted in your own tables leaves the account able to authenticate.
- **A user who owns Storage objects can't be deleted** (error): delete or reassign the objects first. Your own foreign keys to `auth.users` without `ON DELETE CASCADE`, `SET NULL` or `SET DEFAULT` block deletes too (23503).
- **Bound the leftover-token window** with a short JWT expiry, or check `session_id` against `auth.sessions` on sensitive operations.

## The auth schema: hands off

- **Since 2025-04-21, in `auth` (and `storage`, `realtime`) you can't** create tables or functions, drop existing ones, create indexes on existing tables, write to `auth.schema_migrations`, or revoke privileges from API roles. Custom objects there had to move out (`ALTER TABLE ... SET SCHEMA`) or were deleted. Still allowed: foreign keys to these schemas, and RLS policies and triggers on `auth.audit_log_entries`, `auth.identities`, `auth.refresh_tokens`, `auth.sessions`, `auth.users`.
- **Customizing the auth schema** (RLS, column changes, tables, restrictions) can break Auth's own migrations (`running db migrations: Migrator: problem creating schema migrations`): remove the changes and restore the original schema.
- **ORM migrations (Prisma) can take ownership of auth objects or break permissions on `auth.users`,** giving `must be owner of...` (42501). Restore with `ALTER <object> <auth.object> OWNER TO supabase_auth_admin;`; if the owner is `supabase_admin`, contact support.

## Client API notes (supabase-js)

- **Defaults:** `autoRefreshToken: true`, `persistSession: true` (local storage), `detectSessionInUrl: true` (can be a function, to ignore other OAuth providers' fragments), `flowType: 'implicit'`, `debug: false`, `throwOnError: false`, `lockAcquireTimeout: 5000`, `skipAutoInitialize: false`. `initialize()` runs automatically; call it yourself only with `skipAutoInitialize: true`.
- **No more `navigator.locks`:** in-tab refreshes are single-flight, cross-tab races are resolved server-side by parent-of-active, and rotated tokens are discarded if storage changed mid-refresh (`AuthRefreshDiscardedError`). To be v3-ready, omit `lock` and `lockAcquireTimeout`.
- **`onAuthStateChange((event, session) => ...)`** events: `INITIAL_SESSION`, `SIGNED_IN` (sign-in and tab refocus; can fire very often), `SIGNED_OUT` (sign-out, sign-out from another device, time-box, inactivity, single-session), `TOKEN_REFRESHED` (keep the access token in memory instead of calling `getSession()` often), `USER_UPDATED`, `PASSWORD_RECOVERY`, `MFA_CHALLENGE_VERIFIED`. Callbacks may be async and call other auth methods, but events are awaited in order, so keep them quick; events are emitted across tabs. Unsubscribe with `data.subscription.unsubscribe()`. Register it early and keep it bug-free: a broken one is a common cause of server "invalid refresh token" errors.
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
- **Flutter:** a callback such as `io.supabase.flutterquickstart://login-callback` (`[YOUR_SCHEME]://[YOUR_HOSTNAME]`) in Additional Redirect URLs, plus an Android intent filter and iOS `CFBundleURLSchemes`.
- **Redirect URLs for apps:** for example Site URL `com.supabase://login-callback/` and `com.supabase.staging://login-callback/` as an extra.

## Local development

`[auth]` defaults in `supabase/config.toml`:

| Key | Default |
|---|---|
| `site_url` | `"http://127.0.0.1:3000"` |
| `additional_redirect_urls` | `["https://127.0.0.1:3000"]` (exact URLs) |
| `jwt_expiry` | `3600` (maximum 604,800, one week) |
| `signing_keys_path` | commented out; never commit the signing keys file |
| `enable_refresh_token_rotation` | `true` (disabled: refresh tokens never expire) |
| `refresh_token_reuse_interval` | `10` |
| `enable_signup` | `true` |
| `enable_anonymous_sign_ins` | `false` |
| `enable_manual_linking` | `false` |
| `minimum_password_length` | `6` (recommended 8 or more) |
| `password_requirements` | `""` (`letters_digits`, `lower_upper_letters_digits`, `lower_upper_letters_digits_symbols`) |
| `[auth.rate_limit]` | `email_sent = 2` (needs SMTP), `sms_sent = 30`, `anonymous_users = 30`, `token_refresh = 150`, `sign_in_sign_ups = 30`, `token_verifications = 30`, `web3 = 30` |
| `[auth.email]` | `enable_signup = true`, `double_confirm_changes = true`, `enable_confirmations = false`, `secure_password_change = false`, `max_frequency = "1s"`, `otp_length = 6`, `otp_expiry = 3600` |
| `[auth.sms]` | `enable_signup = false`, `enable_confirmations = false`, `template = "Your code is {{ .Code }}"`, `max_frequency = "5s"` |
| `[auth.sessions]` | examples `timebox = "24h"`, `inactivity_timeout = "8h"` (commented) |
| `[auth.mfa]` | `max_enrolled_factors = 10`; TOTP `enroll_enabled`/`verify_enabled` false; phone `otp_length = 6`, `max_frequency = "5s"` |

- **More sections:** `[auth.email.smtp]` (host, port, user, pass, admin_email, sender_name); `[auth.email.template.invite]` (`subject`, `content_path = "./supabase/templates/invite.html"`); `[auth.email.notification.password_changed]`; `[auth.captcha]` (`hcaptcha` or `turnstile`); `[auth.sms.test_otp] 4152127777 = "123456"` for fixed test codes; SMS providers `twilio`, `twilio_verify`, `messagebird`, `textlocal`, `vonage` (for example `auth_token = "env(SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN)"`); `[auth.mfa.web_authn]`; `[auth.third_party.firebase|auth0|aws_cognito|clerk]`; `[auth.oauth_server]`; `[auth.hook.*]`; `[auth.passkey]`, `[auth.webauthn]`; `[auth.web3.*]`.
- **`[auth.external.<provider>]`:** `enabled`, `client_id`, `secret = "env(SUPABASE_AUTH_EXTERNAL_<PROVIDER>_SECRET)"`, `redirect_uri`, `url` (self-hosted GitLab, single-tenant Azure, other OIDC), `skip_nonce_check` (required for local Google sign-in), `email_optional`. Keys: `apple`, `azure`, `bitbucket`, `discord`, `facebook`, `github`, `gitlab`, `google`, `keycloak`, `linkedin_oidc`, `notion`, `twitch`, `twitter`, `x`, `slack`, `spotify`, `workos`, `zoom`.
- **Local differs from hosted:** email confirmations are off locally and on in hosted projects; hook grants that the dashboard applies must be written into your migrations.
- **Self-hosted (since 2026-06-18):** the default `API_EXTERNAL_URL` includes `/auth/v1`; repoint SAML IdPs to `/auth/v1/sso/saml/*`.

## Going to production

- Email confirmations on; OTP expiry 3600 seconds or lower; a longer OTP for more entropy; MFA for high-security apps.
- Custom SMTP from your own domain, link tracking off; remember scanners consume single-use links.
- CAPTCHA on sign-up, sign-in and password reset; rate limits reviewed (custom SMTP starts at 30 per hour).
- Site URL and exact Redirect URLs set for production.
- Asymmetric signing keys and publishable and secret keys, with legacy keys disabled once unused.

## Errors and debugging

- **Identify errors by `error.code` and `error.name`, never by message or HTTP status** (statuses may change). Every `supabase.auth` error wraps `AuthError`; use `isAuthApiError()` rather than `instanceof` for `AuthApiError`, which always has `code` and `status`; `CustomAuthError` is identified by `name`; `AuthWeakPasswordError` carries the reasons for `weak_password`.

| Status | Meaning |
|---|---|
| 403 | feature not available for this user, or a precondition not met |
| 422 | accepted, but the current state can't satisfy it |
| 429 | rate limit: handle it everywhere |
| 500 | Auth degraded; most often your database setup (a misbehaving trigger, function, view or other object), or SMTP |
| 501 | feature not enabled |

Codes that need more than their name:

| Code | Meaning or fix |
|---|---|
| `bad_code_verifier` | PKCE verifier mismatch: a client bug |
| `flow_state_not_found`, `flow_state_expired` | PKCE flow states expire and are cleaned up; retried requests cause it too |
| `conflict` | concurrent requests, often too many simultaneous refreshes: back off exponentially |
| `over_request_rate_limit` | per IP; can mean a bug such as a looping `useEffect` |
| `email_address_invalid` | example and test domains aren't accepted |
| `email_address_not_authorized` | default SMTP sends only to organization members |
| `refresh_token_already_used` | revoked, used outside the reuse interval |
| `refresh_token_not_found`, `session_not_found` | signed out, or the session row deleted |
| `session_expired` | inactivity timeout or time-box |
| `reauthentication_needed` | call `reauthenticate()` before changing the password |
| `mfa_ip_address_mismatch` | enrollment must start and finish on the same IP |
| `mfa_verification_rejected` | the MFA hook returned `reject` |
| `insufficient_aal` | the action needs `aal2` |
| `user_banned` | `banned_until` is active |
| `user_sso_managed` | SSO users can't change fields like email |
| `sso_domain_already_exists` | one SSO domain per IdP |
| `saml_assertion_no_user_id` | NameID missing |
| `unexpected_audience` | deprecated `X-JWT-AUD` |
| `hook_timeout`, `hook_timeout_after_retry`, `hook_payload_over_size_limit`, `hook_payload_invalid_content_type` | see the hook limits table |

Other codes: `anonymous_provider_disabled`, `bad_json`, `bad_jwt`, `bad_oauth_callback` (missing state), `bad_oauth_state`, `captcha_failed`, `email_conflict_identity_not_deletable`, `email_exists`, `email_not_confirmed`, `email_provider_disabled`, `identity_already_exists`, `identity_not_found`, `invalid_credentials`, `invite_not_found`, `manual_linking_disabled`, `mfa_challenge_expired`, `mfa_factor_name_conflict`, `mfa_factor_not_found`, `mfa_phone_enroll_not_enabled`, `mfa_phone_verify_not_enabled`, `mfa_totp_enroll_not_enabled`, `mfa_totp_verify_not_enabled`, `mfa_verification_failed`, `mfa_verified_factor_exists`, `mfa_web_authn_enroll_not_enabled`, `mfa_web_authn_verify_not_enabled`, `no_authorization`, `not_admin`, `oauth_provider_not_supported`, `otp_disabled`, `otp_expired`, `over_email_send_rate_limit`, `over_sms_send_rate_limit`, `phone_exists`, `phone_not_confirmed`, `phone_provider_disabled`, `provider_disabled`, `provider_email_needs_verification`, `reauthentication_not_valid`, `request_timeout`, `same_password`, `saml_assertion_no_email`, `saml_entity_id_mismatch`, `saml_idp_already_exists`, `saml_idp_not_found`, `saml_metadata_fetch_failed`, `saml_provider_disabled`, `saml_relay_state_expired`, `saml_relay_state_not_found`, `signup_disabled`, `single_identity_not_deletable`, `sms_send_failed`, `sso_provider_not_found`, `too_many_enrolled_mfa_factors`, `unexpected_failure`, `user_already_exists`, `user_not_found`, `validation_failed`, `weak_password`.

Symptoms:

- **"Database error saving new user" / "creating new user" / "Error updating user" / "deleting user" (500, `unexpected_failure`):** a failing trigger or trigger function on `auth.users`, a constraint you added there, or Prisma breaking its permissions. Read the Auth logs, then the Postgres logs.
- **`permission denied for table profiles (SQLSTATE 42501)` from a trigger:** the function runs as `supabase_auth_admin`; recreate it `security definer` (owned by `postgres`) and recreate the trigger. Drop with `DROP FUNCTION <function name>() CASCADE;` or `DROP TRIGGER <trigger_name> on auth.<table_name>;`. The SQL Editor's "User Management" template has a working version:

```sql
create function public.handle_new_user()
returns trigger
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;
```

- **`relation "profiles" does not exist (SQLSTATE 42P01)` from `public.handle_new_user()`:** the trigger references a missing table or the wrong schema: create the table, fix the reference, or drop the trigger.
- **`violates foreign key constraint "profiles_id_fkey"` (23503):** your foreign key to `auth.users` blocks the update or delete; recreate it with `ON DELETE CASCADE`, `SET NULL` or `SET DEFAULT`.
- **Broken email templates** (unclosed tags or variables, forbidden characters) cause 500s; `gomail` in the logs means SMTP trouble (domain, port, provider limits, downtime).
- **`503 AuthRetryableFetchError`:** Auth can't load its config, most often an invalid `GOTRUE_SESSIONS_TIMEBOX` duration. Reset Timebox in Sessions settings (that page names `4320` hours as the field's fallback; sessions are still unlimited by default).
- **`otp_expired`, "Token has expired or is invalid", "Email link is invalid or has expired", 403 on `/verify`:** almost always a link scanner. Match API 403s to `otp_expired` in the auth logs by time and IP; send a code or use a landing page with a button. Rarely clock skew.
- **Redirected to localhost or the Site URL:** the exact `redirectTo` isn't on the Redirect URLs list.
- **Random sign-outs in SSR:** a missing `getClaims()` in the proxy, code between `createServerClient` and `getClaims()`, returning a response other than `supabaseResponse`, `proxy.ts` on Next.js 15 or earlier, refreshing in two places, or a `global` `signOut()` revoking the SSR sessions too.
- **Next.js checklist:** latest `@supabase/ssr` (Auth Helpers are being deprecated), every client utility in place, a correct `proxy.ts`; compare with `npx create-next-app -e with-supabase`. For support send `package.json`, `proxy.ts` and a HAR file.

Postgres errors raised for the Auth role (SQL Editor, Logs source):

```sql
select timestamp, event_message,
  log_attributes['parsed.error_severity'] as error_severity,
  log_attributes['parsed.user_name'] as user_name,
  log_attributes['parsed.query'] as query,
  log_attributes['parsed.detail'] as detail,
  log_attributes['parsed.hint'] as hint,
  log_attributes['parsed.sql_state_code'] as sql_state_code
from logs
where source = 'postgres_logs'
  and log_attributes['parsed.error_severity'] in ('ERROR', 'FATAL', 'PANIC')
  and log_attributes['parsed.user_name'] = 'supabase_auth_admin'
order by timestamp desc limit 100;
```

Auth errors: the same `logs` table `where source = 'auth_logs' and (toInt32OrZero(log_attributes['status']) = 500 or log_attributes['level'] in ('error','fatal'))`.

## Dated changes

| Date | Change |
|---|---|
| 2026-06-30 | supabase-js and auth-js drop Node.js 20: use Node 22+ |
| 2026-06-18 | Self-hosted: `API_EXTERNAL_URL` includes `/auth/v1`; repoint SAML IdPs to `/auth/v1/sso/saml/*` |
| 2026-06-03 | New Free plan projects on default SMTP can't customize auth email templates |
| 2026-06-01 | OAuth server token endpoint `/v1/oauth/token` returns 200 instead of 201 (announced 2026-05-01) |
| 2026-05-28 | Passkeys (beta) |
| 2026-05 | Custom OAuth/OIDC providers; `@supabase/server` SDK |
| 2025-11-11 | Security notification email templates |
| 2025-09 | Setting to stop writing audit logs to the project database |
| 2025-08-19 | OAuth 2.1 server (public beta) |
| 2025-07-24 | Data API v13 tightened JWT validation, breaking some custom JWT setups; fix by re-importing the custom signing key |
| 2025-05-01 | New projects get an RSA asymmetric signing key by default |
| 2025-04-21 | SQL restrictions on the `auth`, `storage` and `realtime` schemas (announced 2025-03-18) |
| 2024-09-13 | Asymmetric signing keys, JWKS endpoint, `getClaims()` |
| 2024-06-05 | `@supabase/ssr` v0.4 with the `getAll`/`setAll` cookie API; the old API goes away at v1.0.0 |
| end of 2026 | `anon` and `service_role` keys deprecated |

## Conflicting statements: check the current docs

| Item | One source says | Another says |
|---|---|---|
| Default signing algorithm | SSR guide: asymmetric keys are the default for new projects; changelog: RSA for projects created after 2025-05-01 | OAuth server guide: HS256 by default. The signing-keys guide recommends ES256. Check the project's JWT keys page |
| Email link and OTP expiry | guides: 1 hour | JS reference: 24 hours |
| Phone OTP lifetime | phone login page: expires after 1 hour | same page and passwords page: verify within 60 seconds |
| Server user check | SSR guide: `getClaims()` to protect pages and data | JS reference: `getUser()` for authorization on the server |
| `security definer` on hook functions | hooks guide security model: allowed via dashboard | hooks guide developing section: recommended against; the RBAC `authorize()` helper and profile triggers use it |
| Hook 4xx | Before User Created page: 4xx reaches the client | hooks overview: 400 and 403 become 500 |
| MFA recovery codes | JS reference overview: not supported | same reference: experimental `mfa.recoveryCodes` |
| MFA availability | TOTP docs: free, on for all projects | CLI template: available on Pro; local TOTP flags false |
| API gateway | architecture page: Envoy | search index copy of the page: Kong |
| Where the JWT secret lives | migrating-users page: Settings > API > JWT Secret | API keys guide: Settings > API Keys and Settings > JWT Keys; there is no Settings > API page |

## Prove it

- **Policies as real users:** in a transaction, `set local role authenticated; set local request.jwt.claim.sub = '<uuid>';` after inserting test rows into `auth.users (id, email)`, then `rollback`. As a pgTAP test: `supabase test new todos_rls.test`. Repeat as `anon`, as a second user, as an anonymous user (`is_anonymous` true) and with `aal1` against every MFA-gated table.
- **No authorization on user data:** `grep` policies and functions for `user_metadata` and `raw_user_meta_data`; none decides access.
- **Server checks:** no `getSession()` in server code; every protected route, server function and proxy calls `getClaims()` (or `getUser()` where revocation matters). Forge a session cookie with a fake user and confirm the route rejects it.
- **SSR session survives:** sign in, wait past the JWT expiry, load a server-rendered page: still signed in, and the response carries `Cache-Control: private, no-store` (or the headers `setAll` received). No auth route uses ISR or a cached CDN behavior.
- **Sign-out:** after `signOut({ scope: 'global' })` another device gets `refresh_token_not_found` at its next refresh, and the `auth.sessions` row for that `session_id` is gone.
- **Redirects:** each `redirectTo` you use lands on its own page, not the Site URL; an unknown one falls back to the Site URL.
- **Email:** in production a confirmation, reset and magic link arrive from your custom SMTP and survive the corporate link scanner (or you send codes).
- **Hooks:** `custom_access_token_hook` has execute granted to `supabase_auth_admin` and revoked from `authenticated`, `anon` and `public` (calling it as `authenticated` fails); a decoded access token shows the added claim and all required claims; HTTP hooks reject a request with a bad `webhook-signature`.
- **Keys:** no `sb_secret_` or `eyJ...service_role` value in any bundle or `NEXT_PUBLIC_`/`VITE_`/`PUBLIC_` variable; a browser request with the secret key gets 401; legacy keys show no recent use before you disable them.
- **Logs clean:** the `supabase_auth_admin` Postgres error query and the `auth_logs` 500 query return nothing new after sign-up, sign-in, user update and user delete.
