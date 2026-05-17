# QUAICU Notes — author guide

A practical guide for writing and publishing posts on `quaicu.org/blog/`.
This is for non-technical authors. You will not need to touch code or git.

---

## 1 · How to write a post

1. Make sure you have a **free GitHub account** (github.com/signup) and Deepak has added you as a collaborator on the website repo. (You only do this once.)
2. Go to **https://quaicu.org/admin/** in your browser.
3. Click **Login with GitHub** → authorize the popup. You're in.
4. Click **Blog Posts → New Post**.
5. Fill in the fields:
   - **Title** — keep under ~70 characters so it doesn't get truncated in Google results.
   - **Publish date** — when the post should appear.
   - **Summary** — 60–160 characters. This is also your meta description (what Google shows under your title in search results) and the lead paragraph at the top of the post. Make it count.
   - **Author** — your name, or "QUAICU" for institutional posts.
   - **Hero image** — optional. A wide image used as the post hero and the social-card preview. Best size: 1600×900 or wider.
   - **Tags** — free-form keywords (e.g., `field-notes`, `alis`, `governance`). Each tag becomes a filter page at `/blog/tags/<tag>/`.
   - **Draft** — keep this **on** while writing. **Untick to publish.**
   - **Body** — the post itself. Markdown editor with a live preview.
6. Hit **Save**. The post is saved as a draft.
7. When ready, **untick Draft**, hit **Save**, then **Publish → Publish now**.

In about 30 seconds Cloudflare rebuilds and the post is live at `quaicu.org/blog/<slug>/` (where `<slug>` is auto-generated from the title).

---

## 2 · Writing well for SEO

Five rules. Follow them and Google will reward you.

1. **One H1 per post.** Your title is the H1. Don't add another. Use `##` (H2) for section headings.
2. **Front-load the answer.** The first 2 sentences should make it clear what the reader will get. Don't bury the lead.
3. **Write the summary like a meta description.** It should make sense out of context. 60–160 chars. Include the post's core keyword naturally.
4. **Internal links.** When you mention another part of the site (e.g. the diagnostic, a product page), link to it. `[diagnostic](/diagnostic.html)`. This signals topic relevance to Google.
5. **Original is the only thing that ranks.** Re-published content from another blog/Medium will be down-ranked. Always publish here first.

---

## 3 · Markdown cheatsheet

The editor has a toolbar, but if you want to type directly:

```markdown
## A section heading

A normal paragraph. **Bold** and *italic* work as expected.

- bullet list
- another bullet

1. numbered list
2. another item

> A blockquote. Good for citing a customer or a regulation.

[Link text](https://target-url.com)

![Alt text](/uploads/blog/your-image.jpg)

`inline code` for tech terms.

```python
# fenced code blocks for snippets
def hello():
    return "world"
```
```

---

## 4 · Images

Upload images directly inside the editor (drag and drop, or click the image button). They land in `uploads/blog/` and you'll get the right Markdown automatically.

**Sizing.** Keep hero images under 500 KB. Use [Squoosh](https://squoosh.app) to compress.

**Alt text.** Always write alt text describing the image. It helps both SEO and accessibility.

---

## 5 · Tagging guide

Use 1–3 tags per post. Suggested tag taxonomy:

- **By kind**: `announcement`, `field-notes`, `how-to`, `research`, `case-study`
- **By product**: `alis`, `rico`, `fero`, `polo`, `lemo`, `ciro`
- **By sector**: `education`, `healthcare`, `hospitality`, `real-estate`, `legal`, `banking`
- **By theme**: `governance`, `dpdp`, `naac`, `accreditation`, `audit`, `policy`

Tags become URLs (e.g. `/blog/tags/alis/`), so use kebab-case (lowercase with hyphens). Don't invent new tags without a reason — Google likes tag pages that have multiple posts on them.

---

## 6 · Editorial workflow

Decap is set up with **editorial workflow**, meaning every post has three states:

- **Draft** — you're writing. Not visible anywhere.
- **In Review** — ready for a second pair of eyes. Visible to other CMS users.
- **Ready** — approved. Click **Publish now** to push it live.

Use this for posts that need legal or leadership review before going public.

---

## 7 · What happens after Publish

1. Decap commits your Markdown file to GitHub.
2. Cloudflare Pages detects the commit and rebuilds the site (~30 sec).
3. The post appears at `quaicu.org/blog/<slug>/`.
4. The sitemap, RSS feed, and `/blog/` index update automatically.
5. Google will discover the new post within 1–7 days. To speed this up, submit the sitemap once in [Google Search Console](https://search.google.com/search-console) — that's a one-time setup, the auto-rebuild handles updates after.

---

## 8 · Common mistakes to avoid

- **Headlines that are too clever.** "On the question of asymmetric institutional learning" loses to "What we shipped at Woxsen in Q2." Search engines and humans both prefer concrete.
- **Generic stock images.** They tank the social card. Use a real screenshot, a real photo, or skip the image.
- **Burying the takeaway.** If a reader scrolls and bounces in 8 seconds, Google notices.
- **Forgetting to untick Draft.** A post saved as a draft will not build. Always check the Draft checkbox before publishing.
- **Editing a live post repeatedly.** Each save = a rebuild = a sitemap update = signals to Google that the post is unstable. Make a draft branch first if it's a big rewrite.

---

## 9 · Local preview for technical authors

If you have the repo checked out and Node installed:

```sh
npm install        # one-time
npm run dev        # http://localhost:8080
ELEVENTY_INCLUDE_DRAFTS=1 npm run dev    # preview drafts too
```

You can write posts as Markdown files directly in `content/blog/*.md` and skip the CMS entirely. Same result.
