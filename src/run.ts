import { spawn } from "node:child_process";
import crypto from "node:crypto";
import { loadConfig, loadState, saveState } from "./fs.js";
import { getGitSummary } from "./git.js";
import { redactEnv, redactText, tailLines } from "./redact.js";
import type { CommandEvidence } from "./types.js";

export async function runCommand(root: string, command: string[]): Promise<CommandEvidence> {
  if (command.length === 0) throw new Error("No command provided. Use: rundossier run -- <cmd>");
  const config = await loadConfig(root);
  const state = await loadState(root);
  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  let stdout = "";
  let stderr = "";
  const child = spawn(command[0]!, command.slice(1), { cwd: root, env: process.env, shell: false });
  child.stdout.on("data", (chunk) => { const text = String(chunk); stdout += text; process.stdout.write(text); });
  child.stderr.on("data", (chunk) => { const text = String(chunk); stderr += text; process.stderr.write(text); });
  const exitCode = await new Promise<number | null>((resolve, reject) => {
    child.on("error", reject);
    child.on("close", resolve);
  });
  const ended = Date.now();
  const evidence: CommandEvidence = {
    id: crypto.createHash("sha256").update(`${startedAt}\0${command.join("\0")}`).digest("hex").slice(0, 12),
    command,
    cwd: root,
    startedAt,
    endedAt: new Date(ended).toISOString(),
    durationMs: ended - started,
    exitCode,
    stdout: tailLines(redactText(stdout, config.redactions), config.snippetLines),
    stderr: tailLines(redactText(stderr, config.redactions), config.snippetLines),
    env: redactEnv(process.env as Record<string, string>, config),
    git: await getGitSummary(root)
  };
  state.commands.push(evidence);
  await saveState(root, state);
  return evidence;
}
