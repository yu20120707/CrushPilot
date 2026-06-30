import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const provenancePath = path.join(
  rootDir,
  'apps/electron/default-skills/private-communication-coach/THIRD_PARTY_PROVENANCE.json',
);
const thirdPartyDir = path.join(rootDir, 'third_party');

function run(command, args, options = {}) {
  const output = execFileSync(command, args, {
    cwd: options.cwd ?? rootDir,
    encoding: 'utf8',
    stdio: options.stdio ?? ['ignore', 'pipe', 'pipe'],
  });
  return typeof output === 'string' ? output.trim() : '';
}

function isGitRepo(repoDir) {
  try {
    run('git', ['-C', repoDir, 'rev-parse', '--git-dir']);
    return true;
  } catch {
    return false;
  }
}

function assertClean(repoDir, name) {
  const status = run('git', ['-C', repoDir, 'status', '--porcelain']);
  if (status) {
    throw new Error(
      `Refusing to update ${name}: existing checkout has uncommitted changes:\n${status}`,
    );
  }
}

function checkoutRepo(repo) {
  const name = repo.name;
  const repoUrl = repo.repoUrl;
  const commitHash = repo.commitHash;

  if (!name || !repoUrl || !commitHash) {
    throw new Error(`Invalid provenance entry: ${JSON.stringify(repo)}`);
  }
  if (/pywxdump/i.test(name) || /pywxdump/i.test(repoUrl)) {
    throw new Error(`Refusing to bootstrap disallowed repo: ${name} ${repoUrl}`);
  }

  const repoDir = path.join(thirdPartyDir, name);
  fs.mkdirSync(thirdPartyDir, { recursive: true });

  let status = 'updated';
  if (!fs.existsSync(repoDir)) {
    run('git', ['clone', repoUrl, repoDir], { stdio: 'inherit' });
    status = 'cloned';
  } else {
    if (!isGitRepo(repoDir)) {
      throw new Error(`Refusing to update ${name}: ${repoDir} exists but is not a git repository`);
    }
    assertClean(repoDir, name);
    run('git', ['-C', repoDir, 'fetch', '--all', '--tags', '--prune'], { stdio: 'inherit' });
  }

  assertClean(repoDir, name);
  run('git', ['-C', repoDir, 'checkout', '--detach', commitHash], { stdio: 'inherit' });
  const actual = run('git', ['-C', repoDir, 'rev-parse', 'HEAD']);
  if (actual !== commitHash) {
    throw new Error(`Checkout mismatch for ${name}: expected ${commitHash}, got ${actual}`);
  }

  console.log(`${name}\t${commitHash}\t${status}`);
}

if (!fs.existsSync(provenancePath)) {
  throw new Error(`Missing provenance file: ${provenancePath}`);
}

const provenance = JSON.parse(fs.readFileSync(provenancePath, 'utf8'));
if (!Array.isArray(provenance.repos)) {
  throw new Error('Invalid provenance file: expected repos array');
}

for (const repo of provenance.repos) {
  checkoutRepo(repo);
}
