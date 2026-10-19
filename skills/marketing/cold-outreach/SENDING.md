# Sending outreach

Copy only matters if it reaches the inbox, and outreach goes to people who never asked for it, which is exactly what mailbox providers filter. This file covers the setup that is specific to outreach; authentication, DMARC, the Gmail, Yahoo and Microsoft sender requirements, error codes and thresholds for all mail are in [email-practices DELIVERABILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/DELIVERABILITY.md), and the law in [email-practices COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/COMPLIANCE.md). Source: [coreyhaines31/marketingskills, cold-email] references/deliverability.md, corrected where noted. The source says its numbers "come mostly from sending-infrastructure vendors and mailbox providers' own guidelines" and that providers "change enforcement without notice".

## What the mailbox providers say about unsolicited mail

- **Gmail's guidelines reject the premise.** "Don't send messages to people who didn't sign up to get messages from you." "Make sure recipients opt in to get messages from you." "Don't purchase email addresses from other companies." (https://support.google.com/a/answer/81126). The source framed the sender rules as "what every filter rewards" and never quoted these lines.
- **All senders need SPF or DKIM;** bulk senders (5,000+ a day to personal Gmail) need SPF, DKIM and DMARC (https://support.google.com/a/answer/81126). The source said "SPF and DKIM for everyone". The full table is in [email-practices DELIVERABILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/DELIVERABILITY.md#sender-requirements-by-mailbox-provider).
- **Enforcement since November 2025** brings "disruptions, including temporary and permanent rejections" (https://support.google.com/a/answer/14229414). The source said non-compliant mail "gets permanent rejections rather than temporary deferrals".
- **Spam rate:** keep it below 0.10% and never reach 0.30% (https://support.google.com/a/answer/81126). The source's benchmarks file called 0.1% "Google's threshold"; 0.10% is the target and 0.30% the requirement ([email-practices DELIVERABILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/DELIVERABILITY.md#reputation-and-thresholds)).
- **Bulk status is permanent once assigned.** Gmail counts messages from the same primary domain and permanently classifies senders who meet its bulk criteria at least once; reducing current daily volume does not remove that status (https://support.google.com/a/answer/14229414). The source said that under 5,000 a day means you are not a bulk sender; its recommendation to follow bulk rules anyway and the complaint threshold still apply. [coreyhaines31/marketingskills, cold-email]

## The sending setup

[coreyhaines31/marketingskills, cold-email] This is vendor practice; no official page was fetched for it.

- **Never send outreach from your primary domain.** "One bad campaign can damage the domain your customers, invoices, and password resets depend on." The repo's rule for all mail is the same idea at subdomain level: separate sending subdomains per purpose ([email-practices DELIVERABILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/DELIVERABILITY.md#infrastructure)).
- **Use a separate domain that is obviously yours** (`getacme.com`, `acmehq.com`, `tryacme.com` in the source) and redirect it to your main site, so a recipient can always tell who wrote.
- **Authenticate it:** SPF, DKIM and DMARC aligned to the From domain, DMARC starting at `p=none` with reporting ([email-practices DELIVERABILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/DELIVERABILITY.md#authentication)). A custom tracking domain only if you track clicks.
- **Mailboxes with a name, photo and signature,** never aliases of a single mailbox, and only from properly licensed tenants. The From line stays accurate (CAN-SPAM, [SKILL.md](SKILL.md#the-rules) rule 2). The source's claims that Google and Microsoft treat aliases as abuse of their terms, and that Google "reportedly suspended" resold Workspace mailboxes, are not in the Google pages fetched; treat them as unverified.
- **Ramp a new mailbox gradually** before full volume and start with people likely to reply; "Real replies are the strongest reputation signal there is". The repo's warm-up table and Gmail's ramp-up rules are in [email-practices DELIVERABILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/DELIVERABILITY.md#warming-up-and-volume).

## The email itself

[coreyhaines31/marketingskills, cold-email]

- **Plain text.** No images, no HTML templates, no attachments.
- **No link in the first email,** at most one in later ones, never a link shortener.
- **Under about 80 words** for the first email.
- **Open tracking off.** Apple Mail Privacy Protection makes opens meaningless, and Gmail says "Google doesn't track open rates" and that low open rates "aren't necessarily an accurate indicator" (https://support.google.com/a/answer/14229414). The source's "reply rates roughly doubled" with tracking off and "the tracking pixel itself is a spam signal" are vendor claims, unverified.
- **Click tracking off** unless you need it, and then only on a custom tracking domain.
- **The required lines.** The source: a plain-text opt-out ("If this isn't relevant, reply 'no' and I won't follow up") plus your postal address, "CAN-SPAM requires both". The FTC requires more: identify the message as an ad, accurate header information, a non-deceptive subject, the postal address, an opt-out that works for at least 30 days after sending and is honored within 10 business days (https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business). A reply opt-out is allowed ("sending a reply email or visiting a single page"). EU and UK first messages add the data source and the right to object ([email-practices COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/COMPLIANCE.md)).
- **Segment-specific copy and real personalization:** a writing rule, in [COPY.md](COPY.md).

## Verify before you send

[coreyhaines31/marketingskills, cold-email]

- **Verify every list before upload,** and re-verify anything older than about a week. The result-action table, catch-all policy and decay figures are in [prospecting ENRICHMENT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/ENRICHMENT.md#verification).
- **Pause a campaign automatically when its bounce rate passes 2%.** The source: "Keep them under 2% per campaign; under 1% is best in class." The repo records two targets from its own sources, below 4% and below 2% ([email-practices DELIVERABILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/DELIVERABILITY.md#reputation-and-thresholds)); this source sides with 2%. The repo's pause and stop thresholds are [email-practices DELIVERABILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/DELIVERABILITY.md#stop-loss-rules). The source's "several percent bounces can trigger a review at Google" is not in the Google pages fetched.

## Monitoring and stop-loss

[coreyhaines31/marketingskills, cold-email] Check placement before every new campaign and weekly (seed tests), domain reputation weekly (Google Postmaster Tools, Microsoft SNDS), bounces daily per campaign and mailbox, complaints weekly (Postmaster Tools, and replies containing "spam" or "stop"), blocklists weekly per domain, DMARC aggregate reports monthly. Decide the stop-loss rules before launch and enforce them automatically; the triggers and actions are in [email-practices DELIVERABILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/DELIVERABILITY.md#stop-loss-rules). A low reply rate means the targeting or offer is wrong; "more volume makes it worse".

Common mistakes the source lists: sending from the primary domain; skipping verification "because the data provider verified it"; leaving open tracking on and optimizing a number that isn't real; scaling volume to fix a low reply rate; full volume from day one.

## Out of bounds

These appear in the source or around it and are filter, reputation or bot-detection evasion. Name them as do-nots; never build them:

- spintax or copy variation whose purpose is to look less like bulk mail;
- warmup networks that manufacture engagement;
- spare warmed domains kept so "a burned domain can be swapped out", or spreading volume across many domains and mailboxes to stay under per-mailbox limits;
- LinkedIn automation tuned to stay under detection (randomized timing, dedicated residential IPs per account).

The lawful shape: one sender identity per program, authenticated and accurate headers, no tricks to hide that the mail is bulk or automated, and volume limited by consent and law rather than by detection thresholds.

## Prove it

The outreach domain is not the primary domain, redirects to the main site and passes SPF, DKIM and DMARC; the first email is plain text with no link, under about 80 words, open tracking off; it carries the ad identification, postal address and a working opt-out; the list was verified within a week; a campaign pauses by itself when bounces pass the threshold you set; and nothing in the setup exists to hide volume or automation.
