import type { RedactionRule, RunDossierConfig } from "./types.js";

export function compileRule(rule: RedactionRule): RegExp {
  const flags = rule.flags?.includes("g") ? rule.flags : `${rule.flags ?? ""}g`;
  return new RegExp(rule.pattern, flags);
}

export function redactText(input: string, rules: RedactionRule[]): string {
  return rules.reduce((text, rule) => text.replace(compileRule(rule), rule.replacement ?? `[REDACTED:${rule.name}]`), input);
}

export function redactStrings<T>(input: T, rules: RedactionRule[]): T {
  if (typeof input === "string") return redactText(input, rules) as T;
  if (Array.isArray(input)) return input.map((value) => redactStrings(value, rules)) as T;
  if (input && typeof input === "object") {
    return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, redactStrings(value, rules)])) as T;
  }
  return input;
}

export function redactEnv(env: Record<string, string>, config: RunDossierConfig): Record<string, string> {
  const allowed = new Set(config.envAllowlist);
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    if (allowed.has(key)) result[key] = redactText(value, config.redactions);
  }
  return result;
}

export function tailLines(input: string, limit: number): string {
  const lines = input.split(/\r?\n/);
  if (lines.length <= limit) return input;
  return [`[... ${lines.length - limit} earlier lines omitted ...]`, ...lines.slice(-limit)].join("\n");
}
