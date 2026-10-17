# Reading graphs and diagnosing incidents

How to read monitoring graphs and act on what they show: in peacetime, mid-incident and in the postmortem. Building the panels and alerts is in the `grafana` skill ([DASHBOARDS.md](../../monitoring/grafana/DASHBOARDS.md), [ALERTING-AND-ONCALL.md](../../monitoring/grafana/ALERTING-AND-ONCALL.md)).

Reference: "How to Read Server Monitoring Graphs", https://kciter.so/posts/server-monitoring-analysis-guide/en/ (the four signals and the change statistic cite the Google SRE book, https://sre.google/sre-book/monitoring-distributed-systems/).

**Contents:** [Symptoms first, then causes](#symptoms-first-then-causes) · [Traffic](#traffic) · [Latency](#latency) · [Errors](#errors) · [CPU](#cpu) · [Memory](#memory) · [Pools and queueing](#pools-and-queueing) · [Event-loop servers](#event-loop-servers) · [Bottlenecks and the utilization knee](#bottlenecks-and-the-utilization-knee) · [Queues, backpressure, load shedding](#queues-backpressure-load-shedding) · [Cache hit rate](#cache-hit-rate) · [When two dashboards disagree](#when-two-dashboards-disagree) · [The diagnosis table](#the-diagnosis-table) · [Three kinds of time](#three-kinds-of-time) · [Mid-incident](#mid-incident) · [The thirty minutes after a deploy](#the-thirty-minutes-after-a-deploy) · [Slow decline](#slow-decline) · [The postmortem](#the-postmortem) · [Prove it](#prove-it)

## Symptoms first, then causes

- **Four signals, four questions.** "**Traffic**: how much is coming in? **Latency**: how long does it take? **Errors**: how often do requests fail? **Saturation**: how full are we?" Traffic is usually requests or transactions per second; latency is "the time from a request coming in to the response going out"; errors are "the proportion of requests the server failed to process"; saturation is "how much of the server's resources are in use, through metrics like CPU, memory, thread pools, and connection pools."
- **Latency and error rate are symptoms:** "when they rise, it is a problem, always". CPU, memory and thread pools are causes. "CPU at 90% is not an immediate emergency if responses are fast, and CPU at 20% is a problem if responses are slow. A sustained 90% does mean there is no headroom left, so it needs watching, but it is not a reason to wake someone up at dawn."
- **The order of work:** "always identify the symptom first, then narrow down the culprit through the causes." Attach alerts to symptoms too: "A momentary 'CPU over 80%' alert often wakes someone at dawn over nothing, but if an 'error rate exceeded' alert fires, someone is actually having a problem."
- **Read traffic first.** It is context, not a symptom, but it is the instrument for reading latency and errors.
- **Lay resource metrics over the symptoms.** "A resource metric read on its own will lie to you. Whether CPU at 90% is a problem is answered by response time, not by the CPU graph."
- **The opening move when an alert fires:** start from "how much is coming in, how long is it taking, how much is failing, and what is filling up."

## Traffic

- **Know the normal daily shape.** "If the metric is at half its usual level, something is wrong even if the value sits inside the normal range."
- **A vertical drop** means requests are failing to arrive (the load balancer, DNS or gateway out front), not that the server went idle. "If every server metric looks clean in the middle of an incident, that itself is the biggest anomaly signal."
- **A vertical rise** means a viral surge, crawler traffic or an attack. Regular early-morning spikes "are almost always batch jobs or cron. If the spikes are regular, suspect an internal job first."
- **Traffic is the denominator.** "The same 500 errors mean very different things at a million requests per minute and at a thousand." Divide any count (errors, slow queries) by traffic and read it as a rate.
- **A spike after an incident starts is usually a retry storm,** "the same users knocking again and again", not more users. Clients and gateways retrying at once push traffic to 2 to 3 times normal. Retries need exponential backoff, jitter and a budget on total retrying ([RELIABILITY.md](../api-design/RELIABILITY.md#retry-timeout-circuit-breaker)): "A well-built retry absorbs a transient failure. A badly built one amplifies the incident."

## Latency

- **The average "erases the shape of the distribution".** A server where every request takes about 100ms and one where most take 30ms but some take 900ms can both average 100ms. P50, P95 and P99 are the values at the 50%, 95% and 99% marks; tail latency is the slow responses around P99.
- **1% is not small.** At 1,000 req/s, ten requests hit P99 every second, 860,000 a day. When one screen makes about 40 API calls, the chance that all of them avoid P99 is 0.99^40 = 67%: "One user in three experiences tail latency somewhere on the screen."
- **Tail users are not random.** "Heavy, long-time users have more data, so they generate heavier queries and land in the tail more often. P99 is quite possibly the response time your best customers are getting."
- **Roles:** "P50 is the representative value for user experience, and P95 or P99 should be the basis for alerts and performance targets." "The early signs of an incident almost always appear in P99 first."

## Errors

- **Ask "which errors" before "how many percent".** 5xx is "always our problem". 4xx surging right after a deploy is more likely a broken API contract (a new app version talking to an old server, or the reverse). "The 4xx graph asks 'whose mistake is this?' while the 5xx graph asks 'what of ours is broken?'"
- **Slow failures and fast failures.** Timeouts "fail slowly": they hold a thread and a connection for seconds, so errors and saturation rise together. Connection refusals and code bugs (null references) "fail immediately", returning a 5xx within milliseconds and freeing resources. Error rate and P99 rising together means "something is slowing down and dying"; an error-rate spike with P99 fine means "something is failing instantly."
- **Survivorship bias.** Requests that fail immediately leave the latency distribution or blend in as millisecond samples, so "the worse the incident gets, the better P99 can look. If an incident graph shows the error rate at its worst while response times look better than usual, suspect survivorship bias rather than recovery."

## CPU

| CPU | Latency | Reading |
|---|---|---|
| Follows traffic gently | Low | Healthy |
| Idle (20-30%) | Exploding | Threads are "waiting for something": a slow DB, a held lock, an exhausted connection pool, an external API timing out. Move to I/O and pool metrics |
| Pinned at 100% | Exploding | Look at traffic. Traffic rose too: capacity, so scale out. Traffic normal: "suspect the code" (for example an infinite loop) |

- **Container CPU throttling hides from the utilization graph.** In Kubernetes, with a CPU limit, the container gets a quota per period (100ms by default); when the quota runs out it "is forcibly paused until the period ends". The quota is proportional to the limit: 1 core = 100ms per 100ms period, 500m = 50ms, 2 cores = 200ms. Time spent throttled "never shows up on the utilization graph". Put a throttle metric next to CPU utilization; if P99 spikes while the throttle count climbs, suspect the limit. If traffic and code are unchanged but the tail grew longer, throttling can be the cause.
- **Threads drain the quota together.** The quota (the Linux CFS scheduler's) is CPU time, not wall-clock time: "With a limit of 2 cores … 200ms per period, and if 8 threads run at once they burn 8 × 25ms = 200ms in just 25ms, then stall for the remaining 75ms of the period. The more threads, the more abrupt the stall."

## Memory

- **The sawtooth is normal.** On the JVM or Node, memory fills then drops sharply: GC working, "a kind of heartbeat".
- **Spot a leak by the floor, not the peaks.** Healthy: the lows form a horizontal line. Leaking: the floor "creeps upward like a staircase". Near the heap limit GC runs more often and for longer, eating CPU ("response time degrades first"), and then the process dies of OOM.
- **Don't hunt a leak on the spot.** "Take a heap dump … keep it, and buy time with a restart." Analyze the dump calmly afterwards.
- **A step** (a near-vertical jump on top of the sawtooth) means one request loaded a lot of data at once ("Full-table reads, large file processing, and Excel downloads are the regulars"). Match the step's timestamp against the access log to find the request; fix it with paging or streaming. If it has already landed, "block that API first and clean up."

## Pools and queueing

- **Pigeonhole principle:** "If there are n threads, then the moment the number of requests being handled at once exceeds n, some request must wait."
- **Little's law:** `Requests in flight = arrivals per second × average processing time`. 1,000 req/s × 0.05s = 50 in flight, fine for 200 threads. A slow query that raises processing time to 2s gives 1,000 × 2 = 2,000 in flight, 1,800 of them queued: "Not a single extra request arrived, and yet the server dies." Processing time "is a multiplier". (John Little proved it in 1961; it holds for any stable queueing system with no assumptions about the distributions.)
- **The connection pool runs dry first.** The article cites defaults of 200 for Tomcat's thread pool and 10 for HikariCP's connection pool: with 200 threads sharing 10 connections, "the connection pool runs dry before the thread pool does whenever the DB slows even slightly."
- **A vertical P99 jump means a pool ran dry.** A queued request's time is its own processing plus everyone ahead of it. "If P99 on a graph didn't degrade gradually but jumped vertically at some point, it is likely that a pool somewhere just ran dry."
- **Read the slope of active threads,** not the absolute utilization. A steep climb that does not follow traffic means "the cause is usually not the pool itself but a delay somewhere else."
- **Bigger pools lengthen the line.** When the app logs "connection timeout", "adding connections only makes the line in front of the slow DB longer", and more concurrent sessions can make the DB slower still. Ask why returns became slow before asking whether the pool is too small: put the connection wait time metric next to the DB's slow query log ([CONNECTIONS.md](../postgres/CONNECTIONS.md)).
- **Health checks spread the failure.** Threads blocked on the DB make health checks time out, the load balancer removes the server, and the rest absorb its traffic and run dry faster: "One slow query toppling the whole cluster like dominoes is the most common scenario for a cascading failure." Restarting the dead servers is wasted effort; they reattach to the same slow DB ([HEALTH.md](HEALTH.md)).

## Event-loop servers

- **No request thread pool to watch.** On Node or WebFlux/Netty, one long CPU-bound task stops every request in that process ("When the revolving door stops, everything stops"). The key metric is **event loop lag**, "how much later than scheduled each turn of the loop is running" (the runtime metrics in [INSTRUMENT.md](INSTRUMENT.md)).
- **Read the max or a high percentile, never the average:** one 1-second stall "barely moves an average diluted by normal samples". Compare against your own usual value, not an absolute threshold, and treat "a sustained reading tens of milliseconds above it as a problem."
- **The usual causes** are "oversized JSON serialization, a regex whose backtracking explodes, or cryptographic work running on the loop". Loop lag spiking with CPU at 100% "is close to certain".
- **Aggregate per process.** Node scales by process: "Eight processes averaging 40% CPU hides a situation where seven sit at 25% and one is pinned at 100%." Use a per-process maximum over the average, or "better, put per-process event loop lag on the dashboard."

## Bottlenecks and the utilization knee

- **"In front of the bottleneck, waiting piles up. Behind it, things go quiet."** Total throughput "is decided by the narrowest stage", and expanding a stage that is not the bottleneck does nothing. At 600 req/s offered and an app capacity of 300, the gateway has room, the DB goes quiet and throughput stops at 300.
- **Waiting grows non-linearly with utilization.** With the wait at 50% utilization = 1: 80% gives 4, 90% gives 9, 95% gives 19. The knee is around 80%, and "the 80% threshold commonly used for autoscaling can be seen as a heuristic drawn from it." "We're at 90%, so we still have 10% left" is dangerous arithmetic. When P99 degrades faster than traffic grows, some utilization is passing the knee: "the last window with any slack".

## Queues, backpressure, load shedding

- **A growing queue is "debt that lengthens everyone's wait":** 100 queued at 100/s is a 1s wait, 10,000 queued is 100s. Once the wait passes the client timeout, every successful run "just produces a response nobody is left to receive", and the queue eats memory until OOM. Traffic exceeding throughput like this is called backpressure.
- **Shed load.** Flow control means telling the stage in front and explicitly refusing the traffic you cannot digest right now, instead of hiding the backpressure inside the queue. The simplest form, load shedding: cap the queue and reject the overflow immediately with 429: "some requests are failed fast, and in exchange the accepted remainder is served properly". Without it, "everyone dies slowly and fairly, together" ([RELIABILITY.md](../api-design/RELIABILITY.md#rate-limits)).
- **The signature of missing flow control:** "If the queue length or wait time graph will not stop trending upward, flow control is missing or insufficient. A healthy system's queue graph may slosh, but it always returns to equilibrium."

## Cache hit rate

- **Put the hit rate on the dashboard.** "A 97% hit rate means the DB is carrying only 3% of total traffic", so the DB is sized for that 3%: "The DB behind a cache is safe only on the premise that the cache is intact."
- **When DB load jumps, "check the hit rate graph first.** If the drop in hit rate and the DB spike line up at the same time, the culprit is the cache side, not the DB." The classic trigger is a popular key's TTL expiring (cache stampede; prevention is in the `performance-and-caching` skill's CACHING.md).

## When two dashboards disagree

- **A timeout above the work records a success nobody received.** Gateway timeout 3s, backend query 5s: the user gets a 504 at 3s while the backend finishes and "proudly records a success". "The backend metrics show no failures, and the gateway metrics show no successes", and under overload the wasted work delays recovery. Give the inner layer a shorter timeout than the outer (gateway 3s, backend DB timeout about 2.5s), the article's "timeout budget" ([RELIABILITY.md](../api-design/RELIABILITY.md#deadlines-and-cancellation)).
- "When one layer's error rate and another layer's success rate contradict each other, look at the timeout settings before the code."

## The diagnosis table

| Pattern | Look at |
|---|---|
| P99 spikes + CPU spikes too | Traffic. Either traffic exceeded capacity (scale out) or there may be a code problem |
| P99 spikes + CPU is idle | DB response time and pool waits. Likely a waiting problem such as an I/O bottleneck, lock contention, or pool exhaustion |
| Every API slows down at once | The DB, the cache, the shared pools |
| Only certain APIs slow down | Those APIs' queries and external calls |
| Error rate spikes + P99 normal (or improving) | Deploy history and dependent services |
| One layer shows errors, another shows successes | Each layer's timeout settings |

Whether everything is slow or only some things are slow "cuts the suspect list in half": everything slow is a shared resource (usually the DB or the cache), some things slow is that API's code.

## Three kinds of time

The same dashboard serves three purposes. Peacetime: find where problems will occur. Mid-incident: find the shortest path to resolution. Post-incident: make sure the same incident never happens twice. "Mixing them up is the most common mistake in monitoring."

- **Walk the dashboard in peacetime,** "once a day, five minutes at a time". Learn the usual shape of traffic, the rhythm of the CPU, the everyday P99 and the wobble at each deploy. "If you don't know usual, you can't recognize abnormal either."
- **Set alert thresholds from that observed baseline, in peacetime.** "Debating that baseline while an incident is underway means you are already late."

## Mid-incident

1. **Triage the scope before the cause:** a full outage, a specific API, region or customer. Scope sets the response level, and it is the first diagnosis (everything slow means a shared resource, partly slow means that code).
2. **Ask what changed** in the last thirty minutes to a few hours: a deploy, a config change, a feature flag, infrastructure work, a marketing-driven traffic surge. "The prior probability that it is the culprit is overwhelming, so before digging deep into graphs, consider reverting it first."
3. **Recover first.** "Recovery comes first almost always": rollback, restart, scale out, flag off. The evidence stays in metrics, logs and heap dumps for later.
4. **Diagnose by hypothesis,** only when the prepared recovery measures don't work and the cause has to be narrowed further. "Don't open twenty graphs and scan for anything that looks spiky. Form a hypothesis instead, like 'if the DB slowed down, connection waits should have risen,' then open the one graph that checks it, and discard or adopt."

## The thirty minutes after a deploy

- **Changes cause most outages.** "Roughly 70% of outages originate in changes to a running system" (SRE book). A deploy is the biggest and most frequent change, so "The thirty minutes after a deploy are the time to read the graphs with the most concentration."
- **Mark deploys on the graphs.** "Half of incident analysis is the question 'did this change happen before the deploy or after' … for the cost, no other monitoring improvement pays off more." (Grafana annotations: [DASHBOARDS.md](../../monitoring/grafana/DASHBOARDS.md#links-and-annotations).)
- **Some wobble is expected.** The JIT is not warm, local caches are empty and pools are being re-established, so "P99 jumping to double or triple right after a deploy is not, in itself, an anomaly." Read the direction: a spike that slopes down over minutes is warmup, so wait; a spike that sticks or worsens means consider a rollback.
- **Agree on rollback criteria in advance,** for example "if the error rate exceeds X% after a deploy, or P99 shows no recovery trend within 10 minutes, roll back without debate." "A rollback is a way to resolve the problem decisively within minutes. The cause can be found after the system is stable."
- **Reduce the wobble** with a **slow start** (ramp traffic up gradually after a deploy) or a **warmup stage** that sends priming requests before real traffic to heat the JIT, caches and pools. "The effect is especially large on the JVM, which runs several times slower until the JIT compiler has optimized the frequently executed code."
- **Split canary metrics by version label.** During a gradual rollout "the metrics of the two versions can blend together"; compare canary and existing "at the same time, under the same traffic conditions."

## Slow decline

A 1%-a-day decline produces zero alerts over four weeks. "An alert is a way to catch momentary problems, not a way to find slow decline. Comparison is." Draw last week's same-weekday P99 on top of today's. A trend opens hypotheses: traffic growth, a memory leak, a slower DB, a slipping cache hit rate.

## The postmortem

- **Reconstruct four timestamps:** first trace on a graph, alert fired, response began, service recovered.
- **First trace to alert is the detection gap** ("the warning sign was there well before the alert"). The postmortem's first question is whether that sign can become an alert.
- **Alert to recovery is the speed of response.** For example, 30 minutes lost for lack of a deploy marker is an action item.
- **Reach causation, not correlation.** Mid-incident analysis stops at correlation ("we reverted the deploy and the incident ended"); the postmortem asks "why was that deploy a problem, and why didn't review catch it?" Go one layer past the surface cause: not "because of a slow query" but "because there was no procedure for checking the execution plan of queries against large tables."
- **Never write a person as the cause.** "The moment a person's name goes into the cause field, whoever is standing there during the next incident will hide it or blame themselves … A postmortem that blames people only makes the next incident longer." Record only the context: "in this situation, this was the judgment that had to be made."
- **The output is "a list of changes that make the next incident shorter":** panels, alerts, rollback criteria agreed in advance, root-cause removal.

## Prove it

- The service dashboard shows traffic, latency percentiles (P50 and P99, not only the average), error rate split into 4xx and 5xx, and saturation, with deploy markers on the graphs.
- Every count panel (errors, slow queries) is divided by traffic.
- Rollback criteria for a deploy are written down before the deploy.
- The postmortem records the four timestamps, names the detection gap, has no person in the cause field, and ends in a list of changes.
