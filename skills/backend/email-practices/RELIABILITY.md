# Reliability

Production sending means every email goes out exactly once and failures are handled gracefully, and every bounce or complaint comes back into your data. Network issues, timeouts or server errors can leave you uncertain whether an email was sent, and retrying without idempotency risks duplicates; the fixes are an idempotency key derived from the business event and a webhook endpoint that acknowledges fast and processes each event once. The examples use the Resend Node SDK because the source does; full SDK and webhook setup (signature verification, registering endpoints, receiving) is in [../resend/SKILL.md](../resend/SKILL.md). Queues and retries in general are the `background-jobs` skill.

**Contents:** [Idempotency keys](#idempotency-keys) · [What to retry](#what-to-retry) · [Backoff](#backoff) · [Error handling](#error-handling) · [A queue for critical email](#a-queue-for-critical-email) · [Timeouts](#timeouts) · [Delivery events](#delivery-events) · [The webhook endpoint](#the-webhook-endpoint) · [Handling bounces and complaints](#handling-bounces-and-complaints) · [Webhook retries](#webhook-retries) · [Testing and storing events](#testing-and-storing-events) · [Prove it](#prove-it)

## Idempotency keys

- **Send a unique key with each request.** If the same key is sent again, the server returns the original response instead of sending another email. Derive the key from the business event, not from the attempt:

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

  (The `from` here is the source's; [EMAIL-TYPES.md](EMAIL-TYPES.md#designing-transactional-emails) says to avoid `noreply@` on transactional mail.)

| Strategy | Example | When |
|---|---|---|
| Event-based (recommended) | `order-confirm-${orderId}` | One email per event |
| Request-scoped | `reset-${userId}-${resetRequestId}` | Retries within the same request |
| UUID | `crypto.randomUUID()` | No natural key: generate it once and reuse it on every retry |

- **If you retry the same logical send, the same key must be generated.** Avoid `Date.now()` or random values generated fresh on each attempt.
- **Keys are typically cached for 24 hours.** Retries within this window return the original response; after expiration the same key triggers a new send, so complete your retry logic well within 24 hours.

## What to retry

| Failure | Retry? |
|---|---|
| 5xx (server error) | Yes: transient, likely to resolve |
| 429 (rate limit) | Yes: wait for the rate-limit window |
| 4xx (client error) | No: fix the request first |
| Network timeout | Yes: transient |
| DNS failure | Yes: may be transient |

| Code | Meaning | Action |
|---|---|---|
| 400 | Bad request | Fix payload (invalid email, missing field) |
| 401 | Unauthorized | Check API key |
| 403 | Forbidden | Check permissions, domain verification |
| 404 | Not found | Check endpoint URL |
| 422 | Validation error | Fix request data |
| 429 | Rate limited | Back off, retry after delay |
| 500 | Server error | Retry with backoff |
| 503 | Service unavailable | Retry with backoff |

## Backoff

- **Exponential backoff with jitter** (to prevent a thundering herd): 1s, 2s, 4s, 8s, capped at 30000 ms, up to 5 attempts:

```typescript
async function sendWithRetry(emailData, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { data, error } = await resend.emails.send(emailData);
    if (!error) {
      return data;
    }
    if (!isRetryable(error) || attempt === maxRetries - 1) {
      throw error;
    }
    const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
    await sleep(delay + Math.random() * 1000); // Add jitter
  }
}

function isRetryable(error) {
  return error.statusCode >= 500 ||
         error.statusCode === 429;
}
```

## Error handling

- **Queue retryable failures; log and alert on the rest,** especially critical mail like password resets:

```typescript
const { data, error } = await resend.emails.send(emailData);

if (error) {
  if (error.statusCode === 429) {
    await queueForRetry(emailData, error.retryAfter);
  } else if (error.statusCode >= 500) {
    await queueForRetry(emailData);
  } else {
    await logFailure(error, emailData);
    await alertOnCriticalEmail(emailData); // For password resets, etc.
  }
} else {
  await logSuccess(data.id, emailData);
}
```

## A queue for critical email

For critical emails, use a queue to ensure delivery even if the initial send fails. It survives application restarts, handles retries automatically, manages rate limits, and leaves an audit trail.

1. Write the email to a queue or database with `pending` status.
2. Process the queue and attempt the send.
3. On success, mark it `sent` and store the message ID.
4. On a retryable failure, increment the retry count and schedule a retry.
5. On a permanent failure, mark it `failed` and alert.

## Timeouts

- **Set timeouts to avoid hanging requests.** The source's snippet, verbatim:

```typescript
const signal = new AbortSignal.timeout(10000);

await resend.emails.send(emailData, { signal });
```

- **Recommended:** 10 to 30 seconds for email API calls.

## Delivery events

| Event | Meaning |
|---|---|
| `email.sent` | Accepted by Resend (confirms the send started) |
| `email.delivered` | Delivered to the recipient's server |
| `email.bounced` | Hard or soft bounce (list hygiene, alerting) |
| `email.complained` | Marked as spam: unsubscribe immediately |
| `email.opened` | Opened (engagement tracking) |
| `email.clicked` | Link clicked (engagement tracking) |

- **Register the endpoint** in the Resend dashboard or through the API.

## The webhook endpoint

- **Accept POST, return 2xx quickly (within 5 seconds), and handle duplicates.** Acknowledge first, then process:

```typescript
app.post('/webhooks/resend', async (req, res) => {
  // Return 200 immediately to acknowledge receipt
  res.status(200).send('OK');

  // Process asynchronously
  processWebhookAsync(req.body).catch(console.error);
});
```

- **Always verify webhook signatures** to prevent spoofing. The email-best-practices example, verbatim:

```typescript
import { Webhook } from 'svix';

const webhook = new Webhook(process.env.RESEND_WEBHOOK_SECRET);

app.post('/webhooks/resend', (req, res) => {
  try {
    const payload = webhook.verify(
      JSON.stringify(req.body),
      {
        'svix-id': req.headers['svix-id'],
        'svix-timestamp': req.headers['svix-timestamp'],
        'svix-signature': req.headers['svix-signature'],
      }
    );
    // Process verified payload
  } catch (err) {
    return res.status(400).send('Invalid signature');
  }
});
```

- **Conflict on the body you verify:** the example above verifies `JSON.stringify(req.body)`, a re-stringified parsed body. The Resend agent-email-inbox reference says verification "is sensitive to the exact bytes: if your framework parses and re-stringifies the JSON before you verify, the signature check will fail", requires the raw body (`req.text()` in the Next.js App Router, `express.raw({ type: 'application/json' })` in Express), and lists `express.json()` on the webhook route as a common mistake. Confirm in the current docs; the raw-body form is in [../resend/SKILL.md](../resend/SKILL.md).
- **Webhooks may be sent multiple times. Process each event once,** keyed by `event.id`: if `isEventProcessed(eventId)`, skip; otherwise `handleEvent`, then `markEventProcessed`.
- **Also:** return 200 quickly and process asynchronously to avoid timeouts; log everything (store raw events for debugging); alert on webhook processing failures; and use a job queue for complex handling.

## Handling bounces and complaints

- **Bounce:** read `const { email_id, email, bounce_type } = event.data;`. On a hard bounce, `suppressEmail(email, 'hard_bounce')` and `removeFromAllLists(email)`. On a soft bounce, `incrementSoftBounce`, and when `count >= 3`, `suppressEmail(email, 'soft_bounce_limit')`.
- **Complaint:** "Immediate suppression - no exceptions": `suppressEmail(email, 'complaint')`, `removeFromAllLists`, `logComplaint(event)`.
- **Delivered:** `updateEmailStatus(email_id, 'delivered')`.
- **Suppression helpers and rules** are in [LISTS-AND-CAPTURE.md](LISTS-AND-CAPTURE.md#suppression-list).

## Webhook retries

- **A non-2xx response makes Resend retry with exponential backoff.** The two Resend sources give different schedules; confirm in the current docs:

| email-best-practices | agent-email-inbox reference |
|---|---|
| Retry 1 after about 30 seconds | Attempt 1 immediately |
| Retry 2 after about 1 minute | Attempt 2 after 5 seconds |
| Retry 3 after about 5 minutes | Attempt 3 after 5 minutes |
| Continues for about 24 hours | Then after 30 minutes, 2 hours, 5 hours and 10 hours (7 attempts) |

## Testing and storing events

- **Local testing:** use ngrok or similar to expose localhost (`ngrok http 3000`, then use the ngrok URL as the webhook endpoint); send test events from the Resend dashboard or trigger each event type manually.
- **Storing webhook data:** https://github.com/resend/resend-webhooks-ingester and https://resend.com/docs/dashboard/webhooks/how-to-store-webhooks-data.

## Prove it

- Sending the same business event twice with the same idempotency key produces one email.
- A forced 500 or 429 is retried with growing delays capped at 30 seconds; a 400 or 422 is not retried and is logged.
- A send that hangs aborts within 10 to 30 seconds.
- The webhook endpoint answers 2xx within 5 seconds, rejects a tampered signature, and processing the same `event.id` twice changes nothing the second time.
- A test hard bounce and a test complaint each put the address on the suppression list and remove it from all lists; three soft bounces do the same.
