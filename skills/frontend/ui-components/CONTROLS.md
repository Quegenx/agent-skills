# Controls

## Icons

- **One map from meaning to artwork** (`send`, `close`, `trash`, `status-done`): callers name the meaning, so changing the artwork is one line and two screens never pick different trash cans. Decorative icons `aria-hidden`; size from CSS; stroke `currentColor`.
- **Optical padding:** the icon side of a button gets about 2px less padding than the label side (mark it with `data-icon="inline-start|end"`); icon-only buttons stay square.
- **Swapping one icon for another** (copy becomes check): the old shrinks to .25 with a 4px blur and fades while the new grows in, both in one grid cell, on a short spring with no bounce (about .3s); nothing animates on first render. Use one grid cell, not `popLayout`, which places by left offset and slides sideways in right-to-left.
- **An icon that morphs between shapes** (eye to eye-off, a pulsing dot into a check) needs real paths with matching structure; draw a dot as a short path with a thick stroke so it can thin into any icon.

## Buttons

- **Variants:** primary, soft (a lighter brand tint for the second action beside a primary), secondary (ink 5% tint), surface (card color, for gray strips), ghost, destructive, destructive-soft (red text on a 10% red tint, for every remove and clear), link. Sizes by name, exposed as `data-variant` and `data-size`.
- **The link form shares the styles:** `ButtonLink` renders an `<a>` with the button's classes through a render prop or `asChild`. Never wrap a button in a link or a link in a button (two tab stops, invalid HTML).
- **Hover and press as an overlay layer** (`::after` at ink 5%, 8% pressed; white 14% on primary) that appears instantly and fades out over 200ms, so the response is immediate and the release is soft.
- **Squishy press on round and icon buttons:** hover scale 1.012; pressed `scale(1.07, .91)` in 70ms, back over 120ms ease-out. Text buttons shift tone only.
- **Disabled primary stays recognisably primary** (the brand color mixed 40% with the background), so the main action still reads as the main action; other variants take the disabled surface and text. A disabled link drops pointer events; a native disabled button doesn't need to.
- **A text link's underline grows** from the reading start as a 2px background gradient (it works with ellipsis, a `::after` does not), leaves toward the far side on hover-out, 300ms ease-out, mirrored in right-to-left; hovering the whole row can trigger its title link's line.
- **Pending keeps the label and morphs it:** see [STATES.md](STATES.md).

## Text that changes

A component that morphs text from one value to the next (letters slide and fade into place) is the default for any label, count or title that changes: the width changes smoothly and nothing beside it jumps.

- **Lazy:** render plain text until the value first changes. Measuring every character on mount forces a layout per instance; a table of them can spend a second before it paints.
- **Wait one frame after the first render** before the first morph, or the first change snaps.
- **Numbers in their own left-to-right root with tabular figures.** In a right-to-left sentence, digit blocks otherwise lay out reversed (26 becomes 62 mid-morph).
- **Split text with numbers into runs** and key slots by position, so "3 of 26" to "4 of 26" morphs only the 3.
- **A translated message with live numbers:** render each number parameter as a private-use marker, split the translated string on the markers, and put rolling numbers back in their places, so the translation keeps its own word order.
- Split text into letters with `Intl.Segmenter` (graphemes), so emoji, flags and pointed Hebrew letters stay whole.
- Respect reduced motion (instant swap). For a paragraph that wraps, use two texts in one grid cell and crossfade instead ([STATES.md](STATES.md)).

## Fields

- **A field is a fill, not a border:** the field color, no border, 1rem text at 500 weight, placeholder at 400 in the muted color. Invalid: a 1px red border plus the message. Disabled: the page color with disabled text.
- **Inputs under 16px get 1rem on touch screens** (iOS zooms otherwise); never disable zoom.
- **Autofill keeps the field's surface:** transition `background-color` and `color` over 600000s and set `-webkit-text-fill-color` to the foreground.
- **Textareas** start at `min-block-size: 4lh`, grow with `field-sizing: content`, resize vertically. Show `n/max` beside the label when there is a limit.
- **`dir="auto"` on inputs** that take handles, emails or mixed scripts, so `@name` keeps its symbol in place; keep `text-align: start` of the page.
- **The right input attributes:** `type="url" inputMode="url" autoComplete="url" dir="ltr"` for a website; `inputMode="numeric" autoComplete="one-time-code"` for a code; `username` and `current-password` on sign-in, `new-password` with min and max length on sign-up.
- **Errors under the field:** one error as text, several as a list, deduplicated, `role="alert"`; the description and the error share one `aria-describedby` id, the error replacing the hint, so the reference never dangles.
- **Horizontal fields** (checkbox, switch, radio) put the label 8px from a 24px control whose box is drawn 2px inside; more gap reads as detached.

## Password field

The show/hide button appears only once the field has text; `pointerdown` calls `preventDefault` so focus stays in the input; one icon morphs between the two eyes; `aria-pressed` and a label that says what pressing does.

## Number input

`−` and `+` beside the number instead of native spin arrows (holding repeats, arrow keys step, min and max clamp on blur, so only a valid value is ever saved). The number rolls when stepped; the input's own text shows only while the user types (set a typing flag on `beforeinput`, clear it on pointer-down on a stepper). Empty means "no limit", with a placeholder that says so ("No minimum").

## Search input

A pill with the icon at the start and the native cancel hidden. A round tinted `×` springs in once there is text (opacity and scale from .5, short spring) and out when empty. Clearing must look like typing to the framework:

```ts
// clearSearchInput: set the value through the native setter and fire an input event,
// so a controlled React input updates its state exactly as if the user had deleted the text
const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
setValue?.call(input, "");
input.dispatchEvent(new Event("input", { bubbles: true }));
input.focus();
```

## Checkbox

A 20px box in a 24px target, 2px border at ink 40% (70% on hover while unchecked only). Checking turns the border to the brand color at once (easing from the dark hover gray passes through a muddy near-black) while the fill eases in; the tick then draws as a stroke (`pathLength` 0 to 1 over .2s, starting after the fill); unchecking erases it. The box squishes to .96 on press with a stiff spring. Indeterminate draws a dash the same way. Reduced motion: instant. Use the same mark in multi-select menu rows.

## Switch

A 44 by 24 track; the thumb placed by its center so it can grow in place: a 12px dot off, an 18px circle on, stretching into a pill at the start of its 300ms travel and settling by about 80% of it. The slide eases out with a slight overshoot; the track fades its color, not its opacity (the thumb sits inside); pressing swells the thumb. Right-to-left mirrors the travel. Disabled at about .3 opacity.

## Segmented tabs

A white pill on a tinted track springs to the chosen tab and stretches with its speed (narrower and taller as it travels, back to shape as it lands); the track squashes slightly while pressed. Details that make it work:

- The pill mounts only after the first measurement; until then the chosen tab draws its own pill, so there is never a track with no selection.
- Only a user's pick springs it. A saved value arriving, a reset, or a resize places it instantly.
- On a card the track takes the page color and the pill a gray tint.
- When a pick triggers a page-covering transition (a theme reveal, a language swap), let the pill land first (about 250ms), then apply.

## Tooltips

- **80ms intent delay, not the 600ms default:** long enough to ignore a cursor passing over, short enough to feel instant. Opens on a spring from 60% scale and 8px toward the trigger, fades out in 100ms.
- **A wrapper that turns any element into its trigger** and keeps the element's own props; icon-only buttons always get one.
- **Never the native `title`:** it doesn't animate, doesn't match, and doesn't show on touch.
- A tooltip whose trigger sits on something a view transition will cover needs a close delay as long as the transition: the pointer "leaves" onto the transition overlay and a tooltip closing synchronously then cancels the transition.

## Badges, counts and avatars

- Badges keep their label in its own span; a count is a 19px circle for one digit and a pill beyond, tabular figures, `99+` with the full number in the accessible label. Result counts stay exact (no "20+").
- A score or status badge says its tone in words too (screen-reader text and a tooltip), not by color alone.
- Avatars: fixed sizes, the radius token, `object-fit: cover`, the image outline, a fallback (initial or icon) for missing and failed images; `loading="lazy"` in lists and eager in headers; `referrerPolicy="no-referrer"` for remote photos. An avatar can be generated from the user id, so it never needs storage.
