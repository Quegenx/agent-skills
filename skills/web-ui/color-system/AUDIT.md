# Audit

Reviewing a color system: what counts as a finding, inventorying an existing palette, the scan before you finish, severity on the P0 to P3 scale, what you can verify with and without a browser, and the report table. Sources: Jakub Krehel's better-colors and oklch-skill, each tagged. The topic files hold the rules each row points to.

## Stance

[Jakub Krehel, better-colors]

- **Read-only by default.** "When a pair fails, report the pair, its measured value and the threshold it misses, then leave the colors alone. They are a design decision. Change them only when asked, and remeasure after."
- **Findings versus choices.** "Notation, a tinted neutral and a gradient's interpolation space are project choices, not findings. A broken role mapping, a failing pair and an out-of-gamut step are findings."
- "Never report a contrast value you did not measure, and never estimate a color you could compute."
- **The owner's design is not a finding.** Where app-ui or landing-page-ui choose hex tokens, `foreground`/`primary` names, alpha text tokens, `color-mix()` tokens, one brand fill in both themes or a hand-built dark mode, the topic files note it once; report only what breaks a measured requirement (a failing rendered pair), never the choice itself.

## Inventory an existing palette

[Jakub Krehel, better-colors] "Before restructuring a system, inventory it. Most codebases hold several times more colors than the design has decisions."

1. **Collect every literal.** Grep for hex, `rgb(`, `hsl(`, `oklch(` and the project's utility-class prefixes. Include SVG `fill` and `stroke`, chart configs and email templates.
2. **Sort by perceived lightness within each hue family.** Duplicates surface immediately as near-identical neighbors.
3. **Collapse near-duplicates.** "Two colors within `0.02` of each other in OKLab ΔE are one color that drifted. Keep the one used most and retire the others. Never average them."
4. **Assign each survivor a role** from the role table ([PALETTES.md](PALETTES.md#every-step-has-a-job)). "A color matching no role is a missing token or a mistake. Decide which, and say so in the finding."
5. **Count what is left.** More ramps than the system needs ([PALETTES.md](PALETTES.md#a-system-is-ramps-not-colors)) "means the palette outgrew its structure, not that the product needs more color."

"Report the inventory before changing anything. Consolidating a palette changes rendered output on screens nobody asked you to touch, so it stays a proposal until the user accepts it."

## Before you finish

[Jakub Krehel, better-colors] The scan table, with the `500` row corrected and oklch-skill's extra rows added (tagged).

| Pattern | Fix |
| --- | --- |
| A hex, `rgb(` or `oklch(` literal in a component file where a token exists | Reuse or add the role token, in the project's notation |
| One `oklch(` value in a codebase otherwise written in hex | Write it in the established notation unless a migration is in scope |
| `var(--blue-600)` or `bg-blue-600` in a component file | Point a semantic token at the primitive and use that |
| A semantic name containing a hue or a component, as in `--color-blue-button` or `--color-sidebar-gray` | Rename it for its role: `--color-accent-solid`, `--color-bg-surface` |
| `--color-primary` and `--color-text-primary` both defined | Rename the brand token `accent` |
| A `border` or `separator` token inside `color:`, or a `text` token inside `background:` | Add a token for the missing role |
| `hsl(` ramp values that differ only in lightness | Rebuild in OKLCH with a constant hue |
| `50` to `200` stepping as far apart in OKLCH `L` as mid-ramp steps do | Tighten the light end to about `0.04` to `0.05` per step |
| One chroma or saturation number copied across every hue's ramp | Use the same proportion of each hue's own maximum |
| A status hue within `15°` of the accent hue | Move it at least `15°` away, or give the destructive action a distinct treatment |
| Dark tokens equal to the light ramp in reverse step order | Lower the accent's chroma, widen the dark end and remeasure every pair |
| Color tokens set under both `prefers-color-scheme` and a `.dark` class | Pick one switching mechanism and use it throughout |
| A contrast fix that changes hue and leaves lightness | Change lightness, the channel contrast responds to |
| `prefers-contrast: more` overriding a color for both appearances in one block | Give each appearance its own increased-contrast value |
| Text on a color with alpha, such as `/50`, `rgba(` or `color-mix(` with `transparent` | Measure the rendered result, or use a solid token |
| `text-white` on a Tailwind `500` fill | Measure it. White fails 4.5:1 on every v3 `500` hue and on nine v3 `600` hues, so `600` is no blanket fix ([PALETTES.md](PALETTES.md#the-solid-fill-under-white-text-measure-it)) |
| `oklch()` chroma beyond sRGB with no sRGB value declared before it | Declare the sRGB value first, then the vivid one inside `@media (color-gamut: p3)` |
| High chroma without gamut check [Jakub Krehel, oklch-skill] | Clamp to max chroma for the L/H in sRGB, keeping L and H |
| A contrast fix that moved L at a fixed C [Jakub Krehel, oklch-skill, corrected] | Re-clamp C to the gamut at the new L, then remeasure |
| Alpha with comma syntax [Jakub Krehel, oklch-skill] | Use slash: `oklch(L C H / alpha)` |

oklch-skill's rows "Hex/rgb/hsl color in new code → Convert to `oklch()`", "Hex in Tailwind v4 `@theme` → Convert to oklch values" and "Dark mode with hand-picked colors → Derive from light palette by reversing L mapping" are left out of the scan: the first two are notation choices (findings versus choices, above) and the third is contradicted by better-colors' reversed-dark row ([DARK-MODE-AND-GAMUT.md](DARK-MODE-AND-GAMUT.md#a-dark-palette-is-not-the-light-one-reversed)).

## Severity

This skill uses the one P0 to P3 scale from [code-review REVIEWER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/REVIEWER.md#tags-and-output). better-colors' three levels map onto it: `HIGH` ("makes content unreadable or assigns a misleading semantic color") is P0 when it blocks the primary task or is a severe accessibility failure, else P1; `MEDIUM` ("a noticeable theme, token or gamut failure") is P2; `LOW` ("isolated polish") is P3.

[Jakub Krehel, better-colors] Three symptoms are P0 or P1 on sight, whatever the surface: body or control text whose rendered pair fails its required ratio, state or meaning carried by color alone, and a semantic color used against its meaning.

## Verification

[Jakub Krehel, better-colors]

- **Without a browser:** token values, the gamut of every declared color, both theme blocks present and contrast computed from the declared token pair.
- **With one:** the background actually rendered behind the text, including opacity and any image beneath it, measured in both light and dark.
- Report every check you could not run as `Not verified`.

## Report

[Jakub Krehel, better-colors] Group findings under the principle each violates, ordered by severity, one row per root cause listing every location it appears in:

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |

`Location` is `path/to/file:line`. `Why` names the principle and the user impact.

- [Jakub Krehel, oklch-skill] "Include **every color that was changed**, not just a subset. Never list findings as separate "Before:" / "After:" lines outside of a table." A row can be a literal (`color: #3b82f6` → `color: oklch(0.623 0.188 259.815)`) or a rule ("Same absolute C across hues" → "Same C% of each hue's max chroma"). "Each row is a self-contained change the developer can act on independently."
- End with `Block` when any P0 or P1 remains (better-colors: any `HIGH`), `Approve` otherwise, leaving the rest in the table as work to do. "Never `Approve` coverage you did not inspect."
- With nothing to report, state "No actionable color findings" and report the verification done.

## Prove it

- The report's every contrast value was measured, with the method named (declared token pair or rendered in a browser), and every check not run is listed as `Not verified`.
- Every finding row has a P0 to P3 severity, a `path:line` location for each place the root cause appears, and a Before and After.
- No row reports a notation, a tinted neutral, a gradient space or the owner's token design as a defect.
- The inventory, when one was asked for, came before any change, and no color was changed without a request.
- The verdict is `Block` if any P0 or P1 row remains.
