# Keeping it a system

## A checker in CI

A script that reads whole JSX tags (not lines, so a multi-line `<div onClick>` is still one tag) and CSS blocks, and fails the build on drift. Each rule has an id, a one-line why and a fix, printed with every finding (`--explain <id>`):

| Rule | Finds | Fix |
|---|---|---|
| `rule/raw-value` | hex, `rgb()`, `oklch()` outside a token definition line | a semantic token (the checker names the nearest one by color distance for the property's job) |
| `rule/named-color` | `white`, `black`, `red` as a value | a token |
| `rule/palette-use` | `text-gray-500`, `bg-white` when the theme has a surface role | a role utility |
| `rule/doubled-utility` | `text-text-*`, `bg-bg-*` | the role's real name |
| `rule/arbitrary-value` | `p-[13px]`; CSS-wide keywords, grid area names, token-only math (including `env()`) and transition property lists pass | a scale step |
| `rule/inline-px`, `rule/css-px` | `px` in a `style` prop or a stylesheet (`css-px` can be switched off with the reason recorded beside it) | `rem` or a token |
| `rule/token-parity` | a `var(--x)` nothing defines; a light color with no dark value, or one defined in the dark theme only | define it, or list it in `sharedTokens` |
| `trap/native-control` | `<button>`, `<input>` where the system has one | the component |
| `trap/button-div`, `trap/role-button` | `onClick` on a `div`, an `<a>` with no `href`, or a `role="button"` element | a button, or a link when it navigates |
| `trap/link-as-button` | a link with a button's background and padding (block, flex and grid card links pass, and so does a background that appears only on hover or focus) | the button's link form |
| `trap/button-clone` | a non-button carrying 4 or more of the button's classes plus a size class (the signature is read from the Button file itself) | the button |
| `trap/link-wraps-button` | a link around a button or the reverse | one element |
| `trap/label-unbound` | a label with no `htmlFor` and no control inside | bind it |
| `trap/overlay-conditional-render` | `{open && <Dialog>}` | keep it mounted, pass `open` |
| `trap/loading-label-swap` | a button label that is a ternary on a flag that also feeds `disabled` or `aria-busy`, or is named like `load`, `sav`, `pend`, `submit` | keep the label and morph it, `aria-busy` ([STATES.md](STATES.md)); never "a spinner beside it" |
| `rule/component-override` | padding, radius, shadow or background set at the call site of a system component | a variant |
| `rule/unregistered-ui` | a file in the components folder with no registry entry | register it |
| `rule/deprecated-import` | an import of a component the registry marks as replaced (`replaces`) | the replacement |
| `rule/stock-edit` | a vendored component file changed since its recorded hash | review it, record the new hash with a note |
| `trap/motion-transition-all` | `transition: all` | name the properties |
| `trap/motion-ease-in-enter` | an entrance eased in | ease out |
| `trap/motion-overshoot` | a `cubic-bezier` or a motion library's `ease: [...]` with a y outside 0 to 1 | a preset; the named overshoot tokens ([TOKENS.md](TOKENS.md)) are allowlisted |
| `trap/hover-unguarded` | a `:hover` that reveals content outside `@media (hover: hover)` or `(pointer: fine)` | guard it and give touch another way |
| `trap/zoom-disabled`, `trap/viewport-height`, `trap/touch-autofocus`, `trap/touch-tap-highlight` | zoom locked, `100vh` on a shell or full-screen cover, autofocus on a page field, tap highlight removed with no pressed style (`:active`, `data-pressed`, `whileTap`) | the touch fixes |
| `rule/outside-name` | an outside product's name in the docs (a warning only) | say what it does |

Plus the team's own bans from config (`px` for layout, `vw` inside components, plain `vh`, physical properties; see `anti-slop-ui` RESPONSIVE.md), each with its reason in the team's words. Bans also scan the docs pages; a line containing "Don't:" or the ban's id is exempt, so a doc can show the wrong way. Examples in the docs folder are always scanned.

**Existing debt doesn't block new work:**

- An **allowlist keyed by file, rule and literal value** (`{"card.tsx": {"rule/raw-value": {"#166534": 2}}}`): swapping an allowed value for a new one fails, because the new literal has no entry. Keys drop `file:line` pointers and collapse whitespace, so they survive edits elsewhere. Entries can carry a `removeBy` date that warns once passed. A shrink command lowers counts to what is found now and never raises one; a prune command drops entries that match nothing. **Run both in CI** (as a warning that names the stale entries), or the allowlist goes stale: entries for values long gone keep the door open for them to come back.
- A **ratchet**: per-rule counts over the repo, failing only when a count rises; `--ratchet-update` only ever lowers them.
- **Changed lines only** for pull requests (`--changed origin/main`, or `--diff` reading a unified diff, `-` for stdin), reported as annotations with the repo-relative path (`--warn`), with every finding appended to the job summary as a table (`--summary`), so nothing is lost past the annotation cap.
- **Vendored files:** a drift list (file, status of stock, customized or forked, sha256, note). `--hash-stock` fills empty hashes; `--rehash` refuses to run without `--note`; untouched stock files are skipped. With upstream's copy saved (`--save-stock`), findings on lines identical to upstream are exempt, for the literal-value rules only.
- **Project lint overlap:** with `projectLint: "auto"`, the rules a project's own design lint already covers are skipped, with a note saying so.
- **`--init`** guesses the config and never writes an empty value (an empty `{}` reads as a decision; treat it as unset, with a note). It derives the ignored custom properties by scanning dependencies for ones they set at runtime (`setProperty`, names built from a prefix).
- A **self-test** on fixture files (named `*.fixture` so no compiler sees them), one failing and one passing case per rule, plus checks that every rule has a why and every id is unique, and fixture sets for the command-line modes.
- **Exit codes that can't lie:** finding no files at all is exit 2, never a pass. End with `process.exitCode`, not `exit()`, so large `--json` output isn't cut at 64KB.
- The run ends by printing what it **cannot** see (`--list-blind-spots`): rendered contrast, including non-text contrast (borders, focus rings, checkbox edges); whether focus is visible, focus order and what Escape does; touch target sizes; layout and overflow at each width (320 and 390px); `bg-white` where no role exists for it; files outside the include folders; token comments drifting from actual use; overrides built at runtime; and motion that can only be measured (an exit slower than its entry, motion on a frequent surface, linear easing, press delay, input lag, jank, easing set in script). Those are checked by eye ([SKILL.md](SKILL.md), Prove it).

## Builds and stylesheets

- **Keep the marketing site's classes out of the app's build** (`@source not "./website"`), and each side's stylesheet out of the other's document.
- **A class-based dark variant** (`@custom-variant dark (&:is(.dark *))`), so the head script's class decides the theme.
- **Import stylesheets that declare no classes last:** a design lint that reads a bounded number of stylesheets (65 for one common linter) and stops after a package stylesheet otherwise misses your own.

## The design doc drifts

A written design doc (button height, overlay fade, checkbox size, menu radius, sidebar widths) drifts from the code within months unless something compares them. Generate its numbers from the tokens and component CSS, or add a check that reads both and fails on a mismatch. Until then, the code wins.

## Copying a reference product's look

When a screen must match another product (an embedded preview, a familiar card), measure it instead of guessing: rendered styles and the loaded component source, recorded in source pixels at a 16px root and implemented in `rem`. Match the visible label's typography, not the wrapper's inherited size. Record states too (hover and pressed overlays, the fade-out time, disabled colors). Don't add animations the reference doesn't have. Keep the app's own chrome around it in the app's system, and raise unreadable text to 12px.

## One component, every caller

Before adding a component, search for one that does the job; extend it with a variant instead of a near copy. Register every file in the components folder (a registry entry or a vendored-file row with its hash), so nothing in it is undocumented. When a component changes behavior, update every caller in the same change.
