# Captured website source evidence

From [morluto/rea, docs/website-script-export.md, docs/web-source-location.md, docs/website-module-trace.md]. Use retained browser evidence to investigate shipped JavaScript. For the rendered component and animation reconstruction workflow, use [pixel-reverse-engineer](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/pixel-reverse-engineer/SKILL.md); these tools establish source relationships rather than a visual match.

## Capture the source needed

[morluto/rea, docs/website-script-export.md; docs/browser-scenario-contract.md]

- For passive `inspect_web_page`, request `include_script_sources` when source text is needed. For `capture_browser_scenario`, select `capture.network.response_body` for script-response content. Preserve the complete Evidence record or normalized capture as local JSON.
- Passive sources are Debugger-exposed text encoded as UTF-8. Scenario sources are bytes returned by Playwright's `Response.body()`, associated with a particular response event and transaction. In the pinned Chromium backend, an empty CDP body with a nonzero expected content length can trigger a credentialed follow-up load, except for fulfilled routes. The association therefore does not prove original-transaction bytes. Preserve the reported limitation. [Playwright 1.58.2 implementation](https://github.com/microsoft/playwright/blob/v1.58.2/packages/playwright-core/src/server/chromium/crNetworkManager.ts#L378)
- A retained script does not establish execution or complete website coverage. Missing selected content needs a capture with the appropriate option, not an invented source.

## Export once, then analyze

[morluto/rea, docs/website-script-export.md; src/application/WebScriptExportService.ts; src/domain/webScriptExport.ts]

- Use `export_web_scripts` with the saved `capture_path` and a caller-selected, absent `output_directory`. MCP paths are absolute. Existing destinations are refused rather than overwritten.
- Retain the original capture digest, source Evidence link, script/frame or transaction/event identities, source digests and verified manifest. Pass the returned `analysis_input` to the existing [JavaScript analysis](JAVASCRIPT.md); null means no script bytes were exportable.
- Query-free module URLs can preserve their relative layout. Competing versions, query/fragment variants, collisions, inline sources and unrepresentable paths remain isolated with stated reasons. Do not merge them into one assumed canonical version.
- Export reads saved content without fetching URLs or executing application code. Its Evidence describes a derivation from the capture; later static analysis describes the local exported artifact. Keep those identities and authorities separate.
- The local analyzer does not implement browser import maps, root-relative URL loading or remote imports. Missing dependencies and ambiguous variants stay unknown. Source maps are not fetched or reconstructed by export.

## Map one source position

[morluto/rea, docs/web-source-location.md; src/application/WebSourceLocationService.ts]

- Use `trace_web_source_location` with the exported manifest, zero-based `script_index`, an explicitly paired local source map and its absolute URL context, and a generated position. Public positions use one-based lines and zero-based UTF-16 columns.
- The map URL supplies resolution context, not permission to fetch. Manifest, selected script and map bytes are verified; their caller-selected pairing does not establish deployment authenticity or execution.
- Read every returned segment at the selected lookup position, including generated-only mappings and duplicate alternatives. A mapped point does not establish an executed range or UI causality.
- Embedded source hashes identify decoded `sourcesContent` text, not an independently captured original file. Missing embedded text and out-of-range original coordinates stay explicit. External indexed-section URLs are outside this decoder's supported profile.

## Trace native module imports

[morluto/rea, docs/website-module-trace.md; src/application/WebModuleTraceService.ts; src/domain/webModuleImports.ts]

- Use `trace_web_module_imports` for one exported script's outgoing native ES imports and re-exports. Supply the actual importer URL and, when relevant, a local import map with its base URL. An inline script's reported URL does not establish its document base.
- This route uses a caller-supplied Chromium executable supporting `import.meta.resolve`. It parses the application as data; an owned browser runs REA's trusted resolver stub. The trace does not execute the selected application or download its assets, and it does not establish an OS sandbox or browser-wide network containment.
- Literal imports receive resolved URLs or exact rejection results. Computed specifiers remain unknown; bundler module IDs are outside this native-import contract. Selecting an import map does not prove the captured page installed it.
- Keep exact URL query/fragment identities and every captured candidate. A fragment-stripped scenario response URL is a weaker content candidate. A successful resolution can have no captured target, and captured candidates are not reverified unless selected as the source.
- Preserve parser diagnostics, engine identity, source/map context and cleanup outcomes. Resolution and source-map declarations do not prove loading, module execution, worker ownership or UI causality.

## Prove it

The investigation links the original capture, exported manifest, selected bytes and derived analysis. It records unavailable scripts, conflicting versions and chosen map/import contexts. A source-map point or resolved import is reported with its inference and execution limits; neither is presented as proof of a visual match. [morluto/rea, docs/website-script-export.md; docs/web-source-location.md; docs/website-module-trace.md]
