---
name: email-marketing
description: "Plans and writes consented email sequences and lifecycle programs: welcome, lead nurture, onboarding, re-engagement, retention, usage, win-back and campaigns, with triggers, exit conditions, timing, copy, segments and conversion metrics. Use when designing or auditing an email sequence, writing lifecycle emails, or planning an email campaign."
---

# Email marketing

A sequence starts on a trigger and stops on a goal or an exit condition. This skill plans the flow and writes the emails from the coreyhaines31/marketingskills `emails` skill (MIT), with its source tags and named official corrections; campaign copy conventions also retain [resend/email-best-practices]. Consent, delivery, capture, suppression and accessible markup belong to [email-practices](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/SKILL.md); provider operations to [Resend](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/resend/SKILL.md) or [OneSignal](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/onesignal/SKILL.md); templates to [React Email](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/react-email/SKILL.md). Cold outreach is [cold-outreach](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cold-outreach/SKILL.md).

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Scope, routing and the rules | [SKILL.md](SKILL.md) |
| Welcome, lead nurture, onboarding, re-engagement, entry and exit, copy, subject and preview, personalization, testing and the output template | [SEQUENCES.md](SEQUENCES.md) |
| New customers, retention, review requests, billing, usage, win-back, campaigns and the audit checklist | [LIFECYCLE-EMAILS.md](LIFECYCLE-EMAILS.md) |
| Failed-payment recovery copy and schedule variants | [churn-prevention DUNNING-COPY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/churn-prevention/DUNNING-COPY.md#the-four-emails) |
| Cancelled-customer win-back and the return path | [churn-prevention CANCEL-FLOWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/churn-prevention/CANCEL-FLOWS.md#after-the-cancel) |

## The rules

1. **Read `.agents/product-context.md` and its Learnings before writing,** using the canonical definition in [anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md). Ask only what it does not answer [coreyhaines31/marketingskills, emails; SEQUENCES.md].
2. **State a trigger, goal and exit conditions.** A conversion, completed step or unsubscribe ends the sequence [coreyhaines31/marketingskills, emails; SEQUENCES.md].
3. **Give each sequence email one primary job and CTA.** Lead with usefulness and segment for relevance; campaign copy conventions preserve the other source’s multiple-CTA structure [coreyhaines31/marketingskills, emails; resend/email-best-practices; SEQUENCES.md].
4. **Classify each email before sending it.** Promotion needs marketing consent and unsubscribe; a purely account or payment message stays transactional only without promotion [LIFECYCLE-EMAILS.md; email-practices/EMAIL-TYPES.md].
5. **Keep urgency and review requests honest.** Deadlines are real; reviews are requested by experience, never sentiment [LIFECYCLE-EMAILS.md, named FTC corrections].
6. **Measure clicks, conversions and product activity.** Opens are unreliable; choose and record the source convention when timing or subject guidance differs [SEQUENCES.md].

## Prove it

The program states entry, goals, timing and exits; a member who converts receives no further sequence emails; every marketing message has recorded consent and unsubscribe; review recipients are selected by milestone rather than score; every deadline matches the offer; and the relevant files’ Prove it checks pass.
