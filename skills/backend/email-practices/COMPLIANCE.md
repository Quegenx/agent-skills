# Compliance

Compliance covers consent, unsubscribing and the records that prove both, under the anti-spam laws (CAN-SPAM, GDPR, CASL and others) and the mailbox providers' rules. The source for this file carries the note: "Not legal advice: consult an attorney for your specific situation." Which mail counts as marketing is in [EMAIL-TYPES.md](EMAIL-TYPES.md); collecting consent at signup is in [LISTS-AND-CAPTURE.md](LISTS-AND-CAPTURE.md).

**Contents:** [The laws](#the-laws) · [Cold and unsolicited email](#cold-and-unsolicited-email) · [Unsubscribe deadlines](#unsubscribe-deadlines) · [The List-Unsubscribe headers](#the-list-unsubscribe-headers) · [One-click unsubscribe (RFC 8058)](#one-click-unsubscribe-rfc-8058) · [What Gmail and Yahoo check](#what-gmail-and-yahoo-check) · [The unsubscribe endpoint](#the-unsubscribe-endpoint) · [Preferences versus unsubscribe-all](#preferences-versus-unsubscribe-all) · [Consent records](#consent-records) · [Data retention and privacy](#data-retention-and-privacy) · [Prove it](#prove-it)

## The laws

| Law | Penalty | Marketing consent | Key requirements |
|---|---|---|---|
| CAN-SPAM (US) | Up to $53,088 for each separate email (FTC) | Opt-out mechanism required (not opt-in) | Accurate header info (From, To, Reply-To); non-deceptive subject lines; identify the message as an ad; physical mailing address in every email; clear opt-out; honor opt-out within 10 business days. "The law makes no exception for business-to-business email" |
| GDPR (EU) | €20M or 4% of revenue | Explicit opt-in, not pre-checked boxes; freely given, specific, informed; a service not made conditional on consent it doesn't need (Art. 7(4), below) | Withdrawal as easy as giving consent; rights of access and deletion ("right to be forgotten"); process unsubscribes immediately; consent records of who, when, how, what |
| CASL (Canada) | $1M (individual) to $10M (organization) CAD | Express (explicit opt-in, ideal) or implied: an existing business relationship (2 years), an inquiry (6 months), or an address published or handed to you, for messages relevant to the person's role (s.10(9), below) | Sender identification valid 60 days after send; unsubscribe functional 60 days after send; process unsubscribes within 10 business days; keep consent records 3 years after expiration |
| Spam Act 2003 (Australia) | | Consent required; you must be able to prove it (ACMA, below) | Honor unsubscribe within 5 days; no lists built with address-harvesting software |
| PECR plus UK GDPR (UK) | Up to £17.5 million or 4% of global turnover under PECR (ICO, after the Data (Use and Access) Act 2025, https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2026/02/statement-on-the-commencement-of-the-data-use-and-access-act-duaa) | Individuals, sole traders and some partnerships: consent or the soft opt-in. Corporate bodies: no consent needed (below) | Never conceal your identity; give a valid contact address for opting out; ICO good practice: keep a list of businesses that object and screen new lists against it |
| TCPA (US texts and calls, not email) | | Marketing texts: prior express written consent, a signed agreement naming the seller and the number, never a condition of purchase (47 CFR 64.1200(f)(9)) | Revocation by any reasonable means, honored within 10 business days (64.1200(a)(10)); details in [sms-marketing COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sms-marketing/COMPLIANCE.md#tcpa-consent) |
| LGPD (Brazil) | | Explicit consent for marketing | Similar to GDPR |

- **Transactional mail under each law:** CAN-SPAM allows it without opt-in if it relates to a transaction and isn't promotional; GDPR bases it on contract fulfillment or legitimate interest; CASL allows it without consent when related to an ongoing business relationship and factual. Details are in [EMAIL-TYPES.md](EMAIL-TYPES.md#legal-rules-by-type).
- **UK row corrected:** it said "Same as GDPR" for consent and requirements. The ICO says "You can email or text any corporate body", while "Sole traders and some partnerships are treated as individuals" (https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/electronic-and-telephone-marketing/electronic-mail-marketing/). The ICO marks that guidance as under review after the Data (Use and Access) Act. The Act "clarifies that direct marketing can be a legitimate interest", which still needs the balancing test; direct marketing is not one of the "recognised legitimate interests" that remove it (https://ico.org.uk/about-the-ico/what-we-do/legislation-we-cover/data-use-and-access-act-2025/the-data-use-and-access-act-2025-what-does-it-mean-for-organisations/).
- **Germany:** double opt-in is required in some regions, Germany named. The legal reason is UWG §7(2) Nr. 2: e-mail advertising needs "vorherige ausdrückliche Einwilligung" (prior express consent), business recipients included; for phone calls Nr. 1 asks the same of consumers, and of a business ("einem sonstigen Marktteilnehmer") "zumindest mutmaßliche Einwilligung" (at least presumed consent); §7(3) exempts existing customers when the address came from a sale, the mail promotes your own similar goods, they haven't objected, and the opt-out notice was given at collection and in every mail (https://www.gesetze-im-internet.de/uwg_2004/__7.html).
- **GDPR Art. 7(4), no tying:** "utmost account shall be taken of whether ... the provision of a service, is conditional on consent to the processing of personal data that is not necessary for the performance of that contract" (https://gdpr-info.eu/art-7-gdpr/). The EDPB: consent obtained by tying "is presumed to be not freely given (recital 43)" (https://www.edpb.europa.eu/sites/default/files/files/file1/edpb_guidelines_202005_consent_en.pdf). A gated download or quiz result may use the address to deliver it; joining the marketing list takes a separate unchecked box ([lead-magnets GATING-AND-DELIVERY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/lead-magnets/GATING-AND-DELIVERY.md#consent-and-double-opt-in)).
- **Sending internationally:** follow the most restrictive requirements, usually GDPR.
- **CAN-SPAM in practice:** Yahoo recommends complying with CAN-SPAM.

### OneSignal source qualifications

[OneSignal, Email and SMS] The former provider summary says explicit opt-in is required in the EU, UK, Canada, Australia, New Zealand, Singapore and Hong Kong; US CAN-SPAM allows opt-out; Germany recommends or requires double opt-in. Its blanket UK wording differs from the ICO corporate-body/individual distinction above; preserve that source claim without replacing the more specific law table. Its unchecked consent box, accurate From/Reply-To, non-deceptive subject, physical address, no-login unsubscribe, 10-business-day CAN-SPAM and immediate/without-undue-delay GDPR practices follow the owners here. Run re-consent campaigns for stale lists.

[OneSignal source, CNIL and Garante guidance, April 2026] The provider source asserts open-tracking consent is needed. That legal claim was not revalidated in this organization change. Its `open_tracking_consent` tag, country segmentation and secondary-subdomain implementation remain in [OneSignal EMAIL-AND-SMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/onesignal/EMAIL-AND-SMS.md#email-compliance).

## Cold and unsolicited email

Cold email is mail to people who never signed up: B2B outreach, partner and press pitches, follow-ups to event badge scans. The copy, sequences and sending setup are in [cold-outreach SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cold-outreach/SKILL.md); building the list is in [prospecting SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/SKILL.md). This section is the law each message must pass first. Recipients are judged by where they are, and when several laws apply, the most restrictive wins (above).

- **Gmail's sender guidelines:** "Don't send messages to people who didn't sign up to get messages from you." "Make sure recipients opt in to get messages from you." "Don't purchase email addresses from other companies." (https://support.google.com/a/answer/81126). A complaint rate that meets the thresholds in [DELIVERABILITY.md](DELIVERABILITY.md#reputation-and-thresholds) is still required.
- **CAN-SPAM covers business-to-business mail** with no exception (https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business):
  - "disclose clearly and conspicuously that your message is an advertisement";
  - accurate From, To, Reply-To and routing information, and a subject that "must accurately reflect the content of the message";
  - your valid physical postal address;
  - an opt-out you "must be able to process ... for at least 30 days after you send", honored "within 10 business days". "Sending a reply email or visiting a single page" is enough; charge no fee, ask for no extra personal information, and never sell or transfer an opted-out address;
  - one email promoting several marketers: they "can designate one of the marketers as the 'sender'" for these duties;
  - mixed content is judged by its primary purpose: a message is commercial if the subject line would make a recipient think it advertises, or if the transactional or relationship content isn't mainly at the beginning.
- **EU, ePrivacy Directive Art. 13** (https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32002L0058): e-mail "for the purposes of direct marketing may only be allowed in respect of subscribers who have given their prior consent" (13(1)). That applies to natural persons; for "subscribers other than natural persons" each member state sets the rule (13(5)), so B2B cold email is lawful in some countries and not others. Germany requires consent for business recipients too (UWG §7, above).
- **GDPR Art. 14 and 21 for addresses you didn't collect from the person:** tell them the source of the data, the purpose and the legal basis "at the latest at the time of the first communication" (Art. 14(3)(b), https://gdpr-info.eu/art-14-gdpr/), and state the right to object to direct marketing (after an objection "the personal data shall no longer be processed for such purposes", 21(3)), "explicitly brought to the attention of the data subject" at the first communication and "presented clearly and separately from any other information" (Art. 21(2) to (4), https://gdpr-info.eu/art-21-gdpr/). Answering "How did you get my email?" with the real source is a legal duty here, not a courtesy.
- **EU legitimate interest:** the CJEU held that "a commercial interest of the controller ... could constitute a legitimate interest ... provided that it is not contrary to the law", assessed "on a case-by-case basis" (C-621/22 KNLTB, para 49, https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62022CJ0621). Write the balancing assessment down. The CNIL's Kaspr decision (LinkedIn contact details collected unlawfully, retention found disproportionate) is in [prospecting LIST-COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/LIST-COMPLIANCE.md#linkedin).
- **UK:** corporate bodies may be emailed without consent; individuals, sole traders and some partnerships may not (the UK row above). The ICO calls a list of businesses that object, screened against new lists, good practice.
- **Canada, CASL s.10(9)** (https://laws-lois.justice.gc.ca/eng/acts/E-1.6/page-2.html): beyond the business-relationship and inquiry periods, consent is implied when the address was "conspicuously published" without a statement refusing unsolicited messages (10(9)(b)), or the person "has disclosed, to the person who sends the message ... the electronic address ... without indicating a wish not to receive" (10(9)(c), a business card or a badge scan handed to you), and in both cases only when "the message is relevant to the person's business, role, functions or duties". ISED: senders are "required to obtain consent ... before sending them commercial electronic messages" (https://ised-isde.canada.ca/site/canada-anti-spam-legislation/en/getting-consent-send-email).
- **Australia, Spam Act** (https://www.acma.gov.au/avoid-sending-spam): inferred consent "is usually when a person has a provable, ongoing relationship with your business" and "is not as reliable as getting someone's express consent"; "You cannot send an electronic message to ask for consent, because this is a marketing message"; "it's up to you to prove that you have a person's consent"; and you cannot "use or supply a list that has been created with address-harvesting software". The published-address route exists in the Act, but ACMA doesn't present it as a basis for cold outreach. A source said "Inferred consent can come from a conspicuously published business address" [coreyhaines31/marketingskills, prospecting].
- **Record provenance per contact:** "the source (provider or URL), the collection date, the lawful basis for EU/UK contacts, and the last verification date and result. This answers 'where did you get my email?' and makes data deletion requests possible." [coreyhaines31/marketingskills, prospecting]
- **One opt-out stops every channel.** Key the suppression on email, LinkedIn URL and phone so "a person removed in one channel is removed in all of them" [coreyhaines31/marketingskills, prospecting]; the list itself is in [LISTS-AND-CAPTURE.md](LISTS-AND-CAPTURE.md#suppression-list).
- **Pitches to creators, partners and press are commercial email too** when they promote something, a paid collab included: a non-deceptive subject (a source's "[$xxxx/month PAID collab]" subject [lightreel] must match the body), sender identification, postal address and opt-out, plus GDPR or CASL for EU and Canadian recipients. Programs are in [creator-marketing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/creator-marketing/SKILL.md).

### Texts and calls (US)

These aren't email, but outreach programs mix channels, so the rules sit here once:

- **Cold texts need TCPA consent** (the TCPA row above; no cold texting, [sms-marketing COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sms-marketing/COMPLIANCE.md#no-cold-texting)).
- **Revoking consent:** "by using any reasonable method"; "STOP, QUIT, END, REVOKE, OPT OUT, CANCEL, UNSUBSCRIBE" are valid on their own; honor it "within a reasonable time not to exceed ten business days"; callers "may not designate an exclusive means" (47 CFR 64.1200(a)(10), https://www.law.cornell.edu/cfr/text/47/64.1200). It applies to robocalls and robotexts.
- **AI voices:** the TCPA's "artificial or prerecorded voice" restrictions "encompass current AI technologies that generate human voices", so such calls "require the prior express consent of the called party to initiate such calls absent an emergency purpose or exemption" (FCC 24-17 para 2, https://docs.fcc.gov/public/attachments/FCC-24-17A1.pdf). The scope is the TCPA's prerecorded-voice rules, which the ruling cites as 47 CFR 64.1200(a)(1) and (a)(3): wireless numbers, emergency lines and other listed categories, and residential lines. A source said "never use AI voice on US mobile numbers without consent" [coreyhaines31/marketingskills, cold-email]; the rules reach further than mobiles.
- **Do Not Call:** "Most phone calls to a business made with the intent to solicit sales from that business are exempt from the Do Not Call provisions"; when you call consumers, sync with the registry "at least every 31 days" (https://www.ftc.gov/business-guidance/resources/qa-telemarketers-sellers-about-dnc-provisions-tsr). The Telemarketing Sales Rule also requires honoring a person's request not to be called by you, calls to the home only between 8 a.m. and 9 p.m. local time without consent, transmitted caller ID, and for prerecorded-message calls an express written agreement plus an automated opt-out (https://www.ftc.gov/business-guidance/resources/complying-telemarketing-sales-rule). Call scripts are in [sales-enablement COLD-CALLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sales-enablement/COLD-CALLS.md).

## Unsubscribe deadlines

| Rule | Process the unsubscribe | Link must keep working |
|---|---|---|
| CAN-SPAM | 10 business days | 30 days after send |
| GDPR | Immediately, as easy as opting in | |
| CASL | 10 business days | 60 days after send |
| Spam Act 2003 (Australia) | 5 days | |
| Gmail bulk senders | 48 hours | |
| Yahoo bulk senders | 2 days | |
| email-best-practices endpoint rule | Stop sending within 48 hours | |

- **Immediate is preferred** even where the law allows longer.
- **Every unsubscribe should be:** a prominent link, one-click when possible, no login, free, with a confirmation of the action.

## The List-Unsubscribe headers

- **Gmail, Yahoo and Microsoft require `List-Unsubscribe` headers.** Without them, bulk emails may be rejected or spam-filtered. Send both headers:

```typescript
headers: {
  'List-Unsubscribe': '<https://example.com/unsubscribe>',
  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
}
```

- **RFC 2369 (July 1998, Proposed Standard, not obsoleted or updated)** defines the list header fields: `List-Help`, `List-Unsubscribe`, `List-Subscribe`, `List-Post`, `List-Owner`, `List-Archive`.
  - Contents are URLs in angle brackets, comma-separated alternates in left-to-right order of preference; the mail client uses the left-most protocol it supports. Example: `List-Unsubscribe: <http://www.host.com/list.cgi?cmd=unsub&lst=list>, <mailto:list-request@host.com?subject=unsubscribe>`.
  - "There MUST be no more than one of each field present in any given message."
  - "These fields MUST only be generated by mailing lists, not end users."
- **Resend source header example:** `List-Unsubscribe: <https://example.com/unsubscribe>` [Resend contacts reference]; the RFC 8058 requirements below add the POST header and behavior.
- **Name each list.** Gmail asks you to identify each list with a human-readable `List-id:` header or a unique From: per list.

## One-click unsubscribe (RFC 8058)

RFC 8058 (January 2017, Proposed Standard) exists because anti-spam software fetches header URLs automatically, which caused accidental unsubscribes, so senders had added confirmation pages; RFC 8058 adds an HTTPS POST action instead.

- **One header of each:** one `List-Unsubscribe` and one `List-Unsubscribe-Post`.
- **`List-Unsubscribe` MUST contain one HTTPS URI** and MAY also contain a mailto.
- **`List-Unsubscribe-Post` MUST contain the single key/value pair `List-Unsubscribe=One-Click`.** ABNF: `list-unsubscribe-post = "List-Unsubscribe-Post:" 0*1WSP postarg CRLF`, `postarg = "List-Unsubscribe=One-Click"`.
- **The URI identifies both the recipient and the list,** since the POST carries no other arguments, and SHOULD include an opaque or hard-to-forge component that the server verifies.
- **The POST "MUST NOT include cookies, HTTP authorization, or any other context information."** The sender "MUST NOT return an HTTPS redirect."
- **The receiver** POSTs the body as `multipart/form-data` (SHOULD) or `application/x-www-form-urlencoded` (MAY), and "MUST NOT perform a POST on the HTTPS URI without user consent."
- **DKIM:** senders "MUST apply at least one valid DKIM signature", and both headers "MUST be covered by the signature and included in the h= tag". Without that, receivers SHOULD NOT offer one-click.
- **Example exchange:**

```
List-Unsubscribe: <https://example.com/unsubscribe/opaquepart>
List-Unsubscribe-Post: List-Unsubscribe=One-Click

POST /unsubscribe/opaquepart HTTP/1.1
Host: example.com
Content-Type: application/x-www-form-urlencoded
Content-Length: 26

List-Unsubscribe=One-Click
```

- **With a mailto listed first:** `List-Unsubscribe: <mailto:listrequest@example.com?subject=unsubscribe>, <https://example.com/unsubscribe.html?opaque=123456789>`.

## What Gmail and Yahoo check

- **Both headers are required by Gmail:**

```
List-Unsubscribe-Post: List-Unsubscribe=One-Click
List-Unsubscribe: <https://solarmora.com/unsubscribe/example>
```

  Gmail then sends `POST /unsubscribe/example HTTP/1.1` with `Content-Type: application/x-www-form-urlencoded`, `Content-Length: 26` and body `List-Unsubscribe=One-Click`.
- **One-click is required only for marketing and promotional (subscribed) messages.** Transactional messages are excluded (Gmail: password resets, reservation confirmations, form submission confirmations; Yahoo: order confirmations, password resets).
- **Also show a clearly visible unsubscribe link in the body.** That body link need not be one-click and may go to a preferences page. A body link alone is not enough (Yahoo), and Gmail does not check the body for a one-click link.
- **Conflict on mailto:** Gmail says "mailto and URL unsubscribe links, don't meet our one-click unsubscribe requirement" and you must "include one HTTPS URL in the List-unsubscribe: header". Yahoo says the POST (RFC 8058) method is highly recommended and "the mail-to: method is acceptable." Confirm in the providers' current pages.
- **A one-click URL that opens a landing or preferences page** doesn't comply with RFC 8058 (Gmail).
- **Scope of the unsubscribe:** one-click removes the recipient only from the list associated with that message.
- **Provider unsubscribe buttons:** Gmail's own top-of-message button shows only for messages passing "Google's automated eligibility checks"; Yahoo's blue "Unsubscribe" needs a correct RFC 8058 header plus sufficient reputation and engagement.
- **Dates:** Gmail senders that already had an unsubscribe link had until June 1, 2024 to add one-click; Yahoo's List-Unsubscribe enforcement began June 2024.
- **Gmail subscription guidelines** (https://support.google.com/mail/answer/15263077): one-click with no additional user action; honor within 48 hours; double consent (recipients confirm their address); send subscription and non-subscription messages from different addresses; identify each list with `List-id:` or a unique From:.

## The unsubscribe endpoint

- **Accept POST and return `200` or `202` with a blank page.**
- **Show a standard unsubscribe page for GET.**
- **Stop sending within 48 hours of the request.**
- **Unsubscribe is marketing-only:** the user still receives password resets and order confirmations (see [LISTS-AND-CAPTURE.md](LISTS-AND-CAPTURE.md#suppression-list)).

## Preferences versus unsubscribe-all

- **Most legislation requires a one-click unsubscribe.** A preference center is nice to have and can lower the unsubscribe rate, but doesn't replace Unsubscribe. Offer both if possible.
- **Preference center options:** frequency (daily, weekly, monthly), content types, complete unsubscribe.
- **Let recipients unsubscribe per list or from everything** (Gmail).

## Consent records

- **Record per consent:** email, date and time, method (form, checkbox), what they consented to, source (page or form).
- **Store** them in a database with timestamps, an audit trail of changes, and a link to the user account.
- **Never delete consent records** in cleanup jobs; keep them 3 years after expiry (CASL).

## Data retention and privacy

- **Retention:** GDPR says keep data only as long as necessary; CASL says keep consent records 3 years after expiration. Have a clear retention policy, honor deletion requests promptly, and review and clean regularly. GDPR Art. 12(3) sets the deadline: "without undue delay and in any event within one month of receipt of the request. That period may be extended by two further months where necessary", and the person is told of any extension within the first month (https://gdpr-info.eu/art-12-gdpr/). Per-record periods are in [LISTS-AND-CAPTURE.md](LISTS-AND-CAPTURE.md#retention).
- **The privacy policy states:** data collected, how it is used, who it is shared with, user rights (access, deletion), and a privacy contact.

## Prove it

- Every marketing email carries `List-Unsubscribe` with one HTTPS URL and `List-Unsubscribe-Post: List-Unsubscribe=One-Click`, both covered by the DKIM signature's `h=` tag.
- A `curl -X POST` to the unsubscribe URL with body `List-Unsubscribe=One-Click`, no cookies and no auth, returns `200` or `202` without a redirect, and the address stops receiving that list's mail within 48 hours.
- A GET on the same URL shows an unsubscribe page; the body link works without login and still works 60 days after send.
- Each marketing email shows the sender, a physical mailing address and a visible unsubscribe link.
- Every subscriber row has a consent record with email, timestamp, method, scope and source.
- An unsubscribed user still receives a password reset.
- A cold email to a recipient passes the country check above before it is written, says it is an advertisement, carries the postal address and an opt-out that works for 30 days, and, for EU and UK individuals, names the source of the address and the right to object in the first message.
- Every cold contact has a recorded source, collection date and lawful basis, and an opt-out on any channel suppresses all of them.
- A gated download is delivered without the marketing box ticked, and that box starts unchecked.
