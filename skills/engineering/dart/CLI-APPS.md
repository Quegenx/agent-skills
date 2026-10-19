# CLI apps

Building command-line tools in Dart: the `dart` CLI itself, argument parsing with `package:args`, exit codes, output streams, signals, subprocesses, testing, and compiling and distributing binaries. Two mechanisms recur through the dart-lang CLI skill. `exit()` kills the process without unwinding the Dart stack, so buffered output, `finally` blocks, debugging and coverage are lost; set `exitCode` and let `main()` return instead. And a compiled (AOT) binary is not `dart`, so anything that assumes `Platform.resolvedExecutable` is the SDK breaks after `dart compile exe` or `dart install`. Testing in general is in [TESTING.md](TESTING.md); pubspec and dependencies in [PACKAGES.md](PACKAGES.md); native code in [FFI.md](FFI.md); Flutter apps in [flutter SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/SKILL.md).

**Contents:** [The dart command](#the-dart-command) · [Project setup](#project-setup) · [Exit codes and process lifecycle](#exit-codes-and-process-lifecycle) · [Output and diagnostics](#output-and-diagnostics) · [Argument parsing](#argument-parsing) · [Stack traces](#stack-traces) · [Subprocesses and finding the SDK](#subprocesses-and-finding-the-sdk) · [Signals and terminal teardown](#signals-and-terminal-teardown) · [Testing CLI apps](#testing-cli-apps) · [Templates](#templates) · [Running, installing and compiling](#running-installing-and-compiling) · [Changes by version](#changes-by-version) · [Audit checklist](#audit-checklist) · [Prove it](#prove-it)

## The dart command

- **Available with either SDK:** `dart` ships with the Dart SDK and with the Flutter SDK.
- **Commands:** `analyze`, `build`, `compile`, `create`, `devtools`, `doc`, `fix`, `format`, `info`, `pub`, `run`, `test` (plus `install`, `uninstall`, `installed` since 3.10). `dart <DART_FILE>` works, but prefer `dart run`. Help: `dart help <command>`, for example `dart help pub outdated`.
- **A typical loop:** `dart create -t console my_app`, `cd my_app`, `dart analyze`, `dart test`, `dart run bin/my_app.dart`; `dart pub get|outdated|upgrade`.
- **`dart info`** prints diagnostics on the tooling, running Dart processes and (in a package directory) the project; `--no-remove-file-paths` includes paths. Review it before posting publicly in a bug report.

## Project setup

- **Scaffold:** `dart create -t console <package_name>` (creates `bin/` and `lib/`). Templates via `-t`: `cli` (uses package:args), `console` (default), `package`, `server-shelf`, `web`. It runs `pub get` unless `--no-pub`; `--force` if the directory exists.
- **Always declare `executables:`** in pubspec.yaml. It enables `dart run <command>` and the global symlinks for `dart install`.

```yaml
name: my_cli
description: High-performance CLI tool.
version: 1.0.0

executables:
  my_cli: # Maps to bin/my_cli.dart
  secondary_cmd: helper # Maps to bin/helper.dart
```

- **Don't hardcode `--version`:** `package:build_version` generates `lib/src/version.dart` containing `const packageVersion = 'x.y.z';` from pubspec.yaml.
- **Cache:** transient cache in `.dart_tool/<package_name>/`; never persistent cache files in the project root.
- **Keep `bin/*.dart` a thin trampoline** (create the runner, pass args, await the exit code) and put commands, parsers, formatters and business logic in `lib/src/`. Code in `bin/` can't be cleanly imported through `package:` URIs; in `lib/src/` the whole runner can be unit-tested in memory in milliseconds without spawning subprocesses (the skill says `< 2ms` in one place and `< 5ms` in another).

```dart
// bin/my_cli.dart: Thin entrypoint trampoline
import 'dart:io';
import 'package:my_cli/src/cli.dart';

Future<void> main(List<String> args) async {
  exitCode = await runCli(args);
}
```

## Exit codes and process lifecycle

`exit(int code)` from `dart:io` calls `Platform::Exit(code)` in the C++ runtime and ends the OS process without unwinding the Dart stack. The consequences:

| Lost | Why |
|---|---|
| Debugging | With `--pause-isolates-on-exit` the VM Service can't pause or inspect |
| Coverage | `package:coverage` queries the VM Service in the paused-on-exit state; `exit()` yields 0% coverage |
| Output | `stdout` and `stderr` are buffered async `IOSink` streams; unflushed bytes are dropped |
| Cleanup | `finally` blocks are bypassed (resource leaks) |

- **Rule:** avoid `exit(code)` in normal execution. Set `exitCode = code`, or return an int from `CommandRunner<int>`, and let async `main()` return. Don't call `exit()` on unhandled errors either: throw, so the runtime unwinds and exits non-zero.
- **Exceptions in the skill's own reference code:** a SIGINT handler that calls `exit(130)` and a broken-pipe handler that calls `exit(0)` to stop a bulk-streaming producer loop (both below).

| Code | Meaning | `sysexits.h` | `package:io` |
|---|---|---|---|
| `0` | Success | `EX_OK` | `ExitCode.success.code` |
| `64` | Usage error | `EX_USAGE` | `ExitCode.usage.code` |
| `65` | Data format error | `EX_DATAERR` | `ExitCode.data.code` |
| `70` | Internal software crash | `EX_SOFTWARE` | `ExitCode.software.code` |
| `78` | Configuration error | `EX_CONFIG` | `ExitCode.config.code` |
| `130` | Interrupted by SIGINT (128 + 2) | | |

- **Prefer `package:io/io.dart` `ExitCode` constants** over magic integers; minimal standalone scripts without dependencies may use literal `0`, `64`, `70`.

```dart
import 'dart:io';
import 'package:args/command_runner.dart';
import 'package:io/io.dart' show ExitCode; // Provides standard POSIX ExitCode constants

Future<void> main(List<String> args) async {
  final runner = CommandRunner<int>('tool', 'CLI tool description.');
  try {
    final status = await runner.run(args);
    exitCode = status ?? ExitCode.success.code;
  } on UsageException catch (e) {
    stderr
      ..writeln(e.message)
      ..writeln(e.usage);
    exitCode = ExitCode.usage.code;
  }
}
```

## Output and diagnostics

- **Results and machine-readable data go to `stdout` only;** warnings, errors and debug logs to `stderr` only. With `--json` or `--machine`, JSON data goes to `stdout` and logs to `stderr`.
- **Usage errors:** on `FormatException`, `UsageException` or `ArgumentError` (thrown when reading a missing `mandatory: true` option through `results.option(...)`), write both the error message and the usage text to `stderr` and return exit code `64`. Usage goes to `stdout` only on an explicit `--help`/`-h`.
- **No `print()` in error handlers** (`print()` writes to `stdout`); use `stderr.writeln()`. For normal output prefer `stdout.writeln()` over `print()` to satisfy the `avoid_print` lint, unless `analysis_options.yaml` sets `avoid_print: false`.
- **Check before emitting color or cursor codes:**

```dart
bool get useAnsi =>
    stdout.hasTerminal &&
    stdout.supportsAnsiEscapes &&
    !Platform.environment.containsKey('NO_COLOR');
```

## Argument parsing

- **Simple scripts:** `ArgParser` with `addFlag()` and `addOption()`. **Several commands:** `CommandRunner<int>` with one `Command<int>` per subcommand, each returning a POSIX exit code.
- **Type-safe accessors** (package:args 2.5+): `results.flag('name')`, `results.option('name')`, `results.multiOption('name')`, instead of `operator []` with casts.
- **Large option sets:** `package:build_cli` generates typed options classes; named default overrides (for example `{String? hostDefaultOverride}`) merge config files with flags.

## Stack traces

Avoid `Chain.capture()`: the VM already preserves async frames across `await`, and `Chain.capture` wraps the event loop in Zones (allocation overhead, traps errors across Zone boundaries). Use `Trace.from(st).terse` from `package:stack_trace`.

```dart
import 'dart:io';
import 'package:io/io.dart' show ExitCode;
import 'package:stack_trace/stack_trace.dart';

Future<void> runMain(List<String> args) async {
  try {
    await executeLogic(args);
    exitCode = ExitCode.success.code;
  } catch (e, st) {
    stderr.writeln('Fatal error: $e');
    if (args.contains('-v') || args.contains('--verbose')) {
      stderr.writeln(Trace.from(st).terse);
    }
    exitCode = ExitCode.software.code;
  }
}
```

## Subprocesses and finding the SDK

- **Don't assume `Platform.resolvedExecutable` or `Platform.executable` is `dart`.** Under JIT (`dart run`, `pub global activate`) it is `<dart-sdk>/bin/dart`; in an AOT binary (`dart install`, `dart compile exe`) it is the app binary (for example `~/.dart/install/app-bundles/my_cli/.../bin/my_cli`). The results: a recursive subprocess loop, crashes on rejected flags (`--observe`, `--enable-vm-service`, `run`, `format`, `test`), and a broken SDK root (for example a failed `libraries.json` lookup).
- **The broken pattern,** as the source's reference labels it (the emoji before WRONG removed):

```dart
// WRONG: Breaks when compiled to AOT
final dart = Platform.resolvedExecutable;
final sdkDir = path.dirname(path.dirname(dart));
```

- **Use `package:cli_util` `^0.6.0`:** its memoized nullable getters `dartExecutable` and `sdkPath` work under JIT and AOT. Don't write bespoke probes; it searches the running VM (under JIT), `DART_SDK`, the system `PATH` (`dart`, `dart.exe`, `dart.bat`, symlinks dereferenced, `bin/cache/dart-sdk` for Flutter) and `FLUTTER_ROOT/bin/cache/dart-sdk`.

```dart
import 'dart:io' as io;
import 'package:cli_util/cli_util.dart' as cli_util;

Future<void> runSubprocess() async {
  // Resolves the dart executable across both JIT and AOT environments
  final dartExe = cli_util.dartExecutable;
  if (dartExe == null) {
    io.stderr.writeln('Error: Could not locate the Dart SDK on PATH.');
    io.exitCode = 1;
    return;
  }

  final result = await io.Process.run(dartExe, ['format', '.']);
  io.stdout.write(result.stdout);
  io.stderr.write(result.stderr);
}
```

- **Fallback:** `Process.start('dart', [...], runInShell: Platform.isWindows)`. On Windows, Flutter installs `dart.bat` in `flutter/bin`, and starting a batch file through `Process.start` needs `runInShell: true` unless you point at `dart.exe`.
- **macOS process spawning (3.14, unreleased):** it moves to `posix_spawn`, resolving `PATH` with the parent's `PATH`; use absolute executable paths.

## Signals and terminal teardown

- **`ProcessSignal.sigterm.watch()` throws `UnsupportedError` on Windows;** guard with `if (!Platform.isWindows)`.

```dart
import 'dart:async';
import 'dart:io';
import 'package:async/async.dart';

/// Listens for process termination signals across Windows, macOS, and Linux.
Stream<ProcessSignal> watchTerminationSignals() {
  if (Platform.isWindows) {
    return ProcessSignal.sigint.watch();
  }
  return StreamGroup.merge([
    ProcessSignal.sigint.watch(),
    ProcessSignal.sigterm.watch(),
  ]);
}
```

- **Raw terminal mode:** before setting `stdin.echoMode = false` or `stdin.lineMode = false`, check `if (!stdin.hasTerminal) return;`, and restore in both a SIGINT listener and `finally`; otherwise the shell stays raw and keystrokes are invisible.

```dart
import 'dart:io';

void enableInteractiveMode() {
  // Defensive guard: only configure terminal modes if standard input is an interactive TTY.
  if (!stdin.hasTerminal) return;
  stdin.echoMode = false;
  stdin.lineMode = false;

  // Ensure terminal state is synchronously restored on Ctrl+C.
  final sub = ProcessSignal.sigint.watch().listen((_) {
    restoreTerminal();
    // Exiting with 128 + SIGINT (2) = 130 is the standard POSIX protocol
    // for asynchronous signal handlers to communicate signal interruption to the host shell.
    exit(130);
  });

  try {
    // Run interactive loop...
  } finally {
    sub.cancel();
    restoreTerminal();
  }
}

void restoreTerminal() {
  if (stdin.hasTerminal) {
    stdin.lineMode = true;
    stdin.echoMode = true;
  }
}
```

- **Cursor:** a hidden cursor (`\x1B[?25l`) must be restored with `\x1B[?25h` in `finally` and in signal handlers (write it only `if (useAnsi)`).
- **Servers and children:** on termination signals close `HttpServer` and `ServerSocket` with `server.close(force: true)` so the OS releases the ports, and forward signals to long-running children (`childProcess.kill(ProcessSignal.sigterm)`) so they aren't orphaned.
- **Broken pipe:** piping into `head -n 5` or `grep -q foo` makes `stdout` writes throw `SocketException: Broken pipe (errno = 32)`.

```dart
import 'dart:io';

Future<void> safeWriteln(String line) async {
  try {
    stdout.writeln(line);
  } on SocketException catch (e) {
    // EPIPE / Broken pipe: downstream closed standard input.
    if (e.osError?.errorCode == 32 || e.message.contains('Broken pipe')) {
      await stdout.close().catchError((_) {});
      // In a bulk streaming context, calling exit(0) immediately stops the
      // producer loop when downstream has closed its pipe.
      exit(0);
    }
    rethrow;
  }
}
```

## Testing CLI apps

Two layers: unit tests in memory that import `package:<pkg>/src/...` from `test/`, and integration tests of the real process with `package:test_process` and `package:test_descriptor`.

```dart
import 'package:test/test.dart';
import 'package:test_descriptor/test_descriptor.dart' as d;
import 'package:test_process/test_process.dart';

void main() {
  test('CLI processes input and exits cleanly', () async {
    await d.file('input.txt', 'hello').create();

    final process = await TestProcess.start('dart', [
      'run',
      'bin/my_cli.dart',
      '--input',
      d.path('input.txt'),
    ]);

    await expectLater(process.stdout, emitsThrough('Processing complete.'));
    await process.shouldExit(0);
  });
}
```

## Templates

Single command:

```dart
import 'dart:io';

import 'package:args/args.dart';
import 'package:io/io.dart' show ExitCode;
import 'package:stack_trace/stack_trace.dart';

Future<void> main(List<String> args) async {
  final parser = ArgParser()
    ..addFlag(
      'help',
      abbr: 'h',
      negatable: false,
      help: 'Show usage information.',
    )
    ..addFlag(
      'verbose',
      abbr: 'v',
      negatable: false,
      help: 'Show detailed stack traces on fatal error.',
    )
    ..addOption(
      'input',
      abbr: 'i',
      mandatory: true,
      help: 'Path to the input file to process.',
    );

  try {
    final results = parser.parse(args);

    if (results.flag('help')) {
      // Explicit help requested by user: write usage to stdout.
      stdout
        ..writeln('Usage: tool [options]')
        ..writeln(parser.usage);
      return;
    }

    await _runTool(results);
  } on FormatException catch (e) {
    // Argument parse error: write error message AND usage to stderr.
    stderr
      ..writeln('Error: ${e.message}')
      ..writeln(parser.usage);
    exitCode = ExitCode.usage.code;
  } on ArgumentError catch (e) {
    // Missing mandatory option error thrown by results.option():
    stderr
      ..writeln('Error: ${e.message}')
      ..writeln(parser.usage);
    exitCode = ExitCode.usage.code;
  } catch (e, st) {
    stderr.writeln('Fatal error: $e');
    if (args.contains('-v') || args.contains('--verbose')) {
      stderr.writeln(Trace.from(st).terse);
    }
    exitCode = ExitCode.software.code;
  }
}

/// Encapsulates the tool's core business logic.
///
/// In larger applications, place this logic in `lib/src/` rather than
/// directly in `bin/` so unit tests can import and test functions directly
/// without needing to spawn an OS subprocess.
Future<void> _runTool(ArgResults args) async {
  final inputPath = args.option('input')!;
  stdout.writeln('Processing $inputPath...');
}
```

Several commands:

```dart
import 'dart:io';

import 'package:args/args.dart';
import 'package:args/command_runner.dart';
import 'package:io/io.dart' show ExitCode;
import 'package:stack_trace/stack_trace.dart';

Future<void> main(List<String> args) async {
  final runner = ToolCommandRunner();

  try {
    final status = await runner.run(args);
    exitCode = status ?? ExitCode.success.code;
  } on UsageException catch (e) {
    // Usage errors (invalid flags/arguments) must write to stderr.
    stderr
      ..writeln(e.message)
      ..writeln(e.usage);
    exitCode = ExitCode.usage.code;
  } catch (e, st) {
    stderr.writeln('Fatal error: $e');
    if (args.contains('-v') || args.contains('--verbose')) {
      stderr.writeln(Trace.from(st).terse);
    }
    exitCode = ExitCode.software.code;
  }
}

class ToolCommandRunner extends CommandRunner<int> {
  ToolCommandRunner() : super('tool', 'Multi-command production CLI utility.') {
    argParser
      ..addFlag(
        'verbose',
        abbr: 'v',
        negatable: false,
        help: 'Show verbose stack traces on failure.',
      )
      ..addFlag('version', negatable: false, help: 'Print tool version.');

    addCommand(ProcessCommand());
  }

  @override
  Future<int?> runCommand(ArgResults topLevelResults) async {
    if (topLevelResults.flag('version')) {
      // In production, reference packageVersion from generated lib/src/version.dart (via package:build_version).
      stdout.writeln('tool version 1.0.0');
      return ExitCode.success.code;
    }
    return super.runCommand(topLevelResults);
  }
}

class ProcessCommand extends Command<int> {
  @override
  final String name = 'process';

  @override
  final String description = 'Process input files.';

  ProcessCommand() {
    argParser.addOption(
      'input',
      abbr: 'i',
      mandatory: true,
      help: 'Path to input file.',
    );
  }

  @override
  Future<int> run() async {
    final input = argResults!.option('input')!;
    stdout.writeln('Processing $input...');
    return ExitCode.success.code;
  }
}
```

## Running, installing and compiling

**Run:**

- **`dart run [options] [<DART_FILE> | <PACKAGE_TARGET>] [args]`.** Plain `dart run` runs `bin/<package>.dart` of the current package; `dart run :baz` runs `bin/baz.dart`; `dart run bar` or `dart run bar:baz` runs from a dependency (only its `bin/` is visible); `dart run tool/debug.dart arg1 arg2`. Debug with `--enable-asserts` and `--observe` (DevTools). `dart run` uses JIT, so nothing needs compiling first.
- **One-off remote tools (Dart 3.12+):** `dart run dhttpd@`, syntax `dart run <PACKAGE>[:<EXECUTABLE>]@[<DESCRIPTOR>] [args]`, downloads and runs without adding a dependency (for example `dart run <package>@<version> [args]`).

**Install** (Dart 3.10+; the dart-lang CLI skill says 3.12+ standardizes on `dart run` and `dart install` over `dart pub global activate`):

- `dart install markdown`, `dart install markdown 0.6.0`, `dart install foo <3.0.0`; from Git: `dart install https://github.com/dart-lang/http.git --git-path pkgs/http/ --git-ref <sha>`; `--overwrite`, `-u/--hosted-url`. It builds a native AOT binary into `~/.dart/install/bin/`. Remove with `dart uninstall <package>`; list with `dart installed`.

**Build with hooks (`dart build`, Dart 3.10+):**

- **If the package or any dependency has build hooks, you must use `dart build`.** `dart compile exe` and `aot-snapshot` don't run hooks and fail when hooks are present.
- **`dart build cli`** runs the build hooks of the project and its dependencies, compiles or downloads code assets and bundles them: `bundle/bin/<compiled_executable>` and `bundle/lib/<dynamic_libraries>`. Options: `-o`/`--output` (default `build/cli/_/`), `-t`/`--target` (a Dart file in `bin/`; defaults to the only one), `--verbosity=error|warning|info|all`, and `--target-os`/`--target-arch` (3.13). The FFI skill's verification step instead inspects `build/cli/lib/libsqlite3.dylib` after `dart build cli bin/main.dart`; check the actual output path.

**Compile (`dart compile`):**

| Subcommand | Produces | Run with |
|---|---|---|
| `exe` | Self-contained executable with a small Dart runtime; signing supported on macOS and Windows | The file itself: `dart compile exe bin/cli.dart -o <output_path>` |
| `aot-snapshot` | AOT module without a runtime | `dartaotruntime bin/myapp.aot` |
| `jit-snapshot` | Snapshot from a training run | `dart run bin/myapp.jit` |
| `kernel` | Portable `.dill`; slower startup than AOT | `dart run bin/myapp.dill` |
| `js` | `.js` plus `.js.map` | |
| `wasm` | `.wasm`, `.mjs`, `.wasm.map` | |

- **Output path:** `-o`/`--output`.
- **Cross-compilation** targets Linux only (`--target-os=linux`, `--target-arch=arm|arm64|riscv64|x64`) from Linux, macOS or Windows hosts: ARM64 and x64 since Dart 3.8, ARM and RISCV64 since 3.9. Binaries download and cache in `~/.dart`.
- **Limitations of compiled executables:** no `dart:mirrors`, no `dart:developer`.
- **JS:** prefer `webdev build` and `webdev serve`; otherwise `dart compile js -O2 -o out/main.js web/main.dart`. For production avoid `Function.apply()`, overriding `noSuchMethod()` and setting variables to null, and keep argument types consistent; tree shaking removes unused code.
- **Wasm:** `dart compile wasm -O2 -o site/main.wasm web/main.dart`. `-O1` is the default; `-O2` adds minification; `-O3` omits implicit type checks; `-O4` adds more aggressive unsafe optimizations. Flags: `--[no-]minify`, `--[no-]strip-wasm` (default on; `--no-strip-wasm` for readable stack traces), `--[no-]source-maps` (default on), `--[no-]enable-deferred-loading` (preview in 3.13), `--standalone` (no JS runtime, disallows `dart:js_interop`), `-D<key>=<value>`.

## Changes by version

| Version (date) | Change |
|---|---|
| 3.13 (2026-08-12) | `dart build cli` supports `--target-os`/`--target-arch`; Wasm deferred loading preview; built-in fallback root certificates removed (use `--root-certs-file`/`--root-certs-cache`) |
| 3.13.3 (2026-09-01) | Fix for Windows to Linux cross-compilation with link hooks |
| 3.12 (2026-05-18) | `dart run <package>@` for remote executables |
| 3.10 (2025-11-12) | `dart build`, `dart install`; build hooks stable; the `dart` CLI and the VM are separate executables (`dartvm`) and subcommands run AOT snapshots; IA32 removed |
| 3.9 (2025-08-13) | `dart build -f exe <target>` became `dart build cli --target=<target>`; cross-compilation to Linux `arm` and `riscv64`; 32-bit x86 deprecated |
| 3.8 (2025-05-20) | Linux ARM64 and x64 cross-compilation |

## Audit checklist

- Declare entry points in `pubspec.yaml` under `executables:`.
- Keep `bin/*.dart` as a thin entrypoint; place command logic in `lib/src/`.
- Return integer exit codes or set `exitCode = N`; avoid raw `exit(N)`.
- Direct errors, warnings, and usage on parse failure to `stderr`.
- Use `results.flag()`, `results.option()`, and `results.multiOption()` for type safety.
- Validate `useAnsi` (checking `stdout.hasTerminal`, `supportsAnsiEscapes`, and `NO_COLOR`) before emitting ANSI codes.
- Spawn child tools using `cli_util.dartExecutable`, never `Platform.resolvedExecutable`.
- Unit-test command runners in-memory; test end-to-end binary execution with `test_process`.

## Prove it

- **Bad arguments:** running the tool with an unknown flag prints the error and usage to `stderr`, nothing to `stdout`, and exits `64` (`echo $?`).
- **`--help`** prints usage to `stdout` and exits `0`.
- **Pipes:** `my_cli ... | head -n 5` ends without a `SocketException`.
- **`NO_COLOR=1 my_cli ...`** and output redirected to a file contain no escape codes.
- **Ctrl+C** in interactive mode leaves the terminal echoing and the cursor visible, and the exit status is `130`.
- **Compiled:** after `dart compile exe` (or `dart build cli` when hooks exist), the binary runs every subcommand that spawns `dart` without recursing into itself.
- **Coverage** of the runner is above 0% (it doesn't call `exit()` on the normal path), and `test_process` integration tests pass.
