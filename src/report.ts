import { promises as fs } from "node:fs";
import path from "node:path";
import { loadConfig, loadState } from "./fs.js";
import { redactStrings } from "./redact.js";
import type { DossierState } from "./types.js";
import { summarizeState } from "./summary.js";

function longestBacktickRun(value: string): number {
  return Math.max(0, ...Array.from(value.matchAll(/`+/g), (match) => match[0].length));
}

function fence(value: string): string {
  if (!value) return " _empty_\n";
  const delimiter = "`".repeat(Math.max(3, longestBacktickRun(value) + 1));
  return `\n${delimiter}\n${value}\n${delimiter}\n`;
}

function inlineCode(value: string): string {
  const normalized = value.replaceAll("\r", "\\r").replaceAll("\n", "\\n");
  const delimiter = "`".repeat(Math.max(1, longestBacktickRun(normalized) + 1));
  const padding = normalized.startsWith("`") || normalized.endsWith("`") ? " " : "";
  return `${delimiter}${padding}${normalized}${padding}${delimiter}`;
}

function tableCell(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("|", "\\|")
    .replaceAll("`", "\\`")
    .replaceAll("\r\n", "<br>")
    .replaceAll("\r", "<br>")
    .replaceAll("\n", "<br>");
}
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
    lines.push(`### ${command.id}: ${inlineCode(command.command.join(" "))}`, "", `- Exit: ${command.exitCode}`, `- Duration: ${command.durationMs}ms`, `- Git: ${command.git.branch ?? "unknown"}@${command.git.head ?? "unknown"}${command.git.dirty ? " (dirty)" : ""}`, "", "**stdout**", fence(command.stdout), "**stderr**", fence(command.stderr));
  }
  lines.push("## Files", "", "| Path | Kind | Size | SHA-256 |", "| --- | --- | ---: | --- |");
  for (const file of state.files) lines.push(`| ${tableCell(file.path)} | ${file.kind} | ${file.size} | \`${file.sha256}\` |`);
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
  const redactedState = redactStrings(state, config.redactions);
  const json = `${JSON.stringify(redactedState, null, 2)}\n`;
  const markdown = renderMarkdown(redactedState);
  const html = renderHtml(markdown);
  const outputs = [
    ["dossier.json", json],
    ["dossier.md", markdown],
    ["dossier.html", html]
  ] as const;
  for (const [name, content] of outputs) await fs.writeFile(path.join(outDir, name), content);
  return outputs.map(([name]) => path.join(outDir, name));
}
