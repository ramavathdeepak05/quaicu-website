// Hand-authored pages (served without .html) that the sitemap must include alongside the
// auto-generated blog. Update this list when you add or remove a page.
// lastmod comes from each file's last git commit; it is left out when git
// history is unavailable (e.g. a shallow clone that doesn't reach the file).
const { execSync } = require("child_process");

function lastmod(url) {
  const file = url === "/" ? "index.html" : url.slice(1) + ".html";
  try {
    const out = execSync(`git log -1 --format=%cs -- "${file}"`, {
      stdio: ["ignore", "pipe", "ignore"],
    }).toString().trim();
    return out || undefined;
  } catch (e) {
    return undefined;
  }
}

const pages = [
  { url: "/", changefreq: "weekly", priority: 1.0 },
  { url: "/how-it-works", changefreq: "monthly", priority: 0.9 },
  { url: "/proof", changefreq: "monthly", priority: 0.9 },
  { url: "/trust", changefreq: "monthly", priority: 0.8 },
  { url: "/builds", changefreq: "monthly", priority: 0.9 },
  { url: "/how-we-work", changefreq: "monthly", priority: 0.8 },
  { url: "/support", changefreq: "monthly", priority: 0.8 },
  { url: "/for/growing-businesses", changefreq: "monthly", priority: 0.8 },
  { url: "/for/product-teams", changefreq: "monthly", priority: 0.7 },
  { url: "/for/regulated-teams", changefreq: "monthly", priority: 0.7 },
  { url: "/company", changefreq: "monthly", priority: 0.7 },
  { url: "/partnerships", changefreq: "monthly", priority: 0.7 },
  { url: "/council", changefreq: "monthly", priority: 0.6 },
  { url: "/careers", changefreq: "weekly", priority: 0.6 },
  { url: "/contact", changefreq: "monthly", priority: 0.7 },
  { url: "/legal", changefreq: "yearly", priority: 0.3 },
];

module.exports = pages.map((p) => ({ ...p, lastmod: lastmod(p.url) }));
