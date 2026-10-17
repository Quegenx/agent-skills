# Auth: custom, enterprise and other providers

The sign-in providers beyond email, phone, anonymous and social login: custom OAuth and OIDC providers, enterprise SSO with SAML 2.0, Web3 wallets, passkeys, third-party auth that lets Supabase trust another provider's JWTs, and Supabase as an OAuth 2.1 provider. Moved unchanged from [AUTH-SIGN-IN.md](AUTH-SIGN-IN.md), which holds the flows, redirect URLs, the other sign-in methods, identity linking, auth email, abuse protection and the dated changes.

## Custom OAuth and OIDC providers

- **Identifier** `custom:` followed by 2 to 50 characters (lowercase alphanumerics, hyphens, colons). Types `oauth2` (manual authorization, token and userinfo URLs) and `oidc` (issuer discovery from `{issuer}/.well-known/openid-configuration` or `discovery_url`; `openid` scope always added; ID tokens verified against the provider JWKS; `skip_nonce_check` defaults to false). Free plan: up to 3. Copy the read-only Callback URL into the IdP.
- **Manage with the admin API:** `supabase.auth.admin.customProviders.createProvider({...})` (validates OIDC discovery), `listProviders({ type })`, `updateProvider(id, {...})` (partial; can't change `provider_type` or `identifier`; rotate by updating `client_secret`), `deleteProvider(id)`. Sign in with `signInWithOAuth({ provider: 'custom:my-provider' })` or `GET /auth/v1/authorize?provider=custom:my-provider`.
- **Options:** PKCE on by default (`pkce_enabled: true`; disable only if the IdP lacks it); extra `authorization_params` (strings), except the reserved `client_id`, `client_secret`, `redirect_uri`, `response_type`, `state`, `code_challenge`, `code_challenge_method`, `code_verifier`, `nonce`; `acceptable_client_ids` for multi-platform audiences; `email_optional: true` for providers without email.
- **Errors:** `validation_failed` 400, `conflict` 400 (identifier exists), `over_custom_provider_quota` 400, `custom_provider_not_found` 404.

## Enterprise SSO (SAML 2.0)

- **Any SAML 2.0 IdP** (Google Workspace, Okta, Auth0, Microsoft Entra, PingIdentity, OneLogin). Off by default; Pro plan and above. Managed with `supabase sso` (CLI v1.46.4+); only project writers can manage IdPs.
- **Service provider values:** EntityID and metadata `https://<project>.supabase.co/auth/v1/sso/saml/metadata` (`?download=true` for a file), ACS `https://<project>.supabase.co/auth/v1/sso/saml/acs`. An SLO URL is advertised but single logout isn't supported: rely on time-box and inactivity timeouts. NameID must be `emailAddress` or `persistent`. `supabase sso info --project-ref <ref>`.
- **Add an IdP:** `supabase sso add --type saml --project-ref <ref> --metadata-url '<url>' --domains company.com` (or `--metadata-file`). Prefer metadata URLs (Okta, Entra, Ping support them; Google Workspace and on-premises need the XML). Also `supabase sso list`, `show <id> -o json`, `update <id>`.
- **`supabase sso remove <id>` logs all its users out immediately, and those accounts can never be accessed again,** even if the IdP is added back. The EntityID can't change (a new EntityID is a new IdP). The SAML private key can't be extracted.
- **Sign in** SP-initiated with `signInWithSSO({ domain: 'company.com' })` or `({ providerId })`, then `window.location.href = data.url`. IdP-initiated sign-in doesn't work with PKCE (no verifier): instead link the IdP to a "bookmark app" endpoint such as `/auth/saml-init` that calls `signInWithSSO`. For several subdomains pass `options: { redirectTo }` and exchange the code on a `/callback`.
- **Attributes:** without a mapping only the email is extracted; users without an email are rejected. Map more with `--attribute-mapping-file` (`{ "keys": { "email": { "name": "mail" }, "first_name": { "name": "givenName" } } }`; options `array: true`, `default`, `names: [...]`). Mapped attributes land in the JWT, `auth.identities.identity_data` (provider `sso:<uuid>`, id = NameID) and `auth.users.raw_user_meta_data`. Email lookup order: `urn:oid:0.9.2342.19200300.100.1.3`, `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress`, `http://schemas.xmlsoap.org/claims/EmailAddress`, `mail`, `email`, then NameID with format `urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress`.
- **SSO users are never identity-linked:** a password user and an SSO user with the same email are two accounts. Emails aren't unique, so reference users by UUID. The IdP may limit sessions, and SSO users can't update fields like email (`user_sso_managed`).
- **RLS on SSO:** `auth.jwt()#>>'{amr,0,method}'` (`sso/saml`), `auth.jwt()#>>'{amr,0,provider}'` (IdP UUID), `auth.jwt()#>>'{user_metadata,iss}'` (IdP EntityID); with MFA, `amr[0]` may be another method. Per-tenant: store `organization_settings.sso_provider_id` and add a restrictive policy `sso_provider_id = (select auth.jwt()#>>'{amr,0,provider}')`.

## Web3 (Ethereum, Solana)

- **Any Ethereum or Solana wallet,** using EIP-4361 messages. Auth checks the structure, the signature, a timestamp within 10 minutes of the call, and that the URI and domain are on the Redirect URLs list (register the sign-in page, for example `https://example.com/sign-in/`, where the last slash matters, or `https://example.com/**`). The wallet address is the identity.
- **Calls:** `signInWithWeb3({ chain: 'ethereum', statement })` (EIP-1193 `window.ethereum`), with `wallet: selectedWallet` (EIP-6963), or `{ chain: 'ethereum', message, signature }`. Solana: `{ chain: 'solana', statement }` with `window.solana` (most wallets require the statement), or `wallet: window.braveSolana`, `window.phantom` or a Wallet Adapter `useWallet()` object. Add email, phone or social later with `updateUser()` or `linkIdentity()`.
- **Abuse:** sign-ins need no email or phone and are free to automate, so keep the rate limit (30 per 5 minutes per IP) and add CAPTCHA.

```toml
[auth.web3.solana]
enabled = true
[auth.web3.ethereum]
enabled = true
```

## Passkeys (experimental)

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

## Third-party auth (Clerk, Firebase, Auth0, Cognito, WorkOS, custom OIDC)

- **The Data API, Storage, Realtime and Functions can trust another provider's JWTs,** alongside or instead of Supabase Auth (which can't be disabled). Pass the token with `createClient(url, key, { accessToken: async () => getAccessTokenFromYourProvider() })`, returning `null` when signed out.
- **The provider must sign asymmetrically with a `kid` header via an OIDC discovery URL** (no HS256; Auth0 tenants on HS256 or PS256 aren't supported). Signing keys are stored in project config and checked periodically: allow up to 30 minutes after the provider rotates keys.
- **The JWT needs a `role` claim** (`authenticated` for signed-in users), or requests run as `anon`. Cognito: a Pre-Token Generation Trigger. Auth0: an Action calling `api.idToken.setCustomClaim('role', 'authenticated')`, and pass the ID token (Auth0 strips non-namespaced claims from access tokens, so `api.accessToken.setCustomClaim` doesn't work). Firebase: a custom user claim through the admin SDK or blocking functions. Clerk: customize session tokens.
- **Custom OIDC:** the issuer must be HTTPS with `<issuer>/.well-known/openid-configuration`; add it under Authentication > Sign In / Providers > Third-Party Auth or the Management API (`oidc_issuer_url`); it isn't available in the CLI or `config.toml`. Clerk locally: `[auth.third_party.clerk] enabled = true domain = "example.clerk.accounts.dev"`.
- **`auth.uid()` casts `sub` to uuid and fails on non-UUID subjects:** use `(select auth.jwt()->>'sub')` against a `text` column. With several issuers (or Supabase Auth as well) `sub` values can collide: add a restrictive policy checking `iss`.
- **Firebase uses one key set for every Firebase project.** Hosted projects reject unregistered Firebase project IDs before the database; self-hosted projects must add a restrictive policy checking `iss = 'https://securetoken.google.com/<firebase-project-id>'` and `aud = '<firebase-project-id>'` (a helper such as `is_supabase_or_firebase_project_jwt()`).

## Supabase as an OAuth 2.1 provider (beta)

- **Auth can act as an OAuth 2.1 and OIDC provider** ("Sign in with [Your App]", MCP agent auth, first-party apps): authorization code flow with mandatory PKCE, ID tokens (`openid` scope), UserInfo, discovery, scopes `openid`, `email`, `profile`, `phone`, dynamic client registration for MCP. OAuth users count as MAU.
- **Enable** in Authentication > OAuth Server or `[auth.oauth_server] enabled = true authorization_url_path = "/oauth/consent" allow_dynamic_registration = false`. You build the consent UI with `supabase.auth.oauth.getAuthorizationDetails(authorization_id)` (`scope` is a space-separated string). Manage clients with `admin.oauth.*` (create, delete, get, list, regenerateClientSecret, update).
- **ID tokens need asymmetric signing keys;** generation fails with HS256.
- **OAuth access tokens are ordinary Supabase JWTs plus a `client_id` claim.** Scopes control OIDC data, not database access: restrict clients in RLS, for example `(auth.jwt() ->> 'client_id') = 'mobile-app-client-id'`, or `IS NULL` for direct user sessions only. Custom Access Token hooks run for every issuance; tell them apart by `client_id` or `authentication_method = 'oauth_provider/authorization_code'`.
- **Since 2026-06-01 the token endpoint `/v1/oauth/token` returns 200 instead of 201.**
