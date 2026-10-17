# Infrastructure and Cloud Monitoring

Infrastructure monitoring covers Kubernetes clusters, Linux hosts and Docker containers (collected by Alloy you run) and cloud providers (scraped for you by Grafana Cloud's hosted exporters). On Kubernetes, the `k8s-monitoring` Helm chart deploys Alloy, kube-state-metrics and node-exporter in one step; on hosts, Alloy's exporters do the job; for AWS, Azure and Confluent, hosted exporters poll the provider's API on your behalf. Most outcomes come down to the credentials (the API key secret on the cluster, the IAM actions or Azure role on the provider) and to scraping only the namespaces and resources you need. Alloy pipelines are [ALLOY.md](ALLOY.md); PromQL is [PROMETHEUS.md](PROMETHEUS.md) and [PROMQL.md](PROMQL.md); dashboards are [DASHBOARDS.md](DASHBOARDS.md). Docs: https://grafana.com/docs/grafana-cloud/monitor-infrastructure/ and the chart at https://github.com/grafana/k8s-monitoring-helm

**Contents:** [Kubernetes](#kubernetes) · [Linux hosts](#linux-hosts) · [Docker](#docker) · [Cloud integrations (hosted exporters)](#cloud-integrations-hosted-exporters) · [Cloud datasources by provisioning](#cloud-datasources-by-provisioning) · [Debugging](#debugging) · [Prove it](#prove-it)

- **Prerequisites:** a Grafana Cloud stack with Prometheus, Loki and Tempo endpoints and an API key; for Kubernetes, a cluster, `helm` 3.x and a `kubectl` context pointing at it; for hosts and Docker, Alloy installed on the node.

## Kubernetes

### Install the `k8s-monitoring` chart

```bash
kubectl create namespace monitoring
kubectl create secret generic grafana-cloud-secret \
  -n monitoring --from-literal=api-key=<your-api-key>
helm repo add grafana https://grafana.github.io/helm-charts && helm repo update
helm install k8s-monitoring grafana/k8s-monitoring \
  --version 4.1.4 -n monitoring -f values.yaml
```

- **Other install forms:** the send-data skill adds `--create-namespace` to the same `helm install ... --version 4.1.4`; the opentelemetry skill runs `helm upgrade --install k8s-monitoring grafana/k8s-monitoring --namespace monitoring --create-namespace -f values.yaml` with no version pin.
- **Check the chart's Alloy logs:** `kubectl -n monitoring logs deploy/k8s-monitoring-alloy-metrics --tail=50 | grep -iE 'error|level=err' || echo "clean"`.

### `values.yaml`

```yaml
cluster:
  name: production-us-east

externalServices:
  prometheus:
    host: https://prometheus-prod-xx.grafana.net
    basicAuth:
      username: "123456"
      password: { secretName: grafana-cloud-secret, secretKey: api-key }
  loki:
    host: https://logs-prod-xx.grafana.net
    basicAuth:
      username: "234567"
      password: { secretName: grafana-cloud-secret, secretKey: api-key }
  tempo:
    host: https://tempo-prod-xx.grafana.net:443
    basicAuth:
      username: "345678"
      password: { secretName: grafana-cloud-secret, secretKey: api-key }

metrics:
  enabled: true
  cost: { enabled: true }            # Kubernetes cost monitoring
  podMonitors:     { enabled: true }
  serviceMonitors: { enabled: true }
  kube-state-metrics: { enabled: true }
  node-exporter:      { enabled: true }
  cadvisor:           { enabled: true }

logs:
  pod_logs:       { enabled: true }
  cluster_events: { enabled: true }

traces:   { enabled: true }
profiles: { enabled: false }

receivers:
  grpc: { enabled: true, port: 4317 }
  http: { enabled: true, port: 4318 }
```

- **The sources disagree on the receiver keys:** the infrastructure skill uses `receivers.grpc` / `receivers.http`; the opentelemetry skill uses `receivers.otlp.grpc/http.enabled` with `opencost.enabled: false` and an inline `password: "${GRAFANA_API_KEY}"`. Check the chart's values for version 4.1.4.
- **Extra Postgres scraping and logs** go in the chart's `alloy-metrics.extraConfig` and `podLogs.extraDiscoveryRules` ([APP-AND-DB-OBSERVABILITY.md](APP-AND-DB-OBSERVABILITY.md#postgres-infrastructure-integration)).

### Queries

```promql
sum(rate(container_cpu_usage_seconds_total{namespace="$namespace", container!=""}[5m])) by (pod)
sum(container_memory_working_set_bytes{namespace="$namespace", container!=""}) by (pod)
1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) by (instance)
increase(kube_pod_container_status_restarts_total[1h])
kube_deployment_status_replicas_ready / kube_deployment_spec_replicas
kubelet_volume_stats_used_bytes / kubelet_volume_stats_capacity_bytes
```

### Dashboards and alerts

- **Dashboard IDs:** Kubernetes Cluster 15520, Namespace 15521, Pod 15522, Node Exporter Full 1860, cAdvisor 14282.
- **Alert rules:**

```yaml
groups:
  - name: kubernetes-alerts
    rules:
      - alert: PodCrashLooping
        expr: rate(kube_pod_container_status_restarts_total[15m]) * 60 * 15 > 0
        for: 5m
        labels: { severity: warning }
        annotations:
          summary: "Pod {{ $labels.namespace }}/{{ $labels.pod }} crash looping"

      - alert: NodeMemoryPressure
        expr: (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) < 0.1
        for: 5m
        labels: { severity: critical }
        annotations:
          summary: "Node {{ $labels.instance }} low memory (<10% free)"

      - alert: PersistentVolumeAlmostFull
        expr: kubelet_volume_stats_available_bytes / kubelet_volume_stats_capacity_bytes < 0.1
        for: 5m
        labels: { severity: warning }
        annotations:
          summary: "PVC {{ $labels.namespace }}/{{ $labels.persistentvolumeclaim }} almost full"
```

Rule files, routing and on-call are [ALERTING-AND-ONCALL.md](ALERTING-AND-ONCALL.md).

## Linux hosts

```alloy
prometheus.exporter.unix "host" {
  rootfs_path = "/"
  enable_collectors = ["cpu", "diskstats", "filesystem", "loadavg", "meminfo", "netdev", "stat", "time", "uname"]
}

prometheus.scrape "node" {
  targets         = prometheus.exporter.unix.host.targets
  forward_to      = [prometheus.remote_write.cloud.receiver]
  scrape_interval = "60s"
}
```

- **Reload and verify:** `systemctl reload alloy`, then `curl -s http://localhost:12345/api/v0/web/components | jq '.[] | select(.id|contains("prometheus.exporter.unix"))'`. In Grafana Cloud, open the "Node Exporter Full" dashboard (ID 1860) and pick the host from the `instance` dropdown.
- **Journal and syslog** collection is in [ALLOY.md](ALLOY.md#cluster-events-node-logs-journal).

## Docker

```alloy
prometheus.scrape "cadvisor" {
  targets      = [{"__address__" = "localhost:8080"}]
  metrics_path = "/metrics"
  forward_to   = [prometheus.remote_write.cloud.receiver]
}

discovery.docker "containers" {
  host = "unix:///var/run/docker.sock"
}

loki.source.docker "containers" {
  host       = "unix:///var/run/docker.sock"
  targets    = discovery.docker.containers.targets
  forward_to = [loki.write.cloud.receiver]
}
```

## Cloud integrations (hosted exporters)

Hosted exporters scrape cloud APIs on your behalf: AWS CloudWatch (through YACE), Azure Monitor, Confluent Cloud, and a generic HTTP `/metrics` endpoint behind auth. The AWS Firehose receiver ingests CloudWatch Logs and Metric Streams in near real time. Open them from **Connections** > **Add new connection** (or **Connections** > **Cloud Provider**); **All integrations** is the full catalog (Linux, MySQL, Kubernetes and more). Popular integrations: AWS CloudWatch, Azure Monitor, GCP, Kubernetes, Docker, MySQL, PostgreSQL, Redis, Nginx, Apache, JVM, Node.js, Python, .NET. Docs: https://grafana.com/docs/grafana-cloud/monitor-infrastructure/integrations/

### AWS

- **The hosted exporter polls every 60 s,** with about 1 to 5 minutes of latency, and starts within 2 to 3 minutes.
- **Minimum IAM policy:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:GetMetricData",
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics",
        "tag:GetResources",
        "ec2:DescribeInstances",
        "ec2:DescribeRegions"
      ],
      "Resource": "*"
    }
  ]
}
```

- **Hosted exporter setup:** create an IAM user or role with that policy; generate an access key pair (IAM user) or configure cross-account role assumption; in Grafana Cloud go to **Connections** > **AWS** > **Configure hosted exporter** and enter the Access Key ID, Secret Access Key, region(s) and the CloudWatch namespaces to scrape. Supported namespaces include EC2, RDS, ELB/ALB, S3, Lambda, ECS, SQS, SNS, ElastiCache, Kinesis, DynamoDB and 50+ others.
- **GetMetricData is rate-limited;** with many resources, use Metric Streams through Firehose.
- **Firehose receiver (streaming):** CloudWatch Metric Streams, and CloudWatch Logs through a subscription filter, go to Kinesis Firehose and then to the Grafana Cloud Firehose receiver. In Grafana Cloud open **Connections** > **AWS** > **Firehose receiver**, which gives an HTTPS endpoint URL and an access token. In AWS create a Firehose delivery stream (destination HTTP endpoint, that URL and access key, content encoding GZIP), then a CloudWatch Metric Stream pointing at it with output format `OpenTelemetry 1.0` and the namespaces selected or all included; for logs, add a CloudWatch Logs subscription filter pointing at the stream.

```hcl
resource "aws_cloudwatch_metric_stream" "grafana_cloud" {
  name          = "grafana-cloud-metrics"
  role_arn      = aws_iam_role.firehose_role.arn
  firehose_arn  = aws_kinesis_firehose_delivery_stream.grafana.arn
  output_format = "opentelemetry1.0"

  # Optionally scope to specific namespaces
  # include_filter { namespace = "AWS/EC2" }
  # include_filter { namespace = "AWS/RDS" }
}

resource "aws_kinesis_firehose_delivery_stream" "grafana" {
  name        = "grafana-cloud-stream"
  destination = "http_endpoint"

  http_endpoint_configuration {
    url            = var.grafana_firehose_endpoint
    access_key     = var.grafana_firehose_access_key
    name           = "Grafana Cloud"
    content_encoding = "GZIP"

    s3_configuration {
      role_arn   = aws_iam_role.firehose_role.arn
      bucket_arn = aws_s3_bucket.firehose_backup.arn
    }
  }
}
```

- **Cut cost:** hosted exporters scrape all metrics by default. Switch from "All namespaces" to specific ones (for example EC2 and RDS only), filter by resource tag in the exporter configuration, and use Adaptive Metrics to aggregate away unused label dimensions ([CARDINALITY-AND-COST.md](CARDINALITY-AND-COST.md)).

```yaml
# In exporter configuration, add tag filters
discovery:
  - type: AWS/EC2
    filters:
      - key: Environment
        values: ["production"]
```


### Azure

- **A service principal with Monitoring Reader:**

```bash
# Create service principal
az ad sp create-for-rbac --name grafana-cloud-monitoring \
  --role "Monitoring Reader" \
  --scopes /subscriptions/<SUBSCRIPTION_ID>

# Output: appId (client ID), password (client secret), tenant
```

- **Setup:** **Connections** > **Azure** > **Configure hosted exporter**; enter the Tenant ID, Client ID, Client Secret and Subscription IDs, and select the resource types (Virtual Machines, App Service Plans, AKS, Azure SQL, CosmosDB, Storage Accounts, Event Hubs, Service Bus, Application Gateway and others). Scraping begins within 2 to 3 minutes. To cut cost, enable only the resource types you have dashboards for.

### Confluent

- **A Metrics API key, not a Kafka API key,** with the `MetricsViewer` role, created in Confluent Cloud under **Environment** > **API Keys** (or Cloud API Keys for organization level).
- **Setup:** **Connections** > **Confluent** > **Configure hosted exporter**; enter the API Key, API Secret, Environment ID(s) and Cluster ID(s). The exporter polls the Confluent Metrics API every 60 s for consumer lag, broker request rates, partition counts, replication lag, active controller count and cluster health.

### The integrations API

```bash
# List available integrations
curl https://integrations-api-prod.grafana.net/api/v1/integrations \
  -H "Authorization: Bearer <api-key>"

# Install AWS CloudWatch integration
curl -X POST https://integrations-api-prod.grafana.net/api/v1/integrations/cloudwatch \
  -H "Authorization: Bearer <api-key>" \
  -H "Content-Type: application/json" \
  -d '{"name": "aws-prod", "config": {...}}'
```

- **The sources disagree on the host and token:** the send-data skill uses `integrations-api-prod.grafana.net` with `Bearer <api-key>`; the cloud-integrations skill uses `https://integrations-api.grafana.net/api/v1/integrations` with `Authorization: Bearer <STACK_ID>:<API_TOKEN>`. Check the current API docs.
- **Integration status through the API:**

```bash
# Check the integration status via Grafana Cloud API
curl -s -H "Authorization: Bearer <STACK_ID>:<API_TOKEN>" \
  "https://integrations-api.grafana.net/api/v1/integrations" | \
  jq '.integrations[] | {name, status, lastScrapeTime, errorMessage}'
```

- **Every integration installs dashboards and alert rules.** Dashboards are under **Dashboards** > **Browse** in a folder named after the integration (for example "AWS CloudWatch"); alert rules under **Alerting** > **Alert rules**, filtered by datasource or folder. Don't edit the provisioned dashboards; updates may overwrite them. Duplicate with **Dashboard settings** > **Save as copy** and edit the copy.

## Cloud datasources by provisioning

- **AWS CloudWatch:** scrape the CloudWatch exporter, or provision the datasource:

```alloy
prometheus.scrape "cloudwatch" {
  targets    = [{__address__ = "cloudwatch-exporter:9106"}]
  forward_to = [prometheus.remote_write.cloud.receiver]
}
```

```yaml
# provisioning/datasources/cloudwatch.yaml
apiVersion: 1
datasources:
  - name: CloudWatch
    type: cloudwatch
    jsonData:
      defaultRegion: us-east-1
      authType: default          # uses EC2 instance / ECS task role
      # Or explicit creds:
      # authType: credentials
    secureJsonData:
      accessKey: AKIAIOSFODNN7EXAMPLE
      secretKey: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

- **Azure Monitor:**

```yaml
# provisioning/datasources/azure.yaml
apiVersion: 1
datasources:
  - name: Azure Monitor
    type: grafana-azure-monitor-datasource
    jsonData:
      cloudName: AzureCloud
      tenantId:  your-tenant-id
      clientId:  your-client-id
    secureJsonData:
      clientSecret: your-client-secret
```

- **Google Cloud Monitoring:**

```yaml
# provisioning/datasources/google.yaml
apiVersion: 1
datasources:
  - name: Google Cloud Monitoring
    type: stackdriver
    jsonData:
      authenticationType: gce    # uses GCE metadata server
      # Or JWT:
      # authenticationType: jwt
    secureJsonData:
      privateKey: |
        { "type": "service_account", ... }
```

- **After provisioning,** restart Grafana to pick up the file, then test the datasource under **Connections** > **Data sources** > "Test" (expect "Successfully queried the CloudWatch metrics API" or the equivalent), and confirm a query in Explore, for example CloudWatch namespace `AWS/EC2` metric `CPUUtilization` over the last 1h. Datasource docs: https://grafana.com/docs/grafana/latest/datasources/aws-cloudwatch/, https://grafana.com/docs/grafana/latest/datasources/azure-monitor/, https://grafana.com/docs/grafana/latest/datasources/google-cloud-monitoring/

## Debugging

| Symptom | Cause and fix |
|---|---|
| No metrics from the cluster | The `api-key` secret value; look for `401` in the Alloy logs |
| `kube-state-metrics` Pending | Likely RBAC; reapply the chart's CRDs/CRBs |
| node-exporter in `CrashLoopBackOff` | A `hostNetwork: true` collision on :9100; change the port |
| CloudWatch "Access denied" | Add `cloudwatch:GetMetricData` and `cloudwatch:ListMetrics` |
| `AccessDenied` (AWS) | IAM policy missing permissions; add the required actions |
| `AuthorizationFailed` (Azure) | Service principal missing its role; grant Monitoring Reader on the subscription |
| `401 Unauthorized` (Confluent) | Wrong API credentials; re-enter them and confirm it is a Metrics API key, not a Kafka key |
| `No metrics found` | Wrong namespace or resource type selected; add it in the integration settings |
| `Scrape timeout` | Network restriction; make sure Grafana Cloud's IPs can reach the cloud provider API |

## Prove it

- **Cluster pods:** `kubectl get pods -n monitoring` shows `alloy-*`, `kube-state-metrics-*` and `node-exporter-*` all Ready.
- **Cluster metrics and logs:** PromQL `sum(up{cluster="production-us-east"})` and LogQL `sum(count_over_time({cluster="production-us-east"}[5m]))` both return values for your `cluster.name`.
- **Host exporter:** the `prometheus.exporter.unix` component appears healthy in the components API.
- **Cloud integrations:** `{job="integrations/cloudwatch"}` and `{job="integrations/azure-monitor"}` return series. On **Connections** > [integration name] > **Status**, healthy means the last successful scrape within 2 minutes, a non-zero and stable series count, and a 0% error rate. Metric arrival can also be checked against the stack's Prometheus endpoint:

```bash
curl -s -H "Authorization: Bearer <USER>:<API_KEY>" \
  "https://prometheus-prod-XX-XX-X.grafana.net/api/prom/api/v1/labels" | \
  jq '.data | map(select(startswith("aws_") or startswith("azure_")))'
```
- **Cloud datasources:** the datasource "Test" button succeeds and an Explore query returns data.
