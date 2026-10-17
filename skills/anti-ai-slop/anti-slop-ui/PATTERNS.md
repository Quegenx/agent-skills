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
| The AI palette | Purple and black, neon accents, pastel blocks, radial orbs as the default treatment |
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
| Uniform spacing | Identical padding and gaps in every section |

## Decoration and type

| Pattern | Signs |
|---|---|
| AI icons | Sparkles, stars, magic wands, lightning, diamonds, orbs, robots as feature icons |
| Library look | Every icon from one thin-stroke rounded set, chosen for the look not the meaning |
| Capsule badges | "AI Powered", "New", "Beta" pills with a dot, thin border, glow and caps |
| Eyebrow pill | A small pill above the H1 repeating what the headline says |
| Arrows on everything | → or ↗ on almost every button |
| Left stripe | A thin colored bar on the left of cards or rows as decoration |
| Terminal type | Big monospace headings; WIDE-TRACKED UPPERCASE labels |
| Italic accent | Italic accent words in headings |
| Numbered sections | Numbered "01 / 02 / 03" section labels |
| Default typeface | The model's usual font picked with no reason (a popular font is fine with a reason) |
| Generic illustration | Stock vector people or 3D blobs unrelated to the product |

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
| Spinner as the loading state | A spinner around conditionally rendered data, where prefetched content, a skeleton or nothing would do (Florian Kiem's "The perfect app has no loading states": "Agents love them. A simple spinner - done."; the audit is in performance-and-caching [BROWSER.md](../../backend/performance-and-caching/BROWSER.md#loading-states)) |
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
| Clipped zoom | Fixed pixel text or hidden overflow that breaks at 200% |

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
