# A dated growth teardown

Investigate what a company actually changed in its marketing, what the available traffic history shows and which moves are worth adapting. Source: [newww/.agents/skills, reverse-engineer-marketing/SKILL.md and references/content-teardown.md, funnel-hack.md, go-inside.md, hidden-signals.md]. This is public evidence research, not permission to access private systems or contact anyone. Use the shared context in `.agents/product-context.md`; the claim and confidence definitions live in [EVIDENCE.md](EVIDENCE.md).

## Set the question

[newww/.agents/skills, reverse-engineer-marketing/SKILL.md]

- Identify the company, its offer and audience, the period to investigate and the decision this research should inform. Read actual product, pricing and conversion pages before treating its marketing as a model for another business.
- Separate the current funnel and content teardown from the historical question. Observe the promise, angle, proof, content formats, channel and next action on the checked pages. Do not infer a channel's importance solely from a visible widget or polished design.
- Record which evidence sources are available and which require owner-provided access. Stay within public, permitted access; report inaccessible pages and missing history as gaps.

## Build the timeline

[newww/.agents/skills, reverse-engineer-marketing/SKILL.md and references/hidden-signals.md]

- Put traffic estimates and observed marketing moves on a dated timeline. Keep the provider, metric, geography, device scope and reporting period consistent when comparing values; distinguish retrieval date from the date represented by a measurement.
- Record source URL and observation date for product or pricing changes, publishing, ads, funding, hiring, review activity and distribution. Distinguish an announcement's reported date from the first date you could observe the change. Keep a saved capture or diff when available.
- Archive first-seen is not launch date. Missing snapshots do not establish that a page, campaign or feature did not exist. Certificate records establish certificate issuance observations for a domain, not product launch. The source suggests certificates often precede launch by days; do not use that heuristic to invent a launch date. [official Certificate Transparency introduction](https://certificate.transparency.dev/)
- Provider traffic is an estimate. A channel mix, search increase or review spike can suggest a follow-up question; it does not prove that a particular campaign created demand. Use [marketing-attribution](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-attribution/SKILL.md) for causal claims.

## Turn observations into usable plays

[newww/.agents/skills, reverse-engineer-marketing/SKILL.md and references/content-teardown.md, funnel-hack.md and hidden-signals.md]

- Describe the observed move and its evidence before interpreting it. A logo does not establish a move upmarket; a referral code does not establish that a campaign remained profitable; high reach with no observed lift does not establish that the work achieved nothing. Apply [observed, inferred and implication](EVIDENCE.md#anti-hallucination-rules).
- Inspect the actual destination and journey before recommending an alternative. Name the checked gap and the buyer it affects. "No gap found" is a valid result; a blocked or uncaptured step is unknown. Prospect-specific plays use [prospecting SIGNALS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/SIGNALS.md#evidence-backed-gap-plays).
- For each proposed adaptation, give the evidence, the concrete next action, an owner and what to watch afterward. Separate observed practice from an experiment proposed for the user's different business; do not attach an invented uplift or benchmark.
- Keep the dated baseline and a watch list of meaningful changes, so later research reports a diff rather than retelling the same company story from memory.

## Prove it

Every historical move has a source and date; observed and reported dates are distinct; traffic comparisons keep provider and scope visible; archive and certificate observations are not presented as launch dates; inaccessible history stays unknown; each proposed play has evidence, an owner and a next step; and no correlated change is reported as proven marketing causation. [newww/.agents/skills, reverse-engineer-marketing/SKILL.md and references/hidden-signals.md; EVIDENCE.md]
