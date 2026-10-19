# Reviewing copy

Editing or reviewing copy that already exists: pick the edit mode, run the seven sweeps one dimension at a time, optionally gate high-stakes copy with an expert panel, and report. Source: [coreyhaines31/marketingskills, copy-editing] (v2.2.0, MIT, Corey Haines); its edit modes are "adapted from Profound's `improved-copywriting` and Wispr Flow's `copy-editing` skills ([skills-marketing-library](https://github.com/retieedra-profound/skills-marketing-library), MIT)". Quotes keep the source's words with its dashes replaced. Interface strings are reviewed with [MICROCOPY.md](MICROCOPY.md#review-format); the prose patterns with [CHECK](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/CHECK.md).

## Pick the edit mode

[coreyhaines31/marketingskills, copy-editing] "Decide what you were handed before running any sweep. The mode sets how much you're allowed to change."

| Mode | Signs | What to do |
|---|---|---|
| **A. Blank or slop** | Generic company-speak, AI mush, no point of view | Run all seven sweeps. You may rebuild sentences from the underlying facts; never invent stats, customers, or results |
| **B. Real voice** | A clear angle or opinion, recognizable word choices, rough execution | Run all seven sweeps as restoration. Keep their argument, vocabulary, and emphasis. Fix the buried lead, vague lines, AI tells, and structure |
| **C. Point edit** | "Fix this headline," "is this sentence OK?", "tighten paragraph two" | Skip the sweeps. Use point-edit mode below |

**Point-edit mode** [coreyhaines31/marketingskills, copy-editing]:
- "Change only the line, word, or section named, plus the minimum around it needed for the edit to read cleanly (a pronoun, a transition)."
- "Check the edit against the AI Tells list and the surrounding voice, so the new line doesn't stand out."
- "Return only the changed text with a one-line reason per change, and offer one alternative if the choice is close."
- "Mention a serious problem elsewhere in one line at the end (a false claim, a broken CTA) without fixing it unasked."
- "Don't rewrite neighboring lines, add sections, or run a full sweep report."

Reading taste and the leave-it-alone test apply in every mode: [DRAFTING.md](DRAFTING.md#read-taste-out-of-the-input-b-and-c). anti-slop-writing's Edit job returns the full edited text plus a short **What changed**; a point edit returns only the changed lines, as above.

Before the first sweep: understand the goal, the audience and the desired action, and "Read through once without editing" [coreyhaines31/marketingskills, copy-editing].

## The seven sweeps

[coreyhaines31/marketingskills, copy-editing] "Edit copy through seven sequential passes, each focusing on one dimension. After each sweep, loop back to check previous sweeps aren't compromised." After the last one, return through all six earlier ones a final time.

1. **Clarity.** "Can the reader understand what you're saying?" Check "confusing sentence structures, unclear pronoun references, jargon or insider language, ambiguous statements, missing context". The killers: "Sentences trying to say too much", "Abstract language instead of concrete", "Assuming reader knowledge they don't have", "Burying the point in qualifications". Process: "Read through quickly, highlighting unclear parts. Don't correct yet, just note problem areas." Then confirm the "Rule of One" (one main idea per section) and the "You Rule" (copy speaks to the reader).
2. **Voice and tone.** "Is the copy consistent in how it sounds?" Watch for "Starting casual, becoming corporate", "Mixing 'we' and 'the company' references", "Humor in some places, serious in others (unintentionally)" and "Technical language appearing randomly". "Read aloud to hear inconsistencies." Judge against the brand profile in [VOICE.md](VOICE.md) when one exists, not general taste. A deliberate mixed register is not a finding: anti-slop-writing counts "Mixed casual and formal registers" as "Often a sign of a real person" ([TELLS](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/TELLS.md#what-is-not-a-tell)); this sweep flags the unintended shift.
3. **So what.** "For every statement, ask 'Okay, so what?' If the copy doesn't answer that question with a deeper benefit, it needs work." Look for "Missing 'which means...' bridges"; a wall of features gets "which means..." after each feature. The source's own fixed example is left out here: it carries an em dash and an unsourced "half the time".
4. **Prove it.** "Is every claim supported with evidence?" Proof types: "Testimonials with names and specifics, Case study references, Statistics and data, Third-party validation, Guarantees and risk reversals, Customer logos, Review scores". Gaps: "'Trusted by thousands' (which thousands?)", "'Industry-leading' (according to whom?)", "'Customers love us' (show them saying it)". The fix is "adding proof or softening claims"; a claim with neither leaves the page ([SKILL.md](SKILL.md#3-tests-every-headline-and-claim-must-pass) proof test).
5. **Specificity.** Check "Vague language ('improve,' 'enhance,' 'optimize')", "Round numbers that feel made up" and "Missing details that would make it real". "Remove content that can't be made specific (it's probably filler)." The source's upgrades, each true only if the facts say so: "Save time" to "Save 4 hours every week"; "Many customers" to "2,847 teams"; "Fast results" to "Results in 14 days"; "Great support" to "Response within 2 hours".
6. **Heightened emotion.** "Does the copy make the reader feel something?" Check "Pain points mentioned but not felt" and "Aspirations stated but not evoked", and "Ensure emotion serves the message (not manipulation)". Two views on technique: the source suggests "Paint the 'before' state vividly", "Reference shared experiences" and "Ask questions that prompt reflection"; this repo bans "Imagine..." openers, empathy openers ("We've all been there") and self-answered questions ([SKILL.md](SKILL.md#5-copy-slop-specific-to-pages), [TELLS](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/TELLS.md)). Keep the repo rule: make the pain felt by naming the real moment it bites and what it costs ([PAGES.md](PAGES.md#writing-each-part)).
7. **Zero risk.** "Have we removed every barrier to action?" Check "Friction near CTAs, Unanswered objections, Missing trust signals, Unclear next steps, Hidden costs or surprises". Reducers: "Money-back guarantees, Free trials, 'No credit card required', 'Cancel anytime', Social proof near CTA, Clear expectations of what happens next, Privacy assurances", each only if true, and a guarantee's conditions sit beside it ([offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md#guarantees)). Issues: "CTA asks for commitment without earning trust", "Fine print that creates doubt", "Vague 'Contact us' instead of clear next step".

## Quick-pass checks

[coreyhaines31/marketingskills, copy-editing] For a review that doesn't need all seven sweeps.
- **Cut:** "Very, really, extremely, incredibly", "Just, actually, basically", "In order to (use 'to')", "That (often unnecessary)", "Things, stuff (vague)". "Stuff" stays when it is the writer's voice (Mode B): the source's own reading-taste rule keeps it.
- **Replace:** Utilize to Use, Implement to Set up, Leverage to Use, Facilitate to Help. "Replace with the fact (a synonym swap just makes a new tell)": innovative or cutting-edge to "What it does that alternatives don't"; robust to "The uptime, scale, or failure case it handles"; seamless to "The real setup step count or time".
- **Sentences:** "One idea per sentence", "Front-load important information", "Max 3 conjunctions per sentence", "No more than 25 words (usually)". Two numbers, two jobs: the source's 25 words is a length cap; [CHECK](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/CHECK.md)'s 20 words is the point at which to reread a sentence for a pile-on. Neither comes from an official source.
- **Paragraphs:** "One topic per paragraph", "Short paragraphs (2-4 sentences for web)", "Strong opening sentences".
- **Passive:** the source says "Passive voice (switch to active)"; the repo keeps passive "when the actor is unknown or irrelevant" ([TELLS](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/TELLS.md)).
- **Leave alone:** "FAQ questions, a single 'No card required' by the CTA, a list of three when there really are three features, and a clause after a comma that adds a new fact ('Imports run nightly, keeping your existing IDs')".

## Expert panel (optional gate)

[coreyhaines31/marketingskills, copy-editing] After the sweeps, for high-stakes copy: "Assemble 3-5 expert personas relevant to the copy type"; each "scores the copy 1-10 on their area of expertise" with specific critiques; "address the lowest-scoring areas first"; "iterate until all personas score 7+, with an average of 8+ across the panel".

| Copy | Panel |
|---|---|
| Landing page | Conversion copywriter (clarity, CTA strength, benefit hierarchy); UX writer (scannability, cognitive load, user flow); target customer persona ("does this speak to me? do I trust it?"); brand strategist (voice consistency, positioning accuracy) |
| Email sequence | Email marketing specialist; copywriter (hooks, storytelling, persuasion); a deliverability reviewer; target customer persona (relevance, value, unsubscribe risk) |
| Sales page, long form | Direct response copywriter (offer structure, objection handling, urgency); skeptical buyer persona (proof gaps, trust issues, red flags); editor (flow, readability, conciseness); SEO specialist (search intent alignment) |

The source's email panel has a "Spam filter analyst (deliverability red flags, trigger words)"; no official doc checked confirms spam trigger-word lists, so the deliverability reviewer works from [email-practices](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/SKILL.md) (authentication, complaint rates) instead.

| Score | Meaning |
|---|---|
| 9-10 | "Publish-ready. No meaningful improvements." |
| 7-8 | "Strong. Minor tweaks only." |
| 5-6 | "Functional but has clear gaps. Needs another pass." |
| 3-4 | "Significant issues. Major revision needed." |
| 1-2 | "Fundamentally broken. Rethink approach." |

When: "Always" for launch copy, pricing pages and high-traffic landing pages; "Recommended" for email sequences, sales pages and ad copy; "Optional" for blog posts, social content and internal docs; "Skip" for quick updates, minor edits and low-stakes content. The panel score is a quality gate, not a finding severity: findings keep the repo's one scale, P0 to P3 as in code-review's [code-review REVIEWER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/REVIEWER.md#tags-and-output).

### An alternative five-lens panel

[Yuzzyuk/marketing-os, references/copy.md] offers a different optional rubric: skeptic (believability/proof), stranger (cold comprehension), competitor (swap test), buyer (actual concern) and editor (word load). Each receives 0 to 20 points, total 100. It rewrites candidates at 70 to 84, discards those under 70 and stops at 90+ or after three passes. These are practitioner quality gates, not calibrated outcome predictions or P0 to P3 severity. Keep the existing 1-to-10 panel above as its own source method; do not blend their scores. Point-edit mode and the real author's voice still govern, and no lens impersonates a real person or invents an endorsement.

## Working with the author

[coreyhaines31/marketingskills, copy-editing] "Run a sweep and present findings", "Recommend specific edits", "Request the updated copy. Let the author make final decisions", "Verify previous sweeps" after each round, and "Repeat until clean": "Continue until a full sweep finds no new issues."

Final checks: "No typos or grammatical errors", "Consistent formatting", "Links work (if applicable)", "Core message preserved through all edits".

## Report

Findings use the format in [SKILL.md](SKILL.md#6-output): `section: "quoted line" -> problem -> fix`, most damaging first (invented proof, then unclear value, then generic lines, then style), with the sweep each finding came from.

## Prove it

- The mode (A, B or C) is named before any edit; a point edit returned only changed lines, each with a reason.
- Each sweep ran on its own dimension, and the earlier sweeps were rechecked after it.
- Every proof gap ends as real proof, a softened claim or a cut line, never a new invented number.
- No emotion technique the repo bans (imagine openers, empathy openers, self-answered questions) was added.
- Every link in the copy opens.
