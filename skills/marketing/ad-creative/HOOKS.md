# Hooks

The first three seconds decide whether the rest of the ad exists. Hooks are the highest-leverage unit of paid creative work, and hook *diversity* is what earns new learning: distinct hooks reach distinct pockets of the audience, while near-identical openings re-test what you already know. A system for generating, diagnosing and iterating hooks, from [coreyhaines31/marketingskills, ad-creative, hook-system.md] (MIT; practitioner). Use it inside generation (hooks for new concepts), iteration (why an ad underperforms) and the [creative strategy loop](CREATIVE-ROADMAP.md). App-ad hook scripts are in [app-growth TIKTOK-ADS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/TIKTOK-ADS.md#hooks).

**Contents:** [A hook is three components](#a-hook-is-three-components) · [The generation pipeline](#the-generation-pipeline) · [Opening moves](#opening-moves) · [The diagnostic funnel](#the-diagnostic-funnel) · [The on-ramp](#the-on-ramp) · [Fidelity laddering](#fidelity-laddering) · [Grounding](#grounding) · [Failure modes](#failure-modes) · [Prove it](#prove-it)

## A hook is three components

| Component | What it is | Job |
|---|---|---|
| **Visual action** | What literally happens on screen in seconds 0 to 3 | Stop the thumb |
| **Spoken line** | The first words of voiceover or dialogue | Open the loop |
| **Caption text** | The on-screen header or overlay | Anchor the claim for sound-off viewers |

**No duplication:** the three complement, never repeat. VO saying "I stopped paying $200/mo for my gym" over a caption reading the same words over a static talking head wastes two slots; split the work (the visual shows the cancellation email, the VO says the line, the caption names the alternative). Write all three columns explicitly; a hook spec with one column filled is a third of a hook. Statics collapse to two components (visual + headline), and the same rule holds: "the headline must not caption the image."

## The generation pipeline

```
Segment → Motivation → Format → Hook (three components)
```

1. **Segment:** a slice of buyers with a shared situation, from the corpus (reviews, comments, sales-call language). Narrower is sharper.
2. **Motivation:** the single pain, desire or objection that moves this segment, in their words, quoted from reviews and comments.
3. **Format:** street interview, POV selfie, screen recording, unboxing, side-by-side demo, text-on-screen static, founder to camera, reaction stitch. Pick it before the line: the same motivation reads differently as an interview answer and as a confession.
4. **Hook:** the three components for this segment × motivation × format cell.

Output a matrix so coverage shows:

```
| # | Segment | Motivation (verbatim source) | Format | Visual action | Spoken line | Caption |
```

Generate across the matrix, not down one column: ten hooks for ten cells beat thirty rewordings of one. Matrix diversity is audience diversity.

## Opening moves

Cycle through them; don't cluster on favorites.

| Move | Shape | Watch out |
|---|---|---|
| **Curiosity gap** | Withhold the noun: "The ingredient behind most 3pm crashes" | Must pay off within the ad, or it's clickbait that poisons CVR |
| **Bold claim** | A specific, falsifiable statement | Needs substantiation on screen or in the on-ramp |
| **First-person confession** | "I was doing [common thing] completely wrong" | Reads fake without lived-in detail |
| **Contrast / before-after** | Two states shown or named in the first beat | The transformation must be visually honest; before/after is regulated in health, finance and beauty |
| **Relatability / POV** | A hyper-specific situation: "POV: it's 3pm and you're on your fourth coffee" | Specificity is the whole mechanic; generic POV is invisible |
| **Question** | The exact question the buyer types into search or a chatbot | Their phrasing, verbatim from the corpus |
| **Implied answer** | Set up the situation so the viewer completes the thought without an explicit question | The inference must be small enough to follow; use known facts, not invented proof. [Yuzzyuk/marketing-os, references/hooks.md] |
| **Countdown / gamified** | A timer or challenge that promises a payoff | The payoff must exist; hold rate collapses on cheats |
| **Proof-first** | Lead with the receipt: result screenshot, stat, demo money-shot | Strongest when the proof brags by itself |
| **Choice** | Two options: "Sandler or MEDDIC for a $50K deal?" | Both must be real options the audience weighs |
| **Old vs new** | "We used to take elixirs. Now everyone drinks prebiotic soda. Which is better for your gut?" | The payoff must take a side, from expertise |
| **Us vs them** | "Most [role]s do X. The ones who [result] do Y." | Name a behavior the audience recognizes as what most really do |
| **False assumption** | Challenge something the buyer thinks they need: "You can cancel ClickFunnels" | Draws angry reactions too; keep the body fair, and get legal review before naming a competitor in paid ads |
| **Declaration, then question** | State what they agree with, then doubt it: "You need to spend $20K a month recruiting on Indeed. Or do you?" | The doubt needs a real answer; the source says practitioners were still testing it in October 2026 |

The last five are one family, contrast: people understand a thing by comparing it with something else. That is also why AI copy leans on "it's not X, it's Y"; the difference is that a good contrast hook compares two things the audience actually weighs, while the AI tell negates a claim nobody made ([anti-slop-writing TELLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/TELLS.md)). Contrast hooks suit education and decisions; for impulse products lead with proof or POV.

## The diagnostic funnel

Each metric isolates a component. Fix the part that failed instead of scrapping the ad:

| Stage | Metric | If weak, the problem is | Fix |
|---|---|---|---|
| Stop | Thumbstop / 3-second view rate | The visual action (and caption) | New visual opening, everything else the same |
| Stay | Hold rate (3 s → 15 s or 50% view) | The on-ramp after the hook | Rework seconds 3 to 15, not the hook |
| Click | CTR | Desire or offer clarity mid-ad | Sharpen the promise, CTA or proof |
| Convert | CVR after the click | Congruence: the page doesn't continue the ad | Fix the page or the claim ([cro](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cro/SKILL.md)) |

- **A great thumbstop is not a great ad.** Clickbait that attracts the wrong viewers shows as high thumbstop with collapsed hold and CVR. Read the whole funnel before declaring a winning hook.
- **One component per iteration:** the visual, or the on-ramp, or the offer framing.

This sharpens app-growth's diagnosis rows ("Weak hook / thumb-stop") in [app-growth META-ADS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/META-ADS.md#decide) and [app-growth TIKTOK-ADS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/TIKTOK-ADS.md#audits).

## The on-ramp

Seconds ~3 to 15 bridge hook and body. A good on-ramp extends the hook's premise; a bad one pivots to a pitch that abandons it. If the hook promises "what actually causes this", the next beat starts explaining the cause, not the brand story. So **every hook test is also an on-ramp test:** a new hook on an old body usually breaks the bridge; rewrite the on-ramp for each hook. Hold rate is its metric.

## Fidelity laddering

Match production cost to evidence (production tiers in [CREATIVE-ROADMAP.md](CREATIVE-ROADMAP.md#the-roadmap)):

- **Hunches ship low-fidelity within a day or two:** statics, text-on-screen video, voiceover over b-roll, remixes of existing footage. The goal is a cheap read on the angle.
- **Validated angles earn high fidelity:** creator shoots, street interviews, staged demos, only for hooks whose low-fi version already showed a funnel signal (even one metric, like a hold-rate spike on an ugly static).

Testing a hunch with an expensive shoot and a proven angle with a throwaway static are both mistakes; the ladder runs one way.

## Grounding

Hooks inherit every grounding rule ([SKILL.md](SKILL.md#grounded-inputs)): each cites the corpus source of its motivation; no invented claims, stats or testimonials; verbatim customer language over paraphrase. Also mine organic content in the niche for the audience's actual vocabulary (the slang for the pain, the term they use instead of the clinical one); the source mines it by scraping and social listening, done here within each site's terms ([CREATIVE-ROADMAP.md](CREATIVE-ROADMAP.md#research-workflows)). It's language research, not copying: take the vocabulary and visual conventions, never a creator's specific creative.

Yuzzyuk/marketing-os permits labelled "ungrounded hypotheses" without a corpus; this repo keeps its existing grounding requirement and does not manufacture customer language or evidence. Its borrowed-enemy tactic routes to the system/norm guardrails in [public-relations STORY-ANGLES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/public-relations/STORY-ANGLES.md), rather than defining another hook taxonomy here. [Yuzzyuk/marketing-os, references/hooks.md]

## Failure modes

Thirty rewordings of one cell; components duplicating each other; a new hook on an inherited on-ramp, with hold rate blamed on the hook; reading the funnel only to thumbstop, so clickbait winners scale into CVR craters; polished hunches; marketing-voice captions ("revolutionary formula" appears in neither the corpus nor the niche's content).

## Prove it

A hook batch is a matrix with all three components filled per row, a verbatim source per motivation, distinct segment × motivation cells rather than rewordings, and an on-ramp line per hook; a diagnosis names the funnel stage that failed and changes only that component.
