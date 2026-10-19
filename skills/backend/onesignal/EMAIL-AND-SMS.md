# Email and SMS

Sending email and SMS/MMS/RCS through OneSignal: sender and DNS setup, warm-up, the thresholds that decide inbox placement, unsubscribes and suppression, and the consent rules carriers and regulators enforce. For email, inbox placement is decided by authentication (SPF, DKIM, DMARC on a subdomain), by a gradual warm-up and by staying under the bounce and spam-complaint limits. For SMS, everything rests on provable consent per program and on a dedicated sender per program type, because STOP to a shared sender opts the user out of everything from it. General email deliverability, compliance and list hygiene (not OneSignal-specific) are in [email-practices SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/SKILL.md). Journeys (the recommended path for transactional sends and quiet hours) are in [JOURNEYS.md](JOURNEYS.md); Liquid and Data Feeds in [PERSONALIZATION.md](PERSONALIZATION.md). Provider-neutral SMS and WhatsApp marketing (TCPA and CTIA rules, 10DLC throughput, sequences) is in [sms-marketing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sms-marketing/SKILL.md).

**Contents:** [Email setup and senders](#email-setup-and-senders) · [Email DNS](#email-dns) · [Deliverability thresholds](#deliverability-thresholds) · [Warm-up](#warm-up) · [Reputation practices](#reputation-practices) · [Sending email](#sending-email) · [Unsubscribe and suppression](#unsubscribe-and-suppression) · [Address validation](#address-validation) · [HTML email](#html-email) · [Email compliance](#email-compliance) · [SMS model and setup](#sms-model-and-setup) · [SMS registration](#sms-registration) · [SMS consent](#sms-consent) · [Keywords and opt-out](#keywords-and-opt-out) · [Composing SMS, MMS, RCS](#composing-sms-mms-rcs) · [SMS compliance](#sms-compliance) · [Prove it](#prove-it)

## Email setup and senders

- **Setup takes about 10 to 30 minutes** at **Settings > Set up Email**: OneSignal Email, or SendGrid, Mailgun or Mailchimp Transactional (Mandrill). Multiple senders, suppression list management and custom sending domains only work with OneSignal Email. Third-party ESP users manage senders (and suppression) in the ESP.
- **Free mailbox domains** (Gmail, Outlook) are not supported as sending domains.
- **A sender** is a default sender email, name, reply-to and sending domain (taken from the email; **Customize** for a subdomain).
- **Use a subdomain, never the root domain** (e.g. `mail.yourdomain.com`), and a separate subdomain per stream and per compliance regime. Sources disagree on labels: the email setup page uses `mail.` for marketing and `receipts.` for transactional; the senders page uses `mail.` for transactional and `info.` for marketing (and also `mail.` marketing vs `notify.` transactional). Both say separate subdomains per stream; confirm the labels in the current docs.
- **Verify Account** reviews domain health, reputation and blocklists, usually in minutes; if denied, retry in a week. Before approval you can only send test emails to your own addresses.
- **Limits:** up to 100 senders; each sender has one sending domain, with multiple from addresses on that domain. The default sender can't be deactivated; deactivating another sender moves its templates and scheduled sends (including warm-ups) to the default.

## Email DNS

| Record | Purpose | Rule |
|---|---|---|
| TXT | SPF | One SPF record only: append includes, e.g. `v=spf1 include:spf.onesignal.email include:mailgun.org include:your-other-spf-records ~all`; minimal OneSignal-only `v=spf1 include:spf.onesignal.email ~all` |
| TXT | DMARC | OneSignal uses `v=DMARC1; p=none;`. Don't add a duplicate; an existing one must be that or stricter (`p=quarantine`, `p=reject`). Mailbox-provider scope is owned by [email-practices DELIVERABILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/DELIVERABILITY.md#sender-requirements-by-mailbox-provider); Yahoo publishes no numeric bulk threshold |
| CNAME | DKIM | Two records required: one active, one secondary for rotation |
| CNAME | Open and click tracking | Can be omitted on a no-tracking sender (this disables opens and clicks for it) |
| MX | | Priority `10`. Don't overwrite an existing MX (e.g. Gmail); a warning on an MX pointing elsewhere is acceptable |

- **Auto-Configure** sets the records for supported registrars.
- **Cloudflare:** set the CNAME Proxy to "DNS only" and Flattening to "Off".
- **Propagation:** the DNS page says verification takes minutes, up to 48 hours (check with whatsmydns.net); the troubleshooting page says allow up to 24 hours.
- **SPF "too many DNS lookups":** OneSignal uses Mailgun under the hood, so you can simplify to `v=spf1 include:mailgun.org ~all`.
- **Sending and receiving on one domain:** they can't share MX. Keep the sending DNS with OneSignal and point MX to the inbound provider.
- **Apple Private Relay** (`@privaterelay.appleid.com`) requires domain verification in your Apple Developer account.
- **Throughput** to the ESP is 1,000 to 5,000 per second.

## Deliverability thresholds

| Threshold | Value |
|---|---|
| Warm-up needed from a new or cold domain | about **2,000+ emails/day** |
| Gmail bulk sender (permanent classification) | **5,000+/day to Gmail**; Yahoo has no published numeric threshold ([email-practices DELIVERABILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/DELIVERABILITY.md#yahoo-and-aol)) |
| OneSignal Acceptable Use Policy bounces | < **5%** |
| OneSignal Acceptable Use Policy spam complaints | < **0.08%** |
| Google spam rate | < **0.10%**, never **0.30%** |
| Gmail/Yahoo bulk spam rate | < **0.3%** |

- **Bulk sender requirements:** SPF and DKIM (all senders), aligned DMARC and one-click unsubscribe (bulk), spam rate < 0.3%, PTR/FCrDNS, TLS, RFC 5322. OneSignal handles PTR, TLS and formatting.
- **The reported spam rate excludes Gmail and Apple** (they have no feedback loops; Yahoo and Outlook do). Connect Google Postmaster Tools: verify the domain and add `mailmonitor@onesignal.com` as a managed user. Monitor **Settings > Email > Reputation** and **Messages > Email > Deliverability insights**.
- **Bounced vs Failed:** Bounced is a permanent invalid address and goes to the suppression list. Failed is not suppressed and may retry: Too old (after the 8-hour retry window), mailbox full, DNS or domain problems, provider policy, auth failure. `602 (too old)` errors mean the volume is too high.
- **Spam traps** (pristine, recycled, typo): prevent with double opt-in and sunsetting.
- **Apple Mail Privacy Protection over-reports opens;** prefer clicks.

## Warm-up

- **Warm up when:** sending >2,000/day, new to OneSignal Email, a new domain or subdomain, volume up >20%, or no high volume in the last 30 days. Shared IPs are pre-warmed; each subdomain is warmed separately. Warm-up typically takes 2 to 4 weeks.
- **Audience while warming:** opened or clicked in the last 30 days, a session in the last 60 days, a meaningful action in the last 90 days; exclude anyone unengaged 90+ days.
- **Ramp** about 20% per day (30% with a strong reputation) from a 300/day baseline: 50,000 in 29 days, 1,000,000 in 46. Stop scaling on spam spikes; at hard bounces > 2%, pause and clean the list.
- **Auto Warm Up (recommended):** **Send with Auto Warm Up**. By default it starts the next day at 9am; the schedule uses the last 3 weeks of data; it can't be edited after it starts. API: `kind: "warmup"`, `email_warm_up.stages`, `email_warm_up.strategy` `"recommended"` (default) | `"custom"`.
- **Dedicated IP** above about 100,000 emails/month.

## Reputation practices

- **Watch spam reports more than opens and clicks.**
- **Explicit opt-in checkbox.** Collecting the email as part of sign-up or account creation is not enough. Tag `opt_in_consent: false` to exclude those who did not opt in; use double opt-in and a preference center.
- **Sunset** recipients with no opens or clicks in 2 to 3 months, and target engaged recipients.
- **Control frequency:** daily emails may be too much for most audiences.
- **A valid reply-to;** avoid "no-reply".
- **Content red flags:** all caps, exclamation marks, URL shorteners, image-heavy layouts, spam phrases, link text that doesn't match the link.

## Sending email

- **Intelligent Delivery for email** is based on open and click activity (excluding bot activity). Schedule up to 30 days ahead.
- **API fields:** `email_from_address`, `email_sender_domain`, `email_reply_to_address`, `email_subject`, `email_preheader`, `disable_email_click_tracking`, `include_unsubscribed`.
- **`include_unsubscribed` is only for compliance and non-marketing mail.** Using it for marketing violates anti-spam regulations. Transactional emails need no unsubscribe link; never send marketing content as transactional.

```json
{
  "app_id": "YOUR_ONESIGNAL_APP_ID",
  "include_email_tokens": ["email1@address.com", "email2@address.com"],
  "email_subject": "Your Email Subject",
  "template_id": "e59b3a5e-ccc4-44ff-b39e-aa4c668fe6c1",
  "include_unsubscribed": true
}
```

## Unsubscribe and suppression

- **`List-Unsubscribe`** is added to every email except when "Include sending to unsubscribed users" is on.
- **Unsubscribe link:** the `[unsubscribe_url]` token, e.g. `<a href="[unsubscribe_url]">Unsubscribe</a>`, at least 12px and high contrast. Clicks on it don't count as clicks; clicks on a custom URL do. Test-email unsubscribe links don't work until the domain is verified.
- **A custom unsubscribe page must call the API** to update the status; OneSignal won't.
- **Change status:** unsubscribe via import `subscribed` = `no` or API `enabled: false`; resubscribe with `enabled: true` or in the dashboard.
- **Suppression is automatic** on a spam complaint or a hard bounce (soft bounces are not suppressed). Manage it at **Settings > Email > Suppression** or upload a CSV:

```
email,suppressed
test@example.com,true
```

- **Unsuppress only confirmed-valid addresses.** Removing a suppression doesn't resubscribe. Suppression is per app and not synced with external ESPs; via API use Create User or Update Subscription.

## Address validation

| Check | Free | Paid |
|---|---|---|
| Syntax, typo | yes | yes |
| MX, role-based, disposable | no | yes |

- **CSV import** runs validation (MX, disposable and role-based on by default; "Allow invalid email addresses" bypasses it). Bulk validation: **Validate Email Addresses**; the result CSV link is valid 72 hours.
- **The API only checks format.** Create Message returns `invalid_email_tokens` (it also lists already-unsubscribed addresses); the User API error is `` Invalid `token` format for device type email ``.

## HTML email

- **Inline CSS** (clients strip `<style>`) and fallback fonts.
- **Size:** images < 200 KB (100 to 200 KB), total < 1 MB; Gmail clips HTML > 102 KB.
- **Layout:** width 600 to 700px, design at 2x; avoid WebP and background images; set `width`/`height` for Outlook; no JS, forms, audio or video.
- **Dark mode:** `<meta name="color-scheme" content="light dark">` and `<meta name="supported-color-schemes" content="light dark">`; avoid pure white and pure black.
- **No hosted "view in browser"** version.

## Email compliance

General consent, jurisdictions, unsubscribe deadlines, sender identity and the original UK/open-tracking source qualifications are owned by [email-practices COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/COMPLIANCE.md#onesignal-source-qualifications).

- **OneSignal open-tracking implementation:** tag `open_tracking_consent: true|false`, segment with `country`, and send non-consenting users through a secondary subdomain without the tracking CNAME (`email-notracking.example.com`); omitting the CNAME disables opens and clicks for that sender.

## SMS model and setup

- **Formats:** SMS up to 160 characters; MMS up to 1,600 characters plus media; RCS (branded, buttons, carousels, read receipts; needs an RCS sender resource).
- **Programs:** promotional, transactional, OTP. Each program type requires a **dedicated sender**, because STOP to a shared sender opts the user out of everything from it.
- **Hierarchy:** Brand (one OneSignal app) > Sender (one sender resource or a group) > Sender resource (a number or agent, one geography, approved per geography and use case). Grouping enables geo-sending, throughput scaling (not permitted in the US) and RCS to SMS fallback; each user sticks to the same resource.

| Resource | Approval | Throughput |
|---|---|---|
| Alphanumeric | fast | 10 MPS default; one-way (no STOP, no double opt-in, no two-way); opt-out managed separately |
| Toll-free | days | 3 MPS default, up to 25+; one number covers US and Canada |
| Long codes | weeks | See [sms-marketing REGISTRATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sms-marketing/REGISTRATION.md#throughput-by-trust-score) for Trust Score totals and the provider’s 3 to 225 MPS source range |
| Short code | weeks to months | 100+ MPS, premium |
| RCS | 8 to 16 weeks | 100 MPS, premium |

- **Two paths** at **Settings > SMS > Set up SMS**: OneSignal SMS (>5,000 SMS/month, paid plan, the OneSignal compliance team handles applications) or the Twilio integration (<5,000/month, Account SID + Auth Token; Twilio trial accounts need pre-registered recipients). Track approvals at **Settings > SMS > Senders**.
- **Migration:** from Twilio about 3 weeks with no downtime; from other providers about 4+ weeks with some risk.

## SMS registration

- **Every application needs** brand info (legal name, address, tax ID, website, vertical) and campaign info (use case, 2 to 5 sample messages, opt-in flow with screenshots, opt-out flow, HELP response, frequency, privacy policy URL, ToS URL).
- **US approval times:** toll-free 3 to 5 business days; 10DLC 1 to 3 weeks (throughput, carrier totals and T-Mobile brand cap are owned by [sms-marketing REGISTRATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sms-marketing/REGISTRATION.md#throughput-by-trust-score)); short code 8 to 12 weeks; RCS 8 to 16 weeks (carriers prioritize Fortune 1000 and 100K+ msgs/month). The SMS setup page instead groups short codes and RCS as "typically 8 to 16 weeks".
- **State and country rules:** [SMS compliance](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sms-marketing/COMPLIANCE.md#onesignal-jurisdiction-guidance) owns the state table and Canadian bilingual/length rules.
- **UK:** generic sender IDs (Verify, OTP, Alert, Info) are blocked by BT; RCS only on +44 numbers; short code freeze mid-December to early January.
- **Unregistered sender IDs are blocked** in Ireland, Singapore, the Philippines and Thailand.

## SMS consent

- **Promotional consent is an affirmative action:**
  - Web form checkbox **unchecked by default**, with the disclosure on the same form above submit, and SMS consent separate from email.
  - Text-to-subscribe keyword, or a QR code `sms:+[phone_number]?body=KEYWORD` (RCS: `sms:+[phone_number]?service_id=[your_agent_id]%40rbm.goog&body=MESSAGE`).
  - A separate unchecked box at checkout; physical forms; an email prompt (an email address doesn't imply SMS consent).
  - iOS 26 "Unknown Senders" filter: text-to-subscribe and QR make you a known sender.
- **Promotional and transactional/OTP disclosure wording:** [sms-marketing COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sms-marketing/COMPLIANCE.md#onesignal-consent-disclosures) owns the TCPA/CTIA distinction and purpose limits.
- **Validate the audience:** Lookup (valid, active, mobile); only collect numbers where you have an approved sender; verify ownership with an OTP; store E.164 (`+14155551234`), which the API and CSV require. Never route SMS or bill by the number's prefix: the prefix shows the issuing carrier, not the live one, after number portability; use an HLR or portability lookup ([web-accessibility PHONE-NUMBERS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/PHONE-NUMBERS.md#the-prefix-is-not-the-carrier)) [skills-il, israeli-phone-formatter]. A vCard `.vcf` sent via Media URL (MMS rates) belongs in the welcome flow.
- **Double opt-in** is required for cart abandonment programs in the US and recommended otherwise. Set it up at **Settings > Platforms > SMS Settings > Consent Management** (Send Message Prompt + Text to Subscribe keyword); reply syncing at **SMS Settings > Senders > Setup Replies** is required. Tag which use case the subscriber opted into.
- **Each channel's consent is separate** (OneSignal blog, October 2026): a yes to push doesn't carry over to texts. SMS and RCS have no system prompt; honor STOP immediately; for email, ask at signup and offer preference options early.

## Keywords and opt-out

- **Protected keywords:** `STOP` (aliases `UNSUBSCRIBE`, `CANCEL`), `HELP`, `START` (aliases `UNSTOP`, `YES`); their replies can only be changed through support. STOP is scoped to that sender. The FCC’s broader revocation duty and unresolved 2026 source claim are maintained in [sms-marketing COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sms-marketing/COMPLIANCE.md#revocation-fcc).
- **STOP is final from your side.** Users who texted STOP cannot be resubscribed through the dashboard or API; they must text START, UNSTOP or YES. Re-subscribing an SMS Subscription without the user's consent violates carrier compliance rules (CTIA). Legal timing and the one permitted confirmation are maintained in [sms-marketing COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sms-marketing/COMPLIANCE.md#revocation-fcc).
- **Alphanumeric senders need an unsubscribe link in every message,** e.g. `https://yourbrand.com/sms-unsubscribe?uid={{ onesignal_id }}` (or `{{ subscription_id }}`). The page needs a confirmation button: don't auto-unsubscribe on page load, because link previews would trigger it. It calls the Update Subscription API or sets a tag (`promo = false`). The legal one-way-sender disclosure is maintained in [sms-marketing COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sms-marketing/COMPLIANCE.md#revocation-fcc).
- **Shared senders (not recommended):** custom keywords (NOPROMO sets `promo = false`) at **Settings > Platforms > SMS Settings > Keywords**; include the keyword in every message of that type and exclude by User Tag. Consent by Sender shows on the SMS subscription. Auto-responder at **SMS Settings > Auto-Responder**.
- **Keyword matching** is case-insensitive: a single word matches as the first or last word or in parentheses; a multi-word keyword only in parentheses. Keywords are global per sender (avoid `1`, `2`, `3` across concurrent campaigns). Syncing keywords to OneSignal breaks existing Twilio replies.
- **Preference centers:** the opt-in model (target `fall = true`) and the opt-out model (exclude `fall = false`) give different audiences; pick one. Keyword tags can trigger Journeys.

## Composing SMS, MMS, RCS

- **Encoding, segment limits and billing examples:** [sms-marketing CHANNEL-AND-COPY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sms-marketing/CHANNEL-AND-COPY.md#length-and-segments) owns GSM-7/UCS-2 and multipart rules.
- **MMS:** up to 10 attachments, 5MB total, US, Canada and Australia only, flat rate.
- **Links:** one trackable link per SMS, no personalization in tracked links. Don't use `bit.ly`, `tinyurl.com` or `goo.gl` (US carriers block them); use UTM parameters or branded domains.
- **RCS:** cards with up to three actions, carousels, link, keyword-reply and phone actions; images 2:1, 16:9, 7:3 (top) or 3:4 (left); max 3,072 characters; SMS fallback (not for text-only RCS). Automations prefer RCS automatically once it is approved.
- **Transactional sending:** Journeys (recommended, triggered by a custom event) or the Create Message API, with Templates. Every message needs the brand name and a STOP instruction.

## SMS compliance

Consent scope and records, the body/footer rule, SHAFT restrictions, local quiet hours and country qualifications are owned by [sms-marketing COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sms-marketing/COMPLIANCE.md). OneSignal has no built-in SMS quiet hours: use a Journey Time Window node, which uses the recipient’s time zone; the source treats transactional and OTP as generally exempt.

- **SMS pumping protections** (OneSignal SMS): spend warnings, automatic send disabling above a threshold, geographic restrictions to contracted geographies.

## Prove it

- **DNS:** exactly one SPF TXT record containing `include:spf.onesignal.email`; one DMARC record at `p=none` or stricter; both DKIM CNAMEs present; in Cloudflare the CNAMEs are "DNS only" with flattening off; the sender is on a subdomain.
- **Postmaster Tools** lists `mailmonitor@onesignal.com` as a managed user, and **Settings > Email > Reputation** shows bounces < 5% and complaints < 0.08%.
- **Warm-up:** any domain or subdomain sending >2,000/day for the first time goes out with Auto Warm Up (`kind: "warmup"`).
- **`include_unsubscribed: true`** appears only on compliance or transactional sends, never on a marketing template.
- **Unsubscribe:** a test email from the verified domain has a working `[unsubscribe_url]` link, and a custom unsubscribe page calls the API.
- **SMS:** each program type has its own sender; every opt-in form checkbox is unchecked by default with the full disclosure; numbers are stored in E.164; promotional sends to US, Canada, UK, EU or Australia pass through a Journey Time Window node.
- **Alphanumeric sender:** the unsubscribe page does nothing until the confirmation button is pressed.
