# Agent skills

127 skills for coding agents, in ten sets:

| Folder | What it's for |
|---|---|
| [`skills/ai-agents/`](./skills/ai-agents) | Build AI agents and AI features: the loop, prompt, tools and checks, evals, memory, the chat interface, the agent's codebase, writing skills, guided learning, Jev classifiers, search, RAG and extraction, plus Langfuse telemetry. 10 skills. |
| [`skills/videos/`](./skills/videos) | Make videos with a coding agent, where every frame is code: brief, assets, music clock, shot list, render, review, sound. 11 skills. |
| [`skills/anti-ai-slop/`](./skills/anti-ai-slop) | Keep what the agent writes, designs and codes from reading as generic AI output. 5 skills. |
| [`skills/backend/`](./skills/backend) | Servers, data and integrations: APIs, jobs, messaging, SQL, third-party integrations, observability, deployment, performance, security, Postgres, Supabase, Effect, payments (Stripe, RevenueCat), email (Resend, React Email, sending rules) and push (OneSignal), Convex, Firebase and Kapso. 21 skills. |
| [`skills/architecture/`](./skills/architecture) | Design and structure of any codebase: architecture, system design, domain modeling, migrations, refactoring, algorithms, testing, code review, debugging, engineering planning and JS/web reverse engineering. 11 skills. |
| [`skills/web-automation/`](./skills/web-automation) | Agents and tests in a real browser or device: end-to-end tests for web and mobile (Flutter, React Native), browser automation, scraping, WebMCP tools, research reports. 5 skills. |
| [`skills/frontend/`](./skills/frontend) | How UI is built and behaves, per surface: the app itself, the marketing site, animation in general, SVG, modern CSS, GSAP, accessibility, color systems, Sonner toasts, technical drawings, React (with Next.js and React Native) and WebGL, cookie consent. 13 skills. |
| [`skills/monitoring/`](./skills/monitoring) | Errors, analytics and telemetry in production: Sentry, PostHog, the Grafana stack (Prometheus, Loki, Tempo, Pyroscope, Alloy), k6 load tests and Google Analytics 4 with Tag Manager. 5 skills. |
| [`skills/mobile/`](./skills/mobile) | Mobile apps from code to store: Flutter, Dart, shipping to the App Store and Google Play, app store optimization, and growth (ads, attribution, retention), plus community Flutter UX tips with a design review and custom RenderObjects. 8 skills. |
| [`skills/marketing/`](./skills/marketing) | Marketing, SEO and GEO for web and SaaS products: technical SEO, structured data, AI search visibility, site audits and architecture, content, CRO and A/B tests, attribution, paid ads and ad creative, creators and social, lawful outreach, prospecting and sales, launches and PR, pricing, offers and churn, SMS and WhatsApp, plans, loops, an advisor council and client-service playbooks. 38 skills. |
| Total | 127 skills in ten sets. |

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
- **[video-setup](./skills/videos/video-setup/SKILL.md)**: Check and install the toolchain the video skills need. Run once per machine.

**Model-invoked**

- **[make-video](./skills/videos/make-video/SKILL.md)**: Direct and render a video from code as a gated production. The entry point and the map of the flow.
- **[video-brief](./skills/videos/video-brief/SKILL.md)**: The director's brief (facts vs choices, banned looks, the copy budget) and a style guide: look, motion language and video type as separate layers, the same film in several styles, restyles. Holds the spec patterns behind the films people copied.
- **[asset-prep](./skills/videos/asset-prep/SKILL.md)**: Real screens and brand facts captured from a site; cutouts, layers, textures and upscaling of supplied images; generated base footage to trace over. Official logos fetched as SVG. Also scripted app demo recordings with Playwright.
- **[beat-grid](./skills/videos/beat-grid/SKILL.md)**: Find, scan and measure music into `audio/beats.json`, the clock for picture and sound; per-frame band energy for audio-reactive visuals; word-by-word lyric timing.
- **[voiceover](./skills/videos/voiceover/SKILL.md)**: ElevenLabs narration with word timings, per-line cache, pronunciation fixes and pause trimming, plus lip sync for a talking character.
- **[shotlist](./skills/videos/shotlist/SKILL.md)**: A concept that passes ownership tests, a measured precedent per beat, beat structures by format, the viewer's reads on the grid, one carrier object, techniques drawn from a 273-entry library, three storyboard variants.
- **[seek-engine](./skills/videos/seek-engine/SKILL.md)**: The `seek(t)` render contract, the starter film, the motion number sheet and the renderer (stills, sheets, strips, motion-blurred MP4 in every format). A measured corpus from 53 professional moments, the 12 measured eases, a seekable 3D hero, iOS UI builders and isometric figures, real objects built from a photo or a name (exploded product reveals), and motion blur sized by on-screen speed.
- **[frame-review](./skills/videos/frame-review/SKILL.md)**: The smoke test's zero counters, contact sheets, phone test, a catalogue of AI-video tells, critic lenses with a verify pass, a rubric and ship gate, and sync and loudness checks on the delivered file. Page-chrome lint and file-level gates (end hold, flat frames, audio audit) and a blind A/B review page.
- **[sound-pass](./skills/videos/sound-pass/SKILL.md)**: Synthesized SFX on measured peaks, scaled to their cause, with a progress motif; music and voice mixed; mastered to -14 LUFS and -1 dBTP; the sound norms of top launch films.

**Requirements:** Node 20+ (22+ for HyperFrames), ffmpeg with libx264, uv (or Python 3 with numpy), and Playwright's Chromium. Optional: `ELEVENLABS_API_KEY` for narration, `FAL_KEY` for generated imagery, both in the project's `.env`.

## Anti-AI-slop

Start with `anti-slop`; it holds the shared rules and routes to the others.

- **[anti-slop](./skills/anti-ai-slop/anti-slop/SKILL.md)**: The shared rules (real over invented, specific over generic) for prose, copy, interfaces, code and the agent's own plans and replies.
- **[anti-slop-writing](./skills/anti-ai-slop/anti-slop-writing/SKILL.md)**: Voice-preserving prose and developer docs, evidence-based audits and Hebrew language guidance.
- **[anti-slop-copy](./skills/anti-ai-slop/anti-slop-copy/SKILL.md)**: Grounded product copy, point edits, shared context, review panels and source-attributed alternatives. Research-to-copy traceability, scoped headline exploration and truthful early-stage proof handling.
- **[anti-slop-ui](./skills/anti-ai-slop/anti-slop-ui/SKILL.md)**: Purposeful interfaces, component states, responsive/RTL behavior and correctly scoped WCAG contrast. Source-qualified numeric stacking limits.
- **[anti-slop-code](./skills/anti-ai-slop/anti-slop-code/SKILL.md)**: Behavior-preserving code cleanup, duplication pointers and runtime-qualified defensive checks.

## AI agents

Building agents that stay reliable, and the AI features around them. Start with `agent-harness`; it routes to the rest.

| Skill | Covers |
|---|---|
| [agent-harness](./skills/ai-agents/agent-harness/SKILL.md) | Agent loops, tools, history, source research, authority binding, evidence coverage and shared-resource cancellation. |
| [agent-evals](./skills/ai-agents/agent-evals/SKILL.md) | Real-agent evals, calibrated judges, review taxonomies, managed/local boundaries, DeepEval and evidence-based documentation audits. |
| [skill-authoring](./skills/ai-agents/skill-authoring/SKILL.md) | Skill structure, routing, descriptions, reference organization, pressure scenarios and measured improvements. |
| [agent-memory](./skills/ai-agents/agent-memory/SKILL.md) | Long-term memory, evidence-based preference extraction, consolidation, retrieval, expiry and user controls. |
| [agent-chat-ui](./skills/ai-agents/agent-chat-ui/SKILL.md) | An agent's chat interface: the live status line and folded work log, smooth streaming text, approval and question cards, results as the product's own components, follow-ups, the composer with files, voice and a queue, the conversation list, every timing and size. Ships the production source in `reference/` |
| [agent-codebase](./skills/ai-agents/agent-codebase/SKILL.md) | Agent folders, searchable concepts, module contracts, dependency direction and eval seams. |
| [jev-decisions](./skills/ai-agents/jev-decisions/SKILL.md) | Yes/no, choice and score questions, facts kept apart from evidence, thresholds and gates, agent tool gates and stop hooks, trace judges, calibration and evals, plus worked recipes (value and date extraction, search, re-ranking, taxonomies, record matching, guardrails, memory, tool suggestion). TypeScript with `@typesafe-ai/sdk`., the decide API names by AI SDK version |
| [ai-features](./skills/ai-agents/ai-features/SKILL.md) | Vector and hybrid search, RAG with citations, structured extraction, AI jobs |
| [guided-learning](./skills/ai-agents/guided-learning/SKILL.md) | Learning missions, cited resources, observed evidence, interactive lessons and reusable reference material. |
| [langfuse](./skills/ai-agents/langfuse/SKILL.md) | Tracing, prompt management, evaluations and source-grounded migration between telemetry systems. |

## Backend

Detailed coverage is in the [Backend set README](./skills/backend/README.md#skills).

| Skill | Covers |
|---|---|
| [api-design](./skills/backend/api-design/SKILL.md) | HTTP contracts, pagination, errors, idempotency, streaming and limits. Official HTTP deprecation, Problem Details, caching and SSE failure boundaries. |
| [background-jobs](./skills/backend/background-jobs/SKILL.md) | Workers, queues, retries, durable workflows, concurrency and the Convex workflow branch. Session-lock release and failure detection limits. |
| [messaging](./skills/backend/messaging/SKILL.md) | Transactional outbox/inbox, idempotent consumers, ordering and brokers. External-effect uncertainty, broker returns and aggregate ordering. |
| [sql-patterns](./skills/backend/sql-patterns/SKILL.md) | Correct SQL for joins, NULLs, ties, windows, time zones, JSON and hierarchies. |
| [postgres](./skills/backend/postgres/SKILL.md) | Production schemas, pooling, transactions, WAL, recovery and PlanetScale-specific operations. |
| [supabase](./skills/backend/supabase/SKILL.md) | Data API, RLS, Auth, database services, scoped tooling and declarative schemas; Fetch middleware authoring, bridge limits and transaction-scoped Postgres claims. |
| [effect](./skills/backend/effect/SKILL.md) | Effect v4 code, errors, services, resources, concurrency, Schema and platform APIs. |
| [third-party-integrations](./skills/backend/third-party-integrations/SKILL.md) | Connected accounts, OAuth, provider APIs, sync and webhooks, with the Kapso integration branch. |
| [observability](./skills/backend/observability/SKILL.md) | OpenTelemetry traces, metrics, logs, health checks and incident diagnosis. Current semantic attributes, telemetry privacy, SDK buffers and collector limits. |
| [deployment](./skills/backend/deployment/SKILL.md) | Containers, Compose, host moves, backups, release verification and npm publishing. Selected-stack SaaS walking skeleton, environment inventory and incident checklist. |
| [performance-and-caching](./skills/backend/performance-and-caching/SKILL.md) | Query tuning, caching, browser performance and equivalent whole-task cost and correctness measurements. Planner caveats, index benefits, PostgreSQL ranking and temperature-zero limits. |
| [secure-coding](./skills/backend/secure-coding/SKILL.md) | Trust boundaries, authentication, tenant isolation, parsers, browser boundaries and package installation controls. Atomic one-time-code redemption and encrypted relay fallback. |
| [stripe](./skills/backend/stripe/SKILL.md) | Payments, Billing, Connect, Tax, Stripe Apps, agent tools and qualified revenue/operations metrics. Provider-specific dispute evidence, final submission and actual recovery states. |
| [revenuecat](./skills/backend/revenuecat/SKILL.md) | Purchases and subscriptions, current identity, store testing, verification modes, paywalls, experiments and webhooks. |
| [resend](./skills/backend/resend/SKILL.md) | Sending and receiving email, domains, webhooks, contacts, automations and tooling. |
| [react-email](./skills/backend/react-email/SKILL.md) | React email components, styling, rendering, delivery, localization and templates. |
| [email-practices](./skills/backend/email-practices/SKILL.md) | Authentication, delivery, consent, unsubscribe rules and lifecycle email. Optional source-attributed problem-to-offer narrative beats across a sequence. |
| [onesignal](./skills/backend/onesignal/SKILL.md) | Push and messaging setup, identity, permissions, sending, journeys and analytics. |
| [convex](./skills/backend/convex/SKILL.md) | Functions/data, authorization, components, agents/billing, operations, migrations and testing; optional kitcn cRPC, ORM, aggregates, Better Auth, React/RSC, HTTP, scheduling and rate limits. |
| [firebase](./skills/backend/firebase/SKILL.md) | Web/Flutter setup, Auth, AI Logic, Firestore, SQL Connect, Hosting, Functions migration and Remote Config. Flutter Storage downloads, task progress and failures. |
| [kapso](./skills/backend/kapso/SKILL.md) | WhatsApp messages/templates, webhooks, Flows, workflows, functions/events, calling and operational observation. |

## Architecture

| Skill | Covers |
|---|---|
| [software-architecture](./skills/architecture/software-architecture/SKILL.md) | Application structure, module boundaries, data ownership, extraction and question-driven logic prototypes. Transaction scope, source-qualified slice policies, isolation and rollback limits. |
| [system-design](./skills/architecture/system-design/SKILL.md) | Load balancing, caching, queues, CDNs, feeds, sandboxes; worked designs from URL shorteners to data recovery. Commit-order limits and idempotent feed fan-out. |
| [domain-modeling](./skills/architecture/domain-modeling/SKILL.md) | Contexts, aggregates, invariants, events, sagas, CQRS, domain glossaries and decision records. Shallow collection protection and projection watermark gaps. |
| [system-migration](./skills/architecture/system-migration/SKILL.md) | Incremental ports, legacy replacement, dependency changes and jscpd function maps with behavior evidence. |
| [refactoring](./skills/architecture/refactoring/SKILL.md) | Behavior-preserving changes, typed errors, deep modules, duplication and dependency-usage audits. Behavior-preserving validation, typestate and undo tradeoffs. |
| [algorithm-patterns](./skills/architecture/algorithm-patterns/SKILL.md) | Recognizing the problem's shape: hash maps, windows, prefix sums, graphs, dynamic programming, budgets. JavaScript midpoint coercion and source-qualified numeric budgets. |
| [testing](./skills/architecture/testing/SKILL.md) | Behavior tests, real infrastructure, independent oracles, provider evidence and deliberate malformed fixtures. Equivalent mutants and strike-lookahead coverage. |
| [code-review](./skills/architecture/code-review/SKILL.md) | Evidence-based code review, repository/security audits, browser boundaries, scanner triage and Ultracite. Reachable failure paths, evidence levels and scoped no-finding reports. |
| [debugging](./skills/architecture/debugging/SKILL.md) | Reproduction, falsifiable hypotheses, shared root causes and evidence-based verification. Discriminating controls, tested-artifact identity and state-effect evidence limits. |
| [engineering-planning](./skills/architecture/engineering-planning/SKILL.md) | Interviews, specifications, local work breakdown, decision maps, handoff plans, RFCs and human-only steps. |
| [reverse-engineering](./skills/architecture/reverse-engineering/SKILL.md) | Shipped JS/Electron artifacts, scoped runtime observation, retained captures and version evidence. |

## Frontend

Detailed coverage is in the [Frontend set README](./skills/frontend/README.md#skills).

| Skill | Covers |
|---|---|
| [ui-animation](./skills/frontend/ui-animation/SKILL.md) | Web/app motion, timing, gestures, scroll, native CSS, React transitions and audits. |
| [svg](./skills/frontend/svg/SKILL.md) | Drawing, styling, animation, filters, icons, embedding, accessibility and sanitization. |
| [modern-css](./skills/frontend/modern-css/SKILL.md) | Modern layout, queries, forms, top-layer controls, motion, colors and browser support. Corrected registration, geometry and dismissal contracts, CSS infinity, flex balancing and Tailwind aliases. |
| [gsap](./skills/frontend/gsap/SKILL.md) | Tweens, eases, timelines, React cleanup, ScrollTrigger and the official plugins. |
| [web-accessibility](./skills/frontend/web-accessibility/SKILL.md) | WCAG/APG interfaces, forms and phone numbers with numbering validity separate from identity. |
| [color-system](./skills/frontend/color-system/SKILL.md) | OKLCH, ramps, semantic tokens, contrast, dark mode, gamut and color audits. |
| [sonner](./skills/frontend/sonner/SKILL.md) | Sonner setup, toast lifecycle, promises, styling, right-to-left and troubleshooting. |
| [technical-drawing](./skills/frontend/technical-drawing/SKILL.md) | Evidence-based exploded, orthographic and section drawings with dimensions and exports. |
| [react](./skills/frontend/react/SKILL.md) | Global React rules, React 19, Next.js, React Native, performance and audits. |
| [webgl](./skills/frontend/webgl/SKILL.md) | Live-page widgets, shared contexts, fallbacks, three.js/R3F audits and 3D launch pages. |
| [cookie-consent](./skills/frontend/cookie-consent/SKILL.md) | c15t categories and regional policies, script gating, consent withdrawal and verification. |
| [app-ui](./skills/frontend/app-ui/SKILL.md) | The production app design, components, tokens and behavior, with its reference source. |
| [landing-page-ui](./skills/frontend/landing-page-ui/SKILL.md) | The production marketing-site design, motion and page templates, with reference source. |

## Web automation

| Skill | Covers |
|---|---|
| [e2e-testing](./skills/web-automation/e2e-testing/SKILL.md) | Web/mobile journeys, decision-model execution, failure triage, Maestro, Patrol and adversarial UI evidence. |
| [browser-automation](./skills/web-automation/browser-automation/SKILL.md) | Browser ownership, sessions, scoped interception, paired-clock tracing and evidence-based task loops. |
| [web-scraping](./skills/web-automation/web-scraping/SKILL.md) | Permitted fetch/crawl/parse workflows, current Scrapling contracts and qualified traffic-to-OpenAPI generation. |
| [webmcp](./skills/web-automation/webmcp/SKILL.md) | Task tools, closed schemas, current registration/invocation lifecycle, confirmation and live probing. |
| [web-research](./skills/web-automation/web-research/SKILL.md) | Parallel research with source identity, bounded discovery, honest coverage and evidence-backed reports. |

## Monitoring

Detailed coverage is in the [Monitoring set README](./skills/monitoring/README.md#skills).

| Skill | Covers |
|---|---|
| [sentry](./skills/monitoring/sentry/SKILL.md) | Platform SDKs, privacy, version-scoped defaults, Expo Router tracing, logs and diagnostics. |
| [posthog](./skills/monitoring/posthog/SKILL.md) | Product analytics, flags, experiments, replay, errors, HogQL and data workflows. Current Clerk composition for the Next.js proxy. |
| [grafana](./skills/monitoring/grafana/SKILL.md) | Dashboards, alerts, telemetry pipelines, current configuration and plugin development. |
| [k6](./skills/monitoring/k6/SKILL.md) | Load/browser tests, VU isolation, threshold semantics, private HAR handling and compliant access. |
| [google-analytics](./skills/monitoring/google-analytics/SKILL.md) | GA4, Tag Manager, events, UTM, Consent Mode and tracking verification. |

## Mobile

| Skill | Covers |
|---|---|
| [flutter](./skills/mobile/flutter/SKILL.md) | Flutter from the official docs and the Flutter team's skills: architecture (layers, MVVM, commands), routing and deep links, networking and JSON, localization, responsive and adaptive layout, flutter_scale_kit, performance, accessibility, testing, platform channels and Pigeon, building and releasing for iOS and Android, versions and breaking changes, the MCP server and agent tooling, the owner's CSS-units-to-Flutter rules (LayoutBuilder over MediaQuery, M3 window classes, no app-wide text-scale cap); plus community Riverpod, testing recipes, fastlane, Drift, Slang and plugin authoring, marked as such. Corrected flex, test variants, framework errors and semantics; ADB operations. |
| [dart](./skills/mobile/dart/SKILL.md) | Dart from dart.dev and the Dart team's skills: Effective Dart style, docs, usage and design, the Dart 3 language (records, patterns, class modifiers, extension types, primary constructors), async and isolates, core libraries (dates across daylight saving, maps, copying collections, JSON), versions, analysis and lints, packages and pub, testing, CLI apps, FFI. VM inline hints and measurement requirements. |
| [app-store-connect](./skills/mobile/app-store-connect/SKILL.md) | Shipping to the App Store: the asc CLI, builds and signing, TestFlight and release, ad hoc distribution, the App Review Guidelines, a preflight checklist by app type, privacy manifests, ATT and account deletion, metadata and screenshots, pricing and subscriptions, in-app events, analytics and crashes; price-increase consent rules, the Small Business Program |
| [google-play](./skills/mobile/google-play/SKILL.md) | Shipping to Google Play: the gplay CLI, builds, signing and target API deadlines, testing tracks and the 12-tester rule, staged rollouts, policy and Data safety, Android vitals, billing and purchase verification, pricing, the store listing, reviews and reports; the Subscriptions policy word for word, price-increase rules |
| [aso](./skills/mobile/aso/SKILL.md) | App store optimization for both stores: audits, keywords and metadata, icons, screenshots and previews, custom product pages and experiments, in-app events, competitors and the market, ratings and reviews, Google Play specifics; an audit rubric and sourced benchmarks, Play promotional content |
| [app-growth](./skills/mobile/app-growth/SKILL.md) | Growing an app: launch, PR and referrals, analytics and attribution (ATT, AdAttributionKit, SKAdNetwork), onboarding, paywalls, retention and subscription offers, the Facebook SDK in Flutter with RevenueCat events, Apple Ads and its APIs, Google App campaigns, Meta and TikTok app ads, ad creatives, budgets and ROAS; onboarding and paywalls in their own files, Product Hunt from its own guide, FTC disclosure for creators, Apple referral rules, current Meta ad specs and Google Play fees |
| [flutter-ux](./skills/mobile/flutter-ux/SKILL.md) | Community Flutter UX and app polish from FlutterPro (Kamran Bekirov) and ApparenceKit, checked against the official docs: forms, keyboard and focus, navigation, sheets and route guards, scrolling and layout, images and typography, motion and haptics, painting and media, notifications and permissions, device features, forced updates and maintenance mode, Flutter web, formatting, theming and widget patterns, plus a find, pick, plan design review with a 42-rule catalog. Gesture arbitration, painter stability, notifications, scheduling and loader weights. |
| [flutter-render-objects](./skills/mobile/flutter-render-objects/SKILL.md) | Custom RenderObjects from renderobjects.com (Matt Carroll), corrected against api.flutter.dev: layout, intrinsics and baselines, child models and parent data, painting, compositing and layers, hit testing and mouse cursors, semantics, show-on-screen, diagnostics, custom Elements, and three worked examples. Widget placements, lookup dependencies, clipping offsets and transform contracts. |

## Marketing

Marketing, SEO and GEO for web and SaaS products, from Corey Haines's marketingskills, every-app's OpenSEO, squirrelscan, iannuttall's Search Console tool, Audit Kit, FreeScan, aeo.js, How's It Lookin and Lightreel, each fact checked against the official page it rests on (Google Search Central, Google Ads, Meta, LinkedIn, TikTok, X, Apple, Google Play, the FTC, FCC, CAN-SPAM, GDPR, CASL, PECR, WCAG). Every skill reads the shared product context at `.agents/product-context.md` (defined in anti-slop-copy's CONTEXT.md). Outreach and scraping stay within the law and each platform's terms; evasion is named only as something not to do.

| Skill | Covers |
|---|---|
| [seo](./skills/marketing/seo/SKILL.md) | Technical SEO, valid structured data, local visibility, pages at scale and factual directory submissions. |
| [keyword-research](./skills/marketing/keyword-research/SKILL.md) | Search demand, intent clustering, competitor evidence and coverage-aware HTML reports. |
| [search-console](./skills/marketing/search-console/SKILL.md) | Reading a site's own Search Console data and saying only what it shows: click drops, quick wins, low CTR, decay, cannibalization, URL Inspection, the API's quotas and data loss, the iannuttall `seo` CLI and MCP |
| [ai-search-visibility](./skills/marketing/ai-search-visibility/SKILL.md) | AI crawl/discovery, OKF v0.2, visibility and citation evidence, prompts and measurement. |
| [site-audit](./skills/marketing/site-audit/SKILL.md) | Permission-scoped site audits, scanner limits, scoring alternatives, authorized feedback and fix evidence. |
| [site-architecture](./skills/marketing/site-architecture/SKILL.md) | Information architecture: page hierarchy, URL patterns, breadcrumbs, header, footer and mobile navigation, internal links, platforms and migrations with Google's site-move rules, sitemap diagrams, site types |
| [content-strategy](./skills/marketing/content-strategy/SKILL.md) | What content to make and how it spreads: searchable versus shareable, pillars and clusters, ideation, formats, distribution, headless CMS drafts and previews |
| [comparison-pages](./skills/marketing/comparison-pages/SKILL.md) | Evidence-backed alternative/versus pages, data hubs and audience-aware P0 to P3 audits. |
| [customer-research](./skills/marketing/customer-research/SKILL.md) | Customer language and evidence: mining reviews, forums and Reddit within their terms, interviews and surveys, personas. Copywriting quote emotion/context, evidenced profile questions and tagged source-selection alternatives. |
| [cro](./skills/marketing/cro/SKILL.md) | Conversion on marketing pages: the page audit, forms, popups within Google's interstitial guidance and WCAG, signup flows with NIST password rules, experiments |
| [ab-testing](./skills/marketing/ab-testing/SKILL.md) | Tool-agnostic A/B testing: hypotheses, metrics and guardrails, sample sizes from the standard formula, duration with unequal splits, sequential testing, templates, an experimentation program |
| [marketing-attribution](./skills/marketing/marketing-attribution/SKILL.md) | Which marketing caused revenue: attribution models, MTA versus MMM versus incrementality, self-reported attribution, attribution by business type, stitching booking and checkout webhooks to analytics |
| [paid-ads](./skills/marketing/paid-ads/SKILL.md) | Web advertising, current Google Search mechanics, statistical bounds and scoped Meta fatigue diagnosis. |
| [ad-creative](./skills/marketing/ad-creative/SKILL.md) | Platform-specific ad formats, grounded hooks, creative roadmaps and implied-answer openings. |
| [creator-marketing](./skills/marketing/creator-marketing/SKILL.md) | Influencer, creator, UGC and ambassador programs: vetting, deals and rights, briefs, FTC and platform disclosure, creator ad programs, newsletter sponsorships, Telegram channels |
| [social-media](./skills/marketing/social-media/SKILL.md) | Organic strategy, current X ranking evidence, platform limits and normalized listening scores. Reddit community tutorials/inbound handoff and shootable short-form planning. |
| [cold-outreach](./skills/marketing/cold-outreach/SKILL.md) | Lawful B2B cold outreach: who may be emailed, sending setup, copy, sequences, LinkedIn, replies, plays and benchmarks |
| [prospecting](./skills/marketing/prospecting/SKILL.md) | Lawful demand signals, account research, sourcing and enrichment without evasion procedures. Browser cross-references follow the current stop-at-access-limits rule. |
| [sales-enablement](./skills/marketing/sales-enablement/SKILL.md) | Sales collateral: decks, one-pagers, objection handling, battle cards, win-loss analysis, demo scripts, cold calls within the FTC and FCC rules |
| [revops](./skills/marketing/revops/SKILL.md) | Lifecycle stages, lead scoring calibrated on a holdout, routing, inbound enrichment, pipeline metrics, CRM automations on current HubSpot and Salesforce features |
| [product-launch](./skills/marketing/product-launch/SKILL.md) | Launches and announcements: the readiness gate, owned, rented and borrowed channels, launch phases, and Product Hunt from its own guide |
| [public-relations](./skills/marketing/public-relations/SKILL.md) | Press: story angles, pitching, newsjacking, press requests, podcast prep, crisis communication and statements |
| [partners-and-community](./skills/marketing/partners-and-community/SKILL.md) | Co-marketing partners, the five partnership types, and community programs with FTC disclosure for ambassadors and contests |
| [event-marketing](./skills/marketing/event-marketing/SKILL.md) | Events that produce pipeline: the event arc, portfolio, sponsorship, speaking, webinar funnels, lawful badge-scan follow-up |
| [lead-magnets](./skills/marketing/lead-magnets/SKILL.md) | Lead magnets and free tools: planning, gating and delivery under double opt-in and GDPR Art. 7(4), formats, promotion and measurement, free-tool types and cases |
| [referral-programs](./skills/marketing/referral-programs/SKILL.md) | Referral, affiliate and review programs: viral loops, program design with both reward-sizing formulas, metrics, affiliates, review programs within FTC, Google and Trustpilot rules |
| [pricing-strategy](./skills/marketing/pricing-strategy/SKILL.md) | Pricing for SaaS and web: models, tiers and trials, research methods, price changes with the store rules, page teardowns |
| [offer-design](./skills/marketing/offer-design/SKILL.md) | The offer itself: anatomy, guarantees, bonuses, scarcity, discounts, formats, and the one definition of the FTC rules on prices, "free", guarantees and fake urgency. Paid info-product discovery, validation, construction and distribution. |
| [service-businesses](./skills/marketing/service-businesses/SKILL.md) | Complete client-service guides: offers, qualified demos, approvals, delivery, actual-outcome billing, recurring work and handoff. |
| [churn-prevention](./skills/marketing/churn-prevention/SKILL.md) | SaaS churn: cancel flows within ROSCA, a health score, dunning copy |
| [onboarding-and-upgrades](./skills/marketing/onboarding-and-upgrades/SKILL.md) | Activation, upgrade prompts and scoped component versus whole-variant experiments. |
| [sms-marketing](./skills/marketing/sms-marketing/SKILL.md) | Lawful SMS/MMS/WhatsApp, consent, sequences and destination-specific template restrictions. Review incentives follow destination rules, including no Google review incentives. |
| [marketing-images](./skills/marketing/marketing-images/SKILL.md) | Marketing images: choosing the method, prompting, sizes per platform. Actual-photo fidelity and subject-specific QA under existing generation policies. |
| [marketing-video](./skills/marketing/marketing-video/SKILL.md) | Marketing video with tools rather than code: AI generation with Veo's real limits, avatars, repurposing |
| [marketing-plan](./skills/marketing/marketing-plan/SKILL.md) | A 12-month AARRR marketing plan: intake, current-state rubric, budget, funding stages, market sizing, measurement, team and agencies, an example plan |
| [marketing-loops](./skills/marketing/marketing-loops/SKILL.md) | Recurring marketing loops an agent runs on a durable scheduler: the loop template, state, guardrails, a 58-loop catalogue by funnel, SEO and outbound operators |
| [marketing-council](./skills/marketing/marketing-council/SKILL.md) | A simulated board of 12 marketing advisors applying their documented frameworks, with a named dissenter and a disagreement map |
| [growth-ideas](./skills/marketing/growth-ideas/SKILL.md) | 139 marketing ideas, guerrilla tactics and 72 buyer-psychology models, each marked by whether it cites a study, with the platform rules each idea touches |

## Reference code

`app-ui`, `landing-page-ui` and `agent-chat-ui` carry the production source they describe in `reference/`, with a `REFERENCE.md` index naming each file, the skill file that describes it, and the packages it needs. Copy from there to build it exactly.

## Licences

Code copied from other projects keeps its licence file beside the copy (`LICENSE-*.txt` in the folder that holds it, and `skills/videos/seek-engine/templates/isokit/LICENSE`).
