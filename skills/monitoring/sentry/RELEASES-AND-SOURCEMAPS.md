# Releases and Source Maps

Releases and debug artifacts turn a raw event into something you can act on: a release ties errors to commits, deploys and regressions, and source maps or debug files turn `chunk-4f2a.js:1:28471` or `0x00000001045a2f10` into a file, line and function. Both setups fail silently: every piece can be individually correct while producing nothing visible, the auth token that does every upload skips the work without failing the build when it is missing, and nothing applies retroactively to events already stored. Platform install and SDK init live in the platform files ([NEXTJS.md](NEXTJS.md), [NODE.md](NODE.md), [BROWSER.md](BROWSER.md), [REACT.md](REACT.md), [REACT-NATIVE.md](REACT-NATIVE.md), [FLUTTER.md](FLUTTER.md), [NESTJS.md](NESTJS.md), [CLOUDFLARE.md](CLOUDFLARE.md)); this file is the upload, matching and release story they share.

**Contents:** [Auth token](#auth-token) · [Source maps: how matching works](#source-maps-how-matching-works) · [Source maps: three ways to upload](#source-maps-three-ways-to-upload) · [Source map troubleshooting](#source-map-troubleshooting) · [Debug files for mobile](#debug-files-for-mobile) · [Diagnose an unreadable stack trace](#diagnose-an-unreadable-stack-trace) · [Releases: the two halves](#releases-the-two-halves) · [Naming and tagging](#naming-and-tagging) · [Creating releases in CI](#creating-releases-in-ci) · [Commits and suspect commits](#commits-and-suspect-commits) · [Resolving and release health](#resolving-and-release-health) · [sentry-cli reference](#sentry-cli-reference) · [Release troubleshooting](#release-troubleshooting) · [Prove it](#prove-it)

## Auth token

- **The auth token is not the DSN.** The DSN is public, safe in source code, and only identifies where events go. The token is a secret that grants write rights (uploading artifacts, creating and finalizing releases). Confusing them is "the most common cause of 'I configured everything and nothing happened.'"
- **Prefer an organization auth token** (org settings, auth tokens): scoped to the org, carries release and upload permissions, and is what the wizard creates. It is shown once at creation; if lost, issue a new one. A personal token works for the Vite plugin when it has "Project: Read & Write" and "Release: Admin", but it ties uploads to one person's account, which "breaks builds when they leave or rotate credentials"; say so if you find one.
- **Agents check presence only.** Have the user configure the token. Keep its value out of chat, tool output, command arguments and checked-in files. Use minimum permissions.

```bash
[ -n "$SENTRY_AUTH_TOKEN" ] && echo "SENTRY_AUTH_TOKEN=set" || echo "SENTRY_AUTH_TOKEN=unset"
```

- **Every tool reads the same environment variables:**

```bash
SENTRY_AUTH_TOKEN=<token>
SENTRY_ORG=<org-slug>
SENTRY_PROJECT=<project-slug>
```

- **Where it lives:** CI uses the provider's secret store (GitHub Actions repository or environment secrets) exposed as `SENTRY_AUTH_TOKEN`. Local release builds use a gitignored `.env.sentry-build-plugin` (the JS bundler plugins read it; the Next.js wizard writes it and gitignores it) or the shell. Apple and Android use a gitignored `sentry.properties` or the build environment. Other inputs: the plugin's `authToken` option, `sentry-cli login` (writes `~/.sentryclirc`), `[auth] token=` in `.sentryclirc`, or `--auth-token`.
- **Never commit it,** never inline it in `next.config.ts`, `vite.config.ts`, `build.gradle` or a checked-in `sentry.properties`, never print or paste it. A committed token means stop and tell the user to revoke it: "rotating is the fix, deleting the line is not."
- **Make failure loud.** "A silent skip is worse than a red build." Fail the build on upload failure where supported (JS bundler plugins expose an `errorHandler` hook; `sentry-cli` exits non-zero on its own); at minimum have CI print whether the token was set.

| Symptom | Cause |
|---|---|
| Build OK, no artifacts, no error | Token unset ("most plugins skip upload silently") |
| `401 Unauthorized` | Token invalid, revoked, or from another org |
| `403 Forbidden` on upload | Token lacks release or upload permission, or the project is out of scope |
| Works locally, not in CI | Token only in a local env file |
| CI works on one branch only | Secret scoped to an environment or protected branch |

## Source maps: how matching works

- **Debug IDs are the recommended and most reliable method.** A Debug ID is a globally unique ID identifying a transformed file and its map. The bundler plugins and `sentry-cli` inject it into build output; "creating a release is no longer required". Requires SDK `7.47+`. It is deterministic from file contents with `sentry-cli` and the webpack, Vite and Rollup plugins; "deterministic Debug IDs for esbuild are not currently supported".
- **Legacy matching** uses `release` + `dist` + file path. It is needed only for JS SDK `<= 7.46.0`, `@sentry/webpack-plugin` `<= 1.x`, `sentry-cli` `<= 2.16.1`, self-hosted `<= 23.6.1`. Prefer upgrading tools over troubleshooting old versions.
- **Two things must both be true:** the build emits maps (bundlers disable them in production by default: `build.sourcemap` in Vite, `devtool` in webpack, `productionBrowserSourceMaps` or plugin defaults in Next.js), and the maps reach Sentry with Debug IDs. Upload both the minified files and the maps; maps must contain the original source in `sourcesContent`.
- **Maps are generated and uploaded only in production builds.** The Vite plugin does not upload in watch or dev mode; `next dev` does not upload. Do not send someone after source maps for a local `next dev` trace.
- **Prefer hidden maps and keep them off the public server.** Generated source maps "may expose them to the public, potentially causing your source code to be leaked": deny access to `.js.map` on the server or use `sourcemaps.filesToDeleteAfterUpload`. Hidden maps are generated and uploaded but lack the `//# sourceMappingURL` comment that points browsers at them.

```typescript
// vite.config.ts
export default defineConfig({
  build: { sourcemap: "hidden" },
});
```

- **Retention:** artifacts with Debug IDs are kept 90 days, time-to-idle (they expire after 90 days unused for processing). Weak release association links `release` (and optional `dist`) without creating the release first.
- **Artifacts must be uploaded before errors occur.** There is no retroactive application: native and Apple events can be reprocessed (https://docs.sentry.io/product/issues/reprocessing/), "Source maps have no equivalent." Re-verify on a new event.
- **Alternative for browser apps:** host maps publicly, which needs "Enable JavaScript source fetching" in project General Settings. Uploading as part of the build is strongly recommended instead.
- **Node:** produce maps for the compiled output that runs (`./dist`, `.next/server`). Running TypeScript directly (`tsx`, `ts-node`, Bun) is usually already readable.

## Source maps: three ways to upload

- **Path A, a bundler plugin (preferred):** `@sentry/vite-plugin`, `@sentry/webpack-plugin`, `@sentry/rollup-plugin`, `@sentry/esbuild-plugin`, or a framework wrapper (`withSentryConfig` in `@sentry/nextjs`, plus `@sentry/react-router` and `@sentry/tanstackstart-react` (Svelte/Nuxt branches are skipped under the selected-stack rule)). It injects Debug IDs, uploads on production builds, can delete maps after upload, and reads `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`. Set deliberately: delete maps after upload for public web apps.
- **Path B, `sentry-cli` (cli `>= 2.17.0`, SDK `>= 7.47.0`):** for build tools without a plugin. Run `inject` before `upload`; `sourcemaps upload` without `sourcemaps inject` "silently falls back to legacy matching". Integrate it into the CI/CD pipeline.

```bash
sentry-cli sourcemaps inject ./dist
sentry-cli sourcemaps upload ./dist
```

```json
{
  "scripts": {
    "build": "tsc && sentry-cli sourcemaps inject ./dist && sentry-cli sourcemaps upload ./dist"
  }
}
```

After `inject`, minified files end with `//# debugId=<debug_id>` and maps contain `"debug_id"`. After `upload`, check Project Settings > Source Maps > "Artifact Bundles".

- **Path C, the wizard:** `npx @sentry/wizard@latest -i sourcemaps` logs in, picks the project, installs packages, and configures the build tool and CI. It is interactive, so the user runs it. It configures upload only and does not init the SDK.

### Vite

Install `npm install @sentry/vite-plugin --save-dev` (SDK `7.47.0`+). Place the plugin after all other plugins. Vite does not load `.env` into `process.env` inside the config; use `loadEnv(mode, process.cwd(), "")`. With Vite 6+ and Rolldown a `[PLUGIN_TIMINGS]` warning for `sentry-vite-plugin` (over 50% of build time) is expected; upload only in production builds and CI.

```javascript
import { defineConfig } from "vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  build: {
    sourcemap: "hidden", // Source map generation must be turned on ("hidden", true, etc.)
  },
  plugins: [
    // Put the Sentry Vite plugin after all other plugins
    sentryVitePlugin({
      org: "<your-org-slug>",
      project: "<your-project-slug>",
      authToken: process.env.SENTRY_AUTH_TOKEN,

      sourcemaps: {
        // As you're enabling client source maps, you probably want to delete them after they're uploaded to Sentry.
        // Set the appropriate glob pattern for your output folder - some glob examples below:
        filesToDeleteAfterUpload: [
          "./**/*.map",
          ".*/**/public/**/*.map",
          "./dist/**/client/**/*.map",
        ],
      },
    }),
  ],
});
```

### Next.js

`next build` generates and uploads maps once `withSentryConfig` has `authToken` (set `SENTRY_AUTH_TOKEN` in CI too). Config and file layout are in [NEXTJS.md](NEXTJS.md#nextconfig-and-withsentryconfig). Upload options:

| Option | Default | Effect |
|---|---|---|
| `sourcemaps.deleteSourcemapsAfterUpload` | `true` | Client maps deleted; server maps kept |
| `widenClientFileUpload` | `false` | Uploads dependency maps; set `true` to fix `[native code]` frames and partial coverage |
| `useRunAfterProductionCompileHook` | | `true` uploads after compile instead of during the webpack build (Next.js 15.4.1+) |

Turbopack upload after build needs `@sentry/nextjs@10.13.0+` and `next@15.4.1+`. Minified traces in production: check `SENTRY_AUTH_TOKEN` in CI. The Vercel integration can upload during deployment.

### Optional `release` and `dist` on upload

"Only follow these optional steps if you have concluded that you absolutely need them. Using `release` and `dist` values will make your artifact upload more specific, but will also make the entire process less forgiving". `sentry-cli sourcemaps upload --release=<release_name> [--dist=<dist_name>] /path` must match `Sentry.init({ release, dist })`; `--release` does not create the release.

## Source map troubleshooting

- **"Sentry not part of build pipeline"** means the deployed JS lacks Debug IDs: run the wizard, use a production build, check the Source Maps settings.
- **Every deployed bundle needs the injected snippet.** Search uploaded bundles for `e._sentryDebugIds=e._sentryDebugIds||{}`. Plugin `debug: true` prints debug info.
- **Events need a `debug_meta` property;** each `raw_stacktrace` frame `abs_path` must match a `debug_meta` image `code_file`.
- **Validate** with https://sourcemaps.io or `--validate` (CLI). Test locally with Mozilla `source-map` (`SourceMapConsumer`, `originalPositionFor`).
- **Upload plain UTF-8, not gzip.** `sentry-cli` `2.4.0`+ has `--decompress`; compress after upload.
- **Do not use `source-map-support`** when uploading maps or in the browser: it overwrites stack traces.
- **Source maps over 190 MiB are not used.**
- **Known conflict:** `posthog-js` `1.207.4` to `1.229.0` (fixed in `1.229.1`).

| Trap | Cause |
|---|---|
| Nothing uploaded | Maps not emitted, or token unset |
| Uploaded but still minified | No `inject` |
| Partially readable | Widen the upload (`widenClientFileUpload`) |
| Broke after a deploy | Upload ran after deploy, or a stale build cache |
| `.map` served publicly | Use hidden maps and delete after upload |
| No code context | Ensure `sourcesContent` |

## Debug files for mobile

Two artifact families exist: **source maps** (JS/TS) and **debug files** (dSYM, ProGuard/R8, `.so` NDK symbols, Dart obfuscation maps). Browser, Node, Next.js, React, Nest, Cloudflare, TanStack Start and React Router need source maps only. React Native needs both. Flutter needs the obfuscation map plus native debug files (plus web source maps). Fixing one family while a second is outstanding is "common on React Native and Flutter".

### React Native and Expo

Setup steps per project type are in [REACT-NATIVE.md](REACT-NATIVE.md#source-maps-and-debug-symbols). Four artifacts: iOS JS maps (`.map`; Hermes `.hbc.map`, from the Xcode build), iOS dSYM (archive or Xcode Cloud), Android JS maps (plus Hermes bytecode map, from Gradle), Android ProGuard/R8 plus NDK `.so` (Gradle).

- **Expo:** the `@sentry/react-native/expo` config plugin uploads maps during `eas build` and local release builds with the token in the environment: `SENTRY_AUTH_TOKEN=<token> npx expo run:ios --configuration Release`. For EAS, put `SENTRY_AUTH_TOKEN` in EAS secrets.
- **Bare React Native:** `npx @sentry/wizard@latest -i reactNative` (the user runs it; it patches the Xcode bundle-and-upload phase and Gradle; verify both). Manual JS upload, where the release must equal the runtime `packageName@version+build`:

```bash
npx sentry-cli sourcemaps upload \
  --org YOUR_ORG \
  --project YOUR_PROJECT \
  --release "my-app@1.0.0+1" \
  ./dist
```

- **Traps:** only one family uploaded (the default React Native failure); Hermes offsets mean the Hermes map was not uploaded; works locally but not on EAS means the token; manual `--release` mismatch; the wizard patched one platform only. Dev builds don't need upload.

### Flutter and Dart

Use [FLUTTER-SYMBOLS.md](FLUTTER-SYMBOLS.md) for build flags, the Dart plugin, native symbol families, web source maps and upload troubleshooting. The Dart map does not fix native crashes and native debug files do not fix Dart frames; uploads must match the build that shipped. [getsentry/sentry-for-ai, sentry-flutter-sdk and debug-artifact references]

### Native layers (used by React Native and Flutter)

- **Apple:** `DEBUG_INFORMATION_FORMAT` = `DWARF with dSYM File` (the default for Release only); `ENABLE_USER_SCRIPT_SANDBOXING` = `NO`. Wizard: `brew install getsentry/tools/sentry-wizard && sentry-wizard -i ios`. Run Script: `sentry-cli debug-files upload --include-sources "$DWARF_DSYM_FOLDER_PATH"` (`--include-sources` bundles source snippets for code context; omit it if your source can't leave the build machine), with `--force-foreground` while debugging; input path `${DWARF_DSYM_FOLDER_PATH}/${DWARF_DSYM_FILE_NAME}/Contents/Resources/DWARF/${EXECUTABLE_NAME}`. Fastlane: `sentry_debug_files_upload(...)`, `download_dsyms`. Self-hosted needs `SENTRY_URL`. Reprocessing: wait at least an hour after upload; it counts against quota again and issue alerts don't fire.
- **Android:** the Gradle `sentry {}` block with `org`, `projectName`, `authToken = System.getenv("SENTRY_AUTH_TOKEN")`, `autoUploadProguardMapping = true`, `includeSourceContext = true`; native symbols via `uploadNativeSymbols` (option names changed across majors and wrong names are silently ignored). Wizard: `npx @sentry/wizard@latest -i android`. The mapping is at `app/build/outputs/mapping/<variant>/mapping.txt`; a manual upload needs the matching UUID in `AndroidManifest.xml`. Obfuscation only runs for release builds.

## Diagnose an unreadable stack trace

1. **Read a real event before touching build config.** Missing, mismatched and partially covered builds look identical. Pull it with `search_issues` then `get_sentry_resource`. "Nothing in the output flags minification or symbolication": unreadable frames have single-character function names, huge column numbers and no source-context line; readable frames carry the context line.
2. **Was it a release build?** Dev builds are usually readable. Degraded frames even locally are a strong signal production will be worse.
3. **Classify:**

| What you see | Go to |
|---|---|
| Minified or hex frames, nothing uploaded | The platform's upload path above |
| Artifacts found but unreadable, missing Debug ID, or mismatched release/dist | Matching, below (uploading again won't help) |
| Some frames readable | A second artifact family is missing |
| Readable file and line but no code | Source context not uploaded |

4. **Matching, four causes in order:** (1) uploaded after the event; (2) the build that uploaded is not the build that shipped (new bundle hashes or binary UUID): upload from the same job before deploy; (3) identifier mismatch (JS modern: Debug ID in both minified file and map; JS legacy: `release` + `dist` + path; Apple: dSYM UUID; Android: mapping UUID vs `AndroidManifest.xml`; React Native manual: `release` as `packageName@version+build`); (4) wrong org or project (`SENTRY_ORG`/`SENTRY_PROJECT` vs the DSN's project, monorepos). The authority is the event's debug-images and processing-errors info in Sentry, not the build log: "A green upload step plus an unreadable frame means matching, every time." For native, `sentry-cli debug-files` can confirm what Sentry holds for a given UUID. If all check out, the code may be unsymbolicatable (vendored code, eval'd bundle, stripped binary); say so.
5. **Whether an upload predates the event** can't be checked through the MCP; it needs the Sentry UI or `sentry-cli`.
6. **Upload scope:** confirm org, project and upload directory; maps can include source and local paths, so restrict to the selected build.
7. **Rules:** upload from the build that ships (wire it into CI), before or during deploy, never after. Prefer the wizard where one exists; use the manual path for CI-only or unrecognized builds.

## Releases: the two halves

A release unlocks regression detection, crash-free rates and release health, suspect commits, "resolve in next release" and `Fixes SENTRY-XXX`. It has two halves that must agree on one string: the **tag** (SDK `release` and `environment`) and the **release object** (CI creates it, associates commits, finalizes it, records the deploy). "Either half alone produces nothing visible, and neither errors when the other is missing."

- **Diagnose before writing CI config.** Read a recent event's `release` tag exactly (`search_issues` then `get_sentry_resource`). Then check the object by that exact name: `get_release_details` returns commits with author and repo and deploys with environment; `find_releases` lists releases with `lastCommit` / `lastDeploy` (a null `lastCommit` is not proof). Both are catalog tools reached through `search_sentry_tools` / `execute_sentry_tool`. A `release:<value>` event search only tells you events carry the tag. Grep the repo for a Sentry bundler plugin, `getsentry/action-release` in a workflow, and `sentry-cli releases` in a deploy script.
- **Route by symptom:** no release or `release: unknown` → [Naming and tagging](#naming-and-tagging); tagged but no object or no commits → [Creating releases in CI](#creating-releases-in-ci); object with commits and a deploy but zero events → a name mismatch ([Release troubleshooting](#release-troubleshooting); "re-running the pipeline won't fix a mismatch"); no suspect commits → [Commits and suspect commits](#commits-and-suspect-commits).
- **Four silent-failure rules:** derive one name once so the tag and the CI release are byte-identical, and agree the scheme first ("changing it later orphans every release under the old one"); an existing bundler plugin does most of the CI half, so configure it and don't add a second pipeline ("two releases will fight over the same name"); full git history in CI (`fetch-depth: 0`); auth token in CI secrets.
- **Setup order:** (1) configure the SDK (release, sessions, and `environment`); (2) upload source maps or debug files (also needed before suspect commits); (3) associate commits (repository integration plus set-commits); (4) notify the deploy and finalize the release. Tell Sentry about a new release before sending events with that name; otherwise Sentry auto-creates it on the first event (or on source map upload), and auto-created releases are bare labels with no commits, no finalize and no deploy.
- **The SCM integration is an OAuth flow** in the Sentry UI that an agent cannot do: Settings → Integrations → GitHub/GitLab → install → add repo. Say so and give the click path.

## Naming and tagging

- **Byte-identical names.** The SDK release name must match the CI release name exactly: a `v` prefix, short vs full SHA, or a trailing build number all break it. Compute it once into an environment variable both read.
- **Names are global per organization,** so prefix them with something project-specific (`checkout-api@1.0.0`, `projectA-1.0`). A name cannot contain newlines, tabs, `/` or `\`, cannot be entirely `.`, `..` or a space, and is at most 200 characters. Avoid `1.0.0 (42)` / `VERSION_NUMBER (BUILD_NUMBER)`: parentheses are how Sentry displays `foo@1.0+2`, so using them in the name errors.
- **Schemes:** semver `package@version+build` (e.g. `my.project.name@2.3.12+1234`; required for mobile, where `package` is the bundle/package id, `version` is `CFBundleShortVersionString` / `versionName`, and `build` is `CFBundleVersion` / `versionCode`) or the full commit SHA (`sentry-cli releases propose-version`). Sentry auto-detects semver; regression detection and `release:latest` sorting differ between semver and SHA/time-based names. "Don't switch schemes casually mid-project." Semver detection: with 2 or fewer releases it looks at the latest; 3 to 9, any of the latest 3; 10 or more, any of the latest 3 and 3 of the latest 10.

| Platform | Where the name comes from | How to set it |
|---|---|---|
| Bundled JS (`browser`, `react`, `nextjs`, `react-router-framework`, `tanstack-start`, `cloudflare`) | The bundler plugin detects it (Cordova, Heroku, AWS CodeBuild, CircleCI, Xcode, Gradle, else git `HEAD` SHA) and injects it | `release.name` in plugin options, or `SENTRY_RELEASE` at build time |
| Server JS (`node`, `nestjs`) | `SENTRY_RELEASE` at runtime | `release` in `Sentry.init` (e.g. `"my-project-name@" + process.env.npm_package_version`) or `SENTRY_RELEASE` |
| Flutter / Dart | `name@version` from `pubspec.yaml`; on Android/iOS `packageName@versionName+versionCode` | `options.release`; Flutter Web passes `SENTRY_RELEASE` via `--dart-define` |
| React Native | App version and build number from the native project | `release` and `dist` in `Sentry.init` |

- **Tagging alone** gets release-scoped filtering, regression detection and (where supported) release health; commits, deploys, suspect commits and `Fixes` need the CI half.
- **Don't set `release` in `Sentry.init` when a Sentry bundler plugin is in the build:** the hardcoded init wins and drifts. Change `release.name` in the plugin.
- **React Native:** a custom `release`/`dist` "disables the automatic source map upload script".
- **`dist`** disambiguates builds of the same release (iOS, Android, React Native) and must match between the SDK and the artifact upload. Set `environment` (option or `SENTRY_ENVIRONMENT`) alongside the release.

## Creating releases in CI

Order: full-history checkout (`fetch-depth: 0`) → build with the name baked in → create the release and upload artifacts from this build → associate commits → finalize → deploy and record the deploy. The release step runs after the build and before the deploy.

**Path A, the bundler plugin (check first; don't add a parallel `sentry-cli`):**

```js
sentryVitePlugin({
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  release: {
    // name:      defaults to a detected CI value, else the git HEAD SHA
    // inject:    true  - injects the name into the bundle for the SDK
    // create:    true  - creates the release in Sentry
    // finalize:  true  - finalizes when the build ends
    // setCommits: { auto: true } - associates commits
    deploy: {env: 'production'},
  },
})
```

Defaults: `inject`, `create`, `finalize` are `true` and `setCommits` is `{auto: true}`; `deploy` is not set by default. It needs `fetch-depth: 0`; an undetectable name silently creates no release. Escapes: `setCommits: {auto: true, ignoreMissing: true}`, `setCommits: {repo: 'owner/name', commit: '<sha>'}`, `setCommits: false`, `release.vcsRemote`.

GitHub Actions workflow setup is skipped under the repository's scope rule. Keep the standalone plugin and sentry-cli release paths below; no Actions workflow recipe is imported. [user standing rules; getsentry/sentry-for-ai, release references]

**Path C, `sentry-cli`:**

```bash
VERSION=$(sentry-cli releases propose-version)
sentry-cli releases new "$VERSION"
sentry-cli releases set-commits "$VERSION" --auto
sentry-cli releases finalize "$VERSION"
sentry-cli deploys new --release "$VERSION" -e production
```

`new -p project1 -p project2` targets several projects. `--finalize` on `new` collapses steps, but finalizing at deploy time is more accurate: finalization anchors "next release" resolution and is the base for `--auto`.

**API without the CLI:** `POST https://sentry.io/api/0/organizations/<org>/releases/` with `Authorization: Bearer $SENTRY_AUTH_TOKEN` and body `version`, `projects`, `commits[{id, repository, author_name, author_email, timestamp, message, patch_set[{path, type: A|M|D}]}]`. `patch_set` powers suspect commits and suggested assignees, `author_email` makes the assignee resolvable, `timestamp` controls ordering. Use auth tokens, not the deprecated API keys.

**Mobile:** Flutter's `sentry_dart_plugin` creates the release (`release` defaults to `name@version`, `commits` to `auto`, `ignore_missing: true`). The Android Gradle plugin and the Apple Xcode phase upload artifacts only: create the release from CI. React Native's bundled `sentry-cli` integration creates the release for default names only.

## Commits and suspect commits

- **Associate commits** (error issues only):

```bash
# Assumes you're in a git repository
export SENTRY_AUTH_TOKEN=<your-sentry-auth-token>
export SENTRY_ORG=<your-org-slug>
VERSION=$(sentry-cli releases propose-version)

# Create a release
sentry-cli releases new -p project1 -p project2 $VERSION

# Associate commits with the release
sentry-cli releases set-commits --auto $VERSION
```

- **`set-commits` options:** `--auto`; `--local` uses the local git tree; `--commit "owner/repo@<sha>"` or `"owner/repo@<prev>..<current>"` (repo names from `sentry-cli repos list`); `--ignore-missing` after amend, rebase or squash. Without an SCM integration, `--auto` falls back to local git. First-release depth, a conflict between sources: the associate-commits page and the shared `ci-pipeline.md` reference say the latest 10 to 20 commits (depending on the integration), the CLI releases page says the latest 20 without a repository integration; all name `--initial-depth` to change it. `--ignore-missing` falls back to the default commit count instead of failing the build.
- **Suspect commits, mechanism 1 (primary):** SCM integration plus code mappings plus blame on the in-app frame's file and line; the most recent commit under 1 year old is the suspect. It doesn't need releases. **Mechanism 2 (fallback):** file matching against release commit data from `set-commits`.
- **Prerequisites:** readable in-app frames, frames marked in-app, and events after setup (no backfill).
- **Code mappings** are auto-created for JavaScript, Python, Java, PHP, Ruby, Go, C# and Kotlin with the GitHub integration. Derive Stack Trace Root and Source Code Root from an in-app frame's `filename` vs the repo path (`src/main.py` vs `flask/src/main.py` gives `src/` and `flask/src/`). UI: Settings → Integrations → [SCM] → Configurations → Configure → Code Mappings → Add Mapping. CLI: `sentry-cli code-mappings upload ./mappings.json` (CLI 3.3.4+, org token with `org:ci` scope), entries `{"stackRoot": …, "sourceRoot": …}`, most specific first. Prefer a non-empty stack trace root; Java and other package-name platforms use a package path (`io/sentry/android/core`). One mapping per repo per project. Code mappings also power source context and CODEOWNERS-based ownership.
- **Missing suspect commits, checked in order:** no in-app frames → bad code mappings → issue predates the integration → blame older than 1 year → integration disconnected → fallback without `set-commits` / `patch_set`.
- **Auto-assign:** Project → Settings → Ownership Rules → "Auto-assign to suspect commits". Manual assignments are never reassigned. The author must be an org member matched by email; GitHub "Keep my email address private" blocks the match. Ownership rules are in [ISSUES-AND-ALERTS.md](ISSUES-AND-ALERTS.md#ownership-rules-and-code-owners).

## Resolving and release health

- **Resolve options:** "Resolved in the current release" (semver comparison, else creation date), "Resolved in the next release", "Resolved in a commit" (a regression goes to For Review).
- **`Fixes PROJECT-NAME-12A`** in a commit message links immediately but resolves when a release containing that commit is created; `fixes <SHORT-ID>` in a PR title or description resolves when the merge commit is in a release.
- **Release health needs sessions** (on by default in most SDKs); supported for Flutter, browser and Node JavaScript, React Native, among others. The tag alone does not give commits, deploys, suspect commits or `Fixes`. Release-health sessions are not Session Replay and are not billed. Set the user on `initialScope` for crash-free-user and adoption data.
- **Browser sessions** start on page load and continue across client-side navigations; a hard reload starts a new one. "Before SDK version 11, the SDK started a new session on each client-side navigation by default." Disable by filtering `"BrowserSession"` out of the default integrations. Statuses: `unhandled` (unhandled error or rejection; `crashed` before v11), `errored`.
- **Session modes:** user mode (app start or foreground; a background under 30 seconds doesn't restart it) vs server mode (request sessions). Active means the last 24 hours. Session statuses: Abnormal, Crashed, Errored, Healthy, Unhandled. Since v25.9.0 crashes and unhandled errors are counted separately. Search crash events with `error.unhandled:true`.
- **Sessions are not subject to inbound filters or sampling,** so crash counts won't match crashed sessions. Crash rate monitors alert below crash-free thresholds.
- **Adoption stages** (mobile, single environment), computed hourly over the last six hours with a 10% threshold: Adopted, Low Adoption, Replaced (`release.stage:adopted|low|replaced`).

## sentry-cli reference

- **`sentry-cli` is for CI/CD;** the new interactive Sentry CLI is at https://cli.sentry.dev/.
- **Org on `releases`, project on the subcommand:** `sentry-cli releases -o my-org new -p my-project 1.0`. Validate configuration with `sentry-cli info`.
- **Deploys:** `sentry-cli deploys new --release "$VERSION" -e ENVIRONMENT [-t seconds]` (also `sentry-cli releases --org ORGANIZATION_SLUG deploys VERSION new -e ENVIRONMENT`); `deploys list --release "$VERSION"`. Deploys cannot be deleted.
- **`sourcemaps upload`** rewrites by default (flattens indexed maps, inlines sources, validates). Options: `--dist`, `--no-sourcemap-reference`, `--no-rewrite`, `--strip-prefix` / `--strip-common-prefix`, `--validate`, `--url-prefix '~/static/js'` (default `~/`), `--ext` (default `js`, `map`, `jsbundle`, `bundle`), `--ignore`, `--ignore-file .sentryignore`, `--strict`, `--decompress`.

| Config key | Default / note |
|---|---|
| `SENTRY_AUTH_TOKEN` | The token |
| `SENTRY_API_KEY` | Legacy |
| `SENTRY_URL` | `https://sentry.io/` |
| `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_DSN` | |
| `SENTRY_VCS_REMOTE` | `origin` |
| `SENTRY_ALLOW_FAILURE` | Unblocks CI during Sentry outages, but you lose symbolicated crashes; keep artifacts to re-upload later |
| `SENTRY_HTTP_MAX_RETRIES` | 5 |
| `SENTRY_LOG_LEVEL` | `warn` |
| `dif.max_item_size` | 1MB |
| Others | `SENTRY_PIPELINE`, `CUSTOM_HEADER`, `http_proxy`, `dif.max_upload_size`, `SENTRY_DISABLE_UPDATE_CHECK`, `SENTRY_NO_PROGRESS_BAR`, `SENTRY_LOAD_DOTENV`, `SENTRY_DOTENV_PATH`, `SENTRY_PROPERTIES` |

## Release troubleshooting

| Symptom | Cause and fix |
|---|---|
| `release: unknown` | SDK not tagging, or plugin `inject` off |
| Object with commits and deploy but 0 events | Name mismatch |
| No commits | Commit association never ran |
| `set-commits --auto` fails, or "Unable to Fetch Commits" email | Rewritten history or shallow clone: `fetch-depth: 0` plus `--ignore-missing` / `ignoreMissing: true` |
| "Resolve in next release" never resolves | Release never finalized |
| Release health empty | No sessions, no `environment`, or unsupported platform |
| Production crash-free rate looks terrible | Staging events land in the same environment: set `environment` per build, record deploys into the right one |
| Suspect commit shows, no suggested assignee | Commit author not in the org, or email hidden |
| No deploys | `deploys new` never ran |
| Two releases per build | Plugin and CLI both ran |
| `403` on `code-mappings upload` | Token lacks `org:ci` |
| One project's release swallowed another's events | Names are org-global; prefix them |

- **Through the MCP:** `release:<exact-name>` works on both `search_events` and `search_issues`; `firstRelease:<name>` is `search_issues` only ("On `search_events` it is silently rewritten to `release:`"). Check the CI half with `get_release_details`. In the terminal: `sentry-cli repos list`, `sentry-cli deploys list --release "$VERSION"`.

## Prove it

- `SENTRY_AUTH_TOKEN` is set in CI secrets (presence check prints `set`), never committed, and CI prints whether it was set or fails on upload failure.
- After a production build, deployed bundles contain `e._sentryDebugIds=e._sentryDebugIds||{}` (or minified files end with `//# debugId=`), Project Settings > Source Maps lists the Artifact Bundles, and no `.map` file is publicly served.
- A new event from the deployed build (not one that predates the setup, which "stays minified, correctly") shows readable frames with a source-context line. On React Native and Flutter, both artifact families are readable.
- The event's `release` tag matches the release object byte for byte; `get_release_details` or `sentry-cli deploys list --release "$VERSION"` shows commits and a deploy in the right environment.
- An issue shows a suspect commit, or you name the outstanding prerequisite (usually SCM OAuth or readable stack traces). "Don't judge the setup by an issue that predates it; Sentry does not backfill."
