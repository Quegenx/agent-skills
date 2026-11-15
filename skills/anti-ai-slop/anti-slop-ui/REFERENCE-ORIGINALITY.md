# Audit overlap with supplied references

Compare current output and its available history against the supplied reference corpus. Source: [MengTo/Skills, audit-reference-originality/SKILL.md; references/audit-rubric.md; scripts/build_evidence_inventory.py]. This is an evidence audit, not a legal clearance or an instruction to rewrite history.

## Define and inventory the checked scope

- Keep an audit read-only unless fixes are requested. Record each reference's path/URL, role, date when known and the categories it can demonstrate. Include briefs, manifests, prompts, stills, section crops, recordings/frames, assets, licenses and provenance records. Prefer evidence captured with the brief when a live reference has changed. [MengTo/Skills, audit-reference-originality/SKILL.md, Preserve the audit boundary; Build the source registry]
- Inspect both rendered output and source when available. Inventory visible and accessible text, identity, numerical claims, images, assets, video, structure/motion and relevant history. A homepage still does not clear an entire site or a motion sequence. Missing promised evidence remains a coverage gap. [MengTo/Skills, audit-reference-originality/SKILL.md, Inventory the current site and its history; Compare category by category]

| Category | Compare |
|---|---|
| Text | Headlines, body, labels, calls to action, captions, metadata, alt text and legal copy. |
| Identity | Names, marks, proprietary icons, people, companies, URLs and distinctive verbal identity. |
| Numbers | Prices, metrics, dates, counts, percentages, plans, durations and interface values. |
| Images | Exact bytes, crops, derivatives, people/poses, objects and distinctive compositions. |
| Assets | Fonts, icons, textures, screenshots, downloads, code and third-party media provenance. |
| Video | Frames, shot order, timing, camera, transitions, overlays, posters and audio. |
| Structure and motion | Section order, unusual layouts, pinned sequences, cursor effects and signature combinations. |
| History | Renamed, hidden, recolored, cropped, deleted or replaced source material and published artifacts. |

[MengTo/Skills, audit-reference-originality/SKILL.md, Compare category by category]

## Support each finding from both sides

- Name the exact current artifact/location and matching reference location, observable overlap, differences and recommended remedy. Use hashes for exact files, normalized excerpts for text, comparable crops for imagery and timestamps/frames for motion. Filenames and superficial resemblance are leads, not proof. [MengTo/Skills, audit-reference-originality/SKILL.md, Triangulate every red flag]
- Distinguish common visual grammar from distinctive combinations or direct reuse. An ordinary dark surface, pricing table or fade does not establish copying by itself. Explain context: a source-brand string in a test that forbids it is different from shipped identity. [MengTo/Skills, audit-reference-originality/SKILL.md, Compare category by category; Triangulate every red flag]
- Map the source rubric once: Blocker to P0, High to P1, Medium to P2 and Low to P3; Clear is a scoped verdict, not a severity. Keep fact, inference and unavailable evidence separate. Call findings overlaps, originality risks or red flags; do not infer intent or declare legal plagiarism from visual similarity alone. [MengTo/Skills, audit-reference-originality/SKILL.md, Preserve the audit boundary; references/audit-rubric.md]
- Automated exact-match, number-token and text-overlap reports propose candidates for inspection. The supplied helper's eight-word shingles, 12% overlap threshold, three-match minimum, excluded build folders and two-megabyte file cutoff limit its findings; they are not a clearance test. Report the inspected scope rather than treating an empty helper result as a pass. [MengTo/Skills, audit-reference-originality/scripts/build_evidence_inventory.py]

## Propose a specific remedy

Replace the overlapping element with authorized new copy, verified facts, rights-cleared assets or a materially different composition/sequence. Cosmetic recoloring does not resolve copied identity or media. Preserve the page's actual goal and accepted owner designs. Rewriting repository history or removing published artifacts is a separate consequential action requiring authority; detecting historical overlap does not authorize deletion. [MengTo/Skills, audit-reference-originality/SKILL.md, Propose fixes; repository permissions]

## Prove it

Report the checked registry, category-by-category result, findings ordered by severity, historical exposure, missing evidence and prioritized remedies. Distinguish exact reuse from stylistic similarity and mark unexamined categories explicitly. Any “clear” verdict is confined to the checked scope; every red flag has evidence on both sides. [MengTo/Skills, audit-reference-originality/SKILL.md, Report the result; Completion checks]
