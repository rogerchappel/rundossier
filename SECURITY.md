# Security Policy

`rundossier` is local-first evidence tooling. It should never require credentials for normal use and should never upload captured data.

## Secret handling

- Environment capture is allowlist-only.
- Default redaction covers common token assignments, GitHub tokens, bearer headers, and private keys.
- Output snippets are line-limited.
- Generated dossiers can still contain project-sensitive paths or filenames, so review before sharing publicly.

## Reporting vulnerabilities

Please open a GitHub security advisory or contact the maintainer privately if you find a redaction bypass, unsafe file capture default, or command execution issue.

Include reproduction steps and whether the issue affects generated reports, `.rundossier/state.json`, or both.
