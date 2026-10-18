# Listening sources template

Copy the block below to `.agents/listening-sources.md` in the project (or `.claude/listening-sources.md`) and fill in the brackets; the [listening loop](LISTENING.md) reads it on each run. Adapted from coreyhaines31/marketingskills `social` (`references/listening-sources-template.md`, MIT): its "browser-driven" LinkedIn and X lines and its Reddit "JSON API" line are changed to this repo's rules ([LISTENING.md](LISTENING.md#sources)). Delete sections you don't use; "stale sources are worse than no sources."

```markdown
# Listening sources

## What we're listening for

**Brand / product:** [Your product name]
**Category:** [e.g., "AI writing assistant", "Postgres GUI"]
**Goal:** [e.g., "find people switching from [competitor]", "engage with B2B SaaS founders 50-200 employees"]

## ICP (for scoring)

Used by the scoring rubric to judge ICP fit.

- **Role:** [e.g., "founder, head of marketing, marketing ops lead"]
- **Company stage:** [e.g., "seed to Series B SaaS, 10-200 employees"]
- **Industry:** [e.g., "B2B SaaS, infra, devtools"]
- **Signals they're a fit:** [e.g., "writes about GTM, runs paid ads, recently raised"]

## Target accounts

Engage with every post from these accounts when relevant. Keep this list to 20-50 max.

### LinkedIn (the user reads these; agents don't fetch behind the login)
- [Name] - `linkedin.com/in/handle`

### X (a private list the user reads, or Grok / xAI X search)
- [@handle]

### Reddit (through the Reddit Data API with an OAuth client)
- u/[username]

### Bluesky
- [handle.bsky.social]

### Blogs / newsletters (RSS)
- [Name] - `https://example.com/feed/`

### YouTube channels (RSS)
- [Name] - channel ID `UCxxxxxxxx`

## Keywords (intent signals)

Run through the Reddit API, HN and Bluesky on the daily loop.

### High intent (shopping or switching)
- `"alternative to [competitor]"`
- `"looking for a [category] tool"`
- `"recommend a [category]"`
- `"switching from [competitor]"`
- `"frustrated with [competitor]"`

### Problem signals
- `"[category] is so [bad/hard/expensive]"`
- `"why is [category] [problem]"`
- `"hate [pain point]"`

### Brand mentions
- `"[your brand]"`
- `"[your brand misspelling]"`
- `"[your domain]"`

### Competitor mentions (watch for switching language)
- `"[competitor 1]"`
- `"[competitor 2]"`

## Subreddits

Pulled through the Reddit Data API on the daily loop.

- r/[your niche]
- r/[adjacent community]

## Saved searches (the user opens these)

- LinkedIn Sales Navigator: [Search name] - `https://linkedin.com/sales/search/people?...`
- LinkedIn hashtag: `https://linkedin.com/feed/hashtag/yourtopic/`
- X advanced search: [Search name] - `https://x.com/search?q=...&f=live`

## Do not engage

- Accounts known for bad-faith dunking: [@handle]
- Brands or competitors who'll screenshot: [list]
- Topics to avoid: [politics, founder hot takes, etc.]

## Notes for Claude

- For "today's top 10", use the output format in the listening loop.
- Reddit only through the Data API with an OAuth token; HN, Bluesky and RSS through their public endpoints.
- LinkedIn and X: work from what the user pastes or reads out, or from Grok / xAI X search; don't fetch behind the login.
- Default lookback: 24h. The user can override.
- Always ask before posting: output drafts; the user approves and posts by hand.
```

## Prove it

The filled file names the ICP, 20 to 50 target accounts, at least one high-intent keyword group and a do-not-engage list; every Reddit source is marked for the Data API; and the notes keep posting with the user.
