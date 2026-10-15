import { promises as fs } from "node:fs";
import path from "node:path";

const SKIP_DIRS = new Set([".git", "node_modules", ".rundossier"]);

function escapeRegex(value: string): string {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function parseBrace(pattern: string, start: number): { source: string; end: number } | null {
  let depth = 0;
  for (let i = start; i < pattern.length; i += 1) {
    if (pattern[i] === "{") depth += 1;
    else if (pattern[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        const content = pattern.slice(start + 1, i);
        const alternatives: string[] = [];
        let partStart = start + 1;
        let nestedDepth = 0;
        for (let j = start + 1; j < i; j += 1) {
          if (pattern[j] === "{") nestedDepth += 1;
          else if (pattern[j] === "}") nestedDepth -= 1;
          else if (pattern[j] === "," && nestedDepth === 0) {
            alternatives.push(pattern.slice(partStart, j));
            partStart = j + 1;
          }
        }
        if (alternatives.length === 0) return null;
        alternatives.push(pattern.slice(partStart, i));
        return { source: `(?:${alternatives.map(globFragmentToRegex).join("|")})`, end: i };
      }
    }
  }
  return null;
}

function globFragmentToRegex(pattern: string): string {
  let source = "";
  for (let i = 0; i < pattern.length; i += 1) {
    const char = pattern[i];
    const next = pattern[i + 1];
    if (char === "*" && next === "*") {
      const after = pattern[i + 2];
      if (after === "/") { source += "(?:.*/)?"; i += 2; }
      else { source += ".*"; i += 1; }
    } else if (char === "*") source += "[^/]*";
    else if (char === "?") source += "[^/]";
    else if (char === "{") {
      const brace = parseBrace(pattern, i);
      if (brace) { source += brace.source; i = brace.end; }
      else source += "\\{";
    } else source += escapeRegex(char);
  }
  return source;
}

export function globToRegExp(pattern: string): RegExp {
  return new RegExp(`^${globFragmentToRegex(pattern)}$`);
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
