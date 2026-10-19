# Writing tests

The API below is the `e2e` agentic runner's (packages `e2e`, `@e2e-dev/web`, `@e2e-dev/mobile`), marked where its behavior differs from Playwright. Agent steps in depth are AGENT-STEPS.md; config and the app under test are RUNNER-SETUP.md. [tester-army/e2e, writing tests]

**Contents:** [Workflow](#workflow) · [Goals and exact steps](#goals-and-exact-steps) · [Habits](#habits) · [Registration and fixtures](#registration-and-fixtures) · [Locators](#locators) · [Actions](#actions) · [Reads](#reads) · [Assertions](#assertions) · [Screenshots](#screenshots) · [Sign-in sessions and secrets](#sign-in-sessions-and-secrets) · [The browser fixture and API checks](#the-browser-fixture-and-api-checks) · [Prove it](#prove-it)

## Workflow

1. **Look at what exists.** Config (`e2e.config.ts` or `.mts`), the tests glob (default `tests/**/*.e2e.ts`), an `e2e` entry in `package.json`. If nothing is there, set up only when the user asked for end-to-end tests, and ask before adding a framework.
2. **Learn the screens before writing:** routes, labels, roles, button text. Semantic locators need the accessible names the app renders: read the components, open the app with `--headed`, or drive it live over MCP (`open_session`, `observe`, `locate`; DEBUGGING.md).
3. **Write `tests/<feature>.e2e.ts`:** one atomic goal per `agent.act`, each outcome pinned with `expect` or `agent.assert`. Use exact `screen` steps where the value must be exact: the sign-in form in setup, a field that must receive one string, a count that must be one number.
4. **Run one file:** `npx e2e run tests/<feature>.e2e.ts`. Agent steps need a model and provider auth; tests without agent steps need no model.
5. **Read the trace page** `.e2e/results/<test>/trace.md`. Fix the locator, the expectation or the app. Never a sleep.

```ts
// tests/billing.e2e.ts
import { test } from '@e2e-dev/web';
import { expect } from 'e2e';
test('a member upgrades to Pro', async ({ app, agent, screen, browser }) => {
  await app.open('/settings/billing');
  await agent.act('upgrade the workspace to the Pro plan');
  await expect(screen.getByRole('status')).toContainText('Pro');
  await expect(browser).toHaveURL('/settings/billing');
});
```

- **A complete file** groups tests in `describe('todos', { tags: ['todos'] }, ...)` with `beforeEach` calling `app.open('/todos')`; the agent drives the flow, `expect` pins it, and `screen` actions handle exact interactions (an empty submit when the empty submit is the point of the test).
- **In a browser every test starts from a fresh context with no page open,** so call `app.open()` first. On a device, a test that skips `app.open()` starts where the previous test left the app.

## Goals and exact steps

- **Mix agent goals with exact steps:** an agent drives one goal, then an exact assertion pins the outcome right after. Each check makes the step cacheable and model-portable.
- **One goal is one outcome that one check confirms.** Bad: `'add a todo and mark it done'`. Good: `'add a todo'`, check, `'mark the todo as done'`, check. Steps toward a single outcome (scroll, close a banner, open the menu, fill one form's fields) are the path, not more goals.

```ts
// BAD: three goals in one instruction, one recording, no check between them.
await agent.act('open the Pro plan, set the seats to {seats}, and check out', { params: { seats: 3 } });
// GOOD: three atomic goals, each pinned before the next.
await agent.act('open the Pro plan');
await expect(screen.getByRole('heading', 'Pro plan')).toBeVisible();
await agent.act('set the seats to {seats}', { params: { seats: 3 } });
await expect(screen.getByRole('status', 'Seats')).toHaveText('3 seats');
await agent.act('check out');
await expect(screen.getByText('Order confirmed')).toBeVisible();
```

- **Use the words on screen** (`'open the Billing tab'`, not `'upgrade'`). Values go in params, never expanded into the sentence. Do not describe mechanics the runner handles (waiting, scrolling, retries).
- **Judge meaning, not phrasing:** `toContain('Pro')`, not the exact sentence a model produced.

## Habits

- **Never add a sleep.** A sleep or fixed wait becomes an assertion on the state it waited for; use a matcher with a longer `timeout` instead.
- **Off-screen state can land after the action returns** (a database row): poll the read with `expect.poll` instead of sleeping.
- **Reads like `textContent()` and `count()` do not wait for a value to change;** use a matcher when a value has to settle.
- **Prefer stable handles:** roles and accessible names, labels, test ids, routes. Take selectors from the source (labels, roles, text); add an `aria-label` or heading where the app lacks an accessible name rather than fall back to CSS classes.
- **Run-unique test data** (`Invoice ${Date.now()}`) and `afterEach` cleanup, so replays and retries never trip over leftovers.
- **`await` every step call** (an unawaited step is `STEP_NOT_AWAITED`).
- **Source app-edit convention:** do not change app behavior to make a test pass; propose that change instead. Authorized shared test keys and accessibility labels follow the [tagged instrumentation scope](SKILL.md#the-rules), not an implicit exception that weakens the assertion. [tester-army/e2e, writing tests; leancodepl/patrol, test keys; owner AGENTS.md]

## Registration and fixtures

- **Imports:** `test`, `describe`, `beforeEach`, `afterEach`, `beforeAll`, `afterAll` from `e2e`; tests that use `browser` import `test` from `@e2e-dev/web` (devices: `@e2e-dev/mobile`). A `describe` body is synchronous (`async` is `COLLECTION_ERROR`).
- **Shapes:** `test('title', { tags: ['smoke'], retries: 2, timeout: 60_000 }, fn)`; `describe('checkout flow', { serial: true }, ...)`; `test.only` (fails CI with `ONLY_IN_CI`); `test.skip(cond, reason)` from the body before the first step; `test.setup('sign in', { sessions: ['admin'] }, ...)`; `test.extend<{ ws: Ws }>({ ws: async ({ browser }, use) => { await use(await seed()); await drop(); } })`, where code after `use()` is teardown and runs after failures too.
- **Options:** `timeout` (covers `beforeEach` plus the body), `retries` 0 to 10, `tags` (distinct, no comma), `skip`, `platforms`, `requires` (a missing capability skips at selection instead of failing), `session`, `agentContext`, `agent` (a name, or a list run once per agent), `trace`, `video`, `serial`.
- **`serial` is for groups only:** members share state, run in order on one worker and retry as a whole. Members cannot set `retries`, `trace`, `video`, `session`, `platforms`, `requires`, `skip` or `only`; nested serial is `COLLECTION_ERROR`.
- **Hooks nest** (outer `beforeEach` first, inner `afterEach` first). `beforeAll` reruns per retry and per serial group; a failing `beforeAll` is `HOOK_FAILED` and skips its scope.
- **A `test.extend` fixture sets up for every test registered through that `test`,** destructured or not, so a state-changing fixture belongs on its own `test`.
- **Built-in fixtures:** `app` (`baseUrl`, `open(path?)`, `back()`, `restart()` keeps persisted state, `clearState()` clears cookies and storage, `screenshot(label?)` denied after a secret fill), `screen`, `agent` (needs a model), `platform` (`web`, `ios`, `android`), `browser` (browser only), `device` (device only), `session` (only in `test.setup`).

## Locators

- **Query order:** `getByRole(role, name?, { exact, checked, disabled, selected, expanded, pressed, level, visible })` first; then `getByLabel`, `getByPlaceholder`, `getByText`, `getByDisplayValue`; `getByTestId` last. Test ids per platform: web `data-testid`, React Native `testID`, Flutter `Semantics(identifier:)`. Native-only Swift/Kotlin and .NET mappings are skipped under the owner stack. [tester-army/e2e, locators; owner stack]
- **Roles are a closed union** (button, link, textbox, ... region); `img` aliases `image`.
- **Text match is exact after whitespace normalization, whole string and case-sensitive** in `e2e`: `name: 'Save'` misses `Save changes` (unlike Playwright). `exact: false` is a case-insensitive substring; a RegExp matches as written.
- **A query that misses makes a negated assertion pass,** so check it positively.
- **Exactly one match** per action, read and assertion: two is `LOCATOR_AMBIGUOUS` at once; zero polls to the action timeout, then `LOCATOR_NOT_FOUND` (`ASSERTION_FAILED` for assertions). Exempt: `toHaveCount`, `toBeVisible`, `toBeHidden`, `toBeAttached`, list-form `toHaveText` and `toContainText`, `isVisible()`, `isHidden()`, `count()`, `all()`, `allTextContents()`.
- **Narrow** with `filter({ hasText })` (case-insensitive substring), `filter({ has })`, `first()`, `last()`, `nth(i)` or scoping. `hasNot`, `hasNotText` and `{}` are `INVALID_LOCATOR`.
- **`visible: true` drops hidden nodes before the exactly-one rule;** an `aria-hidden` spinner that paints counts as visible.
- **Shadow DOM:** open roots and closed roots made with `attachShadow` are reached; declarative closed roots are not.
- **Scrolling:** `screen.scrollUntilVisible(locator, { direction, momentum, timeout })`.
- **An unlabelled status:** a role query's `name` matches the accessible name only, so match it with `getByRole('status').filter({ hasText: 'Saved.' })` or `getByText`.

## Actions

- **Verbs:** `tap()` / `click()`, `doubleTap()`, `secondaryTap()` (`{ modifiers: ['Shift'] }`), `longPress({ duration })` 100 to 10000 ms (default 500 web, 1000 device), `fill(value | Secret)`, `pressSequentially(text, { delay })`, `clear()`, `press(key)`, `check()`, `uncheck()`, `selectOption(label | {label} | {value} | {index})` (one option), `focus()`, `hover()`, `setInputFiles(paths)`, `dragTo(locator)`, `scrollIntoView()`, `swipe({ direction, momentum })`. Each waits up to `actionTimeout` (30 s).
- **`fill` sets the value with no key events.** When the app reacts to keystrokes (autocomplete, a masked input), use `pressSequentially`.
- **Coordinates are CSS px** (`tap({ position })`, `screen.tapAt`, `screen.swipe({ from, to })`). Prefer a locator: a point moves with the layout.

## Reads

- **`textContent()`, `inputValue()`, `getAttribute()`, `isEnabled()`, `isDisabled()`, `isChecked()`, `boundingBox()`** wait for one match, then read once. **`isVisible()`, `isHidden()`, `count()`** answer at once.
- **Text is rendered `innerText` semantics.** `isChecked()` is `false` on a non-checkable node. `waitFor({ state })` waits for a state.
- **Reading a password field's value or attributes is `POLICY_DENIED`.**

## Assertions

- **`expect(locator)` polls** up to 5 s or `{ timeout }`. `.not` passes once the negation has held for 1 s continuously (or the whole timeout if shorter). `expect(value)` is synchronous.
- **`expect.poll(read, { timeout, interval })`** polls a read (default interval 100 ms). `expect.soft(x)` records without stopping. Asymmetric matchers: `expect.any`, `anything`, `objectContaining`, `arrayContaining`, `stringContaining`, `stringMatching`. `toMatchSchema(schema)` takes any synchronous Standard Schema (Zod, Valibot, ArkType) and returns the typed value.
- **Locator matchers:** `toBeVisible`, `toBeHidden`, `toBeAttached`, `toBeEnabled`, `toBeDisabled`, `toBeChecked`, `toBeSelected`, `toBeExpanded`, `toBeFocused`, `toHaveText`, `toContainText`, `toHaveValue`, `toHaveAttribute`, `toHaveCount`, `toHaveAccessibleName`, `toHaveScreenshot`. Browser: `toHaveURL`, `toHaveTitle`, `toHaveClass`. Values: `toBe`, `toEqual`, `toMatchObject`, ... `toMatchSchema`.
- **List forms:** `toHaveText(['Alpha', /^Beta/])` means exactly two, in order; `toContainText([...])` means each in a distinct match, in order, extras allowed.
- **Playwright options supported:** `{ checked: false }`, `{ enabled: false }`, `{ visible: false }`, `{ attached: false }`, `{ ignoreCase: true }`. `indeterminate` and `useInnerText` are `INVALID_ARGUMENT`.

## Screenshots

- **`expect(screen).toHaveScreenshot('home.png')`** compares against `<test file>-snapshots/<name>-<target>-<os>.png`. The first run writes the file and fails: look at it, commit it, rerun. CI writes nothing into the project; `-u` updates. Options: `threshold`, `maxDiffPixels`, `maxDiffPixelRatio`, `mask`, `maskColor`, `timeout`.
- **Baselines are per OS:** Mac screenshots never serve Linux CI. Write CI's baselines from a CI job with `-u`.

## Sign-in sessions and secrets

- **Sign in once in a setup test, prove it, then save:** dependents declare `{ session: 'admin' }`, and selecting a dependent alone still runs its setup.

```ts
test.setup('authenticate as admin', { sessions: ['admin'] }, async ({ app, screen, session, browser }) => {
  const admin = credentials.user('admin');
  await app.open('/login');
  await screen.getByLabel('Email').fill(admin.username);
  await screen.getByLabel('Password').fill(admin.password);
  await screen.getByRole('button', 'Sign in').tap();
  await expect(browser).toHaveURL('/dashboard'); // prove the sign-in worked before saving
  await session.save('admin');
});
```

- **Setup rules:** setup tests are top-level; exactly one setup per name; names match `[A-Za-z0-9_.-]{1,128}`. A session is cookies, localStorage and IndexedDB for one run, encrypted and deleted at cleanup. Server state is not included.
- **Secrets stay out of test code:** declare accounts in `credentials` and other values in `secrets` in config, with values from the environment. The credential `password` is a `Secret` with no plaintext accessor (named `admin.password`); only `fill()` and `agent.act` params accept it. A registered value passed anywhere as a plain string is redacted to `<secret:name>` everywhere, so the agent cannot type it: pass the handle.
- **Redact after secret entry (pixel taint):** once a secret is filled, model pixels and assertion screenshots are withheld for the rest of the session and `app.screenshot()` is `POLICY_DENIED`. To keep screenshots, sign in without a fill (`browser.setCookies`).
- **A static password must be 6+ code points at config load,** so an unset variable fails every command. Defer it: `() => process.env.ADMIN_PASSWORD ?? ''`.
- **Devices have no `state` capability:** no `test.setup` or `session`; sign in per test.
- **Auditing a SaaS product:** map which parts are public and which need an account first, since a marketing audit gives no permission to look at accounts, tenants or private APIs; use made-up identities and sandbox payments, never real customer data or real charges; and test sign-in for an existing user, not only a new signup [freescan, /blog/how-to-audit-a-saas-website]. The audit side is [site-audit LAUNCH.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/site-audit/LAUNCH.md#saas-audits).

## The browser fixture and API checks

- **Prefer `app` and `screen`;** a portable suite that needs `browser` declares `requires: ['browser']`. A tab the app opens itself is not followed: `browser.goto` its URL.
- **Methods:** `goto`, `reload`, `back`, `forward`, `url()`, `title()`, `waitForURL`, `locator(css)` (last resort), `frameLocator(css)`, `evaluate(fn, arg)` (JSON only, no closures; a throw is `EVALUATE_FAILED`), `addInitScript` (before `app.open`), `route(pattern, handler)` (the handler calls exactly one of `fulfill`, `continue`, `fallback`, `abort`), `unroute`, `waitForResponse(pattern)`, `cookies()`, `setCookies()`, `setViewport()`, `emulateMedia()` (before `app.open`), `onDialog('accept' | 'dismiss' | handler)` (register before the tap; none is `INVALID_STATE`), `waitForDownload(() => trigger)`, `keyboard.*`, `mouse.*`.
- **URL patterns** are a glob or RegExp against the full URL (`*` one segment, `**` crosses `/`); a predicate function is `INVALID_ARGUMENT`.
- **Check APIs beside the UI in the same suite:** `fetch(new URL('/api/users', app.baseUrl))` with value matchers, inside a `test.extend` fixture that reads `browser.cookies()` when the API needs the session.

## Prove it

The file runs alone and passes; `npx e2e run <file> --repeat-each 10 --retries 0` (plus `--no-cache` with agent steps) passes all ten; the trace page shows every agent goal followed by a check; the test contains no sleep, no secret literal and no CSS locator where a role or label exists; and data it created is gone after the run.
