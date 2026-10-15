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
- **Supabase:** keep roles and permissions in tables and check them in RLS policies or in a custom access token hook that adds them as claims. Authorization data goes in `app_metadata` (only the server can write it), never `user_metadata`, which the user can edit.

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

## Two-factor authentication (TOTP)

The server and an authenticator app share a random secret; both derive a 6-digit code from it and the current 30-second time step, so checking needs no network call. With Supabase, `supabase.auth.mfa.enroll` / `challenge` / `verify` do this, and a restrictive RLS policy requiring `(select auth.jwt()->>'aal') = 'aal2'` enforces it in the database. Building it yourself means getting each of these right:

- **Enrollment:** generate the secret (20 random bytes, Base32 for the `otpauth://totp/Issuer:account?secret=...&issuer=...` URI shown as a QR code), store it as **pending**, and activate 2FA only after the user submits a valid first code. Activating first locks out anyone who never finished scanning. Show the Base32 secret as text beside the QR code for manual entry, and delete pending secrets from abandoned setups after a short time. Every 2FA endpoint requires an authenticated user.
- **Login is two steps:** a correct password with 2FA enabled returns a short-lived (2 to 3 minutes), limited-scope token that can only call the verification endpoint. The full session is issued only after the code checks out; issuing it after the password makes the second factor decorative.
- **Allow one step of clock drift** on each side, and **reject reuse:** store the last accepted time step and refuse codes from it or earlier.
- **Rate-limit verification hard:** a 6-digit code has a million values. Lock or slow down after a few failures per account and log the pattern.
- **Encrypt the secret at rest** ([SECRETS-AND-NETWORK.md](SECRETS-AND-NETWORK.md)); anyone who reads it can generate valid codes.
- **Recovery codes:** 8 to 10 random codes shown once, stored hashed like passwords, each usable once, regenerable.
- **Prefer an authenticator app or passkeys over SMS,** which SIM swapping defeats.
