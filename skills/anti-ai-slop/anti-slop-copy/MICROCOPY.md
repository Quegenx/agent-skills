# Interface text

The words inside a product: labels, buttons, errors, empty states, confirmations, toasts, settings, placeholders. They are read by someone in the middle of a task, so they must be instantly clear and tell the person what to do next. Most of this file follows Jakub Krehel's better-writing skill ([better-writing](https://github.com/jakubkrehel/skills/tree/main/skills/better-writing)), with FlutterPro's views and Vercel's [Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines) (MIT, tagged [Vercel, web-design-guidelines]) marked where they come in.

"A deliberate brand voice is not a defect. Raise a departure from plain language only when it creates inconsistency, ambiguity, translation risk or a tone the stakes don't support. Rewording that merely suits your taste is not a finding" [Jakub Krehel, better-writing].

## Start from what exists

Before writing or reviewing, find where the strings live (calls like `t(`, `i18n.`, `<FormattedMessage`, `$t(` and the locale files they read, such as `locales/**/*.json`, `messages/*.json`, `*.po` and `*.strings`; or a CMS or API) and list the noun used for each object and the verb for each action. Note the case used per element type and any voice or content style guide. New copy uses those words. If it's "Archive" in the menu, it isn't "Move to storage" in the toast. A synonym is a problem only where the same thing is named two ways.

## Rules

- **One voice, tone by stakes.** Warm and light in onboarding, success and empty states; neutral in routine actions and settings; calm and plain in errors and destructive confirmations; serious and explicit for data loss and security. No jokes in errors.
- **One vocabulary through a flow:** inside a multi-step flow in the product, "'Get started' to enter, either 'Continue' or 'Next' to advance, 'Done' to finish" [Jakub Krehel, better-writing]. A marketing CTA is a different job, where [SKILL.md](SKILL.md#4-ctas) rules out "Get started" as a default.
- **Talk to the person.** "You" in instructions, not "the user". In errors, avoid "we" as deflection: "Couldn't load your invoices. Check your connection and try again." "An established first-person voice can stay in low-stakes copy where it still reads clearly." Don't mix "My account" with "Your settings" in one flow. "Use possessives sparingly: 'Favorites' beats 'Your favorites'" [Jakub Krehel, better-writing].
- **Plain words** a tired reader gets on the first pass. No idioms that won't translate. Match the device: tap on touch, click with a pointer, select when both. "Skip unnecessary gender: 'Subscribers can post recipes', not 'each subscriber can post his or her recipes'" [Jakub Krehel, better-writing]; for Hebrew, [anti-slop-writing HEBREW.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/HEBREW.md#4-gender).
- **Buttons start with a verb and name the action:** "Send invoice", "Save draft", "Delete project". Never "OK", "Yes", "Let's go!". A Save that stays disabled until something changes reads "Save changes": "the label itself explains why it's disabled" ([FlutterPro](https://flutterpro.design/details/disable-unchanged-save)). An icon-only button's accessible name names the action ("Delete project"), not the icon ("Trash").
- **Links say where they go:** "Read the billing docs", never "Click here". Two "Learn more" links on one page become "Learn more about exports" and "Learn more about billing". better-writing's reason: "screen-reader users navigate by a list of the page's links". Text that makes sense alone is WCAG's AAA criterion (SC 2.4.9); the Level A one (SC 2.4.4) also accepts purpose "from the link text together with its programmatically determined link context" ([2.4.4](https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html)), so this is a house rule above the baseline. Google's test for anchor text: "Try reading only the anchor text (out of context) and check if it's specific enough to make sense by itself" ([links-crawlable](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)).
- **One capitalization rule per element type.** Sentence case by default. "Save Changes" beside "Discard changes" looks careless. The other view, not taken: "Title Case for headings/buttons (Chicago style)" [Vercel, web-design-guidelines]. Vercel's own writing guidelines use sentence case for page headings and title case only for nav labels, so Vercel's two documents disagree.
- **Numerals for counts:** "8 deployments" not "eight" [Vercel, web-design-guidelines].
- **`&` over "and"** "where space-constrained" [Vercel, web-design-guidelines].
- **Toggles describe the ON state:** "Send read receipts", not "Don't send read receipts".
- **Link to a setting, don't give directions to it:** "a 'Notification settings' link, not 'Go to Settings > Notifications > Email'" [Jakub Krehel, better-writing].
- **Disclosures name what is hidden:** "Show 12 more results", not "More" [Jakub Krehel, better-layout].
- **Errors say how to fix it, next to what broke:** "Enter a date as DD/MM/YYYY", not "Invalid date"; "Use at least 8 characters", not "Password too short". "Phrase hints positively, as in 'Use at least 8 characters' rather than 'Don't use fewer than 8'" [Jakub Krehel, better-writing]. No "Oops", no blame, no exclamation marks. Show a known rule as helper text before the person fails it. If the same error fires constantly, change the design. On login and sign-up keep the submit button enabled and show the errors on tap: "a disabled button there doesn't tell the user what's missing" ([FlutterPro](https://flutterpro.design/details/disable-unchanged-save)).
- **Undo over confirmation** for frequent, reversible actions: act now, offer "Project archived. Undo". **Confirm** when it can't be undone, affects others or destroys many items: the title names the action and object ("Delete 'Q3 report'?", never "Are you sure?"), the body says what's lost with counts, the buttons are verb plus object ("Delete report", "Cancel"). For an account or workspace, ask them to type its name. A discard-changes prompt, FlutterPro's view: "Discard changes" in red and "Keep editing", never Yes / No / Cancel, "the user can't tell what cancels what"; ask only when something changed ([FlutterPro](https://flutterpro.design/details/discard-changes-prompt)). The "Cancel" in this line's own example is the other view. Apple's WWDC26 *Principles of great design* puts the same limit on interruptions: "use interruptions carefully, and only when someone is about to make a big mistake" ([anti-slop-ui PRINCIPLES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/PRINCIPLES.md#apples-eight-principles)).
  - **Why the buttons repeat it:** "The confirmation repeats the consequence, so the dialog is answerable without reading the body" [Jakub Krehel, better-writing].
  - **Templates** [Jakub Krehel, better-writing]: one item, irreversible: title "Delete 'Q3 report'?", body "This permanently deletes the report and its 4 comments.", buttons `Delete report`, `Cancel`. Many items: title "Delete 12 files?", body "You can't undo this.", buttons `Delete 12 files`, `Cancel`. Affects other people: "Body names who: 'The 8 members of Design lose access.'" Account, workspace or repository: field label "Type 'acme-web' to confirm". "The button stays disabled until it matches."
  - app-ui does it differently: its in-place confirm is a bare verb ("The soft red button's text morphs into the question ("Delete")"), with the subject named in the dialog text, and "delete an account" goes to a plain alert dialog with no typed name ([app-ui OVERLAYS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/OVERLAYS.md)). In the owner's apps that is the design, not a finding.
- **Empty states point forward:** what this place is, and one action to fill it. "No projects yet. Projects keep tasks and files together. [Create a project]". A filtered empty state names the filter and offers a way out: "No results for 'quarterly'. Clear filters". "Never park persistent information in an empty state. It disappears the moment content exists" [Jakub Krehel, better-writing].
- **Placeholders show an example** in the accepted format (`name@example.com`, `DD/MM/YYYY`), never an instruction, and never instead of a label. Vercel adds: "Placeholders end with `…` and show example pattern" [Vercel, web-design-guidelines]. app-ui does it differently: "Placeholders are example answers", with `https://` as one and no ellipsis ([app-ui CONTROLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CONTROLS.md)); in the owner's apps that is the design.
- **Status text:** in progress "Saving changes…", done "Changes saved" or "Invite sent to sam@example.com" (no "successfully"), failed "Changes not saved. Check your connection and try again.", partial "9 of 12 files uploaded. Retry 3 failed files", unavailable "Add a payment method to publish". Keep the in-progress and done strings parallel.
- **Cut "Please"** from routine instructions and "successfully" from confirmations.
- **Decline options never shame.** No "No, I don't want to save money". The FTC names it: "Confirm Shaming: Using shame to steer users away from certain choices by framing the alternatives as a bad decision", with that same example ([Bringing Dark Patterns to Light](https://www.ftc.gov/system/files/ftc_gov/pdf/P214800%20Dark%20Patterns%20Report%209.14.2022%20-%20FINAL.pdf), 2022, p. 25). Write the decline as a plain choice; popup copy is in [cro POPUPS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cro/POPUPS.md#copy).
- **Countdowns and "limited time" only for a real deadline.** A "Baseless Countdown Timer" ("a fake countdown clock that just goes away or resets when it times out") and a "False Limited Time Message" are dark patterns in the same FTC report (p. 21). A trial that really ends is a real deadline ([app-growth RETENTION-AND-MONETIZATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/RETENTION-AND-MONETIZATION.md)). Details: [cro POPUPS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cro/POPUPS.md#urgency-and-countdowns), [offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md#scarcity-urgency-and-dark-patterns).

## Build strings whole, for every language

Never assemble a sentence around a variable (`"You have " + n + " new messages"`); word order changes per language. Inline links too: keep "I agree to the <terms>Terms of Use</terms> and <privacy>Privacy Policy</privacy>" as one string with tagged links, so translators can move them (Turkish puts them first) and the tag says which link was tapped ([FlutterPro](https://flutterpro.design/details/linked-text)). Write one message with placeholders and plural rules (ICU MessageFormat: `{count, plural, =0 {No new messages} one {# new message} other {# new messages}}`). Many languages have more than two plural forms. Format numbers, currency, dates, relative times and lists with `Intl` and the user's locale, never by hand. In Hebrew and other RTL languages, isolate embedded English, numbers and codes (`<bdi>`). A time reads `HH:MM` left to right in every locale (React Aria wraps it in an LRI, U+2066, and a closing U+2069), but don't force left to right on an Arabic `Intl` date: its separators carry right-to-left marks, and forcing gave `2 2022/ 12/` instead of `2022/12/2`. For Hebrew follow the gender approach in [anti-slop-writing HEBREW.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/HEBREW.md) (verbal nouns on buttons: שמירה, שליחה, ביטול).

"Detect language via `Accept-Language` / `navigator.languages`, not IP" [Vercel, web-design-guidelines]: the person's language setting, not where they are. "Brand names, code tokens, identifiers: wrap with `translate="no"` to prevent garbled auto-translation" [Vercel, web-design-guidelines]. MDN: "Although not all browsers recognize this attribute, it is respected by automatic translation systems such as Google Translate" ([translate](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/translate), Baseline widely available).

better-writing's recipes [Jakub Krehel, better-writing]:

```text
inbox.count = {count, plural,
  =0 {No new messages}
  one {# new message}
  other {# new messages}
}
invite.sent = {name} invited you to {project}
```

"`=0` matches the number zero exactly. `one` and `other` are plural categories, and a translator adds `few` or `many` where the language needs them." In English `new Intl.PluralRules("en").select(0)` is `other`, so a "No ..." string needs the `=0` branch. Hebrew's categories are `one`, `two` and `other` ([anti-slop-writing HEBREW.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/HEBREW.md#5-punctuation-and-typography)). "Without a library, pick the category with `new Intl.PluralRules(locale).select(count)`" (Baseline widely available, [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules)).

| Value | Call | `en-US` output |
| --- | --- | --- |
| Currency | `new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" })` | `€4,320.00` |
| Unit | `new Intl.NumberFormat(locale, { style: "unit", unit: "megabyte" })` | `12 MB` |
| Date | `new Intl.DateTimeFormat(locale, { dateStyle: "medium" })` | `Jun 30, 2026` |
| Relative time | `new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(-1, "day")` | `yesterday` |
| List | `new Intl.ListFormat(locale, { type: "conjunction" })` | `Ana, Ben, and Cy` |

"`Intl.ListFormat` follows each locale's own comma and conjunction rules, so never join names with `", "` and `" and "` by hand": `en-GB` gives `Ana, Ben and Cy`.

## Search before you finish

[Jakub Krehel, better-writing]

| Detection pattern | Fix |
| --- | --- |
| `Click here`, a link reading `here` or two identical `Learn more` links | Name the destination |
| `Oops`, `Something went wrong` or `!` in an error string | Say what failed and the next step |
| `" + n + "`, a template literal holding a sentence fragment, or `=== 1 ? "" : "s"` | One ICU message with a plural argument |
| `>OK<`, `>Yes<` or `>No<` on a dialog button | Verb plus object |
| `Are you sure` | Name the action and the object |
| `successfully` | Cut it: "Changes saved" |
| `Please` in a routine instruction | Cut it |
| A toggle label starting `Don't`, `Disable` or `Hide` | Describe the ON state |
| `aria-label="Trash"`, `"Close icon"` or `"X"` | Name the action: "Delete project", "Close dialog" |
| `toLocaleDateString()` with no locale, or a date built from `getMonth()` | `Intl.DateTimeFormat` with the user's locale |
| `Save Changes` beside `Discard changes` | One case per element type |

## Review format

"Check every label against the action it invokes, every error for a stated fix and every term against the inventory. Read locale files as well as components" [Jakub Krehel, better-writing]. Group findings under the principle each violates, most severe first, one row per root cause listing every location it appears in:

| Severity | Location | Before | After | Why |
|---|---|---|---|---|

`Location` is `path/to/file:line`; `Why` names the principle and the user impact. Severity is the repo's one scale, P0 to P3 as in code-review's [code-review REVIEWER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/REVIEWER.md#tags-and-output); better-writing's `HIGH`, `MEDIUM` and `LOW` map onto it as in [anti-slop-ui](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/SKILL.md#6-delivery-report):
- **P0:** a destructive action with neither confirmation nor undo.
- **P1:** misleads the person, or an error with no way to recover.
- **P2:** breaks voice, terms or capitalization consistency.
- **P3:** isolated wording.

Strings from a server or CMS you couldn't see are reported as not verified. End with "Block" if any P0 or P1 remains, otherwise "Approve", and never approve what you didn't inspect. With nothing to report, say "No actionable writing findings" and give the verification.
