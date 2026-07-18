# webresu-proxy

Thin Netlify site that serves **webresu.me** — the public vanity domain for
portfolios published from irenes-ventures.com.

This site contains no application logic. Its only job is to rewrite
`webresu.me/u/{slug}` → `irenes-ventures.com/u/{slug}` (status 200, so the
browser URL stays `webresu.me`).

## Files

- `_redirects` — Netlify redirect rules (the only "code" in this repo).
- `netlify.toml` — build config (publish current folder, no build step).
- `404.html` — shown for any path other than `/u/*` on webresu.me.

## Deploying

1. Push this repo to GitHub (or drag-drop the folder in Netlify).
2. On Netlify: New site → connect this repo → base directory = `.`, publish
   directory = `.`, no build command.
3. Add `webresu.me` as the custom domain, follow Netlify's DNS instructions
   at your registrar (GoDaddy).
4. On the **main** site (irenes-ventures.com), set env var
   `PUBLISHED_SITES_HOST=webresu.me` and redeploy so new publishes emit
   webresu.me URLs.

## Local testing

There's nothing to run — the rewrites only happen on Netlify. If you edit
`_redirects`, push and let Netlify redeploy.
