# Deploy guide — Cloudflare Pages + Decap CMS

The static site is already live on Cloudflare Pages, auto-deploying from `main`. The remaining work is one-time CMS setup:

1. Create a GitHub OAuth App (so authors can log into `/admin/` with GitHub).
2. Deploy the OAuth Worker (`workers/decap-oauth/`).
3. Wire the Worker URL + your repo into `admin/config.yml`.
4. Invite collaborators (your future post authors).

End-to-end this is ~20 minutes. After that, every CMS publish auto-deploys.

---

## Step 1 · Create a GitHub OAuth App

1. Go to https://github.com/settings/developers → **OAuth Apps → New OAuth App**.
2. Fill in:
   - **Application name:** `QUAICU CMS`
   - **Homepage URL:** `https://quaicu.org`
   - **Authorization callback URL:** *leave blank for now — you'll set it in step 2 after the Worker is deployed.*
3. Hit **Register application**. You'll land on the app's page.
4. **Copy the Client ID.** Click **Generate a new client secret** and **copy that immediately** — GitHub shows it only once.

Keep both values handy for Step 2.

---

## Step 2 · Deploy the OAuth Worker

You need [Wrangler](https://developers.cloudflare.com/workers/wrangler/) installed (`npm install -g wrangler` or use `npx wrangler`).

```sh
cd workers/decap-oauth
npm install
wrangler login                              # one-time browser login
wrangler secret put GITHUB_CLIENT_ID        # paste the Client ID from Step 1
wrangler secret put GITHUB_CLIENT_SECRET    # paste the Client Secret from Step 1
wrangler deploy
```

Wrangler prints the deployed URL, e.g.:

```
Published quaicu-cms-oauth
  https://quaicu-cms-oauth.YOUR-CF-SUBDOMAIN.workers.dev
```

**Copy that URL.**

Now go back to the GitHub OAuth App you created in Step 1 and set:

- **Authorization callback URL:** `https://quaicu-cms-oauth.YOUR-CF-SUBDOMAIN.workers.dev/callback`

Save.

---

## Step 3 · Point Decap CMS at the Worker

Open `admin/config.yml` in your editor. Update the `backend` block:

```yaml
backend:
  name: github
  repo: ramavathdeepak05/quaicu-website
  branch: main
  base_url: https://quaicu-cms-oauth.YOUR-CF-SUBDOMAIN.workers.dev
  auth_endpoint: auth
```

Commit and push:

```sh
git add admin/config.yml
git commit -m "Wire Decap CMS to OAuth Worker"
git push
```

Cloudflare Pages auto-rebuilds (~30 sec). The CMS is now reachable at `quaicu.org/admin/`.

---

## Step 4 · Verify the CMS works

1. Visit `https://quaicu.org/admin/`.
2. Click **Login with GitHub** → popup opens → log in on github.com → popup closes → you're in.
3. You should see the Decap UI with **Blog Posts** in the sidebar.
4. Click **New Post**, fill in title and body, untick **Draft**, hit **Publish → Publish now**.
5. Within ~30 seconds the post appears at `https://quaicu.org/blog/<slug>/`.

If login fails:
- **"App not approved"** → the OAuth callback URL doesn't match Step 2. Edit the OAuth App and confirm it points to `/callback` on the Worker URL.
- **"Origin not allowed"** → check `workers/decap-oauth/wrangler.toml` → `ALLOWED_ORIGIN` is set to `https://quaicu.org`.
- **Login succeeds but Decap shows "Failed to load"** → your GitHub account is not a collaborator on the repo. See Step 5.

---

## Step 5 · Invite collaborators (future authors)

Each person who needs to write posts must:

1. Have a free GitHub account (github.com/signup).
2. Be added to your repo as a collaborator — at minimum **Write** access.

To invite:

1. Go to `https://github.com/ramavathdeepak05/quaicu-website/settings/access`.
2. **Add people** → enter their GitHub username or email → **Write** role.
3. They receive an email — they accept.
4. They can now log into `quaicu.org/admin/` with GitHub.

Don't add anyone you wouldn't trust with the repo — collaborators technically have write access to all files, not just the blog. For external guest writers, the better pattern is to have them email you a Markdown file and you publish on their behalf.

---

## Step 6 · One-time SEO setup

1. **Google Search Console** — https://search.google.com/search-console
   - Add property `quaicu.org` (verify ownership via DNS TXT on Cloudflare, or upload the HTML file)
   - **Sitemaps → Add new sitemap → `sitemap.xml`** → Submit
   - Google starts crawling within a few days

2. **Bing Webmaster Tools** — https://www.bing.com/webmasters
   - Add `quaicu.org`, verify, submit `sitemap.xml`

3. **Preview check** — paste a post URL into:
   - https://www.linkedin.com/post-inspector/
   - https://cards-dev.twitter.com/validator
   - Confirms OG image, title, description render correctly when shared.

---

## Step 7 · Confirm `_data/site.js` matches your domain

Open `_data/site.js`. The first line should be:

```js
url: "https://quaicu.org",
```

This drives canonical URLs, OG tags, the sitemap, and the RSS feed. If you ever change domains, this is the only line you have to update.

---

## Day-to-day after launch

You don't touch any of this again. The flow becomes:

- **Author writes a post** → `quaicu.org/admin/` → Publish → live in 30 sec.
- **Developer edits the site** → `git push` → live in 30 sec.

---

## Troubleshooting

**`wrangler deploy` says "no account"**
Run `wrangler login` first. It opens a browser, you authorize, done.

**The Worker deploys but `https://…workers.dev/health` returns 522**
DNS propagation lag — wait 60 seconds and retry.

**CMS publishes but Cloudflare Pages doesn't rebuild**
Check Cloudflare Pages → your project → **Settings → Builds & deployments → Production branch** is set to `main`. The CMS commits to `main`, so it must match.

**The CMS UI loads but I see "Config errors"**
You forgot to update `repo:` and/or `base_url:` in `admin/config.yml` — they still contain the placeholder values from the template.

**A non-author can sign up at /admin/**
GitHub OAuth grants access to anyone with a GitHub account, BUT Decap will reject any user who is not a repo collaborator. So the perimeter is the GitHub collaborator list — keep that tight.

**I want to test changes to the OAuth Worker locally**
```sh
cd workers/decap-oauth
wrangler dev      # serves on http://localhost:8787
```
Temporarily change `admin/config.yml` → `base_url: http://localhost:8787` and run `npm run dev` for the site. Don't commit that change.

**I want to rotate the GitHub client secret**
Regenerate it in the GitHub OAuth App settings, then:
```sh
cd workers/decap-oauth
wrangler secret put GITHUB_CLIENT_SECRET
```
Paste the new value. No redeploy needed.
