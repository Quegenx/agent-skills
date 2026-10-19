# Lighthouse and Lighthouse CI

Lighthouse is a lab measurement: one machine, one throttled load, no real users. It is the gate in CI and the fast loop while you work; field data from real users confirms the win ([performance-and-caching VERCEL-METRICS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/VERCEL-METRICS.md), and the loop in [performance-and-caching MEASURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/MEASURE.md#lab-to-field-one-slow-spot-at-a-time)). Lighthouse CI (LHCI) runs Lighthouse several times per build, asserts on the results and uploads the reports. Sources: the GoogleChrome/lighthouse-ci repo (Apache-2.0: README, docs/getting-started.md, configuration.md, server.md, troubleshooting.md, the presets and `packages/utils/src/assertions.js`, read 2026-10-18), tagged [lighthouse-ci]; Lighthouse's own `docs/variability.md` and `core/config/default-config.js`; and Chrome's docs, linked where used. Audit Kit (MIT, [Danilaa1/auditkit](https://github.com/Danilaa1/auditkit)) is the worked example of what goes wrong, tagged [audit-kit].

**Versions.** LHCI's latest release is v0.15.1 (2025-06-26), and `@lhci/cli` pins **Lighthouse 12.6.1** (`packages/cli/package.json`). Lighthouse itself is at v13.5.0 (2026-09-18). Lighthouse 13 renamed or removed many audit ids, so every audit id below says which major it belongs to; re-check them on any upgrade.

**Contents:** [Reading a Lighthouse result](#reading-a-lighthouse-result) · [Audit ids in Lighthouse 12 and 13](#audit-ids-in-lighthouse-12-and-13) · [Start slowly, then ratchet](#start-slowly-then-ratchet) · [Setup](#setup) · [Running Lighthouse from Node](#running-lighthouse-from-node) · [Pages behind login](#pages-behind-login) · [Variance](#variance) · [Assertions](#assertions) · [Upload, tokens and status checks](#upload-tokens-and-status-checks) · [Troubleshooting](#troubleshooting) · [The LHCI server](#the-lhci-server) · [The Agentic Browsing category](#the-agentic-browsing-category) · [Prove it](#prove-it)

## Reading a Lighthouse result

[Lighthouse performance scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring):

- **Only metrics make the score:** "only metrics contribute to your Lighthouse Performance score, not the results of Opportunities or Diagnostics", though fixing those "likely improve the metric values".
- **Lighthouse 10 weights:** First Contentful Paint 10%, Speed Index 10%, Largest Contentful Paint 25%, Total Blocking Time 30%, Cumulative Layout Shift 25%. Time to Interactive had 10% in Lighthouse 8 and has no weight now; the `interactive` audit still runs (Lighthouse 12 and 13), so a gate on it gates a metric the score no longer weighs.
- **Bands:** "0 to 49 (red): Poor", "50 to 89 (orange): Needs Improvement", "90 to 100 (green): Good". "A 'perfect' score of 100 is extremely challenging to achieve and not expected." Report these bands, not a tool's own: Audit Kit tones scores at 85 and 65, so an 86 shows green there and orange in Lighthouse [audit-kit, src/lighthouse.ts].
- **The score fluctuates** mostly because conditions change: "A/B tests or changes in ads being served", routing, devices, extensions, antivirus. Think of it "as a distribution of scores, rather than a single number" ([Variance](#variance)).
- **TBT is the lab stand-in, not a Core Web Vital.** The Core Web Vitals are LCP, INP and CLS at the 75th percentile, and "Total Blocking Time (TBT) metric is lab-measurable and is a proxy for INP" ([web.dev, Web Vitals](https://web.dev/articles/vitals)). TBT bands differ by form factor: mobile 0 to 200, 200 to 600, over 600 ms; desktop 0 to 150, 150 to 350, over 350 ms ([TBT](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-total-blocking-time)). Audit Kit labels LCP, CLS and TBT as "Core Web Vitals" and applies the mobile TBT bands everywhere [audit-kit]; don't.
- **A lab run sees server HTML and one load.** Audit Kit makes one headless run and keeps the raw JSON, with no field data and no repeats [audit-kit]: useful for a quick look, not a gate.

## Audit ids in Lighthouse 12 and 13

Chrome's [Lighthouse is moving to performance insight audits](https://developer.chrome.com/blog/moving-lighthouse-to-insights) (2025-04-28) and the v13.0.0 changelog ("performance: remove audits replaced by performance insights (#16729)"). Renamed or merged in 13 (new id: what it replaces):

| Lighthouse 13 insight | Replaces (Lighthouse 12) |
|---|---|
| `cls-culprits-insight` | `layout-shifts`, `non-composited-animations`, `unsized-images` |
| `document-latency-insight` | `redirects`, `server-response-time`, `uses-text-compression` |
| `dom-size-insight` | `dom-size` |
| `duplicated-javascript-insight` | `duplicated-javascript` |
| `font-display-insight` | `font-display` |
| `image-delivery-insight` | `modern-image-formats`, `uses-optimized-images`, `efficient-animated-content`, `uses-responsive-images` |
| `interaction-to-next-paint-insight` | `work-during-interaction` |
| `lcp-discovery-insight` | `prioritize-lcp-image`, `lcp-lazy-loaded` |
| `lcp-breakdown-insight` | `largest-contentful-paint-element` (the blog names it `lcp-phases-insight`; v13.0.0's default config ships `lcp-breakdown-insight`) |
| `legacy-javascript-insight` | `legacy-javascript` |
| `modern-http-insight` | `uses-http2` |
| `network-dependency-tree-insight` | `critical-request-chains`, `uses-rel-preconnect` |
| `render-blocking-insight` | `render-blocking-resources` |
| `third-parties-insight` | `third-party-summary` |
| `use-cache-insight` | `uses-long-cache-ttl` |
| `viewport-insight` | `viewport` |

Removed with no replacement: `first-meaningful-paint`, `no-document-write`, `offscreen-images`, `uses-passive-event-listeners`, `uses-rel-preload`, `third-party-facades`. Lighthouse 12.0 also "removed the PWA category" and budgets ("remove budgets (#15950)"). Accessibility, SEO and Best Practices audits were not affected.

- **Key automation on the ids of the Lighthouse you run.** Audit Kit depends on `lighthouse ^13.3.0` but reads 14 Lighthouse 12 ids; 8 of them come back `undefined` and drop out silently, and its test fixture still uses `render-blocking-resources` [audit-kit]. Fail loudly on an id the report doesn't contain.
- **LHCI's presets are Lighthouse 12 ids** and work today because LHCI pins 12.6.1. Its docs still use ids gone even from 12.6.1: `uses-webp-images`, `tap-targets`, `uses-rel-preload`, `installable-manifest` (current names in the preset: `modern-image-formats`, `target-size`). `"off"` on an unknown id is harmless; `warn` or `error` fails with `"<id>" is not a known audit.` [lighthouse-ci, assertions.js].

## Start slowly, then ratchet

[lighthouse-ci, configuration.md#recommended-configurations, getting-started.md]. "The Lighthouse team recommends starting slowly." Three stages:

1. **Easy Mode** ("Recommended for those new to Lighthouse"): collect and upload only, no assertions. "If you're new to performance measurement or your site has a lot of room for improvement, we recommend skipping this step [assertions] for now."
   ```json
   {"ci": {"upload": {"target": "temporary-public-storage"}}}
   ```
   Temporary public storage is a privacy decision, not a default ([Upload](#upload-tokens-and-status-checks)).
2. **Next Level:** `"preset": "lighthouse:recommended"`, with every currently failing audit turned `"off"` (the docs' example: `offscreen-images`, `color-contrast`). "Treat this as a burndown list of your team of issues to fix!" Turn each one back on as it is fixed: that is the ratchet in [performance-and-caching MEASURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/MEASURE.md#deterministic-counts-and-ratchets), where a fixed count can only go down.
3. **The Complete Experience** ("Recommended for seasoned Lighthouse users"): more runs, the preset, metric budgets, and an LHCI server for history and diffs:
   ```jsonc
   {
     "ci": {
       "collect": {"numberOfRuns": 5},
       "assert": {
         "preset": "lighthouse:recommended",
         "assertions": {
           "first-contentful-paint": ["error", {"maxNumericValue": 2000, "aggregationMethod": "optimistic"}],
           "interactive": ["error", {"maxNumericValue": 5000, "aggregationMethod": "optimistic"}]
         }
       },
       "upload": {"target": "lhci", "serverBaseUrl": "https://lhci.example.com"}
     }
   }
   ```
   `interactive` (TTI) carries no weight in the Lighthouse 10 score ([Reading a Lighthouse result](#reading-a-lighthouse-result)).

Two views, each in its place: LHCI starts loose and tightens; the code-review skill's approval tiers "start strict and loosen with evidence" ([code-review APPROVAL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/APPROVAL.md)). Those are human approval rules, this is a performance gate.

## Setup

**Prerequisites** [lighthouse-ci, getting-started.md]: git; "Branches/pull requests are gated on the results of a continuous integration build process"; the CI "can build your project into production assets"; and either a command that serves production-like assets or a static site.

**Quick start**, verbatim [lighthouse-ci, README.md]:

```yaml
name: CI
on: [push]
jobs:
  lighthouseci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm install && npm install -g @lhci/cli@0.15.x
      - run: npm run build
      - run: lhci autorun
```

LHCI pins the minor series (`0.15.x`) and floats the actions on tags. This repo pins exactly: "The workflow pins actions by SHA and sets `permissions: contents: read`" ([tester-army-e2e RUNNER-SETUP.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/tester-army-e2e/RUNNER-SETUP.md)) and "Pin the version. Do not float on a tag." ([code-review LAYERS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/LAYERS.md#4-automated-checks-that-block)). Copy the shape, pin the versions.

[lighthouse-ci, configuration.md]:

- **Config file,** searched in this order: `.lighthouserc.js`, `lighthouserc.js`, `.lighthouserc.cjs`, `lighthouserc.cjs`, `.lighthouserc.json`, `lighthouserc.json`, `.lighthouserc.yml`, `lighthouserc.yml`, `.lighthouserc.yaml`, `lighthouserc.yaml`. "upward traversal is not supported"; otherwise pass `--config=./path`; `--no-lighthouserc` turns auto-loading off. The top level is `ci: { collect, assert, upload, server, wizard }`.
- **Environment variables:** any option, as "`LHCI_PROPERTY_NAME__SUBPROPERTY_NAME` is equivalent to `--propertyName.subpropertyName`" (`LHCI_SERVER_BASE_URL=https://example.com lhci upload`).
- **`lhci autorun`** runs collect, assert and upload "depending on the options in your config". Child flags "**must** use the `=` syntax ... use `lhci autorun --collect.numberOfRuns=5` and NOT `lhci autorun --collect.numberOfRuns 5`".
- **What it serves:** without a URL it looks for `staticDistDir` in `dist`, `build`, `out` and `public`, else runs an npm script named `serve:lhci` as `startServerCommand` (`"serve:lhci": "NODE_ENV=production npm run server"`). LHCI starts and stops the server itself. `staticDistDir`: "**DO NOT** use this option if `url` will point to an origin that isn't `localhost` or the project uses `startServerCommand`"; `startServerCommand`: "**DO NOT** use this option when your project is just a collection of static assets". With `staticDistDir`, a `url` turns autodiscovery off and its port is replaced, so `http://localhost/my-static-page.html` works. `isSinglePageApplication` serves `index.html` "instead of a 404 for unrecognized paths".
- **`collect` defaults:** `numberOfRuns` 3; `maxAutodiscoverUrls` 5 ("Disable this limit by setting to 0"); `staticDirFileDiscoveryDepth` 2; `startServerReadyPattern` `"listen|ready"`; `startServerReadyTimeout` 10000 ms, after which it continues anyway; `--additive` keeps `.lighthouseci/`; `--headful` (ignored with `puppeteerScript`).
- **Chrome,** in order: the `chromePath` option, `CHROME_PATH`, the `puppeteer` or `puppeteer-core` executable if installed, then `chrome-launcher`'s highest-priority install.
- **`collect.settings`** passes Lighthouse flags, except the ones LHCI owns (`port`, `auditMode`, `gatherMode`, `output`, `outputPath`, `channel`, `cli-flags-path`). Examples: `skipAudits`, `disableStorageReset: true`, `maxWaitForLoad: 90000`, `throttlingMethod: "devtools"` ("applied throttling instead of simulated"), `"preset": "desktop"`, `chromeFlags`.
- **`method: "psi"`** runs PageSpeed Insights instead: "**only sites publicly available over the internet can be tested** and **no other collection options will be respected**"; it needs `psiApiKey`, and `psiStrategy` is `mobile` (default) or `desktop`.

## Running Lighthouse from Node

Without LHCI, Lighthouse's variability doc runs the CLI several times and takes the median with `computeMedianRun`, "using a blend of the performance metrics" [Lighthouse, docs/variability.md]:

```js
const spawnSync = require('child_process').spawnSync;
const lighthouseCli = require.resolve('lighthouse/cli');
const {computeMedianRun} = require('lighthouse/core/lib/median-run.js');

const results = [];
for (let i = 0; i < 5; i++) {
  console.log(`Running Lighthouse attempt #${i + 1}...`);
  const {status = -1, stdout} = spawnSync('node', [
    lighthouseCli,
    'https://example.com',
    '--output=json'
  ]);
  if (status !== 0) {
    console.log('Lighthouse failed, skipping run...');
    continue;
  }
  results.push(JSON.parse(stdout));
}

const median = computeMedianRun(results);
console.log('Median performance score was', median.categories.performance.score * 100);
```

Audit Kit's one-run version [audit-kit, src/lighthouse.ts]: `chrome-launcher` with `--headless --disable-gpu`, then `lighthouse(url, { port, output: "json", onlyCategories: ["performance","accessibility","best-practices","seo"] })`, killing Chrome in `finally`. It finds the browser through its config, `AUDITKIT_BROWSER_PATH`, `CHROME_PATH`, then the macOS app paths, and rewrites "No Chrome installations found" into a hint. One run is a look, not a measurement.

## Pages behind login

[lighthouse-ci, configuration.md#puppeteerscript, #page-behind-authentication]

- **`puppeteerScript`:** a module exporting `async (browser, context) => {...}` that logs in and closes its page. LHCI runs it once per URL, before that URL's runs; "the browser is kept open across all URLs, so if you're keeping auth in cookies then everything should be remembered between runs." For `localStorage` auth add `--settings.disableStorageReset`. Install `puppeteer` yourself. The docs' example types `'admin'` and `'password'` literally; read credentials from the environment instead, as for any test ([e2e-testing](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/e2e-testing/SKILL.md)).
- **A cookie without a script:** `"settings": {"extraHeaders": "{\"Cookie\": \"token=1234\"}"}`, or in JS `extraHeaders: JSON.stringify({Cookie: 'token=1234'})`.

## Variance

- **Run it several times and gate on an aggregate.** "LHCI runs 3 by default, use the `--collect.numberOfRuns=X`" [lighthouse-ci, troubleshooting.md]. Lighthouse: "use aggregate values like the median, 90th percentile, or even min/max instead of single test results", and "The median Lighthouse score of 5 runs is twice as stable as 1 run." [Lighthouse, docs/variability.md]
- **Hardware.** Lighthouse's minimums: "Minimum 2 dedicated cores (4 recommended)", "Minimum 2GB RAM (4-8GB recommended)" [Lighthouse, docs/variability.md]. LHCI's troubleshooting asks for "a minimum of 2 cores and 4GB of RAM"; Lighthouse's doc is the official one. "avoid underpowered CI systems like Appveyor and burstable instances" [lighthouse-ci]. This is the "fixed, dedicated machines" rule of [performance-and-caching MEASURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/MEASURE.md#an-optimization-loop-run-by-you-or-by-an-agent) applied to Lighthouse.
- **One run per machine at a time.** "**DO NOT** collect multiple Lighthouse reports at the same time on the same machine", and "scaling horizontally is better than scaling vertically (i.e. run with 4 `n2-standard-2` instead of 1 `n2-standard-8`)" [Lighthouse, docs/variability.md].
- **Remove what varies** [lighthouse-ci, troubleshooting.md]: "Eliminate non-determinism (remove random `setTimeout` calls, A/B tests, etc)"; "Avoid external dependencies (disable variable third-party integrations like ads, YouTube embeds, analytics, etc)".
- **Assert facts over conclusions:** "start with assertions on the number and size of your JavaScript requests rather than the value of TTI" [lighthouse-ci, troubleshooting.md]. Counts and sizes are stable where milliseconds wobble ([performance-and-caching MEASURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/MEASURE.md#deterministic-counts-and-ratchets)).
- **When two environments disagree,** check in turn [lighthouse-ci, troubleshooting.md]: form factor; throttling ("desktop in Chrome DevTools/PSI doesn't *only* change the form factor, it changes throttling too"); storage clearing; login state; headless vs headful; hardware ("free CI providers tend to have very underpowered CPUs"); location. "The team does not have the bandwidth to assist with debugging this problem."
- **The default aggregation reads the best run, not the slow end.** LHCI's default `aggregationMethod` is `optimistic` (assertions.js), "the value that is most likely to pass". MEASURE.md asks to look at the slow end; pick `median` or `pessimistic` when that is the question ([Assertions](#assertions)).

## Assertions

[lighthouse-ci, configuration.md#assertions; packages/utils/src/assertions.js]

- **Format:** keyed by audit id, eslint-style `level` or `[level, options]`. `off`: "If an audit is not found in the `assertions` object, it is assumed to be `off`". `warn`: printed to stderr, exit code unchanged. `error`: non-zero exit.
- **Options map to audit fields:** `minScore` to `score`, `maxLength` to `details.items.length`, `maxNumericValue` to `numericValue`. A manual `maxLength` or `maxNumericValue` drops the automatic `minScore`.
- **A level with no options asserts `minScore` 0.9** (assertions.js:208: `const realMinScore = minScore === undefined && !hadManualAssertion ? 0.9 : minScore;`). The docs say the default is `{"aggregationMethod": "optimistic", "minScore": 1}`; the code wins. So `lighthouse:all`, described as "Asserts that every audit received a perfect score", in fact asserts 0.9 or better on each `['error', {}]` row.
- **Aggregation over runs:** `median`; `optimistic` ("the value that is most likely to pass"); `pessimistic` ("least likely to pass"); `median-run` ("the run that was determined to be 'most representative' ... based on key performance metrics", which differs from `median` for audits that aren't those metrics).
- **Category scores:** `"categories:performance": ["warn", {"minScore": 0.9}]`; "this just affects the _category score_ and will not affect any assertions on individual audits".
- **User Timings:** `"user-timings:<kebab-cased-name>": ["<level>", {maxNumericValue: <ms>}]` for `performance.mark` and `measure`; "only the first matching entry with the name will be used from each run". This gates the journey marks MEASURE.md asks for.
- **Per-URL rules:** `assertMatrix` entries with a `matchingUrlPattern` regex (`".*"` for every page, `"https://[^/]+/app"` for the app), so a landing page and the app can have different budgets.
- **Budgets as assertions:** `resource-summary:<resourceType>:(size|count)`, for example `"resource-summary:document:size": ["error", {"maxNumericValue": 14000}]`, `"resource-summary:font:count": ["warn", {"maxNumericValue": 1}]`, `"resource-summary:third-party:count": ["warn", {"maxNumericValue": 5}]`. "the `maxNumericValue` unit for file size is in _bytes_ while the budget.json unit for file size is in _kilobytes_". Use these, not `budgetsFile`, `budgetPath` or the `performance-budget` audit: Lighthouse 12.0 removed budgets, and `performance-budget` is absent from 12.6.1, the version LHCI bundles. `resource-summary` exists in 12 and 13.
- **Presets** (extend them with `assertions`, for example `"dom-size": ["error", {"maxNumericValue": 3000}]`): `lighthouse:all` is "extremely difficult ... Only use as a base on very high quality, greenfield projects"; `lighthouse:recommended` is "a more realistic base that disables hard failures for flaky audits". `lighthouse:no-pwa` is obsolete: the PWA category is gone since Lighthouse 12, and the preset's own file says `// TODO: PWA doesn't exist anymore, so remove?`; it only turns off `is-on-https`, `viewport` and `viewport-insight`. `--includePassedAssertions` prints passes too.
- **The method inside `lighthouse:recommended`** (packages/utils/src/presets/recommended.js, Lighthouse 12 ids): metric audits only warn, because they are flaky (`first-contentful-paint`, `largest-contentful-paint`, `cumulative-layout-shift`, `speed-index`, `interactive`, `bootup-time`, `mainthread-work-breakdown`, `max-potential-fid`); opportunity audits **error on `maxLength: 0`**, because the list of offenders is stable when the score wobbles (`unused-javascript`, `unused-css-rules`, `unminified-javascript`, `unminified-css`, `uses-text-compression`, `uses-responsive-images`, `uses-optimized-images`, `uses-rel-preconnect`, `offscreen-images`, `efficient-animated-content`); dev-server-only audits are off (`uses-http2`, `modern-http-insight`, "not useful for the dev server"), and `long-tasks` and `forced-reflow-insight` are off as "too strict". `duplicated-javascript` and `legacy-javascript` warn "until https://github.com/GoogleChrome/lighthouse/issues/11285 is fixed".

The failure output to read, verbatim [lighthouse-ci, getting-started.md]:

```text
  ✘  uses-rel-preconnect failure for maxLength assertion
       Preconnect to required origins
       https://web.dev/uses-rel-preconnect

        expected: <=0
           found: 1
      all values: 1, 1
```

## Upload, tokens and status checks

[lighthouse-ci, getting-started.md, configuration.md#target, server.md, troubleshooting.md]

- **Targets:** `temporary-public-storage` (fast and free; reports are "accessible to anyone with the URL", "automatically deleted after a few days", "stored on GCP Cloud Storage", with "access to individual reports, but not historical data, report diffing, or build failures"); `lhci` (your own server: longer history, access control); `filesystem` ("process the raw Lighthouse results yourself"). Read `docs/services-disclaimer.md` (its terms of service and privacy policy) before using public storage or the GitHub App.
- **Upload failures only warn under `autorun`** ("to avoid noisy failures from temporary connectivity loss"); `--failOnUploadFailure` makes them fail.
- **`filesystem` output:** a `manifest.json` with `{url, isRepresentativeRun, htmlPath, jsonPath, summary}` per run (`isRepresentativeRun` is "whether it's the median run"); "Median reports are written to disk last". Read the median the way Lighthouse's variability doc does: `lhciManifest.find(entry => entry.isRepresentativeRun)`.
- **Tokens.** The build token "only allows the _creation_ of data"; on an open-source project collecting from external pull requests, "consider the _build token_ to be public knowledge". Keep it in `LHCI_TOKEN`. The admin token "should only be shared with trusted users and **never placed in the CI environment**": "Anyone with the admin token can delete the entire project's data." A lost build token: `lhci wizard --wizard=reset-build-token`, with direct database access.
- **Fork pull requests:** "Most CI systems prevent secrets from leaking into the environment of untrusted pull requests from forks"; if the server is public anyway, `LHCI_TOKEN` "is an additive-write-only credential that cannot destroy historical data".
- **One upload per commit:** "make sure you only run `lhci autorun` _ONCE_ per build. The Lighthouse CI server will only accept a single upload per hash". To rerun: `git commit --allow-empty -m 'rerun CI' && git push`, or `--ignoreDuplicateBuildFailure` "when you don't run Lighthouse CI as the last step of your CI process or reruns are common".
- **URLs that change per build** (ports, UUIDs, hashes): `urlReplacementPatterns`, default `["s#:[0-9]{3,5}/#:PORT/#","s/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/UUID/ig"]`; "There is no escape support for the delimiter", and "If you set `urlReplacementPatterns` yourself, you will lose the defaults".
- **Build context** where git or the CI isn't detected: `LHCI_BUILD_CONTEXT__GIT_REMOTE`, `__GITHUB_REPO_SLUG`, `__CURRENT_HASH`, `__ANCESTOR_HASH`, `__COMMIT_TIME`, `__CURRENT_BRANCH`, `__COMMIT_MESSAGE`, `__AUTHOR`, `__AVATAR_URL`, `__EXTERNAL_BUILD_URL` (Cloud Build needs `LHCI_BUILD_CONTEXT__CURRENT_BRANCH=$BRANCH_NAME`).
- **GitHub status checks:** the GitHub App (recommended) gives a token for `LHCI_GITHUB_APP_TOKEN`; the alternative is a personal access token with `repo:status` scope as `LHCI_GITHUB_TOKEN`, and your account posts the check. "Anyone in possession of this token will be able to set status checks on your repository." On GitHub Actions also check out `ref: ${{ github.event.pull_request.head.sha }}`. `githubStatusContextSuffix` renames the check (`-app` gives `lhci-app`); `githubApiHost` for GitHub Enterprise. Status checks "add additional granularity to your build reporting and direct links to uploaded reports within the GitHub UI"; make the check required ([code-review LAYERS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/LAYERS.md#4-automated-checks-that-block)).
- **Community actions,** listed in the README as community projects, not Google's: `treosh/lighthouse-ci-action` ("no infrastructure required") and `adevinta/actions-lighthouseci-compare` (a Markdown diff against the ancestor commit).

## Troubleshooting

[lighthouse-ci, troubleshooting.md, getting-started.md, configuration.md#healthcheck]

- **First:** "make sure you're using `lhci autorun` or invoking `lhci healthcheck --fatal`"; opt-in checks with `lhci healthcheck --fatal --checks=githubToken`. `lhci open` opens a local report from `collect`.
- **Chrome failures:** "Missing Chrome"; "Protocol Error: X.Y wasn't found" (Chrome too old for this Lighthouse: "try updating your `puppeteer` version first"); "No usable sandbox": "try creating a Chrome usergroup or running with `--no-sandbox` ... If running in a docker container, ensure the container has SYS_ADMIN privileges". The GitLab and Cloud Build examples pass `--no-sandbox` and point to the docker recipe's security tradeoffs: a tradeoff to choose, not a default.
- **"Ancestor hash not determinable" on GitHub Actions:** the checkout fetches one commit, so the base is missing. The docs' fix is `fetch-depth: 20` on `actions/checkout` plus `git fetch --depth=1 origin +refs/heads/${{github.base_ref}}:refs/remotes/origin/${{github.base_ref}}` ("The fetch depth set to 20 is a good default, but might not work in all cases"); on Travis, `git: depth: 20` or `depth: false`. The code-review skill's form for an agent's review is deepen-and-retry ([code-review CHANGE-SCOPE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/CHANGE-SCOPE.md#awkward-repository-states)).
- **Bigger machines are steadier:** "The bigger the machine the more stable the performance results will be"; the Cloud Build example uses `machineType: 'N1_HIGHCPU_8'` and `lhci autorun --failOnUploadFailure`, with a pricing warning.
- **A step that can't fail isn't a gate.** The docs' GitLab example ends `lhci autorun ... || echo "LHCI failed!"`, which always exits 0. Drop the `|| echo` when the step is a required check.

## The LHCI server

[lighthouse-ci, server.md, configuration.md#server, getting-started.md]

- **Requirements:** Node, and a persistent disk or a Postgres or MySQL connection. `npm install @lhci/server sqlite3`, then `createServer({port: process.env.PORT, storage: {storageMethod: 'sql', sqlDialect: 'sqlite', sqlDatabasePath: '/path/to/db.sql'}})`. To try it locally: `npx lhci server --storage.storageMethod=sql --storage.sqlDialect=sqlite --storage.sqlDatabasePath=./db.sql`. Docker: `docker volume create lhci-data`, then `docker container run --publish 9001:9001 --mount='source=lhci-data,target=/data' --detach patrickhulce/lhci-server`. "LHCI really needs to own the entire origin"; a subpath needs the proxy recipe. Default port 9001.
- **It is open by default:** "Anyone with HTTP access can _view_ and _create_ data". Close it with HTTP Basic auth (`lhci server --basicAuth.username=... --basicAuth.password=...`, and `--upload.basicAuth.*` on upload), your own Express middleware in front of `lhci.createApp(...)` (Fastify needs `useBodyParser: false` and `reply.hijack()`), or firewall rules ("Don't forget to allow your CI machines!"). The docs put a basic-auth password in config literally; read it from the environment.
- **Storage:** `sqlDialect` `sqlite` (default, "sufficient for most use cases"), `postgres` or `mysql`; `sqlConnectionUrl` `<dialect>://<user>:<password>@<host>:<port>/<database>`; SSL through `sqlConnectionSsl` and `sqlDialectOptions.ssl`; `sqlMigrationOptions.tableName` (default `SequelizeMeta`). `storage.sqlDangerouslyResetDatabase` "will delete all data in the database". Running Postgres itself: the `postgres` skill.
- **Scheduled runs of production,** `psiCollectCron`: per site `urls` ("must be publicly accessible"), a cron `schedule`, `projectSlug` (`curl http://localhost:9001/v1/projects | jq '.[] |.name,.slug'`), `numberOfRuns` (default 5), `branch`, `maxNumberOfParallelUrls` (default `Infinity`), `categories` (default performance, accessibility, best-practices, seo) and `strategy` (default `mobile`). This is still lab data, taken of production; field data is [performance-and-caching VERCEL-METRICS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/VERCEL-METRICS.md).
- **Retention,** `deleteOldBuildsCron`: `schedule`, `maxAgeInDays`, `onlyBranches`, `skipBranches`; "only works when `storage.storageMethod` is set `sql`".
- **`lhci wizard`:** `new-project` prints the build and admin tokens; `reset-build-token` and `reset-admin-token` need a server config and database write access. "The `wizard` options will be overwritten by the `upload` options": keep a separate config file for it.

## The Agentic Browsing category

Lighthouse's main branch (default-config.js, read 2026-10-18) defines an `agentic-browsing` category: "These checks ensure high-quality, browsable websites for AI agents and validate the correctness of WebMCP integrations. This category is still under development and subject to change." It is scored as a fraction (`categoryScoreDisplayMode: 'fraction'`), in navigation and snapshot modes, with audits `agent-accessibility-tree`, `webmcp-form-coverage`, `webmcp-registered-tools`, `webmcp-schema-validity`, `cumulative-layout-shift`, `llms-txt` and `ard-schema`. What the `llms-txt` audit flags is in [ai-search-visibility LLMS-TXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ai-search-visibility/LLMS-TXT.md#lighthouses-check).

- Which released Lighthouse ships it was not verified; LHCI 0.15.1 bundles 12.6.1, which doesn't. Before gating on these ids, confirm them in the report your pinned version produces (`"<id>" is not a known audit.` otherwise).
- What each audit means for a site: [ai-search-visibility AGENT-READINESS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ai-search-visibility/AGENT-READINESS.md#lighthouses-agentic-browsing-audits); the WebMCP ones beside the tool tests: [webmcp VALIDATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-automation/webmcp/VALIDATION.md#lighthouses-webmcp-audits).

## Prove it

The workflow pins its actions and `@lhci/cli` exactly and runs `lhci autorun` once per commit, with no `|| echo`. A deliberately added unused script makes the required check fail with an `unused-javascript` `maxLength` line, and removing it turns the check green. Every asserted id appears in the report from the pinned Lighthouse version. Five runs on a dedicated runner give the same set of failing audits twice in a row; the gate on milliseconds, if any, reads `median` or `pessimistic`, not the default `optimistic`. The admin token is nowhere in CI, and no report went to public storage unless that was chosen.
