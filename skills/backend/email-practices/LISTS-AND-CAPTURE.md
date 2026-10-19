# Lists and capture

The pipeline runs from the email form through validation, double opt-in and a recorded consent, then a suppression check before every send, with bounces and complaints from webhooks feeding back into the suppression list and scheduled hygiene jobs. Laws and unsubscribe headers are in [COMPLIANCE.md](COMPLIANCE.md); the webhook handlers that feed suppression are in [RELIABILITY.md](RELIABILITY.md); Resend's own contacts and broadcasts are in [resend SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/resend/SKILL.md).

**Contents:** [Capturing addresses](#capturing-addresses) · [Double opt-in](#double-opt-in) · [Consent checkboxes and forms](#consent-checkboxes-and-forms) · [Marketing emails](#marketing-emails) · [Suppression list](#suppression-list) · [Hygiene and re-engagement](#hygiene-and-re-engagement) · [Retention](#retention) · [Prove it](#prove-it)

## Capturing addresses

- **Client-side:** `<input type="email" required>`; validate on blur or after a short debounce; show clear errors; don't be too strict (allow unusual but valid formats). "Client-side validation ≠ deliverability."
- **Always validate server-side** (client-side can be bypassed): format (RFC 5322), the domain exists (DNS lookup), the domain has MX records, and optionally disposable-email detection. Recommended tools: https://resend.com/blog/best-email-verification-apis.
- **Input:** `type="email"` for the mobile keyboard; placeholder "you@example.com"; error "Please enter a valid email address", not "Invalid".
- **Invalid email:** a clear error, typo suggestions (`@gmial.com` to `@gmail.com`), and allow resubmitting.
- **Already registered:** for accounts, don't reveal whether an account exists: answer a sign-up with an existing address the same way as a new one. The line said both "This email is already registered. [Sign in]" and "Don't reveal whether an account exists (security)"; the security rule wins ([secure-coding CATALOG.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/secure-coding/CATALOG.md#lookups-and-errors): "Return the same status and message for both"). Supabase returns "an obfuscated fake user" for an existing confirmed user only when both Confirm email and Confirm phone are on, and `User already registered` otherwise ([supabase AUTH-SIGN-IN.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/supabase/AUTH-SIGN-IN.md#email-and-password)). For marketing, "You're already subscribed! [Manage preferences]". The owner's app-ui does this instead: "map the provider's codes to the app's messages (invalid credentials, an existing user or email, ...)" ([app-ui AUTH.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/AUTH.md)).
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
- **Never** pre-check boxes, use vague language, or hide consent in the terms. The FTC lists "Preselection" as a dark pattern, with "the accept tracking cookies box is pre-checked" as its example (Bringing Dark Patterns to Light, 2022, p. 25, https://www.ftc.gov/system/files/ftc_gov/pdf/P214800%20Dark%20Patterns%20Report%209.14.2022%20-%20FINAL.pdf); GDPR Recital 32: "Silence, pre-ticked boxes or inactivity should not therefore constitute consent" (https://gdpr-info.eu/recitals/no-32/).
- **Don't make the thing they asked for depend on marketing consent:** a download or quiz result is delivered to the address; joining the marketing list takes its own unchecked box (GDPR Art. 7(4), in [COMPLIANCE.md](COMPLIANCE.md#the-laws)), and the address joins only after the double opt-in click; the email that delivers the file can carry that confirmation [coreyhaines31/marketingskills, lead-magnets]. The thank-you page confirms delivery ("Check your inbox") and offers one next step. Gating, delivery and thank-you pages for lead magnets are in [lead-magnets GATING-AND-DELIVERY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/lead-magnets/GATING-AND-DELIVERY.md); tag each subscriber with the magnet or form that brought them, so quality can be judged per source.
- **Form layout:** simple and focused, one primary action, a clear value proposition, mobile-friendly, accessible (labels, ARIA).
- **Ask for the minimum needed** [coreyhaines31/marketingskills, lead-magnets]: email only for the lowest friction, add a name for personalization, company or role for lead qualification, and multi-field forms "only for high-value offers (webinars, demos)". Capture the email now and ask for more later (progressive profiling), and remove fields the follow-up never uses. The source's "Every extra field reduces conversion by 5-10%" is its own heuristic. The field ladder is in [lead-magnets GATING-AND-DELIVERY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/lead-magnets/GATING-AND-DELIVERY.md#what-to-ask-for).
- **What counts as explicit opt-in:** the user checks an unchecked box, clicks "Subscribe", or completes a form with clear intent. **What doesn't:** pre-checked boxes, an opt-out model, consent assumed from a purchase, purchased or rented lists. Gmail: don't buy lists, avoid pre-checked opt-in boxes.
- **Informed consent** discloses the email types, frequency, sender identity and how to unsubscribe. Right: "Subscribe to our weekly newsletter with product updates and tips". Wrong: "Sign up for emails". "No spam. Unsubscribe anytime." [coreyhaines31/marketingskills, lead-magnets] discloses neither type nor frequency: keep the unsubscribe line and add both.
- **Record the consent** (fields in [COMPLIANCE.md](COMPLIANCE.md#consent-records)).

## Marketing emails

- **Sequences and lifecycle mail** (welcome, nurture, onboarding, re-engagement, billing and win-back), with their timing, exit conditions and copy, are in [email-marketing SEQUENCES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/email-marketing/SEQUENCES.md) and [email-marketing LIFECYCLE-EMAILS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/email-marketing/LIFECYCLE-EMAILS.md). The rules below apply to all of them.
- **Core:** consent first (explicit opt-in required, especially GDPR/CASL); value-driven (useful content, not just promotions); respect preferences (let users control frequency and content types).
- **Required in every marketing email:** clear sender identification, a physical mailing address (CAN-SPAM), an unsubscribe mechanism, and an indication that it is marketing (GDPR).
- **Unsubscribe:** prominent in every email; one-click preferred; immediately (GDPR) or within 10 days (CAN-SPAM), immediate preferred; free; no login. Headers are in [COMPLIANCE.md](COMPLIANCE.md#the-list-unsubscribe-headers).
- **Campaign copy, segmentation, personalization, frequency and timing:** [email-marketing SEQUENCES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/email-marketing/SEQUENCES.md#campaign-copy-conventions).
- **Watch:** bounce rate below 2%, complaint rate below 0.05% (the thresholds other sources give are in [DELIVERABILITY.md](DELIVERABILITY.md#reputation-and-thresholds)).

## Suppression list

| Reason | When to add | Can unsuppress? |
|---|---|---|
| Hard bounce | Immediately | No (address invalid) |
| Complaint | Immediately | No ("legal requirement") |
| Soft bounce (3x) | After the threshold | Yes, after 30 to 90 days |
| Manual removal | On request | Only if the user requests it |

- **Hard bounces and complaints suppress across all email types.** Unsubscribe is marketing-only: the user still gets password resets and order confirmations.
- **Across channels:** an opt-out on email, LinkedIn, phone or SMS removes the person from every outreach channel, so key the list on email, LinkedIn URL and phone [coreyhaines31/marketingskills, prospecting], and mirror it to the CRM and every tool that sends [coreyhaines31/marketingskills, revops]. The CRM's outbound "Suppressed" stage ("Opted out, bounced, hostile, customer, or competitor") has the exit "Never (unless they opt back in)" ([revops PIPELINE-AND-METRICS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/revops/PIPELINE-AND-METRICS.md)). For outbound, the source also suppresses current customers and open deals, competitors and partners, "not interested" replies for a cooldown, and do-not-contact and deletion requests ([prospecting ENRICHMENT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/ENRICHMENT.md#suppression-list)).
- **Lists you didn't collect yourself** (bought data is never used; enriched or event lists) are verified right before they reach a sequence: result by result actions and re-verification timing are in [prospecting ENRICHMENT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/ENRICHMENT.md#verification). Never send to guessed addresses to see what bounces; a source suggested "just guess and bounce-check" [coreyhaines31/marketingskills, public-relations], and hard bounces cost reputation ([DELIVERABILITY.md](DELIVERABILITY.md#bounces-and-complaints)).
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

  As written in the source, `canSendTo` doesn't lowercase the address while `suppressEmail` does, and the `reason` union lacks `'soft_bounce_limit'`, which the preserved source webhook handler in [resend WEBHOOKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/resend/WEBHOOKS.md#handling-bounces-and-complaints) passes.

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
- **Inactive** means no opens or clicks in 45 to 90 days (the emails source starts re-engagement after "30-60 days of inactivity", and its eval uses 90; its four-email version is in [email-marketing SEQUENCES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/email-marketing/SEQUENCES.md#re-engagement)). Opens are a weak signal: Apple Mail Privacy Protection "prevents senders from seeing if you've opened the email message they sent you" (https://support.apple.com/guide/iphone/use-mail-privacy-protection-iphf084865c7/ios), so judge inactivity on clicks and product activity where you can. Send a "We miss you" or "Still interested?" email, wait 14 to 30 days, then remove non-responders from active lists. A CRM rule like "Archive contacts with no activity in 12+ months" [coreyhaines31/marketingskills, revops] is about CRM records, not the mailing list; both hold. The source's job selects `getInactiveSubscribers(90)` and removes a subscriber when `daysSince(subscriber.reengagement_sent) > 30`.
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
- Signing up with an existing account's address returns the same response as a new address.
- A lead magnet downloads with the marketing box unchecked, and the address joins no marketing list.
- An opt-out recorded on one channel blocks the next send on every other channel.
