# Skills that inspect a project

A skill that reads a user's project and advises on it should leave no state of its own: it reads its facts again from the code every session, measures before it advises, puts every suggestion through an evidence gate it then tries to break, and keeps only the user's own decisions, with their consent, in notes the project already has. Source: [fluid-functionalism], `SKILL.md`, `references/stack-audit.md`, `scripts/stack.mjs` and `scripts/audit.mjs`, the audit method of a React component system. Its component-specific details are left out; the method is what transfers. The measurement script is [e2e-testing UI-INVARIANT-AUDIT.md](../../web-automation/e2e-testing/UI-INVARIANT-AUDIT.md).

## Facts are read, never remembered

- **A read-only script at the start of every session:** "The stack read runs at the start of every session that installs, composes, or advises." "Neither writes into the project: facts are read again each time, results go in the reply, and only the user's own decisions are kept, with their OK." [fluid-functionalism, stack-audit.md]
- **Every fact cites where it came from:** the script "prints what it read, with the file:line it read it from, and writes nothing." "Reading them again each run means no cached verdict can drift from the code, so the skill never has to leave a record in the project." [fluid-functionalism, stack.mjs]
- **Same derivation, same answer:** "The script derives it the same way every run, so the same project always gets the same answer. Don't override it from memory of an earlier session". On later runs, "Run `stack.mjs` again; it is the record. Trust what it prints over anything remembered from an earlier session." [fluid-functionalism, stack-audit.md]
- **Read product code only:** "Product code only: tests and stories are not what people use, and fixtures in them (a template that loads Inter, say) would read as the app's own." The walk skips `node_modules`, `.git`, `.next`, `.turbo`, `.vercel`, `.output`, `.cache`, `.svelte-kit`, `.agents`, `.claude`, `dist`, `build`, `out`, `coverage`, `public`, `storybook-static`, `__tests__`, `__mocks__`, `tests`, `e2e` and any other directory whose name starts with a dot; it reads only `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.css` and `.html` files, skips `.d.ts` and names matching `/\.(test|spec|stories)\.[cm]?[jt]sx?$/`, stops at 8,000 files and skips any file over 400,000 bytes [fluid-functionalism, stack.mjs].
- **A script must run through a symlinked skill folder.** "Both sides go through realpath: a skill installed globally is usually a symlink (~/.claude/skills/… → ~/.agents/skills/…), and Node reports the main module by its real path." [fluid-functionalism, stack.mjs]

```js
function isMain() {
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (process.argv[1] && isMain()) {
  const args = process.argv.slice(2);
  try {
    const stack = readStack(args.find((a) => !a.startsWith("--")) ?? ".");
    console.log(args.includes("--json") ? JSON.stringify(stack, null, 2) : report(stack));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
```

## Measure before you advise

Measure what source cannot settle, in bounded passes (once before advising, once after a change, then stop), and file an entry that needed a measurement the app could not give as a `check:` question rather than a finding [fluid-functionalism, stack-audit.md]. The quotes and the script are in [UI-INVARIANT-AUDIT.md](../../web-automation/e2e-testing/UI-INVARIANT-AUDIT.md#what-it-cannot-see).

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
- **Impact and effort:** impact "(high / medium / low): how much the user would actually feel it", written on this repo's scale as P1, P2 and P3 ([code-review REVIEWER.md](../../architecture/code-review/REVIEWER.md#tags-and-output)); effort S, M or L, where S is "few call sites", M "several call sites or a moderate API distance" and L a "heavily customized local component …, many call sites, or a blocked install". "Rank by impact-per-effort … a medium-impact S usually belongs above a high-impact L."
- **At most two craft details per entry,** and "Only cite what the project actually lacks". "Reading the current component first is what makes the pitch credible."
- **In the reply, not a file,** "under ~40 lines", led by a table `| Now | Replace with | Impact | Effort | Why | Evidence |`.

**Write every entry from the interface, not from the code.** "An entry opens on what someone using it sees now, where, and how often. The file, the missing config line, the token, and the size of the fix all come after". Three things carry a why: "**Exposure.** How much of a session this surface is on screen, and for how long." "**What it costs them now.** Read the current behavior and name the moment it goes wrong". "**Which quality it buys back.** Cohesion … Immediacy … Legibility of state … Finish". The same finding both ways:

> Backwards: "InterVariable loads as a single 400 face (one line). No `weight`, so next/font emits an `@font-face` with no weight range."
>
> Right: "A selected row in the model picker looks almost the same as an unselected one, so people read the list instead of glancing at it. Weight is the cue that would carry that, and it is the one cue this app cannot currently use: the variable font is declared without a weight range, so every weight resolves to the same face. One line in the font declaration turns selection into something you see rather than parse."

"Same fact, same fix, same length. The second one is about the product."

**A behaviour the product never had is a question.** "If nothing in the app animates a hover today, that is as likely a deliberate register as an oversight: plenty of good interfaces are still, and mean to be." "Ask once before it takes a slot: name where it would land first, what it would feel like there, and what it would cost." Offer to record the answer as a decision "so no later run re-opens a settled question."

**A blocked install is never a gate on the outcome.** "A blocked CLI blocks *installs*, not the outcome." "Don't close with a summary that puts the migration in front of everything: 'the gate behind all of this is Tailwind v3' tells someone their product cannot improve until they take on a migration they never asked for, which is discouraging and, on every item above it, untrue." "Advise the migration question once, deliberately, as its own decision with its costs, not as a prerequisite smuggled into every suggestion."

## Only decisions persist

[fluid-functionalism, stack-audit.md]: "The only thing worth carrying between sessions is what the user decided, because nothing in the code shows it". "Record one only when the user makes it, and only with their OK":

- "**Tied to one place** (a duration, one still list): a one-line comment beside the code saying what was kept and why." "The note goes away with the code it explains."

  ```tsx
  // 150ms on purpose: matches the OS sheet it sits on, not an FF token.
  ```

- "**Project-wide** (fluid hover declined, a local alias of a system piece): one line under a `## Fluid Functionalism` heading in the agent notes the project already keeps (`AGENTS.md`, `CLAUDE.md`)", the heading being the skill's own name. The script finds that heading "in the app's directory or any directory above it up to the repository root" (it reads `AGENTS.md`, `CLAUDE.md` and `.github/copilot-instructions.md`) [fluid-functionalism, stack.mjs].

  ```markdown
  ## Fluid Functionalism
  - Fluid hover: declined 2026-09-14, menus stay still on purpose.
  - hooks/use-proximity-hover.ts is this project's use-fluid-hover: extend
    it, don't install beside it.
  ```

- "Never create a new file for decisions. If the project keeps no agent notes, or the user would rather not write any, keep the decision in your own memory if you have one, or just in the reply. A lost decision costs one repeated question, never a wrong install."
- "Record what the user said or what you observed, not what you concluded from it: 'GET /r/select-base.json → 404' is a fact; 'the registry serves Radix only' is a conclusion the fact doesn't support." "A claim you couldn't verify is a question for the user, not a decision."
- **Earlier audit files** a previous version wrote: "read it for decisions only … and honor them. Ignore its versions, inventory, verdicts, and open advice: the script and a fresh measurement replace those. Don't update it." Offer to move its decisions into the agent notes; "Never delete it unasked."
- **Surface advice at natural moments,** "not on every run. If the user declines, offer to record it as a decision so it stops being raised."

## Prove it

The skill writes nothing into the project except a decision the user approved; its fact script prints a `file:line` for every fact and gives the same verdict on two runs; each shortlist entry carries an `evidence:` line with a route and width or a `file:line` that still matches when re-opened; the shortlist holds two to five UI items or says why not, with infrastructure outside it; and every recorded decision is a comment beside its code or a line under the skill's heading in existing agent notes, never a new file.
