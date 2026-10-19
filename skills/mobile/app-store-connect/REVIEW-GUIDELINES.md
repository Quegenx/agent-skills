# App Review Guidelines

The App Review Guidelines are the rules Apple applies to every submission, in five sections: Safety (1), Performance (2), Business (3), Design (4) and Legal (5). The current text reads "Last Updated: October 16, 2026" (https://developer.apple.com/app-store/review/guidelines/); check https://developer.apple.com/news/ for newer changes. You answer for everything in the binary, "including ad networks, analytics services, and third-party SDKs". The guideline summaries in the third-party preflight skill are its author's paraphrase, not Apple's text; where a summary differs from Apple's text, both are given below (confirm in the current guidelines).

**Contents:** [Version and recent changes](#version-and-recent-changes) · [Before you submit](#before-you-submit) · [1 Safety](#1-safety) · [2 Performance](#2-performance) · [3 Business](#3-business) · [4 Design](#4-design) · [5 Legal](#5-legal) · [After you submit](#after-you-submit) · [Where preflight summaries differ from Apple](#where-preflight-summaries-differ-from-apple) · [Prove it](#prove-it)

Related: [PREFLIGHT.md](PREFLIGHT.md) (checks to run before submitting), [PRIVACY-AND-COMPLIANCE.md](PRIVACY-AND-COMPLIANCE.md) (privacy manifests, labels, ATT, account deletion, Sign in with Apple, review notes), [PRICING-AND-SUBSCRIPTIONS.md](PRICING-AND-SUBSCRIPTIONS.md) (IAP setup and external purchase links), [METADATA-AND-SCREENSHOTS.md](METADATA-AND-SCREENSHOTS.md) (product page fields and specs), [TESTFLIGHT-AND-RELEASE.md](TESTFLIGHT-AND-RELEASE.md) (builds, submission and release).

## Version and recent changes

- **Notarization marker:** guidelines marked with a symbol also apply to Notarization for iOS and iPadOS apps; the page has a "Highlight Notarization Review Guidelines Only" toggle.
- **Cheating the system** ("trying to trick the review process, steal user data, copy another developer's work, manipulate ratings or App Store discovery") removes apps and expels the developer from the Apple Developer Program.

| Date | Guidelines | Change |
|---|---|---|
| 2026-10-16 | 1.2 | UGC scope includes AI content creation apps; nonconsensual intimate imagery; Code of Conduct risk for failing to remediate |
| 2026-10-16 | 2.3.14 | New: creative assets |
| 2026-10-16 | 2.5.19 | New: hidden, dormant or undocumented features (moved from 2.3.1) |
| 2026-10-16 | 3.1.1(a) | Music Streaming Services Entitlement merged into the StoreKit External Purchase Link bullet |
| 2026-10-16 | 5 | Human trafficking and child exploitation apps removed and blocked from alternative distribution |
| 2026-06-08 | Intro, 1.2, 4.3(a), 4.3(b), 4.5.3 | Kid and teen safety; developer responsibility for violating content; spam examples; Live Activities spam |
| 2026-02-06 | 1.2 | Random or anonymous chat apps subject to 1.2 |
| 2025-11-13 | 1.2.1(a), 2.5.10, 3.2.2(ix), 4.1(c), 4.7, 4.7.2, 4.7.5, 5.1.1(ix), 5.1.2(i) | Creator age restriction; 2.5.10 deleted ("Apps should not be submitted with empty ad banners or test advertisements."); loan APR 36%; others' brands; HTML5/JS mini apps; crypto exchanges regulated; third-party AI disclosure |
| 2025-05-01 | 3.1.1, 3.1.1(a), 3.1.3, 3.1.3(a) | US storefront external links and buttons |

## Before you submit

Apple's own checklist:

- **Test for crashes and bugs.**
- **Complete and accurate metadata,** and up-to-date contact information in case App Review needs to reach you.
- **Full access for App Review:** with account-based features, provide an active demo account or a fully featured demo mode, plus any hardware or resources needed (login credentials, a sample QR code).
- **Backend live** and accessible during review.
- **Explain non-obvious features and in-app purchases** in the App Review notes, with supporting documentation where appropriate.
- **Regulatory documentation** for apps and features that need regulatory approval.
- "If your app no longer functions as intended or you're no longer actively supporting it, it will be removed from the App Store."

## 1 Safety

- **1.1 Objectionable content:** 1.1.1 defamatory; 1.1.2 violence (game enemies can't target real groups); 1.1.3 weapons; 1.1.4 sexual content (no hookup or prostitution facilitation); 1.1.5 religious; 1.1.6 false information and features (fake location trackers, prank calls; misleading AI capability claims such as an "AI doctor"); 1.1.7 profiting from recent tragedies.
- **1.2 User-generated content** (social media, UGC platforms, "AI content creation apps", random or anonymous chat) must have: a method for filtering objectionable material; a way to report offensive content with timely responses; the ability to block abusive users; published contact information. Prevent and remove nonconsensual intimate imagery, including AI-generated. Failing to remediate after notice is a Code of Conduct violation. Incidental NSFW content from a web service is allowed only when hidden by default and turned on via your website.
- **1.2.1(a) Creator apps:** let users identify content that exceeds the app's age rating, and use an age restriction mechanism "based on verified or declared age". Creator apps also use IAP per 3.1.1.
- **1.3 Kids Category:** no links out, purchasing or distractions unless behind a parental gate; no PII or device information sent to third parties; should not include third-party analytics or advertising. Limited exceptions: analytics that do not collect the IDFA or identifiable information, and contextual ads with publicly documented practices including human review of creatives.
- **1.4 Physical harm:** 1.4.1 medical apps disclose data and methodology behind accuracy claims; apps claiming to measure blood pressure, body temperature, blood glucose or blood oxygen "using only the sensors on the device are not permitted"; remind users to check with a doctor. 1.4.2 drug dosage calculators come from approved entities (manufacturer, hospital, university, FDA-approved). 1.4.3 substance use; 1.4.4 only law-enforcement-published DUI checkpoints; 1.4.5 no risky bets or challenges.
- **1.5 Developer information:** the app and its Support URL include an easy way to contact you. Wallet passes need valid issuer information.
- **1.6 Data security:** implement appropriate security measures for user information.
- **1.7** Criminal activity reporting must involve local law enforcement.

## 2 Performance

- **2.1(a) App completeness,** verbatim: "Submissions to App Review, including apps you make available for pre-order, should be final versions with all necessary metadata and fully functional URLs included; placeholder text, empty websites, and other temporary content should be scrubbed before submission. Make sure your app has been tested on-device for bugs and stability before you submit it, and include demo account info (and turn on your back-end service!) if your app includes a login. If you are unable to provide a demo account due to legal or security obligations, you may include a built-in demo mode in lieu of a demo account with prior approval by Apple. Ensure the demo mode exhibits your app's full features and functionality. We will reject incomplete app bundles and binaries that crash or exhibit obvious technical problems."
- **2.1(b) In-app purchases:** "If you offer in-app purchases in your app, make sure they are complete, up-to-date, visible to the reviewer and functional. If any configured in-app purchase items cannot be found or reviewed in your app, explain the reason in your review notes."
- **2.2 Beta testing:** demos, betas and trial versions don't belong on the App Store; use TestFlight. TestFlight builds must be meant for public distribution and follow the guidelines, can't be given to testers for compensation (including crowd-funding rewards), and significant beta updates go to TestFlight App Review first.

### 2.3 Accurate metadata

All metadata, "including privacy information, your app description, screenshots, and previews", must reflect the core experience and stay current.

| Guideline | Rule |
|---|---|
| 2.3.1(a) | Describe new features and changes "with specificity in the Notes for Review section of App Store Connect (generic descriptions will be rejected)". Misleading marketing (e.g. "iOS-based virus and malware scanners") or a false price, inside or outside the App Store, is grounds for removal and termination. |
| 2.3.1(b) | Egregious or repeated behavior: removal from the Developer Program. |
| 2.3.2 | Description, screenshots and previews say clearly whether featured items need extra purchases. Promoted IAPs need a Display Name, Screenshot and Description, and the app must handle `SKPaymentTransactionObserver` so the purchase completes at launch. |
| 2.3.3 | Screenshots "should show the app in use, and not merely the title art, login page, or splash screen"; text and image overlays allowed. |
| 2.3.4 | Previews "may only use video screen captures of the app itself"; narration and video or text overlays allowed. |
| 2.3.5 | Pick the most appropriate category; Apple may change it. |
| 2.3.6 | Answer the age rating questions honestly. |
| 2.3.7 | Unique name, accurate keywords, no trademarked terms, popular app names, pricing or irrelevant phrases. "App names must be limited to 30 characters." Names, subtitles, screenshots and previews carry no prices, terms or descriptions not specific to that metadata type. Subtitles don't reference other apps or make unverifiable claims. Apple may modify inappropriate keywords. |
| 2.3.8 | Icons, screenshots and previews meet a 4+ rating even if the app is rated higher. "For Kids" and "For Children" are reserved for the Kids Category. |
| 2.3.9 | Secure rights to all materials; show fictional account information, not a real person's data. |
| 2.3.10 | No names, icons or imagery of other mobile platforms or alternative app marketplaces in the app or its metadata unless there is specific approved interactive functionality. The old summary omitted the exception. [https://developer.apple.com/app-store/review/guidelines/#accurate-metadata] |
| 2.3.11 | Pre-order apps must be complete and deliverable as submitted. |
| 2.3.12 | "What's New" describes new features clearly; simple bug fixes may use a generic description. |
| 2.3.13 | In-app events fit an event type in App Store Connect, metadata pertains to the event, events happen at the selected times across storefronts, the deep link goes to the right place. |
| 2.3.14 | Creative assets (product page header, search results) pertain to the app or brand, suit all audiences, make no misleading references to other apps, no unverifiable claims, and no "specific or discounted pricing information". |

### 2.4 and 2.5 Hardware and software

- **2.4.1** iPhone apps should run on iPad whenever possible. **2.4.2** no rapid battery drain or heat, no unrelated background processes such as crypto mining. **2.4.3** Apple TV apps work with the Siri remote. **2.4.4** never suggest a device restart or unrelated system-settings changes. **2.4.5** Mac App Store apps are sandboxed, no auto-launch, no third-party installers, no license screens (see [PREFLIGHT.md](PREFLIGHT.md#macos)).
- **2.5.1** public APIs only, run on the currently shipping OS. **2.5.2** self-contained; never download, install or execute code that introduces or changes features. **2.5.4** background services only for their intended purposes. **2.5.5** "Apps must be fully functional on IPv6-only networks." **2.5.6** web browsing uses WebKit (an alternative engine entitlement exists for the EU and Japan).
- **2.5.8** no alternate home screens; **2.5.9** don't alter system controls; **2.5.11** SiriKit only for relevant intents; **2.5.12** CallKit blocks only confirmed spam; **2.5.13** face recognition via LocalAuthentication, with alternate auth for under-13 users. **2.5.15** Files app and iCloud documents. **2.5.17** Matter through Apple's framework.
- **2.5.14** explicit consent and a clear visual or audible indication when recording user activity (camera, microphone, screen).
- **2.5.16** widgets, extensions and notifications relate to the app; App Clips contain no advertising. 2.5.16(a) App Clip features are also in the main app.
- **2.5.18 Ads:** only in the main app binary (not extensions, App Clips, widgets, notifications, keyboards or watchOS apps); appropriate for the age rating; show targeting information (preflight summary); no targeting on sensitive data (health, ClassKit, kids); interstitials clearly labeled with easily reached close or skip buttons; users can report inappropriate ads.
- **2.5.19 Hidden features:** no hidden, dormant or undocumented features, including through code obfuscation, and no bait-and-switch. Detection patterns: [PREFLIGHT.md](PREFLIGHT.md#hidden-features-2519).

## 3 Business

- **Ratings manipulation:** inflating chart rankings "with paid, incentivized, filtered, or fake feedback" may lead to expulsion.
- **3.1.1 In-App Purchase,** verbatim: "If you want to unlock features or functionality within your app, (by way of example: subscriptions, in-game currencies, game levels, access to premium content, or unlocking a full version), you must use in-app purchase. Apps may not use their own mechanisms to unlock content or functionality, such as license keys, augmented reality markers, QR codes, cryptocurrencies and cryptocurrency wallets, etc."
- **3.1.1 details:** IAP currencies may be used to tip; credits and in-game currencies bought via IAP may not expire; "you should make sure you have a restore mechanism for any restorable in-app purchases"; gifting allowed (refunds only to the original purchaser); loot boxes disclose odds before purchase; digital gift cards for digital goods only via IAP; a non-subscription app may offer a free trial as a Non-Consumable IAP at Price Tier 0 named "XX-day Trial" that discloses duration, what becomes inaccessible and downstream charges; NFT services may be sold via IAP, but NFT ownership may not unlock features.
- **3.1.1(a) Link to other purchase methods:** developers may apply for StoreKit External Purchase Link entitlements (the music streaming bullet is merged here) to link to a permitted destination; the link may say items may be available "for a comparatively lower price". "These entitlements are not required for developers to include buttons, external links, or other calls to action in their United States storefront apps." "In all other storefronts, except for the United States storefront, where this prohibition does not apply, apps and their metadata may not include buttons, external links, or other calls to action that direct customers to purchasing mechanisms other than in-app purchase." Details: [PRICING-AND-SUBSCRIPTIONS.md](PRICING-AND-SUBSCRIPTIONS.md).
- **3.1.2 Subscriptions,** verbatim: "If you offer an auto-renewable subscription, you must provide ongoing value to the customer, and the subscription period must last at least seven days and be available across all of the user's devices." Examples: new game levels, episodic content, multiplayer support, consistent substantive updates, media collections, SaaS, cloud support.
- **3.1.2(a):** may be offered alongside a la carte items; users get what they paid for without extra tasks (posting on social media, uploading contacts, checking in); when moving to subscriptions "you should not take away the primary functionality existing users have already paid for"; free trials through App Store Connect; scams and bait-and-switch lead to removal.
- **3.1.2(b) Upgrades and downgrades** are seamless; users "should not be able to inadvertently subscribe to multiple variations of the same thing."
- **3.1.2(c) Subscription information:** "Before asking a customer to subscribe, you should clearly describe what the user will get for the price. How many issues per month? How much cloud storage? What kind of access to your service? Ensure you clearly communicate the requirements described in Schedule 2 of the Apple Developer Program License Agreement."
- **3.1.3 Other purchase methods:** these apps can't encourage other purchase methods in-app "except for apps on the United States storefront and as set forth in 3.1.1(a) and 3.1.3(a)"; you may communicate outside the app. (a) Reader apps (magazines, newspapers, books, audio, music, video) may apply for the External Link Account Entitlement (not required on the US storefront). (b) Multiplatform services may unlock content bought elsewhere "provided those items are also available as in-app purchases within the app". (c) Enterprise B2B. (d) Real-time person-to-person services may use other methods; one-to-few and one-to-many must use IAP. (e) Physical goods and services consumed outside the app must use other methods (Apple Pay, credit card). (f) Free stand-alone companions to paid web tools (VoIP, cloud storage, email, web hosting) need no IAP if nothing is bought inside. (g) Ad-campaign management apps don't need IAP; in-app "boosts" do.
- **3.1.4** hardware-dependent features can bypass IAP. **3.1.5 Crypto:** wallets from organizations only, no on-device mining, exchanges licensed.
- **3.2.1 Acceptable:** gifts are optional; approved nonprofits; licensed financial apps.
- **3.2.2 Unacceptable:** no App Store-like interfaces, ad fraud, binary options, or manipulated visibility. 3.2.2(ix) personal loans: maximum APR 36% including costs and fees, no repayment in full in 60 days or less, disclose all terms. 3.2.2(x): "Apps must not force users to rate the app, review the app, download other apps, or other store-related actions in order to access functionality".

## 4 Design

- **4.0:** the guidelines are "minimum standards for approval"; "Apps that stop working or offer a degraded experience may be removed from the App Store at any time."
- **4.1 Copycats:** (a) don't copy popular apps; (b) impersonation violates the Code of Conduct; (c) no other developer's icon, brand or product name in your icon or name without approval.
- **4.2 Minimum functionality,** verbatim: "Your app should include features, content, and UI that elevate it beyond a repackaged website. If your app is not particularly useful, unique, or "app-like," it doesn't belong on the App Store. If your App doesn't provide some sort of lasting entertainment value or adequate utility, it may not be accepted." 4.2.1 ARKit apps give rich AR; 4.2.2 not primarily marketing, ads, web clippings, aggregators or link collections; 4.2.3(i) works without another app, (ii) disclose download size and prompt before downloading extra resources on first launch; 4.2.6 template or app-generation-service apps rejected unless submitted by the content provider; 4.2.7 remote desktop only to a user-owned device on the local network.
- **4.3 Spam:** (a) no multiple Bundle IDs of the same app (use IAP for variations); (b) saturated categories ("dating, flashlight, sound effects, wallpaper, simple timers, and fortune telling") need a meaningfully different experience. Drinking games, Kama Sutra and fart or burp apps are rejected.
- **4.4** keyboard and Safari extensions; **4.5** no scraping Apple sites; **4.5.3** no spam via Game Center, Push or Live Activities, don't exploit Player IDs; **4.5.5** Player IDs per Game Center terms, never displayed; **4.5.6** Unicode emoji are fine.
- **4.5.4 Push:** must not be required for the app to function; promotional push only with explicit opt-in through consent language in the app UI, plus an in-app opt-out.
- **4.7 Mini apps, mini games, streaming games, chatbots, plug-ins, emulators** (HTML5 and JavaScript not embedded in the binary) are allowed and follow privacy (5.1), UGC moderation (1.2) and payments (3.1). 4.7.2 don't expose native APIs without permission; 4.7.3 explicit consent each time data or permissions are shared with the software; 4.7.4 an index of offered software with universal links; 4.7.5 age restriction via verified or declared age.
- **4.8 Login services,** verbatim: "Apps that use a third-party or social login service (such as Facebook Login, Google Sign-In, Log in with X, Sign In with LinkedIn, Login with Amazon, or WeChat Login) to set up or authenticate the user's primary account with the app must also offer as an equivalent option another login service with the following features: the login service limits data collection to the user's name and email address; the login service allows users to keep their email address private as part of setting up their account; and the login service does not collect interactions with your app for advertising purposes without consent." The current text names no specific provider; the preflight skill summarizes it as "also offer SIWA-equivalent option" (see [PRIVACY-AND-COMPLIANCE.md](PRIVACY-AND-COMPLIANCE.md#sign-in-with-apple)).
- **4.8 exemptions:** the app uses only your company's own account system; it is an alternative app marketplace (or distributed from one) with a marketplace-specific login; education, enterprise or business apps that need an existing education or enterprise account; government or industry-backed citizen or electronic ID; a client for a specific third-party service where users sign in to their mail, social media or other third-party account directly.
- **4.9 Apple Pay recurring payments** disclose renewal term length and that it continues until canceled, what each period provides, actual charges, and how to cancel.
- **4.10** no charging for built-in capabilities (push, camera, gyroscope) or Apple services (Apple Music, iCloud storage, Screen Time APIs).

## 5 Legal

- **5 Local law:** comply everywhere you ship. Human trafficking and child exploitation apps are removed and blocked from alternative distribution.
- **5.1.1(i) Privacy policy:** "All apps must include a link to their privacy policy in the App Store Connect metadata field and within the app in an easily accessible manner." It identifies what is collected, how, and all uses; confirms third parties (analytics, ad networks, SDKs, parent and subsidiary entities) give equal protection; explains retention and deletion and how to revoke consent or request deletion.
- **5.1.1(ii) Permission:** consent for collecting user or usage data "even if such data is considered to be anonymous"; paid functionality must not depend on granting data access; an easy way to withdraw consent; purpose strings describe use clearly and completely.
- **5.1.1(iii) Data minimization:** request only data relevant to core functionality. "Where possible, use the out-of-process picker or a share sheet rather than requesting full access to protected resources like Photos or Contacts."
- **5.1.1(iv) Access:** don't manipulate or force consent; offer alternatives (manual address entry if Location is declined).
- **5.1.1(v) Account sign-in,** verbatim: "If your app doesn't include significant account-based features, let people use it without a login. If your app supports account creation, you must also offer account deletion within the app. Apps may not require users to enter personal information to function, except when directly relevant to the core functionality of the app or required by law." Include a way to revoke social network credentials; never store social network credentials or tokens off the device.
- **5.1.1(viii)** no compiling personal information from sources other than the user. **5.1.1(ix) Highly regulated fields** (banking, finance, healthcare, gambling, legal cannabis, air travel, crypto exchanges) are submitted by a legal entity, not an individual. **5.1.1(x)** basic contact information requests are optional, and nothing is conditional on them.
- **5.1.2(i) Data use and sharing,** verbatim: "You must clearly disclose where personal data will be shared with third parties, including with third-party AI, and obtain explicit permission before doing so." "You must receive explicit permission from users via the App Tracking Transparency APIs to track their activity." "Your app may not require users to enable system functionalities (such as push notifications, location services, tracking) in order to access functionality, content, use the app, or receive monetary or other compensation, including but not limited to gift cards and codes."
- **5.1.2(ii) to (vi):** no repurposing data without further consent; no surreptitious profile building or de-anonymization; no contact databases built from Contacts or Photos, and no collecting which other apps are installed for analytics or ads; contact people from Contacts or Photos only at the user's explicit, individual initiative (no Select All); HealthKit, HomeKit, ClassKit and ARKit face-mapping data never used for marketing or advertising.
- **5.1.3 Health:** HealthKit data not for ads, marketing or data mining; no false data; research needs informed consent and an independent ethics review board.
- **5.1.4 Kids:** apps intended primarily for kids should not include third-party analytics or advertising (COPPA, GDPR); apps outside the Kids Category can't imply children are the main audience in name, subtitle, icon, screenshots or description.
- **5.1.5 Location:** only when directly relevant; notify and obtain consent.
- **5.2 Intellectual property:** only content you created or licensed; 5.2.3 no downloading media from third-party sources (YouTube, SoundCloud, etc.) without authorization; 5.2.4 don't imply Apple endorsement; 5.2.5 no Apple product images in icons and no confusing use of Apple terms.
- **5.3 Gaming and lotteries:** licensed gambling; lotteries from lottery entities; sweepstakes developer-sponsored with official rules saying Apple isn't a sponsor; 5.3.3 no IAP for real-money gaming credit; 5.3.4 licensed, geo-restricted, free on the App Store, no card counters.
- **5.4 VPN:** use `NEVPNManager`, organization accounts only, declare data collection on screen, never sell or share data, provide license information in review notes where required. **5.5 MDM:** enterprises and education only.
- **5.6 Code of Conduct:** 5.6.1 "Use the provided API to prompt users to review your app ... we will disallow custom review prompts."; 5.6.2 accurate developer information; 5.6.3 no manipulating charts, search, reviews or referrals; 5.6.4 excessive negative reviews and refund requests may factor into Code of Conduct decisions.

## After you submit

- **Repeated rejections** for the same guideline, or manipulation, make review take longer.
- **Expedite requests** exist for critical timing issues; abuse may get future requests rejected.
- **Future release date:** "If your release date is set for the future, the app will not appear on the App Store until that date, even if it is approved by App Review. And remember that it can take up to 24-hours for your app to appear on all selected storefronts."
- **Rejections:** reply to App Review in App Store Connect; appeals are available.
- **Bug fix submissions** for apps already on the store: "bug fixes will not be delayed over guideline violations except for those related to legal or safety issues."

## Where preflight summaries differ from Apple

The third-party preflight skills (truongduy2611/app-store-preflight-skills, RevylAI greenlight) summarize these rules. Where they diverge, both are listed; confirm in the current guidelines.

| Topic | Preflight skill says | Apple says |
|---|---|---|
| Kids analytics (1.3) | "No third-party analytics (limited exceptions: no IDFA, no PII, no location)" | Should not include third-party analytics or ads; exceptions are analytics that don't collect the IDFA or identifiable information, and contextual ads with documented practices and human review |
| External payment (3.1.1, 3.1.3) | greenlight: "External payment is only OK for physical goods." | Also allowed: real-time person-to-person services (3.1.3(d)), entitlement-based links (3.1.1(a), 3.1.3(a)), and links and buttons on the US storefront |
| Sign in with Apple number | Rule files cite 4.0 for the sign-in UX (don't re-ask name and email) | 4.8 requires the equivalent login option; it names no provider |
| Age rating questions (2.3.6) | Social media capability questions required since September 2026 | Answer the updated questions by January 31, 2026 to avoid an interruption when submitting updates |
| iPhone Duo screenshots | "Required for all submissions starting April 2027" | From April 2027, required for any app using the iOS 27.1 SDK or later |
| Previews (2.3.4) | No device frames in previews; "Static screenshots may use device frames." | Previews "may only use video screen captures of the app itself"; nothing on screenshot frames |

## Prove it

- The guidelines page footer still reads "Last Updated: October 16, 2026"; if not, re-read the changed sections and the Apple Developer News entries.
- A reviewer with only the demo account and review notes can reach every feature and every configured IAP item, with the backend running (2.1).
- Metadata follows the qualified 2.3.7 price/off-type rule and the 2.3.10 approved interactive-functionality exception, plus the separate creative-asset and intellectual-property rules; the name is 30 characters or fewer. The old check imposed one blanket price/platform/trademark ban across these fields. [https://developer.apple.com/app-store/review/guidelines/#accurate-metadata]
- Every digital unlock goes through IAP; any external purchase link is on the US storefront or covered by an entitlement (3.1.1, 3.1.1(a)).
- If a third-party or social login sets up the primary account, an equivalent login with the three 4.8 properties sits beside it.
- The privacy policy link is in App Store Connect and inside the app; account deletion is in the app if accounts can be created (5.1.1(i), 5.1.1(v)).
- Review prompts use the system API, not a custom prompt (5.6.1).
