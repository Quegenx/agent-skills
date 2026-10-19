# Copy

The words on screen: how many, how to write them, how to make a short film feel written rather than labelled, and the audit that catches proofing bugs. A supplied brand voice wins over every default here.

## Budget

[video-brief, existing COPY.md; frame-review, smoke.mjs reading contract]

Count every word of the film's own voice: statements, captions, the end-card line. Strings the product itself shows (a typed command, a URL, an app label) are not the film talking; they are counted apart, but they still have to be real and held long enough when the story needs them read.

| Format | Words in the film | Per line | Per shot |
|---|---|---|---|
| Launch film, 30 s | aim 15-25, cap 35 | ≤ 5 (about 24 characters) | ≤ 2 lines, one idea |
| Feature video | ≤ 15 | ≤ 5 | 1 line |
| Feature loop | ≤ 8, readable muted | ≤ 4 | 1 line |
| Logo sting | the name + ≤ 4 | ≤ 4 | 1 line |
| Walkthrough | ≤ 6 per caption | ≤ 6 | 1 caption |

**Check that it fits before the shot list.** Add up each line's [canonical reading floor](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/frame-review/SKILL.md#the-loop), plus the [additional comprehension target](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/KINETIC-TYPE.md#reading-time-is-arithmetic) for any line that must land on its own, and compare the sum with the film's length minus its pure-picture shots. Over budget: cut words or lengthen the film, with the user, now; finding it after the build means re-timing everything.

A viewer reads about 3 words a second while also watching motion; every word steals attention from the picture that should carry the idea. One line on screen at a time.

## Writing a line

[video-brief, COPY.md house defaults; SPEC-PATTERNS.md and shotlist/FORMATS.md source alternatives] The rules below govern short promo lines. Explainer question hooks and instructional title/caption treatments are source-specific alternatives in [EXPLAINERS.md](EXPLAINERS.md), not a replacement for these defaults.

- The viewer's words at the moment of pain, not the marketer's: what would they say out loud? ("Looks good to me." "Not again.")
- Nouns, verbs and numbers. A number beats an adjective every time.
- Present tense, active voice, the viewer's world as the subject: "Meetings move over." rather than "X moves your meetings."
- Sentence case, a full stop on a statement (the full stop can become a design element). No exclamation marks, questions, emoji or suspense ellipses.

**The line test.** Every line passes all six: (1) it is true on its own paused frame; (2) a competitor could not say it; (3) at most 5 words; (4) no praise adjective; (5) read aloud, it sounds like a person; (6) still true in a year (no "new", "now with", "introducing").

Write 15-20 candidates per slot quickly from the concept inventory (verbs, the number, the pain scene), cut with the line test, then read the survivors in order, aloud, on the beat, and keep the set whose words echo one another.

## Callback copy

Plant a phrase early and pay it off later, changed by what the film has shown.

| Mechanism | Setup → payoff |
|---|---|
| Same words, new truth | "Looks good to me." (a tired lie early) → "Looks good to me." (true at the end) |
| One word flips | "Your week doesn't fit." → "Everything fits." |
| The digit | "3:12 a.m." → "3:13 a.m." |
| The user's words | text typed into the product returns as the statement |
| Grammar rhyme | "18%. Water now." / "42%. Leave it." |
| Tautology as proof | "Spending money stays spending money." |

The payoff reuses at least one content word from the setup, lands on the payoff beat (the loudest sound), and the setup holds long enough to be remembered. Never explain the callback on screen. One main chain per film, plus at most one echo.

## Stock phrasing to cut

**Never:** eyebrow or kicker labels over a headline ("NEW FEATURE", "01 / SPEED"); a tagline stacked over or under a headline; "Introducing..."; text walls (more than one statement readable at once, paragraphs, bullets); filler text (decorative mono captions, fake metrics, version strings, coordinates nobody reads, labels that name the obvious, lorem ipsum).

**Cut on sight unless the brand's own voice uses it:**
- openers: Meet, Say hello to, Say goodbye to, Ready to...?, What if...?, Imagine..., One more thing;
- claims: the future of, reimagined, redefined, next-gen, revolutionary, game-changing, like never before;
- verbs: unlock, supercharge, streamline, elevate, empower, level up, transform your, harness;
- adjectives: seamless, effortless, powerful, smart, intelligent, AI-powered, all-in-one, at scale;
- nouns: workflow, productivity, solution, experience, journey;
- structures: a feature name as a headline; three-item lists ("Plan. Track. Win.").

## Several languages, one film

Keep every on-screen string in one copy table keyed by language (`COPY.en`, `COPY.ja`), never in the shots, and pick the language with a parameter (`?lang=ja`, the same way `?style=` picks a look), so every language shares one timeline. Per language, re-check what changes: line breaks and widths (Japanese and German break differently), reading time (hold per line, not per word, for scripts without spaces), right-to-left order, and the font's coverage (vendor a family with the script's subset). Render each language as its own file and run the smoke test on each. The same split lets one motion template carry a series: swap the copy table, then check every seam for overlaps again.

## String audit

Run before every review round: proofing bugs read as fake faster than any motion flaw.

- **Plurals and zero:** a helper, so zero reads "No clashes", never "0 clashes", and 1 reads "1 clash".
- **Casing:** the brand name cased one way everywhere; statements in sentence case; no ALL-CAPS labels.
- **Punctuation:** curly apostrophes and quotes (’ “ ”), plain range spelling (9 to 5), × for dimensions, no double spaces.
- **Numbers:** one time format, one currency format, thousands separators, tabular figures on anything that counts.
- **Data:** dates match weekdays, counts match the items shown; assert them in the scene's data module. No number is typed into copy or narration: each one comes from a data slot.
- **Names:** invented, plausible and varied; never real people or companies, "John Doe", "Acme" or example domains.
- **One source:** every on-screen string lives in the scene's copy and data arrays, never hard-coded inside a shot.

```bash
grep -nE "[a-z]'[a-z]|\b1 [a-z]+s\b|lorem|ipsum|TODO|FIXME|Acme|John Doe|example\.com|undefined|NaN" index.html
```

[video-brief, old COPY.md reading recipe; frame-review, smoke.mjs] Apply the [Budget reading floor](#budget) after the line resolves. The old line said 36 frames + 6 per word and claimed smoke enforced it; for five words that is 1.1 s at 60 fps, below the current word floor of 1.5 s. Its lockup 1.5-2 s and URL at least 1.7 s are source-specific additional holds, never exemptions from the floor. The old checker truncated text and omitted final visible runs; the current repair retains full text and flushes those runs. A zero short-read count still does not prove final legibility: the read probe defaults to 10 Hz, DOM visibility uses an opacity threshold and pictured text is outside the probe. Inspect complete reads in the rendered frames.
