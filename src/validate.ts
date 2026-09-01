import type { RunDossierConfig } from "./types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireStringArray(value: unknown, field: string): void {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`);
  if (value.some((item) => typeof item !== "string" || item.length === 0)) {
    throw new Error(`${field} must contain only non-empty strings`);
  }
}

export function validateConfig(config: unknown): asserts config is RunDossierConfig {
  if (!isRecord(config)) throw new Error("config must be an object");
  if (config.schemaVersion !== 1) throw new Error("Unsupported rundossier config schemaVersion");
  requireStringArray(config.envAllowlist, "config.envAllowlist");
  if (!isRecord(config.collect)) throw new Error("config.collect must be an object");
  requireStringArray(config.collect.files, "config.collect.files");
  requireStringArray(config.collect.artifacts, "config.collect.artifacts");
  if (!Array.isArray(config.redactions)) throw new Error("config.redactions must be an array");
  if (typeof config.outputDir !== "string" || config.outputDir.length === 0) throw new Error("config.outputDir must be a non-empty string");
  if (!Number.isInteger(config.snippetLines) || (config.snippetLines as number) < 1) throw new Error("config.snippetLines must be a positive integer");
  for (const rule of config.redactions) {
    if (!isRecord(rule)) throw new Error("config.redactions must contain only objects");
    if (typeof rule.name !== "string" || rule.name.length === 0) throw new Error("config.redactions[].name must be a non-empty string");
    if (typeof rule.pattern !== "string" || rule.pattern.length === 0) throw new Error(`config.redactions[${rule.name}].pattern must be a non-empty string`);
    if (rule.flags !== undefined && typeof rule.flags !== "string") throw new Error(`config.redactions[${rule.name}].flags must be a string`);
    if (rule.replacement !== undefined && typeof rule.replacement !== "string") throw new Error(`config.redactions[${rule.name}].replacement must be a string`);
    try { new RegExp(rule.pattern, rule.flags); } catch (error) { throw new Error(`Invalid redaction rule ${rule.name}: ${error instanceof Error ? error.message : String(error)}`); }
  }
}
