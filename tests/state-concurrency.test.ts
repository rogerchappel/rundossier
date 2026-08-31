import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { collectFiles, initProject, runCommand } from "../src/index.js";

test("overlapping successful runs preserve both command records", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "rundossier-concurrent-runs-"));
  try {
    await initProject(root);
    await Promise.all([
      runCommand(root, [process.execPath, "-e", "setTimeout(() => {}, 200)", "slow"]),
      runCommand(root, [process.execPath, "-e", "setTimeout(() => {}, 40)", "fast"])
    ]);
    const state = JSON.parse(await readFile(path.join(root, ".rundossier/state.json"), "utf8"));
    assert.equal(state.commands.length, 2);
    assert.deepEqual(new Set(state.commands.map((entry: { command: string[] }) => entry.command.at(-1))), new Set(["slow", "fast"]));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("collect and run mutations preserve each other's completed evidence", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "rundossier-concurrent-collect-"));
  try {
    await initProject(root);
    await writeFile(path.join(root, "package.json"), "{}\n");
    await Promise.all([
      runCommand(root, [process.execPath, "-e", "setTimeout(() => {}, 100)", "command"]),
      collectFiles(root)
    ]);
    const state = JSON.parse(await readFile(path.join(root, ".rundossier/state.json"), "utf8"));
    assert.equal(state.commands.length, 1);
    assert.ok(state.files.some((entry: { path: string }) => entry.path === "package.json"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
