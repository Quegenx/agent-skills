# What to inspect, and in what order

An audit is a review of whether a page can be discovered, trusted, understood and used, not a pile of warnings [freescan]. Start from the outcome the page exists for, check what can take the whole page down first, and record the evidence behind each result. This file holds the order, Audit Kit's checklists (MIT, [Danilaa1/auditkit](https://github.com/Danilaa1/auditkit), copied verbatim where quoted), and the places where a tool's check differs from the official docs. The SEO checks themselves are in [seo TECHNICAL-AUDIT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/TECHNICAL-AUDIT.md).

## Start with the outcome

[freescan, complete website audit checklist] Before inspecting anything:

- Write down the page's audience, primary action, canonical URL and critical dependencies, so the audit reviews a real outcome rather than chasing a perfect score.
- Capture a baseline: the public URL and scan time, screenshots, category scores, failed checks, console state and the conversion path. It is the comparison point and the rollback signal.
- Test the primary action without submitting sensitive or destructive data, and name the routes and services that cannot regress.

Audit Kit asks the same at intake [audit-kit, `ak new`]: "Client name" and "Website URL" (required), "Main goal" (default "Improve website results"), "Pages" (default "/, /contact"), then optionally "Business type", "Target customer", "Main conversion action", "Known concerns" and "Competitors". When the project has `.agents/product-context.md`, read it first and ask only for what it lacks ([anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md)).

## The order

[freescan] Each layer depends on the one before it:

| Area | What to verify |
|---|---|
| Availability | The page loads at its intended public URL with no redirect loop, certificate error or runtime failure. A broken foundation makes every later check irrelevant. |
| Discovery | Robots rules, canonical, sitemap routing, title, description, headings and structured data agree ([seo TECHNICAL-AUDIT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/TECHNICAL-AUDIT.md)). |
| Public security | HTTPS, response headers, mixed content, form transport, exposed files ([secure-coding HEADERS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/secure-coding/HEADERS.md)). |
| Accessibility | Semantics, labels, keyboard, alternatives, contrast, reflow and errors, automated and manual ([web-accessibility REVIEW.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/REVIEW.md)). |
| Design and runtime | Hierarchy, primary action, responsive layout, stability, performance and console health ([web-performance LIGHTHOUSE-CI.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/LIGHTHOUSE-CI.md)). |

Mistakes FreeScan names: chasing 100 before fixing the critical path; treating automated output as final truth ("Public scanners have bounded access", so reproduce findings and add manual testing where the tool cannot see context); bundling unrelated fixes, which hides which change caused which result.

## The review checklist

Audit Kit's workspace checklist, verbatim [audit-kit, src/workspace.ts]:

- **Performance:** Check mobile score; Identify LCP element; Check image weight; Check font loading; Check layout shift.
- **UX and Conversion:** Above-fold offer is clear; Primary CTA is obvious; User can contact or book within one click; Trust signals are visible; Forms are short enough; Navigation supports the key journey.
- **SEO:** Title tags; Meta descriptions; H1 structure; Internal links; Image alt text; Schema opportunity; Local SEO basics.

Per-page review fields, one block per page reviewed: "First impression:", "CTA:", "Copy clarity:", "Visual hierarchy:", "Mobile issues:", "SEO notes:", "Performance notes:", "Recommended fixes:".

Status checklist for the whole audit: Intake complete; Pages reviewed; Performance checked; SEO checked; Findings prioritised; Report drafted; Sent to client.

The copy and CTA wording itself is judged with [anti-slop-copy SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md); Audit Kit's CTA check is only a word list (below).

## HTML checks and what Google actually says

Audit Kit scores the HTML from 100 down (floor 0) [audit-kit, `analyzeHtml`]. Where its rule is its own heuristic, the official line is next to it; report the official line, and label the tool's band as the tool's if it is mentioned at all.

| Check | Audit Kit | Official |
|---|---|---|
| Title | Missing costs 15 (critical); outside "roughly 10 to 65" characters costs 8 | "there's no limit on how long a `<title>` element can be"; title links are truncated "as needed, typically to fit the device width"; avoid "unnecessarily long or verbose text" ([title-link](https://developers.google.com/search/docs/appearance/title-link)). The band is Audit Kit's. |
| Meta description | Missing costs 12; length not checked | Google gives no character count: "typically a succinct, one- or two-sentence summary" ([SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)); "There's no limit on how long a meta description can be" ([snippet](https://developers.google.com/search/docs/appearance/snippet)). |
| Keywords meta | Not checked | "Google Search doesn't use the keywords meta tag" ([SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)). |
| H1 | None costs 12; more than one costs 8 ("Keep one primary page heading") | "There's also no magical, ideal amount of headings a given page should have", and "it doesn't matter if you're using them out of order" ([SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)). One H1 is a convention, not a Google rule; heading order for screen readers is an accessibility question ([web-accessibility SEMANTICS-AND-ARIA.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/SEMANTICS-AND-ARIA.md#landmarks-and-headings)). |
| Images | Each `<img>` with no `alt` attribute costs 8, capped at 15; `alt=""` counts as present | Matches the accessibility rule: `alt=""` when decorative, otherwise describe the purpose ([web-accessibility REVIEW.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/REVIEW.md)). |
| Viewport | Missing viewport meta costs 10 | Never lock zoom ([web-accessibility MOTION-AND-ZOOM.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/MOTION-AND-ZOOM.md)). |
| Canonical | Missing `<link rel=canonical>` costs 4, "when duplicate URLs are possible" | [seo TECHNICAL-AUDIT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/TECHNICAL-AUDIT.md) |
| CTA | No CTA language costs 10, by the regex below on text with `script`, `style` and `noscript` stripped | A fixed English word list, not a judgement of the CTA ([anti-slop-copy SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md)). |
| HTML weight | A response over 200,000 bytes costs 7 ("Check markup, scripts, and inline payloads") | Audit Kit's own threshold, no official source. |
| HTTP status | 200 to 399 shown as positive, anything else critical | |

```
/\b(book|buy|call|contact|demo|enquire|quote|schedule|start)\b|get started|request a quote/i
```

The tool's own comment on its parser: "regex keeps lightweight checks dependency-free; add an HTML parser if malformed markup becomes a measured accuracy problem". It reads only the server's HTML, so a client-rendered page fails checks it would pass in a browser. Read the rendered DOM, or write in the report that the check saw server HTML only.

## Security headers, by value

Audit Kit's security score starts at 100 [audit-kit, `analyzeSecurity`]: no HTTPS costs 25, no `Strict-Transport-Security` 15 ("once HTTPS is stable"), no `Content-Security-Policy` 20, no `X-Frame-Options` 10, no `Referrer-Policy` 5, and any `Set-Cookie` lacking Secure, HttpOnly and SameSite 10. Its full-score fixture is `max-age=31536000`, `default-src 'self'`, `DENY`, `strict-origin` and `session=x; Secure; HttpOnly; SameSite=Lax`. Three things to correct when reusing it:

- **It checks presence, not value.** Every header is tested with `headers.has(...)`, so `max-age=0` HSTS and an `unsafe-inline` CSP pass, and cookie flags are matched by substring (`value.includes("secure")` also matches a cookie named `insecure_x`). Read each header's value and parse each cookie's attributes.
- **It requires `X-Frame-Options` even when CSP covers framing.** MDN: "For more comprehensive options than offered by this header, see the `frame-ancestors` directive in a `Content-Security-Policy` header"; `ALLOW-FROM` "is an obsolete directive"; the header "has no effect" in `<meta>` ([MDN X-Frame-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Frame-Options)). A site with `frame-ancestors` and no XFO is not a failure.
- **It wants HttpOnly on every cookie.** The repo keeps its own rule: secure-coding prefers `HttpOnly`, `Secure`, `SameSite` cookies ([secure-coding AUTH.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/secure-coding/AUTH.md)), and a Supabase app using client JavaScript must read the session, so "HttpOnly is not necessary" there ([supabase AUTH-SESSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/supabase/AUTH-SESSIONS.md)). Classify each cookie by purpose before flagging it [freescan].

The header checklist itself, sourced from MDN, is [secure-coding HEADERS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/secure-coding/HEADERS.md).

## Performance, lab and field

Audit Kit runs one headless Lighthouse lab run and saves the raw JSON, with no field data and no repeated runs [audit-kit]. Lab numbers let an agent iterate; field data confirms the win ([performance-and-caching MEASURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/MEASURE.md#lab-to-field-one-slow-spot-at-a-time)). Two corrections to its labels:

- Audit Kit lists TBT as a Core Web Vital and always applies the mobile TBT bands; TBT is the lab proxy for INP, with separate desktop bands ([web-performance LIGHTHOUSE-CI.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/LIGHTHOUSE-CI.md#reading-a-lighthouse-result)).
- Its score colours (85 and 65) are not Lighthouse's ([SCORING.md](SCORING.md#lighthouse-bands)), and 8 of the 14 audit ids it reads no longer exist in Lighthouse 13 ([TOOLS.md](TOOLS.md#audit-kit)).

How to run Lighthouse, read it and gate on it: [web-performance LIGHTHOUSE-CI.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/LIGHTHOUSE-CI.md).

## Prove it

The audit notes record the audience, primary action, canonical URL and a baseline from before any change; the report covers the five areas in order or says which were out of scope; no row cites a title, description or H1 rule to Google that Google's docs don't state; each check says whether it read the rendered DOM or server HTML; every security header finding quotes the header's value, and no site with CSP `frame-ancestors` is failed for lacking `X-Frame-Options`; no cookie is flagged for missing HttpOnly before its purpose is known; and the performance section says which numbers are lab and which are field.
