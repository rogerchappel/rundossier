import test from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { renderHtml, renderMarkdown, writeReports } from "../src/index.js";
import { DEFAULT_CONFIG } from "../src/defaults.js";
import type { DossierState } from "../src/types.js";

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

test("uses collision-safe fences for captured output", () => {
  const markdown = renderMarkdown({
    schemaVersion: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    projectRoot: "/tmp/demo",
    commands: [{ id: "fence", command: ["printf", "output"], cwd: "/tmp/demo", startedAt: "x", endedAt: "y", durationMs: 1, exitCode: 0, stdout: "before\n```\nafter", stderr: "failure ```` marker", env: {}, git: { head: "123", branch: "main", dirty: false, status: [] } }],
    files: []
  });

  assert.match(markdown, /\*\*stdout\*\*\n\n````\nbefore\n```\nafter\n````/);
  assert.match(markdown, /\*\*stderr\*\*\n\n`````\nfailure ```` marker\n`````/);
});

test("escapes command headings and file table cells", () => {
  const markdown = renderMarkdown({
    schemaVersion: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    projectRoot: "/tmp/demo",
    commands: [{ id: "special", command: ["tool", "```", "line one\nline two"], cwd: "/tmp/demo", startedAt: "x", endedAt: "y", durationMs: 1, exitCode: 0, stdout: "ok", stderr: "", env: {}, git: { head: "123", branch: "main", dirty: false, status: [] } }],
    files: [{ path: "docs/a|`b`\nnext.md", kind: "file", size: 12, sha256: "deadbeef", modifiedAt: "z" }]
  });

  assert.match(markdown, /^### special: ````tool ``` line one\\nline two````$/m);
  assert.match(markdown, /^\| docs\/a\\\|\\`b\\`<br>next\.md \| file \| 12 \| `deadbeef` \|$/m);
  assert.doesNotMatch(markdown, /^line two/m);
});

test("redacts evidence values before serializing every report format", async (context) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "rundossier-report-"));
  context.after(() => fs.rm(root, { recursive: true, force: true }));
  const state: DossierState = {
    schemaVersion: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    projectRoot: "/tmp/demo-secret",
    commands: [{ id: "secret", command: ["printf", "demo-secret"], cwd: "/tmp/demo-secret", startedAt: "x", endedAt: "y", durationMs: 1, exitCode: 0, stdout: "demo-secret", stderr: "", env: {}, git: { head: "123", branch: "main", dirty: false, status: [] } }],
    files: [{ path: "demo-secret.txt", kind: "file", size: 12, sha256: "deadbeef", modifiedAt: "z" }]
  };
  const replacement = "quote:\" slash:\\ line:\nnext";
  await fs.mkdir(path.join(root, ".rundossier"), { recursive: true });
  await fs.writeFile(path.join(root, ".rundossier", "config.json"), JSON.stringify({ ...DEFAULT_CONFIG, redactions: [{ name: "demo", pattern: "demo-secret", replacement }] }));
  await fs.writeFile(path.join(root, ".rundossier", "state.json"), JSON.stringify(state));

  await writeReports(root);

  const jsonText = await fs.readFile(path.join(root, ".rundossier", "out", "dossier.json"), "utf8");
  const json = JSON.parse(jsonText) as DossierState;
  const markdown = await fs.readFile(path.join(root, ".rundossier", "out", "dossier.md"), "utf8");
  const html = await fs.readFile(path.join(root, ".rundossier", "out", "dossier.html"), "utf8");
  assert.equal(json.commands[0].stdout, replacement);
  assert.equal(json.commands[0].command[1], replacement);
  assert.doesNotMatch(jsonText, /demo-secret/);
  assert.doesNotMatch(markdown, /demo-secret/);
  assert.doesNotMatch(html, /demo-secret/);
  assert.match(markdown, /quote:\" slash:\\\\ line:/);
  assert.match(html, /quote:" slash:\\ line:/);
});
