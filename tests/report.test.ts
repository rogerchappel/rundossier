import test from "node:test";
import assert from "node:assert/strict";
import { renderHtml, renderMarkdown } from "../src/index.js";

test("renders command and file evidence", () => {
  const markdown = renderMarkdown({
    schemaVersion: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    projectRoot: "/tmp/demo",
    commands: [{ id: "abc", command: ["node", "-v"], cwd: "/tmp/demo", startedAt: "x", endedAt: "y", durationMs: 1, exitCode: 0, stdout: "ok", stderr: "", env: {}, git: { head: "123", branch: "main", dirty: false, status: [] } }],
    files: [{ path: "README.md", kind: "file", size: 12, sha256: "deadbeef", modifiedAt: "z" }]
  });
  assert.match(markdown, /node -v/);
  assert.match(markdown, /README.md/);
  assert.match(renderHtml(markdown), /<!doctype html>/);
});
