# OpenTelemetry Collector to Sentry

Sends traces and logs from an OpenTelemetry Collector into Sentry through the Sentry Exporter (always capitalized "Sentry Exporter"), a component of `otelcol-contrib`. Collector and OpenTelemetry concepts in general are the `observability` skill ([observability SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/SKILL.md)); SDK setup per platform is in the platform files ([NODE.md](NODE.md), [NODE-TRACING.md](NODE-TRACING.md)). What decides most outcomes: the collector version (v0.145.0 or later), an Internal Integration token with the right permissions loaded from an env file, and whether the app's traces are connected to its other Sentry events. Collector traces without `otlpIntegration` "appear in Sentry but are not connected to other Sentry events (errors, logs)".

**JavaScript version boundary:** retained vendor examples target the stated SDK 10 era source unless marked 11; read the [SDK 11 migration](UPGRADE.md#v10-to-v11) before applying them to 11. Native Flutter/RN SDK versions are separate. [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/]

**Contents:** [Checklist](#checklist) · [Existing config](#existing-config) · [Install the collector](#install-the-collector) · [Project creation](#project-creation) · [Write the config](#write-the-config) · [Credentials](#credentials) · [Validate and run](#validate-and-run) · [Connect app traces](#connect-app-traces) · [Troubleshooting](#troubleshooting) · [Prove it](#prove-it)

## Checklist

1. Check for an existing collector config.
2. Check the collector version or install it.
3. Decide the project-creation setting.
4. Write the config.
5. Write env placeholders.
6. Run.
7. Verify.
8. Add `otlpIntegration` to the app (Node.js, also Python and Ruby).

## Existing config

- **Search** for YAML files containing `receivers:` and for files named `otel-collector-config.*`, `collector-config.*`, `otelcol.*`.
- **Reuse the existing authorized configuration.** Modify within the task scope and preserve other exporters; ask only if choosing a separate configuration would materially change the authorized scope. The source requested fresh confirmation; this repository retains existing permission. [getsentry/sentry-for-ai, OTel workflow; user standing rules]

## Install the collector

- **Requires otelcol-contrib v0.145.0 or later.** Check with `which otelcol-contrib` or `./otelcol-contrib`, parse the version and record the collector path. At 0.145.0 or later skip to project creation; below it, or not installed, install. Ask whether to run it as a binary (no Docker) or in Docker.
- **Latest tag:**

```bash
curl -s https://api.github.com/repos/open-telemetry/opentelemetry-collector-releases/releases/latest | grep '"tag_name"' | cut -d'"' -f4
```

- **The URL path uses the `v` prefix; the filename and the Docker tag don't.**

| OS and arch | Suffix |
|---|---|
| Darwin + arm64 | `darwin_arm64` |
| Darwin + x86_64 | `darwin_amd64` |
| Linux + x86_64 | `linux_amd64` |
| Linux + aarch64 | `linux_arm64` |

- **Binary:** detect the platform with `uname -s` and `uname -m`, then download and extract. "Perform these steps for the user; do not just show them the commands."

```bash
curl -LO https://github.com/open-telemetry/opentelemetry-collector-releases/releases/download/v<numeric_version>/otelcol-contrib_<numeric_version>_<os>_<arch>.tar.gz
tar -xzf otelcol-contrib_<numeric_version>_<os>_<arch>.tar.gz
chmod +x otelcol-contrib
```

- **Tarball cleanup:** remove only a task-created download when cleanup is already within scope; do not delete a user-owned archive. The source required separate confirmation even for its own download. [getsentry/sentry-for-ai, OTel workflow; user standing rules]
- **Docker:** check `docker --version`, then `docker pull otel/opentelemetry-collector-contrib:<numeric_version>`.

## Project creation

- **Ask; don't recommend either option,** and wait for the answer.
- **Yes (`auto_create_projects: true`):** projects are created from `service.name`; needs at least one team, and all are assigned to the first team found; initial data may be dropped while a project is being created; the token needs Project: Write. Warn that the exporter scans all projects and uses the first team it finds; with no teams, create one first.
- **No:** the projects must exist first.

## Write the config

- **Start from the templates:** `https://raw.githubusercontent.com/open-telemetry/opentelemetry-collector-contrib/main/exporter/sentryexporter/docs/example-config.yaml` and the spec `https://raw.githubusercontent.com/open-telemetry/opentelemetry-collector-contrib/main/exporter/sentryexporter/docs/spec.md`.
- **Add the `sentry` exporter** under `exporters:` and to the `traces` and `logs` pipelines, with credentials as `${env:SENTRY_ORG_SLUG}` and `${env:SENTRY_AUTH_TOKEN}`. In an existing config, don't remove or modify other exporters unless the user asks. Read the spec only for options the example doesn't show.
- **Add a temporary `debug` exporter** with `verbosity: detailed` (recommended; it logs all telemetry to the console), and remove it after verification.

## Credentials

- **Placeholders only:** write `SENTRY_ORG_SLUG=your-org-slug` and `SENTRY_AUTH_TOKEN=your-token-here`, never real credentials, and always call them placeholders ("I'll add placeholder environment variables for you to fill in", not "Let me add the environment variables").
- **Environment file:** use the project's established gitignored configuration within existing authorization; ask when multiple choices materially affect scope. The source required a new choice even when the repository already establishes the file. [getsentry/sentry-for-ai, OTel workflow; user standing rules]
- **Wait for the user** to confirm the real values are set before validating.
- **Org slug:** Settings > Organization Settings > Organization Slug; it is also the subdomain (`myorg` in `https://myorg.sentry.io`).
- **Token:** Settings > Developer Settings > Custom Integrations > Create New Integration > Internal Integration, then Create New Token.

| Permission | Needed |
|---|---|
| Organization: Read | Required |
| Project: Read | Required |
| Project: Write | Only for `auto_create_projects` |

## Validate and run

- **Validate (binary;** load the env file first):

```bash
set -a && source "<env_file>" && set +a && "<collector_path>" validate --config "<config_file>"
```

- **Validate (Docker;** volume mounts need absolute paths, so prefix relative ones with `$(pwd)/`):

```bash
docker run --rm \
  -v "<config_file>":/etc/otelcol-contrib/config.yaml \
  --env-file "<env_file>" \
  otel/opentelemetry-collector-contrib:<numeric_version> \
  validate --config /etc/otelcol-contrib/config.yaml
```

- **On failure,** fix the config and validate again until it passes; then ask whether the user is ready to run the collector, and wait.

- **Run: give the user the command, don't execute it.** Binary:

```bash
set -a && source "<env_file>" && set +a && "<collector_path>" --config "<config_file>"
```

- **Docker:**

```bash
docker run -d \
  --name otel-collector \
  -p 4317:4317 \
  -p 4318:4318 \
  -p 13133:13133 \
  -v "<config_file>":/etc/otelcol-contrib/config.yaml \
  --env-file "<env_file>" \
  otel/opentelemetry-collector-contrib:<numeric_version>
```

- **Re-run:** `docker stop otel-collector 2>/dev/null; docker rm otel-collector 2>/dev/null` first.

## Connect app traces

- **`otlpIntegration` gives trace connectedness,** "linking OTel traces to Sentry errors, logs, crons, and metrics", and sets up distributed tracing propagation automatically. Available for Node.js, Python and Ruby; skip this step for other SDKs. Node docs: https://docs.sentry.io/platforms/javascript/guides/node/.

```bash
npm install @sentry/node-core @opentelemetry/api @opentelemetry/sdk-trace-node @opentelemetry/sdk-trace-base
```

`instrument.mjs`:

```javascript
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import * as Sentry from '@sentry/node-core/light';
import { otlpIntegration } from '@sentry/node-core/light/otlp';

const provider = new NodeTracerProvider();
provider.register();

Sentry.init({
  dsn: '___PUBLIC_DSN___',
  integrations: [
    otlpIntegration({
      collectorUrl: 'http://localhost:4318/v1/traces',
    }),
  ],
});
```

- **Start** with `node --import ./instrument.mjs app.mjs`. Use the collector's actual OTLP HTTP endpoint; the default is `http://localhost:4318/v1/traces` if running locally.
- **"Do not set `tracesSampleRate` when using `otlpIntegration`; OTel controls sampling. Setting it would conflict with the OTLP path."**
- **Platform log drains are a different path:** Drains use the platform's own export (Vercel, Cloudflare Workers, Heroku, OpenRouter, Supabase, Shopify Hydrogen; logs and traces only), while OTLP forwarding is for your own collector pipeline ([SUPABASE.md](SUPABASE.md#log-drain)).

## Troubleshooting

| Symptom | Cause or fix |
|---|---|
| "failed to create project" | The token lacks Project: Write |
| "no team found" | Create a team |
| "invalid auth token" | Use an Internal Integration token, not a user auth token |
| "connection refused" on 4317/4318 | The collector isn't running, or a port conflict |
| Env var errors during validation | The `.env` isn't loaded, or still has placeholders |
| "container name already in use" | `docker stop otel-collector && docker rm otel-collector` |
| Traces in Sentry but not linked to errors or logs | Add `otlpIntegration` to the app |

## Prove it

- **The config validates:** the `validate` command exits cleanly with the env file loaded.
- **The collector starts clean:** no startup errors and connection logs present (`docker logs otel-collector` for Docker); the `debug` exporter prints the spans.
- **Data lands:** traces and logs appear in Sentry within 60 seconds, in the right project (or the auto-created one named after `service.name`).
- **Traces connect:** with `otlpIntegration`, an error thrown inside a traced request shows the collector trace on the issue.
- **Clean up:** the temporary `debug` exporter is removed, the env file is gitignored, and no real token is in any checked-in file.
