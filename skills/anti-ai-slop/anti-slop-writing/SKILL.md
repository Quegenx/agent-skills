---
name: anti-slop-writing
description: "Edits prose to read like a sharp human wrote it, in the writer's own voice, or audits a text for AI-writing patterns. Any language, including Hebrew. Use when editing, rewriting or auditing prose."
---

# Anti-slop writing

A sharp human editor, not a humanizer. The job is to make the writing clearer and more alive while it still sounds like the same person. Load `anti-slop` for the shared rules; this skill holds the prose depth. The pattern catalogue is [TELLS.md](TELLS.md); plain swaps for pompous words are [PLAIN-WORDS.md](PLAIN-WORDS.md); Hebrew is [HEBREW.md](HEBREW.md); the final check is [CHECK.md](CHECK.md). Edit modes, the second-generation tells, the social and email tells and the plain-words list come from coreyhaines31/marketingskills (`copy-editing`, `copywriting`, `social`, `emails`; MIT), which credits Profound's and Wispr Flow's skills (MIT) for the modes and the second-generation tells; the reply format is open-seo's `seo-coach` (MIT); Hebrew additions are skills-il's `hebrew-content-writer` (MIT).

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Name a pattern, quote it, fix it: structure, openers and closers, vocabulary, honesty, formatting, second-generation tells, social posts and email, what is not a tell | [TELLS.md](TELLS.md) |
| Swap a pompous word or phrase for the plain one (prose and marketing copy, not interface verbs) | [PLAIN-WORDS.md](PLAIN-WORDS.md) |
| Hebrew: its tells, register, bureaucratic forms, gender, punctuation, English inside Hebrew, Hebrew SEO | [HEBREW.md](HEBREW.md) |
| The final pass before returning any edit or draft | [CHECK.md](CHECK.md) |
| Write or maintain developer documentation, snippets, demos, navigation, redirects and generated output | [developer-docs](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/developer-docs/SKILL.md) |

## Two jobs

**Edit (the default).** The user gives a draft to improve. Make the minimum effective edit and return the full edited text plus a short **What changed**. First decide what you were handed, because "the mode sets how much you're allowed to change" [coreyhaines31/marketingskills, copy-editing]: blank or slop may be rebuilt "from the underlying facts; never invent stats, customers, or results"; a real voice keeps "their argument, vocabulary, and emphasis". The mode table is [anti-slop-copy REVIEW.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/REVIEW.md#pick-the-edit-mode).

**Point edit.** The user names one line, word or section ("Fix this headline," "is this sentence OK?"): change only that and return only the changed text with a one-line reason per change [coreyhaines31/marketingskills, copy-editing]. This is the one exception to returning the full text; the rules are in [anti-slop-copy REVIEW.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/REVIEW.md#pick-the-edit-mode).

**Detect.** The user asks whether a text reads as AI, or asks to audit or flag it without rewriting. Name each pattern from [TELLS.md](TELLS.md) that appears, quote the line, give the fix in a few words. Don't rewrite, don't score, and never claim a text was or wasn't written by AI: detectors guess, named patterns are evidence the user can check. Offer to edit afterwards.

**Write from scratch.** Same rules, applied while drafting: know the reader and the point first, then write from the facts you have, then run [CHECK.md](CHECK.md). Before a full rewrite with no draft to restore, build the writer first: the five silent questions and the traits they produce are [anti-slop-copy DRAFTING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/DRAFTING.md#build-a-writer-situation-a) [coreyhaines31/marketingskills, copywriting]. They never license facts: "Never invent experience".

## Before touching the text

- For editing or detection, ask for the draft if it is missing; for an explicit write-from-scratch request, use that branch above. If the audience or the outlet is unclear and it matters, ask one question: who reads this, and where?
- Find the core point. If you can't state it in one sentence, ask.
- List the voice traits to keep: vocabulary, sentence length, bluntness, humor, uncertainty, digressions, swearing, level of polish, recurring phrases. If the user gives a sample of their writing, match it; it outranks this skill's style preferences. From a sample, "match its average sentence length, punctuation habits, paragraph openings, and a few words they use that you wouldn't" [coreyhaines31/marketingskills, copywriting].
- Read taste as well as words: vocabulary, where the writer spent words and what they left out are choices to match ([anti-slop-copy DRAFTING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/DRAFTING.md#read-taste-out-of-the-input-b-and-c)). If a personal voice guide exists for this writer, read it before any brand profile ([anti-slop-copy VOICE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/VOICE.md#personal-voice)).
- "Read through once without editing" [coreyhaines31/marketingskills, copy-editing].
- Note the language and register. For Hebrew, read [HEBREW.md](HEBREW.md) first.

## Editing principles

- **Minimum effective edit.** Fix the patterns, errors and tangles. Leave strong human sentences alone. A rough draft with a real voice should still sound like its writer. The leave-it-alone test: "For each change, ask whether it's measurably better or just different. Revert anything you can't give a reason for" [coreyhaines31/marketingskills, copy-editing] ([anti-slop-copy DRAFTING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/DRAFTING.md#the-leave-it-alone-test)).
- **Keep the meaning.** Add no claim, example, number, quote or opinion. If a sentence needs a fact to work, ask for it or mark `[NEED: ...]`.
- **Lead with the point when the setup adds nothing.** Keep a personal aside or story when it gives context, tension or character.
- **Concrete over abstract.** Names, numbers, dates, mechanisms, examples. "The integration improved efficiency" becomes "Deploys went from 40 minutes to 4", but only if the 40 and the 4 are real.
- **Portability test.** A sentence that could move unchanged to another company, person or topic is filler. Cut it, or replace it with something true of this subject.
- **Show, don't label.** Cut lines that tell the reader something is important, surprising or key. If the facts show it, the label is noise.
- **Direct verbs, human subjects.** "Decided", not "made a decision". "We rewrote the page", not "the page was updated". No abstraction doing a human verb ("the data wants", "the platform understands").
- **Repeat the right word.** Don't rotate synonyms for the same thing.
- **Untangle without flattening.** Split sentences that are genuinely hard to follow; keep the long spoken ones and the fragments that carry the writer's rhythm.
- **Keep the edge.** Strong opinions, bluntness, humor, admissions, mixed feelings. Don't sand them into professional neutrality.
- **Keep the structure unless it hurts.** If you reorder, say why in What changed.
- **Don't trade one tic for another.** If every contrast reveal becomes ", because..." and every negation list becomes "There's nothing to X", those are the new tells. Fix each from its own facts.

## What not to flag

These are not evidence on their own (details in [TELLS.md](TELLS.md#what-is-not-a-tell)): polished grammar, formal vocabulary, one transition word, one em dash, one short emphatic sentence, curly quotes, an unsourced claim, dry writing. Phrases inside quotes, titles, names, or a sentence that discusses the phrase are not being used and stay untouched.

## Signs of a human, to protect

Odd, hard-to-invent specifics. Mixed feelings left unresolved. Era-bound references and slang. Uneven sentence lengths. Real asides and self-corrections. When you see these, edit less.

## Replies in a terminal or chat

For a reply using the SEO-coaching format, these are the source's terminal/chat conventions, not requirements for every writing task or chat reply [open-seo, seo-coach]:
- "Lead with the answer or the one next step. Context comes after, not before."
- "A paragraph is at most two sentences." "One idea per bullet, one line where possible. No nested bullets."
- "Bold a short label at the start of a bullet when the list has more than three items."
- "Numbers get a plain-language gloss the first time, in the same bullet: '2,400/mo (people searching it each month)'."
- "End with a single question or a numbered list of 2-4 choices. Never both."
- "Don't restate what the user already knows or what a tool call just showed them."
- "Keep replies under a screen. If it needs more, that is a skill report, not a coach answer." The report rules are [seo SEO-REPORTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/SEO-REPORTS.md).

## Output

- **Edit:** the full edited text, then **What changed**: a few lines naming the patterns fixed and anything restructured or flagged `[NEED: ...]`.
- **Point edit:** only the changed lines, each with a one-line reason, one alternative where the choice is close, and any serious problem elsewhere in one line at the end.
- **Detect:** a list of findings, each `pattern: "quoted line" -> fix`, grouped by pattern, most damaging first. End with whether the text reads as slop overall (a cluster) or has isolated devices only.
- Run [CHECK.md](CHECK.md) before returning either.
