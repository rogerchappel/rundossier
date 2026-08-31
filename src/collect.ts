import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { loadConfig, updateState } from "./fs.js";
import { matchGlobs } from "./glob.js";
import type { FileEvidence } from "./types.js";

async function hashFile(filePath: string): Promise<string> {
  return crypto.createHash("sha256").update(await fs.readFile(filePath)).digest("hex");
}

export async function collectFiles(root: string): Promise<FileEvidence[]> {
  const config = await loadConfig(root);
  const fileMatches = await matchGlobs(root, config.collect.files);
  const artifactMatches = await matchGlobs(root, config.collect.artifacts);
  const artifactSet = new Set(artifactMatches);
  const all = [...new Set([...fileMatches, ...artifactMatches])];
  const evidence: FileEvidence[] = [];
  for (const relative of all) {
    const full = path.join(root, relative);
    const stat = await fs.stat(full);
    evidence.push({
      path: relative,
      kind: artifactSet.has(relative) ? "artifact" : "file",
      size: stat.size,
      sha256: await hashFile(full),
      modifiedAt: stat.mtime.toISOString()
    });
  }
  const files = evidence.sort((a, b) => a.path.localeCompare(b.path));
  await updateState(root, (state) => { state.files = files; });
  return files;
}
