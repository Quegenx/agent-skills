# Agent skills

144 skills for coding agents, in thirteen sets:

| Folder | What it's for |
|---|---|
| [`skills/ai-agents/`](./skills/ai-agents) | Build AI products: agent runtime, tools, memory, evals, RAG, Jev, Langfuse, agent codebases and the production chat interface. 8 skills. |
| [`skills/agent-workflows/`](./skills/agent-workflows) | Use and customize existing agents such as Codex and Claude: skill authoring, developer-agent onboarding audits, guided learning and coding-host operations. 4 skills. |
| [`skills/anti-ai-slop/`](./skills/anti-ai-slop) | General quality guidance for prose, copy, interfaces and code. Select the branch relevant to the task. 5 skills. |
| [`skills/architecture/`](./skills/architecture) | Design system shape, components, dependency direction and domain boundaries across web, mobile and backend. 3 skills. |
| [`skills/engineering/`](./skills/engineering) | General development: debugging, refactoring, review, planning, source research, migrations, security, delivery, Dart and Effect. 15 skills. |
| [`skills/backend/`](./skills/backend) | APIs, databases, background work and connected services. Provider skills keep their shared contracts and web/mobile client SDKs together. 17 skills. |
| [`skills/frontend/`](./skills/frontend) | Web/client interfaces, CSS, SVG, accessibility, animation, drawing and browser performance. One global React skill includes Next.js and React Native/Expo. 17 skills. |
| [`skills/mobile/`](./skills/mobile) | Flutter implementation, mobile platform behavior, signing, store review and releases. Testing tools and cross-platform providers are listed below for discovery. 5 skills. |
| [`skills/testing/`](./skills/testing) | Software unit, integration, end-to-end and load testing, including named runners for web and mobile. Choose the project's existing framework. 7 skills. |
| [`skills/monitoring/`](./skills/monitoring) | General application signals and diagnosis across web, mobile and services: Sentry, PostHog, Grafana and OpenTelemetry. AI-specific Langfuse remains in ai-agents. 4 skills. |
| [`skills/marketing/`](./skills/marketing) | Marketing strategy, copy, SEO, advertising, ASO, app growth, campaign analytics, company/competitor research and commercial conversion workflows. 44 skills. |
| [`skills/videos/`](./skills/videos) | Make, edit, render and review videos. The code-built film studio and tool-based generation, avatars and editing keep their own workflows. 12 skills. |
| [`skills/web-automation/`](./skills/web-automation) | Drive browsers, extract permitted web data and expose user-visible browser capabilities through WebMCP. 3 skills. |
| Total | 144 skills in thirteen sets. |

Works in Claude Code, Codex and any agent that reads Agent Skills. Each skill is a plain folder with a `SKILL.md`.

**Contents:** [Install](#install) · [AI agents](#ai-agents) · [Agent workflows](#agent-workflows) · [Anti-AI-slop](#anti-ai-slop) · [Architecture](#architecture) · [Engineering](#engineering) · [Backend](#backend) · [Frontend](#frontend) · [Mobile](#mobile) · [Testing](#testing) · [Monitoring](#monitoring) · [Marketing](#marketing) · [Videos](#videos) · [Web automation](#web-automation) · [Reference code](#reference-code) · [Licences](#licences)

## Install

<details open>
<summary><strong>Any agent</strong> (skills.sh)</summary>

```bash
bunx skills@latest add Quegenx/agent-skills                          # choose skills and agents interactively
bunx skills@latest add Quegenx/agent-skills --skill sql-patterns     # one skill
```

</details>

<details>
<summary><strong>One project</strong> (Claude Code + Codex), by hand</summary>

```bash
git clone https://github.com/Quegenx/agent-skills /tmp/agent-skills
mkdir -p .claude/skills .agents/skills
cp -R /tmp/agent-skills/skills/*/* .claude/skills/            # or only one set: skills/videos/*
for s in .claude/skills/*/; do n=$(basename "$s"); ln -sfn "../../.claude/skills/$n" ".agents/skills/$n"; done
```

</details>

<details>
<summary><strong>Every project on this machine</strong></summary>

```bash
git clone https://github.com/Quegenx/agent-skills ~/agent-skills
mkdir -p ~/.claude/skills ~/.agents/skills
for s in ~/agent-skills/skills/*/*/; do ln -sfn "$s" ~/.claude/skills/; ln -sfn "$s" ~/.agents/skills/; done
```

</details>

Claude Code finds skills one level under `.claude/skills/`, so install the skill folders themselves there, not the category folders.

Choose only the skills for your task. Within a skill, relative links stay inside its folder. Cross-skill links name a public source: use the named installed skill/file when available, or read that URL. An unavailable required reference is reported explicitly. Tool-specific guides are separate choices, not prerequisites for one another.

| Testing task | Skill |
|---|---|
| Framework-neutral journey design | [e2e-testing](./skills/testing/e2e-testing/SKILL.md) |
| Flutter Dart tests and native automation | [patrol](./skills/testing/patrol/SKILL.md) |
| Maestro YAML flows | [maestro](./skills/testing/maestro/SKILL.md) |
| tester-army/e2e web/mobile runner | [tester-army-e2e](./skills/testing/tester-army-e2e/SKILL.md) |
| Browser UI, responsive, consent and component QA | [browser-ui-qa](./skills/testing/browser-ui-qa/SKILL.md) |
| Unit and integration tests | [testing](./skills/testing/testing/SKILL.md) |
| Load and performance tests | [k6](./skills/testing/k6/SKILL.md) |

A category helps discovery. Each skill has one primary home. Related skills are optional unless the selected workflow declares them required. Orchestrators such as make-video compose named skills and must be installed with the skills their selected workflow calls. SDK documentation and selected external tools remain explicit prerequisites; a folder move does not install them.

## AI agents

Detailed coverage and related task routes are in the [AI agents set README](./skills/ai-agents/README.md#skills).

| Skill | Covers |
|---|---|
| [agent-chat-ui](./skills/ai-agents/agent-chat-ui/SKILL.md) | An agent's chat interface: the live status line and folded work log, smooth streaming text, approval and question cards, results as the product's own components, follow-ups, the composer with files, voice and a queue, the conversation list, every timing and size. Ships the production source in `reference/` |
| [agent-codebase](./skills/ai-agents/agent-codebase/SKILL.md) | Agent folders, searchable concepts, module contracts, dependency direction and eval seams; SDK and verification rules follow the selected project. |
| [agent-evals](./skills/ai-agents/agent-evals/SKILL.md) | Real-agent suites, calibrated judges, fix loops, release gates, evidence coverage and resume integrity. |
| [agent-harness](./skills/ai-agents/agent-harness/SKILL.md) | Production-agent loops, prompts, gates, tools, history, runtime and refinement; coding-host operations have a separate skill. |
| [agent-memory](./skills/ai-agents/agent-memory/SKILL.md) | Durable memory, evidence-based extraction, minimal stores, consolidation, retrieval, expiry and user controls. |
| [ai-features](./skills/ai-agents/ai-features/SKILL.md) | Vector/hybrid retrieval, cited RAG, extraction and AI jobs; embedding, permissions and paid-call checks apply to their selected branches. |
| [jev-decisions](./skills/ai-agents/jev-decisions/SKILL.md) | Yes/no, choice and score questions, facts kept apart from evidence, thresholds and gates, agent tool gates and stop hooks, trace judges, calibration and evals, plus worked recipes (value and date extraction, search, re-ranking, taxonomies, record matching, guardrails, memory, tool suggestion). TypeScript with `@typesafe-ai/sdk`., the decide API names by AI SDK version |
| [langfuse](./skills/ai-agents/langfuse/SKILL.md) | Tracing, prompt management, evaluations and source-grounded migration between telemetry systems. |

## Agent workflows

Detailed coverage and related task routes are in the [Agent workflows set README](./skills/agent-workflows/README.md#skills).

| Skill | Covers |
|---|---|
| [agent-dx-audit](./skills/agent-workflows/agent-dx-audit/SKILL.md) | Docs/SDK/skill onboarding audits with agent tasks, traces, provenance and an HTML report. |
| [coding-agent-harness](./skills/agent-workflows/coding-agent-harness/SKILL.md) | Coding-agent session diagnosis, Claude host workflows, session scheduling and completion evidence; separate from a product agent runtime. |
| [guided-learning](./skills/agent-workflows/guided-learning/SKILL.md) | Learning missions, cited resources, observed evidence, interactive lessons and reusable reference material. |
| [skill-authoring](./skills/agent-workflows/skill-authoring/SKILL.md) | Skill structure, routing, descriptions, optional scripts, audit contracts, distribution and authorized measurement; portable named dependencies. |

## Anti-AI-slop

Detailed coverage and related task routes are in the [Anti-AI-slop set README](./skills/anti-ai-slop/README.md#skills).

| Skill | Covers |
|---|---|
| [anti-slop](./skills/anti-ai-slop/anti-slop/SKILL.md) | The shared rules (real over invented, specific over generic) for prose, copy, interfaces, code and the agent's own plans and replies. |
| [anti-slop-code](./skills/anti-ai-slop/anti-slop-code/SKILL.md) | Behavior-preserving cleanup, runtime contracts and optional FixMySlop triage; links canonical duplication tools. |
| [anti-slop-copy](./skills/anti-ai-slop/anti-slop-copy/SKILL.md) | Grounded product copy, shared context with mobile fields, point edits, source traceability and review; routes ad formulas and shipped announcements to their owners. |
| [anti-slop-ui](./skills/anti-ai-slop/anti-slop-ui/SKILL.md) | Purposeful interfaces, honest data, component states and measured improvement shortlists; routes responsive CSS, contrast and exact reconstruction to their owners. |
| [anti-slop-writing](./skills/anti-ai-slop/anti-slop-writing/SKILL.md) | Voice-preserving editing, drafting, evidence-based audits and Hebrew guidance; missing-draft and SEO-coaching conventions are scoped. |

## Architecture

Detailed coverage and related task routes are in the [Architecture set README](./skills/architecture/README.md#skills).

| Skill | Covers |
|---|---|
| [domain-modeling](./skills/architecture/domain-modeling/SKILL.md) | Contexts, aggregates, invariants, events, sagas, CQRS, domain glossaries and decision records. Shallow collection protection and projection watermark gaps. |
| [software-architecture](./skills/architecture/software-architecture/SKILL.md) | Application shape, layers, module ownership, scaling, service extraction and logic prototypes. |
| [system-design](./skills/architecture/system-design/SKILL.md) | Components, failure modes, feeds, sandboxes and worked designs, with links to recovery operations. |

## Engineering

Detailed coverage and related task routes are in the [Engineering set README](./skills/engineering/README.md#skills).

| Skill | Covers |
|---|---|
| [algorithm-patterns](./skills/engineering/algorithm-patterns/SKILL.md) | Algorithm cues, canonical duplicate-set detection, windows, graphs, dynamic programming and numeric/allocation budgets. |
| [code-research](./skills/engineering/code-research/SKILL.md) | Source investigation, exact anchors, version identity, claim ledgers and coverage limits. |
| [code-review](./skills/engineering/code-review/SKILL.md) | Evidence-based change reviews, P0 to P3 severity, security/scanner triage and repository audits; process-rollout checks stay separate. |
| [dart](./skills/engineering/dart/SKILL.md) | Dart language, Effective Dart, async/isolates, runtime libraries and paths, pub/workspaces, testing, CLI and FFI; shared MCP setup routes to Flutter tooling. |
| [debugging](./skills/engineering/debugging/SKILL.md) | Reproduction, falsifiable hypotheses, shared root causes and evidence-based verification. Discriminating controls, tested-artifact identity and state-effect evidence limits. |
| [deployment](./skills/engineering/deployment/SKILL.md) | Containers, host/DNS moves, backups, releases and npm publishing; verification follows the selected deployment operation. |
| [developer-docs](./skills/engineering/developer-docs/SKILL.md) | Source-verified developer docs, CI-backed snippets, navigation, redirects and generated output. |
| [effect](./skills/engineering/effect/SKILL.md) | One cross-runtime Effect skill: services, errors, Schema, concurrency, browser/React atoms, HTTP/SQL, AI, CLI and runtime layers. |
| [engineering-planning](./skills/engineering/engineering-planning/SKILL.md) | Interviews, specs, local breakdown, handoffs, RFCs, execution and scoped developer-tool product briefs. |
| [lint-rule-authoring](./skills/engineering/lint-rule-authoring/SKILL.md) | Detector contracts, implementation, corpus validation, fuzzing, FP/FN audits and base/head parity. |
| [refactoring](./skills/engineering/refactoring/SKILL.md) | Behavior-preserving transformations, typed errors, module boundaries and duplication tools; verify the actual code being refactored. |
| [reverse-engineering](./skills/engineering/reverse-engineering/SKILL.md) | JS/Electron, captured scripts, source maps, Node inspection, Flutter APK/AOT, offline WASM/SQLite and observed-traffic OpenAPI generation; routes exact UI reconstruction to pixel-reverse-engineer. |
| [secure-coding](./skills/engineering/secure-coding/SKILL.md) | Trust boundaries, authentication, tenant isolation, parsers and package controls; provider RLS mechanics route to their owners. |
| [system-migration](./skills/engineering/system-migration/SKILL.md) | Legacy replacement, synchronization, shadow comparisons, cutover and function maps, with tagged source alternatives. |
| [ultracite](./skills/engineering/ultracite/SKILL.md) | Selected Ultracite setup, backend detection, checks, fixes, diagnostics, initialization and upgrades; review-process work stays separate. |

## Backend

Detailed coverage and related task routes are in the [Backend set README](./skills/backend/README.md#skills).

| Skill | Covers |
|---|---|
| [api-design](./skills/backend/api-design/SKILL.md) | HTTP contracts, pagination, errors, idempotency, flags, streaming and limits; developer-tool briefs route to planning. |
| [background-jobs](./skills/backend/background-jobs/SKILL.md) | Generic workers, retries, workflows, leases and fencing; provider queues, schedulers and Postgres locks route to their owners. |
| [convex](./skills/backend/convex/SKILL.md) | Functions, auth, operations and native scheduling; kitcn cRPC, ORM, aggregates, React/RSC, HTTP and rate limits. |
| [email-practices](./skills/backend/email-practices/SKILL.md) | Email authentication, delivery, consent, suppression, reliability and accessibility; infrastructure and campaign checks are task-specific. |
| [firebase](./skills/backend/firebase/SKILL.md) | Web/Flutter setup, Auth, AI Logic, Firestore, SQL Connect, Hosting, Functions, Remote Config and Storage; Flutter FCM registration, handlers, token lifecycle and delivery routing. |
| [kapso](./skills/backend/kapso/SKILL.md) | WhatsApp messages/templates, webhooks, Flows, workflows, functions/events, calling and operational observation. |
| [messaging](./skills/backend/messaging/SKILL.md) | Transactional outbox/inbox, idempotent consumers, ordering and brokers. External-effect uncertainty, broker returns and aggregate ordering. |
| [onesignal](./skills/backend/onesignal/SKILL.md) | Messaging identity, setup, permissions, sends, Journeys and analytics; acceptance covers configured platforms and channels. |
| [performance-and-caching](./skills/backend/performance-and-caching/SKILL.md) | Server measurement, queries, cache policy and telemetry audits; browser loading and tracing route to web-performance. |
| [postgres](./skills/backend/postgres/SKILL.md) | Production schemas, pooling, transactions, WAL, recovery and PlanetScale operations; index exercises and restores are selected workflows. |
| [react-email](./skills/backend/react-email/SKILL.md) | React email components, styling, rendering, delivery and localization, with a separate visual-editor topic. Tagged email-design alternatives live in STYLING, with the existing default preserved. |
| [resend](./skills/backend/resend/SKILL.md) | Sending/receiving, domains, retries, webhook identity, contacts, automations and tooling; acceptance follows the selected feature. |
| [revenuecat](./skills/backend/revenuecat/SKILL.md) | Purchases, identity/restores, web billing, paywalls, Customer Center, experiments and webhooks; client and query checks stay separate. |
| [sql-patterns](./skills/backend/sql-patterns/SKILL.md) | SQL result correctness: joins, NULLs, windows, time zones, JSON and hierarchies; optimizer guidance routes to query performance. |
| [stripe](./skills/backend/stripe/SKILL.md) | Payments, Billing, Connect, Tax, webhooks, Apps and operations; payment, renewal, dispute and metric checks follow the selected task. |
| [supabase](./skills/backend/supabase/SKILL.md) | Data API/RLS, Auth, database services, Storage, Realtime and portable Fetch middleware; verify affected services and access boundaries. |
| [third-party-integrations](./skills/backend/third-party-integrations/SKILL.md) | Connected accounts, OAuth, provider APIs, sync, webhooks and Kapso; pool identity across credential refresh. |

## Frontend

Detailed coverage and related task routes are in the [Frontend set README](./skills/frontend/README.md#skills).

| Skill | Covers |
|---|---|
| [app-ui](./skills/frontend/app-ui/SKILL.md) | The production app design, components, tokens and behavior, with its reference source. |
| [color-system](./skills/frontend/color-system/SKILL.md) | OKLCH, ramps, tokens, contrast and audits; Tailwind aliases link to CSS custom properties. |
| [cookie-consent](./skills/frontend/cookie-consent/SKILL.md) | c15t categories and regional policies, script gating, consent withdrawal and verification. |
| [design-system-maintenance](./skills/frontend/design-system-maintenance/SKILL.md) | Extracting an existing system, mapping values, component docs, migration readiness and rendered evidence. |
| [gsap](./skills/frontend/gsap/SKILL.md) | Tweens, timelines, cleanup and plugins; corrected shuffle and MotionPathHelper APIs. |
| [isometric-figures](./skills/frontend/isometric-figures/SKILL.md) | Live explanatory SVG/WebGL mechanisms, source geometry, input and sampled audits; deterministic film adapters stay in videos. |
| [landing-page-ui](./skills/frontend/landing-page-ui/SKILL.md) | Production marketing-site design and source; browser encoding links to its current owner. |
| [modern-css](./skills/frontend/modern-css/SKILL.md) | CSS layout, forms and responsive policy; separate properties, functions and scroll-animation topics. |
| [pixel-reverse-engineer](./skills/frontend/pixel-reverse-engineer/SKILL.md) | Exact component and animation reconstruction, plus explanation-only page inspection, from live DOM, CSS, assets, JavaScript and observed behavior. |
| [react](./skills/frontend/react/SKILL.md) | One global React skill with Next.js, React Native/Expo and native motion routes; state, Effects, composition and platform-specific verification. |
| [sonner](./skills/frontend/sonner/SKILL.md) | Sonner setup, toast lifecycle, promises, styling, right-to-left and troubleshooting. |
| [svg](./skills/frontend/svg/SKILL.md) | SVG drawing, animation and icons; canonical namespaces, use primitives and transforms. |
| [technical-drawing](./skills/frontend/technical-drawing/SKILL.md) | Physical drawings, evidence and exports; standalone viewer and download acceptance applies only to requested deliverables. |
| [ui-animation](./skills/frontend/ui-animation/SKILL.md) | Web motion policy, timing, briefs, recipes and audits; native motion implementation routes to the global React skill. |
| [web-accessibility](./skills/frontend/web-accessibility/SKILL.md) | WCAG/APG interfaces, forms and phone numbers; complete hover/focus content criteria. |
| [web-performance](./skills/frontend/web-performance/SKILL.md) | Browser loading, media, layout shifts, main-thread work, runtime traces and Lighthouse gates. |
| [webgl](./skills/frontend/webgl/SKILL.md) | Live shader widgets, shared contexts/fallbacks, Three.js/R3F audits and launch pages; widget-specific requirements stay in that branch. |

## Mobile

Detailed coverage and related task routes are in the [Mobile set README](./skills/mobile/README.md#skills).

| Skill | Covers |
|---|---|
| [app-store-connect](./skills/mobile/app-store-connect/SKILL.md) | App Store auth, builds/signing, TestFlight, metadata, subscriptions and review; asc, greenlight and fastlane checks follow the chosen tool. |
| [flutter](./skills/mobile/flutter/SKILL.md) | Flutter architecture, layout, routing, networking, performance, accessibility and release artifacts; separate plugin authoring, canonical MCP/widget-preview tooling and source-qualified Riverpod recipes. |
| [flutter-render-objects](./skills/mobile/flutter-render-objects/SKILL.md) | Custom RenderObjects, child/parent data, layout, painting, compositing, input, semantics and worked examples; canonical shared definitions and corrected reuse/semantics guidance. |
| [flutter-ux](./skills/mobile/flutter-ux/SKILL.md) | Community forms, sheets, navigation, scrolling, media and device UX; focused polish and whole-app design reviews have separate acceptance. |
| [google-play](./skills/mobile/google-play/SKILL.md) | Play publishing, signing, tracks, policy, pricing, vitals and reviews; gplay build-release checks stay separate from listing-only work. |

## Testing

Detailed coverage and related task routes are in the [Testing set README](./skills/testing/README.md#skills).

| Skill | Covers |
|---|---|
| [browser-ui-qa](./skills/testing/browser-ui-qa/SKILL.md) | Browser UI evidence, adversarial checks, component stress fixtures, responsive/container coverage, consent and measured invariants. |
| [e2e-testing](./skills/testing/e2e-testing/SKILL.md) | Framework-neutral user journeys, separate actions and observable outcomes; implementation routes to the selected test tool. |
| [k6](./skills/testing/k6/SKILL.md) | Load/browser tests, scenarios and thresholds, Cloud runs, maintenance and a separate trend-analysis topic; qualified source assets and corrected metrics. |
| [maestro](./skills/testing/maestro/SKILL.md) | Maestro YAML flows for React Native, Expo and Flutter: setup, selectors, waits, auth, native dialogs and platform-specific verification. |
| [patrol](./skills/testing/patrol/SKILL.md) | Flutter E2E with Patrol: Dart tests, native automation, shared Keys, setup, module conventions and Patrol-only verification. |
| [tester-army-e2e](./skills/testing/tester-army-e2e/SKILL.md) | The tester-army/e2e web/mobile runner: exact steps, optional agent goals, replay, setup, traces, bug bashes and migration into this runner. |
| [testing](./skills/testing/testing/SKILL.md) | Behavior, integration and terminal tests, independent oracles, parser edge cases and canonical fixture references. |

## Monitoring

Detailed coverage and related task routes are in the [Monitoring set README](./skills/monitoring/README.md#skills).

| Skill | Covers |
|---|---|
| [grafana](./skills/monitoring/grafana/SKILL.md) | Dashboards, alerting, IRM, Prometheus/Mimir, Loki, Tempo, Alloy and Faro; verify only the selected product and changed surface. |
| [observability](./skills/monitoring/observability/SKILL.md) | OpenTelemetry, collectors, logs, health probes, graph diagnosis and incidents; tracing, metrics and export checks follow the task. |
| [posthog](./skills/monitoring/posthog/SKILL.md) | SDKs, analytics/identity, flags, experiments, replay, logs, HogQL and warehouse access; setup and query-only checks stay separate. |
| [sentry](./skills/monitoring/sentry/SKILL.md) | Platform SDKs, errors, tracing/Replay, symbols, sampling/privacy and issue diagnosis; setup and production delivery require that scope. |

## Marketing

Detailed coverage and related task routes are in the [Marketing set README](./skills/marketing/README.md#skills).

| Skill | Covers |
|---|---|
| [ab-testing](./skills/marketing/ab-testing/SKILL.md) | Tool-agnostic A/B testing: hypotheses, metrics and guardrails, sample sizes from the standard formula, duration with unequal splits, sequential testing, templates, an experimentation program |
| [ad-creative](./skills/marketing/ad-creative/SKILL.md) | Grounded concepts, hooks, formats, copy and creative roadmaps; canonical safe zones and corrected RSA acceptance. |
| [ai-search-visibility](./skills/marketing/ai-search-visibility/SKILL.md) | AI discovery, crawler controls, citation evidence and measurement; local versus remote aeo.js checks. |
| [app-growth](./skills/marketing/app-growth/SKILL.md) | Mobile acquisition, attribution, onboarding, paywalls and retention; Apple, Meta, Google and other platform checks follow the task. |
| [aso](./skills/marketing/aso/SKILL.md) | Store audits, keywords, metadata, screenshots/art directions and experiments; Apple indexed-field rules stay specific to the App Store. |
| [churn-prevention](./skills/marketing/churn-prevention/SKILL.md) | Cancellation, health scores and source-qualified dunning copy; provider retry settings and verified access recovery. |
| [cold-outreach](./skills/marketing/cold-outreach/SKILL.md) | Lawful outreach, sending, copy, cadences, LinkedIn and replies; permanent Gmail bulk status and human approval boundaries. |
| [community-marketing](./skills/marketing/community-marketing/SKILL.md) | Community identity, launch, onboarding, rituals, support, ambassadors, platform choice and health. |
| [comparison-pages](./skills/marketing/comparison-pages/SKILL.md) | Evidence-backed alternative/versus pages, data hubs and audience-aware P0 to P3 audits. |
| [content-strategy](./skills/marketing/content-strategy/SKILL.md) | Content research, pillars, formats, distribution and CMS drafts; shared ORB and linking definitions stay with their owners. |
| [creator-marketing](./skills/marketing/creator-marketing/SKILL.md) | Creators, UGC, ambassadors and paid placements: vetting, rights, briefs and qualified FTC/platform disclosure rules. |
| [cro](./skills/marketing/cro/SKILL.md) | Marketing-page conversion, forms, popups, signup and experiments; shared form metrics and browser-performance routes. |
| [customer-research](./skills/marketing/customer-research/SKILL.md) | Public evidence and Sales Safari, interviews, surveys and personas with minimum evidence and source qualifications. |
| [email-marketing](./skills/marketing/email-marketing/SKILL.md) | Campaign copy, sequences and lifecycle strategy; delivery and dunning link to their owners. |
| [event-marketing](./skills/marketing/event-marketing/SKILL.md) | Event portfolios, sponsorship, speaking and webinars; meeting, recording and follow-up checks follow the selected role and format. |
| [google-analytics](./skills/marketing/google-analytics/SKILL.md) | GA4, GTM, events, UTM, Consent Mode and reporting; event, pricing-variable and consent checks apply to their selected branches. |
| [growth-ideas](./skills/marketing/growth-ideas/SKILL.md) | 139 marketing ideas and buyer psychology; source-qualified applications, consolidated definitions and the corrected Fogg model. |
| [keyword-research](./skills/marketing/keyword-research/SKILL.md) | Search demand, intent clusters and competitor evidence; first-party Search Console metrics distinguished from SERP listings. |
| [lead-magnets](./skills/marketing/lead-magnets/SKILL.md) | Lead magnets and free tools: planning, gating and delivery under double opt-in and GDPR Art. 7(4), formats, promotion and measurement, free-tool types and cases |
| [marketing-attribution](./skills/marketing/marketing-attribution/SKILL.md) | Which marketing caused revenue: attribution models, MTA versus MMM versus incrementality, self-reported attribution, attribution by business type, stitching booking and checkout webhooks to analytics |
| [marketing-council](./skills/marketing/marketing-council/SKILL.md) | Twelve simulated advisors with sourced frameworks; one-advisor quick takes stay separate from multi-advisor dissent and disagreement maps. |
| [marketing-images](./skills/marketing/marketing-images/SKILL.md) | Image methods, prompts and platform sizes; actual-photo fidelity, reference decomposition and casual-phone options. Routes store screenshot production to ASO. |
| [marketing-loops](./skills/marketing/marketing-loops/SKILL.md) | Recurring marketing contracts, catalogues and operators; cadence, state, deduplication, approval and stop conditions. |
| [marketing-plan](./skills/marketing/marketing-plan/SKILL.md) | Resumable AARRR plans, budgets, market sizing, hiring and metrics; corrected idea counts and current channel-owner routes. |
| [offer-design](./skills/marketing/offer-design/SKILL.md) | Offer anatomy, guarantees, bonuses, scarcity, discounts and paid info-products; FTC claims and canonical Stripe Price rules. |
| [onboarding-and-upgrades](./skills/marketing/onboarding-and-upgrades/SKILL.md) | Activation, upgrade prompts, experiments and recovery cohorts; canonical psychology/store rules and cooldown constraints. |
| [paid-ads](./skills/marketing/paid-ads/SKILL.md) | Web ad operations, scoped audits and measurement; separate B2B acquisition and account-based marketing topics. |
| [partnerships](./skills/marketing/partnerships/SKILL.md) | Partner selection, co-marketing, integrations, resellers and marketplaces; agreements, lead sharing and lawful outreach. |
| [pricing-strategy](./skills/marketing/pricing-strategy/SKILL.md) | Pricing models, tiers, trials, research and rollout; page audits with consumer-specific markup and crawler policy. |
| [product-launch](./skills/marketing/product-launch/SKILL.md) | Launch planning, ORB channels, phases and shipped announcements; Product Hunt listing checks apply only to that launch channel. |
| [prospecting](./skills/marketing/prospecting/SKILL.md) | Lawful demand signals, account research, sourcing and enrichment; canonical contact-data policy and no evasion procedures. |
| [public-relations](./skills/marketing/public-relations/SKILL.md) | Pitching, requests, newsjacking, press assets and crisis communication; deliverables and evidence follow the selected PR mode. |
| [referral-programs](./skills/marketing/referral-programs/SKILL.md) | Product virality, customer referrals and affiliates; canonical two-source reward sizing, K-factor, disclosure, fraud, measurement and payouts, with mobile implementations linked. |
| [review-management](./skills/marketing/review-management/SKILL.md) | Neutral review invitations, public replies, moderation, reputation triage and permissioned testimonial reuse. |
| [revops](./skills/marketing/revops/SKILL.md) | Lead lifecycle, scoring, routing, enrichment, pipeline and CRM recipes; Salesforce scheduling and date-field limits. |
| [sales-enablement](./skills/marketing/sales-enablement/SKILL.md) | Decks, one-pagers, objections, battle cards, win-loss, demos and calls; verified price comparisons and print constraints. |
| [search-console](./skills/marketing/search-console/SKILL.md) | Reading a site's own Search Console data and saying only what it shows: click drops, quick wins, low CTR, decay, cannibalization, URL Inspection, the API's quotas and data loss, the iannuttall `seo` CLI and MCP |
| [seo](./skills/marketing/seo/SKILL.md) | Technical SEO, structured data, local visibility and scaled pages; shared project setup/reporting, link outreach and directory submissions. |
| [service-businesses](./skills/marketing/service-businesses/SKILL.md) | Complete client-service guides: offers, qualified demos, approvals, delivery, actual-outcome billing, recurring work and handoff. |
| [site-architecture](./skills/marketing/site-architecture/SKILL.md) | Information architecture: page hierarchy, URL patterns, breadcrumbs, header, footer and mobile navigation, internal links, platforms and migrations with Google's site-move rules, sitemap diagrams, site types |
| [site-audit](./skills/marketing/site-audit/SKILL.md) | Permission-scoped audits, scanner limits, scoring, feedback and fix evidence; self-contained plans link to engineering handoffs. |
| [sms-marketing](./skills/marketing/sms-marketing/SKILL.md) | Lawful SMS/MMS/WhatsApp, consent, encoding and sequences; sender-specific registration and provider opt-out boundaries. |
| [social-media](./skills/marketing/social-media/SKILL.md) | Organic strategy, posts, Reddit, short-form planning and listening; dated X ranking evidence and canonical writing rules. |
| [web-research](./skills/marketing/web-research/SKILL.md) | Parallel company, competitor and event research with evidence/budgets; matrix, battle-card and compiler checks follow selected outputs. |

## Videos

Detailed coverage and related task routes are in the [Videos set README](./skills/videos/README.md#skills).

| Skill | Covers |
|---|---|
| [asset-prep](./skills/videos/asset-prep/SKILL.md) | Screens, brand extraction, recording and prepared assets; renderer integration links to seek-engine. |
| [beat-grid](./skills/videos/beat-grid/SKILL.md) | Find, scan and measure music into `audio/beats.json`, the clock for picture and sound; per-frame band energy for audio-reactive visuals; word-by-word lyric timing. |
| [frame-review](./skills/videos/frame-review/SKILL.md) | Review and measured tells, separate decoded-file checks, full-text DOM read sampling and explicitly measured sync. |
| [make-video](./skills/videos/make-video/SKILL.md) | Gated film production with engine selection before setup; shared story/review gates and engine-specific runtime contracts. |
| [marketing-video](./skills/videos/marketing-video/SKILL.md) | Marketing video with tools: AI generation, avatars, repurposing and transcript-grounded cards over complete programs |
| [seek-engine](./skills/videos/seek-engine/SKILL.md) | Pure-time rendering, measured motion, drawing/hero templates, anatomy/cinematic film adapters and a sourced word-fold CoAnimator kit; live figures link to frontend. |
| [shotlist](./skills/videos/shotlist/SKILL.md) | Storyboards, measured composition/type/demo/transitions, separate beat-role and composition-diagram references, and sourced technique catalogues. |
| [sound-pass](./skills/videos/sound-pass/SKILL.md) | Picture-driven effects, transformed peak alignment, separate music and measured sound chapters, selected mastering profiles. |
| [video-brief](./skills/videos/video-brief/SKILL.md) | Briefs, source-qualified measured judgment, brand/world choices and narrated explainers. |
| [video-help](./skills/videos/video-help/SKILL.md) | Choosing a video skill and phase, with shared production gates and renderer-specific contracts. |
| [video-setup](./skills/videos/video-setup/SKILL.md) | Complete unflagged Node22+ toolchain and installed ffmpeg/browser capability checks. |
| [voiceover](./skills/videos/voiceover/SKILL.md) | Narration and cached takes, conditional caption mapping, bounded subtitle rows and source-qualified mouth timing. |

## Web automation

Detailed coverage and related task routes are in the [Web automation set README](./skills/web-automation/README.md#skills).

| Skill | Covers |
|---|---|
| [browser-automation](./skills/web-automation/browser-automation/SKILL.md) | Browser driving, sessions, scoped safe-browser harnesses, optional CDP tracing and deterministic scripts; checks follow the selected workflow. |
| [web-scraping](./skills/web-automation/web-scraping/SKILL.md) | Permitted fetch/crawl/parse workflows, qualified Scrapling contracts and canonical research fetch/search adapters; observed-traffic API generation routes to reverse-engineering. |
| [webmcp](./skills/web-automation/webmcp/SKILL.md) | Task tools, closed schemas, registration and safe invocation; source-app, injected-script and audit validation follow separate routes. |

## Reference code

`app-ui`, `landing-page-ui` and `agent-chat-ui` carry the production source they describe in `reference/`, with a `REFERENCE.md` index naming each file, the skill file that describes it, and the packages it needs. Copy from there to build it exactly.

## Licences

Code copied from other projects keeps its licence file beside the copy (`LICENSE-*.txt` in the folder that holds it, and `skills/frontend/isometric-figures/templates/isokit/LICENSE`).
