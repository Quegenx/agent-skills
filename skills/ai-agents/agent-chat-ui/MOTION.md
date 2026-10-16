# The numbers

Measured from a production agent chat. Match a value by what the motion does. "Standard ease" is cubic-bezier(0.4, 0, 0.2, 1).

| Motion | Value |
|---|---|
| Status line label shimmer | a mask band sweeping left to right in both directions: black, then 35% at the middle, then black, the band widening 2px per letter; mask 250% wide, moved 100% to 0%, 0.9 s a pass, linear, infinite; muted tone (a pending search query shimmers in the default tone) |
| Status icon and label change | morph (icon paths morph, label letters morph), never a swap |
| Work row enters | from blur 4px, opacity 0, scale 0.96; spring, no bounce, 0.35 s |
| Streamed character | opacity 0 and blur 5px to clear, 600 ms fixed in CSS, cubic-bezier(0.23, 1, 0.32, 1), no stagger; the renderer setting is 450 ms (list markers fade with it); the settle time matches the CSS 600 ms |
| Text buffer | rate = waiting / 0.6 s, at least 30 characters a second; finish within 0.4 s; frames capped at 0.1 s |
| Follow-up buttons | from y 6px, blur 4px; 0.1 s apart, only the delay set (the library's default transition) |
| Suggestion chips | from y 3px, blur 4px; 0.1 s apart, only the delay set |
| Placeholder letters | 30 ms apart, 0.3 s each; hold 2 s; out last-first, 12 ms apart, 0.12 s each |
| Message actions (copy, time) | fade in on hover or focus, 150 ms; action icons turn to the foreground color on hover, 150 ms |
| Chat button press | scale 0.96 while pressed and still hovered (`:active:hover`), 150 ms, standard ease, over background, border, color, shadow, opacity and scale; only on hover-capable devices |
| Muted controls (row triggers, card toggles) | muted text to foreground on hover, the shared control transition |
| Collapsible | chevron quarter turn 200 ms, standard ease; panel height 200 ms ease-out from 0 (pad the panel's box, don't margin it) |
| Scroll-to-latest button | hidden: opacity 0, scale 0.95, 16px down; 150 ms ease-out |
| Popups (search, viewer) | fade and scale from 0.95, 100 ms in, shorter out ("exits are quicker: attention has moved on") |
| Hover card | fade and scale from 0.95 rising 8px, 100 ms; exits shrink in place to 0.95 with no drop, 80 ms; every popup grows from its anchor's side (`transform-origin: var(--transform-origin)`) |
| Attachment chip | thumbnail and remove button swap by opacity, 150 ms, standard ease; fill to accent on hover |
| Composer | color 100 ms, standard ease |
| Link preview card | spring stiffness 260, damping 20 from scale 0.6 and 20px down; leans half the pointer's distance from the chip's centre, at most 12px (spring stiffness 100, damping 15); opens after 150 ms, closes after 100 ms; 10px from the chip, 24px collision padding; screenshot fades in 200 ms ease once loaded |
| Markdown links and tables | link hover to opacity 0.8, 200 ms, standard ease; body rows fill accent at 50% on hover |
| Image viewer zoom | 450 ms cubic-bezier(0.33, 1, 0.68, 1), the same as every dialog that grows from a button; close holds opacity to 70% then fades; the dialog's own ending 80 ms |
| Other images in the viewer | from opacity 0, scale 0.9, 0.3 s |
| Side panel | width 200 ms linear (none while resizing); rail hover line border color 150 ms linear |
| Phone drawer | 500 ms cubic-bezier(0.32, 0.72, 0, 1), entering and leaving by `translateY(100%)`; no transition while swiping, the drawer following the swipe distance |
| Sidebar "more" button | opacity 150 ms, standard ease |
| Drop overlay | fade 150 ms |
| Source chip | fade in 300 ms ease-out |
| Waveform | bars 4px wide every 8px, crossing the strip in 5 s, spawned on a time grid of 5 s × 8px / width so the spacing holds at any width; a bar at least 4px tall (silence draws dots) with pill corners; edges fade over 28px; level is the RMS of the time-domain samples (FFT size 1024) sampled every 50 ms, input gain 3.2, noise floor 0.03, curve level^0.55, smoothing 0.35, one bar at most 50% of the height from the last |
| Question option row | fill to a soft accent on hover, 150 ms ease-out |
| Attached image tiles | fade and scale from 0.95, 0.3 s each, 100 ms apart by position among all files; hover ring 200 ms, standard ease |
| Copy confirmation | check icon for 1.5 s |
| Image viewer controls | full-height side strips whose backdrop blur goes from 4px to 12px on hover; on a zoom close they fade at once (150 ms) while the image carries the motion |

## Sizes

| Thing | Size |
|---|---|
| Conversation column | at most 48rem; content padding 0 20px 16px |
| Bottom composer | sticky, `calc(100% - 1.5rem)` wide, bottom margin `max(clamp(0.75rem, 0.3333rem + 1.4583cqi, 1rem), env(safe-area-inset-bottom))` |
| Composer | at most 47.5rem, corners 22px, padding 8 to 12px with the width, 24px backdrop blur, shadow from a 32rem container; file row gap 8px; text padding 8px 8px 0, line height 1.5; footer gap 6px, 12px above; error line 13px |
| Text box | 4rem to 12rem tall, 16px text |
| Placeholder | 8px from the top and the start, 16/24 muted |
| Attachment chip | 32px tall, corners 10px, secondary fill, padding 6/8px, 20px thumbnail with 6px corners, 14px remove icon, the name ellipsed |
| Attachment hover card | corners 10px, 8px padding, a 1px ring of foreground at 10% plus a small shadow; image 20rem wide, at most 24rem tall, contained, bordered, corners 10px; opens below at the start, 4px off |
| Queued messages | 13px muted, each a muted pill with 12px corners and a 16px icon |
| Recording strip | pill, 13px, tabular timer, canvas 24px tall in the primary color |
| Drop overlay | background at 50%, 4px blur, 48px icon, 18px title weight 500 |
| User bubble | at most min(75ch, 85%), corners 18px, padding 12/16px, secondary fill, `pre-wrap`, 16px above the message; the answer has 8px below |
| Message actions | icons 18px; the answer's row sits 6px outward, adjacent buttons 4px closer; time 12px |
| Image tile | 96px, primary at 5% as the placeholder fill, a hover ring of 2px gap and 2px primary |
| Document tile | a square `clamp(6rem, 2.6667rem + 16.6667cqmin, 8rem)`, corners 10px, muted fill, 24px icon, type line weight 400 |
| Image viewer | image at most 70dvh, corners 10px; nav circles 2.5 to 3rem, corners 14px, background at 50% with 12px blur, icons 1.5 to 1.75rem; close 40px round, 20px icon |
| Buttons | 40px, icon 20px; small 36px; corners 14px; icon-medium 36px with 10px corners, icon-extra-small 28px with 8px corners and a 14px icon; default icon 16px; label 14px weight 600; disabled at 50%; hover by mixing to 80%; outline is a gray fill with no ring |
| Minimum hit area | 40 by 40px, 44 by 44px on coarse pointers, grown with a transparent `::before` that never overlaps a neighbour's |
| Badges | query pill padding 6/12px, muted until done, then the secondary foreground; icons 12px |
| Cards (approval, question) | corners 14px, card surface, 16px padding, 12px gap; title 16px weight 500; details 14px muted; actions wrap with an 8px gap |
| Question option row | full width, at least 44px tall, corners 10px, padding 8/12px, 10px gap, secondary fill, a 24px round number on the card surface, muted, 12px weight 500 |
| Tool row | 14px label muted, 16px icon, 8px gap, label ellipsed; the log and sources lines 8px gap, 8px above |
| Favicon stack | 16px round, a 2px ring in the background color, each overlapping the last by 6px |
| Plan | ring 12px with a 1.5px border, primary border in progress, filled primary when done; in-progress text foreground weight 500, others muted; 14px text, steps 6px apart |
| Result lists | at most 22.5rem tall, scrolling, overscroll contained; card surface, corners 14px; rows 12/16px with 1px dividers; meta line 12px, 6px gap; outward arrow 12px |
| Result rows with text | text 13px clamped to 2 lines; a listing's 56px thumbnail with 10px corners on a muted fill, 20px fallback icon |
| Markdown | blocks 16px apart; headings 24px above, 8px below, weight 600 (h4 18/28, h5 16/24, h6 14/20, h1 to h3 fluid); lists 14px start padding, markers inside, nested 24px, items 4px apart (2px bulleted), bullets muted at 30%; inline code 14px mono, corners 4px, muted fill, 2/6px; quote a 4px start border muted at 30%, 16px padding, italic, muted; rule 1px with 24px margin; table header muted at 80%, header cells 10/16px, cells 12/16px, no wrap; code block corners 10px, card surface, 12/20px, 14/20 text |
| Source chip | pill, muted fill, 12px weight 500, line 20px, padding 1px by 4/8px, 4px inline margin, 14px round favicon |
| Link preview card | min(12.5rem, 100vw - 3rem), screenshot 200:125 with 10px corners on a muted fill; corners 14px, 4px padding, shadow 0 12px 36px ink at 0.2; host line 12px weight 500, ellipsed |
| Breathing room under the last exchange | 20px on a narrow chat, 80px from 32rem; scroll button 16px above the bottom |
| Chat title | name 32px tall, 8px corners, 8px inline padding, chevron 28px with a 14px icon, 1px apart, accent on hover; rename field at least 3rem |
| Conversation name | at most 120 characters |
| Chat search | at most 36rem wide (`calc(100% - 2rem)`), list 26.25rem tall, field 52px; corners 14px; options corners 10px, padding 12px; 18px icons, 12px time |
| Sidebar chat rows | "more" button 32px round with a 20px icon, the row reserving 40px at its end |
| Side panel | 30rem by default, dragged between 320 and 720px, 8px padding, corner toward the chat 1.5rem; rail grip a 10 by 32px pill; phone drawer at most 85dvh, top corners 10px, handle 100 by 8px, 16px above |
| Empty state | heading `clamp(1.5rem, 0.25rem + 6.25cqi, 2.25rem)` weight 400, tracking -0.025em, the mark 1em (36px image) nudged up 0.3em; chips row at most 42rem, chip text 14px weight 500, icon in primary |

Fluid sizes use container-query units (`cqi`) of the chat, not the viewport: the chat shares the screen with a sidebar and a side panel, so a `clamp()` against the chat's own width (8px padding in a 20rem chat to 12px at 32rem) keeps it right at every layout. A clamp can also shrink with the width (`clamp(0.5rem, 2rem - 6.25cqi, 0.75rem)`: 12px at 20rem down to 8px at 24rem). Only a surface that fills the screen (the image viewer) sizes by the viewport (`vi`). The 32rem step is the viewport breakpoint minus the 16rem sidebar. One linear line height, `calc(0.6667em + 1rem)`, fits every type step.

Put every hover style inside `@media (hover: hover)`, not only the press, and reveal on focus with `:focus-within`.

Under reduced motion: Motion components drop movement and keep their opacity and blur fades (`MotionConfig reducedMotion="user"`); every CSS transition and animation is dropped, pure fades included, so popups, hover cards, actions and chips appear at once; stop the text buffer, the shimmer (its band rests off the text) and the waveform; and where code waits for an end event (`animationend`, an unmount after an exit), use a near-instant 1ms instead of none so it still fires.
