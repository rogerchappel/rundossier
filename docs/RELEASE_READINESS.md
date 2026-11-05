# Release readiness checklist

Use this checklist before creating a version tag. Do not create a tag as part of readiness review: pushing a matching `v*.*.*` tag starts `.github/workflows/release.yml` and can publish publicly.

## Before tagging

- [ ] Run `npm ci` with the supported Node.js version (the workflow uses Node 22; `package.json` requires Node >=20).
- [ ] Run `npm run release:check`. This runs `check`, `test`, `smoke`, `package:smoke`, `ci:workflow`, and `release:workflow`.
- [ ] Confirm the workflow's ReleaseBox readiness check succeeds for the candidate and review generated release notes.
- [ ] Confirm the package contents with `npm pack --dry-run` (the workflow later builds the actual tarball).
- [ ] Confirm `package.json` version and intended tag match; review the candidate changes and ensure the default branch contains them.
- [ ] Confirm GitHub Actions is permitted to use npm trusted publishing via `id-token: write`, and has `contents: write` permission to create the GitHub release. These permissions are exercised by the tag-triggered jobs, not by a pull request.

## Tag-trigger consequences

The workflow runs only on pushes of tags matching `v*.*.*`. Its `verify` job installs dependencies, builds ReleaseBox, runs its readiness check, runs `npm run release:check`, builds the package, and creates release notes. On success, dependent jobs download the artifacts and (1) run `npm publish` to the public npm registry with provenance, and (2) run `gh release create` with the notes and package artifact. A successful verification alone does not publish; a matching tag push is the activation event and may cause both publication jobs to run.

Never use a test tag for rehearsal. Rehearse only the non-publishing checks locally or in a pull request. A tag push is an external publication action and requires the normal maintainer authorization and publication permissions.
