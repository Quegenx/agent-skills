# The product context file

One file of real facts that every piece of copy draws from, so nothing has to be invented and nobody repeats themselves. It lives at `.agents/product-context.md` in the project. Every marketing skill in this repo reads it. The sections below merge this repo's template with the one in [coreyhaines31/marketingskills, product-marketing] (v2.2.0, MIT, Corey Haines), which names the same file `.agents/product-marketing.md`.

## Finding it

Look for `.agents/product-context.md` first. If it isn't there, look for the names other tools use: `.agents/product-marketing.md`, `.claude/product-marketing.md` and the legacy `product-marketing-context.md` in `.agents/` or `.claude/` [coreyhaines31/marketingskills, product-marketing]; mobile skills also use `app-marketing-context.md` in the project root or `.claude/` ([app-growth LAUNCH-AND-MARKETING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/LAUNCH-AND-MARKETING.md)). Read whichever exists and offer to move it to `.agents/product-context.md`.

**If it exists:** "Read it and summarize what's captured: note its current **Document version** and the last few **Changelog** entries", "Ask which sections they want to update" and "Only gather info for those sections" [coreyhaines31/marketingskills, product-marketing]. Leave the other sections as they are.

## Making it

- **Draft from what exists (recommended):** read the README, the live site, landing pages, about pages, meta descriptions, docs, pricing, package metadata, reviews the user can share. Fill what the sources support, mark everything else `[ASK]`, then show the draft and ask "What needs correcting? What's missing?" [coreyhaines31/marketingskills, product-marketing].
- **From scratch:** go section by section in conversation, a few questions at a time, confirming each before moving on.
- Push for verbatim customer language. Exact phrases from reviews, calls and tickets are worth more than any polished description; [customer-research](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/customer-research/SKILL.md) is how to collect them.
- Ask for examples: "What's the number one frustration that brings people to you?" beats "What problem do you solve?".
- Skip sections that don't apply (personas for a consumer app, Paid Ads for a team that runs none).
- For an early-stage product, some sections will be thin and that's fine: accept lighter answers for Proof and Alternatives rather than filling them [coreyhaines31/marketingskills, product-marketing, evals].

## Sections

The optional sections (Paid Ads, Sales motion, SEO and the [mobile app fields](#mobile-app-context)) appear only when the team does that work.

```markdown
# Product context
Version: v1 | Last updated: YYYY-MM-DD

## Product
One line. What it does (2-3 sentences). Category (the shelf buyers look on, how they search for you). Type and business model. Pricing.

## Audience
Who buys (company type, size, stage or consumer profile). Who decides (roles, departments). The main job they hire it for, and 2-3 jobs to be done. Specific use cases.

## Buyers (B2B, if several people decide)
| Persona | Cares about | Challenge | Value we promise |
|---|---|---|---|
| User / Champion / Decision maker / Budget holder / Technical evaluator / Blocker | | | |

## Problems
The core problem before they find you, why current options fall short, what it costs (time, money, risk, opportunities), the emotional tension (stress, fear, doubt).

## Alternatives
- Direct: same solution, same problem. Falls short because...
- Secondary: different solution, same problem. Falls short because...
- Indirect: a conflicting approach (a person instead of software). Falls short because...
- Doing nothing. What it costs them.

## What's different
Capabilities the alternatives lack, how you do it differently, why that's better, why customers choose you.

## Objections and poor fits
| Objection (top 3 heard in sales) | The true answer |
|---|---|
Who this is not for.

## Switching (the JTBD Four Forces)
Push: what drives them away from today's way. Pull: what attracts them to you. Habit: what keeps them stuck. Anxiety: what worries them about changing.

## Customer language
How they describe the problem (verbatim). How they describe the product (verbatim). Words to use, words to avoid.
| Term | Meaning |
|---|---|

## Voice
Tone, formality, how direct, the language(s) and register (for Hebrew: register and gender approach).
| Attribute | Means | Doesn't mean | Example line |
|---|---|---|---|
Tone by context: support, launch, errors, sales, social.
Terms we own. Never use (and why).

## Proof
Real numbers with their source and date. Customers you may name. Quotes with name and role and permission. Certifications that actually exist.
| Value theme | Proof |
|---|---|

## Goals
The business goal. The main conversion action. Current numbers if known.

## Paid Ads (optional)
Target CPA or ROAS that keeps the business profitable, and the hard floor to flag at once.
Monthly budget and acceptable daily variance.
| Conversion action | Means | Value | Feeds bidding? |
|---|---|---|---|
Known tracking weaknesses (lag, double counting, offline gaps). What separates a good lead from a form fill.
Campaigns: [name]: what it's for.
Agent may: read, compare, flag, draft, recommend.
Agent may not (without approval): change budgets or bids, pause or launch, edit tracking, publish ads.

## Sales motion (optional)
Self-serve, inside, field or hybrid. Average deal size and cycle length. Who uses the collateral (AE, SDR, champion, prospect).

## SEO (optional)
Site stage (new, established, migrating, recovering from a drop). CMS. The goal with its metric and timeframe. 10 to 30 key pages, each a hub, spoke, money or other page. Research log.

## Learnings
Newest first. About 20 active entries.
| Date | Learning | Evidence | Applies to | Status |
|---|---|---|---|---|

## Changes
- v1 (YYYY-MM-DD): first version.
```

Where the sections come from: Paid Ads, Learnings, the personas, objections, glossary, voice and value-theme tables, the competitor tiers and the "JTBD Four Forces" name are [coreyhaines31/marketingskills, product-marketing]; the source's competitor examples are "Calendly vs SavvyCal" (direct), "Calendly vs Superhuman scheduling" (secondary) and "Calendly vs personal assistant" (indirect), and "Doing nothing" is this repo's addition. Sales motion and the Blocker role (who opposes the purchase; [sales-enablement SALES-ASSETS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sales-enablement/SALES-ASSETS.md)) are [coreyhaines31/marketingskills, sales-enablement]. The SEO section is [open-seo, seo-project-setup]; its full interview and research-log format are in [seo PROJECT-SETUP.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/PROJECT-SETUP.md). The full voice profile is in [VOICE.md](VOICE.md).

## Learnings

[coreyhaines31/marketingskills, product-marketing] "The Changelog records how the document changed. **Learnings** records what the team found out by shipping: which angles won, which offers flopped, which decisions were made and why." Every drafting task reads it first: "angles and claims already tested there shouldn't be re-proposed as new ideas, and active lessons apply unless the user says otherwise" [coreyhaines31/marketingskills, copywriting]; the emails skill reads it first with the same rule for "angles, offers, and formats" [coreyhaines31/marketingskills, emails].

- **Learning:** "one sentence, specific enough to change a draft. 'Price-anchored headlines beat outcome headlines on the pricing page' works. 'Be clearer' doesn't."
- **Evidence:** "the test, campaign, or source, with the number and sample size" (a test in [ab-testing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SKILL.md) is the usual source).
- **Status:** "`active`, `watch` (one data point, worth retesting), or `retired`."
- **What earns a place:** "A test result that reached its planned sample, or the same pattern seen in two or more campaigns"; "A decision the user made with a reason (positioning, pricing, a channel cut) that future drafts must respect"; "A correction the user gave more than once ('never call it a platform')".
- **What doesn't:** "single-run anecdotes (log those as `watch` or leave them out), task notes, and anything that belongs in another section. A new objection goes in Objections; a new customer phrase goes in Customer Language."
- **Retiring:** when "a later test contradicts it, the product or market changed underneath it (new pricing, new ICP), or it hasn't been relevant for two quarters. Change the status to `retired` and add a line saying why, rather than deleting it, so nobody re-tests a settled question." Move retired rows to the bottom and archive them past about 20 active rows.
- **Who writes it:** any task that finishes a test, campaign or postmortem may propose a row. "Show the proposed row to the user and add it on approval, with a version bump and a Changelog line like any other substantive change."

## Mobile app context

[eronred, app-marketing-context] The source uses a separate `app-marketing-context.md` with seven sections. Keep its fields in this shared file: reuse the existing Product, Audience, Alternatives and Goals sections, and add the app-specific fields under an optional Mobile section. Existing legacy files follow [Finding it](#finding-it); do not create a second context file.

| Source section | Fields to retain in the shared context |
|---|---|
| App Overview | Product: app name and price model (Free / Freemium / Paid / Subscription). Mobile: Apple numeric App ID, Google Play package name, primary and secondary category, platform (iOS / Android / Both), launch date and current version. |
| Value Proposition | Problems, Audience and What's different: problem, target audience, unique differentiator and one-sentence elevator pitch. |
| Competitors | Alternatives: the top 3 to 5 apps, with App, App ID, Strengths and Weaknesses. |
| Current ASO State | Mobile: title, subtitle, keyword field, rating (stars and count) and primary keywords. Offer to pull metadata when the App ID is known. |
| Goals | Goals: top 3, each written "Target: [metric] by [date]". |
| Resources | Mobile and Paid Ads where relevant: budget, team (solo / small / marketing), tools (analytics / Apple Ads / MMP) and constraints. |
| Markets | Mobile: primary and secondary markets and languages. |

Close the source's context intake with the confirmed strengths, gaps and next steps, such as an [ASO audit](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/SKILL.md). These mobile fields extend the same source-backed context; unknown facts still remain `[ASK]`. [eronred, app-marketing-context]

## Keeping it

On every real change, raise the version, update the date and add a line at the top of Changes saying what changed and why ("v3: repositioned from email tool to deliverability platform after 5 customer calls"). Typo fixes don't need a version. Every copy task reads this file first, and anything it doesn't contain is asked for, not invented. [coreyhaines31/marketingskills, product-marketing] adds: "Never rewrite or reorder past entries"; "Use today's date in ISO form (YYYY-MM-DD)"; "A good entry names the sections touched and the reason, not 'updated the doc.'"; and "When the change is a real repositioning, say so plainly: downstream skills will now generate against the new context."

## Prove it

- One context file exists at `.agents/product-context.md`; an older-named file was offered for the move, not duplicated.
- An update touched only the sections the user asked about and left the rest unchanged.
- Every fact the sources didn't support is `[ASK]`, not guessed.
- The version and date moved, and Changes has a new top line naming the sections and the reason.
- Every Learnings row has evidence with a number and sample size, and a status.
