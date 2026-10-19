# kitcn setup and operations

Setup guidance comes from [udecode/kitcn, references/setup/index.md, server.md, biome.md, expo.md, react.md, next.md, start.md] and the [CLI registry](https://kitcn.dev/docs/cli/registry). This is the optional kitcn branch of the existing Convex skill. It documents commands and their effects; running them still follows the task's authorization and [deployment selection](OPERATIONS.md). The source bootstrap runbook does not migrate an existing Ents or legacy data layer; use [migration planning](MIGRATIONS-AND-RECOVERY.md) for that work.

## Choose the bootstrap path

[udecode/kitcn, references/setup/index.md, Bootstrap and decisions; references/setup/expo.md; https://kitcn.dev/docs/cli/registry]

| Job | Documented command or boundary |
|---|---|
| Fresh Next.js, TanStack Start, Vite or Expo app | `npx kitcn@latest init -t <next|start|vite|expo> --yes` |
| Adopt the current supported web app | `npx kitcn@latest init --yes`; unsupported shells fail rather than guessing |
| Choose output directory/name | `init --cwd <path> --name <name>` |
| Add selected capabilities | `kitcn add auth`, `kitcn add ratelimit`, `kitcn add resend` |
| Framework not covered by the scaffold | Use the corresponding server/React integration docs rather than inventing a scaffold |

- Backend selection resolves `--backend`, then `kitcn.json.backend`, then `convex`. This topic covers Convex, not the source's alternative-backend branch.
- Resolve framework, existing data layer, auth provider, SSR/RSC and the need for triggers, aggregates, rate limits, scheduling, HTTP, RLS and auth plugins from the actual task. The source's defaults are not an instruction to add every capability or repeat an already answered questionnaire.
- Establish the non-auth backend/client baseline before auth, then auth sign-in before optional policy/plugins. The source's automatic build/test gates become [acceptance evidence](#prove-it) under the user's execution rules.
- `init` owns the integration layer; framework tooling owns the shell; `add` owns optional capabilities. Source internal modes map Next App Router to `next-app`, Expo to `expo`, and Next Pages/Vite/React Router/TanStack Start/manual integration to `react`.
- The Next template preserves the shadcn shell. It mounts Providers in layout, adds the `@convex/*` alias, patches baseline dependencies/scripts, and adds `kitcn codegen` as `codegen` or `convex:codegen` if that name is occupied. It resolves root versus `src/` layouts and fails on conflicting roots.
- Vite's baseline supplies React providers and backend/env/codegen wiring, without RSC helpers or the source's initial `/convex` demo route. The source's React auth scaffold does not invent page/router UX.
- Expo uses the official `create-expo-app` shell, a native messages screen and the default auth scaffold with managed schema refresh. Existing Expo adoption is not supported by this scaffold; it adds no styling framework beyond Expo's baseline. [https://kitcn.dev/docs/expo]

## File and import ownership

[udecode/kitcn, references/setup/index.md, references/setup/server.md, references/setup/biome.md; https://kitcn.dev/docs/server/setup; https://kitcn.dev/docs/cli/backend]

Resolve the configured functions directory first; these paths describe the supplied layout. Its baseline uses `convex.json.functions: convex/functions`, static codegen, a root `@convex/*` alias to `convex/shared/*`, and `strictFunctionTypes: false`. These are source setup choices, not a mandate to weaken unrelated application configuration.

| Location | Ownership and consumers |
|---|---|
| `convex/functions/schema.ts` | App schema, tables, relations and selected extensions |
| `convex/lib/crpc.ts` | Shared builders; [auth import boundaries](KITCN-AUTH.md) apply |
| `convex/lib/get-env.ts` | Shared typed `createEnv`/`getEnv()` contract when selected |
| `convex/functions/_generated/` | Native Convex generated contracts |
| `convex/functions/generated/server.ts` | Codegen-owned server/context/ORM surface, rewritten from schema before reading app modules |
| `convex/functions/generated/auth.ts` | Generated auth entrypoint |
| `convex/functions/generated/<module>.runtime` | Generated application Caller/Handler factories |
| `convex/functions/generated/procedure-names.gen.ts` | Procedure lookup rebuilt only by full-scope generation |
| `convex/shared/api.ts` | Generated `api`, `Api`, `ApiInputs`, `ApiOutputs`; `TableName`, `Select`, `Insert` when schema exports `tables` |
| `src/lib/convex/` | Client auth, query-client, cRPC and provider modules; framework-specific server helpers |
| `convex/functions/convex.config.ts` | One `defineApp()` composition for selected actual components |

- Do not hand-create `convex/shared/api.ts`, add a parallel `convex/lib/orm.ts` or repair codegen-owned server files manually. Missing generated exports require bootstrap/codegen, not fabricated stubs.
- The source uses static imports in backend functions/libs/routers. Its shared directory is client-importable: client code reaches `convex/shared` through `@convex/*`, not backend functions/libs; backend code does not import `src/`; shared code does not pull server runtime code. A type-only generated-auth import is the source's narrow lint exception.
- The selected kitcn backend imports wrapped context/ORM helpers from `generated/server`, not raw `_generated/server`; that generated adapter itself is the exception. This does not ban native Convex APIs outside kitcn's chosen layer.
- The source excludes both generated directories from linting. Existing [Ultracite guidance](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/ultracite/SETUP-AND-MIGRATION.md) owns provider presets and upgrades. Source `biome.md` used old `ultracite/core`, `/react`, `/next` after an unpinned install; current official paths are `ultracite/biome/core`, `/react`, `/next`. [https://github.com/haydenbleasel/ultracite/blob/main/skills/ultracite/references/upgrades/v7.md]
- Keep Node runtime globals available where the source setup requires them and test-only globals in a separate test tsconfig. The source's temporary `skipLibCheck` suggestion is a setup option to remove after dependency stabilization, not proof that incompatible package versions work. Do not add `@ts-nocheck` or downgrade lint rules to hide broken application types. [udecode/kitcn, references/setup/index.md, Type-clean baseline; SKILL.md, Review checklist]

## Dev and codegen

[udecode/kitcn, references/setup/server.md, Codegen; https://kitcn.dev/docs/cli/backend]

| Command | Effect and boundary |
|---|---|
| `kitcn dev` | Initializes Convex, generates runtime/API files, watches changes and runs the backend loop |
| `kitcn dev --bootstrap` | One-shot local bootstrap |
| `kitcn verify` | One-shot local runtime proof through the dev path; stop the long-running local backend first |
| `kitcn codegen` | One-off generation against a configured, active backend; not an extra default step alongside dev |
| `kitcn codegen --scope all` | Default full generation, shared API, auth/server outputs, lookup and module runtimes |
| `kitcn codegen --scope auth` | Auth/server outputs and auth runtime when auth has a default export |
| `kitcn codegen --scope orm` | Server and ORM-internal runtime outputs |

Scoped runs can remove stale outputs outside their scope, including the shared API and cRPC runtimes, but preserve `procedure-names.gen.ts` from the last full run. Plugin discovery supplies typing/context; **plugin runtime files are scaffold-owned**, even under a generated-looking path. Do not apply the source plugin checklist's blanket deletion of `generated/plugins` artifacts without tracing the installed scaffold contract. [https://kitcn.dev/docs/cli/backend; udecode/kitcn, references/features/create-plugins.md]

New local/anonymous Convex state is project-local under `.convex/`, including `.convex/local/default/`. The `--yes` local path can bootstrap anonymously when no account is linked. Resolve deployment ambiguity with actual target arguments; `codegen` does not replace backend initialization. The source's automatic `verify` instruction does not authorize running it in this maintenance repository. [udecode/kitcn, references/setup/index.md, Troubleshooting; user standing rules]

## Environment and targets

[udecode/kitcn, references/setup/index.md, Environment; https://kitcn.dev/docs/cli/backend]

| Source setting | Meaning |
|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | Query/subscription client URL; hosted `.convex.cloud`, local source example port 3210 |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | HTTP/router/caller URL; hosted `.convex.site`, local source example port 3211 |
| `NEXT_PUBLIC_SITE_URL`, backend `SITE_URL` | App origin; source local default `http://localhost:3000` |
| `convex/.env` | Backend env-push source; `--from-file` or piped input can replace it |

Update the app origin, backend `SITE_URL` and app dev script together when changing the source's local app port. A hosted `.site` requirement does not exclude the documented local HTTP URL.

- `kitcn dev` manages local auth bootstrap and watches later backend-env edits. `kitcn env push` updates an active selected deployment, filters Convex-managed variables and sends one batch; use its explicit target flags for remote/production work.
- With auth installed, push ensures a local `BETTER_AUTH_SECRET`, fetches `generated/auth:getLatestJwks` and includes JWKS. `--rotate` first calls `generated/auth:rotateKeys`; `--force` overwrites current values. These mutate deployment/auth state.
- `kitcn env pull --out <path>` writes the export format to a file; plain pull prints it. `env set --from-file` can round-trip that format. Do not expose secret-bearing output in reports. [OPERATIONS.md](OPERATIONS.md) owns deployment capability boundaries.
- `--prod`, `--deployment-name`, `--preview-name` and `--env-file` select the target. `env default` sets project defaults for new deployments; it is distinct from changing an existing target.
- `kitcn auth jwks` and its `--json` form print payloads without setting env; `--rotate` changes keys. Use the environment push path when an update rather than a manual export is intended.
- CLI flags override config. `dev.args`, `codegen.args` and `deploy.args` precede passthrough arguments. `--config` selects the config; an explicitly missing file errors, whereas absent default config uses defaults. `--api` chooses shared API output. [https://kitcn.dev/docs/cli/backend]

Expo uses `EXPO_PUBLIC_CONVEX_URL`, `EXPO_PUBLIC_CONVEX_SITE_URL` and `EXPO_PUBLIC_SITE_URL` directly in client code. Only static dot access is inlined; do not destructure or use bracket access. Public variables are plain text in the bundle and must contain no secrets. The auth client uses `@better-auth/expo/client` and `expo-secure-store`. [udecode/kitcn, references/setup/expo.md; https://kitcn.dev/docs/expo; https://docs.expo.dev/guides/environment-variables/]

## Plugin plans and installed state

[udecode/kitcn, references/setup/index.md, Plugin CLI; https://kitcn.dev/docs/cli/registry]

| Inspection | Reports |
|---|---|
| `kitcn add <plugin> --dry-run` | Full plan summary without writing |
| `kitcn add <plugin> --diff [path]` | Planned unified diff |
| `kitcn add <plugin> --view [path]` | Planned rendered file |
| `kitcn view <plugin>` | Resolved preset, selection source, docs, files and operations |
| `kitcn info --json` | Paths, versions, installed plugins, missing dependencies, schema/lockfile mismatch and scaffold drift |
| `kitcn docs <topic...>` | Local/public links for CLI, plugins, auth, ORM, migrations, Resend and rate limiting |

Preview includes env bootstrap, config/schema/HTTP/cRPC patches, lockfile, dependency installation, codegen/hooks and reminders. Optional path filters try exact workspace-relative match before substring matching. `add` bootstraps missing baseline seams and is idempotent for unchanged files. Edited scaffold files are refused and preserved; exit 1 and `complete: false` mean partial installation, not success. JSON distinguishes `skipped` from `refused`. Merge deliberately or use `--overwrite` only when authorized; `--no-codegen` skips its automatic generation. [https://kitcn.dev/docs/cli/registry]

The full `add auth --yes` installs default kitcn auth. Later `add auth --schema --yes` refreshes managed auth-owned schema blocks and lockfile after auth/plugin changes. `--preset convex` instead assumes initialized raw Convex, supplies conservative provider/client wiring and does not support `--schema`; it does not invent unsupported pages. Expo uses the default managed path. Admin/org policy remains application-owned, not part of minimal auth. [https://kitcn.dev/docs/cli/registry]

`add ratelimit` creates `convex/lib/plugins/ratelimit/schema.ts`, `convex/lib/plugins/ratelimit/plugin.ts` and `convex/functions/plugins/ratelimit.ts`, and registers `ratelimitExtension()` in the app schema. Accounting and configuration live in [KITCN-RATELIMIT.md](KITCN-RATELIMIT.md). [udecode/kitcn, references/setup/server.md, Rate limiting]

`add resend` scaffolds its schema/plugin/functions and registers `resendExtension()`. If typed env is missing it also creates `convex/lib/get-env.ts` and `paths.env`; the local schema keeps `RESEND_API_KEY` optional, but sending requires the configured key. Source optional email files include `plugins/email.tsx`, runtime plugin, webhook and crons helpers; install React Email only when that surface is selected. Provider behavior stays in [Resend](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/resend/SKILL.md) and [React Email](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/react-email/SKILL.md). [udecode/kitcn, references/setup/server.md, Resend]

## Data lifecycle and diagnostics

[udecode/kitcn, references/setup/index.md, Dev scripts and CLI; https://kitcn.dev/docs/cli/backend]

- `kitcn deploy` first deploys, then runs/polls migrations, then runs/polls aggregate backfill. Wait defaults and strict/drift policy are owned by [migrations](KITCN-ORM.md) and [aggregates](KITCN-AGGREGATES.md); generated helper names belong there once.
- A selected app-owned `init.ts` can be named in `dev.preRun`, which maps to Convex's native dev `--run`. A source `seed.ts` is project-specific and exposes a private mutation used by init. This is optional application bootstrap, not an instruction to add seed/reset files to every project.
- `kitcn reset --yes` clears every table, including internal migration/aggregate state, through `withoutTriggers`. Optional `--before`/`--after` functions surround that wipe. The flag is a CLI requirement, not user authorization to delete data.
- Unknown Convex CLI commands pass through; `kitcn insights` is the upstream insights surface and `run --inline-query` is its documented read-only inspection path. Runtime `ctx.meta.getFunctionMetadata()` and `ctx.meta.getTransactionMetrics()` stay inside functions; do not invent CLI wrappers.
- `kitcn analyze` ranks function isolates; `--deploy` measures the combined deployment shape with shared chunks. `OutMB` is bundled isolate size; `DepMB`/`LocMB` are source sizes of contributing dependency/application files; `Files` counts byte-contributing files. Fully tree-shaken imports count in none of them.
- Positional regex selects entries; `--details` shows package graph and `--input` adds internal inputs. `--all` includes all ignored entries; ignored entries with detected handlers already participate. `--interactive` is hotspot-only and incompatible with `--deploy`. The source tool's WARN/DANGER MB thresholds are bundle diagnostics, not a new severity scale; findings in this repo remain P0 to P3. [https://kitcn.dev/docs/cli/backend]

## Troubleshooting

[udecode/kitcn, references/setup/index.md, Troubleshooting; https://kitcn.dev/docs/server/setup]

| Symptom | Inspect before changing code |
|---|---|
| Missing `@convex/api` or `ctx.orm` | Bootstrap, generated API and generated `initCRPC` import |
| `Local backend isn't running` | Active deployment/dev loop; one-off codegen needs that backend |
| `Cannot prompt for input in non-interactive terminals` | Deployment-target arguments and the documented local bootstrap path |
| `OrmReader` lacks insert/update | Query versus mutation builder/context capability |
| `useCRPC must be used within CRPCProvider` | Provider nesting in [KITCN-REACT.md](KITCN-REACT.md) |
| HTTP fails while queries work | HTTP `.site` or local HTTP URL, not subscription URL |
| Malformed JWKS analysis error | Static JWKS JSON, auth config fallback and selected deployment env |
| Sign-in loop or cookies missing | App/backend origins, provider credentials, auth routes, CORS and env; [auth](KITCN-AUTH.md) and [HTTP](KITCN-HTTP.md) own details |
| `UNAUTHORIZED` on a protected procedure | Session middleware and userId attachment, not just metadata |
| Start helper import fails | `kitcn/auth/start` for loader helper, `kitcn/auth/start/server` for server adapter |
| Init/seed hangs or unresolved promise | Recursive trigger/reconciliation path; [ORM trigger guidance](KITCN-ORM.md) |
| Aggregate drift or disabled leftovers | Current readiness/rebuild rules in [KITCN-AGGREGATES.md](KITCN-AGGREGATES.md), not legacy component/defineTriggers repair |
| Missing limiter table | Selected rate-limit scaffold/schema registration |
| Invite mail absent | Resend schema registration and app-owned templated-email wiring |

## Prove it

[udecode/kitcn, references/setup/index.md, Baseline, auth and completion gates; user standing rules]

Read the configured roots, generated exports, selected capabilities, installed versions, managed/scaffold ownership and provider mount. Identify the actual local/hosted query and HTTP origins. Acceptance evidence covers a public query/mutation/HTTP route before auth; then sign-in, a successful protected call and signed-out rejection before optional policy. Distinguish planned commands from executed evidence. In this repository do not run tests, builds, `kitcn verify`, installs, env pushes, deployment, seeds or reset as an automatic verification step. The source requested those runtime gates; the user's execution permission governs.
