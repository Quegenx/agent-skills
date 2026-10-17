# Ad hoc (release-testing) distribution

All of this file is [rorkai]. Experimental `asc distribute` turns an existing iOS archive into a private, verified install link for registered devices, published through your own S3-compatible storage. Use TestFlight or the App Store instead when the build should go through Apple-hosted distribution. Two paths: `plan` > `apply` > `resume` / `status` > `verify` for an end-to-end, hash-authorized run from an `.xcarchive`, or `inspect` > `prepare` > `publish` when you already own the ad hoc IPA. The IPA is exported with `--method release-testing` ([BUILD-AND-SIGNING.md](BUILD-AND-SIGNING.md#build-archive-export)); TestFlight and App Store release are in [TESTFLIGHT-AND-RELEASE.md](TESTFLIGHT-AND-RELEASE.md). Confirm the installed contract with `asc distribute --help` and each subcommand's `--help` first.

- **Preconditions:** an existing iOS `.xcarchive` with one main app target (embedded apps, extensions, Watch apps or App Clips make the v1 plan not ready); a local iOS distribution PKCS#12 identity and optional protected password file; a protected strict-v1 devices file; App Store Connect auth with access to devices, Bundle IDs, certificates and profiles; an existing S3-compatible bucket and valid credentials.

  `{"schemaVersion":1,"devices":[{"name":"Test iPhone","udid":"DEVICE_UDID","platform":"IOS"}]}`
- **Keep it private:** the spec, devices file, PKCS#12 identity, password file, run state and install-link artifact stay out of Git with owner-only permissions. Never put S3 credentials or presigned URLs in the spec, command output, logs, issues or chat. S3 credentials come only from `ASC_S3_ACCESS_KEY_ID`, `ASC_S3_SECRET_ACCESS_KEY`, optional `ASC_S3_SESSION_TOKEN`, or the standard AWS SDK credential chain.
- **The spec:** relative paths resolve from the spec directory; it doesn't interpolate environment variables or accept credentials. `passwordFile`, `certificateSha256`, `downloadEndpoint` and every metadata field are optional; an omitted password file means the PKCS#12 must use an empty password. A representative private config:

```json
{
  "schemaVersion": 1,
  "devicesFile": "devices.json",
  "signing": {
    "identity": {
      "format": "pkcs12",
      "path": "../signing/distribution.p12",
      "passwordFile": "../secrets/distribution-p12-password"
    },
    "minimumValidityDays": 7,
    "maxMutations": 32
  },
  "publication": {
    "endpoint": "https://objects.example.com",
    "downloadEndpoint": "https://downloads.example.com",
    "region": "auto",
    "bucket": "ios-builds",
    "prefix": "team/app",
    "addressingStyle": "path",
    "urlTtl": "24h",
    "downloadGrace": "1h",
    "verifyTimeout": "30s"
  },
  "metadata": {
    "title": "App",
    "channel": "pull-request-42",
    "sourceRevision": "abc123",
    "sourceUrl": "https://example.com/team/app/commit/abc123"
  }
}
```

  Protect the config and secret inputs before planning: `chmod 600 ".asc/distribution/config.json" ".asc/distribution/devices.json"` and `chmod 600 ".asc/signing/distribution.p12" ".asc/secrets/distribution-p12-password"`.
- **Plan without mutation:** `asc distribute plan --archive-path ".asc/artifacts/App.xcarchive" --config ".asc/distribution/config.json" --plan ".asc/distribution/plan.json" --state-dir ".asc/distribution/runs" --output json`. It is read-only and may exit successfully with `ready: false`: inspect `ready`, `planHash`, signing validity, destination, the typed blockers and the complete ordered `effects` inventory. Don't infer readiness from the exit code alone; resolve blockers and make a new plan.
- **Apply the exact authorized plan:** apply can register missing devices, create safe App IDs and successor ad hoc profiles, write local artifacts and publish immutable objects, so run it only after the user authorizes the exact plan hash and effects. Pass the full 64-character hash; a missing, malformed or unequal confirmation is rejected before side effects.

  ```bash
  PLAN_HASH="$(jq -er '.planHash' ".asc/distribution/plan.json")"
  asc distribute apply \
    --plan ".asc/distribution/plan.json" \
    --confirm "$PLAN_HASH" \
    --output json
  ```

  Success means publication and live fetch verification completed, not that a device installed or launched the app. asc doesn't create buckets, change policies, delete old builds, or install or launch the app.
- **Inspect, resume and verify** with the returned `runId`:

  ```bash
  asc distribute status --run "RUN_ID" --state-dir ".asc/distribution/runs" --output json
  asc distribute resume --run "RUN_ID" --state-dir ".asc/distribution/runs" --output json
  asc distribute verify --run "RUN_ID" --state-dir ".asc/distribution/runs" --timeout 30s --output json
  ```

  `status` is local-only and succeeds for `running`, `recoverable` and `blocked` runs: branch on typed fields, not prose. `resume` revalidates durable evidence and never blindly repeats a remote write. `verify` is read-only but does live fetches; add `--device "DEVICE_SELECTOR"` only when the user asks to observe the installed bundle, version and build on a connected device (this doesn't prove IPA byte identity). Input drift, an immutable-object conflict, expired signing material or an expired private link needs a new plan; don't force the old run forward.
- **The install URL is a bearer credential,** stored only in the owner-private link artifact reported by the completed run. Share it only with the intended tester through an approved private channel.
- **Lower-level IPA workflow** (signing and export already done); pass the exact `bundleDir` returned by `prepare` to `publish`:

  ```bash
  asc distribute inspect --ipa ".asc/artifacts/App.ipa" --output json
  asc distribute prepare --ipa ".asc/artifacts/App.ipa" --channel "pull-request-42" --output json
  asc distribute publish \
    --bundle-dir ".asc/distribution/com.example.app/1.2-42-IPA_SHA_PREFIX" \
    --endpoint "https://objects.example.com" \
    --region "auto" \
    --bucket "ios-builds" \
    --prefix "team/app" \
    --receipt ".asc/publishes/app-1.2-42.json" \
    --link-path ".asc/publishes/app-1.2-42-link.json" \
    --output json
  ```

  `inspect` omits raw device UDIDs unless `--include-devices` is explicitly needed. `prepare` never overwrites a bundle and reuses only an exact equivalent. Private `publish` is the default and writes the presigned links only to the mode-0600 link artifact. Public publication is a separate explicit lane with `--access public --public-base-url`; it assumes anonymous reads are already configured and never changes storage policy.

## Prove it

- `asc distribute plan ... --output json` reports `ready: true`, and the `planHash` passed to `apply --confirm` is the full 64-character hash from that plan.
- `asc distribute verify --run "RUN_ID" --state-dir ".asc/distribution/runs" --timeout 30s --output json` succeeds and the install link stays private.
