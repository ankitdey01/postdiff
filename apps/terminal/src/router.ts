// Static commander registration: each command is imported and registered
// explicitly. Parsing, validation, --help, and unknown-command errors are
// commander's. CLI-only: argv/console/process live here and in commands —
// never in core/.

import { Command } from "commander";
import { command as contextCommand } from "./commands/context.js";
import { command as generateCommand } from "./commands/generate.js";
import { command as preferencesCommand } from "./commands/preferences.js";
import { command as publishCommand } from "./commands/publish.js";
import { command as referenceCommand } from "./commands/reference.js";
import { command as reviewCommand } from "./commands/review.js";
import { command as setupCommand } from "./commands/setup.js";
import { command as voiceCommand } from "./commands/voice.js";

export interface CommandContext {
  cwd: string;
  /** Positional args in declaration order (variadics flattened). */
  positional: string[];
  /** Parsed option values, keyed by camelCase long flag (staged, force, ...). */
  opts: Record<string, unknown>;
}

export interface CommandArg {
  name: string;
  description: string;
  variadic?: boolean;
}

export interface CommandOption {
  /** Commander flags string, e.g. "--staged" or "--model <id>". */
  flags: string;
  description: string;
}

export interface PostdiffCommand {
  name: string;
  description: string;
  args?: CommandArg[];
  options?: CommandOption[];
  run(ctx: CommandContext): Promise<void>;
}

function argDecl(a: CommandArg): string {
  return a.variadic ? `[${a.name}...]` : `[${a.name}]`;
}

function register(program: Command, cwd: string, cmd: PostdiffCommand): void {
  const sub = program.command(cmd.name).description(cmd.description).showHelpAfterError();
  for (const a of cmd.args ?? []) sub.argument(argDecl(a), a.description);
  for (const o of cmd.options ?? []) sub.option(o.flags, o.description);
  sub.action(async (...actionArgs: unknown[]) => {
    const opts = (actionArgs[actionArgs.length - 2] ?? {}) as Record<string, unknown>;
    const positional = actionArgs.slice(0, -2).flatMap((a) => (Array.isArray(a) ? a : a === undefined ? [] : [a])) as string[];
    await cmd.run({ cwd, positional, opts });
  });
}

const ALL_COMMANDS = [contextCommand, generateCommand, preferencesCommand, publishCommand, referenceCommand, reviewCommand, setupCommand, voiceCommand];

/** Builds the program and parses argv. Commands set process.exitCode themselves. */
export async function runProgram(argv: string[], cwd: string, version: string): Promise<void> {
  const program = new Command();
  program
    .name("postdiff")
    .description("turn commits into drafts in your voice")
    .version(version)
    .showHelpAfterError()
    .allowExcessArguments()
    .action(() => {
      if (program.args.length > 0) {
        program.error(`error: unknown command '${program.args[0]}'`, { exitCode: 1 });
        return;
      }
      program.outputHelp();
    })
    .addHelpText("after", "Env: TYPESAFE_API_KEY + your provider's key (GROQ_KEY, OPENAI_API_KEY, … — env, cwd/.env, or ~/.postdiff/.env — run `postdiff setup`).");

  for (const cmd of ALL_COMMANDS) register(program, cwd, cmd);

  await program.parseAsync(argv);
}
