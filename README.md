# Agent skills

138 skills for coding agents, in ten sets:

| Folder | What it's for |
|---|---|
| [`skills/ai-agents/`](./skills/ai-agents) | Build AI agents and AI features: the loop, prompt, tools and checks, evals, memory, the chat interface, the agent's codebase, writing skills, guided learning, Jev classifiers, search, RAG and extraction, Langfuse telemetry and agent-facing docs/SDK audits. 11 skills. |
| [`skills/videos/`](./skills/videos) | Make videos with a coding agent, where every frame is code: brief, assets, music clock, shot list, render, review, sound. 11 skills. |
| [`skills/anti-ai-slop/`](./skills/anti-ai-slop) | Keep what the agent writes, designs and codes from reading as generic AI output. 5 skills. |
| [`skills/backend/`](./skills/backend) | Servers, APIs, jobs, SQL, integrations, security, deployment and caching; Postgres, Supabase, Effect, Convex, Firebase, Stripe, RevenueCat, Resend, React Email, OneSignal and Kapso. 20 skills. |
| [`skills/architecture/`](./skills/architecture) | Design and structure of any codebase: architecture, system design, domain modeling, migrations, refactoring, algorithms, testing, lint-rule authoring, code review, debugging, engineering planning and execution, source research, developer docs, artifact investigation and exact component/animation reconstruction. 15 skills. |
| [`skills/web-automation/`](./skills/web-automation) | Agents and tests in a real browser or device: end-to-end tests for web and mobile (Flutter, React Native), browser automation, scraping, WebMCP tools, research reports. 5 skills. |
| [`skills/frontend/`](./skills/frontend) | App and marketing UI, design-system maintenance, motion, SVG, CSS, GSAP, accessibility, colors, Sonner, technical drawings, React with Next.js and React Native, WebGL, consent, browser performance and interactive isometric figures. 16 skills. |
| [`skills/monitoring/`](./skills/monitoring) | Production errors, analytics and telemetry: Sentry, PostHog, Grafana, k6, OpenTelemetry and Google Analytics 4. 6 skills. |
| [`skills/mobile/`](./skills/mobile) | Mobile apps from code to store: Flutter, Dart, shipping to the App Store and Google Play, app store optimization, and growth (ads, attribution, retention), plus community Flutter UX tips with a design review and custom RenderObjects. 8 skills. |
| [`skills/marketing/`](./skills/marketing) | Marketing, SEO and GEO for web and SaaS products: technical SEO, structured data, AI search visibility, site audits and architecture, content, CRO and A/B tests, attribution, paid ads and ad creative, creators and social, lawful outreach, prospecting and sales, launches and PR, pricing, offers and churn, email, SMS and WhatsApp, plans, loops, an advisor council and client-service playbooks. 41 skills. |
| Total | 138 skills in ten sets. |

Works in Claude Code, Codex and any agent that reads Agent Skills. Each skill is a plain folder with a `SKILL.md`.

**Contents:** [Install](#install) · [Videos](#videos) · [Anti-AI-slop](#anti-ai-slop) · [AI agents](#ai-agents) · [Backend](#backend) · [Architecture](#architecture) · [Frontend](#frontend) · [Web automation](#web-automation) · [Monitoring](#monitoring) · [Mobile](#mobile) · [Marketing](#marketing) · [Reference code](#reference-code) · [Licences](#licences)

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

## Videos

Every frame is code. No After Effects, no video editor: the agent writes a program, the program draws frames, a renderer turns them into an MP4, and a review loop decides whether anyone should see it.

Everyone shares the same "one prompt" video, and most first tries look the same: a centred title on a gradient, everything fading in, a logo at the end. The prompt is about 10% of a good film. The other 90% is the harness around the model:

- **No brief:** the model fills every missing decision with its safest default. → `video-brief` separates facts from choices.
- **No reference:** it falls back on its own look. → `video-brief` turns a reference into a style guide: the grammar, never the content.
- **No real assets:** it draws your product from imagination, and it looks fake. → `asset-prep` captures the real screens, colours, fonts and logo.
- **No clock:** sound and picture drift; cuts miss the beat. → `beat-grid` (or `voiceover`) makes one clock that drives both.
- **No plan:** events pile up and nothing reads. → `shotlist` puts states and the viewer's reads on the grid.
- **No determinism:** renders flicker and fixes mean starting over. → `seek-engine`: every frame is a pure function of time.
- **No eyes:** it never looks at what it made. → `frame-review`: counters that must read zero, contact sheets, scores, three fixes per round.
- **Silence, or sound that isn't connected:** → `sound-pass` places every sound on the frame that causes it.

Run `/video-setup` once per machine; not sure where to start, `/video-help`. Then start with `make-video` ("make a 20-second launch video for https://…"). It runs the studio as gates and calls the rest:

```
video-brief (+ asset-prep)  →  beat-grid / voiceover  →  shotlist  →  seek-engine: stills  →  build
      →  frame-review (loop until it passes)  →  sound-pass  →  render every format  →  frame-review final checks
```

Each gate writes a file in `films/<slug>/` (`brief.md`, `style-guide.md`, `audio/beats.json`, `shotlist.md`, `index.html`, `review-log.md`), so a later session, a subagent or a colleague can pick the film up where it stopped.

**User-invoked**

- **[video-help](./skills/videos/video-help/SKILL.md)**: Ask which video skill or flow fits your situation. A router over the set.
- **[video-setup](./skills/videos/video-setup/SKILL.md)**: Complete unflagged Node22+ toolchain and installed ffmpeg/browser capability checks.

**Model-invoked**

- **[make-video](./skills/videos/make-video/SKILL.md)**: Gated production with separate engine selection and delivery contracts, preserving source-specific review profiles.
- **[video-brief](./skills/videos/video-brief/SKILL.md)**: Briefs, source-qualified measured judgment, brand/world choices and narrated explainers.
- **[asset-prep](./skills/videos/asset-prep/SKILL.md)**: Screens, brand extraction, recording and prepared assets; renderer integration links to seek-engine.
- **[beat-grid](./skills/videos/beat-grid/SKILL.md)**: Find, scan and measure music into `audio/beats.json`, the clock for picture and sound; per-frame band energy for audio-reactive visuals; word-by-word lyric timing.
- **[voiceover](./skills/videos/voiceover/SKILL.md)**: Narration and cached takes, conditional caption mapping, bounded subtitle rows and source-qualified mouth timing.
- **[shotlist](./skills/videos/shotlist/SKILL.md)**: Storyboards, measured composition/type/demo/transitions and ordered technique/precedent catalogues with evidence limits.
- **[seek-engine](./skills/videos/seek-engine/SKILL.md)**: Pure-time rendering, measured motion, drawing/hero templates and anatomy/cinematic film adapters; live figures link to frontend.
- **[frame-review](./skills/videos/frame-review/SKILL.md)**: Review and measured tells, separate decoded-file checks, full-text DOM read sampling and explicitly measured sync.
- **[sound-pass](./skills/videos/sound-pass/SKILL.md)**: Picture-driven effects, transformed peak alignment, separate music and measured sound chapters, selected mastering profiles.

**Requirements:** Node 22+ for the complete unflagged CDP toolchain, ffmpeg with libx264, uv (or Python 3 with numpy), and Playwright's Chromium. Optional: `ELEVENLABS_API_KEY` for narration, `FAL_KEY` for generated imagery, both in the project's `.env`.

## Anti-AI-slop

Start with `anti-slop`; it holds the shared rules and routes to the others.

- **[anti-slop](./skills/anti-ai-slop/anti-slop/SKILL.md)**: The shared rules (real over invented, specific over generic) for prose, copy, interfaces, code and the agent's own plans and replies.
- **[anti-slop-writing](./skills/anti-ai-slop/anti-slop-writing/SKILL.md)**: Voice-preserving prose, evidence-based audits and Hebrew guidance; routes developer documentation to developer-docs.
- **[anti-slop-copy](./skills/anti-ai-slop/anti-slop-copy/SKILL.md)**: Grounded product copy, shared context with mobile fields, point edits, source traceability and review; routes ad formulas and shipped announcements to their owners.
- **[anti-slop-ui](./skills/anti-ai-slop/anti-slop-ui/SKILL.md)**: Purposeful interfaces, honest data, component states and measured improvement shortlists; routes responsive CSS, contrast and exact reconstruction to their owners.
- **[anti-slop-code](./skills/anti-ai-slop/anti-slop-code/SKILL.md)**: Behavior-preserving cleanup, runtime contracts and optional FixMySlop triage; links canonical duplication tools.

## AI agents

Building agents that stay reliable, and the AI features around them. Start with `agent-harness`; it routes to the rest.

| Skill | Covers |
|---|---|
| [agent-harness](./skills/ai-agents/agent-harness/SKILL.md) | Agent loops, tool contracts, conversation context, refinement, runtime, cost and session diagnosis. |
| [agent-evals](./skills/ai-agents/agent-evals/SKILL.md) | Real-agent suites, calibrated judges, fix loops, release gates, evidence coverage and resume integrity. |
| [skill-authoring](./skills/ai-agents/skill-authoring/SKILL.md) | Skill structure, routing, descriptions, scripts, audit-skill contracts and measured improvements. |
| [agent-dx-audit](./skills/ai-agents/agent-dx-audit/SKILL.md) | Docs/SDK/skill onboarding audits with agent tasks, traces, provenance and an HTML report. |
| [agent-memory](./skills/ai-agents/agent-memory/SKILL.md) | Durable memory, evidence-based extraction, minimal stores, consolidation, retrieval, expiry and user controls. |
| [agent-chat-ui](./skills/ai-agents/agent-chat-ui/SKILL.md) | An agent's chat interface: the live status line and folded work log, smooth streaming text, approval and question cards, results as the product's own components, follow-ups, the composer with files, voice and a queue, the conversation list, every timing and size. Ships the production source in `reference/` |
| [agent-codebase](./skills/ai-agents/agent-codebase/SKILL.md) | Agent folders, searchable concepts, module contracts, dependency direction and eval seams. |
| [jev-decisions](./skills/ai-agents/jev-decisions/SKILL.md) | Yes/no, choice and score questions, facts kept apart from evidence, thresholds and gates, agent tool gates and stop hooks, trace judges, calibration and evals, plus worked recipes (value and date extraction, search, re-ranking, taxonomies, record matching, guardrails, memory, tool suggestion). TypeScript with `@typesafe-ai/sdk`., the decide API names by AI SDK version |
| [ai-features](./skills/ai-agents/ai-features/SKILL.md) | Generic vector/hybrid retrieval, cited RAG, extraction and AI jobs; Supabase implementation routes to its provider owner. |
| [guided-learning](./skills/ai-agents/guided-learning/SKILL.md) | Learning missions, cited resources, observed evidence, interactive lessons and reusable reference material. |
| [langfuse](./skills/ai-agents/langfuse/SKILL.md) | Tracing, prompt management, evaluations and source-grounded migration between telemetry systems. |

## Backend

Detailed coverage is in the [Backend set README](./skills/backend/README.md#skills).

| Skill | Covers |
|---|---|
| [api-design](./skills/backend/api-design/SKILL.md) | HTTP contracts, pagination, errors, idempotency, flags, streaming and limits; developer-tool briefs route to planning. |
| [background-jobs](./skills/backend/background-jobs/SKILL.md) | Generic workers, retries, workflows, leases and fencing; provider queues, schedulers and Postgres locks route to their owners. |
| [messaging](./skills/backend/messaging/SKILL.md) | Transactional outbox/inbox, idempotent consumers, ordering and brokers. External-effect uncertainty, broker returns and aggregate ordering. |
| [sql-patterns](./skills/backend/sql-patterns/SKILL.md) | SQL result correctness: joins, NULLs, windows, time zones, JSON and hierarchies; optimizer guidance routes to query performance. |
| [postgres](./skills/backend/postgres/SKILL.md) | Production schemas, pooling, transaction/lock mechanics, WAL, backup, recovery and PlanetScale operations. |
| [supabase](./skills/backend/supabase/SKILL.md) | Data API, RLS, version-scoped Auth, database, queues, vectors and storage; portable Fetch server/middleware APIs and bridge limits. |
| [effect](./skills/backend/effect/SKILL.md) | Effect v4 with canonical runtime, error, layer and Schema owners; separate RPC, AI/MCP and CLI topics, plus Atom/reactivity. |
| [third-party-integrations](./skills/backend/third-party-integrations/SKILL.md) | Connected accounts, OAuth, provider APIs, sync, webhooks and Kapso; pool identity across credential refresh. |
| [deployment](./skills/backend/deployment/SKILL.md) | Containers, host moves, restore/replay/reconciliation, releases and npm publishing; cached baselines link to parity guidance. |
| [performance-and-caching](./skills/backend/performance-and-caching/SKILL.md) | Server measurement, queries, cache policy and telemetry audits; browser loading and tracing route to web-performance. |
| [secure-coding](./skills/backend/secure-coding/SKILL.md) | Trust boundaries, authentication, tenant isolation, parsers and package controls; provider RLS mechanics route to their owners. |
| [stripe](./skills/backend/stripe/SKILL.md) | Payments, Billing, Connect, Tax, agent tools and operations; canonical fulfillment, Price maintenance, retry corrections, reversals and health metrics. |
| [revenuecat](./skills/backend/revenuecat/SKILL.md) | Purchases, identity/restore policy, web billing, paywalls, Customer Center, store testing, experiments and webhooks. |
| [resend](./skills/backend/resend/SKILL.md) | Provider sending/receiving, domains, retries, webhook identity, contacts, automations and tooling. |
| [react-email](./skills/backend/react-email/SKILL.md) | React email components, styling, rendering, delivery and localization, with a separate visual-editor topic. Tagged email-design alternatives live in STYLING, with the existing default preserved. |
| [email-practices](./skills/backend/email-practices/SKILL.md) | Email authentication, delivery, consent, capture, suppression, reliability and accessibility; campaigns route to email-marketing. |
| [onesignal](./skills/backend/onesignal/SKILL.md) | Messaging setup, identity, permissions, channel-scoped API limits, Journeys and analytics; generic law links to channel owners. |
| [convex](./skills/backend/convex/SKILL.md) | Functions, auth, operations and native scheduling; kitcn cRPC, ORM, aggregates, React/RSC, HTTP and rate limits. |
| [firebase](./skills/backend/firebase/SKILL.md) | Web/Flutter setup, Auth, AI Logic, Firestore, SQL Connect, Hosting, Functions, Remote Config and Storage; Flutter FCM registration, handlers, token lifecycle and delivery routing. |
| [kapso](./skills/backend/kapso/SKILL.md) | WhatsApp messages/templates, webhooks, Flows, workflows, functions/events, calling and operational observation. |

## Architecture

| Skill | Covers |
|---|---|
| [software-architecture](./skills/architecture/software-architecture/SKILL.md) | Application shape, layers, module ownership, scaling, service extraction and logic prototypes. |
| [system-design](./skills/architecture/system-design/SKILL.md) | Components, failure modes, feeds, sandboxes and worked designs, with links to recovery operations. |
| [domain-modeling](./skills/architecture/domain-modeling/SKILL.md) | Contexts, aggregates, invariants, events, sagas, CQRS, domain glossaries and decision records. Shallow collection protection and projection watermark gaps. |
| [system-migration](./skills/architecture/system-migration/SKILL.md) | Legacy replacement, synchronization, shadow comparisons, cutover and function maps, with tagged source alternatives. |
| [refactoring](./skills/architecture/refactoring/SKILL.md) | Behavior-preserving transformations, typed errors, module boundaries, dependency audits and canonical technique references. |
| [algorithm-patterns](./skills/architecture/algorithm-patterns/SKILL.md) | Algorithm cues, canonical duplicate-set detection, windows, graphs, dynamic programming and numeric/allocation budgets. |
| [testing](./skills/architecture/testing/SKILL.md) | Behavior, integration and terminal tests, independent oracles, parser edge cases and canonical fixture references. |
| [lint-rule-authoring](./skills/architecture/lint-rule-authoring/SKILL.md) | Detector contracts, implementation, corpus validation, fuzzing, FP/FN audits and base/head parity. |
| [code-review](./skills/architecture/code-review/SKILL.md) | Evidence-based reviews, P0 to P3 severity, scanner/security triage, repository audits and reviewer tuning. |
| [code-research](./skills/architecture/code-research/SKILL.md) | Source investigation, exact anchors, version identity, claim ledgers and coverage limits. |
| [developer-docs](./skills/architecture/developer-docs/SKILL.md) | Source-verified developer docs, CI-backed snippets, navigation, redirects and generated output. |
| [debugging](./skills/architecture/debugging/SKILL.md) | Reproduction, falsifiable hypotheses, shared root causes and evidence-based verification. Discriminating controls, tested-artifact identity and state-effect evidence limits. |
| [engineering-planning](./skills/architecture/engineering-planning/SKILL.md) | Interviews, specs, local breakdown, handoffs, RFCs, execution and scoped developer-tool product briefs. |
| [reverse-engineering](./skills/architecture/reverse-engineering/SKILL.md) | JS/Electron, captured scripts, source maps, Node inspection, Flutter APK/AOT, offline WASM/SQLite and observed-traffic OpenAPI generation; routes exact UI reconstruction to pixel-reverse-engineer. |
| [pixel-reverse-engineer](./skills/architecture/pixel-reverse-engineer/SKILL.md) | Exact component and animation reconstruction, plus explanation-only page inspection, from live DOM, CSS, assets, JavaScript and observed behavior. |

## Frontend

Detailed coverage is in the [Frontend set README](./skills/frontend/README.md#skills).

| Skill | Covers |
|---|---|
| [ui-animation](./skills/frontend/ui-animation/SKILL.md) | Motion policy, source-grounded motion briefs and audits; native, live-chart and collection topics. |
| [svg](./skills/frontend/svg/SKILL.md) | SVG drawing, animation and icons; canonical namespaces, use primitives and transforms. |
| [modern-css](./skills/frontend/modern-css/SKILL.md) | CSS layout, forms and responsive policy; separate properties, functions and scroll-animation topics. |
| [gsap](./skills/frontend/gsap/SKILL.md) | Tweens, timelines, cleanup and plugins; corrected shuffle and MotionPathHelper APIs. |
| [web-accessibility](./skills/frontend/web-accessibility/SKILL.md) | WCAG/APG interfaces, forms and phone numbers; complete hover/focus content criteria. |
| [color-system](./skills/frontend/color-system/SKILL.md) | OKLCH, ramps, tokens, contrast and audits; Tailwind aliases link to CSS custom properties. |
| [sonner](./skills/frontend/sonner/SKILL.md) | Sonner setup, toast lifecycle, promises, styling, right-to-left and troubleshooting. |
| [technical-drawing](./skills/frontend/technical-drawing/SKILL.md) | Physical drawings and exports; declared geometry checks distinguished from passing results. |
| [isometric-figures](./skills/frontend/isometric-figures/SKILL.md) | Live explanatory SVG/WebGL mechanisms, source geometry, input and sampled audits; deterministic film adapters stay in videos. |
| [react](./skills/frontend/react/SKILL.md) | Global React, Next.js, audits and Remotion Player; native navigation APIs, sheet limits and previews. |
| [webgl](./skills/frontend/webgl/SKILL.md) | Live-page widgets, shared contexts, fallbacks, three.js/R3F audits and 3D launch pages; canonical canvas-pixel and unavailable-WebGL checks. |
| [cookie-consent](./skills/frontend/cookie-consent/SKILL.md) | c15t categories and regional policies, script gating, consent withdrawal and verification. |
| [design-system-maintenance](./skills/frontend/design-system-maintenance/SKILL.md) | Extracting an existing system, mapping values, component docs, migration readiness and rendered evidence. |
| [app-ui](./skills/frontend/app-ui/SKILL.md) | The production app design, components, tokens and behavior, with its reference source. |
| [landing-page-ui](./skills/frontend/landing-page-ui/SKILL.md) | Production marketing-site design and source; browser encoding links to its current owner. |
| [web-performance](./skills/frontend/web-performance/SKILL.md) | Browser loading, media, layout shifts, main-thread work, runtime traces and Lighthouse gates. |

## Web automation

| Skill | Covers |
|---|---|
| [e2e-testing](./skills/web-automation/e2e-testing/SKILL.md) | Web/mobile journeys, decision-model execution, failure triage, canonical Maestro/mobile setup, adversarial UI evidence and responsive checks; canvas proof routes to WebGL. |
| [browser-automation](./skills/web-automation/browser-automation/SKILL.md) | Browser ownership, scoped interception, versioned local/cloud sessions, paired-clock tracing and evidence-based task loops. Page inspection routes to pixel-reverse-engineer. |
| [web-scraping](./skills/web-automation/web-scraping/SKILL.md) | Permitted fetch/crawl/parse workflows, qualified Scrapling contracts and canonical research fetch/search adapters; observed-traffic API generation routes to reverse-engineering. |
| [webmcp](./skills/web-automation/webmcp/SKILL.md) | Task tools, closed schemas, versioned registration/invocation, rejection versus returned failures and shared consequence gates for source-app and injected routes. |
| [web-research](./skills/web-automation/web-research/SKILL.md) | Parallel research with tagged profiles/lane budgets, scoped cleanup and paid gates, evidence fields and source-workspace prerequisites for reports. |

## Monitoring

Detailed coverage is in the [Monitoring set README](./skills/monitoring/README.md#skills).

| Skill | Covers |
|---|---|
| [sentry](./skills/monitoring/sentry/SKILL.md) | Shared JavaScript and platform SDKs, browser tracing/Replay, Flutter symbols, signals, sampling/privacy and versioned SDK upgrades. |
| [posthog](./skills/monitoring/posthog/SKILL.md) | SDK setup, analytics/identity, flags, experiments, replay, logs/tracing, source maps, HogQL, governed metrics, warehouse/custom sources and access. |
| [grafana](./skills/monitoring/grafana/SKILL.md) | Dashboards/alerting, IRM, provisioning, Prometheus/Mimir, Loki, Tempo, Alloy/OTLP/Beyla, application/database monitoring and Faro sessions. |
| [k6](./skills/monitoring/k6/SKILL.md) | Load/browser tests, scenarios and thresholds, Cloud runs, maintenance and a separate trend-analysis topic; qualified source assets and corrected metrics. |
| [google-analytics](./skills/monitoring/google-analytics/SKILL.md) | GA4, Tag Manager, tracking plans, UTM, Consent Mode and verification; correct predefined/custom dimensions and consent behavior. |
| [observability](./skills/monitoring/observability/SKILL.md) | OpenTelemetry instrumentation/collectors, structured logging, health probes, graph diagnosis and incident response, with canonical correlation and privacy rules. |

## Mobile

| Skill | Covers |
|---|---|
| [flutter](./skills/mobile/flutter/SKILL.md) | Flutter architecture, layout, routing, networking, performance, accessibility and release artifacts; separate plugin authoring, canonical MCP/widget-preview tooling and source-qualified Riverpod recipes. |
| [dart](./skills/mobile/dart/SKILL.md) | Dart language, Effective Dart, async/isolates, runtime libraries and paths, pub/workspaces, testing, CLI and FFI; shared MCP setup routes to Flutter tooling. |
| [app-store-connect](./skills/mobile/app-store-connect/SKILL.md) | App Store shipping, auth, builds/signing, TestFlight, metadata and subscriptions; separate fastlane delivery and review notes/recovery/appeals, with canonical privacy and storefront policy. |
| [google-play](./skills/mobile/google-play/SKILL.md) | Play publishing, signing, tracks, rollout, policy, pricing, vitals and reviews; corrected billing states/notifications and edit boundaries, with creative specifications owned by ASO. |
| [aso](./skills/mobile/aso/SKILL.md) | Store audits, keywords, metadata, visuals, experiments and reviews; screenshot production and 18 art directions, qualified asset rules, explicit source-weight arithmetic and P0 to P3 findings. |
| [app-growth](./skills/mobile/app-growth/SKILL.md) | Mobile acquisition, attribution, launch, onboarding, paywalls, retention and offers; source-checked billing/referrer/ROAS claims, shared context/referral definitions and store recovery handoffs. |
| [flutter-ux](./skills/mobile/flutter-ux/SKILL.md) | Community forms, navigation, scrolling, media, device and notification UX; separate pagination/loading and web-shell topics, canonical lifecycle recipes and corrected review acceptance. |
| [flutter-render-objects](./skills/mobile/flutter-render-objects/SKILL.md) | Custom RenderObjects, child/parent data, layout, painting, compositing, input, semantics and worked examples; canonical shared definitions and corrected reuse/semantics guidance. |

## Marketing

Marketing, SEO and GEO for web and SaaS products, from Corey Haines's marketingskills, every-app's OpenSEO, squirrelscan, iannuttall's Search Console tool, Audit Kit, FreeScan, aeo.js, How's It Lookin and Lightreel, each fact checked against the official page it rests on (Google Search Central, Google Ads, Meta, LinkedIn, TikTok, X, Apple, Google Play, the FTC, FCC, CAN-SPAM, GDPR, CASL, PECR, WCAG). Every skill reads the shared product context at `.agents/product-context.md` (defined in anti-slop-copy's CONTEXT.md). Outreach and scraping stay within the law and each platform's terms; evasion is named only as something not to do.

| Skill | Covers |
|---|---|
| [seo](./skills/marketing/seo/SKILL.md) | Technical SEO, structured data, local visibility and scaled pages; shared project setup/reporting, link outreach and directory submissions. |
| [keyword-research](./skills/marketing/keyword-research/SKILL.md) | Search demand, intent clusters and competitor evidence; first-party Search Console metrics distinguished from SERP listings. |
| [search-console](./skills/marketing/search-console/SKILL.md) | Reading a site's own Search Console data and saying only what it shows: click drops, quick wins, low CTR, decay, cannibalization, URL Inspection, the API's quotas and data loss, the iannuttall `seo` CLI and MCP |
| [ai-search-visibility](./skills/marketing/ai-search-visibility/SKILL.md) | AI discovery, crawler controls, citation evidence and measurement; local versus remote aeo.js checks. |
| [site-audit](./skills/marketing/site-audit/SKILL.md) | Permission-scoped audits, scanner limits, scoring, feedback and fix evidence; self-contained plans link to engineering handoffs. |
| [site-architecture](./skills/marketing/site-architecture/SKILL.md) | Information architecture: page hierarchy, URL patterns, breadcrumbs, header, footer and mobile navigation, internal links, platforms and migrations with Google's site-move rules, sitemap diagrams, site types |
| [content-strategy](./skills/marketing/content-strategy/SKILL.md) | Content research, pillars, formats, distribution and CMS drafts; shared ORB and linking definitions stay with their owners. |
| [comparison-pages](./skills/marketing/comparison-pages/SKILL.md) | Evidence-backed alternative/versus pages, data hubs and audience-aware P0 to P3 audits. |
| [customer-research](./skills/marketing/customer-research/SKILL.md) | Public evidence and Sales Safari, interviews, surveys and personas with minimum evidence and source qualifications. |
| [cro](./skills/marketing/cro/SKILL.md) | Marketing-page conversion, forms, popups, signup and experiments; shared form metrics and browser-performance routes. |
| [ab-testing](./skills/marketing/ab-testing/SKILL.md) | Tool-agnostic A/B testing: hypotheses, metrics and guardrails, sample sizes from the standard formula, duration with unequal splits, sequential testing, templates, an experimentation program |
| [marketing-attribution](./skills/marketing/marketing-attribution/SKILL.md) | Which marketing caused revenue: attribution models, MTA versus MMM versus incrementality, self-reported attribution, attribution by business type, stitching booking and checkout webhooks to analytics |
| [paid-ads](./skills/marketing/paid-ads/SKILL.md) | Web ad operations, scoped audits and measurement; separate B2B acquisition and account-based marketing topics. |
| [ad-creative](./skills/marketing/ad-creative/SKILL.md) | Grounded concepts, hooks, formats, copy and creative roadmaps; canonical safe zones and corrected RSA acceptance. |
| [creator-marketing](./skills/marketing/creator-marketing/SKILL.md) | Creators, UGC, ambassadors and paid placements: vetting, rights, briefs and qualified FTC/platform disclosure rules. |
| [social-media](./skills/marketing/social-media/SKILL.md) | Organic strategy, posts, Reddit, short-form planning and listening; dated X ranking evidence and canonical writing rules. |
| [cold-outreach](./skills/marketing/cold-outreach/SKILL.md) | Lawful outreach, sending, copy, cadences, LinkedIn and replies; permanent Gmail bulk status and human approval boundaries. |
| [prospecting](./skills/marketing/prospecting/SKILL.md) | Lawful demand signals, account research, sourcing and enrichment; canonical contact-data policy and no evasion procedures. |
| [sales-enablement](./skills/marketing/sales-enablement/SKILL.md) | Decks, one-pagers, objections, battle cards, win-loss, demos and calls; verified price comparisons and print constraints. |
| [revops](./skills/marketing/revops/SKILL.md) | Lead lifecycle, scoring, routing, enrichment, pipeline and CRM recipes; Salesforce scheduling and date-field limits. |
| [product-launch](./skills/marketing/product-launch/SKILL.md) | Launch planning, canonical ORB channels, phases, Product Hunt and source-grounded shipped-change announcements. |
| [public-relations](./skills/marketing/public-relations/SKILL.md) | Story angles, pitching, requests, podcasts and crisis communication with P0 to P3 severity and statement templates. |
| [partnerships](./skills/marketing/partnerships/SKILL.md) | Partner selection, co-marketing, integrations, resellers and marketplaces; agreements, lead sharing and lawful outreach. |
| [community-marketing](./skills/marketing/community-marketing/SKILL.md) | Community identity, launch, onboarding, rituals, support, ambassadors, platform choice and health. |
| [event-marketing](./skills/marketing/event-marketing/SKILL.md) | Event portfolios, sponsorship, speaking and webinars; the event arc, lawful follow-up and lifecycle-owner handoffs. |
| [lead-magnets](./skills/marketing/lead-magnets/SKILL.md) | Lead magnets and free tools: planning, gating and delivery under double opt-in and GDPR Art. 7(4), formats, promotion and measurement, free-tool types and cases |
| [referral-programs](./skills/marketing/referral-programs/SKILL.md) | Product virality, customer referrals and affiliates; canonical two-source reward sizing, K-factor, disclosure, fraud, measurement and payouts, with mobile implementations linked. |
| [review-management](./skills/marketing/review-management/SKILL.md) | Neutral review invitations, public replies, moderation, reputation triage and permissioned testimonial reuse. |
| [pricing-strategy](./skills/marketing/pricing-strategy/SKILL.md) | Pricing models, tiers, trials, research and rollout; page audits with consumer-specific markup and crawler policy. |
| [offer-design](./skills/marketing/offer-design/SKILL.md) | Offer anatomy, guarantees, bonuses, scarcity, discounts and paid info-products; FTC claims and canonical Stripe Price rules. |
| [service-businesses](./skills/marketing/service-businesses/SKILL.md) | Complete client-service guides: offers, qualified demos, approvals, delivery, actual-outcome billing, recurring work and handoff. |
| [churn-prevention](./skills/marketing/churn-prevention/SKILL.md) | Cancellation, health scores and source-qualified dunning copy; provider retry settings and verified access recovery. |
| [onboarding-and-upgrades](./skills/marketing/onboarding-and-upgrades/SKILL.md) | Activation, upgrade prompts, experiments and recovery cohorts; canonical psychology/store rules and cooldown constraints. |
| [sms-marketing](./skills/marketing/sms-marketing/SKILL.md) | Lawful SMS/MMS/WhatsApp, consent, encoding and sequences; sender-specific registration and provider opt-out boundaries. |
| [marketing-images](./skills/marketing/marketing-images/SKILL.md) | Image methods, prompts and platform sizes; actual-photo fidelity, reference decomposition and casual-phone options. Routes store screenshot production to ASO. |
| [marketing-video](./skills/marketing/marketing-video/SKILL.md) | Marketing video with tools: AI generation, avatars, repurposing and transcript-grounded cards over complete programs |
| [marketing-plan](./skills/marketing/marketing-plan/SKILL.md) | Resumable AARRR plans, budgets, market sizing, hiring and metrics; corrected idea counts and current channel-owner routes. |
| [marketing-loops](./skills/marketing/marketing-loops/SKILL.md) | Recurring marketing contracts, catalogues and operators; cadence, state, deduplication, approval and stop conditions. |
| [marketing-council](./skills/marketing/marketing-council/SKILL.md) | Twelve simulated advisors, sourced frameworks and disagreements; shared offer definitions stay canonical. |
| [growth-ideas](./skills/marketing/growth-ideas/SKILL.md) | 139 marketing ideas and buyer psychology; source-qualified applications, consolidated definitions and the corrected Fogg model. |
| [email-marketing](./skills/marketing/email-marketing/SKILL.md) | Campaign copy, sequences and lifecycle strategy; delivery and dunning link to their owners. |

## Reference code

`app-ui`, `landing-page-ui` and `agent-chat-ui` carry the production source they describe in `reference/`, with a `REFERENCE.md` index naming each file, the skill file that describes it, and the packages it needs. Copy from there to build it exactly.

## Licences

Code copied from other projects keeps its licence file beside the copy (`LICENSE-*.txt` in the folder that holds it, and `skills/frontend/isometric-figures/templates/isokit/LICENSE`).
