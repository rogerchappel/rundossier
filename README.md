# rundossier 🗂️

`rundossier` turns messy local agent/dev runs into portable evidence packets: commands, exit codes, touched files, git facts, test summaries, and tiny Markdown/JSON/HTML dossiers.

It is built for the moment after “it passed locally” when a reviewer, maintainer, or future agent needs receipts without uploading logs to a SaaS.

## Install

```bash
npm install -g rundossier
```

Or run from a checkout:

```bash
npm install
npm run build
node dist/cli.js --help
```

## Quick start

```bash
rundossier init
rundossier run -- npm test
rundossier collect
rundossier status
rundossier report
open .rundossier/out/dossier.html
```

Outputs:

- `.rundossier/config.json` — local capture policy
- `.rundossier/state.json` — redacted local evidence state
- `.rundossier/out/dossier.md` — human-readable handoff
- `.rundossier/out/dossier.json` — machine-readable evidence
- `.rundossier/out/dossier.html` — self-contained viewer

## Commands

### `rundossier init`

Creates `.rundossier/config.json` with secret-safe defaults.

### `rundossier run -- <cmd>`

Runs a command and records:

- command argv, cwd, duration, timestamps, and exit code
- stdout/stderr snippets with default redaction
- allowlisted environment variables only
- git HEAD, branch, dirty flag, and status summary

### `rundossier collect`

Hashes configured source files and artifacts with SHA-256. Defaults cover common docs, source, tests, `dist`, `coverage`, and `test-results` paths.

### `rundossier status`

Prints command, failure, duration, file, artifact, and dirty-git summary counts. It exits non-zero when any captured command failed, which makes it useful in local automation.

### `rundossier report`

Writes Markdown, JSON, and HTML dossier outputs under the configured output directory.

## Configuration

Edit `.rundossier/config.json`:

```json
{
  "envAllowlist": ["CI", "NODE_ENV", "GITHUB_SHA"],
  "collect": {
    "files": ["package.json", "src/**/*.{ts,js}"],
    "artifacts": ["coverage/**", "test-results/**"]
  },
  "snippetLines": 80
}
```

## Safety model

- Local-first: no telemetry, cloud sync, or network calls.
- Environment capture is allowlist-only.
- Logs are redacted before persistence.
- Git inspection is read-only.
- You choose whether to share generated dossiers.

## Examples

```bash
rundossier run -- npm run check
rundossier run -- npm test
rundossier collect
rundossier report
```

The dossier becomes a compact handoff packet for PR review, agent continuation, or CI/local parity checks.

## Development

```bash
npm install
npm run check
npm test
npm run smoke
bash scripts/validate.sh
```

## Contributing

Issues and PRs are welcome. Please include the command you ran, expected behavior, actual behavior, and (when safe) a generated `dossier.md` snippet.

## License

MIT
