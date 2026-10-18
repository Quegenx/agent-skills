# Controls

## Icons

- **One map from meaning to artwork** (`send`, `close`, `trash`, `status-done`): callers name the meaning, so changing the artwork is one line and two screens never pick different trash cans. One stroke set at 1.5px. Decorative icons `aria-hidden`; size from CSS; stroke `currentColor`.
- **An icon that carries meaning** (a public globe, a platform mark) gets screen-reader text and a tooltip. An unknown value drops its icon rather than showing a blank one.
- **Optical padding:** the icon side of a button gets about 2px less padding than the label side (mark it with `data-icon="inline-start|end"`); icon-only buttons stay square.
- **Swapping one icon for another** (copy becomes check): the old shrinks to .25 with a 4px blur and fades while the new grows in, both in one grid cell, on a short spring with no bounce (about .3s); nothing animates on first render. Use one grid cell, not `popLayout`, which places by left offset and slides sideways in right-to-left.
- **An icon that morphs between shapes** (eye to eye-off, a pulsing dot into a check) needs real paths with matching structure, on a snappy spring with `reducedMotion="user"`; color eases over .3s and `stroke-width` over .35s, both ease-out. Draw a dot as a short path with a thick stroke so it can thin into any icon: a 9-unit stroke on a 1.5-unit circle (8px at 16px), pulsing `1.2s ease-in-out infinite` (opacity .8 to 1, scale 1 to 1.5). Reduced motion stops the pulse and the morph.
- **Status glyphs** share one size (1rem, .875rem in a card head): a dashed circle for not started, a half-filled circle while running, a plain circle when paused, a check when done.
- **Priority glyph** on a 16 by 16 box: none is three 3 by 1.5 dashes (rx .5, opacity .9, muted); low, medium and high are three bars 3 wide at heights 6, 9 and 12 (rx 1), filled up to the level with the rest at `fillOpacity` .4; urgent is a rounded square holding "!".

## Buttons

- **Variants:** primary, soft (a lighter brand tint for the second action beside a primary), secondary (ink 5% tint), surface (card color, for gray strips), ghost, destructive, destructive-soft (the solid button's red as text on a 10% red tint, turning solid red once it asks to confirm, for every remove and clear; see [TOKENS.md](TOKENS.md)), table-link (soft brand text, no wrap, for a link inside a cell), sidebar (the sidebar's accent), link (muted text with a plain underline). Sizes by name, exposed as `data-variant` and `data-size`. Keep stock names as aliases (`outline` is secondary, `xs` is `sm`, every `icon-*` size is the one 40px icon size), so a pasted call site still lands on the system.
- **Sizes:** default a 2.5rem pill; small 2.25rem with .875rem padding and .875rem text; large 3rem with 1.0625rem padding and 1.1765 line height. An icon button is 2.5rem with a 1.25rem glyph; a glyph beside a label is 1rem.
- **Labels wrap instead of overflowing** (`white-space: normal; overflow-wrap: anywhere; max-inline-size: 100%`) and are `user-select: none`; inside a table cell a button keeps one line at `max-content`.
- **The link form shares the styles:** `ButtonLink` renders an `<a>` with the button's classes through a render prop or `asChild`. Never wrap a button in a link or a link in a button (two tab stops, invalid HTML).
- **Hover and press as an overlay layer** (`::after` at ink 5%, 8% pressed; white 14% on primary) that appears instantly and fades out over 200ms, so the response is immediate and the release is soft. Menu rows and the dialog close reuse the same layer; disabled suppresses it.
- **Every button squishes,** text buttons included, and so do filter chips, the dialog close and the avatar button: hover scale 1.012; pressed `scale(1.07, .91)` in 70ms, back over 120ms ease-out. Reduced motion sets `scale: none` and `transition: none` on every squishing control.
- **Disabled primary stays recognisably primary** (the brand color mixed 40% with the background), so the main action still reads as the main action; other variants take an ink 5% fill with muted text. A disabled link drops pointer events; a native disabled button doesn't need to.
- **A text link's underline grows** from the reading start as a 2px background gradient (it works with ellipsis, a `::after` does not), leaves toward the far side on hover-out, 300ms ease-out, mirrored in right-to-left, while the text turns the brand color over the same 300ms; reduced motion has no transition. Hovering the whole row can trigger its title link's line. A link inside muted text (an empty state) is foreground at weight 600 at rest, since it has no line until hovered. A found item's title link in a result row takes a plain `text-decoration: underline` on hover.
- **A save toggle** is primary while off; once on it turns secondary and reads "Saved", a done state that can still be pressed to undo. It carries `aria-pressed`, a label that says what pressing does, and a pending label by direction ("Saving…" or "Removing…").
- **Pending keeps the label and morphs it:** see [STATES.md](STATES.md).

## Text that changes

A component that morphs text from one value to the next (letters slide and fade into place) is the default for any label, count or title that changes: the width changes smoothly and nothing beside it jumps.

- **Lazy:** render plain text until the value first changes. Measuring every character on mount forces a layout per instance; a table of them can spend a second before it paints. Give the plain text the morph root's exact box (`relative inline-block align-top whitespace-nowrap`), so nothing moves at the handover.
- **Wait one frame after the first render** before the first morph, or the first change snaps.
- **Pass the app's locale** to the morph library (it defaults to English), and set its reduced-motion flag last so no caller can switch it off: reduced motion swaps instantly.
- **Numbers in their own left-to-right root with tabular figures.** In a right-to-left sentence, digit blocks otherwise lay out reversed (26 becomes 62 mid-morph). A purely numeric value (`/^[\d\s.,/%+-]+$/`, such as "3 / 26" or "0/250") morphs as one such root.
- **Split text with numbers into runs** and key slots by position, so "3 of 26" to "4 of 26" morphs only the 3. Leading and trailing whitespace stays outside the morph.
- **A translated message with live numbers:** render each number parameter as a private-use marker, split the translated string on the markers, and put rolling numbers back in their places, so the translation keeps its own word order.
- **User text inside a translated sentence:** split the message in two (`…_before`, `…_after`) and put the user text in its own `<bdi>` between them. Where the sentence must stay one string (an `aria-label`, a message parameter), wrap the user text in FSI and PDI (`⁨…⁩`), so a quoted keyword in the other script keeps its quotes.
- Split text into letters with `Intl.Segmenter` (graphemes), so emoji, flags and pointed Hebrew letters stay whole.
- For a paragraph that wraps, use two texts in one grid cell and crossfade instead ([STATES.md](STATES.md)).

## Fields

- **A field is a fill, not a border:** the field color, no border, 1rem text at 500 weight, padding .75rem 1rem, line height 1.2941, radius 1rem; placeholder at 400 in the muted color. Focus adds no border, outline or shadow ([TOKENS.md](TOKENS.md), Focus). Invalid: a 1px red border plus the message, and `data-invalid` on the field turns its label red too. Disabled: the page color with disabled text, the whole field at .5 opacity. The description is `type-card-meta` muted; a link in it turns the brand color on hover.
- **Inputs under 16px get 1rem on touch screens** (iOS zooms otherwise); never disable zoom.
- **Autofill keeps the field's surface:** transition `background-color` and `color` over 600000s, and set `-webkit-text-fill-color` and `caret-color` to the foreground.
- **Textareas** start at `min-block-size: 4lh` (a long details box at 9rem with .875rem text), grow with `field-sizing: content`, resize vertically. A settings textarea carries its limit as `maxLength` (1000) with no counter; a short name field (a rename) shows `n/max` beside its label, the count morphing.
- **Typed direction:** with no letter yet (an empty box, or only digits and spaces) the browser falls back to left-to-right and puts the caret on the wrong side of a right-to-left page. Use the page's direction until a letter (`\p{L}`) is typed, then the text's own (`dir="auto"`), so `@name` keeps its symbol in place. `text-align: start` on such an input follows the input's resolved direction, so keep the page's alignment with a page-keyed rule (`text-align: right` on a right-to-left page, `[dir=ltr] & { text-align: left }`).
- **The right input attributes:** `type="url" inputMode="url" autoComplete="url" dir="ltr"` and the placeholder `https://` for a website; `inputMode="numeric" autoComplete="one-time-code"` with `maxLength={16}` for a code; `autoComplete="name"` or `"organization"` at 120 characters; `username` and `current-password` on sign-in, `new-password` on sign-up. Every text field gets a `maxLength` the server also enforces (an email 320, short text 300, a textarea 1000).
- **Rules match the server's schema:** an email by a practical pattern, not RFC 5322; a password 15 to 72 characters on sign-up and reset (NIST SP 800-63B-4's minimum for a password that is the only factor, plus its blocklist check; see [AUTH.md](AUTH.md); before: 6), with the minimum in its label, while sign-in only checks it is not empty; names trimmed, 1 to 120.
- **Placeholders are example answers,** never the label repeated.
- **Validate on submit:** `noValidate` on the form, the same schema as the server, the first issue per field. Focus the first invalid field; clear its error on the first keystroke that makes it valid; point `aria-describedby` at the error only while it is invalid.
- **Errors under the field:** one error as text, several as a list, deduplicated, `role="alert"`; the description and the error share one `aria-describedby` id, the error replacing the hint, so the reference never dangles.
- **Enter inside a field that does its own job** (a lookup, an add-tag box) calls `preventDefault`, so the outer form doesn't submit, and runs that job.
- **A lookup field** (find a place by name): Enter or a "Locate" button whose label morphs while it runs; the first result is picked automatically, then a select offers "All" plus the results; the hint line becomes "none found" after an empty lookup (`aria-live="polite"`).
- **Horizontal fields** (checkbox, switch, radio) put the label 8px from a 24px control whose box is drawn 2px inside; more gap reads as detached. A native radio is 1.5rem with `accent-color` set to the brand.

## Form layout

- **Groups are `fieldset` plus `legend`.** Gaps: 1.5rem between fields, `ui-sm` in a checkbox group, .75rem in a radio group.
- **Short fields sit in pairs** once each gets 12rem, with no query: `repeat(auto-fit, minmax(min(100%, 12rem), 1fr))`. Textareas, checkbox groups and a field left alone on its row span the full row.
- **A multi-choice of short options** is a wrapping row of horizontal checkboxes (1.5rem across, .75rem down) under a label-style legend.
- **Repeated labels across groups** (every group has "Daily limit") get an `sr-only` prefix naming their group, so screen readers can tell them apart.
- **Choice cards:** a label that wraps a field becomes a 1rem-radius bordered card with 1rem padding; hover takes the field color at 40%; checked takes a brand border at 30% and a brand fill at 5% (20% and 10% in dark).
- **A choice row that leads somewhere** ends in a chevron pointing to the reading end.
- **A field the plan gates** renders only once the plan is known to include it (`plan !== null && …`, `plan?.feature === true`), so it appears after the plan loads; a sidebar row gated the same way does the reverse ([MENUS.md](MENUS.md)).

## Password field

The show/hide button appears only once the field has text (track it with `onInput`, so the input can stay uncontrolled); `pointerdown` calls `preventDefault` so focus stays in the input; one icon morphs between the two eyes at stroke 1.75; `aria-pressed`, a tooltip and a label that says what pressing does. It is a 2rem round button inset .75rem from the end, with a 1.25rem icon.

## Number input

`−` and `+` beside the number instead of native spin arrows (holding repeats, arrow keys step, min and max clamp on blur, so only a valid value is ever saved). The number rolls when stepped, formatted with `Intl.NumberFormat` so it matches the input's own text; the input's text shows only while the user types (set a typing flag on `beforeinput`, clear it on pointer-down on a stepper). Empty means "no limit", with a placeholder that says so ("No minimum").

- **One field-colored pill** with .25rem padding and gap; steppers are 2.25rem round with a 1.125rem glyph, hover ink 6%, press ink 10%, 150ms ease-out. Small: 1.75rem steppers, .875rem glyph, small text. Disabled: the group takes the page color.

## Search input

A pill with the icon at the start and the native cancel hidden. The whole pill is the `<label>`, so a click on the icon focuses the input. A round tinted `×` springs in once there is text (opacity and scale from .5, short spring) and out when empty, and hides while the input is disabled. Clearing must look like typing to the framework:

```ts
// clearSearchInput: set the value through the native setter and fire an input event,
// so a controlled React input updates its state exactly as if the user had deleted the text
const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
setValue?.call(input, "");
input.dispatchEvent(new Event("input", { bubbles: true }));
input.focus();
```

- **Values:** min height 2.5rem (small 2.25rem with .375rem padding), radius 3.125rem, icon padding-start .75rem; input padding .4375rem / .5625rem block and .5rem inline, at .9375rem and weight 400 (lighter than fields); the clear button 1.5rem with a .875rem glyph, muted to foreground on hover; disabled at .5 opacity. In a toolbar the search is `clamp(13rem, 41cqi, 18rem)` wide on the secondary tint.
- **Recent and trending queries** can sit under the search. Record each search fire-and-forget (trimmed, 1 to 200 characters, blanks skipped) and refetch the suggestions after; a failed record or a failed read shows nothing, never an error.

## Checkbox

A 20px box with 6px corners in a 24px target, 2px border at ink 40% (70% on hover while unchecked only). Checking turns the border to the brand color at once (easing from the dark hover gray passes through a muddy near-black) while the fill and colors ease in over 500ms; the tick then draws as a stroke (`pathLength` 0 to 1 over .2s, starting after the fill); unchecking erases it. The mark is a 14px SVG, stroke 3.5, path `M4.5 12.75l6 6 9-13.5`. The box squishes to .96 on press with a stiff spring (520, 36, .35), none while disabled. `aria-invalid` gives a red border; disabled sits at .5 opacity. Indeterminate draws a dash the same way. Reduced motion: instant. Use the same mark in multi-select menu rows, where there is no hover border to pass through, so the box may ease background, color and border together over 500ms.

## Switch

A 44 by 24 track; the thumb placed by its center with logical properties (`inset-inline-start` .75rem off, 2rem on, centered with `translate`) so it can grow in place: a 12px dot off, an 18px circle on, 21px while pressed, stretching into a pill at the start of its travel and settling by about 80% of it. The slide runs 300ms on `cubic-bezier(.175, .885, .32, 1.275)` (a sanctioned overshoot); size changes take 100ms ease-out. The track fades its color, not its opacity (the thumb sits inside). Right-to-left mirrors the travel. Disabled at .28 opacity.

## Segmented tabs

A white pill on a tinted track springs to the chosen tab and stretches with its speed (narrower and taller as it travels, back to shape as it lands); the track squashes slightly while pressed. Details that make it work:

- **Values:** the track is the muted fill with .25rem padding; a tab is at least 2.25rem by 2rem with .75rem inline padding, .375rem gap and `type-label-sm`; the pill takes `--shadow-xs`. Labels use `text-wrap: balance`, so they wrap at 320px instead of overflowing.
- **Motion:** the pill on a spring of 420, 32, 1; at up to 1000px/s it narrows by up to 35% and grows up to 21% taller; the track squashes to `scaleX(1.03) scaleY(.94)` on a spring of 500, 20 while pressed.
- The pill mounts only after the first measurement; until then the chosen tab draws its own pill, so there is never a track with no selection.
- Only a user's pick springs it, by pointer or keyboard. A saved value arriving, a reset, or a resize places it instantly.
- On a card the track takes the page color and the pill ink 8% with no shadow.
- Icon-only tabs (board or list) each carry an `aria-label` and a tooltip.
- When a pick triggers a page-covering transition (a theme reveal, a language swap), let the pill land first (about 250ms), then apply.

## Tooltips

- **80ms intent delay, not the 600ms default:** long enough to ignore a cursor passing over, short enough to feel instant. Opens on a spring from 60% scale and 8px toward the trigger (the rise flips with the side), exits to .9 scale over 100ms ease-out.
- **Inverted colors** (foreground fill, background text), the 2xl radius, .375rem by .75rem padding, xs text, at most 20rem wide, 4px from the trigger, with a 10px rotated-square arrow at 2px radius.
- **A wrapper that turns any element into its trigger** (a button, a `<time>`, a truncated name, a short failure line whose tooltip holds the full error) and keeps the element's own props; hovered, or focused, it shows the label. Icon-only buttons always get one.
- **The wrapper replaces the native `title`,** which doesn't animate or match the app. A row's small stack of site favicons carries the site's name in `alt` and `title`.
- A tooltip whose trigger sits on something a view transition will cover needs a close delay as long as the transition: the pointer "leaves" onto the transition overlay and a tooltip closing synchronously then cancels the transition.

## Badges, counts and avatars

- **Badges keep their label in its own span.** A count is a 19px circle for one digit and a pill beyond, .8125rem at 500, tabular figures. A tag is .5rem radius, .125rem by .5rem padding, `type-label-xs`, no wrap. A status badge is 1.5rem tall at weight 600 with .625rem padding.
- **Count badges cap at `99+`,** the number alone in its own span. Inside a sentence a rounded total is written out in words ("More than 90"): a `+` beside a number in running right-to-left text lands on the wrong side. Result counts stay exact (no "20+"). A rounded value keeps an approximate marker (`≈`) until the exact one loads.
- **A score or status badge says its tone in words too** (screen-reader text and a tooltip), not by color alone: a score reads "match score", the number, then "· high".
- **Removable pills:** the `×` is 1.25rem with a .75rem glyph, ink 8% at rest and 14% while its pill is hovered, `margin-inline-end: -.375rem`. A picked pill with an avatar gets .25rem padding on the avatar side and .75rem on the other.
- **Tag pickers:** preset tags are toggle pills (`aria-pressed`), custom tags are pills with a `×`. Pills are 2rem tall with .625rem radius; a chosen one mixes the brand 10% into the card with brand text, its `×` at brand 12% (22% on hover). Custom pills enter and leave at scale .8 with opacity on a spring (.3s, no bounce) in `AnimatePresence mode="popLayout"`, so a leaving pill is lifted out at once while the pills after it glide into its place with `layout`. The add box trims and skips duplicates; its "+" is secondary and disabled while empty, primary once there is text.
- **Avatars:** people are round, things (a group, a workspace) take the radius token. Sizes 2.5rem in tables, lists and posts, 3rem in a detail header, 2rem on comments. `object-fit: cover`, the image outline, `loading="lazy"` in lists and eager in headers, `referrerPolicy="no-referrer"` for remote photos. For a missing or failed image show the name's first character (`name?.slice(0, 1) ?? "?"`), or a head-and-shoulders silhouette (card fill on the muted color mixed 40% into the card); an empty placeholder keeps the circle when there is no photo at all. An avatar can be generated from the user id, so it never needs storage.

## Numbers, dates and user text

- **One `Intl` formatter per locale,** built once and picked by the page's locale at render. Resolve the locale when formatting, never at module load: on the server one module serves both languages.
- **Numbers:** counts `toLocaleString(appLocale)`; engagement counts `notation: "compact"` with one fraction digit; money `style: "currency"` with no fraction digits, an estimate as a low to high range; one dash glyph (U+2014) for none or unavailable.
- **Dates in `<time dateTime={iso}>`:** a short visible form (`{month: "short", day: "numeric"}` on cards, `dateStyle: "medium"` with `timeStyle: "medium"` on posts) and the full one (`dateStyle: "full"`, `timeStyle: "long"`) in a tooltip; `suppressHydrationWarning` where the server and browser format differently.
- **Relative time** with `Intl.RelativeTimeFormat` and `numeric: "auto"` ("yesterday"), in the largest whole unit (year 31,536,000 s, month 2,592,000 s, day, hour, minute); anything under a minute is `format(0, "minute")`.
- **Plural forms in the messages,** not in code: one, many and "at least" per unit.
- **Separators:** an `aria-hidden` " · " span with `white-space: pre`, so its spaces survive inside flex.
- **User text with several lines:** `dir="auto"`, `white-space: pre-wrap`, `overflow-wrap: anywhere`, `text-wrap: pretty`.
