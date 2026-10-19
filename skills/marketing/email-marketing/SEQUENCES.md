# Sequences

A sequence is a set of automated emails that starts on a trigger (a signup, a download, a trial, inactivity) and stops on a goal or an exit condition. This file designs the flow and writes the emails; it follows the coreyhaines31/marketingskills `emails` skill (MIT), copied with its tag, and the official pages each correction names. Every email after a transactional welcome is marketing: it needs recorded consent and an unsubscribe ([email-practices COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/COMPLIANCE.md), [email-practices LISTS-AND-CAPTURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/LISTS-AND-CAPTURE.md#marketing-emails)). The single lifecycle emails (billing, usage, win-back, campaigns) are in [LIFECYCLE-EMAILS.md](LIFECYCLE-EMAILS.md); cold outreach sequences are in [cold-outreach SEQUENCES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cold-outreach/SEQUENCES.md); in-app onboarding is in [app-growth RETENTION-AND-MONETIZATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/RETENTION-AND-MONETIZATION.md).

**Contents:** [Before you write](#before-you-write) · [Principles](#principles) · [Length and timing](#length-and-timing) · [Triggers and exit conditions](#triggers-and-exit-conditions) · [Welcome](#welcome) · [Lead nurture](#lead-nurture) · [Onboarding](#onboarding) · [Re-engagement](#re-engagement) · [Writing each email](#writing-each-email) · [Campaign copy conventions](#campaign-copy-conventions) · [Subject and preview](#subject-and-preview) · [Personalization and segments](#personalization-and-segments) · [Testing and metrics](#testing-and-metrics) · [The output](#the-output) · [Prove it](#prove-it)

## Before you write

[coreyhaines31/marketingskills, emails]

- **Read the product context file first:** `.agents/product-context.md`, defined in [anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md). The source names it `.agents/product-marketing.md` (or `.claude/product-marketing.md`, or the legacy `product-marketing-context.md`). Check its **Learnings** section: "angles, offers, and formats already tested there shouldn't be re-proposed as new ideas".
- **Then ask only what the file doesn't answer:**
  1. What triggers entry to this sequence?
  2. What's the primary goal/conversion action?
  3. What do they already know about you?
  4. What other emails are they receiving?
  5. What's your current email performance?
- **Sequence types the source covers:** welcome or onboarding, lead nurture, re-engagement, post-purchase, event-based, educational, sales.

## Principles

[coreyhaines31/marketingskills, emails]

1. **One Email, One Job:** one primary purpose and one main CTA per email.
2. **Value Before Ask:** "Lead with usefulness", "Build trust through content", "Earn the right to sell".
3. **Relevance Over Volume:** "Fewer, better emails win"; segment for relevance.
4. **Clear Path Forward:** every email moves them somewhere, and links do something useful.

## Length and timing

[coreyhaines31/marketingskills, emails]

| Sequence | Emails |
|---|---|
| Welcome | 3-7 |
| Lead nurture | 5-10 |
| Onboarding | 5-10 |
| Re-engagement | 3-5 |

Length depends on the sales cycle, product complexity and relationship stage.

- **Delays:** the welcome email immediately; early sequence 1-2 days apart; nurture 2-4 days apart; long-term weekly or bi-weekly.
- **Days and time zones:** "B2B: Avoid weekends"; "B2C: Test weekends"; send at the recipient's local time. The repo's general rule ("weekday mornings 9 to 11 AM local time, Tuesday to Thursday often best; test your own audience") is in [Campaign copy conventions](#campaign-copy-conventions).
- **Frequency is a promise:** Yahoo asks you to honor the frequency the list promised ([Campaign copy conventions](#campaign-copy-conventions)), so a daily course needs a signup that said daily.

## Triggers and exit conditions

- **Triggered emails** are "Action-based sends", "More relevant than time-based": a feature used, a milestone hit, inactivity [coreyhaines31/marketingskills, emails]. The source's eval expects behavior triggers with time-based fallbacks.
- **Every sequence states its exit conditions:** when someone converts, completes the step the email asks for, or unsubscribes, they leave. The onboarding example sends "Getting started help" only "If they haven't completed step 1" [coreyhaines31/marketingskills, emails].
- **Coordinate with in-app onboarding:** "email supports, doesn't duplicate" [coreyhaines31/marketingskills, emails]. Setup completion itself is an in-app task.

## Welcome

[coreyhaines31/marketingskills, emails] 5-7 emails over 12-14 days. Goal: activate, build trust, convert. The first email may be the transactional welcome, which must not be promotional ([email-practices EMAIL-TYPES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/EMAIL-TYPES.md#keep-the-two-apart)); everything after it is marketing.

| # | Send | Subject | Job |
|---|---|---|---|
| 1 | Immediately | Welcome to [Product]. Here's your first step | Deliver what was promised; single next action; set expectations for future emails |
| 2 | Day 1-2 | Get your first [result] in 10 minutes | Enable a small success; link a helpful resource |
| 3 | Day 3-4 | Why we built [Product] | Origin story or mission; show you understand their problem |
| 4 | Day 5-6 | How [Customer] achieved [Result] | Case study or testimonial; soft CTA to explore |
| 5 | Day 7-8 | "I don't have time for X." Sound familiar? | Address a common hesitation; show the easy path |
| 6 | Day 9-11 | Have you tried [Feature] yet? | Highlight an underused capability; direct CTA to try it |
| 7 | Day 12-14 | Ready to [upgrade/buy/commit]? | Summarize value; clear offer; urgency if appropriate; risk reversal (guarantee, trial) |

"Urgency if appropriate" means a real deadline only; fake countdowns and false limited-time claims are FTC dark patterns ([offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md)).

## Lead nurture

[coreyhaines31/marketingskills, emails] 6-8 emails over 2-3 weeks, after a lead magnet. Goal: build trust, demonstrate expertise, convert.

| # | Send | Job |
|---|---|---|
| 1 | Immediately | Deliver the lead magnet; brief intro to who you are; preview what's coming |
| 2 | Day 2-3 | Expand on the topic; establish expertise; light CTA to content |
| 3 | Day 4-5 | Problem deep-dive; show you understand; hint at the solution |
| 4 | Day 6-8 | Solution framework: your approach, "Educational, not salesy" |
| 5 | Day 9-11 | Case study: "Real results from real customer"; soft CTA |
| 6 | Day 12-14 | Differentiation: why your approach is different; address alternatives |
| 7 | Day 15-18 | Objection handler: FAQ or myth-busting |
| 8 | Day 19-21 | Direct offer: clear pitch, specific CTA, urgency if available |

The lead magnet's email joins a marketing sequence only with marketing consent ([email-practices COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/COMPLIANCE.md#the-laws), GDPR Art. 7(4)); without it, email 1 is the delivery and the sequence stops there.

[more skills, copywriting-playbook.md] Another optional narrative arc is problem, agitation, solution, proof and offer across the sequence. These are ordered beats, not a prescribed five-email count or one beat per send. Keep this file's consent, entry and exit rules and choose timing for the actual sequence; the guide supplies no additional schedule.

## Onboarding

[coreyhaines31/marketingskills, emails] 5-7 emails over 14 days, for product users. Goal: activate, drive to the aha moment, upgrade.

| # | Send | Job |
|---|---|---|
| 1 | Immediately | Welcome and first step: confirm signup, one critical action, link directly to it |
| 2 | Day 1 | Getting started help, only if step 1 isn't done: quick tip or video, support option |
| 3 | Day 2-3 | Feature highlight: a specific use case, in-app link |
| 4 | Day 4-5 | Success story: a customer who succeeded |
| 5 | Day 7 | Check-in: how's it going, ask for feedback, offer help |
| 6 | Day 10-12 | Advanced tip: a power feature, for engaged users |
| 7 | Day 14+ | Upgrade or expand: trial users a conversion push, free users an upgrade prompt, paid users an expansion |

The mobile trial nurture (day 0, 1, 3, 5, 6, 7) and the push schedule are in [app-growth RETENTION-AND-MONETIZATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/RETENTION-AND-MONETIZATION.md); the series for paying customers is in [LIFECYCLE-EMAILS.md](LIFECYCLE-EMAILS.md#onboarding).

## Re-engagement

[coreyhaines31/marketingskills, emails] 3-4 emails over 2 weeks. Goal: win back or clean the list.

| # | Send | Subject | Job |
|---|---|---|---|
| 1 | After 30-60 days of inactivity | Is everything okay, [Name]? | Genuine concern; ask what happened; an easy win |
| 2 | Day 2-3 after | Remember when you [achieved X]? | Past value; what's new since they left |
| 3 | Day 5-7 after | We miss you. Here's something special | An offer if appropriate |
| 4 | Day 10-14 after | Should we stop emailing you? | Honest and direct; "One-click to stay or go"; "Clean the list if no response" |

- **The trigger differs between sources:** this one says 30-60 days, its eval 90; the repo's hygiene rule says no opens or clicks in 45 to 90 days, with one "We miss you" email before removal ([email-practices LISTS-AND-CAPTURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/LISTS-AND-CAPTURE.md#hygiene-and-re-engagement)). Pick one and write it down.
- **Subject lines stay honest here too.** The source's eval expected "aggressive subject lines to break through"; CAN-SPAM says "The subject line must accurately reflect the content of the message" (https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business), and Gmail bans `Re:` or `Fwd:` bait ([email-practices DELIVERABILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/DELIVERABILITY.md#message-format-and-display-names)).
- **Sunset non-responders** after the last email; inactive subscribers hurt deliverability.

## Writing each email

[coreyhaines31/marketingskills, emails]

- **Structure:** Hook (the first line), Context (why this matters to them), Value (the useful content), CTA (what to do next), Sign-off ("Human, warm close").
- **Length:** 50-125 words transactional; 150-300 educational; 300-500 story-driven. "If it's long, it better be good."
- **CTA:** buttons for primary actions, links for secondary ones, one clear primary CTA per email, button text "Action + outcome". The repo's marketing structure line allows "multiple calls to action" ([Campaign copy conventions](#campaign-copy-conventions)); this source says one primary.
- **Tone:** conversational, I/we and you, active voice. "Read it out loud. Does it sound like a person?"
- **Formatting:** paragraphs of 1-3 sentences, white space, bullets, bold sparingly, mobile-first.
- **Email tells to cut:**
  - "**Subject-line bait**: fake 'Re:' or 'Fwd:', 'You won't believe...', '🔥 Big news.' The subject should hold up if it's the only line they read."
  - "**Stock openers**: 'I hope this email finds you well,' 'Just checking in,' 'Great news!' Open with the reason you're writing."
  - "**Sign-off filler**: 'Feel free to reach out if you have any questions.' Ask for one specific action, or end."
  - The general tells (contrast reveals, negation lists, pile-ons, colon reveals, em dashes in subject and preview) are in [anti-slop-writing TELLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/TELLS.md).

## Campaign copy conventions

[resend/email-best-practices] These conventions retain the source’s multiple-CTA structure alongside the one-primary-CTA sequence rule above, and its mobile subject limit alongside the range below. Test for the actual audience.

- **Subject lines:** clear, specific, 50 characters or less for mobile (the emails source says "40-60 characters ideal", [SEQUENCES.md](#subject-and-preview)); curiosity without misleading; A/B test. Right: "Your weekly digest: 5 productivity tips". Wrong: "You won't believe what happened!"
- **Structure:** above the fold, a value proposition, a primary call to action and an engaging visual; a scannable body (short paragraphs, bullets) with a clear hierarchy and multiple calls to action; a footer with unsubscribe, company info, physical address (CAN-SPAM) and social links.
- **Mobile-first:** single column, buttons at least 44x44px, text at least 16px; test on iOS, Android and in dark mode.
- **Segment** by behavior (purchases, activity), demographics, preferences, engagement level and signup source, for higher open and click rates, lower unsubscribes and a better experience.
- **Personalize** with name in the subject or greeting, location-specific content, behavior-based recommendations and purchase history, using only data you have permission to use; don't over-personalize (it can feel intrusive).
- **Frequency:** start conservative, increase with engagement, let users set preferences, monitor unsubscribe rates. Yahoo: honor the frequency the list promised.
- **Timing:** weekday mornings 9 to 11 AM local time, Tuesday to Thursday often best; test your own audience.

## Subject and preview

[coreyhaines31/marketingskills, emails]

- **Subject:** "Clear > Clever", "Specific > Vague", benefit or curiosity, "40-60 characters ideal". The repo's line says "50 characters or less for mobile" ([Campaign copy conventions](#campaign-copy-conventions)); both are source conventions, so test.
- **Patterns:** question ("Still struggling with X?"), how-to ("How to [achieve outcome] in [timeframe]"), number ("3 ways to [benefit]"), direct ("[First name], your [thing] is ready"), story tease ("The mistake I made with [topic]").
- **Emoji:** the source says "Test emoji (they're polarizing)"; Gmail bans emoji that imitate verification, and display names carry none ([email-practices DELIVERABILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/DELIVERABILITY.md#message-format-and-display-names)).
- **Preview text** extends the subject, "~90-140 characters", and doesn't repeat it. Transactional pre-headers stay under 90 characters ([email-practices EMAIL-TYPES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/EMAIL-TYPES.md#designing-transactional-emails)).

## Personalization and segments

[coreyhaines31/marketingskills, emails]

- **Merge fields:** first name with a fallback ("there" or "friend"), company name (B2B), relevant data (usage, plan). Use only data you have permission to use ([Campaign copy conventions](#campaign-copy-conventions)).
- **Dynamic content** by segment, behavior or stage.
- **Segments:** by stage (trial vs paid, new vs long-term, engaged vs at-risk) and by profile (industry or role, use case, company size). The source also segments "Openers vs. non-openers"; opens are unreliable (below), so segment on clicks and activity instead.

## Testing and metrics

- **What to test** [coreyhaines31/marketingskills, emails]: subject lines "(highest impact)", send times, length, CTA placement and copy, personalization level, sequence timing; one variable at a time, a sufficient sample, statistical significance, and documented learnings. Sample size and significance are in [ab-testing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SKILL.md).
- **Opens are not a reliable metric.** Apple Mail Privacy Protection "prevents senders from seeing if you've opened the email message they sent you" (https://support.apple.com/guide/iphone/use-mail-privacy-protection-iphf084865c7/ios), and Google says low open rates "aren't necessarily an accurate indicator of deliverability" ([email-practices DELIVERABILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/DELIVERABILITY.md#gmail)). The source's "Open rate (benchmark: 20-40%)" is left out as a target.
- **Track instead** [coreyhaines31/marketingskills, emails]: click rate (the source's benchmark: 2-5%), unsubscribe rate (the source: "keep under 0.5%"), conversion rate against the sequence goal, revenue per email if applicable. The benchmarks are the source's, not measured.
- **Complaints and bounces** stop a sequence: the stop-loss rules are in [email-practices DELIVERABILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/DELIVERABILITY.md#stop-loss-rules).

## The output

[coreyhaines31/marketingskills, emails] Hand back the sequence in this shape, then a metrics plan (what to measure, and the benchmark with its source):

```
Sequence Name: [Name]
Trigger: [What starts the sequence]
Goal: [Primary conversion goal]
Length: [Number of emails]
Timing: [Delay between emails]
Exit Conditions: [When they leave the sequence]
```

```
Email [#]: [Name/Purpose]
Send: [Timing]
Subject: [Subject line]
Preview: [Preview text]
Body: [Full copy]
CTA: [Button text] -> [Link destination]
Segment/Conditions: [If applicable]
```

## Prove it

- The sequence states its trigger, goal, timing and exit conditions; someone who converts or completes the step mid-sequence receives no further emails from it.
- Every email after the transactional welcome goes only to addresses with marketing consent and carries the unsubscribe headers and body link.
- Each email has one job and one primary CTA, and its subject accurately reflects its content.
- A welcome email's subject and preview contain no bait, no em dash, no stock opener and no negation list, and the email ends in one action (the source's eval 7).
- The metrics plan reports clicks, conversions, unsubscribes and complaints, not opens.
