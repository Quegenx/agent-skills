# Provisioning and API

Everything in Grafana that you click together can also be declared: server settings in `grafana.ini`, data sources, dashboards, plugins and alerting in provisioning YAML, and the same resources through the HTTP API, Terraform, `gcx` or Git Sync. The mechanism that decides most outcomes is ownership: each resource should have exactly one source of truth (a file, Terraform, Git Sync or the UI), with stable `uid`s so references survive, and secrets passed as environment variables, never literals. Alerting resources are in [ALERTING.md](ALERTING.md); RBAC, SSO and service-account policy are in [ADMIN-AND-AI.md](ADMIN-AND-AI.md).

**Contents:** [grafana.ini](#grafanaini) · [How file provisioning works](#how-file-provisioning-works) · [Data source provisioning](#data-source-provisioning) · [Data source settings by type](#data-source-settings-by-type) · [Dashboard provisioning](#dashboard-provisioning) · [Plugins and service accounts](#plugins-and-service-accounts) · [HTTP API](#http-api) · [Annotations](#annotations) · [Grafana as code](#grafana-as-code) · [Debugging](#debugging) · [Prove it](#prove-it)

## grafana.ini

- **Location:** defaults in `<WORKING DIRECTORY>/conf/defaults.ini`, overrides in `conf/custom.ini`, or `--config`; Deb/RPM installs use `/etc/grafana/grafana.ini`.
- **Read at startup, never live-reloaded:** restart after every change. Sections are process-level, not per-org.
- **Server and database:** `http_port = 3000`, `domain`, `root_url`; `[database] type = postgres` with its connection keys. **Set `root_url`, not only `domain`:** OAuth callbacks are built from it, and `domain` alone may mismatch the IdP's redirect URIs.
- **SMTP** (needed for email contact points): `[smtp]` with `enabled`, `host` (e.g. `smtp.gmail.com:587`), `user`, `password`, `from_address`, `from_name`. Verify by sending a test email from Alerting > Contact points.
- **`[security]`:** `admin_user` and `admin_password` are only consulted on first startup; change the password later with `grafana-cli admin reset-admin-password <new-password>`. `allow_embedding = true` is required for iframe embedding.
- **`[feature_toggles]`:** `enable = publicDashboards`; several are space-separated: `enable = publicDashboards correlations grafanaApiServer`.
- **Alerting:** `[unified_alerting]` (enabled by default since Grafana 9) and its HA keys are in [ALERTING.md](ALERTING.md#server-config-and-ha). The Grafana OSS config reference also shows `[alerting] enabled = true` alongside it.
- **SSO sections** (`[auth.generic_oauth]`, `[auth.github]`, SAML): [ADMIN-AND-AI.md](ADMIN-AND-AI.md#sso).
- **Inspect a running server:** `curl http://localhost:3000/api/health` returns `{"database": "ok", ...}`; `curl http://localhost:3000/api/admin/settings | jq '.database'` shows the config.

## How file provisioning works

Docs: https://grafana.com/docs/grafana/latest/administration/provisioning/

- **Provisioning files live under `provisioning/`** (`datasources/`, `dashboards/`, `plugins/`, `access-control/`, `alerting/`), and are version-controllable.
- **Environment variables:** `$ENV_VAR_NAME` or `${ENV_VAR_NAME}` work in all provisioning config, for values only (not keys or structure), and in dashboard provider config but not inside dashboard JSON files.
- **`${}` is replaced first, then `$`.** A secret containing `$` (e.g. `Pa$sw0rd`) referenced as `${PASSWORD}` resolves to `Pa`; reference it as `$PASSWORD`. Escape a literal `$` as `$$`.
- **Reload behavior differs between sources:** the Grafana OSS skill says restart Grafana after writing provisioning YAML; its data source reference says Grafana "loads on startup and watches for changes"; the datasources-provisioning skill says files "apply on Grafana start or a provisioning reload". Confirm in the current docs.
- **Config management:** Puppet, Ansible (grafana-ansible-collection), Chef, NixOS `services.grafana.provision`. Enterprise adds RBAC provisioning via files or Terraform.

## Data source provisioning

- **Workflow:** write `provisioning/datasources/<name>.yaml`, restart, then health-check through the API (or open `/connections/datasources/edit/<uid>` and click **Test**).
- **Keys:** `name`, `type`, `access` (`proxy` or `direct`), `orgId`, `uid`, `url`, `isDefault` (one per org), `jsonData`, `secureJsonData` (stored encrypted), `version`, `editable`.
- **`deleteDatasources` is processed first;** `prune: true` deletes provisioned data sources removed from the file. With several Grafana instances, set and increment `version` per data source.
- **`name` must be unique across the instance,** even across different types. **`uid` must be unique and immutable** so dashboards can reference it.
- **Always set `access`, defaulting to `proxy`:** queries go through the Grafana server, the secure default. Use `direct` (browser to data source) only when explicitly asked.
- **Only Organization Admins** can add or remove data sources in the UI (Connections > Data sources, Configuration > Data sources in older versions > Add new data source > Save & Test).

LGTM plus Pyroscope, with Tempo linked to logs and metrics:

```yaml
# provisioning/datasources/datasources.yaml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    jsonData:
      timeInterval: 15s
      httpMethod: POST

  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100

  - name: Tempo
    type: tempo
    access: proxy
    url: http://tempo:3200
    jsonData:
      tracesToLogsV2:
        datasourceUid: loki_uid
        tags: [{ key: "service.name", value: "app" }]
      serviceMap:
        datasourceUid: prometheus_uid
      nodeGraph:
        enabled: true

  - name: Pyroscope
    type: grafana-pyroscope-datasource
    url: http://pyroscope:4040
```

With `version`, locked editing, Loki derived fields to Tempo, and a SQL secret from the environment:

```yaml
# /etc/grafana/provisioning/datasources/prometheus.yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    version: 1
    editable: false
    jsonData:
      timeInterval: "15s"
      queryTimeout: "60s"
      httpMethod: POST

  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
    jsonData:
      maxLines: 1000
      derivedFields:
        - datasourceUid: tempo
          matcherRegex: "traceID=(\\w+)"
          name: TraceID
          url: "${__value.raw}"

  - name: MySQL Production
    type: mysql
    url: mysql:3306
    database: mydb
    user: grafana
    secureJsonData:
      password: "$GRAFANA_MYSQL_PASSWORD"
    jsonData:
      maxOpenConns: 100
      maxIdleConns: 100
      connMaxLifetime: 14400
```

### Any plugin: generate from its schema

1. **Ask first:** from scratch (the user names a plugin) or from an existing data source in a running instance.
2. **Get the canonical plugin id** `<org>-<name>-datasource`. An id containing `-datasource` or `-app` is already canonical; otherwise search the catalog, and if several match, show the candidates and ask.

```bash
curl -s "https://grafana.com/api/plugins?filter=infinity" \
  | jq -r '.items[] | "\(.slug)\t\(.name)"'
# → yesoreyeram-infinity-datasource    Infinity
```

3. **Resolve the latest version** with `curl -s "https://grafana.com/api/plugins/yesoreyeram-infinity-datasource" | jq -r '.version'`. Never hard-code a version: the CDN path is version-pinned and a stale version 404s.
4. **Fetch the settings schema:**

```bash
ID=yesoreyeram-infinity-datasource
VER=$(curl -s "https://grafana.com/api/plugins/$ID" | jq -r '.version')
curl -sf "https://plugins-cdn.grafana.net/$ID/$VER/public/plugins/$ID/schema/dsconfig.json"
```

   The file follows the dsconfig spec (https://raw.githubusercontent.com/grafana/dsconfig/refs/heads/main/dsconfig/schema.md); don't re-derive field meanings from memory. Per field read `key` (the provisioning key), `valueType` (`string`, `number`, `boolean`, `array`, `object`, `map`, `any`), `target` (`root`, `jsonData` or `secureJsonData`) and `validations` (honor `allowedValues`, e.g. Infinity's `auth_method`: `none`, `basicAuth`, `apiKey`, `bearerToken`, `oauth2`, `aws`, `azureBlob`). Pick only the fields for the chosen auth method and connection; each field's `description` says which auth method it belongs to.
   Worked examples are at `https://plugins-cdn.grafana.net/<PLUGIN_ID>/<VERSION>/public/plugins/<PLUGIN_ID>/schema/v0alpha1.json` under `settingsExamples.examples` (keyed by scenario such as `apiKey`, `oauth2ClientCredentials`, each with `summary`, `description` and a `value` holding `jsonData`/`secureJsonData`). List with `jq -r '.settingsExamples.examples | keys[]'`, pull with `jq '.settingsExamples.examples.apiKey.value'`.
5. **If `schema/dsconfig.json` 404s** (older plugins), fall back to the generic structure above and tell the user the field names are best-effort, not plugin-authoritative.
6. **Map each field by `target`:**

| `target` | YAML | Terraform (`grafana_data_source`) |
|---|---|---|
| `root` | top-level key (`url`, `basicAuth`, `basicAuthUser`) | top-level argument (`url`) / inside `json_data_encoded` |
| `jsonData` | under `jsonData:` | key inside `json_data_encoded = jsonencode({ … })` |
| `secureJsonData` | under `secureJsonData:` as `${ENV_VAR}` | key inside `secure_json_data_encoded = jsonencode({ … })` via a `sensitive` variable |

   `valueType` sets the scalar form (`string` quoted in YAML, `boolean` as `true`/`false`, `number` bare); nested objects (`oauth2`, `aws`) and arrays (`allowedHosts`, `scopes`) map directly. Never inline a real secret.
7. **Ask YAML or Terraform** unless the user named one. YAML is the native zero-dependency path (`provisioning/datasources/<name>.yaml`); Terraform needs the `grafana/grafana` provider (`<name>.tf`). `<name>` is cosmetic (both loaders read every file in the directory); default it to the plugin name.

```yaml
apiVersion: 1
datasources:
  - name: Infinity # must be unique across the instance, collides even with a different datasource type
    type: yesoreyeram-infinity-datasource # = pluginType from the schema
    access: proxy # always set; default proxy (route queries through the Grafana server)
    uid: infinity-ds # also unique and immutable so dashboards can reference it
    jsonData:
      auth_method: apiKey # value from validations.allowedValues
      apiKeyKey: X-API-Key
      apiKeyType: header
      allowedHosts:
        - https://api.example.com
    secureJsonData:
      apiKeyValue: ${API_KEY} # env var ref, never a literal secret
    editable: false
```

The Terraform file holds only the resource; the user supplies `required_providers`, the `provider "grafana"` block and credentials. The argument is `access_mode`, not `access`.

```hcl
variable "api_key" {
  type      = string
  sensitive = true
}

resource "grafana_data_source" "infinity" {
  type        = "yesoreyeram-infinity-datasource"
  name        = "Infinity"
  uid         = "infinity-ds"
  access_mode = "proxy" # always set; default proxy (route queries through the Grafana server)

  json_data_encoded = jsonencode({
    auth_method  = "apiKey"
    apiKeyKey    = "X-API-Key"
    apiKeyType   = "header"
    allowedHosts = ["https://api.example.com"]
  })

  secure_json_data_encoded = jsonencode({
    apiKeyValue = var.api_key
  })
}
```

### Convert an existing data source

- **Only through the Grafana MCP server** with its **Datasources** toolset enabled ([ADMIN-AND-AI.md](ADMIN-AND-AI.md#grafana-mcp-server)). Without it, don't offer this path and never ask the user to paste a Grafana token into chat; fall back to from-scratch.
- **Steps:** `list_datasources`, then `get_datasource` (by `uid` or `name`). Copy non-secret fields as they are (`type`, `uid`, `url`, `access`, `basicAuth`, `basicAuthUser`, the full `jsonData`). Secrets are never returned: `secureJsonFields` lists which keys are set (e.g. `{"apiKeyValue": true}`), so emit an `${ENV_VAR}` placeholder for each `true` key. Cross-check against the schema, then map and emit.

## Data source settings by type

| Type | URL | Settings |
|---|---|---|
| Prometheus | `http://prometheus:9090` | HTTP method POST (supports longer queries); scrape interval default 15s, match the Prometheus scrape interval; query timeout default 60s; exemplars link metrics to traces (needs Tempo); Ruler URL for Prometheus-managed rules |
| Loki | `http://loki:3100` | Maximum lines 1000; derived field `Name: TraceID`, `Regex: traceID=(\w+)`, internal link to Tempo |
| Tempo | `http://tempo:3200` | Trace to logs, Trace to metrics, Service graph, Node graph |
| Pyroscope | `http://pyroscope:4040` | |
| Alertmanager | `http://alertmanager:9093` | Implementation Prometheus, Mimir or Cortex |
| Jaeger, Zipkin, Graphite | `http://jaeger:16686`, `http://zipkin:9411`, `http://graphite:8080` | |
| Elasticsearch | `http://elasticsearch:9200` | Index `logs-*`, time field `@timestamp`, version 8.x |
| MySQL | | 5.7+ and compatibles; pool example Max open 100, Max idle 100, Connection max lifetime 14400 |
| PostgreSQL | | SSL mode `disable`, `require`, `verify-ca`, `verify-full` |
| CloudWatch | | Auth: AWS SDK default, access and secret key, or assume role ARN; IAM `cloudwatch:GetMetricData`, `cloudwatch:ListMetrics`, `logs:*` |
| Azure Monitor | | App registration with `Monitoring Reader` |
| Google Cloud Monitoring | | Service account JSON or workload identity |
| TestData | | Built in |

- **Plugin data sources:** install via Connections > Add new connection, `grafana-cli plugins install <plugin-id>`, or the Docker env var `GF_INSTALL_PLUGINS`. Examples: `grafana-opensearch-datasource`, `grafana-bigquery-datasource`, `grafana-mongodb-datasource` (Enterprise), `grafana-splunk-datasource`, `grafana-datadog-datasource`.
- **Data source permissions (Enterprise):** by default every org user can query any data source; with RBAC assign users and teams at Data source settings > Permissions.
- **Sending data into these backends** is covered in [ALLOY.md](ALLOY.md), [PROMETHEUS.md](PROMETHEUS.md), [LOKI.md](LOKI.md) and [TEMPO.md](TEMPO.md).

## Dashboard provisioning

- **Workflow:** put dashboard JSON under `/var/lib/grafana/dashboards/`, add a provider in `provisioning/dashboards/`, restart so the provider loads, then GET the dashboard by UID.

```yaml
# /etc/grafana/provisioning/dashboards/default.yaml
apiVersion: 1

providers:
  - name: default
    orgId: 1
    folder: Infrastructure
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: false
    options:
      path: /var/lib/grafana/dashboards
      foldersFromFilesStructure: true
```

- **Provider keys:** `name`, `orgId`, `folder`, `folderUid`, `type: file`, `disableDeletion`, `updateIntervalSeconds`, `allowUiUpdates`, `options.path`, `options.foldersFromFilesStructure`. No `folder` puts dashboards at the root. The Grafana OSS skill's example uses `updateIntervalSeconds: 30`, its reference and the docs use `10`; both are examples, not stated defaults.
- **`updateIntervalSeconds` above 10 polls; 10 or below uses filesystem watch events,** which may never arrive through Docker bind mounts or some network filesystems. Set it above 10 there to force polling.
- **`foldersFromFilesStructure: true`** mirrors disk subdirectories as folders (unset `folder`/`folderUid`; nesting up to 4 levels).
- **`allowUiUpdates`:** `false` gives a "Cannot save provisioned dashboard" dialog in the UI. `true` saves UI edits to the DB, but any change to the provisioning source overwrites them (ignoring `version`), and removing the source deletes the dashboard unless `disableDeletion: true`.
- **Exporting on save** (Advanced options): Model Classic (for Grafana v12.4 or older) or V2 Resource (JSON or YAML); Grafana strips `id` from exported JSON.
- **File formats:** classic dashboard JSON, or Kubernetes format (`"kind": "Dashboard"`, `"apiVersion": "dashboard.grafana.app/v1"`, `metadata.name`, `spec`). You must use the Kubernetes format for dashboards v2 / dynamic dashboards.
- **Identity:** a stable `uid` keeps URLs the same across instances; don't reuse a `title` within a folder or a `uid` within an instance. The JSON model itself is in [DASHBOARDS.md](DASHBOARDS.md#the-json-model).

## Plugins and service accounts

```yaml
# provisioning/plugins/plugins.yaml
apiVersion: 1
apps:
  - type: grafana-pyroscope-app
    disabled: false
    jsonData:
      backendUrl: http://pyroscope:4040
```

Verify after restart with `GET /api/plugins/<plugin-id>/health`.

The source shows the service-account file form below, but support for `serviceAccounts:` at this path was not established by the documentation fetched in this round. Treat it as an unverified source example, not an approved provisioning contract; use the documented service-account API flow in [ADMIN-AND-AI.md](ADMIN-AND-AI.md#service-accounts) or confirm support against the installed version before adopting it. [existing ADMIN-AND-AI.md; PROVISIONING-AND-API.md]

```yaml
# provisioning/access-control/service_accounts.yaml
apiVersion: 1
serviceAccounts:
  - name: ci-reader
    orgId: 1
    role: Viewer
    tokens:
      - name: ci-token
        # expires: optional ISO 8601 timestamp; omit for no-expiry tokens
```

## HTTP API

Base `https://your-grafana.example.com/api/`, authenticated with a service account token: `Authorization: Bearer <token>`. Docs: https://grafana.com/docs/grafana/latest/developers/http_api/dashboard/

| Job | Call |
|---|---|
| Search dashboards | `GET /api/search?query=service&type=dash-db&folderIds=1`; with jq: `"$GRAFANA/api/search?query=kubernetes&type=dash-db" \| jq '.[] \| {uid,title,folderTitle}'` |
| Get dashboard | `GET /api/dashboards/uid/{uid}` |
| Create or update dashboard | `POST /api/dashboards/db` with `{ "dashboard": {...}, "folderUID": "...", "overwrite": true }`; token needs `dashboards:write` |
| Delete dashboard | `DELETE /api/dashboards/uid/{uid}` |
| Create folder | `POST /api/folders` with `{"uid":"platform-team","title":"Platform Team"}` |
| List or get data sources | `GET /api/datasources`, `GET /api/datasources/uid/{uid}` |
| Create data source | `POST /api/datasources` with `{ "name": "...", "type": "...", "url": "...", "access": "proxy" }` |
| Data source health | `GET /api/datasources/uid/{uid}/health` returns `{ "status": "OK" \| "ERROR", "message": "..." }` |
| Org users | `GET /api/org/users` |
| Service accounts | `GET /api/serviceaccounts/search?perpage=100&page=1`; `POST /api/serviceaccounts` with `{ "name": "ci-reader", "role": "Viewer", "isDisabled": false }` |
| Service account token | `POST /api/serviceaccounts/{id}/tokens` with `{ "name": "ci-token", "secondsToLive": 0 }` (0 = no expiry) |
| Plugin health | `GET /api/plugins/<plugin-id>/health` |

- **Folder key conflict on `POST /api/dashboards/db`:** the OSS API reference uses `"folderUID"`, the dashboarding skill `"folderUid"`. Confirm in the current docs. The full push-and-verify script is in [DASHBOARDS.md](DASHBOARDS.md#push-and-verify-through-the-api).
- **Health check a data source:**

```bash
curl https://grafana.example.com/api/datasources/uid/<uid>/health \
  -H "Authorization: Bearer <token>"
```

- **Verify a provisioned dashboard:** a returned title means success; 404 means provisioning didn't pick it up, so check server logs with `journalctl -u grafana-server | grep -i provisioning`.

```bash
curl https://grafana.example.com/api/dashboards/uid/<uid> \
  -H "Authorization: Bearer <token>" | jq '.dashboard.title'
```

- **Verify a token:** `curl https://grafana.example.com/api/org -H "Authorization: Bearer <new-token>"`: 200 with org JSON means token and role work, 401 the token is wrong, 403 the role is wrong.
- **Alerting and silences** are in [ALERTING.md](ALERTING.md); IRM endpoints are in [IRM-AND-ONCALL.md](IRM-AND-ONCALL.md); users, teams, audit logs and the Cloud API in [ADMIN-AND-AI.md](ADMIN-AND-AI.md).

## Annotations

```bash
curl -X POST https://grafana.example.com/api/annotations \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "dashboardUID": "service-overview",
    "panelId": 1,
    "time": 1706745600000,
    "timeEnd": 1706749200000,
    "tags": ["deploy", "v2.0"],
    "text": "Deployed v2.0"
  }'
```

Find with `GET /api/annotations?tags=deploy&from=1706745600000&to=1706832000000`; delete with `DELETE /api/annotations/{id}`.

## Grafana as code

Docs: https://grafana.com/docs/grafana/latest/as-code/

- **Grafana 12 adds versioned APIs;** `gcx`, Git Sync and the Foundation SDK are built on them. Other tools: Terraform, Ansible, the Grafana Operator, Crossplane, and on-prem file provisioning.
- **Pick one source of truth per resource.** Provisioning files on disk and Terraform managing the same resource cause drift on every plan.

| Tool | Shape | Notes |
|---|---|---|
| Terraform (`grafana/grafana`) | HCL/JSON | Supports the most resources: dashboards, alerts, collectors, synthetic monitoring probes and checks, identity and access; best for existing Terraform users; long dashboard JSON is hard to review |
| `gcx` (Grafana CLI) | CLI | OSS, Enterprise and Cloud; recommended for AI agents; `grafanactl` is deprecated |
| Git Sync | Dashboards as JSON in Git | Bidirectional |
| Foundation SDK | Typed builders in Go, TypeScript, Python, Java, PHP | "Grafonnet is not officially supported by Grafana. Instead, use the Foundation SDK"; push with `gcx` |
| Ansible collection | Grafana Cloud only | Eight resources: API keys, cloud stacks, plugins, dashboards, folders, data sources, alert contact points, notification policies |
| Grafana Operator | Kubernetes CRs (`GrafanaDashboard`, `apiVersion: integreatly.org/v1alpha1`) | Dashboards, data sources, folders; no alerting or plugins yet; built-in sync, easy dashboard building |
| Crossplane provider | Kubernetes manifests of every Terraform resource | Alpha; UI changes discarded on resync; `kubectl crossplane install provider grafana/crossplane-provider-grafana:v0.1.0` |

- **Grizzly has been removed** ("no longer deployed, enhanced, or supported. Use the Grafana CLI instead"), though the as-code overview still lists it. **Grafonnet is not officially supported;** the dashboard best-practices page still recommends grafonnet and grafanalib, the observability-as-code page says to use the Foundation SDK. Confirm in the current docs.

### Terraform

Provider: https://registry.terraform.io/providers/grafana/grafana/latest. Guides cover Cloud stacks, dashboards with GitHub Actions, IRM, Fleet Management, Frontend Observability, Cloud Provider Observability, Knowledge Graph, plugins, saved queries and secrets: https://grafana.com/docs/grafana/latest/as-code/infrastructure-as-code/terraform/

```terraform
resource "grafana_dashboard" "metrics" {
  config_json = jsonencode({
    title   = "as-code dashboard"
    uid     = "ascode"
  })
}
```

- **Provider block:** `version = "~> 2.0"`, `auth = var.grafana_service_account_token`, with the token in tfvars or the environment.
- **Resources:** `grafana_team`, `grafana_user` (password ignored when SSO is configured), `grafana_team_member`, `grafana_folder`, `grafana_dashboard` (`config_json = file("dashboards/overview.json")`, `folder = grafana_folder.x.uid`), `grafana_data_source` (above), `grafana_oncall_schedule` and `grafana_oncall_on_call_shift` ([IRM-AND-ONCALL.md](IRM-AND-ONCALL.md#schedules)).
- **Drift:** after apply, `terraform plan` should be clean. UI edits cause drift: reclaim them in code or use `ignore_changes`. `409 Conflict` means the resource exists: `terraform import` it.

### gcx

Docs: https://grafana.com/docs/grafana/latest/as-code/observability-as-code/grafana-cli/

- **What it does:** structured access to dashboards, folders, alert rules, data sources and Cloud products (Synthetic Monitoring, K6, Fleet Management, Incidents, Adaptive Telemetry); ships agent skills (alert investigation, RCA, dashboard creation and GitOps, SLO management, observability setup); integrates with Grafana Assistant; GitOps pull/push with full round-trip fidelity; JSON/YAML output, structured errors, predictable exit codes; agent mode auto-detected for Claude Code, Copilot and Cursor. Requires Grafana Cloud or OSS/Enterprise v12+. Experimental commands may change without semver. Some commands drive billed Cloud products (Assistant per token, Synthetic Monitoring per execution, k6 per VU hour, IRM per MAU).
- **Install:** `curl -fsSL https://raw.githubusercontent.com/grafana/gcx/main/scripts/install.sh | sh` (to `~/.local/bin`, verifies SHA-256; `GCX_INSTALL_DIR`, `GCX_VERSION`, `GITHUB_TOKEN`), `brew install gcx`, container `ghcr.io/grafana/gcx` (distroless; pin an exact tag like `v1.5.0` in CI), or `go install github.com/grafana/gcx/cmd/gcx@latest` (Go 1.24+). macOS Gatekeeper `killed: 9` after a manual download: `xattr -d com.apple.quarantine "$(command -v gcx)"` and `codesign --sign - --force "$(command -v gcx)"`. Duplicate copies: `which -a gcx`, `hash -r`.
- **Auth:** OAuth `gcx login` (Cloud only, user-scoped, recommended interactively; needs `grafana-assistant-app.tokens.gcx:access`, granted by the **gcx User** role to Viewer and above); a service account token (recommended for CI); basic auth only when service accounts aren't available; mTLS. Cloud platform APIs use a Cloud Access Policy token. A token takes precedence over basic auth.
- **Config layering:** system, then `$HOME/.config/gcx/config.yaml`, then the repository's `.gcx.yaml`; `--config` or `GCX_CONFIG` bypasses layering; `gcx config path` shows it. Credentials live in the OS keychain tied to the config file. An auto-discovered `.gcx.yaml` can't attach your credentials to destinations it supplies; select it explicitly with `gcx login --config .gcx.yaml`. `org-id` is required on-prem, `stack-id` for Cloud. Config schema (documented for gcx v1.6.0): `version`, `stacks.<name>.grafana.{server,user,password,token,org-id,stack-id,auth-method,tls}`.
- **Contexts:** `gcx config set stacks.default.grafana.server http://localhost:3000`, `gcx config set contexts.default.stack default`, `gcx config set stacks.default.grafana.org-id 1` (OSS/Enterprise only), `gcx config set stacks.default.grafana.token service-account-token`; `gcx config list-contexts`, `gcx config use-context staging`, `--context staging`, `gcx config view`. Env vars override in memory and are never persisted: `GRAFANA_SERVER='http://localhost:3000' GRAFANA_ORG_ID='1' gcx config check`.
- **`gcx config check` exits non-zero on any failing context,** so it works as a deployment gate.
- **Resources:** `gcx resources pull [selector]` with selectors like `dashboards`, `dashboards/foo,bar`, `dashboards.v1alpha1.dashboard.grafana.app/foo`, `slo -p ./slo-defs/`, `alertrules -p ./alertrules/` (`-p` default `./resources`; `-o json|yaml`; `--on-error ignore|fail|abort`, default fail, exits 4 on partial failure). `gcx resources push` takes the same selectors plus `--dry-run`, `--max-concurrent` (default 10) and `--omit-manager-fields`; mixed native and provider types are auto-detected from `apiVersion`/`kind`. `gcx resources validate` validates server-side against a live connection. Resources managed by Terraform or Git Sync need `--include-managed`. `gcx resources pull dashboards -o json` returns the original JSON only.
- **Dev loop:** `gcx dev scaffold --project my-dashboards --go-module-path github.com/example/my-dashboards` (Go module with example dashboards, deploy workflow and config); `gcx dev import` (resources to Foundation SDK builders); `gcx dev generate dashboards/my-service-overview.go` (type inferred from the parent dir `dashboards/`, `alerts/`, `alertrules/`); `gcx dev lint` (Rego rules); `gcx dev serve ./resources` live preview, e.g. `--script 'go run dashboard-generator/*.go' --watch ./dashboard-generator --script-format yaml`. OAuth contexts fail with `dev serve`; use a service account token.
- **From grafanactl:** replace `grafanactl` with `gcx`; `grafanactl resources serve` becomes `gcx dev serve`.

### Git Sync and the Foundation SDK

- **Git Sync** stores dashboards as JSON in any Git provider (Pure Git), with richer GitHub, GitHub Enterprise, GitLab and Bitbucket integrations. It is bidirectional: UI saves can commit, optionally requiring PR approval. It polls every 60 seconds by default; webhooks make updates near-immediate. Uses: version control and audit, CI/CD with `gcx` and the Foundation SDK, PR review, dev to prod promotion, multi-region, sandboxes, HA, one repo per team. Its features are still changing; check the docs.
- **Foundation SDK:** strongly typed builders (a `DashboardBuilder` chain covering panels, queries, variables, thresholds, field overrides, transformations) in Go, TypeScript, Python, PHP and Java. Requires Grafana v10.0+. Install `npm install @grafana/grafana-foundation-sdk` or `go get github.com/grafana/grafana-foundation-sdk/go@latest`. API reference https://grafana.github.io/grafana-foundation-sdk/, examples https://github.com/grafana/intro-to-foundation-sdk. `builder.build()` throws on configuration errors; the JSON output can be imported manually or pushed with the API, `gcx` or Git Sync.

## Debugging

| Symptom | Cause |
|---|---|
| `401 Unauthorized` | Token expired or wrong stack URL |
| `403 Forbidden` on dashboard create | Service account lacks Editor on the target folder |
| `412 Precondition Failed` on `POST /api/dashboards/db` | UID exists and `overwrite: true` not set |
| Health `ERROR` | Network unreachable (check `url`) or credentials wrong |
| Provisioned dashboard 404 | Provider didn't load or JSON didn't parse; `journalctl -u grafana-server \| grep -i provisioning` |
| Provisioned dashboard never updates in Docker | Watch events don't cross the bind mount; `updateIntervalSeconds` above 10 |
| Provisioned password wrong | `${VAR}` truncated a value containing `$`; use `$VAR` |
| `grafana.ini` change ignored | Not restarted |
| OAuth redirect mismatch | `root_url` not set |
| Terraform plan never clean | Files on disk and Terraform both manage the resource |

## Prove it

- `GET /api/datasources/uid/<uid>/health` returns `"status": "OK"` for every provisioned data source, and every dashboard's `datasource.uid` exists in `GET /api/datasources`.
- `GET /api/dashboards/uid/<uid> | jq '.dashboard.title'` returns the title for every provisioned dashboard, and the server log shows no provisioning parse errors.
- No provisioning file or `.tf` file contains a literal secret: every `secureJsonData` value is an env var reference or a `sensitive` variable.
- `curl /api/org` with each service account token returns 200.
- `terraform plan` after apply is clean; `gcx config check` exits 0; `gcx resources push --dry-run` reports what you expect before a real push.
