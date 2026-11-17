import test from "node:test";
import assert from "node:assert/strict";
import { importGitHubSummary, parseGitHubSummary } from "../src/index.js";
import type { DossierState } from "../src/types.js";

const fixture = `## CI test results\n\n- Total: 12\n- Passed: 9\n- Failed: 1\n- Skipped: 1\n- Cancelled: 1\n- Reported at: 2026-11-17T22:00:00Z\n`;

test("parses a fixture-backed GitHub Actions job summary", () => {
  assert.deepEqual(parseGitHubSummary(fixture), { title: "CI test results", total: 12, passed: 9, failed: 1, skipped: 1, cancelled: 1, reportedAt: "2026-11-17T22:00:00Z" });
});

test("imports summary evidence into dossier commands", () => {
  const state: DossierState = { schemaVersion: 1, createdAt: "", updatedAt: "", projectRoot: "/project", commands: [], files: [] };
  const result = importGitHubSummary(state, fixture);
  assert.equal(result.commands.length, 1);
  assert.equal(result.commands[0]!.exitCode, 1);
  assert.match(result.commands[0]!.stdout, /12 total, 9 passed, 1 failed/);
  assert.deepEqual(state.commands, []);
});

test("rejects incomplete and inconsistent summaries", () => {
  for (const input of ["", "## Results\n- Total: 3", "## Results\n- Total: 2\n- Passed: 2\n- Failed: 1\n- Skipped: 0\n- Cancelled: 0"]) {
    assert.throws(() => parseGitHubSummary(input), /Invalid GitHub Actions summary/);
  }
});
