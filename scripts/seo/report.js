// Weekly Search Console report.
//   npm run seo:report
// Writes seo/reports/YYYY-MM-DD.md (and .json) and prints the markdown path.
// Search Console data lags about three days, so the windows end three days ago.

const fs = require("fs");
const path = require("path");
const g = require("./gsc");

const day = (offset) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return g.isoDate(d);
};

const pct = (n) => (n * 100).toFixed(1) + "%";
const pos = (n) => (n ? n.toFixed(1) : "-");
const rel = (u) => u.replace(g.ORIGIN, "") || "/";

function sum(rows) {
  return rows.reduce(
    (a, r) => ({ clicks: a.clicks + r.clicks, impressions: a.impressions + r.impressions }),
    { clicks: 0, impressions: 0 }
  );
}

function table(head, rows) {
  if (!rows.length) return "_None._\n";
  const line = (cells) => "| " + cells.join(" | ") + " |";
  return [line(head), line(head.map(() => "---")), ...rows.map(line)].join("\n") + "\n";
}

async function weekly(startDate, endDate) {
  const r = await g.searchAnalytics({ startDate, endDate, dimensions: ["date"], rowLimit: 100 });
  return r.rows || [];
}

(async () => {
  const end = day(-3);
  const curStart = day(-9);
  const prevEnd = day(-10);
  const prevStart = day(-16);
  const longStart = day(-30);

  const [cur, prev, qp, sitemaps] = await Promise.all([
    weekly(curStart, end),
    weekly(prevStart, prevEnd),
    g.searchAnalytics({ startDate: longStart, endDate: end, dimensions: ["query", "page"], rowLimit: 250 }),
    g.listSitemaps(),
  ]);

  const c = sum(cur);
  const p = sum(prev);
  const rows = qp.rows || [];

  // Queries, best page per query
  const byQuery = new Map();
  for (const r of rows) {
    const [query, page] = r.keys;
    const q = byQuery.get(query) || { query, clicks: 0, impressions: 0, best: null };
    q.clicks += r.clicks;
    q.impressions += r.impressions;
    if (!q.best || r.impressions > q.best.impressions) q.best = { page, position: r.position, impressions: r.impressions };
    byQuery.set(query, q);
  }
  const queries = [...byQuery.values()].sort((a, b) => b.impressions - a.impressions);

  const topQueries = queries.slice(0, 25).map((q) => [
    q.query,
    q.clicks,
    q.impressions,
    pos(q.best.position),
    rel(q.best.page),
  ]);
  const opportunities = queries
    .filter((q) => q.best.position >= 8 && q.best.position <= 30 && q.impressions >= 3)
    .slice(0, 15)
    .map((q) => [q.query, q.impressions, pos(q.best.position), rel(q.best.page)]);
  const homeLanding = queries
    .filter((q) => rel(q.best.page) === "/" && q.impressions >= 2)
    .slice(0, 15)
    .map((q) => [q.query, q.impressions, pos(q.best.position)]);

  // Pages
  const byPage = new Map();
  for (const r of rows) {
    const page = rel(r.keys[1]);
    const o = byPage.get(page) || { page, clicks: 0, impressions: 0 };
    o.clicks += r.clicks;
    o.impressions += r.impressions;
    byPage.set(page, o);
  }
  const lowCtr = [...byPage.values()]
    .filter((x) => x.impressions >= 10 && x.clicks / x.impressions < 0.01)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 10)
    .map((x) => [x.page, x.impressions, x.clicks, pct(x.clicks / x.impressions)]);

  // Index status of every sitemap URL
  const urls = await g.liveSitemapUrls();
  const inspected = new Array(urls.length);
  let next = 0;
  async function worker() {
    while (next < urls.length) {
      const i = next++;
      const u = urls[i];
      try {
        const r = (await g.inspectUrl(u)).inspectionResult || {};
        const s = r.indexStatusResult || {};
        inspected[i] = {
          url: u,
          verdict: s.verdict || "?",
          state: s.coverageState || "?",
          crawl: (s.lastCrawlTime || "").slice(0, 10),
        };
      } catch (e) {
        inspected[i] = { url: u, verdict: "ERROR", state: e.message.slice(0, 80), crawl: "" };
      }
    }
  }
  await Promise.all(Array.from({ length: 5 }, worker));
  const notIndexed = inspected.filter((i) => i.verdict !== "PASS");

  const sm = (sitemaps.sitemap || []).map((s) => [
    rel(s.path) === "/" ? s.path : s.path.replace(g.ORIGIN, ""),
    s.isPending ? "pending" : "processed",
    s.errors,
    s.warnings,
    ((s.contents || [])[0] || {}).submitted || "-",
    ((s.contents || [])[0] || {}).indexed || "-",
  ]);

  const today = g.isoDate(new Date());
  const delta = (a, b) => (b === 0 ? (a === 0 ? "0" : "new") : (a - b >= 0 ? "+" : "") + (a - b));
  const md = `# SEO report, ${today}

Window: ${curStart} to ${end} (Search Console data lags about 3 days). Previous: ${prevStart} to ${prevEnd}.

## This week
${table(
  ["", "This week", "Previous", "Change"],
  [
    ["Clicks", c.clicks, p.clicks, delta(c.clicks, p.clicks)],
    ["Impressions", c.impressions, p.impressions, delta(c.impressions, p.impressions)],
    ["CTR", c.impressions ? pct(c.clicks / c.impressions) : "-", p.impressions ? pct(p.clicks / p.impressions) : "-", ""],
  ]
)}
## Top queries (last 30 days)
${table(["Query", "Clicks", "Impressions", "Avg position", "Page"], topQueries)}
## Opportunities: ranking on page 2 to 3 (position 8 to 30)
${table(["Query", "Impressions", "Position", "Page"], opportunities)}
## Queries landing on the home page (candidates for a dedicated page or post)
${table(["Query", "Impressions", "Position"], homeLanding)}
## Pages with impressions but almost no clicks (title or description may be weak)
${table(["Page", "Impressions", "Clicks", "CTR"], lowCtr)}
## Sitemaps
${table(["Sitemap", "Status", "Errors", "Warnings", "Submitted", "Indexed"], sm)}
## Index status (${inspected.length} sitemap URLs)
${notIndexed.length ? table(["URL", "Verdict", "State", "Last crawl"], notIndexed.map((i) => [rel(i.url), i.verdict, i.state, i.crawl])) : "All sitemap URLs pass.\n"}
${rows.length === 0 ? "\n> No query data yet. The site is new, so expect this to fill in over the coming weeks.\n" : ""}`;

  const dir = path.join(g.ROOT, "seo", "reports");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, today + ".md"), md);
  fs.writeFileSync(
    path.join(dir, today + ".json"),
    JSON.stringify({ today, current: c, previous: p, queries: queries.slice(0, 100), inspected }, null, 1)
  );
  console.log("seo:report wrote seo/reports/" + today + ".md");
  console.log(
    `clicks ${c.clicks} (prev ${p.clicks}), impressions ${c.impressions} (prev ${p.impressions}), queries ${queries.length}, not-passing URLs ${notIndexed.length}`
  );
})().catch((e) => {
  console.error("seo:report failed: " + e.message);
  process.exit(1);
});
