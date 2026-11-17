import type { CommandEvidence, DossierState } from "./types.js";

export interface GitHubSummary {
  title: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  cancelled: number;
  reportedAt: string;
}

/** Parse the stable section headings emitted by GitHub Actions job summaries. */
export function parseGitHubSummary(markdown: string): GitHubSummary {
  if (typeof markdown !== "string" || !markdown.trim()) throw new Error("Invalid GitHub Actions summary: empty input");
  const heading = markdown.match(/^##\s+(.+?)\s*$/m);
  const value = (label: string): number => {
    const match = markdown.match(new RegExp(`^\\s*(?:[-*]\\s*)?${label}\\s*:\\s*([\\d,]+)\\s*$`, "im"));
    if (!match) throw new Error(`Invalid GitHub Actions summary: missing ${label}`);
    const parsed = Number(match[1]!.replaceAll(",", ""));
    if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error(`Invalid GitHub Actions summary: invalid ${label}`);
    return parsed;
  };
  const title = heading?.[1]?.trim();
  if (!title) throw new Error("Invalid GitHub Actions summary: missing heading");
  const total = value("Total");
  const passed = value("Passed");
  const failed = value("Failed");
  const skipped = value("Skipped");
  const cancelled = value("Cancelled");
  if (passed + failed + skipped + cancelled !== total) throw new Error("Invalid GitHub Actions summary: counts do not add up to Total");
  const reportedAt = markdown.match(/^\s*(?:[-*]\s*)?Reported at\s*:\s*(\S.*?)\s*$/im)?.[1]?.trim() ?? "unknown";
  return { title, total, passed, failed, skipped, cancelled, reportedAt };
}

/** Add a GitHub Actions job summary to a dossier as synthetic command evidence. */
export function importGitHubSummary(state: DossierState, markdown: string, source = "github-actions-summary.md"): DossierState {
  const summary = parseGitHubSummary(markdown);
  const output = `GitHub Actions ${source}: ${summary.title}; ${summary.total} total, ${summary.passed} passed, ${summary.failed} failed, ${summary.skipped} skipped, ${summary.cancelled} cancelled; reported ${summary.reportedAt}`;
  const now = new Date().toISOString();
  const command: CommandEvidence = {
    id: `github-summary-${Date.now()}`, command: ["github-summary-import", source], cwd: state.projectRoot,
    startedAt: now, endedAt: now, durationMs: 0, exitCode: summary.failed + summary.cancelled === 0 ? 0 : 1,
    stdout: output, stderr: "", env: {}, git: { head: null, branch: null, dirty: false, status: [] }
  };
  return { ...state, commands: [...state.commands, command], updatedAt: now };
}
