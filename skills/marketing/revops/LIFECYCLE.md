# Lead lifecycle

Stage definitions for inbound and outbound contacts, the MQL definition, SLAs, rejection codes and recycling. From coreyhaines31/marketingskills, skill `revops` v2.2.1 (SKILL.md and references/lifecycle-definitions.md, MIT, Corey Haines), tagged `[coreyhaines31/marketingskills, revops]`. The point tables are the source's templates, not measured values: start from one and calibrate it ([LEAD-SCORING.md](LEAD-SCORING.md#threshold-calibration)).

**Contents:** [Stages](#stages) · [Stage templates](#stage-templates) · [The MQL](#the-mql) · [MQL criteria templates](#mql-criteria-templates) · [SLAs](#slas) · [Rejection and recycling](#rejection-and-recycling) · [Outbound stages](#outbound-stages) · [Prove it](#prove-it)

## Stages

[coreyhaines31/marketingskills, revops]

| Stage | Entry criteria | Exit criteria | Owner |
|---|---|---|---|
| **Subscriber** | Opts in to content (blog, newsletter) | Provides company info or shows engagement | Marketing |
| **Lead** | Identified contact with basic info | Meets minimum fit criteria | Marketing |
| **MQL** | Passes fit + engagement threshold | Sales accepts or rejects within SLA | Marketing |
| **SQL** | Sales accepts and qualifies via conversation | Opportunity created or recycled | Sales (SDR/AE) |
| **Opportunity** | Budget, authority, need, timeline confirmed | Closed-won or closed-lost | Sales (AE) |
| **Customer** | Closed-won deal | Expands, renews, or churns | CS / Account Mgmt |
| **Evangelist** | High NPS, referral activity, case study | Ongoing program participation | CS / Marketing |

Outbound contacts follow their own stages ([Outbound stages](#outbound-stages)).

## Stage templates

[coreyhaines31/marketingskills, revops]

| Stage | Entry | Exit | Owner | Actions on entry |
|---|---|---|---|---|
| Subscriber | Opted in to blog, newsletter, or content updates; no company information required | Provides company information via form or enrichment; visits 3+ pages in a session; downloads gated content | Marketing (automated) | Add to newsletter nurture; begin tracking engagement score |
| Lead | Identified contact with name + email + company; may come from form fill, enrichment, or import | Reaches MQL threshold (fit + engagement); manually qualified by marketing/SDR | Marketing | Enrich contact data (company size, industry, role); begin scoring; add to relevant nurture sequence |
| MQL | Meets fit score threshold AND engagement score threshold, OR triggers a high-intent action (demo request, pricing page + form fill) | Sales accepts (becomes SQL); sales rejects (recycled to nurture with reason code); no response within SLA (escalated to manager) | Marketing → Sales (handoff) | Instant alert to assigned sales rep; create follow-up task with 4-hour SLA; **pause marketing nurture sequences**; log all recent activity for sales context |
| SQL | Sales rep has had a qualifying conversation; confirmed budget, authority, need, or timeline (at least 2 of 4) | Opportunity created with projected value; disqualified (recycled with reason code) | Sales (SDR or AE) | Update lifecycle stage in CRM; notify AE if SDR-qualified; begin sales sequence if not already in conversation |
| Opportunity | Formal opportunity created in CRM; deal value, close date, and stage assigned | Closed-won or closed-lost | Sales (AE) | Add to pipeline reporting; create deal tasks (proposal, demo, etc.); notify CS if deal is likely to close |
| Customer | Closed-won deal; contract signed and payment terms set | Churns, expands, or renews | Customer Success / Account Management | Trigger onboarding sequence; assign CS manager; schedule kickoff call; **remove from all sales sequences** |
| Evangelist | NPS score 9-10, or active referral behavior; agreed to case study, testimonial, or referral program | Ongoing program participation | Customer Success + Marketing | Add to advocacy program; request case study or testimonial; invite to referral program; feature in marketing campaigns (with permission) |

Referral program mechanics are in [referral-programs SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/referral-programs/SKILL.md); case studies in [sales-enablement SALES-ASSETS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sales-enablement/SALES-ASSETS.md#case-study-briefs-sales-format).

## The MQL

[coreyhaines31/marketingskills, revops] An MQL requires both **fit** and **engagement**:

- **Fit score:** does this person match your ICP? (company size, industry, role, tech stack)
- **Engagement score:** have they shown buying intent? (pricing page, demo request, multiple visits)

"Neither alone is sufficient. A perfect-fit company that never engages isn't an MQL. A student downloading every ebook isn't an MQL." If marketing calls something an MQL but sales won't work it, "the definition is wrong": marketing, sales and customer success agree on the definitions before anything is automated.

## MQL criteria templates

[coreyhaines31/marketingskills, revops] Illustrative weights and thresholds by business type.

**PLG (product-led growth).** Fit 40%, engagement 60% (weight product usage heavily). MQL threshold: 65 points.

| Fit attribute | Points | Engagement signal | Points |
|---|---|---|---|
| Company size 10-500 | +15 | Created free account | +15 |
| Company size 500-5000 | +20 | Completed onboarding | +20 |
| Target industry | +10 | Used core feature 3+ times | +25 |
| Decision-maker role | +15 | Invited team member | +20 |
| Uses complementary tool | +10 | Hit usage limit | +15 |
| | | Visited pricing page | +10 |

**Sales-led (enterprise).** Fit 60% (weight fit heavily), engagement 40%. MQL threshold: 70 points.

| Fit attribute | Points | Engagement signal | Points |
|---|---|---|---|
| Company size 500+ | +20 | Requested demo | +25 |
| Target industry | +15 | Attended webinar | +10 |
| VP+ title | +20 | Downloaded whitepaper | +10 |
| Budget authority confirmed | +15 | Visited pricing page 2+ times | +15 |
| Uses competitor product | +10 | Engaged with sales email | +10 |

**Mid-market (balanced).** Fit 50%, engagement 50%. MQL threshold: 60 points.

| Fit attribute | Points | Engagement signal | Points |
|---|---|---|---|
| Company size 50-1000 | +15 | Demo request | +25 |
| Target industry | +10 | Free trial signup | +20 |
| Manager+ title | +15 | Pricing page visit | +10 |
| Target geography | +10 | Content download (2+) | +10 |
| | | Email click (3+) | +10 |
| | | Webinar attendance | +10 |

The source's SKILL.md says the threshold is "typically 50-80 points on a 100-point scale", yet the PLG engagement list alone sums to 105. Points are not capped at 100 unless the scoring tool has a score limit set (HubSpot's Lead Scoring tool has one: [LEAD-SCORING.md](LEAD-SCORING.md#hubspots-lead-scoring-tool)); decide the scale before the threshold.

## SLAs

[coreyhaines31/marketingskills, revops]

| Handoff | Metric | Target | Escalation |
|---|---|---|---|
| MQL to SQL | First contact attempt | Within 4 business hours | Alert to sales manager at 4 hours |
| MQL to SQL | Qualification decision | Within 48 hours | Auto-escalate at 48 hours |
| MQL to SQL | Meeting scheduled (if qualified) | Within 5 business days | Weekly pipeline review flag |
| SQL to Opportunity | Discovery call completed | Within 3 business days of SQL | Alert to AE manager |
| SQL to Opportunity | Opportunity created | Within 5 business days of SQL | Pipeline review flag |
| Opportunity to close | Proposal delivered | Within 5 business days of demo | AE manager alert |
| Opportunity to close | Deal stale in stage | 2x average days for that stage | Pipeline review flag |
| Opportunity to close | Close date pushed 2+ times | Immediate | Forecast review required |

The source gives other first-contact clocks elsewhere: 1 hour, 4 hours and same business day by account tier, and a 5-minute task with reassignment at 60 minutes ([LEAD-ROUTING.md](LEAD-ROUTING.md)); 12, 24 and 48 hours in one HubSpot recipe and 4 hours overdue in a Zapier one ([CRM-AUTOMATIONS.md](CRM-AUTOMATIONS.md)). Its own rule settles it: these are templates; "apply the team's agreed rule; without one, alert the current owner or queue rather than transferring ownership" ([INBOUND-ENRICHMENT.md](INBOUND-ENRICHMENT.md#bound-the-interactive-wait)). Write one tier table and use it in every workflow.

## Rejection and recycling

[coreyhaines31/marketingskills, revops]

| Code | Reason | Recycle action |
|---|---|---|
| **FIT-01** | Company too small | Nurture; re-score if company grows |
| **FIT-02** | Wrong industry | Archive; do not recycle |
| **FIT-03** | Wrong role / no authority | Nurture; monitor for org changes |
| **ENG-01** | No response after 3 attempts | Recycle to nurture in 90 days |
| **ENG-02** | Interested but bad timing | Recycle to nurture; re-engage in 60 days |
| **QUAL-01** | No budget | Recycle to nurture in 90 days |
| **QUAL-02** | Using competitor, locked in | Recycle; trigger before contract renewal |
| **QUAL-03** | Not a real project | Archive; do not recycle |

Recycling workflow:

1. Sales rejects the MQL with a reason code.
2. CRM updates the lifecycle stage to "Recycled".
3. The lead enters a recycling nurture sequence (different from the original nurture).
4. Engagement score resets to baseline (keep fit score).
5. If the lead re-engages and crosses the MQL threshold, re-route to sales with a "Recycled MQL" flag.
6. Track recycled MQL conversion rate separately.

Recycling nurture: bi-weekly or monthly (lower frequency than initial nurture); industry insights, case studies, product updates; 6 months, then archive if no engagement; re-MQL on a high-intent action (demo request, pricing page revisit). Sequence design and copy follow [email-marketing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/email-marketing/SEQUENCES.md); marketing consent and delivery follow [email-practices](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/SKILL.md).

## Outbound stages

[coreyhaines31/marketingskills, revops] Outbound contacts "never 'convert' on a form, and most never reply." Track them on their own stages, so outbound pipeline isn't hidden inside "Lead" and replies don't get lost.

| Stage | Entry | Exit | Owner |
|---|---|---|---|
| **Targeted** | Added to an outbound list: fit checked, email verified, tier assigned | Enrolled in a sequence, or skipped | SDR / outbound owner |
| **In sequence** | First touch sent | Any reply, sequence finished, or opted out | SDR / outbound owner |
| **Replied** | Any human reply on any channel | Classified within one business day | SDR |
| **Positive** | Reply shows interest or asks for information | Meeting booked, or gone quiet for 14 days | SDR |
| **Meeting booked** | Calendar invite accepted | Meeting held or no-show | SDR → AE |
| **Meeting held** | Meeting took place | Qualified into an opportunity, or recycled | AE |
| **Opportunity** | Qualified (same definition as inbound) | Closed-won or closed-lost | AE |
| **Not now** | Asked to be contacted later | Reminder date reached → back to Targeted | SDR |
| **Suppressed** | Opted out, bounced, hostile, customer, or competitor | Never (unless they opt back in) | System |

The email side of suppression is [email-practices LISTS-AND-CAPTURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/LISTS-AND-CAPTURE.md#suppression-list), and the phone side is the do-not-call list in [sales-enablement COLD-CALLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sales-enablement/COLD-CALLS.md).

Fields to capture on every outbound contact, so meetings can be attributed and sequences compared:

- Source list and data provider
- Signal (type and date) that put them on the list
- Tier
- Sequence and step that produced the reply
- Channel of the reply (email, LinkedIn, phone, other)
- Reply type (reply handling is in [cold-outreach SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cold-outreach/SKILL.md))
- Last verification date and result

These are the record that prospect research feeds ([prospecting SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/SKILL.md), [web-research EVENTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/web-research/EVENTS.md)).

**Handoff SLA:** positive replies get a human response within minutes during business hours, with a meeting proposal in that first response. Meetings booked by an SDR transfer to the AE with the account brief and the full thread attached.

**Outbound and inbound collide.** If an outbound contact fills out a form or signs up, keep the outbound history and owner, and record the inbound action. "Don't let the inbound workflow reassign the contact and restart a nurture sequence mid-conversation."

## Prove it

Every stage has entry and exit criteria, an owner and its entry actions; an MQL needs both a fit and an engagement threshold (or a named high-intent action); entering MQL pauses nurture and entering Customer removes the contact from every sales sequence; every rejection carries a reason code and recycling resets engagement but keeps fit; one tier table of first-contact SLAs is used by every workflow; a Suppressed contact never re-enters a sequence unless they opt back in; an outbound contact who fills a form keeps its owner and history.
