# The scan

What AI-generated interfaces look like. A single item is fine if it serves a stated purpose (except anything that breaks an absolute in the skill). What makes a page slop is many of these together with no reason. Scan for clusters, then ask each one: what does this serve?

## Color and surface

| Pattern | Signs |
|---|---|
| The default gradient | Blue to purple, blue to cyan, purple to pink; a full-page colored glow; animated gradient text, "like the poster child of AI right now" ([nerdy.dev: Animated Gradient Text](https://nerdy.dev/animated-gradient-text), 2024-12-20) |
| Glass everywhere | Blur on the navbar, cards, modals and sidebar at once |
| Glow everywhere | Glowing cards, buttons, icons, badges, borders and background together |
| Floating page | A large soft shadow on every component |
| Pills everywhere | Buttons, inputs, cards, badges and modals all fully rounded |
| The AI palette | Purple and black, neon accents, pastel blocks, radial orbs as the default treatment (a chaptered launch page's palette method, "one sharp color per release chapter": [webgl LAUNCH-SITES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/webgl/LAUNCH-SITES.md#visual-system)) |
| Accent everywhere | One accent on buttons, icons, links, lines, backgrounds and glows |
| Too many colors | Five or more colors with no system |
| Dark because "tech" | Dark by default with no brand or user reason |
| Decorative backgrounds | Grids, dot patterns, blueprint lines, noise, blobs and mesh gradients stacked (Argyle publishes a stacked radial-gradient fake mesh and a gradient noise as techniques, [nerdy.dev: CSS Wishlist 2025](https://nerdy.dev/css-wishlist-2025), 2024-12-17, and [Make some hacky noise](https://nerdy.dev/hacky-css-noise-with-repeating-gradients), 2024-01-22; the technique is fine, the default use is the sign) |
| Sterile default | Near-white, thin grey borders, small radius, generic font, no identity: over-filtering with no direction |
| Cream default | A cream or off-white background as the fallback when no direction was given |

## Layout and components

| Pattern | Signs |
|---|---|
| The template page | Hero, subtitle, two CTAs, screenshot, feature grid, testimonials, FAQ, CTA, four-column footer |
| Identical cards | Same size, icon, padding and layout for every feature |
| Bento by default | A mosaic of mixed-size cards as the go-to section layout |
| Fake terminal | A styled terminal with typed commands as the hero visual |
| Skeleton as product | Grey placeholder bars passed off as a product screenshot |
| Pristine demo | The product shown empty, or filled with identical mock rows in perfect alignment, instead of mid-use with uneven, believable content |
| Same section, every section | Centered title, subtitle, card grid, repeated; only the background color alternates |
| Three steps, always | "How it works" with round numbered icons, always three |
| Logo bar | A row of company logos under the hero that nobody can name |
| Three tiers, middle highlighted | Whatever the real pricing is |
| Template motion | Everything fades up, floats, scales or bounces (floating is contested: kciter's "How to Design an Animation" builds the landing-page floating background from one `sin`, each element with "a different amplitude, frequency, and phase", and calls it "natural-looking"; this scan counts floating as a sign) |
| Uniform spacing | Identical padding and gaps in every section; the same gap inside a group as between groups (better-layout wants "at least 2×", [DETAILS.md](DETAILS.md#spacing-that-groups)) |
| Text-styled control | "A control styled like the static text beside it does not read as a control" [Jakub Krehel, better-layout]: plain-text "Upgrade now" where a button or underlined link belongs |
| Button-shaped badge | "A non-clickable badge shaped exactly like the buttons beside it collects dead clicks" [Jakub Krehel, better-layout] |
| Hidden with no cue | A row of cards that ends exactly at the container edge, or content collapsed behind a bare "More": "A row of cards that ends exactly at the container edge looks complete, and nobody scrolls it." Let the next item peek or name what is hidden ("Show 12 more results") [Jakub Krehel, better-layout] |

Two rows above are a generic source's defaults, both views stated:

- **Three tiers, middle highlighted.** [coreyhaines31/marketingskills, pricing] makes Good-Better-Best the default: the Better tier is "Where most customers land" at "Your "anchor" price", Best "often 2-3x "Better""; [coreyhaines31/marketingskills, marketing-psychology]: "Three tiers where the middle is your target. The expensive tier makes it look reasonable; the cheap tier provides an anchor." The scan keeps its row: the sign is the shape chosen before the real plans exist, and anti-slop-copy agrees ("Not always three tiers with a highlighted middle", [anti-slop-copy PAGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/PAGES.md)). With three real plans and a real recommendation it is no sign; landing-page-ui's pricing page shows "the recommended plan solid" ([landing-page-ui SYSTEM.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SYSTEM.md)). Tier design: [pricing-strategy TIERS-AND-TRIALS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/pricing-strategy/TIERS-AND-TRIALS.md#good-better-best).
- **The template page.** [coreyhaines31/marketingskills, copywriting] ships fixed page templates (a compact landing page of six sections, an enterprise page of ten). The scan keeps the row: order sections by the visitor's doubts and include only those this product can fill ([anti-slop-copy PAGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/PAGES.md)).

## Decoration and type

| Pattern | Signs |
|---|---|
| AI icons | Sparkles, stars, magic wands, lightning, diamonds, orbs, robots as feature icons |
| Library look | Every icon from one thin-stroke rounded set, chosen for the look not the meaning. The opposite sign is mixing sets: "Never mix icon libraries on one toolbar" [Jakub Krehel, better-ui] |
| Capsule badges | "AI Powered", "New", "Beta" pills with a dot, thin border, glow and caps |
| Eyebrow pill | A small pill above the H1 repeating what the headline says |
| Arrows on everything | → or ↗ on almost every button |
| Left stripe | A thin colored bar on the left of cards or rows as decoration |
| Terminal type | Big monospace headings; WIDE-TRACKED UPPERCASE labels. Contested: transitions.dev's skeleton-text loaders, which it suggests for landing pages and demos, use monospace log-style heads, uppercase labels tracked at about 0.08em, a pulsing step dot and a CSS stream typed out behind a caret [transitions.dev]; this scan counts each of those as a sign; the loader's token count is the character count divided by 3.4 |
| Italic accent | Italic accent words in headings |
| Numbered sections | Numbered "01 / 02 / 03" section labels |
| Default typeface | The model's usual font picked with no reason (a popular font is fine with a reason) |
| Generic illustration | Stock vector people or 3D blobs unrelated to the product |

### Effect libraries, both views

Libraries.dev's free skill places its seven effect packages (beams, orbs, gooey, voice glow, bot avatars, liquid metal, image reveals) by rule [Libraries.dev]. Some of its placements are signs on this scan; others give the scan's "with no reason" a working limit. Both views stand, and this scan keeps its rows.

- **Where they disagree:** Libraries.dev puts "**Liquid metal**, Badge type (`MetalBadge`)" on "A badge ("New", "Pro")", "**Thinking orbs**, usually beside a text label" on any wait of "2 s or more", "Also **Border beam** on the element doing the work" past 3 s, and "**Bot avatars**" on "Anything avatar related for a bot or agent". This scan counts capsule badges, glowing borders and badges, and orbs and robots as icons among its signs (Capsule badges, Glow everywhere, AI icons). Its wait rule also differs from the owner's: "Under 2 s | Nothing. No orb, no beam.", where agent-chat-ui shows "**A pulse dot** the instant the message is sent" and performance-and-caching shows "nothing at all for waits under about 300 ms" ([web-performance BROWSER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/BROWSER.md#loading-states)); the owner's skills decide there.
- **Where it sharpens the scan:** "**Don't stack effects.** Never put two effects on one element or on neighbouring elements; beam, metal and gooey each draw the eye, so give each its own area of the screen." Its review suggests "at most one library per UI area (a sidebar, a thread, a composer, a card)", and "every metal element on a page shares one colour, so pick one preset for the page, and keep metal elements apart (a headline and a CTA in the same header is fine; two metal buttons side by side is not)". That is a countable form of Glow everywhere: one attention effect per area, each with its job. "No clear match ... Do not force an effect."
- **Its fit signals are this scan's leads:** the hand-rolled versions it looks for, `Loader2` with `animate-spin` "near chat or agent code", `TypingIndicator` and "three bouncing dots CSS", "`conic-gradient` with `@keyframes` rotate, `animate-border`, `border-beam`, `shine-border`, `magic-border`", "`filter: url(#goo)`", and "`animate-pulse`, `<Skeleton`, `shimmer`, `aspect-square bg-muted` on image containers". Libraries.dev swaps each for a package; here each one is a lead to ask what it serves.

## Content and function

| Pattern | Signs |
|---|---|
| Fake numbers | "10K+ users", "99.9% uptime", "120+ countries" with no source |
| Fake people | AI avatars, made-up names and titles, invented reviews |
| Fake trust | Compliance badges, "enterprise-grade", "300% faster" without evidence |
| Generic CTAs | Get started, Learn more, Try now, Explore, Discover |
| Buzzwords | AI-powered, next-generation, revolutionary, seamless, cutting-edge, effortless |
| Template FAQ | "Is my data secure?", "Can I cancel anytime?" with no link to this product |
| Dead controls | Buttons that do nothing, dropdowns that don't open, forms that don't submit |
| Links to nowhere | Nav items for pages or sections that don't exist |
| Happy path only | No empty, loading or error states |
| Spinner as the loading state | A spinner around conditionally rendered data, where prefetched content, a skeleton or nothing would do (Florian Kiem's "The perfect app has no loading states": "Agents love them. A simple spinner - done."; the audit is in web-performance [web-performance BROWSER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/BROWSER.md#loading-states)) |
| Invented assets | A logo, avatars or team photos made up without being asked |
| Product never shown | A product sold with no real screen, demo, terms or privacy page |

## Accessibility

| Pattern | Signs |
|---|---|
| Grey on grey | Light grey text on white or grey, claimed to pass without a calculation |
| Text over images | White text on a photo or gradient that is light in places |
| Invisible focus | `outline: none` with no replacement, or a ring the same color as the background |
| Mouse only | Hover-only menus, click-only dropdowns, drag with no keyboard path |
| Color-only status | Red border or green tint with no text or icon |
| Clipped zoom | Fixed pixel text or hidden overflow that breaks at 200%; a fixed `height` on a box holding text, where better-layout uses "`min-height`, or `max-height` with `overflow-y: auto`" |
| Title tooltip | A truncated value whose only way back is a `title` attribute: "A hover-only `title` attribute does not count, because keyboard and touch users never see it" [Jakub Krehel, better-layout]; MDN calls `title` "highly problematic" for people on touch-only devices and keyboards ([title](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/title)) |

## Report and evidence pages

Vercel's design.md lists these as "recognizable defaults" to never ship on its formal report pages (customer reports, proposals, briefs, benchmarks, comparisons, calculators), and bans them there outright. The ban is scoped to those pages: on a marketing site or in the app, `landing-page-ui` and `app-ui` decide, and the rest of this scan still treats one item with a purpose as fine. The same list also names tracked eyebrows and decorative numbered labels, decorative gradients, glows and glass, a centered hero over a card grid, stock imagery and fake screenshots (rows above), and em dashes.

| Pattern | Signs |
|---|---|
| Metric boxes | "Repeated metric boxes when one composed relationship would be clearer" |
| Capsule metadata | "A badge, pill, or rounded capsule for ordinary metadata, chart annotations, or editorial labels" |
| Nested cards | "Cards nested inside cards, or borders used to repair weak hierarchy" |
| Boxed charts | "A dark rounded rectangle around every chart or calculator" |
| Icon tiles | "Arbitrary icon tiles, oversized icons, or mixed icon styles"; "Do not use icons as decoration or place them in colored tiles" |
| Uneven type | "Tiny muted prose, arbitrary font sizes, inconsistent peer values, or misaligned baselines" |
| Misfit tables | "A narrow table floating inside a wide section, or a wide table compressed into broken words" |
| Decorative data | "Decorative charts, redundant visualizations, legends that replace direct labels, or color without meaning" |
| Unscaled bars | "Repeated full-width bars that do not share a scale or encode a visible difference" |
| Same silhouette | "Identical section silhouettes across unrelated reader questions" |
| Said four times | "Repeated recommendation, summary, rationale, and conclusion sections that say the same thing" |
| Process narration | "Authoring-process narration such as how the page was organized, why a representation was chosen, or how source fields were renamed" (it keeps "concise interpretive captions that state an evidence-led takeaway or limitation") |
| Page chrome | "Visible theme controls, print-only UI, stock imagery, fake screenshots, or decorative brand marks" |
| Motion on a report | From its motion rules, not the list: "Default to stillness. Never add auto-scrolling marquees, simulated typing cursors, or decorative pulsing status indicators... Never gate reading behind animation, reveal every section on scroll, move imagery on hover, or add bounce, parallax, cinematic transitions, sound, or spectacle." Outside reports, Argyle's chat prototype uses exactly a blinking cursor as its "machine is typing" loader: "of all the little loader thingies I made, this one was the simplest and most effective" ([nerdy.dev: LLM chat prototype](https://nerdy.dev/llm-chat-prototype), 2025-07-28). |

Avoiding these is not the goal by itself: "Do not compensate for avoiding these defaults by producing a sterile anti-design template" (the Sterile default row).
