# An evidence-backed UI improvement shortlist

Use this for a short list of changes someone will see or feel in an existing product. The method comes from [fluid-functionalism], `references/stack-audit.md`, `scripts/stack.mjs` and `scripts/audit.mjs`, with Libraries.dev's free review format kept as the alternate view below. A cross-discipline verdict review stays in [REVIEW.md](REVIEW.md); this workflow produces an improvement shortlist. Fresh facts and approved decision storage follow [repository audit policy](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/REPOSITORY-AUDIT.md#facts-are-read-never-remembered).

## Inventory the product surface

The following exclusion list belongs to the source's UI inventory. A broader repository audit still inspects the relevant tests, scripts and configuration under [repository audit scope](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/REPOSITORY-AUDIT.md#scope-intent-and-expected-load). [fluid-functionalism, stack.mjs; shadcn/improve, SKILL.md]

- **Read product code only:** "Product code only: tests and stories are not what people use, and fixtures in them (a template that loads Inter, say) would read as the app's own." The walk skips `node_modules`, `.git`, `.next`, `.turbo`, `.vercel`, `.output`, `.cache`, `.svelte-kit`, `.agents`, `.claude`, `dist`, `build`, `out`, `coverage`, `public`, `storybook-static`, `__tests__`, `__mocks__`, `tests`, `e2e` and any other directory whose name starts with a dot; it reads only `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.css` and `.html` files, skips `.d.ts` and names matching `/\.(test|spec|stories)\.[cm]?[jt]sx?$/`, stops at 8,000 files and skips any file over 400,000 bytes [fluid-functionalism, stack.mjs].

## Measure before you advise

Measure what source cannot settle, in bounded passes (once before advising, once after a change, then stop), and file an entry that needed a measurement the app could not give as a `check:` question rather than a finding [fluid-functionalism, stack-audit.md]. The quotes and the script are in [browser-ui-qa UI-INVARIANT-AUDIT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/browser-ui-qa/UI-INVARIANT-AUDIT.md#what-it-cannot-see).

## The evidence gate

[fluid-functionalism, stack-audit.md]: "Every advice item and every shortlist entry passes this gate before it is written":

1. "**Evidence.** A line `audit.mjs` printed, quoted with its route and width, or a `file:line`. A hunch, a grep hit, a similar name, or 'this looks hand-rolled' is a lead to measure, not evidence."
2. "**Reach.** The evidence is on a surface people actually use in this product: the measured route renders it, or the file is on that route's render path. A problem in a demo page, a storybook, or a depicted mockup is not the product's problem."
3. "**One correction.** The entry names exactly one … replacement. If the evidence supports two corrections, or the fix needs product intent nobody has stated, it is a question for the user, not an entry."

"Then try to break each survivor. Re-open what it cites and delete it when":

- "the measurement or the file does not match what the entry claims;"
- "the difference is a documented exception or a recorded decision (a deliberate stillness, an off-token duration someone chose on purpose, explained by a comment beside the code or a line in the project's agent notes);"
- "the surface is depicted UI rather than the app's own chrome;"
- "another entry has the same root cause: merge them into one;"
- "it is infrastructure, which the shortlist never carries."

"Evidence is the footnote, not the headline". It "sits on its own `evidence:` line in the reply, so the user, or the next session, can re-check it instead of trusting it." "If fewer than two entries survive, say so rather than pad. If none survive, that is a result, not a failure: write *'No changes recommended: nothing measured on <routes> departs from the system'* and stop. An audit that always finds something teaches people to ignore it."

## The shortlist

[fluid-functionalism, stack-audit.md]:

- **Two to five items:** "Two to five is a hard band: one suggestion reads as an afterthought, six reads as a rewrite plan. If fewer than two genuine candidates exist, say so; never pad."
- **UI only:** "Every slot goes to something the user sees or feels. Infrastructure findings (dead dependencies, package-manager notes, framework or Tailwind migrations, icon-library consolidation) are stated as stack facts, but they never occupy a shortlist slot and never lead the conversation."
- **Systems before components:** "one system adopted lifts every surface at once, and components installed afterwards land on rails that already exist."
- **Impact and effort:** impact "(high / medium / low): how much the user would actually feel it", written on this repo's scale as P1, P2 and P3 ([code-review REVIEWER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/REVIEWER.md#tags-and-output)); effort S, M or L, where S is "few call sites", M "several call sites or a moderate API distance" and L a "heavily customized local component …, many call sites, or a blocked install". "Rank by impact-per-effort … a medium-impact S usually belongs above a high-impact L."
- **At most two craft details per entry,** and "Only cite what the project actually lacks". "Reading the current component first is what makes the pitch credible."
- **In the reply, not a file,** "under ~40 lines", led by a table `| Now | Replace with | Impact | Effort | Why | Evidence |`.

**Write every entry from the interface, not from the code.** "An entry opens on what someone using it sees now, where, and how often. The file, the missing config line, the token, and the size of the fix all come after". Three things carry a why: "**Exposure.** How much of a session this surface is on screen, and for how long." "**What it costs them now.** Read the current behavior and name the moment it goes wrong". "**Which quality it buys back.** Cohesion … Immediacy … Legibility of state … Finish". The same finding both ways:

> Backwards: "InterVariable loads as a single 400 face (one line). No `weight`, so next/font emits an `@font-face` with no weight range."
>
> Right: "A selected row in the model picker looks almost the same as an unselected one, so people read the list instead of glancing at it. Weight is the cue that would carry that, and it is the one cue this app cannot currently use: the variable font is declared without a weight range, so every weight resolves to the same face. One line in the font declaration turns selection into something you see rather than parse."

"Same fact, same fix, same length. The second one is about the product."

**A behaviour the product never had is a question.** "If nothing in the app animates a hover today, that is as likely a deliberate register as an oversight: plenty of good interfaces are still, and mean to be." "Ask once before it takes a slot: name where it would land first, what it would feel like there, and what it would cost." Offer to record the answer as a decision "so no later run re-opens a settled question."

**A blocked install is never a gate on the outcome.** "A blocked CLI blocks *installs*, not the outcome." "Don't close with a summary that puts the migration in front of everything: 'the gate behind all of this is Tailwind v3' tells someone their product cannot improve until they take on a migration they never asked for, which is discouraging and, on every item above it, untrue." "Advise the migration question once, deliberately, as its own decision with its costs, not as a prerequisite smuggled into every suggestion."

## The other view: grep hits ranked directly

Libraries.dev's free skill reviews a project by grepping each library's fit signals (spinners and "Thinking…" copy, prompt boxes, `getUserMedia`, image skeletons) and ranking the hits: "Order all suggestions by impact: an AI waiting state beats a decorative border. Suggest at most one library per UI area (a sidebar, a thread, a composer, a card), never two effects on the same element or on elements right next to each other, and skip spots already using the library." Each line of its output is "`path/File.tsx:42` - what the spot is → **Library** (state or variant to use, key options) - why, in one sentence", it edits nothing, and it ends "Run `libraries apply` on any line to install it." [Libraries.dev]. The evidence gate above is stricter (a grep hit "is a lead to measure, not evidence") and stays the rule here; the one-per-area limit and the one-line output format carry over.

## Prove it

Each shortlist entry carries an `evidence:` line with a route and width or a `file:line` that still matches when re-opened; the shortlist holds two to five UI items or says why not, with infrastructure outside it. Recorded decisions follow the [existing-notes policy](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/REPOSITORY-AUDIT.md#only-decisions-persist). [fluid-functionalism, stack-audit.md]
