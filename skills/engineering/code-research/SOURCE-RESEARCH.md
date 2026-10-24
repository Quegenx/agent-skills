# Researching code with evidence

Find the source that settles a question, preserve what the tool actually observed, and stop when another read cannot change the answer. Sources: [bgauryy/octocode, octocode-research], [JuliusBrussee/caveman, caveman-explore and cavecrew], and [dzhng/jevgrep, jevgrep]. This is the research method; the [debugging skill](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/debugging/SKILL.md) owns the problem contract and causal diagnosis, and [agent-harness WORKFLOWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-harness/WORKFLOWS.md#delegation-packets) owns delegation.

## Start from the strongest handle

[bgauryy/octocode, octocode-research/references/algorithm.md and researcher-mindset.md]

| What is already known | First useful read |
|---|---|
| Exact path or source range | That file or range, with surrounding contract |
| Identifier | Definition and the callers or references relevant to the question |
| Behavior without a known name | Entry points, related vocabulary and the path connecting input to output |
| Code shape | A structural query, then exact source at the returned locations |
| Installed dependency | Installed version, shipped types and source before the upstream default branch |
| Question about a change | Relevant source and history, with the actual revision recorded |
| No handle | A shallow view of the corpus and scoped search to locate candidates |

- Skip discovery already settled by the request. Learn which surfaces are available, their scope and language support; an unavailable semantic provider is a coverage limit, not evidence that the symbol has no uses. [bgauryy/octocode, octocode-research/references/researcher-mindset.md]
- Respect the project's tool priorities. Jevgrep's behavioral retrieval is an optional way to locate entry points when it is already available and permitted; exact names and strings still call for exact retrieval. Its relevance labels and paths without excerpts are leads, not proof. The source prefers starting with Jevgrep; repository-required discovery tools remain authoritative. [dzhng/jevgrep, jevgrep/SKILL.md]
- Keep the same root and exclusions when comparing an inventory with a search. Inventory totals can be upper bounds, and excluding tests also removes potential behavior evidence. An inventory is neither an upload estimate nor a privacy audit. [dzhng/jevgrep, jevgrep/SKILL.md]

## Match the proof to the claim

[bgauryy/octocode, octocode-research/references/algorithm.md, code-research.md and researcher-mindset.md]

| Evidence lane | What to inspect |
|---|---|
| Structure | Location, size and layout |
| Stream | Exact text, source slices and symbol views |
| Connections | References, callers and structural code patterns |

- For a consequential conclusion, cross-check more than one lane. A search snippet, semantic zero or suspicious recent change is insufficient by itself. Read the exact source and distinguish what the lane proves from what it cannot see.
- Claims such as unused, only, safe or absent need the relevant code, tests, scripts and configuration checked. Before relying on an empty result, establish the root, revision, spelling, indexing, permissions and provider support; preserve an unsupported or failed search as such.
- A tool's requested revision can differ from the resolved revision. Record the returned branch or ref and recheck the relevant version before applying its behavior to installed code.
- Copy paths, lines, match ranges, result identifiers and continuation handles exactly. A partial result needs its remaining pages read before a completeness claim; never invent an offset, cursor or path.
- Cite source bytes for behavior. Documentation and model interpretations locate the question; the implementation and relevant observed result settle what happens. Keep interpretation and measurement separate.

## Keep a claim ledger

[bgauryy/octocode, octocode-research/references/loop-mode.md and researcher-mindset.md]

- Frame one question, keep a plausible explanation and an alternative, and choose the cheapest next read that could disconfirm one. Progress is a claim resolved or confidence changed, not a count of calls.
- Record the claim, decisive anchors, confidence, unresolved alternative, attempted query shapes and next check. Preserve errors, scope boundaries and partial markers so a resumed investigation does not mistake a blind spot for absence.
- Change the query or surface when an iteration adds no evidence. Stop when the question is answered and the alternative rejected, no affordable next check can change the conclusion, or the agreed budget is reached; report the remaining gap.
- The source asks approval before broad scans and queries every validated web engine. This repository allows authorized read-only discovery and follows its configured search-provider policy; those source defaults do not add approval stops or parallel search providers.

## A localization handback

[JuliusBrussee/caveman, caveman-explore/SKILL.md and cavecrew/SKILL.md]

- A read-only locator returns the relevant path, a range it actually read, the symbol when useful, and a short relevance note. It does not invent line ranges or expand a location request into an architecture proposal.
- Stop locating once the solver has the decisive sites. If the exact site was supplied, send it directly to the scoped task rather than buying another discovery pass.
- An honest no-match result states its checked scope. The parent verifies load-bearing locations under the [delegation contract](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-harness/WORKFLOWS.md#delegation-packets); compressed output does not remove that responsibility.

## Mechanics and historical motivation

[new/skills/why, SKILL.md, references/epistemics.md and references/synthesizer-prompt.md]

- Code establishes what happens; it does not establish why an author chose it. For a motivation question, seek contemporaneous rationale in history, decision records, issues, documents or conversations. Treat a hypothesis supplied by the user as one candidate to investigate.
- Record authorship, time and source status. A later explanation, draft, incident symptom or analytics result may support a different claim from the original decision. Preserve contradictory records with both citations rather than choose the tidier account.
- Use confidence labels consistently: **Direct** for an explicit statement answering the question; **Supported** for converging indirect evidence; **Inferred** for an interpretation with its reasoning exposed; **Speculative** for a plausible account with equally fitting alternatives; **Unknown** when the checked record does not settle the question. Direct and supported claims need adjacent citations; interpretations need qualified language.
- Keep the question, search terms, checked windows and unavailable sources visible. A missing connector, inaccessible record or empty search does not establish that the rationale never existed. Distinguish what the next change should preserve, change or avoid and the risk of an unresolved interpretation.
- The source calls for every historical evidence lane to be searched. Keep the existing [bounded claim ledger](#keep-a-claim-ledger): select the next lane that could change the conclusion, stop at the agreed evidence or budget boundary, and report unsearched lanes with reasons. [new/skills/why, SKILL.md and references/synthesizer-prompt.md; existing code-research, SOURCE-RESEARCH.md#keep-a-claim-ledger]

## Explain the observed flow

[new/skills/how, references/explainer-prompt.md]

For an explanation rather than a location request, adapt the handback to the question: a short overview, necessary concepts, the actual trigger and data/control flow, decisive files and non-obvious gotchas. Use concrete symbols and prose rather than a code dump. Check contradictory findings against source; a diagram needs verified edges and should clarify the flow. Preserve unanswered questions instead of hiding them in a smooth narrative.

## Prove it

[bgauryy/octocode, octocode-research/references/code-research.md and loop-mode.md; dzhng/jevgrep, jevgrep/SKILL.md]

- Every consequential conclusion has an exact source or runtime anchor and a stated confidence limit.
- Negative claims name the surfaces and scope checked, with partial, failed or unavailable surfaces visible.
- The installed or resolved revision is recorded where version affects the claim.
- The ledger shows which alternative was rejected, or the missing check that prevents a conclusion.
- A retrieval that was still running or truncated was resumed from its real handle, not replaced by an invented result.
- A motivation answer distinguishes explicit rationale, converging evidence, interpretation, speculation and unknowns; it preserves contradictory records and names unavailable or unsearched lanes. [new/skills/why, references/epistemics.md and references/synthesizer-prompt.md]
