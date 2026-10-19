# Setup

Resend sends email from your server through one HTTP API (`https://api.resend.com`), the official SDKs that wrap it, or SMTP. The API key lives in a server-side env var and never reaches a browser (the API has no CORS, on purpose, to protect the key); the `from` address uses a domain you verified (see [DOMAINS.md](DOMAINS.md)); and the Node SDK returns `{ data, error }` instead of throwing, so check `error` rather than relying on `try/catch`.

**Contents:** [Install the SDK](#install-the-sdk) · [API keys and permissions](#api-keys-and-permissions) · [The Node SDK contract](#the-node-sdk-contract) · [Email-practices timeout source example](#email-practices-timeout-source-example) · [Timeouts](#timeouts) · [Raw HTTP and pagination](#raw-http-and-pagination) · [Next.js](#nextjs) · [Other JS runtimes](#other-js-runtimes) · [Auth libraries](#auth-libraries) · [SMTP](#smtp) · [Supabase](#supabase) · [The MCP server](#the-mcp-server) · [Docs and skills for agents](#docs-and-skills-for-agents) · [Prove it](#prove-it)

## Install the SDK

- **Always install the latest SDK.** Older SDKs may lack `webhooks.verify()`, `emails.receiving.get()` or `domains.claims.*`. If the project already has a Resend SDK, check its version against the minimum and upgrade when below.
- **Node package `resend`, class `Resend`.** Install with the project's existing package manager: `npm install resend`, `yarn add resend`, `pnpm add resend`, `bun add resend`. Never import from `@resend/node`.
- **Minimum versions:** Node `resend` >= 6.14.0 (also the minimum for domain claims); 6.34.1 or later for Inboxes (latest release v6.34.1, published 2026-10-16; default branch `canary`).
- **Detect the language by file:** `package.json` means Node.js/TypeScript and the `resend` package.
- **Other SDKs:** official Node.js (github.com/resend/resend-node), PHP, Laravel, Python, Ruby, Go, Java, Rust, .NET and a Chat SDK Adapter (`@resend/chat-sdk-adapter`, for the Vercel Chat SDK: inbound via webhooks, replies, threading). Community: NestJS (github.com/jiangtaste/nestjs-resend), Dart (github.com/coderaveHQ/dart_resend), Elixir. OpenAPI spec: github.com/resend/resend-openapi.
- **Prefer an SDK over raw HTTP.** SDKs handle authentication, required headers and error handling. Call the API directly only when no SDK exists, for a one-off request, or when building your own wrapper.
- **No production approval or sandbox step:** every account has production access immediately. A human must create the Resend account; an agent can create a domain via the API, but the DNS records are added by hand.

## API keys and permissions

- **Store the key in `RESEND_API_KEY`, never hardcode it.** `.env`: `RESEND_API_KEY=re_xxxxxxxxx`; add `.env` to `.gitignore`; pass it explicitly with `new Resend(process.env.RESEND_API_KEY)`. Node v20+ can load it with `--env-file=.env` or `dotenv`. Never expose it client side, never commit it.
- **Two permissions.** `full_access` (default) can create, delete, get and update any resource. `sending_access` can only send. `domainId` (only with `sending_access`) scopes a sending key to one domain.
- **A sending key on any other endpoint returns 401 `restricted_api_key`** ("This API key is restricted to only send emails."). Domains, contacts, receiving, inbox reads and React Email template uploads need a Full access key. For Inboxes: a sending key may only reply, forward, create a draft and send a draft; a domain-limited sending key on another domain's inbox gets 403; an agent that reads emails or lists threads needs Full access.
- **Create keys** in the dashboard, via the API, the CLI (`resend api-keys create --name Production`) or the MCP server. Name max 50 characters. The token (`re_...`) is returned only once, at creation (`data.token`).

```typescript
const { data, error } = await resend.apiKeys.create({
  name: 'Production Sending Key',
  permission: 'sending_access',
  domainId: 'd_abc123',
});
```

- **Node methods:** `apiKeys.create(params)` (returns `{ id, object: 'api_key', token }`), `apiKeys.list(params?)` (metadata only: `id`, `name`, `created_at`, `last_used_at`, null if never used), `apiKeys.update(id, params)`, `apiKeys.remove(id)`. There is no get endpoint.
- **Changing permission or domain:** the API updates only `name`. The vendor skill says recreate the key to change `permission` or `domainId`; the docs say those are editable only in the Dashboard. Confirm in the current docs.
- **Domain restriction field name:** the Node SDK uses camelCase (`domainId`), but the multi-tenant guide's code passes `domain_id`. Confirm in the current docs.
- **Give each service its own key** and prefer Sending access: a leaked sending key can't read your contacts.
- **Rotate at least every 90 days;** keys never expire on their own. Consider deleting keys unused for 30+ days (the dashboard flags them). Rotation: create a new key with the same permission and domain scope, deploy it, confirm traffic in Logs filtered by key, then delete the old one (both work at the same time).
- **Leaked key:** delete it first (deletion revokes immediately; there is no separate revoke). Then find the leak (git history, CI logs, client bundles, screenshots, a public `.env`) and review Logs (endpoint, method, status, timestamp, User-Agent, full request and response bodies) and Emails. 30 days of activity are kept. Resend does not keep source IPs, ASN, ISP, geo, HELO/EHLO or TLS metadata.
- **Scheduled emails fail** if their API key is no longer active (deleted, expired, suspended) when they are due.

## The Node SDK contract

- **Response shape:** success `{ data: { id: string }, error: null }`; failure `{ data: null, error: { message: string, name: string } }`. Non-2xx responses return `{ data: null, error, headers }`; responses include `headers`.
- **Check `error`, don't `try/catch`.** Use `try/catch` only for network-level failures. Non-JSON error bodies come back as `name: 'application_error'`. Outside `NODE_ENV=production` the SDK logs errors with `console.error('[Resend API Error]:', ...)`.
- **The constructor:** `new Resend(key?, options?)`. Without a key it reads `process.env.RESEND_API_KEY` and throws `Missing API key. Pass it to the constructor \`new Resend("re_123")\`` when that is unset. Options: `baseUrl`, `userAgent`. It sets `Authorization: Bearer`, `User-Agent` and `Content-Type: application/json`.
- **camelCase params in Node** (`replyTo`, `scheduledAt`, `topicId`, `contentType`, `contentId`); the REST API uses snake_case.
- **Deletes are `.remove()`, never `.delete()`,** for every resource.
- **Request options are the last argument of every method:** `{ signal, headers }`, for example `AbortSignal.timeout(5000)` or `headers: { 'X-Trace-Id': traceId }`. An aborted request returns a network-failure error with a `null` status code: check `error?.statusCode === null && signal.aborted`, don't match on the message. With an optional middle argument, pass `undefined`: `resend.broadcasts.send(broadcastId, undefined, { signal })`. A chained `.publish({ signal })` takes its own options.
- **`idempotencyKey` belongs in the request options (second argument),** sent as the `Idempotency-Key` header. See [SENDING.md](SENDING.md#idempotency-keys).
- **No retry logic was found in the SDK source** (a code search for "retry" in `src/` found only a test fixture); that is not proof of absence. The vendor skill's retry helpers are in [LIMITS-AND-ERRORS.md](LIMITS-AND-ERRORS.md#retries).
- **`resend.audiences` is deprecated;** use `segments` (see [CONTACTS-AND-BROADCASTS.md](CONTACTS-AND-BROADCASTS.md)).
- **Clients on the instance:** `segments`, `apiKeys`, `automations`, `batch`, `broadcasts`, `contactProperties`, `contacts`, `domains`, `emails`, `events`, `inboxes`, `logs`, `oauthGrants`, `suppressions`, `templates`, `topics`, `usage`, `webhooks`.
- **`react` is Node only.** When `payload.react` is set, the SDK renders it to `html` (`await render(payload.react)`) before posting. Templates as code: [react-email SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/react-email/SKILL.md).
- **Function call or JSX for `react`:** the docs' agent prompt says pass the component as a function call (`react: WelcomeEmail({ name: 'John' })`), not as JSX; the Hono and Cloudflare Workers quickstarts and the SDK README use JSX (`react: <EmailTemplate firstName="John" />`). In files without JSX transpilation the README uses `import { jsx } from 'react/jsx-runtime'` and `react: jsx(EmailTemplate, { firstName: "John", product: "MyApp" })`.

The vendor skill's quick send (Node):

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const { data, error } = await resend.emails.send(
  {
    from: 'Acme <onboarding@resend.dev>',
    to: ['delivered@resend.dev'],
    subject: 'Hello World',
    html: '<p>Email body here</p>',
  },
  { idempotencyKey: `welcome-email/${userId}` }
);

if (error) {
  console.error('Failed:', error.message);
  return;
}
console.log('Sent:', data.id);
```

## Email-practices timeout source example

[resend/email-best-practices] The source below is preserved verbatim; `new AbortSignal.timeout(...)` differs from the non-constructor `AbortSignal.timeout(...)` form in [The Node SDK contract](#the-node-sdk-contract). Use that canonical request-options contract when adapting this example.

### Timeouts

- **Set timeouts to avoid hanging requests.** The source's snippet, verbatim:

```typescript
const signal = new AbortSignal.timeout(10000);

await resend.emails.send(emailData, { signal });
```

- **Recommended:** 10 to 30 seconds for email API calls.

## Raw HTTP and pagination

- **Base URL `https://api.resend.com`,** HTTPS only. Auth header `Authorization: Bearer re_xxxxxxxxx`.
- **Every request needs a `User-Agent` header.** Without one the request is rejected with 403 (error code `1010`) before it reaches the API. SDKs and the CLI set it; for raw HTTP set e.g. `User-Agent: my-app/1.0`.
- **No API versioning yet;** calendar-based version headers are planned.

```bash
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer re_xxxxxxxxx' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "Acme <onboarding@resend.dev>",
    "to": ["delivered@resend.dev"],
    "subject": "hello world",
    "html": "<p>it works!</p>"
  }'
```

- **Cursor pagination:** responses are `{ object: "list", has_more, data }`; params `limit` (default 20, min 1, max 100), `after` (ID of the last item, next page), `before` (ID of the first item, previous page). The cursor item itself is excluded. `after` and `before` can't be combined.
- **Older list endpoints return everything without `limit`:** List Domains, API Keys, Broadcasts, Segments, Contacts, Received Emails, Received Email Attachments. Newer ones always paginate: List Emails, Templates, Topics, Inboxes, Threads, Search Threads, Thread Emails, Drafts.
- **Pagination errors** are `validation_error`: invalid cursor, `limit` outside 1 to 100, or both `before` and `after` (`{"name":"validation_error","statusCode":422,"message":"The pagination limit must be a number between 1 and 100. ..."}`).

```ts
const { data: firstPage } = await resend.contacts.list({ limit: 50 });
if (firstPage.has_more) {
  const lastId = firstPage.data[firstPage.data.length - 1].id;
  const { data: secondPage } = await resend.contacts.list({ limit: 50, after: lastId });
}
```

## Next.js

- **Route handler (App Router)** at `app/api/send/route.ts`, template at `components/email-template.tsx`. Pages Router: `pages/api/send.ts`, returning `res.status(400).json(error)` on error and `res.status(200).json(data)` otherwise.

```ts
import { EmailTemplate } from '../../../components/email-template';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST() {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: ['delivered@resend.dev'],
      subject: 'Hello world',
      react: EmailTemplate({ firstName: 'John' }),
    });

    if (error) {
      return Response.json({ error }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
```

- **Server actions** are not on the Next.js quickstart page. The official examples repo (github.com/resend/resend-examples, targeting Next.js 16, shared client at `@/lib/resend`) sends a contact form's two emails in one batch from a server action (excerpt, `react` takes React Email components):

```typescript
"use server";

import { resend } from "@/lib/resend";

export async function submitContactForm(formData: FormData) {
  const { data, error } = await resend.batch.send([
    // Email to user
    {
      from: "Acme <onboarding@resend.dev>",
      to: [formData.get("email")],
      subject: "We received your message",
      react: ConfirmationEmail({ ... }),
    },
    // Email to team
    {
      from: "Acme <onboarding@resend.dev>",
      to: ["onboarding@resend.dev"],
      subject: "New contact form submission",
      react: NotificationEmail({ ... }),
    },
  ]);

  return { success: !error };
}
```

- **Examples repo env vars:** `RESEND_API_KEY`, optional `RESEND_WEBHOOK_SECRET`, `EMAIL_FROM`, `CONTACT_EMAIL`, `RESEND_AUDIENCE_ID`. Its index covers basic send, attachments, CID images, templates, React Email, scheduling, a contact form (batch), inbound webhooks with verification, audiences, domains, better-auth, preventing threading and double opt-in.
- **Vercel Functions:** `.env.local` with `RESEND_API_KEY`; `app/api/send/route.ts` returns `Response.json(response, { status: response.error ? 500 : 200 })`; add `RESEND_API_KEY` in the Vercel project settings; deploy with `vercel`.

## Other JS runtimes

| Runtime | Setup |
|---|---|
| Node.js | `.env` `RESEND_API_KEY=re_xxxxxxxxx`; `new Resend(process.env.RESEND_API_KEY)`; `if (error) return console.error({ error });` |
| TanStack Start | Recommended: a server function, `createServerFn({ method: 'POST' }).handler(async () => {...})` from `@tanstack/react-start`, in `src/utils/send-email.ts`, with `if (error) { throw error; }`. Alternative: a server route `createFileRoute('/api/send')({ server: { handlers: { POST: async () => {...} } } })` in `src/routes/api/send.ts`. Template at `src/components/email-template.tsx` |
| Express | `app.get("/", async (req, res) => { const { data, error } = await resend.emails.send({...}); if (error) return res.status(400).json({ error }); res.status(200).json({ data }); })` |
| Hono | tsconfig `"jsx": "react-jsx", "jsxImportSource": "react"`; template `emails/email-template.tsx`; `index.tsx` with `react: <EmailTemplate firstName="John" />`; `return c.json(error, 400)` |
| Bun | `bun install resend`; `Bun.serve({ port: 3000, async fetch() { const data = await resend.emails.send({... react: EmailTemplate({ firstName: 'Vitor' }) }); return new Response(JSON.stringify(data)); } })`; run `bun index.tsx` |
| Cloudflare Workers | Rename the worker's main file to `.tsx`; `export default { async fetch(request, env, context): Promise<Response> { ... return Response.json(data); } } satisfies ExportedHandler<Env, ExecutionContext>;`; deploy with `wrangler deploy`. The quickstart constructs `new Resend('re_xxxxxxxxx')` inline; the docs' agent prompt says never hardcode keys |
| Deno Deploy | `import { Resend } from 'npm:resend';` inside `Deno.serve`, status `response.error ? 500 : 200` |
| AWS Lambda | Node.js 20.x or later runtime; raw `fetch('https://api.resend.com/emails', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer ${RESEND_API_KEY}\` }, body: JSON.stringify({...}) })` in `index.mjs` |

## Auth libraries

- **Better Auth hooks:** `sendResetPassword({ user, url })`, `sendVerificationEmail({ user, url })` (under `emailVerification`), the magic link plugin `magicLink({ sendMagicLink: ({ email, url }) => ... })` from `better-auth/plugins`, and email OTP `emailOTP({ sendVerificationOTP: ({ email, otp, type }) => ... })` (`type === 'sign-in'`).
- **Don't await the send in auth hooks.** The examples call `void resend.emails.send(...)`, as Better Auth recommends, so response time doesn't reveal whether an account exists. On serverless, wrap it in `waitUntil` so the function doesn't end before the send. Debug with Better Auth logs and https://resend.com/logs.

```typescript
export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    sendResetPassword: ({ user, url }) => {
      void resend.emails.send({
        from: 'Acme <onboarding@example.com>',
        to: user.email,
        subject: 'Reset your password',
        html: `Click <a href="${url}">here</a> to reset your password.`,
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: ({ user, url }) => {
      void resend.emails.send({
        from: 'Acme <onboarding@example.com>',
        to: user.email,
        subject: 'Verify your email address',
        html: `Click <a href="${url}">here</a> to verify your email.`,
      });
    },
  },
});
```

- **NextAuth over SMTP:** `.env` `EMAIL_SERVER_USER=resend`, `EMAIL_SERVER_PASSWORD=YOUR_API_KEY`, `EMAIL_SERVER_HOST=smtp.resend.com`, `EMAIL_SERVER_PORT=465`, `EMAIL_FROM=onboarding@resend.dev`; `EmailProvider({ server: { host, port, auth: { user, pass } }, from })` from `next-auth/providers/email`.

## SMTP

- **Credentials:** host `smtp.resend.com`; username `resend`; password = your API key.
- **Ports:** implicit TLS (SMTPS) on `465` and `2465`; STARTTLS on `25`, `587` and `2587`.
- **Idempotency over SMTP** uses the email header `Resend-Idempotency-Key`. Custom headers work if your client supports them.
- **SMTP limits:** the rate limit is the same as the API; SMTP emails can't be scheduled; no SMTP server logs are provided (SMTP emails do show in the emails table).
- **Nodemailer:** `nodemailer.createTransport({ host: 'smtp.resend.com', secure: true, port: 465, auth: { user: 'resend', pass: 're_xxxxxxxxx' } })`, then `transporter.sendMail({ from, to, subject, html })`.

## Supabase

- **Edge Function:** `supabase functions new resend`; in `index.ts`, read the key with `Deno.env.get('RESEND_API_KEY')`, call `fetch('https://api.resend.com/emails', ...)` and serve with `Deno.serve(handler)`. Local: `supabase functions start` and `supabase functions serve resend --no-verify-jwt`. Deploy: `supabase functions deploy resend`. Example repo: github.com/resend/resend-supabase-edge-functions-example.
- **Two Edge Function patterns exist:** the quickstart uses `Deno.serve` with `Deno.env.get`; an older knowledge-base page uses `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";` with a hardcoded key and `serve(handler)`. Confirm in the current docs.
- **Supabase Auth emails, three options:**
  1. **Resend Integration** (simplest, less customizable templates): https://resend.com/settings/integrations > Connect to Supabase > select project, domain, Add API Key, sender name, Configure SMTP Integration.
  2. **Custom auth functions via Supabase Auth Hooks,** with React Email or Resend Templates (repo github.com/resend/supabase-auth-hooks-with-resend-templates).
  3. **Custom SMTP** (also for self-hosted Supabase): Supabase > Authentication > Email (Notifications) > SMTP Settings; host `smtp.resend.com`, port `465`, username `resend`, password the API key. Sender email and name are required (e.g. `support@example.com`, `ACME Support`).
- **Supabase needs a custom email provider for more than 2 emails per hour.** With Resend the default becomes 25 emails per hour, adjustable in Supabase auth settings.
- **Domain:** use a subdomain you own (not shared or public), like `updates.example.com`; verification usually takes 5 to 10 minutes.
- **Deliverability for Supabase Auth:**
  1. **Set up a Supabase custom domain** so links (`https://auth.example.com/auth/v1/{code}` instead of `https://<ref>.supabase.co/auth/v1/{code}`) match the `from` domain.
  2. **Send from a dedicated subdomain** like `auth.example.com` (or one transactional subdomain such as `notifications.example.com`).
  3. **Disable link and open tracking:** tracking can hurt deliverability, and Supabase notes link tracking corrupts verification links.
  4. **Expect link scanners that `GET` every link.** Supabase Auth links are single use: link to a page on your domain with a "Sign-in" button that redirects to the magic link.
  5. **Set up DMARC** (see [DOMAINS.md](DOMAINS.md#dmarc)).

## The MCP server

- **Remote (hosted):** `https://mcp.resend.com/mcp` (Streamable HTTP), OAuth browser login on connect. For headless or CI use, pass an API key: `claude mcp add --transport http resend https://mcp.resend.com/mcp --header "Authorization: Bearer re_xxxxxxxxx"`, or in JSON `"headers": { "Authorization": "Bearer re_xxxxxxxxx" }`.
- **Client installs:**

| Client | Install |
|---|---|
| Claude | Connector directory (installs the MCP server and every Resend skill), or Settings > Connectors > Add custom connector |
| Claude Code | `claude plugin install resend@claude-plugins-official`, then `/mcp` > resend for OAuth |
| Cursor | `/add-plugin resend`, or `{"mcpServers":{"resend":{"url":"https://mcp.resend.com/mcp"}}}` |
| VS Code Copilot | `settings.json` `{"mcp":{"servers":{"resend":{"type":"http","url":"https://mcp.resend.com/mcp"}}}}`, plus `npx skills add resend/resend-skills` |
| Codex | `codex mcp add resend --url https://mcp.resend.com/mcp` |
| Gemini CLI | `~/.gemini/settings.json` with `"httpUrl"` |
| Antigravity | `~/.gemini/config/mcp_config.json` with `"serverUrl"` |
| OpenCode | `opencode.json` with `type: "remote"` |
| Zed | `context_servers` |

  Also listed: Warp, Devin, fx, OpenClaw, Hermes, Grok Bot.
- **The Resend plugin** (github.com/resend/resend-skills) follows the Agent Plugins spec: `plugin.json`, `skills/`, and `mcp.json` pointing at the remote server.
- **Local server:** npm package `resend-mcp` (github.com/resend/resend-mcp), the same code as the hosted one.
  - Stdio (default): `{"command":"npx","args":["-y","resend-mcp"],"env":{"RESEND_API_KEY":"re_xxxxxxxxx"}}`; Claude Code: `claude mcp add resend -e RESEND_API_KEY=re_xxxxxxxxx -- npx -y resend-mcp`.
  - HTTP: `npx -y resend-mcp --http --port 3000` (listens on `http://127.0.0.1:3000`, endpoint `/mcp`, clients pass a Bearer key) or `MCP_PORT=3000 npx -y resend-mcp --http`.
- **Options:** `--key` (stdio only), `--sender` (default from address on a verified domain), `--reply-to` (repeatable), `--http`, `--port` (default 3000). Env: `RESEND_API_KEY` (required for stdio), `SENDER_EMAIL_ADDRESS`, `REPLY_TO_EMAIL_ADDRESSES` (comma-separated), `MCP_PORT`. Without a sender the server asks for one on every tool call.
- **Tool areas:** Emails (send, list, get, cancel, update, batch; attachments from local files, URLs or base64; scheduling; tags; topic-based sending), Received Emails (list, read, attachments), Inboxes (beta, remote server only), Templates (including publish, duplicate, `{{{VARIABLE}}}`), Contacts (segments, topics, CSV imports, properties), Broadcasts, Automations, Events, Domains (tracking, TLS, capabilities, claims), Segments, Topics, Contact Properties, API Keys (create, list, remove), Webhooks, Logs (full request and response bodies), Editor (connects to the dashboard visual editor).
- **The CLI** is in [CLI.md](CLI.md).

## Docs and skills for agents

- **Any docs page as markdown:** append `.md` to its URL. Full docs: `https://resend.com/docs/llms-full.txt`. Docs MCP server: `npx add-mcp https://resend.com/docs/mcp`.
- **Vendor skills:** `npx skills add resend/resend-skills` (the Resend skill and the Agent Email Inbox skill, see [AGENT-INBOX.md](AGENT-INBOX.md)), `npx skills add resend/react-email`, `npx skills add resend/email-best-practices`, `npx skills add resend/resend-cli`.

## Prove it

- **The key never ships to a browser:** a search of the client bundle for `re_` finds nothing, and every Resend call runs in a route handler, server action, server function or worker.
- **The SDK is current:** `resend` in `package.json` is at least 6.14.0 (6.34.1 if you use Inboxes).
- **Errors are handled:** every `emails.send` and `batch.send` call checks `error`; none relies only on `try/catch`.
- **A test send succeeds:** sending to `delivered@resend.dev` returns `data.id` and the email shows in the dashboard's Emails list.
- **A sending key is scoped:** calling `resend.domains.list()` with the production sending key returns 401 `restricted_api_key`.
- **Raw HTTP works:** the cURL call above with a `User-Agent` returns `{ "id": ... }`; without one it returns 403 (`1010`).
- **SMTP works:** Nodemailer on port 465 with user `resend` sends, and the email shows in the emails table.
- **Supabase Auth:** a sign-up email arrives from your subdomain, its link points at your custom auth domain, and tracking is off on that domain.
- **MCP:** the client lists the Resend tools, and a send to `delivered@resend.dev` through the MCP server shows in the dashboard.
