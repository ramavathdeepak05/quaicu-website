// SEO guard rails. Run after a build:
//   npm run build && npm run seo:check
//   npm run seo:check -- --strict content/blog/new-post.md   (also apply the new-post rules)
//
// Errors fail the run (exit 1). Warnings are listed but do not fail it.

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const ROOT = path.join(__dirname, "..", "..");
const SITE = path.join(ROOT, "_site");
const POSTS = path.join(ROOT, "content", "blog");
const TAGS = JSON.parse(fs.readFileSync(path.join(ROOT, "seo", "tags.json"), "utf8"));

const args = process.argv.slice(2);
const strictFiles = [];
for (let i = 0; i < args.length; i++) if (args[i] === "--strict") strictFiles.push(path.resolve(ROOT, args[++i]));

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

// Things a post must not claim unless the site's own pages already do.
const BLOCKED_CLAIMS =
  /\b(Y Combinator|Techstars|Microsoft for Startups|AWS Activate|ISO ?27001|SOC ?2|HIPAA[- ]compliant|GDPR[- ]certified|guaranteed)\b/i;

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "admin" ? [] : htmlFiles(p);
    return e.name.endsWith(".html") ? [p] : [];
  });
}

function toUrlPath(file) {
  let rel = "/" + path.relative(SITE, file).split(path.sep).join("/");
  rel = rel.replace(/index\.html$/, "").replace(/\.html$/, "");
  return rel || "/";
}

function resolveLocal(href) {
  const clean = href.split("#")[0].split("?")[0];
  if (!clean || clean === "/") return path.join(SITE, "index.html");
  const rel = clean.replace(/^\//, "");
  const candidates = [rel, rel + ".html", path.join(rel, "index.html")];
  for (const c of candidates) {
    const p = path.join(SITE, c);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  return null;
}

const meta = (html, re) => (html.match(re) || [])[1];

// ---- 1. Built pages ----
if (!fs.existsSync(SITE)) {
  console.error("seo:check: _site not found. Run `npm run build` first.");
  process.exit(1);
}

const pages = htmlFiles(SITE);
const noindexPaths = new Set();
for (const file of pages) {
  const url = toUrlPath(file);
  if (url === "/404") continue;
  const html = fs.readFileSync(file, "utf8");
  const noindex = /<meta[^>]+name="robots"[^>]+noindex/i.test(html);
  if (noindex) noindexPaths.add(url);

  const title = meta(html, /<title>([^<]*)<\/title>/);
  const desc = (meta(html, /<meta\s+name="description"\s+content="([^"]*)"/) || "").replace(/\s+/g, " ").trim() || undefined;
  if (!title) err(url, "missing <title>");
  else if (title.length > 60) err(url, `title is ${title.length} chars (max 60): ${title}`);
  if (!desc) err(url, "missing meta description");
  else if (desc.length > 160) err(url, `description is ${desc.length} chars (max 160)`);
  if (!noindex) {
    if (!/<link rel="canonical" href="https:\/\/quaicu\.org[^"]*"/.test(html)) err(url, "missing canonical link");
    for (const p of ["og:title", "og:description", "og:image"])
      if (!html.includes(`property="${p}"`)) err(url, `missing ${p}`);
  }

  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1]);
    } catch (e) {
      err(url, "invalid JSON-LD: " + e.message);
    }
  }

  // Local links and images must exist
  const seen = new Set();
  for (const m of html.matchAll(/(?:href|src)="(\/[^"#?][^"]*|\/(?=["#?]))"/g)) {
    const ref = m[1];
    if (seen.has(ref) || ref.startsWith("//")) continue;
    seen.add(ref);
    if (!resolveLocal(ref)) err(url, `broken local reference ${ref}`);
  }
}

// ---- 2. Sitemap ----
const smFile = path.join(SITE, "sitemap.xml");
if (!fs.existsSync(smFile)) err("sitemap.xml", "not built");
else {
  const xml = fs.readFileSync(smFile, "utf8");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace("https://quaicu.org", "") || "/");
  if (new Set(locs).size !== locs.length) err("sitemap.xml", "duplicate URLs");
  for (const u of locs) {
    const norm = u.length > 1 ? u.replace(/\/$/, "") : u;
    if (!resolveLocal(u)) err("sitemap.xml", `lists a page that is not built: ${u}`);
    if (noindexPaths.has(u) || noindexPaths.has(norm) || noindexPaths.has(u.replace(/\/$/, "") + "/"))
      err("sitemap.xml", `lists a noindex page: ${u}`);
  }
  console.log(`sitemap: ${locs.length} URLs`);
}

// ---- 3. Blog posts ----
const posts = fs.readdirSync(POSTS).filter((f) => f.endsWith(".md"));
for (const f of posts) {
  const file = path.join(POSTS, f);
  const strict = strictFiles.includes(file);
  const where = "post " + f;
  const raw = fs.readFileSync(file, "utf8");
  const { data, content } = matter(raw);
  const bad = strict ? err : warn;

  for (const k of ["title", "date", "description", "author", "tags"]) if (!data[k] || (Array.isArray(data[k]) && !data[k].length)) bad(where, `front matter "${k}" is empty`);
  const eff = (data.seoDescription || data.description || "").replace(/\s+/g, " ");
  if (eff && (eff.length < 50 || eff.length > 160)) bad(where, `effective description is ${eff.length} chars (50 to 160)`);
  const seoTitle = data.seoTitle || data.title || "";
  if (seoTitle.length > 70) bad(where, `title is ${seoTitle.length} chars (keep under 70)`);

  for (const t of data.tags || []) if (!TAGS.allowed.includes(t)) bad(where, `tag "${t}" is not in seo/tags.json (add it there with a reason, or pick an existing one)`);

  const words = content.split(/\s+/).filter(Boolean).length;
  if (words < 600) bad(where, `only ${words} words (aim for 700 or more)`);
  const links = [...content.matchAll(/\]\((\/[^)\s]*)\)/g)].map((m) => m[1]);
  if (links.length < 2) bad(where, `only ${links.length} internal links (need 2 or more)`);
  for (const l of links) if (!resolveLocal(l)) err(where, `internal link points nowhere: ${l}`);

  if (/\[VERIFY[^\]]*\]|\bTODO\b|\bTBD\b|lorem ipsum/i.test(raw)) err(where, "unresolved [VERIFY], TODO or TBD");
  if (data.draft === true && strict) err(where, "draft is still true");
  const claim = content.match(BLOCKED_CLAIMS);
  if (claim) bad(where, `claim to confirm before publishing: "${claim[0]}"`);
  if (/[—–]/.test(content) && strict) warn(where, "contains em or en dashes; the house style avoids them");
}

// ---- Report ----
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log("  - " + w);
}
if (errors.length) {
  console.error(`\n${errors.length} error(s):`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log(`\nseo:check passed (${pages.length} pages, ${posts.length} posts, ${warnings.length} warnings)`);
