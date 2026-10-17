# Agent tooling

The Flutter team ships an official agent plugin that bundles four things: agent skills (on-demand guides from the official repos), agent rules (persistent instructions, such as proactively triggering stateful hot reload), the Dart and Flutter MCP server (analyzer diagnostics, symbol resolution, test runners, runtime inspection), and specialized agents (such as the Flutter Accessibility agent). Flutter apps register with the Dart Tooling Daemon (DTD) in debug and profile mode unless started with `--no-dds`, and the MCP server's `dtd` tool discovers and connects to them. Claude Code loads the plugin's skills and MCP server but not its rules, so copy the rules into `CLAUDE.md` yourself.

**Contents:** [The six components](#the-six-components) · [Install per client](#install-per-client) · [The MCP server](#the-mcp-server) · [Connecting to a running app](#connecting-to-a-running-app) · [Tools](#tools) · [The hot reload rule](#the-hot-reload-rule) · [Exploring an app before writing tests](#exploring-an-app-before-writing-tests) · [Docs for agents](#docs-for-agents) · [AI features inside apps](#ai-features-inside-apps) · [Prove it](#prove-it)

## The six components

| Component | Use for |
|---|---|
| Agent skills | On-demand multi-step recipes. Progressive disclosure: discovery reads only name and description from `.agents/skills`; execution loads `SKILL.md` and its references. Repos: flutter/agent-plugins (widget construction, declarative navigation, responsive design, state management) and dart-lang/skills (unit tests, dependency resolution, static analysis) |
| Dart and Flutter MCP server | Local diagnostics, tests and runtime: static analysis, symbol resolution, runtime introspection, package management (pub.dev search, pubspec), testing and formatting |
| Developer Knowledge MCP server | Live docs: cloud search over docs.flutter.dev, dart.dev and the API references (https://developers.google.com/knowledge/mcp) |
| Package skills | Library APIs and codegen shipped by pub.dev packages: `dart run skills@ get`; ship your own via https://dart.dev/tools/pub/package-skills |
| Specialized agents | Isolated subagents, such as accessibility audits |
| Agent rules | Persistent project conventions |

- **Flutter Accessibility agent** (Antigravity only): checks missing semantic labels on `IconButton`/`InkWell`, touch targets under 48x48 logical pixels, contrast and focus indicators, and proposes `Semantics` fixes. Invoke with `@flutter_a11y_agent Audit this screen for accessibility issues.`
- **Skills in the official repo** include dart-add-unit-test, dart-build-cli-app, dart-collect-coverage, dart-fix-runtime-errors, dart-generate-test-mocks, dart-migrate-to-checks-package, dart-resolve-package-conflicts, dart-run-static-analysis, dart-setup-ffi-assets, dart-use-doc-examples, dart-use-ffigen, dart-use-path-package, dart-use-pattern-matching, dart-use-primary-constructors, dart-write-documentation, flutter-add-integration-test, flutter-add-widget-preview, flutter-add-widget-test, flutter-apply-architecture-best-practices, flutter-build-responsive-layout, flutter-fix-layout-issues, flutter-implement-json-serialization, flutter-setup-declarative-routing, flutter-setup-localization, flutter-use-http-package.
- **Since 3.44:** Agentic Hot Reload (the MCP server and coding agents automatically find and connect to running Dart and Flutter apps, with zero configuration since DTD exposes the connection details), hardened dependency search, and consolidated MCP tools that significantly reduce token costs. In 3.47 the docs renamed "skills" to agent-plugins and added an experimental AI Evaluations page (https://docs.flutter.dev/ai/evals).

## Install per client

| Client | Install | Rules go in |
|---|---|---|
| Claude Code | `claude plugin marketplace add flutter/agent-plugins`, then `claude plugin install dart-flutter@dart-flutter`; verify with `claude plugin marketplace list` | `CLAUDE.md` (copy from https://github.com/flutter/agent-plugins/tree/main/rules; plugin rules don't load automatically) |
| Cursor | Marketplace "Dart and Flutter" (https://cursor.com/marketplace/flutter) or `/add-plugin dart-flutter` | `.mdc` files in `.cursor/rules/` |
| Codex | `codex plugin marketplace add flutter/agent-plugins`, then `codex plugin add dart-flutter@dart-flutter`; verify with `codex plugin list` | `.agent/rules/` or `CODEX.md` |
| Antigravity IDE | Settings > Customizations > Build with Google Plugins > Customize > Download "Dart and Flutter" | |
| Antigravity CLI (`agy`) | MCP config in `.agents/mcp_config.json` (or `~/.gemini/config/mcp_config.json`) | |
| GitHub Copilot (VS Code) | `.vscode/mcp.json` with `{"servers": {"dart": {"command": "dart", "args": ["mcp-server"]}}}`, or the user setting `"dart.mcpServer": true` (Dart-Code v3.114+) | `.github/copilot-instructions.md` |
| Gemini CLI | `.gemini/settings.json` `mcpServers` entry `dart` running `dart mcp-server` | |

- **Generic MCP config** for any client:

```json
{
  "mcpServers": {
    "dart": {
      "command": "dart",
      "args": ["mcp-server"]
    }
  }
}
```

- **Cursor on older Dart** needed `--experimental-mcp-server` in `.cursor/mcp.json`.
- **Skills only, any agent,** with the `skills` CLI into `.agents/skills`:

```bash
# Install Flutter skills
npx skills add flutter/agent-plugins --skill '*' --agent universal --yes

# Install Dart skills
npx skills add dart-lang/skills --skill '*' --agent universal --yes
```

## The MCP server

- **Status:** work in progress and experimental. It requires Dart 3.9.0-163.0.dev or later and speaks stdio. Clients should support Tools and Resources, ideally Roots.
- **Choose tools:** `--enable` / `--disable` by tool or category, for example `"args": ["mcp-server", "--enable", "flutter_app_lifecycle"]`. `dart mcp-server --help` lists them all.
- **Run tests through it:** the `run_tests` tool says to always use it instead of `dart test` or `flutter test` shell commands.

## Connecting to a running app

- **Flutter apps** auto-register with the Dart Tooling Daemon in debug and profile mode, unless `--no-dds` is passed.
- **Dart apps** need `--observe`. `--print-dtd` prints the DTD URI.
- **Rules-file text the README suggests:** "Always pass the `--print-dtd` flag to `dart` or `flutter` when spawning an application." and "For `dart` applications, always pass the `--observe` flag", for example `dart --observe --print-dtd bin/main.dart`.

## Tools

| Tool | On by default | What it does |
|---|---|---|
| `analyze_files` | Yes | |
| `create_project` | No | |
| `dart_fix` | No | |
| `dart_format` | No | |
| `dtd` | Yes | `listDtdUris`, `connect`, `listConnectedApps` |
| `flutter_driver_command` | Yes | |
| `get_active_location` | No | |
| `get_app_logs` | No | |
| `get_runtime_errors` | Yes | |
| `hot_reload` | Yes | Use the `dtd` tool to discover and connect to an app proactively |
| `hot_restart` | Yes | |
| `launch_app` | No | |
| `list_devices` | No | |
| `list_running_apps` | No | |
| `lsp` | Yes | hover, signatureHelp, resolveWorkspaceSymbol |
| `pub` | Yes | |
| `pub_dev_search` | Yes | |
| `read_package_uris` | Yes | `package:` and `package-root:` URIs |
| `rip_grep_packages` | Yes | Needs ripgrep |
| `roots` | Yes | |
| `run_tests` | No | Always use instead of `dart test` / `flutter test` |
| `stop_app` | No | |
| `vm_service` | Yes | |
| `widget_inspector` | Yes | |

## The hot reload rule

The official rule `flutter-hot-reload.md` (also as `.mdc`) in https://github.com/flutter/agent-plugins/tree/main/rules has this front matter: `description: Proactively connect to running Dart/Flutter apps and trigger hot reload or hot restart upon editing .dart files under lib/.`, `trigger: glob`, `globs: "**/lib/**/*.dart"`.

- **Skip** files outside `lib/` (`test/**`, `integration_test/**`, `benchmark/**`, `test_driver/**`, `example/**`) and edits that only touch comments or whitespace.
- **Discover apps** with the `dtd` MCP tool (or `list_running_apps` / `vm_service`).
- **`hot_reload`** after UI, build-method or simple method changes.
- **`hot_restart`** when `initState`, global or static state, or `main()` changed.
- **A launch image change** needs hot restart, not hot reload, to show ([BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md#ios-release)).

## Exploring an app before writing tests

The Flutter team's integration-test skill explores the live app through the MCP server before writing static tests. The app's entry point (for example `lib/main_test.dart`) must call `enableFlutterDriverExtension();` before `runApp()` (setup in [TESTING.md](TESTING.md#integration-tests)).

1. `launch_app` with `target: "lib/main_test.dart"` starts the app and gets the DTD URI.
2. `get_widget_tree` lists the available `Key`s, `Text` nodes and widget `Type`s.
3. `tap`, `enter_text` and `scroll` simulate user flows.
4. Always run `waitFor` or check state with `get_health` when navigating or triggering animations.
5. A widget missing from the tree may be lazy-loaded in a `SliverList` or `ListView`: `scroll` or `scrollIntoView` forces it to mount.
6. Write the static test in `integration_test/` and re-run until it passes.

## Docs for agents

- **Every docs.flutter.dev page is available as markdown** at `<page-url>.md` (served as `text/markdown`).
- **https://docs.flutter.dev/llms.txt** is a curated list of resources for language models. Its "Latest release" section was stale at 3.44 / Dart 3.12 when 3.47 was current; check versions in [VERSIONS.md](VERSIONS.md).

## AI features inside apps

- **Keep API keys out of the app:** the Firebase AI Logic SDK (`firebase_ai`) keeps the keys out of your code, and its Server Prompt Templates remove the need to embed prompts in the app.
- **Guardrails:** when AI writes code, check it with the Flutter analyzer and unit tests. When AI powers a feature, let the user verify and correct AI-generated data ("bad data leads to bad results"); eventually a model will fail to do the thing that must be done.
- **Other official options:** the GenUI SDK for Flutter (https://docs.flutter.dev/ai/genui) and Genkit Dart (preview, model-agnostic across Google, Anthropic and OpenAI; https://genkit.dev/docs/dart/overview).

```dart
import 'package:genkit/genkit.dart';
import 'package:genkit_google_genai/genkit_google_genai.dart';

void main() async {
 final ai = Genkit(plugins: [googleAI()]);

 final response = await ai.generate(
 model: googleAI.gemini('gemini-flash-latest'),
 prompt: 'Why is Dart a great language for AI applications?',
 );

 print(response.text);
}
```

## Prove it

- `claude plugin marketplace list` (or your client's equivalent) shows `flutter/agent-plugins`, and the MCP config runs `dart mcp-server`.
- `CLAUDE.md` contains the hot reload rule copied from the agent-plugins `rules/` folder.
- With the app running in debug, the `dtd` tool's `listConnectedApps` returns it; if not, check the app wasn't started with `--no-dds`.
- After editing a file under `lib/`, the agent called `hot_reload` (or `hot_restart` for `initState`, static state or `main()` changes) and `get_runtime_errors` is empty.
- Tests ran through the `run_tests` tool, not a `flutter test` shell command.
