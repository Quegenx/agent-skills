# Templates

Hosted templates store an email's HTML and variables on Resend; a send references the template by ID or alias and passes only the variable values. They suit frequently sent transactional email (login and auth, onboarding, ecommerce, notifications, automations), and an Automation's `send_email` step sends a published template ([AUTOMATIONS.md](AUTOMATIONS.md)). A template must be published before sending; only the most recently published version sends, and edits stay draft until republished. The send call itself is [SENDING.md](SENDING.md).

**Contents:** [When to use a template](#when-to-use-a-template) · [Lifecycle and versions](#lifecycle-and-versions) · [Variables](#variables) · [Creating and managing](#creating-and-managing) · [Aliases](#aliases) · [Sending with a template](#sending-with-a-template) · [Fetching all templates](#fetching-all-templates) · [From React Email](#from-react-email) · [Common mistakes](#common-mistakes) · [Prove it](#prove-it)

## When to use a template

- **Use a template when** the same structure is reused across many sends, non-engineers need to edit copy without code, or you want version history.
- **Use inline `html` when** the structure changes per send, you need more than 50 dynamic variables, or you want tighter rendering control.
- **Ways to create one:** the dashboard editor, the API, the CLI, an HTML file, React Email, duplicating a template, or "Clone as Template" from a sent Broadcast.
- **React Email code pasted into the editor** may import only from `@react-email/components` and `react` (no local file imports or other packages).

## Lifecycle and versions

```
Create (draft) → Publish → Send
      ↑ edit                 |
      └─────────────────────┘
```

- **A draft cannot send; a published template can.** Editing a published template creates a new draft, and the published version keeps sending until you publish again.
- **Publishing is synchronous:** no delay is needed before sending. A send failure right after publishing has another cause.
- **Every template keeps full version history.** Reverting creates a new draft from the selected version without affecting the published one; it is in the dashboard template editor (Cmd/Ctrl+S saves the draft). Edit production templates (add or remove variables) as drafts without breaking sends.

## Variables

- **Triple mustache in HTML and subject:** `{{{VARIABLE_NAME}}}`. Double braces don't render. In the editor, type `{{` or choose Variable.
- **Plain substitution only:** no `{{#each}}`, `{{#if}}` or other Handlebars control flow. Pre-render dynamic lists server-side into a single HTML variable.
- **Key casing is free** (`ORDER_ID`, `orderId`, `order_id`) but must match exactly between the definition and the send.
- **Missing variables:** a variable with `fallbackValue` that is missing at send uses the fallback and the send succeeds. A variable without one that is missing at send fails the send (422 validation error); the email isn't sent.

| Limit | Value |
|---|---|
| Variables per template | 50 |
| Key characters | ASCII letters, numbers, underscores |
| Key length | 50 characters |
| String value | 2,000 characters |
| Number value | 2^53 - 1 |
| Variable `type` | `'string'` or `'number'` |

- **Reserved names:** the lists differ between pages. The vendor skill reserves `FIRST_NAME`, `LAST_NAME`, `EMAIL`, `UNSUBSCRIBE_URL`, `RESEND_UNSUBSCRIBE_URL`, `contact`, `this`. The dashboard variables page lists `FIRST_NAME`, `LAST_NAME`, `EMAIL`, `UNSUBSCRIBE_URL`, `contact`, `this`; the create-template reference lists `RESEND_UNSUBSCRIBE_URL` instead of `UNSUBSCRIBE_URL`; the send-email reference lists only `FIRST_NAME`, `LAST_NAME`, `EMAIL`, `UNSUBSCRIBE_URL`. The vendor skill says to rename them to `USER_FIRST_NAME`, `USER_EMAIL` and so on. Confirm in the current docs.

```typescript
{ key: 'ORDER_TOTAL', type: 'number', fallbackValue: 0 }
{ key: 'CUSTOMER_NAME', type: 'string', fallbackValue: 'Customer' }
{ key: 'ORDER_ID', type: 'string' }  // no fallbackValue = required at send time
```

```html
<!-- Correct -->
<p>Hi {{{CUSTOMER_NAME}}}, your order #{{{ORDER_ID}}} has shipped!</p>

<!-- Wrong: double braces don't render in Resend -->
<p>Hi {{CUSTOMER_NAME}}</p>
```

## Creating and managing

- **Methods:** `resend.templates.create(params)`, `.get(id)`, `.list(params)`, `.update(id, params)`, `.remove(id)` (not `.delete()`), `.publish(id)`, `.duplicate(id)`. Every method that takes an id also takes the alias.
- **Create:** required `name` and `html` (or `react`, Node only). Optional: `alias`, `from`, `subject`, `reply_to` (all three overridable at send), `text`, `variables` (`{ key, type, fallbackValue }`, up to 50). Returns `{ id: 'tmpl_abc123', object: 'template' }`. The vendor skill writes `reply_to` in snake_case while other Node params are camelCase. Confirm in the current docs.
- **`get`** returns `current_version_id`, `alias`, `status` (`draft` or `published`), `published_at`, `variables`, `has_unpublished_versions`.
- **`list`** is cursor-based: max 100 per page (default the most recent 20), `data.has_more`, next page with `after` set to the last item's id.
- **`update` is partial:** only provided fields change. **`remove`** returns `{ deleted: true }`.
- **`.publish()` chains** onto `create(...)` and `duplicate(...)`. `duplicate` returns `{ id: 'tmpl_new456', object: 'template' }`; use it for variants (A/B testing subject lines) or bootstrapping.

```typescript
const { data, error } = await resend.templates.create({
  name: 'Order Confirmation',
  alias: 'order-confirmation',
  subject: 'Your Order #{{{ORDER_ID}}}',
  html: '<p>Hi {{{CUSTOMER_NAME}}}, your order #{{{ORDER_ID}}} has shipped!</p>',
  variables: [
    { key: 'CUSTOMER_NAME', type: 'string', fallbackValue: 'Customer' },
    { key: 'ORDER_ID', type: 'string' },
  ],
});
// Returns: { id: 'tmpl_abc123', object: 'template' }
```

The API reference's version, with a `number` variable and create-then-publish in one step:

```typescript
import { Resend } from 'resend';

const resend = new Resend('re_xxxxxxxxx');

const { data, error } = await resend.templates.create({
  name: 'order-confirmation',
  html: '<p>Name: {{{PRODUCT}}}</p><p>Total: {{{PRICE}}}</p>',
  variables: [
    {
      key: 'PRODUCT',
      type: 'string',
      fallbackValue: 'item',
    },
    {
      key: 'PRICE',
      type: 'number',
      fallbackValue: 25,
    },
  ],
});

// Or create and publish a template in one step
const { data: published, error: publishError } = await resend.templates
  .create({
    name: 'order-confirmation',
    html: '<p>Thanks for your order!</p>',
  })
  .publish();
```

```typescript
const { data, error } = await resend.templates.create({
  name: 'Welcome',
  html: '<p>Hi {{{NAME}}}</p>',
}).publish();
// Template is created AND published in one call
```

```typescript
// Get by ID or alias
await resend.templates.get('tmpl_abc123');
await resend.templates.get('order-confirmation');  // by alias

// List: cursor-based pagination, max 100 per page
const { data } = await resend.templates.list({ limit: 100 });
// data.has_more === true → fetch next page
await resend.templates.list({ limit: 100, after: data.data[data.data.length - 1].id });

// Update (partial: only provided fields change)
await resend.templates.update('tmpl_abc123', { name: 'Order Confirmed' });

// Delete
await resend.templates.remove('tmpl_abc123');  // returns { deleted: true }
```

```typescript
await resend.templates.publish('tmpl_abc123');
// Template is now live. Publishing is synchronous: no delay needed before sending.
```

```typescript
const { data, error } = await resend.templates.duplicate('tmpl_abc123');
// Returns: { id: 'tmpl_new456', object: 'template' }

// Chainable: duplicate and publish in one call
const { data, error } = await resend.templates.duplicate('tmpl_abc123').publish();
```

- **CLI:** `resend templates create --name order-confirmation --html "..." --var PRODUCT:string:item --var PRICE:number:25`, and `resend templates publish|get|list|update|duplicate|delete`. More in [CLI.md](CLI.md).

## Aliases

- **An alias is a stable, human-readable slug** set at create time. Pass it in `id` anywhere the generated template ID goes, so you never store the `tmpl_` ID. `name` is display-only and separate from `alias`.

```typescript
// Set alias at create time
await resend.templates.create({
  name: 'Order Confirmation',   // display-only
  alias: 'order-confirmation',  // referenceable slug
  html: '<p>Hi {{{CUSTOMER_NAME}}}</p>',
});

// Reference by alias: no need to store the generated tmpl_ ID
template: { id: 'order-confirmation', variables: { CUSTOMER_NAME: 'Alice' } }
```

## Sending with a template

- **`template: { id, variables }`** where `id` is the id or alias of a PUBLISHED template. Both `/emails` and `/emails/batch` support templates.
- **`template` is mutually exclusive with `html`, `text` and `react`** (validation error). The payload's `from`, `subject` and `reply_to` override the template's defaults; if the template has no default, you must provide them.
- **`variables` is an object** in the examples and the send-email reference; the template-variables page text calls it an "array of variable objects". Confirm in the current reference.
- **Pass an `idempotencyKey`** on template sends (same endpoint, same rules as [SENDING.md](SENDING.md)).

```typescript
const { data, error } = await resend.emails.send(
  {
    from: 'Acme <orders@acme.com>',
    to: ['customer@example.com'],
    template: {
      id: 'order-confirmation',  // alias or auto-generated ID
      variables: { CUSTOMER_NAME: 'Alice', ORDER_ID: '12345' },
    },
  },
  { idempotencyKey: `order-confirm/${orderId}` }
);
```

## Fetching all templates

- **Loop on `has_more`** with `limit: 100` and `after` set to the last id of the previous page, and throw on `error`.

```javascript
// Requires: npm install resend
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function fetchAllTemplates() {
  const allTemplates = [];
  let cursor = null;
  let hasMore = true;

  while (hasMore) {
    const listParams = { limit: 100 };
    if (cursor) {
      listParams.after = cursor;
    }

    const { data, error } = await resend.templates.list(listParams);

    if (error) {
      console.error('Error fetching templates:', error);
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }

    allTemplates.push(...data.data);

    hasMore = data.has_more;
    if (hasMore && data.data.length > 0) {
      cursor = data.data[data.data.length - 1].id;
    }
  }

  return allTemplates;
}

const templates = await fetchAllTemplates();
console.log(`Fetched ${templates.length} templates`);
console.log(templates);
```

## From React Email

- **Scaffold:** `npx create-email@latest` creates `react-email-starter` with an `emails/` folder. Add the script `"email:dev": "email dev"` (or `email dev --dir src/emails`); the preview at localhost:3000 has Linter, Compatibility (caniemail) and Spam tools.
- **Components** are imported from `react-email` in this guide (`create-email` installs the `@react-email/components` package), and its send example passes JSX: `react: <Email url="https://example.com" />`.
- **Upload:** `npx react-email@latest resend setup` (needs a Full Access API key), then the Resend tab's "Upload" or "Bulk Upload". Remove the connection with `npx react-email@latest resend reset`.

## Common mistakes

| Mistake | Fix |
|---|---|
| `{{VAR}}` instead of `{{{VAR}}}` | Triple braces required |
| Sending with a draft template | Call `.publish()` first |
| Adding a delay after create or publish | Publishing is synchronous |
| `{{#each}}` or `{{#if}}` | No loops or conditionals; pre-render server-side |
| `html` and `template` in the same send | Mutually exclusive |
| `FIRST_NAME`, `EMAIL` as variable keys | Reserved; rename `USER_FIRST_NAME`, `USER_EMAIL` |
| A variable without fallback missing at send | Add `fallbackValue` or always provide it |
| Calling `.delete()` | `.remove()` |
| Expecting alias to equal name | Separate fields |
| 60 or more variables | Max 50; pre-render as a single HTML variable |
| No idempotency key on sends | Pass `idempotencyKey` |

## Prove it

- **`templates.get(alias)` shows `status: 'published'`** and a `published_at` from your last publish.
- **A send by alias to `delivered@resend.dev` succeeds** with every required variable, and a send that omits a variable without fallback returns a validation error instead of sending.
- **The rendered email shows no literal `{{{` or `{{`** in subject or body.
