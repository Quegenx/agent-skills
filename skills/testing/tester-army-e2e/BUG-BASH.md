# Exploratory testing and bug bashes

An explorer's finding is a model's claim plus evidence, not a verified reproduction: report confirmed bugs only, each with a repro test that fails on the assertion that encodes it. Triage rejects explorer artifacts, environment gaps, intended design and fixture gaps before any test is written. The commands use the `e2e` runner's `explore`. [tester-army/e2e, bug-bash]

**Contents:** [Exploring by hand](#exploring-by-hand) · [The explore command](#the-explore-command) · [Bug bash: prepare](#bug-bash-prepare) · [Plan charters](#plan-charters) · [Fan out](#fan-out) · [Merge and triage](#merge-and-triage) · [Verify](#verify) · [Report and clean up](#report-and-clean-up) · [Prove it](#prove-it)

## Exploring by hand

- **Stance:** try to break things, not confirm they work. Don't try to be systematic about coverage; explore like a user would, with the intent to break things.
- **Loop:** open the page, snapshot it to understand it, screenshot it and look, decide what looks wrong, act, snapshot again, repeat. With the Browserbase `browse` CLI that is `browse open` then `snapshot`, `screenshot`, an action, `snapshot` ([browser-ui-qa adversarial workflow](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/browser-ui-qa/ADVERSARIAL-UI-QA.md)).
- **Checklist:**
  - **First impressions** (30 s): is the purpose clear, the hierarchy right, anything broken, any console errors.
  - **Navigation:** reach every section; back works; breadcrumbs are accurate; no dead ends; the logo goes home.
  - **Form stress:** empty, 200+ characters, `<script>alert('xss')</script>`, `"quotes"`, emoji, a rapid double submit, tab order, helpful validation.
  - **State persistence:** half-fill a form and leave; create, then refresh; filters after a refresh; Escape closes a modal.
  - **Edge cases:** the empty state, a 404, an expired session, a mobile viewport.
  - **Performance perception:** loading indicators, content popping in.
- **Tips:** start at the homepage and follow the nav; try `/does-not-exist`; enter garbage before valid input; check every page at 375 px wide.
- **Finding format:** `FINDING / SEVERITY (P0/P1/P2/P3) / ROUTE / EVIDENCE / RECOMMENDATION`.
- **Turn a finding into a test:** the reproduction steps become the actions and `expected` becomes the assertion.

## The explore command

- **`npx e2e explore ['goal']`** (default goal `Explore the app and find bugs`) needs a target and an agent with a model.
- **Loop:** open the app; a planner model call reads the goal, the steps so far, the findings and the current screen, and returns a title and a concrete charter for one flow, or "covered"; the charter runs as `agent.act()` with the project tools plus `report_finding` (title, `issue` or `warning`, the runner's numeric severity, expected, actual, reproduction steps; the runner adds the path and a redacted screenshot). Normalize severity only in the derived review/report using the mapping below. It repeats until the planner finishes, the step limit, the clock, or three failed or blocked steps in a row that reported nothing; then a closing assessment.
- **Flags:** `--target`, `--agent`, `--session <name>` (runs exactly the setup that saves it, then explores signed in), `--max-steps` (default 8, 1 to 12), `--timeout` (default 600000, 180000 to 900000; the last minute is for the assessment), plus the `run` output flags. Per-step budgets default to 40 actions and 40 model calls. Cache off, retries zero.
- **Verdict:** exit 0 means steps ran, no `issue`, not all blocked (warnings allowed). Exit 1 means at least one issue, or no step ran and nothing was found. All blocked exits with the first blocker's code (1 automation limit, 2 missing model, credentials, seed or setup, 3 environment).
- **One report severity scale:** map the source's critical/5 to P0, high/4 to P1, medium/3 to P2, and low/2 or trivial/1 to P3 in the derived review/report. Preserve the runner's numeric tool inputs and raw artifacts; this normalization does not change its API. issue/warning remains a finding kind, not another severity scale. [tester-army/e2e, e2e explore] The report sits under `run.explore` (`ended`: `finished | step-limit | time | stuck | aborted`, the steps, and findings with id, kind, severity, expected, actual, reproduction, path, artifactId). Screenshots land in `.e2e/results/explore-<slug>-<id>/attempt-1/finding-1.png`.

## Bug bash: prepare

Seven steps: prepare, plan charters, fan out, merge, triage, verify, report.

- **The app must serve several explorers at once:** start it once and set `reuseExisting: true`, or use port `0` per run. `reuseExisting` is ignored under `CI`, which many agent sandboxes set: use port 0, or unset `CI`. A fixed port without reuse fails every run after the first.
- **If `app.command` brings up its own stack** (a database it removes on exit), the first explorer to finish removes the database under the rest. Start the stack once yourself and use a bug-bash config with no command.
- **Explore a production build:** a dev server compiling a route on first visit reads as a dead link.
- **Seed one disposable workspace or user per charter** (`bb-<slug>`): explorers sharing an account report each other's edits as bugs.
- **Signed-in charters start from a saved session.** A setup that types a password withholds screenshots; sign in by cookie or API to keep them.
- **Put in `context` what the local app cannot do** (integrations without keys, seed data, items never to click, like paid runs), plus the explorer's known blind spots.
- **Against a deployed site others use, stay read-only:** no signups, sign-ins or submissions, nothing injection-shaped, no request loops. A WAF block is the firewall working, not a finding, and it can follow the runner's IP.
- **Budgets:** each exploration step needs 40+ `maxSteps` and `maxModelCalls`; a config tuned for tests (`maxSteps: 15`) starves it.
- **Mobile:** one target per device. Skip `--headed`; use `--video` for replays.
- **The bug-bash config stays untracked** and spreads the base config: the tests glob adds `'tests/bugbash/**/*.e2e.ts'`, `retries: 0`, a target with no command, and a `BUGBASH_PASSWORD` of 6+ characters. Context and personas:

```ts
const context =
  'Sign in with the credential the goal names. The local app sends no email and has no AI key. Never start a paid run or connect an integration. ' +
  'Not bugs: a link that opens a new tab leaves this one unchanged; accessible text splits around inline links, so judge copy by the rendered screen when a screenshot is available and never report split text alone as broken copy; an infinite-scroll "Loading more" sentinel loads when scrolled into view; images lazy-load, so scroll and wait before calling one blank.';
const persona = { model: gateway('<provider/model id>'), maxSteps: 40, maxModelCalls: 40, context };
// agents:
//   skeptic: system 'Distrust every number, date, count, and claim on screen; cross-check each against every other place it appears.'
//   fuzzer:  system "At every input, run the goal's input matrix before anything else, judging each entry before the next. Never take the happy path."
```

## Plan charters

- **A charter is one goal:** one area, one posture, one sentence, naming the start route and the credential. Read the routes, nav and forms first; for a branch, `git diff --stat` against the base. Five to ten charters, each with a slug; overlap is fine.
- **One charter, one area:** a whole-app charter ends at its budget having skimmed everything.

| Posture | Example charter |
|---|---|
| First-time user | `Starting at /signup, sign up and complete onboarding like a first-time user; report anything confusing, broken, or inconsistent` |
| Numbers and copy | `Starting at /cart, change quantities and apply a coupon; check every price, total, and label against the rest of the page` |
| Edge input | `... submit each field empty, too long, with unicode and with leading spaces; report validation that is missing or wrong` |
| State | `... create, rename, and delete a project, reloading and going back after each; report state that is lost or stale` |
| Error paths | `... wrong password, an unknown account, and a locked account; report errors that are missing, misleading, or leak detail` |

- **Give each posture a persona:** a generic agent walks past a stat that contradicts the same stat on another page; the skeptic catches it.
- **An edge-input charter names its exact matrix** (empty, a 300-character string, unicode, leading spaces, literal special characters), or it spends the whole budget before judging one result. For realistic values (schema limits, names, emails, counts of 0 and 1, time zones) and for stressing one component on its own, see [browser-ui-qa: WORST-CASE-VALUES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/browser-ui-qa/WORST-CASE-VALUES.md) and [browser-ui-qa: WORST-CASE-DATA.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/browser-ui-qa/WORST-CASE-DATA.md).

## Fan out

- **One explore per charter,** with `--output .e2e/bugbash/<slug>` and `--reporter list,markdown`; add `.e2e/bugbash/` to `.gitignore`. Run them as background shell jobs, four at a time, not as subagents.

```bash
while IFS='|' read -r slug target agent charter; do
  [ -n "$slug" ] && printf '%s\0%s\0%s\0%s\0' "$slug" "$target" "$agent" "$charter"
done < .e2e/bugbash/charters.txt | xargs -0 -n 4 -P 4 sh -c \
  'npx e2e explore "$4" --config e2e.bugbash.config.ts --target "$2" --agent "$3" --output ".e2e/bugbash/$1" --max-steps 6 --video --reporter list,markdown < /dev/null > ".e2e/bugbash/$1.log" 2>&1' _
```

- `xargs -0 -P` exists in GNU and BSD, so this runs on macOS and Linux. Exit 1 means issues were reported (read the log either way); exit 2 or 3 is setup or environment: fix it and rerun that charter alone.

## Merge and triage

- **Merge findings with the same path and the same broken behavior;** keep the clearest repro and every charter that hit it. Keep warnings in a separate list unless polish was asked for. Videos are not masked: check them for secrets before sharing.
- **Sort every finding before writing any test, reading the source:**

| Bucket | Sign | Outcome |
|---|---|---|
| Explorer artifact | a "dead" `target="_blank"` link that opens with popup capture or direct navigation; a sentence broken in the tree but whole in the screenshot; an unscrolled "Loading more"; a lazy image | rejected with the settling check; settle first |
| Environment | needs a key, service or limit only the local stack lacks | rejected, naming the variable; note it if production users would see bad handling (a raw error) |
| Design | the code, tests or copy say it is intended | rejected, citing where |
| Fixture | the seed lacks a field real records have | rejected, naming the field |
| Candidate | none of the above | verify |

## Verify

- **Read `actual` against the screenshot or video.** A valid `href` with its default prevented is still dead; a copy claim must show in the rendered screenshot.
- **Write a repro test that asserts the expected behavior,** so it fails today and passes once fixed: under the glob (`tests/bugbash/<slug>.e2e.ts`), tagged `bugbash`, preferring exact `screen` plus `expect` steps, with exact locators taken from the live app. Run it alone.
- **Confirmed only when it fails with `ASSERTION_FAILED` on the assertion that encodes the bug.** Other failures need [cause-based triage](DEBUGGING.md#failure-code-versus-cause), rather than the source's blanket claim that the test is wrong. A passing test means the bug did not reproduce: reject it, and move the test out (`.e2e/bugbash/extra-tests/`, or offer it as a regression test).
- **Optional subagents for verification** (unlike the fan-out): one per area with 3 to 5 candidates, up to four at a time (the MCP default session limit). Each reports confirmed or rejected, the root cause as `file:line`, the repro test path and the observed failure.

## Report and clean up

- **Order:** confirmed bugs, most severe first (title, path, an expected vs actual line, root cause, steps, screenshot or video, repro test, charters); then environment candidates that are production risks, marked unverified; then rejected findings grouped by reason (environment, design, fixture, did not reproduce); then warnings; then the charters run, the cost, and the areas no charter reached.
- **Keep repro tests out of gate runs** (`--exclude-tag bugbash`) or uncommitted. Offer to fix: the repro turning green is the proof, and it stays as a regression test with the tag removed.
- **Leave project files as found:** the bug-bash config, seed script and repro tests stay untracked; stop the stack you started.

## Prove it

Every reported bug has a repro test that fails with `ASSERTION_FAILED` on the assertion encoding it; every rejected finding names its bucket and the check, variable, file or field behind it; the report lists the areas no charter reached; and `git status` shows only the untracked bug-bash files.
