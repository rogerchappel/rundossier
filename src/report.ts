import { promises as fs } from "node:fs";
import path from "node:path";
import { loadConfig, loadState } from "./fs.js";
import { redactText } from "./redact.js";
import type { DossierState } from "./types.js";
import { summarizeState } from "./summary.js";

function fence(value: string): string { return value ? `\n\`\`\`\n${value}\n\`\`\`\n` : " _empty_\n"; }
function escapeHtml(value: string): string { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }

export function renderMarkdown(state: DossierState): string {
  const summary = summarizeState(state);
  const lines = [
    "# Run Dossier",
    "",
    `Generated: ${state.updatedAt}`,
    `Project: ${state.projectRoot}`,
    "",
    "## Summary",
    "",
    `- Commands: ${summary.commands}`,
    `- Failed commands: ${summary.failedCommands}`,
    `- Total duration: ${summary.totalDurationMs}ms`,
    `- Files: ${summary.files}`,
    `- Artifacts: ${summary.artifacts}`,
    `- Dirty git snapshots: ${summary.dirtyCommands}`,
    "",
    "## Commands",
    ""
  ];
  for (const command of state.commands) {
    lines.push(`### ${command.id}: \`${command.command.join(" ")}\``, "", `- Exit: ${command.exitCode}`, `- Duration: ${command.durationMs}ms`, `- Git: ${command.git.branch ?? "unknown"}@${command.git.head ?? "unknown"}${command.git.dirty ? " (dirty)" : ""}`, "", "**stdout**", fence(command.stdout), "**stderr**", fence(command.stderr));
  }
  lines.push("## Files", "", "| Path | Kind | Size | SHA-256 |", "| --- | --- | ---: | --- |");
  for (const file of state.files) lines.push(`| ${file.path} | ${file.kind} | ${file.size} | \`${file.sha256}\` |`);
  lines.push("");
  return lines.join("\n");
}

export function renderHtml(markdown: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Run Dossier</title><style>body{font-family:ui-sans-serif,system-ui;margin:2rem;line-height:1.5}pre,code{background:#f5f5f5;border-radius:6px}pre{padding:1rem;overflow:auto}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:.4rem;text-align:left}</style></head><body><pre>${escapeHtml(markdown)}</pre></body></html>\n`;
}

export async function writeReports(root: string): Promise<string[]> {
  const config = await loadConfig(root);
  const state = await loadState(root);
  const outDir = path.resolve(root, config.outputDir);
  await fs.mkdir(outDir, { recursive: true });
  const json = redactText(`${JSON.stringify(state, null, 2)}\n`, config.redactions);
  const markdown = renderMarkdown(JSON.parse(json) as DossierState);
  const html = renderHtml(markdown);
  const outputs = [
    ["dossier.json", json],
    ["dossier.md", markdown],
    ["dossier.html", html]
  ] as const;
  for (const [name, content] of outputs) await fs.writeFile(path.join(outDir, name), content);
  return outputs.map(([name]) => path.join(outDir, name));
}
