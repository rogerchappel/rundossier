import type { RunDossierConfig } from "./types.js";

export function validateConfig(config: RunDossierConfig): void {
  if (config.schemaVersion !== 1) throw new Error("Unsupported rundossier config schemaVersion");
  if (!Array.isArray(config.envAllowlist)) throw new Error("config.envAllowlist must be an array");
  if (!Array.isArray(config.collect.files)) throw new Error("config.collect.files must be an array");
  if (!Array.isArray(config.collect.artifacts)) throw new Error("config.collect.artifacts must be an array");
  if (!Number.isInteger(config.snippetLines) || config.snippetLines < 1) throw new Error("config.snippetLines must be a positive integer");
  for (const rule of config.redactions) {
    try { new RegExp(rule.pattern, rule.flags); } catch (error) { throw new Error(`Invalid redaction rule ${rule.name}: ${error instanceof Error ? error.message : String(error)}`); }
  }
}
