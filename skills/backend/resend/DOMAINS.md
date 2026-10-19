# Domains

A domain you own and verify in Resend is required to send or receive; once verified you can send from any address at it, with no separate sender identity. Verification is DNS: Resend generates SPF and DKIM records (TXT plus MX, or CNAMEs on newer domains) that you add exactly as shown. The troubleshooting guides name records on the wrong host, a proxied CNAME, a provider that appends the domain, and region errors. Send from a subdomain, add DMARC yourself (it is not automatic), and keep open and click tracking off for transactional mail. Deliverability practice beyond Resend's own settings is in [email-practices SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/SKILL.md); inbound MX setup is in [RECEIVING.md](RECEIVING.md).

**Contents:** [Workflow](#workflow) · [Subdomains](#subdomains) · [DNS records](#dns-records) · [Verification and statuses](#verification-and-statuses) · [DNS pitfalls](#dns-pitfalls) · [DKIM](#dkim) · [DMARC](#dmarc) · [Custom return path](#custom-return-path) · [Regions](#regions) · [TLS](#tls) · [Open and click tracking](#open-and-click-tracking) · [Domain claims](#domain-claims) · [Multi-tenant setups](#multi-tenant-setups) · [Warm-up and dedicated IPs](#warm-up-and-dedicated-ips) · [Deliverability checks](#deliverability-checks) · [Prove it](#prove-it)

## Workflow

Create, add the DNS records, verify, poll status, then send. For a project that both sends and receives, the vendor skill says set up the inbound domain first, then sending.

- **Add a domain** via the dashboard, the API, the CLI (`resend domains create --name example.com --region us-east-1`) or the MCP server. Use a domain you own, not a shared or public one.
- **Node methods:** `domains.create(params)` (returns the DNS records), `get(id)`, `list({ limit?, offset? })`, `update(params)` (tracking, TLS, capabilities), `remove(id)` (permanent, no undo), `verify(id)` (asynchronous).

```typescript
const { data, error } = await resend.domains.create({
  name: 'send.acme.com',           // subdomain recommended
  region: 'us-east-1',              // immutable after creation
  customReturnPath: 'bounce',       // optional: bounce@send.acme.com, helps DMARC alignment
  openTracking: false,
  clickTracking: false,
});
if (error) {
  console.error(error);
  return;
}

// data.records contains DNS records to add:
// [{ type: 'MX', name: '...', value: '...' }, { type: 'TXT', ... }, ...]
console.log(data.id);      // domain ID for later calls
console.log(data.records);  // add these to your DNS provider
```

- **Create Domain body (REST):** `name` (required), `region` (default `us-east-1`), `custom_return_path` (default `send`), `open_tracking`, `click_tracking`, `tracking_subdomain`, `tls`, `capabilities: { sending: 'enabled'|'disabled' (default enabled), receiving: 'enabled'|'disabled' (default disabled) }`, with at least one capability enabled.
- **Update Domain** (`PATCH /domains/:id`) changes `click_tracking`, `open_tracking`, `tracking_subdomain`, `tls` and `capabilities`; omitted fields keep their value. Region and return path can't be updated.

```typescript
resend.domains.update({ id: 'domain_abc123', clickTracking: true, openTracking: true, tls: 'enforced', capabilities: { sending: 'enabled', receiving: 'enabled' } })
```

  CLI: `resend domains update <id> --no-open-tracking --click-tracking --tracking-subdomain links --tls enforced`.
- **Domain limits** are set by plan (Free 3 verified domains, Pro 10, Scale 1,000); a domains add-on adds 100 more on paid transactional plans (admins only; it doesn't change the email quota, contact limit or rate limit). There is no fixed ceiling: contact support.

## Subdomains

- **Send from a subdomain, not the root** (e.g. `send.example.com`, `notifications.example.com`, `updates.example.com`). Each subdomain is configured and verified on its own.
- **Why:** reputation isolation (a compromised subdomain can be quarantined), no MX conflicts with Google Workspace or Microsoft 365, and transparency about each stream's purpose.
- **One subdomain per purpose:** transactional from `notifications.acme.com`, marketing from `mail.acme.com`, so a newsletter can have tracking while password resets don't.
- **Never use lookalike domains** (`getacme-mail.com`, `acme-alerts.com`).
- **Use addresses that can receive replies** (e.g. `support@`), not "no-reply".

## DNS records

- **Add the DKIM and SPF records exactly as generated** (`TXT` and `MX`, or `CNAME`). DKIM CNAMEs, MX and TXT go on the subdomain.
- **Example record set (older domains):**

| Record | Type | Host | Value |
|---|---|---|---|
| DKIM | TXT | `resend._domainkey` | `p=MIG...` |
| SPF | MX | `send` | `feedback-smtp.us-east-1.amazonses.com`, priority 10 |
| SPF | TXT | `send` | `v=spf1 include:amazonses.com ~all` |
| Tracking | CNAME | `links` | `links1.resend-dns.com` |

- **Domains created after August 2026** may get CNAME records instead of the SPF TXT and MX pair. With Return-Path `outbound`, add records for both `outbound.example.com` and its r-prefixed sibling `routbound.example.com`. Always add the exact records the dashboard or API shows.
- **A CNAME can't share a subdomain with other records:** remove existing records on `send.example.com`, or configure a different return path (e.g. `bounce.example.com`).
- **The sending MX on `send.example.com` doesn't conflict with root MX** (e.g. Google). Priority 10 is suggested on `send`; the lowest possible is 0. Same-priority MX records are picked at random per attempt.
- **The MX value is region-specific** (`feedback-smtp.{region}.amazonses.com`): copy it from the create response.

## Verification and statuses

- **`resend.domains.verify(id)`** (`POST /domains/:id/verify`) triggers verification asynchronously and returns immediately; the domain is `pending` meanwhile, and status changes fire `domain.updated` webhooks. Poll `domains.get(id)` for `status`, or listen for the webhook.
- **Timing:** often within 15 minutes; DNS can take up to 72 hours. The Supabase guide says 5 to 10 minutes; the vendor skill says "minutes to hours". Check records at https://dns.email. After 72 hours use the "Restart verification" button.
- **Statuses:**

| Status | Meaning |
|---|---|
| `not_started` | Added, but `Verify DNS Records` not clicked yet |
| `pending` | Resend is still trying to verify |
| `verified` | Verified for sending |
| `partially_verified` | One capability verified, or one of two sending CNAMEs verified: can send, but with no fallback server |
| `partially_failed` | Verified, but one of the features (send or receive) is not verified |
| `failed` | Records not detected within 72 hours |
| `temporary_failure` | Previously verified; rechecked for 72 hours, then `failed` or back to `verified` |

- **Webhook name conflict:** the multi-tenant guide says listen for `domain.verified`; the event list has only `domain.created`, `domain.updated` and `domain.deleted`, and the Verify Domain reference says status changes fire `domain.updated` ([WEBHOOKS.md](WEBHOOKS.md)). Confirm in the current docs.
- **Terminal checks:**

```bash
dig TXT send.example.com +short
dig MX send.example.com +short
dig CNAME resend._domainkey.send.example.com +short
```

  Or: `nslookup -type=TXT resend._domainkey.example.com`, `nslookup -type=TXT send.example.com`, `nslookup -type=MX send.example.com`, `nslookup -type=CNAME send.example.com`, `nslookup -type=CNAME rsend.example.com`.

## DNS pitfalls

- **Cloudflare proxy off:** every Resend record must be gray cloud ("DNS only"). The orange cloud on a CNAME blocks verification and breaks DKIM.
- **Providers that auto-append the domain** (GoDaddy, Namecheap) turn `resend._domainkey.send` into `resend._domainkey.send.acme.com.acme.com`. Add a trailing dot (`feedback-smtp.eu-west-1.amazonses.com.`) or enter only the subdomain part.
- **Records on the subdomain, not the root:** the DKIM CNAME goes on `resend._domainkey.send.example.com`; SPF records on `send`.
- **Nameserver conflicts:** add records where the NS records point.
- **Region errors:** "region-mismatch" and "multiple-regions" for MX-based domains.
- **DKIM copy mistakes:** extra quotes or spaces, truncation, SPF content in the DKIM record, a partial copy.

## DKIM

- **Resend signs with 1024-bit keys;** 2048-bit is not supported, the key length can't be changed and keys aren't rotated on request. The key stays with the domain even if you delete and re-add it in the same team. The basis is RFC 8301 section 3.2; the 2024 Google, Yahoo and Microsoft bulk-sender rules (over 5,000 messages a day) require DKIM, SPF and DMARC but no key length.

## DMARC

- **Not automatic, strongly recommended.** Gmail and Yahoo require DMARC for bulk senders since 2024.
- **Roll out in three steps.** TXT at `_dmarc`, starting with `v=DMARC1; p=none; rua=mailto:dmarcreports@example.com;`. Test every sending source (look for `dmarc=pass` in headers; Google Postmaster Tools), then move to `p=quarantine;`, then `p=reject;`.
- **Pass needs SPF or DKIM;** DMARC fails only when both fail. Policies: `none` allows and monitors, `quarantine` sends to spam, `reject` bounces.
- **Parameters:** `v`, `pct`, `ruf`, `rua`, `p`, `sp`, `adkim`, `aspf`. `pct` and `ruf` are not widely honored.
- **BIMI** becomes possible once the policy is `quarantine` or `reject`.

## Custom return path

- **Default subdomain `send`.** Used for SPF authentication, DMARC alignment and bounce handling.
- **Set only at creation** (dashboard Advanced options, REST `custom_return_path`, Node `customReturnPath`, CLI `domains create`). Update Domain doesn't accept it: delete and re-add the domain to change it.
- **Rules:** at most 63 characters, starts with a letter, ends with a letter or number, letters, numbers and hyphens only. Avoid values like `testing`: recipients can see it.

```typescript
resend.domains.create({ name: 'example.com', customReturnPath: 'outbound' })
```

## Regions

| Region | Location |
|---|---|
| `us-east-1` (default) | North Virginia |
| `eu-west-1` | Ireland |
| `sa-east-1` | São Paulo |
| `ap-northeast-1` | Tokyo |

- **Region controls routing and sending only.** All account data (metadata, logs, API records) is stored in the US regardless.
- **Data residency, sources differ:** the vendor skill says set the region explicitly for EU, SA or AP data residency requirements; the docs say region controls sending only, all account data stays in the US, and teams with strict residency needs should review the Subprocessors list and Privacy Policy. Confirm in the current docs.
- **Immutable:** to change it, delete the domain, re-add it with the new region and update DNS.
- **One domain in several regions:** use a unique subdomain per region (`us.example.com`, `eu.example.com`).
- **Dedicated IPs need the same region** across your domains ([below](#warm-up-and-dedicated-ips)).

## TLS

- **`tls: 'opportunistic'`** (default): tries TLS and falls back to unencrypted. Suggested for marketing.
- **`tls: 'enforced'`:** the email is not sent if the receiving server lacks TLS. It may raise bounces from old servers; suggested for sensitive and auth emails, and only if all recipients support TLS.
- **Versions:** Resend supports TLS 1.2, 1.1 and 1.0.

## Open and click tracking

- **Configured per domain, not per email,** and disabled by default. Dashboard: Domain > Configuration > Click/Open Tracking, or `domains.update({ openTracking, clickTracking })`.
- **Active only when enabled and a tracking subdomain is configured and verified** (a CNAME, plus a CAA record if the domain has CAA records). Set it on create or update with `trackingSubdomain` (e.g. `'links'` or `'track'`); avoid negative names like `tracking`. Shared tracking domains hurt; use your own.

```typescript
resend.domains.create({ name, openTracking: true, clickTracking: true, trackingSubdomain: 'links' })
```

- **The tracking subdomain can be changed but never removed.** Keep old tracking DNS records (the inactive one shows dimmed). Removing a domain that has a tracking subdomain removes the proxy and breaks old links. Some embargoed regions can't get the TLS certificate.
- **How it works:** open tracking inserts a 1x1 transparent GIF; click tracking rewrites links through the tracking subdomain.
- **Opens are inaccurate:** Gmail clips messages over 102 KB, images get blocked, privacy and malware scanners pre-fetch, and plain-text-only emails can't be tracked.
- **Turn tracking off for transactional email.** Open tracking likely hurts inbox placement, and tracking on password resets or receipts can trigger spam filters. Suggested only for the Broadcast subdomain.

## Domain claims

Taking over a domain another Resend team already verified. A domain can be active on only one team.

- **Flow:** Claim, add the TXT proof, verify the claim, wait for `completed`, update DKIM in DNS, verify the domain, send.
- **The domain transfers as brand new with fresh DKIM keys;** the old DNS records can't be reused. `completed` only means the transfer finished: still fetch the new records with `domains.get()`, update DNS and call `domains.verify()`.
- **Node** (`resend` >= 6.14.0; also the CLI `resend domains claim` and REST): `domains.claims.create({ name })` with optional `region`, `customReturnPath`, `openTracking`, `clickTracking`, `trackingSubdomain` (no `tls` or `capabilities`) returns a `domain_claim` with `domain_id` and a TXT `record` `{ type: 'TXT', name, value, ttl }`; `claims.get(domainId)` returns the latest claim; `claims.verify(domainId)` runs the DNS proof and transfer asynchronously.
- **Statuses:** `pending`, `verified`, `completed`, `blocked` (read `blocked_reason`: `grace_period`, `recent_owner_activity`, `pending_scheduled_emails`), `expired`, `superseded`, `canceled`, `failed`. A claim expires in 7 days. Cancel it by deleting the placeholder domain.

```typescript
// 1. Start the claim: returns the placeholder domain id + TXT record to add
const { data: claim, error } = await resend.domains.claims.create({
  name: 'send.acme.com',
});
if (error) {
  console.error(error);
  return;
}
console.log(claim.domain_id); // placeholder domain id for later calls
console.log(claim.record);    // { type: 'TXT', name, value, ttl }: add to DNS

// 2. After adding the TXT record, trigger verification
await resend.domains.claims.verify(claim.domain_id);

// 3. Poll until the claim status is 'completed'
const { data: latest } = await resend.domains.claims.get(claim.domain_id);
console.log(latest.status); // 'pending' | 'verified' | 'completed' | 'blocked' | ...

// 4. Once 'completed', the transferred domain has NEW DKIM records:
//    fetch them, update your DNS, then verify the domain itself.
const { data: domain } = await resend.domains.get(claim.domain_id);
console.log(domain.records); // add these to DNS, then:
await resend.domains.verify(claim.domain_id);
```

- **"The `example.com` domain has been registered already"** (403 `validation_error`): check your account and teammates, then claim it.
- **Moving a domain between accounts:** the multi-tenant guide says delete it from the original account first; plan for the interruption.

## Multi-tenant setups

- **Option A, one account:** add and verify each tenant's domain and create a domain-scoped sending key per tenant. Reputation is shared (one bad tenant can affect all, and the account may be suspended), you will likely need a rate-limit increase, every domain counts toward the domain limit, and webhooks are routed by tag (`tags: [{ name: 'tenant_id', value: 'tenant_abc123' }]`).
- **Option B, bring your own key:** each tenant has its own account and key (`new Resend(tenantApiKey)`): full isolation. Teams can't be created via the API.
- **Tenant key, as published:**

```typescript
await resend.apiKeys.create({ name: 'Tenant: tenant-domain.com', permission: 'sending_access', domain_id: domain.id });
```

  The token is returned only once. The guide passes `domain_id` while the Node SDK convention is `domainId` ([SETUP.md](SETUP.md#api-keys-and-permissions)).
- **Every new tenant domain follows a warm-up schedule** and uses a subdomain.

## Warm-up and dedicated IPs

- **Ramp volume on a new domain:**

| Day | New domain, per day (max per hour) | Existing domain, per day (max per hour) |
|---|---|---|
| 1 | 150 | 1,000 (100) |
| 2 | 250 | 2,500 (300) |
| 3 | 400 | 5,000 (600) |
| 4 | 700 (50) | 5,000 (800) |
| 5 | 1,000 (75) | 7,500 (1,000) |
| 6 | 1,500 (100) | 7,500 (1,500) |
| 7 | 2,000 (150) | 10,000 (2,000) |

- **Watch the thresholds while ramping:** bounce rate under 4%, spam complaint rate under 0.08% ([LIMITS-AND-ERRORS.md](LIMITS-AND-ERRORS.md#reputation-thresholds)). Avoid third-party "warm-up services".
- **Dedicated IPs** are managed pools (automatic warm-up, scaling, monitoring). They don't help under about 90,000 emails a month, with inconsistent sending or for new senders. The IP list is not exposed (no IP allowlisting). Requirements: same region, more than 3,000 emails a day, Transactional Scale or Marketing Pro, verified domains. Request in Settings > Usage.

## Deliverability checks

- **Deliverability Insights:** open an email in the dashboard and choose "Insights" to run best-practice checks on it. Failed checks come in two groups.
  - **Attention:** link URLs match the sending domain (mismatched URLs can trigger spam filters); a valid DMARC record; a plain text version (`text` param, or React Email's plain-text render); no "no-reply" sender (some providers use replies when filtering); a small body (Gmail clips messages over 102 KB; the check shows the size); full YouTube URLs (`youtube.com/watch?v=...`), since Gmail flags `youtu.be` links as potential phishing.
  - **Improvements:** use a subdomain; use a custom tracking subdomain for click and open tracking (spam filters may flag links and pixels served from shared tracking domains).
- **Going to spam, the docs' checklist:** SPF and DKIM come with verification (check them with https://dns.email); DMARC is not automatic. Missing or broken authentication is "the most common cause of spam placement". Then review Deliverability Insights, the provider's spam banner (Gmail explains why), and domain reputation in Google Postmaster Tools; warm up a new domain.
- **Corporate filters** (Mimecast, Proofpoint, Barracuda) filter on top of standard checks, often on domain age, content patterns or URL reputation; ask the recipient to check quarantine and allowlist your sending domain.
- **Sending practices:** a dedicated address per email type (`notifications@` for transactional, `updates@` for marketing); no purchased lists or addresses that haven't opted in; a visible unsubscribe link in marketing email; simple HTML (heavy formatting and image-only emails trigger filters more). Outlook headers carry Spam Confidence Level (SCL) and Bulk Complaint Level (BCL) scores.
- **"Delivered" but not received:** Resend only sees the receiving server's `250 OK`; providers share nothing on later filtering. If you can reach the recipient, ask them to check corporate filters, inbox rules, promotional, spam and deleted folders, and group inboxes, then mark it `Not Spam` or allowlist your domain. Otherwise: configure DMARC, warm up new domains slowly, point every link at your own domain, turn off open and click tracking, use fewer images, and keep the wording succinct and clear.

## Prove it

- **Records resolve:** `dig TXT send.example.com +short`, `dig MX send.example.com +short` and `dig CNAME resend._domainkey.send.example.com +short` return the values from `data.records` (or https://dns.email shows them).
- **Status is `verified`:** `resend.domains.get(id)` returns `status: 'verified'`, and a send from an address at that subdomain to `delivered@resend.dev` succeeds.
- **Domain match:** a send from an address at the root (when only `send.acme.com` is verified) returns 403; from the subdomain it works.
- **DMARC passes:** a received test email's headers show `dmarc=pass`, and `_dmarc` resolves to your policy.
- **Tracking is off on transactional domains:** the domain's `open_tracking` and `click_tracking` are false, and links in a password reset email are not rewritten.
- **Region is right:** `domains.get(id)` shows the intended `region`, and the MX value names the same region.
- **Claims:** after `completed`, the domain's records differ from the old ones and verification passes with the new DKIM values.
