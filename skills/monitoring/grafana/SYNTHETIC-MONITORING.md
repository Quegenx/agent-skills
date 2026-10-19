# Synthetic Monitoring

Grafana Cloud Synthetic Monitoring (SM) runs checks against your endpoints and user journeys from probe locations on a fixed schedule. It uses k6 as a reliability and availability engine: each execution runs **one iteration with one VU** from each selected probe, and success means "the user journey works right now, from this region". The uptime signal is `probe_success` (1 or 0), and the mechanism that decides most outcomes is what fails an execution: **a bare failed `check()` does not**, so a check that only uses `check()` stays green while the journey is broken. Use it to write a synthetic check, monitor a login, checkout or signup flow in production, turn a k6 script or OpenAPI spec into a check, write a browser check, or answer "is my site up from multiple regions". Docs: https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/

**Contents:** [Not a load test](#not-a-load-test) · [Execution model and limits](#execution-model-and-limits) · [What fails an execution](#what-fails-an-execution) · [Choose a check type](#choose-a-check-type) · [Cost](#cost) · [Scripted checks](#scripted-checks) · [From an OpenAPI spec](#from-an-openapi-spec) · [Browser checks](#browser-checks) · [Validate locally](#validate-locally) · [Deploy](#deploy) · [The API](#the-api) · [Terraform](#terraform) · [Alerting and rollback](#alerting-and-rollback) · [The testing skill's version](#the-testing-skills-version) · [Debugging](#debugging) · [Prove it](#prove-it)

## Not a load test

- **No load-testing idioms.** SM has no VUs to ramp, no `stages`, no load profiles, no soak, stress or spike phases and no `thresholds` over aggregated traffic. Say check, probe, execution, uptime, reachability, user journey validation; never "load test", "ramping" or "VUs".
- **For throughput, latency under load or breakpoints,** stop and use Grafana Cloud k6. One script can serve both products, but the goals, options and pricing differ.

## Execution model and limits

- **Workload:** one iteration per probe execution. Scripted and MultiHTTP checks run with forced `--vus 1 --iterations 1`; browser checks rely on the script's required single scenario. `vus`, `duration`, `stages` and `iterations` are ignored, so never write a load shape.
- **`thresholds` are not supported.**

| Check class | Frequency | Timeout |
|---|---|---|
| k6-class (scripted, MultiHTTP, browser) | 60 to 3600 s | 1 to 180 s |
| Protocol (HTTP, ping, DNS, TCP, gRPC) | 1 to 3600 s | 1 to 60 s |
| Traceroute | 120 to 3600 s | Fixed 30 s |

- **Timeout must be no more than the frequency** (the limits table says "≤ frequency"). The same source's troubleshooting row says "confirm timeout < frequency" and its rules say "the timeout under the frequency".
- **k6 version channels:** each check runs on a channel (https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/create-checks/manage-k6-versions/). New checks default to the latest stable channel. **`v1.x` is deprecated as of July 2026.** Pin a channel per check with the UI dropdown, or `channels` in the API or Terraform.
- **No local files:** `open()`, `fs` and `grpc.load()` are unsupported. Bundle local modules into the script. Remote `https://jslib.k6.io/...` imports work.
- **Network errors fail the execution:** SM runs k6 with `--throw`.
- **SM's CLI flags beat the script's `options`.** These options still take effect: `batch`, `batch-per-host`, `discardResponseBodies`, `httpDebug`, `insecureSkipTLSVerify`, `maxRedirects`, `noConnectionReuse`, `setupTimeout`, `systemTags`, `tags`, `teardownTimeout`, `throw`, `tlsAuth`, `tlsCipherSuites`, `tlsVersion`, `userAgent`.
- **Browser memory:** 1 GB RAM per browser on public probes (https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/create-checks/checks/k6-browser/#public-probe-memory). Huge pages fail with `Target has crashed`.
- **The UI rejects bundled or minified browser scripts** during import validation; deploy those through the API or Terraform.

## What fails an execution

An execution is marked **failed** when the script throws an uncaught exception, calls `fail()`, a k6-testing `expect()` assertion fails (it calls k6's `test.abort()` under the hood), an HTTP request errors at the network level (`--throw`), or the timeout is hit. A bare failed `check()` only records the `probe_checks_total` / `probe_check_success_rate` metrics: checks don't affect k6's exit status without thresholds, and SM disables thresholds.

```javascript
import { expect } from 'https://jslib.k6.io/k6-testing/0.6.1/index.js';
import { check, fail } from 'k6';

// 1. PREFERRED: assertions module. Throws on failure => execution fails,
//    with a descriptive error in the check logs.
expect(res.status, 'login should succeed').toEqual(200);
expect(res.json('token')).toBeDefined();

// 2. Soft assertions: run all of them, still fail the execution at the end.
expect.soft(res.headers['Content-Type']).toContain('application/json');

// 3. check() when you also want per-assertion metrics, but pair it with
//    fail() or the failure won't affect probe_success/uptime:
check(res, { 'status 200': (r) => r.status === 200 }) ||
  fail(`login failed with status ${res.status}`);
```

- **Name every assertion** with its message argument or check name. The name appears in the check logs and in the `check` label of `probe_checks_total`.
- **k6-testing jslib version used throughout:** `https://jslib.k6.io/k6-testing/0.6.1/index.js`.

## Choose a check type

Work down the list and stop at the first match:

1. **HTTP, ping, DNS, TCP, traceroute, gRPC:** a single static endpoint (uptime, status code, body regex, TLS cert expiry, record resolution, port reachability). No script to maintain; these run on the blackbox-exporter probe engine.
2. **MultiHTTP:** a sequence of HTTP requests that pass values between them (`${variable}` capture), with no custom logic. **MultiHTTP does not validate status codes automatically:** define assertions per request, or failures won't affect uptime.
3. **k6 scripted:** an API flow that needs real logic, such as crypto or signing, conditional branching, generated test data, WebSockets or response-driven chaining.
4. **k6 browser:** only when you need a real browser: JS-rendered journeys, forms and clicks, or Core Web Vitals.

## Cost

- **Billing is per execution:** one check run on one probe, metered per minute of runtime and rounded up.
- **Executions per month** = `probes × duration_minutes × (43200 / frequency_minutes)`.
- **API test executions** (HTTP, ping, DNS, TCP, traceroute, MultiHTTP, scripted) **and browser executions are billed separately;** browser is the expensive tier. A browser check on 3 probes every minute is about 129,600 browser executions a month; every 5 minutes, about 25,920.
- **Pick the longest frequency that still meets your detection-time goal,** and 2 to 3 probes near your users. Multiple probes reduce alert flapping, but more isn't better.

## Scripted checks

- **Line 1 is an attribution comment:** keep `Generated by synthetic-monitoring-checks` verbatim and vary only the timestamp (`date -u +%Y-%m-%dT%H:%M:%SZ`). The fixed prefix makes skill-written checks queryable.

```javascript
// Generated by synthetic-monitoring-checks (https://github.com/grafana/skills) on 2026-07-31T12:00:00Z
import http from 'k6/http';
import { expect } from 'https://jslib.k6.io/k6-testing/0.6.1/index.js';
import secrets from 'k6/secrets';

const BASE = 'https://api.example.com';

export default async function () {
  // Secrets are managed in Synthetics > Config > Secrets: never hardcode credentials.
  const password = await secrets.get('checkout-monitor-password');

  // Step 1: authenticate with a dedicated monitoring account
  const login = http.post(
    `${BASE}/auth/login`,
    JSON.stringify({ user: 'sm-checkout-monitor', password }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  expect(login.status, 'login should return 200').toEqual(200);
  const token = login.json('token');
  expect(token, 'auth token should be present').toBeDefined();

  // Step 2: exercise the journey and assert the OUTCOME, not just the status
  const order = http.post(`${BASE}/orders`, JSON.stringify({ sku: 'TEST-SKU-1', qty: 1 }), {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  expect(order.status, 'order should be created').toEqual(201);
  const orderId = order.json('id');
  expect(orderId, 'order id should be returned').toBeDefined();

  // Step 3: clean up so the check is idempotent against production
  // http.url groups metrics for URLs containing unique IDs: without it, every
  // execution creates new time series (cardinality + active-series cost).
  const del = http.del(http.url`${BASE}/orders/${orderId}`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(del.status, 'test order should be cleaned up').toEqual(204);
}
```

- **Secrets:** `import secrets from 'k6/secrets'`, then `await secrets.get('<name>')`, managed in Synthetics > Config > Secrets (https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/create-checks/manage-secrets/).

### A good monitor, not a good test

- **Deterministic:** fixed test data, or generate it and delete it; no dependence on time of day or ordering. Every execution must be able to pass at any hour from any probe.
- **Idempotent against production:** create then delete, or use read-only endpoints. The check runs forever, so leaked state accumulates forever.
- **Dedicated test account:** never a real user's credentials. Scope it minimally, store its password as an SM secret, exclude it from analytics and billing.
- **Assert every step:** an unasserted step that breaks shows up as a confusing failure in a later step.
- **Stable URL cardinality:** the `http.url` template literal for any URL that contains an ID.
- **Runtime well under the timeout,** and the timeout under the frequency.

## From an OpenAPI spec

The same applies to a GraphQL schema or a Postman collection.

1. **Journeys, not endpoints.** Never one check per path or one check that sweeps every path. Find the 1 to 3 flows whose failure means "customers are impacted" (auth, core action, result) and write one scripted check per flow.
2. **Filter for safety.** Include mutating operations (`POST`/`PUT`/`DELETE`) only when the flow cleans up after itself or targets dedicated test resources. Never exercise destructive operations against production because the spec documents them.
3. **Assert from the response schema,** required fields and not only the status: `expect(order.json('id'), 'id required by OrdersResponse schema').toBeDefined()`.
4. **Verify the target URL.** `servers:` blocks and Postman environments often list localhost or staging first; confirm the production base URL with the user. Map `securitySchemes` credentials to SM secrets, never to values inlined from the spec. Secrets in plain HTTP and protocol checks are a recent, feature-flagged rollout (check the current docs); the scripted `secrets.get()` path always works.
5. **Treat `format: int64` ids as strings.** `res.json('id')` parses into a JS number and silently corrupts values past 2^53, so the readback URL 404s on every execution. Extract from the raw body with `const id = (/"id":\s*(\d+)/.exec(res.body) || [])[1];` and never do arithmetic on it.

- **No spec:** probe the frontend with browser devtools (or `curl` likely routes) and capture the `/api/*` XHR calls the app makes.

## Browser checks

- **Required scaffold:** import `k6/browser` and declare the `chromium` browser type; the UI validates both.

```javascript
// Generated by synthetic-monitoring-checks (https://github.com/grafana/skills) on 2026-07-31T12:00:00Z
import { browser } from 'k6/browser';
import { expect } from 'https://jslib.k6.io/k6-testing/0.6.1/index.js';
import secrets from 'k6/secrets';

export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations',
      options: { browser: { type: 'chromium' } },
    },
  },
};

export default async function () {
  const page = await browser.newPage();
  try {
    await page.goto('https://shop.example.com/login');

    // Prefer role/label/test-id locators over CSS chains: they survive redesigns.
    const password = await secrets.get('shop-monitor-password');
    await page.getByLabel('Email').fill('sm-monitor@example.com');
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Assert the JOURNEY OUTCOME with auto-retrying assertions: never sleep().
    await expect(page.getByRole('heading', { name: 'Your account' })).toBeVisible();

    await page.getByRole('link', { name: 'Orders' }).click();
    await expect(page.getByTestId('order-list')).toBeVisible();
  } finally {
    await page.close();
  }
}
```

- **Locators, in order:** `getByRole` / `getByLabel` / `getByTestId`, then text, then CSS. Ask the app team to add `data-testid` where needed. Never XPath or generated class names. `getByTestId` assumes `data-testid`; apps instrumented for Cypress often use `data-cy`, so fall back to `page.locator('[data-cy="..."]')`.
- **No manual waits:** locator actions wait for visibility and enabled state. Don't call `waitFor()` before `click()`/`fill()`, don't use `waitForLoadState()`, never call `sleep()`.
- **Wait for state you don't interact with** using auto-retrying `expect()` (`toBeVisible`, `toBeEnabled`, ...). **Caveat:** `toHaveText`/`toContainText` are listed as retrying but hard-fail on the first mismatched read (for example an empty string mid-hydration). Assert dynamic text through visibility: `await expect(page.getByText('Order confirmed')).toBeVisible()`.
- **The assertion timeout defaults to 5 s;** client-side-rendered apps routinely take longer to first meaningful render. Raise it once and use the configured instance: `const expectUi = expect.configure({ timeout: 20000 });`.
- **Assert the outcome** (signed-in heading, order list, confirmation text). A page can load fine while the journey is broken.
- **Wrap the journey in `try/finally` with `page.close()`** so the browser is released when an assertion throws.
- **Screenshots aren't a documented SM feature;** don't build failure handling around `page.screenshot()`. Rely on assertion messages and the check's logs (SM stores per-execution logs in Loki).
- **Web Vitals** `probe_browser_web_vital_lcp|cls|fcp|inp|ttfb` are collected automatically.
- **Docs:** scripted https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/create-checks/checks/k6/, browser https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/create-checks/checks/k6-browser/, `expect` https://grafana.com/docs/k6/latest/using-k6/assertions/, the browser module https://grafana.com/docs/k6/latest/using-k6-browser/.

## Validate locally

```bash
k6 run script.js                                              # scripted check
K6_BROWSER_HEADLESS=true k6 run browser-check.js              # browser check
k6 run --secret-source=mock=checkout-monitor-password=example-password script.js   # with secrets
# Many/large secrets: k6 run --secret-source=file=secrets.txt script.js
```

- **A pass** is exit code 0, one iteration and no failed assertions in the summary. Run it 3 to 5 times: "a script that is 90% reliable locally will page you nightly from 3 probes."

## Deploy

- **UI:** Testing & synthetics > Synthetics > Add new check > *k6 scripted* / *k6 browser* > paste the script > select probes and frequency > **Test** (runs once without saving) > Save.
- **gcx CLI** (https://github.com/grafana/gcx): `gcx synthetic-monitoring checks test -f check.yaml` runs it once against real probes without saving (like the UI's Test); `gcx synthetic-monitoring checks create -f check.yaml` saves it. Both take the script as plain text and gcx base64-encodes it. `gcx synthetic-monitoring checks get <ID> -o yaml --decode-script` pulls an existing check as a template (without the flag you get raw base64). `gcx synthetic-monitoring checks update` disables a check.
- **Choose the tool by ownership, not preference.** If checks are Terraform-managed, create and update them through Terraform; hand-editing state it owns causes drift on the next `apply`. For one-off or agent-driven authoring, gcx or the UI are faster. Use gcx for live inspection, ad-hoc testing and status or timeline investigation whichever tool provisioned the check.
- **API and Terraform units:** `frequency`/`timeout` are **milliseconds** (the UI shows seconds). The API wants `settings.scripted.script` / `settings.browser.script` **base64-encoded**; Terraform takes the plain script through `file()`.

## The API

- **Two things, both from Testing & synthetics > Synthetics > Config:** an **access token** (*Access tokens* tab > Generate access token) and the **backend address** (*General* tab, "Your backend address is", for example `synthetic-monitoring-api-us-east-0.grafana.net`; region-specific to your stack).
- **Header:** `Authorization: Bearer $SM_TOKEN`. OpenAPI spec: `https://synthetic-monitoring-api.grafana.net/api/v1/swagger`.

| Operation | Endpoint |
|---|---|
| List checks | `GET /api/v1/check` |
| Create check | `POST /api/v1/check` |
| Get check | `GET /api/v1/check/{id}` |
| Update check | `POST /api/v1/check/{id}` (send the full check object incl. `id` and `tenantId`) |
| Delete check | `DELETE /api/v1/check/{id}` |
| Run once without saving | `POST /api/v1/check/adhoc` |
| List probes (IDs for `probes`) | `GET /api/v1/probe` |

- **Payload gotchas:** milliseconds for `frequency` and `timeout`; scripts in base64 (`format: byte` in the spec): "Plain-text scripts are rejected or corrupted." `probes` is an array of numeric probe IDs from `GET /api/v1/probe`.
- **Create a scripted check:**

```bash
jq -n --rawfile script check.js '{
  job: "checkout-flow",
  target: "checkout-flow",
  enabled: true,
  frequency: 300000,
  timeout: 90000,
  probes: [1, 5],
  labels: [{ name: "env", value: "production" }],
  settings: { scripted: { script: ($script | @base64) } }
}' | curl -sS -X POST "$SM_API/api/v1/check" \
  -H "Authorization: Bearer $SM_TOKEN" \
  -H "Content-Type: application/json" \
  -d @-
```

  A browser check is the same with `settings: { browser: { script: ($script | @base64) } }`.
- **MultiHTTP enums are numeric in the API** (from https://github.com/grafana/synthetic-monitoring-agent/blob/main/pkg/pb/synthetic_monitoring/checks.proto):

| Field | Values |
|---|---|
| `checks[].type` | 0 TEXT · 1 JSON_PATH_VALUE · 2 JSON_PATH_ASSERTION · 3 REGEX_ASSERTION |
| `checks[].subject` | 0 DEFAULT (body) · 1 RESPONSE_HEADERS · 2 HTTP_STATUS_CODE · 3 RESPONSE_BODY |
| `checks[].condition` | 1 NOT_CONTAINS · 2 EQUALS · 3 STARTS_WITH · 4 ENDS_WITH · 5 TYPE_OF · 6 CONTAINS |
| `variables[].type` | 0 JSON_PATH · 1 REGEX · 2 CSS_SELECTOR |

```bash
curl -sS -X POST "$SM_API/api/v1/check" \
  -H "Authorization: Bearer $SM_TOKEN" -H "Content-Type: application/json" -d '{
  "job": "api-flow",
  "target": "https://api.example.com/auth",
  "enabled": true,
  "frequency": 120000,
  "timeout": 30000,
  "probes": [1, 5],
  "settings": {
    "multihttp": {
      "entries": [
        {
          "request": { "method": "POST", "url": "https://api.example.com/auth" },
          "checks": [
            { "type": 0, "subject": 2, "condition": 2, "value": "200" }
          ],
          "variables": [
            { "type": 0, "name": "token", "expression": "$.token" }
          ]
        },
        {
          "request": {
            "method": "GET",
            "url": "https://api.example.com/orders",
            "headers": [{ "name": "Authorization", "value": "Bearer ${token}" }]
          },
          "checks": [
            { "type": 0, "subject": 2, "condition": 2, "value": "200" }
          ]
        }
      ]
    }
  }
}'
```

- **For complex MultiHTTP checks,** build one in the UI, then `GET /api/v1/check/{id}` to copy its JSON. Requests without `checks` entries don't affect uptime; always assert at least the status code per request.
- **Disable and delete:**

```bash
# Fetch, flip enabled=false (rollback without losing config), push back
curl -sS "$SM_API/api/v1/check/123" -H "Authorization: Bearer $SM_TOKEN" \
  | jq '.enabled = false' \
  | curl -sS -X POST "$SM_API/api/v1/check/123" \
      -H "Authorization: Bearer $SM_TOKEN" -H "Content-Type: application/json" -d @-

# Delete permanently
curl -sS -X DELETE "$SM_API/api/v1/check/123" -H "Authorization: Bearer $SM_TOKEN"
```

## Terraform

- **Resource `grafana_synthetic_monitoring_check`** takes the plain script (the provider handles encoding); `frequency`/`timeout` are milliseconds; `probes` is required; the data source `grafana_synthetic_monitoring_probes` resolves probe IDs. Docs: https://registry.terraform.io/providers/grafana/grafana/latest/docs/resources/synthetic_monitoring_check
- **Provider:** `source = "grafana/grafana"`, `version = "~> 4.0"`, with `sm_access_token` (a sensitive variable) and `sm_url` (the backend address). Grafana as code in general is in [PROVISIONING-AND-API.md](PROVISIONING-AND-API.md).
- **Terraform is the standard workaround** for bundled or minified browser scripts the UI rejects.

```hcl
terraform {
  required_providers {
    grafana = {
      source  = "grafana/grafana"
      version = "~> 4.0"
    }
  }
}

variable "sm_access_token" {
  type      = string
  sensitive = true
}

provider "grafana" {
  sm_access_token = var.sm_access_token
  sm_url          = "https://synthetic-monitoring-api-us-east-0.grafana.net" # your backend address
}

data "grafana_synthetic_monitoring_probes" "main" {}

# Simplest sufficient type first: a plain HTTP check needs no script at all.
resource "grafana_synthetic_monitoring_check" "api_health" {
  job       = "api-health"
  target    = "https://api.example.com/health"
  enabled   = true
  frequency = 60000 # ms
  timeout   = 5000  # ms
  probes = [
    data.grafana_synthetic_monitoring_probes.main.probes.Ohio,
    data.grafana_synthetic_monitoring_probes.main.probes.Frankfurt,
  ]

  settings {
    http {
      method              = "GET"
      valid_status_codes  = [200]
      valid_http_versions = ["HTTP/1.1", "HTTP/2.0"]
      fail_if_not_ssl     = true
    }
  }
}

resource "grafana_synthetic_monitoring_check" "checkout_flow" {
  job       = "checkout-flow"
  target    = "checkout-flow"
  enabled   = true
  frequency = 300000 # ms: every 5 minutes
  timeout   = 90000  # ms: must cover the whole journey (max 180000)
  probes = [
    data.grafana_synthetic_monitoring_probes.main.probes.Ohio,
    data.grafana_synthetic_monitoring_probes.main.probes.Frankfurt,
  ]
  labels = {
    env = "production"
  }

  settings {
    scripted {
      script = file("${path.module}/scripts/checkout-flow.js")
    }
  }
}

resource "grafana_synthetic_monitoring_check" "login_journey_browser" {
  job       = "login-journey"
  target    = "https://shop.example.com/login"
  enabled   = true
  frequency = 600000 # ms: browser executions are the expensive tier; be deliberate
  timeout   = 120000 # ms
  probes = [
    data.grafana_synthetic_monitoring_probes.main.probes.Ohio,
  ]

  settings {
    browser {
      script = file("${path.module}/scripts/login-journey.js")
    }
  }
}
```

### MultiHTTP in Terraform

- **Enums are strings** (`TEXT`, `HTTP_STATUS_CODE`, `EQUALS`, `JSON_PATH`, ...) inside `entries { request {...} assertions {...} variables {...} }` blocks. **The API key is `checks`; Terraform's is `assertions`.** Write a variable reference in a header as `"Bearer $${token}"`: `$${token}` is Terraform escaping for a literal `${token}`, which SM interpolates at probe time.

```hcl
resource "grafana_synthetic_monitoring_check" "api_flow" {
  job       = "api-flow"
  target    = "https://api.example.com/auth"
  frequency = 120000
  timeout   = 30000
  probes    = [data.grafana_synthetic_monitoring_probes.main.probes.Ohio]

  settings {
    multihttp {
      entries {
        request {
          method = "POST"
          url    = "https://api.example.com/auth"
        }
        assertions {
          type      = "TEXT"
          subject   = "HTTP_STATUS_CODE"
          condition = "EQUALS"
          value     = "200"
        }
        variables {
          type       = "JSON_PATH"
          name       = "token"
          expression = "$.token"
        }
      }
      entries {
        request {
          method = "GET"
          url    = "https://api.example.com/orders"
          headers {
            name  = "Authorization"
            value = "Bearer $${token}"
          }
        }
        assertions {
          type      = "TEXT"
          subject   = "HTTP_STATUS_CODE"
          condition = "EQUALS"
          value     = "200"
        }
      }
    }
  }
}
```

### Protocol checks in Terraform

- **`settings` must contain exactly one nested block,** even when every value is a default: `settings { ping {} }` is valid and required; an empty `settings {}` is not.

| Type | `target` format | Key settings |
|---|---|---|
| `http` | Full URL `https://example.com/health` | `valid_status_codes`, `fail_if_not_ssl`, `fail_if_body_not_matches_regexp`, `headers`, `basic_auth` |
| `ping` | Hostname `example.com` | Usually none (`ping {}`) |
| `dns` | Record to resolve `example.com` | `server` (default `8.8.8.8`), `record_type` (default `A`), `valid_r_codes`, `validate_answer_rrs` |
| `tcp` | `host:port` `example.com:443` | `tls`, `query_response { send / expect / start_tls }` |
| `traceroute` | Hostname `example.com` | `max_hops`, `max_unknown_hops`, `ptr_lookup` |
| `grpc` | `host:port` | `service` (health-check service name), `tls`, `tls_config` |

```hcl
# DNS: assert the record resolves against your own nameserver with NOERROR
resource "grafana_synthetic_monitoring_check" "dns_www" {
  job       = "dns-www"
  target    = "www.example.com"
  frequency = 120000
  timeout   = 5000
  probes    = [data.grafana_synthetic_monitoring_probes.main.probes.Ohio]

  settings {
    dns {
      server        = "ns1.example.com"
      record_type   = "A"
      valid_r_codes = ["NOERROR"]
    }
  }
}

# TCP with TLS: also feeds probe_ssl_earliest_cert_expiry for cert-expiry alerting
resource "grafana_synthetic_monitoring_check" "smtp" {
  job       = "smtp-tls"
  target    = "mail.example.com:465"
  frequency = 300000
  timeout   = 5000
  probes    = [data.grafana_synthetic_monitoring_probes.main.probes.Frankfurt]
  alert_sensitivity = "high"

  settings {
    tcp {
      tls = true
    }
  }
}

# Ping and traceroute need only the empty block
resource "grafana_synthetic_monitoring_check" "edge_ping" {
  job       = "edge-ping"
  target    = "edge.example.com"
  frequency = 60000
  timeout   = 3000
  probes    = [data.grafana_synthetic_monitoring_probes.main.probes.Ohio]

  settings {
    ping {}
  }
}
```

- **Other fields worth setting in code:** `alert_sensitivity` (default `none`; `low`/`medium`/`high` feed the prebuilt `probe_success` alert rules) and `basic_metrics_only` (default `true`; set `false` only when you need the full blackbox-exporter metric set).

## Alerting and rollback

- **Start with `alertSensitivity`** (Terraform `alert_sensitivity`) and the default alert rules on `probe_success`. In Terraform the default is `none`, so nothing alerts until you set `low`, `medium` or `high`. Custom rules and routing are [ALERTING.md](ALERTING.md).
- **Cert expiry:** a TCP check with TLS feeds `probe_ssl_earliest_cert_expiry`.
- **Roll back with `enabled: false`** (UI toggle, `gcx synthetic-monitoring checks update`, API update or Terraform): executions stop and history stays. Delete a check only when you no longer need its configuration.

## The testing skill's version

Grafana's broader `testing` skill (SM, k6 Cloud and Faro together) covers SM with a different API path and a few extra tables. Where it disagrees with the sections above, both are stated.

- **Prerequisite:** an SM access token (`sm:write`).
- **Check types:** HTTP, DNS, TCP, Ping (ICMP), MultiHTTP, Browser (k6, Chrome: full page load, Core Web Vitals), Scripted (k6 script). Its two reference files disagree: one has separate Browser and Scripted rows and no Traceroute; the other adds Traceroute (network path diagnostics) and has one "Scripted (k6 browser)" row.
- **The API path disagrees.** The testing skill creates and lists checks at `https://synthetic-monitoring-api.grafana.net/sm/checks` and rolls back with `DELETE /sm/checks/<id>`; the synthetic-monitoring-checks skill uses `$SM_API/api/v1/check` on your region-specific backend address ([The API](#the-api)). Its Terraform provider likewise sets `sm_url = "https://synthetic-monitoring-api.grafana.net"` with no provider version pin.

```bash
# 1. Create the check (full payload in references/synthetic.md)
curl -X POST https://synthetic-monitoring-api.grafana.net/sm/checks \
  -H "Authorization: Bearer <sm-token>" -H "Content-Type: application/json" \
  -d '{"job":"website","target":"https://example.com","frequency":60000,"timeout":15000,
       "enabled":true,"probes":[1,5,10],
       "settings":{"http":{"method":"GET","validStatusCodes":[200]}}}'

# 2. List checks: confirm it exists and is enabled
curl -s https://synthetic-monitoring-api.grafana.net/sm/checks \
  -H "Authorization: Bearer <sm-token>" | jq '.[] | select(.job=="website")'

# 3. Verify probe_success arrived (wait ~60s for the first run)
#    In Grafana Explore on the synthetic metrics datasource:
#      probe_success{job="website"}
#    Expect 1 from each probe in `probes:[1,5,10]`.
#
# Rollback: DELETE /sm/checks/<id> or set `"enabled": false`.
```

- **HTTP check fields:** `job`, `target`, `frequency` (ms, `60000`), `timeout` (ms, `15000`), `enabled`, `probes`, `settings.http.{method, ipVersion "V4", noFollowRedirects, tlsConfig{insecureSkipVerify, serverName}, validStatusCodes, validHTTPVersions ["HTTP/1.1","HTTP/2.0"], failIfBodyMatchesRegexp, failIfBodyNotMatchesRegexp, failIfHeaderMatchesRegexp, failIfHeaderNotMatchesRegexp, headers[{name,value}], body, bearerToken, basicAuth{username,password}}`, `labels[{name,value}]`, `alertSensitivity` (`"medium"`).
- **Probe IDs (post Feb 2025 AWS migration):** Americas 1 Columbus (us-east-2), 2 Manassas (us-east-1), 14 Portland (us-west-2), 15 São Paulo (sa-east-1), 16 Montreal (ca-central-1). EMEA 5 Frankfurt (eu-central-1), 10 Dublin (eu-west-1), 17 London (eu-west-2), 18 Paris (eu-west-3), 19 Stockholm (eu-north-1), 20 Milan (eu-south-1), 21 Cape Town (af-south-1), 22 Bahrain (me-south-1). APAC 3 Singapore (ap-southeast-1), 4 Sydney (ap-southeast-2), 6 Tokyo (ap-northeast-1), 7 Mumbai (ap-south-1), 8 Seoul (ap-northeast-2), 9 Hong Kong (ap-east-1), 11 Osaka (ap-northeast-3), 12 Jakarta (ap-southeast-3), 13 Melbourne (ap-southeast-4). `GET /api/v1/probe` lists probe IDs.

| Alert sensitivity | Fires when | For |
|---|---|---|
| `none` | No alerts | - |
| `low` | Under 50% of probes succeeding | 5 minutes |
| `medium` | Under 75% | 5 minutes |
| `high` | Under 95% | 5 minutes |

- **Grizzly (YAML as code):**

```yaml
apiVersion: grizzly.grafana.com/v1alpha1
kind: SyntheticMonitoringCheck
metadata:
  name: api-health
spec:
  job: api-health
  target: https://api.example.com/health
  frequency: 60000
  timeout: 10000
  probes: [1, 5, 10]
  settings:
    http:
      method: GET
      validStatusCodes: [200]
```

- **Key metrics:**

```promql
# Uptime % over 7 days
avg_over_time(probe_success{job="api-health"}[7d]) * 100

# P95 response time by location
histogram_quantile(0.95,
  sum(rate(probe_duration_seconds_bucket{job="api-health"}[5m])) by (le, probe)
)

# DNS lookup time trend
avg(probe_dns_lookup_time_seconds{job="dns-check"}) by (probe)

# TLS certificate days until expiry
(probe_ssl_earliest_cert_expiry{job="api-health"} - time()) / 86400

# Availability by region
avg(probe_success{job="api-health"}) by (probe)
```

- **Alert rules:**

```yaml
groups:
  - name: synthetic-monitoring
    rules:
      - alert: SyntheticCheckFailing
        expr: avg_over_time(probe_success[5m]) < 0.9
        for: 5m
        labels: { severity: critical }
        annotations:
          summary: "{{ $labels.job }} failing from {{ $labels.probe }}"

      - alert: TLSCertExpiringSoon
        expr: (probe_ssl_earliest_cert_expiry - time()) / 86400 < 14
        labels: { severity: warning }
        annotations:
          summary: "TLS cert for {{ $labels.instance }} expires in {{ $value }} days"
```

- **Stuck at `probe_success=0`:** check `probe_*_duration_seconds` for the failing stage; the probe-region label tells you which prober errored.

## Debugging

| Symptom | Cause and fix |
|---|---|
| Passes locally, fails on all probes | Target not reachable from the public internet (internal DNS, VPN, IP allowlist). Use private probes (https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/set-up/set-up-private-probes/) for internal targets, or allowlist probe egress |
| Passes locally, fails on *some* probes | Geo-blocking, regional CDN/WAF rules, or bot protection challenging datacenter IPs. Check the `probe` label on failures; exempt the SM `userAgent` or those regions in the WAF |
| Check "fails" in your eyes but `probe_success` stays 1 | Bare `check()` without `fail()`/`expect()`. Convert to `expect()` or `check(...) \|\| fail(...)` |
| Browser check flaps with locator timeouts | Brittle selectors or animation timing. Switch to `getByRole`/`getByTestId`, assert with auto-retrying `expect()`, remove manual waits |
| `toBeVisible` reports `Expected: visible / Received: hidden` but the element is visible | The locator matches multiple elements (strict mode); the message is misleading. Tighten the selector or use `.first()` |
| Create succeeds but readback 404s on every execution | Id exceeds `Number.MAX_SAFE_INTEGER` (2^53) and `res.json()` rounded it; extract int64 ids from the raw body as strings |
| `secrets.get()` fails | Name mismatch (names are exact, at most 253 chars, letters, numbers, `-`, `_`), secret deleted (checks fail until recreated), or the editing user lacks the Admin/Editor role or "Checks writer" permission |
| Executions time out but the journey is fine | Timeout too low (max 180 s); raise it. Or unbounded work per iteration. Confirm timeout < frequency |
| `Target has crashed` in browser logs | Page exceeds the 1 GB probe browser memory. Trim the journey, block heavy third-party resources, or use a private probe with more memory |
| UI rejects a browser script | Bundled or minified; create via API or Terraform |
| Metrics or billing explode after adding a check | Unique IDs in URLs create per-execution time series. Use `http.url`, and check frequency × probe count against the cost formula |

## Prove it

Wait one frequency interval, then run these in Explore against the Synthetic Monitoring metrics Prometheus datasource:

```promql
# 1 from every selected probe = healthy
probe_success{job="checkout-flow"}

# Assertion pass rate per named assertion (scripted/browser)
probe_check_success_rate{job="checkout-flow"}

# Journey duration per probe: confirm it's comfortably under the timeout
probe_script_duration_seconds{job="checkout-flow"}

# Uptime over time (how the SM app computes it)
max by () (max_over_time(probe_success{job="checkout-flow"}[5m]))
```

- **Healthy first execution:** `probe_success == 1` from every probe, every `probe_check_success_rate` series at 1, a duration stable across probes, and logs for each execution on the prebuilt dashboard (Synthetics > check > View dashboard). Browser checks also show `probe_browser_web_vital_*` series.
- **Locally reliable:** 3 to 5 local `k6 run`s all exit 0 with one iteration.
