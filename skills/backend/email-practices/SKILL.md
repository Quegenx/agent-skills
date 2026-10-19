---
name: email-practices
description: "Gets an app's email delivered, lawful and dependable: SPF, DKIM and DMARC, the Gmail, Yahoo and Microsoft sender requirements with their dates, thresholds and error codes, reputation and warm-up, stop-loss rules, consent and the anti-spam laws (CAN-SPAM, GDPR, CASL, PECR, ePrivacy) including the rules for cold email, one-click unsubscribe (RFC 8058), transactional versus marketing and the transactional catalog, email capture and double opt-in, suppression and list hygiene, idempotent sends, retries and delivery webhooks, and accessible email markup. Use when building email features, checking whether a cold email is lawful, emails go to spam or bounce, setting up email authentication, adding signup or newsletter capture, checking compliance or unsubscribe, handling bounces and complaints, or reviewing an email's accessibility."
---

# Email practices

An email reaches the inbox when the sending domain is authenticated (SPF, DKIM and DMARC aligned with the From: domain), the recipients asked for it, and the sender's spam complaint rate stays low; Gmail, Yahoo and Microsoft now reject or spam-filter mail that misses those rules, and authentication problems are the most common cause of mail in spam. The pipeline this skill follows runs from the email form through validation, double opt-in and recorded consent, a suppression check, an idempotent send with retries, and webhook events (delivered, bounced, complained) that feed the suppression list and hygiene jobs. For Resend's SDK, domains, contacts, broadcasts and inboxes read [resend SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/resend/SKILL.md); for building templates read [react-email SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/react-email/SKILL.md). Sequence planning, lifecycle programs and campaign copy live in [email-marketing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/email-marketing/SKILL.md); writing cold outreach is in [cold-outreach SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cold-outreach/SKILL.md), and only its law lives here.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| SPF, DKIM, DMARC (RFC 7489 and RFC 9989 tags, alignment, rollout), Gmail, Yahoo and Outlook.com sender requirements with dates and thresholds, Gmail error codes, warm-up, bounce and complaint rates, stop-loss rules, PTR and TLS, display names, spam debugging, why opens mislead | [DELIVERABILITY.md](DELIVERABILITY.md) |
| CAN-SPAM, GDPR, CASL, PECR, TCPA and other laws, cold and unsolicited email (B2B scope, ePrivacy, GDPR Art. 14 and 21, CASL s.10(9), Germany, Australia), unsubscribe deadlines, `List-Unsubscribe` (RFC 2369), one-click (RFC 8058), what Gmail and Yahoo check, the unsubscribe endpoint, preference centers, consent records, retention, privacy policy | [COMPLIANCE.md](COMPLIANCE.md) |
| Transactional versus marketing, keeping them apart, legal rules by type, the transactional catalog by app type, what each email contains, subject lines, sender settings, OTP and button design | [EMAIL-TYPES.md](EMAIL-TYPES.md) |
| Capturing addresses, validation, double opt-in, consent checkboxes, the suppression list across channels, hygiene and re-engagement, retention periods | [LISTS-AND-CAPTURE.md](LISTS-AND-CAPTURE.md) |
| Idempotency keys, what to retry, backoff, error handling, a queue for critical mail, timeouts, delivery events, the webhook endpoint, bounce and complaint handlers, webhook retries | [RELIABILITY.md](RELIABILITY.md) |
| `lang` and `dir`, layout tables, headings, link text, alt text, the title tag, contrast and dark mode, plain text, React Email defaults, testing | [ACCESSIBILITY.md](ACCESSIBILITY.md) |

## The rules

1. **Authenticate before the first send:** SPF and DKIM passing, a DMARC record of at least `p=none` with `rua`, and the From: domain aligned with SPF or DKIM. Unauthenticated mail is rejected or spam-filtered.
2. **Keep transactional and marketing apart:** separate subdomains (`t.example.com`, `m.example.com`), addresses and lists, and never mix promotion into a transactional email.
3. **Send marketing only with explicit, recorded consent:** unchecked boxes, double opt-in, and a record of who, when, how and what. Never buy lists.
4. **Every marketing email carries one-click unsubscribe:** `List-Unsubscribe` with an HTTPS URL plus `List-Unsubscribe-Post: List-Unsubscribe=One-Click`, a visible body link, and the unsubscribe honored within 48 hours.
5. **Keep the spam complaint rate below 0.1% and never reach 0.3%;** suppress hard bounces and complaints immediately, across all email types, and never delete the suppression list.
6. **Check the suppression list before every send, and send with an idempotency key** derived from the business event; classify transient errors and quota waits using the provider’s retry contract, with backoff.
7. **Verify webhook signatures, acknowledge within 5 seconds and process each event once.**
8. **Cold email passes the law before it is written:** CAN-SPAM has no B2B exemption and needs the ad disclosure, postal address and opt-out; EU and UK individuals need consent or a lawful basis and, for addresses you didn't collect from them, the source and the right to object in the first message ([COMPLIANCE.md](COMPLIANCE.md#cold-and-unsolicited-email)).
9. **Route sequence planning and lifecycle copy to [email-marketing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/email-marketing/SKILL.md).**
10. **Apply the accessibility rules every time:** `alt` on every image, `lang` and `dir` on `<html>` and the body's children, `role="presentation"` on layout tables, descriptive link text, a `<title>`, 4.5:1 contrast, and a plain-text part.

## Prove it

Apply each check only to the selected work: DNS and spam-rate evidence for deliverability; one-click behavior for unsubscribe; suppression, duplicate sends and events for reliability; stop-loss for a campaign; disclosures for cold email. For an accessibility-only task, use ACCESSIBILITY.md. These checks do not require setting up unrelated email infrastructure.

`dig TXT` returns SPF, DKIM and DMARC records; Postmaster Tools shows a spam rate below 0.10%; a one-click POST to the unsubscribe URL returns `200` or `202` and stops that list's mail; a suppressed address is skipped; the same event sent twice produces one email; a test bounce and complaint land on the suppression list; a stop-loss trigger pauses a campaign by itself; a cold email shows the ad disclosure, postal address and opt-out; and every file's own Prove it checks pass for the parts you touched.
