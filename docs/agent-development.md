# Agent development

## Working together

The coordinating agent breaks work into independent tasks, assigns file
ownership, and integrates results. Workers use separate branches/worktrees
when isolation is needed and report verification evidence. Shared files and
lockfiles have one owner at a time. Every contributor follows `AGENTS.md`.

Persistent worktrees live under `worktrees/` inside this repository and are
ignored. Local orchestrator state, temporary handoffs, and generated artifacts
are ignored; durable development decisions may be committed as focused docs.

## Checks

`npm run preflight` runs repository policy, harness regression tests, and the
configured project commands. Command arrays execute directly without a shell.
The repository guard checks required infrastructure, secret patterns, personal
paths, generated directories, symbolic links, workflow permissions, and action
SHA pins. CI also scans dependencies with OSV and fails on vulnerabilities.

`agent-development.config.json` starts in `bootstrap` phase with no application
checks. On the first application change, switch to `implementation`, add the
real build/tests, and configure `performance` for web delivery checks. The
inherited `check-delivery-speed.mjs` can compare a built site's delivery with
an explicitly recorded baseline; there is no copied product baseline.

## Pull request review

Before opening a PR, inspect the diff, run preflight, and describe the change,
reason, and evidence using the PR template. Request Codex review with
`@codex review <40-character-current-head-sha>` from a trusted user account.

`codex-review-request.yml` records a trusted marker for that SHA;
`codex-review.yml` verifies subsequent Codex evidence using trusted default
branch scripts; `codex-review-rerun.yml` revalidates after the bot responds.
Fix P0–P2 findings and request a new review after any head change. Resolve every
review thread. Merge only with current green required checks and a mergeable
PR; never spoof checks or bypass protection.

The GitHub Codex integration must have access to this private repository to
respond to requests. These workflows validate real review evidence; they do
not run an AI model themselves or require a copied API secret.

## Dependency maintenance

Dependabot checks GitHub Actions and the root npm manifest every Monday at
07:00 UTC. Minor/patch updates are grouped; major updates stay separate.
Actions cool down for 7 days; npm uses 14/7/3 days for major/minor/patch.

The local Codex scheduled task reviews and merges eligible Dependabot PRs on
Tuesdays and Fridays at 10:00 in Buenos Aires. It processes PRs sequentially,
avoids duplicate work within the day, requests real Codex review, waits two
minutes after all gates are green, and refreshes GitHub before merging.
