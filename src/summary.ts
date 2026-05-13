import type { DossierState } from "./types.js";

export interface DossierSummary {
  commands: number;
  failedCommands: number;
  files: number;
  artifacts: number;
}

export function summarizeState(state: DossierState): DossierSummary {
  return {
    commands: state.commands.length,
    failedCommands: state.commands.filter((command) => command.exitCode !== 0).length,
    files: state.files.filter((file) => file.kind === "file").length,
    artifacts: state.files.filter((file) => file.kind === "artifact").length
  };
}
