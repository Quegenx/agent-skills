# Signup flows

Signup CRO cuts what stands between a visitor and a working account, and sets them up to activate. This file covers free-trial, freemium, paid and waitlist signups, B2B and B2C. The source is [coreyhaines31/marketingskills, signup] v2.0.1 (MIT), corrected against NIST SP 800-63B-4 and WCAG 2.2. What happens after signup is [onboarding-and-upgrades](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/onboarding-and-upgrades/SKILL.md); lead and contact forms are [FORMS.md](FORMS.md). The auth implementation is [supabase AUTH-SIGN-IN.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/supabase/AUTH-SIGN-IN.md); the owner's auth screens are [app-ui AUTH.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/AUTH.md), whose design applies in the owner's apps; mobile apps' sign-up deferral and Apple's sign-in rules are [app-growth](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/RETENTION-AND-MONETIZATION.md) and [app-store-connect](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/SKILL.md).

**Contents:** [Before the audit](#before-the-audit) · [Principles](#principles) · [Fields](#fields) · [Passwords](#passwords) · [Social sign-in](#social-sign-in) · [Single or multi-step](#single-or-multi-step) · [Trust and errors](#trust-and-errors) · [Mobile](#mobile) · [After submit](#after-submit) · [Enrichment](#enrichment) · [Patterns](#patterns) · [Measurement and output](#measurement-and-output) · [Prove it](#prove-it)

## Before the audit

[coreyhaines31/marketingskills, signup]

- **Flow type:** free trial, freemium, paid account, waitlist or early access; B2B or B2C.
- **Current state:** how many steps or screens, which fields are required, the completion rate, where users drop off.
- **Constraints:** "What data is genuinely needed at signup?", compliance requirements, what happens immediately after signup.
- **Questions:** the current completion rate; field-level drop-off analytics; what data is absolutely required before they can use the product; compliance or verification requirements; what happens right after signup.

## Principles

[coreyhaines31/marketingskills, signup]

1. **Minimize required fields.** For each field: "Do we absolutely need this before they can use the product? / Can we collect this later through progressive profiling? / Can we infer this from other data?" Priority: "Essential: Email (or phone), Password / Often needed: Name / Usually deferrable: Company, Role, Team size, Phone, Address".
2. **Show value before asking for commitment:** "value first, signup second". Can they experience the product before creating an account?
3. **Reduce perceived effort:** progress if multi-step, related fields grouped, smart defaults, pre-fill when possible.
4. **Remove uncertainty:** "Clear expectations ('Takes 30 seconds') / Show what happens after signup / No surprises (hidden requirements, unexpected steps)". "Takes 30 seconds" only if it does.

## Fields

[coreyhaines31/marketingskills, signup]

| Field | Guidance |
|---|---|
| Email | "Single field (no email confirmation field)"; inline validation for format; "Check for common typos (gmial.com → gmail.com)"; clear errors ([email-practices LISTS-AND-CAPTURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/LISTS-AND-CAPTURE.md#capturing-addresses)) |
| Name | "Single 'Full name' field vs. First/Last split (test this)"; "Only require if immediately used (personalization)"; consider optional |
| Phone | "Defer unless essential (SMS verification, calling leads)"; if required, explain why; country code handling; format as they type. Supabase discourages phone as a password identifier ([supabase AUTH-SIGN-IN.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/supabase/AUTH-SIGN-IN.md)); texting consent is [sms-marketing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sms-marketing/SKILL.md) |
| Company | Defer if possible; auto-suggest; "Infer from email domain when possible" |
| Use case or role | "Defer to onboarding if possible"; if needed at signup, "keep to one question"; progressive disclosure |

## Passwords

The source: "Show password toggle (eye icon) / Show requirements upfront, not after failure / Consider passphrase hints for strength / Update requirement indicators in real-time", and "Allow paste (don't disable) / Show strength meter instead of rigid rules / Consider passwordless options". Against [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html):

- **Length:** "passwords that are used as a single-factor authentication mechanism" are "a minimum of 15 characters in length"; passwords "only used as part of multi-factor authentication processes" may be shorter but at least eight. "Verifiers and CSPs SHOULD permit a maximum password length of at least 64 characters."
- **No composition rules:** "Verifiers and CSPs SHALL NOT impose other composition rules (e.g., requiring mixtures of different character types) for passwords." A strength meter is the source's idea; NIST says "Verifiers SHALL offer guidance to the subscriber to help the subscriber choose a strong password" and, in its usability section, "Provide clear, meaningful, and actionable feedback when chosen passwords are rejected (e.g., when it appears on a “blocklist” of unacceptable passwords or has been used previously)".
- **Blocklist:** a password "on a blocklist of commonly used, expected, or compromised values" is refused and the subscriber chooses another.
- **No periodic changes:** "SHALL NOT require subscribers to change passwords periodically", but force a change on evidence of compromise.
- **Paste and managers:** NIST requires allowing password managers and autofill and recommends permitting paste and an option to display the password, as the source does.
- **"Passphrase hints"** means guidance on choosing a strong passphrase, never a stored hint: NIST "SHALL NOT permit the subscriber to store a hint (e.g., a reminder of how the password was created) that is accessible to an unauthenticated claimant", nor prompt for "knowledge-based authentication (KBA)" or security questions when choosing passwords.
- **Accessible authentication:** WCAG 2.2 SC 3.3.8 (AA) applies to every signup step that sets or enters a password or code; its rules are in [web-accessibility FORMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/FORMS.md#multi-step-forms-and-sign-in).
- **Real-time requirement indicators** are the source's view; the owner's apps validate on submit and show the first issue ([app-ui AUTH.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/AUTH.md)). The owner's rule applies in the owner's apps.
- **Passwordless.** The source suggests "Magic link as alternative to password". WCAG 3.3.8 and NIST 800-63B-4 disagree on email links; both views are in [web-accessibility FORMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/FORMS.md#multi-step-forms-and-sign-in). Supabase's magic link and email OTP are in [supabase AUTH-SIGN-IN.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/supabase/AUTH-SIGN-IN.md#magic-link-and-email-otp).

## Social sign-in

[coreyhaines31/marketingskills, signup]

- Place it prominently and show the options that fit the audience: "B2C: Google, Apple, Facebook / B2B: Google, Microsoft, SSO".
- "Clear visual separation from email signup"; "Consider 'Sign up with Google' as primary".
- The source says social auth is "often higher conversion than email" with no data; test it with the social-to-email ratio ([Measurement and output](#measurement-and-output)).
- iOS apps that offer third-party sign-in fall under App Review guideline 4.8 ([app-store-connect](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/SKILL.md)).

## Single or multi-step

[coreyhaines31/marketingskills, signup]

- **Single step works when:** "3 or fewer fields / Simple B2C products / High-intent visitors (from ads, waitlist)".
- **Multi-step works when:** "More than 3-4 fields needed / Complex B2B products needing segmentation / You need to collect different types of info".
- **Practices:** a progress indicator; easy questions first (name, email), harder ones later; "Each step should feel completable in seconds"; back navigation; save progress across a refresh. Information already entered is never asked again ([FORMS.md](FORMS.md#multi-step-forms), WCAG 3.3.7).
- **Progressive commitment:** "Email only (lowest barrier) / Password + name / Customization questions (optional)".

## Trust and errors

[coreyhaines31/marketingskills, signup]

- **At the form:** "No credit card required" (if true), "Free forever" or "14-day free trial", "We'll never share your email", security badges if relevant, a testimonial. Each must be true; free and trial claims follow [offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md).
- **Errors:** specific messages, "Don't clear the form on error", "Focus on the problem field". Focus and announcement: [web-accessibility FORMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/FORMS.md#error-messaging).
- **"Email already registered" + recovery path.** The source recommends it. email-practices says otherwise: "for accounts, don't reveal whether an account exists: answer a sign-up with an existing address the same way as a new one" ([email-practices LISTS-AND-CAPTURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/LISTS-AND-CAPTURE.md#capturing-addresses)), and Supabase returns an obfuscated user with email and phone confirmation on ([supabase AUTH-SIGN-IN.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/supabase/AUTH-SIGN-IN.md)). The owner's apps map the provider's code to their own message ([app-ui AUTH.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/AUTH.md)).
- **Labels:** visible, with placeholders as examples and help text close to its field.

## Mobile

[coreyhaines31/marketingskills, signup]: appropriate keyboard types, autofill, less typing (social auth, pre-fill), a single column, a sticky CTA button, testing on real devices. The sticky button must clear the on-screen keyboard. The source's "Larger touch targets (44px+ height)" is a heuristic: the AA floor is 24 by 24 CSS px ([web-accessibility HIT-AREAS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/HIT-AREAS.md)).

## After submit

[coreyhaines31/marketingskills, signup]

- **Success:** a clear confirmation and an immediate next step.
- **If email verification is required,** the waiting screen explains what to do, has an easy resend, a "Check spam reminder", and an "Option to change email if wrong". Resend timing is [email-practices](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/SKILL.md).
- **Verification:** "Consider delaying verification until necessary", "Let users explore while awaiting verification", and re-engage if verification stalls. With Supabase, sign-up starts a session at once when email confirmation is off ([supabase AUTH-SIGN-IN.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/supabase/AUTH-SIGN-IN.md)).

## Enrichment

"Keep account creation separate from enrichment availability; a timeout or ambiguous company match must not become an implicit signup rejection." [coreyhaines31/marketingskills, signup]. Sales-assisted routing is [revops](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/revops/SKILL.md).

## Patterns

[coreyhaines31/marketingskills, signup]

| Flow | Steps |
|---|---|
| B2B SaaS trial | Email and password (or Google); name and company (optional: role); then onboarding |
| B2C app | Google or Apple, or email; then the product; profile completion later |
| Waitlist or early access | Email only; optional role or use-case question; waitlist confirmation |
| E-commerce account | "Guest checkout as default"; account creation optional after purchase, or one-click social auth |

## Measurement and output

[coreyhaines31/marketingskills, signup]

- **Metrics:** use the [shared form measurement definitions](FORMS.md#measurement) for form starts, completion, field drop-off, elapsed time, errors and the device split.
- **Track:** each field's focus, blur and error, step progression, the social-to-email signup ratio, time between steps. No field values in events ([posthog EVENTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/EVENTS.md#naming-events-and-properties)).
- **Audit findings,** per issue: Issue, Impact (why it matters), Fix, Priority, with High, Medium and Low written as P1, P2 and P3 and P0 for anything that stops signup ([SKILL.md](SKILL.md#the-rules), rule 8).
- **Recommended changes:** quick wins (same-day fixes), high-impact changes (week-level effort), test hypotheses ([EXPERIMENTS.md](EXPERIMENTS.md#signup)).
- **Form redesign, if asked:** the field set with rationale, field order, copy for labels, placeholders, buttons and errors, layout.

## Prove it

- A three-step signup audit defers most company questions and all use-case questions to onboarding, field by field [coreyhaines31/marketingskills, signup, eval 1].
- A B2B signup offers Google and Microsoft, visually separate from the email form [eval 2].
- An email-and-password form that still underperforms is checked beyond its fields: the page's value proposition, trust lines, error handling and password UX [eval 3].
- Required verification is delayed or the product is explorable while it is pending; if it stays, the waiting screen has resend, a spam reminder and a change-email option [eval 4].
- A password rule set has no composition rules, a length that matches whether MFA exists (15 alone, 8 with MFA), accepts at least 64 characters, checks a blocklist, and allows paste and password managers.
- An activation problem after signup goes to [onboarding-and-upgrades](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/onboarding-and-upgrades/SKILL.md), not to this file [eval 6].
