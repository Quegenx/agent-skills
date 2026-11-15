# Server tools that wrap executable work

The supplied MCP Server Design, result-review and process notes add server-side execution checks to [TOOLS.md](TOOLS.md). Apply them to the selected server and protocol version; no FastMCP implementation, subprocess helper or dependency is bundled. External contract probes belong to [debugging](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/debugging/EXTERNAL-CONTRACTS.md). [wdm0006/python-skills, mcp-server-design/SKILL.md; kajisho5/ffmpeg-skill, .claude/skills/code-review/SKILL.md; references/process-pitfalls.md]

## Keep execution, verification and errors distinct

[kajisho5/ffmpeg-skill, .claude/skills/code-review/SKILL.md, Check the claim; docs/contract.md, ToolSpec and Dry run]

A completion field describes whether the operation completed; a verification field describes the checks actually performed. Report the actual path and any fallback instead of retaining the planned mode after execution changed it. Preserve unmeasured properties and per-item failures rather than hiding them behind an aggregate success.

Generate input contracts from the executing parser or registry where practical. Keep additional capability and verification metadata in one owner, checked against actual behavior. Required capabilities describe the default invocation; conditional capabilities need their triggering flag or input. Reclassifying a requirement as optional changes the usability claim and needs the corresponding evidence. A preview should distinguish planned, measured and written work. [kajisho5/ffmpeg-skill, docs/contract.md:15-22,173-195,263-292; references/process-pitfalls.md:13-31]

The supplied Python MCP guide recommends a consistent application error dictionary. That is not by itself the MCP wire contract. In the [MCP tools specification](https://modelcontextprotocol.io/specification/2026-07-28/server/tools), tool execution errors are returned in the tool result with `isError: true`; protocol errors cover cases such as unknown tools or malformed protocol requests. Preserve actionable error text through the selected SDK's actual mapping. Do not turn an application failure into an apparently successful tool result because its body contains an error key. [wdm0006/python-skills, mcp-server-design, Error Contract; official MCP specification linked above]

## Preserve the wrapped program's evidence

[wdm0006/python-skills, mcp-server-design, Wrapping a subprocess; kajisho5/ffmpeg-skill, references/process-pitfalls.md:205-229]

- Retain the process return code, stdout and stderr. A checker may report findings through stdout and a nonzero exit with empty stderr; discarding stdout loses its result.
- Verify the installed executable's version and supported arguments before wrapping it. Use the existing [safe argument-array boundary](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/secure-coding/PARSERS.md#output-another-program-interprets), not a shell command assembled from client input.
- Check deadlines from an independently waking clock or timeout mechanism. If the only deadline check runs when progress arrives, a silently hung child never reaches it. Exercise the silent-hang path when that verification is authorized.
- Cleanup must know which output the run created. Existence after failure does not establish ownership of a pre-existing file. The source stages replacements through an owned sibling temporary file and replaces the destination only after success; preserve the original on failure.

Resource cancellation, descendant settlement and exact cleanup owners remain defined in [TOOLS.md](TOOLS.md#evidence-and-resource-ownership). A client timeout alone does not establish that its child work stopped.

## Keep the protocol responsive

[wdm0006/python-skills, mcp-server-design, No module-level global state; Keep blocking work off the protocol event loop]

Construct the server with explicit configuration and register each tool once. Import-time argument parsing and global mutable configuration can make tests depend on reimporting the module; separate registration paths can register the same tools twice.

Inspect how the selected runtime dispatches work. Do not assume synchronous tool bodies automatically run away from the protocol event loop. Move a blocking boundary according to that runtime's documented concurrency contract, retaining ownership of thread-affine connections or other resources.

Check responsiveness separately from the slow result: hold one tool at a controlled blocking boundary and require an independent lightweight request to finish before releasing it. A duration check on the slow call alone cannot establish that unrelated protocol traffic progressed.

## Treat optional client features as optional

[wdm0006/python-skills, mcp-server-design, Sampling is an optional client capability]

A working tool call does not establish client sampling support. Check the client's advertised capability before selecting that path, and handle the sampling boundary narrowly: unsupported capability, a configured handler that fails and an empty response are distinct cases to cover under the promised result contract.

The [current sampling specification](https://modelcontextprotocol.io/specification/2026-07-28/client/sampling) requires supporting clients to declare `sampling`; tool-enabled sampling additionally requires `sampling.tools`. Normalize a failed analysis into the appropriate tool execution error above, without relabeling unrelated programming errors as sampling failures. Check the selected SDK and negotiated protocol rather than assuming the source's Python helper defines the wire behavior. [official MCP sampling specification; wdm0006/python-skills, mcp-server-design, Sampling]

## Prove it

[wdm0006/python-skills, mcp-server-design, Checklist; kajisho5/ffmpeg-skill, .claude/skills/code-review/SKILL.md]

The result reflects the actual executed path, verification scope and per-item outcomes. Nonzero exits retain useful stdout and stderr; silent hangs reach the deadline; failure cleanup preserves pre-existing outputs. One registration path and explicit configuration define the server. Where applicable, independent protocol traffic progresses during blocked work and optional-client failures reach the documented error contract. Record authorized checks, actual results and unexercised boundaries; installation and tool registration alone do not establish working tools.
