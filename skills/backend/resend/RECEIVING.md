# Receiving

Resend receives incoming email for a domain and announces each message with an `email.received` webhook. The webhook carries metadata only (sender, recipients, subject, attachment metadata), never the body or attachment content: you fetch those with separate API calls, so large emails and attachments work inside serverless request-size limits. On a custom domain, Resend's MX record must have the lowest priority value, or emails won't route to Resend. For a mailbox with threads, folders, labels and drafts on top of this, see [INBOXES.md](INBOXES.md); for an AI agent reading the mail, [AGENT-INBOX.md](AGENT-INBOX.md).

**Contents:** [The flow](#the-flow) · [Receiving address and domain](#receiving-address-and-domain) · [The webhook](#the-webhook) · [Reading the email](#reading-the-email) · [Attachments](#attachments) · [Listing received emails](#listing-received-emails) · [Routing by recipient](#routing-by-recipient) · [Forwarding](#forwarding) · [Replying in the thread](#replying-in-the-thread) · [Storage, replay and quota](#storage-replay-and-quota) · [Common mistakes](#common-mistakes) · [Prove it](#prove-it)

## The flow

1. **Configure a receiving domain:** the Resend-managed `.resend.app` address, or an MX record on your own domain.
2. **Subscribe a webhook to `email.received`** (Dashboard > Webhooks > Add Webhook, or the Webhook API; see [WEBHOOKS.md](WEBHOOKS.md)).
3. **Fetch the body with the Receiving API** and files with the Attachments API.

- **SDK minimum:** `webhooks.verify()` and `emails.receiving.get()` need Node.js `resend` 6.9.2 or later (agent-inbox skill). The general Resend skill lists higher minimums because it also covers newer features; if both apply, use the higher version.
- **API key:** the forwarding guide requires a Full access key; a sending-only key gets `401 restricted_api_key` on other endpoints.

## Receiving address and domain

- **Resend-managed:** `<anything>@<your-id>.resend.app`, no DNS. Find it in Dashboard > Emails > Receiving tab > three dots > "Receiving address". Any username works (`test@<id>.resend.app`).
- **Custom domain:** add an MX record with the value from the Domains page. Every address at the receiving domain is received.

| Field | Value |
|---|---|
| Type | MX |
| Host | Your domain or subdomain |
| Value | Provided in the Resend dashboard (example: `inbound-smtp.us-east-1.amazonaws.com`) |
| Priority | 10; it must be the lowest number on that host |

```
# Example: receive at support.acme.com without affecting acme.com
support.acme.com.  MX  10  <resend-mx-value>
```

- **Use a subdomain when the domain already has MX records** (Google Workspace, Microsoft 365): `support.acme.com` to Resend, `acme.com` stays with the existing provider. When receiving is enabled, Resend receives all mail for that host per MX priority, so MX on the root routes ALL root mail to Resend and breaks existing email. Same-priority MX records are chosen at random per attempt.
- **Existing sending domain:** toggle receiving, add the MX, click "I've added the record" (only the MX is verified).
- **Receive-only domain:** turn off "Enable Sending"; SPF records can be removed but DKIM must stay published.
- **Forwarding from an existing mail service instead:** forward to an address on a Resend-verified receiving domain, NOT to the SMTP host in the MX record. "Resend drops emails for domains whose receiving `MX` record isn't verified."
- **Domain records and verification** are in [DOMAINS.md](DOMAINS.md).

## The webhook

- **Verify every request's signature** (svix headers) against the raw body to prevent spoofed events, then return `200`. Resend retries on any non-200 response.
- **Verification, deduplication and retry behavior:** [WEBHOOKS.md](WEBHOOKS.md#verify-the-signature) owns the SDK contract and the attributed receiving-source example.
- **The docs' receiving pages skip verification.** Their routes parse `await request.json()` and call verification optional ("You can also implement webhook request verification"); the vendor reference says "Always verify signatures", and the verify page says to use the raw body. The docs' attachments route, as published:

```ts
// app/api/events/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend('re_xxxxxxxxx');

export const POST = async (request: NextRequest) => {
  const event = await request.json();

  if (event.type === 'email.received') {
    const { data: attachments, error } =
      await resend.emails.receiving.attachments.list({
        emailId: event.data.email_id,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    for (const attachment of attachments.data) {
      // use the download_url to download attachments however you want
      const response = await fetch(attachment.download_url);
      if (!response.ok) {
        console.error(`Failed to download ${attachment.filename}`);
        continue;
      }

      // get the file's contents
      const buffer = Buffer.from(await response.arrayBuffer());

      // process the content (e.g., save to storage, analyze, etc.)
    }

    return NextResponse.json({
      attachmentsProcessed: attachments.data.length,
    });
  }

  return NextResponse.json({});
};
```
- **Local development:** tunnel with ngrok, Tailscale Funnel or VS Code Port Forwarding (`ngrok http 3000`, then use `https://abc123.ngrok.io/api/webhook` as the endpoint).
- **The payload is metadata only:**

```json
{
  "type": "email.received",
  "created_at": "2024-02-22T23:41:12.126Z",
  "data": {
    "email_id": "a1b2c3d4-...",
    "from": "sender@example.com",
    "to": ["support@acme.com"],
    "cc": [],
    "bcc": [],
    "subject": "Question about my order",
    "attachments": [
      {
        "id": "att_abc123",
        "filename": "receipt.pdf",
        "content_type": "application/pdf"
      }
    ]
  }
}
```

- **More payload fields:** `received_for` (from the `for` clause of the `Received` headers); attachments also carry `content_disposition` and `content_id`. On received mail `from` is the bare address; the display name is in `headers.from` on the retrieve endpoint.

## Reading the email

- **`resend.emails.receiving.get(emailId)`** returns `html`, `text`, `headers`, `html_format`, `received_for`, `authentication`, `raw` and `attachments[]` (with `size`).
- **`html_format` query:** `data_uri` (default; inline images as base64 data URIs) or `cid` (keeps `<img src="cid:...">`, matching the attachment's `content_id`). Emails whose inlined HTML would exceed 100 MB always come back as `cid`; check the returned `html_format`.
- **`authentication`:** `{ spf, dkim, dmarc }`, each `pass | fail | gray | processing_failed | unknown`, computed by the receiving server (the sender cannot forge it). `gray` means: SPF none, softfail or neutral; DKIM unsigned or signing domain differs from the From domain; DMARC passed SPF or DKIM but has no policy or `p=none`. It is `null` for emails received before the field existed.
- **`raw`:** `{ download_url, expires_at }`, a signed URL to the original `.eml` including attachments.
- **CLI:** `resend emails receiving get <id>`, `resend emails receiving list`, `resend emails receiving listen` (poll for new inbound).

```typescript
if (event.type === 'email.received') {
  const { data: email } = await resend.emails.receiving.get(
    event.data.email_id
  );

  console.log(email.html);    // HTML body
  console.log(email.text);    // Plain text body
  console.log(email.headers); // Email headers
}
```

## Attachments

- **`resend.emails.receiving.attachments.list({ emailId })`** and **`.get({ emailId, id })`** return `filename`, `download_url`, `expires_at` and `size` (bytes).
- **`download_url` is a signed URL valid for 1 hour** (`https://inbound-cdn.resend.com/...`). Check `expires_at`; when it has expired, call the API again for a fresh URL.
- **Any file type can be received;** the blocked-extension list applies only to sending ([SENDING.md](SENDING.md)).
- **CLI:** `resend emails receiving attachments`, `resend emails receiving attachment <emailId> <attachmentId>`.

```typescript
const { data: attachments } = await resend.emails.receiving.attachments.list({
  emailId: event.data.email_id,
});

for (const attachment of attachments.data) {
  console.log(attachment.filename);
  console.log(attachment.download_url);  // signed URL, see expires_at
  console.log(attachment.expires_at);
}
```

```typescript
const { data: attachment } = await resend.emails.receiving.attachments.get({
  emailId: event.data.email_id,
  id: 'att_abc123',
});

console.log(attachment.download_url); // signed URL
console.log(attachment.expires_at);   // expiration timestamp
console.log(attachment.size);         // bytes
```

```typescript
const response = await fetch(attachment.download_url);
const buffer = await response.arrayBuffer();

await saveToStorage(attachment.filename, buffer);
```

## Listing received emails

- **Poll or backfill without webhooks** with `resend.emails.receiving.list`. Cursor pagination: `after` (forward) or `before` (backward), mutually exclusive; `has_more` tells you another page exists. Attachments in the list are metadata only (`id`, `filename`, `content_type`, `size`).
- **`resend.emails.list()` lists only sent emails;** use this for inbound.

```typescript
const { data: emails } = await resend.emails.receiving.list({
  limit: 20,
  after: 'cursor_abc123', // optional, for forward pagination
});

for (const email of emails.data) {
  console.log(email.from, email.subject, email.created_at);
  console.log(email.attachments); // metadata only (id, filename, content_type, size)
}
// emails.has_more: true if more pages exist
```

## Routing by recipient

All emails to your receiving domain arrive at the same webhook; route on `to`:

```typescript
if (event.type === 'email.received') {
  const recipient = event.data.to[0];

  if (recipient.includes('support@')) {
    await handleSupportEmail(event.data);
  } else if (recipient.includes('billing@')) {
    await handleBillingEmail(event.data);
  } else {
    await handleUnknownEmail(event.data);
  }
}
```

## Forwarding

- **Built-in helper:** `resend.emails.receiving.forward({ emailId, to, from })`. By default it preserves the original content and attachments exactly ("passthrough"); `passthrough: false` with `text` or `html` forwards like a mail client, with a "forwarded message" footer. The event type is importable: `import { Resend, type EmailReceivedEvent } from 'resend'`. CLI: `resend emails receiving forward`.
- **Raw forwarding:** download `email.raw.download_url`, parse it with `mailparser` `simpleParser(raw, { skipImageLinks: true })` (or any RFC 5322 parser), strip `<` and `>` from `contentId`, then `resend.emails.send({ ..., attachments })`.
- **Manual workflow:** fetch the content, list and download the attachments, base64-encode them and send. Use a single send: batch doesn't support attachments.

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const payload = await req.text();
  const event = resend.webhooks.verify({ /* ... */ });

  if (event.type === 'email.received') {
    // 1. Get email content
    const { data: email, error: emailError } = await resend.emails.receiving.get(
      event.data.email_id
    );

    if (emailError) {
      console.error(emailError);
      return new Response('Failed to fetch email', { status: 500 });
    }

    // 2. Get attachments (if any)
    const { data: attachmentList, error: attachmentsError } =
      await resend.emails.receiving.attachments.list({
        emailId: event.data.email_id,
      });

    if (attachmentsError) {
      console.error(attachmentsError);
      return new Response('Failed to list attachments', { status: 500 });
    }

    // 3. Download and encode attachments
    const attachments = await Promise.all(
      attachmentList.data.map(async (att) => {
        const res = await fetch(att.download_url);
        if (!res.ok) {
          throw new Error(`Failed to download ${att.filename}`);
        }
        const buffer = Buffer.from(await res.arrayBuffer());
        return {
          filename: att.filename,
          content: buffer.toString('base64'),
        };
      })
    );

    // 4. Forward the email (single send: batch doesn't support attachments)
    const { error: sendError } = await resend.emails.send({
      from: 'Support System <system@acme.com>',
      to: ['team@acme.com'],
      subject: `Fwd: ${email.subject}`,
      html: email.html ?? undefined,
      text: email.text ?? '',
      attachments,
    });

    if (sendError) {
      console.error(sendError);
      return new Response('Failed to forward email', { status: 500 });
    }
  }

  return new Response('OK', { status: 200 });
}
```

- **The knowledge-base forwarding guide** reads `svix-id`, `svix-timestamp` and `svix-signature` with `req.headers.get(...)` and returns `400` "Missing headers" if any is absent, and returns `200` early when `result.type !== 'email.received'`.

## Replying in the thread

- **Without an inbox there are no threads:** reply with `resend.emails.send()` and set the threading headers yourself. Set `In-Reply-To` to the received `message_id` and the subject to `Re: ...`. For multiple replies, append the previous message IDs to `References`, space-separated: `'References': [...previousReferences, event.data.message_id].join(' ')`.
- **An inbox sets recipients and threading headers for you** ([INBOXES.md](INBOXES.md)).

## Storage, replay and quota

- **Resend stores received emails** even when no webhook is configured yet or the endpoint is down. View them in Dashboard > Emails > Receiving.
- **Missed webhooks:** replay events from the Webhooks dashboard, or fetch through the Receiving API or CLI at any time.
- **Received emails count toward the daily and monthly quotas** (each received email counts as 1). Content of emails received above quota cannot be retrieved: `403 email_above_quota` ([LIMITS-AND-ERRORS.md](LIMITS-AND-ERRORS.md)).

## Common mistakes

| Mistake | Fix |
|---|---|
| Expecting the body in the webhook payload | Call `resend.emails.receiving.get()` |
| Resend's MX not the lowest priority value | Give it the lowest number (highest priority) |
| MX on the root domain with existing email | Use a subdomain |
| Forwarding to the MX SMTP host | Forward to an address on a verified receiving domain |
| Using an expired `download_url` | Call the attachments API again |
| Not verifying webhook signatures | Always verify |
| Forgetting to return 200 | Resend retries on non-200 |
| Batch-sending a forward with attachments | Batch doesn't support attachments; use a single send |
| `resend.emails.list()` for inbound | Use `resend.emails.receiving.list()` |

## Prove it

- **Send a test email to the receiving address** and see it in Dashboard > Emails > Receiving.
- **The webhook delivery shows `200`** in the Webhooks dashboard, and an altered signature is rejected by your endpoint.
- **`resend.emails.receiving.get(email_id)` returns `html` or `text`,** and `authentication` shows the sender's SPF, DKIM and DMARC results.
- **An attachment downloads** from a fresh `download_url`, and its byte count matches `size`.
- **For a custom domain,** the MX lookup shows Resend's record with the lowest priority value, and mail to the root domain still reaches the existing provider when you used a subdomain.
