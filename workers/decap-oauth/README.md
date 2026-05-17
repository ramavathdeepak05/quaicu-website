# quaicu-cms-oauth

Tiny Cloudflare Worker that brokers GitHub OAuth for the Decap CMS instance at `quaicu.org/admin/`.

## What it does

Decap CMS in the browser can't talk to GitHub's OAuth endpoints directly because the token exchange requires the OAuth App's client secret. This Worker stands in:

1. Decap pops up `/auth` → Worker 302s to GitHub's authorize URL.
2. User logs in on github.com.
3. GitHub redirects to `/callback?code=…` → Worker exchanges the code for an access token.
4. Worker returns an HTML page that `postMessage`s the token back to the parent (Decap) window.

That's it. ~120 lines. No persistent storage. No state beyond the OAuth handshake.

## Deploy

```sh
npm install
wrangler login                                # one-time
wrangler secret put GITHUB_CLIENT_ID          # paste your OAuth App's client ID
wrangler secret put GITHUB_CLIENT_SECRET      # paste the secret
npm run deploy                                # publishes to *.workers.dev
```

After `wrangler deploy` prints the Worker URL, update `admin/config.yml` in the site repo:

```yaml
backend:
  name: github
  base_url: https://quaicu-cms-oauth.YOUR-CF-SUBDOMAIN.workers.dev
  auth_endpoint: auth
```

Commit, push — Cloudflare Pages rebuilds and the CMS login flow is live.

## Local dev

```sh
wrangler dev          # serves on http://localhost:8787
```

In Decap's `config.yml` set `base_url: http://localhost:8787` to test against local Decap.

## Allowed origins

Hardcoded in `wrangler.toml` → `[vars] ALLOWED_ORIGIN`. Defaults to `https://quaicu.org`. Cloudflare Pages preview URLs (`*.pages.dev`) are also allowed. If you ever serve admin from a different origin, add it to the check in `src/index.js → isOriginAllowed`.
