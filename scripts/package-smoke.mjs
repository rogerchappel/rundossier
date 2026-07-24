import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url)));
const cliPath = packageJson.bin.rundossier.replace(/^\.\//, "");

const help = execFileSync(process.execPath, [cliPath, "--help"], {
  encoding: "utf8",
});
assert.match(help, /^rundossier \S+/m, `${cliPath} did not print CLI help`);

const pack = JSON.parse(
  execFileSync("npm", ["pack", "--json", "--dry-run"], {
    encoding: "utf8",
  }),
);
const files = pack[0].files.map(({ path }) => path);

for (const required of [
  cliPath,
  "dist/src/index.js",
  "dist/src/index.d.ts",
]) {
  assert.ok(files.includes(required), `npm package is missing ${required}`);
}

const compiledTests = files.filter((path) => path.startsWith("dist/tests/"));
assert.deepEqual(
  compiledTests,
  [],
  `npm package contains compiled tests:\n${compiledTests.join("\n")}`,
);

console.log(`package smoke passed (${files.length} files, CLI: ${cliPath})`);
