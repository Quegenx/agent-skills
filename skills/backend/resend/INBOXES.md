# Inboxes

An inbox sends and receives at one address on your domain. Received and sent emails group into threads; each thread sits in exactly one folder and can carry labels; drafts hold unsent emails; agent settings tell an AI agent how to handle the inbox's threads. Replies go out inside the thread with one call, and Resend sets the recipients and threading headers. Plain inbound email without an inbox is [RECEIVING.md](RECEIVING.md); securing an AI agent that acts on inbox mail is [AGENT-INBOX.md](AGENT-INBOX.md).

**Contents:** [Availability and setup](#availability-and-setup) · [Methods](#methods) · [Inboxes](#inboxes-1) · [Agent settings](#agent-settings) · [Labels](#labels) · [Threads](#threads) · [Thread emails: read, reply, forward](#thread-emails-read-reply-forward) · [Drafts](#drafts) · [Idempotency keys](#idempotency-keys) · [API key permissions](#api-key-permissions) · [Webhook events](#webhook-events) · [Common mistakes](#common-mistakes) · [Prove it](#prove-it)

## Availability and setup

- **Early access:** enable Inboxes in Labs; off by default, admin-only. Every plan includes 3 inboxes; more need a paid Transactional plan (unavailable for Vercel or Stripe Projects billing). Hitting the limit returns `403`.
- **SDK:** Node.js `resend` 6.34.1 or later (`npm install resend`); Python `resend` 2.50.0 or later. Other languages call the Inboxes API over HTTP.
- **Delete is `.remove()`, not `.delete()`.**
- **Every inbox endpoint takes the inbox ID or the inbox email address in the path.** In Node.js pass `emailAddress` instead of `inboxId`, for example `{ emailAddress: 'support@acme.com', threadId }`; `get`, `update` and `remove` take either as the first argument.
- **Inbox list endpoints always paginate** (Inboxes, Threads, Search Threads, Thread Emails, Drafts), except labels.

## Methods

| Resource | Node.js methods |
|---|---|
| Inboxes | `resend.inboxes.create(params)`, `.list(params?)`, `.get(idOrEmail)`, `.update(id, params)`, `.remove(id)` |
| Agent | `resend.inboxes.agent.get({ inboxId })`, `resend.inboxes.agent.update({ inboxId, ...params })` |
| Labels | `resend.inboxes.labels.list({ inboxId })`, `.create({ inboxId, ...params })`, `.update({ inboxId, labelId, ...params })`, `.remove({ inboxId, labelId })` |
| Threads | `resend.inboxes.threads.list({ inboxId, ...params })`, `.search({ inboxId, ...params })`, `.get({ inboxId, threadId })`, `.update({ inboxId, threadId, ...params })`, `.remove({ inboxId, threadId })` |
| Thread labels | `resend.inboxes.threads.labels.add({ inboxId, threadId, labels })`, `.set({ inboxId, threadId, labels })`, `.remove({ inboxId, threadId, labelId })` |
| Thread emails | `resend.inboxes.threads.emails.list({ inboxId, threadId, ...params })`, `.get({ inboxId, threadId, emailId })`, `.reply({ inboxId, threadId, emailId, ...params })`, `.forward({ inboxId, threadId, emailId, ...params })` |
| Drafts | `resend.inboxes.drafts.list({ inboxId, ...params })`, `.create({ inboxId, ...params })`, `.get({ inboxId, draftId })`, `.update({ inboxId, draftId, ...params })`, `.remove({ inboxId, draftId })`, `.send({ inboxId, draftId })` |

## Inboxes

```typescript
// Create an inbox on a domain of your team
const { data: created, error } = await resend.inboxes.create({
  emailAddress: 'support@acme.com',
  name: 'Customer Support',
  fromName: 'Ada from Support',
});
// created: { object: 'inbox', id }

// List inboxes, newest first
const { data: inboxes } = await resend.inboxes.list({ limit: 20 });
// inboxes.data[i]: { id, name, email_address, from_name, unread, last_received, created_at, updated_at }

// Get an inbox by ID or by email address
const { data: inbox } = await resend.inboxes.get('support@acme.com');
// inbox: { object, id, name, email_address, domain_id, receiving_address, from_name, unread, drafts, last_received, created_at, updated_at }

// Change the internal name or the name recipients see
const { data: updated } = await resend.inboxes.update('b3e2b2b6-3f0e-4c8e-9ad3-2f43a1e2c7f1', {
  name: 'Support',
  fromName: 'Acme Support',
});

// Delete an inbox
const { data: deleted } = await resend.inboxes.remove('b3e2b2b6-3f0e-4c8e-9ad3-2f43a1e2c7f1');
```

- **Create returns only `{ object, id }`;** call `get` for the other fields. List items carry fewer fields than `get`. `created_at`, `updated_at` and `last_received` are ISO 8601 strings.
- **Domain rules:** without `forwarding`, the domain must have receiving enabled, DKIM and SPF verified, and the inbound MX verified or pending. With `forwarding: true`, the domain needs only DKIM and SPF; Resend returns a `receiving_address` you forward mail to (read it with `inboxes.get()`). Use forwarding when the address already receives mail elsewhere and the MX can't change. Domain setup is in [RECEIVING.md](RECEIVING.md) and [DOMAINS.md](DOMAINS.md).
- **Create errors:** `422` the domain doesn't meet the rules; `409` the address is already in use; `403` the team is at the plan's inbox limit; `451` blocked account.
- **The local part of `emailAddress`** allows only letters, numbers, `.`, `_`, `%` and `-`. A `+` returns 422.
- **The address in the path matches case-insensitively.** An unknown ID or address returns `404 not_found`.
- **`fromName` is a plain name,** not `Name <email>`; it cannot contain a colon, `<`, `>` or line breaks; an empty string removes it.
- **Update needs at least one of `name` or `fromName`.**

## Agent settings

```typescript
const inboxId = 'b3e2b2b6-3f0e-4c8e-9ad3-2f43a1e2c7f1';

const { data: agent } = await resend.inboxes.agent.get({ inboxId });
// agent: { object: 'inbox_agent', instructions, tone, actions }

const { data: updated } = await resend.inboxes.agent.update({
  inboxId,
  instructions: 'Answer refund questions yourself. Escalate legal threats.',
  tone: 'concise_professional',
  actions: ['draft_reply', 'add_labels'],
});
// updated: { object: 'inbox_agent', id }
```

- **No agent yet:** `get` returns `instructions: null`, `tone: null`, `actions: []`. `update` creates the agent if none exists and returns only `{ object, id }`.
- **Omitted fields keep their value;** `null` clears `instructions` or `tone`.
- **`actions` replaces the whole set,** with no duplicates; `[]` disables all. Values: `draft_reply`, `forward_thread`, `add_labels`, `assign_thread`, `mark_as_spam`, `archive`, `move_to_trash`.
- **`instructions`** max 4000 characters. **`tone`:** `concise_professional`, `concise_casual`, `expanded_professional`, `expanded_casual`.

## Labels

```typescript
const inboxId = 'b3e2b2b6-3f0e-4c8e-9ad3-2f43a1e2c7f1';

const { data: label } = await resend.inboxes.labels.create({
  inboxId,
  name: 'Urgent',
  color: '#E93D82',
});
// label: { object: 'inbox_label', id }

const { data: labels } = await resend.inboxes.labels.list({ inboxId });
// labels.data[i]: { id, name, color, created_at }

await resend.inboxes.labels.update({
  inboxId,
  labelId: label.id,
  name: 'Billing',
  color: '#F76B15',
});

await resend.inboxes.labels.remove({ inboxId, labelId: label.id });
```

- **`color` is `#RRGGBB` hex;** the API returns it uppercase; without `color` the API picks one at random. Named colors like `'red'` are wrong.
- **Max 100 labels per inbox;** names are unique per inbox case-insensitively. A duplicate name or a full inbox returns 422.
- **`labels.list` is not paginated:** it returns every label, oldest first.
- **Labeling a thread** uses `threads.labels.add`. `threads.labels.remove` takes a label off the thread and keeps it on the inbox; only `labels.remove` deletes it. Deleting a label removes it from every thread and does not send `inbox.thread.labels.updated` for those threads.

## Threads

```typescript
const inboxId = 'b3e2b2b6-3f0e-4c8e-9ad3-2f43a1e2c7f1';
const threadId = '7c1f0a2e-5d3b-4e8a-9f61-2b8d4c6e1a90';
const labelId = '7f9c1d2e-4a6b-4c3d-8e15-9b0a7c6d5e34';

// Unread threads in the Inbox folder, most recently active first
const { data: threads } = await resend.inboxes.threads.list({
  inboxId,
  folders: ['inbox'],
  read: false,
  limit: 20,
});
// threads.data[i]: { id, subject, from, to, cc, bcc, labels, email_count, has_attachment, has_draft, read, received_at, folder }

// Find threads by text, sender, recipient, attachment or date
const { data: results } = await resend.inboxes.threads.search({
  inboxId,
  query: 'invoice -draft',
  from: ['billing@example.com'],
  hasAttachment: true,
  startDate: '2026-09-01',
  endDate: '2026-09-30',
});
// results.data[i]: the thread fields plus matched_email_id

const { data: thread } = await resend.inboxes.threads.get({ inboxId, threadId });
// thread: { object, id, subject, folder, labels, read }

// Mark read and move to a folder
const { data: changed } = await resend.inboxes.threads.update({
  inboxId,
  threadId,
  read: true,
  folder: 'archive',
});

// Add labels, replace all labels, or remove one label
const { data: added } = await resend.inboxes.threads.labels.add({ inboxId, threadId, labels: [labelId] });
// added: { object: 'list', data: [{ id, name, color }] }, every label now on the thread
await resend.inboxes.threads.labels.set({ inboxId, threadId, labels: [labelId] });
await resend.inboxes.threads.labels.remove({ inboxId, threadId, labelId });

// Move the thread to trash
const { data: trashed } = await resend.inboxes.threads.remove({ inboxId, threadId });
// trashed: { object, id, deleted }
```

- **Folders:** `inbox`, `archive`, `spam`, `sent`, `trash`; a thread is in exactly one. The API sets `sent` for threads with only outbound emails; you cannot set it.
- **`folders` defaults to `['inbox']`,** or `['inbox', 'archive', 'sent']` when `labels` is set. `spam` and `trash` are included only when named.
- **`after` and `before` take a thread ID, not a date;** pass only one. A cursor thread outside the selected folders returns 404.
- **Search can lag up to about a minute** behind new emails; use `threads.list` for the newest. All filters must match, and `query`, `from`, `to`, `cc`, `bcc`, `hasAttachment`, `startDate`, `endDate` must all match the same email in the thread, which must be in one of `folders`.
- **`query`:** every word must match; double quotes for an exact phrase; a `-` prefix excludes a word.
- **A search result's `matched_email_id`** is the `emailId` for the thread email endpoints.
- **`threads.update` takes only `read` and `folder`,** and needs at least one; labels go through `threads.labels.*`.
- **Thread labels:** `add` takes 1 to 10 label IDs and keeps existing ones; `set` takes 0 to 100 IDs and replaces all (`[]` clears); `remove` takes one label off. All three return every label on the thread after the change; an unknown label ID returns 404.
- **`threads.remove` moves the thread to `trash`** and deletes it after 30 days. Restore it by updating `folder` to `inbox`, `archive` or `spam`.

## Thread emails: read, reply, forward

```typescript
const inboxId = 'b3e2b2b6-3f0e-4c8e-9ad3-2f43a1e2c7f1';
const threadId = '7c1f0a2e-5d3b-4e8a-9f61-2b8d4c6e1a90';

// Emails in the thread, oldest first
const { data: emails } = await resend.inboxes.threads.emails.list({ inboxId, threadId });
const emailId = emails.data[emails.data.length - 1].id;

// The full email, body included
const { data: email } = await resend.inboxes.threads.emails.get({ inboxId, threadId, emailId });
// email: { id, direction, from, to, cc, bcc, reply_to, subject, message_id, html, text, attachments, read, received_at }

// Reply from the inbox address. The API sets `to` from the email you reply to.
const { data: reply } = await resend.inboxes.threads.emails.reply({
  inboxId,
  threadId,
  emailId,
  text: 'Refund issued for order 1041.',
  headers: { 'X-Ticket-Id': '4821' },
  attachments: [
    { filename: 'receipt.txt', content: Buffer.from('Order 1041 refunded').toString('base64') },
  ],
}, { idempotencyKey: `refund-reply/${emailId}` });
// reply: { id } (the sent email ID)

// Forward the email with its attachments
const { data: forwarded } = await resend.inboxes.threads.emails.forward({
  inboxId,
  threadId,
  emailId,
  to: ['delivered@resend.dev'],
  text: 'Flagging this refund request for you.',
}, { idempotencyKey: `refund-forward/${emailId}` });
// forwarded: { id } (the sent email ID)
```

- **`threads.emails.list` is oldest first;** pass the last `id` as `after` for the next, newer page. A cursor not in the thread returns 404.
- **`emailId` comes from `threads.emails.list` or `matched_email_id`,** never from `resend.emails.list()`.
- **Reply sends right away;** no draft is stored. A reply to a received email goes to its `Reply-To` addresses, or the sender if none. A reply to an inbox-sent email goes to its `to` recipients. You cannot set `to` on a reply; use `forward` to send to someone new.
- **`replyAll: true`:** on a received email it also copies the other `To` addresses and `cc`. On an inbox-sent email it goes to its Reply-To when that is not the inbox address, else its `to`, and copies its `cc`. The inbox address is left out and duplicates are removed.
- **Reply needs `html` or `text`** with more than whitespace. Without `subject`, the thread subject with `Re:` is used. Forward uses `Fwd:`.
- **Forward needs `to`;** it quotes the original and sends its attachments with yours. An original attachment sent from a URL (`path`) cannot be forwarded: 422.
- **Size:** attachment `content` totals at most 25 MB (on forward the original attachments count; `path` files don't, they are fetched at send time). The whole encoded email is at most 40 MB.
- **`attachments` and `headers` have the same shape as `resend.emails.send()`** ([SENDING.md](SENDING.md)). Resend sets `In-Reply-To`, `References` and `Reply-To`; setting any of them in `headers` (any case) returns 422. An empty header name, or a line break or null character in a name or value, returns 422.
- **Attachment 422s:** an empty file, a blocked file type, a `path` that is not `http` or `https`, or one pointing to `localhost`.
- **Reply and forward return only the sent email ID;** both take `idempotencyKey`.

## Drafts

```typescript
const inboxId = 'b3e2b2b6-3f0e-4c8e-9ad3-2f43a1e2c7f1';

// A draft that starts a new thread
const { data: draft } = await resend.inboxes.drafts.create({
  inboxId,
  to: ['delivered@resend.dev'],
  subject: 'Refund for order 1041',
  text: 'Refund issued for order 1041.',
  attachments: [
    {
      filename: 'receipt.txt',
      content: Buffer.from('Order 1041 refunded').toString('base64'),
      contentType: 'text/plain',
    },
  ],
}, { idempotencyKey: 'refund-draft/order-1041' });
// draft: { object: 'inbox_draft', id }

const { data: drafts } = await resend.inboxes.drafts.list({ inboxId, limit: 20 });

const { data: saved } = await resend.inboxes.drafts.get({ inboxId, draftId: draft.id });
// saved: { object, id, type, to, cc, bcc, subject, html, text, thread_id, reply_to_email_id, email_id, created_at, updated_at, attachments }
// saved.attachments[i]: { id, filename, content_type, size }

// Replace the body and every attachment
const { data: changed } = await resend.inboxes.drafts.update({
  inboxId,
  draftId: draft.id,
  html: '<p>Refund issued for order 1041.</p>',
  text: 'Refund issued for order 1041.',
  attachments: [
    {
      filename: 'invoice-1041.txt',
      content: Buffer.from('Invoice 1041, refunded in full').toString('base64'),
      contentType: 'text/plain',
    },
  ],
});
// changed: { object: 'inbox_draft', id }

const { data: sent } = await resend.inboxes.drafts.send(
  { inboxId, draftId: draft.id, headers: { 'X-Ticket-Id': '4821' } },
  { idempotencyKey: `refund-draft-send/${draft.id}` },
);
// sent: { id } (the sent email ID)

// Discard a draft you do not want to send
const { data: other } = await resend.inboxes.drafts.create({ inboxId, subject: 'Notes' });
await resend.inboxes.drafts.update({ inboxId, draftId: other.id, attachments: [] });
await resend.inboxes.drafts.remove({ inboxId, draftId: other.id });
```

- **Reply draft:** pass `threadId` and `replyToEmailId` together. Without `to` it is addressed like a reply; `to: []` leaves it empty.
- **One unsent reply draft per email.** Creating another returns `200` with the existing draft's ID (not `201`), ignoring every field except `attachments`, which replaces the existing attachments. With the `draft_reply` action on, the inbox agent may create that draft first.
- **A draft needs at least one non-empty** `to`, `cc`, `bcc`, `subject`, `text`, `html` or `attachments`. `to` plus `cc` plus `bcc` is at most 50 recipients.
- **Draft attachments need `content` (base64), `filename` and `contentType`.** `path` without `content`, or `contentId`, returns 422. Files total at most 25 MB. An empty file or a blocked type (`.exe`) returns 422.
- **Update with `attachments` replaces all;** `[]` removes all; omit it to keep them.
- **Update setting `text` or `html` replaces the whole body;** the omitted part becomes `null`. Send both to keep both.
- **Send needs at least one `to` and `html` or `text`,** else 422; a new-thread draft also needs a non-empty `subject`. A reply draft without `subject` has an empty subject, and send uses the thread subject with `Re:`. The sent email is at most 40 MB encoded.
- **Update, remove or send on an already-sent draft returns 409.**
- **`drafts.list` returns only unsent drafts,** most recently updated first.
- **Only `drafts.send` takes `headers`** (an object of string values); create and update don't. The reply and forward header rules apply.

## Idempotency keys

- **Pass `{ idempotencyKey }` as the options argument** when retrying, so a retry doesn't create a second draft or send a second email.

| Key facts | |
|---|---|
| Operations | `drafts.create`, `drafts.send`, `threads.emails.reply`, `threads.emails.forward`; no other inbox operation takes it |
| Format | `<event-type>/<entity-id>` (for example `refund-reply/<email-id>`) |
| Length | 1 to 256 characters |
| Expiration | 24 hours |
| Same key, same payload | Returns the first successful (2xx) response, creates no new draft or email; response header `idempotent-replayed: true` |
| Failed first request | Not stored; retry with the same key |
| Same key, different payload | `409 invalid_idempotent_request` |
| Same key while the first request runs | `409 concurrent_idempotent_requests` |

## API key permissions

- **A full access key** can call every inbox endpoint. An agent that reads emails or lists threads needs one.
- **A sending access key** can only reply, forward, create drafts and send drafts; every other inbox endpoint returns `401 restricted_api_key`.
- **A sending key limited to one domain** works only on that domain's inboxes; another domain returns `403`.

## Webhook events

- **Events (private beta):** `inbox.created`, `inbox.updated`, `inbox.deleted`; `inbox.thread.created`, `inbox.thread.folder.updated`, `inbox.thread.assigned`, `inbox.thread.unassigned`, `inbox.thread.labels.updated`; `inbox.email.received`, `inbox.email.sent`; `inbox.draft.created`, `inbox.draft.updated`, `inbox.draft.sent`, `inbox.draft.deleted`.
- **A webhook on `email.received` alone does not get inbox events;** subscribe to `inbox.email.received`. The agent's own replies fire `inbox.email.sent`.
- **Payload `data`** has `source` (`api`, `dashboard`, `agent`, `system`) and `inbox_id`, plus `thread_id`, `email_id` or `draft_id` where they apply.
- **Email and draft payloads omit `html` and `text`;** call `threads.emails.get()` or `drafts.get()`. The `draft` object in `inbox.draft.*` lists `attachments` as `{ id, filename, content_type, size }`, without file content.
- **`inbox.deleted` carries only `inbox_id`;** `inbox.draft.deleted` has no `draft` object. `inbox.created` and `inbox.updated` carry `inbox` with the `inboxes.get()` fields and ISO 8601 timestamps.
- **`inbox.thread.labels.updated`** lists changed labels in `added` and `removed`; one `threads.labels.set` call can fill both; a call that changes nothing sends no event.
- **Sending a draft sends both `inbox.draft.sent` and `inbox.email.sent`,** in no fixed order.
- **Retries keep the same `svix-id`;** use it to deduplicate. Verification and retries are in [WEBHOOKS.md](WEBHOOKS.md).

## Common mistakes

| Mistake | Fix |
|---|---|
| Reading fields from a create or update response | Inbox, label and draft create and update, and agent update, return only `{ object, id }`; call `get` |
| Labeling with `threads.update` | Use `threads.labels.add`, `set` or `remove` |
| `threads.labels.set` to add one label | `set` replaces all; use `add` |
| Reading threads with a sending access key | Use a full access key |
| `Reply-To` in `headers` on reply, forward or draft send | Resend sets `In-Reply-To`, `References`, `Reply-To` |
| Passing `to` on a reply | Use `forward` |
| An ID from `resend.emails.list()` as `emailId` | Use a `threads.emails.list` ID or `matched_email_id` |
| Expecting `threads.remove` to delete at once | It moves to `trash` for 30 days |
| `folder: 'sent'` | API-set; use `inbox`, `archive`, `spam`, `trash` |
| A named color like `'red'` | `#RRGGBB` hex |
| A `path` attachment on a draft | Send `content`, `filename`, `contentType` |
| `attachments` on draft update to add one file | It replaces all; send the full list |
| Updating only `html` on a draft that has `text` | The omitted part becomes `null`; send both |
| Expecting a new email in search at once | Up to about a minute of lag; use `threads.list` |
| A `+` in the inbox address | Only letters, numbers, `.`, `_`, `%`, `-` |
| Old SDK (`Cannot read properties of undefined (reading 'threads')`) | `npm install resend@latest`; check with `npm list resend` |

## Prove it

- **`npm list resend` shows 6.34.1 or later.**
- **`inboxes.get(address)` returns the inbox,** and for a forwarding inbox a `receiving_address`.
- **Mail sent to the inbox address appears** in `threads.list({ inboxId, folders: ['inbox'] })` and fires `inbox.email.received`.
- **A reply lands in the same thread:** after `threads.emails.reply`, `threads.emails.list` shows the new outbound email.
- **A retried reply with the same `idempotencyKey`** returns the same ID with `idempotent-replayed: true` and sends nothing new.
- **A sending access key gets `401 restricted_api_key`** on `threads.list`.
