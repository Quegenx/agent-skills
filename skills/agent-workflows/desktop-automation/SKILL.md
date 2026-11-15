---
name: desktop-automation
description: "Operates native desktop apps with agent-desktop: scoped accessibility snapshots, qualified refs, semantic actions, delivery-aware recovery, windows, menus, sessions and sandbox state. Use when an agent must inspect or operate a macOS, Windows or Linux application, fill a native form, handle a dialog or recover from an uncertain desktop action."
---

# Desktop automation

Observe the app through its native accessibility tree, act on an identified control, then verify the effect in the app. Source: the supplied `agent-desktop/SKILL.md` and its four command and workflow references, checked against the [upstream skills](https://github.com/vercel-labs/agent-desktop/tree/main/skills/agent-desktop). Browser pages and browser sessions remain with [browser-automation](https://github.com/Quegenx/agent-skills/blob/main/skills/web-automation/browser-automation/SKILL.md).

| The job | Read |
|---|---|
| Scope observations, choose actions, recover and report evidence | [SKILL.md](SKILL.md) |
| Platform requirements and OS-specific action limits | Run `agent-desktop skills get platform` using the installed binary |
| Exact observation, interaction or system command contract | Run `agent-desktop skills get desktop commands-observation`, `commands-interaction` or `commands-system`, selecting the needed reference |
| Worked forms, menus, dialogs, waits and editor sequences | Run `agent-desktop skills get desktop workflows` |

The installed CLI's platform guide and command help determine supported syntax and delivery paths. An unavailable reference is a reported limit, not permission to guess flags. [agent-desktop, SKILL.md, First run and References]

## The rules

1. **Check the actual host first.** Read `agent-desktop status`, permissions and `supported_surfaces`, then the installed platform skill. Use `agent-desktop <command> --help` for syntax. Missing permission is not an empty application. [agent-desktop, SKILL.md, First run; references/workflows.md, First-Time Setup]
2. **Scope before expanding.** Use `find` with a known role and name; otherwise start with a skeleton and drill one region. Select a window ID when several windows cannot be disambiguated. Read menus, sheets and alerts as surfaces rather than dumping the whole window. [agent-desktop, references/commands-observation.md, snapshot and find]
3. **Use qualified refs from observation.** A ref embeds its snapshot ID. Re-drilling replaces refs inside that subtree while refs outside it remain usable. Refresh the affected region after a change and never invent a ref. [agent-desktop, SKILL.md, Refs; references/commands-observation.md, Choose the scope]
4. **Read completeness and identity.** A successful snapshot can be incomplete. Raise the observation budget or narrow the region; do not infer absence from a cut tree. A unique row label does not make repeated buttons uniquely addressable on every OS. [agent-desktop, references/commands-observation.md, Partial trees and Ref re-identification]
5. **Prefer semantic input.** Ref actions default to the accessibility path. Physical input uses the explicit headed mode when authorized; a failed headless action does not silently authorize escalation. Raw coordinates carry no window identity. [agent-desktop, SKILL.md, Headless and headed; references/commands-interaction.md, Headless and headed]
6. **Delivery controls retries.** Read `disposition.delivery` and `disposition.retry` on both success and error. Retry or substitute only when retry is safe. After uncertain or unverified delivery, inspect live state before doing anything that could repeat a click, type, submit or toggle. [agent-desktop, SKILL.md, Delivery and retry]
7. **A field write is not an application commit.** `set-value` or `type` can verify the element value without proving the document accepted it. Read the resulting application state independently. Prefer idempotent `check` and `uncheck` to `toggle` when the desired state is known. [agent-desktop, references/commands-interaction.md, Read the result, Text input and Selection]
8. **Serialize a shared editor's whole operation.** Activate, observe the editor, write and commit with one writer. An interaction lease or batch does not make that sequence a transaction. [agent-desktop, references/commands-interaction.md, Text input; references/workflows.md, Anti-patterns]
9. **Wait for the relevant effect.** Use an element, text, menu, surface or window predicate rather than a fixed delay. For action-then-event sequences, use the documented batch so its baseline precedes the action. A failed wait does not make the delivered action safe to repeat. [agent-desktop, references/commands-system.md, wait and batch]
10. **Treat captured content and artifacts as sensitive data.** Screenshots, clipboard contents, notifications and screenshot traces can be unredacted even when trace fields are redacted. Use the tool's stdin path for sensitive text rather than process arguments, within the user's authorized task. [agent-desktop, references/commands-interaction.md, Text input; references/commands-system.md, Clipboard and Sessions and traces]

## Observation that preserves context

[agent-desktop, references/commands-observation.md]

- Interactive-only output drops static row labels. Drill the relevant container without `-i` when the label is needed to interpret a control.
- A snapshot's `complete: false` is partial evidence even with `ok: true`. A drill is all-or-nothing; an identity-unproven result may require a larger whole-window observation budget.
- On macOS, refs can use the element's native address. On Windows and Linux, and on macOS without an address, identity depends on a complete uniqueness check. Re-snapshotting genuine identical twins does not resolve them.
- A `find` match without a ref is context, not an action target. Bounds can be stale; check whether a bounds read is live before using coordinates.
- `get text`, `get title` and `get value` have different meanings. Unknown enabled state is not proof that the control is disabled.
- An action that reports an open surface leaves work waiting there. Observe that surface and handle the actual dialog before proceeding.

## Choose the action and verify its scope

[agent-desktop, references/commands-interaction.md; references/workflows.md]

| Goal | Preferred path | Verification |
|---|---|---|
| Enter a value | `set-value`; use real typing when the app needs its events | Field readback, then the app's committed result |
| Edit a table cell | Activate, re-snapshot, target the editor, write, commit | Updated cell or document state |
| Select a known option | `select` | Selected value and any resulting application change |
| Set a checkbox | `check` or `uncheck` | Final checked state |
| Open a context menu | `right-click`, then menu observation | Actual menu surface; inspect before retrying an unresponsive result |
| Reach a virtualized row | Scroll its container, then find | Current visible match, not an invented offscreen ref |
| Drag an object | Authorized headed drag with identified endpoints | Read destination state; command success alone is insufficient |

Physical keyboard `press` does not prove the shortcut's effect. Scope it to the intended app or window and observe the expected state. Coordinate-only input does not focus the target for you. [agent-desktop, references/commands-interaction.md, Keyboard and Mouse]

## Windows, Chromium and sessions

[agent-desktop, references/commands-system.md]

- A launched process may have no window yet. Read the returned window and wait or activate only as the task requires. Windowless applications are not automatically failures.
- Closing one document, one window and the whole application are different operations. Observe save prompts and confirm the intended close; force termination can lose state.
- Native accessibility remains the default for already running apps, native menus and dialogs. A fresh Chromium app can expose its web contents through the documented CDP launch and an installed CDP client. Do not close a user's running app merely to obtain that path.
- A loopback DevTools port has no authentication and is accessible to local processes. Use it only for the authorized step and end the exposure with the owned app lifecycle. Keep native surfaces on the desktop tool.
- One session owns its refs and trace namespace. Pass its session ID consistently. Qualified refs do not bypass session scope; ending a session seals it.
- For notifications, list first and use the documented expected app or title fingerprint. An index alone can identify a different notification after reordering.

## Sandbox state is evidence

[agent-desktop, SKILL.md, Sandboxes; references/commands-system.md, Sandboxes]

Read the provider's `state`, `message` and next step. A successful host command or `working` result is not a running guest; wait for `running` before guest execution. A clone of a configured guest and a first installation from an OS image have different verification histories in the supplied source. Do not promote the latter's experimental status into a proven setup.

A desktop sandbox does not establish network or host isolation. The supplied macOS provider shares a virtual network through which guests can reach host services; keep its documented trust boundary. Load the installed provider guide rather than assuming another OS has the same provider. [agent-desktop, SKILL.md, Sandboxes]

## Prove it

Report the observed final application state, window or surface, actions delivered and their verification scope. Re-read the affected region after changes and confirm any document-level commit. Name incomplete observations, uncertain delivery, missing platform support and unavailable visual checks. Never substitute `ok: true`, a screenshot file's existence, a field readback or a delivery claim for the task's actual outcome. [agent-desktop, SKILL.md, The loop and Delivery and retry; references/commands-interaction.md, Read the result; references/workflows.md]
