# rundossier PRD

Status: in-progress

## One-liner
`rundossier` turns messy local agent/dev runs into portable evidence packets: commands, exit codes, touched files, git facts, test summaries, and a tiny HTML/Markdown dossier. 🗂️

## Problem
Agentic coding runs often end with "it passed locally" but no durable proof. Reviewers and future agents need a compact, reproducible trail without uploading logs to a SaaS.

## Users
- Developers handing work to another human or agent.
- Maintainers validating OSS factory projects.
- CI/local-first teams who need receipts without telemetry.

## MVP
- Node/TypeScript CLI.
- `rundossier init` creates `.rundossier/config.json`.
- `rundossier run -- <cmd>` executes a command, captures stdout/stderr snippets, duration, exit code, cwd, env allowlist, and git HEAD/status summary.
- `rundossier collect` records file hashes and test artifacts by glob.
- `rundossier report` emits `dossier.md`, `dossier.json`, and a self-contained `dossier.html`.
- Secret-safe defaults: redact common token patterns and never capture full env unless allowlisted.
- Fixture-backed tests and CLI smokes.

## Non-goals
- Cloud sync, remote execution, or process supervision daemons.
- Replacing CI systems.

## Differentiation
Unlike generic loggers, this is intentionally local-first, deterministic, git-aware, and shaped for agent/human handoffs.

## Sources / attribution
Inspired by recurring OSS Factory handoff needs, StackForge validation patterns, and public GitHub Actions documentation around local/CI evidence and secrets hygiene.
