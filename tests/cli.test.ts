import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { main } from "../src/cli.js";

test("CLI help exits successfully", async () => {
  assert.equal(await main(["--help"], process.cwd()), 0);
});

test("CLI rejects unknown commands", async () => {
  assert.equal(await main(["wat"], process.cwd()), 2);
});

test("CLI status returns non-zero when failures are recorded", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "rundossier-status-"));
  await mkdir(path.join(root, ".rundossier"), { recursive: true });
  await writeFile(path.join(root, ".rundossier", "state.json"), JSON.stringify({
    schemaVersion: 1,
    createdAt: "",
    updatedAt: "",
    projectRoot: root,
    commands: [
      { id: "1", command: ["false"], cwd: root, startedAt: "", endedAt: "", durationMs: 5, exitCode: 1, stdout: "", stderr: "", env: {}, git: { head: null, branch: null, dirty: false, status: [] } }
    ],
    files: []
  }));

  assert.equal(await main(["status"], root), 1);
});
