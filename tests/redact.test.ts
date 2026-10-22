import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_CONFIG, redactEnv, redactStrings, redactText, tailLines } from "../src/index.js";

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


test("redacts credential-like object keys as well as values", () => {
  const input = { "token=super-secret": "safe", nested: { "ghp_abcdefghijklmnopqrstuvwxyz": "value" } };
  const redacted = redactStrings(input, DEFAULT_CONFIG.redactions);
  assert.deepEqual(redacted, { "token=[REDACTED]": "safe", nested: { "[REDACTED:github-token]": "value" } });
});

test("redaction preserves JSON string structure", () => {
  const json = JSON.stringify({ stdout: "token=super-secret\n" });
  assert.doesNotThrow(() => JSON.parse(redactText(json, DEFAULT_CONFIG.redactions)));
});
