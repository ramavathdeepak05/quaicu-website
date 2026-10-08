---
description: Weekly SEO run for quaicu.org. Report, one blog draft, LinkedIn drafts, checks, PR. Then publish after approval.
argument-hint: [report | draft | publish]   (no argument = full run up to the PR)
---

You are running QUAICU's weekly SEO pipeline. The brand rule applies to you: **AI proposes, rules enforce, humans approve.** You draft and check. The owner approves by merging a PR. You never merge, deploy to production, or post to LinkedIn yourself.

Argument: `$ARGUMENTS`
- empty: run steps 1 to 7 (stops at the PR).
- `report`: steps 1 and 2 only. Summarise; change nothing.
- `draft`: steps 3 to 7, using the latest report in `seo/reports/`.
- `publish`: step 8 only, after the owner has merged the PR.

Work from `C:\Workkkkk\quaicu-website`. Never print, save or commit a token. Do not run `wrangler deploy` (the owner runs it).

## 1. Preflight
- `git status`: must be clean on `main` (untracked `Claude outputs/` and `DESIGN.md` are fine). `git pull --ff-only origin main`.
- `npm install` if `node_modules/.bin/wrangler` is missing.
- Run `npm run seo:report` in step 2; if it says there are no usable Google credentials, show the owner the exact `! gcloud auth application-default login ...` line it prints and stop.

## 2. Report
- Run `npm run seo:report`. Read `seo/reports/<today>.md`, `seo/keywords.md`, `seo/topics.md`.
- Tell the owner, in under 15 lines: clicks and impressions versus last week; the 3 most useful opportunities; any URL not indexed that should be (ignore `/pricing`, which is intentionally `noindex`); any sitemap errors.

## 3. Pick ONE topic
Choose in this order and say which rule you used and why:
1. A query with real impressions that has no dedicated page, and that fits the brand (governed software, AI approval and audit, regulated sectors, India compliance, managed support).
2. The next `idea` row in `seo/keywords.md`.
3. A `refresh` row: rewrite the weakest published post's SEO title and description and add a useful section; set the `updated` field to now.
Never repeat a topic in `seo/topics.md`. Skip topics outside the brand even if they get traffic (the Gemini Spark post is an example: improve it, do not copy it).

## 4. Draft the blog post
Create branch `seo/weekly-YYYY-MM-DD`. Write `content/blog/<kebab-slug>.md`.

Front matter (match the existing posts exactly):
```
---
title: <under 70 chars, concrete, front-loads the keyword>
date: <now, +05:30>
description: "<60 to 160 chars, reads well out of context, contains the target phrase>"
seoDescription: "<50 to 160 chars>"
author: QUAICU
tags:
  - <1 to 3 tags from seo/tags.json only>
draft: false
---
```
Body rules:
- 700 to 1,100 words. Answer the question in the first two sentences. One argument, `##` headings only (the title is the H1).
- 2 or 3 internal links in the body, written as `[text](/path)`, to real pages (`/trust`, `/support`, `/builds`, `/how-it-works`, `/for/regulated-teams`, `/for/growing-businesses`, `/for/product-teams`, `/proof`, `/contact`). Do not link to `/pricing` while it is `noindex`.
- Use only facts that appear on the site's own pages or that you can state as general, well-known knowledge. **Never invent** statistics, customers, quotes, case studies, certifications or legal conclusions. If a claim needs a source or a lawyer, write `[VERIFY: what to confirm]` so `seo:check` fails until the owner resolves it.
- Affiliations: only Google for Startups, T-Hub, NVIDIA Inception and NASSCOM DeepTech (2026 cohort), phrased as on `company.html`.
- Tone from `DESIGN.md` and `BLOG.md`: authoritative, plain, no marketing fluff, no hype words, no em dashes.
- End with one sentence pointing to a relevant page or `/contact`. No long sign-off.
For a `refresh` topic, edit the existing post instead and keep its URL.

## 5. LinkedIn drafts
Write `seo/linkedin/YYYY-MM-DD.md` with three posts for the owner to paste. For each: **Voice** (company page, or a founder: Deepak Rathod or Xavier Borah), **Suggested time** (IST, Tuesday to Thursday mornings), the text, and a character count.
1. Post about the new blog post, with its full `https://quaicu.org/blog/<slug>/` URL.
2. Post that points at a core page (`/trust`, `/for/regulated-teams`, `/support`), different angle from post 1.
3. Insight post with **no link** (LinkedIn de-prioritises links): one clear idea from the same theme.
Rules: first line is a hook under 210 characters; each post under 1,300 characters; at most 3 hashtags; short paragraphs; same fact rules as the blog (nothing invented); no "excited to announce". Note that the blog URL is not live until the owner deploys.

## 6. Verify
- `npm run build`, then `npm run seo:check -- --strict content/blog/<slug>.md`.
- Fix every error and rerun until it passes. Report any warnings.
- Read the built post at `_site/blog/<slug>/index.html` for title, description, canonical and the related-pages block.

## 7. Open the PR, then stop
- Update `seo/keywords.md` (Status) and commit everything on the branch: `seo: weekly <topic> (YYYY-MM-DD)`, with the trailer `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- `git push -u origin <branch>` and `gh pr create --base main`. PR body: topic and why, report highlights, `seo:check` output, the three LinkedIn drafts, and a review checklist: facts correct, no claims to remove, tone, links, `[VERIFY]` resolved.
- Tell the owner the PR link and what to do next: review, merge, then run `/seo-weekly publish`. **Stop here.**

## 8. Publish (`/seo-weekly publish`, after the merge)
1. Confirm the PR is merged (`gh pr list --state merged --limit 3`). If not, stop.
2. `git checkout main && git pull --ff-only origin main`, `npm run build`, `npm run seo:check`.
3. Tell the owner to run the deploy themselves (the harness blocks production deploys from this session): `! npx wrangler deploy`. Wait until they say it is done.
4. Verify live: `curl` the new URL for 200, `<title>`, canonical, and that it is in `https://quaicu.org/sitemap.xml`.
5. Run `npm run seo:notify -- /blog/<slug>/` (IndexNow and sitemap re-submit), and report the status codes.
6. Append a row to `seo/topics.md` and set the keyword Status to `published`; commit to a small branch and open a PR (do not push to `main`).
7. Remind the owner to paste the LinkedIn drafts at the suggested times, and that Search Console "Request indexing" for the new URL is a manual click (https://search.google.com/search-console/inspect?resource_id=sc-domain:quaicu.org).

## Always
- If anything fails twice, stop and tell the owner what failed and what you tried.
- Keep the summary to the owner short: what you did, what needs their decision, what comes next.
