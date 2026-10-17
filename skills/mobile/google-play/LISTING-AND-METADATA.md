# Listing and Metadata

The store listing is the page users see on Google Play: name, descriptions, icon, feature graphic, screenshots and video, per language, plus up to 50 custom listings and A/B experiments on top. What decides most outcomes is Google's metadata policy (no ranking, price or promotional claims, no emoji or repeated keywords) and the asset specs; files kept in version control and pushed through an edit keep it repeatable. Google's Help Center is the authority; facts from the gplay CLI's third-party author are marked as the CLI's where they differ. Google's values here were rechecked against the raw Help Center pages on 2026-10-17. Keyword and conversion strategy is [../aso/SKILL.md](../aso/SKILL.md); edits and CLI auth are [CLI.md](CLI.md).

**Contents:** [Text fields and limits](#text-fields-and-limits) · [Metadata policy](#metadata-policy) · [Graphic assets](#graphic-assets) · [Preview video](#preview-video) · [Metadata as files](#metadata-as-files) · [Screenshots: capture and upload](#screenshots-capture-and-upload) · [Custom store listings](#custom-store-listings) · [Store listing experiments](#store-listing-experiments) · [Prove it](#prove-it)

## Text fields and limits

The main listing lives at Grow users > Store presence > Main store listing; graphics are in its "Graphics" section.

| Field | Limit |
|---|---|
| App name (title) | 30 characters, one localized name per language (Metadata policy: "Your app title must be 30 characters or less") |
| Short description | 80 characters |
| Full description | 4000 characters |
| Alt text (feature graphic, each screenshot) | "using 140 characters or less"; don't start with "photo of" or "image of" |
| Subscription listing title / description | 55 / 80 characters (see [BILLING-AND-PURCHASES.md](BILLING-AND-PURCHASES.md)) |

- **Limits count both widths:** "Character limits apply to both full-width and half-width characters": the numbers are the maximum regardless of character type.
- **Contact details:** set on Grow users > Store presence > Store settings, under "Contact Details": a support email address (required), a phone number and a website URL ("we also highly recommend including a website"). They are shown on the store listing. CLI: `gplay details get --edit`; `gplay details update --edit --contact-email --contact-phone --contact-website`.
- **Languages:** the default is English (United States, `en-US`). Add translations and localized graphics, or users may see automated translations ("automated translations aren't supported for Armenian, Raeto-romance, Tagalog, and Zulu"). Locale codes look like `en-US`, `es-ES`, `fr-FR`, `de-DE`, `ja-JP`. Don't use machine translation without review.
- **Short description:** summarize the core function or purpose and what makes it unique; avoid duplicating its messaging across the short description, screenshots, feature graphic and video, since they may be shown side by side. "Do not include special characters, line breaks, emojis, emoticons, repeated punctuation ... or symbols" (standard characters of your language, and ©, ®, ™, are allowed). "Do not use capitalization for emphasis"; only capitalize the app name if the listing's app name is capitalized.
- **Title:** "Ensure your app's title and description accurately describe its functionality."
- **License:** publishing grants Google a license to use the icon, screenshots and videos for promotion.

## Metadata policy

- **Repetitive or irrelevant keywords** in the app name, description or promotional description can get the app suspended.
- **Title, icon, developer name:** "Don't use emojis, emoticons, or repeated special characters in these metadata elements. Avoid ALL CAPS unless it is part of your brand name."
- **Description:** "Excessive length, detail, improper formatting, or repetition can result in a violation of this policy." No word blocks or keyword lists (Google's bad example: "Car racing, car driving, race cars, car races, ..."), no comparisons with other apps or brands. The policy applies to all translations of the listing.
- **No performance, ranking, price or promotion claims,** and no implied relation to Google Play programs, in text or images. Violation examples: "App of the year", "#1", "Best of Play 20XX", "Popular", "10% off", "$50 cash back", "free for limited time only", "Editor's choice", "New".
- **Also avoid in assets and copy:** "Best," "#1," "Top," "New," "Discount," "Sale," "Million Downloads" (the feature graphic list adds "Free"); calls to action like "download now," "install now," "play now," "try now"; unnecessary keywords; time-sensitive copy; device imagery and store badges; third-party trademarked characters or logos without permission. In preview video copy, "Awards from Google Play such as 'Best Of' are allowed to be displayed."
- **No misleading icon symbols** ("new message dot indicator when there are no new messages and download/install symbols when the app is not related to downloading content"), and no unattributed or anonymous user testimonials in the description.
- **Suitable for a general audience** whatever the content rating: no sexually suggestive imagery, profanity, graphic violence or depictions of illicit drug use in the listing.

## Graphic assets

Required to publish: app icon, short description, feature graphic, and "a minimum of two screenshots across different device types". "Requirements" are mandatory ("failure to meet requirements may result in removal or suspension"); "Highly recommended" items affect recommendation and promotion eligibility.

| Asset | Google's spec |
|---|---|
| App icon | 32-bit PNG with alpha, 512 x 512 px, max 1024 KB; meets the Google Play icon design specifications; no badges or text suggesting ranking, price or Play categories |
| Feature graphic | JPEG or 24-bit PNG (no alpha), 1024 x 500 px; keep key elements away from cutoff zones; no device imagery or store badges |
| Phone screenshots | Up to 8 per supported device type; JPEG or 24-bit PNG (no alpha); min dimension 320 px, max 3840 px; long side no more than twice the short side |
| Tablet / Chromebook | "a minimum of 4 screenshots", between 1,080 and 7,680 px, 16:9 landscape or 9:16 portrait |
| Wear OS | At least one screenshot of the current app, app interface only, 1:1, min 384 x 384 px, no device frames, no transparent backgrounds or masking |
| Android TV | At least one TV screenshot plus a TV banner (1280 x 720 px, JPEG or 24-bit PNG, no alpha) |
| Android Automotive OS | Required unless the app is in a parked app category; if provided, at least 2 portrait (800 x 1,280 px) and 2 landscape (1,024 x 768 px), generic system UI only |
| Android XR | Between 4 and 8 screenshots, PNG or JPEG, up to 8 MB each, 8:5 (recommended 3840 x 2400, minimum 1920 x 1200) |

- **Promotion eligibility (highly recommended):** to be eligible for formats that use screenshots, apps need at least four screenshots at 1080 px minimum (16:9 landscape min 1920 x 1080, or 9:16 portrait min 1080 x 1920); games at least three 16:9 or three 9:16 screenshots at those minimums. "Taglines should not take up more than 20% of the image." Prioritize UI in the first three screenshots.
- **Screenshots must represent the actual app:** "Screenshots must demonstrate the actual in-app or in-game experience"; no people interacting with the device unless usage is off-device.
- **Where the CLI's author differs from Google:** it lists image types `phoneScreenshots` (required), `sevenInchScreenshots`, `tenInchScreenshots`, `tvScreenshots`, `wearScreenshots`, `icon` (512x512), `featureGraphic` (1024x500), `promoGraphic` (180x120), `tvBanner` (1280x720), with phone screenshots 2 to 8, and says "PNG or JPEG required (PNG recommended), max 8 MB per image". Google caps the icon at 1024 KB and requires 24-bit PNG without alpha for feature graphics and screenshots; follow Google's spec.

## Preview video

- **One YouTube URL:** a single video (no playlist or channel, no timecode parameters); ads disabled (turn off monetization; with copyrighted content, use a different video); public or unlisted, not private; not age-restricted; embeddable. Not required, but highly recommended for games.
- **Content:** it "may autoplay inline with muted audio up to 30 seconds"; show the actual experience "as early as possible within the first 10 seconds"; "Aim for at least 80% of the video to be representative of the user experience." The video shows before the screenshots, with the feature graphic as its cover.

## Metadata as files

Keep metadata in version control, validate before import, and keep descriptions current. The gplay CLI reads the Fastlane tree:

```
fastlane/metadata/android/<locale>/{title.txt, short_description.txt, full_description.txt, video.txt, images/{phoneScreenshots, sevenInchScreenshots, tenInchScreenshots, tvScreenshots, wearScreenshots}/, images/icon.png, images/featureGraphic.png}
```

- **Export:** `gplay sync export-listings --package ... --dir ./fastlane/metadata/android`; `gplay sync export-images ...`.
- **Diff and validate:** `gplay sync diff-listings`; offline `gplay validate listing --dir ... --locale en-US`.
- **Import:** `gplay sync import-listings`; `gplay sync import-images`.
- **Read in an edit:** `listings list|get --edit $EDIT_ID [--locale en-US]`.
- **`listings update` clears what you leave out.** It sets all fields for a locale through flags (`--title`, `--short-description`, `--full-description`, `--video`); fields not provided are cleared. Use `listings patch` for partial updates.
- **New locale:** copy the `en-US` directory, translate, import.
- **Image commands:** `gplay images upload|list|delete --edit --locale --type --file|--image IMAGE_ID --confirm`. `images delete-all --locale --type --confirm` clears a type for a locale; `--confirm` defaults to false and it refuses without it.

## Screenshots: capture and upload

- **Capture is not gplay-specific:** `adb shell screencap` then `adb pull`, or Espresso / UI Automator, switching the emulator locale with `setprop persist.sys.locale`.
- **Screen recording for a preview video or a bug repro** [ApparenceKit](https://apparencekit.dev/flutter-tips/android-adb-cheat-sheet/): record with the command below, and turn the touch indicator on and off. The article's show-touches commands end their lines with a backslash followed by a space, which breaks shell line continuation; here they are with the trailing spaces removed:

```bash
adb shell screenrecord /sdcard/demo.mp4
```

  Fix: the article writes `screenrecord -p /sdcard/video.mp4`; `screenrecord` has no `-p` option (its options are `--help`, `--size`, `--bit-rate`, `--time-limit`, `--rotate`, `--verbose`). The command above is the official one; stop with Control+C, or it stops at three minutes, and audio is not recorded (https://developer.android.com/tools/adb#screenrecord).

```bash
adb shell content insert \
--uri content://settings/system \
--bind name:s:show_touches \
--bind value:i:1
```

```bash
adb shell content insert \
--uri content://settings/system \
--bind name:s:show_touches \
--bind value:i:0
```

- **Order by filename:** screenshots upload in filename order, so prefix `1_`, `2_`.
- **Validate:** `gplay validate screenshots --dir ./metadata --output table` (add `--locale en-US`).
- **Every image write goes through an edit:** create, then upload or import, then validate, then commit.

```bash
EDIT_ID=$(gplay edits create --package com.example.app | jq -r '.id')
```

- **Upload options:** (A, preferred) bulk `gplay sync import-images --package --edit "$EDIT_ID" --dir ./metadata` (add `--locale en-US`, `--dry-run`); (B) individual `images upload`; (C) `gplay release ... --screenshots-dir ./metadata`.
- **`--edit` conflict:** the metadata-sync guide shows `sync import-images` without `--edit`; the screenshot guide says it "Requires an open edit" and passes `--edit`. Check `gplay sync import-images --help`.
- **Finish:** `gplay edits validate --package ... --edit $EDIT_ID`, then `gplay edits commit`.

## Custom store listings

- **Up to 50:** "You can create up to 50 custom store listing pages." Customize name, icon, descriptions and graphic assets; contact details, privacy policy and category are shared with the main listing.
- **Targeting:** country or region ("you can only target a country with one custom store listing at a time"); pre-registration; churned (uninstalled), lapsed ("haven't opened your app in the last 28 days"), or lapsed and churned users; non-buyers, one-time buyers, repeat buyers, lapsed buyers ("haven't bought in the last 180 days"); ads traffic; search keywords; custom audiences.
- **Unique URL:** a string parameter unique across all your custom listings (lowercase alphanumerics plus `.`, `-`, `_`, `~`), served at `https://play.google.com/store/apps/details?id=[packageName]&listing=[parameter]`.
- **No automated translations:** "Custom store listings aren't automatically translated"; pick a default language and add translations for the languages spoken in the targeted countries.
- **Google Ads listings** must be fully reviewed and approved, then selected as a landing page in Google Ads.

## Store listing experiments

- **Types:** default graphics (icon, feature graphic, screenshots in the default language; users viewing a language that has localized graphics are excluded) and localized (also descriptions, in up to five languages).
- **Concurrency:** "For each app, you can run one default graphics experiment or up to five localized experiments at the same time"; up to 2 variants.
- **Target metric:** Unique user install clicks, Unique user open clicks, or Unique user pre-registration clicks.
- **Settings:** audience percentage, minimum detectable effect, confidence level ("Increasing the confidence level decreases the likelihood of a false positive").
- **Scope:** experiments run on default and custom store listings. Test one asset at a time.
- **End:** "Store listing experiments stop automatically after running for 6 months"; then traffic reverts to the current listing and no variant is applied. Apply the winning variant from the recommendation, or "Keep current listing".

## Prove it

- **Text fits:** `gplay validate listing --dir ... --locale <locale>` passes for every locale; title at most 30 characters, short description at most 80, full description at most 4000.
- **No policy words:** a search of every title, short and full description finds none of "#1", "Best", "Top", "New", "Free", "Sale", "download now", no emoji, and no ALL CAPS outside the brand name.
- **Assets meet spec:** the icon is a 512 x 512 32-bit PNG under 1024 KB; the feature graphic is 1024 x 500 with no alpha; at least two screenshots, each long side at most twice the short side.
- **Screenshots pass:** `gplay validate screenshots --dir ./metadata --output table` reports no errors and the files sort in the intended order.
- **The edit is clean:** `gplay edits validate` passes before `gplay edits commit`.
- **Nothing got cleared:** after a listing change, `gplay sync diff-listings` shows only the fields you meant to change.
