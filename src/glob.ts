import { promises as fs } from "node:fs";
import path from "node:path";

const SKIP_DIRS = new Set([".git", "node_modules", ".rundossier"]);

function escapeRegex(value: string): string {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

export function globToRegExp(pattern: string): RegExp {
  let source = "^";
  for (let i = 0; i < pattern.length; i += 1) {
    const char = pattern[i];
    const next = pattern[i + 1];
    if (char === "*" && next === "*") { source += ".*"; i += 1; }
    else if (char === "*") source += "[^/]*";
    else if (char === "?") source += "[^/]";
    else if (char === "{") {
      const end = pattern.indexOf("}", i);
      if (end === -1) source += "\\{";
      else { source += `(${pattern.slice(i + 1, end).split(",").map(escapeRegex).join("|")})`; i = end; }
    } else source += escapeRegex(char);
  }
  return new RegExp(`${source}$`);
}

async function walk(root: string, dir = root): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(root, full));
    if (entry.isFile()) files.push(path.relative(root, full).split(path.sep).join("/"));
  }
  return files;
}

export async function matchGlobs(root: string, patterns: string[]): Promise<string[]> {
  const regexes = patterns.map(globToRegExp);
  const files = await walk(root);
  return files.filter((file) => regexes.some((regex) => regex.test(file))).sort();
}
