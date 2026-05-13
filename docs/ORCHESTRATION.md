# Orchestration Notes

`rundossier` is intentionally a single-process, local-first CLI. It does not run daemons, phone home, or require a service account.

## Command flow
1. `init` writes safe defaults to `.rundossier/config.json`.
2. `run -- <cmd>` executes one child command and appends command evidence to `.rundossier/state.json`.
3. `collect` hashes configured source files and artifacts into the same state file.
4. `report` renders `.rundossier/out/dossier.{md,json,html}`.

## Safety gates
- Environment capture is allowlist-only.
- Logs are snippet-limited and redacted before persistence.
- Reports are generated locally and never uploaded.
- Git commands are read-only summaries.

## Review handoff
Attach or commit the generated dossier outputs only when they are safe for your project. For public OSS, prefer checking the Markdown summary first and keeping raw JSON local unless needed.
