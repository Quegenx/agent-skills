---
name: deployment
description: "Containers, local Compose stacks, zero-downtime host and DNS moves, backups and signed releases. Use when writing a Dockerfile or compose file, moving hosts, setting up backups or verifying release artifacts."
---

# Deployment

Build one artifact, run the same artifact everywhere, and make every change of where it runs reversible. Pick the file:

| The job | Read |
|---|---|
| A Dockerfile, image size and security, a local stack with Compose, migrations in containers | [CONTAINERS.md](CONTAINERS.md) |
| Moving a site or app to a new host or DNS provider; backups | below |
| Provenance, keyless signing and verification before promotion, offline verification, release transparency | [RELEASES.md](RELEASES.md) |

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
4. **Flip one record** (or attach the custom domain to the new project), and decide the canonical host now (apex with `www` redirecting, or the reverse). Proxied records on a CDN-hosted DNS change in seconds, which is what makes the rollback real: the old host still holds the latest deploy.
5. **Port every rule from the old platform's config.** Read its config file (`netlify.toml`, `vercel.json`, server config) line by line and write down where each redirect, header and rewrite lives now (on Cloudflare Pages, a `_redirects` file in the build output: `/sitemap.xml  /sitemap-index.xml  301`). The rule you forget is the one added years ago.
6. **Let it bake** (days, with real traffic and error monitoring), then delete the old deploy step and decommission the old host.

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
- **A backup counts once a restore has worked:** restore the latest dump into a scratch database on a schedule and check row counts or a known record. Alert when the nightly job fails or the newest file is older than a day.
- Encrypt dumps that contain personal data, and limit who can read the bucket.

## Prove it

- Before a cutover, write down the one-step rollback and do it once on the preview setup.
- After moving DNS and before flipping the site: send a test email from and to the domain, check SPF/DKIM/DMARC pass in the headers, and request every old redirect on the new host.
- Restore last night's backup into an empty database and query it.
