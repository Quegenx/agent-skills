# Lists and capture

The pipeline runs from the email form through validation, double opt-in and a recorded consent, then a suppression check before every send, with bounces and complaints from webhooks feeding back into the suppression list and scheduled hygiene jobs. Laws and unsubscribe headers are in [COMPLIANCE.md](COMPLIANCE.md); the webhook handlers that feed suppression are in [RELIABILITY.md](RELIABILITY.md); Resend's own contacts and broadcasts are in [../resend/SKILL.md](../resend/SKILL.md).

**Contents:** [Capturing addresses](#capturing-addresses) · [Double opt-in](#double-opt-in) · [Consent checkboxes and forms](#consent-checkboxes-and-forms) · [Marketing emails](#marketing-emails) · [Suppression list](#suppression-list) · [Hygiene and re-engagement](#hygiene-and-re-engagement) · [Retention](#retention) · [Prove it](#prove-it)

## Capturing addresses

- **Client-side:** `<input type="email" required>`; validate on blur or after a short debounce; show clear errors; don't be too strict (allow unusual but valid formats). "Client-side validation ≠ deliverability."
- **Always validate server-side** (client-side can be bypassed): format (RFC 5322), the domain exists (DNS lookup), the domain has MX records, and optionally disposable-email detection. Recommended tools: https://resend.com/blog/best-email-verification-apis.
- **Input:** `type="email"` for the mobile keyboard; placeholder "you@example.com"; error "Please enter a valid email address", not "Invalid".
- **Invalid email:** a clear error, typo suggestions (`@gmial.com` to `@gmail.com`), and allow resubmitting.
- **Already registered:** for accounts, "This email is already registered. [Sign in]"; for marketing, "You're already subscribed! [Manage preferences]". Don't reveal whether an account exists (security).
- **Rate limiting:** verification emails at 3 per hour per address; rate-limit form submissions; use CAPTCHA sparingly if needed; monitor for abuse patterns.

## Double opt-in

- **Double opt-in confirms the address belongs to the user and is deliverable.** Flow: the user submits, you send a verification email with a unique link or token, the user clicks, you mark the address verified, then grant access or add it to the list (add to the list only after confirmation).
- **Timing:** send immediately; expire in 24 to 48 hours; allow a resend after 60 seconds; limit resends (3 per hour).

| | Single opt-in | Double opt-in |
|---|---|---|
| Process | Add to list immediately | Require email confirmation first |
| Pros | Lower friction, faster growth | Verified addresses, better engagement, "meets GDPR/CASL" |
| Cons | Higher invalid rate, lower engagement | Some users don't confirm |
| Use for | Account creation, transactional | Marketing lists, newsletters |

- **Use double opt-in for all marketing email.** It verifies deliverability, confirms intent, reduces complaints, and is required in some regions (Germany). Gmail and Yahoo both recommend confirmed (double) opt-in.
- **The verification email:** a clear purpose ("Verify your email address"), a prominent button, the expiration, a resend option, an "I didn't request this" notice. Don't put OTP or 2FA codes in the subject or preview text; it discourages opens. Design: mobile-friendly, a large tappable button, a clear call to action.

## Consent checkboxes and forms

- **Checkboxes are unchecked by default (required),** use specific language, are separate per email type, and link to the privacy policy. Examples:
  - "☐ Subscribe to our weekly newsletter with product updates"
  - "☐ Send me promotional offers and deals"
- **Never** pre-check boxes, use vague language, or hide consent in the terms.
- **Form layout:** simple and focused, one primary action, a clear value proposition, mobile-friendly, accessible (labels, ARIA).
- **What counts as explicit opt-in:** the user checks an unchecked box, clicks "Subscribe", or completes a form with clear intent. **What doesn't:** pre-checked boxes, an opt-out model, consent assumed from a purchase, purchased or rented lists. Gmail: don't buy lists, avoid pre-checked opt-in boxes.
- **Informed consent** discloses the email types, frequency, sender identity and how to unsubscribe. Right: "Subscribe to our weekly newsletter with product updates and tips". Wrong: "Sign up for emails".
- **Record the consent** (fields in [COMPLIANCE.md](COMPLIANCE.md#consent-records)).

## Marketing emails

- **Core:** consent first (explicit opt-in required, especially GDPR/CASL); value-driven (useful content, not just promotions); respect preferences (let users control frequency and content types).
- **Required in every marketing email:** clear sender identification, a physical mailing address (CAN-SPAM), an unsubscribe mechanism, and an indication that it is marketing (GDPR).
- **Unsubscribe:** prominent in every email; one-click preferred; immediately (GDPR) or within 10 days (CAN-SPAM), immediate preferred; free; no login. Headers are in [COMPLIANCE.md](COMPLIANCE.md#the-list-unsubscribe-headers).
- **Subject lines:** clear, specific, 50 characters or less for mobile; curiosity without misleading; A/B test. Right: "Your weekly digest: 5 productivity tips". Wrong: "You won't believe what happened!"
- **Structure:** above the fold, a value proposition, a primary call to action and an engaging visual; a scannable body (short paragraphs, bullets) with a clear hierarchy and multiple calls to action; a footer with unsubscribe, company info, physical address (CAN-SPAM) and social links.
- **Mobile-first:** single column, buttons at least 44x44px, text at least 16px; test on iOS, Android and in dark mode.
- **Segment** by behavior (purchases, activity), demographics, preferences, engagement level and signup source, for higher open and click rates, lower unsubscribes and a better experience.
- **Personalize** with name in the subject or greeting, location-specific content, behavior-based recommendations and purchase history, using only data you have permission to use; don't over-personalize (it can feel intrusive).
- **Frequency:** start conservative, increase with engagement, let users set preferences, monitor unsubscribe rates. Yahoo: honor the frequency the list promised.
- **Timing:** weekday mornings 9 to 11 AM local time, Tuesday to Thursday often best; test your own audience.
- **Watch:** bounce rate below 2%, complaint rate below 0.05% (the thresholds other sources give are in [DELIVERABILITY.md](DELIVERABILITY.md#reputation-and-thresholds)).

## Suppression list

| Reason | When to add | Can unsuppress? |
|---|---|---|
| Hard bounce | Immediately | No (address invalid) |
| Complaint | Immediately | No ("legal requirement") |
| Soft bounce (3x) | After the threshold | Yes, after 30 to 90 days |
| Manual removal | On request | Only if the user requests it |

- **Hard bounces and complaints suppress across all email types.** Unsubscribe is marketing-only: the user still gets password resets and order confirmations.
- **Keep transactional and marketing lists separate:** transactional for anyone with an account relationship, marketing only for opted-in users.
- **Check before every send.** Schema and helpers:

```typescript
// Suppression list schema
interface SuppressionEntry {
  email: string;
  reason: 'hard_bounce' | 'complaint' | 'unsubscribe' | 'soft_bounce' | 'manual';
  created_at: Date;
  source_email_id?: string; // Which email triggered this
}

// Check before every send
async function canSendTo(email: string): Promise<boolean> {
  const suppressed = await db.suppressions.findOne({ email });
  return !suppressed;
}

// Add to suppression list
async function suppressEmail(email: string, reason: string, sourceId?: string) {
  await db.suppressions.upsert({
    email: email.toLowerCase(),
    reason,
    created_at: new Date(),
    source_email_id: sourceId,
  });
}
```

  As written in the source, `canSendTo` doesn't lowercase the address while `suppressEmail` does, and the `reason` union lacks `'soft_bounce_limit'`, which the webhook handler in [RELIABILITY.md](RELIABILITY.md#handling-bounces-and-complaints) passes.

- **Skip suppressed addresses in the send path:**

```typescript
async function sendEmail(to: string, emailData: EmailData) {
  if (!await canSendTo(to)) {
    console.log(`Skipping suppressed email: ${to}`);
    return { skipped: true, reason: 'suppressed' };
  }

  return await resend.emails.send({ to, ...emailData });
}
```

- **Watch the list's growth:** the target is stable; alert on a sudden spike.

## Hygiene and re-engagement

| Event | When | Action |
|---|---|---|
| Hard bounces and complaints | Real time, via webhook | Suppress |
| Unsubscribes | Real time | Remove from marketing lists |
| Soft bounces | Daily | Suppress after 3 failures |
| Inactive subscribers | Monthly | Re-engagement campaign, then remove |

More: https://resend.com/docs/knowledge-base/audience-hygiene.

- **Remove immediately:** hard bounces, unsubscribes, complaints. Gmail also says auto-unsubscribe after multiple bounces.
- **Inactive** means no opens or clicks in 45 to 90 days. Send a "We miss you" or "Still interested?" email, wait 14 to 30 days, then remove non-responders from active lists. The source's job selects `getInactiveSubscribers(90)` and removes a subscriber when `daysSince(subscriber.reengagement_sent) > 30`.
- **Gmail:** periodically confirm recipients still want your mail, and consider unsubscribing people who never open.

## Retention

| Data | Keep | Why |
|---|---|---|
| Send attempts | 90 days | Debugging, analytics |
| Delivery status | 90 days | Compliance, reporting |
| Bounce and complaint events | 3 years | "Required for CASL" |
| Suppression list | Indefinitely | "Never delete" |
| Email content | 30 days | Storage costs |
| Consent records | 3 years after expiry | Legal requirement |

- **The daily cleanup job** deletes `emailLogs` older than `subDays(now, 90)` and `emailContent` older than `subDays(now, 30)`, and never deletes suppressions or consent records.

## Prove it

- Submitting a malformed address, a domain with no MX record, and an existing address each gives the documented message, and the existing-address case doesn't reveal whether an account exists.
- A marketing signup sends a verification email at once; the link expires within 24 to 48 hours; a fourth resend in one hour is refused.
- Consent checkboxes render unchecked, one per email type, with a privacy policy link.
- A send to an address on the suppression list returns `{ skipped: true, reason: 'suppressed' }`.
- An unsubscribed user receives no marketing mail but still receives a password reset.
- The cleanup job leaves the suppression list and consent records untouched.
- Every marketing email shows the sender, physical address, unsubscribe link and a marketing indication.
