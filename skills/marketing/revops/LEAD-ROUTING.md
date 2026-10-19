# Lead routing

Who gets each lead: routing methods, decision trees, round-robin, territories, named accounts and the speed-to-lead escalation chain. From coreyhaines31/marketingskills, skill `revops` (SKILL.md and references/routing-rules.md, MIT). Enrichment at form submit, missing data and late results are in [INBOUND-ENRICHMENT.md](INBOUND-ENRICHMENT.md).

**Contents:** [Methods](#methods) · [Decision tree](#decision-tree) · [Round-robin](#round-robin) · [Territories](#territories) · [Named accounts and ABM](#named-accounts-and-abm) · [Speed to lead](#speed-to-lead) · [Prove it](#prove-it)

## Methods

[coreyhaines31/marketingskills, revops]

| Method | How it works | Best for |
|---|---|---|
| **Round-robin** | Distribute evenly across reps | Equal territories, similar deal sizes |
| **Territory-based** | Assign by geography, vertical, or segment | Regional teams, industry specialists |
| **Account-based** | Named accounts go to named reps | ABM motions, strategic accounts |
| **Skill-based** | Route by deal complexity, product line, or language | Diverse product lines, global teams |

Essentials:

- Route to the **most specific match** first, then fall back to general.
- Include a **fallback owner**: "unassigned leads go cold fast and waste pipeline."
- Round-robin accounts for **rep capacity and availability** (PTO, quota attainment).
- Log every routing decision for audit and optimization.

## Decision tree

[coreyhaines31/marketingskills, revops] A template to customize:

```
New Lead Arrives
│
├─ Is this a named/target account?
│  ├─ YES → Route to assigned account owner
│  └─ NO ↓
│
├─ Is ACV likely > $50K? (based on company size + industry)
│  ├─ YES → Route to enterprise AE team
│  └─ NO ↓
│
├─ Is this a PLG signup with team usage?
│  ├─ YES → Route to PLG sales specialist
│  └─ NO ↓
│
├─ Does lead match a territory?
│  ├─ YES → Route to territory owner
│  └─ NO ↓
│
└─ Default: Round-robin across available reps
   └─ If no rep available: Assign to team queue with 1-hour SLA
```

For an existing customer or named account with a verified match, the enrichment playbook's branch table says "Preserve account owner and relationship" ([INBOUND-ENRICHMENT.md](INBOUND-ENRICHMENT.md#agree-the-branches)).

## Round-robin

[coreyhaines31/marketingskills, revops] Rules:

1. Distribute leads evenly across eligible reps.
2. Skip reps who are on PTO, at capacity, or have a full pipeline.
3. Weight by quota attainment (reps below quota get slight priority).
4. Reset the distribution count weekly or monthly.
5. Log every assignment for auditing.

The source's platform setups (menu paths not checked against the vendors' current help):

- **HubSpot rotation:** a workflow triggered when "Lifecycle Stage" equals "MQL", with the action to rotate contact owner among selected users (even distribution, skip unavailable owners), then a delay and task creation after assignment.
- **HubSpot custom rotation:** a number property "Rotation Counter"; on a new MQL, branch by the counter value (0, 1, 2... per rep), set the owner to that rep, increment the counter (reset at max), and create a follow-up task with the SLA deadline.
- **Salesforce Lead Assignment Rules:** Setup → Feature Settings → Marketing → Lead Assignment Rules; rule entries in priority order (most specific first); round-robin needs an assignment rule plus custom logic.
- **Salesforce Flow:** a record-triggered Flow on Lead creation; Get Records from a custom "Rep Queue" object for the next available rep; a Decision element for availability, capacity and territory; Update Records to assign the owner; Create Task with the SLA; update "Rep Queue" with the last assignment. Flow is Salesforce's supported automation; Workflow Rules and Process Builder reached end of support on December 31, 2025 (https://help.salesforce.com/s/articleView?id=001096524&language=en_US&type=1).

## Territories

[coreyhaines31/marketingskills, revops] Templates:

| By geography | Regions | Team |
|---|---|---|
| West | CA, WA, OR, NV, AZ, UT, CO, HI | Team West |
| Central | TX, IL, MN, MO, OH, MI, WI, IN | Team Central |
| East | NY, MA, PA, NJ, CT, VA, FL, GA | Team East |
| International | All non-US | International team |

| By company size | Employees | Team |
|---|---|---|
| SMB | 1-50 | Inside sales |
| Mid-market | 51-500 | Mid-market AEs |
| Enterprise | 501-5000 | Enterprise AEs |
| Strategic | 5000+ | Strategic account team |

| By industry | Industries | Specialist |
|---|---|---|
| Tech | SaaS, IT services, hardware | Tech vertical rep |
| Financial | Banking, insurance, fintech | Financial vertical rep |
| Healthcare | Hospitals, pharma, healthtech | Healthcare vertical rep |
| General | All others | General pool (round-robin) |

Hybrid model, combining dimensions:

```
Lead arrives
├─ Company size > 1000?
│  ├─ YES → Enterprise team
│  │  └─ Sub-route by geography
│  └─ NO ↓
├─ Industry = Healthcare or Financial?
│  ├─ YES → Vertical specialist
│  └─ NO ↓
└─ Round-robin across general pool
   └─ Weighted by geography preference
```

## Named accounts and ABM

[coreyhaines31/marketingskills, revops] Setup:

1. Define the target account list (typically 50-500 accounts).
2. Assign account owners in the CRM (1 rep per account).
3. Any lead from a target account domain routes to the account owner.
4. Matching: email domain match (primary); company name fuzzy match (secondary, requires manual review); IP-to-company resolution (tertiary, for anonymous visitors).

A personal-email domain cannot establish a company ([INBOUND-ENRICHMENT.md](INBOUND-ENRICHMENT.md#keep-submission-and-routing-separate)).

| Tier | Account type | Routing | Response SLA |
|---|---|---|---|
| Tier 1 | Top 20 strategic accounts | Named owner, instant alert | 1 hour |
| Tier 2 | Top 100 target accounts | Named owner, standard alert | 4 hours |
| Tier 3 | Target industry / size match | Territory or round-robin | Same business day |

Multiple contacts from one account: route all of them to the **same account owner**; notify the owner of new contacts entering; track an account-level engagement score (sum of all contacts); trigger a "buying committee" alert when 3+ contacts from one account engage.

## Speed to lead

[coreyhaines31/marketingskills, revops] The source states that response time "is the single biggest factor in lead conversion" and quotes multipliers credited to "Lead Connect, InsideSales.com" (21x for under 5 minutes, then 10x, 4x, 2x, and "60% lower" after 24 hours). Its SKILL.md and its table disagree on where the 10x falls, the study isn't linked, and its own enrichment playbook says to set targets "from the team's coverage and baseline rather than promising conversion multipliers." So the multipliers are left out here: measure your own response time against conversion.

Implementing it, as the source's template:

1. **Instant notification:** push notification + email to the rep on MQL creation.
2. **Auto-task with timer:** a task with a 5-minute SLA countdown.
3. **Escalation chain:** 5 min, original rep alerted; 15 min, backup rep alerted; 30 min, manager alerted; 1 hour, lead reassigned to the next available rep.
4. **Measure and report:** track actual response times weekly; recognize fast responders.

Reassignment by timer is one option, not a default: without an agreed rule, alert the current owner or queue rather than transferring ownership ([INBOUND-ENRICHMENT.md](INBOUND-ENRICHMENT.md#bound-the-interactive-wait)). A late enrichment result "must not silently steal an assigned lead" either.

Measure weekly:

- **Average time to first contact** (from MQL creation to first call or email).
- **Median time to first contact** (less skewed by outliers).
- **% of leads contacted within SLA** (the source's target: 90%+).
- **Contact rate by time of day** (identify coverage gaps).
- **Conversion rate by response time** (prove the ROI of speed).

Phone steps in an escalation chain follow the calling rules in [sales-enablement COLD-CALLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sales-enablement/COLD-CALLS.md#the-rules-this-sits-inside).

## Prove it

Every branch of the tree ends in a named owner or a team queue with an SLA; a lead from a named account reaches its owner even when round-robin would pick someone else; round-robin skips a rep on PTO; every assignment is logged with its rule; all contacts from one account share an owner; a fuzzy company-name match waits for review; no routing doc quotes conversion multipliers as fact; average and median time to first contact are reported weekly.
