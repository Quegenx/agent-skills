---
name: revops
description: "Designs the systems that connect marketing, sales and customer success: lead lifecycle stages for inbound and outbound, MQL and SQL definitions and handoff SLAs, lead scoring with fit, engagement and negative signals calibrated on a time-ordered holdout, lead routing (round-robin, territory, named accounts, speed to lead), enrichment at form submit that never loses or double-books a lead, pipeline stages and hygiene, deal desk approvals, CRM data hygiene, revenue metrics and dashboards, and HubSpot, Salesforce Flow, Calendly and Zapier recipes. Use when defining MQLs or lifecycle stages, building or recalibrating a lead score, routing leads or fixing slow follow-up, enriching a demo form, cleaning up a pipeline or CRM, setting discount approvals, or speccing a RevOps dashboard."
---

# RevOps

The systems and processes between a lead appearing and revenue: stage definitions, scoring, routing, handoffs, pipeline hygiene and the metrics that show where it leaks. Everything here comes from coreyhaines31/marketingskills, skill `revops` v2.2.1 (MIT, Corey Haines), tagged `[coreyhaines31/marketingskills, revops]`, corrected where the source's HubSpot and Salesforce details are out of date (HubSpot's Lead Scoring documentation and Salesforce Help, cited in the files). Cold outreach copy belongs to [cold-outreach SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cold-outreach/SKILL.md), nurture and lifecycle email to [email-marketing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/email-marketing/SKILL.md), pricing decisions to [pricing-strategy SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/pricing-strategy/SKILL.md), sales collateral to [sales-enablement SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sales-enablement/SKILL.md), and which marketing touches earn credit for a deal to [marketing-attribution SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-attribution/SKILL.md).

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Inbound stages and their entry actions, the MQL definition, MQL criteria templates, SLA tables, rejection codes and recycling, outbound stages with Suppressed, outbound fields, inbound and outbound collisions | [LIFECYCLE.md](LIFECYCLE.md) |
| Fit, engagement and negative scoring templates, example models by ACV, common mistakes, threshold calibration on decision-time features with a holdout, recalibration, HubSpot's Lead Scoring tool and the retired "HubSpot Score" | [LEAD-SCORING.md](LEAD-SCORING.md) |
| Routing methods, the decision tree, round-robin rules and setups, territories, named-account (ABM) tiers, speed-to-lead escalation and measurement | [LEAD-ROUTING.md](LEAD-ROUTING.md) |
| Enrichment at form submit: record before lookup, one record per submission id, the branch table, a bounded wait, late results that never steal an owner, replay fixtures, shadow run and pilot | [INBOUND-ENRICHMENT.md](INBOUND-ENRICHMENT.md) |
| Pipeline stages and required fields, stage hygiene, deal desk triggers and approval tiers, dedup, required fields, the quarterly audit, metric formulas, dashboard views | [PIPELINE-AND-METRICS.md](PIPELINE-AND-METRICS.md) |
| HubSpot workflow recipes, Salesforce Flow equivalents, Calendly and SavvyCal patterns, no-show workflow, Zapier patterns, with the source's stale steps corrected | [CRM-AUTOMATIONS.md](CRM-AUTOMATIONS.md) |

## Before starting

The source reads `.agents/product-marketing.md` (or `.claude/product-marketing.md`, or the older `product-marketing-context.md`). In this repo the file is `.agents/product-context.md` ([anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md)); read it first. [coreyhaines31/marketingskills, revops]

Gather (ask if not provided): GTM motion (product-led, sales-led or hybrid); ACV range; sales cycle length (days from first touch to closed-won); current stack (CRM, marketing automation, scheduling, enrichment); current state (how leads are managed, what works and what doesn't); goals (conversion, speed to lead, handoff leaks, building from scratch). Then: which CRM; leads per month; the current MQL definition; where leads get stuck; whether marketing and sales have SLAs today. "Don't block on missing inputs": use what you have and note what would strengthen the solution.

## The rules

1. **Single source of truth.** One system of record for every lead and account; pick a CRM as canonical and sync everything to it. [coreyhaines31/marketingskills, revops]
2. **Define before automate.** Stage definitions, scoring criteria and routing rules are right on paper before any workflow: "Automating a broken process just creates broken results faster." [coreyhaines31/marketingskills, revops]
3. **Measure every handoff.** Marketing to sales, SDR to AE, AE to CS: each has an SLA, a tracking mechanism and someone accountable. [coreyhaines31/marketingskills, revops]
4. **Shared definitions.** Marketing, sales and CS agree on them; "If marketing calls something an MQL but sales won't work it, the definition is wrong." [coreyhaines31/marketingskills, revops]
5. **An MQL needs fit and engagement;** "Neither alone is sufficient." A named high-intent action (demo request) can qualify on its own ([LIFECYCLE.md](LIFECYCLE.md#the-mql)). [coreyhaines31/marketingskills, revops]
6. **One SLA tier table.** The source gives several first-contact clocks; its own rule is to apply the team's agreed rule and, without one, alert the current owner or queue rather than transfer ownership ([LIFECYCLE.md](LIFECYCLE.md#slas)). [coreyhaines31/marketingskills, revops]
7. **Route most-specific first, always to someone.** Named account, then segment, territory, round-robin, then a team queue with an SLA; log every decision ([LEAD-ROUTING.md](LEAD-ROUTING.md)). [coreyhaines31/marketingskills, revops]
8. **A submission is never lost, rejected or duplicated by enrichment.** Record it before the lookup, key it on a stable submission id, treat "provider returned nothing" as unknown, and never let a late result steal an owner or swap a calendar ([INBOUND-ENRICHMENT.md](INBOUND-ENRICHMENT.md)). [coreyhaines31/marketingskills, revops]
9. **Scores are calibrated, not copied.** Point tables are templates; thresholds are chosen on development cohorts with features as of the decision, then checked on an untouched later holdout ([LEAD-SCORING.md](LEAD-SCORING.md#threshold-calibration)). [coreyhaines31/marketingskills, revops]
10. **Suppressed is permanent.** Opted out, bounced, hostile, customer or competitor: never contacted again unless they opt back in, and the CRM mirrors the email suppression list ([LIFECYCLE.md](LIFECYCLE.md#outbound-stages)). [coreyhaines31/marketingskills, revops]
11. **Benchmarks are labelled.** The source's conversion rates, coverage ratio, LTV:CAC and win rate carry no citation; show them as the source's, or replace them with the team's baseline. Its speed-to-lead multipliers are left out ([LEAD-ROUTING.md](LEAD-ROUTING.md#speed-to-lead)).
12. **Current vendor mechanics.** Trigger HubSpot workflows on the Lead Scoring tool's score property, not the retired "HubSpot Score"; build Salesforce automation in Flow, not Process Builder ([CRM-AUTOMATIONS.md](CRM-AUTOMATIONS.md)).

## Output

[coreyhaines31/marketingskills, revops] Each as a standalone document the user can implement, with platform-specific guidance when the CRM is known:

1. **Lifecycle stage document:** stage definitions with entry and exit criteria, owners and SLAs.
2. **Scoring specification:** fit and engagement attributes with point values and the MQL threshold, plus the calibration record.
3. **Routing rules document:** decision tree with assignment logic and fallbacks.
4. **Pipeline configuration:** stage definitions, required fields and automation triggers.
5. **Metrics dashboard spec:** key metrics, data sources and targets.

For form enrichment, add the branch table, required fields and sources, response budget, fallback, ownership rules, replay handling, launch scope and pilot results.

## Prove it

From the source's evals: a lifecycle request gets every stage with entry and exit criteria, the handoff and the scoring setup for the named CRM; an enterprise scoring request gets fit, engagement and negative dimensions weighted toward fit, with MQL and SQL thresholds; a messy pipeline gets stage exit criteria, a maximum time per stage and enforcement through automation; a dashboard request is organised by audience (marketing, sales, executive) with CAC, LTV:CAC, velocity and coverage; a CRM cleanup covers dedup, required fields and prevention; a request for cold email copy is routed to [cold-outreach SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cold-outreach/SKILL.md); a demo form whose enrichment times out keeps the submission and the existing owner, creates nothing twice on a replayed webhook, never silently swaps owner or calendar, and is measured on both form experience and sales response.
