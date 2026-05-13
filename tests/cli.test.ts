import test from "node:test";
import assert from "node:assert/strict";
import { main } from "../src/cli.js";

test("CLI help exits successfully", async () => {
  assert.equal(await main(["--help"], process.cwd()), 0);
});

test("CLI rejects unknown commands", async () => {
  assert.equal(await main(["wat"], process.cwd()), 2);
});
