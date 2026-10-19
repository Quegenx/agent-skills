---
name: ad-creative
description: "Writes, iterates and scales ad creative for Google, Meta, LinkedIn, TikTok and X: angles, headlines, descriptions and primary text within each platform's current limits, a grounded inputs corpus so nothing is invented, falsifiable test hypotheses, ad-specific AI tells, iterating from performance data, awareness-stage headlines, the three-part hook and its diagnostic funnel, the creative strategy loop (signals, evidence tiers, roadmap, monthly retro), competitor ad and review research, format tiers and 22 static templates, vertical video specs and creator formats, faceless motion ads, dramatized chat-style reveal videos behind a compliance gate, and a self-contained creative review page. Use when writing ad copy or headlines, generating a batch of ads, iterating on ad performance data, planning which ads to make next, choosing a format, producing a vertical or motion video ad, or presenting concepts for approval."
---

# Ad creative

Ad creative fails on its inputs more often than on its writing: ungrounded generation produces plausible ads based on what a model has seen, not on what converts for this brand, and generating at volume multiplies whatever tic the first draft has. So this skill starts from real winning ads, reviews and comments, writes to each platform's current limits, and treats every concept as a hypothesis that can lose. It comes from [coreyhaines31/marketingskills, ad-creative] v2.12.1 (MIT, Copyright (c) 2025 Corey Haines) and the creative-research reference of [coreyhaines31/marketingskills, ads]; their credited practitioner sources are Dara Denney (format tier list, research automation), Oren John (vlog structures), Daniel Hangan's `reelclaw-templates`, Shiv Sakhuja and gooseworks-ai (chat reveals), Borja and Bomx's `super-video-maker` (motion ads) and ivangfalco/ads-skills (awareness headlines). Platform limits were checked against Google, Meta, LinkedIn, TikTok and X help pages, and the FTC rules on reviews and endorsements are cited where formats touch them. Campaign strategy, budgets and kill rules are in [paid-ads](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/SKILL.md); the app-install creative pipeline is in [app-growth AD-CREATIVES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/AD-CREATIVES.md).

**Context file.** Read `.agents/product-context.md` first ([anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md)); the source calls it `.agents/product-marketing.md`. Check its Learnings section before drafting: angles, offers and formats already tested there aren't new ideas, and active lessons apply unless the user says otherwise [coreyhaines31/marketingskills, ad-creative].

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Character limits and sizes for Google RSA and PMax, Meta feed, Reels, Stories and lead forms, LinkedIn, TikTok and X, character counting, writing across platforms | [PLATFORM-SPECS.md](PLATFORM-SPECS.md) |
| Primary-text formulas, search headline shapes, social hooks, CTAs by stage and test order | [COPY-FORMULAS.md](COPY-FORMULAS.md) |
| Text-led headlines by awareness stage, six treatments, the evidence sheet, headline as the visual | [HEADLINES.md](HEADLINES.md) |
| The hook as visual + spoken line + caption, the segment-to-hook pipeline and matrix, 14 opening moves, the diagnostic funnel, the on-ramp, fidelity laddering | [HOOKS.md](HOOKS.md) |
| Which ads to make next: three signals, evidence tiers, exploration vs scaling, the roadmap and production tiers, the monthly retro, Ad Library and review research | [CREATIVE-ROADMAP.md](CREATIVE-ROADMAP.md) |
| Which format: unicorn scalers vs supporting cast, the S to F tiers of Meta formats | [FORMAT-TIERS.md](FORMAT-TIERS.md) |
| 22 static templates with tier, structure, copy slot and sourcing, the per-concept output, batch weighting | [STATIC-TEMPLATES.md](STATIC-TEMPLATES.md) |
| Any 9:16 video: canvas, safe zones, caption recipe, audio defaults, and 13 creator formats with founder vlog structures | [SHORT-FORM-VIDEO.md](SHORT-FORM-VIDEO.md) |
| Faceless motion ads: poster stills, image-to-video, TTS and word-timed captions, nine style formulas, gotchas, tool choice | [MOTION-VIDEO.md](MOTION-VIDEO.md) |
| Chat, AI-answer, notes and share-sheet reveal videos: the compliance gate first, then angles, script, production and craft | [NATIVE-REVEAL-VIDEO.md](NATIVE-REVEAL-VIDEO.md) |
| A self-contained HTML page for a client to review and pick concepts | [REVIEW-PAGE.md](REVIEW-PAGE.md), [assets/creative-review-template.html](assets/creative-review-template.html) |

Related: copy craft and claim tests in [anti-slop-copy](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md); AI-writing tells in [anti-slop-writing TELLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/TELLS.md); test design in [ab-testing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SKILL.md); voice-of-customer mining in [customer-research](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/customer-research/SKILL.md); creator deals and disclosure in [creator-marketing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/creator-marketing/SKILL.md); FTC rules on free, scarcity and guarantees in [offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md); still images and generated video for marketing in [marketing-images](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-images/SKILL.md) and [marketing-video](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/marketing-video/SKILL.md); running batches on a schedule in [marketing-loops](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-loops/SKILL.md).

## Modes

From [coreyhaines31/marketingskills, ad-creative]:

1. **Generate from scratch:** a full set from product context, audience and platform specs.
2. **Iterate from performance data:** pull data → find winning patterns → generate variations → validate specs → deliver (below).
3. **Scaled static batches (grounded):** recurring volume (say 50 concepts a batch) from the inputs corpus and [STATIC-TEMPLATES.md](STATIC-TEMPLATES.md); text-led statics use [HEADLINES.md](HEADLINES.md); a batch for someone else's approval becomes a [review page](REVIEW-PAGE.md).
4. **Creative strategy loop:** decide which ads are worth making before making them ([CREATIVE-ROADMAP.md](CREATIVE-ROADMAP.md)), with hooks and funnel diagnosis from [HOOKS.md](HOOKS.md).

**Ask first** what the context file doesn't cover: platform and format (search RSA, display, feed, stories, video), existing ads to iterate on; the product, offer, value proposition and difference from competitors; audience, awareness stage and the pains that drive them; for iteration, what runs, what wins and loses (CTR, CVR, ROAS) and which angles were tested; constraints (voice, words to avoid, industry and platform rules, mandatory brand, trademark or disclaimer elements).

## Grounded inputs

For scaled production keep a durable corpus [coreyhaines31/marketingskills, ad-creative]:

```
inputs/
  winning-ads/   10-20 screenshots of the best ads from the last 90 days
  reviews/       50-100 customer reviews (Trustpilot, G2, Amazon, App Store) as .md/.txt
  comments/      Top comments from existing ads: objections, unprompted praise, customer-raised angles
brand/           Voice doc, hex codes, logo, product and screenshot assets
outputs/         Dated batch folders (outputs/YYYY-MM-DD/)
```

Winning ads carry the hooks and structures already proven here; reviews carry buyers' exact words for pain, transformation and unexpected benefits (quote them, don't paraphrase); ad comments are the most-skipped, highest-value input, since objections become FAQ ads and unprompted praise shows angles you didn't write. Collecting reviews: [CREATIVE-ROADMAP.md](CREATIVE-ROADMAP.md#research-workflows), within each site's terms.

- Every concept cites its source (which review, winning ad or comment).
- No invented claims, stats or testimonials, ever.
- If `inputs/winning-ads/` or `inputs/reviews/` is empty, stop and ask for them; don't generate ungrounded concepts as a fallback.
- Inputs decay: refresh winning ads as new ones scale, reviews and comments monthly.

## Writing the copy

1. **Define 3 to 5 angles,** each a different reason to click: pain point ("Stop wasting time on X"), outcome ("Achieve Y in Z days"), social proof, curiosity, comparison ("Unlike X, we do Y"), urgency (only when genuine), identity ("Built for [role]"), contrarian ("Why [common practice] doesn't work").
2. **Vary within each angle:** word choice, specificity (numbers vs general claims), tone (direct, question, command), structure (short punch vs full benefit).
3. **Validate against specs:** count every line against [PLATFORM-SPECS.md](PLATFORM-SPECS.md); flag anything over and give a trimmed alternative.
4. **Organize for upload** in the shape the platform takes.

**Headlines:** specific ("Cut reporting time 75%") over vague; benefits over features; active voice; numbers when you have real ones. Avoid jargon the audience doesn't use, unsupported "best" or "leading", all caps, clickbait the page can't pay off, and nicknamed product names: use the exact product name the brief gives, in every field, unless a short form is approved. **Descriptions** complement headlines with proof, a handled objection ("No credit card required"), a reinforced CTA, or urgency that is real [coreyhaines31/marketingskills, ad-creative]. The claim tests every line must pass are in [anti-slop-copy](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md#3-tests-every-headline-and-claim-must-pass).

**Test hypotheses that can lose.** "This will resonate with renters" can't lose; "beats the control on CTR among renters" can. Name the metric (CTR, CVR, CPA, thumbstop rate) and the comparison (which control or sibling concept, in which audience); state the direction, and a magnitude when a baseline exists ("+15% CTR vs Concept A"); derive it from the angle's motivation so a win or loss teaches you about the audience [coreyhaines31/marketingskills, ad-creative].

**No AI tells.** Check the whole batch, since volume multiplies tics. The general list (contrast reveals, negation lists, trailing pile-ons, self-answered questions and colon reveals, stock phrases, em dashes) is in [anti-slop-writing TELLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/TELLS.md). Ad-specific ones [coreyhaines31/marketingskills, ad-creative]:

- **Stacked negations to fit a limit:** "No setup. No fees. No contracts." Keep the one that matters and use the space for a fact. One plain absence ("No card required") is fine.
- **Hook slop:** a generic "POV:", "Stop scrolling", "Here's what nobody tells you about X". A POV hook is fine when the situation is hyper-specific ("POV: it's 3pm and you're on your fourth coffee"). app-growth's TikTok format table, from [appeeky], suggests "POV: you finally [solved problem]" and "Stop scrolling if you [persona trait]" ([app-growth TIKTOK-ADS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/TIKTOK-ADS.md#formats)); this source counts both as slop unless made specific. Both are practitioner; fill the slot with the viewer's exact situation either way.
- **CTA slop:** "Get started today", "Join thousands of happy customers". Name the action and what they get.
- **Same shape across a batch:** ten variations that all open the same way read as generated even when each is fine alone.

## Iterating from performance data

1. **Winners:** by the metric that matters (ask: CTR, conversion rate or ROAS), find winning themes, structures (questions, statements, commands, numbers), recurring words, and whether winners are shorter or longer.
2. **Losers:** themes that fall flat and the patterns they share (generic, long, wrong tone).
3. **New variations:** double down on winning themes with fresh phrasing, extend winning angles, test 1 or 2 new angles, avoid the losers' patterns. Read the whole funnel before calling a winner: strong CTR with weak qualified conversion is a page or promise problem ([HOOKS.md](HOOKS.md#the-diagnostic-funnel)).
4. **Log it:**

```
## Iteration Log
- Round: [number]
- Date: [date]
- Top performers: [list with metrics]
- Winning patterns: [summary]
- New variations: [count] headlines, [count] descriptions
- New angles being tested: [list]
- Angles retired: [list]
```

When to judge an ad is a sample-size question. The source says "Allow 1,000+ impressions before judging"; app-growth's [appeeky] lines use "CTR < 0.5% after 5K impressions" and about 2× target CPA in spend before a kill ([app-growth META-ADS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/META-ADS.md#decide)). Both are practitioner; the account-level rules (sample size, lag, learning) are in [paid-ads](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/AUDIT-GUARDRAILS.md#recommendation-safety).

## Output formats

**Standard,** grouped by angle with a character count per line [coreyhaines31/marketingskills, ad-creative]:

```
## Angle: [Pain Point - Manual Reporting]

### Headlines (30 char max)
1. "Stop Building Reports by Hand" (29)
2. "Automate Your Weekly Reports" (28)
3. "Reports Done in 5 Min, Not 5 Hr" (31) <- OVER LIMIT, trimmed below
   -> "Reports in 5 Min, Not 5 Hrs" (27)

### Descriptions (90 char max)
1. "[proof point from the corpus]. Start free." (NN)
```

**Bulk CSV** for 10+ variations, for direct upload:

```csv
headline_1,headline_2,headline_3,description_1,description_2,platform
"Stop Manual Reporting","Automate in 5 Minutes","[proof headline]","[description]","[description]","google_ads"
```

**Static batch** (Mode 3): `outputs/YYYY-MM-DD/INDEX.md` (every concept with template, tier and grounding source, scannable in two minutes), `concepts/` (one file per concept), `images/`. Picking 5 from 50 grounded concepts beats picking 5 from 10.

**Iteration report:** analyzed counts, top and worst performer with metric, the pattern, the new creative, and recommendations (what to pause, scale, test next).

**Batch generation:** split headline (click), description (conversion) and primary text (engagement) work; generate in waves (core angles 3 to 5 × 5 variations, then extensions of the top 2, then wild cards); then filter: over-limit lines, duplicates and near-duplicates, possible policy problems, headline and description pairs that don't make sense together.

## The rules

1. **Ground every concept** in a real winning ad, review or comment and cite it; with an empty corpus, stop and ask [coreyhaines31/marketingskills, ad-creative].
2. **Fit the platform's current limits** from [PLATFORM-SPECS.md](PLATFORM-SPECS.md), printed per line; the source's own Meta, LinkedIn, TikTok, PMax and X numbers were stale and are corrected there with URLs.
3. **RSA headlines stand alone and in any combination;** include at least one keyword, one benefit and two or three CTA headlines; pin only when necessary [coreyhaines31/marketingskills, ad-creative].
4. **Write hypotheses that can lose:** metric, comparison, direction [coreyhaines31/marketingskills, ad-creative].
5. **One variable per test cycle,** and read the funnel stage that moved before rewriting anything ([HOOKS.md](HOOKS.md#the-diagnostic-funnel)).
6. **No fabricated proof.** Reviews and testimonials by "someone who does not exist, such as AI-generated fake reviews, or who did not have actual experience" are prohibited under the FTC's rule (16 CFR Part 465, https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials); dramatized scenes are labeled as dramatizations ([NATIVE-REVEAL-VIDEO.md](NATIVE-REVEAL-VIDEO.md#the-compliance-gate)).
7. **Disclose AI-generated media where the platform requires it** ([MOTION-VIDEO.md](MOTION-VIDEO.md#compliance)) and paid creator content always ([creator-marketing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/creator-marketing/SKILL.md)).
8. **Strategy belongs to paid-ads.** Asked which platforms or budgets, route to [paid-ads](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/SKILL.md); asked for ad copy there, it routes here [coreyhaines31/marketingskills, ads, evals #6; ad-creative, evals #6].

## Prove it

- A Meta set for a B2B writing tool has 3 to 5 angles, several variations each, a hook, body and CTA, visual direction, which angle to test first, and every line counted against Meta's current limits (primary text 50 to 150, headline 27), not the source's 125/40/30 [coreyhaines31/marketingskills, ad-creative, evals #1].
- An RSA set for "best CRM for small business" has 10 to 15 headlines within 30 characters and 4 descriptions within 90 (Google permits at most four; the old expectation said "4+", https://support.google.com/google-ads/answer/7684791?hl=en), the keyword in headlines, sparing pinning and suggested assets [evals #2].
- Ten primary-text variations for a no-code builder contain no stacked triple negation, no contrast reveal, no self-answered question, no em dash, no generic POV or "Stop scrolling", and don't share one sentence shape [evals #16].
- Asked to fill formulas with made-up results and no product, audience or proof, the answer asks for them and invents nothing [evals #20].
- Every file's own Prove it passes for the parts you touched.
