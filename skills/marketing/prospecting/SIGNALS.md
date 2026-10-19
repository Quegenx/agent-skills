# Signals and tiers

"A list tells you who could buy. A signal tells you who might buy now." [coreyhaines31/marketingskills, prospecting] references/signal-plays.md. Signals are a timing and relevance filter; they don't replace ICP fit: "A strong signal at a company outside your ICP is still a skip, and a great-fit account with no signal can still get a well-aimed message built on its situation." The plays a signal fires are in [cold-outreach PLAYS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cold-outreach/PLAYS.md).

## Rank signals by how close they are to you

[coreyhaines31/marketingskills, prospecting] Work down the list and stop where you have enough volume.

| Rank | Signal | Why it works | Typical source |
|---|---|---|---|
| 1 | Your own product usage: a signup from a company domain, a plan limit hit, a big upload, a team invite | They already chose you once | Your product analytics, billing |
| 2 | Past champions changing jobs | Former users bring the tool; the source says vendors report win rates "roughly double" | CRM contacts + job-change tracking |
| 3 | High-intent website visits: pricing, comparison, integration pages | Active evaluation | Visitor identification ([SOURCING.md](SOURCING.md#visitor-identification)), your analytics |
| 4 | Engagement with you or a competitor: comments, community questions | Public interest in the problem | Social listening tools |
| 5 | Hiring in the function you serve, or a new leader in it | New budget and a mandate | Job boards, LinkedIn |
| 6 | Funding, launches, expansion | Budget and pressure to grow | Crunchbase, news, press releases |
| 7 | Tech stack changes next to yours | A related decision is in motion | BuiltWith, Wappalyzer, job-post tech mentions |
| 8 | Generic third-party intent | "Weakest, and noisy" | Intent feeds, review-site intent |

"Stack signals before acting on the weaker ones." Hiring a lifecycle marketer plus an email platform in the stack plus a fit score above threshold is worth a sequence; any one alone usually isn't.

Your own product's events for rank 1 come from your analytics ([posthog SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/SKILL.md)).

## Freshness windows

[coreyhaines31/marketingskills, prospecting] Act inside the window or downgrade the signal.

| Signal | Act within | After that |
|---|---|---|
| Product usage spike, limit hit | Same day (ideally within minutes) | Treat as a normal product-qualified lead |
| Pricing or comparison page visit | 24 hours | Drop to the general list |
| Champion job change | 30 to 90 days in the new role | They've already chosen their stack |
| New leader in the function | First 90 days | Priorities are set |
| Job post for the function | While the post is open, up to about 60 days | Hire made, budget allocated |
| Funding announcement | 30 to 60 days | Old news; don't congratulate on it |
| Tech install or removal | 30 days | Decision done |

"Record the signal date on every lead. A lead sheet without signal dates can't be prioritized."

## From signal to play

[coreyhaines31/marketingskills, prospecting] Map every tracked signal to a play so nobody improvises the angle at send time.

| Signal | Play | Opening angle | Channel order |
|---|---|---|---|
| Product limit hit | Sales-assist | Offer to help them get more from the plan they're outgrowing | Email from a founder or account owner within minutes, then LinkedIn |
| Champion job change | Reunion | The work they did with you before; how the new team handles it | LinkedIn first, then email |
| Pricing page visit (identified) | Evaluation help | Don't mention the visit. Lead with the decision they're probably weighing | Email, then call for Tier 1 |
| New leader in the function | First 90 days | What new leaders in that role usually fix first, with proof | LinkedIn connect, then email |
| Hiring for the function | Bridge the gap | What they can get done before the hire lands, or what the hire will need | Email |
| Competitor engager | Alternative | The problem they engaged with, not the competitor | LinkedIn, then email |

"Write the angle as the problem the signal implies. 'Saw you raised a Series A' is a fact everyone else sent. 'Most teams that just raised are told to double pipeline in two quarters, and the site usually becomes the bottleneck' is a reason to reply."

## Two worked examples

[coreyhaines31/marketingskills, prospecting]

- **A services agency selling to B2B SaaS (for example a CRO and landing page agency).** Signals: funding in the last 60 days; a new VP of marketing or head of growth; open growth or performance marketing roles; a redesigned site or new pricing page; paid campaigns launching. Play: value-first teardown, sent only after they say yes. Volume: "about 50 well-researched accounts a week beats 5,000 generic sends."
- **A self-serve SaaS tool (for example an email verification product).** Signals: company-domain signups, credit or plan limits hit, large uploads, team invites; off-product, companies hiring lifecycle, RevOps or SDR roles and outreach tools in their stack. Play: product-led for usage signals, problem-led for the rest. "Every send has to model the deliverability the product sells."

## Account tiers

[coreyhaines31/marketingskills, prospecting] Assign the tier before writing anything.

| Tier | Accounts | Research | Channels | Copy |
|---|---|---|---|---|
| Tier 1 (1:1) | Top about 25 to 50 by fit and signal | A full account brief ([ACCOUNT-RESEARCH.md](ACCOUNT-RESEARCH.md#the-tier-1-brief)), mobile numbers | Email, LinkedIn, phone, video, possibly direct mail | Written per person; a human reviews every message |
| Tier 2 (1:few) | Segments of 20 to 200 sharing one specific pain | Segment research plus one personal line | Email and LinkedIn | Per segment with a personal opener; a human reviews a sample |
| Tier 3 (1:many) | Everyone else who fits | The segment definition is the research | Email | Per segment; relevance comes from how tight the segment is |

Keep campaigns small: the source says several vendor and agency datasets show campaigns of 50 or fewer recipients replying "at roughly twice the rate of campaigns over 1,000".

## Tools for detecting signals

[coreyhaines31/marketingskills, prospecting] Vendor names as the source lists them, not verified: job posts and hiring (TheirStack, PredictLeads, LinkedIn Jobs by hand); job changes (UserGems, Clay job-change tracking, manual checks of past champions); website visitors (RB2B, Warmly, Vector, Koala); social and community engagement (Trigify, Common Room); funding and news (Crunchbase, news search, Exa); tech stack (BuiltWith, Wappalyzer, tech mentions in job posts); product usage (your own analytics and billing events, by webhook into the CRM). A scheduled sweep of these is in [marketing-loops SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-loops/SKILL.md).

## Common mistakes

[coreyhaines31/marketingskills, prospecting] Treating any funding round as a signal for everything; opening with the signal ("Congrats on the raise") instead of using it to choose the angle; acting on stale signals ("A six-month-old job change is just a job"); "Mentioning website visits that the prospect doesn't know were tracked. It reads as surveillance."; running every account at the same depth.

## Prove it

Every lead has a signal date and its signal is inside the freshness window or downgraded; every signal type you track maps to one row of the play table; no Hot lead rests on a rank-8 signal alone; no draft mentions a tracked visit or opens with congratulations; and each account has a tier before any copy exists.
