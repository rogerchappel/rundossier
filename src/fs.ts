import { promises as fs } from "node:fs";
import path from "node:path";
import { DEFAULT_CONFIG, CONFIG_PATH, RUNDOSSIER_DIR, STATE_PATH } from "./defaults.js";
import type { DossierState, RunDossierConfig } from "./types.js";

export async function pathExists(filePath: string): Promise<boolean> {
  try { await fs.access(filePath); return true; } catch { return false; }
}

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

export async function writeJson(filePath: string, value: unknown): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export async function initProject(root: string): Promise<string> {
  const configFile = path.join(root, CONFIG_PATH);
  await ensureDir(path.join(root, RUNDOSSIER_DIR));
  if (!(await pathExists(configFile))) await writeJson(configFile, DEFAULT_CONFIG);
  return configFile;
}

export async function loadConfig(root: string): Promise<RunDossierConfig> {
  const configFile = path.join(root, CONFIG_PATH);
  if (!(await pathExists(configFile))) await initProject(root);
  const userConfig = await readJson<Partial<RunDossierConfig>>(configFile);
  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
    collect: { ...DEFAULT_CONFIG.collect, ...userConfig.collect },
    redactions: userConfig.redactions ?? DEFAULT_CONFIG.redactions,
    envAllowlist: userConfig.envAllowlist ?? DEFAULT_CONFIG.envAllowlist
  };
}

export async function loadState(root: string): Promise<DossierState> {
  const stateFile = path.join(root, STATE_PATH);
  if (await pathExists(stateFile)) return readJson<DossierState>(stateFile);
  const now = new Date().toISOString();
  return { schemaVersion: 1, createdAt: now, updatedAt: now, projectRoot: root, commands: [], files: [] };
}

export async function saveState(root: string, state: DossierState): Promise<void> {
  state.updatedAt = new Date().toISOString();
  await writeJson(path.join(root, STATE_PATH), state);
}
