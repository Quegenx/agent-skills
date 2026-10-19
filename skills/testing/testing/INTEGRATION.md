# Integration, architecture and end-to-end tests

## The shape of the suite

The classic pyramid (many unit tests, few integration tests) dates from when an integration test meant a shared database server and a twenty-minute build. Disposable containers changed the economics; the fastest feedback that still tells the truth is often a test against real dependencies. A shape that works for most services and modular monoliths:

- **Unit tests, roughly 15 to 25%:** pure logic only: value objects, domain models and state machines, pricing and tax, parsers, mappers, serializers. Non-trivial, no I/O, no time, no randomness, hard to reach end to end. If a unit test needs a mock of a collaborator, it usually belongs one level up.
- **Integration tests, roughly 60 to 70%:** every route, command and query handler, and message consumer, against real infrastructure (Postgres, Redis, the broker) in containers. Handlers, repositories and wiring live at the seams, and the seams are where bugs are.
- **End-to-end tests, under 10%:** only flows whose silent failure is a commercial or compliance problem: signup, payment, refund, password reset, two-factor enrollment. Slow and occasionally flaky, but they prove the whole system still works.
- **Architecture and contract tests underneath:** milliseconds each, catching the boundary violation or schema drift nobody will notice for six months.

Use the numbers as a starting point, not a quota: classify recent bugs by the smallest test that would have caught them and adjust.

**Why the middle is thick:** a delete handler that marks an account deleted but never saves it passes every mock-based test that forgot to assert the save; one test that calls the endpoint and reads the row catches it without anyone having to remember. Mock-heavy suites share one pathology: they stay green after a refactor that broke production, because they assert how the code calls things, not what happened.

**What a handler unit test can't prove:** a mocked `isOverlapping` returning `true` shows the handler reacts to an overlap, not that overlap detection works. The query, constraints and transaction need a test with real rows.

## Independent evidence

[morluto/rea, rea-analysis-optimization/SKILL.md; rea-ci-tests-audit/SKILL.md]

- Choose an oracle independent of the changed producer: source-built expectations, independently mapped bytes or a producer whose interpretation is checked separately. Two wrappers sharing one faulty decoder can agree while both are wrong.
- If an oracle's normalization or comparison has a demonstrated blind spot, repair it and re-audit earlier accepted results that relied on it. Matching instructions can hide changed values at referenced addresses; the comparison must check the consequential data as well. Keep the earlier acceptance and the repaired check's actual coverage separate, and run only the verification authorized for the task. [art, rea article.md]
- Separate fake-producer, boundary and actual-provider evidence. A fixture or fake engine does not establish the corresponding real provider's behavior.
- Preserve intentionally malformed/adversarial fixtures and their expected rejection. Updating every fixture to become valid can delete the behavior the suite exists to protect.
- A missing required test/report must not become a green result. Optional lanes may skip only with their stated prerequisites and limits recorded.
- A faster run that removes a distinct assertion, lifecycle boundary or concurrency case has changed coverage; compare equivalent completed work before claiming improvement.

## Integration tests against real infrastructure

In-memory substitutes behave like mocks: no constraints, different SQL, different isolation. Run the real engine, and make each run start clean.

```ts
// test/global-setup.ts: one container per test run
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { TestProject } from "vitest/node";

export default async function setup(project: TestProject) {
  const pg = await new PostgreSqlContainer("postgres:17-alpine").withDatabase("app_test").start();   // pinned tag, not latest
  await runMigrations(pg.getConnectionUri());
  await pg.snapshot();                                     // migrated, empty database as a template
  project.provide("databaseUrl", pg.getConnectionUri());   // dynamic port: never hardcode
  return () => pg.stop();
}

declare module "vitest" {
  export interface ProvidedContext { databaseUrl: string }
}
```

```ts
// in a test file
import { inject } from "vitest";
const app = buildApp({ databaseUrl: inject("databaseUrl"), email: new FakeEmailSender() });   // fake only what you don't own
```

- **Start expensive things once:** a container per run (global setup) or per test file, never per test. Pin image versions; an unpinned minor upgrade breaking the suite is a classic.
- **Pass configuration in, don't patch the app:** the container's connection string goes in through the same configuration path production uses; build the app with it rather than swapping services after construction.
- **Run the real migrations** against the container, so the schema under test is the schema you ship.
- **Isolate data between tests.** Either each test creates its own records and asserts only on them (filter by the ID you sent, never "the one row"), or reset before each test: truncate the tables the feature touches, or restore a template snapshot of the migrated database. Anything that counts rows or checks ordering needs the reset. Tests sharing one database must not run in parallel unless their data is disjoint.
- **Read back through a fresh connection or query**, not an object the code under test still holds in memory, so you assert what was persisted.
- **Assert both halves of a rejection:** the 400 and that no row was written.
- **Drive the public entrance** (an HTTP request, the Convex function, the queue message) and assert the observable outcome: the response, the rows, the message published. Tests that don't know whether the handler uses a query builder or raw SQL, one file or three, survive every refactor inside it.
- **Hide setup behind helpers** (`createCustomer()`, `authenticatedClient()`, `resetDatabase()`), so each test reads as the business scenario.
- **Supabase:** `supabase start` runs the full local stack (Postgres, Auth, Storage) in Docker; run migrations with `supabase db reset` and test RLS with two real users. **Convex:** `convex-test` runs functions against an in-memory mock of the backend for fast logic tests; keep a few tests against a real dev deployment for what the mock doesn't model. Convex-specific mock setup, component registration and authorization cases are in [convex TESTING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/convex/TESTING.md). [get-convex/agent-skills, convex-test, convex-verify]
- **CI** needs Docker (GitHub Actions' Ubuntu runners have it). Expect a few minutes for a suite of hundreds of integration tests with container reuse and file-level parallelism.

## Workflows across modules

When modules talk through events, the effect in the second module lags the command in the first. The test sends the command, then **polls** the other module's public query until it succeeds or a deadline passes:

```ts
export async function eventually<T>(probe: () => Promise<T | undefined>, timeoutMs = 15_000, everyMs = 200): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = await probe();
    if (value !== undefined) return value;
    if (Date.now() >= deadline) throw new Error(`EVENTUALLY_TIMEOUT after ${timeoutMs} ms`);
    await new Promise((r) => setTimeout(r, everyMs));
  }
}

const userId = await users.register({ email, password });
const customer = await eventually(() => ticketing.getCustomer(userId));   // created by ticketing's handler for UserRegistered
```

Never a fixed sleep: it's either too short (flaky) or too long (slow). Write each test as one business journey (register, then add a ticket to the cart) using the modules' public commands and queries, and expect these to be the slowest tests in the suite.

## Architecture tests

Rules that live only in a wiki will be broken, not maybe but eventually. Turn them into checks that fail the build:

- **Dependency direction:** domain imports nothing from application, infrastructure or presentation; application nothing from infrastructure. Even when package boundaries already prevent the obvious violations, transitive dependencies, a reorganized workspace, or several layers sharing one package let them back in.
- **Module and slice boundaries:** a module imports only another module's public file; a feature folder imports no sibling feature.
- **Third-party guards:** the domain doesn't import the ORM, the database driver or the framework, even when they're installed transitively.
- **Naming and colocation:** handlers and their command types live in the same folder; files follow the agreed naming, so a search for the convention finds every instance.
- **Visibility:** only the entry points a module exports are importable (an `exports` map, an index that re-exports nothing internal).
- **Shape rules where they encode a real contract:** entities constructed only through factories, domain events immutable.

In TypeScript, dependency-cruiser or `eslint-plugin-boundaries` (or `import/no-restricted-paths`) express most of these as configuration; a rule they can't express ("each handler sits next to its command type") is a short test that walks the source tree and asserts it. Start with dependency direction; it takes minutes and catches the most damaging violations. Prove each rule works: add a forbidden import, see the check fail and name the offending file, remove it. Watch for rules that pass vacuously because their file pattern matches nothing; assert the rule selected at least one file.

**Contract tests** pin what other code depends on: message schemas and API shapes. A test that serializes each published event and compares it with the published schema (or a stored example) catches the renamed field before a consumer does (versioning in the `api-design` skill).

## End-to-end tests

A handful, for the flows that must never silently break, run against a deployed environment with real auth: Playwright for anything with a UI. Keep them independent of each other, give each its own user and data, and write the steps as a person would describe them (the project's acceptance-test conventions).
