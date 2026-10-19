# Handling replies

"The sequence's job ends when someone replies. What happens in the next hour decides whether that reply becomes a meeting." [coreyhaines31/marketingskills, cold-email] references/reply-handling.md. Deal-stage objections (pricing negotiation, security reviews, bake-offs) are in [sales-enablement SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sales-enablement/SKILL.md); lead routing and the outbound stage model are in [revops SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/revops/SKILL.md).

## Classify every reply

[coreyhaines31/marketingskills, cold-email]

| Type | Looks like | Action |
|---|---|---|
| Positive | "Sure, let's talk", "Send times", "Tell me more" | Respond fast, propose times, book |
| Information request | "What does it cost?", "Do you work with X?" | Answer the actual question briefly, then offer a call |
| Objection | "We already use X", "No budget", "Not a priority" | Respond once (below) |
| Not now | "Reach out next quarter" | Thank them, set a reminder for the date they gave, stop the sequence |
| Referral | "Talk to Sam, she owns this" | Thank them; contact Sam citing the referral (ask permission to use their name if unclear) |
| Wrong person, no referral | "Not my area" | Ask once who owns it; otherwise stop |
| Out of office | Auto-reply | Pause; resume after their return date; note any named stand-in |
| Unsubscribe or hostile | "Remove me", "Stop", anger | Suppress on every channel immediately. Apologize briefly if you reply at all. Never argue |
| Bounce | Delivery failure | Remove; check whether the contact moved companies (a possible job-change signal) |

Every reply of any type stops all other channels for that person ([SEQUENCES.md](SEQUENCES.md#rules-that-hold-any-cadence-together)).

## Speed

[coreyhaines31/marketingskills, cold-email] Answer positive replies within minutes during business hours. The source notes the famous speed-to-lead studies are old (2007 to 2011) "but the direction holds". Route positive replies to a person at once (a chat or phone notification) and keep someone responsible every working hour.

## Booking

[coreyhaines31/marketingskills, cold-email]

- **Propose two specific times** in their time zone, plus a booking link as a fallback ("or grab any time here"); a bare link "can feel like homework".
- **Send the invite immediately** once they pick, with a one-line agenda.
- **Confirm the day before** with something useful: the agenda, a relevant case study, or the teardown you'll discuss.
- **Remind an hour before** by email, or by SMS only if they agreed to texts.
- **Reschedule a no-show the same day,** warmly, once. A second no-show goes back to nurture.

## Early objections

[coreyhaines31/marketingskills, cold-email] Early objections are usually reflexes: answer once, briefly, and make it easy to say no.

| Objection | Response approach |
|---|---|
| "We already use [competitor]" | Acknowledge it. Name the one situation where teams like theirs still look elsewhere. Ask if it applies |
| "No budget" | Ask when they plan budgets, or offer something that needs none (an audit, a benchmark) |
| "Not a priority" | Ask what is a priority this quarter; if unrelated, step back and set a reminder |
| "Send me more info" | Send one specific thing (a one-pager or a two-minute video) and one easy question |
| "How did you get my email?" | Answer honestly with the actual source, and offer to remove them |

The last row is a courtesy in the source and a legal duty for EU and UK contacts: GDPR Art. 14 requires the source of data not collected from the person to be given "at the latest at the time of the first communication" (https://gdpr-info.eu/art-14-gdpr/), which is why the source is recorded per contact ([prospecting LIST-COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/LIST-COMPLIANCE.md#provenance)).

## What an agent can handle

[coreyhaines31/marketingskills, cold-email]

| Reply type | Agent alone | Agent drafts, human sends |
|---|---|---|
| Out of office | Pause and reschedule | |
| Unsubscribe | Suppress everywhere | |
| Bounce | Remove, flag for a job-change check | |
| Not now | Set the reminder, stop the sequence | A polite acknowledgment |
| Positive | | Until accuracy is proven over 100+ replies and the approved sending policy permits it |
| Information request | | Yes |
| Objection | | Yes |
| Referral | | Yes |
| Hostile | Suppress | Any reply at all |

**Source approval conflict:** the source's acceptance expectation and original [outbound-operator approval table](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-loops/OUTBOUND-OPERATOR.md#approval-rules-defaults) extended the 100+ reply condition to positive, information, objection and referral replies. This source's reply table only gave that exception to positive replies; the other three remain human-sent. Keep that stricter table boundary until an explicitly approved policy changes it. A reply count alone neither proves accuracy nor grants sending permission. [coreyhaines31/marketingskills, cold-email and marketing-loops; owner standing rule 15]

Before an agent sends anything alone: every claim in the draft matches an approved source, nothing from your banned-phrase list appears, and a daily cap applies. Sample-review a share of autonomous replies every week. Building these as code gates around the agent's send tool is in [agent-harness CHECKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-harness/CHECKS.md).

## Log it

[coreyhaines31/marketingskills, cold-email] On the CRM contact: reply type, date, the sequence and step that produced it, the signal and channel, and the outcome. That makes a weekly sequence review possible ([marketing-loops SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-loops/SKILL.md)).

## Prove it

A test reply of each of the nine types lands in the right row and triggers its action; an unsubscribe suppresses the contact on email, LinkedIn and phone before the next scheduled touch; positive replies remain human-sent until accuracy over 100+ replies and an approved sending policy permit otherwise; information, objection and referral replies remain human-sent under the stricter table above; every autonomous send passed the claims, banned-phrase and daily-cap checks; and "How did you get my email?" is answered from the contact's recorded source.
