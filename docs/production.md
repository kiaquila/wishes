# Wishes production

`https://wishes.ks-design.art` uses the same cz host and Cloudflare zone as
the KS portfolio. Nginx serves this static site from `/srv/wishes/current`.
Releases live in `/srv/wishes/releases/<full-sha>`; deployment changes the
current symlink atomically and restores it if the origin health check fails.
No build scripts execute as root. The built output is a byte-for-byte copy
of `site/`, so the server archives only that directory from trusted main.

## DNS and TLS

Cloudflare has a proxied A record named `wishes` pointing to `178.105.95.17`.
The origin uses its own Let's Encrypt certificate for `wishes.ks-design.art`,
with renewal through the existing Certbot webroot `/var/www/certbot`.
The edge redirects HTTP pages to HTTPS. Responses use `Cache-Control:
no-store` so later merges do not require a zone-wide cache purge or a new
Cloudflare API token. All fonts and images are served locally.

## Automatic deployment

`.github/workflows/production-deploy.yml` runs after the successful main-push
Project CI workflow, or by manual dispatch for recovery. Before production
credentials are released, the gate requires:

- Successful `validate` and `osv-scan` on the production SHA.
- An exact matching merged PR into main.
- Successful `validate`, `osv-scan` and `Codex Review` on that PR's reviewed head.
- No unresolved inline review threads, including later pages of the result.
- The production SHA is still the current main revision.

An ordinary PR run and a direct main push cannot publish the site. The
deployment job uses the existing Tailscale workload identity pattern with
`tag:ci`, then a separate wishes-only SSH key. The forced-command entrypoint
accepts only `deploy <full-sha>`: no shell, file upload or forwarding. A
root-owned wrapper fetches the private repository using a separate read-only
source key, checks current main again under a lock, rejects symlinks in the
static tree, and publishes an atomic release. Stale queued jobs fail safely.
The final check compares every live site's file with its reviewed source.
`/__revision` exposes only the deployed commit SHA for this check.

GitHub Environment `production` must allow the `main` deployment branch only:

| Kind | Name | Purpose |
| --- | --- | --- |
| Variable | `WISHES_SSH_HOST` | cz Tailnet host |
| Variable | `WISHES_SSH_KNOWN_HOSTS` | Pinned cz Ed25519 host key |
| Variable | `TAILSCALE_OAUTH_CLIENT_ID` | Existing workload identity client |
| Variable | `TAILSCALE_AUDIENCE` | Audience for that client |
| Secret | `WISHES_SSH_PRIVATE_KEY` | Deploy-only wishes key |

## One-time installation

Run the reviewed scripts on cz as an administrator, from a copy of the merged
`production/` directory. `install-access.sh source-key` creates the root-owned
source key if necessary and prints only its public half. Add it to
`kiaquila/wishes` as a read-only GitHub deploy key. The private source key stays
on cz, separate from the CI key.

Next, `install-access.sh <CI-public-key-file>` installs the restricted account,
root-owned wrapper and SSH entrypoint. Store the corresponding CI private key
in the production Environment secret without printing it.

After DNS exists and the merged main CI is green, run
`install-edge.sh <reviewed-main-sha>` to install the HTTP challenge vhost,
publish the static files, obtain the certificate using the existing Certbot
account, and install TLS. Nginx configuration is tested before each reload.
Refreshes retain existing TLS while obtaining a certificate and restore the
previous edge on failure. Then manually dispatch `Wishes Production Deploy`
to verify the complete automatic path.

The installer modifies only wishes-specific paths, an isolated account and
its narrow sudo command. Existing KS, dreamboard and Capsule Zero sites keep
their own vhosts and service configuration.

## Verification and recovery

Use `node scripts/verify-production.mjs <merged-main-sha>` from that revision.
It requires a matching live revision and SHA-256 equality for every static
file, not just a successful HTTP response. Chrome verifies both display modes
and the shop link on the public HTTPS URL.

For a failed deploy, fix the named prerequisite and rerun the workflow.
For a product rollback, revert the change in a reviewed PR and merge it through
the same checks; direct main pushes and old workflow revisions are rejected.
