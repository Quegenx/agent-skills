# Automations

Automations are event-driven email workflows: a directed graph of steps where a trigger step starts the flow and action steps follow (send email, delay, wait for event, condition, contact update, contact delete, add to segment). Steps are joined by connections that reference step keys, and an automation does nothing until its `status` is `enabled`, since it is created `disabled` by default. Emails sent by a step use a published hosted template ([TEMPLATES.md](TEMPLATES.md)); contacts are created automatically when an automation runs for an unknown address ([CONTACTS-AND-BROADCASTS.md](CONTACTS-AND-BROADCASTS.md)).

**Contents:** [Methods](#methods) · [Steps](#steps) · [Rule trees](#rule-trees) · [Connections](#connections) · [Constraints](#constraints) · [Examples](#examples) · [Runs, stop and duplicate](#runs-stop-and-duplicate) · [Events](#events) · [Common mistakes](#common-mistakes) · [Prove it](#prove-it)

## Methods

| Operation | Node.js method | Notes |
|---|---|---|
| Create | `resend.automations.create(params)` | Returns the automation ID |
| Get | `resend.automations.get(id)` | Full automation with steps and connections |
| List | `resend.automations.list(params?)` | Filter by `status`, cursor-paginated |
| Update | `resend.automations.update(params)` | Partial: name, status, or steps plus connections |
| Duplicate | `resend.automations.duplicate(id)` | Copies steps and connections, returns the new ID |
| Delete | `resend.automations.remove(id)` | Permanent |
| Stop | `resend.automations.stop(id)` | Sets status to `disabled` |
| List runs | `resend.automations.runs.list({ automationId, status? })` | Filter by run status |
| Get run | `resend.automations.runs.get({ automationId, runId })` | Run with executed steps |

- **The SDK returns `{ data, error }`** and does not throw; check `error`.

## Steps

Each step has `key` (unique within the graph), `type` and `config`.

| Type | Config | Description |
|---|---|---|
| `trigger` | `{ event_name: string }` | Entry point; fires when the named event occurs |
| `send_email` | `{ template: { id: string, variables?: object }, subject?: string, from?: string, reply_to?: string }` | Sends using a published template |
| `delay` | `{ duration: string }` | Human-readable (`"30 minutes"`, `"3 days"`) |
| `wait_for_event` | `{ event_name: string, timeout?: string, filter_rule?: object }` | `timeout` human-readable (`"1 hour"`); `filter_rule` is a rule tree |
| `condition` | Rule tree | Branches on contact data |
| `contact_update` | `{ first_name?, last_name?, unsubscribed?, properties? }` | Updates the contact |
| `contact_delete` | `{}` | Deletes the contact |
| `add_to_segment` | `{ segment_id: string }` | Adds the contact to a Segment |

## Rule trees

- **Leaf:** `{ "type": "rule", "field": "<namespace>.<key>", "operator": "<op>", "value": "<val>" }`.
- **Groups:** `{ "type": "and" | "or", "rules": [...] }`.
- **Operators:** `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `contains`, `starts_with`, `ends_with`, `exists`, `is_empty`. `exists` and `is_empty` take no `value`.
- **`condition` fields** use the `contact.*`, `event.*` and `wait_events.*` namespaces (for example `contact.properties.plan`).
- **`filter_rule` fields:** the step table restricts them to `event.*`; the rule-tree section of the same reference allows `event.*` or `contact.*` (for example `event.status`). Confirm in the current docs before filtering on `contact.*`.

## Connections

| Type | Use |
|---|---|
| `default` | Normal flow |
| `condition_met` | Branch when the condition is true |
| `condition_not_met` | Branch when the condition is false |
| `timeout` | `wait_for_event` timed out |
| `event_received` | `wait_for_event` received the event |

## Constraints

- **Max 150 steps** per automation.
- **At least one `trigger` step.**
- **Steps and connections go together** when updating the graph: send both full arrays.
- **`key` is unique;** connections reference steps by `key`.
- **Runs are metered:** plans include 10,000 runs a month (see [LIMITS-AND-ERRORS.md](LIMITS-AND-ERRORS.md)).

## Examples

```typescript
const { data, error } = await resend.automations.create({
  name: 'Welcome Series',
  status: 'enabled',
  steps: [
    {
      key: 'trigger_signup',
      type: 'trigger',
      config: { event_name: 'user.signed_up' },
    },
    {
      key: 'send_welcome',
      type: 'send_email',
      config: {
        template: { id: 'tmpl_abc123' },
        from: 'Acme <hello@acme.com>',
        subject: 'Welcome to Acme!',
      },
    },
    {
      key: 'wait_3_days',
      type: 'delay',
      config: { duration: '3 days' },
    },
    {
      key: 'send_followup',
      type: 'send_email',
      config: {
        template: { id: 'tmpl_def456' },
        from: 'Acme <hello@acme.com>',
        subject: 'Getting started with Acme',
      },
    },
  ],
  connections: [
    { from: 'trigger_signup', to: 'send_welcome' },
    { from: 'send_welcome', to: 'wait_3_days' },
    { from: 'wait_3_days', to: 'send_followup' },
  ],
});
```

```typescript
const { data, error } = await resend.automations.create({
  name: 'Onboarding with condition',
  status: 'enabled',
  steps: [
    { key: 'trigger', type: 'trigger', config: { event_name: 'user.signed_up' } },
    {
      key: 'check_plan',
      type: 'condition',
      config: { type: 'rule', field: 'contact.properties.plan', operator: 'eq', value: 'pro' },
    },
    { key: 'send_pro', type: 'send_email', config: { template: { id: 'tmpl_pro' }, from: 'Acme <hello@acme.com>' } },
    { key: 'send_free', type: 'send_email', config: { template: { id: 'tmpl_free' }, from: 'Acme <hello@acme.com>' } },
  ],
  connections: [
    { from: 'trigger', to: 'check_plan' },
    { from: 'check_plan', to: 'send_pro', type: 'condition_met' },
    { from: 'check_plan', to: 'send_free', type: 'condition_not_met' },
  ],
});
```

```typescript
// Enable/disable without changing the graph
const { data, error } = await resend.automations.update({
  id: 'aut_abc123',
  status: 'disabled',
});
```

```typescript
// Update the full graph (steps + connections required together)
const { data, error } = await resend.automations.update({
  id: 'aut_abc123',
  steps: [/* full step array */],
  connections: [/* full connections array */],
});
```

## Runs, stop and duplicate

- **Run statuses:** `running`, `completed`, `failed`, `cancelled`; filter with a comma-separated string.
- **A run's executed steps** carry `status`, `output` and `error`.
- **`stop`** sets the automation's status to `disabled`; the CLI reference adds that it cancels active runs.
- **`duplicate`** returns a new id; the copy starts disabled, named `"<original name> (Copy)"` (capital C, unlike a duplicated Broadcast's `(copy)`).

```typescript
// List runs, optionally filter by status
const { data: runs } = await resend.automations.runs.list({
  automationId: 'aut_abc123',
  status: 'running,failed',  // comma-separated: running, completed, failed, cancelled
});

// Get a specific run with executed step details
const { data: run } = await resend.automations.runs.get({
  automationId: 'aut_abc123',
  runId: 'run_def456',
});
// run.steps[].status, run.steps[].output, run.steps[].error
```

```typescript
const { data, error } = await resend.automations.stop('aut_abc123');
// data.status === 'disabled'
```

```typescript
const { data, error } = await resend.automations.duplicate('aut_abc123');
// data.id is the new automation's ID
// The copy starts disabled, named "<original name> (Copy)"
```

## Events

Events are named signals that trigger automations and track contact activity; they are the primary way to start an automation. Define an event with an optional schema, then send it for a contact.

| Operation | Node.js method | Notes |
|---|---|---|
| Create | `resend.events.create(params)` | Optional schema |
| Get | `resend.events.get(identifier)` | By ID (UUID) or event name |
| List | `resend.events.list(params?)` | Cursor-paginated |
| Update | `resend.events.update(params)` | Only `schema` can be updated |
| Delete | `resend.events.remove(identifier)` | By ID or event name |
| Send | `resend.events.send(params)` | Fire an event for a contact |

- **Schema:** optional, a flat key/type map; types `string`, `number`, `boolean`, `date`. Events without a schema accept any payload. Payload values should match the schema types.
- **Send needs exactly one of `contactId` or `email`,** never both and never neither. It returns `202 Accepted`; the event is processed asynchronously.
- **Only `schema` can be updated;** `null` clears it. To rename an event, delete and recreate it.
- **The `resend:` prefix is reserved** for system events.

```typescript
const { data, error } = await resend.events.create({
  name: 'order.completed',
  schema: {
    order_id: 'string',
    total: 'number',
    is_first_order: 'boolean',
    completed_at: 'date',
  },
});
```

```typescript
const { data, error } = await resend.events.send({
  event: 'order.completed',
  contactId: 'contact_abc123',
  payload: {
    order_id: 'ord_789',
    total: 99.99,
    is_first_order: true,
    completed_at: '2026-04-10T12:00:00Z',
  },
});
```

```typescript
// Update schema
const { data, error } = await resend.events.update({
  identifier: 'order.completed',
  schema: { order_id: 'string', total: 'number' },
});

// Clear schema
const { data, error } = await resend.events.update({
  identifier: 'order.completed',
  schema: null,
});

// Delete by name
const { data, error } = await resend.events.remove('order.completed');
```

- **CLI:** `resend events send --event <name>` with `--contact-id` or `--email` ([CLI-COMMANDS.md](CLI-COMMANDS.md#automations-and-events)).

## Common mistakes

| Mistake | Fix |
|---|---|
| Creating without a trigger step | Need at least one `type: "trigger"` step |
| Updating steps without connections (or the reverse) | Provide both |
| `ref` or `edges` (old naming) | Use `key` and `connections` |
| `template_id` in `send_email` config | Nested object `template: { id: "..." }` |
| `seconds` in `delay` config (old naming) | Use `duration` (`"30 minutes"`); `seconds` is no longer accepted |
| Forgetting to enable | Default is `disabled`; set `status: "enabled"` |
| Not checking `error` | The SDK returns `{ data, error }` |

## Prove it

- **`automations.get(id)` shows `status: 'enabled'`** and every connection's `from` and `to` match a step `key`.
- **Fire the trigger event for a test contact** with `resend.events.send`, then `automations.runs.list({ automationId, status: 'running,failed' })` shows the run, and `runs.get` shows each executed step's `status` with no `error`.
- **A `condition` branch takes the right path:** run it for one contact that meets the rule and one that doesn't, and each run's executed steps show the matching `send_email` step.
