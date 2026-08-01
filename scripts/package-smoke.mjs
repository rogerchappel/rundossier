import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url)));
const cliPath = packageJson.bin.rundossier.replace(/^\.\//, "");

const help = execFileSync(process.execPath, [cliPath, "--help"], {
  encoding: "utf8",
});
assert.match(help, /^rundossier \S+/m, `${cliPath} did not print CLI help`);

const packDirectory = mkdtempSync(join(tmpdir(), "rundossier-package-smoke-"));

try {
  const pack = JSON.parse(
    execFileSync("npm", ["pack", "--json", "--pack-destination", packDirectory], {
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

  const installDirectory = join(packDirectory, "install");
  const tarball = join(packDirectory, pack[0].filename);
  execFileSync("npm", ["install", "--prefix", installDirectory, tarball], {
    encoding: "utf8",
  });
  const installedCli = join(installDirectory, "node_modules", ".bin", "rundossier");
  const installedHelp = execFileSync(installedCli, ["--help"], {
    encoding: "utf8",
  });
  assert.match(
    installedHelp,
    /^rundossier \S+/m,
    "installed package CLI did not print help",
  );

  console.log(
    `package smoke passed (${files.length} files, installed CLI: ${installedCli})`,
  );
} finally {
  rmSync(packDirectory, { recursive: true, force: true });
}
