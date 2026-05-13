export type OutputFormat = "markdown" | "json" | "html";

export interface RedactionRule {
  name: string;
  pattern: string;
  replacement?: string;
}

export interface RunDossierConfig {
  schemaVersion: 1;
  envAllowlist: string[];
  collect: {
    files: string[];
    artifacts: string[];
  };
  redactions: RedactionRule[];
  outputDir: string;
  snippetLines: number;
}

export interface GitSummary {
  head: string | null;
  branch: string | null;
  dirty: boolean;
  status: string[];
}

export interface CommandEvidence {
  id: string;
  command: string[];
  cwd: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  env: Record<string, string>;
  git: GitSummary;
}

export interface FileEvidence {
  path: string;
  kind: "file" | "artifact";
  size: number;
  sha256: string;
  modifiedAt: string;
}

export interface DossierState {
  schemaVersion: 1;
  createdAt: string;
  updatedAt: string;
  projectRoot: string;
  commands: CommandEvidence[];
  files: FileEvidence[];
}
