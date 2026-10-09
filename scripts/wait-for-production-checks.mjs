#!/usr/bin/env node

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  isAcceptableCodexSummaryComment, isStrictlyAfterCodexReviewRequest,
  latestCodexNativeReviewResult, latestCodexReviewRequestMarker,
  latestTrustedCodexReviewCommand
} from './codex-review-helpers.mjs';

const DEFAULT_INTERVAL_MS = 15_000;
const DEFAULT_ATTEMPTS = 120;

// Contexts this repository actually publishes on a push to main. The
// production deploy workflow must never list itself here.
export const PUSH_CHECKS = Object.freeze([
  "validate",
  "osv-scan"
]);

// Codex Review is a pull-request gate, so it is verified on the reviewed head
// rather than on the merge commit.
export const PULL_REQUEST_CHECKS = Object.freeze([
  ...PUSH_CHECKS,
  "Codex Review"
]);

export function latestChecksByName(checkRuns) {
  const latest = new Map();
  for (const check of checkRuns ?? []) {
    if (!check?.name) continue;
    const previous = latest.get(check.name);
    if (!previous || Number(check.id) > Number(previous.id)) {
      latest.set(check.name, check);
    }
  }
  return latest;
}

export function evaluateRequiredChecks(checkRuns, requiredNames) {
  const latest = latestChecksByName(checkRuns);
  const missing = [];
  const pending = [];
  const failed = [];

  for (const name of requiredNames) {
    const check = latest.get(name);
    if (!check) missing.push(name);
    else if (check.status !== "completed") pending.push(name);
    else if (check.conclusion !== "success") {
      failed.push({
        name,
        conclusion: check.conclusion ?? "unknown",
        url: check.details_url ?? ""
      });
    }
  }

  return { missing, pending, failed };
}

export function selectMergedPullRequest(pullRequests, targetSha, baseBranch = "main") {
  return (pullRequests ?? [])
    .filter((pull) => pull?.merged_at && pull?.base?.ref === baseBranch && pull?.head?.sha &&
      pull.merge_commit_sha === targetSha)
    .sort((left, right) => String(right.merged_at).localeCompare(String(left.merged_at)))[0];
}

class GitHubApi {
  constructor(repository, token) {
    if (!/^[^/]+\/[^/]+$/.test(repository ?? "")) {
      throw new Error("GITHUB_REPOSITORY must have the owner/repository form");
    }
    if (!token) throw new Error("GITHUB_TOKEN is required");
    this.repository = repository;
    this.token = token;
  }

  async request(path, options = {}) {
    const response = await fetch(`https://api.github.com${path}`, {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28"
      }
    });
    const body = await response.json();
    if (!response.ok) {
      throw new Error(
        `GitHub API GET ${path} failed: ${response.status} ${body?.message ?? response.statusText}`
      );
    }
    return body;
  }
}

export async function assertResolvedThreads(api, number) {
  const [owner, name] = api.repository.split('/');
  let cursor = null;
  do {
    const response = await api.request('/graphql', {
      method: 'POST',
      body: JSON.stringify({
        query: `query($owner:String!,$name:String!,$number:Int!,$cursor:String) {
          repository(owner:$owner,name:$name) { pullRequest(number:$number) {
            reviewThreads(first:100,after:$cursor) {
              nodes { id isResolved }
              pageInfo { hasNextPage endCursor }
            }
          } }
        }`,
        variables: { owner, name, number, cursor }
      })
    });
    const threads = response.data?.repository?.pullRequest?.reviewThreads;
    if (response.errors || !threads?.nodes || !threads.pageInfo) {
      throw new Error('Could not verify pull-request review threads.');
    }
    if (threads.nodes.some(thread => !thread.isResolved)) {
      throw new Error(`PR #${number} has unresolved review threads.`);
    }
    cursor = threads.pageInfo.hasNextPage ? threads.pageInfo.endCursor : null;
    if (threads.pageInfo.hasNextPage && !cursor) throw new Error('Missing review-thread page cursor.');
  } while (cursor);
}

async function listPaginated(api, path) {
  const items = [];
  for (let page = 1; ; page++) {
    const batch = await api.request(`${path}?per_page=100&page=${page}`);
    if (!Array.isArray(batch)) throw new Error('Invalid GitHub evidence response.');
    items.push(...batch);
    if (batch.length < 100) return items;
  }
}

export async function assertTrustedCodexEvidence(api, pull) {
  const base = `/repos/${api.repository}`;
  const comments = await listPaginated(api, `${base}/issues/${pull.number}/comments`);
  const marker = latestCodexReviewRequestMarker(comments, pull.head.sha);
  const command = latestTrustedCodexReviewCommand(comments, [], pull.head.sha);
  if (!marker || !command || marker.sourceCommentId !== command.sourceCommentId ||
      marker.sourceCommentCreatedAt !== command.sourceCommentCreatedAt) {
    throw new Error('Missing trusted current-head Codex request and matching marker.');
  }
  const [reviews, reviewComments] = await Promise.all([
    listPaginated(api, `${base}/pulls/${pull.number}/reviews`),
    listPaginated(api, `${base}/pulls/${pull.number}/comments`)
  ]);
  const result = latestCodexNativeReviewResult(
    reviews.filter(review => isStrictlyAfterCodexReviewRequest(review.submitted_at, marker)),
    reviewComments, pull.head.sha
  );
  if (result === 'fail' || (result !== 'pass' && !comments.some(comment =>
    isAcceptableCodexSummaryComment(comment, pull.head.sha, command.sourceCommentCreatedAt, command.sourceCommentId)))) {
    throw new Error('Missing or blocking current-head evidence from the trusted Codex bot.');
  }
}

export async function assertCodexCheckProvenance(api, sha) {
  const check = latestChecksByName(await checkRuns(api, sha)).get('Codex Review');
  const prefix = `https://github.com/${api.repository}/actions/runs/`;
  const suffix = check?.details_url?.startsWith(prefix) ? check.details_url.slice(prefix.length) : '';
  const runId = suffix.match(/^(\d+)(?:\/job\/\d+)?$/)?.[1];
  if (check?.app?.slug !== 'github-actions' || !runId || check.head_sha !== sha) {
    throw new Error('Codex check has untrusted provenance.');
  }
  const run = await api.request(`/repos/${api.repository}/actions/runs/${runId}`);
  if (run.path !== '.github/workflows/codex-review.yml' || run.conclusion !== 'success' ||
      run.repository?.full_name !== api.repository) throw new Error('Codex check is not from the trusted gate workflow.');
  if (run.event === 'pull_request' && run.head_sha === sha) {
    const jobs = await api.request(`/repos/${api.repository}/actions/runs/${runId}/jobs?per_page=100`);
    if (!jobs.jobs?.some(job => job.name === 'Codex Review' &&
      job.check_run_url === `https://api.github.com/repos/${api.repository}/check-runs/${check.id}` &&
      job.conclusion === 'success')) throw new Error('Codex check does not belong to the trusted gate job.');
  } else if (!(run.event === 'workflow_dispatch' && run.head_branch === 'main')) {
    throw new Error('Codex gate ran on an untrusted event or revision.');
  }
}

const delay = (milliseconds) =>
  new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));

async function checkRuns(api, sha) {
  const encodedSha = encodeURIComponent(sha);
  const response = await api.request(
    `/repos/${api.repository}/commits/${encodedSha}/check-runs?filter=latest&per_page=100`
  );
  return response.check_runs ?? [];
}

export async function waitForRequiredChecks({
  api,
  sha,
  requiredNames,
  attempts = DEFAULT_ATTEMPTS,
  intervalMs = DEFAULT_INTERVAL_MS,
  wait = delay
}) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const state = evaluateRequiredChecks(await checkRuns(api, sha), requiredNames);
    if (state.failed.length > 0) {
      const details = state.failed
        .map(({ name, conclusion, url }) => `${name}: ${conclusion}${url ? ` (${url})` : ""}`)
        .join("; ");
      throw new Error(`Required checks failed for ${sha}: ${details}`);
    }
    if (state.missing.length === 0 && state.pending.length === 0) return;

    if (attempt === 1 || attempt % 8 === 0) {
      console.log(
        `Waiting for checks on ${sha} (${attempt}/${attempts}); ` +
          `missing: ${state.missing.join(", ") || "none"}; ` +
          `pending: ${state.pending.join(", ") || "none"}`
      );
    }
    if (attempt < attempts) await wait(intervalMs);
  }
  throw new Error(`Required checks did not complete for ${sha} before the polling timeout`);
}

async function main() {
  const repository = process.env.GITHUB_REPOSITORY;
  const targetSha = process.env.TARGET_SHA?.trim();
  if (!/^[a-f0-9]{40}$/.test(targetSha ?? "")) {
    throw new Error("TARGET_SHA must be a full hexadecimal commit SHA");
  }

  const api = new GitHubApi(repository, process.env.GITHUB_TOKEN);
  await waitForRequiredChecks({ api, sha: targetSha, requiredNames: PUSH_CHECKS });

  const pullRequests = await api.request(
    `/repos/${repository}/commits/${encodeURIComponent(targetSha)}/pulls?per_page=100`
  );
  const pullRequest = selectMergedPullRequest(pullRequests, targetSha);
  if (!pullRequest) {
    throw new Error(
      `Production revision ${targetSha} is not associated with a merged pull request into main`
    );
  }

  await waitForRequiredChecks({
    api,
    sha: pullRequest.head.sha,
    requiredNames: PULL_REQUEST_CHECKS,
    attempts: 1,
    intervalMs: 0
  });
  await assertCodexCheckProvenance(api, pullRequest.head.sha);
  await assertTrustedCodexEvidence(api, pullRequest);
  await assertResolvedThreads(api, pullRequest.number);
  const latest = await api.request(`/repos/${repository}/commits/main`);
  if (latest.sha !== targetSha) throw new Error(`Stale production candidate: main is ${latest.sha}.`);
  console.log(
    `Production gates passed for ${targetSha} from merged PR #${pullRequest.number} ` +
      `at reviewed head ${pullRequest.head.sha}.`
  );
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
