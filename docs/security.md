# Security

- Keep credentials, private keys, sessions, and production data outside Git.
- Declare least-privilege workflow permissions and pin actions to full SHAs.
- Do not use `pull_request_target` to execute candidate code.
- Keep ordinary PR validation free of deployments and external mutations.
- Load trusted review scripts from the default branch; accept review evidence
  only from the exact Codex bot for the current head and trusted request.
- Preserve the complete Codex gate and its regression tests. Never manufacture
  a passing review check, alter evidence, or bypass branch protection.
- Review new dependencies for purpose, provenance, license, privacy, security,
  and failure behavior. Keep OSV failures blocking.
- Enable Dependabot alerts and security updates in GitHub settings; the YAML
  file schedules version updates independently of those settings.
- Use cooldowns, group minor/patch updates, and review major updates separately.
- Resolve findings and review threads before merging. Recheck the current head
  and required checks immediately before merge.
