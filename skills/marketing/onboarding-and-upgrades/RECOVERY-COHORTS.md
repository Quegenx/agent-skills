# Recovery cohort worksheet

Define who qualifies for recovery before writing queries or messages. This audience-analysis worksheet is paraphrased from [nestyme/awesome-prompts, almost-paid/SKILL.md; almost-paid/templates/cohort-spec.md]. In-product recovery remains in [ACTIVATION.md](ACTIVATION.md#stalled-users); message delivery, payment recovery and experiments stay with the owners linked below.

## Establish the evidence

[nestyme/awesome-prompts, almost-paid/SKILL.md; almost-paid/templates/cohort-spec.md] Save a product-specific cohort spec before deriving its queries. Record:

| Area | What the spec records |
|---|---|
| Snapshot | Product, analysis date, source systems and data windows |
| Events | The trigger's actual meaning and where it fires; evidence that it represents the intended action |
| Billing | Purchase, trial, failure and refund records used to reconcile analytics over the same window |
| Identity | The join key between product activity and billing, including links across web and app identities; unresolved joins remain explicit |
| Reachability | Where each channel's address or token comes from and what establishes eligibility to use it |

[nestyme/awesome-prompts, almost-paid/SKILL.md] Give each trigger an evidence-backed status. Record discrepancies and the source selected for the decision instead of silently treating an event name as proof of purchase intent. A web abandonment joined to a purchase under a different app identity must not be counted as an unpaid user merely because the IDs differ.

## Define the audience

[nestyme/awesome-prompts, almost-paid/SKILL.md; almost-paid/templates/cohort-spec.md] Keep different reasons for stopping distinguishable: an unfinished checkout, a failed payment, a task stopped by a limit, repeated paywall visits, or a lapsed trial with prior use. A single paywall view needs its own evidence of meaningful use; exposure alone does not establish that the person nearly paid.

For each proposed segment, write its trigger, observation window, required prior activity, purchase or trial condition, platform and size at the snapshot. Choose windows for the product's decision cycle. If segments overlap, state the precedence and produce one final assignment per user for this campaign. Record exclusions and their reasons before exporting the audience, including applicable purchase/trial status, opt-outs, prior contact and internal accounts. [nestyme/awesome-prompts, almost-paid/SKILL.md; almost-paid/templates/cohort-spec.md]

The source supplies fixed windows, an ordering from hottest to coolest and blanket exclusions. Treat those as its campaign choices, not defaults for every product. The spec must state the selected policy and unresolved evidence. [nestyme/awesome-prompts, almost-paid/SKILL.md]

## Hand off to the existing owners

- **Offer and in-product timing:** use [UPGRADE-PROMPTS.md](UPGRADE-PROMPTS.md), including its store eligibility rules. The audience worksheet does not change the owner's app design.
- **Lifecycle messages:** use [email lifecycle guidance](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/email-marketing/LIFECYCLE-EMAILS.md) for engagement-based trial recovery and [sequence design](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/email-marketing/SEQUENCES.md) for entry, exit and message conditions. Channel eligibility, consent and suppression follow [email-practices](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/SKILL.md); a reachable address alone is not approval to send.
- **Payment failures:** keep [dunning](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/churn-prevention/DUNNING-COPY.md) separate from promotional recovery. Sending state and duplicate prevention belong to [email reliability](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/RELIABILITY.md), not a new per-user sent marker in the worksheet.
- **Measurement:** record the outcome, comparison group, observation horizon and refund follow-up. Design the comparison with [ab-testing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SKILL.md), including its sample and allocation rules. The source's assumed conversion rates and fixed holdout percentage are not adopted. [nestyme/awesome-prompts, almost-paid/SKILL.md]

The handoff is the reviewed spec and audience, followed by drafts under those owners. It does not authorize a send or introduce a sender, dashboard or billing integration. [nestyme/awesome-prompts, almost-paid/SKILL.md]

## Prove it

The spec identifies the data snapshot and event evidence, records identity gaps, defines segment conditions and overlap precedence, lists exclusions and actual channel eligibility, and gives the resulting counts. Queries implement that spec. The recovery proposal uses the existing lifecycle, dunning and experiment owners, with assumptions distinguished from observations and no borrowed conversion defaults. [nestyme/awesome-prompts, almost-paid/SKILL.md; almost-paid/templates/cohort-spec.md]
