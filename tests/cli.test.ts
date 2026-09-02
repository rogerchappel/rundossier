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

test("CLI rejects malformed config fields without runtime TypeErrors", async () => {
  const cases: Array<[unknown, RegExp]> = [
    [null, /config must be an object/],
    [{ schemaVersion: 1, collect: null }, /config\.collect must be an object/],
    [{ schemaVersion: 1, collect: { files: [2] } }, /config\.collect\.files must contain only non-empty strings/],
    [{ schemaVersion: 1, envAllowlist: [1] }, /config\.envAllowlist must contain only non-empty strings/],
    [{ schemaVersion: 1, redactions: [null] }, /config\.redactions must contain only objects/],
    [{ schemaVersion: 1, outputDir: 7 }, /config\.outputDir must be a non-empty string/]
  ];

  for (const [config, expected] of cases) {
    const root = await mkdtemp(path.join(tmpdir(), "rundossier-invalid-config-"));
    await mkdir(path.join(root, ".rundossier"));
    await writeFile(path.join(root, ".rundossier", "config.json"), JSON.stringify(config));
    const messages: string[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => messages.push(args.map(String).join(" "));
    try {
      assert.equal(await main(["collect"], root), 1);
    } finally {
      console.error = originalError;
    }
    assert.match(messages.join("\n"), expected);
    assert.doesNotMatch(messages.join("\n"), /TypeError|Cannot read properties/);
  }
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

test("CLI redacts configured patterns before persisting command argv", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "rundossier-command-redaction-"));
  const secret = "fixture-sensitive-value";
  await mkdir(path.join(root, ".rundossier"), { recursive: true });
  await writeFile(path.join(root, ".rundossier", "config.json"), JSON.stringify({
    schemaVersion: 1,
    redactions: [{ name: "fixture", pattern: secret, replacement: "[REDACTED:fixture]" }]
  }));

  assert.equal(await main(["run", "--", process.execPath, "-e", "process.stdout.write('ok')", `--label=${secret}`], root), 0);

  const stateText = await readFile(path.join(root, ".rundossier", "state.json"), "utf8");
  const state = JSON.parse(stateText);
  assert.deepEqual(state.commands[0].command.slice(0, 4), [process.execPath, "-e", "process.stdout.write('ok')", "--label=[REDACTED:fixture]"]);
  assert.doesNotMatch(stateText, new RegExp(secret));

  assert.equal(await main(["report"], root), 0);
  for (const name of ["dossier.json", "dossier.md", "dossier.html"]) {
    const report = await readFile(path.join(root, ".rundossier", "out", name), "utf8");
    assert.doesNotMatch(report, new RegExp(secret));
    assert.match(report, /REDACTED:fixture/);
  }
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
