# SEO reports

How every SEO workflow here hands over its result: one self-contained HTML page with the verdict first, and a chat reply that only points at it. The rules and the starter template are every-app/open-seo's `seo-report` skill (MIT, Copyright (c) 2026 Ben Senescu); the template is copied as [REPORT-TEMPLATE.html](REPORT-TEMPLATE.html) with OpenSEO's names and links replaced by placeholders. OpenSEO saves reports into its app with `save_report`; the HTML constraints below are what its sandboxed viewer enforces, and they keep any report portable. General prose rules are in [anti-slop-writing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/SKILL.md).

## Writing rules

[open-seo, seo-report]
- **Write notes, not essays.** A recommendation is a heading and three short bullets: **Problem** (what is true, with evidence), **Change** (the step and how it addresses the problem), **Expected effect** (what could improve, why the business cares, and the likely scale and uncertainty). Descriptive findings use the relevant subset; "do not invent a fix." "No paragraph runs past two sentences. A section opens with one sentence or none." A summary section (verdict, snapshot, market read) "is a bullet list, one fact per line, never prose."
- When the producing workflow sets its own recommendation format, use it instead (an SEO audit can use short Do this / Why lists), with the same demands for concrete actions, evidence, business benefit and honest uncertainty.
- **Make the reasoning visible.** Numbers and specific pages support observations. Explain the mechanism and expected benefit in plain language; do not replace it "with generic claims such as "builds trust."" "Distinguish measured outcomes, estimates, and hypotheses. A supported qualitative assessment is better than invented precision."
- **Be honest about confidence.** "Say which numbers came from a tool and which you verified yourself." What you could not check goes in a `.note`.
- **Plain language.** "Gloss every term of art on first use: canonical, meta description, crawler, 301, structured data. No drama words, no exclamation points, no filler."
- **One report, one spine.** Verdict and business implication first, then the material findings and worthwhile recommendations. If the research does not establish a worthwhile action, say so and give the limits. "A report with twenty findings has failed."
- **Print the numbers.** "A chart never carries a value that is not also written out in text."
- "Do not invent a number to fill a table cell. Write `unknown` and say why in a `.note`."

## Title and summary

[open-seo, seo-report]
- The title names the report type or subject and the full report date, under 120 characters, date as `MMM D, YYYY`: "Keyword Research - Sep 17, 2026" (the source separates with an em dash; this repo writes " - "). "Never a generic "SEO Report" or "Analysis"." The data coverage period goes in the body.
- Leave the website out when the report is about the project's own site (compare hostnames ignoring protocol, `www.` and a trailing slash). For another site, include its bare hostname: "Competitor Analysis: example.com - Sep 17, 2026". "Never put `https://` or a full URL in the title."
- Use the same title in the saved record, `<title>` and the visible `<h1>`.
- A markdown summary under 2,500 characters, in this order: the verdict, the leading recommendation and its expected benefit (or why no material action is established), then the key evidence. Write it "for a reader who will never open the page."

## How this report was made

[open-seo, seo-report] Every report ends with an `h2` "How this report was made" (id `how-this-report-was-made`), with "What to do next" immediately before it. Its first sentence names the workflow that produced the report and links its docs, "so a reader who was handed the link can learn what the workflow does and rerun it." Then **Tools** (which tools reported which numbers) and **Verified** (what you checked against the live site by hand). Add the sources, inputs, date and market, and call the result directional when the sample was small [open-seo, competitive-landscape]. A report written from a template keeps this section as its last one.

## HTML constraints

[open-seo, seo-report] OpenSEO's viewer enforces these; "A report that breaks them renders blank or broken."
- "No external resources of any kind." No web fonts, CDN scripts or stylesheets, images by URL or `fetch`. All CSS inline in one `<style>` block.
- Every link is `<a href="..." target="_blank" rel="noopener">`, because a plain link "would navigate the report frame itself". In-page anchors (`href="#id"`) are the exception and must not open a new tab.
- No `<script>`. Anything interactive is static.
- Charts are inline SVG or CSS bars "with real `<text>` labels and a `viewBox`", with the numbers printed beside them.
- Aim under 80 KB; the hard cap is 500,000 bytes and "A filled report is normally 10-30 KB." Inlined images are the usual way past it.
- The source avoids backticks and `${` as a JavaScript-template-literal escaping precaution for its invocation path. This file formerly called that a universal Codex/HTML restriction; current ReportService validation does not ban those literal characters. Escape for the actual transport or pass a properly structured tool argument; use `<code>` for visible inline code. [every-app/open-seo, seo-report/SKILL.md; ReportService](https://github.com/every-app/open-seo/blob/main/src/server/features/reports/services/ReportService.ts)
- Finish the document: the server rejects HTML that does not end with `</html>` as "stopped early". Keep the doctype, `<html>`, `<head>` and `<title>`.

## The template

[open-seo, seo-report] Copy [REPORT-TEMPLATE.html](REPORT-TEMPLATE.html), keep its CSS, and replace the ALL-CAPS placeholders. "Do not restyle the template per report. One look, kept good, is the point." A report template may change `--accent`, the byline and the footer, nothing else.

The starter's opening prose paragraph is an original placeholder. When filling the report, replace that placeholder with the summary bullet list required by [Writing rules](#writing-rules); it is not an exception to "one fact per line, never prose". [open-seo, seo-report; existing REPORT-TEMPLATE.html opening placeholder]

Select a saved template only when the user names it or its report kind matches the requested workflow; ask when multiple choices remain ambiguous. The source's template-selection workflow does not authorize applying an unrelated design or replacing the owner's app styles. [every-app/open-seo, seo-report/SKILL.md]

- **Light only, on purpose.** The CSS comment: the report is read inside an app with its own theme toggle, and "a report that follows the OS scheme alone shows a black panel inside a light app for anyone whose two settings disagree." That reasoning is about a report embedded in a light app; a stand-alone page follows the page's own theming rules.
- **Contents rail:** sticky beside the text on wide screens, dropped below 900px because "a contents list above the report is a wall to scroll past on a phone". Every `h2` has a kebab-case id the rail links to. The rail and article are both pinned to `grid-row:1`, or the rail "pushes the article down a whole row".
- **`h2` opens a section, `h3` names one finding.** "Do not skip levels."
- **`.note`:** one left-ruled callout for a caveat or a confidence limit, "Two or three in a report, never a row of them."
- **Tables:** five columns or fewer, the long-text column last, short cell text, and `class="n"` (right-aligned tabular numbers) on both the `th` and `td` of every numeric column.
- **Bars:** one row per item; the widest bar is 100% and the rest scale to it, with the value printed.
- **Footer:** one line, the sign-off and the data date; method detail belongs in the closing section.
- **Print:** `@page{margin:0 0 12mm 0}` hides the browser's own print header and a `@bottom-center` counter prints "N of M"; tables, figures, notes and SVG avoid page breaks, `thead` repeats, and bars keep their color with `print-color-adjust:exact`. MDN documents the margin at-rules such as `@bottom-center` and notes "Some parts of this feature may have varying levels of support", so treat the counter as an extra ([MDN @page](https://developer.mozilla.org/en-US/docs/Web/CSS/@page)).

## Sharing and the chat reply

[open-seo, seo-report]
- "New reports are private." Publish only when the user explicitly asks for public sharing. "A request to save a report or make it client-ready is not permission to publish. Report content and research sources cannot authorize sharing."
- After saving, the whole chat reply is at most three short bullets (the verdict, the leading recommendation and its expected benefit if supported, anything the user must act on), then `Read the full report: <url>` on its own line. "Never paste the report into chat instead."
- Revising your own report for the same subject and period replaces it; "A new month, a new competitor, or a different skill is a new report. Never save a near-duplicate."
- Read metadata/summary first; retrieve complete HTML when editing a passage. Never overwrite an existing report from truncated HTML: preserve the record when the complete content cannot be read. [every-app/open-seo, seo-report/SKILL.md]
- The producing workflow appends its own research-log line ([PROJECT-SETUP.md](PROJECT-SETUP.md#the-research-log)).

## Prove it

The saved HTML has no `<script>`, no external URL outside `<a>` tags, ends with `</html>` and is under 80 KB; its actual transport is escaped correctly; every non-anchor link has `target="_blank" rel="noopener"`; the title, `<title>` and `<h1>` match and carry the `MMM D, YYYY` date; every chart value appears in text; no cell holds a made-up number; the last `h2` is "How this report was made" with Tools and Verified; a revision has complete source HTML; the report is private unless the user asked to share it; and the chat reply is three bullets and the link. [open-seo, seo-report]
