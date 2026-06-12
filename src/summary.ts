import type { DossierState } from "./types.js";

export interface DossierSummary {
  commands: number;
  failedCommands: number;
  totalDurationMs: number;
  files: number;
  artifacts: number;
  dirtyCommands: number;
}

export function summarizeState(state: DossierState): DossierSummary {
  return {
    commands: state.commands.length,
    failedCommands: state.commands.filter((command) => command.exitCode !== 0).length,
    totalDurationMs: state.commands.reduce((total, command) => total + command.durationMs, 0),
    files: state.files.filter((file) => file.kind === "file").length,
    artifacts: state.files.filter((file) => file.kind === "artifact").length,
    dirtyCommands: state.commands.filter((command) => command.git.dirty).length
  };
}
