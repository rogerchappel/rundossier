import { promises as fs } from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { DEFAULT_CONFIG, CONFIG_PATH, RUNDOSSIER_DIR, STATE_PATH } from "./defaults.js";
import type { DossierState, RunDossierConfig } from "./types.js";
import { validateConfig } from "./validate.js";

const LOCK_TIMEOUT_MS = 10_000;
const LOCK_RETRY_MS = 20;
const STALE_LOCK_MS = 30_000;

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
  const temporary = `${filePath}.${process.pid}.${crypto.randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
    await fs.rename(temporary, filePath);
  } finally {
    await fs.rm(temporary, { force: true });
  }
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
  const userConfig = await readJson<unknown>(configFile);
  if (typeof userConfig !== "object" || userConfig === null || Array.isArray(userConfig)) {
    throw new Error("config must be an object");
  }
  const partial = userConfig as Partial<RunDossierConfig>;
  const config = {
    ...DEFAULT_CONFIG,
    ...partial,
    collect: partial.collect === undefined ? DEFAULT_CONFIG.collect :
      typeof partial.collect === "object" && partial.collect !== null && !Array.isArray(partial.collect)
        ? { ...DEFAULT_CONFIG.collect, ...partial.collect }
        : partial.collect,
    redactions: partial.redactions ?? DEFAULT_CONFIG.redactions,
    envAllowlist: partial.envAllowlist ?? DEFAULT_CONFIG.envAllowlist
  };
  validateConfig(config);
  return config;
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

async function acquireStateLock(root: string): Promise<() => Promise<void>> {
  const lockFile = path.join(root, `${STATE_PATH}.lock`);
  await ensureDir(path.dirname(lockFile));
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  while (true) {
    try {
      const handle = await fs.open(lockFile, "wx");
      await handle.writeFile(`${process.pid}\n`);
      return async () => { await handle.close(); await fs.rm(lockFile, { force: true }); };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      const stat = await fs.stat(lockFile).catch(() => undefined);
      if (stat && Date.now() - stat.mtimeMs > STALE_LOCK_MS) {
        await fs.rm(lockFile, { force: true });
        continue;
      }
      if (Date.now() >= deadline) throw new Error(`Timed out waiting for state lock: ${lockFile}`);
      await new Promise((resolve) => setTimeout(resolve, LOCK_RETRY_MS));
    }
  }
}

export async function updateState<T>(root: string, update: (state: DossierState) => T): Promise<T> {
  const release = await acquireStateLock(root);
  try {
    const state = await loadState(root);
    const result = update(state);
    await saveState(root, state);
    return result;
  } finally {
    await release();
  }
}
