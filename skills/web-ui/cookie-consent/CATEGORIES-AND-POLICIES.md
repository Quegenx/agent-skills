# Categories and policies

On every page load a consent manager answers one question per category: is this allowed right now? The answer comes from a policy chosen for the visitor's location, the visitor's stored choice and live privacy signals. Source: c15t's concept pages (https://c15t.com/docs/concepts/how-consent-works.md, consent-categories.md, policies.md, https://c15t.com/docs/self-host/guides/policy-packs.md), plus the official texts cited inline. How each category reaches scripts is [SCRIPT-GATING.md](SCRIPT-GATING.md).

**Contents:** [What is decided per page load](#what-is-decided-per-page-load) · [Categories by purpose](#categories-by-purpose) · [Models and prompts](#models-and-prompts) · [Permission vs recorded choice](#permission-vs-recorded-choice) · [Notices and Global Privacy Control](#notices-and-global-privacy-control) · [Withdrawal and the preferences entry point](#withdrawal-and-the-preferences-entry-point) · [Presets and regional rules](#presets-and-regional-rules) · [Policy scope and discovered categories](#policy-scope-and-discovered-categories) · [Google Consent Mode types](#google-consent-mode-types) · [Why the banner may be absent](#why-the-banner-may-be-absent) · [Prove it](#prove-it)

## What is decided per page load

[c15t, how-consent-works.md] c15t:

1. Selects a **policy** for the visitor, usually by country and region. The policy says whether optional categories start denied (opt-in) or allowed (opt-out), and whether to show a banner.
2. Reads the visitor's **stored choice** from a cookie and localStorage, if there is one that still matches the policy.
3. Reads **privacy signals** such as Global Privacy Control (GPC).

"The result is a set of **permissions**, one per category. Components, script loaders, embeds and your own code read those permissions. Nothing optional runs until the policy has resolved: while it loads, and if it fails, every optional category is denied."

## Categories by purpose

[c15t, how-consent-works.md]

| Category | Use it for |
|--|--|
| `necessary` | Code the site cannot work without. Always allowed. |
| `functionality` | Optional features such as support chat. |
| `measurement` | Analytics and usage measurement. |
| `experience` | Personalization. |
| `marketing` | Advertising, retargeting and pixels. |

- "Assign a category by what the code does, not by what would be convenient. Calling analytics `necessary` does not make it necessary." [c15t]
- Replacing another consent manager: "Map each old category to a c15t category by purpose, not by name." [c15t, SKILL.md §5b]
- Example assignments from c15t's helper list: chat (Crisp, Intercom, Front) `functionality`; Klaviyo `marketing` and `measurement`; Vercel Analytics and Speed Insights `measurement`; Sentry `necessary` with "Replay and user data `measurement`" [c15t, integrations/overview.md].

## Models and prompts

A policy has a **model** and a **prompt** [c15t, how-consent-works.md]:

| Model | Optional categories before a choice |
|--|--|
| `opt-in` | Denied until the visitor allows them. |
| `opt-out` | Allowed until the visitor refuses them or sends a privacy signal. |
| `iab` | Controlled by an IAB TCF consent string. |
| `none` | Allowed, with no prompt. |

| Prompt | What the visitor sees |
|--|--|
| `choice` | A banner asking for a decision. |
| `notice` | A notice they can dismiss. Dismissing records an acknowledgement, not consent. |
| `none` | Nothing on load. The policy can still require a way to open preferences. |

- `scopeMode: 'strict'`: "Optional categories outside the rule's scope stay denied." [c15t, policies.md]
- "Your app reads the resolved rule and effective permissions. It should not choose a different rule just to hide a banner." [c15t, policies.md]
- "Effective permission is not an explicit consent receipt. A no-banner rule does not prove the user accepted anything." [c15t, policy-packs.md]
- IAB TCF purpose strings are out of this skill's scope; c15t documents them at https://c15t.com/docs/frameworks/react/iab.md.

## Permission vs recorded choice

"These two values answer different questions, and mixing them up is the most common integration bug" [c15t, how-consent-works.md]:

- **Permission** (`effectivePermissions`, `useConsent('measurement')`) answers "may this run now?" Under an opt-out policy it can be `true` before the visitor has done anything.
- **Recorded choice** (`explicitChoice`) answers "what did the visitor decide?" It only changes when the visitor accepts, rejects or saves preferences.

| Task | Read |
|--|--|
| Load a script or render an optional feature | Permission |
| Show what the visitor chose, or report consent rates | Recorded choice |
| Decide whether a prompt is needed | `promptRequirement` |
| Find out why a region behaves differently | `policyRule` |
| Check that the policy loaded | `resolution.status` |

- "`onChoiceRecorded` fires only for a visitor's action; `onPermissionsChanged` also fires when a choice expires or a privacy signal changes." [c15t]
- Server hydration: "Forward that configuration intact. Copying an allowed category into a receipt would invent a grant and lose its original confirmation time." [c15t, consent-state.md]

## Notices and Global Privacy Control

- "Dismissing a notice acknowledges it. It grants nothing and leaves earlier refusals in place." [c15t, how-consent-works.md]
- GPC "is a browser setting that asks sites not to sell or share data. c15t reads it live on every evaluation and applies the restrictions your policy configures for it. It never becomes a stored refusal: when the browser stops sending GPC, the restriction ends. The backend also sees the current value." [c15t]
- The official position in California: GPC "must be honored by covered businesses as a valid consumer request", and "one acceptable method for consumers to opt-out of sales or sharing is via a user-enabled global privacy control" [California AG, CCPA FAQ B.8, https://oag.ca.gov/privacy/ccpa].
- Which browsers send it is in [VERIFY-CONSENT.md](VERIFY-CONSENT.md#privacy-signals).

## Withdrawal and the preferences entry point

- "Keep a persistent preferences entry point wherever the policy provides that right. A visitor who dismissed a notice or rejected tracking still needs a way to revisit their choice. Stock components read the rule's rights; custom UI must do the same." [c15t, policies.md]
- GDPR Art 7(3): "The data subject shall have the right to withdraw his or her consent at any time ... It shall be as easy to withdraw as to give consent." [https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng]
- c15t's quickstarts mount `<ConsentDialogLink>Privacy settings</ConsentDialogLink>` in the footer; "Add a persistent control that reopens preferences, such as a footer link. If the app already has one (from the old banner), rewire it instead of adding a second." [c15t, SKILL.md §5c]
- "Keep any preference controls required by the selected rule available after the initial page view." [c15t, policy-packs.md]
- What a withdrawal must do to running code is [SCRIPT-GATING.md](SCRIPT-GATING.md#withdrawal-stops-the-tool).

## Presets and regional rules

- "Presets are starting configurations. Select them for your actual processing, and review their assumptions before allowing optional categories by default. A country match does not establish a legal basis for a vendor's data use." [c15t, policies.md]
- The local `recommendedPolicyRules()` pack "uses opt-in rules for Europe and Québec, opt-out for its supported US privacy states, and a no-prompt `none` default for other known locations. An unknown country uses its strict opt-in fallback. A US country with a missing state gets the US opt-out fallback." These "are the local pack's defaults, not a promise about your Inth project." "Browser-only mode does not discover a visitor's country from their IP address." [c15t, policies.md]
- Preset families [c15t, policy-packs.md]: Europe (`europeOptIn()`, `europeIab()`), US privacy states (`usPrivacyStatesOptIn()`, `usPrivacyStatesOptOut()`), California, Québec (`quebecOptIn()`), Canada outside Québec, Australia, Japan, Switzerland, restricted statistics profiles (`ukStatistics()`, `malaysiaStatistics()`), other regional opt-in, and the global defaults `worldNone()`, `worldOptOutNoPrompt()`. "Prefer opt-in variants when an opt-out preset's processing assumptions do not fit your application."
- "Statistics profiles are scoped configurations, not permission to run arbitrary analytics or marketing vendors." [c15t, policy-packs.md]
- Rule selection: "A known region match takes precedence over a country match. Array order resolves ties at the same specificity. A rule with `match.isDefault` handles unmatched locations. A fallback handles missing inputs; do not assume the default handles every missing-country or missing-region case." Validate the final array with `inspectPolicyRules()` [c15t, policy-packs.md].
- On Inth, policies live in the hosted project: "Importing `recommendedPolicyRules()` or changing browser styling does not override the hosted policy." [c15t, policies.md]

## Policy scope and discovered categories

[c15t, consent-categories.md]

- Categories come from "registered scripts, network rules, React `ConsentGate` components, and iframes with `data-category` handled by the iframe blocker", plus inert scripts tagged `data-c15t-category`.
- "An omitted scope, `['*']`, or a list containing only `necessary` expands to the default optional categories; a necessary-only list is not a shortcut for disabling all tracking."
- "A category declared after that acknowledgement, such as a newly registered script or a discovered iframe, needs a choice, so the banner asks again."
- "Adding a category can require a new choice; removing a script or unmounting a frame does not remove its category or erase consent. Discovery does not grant consent or change backend permission restrictions."
- A stored choice or acknowledgement "expires with the policy's choice validity and after a policy change, like a choice would." "A changed policy, a new required category or an expired choice prompts again. This is intended." [c15t, troubleshooting.md]

## Google Consent Mode types

c15t maps `necessary`, `functionality`, `measurement`, `marketing` and `experience` onto Google's consent types (`marketing` covers `ad_storage`, `ad_user_data` and `ad_personalization`) [c15t, integrations/google-tag.md]; the table, checked against Google's list, is in [google-analytics CONSENT-MODE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/google-analytics/CONSENT-MODE.md). "Under an opt-out policy, the default command can grant types before the visitor has chosen anything. That is a permission, not a recorded choice." [c15t] When Google's script loads relative to the choice is [SCRIPT-GATING.md](SCRIPT-GATING.md#google-consent-mode-and-tag-managers).

## Why the banner may be absent

"A missing banner can be an expected policy outcome or an initialization problem. Check `resolution.status` before interpreting the active model." [c15t, policies.md]

| State | What to check |
|--|--|
| A policy matched and `promptRequirement.kind` is `none` | The rule does not ask for an initial prompt, or the stored records already satisfy it. Check persistent preferences separately. |
| A policy matched but a category is denied | Inspect `effectivePermissions`, `explicitChoice`, `privacySignals` and `restrictions`. A saved refusal or GPC can keep it denied. |
| No policy has matched | Check backend connectivity, location inputs and policy configuration. Optional categories stay denied while resolution is unresolved. |

"Do not treat `policyRule` alone as proof that a policy resolved. The snapshot also carries a safe rule for evaluation while resolution is pending or failed." The DevTools-side causes (CORS, placeholder URL, ad blockers) are in [C15T.md](C15T.md#troubleshooting).

## Prove it

Every optional tool has a category named by purpose and none is `necessary` for convenience; the code that loads it reads a permission and the code that reports rates reads the recorded choice; under the opt-in policy every optional category is denied before a choice and while the policy is unresolved; a dismissed notice grants nothing; GPC restricts without a stored refusal and stops restricting when it is off; a preferences control is reachable after the banner closes; and each region you serve (one that needs a choice, one without a prompt, no location at all) resolves to the rule you expect.
