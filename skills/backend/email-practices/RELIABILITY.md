# Reliability

Network issues, timeouts or server errors can leave you uncertain whether an email was sent. Derive an idempotency key from the business event, persist critical mail in a queue, and process delivery events once. Provider fields, retention windows, SDK options and payloads belong to the provider: [Resend](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/resend/SKILL.md), [OneSignal](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/onesignal/REST-API.md). General queue and worker mechanics are in [background-jobs](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/background-jobs/SKILL.md).

## Idempotency keys

Reuse one key for the same logical send; never generate a fresh random value or `Date.now()` on each retry. Generate a UUID once when there is no natural event key. Check the provider’s key scope and expiration: Resend’s 24-hour cache and both source request-option examples are in [resend SENDING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/resend/SENDING.md#idempotency-keys).

| Strategy | Example | When |
|---|---|---|
| Event-based (recommended) | `order-confirm-${orderId}` | One email per event |
| Request-scoped | `reset-${userId}-${resetRequestId}` | Retries within the same request |
| UUID | `crypto.randomUUID()` | No natural key: generate it once and reuse it on every retry |

- **If you retry the same logical send, the same key must be generated.** Avoid `Date.now()` or random values generated fresh on each attempt.

## What to retry

Classify the provider’s response before retrying. Transient network timeouts and DNS failures may be retried with the same key; fix invalid payloads, credentials and permissions first. Rate limits and quota exhaustion need different waits. Resend’s named 409, 429, 500 and 503 cases are maintained in [resend LIMITS-AND-ERRORS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/resend/LIMITS-AND-ERRORS.md#retries).

## Backoff

Use exponential backoff with jitter to avoid a thundering herd; honor provider retry headers and cap attempts. The source’s 1s, 2s, 4s, 8s convention, 30-second cap and five-attempt helper are preserved with its Resend classification limitations in [resend LIMITS-AND-ERRORS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/resend/LIMITS-AND-ERRORS.md#email-practices-retry-source-examples).

## Error handling

Queue retryable failures; log and alert on permanent failures, especially critical mail such as password resets. The Resend SDK response/error examples are maintained with the provider retry owner above.

## A queue for critical email

For critical emails, use a queue to ensure delivery even if the initial send fails. It survives application restarts, handles retries automatically, manages rate limits, and leaves an audit trail.

1. Write the email to a queue or database with `pending` status.
2. Process the queue and attempt the send.
3. On success, mark it `sent` and store the message ID.
4. On a retryable failure, increment the retry count and schedule a retry.
5. On a permanent failure, mark it `failed` and alert.

## Timeouts

Set a timeout to avoid hanging requests. The source recommends 10 to 30 seconds for email API calls; its Resend timeout snippet and the canonical request-options contract live in [resend SETUP.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/resend/SETUP.md#the-node-sdk-contract).

## Delivery events

Distinguish an API acceptance from delivery to the recipient’s server. Feed delivery status, bounces and complaints back into your data. Event names and payloads are owned by [Resend WEBHOOKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/resend/WEBHOOKS.md#event-types) or [OneSignal](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/onesignal/SKILL.md).

## The webhook endpoint

Verify signatures before processing, acknowledge quickly (the email-best-practices source says within five seconds), and process duplicates once using the provider’s documented delivery identity. Resend uses the `svix-id` header, not a JSON `event.id`; raw-body verification and the preserved conflicting source examples live in [resend WEBHOOKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/resend/WEBHOOKS.md#verify-the-signature).

## Handling bounces and complaints

Hard bounces and complaints cause immediate suppression and removal from active lists; the source suppresses after three soft bounces. Delivery updates the recorded status. [LISTS-AND-CAPTURE.md](LISTS-AND-CAPTURE.md#suppression-list) owns the business policy and helpers; [Resend WEBHOOKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/resend/WEBHOOKS.md#bounce-types) owns its payload mapping and the source’s flat-field expressions.

## Webhook retries

Persist work and handle retries safely; the provider owns retry timing and replay behavior. Resend’s current eight-attempt schedule and attributed older schedules live in [resend WEBHOOKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/resend/WEBHOOKS.md#retries-and-replays).

## Testing and storing events

Log raw events for debugging, alert on processing failures, and queue complex work. Resend’s tunnel, dashboard test-event and storage instructions live in [resend WEBHOOKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/resend/WEBHOOKS.md#local-development) and [Store the events](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/resend/WEBHOOKS.md#store-the-events).

## Prove it

- Sending the same business event twice produces one email within the provider’s idempotency window.
- Transient failures retry with growing delays and the same key; permanent failures are logged and alerted.
- A hanging send aborts within the configured 10 to 30 seconds.
- The webhook rejects a tampered signature and a repeated delivery changes no state the second time.
- A hard bounce, a complaint and the source’s three-soft-bounce threshold each update suppression.
