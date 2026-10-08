import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { assertResolvedThreads, evaluateRequiredChecks, selectMergedPullRequest, waitForRequiredChecks } from '../scripts/wait-for-production-checks.mjs';

const sha = 'a'.repeat(40);
const checked = name => ({ name, id: 1, status: 'completed', conclusion: 'success' });
const required = ['validate', 'osv-scan', 'Codex Review'];

test('production refuses a missing, failed or newer unfinished AI check', () => {
  assert.deepEqual(evaluateRequiredChecks(required.map(checked), required), { missing: [], pending: [], failed: [] });
  assert.deepEqual(evaluateRequiredChecks(required.slice(0, 2).map(checked), required).missing, ['Codex Review']);
  const checks = [...required.map(checked), { ...checked('Codex Review'), id: 2, conclusion: 'failure' }];
  assert.equal(evaluateRequiredChecks(checks, required).failed[0].name, 'Codex Review');
  checks[3].status = 'in_progress';
  assert.deepEqual(evaluateRequiredChecks(checks, required).pending, ['Codex Review']);
});

test('only the exact merged main revision can identify a production PR', () => {
  const pull = { number: 3, merged_at: '2026-10-08', base: { ref: 'main' }, head: { sha }, merge_commit_sha: sha };
  assert.equal(selectMergedPullRequest([pull], sha).number, 3);
  assert.equal(selectMergedPullRequest([pull], 'b'.repeat(40)), undefined);
  assert.equal(selectMergedPullRequest([{ ...pull, merged_at: null }], sha), undefined);
  assert.equal(selectMergedPullRequest([{ ...pull, base: { ref: 'other' } }], sha), undefined);
});

test('pending checks time out and failed checks stop without waiting', async () => {
  let requests = 0;
  const api = { request: async () => { requests++; return { check_runs: [] }; } };
  await assert.rejects(waitForRequiredChecks({ api, sha, requiredNames: required, attempts: 2, intervalMs: 0 }), /timeout/);
  assert.equal(requests, 2);
  api.request = async () => ({ check_runs: [{ ...checked('validate'), conclusion: 'failure' }] });
  await assert.rejects(waitForRequiredChecks({ api, sha, requiredNames: required }), /Required checks failed/);
});

test('all thread pages must be resolved and unverifiable responses fail closed', async () => {
  let page = 0;
  const api = { repository: 'kiaquila/wishes', request: async () => ({ data: { repository: { pullRequest: {
    reviewThreads: { nodes: [{ isResolved: page++ === 0 }], pageInfo: { hasNextPage: page === 1, endCursor: 'next' } }
  } } } }) };
  await assert.rejects(assertResolvedThreads(api, 3), /unresolved/);
  assert.equal(page, 2);
  api.request = async () => ({ errors: [{ message: 'forbidden' }] });
  await assert.rejects(assertResolvedThreads(api, 3), /Could not verify/);
  api.request = async () => ({ data: { repository: { pullRequest: { reviewThreads: {
    nodes: [], pageInfo: { hasNextPage: false, endCursor: null }
  } } } } });
  await assertResolvedThreads(api, 3);
});

test('the SSH entrypoint refuses shells, injected commands and short SHAs', () => {
  for (const command of ['bash', 'deploy abc', `deploy ${sha}; id`, `deploy ${sha}\nwhoami`, '']) {
    const result = spawnSync('bash', ['production/ssh-command.sh'], {
      env: { ...process.env, SSH_ORIGINAL_COMMAND: command }, encoding: 'utf8'
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Only deploy/);
  }
});
