---
name: deployment
description: "Containers, local Compose stacks, zero-downtime host and DNS moves, backups, signed releases, npm packages and selected-stack SaaS buildouts. Use when writing a Dockerfile or compose file, moving hosts, setting up backups, verifying release artifacts, publishing an npm package or wiring a selected SaaS stack."
---

# Deployment

Build one artifact, run the same artifact everywhere, and make every change of where it runs reversible. Pick the file:

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| A selected-stack SaaS walking skeleton, identity/data/worker boundaries, environment inventory and incident checklist | [SAAS-BUILDOUT.md](SAAS-BUILDOUT.md) |
| A Dockerfile, image size and security, a local stack with Compose, migrations in containers, self-hosting a third-party image (loopback port, `env_file`, telemetry opt-out, MCP behind an identity proxy) | [CONTAINERS.md](CONTAINERS.md) |
| Moving a site or app to a new host or DNS provider; backups and recovery | below |
| Provenance, keyless signing and verification before promotion, offline verification, release transparency, cached build outputs | [RELEASES.md](RELEASES.md) |
| Creating a monorepo npm package, its exports map, release notes and versions, trusted publishing from CI | [NPM-PACKAGES.md](NPM-PACKAGES.md) |

## The rules

1. **Build once, promote the same artifact.** The image or build folder tested in CI is the one that runs in production; environments differ only in configuration, never in a rebuild.
2. **Configuration comes from the environment,** not from the image or the repo. Secrets come from the platform's secret store, not from a committed compose file or `.env`.
3. **Every cutover has a one-step rollback,** decided before the cutover: one DNS record, one alias, one traffic switch. If rolling back takes a rebuild, it isn't a rollback.
4. **Verify the new thing on its own address before any user reaches it.**
5. **A backup on the same machine as the data shares its fate.** Ship it elsewhere.

## Moving to a new host without downtime

This works for static sites and for apps whose build already runs in CI. The principle: **the old host keeps serving production until one DNS change moves traffic.** Everything before that change can't affect the live site.

```yaml
- name: Build
  run: npm run build

- name: Deploy to the current host
  run: npx netlify deploy --prod --dir=dist

# Temporary: dual-deploy during the migration so the new copy can be checked against production. Delete after the cutover.
- name: Deploy to Cloudflare Pages
  run: npx wrangler@4 pages deploy dist --project-name=myproject --branch=main
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

1. **One build, two hosts.** Keep building in your own CI and add a step that uploads the same output to the new host (for example `wrangler pages deploy dist --project-name=... --branch=main` for Cloudflare Pages direct upload). Don't move the build and the hosting in the same step: the build's environment variables and secrets stay where they work. Mark the extra step as temporary in a comment.
2. **Verify the copy on its own URL** (`<project>.pages.dev`, a preview domain): every page type, search, feeds, sitemap, redirects, forms, and sign-in. Add the new domain to your auth provider's allowed domains and redirect URLs, or sign-in breaks only on the new host.
3. **Move DNS hosting before moving the site.** Change the nameservers at the registrar to the new DNS provider while every record still points at the old host. Before that:
   - **inventory every record** at the old DNS host. The website records fail loudly; the dangerous ones fail quietly: MX for email, the SPF, DKIM and DMARC TXT records, domain verification records, the newsletter or transactional email sending domain. A broken DKIM record sends mail to spam until someone complains;
   - **compare the provider's automatic import against your inventory, record by record.** Imports miss records;
   - keep email and verification records **DNS only** (not proxied through the CDN).
4. **Flip one record** (or attach the custom domain to the new project), and decide the canonical host now (apex with `www` redirecting, or the reverse). Decide the URL shape with it: one trailing-slash policy, enforced (the source's view [coreyhaines31/marketingskills, site-architecture]; no Google doc covers it), and one case, since "Google Search's URL handling is case sensitive" (https://developers.google.com/search/docs/crawling-indexing/url-structure); the URL rules are in [site-architecture URLS-AND-LINKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/site-architecture/URLS-AND-LINKS.md#url-principles). Redirect `http://` to `https://` on the same host first and only then to the canonical host, so each host can set HSTS ([secure-coding HEADERS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/secure-coding/HEADERS.md#https-redirects-and-mixed-content)). Proxied records on a CDN-hosted DNS change in seconds, which is what makes the rollback real: the old host still holds the latest deploy.
5. **Port every rule from the old platform's config.** Read its config file (`netlify.toml`, `vercel.json`, server config) line by line and write down where each redirect, header and rewrite lives now (on Cloudflare Pages, a `_redirects` file in the build output: `/sitemap.xml  /sitemap-index.xml  301`). The rule you forget is the one added years ago. Security headers and the edge rule that blocks dotfiles and repository paths (`/.env`, `/.git/`) are among them ([secure-coding HEADERS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/secure-coding/HEADERS.md#exposed-files)). If page URLs change too, that is a search migration with its own redirect map, sitemaps and monitoring ([site-architecture PLATFORMS-AND-MIGRATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/site-architecture/PLATFORMS-AND-MIGRATION.md#migrating-without-losing-traffic)).
6. **Check what search engines will see, from outside.** On the production hostname, outside the admin session and the local cache, fetch robots.txt, the sitemap and a few deep pages: staging `noindex` rules, robots blocks, wrong canonicals and hostname changes are the common launch breakages [freescan]. The full launch audit, with its cutover record, is [site-audit LAUNCH.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/site-audit/LAUNCH.md).
7. **Let it bake** (days, with real traffic and error monitoring), then delete the old deploy step and decommission the old host.

Weigh the trade-off honestly: one provider for DNS, CDN and hosting is simpler and often cheaper, and also one basket. A host's weak built-in build system doesn't matter if you only upload finished files to it.

## Backups

- **Nightly logical dump, shipped off the server, pruned by age:**

```bash
stamp=$(date -u +%Y%m%dT%H%M%SZ)
pg_dump -Fc "$DATABASE_URL" > "app-${stamp}.dump"
rclone copyto "app-${stamp}.dump" "r2:backups/prod/app-${stamp}.dump"   # any S3-compatible bucket
rclone delete --min-age 30d r2:backups/prod/
rm "app-${stamp}.dump"
```

- Object storage without egress fees suits backups, since restoring means downloading everything.
- On a managed database (Supabase), the platform's own backups protect against the platform's failures; an off-platform dump protects against losing the account, a bad migration you notice late, or wanting the data somewhere else.
- **A backup counts once a restore has worked:** follow the [recovery procedure](#recovering-a-data-platform). Alert when the nightly job fails or the newest file is older than a day.
- Encrypt dumps that contain personal data, and limit who can read the bucket.

### Recovering a data platform

- **Restore beside live data,** never over it: restore into a new instance, verify it, then either copy the lost rows back or switch traffic. Restoring in place destroys the evidence and every good write since the incident. Restore the latest dump into a scratch database on a schedule and check row counts or a known record.
- **Rebuild projections from the source of truth:** search indexes, caches and read models are replayed from the restored database or event log. Replay runs separately from live traffic (its own consumers, its own queue or a marked replay stream), so rebuilt events don't trigger emails and charges again.
- **Fence the old writer:** before promoting a replica or a restored copy, make sure the old primary can't accept writes (revoke its credentials, shut it down, use a fencing token or the platform's failover), or two writers diverge (split brain).
- **Reconcile before cutover:** row counts, sums and checksums per table or tenant between the restored copy and what you expect; investigate every difference before users see the data.
- **Erased data stays erased:** a deletion request (privacy law, a user closing an account) must survive a restore. Keep a log of erasures and replay it after every restore, or encrypt each user's data with a per-user key and delete the key (crypto-shredding), which also covers backups you can't edit.
- **Recover without the control plane:** document and test how to restore when the dashboard, the CI system or the identity provider is the thing that's down: credentials in a break-glass store, restore commands that work from a plain shell, backups in a separate account or provider.
- **Targets:** state the recovery point objective (how much data you may lose) and recovery time objective (how long you may be down), and measure both in a scheduled restore drill.

PostgreSQL backup tools, point-in-time recovery and promotion are in [Postgres operations](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/postgres/OPERATIONS.md#backups-and-recovery).

## Prove it

Use the checks for the selected branch: the cutover bullet for a host cutover, the DNS bullet for a DNS/site migration, and the restore bullet for backup/recovery work. Container, npm-package and signed-release tasks use their routed topic's checks.

- Before a cutover, write down the one-step rollback and do it once on the preview setup.
- After moving DNS and before flipping the site: send a test email from and to the domain, check SPF/DKIM/DMARC pass in the headers, and request every old redirect on the new host. After the flip, from a clean browser on the production hostname: robots.txt and the sitemap name production URLs, no page carries a staging `noindex`, `/.env` and `/.git/config` return 404, and `http://` reaches `https://` on the same host in one 301.
- Restore last night's backup into an empty database and query it; measure recovery point and recovery time against the stated targets.
