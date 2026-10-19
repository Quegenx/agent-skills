# Lead and contact forms

Form CRO is getting a form completed while still capturing the data the business uses. This file covers lead capture, contact, demo, application, survey, checkout and quote forms; account creation is [SIGNUP.md](SIGNUP.md) and forms inside popups are [POPUPS.md](POPUPS.md). The source is [coreyhaines31/marketingskills, cro] `references/form.md` (MIT). Markup, labels, autocomplete, error announcement and submit behavior are [web-accessibility FORMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/FORMS.md), which wins where the two differ; the owner's contact form is in [landing-page-ui CONTENT-PAGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/CONTENT-PAGES.md) and app forms in [app-ui CONTROLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CONTROLS.md).

**Contents:** [Before changing a form](#before-changing-a-form) · [Every field has a cost](#every-field-has-a-cost) · [Field by field](#field-by-field) · [Order and layout](#order-and-layout) · [Multi-step forms](#multi-step-forms) · [Errors and validation](#errors-and-validation) · [The submit button](#the-submit-button) · [Trust near the form](#trust-near-the-form) · [By form type](#by-form-type) · [Mobile](#mobile) · [Enrichment and routing](#enrichment-and-routing) · [Measurement](#measurement) · [Audit output](#audit-output) · [Prove it](#prove-it)

## Before changing a form

[coreyhaines31/marketingskills, cro] identifies first:

- **Form type:** lead capture (gated content, newsletter), contact, demo or sales request, application, survey or feedback, checkout, quote request.
- **Current state:** how many fields, the current completion rate, the mobile and desktop split, where users abandon.
- **Business context:** what happens with submissions, "Which fields are actually used in follow-up?", and whether there are compliance or legal requirements.
- **Questions to ask:** the current completion rate; whether there is field-level analytics; what happens with the data after submission; which fields are used in follow-up; compliance or legal requirements; the mobile versus desktop split.

## Every field has a cost

[coreyhaines31/marketingskills, cro] "Each field reduces completion rate." For each field ask:

- "Is this absolutely necessary before we can help them?"
- "Can we get this information another way?"
- "Can we ask this later?"

The source gives a "Rule of thumb" with no cited study: 3 fields baseline, 4 to 6 fields "10-25% reduction", 7+ fields "25-50%+ reduction". Quote it as the source's heuristic, never as a measured effect.

Its other principles: "Value Must Exceed Effort" (a clear value proposition above the form, make what they get obvious, reduce perceived effort) and "Reduce Cognitive Load" (one question per field, clear conversational labels, logical grouping and order, smart defaults where possible).

## Field by field

[coreyhaines31/marketingskills, cro]

| Field | Guidance |
|---|---|
| Email | "Single field, no confirmation"; inline validation; "Typo detection (did you mean gmail.com?)"; the email keyboard. Typo suggestions and server-side checks: [email-practices LISTS-AND-CAPTURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/LISTS-AND-CAPTURE.md#capturing-addresses) |
| Name | "Single 'Name' vs. First/Last - test this"; a single field reduces friction; "Split needed only if personalization requires it". The owner's contact form uses one name field |
| Phone | "Make optional if possible / If required, explain why / Auto-format as they type / Country code handling". If the number will receive texts or calls, consent is [sms-marketing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sms-marketing/SKILL.md), not this file |
| Company | Auto-suggest; enrich after submission (the source names HubSpot Breeze, Clay and Apollo as examples); "Consider inferring from email domain" |
| Job title or role | A dropdown if categories matter, free text if answers vary widely; consider making it optional |
| Message | Optional, with reasonable character guidance, expanding on focus |
| Dropdowns | "'Select one...' placeholder / Searchable if many options / Consider radio buttons if < 5 options / 'Other' option with text field" |
| Checkboxes | "Clear, parallel labels", a reasonable number of options, "Consider 'Select all that apply' instruction" |

## Order and layout

- **Field order** [coreyhaines31/marketingskills, cro]: "Start with easiest fields (name, email) / Build commitment before asking more / Sensitive fields last (phone, company size)", with logical groups when there are many fields.
- **Labels stay visible;** placeholders are examples, not labels ("placeholders disappear when typing, leaving users unsure what they're filling in"); help text only when it helps. The label rules are [web-accessibility FORMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/FORMS.md#labels).
- **Visual design** [coreyhaines31/marketingskills, cro]: sufficient spacing between fields, a clear hierarchy, a CTA that stands out.
- **Columns** [coreyhaines31/marketingskills, cro]: "Single column: Higher completion, mobile-friendly / Multi-column: Only for short related fields (First/Last name) / When in doubt, single column."

## Multi-step forms

- **When** [coreyhaines31/marketingskills, cro]: "More than 5-6 fields", logically distinct sections, conditional paths, complex forms (applications, quotes). Another view, [modern-css RESPONSIVE-FORKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/RESPONSIVE-FORKS.md): "Fill-once → stepped wizard (B) for 10+ fields, single column (A) for fewer". Both are heuristics; test the threshold.
- **Practices** [coreyhaines31/marketingskills, cro]: "Progress indicator (step X of Y) / Start with easy, end with sensitive / One topic per step / Allow back navigation / Save progress (don't lose data on refresh) / Clear indication of required vs. optional."
- **Progressive commitment** [coreyhaines31/marketingskills, cro]: just email, then name and company, then qualifying questions, then contact preferences.
- **Don't ask twice:** WCAG 2.2 SC 3.3.7 Redundant Entry (Level A) applies to every step; its wording is in [web-accessibility FORMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/FORMS.md#multi-step-forms-and-sign-in).

## Errors and validation

- **Error messages** [coreyhaines31/marketingskills, cro]: specific to the problem, suggest how to fix it, positioned near the field, never clear the input. Good: "Enter a valid email address (e.g., name@company.com)"; bad: "Invalid input". The source writes the good example with "Please"; the repo's microcopy rules cut "Please" ([anti-slop-copy MICROCOPY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/MICROCOPY.md)).
- **On submit** [coreyhaines31/marketingskills, cro]: focus the first error field, "Summarize errors if multiple", preserve all entered data.
- **Error cues need text.** The source says "Clear visual indicators (green check, red border)". A red border alone is a color-only cue: "Never a red border alone, which is a color-only cue (1.4.1)" ([web-accessibility FORMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/FORMS.md#error-messaging)). Pair the color with an icon or text.
- **When to validate.** [coreyhaines31/marketingskills, cro]: "Validate as they move to next field / Don't validate too aggressively while typing"; [email-practices LISTS-AND-CAPTURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/LISTS-AND-CAPTURE.md#capturing-addresses) agrees ("validate on blur or after a short debounce"). The owner's products validate on submit: landing-page-ui "Validate on submit; after the first submit, validate as the user types", app-ui "Validate on submit". In the owner's sites and apps the owner's rule applies.

## The submit button

- **Copy** [coreyhaines31/marketingskills, cro]: weak "Submit" or "Send"; strong "[Action] + [What they get]", such as "Get My Free Quote", "Download the Guide", "Start Free Trial". The source's own list also has "Request Demo" and "Send Message", which name the action but not what the person gets; the repo's CTA rule is in [anti-slop-copy](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md).
- **Placement** [coreyhaines31/marketingskills, cro]: immediately after the last field, aligned with the fields (the source says left-aligned; in right-to-left layouts that is the start edge), sufficient size and contrast, "Mobile: Sticky or clearly visible". A sticky button must not sit under the on-screen keyboard ([anti-slop-ui](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/SKILL.md)).
- **Pending state.** The source says "Loading state (disable button, show spinner)". The repo's rule: "Keep submit enabled until the request starts. While it runs, show a spinner *beside the original label*", and "Mark the pending button `aria-disabled="true"` and ignore repeat clicks in the handler. Native `disabled` on the focused button drops focus to `<body>`." ([web-accessibility FORMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/FORMS.md#submit-behavior)). The owner's products have their own forms: landing-page-ui's contact form "ignores a send while sending"; app-ui owns its pending state ([app-ui AUTH.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/AUTH.md)).
- **After submit** [coreyhaines31/marketingskills, cro]: a success confirmation with clear next steps; on error a clear message and focus on the issue.

## Trust near the form

[coreyhaines31/marketingskills, cro] places these near the form; each is used only if it is true:

- A privacy statement ("We'll never share your info"), security badges when collecting sensitive data, a testimonial or social proof (rule 4 in [SKILL.md](SKILL.md#the-rules)), the expected response time.
- Perceived effort: "Takes 30 seconds", a field count indicator, less visual clutter, generous white space.
- Objections: "No spam, unsubscribe anytime", "We won't share your number", "No credit card required". State a real absence once, beside the button ([anti-slop-copy](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md)). An email opt-in discloses what will be sent and how often ([email-practices LISTS-AND-CAPTURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/LISTS-AND-CAPTURE.md#consent-checkboxes-and-forms)).

## By form type

[coreyhaines31/marketingskills, cro]

| Type | Guidance |
|---|---|
| Lead capture (gated content) | Minimum viable fields, "often just email"; a clear value proposition for what they get; "Consider asking enrichment questions post-download"; "Test email-only vs. email + name". Gating and delivery: [lead-magnets](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/lead-magnets/SKILL.md) |
| Contact | Essential: email or name plus message; phone optional; set response-time expectations; offer alternatives (chat, phone) |
| Demo request | Name, email and company required; phone optional with a "preferred contact" choice; a use-case or goal question helps personalize. The source says a calendar embed "can increase show rate" without a source: test it |
| Quote or estimate | Multi-step often works; easy questions first, technical details later; save progress for complex forms |
| Survey | "Progress bar essential"; "One question per screen for engagement"; skip logic; consider an incentive for completion |

## Mobile

[coreyhaines31/marketingskills, cro]: appropriate keyboard types (email, tel, number), autofill support, single column, a sticky submit button, minimal typing (dropdowns, buttons). Keyboards and autocomplete tokens are [web-accessibility FORMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/FORMS.md#autocomplete-and-input-types).

**Targets.** The source says "Larger touch targets (44px minimum height)" and "Mobile-friendly tap targets (44px+)". 44px is WCAG 2.5.5 at Level AAA; the AA floor is 24 by 24 CSS px (SC 2.5.8). The repo's rule: "never report a target between 24px and 44px as a failure" ([web-accessibility HIT-AREAS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/HIT-AREAS.md)). Aim for 44px as a heuristic, not a minimum.

## Enrichment and routing

When enrichment decides the next step after a lead form: "preserve valid submissions, bound the lookup wait, and provide a useful fallback when qualification is unknown" [coreyhaines31/marketingskills, cro]. A slow or failed lookup never loses the submission; routing and lead scoring are [revops](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/revops/SKILL.md), and a bounded external call is [third-party-integrations](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/third-party-integrations/SKILL.md).

## Measurement

[coreyhaines31/marketingskills, cro]

| Metric | Definition |
|---|---|
| Form start rate | Page views → started form |
| Completion rate | Started → submitted |
| Field drop-off | Which fields lose people |
| Error rate | By field |
| Time to complete | Total and by field |
| Mobile vs. desktop | Completion by device |

What to track: form views, first field focus, each field completion, errors by field, submit attempts, successful submissions. Event names and properties follow [posthog EVENTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/EVENTS.md#naming-events-and-properties). Field events carry no field values (nothing the visitor typed); the owner's sites track only that a form was sent or failed and "Events carry no personal data" ([landing-page-ui DISCOVERY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/DISCOVERY.md)).

## Audit output

[coreyhaines31/marketingskills, cro]

- **Form audit,** per issue: Issue (what's wrong), Impact (estimated effect on conversions), Fix (a specific recommendation), Priority. The source's High, Medium and Low are written as P1, P2 and P3, with P0 for anything that blocks submitting ([SKILL.md](SKILL.md#the-rules), rule 8).
- **Recommended form design:** required fields (justified), optional fields (with rationale), field order, copy (labels, placeholders, button), an error message for each field, layout.
- **Test hypotheses** with expected outcomes ([EXPERIMENTS.md](EXPERIMENTS.md#forms)).

## Prove it

- Every field in the recommended design has an answer to "needed before we can help them?", and deferrable fields are moved later or cut.
- Every label is visible; every placeholder is an example; every error has text beside the field, not only a color.
- The submit button names what the person gets, stays focusable while pending, and shows a spinner beside its label.
- No trust line on the page is untrue; a multi-step form never asks for the same information twice and keeps data across a refresh.
- Field events carry no field values; every issue in the audit has a P0 to P3 severity.
