# The tells

Most of these are old rhetoric. AI text gives itself away by using them by default, stacked, and with nothing specific behind them. **Ban** means a tell even once. **Cap** means fine once, chosen on purpose; a tell when repeated or stacked (two capped patterns in one paragraph means rewrite the paragraph). Word lists drift as models change; the structural patterns don't, so trust them more. Entries tagged [Vercel, writing-guidelines] and [Vercel, web-design-guidelines] come from Vercel's [Writing Guidelines](https://github.com/vercel-labs/writing-guidelines) and [Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines) (both MIT), written for developer docs and interfaces; the rest of the docs rules are in [developer-docs](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/developer-docs/WRITING-AND-PUBLISHING.md). Entries tagged [coreyhaines31/marketingskills, ...] come from its `copywriting`, `copy-editing`, `social` and `emails` skills (MIT); the second-generation tells there are credited to Profound's and Wispr Flow's skills (MIT).

What the scopes mean [coreyhaines31/marketingskills, copywriting, ai-tells.md]: "**Short copy**: headlines, subheads, the hero, CTAs, ads, social posts, email subject lines." "**Long copy**: body sections of a page, articles, long emails." "**Section**: one hero, one page section, or one whole short post." "CTA microcopy ('No card required') doesn't count toward the fragment cap."

## 1. Structure (the worst offenders)

**Contrast reveal (Ban).** Sets up a belief nobody stated, denies it, gives the "real" answer. "It's not X, it's Y." "Not because X. Because Y." "The question isn't X, it's Y." "Less X, more Y." "Not just X, but Y."
- ✗ The problem isn't the model. It's the eval.
- ✓ The eval matters more than the model here: it decides which outputs ship.
State Y with its reason. If the reader really holds a wrong belief, state the right fact and the evidence; don't stage the denial.

**Negation list (Ban).** Defining a thing by what it lacks, usually in threes. "No setup. No contract. No waiting." "Not a X. Not a Y. A Z."
Say what does happen, in order. A real absence that matters ("No card required") goes once, plainly.

**Trailing pile-on (Ban).** A complete claim, then a comma and more: a negation list, an "-ing" clause, extra benefits. "It syncs your calendar, ensuring nothing slips through the cracks."
End at the claim. A clause that adds a new fact can stay; restatements go.

**Self-answered question (Ban).** "The result? 3x faster." "The catch? There isn't one." "Why does this matter? Because..."
Delete the question, keep the answer. A real FAQ question, or a question in the reader's own voice ("Need to share a screenshot?") followed by what to do, is fine. In docs, Vercel bans rhetorical questions outright: "No rhetorical questions (sounds like marketing)" [Vercel, writing-guidelines].

**Colon reveal (Ban).** "The best part: it learns." "One word: speed." "Here's the secret: consistency."
Write a plain sentence. Colons are for lists, labels and quotes.

**Superficial "-ing" analysis (Ban).** A trailing clause pretending to interpret: "...highlighting the team's commitment", "...underscoring its importance", "...reflecting a broader shift".
Replace with the concrete consequence, or cut.

**Fragment drumbeat (Cap: one per section).** "Simple. Fast. Done." "That's it. That's the whole thing." "No prior. No nostalgia."
Merge into one sentence that carries a fact. The same habit in plain prose, stop-start sentences: "don't split one dependent idea into choppy fragments (`Previously this was manual. Now it's automatic. This saves time.` → one sentence); short sentences for emphasis are fine" [Vercel, writing-guidelines].

**Reflexive threes (Cap: one per section).** Every list, adjective run and clause group in threes. "Fast, secure, and scalable."
Use as many items as the facts support. Often the fix is the one strongest specific claim.

**Uniform rhythm (Cap).** Every sentence 12 to 18 words; every paragraph topic, elaboration, wrap-up; every section the same length.
Vary on purpose. Let a section be two lines if that's all it needs.

**Dodging "is" and "has" (Cap).** "Serves as", "stands as", "boasts", "represents", "functions as".
Use is/has, or the real verb: "Tracks every contract and renewal date in one place."

**Metaphor verbs (Cap).** "Filler/metaphor verbs: name the action instead of reaching for cadence (`moves through`, `lands`, `carries`, `hits` → the literal step)" [Vercel, writing-guidelines].

**Spec-sheet voice (Cap).** "Rewrite sentences that read like a system reading a datasheet (`provides`, `is configurable`, `is explicitly labeled`)" [Vercel, writing-guidelines]. Say what the reader does or what happens.

**Cold-open paragraphs (Cap).** "A body paragraph whose first sentence works as a standalone heading has no antecedent; carry the prior subject forward (`Because…`, `Once…`)" [Vercel, writing-guidelines].

**Abstract or inanimate subjects (Cap).** "The platform empowers teams to..." "The data tells us..." "The design decides..."
Make a person or the customer the subject. Ordinary product verbs ("the form submits", "the report shows") are fine; verbs that need a mind (understands, wants, believes, decides) are the tell. Vercel extends it to human-physical verbs: "machines don't perform human-physical actions (`hand the browser a URL` → `the browser fetches the URL`; `the token holds…` → `the token is stored…`)" [Vercel, writing-guidelines]. Its second fix is an actorless passive, which the next entry caps; use it only when the actor is irrelevant.

**Actorless passive (Cap).** "The decision was made", "The page has been updated", "Mistakes were made", when the actor is known.
Name the actor. Passive is right when the actor is unknown or irrelevant ("the server restarted at 03:00"). The test: "append 'by monkeys'. If the sentence parses, rewrite" ("The CLI will be installed by monkeys" parses; "Install the CLI" doesn't) [Vercel, writing-guidelines].

**Synonym cycling (Cap).** The same thing called a dashboard, a hub, a portal and an interface in one page.
Pick the word the reader uses and repeat it.

**False range (Cap).** "From startups to enterprises." "From first click to final invoice, and everything in between."
Name the segment or the steps you actually cover.

**Aphorism formula (Ban).** "X is the language of Y." "X is the new Y." "X isn't a tool, it's a mirror."
Say the plain point.

## 2. Openers, transitions and closers (Ban)

| Pattern | Examples | Instead |
|---|---|---|
| Era opener | "In today's fast-paced world", "In the age of AI", "In an ever-evolving landscape" | Start with the subject or the reader's problem |
| False-choice opener | "Whether you're a founder or a Fortune 500..." | Say who it's for |
| Throat-clearing | "Here's the thing", "Let me be clear", "The truth is", "Honestly?", "Real talk" | Cut; say the point |
| Chummy opener (Ban in email and social) | "Great question!" "Let's be honest..." "We get it." [coreyhaines31/marketingskills, copywriting] | Open with the reason you're writing |
| Over-explaining (Cap) | "Let's break this down," "Think of it as..." [coreyhaines31/marketingskills, copywriting] | "Give the explanation directly" |
| Faux insight | "What most people get wrong", "Here's what nobody tells you", "The part everyone misses" | Make the claim stand alone |
| Announcing | "In this article we'll explore", "Let's dive in", "Without further ado" | Start with the content |
| "Imagine..." / "Picture this" | "Imagine never chasing an invoice again" | Show the real before and after |
| Filler transition | "It's worth noting", "It's important to note", "Moreover", "Additionally", "That being said", "At its core", "This begs the question..." [coreyhaines31/marketingskills, copywriting] | Delete; the sentence works without it |
| Interpretive aside | "This matters more than it sounds", "The key point is", "As you can see", "In other words" (redundant); self-narration ([§6](#6-second-generation-tells)) | Delete, or replace with the support |
| Summary-style transition | "With this setup complete…", "Now that we've explored…" opening a paragraph by recapping the last one [Vercel, writing-guidelines] | "Pivot straight to the next point (`In practice…`, `The catch is…`)" |
| Recap ending | "In conclusion", "Ultimately", "Overall", a final paragraph restating the piece | End on the last concrete point or next action |
| Fake-profound kicker | "Because growth shouldn't wait." "And that changes everything."; tidy closers ([§6](#6-second-generation-tells)) | Delete it; don't rewrite it into a better metaphor |
| Generic upbeat ending | "The future looks bright", "Exciting times ahead" | Cut, or state the real plan |
| Chatbot residue | "I hope this helps!", "Let me know if you have questions", "Great question!" | Cut |

The other view: copywriting's `natural-transitions.md` offers previews ("Here's what we'll cover..."), closers ("Wrapping up,...") and "Here's the key takeaway:..." as transitions for long guides [coreyhaines31/marketingskills, copywriting]. They stay banned here as announcing, recap endings and colon reveals; the source's own `ai-tells.md` bans "The takeaway is simple." as self-narration.

## 3. Vocabulary

Swapping a word for a synonym makes a new tell. Replace it with the fact it stood in for: "robust" -> "99.98% uptime over two years" (if true); "seamless" -> "imports your Stripe data in about 90 seconds" (if true).

**Ban:** delve, tapestry, testament to, realm, embark, beacon, multifaceted, paradigm shift, synergy, myriad, plethora, meticulous, intricate, utilize, leverage (as a verb), supercharge, turbocharge, game-changer, "this changes everything", "ever-evolving landscape", "plays a crucial role", "stands as a", "marks a pivotal moment". In press pitches the PR source also bans "disruptive", "game-changing", "next-generation" and "at-the-end-of-the-day" [coreyhaines31/marketingskills, public-relations]; pitch craft is in [public-relations](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/public-relations/SKILL.md).

**Cap (two in one paragraph means rewrite):** seamless, robust, streamline, empower, elevate, unlock, unleash, harness, foster, enhance, optimize, cutting-edge, innovative, revolutionary, transformative, holistic, comprehensive, pivotal, crucial, vital, powerful, next-level, world-class, best-in-class, landscape, navigate, ecosystem, journey, showcase, align with. The drift behind the last two: "'delve' peaked in 2024; 'enhance,' 'showcase,' 'foster,' and 'align with' rose after" [coreyhaines31/marketingskills, copywriting, ai-tells.md].

**Empty intensifiers (cut unless they carry real emphasis or the writer's rhythm):** just, really, truly, genuinely, incredibly, deeply, fundamentally, significantly, simply, actually, literally, quietly, importantly, crucially.

**Pressure words in instructions (Ban in docs):** `easy`, `simple`, `quick` describing what the reader does: "puts pressure on the reader and reads as marketing; replace with concrete description ('one command', 'default settings', 'most projects don't need this')" [Vercel, writing-guidelines].

**Padding phrases:** in order to (to), due to the fact that (because), at this point in time (now), with regard to, in terms of, when it comes to, going forward, at the end of the day. The full A to Z of pompous words and their plain swaps, and the phrases to delete outright, is [PLAIN-WORDS.md](PLAIN-WORDS.md).

**Vague words:** copy-editing's cut and replace lists ("that", "things, stuff", "implement", "facilitate") are in [anti-slop-copy REVIEW.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/REVIEW.md#quick-pass-checks); "stuff" stays when it is the writer's word.

## 4. Honesty

**Invented specifics (Ban, the worst one).** Plausible numbers, customers, quotes, names, dates, features or studies with no source. Worse than vagueness because it reads as true. Write `[NEED: ...]` or say what is actually known. Copy-editing's specificity pass also looks for "Round numbers that feel made up" [coreyhaines31/marketingskills, copy-editing].

**Invented labels (Cap).** "'the integration tax,' 'the growth trap.' Only coin a term you'll define and use across the site" [coreyhaines31/marketingskills, copywriting].

**Weasel sources (Ban).** "Experts agree", "studies show", "many argue", "industry reports suggest", "widely regarded as". Name the source or cut the claim. Never invent a source to fix it.

**Weasel qualifiers and vague quantifiers (Cap).** "Replace vague qualifiers (`significantly`, `many`, `often`, `typically`, `generally`) with a specific number or claim"; "no `near-zero`, `sub-second`, `most requests`; give the figure and cite it (`99.37% of requests see zero cold starts`)" [Vercel, writing-guidelines]. No figure in the source: `[NEED: ...]`, never an invented one.

**Importance puffery (Ban).** "A testament to", "redefines the category", "a new era of", "solidifies its position". State the fact; let the reader judge.

**Speculative gap-filling (Ban).** "While details are limited, the founder likely..." Either the source says it or the sentence goes.

**Hedge stacks (Cap).** "Could potentially possibly help". One honest qualifier, where the uncertainty is real.

**Fake candor (Ban).** "I'll be honest, I was skeptical too" with no real story behind it.

## 5. Formatting

- **Em and en dashes:** none anywhere in this repository; use " - ", commas or "to" [Owner writing rule]. The source view bans em dashes in short copy (headlines, posts, subject lines, captions, cold emails, where "Em dashes" are on the list of AI tells prospects "spot in the first line and delete" [coreyhaines31/marketingskills, cold-email]); in a post, "Use a period or a line break" [coreyhaines31/marketingskills, social]. The old line allowed "In long text, at most one or two where they clearly beat a comma, period, colon or parentheses". That remains the old rule's disagreement, not permission under the owner rule [Old line, anti-slop-writing/TELLS.md:120]. Clusters are a tell. Replace with a period, comma, colon or parentheses, or restructure. Also catch ` -- ` doing the same job. The stricter view, for developer docs: none at all, and no hyphen as punctuation either [Vercel, writing-guidelines] ([developer-docs](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/developer-docs/WRITING-AND-PUBLISHING.md#units-emphasis-and-punctuation)).
- **Bold** only for terms the reader must find again. Not sprinkled mid-sentence.
- **Inline-header bullets** ("**Performance:** loads faster") restating the item: make it prose or a plain list. A bold term with a real description (`- **Term**: description`) is Vercel's docs format and not this tell.
- **Bullets where two sentences would read better**, and headers over two-sentence sections: write prose. The other view, for docs: "Three or more list-shaped items in a paragraph: convert to a list" [Vercel, writing-guidelines].
- **Emoji** leading headings or bullets: remove (keep in casual social posts only when it's the writer's voice). The stricter view: "Emoji as bullets: 🚀 ✅ 💡 leading every line" is a social-post tell [coreyhaines31/marketingskills, social], and "Emoji as structure" is a Ban in B2B [coreyhaines31/marketingskills, copywriting]; the writer's-voice exception stays here.
- **Title Case Everywhere:** sentence case unless a style guide says otherwise. Vercel's two views (Title Case headings and buttons in its interface guidelines, sentence case headings in its writing guidelines) are in [developer-docs](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/developer-docs/WRITING-AND-PUBLISHING.md#headings-and-structure); sentence case stays the default here.
- **ALL CAPS** for emphasis inside paragraphs: write the emphasis into the sentence.
- **Scare quotes and quote clusters** around ordinary words: remove.
- **Exclamation marks** in body text, "?!" and Unicode decoration (arrows, bold Unicode letters): remove.
- **Parallel bullet openers** (every bullet starting "Ensures / Provides / Enables"): vary, lead with the outcome.

## 6. Second-generation tells

[coreyhaines31/marketingskills, copywriting, ai-tells.md] "These show up in copy that has already been de-slopped. The banned words and contrast reveals are gone, but the draft still reads as generated because the model swapped one set of habits for another. Check for them after the patterns above are fixed."

| Tell | Example (✗) | Fix |
|---|---|---|
| **Wisdom-shaped sentences** (Ban) | "Great tools get out of the way." "Speed is a feature." | "A sentence with the shape of an insight that nobody would disagree with. Replace it with the specific fact it gestures at, or cut it" |
| **Performed cleverness** (Cap) | "Your inbox, minus the noise." "Spreadsheets with a pulse." | "Unexpected word pairings built to sound witty. Keep one if the brand is playful and it says something true; otherwise say the plain thing" |
| **Staccato bursts** (Cap) | "It's fast. It's simple. And it just works." | The fragment drumbeat in §1: merge into a sentence that carries a fact |
| **Perfect balance** (Cap) | "Every section has a heading, two sentences, and three bullets; every benefit gets the same weight" | Uniform rhythm in §1: "Let the strongest section run long and the weakest shrink or go" |
| **Omniscient casual** (Cap) | "A relaxed, chatty voice that knows every answer and never admits a limit" | "Casual tone plus total certainty reads as generated. Scope claims honestly and say who the product isn't for" |
| **Self-narration** (Ban) | "Here's why this matters." "This is where it gets interesting." | "Sentences that comment on the copy itself. Delete them; if the point needs help, add a detail" |
| **Tidy closers** (Ban) | "Because your team deserves better." "The future of billing starts now." | "A balanced, quotable last line that could close any page. End on a number, a named customer, the offer, or the CTA" |
| **Reflexive specificity** (Cap) | "Every claim has a suspiciously round stat or a too-neat customer anecdote" | "Every number and story must be real and sourced; mark gaps `[NEED: proof]` instead of filling them" |

## 7. Social posts and email

Everything above applies; these are the tells specific to the format. Full post and email craft lives in [social-media POSTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/social-media/POSTS.md), [email-marketing SEQUENCES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/email-marketing/SEQUENCES.md#writing-each-email) and [cold-outreach COPY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cold-outreach/COPY.md).

**Social posts** [coreyhaines31/marketingskills, social]:
- **Broetry (Ban):** "one short sentence per line, every line, for the whole post. Write paragraphs and break lines where a person would pause."
- **Engagement bait (Ban):** "Agree?" "Thoughts?" "Let that sink in." "Read that again." "End on the point, or a real question you want answered."
- **Manufactured vulnerability (Ban):** "I'll be honest, I was terrified..." with no real story behind it (Fake candor, §4).
- **Caps per post:** "Keep fragments and lists of three to one per post."
- **Stock phrases (Ban):** "Say goodbye to," "X, reimagined," "Unlock the power of," "Take it to the next level" [coreyhaines31/marketingskills, social] (emails has the same list).

**Email** [coreyhaines31/marketingskills, emails]:
- **Subject-line bait (Ban):** "fake 'Re:' or 'Fwd:', 'You won't believe...', '🔥 Big news.' The subject should hold up if it's the only line they read."
- **Stock openers (Ban):** "I hope this email finds you well," "Just checking in," "Great news!" "Open with the reason you're writing."
- **Sign-off filler (Ban):** "Feel free to reach out if you have any questions." "Ask for one specific action, or end."
- Em and en dashes: the [owner punctuation rule](#5-formatting) applies to every email length. The old line retained the source's "and at most one or two in a long email"; that remains a source disagreement, not the active rule [coreyhaines31/marketingskills, emails].

## What is not a tell

- Correct grammar and consistent style. Many writers are good or edited.
- Formal vocabulary in general. Only the specific overused words above.
- A single transition word, a single em dash, a single short sentence, a single list of three when there really are three things.
- Mixed casual and formal registers. Often a sign of a real person. Copy-editing's voice sweep still flags an unintended shift in brand copy ("Starting casual, becoming corporate", "Mixing 'we' and 'the company' references") [coreyhaines31/marketingskills, copy-editing]; that is a consistency fix, not evidence of AI.
- Dry, plain prose without the tells. Dull isn't AI.
- Curly quotes. Editors and operating systems add them.
- Unsourced claims in general. Most writing has none.
- Words inside quotations, titles, names, code, or examples that discuss the phrase.

**Clusters, not single hits.** One em dash means nothing. An em dash plus a contrast reveal plus "vibrant tapestry" plus a recap ending is a confession.

## Sources

The sources copywriting's `ai-tells.md` lists for its patterns, cited by [coreyhaines31/marketingskills, copywriting], not read for this file: Wikipedia, [Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing); Kobak et al. ([arXiv 2406.07016](https://arxiv.org/abs/2406.07016)); Juzek and Ward, [Why Does ChatGPT "Delve" So Much?](https://aclanthology.org/2025.coling-main.426/) (COLING 2025); Paech et al., Antislop ([arXiv 2510.15061](https://arxiv.org/abs/2510.15061)) and [EQ-Bench Slop Score](https://eqbench.com/slop-score.html); [tropes.fyi](https://tropes.fyi/tropes-md); Charlie Guo, [The Field Guide to AI Slop](https://www.ignorance.ai/p/the-field-guide-to-ai-slop); Blake Stockton, [Don't write like AI: negation](https://www.blakestockton.com/p/dont-write-like-ai-1-101-negation); and the counter-view, [A case for the defense](https://robotsatemyhomework.substack.com/p/ai-writing-patterns) ("devices are fine when chosen, not defaulted").
