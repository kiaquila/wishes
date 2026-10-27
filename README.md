# wishes

Personal wishlist with a portfolio-style carousel and a grid of 3:2 photos. The wishes
include rose petal jam, hydrogel eye patches, a crane kimono in size M and an
embroidered velvet pouch. They also include AirPods 5 with the Wireless Charging
Case (the longer battery life version) and a white city bicycle with a basket
for a rider who is 172 cm tall. The page uses plain HTML, CSS and JavaScript with
locally hosted Manrope fonts matching the supplied KS Design reference.

```bash
npm run dev
```

Open `http://127.0.0.1:4173`. The view buttons switch layouts; carousel arrows,
left/right keyboard keys (when focused), and horizontal swipes select wishes.
The chosen layout is remembered in this browser. Edit `site/items.js` to add
wishes and put photographs in `site/assets/`.

Production is `https://wishes.ks-design.art`. Successful reviewed merges to
main deploy automatically after CI; see `docs/production.md` for the hosting,
deployment checks and recovery path.

The agent development harness was adapted from
`kiaquila/ks` at commit `3599591bf5d75d88e60a6e87d097e182f314a32e`.
No product assets, hosting configuration or production credentials were
imported from that repository.

The harness includes agent coordination rules, repository guardrails,
SHA-pinned CI, OSV dependency scanning, a current-head Codex Review gate,
CODEOWNERS, a PR template, and Dependabot version updates.

```bash
npm ci --ignore-scripts
npx --no-install playwright install --with-deps --only-shell chromium
npm run preflight
```

The browser regressions use the existing Node test runner with Playwright's
Chromium library. After building, run them separately with `npm run test:browser`.
They control real photo responses, start with fresh browser storage/cache, and
check the carousel and disclaimer at desktop, mobile and short-screen sizes.

See `AGENTS.md`, `docs/agent-development.md`, and `docs/security.md` for the
development workflow. Implementation mode builds and checks the wishlist,
tests the harness and compares delivery with the first measured site baseline.
