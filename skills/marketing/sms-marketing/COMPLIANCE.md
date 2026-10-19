# SMS compliance

US texting rests on two separate rulebooks that are easy to mix up: the TCPA, a federal law with FCC rules in 47 CFR 64.1200 (consent, revocation, quiet hours, Do-Not-Call), and the CTIA Messaging Principles and Best Practices, the carriers' industry rules (opt-in confirmation wording, HELP, SHAFT content). Platform rules (OneSignal's protected keywords, 10DLC registration) sit on top of both, and none of the three equals another. The source carries this note: "This is operational guidance, not legal advice. For high-volume programs (50K+ subscribers) or any program with non-trivial revenue, run your compliance setup past a TCPA-experienced attorney." [coreyhaines31/marketingskills, sms]. Registration and throughput are in [REGISTRATION.md](REGISTRATION.md); WhatsApp opt-in is in [WHATSAPP.md](WHATSAPP.md); OneSignal's keyword, consent and quiet-hours settings are in [onesignal EMAIL-AND-SMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/onesignal/EMAIL-AND-SMS.md#sms-consent); the email laws (CAN-SPAM, GDPR, CASL, Spam Act) are in [email-practices COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/COMPLIANCE.md).

**Contents:** [Which rule comes from where](#which-rule-comes-from-where) · [TCPA consent](#tcpa-consent) · [The opt-in disclosure](#the-opt-in-disclosure) · [Revocation (FCC)](#revocation-fcc) · [STOP and HELP replies](#stop-and-help-replies) · [The opt-out footer](#the-opt-out-footer) · [Quiet hours and Do-Not-Call](#quiet-hours-and-do-not-call) · [Restricted content (SHAFT)](#restricted-content-shaft) · [Outside the US](#outside-the-us) · [No cold texting](#no-cold-texting) · [Audit checklist](#audit-checklist) · [Prove it](#prove-it)

## Which rule comes from where

The source attributes the opt-in disclosure elements (frequency, "Msg & data rates may apply", STOP/HELP, a terms link) to the TCPA. They come from CTIA; the TCPA's requirement is the signed written agreement below.

| Rulebook | What it sets | Source |
|---|---|---|
| TCPA and FCC rules | Prior express written consent for marketing, revocation by any reasonable means within 10 business days, the one confirmation text, quiet hours for telephone solicitation, Do-Not-Call | https://www.ecfr.gov/current/title-47/chapter-I/subchapter-B/part-64/subpart-L/section-64.1200 |
| CTIA Messaging Principles (May 2023) | Opt-in confirmation contents, consent scoped to one campaign and sender, opt-out practice | https://api.ctia.org/wp-content/uploads/2023/05/230523-CTIA-Messaging-Principles-and-Best-Practices-FINAL.pdf |
| CTIA Short Code Monitoring Handbook v1.9 | SHAFT content, age gates, audit severities | https://api.ctia.org/wp-content/uploads/2024/01/CTIA-Short-Code-Monitoring-Handbook-v1.9-FINAL.pdf |
| The platform | Protected keywords, registration, throughput | [REGISTRATION.md](REGISTRATION.md), [OneSignal keywords](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/onesignal/EMAIL-AND-SMS.md#keywords-and-opt-out) |

## TCPA consent

- **Marketing texts need prior express written consent.** Autodialed texts that are telemarketing need it under 47 CFR 64.1200(a)(2) (eCFR link above).
- **What that consent is** (64.1200(f)(9)): a signed written agreement that authorizes the seller, names the phone number, discloses autodialed or prerecorded telemarketing, and states that signing is "not required ... as a condition of purchasing any property, goods, or services". An electronic or digital signature counts where federal law or state contract law recognizes it as valid (64.1200(f)(9)(ii)).
- **Informational texts need prior express consent,** and "callers can obtain prior express consent... either orally or in writing" (FCC, https://docs.fcc.gov/public/attachments/DOC-393514A1.pdf, n.48). A reminder for an event the person registered for is informational; adding a promotion to it makes it marketing, which needs written consent.
- **The source's consent tiers** [coreyhaines31/marketingskills, sms]:

| Type | What it covers | How to capture |
|---|---|---|
| Express written consent | Marketing SMS (sales, promotions, offers) | Checkbox + clear disclosure language, captured electronically with timestamp |
| Express consent (non-written) | Informational/transactional (delivery, account alerts) | Phone number provided during transaction with awareness it'll be used to text |
| Established business relationship | NOT sufficient for marketing SMS | Doesn't apply |

- **A phone number given at checkout is not marketing consent.** The preserved OneSignal disclosure below says “A phone number alone is not consent”.
- **Damages:** the source states statutory damages of "$500-$1,500 **per message**" [coreyhaines31/marketingskills, sms]. This round did not check that figure against the statute.

## The opt-in disclosure

- **The CTIA opt-in confirmation** (CTIA 2023 §5.1.2.1) is sent before any other message and includes the program name, a customer care contact or HELP, how to opt out, the recurring message frequency, and fees.
- **Consent is scoped:** it "should apply only to the campaign(s) and specific Message Sender for which it was intended" (CTIA 2023 §5.1.2.2). Purchased, rented or shared lists are non-compliant everywhere [OneSignal, Email and SMS source].
- **The source's disclosure template** [coreyhaines31/marketingskills, sms]:

```
By signing up via text, you agree to receive recurring automated promotional and
personalized marketing text messages (e.g., cart reminders) from [Brand] at the
cell number used when signing up. Consent is not a condition of any purchase.
Reply HELP for help and STOP to cancel. Msg frequency varies. Msg & data rates
may apply. View [Terms](link) and [Privacy](link).
```

- **Placement:** "Place this **directly adjacent** to the phone number field and submit button. Do not bury it in a footer." [coreyhaines31/marketingskills, sms]. The checkbox is unchecked by default [OneSignal, Email and SMS source].
- **Cart abandonment texts in the US need double opt-in** (OneSignal: "Double opt-in is required for cart abandonment programs in the US"). The source's cart flow assumes a single opt-in; keep OneSignal's rule.
- **Record the opt-in:** timestamp, IP, page URL and the exact disclosure shown [coreyhaines31/marketingskills, sms]. The burden of proof is on the sender [OneSignal, Email and SMS source].

## Revocation (FCC)

From 47 CFR 64.1200(a)(10) and (a)(12), in effect since April 11, 2025 under the FCC's order 24-24 (https://docs.fcc.gov/public/attachments/FCC-24-24A1.pdf):

- **Any reasonable means counts.** The per se list is "stop," "quit," "end," "revoke," "opt out," "cancel," or "unsubscribe". Other wording counts "if a reasonable person would understand those words to have conveyed a request to revoke consent", so read inbound replies for intent, not only for keywords.
- **No exclusive channel:** the sender "may not designate an exclusive means" of revocation. CTIA adds that senders "should support multiple mechanisms of opt-out, including phone call, email, or text."
- **Deadline:** "All requests to revoke ... must be honored within a reasonable time not to exceed ten business days from receipt." The source says "within seconds" and OneSignal says "honor STOP immediately"; keep that as the practice, with ten business days as the legal ceiling.
- **One confirmation text, then nothing.** It "merely confirms" the opt-out, carries no marketing, and is the only message after the request. Sent within 5 minutes, it is presumed to fall within consent; later, the sender must show the delay was reasonable. If the person consented to several categories, the confirmation may ask which ones the opt-out covers.
- **One-way senders** (no reply possible, such as alphanumeric): each text must say that two-way texting isn't available and give other ways to revoke.
- **Changing (checked 2026-10-18):** the "revoke all" part of (a)(10) was waived until January 31, 2027. The FCC's draft Report and Order of September 9, 2026 (FCC-CIRC 2609-05, https://docs.fcc.gov/public/attachments/DOC-424844A1.pdf) replaces that delayed rule. Under it, a sender may designate one or more of the three per se methods (a key-press or voice opt-out on a call, a reply with one of the seven words, a designated website or phone number) as the exclusive means to revoke, if it "clearly and conspicuously" discloses that method on the call or in the text; a sender that designates none must still honor any reasonable means. A revocation sent in reply to an informational text may be read as covering only that category. The ten-business-day ceiling stays. Its changes take effect 30 days after Federal Register publication. Law-firm reports say the FCC adopted it on September 30, 2026 and that a marketing opt-out still stops all marketing (https://mslawgroup.com/fcc-finalizes-new-tcpa-revocation-rules); no official adopted text or Federal Register date was found, so the eCFR text above still applies until then. The attached Further Notice seeks comment on shortening the 10-day window, requiring two-way texting, mandating a revoke-all method, and how revocation applies to affiliates and divisions.

## STOP and HELP replies

- **Keywords to honor:** the FCC's seven (STOP, QUIT, END, REVOKE, OPT OUT, CANCEL, UNSUBSCRIBE) plus the source's STOPALL and OPTOUT. The source's list missed REVOKE and OPT OUT. A platform's protected keywords are narrower than the legal duty: OneSignal protects `STOP` with the aliases `UNSUBSCRIBE` and `CANCEL` ([keywords](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/onesignal/EMAIL-AND-SMS.md#keywords-and-opt-out)).
- **CTIA practice** (CTIA 2023 §5.1.3): one final confirmation per campaign, then nothing; read normal language ("please opt me out"); use standard STOP wording in the instructions.
- **The source's replies** [coreyhaines31/marketingskills, sms]:

STOP response (after STOP received):
```
You're unsubscribed from [Brand] alerts. No more messages will be sent. Reply HELP for help.
```

HELP response (HELP variants: HELP, INFO):
```
[Brand] alerts: For help, visit [URL] or email [support@brand.com]. Msg & data rates may apply. Reply STOP to cancel.
```

- **The source's handling rules** [coreyhaines31/marketingskills, sms]: "Do not require the recipient to log in or visit a website to opt out"; "One STOP confirmation is allowed; do not send additional messages after"; "HELP responses do not count as marketing messages and are not subject to quiet hours" (the last one was not checked against the FCC rule).

## The opt-out footer

- **Source:** "Reply STOP to opt out (required on opt-in confirmation and at least quarterly thereafter; carrier-recommended on every promotional message)" [coreyhaines31/marketingskills, sms]. No official source for "quarterly" was found; CTIA says senders "should state in the message how and what words effect an opt-out".
- **Repo rule (kept):** "Every body carries the brand name and an opt-out instruction" [OneSignal, Email and SMS source]. Put the footer on every message.

## Quiet hours and Do-Not-Call

- **Federal quiet hours:** no telephone solicitation before 8 a.m. or after 9 p.m. local time at the called party's location (64.1200(c)(1)). The rule covers "telephone solicitation"; OneSignal treats transactional and OTP as generally exempt.
- **Stricter states and other countries:** the preserved [OneSignal jurisdiction guidance](#onesignal-jurisdiction-guidance) below supplies the state table and country hours.
- **The source's default:** "Practical default: 9am-8pm recipient-local for safety" [coreyhaines31/marketingskills, sms]. It calls 9 to 8 "carrier-recommended", which neither CTIA 2023 nor any carrier page fetched for this round says. As a self-imposed window it sits inside every rule above.
- **Time zones:** "Time zone is determined by area code, but area codes lie (people move)." [coreyhaines31/marketingskills, sms]. In OneSignal, a Journey Time Window node uses the recipient's time zone.
- **Do-Not-Call applies to marketing texts to wireless numbers** (64.1200(c)(2), (e)). National registrations are honored indefinitely; company-specific do-not-call requests for 5 years (64.1200(d)(6)).
- **Business numbers:** "Most phone calls to a business made with the intent to solicit sales from that business are exempt from the Do Not Call provisions", and telemarketers sync with the registry "at least every 31 days" (FTC, https://www.ftc.gov/business-guidance/resources/qa-telemarketers-sellers-about-dnc-provisions-tsr).

## Restricted content (SHAFT)

[OneSignal, Email and SMS] Prohibited content includes illegal content, phishing/smishing, fraud and spam.

CTIA's Short Code Monitoring Handbook v1.9, audit tables in §6 (URL above): SHAFT is sex, hate, alcohol, firearms and tobacco. Federally illegal content means the call to action must be removed; legal SHAFT content needs a working age gate. Both are Severity 0 in the short code audit, CTIA's most serious level (P0 on this repo's scale). The source lists SHAFT "without explicit use case" as a common 10DLC rejection. Cannabis is prohibited in the US and Australia [OneSignal, Email and SMS source].

## Outside the US

The law tables (GDPR, CASL, Spam Act, PECR, LGPD) and their unsubscribe deadlines are in [email-practices COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/COMPLIANCE.md#the-laws). The source adds, for texts [coreyhaines31/marketingskills, sms]:

- **EU/UK:** explicit opt-in (no pre-checked boxes), specific to marketing SMS and separate from generic ToS, informed, freely given; withdrawal as easy as giving consent; access and deletion requests cover SMS records.
- **Canada (CASL):** every message includes sender identification (legal name and any operating names), a mailing address, a phone, email or website contact, and an unsubscribe mechanism that works within 10 business days. OneSignal adds bilingual STOP/ARRET and HELP/AIDE.
- **Australia (Spam Act 2003):** express or inferred consent ("inferred has narrow application"), sender ID, a working unsubscribe; enforced by ACMA.
- **Several jurisdictions at once:** "Default to the **strictest** standard across all jurisdictions"; "Track consent jurisdiction per subscriber".

### OneSignal jurisdiction guidance

[OneSignal, Email and SMS] These source-specific jurisdiction claims are relocated intact; this organization change does not revalidate them as current law.

- **US state laws apply by recipient location:**

| State | Rule |
|---|---|
| Florida (FTSA), Oklahoma (OTSA) | Max 3 texts per 24 hours on the same topic; 8 AM to 8 PM |
| Maryland | 3 per 24 h, express written consent, consent logs |
| Washington | 8 AM to 8 PM |
| California | Opt-out response within 15 business days |
| Virginia | Full-name identification |

- **Canada:** bilingual STOP/ARRET and HELP/AIDE; max 320 characters; Quebec marketing in French or bilingual.
- **Country quiet hours for promotional SMS** (recipient-local, OneSignal source): Canada 9 AM - 9 PM; UK and EU 8 AM - 8 PM; Australia 9 AM - 8 PM. The US federal window and scope are in [Quiet hours and Do-Not-Call](#quiet-hours-and-do-not-call). Transactional and OTP are generally exempt in that source.
- **Australia:** unsubscribe must keep working 30 days after sending.
- **Content qualification:** the OneSignal source says CBD is OK in the UK, while cannabis is prohibited in the US and Australia. The existing [SHAFT section](#restricted-content-shaft) owns CTIA’s distinction between legal age-gated and federally illegal content.

### OneSignal consent disclosures

[OneSignal, Email and SMS] The source’s disclosure and purpose qualifications are retained here alongside the law/industry distinctions above:

- **Promotional disclosure:** brand name, recurring automated **marketing** messages, frequency, "Msg & data rates may apply", STOP, ToS and Privacy links, and that consent is not a condition of purchase. Pre-checked checkboxes are non-compliant everywhere. By origin: the TCPA's prior express written consent is a signed agreement that names the seller and the number and says signing is not a condition of purchase (47 CFR 64.1200(f)(9), https://www.ecfr.gov/current/title-47/chapter-I/subchapter-B/part-64/subpart-L/section-64.1200); the confirmation contents (program name, HELP or care contact, how to opt out, frequency, fees) are CTIA's (Messaging Principles 2023 §5.1.2.1).
- **Transactional and OTP consent:** phone entry in a form with a visible disclosure near the field (brand, the specific message types, "Msg & data rates may apply", STOP). A phone number alone is not consent; consent covers only the stated purpose, so don't mix in "updates and offers" language. Under the TCPA an informational text (an event reminder the person signed up for) needs prior express consent, oral or written; adding a promotion makes it marketing, which needs written consent (FCC, https://docs.fcc.gov/public/attachments/DOC-393514A1.pdf, n.48).

Consent is not transferable; keep timestamped opt-in and opt-out records. Every message body carries the brand and an opt-out instruction, and content matches the approved use case [OneSignal, Email and SMS]. Platform settings and protected keywords remain in [onesignal EMAIL-AND-SMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/onesignal/EMAIL-AND-SMS.md#sms-consent).

## No cold texting

SMS and WhatsApp are not cold-outreach channels: US SMS needs consent and the applicable [sender-type registration](REGISTRATION.md#what-registration-covers), and WhatsApp needs opt-in [coreyhaines31/marketingskills, cold-email]. Booking reminders by text go only to people who consented. The source's blanket 10DLC requirement for US SMS is corrected in that registration owner. [https://www.twilio.com/docs/messaging/compliance/a2p-10dlc] Cold outreach itself is in [cold-outreach SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cold-outreach/SKILL.md).

## Audit checklist

Adapted from the source [coreyhaines31/marketingskills, sms]; the footer line follows the repo rule, and the source's "typically 4+ years US" retention figure is dropped as unverified.

- [ ] A2P 10DLC registration complete (US, if applicable)
- [ ] Opt-in flow includes all required disclosures, adjacent to phone field
- [ ] Disclosure text matches A2P registered sample messages
- [ ] Opt-in event captures: timestamp, IP, page URL, exact disclosure shown
- [ ] The FCC's seven revocation keywords and free-text revocations are honored, with one confirmation text
- [ ] Quiet hours enforced at platform level (recipient-local time)
- [ ] Privacy policy includes SMS section
- [ ] Terms of service include SMS terms
- [ ] Consent records retained per applicable law
- [ ] Process for handling DSARs (EU) and consent revocation
- [ ] Sender identity in every message
- [ ] Opt-out instruction in every message
- [ ] Test STOP/HELP from a real phone number quarterly to verify it still works

## Prove it

- A marketing opt-in record shows the timestamp, page URL and the exact disclosure, including "not a condition of purchase"; the checkbox was unchecked by default.
- Replying "opt out", "revoke" and "please stop texting me" from a test phone each ends marketing texts and returns one confirmation with no marketing, within 5 minutes.
- No promotional text left before 8 a.m. or after 9 p.m. recipient-local time (or the stricter state window).
- Every message body carries the brand name and an opt-out instruction; a one-way sender's texts also name another way to revoke.
- A request "can I text everyone who gave a number at checkout?" is answered no for marketing, with transactional texts separated out.
