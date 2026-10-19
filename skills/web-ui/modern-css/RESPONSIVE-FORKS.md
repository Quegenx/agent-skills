# Responsive design forks

Some desktop layouts have no single right phone version. responsive-craft (kylezantos/responsive-craft, MIT) names eight of them, and its rule is to "present 2-3 options with tradeoffs and ask the user to choose", never to "default silently" [responsive-craft]. This file holds those forks, the behaviour specs written before any CSS, and the audit that stops and waits for the user.

**Scope: projects other than the owner's own apps.** app-ui and landing-page-ui have already decided their forks: the app's script "reads `matchMedia` in `rem`" to "swap the sidebar for a sheet" ([app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md)), and its table is "A scrolling frame with rounded corners" whose row actions "stack when narrow (a container query)" ([app-ui DATA-VIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/DATA-VIEWS.md)). Don't reopen those. The units still follow the owner's rules in [RESPONSIVE.md](RESPONSIVE.md#units): the source's px widths below are quoted as written, and a port writes them in `rem` or as container widths ([where the source differs](RESPONSIVE.md#where-other-responsive-skills-differ)).

**Contents:** [Two levels](#two-levels) · [Audit, then wait](#audit-then-wait) · [Behaviour specs](#behaviour-specs) · [The eight forks](#the-eight-forks) · [Prove it](#prove-it)

## Two levels

[responsive-craft]

- **Adaptive** (the default): "Moves fast. 1-2 discovery questions, then starts working. Surfaces design forks inline as they arise. No formal specs, decisions are made in the moment."
- **Guided:** "Produces deliverables. Full discovery, writes behavior specs per component before coding, gets explicit approval before each stage."
- **When to suggest Guided:** "If the layout has 5+ distinct responsive components, multiple sticky elements, or a dashboard-style layout, suggest Guided: the behavior specs prevent expensive rework later."
- **Output in the project's idiom:** "If you can detect this from the codebase, skip the question and confirm: 'I see you're using Tailwind, I'll output Tailwind classes.'" With a component library, "Use them instead of writing raw media queries around the library's components."

## Audit, then wait

[responsive-craft, transform-existing.md]

**Scope it first.** "If the user pointed at a specific component, page, or problem ('fix the mobile nav', 'the sidebar breaks on tablet'), scope the audit to that area. Don't run a full-codebase audit for a targeted request." A general request ("make this responsive") gets the full audit.

**Read the codebase before the layout:**

| Signal | Implication |
|---|---|
| Single CSS approach (all Tailwind, or all vanilla CSS) | Straightforward: apply patterns directly |
| Mixed styling (Tailwind + inline styles + CSS modules) | Target the dominant approach; flag conflicts between systems |
| Third-party component library (MUI, Chakra, shadcn, Radix) | Check the library's responsive defaults before overriding: work WITH it, not against it |
| `!important` scattered throughout | Specificity wars: consider `@layer` to establish cascade order before fixing responsive issues |
| CSS-in-JS (styled-components, Emotion) | Use the library's responsive API (theme breakpoints, responsive props) |
| Legacy code (floats, table layout, fixed widths in HTML) | Full retrofit needed; don't try to incrementally patch |

"If the codebase is a mess: Don't try to fix everything at once. Identify the 2-3 pages or components with the worst responsive behavior, fix those first, and establish patterns that can spread. Present this triage to the user."

**The eight checks:** viewport meta (with `viewport-fit=cover` "if safe areas are used"), breakpoint strategy, layout approach ("Intrinsic patterns (`auto-fit`, `flex-wrap`, `clamp()`) or breakpoint-dependent?"), container queries ("Are components adapting to their container or the viewport?"), sticky and scroll ("overflow ancestors, missing align-self, z-index issues"), typography, images ("`width`/`height` attributes? `max-width: 100%`? `object-fit` where needed? Responsive loading (`srcset`, `<picture>`) for large images?") and touch targets. Two of them differ from this skill: the source asks whether breakpoints are mobile-first, which the owner's model doesn't require, and it wants "Interactive elements at least 44x44px", where web-accessibility says "never report a target between 24px and 44px as a failure ... the AA floor is 24px" ([web-accessibility HIT-AREAS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/HIT-AREAS.md#target-sizes)).

**The report, then the gate:**

```
RESPONSIVE AUDIT

Current approach: [mobile-first/desktop-first/mixed]
Breakpoints found: [list them]
Layout system: [Grid/Flexbox/mixed/legacy]

Issues found:
1. [Critical] [description]
2. [Important] [description]
3. [Minor] [description]

Design forks identified:
- [Pattern] → needs a decision (see Step 2)
```

"**Wait gate:** Present the audit and wait for the user to confirm before proceeding." The source's three grades map onto [the one scale](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/SKILL.md#6-delivery-report): Critical is P1, or P0 where it blocks the primary task; Important is P2; Minor is P3.

**Then the forks, a few at a time.** For each one found: "Describe what exists in the codebase", "Present 2-3 mobile approaches with tradeoffs", "Ask the user to choose." "Don't batch all forks at once: present them one at a time or in groups of 2-3 max. Let the user make each decision before moving on." While building, the same stop applies: "Stop implementing", "Describe what you're seeing and why there's no single right answer", "Present the options with tradeoffs", "Ask the user to decide", "Continue implementing with their choice" [responsive-craft, build-responsive.md].

**Fix order, highest impact first:**

1. "Foundation fixes: viewport meta, box-sizing reset, image max-width, missing `min-width: 0` on flex children"
2. "Structural fixes: convert desktop-first to mobile-first if needed, establish consistent breakpoints, add container queries where components are viewport-dependent" (the first half is the source's model, not the owner's)
3. "Layout fixes: implement the design fork decisions from Step 2"
4. "Detail fixes: touch targets, safe areas, fluid typography, sticky coordination"
5. "Polish: scroll-snap, scroll-driven animations, reduced motion queries"

In Adaptive mode, "Fix foundation issues directly (they're unambiguous), surface forks inline as they come up". In Guided mode, write the specs below for "their current behavior AND the target behavior" and get each fix category approved first.

## Behaviour specs

"Without a canvas, explicitly describe responsive behavior before writing CSS" [responsive-craft].

**Adaptive: one comment per component.**

```css
/* ProductCard: stack vertical on mobile, horizontal at 640px, fixed 320px grid card at 1024px */
```

**Guided: one table per component, approved before any CSS.**

```
RESPONSIVE BEHAVIOR SPEC

Component: [Name]
Type: [Reflow | Expand/contract | Reveal/hide | Transform]
| Viewport    | Layout           | Key changes          |
|-------------|------------------|----------------------|
| < 640px     | [description]    | [what changes]       |
| 640-1023px  | [description]    | [what changes]       |
| 1024px+     | [description]    | [what changes]       |
```

- **Reflow:** "content rearranges (columns stack, sidebar becomes drawer)"
- **Expand/contract:** "component gets bigger/smaller without restructuring"
- **Reveal/hide:** "content appears or disappears (labels visible on desktop, icons on mobile)"
- **Transform:** "component changes form entirely (nav bar → hamburger menu)"

"**Wait gate:** Present the complete behavior spec and get approval before coding. This spec becomes a reference the user can check implementation against later." A filled one [responsive-craft, testing-checklist.md]:

```
Component: ProductCard
| Viewport   | Layout              | Image        | Text         |
|------------|---------------------|--------------|--------------|
| < 640px    | stack vertical      | full width   | 3 lines max  |
| 640-1023px | horizontal, img left| 40% width    | 2 lines max  |
| 1024px+    | grid card, 320px    | top, full-w  | 1 line       |
```

"This table takes 5 minutes and catches 'what should happen at X width?' before writing CSS." Under the owner's rules a component reads its container, so its rows name container widths, not viewport widths ([RESPONSIVE.md](RESPONSIVE.md#a-fluid-scale-that-keeps-desktop-exact)).

## The eight forks

[responsive-craft, responsive-design-forks.md] Each fork: the desktop pattern, the options, the question to ask, and the signals in the code that point to an option.

### 1. Sidebar with mixed content

Desktop: "Sidebar with navigation + filters + summary/stats + secondary actions."

| Option | Good when | Tradeoff |
|---|---|---|
| A. Bottom sheet drawer | "sidebar content is secondary and rarely accessed" | "Hidden by default: users may not discover it" |
| B. Tab bar with sections | "sidebar sections are equally important" | "Takes permanent screen space; limited to 3-5 sections" |
| C. Collapsible accordion inline | "sidebar content is a reference that users scan" | "Lengthens the page; may push main content too far down" |

The question: "This sidebar has [N] distinct content types: [list them]. On mobile, do you want them (a) hidden in a drawer and opened on demand, (b) accessible as permanent tabs, or (c) collapsed inline above the main content?"

Signals: "5+ sections → drawer is likely best (too many for tabs)"; "navigation → tabs or bottom nav"; "filters → floating action button that opens a filter sheet"; "stats/summary → inline above main content".

### 2. Data table with many columns

Desktop: "Table with 6+ columns of data."

| Option | Good when | Tradeoff |
|---|---|---|
| A. Horizontal scroll + sticky first column | "data-heavy tables where all columns matter equally" | "Users may not realize they can scroll; discoverability is poor" |
| B. Card stack | "4-8 columns where row-level reading matters more than column comparison" | "Cannot compare across rows; loses the tabular advantage" |
| C. Priority columns + expand/details | "some columns are clearly more important than others" | "Requires deciding which columns are 'essential': may vary by user" |

The question: "This table has [N] columns. Which columns are essential on mobile? That determines whether we (a) scroll horizontally with a sticky first column, (b) stack each row as a card, or (c) show priority columns with an expand option."

Signals: "users compare across rows → horizontal scroll (A)"; "users read one row at a time → card stack (B)"; "clearly primary/secondary columns → priority + expand (C)"; "table has actions (edit/delete) per row → card stack handles this most cleanly".

The card stack, mobile first, with the source's px written in `rem` (641px is 40.0625rem, 8px .5rem) and its `margin-bottom` as `margin-block-end`:

```css
/* Mobile base: card layout */
table, thead, tbody, tr, th, td { display: block; }
thead tr { display: none; }
tr {
  margin-block-end: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: .5rem;
  padding: 1rem;
}
td {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
}
td::before {
  content: attr(data-label);
  font-weight: 600;
}

/* Desktop: restore table layout */
@media (min-width: 40.0625rem) {
  table { display: table; }
  thead { display: table-header-group; }
  tbody { display: table-row-group; }
  tr { display: table-row; margin: 0; border: none; padding: 0; }
  th, td { display: table-cell; }
  td::before { display: none; }
}
```

Under the owner's rules the switch is a container query on the table's wrapper, not a viewport `@media`, since only the shell keeps one ([RESPONSIVE.md](RESPONSIVE.md#a-fluid-scale-that-keeps-desktop-exact)). Every `<td>` needs a `data-label`. The source warns: "changing `display` on table elements may break screen reader semantics: test with AT". For priority columns, "Only hide genuinely secondary data: hidden columns are invisible to assistive technology."

### 3. Multi-panel dashboard

Desktop: "Header + sidebar nav + main content area + optional detail panel. Multiple information-dense regions visible simultaneously."

| Option | Good when | Tradeoff |
|---|---|---|
| A. Tab-based single view | "users work in one section at a time" | "Loses the at-a-glance overview that makes dashboards valuable" |
| B. Stacked with anchored navigation | "all panels need to be scannable in sequence" | "Very long page; context switching requires scrolling" |
| C. Collapsible regions + scroll | "the summary is useful without the detail" | "Requires designing meaningful collapsed states" |

The question: "This dashboard has [N] panels visible simultaneously on desktop. How much information density matters on mobile? (a) One panel at a time (tabs), (b) all panels stacked and scannable, or (c) collapsed summaries that expand on demand?"

Signals: "monitoring/status → collapsed summaries (C): users scan for anomalies"; "workflow → tabs (A): users focus on one task"; "panels have sequential relationships → stacked (B)".

### 4. Hero with complex visual content

Desktop: "Large hero with background video/image, overlay text, CTA, secondary elements (stats, testimonials, animated graphics)."

| Option | Good when | Tradeoff |
|---|---|---|
| A. Simplified adaptation | "the hero's message works at any size" | "May feel like a 'shrunk desktop': not designed for mobile" |
| B. Different mobile hero | "the desktop hero relies on visual impact that doesn't scale down" | "Two things to maintain; content can drift out of sync" |
| C. Progressive disclosure: headline + CTA only | "the CTA is the primary goal and surrounding content is supporting" | "Supporting content may never be seen" |

The question: "The desktop hero relies on [visual element] for impact that won't translate to 375px. Do you want to (a) adapt it (simpler version, same structure), (b) design a different mobile hero, or (c) reduce to headline + CTA with the rest below the fold?"

Signals: "background video → Option A with static image fallback, or C"; "complex animations/graphics → Option B (they'll be janky on mobile)"; "the CTA is the whole point → Option C (strip everything else)".

### 5. Multiple sticky elements

Desktop: "Sticky header (60px) + sticky subnav (40px) + sticky filters (48px). Total: ~148px of stuck content."

| Option | Good when | Tradeoff |
|---|---|---|
| A. Keep all (cascading sticky) | "large tablets and desktops" | "148px is ~20% of a mobile screen. Content area becomes too small." |
| B. Collapse subnav into header | "subnav items are few (3-5)" | "Header becomes more complex and may need its own responsive states" |
| C. Filters become floating button + sheet | "filters are used intermittently, not constantly" | "Filters are no longer visible; users may forget active filter state" |

The question: "[N] sticky elements stack to ~[X]px on mobile: that's [Y]% of the screen. Which ones truly need to stay visible while scrolling?"

Signals: "subnav has 3-5 items → collapse into header (B)"; "filters are applied rarely → floating button + sheet (C)"; "user constantly references all three → keep cascading but reduce heights (A with smaller mobile variants)".

### 6. Complex navigation

Desktop: "Mega menu, multi-level dropdowns, or navigation with 15+ items across 3+ categories."

| Option | Good when | Tradeoff |
|---|---|---|
| A. Hamburger with accordion categories | "The standard approach for deep navigation" | "Adds taps to reach any destination; deep nesting is confusing" |
| B. Bottom tab bar + category pages | "app-like experiences with 3-5 top-level sections" | "Only works for 3-5 sections; more requires overflow handling" |
| C. Search-first navigation | "users know what they're looking for" | "New users who don't know the content can't browse effectively" |

The question: "This navigation has [N] items across [M] categories. On mobile, is the primary user behavior browsing/exploring or searching for something specific?"

Signals: "content-heavy site with defined categories (e-commerce, docs) → hamburger + accordion (A)"; "app with 3-5 core flows (dashboard, messages, settings, profile) → bottom tabs (B)"; "content is highly searchable and users have intent (knowledge base, marketplace) → search-first (C)"; "3+ nesting levels → hamburger (A): bottom tabs can't handle depth"; "navigation items have icons → bottom tabs (B): icon + label fits the tab bar pattern".

Rules per option [coreyhaines31/marketingskills, site-architecture, navigation-patterns.md]: a hamburger keeps the "CTA button visible without opening the menu (sticky header)", has "Search accessible from mobile menu" and uses an "Accordion pattern for nested items"; a bottom tab bar has "3-5 items max", "Icons + labels (not just icons)", "Active state clearly indicated" and the "Most important action in the center". In the owner's sites "One list of navigation items (title, description, two icon styles, address) feeds both the header menu and the footer" ([landing-page-ui MOTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/MOTION.md)).

### 7. Form layout with complex fields

Desktop: "Multi-column form, inline validation, conditional fields, field groups side by side."

| Option | Good when | Tradeoff |
|---|---|---|
| A. Single column stack | "Simplest and most reliable on mobile" | "Long forms become very long; user may lose context of where they are" |
| B. Stepped wizard | "forms with 10+ fields or natural groupings" | "Users can't scan the whole form; progress indicator needed" |
| C. Accordion sections | "reference/settings forms where users edit specific sections" | "Users may miss required fields in collapsed sections" |

The question: "This form has [N] fields in [M] groups. Is this a fill-once form (registration, checkout) or an edit-many-times form (settings, profile)?"

Signals: "Fill-once → stepped wizard (B) for 10+ fields, single column (A) for fewer"; "Edit-many-times → accordion (C)"; "Mix of required/optional fields → step through required, accordion for optional".

### 8. Content grid with varying card types

Desktop: "Bento grid or masonry layout with hero cards, standard cards, and wide cards."

| Option | Good when | Tradeoff |
|---|---|---|
| A. Linear stack (all same width) | "Hero card can be taller or have a different layout to maintain hierarchy" | "Loses the visual rhythm and hierarchy of the bento grid" |
| B. Horizontal scroll sections | "Group cards by type; each group scrolls horizontally" | "Less discoverable; users may miss cards off-screen" |
| C. Two-column mini grid | "Standard cards go 2-up; hero card spans full width" | "Cards may be too narrow on phones under 375px" |

The question: "The desktop grid uses varying card sizes for visual hierarchy. On mobile, do you want to (a) stack everything full-width (simplest), (b) group into horizontal scroll sections (preserves variety), or (c) keep a 2-column mini-grid (preserves density)?"

Signals: "hierarchy matters (featured vs. regular) → Option C with hero card full-width"; "all cards are equal → Option A"; "cards are grouped by category → Option B". A bento grid by default is also a sign on [the scan](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/PATTERNS.md#layout-and-components).

## Prove it

- **Drag, don't jump:** "slowly drag the right handle from 280px to 2560px. Don't jump between breakpoints, drag continuously", which catches "Elements that look fine at 768px but break at 900px"; while building, "Check 50px above and below each breakpoint" [responsive-craft, testing-checklist.md]. Dragging finds layout breaks; platform bugs need a real phone ([RESPONSIVE.md](RESPONSIVE.md#touch-and-browser-chrome)).
- **See the queries:** Chrome's device toolbar can show the media-query bars, "The blue bar with `max-width` breakpoints" and "The orange bar with `min-width` breakpoints" ([Chrome DevTools: device mode](https://developer.chrome.com/docs/devtools/device-mode)).
- **Every fork was decided by the user**, one at a time or in twos and threes, and the build matches each Guided spec row.
- **Close with the source's summary:**

```
VERIFICATION

Tested at: 375px, 768px, 1440px
Issues fixed: [N]
Design forks resolved: [N]
Remaining concerns: [list any, or "none"]
```
