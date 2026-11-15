# Document the product's design language from evidence

Use the supplied Create DESIGN.md workflow to turn governing product evidence into a compact design-language document. This is distinct from [raw value mapping](EXTRACTION-AND-MAPPING.md) and [individual component documentation](COMPONENT-DOCS.md). The optional source CLI and its schema are not installed or required here; retain the target project's actual document contract. [create-design-md, SKILL.md, Boundaries; Choose the mode; Trace the evidence]

## Choose the evidence mode

[create-design-md, SKILL.md, Choose the mode]

- With the repository, select one product and trace its governing sources. Repository evidence can establish token names, ownership and documented rationale.
- With only a public URL, inspect rendered DOM, computed styles and loaded stylesheets at desktop and mobile widths. Label the result a reconstructed draft. Screenshots alone do not establish exact values, internal ownership or intentional canonical status.
- Prefer repository mode when source is available; use the URL to verify presentation. If the selected product is materially ambiguous, resolve that scope before writing.

## Keep a candidate ledger before promotion

[create-design-md, SKILL.md, Shared evidence pipeline; Trace the evidence]

For each candidate, record its role, value, source, scope, recurrence and confidence. In URL mode also record page, viewport, element role, computed property and matching loaded declaration or exposed custom property where available. Connect a declaration to rendered use before treating its existence as design evidence.

Trace repository sources in order: accepted design guidance, tokens and themes, shared primitives and variants, representative routes and rendered consumers, then local implementations. A similarly named package, proposal, migration, example or legacy path participates only if the selected product actually imports, references, inherits or renders it.

Use [EXTRACTION-AND-MAPPING.md](EXTRACTION-AND-MAPPING.md#mapping-report) for raw-value normalization and token matching. Repetition helps describe recurrence; it does not by itself establish product intent. Keep local or uncertain candidates out of product-wide rules. [create-design-md, SKILL.md, Boundaries; Shared evidence pipeline; Decide what belongs]

## Write only supported implementation guidance

[create-design-md, SKILL.md, Trace the evidence; Decide what belongs; Write the document]

- A reconstructed claim needs an observation, a measured or recurring basis, and a concrete consequence for implementation. Omit it if any part is absent. Scope a page-local pattern to that page.
- Preserve named governing tokens in repository mode. For URL reconstruction, report observed values and directly exposed names without inventing internal aliases or a canonical scale.
- Separate exact token data from supported application guidance. Do not invent personality, audience, rationale or prohibitions. An explicit prohibition needs an explicit governing source.
- Preserve accepted decisions unless the user or current governing evidence replaces them. Report implementation conflicts separately; accidental code does not silently supersede guidance.
- Include only sections supported by evidence and relevant to the resulting implementation. An inventory of everything discovered is not the design language.

The source keeps citations, rejected candidates and conflicts outside DESIGN.md. Existing [component documentation](COMPONENT-DOCS.md) retains Sources, Conflicts and Guessed at records. Keep both scopes explicit: if the chosen document contract excludes audit material, retain the evidence ledger and report separately rather than deleting provenance. [create-design-md, SKILL.md, Write the document; component-docs, SKILL.md]

## Prove it

[create-design-md, SKILL.md, Validate; Report]

Name the mode, selected product, governing evidence and omitted unsupported areas. Check the target document's actual schema and any export used; inspect emitted categories rather than equating a successful command with complete output. Compare an update with the accepted document and account for removed decisions. A reconstructed draft remains labeled as reconstructed. Do not claim source CLI validation was run when it was not.
