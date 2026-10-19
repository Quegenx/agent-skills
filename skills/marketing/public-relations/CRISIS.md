# Crisis communications

When something has gone wrong in public (a breach, an outage, a viral complaint, an executive controversy), copied from coreyhaines31/marketingskills `public-relations` (MIT), "Adapted from a contribution by @fyscleaning-jpg (PR #381)". The story is already running; the job is to respond quickly, honestly and without making it worse. The templates are in [CRISIS-STATEMENTS.md](CRISIS-STATEMENTS.md). Diagnosing and recovering the system itself, and the internal postmortem, are [observability INCIDENT-RESPONSE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/INCIDENT-RESPONSE.md#mid-incident).

**Contents:** [Facts first](#facts-first) · [Legal and safety exposure](#legal-and-safety-exposure) · [Principles](#principles) · [Severity](#severity) · [The first 60 minutes](#the-first-60-minutes) · [Channel order](#channel-order) · [Playbooks by crisis type](#playbooks-by-crisis-type) · [What not to do](#what-not-to-do) · [After the crisis](#after-the-crisis) · [Review checklist](#review-checklist) · [Prove it](#prove-it)

## Facts first

[coreyhaines31/marketingskills, public-relations] Before drafting anything, establish:

1. **What actually happened:** the confirmed fact, separate from the rumor. If unconfirmed, the statement says so.
2. **Who is affected:** customers, employees, the public, a specific group, regulators.
3. **The exposure:** contained, still unfolding, or likely to get worse.
4. **What's already public:** breaking on social, covered by press, or internal only.
5. **What legal, security or engineering can confirm now** versus what's still under investigation.

"A statement you walk back 24 hours later does more damage than a slower, accurate one."

## Legal and safety exposure

[coreyhaines31/marketingskills, public-relations]

- For a data breach, physical injury or safety risk, a lawsuit, or a regulator, bring in legal counsel "before you admit fault, describe cause, or publish anything beyond a holding statement."
- Breach notification deadlines and required content "vary by jurisdiction and by the type of data involved. Counsel determines which apply. Don't state a specific deadline unless counsel has confirmed it."
- Keep the legal posture and the public statement as separate documents: counsel decides what you can say; the public statement says it in plain language.

## Principles

[coreyhaines31/marketingskills, public-relations]

- **Speed matters, accuracy matters more.** Silence reads as incompetence or concealment; a wrong statement reads as dishonesty.
- **One source of truth:** one spokesperson and one channel of record. Mixed messages become their own crisis.
- **Acknowledge before you explain:** open with what happened and who it affects. "Readers scan for 'am I affected and what do I do.'"
- **Apologize without a "but."** Once counsel has cleared accepting responsibility, say sorry, say what you're doing, and stop.
- **Keep updating:** commit to a cadence ("next update by 6pm ET") and keep it, even when the update is "still investigating."

## Severity

[coreyhaines31/marketingskills, public-relations] When unsure, escalate: under-responding to P1 looks worse than over-responding to P2. Map the source scale once: Tier 4 = P0, Tier 3 = P1, Tier 2 = P2, Tier 1 = P3. The examples and response duties below retain that order under the owner's P0 to P3 severity rule.

| Severity | Examples | Response |
|---|---|---|
| **P3. Contained** | Single feature bug, isolated complaint thread, minor copy mistake | Support or community team replies directly. No public statement. |
| **P2. Visible** | Service degradation, a complaint gaining traction, a marketing claim called out | Public acknowledgment on the status page or social, owned by the support or marketing lead |
| **P1. Significant** | Full outage, billing error across many customers, a widely shared customer-harm story | Formal exec-reviewed statement on status page, email and social. Spokesperson designated. |
| **P0. Severe** | Data breach, security incident, executive misconduct, safety issue, regulatory inquiry | Counsel-reviewed statement, exec-level spokesperson, dedicated incident page. Notification obligations may apply. |

**Source scope conflict:** the first-hour checklist, hub rule and acceptance check called for a holding statement without a severity condition, while the source's contained-response row says "No public statement". Keep the P3 direct support/community response; the public-statement and public-update steps below apply when the severity requires a public response (P2, P1 or P0). [coreyhaines31/marketingskills, public-relations]

## The first 60 minutes

[coreyhaines31/marketingskills, public-relations]

1. **Confirm the facts** with the people who have direct knowledge (engineering, security, legal, support lead), not secondhand summaries.
2. **Assess the severity.** For P0, bring in counsel now.
3. **Designate the spokesperson** and the channel of record (status page, pinned post, or both).
4. **When the severity requires a public response, publish a holding statement** with zero unconfirmed claims about cause or scope ([CRISIS-STATEMENTS.md](CRISIS-STATEMENTS.md#holding-statement)).
5. **Notify staff before or alongside going public:** what's happening, what to say if asked, where to route press and customer questions.
6. **For the public response, set the next update time** and state it publicly.

## Channel order

[coreyhaines31/marketingskills, public-relations] "Getting the order wrong, such as posting publicly before telling affected customers, creates a second crisis."

1. **Directly affected parties first:** individual email or in-app notice, especially for breaches and billing errors.
2. **Internal note,** in parallel with step 1.
3. **Status or incident page:** the linkable source of truth you control.
4. **Owned social:** a short post linking to the full statement ("Character limits force omissions that read as evasive").
5. **Press:** answer reporters who are already asking. "Press should never get the news before affected customers."

## Playbooks by crisis type

[coreyhaines31/marketingskills, public-relations]

| Type | First move | Watch for |
|---|---|---|
| **Data breach or security incident** | Confirm scope with security and bring in counsel before any public claim about what was or wasn't exposed; counsel checks notification obligations | "'No sensitive data was affected' is the statement most often walked back." Don't say it until security confirms it |
| **Product outage** | Status page update within minutes, even if it only says "investigating" | An ETA you can't keep; "Next update by [time]" is safer than a guessed fix time |
| **Executive misconduct** | Legal and board involvement before any statement; getting it right outranks speed | A statement that reads as protecting the executive over the people affected |
| **Customer-harm story going viral** | Contact the customer privately before replying publicly | Arguing facts in public threads; resolve privately, then post a brief update if appropriate |
| **Billing or pricing error** | Confirm scope (how many customers, how much money) before announcing the fix | Waiting to be asked; refund or credit proactively, since "refunds after public pressure read as conceding under fire" |
| **Layoffs leak early** | Move the internal announcement up so employees hear it from the company | Letting the leak stand without an official statement |
| **Misleading marketing claim called out** | Name the specific claim, correct it, explain the fix | Defending intent; the audience cares about the correction |

## What not to do

[coreyhaines31/marketingskills, public-relations]

- **Go silent.** "No new information yet, next update at [time]" beats nothing.
- **Delete criticism.** Deleted threads get screenshotted and become a story about a cover-up.
- **Issue a non-apology:** "We're sorry if anyone was affected" puts the burden on the reader's reaction.
- **Speculate:** "We believe this may have also affected..." starts a correction cycle.
- **Admit fault or cause before the facts and counsel allow it.** You can acknowledge the issue and the impact without assigning blame.
- **Let legal language into the human statement:** "The Company denies any wrongdoing" inside an apology reads as insincere.
- **Bury the lede** under paragraphs of context.

## After the crisis

[coreyhaines31/marketingskills, public-relations]

1. **Public postmortem** for P1 and P0: what happened, root cause, what's changing ([CRISIS-STATEMENTS.md](CRISIS-STATEMENTS.md#public-postmortem)). "Specific, checkable commitments build trust; 'we take this seriously' doesn't." Like the internal one, it names no person as the cause ([observability INCIDENT-RESPONSE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/INCIDENT-RESPONSE.md#the-postmortem)).
2. **Internal retro,** separate from the postmortem, on what should change in the response process itself.
3. **Track every promise:** a promised fix, credit or policy change gets seen through, with a follow-up post when it ships.
4. **Watch sentiment for 1 to 2 weeks:** "Crises often get a second wave when a new detail surfaces."

## Review checklist

[coreyhaines31/marketingskills, public-relations]

- Does the response match the severity?
- Have directly affected parties been notified before any public statement?
- Does the draft claim only what's confirmed?
- For breaches, injuries, lawsuits or regulators: has counsel reviewed it?
- Is there one spokesperson and one channel of record?
- What's the next update commitment, and who owns it?

## Prove it

- The severity is written down, and a P0 had counsel involved before anything beyond the holding statement.
- When a public response is required, the holding statement went out within the hour and claims nothing about cause or scope; a contained P3 instead received the direct support/community response without a public statement.
- Affected parties heard before social and press; staff heard before or alongside the public.
- Every public update names the next update time, and each one was kept.
- No statement states a notification deadline counsel didn't confirm, says "No sensitive data was affected" before security confirmed it, or apologizes with a "but".
- P1 and P0 incidents get a public postmortem with no person as the cause, and every promise in it is tracked to done.
