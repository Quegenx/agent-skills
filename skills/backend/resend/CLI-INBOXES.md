# CLI inboxes

An inbox is an address at a verified domain that sends and receives; received messages group into threads. Receiving must be enabled on the domain unless the inbox is created with `--forwarding`. Every inbox command follows the non-interactive contract in [CLI.md](CLI.md); receiving on a domain is set up in [DOMAINS.md](DOMAINS.md), and the `inbox.*` webhook events are listed in [CLI-COMMANDS.md](CLI-COMMANDS.md#webhooks).

## Keys and IDs

- **Keys:** most inbox commands need a full-access key. A sending-access key can run `threads emails reply`, `threads emails forward`, `drafts create` and `drafts send`, and must pass every ID (ID pickers need full access). A domain-limited key must match the inbox's domain.
- **IDs are positional, parent first** (inbox, then thread, draft or label, then email). Each also has a flag (`--inbox-id` and so on); passing both returns `invalid_options`. They are required non-interactively. **Put positional arguments before variadic flags** such as `--to`, or the ID becomes a recipient: `inboxes drafts create <inbox-id> --to a@example.com`.
- **Any command naming an inbox accepts its ID or email address** (case-insensitive); an unknown address errors.

## Inbox commands

- **`inboxes create`:** `--email-address` (required non-interactively; local part letters, numbers, `. _ % -`, no `+`), `--name` (internal, recipients do not see it, max 64), `--from-name` (the name used when sending from this inbox, for example `Ada from Support`; a plain name, not `Name <email>`), `--forwarding` (no MX; Resend generates a `receiving_address`). Output is only `{"object":"inbox","id":"<uuid>"}`; run `inboxes get` for `receiving_address`.
- **`inboxes list`** (default subcommand, alias `ls`): `id`, `name`, `email_address`, `from_name`, `unread`, `last_received`, `created_at`, `updated_at`.
- **`inboxes get <id>`** adds `domain_id`, `receiving_address`, `drafts`.
- **`inboxes update <id>`:** `--name`, `--from-name` (`""` clears), at least one. The email address cannot change.
- **`inboxes delete <id> --yes`** (alias `rm`) removes threads and messages; the address stops receiving.

## Threads

- **`threads list [inboxId]`:** newest activity first. `--folders` (`inbox`, `archive`, `spam`, `sent`, `trash`; default `inbox`, or `inbox`, `archive`, `sent` with `--labels`), `--labels` (label UUIDs, not names; any match), `--read` (every email read) / `--unread` (at least one unread email), exclusive; pagination by thread ID. A thread matches a folder when any of its emails is in it; `spam` and `trash` match only when named. Fields: `id`, `subject`, `from`, `to`, `cc`, `bcc`, `labels`, `email_count`, `has_attachment`, `has_draft`, `read`, `received_at`, `folder`.
- **`threads search [inboxId]`:** `--query` (every word must match; quote a phrase; `-` excludes; max 256 characters; searches subject, body, sender, recipients and attachment names), `--from`/`--to`/`--cc`/`--bcc` (partial match, max 20), `--has-attachment`/`--without-attachment` (exclusive), `--start-date`/`--end-date` (`2026-09-01` or ISO 8601; a date covers the whole day), plus the list flags.
  - **Search lags up to about a minute** behind new email; use `threads list` to browse exactly.
  - **Flags AND together.** Folder, label and read flags apply to the thread; the others must match the same email, which must be in one of `--folders`.
  - **Over 10,000 matches,** results cover the 10,000 with the newest matching email.
  - **Output adds `matched_email_id`,** usable as the email ID for `emails get`, `reply` and `forward`.
- **`threads get`:** `{"object":"inbox_thread","id":"<uuid>","subject":...,"folder":...,"labels":[],"read":true}`. Read messages with `threads emails list`.
- **`threads update`:** `--read`, `--unread` (mark every message), `--folder` (`inbox`, `archive`, `spam`, `trash`; `sent` is not valid), at least one. Moving out of `trash` restores the thread and clears its deletion deadline.
- **`threads delete --yes`** (alias `rm`) moves to `trash`, deleted after 30 days; reversible by moving it to `inbox`, `archive` or `spam` with `threads update --folder`. `deleted` is `false` if it was already in trash.
- **Labels on a thread:** `threads labels add --labels` (1 to 10 UUIDs from `labels list`, comma or space-separated; existing labels stay); `threads labels set --labels` (0 to 100, atomic replace, `""` removes all); `threads labels remove [inboxId] [threadId] [labelId]` (a label not on the thread changes nothing). On `add` and `set` an unknown label errors and changes nothing; `set` and `remove` keep the labels themselves. Output lists every label on the thread after the change. There is no `threads labels list`; read labels with `threads get`.

## Thread emails

- **`threads emails list`:** oldest first, with `html` and `text`; use the email `id` values with `emails get`, `reply` and `forward`. Fields: `id`, `direction` (`inbound` or `outbound`), `from`, `to`, `cc`, `bcc`, `reply_to`, `subject`, `message_id`, `html`, `text`, `attachments`, `read`, `received_at`.
- **`threads emails get [inboxId] [threadId] [emailId]`:** attachments as `{"id","filename","size"}`.
- **`threads emails reply`** sends from the inbox address to the original author or its Reply-To; if the inbox sent the original, to that email's `to`. The email ID comes from `threads emails list`. Output `{"id":"<email-id>"}`.
  - **Flags:** `--text`/`--html` (one required), `--cc`, `--bcc`, `--subject`, `--attachment`, `--attachments-file`, `--reply-all`, `--headers`, `--idempotency-key`. `--attachment` takes `;cid=`, `;type=`, `;filename=` as on `emails send`; quote values containing `;`. Cc and Bcc are not copied, except that `--reply-all` merges cc.
  - **`--reply-all`:** on a received email, goes to its Reply-To (or sender), copying the other `To` addresses and `cc`; on an inbox-sent email, to its Reply-To when that is not the inbox address, otherwise its `to`, copying its other `to` addresses and its `cc`. The inbox address is excluded, duplicates removed, Bcc never copied.
  - **Limits:** max 50 recipients (counted after `--reply-all`); attachments max 25 MB total (URL files not counted, fetched at send). An empty file, a blocked file type, or a URL that does not start with `http` or starts with `http://localhost:` errors; other URL problems fail at send.
- **`threads emails forward`:** `--to` (required), `--cc`, `--bcc`, `--text`, `--html` (a note), `--subject`, attachments, headers, idempotency key. Combined recipients max 50. The original attachments go with the forward together with any files you add, max 25 MB total (URL files not counted). An empty file, a blocked file type, or a URL that does not start with `http` or starts with `http://localhost:` errors; an original attachment that was sent from a URL cannot be forwarded (error).
- **Reserved headers:** on reply, forward and `drafts send`, `In-Reply-To`, `References` and `Reply-To` are reserved (Resend sets them); passing any of them, in any case, returns an error. A header name cannot be empty; names and values cannot contain line breaks or null characters.

## Labels

- **`labels list`** (not paginated, alias `ls`): `id`, `name`, `color` (`#RRGGBB`), `created_at`.
- **`labels create --name`** (max 64) **`--color`** (hex like `'#E93D82'`, quoted so the shell keeps the `#`; random if omitted). Output `{"object":"inbox_label","id":"<uuid>"}`. Up to 100 labels per inbox; names are unique per inbox, case-insensitive; color is stored uppercase.
- **`labels update`** (`--name`/`--color`, at least one). **`labels delete --yes`** removes the label from every thread.

## Drafts

- **`drafts list`:** `type` (`standalone` or `reply`), `to`, `cc`, `bcc`, `subject`, `snippet`, `thread_id`, `reply_to_email_id`, `attachments`, `updated_at`.
- **`drafts create`:** standalone, or a reply when `--thread-id` and `--reply-to-email-id` are passed together. Output `{"object":"inbox_draft","id":"<uuid>"}`.
  - **A reply draft without `--to`** is addressed to the sender (or Reply-To); for an inbox-sent email, to its `to`. Without `--subject` it uses the thread subject prefixed `Re:` (unless already prefixed).
  - **One unsent reply draft per target email.** A second create returns the existing draft ID and ignores the other flags, except attachments, which replace.
  - **At least one content field** (attachments count); max 50 recipients.
  - **`--attachment` takes a local file with `;type=<MIME type>` and an optional `;filename=`** (quote values containing `;`). **Attachments need `content`, `filename`, `content_type`;** a URL or `;cid=` errors; max 25 MB total; empty files or blocked types (for example `.exe`) error.
- **`drafts get`:** the full body plus `email_id`, `created_at`.
- **`drafts update`:** at least one option; provided fields replace. `--text` or `--html` replaces the whole body (the omitted part becomes `null`). Same flags as create minus `--thread-id`, `--reply-to-email-id` and `--idempotency-key`, plus `--clear-to`, `--clear-cc`, `--clear-bcc`, `--clear-subject`, `--clear-text`, `--clear-html`, `--clear-attachments`. `--attachment`/`--attachments-file` replace every attachment, `--clear-attachments` removes them all; omit all three to keep them. A clear flag plus a value for the same field returns `invalid_options`. Updating a sent draft errors. Output `{"object":"inbox_draft","id":"<uuid>"}`; run `drafts get` to read the draft.
- **`drafts delete --yes`** (alias `rm`) discards an unsent draft; a sent draft errors.
- **`drafts send`:** a reply draft is sent in its thread; a draft without a thread starts a new one. Needs at least one `to` and `html` or `text`; a standalone draft needs a non-empty subject; a reply draft without a subject uses the thread subject prefixed `Re:` (unless already prefixed). A sent draft errors. Flags `--headers`, `--idempotency-key`. Output `{"id":"<email-id>"}`.

## Inbox agent

- **`agent get`:** `{"object":"inbox_agent","instructions":...,"tone":...,"actions":["draft_reply"]}`. Unconfigured returns empty settings. `actions` come in a fixed order.
- **`agent update`:** at least one option; omitted fields keep their value. Output `{"object":"inbox_agent","id":"<uuid>"}`.

| Flag | Values |
|---|---|
| `--instructions` | Max 4000 characters; `""` clears |
| `--tone` | `concise_professional`, `concise_casual`, `expanded_professional`, `expanded_casual`, or `""`; anything else returns `invalid_tone` |
| `--actions` | Replaces the whole set (comma or space-separated), deduplicated: `draft_reply`, `forward_thread`, `add_labels`, `assign_thread`, `mark_as_spam`, `archive`, `move_to_trash`; `""` disables all; anything else returns `invalid_actions` |

## Prove it

- **IDs before recipients:** in `inboxes drafts create <inbox-id> --to a@example.com`, the draft's `to` (from `drafts get`) holds only the intended addresses, no inbox ID.
- **Sending-access key:** reply, forward, `drafts create` and `drafts send` succeed with every ID passed explicitly; other inbox commands need a full-access key.
- **Forwarding inbox:** after `inboxes create --forwarding`, `inboxes get` shows a `receiving_address`.
- **Reply-all:** the sent reply's recipients exclude the inbox address and never include the original Bcc.
- **Trash is reversible:** after `threads delete --yes`, `threads update --folder inbox` brings the thread back.
