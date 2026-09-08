import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

assert.equal(manifest.engines?.node, '>=20', 'package must declare Node 20 as the minimum runtime');
assert.match(workflow, /strategy:\s*\n\s+fail-fast: false\s*\n\s+matrix:\s*\n\s+node: \[20, 24\]/,
  'CI must use a non-fail-fast Node 20 and 24 matrix');
assert.match(workflow, /name: Repository hygiene \(Node \$\{\{ matrix\.node \}\}\)/,
  'CI jobs must identify the tested Node version');
assert.match(workflow, /uses: actions\/setup-node@v6\s*\n\s+with:\s*\n\s+node-version: \$\{\{ matrix\.node \}\}\s*\n\s+cache: npm/,
  'setup-node must select each matrix runtime and enable npm caching');
assert.match(workflow, /npm run release:check(?:\s|$)/,
  'CI must run the complete repository release check');
assert.match(manifest.scripts?.test ?? '', /node --test dist\/tests\/\*\.test\.js/,
  'test discovery must remain compatible with Node 20');

console.log('CI runtime matrix contract is valid');
