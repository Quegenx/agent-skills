---
name: developer-docs
description: "Writes and maintains developer documentation: task-focused tutorials, how-tos and reference, source-checked snippets, customization guides, demos, navigation, redirects and generated agent output. Use when writing or reviewing developer docs, documenting an SDK or framework setup, or maintaining a documentation site."
---

# Developer documentation

This skill uses Vercel's Writing Guidelines and c15t's `writing-docs`, with the existing FixMySlop manifest/link checks, Octocode reader-task distinctions and source corrections retained in [WRITING-AND-PUBLISHING.md](WRITING-AND-PUBLISHING.md). It owns the documentation workflow; prose editing and AI-writing-pattern detection stay in [anti-slop-writing](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/SKILL.md), and attempted onboarding audits stay in [agent-dx-audit](https://github.com/Quegenx/agent-skills/blob/main/skills/agent-workflows/agent-dx-audit/SKILL.md). [Vercel, writing-guidelines; c15t, writing-docs; MrSpideyNihal/FixMySlop, fixmyslop/core/slop/rules_docs.py; bgauryy/octocode, octocode-documentation]

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Select this skill, its boundaries and required evidence | [SKILL.md](SKILL.md) |
| Plan a reader task, write the page, source its examples, document customization, maintain navigation and redirects, and inspect generated output | [WRITING-AND-PUBLISHING.md](WRITING-AND-PUBLISHING.md) |

## The rules

1. **Give each page one reader task and content type.** Establish the result, framework, router, deployment, prerequisites and failure cases before writing; keep shared explanations canonical. [Vercel, writing-guidelines; c15t, writing-docs; bgauryy/octocode, octocode-documentation/references/diataxis.md]
2. **Read the current source before describing the API.** Verify exports and examples; source wiring snippets from code that CI builds or type-checks. Label fragments and preserve the distinction between generated docs and their editable sources. [c15t, writing-docs]
3. **Make each retrieved section usable alone.** Lead with the answer, name the API and conditions, and include the imports, paths, setup and expected result needed to use a snippet. [Vercel, writing-guidelines; c15t, writing-docs]
4. **Document the actual customization and deployment contract.** Check each adapter, show real components from the documented revision, and keep demos isolated and resettable. [c15t, writing-docs]
5. **Maintain the published paths and generated output.** Register public pages, record moved or removed routes and their redirects, inspect generated Markdown, and report what was compiled, exercised in a browser or checked only against source. [c15t, writing-docs]

## Prove it

The page identifies its reader task and content type; wiring snippets come from checked source regions; examples and screenshots match the documented revision; each moved or removed route has its replacement recorded; and the report states what was verified and what remained unavailable. Run the topic's [Prove it](WRITING-AND-PUBLISHING.md#prove-it) and the prose [check](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/CHECK.md). [Vercel, writing-guidelines; c15t, writing-docs]
