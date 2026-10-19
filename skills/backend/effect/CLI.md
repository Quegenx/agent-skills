# Effect CLI

Effect v4 package guidance from the shipped `LLMS.md` and `ai-docs/`. These modules remain unstable. The effect.website v4 docs have no pages for these modules. The [setup guide](SETUP.md#v4-module-paths) owns the removed beta/v3 import paths.

## CLI

[Effect v4 package, LLMS.md and ai-docs/]

- **Imports:** `import { Argument, Command, Flag } from "effect/cli"`, runtime `import { NodeRuntime, NodeServices } from "@effect/platform-node"`.
- **Flags:** `Flag.String("workspace").pipe(Flag.withAlias("w"), Flag.withDescription("Workspace to operate on"), Flag.withDefault("personal"))`, `Flag.Boolean("verbose")`, `Flag.Literals("priority", ["low", "normal", "high"])`; `Flag.optional` yields an `Option`. Define flags outside commands to reuse them.
- **Arguments:** `Argument.String("title").pipe(Argument.withDescription("Task title"), Argument.withSchema(Schema.NonEmptyString))`. Flags and arguments parse plain strings; `withSchema` (also `Flag.withSchema(Email)`) validates or transforms at parse time, so handlers only see valid input.
- **Commands:** `Command.make("create", { title, priority, assignee }, Effect.fn(function*({ assignee, priority, title }) { ... }))`, with `Command.withDescription`, `Command.withAlias("ls")`, `Command.withExamples([{ command, description }])`.
- **Share parent flags explicitly:** `Command.make("tasks").pipe(Command.withSharedFlags({ workspace, verbose }), ...)`. A subcommand reads them by yielding the parent: `const root = yield* tasks; root.verbose`.
- **Run, providing the target platform's services:**

```ts
tasks.pipe(
  Command.withSubcommands([create, list]),
  Command.run({ version: "1.0.0" }),
  Effect.provide(NodeServices.layer),
  NodeRuntime.runMain
)
```

- **Other modules:** CliConfig, CliError, CliOutput, Completions, GlobalFlag, HelpDoc, Param, Primitive, Prompt.

## Porting from v3

[Effect v4 package, LLMS.md and ai-docs/]

- **CLI:** `Options` is `Flag`, `Args` is `Argument`; `Options.all` / `Args.all` become the config record passed to `Command.make`; `CliApp` is folded into the runnable `Command` tree, with `version` passed to `Command.run`.

## Anti-patterns

[Effect v4 package, LLMS.md and ai-docs/]

- **Validating CLI input in the handler** instead of with `withSchema` at parse time.

## Prove it

[Effect v4 package, LLMS.md and ai-docs/]

CLI: input a `withSchema` rejects (an empty title) fails at parse time, before the handler runs.
