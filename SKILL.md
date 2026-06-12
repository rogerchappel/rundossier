# rundossier Skill

Use this skill when an agent or developer needs to hand off local run evidence: commands run, exit codes, git state, hashed files, artifacts, and a portable Markdown/JSON/HTML dossier.

## Required Inputs

- A local project checkout.
- Node.js 20 or newer.
- Commands that are safe to run locally and capture.

## Side-Effect Boundaries

- `rundossier init` writes `.rundossier/config.json`.
- `rundossier run -- <cmd>` executes the provided command and appends redacted evidence to `.rundossier/state.json`.
- `rundossier collect` hashes configured files and artifacts.
- `rundossier report` writes dossier outputs under `.rundossier/out/`.
- The tool does not upload data, publish artifacts, mutate remotes, or scrape chat transcripts.

## Approval Requirements

- Ask before running commands with external side effects.
- Ask before sharing generated dossiers outside the local machine.
- Review `.rundossier/config.json` before allowlisting environment variables.

## Examples

```bash
rundossier init
rundossier run -- npm test
rundossier collect
rundossier status
rundossier report
```

## Validation Workflow

1. Initialize or review `.rundossier/config.json`.
2. Capture each verification command with `rundossier run --`.
3. Run `rundossier collect` after builds or tests create artifacts.
4. Run `rundossier status`; non-zero means at least one captured command failed.
5. Generate reports and attach the Markdown summary to the handoff or PR.
