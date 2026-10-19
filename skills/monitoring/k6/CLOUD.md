# Grafana Cloud k6

Grafana Cloud k6 runs your script on its load generators, keeps the runs, and exposes them through the UI, the `gcx` CLI and a REST API. Run load tests before a release, stress tests to find limits and regression tests in CI here; always-on uptime and scheduled API health checks belong to Synthetic Monitoring ([grafana SYNTHETIC-MONITORING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/grafana/SYNTHETIC-MONITORING.md)). Most cloud mistakes are API mechanics: the doubled `cloud/cloud/` proxy path, list endpoints that return the oldest rows, PATCH bodies that silently drop fields, and script edits that weren't verified. Reading runs (logs, metrics, traces, screenshots, Insights) and investigating them is [CLOUD-RESULTS.md](CLOUD-RESULTS.md).

**Contents:** [Running in the cloud](#running-in-the-cloud) · [Automation](#automation) · [Authentication](#authentication) · [Calling the API through gcx](#calling-the-api-through-gcx) · [Listing and pagination](#listing-and-pagination) · [Managing tests, runs and schedules](#managing-tests-runs-and-schedules) · [Editing a cloud script safely](#editing-a-cloud-script-safely) · [Gotchas](#gotchas) · [Prove it](#prove-it)

## Running in the cloud

- **`options.cloud`:**

```javascript
  cloud: {
    projectID: 1234567,                    // replace with your project ID
    name: 'QuickPizza Cloud Load Test',
    distribution: {
      'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 60 },
      'amazon:eu:dublin':  { loadZone: 'amazon:eu:dublin',  percent: 40 },
    },
  },
```

  Percentages must sum to 100. `projectID` is required (from app.k6.io, project settings). The testing skill's example also sets `note: 'Testing new checkout flow'` and `staticIPs: false` (static IPs are Enterprise) and names its distribution keys `loadZone1` to `loadZone4` (`loadZone1: { loadZone: 'amazon:us:ashburn', percent: 40 }`). `options.ext.loadimpact` was removed in v2.0.0: move its fields to `options.cloud` ([k6 release notes v2.0.0](https://github.com/grafana/k6/blob/master/release%20notes/v2.0.0.md)). The warning `The options.ext.loadimpact option is deprecated, please use options.cloud instead` appears only on k6 v1.x; this line used to call the option merely deprecated.
- **Load zones:**

| Region | Zone IDs |
|---|---|
| Americas | `amazon:us:ashburn`, `amazon:us:columbus`, `amazon:us:portland`, `amazon:us:montreal`, `amazon:sa:sao paulo` |
| Europe | `amazon:eu:dublin`, `amazon:eu:frankfurt`, `amazon:eu:london`, `amazon:eu:paris`, `amazon:eu:stockholm`, `amazon:eu:milan` |
| Asia Pacific, Middle East, Africa | `amazon:ap:singapore`, `amazon:ap:sydney`, `amazon:ap:tokyo`, `amazon:ap:mumbai`, `amazon:ap:seoul`, `amazon:ap:hong kong`, `amazon:ap:osaka`, `amazon:ap:jakarta`, `amazon:ap:cape town`, `amazon:me:bahrain` |

  A real run in the investigation example shows London as `amazon:gb:london`, not `amazon:eu:london`, and the v2.2.0 release notes' sample output of `k6 cloud load-zone list` shows `amazon:sa:cape town`, not `amazon:ap:cape town`. On k6 v2.2+ list the IDs your stack serves with `k6 cloud load-zone list [--json]` ([k6 release notes v2.2.0](https://github.com/grafana/k6/blob/master/release%20notes/v2.2.0.md)); otherwise confirm them in the current docs or the cloud UI.
- **Use `k6 cloud run script.js`:** the positional `k6 cloud script.js` form was removed in v2.0.0, and from v2.2.0 `k6 cloud --vus 10 script.js` fails with `unknown flag` and a non-zero exit ([k6 release notes v2.0.0](https://github.com/grafana/k6/blob/master/release%20notes/v2.0.0.md), [v2.2.0](https://github.com/grafana/k6/blob/master/release%20notes/v2.2.0.md)). This used to be a dispute between sources; the testing skill's `k6 cloud script.js` is the removed form. `k6 run --out cloud script.js` (local execution streaming to the cloud) stays on the legacy cloud API, while `k6 cloud run --local-execution` moved to the v6 API in v2.2.0.
- **`--local-execution`** is described both as "runs the test on your machine but streams results to Grafana Cloud" and as "run on cloud infra but with local VUs"; the v2.0.0 notes describe it as local execution that can read cloud secrets. From v2.2.0 it streams logs to the cloud run (opt out with `--no-cloud-logs`), and from v2.0.0 cloud secrets are available by default (opt out with `--no-cloud-secrets`, [Secrets](SCRIPTS.md#secrets)).
- **A stack is required for every `k6 cloud` command** (v2.0.0+): `k6 cloud login` needs both `--token` and `--stack`, or set `K6_CLOUD_STACK_ID`, or the `stackID` script option. A token alone fails with an explicit error ([k6 release notes v2.0.0](https://github.com/grafana/k6/blob/master/release%20notes/v2.0.0.md)).
- **Cloud CLI commands on v2:** `k6 cloud upload script.js` uploads without running (it replaced the removed `--upload-only`); `k6 cloud project list [--format=json]` (v2.0); `k6 cloud test list [--project-id N] [--json]` (v2.1), resolving the project from `--project-id`, then `K6_CLOUD_PROJECT_ID`, then the stack default from `k6 cloud login`; `k6 cloud load-zone list [--json]` (v2.2). Versions: [VERSIONS.md](VERSIONS.md).
- **More CLI from the testing skill:** `export K6_CLOUD_TOKEN=<token>` (plus `K6_CLOUD_STACK_ID` on v2), `k6 cloud login --show`, `k6 cloud -e API_URL=https://api.example.com script.js`, `k6 cloud --project-id 123456 script.js`, `k6 cloud --results-id {runId}`, `k6 cloud --results-export results.json`. These are written in the removed positional form: add `run` before the script and check `k6 cloud run --help` for which flags remain.
- **Log in from a gcx context:**

```bash
TOKEN=$(gcx --context <ctx> k6 auth token)
STACK=$(gcx --context <ctx> config view --minify -o json | jq -r '.contexts[].grafana.server')
k6 cloud login --token "$TOKEN" --stack "$STACK"
k6 cloud run script.js
```

  gcx auth does not carry over to `k6 cloud run`. The token comes from `gcx k6 auth token`, the stack URL from the active context's `grafana.server` field. The k6 cloud config `~/.config/k6/cloud.json` holds one context; log in again when you switch gcx contexts, or `k6 cloud run` keeps targeting the previous stack.
- **Validate locally first:** `k6 run --vus 1 --duration 30s script.js` costs no cloud time. The management skill's local checks are `k6 inspect script.js | head -20` (parse-only) and `k6 run --quiet script.js`. Exit codes: `0` pass, `99` threshold fail, `97` a cloud run aborted by system, limit, script error, user or timeout (v2.0.0+; these exited `0` before), anything else a script or runtime error ([LOAD-AND-THRESHOLDS.md](LOAD-AND-THRESHOLDS.md#exit-codes)).
- **Docs:** `https://grafana.com/docs/grafana-cloud/testing/k6/`.
- **The UI:** tabs Performance Overview, Checks, Thresholds, Logs (`console.log`), Comparison. Authoring tools: k6 Studio (desktop GUI), the browser recorder (Chrome extension), the test builder (Cloud UI), the k6 TypeScript template.

## Automation

Use the documented standalone cloud login/run commands and exit-code contract in [LOAD-AND-THRESHOLDS.md](LOAD-AND-THRESHOLDS.md#exit-codes). Keep larger tests outside automatic deployment pipelines. GitHub Actions, PR-comment inputs and branch-specific lifecycle recipes from the sources are excluded by the owner. [existing CLOUD.md; owner GitHub lifecycle exclusion]

## Authentication

- **gcx:** `gcx login --context <ctx>` (one-time OAuth in the browser); `gcx --context <ctx> config check` should print `✔ Connectivity: online`. An expired token returns 401 `Invalid or expired token` with a prompt to run gcx login to refresh; run `gcx login --context <ctx>` again. gcx needs Grafana Cloud or Grafana OSS/Enterprise v12+; its experimental commands may change without semver.
- **gcx injects auth.** The only header you set by hand is `X-K6TestRun-Id` (Loki logs, screenshot and file fetches, Tempo traces). `gcx k6 auth token` prints the k6 API token.
- **Without gcx** (`command -v gcx` finds nothing): send `Authorization: Bearer <k6_token>` and `X-Stack-ID: <int>` on every call. REST (`/cloud/v6/...`, `/cloud/v5/...`, `/cloud-resources/v1/...`, `/insights/...`) goes to `https://api.k6.io`; logs (Loki) and traces (Tempo) go to `https://cloudlogs.k6.io`. Drop the `/api/plugins/k6-app/resources/{cloud,logs,insights}` prefix, and the doubled `cloud/cloud/` collapses to one `/cloud/`. Have the user authenticate or configure the token locally through an authorized credential flow; never request bearer text in chat. Resolve the stack from that configuration rather than guessing it. [existing Grafana ADMIN-AND-AI.md, token handling] The token is the long-lived bearer that `gcx k6 auth token` would print; the stack is either the integer stack ID or a stack URL (for example `https://myorg.grafana.net`).
- **Resolve a stack URL to its ID** once, and cache it for the session:

```bash
STACK_ID=$(curl -sS https://api.k6.io/cloud/v6/auth \
  -H "Authorization: Bearer $K6_TOKEN" \
  -H "X-Stack-Url: $STACK_URL" \
  | jq -r '.stack_id')
```

  It returns `{stack_id, default_project_id}`; `/cloud/v6/auth` is the only endpoint that takes `X-Stack-Url` instead of `X-Stack-ID`.
- **Translating gcx calls to curl:** `gcx api /api/plugins/k6-app/resources/cloud/cloud/v6/test_runs/123` becomes `curl https://api.k6.io/cloud/v6/test_runs/123`; `.../cloud/cloud-resources/v1/files/index` becomes `https://api.k6.io/cloud-resources/v1/files/index`; `.../insights/insights/api/v1/testrun/<id>/executions` becomes `https://api.k6.io/insights/api/v1/testrun/<id>/executions`; `.../logs/api/v1/query_range?...` and `.../logs/api/v1/tempo/api/search?...` go to `https://cloudlogs.k6.io/api/v1/...`. Send `-H "Authorization: Bearer $K6_TOKEN" -H "X-Stack-ID: $STACK_ID"` on each, plus `X-K6TestRun-Id` on log, trace and files endpoints. The `gcx api` quirks below don't apply to curl: use `-o file`, `--data-binary @file` for PUT payloads and `-w '%{http_code}'`. Pagination (`$orderby`, `$top`, `$skip`, `@nextLink`) works the same over curl.
- **An older API exists:** the testing skill documents `https://api.k6.io/v3` with `Authorization: Token <token>` (`/projects`, `/projects/{projectId}/test-runs`, `/runs/{runId}`, `/runs/{runId}/metrics`, `POST /runs/{runId}/stop`, `POST /projects/{projectId}/schedules` with `{"name","script_id","cron":"0 2 * * *","timezone":"UTC"}`). The management skill uses `/cloud/v6` and `/cloud/v5` with Bearer and `X-Stack-ID`, aborting at `POST /cloud/v6/test_runs/{id}/abort`. Confirm which one your stack serves in the current API reference.

## Calling the API through gcx

- **Prefer subcommands:** discover them with `gcx help-tree k6` and `gcx help-tree k6 <subcommand>`; use `gcx api` only when none exists. Learn the URLs a command calls with `-vvv --log-http-payload` on non-mutating commands.
- **Proxy paths:** REST `/api/plugins/k6-app/resources/cloud/cloud/v6/...` (the doubled `cloud/cloud/` is real: the first is the proxy route, the second the k6 namespace); logs `/api/plugins/k6-app/resources/logs/<loki-path>`; Insights `/api/plugins/k6-app/resources/insights/insights/api/v1/...`; files `/api/plugins/k6-app/resources/cloud/cloud-resources/v1/files/...`.
- **`gcx api` behaviour:** the body goes to stdout; `-o` picks the output format (`json`, `yaml`, `agents`), not a file. Request bodies: `-d <string>`, `-d @file`, `-d @-` (no `--data-binary`). `--json field1,field2` selects fields, `--json list` or `--json '?'` discovers them. A `hint:` line goes to stderr (use `2>/dev/null` before jq). Response headers aren't exposed (use `file <path>` on the body). `-vvv` and `--log-http-payload` trace requests.
- **Large responses spill to a temp file:** stdout becomes `{"spilled_to":"...","bytes":...,"preview_sample":[...],"message":"Response too large for stdout..."}` (the threshold is a few tens of KB, so even moderately sized list endpoints trigger it). A naive `json.loads(stdout).get('value', [])` then silently returns empty, because the envelope has no `value` key. Pass `-o json` to force inline (recommended for scripts that parse the body; the agent-mode default formatting triggers the spill), or detect the envelope:

```python
d = json.loads(stdout)
if 'spilled_to' in d:
    d = json.load(open(d['spilled_to']))
```

- **The plugin proxy rewrites `Content-Type: multipart/...` to `application/json`,** so multipart endpoints (notably `POST /cloud/v6/projects/{id}/load_tests` with `name` and `script` parts) return `HTTP 415 "Unsupported media type \"application/json\""`. Use direct curl against api.k6.io: `curl -F name=... -F script=@...`. `application/octet-stream` passes through unchanged.
- **Fetch the OpenAPI spec once per session:** `gcx api /api/plugins/k6-app/resources/cloud/cloud/v6/openapi > /tmp/k6-openapi.json`; index it with jq by `operationId` and `description`, and resolve `$ref` through `.components.schemas.Foo`.

## Listing and pagination

- **List defaults:** order by `created` descending (newest first) and page by 20, through whatever parameter names the operation's OpenAPI schema exposes. Names vary (`ordering=-created`, `order_by=created.desc`, `sort=-created`, `limit=20`, `page_size=20`), so read the spec.
- **v6 lists cap at 1000 rows** (the default `$top`) and return `@nextLink`. OData params: `$orderby` (`<field> <direction>`, default ascending), `$top`, `$skip`, `$count`.
- **`gcx k6 runs list --limit 0` does not follow `@nextLink` and sorts ascending,** so past 1000 runs it returns the oldest 1000. Request `?%24orderby=created%20desc&%24top=1000` and loop on `@nextLink`, reshaping its absolute `api.k6.io` URL into the proxy prefix (in curl mode pass it back unchanged):

```python
import json, subprocess, urllib.parse

CTX = "<stack>"
TEST_ID = "<test_id>"
PROXY = "/api/plugins/k6-app/resources/cloud"

all_runs = []
# Start with newest first; -o json keeps the body inline for clean json.loads().
path = (
    f"{PROXY}/cloud/v6/load_tests/{TEST_ID}/test_runs"
    "?%24orderby=created%20desc&%24top=1000"
)
while path:
    r = subprocess.run(["gcx", "--context", CTX, "api", path, "-o", "json"],
                       capture_output=True, text=True, timeout=60)
    d = json.loads(r.stdout)
    all_runs.extend(d.get("value", []))
    nxt = d.get("@nextLink")
    if not nxt:
        path = None
        continue
    # @nextLink comes back as an absolute http://api.k6.io/... URL with
    # OData params already encoded ($skip, $top, $orderby). Reshape its
    # path+query into the plugin-proxy prefix:
    p = urllib.parse.urlparse(nxt)
    path = f"{PROXY}{p.path}" + (f"?{p.query}" if p.query else "")
```

  The same loop works for any v6 list endpoint that returns `@nextLink`. If you only need the newest items, stop after the first page: with `created desc` it already holds the newest 1000.

- **`gcx k6 load-tests list --project-id <id>` accepts the flag but doesn't filter.** List a project's tests with `GET /cloud/v6/projects/{id}/load_tests`, or jq `select(.project_id == X)`.

## Managing tests, runs and schedules

- **Subcommands named in the sources:** `gcx k6 load-tests get <test_id> -o json`; `gcx k6 load-tests update -f`; `gcx k6 load-tests update-script` (a write that replaces the live script: never run it "to see the URL"); `gcx k6 load-tests list --project-id <id>`; `gcx k6 runs list --limit 0`; `gcx k6 tests list`; `gcx k6 schedules delete <load-test-id>`; `gcx k6 auth token`.

| Endpoint | Does |
|---|---|
| `GET /cloud/v6/test_runs/{id}` | A run; read `.test_id` to get its test |
| `GET /cloud/v6/load_tests/{id}/test_runs` | A test's runs |
| `GET /cloud/v6/projects/{id}/load_tests` | A project's tests |
| `PUT /cloud/v6/load_tests/{id}/move` body `{"project_id": <int>}` | Moves the test with its runs, history and schedule; success is HTTP 204, empty body |
| `POST /cloud/v6/load_tests/{id}/start` body `{}` (or run options) | Starts a run; accepts no runtime overrides, so the saved test always runs as defined, for its full duration |
| `POST /cloud/v6/test_runs/{id}/abort` (empty) | Aborts a run |
| `POST /cloud/v6/load_tests/{id}/schedule` | Schedules it (`recurrence_rule` or cron) |
| `POST /cloud/v6/schedules/{id}/deactivate`, `/activate` | Pauses or resumes a schedule |
| `POST /cloud/v6/projects/{id}/load_tests` | Creates a test (multipart `name` plus `script`; use direct curl) |
| `POST /cloud/v6/test_runs/{id}/save`, `/unsave` | Keeps a run past retention, or releases it |

- **PATCH through `update -f` accepts almost nothing:** a load test takes only `name` and `baseline_test_run_id` (`PatchLoadTestApiModel`), a project only `name` (`PatchProjectApiModel`). Both are `additionalProperties: false`, so other fields are silently dropped while gcx prints `✔ Updated`. `project_id`, `is_default` and `grafana_folder_uid` can't be changed this way (move a test with `/move`). Cross-check the operation's request schema in the OpenAPI spec before assuming a field is mutable.
- **Move a test between projects:**

```bash
gcx api /api/plugins/k6-app/resources/cloud/cloud/v6/load_tests/<test_id>/move \
  -X PUT \
  -H "Content-Type: application/json" \
  -d '{"project_id": <new_project_id>}'

# Verify: re-GET and check project_id reflects the new value.
# Do not trust the absence of an error from the PUT; HTTP 204 with
# empty body is the success shape but gcx api prints nothing.
gcx --context <ctx> k6 load-tests get <test_id> -o json | jq '{id, name, project_id}'
```

  The OpenAPI description: "Move a load test to a different project of the same organization. All respective test runs will be also moved to the new project." The schedule follows too (it's keyed by `load_test_id`, not by project).
- **Verify every mutation:** gcx confirms success even when the underlying call no-ops. Note what you expected to change (field, count, status), re-GET the resource and confirm it, and if it didn't change, check whether the mutation needs a dedicated endpoint rather than `update -f`.
- **Poll a started run** with `GET /cloud/v6/test_runs/{id}` until `status` is `completed` or `aborted`. `status: completed` with `result: error` is a configuration or infrastructure failure. On anything but `passed`, fetch the logs right away ([CLOUD-RESULTS.md](CLOUD-RESULTS.md#logs)).
- **Cascades:** deleting a load test deletes its schedule at once (it's gone from `/cloud/v6/schedules` and `/cloud/v6/load_tests/{id}/schedule`), so there's no need to `gcx k6 schedules delete <load-test-id>` first. Deleting a project with a running test fails with HTTP 409 ("Cannot delete project with a running test."); non-running tests appear to be removed with the project, so inventory it first with `GET /cloud/v6/projects/{id}/load_tests`.

## Editing a cloud script safely

- **Two script endpoints:** `/cloud/v6/load_tests/<test_id>/script` is the current, mutable script (PUT); `/cloud/v6/test_runs/<run_id>/script` is the snapshot bundled into a run (GET only). They drift after edits, so investigate a past run with its snapshot. For run-vs-run diffs ("did the script change between the last passing and first failing run?"), GET both runs' `/test_runs/<id>/script` and diff them locally.
- **The body is one JS/TS file or a k6 tar archive** (plain or gzipped, a multi-file bundle of entry script, imported modules and assets). `gcx api` doesn't expose response headers, so detect the shape from the body:

```bash
gcx api /api/plugins/k6-app/resources/cloud/cloud/v6/load_tests/$ID/script \
  > /tmp/script_body
file /tmp/script_body
# Expected output (examples):
#   ASCII text          → js/ts source
#   POSIX tar archive   → k6 tar bundle
#   gzip compressed data → gzipped tar bundle
```

  To edit an archive, extract the JS, edit it and rebuild with `k6 archive`:

```bash
# Edit a k6 tar archive
tar -xf /tmp/script_body -C /tmp/extracted/   # extract
# ... edit the JS file ...
k6 archive /tmp/edited_script.js -O /tmp/new_archive.tar  # rebuild
```

  Never repack with `tar`: the archive's `metadata.json` holds parsed options (projectID, thresholds, scenarios) that `k6 archive` regenerates from the source, and stale metadata causes runtime errors such as a projectID mismatch.
- **Read before you write:** GET before any PUT, and keep a backup. The PUT body is the raw script or archive bytes (`application/octet-stream`); gcx forwards it to k6 unchanged.

```bash
ID="<load_test_id>"

# 1. Pull current script (single-file js/ts case)
gcx api /api/plugins/k6-app/resources/cloud/cloud/v6/load_tests/$ID/script \
  > /tmp/script_current.js

# 2. Backup
cp /tmp/script_current.js /tmp/script_backup_$(date +%s).js

# 3. Edit → /tmp/script_new.js

# 4. Local parse-only sanity check
k6 inspect /tmp/script_new.js | head -20

# 5. 1-iteration smoke: k6 v2.3+ keeps the scenario's function and browser options
k6 run --quiet --once /tmp/script_new.js   # exit 0 = pass, 99 = threshold fail
#    Older k6: edit IN-FILE (--iterations CLI flag breaks browser scenarios)
# sed 's/iterations: [0-9]\+/iterations: 1/' /tmp/script_new.js > /tmp/script_1iter.js
# k6 run --quiet /tmp/script_1iter.js

# 6. PUT: Content-Type must be application/octet-stream
gcx api /api/plugins/k6-app/resources/cloud/cloud/v6/load_tests/$ID/script \
  -X PUT \
  -H "Content-Type: application/octet-stream" \
  -d "@/tmp/script_new.js"

# 7. Verify by re-fetching and comparing sha256: the two hashes MUST match.
#    Do not rely on the `updated` timestamp; it does not bump on script PUT.
gcx api /api/plugins/k6-app/resources/cloud/cloud/v6/load_tests/$ID/script \
  > /tmp/script_verify.js
shasum -a 256 /tmp/script_new.js /tmp/script_verify.js
```

  The `updated` timestamp does not change on a script PUT: verify by sha256. A 415 on the PUT means the `Content-Type: application/octet-stream` header didn't make it through (some shell quoting mistakes drop it); pass `-vvv` to `gcx api` for the request and response trace. Smoke with `--once` on k6 v2.3+ (at most one scenario; `--scenario a,b --once` for several); on older k6 use `sed` on `iterations:`, never `--iterations 1`, which overrides the scenario block and breaks browser scenarios. Which checks a change needs before the PUT is in [MAINTENANCE.md](MAINTENANCE.md#verifying-a-change).

## Gotchas

| Symptom | Cause and fix |
|---|---|
| 401, expired token | `gcx login --context <ctx>` |
| `k6 cloud` errors on a missing stack or token (v2) | `k6 cloud login --token ... --stack ...`, or set `K6_CLOUD_STACK_ID` |
| Cloud run exits `97` | Aborted by system, limit, script error, user or timeout (v2.0.0+); read the run's status and logs |
| 403 or 404 on a right-looking path | The doubled `cloud/cloud/` is missing |
| 415 on script PUT | Add `Content-Type: application/octet-stream` |
| PUT returns 200 but nothing changed | Verify by sha256; `updated` doesn't bump |
| Run `passed` but checks failed | Zero-observation thresholds report as pass, and `check()` alone never fails a run: add `'checks{check:<name>}': ['rate==1.0']` and force an observation in catch blocks with `check(null, {"script completed":()=>false})` ([LOAD-AND-THRESHOLDS.md](LOAD-AND-THRESHOLDS.md#checks-and-the-zero-samples-trap)) |
| Loki returns nothing | Missing `X-K6TestRun-Id` header |
| `runs list --limit 0` returns old rows | Use `$orderby=created desc` and the `@nextLink` loop |
| `update -f` prints `✔ Updated`, no effect | The PATCH schema drops the field; use `/move` for projects |
| `load-tests list --project-id` unfiltered | `GET /cloud/v6/projects/{id}/load_tests`, or jq `select(.project_id == X)` |
| Multipart 415 | Direct curl against api.k6.io |
| 401 in curl mode | Check the Bearer token and `X-Stack-ID` |
| 404 in curl mode on `api.k6.io/api/plugins/...` | Strip the proxy prefix |

## Prove it

- `gcx --context <ctx> config check` prints `✔ Connectivity: online`, and `k6 cloud login` was redone for the current context.
- Any run list you report came from the `@nextLink` loop with `created desc`, and its newest run date matches what the UI shows.
- After every mutation, a re-GET shows the new value; after every script PUT, the two sha256 sums match.
- A backup of the previous cloud script exists on disk before the PUT.
- CI and scripts call `k6 cloud run` (never the positional `k6 cloud script.js`), log in with a token and a stack, and treat exit `97` as a failure.
