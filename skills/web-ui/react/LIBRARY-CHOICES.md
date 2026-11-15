# Optional frontend library choices

Use this lookup when choosing a library for a React web task. Emil Kowalski's supplied `pick-ui-library/SKILL.md` provides these opinionated task matches; they are source preferences, not requirements to migrate a working dependency or replace an accepted product design. Read the selected library's current official docs and installed types before implementing it. No package is installed by this reference. [Emil Kowalski, pick-ui-library]

## Start with the task and the installed stack

[Emil Kowalski, pick-ui-library, How to use this; existing React, COMPOSITION.md]

- Check `package.json` and the existing implementation first. Reuse an installed suitable library. If the project uses a competitor, explain the source's alternative without changing the dependency unless that change is requested.
- Identify the actual behavior needed, then recommend the matching choice with its purpose. A user's explicit library choice takes precedence over this optional list; do not silently substitute a different package.
- Keep the source's list distinct from research outside it. When the task is absent, say so and check current primary documentation for another option rather than inventing package capabilities.
- An installed framework, native browser feature or the current state model may already cover the task. This lookup does not override React's props, children and context composition order or the product's existing primitives.

## The source's task matches

[Emil Kowalski, pick-ui-library, The list] Links go to each project's official site or repository; use the selected project's documentation before copying an API or install command.

| Task | Source choice |
|---|---|
| Unstyled UI components such as dialogs, popovers, menus and selects | [Base UI](https://base-ui.com) |
| Command palettes | [cmdk](https://cmdk.paco.me) |
| Toasts and notifications | [Sonner](https://sonner.emilkowal.ski) |
| One-time password and verification inputs | [input-otp](https://input-otp.rodz.dev) |
| Development control panels and parameter tuning | [Leva](https://github.com/pmndrs/leva), with [DialKit](https://github.com/joshpuckett/dialkit) as the source's alternative |
| Springs, layout, enter/exit and gesture-driven animation | [Motion](https://motion.dev) |
| Animated counters, prices and statistics | [NumberFlow](https://number-flow.barvian.me) |
| Animated text | [Torph](https://github.com/lochie/torph) |
| A 3D globe | [COBE](https://github.com/shuding/cobe) |
| Dynamic social/OG artwork rendered to SVG | [Satori](https://github.com/vercel/satori) |
| Syntax highlighting | [Shiki](https://shiki.style) |
| Real-time or streaming charts | [Liveline](https://github.com/benjitaylor/liveline) |
| General static or interactive dashboard charts | [Recharts](https://recharts.org) |
| Drag and drop | [dnd kit](https://dndkit.com) |
| Virtualized long lists and large tables | [Virtuoso](https://virtuoso.dev) |
| Shared state management | [Zustand](https://zustand.docs.pmnd.rs) |
| Conditional class strings | [clsx](https://github.com/lukeed/clsx) |
| Typed component variants for Tailwind | [CVA](https://cva.style) |
| Theme switching and dark-mode integration | [next-themes](https://github.com/pacocoursey/next-themes) |

## Preserve the boundaries behind the choice

- **Motion:** the source chooses Motion for springs, layout, exits and gesture values, and CSS transitions for a simple hover or fade. Timing, interruption and reduced motion remain in [ui-animation](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md). [Emil Kowalski, pick-ui-library, Motion and visuals]
- **Charts and lists:** the source chooses Liveline when points arrive live and the plot moves with time, and Recharts for its other chart cases. Its “1,000+ rows” virtualization cue is not a universal performance threshold; the existing [browser performance owner](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/BROWSER.md) owns measurement and list rendering. [Emil Kowalski, pick-ui-library, Charts and Common mismatches to catch]
- **Classes and variants:** the source uses clsx for conditional classes and CVA when size, intent or state forms a typed variant API. This is a styling distinction, not a reason to rewrite a component that already has an established API. [Emil Kowalski, pick-ui-library, State and styling]
- **Satori correction:** the source labels its output SVG/PNG. Satori returns an SVG string; the official README uses a separate rasterizer to obtain PNG. Choose that additional output step only when needed ([Satori README](https://github.com/vercel/satori#overview)).
- **Existing owners:** Sonner's API stays in [sonner](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/sonner/SKILL.md), SVG output in [svg](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/svg/SKILL.md), and globe rendering constraints in [webgl](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/webgl/SKILL.md). An entry here does not override the protected `app-ui`, `landing-page-ui` or `agent-chat-ui` implementation. [existing React, SKILL.md; pick-ui-library, How to use this]

## Prove it

The recommendation names the task, the matching source choice and the existing dependency it would reuse or replace. Before implementation, verify the chosen version's actual APIs, peers and framework support from its official docs and types; distinguish source preference from current product requirements. Any integration preserves the accepted design, working behavior and accessibility, and no dependency changes solely because it appears in this table. This lookup makes no claim that every listed library was installed, run or checked for ongoing maintenance. [Emil Kowalski, pick-ui-library, How to use this]
