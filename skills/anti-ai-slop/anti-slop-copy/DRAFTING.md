# Drafting

How to draft or rewrite page copy so it keeps the writer's good choices and earns every line. Source: [coreyhaines31/marketingskills, copywriting] (v2.3.1, MIT, Corey Haines), whose diagnosis, three-question gate and decompose-and-lock are "adapted from Profound's `improved-copywriting` skill ([skills-marketing-library](https://github.com/retieedra-profound/skills-marketing-library), MIT)"; its `ai-tells.md` credits the build-a-writer questions to Profound's `humanizer` and `improved-copywriting` and Wispr Flow's `writing` skills (same library). Quotes keep the source's words with its dashes replaced. Reviewing copy someone else wrote is in [REVIEW.md](REVIEW.md); the patterns to remove are in [TELLS](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/TELLS.md).

## Diagnose the situation first

[coreyhaines31/marketingskills, copywriting] "Before drafting, decide which of three situations you're in. Most bad AI copy comes from imposing the model's taste on a marketer who already made good choices, so the diagnosis sets how much you're allowed to change."

| Situation | What you were given | Your job |
|---|---|---|
| **A. Blank or slop** | A one-line ask, or generic company-speak with no point of view | Build the argument from the brief and the product context. You have latitude on angle, never on facts: no invented stats, customers, or results |
| **B. Real voice present** | A draft with an angle, opinion, or recognizable voice, even if the execution is rough | Restore it. Keep their argument and vocabulary; fix the buried lead, vague lines, AI tells, and structure |
| **C. Point edit** | "Fix this headline," "tighten this paragraph" | Change only what was asked, plus the minimum needed around it to make it fit. Return the rest untouched |

"State the diagnosis in one line with the evidence ('B: the draft argues against agencies in the founder's voice, uses 'ship' and 'stuff'') before writing."

## From research to a draft

[more skills, copywriting-playbook.md]

1. Check whether audience research already exists. Fill missing evidence through [customer-research](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/customer-research/SKILL.md), keeping the profile and [quote bank](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/customer-research/SOURCES.md#what-to-capture) available before drafting. A research-only request returns those assets rather than unsolicited copy.
2. Position from the overlap between dissatisfaction with alternatives and the product's actual strengths. For the existing [so-what pass](REVIEW.md#the-seven-sweeps), the guide proposes asking twice to reach the felt outcome. Use the audience's evidenced vocabulary within the confirmed [brand voice](VOICE.md#build-the-profile-from-evidence); research does not replace a real writer's choices.
3. Pick the framework for the format and the reader's [awareness](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-council/advisors/eugene-schwartz.md#core-frameworks). Reuse the [PAS and feature-benefit definitions](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ad-creative/COPY-FORMULAS.md#primary-text) and existing [AIDA framework](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cold-outreach/COPY.md#frameworks). A true founder story can follow the shared problem, attempted alternatives and discovery; never supply an experience the founder did not have.
4. Choose proof that answers the leading research objection. Deliver brief notes identifying which harvested phrases were used and which objections the copy answers. For existing copy, explain the supported changes while preserving the diagnosis and scope above.

[more skills, copywriting-playbook.md] If proof is absent and the product really is early, say so plainly and use truthful specifics and actual guarantee terms. The guide's claim that the early label converts buyers is unverified; the disclosure does not promise a result.

[more skills, copywriting-playbook.md] Its optional readability targets are sentences around 11 to 14 words and roughly eighth-grade vocabulary unless the audience expects specialist language. These are author heuristics, not standards, and do not override the real writer's sentence habits or the existing [review checks](REVIEW.md#quick-pass-checks).

## Read taste out of the input (B and C)

[coreyhaines31/marketingskills, copywriting] What they gave you is evidence of their judgment:
- **"Vocabulary is a voice choice.** If they write 'stuff' and 'ship,' don't upgrade to 'solutions' and 'deploy.'"
- **"Where they spent words is a priority choice.** Keep the emphasis."
- **"What they left out is a scope choice.** Don't add sections they didn't ask for."
- **"Their angle is the positioning.** Deepen it; don't replace it with one you like better."

"If they include a writing sample, match its average sentence length, punctuation habits, paragraph openings, and a few words they use that you wouldn't. A sample beats the default voice when the two conflict." The brand's own profile, when one exists, is in [VOICE.md](VOICE.md).

## Build a writer (Situation A)

[coreyhaines31/marketingskills, copywriting] "Removing patterns leaves copy that's clean and flat. Human-sounding copy comes from a specific person with uneven knowledge and real opinions." Before a full rewrite of Situation A copy, answer these silently:

1. **Who is writing?** "Name the person and role: the founder, the head of support, the engineer who built the feature. Say why they're writing this page."
2. **What do they know cold?** "Those parts get the most words and the most specific detail."
3. **What do they find boring or not know well?** "Those parts get compressed, or cut."
4. **What's their honest, arguable opinion** "about the problem, the category, or the old way of doing it?"
5. **If they had to cut a third, what goes first?** "Cut it now."

The traits the answers produce:
- **Uneven density.** "The section the writer cares about runs longest. Equal coverage of everything is a tell."
- **Mixed register.** "A precise technical term in one sentence, plain words in the next."
- **Honest limits.** "Saying who the product isn't for is a strong version of this."
- **Lopsided structure.** "At least one section is noticeably longer, and at least one is short, because that's how much there was to say."
- **Sentence length from the thought.** "Don't plan short-short-long rhythms."
- **Opinions that cost something.** "A real opinion is specific and someone could disagree with it ('Most onboarding checklists are busywork. Ours has three steps.'). 'We believe in quality' costs nothing."
- **First person only when it means something.** "First person that adds no fact is decoration."

Rules that override the persona: never invent the writer's opinions, experience, anecdotes, customers or results. Use supplied views and evidence, or flag what is missing. The source and this file formerly permitted constructing opinions; the applicable AGENTS writing rule forbids invented opinions and takes precedence. The source's `[NEED: founder story]` marker remains useful for missing experience. In Situation B the writer already exists: match the real voice and brand register. [coreyhaines31/marketingskills, copywriting/references/ai-tells.md; repository AGENTS.md, Writing and Editing]

**A different generation workflow.** Yuzzyuk/marketing-os asks for 15 to 20 independently generated variants, then comparison with the draft, and says not to anchor on the user's version. Keep that as an option for requested wide exploration in Situation A. The existing B/C restoration and point-edit rules remain: the source's blanket generation rule does not authorize replacing a real voice or expanding a one-line edit. Both workflows use the same [.agents/product-context.md definition](CONTEXT.md). [Yuzzyuk/marketing-os, references/copy.md; coreyhaines31/marketingskills, copywriting]

## Decompose and lock

[coreyhaines31/marketingskills, copywriting] "Don't write the page in one pass. Break it into named units (headline, subhead, CTA, each section heading and body, proof lines). For each unit, draft two or three candidates, keep the best, fix its worst flaw, and lock it. Assemble and read the whole page once for flow. In Situation B, lines that already work are locked from the start." The headline gets three to five candidates from different angles ([PAGES.md](PAGES.md#the-hero-problem-picture-path)).

## The three-question gate

[coreyhaines31/marketingskills, copywriting] Run every line you write or keep through three questions:
1. **"Can the reader picture it?** A specific image, scene, or object beats an abstraction."
2. **"Can it be proven true or false?** A falsifiable claim is a claim; 'best-in-class' is decoration."
3. **"Could a competitor write this exact sentence?** If yes, it fails (the swap test)."

"Three passes, keep it. Two, sharpen the weak one. One or none, rewrite it from the facts or flag what's missing with `[NEED: ...]`." The swap, "Now you can..." and proof tests in [SKILL.md](SKILL.md#3-tests-every-headline-and-claim-must-pass) still apply.

## Ration the punch

[coreyhaines31/marketingskills, copywriting] "Most lines should be plain, specific, and declarative. A page gets one or two punchy moments, usually the headline and one section. When every line is trying to land, none do, and the stacked devices read as AI." Analogies and wit are allowed on the same budget: "Puns and wit make copy memorable when they fit the brand and don't cost clarity."

## Decline a claim with its unlock

[coreyhaines31/marketingskills, copywriting] "When a requested claim isn't supported, don't write it and don't silently drop it: name the claim, say why it falls short, offer the closest supportable alternative, and state exactly what evidence would unlock the original, a customer-review export, a written guarantee policy, a certification, a citable study or dataset. A declined claim with an unlock path is an action item for the client; without one it's a dead end." List each one with the open `[NEED: ...]` items at the end of the delivery.

## The leave-it-alone test

[coreyhaines31/marketingskills, copywriting] "Before delivering, check each change: is it measurably better, or just different? Revert changes you can't give a reason for. This matters most in Situations B and C."

## Output for a point edit

[coreyhaines31/marketingskills, copywriting] "For a point edit (Situation C), return only the changed lines with a one-line reason each. Skip the annotations and alternatives below unless asked." Full-page output is in [SKILL.md](SKILL.md#6-output).

## Prove it

- The delivery opens with a one-line diagnosis (A, B or C) and its evidence.
- In B and C, the writer's words, emphasis and angle survive: no "stuff" became "solutions", no section was added.
- Every kept line passes at least two of the three gate questions; the rest are rewritten or carry a `[NEED: ...]`.
- At most one or two punchy moments on the page.
- Every declined claim names the evidence that would unlock it.
- No opinion, anecdote, customer, quote or number is invented; missing evidence is flagged rather than filled by a persona. [repository AGENTS.md, Writing and Editing]
- For research-led copy, the delivery identifies the actual phrases used and objections answered; early-stage disclosure and founder experience are true. [more skills, copywriting-playbook.md]
