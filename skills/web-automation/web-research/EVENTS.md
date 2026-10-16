# Event prospecting

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
- **Zero people from markdown extraction** should surface a "platform unsupported" error rather than an empty `people.jsonl`.

## Extracting people

- **Normalize field names with fallbacks:** `name|fullName`, `title|role`, `companyName|company|org`, `linkedInProfile|linkedinUrl|linkedin`, `bio|description`.
- **Pick the photo:** keys matching `/portrait|headshot|photo|image|picture|avatar|thumbnail/i`, mono, grey and black variants sorted last; unwrap `.url`, `.src`, `.asset.url`, `.fields.file.url` and arrays. Resolve relative image URLs against the event origin; `//` becomes `https:`.
- **Give duplicate names slugs `-2`, `-3`,** so a later subagent's `people/{slug}.md` write doesn't silently overwrite another person.
- **Drop the host organization's and the user company's own people,** comparing slugified names on both sides. The host name is the registrable-domain label with one `sessions?|conf(erence)?|summit|events?` suffix stripped, only if what remains is at least 5 characters (so `devconf.io` doesn't collapse to `dev`); `.co.uk`-style suffixes are a known limitation. Keep people whose company is unknown.
- **Sanity checks:** fewer than about 10 lines in `people.jsonl` means recon picked the wrong platform. Expect companies at about 0.4-0.6 times the speakers, and 20-40% ICP survival; below 10%, warn that the threshold may be too high or the ICP too narrow.

## Triage: one call per company

- **Guess the homepage:** `https://{name lowercased, non-alphanumerics removed}.com`, carried as a `name|url|slug` line. Searching for the real URL would break the 1-call cap; if the guess fails, the file says `Unknown` with a score of 3 or less.
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

- **Hooks quote or paraphrase a specific search finding.** Never infer from "they look senior" or "their company is AI-y". With no signal from the last 6 months, fall back to the event context (the talk title).
- **Hook priority, two readings:** one puts recent activity (last 6 months) first, then the event context, then the company context; another puts the event context first.
- **The DM opener uses the hook verbatim** and never names a podcast or blog post the person didn't actually appear in. Two to three sentences: the hook reference, a one-line tie-in to the wedge, a soft call to action. Never salesy.
- **File format, which the parser depends on:**
  - `hook`, `dm_opener` and `role_reason` are YAML fields, not `##` sections; `dm_opener: |` is a pipe scalar.
  - `links` is a nested object (`linkedin, x, github, blog, podcast`), `null` when unknown, never `""`.
  - `image` is kept verbatim; `icp_fit_score` is inherited from the company.
  - Body: `## Why reach out` (3 bullets), `## Public links`, `## Recent activity`.
  - Every file has the closing `---` before its first section.

## Prove it

`people.jsonl` has at least about 10 lines; `ls companies/*.md | wc -l` equals `wc -l seed_companies.txt` and the `triage_only: false` count equals `wc -l icp_fits.txt`; no two person files share a slug; every hook in a sample of five traces to a cited finding or the talk title; every file parses with its closing `---`.
