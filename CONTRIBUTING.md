# Contributing

Thanks for helping make local run evidence boring, portable, and safe.

## Local workflow

```bash
npm install
npm run check
npm test
npm run smoke
bash scripts/validate.sh
```

## Pull request checklist

- Link the issue or describe the reviewer/user need.
- Add or update fixture-backed tests for behavior changes.
- Keep redaction and local-first guarantees intact.
- Update README/docs when command behavior changes.
- Include a short smoke result in the PR description.

## Design principles

- Prefer deterministic local files over services.
- Prefer explicit allowlists over broad capture.
- Prefer small evidence packets over full logs.
- Keep the CLI useful for both humans and agents.
