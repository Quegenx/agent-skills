# Agent tooling

The Flutter team ships an official agent plugin that bundles four things: agent skills (on-demand guides from the official repos), agent rules (persistent instructions, such as proactively triggering stateful hot reload), the Dart and Flutter MCP server (analyzer diagnostics, symbol resolution, test runners, runtime inspection), and specialized agents (such as the Flutter Accessibility agent). Flutter apps register with the Dart Tooling Daemon (DTD) in debug and profile mode unless started with `--no-dds`, and the MCP server's `dtd` tool discovers and connects to them. Claude Code loads the plugin's skills and MCP server but not its rules, so copy the rules into `CLAUDE.md` yourself.

**Contents:** [The six components](#the-six-components) · [Install per client](#install-per-client) · [The MCP server](#the-mcp-server) · [Connecting to a running app](#connecting-to-a-running-app) · [Tools](#tools) · [The hot reload rule](#the-hot-reload-rule) · [Exploring an app before writing tests](#exploring-an-app-before-writing-tests) · [Project rules for agents](#project-rules-for-agents) · [Docs for agents](#docs-for-agents) · [AI features inside apps](#ai-features-inside-apps) · [Widget previews](#widget-previews) · [Prove it](#prove-it)

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
| Others (Windsurf, Zed, Cline) | The generic config below | |

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

- **Cursor on older Dart** needed `--experimental-mcp-server` in `.cursor/mcp.json`; remove it on Dart 3.9.0 or later.
- **Skills only, any agent,** with the `skills` CLI into `.agents/skills`:

```bash
# Install Flutter skills
npx skills add flutter/agent-plugins --skill '*' --agent universal --yes

# Install Dart skills
npx skills add dart-lang/skills --skill '*' --agent universal --yes
```

## The MCP server

- **Status, two source statements:** the server reached stable with Dart 3.9; its README still says "WIP. This package is still experimental and is likely to evolve quickly." It requires Dart 3.9.0-163.0.dev or later and speaks stdio. Clients should support Tools and Resources, ideally Roots. [Dart MCP server](https://dart.dev/tools/mcp-server)
- **Choose tools:** `--enable` / `--disable` by tool or category, for example `"args": ["mcp-server", "--enable", "flutter_app_lifecycle"]`. Disabling beats enabling at the same level; names beat categories. `dart mcp-server --help` lists them all.
- **Run tests through it:** the `run_tests` tool says to always use it instead of `dart test` or `flutter test` shell commands.

## Connecting to a running app

- **Flutter apps** auto-register with the Dart Tooling Daemon in debug and profile mode, unless `--no-dds` is passed.
- **Dart apps** need `--observe`. `--print-dtd` prints the DTD URI. Dart 3.12 added agentic hot reload through the MCP server.
- **Rules-file text the README suggests:** "Always pass the `--print-dtd` flag to `dart` or `flutter` when spawning an application." and "For `dart` applications, always pass the `--observe` flag", for example `dart --observe --print-dtd bin/main.dart`.

## Tools

| Tool | On by default | Categories | What it does |
|---|---|---|---|
| `analyze_files` | Yes | analysis | Analyzer diagnostics |
| `create_project` | No | cli |  |
| `dart_fix` | No | cli | Runs `dart fix --apply` |
| `dart_format` | No | cli | Runs `dart format .` |
| `dtd` | Yes | dart_tooling_daemon | `listDtdUris`, `connect`, `listConnectedApps` |
| `flutter_driver_command` | Yes | flutter_driver |  |
| `get_active_location` | No | dart_tooling_daemon |  |
| `get_app_logs` | No | flutter, flutter_app_lifecycle |  |
| `get_runtime_errors` | Yes | dart_tooling_daemon |  |
| `hot_reload` | Yes | flutter | Use the `dtd` tool to discover and connect to an app proactively |
| `hot_restart` | Yes | flutter |  |
| `launch_app` | No | flutter, flutter_app_lifecycle |  |
| `list_devices` | No | flutter, flutter_app_lifecycle, cli |  |
| `list_running_apps` | No | flutter, flutter_app_lifecycle |  |
| `lsp` | Yes | analysis | hover, signatureHelp, resolveWorkspaceSymbol |
| `pub` | Yes | cli, package_deps |  |
| `pub_dev_search` | Yes | package_deps |  |
| `read_package_uris` | Yes | package_deps | `package:` and `package-root:` URIs (added 3.11) |
| `rip_grep_packages` | Yes | package_deps | Needs ripgrep |
| `roots` | Yes | None |  |
| `run_tests` | No | cli | Always use instead of `dart test` / `flutter test` |
| `stop_app` | No | flutter, flutter_app_lifecycle |  |
| `vm_service` | Yes | dart_tooling_daemon |  |
| `widget_inspector` | Yes | flutter |  |

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

## Project rules for agents

Community practice from ApparenceKit, not the Flutter team: what a Flutter project's own `CLAUDE.md`, Cursor rules and commands contain. Where it differs from the official sources, both sides are named.

### CLAUDE.md for a Flutter app

- **What it is** [ApparenceKit](https://apparencekit.dev/blog/vibe-coding-flutter-claude-code/): `CLAUDE.md` "lives at the root of your project. Claude reads it at the start of every session and treats it as binding context." The official hot reload rule still has to be copied in by hand ([The hot reload rule](#the-hot-reload-rule)).
- **What a production app's file covers** [ApparenceKit](https://apparencekit.dev/blog/vibe-coding-flutter-claude-code/): architecture (the 3-layer data / domain / presentation pattern, where each lives, what depends on what); state management (Riverpod-first, when to use `Notifier` vs `Provider`, naming conventions; see [RIVERPOD.md](RIVERPOD.md)); routing (GoRouter setup, redirect guards, transition patterns); tests (golden tests, widget tests, where mocks live, what not to mock); project gotchas, for example "Generated `freezed` files live in this folder, don't edit by hand"; commit conventions.
- **Keep it small** [ApparenceKit](https://apparencekit.dev/blog/vibe-coding-flutter-claude-code/): "Every line in it gets injected into every request." Put the detail in companion docs referenced from it (`@docs/architecture.md`, `@docs/testing.md`, `@docs/conventions.md`).
- **A living document** [ApparenceKit](https://apparencekit.dev/blog/vibe-coding-flutter-claude-code/): "Whenever you find yourself correcting the agent on the same point, add it to the rules." Plan the feature first and check the agent understood the feature and the architecture; "If it doesn't respect my architecture I have to explain or improve my rules."
- **Translations** [ApparenceKit](https://apparencekit.dev/flutter-tips/flutter-app-translations-slang-ai-guide/): keep the i18n workflow in `translations.md` under `.claude` and point to it from the general rules (Slang setup in [LOCALIZATION.md](LOCALIZATION.md#slang)):

```markdown
## Translations (Slang)
See @translations.md for i18n workflow and build commands.
```

### Cursor rules

- **A rule file** [ApparenceKit](https://apparencekit.dev/flutter-tips/how-to-create-ai-rules/), [ApparenceKit](https://apparencekit.dev/blog/flutter-cursor-ai-setup/) is markdown in `.cursor/rules/`, named for example `flutter.mdc`. It carries a description and a glob for the files it applies to, and can reference a file with `@file`. Invoke it in a prompt with "use my rules" plus `@flutter.mdc`.

```
description: Guidelines for Flutter and Dart
globs: **/*.dart

This provides ApparenceKit guidelines for generating code, corrections, and refactoring
that comply with basic principles and nomenclature.

## Dart General Guidelines
### Basic Principles
- Use English for all code and documentation.
- Always declare the type of each variable and function (parameters and return
  value).
- Variables use names that help us understand how they are used.
```

- **A suggested rule set** [ApparenceKit](https://apparencekit.dev/blog/flutter-cursor-ai-setup/): a workflow or project-description rule, and a Flutter rules file with sections Dart general guidelines, Nomenclature, Imports, Architecture and Unit tests. The workflow rule's example:

```markdown
Please think out loud and provide 
- Overview of completed work
- Rationale for decision
- next steps checklist
```

- **Nomenclature** [ApparenceKit](https://apparencekit.dev/blog/flutter-cursor-ai-setup/) (Effective Dart naming is in [dart SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/dart/SKILL.md)):

```markdown
- Use PascalCase for classes.
- Use camelCase for variables, functions, and methods.
- Use underscores_case for file and directory names.
- Avoid magic numbers and define constants.
- Start each function with a verb.
...
```

- **Architecture rule** [ApparenceKit](https://apparencekit.dev/blog/flutter-cursor-ai-setup/): the folder structure (where every file goes), the layers and their goal, a definition and a small example of each layer's files, and optionally a short "how to create a new module" example. Keep it as simple as possible: the AI "can't ingest too much data at once".
- **Unit test rule** [ApparenceKit](https://apparencekit.dev/blog/flutter-cursor-ai-setup/): explain the testing strategy. ApparenceKit pushes Fakes over Mocks and tells the agent how to work with APIs, "as unit tests don't have access to network" (fakes and mocks in [TESTING.md](TESTING.md#mocks-and-fakes)).
- **Imports, two sides.** ApparenceKit's rule [ApparenceKit](https://apparencekit.dev/blog/flutter-cursor-ai-setup/), with its claim "Without this agent will create relative imports. But Dart and Flutter team pushes for package import.":

```markdown
- always use package import even for our project files
Ex: import 'package:apparence_kit/core/data/entities/upload_result.dart';
- Comply to the always_use_package_imports rule
- Our package is named apparence_kit
- DO avoid relative imports for files in lib/
```

  Effective Dart says the opposite: "PREFER relative import paths" (https://dart.dev/effective-dart/usage; lint `prefer_relative_imports`, [dart USAGE-AND-DESIGN.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/dart/USAGE-AND-DESIGN.md)). Treat `always_use_package_imports` as a project choice, not as the Dart team's guidance.
- **Docs and reusable prompts in Cursor** (as of the article) [ApparenceKit](https://apparencekit.dev/blog/flutter-cursor-ai-setup/): Cmd+P, type "> add new doc", enter a URL, then reference it as `@MyDoc` in prompts; at the time a doc could not be referenced inside a rule. Notepads hold reusable prompts such as `Using our context @context.mdc ApparenceKit guidelines @flutter.mdc and @supabase_api.mdc create a new module that`, invoked as `@newModule [module description and specifications]`.
- **Why examples in the codebase help** [ApparenceKit](https://apparencekit.dev/blog/flutter-cursor-ai-setup/): pre-made modules and pages give the AI examples to copy, and a pre-configured project matters because "AI can't configure Xcode files".

### Claude Code workflows

All from [ApparenceKit](https://apparencekit.dev/blog/vibe-coding-flutter-claude-code/):

- **Feature:** Claude plans the change (data-layer repository, domain entity, presentation notifier and widget), creates the files, wires the route and runs the tests. The article runs `flutter test`; this skill's rule is the MCP `run_tests` tool ([The MCP server](#the-mcp-server)).
- **Refactor:** for example "The `subscription` module is leaking presentation logic into domain. Refactor it to put pure business rules in domain and move the UI state into a Riverpod notifier." Claude reads the module, identifies the boundary violations, proposes a plan and edits only after confirmation.
- **Goldens at the end of a feature:** have the agent generate golden tests across devices ("iPhone 15, Pixel 8, and a small device"), run them with `--update-goldens` and commit the baselines ([TESTING.md](TESTING.md#golden-tests)).
- **Debugging:** a prompt such as "`flutter build ipa` fails with `framework 'Flutter' not found`. The Xcode log is attached. Find the root cause, don't paper over it." The agent runs commands, reads logs and checks `Podfile.lock` (SwiftPM and CocoaPods are in [BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md#swiftpm-and-cocoapods)).
- **Reasoning-heavy tasks:** architectural decisions (for example `Notifier` vs `StateNotifier`, the offline case), multi-file refactors (an entity renamed across 14 files, three modules and a generated `freezed` class), cross-layer debugging (a golden failing only on iOS in CI: Flutter version, font fallbacks, golden generation, timezone). Claude Code's extended thinking raises the budget for these.
- **The VS Code extension** runs Claude Code in a panel while you edit and review by hand.
- **Commands**, each "a few dozen lines of Markdown" in `.claude/commands/`: `/release` (bump the pubspec version, run tests, build the archive, draft the changelog), `/golden-update` (regenerate goldens only for touched modules), `/review` (review the current diff against the rules before commit), `/translate` (find new keys in the base locale, translate them into the other locales with project terminology rules, write them to the right files, and run `dart run slang`). The agent can call a command itself at the end of a feature.

|  | Command | Skill |
| --- | --- | --- |
| Triggered by | You typing `/name` | Claude inferring relevance |
| Best for | Repeatable, well-defined procedures | Specialized knowledge for a domain |
| Example | `/release`, `/translate` | ASO writing, performance audit |
| Token cost | Cheap (loaded on call only) | Slight overhead (description always considered) |

  The article's summary: "Commands automate, skills specialize." The current Claude Code docs (https://code.claude.com/docs/en/slash-commands) say "Custom commands have been merged into skills": `.claude/commands/deploy.md` and `.claude/skills/deploy/SKILL.md` both create `/deploy`, command files are "the older format and still works", and "Prefer a skill for new work". The table reflects the older split.
- **Gotchas:** "Beyond a few hours, the context fills up with old tool calls and stale state. Start a fresh session for each meaningful task instead of one mega-session per day." Always review `git reset`, `rm`, or anything that touches `pubspec.lock` before approving.

### MCP servers for Flutter work

- **The author's set** [ApparenceKit](https://apparencekit.dev/blog/vibe-coding-flutter-claude-code/), "For a Flutter app where the bug is half client, half backend": the Supabase MCP (query dev schema and rows; [supabase WORKFLOW.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/supabase/WORKFLOW.md)) and the Sentry MCP (recent crashes and stack traces; [sentry DEBUGGING-ISSUES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/sentry/DEBUGGING-ISSUES.md)), next to the Dart and Flutter MCP server above.
- **Deslop for duplicate code** [ApparenceKit](https://apparencekit.dev/blog/deslop-duplicate-code-flutter/): use the canonical [Deslop setup and configuration](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/refactoring/DUPLICATION.md#deslop), preserving its distinction between `exclude` and `report_hide` for generated `.g.dart` and `.freezed.dart` files. The semantic reuse rule remains in [anti-slop code](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-code/RULES.md#structure).

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

## Widget previews

### Rules

- **What `@Preview` can annotate:** top-level functions, static methods in a class, or public widget constructors and factories that have no required arguments and return a `Widget` or `WidgetBuilder`.
- **Always import `package:flutter/widget_previews.dart`.**
- **Parameters:** `name`, `group`, `size`, `theme`, `brightness`.
- **Shared properties:** extend `Preview` to make a custom annotation that injects themes or wrappers.
- **Several previews of one target:** stack several `@Preview` annotations, or extend `MultiPreview`.
- **Runtime configuration:** override `transform()` in a custom `Preview` or `MultiPreview`, for example to generate names from dynamic values, "which is impossible in a `const` context".

### Limits (the previewer runs in a web environment)

- **No native plugins and no `dart:io` or `dart:ffi`.** A widget with a transitive dependency on `dart:io` or `dart:ffi` throws when invoked. Use conditional imports to mock or bypass these in preview mode.
- **Package-based asset paths.** Assets loaded through the `dart:ui` `fromAsset` APIs need `packages/my_package_name/assets/my_image.png`, not `assets/my_image.png`.
- **Callbacks must be public and constant,** because code generation requires it.
- **Unconstrained widgets get about half the viewport** by default. Set `size` on `@Preview` for explicit constraints.

### Launching

- **IDE:** in Android Studio, IntelliJ, or VS Code with Flutter 3.38+, the Widget Previewer starts automatically. Open the "Flutter Widget Preview" tab in the sidebar. To see previews outside the active file, toggle "Filter previews by selected file" at the bottom left.
- **Command line:** run `flutter widget-preview start` in the project root. Chrome opens automatically.
- **Status:** Widget Previews are stable as of Flutter 3.47, with a `.widget_preview/` cache. They first shipped in 3.35: "Flutter 3.35 brought us ... the Widget Previewer" ([ApparenceKit](https://apparencekit.dev/flutter-tips/flutter-widget-previewer-guide/)).
- **Theme caveat** ([ApparenceKit](https://apparencekit.dev/flutter-tips/flutter-widget-previewer-guide/)): the `theme` option "might not work perfectly with all custom themes right away, a great workaround is to directly embed your widget inside a `MaterialApp` with your chosen theme."
- **Iterating:** after changing global state (such as static initializers), click the global hot restart button at the bottom right. To reset one widget's local state, click the hot restart button on that preview card.

### Code

Source blocks below preserve the original code with trailing whitespace removed.

```dart
import 'package:flutter/widget_previews.dart';
import 'package:flutter/material.dart';

@Preview(name: 'My Sample Text', group: 'Typography')
Widget mySampleText() {
  return const Text('Hello, World!');
}
```
```dart
import 'package:flutter/widget_previews.dart';
import 'package:flutter/material.dart';

final class TransformativePreview extends Preview {
  const TransformativePreview({
    super.name,
    super.group,
  });

  PreviewThemeData _themeBuilder() {
    return PreviewThemeData(
      materialLight: ThemeData.light(),
      materialDark: ThemeData.dark(),
    );
  }

  @override
  Preview transform() {
    final originalPreview = super.transform();
    final builder = originalPreview.toBuilder();

    builder
      ..name = 'Transformed - ${originalPreview.name}'
      ..theme = _themeBuilder;

    return builder.toPreview();
  }
}

@TransformativePreview(name: 'Custom Themed Button')
Widget myButton() => const ElevatedButton(onPressed: null, child: Text('Click'));
```
```dart
import 'package:flutter/widget_previews.dart';
import 'package:flutter/material.dart';

/// Creates light and dark mode previews automatically.
final class MultiBrightnessPreview extends MultiPreview {
  const MultiBrightnessPreview({required this.name});

  final String name;

  @override
  List<Preview> get previews => const [
        Preview(brightness: Brightness.light),
        Preview(brightness: Brightness.dark),
      ];

  @override
  List<Preview> transform() {
    final previews = super.transform();
    return previews.map((preview) {
      final builder = preview.toBuilder()
        ..group = 'Brightness'
        ..name = '$name - ${preview.brightness!.name}';
      return builder.toPreview();
    }).toList();
  }
}

@MultiBrightnessPreview(name: 'Primary Card')
Widget cardPreview() => const Card(child: Padding(padding: EdgeInsets.all(8.0), child: Text('Content')));
```

A factory constructor as the preview target ([ApparenceKit](https://apparencekit.dev/flutter-tips/flutter-widget-previewer-guide/)):

```dart
@Preview(name: 'Primary Button Large')
factory PrimaryButton.largePreview() {
  return PrimaryButton(text: "text", onTap: () {});
}
```


## Prove it

- `claude plugin marketplace list` (or your client's equivalent) shows `flutter/agent-plugins`, and the MCP config runs `dart mcp-server`.
- `CLAUDE.md` contains the hot reload rule copied from the agent-plugins `rules/` folder.
- With the app running in debug, the `dtd` tool's `listConnectedApps` returns it; if not, check the app wasn't started with `--no-dds`.
- After editing a file under `lib/`, the agent called `hot_reload` (or `hot_restart` for `initState`, static state or `main()` changes) and `get_runtime_errors` is empty.
- Tests ran through the `run_tests` tool, not a `flutter test` shell command.
- The project's `CLAUDE.md` (or `.cursor/rules/*.mdc`) names the architecture layers, the state management choice, routing, the test strategy and the generated-file folders, and stays short enough to point to companion docs for detail.
- With Deslop configured, `deslop .` reports no cluster made of `.g.dart` or `.freezed.dart` files, and `.deslop/` is in `.gitignore`.
- **Previews:** `flutter widget-preview start` opens Chrome and every `@Preview` renders; previewed widgets have no transitive `dart:io` or `dart:ffi` dependency.
- **MCP setup:** `dart mcp-server --help` runs, and the client lists `analyze_files`.
