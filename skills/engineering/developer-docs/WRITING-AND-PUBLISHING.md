# Developer docs

Tutorials, how-tos, reference, framework guides, styling recipes and demos: pages a developer reads mid-task and an agent retrieves one section at a time. Two primary sources: Vercel's [Writing Guidelines](https://github.com/vercel-labs/writing-guidelines) (MIT), the writing rules, tagged [Vercel, writing-guidelines]; and c15t's `writing-docs` skill ([c15t/c15t](https://github.com/c15t/c15t), Apache-2.0), the method for a docs site whose code, navigation and agent outputs are generated and checked, tagged [c15t, writing-docs]. FixMySlop's docs rules add manifest and local-link checks, tagged [MrSpideyNihal/FixMySlop, fixmyslop/core/slop/rules_docs.py]. Vendor tooling (Vercel's `meta.*` fields and `<Steps/>`, c15t's scripts and leadtype components) is left out. The prose pass is still [anti-slop-writing TELLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/TELLS.md) and [anti-slop-writing CHECK.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/CHECK.md); where these sources disagree with them, both views are stated and marked.

**Contents:** [Plan the page](#plan-the-page) · [Tone by content type](#tone-by-content-type) · [Voice](#voice) · [Open with the answer](#open-with-the-answer) · [Frontmatter for search and agents](#frontmatter-for-search-and-agents) · [Headings and structure](#headings-and-structure) · [Lists](#lists) · [Code comes from code CI checks](#code-comes-from-code-ci-checks) · [Snippets on the page](#snippets-on-the-page) · [Placeholders](#placeholders) · [Units, emphasis and punctuation](#units-emphasis-and-punctuation) · [Claims match the source](#claims-match-the-source) · [Show customization](#show-customization) · [Demos and previews](#demos-and-previews) · [Navigation and coverage](#navigation-and-coverage) · [Moving and removing pages](#moving-and-removing-pages) · [Writing with a model](#writing-with-a-model) · [Check the generated output](#check-the-generated-output) · [Quality checklist](#quality-checklist) · [Prove it](#prove-it)

## Plan the page

[Vercel, writing-guidelines]
- "Every page has a plan (overview, goal, audience, content plan, open questions) referenced or linked".
- One content type per page: Tutorial, How-to, Reference, Conceptual, Troubleshooting or Landing. "Page does one job: tutorial OR how-to OR reference, not three at once".
- "Title is user-shaped (the user's question), not feature-shaped (the engineer's name)".
- "Goal is verb-driven (Bloom's taxonomy): 'configure', 'explain', 'debug' (testable)".
- "Multi-audience pages: short shared opener, then technical subsections". For marketing pages [anti-slop-copy PAGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/PAGES.md#know-which-reader-youre-talking-to) says the opposite, "split the page or the path"; docs keep one page per task.

Establish the contract before writing [c15t, writing-docs]:
1. "Identify the reader's task, framework, router and deployment." Variants of one framework need their own instructions: "Next.js App Router, Pages Router and static export need different instructions. Vue and Nuxt, and Svelte and SvelteKit, also need distinct setup paths."
2. Source is the truth: "Check the current package exports, implementation and relevant tests." The released site and main branch are for finding omitted topics, never for establishing the new version's APIs. "Examples can lag behind source too. Verify their imports before reusing them." "Never document proposed automatic defaults before they exist in source."
3. "Write down the result, prerequisites, defaults and failure cases. A page should let someone implement and verify a task without guessing missing files."
4. One canonical page per distinct task. Put shared explanations in one place and reuse them through includes or links. "Do not clone a React guide and replace its framework name."

Check documented npm, pnpm, yarn and bun run-script names against the actual manifest, and relative links and images against their destinations. A source scanner can catch missing local files but skips anchors and some docs-site routes; retain the docs host's own link checks. [MrSpideyNihal/FixMySlop, fixmyslop/core/slop/rules_docs.py]

The [Diataxis view](https://diataxis.fr/) names four reader needs: learning through a tutorial, completing a task with a how-to, looking up reference and understanding an explanation. Use this as a planning distinction under the existing one-job-per-page rule, rather than combining a lesson, a procedure and exhaustive reference in one document. [bgauryy/octocode, octocode-documentation/references/diataxis.md]

Decision records belong with [the architecture glossary and ADRs](https://github.com/Quegenx/agent-skills/blob/main/skills/architecture/domain-modeling/GLOSSARY-AND-ADRS.md); RFC and live implementation-status audits belong with [engineering planning](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/engineering-planning/RFC.md). Link those records from agent-facing instructions when the same decision would otherwise be reopened. [bgauryy/octocode, octocode-documentation/references/adr.md]

## Tone by content type

[Vercel, writing-guidelines]

| Type | Tone |
|---|---|
| Tutorial | "warm, encouraging, predictable structure, no traps" |
| How-to | "terse, direct (reader is mid-task)" |
| Reference | "neutral, exhaustive, quotable" |
| Conceptual | "explain like the reader will teach it back; examples and analogies welcome" |
| Troubleshooting | "empathetic but not apologetic; acknowledge then fix" |

The interface-text analogue is "tone by stakes" in [anti-slop-copy MICROCOPY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/MICROCOPY.md#rules).

## Voice

[Vercel, writing-guidelines]
- Active voice, with the "by monkeys" test ([anti-slop-writing TELLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/TELLS.md#1-structure-the-worst-offenders), Actorless passive).
- `you`, "never `the user` or `one can`".
- "Imperative for steps: 'Click **Add Project**', not 'You will need to click **Add Project**'".
- "Contractions encouraged (`you'll`, `it's`) for warmth".
- "Present tense unless describing future behavior".
- `we` only for deliberate company actions ("we recommend", "we deprecated"), "never as a stand-in for 'you'".
- "No rhetorical questions (sounds like marketing)".
- "Sentences under 20 words target". The other view: TELLS.md counts uniform sentence length as a tell ([Uniform rhythm](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/TELLS.md#1-structure-the-worst-offenders)), so treat 20 words as a ceiling for docs, not a length to hit every time.
- The second-read test: [anti-slop-writing CHECK.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/CHECK.md) item 13.
- `easy`, `simple` and `quick` are banned ([anti-slop-writing TELLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/TELLS.md#3-vocabulary)); weasel words and vague quantifiers become figures ([anti-slop-writing TELLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/TELLS.md#4-honesty)).
- "Earn every detail: cut a number, name, or implementation detail if a more general phrasing wouldn't change the reader's understanding or action". This pulls against "Concrete over abstract" in [anti-slop-writing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/SKILL.md#editing-principles); both hold: keep the detail the reader acts on, cut the one that changes nothing.

## Open with the answer

- "Every page opens with a one-paragraph TL;DR of what the page covers"; "Every major section opens with a summary sentence" [Vercel, writing-guidelines].
- "Lead each page with the answer and its deployment constraints. Use familiar navigation labels" ("Quickstart"). "Put framework and deployment context in the description and opening text." [c15t, writing-docs]
- A short paragraph before the first H2 answers the reader's first question. "Do not copy the description into that paragraph." [c15t, writing-docs] aeo.js gives the same rule for answer engines: "Lead with a direct, self-contained answer paragraph before background context" [aeo.js]; its citability scoring is [ai-search-visibility CITABILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ai-search-visibility/CITABILITY.md).

## Frontmatter for search and agents

[c15t, writing-docs]
- Required `title` and `description`. The page shows `title` as its heading and in navigation; `description` is not shown on the page, but "docs search, `llms.txt`, agents and link cards use it", so write it for them.
- Optional `seoTitle` and `seoDescription` "when searchers use different words from the navigation label"; search results and social cards show them in place of `title` and `description`. c15t's house limits (no standard sets them): `seoTitle` is "the complete title", product name included, "in 60 characters or fewer; the site adds no suffix"; `seoDescription` "160 characters or fewer, lead with what the reader gets, and make it unique to the page. Both must match what the page and the source show." aeo.js audits a title of 10 to 70 and a description of 50 to 200 characters [aeo.js], another house range. Google sets none: "there's no limit on how long a `<title>` element can be", it is "truncated in Google Search results as needed, typically to fit the device width" ([title links](https://developers.google.com/search/docs/appearance/title-link)), and "There's no limit on how long a meta description can be" ([snippets](https://developers.google.com/search/docs/appearance/snippet)).
- "`llms.txt`, page Markdown and package bundles serve agents. They do not promise search rankings or citations. The docs host must also verify HTML indexing, canonical URLs, redirects, sitemap entries, robots rules and matching structured data. Content work alone cannot prove those deployed behaviors." Google Search goes further on the first part: on llms.txt, "Google Search ignores them" ([AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide); more in [ai-search-visibility LLMS-TXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ai-search-visibility/LLMS-TXT.md)). Serving a page's Markdown copy (content negotiation or a `Link` header) is in [ai-search-visibility AGENT-READINESS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ai-search-visibility/AGENT-READINESS.md). To verify indexing, URL Inspection reports only Google's indexed copy: "you cannot test the indexability of a live URL" ([urlInspection.index.inspect](https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect); [search-console API.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/search-console/API.md#url-inspection)), so pair it with a live fetch of the page.

## Headings and structure

- **Case** [Vercel, writing-guidelines]: "Sentence case for page headings (`H1` `H2` `H3`): 'Configure environment variables', not 'Configure Environment Variables'"; "Title case for nav labels: 'Configuring Environment Variables'". Vercel's interface guidelines say the opposite for headings and buttons, "Title Case for headings/buttons (Chicago style)" [Vercel, web-design-guidelines]. This repo keeps sentence case for headings ([anti-slop-writing TELLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/TELLS.md#5-formatting), [anti-slop-copy MICROCOPY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/MICROCOPY.md#rules)); title-case nav labels fit its "one capitalization rule per element type".
- **Task headings** readers would search for. "Question headings help when the section answers a question; do not force every heading into a question." [c15t, writing-docs] Subheadings are descriptive, not cute: "Caveats when self-hosting on Cloudflare", not "Caveats"; never a single generic word (`Overview`, `Caveats`, `Notes`) [Vercel, writing-guidelines].
- **Sections survive retrieval alone.** "Keep each explanation understandable when retrieved alone. Name the API, framework and condition rather than referring to 'the above'." [c15t, writing-docs]
- **Terms** [Vercel, writing-guidelines]: "Acronyms spelled out on first use: 'Content Security Policy (CSP) blocks inline scripts'"; "Define every term the first time you use it (link to its conceptual page)".
- **Organize** "Reference docs organized by surface; education docs organized by reader task" [Vercel, writing-guidelines].
- **Paragraphs** of 2 to 4 sentences; "split anything longer or covering two ideas" [Vercel, writing-guidelines]. Vary within that range: TELLS.md flags every paragraph built the same way.
- **What types can't say.** "Document ordering, side effects and failure behavior that types cannot explain. Keep concise API reference tables where humans need discovery; do not delete useful reference because an agent could inspect a declaration file." [c15t, writing-docs]
- **One path first.** "Prefer one working path followed by links to alternatives." For each mode, name what it requires (a backend URL, configuration, a trusted origin) or what is absent (where choices persist, which backend services are missing) [c15t, writing-docs]. Vercel's checklist: "simplest path recommended when multiple exist".
- **Pricing pages** [Vercel, writing-guidelines]: "Uncompromising detail: err on 'too much'"; "Use tables for pricing"; "Never assume reader knows the pricing model or whether their workload counts as one invocation or several". A Markdown pricing file for agents is in [ai-search-visibility AGENT-READINESS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ai-search-visibility/AGENT-READINESS.md#a-pricing-file-for-agents).

## Lists

[Vercel, writing-guidelines]
- "Three or more list-shaped items in a paragraph: convert to a list". The other view: TELLS.md writes prose where two sentences read better than bullets ([Formatting](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/TELLS.md#5-formatting)). In docs, list steps, options and requirements; keep reasoning in prose.
- "Bulleted for unordered; numbered for ordered (lifecycles, sequential steps)".
- "Always introduce a list with a colon".
- "No periods at the end of list items unless they are full sentences".
- "Bold/description format: `- **Term**: description here`". TELLS.md bans only the inline header that restates its item ("**Performance:** loads faster"); a term with a real description is fine.

## Code comes from code CI checks

[c15t, writing-docs] "Code that wires c15t into an app comes from marked regions in code CI builds or type-checks. Do not hand-write a provider, layout, route handler or config file in MDX. Hand-written snippets drift: one Next.js page passed a `defineConsentConfig()` result from a server layout to `ConsentRoot`, which React cannot serialize." Dart's `{@example}` is the same method for doc comments ([dart STYLE-AND-DOCS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/dart/STYLE-AND-DOCS.md#code-examples-from-files-example)).

- **Pick the source by what the snippet is.** Setup that a quickstart shows comes from a starter app per framework; "Starters are smoke-tested in CI and hold no test code, so never add hide markers or test helpers to them." Feature code comes from a snippet package "which CI type-checks. Hide markers are allowed there only for type-check scaffolding the reader does not need." Test fixture apps "publish nothing".
- **Region names are unique** across every source, because all of them publish into one folder.
- **The procedure:** find or add the starter or snippet (it must pass its type check); mark the lines with `#region docs:<name>` and `#endregion docs:<name>`; "New files must be tracked or intent-added (`git add -N`) before you sync, since the sync only reads tracked files"; run the sync; include the generated file from the page.
- **A ratchet for old hand-written code.** A fence that is deliberately a fragment (one changed prop) carries `{/* example: fragment */}` on the line before it. A baseline file counts the older hand-written fences "and may only fall".

## Snippets on the page

- "Include imports, file paths and setup in copyable examples. Label partial examples and name where they belong. Separate server and browser files. Explain what the reader should observe after running the code." [c15t, writing-docs]
- Install commands use the real package name and its real exports: "The installed package name is `c15t`, not the import subpath"; install with "bare c15t package names, with no dist-tag" (a test enforces it). "Never invent an umbrella subpath or mechanically replace provider names across adapters. Migration pages may show old APIs only in clearly labelled before examples." [c15t, writing-docs]

[Vercel, writing-guidelines]
- "Code blocks need a language tag for syntax highlighting".
- "TypeScript is the default for new code unless the surface is genuinely language-agnostic".
- "Highlight load-bearing lines: `` ```typescript {8-12,23-37} ``".
- "≤80 columns per line in snippets"; "≤25 lines per snippet; split longer blocks with prose".
- "Omit defaults; don't repeat variable definitions, use shared var".
- "Minimal comments in code blocks; prefer prose explanation", and "Explain what every code block does in prose (don't drop and run)".
- "Don't reference full example files at the end of guides ('See `train.py`'); the guide is the deliverable".
- "Always use the latest model strings"; "Outdated model strings in examples" are an anti-pattern. (Vercel's rule names specific ids, left out here; check the provider's current list.)
- Dates and numbers in samples go through `Intl.DateTimeFormat` and `Intl.NumberFormat`, not hard-coded formats ([anti-slop-copy MICROCOPY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/MICROCOPY.md#build-strings-whole-for-every-language)).

## Placeholders

- "Text placeholders: `snake_case`, descriptive: `your_access_token_here` (so reader can double-click to select before pasting)" [Vercel, writing-guidelines].
- "Number placeholders: count up `1234567890123` (recognizable as fake, predictable)" [Vercel, writing-guidelines].
- "Never `<TOKEN>`, `xxx`, `your-token`, or generic ALL_CAPS" (the anti-pattern list adds `ABC123`) [Vercel, writing-guidelines].
- A URL the reader must change is clearly replaceable (`https://your-project.inth.app`), and the page says what to replace it with; self-hosted examples use your own origin, such as `https://app.example.com/api/c15t` [c15t, writing-docs].
- A public endpoint URL "is public configuration; do not describe it as a secret" [c15t, writing-docs].

## Units, emphasis and punctuation

[Vercel, writing-guidelines]
- "Space + uppercase unit: `64 KB`, `5 KB`, `200 ms`"; "Exception: seconds is bare: `30s`"; "Consistent across the corpus so readers can develop scanning habits". (`ms` is lowercase in Vercel's own example; `Intl`'s unit output, "12 MB" in [anti-slop-copy MICROCOPY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/MICROCOPY.md#build-strings-whole-for-every-language), agrees on the space.)
- "**Bold** means UI element or critical fact, never emphasis-for-emphasis-sake"; "Reaching for bold for tone: the sentence is weak; rewrite it".
- "`Inline code` for paths, file extensions, identifiers, short snippets: `/api`, `.tsx`, `body`, `query`, `req`". "Rule: if it would look weird without a monospace font, monospace it".
- **Owner punctuation rule:** no em or en dashes anywhere in this repository; use " - ", commas or "to" [Owner writing rule]. Vercel's stricter docs view never uses em dashes "or dashes (`-`) as punctuation; use colons, commas, periods, or rephrase" [Vercel, writing-guidelines]. The old line said "TELLS.md allows one or two in long text"; that permissive old rule is retained as a disagreement in [Formatting](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/TELLS.md#5-formatting), not the active owner rule.
- "Curly quotes", "Ellipsis `…`, not three dots `...`", "Loading states end with `…`", "Non-breaking spaces in `10&nbsp;MB`, `⌘&nbsp;K`, brand names", "`&` over 'and' only where space-constrained (nav labels, buttons)".
- Source formatting: "Don't hard-wrap paragraphs: each paragraph is one line in source, let the editor wrap"; "One blank line before headings; one blank line before and after code blocks"; "No `---` horizontal rules between sections"; "No extra blank lines between elements that aren't paragraph breaks".

## Claims match the source

[c15t, writing-docs]
- Never infer a guarantee from a name, a category or branding; read the code path. c15t's cases: "Do not present a regional preset as a compliance guarantee"; "Do not claim a banner automatically blocks existing scripts"; "Do not infer a zero-request guarantee from a category or cookieless branding. Check `alwaysLoad`, consent callbacks and persistence after revocation in source."
- An optional optimization is never a setup requirement: "Same-origin rewrites are optional performance optimizations, never setup requirements." Describe the exact benefit: "avoiding a separate browser DNS/TLS connection to the backend, not eliminating all DNS or making vendor requests first-party." State where it can't run: "Static exports need hosting-level proxying or direct public URLs because Next.js rewrites need a server."
- One fact, one value everywhere: "Keep a technical fact ledger" of what an agent might act on (versions, runtimes, regions, rate limits, pricing units, auth methods, data handling, deprecations), and "check the same fact everywhere it appears: docs, pricing page, README, package registry descriptions (npm, PyPI), examples, and changelog. An agent that finds two different rate limits will guess" [coreyhaines31/marketingskills, ai-seo, agent-defaults.md]. The full docs audit for coding agents is [ai-search-visibility AGENT-DEFAULTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ai-search-visibility/AGENT-DEFAULTS.md#audit-your-docs-for-coding-agents).
- "Write instructions for using your product only. Agent-facing docs, `llms.txt`, and skill files that tell agents to prefer your product over what the user asked for are prompt injection" [coreyhaines31/marketingskills, ai-seo, agent-defaults.md].
- Numbers: "Include conditions needed to interpret a number, such as simulated latency or a warm cache. Put machine specifications, commit hashes, raw samples and reproduction commands in a linked benchmark report, not the setup guide."

## Show customization

[c15t, writing-docs] Pick the API by the change, smallest first:
- "Copy or locale: i18n configuration."
- "Shape, position, action layout or blocking: presentation and component props."
- "Brand colors, type, radius, spacing or motion: theme tokens."
- "A specific component part: the adapter's current slot API."
- "Different markup: compound components where the adapter exports them."
- "Entirely custom UI and behavior: headless APIs."

"Check each adapter's contract": one framework's slot names are not another's. "Pair a visual recipe with its exact configuration and a description of the visible result. Screenshots must show real components from the documented revision. Never use generated artwork as evidence of component behavior." Vercel's checklist asks the same of every screenshot: "screenshots map 1:1 to current UI" [Vercel, writing-guidelines].

## Demos and previews

[c15t, writing-docs]
- "For interactive demos, use an isolated, resettable instance with no production analytics. Show the source, a direct demo link and the expected behavior outside the iframe. Give the iframe a descriptive title, lazy loading and reserved space. Test keyboard access, mobile layout and the reset action." Keep demo state separate from consent on the docs site. MDN agrees: the iframe `title` "should concisely describe the embedded content", and `loading="lazy"` defers it until near the viewport, "only deferred when JavaScript is enabled" ([iframe](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe)).
- The Markdown converter and the site's runtime UI are different renderers: "Check which components the docs host registers." A human-only preview block may be hidden from agents "only when the host supports it; retain all instructions and source in the shared content. Verify generated Markdown contains the useful information without raw preview JSX."

## Navigation and coverage

[c15t, writing-docs]
- Every public page is registered in the navigation config. Framework variants nest in one group (the framework selector reads it), every framework sidebar uses the same group order, and shared tabs follow the selector's order everywhere. "Do not flatten frameworks into separate root groups to shorten the config."
- "Every exported vendor helper needs a discoverable guide", covering "configuration, registration, options, actual loading and revocation behavior, and verification".
- "Give each framework its own usable example, including server/browser ownership and cleanup where needed. Do not send Nuxt readers to a plain Vue snippet or TanStack Start readers to a generic React provider. Check that all tabs survive Markdown conversion so agents receive the same framework coverage."
- "Avoid thin framework duplicates, keyword repetition and unsupported comparisons. Use factual titles, unique descriptions and descriptive link text." Link text: [anti-slop-copy MICROCOPY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/MICROCOPY.md#rules), "Links say where they go".

## Moving and removing pages

[c15t, writing-docs] "Preserve useful existing URLs. When a page moves, configure a redirect in the docs host and update internal links. Record retired URLs and their replacements before deleting old routes." c15t keeps the record as two tables in a reference file.

Google's site-move guide on the redirects: use "HTTP permanent redirects if possible, such as 301 and 308", point each old URL straight at its final destination, and keep them "generally at least 1 year" ([site move](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes)). A whole-site move is [site-architecture PLATFORMS-AND-MIGRATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/site-architecture/PLATFORMS-AND-MIGRATION.md).

**Moved routes.** "The docs host owns the redirects; add each row there with a permanent redirect. Every destination here covers the old page's task."

| Old route | New route | Reason |
| --- | --- | --- |

Reasons are short and typed, as in c15t's file: "Moved to Concepts", "Identical per-framework copies merged", "Merged into the setup decision page", "Single page, no index folder", "Named after the v3 component, `ConsentRoot`", "Split into its own page".

**Removed routes.** "These pages were removed, not moved, so no page covers their whole task. Redirect each route to the closest page that remains." Same columns, with "Redirect to" in place of "New route".

- **Unshipped packages.** c15t removed its React Native pages, redirected each to the framework list, and wrote: "Do not mention React Native, Expo or `@c15t/react-native` in the published docs until the package ships."
- **Anchors.** A section split into its own page is a route move the server can't redirect: "anchor links cannot redirect server-side". To keep old anchors working, "Keep the target free of a fragment so browsers carry over the old" anchors. RFC 9110: "If the Location value provided in a 3xx (Redirection) response does not have a fragment component, a user agent MUST process the redirection as if the value inherits the fragment component of the URI reference used to generate the target URI (i.e., the redirection inherits the original reference's fragment, if any)" ([§10.2.2](https://www.rfc-editor.org/rfc/rfc9110.html#section-10.2.2)).
- **A route that comes back.** When a split makes an old route live again, "drop any old" redirect from it.

## Writing with a model

[Vercel, writing-guidelines]
- "You are accountable for the content you produce, however it is created"; "the model proposes, you dispose"; "Final human review always".
- "Hold technical accuracy to a high standard: docs are also consumed by LLMs, wrong docs train wrong models".
- "Use only enterprise models that do not train on your data (especially for unreleased products)".
- "Plan first by hand; the plan is the spec the model works against". Use plan mode before letting the model write, and "Tell the model to follow `AGENTS.md` and the linting checklist".
- "Run a test prompt against the preview: 'given this plan's goal, can the model complete the task using only this page?'"
- "Disclose AI use in the PR (model + prompts if useful)".
- Review: the PR "links to the content plan, lists what to review, and links the preview URL"; "Author is accountable, not the reviewer; reviewers are liberal with approvals"; "Suggestion comments for small text fixes; preview comments for anything bigger"; "Disagreement is fine; reject with a one-line reason and move on".

## Check the generated output

[c15t, writing-docs]
- Formatters and linters that rewrite files: "inspect the diff for unrelated edits".
- Link, metadata and conversion lint: "Inspect the installed CLI help before adding flags." When the lint tool has a known false positive, the workaround handles only that case "while still checking that each destination exists. Do not suppress cross-framework errors in actual framework guides."
- Generated files are regenerated, never edited: "Never edit generated `packages/*/docs`, `AGENTS.md` or `SKILL.md`."
- "Read a generated quickstart, styling recipe and page with visual content. Check that imports, prerequisites, links and demo explanations survived."
- "Record which examples were compiled, exercised in a browser, or only checked against source." "If the private host is unavailable, report that limit rather than claiming the site or embedded previews were verified."
- "Evaluate usefulness with concrete tasks" named per variant and edge path (c15t's: "set up Pages Router SSR, export a static Next.js site, install plain Vue without Nuxt", "change a banner's radius without going headless"). "A lint score does not establish that an agent can complete those tasks." Running agents against the docs is [agent-dx-audit](https://github.com/Quegenx/agent-skills/blob/main/skills/agent-workflows/agent-dx-audit/ONBOARDING-AUDIT.md).

## Quality checklist

[Vercel, writing-guidelines], the parts that aren't Vercel tooling:
- **Findability:** the UI links to the docs "from any dashboard surface that exposes the feature".
- **Accuracy:** "code samples actually run; screenshots map 1:1 to current UI".
- **Clarity:** the overview "addresses who/what/where/why"; "quickstart for new products"; "prerequisites listed on tutorials"; "steps detailed not vague"; "visual aids in confusing sections"; "simplest path recommended when multiple exist".
- **Completeness:** "limits documented"; "content plan followed and goals addressed".
- **Readability:** "nav names scannable and use action verbs"; "content types accurately used"; "subheadings descriptive"; "topics start with summaries".

Vercel's review output, one line per finding, grouped by file: `file:line - issue`, with `"..." → "…"` for a fix, and `✓ pass` for a clean file. "State issue + location. Skip explanation unless fix is non-obvious. No preamble."

## Prove it

- The page names its content type and its reader's task, and its title is the reader's question.
- Every snippet that wires the product into an app comes from a CI-checked region; no hand-written provider, layout, route handler or config.
- Each section read alone names its API, framework and condition.
- No placeholder matches `<TOKEN>`, `xxx`, `your-token` or `ABC123`; no code fence lacks a language tag; no snippet runs past 25 lines without prose.
- Every moved or removed route has a row and a permanent redirect, and no redirect target carries a fragment that would drop the old anchor.
- The generated Markdown was read, and the report says which examples were compiled, run in a browser, or only checked against source.
- The prose passed [anti-slop-writing CHECK.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/CHECK.md).
