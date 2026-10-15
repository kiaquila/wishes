import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { assertProjectCIProvenance, assertCodexCheckProvenance, assertTrustedCodexEvidence, assertResolvedThreads, evaluateRequiredChecks, selectMergedPullRequest, waitForRequiredChecks } from '../scripts/wait-for-production-checks.mjs';
import { createCodexReviewRequestMarkerBody } from '../scripts/codex-review-helpers.mjs';

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

test('a same-named success from another workflow cannot authenticate the AI gate', async () => {
  const check = { ...checked('Codex Review'), head_sha: sha, app: { slug: 'github-actions' },
    details_url: 'https://github.com/kiaquila/wishes/actions/runs/42/job/7' };
  const run = { workflow_id: 99, path: '.github/workflows/fake.yml', conclusion: 'success', event: 'pull_request',
    head_sha: sha, repository: { full_name: 'kiaquila/wishes' } };
  const job = { name: 'Codex Review', conclusion: 'success',
    check_run_url: 'https://api.github.com/repos/kiaquila/wishes/check-runs/1' };
  const api = { repository: 'kiaquila/wishes', request: async path =>
    path.endsWith('/workflows/codex-review.yml') ? { id: 10, path: '.github/workflows/codex-review.yml' } :
      path.includes('check-runs?') ? { check_runs: [check] } : path.includes('/jobs?') ? { jobs: [job] } : run };
  await assert.rejects(assertCodexCheckProvenance(api, sha), /canonical workflow identity/);
  run.path = '.github/workflows/codex-review.yml@spoof.yml';
  await assert.rejects(assertCodexCheckProvenance(api, sha), /canonical workflow identity/);
  run.path = '.github/workflows/codex-review.yml';
  run.workflow_id = 10;
  job.check_run_url += '99';
  await assert.rejects(assertCodexCheckProvenance(api, sha), /trusted gate job/);
  job.check_run_url = 'https://api.github.com/repos/kiaquila/wishes/check-runs/1';
  await assertCodexCheckProvenance(api, sha);
  run.path += '@refs/heads/main';
  await assertCodexCheckProvenance(api, sha);
});

test('production independently requires the owner request, marker and current-head bot evidence', async () => {
  const requestedAt = '2026-10-08T20:00:00Z';
  const command = { id: 1, created_at: requestedAt, user: { login: 'owner', type: 'User' },
    author_association: 'OWNER', body: `@codex review ${sha}` };
  const marker = { id: 2, user: { login: 'github-actions[bot]' }, body: createCodexReviewRequestMarkerBody({
    headSha: sha, requestId: 'r', sourceCommentId: '1', sourceCommentCreatedAt: requestedAt, requestedAt }) };
  const bot = { id: 3, created_at: '2026-10-08T20:01:00Z', user: { login: 'chatgpt-codex-connector[bot]' },
    body: `Codex Review: Didn't find any major issues.\n**Reviewed commit:** \`${sha.slice(0,10)}\`` };
  let comments = [command, marker];
  let reviews = [];
  const api = { repository: 'kiaquila/wishes', request: async path =>
    path.includes('/issues/') ? comments : path.includes('/reviews?') ? reviews : [] };
  const pull = { number: 2, head: { sha } };
  await assert.rejects(assertTrustedCodexEvidence(api, pull), /trusted Codex bot/);
  comments.push({ ...bot, user: { login: 'spoof' } });
  await assert.rejects(assertTrustedCodexEvidence(api, pull), /trusted Codex bot/);
  comments = [command, marker, bot];
  await assertTrustedCodexEvidence(api, pull);
  reviews = [{ id: 4, commit_id: sha, user: bot.user, state: 'CHANGES_REQUESTED', submitted_at: '2026-10-08T20:02:00Z' }];
  await assert.rejects(assertTrustedCodexEvidence(api, pull), /blocking/);
  reviews = [];
  comments = [marker, bot];
  await assert.rejects(assertTrustedCodexEvidence(api, pull), /request/);
});

test('a duplicate Project CI workflow and unrelated same-named checks cannot release production', async () => {
  const run = { id: 42, workflow_id: 10, path: '.github/workflows/ci.yml', head_sha: sha, event: 'push', head_branch: 'main',
    status: 'completed', conclusion: 'success', repository: { full_name: 'kiaquila/wishes' } };
  const checks = ['validate', 'osv-scan'].map((name, index) => ({ ...checked(name), id: index + 1,
    head_sha: sha, app: { slug: 'github-actions' } }));
  const jobs = checks.map(check => ({ name: check.name, status: 'completed', conclusion: 'success',
    check_run_url: `https://api.github.com/repos/kiaquila/wishes/check-runs/${check.id}` }));
  const api = { repository: 'kiaquila/wishes', request: async path =>
    path.endsWith('/workflows/ci.yml') ? { id: 10, path: '.github/workflows/ci.yml' } :
      path.includes('/workflows/ci.yml/runs?') ? { workflow_runs: [run] } :
      path.includes('/jobs?') ? { jobs } : { check_runs: checks } };
  await assert.rejects(assertProjectCIProvenance(api, sha, 'push', '99'), /canonical Project CI/);
  run.conclusion = 'failure';
  await assert.rejects(assertProjectCIProvenance(api, sha, 'push', '42'), /canonical Project CI/);
  run.conclusion = 'success';
  jobs[0].check_run_url += '99';
  await assert.rejects(assertProjectCIProvenance(api, sha, 'push', '42'), /validate does not belong/);
  jobs[0].check_run_url = 'https://api.github.com/repos/kiaquila/wishes/check-runs/1';
  await assertProjectCIProvenance(api, sha, 'push', '42');
  run.path += '@main';
  await assertProjectCIProvenance(api, sha, 'push');
  run.event = 'pull_request';
  await assertProjectCIProvenance(api, sha, 'pull_request');
  await assert.rejects(assertProjectCIProvenance(api, sha), /canonical Project CI/);

  // A missing push event can be recovered by running the same CI on main.
  run.event = 'workflow_dispatch';
  await assertProjectCIProvenance(api, sha, 'main', '42');
  run.head_branch = 'feature';
  await assert.rejects(assertProjectCIProvenance(api, sha), /canonical Project CI/);
  run.head_branch = 'main';
  run.head_sha = 'b'.repeat(40);
  await assert.rejects(assertProjectCIProvenance(api, sha), /canonical Project CI/);
  run.head_sha = sha;
  run.repository.full_name = 'untrusted/fork';
  await assert.rejects(assertProjectCIProvenance(api, sha), /canonical Project CI/);
  run.repository.full_name = 'kiaquila/wishes';
  await assert.rejects(assertProjectCIProvenance(api, sha, 'main', '99'), /canonical Project CI/);
  run.conclusion = 'failure';
  await assert.rejects(assertProjectCIProvenance(api, sha), /canonical Project CI/);
  run.conclusion = 'success';
  run.workflow_id = 99;
  await assert.rejects(assertProjectCIProvenance(api, sha), /canonical workflow identity/);
  run.workflow_id = 10;
  jobs[0].check_run_url += '99';
  await assert.rejects(assertProjectCIProvenance(api, sha), /validate does not belong/);
  jobs[0].check_run_url = 'https://api.github.com/repos/kiaquila/wishes/check-runs/1';
  await assert.rejects(assertProjectCIProvenance(api, sha, 'repository_dispatch'), /Untrusted Project CI event/);
});
