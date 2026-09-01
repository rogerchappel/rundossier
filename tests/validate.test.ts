import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_CONFIG, validateConfig } from "../src/index.js";

test("accepts the default config", () => {
  assert.doesNotThrow(() => validateConfig(DEFAULT_CONFIG));
});

test("rejects invalid redaction patterns", () => {
  assert.throws(() => validateConfig({ ...DEFAULT_CONFIG, redactions: [{ name: "bad", pattern: "[" }] }));
});

test("rejects malformed nested configuration with field-specific messages", () => {
  const cases: Array<[unknown, RegExp]> = [
    [null, /config must be an object/],
    [{ ...DEFAULT_CONFIG, collect: null }, /config\.collect must be an object/],
    [{ ...DEFAULT_CONFIG, collect: { ...DEFAULT_CONFIG.collect, files: [2] } }, /config\.collect\.files must contain only non-empty strings/],
    [{ ...DEFAULT_CONFIG, collect: { ...DEFAULT_CONFIG.collect, artifacts: [""] } }, /config\.collect\.artifacts must contain only non-empty strings/],
    [{ ...DEFAULT_CONFIG, envAllowlist: [1] }, /config\.envAllowlist must contain only non-empty strings/],
    [{ ...DEFAULT_CONFIG, redactions: [null] }, /config\.redactions must contain only objects/],
    [{ ...DEFAULT_CONFIG, redactions: [{ name: "rule", pattern: "x", flags: 1 }] }, /config\.redactions\[rule\]\.flags must be a string/],
    [{ ...DEFAULT_CONFIG, outputDir: 7 }, /config\.outputDir must be a non-empty string/],
    [{ ...DEFAULT_CONFIG, snippetLines: 0 }, /config\.snippetLines must be a positive integer/]
  ];

  for (const [config, message] of cases) assert.throws(() => validateConfig(config), message);
});
