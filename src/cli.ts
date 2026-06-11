#!/usr/bin/env node
import process from "node:process";
import { collectFiles } from "./collect.js";
import { initProject, loadState } from "./fs.js";
import { writeReports } from "./report.js";
import { runCommand } from "./run.js";
import { summarizeState } from "./summary.js";

const VERSION = "0.1.0";

function usage(): string {
  return `rundossier ${VERSION}\n\nUsage:\n  rundossier init\n  rundossier run -- <cmd> [args...]\n  rundossier collect\n  rundossier status\n  rundossier report\n\nLocal-first run evidence packets for handoffs.`;
}

function parseRunArgs(args: string[]): string[] {
  const sep = args.indexOf("--");
  return sep >= 0 ? args.slice(sep + 1) : args;
}

export async function main(argv = process.argv.slice(2), cwd = process.cwd()): Promise<number> {
  const [command, ...args] = argv;
  try {
    if (!command || command === "help" || command === "--help" || command === "-h") { console.log(usage()); return 0; }
    if (command === "--version" || command === "-v") { console.log(VERSION); return 0; }
    if (command === "init") { console.log(`Initialized ${await initProject(cwd)}`); return 0; }
    if (command === "run") {
      const evidence = await runCommand(cwd, parseRunArgs(args));
      console.log(`\nrundossier: recorded ${evidence.id} exit=${evidence.exitCode}`);
      return evidence.exitCode ?? 1;
    }
    if (command === "collect") { console.log(`Collected ${(await collectFiles(cwd)).length} files`); return 0; }
    if (command === "status") {
      const summary = summarizeState(await loadState(cwd));
      console.log([
        `Commands: ${summary.commands}`,
        `Failed commands: ${summary.failedCommands}`,
        `Total duration: ${summary.totalDurationMs}ms`,
        `Files: ${summary.files}`,
        `Artifacts: ${summary.artifacts}`,
        `Dirty git snapshots: ${summary.dirtyCommands}`
      ].join("\n"));
      return summary.failedCommands > 0 ? 1 : 0;
    }
    if (command === "report") { for (const output of await writeReports(cwd)) console.log(output); return 0; }
    console.error(`Unknown command: ${command}\n\n${usage()}`);
    return 2;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = await main();
}
