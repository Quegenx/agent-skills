# Operating Mimir

Use for Mimir deployment, tenant-aware remote write and queries, storage, capacity and troubleshooting. Metric design, recording rules and scraping stay in [PROMETHEUS.md](PROMETHEUS.md). [existing skills/monitoring/grafana/PROMETHEUS.md]

## Mimir

[existing PROMETHEUS.md]

Grafana Mimir is horizontally scalable, multi-tenant, long-term storage for Prometheus and OpenTelemetry metrics. Docs: https://grafana.com/docs/mimir/latest/

### Architecture

- **Write path:** Client to Distributor to Ingester (WAL) to object storage (blocks). **Read path:** Client to Query-frontend (cache, sharding) to Query-scheduler to Querier, which also reads from the Store-gateway.
- **Components:** Distributor (validates and routes incoming samples via the hash ring), Ingester (in-memory storage, WAL, flushes blocks to the object store), Compactor (merges blocks, enforces retention), Querier (executes PromQL across ingesters and the object store), Query-frontend (request splitting, caching, parallelization), Store-gateway (access to blocks in object storage), Ruler (evaluates recording and alerting rules), Alertmanager (routes and deduplicates alerts).
- **Modes:**

```bash
# Monolithic, single binary, all targets
mimir -config.file=mimir.yaml -target=all

# Read-Write split
mimir -target=write    # distributor + ingester
mimir -target=read     # query-frontend + querier
mimir -target=backend  # store-gateway + compactor + ruler

# Microservices, each target as a separate deployment
```

- **HTTP API:** POST `/api/v1/push`, POST `/otlp/v1/metrics`, GET `/api/v1/query`, `/api/v1/query_range`, `/api/v1/labels`, `/api/v1/series`, `/api/v1/rules`, `/ready`, `/metrics`.
- **Prerequisites:** Docker or Kubernetes; an object storage bucket for production (filesystem only for dev and single node); Prometheus or Alloy `remote_write`.

### Run locally

```yaml
# demo.yaml
target: all
multitenancy_enabled: false

blocks_storage:
  backend: filesystem
  bucket_store:
    sync_dir: /tmp/mimir/tsdb-sync
  filesystem:
    dir: /tmp/mimir/data/tsdb
  tsdb:
    dir: /tmp/mimir/tsdb

compactor:
  data_dir: /tmp/mimir/compactor
  sharding_ring:
    kvstore: { store: memberlist }

distributor:
  ring:
    instance_addr: 127.0.0.1
    kvstore: { store: memberlist }

ingester:
  ring:
    instance_addr: 127.0.0.1
    kvstore: { store: memberlist }
    replication_factor: 1

server:
  http_listen_port: 9009
  grpc_listen_port: 9095
  log_level: error
```

```bash
# 1. Run it
docker run --rm -p 9009:9009 -v $(pwd)/demo.yaml:/etc/mimir/demo.yaml \
  grafana/mimir:latest --config.file=/etc/mimir/demo.yaml

# 2. Verify readiness (expect HTTP 200, body: "ready")
curl -sf http://localhost:9009/ready

# 3. Verify it's serving the API
curl -s http://localhost:9009/api/v1/labels | jq '.status'   # → "success"

# 4. Verify self-metrics scrape
curl -s http://localhost:9009/metrics | grep -E '^mimir_(distributor|ingester)_' | head
```

### Send metrics

```yaml
remote_write:
  - url: http://localhost:9009/api/v1/push
    headers:
      X-Scope-OrgID: tenant1   # required when multitenancy_enabled: true
```

```alloy
prometheus.remote_write "mimir" {
  endpoint {
    url = "http://mimir:9009/api/v1/push"
    headers = { "X-Scope-OrgID" = "tenant1" }
  }
}
```

```bash
# Verify samples are landing
curl -s -H 'X-Scope-OrgID: tenant1' \
  'http://localhost:9009/api/v1/query?query=up' | jq '.data.result | length'
# Expect > 0 within ~30s of Prometheus scraping
```

- **Multi-tenancy:**

```yaml
multitenancy_enabled: true
# Every request must include header:  X-Scope-OrgID: <tenant-id>
```

### Kubernetes

Helm, microservices mode:

```bash
# 1. Install
helm repo add grafana https://grafana.github.io/helm-charts
helm install mimir grafana/mimir-distributed --version 6.0.6 -f values.yaml

# 2. Verify every pod is Running / Ready
kubectl get pods -n mimir
#   distributor, ingester, querier, query-frontend, store-gateway, compactor, ruler

# 3. Verify the gateway is ready
kubectl port-forward -n mimir svc/mimir-nginx 9009:80 &
curl -sf http://localhost:9009/ready
```

### Storage and limits

```yaml
blocks_storage:
  backend: s3
  s3:
    bucket_name: mimir-blocks
    endpoint: s3.us-east-1.amazonaws.com
    region: us-east-1
    access_key_id: ${AWS_ACCESS_KEY_ID}
    secret_access_key: ${AWS_SECRET_ACCESS_KEY}
```

```yaml
blocks_storage:
  backend: gcs
  gcs:
    bucket_name: mimir-blocks
```

```yaml
blocks_storage:
  backend: azure
  azure:
    account_name: storageaccountname
    account_key: ${AZURE_STORAGE_KEY}
    container_name: mimir-blocks
```

Filesystem, dev or single node only:

```yaml
blocks_storage:
  backend: filesystem
  filesystem:
    dir: /tmp/mimir/data/tsdb
```

Common limits:

```yaml
limits:
  ingestion_rate: 10000
  ingestion_burst_size: 200000
  max_global_series_per_user: 1500000
  max_label_names_per_series: 30
  compactor_blocks_retention_period: 30d
  ruler_max_rules_per_rule_group: 20

ingester:
  ring:
    replication_factor: 3

querier:
  max_concurrent: 20

frontend:
  max_outstanding_per_tenant: 100
  compress_responses: true
```

### Production and capacity (self-hosted)

Docs: https://grafana.com/docs/mimir/latest/manage/run-production-environment/production-tips/ and https://grafana.com/docs/mimir/latest/manage/run-production-environment/planning-capacity/

- **Hosts:** `file-max` ulimit at least `65536` (`1048576` with more than 1000 tenants); SSDs for ingesters and store-gateways.
- **Protect and cache:** enable resource-utilization based ingester read-path limiting; enable querier and store-gateway caching; a dedicated Memcached cluster per cache type, with infrequent evictions. Optional gRPC compression `snappy` or `gzip`.
- **Compactor:** one shard per 8 million series, rounded up to a power of two (100M series gives 16), with split-groups equal to the shard count; configure split-and-merge for tenants above 20 million series.
- **Upgrade to 2.15+** to avoid block-cutting latency spikes.
- **Capacity:** run with 50% extra memory and disk. Replication factor defaults to 3.

| Component | Sizing |
|---|---|
| Distributor | 1 core + 1 GB per 25,000 samples/s |
| Ingester | per 300,000 in-memory series: 1 core, 2.5 GB, 5 GB disk |
| Querier | 1 core + 1 GB per 10 QPS |
| Compactor | one per 20 million active series (1 core, 4 GB, 300 GB) |

- **Measure:** active series `sum(prometheus_tsdb_head_series)`; samples/s = `(<active series> * (60 / <scrape interval in seconds>)) / 60`; memcached evictions `sum by(instance) (rate(memcached_items_evicted_total{}[5m]))` should be 0 at steady load.

### Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `/ready` returns 503 | Ingester still joining the ring; check `mimir_ring_members` and the ingester logs |
| `429 Too Many Requests` on push | Raise `limits.ingestion_rate` / `ingestion_burst_size` |
| `429 Too Many Samples` / `out of bounds`, `series_limit_per_user` | Per-tenant series limit; find the metric in [CARDINALITY-AND-COST.md](CARDINALITY-AND-COST.md#troubleshooting-a-cardinality-fire) |
| Data written but queries are empty | Confirm `X-Scope-OrgID` matches between write and read |
| Old data missing | Check compactor logs and the store-gateway's synced blocks |

## Prove it

[existing PROMETHEUS.md]

- Mimir: `/ready` returns `ready`, and `up` queried with your `X-Scope-OrgID` returns more than 0 series within about 30s of starting `remote_write`.
