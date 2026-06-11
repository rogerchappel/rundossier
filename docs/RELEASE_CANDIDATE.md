# Release Candidate Notes

## Scope

- Adds richer run summaries with total duration and dirty git snapshot counts.
- Adds `rundossier status` for quick local and automation checks.
- Documents the agent skill workflow, approvals, and side-effect boundaries.

## Verification

Run before merging:

```bash
npm run check
npm test
npm run smoke
npm run package:smoke
bash scripts/validate.sh
```

## Classification

Ship. The project now gives agents a faster failure signal before generating or sharing a dossier.
