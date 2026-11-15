# Refine a brief or an edit note

Expand the missing decisions without rewriting the author's intent. This is the useful briefing method from blank-page's SKILL.md and references/finding-references.md, patterns.md and vocabulary.md, scoped to this repo's existing film direction. Product facts, reference analysis and style choices remain in [the main brief](SKILL.md); a new prompt is not permission to invent the product. [blank-page, SKILL.md; video-brief, SKILL.md]

## Choose the kind of request

[blank-page, SKILL.md, Procedure]

| Request | What to supply |
|---|---|
| New scene or film | A committed look, subject, medium, ordered actions, result and references |
| Batch of variations | Shared constraints, one distinct mechanism or composition per item, and what would repeat an existing item |
| Delta to existing work | Target, change, magnitude, direction and what stays |
| Image feedback | One observation per named frame, time or pointed-at element |
| Sequence added to a timeline | Where it starts, the time or preceding event anchoring each beat, and where it must end |
| Housekeeping | The missing file, destination or format only |

A delta, screenshot note or export request does not need a new creative brief. Search again only when the change introduces a new look or move. Keep the author's wording where it already names the intended action. [blank-page, SKILL.md, Procedure; references/vocabulary.md]

## Give each reference a bounded job

[blank-page, references/finding-references.md, Roles and Structuring the brief from the references]

- Record its source and local file, role, exact part or interval to take, intended fidelity and the beat it feeds. A reference with no use in the beats can leave the brief.
- Separate motion mechanics, art direction, UI structure, a scoped detail, a batch's reference family, optional implementation technique and audio timing. A file serving two roles gets two scoped takes.
- For motion, name what moves, what it reveals, the observed excerpt and any time scaling. A still can supply poses or composition; timing and easing remain unobserved until moving evidence establishes them. Use the existing [recorded-motion evidence](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/pixel-reverse-engineer/REFERENCE-MOTION.md#capture-time-and-framing), rather than treating a multi-state still as measured motion. The source's role table allowed that still to supply timing.
- Keep assets separate from references: a supplied model, image or recording to use as-is is an asset; a picture supplying only a material or palette is a reference. State the requested fidelity before rebuilding a recognizable subject.
- When the user's real product input is missing, name the gap and any proposed stand-in. Do not quietly present that stand-in as the product. Asset preparation and rights stay with [asset-prep](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/asset-prep/SKILL.md).

Keep the [existing reference library and analysis](SKILL.md#style-guidemd-take-the-grammar-never-the-content) as the definition of extracting film grammar. These role notes make the selected take explicit; they do not replace the library with another capture workflow. [blank-page, references/finding-references.md; video-brief, SKILL.md]

## Make an edit unambiguous

[blank-page, SKILL.md, Delta and Image feedback; references/patterns.md, Correction families; references/vocabulary.md, Scope and bookkeeping]

- Name the file, composition and element. Separate an unrelated composition's change from the current one.
- Say which quantity changes, in which phase, relative to which existing version or value. An entrance speed and a later travel speed are separate instructions.
- For rotation or travel, name the axis and sense in frame terms. For timing, name the beat or timestamp; for screenshot feedback, identify the shown frame or state.
- Add a keep-clause for the timing, assets, parameters or user tweaks that must survive. A request to restyle still follows [Restyle without rebuilding](STYLES.md#restyle-without-rebuilding).
- Mark genuine creative forks and state routine defaults as assumptions. Preserve missing factual evidence as missing; do not fill it with invented measurements. Keep the list of unresolved choices short enough to act on.
- Describe the mechanism rather than relying on an adjective: identify the moving part, its origin and what it exposes or becomes. Preserve an existing transformation instead of adding another metaphor solely to make the brief longer.

## Source alternatives, kept separate

[blank-page, SKILL.md, Procedure; references/finding-references.md, The fence]

The reference-led branch chooses visual and moving references before writing beats, stays within one aesthetic and maps every reference into the action. A named style or attached reference constrains that search; a more striking image outside the requested look does not override it. Its fixed reference counts, word caps, default backgrounds and clip lengths are house choices, not requirements here.

The existing [PAGE route](MEASURED-IDEATION.md#1-page-what-the-film-is-for) starts with the story, and [STYLES.md](STYLES.md#styles-look-motion-language-video-type) permits a primary look with another look's palette or mood. Those remain the general film rules. Use blank-page's stricter single-aesthetic, reference-led method when that is the selected brief-expansion job; do not silently replace the existing route or the user's accepted direction. [measured corpus, original idea.md; video-brief, STYLES.md; blank-page, SKILL.md]

## Prove it

[blank-page, SKILL.md; references/finding-references.md; references/patterns.md]

The result preserves the author's target and voice, distinguishes new work from a delta, gives each kept reference a scoped use, and names missing real inputs. An edit identifies its phase, quantity and unchanged parts. Observed timing, proposed choices and routine assumptions remain distinct. Private-session examples and corpus correction percentages are not evidence that this method improved the current result.
