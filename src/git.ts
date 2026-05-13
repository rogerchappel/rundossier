import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { GitSummary } from "./types.js";

const execFileAsync = promisify(execFile);

async function git(args: string[], cwd: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("git", args, { cwd, timeout: 5000 });
    return stdout.trim();
  } catch {
    return null;
  }
}

export async function getGitSummary(cwd: string): Promise<GitSummary> {
  const head = await git(["rev-parse", "--short", "HEAD"], cwd);
  const branch = await git(["branch", "--show-current"], cwd);
  const porcelain = await git(["status", "--short"], cwd);
  const status = porcelain ? porcelain.split(/\r?\n/).filter(Boolean).slice(0, 80) : [];
  return { head, branch, dirty: status.length > 0, status };
}
