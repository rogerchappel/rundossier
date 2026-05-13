# rundossier Tasks

## MVP delivery
- [x] Scaffold Node/TypeScript CLI package.
- [x] Implement `rundossier init` for `.rundossier/config.json`.
- [x] Implement `rundossier run -- <cmd>` with stdout/stderr snippets, duration, exit code, cwd, allowlisted env, and git summary.
- [x] Implement `rundossier collect` with file/artifact glob hashing.
- [x] Implement `rundossier report` with Markdown, JSON, and self-contained HTML output.
- [x] Add default redaction for tokens, bearer headers, assignments, and private keys.
- [x] Add fixture-backed tests and CLI smoke coverage.
- [x] Document safety, examples, and contribution flow.

## Follow-up candidates
- [ ] Add JUnit and GitHub Actions summary importers.
- [ ] Add SARIF-style machine-readable validation metadata.
- [ ] Add optional zip packaging for dossier bundles.
- [ ] Add richer HTML rendering beyond escaped Markdown.
