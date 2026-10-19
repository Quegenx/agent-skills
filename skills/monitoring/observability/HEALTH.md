# Health endpoints

Two questions with different consequences, so two endpoints:

| | Liveness (`/health/live`) | Readiness (`/health/ready`) |
|---|---|---|
| Question | Is this process stuck beyond recovery? | Should this instance receive traffic right now? |
| On failure | The orchestrator restarts the process | The load balancer stops sending it requests until it passes again |
| Checks | Only the process itself: it answers. No dependencies | The dependencies a request needs: database, cache, broker, with short timeouts |

**Why the split matters:** if liveness checks the database, a 30-second database blip restarts every instance at once, and they come back to a still-down database and restart again. Readiness takes them out of rotation and puts them back without a restart. Readiness can gate traffic while migrations, caches and connections initialize. Kubernetes also has a distinct startup probe: it delays liveness/readiness probes until startup succeeds, and failure can restart the container according to its restart policy. The old line equated startup with readiness. [Kubernetes probe types](https://kubernetes.io/docs/concepts/workloads/pods/probes/)

```ts
app.get("/health/live", (_req, res) => res.status(200).send("ok"));

app.get("/health/ready", async (_req, res) => {
  const checks = await Promise.all([
    check("postgres", () => db.query("select 1")),
    check("redis", () => redis.ping()),
  ]);
  const healthy = checks.every((c) => c.status !== "unhealthy");
  res.status(healthy ? 200 : 503).json({ status: healthy ? "healthy" : "unhealthy", checks });
});

async function check(name: string, probe: () => Promise<unknown>, timeoutMs = 1000) {
  const started = performance.now();
  try {
    await Promise.race([probe(), new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), timeoutMs))]);
    return { name, status: "healthy" as const, durationMs: Math.round(performance.now() - started) };
  } catch {
    return { name, status: "unhealthy" as const, durationMs: Math.round(performance.now() - started) };
  }
}
```

- **Report each dependency separately** (name, status, duration), so "unhealthy" says which one. A single overall string hides the cause.
- **Three states help:** healthy, degraded (working but slow, or an optional dependency down) and unhealthy. Decide which dependencies are required for readiness; an analytics API being down shouldn't take the instance out of rotation.
- **Cheap probes:** `select 1`, a `PING`, a connection check. Not a real query over a large table, and not on every request path.
- **Keep detail private.** The public load balancer needs a status code; dependency names, durations and error messages belong on an internal port or behind authentication. Never put exception text or connection strings in the response.
- **Health checks can cascade a slow database through the cluster:** the incident mechanism is in [Pools and queueing](DIAGNOSE.md#pools-and-queueing).
- **Health checks are not monitoring.** They gate traffic and restarts; alerting comes from metrics and traces over time (error rates, latency, saturation), which see problems that a `select 1` passes.
- Container health checks and graceful shutdown are in the `deployment` skill's CONTAINERS.md; how readiness fits load balancing and rolling deploys is in the `system-design` skill.

## Prove it

An unavailable required dependency fails readiness with 503 while liveness checks only the process. Dependency checks have short timeouts and separate statuses; optional dependencies follow the chosen degraded policy. Dependency names, durations and errors remain private. [existing observability, HEALTH.md, endpoint table, handler and rules]
