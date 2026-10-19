# Limits and errors

Resend limits requests per second per team (shared by every key), emails per day or month by plan (sent and received both count), and sender reputation by bounce and complaint rates. Errors come back as `{ name, message, statusCode }`; retry classification is defined in [Retries](#retries), with exponential backoff and an idempotency key. Logs (`GET /logs`) show every API request with full bodies for 30 days, and `GET /usage` shows quota use.

**Contents:** [Rate limits](#rate-limits) · [Quotas](#quotas) · [Plan limits and retention](#plan-limits-and-retention) · [Reputation thresholds](#reputation-thresholds) · [Error codes](#error-codes) · [Common 401 and 403 causes](#common-401-and-403-causes) · [Retries](#retries) · [Email-practices retry source examples](#email-practices-retry-source-examples) · [What to retry](#what-to-retry) · [Backoff](#backoff) · [Error handling](#error-handling) · [Logs](#logs) · [Usage](#usage) · [Security facts](#security-facts) · [Prove it](#prove-it)

## Rate limits

- **10 requests per second per team, in the docs,** shared across all API keys and domains, with a per-second window and no burst allowance (an 11th request in the same second gets 429). The vendor skill says the default is 2 requests per second; the usage endpoint's sample response shows `"rate_limit": { "limit": 10, "duration": "1000ms" }`. Read your own limit from `resend.usage.get()` or https://resend.com/settings/usage.
- **Raising it:** possible for trusted senders on request; ask in advance of high volume.
- **Response headers** (IETF draft-ietf-httpapi-ratelimit-headers-06): `ratelimit-limit`, `ratelimit-remaining`, `ratelimit-reset` (seconds until reset), `retry-after` (seconds to wait).
- **Staying under it:** queue sends or reduce concurrent requests, throttle client-side from the headers, and use batch (one batch request counts as one request; [SENDING.md](SENDING.md#send-a-batch)).
- **SMTP shares the API's rate limit.**
- **Find 429s** at https://resend.com/logs?status=429.

## Quotas

- **Both sent and received emails count** (each received email is 1). Several `To`, `CC` or `BCC` recipients count as separate emails. Test emails count too.
- **Daily quota (Free plan only):** a UTC calendar day, reset at midnight UTC, not a rolling 24 hours. Paid sending plans have only a monthly quota.
- **Exceeding returns 429** with `daily_quota_exceeded` or `monthly_quota_exceeded`. `email.failed` webhook events carry reasons like `reached_daily_quota`.
- **Quota headers:** `x-resend-daily-quota` (used daily quota, sent only to Free plan users), `x-resend-monthly-quota` (used monthly quota).
- **Overage cap:** paid overages stop at 5x the monthly quota; sending then pauses until the next billing cycle (support can adjust it). Overage is not available on Free.
- **Contacts quota:** you can store more contacts than your plan allows, but can't send broadcasts until you upgrade or remove some: `403` `validation_error` "You have reached your contacts quota. Please upgrade your plan to send more emails."
- **Received email over quota:** its content can't be retrieved (403 `email_above_quota`).

## Plan limits and retention

| Limit | Free | Paid transactional (Pro, Scale, Enterprise) |
|---|---|---|
| Emails | 100 per day, 3,000 per month | No daily limit; monthly quota by tier |
| Marketing contacts | Up to 1,000 | By marketing tier |
| Verified domains | 3 | Pro 10, Scale 1,000 (plus a 100-domain add-on) |
| Inboxes | 3 | 3 included, more pay-as-you-go |

- **Automations:** 10,000 runs per month included; paid plans have overage.
- **Retention: 30 days on every plan** (Free, Pro, Scale) for email content and metadata, events, logs and metrics; flexible on Enterprise. Store webhook events yourself for longer ([WEBHOOKS.md](WEBHOOKS.md#store-the-events)).
- **Turning off message content storage** is an add-on via support, for Pro or Scale subscribers of at least 1 month with a domain that has an active website and more than 3,000 emails sent at under 5% bounce rate.
- **Enterprise** (1M+ emails a month): SLA, flexible retention, SSO, dedicated IP.

## Reputation thresholds

- **Bounce rate under 4%, spam complaint rate under 0.08%.** Exceeding them may pause sending temporarily. Monitor at https://resend.com/metrics, with `resend.emails.metrics()` (`bounce_rate`, `complaint_rate`; [SENDING.md](SENDING.md#metrics)) or webhooks.
- **Suppressed sends don't count toward the bounce rate.**
- **Audience hygiene (docs):** block bot sign-ups with CAPTCHA (Google reCAPTCHA, hCaptcha, Friendly Captcha); use double opt-in; check deliverability with a verification service (Emailable, ZeroBounce, Kickbox); limit non-transactional sends to recipients who opened or clicked in the past 6 months; sunset recipients unengaged for 6+ months; unsubscribe bounced and complaining recipients from webhooks, since Resend suppresses them but does not unsubscribe them.
- **List hygiene and warm-up:** [DOMAINS.md](DOMAINS.md#warm-up-and-dedicated-ips) and [email-practices SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/SKILL.md).

## Error codes

| `name` | Status | Meaning | Action |
|---|---|---|---|
| `invalid_idempotency_key` | 400 | Key must be 1 to 256 characters | Retry with a valid key or none |
| `validation_error` | 400 | Field errors (details in the message). Also "API key is invalid" on non-sending endpoints for a nonexistent or deleted key, and on every endpoint when the Authorization header isn't a valid key | Fix the request |
| `missing_api_key` | 401 | Missing API key | Add `Authorization: Bearer YOUR_API_KEY` |
| `restricted_api_key` | 401 | "This API key is restricted to only send emails." | Use a Full access key |
| `validation_error` | 401 | "API key is invalid": sending endpoints, for a key that doesn't exist, was deleted or isn't active | Check `RESEND_API_KEY` |
| `email_above_quota` | 403 | Received email content can't be retrieved: it was above quota when received | Upgrade |
| `invalid_permission` | 403 | "Access token is missing required scopes." (OAuth) | |
| `restricted_api_key` | 403 | "API key is not active" | |
| `suspended_api_key` | 403 | "This API key is suspended" | Contact support |
| `validation_error` | 403 | "You can only send testing emails to your own email address (...)" | Verify a domain and change `from` |
| `validation_error` | 403 | "The `domain.com` domain is not verified." | `from` must match a verified domain |
| `validation_error` | 403 | "The `example.com` domain has been registered already." | Check your account and teammates; claim it ([DOMAINS.md](DOMAINS.md#domain-claims)) |
| `validation_error` | 403 | Inbox plan limit reached | |
| `validation_error` | 403 | Contacts quota reached (broadcasts) | Upgrade or remove contacts |
| (none, code `1010`) | 403 | Missing `User-Agent` header, blocked before the API | Set a `User-Agent` |
| `not_found` | 404 | The endpoint does not exist | |
| `method_not_allowed` | 405 | | |
| `concurrent_idempotent_requests` | 409 | Another request with the same key is in progress | Retry later |
| `invalid_idempotent_request` | 409 | Key used with this method and endpoint in the last 24 hours with a different body | Change the key or the payload; don't retry as is |
| `resource_locked` | 409 | Another request is updating this resource | Retry after a short delay |
| `invalid_attachment` | 422 | Attachment needs `content` or `path` | |
| `invalid_parameter` | 422 | e.g. must be a valid UUID; also path params `.` or `..` | |
| `missing_required_field` | 422 | Body missing fields | |
| `missing_required_parameter` | 422 | Missing params | |
| `validation_error` | 422 | Pagination: invalid cursor, `limit` outside 1 to 100, or `before` with `after` | |
| `daily_quota_exceeded` | 429 | | Upgrade or wait for midnight UTC |
| `monthly_quota_exceeded` | 429 | | Upgrade |
| `rate_limit_exceeded` | 429 | "Too many requests..." | Read the headers, queue, reduce concurrency, back off |
| `application_error` | 500 | Unexpected error (also what the Node SDK returns for a non-JSON error body) | Retry later; check https://resend-status.com |
| `service_unavailable` | 503 | | Retry later |

- **The intro status table differs:** it lists 401 as "API key missing" and 403 as "API key invalid", while the errors page puts "API key is invalid" under `validation_error` 401 (sending) and 400 (other endpoints). Both are recorded above.
- **The vendor skill's table uses other names:** 401 `authentication_error` (check `RESEND_API_KEY`), 403 `authorization_error` (domain not verified), 422 `unprocessable_entity` (invalid email format or content), 500 `api_error`, and its batch retry example checks `idempotency_error` for the 409 conflict. The docs' table has none of these; its 500 is `application_error`. Confirm in the current docs.
- **Blocked test domains** (`@example.com`, `@test.com`) return `422 Unprocessable Entity`.
- **CLI errors** use code `auth_error` when no key is found ([CLI.md](CLI.md)).

## Common 401 and 403 causes

- **401 `restricted_api_key`:** a sending-only key on a non-sending endpoint (domains, contacts, receiving). Use a Full access key ([SETUP.md](SETUP.md#api-keys-and-permissions)).
- **403 from the `resend.dev` sandbox:** `onboarding@resend.dev` can only deliver to your own Resend account email. Verify your own domain.
- **403 domain mismatch:** `from` must exactly match a verified domain. With `send.acme.com` verified, sending from `user@acme.com` fails.
- **403 error `1010`:** the `User-Agent` header is missing (curl works because it sends one).
- **CORS errors:** you are calling the API from the browser. Send from the server.

## Retries

- **Classify by the error name and status:** retry rate-limit `429` after the response headers’ delay, `500 application_error`, `503 service_unavailable`, and transient network failures with the same idempotency key. A `409 concurrent_idempotent_requests` is safe to retry later; `409 resource_locked` needs a short delay. Do not retry `invalid_idempotent_request` unchanged. Fix other request/authentication errors first. The [official errors reference](https://resend.com/docs/api-reference/errors) supplies these distinctions.
- **A quota 429 is not a short rate-limit window:** `daily_quota_exceeded` waits until midnight UTC or an upgrade; monthly quota needs the quota reset or an upgrade. Follow [Quotas](#quotas).
- **Backoff convention retained from the vendor skill:** max 3 to 5 retries, 1 s, 2 s, 4 s, 8 s, 16 s (cumulative 1, 3, 7, 15, 31 s); respect `retry-after` seconds. The vendor/onboarding claim “only 429 and 500” is narrower than the specific official errors reference above; it is retained here as source history, not a second retry policy ([errors reference](https://resend.com/docs/api-reference/errors)).
- **The Node SDK has no retry logic** that a source search could find (not proof of absence); the vendor skill ships the helpers below.

Node error switch:

```typescript
if (error) {
  switch (error.name) {
    case 'validation_error':
      // Invalid parameters - don't retry, fix the data
      throw new Error(`Invalid email params: ${error.message}`);

    case 'rate_limit_exceeded':
      // Rate limited - safe to retry with backoff
      console.log('Rate limited, should retry with backoff');
      break;

    case 'api_error':
      // Server error - safe to retry
      console.log('Server error, should retry');
      break;

    case 'invalid_idempotent_request':
      // Idempotency conflict - don't retry with same key
      throw new Error('Duplicate request with different payload');

    default:
      console.error('Unexpected error:', error);
  }
  return;
}
```

The vendor skill's switch uses `api_error` for server errors; the docs name it `application_error` (see above).

Node retry helper, retained verbatim from the vendor skill. Its exclusion list retries more errors than the contract above and its key is optional; apply the canonical classification and reuse a key before adapting it:

```typescript
async function sendEmailWithRetry(
  params: Parameters<typeof resend.emails.send>[0],
  options: { maxRetries?: number; idempotencyKey?: string } = {}
) {
  const { maxRetries = 3, idempotencyKey } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const { data, error } = await resend.emails.send(
      params,
      idempotencyKey ? { idempotencyKey } : undefined
    );

    if (!error) {
      return data;
    }

    // Don't retry validation errors or idempotency conflicts
    if (error.name === 'validation_error' || error.name === 'invalid_idempotent_request') {
      throw new Error(`${error.name}: ${error.message}`);
    }

    // Last attempt failed
    if (attempt === maxRetries) {
      throw new Error(`Failed after ${maxRetries + 1} attempts: ${error.message}`);
    }

    // Exponential backoff: 1s, 2s, 4s...
    const delay = Math.pow(2, attempt) * 1000;
    console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
```

- **Batch retries** work the same way with `resend.batch.send(emails, { idempotencyKey })`; treat `validation_error` and `not_found` as non-retryable, and give each chunk of a large batch its own key ([SENDING.md](SENDING.md#send-a-batch)).

## Email-practices retry source examples

The source’s status-only tables below are historical generalizations; the named Resend exceptions and quota distinctions in [Retries](#retries) take precedence.

### What to retry

[resend/email-best-practices] Historical status-only classification; [Retries](#retries) owns named provider exceptions.

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


[resend/email-best-practices] These examples are retained verbatim. Their status-only predicates omit the retryable 409 names, treat quota 429 like rate limiting, and do not pass an idempotency key. They are source comparisons; [Retries](#retries) owns the active contract. The jitter convention is 1s, 2s, 4s, 8s, capped at 30,000 ms, up to 5 attempts.

### Backoff

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

### Error handling

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

## Logs

- **Every API request,** read-only: `GET /logs` and `GET /logs/{log_id}`; Node `resend.logs.list(params)` and `resend.logs.get(id)`. Logs are available only in the Node SDK and cURL so far. Kept 30 days.
- **List params:** `limit` (default 20, min 1, max 100), `after` and `before` (log IDs, mutually exclusive: both returns 422). Check `has_more`.
- **Fields:** `id`, `created_at`, `endpoint`, `method`, `response_status`, `user_agent` (e.g. `resend-node:6.0.3`); `get` adds `request_body` and `response_body`.
- **cURL needs a `User-Agent`** (e.g. `-H "User-Agent: curl"`); without it, 403.
- **Use logs for:** finding 429s, confirming a rotated key is in use (filter by key), auditing a leaked key, and debugging Better Auth or other library sends.

```typescript
const { data, error } = await resend.logs.list({ limit: 20 });

if (error) {
  console.error(error);
  return;
}

console.log(data.has_more); // true if more pages exist
for (const log of data.data) {
  console.log(`${log.method} ${log.endpoint} → ${log.response_status}`);
}

// Paginate forward
const { data: nextPage } = await resend.logs.list({
  limit: 20,
  after: data.data[data.data.length - 1].id,
});
```

## Usage

- **`GET /usage`,** no params; Node `resend.usage.get()`. One account snapshot: no list, ID or filters.

```json
{
  "object": "usage",
  "emails": {
    "daily": { "used": 258, "limit": null, "sent": 57, "received": 201, "resets_at": "2026-07-17T00:00:00.000Z" },
    "monthly": { "used": 5442, "limit": 10000, "sent": 1000, "received": 4442, "resets_at": "2026-08-01T00:00:00.000Z" }
  },
  "contacts": { "used": 85000, "limit": 150000 },
  "segments": { "used": 2, "limit": 3 },
  "broadcasts": { "used": 100, "limit": null },
  "ai_credits": { "used": 0, "limit": 500, "next_increase_at": "2026-07-18T09:00:00.000Z" },
  "automation_runs": { "used": 0, "limit": 1000, "resets_at": "2026-08-01T00:00:00.000Z" },
  "domains": { "used": 1, "limit": 1000 },
  "rate_limit": { "limit": 10, "duration": "1000ms" }
}
```

- **`used` = `sent` + `received`.**
- **Nullable limits:** `emails.daily.limit` (null means no daily cap), `segments.limit`, `ai_credits.limit` (null means unlimited), `domains.limit`. Always numbers: `emails.monthly.limit`, `contacts.limit`, `automation_runs.limit`. `broadcasts.limit` is always null (no plan cap). `ai_credits.next_increase_at` is null when none is scheduled.
- **`rate_limit` is the account default,** not per endpoint.

## Security facts

- **Resend:** SOC 2 Type II; GDPR (DPA at https://resend.com/legal/dpa); TLS 1.3+ in transit; encryption at rest; backups kept 7 days.
- **Logs keep no source IPs,** ASN, ISP, geo, HELO/EHLO or TLS metadata.

## Prove it

- **Retries are scoped:** a forced `validation_error` (e.g. missing `subject`) is not retried; a simulated 429 is retried with growing delays and the same idempotency key.
- **Headers are read:** a 429 handler logs `retry-after` or `ratelimit-reset`.
- **Throughput fits:** under load, https://resend.com/logs?status=429 shows no 429s, or the queue drains them.
- **Quota is watched:** `resend.usage.get()` shows `emails.monthly.used` below `limit`, and the daily figure for Free accounts.
- **Reputation is healthy:** `resend.emails.metrics()` reports `bounce_rate` under 4% and `complaint_rate` under 0.08%.
- **Logs explain failures:** for a failed send, `resend.logs.get(id)` shows the `request_body`, `response_status` and `response_body`.
