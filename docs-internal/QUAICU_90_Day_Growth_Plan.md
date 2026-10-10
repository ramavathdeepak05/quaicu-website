# QUAICU 90-Day Growth Plan

## Context

quaicu.org is a polished static site (Eleventy, Cloudflare, GTM with consent mode) that does not generate pipeline. Evidence (Search Console report 2026-10-08, plus a code review):

- 8 clicks last week (16 the week before). The only meaningful query is the brand name ("quaicu", 41 clicks / 617 impressions).
- 0 of 21 sitemap URLs indexed. Most are "discovered / crawled, not indexed" or "unknown". `/partnerships`, `/council`, `/legal` are flagged as duplicates. One blog post returns 404.
- Blog: 4 posts, last on 2026-06-06. The top non-brand traffic (Gemini Spark) is off-brand and gets 0 clicks.
- No customer, case study, quote or measured outcome anywhere. The only real proof (ALIS live at Woxsen, per `docs-internal/QUAICU_Website_v2.md`) is not on the live pages.
- Two audiences mixed on one home page: an $85 per-ticket SME buyer and a regulated-governance buyer.
- One conversion path: "Talk to us" -> a generic 7-reason form (`contact.html`, Web3Forms). No calendar, no lead magnet, no CRM, no nurture. Pricing is not in the nav.
- No trust pack (DPA, security overview, SOC 2/ISO status, SLA, sample audit export).
- No distribution engine (LinkedIn cadence, directories, partner referrals, newsletter).

**Goal in 90 days:** make the site indexable, credible and convertible, and stand up a repeatable channel that sends qualified buyers to it.

GA4 access needs re-auth (`! gcloud auth application-default login`). Until then the baselines below come from Search Console only.

## Decisions needed before Day 1

| # | Decision | Recommendation |
|---|---|---|
| 1 | Lead ICP | Regulated teams (fintech, health, education, public sector) buying governed engineering. Keep `/for/growing-businesses` as a secondary page, not the home-page story. |
| 2 | Entry offer | "First ticket at the fixed price, reviewed by a named person" (Small ticket, $85 / Rs 5,000). Low-friction, proves the model. |
| 3 | Pricing visibility | Public. Add Pricing to the nav and remove the "keep `/pricing` out of links" note in `seo/keywords.md`. |
| 4 | Proof | Get written permission to name Woxsen / ALIS and publish one case study with numbers. If refused, publish an anonymised one. |
| 5 | AWS and Xplorepro logos | Confirm you are entitled to show them as ecosystem partners; remove if not. |
| 6 | Owners | Deepak: site, trust pack, content. Xavier: outbound, partners, directories, CRM. |

## Baseline and 90-day targets (targets are proposals; confirm after the GA4 baseline)

| Metric | Baseline | Day 30 | Day 60 | Day 90 |
|---|---|---|---|---|
| Sitemap URLs indexed | 0 / 21 | 15+ | 20+ | all |
| Non-brand clicks / week | ~0 | 5 | 20 | 50 |
| Contact-form starts / week | not tracked | tracked | 10 | 20 |
| Qualified leads / month | unknown | tracked | 4 | 10 |
| Discovery calls booked / month | 0 | 2 | 5 | 8 |
| Named proof assets live | 0 | 1 | 2 | 3 |

## Days 1-30: Fix what is broken (foundation)

1. **Indexing and canonicals** (Deepak)
   - Fix the three "Google chose different canonical" pages (`partnerships.html`, `council.html`, `legal.html`): check canonicals, `_redirects`, trailing-slash behaviour, `.html` vs clean URLs.
   - Fix the 404 post (`/blog/your-ai-copilot-cant-save-you-from-an-audit/`) or redirect it.
   - Resubmit `sitemap.njk` output in Search Console; request indexing for the top 10 pages.
   - Add internal links from the home page and footer to every page that is "discovered, not indexed".
2. **Focus the message** (Deepak)
   - Rewrite the `index.html` hero and sub-hero for the regulated-team ICP and one outcome. Move kernel jargon (Ring 0, HITL, ledger chips) below the fold or into `/proof` and `/trust`.
   - Replace the invented "18,432 proposed" demo numbers in the hero panel or label them clearly as illustrative.
3. **Pricing up front** (Deepak)
   - Add "Pricing" to the nav and footer in `assets/nav.js`. Make "See pricing" the secondary home-page CTA.
   - Add INR and USD toggle logic or a clear dual display on `pricing.html`.
4. **Replace the generic form** (Deepak, Xavier)
   - Add a booking link (Cal.com or Calendly) as the primary CTA. Keep a shorter form as the fallback. Split intent: "Book a call" vs "Send a message".
   - Fix error handling (`alert()` in `contact.html`) and add a real thank-you state with next steps.
5. **Measurement** (Deepak)
   - Extend `window.qTrack` in `assets/site.js`: `form_start`, `pricing_view`, `calendar_click`, `scroll_75`.
   - Mark `generate_lead` and `calendar_booked` as GA4 conversions. Re-auth GA4 and record the baseline.
   - Set up a CRM (HubSpot free or Notion/Airtable) and map the Web3Forms hidden fields (`landing_page`, `first_referrer`, `campaign`) into it.
6. **Proof asset #1** (Xavier, Deepak)
   - Draft the Woxsen / ALIS case study: problem, what shipped, numbers, quote. New page, linked from home, `/proof` and the nav.

## Days 31-60: Build trust (credibility)

7. **Trust centre** (Deepak)
   - Expand `trust.html` into a downloadable pack: security overview, DPA template, sub-processor list (already exists), data-flow diagram, incident-response summary, SLA, honest SOC 2 / ISO 27001 roadmap.
   - Add a sample redacted audit-ledger export as the key trust artefact.
8. **Region pages** (Deepak)
   - India: DPDP Act page for `/for/regulated-teams`. Mark any legal claim `[VERIFY]` and get a lawyer review.
   - EU: EU AI Act human-oversight page. Middle East: data-residency page. US: vendor-review-ready page.
   - Add a hreflang or region-aware pricing note only if the pages justify it.
9. **Gated asset** (Deepak, Xavier)
   - "AI change-approval checklist for regulated teams" (PDF). Email capture on a landing page, then a 4-email nurture sequence ending in the entry-offer CTA.
10. **Proof asset #2 and #3** (Xavier)
    - A second case study or a measured pilot result, plus 3 short testimonials or reference-call offers.
11. **Directories and profiles** (Xavier)
    - Clutch, GoodFirms, Google Business Profile (Hyderabad), LinkedIn company page refresh, Product Hunt-style listing where relevant.

## Days 61-90: Build distribution (pipeline)

12. **Content engine** (Deepak, `/seo-weekly`)
    - Publish 2-3 posts a month on topics in `seo/keywords.md`: "human approval for AI actions", "AI audit trail checklist", "non-bypassable AI governance", "DPDP compliance for software teams".
    - Refresh the Gemini Spark post: new title and description, plus a section linking to `/trust`. Do not publish more off-brand posts.
    - Each post ends with one CTA to the entry offer.
13. **Founder-led LinkedIn** (Deepak, Xavier)
    - Each founder posts weekly (case-study numbers, lessons from regulated deployments, a pricing-transparency post). Every post links to one site page with UTM tags so `qFirstTouch` captures the source.
14. **Outbound** (Xavier)
    - A list of 100 named regulated-team accounts. 3-touch sequence (email + LinkedIn) offering the entry ticket or a 30-minute governance review.
15. **Partner channel** (Xavier)
    - Turn `partnerships.html` into a referral programme page: advisory / compliance consultants, revenue share, one-page partner kit. Sign 3 pilot partners.
16. **Review and reset** (both)
    - Day-90 review against the KPI table. Cut what did not move the numbers and set the next quarter's priorities.

## Files likely touched

- `index.html`, `pricing.html`, `contact.html`, `trust.html`, `partnerships.html`, `for/regulated-teams.html`: message, CTAs, forms.
- `assets/nav.js`: nav and footer links.
- `assets/site.js`: `qTrack` events, attribution (reuse `qFirstTouch`).
- `_redirects`, `sitemap.njk`, `_data/staticPages.js`, `llms.txt`: canonicals, redirects, sitemap, AI-crawler summary.
- `seo/keywords.md`, `seo/topics.md`, `scripts/seo/*`: keyword ownership and weekly reports.
- `content/blog/`: new and refreshed posts.
- New: case-study page(s), a lead-magnet landing page, a trust-pack download folder.

## Weekly operating rhythm

- Monday: run `npm run seo:report`, review GA4 and CRM, pick the week's one SEO change.
- Mid-week: publish one asset (post, LinkedIn, or page).
- Friday: 30-minute funnel review (traffic -> form start -> booked -> qualified).

## Verification

- `npm run build` passes. Check `_site/` for the new pages and redirects.
- `npm run seo:check` shows no broken links, canonicals or missing meta.
- Search Console: URL Inspection on each fixed page; indexed count rises week over week.
- GTM preview / GA4 DebugView confirms `form_start`, `pricing_view`, `calendar_click`, `generate_lead` fire, and only after consent.
- Submit a test lead: it reaches the CRM with landing page, referrer and campaign populated.
- Day 30, 60, 90: compare the KPI table with the baseline and record the result at the end of this file.

## Results log

_Record the Day 30, Day 60 and Day 90 KPI comparisons here._
