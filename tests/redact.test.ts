import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_CONFIG, redactEnv, redactText, tailLines } from "../src/index.js";

test("redacts common token patterns", () => {
  const text = "token=super-secret ghp_abcdefghijklmnopqrstuvwxyz";
  const redacted = redactText(text, DEFAULT_CONFIG.redactions);
  assert.match(redacted, /token=\[REDACTED\]/);
  assert.doesNotMatch(redacted, /ghp_/);
});

test("captures only allowlisted environment variables", () => {
  assert.deepEqual(redactEnv({ CI: "true", SECRET: "nope" }, DEFAULT_CONFIG), { CI: "true" });
});

test("tails long logs", () => {
  assert.equal(tailLines("a\nb\nc", 2), "[... 1 earlier lines omitted ...]\nb\nc");
});


test("redaction preserves JSON string structure", () => {
  const json = JSON.stringify({ stdout: "token=super-secret\n" });
  assert.doesNotThrow(() => JSON.parse(redactText(json, DEFAULT_CONFIG.redactions)));
});
