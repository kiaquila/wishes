# wishes

Personal wishlist with a portfolio-style carousel and square grid. The wishes
include rose petal jam, hydrogel eye patches, a crane kimono in size M and an
embroidered velvet pouch. The page uses plain HTML, CSS and JavaScript with
locally hosted Manrope fonts matching the supplied KS Design reference.

```bash
npm run dev
```

Open `http://127.0.0.1:4173`. The view buttons switch layouts; carousel arrows,
left/right keyboard keys (when focused), and horizontal swipes select wishes.
The chosen layout is remembered in this browser. Edit `site/items.js` to add
wishes and put photographs in `site/assets/`.

The agent development harness was adapted from
`kiaquila/ks` at commit `3599591bf5d75d88e60a6e87d097e182f314a32e`.
No product assets, hosting configuration or production credentials were
imported from that repository.

The harness includes agent coordination rules, repository guardrails,
SHA-pinned CI, OSV dependency scanning, a current-head Codex Review gate,
CODEOWNERS, a PR template, and Dependabot version updates.

```bash
npm ci --ignore-scripts
npm run preflight
```

See `AGENTS.md`, `docs/agent-development.md`, and `docs/security.md` for the
development workflow. Implementation mode builds and checks the wishlist,
tests the harness and compares delivery with the first measured site baseline.
