# Consent journey

A cookie consent test proves what the browser sent, not what the banner showed: "'The banner appears' is not a test result." Source: c15t's verify-consent guide (https://c15t.com/docs/guides/verify-consent.md, Apache-2.0, tagged `[c15t]`), turned into end-to-end journeys. The consent rules themselves are [cookie-consent skill](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/cookie-consent/SKILL.md); the manual release check with every location and GPC is [cookie-consent verification guide](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/cookie-consent/VERIFY-CONSENT.md).

## Set up the run

- **Test the production build.** "Dev servers load code differently and hide problems." [c15t] For tester-army/e2e, point `app.command` at the build and its server (`next build && next start`, `vite build && vite preview`), not `dev` ([tester-army-e2e: RUNNER-SETUP.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/tester-army-e2e/RUNNER-SETUP.md#the-app-under-test)).
- **Start every test with no stored choice.** A tester-army/e2e browser test starts "from a fresh context with no page open", which matches c15t's "Open a private window, so no earlier choice is stored." Do not reuse a saved session for consent tests.
- **List the vendor hosts first** (c15t's examples: `posthog.com`, `googletagmanager.com`, `connect.facebook.net`, `youtube-nocookie.com`) from the site's consent inventory, and remove duplicate loaders before testing, "or the results mean nothing" [c15t].
- **Test under a policy that asks for a choice,** such as an EU opt-in policy [c15t]. Under opt-out, vendor requests before a choice are expected.
- **Google helpers that always load** (Google Tag and Google Tag Manager by default) send requests before consent on purpose; for them assert the consent state, not the absence of requests [c15t].

## Counting vendor requests

Count requests to each vendor host from what the browser actually sent (the network panel in c15t's manual check [c15t]), and read the count after the page load you are checking. After a withdrawal c15t reloads the page; a test can see that reload through the navigation entry's `type`, which is `'reload'` after `location.reload()` ([MDN, PerformanceNavigationTiming.type](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming/type)).

## The journeys

One journey per test. When using tester-army/e2e, its step API is in [tester-army-e2e: WRITING-TESTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/tester-army-e2e/WRITING-TESTS.md). The words below are the ones c15t's quickstarts use ("Reject All", "Accept All", a footer "Privacy settings" control, "Analytics" for `measurement`); check the role and words your banner actually renders.

**A visitor who rejects cookies is never tracked** [c15t]
1. Open the home page as a first-time visitor.
2. Check: the banner's "Reject All" button is visible, and no request has gone to the vendor host.
3. Choose "Reject All" and wait for the consent backend's response.
4. Check: the banner is gone, and still no vendor request.
5. Reload the page.
6. Check: the footer "Privacy settings" control is visible, no banner shows, no vendor request, and the choice is stored.

**A visitor who withdraws analytics stops being tracked** [c15t]
1. Open the home page and choose "Accept All".
2. Check: the vendor loads.
3. Open "Privacy settings" from the footer, turn Analytics off and save.
4. Check: the page reloads, and the vendor is not contacted again.

**A visitor whose consent service is down is not tracked** [c15t]
1. Make the consent backend unreachable for this run.
2. Open the home page.
3. Check: the page works, no banner appears, and the vendor is never contacted.

- **Why each test proves its locator positively:** "A query that misses makes a negated assertion pass" ([tester-army-e2e: WRITING-TESTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/tester-army-e2e/WRITING-TESTS.md#locators)). So the first journey sees "Reject All" visible before checking it is gone, and the reload step checks the footer control first, so a renamed button fails the test instead of passing it.
- **The banner closing is not the save.** "A closing banner does not prove a saved choice; wait for the backend response." [c15t, SKILL.md §7] The first journey waits for the backend response.
- **The failed-backend test needs a browser-side init.** When the server resolves consent before the page loads (a Next.js build-time manifest), the browser never makes that request; c15t's alternative is "pointing the backend URL at an unreachable address for one run", which in tester-army/e2e is a separate target whose `app.command` env sets the unreachable URL [c15t]. Expected either way: "No banner appears, and vendors that wait for consent send no requests." "A missing banner must never mean 'allowed'." [c15t]
- **Client-side navigation:** add a step that moves between pages without a reload and checks the vendor script loaded once, not once per navigation [c15t].
- **Not covered here:** locations (Germany or the UK, a location without a prompt, no location headers), GPC on and off, keyboard and 375 px checks. They are in the manual check [cookie-consent verification guide](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/cookie-consent/VERIFY-CONSENT.md); a location test needs the framework's `country` override, removed before deploy [c15t].

## Prove it

The journeys run against the production build and pass on repeated runs with no retries; planting a plain `<script src="https://...posthog.com/...">` in the page layout makes the first journey fail at its first vendor check.
