# Deploy guide — one-time setup

This walks you through getting `quaicu.org` and the new `/blog/` live on Netlify, with Decap CMS accessible at `/admin/` for non-technical authors.

You only do this once. After that, every git push (or every CMS "Publish") deploys automatically.

---

## Prerequisites you'll need accounts for

- **GitHub** — free. https://github.com/signup
- **Netlify** — free. https://app.netlify.com/signup (sign up with your GitHub account so they're linked)

---

## Step 1 · Push the site to GitHub

From the project directory:

```sh
# initialize the repo
git init
git add .
git commit -m "Initial commit: brutalist static site + Eleventy blog"
git branch -M main
```

Then create the GitHub repo:

1. Go to https://github.com/new
2. Name it `quaicu-website` (or whatever you prefer)
3. **Keep it private** if you don't want competitors reading your post drafts before they ship
4. **Do not** initialize with README/license/.gitignore — we have those already
5. Hit **Create repository**

Copy the `git remote add` command GitHub shows you. It will look like:

```sh
git remote add origin https://github.com/<your-username>/quaicu-website.git
git push -u origin main
```

Run it. The full site is now on GitHub.

---

## Step 2 · Connect Netlify to the repo

1. Go to https://app.netlify.com → **Add new site → Import an existing project**.
2. Pick **GitHub**, authorize Netlify, choose the `quaicu-website` repo.
3. Netlify reads `netlify.toml` and auto-fills:
   - **Build command:** `npm run build`
   - **Publish directory:** `_site`
4. Hit **Deploy site**.

In about 60 seconds you'll get a URL like `https://shimmering-pixie-abc123.netlify.app/`. Click it. The whole site, including `/blog/`, should be live.

---

## Step 3 · Point quaicu.org at Netlify

In Netlify: **Site settings → Domain management → Add a domain → `quaicu.org`**.

Netlify will show you two DNS records to add at your domain registrar (where you bought `quaicu.org`):

- An `A` record pointing the root domain to Netlify's load balancer
- A `CNAME` for `www`

Add them at your registrar. DNS propagation takes 15 min to a few hours. Netlify will auto-issue an SSL certificate (Let's Encrypt) once DNS resolves — wait for the green padlock in their dashboard.

---

## Step 4 · Enable Netlify Identity (required for the CMS)

Decap CMS uses **Netlify Identity** to authenticate authors. Without this step, `/admin/` will not work.

1. In Netlify: **Site → Identity → Enable Identity**.
2. **Registration preferences → set to "Invite only"**. (Otherwise the public can sign up to write blog posts. Don't.)
3. **Identity → Services → Git Gateway → Enable Git Gateway**. This lets the CMS commit posts to GitHub on behalf of authors, without giving them your GitHub credentials.

---

## Step 5 · Invite yourself + teammates as authors

1. **Identity → Invite users** → enter your email, hit invite.
2. Check your email for the invite link, click it, set a password.
3. You can now log in at `https://quaicu.org/admin/`.
4. Repeat for each teammate who should be able to write posts.

Invited users only get access to the CMS. They cannot edit the website's code or any other GitHub content.

---

## Step 6 · Verify the CMS works

1. Visit `https://quaicu.org/admin/`.
2. Log in.
3. You should see the Decap CMS UI with **Blog Posts** in the sidebar.
4. Click **New Post**, fill the title and body, untick **Draft**, hit **Publish**.
5. Wait ~30 seconds. Visit `https://quaicu.org/blog/` and your post should be there.

If the CMS UI loads but login fails — double-check Step 4 (Identity and Git Gateway both enabled).

---

## Step 7 · One-time SEO setup

1. **Google Search Console** — https://search.google.com/search-console
   - Add property `quaicu.org`
   - Verify ownership (Netlify has a DNS TXT record verification option, or use the HTML file method)
   - **Sitemaps → Add new sitemap → `sitemap.xml`** → Submit
   - Google starts crawling within a few days

2. **Bing Webmaster Tools** — https://www.bing.com/webmasters
   - Add `quaicu.org`, verify, submit `sitemap.xml`
   - 5% of search traffic but very cheap to set up

3. **LinkedIn/X preview check** — paste a post URL into:
   - https://www.linkedin.com/post-inspector/
   - https://cards-dev.twitter.com/validator
   - Confirm the OG image, title, description preview correctly.

---

## Step 8 · Set up the production domain in `_data/site.js`

Once `quaicu.org` resolves to the new site, double-check `_data/site.js` has:

```js
url: "https://quaicu.org",
```

This is what canonical URLs, OG tags, the sitemap, and the RSS feed all use. If you ever change domains, this is the only line you have to update.

---

## Day-to-day after launch

You don't touch any of this again. The flow becomes:

- **Author writes a post** → `/admin/` → Publish → live in 30 sec.
- **Developer edits the site** → `git push` → live in 30 sec.

That's the whole loop.

---

## Troubleshooting

**The Netlify build fails with "node version not found".**
Check that `netlify.toml` sets `NODE_VERSION = "20"` (it does, by default).

**The CMS login spinner just spins.**
Identity widget hasn't loaded. Check that `admin/index.html` and the Netlify Identity script are both present in the deployed `_site/admin/`. Re-deploy if you renamed anything.

**Posts I publish in the CMS don't appear on the site.**
1. Did you untick the **Draft** checkbox? Drafts don't build.
2. Did the Netlify build succeed? Check **Deploys** in the Netlify dashboard.

**A non-author can sign up at `/admin/`.**
Go back to **Identity → Registration → Invite only**. Then delete any unauthorized users in **Identity → Users**.

**Build is slow.**
Eleventy rebuilds the whole site on every change. ~3 sec for a few dozen posts is normal. If it gets to 30+ sec, time to add incremental builds — not yet needed.
