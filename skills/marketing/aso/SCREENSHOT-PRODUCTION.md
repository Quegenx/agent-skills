# Screenshot production

A resumable workflow from the supplied `aso-appstore-screenshots` skill, the `app-store-screenshots` skill and editor, and Scrnsht Studio's "How to Make Your App Store Screenshots Convert (With These 7 Principles)." Their composition and conversion advice is author practice, not a platform requirement or a promised lift. [aso-appstore-screenshots, SKILL.md; app-store-screenshots, SKILL.md; Scrnsht Studio, How to Make Your App Store Screenshots Convert (With These 7 Principles).md]

Store policy and dimensions stay in [VISUALS.md](VISUALS.md) and [ANDROID.md](ANDROID.md); real-screenshot compositing stays in [marketing-images](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-images/SKILL.md#product-mockups). Optional art directions are in [SCREENSHOT-STYLES.md](SCREENSHOT-STYLES.md).

## Resume from the approved state

[aso-appstore-screenshots, SKILL.md, Recall and Save to Memory]

- Before repeating discovery, read the saved app context and production state: confirmed benefits and audience, every capture's path and assessment, benefit-to-capture pairings, brand color, generated versions, selected finals and the next unfinished phase.
- Show what is confirmed and what remains. Let the user resume, revisit a phase, or replace one headline, capture or color without restarting the whole job.
- Save decisions when each phase is approved. Keep rejected-capture reasons and selected-version paths, so later sessions can distinguish a rejected draft from a final asset.

## Discover benefits before drawing

[aso-appstore-screenshots, SKILL.md, Benefit Discovery; Scrnsht Studio, How to Make Your App Store Screenshots Convert (With These 7 Principles).md, principles 1 to 3]

- Inspect the app's actual screens/components, data model, feature flags, purchases/subscriptions, onboarding, README and existing store metadata. Establish what the user can do, who it serves, what problem it solves and what distinguishes it.
- Present what the app and existing context establish; ask only questions they do not answer. The source asks about audience, download motivation, alternatives, unmet needs and what customers value.
- Draft 3 to 5 core benefits as this source's discovery exercise. Focus on what the user gets; an action verb plus a specific outcome is its preferred headline form. Confirm wording and order before pairing captures. This is a drafting option, not a requirement that every brand use uppercase verbs.
- Give each screenshot one primary message. Research the value proposition before designing; the first screen introduces that value and the remaining screens reinforce it with relevant product evidence.

## Assess captures and coach retakes

[aso-appstore-screenshots, SKILL.md, Screenshot Pairing]

- Inspect every supplied capture. Record its path, the screen/feature it shows, what works, what fails and one of the source's verdicts: Great, Usable or Retake.
- Look for sparse or empty content, clipped information, debug indicators, distracting status bars, unreadably small text, weak hierarchy and inconsistent light/dark appearance. Explain the actual problem instead of rejecting a capture without evidence.
- For each Retake, and each benefit without a suitable capture, specify the exact app screen, useful content state and appearance to capture. Keep the real feature and use approved fictional account data under [the asset rules](VISUALS.md#rules-for-every-asset). The source suggests making a chart trend upward; use an accurate product capture rather than changing a result solely to make it persuasive. [aso-appstore-screenshots, SKILL.md, Coach on Retakes; https://developer.apple.com/app-store/review/guidelines/#accurate-metadata]
- Pair only Great or Usable captures. Explain relevance to the benefit, visual clarity, impact and whether the same capture is already used elsewhere. If none demonstrates the benefit, request the missing capture instead of pretending the match works. Confirm pairings before production. [aso-appstore-screenshots, SKILL.md, Pair Screenshots with Benefits and Confirm Pairings]

## Write the deck and approve its direction

- Start with [the existing slot brief](VISUALS.md#screenshot-strategy). The supplied copy library adds three ways to draft alternatives for a slide: paint a moment, state an outcome or remove a pain. Use the app's actual nouns and verbs; replace every formula placeholder and substantiate any uniqueness, number, speed or privacy claim. [app-store-screenshots, copy-ideas.md, How to use this file and Formulas by slot]
- The source's alternative story arcs are a benefit ladder, problem then solution, a day in the user's life, or a numbers-led story. Choose the arc that the real product and available evidence support; do not force every app into every slot. [app-store-screenshots, copy-ideas.md, Deck arcs]
- Keep line breaks intentional and review copy in the chosen art direction. The source suggests short common words and 3 to 5 words per line; existing [VISUALS.md](VISUALS.md#screenshot-strategy) gives 4 to 6 words per benefit headline. These are attributed drafting preferences; actual rendered fit and readability decide. [app-store-screenshots, SKILL.md, The Iron Rules; eronred, VISUALS.md screenshot strategy]
- Hide the headline and supporting copy briefly: can the visual still roughly communicate the app's idea? Restore copy to clarify the same idea. This is Scrnsht Studio's review exercise, not a store submission test. [Scrnsht Studio, How to Make Your App Store Screenshots Convert (With These 7 Principles).md, principle 4]
- Faces, hands or a real-use situation are optional creative choices when relevant and authorized. Scrnsht Studio reports favorable experience with human-centered concepts but supplies no controlled results or guaranteed conversion lift. Preserve the app-in-use requirement in [VISUALS.md](VISUALS.md#rules-for-every-asset). [Scrnsht Studio, How to Make Your App Store Screenshots Convert (With These 7 Principles).md, principle 5; https://developer.apple.com/app-store/review/guidelines/#accurate-metadata]
- Approve the first composition before using it as the direction for the rest: text treatment, framing, background and overall consistency. The simple-ASO source always generates three enhanced variants per benefit; use that as an optional comparison workflow within the agreed tool/budget scope. Keep versions separate and record the chosen final. [aso-appstore-screenshots, SKILL.md, Generation Process and Iteration]

## Keep product evidence literal

- The simple-ASO source composites text, a device and an app capture locally, then sends the whole scaffold through AI enhancement. Existing [marketing-images](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-images/SKILL.md#product-mockups) says "AI models hallucinate UI: don't use them for this." Keep that existing rule: real UI and editable text remain under deterministic compositing; selected decorative artwork does not authorize redrawing the product. [aso-appstore-screenshots, SKILL.md, Generation Process; coreyhaines31/marketingskills, image]
- The other source says, "If you're showing UI, you're doing it wrong." Apple's official form requires screenshots to show the app in use; overlays can support it. Follow [the existing asset rule](VISUALS.md#rules-for-every-asset). The source's feeling/outcome emphasis can inform the message, not replace the app evidence. [app-store-screenshots, SKILL.md, Core Principle; https://developer.apple.com/app-store/review/guidelines/#accurate-metadata]
- Reference brands in the supplied style guides are visual study material, not assets or sample data to reproduce. Keep the user's app captures and approved brand direction; the source editor's sample decks, mascots, fonts and frames are not prerequisites for this workflow. [app-store-screenshots, SKILL.md, Migration Path; style-prompts/01-retro-rubberhose-mascot.md; style-prompts/08-swiss-grid-bold.md; https://developer.apple.com/app-store/review/guidelines/#accurate-metadata]

## Optional connected-canvas composition

[app-store-screenshots, SKILL.md, Cross-Screen / Cross-Canvas Composition; style-prompts/_QUALITY_BAR.md, Cross-screen / cross-canvas moments]

- Design adjacent slides together only when each exported crop still communicates a complete idea alone. A background, path, secondary illustration or noncritical edge can continue across a seam; no viewer should need the neighboring screenshot to understand the claim.
- The source's planning defaults are one cross-screen moment for a deck of at least 5 slides, at most two for 8 to 10 slides, and none when a short, formal or compliance-heavy deck needs independent frames. Treat these as optional author heuristics.
- Its suggested bleed is 10 to 30% of a noncritical visual; above 40% is reserved for backgrounds, paths or abstract decoration. Put boundaries through negative space or simple transitions, not headlines, app names, legal/store information, faces, key UI, chart numbers or the product claim.
- Compare the zoomed-out strip with each standalone crop. Remove a crossing element when either crop reads as accidentally cut or incomplete. Device-art usage still follows [VISUALS.md](VISUALS.md#rules-for-every-asset).

## Localize the actual exported content

- Keep device, orientation and locale captures distinct when the app has a different layout. Adapt copy to its meaning and intended line breaks in each language; check right-to-left text and the actual app capture rather than blindly mirroring the product. [app-store-screenshots, SKILL.md, Drop the User's Assets and iPhone Duo Decks; copy-ideas.md, Localization]
- Verify the actual language in every output. The supplied editor's `pickText` falls back to English or the first nonempty locale, so an existing export file does not prove that its translation is complete. Inspect both localized overlay text and the selected screenshot path. [app-store-screenshots, template/src/lib/locale.ts; template/src/lib/export-assets.ts]
- For foldable-display storytelling, show the app's real wide or two-pane layout when it exists; plan other orientations only when the app has their actual layouts. Official sizes and the conditional SDK requirement remain in [VISUALS.md](VISUALS.md#screenshot-specs-app-store). [app-store-screenshots, SKILL.md, iPhone Duo Decks; https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications]

## Inspect the final raster

- Review the intended size and thumbnail presentation, not only the editor's zoomed preview. The source uses both 160 px and 220 px thumbnail exercises; those are review sizes, not a fixed Apple search-result width. Ask whether the style, app purpose and reason to investigate are still clear. [app-store-screenshots, SKILL.md; style-prompts/_QUALITY_BAR.md, The thumbnail test]
- Measure text fit using the actual font and content. Check clipping, long words, overlaps, intentional line breaks and safe margins after export. The source quality bar's character-cap example reports about 13 characters, but its own `floor(1320 / 96 * 0.45)` evaluates to 6; do not use that formula as a font-fit guarantee. [app-store-screenshots, style-prompts/_QUALITY_BAR.md, Headline composition rules]
- Check text contrast at its final displayed size using [the existing contrast guidance](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/SKILL.md). The source quality bar calls every headline's 4.5:1 target "WCAG AA" and asks 7:1 for tiny labels; those are author targets. Official AA requires 4.5:1 for normal text and 3:1 for large text, while AAA requires 7:1 and 4.5:1 respectively. A large master-image font does not establish large text at its final display size. [app-store-screenshots, style-prompts/_QUALITY_BAR.md, Typography contrast and legibility; https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html; https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html]
- Measure the actual text/background pair instead of inheriting a palette's claimed ratio. The quality bar calls coral `#E45A4A` on sage `#BFD9B6` about 4.1:1 and mustard `#F2BB46` on that sage 1.7:1; the official luminance formula gives approximately 2.36:1 and 1.15:1. Neither pair meets AA's large-text threshold. [app-store-screenshots, style-prompts/_QUALITY_BAR.md, Typography contrast and legibility; https://www.w3.org/WAI/WCAG22/Techniques/general/G18]
- Wait for the actual fonts and images to load, then inspect the resulting image for missing captures, substituted fonts, blank/black regions, unexpected clipping and altered composition. The supplied editor preloads and decodes selected assets, but its sampled export fingerprint is an implementation heuristic, not proof that every pixel or translation is correct. [app-store-screenshots, template/src/lib/image-cache.ts; template/src/lib/export-assets.ts; template/src/lib/export-render.ts; template/src/components/editor/screenshot-editor.tsx]
- Check encoded format, dimensions and alpha against [the current store specifications](VISUALS.md#screenshot-specs-app-store) and [Play asset requirements](ANDROID.md#graphic-assets). The source's three-size iPhone table is not the complete current Apple submission requirement. Keep final assets ordered and separate from draft variants, with the approved paths recorded. [aso-appstore-screenshots, SKILL.md, App Store Connect Requirements and Final Delivery; https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications]

## Prove it

- The approved benefits, capture assessments, pairings, art direction and selected finals can be resumed without repeating completed phases. [aso-appstore-screenshots, SKILL.md, Recall and Save to Memory]
- Each claim has a relevant real product capture; missing evidence produces a retake request. Store-specific proof, price, device-art and real-data checks pass in [VISUALS.md](VISUALS.md#rules-for-every-asset). [aso-appstore-screenshots, SKILL.md, Screenshot Pairing; https://developer.apple.com/app-store/review/guidelines/#accurate-metadata]
- Both the strip and each standalone export read clearly, with no severed critical text/UI or accidental seam. The actual exported words, font, images, order, locale, dimensions and alpha were inspected. [app-store-screenshots, SKILL.md, Cross-Screen / Cross-Canvas Composition; template/src/lib/export-assets.ts; template/src/lib/export-render.ts]
- Any chosen style uses the user's product and assets; no author heuristic has silently changed the production UI or become a store requirement. [app-store-screenshots, SKILL.md, Migration Path and Visual Design Principles; https://developer.apple.com/app-store/review/guidelines/#accurate-metadata]
