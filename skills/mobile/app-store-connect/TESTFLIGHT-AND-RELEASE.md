# TestFlight and release

A processed build goes two ways: to testers through TestFlight (or a registered-device ad hoc IPA), and to the App Store through a review submission attached to an App Store version. The submission rules that shape the rest: one build per version, "Each platform can have one app version submission under review at a time", "All items submitted together must be Accepted to complete the submission", and a release can't be undone ("it's not possible to revert to a previous version on the App Store"). Commands tagged [rorkai] come from the third-party `asc` CLI (setup in [CLI.md](CLI.md)); untagged facts are Apple's. Getting the build there: [BUILD-AND-SIGNING.md](BUILD-AND-SIGNING.md). What App Review checks: [REVIEW-GUIDELINES.md](REVIEW-GUIDELINES.md) and [PREFLIGHT.md](PREFLIGHT.md). Google Play's equivalent: [google-play SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/google-play/SKILL.md).

**Contents:** [TestFlight](#testflight) · [Ad hoc (release-testing) distribution](#ad-hoc-release-testing-distribution) · [Version numbers](#version-numbers) · [Submitting for review](#submitting-for-review) · [The asc release lanes](#the-asc-release-lanes) · [Multi-item submissions](#multi-item-submissions) · [Submission health](#submission-health) · [Readiness repairs](#readiness-repairs) · [Digital goods in a submission](#digital-goods-in-a-submission) · [Release options](#release-options) · [Phased release](#phased-release) · [After you submit](#after-you-submit) · [Prove it](#prove-it)

## TestFlight

### Limits and rules (Apple)

| Rule | Value |
|---|---|
| Build lifetime | Testable for up to 90 days |
| Internal testers | Up to 100 App Store Connect users |
| External testers | Up to 10,000 |
| Beta review | The first build added to an external group goes to App Review. "A review is required only for the first build. Subsequent builds may not require a full review." |
| Beta review rate | "You can submit up to six builds for TestFlight App Review within a 24-hour period." "You can only have one build of each version in review at a time." |
| Public link | Open to Anyone, or Filter by Criteria (device and OS version); tester limit 1 to 10,000; public-link testers show as anonymous |
| Eligibility | Builds "must include application identifiers within the provisioning profiles" |
| In-app feedback | Screenshot feedback with TestFlight 2.3 or later on iOS, macOS, visionOS |

- **A released build stays testable:** if you don't expire a build that you then release, invited testers can still test it until its 90 days are up.
- **Internal groups:** TestFlight tab > (+) next to Internal Testing. "Enable automatic distribution" lets Xcode deliver builds automatically; Xcode Cloud builds must be added manually; builds uploaded as "TestFlight Internal Only" can go only to internal groups. Required role: Account Holder, Admin, App Manager, Developer or Marketing.
- **External groups need an internal group first:** "To create an external group for external testing, you must first create an internal group for internal testing." Invite by email (or CSV import) or a public link. Check "Automatically notify testers", or click Notify Testers after approval. Required role: Account Holder, Admin or App Manager. Appeal beta rejections by contacting TestFlight App Review.
- **Test Information is required for external testing:** Beta App Description (required) and Feedback Email (also the reply-to of invites). The App Information checkbox shows approved screenshots and the category in invites.
- **Purchases in TestFlight:** TestFlight apps run in the sandbox environment. Subscriptions renew daily, up to 6 times within a week regardless of duration. Use a Sandbox Apple Account (Developer settings) for other scenarios such as billing retry. Product setup: [PRICING-AND-SUBSCRIPTIONS.md](PRICING-AND-SUBSCRIPTIONS.md). Crashes and feedback from testers: [ANALYTICS-AND-CRASHES.md](ANALYTICS-AND-CRASHES.md).

### Driving TestFlight with asc

All of this section is [rorkai]. Prefer IDs for deterministic operations ([CLI.md](CLI.md#resolving-ids)) and use `--paginate` on large group and tester lists.

- **Export the current setup:** `asc testflight config export --app "APP_ID" --output "./testflight.yaml"`; add `--include-builds --include-testers` to include builds and testers.
- **Groups and testers:** `asc testflight groups list --app "APP_ID" --paginate`; `asc testflight groups create --app "APP_ID" --name "Beta Testers"`; `asc testflight testers list --app "APP_ID" --paginate`; `asc testflight testers add --app "APP_ID" --email "tester@example.com" --group "Beta Testers"`; `asc testflight testers invite --app "APP_ID" --email "tester@example.com"`.
- **Route builds:** `asc builds add-groups --build-id "BUILD_ID" --group "GROUP_ID"`; `asc builds remove-groups --build-id "BUILD_ID" --group "GROUP_ID" --confirm`. Inspect a build's groups: `asc testflight groups list --build-id "BUILD_ID" --output table` (experimental; it resolves the app, paginates the app's groups and includes groups with all-build access).
- **Upload and distribute in one step:** `asc publish testflight --app "APP_ID" --ipa "./app.ipa" --group "GROUP_ID" --wait`.
- **Upload only:** `asc publish testflight --app "APP_ID" --ipa "./app.ipa" --upload-only --output json`; add `--wait` when the next step needs a processed build. It needs a new IPA or local Xcode build and can't be combined with an existing `--build-id`, groups, tester notifications, test notes or beta-review submission. `--build-number` is allowed as upload metadata, but it can't be the only build input.
- **What to Test notes:** `asc builds test-notes create --build-id "BUILD_ID" --locale "en-US" --whats-new "Test instructions"`; `asc builds test-notes update --localization-id "LOCALIZATION_ID" --whats-new "Updated notes"`.

## Ad hoc (release-testing) distribution

Registered-device installs outside TestFlight with the experimental [rorkai] `asc distribute` workflow: [AD-HOC-DISTRIBUTION.md](AD-HOC-DISTRIBUTION.md).

## Version numbers

- **A new version:** in the sidebar click (+) next to the platform and "enter an incremental App Store version number". Metadata from the current version transfers automatically. "In Xcode, increment the build string before you upload your build." The current version must be Ready for Distribution before you start a new one. Required role: Account Holder, Admin, App Manager or Marketing.
- **No rollback:** "it's not possible to revert to a previous version on the App Store ... You must create and submit a new version."
- **What's New** is limited to 4000 characters, not available for the first version and required for every later one. **Reset Overview Rating** is possible when releasing a new version. Other version fields: [METADATA-AND-SCREENSHOTS.md](METADATA-AND-SCREENSHOTS.md).
- **Build numbers** and how asc picks the next one: [BUILD-AND-SIGNING.md](BUILD-AND-SIGNING.md#version-and-build-numbers).

## Submitting for review

- **Choose a build:** one build per app version, changeable until submission. Required role: Account Holder, Admin or App Manager. A build in "Missing Compliance" status needs the export compliance questions answered (or encryption documentation uploaded) before submitting. With fastlane, `submission_information: { export_compliance_uses_encryption: false, export_compliance_encryption_updated: false }` "answers Apple's export compliance questions automatically. If your app uses encryption beyond standard HTTPS, you will need to adjust these values" [ApparenceKit](https://apparencekit.dev/blog/automate-flutter-ios-deploy-fastlane/).
- **Steps:** select the version > verify Build > "Add for Review" (adds to an existing draft submission or creates a new one; status becomes Ready for Review) > optionally add items (In-App Events, asset packs) > "Submit for Review"; status becomes In Review.
- **Concurrency:** "Each platform can have one app version submission under review at a time." At most two submissions per platform under review: one that includes an app version, and one with items only (In-App Events, custom product pages). Submissions may not be reviewed in order. Items for different platforms can't share a submission.
- **Items you can add:** subscriptions and groups, In-App Purchases, In-App Events, custom product pages, product page optimization tests, Apple-hosted asset packs, Game Center components. "All items submitted together must be Accepted to complete the submission."
- **App Review Information** (contact, notes, demo account that "must not expire"): [REVIEW-OPERATIONS.md](REVIEW-OPERATIONS.md#review-notes).

## The asc release lanes

All of this section is [rorkai].

| Lane | Does |
|---|---|
| `asc release stage` | Prepares metadata and attaches an existing build without submitting |
| `asc review submit` | Submits an already prepared version |
| `asc publish appstore` | Uploads an IPA or builds locally, then optionally submits |
| Lower-level `asc review` submission commands | Submits the app version with IAP, subscription or Game Center version items ([Multi-item submissions](#multi-item-submissions)) |

- **Pick one lane.** Don't mix lanes after one has already created a review submission: inspect the existing submission and continue through the matching lower-level commands. Never create a second review submission when one already exists for the version.
- **Preconditions:** resolve `APP_ID`, the version string, `VERSION_ID` when needed and `BUILD_ID` when a build exists ([CLI.md](CLI.md#resolving-ids)); configure auth with `asc auth login` or `ASC_*` env vars; platform is `IOS` unless the app targets another; keep canonical metadata in `./metadata` when the workflow applies metadata. Require a dry run before a mutating high-level command, then `--confirm` for submission, and only once the dry-run plan matches the requested release.
- **Readiness gate:** apply it to a version that already has the intended build attached. `asc validate --app "APP_ID" --version "1.2.3" --platform IOS --output table` (`--strict` makes warnings fail). Digital goods are a hard gate: if the release includes IAPs or subscriptions, run the product checks ([Submission health](#submission-health)) and resume only when they have no blocking issues and the product versions are prepared. In the staging lane an unattached build before staging is expected, not a health issue: `asc release stage` attaches the build and runs validation. Don't turn a validation failure into a partial release; stop at the failing gate.
- **Stage:** `asc release stage` verifies the build belongs to the app before changing the version, applies or copies metadata, attaches the build and runs validation without creating a review submission. `asc release stage --app "APP_ID" --version "1.2.3" --build-id "BUILD_ID" --metadata-dir "./metadata" --dry-run --output table`, then the same with `--confirm` in place of `--dry-run --output table`. The `--metadata-dir` root contains `app-info/` and `version/<version>/` (the same layout as `asc metadata push --dir`). Use `--copy-metadata-from "1.2.2"` instead of `--metadata-dir` to carry localization metadata forward; `--strict-validate` makes warnings fail the stage. If the metadata plan contains deletes, both the dry run and the confirmed run need `--allow-deletes`; review the deletes first, since the flag also disables fallback to an existing locale absent locally. `--routing-coverage-file "./coverage.geojson"` (experimental) for routing app coverage validates the GeoJSON before mutation and stages it before readiness checks. Output `steps[]` starts with `validate_build`; match steps by name, not position.
- **Submit:** after metadata, review details, availability, build processing and product readiness are resolved: `asc review submit --app "APP_ID" --version "1.2.3" --build-id "BUILD_ID" --dry-run --output table`, then `asc review submit --app "APP_ID" --version "1.2.3" --build-id "BUILD_ID" --confirm`. `--version-id "VERSION_ID"` replaces `--version` when known. `--build-number "45"` skips the build-ID lookup and matches only builds of that app, version string and platform; right after an upload prefer it over `--latest`, which can still pick the previous upload. `--wait` waits for processing before attaching.
- **Publish:** `asc publish appstore --app "APP_ID" --ipa "./App.ipa" --version "1.2.3" --submit --dry-run --output table`, then `asc publish appstore --app "APP_ID" --ipa "./App.ipa" --version "1.2.3" --submit --wait --confirm`. Local-build mode takes `--workspace` or `--project` plus `--scheme` instead of `--ipa`; `--metadata-dir` applies canonical version metadata after ensuring the version; omit `--submit` to upload and attach only.
- **Removed shortcuts:** `submit-preflight`, `submit-create`, `release-run` no longer exist.
- **Hand off:** report the app, version, platform, build and submission IDs; which lane ran and whether it completed; the mutations performed under the user's authorization; and the exact command to monitor it.
- **In automation wrappers** keep data on stdout and diagnostics on stderr.

## Multi-item submissions

All of this section is [rorkai]. One review submission holds the app version plus versioned digital goods, Game Center components, in-app events or Asset Library media. Prepare items during readiness; assemble only after the app version and build are staged and the multi-item lane is chosen; submit only after inspecting the draft and getting confirmation.

- **Prepare every item:** resolve the exact `VERSION_ID` and each product or component version ID (product versions: [Digital goods](#digital-goods-in-a-submission)). Event and library asset IDs are distinct from their localization or placement IDs. If the release has Game Center items, confirm the Game Center app version exists: `asc game-center app-versions list --app "APP_ID" --output table`; create it only if absent: `asc game-center app-versions create --app-store-version-id "VERSION_ID" --output json`.
- **Find an existing draft before creating one:** `asc review submissions list --app "APP_ID" --platform IOS --include "items,appStoreVersionForReview" --paginate --output json`.
  - Handed-off `SUBMISSION_ID`: inspect it with `asc review submissions-get --id "SUBMISSION_ID" --include "items,appStoreVersionForReview" --output json` and reuse it only if it is the intended `READY_FOR_REVIEW` draft. If it fails that check, stop and diagnose; don't create another submission or add items.
  - No handed-off ID and exactly one matching `READY_FOR_REVIEW` draft: reuse its ID.
  - No matching draft or active submission for the version or items: `asc review submissions-create --app "APP_ID" --platform IOS --output json`.
  - Otherwise (ambiguous drafts, or the version or items belong to another active submission): stop and diagnose. Don't create a second submission.
- **Add only what is missing, app version first:** `asc review items list --submission "SUBMISSION_ID" --paginate --output json`, compare each intended item type and resource ID, skip exact matches, then `asc review items add --submission "SUBMISSION_ID" --item-type appStoreVersions --item-id "VERSION_ID"`, followed by `inAppPurchaseVersions`, `subscriptionVersions`, `subscriptionGroupVersions`, `gameCenterLeaderboardVersions` with their resolved IDs. Other Game Center item types: `gameCenterAchievementVersions`, `gameCenterActivityVersions`, `gameCenterChallengeVersions`, `gameCenterLeaderboardSetVersions`. Event and library co-submissions use `appEvents`, `appAssetLibraryImages`, `appAssetLibraryVideos` (these don't need a Game Center app version). Add only the types this release needs; never submit placeholder or unresolved IDs.
- **Submit:** `asc review submissions-get --id "SUBMISSION_ID" --include items --output table` and `asc review items list --submission "SUBMISSION_ID" --paginate --output table`, then `asc review submissions-submit --id "SUBMISSION_ID" --confirm`. If inspection shows an existing active or completed submission instead of your draft, stop and diagnose rather than creating another.

## Submission health

All of this section is [rorkai].

- **Answer in this order:** ready, blocked or already under review; each blocker with its evidence; public-API repairs separated from web-session and manual work. For a diagnosis-only request, report the evidence and one proposed repair command without running it; for authorized execution, continue the repair queue and report completed work and remaining blockers.
- **Establish the target:** resolve `APP_ID`, the version or `VERSION_ID`, `BUILD_ID`, platform and any known `SUBMISSION_ID`. Prefer IDs once resolved; stop when app, version or product resolution is ambiguous.
- **Diagnose:** `asc validate --app "APP_ID" --version "1.2.3" --platform IOS --output table` (`--version-id` when known, `--strict` to fail on warnings); `asc review doctor --app "APP_ID" --version "1.2.3" --platform IOS --output table`; `asc builds info --build-id "BUILD_ID" --output table`; `asc versions view --version-id "VERSION_ID" --include-build --include-submission --output table`; for digital goods only the relevant `asc validate iap --app "APP_ID" --output table` or `asc validate subscriptions --app "APP_ID" --output table`. Treat the ordered remediation plan from `asc validate` as the repair queue; fix and verify one blocker class before the next.
- **Route repairs:** public API for build processing, metadata, screenshots, review details, encryption, content rights, age rating, availability and version-scoped product metadata ([Readiness repairs](#readiness-repairs)). Web-session commands only for gaps the public API can't cover; say an authenticated Apple web session is required, and keep a manual App Store Connect fallback if the user declines. Web-session automation is not public App Store Connect API coverage. Game Center blockers go to [Multi-item submissions](#multi-item-submissions), not general readiness or digital-goods repairs.
- **Healthy means all of these:** `asc validate` has no blocking issues; the attached build is `VALID`; metadata, screenshots, app info, review details, content rights, encryption, age rating, pricing and availability resolved; the relevant product validators have no blocking issues and the digital-goods versions are prepared; Game Center items checked; App Privacy confirmed or published. One validator exiting successfully doesn't make it ready; report any warning that still needs a web-session or manual check.
- **Monitor:** `asc review status --app "APP_ID" --version "1.2.3" --platform IOS --output table` when the submission ID is unknown; `asc submit status --id "SUBMISSION_ID" --output table` or `asc submit status --version-id "VERSION_ID" --output table`; `asc status --app "APP_ID" --include builds,appstore,submission,review --output table`. To wait: `asc status --app "APP_ID" --until review-done --timeout 2h --output json` exits `0` approved, `1` rejected, `7` still pending at timeout. Its JSON `summary.nextCommands` marks which suggestions mutate App Store Connect; treat those as proposals that still need the user's authorization. History tells a current stall from earlier rejected or completed submissions: `asc review history --app "APP_ID" --version "1.2.3" --paginate --output table`.
- **Cancel:** resolve the exact active submission and preview its status first. `asc submit cancel --id "SUBMISSION_ID" --confirm`; by version include the app: `asc submit cancel --version-id "VERSION_ID" --app "APP_ID" --confirm`; lower-level `asc review submissions-cancel --id "SUBMISSION_ID" --confirm`. Never cancel only because review is slow; confirm the state and the user's intent first.
- **There is no retry command:** cancel only if the active submission must be withdrawn; repair the proven blockers; re-run `asc validate` and the product validators; confirm no active submission owns the version or items; then hand back to the release lane, reusing an inspected `READY_FOR_REVIEW` draft and creating one only when no matching draft or active submission exists.
- **Output and platform:** `--output table` for human diagnosis and JSON for automation. For macOS use `--platform MAC_OS`.

| Error | First evidence | Go to |
|---|---|---|
| "Version is not in a valid state" | `asc validate`, `asc review doctor` | ordered readiness repairs |
| "Export compliance must be approved" | build info and encryption declaration | [Readiness repairs](#readiness-repairs) |
| "Multiple app infos found" | `asc apps info list --app "APP_ID"` | resolve the exact app-info ID |
| IAP or subscription not ready | product validator | [Digital goods](#digital-goods-in-a-submission) |
| Game Center component or version not ready | `asc validate` diagnostic | [Multi-item submissions](#multi-item-submissions) |
| App Privacy publish state unclear | validation advisory | App Privacy repair below; policy in [PRIVACY-AND-COMPLIANCE.md](PRIVACY-AND-COMPLIANCE.md) |
| Review appears stuck | review status plus history | monitor; cancel only with evidence and approval |

## Readiness repairs

All of this section is [rorkai]. Run only the repair that matches a proven `asc validate` or `asc review doctor` blocker. The policy behind each field is in [PRIVACY-AND-COMPLIANCE.md](PRIVACY-AND-COMPLIANCE.md) and [METADATA-AND-SCREENSHOTS.md](METADATA-AND-SCREENSHOTS.md).

- **Encryption:** inspect the build first (`asc builds info --build-id "BUILD_ID" --output table`) and require `processingState` `VALID`. `asc encryption declarations list --app "APP_ID" --output table`; create a declaration only when its answers accurately describe the binary: `asc encryption declarations create --app "APP_ID" --app-description "Uses standard HTTPS/TLS" --contains-proprietary-cryptography=false --contains-third-party-cryptography=true --available-on-french-store=true`; assign it: `asc encryption declarations assign-builds --id "DECLARATION_ID" --build-id "BUILD_ID"`. If the app truly uses only exempt transport encryption, update the local plist and rebuild instead of making a false declaration: `asc encryption declarations exempt-declare --plist "./Info.plist"`.
- **Content rights:** `asc apps content-rights view --app "APP_ID" --output table`; edit only when the answer is known: `asc apps content-rights edit --app "APP_ID" --uses-third-party-content=false`.
- **Age rating:** inspect the full declaration before a partial edit: `asc age-rating view --app "APP_ID" --output table`; `asc age-rating edit --app "APP_ID" --social-media false --social-media-age-restricted false` only when those describe the app. Apple requires `userGeneratedContent=true` before `socialMedia` can be true, and both `ageAssurance=true` and `socialMedia=true` before `socialMediaAgeRestricted` can be true; set every prerequisite in the same edit or preserve the current values explicitly. Use `--age-rating-override-v2` when an override is required; `--age-rating-override` is deprecated.
- **Metadata:** `asc versions view --version-id "VERSION_ID" --include-build --include-submission --output table`; `asc localizations list --version "VERSION_ID" --output table`; then:

  ```bash
  asc metadata pull --app "APP_ID" --version "1.2.3" --platform IOS --dir "./metadata"
  asc metadata validate --dir "./metadata" --output table
  asc metadata push --app "APP_ID" --version "1.2.3" --platform IOS --dir "./metadata" --dry-run --output table
  asc metadata push --app "APP_ID" --version "1.2.3" --platform IOS --dir "./metadata"
  ```

  Review the dry-run diff before applying. Don't overwrite local changes with a pull unless the user has chosen the remote copy as the source of truth.
- **App info:** `asc apps info list --app "APP_ID" --output table`; `asc localizations list --app "APP_ID" --type app-info --app-info "APP_INFO_ID" --output table`. For every iOS or macOS app, populate the privacy policy URL when missing: `asc app-setup info set --app "APP_ID" --primary-locale "en-US" --privacy-policy-url "https://example.com/privacy"`.
- **Screenshots:** `asc screenshots list --version-localization "LOC_ID" --output table`; `asc screenshots sizes --output table`; `asc screenshots validate --path "./screenshots" --device-type "IPHONE_65" --output table`.
- **Initial availability:** the bootstrap and its web fallback are in [CLI.md](CLI.md#availability-bootstrap).
- **Review details:** `asc review details-for-version --version-id "VERSION_ID" --output table`; create missing details: `asc review details-create --version-id "VERSION_ID" --contact-first-name "Dev" --contact-last-name "Support" --contact-email "dev@example.com" --contact-phone "+1 408 555 0100" --notes "Explain the reviewer access path here."`; update the resolved record instead of creating a duplicate: `asc review details-update --id "DETAIL_ID" --notes "Updated reviewer instructions."`. Set demo-account fields only when App Review needs credentials, and never print secrets in logs or handoff text.
- **App Privacy:** the public API doesn't cover the full workflow; these are authenticated web-session commands, not public-API proof. Pull: `asc web privacy pull --app "APP_ID" --out "./privacy.json"`; review the planned change: `asc web privacy plan --app "APP_ID" --file "./privacy.json"`; check every data type, purpose, tracking answer and linkage answer against the app's real behavior and third-party SDKs (don't infer answers from the binary name or store copy); apply: `asc web privacy apply --app "APP_ID" --file "./privacy.json"`; publish only after checking the applied answers: `asc web privacy publish --app "APP_ID" --confirm`. Keep plan and apply separate; a successful apply doesn't prove the answers were published. Manual fallback: `https://appstoreconnect.apple.com/apps/APP_ID/appPrivacy`.

## Digital goods in a submission

All of this section is [rorkai]. When work starts from an existing review draft, preserve its `SUBMISSION_ID` in the handoff so the release lane reuses that draft. Product setup: [PRICING-AND-SUBSCRIPTIONS.md](PRICING-AND-SUBSCRIPTIONS.md).

- **Validate and fix products first:** `asc validate iap --app "APP_ID" --output table`, `asc validate subscriptions --app "APP_ID" --output table` (`--output json --pretty` for the exact payload). Fix missing localization, pricing, availability, review screenshots and promotional images before attaching products to review.
- **First-review subscription selection is not in the public API** (web session): `asc web review subscriptions list --app "APP_ID"`; attach the group: `asc web review subscriptions attach-group --app "APP_ID" --group-id "GROUP_ID" --confirm`; or one subscription when that is the review unit: `asc web review subscriptions attach --app "APP_ID" --subscription-id "SUB_ID" --confirm`. If the user declines web-session automation, select it manually in App Store Connect. `asc subscriptions review submit` was removed in 5.0.0.
- **Product versions** (public-API flow for an existing review submission; it doesn't replace first-review web attachment): list with `--state PREPARE_FOR_SUBMISSION --paginate --output json` (`asc subscriptions versions list --subscription-id "SUB_ID"`, `asc subscriptions groups versions list --group-id "GROUP_ID"`, `asc iap versions list --iap-id "IAP_ID"`). Zero: create (`asc subscriptions versions create --subscription-id "SUB_ID" --output json`, `asc subscriptions groups versions create --group-id "GROUP_ID" --output json`, `asc iap versions create --iap-id "IAP_ID" --output json`) and capture `.data.id`. One: reuse `.data[0].id`. More: stop and require an explicit version ID.
- **Localizations:** create only when the locale is absent, update only when the one resolved localization differs.
  - Subscription: `asc subscriptions versions localizations create --version-id "SUBSCRIPTION_VERSION_ID" --locale "en-US" --name "Premium" --description "Premium access"`; `asc subscriptions versions localizations update --id "SUBSCRIPTION_LOC_ID" --name "Premium" --description "Premium access"`.
  - Group: `asc subscriptions groups versions localizations create --version-id "GROUP_VERSION_ID" --locale "en-US" --name "Premium"`; `asc subscriptions groups versions localizations update --id "GROUP_LOC_ID" --name "Premium"`.
  - IAP: `asc iap versions localizations create --version-id "IAP_VERSION_ID" --locale "en-US" --name "Premium" --description "Unlock premium features"`; `asc iap versions localizations update --localization-id "IAP_LOC_ID" --name "Premium" --description "Unlock premium features"`.
- **Images:** list before uploading or deleting anything; add only when absent; replace (delete, then add) as a separate confirmed branch.
  - Subscription: `asc subscriptions versions images upload --version-id "SUBSCRIPTION_VERSION_ID" --file "./promotional.png"`; `asc subscriptions versions images delete --id "SUBSCRIPTION_IMAGE_ID" --confirm`.
  - IAP: `asc iap versions images create --version-id "IAP_VERSION_ID" --file "./review.png"`; `asc iap versions images delete --image-id "IAP_IMAGE_ID" --confirm`.
- **Inspect, then hand the version ID to [Multi-item submissions](#multi-item-submissions):** `asc subscriptions versions view --id "SUBSCRIPTION_VERSION_ID" --output table`, `asc subscriptions groups versions view --version-id "GROUP_VERSION_ID" --output table`, `asc iap versions view --version-id "IAP_VERSION_ID" --output table`, plus their localization and image lists. Don't add product versions to a submission from the repair step.
- **IAP:** upload a missing legacy review screenshot when diagnostics request one: `asc iap review-screenshots create --iap-id "IAP_ID" --file "./review.png"`. `asc iap submit` was removed in 5.0.0. Apple may require the first IAP, a new IAP type or a non-renewing IAP to be selected with the next app version: prepare localization, pricing and review screenshots, then (web session) `asc web review iaps attach --app "APP_ID" --iap-id "IAP_ID" --confirm`, or select it manually in the app version's "In-App Purchases and Subscriptions" section.

## Release options

- **Version Release Settings:** Manually release (the version waits in Pending Developer Release); Automatically release after approval; Automatically release no earlier than a date.
- **Pre-order apps** not yet released must be released manually.
- **Apple emails a reminder** if an app stays in Pending Developer Release more than 30 days. After a manual release "it may take up to 24 hours for it to appear on the App Store."

## Phased release

- **Scope:** iOS, macOS and tvOS, version updates only. It releases over 7 days to a random sample of users with automatic updates, without notification.

| Day | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| Users | 1% | 2% | 5% | 10% | 20% | 50% | 100% |

- **It only throttles automatic updates:** "apps and app updates in phased release can be manually downloaded from the App Store by anyone at any time."
- **Pause:** up to 30 days in total, with no limit on the number of pauses; resuming picks up on the same day.
- **Stopped for good** if the app is removed from sale (including a lapsed membership): phased release ends permanently for that version.
- **Enable:** version page > "Phased Release for Automatic Updates" > "Release update over a 7-day period using phased release" > Save. "Release to All Users" is available at any time once the version is Ready for Distribution.

## After you submit

- **Future release dates hold even after approval:** "If your release date is set for the future, the app will not appear on the App Store until that date, even if it is approved by App Review. And remember that it can take up to 24-hours for your app to appear on all selected storefronts."
- **Rejections:** reply to App Review in App Store Connect; appeals are available. Repeated rejections for the same guideline, or manipulation, make review take longer.
- **Expedite requests** exist for critical timing issues; abuse may get future requests rejected.
- **Bug fix submissions** for apps already on the store: "bug fixes will not be delayed over guideline violations except for those related to legal or safety issues." The guidelines themselves: [REVIEW-GUIDELINES.md](REVIEW-GUIDELINES.md).

## Prove it

- An external TestFlight group exists only alongside an internal group, its Test Information has a Beta App Description and Feedback Email, and the build shows in `asc testflight groups list --build-id ...`.
- `asc validate --app "APP_ID" --version "1.2.3" --platform IOS --strict --output table` reports no blocking issues and `asc builds info` shows the build `VALID`.
- The dry run of the chosen lane (`asc release stage`, `asc review submit` or `asc publish appstore`) matches the intended app, version and build before `--confirm`.
- `asc review submissions list --app ... --platform IOS --paginate` shows exactly one submission for the version.
- `asc status --app ... --until review-done --timeout 2h --output json` exits `0`.
- For an update, Phased Release for Automatic Updates is set as intended, and the release option (manual, automatic or dated) is the one you chose.
- For ad hoc: the checks in [AD-HOC-DISTRIBUTION.md](AD-HOC-DISTRIBUTION.md#prove-it) pass.
