# Authentication and authorization

**Prefer an identity provider** (Supabase Auth, Auth0, Clerk, Keycloak, Entra ID) to hand-built login, token issuing, password storage and MFA: password policies, rotation, revocation, MFA and breach handling come maintained. Everything below is what you still configure, check or build around it.

## Tokens (JWT)

A JWT is a signed, readable claim set: anyone can decode the payload, and the signature only proves who issued it. Verify everything, every request:

```ts
import { jwtVerify, createRemoteJWKSet } from "jose";

const JWKS = createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks.json`));   // asymmetric keys from the issuer

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: ISSUER,                    // who signed it
    audience: "orders-api",            // that it was meant for this API, not another service of the same issuer
    algorithms: ["RS256", "ES256"],    // pinned: never accept "none" or an algorithm the token chooses
    clockTolerance: 5,                 // seconds; keep it small, sync server clocks instead
  });
  return payload;                      // exp and nbf are checked by jwtVerify
}
```

- **Short access tokens** (5 to 30 minutes) plus a **refresh token** for longer sessions. A JWT can't be revoked before it expires without extra state, so its lifetime is the revocation delay.
- **Symmetric signing (HS256)** shares one secret between issuer and verifiers; use a random key of at least 256 bits from a secret store. Asymmetric keys (RS256, ES256) let many services verify without being able to issue.
- **Nothing secret in claims:** no passwords, API keys or personal data you wouldn't print.
- **Browser storage:** a token in `localStorage` is readable by any injected script. Prefer `HttpOnly`, `Secure`, `SameSite` cookies, which then need CSRF protection for state-changing requests; native apps use the platform's secure storage.
- **Same answer for unknown user and wrong password** (the [CATALOG.md](CATALOG.md) section on enumeration).
- **Read the claim names you configured.** Some frameworks rename standard claims (`sub` arrives under a long legacy name); a lookup by the wrong name returns nothing, and code that then falls back to a default is a hole.

### Refresh tokens

- Random (32+ bytes from `crypto.randomBytes`), stored **hashed** server-side with the user, an expiry (days to weeks), and a session or family ID.
- **Rotate on every use:** the refresh endpoint revokes the presented token and issues a new pair, atomically (a conditional update on `revoked_at is null`, so two concurrent refreshes can't both succeed).
- **Detect reuse:** a revoked token presented again means someone replayed it; revoke the whole family and force a new login.
- **Revoke all of a user's tokens** on password change, MFA reset or "sign out everywhere".

**An auth check that fires while the session is still loading** signs people out: right after a page load, a client can report "not authenticated" until its token arrives, and a save in that window redirected to login. On an unauthorized response, ask the server whether a session exists; redirect only when it doesn't, otherwise fail the action and let the user retry.

## API keys (server-to-server)

For machine callers, not browsers. A key identifies a calling application; it isn't a user session.

- **Generate random keys with a recognizable prefix** (`sk_live_` plus 32 random bytes in base62), show the full key once, and store only a hash (SHA-256 is enough for high-entropy random keys) plus the first characters for display.
- **Look up by hash, compare in constant time** (`crypto.timingSafeEqual`) if you compare secrets directly.
- **Send in a header** (`Authorization: Bearer ...` or `X-API-Key`), never in the URL, which ends up in logs and browser history; keep keys out of your own logs.
- **Scope and expire them:** each key carries the permissions and tenant it may act for, a creation date, last-used date and optional expiry; support several active keys per client so rotation needs no downtime; revocation takes effect immediately.
- **Rate-limit per key** (the `api-design` skill's RELIABILITY.md).

## Permissions, not role names

Roles group permissions; code checks permissions. `requirePermission("orders:refund")` keeps working when a new role gets that permission; `if (user.role === "admin")` scattered through handlers has to be found and edited.

```ts
export const Permission = { OrdersRead: "orders:read", OrdersRefund: "orders:refund", UsersDelete: "users:delete" } as const;
export type Permission = (typeof Permission)[keyof typeof Permission];

export function requirePermission(...anyOf: Permission[]) {           // OR semantics; write an allOf variant when needed
  return (req: AuthedRequest, res: Response, next: NextFunction) =>
    anyOf.some((p) => req.auth.permissions.has(p)) ? next() : res.status(403).json({ code: "forbidden" });
}

app.post("/orders/:id/refund", requirePermission(Permission.OrdersRefund), refundOrder);
```

- **Resolve permissions server-side** from the user's roles (cached briefly) rather than packing every permission into the token: tokens stay small, and a permission change applies within the cache lifetime instead of at the next login.
- **A permission isn't ownership.** "Can refund orders" doesn't mean "can refund this tenant's order": also check that the resource belongs to the caller's tenant or user, in the query itself (see [TENANCY.md](TENANCY.md)).
- **Default deny:** a route without an explicit policy should fail a test, not be public by accident.
- **Supabase:** [supabase AUTH-USERS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/supabase/AUTH-USERS.md#authorization-data-in-rls) owns provider role/permission tables, trusted claims and access-token hooks.
- **Builder access to the deploy platform comes from the company directory** once non-engineers deploy agents: company-managed accounts through single sign-on rather than personal ones, access added and removed by directory sync from the identity provider's assignments, and internal tools private by default (Rillet on Vercel, in Vercel's write-up).

## Next.js Server Actions

[Vercel, react-best-practices] Server Actions (functions marked `"use server"`, stable since Next.js 14, https://nextjs.org/blog/next-14) "are exposed as public endpoints, just like API routes. Always verify authentication and authorization **inside** each Server Action - do not rely solely on middleware, layout guards, or page-level checks, as Server Actions can be invoked directly." The rule quotes Next.js as "Treat Server Actions with the same security considerations as public-facing API endpoints"; the current docs say it this way: "you should still treat Server Actions as reachable via direct POST requests and verify authentication and authorization inside each one", and "A page-level authentication check does not extend to the Server Actions defined within it. Always re-verify inside the action" (https://nextjs.org/docs/app/guides/data-security).

Validate, then authenticate, then authorize, then mutate [Vercel, react-best-practices]:

```typescript
'use server'

import { verifySession } from '@/lib/auth'
import { z } from 'zod'

const updateProfileSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email()
})

export async function updateProfile(data: unknown) {
  // Validate input first
  const validated = updateProfileSchema.parse(data)

  // Then authenticate
  const session = await verifySession()
  if (!session) {
    throw new Error('Unauthorized')
  }

  // Then authorize
  if (session.user.id !== validated.userId) {
    throw new Error('Can only update own profile')
  }

  // Finally perform the mutation
  await db.user.update({
    where: { id: validated.userId },
    data: {
      name: validated.name,
      email: validated.email
    }
  })

  return { success: true }
}
```

From the Next.js data-security guide (https://nextjs.org/docs/app/guides/data-security):

- **Action IDs are not a lock.** Next.js creates encrypted, non-deterministic action IDs during compilation, cached for at most 14 days and regenerated on a new build, and removes unused actions from the client bundle. This "reduces the risk in cases where an authentication layer is missing"; it does not replace the check.
- **Origin check:** Next.js compares the `Origin` header to the `Host` (or `X-Forwarded-Host`) and aborts on a mismatch. Behind a proxy on another domain, list it in `experimental.serverActions.allowedOrigins` in `next.config.js` (`allowedOrigins: ['my-proxy.com']`).
- **No mutations during render:** "Mutations (e.g. logging out users, updating databases, invalidating caches) should never be a side-effect, either in Server or Client Components."

## Passwords

- **Hash with a slow, salted algorithm** built for passwords: Argon2id (preferred) or bcrypt, through a maintained library; never a plain or fast hash.
- **Store the algorithm and its parameters with the hash** (the standard encoded formats start with `$argon2id$` or `$2b$`), so you can tell which scheme produced each row.
- **Upgrading the algorithm is a data migration** you can't run in bulk, because hashes are one-way. Migrate on login:

```ts
async function verifyAndUpgrade(user: User, password: string): Promise<boolean> {
  if (isArgon2(user.passwordHash)) return argon2.verify(user.passwordHash, password);
  if (!(await legacyVerify(user.passwordHash, password))) return false;
  const upgraded = await argon2.hash(password);
  await db.query(`update users set password_hash = $1 where id = $2 and password_hash = $3`,   // don't overwrite a newer hash
    [upgraded, user.id, user.passwordHash]);
  return true;
}
```

New passwords use the new scheme; reads accept both; the stored prefix lets you count (and later list) the users still on the legacy scheme; the upgrade can sit behind a flag if login writes become a load problem; after most active users have migrated, force a reset for the rest and delete the legacy path. The same expand-and-contract shape works for any format change.

Convex identity, optional application users rows, Convex Auth setup and document/parent membership are owned by [convex AUTH.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/convex/AUTH.md). [get-convex/agent-skills, convex-auth, convex-authz]

## Two-factor authentication (TOTP)

The server and an authenticator app share a random secret; both derive a 6-digit code from it and the current 30-second time step, so checking needs no network call. Supabase's enrollment/challenge/verification APIs and restrictive assurance policy are in [supabase AUTH-USERS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/supabase/AUTH-USERS.md#mfa). Building it yourself means getting each of these right:

- **Enrollment:** generate the secret (20 random bytes, Base32 for the `otpauth://totp/Issuer:account?secret=...&issuer=...` URI shown as a QR code), store it as **pending**, and activate 2FA only after the user submits a valid first code. Activating first locks out anyone who never finished scanning. Show the Base32 secret as text beside the QR code for manual entry, and delete pending secrets from abandoned setups after a short time. Every 2FA endpoint requires an authenticated user.
- **Login is two steps:** a correct password with 2FA enabled returns a short-lived (2 to 3 minutes), limited-scope token that can only call the verification endpoint. The full session is issued only after the code checks out; issuing it after the password makes the second factor decorative.
- **Allow one step of clock drift** on each side, and **reject reuse:** store the last accepted time step and refuse codes from it or earlier. Acceptance and recording consumption must be atomic under concurrent requests: RFC 6238 prohibits accepting the same OTP a second time after successful validation. The source's separate read, check and update does not establish that guarantee. https://www.rfc-editor.org/rfc/rfc6238.html#section-5.2
- **Rate-limit verification hard:** a 6-digit code has a million values. Lock or slow down after a few failures per account and log the pattern.
- **Encrypt the secret at rest** ([SECRETS-AND-NETWORK.md](SECRETS-AND-NETWORK.md)); anyone who reads it can generate valid codes.
- **Recovery codes:** 8 to 10 random codes shown once, stored hashed like passwords, each usable once, regenerable. Consume a code atomically so concurrent requests cannot both redeem it; the source's separate read and delete does not establish one-time use. [milan-jovanovic, security-and-multitenancy/how-to-implement-two-factor-authentication-in-aspnetcore.md] https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html
- **Bind step-up to the operation.** Check assurance for factor replacement/disable, recovery, account linking and alternate API paths, not just the normal login screen. Bind the challenge to the initiating user/session and intended action, with one-time use and expiry; a weaker recovery or replacement path must not silently remove the protection. [cloudflare/security-audit-skill, security-audit/WEB-PROTOCOL-AND-AUTH.md; https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html]
- **Prefer an authenticator app or passkeys over SMS,** which SIM swapping defeats.

## Prove it

- Submit the same TOTP concurrently: only one request succeeds. Repeat with one recovery code. A limited pre-MFA token cannot enroll, replace or disable a factor. [milan-jovanovic, security-and-multitenancy/how-to-implement-two-factor-authentication-in-aspnetcore.md] https://www.rfc-editor.org/rfc/rfc6238.html#section-5.2 and https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html
