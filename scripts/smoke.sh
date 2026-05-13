#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cp -R "$ROOT/fixtures/sample-project/." "$TMP/"
cd "$TMP"
node "$ROOT/dist/cli.js" init
node "$ROOT/dist/cli.js" run -- node tests/pass.js
node "$ROOT/dist/cli.js" collect
node "$ROOT/dist/cli.js" report
for file in .rundossier/out/dossier.md .rundossier/out/dossier.json .rundossier/out/dossier.html; do
  test -s "$file"
done
if grep -R "super-secret" .rundossier; then
  echo "secret was not redacted" >&2
  exit 1
fi
