# App Store analytics reports and crash triage

Pulling App Store Connect Analytics reports and triaging TestFlight crashes, feedback and performance diagnostics with the `asc` CLI. Analytics reports are confidential bulk files that arrive in segments: a run is only complete when every segment of every instance is downloaded and its size and checksum match. Crash triage ranks signatures by count across builds, devices and OS versions. `asc` CLI facts come from its third-party authors (rorkai). For product analytics inside the app, read [posthog SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/SKILL.md); for crash reporting SDKs, [sentry SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/sentry/SKILL.md).

## Analytics reports

### Rules

- **Collect and verify only.** This workflow does not interpret or aggregate report contents.
- **Treat everything as confidential:** inventories, signed URLs, segments and IDs. Never print a `downloadUrl`. Store files outside the repo with owner-only permissions. Fetch segments only with `asc analytics download`; never fetch or persist signed segment URLs separately.
- **Check the CLI version first.** `asc analytics view --help` must list `--processing-date`, `--granularity`, `--paginate` and `--include-segments` (asc 3.5.0 or newer); if any is missing, ask the user to upgrade. Never use the deprecated `--date`: it matches locally, while `--processing-date` uses Apple's server-side filter.
- **`processingDate` is when Apple processed the report,** not necessarily the period its rows cover.

### Run it

- **Private storage:**

```bash
umask 077
ASC_ANALYTICS_DIR="$(mktemp -d "${TMPDIR:-/tmp}/asc-analytics.XXXXXX")"
mkdir -m 700 "$ASC_ANALYTICS_DIR/segments"
```

- **Keep output private:** redirect command output and errors into this directory; never paste raw inventory JSON or error output into chat, commits, issues or pull requests.
- **Prefer an existing request:** `asc --profile "$PROFILE" analytics requests --app "$APP_ID" --paginate --output json`.
- **Create a request only with approval.** It changes state and needs an Admin-authorized profile plus the user's explicit approval. Access types are `ONGOING` and `ONE_TIME_SNAPSHOT`; state the target app and profile before asking, and prefer `--reuse-existing` to avoid duplicates: `asc --profile "$APPROVED_PROFILE" analytics request --app "$APP_ID" --access-type "$ACCESS_TYPE" --reuse-existing --output json`, then take the ID with `REQUEST_ID="$(jq -er '.requestId' ...)"`. Never delete or replace a request. Use one profile for every later `analytics view` and `analytics download`: the approved profile when you created or reused a request with it, the read-only profile for an existing request found with it.
- **Discover reports:** `asc --profile ... analytics view --request-id "$REQUEST_ID" --paginate --output json`; filter with `--processing-date "$PROCESSING_DATE" --granularity "$GRANULARITY" --include-segments`. Granularity is an allowlist of `DAILY`, `WEEKLY`, `MONTHLY` (a comma list: trim, uppercase, validate, dedupe; stop on an invalid or empty value). Always pass `--paginate` (asc follows Apple's next links); never reconstruct, alter or follow pagination URLs by hand.
- **Download every segment;** the first is never the whole report: `asc --profile ... analytics download --request-id --instance-id --segment-id --output "$ASC_ANALYTICS_DIR/segments/$SEGMENT_ID.txt.gz"`. Reports are tab-delimited text, so name them `.txt.gz`, not CSV. Don't `--decompress` before verifying.
- **Verify each file:** the compressed byte count equals `sizeInBytes`, and the lowercase MD5 equals `checksum` (`SEGMENT_FILE` is the downloaded path, `CHECKSUM` the inventory value):

```bash
actual_size="$(wc -c < "$SEGMENT_FILE" | tr -d ' ')"
actual_md5="$(openssl dgst -md5 -r "$SEGMENT_FILE" | awk '{print tolower($1)}')"
expected_md5="$(printf '%s' "$CHECKSUM" | tr '[:upper:]' '[:lower:]')"
```

  On a mismatch, mark the segment failed. Download refuses to overwrite, so retry once to `$SEGMENT_ID.retry-1.txt.gz`, verify the retry independently and use it only if both checks pass. Keep the original failed file unless the user approves deleting it. Never parse a file before it verifies.
- **Report:** processing date, granularity, counts (reports, instances, expected, downloaded and verified segments), completeness, failed IDs and the private directory. Never claim completeness while any segment is missing or failed. Keep analytics values, signed URLs, profile names, credentials and raw rows out of public artifacts, and ask before deleting the directory or any downloaded evidence.

### Related metrics

- **Custom product page metrics** appear in App Analytics after at least five first-time downloads (see [METADATA-AND-SCREENSHOTS.md](METADATA-AND-SCREENSHOTS.md#custom-product-pages)).

## Crash triage

- **Find the app:** `asc apps list --output table`, or by name `asc apps list --name "AppName"`, or by bundle `asc apps list --bundle-id "com.example.app"`; set `export ASC_APP_ID="APP_ID"`. Add `--paginate` to fetch everything and `--pretty` to read JSON.
- **TestFlight crashes:** `asc testflight crashes list --app "APP_ID" --sort -createdDate --limit 10`; narrow with `--build-id`, or `--device-model "iPhone16,2" --os-version "18.0"`.
- **TestFlight feedback:** `asc testflight feedback list --app "APP_ID" --sort -createdDate --limit 10`, optionally `--include-screenshots` and `--build-id`. Testers send feedback in-app with a screenshot on TestFlight 2.3 or later (iOS, macOS, visionOS).
- **Performance diagnostics need a build ID:** `asc builds info --app "APP_ID" --latest --platform IOS`, or `asc builds list --app "APP_ID" --sort -uploadedDate --limit 5`. Then:
  - `asc performance diagnostics list --build-id "BUILD_ID"`, optionally `--diagnostic-type "HANGS"` (types `HANGS`, `DISK_WRITES`, `LAUNCHES`);
  - `asc performance diagnostics view --id "SIGNATURE_ID"`;
  - `asc performance download --build-id "BUILD_ID" --output ./metrics.json` (here `--output` is the destination path, not a format).
- **Summarize:** total count; top signatures by exception or reason, ranked by count; affected builds; device and OS breakdown; timeline. For diagnostics, list the highest-weight signatures first.
- **Pick the output format:** read commands print a table in a terminal and JSON in pipes or CI; pass `--output json` when parsing.
- **Expect a delay:** crash data can lag 24 to 48 hours.

## Prove it

- **Version gate:** `asc analytics view --help` lists `--processing-date`, `--granularity`, `--paginate` and `--include-segments`, and no command in the run uses `--date`.
- **Privacy:** the output directory has mode 700, sits outside the repo, and no log line contains a `downloadUrl`.
- **Completeness:** downloaded segments equal expected segments; every file's byte count equals `sizeInBytes` and its MD5 equals `checksum`.
- **Crash summary:** counts per signature add up to the total from `asc testflight crashes list ... --paginate`, and the summary names the builds, devices and OS versions involved.
