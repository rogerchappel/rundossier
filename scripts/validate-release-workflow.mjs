import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../.github/workflows/release.yml', import.meta.url), 'utf8');
const ciWorkflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');

assert.match(ciWorkflow, /npm run release:workflow(?:\s|$)/,
  'general CI must validate the release workflow contract for every pull request');

const job = (name, nextName) => {
  const start = workflow.indexOf(`  ${name}:\n`);
  assert.notEqual(start, -1, `missing ${name} job`);
  const end = nextName ? workflow.indexOf(`  ${nextName}:\n`, start + 1) : workflow.length;
  assert.notEqual(end, -1, `missing ${nextName} job`);
  return workflow.slice(start, end);
};

assert.doesNotMatch(workflow.slice(0, workflow.indexOf('jobs:')), /^permissions:/m,
  'workflow must not grant publication permissions globally');

const verify = job('verify', 'publish-npm');
assert.match(verify, /permissions:\n      contents: read\n/);
assert.doesNotMatch(verify, /contents: write|id-token: write/);
assert.match(verify, /npm run release:check/);
assert.match(verify, /npm pack/);
assert.match(verify, /RELEASE_NOTES\.md/);
assert.match(verify, /actions\/upload-artifact@v4/);

const npm = job('publish-npm', 'publish-github');
assert.match(npm, /needs: verify/);
assert.match(npm, /permissions:\n      contents: read\n      id-token: write\n/);
assert.doesNotMatch(npm, /contents: write|actions\/checkout|npm (ci|pack)|release:check/);
assert.match(npm, /actions\/download-artifact@v5/);
assert.match(npm, /npm publish \.\/\*\.tgz --provenance --access public/);

const github = job('publish-github');
assert.match(github, /needs: verify/);
assert.match(github, /permissions:\n      contents: write\n/);
assert.doesNotMatch(github, /id-token: write|actions\/checkout|npm (ci|pack)|release:check/);
assert.match(github, /actions\/download-artifact@v5/);
assert.match(github, /gh release create .*--notes-file RELEASE_NOTES\.md \.\/\*\.tgz/);

console.log('release workflow permission and artifact contract is valid');
