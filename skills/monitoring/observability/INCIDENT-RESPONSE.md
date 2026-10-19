# Incident response

The incident, deploy-observation and postmortem chapters from [How to Read Server Monitoring Graphs](https://kciter.so/posts/server-monitoring-analysis-guide/en/), with Google's SRE context for the change statistic and the existing public-relations handoffs. Read [DIAGNOSE.md](DIAGNOSE.md) for metric patterns and diagnostic hypotheses; building alerts is in [Grafana](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/grafana/ALERTING.md).

**Contents:** [Three kinds of time](#three-kinds-of-time) · [Mid-incident](#mid-incident) · [The thirty minutes after a deploy](#the-thirty-minutes-after-a-deploy) · [Slow decline](#slow-decline) · [The postmortem](#the-postmortem) · [Prove it](#prove-it)

## Three kinds of time

[kciter.so, How to Read Server Monitoring Graphs]

The same dashboard serves three purposes. Peacetime: find where problems will occur. Mid-incident: find the shortest path to resolution. Post-incident: make sure the same incident never happens twice. "Mixing them up is the most common mistake in monitoring."

- **Walk the dashboard in peacetime,** "once a day, five minutes at a time". Learn the usual shape of traffic, the rhythm of the CPU, the everyday P99 and the wobble at each deploy. "If you don't know usual, you can't recognize abnormal either."
- **Set alert thresholds from that observed baseline, in peacetime.** "Debating that baseline while an incident is underway means you are already late."

## Mid-incident

[kciter.so, How to Read Server Monitoring Graphs]

1. **Triage the scope before the cause:** a full outage, a specific API, region or customer. Scope sets the response level, and it is the first diagnosis (everything slow means a shared resource, partly slow means that code).
2. **Ask what changed** in the last thirty minutes to a few hours: a deploy, a config change, a feature flag, infrastructure work, a marketing-driven traffic surge. "The prior probability that it is the culprit is overwhelming, so before digging deep into graphs, consider reverting it first."
3. **Recover first.** "Recovery comes first almost always": rollback, restart, scale out, flag off. The evidence stays in metrics, logs and heap dumps for later.
4. **Diagnose by hypothesis,** only when the prepared recovery measures don't work and the cause has to be narrowed further. "Don't open twenty graphs and scan for anything that looks spiky. Form a hypothesis instead, like 'if the DB slowed down, connection waits should have risen,' then open the one graph that checks it, and discard or adopt."
5. **Tell customers in parallel.** The public side (a severity tier, one spokesperson and channel of record, a holding statement with no unconfirmed cause or scope, affected customers before social and press, a stated next-update time) runs from [public-relations CRISIS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/public-relations/CRISIS.md) [coreyhaines31/marketingskills, public-relations].

## The thirty minutes after a deploy

[kciter.so, How to Read Server Monitoring Graphs]

- **Changes cause most outages in Google's reported SRE experience.** Google's [Introduction, Change Management](https://sre.google/sre-book/introduction/#change-management) reports roughly 70% of outages from changes to a live system; this is not a measured rate for the reader's service. The source cited the book without that context. The article calls a deploy the biggest and most frequent change, so "The thirty minutes after a deploy are the time to read the graphs with the most concentration." [kciter.so, How to Read Server Monitoring Graphs]
- **Mark deploys on the graphs.** "Half of incident analysis is the question 'did this change happen before the deploy or after' … for the cost, no other monitoring improvement pays off more." (Grafana annotations: [grafana DASHBOARDS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/grafana/DASHBOARDS.md#links-and-annotations).)
- **Some wobble is expected.** The JIT is not warm, local caches are empty and pools are being re-established, so "P99 jumping to double or triple right after a deploy is not, in itself, an anomaly." Read the direction: a spike that slopes down over minutes is warmup, so wait; a spike that sticks or worsens means consider a rollback.
- **Agree on rollback criteria in advance,** for example "if the error rate exceeds X% after a deploy, or P99 shows no recovery trend within 10 minutes, roll back without debate." "A rollback is a way to resolve the problem decisively within minutes. The cause can be found after the system is stable."
- **Reduce the wobble** with a **slow start** (ramp traffic up gradually after a deploy) or a **warmup stage** that sends priming requests before real traffic to heat the JIT, caches and pools. "The effect is especially large on the JVM, which runs several times slower until the JIT compiler has optimized the frequently executed code."
- **Split canary metrics by version label.** During a gradual rollout "the metrics of the two versions can blend together"; compare canary and existing "at the same time, under the same traffic conditions."

## Slow decline

[kciter.so, How to Read Server Monitoring Graphs]

A 1%-a-day decline produces zero alerts over four weeks. "An alert is a way to catch momentary problems, not a way to find slow decline. Comparison is." Draw last week's same-weekday P99 on top of today's. A trend opens hypotheses: traffic growth, a memory leak, a slower DB, a slipping cache hit rate.

## The postmortem

[kciter.so, How to Read Server Monitoring Graphs]

- **Reconstruct four timestamps:** first trace on a graph, alert fired, response began, service recovered.
- **First trace to alert is the detection gap** ("the warning sign was there well before the alert"). The postmortem's first question is whether that sign can become an alert.
- **Alert to recovery is the speed of response.** For example, 30 minutes lost for lack of a deploy marker is an action item.
- **Reach causation, not correlation.** Mid-incident analysis stops at correlation ("we reverted the deploy and the incident ended"); the postmortem asks "why was that deploy a problem, and why didn't review catch it?" Go one layer past the surface cause: not "because of a slow query" but "because there was no procedure for checking the execution plan of queries against large tables."
- **Never write a person as the cause.** "The moment a person's name goes into the cause field, whoever is standing there during the next incident will hide it or blame themselves … A postmortem that blames people only makes the next incident longer." Record only the context: "in this situation, this was the judgment that had to be made."
- **The output is "a list of changes that make the next incident shorter":** panels, alerts, rollback criteria agreed in advance, root-cause removal.
- **The public postmortem is a separate document.** For P0 and P1 public crises, publish a postmortem (repo mapping of the source: Tier 4 to P0, Tier 3 to P1, Tier 2 to P2, Tier 1 to P3) with a summary, timeline, a specific root cause ("Avoid vague phrases like 'a configuration issue.'"), impact, specific verifiable changes, what went well and what you'd do differently; it keeps the no-person rule above. Template: [public-relations CRISIS-STATEMENTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/public-relations/CRISIS-STATEMENTS.md#public-postmortem) [coreyhaines31/marketingskills, public-relations].

## Prove it

[kciter.so, How to Read Server Monitoring Graphs]

- Rollback criteria for a deploy are written down before the deploy.
- The postmortem records the four timestamps, names the detection gap, has no person in the cause field, and ends in a list of changes.
