# Migrate existing tool registrations

Move the registration layer while preserving the tools people already use. Sources: the supplied `connect-existing-tools` skill and its detection, inventory, migration, stable-key and verification references. This is separate from adding new capabilities through [INVENTORY.md](INVENTORY.md); the current browser API and consequence rules remain in [TOOL-CONTRACT.md](TOOL-CONTRACT.md).

## Capture the baseline before editing

[connect-existing-tools, references/detection.md and references/inventory.md]

- Resolve workspace dependencies, import aliases and the actual registration path. Follow aliases of `modelContext`; a bare text hit does not establish which browser surface or wrapper is called.
- Classify each tool as already using the chosen registration layer, native registration to migrate, an unsupported third-party wrapper, or runtime-observed without locatable source. Do not reconstruct a missing handler from its discovered schema.
- Record the exact wire name, schema, annotations, handler path, registration entry module and lifetime. Preserve any existing durable identity rather than deriving a replacement from a renamed wire name.
- Record availability as route by authentication or role state, including explicit expected absence. Note state gates such as an empty cart and the exit that unregisters the tool. A page list alone can miss a widened gate.
- When a runtime is available, list all tools for each route and state in one visit. Reconcile source-only and runtime-only entries. With no browser, report source coverage and runtime-unverified availability; do not claim every live registration was found.
- Keep baseline artifacts outside the committed change when they contain invocation results or account data. Preserve the baseline through the migration; regenerating it from the migrated tree proves nothing.

## Preserve the contract

[connect-existing-tools, references/migration.md and references/stable-keys.md]

- Keep names, schemas, annotations, business logic and visible effects unchanged. A default name derived from a durable key can silently rename an existing tool; set the original wire name explicitly where the target layer has such a default.
- Check the target layer's required fields, accepted names and duplicate behavior before moving anything. A missing description or unsupported native field is a named compatibility issue, not permission to invent or discard it.
- Keep one owner for each registration scope. Move its route, auth and state gates, and its cleanup, with it. Splitting or merging scopes can change which tools coexist.
- Retain existing durable keys exactly. If introducing keys, check collisions across the entire inventory, not only one batch; punctuation normalization can merge different names. Resolve ambiguous identity explicitly rather than truncating or silently renaming.
- Unsupported wrappers and browser-only definitions remain reported limitations until their real source or an approved migration path is available.
- Preserve concurrent edits during recovery. The source proposes restoring whole-file snapshots on failure; reconcile the task's own changes against the current file instead of overwriting another writer's work. [connect-existing-tools, references/migration.md, Rollback; repository surgical-change rule]

## Verify behavior separately from attribution

[connect-existing-tools, references/verify-connection.md; implement, references/verify.md and references/connect.md]

1. Compare the same names, schemas, annotations and presence/absence matrix after migration, including sign-out and other unregistering exits.
2. Invoke safe read-only fixtures and compare results, errors and the app's actual state. Mutations keep the existing [consequential gate](VALIDATION.md#the-consequential-gate); use only an authorized isolated environment. No safe invocation means behavior remains unverified.
3. Compare stable fixture output against the captured baseline. The source asks for byte-identical responses; identify volatile fields and the intended contract before treating a changing timestamp or live record as a regression.
4. Repeat the discovery and planning pass without writing. Already migrated tools retain their identity and propose no additional changes.
5. If an analytics connection is part of the request, verify its configured destination separately from tool behavior. Configuration alone is not an attributed invocation, and an attributed invocation does not prove dashboard processing, deployment or every tool's behavior.

The supplied vendor flow requires an SDK and account connection and reports anonymous usage by default. These are properties of that optional vendor path, not WebMCP requirements. Inspect its current package, data flow and opt-outs before proposing adoption. Keep the first-party native route and the app's confirmation and authorization rules. The source's claim that omitting `readOnlyHint` guarantees browser confirmation is not an enforcement contract: current Chrome also documents `consequentialHint` and developer-tool `debugging`; annotations remain hints. [implement, references/codegen.md and references/webmcp.md; Chrome imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)

Module-load validation also needs an executed import or page load. The source first says the static pass catches an eager definition throw, then correctly notes that typecheck and lint do not evaluate module bodies; do not count static success as that runtime proof. [connect-existing-tools, references/migration.md, Case 2]

## Prove it

Deliver a per-tool record of preserved identity, changed registration path, availability comparisons, safe invocation and error evidence, and remaining unsupported or unverified cases. State analytics configuration and runtime attribution separately when applicable. A second planning pass is empty, and no handler or gate changed without an explicit intended-change record. [connect-existing-tools, references/verify-connection.md, Report]
