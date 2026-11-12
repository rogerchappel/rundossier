import type { CommandEvidence, DossierState } from "./types.js";

export interface JUnitSummary {
  suites: number;
  tests: number;
  failures: number;
  errors: number;
  skipped: number;
  durationSeconds: number;
}

/** Parse the aggregate counts from a JUnit XML report without resolving external entities. */
export function parseJUnit(xml: string): JUnitSummary {
  if (typeof xml !== "string" || !xml.trim() || /<!DOCTYPE|<!ENTITY/i.test(xml)) {
    throw new Error("Invalid JUnit XML: empty input or declarations are not supported");
  }
  const elements = [...xml.matchAll(/<(testsuite|testsuites)\b([^>]*)>/gi)];
  if (!elements.length) throw new Error("Invalid JUnit XML: no testsuite element found");
  const attrs = (source: string): Record<string, string> => {
    const result: Record<string, string> = {};
    for (const match of source.matchAll(/([\w.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) result[match[1]!] = match[2] ?? match[3] ?? "";
    return result;
  };
  const number = (value: string | undefined, name: string): number => {
    if (value === undefined || !/^\d+(?:\.\d+)?$/.test(value) || !Number.isFinite(Number(value))) throw new Error(`Invalid JUnit XML: invalid ${name}`);
    return Number(value);
  };
  const suites = elements.filter((match) => match[1]!.toLowerCase() === "testsuite").map((match) => attrs(match[2]!));
  const root = elements.find((match) => match[1]!.toLowerCase() === "testsuites");
  const aggregate = root ? attrs(root[2]!) : undefined;
  const counts = (key: "tests" | "failures" | "errors" | "skipped", fallback = 0) =>
    aggregate?.[key] !== undefined ? number(aggregate[key], key) : suites.reduce((sum, suite) => sum + number(suite[key] ?? String(fallback), key), 0);
  return {
    suites: aggregate ? number(aggregate.testsuites ?? String(suites.length), "testsuites") : suites.length,
    tests: counts("tests"), failures: counts("failures"), errors: counts("errors"), skipped: counts("skipped"),
    durationSeconds: aggregate?.time !== undefined ? number(aggregate.time, "time") : suites.reduce((sum, suite) => sum + number(suite.time ?? "0", "time"), 0)
  };
}

/** Attach parsed JUnit counts to a dossier as a synthetic, successful test command. */
export function importJUnit(state: DossierState, xml: string, source = "junit.xml"): DossierState {
  const summary = parseJUnit(xml);
  const output = `JUnit ${source}: ${summary.tests} tests, ${summary.failures} failures, ${summary.errors} errors, ${summary.skipped} skipped`;
  const command: CommandEvidence = {
    id: `junit-${Date.now()}`, command: ["junit-import", source], cwd: state.projectRoot,
    startedAt: new Date().toISOString(), endedAt: new Date().toISOString(), durationMs: Math.round(summary.durationSeconds * 1000),
    exitCode: summary.failures + summary.errors === 0 ? 0 : 1, stdout: output, stderr: "", env: {},
    git: { head: null, branch: null, dirty: false, status: [] }
  };
  return { ...state, commands: [...state.commands, command], updatedAt: new Date().toISOString() };
}
