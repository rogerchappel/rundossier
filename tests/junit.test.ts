import test from "node:test";
import assert from "node:assert/strict";
import { importJUnit, parseJUnit } from "../src/index.js";
import type { DossierState } from "../src/types.js";

const fixture = `<testsuites tests="5" failures="1" errors="0" skipped="1" time="1.25"><testsuite name="unit" tests="3" failures="1" errors="0" skipped="1" time="0.5"><testcase name="ok"/><testcase name="failed"><failure message="no"/></testcase></testsuite><testsuite name="integration" tests="2" failures="0" errors="0" skipped="0" time="0.75"/></testsuites>`;

test("parses aggregate JUnit fixture counts", () => {
  assert.deepEqual(parseJUnit(fixture), { suites: 2, tests: 5, failures: 1, errors: 0, skipped: 1, durationSeconds: 1.25 });
});

test("imports JUnit results into dossier command evidence", () => {
  const state: DossierState = { schemaVersion: 1, createdAt: "", updatedAt: "", projectRoot: "/project", commands: [], files: [] };
  const result = importJUnit(state, fixture);
  assert.equal(result.commands.length, 1);
  assert.equal(result.commands[0]!.exitCode, 1);
  assert.match(result.commands[0]!.stdout, /5 tests, 1 failures/);
  assert.deepEqual(state.commands, []);
});

test("rejects malformed, empty, and entity-bearing XML safely", () => {
  for (const input of ["", "<testsuites", "<testsuite tests='NaN'/>", '<!DOCTYPE x [<!ENTITY e SYSTEM "file:///etc/passwd">]><testsuite/>']) {
    assert.throws(() => parseJUnit(input), /Invalid JUnit XML/);
  }
});
