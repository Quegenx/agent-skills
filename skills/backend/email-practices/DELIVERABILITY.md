# Deliverability

Deliverability is whether mail reaches the inbox, the spam folder or nothing. Authentication (SPF, DKIM, DMARC with an aligned From: domain) is required by Gmail, Yahoo and Microsoft, which reject or spam-filter unauthenticated mail; after that comes reputation: the spam complaint rate, bounces and steady sending volume. Authentication problems are the most common cause of mail landing in spam. The one-click unsubscribe headers the same providers require are in [COMPLIANCE.md](COMPLIANCE.md); setting up a domain in Resend is in [resend SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/resend/SKILL.md).

**Contents:** [Authentication](#authentication) · [DMARC in detail](#dmarc-in-detail) · [Sender requirements by mailbox provider](#sender-requirements-by-mailbox-provider) · [Gmail error codes](#gmail-error-codes) · [Reputation and thresholds](#reputation-and-thresholds) · [Stop-loss rules](#stop-loss-rules) · [Warming up and volume](#warming-up-and-volume) · [Bounces and complaints](#bounces-and-complaints) · [Infrastructure](#infrastructure) · [Message format and display names](#message-format-and-display-names) · [Debugging mail that lands in spam](#debugging-mail-that-lands-in-spam) · [Prove it](#prove-it)

## Authentication

- **Authenticate before the first send.** For a new app, set up DNS authentication before sending your first email.
- **SPF says which servers may send for your domain.** Add a TXT record. Use `~all` (soft fail). Example: `v=spf1 include:amazonses.com ~all`. SPF that needs more than 10 DNS lookups may fail (Microsoft).
- **DKIM is a cryptographic signature.** Your email service provides the TXT record. Gmail requires a key of 1024 bits or longer and recommends 2048 bits; Yahoo says "1024 bits or greater", 2048 recommended.
- **DMARC sets the policy for SPF and DKIM failures and asks for reports.** Example: `v=DMARC1; p=none; rua=mailto:dmarc@example.com`. It tells receiving servers what to do with messages that don't pass SPF or DKIM; messages failing DMARC are typically handled per the sending domain's policy.
- **To pass DMARC at Gmail,** a message must be authenticated by SPF or DKIM, or both, and the authenticating domain must be the domain in the From: header.
- **Send aligned identifiers.** Send "at least one, preferably two" authenticated identifiers aligned with the From: domain (RFC 9989). Gmail: only one of SPF or DKIM needs to align, alignment is not required for forwarded or mailing-list (indirect) messages, and "it's likely that DMARC alignment with both SPF and DKIM will eventually be a sender requirement."
- **Multiple DKIM signatures (Yahoo):** all are evaluated. "If a mail message has multiple DMARC-aligned signatures and they do not all pass, Yahoo does not guarantee that it will pass DMARC."
- **Sign the unsubscribe headers.** RFC 8058 requires at least one valid DKIM signature covering `List-Unsubscribe` and `List-Unsubscribe-Post` (see [COMPLIANCE.md](COMPLIANCE.md#one-click-unsubscribe-rfc-8058)).
- **Verify each record with `dig`.** Each command should return your configured record; no output means the record is missing.

```bash
# SPF record
dig TXT example.com +short

# DKIM record (replace 'resend' with your selector)
dig TXT resend._domainkey.example.com +short

# DMARC record
dig TXT _dmarc.example.com +short
```

## DMARC in detail

- **The record lives at TXT `_dmarc.<domain>`.** RFC 7489 example: `_dmarc IN TXT ( "v=DMARC1; p=none; " "rua=mailto:dmarc-feedback@example.com" )`.
- **Alignment:** relaxed (the default) means the Organizational Domains are equal; strict means an exact FQDN match. DKIM aligns on `d=`; SPF aligns on the RFC5321.MailFrom domain. Relaxed passes include `d=example.com` with From `alerts@news.example.com`, and SPF MailFrom `cbg.bounces.example.com` with From `payments@example.com`. "It is considered to be a DMARC pass if any DKIM signature is aligned and verifies." Yahoo: "Relaxed alignment is acceptable."
- **The standard changed in May 2026.** RFC 7489 (March 2015, Informational) is obsoleted by RFC 9989 (DMARC), RFC 9990 (Aggregate Reporting) and RFC 9991 (Failure Reporting), all May 2026, Proposed Standard.

| Tag | RFC 7489 | RFC 9989 |
|---|---|---|
| `v` | MUST be `DMARC1`, first tag; `v` and `p` MUST be present in that order | kept |
| `p` | `none`, `quarantine`, `reject`; REQUIRED for policy records | now RECOMMENDED; absent is treated as `p=none` |
| `adkim`, `aspf` | `r` or `s`, default `r` | kept |
| `fo` | `0`, `1`, `d`, `s`; default `0`; ignored without `ruf` | kept |
| `rua`, `ruf`, `sp` | present | kept |
| `pct` | 0 to 100, default 100 | removed |
| `rf` | default `afrf` | removed |
| `ri` | default 86400 | removed |
| `np` | absent | added: policy for non-existent subdomains |
| `psd` | absent | added: `y`, `n`, `u`, default `u` |
| `t` | absent | added: test mode `y` or `n`, default `n`; `t=y` applies one level below (quarantine becomes none, reject becomes quarantine) |

- **RFC 9989 also** replaced the Public Suffix List with a "DNS Tree Walk" and removed the maximum report size in DMARC URIs. Interoperability issues with PSL-based receivers are "entirely avoided by the use of strict alignment and publishing explicit DMARC Policy Records for all Author Domains."
- **Conflict on `pct`:** the email-best-practices rollout below and the dmarc.org example (`"v=DMARC1;p=reject;pct=100;rua=mailto:postmaster@dmarcdomain.com"`) use `pct`; RFC 9989 removed it and offers `t=y` for a one-step-softer test. Confirm in the current RFC and with your receivers before relying on `pct`.
- **Roll out in stages.** email-best-practices: `p=none` (monitor), then `p=quarantine; pct=25`, then `p=reject` (more: https://resend.com/blog/dmarc-policy-modes). Microsoft: move gradually none, quarantine, reject.
- **Domain Owner steps (RFC 9989):**
  1. SPF with an aligned MailFrom.
  2. DKIM with an aligned signing domain.
  3. A mailbox for aggregate reports.
  4. Publish `p=none` with `rua` (Monitoring Mode), plus a record for the Organizational Domain if it differs.
  5. Analyze the reports (machine-parse them).
  6. Fix legitimate unaligned streams before Enforcement; "it may take many months" before moving to enforcement.
- **Reports:** Gmail recommends DMARC reports; Yahoo strongly recommends the `rua` tag; Outlook sends RUA reports and has no plans to send RUF.
- **`p=reject` at Yahoo:** "any message without a proper DKIM signature or SPF alignment will be rejected by Yahoo's mail servers."

## Sender requirements by mailbox provider

The official pages, to re-read when a rule matters: Gmail https://support.google.com/a/answer/81126 and FAQ https://support.google.com/a/answer/14229414; Yahoo https://senders.yahooinc.com/best-practices/ and https://senders.yahooinc.com/faqs/.

| Requirement | Gmail, all senders | Gmail, bulk (over 5,000/day) | Yahoo, all senders | Yahoo, bulk | Outlook.com, over 5,000/day |
|---|---|---|---|---|---|
| SPF and DKIM | SPF or DKIM | SPF and DKIM | SPF or DKIM | SPF and DKIM | SPF must pass and DKIM must pass |
| DMARC | | Required; enforcement policy can be `none` | | Valid policy, at least `p=none`; DMARC must pass | At least `p=none`, aligned with SPF or DKIM (preferably both) |
| From: alignment | | Aligned with the SPF or DKIM domain | | Aligned with the SPF or DKIM domain | (see DMARC) |
| Forward and reverse DNS (PTR) | Yes | Yes | Yes | Yes | |
| TLS | Yes (added Dec. 2023) | Yes | | | |
| Spam rate | Below 0.3% in Postmaster Tools | Below 0.30% | Below 0.3% | Below 0.3% | |
| Message format | RFC 5322 | RFC 5322 | RFCs 5321 and 5322 | RFCs 5321 and 5322 | |
| One-click unsubscribe | | Marketing and subscribed messages, plus a clearly visible body link | | Marketing and subscribed messages, plus a clearly visible body link | Functional, visible unsubscribe link (recommended) |
| Honor unsubscribes | | Within 48 hours | | Within 2 days | |
| Don't impersonate Gmail From: headers | Yes (Gmail will begin using a DMARC quarantine enforcement policy) | Yes | | | |

### Gmail

- **Scope:** personal Gmail accounts (`@gmail.com`, `@googlemail.com`). The rules don't apply to mail sent to Google Workspace accounts or intra-domain mail, but every sender, Workspace included, must meet them when sending to personal Gmail.
- **Dates:** requirements started February 1, 2024. Senders that already had an unsubscribe link had until June 1, 2024 to add one-click. From June 2024, bulk senders with a user-reported spam rate above 0.3% are ineligible for mitigation, and become eligible again after 7 consecutive days below 0.3%. From November 2025 Gmail ramps up enforcement: non-compliant messages get disruptions "including temporary and permanent rejections."
- **Bulk sender:** "any email sender that sends close to 5,000 messages or more to personal Gmail accounts within a 24-hour period." Mail from the same primary domain counts together (2,500 from `solarmora.com` plus 2,500 from `promotions.solarmora.com` is bulk). Meeting it once makes you a bulk sender permanently; the status has no expiration date.
- **New domains** (any that hasn't sent more than 5,000 emails a day to personal Gmail since January 1, 2024) are enforced on "an accelerated timetable."
- **What each failure costs:**

| Failure | Result |
|---|---|
| From: not aligned, not both SPF and DKIM, missing forward or reverse DNS, no TLS, not RFC 5322 | Temporary or permanent failure codes, or spam foldering |
| Spam rate over 0.3%, no DMARC (minimum `p=none`), no one-click unsubscribe on marketing, unsubscribes not honored within 48 hours | Delivery support or mitigations unavailable |

- **Missing one-click** doesn't by itself auto-reject or spam-mark, but only fully compliant bulk senders are eligible for mitigation, and an unsubscribe link broken for an extended time counts as non-compliance.
- **Open rates:** Google doesn't track open rates; low open rates "aren't necessarily an accurate indicator of deliverability."
- **No allowlists:** Google doesn't accept allowlist requests from email providers.
- **Consent is part of the guidelines:** "Don't send messages to people who didn't sign up to get messages from you." "Make sure recipients opt in to get messages from you." "Don't purchase email addresses from other companies." (https://support.google.com/a/answer/81126). Cold email law is in [COMPLIANCE.md](COMPLIANCE.md#cold-and-unsolicited-email).

### Yahoo and AOL

- **Scope:** all domains and consumer email brands hosted by Yahoo Mail, including AOL; not Yahoo Japan.
- **Dates:** enforcement began February 2024, rolled out gradually through the first half of the year; List-Unsubscribe enforcement began June 2024.
- **Bulk sender:** "a significant volume of mail"; Yahoo specifies no threshold. The [official Yahoo FAQ](https://senders.yahooinc.com/faqs/), fetched for this correction, explicitly declines to publish a numeric threshold. The former Resend contacts and OneSignal email summaries applied Gmail’s 5,000/day threshold to Yahoo; those source claims are retained here as history and corrected by Yahoo’s primary statement. The sender is viewed at the authenticated domain or From: header domain level, and spoofed mail counts toward the thresholds.
- **Spam rate** is calculated on mail delivered to the inbox.
- **Non-compliance** means the spam folder or rejection with a specific error code.
- **No whitelisting program.** Maximum message size is about 25 MB.
- **BIMI logo** needs an SVG logo, DMARC at quarantine or reject, bulk volume and reputation.
- **The blue "Unsubscribe" next to From** appears with a correct RFC 8058 header plus "sufficient reputation and engagement"; test it in Yahoo webmail.

### Microsoft Outlook.com

- **Scope:** consumer domains hotmail.com, live.com, outlook.com; domains sending over 5,000 emails per day.
- **Dates:** posted April 2, 2025, updated April 30, 2025. From May 5, 2025, non-compliant messages are rejected (not junked) with `550; 5.7.515 Access denied, sending domain [SendingDomain] does not meet the required authentication level.`
- **Recommended:** a valid From and Reply-To that can receive replies, a functional visible unsubscribe link, list hygiene, transparent practices.
- **A Safe Sender list entry won't bypass enforcement.**

## Gmail error codes

| Code | Meaning |
|---|---|
| 4.7.23 | No PTR or forward mismatch; rate limited |
| 4.7.27 | SPF did not pass |
| 4.7.28 | Quota exceeded (see below) |
| 4.7.29 | No TLS |
| 4.7.30 | DKIM did not pass |
| 4.7.31 | No DMARC record or no policy |
| 4.7.32 | From: not aligned with the SPF or DKIM organizational domain |
| 5.7.25 | PTR; blocked |
| 5.7.26 | Unauthenticated; may also be marked as spam |
| 5.7.27 | SPF; blocked |
| 5.7.29 | TLS; blocked |
| 5.7.30 | DKIM; blocked |
| `421, "4.7.0"` | IP not on the allowed list for the recipient domain |
| `550, "5.7.1"` | IP on the suspended list (for example a shared IP with poor reputation) |
| `550-5.7.1: Message does not meet IPv6 sending guidelines regarding PTR records and authentication.` | IPv6 PTR or authentication problem |

- **On 4.7.28 (quota exceeded):** stop sending for at least 10 minutes. If the error doesn't say which quota, assume the DKIM, SPF and IP quotas are all affected. After 10 minutes send from a single connection; if that fails wait another 10 minutes; then add connections one at a time.

## Reputation and thresholds

- **Do:** send to engaged users, keep bounce below 4% and complaints below 0.1%, remove inactive subscribers.
- **Don't:** send to purchased lists, ignore bounces or complaints, send inconsistent volumes. Loading cold event badge scans into a sequence "burns domain reputation" [coreyhaines31/marketingskills, events].
- **Gmail spam rate:** "Keep spam rates reported in Postmaster Tools below 0.10% and avoid ever reaching a spam rate of 0.30% or higher." Spam rate is calculated daily, and "even today, user-reported spam rates greater than 0.1% have a negative impact on email inbox delivery for bulk senders."
- **The sources give different targets;** confirm in the provider's current pages:

| Metric | email-best-practices deliverability | email-best-practices marketing and list management | Gmail | Yahoo |
|---|---|---|---|---|
| Bounce rate | Keep below 4%; below 1% good, 1 to 3% acceptable, 3 to 4% concerning, over 4% critical | Below 2%; alert above 2% | | |
| Complaint (spam) rate | Keep below 0.1%; below 0.01% excellent, 0.01 to 0.05% good, over 0.05% critical | Below 0.05%; alert above 0.05% | Below 0.10%; never 0.30% or higher | Below 0.3% |

- **Bounce rate has no provider threshold:** Google states none. The 4% and 2% targets above are the sources' own; the cold-email source also sides with 2%: "Keep them under 2% per campaign; under 1% is best in class" [coreyhaines31/marketingskills, cold-email].

## Stop-loss rules

Decide these before launch and enforce them automatically where your tool allows [coreyhaines31/marketingskills, cold-email]. The thresholds are the source's own numbers, not provider rules, except where the Gmail column above backs them:

| Trigger | Action |
|---|---|
| Bounce rate above 2% on a campaign | Pause the campaign and re-verify the list |
| Spam complaints approaching 0.1% | Pause, cut volume, review targeting and copy |
| Domain appears on a major blocklist | Stop sending from it |
| Reply rate under ~1% after 300+ sends | Stop the campaign; the targeting or offer is wrong, and more volume makes it worse |
| Rising complaint or bounce rate on any sequence | "Pause and escalate any sequence with rising complaint/bounce rates - that's a deliverability emergency" [coreyhaines31/marketingskills, marketing-loops] |

- **Left out of the source's table:** an inbox-placement row whose action is to pull a mailbox "from rotation" and return it "to warmup", and "retire" as the blocklist action. Mailbox rotation, warmup networks and swapping out burned domains are evasion, named as do-nots in [cold-outreach SENDING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cold-outreach/SENDING.md#out-of-bounds).
- **Gmail's own consequence** for crossing 0.3% is losing mitigation until 7 consecutive days below it ([Gmail](#gmail) above), so the 0.1% pause comes first.

## Warming up and volume

- **New IP or domain? Increase volume gradually.** Daily volume (https://resend.com/docs/knowledge-base/warming-up):

| Week | Daily volume |
|---|---|
| 1 | 50 to 100 |
| 2 | 200 to 500 |
| 3 | 1,000 to 2,000 |
| 4 | 5,000 to 10,000 |

- **Start with engaged users, send consistently, don't rush.**
- **Gmail ramp-up:** increase volume slowly at a consistent rate and avoid bursts; "immediately doubling previously sent volumes suddenly could result in rate limiting"; ramp new formats and new infrastructure separately; back off on bounces and deferrals. Gmail tracks limits per domain and per IP, and an IP's quota is shared by every sender on it.
- **Yahoo:** servers limit messages per SMTP connection and terminate without an error; reconnect.

## Bounces and complaints

- **Hard bounce** (permanent failure): remove immediately. Never send to guessed addresses to find out which bounce; verify first ([LISTS-AND-CAPTURE.md](LISTS-AND-CAPTURE.md#suppression-list)).
- **Soft bounce** (transient): retry after 1 hour, 4 hours, then 24 hours, and remove after repeated failures. The deliverability reference says after 3 to 5 failures; the list-management reference and the webhooks-events handler suppress after 3. Handlers are in [RELIABILITY.md](RELIABILITY.md#handling-bounces-and-complaints); suppression rules are in [LISTS-AND-CAPTURE.md](LISTS-AND-CAPTURE.md#suppression-list).
- **Reduce complaints:** send only to opted-in users, make unsubscribe easy and immediate, use clear sender names and From addresses.
- **Feedback loops:** set them up with Gmail (Postmaster Tools), Yahoo, Microsoft SNDS. Remove complainers immediately.
- **Yahoo Complaint Feedback Loop (CFL):** ARF reports per DKIM `d=` domain enrolled through Sender Hub; there is no IP-based CFL. Old-form enrollments stopped receiving ARFs if not re-enrolled by August 1, 2024. Reports come From `Yahoo! Mail AntiSpam Feedback`, envelope `feedback@arf.mail.yahoo.com`, DKIM-signed by `arf.mail.yahoo.com`.

## Infrastructure

- **Separate sending subdomains per purpose,** for example `t.example.com` for transactional and `m.example.com` for marketing (see [EMAIL-TYPES.md](EMAIL-TYPES.md#keep-the-two-apart)).
- **Separate streams at the provider level too.** Yahoo recommends segregating bulk or marketing from transactional by IP or DKIM domain. Gmail: ideally one IP, otherwise a separate IP per message type; the same From: per category (`sales@`, `deals@`, `alert@`); align SPF and DKIM at the organizational level.
- **DNS TTL:** low (300s) during setup, high (3600s or more) once stable.
- **PTR:** the sending IP must have a PTR record resolving to a hostname whose A or AAAA record resolves back to the same IP. Yahoo recommends a non-generic PTR.
- **Shared IPs:** check they are not on blocklists and watch reputation in Postmaster Tools.
- **Forwarding:** Yahoo recommends ARC if you forward mail.
- **Email providers (ESPs):** offer an abuse address, keep WHOIS and abuse.net current, remove spamming clients. Don't send test phishing campaigns from your domain.

## Message format and display names

Gmail formatting rules:

- **HTML per standards; one address in From:;** no excessively large headers; a valid `Message-ID`; single-instance headers (From, To, Subject, Date) only once.
- **No `Re:` or `Fwd:` unless the message really is a reply or forward;** no emoji that imitate verification.
- **"Don't use HTML and CSS to hide content in your messages."** Links must be visible and understandable. IDNs follow UTS #39 section 5.2.
- **Display names identify the sender only:** no subject content ("URGENT REQUEST", "Last Chance"), no recipient name, no "User (2)", no emoji or graphic characters, and no `@gmail.com` display name for bulk email.
- **Don't mix promotions into receipts.**

## Debugging mail that lands in spam

Check in this order:

1. Authentication (SPF, DKIM, DMARC).
2. The `List-Unsubscribe` header (email-best-practices: "required by Gmail/Yahoo since Feb 2024"; the one-click dates are in [COMPLIANCE.md](COMPLIANCE.md#what-gmail-and-yahoo-check)).
3. Sender reputation (blocklists, complaint rates).
4. Content.
5. Sending patterns (sudden volume spikes).

- **A falling open rate is not a deliverability reading.** Google doesn't track opens ([Gmail](#gmail) above), and Apple Mail Privacy Protection "prevents senders from seeing if you've opened the email message they sent you" (https://support.apple.com/guide/iphone/use-mail-privacy-protection-iphf084865c7/ios); on a Mac it loads remote content "in the background when a message is received (instead of when you view it)" (https://support.apple.com/guide/mail/change-privacy-settings-mlhlae4a4fe6/mac). When opens drop, run the checks above and read clicks, complaints and bounces; the emails source's eval lists reputation, hygiene, frequency and deliverability as causes beyond subject lines [coreyhaines31/marketingskills, emails].
- **No trigger-word lists:** none of the provider pages this skill cites names spam "trigger words"; content checks are Gmail's formatting rules ([Message format and display names](#message-format-and-display-names)).

| Tool | Shows |
|---|---|
| Google Postmaster Tools, https://postmaster.google.com | Domain reputation, spam rates |
| mail-tester, https://www.mail-tester.com | Send a test email, get a deliverability score |
| MXToolbox, https://mxtoolbox.com/blacklists.aspx | Blocklist status |

## Prove it

- `dig TXT` returns your SPF record, your DKIM record at `<selector>._domainkey.<domain>`, and a DMARC record at `_dmarc.<domain>` with `v=DMARC1` first and a `p=` policy (at least `none`) and `rua`.
- The From: domain aligns with the SPF MailFrom or DKIM `d=` domain; above 5,000 messages a day, both SPF and DKIM pass.
- The DKIM key is at least 1024 bits (2048 recommended), and the signature's `h=` tag covers `List-Unsubscribe` and `List-Unsubscribe-Post`.
- The sending IP has a PTR whose hostname resolves back to it, and mail goes over TLS.
- Postmaster Tools shows a spam rate below 0.10%; bounce and complaint rates sit under the targets you chose from the table above.
- Transactional and marketing mail go from separate subdomains.
- Each stop-loss trigger you adopted is wired to pause sends automatically, and a test campaign with seeded bounces above the threshold pauses itself.
- Volume grew week over week, not by doubling overnight.
