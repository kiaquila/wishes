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
Application checks include Chromium regressions through the same `node:test`
runner. After `npm ci --ignore-scripts`, install the headless browser once with
`npx --no-install playwright install --with-deps --only-shell chromium` (CI does
this explicitly). `npm run build && npm run test:browser` runs only this suite.
The locked, Apache-2.0 Playwright packages are development dependencies; neither
the library nor the browser is shipped in the static site. Tests use loopback
requests only and require no external service, credentials or persistent profile.
The repository guard checks required infrastructure, secret patterns, personal
paths, generated directories, symbolic links, workflow permissions, and action
SHA pins. CI also scans dependencies with OSV and fails on vulnerabilities.

`agent-development.config.json` uses the `implementation` phase with the
application build, tests and production-script checks in `projectChecks`.
Keep these commands aligned with the application. `check-delivery-speed.mjs`
compares the built site's delivery with the measured wishlist baseline in
`docs/delivery-baseline.json`; explain any intentional baseline update in the PR.

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

The repository is public. The agent workflow and scheduled task require
`validate`, `osv-scan`, and `Codex Review` to pass before merging; these are
development policy, not an installed server-side protection rule.

The GitHub Codex integration must have access to this repository to
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
