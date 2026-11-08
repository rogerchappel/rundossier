import test from "node:test";
import assert from "node:assert/strict";
import { globToRegExp, matchGlobs } from "../src/index.js";
import { mkdtemp, mkdir, symlink, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

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


test("matches nested brace alternatives", () => {
  const regex = globToRegExp("**/*.{ts,{js,mjs}}");
  assert.equal(regex.test("src/index.ts"), true);
  assert.equal(regex.test("src/index.js"), true);
  assert.equal(regex.test("src/index.mjs"), true);
  assert.equal(regex.test("src/index.cjs"), false);
});


test("does not follow directory symlinks outside the root or into loops", async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), "rundossier-glob-"));
  const root = path.join(temp, "root");
  const outside = path.join(temp, "outside");
  await mkdir(root);
  await mkdir(outside);
  await writeFile(path.join(outside, "secret.txt"), "outside");
  await writeFile(path.join(root, "inside.txt"), "inside");
  await symlink(outside, path.join(root, "external"), "dir");
  await symlink(root, path.join(root, "loop"), "dir");
  try {
    assert.deepEqual(await matchGlobs(root, ["**/*.txt"]), ["inside.txt"]);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
