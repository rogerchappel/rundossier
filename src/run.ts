import { spawn } from "node:child_process";
import crypto from "node:crypto";
import { StringDecoder } from "node:string_decoder";
import { loadConfig, updateState } from "./fs.js";
import { getGitSummary } from "./git.js";
import { redactStrings, tailLines } from "./redact.js";
import type { CommandEvidence } from "./types.js";

export async function runCommand(root: string, command: string[]): Promise<CommandEvidence> {
  if (command.length === 0) throw new Error("No command provided. Use: rundossier run -- <cmd>");
  const config = await loadConfig(root);
  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  let stdout = "";
  let stderr = "";
  const child = spawn(command[0]!, command.slice(1), { cwd: root, env: process.env, shell: false });
  const stdoutDecoder = new StringDecoder("utf8");
  const stderrDecoder = new StringDecoder("utf8");
  child.stdout.on("data", (chunk: Buffer) => {
    const text = stdoutDecoder.write(chunk);
    stdout += text;
    process.stdout.write(text);
  });
  child.stderr.on("data", (chunk: Buffer) => {
    const text = stderrDecoder.write(chunk);
    stderr += text;
    process.stderr.write(text);
  });
  child.stdout.on("end", () => {
    const text = stdoutDecoder.end();
    stdout += text;
    process.stdout.write(text);
  });
  child.stderr.on("end", () => {
    const text = stderrDecoder.end();
    stderr += text;
    process.stderr.write(text);
  });
  const exitCode = await new Promise<number | null>((resolve) => {
    child.on("error", (error: NodeJS.ErrnoException) => {
      const diagnostic = `Failed to launch: ${error.message}`;
      stderr += stderr.endsWith("\n") || stderr.length === 0 ? diagnostic : `\n${diagnostic}`;
      resolve(1);
    });
    child.on("close", resolve);
  });
  const ended = Date.now();
  const allowedEnv = Object.fromEntries(
    config.envAllowlist.flatMap((key) => process.env[key] === undefined ? [] : [[key, process.env[key]!]])
  );
  const evidence = redactStrings<CommandEvidence>({
    id: crypto.createHash("sha256").update(`${startedAt}\0${command.join("\0")}`).digest("hex").slice(0, 12),
    command,
    cwd: root,
    startedAt,
    endedAt: new Date(ended).toISOString(),
    durationMs: ended - started,
    exitCode,
    stdout: tailLines(stdout, config.snippetLines),
    stderr: tailLines(stderr, config.snippetLines),
    env: allowedEnv,
    git: await getGitSummary(root)
  }, config.redactions);
  await updateState(root, (state) => { state.commands.push(evidence); });
  return evidence;
}
