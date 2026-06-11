import test from "node:test";
import assert from "node:assert/strict";
import { summarizeState } from "../src/index.js";

test("summarizes failed commands and artifacts", () => {
  const summary = summarizeState({ schemaVersion: 1, createdAt: "", updatedAt: "", projectRoot: "", commands: [
    { id: "1", command: ["true"], cwd: "", startedAt: "", endedAt: "", durationMs: 12, exitCode: 0, stdout: "", stderr: "", env: {}, git: { head: null, branch: null, dirty: false, status: [] } },
    { id: "2", command: ["false"], cwd: "", startedAt: "", endedAt: "", durationMs: 34, exitCode: 1, stdout: "", stderr: "", env: {}, git: { head: null, branch: null, dirty: true, status: [] } }
  ], files: [{ path: "out.txt", kind: "artifact", size: 1, sha256: "x", modifiedAt: "" }] });
  assert.deepEqual(summary, { commands: 2, failedCommands: 1, totalDurationMs: 46, files: 0, artifacts: 1, dirtyCommands: 1 });
});
