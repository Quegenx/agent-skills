# Interface text

The words inside a product: labels, buttons, errors, empty states, confirmations, toasts, settings, placeholders. They are read by someone in the middle of a task, so they must be instantly clear and tell the person what to do next.

## Start from what exists

Before writing or reviewing, find where the strings live (calls like `t(`, `i18n.`, `<FormattedMessage`, `$t(` and the locale files they read; or a CMS or API) and list the noun used for each object and the verb for each action. New copy uses those words. If it's "Archive" in the menu, it isn't "Move to storage" in the toast. A synonym is a problem only where the same thing is named two ways.

## Rules

- **One voice, tone by stakes.** Warm and light in onboarding, success and empty states; neutral in routine actions and settings; calm and plain in errors and destructive confirmations; serious and explicit for data loss and security. No jokes in errors.
- **Talk to the person.** "You" in instructions, not "the user". In errors, avoid "we" as deflection: "Couldn't load your invoices. Check your connection and try again." Don't mix "My account" with "Your settings" in one flow.
- **Plain words** a tired reader gets on the first pass. No idioms that won't translate. Match the device: tap on touch, click with a pointer, select when both.
- **Buttons start with a verb and name the action:** "Send invoice", "Save draft", "Delete project". Never "OK", "Yes", "Let's go!". A Save that stays disabled until something changes reads "Save changes": "the label itself explains why it's disabled" ([FlutterPro](https://flutterpro.design/details/disable-unchanged-save)). An icon-only button's accessible name names the action ("Delete project"), not the icon ("Trash").
- **Links say where they go:** "Read the billing docs", never "Click here". Two "Learn more" links on one page become "Learn more about exports" and "Learn more about billing".
- **One capitalization rule per element type.** Sentence case by default. "Save Changes" beside "Discard changes" looks careless.
- **Toggles describe the ON state:** "Send read receipts", not "Don't send read receipts".
- **Errors say how to fix it, next to what broke:** "Enter a date as DD/MM/YYYY", not "Invalid date"; "Use at least 8 characters", not "Password too short". No "Oops", no blame, no exclamation marks. Show a known rule as helper text before the person fails it. If the same error fires constantly, change the design. On login and sign-up keep the submit button enabled and show the errors on tap: "a disabled button there doesn't tell the user what's missing" ([FlutterPro](https://flutterpro.design/details/disable-unchanged-save)).
- **Undo over confirmation** for frequent, reversible actions: act now, offer "Project archived. Undo". **Confirm** when it can't be undone, affects others or destroys many items: the title names the action and object ("Delete 'Q3 report'?", never "Are you sure?"), the body says what's lost with counts, the buttons are verb plus object ("Delete report", "Cancel"). For an account or workspace, ask them to type its name. A discard-changes prompt, FlutterPro's view: "Discard changes" in red and "Keep editing", never Yes / No / Cancel, "the user can't tell what cancels what"; ask only when something changed ([FlutterPro](https://flutterpro.design/details/discard-changes-prompt)). The "Cancel" in this line's own example is the other view.
- **Empty states point forward:** what this place is, and one action to fill it. "No projects yet. Projects keep tasks and files together. [Create a project]". A filtered empty state names the filter and offers a way out: "No results for 'quarterly'. Clear filters".
- **Placeholders show an example** in the accepted format (`name@example.com`, `DD/MM/YYYY`), never an instruction, and never instead of a label.
- **Status text:** in progress "Saving changes…", done "Changes saved" (no "successfully"), failed "Changes not saved. Check your connection and try again.", partial "9 of 12 files uploaded. Retry 3 failed files", unavailable "Add a payment method to publish". Keep the in-progress and done strings parallel.
- **Cut "Please"** from routine instructions and "successfully" from confirmations.

## Build strings whole, for every language

Never assemble a sentence around a variable (`"You have " + n + " new messages"`); word order changes per language. Inline links too: keep "I agree to the <terms>Terms of Use</terms> and <privacy>Privacy Policy</privacy>" as one string with tagged links, so translators can move them (Turkish puts them first) and the tag says which link was tapped ([FlutterPro](https://flutterpro.design/details/linked-text)). Write one message with placeholders and plural rules (ICU MessageFormat: `{count, plural, =0 {No new messages} one {# new message} other {# new messages}}`). Many languages have more than two plural forms. Format numbers, currency, dates, relative times and lists with `Intl` and the user's locale, never by hand. In Hebrew and other RTL languages, isolate embedded English, numbers and codes (`<bdi>`). A time reads `HH:MM` left to right in every locale (React Aria wraps it in an LRI, U+2066, and a closing U+2069), but don't force left to right on an Arabic `Intl` date: its separators carry right-to-left marks, and forcing gave `2 2022/ 12/` instead of `2022/12/2`. For Hebrew follow the gender approach in [HEBREW.md](../anti-slop-writing/HEBREW.md) (verbal nouns on buttons: שמירה, שליחה, ביטול).

## Review format

Report one row per root cause, most severe first:

| Severity | Location | Before | After | Why |
|---|---|---|---|---|

**High:** misleads the person, an error with no way to recover, a destructive action with neither confirmation nor undo. **Medium:** breaks voice, terms or capitalization consistency. **Low:** isolated wording. Strings from a server or CMS you couldn't see are reported as not verified. End with "Block" if any High remains, otherwise "Approve", and never approve what you didn't inspect.
