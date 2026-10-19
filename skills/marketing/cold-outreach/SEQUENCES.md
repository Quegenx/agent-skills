# Sequences and cadences

A sequence is the series of emails to one person; a cadence coordinates email, LinkedIn, calls and the occasional video or package so each touch builds on the last "and nobody gets hit on four channels in one afternoon" [coreyhaines31/marketingskills, cold-email]. Lifecycle sequences to people who opted in are in [email-marketing SEQUENCES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/email-marketing/SEQUENCES.md). Account tiers are defined in [prospecting SIGNALS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/SIGNALS.md#account-tiers).

**Contents:** [How many and when](#how-many-and-when) · [Angle rotation](#angle-rotation) · [The breakup email](#the-breakup-email) · [Phrases that kill replies](#phrases-that-kill-replies) · [Channels by tier](#channels-by-tier) · [A 21-day Tier 1 cadence](#a-21-day-tier-1-cadence) · [Rules that hold any cadence together](#rules-that-hold-any-cadence-together) · [Calls](#calls) · [Video, direct mail and ads](#video-direct-mail-and-ads) · [SMS and WhatsApp](#sms-and-whatsapp) · [Measure by channel](#measure-by-channel) · [Prove it](#prove-it)

## How many and when

[coreyhaines31/marketingskills, cold-email] references/follow-up-sequences.md. The source's figures are vendor data as attributed: Belkins' "highest single-email reply rate: 8.4%"; Woodpecker (20M emails) "4-7 email campaigns achieve 27% reply rates vs 9% for 1-3 emails"; and "By 4th follow-up, response rates drop 55% and spam complaints triple". Its resolution: cap at 4 follow-ups (5 emails in all), each adding real new value.

| Touch | Day | Notes |
|---|---|---|
| Initial email | 0 | The most personalization effort |
| Follow-up 1 | 3 | The source: waiting 3 days "increases response by up to 31%" |
| Follow-up 2 | 7 to 8 | Different angle |
| Follow-up 3 | 14 | New value piece |
| Follow-up 4 | 21 to 28 | Breakup email |

The source's timing: Tuesday to Thursday, 9 to 11 AM or 1 to 3 PM in the prospect's local time; avoid Monday mornings and Friday afternoons. Follow-ups count toward daily sending volume.

## Angle rotation

[coreyhaines31/marketingskills, cold-email] Each follow-up stands alone (they may not have read the earlier ones) and adds one new value proposition per email (crediting SalesBread). Never just "bump this up".

| Email | Angle | Purpose |
|---|---|---|
| Initial | Personalized hook + core value prop + soft CTA | Introduce the problem and solution |
| Follow-up 1 | A different angle, a new value piece (stat, insight, resource) | Show another benefit |
| Follow-up 2 | Social proof or a case study from a similar company | Credibility |
| Follow-up 3 | A new insight, trend or resource | Expertise |
| Follow-up 4 | Breakup: acknowledge the silence, leave the door open | Close the sequence |

**CTA by seniority:** executives and founders get ultra-low-effort asks ("Curious?", "Worth 2 min?"); mid-level managers get more specific value. "Higher in the org chart = less friction you can ask for."

## The breakup email

[coreyhaines31/marketingskills, cold-email] Structure: acknowledge you've written several times, accept they may not be interested, say this is your last email for now, leave the door open. The source cites Close.com for "10-15% response rates" from breakup emails (vendor data).

> I haven't heard back, so I'll assume now isn't the right time. Before I close the loop: [1-sentence insight or resource]. If that changes things, feel free to reply. Otherwise, no hard feelings. Good luck with [their goal].

The 1-2-3 format:

> Since I haven't heard back, I'll keep it simple. Reply with a number:
>
> 1: Interested, let's talk
> 2: Not now, check back in 3 months
> 3: Not interested, please stop

"If you send a breakup email, honor it. Do not contact the prospect again." A "3" is an opt-out on every channel.

## Phrases that kill replies

[coreyhaines31/marketingskills, cold-email] "I never heard back" (the source cites Gong for a 12% drop in meeting bookings); "Just checking in"; "Bumping this to the top of your inbox"; "Did you see my last email?"; "Following up on my previous message".

## Channels by tier

[coreyhaines31/marketingskills, cold-email] references/multichannel-cadence.md.

| Tier | Channels |
|---|---|
| Tier 1 (1:1) | Email, LinkedIn, phone, personalized video; direct mail after engagement |
| Tier 2 (1:few) | Email and LinkedIn; phone for the best-fit accounts |
| Tier 3 (1:many) | Email; LinkedIn only without third-party automation ([LINKEDIN.md](LINKEDIN.md#the-user-agreement-on-automation)) |

## A 21-day Tier 1 cadence

[coreyhaines31/marketingskills, cold-email]

| Day | Touch |
|---|---|
| 1 | Email 1 (short, no link) |
| 3 | LinkedIn connection request |
| 4 | Email 2, as a reply in the same thread |
| 6 | Call 1. If no answer, a short voicemail and an email recapping it |
| 8 | LinkedIn message if connected; otherwise a short personalized video by email |
| 11 | Email 3: new angle or a case study |
| 13 | Call 2 |
| 15 | LinkedIn voice note or a comment on a new post |
| 18 | Email 4: breakup or referral ask |
| 21 | Call 3 only if no breakup was sent; subsequent nurture and ad retargeting require their own permission and cannot follow a breakup |

Tier 2: email and LinkedIn over about 14 days. Tier 3: the email sequence alone.

**Source conflicts:** the original Day 1 also views the LinkedIn profile and engages with a post, conflicting with the no-two-channels rule below; do not combine those actions here. Its Day 21 call/nurture/retargeting follows a possible Day 18 breakup, conflicting with the stop-after-breakup rule. Keep the existing stop. Every emailed video and voicemail recap also counts toward the five-email cap; this source table cannot authorize extra emails beyond it. [coreyhaines31/marketingskills, cold-email, follow-up-sequences.md and multichannel-cadence.md]

## Rules that hold any cadence together

[coreyhaines31/marketingskills, cold-email]

1. **A reply on any channel stops every channel.** "This needs one shared record of who has replied, checked before each touch."
2. **An opt-out on one channel is an opt-out on all of them.** Key the suppression list on email, LinkedIn URL and phone together ([prospecting ENRICHMENT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/ENRICHMENT.md#suppression-list)). The repo's email rule, "Hard bounces and complaints suppress across all email types", covers email types ([email-practices LISTS-AND-CAPTURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/LISTS-AND-CAPTURE.md#suppression-list)); this extends it across channels.
3. **One sender per account at a time.** Two reps, or a rep and an agent, on the same company "looks disorganized and doubles the annoyance".
4. **Each touch may reference the last** ("Following up on the voicemail I left Tuesday") but must make sense alone.
5. **At most 5 emails and at most 3 LinkedIn messages.** The source's multichannel reference instead says 4 to 7 emails; keep the existing five-email cap from its follow-up reference, including emailed videos and voicemail recaps. "More touches don't rescue the wrong offer." [coreyhaines31/marketingskills, cold-email, follow-up-sequences.md and multichannel-cadence.md]
6. **Space touches across days.** Never two channels on one day except a voicemail and its recap email.

When email, LinkedIn and calls run in different tools, connect them with shared state (the CRM or a table keyed on the contact) and webhooks that pause every sequence when any reply arrives. Webhook handling is in [third-party-integrations CALLS-AND-SYNC.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/third-party-integrations/CALLS-AND-SYNC.md#webhooks-from-providers).

## Calls

[coreyhaines31/marketingskills, cold-email] The source cites 2025 vendor and agency datasets for a dial-to-conversation rate "around 10%" and about one meeting per several hundred dials.

- **Times:** mid-week, mid-to-late afternoon in their time zone; test your own.
- **Attempts:** 3 per contact across the cadence, on different days and times.
- **Openers:** say who you are and why you're calling, then ask permission to continue. Avoid "Did I catch you at a bad time?".
- **Voicemail:** 20 to 30 seconds, your name, one specific reason, "I'll send you a note too", then send it.
- **Do Not Call:** scrub against the Do Not Call lists before calling; the rules are in [email-practices COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/COMPLIANCE.md#texts-and-calls-us).
- **AI voice needs consent.** FCC 24-17: the TCPA's "artificial or prerecorded voice" restrictions "encompass current AI technologies that generate human voices" and such calls "therefore require the prior express consent of the called party to initiate such calls absent an emergency purpose or exemption" (https://docs.fcc.gov/public/attachments/FCC-24-17A1.pdf). The source said "never use AI voice on US mobile numbers without consent"; the ruling is not limited to mobile numbers (the TCPA's artificial-voice prohibition it cites also covers "any residential telephone line").

Call scripts, gatekeepers and objection handling are in [sales-enablement SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sales-enablement/SKILL.md).

## Video, direct mail and ads

[coreyhaines31/marketingskills, cold-email]

- **Video:** 60 to 120 seconds for outreach, 2 to 4 minutes for a teardown. Show their site, product or dashboard in the first seconds; send a thumbnail or GIF of their page linked to the video, never the file. Tier 1 only, or after a reply.
- **Direct mail and gifts:** for Tier 1 accounts that engaged and stalled; something tied to the conversation (a book you mentioned, a printed teardown) beats a generic gift. Check company gift policies, which often cap or ban gifts in regulated industries and government.
- **Ads to target accounts:** upload account and contact lists to the ad platform's matched audiences and run light awareness ads during the cadence, so the name is familiar when the email lands ([paid-ads SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/SKILL.md)).

## SMS and WhatsApp

[coreyhaines31/marketingskills, cold-email] Not for cold outreach. US SMS needs consent and the applicable [sender-type registration](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sms-marketing/REGISTRATION.md#what-registration-covers); WhatsApp business messaging needs an opt-in. Use them only after a prospect engaged and agreed, for scheduling and reminders. SMS consent is in [sms-marketing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sms-marketing/SKILL.md). The source required 10DLC for all US mobile SMS; the registration owner records Twilio's official scope and that correction. [https://www.twilio.com/docs/messaging/compliance/a2p-10dlc]

## Measure by channel

[coreyhaines31/marketingskills, cold-email] Per channel and step: touches sent, replies, positive replies, meetings. Attribute the meeting to the touch that produced the reply and keep the whole sequence on the record. "A channel that never produces a positive reply after a few hundred touches is costing more than it returns."

## Prove it

The sequence has at most 5 emails with growing gaps and each one reads on its own; nothing after a breakup email goes out; a test reply on LinkedIn pauses the email and call steps for that person before the next scheduled touch; an opt-out on any channel lands in the one suppression list keyed on email, LinkedIn URL and phone; no two channels touch one person on the same day except a voicemail and its recap; no AI-voiced call goes to anyone without prior express consent; and no SMS or WhatsApp goes to someone who hasn't agreed.
