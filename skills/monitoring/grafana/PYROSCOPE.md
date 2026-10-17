# Pyroscope

Continuous profiling with Grafana Pyroscope (CPU, memory, allocations, mutex contention, goroutines) and reading profiles from the terminal with `profilecli`. Pyroscope is multi-tenant, with an architecture aligned with Mimir, Loki and Tempo, object storage (S3, GCS, Azure Blob, Swift, S3-compatible) and high-cardinality tag handling. What decides whether you get a flame graph is the collection path: Alloy eBPF needs no code change but gives CPU only; an SDK gives more profile types but must be started. Docs: https://grafana.com/docs/pyroscope/latest/ ; Grafana Cloud Profiles: https://grafana.com/docs/grafana-cloud/monitor-applications/profiles/

## Pick a collection path

1. **Alloy eBPF** (preferred, no code change). CPU only.
2. **SDK, direct push** to Pyroscope.
3. **SDK to Alloy** via `pyroscope.receive_http`.

The SDK can also run in pull mode via Alloy. Alloy itself is in [ALLOY.md](ALLOY.md).

| Language | CPU | Memory | Goroutines | Allocations |
|---|---|---|---|---|
| Node.js (SDK) | yes | yes | no | yes |
| eBPF (any supported language) | yes | no | no | no |

## Node.js SDK

```bash
npm install @pyroscope/nodejs
```

```javascript
const Pyroscope = require('@pyroscope/nodejs');
Pyroscope.init({
    serverAddress: 'http://pyroscope:4040',
    appName: 'my-node-service',
    tags: { region: process.env.REGION },
    basicAuthUser: process.env.PYROSCOPE_USER,
    basicAuthPassword: process.env.PYROSCOPE_PASSWORD,
    flushIntervalMs: 60000,
});
Pyroscope.start();
Pyroscope.wrapWithLabels({ vehicle: 'bike' }, () => slowCode());
```

| Option | Env var | Default or meaning |
|---|---|---|
| `appName` | `PYROSCOPE_APPLICATION_NAME` | sets `service_name` |
| `serverAddress` | `PYROSCOPE_SERVER_ADDRESS` | |
| `basicAuthUser` | | Grafana Cloud stack user ID |
| `basicAuthPassword` | | Grafana Cloud API key |
| `flushIntervalMs` | | 60000 |
| `heapSamplingIntervalBytes` | | 524288 |
| `heapStackDepth` | | 64 |
| `wall.SamplingDurationMs` | | 60000 |
| `wall.SamplingIntervalMicros` | | 10000 |
| `wall.CollectCpuTime` | | false; required for CPU profiling |
| `tags` | | static labels, e.g. hostname, region, team |
| `sourceMapper` | | |
| `tenantID` | | optional, for multi-tenancy; not for Grafana Cloud |

- **Dynamic labels** wrap code: `Pyroscope.wrapWithLabels({ vehicle: 'bike' }, () => slowCode());`.
- **Tag names** must match `[a-zA-Z_][a-zA-Z0-9_]*`; periods are NOT allowed.
- **Grafana Cloud credentials:** stack Details > Pyroscope, or a Cloud Access Policy token. The user is the numeric stack ID, not the slug: a 401 on push means a wrong `basic_auth_username`.
- **Debug:** `DEBUG=pyroscope node index.js`.

## Alloy eBPF

Supports C/C++, Go, Rust, Java (Hotspot), Python, Ruby, Node.js, PHP, .NET and V8. Alloy must run as root in the host PID namespace, on Linux 5.8+ with BTF (or RHEL 4.18+).

```alloy
discovery.kubernetes "all_pods" {
  role = "pod"
  selectors { field = "spec.nodeName=" + sys.env("HOSTNAME") }
}

discovery.relabel "local_pods" {
  targets = discovery.kubernetes.all_pods.targets
  rule {
    source_labels = ["__meta_kubernetes_namespace"]
    target_label  = "namespace"
  }
}

pyroscope.ebpf "local_pods" {
  forward_to        = [pyroscope.write.cloud.receiver]
  targets           = discovery.relabel.local_pods.output
  sample_rate       = 97          // samples per second
  collect_interval  = "15s"
}

pyroscope.write "cloud" {
  endpoint {
    url = "https://profiles-prod-xxx.grafana.net"
    basic_auth {
      username = sys.env("PYROSCOPE_USER")
      password = sys.env("GRAFANA_API_KEY")
    }
  }
}
```

- **Verify:** reload Alloy (`curl -X POST http://localhost:12345/-/reload`), then `curl -s http://localhost:12345/api/v0/web/components | jq '.[] | select(.id|contains("pyroscope.ebpf")) | {id,health:.health.state}'` should show `healthy`; in Grafana Explore with the Profiles data source, query `{namespace="default", __profile_type__="process_cpu:cpu:nanoseconds:cpu:nanoseconds"}` and expect a flame graph with frames from the target pods.
- **Unhealthy with BPF errors:** the kernel is older than 5.8 or BTF is missing; check `ls /sys/kernel/btf/vmlinux`.

## Querying profiles

```
# All CPU profiles for a service
{service_name="myapp", __profile_type__="process_cpu:cpu:nanoseconds:cpu:nanoseconds"}

# Filter by label
{service_name="myapp", env="prod"}
```

Profile type format: `<type>:<value_type>:<value_unit>:<span_name>:<span_unit>`.

| Profile | Type ID (Pyroscope skill) | Type ID (profilecli skill) |
|---|---|---|
| CPU | `process_cpu:cpu:nanoseconds:cpu:nanoseconds` | same |
| In-use memory | `memory:inuse_space:bytes:space:bytes` | |
| Allocated memory | `memory:alloc_space:bytes:space:bytes` | |
| Goroutines | `goroutine:goroutine:count::` | `goroutine:goroutine:count:goroutine:count` |
| Mutex | `mutex:contentions:count::` | `mutex:contentions:count:contentions:count` |
| Block | | `block:contentions:count:contentions:count` |

The two skills disagree on the goroutine and mutex IDs. List the real ones with `profilecli query series --label-names=__profile_type__` before hard-coding them.

- **Trace to profile:** link Tempo spans to profiles with the Tempo data source's `tracesToProfiles` block ([TEMPO.md](TEMPO.md#grafana-data-source)).
- **In Grafana:** Explore > Profiles, then the service dropdown.

## profilecli

Pull a profile and read its hot functions from the terminal. Requires `profilecli` and `pprof` (or `go tool pprof`) and access to a Pyroscope-compatible server (a local one on port `4040`, or Grafana with a service account token). Download: the profilecli skill gives https://github.com/grafana/pyroscope/releases/latest/download/ in its setup step and https://github.com/grafana/pyroscope/releases/latest in its error handling; confirm in the current docs.

Pick the pprof command once:

```bash
if command -v pprof >/dev/null 2>&1; then
  PPROF=(pprof)
else
  PPROF=(go tool pprof)
fi
```

| Env var | |
|---|---|
| `PROFILECLI_URL` | required, e.g. `http://localhost:4040`, or the Grafana proxy `https://my-grafana.example.com/api/datasources/proxy/uid/<datasource-uid>` |
| `PROFILECLI_TOKEN` | required for Grafana Cloud: a service account token `glsa_...` with the Viewer role |
| `PROFILECLI_TENANT_ID` | optional |

```bash
profilecli --version
profilecli query series --label-names=__profile_type__ --output json
profilecli query series --query '{}' --label-names service_repository --label-names service_name --output json
PROFILE="$(mktemp -t profilecli-insights)"

profilecli query profile \
  --query '<QUERY>' \
  --profile-type <PROFILE_TYPE> \
  --from now-1h --to now \
  --output "pprof=${PROFILE}" -f
"${PPROF[@]}" -lines -top -cum "${PROFILE}"
```

- **Find your service:** match `service_repository` to `git remote get-url origin`. If the service is not found, list services and ask.
- **`--query` must be a valid ProfileQL label selector,** and `--profile-type` one of the types the first `query series` returned.
- **Empty output:** broaden to `--from now-6h` or `now-24h`, and verify the service with `query series`.
- **Reading pprof:** flat = self time; cum includes callees. Line format: `<flat> <flat%> <sum%> <cum> <cum%>  <function-name> <source-file>:<line>`.

| Hot frame | Hint |
|---|---|
| `runtime.mallocgc` | allocation pressure |
| `runtime.futex`, `runtime.lock` | lock contention |
| `runtime.gcBgMarkWorker`, `runtime.gcDrain` | GC |
| `compress/gzip`, `compress/flate` | compression |

- **Map frames to source (Go modules):** strip the normalized module prefix; `@v...` frames are third-party. Compare the Build ID `git_ref` with `git log --oneline -1`, warn that line numbers may be stale if they differ (with no `git_ref`, source alignment cannot be verified), check `git log --oneline <git_ref>..HEAD -- <file>`, and read about 20 lines either side of the hot line.
- **Report:** Summary; Top Hot Functions; Source Code Analysis; Recommendations.

## Troubleshooting

| Symptom | Fix |
|---|---|
| SDK sends no flame graph | Check `start()`/`configure()` is called (some SDKs are lazy) and `server_address` is reachable from the container |
| 401 on Cloud push | `basic_auth_username` must be the numeric stack ID, not the slug |
| eBPF component unhealthy | Kernel 5.8+ with `/sys/kernel/btf/vmlinux` |
| `profilecli` connection error | Check `PROFILECLI_URL` |
| `profilecli` 401/403 | Check `PROFILECLI_TOKEN` and `PROFILECLI_TENANT_ID` |
| `profilecli` empty | Broaden the time range |

## Prove it

- `curl -s http://pyroscope:4040/ready` returns `ready`, and `curl -s http://pyroscope:4040/api/v1/labels | jq '.data | index("service_name")'` is not null.
- Your service appears in Explore > Profiles, and `profilecli query series --label-names=__profile_type__` lists the profile types you expect (CPU only for eBPF).
- `profilecli query profile` over the last hour writes a non-empty pprof file whose `-top -cum` output names functions from your own code.
