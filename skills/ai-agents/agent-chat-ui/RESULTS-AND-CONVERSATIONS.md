# Results and conversations

## Tool results as the product's own components

- **Reuse the product's components,** not a chat-only rendering: the same rows as the list pages, the same cards as the board, the same items as the inbox. The user recognises them and can act on them in place.
- **Read them live from the app's state:** changing a task's status or priority in the chat changes the real task, the title opens its editor, a task the agent created appears once the tasks reload after the answer, and one it deleted is left out.
- **The stored message keeps ids only.** The full records travel beside the answer as a transient data part, so the cards render at once; a stored chat opened later reads them by id.
- **Don't show an item twice** in one answer: a later step that returns items an earlier step already showed renders only the new ones.
- **Cap what one answer shows** (around five or six cards) with a "+N more" that opens the full list (for tasks, the side panel). A failed save on a card shows inline on that card.
- **Leave out what repeats or misleads:** a third party's own summary line in another language that repeats the fields already shown.
- **Pictures from third parties expire:** check which links expired on the server and fetch fresh ones; key the image by its URL so the new picture replaces the hidden broken one, and hide an image that fails to load.
- **A result row:** a picture, a title that opens the item where it lives (with a small outward arrow), and one meta line of the parts present, deduplicated, joined by a dot and ending with the source's name. Lines break between parts, never inside one. A title built from the record's own fields (street or area plus city for a listing), else its type, else its id; a price of 0 reads "free". A picture keeps the kind's icon underneath, so a hidden or expired image still shows something.
- **Counts read naturally:** singular forms ("one group") and numbers that roll to their new value as a search fills.
- **After an answer,** invalidate what it changed wherever it shows (lists, settings, boards), by tool family: only the families whose tools ran.
- **Seed the app's cache from the data parts as they arrive** (`onData`), so the cards render without a fetch; keep live progress per tool call in its own map, one for the card's progress and one for the status line's.

## Data parts: shown, stored, or both

| Part | Shown | Stored |
|---|---|---|
| Records sent beside the answer, retry notices, live progress | yes | no (transient) |
| The user context, a gate's note, an attached document's text | no | yes (the model reads them later) |
| Follow-up questions | yes, under the last answer | yes, with the answer |

The page sends only text and files; every trusted part is written by the server. A retry notice records the attempt and how many parts the answer had, so "reconnecting" shows only until the answer gains a part. An attached document's stored text keeps a preview, its length and the document's id, and is null when unreadable (a scanned PDF). The server validates stored messages against the tool list before sending them; the client checks only their shape.

## The request and the session

- **The server holds the conversation,** so each request sends only the newest message, the chat's name and pin (saved with the first message) and the locale. Files go as file parts (data URLs), within the same count and size limits the composer checks.
- **Ids are UUIDs made on the client,** the same ones the database stores. Key the chat session by user and conversation, so switching chats starts a fresh session.
- **Continue by itself** once the last answer is complete and every approval has a response (`sendAutomaticallyWhen`).
- **Keep a stored copy in sync whenever no answer is streaming;** the sidebar, search and download read it.
- **Measure the first reply:** the time from send to the first text or tool part, reported as a timing with a budget.
- **One motion config at the page's root** (lazy-loaded features, strict, `reducedMotion="user"`).

## The conversation list

- **A new chat reuses an empty active one** instead of piling up blanks, and is stored only with its first message; a rename or pin before that is kept locally until then.
- **The title:** the name the user gave it, else a title generated after the first complete answer (not after an error or a stop; one that only said hello tries again after the next answer), else the first user message. A generated title never overwrites a name given meanwhile.
- **The title is generated on the server,** which returns none when the chat already has a name or no subject yet; the client applies it only if the owner is the same and the chat is still unnamed. A failed title is logged and the first message stays the name.
- **Pinned first, then newest.** Deleting the open chat opens a new one; deleting every chat (from settings) resets the list to one new chat.
- **Restore once per owner:** opening the app loads the stored chats a single time (an in-flight load kept per owner, so two mounts share it), ignores a response that lands after the owner changed, shows a failed load as a save error, and opens the newest.
- **The header title:** clicking the name turns it into a field exactly as wide as its text (a hidden copy in the same grid cell sets the width; the input gets `size={1}`, since its default 20-character width would count), focused with the text selected on the next frame; Enter or leaving saves, Escape or an empty or unchanged name cancels. The name and the menu chevron light up each on its own hover. The browser tab takes the chat's name only while it has messages, and gets its old title back on unmount.
- **The chat menu:** pin, rename, download as markdown, delete.
  - **Rename** is a dialog that grows out of the menu's trigger, keyed per opening so it starts from the current name, with the text selected on focus, a live count against the name limit, and save disabled until the name changed and is not empty.
  - **Download** writes each message as a `## role` section (its text, or its thoughts when it has only thoughts, and a line naming its files), to a file named by a slug of the title (letters and numbers, dashes trimmed), through a Blob and a temporary link whose URL is revoked. Disabled for an empty chat.
  - **Delete** removes an empty chat at once; one with messages asks first, naming it.
- **Search on ⌘K or Ctrl+K:** empty, it offers "new chat", the pinned chats, then the rest by date (today, yesterday, the last 7 and 30 days, then months, from each chat's creation time); typing matches names and message text; the first row is highlighted and Enter opens it; each opening starts empty. Each row shows how long ago, and the open chat carries a "current" badge; no match gets its own empty state. Read the shortcut from `event.code === "KeyK"` so it works on any keyboard layout, and not with Alt or Shift held. Keep its open state in a global store: the sidebar that opens it unmounts on phones. Opened from a button it grows out of it; from the keyboard it just fades. The clear button puts focus back in the field.
- **Every write checks the owner** before applying a result, so a read that ends after a sign-out never writes into another user's chats.
- **The sidebar's chat rows** are grouped (pinned, then recent), each with a "more" button at its end that shows on hover, on focus and while its menu is open.

## A side panel beside the chat

A related list (the user's tasks) as a second sidebar: on desktop it pushes the chat aside as it opens (its width slides; content keeps its full width at the outer edge, so it slides in from there), its edge can be dragged wider or narrower within bounds and a click on the edge closes it; on phones it is a bottom drawer you can swipe down over a blurred backdrop. A keyboard shortcut (⌘J or Ctrl+J) toggles it, and tooltips name the shortcut. Its open state is remembered per browser, with the server render and first client render closed until hydration.

- **It reuses the list page's component** with that page's stored filters and sort, not its board or list choice.
- **The resize rail:** pointer capture while dragging; a `data-resizing` flag turns off the width transition; the width is a CSS variable clamped between 320 and 720px, the drag delta flipped for right-to-left; a drag of more than 2px swallows the click that would close it. The rail is a 16px strip with a 44px hit area, a hover line that follows the panel's rounded top corner, and no tab stop (the keyboard uses the shortcut).
- **Closed, the panel is `inert`.** On phones the drawer has a handle and a visually hidden title.
