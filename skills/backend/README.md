# Backend skills

APIs, databases, background work and connected services. Provider skills keep their shared contracts and web/mobile client SDKs together. Details in the [main README](../../README.md#backend).

17 skills.

Category membership is the primary home, not an instruction to install every skill here. Apply the selected job's routes and checks. Required selected-branch dependencies and optional related skills remain distinct.

## Skills

| Skill | Covers |
|---|---|
| [api-design](api-design/SKILL.md) | Contracts, pagination, errors, idempotency, feature flags, streaming, timeouts and rate limits; a route to engineering-planning for the developer-tool product brief. Official HTTP deprecation, Problem Details, caching and SSE failure boundaries. The scoped product brief routes to engineering-planning; retry guidance distinguishes the defined processing-state 409 contract. |
| [background-jobs](background-jobs/SKILL.md) | Async APIs, workers and queues, retries, durable multi-step workflows with waits and flow control, concurrency across instances. Updated coverage: Workers, queues, retries, durable workflows, concurrency and the Convex workflow branch. Session-lock release, failure detection limits and paid/irreversible provider submission, uncertain outcomes and reconciliation. Provider queue/scheduler guarantees and Postgres lock mechanics route to their respective owners; leases and fencing stay here. |
| [convex](convex/SKILL.md) | Functions/data, authorization, components, agents/billing, operations, migrations and testing. Optional kitcn setup/codegen, cRPC call boundaries, ORM/RLS/migrations, aggregates/rank, Better Auth/admin/orgs, qualified Polar pointers, React/RSC/Next/Start/Expo, HTTP/webhooks/streaming, scheduling and rate-limit accounting. Native scheduling guarantees are canonical here rather than repeated in generic jobs and kitcn. |
| [email-practices](email-practices/SKILL.md) | Email authentication, delivery, consent, suppression, reliability and accessibility; infrastructure and campaign checks are task-specific. |
| [firebase](firebase/SKILL.md) | Web/Flutter setup, Auth, AI Logic, Firestore, SQL Connect, Hosting, Functions, Remote Config and Storage; Flutter FCM registration, handlers, token lifecycle and delivery routing. |
| [kapso](kapso/SKILL.md) | WhatsApp messages/templates, webhooks, Flows, workflows, functions/events, calling and operational observation. |
| [messaging](messaging/SKILL.md) | Outbox and inbox in Postgres, idempotent consumers, ordering, choosing a broker. External-effect uncertainty, broker returns and aggregate ordering. |
| [onesignal](onesignal/SKILL.md) | Messaging identity, setup, permissions, sends, Journeys and analytics; acceptance covers configured platforms and channels. |
| [performance-and-caching](performance-and-caching/SKILL.md) | Server measurement, query/index tuning, deterministic benchmarks, caching/invalidation, successful-result versus negative-cache policy, Vercel metrics and telemetry-led audits. Browser loading, media, main-thread work, runtime traces and Lighthouse gates route to web-performance. |
| [postgres](postgres/SKILL.md) | Production schemas, pooling, transactions, WAL, recovery and PlanetScale operations; index exercises and restores are selected workflows. |
| [react-email](react-email/SKILL.md) | Email templates in React: setup and the preview server, every component, Tailwind and dark mode with client caveats, rendering and plain text, sending, patterns, i18n, the editor, ready-made templates. The visual editor has its own EDITOR topic; generic accessibility policy routes to email-practices. Tagged email-design alternatives live in STYLING, with the existing default preserved. |
| [resend](resend/SKILL.md) | Sending/receiving, domains, retries, webhook identity, contacts, automations and tooling; acceptance follows the selected feature. |
| [revenuecat](revenuecat/SKILL.md) | Purchases, identity/restores, web billing, paywalls, Customer Center, experiments and webhooks; client and query checks stay separate. |
| [sql-patterns](sql-patterns/SKILL.md) | SQL that returns the right answer: joins that multiply, NULLs, ties, window functions, time zones, streaks, ranges, hierarchies, JSON and JSONB operators. Partition lifecycle and optimizer/CTE materialization route to Postgres and query performance. |
| [stripe](stripe/SKILL.md) | Payments, Billing, Connect, Tax, webhooks, Apps and operations; payment, renewal, dispute and metric checks follow the selected task. |
| [supabase](supabase/SKILL.md) | Data API/RLS, Auth, database services, Storage, Realtime and portable Fetch middleware; verify affected services and access boundaries. |
| [third-party-integrations](third-party-integrations/SKILL.md) | Integrations with the apps users connect: connection ownership, OAuth apps and scopes, refresh and reconnect, calling and syncing their APIs, provider webhooks, agents acting through those accounts. Updated coverage: Connected accounts, OAuth, provider APIs, sync and webhooks, with the Kapso integration branch; stable pool and concurrency identity across credential refresh. |

## Related task routes

These are discovery links; follow only the selected task's requirements.

- [effect](../engineering/effect/SKILL.md)
- [secure-coding](../engineering/secure-coding/SKILL.md)
- [deployment](../engineering/deployment/SKILL.md)
- [observability](../monitoring/observability/SKILL.md)
