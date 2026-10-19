# Building from a design file

Turning a Figma file or a design image into code that matches it: read the design at its source, build with the project's own tokens and components, compare the result element by element, and report. It is Jakub Krehel's `build-design` skill (jakubkrehel/skills: SKILL.md and figma.md), with its Figma tool list brought up to date against the [Figma MCP server's tools page](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/). It is the procedure behind this skill's pointer to "Figma MCP (connects designs to code)" ([SKILL.md](SKILL.md#1-direction-first)). In the owner's app, states the design does not draw come from [app-ui STATES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/STATES.md) ([step 3](#3-build-only-what-the-design-shows)).

**Contents:** [The design decides](#the-design-decides) · [1. Read the design at its source](#1-read-the-design-at-its-source) · [Reading a Figma file](#reading-a-figma-file) · [2. Map the design onto the project](#2-map-the-design-onto-the-project) · [3. Build only what the design shows](#3-build-only-what-the-design-shows) · [4. Compare against the design](#4-compare-against-the-design) · [5. Report and stop](#5-report-and-stop) · [Before you finish](#before-you-finish) · [Prove it](#prove-it)

## The design decides

[Jakub Krehel, build-design] "The design decides. Values come from the design file, never from your taste or a pattern you liked elsewhere. A change the design does not show is a deviation, and a deviation is the user's call."

**Domain conflicts, both ways.** The source "owns no domain rules. Where the design breaks one, build it as designed and report the conflict with its owner", so a contrast or focus failure is built as drawn and reported, never fixed silently. This skill's absolutes say contrast and keyboard focus are not optional ([SKILL.md](SKILL.md#3-absolute-no-purpose-excuses-these)), and app-ui changes a value "on purpose, in the token, never on one screen" ([app-ui SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/SKILL.md)). Both agree on no one-screen override. Here the absolutes stand: report the conflict under **Domain conflicts** and ask before shipping a failing pair.

## 1. Read the design at its source

[Jakub Krehel, build-design]
- "A Figma link means the Figma MCP. Search the available and deferred tools for `figma` before saying it is unavailable, since the server often sits under a name you did not expect."
- "A server that lists only an authenticate tool is connected but signed out, so ask the user to authenticate."
- "With no Figma tool at all, ask the user to connect one, and do not build from memory or guesswork meanwhile."
- "A screenshot or exported image has no values to read. Sizes are ratios to the capture, so state the scale you assumed and treat every measurement as an estimate. Ask for the Figma link when one exists, since it replaces the whole estimate." This skill prefers a reference in code the same way ([SKILL.md](SKILL.md#1-direction-first)).
- "Scope the run to the frames named. Frames that show the same thing at different widths are one piece at several breakpoints, not separate pieces."
- "This step is done when you hold a screenshot of every frame in scope and its values for spacing, size, radius, color, type and the components used. From a Figma file they are exact. From an image they are estimates at the scale you stated."

## Reading a Figma file

### From link to node

[Jakub Krehel, build-design, figma.md] "A Figma URL carries the file key after `/design/` or `/file/` and the node in `node-id`. On a branch URL, `/design/<fileKey>/branch/<branchKey>/`, pass the branch key as the file key. The URL writes the node as `1-2`, and the tools take it as `1:2`." Figma's tools page does not state the branch key or the `1-2` to `1:2` handling. "A link with no `node-id` points at no frame in particular, so list the frames with `get_metadata` and confirm which ones ship before reading any of them." The docs confirm: "Without a node ID, `get_metadata` returns a list of the file's top-level pages." On the remote server a link is required: "Prompting with your current selection only works with the desktop server. With the remote server, include a link to a frame or layer in your prompt."

### The calls

The source's four tools, plus the ones its figma.md misses, as Figma's [tools page](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/) describes them:

| Tool | Gives you (the docs) | Use it for |
| --- | --- | --- |
| `get_design_context` | "Gets the design context for a layer or selection in Figma. By default, the output is React and Tailwind, but you can ask for a different framework in your prompt." | Every frame in scope, one call each (the source) |
| `get_metadata` | "a lightweight XML outline of your selection with basic properties only: layer IDs, names, types, positions, and sizes" | "very large designs, where `get_design_context` returns too much at once"; calling `get_design_context` "on only the parts it needs" |
| `get_variable_defs` | "the variables and styles used in your selection, such as colors, spacing, and typography" | Mapping design variables onto project tokens |
| `get_screenshot` | "a screenshot of your selection so your agent can see the design"; PNG only, one node per call, "URL, or inline base64 with `enableBase64Response`" | The comparison target |
| `download_assets` | Assets "for up to 20 nodes per call", as "temporary URLs your agent uses to fetch the files": export renders (the node's export settings, otherwise `defaultFormat` and `defaultScale`, "0.01x to 4x"; "Without export settings, renders at 1x are capped at about 4,096 px on the longest edge"; PNG, JPG, SVG or PDF) and raw source images, "up to 20 images per call. If there are more, the response includes `rawImagesTruncated: true`"; remote server only | Saving the build's assets into the project |
| `get_motion_context` | "animation data for an animated node so your agent can recreate the motion in code": animated nodes, "Keyframe tracks with easing curves", "Ready-to-use CSS `@keyframes` and Motion code snippets" and "Hints about which nodes animate together" | "Use `get_motion_context` after `get_design_context` when a design includes animation, using the same node ID"; `recursive: true` covers "every animated layer inside the selection in one call". Map its curves and durations through [ui-animation](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md) |
| `get_code_connect_map` | "the Code Connect mappings for the instances in your selection" (`componentName`, `source`, snippets, `label`); "With the remote server, your agent can use `clientFrameworks` and `clientLanguages` to choose which mappings are returned" | Picking the exact project component |
| `search_design_system`, `get_libraries` | "components, variables, and styles that match a text query" across "all connected libraries"; the file's libraries "already added to the file, and libraries you can add" (both remote only) | Finding an existing design-system piece before building one |

- The docs: "Use `get_screenshot` when your agent needs to see a design. Use `download_assets` when your agent needs to deliver an asset, export in a specific format, or move images between files." The source puts asset downloads inside `get_design_context`; the current server has `download_assets` for that.
- Two of the source's lines are not on Figma's page, so treat them as the author's experience: "Request the screenshot in the same `get_design_context` call", and "A design context flagged as sparse is a summary, not values. Read the visible children it names, in parallel, and build from those answers."
- "The code it returns is a reference ... Translate it through **Map the design onto the project** and never paste it." [Jakub Krehel, build-design, figma.md] "Where a Figma skill ships with the server, load it before the first call and follow its calling rules."

### What to trust

[Jakub Krehel, build-design, figma.md]
- "**Variable names over raw values.** A fill bound to `gray/600` maps to the project's `gray-600` even where the hex drifted. A raw hex with no variable goes through the mapping table."
- "**Code Connect over name matching.** A node with a Code Connect mapping names the exact component and props. Use that component unless it cannot express the design, and report the case where it cannot."
- "**Auto layout over absolute positions.** Gap and padding on an auto layout frame are the spacing intent. Absolute x and y on a free-floating layer are where someone dropped it."
- "**Downloaded assets over Figma URLs.** Asset URLs from the server expire. Save each asset into the project the way the design context says, and leave no Figma URL in code." The docs call them "temporary URLs" and give no expiry time.
- "The screenshot is the target you compare against. It is never an asset in the build."

## 2. Map the design onto the project

[Jakub Krehel, build-design] "Read the project's tokens and component library before writing anything. Then map every design value to what exists:"

| In the design | In code |
| --- | --- |
| A bound variable or style | The token with the same name or the same value |
| A raw value that equals a token | That token |
| A raw value with no token | The nearest existing token, listed in the report as rounded |
| A component instance | The project's component of that name, with the variant the design shows |
| A component instance with no project equivalent | Plain markup in place, listed as a deviation, and ask whether a component should exist |
| A one-off group of layers | Plain markup in place, not a new component |

- **The stop-and-ask threshold:** "Never add a token, a component variant or an arbitrary value to hit a number. Stop and ask which way to go when rounding would visibly change the design. That means more than 2px on spacing or size, or a color landing on a different step." In the owner's app the checker enforces the no-arbitrary-value half: `rule/raw-value` names "the nearest one by color distance" and `rule/arbitrary-value` wants "a scale step" ([app-ui CHECKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CHECKS.md)).
- "Check what data the design needs and wire it to what exists. Where the backend for part of it does not exist yet, build that part as UI fed by props and name it in the report as unwired."

## 3. Build only what the design shows

[Jakub Krehel, build-design]
- "Implement the frames, the breakpoints the frames define and the states the file draws, such as hover, empty or error. A state the file does not draw is not yours to design. Leave it to the existing component's default and list it as missing."
- "Leave everything around the piece as it was. No neighbouring copy edits, no icon swaps, no 'while I was here' cleanups. A diff wider than the design is the most common way this goes wrong."

**Missing states in the owner's app.** There the "existing component's default" is what [app-ui STATES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/STATES.md) prescribes: pending, empty, filtered and error states such as "Keep the last list on screen while the next one loads" and "Empty states sit on a card". Build those from STATES.md, never strip a pending, empty or error branch app-ui requires because the design did not draw it, and still list each one under **Missing states** so the designer sees it. The source's "Remove it, keep the default" ([Before you finish](#before-you-finish)) means remove an invented branch, not one STATES.md defines.

## 4. Compare against the design

[Jakub Krehel, build-design]
- "Render the build at each frame's width beside the design screenshot and walk it element by element. Compare the properties **Read the design at its source** collected. 'Gap is 12px, design is 16px' is a finding. 'Feels a bit tight' is not."
- "With a browser at hand, screenshot each width and compare. Without one, hand over the local URL with the widths to check and say the comparison is unverified. Do not report a match you did not look at."
- "Fix every mismatch you caused, then compare again. This step is done when every remaining difference is a rounding or a question."

## 5. Report and stop

[Jakub Krehel, build-design]

| Element | Design | Built | Status |
| --- | --- | --- | --- |
| Card padding | 20px | `p-5` | Matches |
| Title size | 15px | `text-sm`, 14px | Rounded to token |
| Badge | Filled pill | Text label | Deviates, asked: no badge component exists |

"Then list, one line each, and omit a list with nothing in it:"
- "**Unwired.** What renders from props until the backend exists."
- "**Missing states.** What the design does not draw."
- "**Domain conflicts.** Where the design breaks a rule, with the owning skill."

"Close by saying where the build is running and at which widths you compared."

## Before you finish

[Jakub Krehel, build-design]

| You notice | Fix |
| --- | --- |
| "Figma isn't connected" written before any tool search | Search the tools for `figma` first |
| Values in code that appear in no Figma response, only in the screenshot | Read them from the design context |
| An arbitrary utility such as `w-[343px]` or a raw hex in the diff | Map it to a token, or ask if rounding shows |
| A new file under the components directory for a frame that is not a component | Inline it as plain markup |
| A loading or error branch the design never drew | Remove it, keep the default and list it as missing (in the owner's app, the default is [app-ui STATES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/STATES.md)) |
| Files in the diff that no frame touches | Revert them |
| A contrast or focus change the design does not show | Restore the design and report the conflict with its owner |
| A comparison claimed with no screenshot of the build | Render each frame width, or say it is unverified |
| Hard-coded sample data with no mention in the report | List it under **Unwired** |

## Prove it

Every frame in scope has a screenshot and values from a Figma response, or an image with its stated scale. The diff holds no raw hex or arbitrary value and touches only files a frame needs. Each frame width is rendered beside its screenshot and every difference left is listed as rounded, deviating or asked. The report table, the **Unwired**, **Missing states** and **Domain conflicts** lines, and the widths compared are all present.
