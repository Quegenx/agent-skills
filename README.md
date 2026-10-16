# Agent skills

39 skills for coding agents, in six sets:

| Folder | What it's for |
|---|---|
| [`skills/ai-agents/`](./skills/ai-agents) | Build AI agents and AI features: the loop, prompt, tools and checks, evals, memory, the agent's codebase, Jev classifiers, search, RAG and extraction. 6 skills. |
| [`skills/videos/`](./skills/videos) | Make videos with a coding agent, where every frame is code: brief, assets, music clock, shot list, render, review, sound. 11 skills. |
| [`skills/anti-ai-slop/`](./skills/anti-ai-slop) | Keep what the agent writes, designs and codes from reading as generic AI output. 5 skills. |
| [`skills/backend/`](./skills/backend) | Servers, data and integrations: APIs, jobs, messaging, SQL, third-party integrations, observability, deployment, performance, security. 9 skills. |
| [`skills/architecture/`](./skills/architecture) | Design and structure of any codebase: architecture, system design, domain modeling, migrations, refactoring, algorithms, testing. 7 skills. |
| [`skills/frontend/`](./skills/frontend) | How app and website UI behaves: animation. 1 skill. |

Works in Claude Code, Codex and any agent that reads Agent Skills. Each skill is a plain folder with a `SKILL.md`.

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
- **[asset-prep](./skills/videos/asset-prep/SKILL.md)**: Real screens and brand facts captured from a site; cutouts, layers, textures and upscaling of supplied images; generated base footage to trace over. Official logos fetched as SVG.
- **[beat-grid](./skills/videos/beat-grid/SKILL.md)**: Find, scan and measure music into `audio/beats.json`, the clock for picture and sound; per-frame band energy for audio-reactive visuals; word-by-word lyric timing.
- **[voiceover](./skills/videos/voiceover/SKILL.md)**: ElevenLabs narration with word timings, per-line cache, pronunciation fixes and pause trimming, plus lip sync for a talking character.
- **[shotlist](./skills/videos/shotlist/SKILL.md)**: A concept that passes ownership tests, a measured precedent per beat, beat structures by format, the viewer's reads on the grid, one carrier object, techniques drawn from a 273-entry library, three storyboard variants.
- **[seek-engine](./skills/videos/seek-engine/SKILL.md)**: The `seek(t)` render contract, the starter film, the motion number sheet and the renderer (stills, sheets, strips, motion-blurred MP4 in every format). A measured corpus from 53 professional moments, the 12 measured eases, a seekable 3D hero, iOS UI builders and isometric figures.
- **[frame-review](./skills/videos/frame-review/SKILL.md)**: The smoke test's zero counters, contact sheets, phone test, a catalogue of AI-video tells, critic lenses with a verify pass, a rubric and ship gate, and sync and loudness checks on the delivered file. Page-chrome lint and file-level gates (end hold, flat frames, audio audit) and a blind A/B review page.
- **[sound-pass](./skills/videos/sound-pass/SKILL.md)**: Synthesized SFX on measured peaks, scaled to their cause, with a progress motif; music and voice mixed; mastered to -14 LUFS and -1 dBTP; the sound norms of top launch films.

**Requirements:** Node 20+, ffmpeg with libx264, uv (or Python 3 with numpy), and Playwright's Chromium. Optional: `ELEVENLABS_API_KEY` for narration, `FAL_KEY` for generated imagery, both in the project's `.env`.

## Anti-AI-slop

Start with `anti-slop`; it holds the shared rules and routes to the others.

- **[anti-slop](./skills/anti-ai-slop/anti-slop/SKILL.md)**: The shared rules (real over invented, specific over generic) for prose, copy, interfaces, code and the agent's own plans and replies.
- **[anti-slop-writing](./skills/anti-ai-slop/anti-slop-writing/SKILL.md)**: Edits prose so it reads like a sharp human wrote it, in the writer's voice, or audits a text and names the AI-writing patterns. Any language, with a Hebrew file.
- **[anti-slop-copy](./skills/anti-ai-slop/anti-slop-copy/SKILL.md)**: Website, marketing and product copy that converts: pages, headlines, CTAs, emails and interface text.
- **[anti-slop-ui](./skills/anti-ai-slop/anti-slop-ui/SKILL.md)**: Interfaces that don't look template-built and actually work: the purpose test for every visual technique.
- **[anti-slop-code](./skills/anti-ai-slop/anti-slop-code/SKILL.md)**: Removes AI code slop without changing behavior: narrating comments, bloated names, needless wrappers, misplaced error handling.

## AI agents

Building agents that stay reliable, and the AI features around them. Start with `agent-harness`; it routes to the rest.

| Skill | Covers |
|---|---|
| [agent-harness](./skills/ai-agents/agent-harness/SKILL.md) | Reliable LLM agents: where each rule lives, a cache-stable prompt, code gates with caps, tools, history, compaction, memory, classifier checks |
| [agent-evals](./skills/ai-agents/agent-evals/SKILL.md) | Eval suites that run the real agent with outside services faked, code checks and calibrated judges, simulated users, the fix loop to a clean run, and release gates |
| [agent-memory](./skills/ai-agents/agent-memory/SKILL.md) | Long-term agent memory: what to remember and where, background extraction, consolidation, an always-on profile plus search, staying current, forgetting, user controls and memory evals |
| [agent-codebase](./skills/ai-agents/agent-codebase/SKILL.md) | An agent's code layout: transport, core, memory, skills and tools folders, names, dependency direction, test mirror and eval seams |
| [jev-decisions](./skills/ai-agents/jev-decisions/SKILL.md) | Yes/no, choice and score questions, facts kept apart from evidence, thresholds and gates, agent tool gates and stop hooks, trace judges, calibration and evals, plus worked recipes (value and date extraction, search, re-ranking, taxonomies, record matching, guardrails, memory, tool suggestion). TypeScript with `@typesafe-ai/sdk`. |
| [ai-features](./skills/ai-agents/ai-features/SKILL.md) | Vector and hybrid search, RAG with citations, structured extraction, AI jobs |

## Backend

TypeScript, with Supabase/Postgres, Convex and Effect where the stack matters. Each skill routes to its reference files from `SKILL.md`.

| Skill | Covers |
|---|---|
| [api-design](./skills/backend/api-design/SKILL.md) | Contracts, pagination, errors, idempotency, feature flags, streaming, timeouts and rate limits |
| [background-jobs](./skills/backend/background-jobs/SKILL.md) | Async APIs, workers and queues, retries, durable multi-step workflows with waits and flow control, row and advisory locks, concurrency across instances |
| [messaging](./skills/backend/messaging/SKILL.md) | Outbox and inbox in Postgres, idempotent consumers, ordering, choosing a broker |
| [sql-patterns](./skills/backend/sql-patterns/SKILL.md) | SQL that returns the right answer: joins that multiply, NULLs, ties, time zones, streaks, ranges, hierarchies, JSON |
| [third-party-integrations](./skills/backend/third-party-integrations/SKILL.md) | Integrations with the apps users connect: connection ownership, OAuth apps and scopes, refresh and reconnect, calling and syncing their APIs, provider webhooks, agents acting through those accounts |
| [observability](./skills/backend/observability/SKILL.md) | OpenTelemetry traces, metrics and logs, the collector, liveness and readiness |
| [deployment](./skills/backend/deployment/SKILL.md) | Containers, Compose, zero-downtime host moves, backups, verifiable releases |
| [performance-and-caching](./skills/backend/performance-and-caching/SKILL.md) | Measuring first, N+1, indexes and plans, full-text search, caching and invalidation, media and long lists in the browser |
| [secure-coding](./skills/backend/secure-coding/SKILL.md) | Untrusted input, auth and 2FA, tenant isolation with RLS, secrets at rest, parser disagreements |

## Architecture

| Skill | Covers |
|---|---|
| [software-architecture](./skills/architecture/software-architecture/SKILL.md) | Monolith, modular monolith or services; Clean Architecture vs vertical slices; module boundaries and data isolation; extracting a module; strangler-fig migration |
| [system-design](./skills/architecture/system-design/SKILL.md) | Load balancing, caching, queues, CDNs, feeds, sandboxes; worked designs from URL shorteners to data recovery |
| [domain-modeling](./skills/architecture/domain-modeling/SKILL.md) | Bounded contexts, aggregates, invariants, domain and integration events, sagas, CQRS, event sourcing |
| [system-migration](./skills/architecture/system-migration/SKILL.md) | Incremental ports, legacy rewrites, replacing a dependency whose license changed |
| [refactoring](./skills/architecture/refactoring/SKILL.md) | Small verified steps, typed errors, a functional core, design principles as moves, dependency direction |
| [algorithm-patterns](./skills/architecture/algorithm-patterns/SKILL.md) | Recognizing the problem's shape: hash maps, windows, prefix sums, graphs, dynamic programming, budgets |
| [testing](./skills/architecture/testing/SKILL.md) | Tests that catch real bugs, integration tests with real Postgres, architecture and contract tests |

## Frontend

| Skill | Covers |
|---|---|
| [ui-animation](./skills/frontend/ui-animation/SKILL.md) | Website and app animation: durations, curves, springs, staggers, enter and exit, shared elements, gestures, scroll, galleries, smooth performance, reduced motion |

## Licences

Code copied from other projects keeps its licence file beside the copy (`LICENSE-*.txt` in the folder that holds it, and `skills/videos/seek-engine/templates/isokit/LICENSE`).
