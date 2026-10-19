# Contacts and Broadcasts

Contacts are the recipients Resend stores for marketing email: each carries custom properties, belongs to any number of Segments and holds a subscription per Topic. Broadcasts send one email to a Segment. Everyone in the Segment receives a Broadcast except contacts that are globally unsubscribed, suppressed, or opted out of the Broadcast's Topic (`topicId`). Sending one-to-one transactional email is [SENDING.md](SENDING.md); hosted templates are [TEMPLATES.md](TEMPLATES.md); quotas and error codes are [LIMITS-AND-ERRORS.md](LIMITS-AND-ERRORS.md).

**Contents:** [The model](#the-model) · [SDK rules for every resource here](#sdk-rules-for-every-resource-here) · [Contacts](#contacts) · [Bulk import from CSV](#bulk-import-from-csv) · [Contact properties](#contact-properties) · [Segments](#segments) · [Topics](#topics) · [Broadcasts](#broadcasts) · [Recipients and clicked links](#recipients-and-clicked-links) · [Unsubscribes](#unsubscribes) · [Webhook events](#webhook-events) · [Common mistakes](#common-mistakes) · [Prove it](#prove-it)

## The model

- **Global Contact model (since November 2025):** a Contact is one email address across the team, in zero, one or many Segments, and counts once toward the Contact quota. Former Audiences are now Segments. The Audiences API is deprecated and will be removed; endpoints that needed `audience_id` work directly. In the Node SDK `resend.audiences` is marked `@deprecated Use segments instead`.
- **Segments are who, Topics are what kind.** Segments are sender-controlled and internal (never visible to contacts). Topics are recipient-controlled and shown on the unsubscribe page. Everyone in the Segment receives except contacts globally unsubscribed or opted out of the Topic. If you don't use Topics, all subscribed contacts in the Segment receive.
- **Migrating from Audiences:** move unsubscribe logic to Topics (one Topic per email type) and use Segments only for internal organization.
- **Contacts are also created automatically** when an Automation runs for an unknown address ([AUTOMATIONS.md](AUTOMATIONS.md)).
- **Contact quota:** you can store more contacts than the plan allows, but you cannot send Broadcasts until you upgrade or remove contacts. The attempt returns `403` `validation_error` "You have reached your contacts quota. Please upgrade your plan to send more emails."

## SDK rules for every resource here

- **Delete is `.remove()`, never `.delete()`,** on contacts, contact properties, segments, topics and broadcasts.
- **The SDK returns `{ data, error }` and does not throw.** Always destructure and check `error`.
- **Use `segmentId`, not `audienceId`,** everywhere in Node.js.
- **Interpolation uses triple braces:** `{{{VAR}}}`. `{{VAR}}` does not render.
- **Argument shapes differ per resource:** `contacts.get({ id })` or `({ email })`, but `contacts.imports.get(id)` positional; `segments.update(id, { name })`, but `topics.update({ id, ... })`; `broadcasts.update(id, params)`; `contacts.segments.add({ contactId, segmentId })`, but `contacts.topics.update({ id, topics })`.
- **Pagination styles differ:** `contacts.list` and `broadcasts.list` use `limit` and `offset` in the vendor skill; imports, recipients and clicked links use cursors (`after`, `before`); Node `topics.list()` takes no pagination params. The pagination docs say the older list endpoints (Broadcasts, Segments, Contacts) take an optional `limit` and return ALL items in one response without it, and show contacts paginated with `after`; newer endpoints (Topics among them) always paginate. Confirm in the current API reference. The pagination docs' example:

```ts
const resend = new Resend('re_xxxxxxxxx');

// First page
const { data: firstPage } = await resend.contacts.list({ limit: 50 });

// Second page (if has_more is true)
if (firstPage.has_more) {
  const lastId = firstPage.data[firstPage.data.length - 1].id;
  const { data: secondPage } = await resend.contacts.list({
    limit: 50,
    after: lastId,
  });
}
```

## Contacts

| Operation | Node.js method | Notes |
|---|---|---|
| Create | `resend.contacts.create(params)` | `email` is the only required field |
| Get | `resend.contacts.get({ id })` or `resend.contacts.get({ email })` | Lookup by ID or email |
| List | `resend.contacts.list({ limit?, offset?, segmentId? })` | Filter by segment |
| Update | `resend.contacts.update(params)` | By `id` or `email` |
| Delete | `resend.contacts.remove({ id })` or `resend.contacts.remove({ email })` | Not `.delete()` |

- **Pass either `id` or `email`** to get, update and remove, never both.
- **Create fields:** `email` (required), `firstName`, `lastName`, `unsubscribed` (global; `true` means no Broadcasts), `properties`, `segments: [{ id }]`, `topics: [{ id, subscription: 'opt_in' | 'opt_out' }]`.
- **Delete a property by setting it to `null`** on update. An empty string does not delete it. Update property values are `string | number | boolean | null`.
- **The dashboard can't edit a contact's email.**

```typescript
const { data, error } = await resend.contacts.create({
  email: 'alice@example.com',
  firstName: 'Alice',
  lastName: 'Smith',
  unsubscribed: false,
  properties: {
    plan: 'enterprise',
    company: 'Acme Corp',
    signupDate: '2026-01-15',
  },
  segments: [{ id: 'seg_abc123' }],
  topics: [
    { id: 'topic_product_updates', subscription: 'opt_in' },
    { id: 'topic_marketing', subscription: 'opt_out' },
  ],
});
if (error) {
  console.error(error);
  return;
}
console.log(data.id); // contact ID
```

```typescript
// Get by email (alternative: pass { id: 'contact_uuid' })
const { data, error } = await resend.contacts.get({ email: 'alice@example.com' });

// Update by email, change properties, set a property to null to delete it
const { data: updated, error: updateErr } = await resend.contacts.update({
  email: 'alice@example.com',
  firstName: 'Alicia',
  properties: {
    plan: 'pro',       // update existing property
    company: null,     // delete this property
  },
});
```

```typescript
// Delete by ID or email: pick one
const { data, error } = await resend.contacts.remove({ email: 'alice@example.com' });

// List with segment filter
const { data: contacts, error: listErr } = await resend.contacts.list({
  segmentId: 'seg_abc123',
  limit: 50,
});
```

- **CLI:** `resend contacts create --email ... --first-name ... --last-name ...`, `resend contacts update <id|email> --unsubscribed`, `resend contacts delete <id|email>`. More in [CLI.md](CLI.md).

## Bulk import from CSV

- **Endpoint:** `POST /contacts/imports`, `multipart/form-data`. Imports run asynchronously: `create` returns an import id immediately; poll `get` until `status` is `completed` (or `failed`).
- **Methods:** `resend.contacts.imports.create({ file, columnMap?, onConflict?, segments?, topics? })` where `file` is a `Blob` or `File` (CSV), returns `{ id }`; `resend.contacts.imports.get(id)` (positional string, not `{ id }`) returns status and counts; `resend.contacts.imports.list({ limit?, after?, before?, status? })` with `status` one of `queued`, `in_progress`, `completed`, `failed` (`limit` default 10, max 100).
- **`onConflict`:** `'upsert'` (default) updates existing contacts; `'skip'` leaves them unchanged.
- **Default columns (without `columnMap`):** lowercase `email` (required), `first_name`, `last_name`, `unsubscribed`. Matching is case-sensitive: `Email` or `First Name` headers return `422 validation_error` ("CSV missing required email column"). Pass `columnMap` for other headers.
- **Field casing:** the SDK takes camelCase (`firstName`, `lastName`); the raw multipart field is `column_map` with snake_case keys (`first_name`, `last_name`). `column_map`, `segments` and `topics` are sent as JSON-encoded strings. Property columns map as `properties: { key: { column, type } }` with `type` `string`, `number` or `boolean` (default `string`).
- **Properties not yet defined are created automatically** when mapped in an import.
- **Max file size:** the vendor skill says 100 MB; the API reference says 200 MB. Confirm in the current docs.
- **`contact.created` webhooks are not triggered for CSV imports.**

```typescript
import { readFile } from 'node:fs/promises';

const file = new Blob([await readFile('contacts.csv')], { type: 'text/csv' });

const { data, error } = await resend.contacts.imports.create({
  file,
  // 'upsert' (default) updates existing contacts; 'skip' leaves them unchanged
  onConflict: 'upsert',
  segments: [{ id: 'seg_abc123' }],
});
if (error) {
  console.error(error);
  return;
}

// Imports are async: poll until processing finishes
const { data: imp } = await resend.contacts.imports.get(data.id);
console.log(imp.status, imp.counts);
// e.g. 'completed' { total: 1200, created: 800, updated: 300, skipped: 75, failed: 25 }

// List past imports, newest first; filter by status and paginate with after/before
const { data: imports } = await resend.contacts.imports.list({ status: 'completed', limit: 20 });
```

```typescript
await resend.contacts.imports.create({
  file,
  columnMap: {
    email: 'Email',
    firstName: 'First Name',
    lastName: 'Last Name',
    properties: { plan: { column: 'Plan', type: 'string' } },
  },
});
```

```bash
curl -X POST 'https://api.resend.com/contacts/imports' \
  -H 'Authorization: Bearer re_xxxxxxxxx' \
  -F 'file=@contacts.csv;type=text/csv' \
  -F 'column_map={"email":"Email","first_name":"First Name"}' \
  -F 'on_conflict=upsert'
```

## Contact properties

- **Custom properties are account-wide:** they apply across all segments and are interpolated in Broadcast HTML. Built-in fields are `email`, `first_name`, `last_name`, `segments`, `topics`, `unsubscribed`, `properties`.
- **Methods:** `resend.contactProperties.create(params)`, `.get(id)`, `.list(params?)`, `.update(params)`, `.remove(id)`.
- **Create:** required `key` and `type`, optional `fallbackValue`. `key` is alphanumeric plus underscores, max 50 characters, case sensitive. `type` is `"string"` or `"number"`. `fallbackValue` is used when a contact lacks a value and must match `type`.
- **`key` and `type` are immutable.** Only `fallbackValue` can be updated; to change `key` or `type`, delete and recreate.
- **Unknown keys fail:** a property is only added on contact create or update if the key exists and the type is valid; otherwise the call fails. (CSV imports are the exception: they create mapped properties.)
- **Types disagree between pages:** the create-property endpoint allows `string | number`; the import and contact-update pages also allow `boolean`. Confirm in the current docs.

```typescript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

// Create a property
const { data, error } = await resend.contactProperties.create({
  key: 'company_name',
  type: 'string',
  fallbackValue: 'your company',
});

if (error) {
  console.error(error);
  return;
}

// Get, list, update, delete
const { data: prop } = await resend.contactProperties.get(data.id);

const { data: props } = await resend.contactProperties.list();

// Only fallbackValue can be updated
const { data: updated } = await resend.contactProperties.update({
  id: data.id,
  fallbackValue: 'your organization',
});

const { data: deleted } = await resend.contactProperties.remove(data.id);
```

```typescript
const { data, error } = await resend.contacts.create({
  email: 'alice@example.com',
  properties: {
    company_name: 'Acme Corp',
    plan_tier: 'enterprise',
  },
});
```

- **In Broadcast HTML,** use triple mustache with a pipe fallback. The fallback after the pipe overrides the property's `fallbackValue` for that Broadcast:

```html
<p>Hi {{{FIRST_NAME|there}}}, welcome from {{{company_name|your company}}}!</p>
```

- **CLI:** `resend contact-properties create --key company_name --type string --fallback-value "Acme Corp"`, `resend contact-properties delete <id> --yes`.

## Segments

- **Segments group contacts for Broadcast targeting.** They are internal only; no consent is needed to add someone to one; deleting a Segment deletes no contacts. Unsubscribed or suppressed contacts receive nothing even when in a Segment.
- **Contacts can be in many Segments at once and are never added automatically:** add them with `contacts.segments.add()` (or `segments` on create or import).
- **Methods:** `resend.segments.create(params)`, `.get(id)`, `.update(id, { name })` (rename only), `.list(params?)`, `.remove(id)`. List a Segment's contacts with `resend.contacts.list({ segmentId })`.
- **Update takes only `name`,** and its response returns only `object` and `id`, not the new name.
- **Contact's Segments:** `resend.contacts.segments.add({ contactId | email, segmentId })`, `.remove(...)`, `.list({ contactId })`.

```typescript
const { data, error } = await resend.segments.create({
  name: 'Active Users',
});

if (error) {
  console.error(error);
  return;
}

console.log(data.id); // seg_xxxxxxxx
```

```typescript
const { data, error } = await resend.segments.update('seg_xxx', {
  name: 'Active Users (Q3)',
});

if (error) {
  console.error(error);
  return;
}

console.log(data.id); // UUID, e.g. 78261eea-8f8b-4381-83c6-79fa7120f1cf
```

```typescript
// Add contact to segment
await resend.contacts.segments.add({ contactId: 'cont_xxx', segmentId: 'seg_xxx' });

// Remove contact from segment
await resend.contacts.segments.remove({ contactId: 'cont_xxx', segmentId: 'seg_xxx' });
```

- **Segment metrics (private beta):** install `npm install resend@6.31.1-preview-headless-dashboard.0`, then `resend.segments.metrics({ dimensions: ['segment'], metrics: ['all_contacts'] })`. Metrics are `all_contacts`, `subscribers`, `unsubscribers`; point-in-time, cached up to 15 minutes.
- **CLI:** `resend segments create --name "Registered Users"`, `resend segments contacts <id>`, `resend contacts add-segment <id|email> --segment-id ...`, `resend contacts remove-segment <id|email> <segmentId>`, `resend contacts segments <id>`.

## Topics

- **Topics are per-type subscription preferences:** contacts opt in or out of each. A Broadcast with `topicId` reaches only contacts subscribed to that Topic; without `topicId` it goes to every subscribed contact in the Segment regardless of topic preferences.
- **Methods:** `resend.topics.create(params)`, `.get(id)`, `.list()` (no pagination params in Node), `.update(params)`, `.remove(id)`.
- **`defaultSubscription` is required on create** (`"opt_in"` or `"opt_out"`) and cannot be changed later; delete and recreate to change it. Only `name`, `description` and `visibility` can be updated.
- **Opt-in vs opt-out:** opt-in means all contacts receive unless they unsubscribed (applies retroactively to all contacts); opt-out means only contacts who explicitly subscribed. Use opt-in for broadly relevant content, opt-out for niche content (a beta program).
- **Constraints:** `name` max 50 characters; `description` max 200; `visibility` `"public"` (shown on the unsubscribe page) or `"private"` (the API default; only opted-in contacts see it on the unsubscribe page). `"hidden"` is not valid.
- **Best practice:** 3 to 5 Topics, clear names, add descriptions, and always label Broadcasts with a Topic: "If you send a Broadcast without a Topic and someone unsubscribes, they'll be unsubscribed from all your emails." Single-type senders may not need Topics.
- **Transactional sends can carry `topic_id` too** ([SENDING.md](SENDING.md)): opted in means sent; opted out means not sent and marked failed; not a contact means sent only if the Topic's default is opt-in. Each address in `to`, `cc` and `bcc` is checked separately.
- **Contact's Topics:** `resend.contacts.topics.list({ id | email })`; `resend.contacts.topics.update({ id | email, topics: [...] })`.

```typescript
const { data, error } = await resend.topics.create({
  name: 'Product Updates',
  defaultSubscription: 'opt_in',  // REQUIRED: "opt_in" or "opt_out"
  description: 'New features and releases',
});

if (error) {
  console.error(error);
  return;
}

console.log(data.id); // topic_xxxxxxxx
```

```typescript
const { data, error } = await resend.topics.update({
  id: 'topic_xxx',
  name: 'Product News',
  description: 'News about our products',
});

if (error) {
  console.error(error);
  return;
}
```

```typescript
await resend.contacts.topics.update({
  id: 'cont_xxx',
  topics: [
    { id: 'topic_xxx', subscription: 'opt_in' },
    { id: 'topic_yyy', subscription: 'opt_out' },
  ],
});
```

- **CLI:** `resend topics create --name "Weekly Newsletter" --default-subscription opt_in`, `resend contacts update-topics <id|email> --topics '[...]'`.

## Broadcasts

- **Broadcasts are for marketing; the Send Email and Batch APIs are for transactional.** Transactional is triggered by a user action or legal requirement, can't be unsubscribed from and is usually one-to-one (order confirmation, password reset). Marketing is everything else, is regulated by CAN-SPAM (US) and CASL (Canada) and must offer an unsubscribe (abandoned cart is marketing).
- **Resend handles queuing, throttling and scheduling.** A Broadcast is sent to a Segment, and the Segment must exist first.
- **Two steps: create (draft), then send.** `create` does not send unless you pass `send: true`.
- **Methods:** `resend.broadcasts.create(params)`, `.get(id)`, `.list(params)`, `.send(id, params?)`, `.cancel(id)`, `.duplicate(id)`, `.update(id, params)`, `.remove(id)`, `.clickedLinks(id, params?)`, `.recipients(id, params)`.
- **Create fields:** `segmentId`, `from`, `subject` and one of `html`, `text`, `react` (Node only). Optional: `topicId`, `previewText`, `replyTo`, `send` (default `false`, a draft), `scheduledAt`. The vendor skill lists `name` as required; the API reference describes `name` as internal and lists only `segment_id`, `from`, `subject` as required. `text` is generated from the HTML unless you pass `""`.
- **`scheduledAt`** accepts ISO 8601 (`2025-03-15T10:00:00Z`) or natural language (`in 1 hour`). On `create` it requires `send: true`.
- **`send` works only on API-created Broadcasts;** a dashboard-created Broadcast cannot be sent with this endpoint.
- **Suggested from addresses:** `My Company Name <company@updates.example.com>`, `My Newsletter <company@newsletter.example.com>`.
- **Personalization:** `{{{PROPERTY_KEY|fallback}}}` for custom properties; the editor documents `{{{contact.first_name|fallback}}}`, `{{{contact.last_name|fallback}}}`, `{{{contact.email}}}`. Triple braces are required.
- **The dashboard editor** offers reply-to, topic, preview text, schedule and Markdown; its built-in review step may force fixes before "Slide to send". Test emails omit a custom Reply-To.

```typescript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

// Step 1: Create a draft broadcast
const { data: broadcast, error: createError } = await resend.broadcasts.create({
  name: 'March Newsletter',
  from: 'Acme <news@acme.com>',
  subject: 'Hi {{{FIRST_NAME|there}}}, here is your March update',
  html: '<p>Hi {{{FIRST_NAME|there}}}</p><a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Unsubscribe</a>',
  segmentId: 'seg_abc123',
  topicId: 'top_xyz789',     // optional: controls topic-level unsubscribes
});

if (createError) {
  console.error(createError);
  return;
}

// Step 2: Send it (or schedule)
const { data: sent, error: sendError } = await resend.broadcasts.send(broadcast.id, {
  scheduledAt: 'in 1 hour',  // optional: ISO 8601 or natural language
});

if (sendError) {
  console.error(sendError);
  return;
}
```

```typescript
const { data, error } = await resend.broadcasts.create({
  name: 'Flash Sale',
  from: 'Acme <deals@acme.com>',
  subject: 'Flash sale - 24 hours only',
  html: '<p>Shop now!</p>',
  segmentId: 'seg_abc123',
  send: true,
});
```

```typescript
const { data, error } = await resend.broadcasts.create({
  segmentId: '78261eea-8f8b-4381-83c6-79fa7120f1cf',
  from: 'Acme <onboarding@resend.dev>',
  subject: 'hello world',
  html: 'Hi {{{contact.first_name|there}}}, you can unsubscribe here: {{{RESEND_UNSUBSCRIBE_URL}}}',
  send: true,
  scheduledAt: 'in 1 hour',
});
```

### Lifecycle

| Status | Meaning | Cancel does |
|---|---|---|
| `draft` | Created, not sent | Cannot cancel |
| `scheduled` | Waiting for `scheduledAt` | Back to `draft` |
| `queued` | Mid-send | Becomes `canceled`, stops remaining recipients only |
| `sent` | Done | Cannot cancel |
| `canceled` | Stopped | Cannot be sent again |

- **Only `draft` and `scheduled` are editable;** after sending only the name can change. Already-sent emails can't be recalled.
- **Delete (`.remove`) works on `draft` or `scheduled` only;** deleting a scheduled Broadcast also cancels its delivery. Sent and queued Broadcasts can't be deleted. To stop delivery, use `.cancel()`, not `.remove()`.
- **Duplicate** makes a new draft named `"<name> (copy)"` (truncated to 70 characters) with the same content; it works on any Broadcast, including sent ones, and returns the new id.
- **`get` fields** include `audience_id` ("now called segment_id"), `segment_id`, `preview_text`, `status`, `scheduled_at`, `sent_at`, `topic_id`.

```typescript
// Get
const { data, error } = await resend.broadcasts.get('bc_abc123');

// List with pagination
const { data, error } = await resend.broadcasts.list({ limit: 10, offset: 0 });

// Update a draft
const { data, error } = await resend.broadcasts.update('bc_abc123', {
  subject: 'Updated subject line',
});

// Cancel a queued or scheduled broadcast: stops a queued send mid-flight, or
// reverts a scheduled one to draft. Does not remove the broadcast.
const { data, error } = await resend.broadcasts.cancel('bc_abc123');

// Duplicate: creates a new draft named "<name> (copy)" with the same content.
// Works on any broadcast, including sent ones. Returns the new broadcast's id.
const { data, error } = await resend.broadcasts.duplicate('bc_abc123');

// Delete: draft or scheduled only (deleting a scheduled broadcast also
// cancels its delivery). Sent broadcasts cannot be deleted.
const { data, error } = await resend.broadcasts.remove('bc_abc123');

// Clicked links: ranked by total clicks, paginated with cursors
const { data, error } = await resend.broadcasts.clickedLinks('bc_abc123', { limit: 10 });
```

- **CLI:** `resend broadcasts create|send|get|list|update|delete|cancel|duplicate|recipients|clicked-links`.

## Recipients and clicked links

- **Recipients take one required event `type`:** `sent`, `delivered`, `opened`, `clicked`, `bounced`, `complained`, `unsubscribed`, `suppressed`. Optional `email` filter. `bounceType` (`permanent`, `transient`, `undetermined`) only with `type: 'bounced'`; with any other type it is rejected with 422.
- **Each recipient row** has `id` (an opaque pagination cursor, not an entity id), `contact_id` (nullable), `email`, plus `count` (opened, clicked), `bounce_type` (bounced) or `clicked_links` (clicked).
- **Clicked links** are ranked by total clicks, with `clicks` and `unique_clicks`. A row's `id` is also an opaque cursor for `after` and `before`.
- **Both are cached up to 15 minutes;** `limit` 1 to 100, default 20.
- **Performance in the dashboard:** delivered, unsubscribed, click rate and open rate (opens can be inaccurate).

```typescript
// Who opened it
const { data, error } = await resend.broadcasts.recipients('bc_abc123', {
  type: 'opened',
});

// Who bounced, filtered to permanent bounces only
const { data, error } = await resend.broadcasts.recipients('bc_abc123', {
  type: 'bounced',
  bounceType: 'permanent',
});
```

## Unsubscribes

- **Every Broadcast and Automation email needs `{{{RESEND_UNSUBSCRIBE_URL}}}`** (or the editor's Unsubscribe Footer block); Resend then handles the flow. The link is unique per recipient and Broadcast and leads to the preference page (per Topic, or unsubscribe from all).

```html
<p>Hi {{{FIRST_NAME|there}}}, your balance is {{{BALANCE|0}}}.</p>
<a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Unsubscribe</a>
```

- **Unsubscribed means no Broadcasts and no Automation emails,** even for Topics the contact is subscribed to. Transactional emails via API or SMTP are still delivered unless the request includes a `topic_id` the contact opted out of.
- **Unsubscribed contacts are not removed automatically;** delete them for audience hygiene.
- **Suppression is not unsubscription.** Resend suppresses an address after a hard bounce or complaint but does not unsubscribe the contact; use webhooks to unsubscribe proactively ([WEBHOOKS.md](WEBHOOKS.md)).
- **Transactional email is generally exempt** from unsubscribe links; FTC and GDPR prioritize clear consent withdrawal for marketing.
- **Marketing consent and records:** [email-practices COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/COMPLIANCE.md#consent-records) owns the unchecked, optional consent and unsubscribe requirements.
- **Transactional unsubscribe headers:** Resend does not manage transactional lists. The RFC 8058 headers, POST/GET behavior, blank 200/202 response and 48-hour endpoint rule are owned by [email-practices COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/COMPLIANCE.md#the-unsubscribe-endpoint); Gmail and Yahoo scope is owned by [email-practices DELIVERABILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/DELIVERABILITY.md#sender-requirements-by-mailbox-provider).
- **Custom unsubscribe page:** Settings > Unsubscribe Page sets title, description, logo, background, text and accent color; one page serves every domain on the team. Pro plan or higher can remove "Powered by Resend".

## Webhook events

- **Contact events:** `contact.created` (not triggered for CSV imports), `contact.updated`, `contact.deleted`, `contact.topics.updated`. **Topic events:** `topic.created`, `topic.updated`, `topic.deleted`. **Suppression events:** `suppression.added`, `suppression.removed`.
- **Payloads:** `contact.created` data is `id, audience_id, segment_ids, created_at, updated_at, email, first_name, last_name, unsubscribed`. `contact.topics.updated` data is `{ email, topics: [{ id, subscription: opt_in|opt_out }] }` with only the changed topics. `topic.created` data is `{ id, name, description, default_subscription, deleted, created_at, updated_at }`. `suppression.added` data is `{ id, email, origin, source_id, created_at }`.
- **Setup, verification and retries** are in [WEBHOOKS.md](WEBHOOKS.md).

## Common mistakes

| Mistake | Fix |
|---|---|
| Passing both `id` and `email` to get, update or remove | Use one or the other |
| `audienceId` in Node.js | Use `segmentId` |
| Calling `.delete()` | The method is `.remove()` |
| Deleting a property with an empty string | Set it to `null` |
| Not checking `error` | The SDK returns `{ data, error }`, does not throw |
| CSV import 422 "missing required email column" | Headers match lowercase and case-sensitively; pass `columnMap` |
| `imports.get({ id })` | `imports.get(id)` takes a positional string |
| Treating an import as synchronous | Poll `imports.get(id)` until `completed` |
| Changing a property's `key` or `type`, or updating other fields than `fallbackValue` | Immutable; delete and recreate |
| `fallbackValue` of the wrong type | Must match `type` |
| Special characters in a property key | Only alphanumeric and underscores |
| `{{VAR}}` | `{{{VAR}}}` |
| Changing a Topic's `defaultSubscription` | Immutable; delete and recreate |
| `visibility: "hidden"` | `"public"` or `"private"` |
| Expecting `create` to send a Broadcast | Call `send`, or pass `send: true` |
| Missing `segmentId` | Required: Broadcasts target Segments, not all contacts |
| `scheduledAt` format confusion | ISO 8601 (`2025-03-15T10:00:00Z`) or natural language (`in 1 hour`) |
| Missing unsubscribe link | Include `{{{RESEND_UNSUBSCRIBE_URL}}}` |
| Broadcast without a Topic | An unsubscribe then removes the contact from all your emails |
| Deleting a sent Broadcast, or cancelling a draft or sent one | Only draft or scheduled can be deleted; only queued or scheduled can be cancelled |
| `.remove()` to stop delivery | Use `.cancel()` |
| Treating a recipient or clicked-link `id` as an entity id | It is a pagination cursor |
| `bounceType` with a type other than `bounced` | 422 |

## Prove it

- **A test contact round-trips:** create it with a property, a Segment and a Topic, then `contacts.get({ email })` returns them, `contacts.topics.list({ email })` shows the subscription, and setting the property to `null` removes it.
- **A CSV import finishes:** `imports.get(id)` reaches `completed` and its `counts` match the file.
- **A Broadcast reaches only the right people:** sent to a Segment with a `topicId`, `broadcasts.recipients(id, { type: 'delivered' })` lists the opted-in contact and not the opted-out or unsubscribed one.
- **Unsubscribing works:** the received email's unsubscribe link opens the preference page, and after using it the contact shows the Topic opted out (or `unsubscribed: true`).
- **Cancel behaves:** a scheduled Broadcast returns to `draft` after `.cancel()`.
