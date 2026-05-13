import test from "node:test";
import assert from "node:assert/strict";
import { globToRegExp } from "../src/index.js";

test("matches nested markdown docs", () => {
  assert.equal(globToRegExp("docs/**/*.md").test("docs/guide/start.md"), true);
});

test("matches brace extensions", () => {
  const regex = globToRegExp("src/**/*.{ts,js}");
  assert.equal(regex.test("src/cli/index.ts"), true);
  assert.equal(regex.test("src/cli/index.md"), false);
});


test("double-star slash also matches direct children", () => {
  assert.equal(globToRegExp("docs/**/*.md").test("docs/README.md"), true);
  assert.equal(globToRegExp("src/**/*.{ts,js}").test("src/cli.ts"), true);
});
