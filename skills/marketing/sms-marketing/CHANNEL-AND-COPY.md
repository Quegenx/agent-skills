# Channel, copy and measurement

When a text earns the interruption, how to write one that fits a segment, and what to measure, from the source's main skill [coreyhaines31/marketingskills, sms]. Its benchmark ranges are the source's own figures for DTC ecommerce, not platform rules; they are labelled that way below. Sequences are in [SEQUENCES.md](SEQUENCES.md); number types and throughput in [REGISTRATION.md](REGISTRATION.md).

## Before starting

Read `.agents/product-context.md` first if it exists (defined in [anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md); the source names it `.agents/product-marketing.md`), and ask only what it doesn't cover [coreyhaines31/marketingskills, sms]:

1. **Business type:** B2C ecom/DTC, B2B SaaS, mobile app, services, fintech; order volume or list size; geographic mix ("US, EU, both - compliance differs dramatically").
2. **Current state:** existing SMS program (platform, list size, opt-in rate, opt-out rate, revenue per send); the email program ("SMS works best as a layer on top, not a replacement"); number type (short code, toll-free, 10DLC).
3. **Compliance posture:** applicable registration for the selected [sender type](REGISTRATION.md#what-registration-covers); the opt-in mechanism (checkbox, keyword, double opt-in); SMS disclosures in the privacy policy and terms. [https://www.twilio.com/docs/messaging/compliance/a2p-10dlc]
4. **Goal:** revenue (promotional, cart recovery, post-purchase), activation (welcome, onboarding, milestone nudges) or transactional (order updates, auth codes, alerts).

## When SMS beats email

| Use case | SMS or email? | Why |
|---|---|---|
| Abandoned cart recovery | **SMS first** | The source reports a 98% open rate within 3 minutes versus 20% for email in 24h |
| Order/shipping updates | **SMS** | Customers want it now, on their phone |
| Flash sale / limited drop | **SMS** | Urgency channel; immediate read |
| Auth codes / 2FA | **SMS** (or app) | Latency-sensitive, must arrive in seconds |
| Welcome series | **Email primary, SMS layer** | Email carries the long-form content |
| Educational nurture | **Email** | Too much text for SMS, costs add up |
| Newsletter | **Email** | Wrong channel for SMS |
| Win-back lapsed customers | **Both** | SMS for the strong nudge, email for the offer detail |
| Post-purchase upsell | **SMS** | Ride the purchase momentum |

"SMS earns the right to interrupt because of opt-in. Use it for messages that genuinely benefit from immediacy. If it could wait 24 hours, send it via email." [coreyhaines31/marketingskills, sms]. Outside the US, check [WHATSAPP.md](WHATSAPP.md) first. Email sequences are in [email-marketing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/email-marketing/SKILL.md).

## Principles

[coreyhaines31/marketingskills, sms]

- **Every send has a real cost.** At Twilio's $0.0083 per segment plus carrier fees ([REGISTRATION.md](REGISTRATION.md#per-message-price)), a 100,000-text send costs at least $830 before carrier fees. "This forces relevance - you can't 'blast.' Segment hard."
- **Opt-in quality beats volume:** "A high-quality SMS list of 10K beats a low-quality list of 100K." The source puts email-to-SMS opt-in at "typically 5-25%".
- **Each message must justify itself:** "would I be glad I got this text?" If no, don't send.
- **Sender identity every send:** "From [Brand]:" or a branded short code at the start of every message, automated flows included; recipients can't see a "from" address.

## Copy structure

1. **Sender ID** ("From Acme:" or brand short code), required.
2. **Hook:** "first 5 words decide if they read on".
3. **Value:** what's in it for them, specifically.
4. **CTA + link:** a single action, a single URL.
5. **Opt-out footer** on every message. The source asks for it on the opt-in confirmation and "at least quarterly thereafter"; the repo rule is every message ([COMPLIANCE.md](COMPLIANCE.md#the-opt-out-footer)).

### One CTA, one link

The source says "Short links are mandatory (`klvy.co`, `txt.attn.tv`, branded short domain)" and "Track UTM params on every link". OneSignal adds: "Don't use `bit.ly`, `tinyurl.com` or `goo.gl` (US carriers block them); use UTM parameters or branded domains" ([onesignal EMAIL-AND-SMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/onesignal/EMAIL-AND-SMS.md#composing-sms-mms-rcs)). Both hold together: shorten only on a branded or platform-owned domain.

### Length and segments

- **160 GSM-7 characters = 1 segment;** ordinary multi-part messages carry 153 each. UCS-2 carries 70, or 67 per part. Billing is per segment. For US/Canada toll-free multipart SMS, Twilio instead specifies 152 GSM-7 or 66 UCS-2 characters per segment. Count the actual final message with the provider's segment calculator. [https://www.twilio.com/docs/glossary/what-sms-character-limit]
- **A character outside GSM-7 can switch the message to UCS-2.** GSM-7 includes accented letters such as é and à; the old line and source summary incorrectly treated accented characters as universally UCS-2. Curly quotes and emoji are examples outside GSM-7. Preserve the source's 200-character GSM-7 example as two ordinary segments, and recount after substitutions and footers. [https://www.twilio.com/docs/glossary/what-is-gsm-7-character-encoding; https://www.twilio.com/docs/glossary/what-sms-character-limit]
- **Ordinary GSM-7 messages of 161 to 306 characters = 2 segments:** "Acceptable for richer messages, but you're paying double per send." Apply the toll-free exception above where relevant. [source; https://www.twilio.com/docs/glossary/what-sms-character-limit]
- **One emoji switches the whole message to UCS-2,** so a 100-character text with an emoji is 2 segments. The source recommends at most one emoji per message; preview the segment count before sending and multiply the extra segments by the list size.
- **MMS** carries an image and up to 1,600 characters; the source puts it at "3-5x the SMS cost" (Twilio lists $0.022 per MMS against $0.0083 per SMS segment). "Use sparingly for high-impact moments."

### Voice and personalization

[coreyhaines31/marketingskills, sms]

- "Conversational, not corporate." No subject line, no formatting, no marketing-speak.
- Emojis in moderation (one per message, situationally); ALL CAPS only for explicit codes ("Use ACME10").
- First-name token if available (the source claims it "boosts CTR ~20%"), recent browse, location where it applies. "Don't fake intimacy ('Hey friend!') - it backfires."
- Text copy in general: [anti-slop-copy SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md).

## Measurement

The source's "healthy range (ecom DTC)" column is its own benchmark, not a platform rule.

| Metric | What it tells you | The source's range |
|---|---|---|
| Opt-in rate | Top of funnel health | 5-25% of email subscribers |
| CTR | Message relevance | 8-15% (vs ~3% email) |
| Conversion rate per send | Revenue impact | 1-5% per promotional send |
| Revenue per send | Channel economics | $0.20-$2.00 |
| Opt-out rate per send | Audience fatigue | <2% per send, <0.5% for promotional |
| List growth rate | Audience momentum | 5-15%/month early, 1-3% steady-state |

- **Tag every link:** `utm_source=sms&utm_medium=sms&utm_campaign=[campaign-name]`. Attribution across channels is in [marketing-attribution SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-attribution/SKILL.md).
- **Compare** SMS subscribers' LTV with email-only subscribers' (the source claims "typically 1.5-3x").
- **Rising opt-outs** usually mean over-sending: cut frequency, segment by engagement, and run the re-engagement flow in [SEQUENCES.md](SEQUENCES.md#re-engagement). Each send's opt-outs shrink the list for every later send.
- **What to A/B test:** send time (afternoon versus evening, local), copy length (SMS versus MMS), discount amount and trigger, first-name token or not, CTA copy. Test design is in [ab-testing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SKILL.md).

## The plan to return

When asked for an SMS plan [coreyhaines31/marketingskills, sms]:

1. **Compliance check:** selected sender type [registered as applicable](REGISTRATION.md#what-registration-covers)? Opt-in compliant? "Flag blockers first." [https://www.twilio.com/docs/messaging/compliance/a2p-10dlc]
2. **Strategy:** which flows to build first, ranked for the business model.
3. **Sequence designs:** trigger, delay, copy with character counts, CTA, segmentation per flow.
4. **Platform:** from the stack, list size and complexity. The source's vendor comparisons (Klaviyo, Postscript, Attentive, Twilio, Brevo, SimpleTexting, Plivo, AudienceTap, Customer.io) were not checked against vendor pages and are left out; OneSignal setup is in [onesignal EMAIL-AND-SMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/onesignal/EMAIL-AND-SMS.md).
5. **Measurement plan:** KPIs, the source's benchmarks labelled as such, an A/B test queue.
6. **Required disclosures** and STOP/HELP replies ([COMPLIANCE.md](COMPLIANCE.md#stop-and-help-replies)).

"Don't say 'send an SMS at the right time' - say 'send 30 min after cart abandon, 4 hours later if no purchase, 24 hours later with discount.'"

## Common mistakes

[coreyhaines31/marketingskills, sms]

1. Skipping applicable registration: "Register first, send second." The source's blanket 10DLC wording did not distinguish number types; use [the registration correction](REGISTRATION.md#what-registration-covers). [https://www.twilio.com/docs/messaging/compliance/a2p-10dlc]
2. Treating SMS like email, with daily promotional blasts.
3. A discount on the first cart text: "trains customers to always abandon."
4. A generic "From: [shortcode]": the brand name belongs in the message.
5. Forgetting quiet hours.
6. No STOP/HELP handling: "Every platform handles this; verify yours does."
7. Emojis everywhere: UCS-2 halves the segment size.
8. Sample messages that don't match live sends: "carriers flag and block."
9. Not tracking conversions.
10. Burst sends above the registered throughput.

## Prove it

- The plan names the channel for each message, and every message that could wait 24 hours goes by email.
- Each draft shows its encoding, character count and segment count, and the cost line multiplies segments by list size.
- Every benchmark in the plan is labelled as the source's figure.
- Every link is on a branded or platform domain with UTM parameters.
