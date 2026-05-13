import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, cp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { collectFiles, initProject } from "../src/index.js";

test("collects fixture files and artifacts", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "rundossier-collect-"));
  try {
    await cp(path.resolve("fixtures/sample-project"), root, { recursive: true });
    await initProject(root);
    const files = await collectFiles(root);
    assert.ok(files.some((file) => file.path === "package.json"));
    assert.ok(files.some((file) => file.kind === "artifact" && file.path === "test-results/result.txt"));
    assert.ok(files.every((file) => file.sha256.length === 64));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
