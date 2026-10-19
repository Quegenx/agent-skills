# Registration and throughput (US)

Texting from a US 10-digit long code (10DLC) needs a registered brand and campaign with The Campaign Registry (TCR), done through the SMS provider, and the brand's Trust Score then decides how many messages per second (MPS) each carrier accepts. Unregistered 10DLC traffic is blocked, not slowed. The figures below are Twilio's (fees from August 2025, MMS limits from March 2026); other providers pass through the same TCR and carrier rules but may price them differently. OneSignal's sender types, approval times and registration contents are in [onesignal EMAIL-AND-SMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/onesignal/EMAIL-AND-SMS.md#sms-registration); consent rules are in [COMPLIANCE.md](COMPLIANCE.md).

## What registration covers

[coreyhaines31/marketingskills, sms]

1. **Brand registration:** legal entity name, EIN, business type; a trust score is assigned.
2. **Campaign registration** (one per use case): use case (Marketing, Account Notification, Customer Care, Public Service, Higher Education, Polling and Voting, 2FA, Delivery Notification, etc.), sample message text (must match what you actually send), opt-in flow description and screenshot, opt-out language, help message language, volume estimate.
3. **Phone number assignment** to campaigns.

Twilio's overview: https://www.twilio.com/docs/messaging/compliance/a2p-10dlc

A2P 10DLC registration covers application SMS/MMS using 10-digit long-code numbers to US recipients. Toll-free and short-code numbers are outside that system and follow their applicable requirements; Twilio also documents using Verify for verification-only traffic instead of direct A2P 10DLC registration. The old cross-skill summaries required 10DLC for all US SMS, including transactional texts; select the actual [number type](#number-types) rather than applying that blanket claim. [https://www.twilio.com/docs/messaging/compliance/a2p-10dlc]

## Fees

From Twilio (https://help.twilio.com/articles/1260803965530). The source said "~$15 brand + $10/mo per campaign"; $15 is the campaign vetting fee, not a brand fee.

| Item | Fee |
|---|---|
| Brand registration | $4.50 (TCR raised it from $4.00 on Aug 1, 2025) |
| Standard brand vetting | $41.50 |
| Campaign vetting | $15 |
| Monthly campaign fee | $10 Standard, $2 Sole Proprietor, $1.50 Low-Volume Mixed, $3 Charity, $5 Emergency |

Each tax ID may register up to five Standard or Low-Volume Standard brands; more register, but their campaigns may be rejected at vetting without a clear business reason (Twilio's A2P 10DLC overview above).

## Throughput by Trust Score

The OneSignal source describes long codes as 3 to 225 MPS; Twilio’s score table below gives a 3.75 MPS low-volume convention and the 225 total at Trust Score 75 to 100 (75 each to AT&T, T-Mobile and Verizon). Keep the source range as a provider summary, and plan from the specific carrier table. OneSignal application timings and registration setup remain in [onesignal EMAIL-AND-SMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/onesignal/EMAIL-AND-SMS.md#sms-registration).

From Twilio (https://support.twilio.com/hc/en-us/articles/1260803225669). The source's table ("Verified brand 75-100+ msg/sec / Standard 4-10 / Unregistered 0.1 msg/sec or blocked") is stale.

| Trust Score | SMS MPS per major carrier (AT&T, T-Mobile, Verizon) | Total |
|---|---|---|
| 75 to 100 | 75 | 225 |
| 50 to 74 | 40 | 120 |
| 1 to 49 | 4 | 12 |

- **Low-Volume Mixed** campaigns get 3.75 MPS.
- **Sole Proprietor** brands get 1 MPS, 1,000 messages a day to T-Mobile and 15 a minute to AT&T.
- **Declared use cases** can get higher MPS than Mixed or Marketing at the same Trust Score.
- **Smaller carriers:** US Cellular is capped at 8 MPS; minor carriers get 1 MPS per number.
- **T-Mobile caps each brand per day** (per EIN), across every platform the brand sends from; going over returns error 30023 (https://www.twilio.com/docs/api/errors/30023).
- **MMS** (from March 18, 2026, https://www.twilio.com/en-us/changelog/increased-mms-rate-limits-for-a2p-10dlc-phone-numbers-in-the-u-s0): 40, 20 and 5 MPS per major carrier at Trust Score 75 and up, 50 to 74, and under 50; Sole Proprietor 0.5 MPS.
- **Time to send** is volume divided by MPS: 100,000 texts at 225 MPS take about 7.4 minutes, at 12 MPS about 2.3 hours. Check the T-Mobile daily brand cap and the quiet-hours window before promising a send time.
- **Don't burst:** "No throttling on bulk sends - burst sends trigger carrier filtering. Use platform throttling." [coreyhaines31/marketingskills, sms]. This means sending at the registered rate, not getting around it.

## Unregistered traffic

Twilio began blocking unregistered 10DLC traffic in phases on July 5, 2023 and blocked it fully on August 31, 2023 (https://www.twilio.com/en-us/blog/next-chapter-a2p-messaging-at-twilio). The source said unregistered traffic is "throttled (or zero)" and "Required since 2022"; no fetched source states 2022. The source's warning still applies: "You'll see 'delivered' status but recipients won't get them" [coreyhaines31/marketingskills, sms].

## Per-message price

Twilio's US page (https://www.twilio.com/en-us/sms/pricing/us) shows $0.0083 per SMS segment and $0.022 per MMS, for long code, toll-free and short code alike, and $1.15 a month for a long code; carrier fees are extra. The source quoted "$0.0079 per message" and "MMS ~$0.02". Segments are counted per [CHANNEL-AND-COPY.md](CHANNEL-AND-COPY.md#length-and-segments).

## Number types

| Type | Throughput | Notes |
|---|---|---|
| Short code (5 to 6 digits) | 100+ MPS ([OneSignal](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/onesignal/EMAIL-AND-SMS.md#sms-model-and-setup)) | Highest trust, weeks to months to approve |
| Toll-free | 3 MPS default, up to 25+ (OneSignal) | One number covers US and Canada |
| 10DLC | 3.75 to 225 MPS by Trust Score (above) | Needs TCR registration |

The source's 10DLC range "1-250 msg/sec" overstates the top: Twilio's maximum is 225.

## Common rejections

[coreyhaines31/marketingskills, sms]

- Sample message text doesn't match actual sends
- Opt-in flow screenshot doesn't show required disclosure language
- "SHAFT" content (Sex, Hate, Alcohol, Firearms, Tobacco) without explicit use case ([COMPLIANCE.md](COMPLIANCE.md#restricted-content-shaft))
- Generic or vague campaign descriptions

## Approval time

- **Source:** "Process time: 1-7 business days" [coreyhaines31/marketingskills, sms].
- **OneSignal:** "10DLC 1 to 3 weeks" ([onesignal EMAIL-AND-SMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/onesignal/EMAIL-AND-SMS.md#sms-registration)).
- No official page fetched for this round confirms either. Plan for the longer one.

## What the platform should handle

[coreyhaines31/marketingskills, sms]

- [ ] Brand and campaign registration with TCR
- [ ] Sample message text aligned with what you actually send
- [ ] Opt-in flow documentation submitted to carriers
- [ ] Trust score visibility (and a path to improve it)
- [ ] Throughput appropriate to your list size and send frequency
- [ ] STOP/HELP keyword handling
- [ ] Quiet hours by recipient time zone
- [ ] Suppression list management
- [ ] Consent record retention with timestamps

Twilio handles standard English long-code opt-out replies by default. Messaging Services Advanced Opt-Out can configure opt-in, opt-out and help responses and supplies the webhook's opt-out classification; it is disabled by default and toll-free behavior has separate constraints. Check the actual provider configuration, synchronize suppression and do not send a second confirmation when Twilio already replied. The source instead said raw APIs such as Twilio leave all STOP/HELP handling to the application. [https://www.twilio.com/docs/messaging/tutorials/advanced-opt-out]

The application still needs the agreed quiet-hours policy, consent records and suppression handling for its complete program; provider opt-out handling alone does not implement that whole checklist. [coreyhaines31/marketingskills, sms; COMPLIANCE.md]

## Prove it

- For US 10DLC application traffic, the brand and every campaign show as registered at the provider before the first send, and the sample messages match the live templates word for word; other sender types follow their applicable requirements.
- The planned send volume divided by the campaign's MPS fits inside the quiet-hours window and under T-Mobile's daily brand cap.
- No error 30023 appears in the delivery logs after a large send.
