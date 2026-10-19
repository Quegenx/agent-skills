# Fastlane App Store operations

ApparenceKit's API-key lanes for metadata, version preparation, upload and optional review submission, originally published for a Flutter app. The source Fastfile assumes Flutter's `build/ios/ipa` artifact path; Flutter produces that artifact before handing it to these store operations. The source and its qualifications are preserved below. For asc migration of fastlane metadata, use [METADATA-AND-SCREENSHOTS.md](METADATA-AND-SCREENSHOTS.md#legacy-fastlane-metadata).

## iOS lanes with an App Store Connect API key

ApparenceKit's production fastlane setup for the iOS side of a Flutter app ([ApparenceKit](https://apparencekit.dev/blog/automate-flutter-ios-deploy-fastlane/), [ApparenceKit](https://apparencekit.dev/flutter-tips/build-deploy-submit-ios-app-fastlane/), [ApparenceKit](https://apparencekit.dev/flutter-tips/automate-apple-store-versioning-with-fastlane/)). It calls fastlane "not optional. It is infrastructure", while [METADATA-AND-SCREENSHOTS.md](METADATA-AND-SCREENSHOTS.md#legacy-fastlane-metadata) treats fastlane metadata as legacy next to the `asc` CLI.

- **Authentication, two sources.** The [Flutter delivery setup](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/BUILD-AND-RELEASE.md#continuous-delivery) uses `apple_id` and `FASTLANE_PASSWORD`. ApparenceKit: "stop using your Apple ID to authenticate. Apple's 2FA will block your automation every time"; use an App Store Connect API key instead, "No passwords, no 2FA, no session tokens that expire."
- **Setup:** an app that builds with `flutter build ipa`, App Store Connect access, Ruby ("macOS comes with it, or use `rbenv`"), `gem install fastlane`; then `cd ios` and `fastlane init`: "Choose option 4 (manual setup) when prompted. This creates the `ios/fastlane/` directory with a `Fastfile` and `Appfile`."
- **The key:** App Store Connect > Users and Access > Integrations > App Store Connect API, **+**, a name such as "Fastlane CI", the **App Manager** role, then download the `.p8` ("you can only download it once"; also [CLI.md](CLI.md)). "Never commit the `.p8` file to git. Add it to `.gitignore` and use environment variables or your CI's secret store."

```bash
export FASTLANE_APP_STORE_CONNECT_API_KEY_ID="YOUR_KEY_ID"
export FASTLANE_APP_STORE_CONNECT_API_ISSUER_ID="YOUR_ISSUER_ID"
export FASTLANE_APP_STORE_CONNECT_API_KEY_PATH="/path/to/AuthKey.p8"
```

- **The Fastfile.** "Every lane calls `load_api_key` first." `download_app_metadata` bootstraps `fastlane/metadata/` from App Store Connect ("Now you can edit them locally and push updates without touching App Store Connect"); `release_new_version` creates a version and pushes metadata "without uploading a binary", for release notes, descriptions or keywords on their own; `deploy` picks up the IPA from `build/ios/ipa/*.ipa` and uploads it. `load_release_notes` falls back to English for every locale without its own file: "If you forget a locale, Apple will reject your submission or show stale release notes. ... You can remove any locale you don't support, but keep the fallback to avoid submission failures."

```ruby
default_platform(:ios)

platform :ios do
  def load_api_key
    app_store_connect_api_key(
      key_id: ENV["FASTLANE_APP_STORE_CONNECT_API_KEY_ID"],
      issuer_id: ENV["FASTLANE_APP_STORE_CONNECT_API_ISSUER_ID"],
      key_filepath: ENV["FASTLANE_APP_STORE_CONNECT_API_KEY_PATH"],
      in_house: false,
    )
  end

  def load_release_notes(metadata_path = nil)
    metadata_path ||= File.join(__dir__, "metadata")
    fallback = File.read(
      File.join(metadata_path, 'en-US/release_notes.txt')
    )
    locales = %w[ar-SA ca cs da de-DE el en-AU en-CA en-GB en-US
                 es-ES es-MX fi fr-CA fr-FR he hi hr hu id it ja
                 ko ms nl-NL no pl pt-BR pt-PT ro ru sk sv th tr
                 uk vi zh-Hans zh-Hant]
    locales.each_with_object({}) do |locale, hash|
      file = File.join(metadata_path, locale, 'release_notes.txt')
      hash[locale] = File.exist?(file) ? File.read(file) : fallback
    end
  end

  lane :download_app_metadata do
    load_api_key
    deliver(
      download_metadata: true,
      download_screenshots: false,
      force: true,
    )
  end

  lane :release_new_version do |options|
    load_api_key
    produce(
      app_identifier: "com.yourcompany.yourapp",
      app_version: options[:version],
    )
    release_notes = load_release_notes('./metadata')
    deliver(
      app_version: options[:version],
      skip_binary_upload: true,
      force: true,
      submit_for_review: false,
      automatic_release: false,
      metadata_path: "./fastlane/metadata",
      release_notes: release_notes,
      precheck_include_in_app_purchases: false,
      skip_screenshots: true,
    )
  end

  lane :deploy do |options|
    load_api_key
    get_push_certificate
    project_root = File.expand_path("../../", __dir__)
    ipa_path = Dir.glob(
      File.join(project_root, "build/ios/ipa/*.ipa")
    ).first
    if ipa_path.nil?
      UI.user_error!("Could not find IPA file.")
    end
    release_notes = options[:version] ? load_release_notes : nil
    upload_to_app_store(
      ipa: ipa_path,
      skip_metadata: true,
      skip_screenshots: true,
      force: true,
      submit_for_review: options[:submit_for_review] || false,
      automatic_release: options[:automatic_release] || false,
      metadata_path: "./fastlane/metadata",
      release_notes: release_notes,
      precheck_include_in_app_purchases: false,
      submission_information: {
        export_compliance_uses_encryption: false,
        export_compliance_encryption_updated: false,
      },
    )
  end
end
```

  The 39-locale list lacks eleven locales App Store Connect accepts today, such as `sl-SI` and `ur-PK` (full list in [METADATA-AND-SCREENSHOTS.md](METADATA-AND-SCREENSHOTS.md)). `release_new_version` passes `'./metadata'` to `load_release_notes` but `"./fastlane/metadata"` to `deliver`; that file notes Deliverfile paths resolve relative to the Deliverfile, so check both paths in your layout.
- **Run it:** `fastlane download_app_metadata`; `fastlane release_new_version version:"1.2.0"`; after `flutter build ipa --release`, `fastlane deploy`, `fastlane deploy submit_for_review:true` or `fastlane deploy version:"1.0.1" submit_for_review:true automatic_release:true`. `submit_for_review:true` submits after the upload; `automatic_release:true` "Ensures the app is automatically released to the App Store once Apple approves it." `get_push_certificate`: "Make sure your push certificates are valid."
- **A release** is `flutter build ipa`, then the release notes in `metadata/en-US/release_notes.txt` (and other locales), then `cd ios` and `fastlane deploy version:"1.2.0" submit_for_review:true`.
- **Metadata layout,** one folder per locale and one text file per field (`fastlane/metadata/en-US/release_notes.txt`, `description.txt`, `keywords.txt`, `fr-FR/...`). Commit it: "This gives you a history of every release note change and makes it easy for translators to submit PRs." Each new version usually needs at least two fields filled per language.
- **Export compliance:** `submission_information` "answers Apple's export compliance questions automatically. If your app uses encryption beyond standard HTTPS, you will need to adjust these values" ([TESTFLIGHT-AND-RELEASE.md](TESTFLIGHT-AND-RELEASE.md)).
- **`force: true`** "skips Fastlane's HTML report preview"; remove it on a first local run "to double-check what Fastlane will push."

## Prove it

- No `.p8` file is committed; every lane starts with `load_api_key`, and `fastlane/metadata/en-US/release_notes.txt` exists as the fallback. [ApparenceKit, automate-flutter-ios-deploy-fastlane]
- The IPA exists after the Flutter build, both metadata paths match the project layout, the requested locales include the source's fallback, the first local run previews what will be pushed, and export-compliance answers describe the binary. [ApparenceKit, automate-flutter-ios-deploy-fastlane]
