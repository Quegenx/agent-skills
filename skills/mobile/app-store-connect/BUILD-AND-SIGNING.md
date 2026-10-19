# Builds and signing

A build reaches App Store Connect as a signed IPA (or PKG for macOS) and is matched to its app and version by what is inside the bundle: "the bundle ID and version number, which are located in the app bundle, are used to associate the build with the app and version record in App Store Connect. The build string is used to uniquely identify the build throughout the system." Check three things before an upload: the Xcode and SDK meet Apple's current minimum, the build number is higher than every earlier upload, and the signing identity, profile and bundle ID line up. Commands tagged [rorkai] come from the third-party `asc` CLI (setup and auth in [CLI.md](CLI.md)); untagged facts are Apple's. Flutter projects produce the Xcode project these commands archive: see [flutter SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/SKILL.md). Android builds: [google-play SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/google-play/SKILL.md).

**Contents:** [Minimum Xcode and SDK](#minimum-xcode-and-sdk) · [Version and build numbers](#version-and-build-numbers) · [Build, archive, export](#build-archive-export) · [Uploading](#uploading) · [Build lifecycle](#build-lifecycle) · [Bundle IDs and capabilities](#bundle-ids-and-capabilities) · [Certificates and profiles](#certificates-and-profiles) · [Signing sync and signing run](#signing-sync-and-signing-run) · [Debugging](#debugging) · [Prove it](#prove-it)

## Minimum Xcode and SDK

| Since or from | Requirement |
|---|---|
| May 1, 2024 | "You'll need to include approved reasons for the listed APIs used by your app's code (including from third-party SDKs) to upload a new or updated app to App Store Connect." (details in [PRIVACY-AND-COMPLIANCE.md](PRIVACY-AND-COMPLIANCE.md)) |
| April 28, 2026 | "Apps uploaded to App Store Connect must be built with Xcode 26 or later using an SDK for iOS 26, iPadOS 26, tvOS 26, visionOS 26, or watchOS 26." |
| September 9, 2026 | "iOS and iPadOS apps uploaded to App Store Connect must target iOS 13 or later." |
| April 2027 (next) | iOS and iPadOS apps built with the iOS & iPadOS 27 SDK or later "and target iOS 15 or later"; tvOS 27 SDK; visionOS 27 SDK; watchOS 27 SDK. Build and test with Xcode 27. |
| April 2027 | iPhone Duo screenshots "will be required for any app using the iOS 27.1 SDK or later" (iPhone Duo is available starting October 23, with submissions open). |

- **Upload tooling (upload-builds page):** iOS app, iOS app extension and watchOS app extension: built with Xcode 26 or later, uploaded with Xcode 6 or later. tvOS: built with Xcode 26 or later. visionOS: built with Xcode 26 or later, uploaded with Xcode 15 or later. "Upload for all target types is supported for Transporter and altool." The same page also says: "Starting in 2026, you'll be required to use Xcode 14 or later to upload your app to App Store Connect." The page states both an Xcode 6 and an Xcode 14 floor for uploading; confirm in the current docs.
- **Deadlines move:** check `https://developer.apple.com/news/upcoming-requirements/` and `https://developer.apple.com/app-store/submitting/` before a release.

## Version and build numbers

- **Three keys identify a build:** bundle ID + version number + build string. The build string uniquely identifies the build throughout the system.
- **A new version needs a new build string:** "In Xcode, increment the build string before you upload your build." A new App Store version number is incremental (see [TESTFLIGHT-AND-RELEASE.md](TESTFLIGHT-AND-RELEASE.md#version-numbers)).
- **Read and write the project's numbers [rorkai]:** `asc xcode version view`; `asc xcode version edit --version "1.3.0" --build-number "42"`; `asc xcode version edit --next-build-number --app "APP_ID" --platform IOS`; `asc xcode version bump --type build`; `asc xcode version bump --type patch`; `asc xcode version bump --type build --next-build-number --app "APP_ID" --platform IOS`.
- **Avoid low build-number rejects in one command [rorkai]:** `asc xcode version edit --next-build-number --app "APP_ID" --platform IOS --output json` resolves and applies the remote-safe build number.
- **Selectors [rorkai]:** `--project-dir "./MyApp"` when not running from the project root; `--project "./MyApp/App.xcodeproj"` when the directory contains several projects; `--target "App"` and `--configuration "Release"` for deterministic reads and writes in multi-target or multi-configuration projects.
- **How the edits behave [rorkai]:** mutations validate the full change before writing and return structured output of the configurations and files changed; the editor follows recursive xcconfig includes and preserves unrelated project and xcconfig content. Reads use project and xcconfig settings without launching Xcode; when those can't resolve the version values, the default `--xcodebuild-settings-lookup auto` falls back to `xcodebuild -showBuildSettings` and warns on stderr. Use `--xcodebuild-settings-lookup never` in automation that must not launch Xcode implicitly.
- **Ask App Store Connect for the next number [rorkai]:** `asc builds next-build-number --app "APP_ID" --version "1.2.3" --platform IOS` scans the full processed-build history and in-flight uploads and returns one more than the highest positive numeric build number. Blank and non-numeric processed build numbers are skipped with a warning; if no usable number remains, it falls back to `--initial-build-number`. It only inspects; it doesn't change the project.

## Build, archive, export

All of this section is [rorkai].

- **Prefer `asc xcode archive` and `asc xcode export` over raw `xcodebuild`** for deterministic local artifacts. Pass extra arguments through `--xcodebuild-flag` first; use raw `xcodebuild` (for example `xcodebuild -showBuildSettings -scheme "App"`) only when neither `asc xcode archive --help` nor `asc xcode export --help` covers a project-specific option.
- **Preconditions:** Xcode and the Command Line Tools, a signing identity and provisioning profiles or automatic signing, and App Store Connect auth when upload or build lookup is needed.
- **Compile-only check** (an ordinary simulator, device or CI validation build):

  `asc xcode build --project "App.xcodeproj" --scheme "App" --destination "platform=iOS Simulator,name=iPhone 17 Pro Max,OS=27.0" --no-code-signing --result-bundle-path ".asc/artifacts/App.xcresult" --output json`

  Exactly one project or workspace plus a scheme. Omitting `--derived-data-path` uses a stable cache outside the source checkout. The result-bundle destination must not already exist. Xcode logs go to stderr, the structured result to stdout.
- **Archive (iOS, tvOS, visionOS):**

  ```bash
  asc xcode archive \
    --workspace "App.xcworkspace" \
    --scheme "App" \
    --configuration Release \
    --clean \
    --archive-path ".asc/artifacts/App.xcarchive" \
    --xcodebuild-flag=-destination \
    --xcodebuild-flag=generic/platform=iOS \
    --output json
  ```

  Use `--project "App.xcodeproj"` instead of `--workspace` for project-only apps.
- **Export:** by default it generates App Store Connect export options with automatic signing (method `app-store-connect`) and uses a local export destination, unless `--wait` is set, in which case it uses direct upload.

  `asc xcode export --archive-path ".asc/artifacts/App.xcarchive" --ipa-path ".asc/artifacts/App.ipa" --xcodebuild-flag=-allowProvisioningUpdates --output json`

  To upload directly through Xcode and wait for processing, omit `--export-options` and add `--wait`: `asc xcode export --archive-path ".asc/artifacts/App.xcarchive" --ipa-path ".asc/artifacts/App.ipa" --wait --output json`.
- **ExportOptions.plist** (when it needs review, reuse or manual signing): `asc xcode export-options generate --archive-path ".asc/artifacts/App.xcarchive" --output-path ".asc/ExportOptions.plist" --output json`. For manual signing add `--signing-style manual` and optionally `--team-id "TEAM_ID"`. Existing files need `--overwrite`; use it only when replacing existing local artifacts intentionally. An explicit `--export-options` plist can't be combined with `--method`, `--signing-style` or `--team-id`.
- **Registered-device IPA:** `--method release-testing` (Xcode's current name; Xcode deprecated the `ad-hoc` spelling and asc doesn't accept it). It always exports locally and can't be combined with `--wait`. The default generated method stays `app-store-connect`, so request `release-testing` explicitly.

  ```bash
  asc xcode export \
    --archive-path ".asc/artifacts/App.xcarchive" \
    --ipa-path ".asc/artifacts/App.ipa" \
    --method release-testing \
    --signing-style manual \
    --team-id "TEAM_ID" \
    --output json
  ```

  The matching plist: `asc xcode export-options generate --archive-path ".asc/artifacts/App.xcarchive" --method release-testing --signing-style manual --team-id "TEAM_ID" --output-path ".asc/ExportOptions.release-testing.plist" --output json`. For device and profile reconciliation, isolated signing, private publication and verification, use [AD-HOC-DISTRIBUTION.md](AD-HOC-DISTRIBUTION.md) instead of assembling those stages by hand.
- **macOS:** archive with `--project "MacApp.xcodeproj" --scheme "MacApp"` and `--xcodebuild-flag=generic/platform=macOS`. If the export produces a `.pkg`: `asc xcode export --archive-path ".asc/artifacts/MacApp.xcarchive" --pkg-path ".asc/artifacts/MacApp.pkg" --xcodebuild-flag=-allowProvisioningUpdates --output json`; add `--export-options "ExportOptions.plist"` when the project needs a custom export configuration. macOS requires ICNS icons with all required sizes.

## Uploading

- **Tools (Apple):** Xcode, Swift Playground, altool or Transporter; Xcode Cloud can build and upload; the App Store Connect API can upload binaries, and the Transporter CLI accepts the same JWTs as the API. Required role: Account Holder, Admin, App Manager or Developer.
- **altool:**
  - `$ xcrun altool --validate-app -f file -t platform -u username [-p password] [--output-format xml]`
  - `$ xcrun altool --upload-app -f file -t platform -u username [-p password] [--output-format xml]`
- **asc [rorkai]:** `asc builds upload --app "APP_ID" --ipa ".asc/artifacts/App.ipa" --wait` uploads and commits an IPA or PKG. For a `.pkg`, `--version` and `--build-number` are required (they are not auto-extracted as with IPA metadata): `asc builds upload --app "APP_ID" --pkg ".asc/artifacts/MacApp.pkg" --version "1.0.0" --build-number "123" --wait`.
- **Upload and route in one step [rorkai]:** use `asc publish` when the workflow must also distribute to TestFlight or stage an App Store release. `asc publish testflight --app "APP_ID" --ipa ".asc/artifacts/App.ipa" --group "GROUP_ID" --wait`; `asc publish appstore --app "APP_ID" --ipa ".asc/artifacts/App.ipa" --version "1.2.3" --wait`, adding `--submit --confirm` to submit (see [TESTFLIGHT-AND-RELEASE.md](TESTFLIGHT-AND-RELEASE.md)). Use `--wait` when the next step depends on processed builds.
- **Processing:** the first upload creates a beta version. The build must finish processing before it appears; Apple emails when processing is complete.
- **Maximum sizes:**

| Target | Limit |
|---|---|
| iOS and iPadOS app (deployment target iOS 9.0+) | 4 GB uncompressed; executable max 500 MB (total of all `__TEXT` sections) |
| watchOS | 75 MB |
| macOS | 200 GB |
| App Clip, iOS 17+ | 100 MB (digital invocations only, no iOS below 17) |
| App Clip, iOS 16+ | 15 MB |
| App Clip, earlier | 10 MB |

## Build lifecycle

All of this section is [rorkai].

- **Inspect:** `asc builds info --build-id "BUILD_ID"`; latest: `asc builds info --app "APP_ID" --latest --version "1.2.3" --platform IOS`; recent builds: `asc builds list --app "APP_ID" --sort -uploadedDate --limit 10`.
- **Long processing:** `--wait`, `--poll-interval` and `--timeout` where supported.
- **Clean up:** `asc builds expire-all --app "APP_ID" --older-than 90d --dry-run`, then the same with `--confirm`. One build: `asc builds expire --build-id "BUILD_ID" --confirm`.

## Bundle IDs and capabilities

All of this section is [rorkai].

- **Preconditions:** auth configured (`asc auth login` or `ASC_*` env vars); you know the bundle identifier and target platform.
- **Bundle IDs:** `asc bundle-ids list --paginate`; `asc bundle-ids create --identifier "com.example.app" --name "Example" --platform IOS`.
- **Capabilities:** `asc bundle-ids capabilities list --bundle "BUNDLE_ID"`; `asc bundle-ids capabilities add --bundle "BUNDLE_ID" --capability ICLOUD`. Add capability settings when required: `--settings '[{"key":"ICLOUD_VERSION","options":[{"key":"XCODE_6","enabled":true}]}]'`.
- **`PRIVATE_CLOUD_COMPUTE` is Developer Portal-only** (not in the public App Store Connect capability enum). Use a user-owned web session and the Developer Portal Bundle ID resource ID: `asc web bundle-ids capabilities enable --bundle-id "BUNDLE_RESOURCE_ID" --capability PRIVATE_CLOUD_COMPUTE --confirm`. If the cached session can't access Developer Portal, clear its scoped cache and log in again with the same binary: `asc web auth logout --apple-id "user@example.com"`, then `asc web auth login --apple-id "user@example.com"`.
- **App Groups:** the public API can enable `APP_GROUPS` but can't create or associate App Group resources. With an Account Holder or Admin web session: `asc web app-groups list --paginate --output table`; `asc web app-groups create --name "Example Shared" --identifier "group.com.example.app.shared" --confirm`; `asc web app-groups assign --group "GROUP_RESOURCE_ID" --bundle-id "BUNDLE_RESOURCE_ID" --confirm`. Resolve the opaque group ID with `asc web app-groups list` and the opaque Bundle ID resource ID with `asc bundle-ids list`. A changed assignment invalidates provisioning profiles containing that App ID: regenerate the affected profiles before the next signed build.
- **Devices:** `asc devices` commands (UDID required).

## Certificates and profiles

All of this section is [rorkai] except where marked Apple. Always check `--help` for the exact enum values (certificate types, profile types), and use `--paginate` for large accounts.

- **Certificates:** `asc certificates list --certificate-type IOS_DISTRIBUTION`; `asc certificates create --certificate-type IOS_DISTRIBUTION --csr "./cert.csr"`, or generate a key and CSR inline: `asc certificates create --certificate-type IOS_DISTRIBUTION --generate-csr --key-out "./signing/dist.key" --csr-out "./signing/dist.csr"`.
- **Wallet passes:** create the Pass Type ID first, then its certificate: `asc pass-type-ids create --identifier "pass.com.example" --name "Example Pass"`; `asc certificates create --certificate-type PASS_TYPE_ID --pass-type-id "PASS_TYPE_ID" --csr "./pass.csr"`; `asc pass-type-ids certificates list --pass-type-id "PASS_TYPE_ID" --paginate`.
- **Profiles:** `asc profiles create --name "AppStore Profile" --profile-type IOS_APP_STORE --bundle "BUNDLE_ID" --certificate "CERT_ID"`. Include devices for development or ad hoc: `asc profiles create --name "Dev Profile" --profile-type IOS_APP_DEVELOPMENT --bundle "BUNDLE_ID" --certificate "CERT_ID" --device "DEVICE_ID"`. `--certificate` accepts comma-separated IDs when several certificates are required. Download: `asc profiles download --id "PROFILE_ID" --output "./profiles/AppStore.mobileprovision"`.
- **TestFlight needs App IDs in the profile (Apple):** builds "must include application identifiers within the provisioning profiles" to be eligible for TestFlight.
- **Local profiles:** `asc profiles inspect --path "./profiles/AppStore.mobileprovision" --output table`; `asc profiles inspect --path "./profiles/AppStore.mobileprovision" --entitlements --output markdown`; `asc profiles local install --path "./profiles/AppStore.mobileprovision"`; `asc profiles local list --output table`. These act on local disk, not App Store Connect API resources. On macOS the default directory follows the active Xcode: Xcode 16 or newer `~/Library/Developer/Xcode/UserData/Provisioning Profiles`; Xcode 15 or older `~/Library/MobileDevice/Provisioning Profiles`; hosts without a full active Xcode fall back to the legacy directory and print a note to stderr. Pass `--install-dir` when automation must target a fixed directory.
- **Rotation and audit:** `asc certificates revoke --id "CERT_ID" --confirm`. Audit before deleting or rotating: `asc profiles list --profile-state ACTIVE,INVALID --paginate --output json`. Apple's `profileState` is not a complete expiration signal (a past `expirationDate` can still report `ACTIVE`): for true expired-profile audits compare `expirationDate` with the current date instead of relying only on `INVALID`. Remove: `asc profiles delete --id "PROFILE_ID" --confirm`; `asc profiles local clean --expired --dry-run`, then `--confirm`. Check the resolved directory in the dry-run output before confirming, or pin it with `--install-dir`.

## Signing sync and signing run

All of this section is [rorkai].

- **`asc signing sync` is a lightweight, non-interactive alternative to fastlane match** for encrypted git-backed certificate and profile storage.

  ```bash
  # Protect secret inputs before use
  chmod 600 "./signing-sync-password" "./distribution.p12" "./distribution-p12-password"

  # Push a usable private identity with its matching certificate and profile
  asc signing sync push \
    --bundle-id "com.example.app" \
    --profile-type IOS_APP_ADHOC \
    --repo "git@github.com:team/certs.git" \
    --password-file "./signing-sync-password" \
    --identity "./distribution.p12" \
    --identity-password-file "./distribution-p12-password" \
    --output json

  # Pull and decrypt them into a local directory
  asc signing sync pull \
    --repo "git@github.com:team/certs.git" \
    --password-file "./signing-sync-password" \
    --output-dir "./signing" \
    --output json
  ```

- **App Store Connect never returns a private key.** Supply the local PKCS#12 with `--identity`, or use `--private-key` with `--identity-sha256` to select its matching App Store Connect certificate; a multi-identity PKCS#12 also needs `--identity-sha256`. Certificate- and profile-only sync stays supported but reports `identityPresent: false`; it is not a usable signing identity by itself. `pull` reports private identities in `sensitiveFiles` and writes them mode `0600`; importing or using the pulled identity is a separate explicit step. Private identity sync rejects `MAC_APP_DIRECT` and `MAC_CATALYST_APP_DIRECT` (certificate and profile-only sync stays available).
- **Passwords:** prefer `--password-file`; `ASC_SIGNING_SYNC_PASSWORD` is the non-file fallback. `--password` was removed in 5.0.0 and is rejected. `ASC_MATCH_PASSWORD` is no longer read and is ignored if set.
- **Experimental reconcile:** deterministic, additive changes derived from an Xcode archive and a protected desired-devices file.

  ```bash
  asc signing reconcile plan \
    --archive-path ".asc/artifacts/App.xcarchive" \
    --devices-file ".asc/distribution/devices.json" \
    --output json

  asc signing reconcile apply \
    --plan ".asc/distribution/signing/plan.json" \
    --confirm \
    --output json
  ```

  Planning performs no mutation and may return `ready: false`. Apply can register missing devices, create safe baseline App IDs and create successor ad hoc profiles; it never deletes or patches resources, enables capabilities or creates certificates. Review the plan before `--confirm`.
- **`asc signing run` (macOS):** runs one command with an ephemeral identity, avoiding persistent login-keychain and profile changes.

  ```bash
  asc signing run \
    --identity "./signing/App.p12" \
    --identity-password-file "./signing/App-password" \
    --profile "./signing/App.mobileprovision" \
    --receipt ".asc/distribution/signing-run.json" \
    -- xcodebuild -exportArchive \
      -archivePath ".asc/artifacts/App.xcarchive" \
      -exportPath ".asc/artifacts/release-testing" \
      -exportOptionsPlist ".asc/ExportOptions.release-testing.plist"
  ```

  It runs directly without a shell, preserves the child's exit code, uses an isolated temporary keychain and cleans up its temporary profile. It doesn't print success data, so the child owns stdout. Never pass identity passwords inline.

## Debugging

| Symptom | Fix |
|---|---|
| "CFBundleVersion too low" [rorkai] | `asc xcode version edit --next-build-number --app "APP_ID" --platform IOS`, then rebuild and upload again. |
| "No profiles for bundle ID" during export [rorkai] | Add `--xcodebuild-flag=-allowProvisioningUpdates` to `asc xcode export`; verify the Apple ID is logged into Xcode; verify the profiles ([Certificates and profiles](#certificates-and-profiles)). |
| Build rejected for missing macOS icon [rorkai] | macOS requires ICNS icons with all required sizes. Fix the asset catalog, rebuild, then export and upload again. |
| Build not visible after upload | It must finish processing before it appears; Apple emails when processing is complete, or use `asc builds upload ... --wait`. |
| Build shows "Missing Compliance" | Answer the export compliance questions (or upload encryption documentation) before submitting: [TESTFLIGHT-AND-RELEASE.md](TESTFLIGHT-AND-RELEASE.md#readiness-repairs). |
| Signed build fails after an App Group change [rorkai] | The assignment invalidated the profiles; regenerate them. |
| Profile reports `ACTIVE` but signing fails [rorkai] | Compare `expirationDate` with now; `profileState` is not a complete expiration signal. |

## Prove it

- The archive was built with an Xcode and SDK at or above the current row of the minimums table, and the iOS deployment target meets the "target iOS 13 or later" rule (iOS 15 from April 2027).
- `asc builds next-build-number --app "APP_ID" --version "1.2.3" --platform IOS` returns a number no higher than the build number in the project before upload.
- `asc builds upload ... --wait` exits 0, and `asc builds info --build-id "BUILD_ID"` shows the build processed for the right app, version and build number.
- `asc profiles inspect --path ... --entitlements` shows the expected bundle ID and capabilities, and its `expirationDate` is in the future.
- No private key, p12 or password file is committed; signing inputs are mode `600`.
