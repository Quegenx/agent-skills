# Admin and AI

Running Grafana for a team: who can do what (roles, custom RBAC, teams), how people sign in (OAuth, SAML, GitHub), how machines and agents get in (service accounts, the Grafana MCP server), the Grafana Cloud account and stack APIs, the Cloud AI and ML features, and private network paths into and out of Grafana Cloud. Most outcomes come down to scope: the narrowest role on the narrowest folder, service account tokens kept in env vars or a secrets manager, read-only MCP by default, and in private connectivity whether DNS actually resolves to the private endpoint. Server config and provisioning files are in [PROVISIONING-AND-API.md](PROVISIONING-AND-API.md).

**Contents:** [Structure and roles](#structure-and-roles) · [Custom RBAC](#custom-rbac) · [Users and teams](#users-and-teams) · [Service accounts](#service-accounts) · [SSO](#sso) · [Cloud API](#cloud-api) · [Audit logs](#audit-logs) · [Grafana MCP server](#grafana-mcp-server) · [Grafana Assistant and A2A](#grafana-assistant-and-a2a) · [ML features](#ml-features) · [Private connectivity](#private-connectivity) · [Debugging](#debugging) · [Prove it](#prove-it)

## Structure and roles

Docs: https://grafana.com/docs/grafana-cloud/account-management.md

- **Grafana Cloud:** Cloud Account > Organization (the billing unit) > Stacks. Each stack is a dedicated Grafana plus LGTM instance with its own URLs and credentials.

| Role | Scope | Can |
|---|---|---|
| Viewer | Org | Read dashboards and alerts |
| Editor | Org | Create and edit dashboards and alerts |
| Admin | Org (stack in Cloud) | Data sources, users, plugins, provisioning |
| GrafanaAdmin | Server | Server-wide superuser (OSS) |
| Org Admin | Cloud organization | Stacks, users, billing, API keys |

- **Custom fine-grained RBAC roles are Enterprise and Cloud only.** In OSS you have the built-in roles.
- **Folders are the RBAC boundary** for dashboards and alert rules. Alerting's per-role defaults are in [ALERTING-AND-ONCALL.md](ALERTING-AND-ONCALL.md#alerting-rbac); OnCall roles (`oncall-admin`, `oncall-editor`, `oncall-viewer`, `oncall-notifications-receiver`) likewise.

## Custom RBAC

```yaml
# provisioning/access-control/roles.yaml
apiVersion: 1
roles:
  - name: TeamDashboardEditor
    description: Edit dashboards within team folder
    permissions:
      - action: dashboards:read
        scope: folders:UID:team-folder
      - action: dashboards:write
        scope: folders:UID:team-folder
      - action: dashboards:create
        scope: folders:UID:team-folder
```

```yaml
# provisioning/access-control/assignments.yaml
apiVersion: 1
roleAssignments:
  - roleName: TeamDashboardEditor
    users:
      - alice@example.com
      - bob@example.com
    teams:
      - platform-team
```

Verify with `GET /api/access-control/roles | jq '.[] | select(.name=="TeamDashboardEditor")'`.

## Users and teams

Stack API (Bearer service account token):

| Job | Call |
|---|---|
| Invite | `POST /api/org/invites` with `{ "loginOrEmail": "user@example.com", "role": "Editor", "sendEmail": true }` |
| Change role | `PATCH /api/org/users/{userId}` with `{ "role": "Admin" }` |
| Find team | `GET /api/teams/search?name=platform` |
| Create team | `POST /api/teams` with `{ "name": "Platform Team", "email": "platform@example.com" }` |
| Add member | `POST /api/teams/{teamId}/members` with `{ "userId": 2 }` |

- **Server-level user lookup is separate:** `/api/users/lookup` requires Basic authentication as a Grafana server administrator; an organization service-account token cannot supply server-admin privileges. The old table incorrectly grouped it under Bearer service-account calls. The same distinction applies to `/api/admin/*`. [Grafana User API](https://grafana.com/docs/grafana-cloud/learn-and-build/developer-resources/api-reference/http-api/api-legacy/user/), [Admin API](https://grafana.com/docs/grafana-cloud/learn-and-build/developer-resources/api-reference/http-api/api-legacy/admin/)

- **Onboarding:** invite each user, create the team, add members, assign the RBAC role, then check `GET /api/teams/{teamId}/members`.
- **As code:** `grafana_team`, `grafana_user`, `grafana_team_member` in Terraform ([PROVISIONING-AND-API.md](PROVISIONING-AND-API.md#terraform)).

## Service accounts

- **Service accounts are the recommended way for programmatic access** (CI/CD, Terraform, agents). Create them in Administration > Service Accounts, through the API (`POST /api/serviceaccounts`, then `POST /api/serviceaccounts/{id}/tokens`, where `"secondsToLive": 0` means no expiry), or from a provisioning file:

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

- **Viewer is enough for queries and dashboard reads;** add Editor only to create dashboards or annotations. A dashboard push token needs `dashboards:write`. A Cloud admin example is an `alloy-writer` account with role `Editor` and token `alloy-token`.
- **Keep tokens in env vars or a secrets manager,** never committed, and rotate them.
- **Verify:** `curl https://grafana.example.com/api/org -H "Authorization: Bearer <new-token>"` returns 200 and org JSON; 401 means the token is wrong, 403 the role.

## SSO

- **Generic OAuth (Okta) with role mapping:**

```ini
[auth.generic_oauth]
enabled = true
name = Okta
allow_sign_up = true
client_id = your_client_id
client_secret = your_client_secret
scopes = openid profile email groups
auth_url = https://your-org.okta.com/oauth2/v1/authorize
token_url = https://your-org.okta.com/oauth2/v1/token
api_url = https://your-org.okta.com/oauth2/v1/userinfo
role_attribute_path = contains(groups[*], 'grafana-admins') && 'Admin' || 'Viewer'
groups_attribute_path = groups
```

- **GitHub `[auth.github]`:** `scopes = user:email,read:org`, `auth_url = https://github.com/login/oauth/authorize`, `token_url = https://github.com/login/oauth/access_token`, `api_url = https://api.github.com/user`, `allowed_organizations = ["your-org"]`, `team_ids = [123456]`, `role_attribute_path = "Admin"`.
- **SAML keys:** `certificate_path`, `private_key_path`, `idp_metadata_path`, `max_issue_delay = 90s`, `metadata_valid_duration = 48h`, `assertion_attribute_login`, `assertion_attribute_email`, `assertion_attribute_name`, `assertion_attribute_role`, `role_values_admin`, `role_values_editor`. Availability conflicts: the admin skill's SSO reference says SAML is Enterprise and Cloud; the Grafana OSS config reference says these configs "are the same in OSS". Confirm your edition supports SAML in the current docs.
- **Set `root_url`** so the callback matches; the IdP's allowed redirect URIs must include `https://yourstack.grafana.net/login/<provider>`. `grafana.ini` changes need a restart.
- **Verify:** an incognito login page shows the provider button; click through the IdP; an authorized server administrator can check the role with `/api/users/lookup?loginOrEmail=<your-email>` using Basic authentication, as qualified above. Wrong role: claims are logged at debug level, so read `journalctl -u grafana-server | grep -i "OAuth\|SAML" | tail -50` and fix the claim path.

## Cloud API

Base `https://grafana.com/api/`, authenticated with a grafana.com API key. Reference: https://grafana.com/docs/grafana-cloud/developer-resources/api-reference/

| Job | Call |
|---|---|
| List stacks | `GET /api/instances` |
| Create stack | `POST /api/instances` with `{"name": "my-new-stack", "slug": "my-new-stack", "region": "us-east-0", "plan": "grafana-cloud-free"}` |
| Wait for it | Poll `https://my-new-stack.grafana.net/api/health` until 200 |
| Delete stack | `DELETE /api/instances/{id}`; a GET must then return 404 |

## Audit logs

Enterprise and Cloud only: `GET /api/admin/auditlogs?query=login&from=1706745600&to=1706832000&limit=50`. `from`/`to` are epoch seconds; `query` is free text over event names (`login`, `dashboard.create`, `team.member.add`). Empty results may mean audit logs aren't enabled on the free tier.

## Grafana MCP server

Repo and releases: https://github.com/grafana/mcp-grafana

- **Install:** `go install github.com/grafana/mcp-grafana/cmd/mcp-grafana@latest`; check `mcp-grafana --version`. "command not found" means `$GOPATH/bin` (or `$HOME/go/bin`) isn't on PATH.
- **Token:** a service account with `Viewer` (add `Editor` only for writes).
- **Config:** Claude Code stores user/local MCP configuration in `~/.claude.json` and shared project configuration in `.mcp.json`; the old source used settings.json paths. [Claude Code MCP scopes](https://code.claude.com/docs/en/mcp). The source uses `~/.cursor/mcp.json` for Cursor:

```json
{
  "mcpServers": {
    "grafana": {
      "command": "mcp-grafana",
      "args": ["--disable-write"],
      "env": {
        "GRAFANA_URL": "https://myorg.grafana.net",
        "GRAFANA_API_KEY": "glsa_xxxx"
      }
    }
  }
}
```

- **Start read-only.** `--disable-write` is the safer default and the setting for shared environments and CI; drop it only after the read path works. Verify with `/mcp` and a question like "What data sources are configured".
- **`GRAFANA_URL` must have no trailing slash.** Check key expiry; `mcp-grafana --debug` shows raw requests and responses.
- **SSE transport** for several users or a shared container: `GRAFANA_URL=... GRAFANA_API_KEY=... mcp-grafana --transport sse --port 3001`; agents use `http://localhost:3001/sse`; VS Code `settings.json`: `"mcp.servers": { "grafana": { "type": "sse", "url": "http://localhost:3001/sse" } }`.

| | stdio | SSE |
|---|---|---|
| Users | Single user or machine | Multiple users, shared container |
| Lifetime | Spawned per session | Long-lived server |
| Credentials | In the agent config | In the SSE process env |

| Tool group | Tools |
|---|---|
| Query | `query_prometheus`, `query_loki`, `query_tempo` |
| Data sources | `list_datasources`, `get_datasource` (by `uid` or `name`); the **Datasources** toolset |
| Dashboards | `search_dashboards`, `get_dashboard`, `create_dashboard` (needs Editor and writes enabled) |
| Alerting and IRM | `list_alert_rules`, `get_alert_rule`, `list_incidents` (needs IRM) |
| Fleet Management (if `grafana-collector-app` is installed) | `list_collectors`, `list_pipelines`, `get_pipeline` |
| Annotations | `list_annotations`, `create_annotation` |

New tools arrive in releases; `/mcp` shows the live list. Converting an existing data source into provisioning YAML with these tools is in [PROVISIONING-AND-API.md](PROVISIONING-AND-API.md#convert-an-existing-data-source). The `gcx` CLI is the other agent path ([PROVISIONING-AND-API.md](PROVISIONING-AND-API.md#gcx)).

## Grafana Assistant and A2A

Docs: https://grafana.com/docs/grafana-cloud/machine-learning/assistant/

- **Capabilities:** natural language to PromQL, LogQL and TraceQL; explaining queries; building and editing dashboards; investigating incidents; MCP integration; RBAC per org; Slack integration. Assistant Investigations (multi-agent, parallel) is in public preview.
- **Enable:** Grafana Cloud > Administration > AI & LLM > Enable Grafana Assistant; the magic-wand icon appears in the panel editor.
- **A2A:** `GET https://<GRAFANA_ASSISTANT_HOST>/.well-known/agent.json` returns the supervisor agent's Agent Card. MCP gives direct tool access and the caller reasons (stdio or SSE); A2A delegates a higher-level task and the Assistant reasons (HTTP well-known endpoint). For most coding-agent integration, use MCP.

### LLM plugin

- **`grafana-llm-app`** is an authenticated proxy to OpenAI, Anthropic, Azure OpenAI, vLLM, Ollama or LiteLLM. Health: `GET /api/plugins/grafana-llm-app/health` expects `{"status":"ok", ...}`. Plugin page: https://grafana.com/grafana/plugins/grafana-llm-app/

```yaml
# provisioning/plugins/llm.yaml
apiVersion: 1
apps:
  - type: grafana-llm-app
    jsonData:
      openAIUrl: https://api.openai.com
      openAIModel: gpt-4o
      # Anthropic alternative:
      # provider: anthropic
      # anthropicModel: claude-sonnet-4-6
      # Azure OpenAI alternative:
      # openAIUrl: https://your-resource.openai.azure.com
      # azureModelMapping: '[["gpt-4o","your-deployment-name"]]'
    secureJsonData:
      openAIKey: sk-your-openai-key
```

## ML features

Docs: https://grafana.com/docs/grafana-cloud/alerting-and-irm/machine-learning/

- **Prerequisites:** a Pro or Advanced stack, a token with `plugins:write`. Dynamic Alerting needs at least 14 days (ideally 90) of metric history.
- **Forecast job** (Prophet, daily and weekly seasonality): `POST https://<stack>.grafana.net/api/plugins/grafana-ml-app/resources/ml/v1/forecast` with `name`, `metric`, `datasourceId`, `interval: 300`, `trainingWindow: "90d"`, `forecastWindow: "7d"`, `algorithm: { "name": "prophet", "config": {} }`. Check that `ml_forecast_upper{job="cpu-forecast"}` returns a non-empty result through `/api/datasources/proxy/<datasourceId>/api/v1/query`. Alert on it: `avg(rate(node_cpu_seconds_total{mode="user"}[5m])) > ml_forecast_upper{job="cpu-forecast"} * 1.1`.
- **Outlier job** (DBSCAN): `POST .../grafana-ml-app/resources/ml/v1/outlier` with `algorithm: { "name": "dbscan", "sensitivity": 0.5, "config": { "epsilon": 0.5 } }`; it writes `ml_outlier_score{job="service-error-outliers"}`; alert when it is `> 0.8` for 5m.
- **Sift** (free on every Grafana Cloud account, https://grafana.com/docs/grafana-cloud/alerting-and-irm/machine-learning/sift/): `POST .../api/plugins/grafana-sift-app/resources/sift/v1/investigations` with `name`, `start`, `end`, `filters`; open it at `https://<stack>.grafana.net/a/grafana-sift-app/investigations/<id>`. Its 8 analyses: Error Pattern Logs, HTTP Error Series, Kube Crashes, Log Query, Metric Query, Noisy Neighbors, Recent Deployments, Resource Contention. Start one from Explore ("Run Sift Investigation"), a panel ("Investigate with Sift"), an incident ("Run Sift"), the command palette (`Cmd+K`) or an OnCall escalation chain.
- **Knowledge Graph:** discovers services, pods, nodes and namespaces from labels and traces, updated every minute. Observability > Entity graph; search e.g. `Show Service api-server`; RCA Workbench for blast radius and upstream cause.
- **Adaptive Metrics:** recommendations at `GET https://<stack>.grafana.net/api/plugins/grafana-adaptive-metrics-app/resources/v1/recommendations`. A sample rule `match: "^http_request_duration_seconds.*"`, `action: keep`, `match_labels: [method, status, service]` drops pod, container and instance.

## Private connectivity

Docs: https://grafana.com/docs/grafana-cloud/send-data/

| Direction | Use |
|---|---|
| Push from AWS | AWS PrivateLink |
| Push from Azure | Azure Private Link |
| Push from GCP | GCP Private Service Connect |
| Grafana Cloud querying a private DB or Prometheus | Private Data Source Connect (PDC) |

- **Prerequisites:** the stack runs on the same cloud provider; one private endpoint per signal (metrics, logs, traces, profiles; distinct service names). AWS is same-region only; cross-region needs VPC peering first.
- **AWS:** service names are at Stack Details > "Send using AWS PrivateLink". Create with `aws ec2 create-vpc-endpoint --vpc-endpoint-type Interface --private-dns-enabled ...`, or Terraform `aws_vpc_endpoint` with `private_dns_enabled = true` per signal. Check the endpoint state is "available" with `aws ec2 describe-vpc-endpoints`, and confirm traffic with the endpoint's CloudWatch `BytesProcessed`.
- **Critical: DNS must resolve privately.** `dig +short prometheus-private.us-east-0.grafana.net` must return a private IP. A public IP means Alloy silently keeps using the public path. Fix with `private_dns_enabled = true` and VPC DNS resolution plus DNS hostnames enabled.
- **Alloy pointed at private endpoints** (more Alloy in [ALLOY.md](ALLOY.md)):

```alloy
prometheus.remote_write "cloud_private" {
  endpoint {
    url = "https://prometheus-private.us-east-0.grafana.net/api/prom/push"
    basic_auth {
      username = sys.env("PROM_USER")
      password = sys.env("GRAFANA_CLOUD_API_KEY")
    }
  }
}

loki.write "cloud_private" {
  endpoint {
    url = "https://logs-private.us-east-0.grafana.net/loki/api/v1/push"
    basic_auth {
      username = sys.env("LOKI_USER")
      password = sys.env("GRAFANA_CLOUD_API_KEY")
    }
  }
}
```

- **Azure:** have Grafana Support pre-register your Subscription IDs first, or creation hangs at "Pending". Create in the Portal with the Service Alias (auto approval takes about 10 minutes) or `az network private-endpoint create ... --group-ids grafana-metrics`. Check "Approved" with `--query 'privateLinkServiceConnections[0].privateLinkServiceConnectionState.status'`, and resolve with `nslookup prometheus-private.eu-west-2.grafana.net`.
- **GCP:** `gcloud compute forwarding-rules create grafana-metrics-psc ... --target-service-attachment=projects/grafana-cloud/regions/us-east1/serviceAttachments/metrics`; check `pscConnectionStatus` is "ACCEPTED".
- **PDC** opens an encrypted tunnel from Grafana Cloud into your network: `helm install pdc grafana/grafana-agent --version 0.44.2 --set pdcConfig.hostedGrafanaId=<your-stack-id> --set pdcConfig.token=<pdc-token>`.

## Debugging

| Symptom | Cause |
|---|---|
| 401 | Token expired or wrong stack URL |
| 403 on `/api/admin/*` | Server-level calls need Basic authentication and server-admin privileges; an org Admin service account is insufficient |
| 404 on a known stack | Wrong region in the URL (`us-east-0` vs `eu-west-0`) |
| Empty audit logs | May not be enabled on the free tier |
| 500 after the IdP redirect | Wrong `token_url` or expired `client_secret` |
| SSO login gives no role | `role_attribute_path` doesn't match the claims |
| `redirect_uri_mismatch` | Redirect URI missing at the IdP |
| SAML "invalid signature" | Stale `idp_metadata.xml` |
| MCP calls fail | Trailing slash in `GRAFANA_URL`, expired key; run `mcp-grafana --debug` |
| SSE server unreachable | Not running or port conflict (`lsof -i :3001`) |
| SSE 401 on every call | `GRAFANA_API_KEY` not in the SSE process env |
| SSE drops after minutes | Proxy idle timeout; set keep-alive |
| Private endpoint unused | DNS returns a public IP |
| Azure endpoint stuck "Pending" | Subscription ID not pre-registered |

## Prove it

- Each service account token returns 200 on `/api/org`, and calling a write endpoint with a Viewer token returns 403.
- A test user from each IdP group signs in and an authorized server administrator checks `/api/users/lookup` using Basic authentication for the expected role.
- `GET /api/access-control/roles` lists every provisioned custom role, and a member of the team can edit only dashboards in its folder.
- `/mcp` lists the Grafana tools and "What data sources are configured" answers from the live stack, with `--disable-write` still set unless writes were asked for.
- `GET /api/plugins/grafana-llm-app/health` returns `{"status":"ok"}`; an ML forecast query returns a non-empty result.
- For each private endpoint: `dig` returns a private IP, the endpoint is "available" / "Approved" / "ACCEPTED", and `BytesProcessed` (AWS) rises after Alloy starts.
