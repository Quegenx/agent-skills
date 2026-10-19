# Email types

Every email is either transactional or marketing, and that choice decides the consent you need, whether it must carry one-click unsubscribe, which subdomain and list it goes from, and how it is written. Transactional mail is "everything that would leave you with a paper receipt in the real world: invoices, parking ticket, booking confirmation." Gmail adds: "Message recipients, not Google, determine the nature of the messages they receive." Consent and unsubscribe rules are in [COMPLIANCE.md](COMPLIANCE.md); marketing content is in [LISTS-AND-CAPTURE.md](LISTS-AND-CAPTURE.md#marketing-emails); building templates is in [react-email SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/react-email/SKILL.md).

**Contents:** [Transactional or marketing](#transactional-or-marketing) · [Keep the two apart](#keep-the-two-apart) · [Legal rules by type](#legal-rules-by-type) · [Which transactional emails an app needs](#which-transactional-emails-an-app-needs) · [What each transactional email contains](#what-each-transactional-email-contains) · [Designing transactional emails](#designing-transactional-emails) · [Prove it](#prove-it)

## Transactional or marketing

| | Transactional | Marketing |
|---|---|---|
| Definition | Facilitates or confirms a transaction the user initiated or expects, directly relates to an action the user took, or is a legal notice you must serve | Promotional, advertising or informational, not directly related to a specific transaction or legal requirement |
| Traits | User-initiated or expected; time-sensitive and actionable; required to complete an action; no promotional material or offers; can be sent without explicit opt-in (with limitations) | Promotional or informational; not time-sensitive to complete a transaction; needs explicit opt-in; must include unsubscribe; stricter compliance |
| Examples | Password reset links, order confirmations, account verification, OTP and 2FA codes, shipping notifications | Newsletters, abandoned cart, product announcements, promotional offers, company updates, educational content |
| Use it when | The user needs it to complete an action; it confirms a transaction or account change; it is security-related; it is expected from a user action; it is time-sensitive and actionable; it is a required compliance notification | Promoting products or services; newsletters and updates; educational content; feature or company news; not required for a transaction |

- **Subscription mail (Gmail's term)** is mail sent to a list recipients can unsubscribe from: promotional, marketing, newsletters, some notifications. Password resets, purchase receipts and OTPs are not subscription mail.
- **Feature announcements are marketing.** "General feature announcements are marketing emails. Only send as transactional if the change directly affects an active feature the user is using."
- **Don't send hybrids.** A newsletter with a small order-status update "isn't best practice and should be avoided." Keep transactional and marketing separate, and don't mix promotions into receipts (Gmail).
- **Welcome emails must not be promotional** when sent as transactional.

## Keep the two apart

- **Separate sending subdomains,** for example `t.example.com` for transactional and `m.example.com` for marketing. It protects transactional deliverability, gives different authentication domains and independent reputation, and makes compliance easier.
- **Separate addresses:** send subscription and non-subscription messages from different addresses (Gmail), and keep the same From: per category (`sales@`, `deals@`, `alert@`).
- **Separate lists:** transactional goes to anyone with an account relationship, marketing only to opted-in users (see [LISTS-AND-CAPTURE.md](LISTS-AND-CAPTURE.md#suppression-list)).
- **Choose an email service with** reliable transactional delivery, separate sending domains, a good API, webhooks for delivery events, and SPF, DKIM and DMARC setup.

## Legal rules by type

| Law | Transactional | Marketing |
|---|---|---|
| CAN-SPAM | Can be sent without opt-in; must relate to a transaction; cannot contain promotional content (with exceptions); must identify the sender and contact info | Opt-out mechanism required (not opt-in in the US); clear sender identification; physical mailing address; honor opt-out within 10 business days |
| GDPR | Legitimate interest or contract fulfillment; must be necessary for service delivery; no marketing content without consent | Explicit opt-in consent; state the purpose of data collection; easy unsubscribe; data protection requirements |
| CASL | Without consent if related to an ongoing business relationship; factual, not promotional | Express or implied consent; unsubscribe mechanism; identify the sender clearly |
| Gmail and Yahoo | One-click unsubscribe not required | One-click unsubscribe plus a visible body link |

## Which transactional emails an app needs

- **Essential for most apps:** email verification (required for account creation), password reset (required for account recovery), welcome email (good UX).

| App type | Essential | Optional |
|---|---|---|
| Authentication-focused | Verification, password reset, OTP/2FA, security alerts (new device, password change), account update notifications | Welcome (not promotional), account deletion confirmation |
| Newsletter or content | Verification, password reset, welcome (not promotional), subscription confirmation | OTP/2FA, account updates |
| E-commerce or marketplace | Verification, password reset, welcome, order confirmation, shipping notifications, invoice or receipt, payment failed | OTP/2FA, security alerts, subscription confirmations (recurring orders) |
| SaaS or subscription | Verification, password reset, welcome, OTP/2FA, security alerts, subscription confirmation, renewal notice, payment failed, invoice or receipt | Account updates, feature change notifications (breaking changes) |
| Financial or fintech | Verification, password reset, OTP/2FA (required for sensitive actions), security alerts (all types), account updates, transaction confirmations, invoice or receipt, payment failed | Welcome, compliance notices |
| Social or community | Verification, password reset, welcome, security alerts | OTP/2FA, account updates, activity notifications (mentions, replies) |
| Developer tools or API | Verification, password reset, OTP/2FA, security alerts, API key notifications (creation, expiration), subscription confirmation, payment failed | Welcome, usage alerts (approaching limits), feature change notifications |
| Healthcare (HIPAA) | Verification, password reset, OTP/2FA (required), security alerts (all types, detailed), account updates, appointment confirmations | Welcome, compliance notices |

- **Healthcare:** "Emails should contain minimal PHI and link to secure portals for sensitive information."

## What each transactional email contains

| Email | When | Contents |
|---|---|---|
| Email verification | Immediately (within seconds) after signup or an email change | A clear link or code; expiration (typically 24 to 48 hours); instructions; a security notice if the link is clicked by mistake; a resend option; a support link |
| OTP/2FA | Immediately, when the user requests a code | The code, large and easy to read; expiration (typically 5 to 10 minutes) shown prominently; security warnings and a warning about sharing codes; an "I didn't request this" link |
| Password reset | Immediately, when the user requests a reset | A reset link with token; expiration (typically 1 hour; the link expires quickly); security warnings; IP address and location if available; an "I didn't request this" link; never the old password |
| Security alert | Immediately, on security-relevant events (login from a new device, password change) | What happened, when, location or IP if available, what to do if suspicious, a link to security settings, a way to report suspicious activity |
| Welcome | Immediately after successful account creation and verification | A welcome message, key features or next steps, links to important resources, support contact; focused, not overwhelming, sets expectations about future emails; not promotional |
| Account update | Immediately after the user changes settings (email, password, profile) | What changed, when, what to do if unauthorized, an account settings link, a security notice, an easy way to revert if needed |
| Order confirmation | Immediately after the order (within minutes) | Order number, items and quantities, pricing breakdown, shipping address, estimated delivery date, tracking link if available; easy to print or save; customer service contact |
| Shipping notification | When the order ships, with tracking updates on major milestones | Order number, tracking number (prominent), carrier, expected delivery date, carrier tracking link, shipping address confirmation |
| Invoice or receipt | Immediately after payment is processed | Invoice or receipt number, amount, payment method, items or services, payment date, downloadable PDF if applicable, tax information if applicable |
| Subscription confirmation | Immediately when the user subscribes or changes the subscription | Plan details, billing amount and frequency (clearly stated terms), next billing date, payment method, manage link, easy cancellation, support contact |
| Renewal notice | Typically 3 to 7 days before renewal | Renewal date, amount to be charged, payment method on file, update-payment link, cancel link |
| Payment failed | Immediately when a subscription payment fails | What happened, amount, reason if available, steps to resolve, update-payment link, consequences if unresolved, support contact |
| Feature change (transactional) | Only when a feature the user is using changes significantly | What changed, how it affects the user, action needed if any, a link to more information or docs |

- **Follow-ups and lifecycle mail:** the emails source sends the renewal reminder "14 or 30 days typical" before renewal and follows a failed payment with reminders on days 3, 7 and 10 to 14 [coreyhaines31/marketingskills, emails]; those, and the marketing-side catalog (upgrades, usage reports, win-back, campaigns), are in [email-marketing LIFECYCLE-EMAILS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/email-marketing/LIFECYCLE-EMAILS.md); the dunning emails with their templates are in [churn-prevention DUNNING-COPY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/churn-prevention/DUNNING-COPY.md#the-four-emails).
- **Webinars:** the lead-magnets source sends "3 reminder emails (confirmation, day before, 1 hour before)" and the "replay link + summary + CTA within 24 hours" [coreyhaines31/marketingskills, lead-magnets]. It doesn't say whether these are transactional or marketing; classify each with the table above, and a CTA to buy makes it marketing.

## Designing transactional emails

- **Clarity over creativity; action-oriented; send immediately** (within seconds).
- **Subject lines name the action and the product, with identifiers** (order numbers, account names, expiration times):

| Good | Bad |
|---|---|
| Reset your password for [App] | Action required |
| Your order #12345 has shipped | Update on your order |
| Your 2FA code for [App] | Security code: 12345 |
| Verify your email for [App] | Verify your email |

- **Don't put OTP or 2FA codes in the subject line or preview text;** it discourages opens.
- **Pre-header:** reinforce the subject ("This link expires in 1 hour"), give urgency or context, preview the call to action; keep it under 90 characters.
- **Above the fold (first screen):** the purpose, the primary action button, the time-sensitive details (expiration). Order: header, primary message, details, action button, secondary info. Format: short paragraphs (2 to 3 sentences), bullet points, bold for emphasis, white space.
- **Mobile:** "60%+ emails are opened on mobile." Single column, stacked vertically; buttons at least 44x44px and full-width on mobile; body text at least 16px, headings 20 to 24px.
- **Sender settings:**

| Field | Set it to |
|---|---|
| From name | The app or company name, consistent |
| From email | A real address on the sending subdomain, for example `hello@mail.example.com` |
| Reply-To | A monitored inbox, for example `support@example.com` |

- **Avoid `noreply@`:** users reply to transactional emails. (The idempotency example in [RELIABILITY.md](RELIABILITY.md) still uses `noreply@example.com`.)
- **OTP codes:** 24 to 32px monospace, centered, clearly labeled, expiration nearby, copyable.
- **Buttons:** large and tappable, at least 44x44px, contrasting colors, clear action text ("Reset Password", "Verify Email"), HTTPS links only.
- **Resend option:** allow after 60 seconds, limit to 3 per hour, show a countdown timer.
- **Expired links:** a clear "expired" message, a new link, a support contact.
- **"I didn't request this":** in password resets, OTPs and security alerts; link to a security contact; log the clicks.

## Prove it

- Every planned email is labeled transactional or marketing, and none mixes promotion into a transactional message.
- Transactional mail goes from its own subdomain and From: address, separate from marketing.
- The app sends at least verification, password reset and welcome, plus the essentials in its row of the catalog table.
- Each transactional subject names the app and an identifier, and no code appears in a subject or preview text.
- Password reset links expire (typically 1 hour), OTPs in 5 to 10 minutes, verification links in 24 to 48 hours, and each has an "I didn't request this" link where the table lists one.
- Reply-To is a monitored inbox.
