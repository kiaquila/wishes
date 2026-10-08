# wishes

Private repository with an agent development harness adapted from
`kiaquila/ks` at commit `3599591bf5d75d88e60a6e87d097e182f314a32e`.
No application, product documents, assets, hosting configuration, or production
credentials were imported.

The harness includes agent coordination rules, repository guardrails,
SHA-pinned CI, OSV dependency scanning, a current-head Codex Review gate,
CODEOWNERS, a PR template, and Dependabot version updates.

```bash
npm ci --ignore-scripts
npm run preflight
```

See `AGENTS.md`, `docs/agent-development.md`, and `docs/security.md` for the
development workflow. Bootstrap mode validates infrastructure only. Configure
real application checks when implementation begins.
