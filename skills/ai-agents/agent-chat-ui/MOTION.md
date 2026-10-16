# The numbers

Measured from a production agent chat. Match a value by what the motion does.

| Motion | Value |
|---|---|
| Status line label shimmer | a mask band at 35% sweeping across, 0.9 s a pass, linear; band widens 2px per letter |
| Status icon and label change | morph (icon paths morph, label letters morph), never a swap |
| Work row enters | from blur 4px, opacity 0, scale 0.96; spring, no bounce, 0.35 s |
| Streamed character | opacity 0 and blur 5px to clear, fixed 600 ms, cubic-bezier(0.23, 1, 0.32, 1), no stagger |
| Text buffer | rate = waiting / 0.6 s, at least 30 characters a second; finish within 0.4 s; frames capped at 0.1 s |
| Follow-up buttons | from y 6px, blur 4px; 0.1 s apart |
| Suggestion chips | from y 3px, blur 4px; 0.1 s apart |
| Placeholder letters | 30 ms apart, 0.3 s each; hold 2 s; out last-first, 12 ms apart, 0.12 s each |
| Message actions (copy, time) | fade in on hover or focus, 150 ms |
| Chat button press | scale 0.96 while pressed, 150 ms, standard ease; only on hover-capable devices |
| Collapsible | chevron quarter turn 200 ms; panel height 200 ms ease-out from 0 (pad the panel's box, don't margin it) |
| Scroll-to-latest button | hidden: opacity 0, scale 0.95, 16px down; 150 ms ease-out |
| Popups (search, viewer) | fade and scale from 0.95, 100 ms in, shorter out ("exits are quicker: attention has moved on") |
| Hover card | fade and scale from 0.95 rising 8px, 100 ms |
| Link preview card | spring stiffness 260, damping 20 from scale 0.6 and 20px down; leans up to 12px toward the pointer (spring stiffness 100, damping 15); opens after 150 ms, closes after 100 ms |
| Image viewer zoom | 450 ms cubic-bezier(0.33, 1, 0.68, 1), the same as every dialog that grows from a button; close holds opacity to 70% then fades |
| Other images in the viewer | from opacity 0, scale 0.9, 0.3 s |
| Side panel | width 200 ms linear (none while resizing) |
| Phone drawer | 500 ms cubic-bezier(0.32, 0.72, 0, 1); no transition while swiping |
| Drop overlay | fade 150 ms |
| Source chip | fade in 300 ms ease-out |
| Waveform | bars 4px wide every 8px, crossing the strip in 5 s; edges fade over 28px; level is the RMS of the time-domain samples (FFT size 1024) sampled every 50 ms, input gain 3.2, noise floor 0.03, curve level^0.55, smoothing 0.35, one bar at most 50% of the height from the last |
| Question option row | fill to a soft accent on hover, 150 ms ease-out |
| Attached image tiles | fade and scale from 0.95, 100 ms apart |
| Copy confirmation | check icon for 1.5 s |
| Image viewer controls | full-height side strips whose backdrop blur goes from 4px to 12px on hover; on a zoom close they fade at once (150 ms) while the image carries the motion |

## Sizes

| Thing | Size |
|---|---|
| Conversation column | at most 48rem |
| Composer | at most 47.5rem, corners 22px, padding 8 to 12px with the width, 24px backdrop blur |
| Text box | 4rem to 12rem tall, 16px text |
| User bubble | at most min(75ch, 85%), corners 18px |
| Buttons | 40px, icon 20px; small 36px; corners 14px |
| Minimum hit area | 40 by 40px, 44 by 44px on coarse pointers, grown with a transparent `::before` that never overlaps a neighbour's |
| Result lists | at most 22.5rem tall, scrolling, overscroll contained |
| Breathing room under the last exchange | 20px on a narrow chat, 80px from 32rem |
| Question option row | full width, at least 44px tall, corners 10px, a 24px round number |
| Side panel | 30rem by default, dragged between 320 and 720px; phone drawer at most 85dvh |
| Chat search | at most 36rem wide, list 26.25rem tall, field 52px |
| Link preview card | min(12.5rem, 100vw - 3rem), screenshot 200:125 |

Fluid sizes use container-query units (`cqi`) of the chat, not the viewport: the chat shares the screen with a sidebar and a side panel, so a `clamp()` against the chat's own width (8px padding in a 20rem chat to 12px at 32rem) keeps it right at every layout. Keep the CSS reveal length and the renderer's animation setting at the same value.

Under reduced motion: keep fades, drop movement (`MotionConfig reducedMotion="user"`), stop the text buffer, the shimmer and the waveform, and use near-instant durations (0.01 ms) instead of none so end events still fire.
