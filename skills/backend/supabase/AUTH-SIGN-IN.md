# Auth: sign-in methods, flows and email

How users get a session: each sign-in method, the PKCE and implicit flows, redirect URLs, linking identities, auth email and abuse protection. Sessions and tokens are AUTH-SESSIONS.md; MFA, hooks and users are AUTH-USERS.md.

**Contents:** [PKCE and implicit flows](#pkce-and-implicit-flows) · [Redirect URLs](#redirect-urls) · [Sign-in methods](#sign-in-methods) · [Identity linking](#identity-linking) · [Email](#email) · [Abuse protection](#abuse-protection) · [Dated changes](#dated-changes) · [Conflicting statements: check the current docs](#conflicting-statements-check-the-current-docs) · [Prove it](#prove-it)

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

## Dated changes

| Date | Change |
|---|---|
| 2026-06-18 | Self-hosted: `API_EXTERNAL_URL` includes `/auth/v1`; repoint SAML IdPs to `/auth/v1/sso/saml/*` |
| 2026-06-03 | New Free plan projects on default SMTP can't customize auth email templates |
| 2026-06-01 | OAuth server token endpoint `/v1/oauth/token` returns 200 instead of 201 (announced 2026-05-01) |
| 2026-05-28 | Passkeys (beta) |
| 2026-05 | Custom OAuth/OIDC providers; `@supabase/server` SDK |
| 2025-11-11 | Security notification email templates |
| 2025-08-19 | OAuth 2.1 server (public beta) |

## Conflicting statements: check the current docs

| Item | One source says | Another says |
|---|---|---|
| Email link and OTP expiry | guides: 1 hour | JS reference: 24 hours |
| Phone OTP lifetime | phone login page: expires after 1 hour | same page and passwords page: verify within 60 seconds |

## Prove it

- **Redirects:** each `redirectTo` you use lands on its own page, not the Site URL; an unknown one falls back to the Site URL.
- **Email:** in production a confirmation, reset and magic link arrive from your custom SMTP and survive the corporate link scanner (or you send codes).
