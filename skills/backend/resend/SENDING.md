# Sending

Resend sends transactional email (receipts, confirmations, notifications) through `POST /emails` for one email and `POST /emails/batch` for up to 100 distinct emails in one request. Batch can't carry attachments and fails as a whole if one email is invalid; the sources ask for an idempotency key on every send so a retry doesn't send twice, and for testing with Resend's `@resend.dev` test addresses. Marketing to large lists with unsubscribe links belongs in Broadcasts ([CONTACTS-AND-BROADCASTS.md](CONTACTS-AND-BROADCASTS.md)); hosted templates are in [TEMPLATES.md](TEMPLATES.md), templates as code in [react-email SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/react-email/SKILL.md), and deliverability practice in [email-practices SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/SKILL.md).

**Contents:** [Single or batch](#single-or-batch) · [Send one email](#send-one-email) · [Send a batch](#send-a-batch) · [Idempotency keys](#idempotency-keys) · [Attachments and inline images](#attachments-and-inline-images) · [Scheduling](#scheduling) · [Tags and custom headers](#tags-and-custom-headers) · [Test addresses](#test-addresses) · [Email statuses](#email-statuses) · [Manage sent emails](#manage-sent-emails) · [Metrics](#metrics) · [Suppressions](#suppressions) · [Anti-patterns](#anti-patterns) · [Email-practices idempotency source example](#email-practices-idempotency-source-example) · [Prove it](#prove-it)

## Single or batch

| Choose | When |
|---|---|
| Single (`POST /emails`, `resend.emails.send`) | One email, attachments, scheduling, or different timing per recipient |
| Batch (`POST /emails/batch`, `resend.batch.send`) | 2 to 100 distinct emails, no attachments, and you want fewer API calls (each batch request counts as one request against the rate limit) |

- **Prefer the SDK over cURL** for both endpoints.
- **Implement idempotency keys, error handling and retries** ([LIMITS-AND-ERRORS.md](LIMITS-AND-ERRORS.md)).
- **SMTP** is in [SETUP.md](SETUP.md#smtp).

## Send one email

- **Required:** `from` (`Name <email@domain.com>`, on a verified domain), `to` (string or string[], max 50), `subject`, and at least one of `html`, `text` or `react`.
- **Optional:** `cc`, `bcc`, `replyTo` (REST `reply_to`, string or string[]), `scheduledAt` (`scheduled_at`), `headers` (object), `topicId` (`topic_id`), `attachments`, `tags`, `template`.
- **`text`:** if omitted, plain text is generated from the HTML; opt out with an empty string `""`. Sending both `html` and `text` helps accessibility and deliverability.
- **`react`** (a React node) is available only in the Node SDK, which renders it to HTML before sending.
- **`template`:** `{ id, variables }` sends a published hosted template; it can't be combined with `html`, `text` or `react`. Details in [TEMPLATES.md](TEMPLATES.md).
- **Set `replyTo`** when the sending address can't receive replies.
- **The vendor skill's required practices:** valid SPF, DKIM and DMARC; links that match the sending domain (from `@acme.com`, link to `https://acme.com`); both `html` and `text`; a real address (e.g. `support@`), not "no-reply"; a body under 102 KB (Gmail clips larger messages). Recommended: a subdomain per stream and tracking off for transactional email ([DOMAINS.md](DOMAINS.md)).
- **Response:** `{ "id": "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794" }` (Node: `data.id`).

```ts
import { Resend } from 'resend';

const resend = new Resend('re_xxxxxxxxx');

const { data, error } = await resend.emails.send({
  from: 'Acme <onboarding@resend.dev>',
  to: ['delivered@resend.dev'],
  subject: 'hello world',
  html: '<p>it works!</p>',
});
```

- **The docs example passes the key inline;** in real code read it from `RESEND_API_KEY` ([SETUP.md](SETUP.md#api-keys-and-permissions)).
- **CLI:** `resend emails send --from "Acme <onboarding@resend.dev>" --to delivered@resend.dev --subject "hello world" --html "<p>it works!</p>"` ([CLI.md](CLI.md)).
- **`topicId` on a transactional send,** checked separately for each `to`, `cc` and `bcc` address: a contact opted in is sent; a contact opted out is not sent; a non-contact is sent only if the topic's default subscription is opt-in. The docs say the skipped email is marked failed; the vendor skill says it is "silently skipped". Confirm in the current docs. Topics are in [CONTACTS-AND-BROADCASTS.md](CONTACTS-AND-BROADCASTS.md).

## Send a batch

- **Up to 100 emails per call,** each with the same fields as a single send and up to 50 recipients each.
- **No attachments** on the batch endpoint.
- **Atomic validation:** if any email in the payload is invalid, the whole request fails (no partial success). Pre-validate required fields (`from`, `to`, `subject`, `html` or `text`), address formats, batch size 1 to 100 and recipients 1 to 50 per email.
- **Response order:** `data[]` entries match the payload by 0-based index.
- **Batch emails appear in the dashboard,** initially `queued`.
- **Scheduling in a batch, sources disagree:** the Schedule Email guide says each email in a batch can be scheduled independently and the Send Batch reference lists `scheduled_at`; the vendor skill and the docs' AI onboarding prompt say batch has no scheduling. Confirm in the current docs before relying on it.
- **CLI:** `resend emails batch --file ./path/to/emails.json`.

Batch validation (Node):

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface BatchEmail {
  from: string;
  to: string[];
  subject: string;
  html?: string;
  text?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: { index: number; field: string; message: string }[];
}

function validateBatch(emails: BatchEmail[]): ValidationResult {
  const errors: ValidationResult['errors'] = [];

  if (emails.length === 0) {
    return { valid: false, errors: [{ index: -1, field: 'batch', message: 'Batch cannot be empty' }] };
  }

  if (emails.length > 100) {
    return { valid: false, errors: [{ index: -1, field: 'batch', message: 'Batch cannot exceed 100 emails' }] };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  emails.forEach((email, index) => {
    if (!email.from) {
      errors.push({ index, field: 'from', message: 'From address is required' });
    }

    if (!email.to || email.to.length === 0) {
      errors.push({ index, field: 'to', message: 'At least one recipient is required' });
    } else if (email.to.length > 50) {
      errors.push({ index, field: 'to', message: 'Cannot exceed 50 recipients per email' });
    } else {
      email.to.forEach((recipient, rIndex) => {
        if (!emailRegex.test(recipient)) {
          errors.push({ index, field: `to[${rIndex}]`, message: `Invalid email: ${recipient}` });
        }
      });
    }

    if (!email.subject) {
      errors.push({ index, field: 'subject', message: 'Subject is required' });
    }

    if (!email.html && !email.text) {
      errors.push({ index, field: 'content', message: 'Either html or text content is required' });
    }
  });

  return { valid: errors.length === 0, errors };
}

// Usage
const emails = [
  { from: 'Acme <noreply@acme.com>', to: ['delivered@resend.dev'], subject: 'Hello', html: '<p>Hi</p>' },
];

const validation = validateBatch(emails);
if (!validation.valid) {
  console.error('Validation failed:', validation.errors);
  return;
}

const { data, error } = await resend.batch.send(emails);
```

- **More than 100 emails:** split into chunks of 100, give each chunk its own idempotency key `<batch-prefix>/chunk-<index>`, send the chunks in parallel and track results per chunk, since chunks can fail independently.

```typescript
import { Resend } from 'resend';
import { randomUUID } from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

const BATCH_SIZE = 100;

interface Email {
  from: string;
  to: string[];
  subject: string;
  html: string;
}

async function sendLargeBatch(emails: Email[], batchPrefix: string) {
  const chunks: Email[][] = [];

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    chunks.push(emails.slice(i, i + BATCH_SIZE));
  }

  const results = await Promise.all(
    chunks.map(async (chunk, index) => {
      const idempotencyKey = `${batchPrefix}/chunk-${index}`;

      const { data, error } = await resend.batch.send(chunk, { idempotencyKey });

      return {
        chunkIndex: index,
        success: !error,
        data,
        error: error?.message,
      };
    })
  );

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  return {
    totalChunks: chunks.length,
    successful: successful.length,
    failed: failed.length,
    results,
  };
}

// Usage: Send 250 emails
const emails = generateEmails(250); // Your email generation logic
const result = await sendLargeBatch(emails, `campaign-${randomUUID()}`);

console.log(`Sent ${result.successful}/${result.totalChunks} chunks successfully`);
```

- **Each batch request counts as one request** against the rate limit (10 requests per second per team in the docs, 2 in the vendor skill; see [LIMITS-AND-ERRORS.md](LIMITS-AND-ERRORS.md#rate-limits)).
- **For marketing campaigns use Broadcasts,** not batch.

## Idempotency keys

The Node SDK’s supported convenience option is `{ idempotencyKey }` in the second argument, as shown below; [the official idempotency guide](https://resend.com/docs/dashboard/emails/idempotency-keys) confirms 24-hour retention.

- **Supported on:** Send Email, Send Batch, and the Inbox operations Send Draft, Reply to Thread Email and Forward Thread Email ([AGENT-INBOX.md](AGENT-INBOX.md)). Template sends use the same endpoint, so pass a key there too.
- **How it works:** Resend checks whether a request with the same key was sent in the last 24 hours. Same key and same payload returns the original response without sending again. Same key and a different payload returns 409 `invalid_idempotent_request`. Same key while the first request is still running returns 409 `concurrent_idempotent_requests` (safe to retry later).
- **Key rules:** 1 to 256 characters (otherwise 400 `invalid_idempotency_key`), unique per request, expires after 24 hours. Use a UUID or a string that identifies the email.
- **In Node, pass it in the request options (second argument):** `idempotencyKey`, sent as the `Idempotency-Key` header. The SDK source, the idempotency page and the AI onboarding prompt agree; the prompt on the docs' framework quickstarts shows it as a payload field, while the SDK source defines it as a request option. Raw HTTP: header `Idempotency-Key`. SMTP: email header `Resend-Idempotency-Key`. CLI: `--idempotency-key`.

```ts
await resend.emails.send(
  {
    from: 'Acme <onboarding@resend.dev>',
    to: ['delivered@resend.dev'],
    subject: 'hello world',
    html: '<p>it works!</p>',
  },
  {
    idempotencyKey: 'welcome-user/123456789',
  },
);
```

Batch: `await resend.batch.send([...], { idempotencyKey: 'team-quota/123456789' });`

| Email | Key format | Example |
|---|---|---|
| Welcome | `welcome-email/<user-id>` | `welcome-email/user-123` |
| Order confirmation | `order-confirmation/<order-id>` | `order-confirmation/12345` |
| Password reset | `password-reset/<user-id>/<timestamp>` | `password-reset/user-123/1705123456` |
| Batch | `batch-<event-type>/<batch-id>` | `batch-orders/batch-456` (the idempotency page's own batch example is `team-quota/123456789`) |
| Large batch chunk | `<batch-prefix>/chunk-<index>` | `campaign-abc/chunk-0` |

- **Inbox replays** return the first successful (2xx) response with header `idempotent-replayed: true`. A failed first request is not stored, so retry with the same key.

## Attachments and inline images

- **Two ways to attach:** a remote `path` (URL, better for larger files) with `filename`, or local `content` (Base64 string or Buffer) with `filename`. `contentType` (REST `content_type`) is derived from the filename when unset. A missing `content` and `path` returns 422 `invalid_attachment`.
- **Size:** at most 40 MB per email, including attachments, after Base64 encoding.
- **Batch can't carry attachments;** use single sends.
- **Local file in Node:** `const attachment = fs.readFileSync(filepath).toString('base64');` then `attachments: [{ content: attachment, filename: 'invoice.pdf' }]`. CLI: `--attachment ./static/invoice.pdf`.
- **Inline images (CID):** put `<img src="cid:logo-image">` in the HTML and attach with `contentId: 'logo-image'` (REST `content_id`). The ID is arbitrary and must be under 128 characters; remote and local files both work. Base64 is needed only for raw content. Inline images add to the email size, may be rejected by some clients (especially webmail), should carry a `contentType` (e.g. `image/png`) or a `filename`, and don't show in the dashboard's HTML preview.
- **Blocked extensions for sending** (any type can be received): .adp .app .asp .bas .bat .cer .chm .cmd .com .cpl .crt .csh .der .exe .fxp .gadget .hlp .hta .inf .ins .isp .its .js .jse .ksh .lib .lnk .mad .maf .mag .mam .maq .mar .mas .mat .mau .mav .maw .mda .mdb .mde .mdt .mdw .mdz .msc .msh .msh1 .msh2 .mshxml .msh1xml .msh2xml .msi .msp .mst .ops .pcd .pif .plg .prf .prg .reg .scf .scr .sct .shb .shs .sys .ps1 .ps1xml .ps2 .ps2xml .psc1 .psc2 .tmp .url .vb .vbe .vbs .vps .vsmacros .vss .vst .vsw .vxd .ws .wsc .wsf .wsh .xnk.
- **Read a sent email's attachments:** `resend.emails.attachments.list({ emailId })` and `resend.emails.attachments.get({ emailId, id })` (CLI `resend emails attachments <id>`). Fields: `id`, `filename`, `size` (bytes), `content_type`, `content_disposition` (`"inline"` or `"attachment"`), `content_id`, `download_url` (signed, `https://outbound-cdn.resend.com/...`), `expires_at`. The URL expires: call again for a fresh one. Download with `const response = await fetch(attachment.download_url); const buffer = await response.arrayBuffer();`.

## Scheduling

- **Up to 30 days in advance.** `scheduledAt` (REST `scheduled_at`, CLI `--scheduled-at`) takes natural language (`"in 1 min"`, `"in 1 hour"`, `"tomorrow at 9am"`, `"Friday at 3pm ET"`) or ISO 8601 (`2026-08-05T11:52:01.858Z`). Node ISO example: `const oneMinuteFromNow = new Date(Date.now() + 1000 * 60).toISOString();` then `scheduledAt: oneMinuteFromNow`.
- **Scheduling inside a batch is disputed** (see [Send a batch](#send-a-batch)).
- **SMTP emails can't be scheduled.**
- **Reschedule:** `resend.emails.update({ id, scheduledAt })` (REST `PATCH /emails/:id`, CLI `resend emails update <id> --scheduled-at "in 1 min"`). Only `scheduled_at` can change; content is fixed after creation, so cancel and send again to change it. The Update Email reference says `scheduled_at` takes ISO 8601 only; the schedule guide shows natural language (`'in 1 min'`) on update. Confirm in the current docs.

```typescript
const { data, error } = await resend.emails.update({
  id: 'email_abc123',
  scheduledAt: '2026-04-01T09:00:00Z',
});
if (error) console.error(error);
```

- **Cancel:** `resend.emails.cancel(id)` (REST `POST /emails/:id/cancel`, CLI `resend emails cancel <id>`). Works only while the status is `scheduled`; cancel before `scheduled_at`, as there is a brief processing window before the send. A canceled email can't be rescheduled.
- **Scheduled sends fail** if the API key is no longer active (deleted, expired, suspended) or the account is under review.
- **Good uses:** a welcome email 5 minutes after signup, a reminder 24 hours before an event, a weekly digest the next day at 9am PST. Password resets and magic links go out immediately.

## Tags and custom headers

- **Tags** are key/value pairs included in webhook events after sending (customer ID, plan label like `free` or `enterprise`, category like `welcome` or `password reset`).
- **Tag rules:** `name` and `value` both required; ASCII letters, numbers, underscores and dashes only; max 256 characters each; up to 75 tags per email.

```typescript
tags: [{ name: 'user_id', value: 'usr_123' }, { name: 'email_type', value: 'welcome' }]
```

- **CLI:** `--tags "category=confirm_email"`.
- **Multi-tenant routing:** tag each send with the tenant (`tags: [{ name: 'tenant_id', value: 'tenant_abc123' }]`) and route webhooks by it ([DOMAINS.md](DOMAINS.md#multi-tenant-setups)).
- **Custom headers:** `headers: { 'X-Entity-Ref-ID': 'xxx_xxxx' }` prevents threading in Gmail; a `List-Unsubscribe` header adds an unsubscribe shortcut. CLI `--headers "X-Entity-Ref-ID=xxx_xxxx"`.

## Test addresses

| Address | Result |
|---|---|
| `delivered@resend.dev` | Delivered |
| `bounced@resend.dev` | Hard bounce (SMTP `550 5.1.1` "Unknown User") |
| `complained@resend.dev` | Marked as spam |
| `suppressed@resend.dev` | Suppressed (reason shows previously bounced) |

- **Labels after `+` work** (`delivered+signup@resend.dev`, `bounced+signup@resend.dev`), except on `suppressed@resend.dev`, which does not support labeling yet.
- **Never test with fake addresses at real providers** (`test@gmail.com`, `fake@outlook.com`): they bounce and damage sender reputation. Resend blocks `@example.com` and `@test.com` style addresses with `422 Unprocessable Entity`. Avoid fake SMTP servers. Your own real address is fine.
- **Test emails count against your sending quota.**
- **`onboarding@resend.dev` is a test-only `from`.** Without a verified domain it delivers only to your own Resend account email (403 `validation_error` otherwise). Never use it in production.
- **End-to-end tests (Playwright):** point a test route at `delivered@resend.dev` (real API calls count toward quota), or mock the send route: `page.route('*/**/api/send', route => route.fulfill({ body, contentType: 'application/json', status: 200 }))`.

## Email statuses

- **Events on an email:** `bounced`, `canceled`, `clicked`, `complained`, `delivered`, `delivery_delayed`, `failed`, `opened`, `queued` (Broadcasts or batches), `scheduled`, `sent`, `suppressed`.
- **`delivery_delayed`:** Resend retries automatically for up to 14 hours, then marks the email `bounced`.
- **"Delivered"** means the recipient's server accepted it with `250 OK`; filtering after that is invisible to Resend. Fixes for delivered-but-not-received are in [DOMAINS.md](DOMAINS.md#deliverability-checks) and [email-practices SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/SKILL.md).
- **Bounce types and webhook events** are in [WEBHOOKS.md](WEBHOOKS.md#bounce-types).

## Manage sent emails

- **Retrieve:** `resend.emails.get(id)` (CLI `resend emails get <id>`) returns `{ object: "email", id, message_id, to, from, created_at, subject, html, text, bcc, cc, reply_to, last_event, scheduled_at, tags }`.
- **List sent emails:** `resend.emails.list()` always paginates (`limit` default 20, max 100). It lists only sent emails; inbound mail is in [RECEIVING.md](RECEIVING.md). The vendor skill shows `resend.emails.list({ limit, offset })`; the docs use cursor pagination ([SETUP.md](SETUP.md#raw-http-and-pagination)).
- **Share a public link:** `resend.emails.share(id, { expiresIn: '2 hours' })` returns a `url` for a sent or received email. `expiresIn` is human-readable, defaults to `48h` and can't exceed 48 hours (longer returns a validation error). The link is public and unauthenticated, and there is no revoke endpoint.
- **CSV exports** (Emails, Broadcasts, Contacts, Segments, Domains, Logs, API keys) are admin-only: up to 1,000 items download immediately, larger exports are emailed and stay available 7 days.
- **Retention:** email content and metadata are kept 30 days on every plan ([LIMITS-AND-ERRORS.md](LIMITS-AND-ERRORS.md#plan-limits-and-retention)). Store what you need from webhooks ([WEBHOOKS.md](WEBHOOKS.md#store-the-events)).

## Metrics

- **`resend.emails.metrics(options)`** (`GET /emails/metrics`). With no options: the last 7 days, all metrics, totals only.
- **Options:** `startDate` (ISO 8601; default 6 days before `endDate`), `endDate` (default now), `timezone` (IANA, default UTC), `granularity` (`hourly`, `daily`, `weekly`, `monthly`; default `daily`; applies when `period` is a dimension; max 10,000 periods), `metrics` (default all), `dimensions` (`period`, `domain`, `email`, `broadcast`), `domainId`, `emailId`, `broadcastId` (up to 100 each; REST list params accept comma-separated or repeated values).
- **`email` and `broadcast` are mutually exclusive** as dimensions and as filters; requesting both is rejected.
- **Response:** `totals` keyed by metric name, and `data` rows (absent when there are no dimensions). Responses are cached up to 15 minutes. A `startDate` older than the plan's retention is clamped (not when `broadcastId` is set).
- **Metric names:** `received`, `sent`, `delivered`, `delivery_delayed`, `failed`, `suppressed`, `bounced`, `bounced_transient`, `bounced_permanent`, `bounced_undetermined`, `opened`, `unique_opened`, `clicked`, `unique_clicked`, `complained`, `unsubscribed`, `delivery_rate` (delivered/sent), `open_rate` (unique_opened/delivered), `click_rate` (unique_clicked/delivered), `bounce_rate` (bounced/sent), `complaint_rate` (complained/delivered), `unsubscribe_rate` (unsubscribed/delivered).
- **Opens and clicks are counted only with tracking enabled on the sending domain** ([DOMAINS.md](DOMAINS.md#open-and-click-tracking)).

```typescript
const { data, error } = await resend.emails.metrics({
  startDate: '2026-07-01',
  endDate: '2026-07-08',
  dimensions: ['period', 'broadcast'],
  broadcastId: ['bc_abc123'],
});
if (error) console.error(error);

for (const row of data.data ?? []) {
  console.log(row.period, row.broadcast_name, row.delivered);
}
```

## Suppressions

- **Resend suppresses automatically** after a hard bounce or a spam complaint. A send to a suppressed address is not attempted and fires `email.suppressed` instead (which does not count toward your bounce rate).
- **Origins:** `bounce` (permanent rejection), `complaint`, `manual`. Suppressions apply to the whole team, across all domains and subdomains, for transactional and Broadcast email.
- **Suppression does not unsubscribe the contact.** Use webhooks to unsubscribe proactively ([WEBHOOKS.md](WEBHOOKS.md)).
- **Not every provider reports complaints,** most notably Gmail and Google Workspace.
- **Object:** `{ object: "suppression", id, email, origin, source_id (the email that triggered it; null for manual), created_at }`.
- **Node:** `resend.suppressions.add({ email })`, `.get(idOrEmail)`, `.list()` (filter `origin`: `bounce`, `complaint`, `manual`), `.remove(idOrEmail)`, `.batch.add({ emails })` (1 to 100), `.batch.remove({ ids } | { emails })` (1 to 100, not both). CLI: `resend suppressions list --origin bounce`, `add`, `get`, `delete --yes`, `batch add --file ./emails.json`, `batch remove --file ... [--ids]`. Dashboard: Suppressions (CSV import and export).
- **Removing a suppression doesn't guarantee delivery.** If the cause isn't fixed, the address is suppressed again and your reputation takes the hit. Webhooks: `suppression.added`, `suppression.removed`.

## Anti-patterns

- **Retrying without an idempotency key.**
- **Wrapping sends in `try/catch` instead of checking `error`.**
- **Batch with attachments.**
- **`html` (or `text`, `react`) together with `template`.**
- **Testing with fake addresses** instead of `delivered@resend.dev`.
- **Calling the API from the browser:** there is no CORS, by design, to protect the key. Send from the server.
- **Sending from `onboarding@resend.dev` in production,** or from a `from` domain that doesn't exactly match a verified domain (403).

## Email-practices idempotency source example

[resend/email-best-practices] The source uses the generic request-header form below. The Node convenience option and key scope are owned by [Idempotency keys](#idempotency-keys).

```typescript
// Generate deterministic key based on the business event
const idempotencyKey = `password-reset-${userId}-${resetRequestId}`;

await resend.emails.send({
  from: 'noreply@example.com',
  to: user.email,
  subject: 'Reset your password',
  html: emailHtml,
}, {
  headers: {
    'Idempotency-Key': idempotencyKey
  }
});
```

  (The `from` here is the source's; [email-practices EMAIL-TYPES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/EMAIL-TYPES.md#designing-transactional-emails) says to avoid `noreply@` on transactional mail.)

## Prove it

- **Idempotency works:** send twice with the same key and payload; the second call returns the same `id` and the dashboard shows one email. Send again with the same key and a changed payload; it returns 409 `invalid_idempotent_request`.
- **Batch validation holds:** a batch with one email missing `subject` is rejected whole, and nothing is sent.
- **Index mapping:** for a valid batch, `data[i].id` belongs to payload item `i` (check with `resend.emails.get`).
- **Test addresses behave:** `delivered@resend.dev` shows `delivered`, `bounced@resend.dev` shows `bounced`, `complained@resend.dev` shows `complained`, and `suppressed@resend.dev` fires `email.suppressed`.
- **Attachments arrive:** a single send with a PDF lists it in `resend.emails.attachments.list({ emailId })`, and a CID image renders inline in a real client.
- **Scheduling:** a send with `scheduledAt` shows `scheduled`; `resend.emails.cancel(id)` moves it to `canceled`; rescheduling it afterwards fails.
- **Tags round-trip:** a webhook event for a tagged send carries the same tags.
- **Metrics:** `resend.emails.metrics()` returns totals that include your test sends.
