# App Review notes and recovery

Preparing reviewer access notes, answering a rejection, choosing an appeal and requesting an expedited review. The notes workflow comes from Apple and the third-party truongduy2611 preflight rules; the recovery playbook is [eronred], whose response-time estimates are author claims, not Apple guarantees. Submission stages and CLI draft ownership remain in [TESTFLIGHT-AND-RELEASE.md](TESTFLIGHT-AND-RELEASE.md); policy definitions remain in [REVIEW-GUIDELINES.md](REVIEW-GUIDELINES.md).

## Review notes

Apple's checklist asks for "detailed explanations of non-obvious features and in-app purchases in the App Review notes", and 2.3.1(a) rejects generic notes ("bug fixes and improvements", "new features").

- **App Review Information fields** in App Store Connect: contact name, email, phone (international format with + and country code; numbers only are not accepted); Notes up to 4000 bytes, any language, with test registration or account details (and a test stream URL for cellular streaming video); Sign-in: a demo account username and password that "must not expire", plus an SSO demo login (e.g. Facebook) where used; extra accounts go in Notes.
- **Six sections for every new submission** (first-time apps or major new versions; the preflight rule, severity P1 (source REJECTION, mapped in [PREFLIGHT.md](PREFLIGHT.md#greenlight-cli)): omission "commonly triggers a rejection or an Information Needed response"). Apple's Information Needed message asks for the first five:
  1. **Screen recording on a physical device,** starting from launch and showing the typical flow, including where present: registration, login, account deletion; paid content, purchase and subscription flows; UGC including reporting and blocking; prompts for sensitive data or capabilities (location, contacts, camera, microphone). Record on a real device, not a simulator, keep it under 5 minutes, upload it and paste the URL.
  2. **App purpose:** the problem it solves and its value to the audience.
  3. **Access instructions and test credentials:** a dedicated demo account that won't expire (keep it active "at least 2 weeks" from submission); steps to gated features; every remote feature flag gating a user-facing feature and how to turn it on (2.5.19).
  4. **External services:** data providers, auth (Firebase Auth, Auth0), payments (Stripe, RevenueCat), AI services (OpenAI, Google AI) and where the third-party AI consent screen appears, analytics, cloud storage. The template uses a Service | Purpose table.
  5. **Regional differences,** or confirmation the app is the same in all regions (one sentence is enough if none). Explain legal region gating here.
  6. **Regulated industry documentation** where it applies (healthcare, finance, gambling, insurance, legal): VPN license (5.4); a medical regulatory clearance link consistent with the medical device status (1.4.1); Brazil fixed-odds SPA license, where "Only a new app version starts license verification" (5.3.4).
- **Template** (preflight `review_notes_template.md`, pasted into the App Store Connect notes or fastlane's `metadata/review_information/notes.txt`): 1 Screen Recording (demo video URL, the physical device model, the flows shown); 2 App Purpose (what problem it solves, what value it provides); 3 Access Instructions & Test Credentials (steps, test username and password, "This account will remain active through [date, at least 2 weeks from submission]"); 4 External Services (a Service | Purpose table); 5 Regional Differences (Option A: no regional differences; Option B: list each region and difference); 6 Regulated Industry Documentation (delete if not regulated).
- **Entitlement justifications:** if Apple asks about an entitlement, reply in App Store Connect explaining how and where it is used.
- **Detect the notes:** from pulled metadata or fastlane's `metadata/review_information/notes.txt`, scan for each source-defined section's keywords. [truongduy2611/app-store-preflight-skills, review-notes]

## Rejection recovery

Source: [eronred].

- **Goal:** resubmit within 24-72 hours. Ask for the full rejection message verbatim with guideline numbers, the platform, first submission or update (first submissions are scrutinized harder), App ID and category, what changed, and how time-sensitive it is. Classify before fixing.

| Apple guideline | Bucket | Typical fix |
|---|---|---|
| 2.1 | Performance and completeness | Test on a physical device, fix crashes, add missing demo content |
| 2.3.x | Accurate metadata | Match screenshots to the actual app, remove unsupported devices, fix the description |
| 2.5.x | Software requirements | Approved APIs only, fix private API use, fix HealthKit/SiriKit misuse |
| 3.1.1 | In-app purchase | Apply IAP and the actual storefront/category exceptions; US external links/buttons do not require these entitlements ([purchase rules](PRICING-AND-SUBSCRIPTIONS.md#external-purchase-links-us-and-eu)) |
| 3.1.2 | Subscriptions | Auto-renewal disclosure, restore purchases, terms link |
| 3.2.2 | Unacceptable business model | App Store-like interfaces, ad impression or click fraud, charity fundraising outside the rules, arbitrary user restrictions, manipulating visibility on other services, binary options and CFDs, personal-loan terms, forcing ratings, reviews or other store actions ([guidelines](https://developer.apple.com/app-store/review/guidelines/); the row used to say "Multi-level marketing, scams, etc.", which 3.2.2 does not list) |
| 4.0 | Design | Spam, copycat UI, broken layouts |
| 4.2 | Minimum functionality | Web wrappers, "thin" apps, brochureware |
| 4.3 | Spam | Duplicate of your own or another app; the most common rejection |
| 4.5.x | Apple sites and services | Wrong logo use, push notification misuse |
| 5.1.1 | Privacy and data collection | Privacy policy URL, data collection disclosure, ATT prompt copy |
| 5.1.2 | Data use and sharing | Match the privacy nutrition labels to actual collection |
| 5.1.5 | Location services | Justify "Always" location, ATT-style strings |
| 1.4.1, 5.1.3 | Health accuracy and health data | Disclose methodology, avoid prohibited sensor-only diagnostics, remind users to consult a doctor, and follow health-data/research restrictions ([official guidelines](https://developer.apple.com/app-store/review/guidelines/)); the source incorrectly called health 5.1.7 |
| 5.2.x | Intellectual property | Trademark/IP holder permission required |
| 5.3.x | Gaming, gambling, lotteries | License requirements |
| 5.6.1 | Developer code of conduct | Spam, fake reviews, manipulation |

- **2.1:** read the tested device and iOS version, reproduce on that exact configuration (or the closest available), give a demo account and a walkthrough video in Resolution Center if reproduction is environmental; for a crash, ship a fixed binary and note the exact line in the response.
- **Accurate captures (2.3/2.3.3):** fix screenshots that show UI the app does not have and unsupported-device claims. Apply rights rules to third-party material. The source mislabeled this whole fix 2.3.10, which concerns other mobile platforms/marketplaces and allows specific approved interactive functionality. [https://developer.apple.com/app-store/review/guidelines/#accurate-metadata]
- **3.1.1:** inspect the actual storefront, app category and purchase flow against [purchase rules](PRICING-AND-SUBSCRIPTIONS.md#external-purchase-links-us-and-eu). The US storefront does not require these entitlements for external links/buttons/calls to action; other storefronts have their own conditions. The source incorrectly required a US entitlement and a blanket removal of links. [https://developer.apple.com/app-store/review/guidelines/]
- **4.3:** the hardest. Identify the apps you were compared with; differentiate substantially (unique features, unique branding, a distinct value prop in the metadata); if it's your own portfolio, consolidate or kill old apps. On a first submission, expect it to be permanent unless you fundamentally change the app.
- **5.1.1:** a live, app-specific privacy policy; App Store Connect App Privacy lists every SDK's data collection; a specific ATT purpose string (not "improve the app"); `NSUsageDescription` strings that explain why.
- **5.1.5:** "Always" location needs a demonstrable background need; most apps should use "When In Use". Update Info.plist and the prompt copy.

- **Google Play rejection classification and appeals:** [google-play POLICY-AND-PREFLIGHT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/google-play/POLICY-AND-PREFLIGHT.md#rejection-recovery).

- **Reply in Resolution Center with this template:**

```
Hello App Review Team,

Thank you for the feedback regarding guideline <X.Y.Z>.

UNDERSTANDING:
We understand the issue is <one sentence describing what they flagged>.

CHANGES MADE:
1. <specific change>
2. <specific change>
3. <specific change>

DEMO INFO (if applicable):
  Username: demo@example.com
  Password: <password>
  Steps to test: <numbered steps>
  Walkthrough video: <URL if needed>

We have submitted build <X.Y.Z (build N)> with these changes. Please let us know if any further information is needed.

Thank you,
<Name>
```

- **Reply rules:** a good response gets re-reviewed in 24h. Never argue the guideline; never resubmit the same binary with only a metadata change unless metadata was the issue; always reference the new build number; give demo credentials even if some flows don't need them.

| Situation | Route |
|---|---|
| Guideline misapplied | App Review Board appeal: polite, factual, brief |
| Reviewer mis-tested (for example the wrong device) | Resolution Center reply with reproduction info; no formal appeal needed |
| 4.3 spam, first time | Fix and resubmit with substantial differentiation; don't appeal |
| A sub-policy you genuinely meet | Appeal with evidence (screenshots, code references) |
| 5.6.1 account threats or suspension | Appeal immediately, give context, don't ignore it |

- **App Review Board** responds in 5-10 business days. Don't appeal trivial issues: fixing and resubmitting is faster.
- **Expedited review:** App Store Connect > Contact Us > App Review > Expedited Request. Valid for a critical bug fix affecting users, a time-sensitive event (a launch tied to a date, a partner integration) or a security fix. Don't request it for marketing reasons: Apple denies it and may flag the account.
- **Resubmission checklist:** tested on Apple's device; demo account verified; build number incremented; privacy nutrition labels match; response posted; expedited request only if justified. Expect re-review in 24-48h on Apple, variable on Google.
- **Prevent the next one:** retain the source's oldest-supported-device checks, specific purpose strings, accurate privacy policy, properly authorized screenshot material and prepared demo account. Apply actual metadata rules: 2.3.12 permits generic descriptions for simple bug fixes, security updates and performance improvements, while Notes for Review need specific new-feature details. Guideline 4.8 requires an equivalent option with its three privacy properties when applicable and lists exemptions, not an unconditional named-provider requirement. The source banned generic BUG FIXES descriptions and required Sign in with Apple alongside every third-party login. [https://developer.apple.com/app-store/review/guidelines/]

## Prove it

- The review notes contain the six source-defined sections where applicable, and the demo account remains active through review; a reviewer can reach the documented features and purchases. [truongduy2611/app-store-preflight-skills, review-notes]
- The rejection response names the actual guideline, lists the concrete changes, includes required access details and identifies the replacement build when a binary changed. Metadata-only issues are distinguished from binary fixes. [eronred, rejection-recovery]
