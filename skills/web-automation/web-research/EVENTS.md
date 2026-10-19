# Event prospecting

Event discovery, company triage and person evidence from the Browserbase event-prospecting workflow, with the existing contact-provenance rules below. Recon/extraction/compiler scripts and profiles require the [source workspace](COMPILER.md#source-workspace-prerequisite); they are not bundled here. [browserbase/skills, event-prospecting]

## The pipeline

0 setup, 1 load the profile, 2 recon the event page, 3 extract people, 4 group by company, 5 ICP triage (1 call), 6 filter by threshold (default 6), 7 deep research on fits (5 calls), 8 enrich speakers (scope asked), 9 compile.

- **Invoke with the event URL** (`/event-prospecting <URL>`), defaults `DEPTH=deep`, `ICP_THRESHOLD=6`. Don't ask the user to confirm the URL.
- **Output folder:** `~/Desktop/{event_slug}_prospects_{YYYY-MM-DD-HHMM}/` with `companies/` and `people/`; the slug is the first hostname label.

## Recon: which platform built the page

Detect in this order, with one `browse eval` that probes everything. Order matters because Next.js sites often also embed JSON-LD.

| # | Signal | Strategy |
|---|---|---|
| 1 | Next.js `__NEXT_DATA__` script tag | `next-data` / `next-data-eval`: walk the JSON for arrays longer than 3 whose first object has a name-like key and contains "linkedin"; record the paths, drop `.talks[N].speakers` duplicates, keep at most 5 |
| 2 | Sessionize `meta[name=generator]` | `sessionize-api`: `https://sessionize.com/api/v2/{event_id}/view/Speakers` (a stub that falls back to markdown) |
| 3 | Lu.ma hostname | `json-ld` (stub); the full attendee list is often behind a login |
| 4 | Eventbrite `og:site_name` | `json-ld` (stub); low yield, speakers usually appear only in prose |
| 5 | JSON-LD `@type: Event` | `json-ld` |
| 6 | Anything else | `markdown` heuristic: split on `##` to `####`; line 1 the name (starts with a capital), line 2 the title, line 3 the company, plus a `linkedin.com/in/` match. Covers 60-80%; misses card layouts |

- **Waits:** 2500 ms for recon, 2000 ms for Next.js extraction and 2500 ms for markdown extraction; raise to 5 s if speakers lazy-load.
- **Zero people is incomplete evidence.** [browserbase/skills, event-prospecting/SKILL.md and scripts/extract_event.mjs; EVIDENCE.md unknown-evidence rule] Report that the selected extractor returned no people, its strategy and any observed access/rendering failure. The source and this file formerly inferred "platform unsupported" from an empty result; absence alone does not establish that cause. Keep the limitation visible instead of presenting an empty file as a complete attendee list.

## Extracting people

- **Normalize field names with fallbacks:** `name|fullName`, `title|role`, `companyName|company|org`, `linkedInProfile|linkedinUrl|linkedin`, `bio|description`.
- **Pick the photo:** keys matching `/portrait|headshot|photo|image|picture|avatar|thumbnail/i`, mono, grey and black variants sorted last; unwrap `.url`, `.src`, `.asset.url`, `.fields.file.url` and arrays. Resolve relative image URLs against the event origin; `//` becomes `https:`.
- **Give duplicate names slugs `-2`, `-3`,** so a later subagent's `people/{slug}.md` write doesn't silently overwrite another person.
- **Drop verified host and user-company people.** [browserbase/skills, event-prospecting/scripts/extract_event.mjs; EVIDENCE.md identity rule] Compare normalized names with the confirmed organizations. The source derives a possible host name from a domain label, but that heuristic does not verify identity; do not exclude people solely on that guess. Keep people whose company is unknown.
- **Sanity checks are prompts to inspect, not diagnoses.** [browserbase/skills, event-prospecting/SKILL.md; EVIDENCE.md unknown-evidence rule] The source's fewer-than-about-10 people, company-to-speaker ratio of 0.4-0.6, 20-40% ICP survival and below-10% warning are planning heuristics. A small result does not prove a wrong platform, narrow ICP or excessive threshold. Report observed counts, extraction coverage and unknowns before interpreting them.

## Triage: one call per company

- **Use an evidenced homepage.** [browserbase/skills, event-prospecting/SKILL.md; EVIDENCE.md identity rule] Carry a verified event/profile/source URL as a `name|url|slug` line. The source and this file formerly constructed `name.com`; a responding domain does not prove it belongs to the named company. With no evidenced URL inside the agreed one-call budget, leave the company `Unknown` with a score of 3 or less and record the unresolved identity; do not classify a different business or silently add calls.
- **Use the slug verbatim.** Re-slugifying creates duplicate files.
- **Batch with the shell:** `split -l 10` for triage, `-l 5` for deep research and people, into `_batch_*` files that are removed afterwards.
- **Filter on the frontmatter:** `awk '/^icp_fit_score:/{print $2; exit}'` compared with `-ge $THRESHOLD`, writing `icp_fits.txt`.

## Deep research on fits

- **Overwrite the triage stub** and flip `triage_only: false`. Add `event_context`, `event_relevance` and a `## Event Relevance` section with the pitch angle.
- **Word sub-questions in the event's context,** for example "What is {company} doing with ... relevant to {EVENT_NAME}'s {EVENT_CONTEXT}?".

## Enrichment scope: ask once

- **Show both options with their cost:** `ICP fits: N × LANES calls` against `All: TOTAL × LANES`. The default is ICP fits only.
- **A big "All" asks again:** if `TOTAL × LANES` is over 600, warn once more that it's a 10+ minute run with hundreds of tool calls.

## Person files and hooks

- **Never use sensitive traits** `[coreyhaines31/marketingskills, prospecting]`: "Never use sensitive traits (health, finances, politics, religion, family) even when public." Not for triage, not for a hook.
- **Hooks quote or paraphrase a specific search finding.** Never infer from "they look senior" or "their company is AI-y". With no signal from the last 6 months, fall back to the event context (the talk title).
- **Hook priority, two readings:** one puts recent activity (last 6 months) first, then the event context, then the company context; another puts the event context first.
- **The DM opener uses the hook verbatim** and never names a podcast or blog post the person didn't actually appear in. Two to three sentences: the hook reference, a one-line tie-in to the wedge, a soft call to action. Never salesy.
- **File format, which the parser depends on:**
  - `hook`, `dm_opener` and `role_reason` are YAML fields, not `##` sections; `dm_opener: |` is a pipe scalar.
  - `links` is a nested object (`linkedin, x, github, blog, podcast`), `null` when unknown, never `""`.
  - `image` is kept verbatim; `icp_fit_score` is inherited from the company.
  - Body: `## Why reach out` (3 bullets), `## Public links`, `## Recent activity`.
  - Every file has the closing `---` before its first section.
- **Provenance per person** `[coreyhaines31/marketingskills, prospecting]`: "Every contact carries: the source (provider or URL), the collection date, the lawful basis for EU/UK contacts, and the last verification date and result. This answers "where did you get my email?" and makes data deletion requests possible." A person file with a LinkedIn link and a DM opener is a lead record: list-building law is in [prospecting LIST-COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/LIST-COMPLIANCE.md) and send-time law in [email-practices COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/COMPLIANCE.md). The DM opener is a draft: no messages, connects or follows "unless the user separately authorizes that action" `[coreyhaines31/marketingskills, prospecting]`.
- **Downstream:** outbound stages and fields (source list, signal type and date, tier, sequence, last verification) that these files feed into a CRM are in [revops LIFECYCLE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/revops/LIFECYCLE.md#outbound-stages).

## Prove it

Observed people and company counts, extraction strategy and coverage limitations are reported without inferring a platform failure from an empty result; each researched company URL has identity evidence; the selected event workflow's materialized company stubs match the seed list and completed-fit files match the fit list, with failures reported; no two person files share a slug; every hook in a sample of five traces to a cited finding or the talk title; every file parses with its closing `---`; every person file has a source, a collection date and a lawful basis.
