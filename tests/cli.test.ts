import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import { main } from "../src/cli.js";

const execFileAsync = promisify(execFile);

test("CLI help exits successfully", async () => {
  assert.equal(await main(["--help"], process.cwd()), 0);
});

test("CLI rejects unknown commands", async () => {
  assert.equal(await main(["wat"], process.cwd()), 2);
});

test("CLI status returns non-zero when failures are recorded", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "rundossier-status-"));
  await mkdir(path.join(root, ".rundossier"), { recursive: true });
  await writeFile(path.join(root, ".rundossier", "state.json"), JSON.stringify({
    schemaVersion: 1,
    createdAt: "",
    updatedAt: "",
    projectRoot: root,
    commands: [
      { id: "1", command: ["false"], cwd: root, startedAt: "", endedAt: "", durationMs: 5, exitCode: 1, stdout: "", stderr: "", env: {}, git: { head: null, branch: null, dirty: false, status: [] } }
    ],
    files: []
  }));

  assert.equal(await main(["status"], root), 1);
});

test("CLI records and reports commands that cannot be launched", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "rundossier-launch-error-"));
  const missingCommand = "rundossier-missing-token=launch-secret";

  assert.equal(await main(["run", "--", missingCommand, "--example"], root), 1);

  const state = JSON.parse(await readFile(path.join(root, ".rundossier", "state.json"), "utf8"));
  assert.equal(state.commands.length, 1);
  assert.deepEqual(state.commands[0].command, [missingCommand, "--example"]);
  assert.equal(state.commands[0].exitCode, 1);
  assert.match(state.commands[0].startedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.match(state.commands[0].endedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(typeof state.commands[0].durationMs, "number");
  assert.match(state.commands[0].stderr, /Failed to launch/);
  assert.match(state.commands[0].stderr, /token=\[REDACTED\]/);
  assert.doesNotMatch(state.commands[0].stderr, /launch-secret/);
  assert.equal(typeof state.commands[0].env, "object");
  assert.equal(typeof state.commands[0].git, "object");

  assert.equal(await main(["status"], root), 1);
  assert.equal(await main(["report"], root), 0);
  const report = await readFile(path.join(root, ".rundossier", "out", "dossier.md"), "utf8");
  assert.match(report, /Failed commands: 1/);
  assert.match(report, /Failed to launch/);
});

test("built CLI runs through an aliased project path", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "rundossier-cli-"));
  const project = path.join(root, "project");
  const alias = path.join(root, "project-alias");
  const cli = path.resolve("dist/src/cli.js");
  const cliAlias = path.join(alias, path.relative(process.cwd(), cli));

  await mkdir(project);
  await writeFile(path.join(project, "package.json"), JSON.stringify({ name: "alias-fixture" }));
  await symlink(process.cwd(), alias, "dir");

  const help = await execFileAsync(process.execPath, [cliAlias, "--help"]);
  assert.match(help.stdout, /Usage:\s+rundossier init/);

  await execFileAsync(process.execPath, [cliAlias, "init"], { cwd: project });
  await execFileAsync(process.execPath, [cliAlias, "collect"], { cwd: project });
  await execFileAsync(process.execPath, [cliAlias, "report"], { cwd: project });

  assert.match(
    await import("node:fs/promises").then(({ readFile }) =>
      readFile(path.join(project, ".rundossier/out/dossier.md"), "utf8")),
    /# Run Dossier/
  );
});
