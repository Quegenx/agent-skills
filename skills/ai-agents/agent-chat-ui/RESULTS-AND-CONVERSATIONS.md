# Results and conversations

## Tool results as the product's own components

- **Reuse the product's components,** not a chat-only rendering: the same rows as the list pages, the same cards as the board, the same items as the inbox. The user recognises them and can act on them in place.
- **Read them live from the app's state:** changing a task's status or priority in the chat changes the real task, the title opens its editor, a task the agent created appears once the tasks reload after the answer, and one it deleted is left out.
- **The stored message keeps ids only.** The full records travel beside the answer as a transient data part, so the cards render at once; a stored chat opened later reads them by id.
- **Don't show an item twice** in one answer: a later step that returns items an earlier step already showed renders only the new ones.
- **Cap what one answer shows** (around five or six cards) with a "+N more" that opens the full list.
- **Leave out what repeats or misleads:** a third party's own summary line in another language that repeats the fields already shown.
- **Pictures from third parties expire:** check which links expired on the server and fetch fresh ones; key the image by its URL so the new picture replaces the hidden broken one, and hide an image that fails to load.
- **A result row:** a picture, a title that opens the item where it lives (with a small outward arrow), and one meta line of the parts present, deduplicated, joined by a dot and ending with the source's name. Lines break between parts, never inside one.
- **Counts read naturally:** singular forms ("one group") and numbers that roll to their new value as a search fills.
- **After an answer,** invalidate what it changed wherever it shows (lists, settings, boards).

## Data parts: shown, stored, or both

| Part | Shown | Stored |
|---|---|---|
| Records sent beside the answer, retry notices, live progress | yes | no (transient) |
| The user context, a gate's note, an attached document's text | no | yes (the model reads them later) |
| Follow-up questions | yes, under the last answer | yes, with the answer |

The page sends only text and files; every trusted part is written by the server.

## The conversation list

- **A new chat reuses an empty active one** instead of piling up blanks, and is stored only with its first message; a rename or pin before that is kept locally until then.
- **The title:** the name the user gave it, else a title generated after the first complete answer (not after an error or a stop; one that only said hello tries again after the next answer), else the first user message. A generated title never overwrites a name given meanwhile.
- **Pinned first, then newest.** Deleting the open chat opens a new one.
- **The header title:** clicking the name turns it into a field exactly as wide as its text (a hidden copy in the same grid cell sets the width), focused with the text selected; Enter or leaving saves, Escape or an empty or unchanged name cancels. The browser tab takes the chat's name while it is open.
- **The chat menu:** pin, rename (a dialog that grows out of the menu's trigger, with a live count against the name limit), download as markdown, delete (asking first only when the chat has messages).
- **Search on ⌘K or Ctrl+K:** empty, it offers "new chat", the pinned chats, then the rest by date (today, yesterday, the last 7 and 30 days, then months); typing matches names and message text; the first row is highlighted and Enter opens it; each opening starts empty. Opened from a button it grows out of it; from the keyboard it just fades.
- **Every write checks the owner** before applying a result, so a read that ends after a sign-out never writes into another user's chats.

## A side panel beside the chat

A related list (the user's tasks) as a second sidebar: on desktop it pushes the chat aside as it opens (its width slides; content keeps its full width at the outer edge, so it slides in from there), its edge can be dragged wider or narrower within bounds and a click on the edge closes it; on phones it is a bottom drawer you can swipe down over a blurred backdrop. A keyboard shortcut toggles it, and tooltips name the shortcut. Its open state is remembered per browser, with the server render and first client render closed until hydration.
