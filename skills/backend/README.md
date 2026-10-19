# Backend skills

Servers, data and integrations in TypeScript with Supabase/Postgres, Convex and Effect: APIs, jobs, messaging, SQL, third-party integrations, deployment, performance, security, running Postgres, building on Supabase, writing Effect v4, payments with Stripe and RevenueCat, email with Resend, React Email and the sending rules, and push and messaging with OneSignal. Browser performance, email campaigns and vendor-neutral observability are in frontend, marketing and monitoring. Details in the [main README](../../README.md#backend).

20 skills.

Entry points apply only the selected job's routes and checks. Cross-skill references use named public sources and the installed skill when available; framework-specific guides are independent choices.

## Skills

TypeScript, with Supabase/Postgres, Convex and Effect where the stack matters. Each skill routes to its reference files from `SKILL.md`.

| Skill | Covers |
|---|---|
| [api-design](api-design/SKILL.md) | Contracts, pagination, errors, idempotency, feature flags, streaming, timeouts and rate limits; a route to engineering-planning for the developer-tool product brief. Official HTTP deprecation, Problem Details, caching and SSE failure boundaries. The scoped product brief routes to engineering-planning; retry guidance distinguishes the defined processing-state 409 contract. |
| [background-jobs](background-jobs/SKILL.md) | Async APIs, workers and queues, retries, durable multi-step workflows with waits and flow control, concurrency across instances. Updated coverage: Workers, queues, retries, durable workflows, concurrency and the Convex workflow branch. Session-lock release, failure detection limits and paid/irreversible provider submission, uncertain outcomes and reconciliation. Provider queue/scheduler guarantees and Postgres lock mechanics route to their respective owners; leases and fencing stay here. |
| [messaging](messaging/SKILL.md) | Outbox and inbox in Postgres, idempotent consumers, ordering, choosing a broker. External-effect uncertainty, broker returns and aggregate ordering. |
| [sql-patterns](sql-patterns/SKILL.md) | SQL that returns the right answer: joins that multiply, NULLs, ties, window functions, time zones, streaks, ranges, hierarchies, JSON and JSONB operators. Partition lifecycle and optimizer/CTE materialization route to Postgres and query performance. |
| [postgres](postgres/SKILL.md) | Production schemas, pooling, transactions, WAL, recovery and PlanetScale operations; index exercises and restores are selected workflows. |
| [supabase](supabase/SKILL.md) | Data API/RLS, Auth, database services, Storage, Realtime and portable Fetch middleware; verify affected services and access boundaries. |
| [effect](effect/SKILL.md) | Effect v4 as its own guide prescribes, from the official repo and docs: setup, code style, errors and Cause, services and layers, resources and Config, concurrency, scheduling, state, caching, streams, Schema, HTTP, SQL, RPC, AI, CLI, the platform packages, testing and observability. Separate RPC, AI/MCP and CLI topics; Atom/reactivity joins state/coordination, with runtime, layers, errors and subsystem definitions consolidated. |
| [third-party-integrations](third-party-integrations/SKILL.md) | Integrations with the apps users connect: connection ownership, OAuth apps and scopes, refresh and reconnect, calling and syncing their APIs, provider webhooks, agents acting through those accounts. Updated coverage: Connected accounts, OAuth, provider APIs, sync and webhooks, with the Kapso integration branch; stable pool and concurrency identity across credential refresh. |
| [deployment](deployment/SKILL.md) | Containers, host/DNS moves, backups, releases and npm publishing; verification follows the selected deployment operation. |
| [performance-and-caching](performance-and-caching/SKILL.md) | Server measurement, query/index tuning, deterministic benchmarks, caching/invalidation, successful-result versus negative-cache policy, Vercel metrics and telemetry-led audits. Browser loading, media, main-thread work, runtime traces and Lighthouse gates route to web-performance. |
| [secure-coding](secure-coding/SKILL.md) | Untrusted input, auth and 2FA, tenant isolation with RLS, secrets at rest, parser disagreements; security headers checked by value, JSON inside a script element. Updated coverage: Trust boundaries, authentication, tenant isolation, parsers, browser boundaries and package installation controls. Atomic one-time-code redemption and encrypted relay fallback. Provider RLS mechanics route to Supabase rather than duplicating its policy. |
| [stripe](stripe/SKILL.md) | Payments, Billing, Connect, Tax, webhooks, Apps and operations; payment, renewal, dispute and metric checks follow the selected task. |
| [revenuecat](revenuecat/SKILL.md) | Purchases, identity/restores, web billing, paywalls, Customer Center, experiments and webhooks; client and query checks stay separate. |
| [resend](resend/SKILL.md) | Sending/receiving, domains, retries, webhook identity, contacts, automations and tooling; acceptance follows the selected feature. |
| [react-email](react-email/SKILL.md) | Email templates in React: setup and the preview server, every component, Tailwind and dark mode with client caveats, rendering and plain text, sending, patterns, i18n, the editor, ready-made templates. The visual editor has its own EDITOR topic; generic accessibility policy routes to email-practices. Tagged email-design alternatives live in STYLING, with the existing default preserved. |
| [email-practices](email-practices/SKILL.md) | Email authentication, delivery, consent, suppression, reliability and accessibility; infrastructure and campaign checks are task-specific. |
| [onesignal](onesignal/SKILL.md) | Messaging identity, setup, permissions, sends, Journeys and analytics; acceptance covers configured platforms and channels. |
| [convex](convex/SKILL.md) | Functions/data, authorization, components, agents/billing, operations, migrations and testing. Optional kitcn setup/codegen, cRPC call boundaries, ORM/RLS/migrations, aggregates/rank, Better Auth/admin/orgs, qualified Polar pointers, React/RSC/Next/Start/Expo, HTTP/webhooks/streaming, scheduling and rate-limit accounting. Native scheduling guarantees are canonical here rather than repeated in generic jobs and kitcn. |
| [firebase](firebase/SKILL.md) | Web/Flutter setup, Auth, AI Logic, Firestore, SQL Connect, Hosting, Functions, Remote Config and Storage; Flutter FCM registration, handlers, token lifecycle and delivery routing. |
| [kapso](kapso/SKILL.md) | WhatsApp messages/templates, webhooks, Flows, workflows, functions/events, calling and operational observation. |
