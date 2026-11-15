# Editorial page and product-story presets

Choose one of these optional page narratives when the offer, content and user journey support it. Keep the project's existing app, landing and chat designs intact. [Visual presets](STYLE-PRESETS.md) define material/layout directions; this topic adds sequencing, interaction models and source-scoped motion ideas. Real evidence and complete semantic content precede choreography. [MengTo, documentary-brutalist-agency; editorial-portfolio-chapters; editorial-service-booking; product-proof-saas; operational-enterprise-ai; landing-page; pricing-page]

**Contents:** [Brief and asset boundaries](#brief-and-asset-boundaries) | [Landing and pricing decisions](#landing-and-pricing-decisions) | [Documentary agency](#documentary-agency) | [Editorial portfolio](#editorial-portfolio) | [Service booking](#service-booking) | [Product workflow as proof](#product-workflow-as-proof) | [Operational enterprise story](#operational-enterprise-story) | [Twelve portfolio motion recipes](#twelve-portfolio-motion-recipes) | [Prove it](#prove-it)

## Brief and asset boundaries

[MengTo, build-awwwards-quality-sites, SKILL.md]

Write a compact direction: page goal, audience, visual idea, hero asset, type/color hierarchy, section sequence, motion role, installed animation stack, whether 3D serves a specific purpose, and media provenance. Inspect the supplied references and extract hierarchy, pacing, contrast and image/motion treatment; create a new identity, layout, copy and interaction language. A request for an award-site quality bar does not establish an actual award.

Give media deliberate aspect ratio, crop, alt text, load strategy and missing-media behavior. Use provided/licensed media or original generated artwork where authorized and useful. Keep customer/staff evidence real and licensed. The source favors PNG cutouts and photo avatars, and prohibits authored SVG/CSS/canvas illustration; the current SVG owner and initials fallback remain valid alternatives. Likewise Solar/Iconify, Simple Icons and typed product names remain context-specific choices under [the visual preset boundaries](STYLE-PRESETS.md#icons-and-brand-marks).

Complete navigation, message and primary action before any intro settles. Pointer response is additive and works without hover; touch, keyboard, coarse pointer, blur and visibility changes cannot leave content hidden. Choose 3D only for a specific spatial/texture/response role, with a static fallback and canonical lifecycle/disposal. The source's mandatory GSAP plus one of Lenis/Locomotive is not a project-wide dependency requirement. CSS handles simple states; justify scrub/pin behavior and keep one owner per animated property.

For split text, retain a complete accessible sentence and hide only its decorative fragments. Do not split links or meaningful inline markup. The source biography recipe suggests an `aria-label` on a paragraph. The implicit paragraph role prohibits `aria-label` and `aria-labelledby`; see [MDN structural roles](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/structural_roles). Use the existing [semantic owner](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/SEMANTICS-AND-ARIA.md) and a preserved unsplit accessible copy rather than copying that attribute pattern. Final no-JavaScript and selected reduced-motion states must remain complete.

## Landing and pricing decisions

[MengTo, landing-page; pricing-page, SKILL.md; existing copy/CRO/pricing owners]

For the selected offer, choose one source composition: an explanatory hero-plus-sections, a long educational story, a short high-intent conversion page, or an intent-specific comparison. Match that choice to the actual traffic context. The existing [copy page owner](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/PAGES.md) and [CRO owner](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cro/SKILL.md) supply the brief, claims and conversion rules.

Use only sections supported by real material. Benefits can connect outcome to evidence; process steps use the actual process; place proof near the claim and answer high-friction objections before the final decision. Repeat a consistent next action and state only real trial/refund/cancellation terms. The source's 3 to 5 benefits, three steps and 6 to 12 FAQ items are layout starting points, not mandatory counts or reasons to fabricate content. Iterate a section at a time while maintaining the whole argument. See [current copy page structure](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/PAGES.md) and [CRO](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cro/SKILL.md).

For pricing, keep the actual offer's value metric, limits, fees, billing cadence and commitment under the existing pricing owner. Four useful compositions are: natural tier cards, usage/seat scaling, persona-first paths, and self-serve plus an enterprise procurement handoff. Use a comparison table/list grouped by meaningful capability, and explain what changes between plans. A source-preferred three-card layout, max-three rule, recommended tier, annual toggle or savings badge applies only when the real offer supports it. Never imply popularity without evidence. Show only comparable, true savings and a CTA that describes the actual transaction; restore selected cadence/plan when navigating back. See [pricing teardown](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/pricing-strategy/PAGE-TEARDOWN.md).

For evergreen search-intent pages, choose title/meta and relevant internal links. Decide indexing for the actual campaign. The source's “non-indexed path” is not a control: use a crawlable page with a valid [noindex directive](https://developers.google.com/search/docs/crawling-indexing/block-indexing), not a path name or blocked robots fetch. FAQ markup can serve other consumers, but the current SEO/copy owners already cover Google's 2026 FAQ rich-result retirement; do not promise a Google result from the source's optional schema suggestion.

## Documentary agency

[MengTo, documentary-brutalist-agency, SKILL.md]

Build a documentary argument through alternating black/white chapters, work evidence, people/process, case material and a concrete inquiry. Use strong editorial type, collage-like media and sparse utility labels; retain original media/copy/identity rather than source customer claims. Grid composition and DOM reading order must tell the same story.

Reserve media dimensions and failure states. Keep image clipping inside its frame while titles/captions remain stable and readable. Hover captions need focus/touch access; do not make a collage's meaning depend on pointer tracking. The source limits parallax below 5%, uses 160 to 220 ms controls, 500 to 760 ms masks and measured black/white handoffs. Those are optional narrative timings, not replacements for owner controls.

Prefer native details for ordinary disclosure and restore history where navigation changes state. Only a true modal traps focus, with the existing dialog semantics/inert/return-focus contract. The raw demo's overlay does not fully implement that contract. Check 320-pixel reflow, 200% zoom, keyboard, touch, media failures and the complete static/reduced presentation.

## Editorial portfolio

[MengTo, editorial-portfolio-chapters, SKILL.md]

Stage an original portfolio as chapters with real work, evidence, context and a clear contact route. Use 12 columns and 40 to 64 desktop margins as source starting points, large editorial type, compact metadata and deliberate black/paper transitions. Media dimensions stay reserved. Animate the image inside an overflow mask, not the surrounding title/layout; the source's subtle scale is 1.02.

Use bounded chapter handoffs with a readable final hold, not long empty scroll distances. Keep disclosure and history recoverable. Source controls 160 to 220 ms, entrances 500 to 760 ms, stagger 45 to 70 ms, curve(.22, .61, .36, 1), parallax below 5%. The 12 recipes below describe possible choreography. They preserve the existing [ScrollTrigger/native choice](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/gsap/SCROLLTRIGGER.md) and [reveal constraints](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/REVEALS.md); none requires installing another motion library.

## Service booking

[MengTo, editorial-service-booking, SKILL.md]

Use an ivory/serif/light editorial system with decisive black chapter changes to guide service selection, practical details, treatment comparison and booking. Put duration, price and action beside the treatment's representative media; give address, hours, accessibility and expectations a clear place before commitment.

A treatment stage needs semantic tabs, one coherent selection model, arrow navigation and appropriate Enter/Space activation. Keep panel content in DOM, reserve its media geometry, preload only a useful next item, and announce selection changes rather than every decorative frame. Reduced motion can use a static treatment list. The source demo's all-tabbable tabs and missing panel labeling are incomplete implementations, not a pattern to copy.

Preserve treatment/date/time/contact choices when moving back, editing or recovering from errors. Availability is server-authoritative: handle stale/unavailable slots, loading, validation, duplicate submission, network failure and confirmed success without claiming a reservation before confirmation. Source controls 160 to 220 ms, reveals 500 to 760 ms, confidence loops longer than 14 seconds and offscreen pause are scoped presentation choices. Existing [form recovery](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cro/FORMS.md) and [keyboard semantics](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/FOCUS-AND-KEYBOARD.md) remain authoritative.

## Product workflow as proof

[MengTo, product-proof-saas, SKILL.md]

A pale white-to-blue shell can frame a denser product stage on a 12-column grid, 12 to 16 radii, thin neutral rules, grotesk text and mono labels. Use black primary actions and one cool signal for selection/progress/focus; avoid particles or perpetual floating as a substitute for the mechanism.

Show one complete outcome through explicit input, processing, draft, edit, approval and publish states. Use the actual product or clearly identify a deterministic “Sample workflow.” Include a replay and text transcript, and support edit, submit, cancel, retry, copy, history, loading, quota, moderation, network and error paths when they exist in the demonstrated journey. Keep the whole mechanism understandable without animation/JavaScript. The raw demo only changes status temporarily; it does not use its input, create an output or provide the advertised editor/history. Do not call that a working product demonstration.

Connect feature modules to real outcomes, audiences and capabilities. Keep audience content in DOM and deep-link when helpful. Show verified examples or labeled samples; compare shared pricing features/usage units/limits/overages/cadence, link ambiguous terms to FAQ answers, and restore comparison view with Back. Source motion 160 to 220 ms controls, 420 to 700 ms state handoffs, 45 to 70 ms card stagger, one handoff at a time; slow background drift is optional and offscreen-paused. Keep reduced-motion UI in its settled state and never manufacture typing/generation speed.

## Operational enterprise story

[MengTo, operational-enterprise-ai, SKILL.md]

State what the system controls, where it stops and who approves. A near-black operational hero gives way to warm-white metric/explanation chapters, then capability workflows, security/risk, case evidence and a qualified demo/waitlist route. Use low radii, square media, hard lines, compact mono labels/tabular numbers and restrained spectral detail; data legibility wins over atmosphere. No fake badges, compliance, customers, availability or performance claims.

Keep each solution row's data model stable: summary, permissions, action, approval, output, audit, exception, rollback. Semantic disclosure must expose real detail with Enter/Space and hover/focus equivalence; diagrams need text equivalents. Model unavailable integration, insufficient permission, stale data, denied approval, partial completion, rollback and error. The source's expansion button changes its label/ARIA without showing a detail panel; that is incomplete reference UI.

Attach scoped/timeframed/source-backed metrics and separate implementation facts, quotes and inferred outcomes. Case links should carry relevant nonsensitive intent only with consent. A qualified handoff explains recipient, next step, response expectation and data use; support filters, links, validation, duplicate, pending, error and success states. Source controls 160 to 220 ms, section entrances 500 to 760 ms, parallax below 5%, hard black/white handoff, offscreen pause and immediate settled reduced state are source-scoped choices.

## Twelve portfolio motion recipes

[MengTo, editorial-portfolio-chapters, ARTICLE.md; shared build guardrails]

These are interaction recipes, not requests to reproduce the source identity, images, claims or screenshot composition. Use semantic content first and one existing scroll conductor. Native sticky/progress and short CSS/Web Animations sequences can replace timeline libraries where they fit. Refresh geometry after fonts, critical images, breakpoints and dynamic content; dispose timelines, tickers, observers and pointer listeners on unmount/route change. Touch, small screens, reduced motion, failed JS and back-forward restoration all need complete content.

### 1. Acquisition readout into hero

[MengTo, editorial-portfolio-chapters, ARTICLE.md recipe 1]

Sequence a small decorative signal/progress readout before title fragments resolve, then supporting copy, evidence, metadata and scroll cue in reading order. Keep the real title accessible and final layout visible without JS. Lock scroll only while critical fonts/above-fold media prepare; bound any loader with a failure timeout and one idempotent release function. Repeat visit, slow connection, bfcache and reduced-motion branches may resolve immediately. The source head script queried missing DOM and could deadlock its loader; initialize with defer or after DOMContentLoaded rather than copying that ordering.

### 2. Split hero doors

[MengTo, editorial-portfolio-chapters, ARTICLE.md recipe 2]

Keep the next contrasting chapter mounted beneath two presentation panels. As scroll leaves the hero, remove its copy first, briefly show a center seam, move halves outward, then remove seam. Bound any pin to the actual handoff and align release with the natural next-section boundary; avoid duplicate spacers. Transform/opacity-only reversal should restore the previous state. Mobile/reduced motion use ordinary section flow or a short crossfade, and focus must not stay inside visually departed content.

### 3. Reading biography and triptych

[MengTo, editorial-portfolio-chapters, ARTICLE.md recipe 3]

Resolve a central portrait, then distribute side plates from measured centers into a triptych while word emphasis advances with normalized chapter progress. Measure after image/font readiness; mask title and paragraph presentation separately, hold briefly after the last word, and reverse emphasis without reordering text. Preserve selectable complete accessible prose using the semantic correction above. Touch uses natural flow; reduced motion displays the final triptych and all words without continuous raster blur.

### 4. Velocity marquee and archive player

[MengTo, editorial-portfolio-chapters, ARTICLE.md recipe 4]

A duplicated presentation track can reverse with scroll direction and briefly accelerate from measured velocity. Emphasize the item crossing a fixed center needle through opacity/font weight. A separate large-record player uses one active index derived from normalized timeline progress; previous/next controls seek stable segment midpoints in that same timeline. Mark clones hidden, exclude cloned controls from tabbing, pause offscreen autoplay and keep labeled keyboard controls. Reduced motion keeps one visible record and an ordinary list of the rest.

### 5. Ink chapter and timed ledger

[MengTo, editorial-portfolio-chapters, ARTICLE.md recipe 5]

Move a full presentation panel over the previous chapter's final visual state, then reveal timestamped lines and evidence cards in sequence. A visual handoff clone is hidden and nonfocusable; only the live chapter provides semantics. One progress model owns panel, label, timestamps, masks, cards and final hold. Reverse without reinitializing unrelated effects or flashing body background. Mobile/static states retain all lines and ordinary reading order.

### 6. Asymmetric metric index

[MengTo, editorial-portfolio-chapters, ARTICLE.md recipe 6]

Arrange genuine metrics at distinct scales/columns rather than identical stat cards. At irregular progress beats, draw the rule, reveal/count the number, then metadata/note. Keep final values accessible and format from numeric data; interruption or reversal still resolves exact separators/units. Move only an inner presentation layer if lower entries need room, not layout geometry. Natural mobile flow and reduced motion expose all final values; 200% zoom cannot cause overlap.

### 7. Sticky recording stack

[MengTo, editorial-portfolio-chapters, ARTICLE.md recipe 7]

Use native sticky chapters to let the incoming media plate cover the previous one. Derive the old plate's slight scale/dim/softening from the next plate's approach; reserve height and decode current/next media early. Any brief viewing hold must be short, cancelable and disabled on touch; never trap scroll to force a narrative. Reverse restores crop/text. Mobile uses normal stacking; reduced motion removes zoom, blur and forced holds.

### 8. Inspection-light catalogue

[MengTo, editorial-portfolio-chapters, ARTICLE.md recipe 8]

Keep a small collection selectable in DOM and measure each mount's center at refresh. A soft radial light visits enter/hold/release beats; the active card gains modest lift, color and contrast while the same progress updates its index. Reparent a pin only for an observed ancestor compositing problem. Cap shadows/blur regions, refresh on resize, and restore enough contrast at the end for whole-collection reading. Mobile is a vertical list; reduced motion presents all mounts at normal contrast.

### 9. Opposed evidence into dark

[MengTo, editorial-portfolio-chapters, ARTICLE.md recipe 9]

Start two evidence plates from opposite directions before the section reaches the viewport top, with a normal-order central statement. Hold the assembled state, then slightly scale/soften it under a blackout layer that covers all paper elements. Entrance and exit may use separate timelines but need coherent progress/reversal. Blackout becomes opaque after softening begins; safe zones and contrast remain valid until the intended fade. Reduced motion uses a direct tonal handoff.

### 10. Dark-room image and verdict

[MengTo, editorial-portfolio-chapters, ARTICLE.md recipe 10]

Begin the dark image's approach reveal before pinning, using restrained opacity, blur and shallow scale. Reveal a short status, then the first title line, a pause, and the answer line/metadata. Split only presentation layers and keep complete accessible copy. Reverse into the black field without unstyled fragments; stop large blur work after settling. Mobile compresses the sequence; reduced motion displays resolved image and all copy together.

### 11. One active field-log record

[MengTo, editorial-portfolio-chapters, ARTICLE.md recipe 11]

Keep all notes in a semantic list/article sheet. Show the first record before any pin engages, then transfer modest scale, opacity, thumbnail and stamp emphasis through one track, with short reading holds and context still visible. Active emphasis must not resize rows; keyboard links follow ordinary focus independently. Precise desktop pin approach is appropriate only when the project already uses that weighted scrolling. Mobile is natural flow; reduced motion gives all records equal emphasis.

### 12. Footer bloom and utility layer

[MengTo, editorial-portfolio-chapters, ARTICLE.md recipe 12]

Coordinate a soft signal bloom, two-line final statement, then real CTA. If justified for fine pointers, derive magnetic button offset from distance to its center and a smaller label offset; ease both home on leave within a wrapper larger than the visible control. A responsive cursor dot/slower trailing ring and transform-scaled global progress rule are optional presentation layers with no hit interception. Fade progress as the footer takes over. Keep ordinary keyboard focus, system cursor where precision matters, no end-of-document pin trap, and disable magnet/custom cursor for coarse pointer or reduced motion; stop listeners when hidden.

## Prove it

[MengTo, page SKILL.md Validate/Verify; editorial-portfolio-chapters ARTICLE.md Success sections]

- Verify the real offer, state model, evidence and section order before calling the page complete. Sample workflows, conceptual diagrams and reconstruction footage must be labeled as such.
- Exercise the actual navigation, disclosures, forms, booking/pricing recovery, history, keyboard/touch and focus transitions when authorized for a target. Check stale/denied/error/partial states relevant to that journey.
- Review 320-pixel reflow, 200% zoom, media failure, static/no-JavaScript and selected reduced-motion paths. For motion, check forward/reverse/interrupted states, layout measurements and cleanup without claiming that read-only source inspection is runtime validation.
- Report exactly what was inspected, rendered or run and what remains unverified.
