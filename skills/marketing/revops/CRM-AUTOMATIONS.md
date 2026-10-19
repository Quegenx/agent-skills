# CRM automations

Workflow recipes for HubSpot, Salesforce, scheduling tools and cross-tool glue. From coreyhaines31/marketingskills, skill `revops` (SKILL.md and references/automation-playbooks.md, MIT). Provider corrections below cite the vendors' documentation and say what the source had. SLA clocks and reassignment steps in these recipes are templates: use the team's one tier table ([LIFECYCLE.md](LIFECYCLE.md#slas)), and without an agreed reassignment rule, alert the current owner or queue instead of transferring ownership ([INBOUND-ENRICHMENT.md](INBOUND-ENRICHMENT.md#bound-the-interactive-wait)). Define stages, scoring and routing on paper first: "Automating a broken process just creates broken results faster."

**Contents:** [What to automate](#what-to-automate) · [HubSpot recipes](#hubspot-recipes) · [Salesforce Flow equivalents](#salesforce-flow-equivalents) · [Scheduling tools](#scheduling-tools) · [Zapier patterns](#zapier-patterns) · [Prove it](#prove-it)

## What to automate

[coreyhaines31/marketingskills, revops]

- **Essentials:** lifecycle stage updates (auto-advance when criteria are met); task creation on handoff (when an MQL is assigned to a rep); SLA alerts (notify the manager if a rep misses the response time); deal stage triggers (auto-send proposals, update forecasts, notify CS on close).
- **Marketing to sales:** MQL alert (instant notification to the assigned rep with lead context); meeting booked (notify the AE when a prospect books via the scheduling tool); lead activity digest (daily summary of high-intent actions by active leads); re-engagement trigger (alert sales when a dormant lead returns to the site).
- **Calendar scheduling:** round-robin scheduling; routing by criteria (enterprise leads to senior AEs, SMB to junior reps); pre-meeting enrichment (auto-populate the CRM record before the call); no-show workflows (auto-follow-up if the prospect misses the meeting).

Every webhook-triggered recipe (bookings, form fills, Zapier triggers) can fire twice: key it on the provider's event or submission id so a replay creates no second contact, task, notification or booking ([INBOUND-ENRICHMENT.md](INBOUND-ENRICHMENT.md#keep-submission-and-routing-separate), [third-party-integrations CALLS-AND-SYNC.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/third-party-integrations/CALLS-AND-SYNC.md#webhooks-from-providers)).

## HubSpot recipes

[coreyhaines31/marketingskills, revops]

1. **MQL alert and assignment.** Trigger: "Lifecycle Stage" is changed to "Marketing Qualified Lead". Actions: rotate contact owner among the sales team (round-robin); internal email to the owner with lead context; task "Follow up with [Contact Name]" due in 4 hours; Slack notification to #sales-alerts; enroll in an "MQL Follow-Up" sequence (if using HubSpot Sequences). Exclude leads already owned by a rep.
2. **MQL SLA escalation.** Trigger: "Lifecycle Stage" equals "MQL" AND "Days since last contacted" is greater than 0.5 (12 hours). Actions: internal email to the owner ("SLA warning: [Contact Name] has not been contacted"); after 24 hours with no activity, alert the sales manager; after 48 hours, reassign via rotation; task for the new owner ("Urgent: Contact [Contact Name], reassigned due to SLA breach"). Exclude contacts whose last activity type is "Call" or "Meeting" (already engaged).
3. **Auto-MQL on score threshold.** Trigger: the contact's score property from the Lead Scoring tool (the name you gave it, or its threshold property) is greater than or equal to your calibrated threshold. Actions: set lifecycle stage to "Marketing Qualified Lead"; set "MQL Date" to today; suppress from marketing nurture workflows; trigger recipe 1. Add a suppression list for existing customers and competitors. The source triggered on `Contact property "HubSpot Score" is greater than or equal to 65`; that legacy property stopped updating on August 31, 2025 ([LEAD-SCORING.md](LEAD-SCORING.md#hubspots-lead-scoring-tool)).
4. **Meeting booked alert to AE.** Trigger: a meeting activity is logged for the contact (via Calendly or HubSpot meetings). Actions: internal email to the owner with meeting details; set "Last Meeting Booked" to today; if lifecycle stage is "Lead", update to "MQL"; task "Prepare for meeting with [Contact Name]" due 1 hour before the meeting; Slack notification to #meetings. Include recent page views and content downloads in the email.
5. **Closed-won handoff to CS.** Trigger: deal stage is changed to "Closed Won". Actions: associated contacts to lifecycle stage "Customer"; set "Customer Since" to today; assign the owner to a CS team member (by segment or territory); task for CS "Schedule kickoff call with [Company Name]" due in 2 business days; enroll in a "Customer Onboarding" email sequence; notify the CS manager; remove from all sales sequences. Include deal notes, contract value and key stakeholders.
6. **Stale deal detection.** Trigger: deal property "Days in current stage" is greater than 2x the average for that stage. Actions: email the deal owner ("Deal stale alert: [Deal Name] has been in [Stage] for [X] days"); task "Update or close [Deal Name]" due in 3 business days; after 7 days with no update, alert the sales manager; add to a "Stale Deals" dashboard list. Per-stage thresholds: Discovery 14 days, Proposal 10 days, Negotiation 21 days.
7. **Recycled lead nurture re-entry.** Trigger: "Sales Rejection Reason" is known (any value). Actions: lifecycle stage to "Recycled"; reset engagement score to baseline (keep fit score); enroll in a "Recycled Lead Nurture" sequence (lower frequency); set "Recycle Date" to today; re-enroll when the Lead Scoring tool's score property crosses the threshold again, re-triggering the MQL workflow. Track recycled-to-MQL conversion separately. (The source re-enrolled on "HubSpot Score", retired as in recipe 3.) HubSpot's combined score stores engagement and fit in separate properties ([LEAD-SCORING.md](LEAD-SCORING.md#hubspots-lead-scoring-tool)).
8. **Daily lead activity digest.** Trigger: scheduled, daily at 8:00 AM local time. Actions: filter contacts in "SQL" or "Opportunity" with website activity in the last 24 hours; email each owner their leads' activity (pages visited, content downloaded, emails opened or clicked). Leave out leads with only a single homepage visit.

## Salesforce Flow equivalents

[coreyhaines31/marketingskills, revops] Salesforce no longer supports Workflow Rules and Process Builder as of December 31, 2025, and recommends Flow (https://help.salesforce.com/s/articleView?id=001096524&language=en_US&type=1).

1. **MQL alert and assignment.** Record-triggered Flow on Lead, when "Status" is changed to "MQL": Get Records from a custom "Rep Assignment" object for the next available rep; Update Records to set Lead Owner; Create Records for a Task "Contact MQL: {Lead.Name}"; send an email alert to the new owner; update the "Rep Assignment" last-assigned timestamp. The custom object holds the round-robin state. The source's task deadline was NOW + 4 hours, but standard Task.ActivityDate is a date-only due field; ReminderDateTime is a separate datetime field. Keep the precise agreed SLA as an implementation requirement until a supported time mechanism is selected, rather than claiming the ordinary task due date enforces it. [https://developer.salesforce.com/docs/atlas.en-us.sfFieldRef.meta/sfFieldRef/salesforce_field_reference_Task.htm]
2. **SLA escalation, scheduling requirement unresolved.** The source proposed polling every 4 hours during business hours; native schedule-triggered Flow instead runs once, daily or weekly. Do not present that four-hour interval as a supported native setting or silently replace the team's agreed SLA. Its proposed work remains: Get Records for Leads where Status = "MQL" AND LastActivityDate < TODAY - 1; Decision: older than 48 hours with no activity? Yes: apply the agreed reassignment rule, create an urgent task, alert the manager. No: reminder email to the current owner. Select a supported design before claiming this polling requirement is implemented. For real-time alerts on initial assignment, use the record-triggered Flow in recipe 1. (The source said: "Pair with Process Builder for real-time alerts on initial assignment.") [https://trailhead.salesforce.com/content/learn/modules/autolaunched-scheduled-flows/schedule-a-flow]
3. **Pipeline stage automation.** Record-triggered Flow on Opportunity when Stage is updated, with a Decision per stage: Discovery, task "Complete discovery questionnaire"; Demo, task "Prepare demo environment"; Proposal, task "Send proposal" and alert the deal desk if ACV > $25K ([PIPELINE-AND-METRICS.md](PIPELINE-AND-METRICS.md#deal-desk)); Closed Won, CS handoff (create a Case, assign a CS owner, send the welcome email); Closed Lost, task "Log loss reason" and add to the win-loss report.
4. **Stale deal detection.** Scheduled-triggered Flow daily at 7:00 AM: Get Records for open Opportunities where Days_In_Stage > Stage_SLA_Threshold; loop: create Task "Update stale deal: {Opportunity.Name}", email the owner, and if Days_In_Stage > 2x the threshold email the owner's manager; set a custom "Stale Flag" = true for the dashboard.

## Scheduling tools

[coreyhaines31/marketingskills, revops] The source's settings, not checked against Calendly's or SavvyCal's current help.

Calendly round-robin:

1. A team event type with all eligible reps.
2. Distribution: "Optimize for equal distribution".
3. Availability: each rep manages their own calendar.
4. Buffer: 15 min before and after meetings.
5. Minimum notice: 4 hours (avoid last-minute bookings).

CRM integration: the Calendly webhook fires on booking; match the invitee email to a CRM contact; if the contact exists, assign the meeting to the contact owner (override round-robin if owned); if new, create a lead, assign via routing rules, log the meeting; set lifecycle stage to MQL (meeting = high intent).

SavvyCal: the source lists priority-based scheduling (prefer certain time slots), overlay calendars (team availability in one view) and personalized booking links per rep. Pattern: a team scheduling link with priority rules; booking webhook → Zapier or Make → CRM; match or create the contact, assign the owner, create a task; send a confirmation with meeting prep materials.

Meeting routing by criteria:

```
Booking form submitted
├─ Company size > 500? (form field)
│  ├─ YES → Route to enterprise AE calendar
│  └─ NO ↓
├─ Existing customer? (CRM lookup)
│  ├─ YES → Route to account owner's calendar
│  └─ NO ↓
└─ Round-robin across SDR team
```

The source checks company size before the existing-customer lookup; the enrichment playbook's first branch preserves an existing customer's account owner ([INBOUND-ENRICHMENT.md](INBOUND-ENRICHMENT.md#agree-the-branches)). Under the source's order, an existing customer at a company over 500 reaches the enterprise AE calendar, not the account owner.

No-show workflow: wait 30 minutes after the scheduled time; was a call or meeting logged? Yes, no action. No, send a "Sorry we missed you" email to the prospect and create a task "Reschedule with [Contact Name]" due next business day. A second no-show flags the contact and alerts the manager.

## Zapier patterns

[coreyhaines31/marketingskills, revops]

1. **New lead → CRM + Slack + task.** Trigger: a new form submission (Typeform, HubSpot, Webflow). Create or update the CRM contact; enrich with your provider; post to Slack #new-leads with the enriched data; create a task in the project tool (Asana, Linear). Record the contact before enrichment and keep it if enrichment fails ([INBOUND-ENRICHMENT.md](INBOUND-ENRICHMENT.md)).
2. **Meeting booked → CRM + prep email.** Trigger: a new Calendly or SavvyCal booking. Find or create the CRM contact; lifecycle stage to MQL; prep email to the assigned rep (CRM link, LinkedIn profile, recent activity); a pre-meeting task.
3. **Deal closed → onboarding stack.** Trigger: CRM deal stage changed to "Closed Won". Create the customer record in the CS tool (Vitally, Gainsight, ChurnZero); add to the onboarding project template; welcome email; Slack channel #customer-[company-name]; notify the CS team.
4. **Lead score → cross-tool sync.** Trigger: the CRM lead score crosses the MQL threshold. Update the marketing automation status; trigger SDR outreach; log the event in analytics (Mixpanel, Amplitude). The source also adds the lead to a retargeting audience (Facebook, Google Ads) with no condition: upload a contact to an ad platform's customer list only when that contact's consent or lawful basis covers it, as recorded in the consent records ([email-practices COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/COMPLIANCE.md#consent-records)) and as the platform's own customer-list terms require ([paid-ads SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/SKILL.md)).
5. **SLA breach → multi-channel alert.** Trigger: the MQL follow-up task is overdue. Slack DM and email to the rep; at 2+ hours overdue, Slack DM to the manager; at 4+ hours, reassign in the CRM via webhook.
6. **Weekly pipeline digest.** Trigger: every Monday at 8:00 AM. Query the CRM for the pipeline summary (total value, new deals, stale deals, expected closes); post to Slack #sales-team; email the digest to sales leadership.

## Prove it

No workflow triggers on the legacy "HubSpot Score" property or uses Process Builder; each recipe's SLA matches the team's tier table; replaying a booking or form webhook creates nothing twice; an existing customer's booking reaches its account owner; closed-won removes the contact from every sales sequence and creates exactly one CS task; a no-show gets one follow-up and a second no-show alerts the manager; no contact reaches an ad audience without a recorded basis.
