# Testing and verification boundaries

Convex-specific expectations come from [get-convex/agent-skills, convex-test, convex-verify, convex-create-component/references/packaged-components.md] and [official convex-test documentation](https://docs.convex.dev/testing/convex-test). Generic integration-testing policy remains in [testing INTEGRATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/testing/INTEGRATION.md).

## Mock backend scope

- **Use convex-test for fast backend logic checks.** It runs against an in-memory mock, not a live Convex deployment. Keep real-backend coverage for behavior the mock does not model. The source said to use the mock instead of a live deployment; the existing repository rule retains both for their respective boundaries. [get-convex/agent-skills, convex-test; https://docs.convex.dev/testing/convex-test]
- **Inspect the installed Vitest/runtime setup.** Current official setup uses edge-runtime; dependency inlining is not a universal prerequisite. The source claimed convex-test inlining was always required for import.meta.glob and diagnosed failure from its absence alone. Verify the actual version and failure before changing configuration. [https://docs.convex.dev/testing/convex-test]
- **Pass explicit modules for a custom functions directory.** Align the modules glob and schema with convex.json.functions rather than assuming the default convex/ layout. [https://docs.convex.dev/testing/convex-test; https://docs.convex.dev/config/convex.json#changing-the-convex-folder-name-or-location]
- **Register components explicitly.** Use their exported test helpers or documented schema/module registration, so the test's component tree matches the application's actual configuration. [get-convex/agent-skills, convex-create-component/references/packaged-components.md]

## Authorization and completion evidence

- **Cover owner, other user and anonymous access.** Include a valid ID owned by another user and a child pointing to an unauthorized parent; verify output privacy as well as mutation rejection. A happy-path test does not establish isolation. [get-convex/agent-skills, convex-authz, convex-verify]
- **Wait for the work the assertion depends on.** Scheduled/background work needs the documented completion mechanism before checking its effects; a returned scheduling call is not completed work. Inspect the installed convex-test API instead of inventing a timer or wait helper. [get-convex/agent-skills, convex-test, convex-verify]
- **Report actual verification separately from acceptance expectations.** The source mandates automatic checks; this repository permits no tests or builds unless the user asks. Reading, permitted JavaScript syntax checks and unperformed runtime checks must be named honestly. [get-convex/agent-skills, convex-verify; user standing rules]

## Prove it

The declared verification covers the selected function contracts, negative authorization, component registration and scheduled completion. It states which results came from the mock, which from a real backend and which were not run; a mock-only pass is not a claim about unmodeled production behavior. [get-convex/agent-skills, convex-test, convex-verify]
