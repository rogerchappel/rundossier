import type { RunDossierConfig } from "./types.js";

export const RUNDOSSIER_DIR = ".rundossier";
export const CONFIG_PATH = `${RUNDOSSIER_DIR}/config.json`;
export const STATE_PATH = `${RUNDOSSIER_DIR}/state.json`;

export const DEFAULT_CONFIG: RunDossierConfig = {
  schemaVersion: 1,
  envAllowlist: ["CI", "NODE_ENV", "GITHUB_ACTIONS", "GITHUB_REF", "GITHUB_SHA"],
  collect: {
    files: ["package.json", "README.md", "docs/**/*.md", "src/**/*.{ts,js}", "tests/**/*.{ts,js}"],
    artifacts: ["coverage/**", "test-results/**", "dist/**"]
  },
  redactions: [
    { name: "github-token", pattern: "gh[pousr]_[A-Za-z0-9_]{20,}", replacement: "[REDACTED:github-token]" },
    { name: "generic-secret-assignment", pattern: "(?i)(api[_-]?key|token|secret|password)=([^\\s]+)", replacement: "$1=[REDACTED]" },
    { name: "authorization-header", pattern: "(?i)authorization:\\s*bearer\\s+[^\\s]+", replacement: "authorization: bearer [REDACTED]" },
    { name: "private-key", pattern: "-----BEGIN [A-Z ]*PRIVATE KEY-----[\\s\\S]*?-----END [A-Z ]*PRIVATE KEY-----", replacement: "[REDACTED:private-key]" }
  ],
  outputDir: ".rundossier/out",
  snippetLines: 80
};
