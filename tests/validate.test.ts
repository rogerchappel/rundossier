import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_CONFIG, validateConfig } from "../src/index.js";

test("accepts the default config", () => {
  assert.doesNotThrow(() => validateConfig(DEFAULT_CONFIG));
});

test("rejects invalid redaction patterns", () => {
  assert.throws(() => validateConfig({ ...DEFAULT_CONFIG, redactions: [{ name: "bad", pattern: "[" }] }));
});
