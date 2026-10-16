# The composer

## The empty state

- **A greeting by the hour** (morning, afternoon, evening, night) with the user's first name (from the full name) and the product's mark inline, and "how can I help". The server doesn't know the reader's time, so it renders none (an external-store subscription with a null server snapshot), and the client updates it each minute. Until the account's kind is known, assume the more common one.
- **The composer under it, with suggestion chips** for the account's kind (a business and a person get different ones). A chip **fills the composer** with a fuller request and puts the caret at its end; it doesn't send. Chips rise a few pixels from a light blur, one after another.
- **On narrow screens** the greeting settles at the bottom of the upper half with the composer and chips below it; from tablet width the block centres and the chips move under the composer.

## The cycling placeholder

Over the empty text box only, example requests appear one letter at a time (about 30 ms apart, each fading over 0.3 s), hold for two seconds, then fade out last letter first at a faster pace before the next one. Typing hides it and clears the hold timer; clearing the box starts the current line again from its entry. Keep the phase (enter, hold, exit) in a ref and advance to the next line when the exit completes. Split by graphemes, never inside a letter with its marks, and wrap each word so lines never break inside it; `aria-hidden`. A business and a person get different examples.

## The box

- **A rounded card** with the attached files as chips on top, the text box, and a footer with attach and dictate at the start and send at the end. Buttons inside it keep concentric corners (outer radius minus the padding). A soft shadow only on wider layouts.
- **The text box grows with its content** (`field-sizing: content`) between a minimum and a maximum height, at 16px so phones don't zoom in, its direction taken from what is typed, and it takes focus when the composer opens.
- **Keys:** Enter sends, Shift+Enter starts a new line, nothing happens while an input method is composing; Backspace in the empty box removes the last file.
- **The send button keeps focus in the text** (prevent the mouse-down default) so typing can go on.
- **The text box's attributes:** `enterKeyHint="send"`, spell check off, a `maxLength`, and paste intercepted only when the clipboard holds files (call `preventDefault` only then, so pasting text still works).
- **The footer changes with the state:** while dictating, attach and dictate give way to a "cancel recording" button; while the agent answers, send is hidden until something is typed and then reads "queue message", and stop is the primary button when nothing waits to be queued, an outline one when something does.
- **Guard against a double send** while files are being prepared (a ref and a state, the box disabled meanwhile), so a second Enter doesn't send twice.
- **Errors in the composer** (queue full, unreadable files) show in one line under it with `role="alert"`.
- **Every icon button names itself** in a tooltip, the same name screen readers hear.

## Files

- **Paste or drop anywhere on the composer** to attach; while files are held over it, a dimmed, lightly blurred overlay says to drop them. React only when the drag's types include `Files`. A drag that leaves to a child of the form (its `relatedTarget` inside the form) doesn't end it.
- **Decide a document's type by its extension,** since browsers name some types differently or not at all, and re-type the upload when the browser's type differs. One map from extension to type (PDF, office and OpenDocument files, RTF, EPUB, CSV, plain text, markdown, images) feeds both the check and the picker's `accept` list. Copy the picked files out at once and then reset the input's value, so picking the same file again still fires.
- **Check count, type and size as files are added** and again on the server, with a specific error for each, in that order: a batch that would pass the count is refused whole; then unreadable types are dropped with an error; then files that are too big. Nothing is added or removed while files are being prepared.
- **A chip** is a small pill with a tiny thumbnail (or a file icon) and the name; on hover or focus the thumbnail fades out and a remove button fades in on the same spot, and a card below previews the image with its type, opening without delay. Each mounted preview holds its own object URL and revokes it on unmount.

## Dictation

- **Stream to a real-time transcription service** over a socket, converting the microphone to 16-bit PCM in an audio worklet in chunks of a few thousand samples; queue the audio recorded before the socket opens and send it right after the config. Hint the app's language first.
- **A single-use key per dictation from your server,** so the service's key never reaches the browser.
- **Stop** ends the audio, waits a bounded time for the final transcript (keeping what was final by then), and appends it to the draft; **cancel** throws it away. Sending while dictating sends what was heard too; if the send fails, the heard text goes back into the draft.
- **Guard against late starts:** a numbered attempt that was stopped while it waited for the microphone or the key releases what it opened. Leaving the page ends dictation. Name the microphone errors from the `DOMException` name (`NotAllowedError` or `SecurityError`: denied; `NotFoundError`: missing) and report "unsupported" with no secure context or no `AudioWorklet`. A failed key request is a network error.
- **The phases** are idle, starting, listening and finishing. Inline the worklet's code as a Blob URL and revoke it once loaded. Ask the service to identify the language, with the app's language and one other as hints; keep the final tokens and the pending ones apart, and skip the service's control tokens. Finishing sends an empty frame and waits for the socket to close, up to 10 s, then keeps what was final; an error while finishing only ends the wait.
- **Send while dictating** stops first and sends the typed text and the heard text together; on failure the heard text goes back into the draft, after a space unless the draft ends with one.
- **The recording strip** replaces the text: the elapsed time (m:ss, tabular figures) and a waveform of the microphone level scrolling toward the start, bars a few pixels wide that fade at both edges, the level sampled every 50 ms and smoothed, with a noise floor and a cap on how much one bar may differ from the last (numbers in [MOTION.md](MOTION.md)). The whole strip is the stop button ("stop and review"). The timer runs before the stream opens; under reduced motion only the timer shows; while transcribing it says so and the stop button is disabled. The canvas follows the device pixel ratio and takes its color from CSS.

## Messages sent while the agent works

- **The composer stays usable.** Stop sits beside send; send becomes "queue". What the user sends waits above the text, one muted line each with a remove button, and a hint that it goes when the answer ends and that closing the page drops it.
- **When the answer ends with no approval waiting,** the queued messages go as one message, the trimmed non-empty texts joined by a blank line in order and files together. Sending while an approval card waits would abort the card, so they wait for it too. Only the ones sent leave the queue; one queued meanwhile waits for the next answer; a guard stops a double send.
- **Refuse to queue** when the combined message would pass one message's limits (around 5,000 characters, five files, 10 MB each), and keep the draft.
- **Each queued line** previews its text or its file names, and its remove button's label quotes its first 60 characters.
- **The server still refuses a second answer** in the same conversation (a second tab), so the queue is a convenience, not the guard.
