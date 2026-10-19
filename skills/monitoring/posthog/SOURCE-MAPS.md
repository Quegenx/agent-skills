# PostHog source maps

PostHog symbol injection, uploads and symbolication troubleshooting, kept together through the deployed artifact lifecycle. Exception capture stays in [ERROR-TRACKING.md](ERROR-TRACKING.md); issue investigation stays in [ERROR-TRIAGE.md](ERROR-TRIAGE.md). [PostHog skills, ERROR-TRACKING.md; ERROR-TRIAGE.md]

## Source maps and symbols

[PostHog skills, ERROR-TRACKING.md]

- **Compiled or minified code needs source maps.** If they are not publicly hosted, upload them during the build. Python, Ruby and PHP have no source maps: link releases instead (`/docs/error-tracking/link-releases.md`).
- **The wizard** sets up upload for JS and TS frameworks and works for coding agents: `npx @posthog/wizard upload-source-maps`.
- **Platform guides** live at `/docs/error-tracking/upload-source-maps/<platform>.md`: Web, Next.js, Node.js, React, Angular, Nuxt, React Native, Android (upload-mappings), Flutter, Go, iOS, Kotlin Multiplatform (upload-debug-symbols), Rust, Rollup, Webpack, Vite, CLI.
- **Upload packages:** `@posthog/rollup-plugin`, `@posthog/webpack-plugin`, `@posthog/nextjs-config`, `@posthog/nuxt`, or `posthog-cli` directly. The build plugins call `posthog-cli sourcemap process`.
- **Symbol data types:** `source-and-map` (JS/TS web), `hermes` (React Native), `proguard` (Android), `apple-dsym` (iOS/macOS).

### The CLI

[PostHog skills, ERROR-TRACKING.md]

- **Install:** `npm install -g @posthog/cli`, `curl -LsSf https://download.posthog.com/cli | sh`, `brew install posthog/tap/posthog-cli` or `cargo install posthog-cli`.
- **Auth:** `posthog-cli login`, or in CI the env vars `POSTHOG_CLI_HOST` (default `https://us.posthog.com`), `POSTHOG_CLI_PROJECT_ID` and `POSTHOG_CLI_API_KEY` (a personal API key with the `error tracking write` and `organization read` scopes). EU: `posthog-cli --host https://eu.posthog.com [CMD]`. `--dotenv-file .env` loads a file.

```bash
# Inject release and chunk metadata into sourcemaps
posthog-cli sourcemap inject --directory ./path/to/assets
# Upload injected sourcemaps to their release
posthog-cli sourcemap upload --directory ./path/to/assets --release-name my-app --release-version 1.2.3 --build 42
```

- **Check for the `//# chunkId=...` comment** in the minified code after injecting.
- **You must serve the injected assets.** Serving copies from before the inject breaks unminification.
- **For continuous deploys,** set the release name and let the CLI detect the version (the git commit hash). `--delete-after` cleans up the maps.
- **Verify** in the symbol sets (error tracking configuration).

### Next.js

[PostHog skills, ERROR-TRACKING.md]

`npm install @posthog/nextjs-config`. It injects and uploads during the build. Set the env vars on Vercel or your host's project settings, not just locally.

```javascript
import { withPostHogConfig } from "@posthog/nextjs-config";

const nextConfig = {
  //...your nextjs config,
};

export default withPostHogConfig(nextConfig, {
  personalApiKey: process.env.POSTHOG_API_KEY!, // Personal API Key
  projectId: process.env.POSTHOG_PROJECT_ID, // Project ID
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST, // (optional), defaults to https://us.posthog.com
  sourcemaps: { // (optional)
      enabled: true, // (optional) Enable sourcemaps generation and upload, default to true on production builds
      releaseName: "my-application", // (optional) Release name, defaults to repository name
      releaseVersion: "1.0.0", // (optional) Release version, defaults to current git commit
      deleteAfterUpload: true, // (optional) Delete sourcemaps after upload, defaults to true
  },
});
```

### Vite and Rollup

[PostHog skills, ERROR-TRACKING.md]

- **Plugin:** `npm install @posthog/rollup-plugin`; `import posthog from '@posthog/rollup-plugin'` in the `vite.config.js` plugins with `personalApiKey`, `projectId`, `host` and `sourcemaps: { enabled, releaseName, releaseVersion, deleteAfterUpload }`. The Vite page gives the `host` default as `https://us.i.posthog.com`, while the Next.js config and the CLI default to `https://us.posthog.com`; confirm in the current docs.
- **Production maps:** `build: { sourcemap: "hidden" }`. Hidden maps are fine for upload; they are not advertised through `sourceMappingURL`.

### React Native

[PostHog skills, ERROR-TRACKING.md]

- **CLI 0.7.8+.** React Native web: `npx expo export --source-maps --platform web`, then the CLI.
- **Automatic injection only on Expo 50+** (debug IDs), in `metro.config.js`: `const { getPostHogExpoConfig } = require('posthog-react-native/metro'); const config = getPostHogExpoConfig(__dirname)`. Upload runs in the Gradle and Xcode builds; EAS Updates (OTA) need a manual `posthog-cli hermes upload --directory dist`.
- **Expo plugin** `"posthog-react-native/expo"` in `expo.plugins`. Options: `disableSandboxing` (default `true`, sets `ENABLE_USER_SCRIPT_SANDBOXING=NO`); `skipOnConflict` (4.49.1+); `dotenvFile` (4.60.0+, CLI 0.8.4+); `uploadNativeSymbols`, opt-in, for dSYM, ProGuard and NDK `.so` files, `{ includeSource: true }`.
- **Bare React Native:** on Android, `apply from: ... 'tooling', 'posthog.gradle'` above `android {}`; on iOS, wrap the "Bundle React Native code and images" phase with `posthog-xcode.sh` and disable User Script Sandboxing. The error `Sandbox: bash deny(1) file-read-data` points at sandboxing.
- **Native crash symbolication** needs build-time symbols, runtime `errorTracking.autocapture.nativeCrashes` or `androidNdkCrashes`, `@posthog/react-native-plugin`, and the project's "Enable exception autocapture".

### Flutter

[PostHog skills, ERROR-TRACKING.md]

- **CLI 0.7.4+.** Flutter web: `flutter build web --source-maps`, then CLI inject and upload.
- **iOS and macOS with `captureNativeExceptions`:** upload dSYMs (the iOS guide). **Android with ProGuard or R8:** upload mapping files with the PostHog Gradle plugin. The Flutter debug symbols guide is `/docs/error-tracking/upload-source-maps/flutter.md`.

When traces still show minified frames, follow [Symbolication](#symbolication).

## Symbolication

[PostHog skills, ERROR-TRIAGE.md]

Symbolication is the cross-platform name for JS source map lookup, Hermes function-offset resolution, Proguard/R8 demangling and dSYM address-to-line lookup. The pipeline is build config, then the generated symbol artifacts, then the symbol set uploaded to PostHog, then the captured error frame. Only the JavaScript platform has a detailed reference so far. Upload setup is in [Source maps and symbols](#source-maps-and-symbols).

1. **Find how symbols are produced and uploaded.** Grep the config for `posthog|sourcemap|sourceMap|deleteAfterUpload|releaseName|releaseVersion|projectId|envId`.
2. **Build and inspect the local artifacts.** If they already look wrong, fix the build before debugging the upload. Keep artifacts on disk after upload while debugging:

```ts
sourcemaps: {
  enabled: true,
  deleteAfterUpload: false,
}
```

3. **Check the symbol sets in PostHog:** `posthog:error-tracking-symbol-sets-list` with `ref=<chunk_id>`, then `-retrieve`; in the UI, **Project settings > Error tracking > Symbol sets**.
4. **Compare local, uploaded and served.** `posthog:error-tracking-symbol-sets-download-retrieve` returns a presigned URL valid for one hour: download it right away and don't echo the URL unless asked. The file is a PostHog symbol-data container (compressed Rust-encoded payload, magic bytes `posthog_error_tracking`), not JSON. Extract it with `posthog-cli symbol-sets extract symbolset.bin -o ./extracted` (or `npx @posthog/cli ...`, `bunx @posthog/cli ...`); it handles all four types.
5. **Fix the most likely layer.**

- **Symbol set row fields:** `ref` must match the frame's `chunk_id`; `last_used` updating means PostHog loaded the set, not that the frame resolved; `has_uploaded_file: false` means the upload did not complete; a non-null `failure_reason` means it could not be parsed or loaded.
- **Frame fields to collect:** `filename` (should match the deployed binary's URL), `line`/`lineno`, `column`/`colno`, `function`, `chunk_id`, `resolve_failure`.

| Evidence | Likely cause | Next check |
|---|---|---|
| No `chunk_id` on frames | Chunk ID injection missing, or the SDK frame parser did not map the filename | Inspect the deployed binary and raw frame filenames |
| Symbol set row missing | Upload went to another project or host, or skipped this asset | Compare plugin `projectId`, `host`, `ref` |
| `has_uploaded_file: false` | Upload did not finish | Build logs; compare `posthog-cli` output to the row |
| Non-null `failure_reason` | Uploaded symbol data could not be parsed | Download and inspect the extracted contents |
| Uploaded valid, deployed binary differs | Deployment, CDN or post-build transform changed the binary | Compare deployed bytes to the local build |
| `Token not found` | The captured position matched no token | Verify the position (line/column for JS, frame offset for Hermes and dSYM), binary identity, coverage |

- **Local versus uploaded:** both empty means the build tool emitted unusable symbols; local valid and uploaded empty means upload processing packed the wrong data; uploaded valid but production still minified means the deployed binary differs from the uploaded one.
- **Platform-neutral fixes:** upload after the final build output exists; use the latest PostHog plugin and `posthog-cli`; re-upload deliberately when the same `ref` was uploaded before with different content; remove deployment-time transforms (CDN minify, edge rewrites, compression).

### JavaScript

[PostHog skills, ERROR-TRIAGE.md]

- **List package versions deeply,** because `@posthog/cli` and Rollup are often transitive: `pnpm list @posthog/rollup-plugin @posthog/webpack-plugin @posthog/nextjs-config @posthog/nuxt @posthog/cli vite rollup webpack next nuxt --depth 8` (npm `npm ls ...`, yarn classic `yarn list --pattern ...`, bun `bun pm ls | grep ...`).
- **Inspect the build:** `find dist -type f \( -name '*.js' -o -name '*.mjs' -o -name '*.cjs' -o -name '*.map' \) -print`, and `rg -n "chunkId=|_posthogChunkIds|sourceMappingURL" dist`. For each map check `mappings`, `sources`, `sourcesContent` and `names` lengths, empty mappings, `chunk_id`/`debug_id`, the JS `chunk_ids`, and `sourceMappingURL`.
- **A healthy artifact:** the JS has the `chunkId` marker and `_posthogChunkIds` registration; `sourceMappingURL` only when maps are deliberately public; the map has non-empty `mappings` and `sources`; `sourcesContent` is present when source context should appear.
- **The smoking gun is empty mappings** (with zero `sources` and `names`): the bundler emitted a map with no data, upstream of PostHog. On Vite/Rollup the cause is `config.build.sourcemap` unset while a Vite-internal plugin (`vite:css-post`, `vite:build-import-analysis`) skipped sourcemap generation in `renderChunk`; reproducible on Vite 7/Rollup with CSS, IIFE or import-analysis paths. The log says "[plugin vite:css-post] Sourcemap is likely to be incorrect: a plugin (vite:css-post) was used to transform files, but didn't generate a sourcemap for the transformation". Workaround: `build.sourcemap: 'hidden'` (or `true`).
- **A coarse summary of one map** with a `jq` one-liner:

```bash
jq '{
  version,
  file,
  chunk_id,
  sourceRoot,
  mappingsLength: (.mappings | length),
  sourcesLength: (.sources | length),
  sourcesContentLength: (.sourcesContent | length),
  namesLength: (.names | length),
  firstSources: .sources[0:5]
}' dist/assets/app.js.map
```

- **JS failure rows:** empty local `mappings` points at bundler settings or plugin order; local valid and uploaded empty points at a CLI or plugin bug, or the wrong file uploaded.
- **Fixes:** enable production source maps; move the PostHog plugin later in the plugin order so it sees the final chunks; remove post-build minification, CDN rewrites, asset transforms and compression. Resolved names but no context means `sourcesContent` is missing.
- **Debug logging:** for the CLI,

```bash
POSTHOG_CLI_HOST="$POSTHOG_HOST" \
POSTHOG_CLI_PROJECT_ID="$POSTHOG_PROJECT_ID" \
POSTHOG_CLI_API_KEY="$POSTHOG_PERSONAL_API_KEY" \
RUST_LOG=posthog_cli=debug \
posthog-cli sourcemap process --directory dist --release-name my-app --release-version 0.0.0
```

  For plugin builds, add `logLevel: "debug"` to the same `posthog({ ... })` options that hold `personalApiKey` and `projectId`. Read the log for: files processed, chunk IDs injected, uploads skipped because content matched, changed content skipped because forced overwrite was off, and maps missing, empty or unparsable.

## Prove it

[PostHog skills, ERROR-TRACKING.md]

- **Frames resolve:** the minified build has a `//# chunkId=...` comment, the deployed assets are the injected ones, the symbol set appears in Project settings > Error tracking > Symbol sets, and a production error shows your source file names and lines.
